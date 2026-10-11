// CCNA · Module 2 — Ethernet switching & ARP (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "Ethernet LAN switching: MAC learning, frames, unicast & broadcast".
(function(){
const L = [];

// ---------- Module 2 · Lesson 1 ----------
L.push({
id:"sw-mac", mins:60, level:"Beginner · builds on Module 1",
t:"MAC addresses and Ethernet frames up close",
html:`
${K.goals([
  "Explain why Ethernet needs its own Layer 2 address when every device already has an IP.",
  "Read a MAC in Windows, Linux or Cisco format and convert between them.",
  "Split a MAC into OUI and device part, look up the vendor, and read the I/G and U/L bits to spot multicast and randomised addresses.",
  "Tell unicast, broadcast and multicast apart, and explain how a NIC accepts or ignores a frame (and what promiscuous mode changes).",
  "Find any device's or switch port's MAC with ipconfig /all, getmac, ip link, show interfaces and show mac address-table, and trace an unknown device to its port.",
])}
${K.pre(["Module 1, especially lesson 1 (MAC vs IP), lesson 6 (encapsulation and the Ethernet frame fields) and lesson 8 (your first IOS session: console, modes, show commands). Hex digits 0–F."])}

<h2>Why this matters at work</h2>
<p>A Tuesday morning at a bank branch in Victoria Island, Lagos. The security team forwards you an alert: <i>"Unknown device on the teller VLAN. Hostname raspberrypi. Investigate today."</i> All you have is one line from the DHCP server: an IP address, a hostname anyone can fake, and a string of twelve hex digits.</p>
<p>Those twelve digits are enough. They say who made the card, whether the address is real or invented by software, and — with two switch commands — which wall socket the device is in. In Module 1 you met the MAC as "the hardware address". This lesson takes it apart bit by bit, because everything a switch does in this module is built on it.</p>

<h2>Why Layer 2 needs its own addresses</h2>
<p>Every device already has an IP address, so why a second one? Four reasons:</p>
<ol>
<li><b>Devices talk before they have an IP.</b> A booting laptop has no IP yet, so it broadcasts a DHCP request for one. The reply must still reach the right laptop, and at that moment its only identity is its MAC.</li>
<li><b>Ethernet carries more than IPv4.</b> The same cable carries IPv4, IPv6, ARP and switch protocols (the Type values <code>0x0800</code>, <code>0x86DD</code>, <code>0x0806</code> from Module 1 lesson 6). An address that belongs to the card, not to one protocol, serves them all.</li>
<li><b>Switches forward in hardware on a simple fixed field.</b> A MAC is always 48 bits in the same place in the frame, so switch chips look it up in nanoseconds without understanding IP. That is why an unmanaged switch works out of the box.</li>
<li><b>Layers stay independent.</b> Renumber IP and the switches don't care.</li>
</ol>
<p>So the addresses split the job. The ${K.g("IP address","Layer 3 logical address assigned by the network. Hierarchical, so routers can find it. Stays the same end to end.")} says <i>where the device is</i> in the whole internetwork. The ${K.g("MAC address","Media Access Control address: a 48-bit Layer 2 address on an interface, written as 12 hex digits. Delivers frames within one local network.")} says <i>which card on this local network</i> takes the frame next. ARP links the two ("which MAC has this IP?") — that's lesson 4.</p>
${K.analogy(`<p>A parcel crossing Lagos keeps the same address on its label (the IP): <i>12 Akin Adesola Street</i>. But each van driver gets an instruction for one leg only: <i>"hand it to Gate 3 at the Ikeja depot"</i>, then <i>"hand it to reception at Akin Adesola"</i>. That per-leg instruction is the MAC address, rewritten for every leg.</p>`)}
<p>One more difference: IP addresses are <b>hierarchical</b> — <code>192.168.10.0/24</code> groups hundreds of hosts under one route. MAC addresses are <b>flat</b>: <code>3c52.821a.7f09</code> says nothing about where the device is. A switch can remember every MAC in a building; no router could remember billions. Flat for the local hop, hierarchical for the journey.</p>
${K.check({q:"A laptop has just powered on and has no IP address yet. It sends a DHCP request. How does the DHCP server's reply get back to that one laptop on the LAN?", o:["By the laptop's IP address","By the laptop's MAC address, which it has from the moment the card powers on","By the laptop's hostname","It can't — the laptop must be given an IP address by hand first"], a:1, why:"Before DHCP finishes, the only identity the laptop has on the network is the MAC address of its network card. DHCP messages carry it, and switches deliver the frames by it. This is one of the main reasons Layer 2 has its own addressing."})}

<h2>Reading a MAC address: hex and the three formats</h2>
<p>A MAC address is <b>48 bits</b> long — six ${K.g("bytes","8 bits (also called an octet), written as two hex digits, 00 to FF.")}. Nobody writes 48 ones and zeros, so we write it in ${K.g("hexadecimal","Base 16: digits 0–9 then A–F (A=10 … F=15). One hex digit = 4 bits; two = one byte.")}. One hex digit stands for exactly 4 bits, so 48 bits become <b>12 hex digits</b>.</p>
<div class="tablewrap"><table>
<tr><th>Hex</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr>
<tr><th>Bits</th><td>0000</td><td>0001</td><td>0010</td><td>0011</td><td>0100</td><td>0101</td><td>0110</td><td>0111</td></tr>
<tr><th>Hex</th><td>8</td><td>9</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td></tr>
<tr><th>Bits</th><td>1000</td><td>1001</td><td>1010</td><td>1011</td><td>1100</td><td>1101</td><td>1110</td><td>1111</td></tr>
</table></div>
<p>You'll use that table in the next section, where reading a MAC's special bits means turning one hex digit into four bits.</p>
<h3>Same address, three spellings</h3>
<p>Different systems write the <i>same</i> 12 digits differently. The bits are identical; only punctuation and letter case change.</p>
<div class="tablewrap"><table>
<tr><th>Where you see it</th><th>Format</th><th>Example</th></tr>
<tr><td>Windows (<code>ipconfig /all</code>, <code>getmac</code>)</td><td>6 pairs, hyphens, upper case</td><td><code>3C-52-82-1A-7F-09</code></td></tr>
<tr><td>Linux, macOS, Wireshark, most Wi-Fi controllers</td><td>6 pairs, colons, lower case</td><td><code>3c:52:82:1a:7f:09</code></td></tr>
<tr><td>Cisco IOS (<code>show mac address-table</code>, <code>show interfaces</code>)</td><td>3 groups of 4, dots, lower case</td><td><code>3c52.821a.7f09</code></td></tr>
</table></div>
<p><code>3C</code> and <code>3c</code> are the same byte. At work you'll copy a MAC from a Windows PC, paste it into a Cisco switch and compare it with a Wireshark capture in the same five minutes, so convert like this:</p>
${K.steps([
  ["Strip the punctuation", `<p><code>3C-52-82-1A-7F-09</code> becomes <code>3C52821A7F09</code>. Count: exactly <b>12</b> digits. A missing digit is the most common mistake.</p>`],
  ["Lower-case it", `<p><code>3c52821a7f09</code> — Cisco and Linux display lower case, so comparing is easier.</p>`],
  ["Regroup for the target", `<p><b>Cisco:</b> <code>3c52.821a.7f09</code> (three groups of four). <b>Linux:</b> <code>3c:52:82:1a:7f:09</code>. <b>Windows:</b> <code>3C-52-82-1A-7F-09</code>.</p>`],
  ["Read it back in pairs", `<p>3c · 52 · 82 · 1a · 7f · 09 — Cisco's dots fall after every <i>second</i> pair. Same pairs, same order: correct.</p>`],
])}
${K.mistake(`Typing a MAC in Windows format into a Cisco command. <code>show mac address-table address 3C-52-82-1A-7F-09</code> is rejected with <code>% Invalid input detected at '^' marker.</code> IOS only accepts the dotted <code>3c52.821a.7f09</code> form in commands, even though it doesn't mind upper or lower case.`)}
${K.q({type:"fill", q:"Convert these MAC addresses between formats.", fields:[
  {label:"Linux 00:50:56:a3:1b:2c → Cisco format", a:["0050.56a3.1b2c"]},
  {label:"Cisco dca6.324f.1b9e → Windows format", a:["DC-A6-32-4F-1B-9E","dc-a6-32-4f-1b-9e"]},
  {label:"Windows DA-4F-3B-10-77-E2 → Linux format", a:["da:4f:3b:10:77:e2","DA:4F:3B:10:77:E2"]}],
  why:"Strip the separators to get 12 hex digits, then regroup: Cisco uses three groups of four with dots, Windows six pairs with hyphens, Linux six pairs with colons. The bits never change, only the punctuation and the letter case."})}
${K.check({q:"Which of these is NOT a valid way of writing a MAC address?", o:["0050.56a3.1b2c","00:50:56:a3:1b:2c","00-50-56-A3-1B-2C","0050.56a3.1b2"], a:3, why:"A MAC address always has exactly 12 hex digits. The last option has only 11, so it is a typo, not a MAC. The first three are the Cisco, Linux and Windows spellings of the same address."})}

<h2>Inside the 48 bits: OUI, device part, and two special bits</h2>
<p>A MAC address has a structure, and that structure answers "who made this?" and "is this real?" at a glance.</p>
<h3>The two halves</h3>
<p>The first 24 bits (6 hex digits) are the ${K.g("OUI","Organizationally Unique Identifier: the first 24 bits of a factory MAC, bought by a manufacturer from the IEEE. Identifies the vendor.")}, the <b>Organizationally Unique Identifier</b>, which a manufacturer buys from the ${K.g("IEEE","The standards body behind Ethernet (802.3) and Wi-Fi (802.11). Its Registration Authority sells OUIs.")}. The last 24 bits are the <b>device-specific part</b> (the NIC-specific part): the manufacturer numbers each card without repeating a number inside that OUI. That's 2<sup>24</sup> = 16,777,216 addresses per OUI; big vendors such as Cisco, Intel and Apple own many OUIs.</p>
${K.svg("0 0 740 330",
  K.txt(370,22,"3c52.821a.7f09  =  3C-52-82-1A-7F-09",{mid:true,c:"fg",b:true,s:13})+
  ["3C","52","82","1A","7F","09"].map((h,i)=>K.box(40+i*112,38,100,40,h,"byte "+(i+1),i===0)).join("")+
  K.band(40,88,324,24,"OUI — first 24 bits — the manufacturer","var(--chip)")+
  K.band(376,88,324,24,"device-specific — last 24 bits — the card","var(--panel2)")+
  K.arrow(90,80,90,135,"",true)+
  K.txt(370,150,"Zoom into byte 1: 0x3C = 0011 1100",{mid:true,c:"fg",b:true,s:12})+
  ["0","0","1","1","1","1","0","0"].map((b,i)=>K.box(150+i*56,162,48,40,b,"b"+(7-i),i>=6)).join("")+
  K.txt(504,232,"U/L bit (b1)",{end:true,c:"accent",b:true})+
  K.txt(572,232,"I/G bit (b0)",{c:"accent",b:true})+
  K.arrow(510,222,510,206,"",true)+K.arrow(566,222,566,206,"",true)+
  K.txt(40,272,"I/G (bit 0):  0 = individual (unicast)      1 = group (multicast / broadcast)",{c:"fg",s:11.5})+
  K.txt(40,292,"U/L (bit 1):  0 = universally administered (real OUI, set at the factory)",{c:"fg",s:11.5})+
  K.txt(40,310,"               1 = locally administered (set by software or an admin: random MACs, VMs)",{c:"fg",s:11.5}),
  "Anatomy of a MAC address: the OUI names the maker; two bits of the first byte flag group and locally set addresses.")}
<h3>Looking up a vendor</h3>
<p>OUIs are public. The IEEE publishes the list (search "IEEE OUI lookup"), and Wireshark has it built in, showing <code>Cisco_3a:00:01</code> instead of <code>00:00:0c:3a:00:01</code>. A few worth recognising on sight:</p>
<div class="tablewrap"><table>
<tr><th>OUI</th><th>Registered to</th><th>What it usually means on your network</th></tr>
<tr><td><code>00-00-0C</code></td><td>Cisco</td><td>Cisco's original OUI: a switch, router or phone (Cisco owns many more)</td></tr>
<tr><td><code>00-50-56</code></td><td>VMware</td><td>A virtual machine, not a physical box</td></tr>
<tr><td><code>08-00-27</code></td><td>PCS Systemtechnik (VirtualBox's default range)</td><td>A VirtualBox VM, often a lab on a work laptop</td></tr>
<tr><td><code>00-15-5D</code></td><td>Microsoft</td><td>A Hyper-V VM</td></tr>
<tr><td><code>B8-27-EB</code>, <code>DC-A6-32</code></td><td>Raspberry Pi</td><td>A sensor or display — or a rogue device</td></tr>
</table></div>
<h3>The I/G bit: one card, or a group?</h3>
<p>The lowest bit of the <b>first</b> byte (bit 0 in the diagram) is the ${K.g("I/G bit","Individual/Group bit: lowest bit of the first byte. 0 = unicast; 1 = group (multicast or broadcast).")}. <b>0 = individual</b>: one interface, a <b>unicast</b> address. <b>1 = group</b>: many receivers, a <b>multicast</b> address (or broadcast, which is all ones). Every network card's own MAC is unicast, so a frame's <i>source</i> is always unicast; only the <i>destination</i> can be a group.</p>
<h3>The U/L bit: set at the factory, or by software?</h3>
<p>The next bit up (bit 1) is the ${K.g("U/L bit","Universal/Local bit: second-lowest bit of the first byte. 0 = factory address with a real OUI; 1 = locally administered (set by software or an admin).")}. <b>0 = universally administered</b>: a real OUI from the manufacturer, which you can look up. <b>1 = locally administered</b>: the operating system, a hypervisor or an administrator chose it, so no OUI lookup will find it.</p>
<h3>The fast way: read the second hex digit</h3>
<p>Both bits live in the <b>second hex digit</b> (the low half of the first byte), so you never need the binary:</p>
<ul>
<li>Second digit <b>odd</b> (1, 3, 5, 7, 9, B, D, F) → I/G = 1 → a <b>group</b> address. Example: <code>01-00-5E-…</code>.</li>
<li>Second digit <b>2, 6, A or E</b> → U/L = 1 and I/G = 0 → a <b>locally administered unicast</b>. Example: <code>DA-4F-3B-…</code> (D<b>A</b>).</li>
<li>Second digit <b>0, 4, 8 or C</b> → both bits 0 → an ordinary <b>factory (universal) unicast</b>. Example: <code>3C-52-82-…</code> (3<b>C</b>).</li>
</ul>
${K.remember(`<p><b>"Odd is a crowd; 2-6-A-E is made by me."</b> Second hex digit odd → group. 2, 6, A or E → locally administered unicast. 0, 4, 8, C → factory address.</p>`)}
<h3>Randomised MACs on phones and laptops</h3>
<p>Phones once sent one factory MAC everywhere, so shops and airports could track them. Modern systems use ${K.g("randomised MAC addresses","A locally administered MAC the operating system invents per Wi-Fi network instead of the factory address, for privacy. Also called a private or random hardware address.")} instead, usually a different one per Wi-Fi network: <b>iPhone</b> "Private Wi-Fi Address", <b>Android</b> "randomised MAC" (both on by default), and <b>Windows 10/11</b> "Random hardware addresses" in the Wi-Fi settings, with an option to change daily.</p>
<p>These always have the U/L bit set (second digit 2, 6, A or E), so an OUI lookup finds nothing. They usually stay fixed per network, but can change when a user forgets and re-joins it or picks a rotating option — and then DHCP reservations and MAC allow-lists stop matching.</p>
${K.when([
  ["Random MAC on (default)", "Guest, hotel, airport or public Wi-Fi", "Stops tracking between networks and visits", "The network relies on knowing the device (DHCP reservation, MAC allow-list)"],
  ["Fixed private address per network", "Staff devices on a Wi-Fi that identifies devices by MAC", "Stable on this network, private elsewhere", "The device must be recognised on several networks"],
  ["Random MAC off (factory MAC)", "Corporate laptops with DHCP reservations or asset records by MAC", "Matches the label and the asset register", "Personal devices — identify users with 802.1X logins instead"],
], "Randomised MACs: on, per-network, or off?")}
${K.dyk(`Ethernet sends each byte <b>lowest bit first</b>, so the first address bit on the wire is the destination's I/G bit. A card knows "unicast or group?" after a single bit.`)}
${K.check({q:"A user's phone shows up on the Wi-Fi controller as 7A-1F-C3-90-24-5D, and the OUI lookup finds no manufacturer. What is the most likely explanation?", o:["The phone has a counterfeit network card","It is a multicast address","It is a locally administered (randomised) address — the second digit A means the U/L bit is set","The OUI database is out of date; nothing can be concluded"], a:2, why:"7A is 0111 1010: bit 0 (I/G) is 0, so unicast; bit 1 (U/L) is 1, so locally administered — a phone's private address, which no OUI lookup can find."})}

<h2>Unicast, broadcast and multicast frames</h2>
<p>Every destination MAC is one of three kinds, and the kind decides who receives the frame.</p>
${K.svg("0 0 760 256",
  K.txt(125,20,"UNICAST",{mid:true,c:"fg",b:true,s:12})+K.txt(380,20,"BROADCAST",{mid:true,c:"fg",b:true,s:12})+K.txt(635,20,"MULTICAST",{mid:true,c:"fg",b:true,s:12})+
  K.txt(125,36,"dst 0050.56a3.1b2c",{mid:true})+K.txt(380,36,"dst ffff.ffff.ffff",{mid:true})+K.txt(635,36,"dst 0100.5e00.00fb",{mid:true})+
  K.dev("switch",125,95,"","")+K.dev("switch",380,95,"","")+K.dev("switch",635,95,"","")+
  K.dev("pc",45,190,"sender","")+K.dev("pc",125,190,"other","")+K.dev("server",205,190,"target","")+
  K.dev("pc",300,190,"sender","")+K.dev("pc",380,190,"all","")+K.dev("pc",460,190,"all","")+
  K.dev("pc",555,190,"sender","")+K.dev("pc",635,190,"not joined","")+K.dev("pc",715,190,"joined","")+
  K.arrow(52,170,110,108,"",true)+K.arrow(140,108,198,168,"",true)+K.link(125,106,125,170,"",true)+
  K.arrow(307,170,365,108,"",true)+K.arrow(380,108,380,168,"",true)+K.arrow(395,108,453,168,"",true)+
  K.arrow(562,170,620,108,"",true)+K.arrow(635,108,635,168,"")+K.arrow(650,108,708,168,"",true)+
  K.txt(125,240,"one receiver",{mid:true,c:"fg"})+K.txt(380,240,"every device in the LAN/VLAN",{mid:true,c:"fg"})+K.txt(635,240,"only group members keep it",{mid:true,c:"fg"}),
  "Three kinds of destination. A switch floods broadcasts and (by default) multicasts; only group members keep a multicast.")}
<h3>Unicast: one sender, one receiver</h3>
<p>A ${K.g("unicast","A frame addressed to one interface's MAC address (I/G bit 0).")} frame is for one card. Almost all real traffic — web pages, file copies, print jobs — is unicast. A switch that knows where that MAC lives sends it out of that one port only (what it does when it <i>doesn't</i> know is lesson 2).</p>
<h3>Broadcast: everyone, listen</h3>
<p>The ${K.g("broadcast address","ffff.ffff.ffff: all 48 bits 1. Every interface in the broadcast domain processes it.")} is all ones: <code>ffff.ffff.ffff</code>. <b>Every</b> device in the local network must accept and process it. A switch floods it out of every port in the VLAN except the incoming one; routers do <b>not</b> forward it, so it stays inside its ${K.g("broadcast domain","All the devices that receive each other's broadcast frames: one LAN or one VLAN. Routers mark its edge.")} (lesson 3). ARP requests and DHCP Discovers are the broadcasts you'll see constantly.</p>
<h3>Multicast: one sender, an interested group</h3>
<p>A ${K.g("multicast","A frame to a group MAC (I/G bit 1, not all ones). Only interfaces that joined the group keep it.")} address has the I/G bit set but isn't all ones: "for everyone who joined this group". Video streams, routing protocols and device discovery use it. Two ranges matter for the CCNA:</p>
<div class="tablewrap"><table>
<tr><th>MAC range</th><th>Used for</th><th>How it's built</th><th>Example</th></tr>
<tr><td><code>01-00-5E-…</code></td><td>IPv4 multicast</td><td><code>01-00-5E</code> + a 0 bit + the low 23 bits of the IPv4 group address</td><td>224.0.0.251 (mDNS) → <code>01-00-5E-00-00-FB</code></td></tr>
<tr><td><code>33-33-…</code></td><td>IPv6 multicast</td><td><code>33-33</code> + the low 32 bits of the IPv6 group address</td><td>ff02::1 (all nodes) → <code>33-33-00-00-00-01</code></td></tr>
</table></div>
<p>Switches also talk to each other on fixed group MACs: <code>01-00-0C-CC-CC-CC</code> (Cisco's CDP — Cisco's <code>00-00-0C</code> OUI with the group bit set), <code>01-80-C2-00-00-00</code> (Spanning Tree) and <code>01-80-C2-00-00-0E</code> (LLDP).</p>
<h3>Worked example: an IPv4 multicast address as a MAC</h3>
${K.steps([
  ["Start with the prefix", `<p>Every IPv4 multicast MAC begins <code>01-00-5E</code>, followed by a 0 bit.</p>`],
  ["Take the last three octets", `<p>Group <code>239.130.10.5</code>: 130, 10 and 5.</p>`],
  ["Clear the top bit of the first one", `<p>Only 23 bits fit. 130 = <code>1000 0010</code> = 0x82 becomes 0x02; 10 = 0x0A and 5 = 0x05 are copied.</p>`],
  ["Write the result", `<p><code>01-00-5E-02-0A-05</code> — <code>0100.5e02.0a05</code> on a Cisco switch.</p>`],
  ["Notice the overlap", `<p><code>239.2.10.5</code> gives the same MAC, because the differing bits were thrown away. 32 IPv4 groups share each multicast MAC; IP filters out the extras.</p>`],
])}
${K.exam(`<code>01-00-5E</code> = IPv4 multicast, <code>33-33</code> = IPv6 multicast, all F = broadcast. Default switch behaviour: known unicast → one port; broadcast and multicast → flooded within the VLAN (unless a feature such as IGMP snooping limits multicast).`)}
${K.q({type:"match", q:"Match each destination MAC address with what kind of address it is.", pairs:[
  ["3C-52-82-1A-7F-09","Universally administered unicast (a factory address)"],
  ["DA-4F-3B-10-77-E2","Locally administered unicast (for example a randomised Wi-Fi address)"],
  ["01-00-5E-00-00-FB","IPv4 multicast"],
  ["33-33-00-00-00-01","IPv6 multicast"],
  ["FF-FF-FF-FF-FF-FF","Broadcast"]],
  why:"Read the second hex digit first: C is even and not 2/6/A/E, so a factory unicast; A means the U/L bit is set, so locally administered; 1 and 3 are odd, so group addresses. 01-00-5E is the IPv4 multicast prefix and 33-33 the IPv6 one; all ones is broadcast."})}
${K.check({q:"A PC sends a frame to ffff.ffff.ffff. What does a switch do with it, and how far does it go?", o:["Forwards it to the default gateway only","Floods it out every port in the same VLAN except the incoming port; routers do not pass it on","Floods it to every switch on the internet","Drops it, because broadcasts are invalid on switches"], a:1, why:"All ones is the broadcast address. Every device in the broadcast domain must receive it, so the switch floods it within the VLAN. Routers mark the edge of the broadcast domain and don't forward it."})}

<h2>Burned-in or configured — and how a NIC decides to keep a frame</h2>
<h3>The burned-in address</h3>
<p>Every card has a factory address in its chip: the ${K.g("burned-in address","BIA: the MAC the manufacturer stored in the card's hardware, with a real OUI.")} (<b>BIA</b>). Software can tell the card to use a different address instead; the BIA stays in the chip and returns when the override is removed. Configured addresses are normal: <b>VMs</b> get one from the hypervisor; <b>privacy</b> features use random ones; a <b>replacement router</b> may copy the old one's MAC because the ISP's modem only talks to it; <b>redundant gateways</b> share a virtual MAC (FHRP, later).</p>
<p>Cisco shows both: in <code>show interfaces</code>, "address is" is the MAC in use and "bia" the factory one.</p>
${K.out(`R1#show interfaces GigabitEthernet0/0/1
GigabitEthernet0/0/1 is up, line protocol is up
  Hardware is ISR4321-2x1GE, address is 0200.0aaa.0001 (bia 0000.0c7d.4e01)
  Description: ISP-HANDOFF
  [... lines trimmed ...]`, "A router interface where an engineer has configured a MAC with the interface command mac-address 0200.0aaa.0001.")}
<ul>
<li><b>address is 0200.0aaa.0001</b> — the MAC in use. Second digit <b>2</b>: locally administered, as a hand-set address should be.</li>
<li><b>(bia 0000.0c7d.4e01)</b> — the factory address: Cisco OUI, universally administered. On almost every interface the two match, meaning nothing was overridden.</li>
</ul>
${K.myth([
  ["A MAC address is permanent and can never change.","The BIA stays in the chip, but any operating system, hypervisor or router can use a different address in seconds."],
  ["MAC filtering keeps attackers off the network.","Anyone can copy an allowed MAC from nearby traffic. Use 802.1X logins for security."],
  ["The web server can see my laptop's MAC address.","Your MAC only reaches the first router, which builds a new frame with its own MAC as the source."],
  ["Promiscuous mode lets Wireshark see everyone's traffic on a switched network.","It only removes your card's filter. The switch still sends your port only your own frames plus broadcasts, multicasts and floods."],
])}
<h3>How a NIC decides: keep it or drop it</h3>
<p>On a hub or on Wi-Fi every card hears frames meant for others, and even on a switch, floods and broadcasts reach everyone. So every ${K.g("NIC","Network Interface Card: a device's network hardware (card, onboard chip or Wi-Fi radio). Has the MAC and does the Layer 2 work.")} filters in hardware, frame by frame, without bothering the processor:</p>
${K.svg("0 0 740 300",
  K.box(20,20,150,44,"Frame arrives","preamble + SFD: sync")+
  K.arrow(170,42,220,42,"",true)+
  K.box(220,20,190,44,"Read destination MAC","the first field",true)+
  K.arrow(410,42,460,42,"",true)+
  K.box(460,10,260,64,"Is it mine, broadcast,","or a group I joined?",true)+
  K.arrow(590,74,590,118,"yes",true)+
  K.arrow(500,74,300,128,"no")+
  K.box(200,128,200,44,"Drop it silently","(unless promiscuous mode)")+
  K.box(490,118,200,44,"Receive the rest","then check the FCS")+
  K.arrow(590,162,590,200,"FCS good",true)+
  K.arrow(500,150,420,226,"FCS bad")+
  K.box(240,206,180,44,"Drop + count an error","input errors / CRC")+
  K.box(490,200,200,44,"Read Type, pass up","0x0800 → IPv4, 0x0806 → ARP",true)+
  K.txt(370,288,"Only frames that pass both tests ever reach the operating system.",{mid:true}),
  "The receive decision a network card makes for every single frame.")}
<p>The card keeps a frame only if the destination is its <b>own MAC</b> (the one in use), <b>broadcast</b>, or a <b>multicast group it joined</b> (the OS programs these into the filter); everything else is dropped at once. A bad FCS (Module 1 lesson 6) is dropped and counted as a CRC error. Only then is the Type read and the payload passed up.</p>
<h3>Promiscuous mode and Wireshark</h3>
<p>${K.g("Promiscuous mode","A NIC setting that turns off the destination-MAC filter, passing every received frame to software. Capture tools such as Wireshark use it.")} switches off the destination check, so the card passes <i>every</i> frame to software; Wireshark turns it on by default. On a hub that showed everybody's traffic. On a switch you still get only your own unicasts plus broadcasts, multicasts and floods. To capture two <i>other</i> devices' traffic, mirror a port to yours — Cisco calls it ${K.g("SPAN","Switched Port Analyzer: Cisco port mirroring. Copies traffic from ports or VLANs to a capture port.")}.</p>
${K.out(`Ethernet II, Src: VMware_a3:1b:2c (00:50:56:a3:1b:2c), Dst: Broadcast (ff:ff:ff:ff:ff:ff)
    Destination: Broadcast (ff:ff:ff:ff:ff:ff)
        .... ..1. .... .... .... .... = LG bit: Locally administered address (this is NOT the factory default)
        .... ...1 .... .... .... .... = IG bit: Group address (multicast/broadcast)
    Source: VMware_a3:1b:2c (00:50:56:a3:1b:2c)
        .... ..0. .... .... .... .... = LG bit: Globally unique address (factory default)
        .... ...0 .... .... .... .... = IG bit: Individual address (unicast)
    Type: ARP (0x0806)`, "Wireshark decoding one frame: an ARP request from a VMware virtual machine.")}
<ul>
<li><b>Src: VMware_a3:1b:2c</b> — OUI <code>00:50:56</code> resolved to the vendor: the sender is a VM.</li>
<li><b>Dst: Broadcast</b> — all ones, so the "LG" (Wireshark's U/L) and IG bits both read as set.</li>
<li><b>Source IG 0, LG 0</b> — unicast, universal: VMware picks VM addresses from its own registered OUI.</li>
<li><b>Type: ARP (0x0806)</b> — which protocol gets the payload.</li>
</ul>
${K.check({q:"A PC's card receives a unicast frame whose destination MAC is a colleague's PC, not its own. The PC is NOT running a capture. What happens?", o:["The PC replies to say the frame went to the wrong place","The card drops it in hardware, and the operating system never sees it","The operating system reads it and then ignores it","The PC forwards it to the right colleague"], a:1, why:"The NIC compares the destination MAC with its own address, broadcast and joined multicast groups. No match means the frame is discarded at once, without interrupting the processor. Only promiscuous mode changes that."})}

<h2>The Ethernet II frame through a switch's eyes</h2>
<p>In Module 1 lesson 6 you took the Ethernet II frame apart from the sender's point of view. A switch cares about only three of its fields, and their order is no accident.</p>
${K.svg("0 0 760 260",
  K.band(10,40,74,40,"Preamble 7")+K.band(84,40,46,40,"SFD 1")+
  K.band(130,40,120,40,"Dest MAC 6","var(--panel2)")+K.band(250,40,120,40,"Source MAC 6","var(--panel2)")+
  K.band(370,40,70,40,"Type 2","var(--chip)")+K.band(440,40,220,40,"Payload 46–1500","var(--chip)")+K.band(660,40,90,40,"FCS 4","var(--panel2)")+
  K.txt(380,26,"bytes on the wire, in the order they arrive →",{mid:true,c:"fg"})+
  K.arrow(190,82,190,124,"",true)+K.arrow(310,82,310,124,"",true)+K.arrow(705,82,705,124,"",true)+K.arrow(475,82,475,124,"")+
  K.box(115,126,150,60,"1 · Where to?","forward / flood / filter",true)+
  K.box(272,126,150,60,"2 · Who sent it?","learn: MAC → port",true)+
  K.box(430,126,110,60,"Not read","carried unchanged")+
  K.box(630,126,120,60,"3 · Damaged?","bad FCS → drop",true)+
  K.txt(380,214,"The switch never changes the MAC addresses. It reads them, makes a decision, and sends the same frame on.",{mid:true,c:"fg"})+
  K.txt(380,234,"(In the VLAN module you'll see a 4-byte 802.1Q tag inserted between Source MAC and Type on trunk links.)",{mid:true}),
  "The fields a switch uses, in arrival order: destination (where), source (learn), FCS (intact?).")}
<h3>Why the destination comes first</h3>
<p>The destination sits at the very front, before the source, because every receiver's first question is "is this for me, or where does it go?" A <b>NIC</b> can drop someone else's frame after 6 bytes. A <b>switch</b> can start its lookup while the rest is still arriving — some even start sending before the end arrives (cut-through switching, lesson 2). And since the lowest bit of each byte goes first, the very first bit tells unicast from group.</p>
<div class="tablewrap"><table>
<tr><th>Field</th><th>What a switch does with it</th></tr>
<tr><td>Preamble + SFD (8 bytes)</td><td>Lets the port lock on to the timing. Not part of the frame size.</td></tr>
<tr><td>Destination MAC (6)</td><td>Forwarding: known unicast → that port; broadcast, multicast or unknown → flood within the VLAN.</td></tr>
<tr><td>Source MAC (6)</td><td>Learning: "this MAC lives on the incoming port". Never a group address.</td></tr>
<tr><td>Type (2) and payload (46–1500)</td><td>Carried untouched; they're for the receiving host. A Layer 2 switch never reads the IP addresses inside.</td></tr>
<tr><td>FCS (4)</td><td>Checked by a store-and-forward switch; a bad frame is dropped and counted.</td></tr>
</table></div>
${K.mistake(`Saying a switch "puts its own MAC address on the frame". It forwards the frame with the original MACs untouched; only routers build a new frame. If a capture on the server shows the PC's own MAC as the source, there was no router in between.`)}
${K.check({q:"Why does the destination MAC come before the source MAC in an Ethernet frame?", o:["Because the source MAC is optional","So receivers — NICs and switches — can make their accept or forwarding decision as early as possible","Because the switch must learn the destination before it can forward","Because the FCS is calculated over the destination only"], a:1, why:"It answers every receiver's first question — is this for me, or where does it go? — so a NIC can drop others' frames early and a switch can start its lookup while the rest arrives."})}

<h2>Finding MAC addresses on real devices</h2>
<h3>On end devices</h3>
<div class="tablewrap"><table>
<tr><th>System</th><th>Command</th><th>Look for</th></tr>
<tr><td>Windows</td><td><code>ipconfig /all</code> · <code>getmac /v</code></td><td><b>Physical Address</b> per adapter</td></tr>
<tr><td>Windows</td><td><code>arp -a</code></td><td>MACs of devices this PC has talked to (lesson 4)</td></tr>
<tr><td>Linux / macOS</td><td><code>ip link</code> · <code>ifconfig en0</code></td><td><b>link/ether</b> / <b>ether</b></td></tr>
<tr><td>Phones</td><td>Wi-Fi network details</td><td>The (private) Wi-Fi address for that network</td></tr>
</table></div>
${K.out(`C:\\Users\\tunde> getmac /v

Connection Name Network Adapter Physical Address    Transport Name
=============== =============== =================== ==========================================================
Ethernet        Intel(R) Ethern 3C-52-82-1A-7F-09   \\Device\\Tcpip_{8C2E1F4A-6B3D-4E7A-9F21-0D5C3B7A1E64}
Wi-Fi           Intel(R) Wi-Fi  DA-4F-3B-10-77-E2   Media disconnected`, "getmac /v on a Windows laptop with two adapters.")}
<ul>
<li><b>Two adapters, two MACs</b>: <b>3C-52-82-…</b> (second digit C) is the Ethernet card's factory address; <b>DA-4F-3B-…</b> (A) is a random address Windows chose for Wi-Fi, currently disconnected.</li>
</ul>
${K.out(`$ ip link show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 3c:52:82:1a:7f:09 brd ff:ff:ff:ff:ff:ff`, "ip link on a Linux server.")}
<p><b>UP,LOWER_UP</b> means enabled with link; <b>link/ether</b> is the MAC in colon format; <b>brd</b> is the broadcast address the interface accepts.</p>
<h3>On a Cisco switch</h3>
<p>A switch has MACs of its own <i>and</i> a table of everyone else's:</p>
<ul>
<li><code>show version</code> — the <b>Base Ethernet MAC Address</b>; port MACs are derived from it.</li>
<li><code>show interfaces g0/1</code> — the port's own MAC, the source of frames the switch itself sends there (Spanning Tree, CDP). Not used to forward your traffic.</li>
<li><code>show interfaces vlan 1</code> — the management interface's MAC (lesson 5).</li>
<li><code>show mac address-table</code> — every learned MAC and the port it lives behind.</li>
</ul>
${K.out(`ACC-SW1#show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 All    0100.0ccc.cccc    STATIC      CPU
 All    ffff.ffff.ffff    STATIC      CPU
   1    0050.56a3.1b2c    DYNAMIC     Gi0/2
   1    3c52.821a.7f09    DYNAMIC     Gi0/1
   1    da4f.3b10.77e2    DYNAMIC     Gi0/3
Total Mac Addresses for this criterion: 5`, "show mac address-table on a small access switch (real switches list a dozen or more STATIC CPU entries).")}
<ul>
<li><b>STATIC … CPU</b> (VLAN <b>All</b>) — frames to these go to the switch's own processor: CDP's <code>0100.0ccc.cccc</code> and broadcast.</li>
<li><b>DYNAMIC</b> — learned from source MACs; aged out after 300 seconds of silence by default (lesson 2).</li>
<li><b>Ports</b> — where each device is. <code>da4f.3b10.77e2</code> on <b>Gi0/3</b> (second digit A) is using a randomised MAC.</li>
</ul>
${K.tip(`Filter, don't scroll: <code>show mac address-table address 3c52.821a.7f09</code> or <code>… interface g0/3</code>. Several MACs on a desk port usually means a hidden mini-switch, or an IP phone with a PC behind it.`)}
${K.dodont([
  "Write MACs in tickets in one consistent format, saying which device each came from.",
  "Read the second hex digit before trusting an OUI lookup.",
  "Trace a device switch by switch until you reach a port with only that MAC on it.",
],[
  "Don't treat a MAC allow-list as security.",
  "Don't assume an unknown OUI means a malicious device — check for a randomised address first.",
  "Don't shut a port the moment you find an unknown device — involve security and document it.",
])}

<h3>Try it: read a switch's own MAC addresses</h3>
<p>A newly installed branch switch that hasn't learned any hosts yet, so its MAC table holds only its own STATIC entries. Find each of its own addresses.</p>
${K.hint(`<code>show version</code> is long; the base MAC is near the bottom. For an interface, type <code>show interfaces g0/1</code> (or <code>sh int g0/1</code>) and read the second line. The management interface is <code>show interfaces vlan 1</code>.`)}
${K.term({env:"ios2", title:"find a switch's own MAC addresses", opts:{kind:"switch", host:"LKK-ACC-SW1", model:"C9200L-24P-4G", mac:"0000.0c3a",
  motd:"LKK-ACC-SW1 — console session. Lekki branch access switch, freshly installed. You are at user EXEC (the > prompt)."},
  intro:"Start with <code>enable</code>. Every command below is a <code>show</code> command — nothing you type here changes the switch.",
  tasks:[
    {text:"Type <code>enable</code> to reach privileged EXEC (the <code>#</code> prompt)", done:e=>e.history.some(h=>/^\s*ena?b?l?e?\s*$/i.test(h))},
    {text:"Run <code>show version</code> and find the <b>Base Ethernet MAC Address</b> — which OUI is it?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+ver/i.test(h))},
    {text:"Run <code>show interfaces g0/1</code> — read <i>address is … (bia …)</i>. How does it relate to the base MAC?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/1\s*$/i.test(h))},
    {text:"Run <code>show interfaces vlan 1</code> — the management interface has a MAC of its own", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+v\w*\s*1\s*$/i.test(h))},
    {text:"Run <code>show mac address-table</code> — which two STATIC entries are there, and why are both group addresses?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+mac/i.test(h))},
  ],
  win:"You found the base MAC, a port MAC with its BIA, the SVI MAC and the switch's own CPU entries. Base 0000.0c3a.0000 is a Cisco OUI (00-00-0C); each port adds a small number to it.",
  solve:["enable","show version","show interfaces g0/1","show interfaces vlan 1","show mac address-table"]})}
<p>You should have spotted: base MAC <code>0000.0c3a.0000</code> (Cisco OUI); <code>Gi0/1</code> is base plus one, "address is" matching "bia"; Vlan1 has another address from the block. Real Catalysts number ports from the base too, varying by model (and a real C9200L names its ports Gi1/0/1 onwards; this simulator uses the shorter Gi0/1 style).</p>

<h3>Hands-on: watch MACs at work on the wire</h3>
<p>A small bank branch, already cabled. Read MACs everywhere they appear — PC, ARP cache, frame log, switch table — then watch a card ignore a frame that isn't for it.</p>
${K.bench({id:"m2-mac-read", points:70, from:"CCNA · Module 2 · lesson 1", title:"read MACs on the PC, the wire and the switch", viewBox:"0 0 760 360", openLog:true,
  intro:"Use <b>Command Prompt</b> under each PC. For the switch: <b>Terminal app (PuTTY)</b> under IT-LAPTOP, set <b>9600</b> baud, 8 data bits, no parity, 1 stop bit, flow control <b>None</b>, then Open. The frame log under the bench explains every frame.",
  devices:[
    {id:"sw1", kind:"switch", label:"BR-ACC-SW1", model:"Catalyst 9200 · branch comms cabinet", x:180, y:30, mac:"0000.0c5b"},
    {id:"pc1", kind:"pc", label:"TELLER-1", x:30, y:230, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1", mac:"3c52.821a.7f09"},
    {id:"srv", kind:"server", label:"CORE-VM", x:205, y:230, ip:"192.168.10.20", mask:"255.255.255.0", gw:"192.168.10.1", mac:"0050.56a3.1b2c"},
    {id:"pc3", kind:"pc", label:"TELLER-2", x:380, y:230, ip:"192.168.10.13", mask:"255.255.255.0", gw:"192.168.10.1", mac:"da4f.3b10.77e2"},
    {id:"lap", kind:"laptop", label:"IT-LAPTOP", x:600, y:230},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"srv:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw1:g3"}, {type:"console", a:"lap:usb", b:"sw1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On <b>TELLER-1</b>, run <code>ipconfig /all</code> and find its <b>Physical Address</b>. Write it in Cisco format", done:B=>B.events.some(e=>e.a[0]==="pc" && e.a[1]==="pc1" && /^\s*ipconfig\s+\/all\s*$/i.test(e.a[2]||""))},
    {text:"From TELLER-1, <code>ping 192.168.10.20</code> (CORE-VM). In the frame log, find the ARP request to <code>ffff.ffff.ffff</code> and the unicast reply", done:B=>Bench.pinged(B,"pc1","192.168.10.20")},
    {text:"On TELLER-1, run <code>arp -a</code>: find CORE-VM's MAC, the broadcast entry and the <code>01-00-5e</code> multicast entry", done:B=>Bench.arpHas(B,"pc1","192.168.10.20") && B.events.some(e=>e.a[0]==="pc" && e.a[1]==="pc1" && /^\s*arp\s+-a\s*$/i.test(e.a[2]||""))},
    {text:"From TELLER-1, <code>ping 192.168.10.13</code> (TELLER-2) so the switch has heard from all three hosts", done:B=>Bench.pinged(B,"pc1","192.168.10.13")},
    {text:"Console into the switch from IT-LAPTOP and type <code>enable</code>", done:B=>Bench.consoleOk(B,"sw1") && B.devs.sw1.env.history.some(h=>/^\s*ena?b?l?e?\s*$/i.test(h))},
    {text:"On the switch, run <code>show mac address-table</code>. Which host is using a locally administered (random) MAC, and on which port?", done:B=>B.devs.sw1.env.history.some(h=>/^\s*(do\s+)?sh\w*\s+mac/i.test(h))},
    {text:"Run <code>show interfaces g0/1</code> and find the port's own MAC in <i>address is … (bia …)</i>", done:B=>B.devs.sw1.env.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/1\s*$/i.test(h))},
    {text:"Watch a NIC ignore a frame: on the switch run <code>clear mac address-table dynamic</code>, then ping 192.168.10.20 from TELLER-1 again. Read the log line for TELLER-2", done:B=>{ const ev = B.events; let ci = -1; ev.forEach((e,i)=>{ if (e.a[0]==="term" && /^\s*cl\w*\s+mac/i.test(e.a[1]||"")) ci = i; }); return ci>-1 && ev.some((e,i)=>i>ci && e.a[0]==="pc" && e.a[1]==="pc1" && /^\s*ping\s+192\.168\.10\.20\s*$/i.test(e.a[2]||"")) && Bench.pinged(B,"pc1","192.168.10.20"); }},
  ],
  win:"You read one MAC in three formats, watched a broadcast and a unicast on the wire, matched the switch's MAC table to real hosts, spotted a randomised address, and saw a NIC drop a frame meant for someone else.",
  solve:[["pc","pc1","ipconfig /all"],["pc","pc1","ping 192.168.10.20"],["pc","pc1","arp -a"],["pc","pc1","ping 192.168.10.13"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show mac address-table"],["term","show interfaces g0/1"],
    ["term","clear mac address-table dynamic"],["pc","pc1","ping 192.168.10.20"]]})}
${K.hint(`For the last task: TELLER-1 already had CORE-VM's MAC in its ARP cache, so it sent a <b>unicast</b> straight away. But the switch's table was empty, so it flooded the frame (lesson 2 explains why), and TELLER-2's card dropped a frame that wasn't for its MAC.`)}
<p>Notice: <code>3C-52-82-1A-7F-09</code> on the PC is <code>3c52.821a.7f09</code> on the switch. <code>arp -a</code> maps <code>224.0.0.22</code> to <code>01-00-5e-00-00-16</code> (0x16 = 22). TELLER-2's <code>da4f…</code> is a random address — at a real branch you'd ask why. And <code>show interfaces g0/1</code> shows the <i>port's</i> MAC, not TELLER-1's.</p>
${K.check({q:"On a switch, show interfaces g0/5 says 'address is 0000.0c5b.0005', but the PC on that port has MAC 3c52.821a.7f09. Which command shows the PC's MAC against that port?", o:["show version","show interfaces g0/5 — the address shown is wrong","show mac address-table interface g0/5","show ip interface brief"], a:2, why:"show interfaces shows the switch port's own MAC, not the device behind it. The devices learned on a port are in the MAC address table, which you can filter by interface."})}

${K.job("“Unknown device on the teller VLAN” — trace it by MAC",`
<p><b>The alert.</b> From the security team at a Victoria Island branch: <i>"DHCP lease for 10.20.30.57, hostname raspberrypi, MAC dc:a6:32:4f:1b:9e, on the teller VLAN. Not in the asset register. Find it."</i></p>
<p><b>Questions first.</b> Branch IT lead: "Any new equipment this month?" — <i>"The generator contractor came last week."</i> Security: "Remove or identify?" — <i>"Identify and isolate. Don't destroy anything."</i></p>
<p><b>Check 1 — read the MAC.</b> Second digit <b>C</b>: universally administered, so the OUI is real. <code>DC-A6-32</code> looks up as Raspberry Pi Trading Ltd, matching the hostname.</p>
<p><b>Check 2 — find it from the top.</b> On the distribution switch, in dotted format:</p>
${K.out(`BR-DIST-SW#show mac address-table address dca6.324f.1b9e
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  30    dca6.324f.1b9e    DYNAMIC     Gi1/0/2
Total Mac Addresses for this criterion: 1`)}
<p><code>Gi1/0/2</code> is the uplink to the second-floor access switch (its description says so; CDP, in lesson 7, would confirm it). An uplink carries many MACs, so the device is somewhere <i>behind</i> it.</p>
<p><b>Check 3 — follow it down.</b> On BR-ACC-SW2, the same lookup shows <code>Gi1/0/14</code>, and <code>show mac address-table interface Gi1/0/14</code> lists that one MAC only: an access port, so this is where it's plugged in. The port description is <code>DESK-2.14 SPARE</code>; the cabling sheet maps it to the socket behind the photocopier, beside the generator change-over panel.</p>
<p><b>Check 4 — eyes on it.</b> A Raspberry Pi in a plastic case, a USB cable to the generator's control panel, the contractor's sticker: a fuel and runtime monitor reporting to the contractor's cloud dashboard — over the bank's teller network.</p>
<p><b>The fix.</b> With security's approval: <code>shutdown</code> on Gi1/0/14, description changed to <code>SHUT-SEC-INC-2291 unapproved RPi</code>, saved; the device bagged and labelled, not wiped. It can return on the isolated facilities network once approved.</p>
<p><b>What you say to the branch manager.</b> "It was the generator contractor's monitoring box in a spare teller-network socket. It's disconnected and with security; the generator is fine, only its remote reporting is off."</p>
<p><b>Ticket note.</b> <i>"SEC-INC-2291. MAC dc:a6:32:4f:1b:9e (Raspberry Pi OUI, universal) / 10.20.30.57 / VLAN 30. Traced BR-DIST-SW Gi1/0/2 (uplink) → BR-ACC-SW2 Gi1/0/14 (single MAC) → socket 2-14. Contractor generator monitor, unapproved. Port shut, description updated, saved; device with security. Recommend: shut unused ports; facilities VLAN. 25 min."</i></p>
<p>With a randomised MAC the OUI lookup would find nothing, but the port trace works exactly the same.</p>`)}

${K.case("A co-working hub, phone updates and a MAC allow-list",`
<p>A co-working space in Yaba, Lagos, sold monthly Wi-Fi memberships. When a member paid, the front desk typed their phone and laptop MACs into an allow-list on the Wi-Fi controller; unknown MACs got a "please pay" page. It worked for two years.</p>
<p>Then complaints grew to dozens a week: paid members couldn't get online. Re-adding their MACs worked for a while, then failed again. Staff blamed the ISP, then the controller, and bought a new access point. Nothing changed.</p>
<p>The engineer they called saw it in the controller's client list: almost every failing device had a second digit of 2, 6, A or E. Updates had switched on randomised addresses, so phones used made-up MACs — not the factory MAC copied from the About screen — and some got new ones on re-joining. To the allow-list, they were strangers.</p>
<p>The fix was to stop identifying people by MAC: a login per member (later WPA2-Enterprise), plus a shorter DHCP lease, because the pool was filling with addresses from devices that had changed identity. Her report's lessons: a MAC identifies a card setting, not a person; and MAC control was never secure anyway, since anyone could copy a member's MAC.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Go beyond "hardware vs logical": size and format, layer, scope (one hop vs end to end), flat vs hierarchical, and what links the two.`)}
${K.reveal("“What is a MAC address, and how is it different from an IP address?”",`<p>"A MAC is a 48-bit Layer 2 address on an interface: a 24-bit manufacturer OUI plus a card number, though software can override it. Switches use it to deliver frames within one local network. An IP address is a Layer 3 address assigned by the network and used to route packets end to end. The IP stays the same along the path while the MACs are rewritten at every router, and IP is hierarchical, so routers can summarise, while MACs are flat — fine in one LAN, unworkable across the internet. ARP maps one to the other locally."</p>`)}
${K.hint(`Define it, who issues it, its size, how you use it at work — and the catch with randomised addresses.`)}
${K.reveal("“What's an OUI?”",`<p>"The Organizationally Unique Identifier: the first 24 bits of a universally administered MAC. Manufacturers buy them from the IEEE and number their cards within the block — about 16.7 million addresses per OUI. I use OUI lookups to identify unknown devices: 00-50-56 is a VMware VM, DC-A6-32 a Raspberry Pi. The catch: if the second hex digit is 2, 6, A or E, the address is locally administered — say a phone's private Wi-Fi address — so there's no OUI to look up."</p>`)}
${K.hint(`What it is in binary, who must process it, what a switch does, where it stops, and which protocols use it.`)}
${K.reveal("“What does ffff.ffff.ffff mean?”",`<p>"It's the Ethernet broadcast address, all 48 bits set to one. Every device in the broadcast domain must process it. A switch floods it out of every port in the VLAN except the incoming one, and routers don't forward it, so it stays in the LAN or VLAN. ARP requests and DHCP Discovers use it, because the sender doesn't yet know who to ask. Too many broadcasts waste every host's CPU — one reason we split networks into VLANs."</p>`)}

${K.recap([
  "Layer 2 has its own address because devices talk before they have an IP, Ethernet carries many protocols, and switches forward on a fixed 48-bit field in hardware.",
  "48 bits = 12 hex digits: 3C-52-82-1A-7F-09 (Windows), 3c:52:82:1a:7f:09 (Linux), 3c52.821a.7f09 (Cisco). Same bits.",
  "First 24 bits = OUI (manufacturer, from the IEEE); last 24 = the card.",
  "Second hex digit: odd = group; 2, 6, A, E = locally administered unicast (random or hand-set); otherwise a factory unicast.",
  "Unicast = one card; ffff.ffff.ffff = everyone in the VLAN; 01-00-5E (IPv4) and 33-33 (IPv6) = multicast groups.",
  "A NIC keeps its own MAC, broadcast and joined groups, then checks the FCS; promiscuous mode removes its filter, not the switch's.",
  "Destination first so receivers decide early; a switch forwards on destination, learns from source, drops bad FCS — and never rewrites MACs.",
  "ipconfig /all, getmac, ip link on hosts; show version, show interfaces (address, bia) and show mac address-table on Cisco.",
])}
${K.next(`<b>Lesson 2 — How a switch thinks.</b> You've seen the MAC table fill and a frame get flooded. Next: exactly how a switch learns, floods, forwards and filters, and how entries age out after 300 seconds.`)}
`,
quiz:[
  {lvl:1, q:"How long is an Ethernet MAC address?", o:["32 bits, written as four decimal numbers","48 bits, written as 12 hexadecimal digits","64 bits, written as 16 hexadecimal digits","128 bits, written as eight groups of four hex digits"], a:1, why:"A MAC address is 48 bits (6 bytes). Each hex digit is 4 bits, so it is written as 12 hex digits. 32 bits is IPv4; 128 bits is IPv6."},
  {lvl:1, q:"What does the OUI part of a MAC address identify?", o:["The switch port the device is connected to","The VLAN the device belongs to","The organisation (manufacturer) that the IEEE assigned the first 24 bits to","The device's IP subnet"], a:2, why:"The Organizationally Unique Identifier is the first 24 bits, bought from the IEEE by a manufacturer. The last 24 bits identify the individual card. Nothing in a MAC says where the device is."},
  {lvl:2, type:"fill", q:"A user reads you their Physical Address from ipconfig /all: 3C-52-82-1A-7F-09. Write it the way you must type it in a Cisco IOS command.", a:["3c52.821a.7f09"], why:"Remove the hyphens to get 12 hex digits, then regroup into three groups of four separated by dots. IOS rejects the Windows hyphen format in commands such as show mac address-table address."},
  {lvl:2, q:"Which of these MAC addresses is a locally administered unicast address?", o:["3C-52-82-1A-7F-09","DA-4F-3B-10-77-E2","01-00-5E-00-00-FB","FF-FF-FF-FF-FF-FF"], a:1, why:"Look at the second hex digit. DA: A is 1010, so the U/L bit is 1 (locally administered) and the I/G bit is 0 (unicast). 3C is a normal factory unicast; 01 is odd, so a group (IPv4 multicast) address; all ones is broadcast."},
  {lvl:2, type:"multi", q:"Which two of these are multicast MAC addresses (not broadcast)? (Choose two.)", o:["01-00-5E-00-00-16","33-33-00-00-00-01","00-50-56-A3-1B-2C","DA-4F-3B-10-77-E2","3C-52-82-1A-7F-09"], a:[0,1], why:"Multicast addresses have the I/G bit set, which shows as an odd second hex digit. 01-00-5E is the IPv4 multicast range and 33-33 the IPv6 multicast range. The other three have even second digits, so they are unicast: a VMware VM, a randomised address and a factory address."},
  {lvl:2, q:"Read this Wireshark decode. Which statement is correct?", ex:"Ethernet II, Src: VMware_a3:1b:2c (00:50:56:a3:1b:2c), Dst: Broadcast (ff:ff:ff:ff:ff:ff)\n    Destination: Broadcast (ff:ff:ff:ff:ff:ff)\n        .... ...1 .... .... .... .... = IG bit: Group address (multicast/broadcast)\n    Source: VMware_a3:1b:2c (00:50:56:a3:1b:2c)\n        .... ..0. .... .... .... .... = LG bit: Globally unique address (factory default)\n        .... ...0 .... .... .... .... = IG bit: Individual address (unicast)\n    Type: ARP (0x0806)", o:["A VMware virtual machine is sending an ARP frame to every device in its broadcast domain","A physical VMware-brand PC is sending an IPv4 packet to one server","The frame will be routed to other networks because it is a broadcast","The source address is a multicast address because the destination is"], a:0, why:"OUI 00:50:56 belongs to VMware, so the sender is a VM. The destination is all ones, the broadcast address, and the Type 0x0806 means the payload is ARP. Routers don't forward broadcasts, and a source address is always individual (unicast), as the IG bit 0 shows."},
  {lvl:1, type:"match", q:"Match each way of writing a MAC address with where you would normally see it.", pairs:[["3C-52-82-1A-7F-09","Windows (ipconfig /all, getmac)"],["3c:52:82:1a:7f:09","Linux and macOS (ip link, ifconfig)"],["3c52.821a.7f09","Cisco IOS (show mac address-table)"],["Cisco_3a:00:01","Wireshark with vendor name resolution"]], why:"The 48 bits are identical; only the punctuation changes: Windows uses hyphenated upper-case pairs, Linux and macOS colon-separated lower-case pairs, Cisco three dotted groups of four, and Wireshark can replace the OUI with the vendor's name."},
  {lvl:2, type:"order", q:"A frame arrives at a PC's network card. Put the card's receive steps in order.", items:["Lock on to the signal using the preamble and SFD","Read the destination MAC address","Keep the frame only if it is the card's own MAC, broadcast or a joined multicast group","Receive the rest of the frame and check the FCS","Read the Type field and hand the payload to IPv4, IPv6 or ARP"], why:"The preamble and SFD synchronise the receiver. The destination comes first in the frame, so the card decides early whether the frame is for it. Only a frame it keeps is checked against the FCS, and only an undamaged frame has its Type read and its payload passed up."},
  {lvl:2, q:"Which destination MAC address does a host use for the IPv4 multicast group 224.0.0.251 (mDNS)?", o:["FF-FF-FF-FF-FF-FF","33-33-00-00-00-FB","01-00-5E-00-00-FB","01-00-5E-E0-00-FB"], a:2, why:"IPv4 multicast MACs are 01-00-5E plus the low 23 bits of the group address. The last three octets of 224.0.0.251 are 0, 0 and 251 (0xFB), giving 01-00-5E-00-00-FB. 33-33 is the IPv6 multicast prefix, and the first octet 224 is never copied."},
  {lvl:3, q:"Security asks where the device with MAC dca6.324f.1b9e is plugged in. On the distribution switch you see this. What should you do next?", ex:"BR-DIST-SW#show mac address-table address dca6.324f.1b9e\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  30    dca6.324f.1b9e    DYNAMIC     Gi1/0/2\n\nBR-DIST-SW#show mac address-table interface Gi1/0/2 | count dynamic\nNumber of lines which match regexp = 61", o:["Shut down Gi1/0/2 immediately — that is where the device is","Gi1/0/2 carries 61 MACs, so it is an uplink; go to the switch connected to it and run the same lookup there","Clear the MAC address table so the device has to re-register","Conclude the device is a router, because one port has many MACs"], a:1, why:"A port with dozens of MACs is an uplink to another switch, not the device's own port. Shutting it would cut off everyone behind it. Follow the MAC to the next switch and repeat until you reach an access port with only that one MAC; that is where the device is physically connected."},
  {lvl:3, q:"You run Wireshark (promiscuous mode on) on your PC, plugged into a switch port, to capture a colleague's file copy to a server on the same switch. You see broadcasts and your own traffic, but none of the file copy. Why, and what would you use instead?", o:["Promiscuous mode is broken; reinstall the capture driver","The switch only sends your port your own frames plus broadcasts, multicasts and floods; configure SPAN to mirror the colleague's or the server's port to yours","The colleague's traffic is encrypted, so Wireshark hides it","File copies use multicast, which Wireshark cannot capture"], a:1, why:"Promiscuous mode only removes your own card's MAC filter. On a switch, unicast frames between two other devices are forwarded only to the ports involved, so they never reach your cable. Port mirroring (SPAN) copies those frames to your capture port."},
  {lvl:2, type:"fill", q:"On a Cisco switch, type the full command that shows which port the MAC address dca6.324f.1b9e was learned on.", fields:[{label:"Command", a:["show mac address-table address dca6.324f.1b9e"], ios:true}], why:"show mac address-table address followed by the MAC in dotted format filters the table to that one address and shows its VLAN, type and port. On a large switch this is much faster than scrolling the whole table."},
  {lvl:3, q:"A new phone keeps failing a Wi-Fi MAC allow-list, even though staff typed in the MAC shown under Settings > About > Wi-Fi address. The controller shows the phone connecting as 7A-1F-C3-90-24-5D. What is the most likely cause, and the best long-term fix?", o:["The phone's Wi-Fi chip is faulty; replace the phone","The phone is using a randomised, locally administered address for this network (second digit A); use per-user authentication such as 802.1X instead of MAC lists","The allow-list is full; delete old entries","The access point is converting the MAC to multicast"], a:1, why:"7A has the U/L bit set and the I/G bit clear: a locally administered unicast, which is what phones use for private Wi-Fi addresses. The About screen shows the factory address, which the phone isn't using on this network. Identifying users by login is both more reliable and more secure than MAC lists, which can be spoofed."},
  {lvl:2, q:"What does this output tell you about the interface?", ex:"R1#show interfaces GigabitEthernet0/0/1\nGigabitEthernet0/0/1 is up, line protocol is up\n  Hardware is ISR4321-2x1GE, address is 0200.0aaa.0001 (bia 0000.0c7d.4e01)", o:["The interface has two MAC addresses and sends from both","The burned-in address is 0200.0aaa.0001","An administrator has configured MAC 0200.0aaa.0001, which overrides the burned-in address 0000.0c7d.4e01","The interface is faulty because the two addresses differ"], a:2, why:"'address is' shows the MAC in use; 'bia' shows the burned-in address. They differ only when a MAC has been configured, for example with the mac-address interface command. The configured one starts 02, so it is locally administered, as a hand-set address should be."},
  {lvl:1, q:"A switch receives a frame with destination ffff.ffff.ffff. What does it do?", o:["Sends it out of every port in the same VLAN except the port it arrived on","Sends it only to the default gateway","Drops it to protect the network","Sends it back out of the port it arrived on"], a:0, why:"ffff.ffff.ffff is the broadcast address. Every device in the broadcast domain must receive it, so the switch floods it within the VLAN, but never back out of the incoming port."},
  {lvl:2, type:"multi", q:"A Layer 2 switch is forwarding a normal unicast frame between two PCs. Which two fields does it read to learn and to choose the outgoing port? (Choose two.)", o:["Destination MAC address","Source MAC address","Type (EtherType)","Destination IP address in the payload","Preamble"], a:[0,1], why:"The switch learns by recording the source MAC against the incoming port, and forwards by looking up the destination MAC. It carries the Type field and payload unchanged and never reads the IP addresses inside; the preamble only synchronises the port."},
],
cards:[
  {f:"Why does Ethernet need MAC addresses as well as IP?", b:"Devices must talk before they have an IP (DHCP), Ethernet carries many protocols, switches forward on a fixed 48-bit field in hardware, and the layers stay independent."},
  {f:"MAC address size and notation", b:"48 bits = 6 bytes = 12 hex digits. Windows 3C-52-82-1A-7F-09, Linux 3c:52:82:1a:7f:09, Cisco 3c52.821a.7f09."},
  {f:"Convert Windows MAC to Cisco format", b:"Strip the hyphens (12 digits), lower-case, regroup as 3 groups of 4 with dots: 3C-52-82-1A-7F-09 becomes 3c52.821a.7f09."},
  {f:"OUI", b:"Organizationally Unique Identifier: first 24 bits of a universally administered MAC, bought from the IEEE by the manufacturer. Look it up to find the vendor."},
  {f:"I/G bit", b:"Lowest bit of the first byte. 0 = individual (unicast), 1 = group (multicast/broadcast). Odd second hex digit = group."},
  {f:"U/L bit", b:"Second-lowest bit of the first byte. 0 = universally administered (factory OUI), 1 = locally administered. Second hex digit 2, 6, A or E on a unicast = local."},
  {f:"Randomised (private) MAC", b:"A locally administered address the OS invents per Wi-Fi network for privacy (iPhone Private Wi-Fi Address, Android randomised MAC, Windows random hardware addresses). No OUI lookup result."},
  {f:"Broadcast MAC", b:"ffff.ffff.ffff, all 48 bits 1. Every device in the broadcast domain processes it; switches flood it within the VLAN; routers don't forward it."},
  {f:"Multicast MAC ranges", b:"IPv4: 01-00-5E + low 23 bits of the group IP (224.0.0.251 = 01-00-5E-00-00-FB). IPv6: 33-33 + low 32 bits (ff02::1 = 33-33-00-00-00-01)."},
  {f:"BIA vs configured MAC", b:"BIA = burned-in address from the factory. Software can override it. Cisco show interfaces: 'address is' (in use) vs '(bia ...)' (factory)."},
  {f:"What frames does a NIC keep?", b:"Its own unicast MAC, broadcast, and multicast groups it joined; then only if the FCS is good. Promiscuous mode keeps everything the switch sends it."},
  {f:"Which frame fields does a switch use?", b:"Destination MAC (forward, flood or filter), source MAC (learn MAC to port), FCS (drop damaged frames). It never rewrites the MACs."},
  {f:"Cisco commands to find MACs", b:"show version (Base Ethernet MAC), show interfaces (address is ... bia ...), show mac address-table [address H.H.H | interface X] (who is on which port)."},
],
});
// ---------- Module 2 · Lesson 2 ----------
L.push({
id:"sw-learning", mins:65, level:"Beginner · builds on Module 1 and lesson 1",
t:"How a switch thinks: learning, flooding, forwarding and filtering",
html:`
${K.goals([
  "Read a Cisco MAC address table and say what every column means.",
  "Walk through, step by step, what a switch does with any frame: learn the source, then forward, filter or flood.",
  "Predict the MAC table after a sequence of frames, on paper, including aging and a host that moves.",
  "Use <code>show mac address-table</code> and its variants to find which port a device is on, and clear the table safely.",
  "Recognise from the MAC table when someone has plugged an unmanaged switch into a desk port, and explain a MAC flooding attack in one minute.",
])}
${K.pre(["Module 1 (frames, MAC addresses, switches vs routers, your first IOS session over the console) and Module 2 lesson 1 (MAC address format, unicast/broadcast/multicast addresses, the Ethernet frame fields)."])}

<h2>Why this matters at work</h2>
<p>An MSP in Victoria Island, Lagos, gets a ticket: <i>&ldquo;Second-floor printer not working since Friday.&rdquo;</i> The printer answers ping, but nobody knows which wall socket it is in, and the cabling sheet is two office moves out of date. A junior engineer starts walking the floor with a torch. A senior engineer types one command on the switch, reads one line, and says &ldquo;port 17, desk 2-31 — someone moved it to the window.&rdquo;</p>
<p>That command reads the switch's <b>MAC address table</b>: its memory of which device lives behind which port. Every decision a switch makes — send this frame out one port, send it everywhere, or throw it away — comes from that table. Understand how it fills, ages and empties, and you can find any device, explain &ldquo;slow network&rdquo; complaints, spot a rogue switch under a desk, and answer the most common CCNA switching questions without guessing.</p>

<h2>The MAC address table: what the switch remembers</h2>
<p>In Module 1 you saw that a switch forwards frames by MAC address. But how does it know where each MAC is? Nobody types them in. The switch builds its own list, the ${K.g("MAC address table","The switch's list of MAC → port (per VLAN), learned automatically from traffic. Also called the CAM table.")}.</p>
<p>Each row says: &ldquo;the device with this MAC is reachable out of this port.&rdquo; That is all. The switch doesn't know the device's name, its IP address, or whether it is a laptop or a printer — only which port frames <i>from</i> that address arrived on.</p>
<h3>Why engineers call it the CAM table</h3>
<p>On Catalyst switches the table lives in hardware called ${K.g("CAM","Content Addressable Memory: searched by content (give it a MAC, get the port) in one step.")}, so &ldquo;CAM table&rdquo; and &ldquo;MAC address table&rdquo; mean the same thing. Normal memory is like a numbered locker room: give a locker number, get what's inside. CAM works backwards: give it a MAC address and it tells you where it is, comparing every row at once. That is how a switch looks up destinations millions of times a second on every port.</p>
<p>The hardware sets a size limit — typically 8,000–16,000 entries on small access switches, 32,000 or more on bigger ones. An office floor uses a tiny fraction, but an attacker can fill it on purpose, as you'll see later.</p>
<h3>Reading the table, column by column</h3>
<p>Here is a real-format table from an office access switch. You'll produce output like this yourself in the benches.</p>
${K.out(`SW-2F#show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 All    0100.0ccc.cccc    STATIC      CPU
 All    ffff.ffff.ffff    STATIC      CPU
  10    3c52.82a1.0c11    DYNAMIC     Gi1/0/1
  10    3c52.82a1.0c12    DYNAMIC     Gi1/0/2
  10    0011.85fe.2a10    DYNAMIC     Gi1/0/17
  10    0c1a.2b00.0101    DYNAMIC     Gi1/0/24
  10    00aa.bb21.0a01    DYNAMIC     Gi1/0/24
Total Mac Addresses for this criterion: 7`, "show mac address-table on a Catalyst access switch (trimmed: real switches list several more STATIC CPU entries).")}
<ul>
<li><b>Vlan</b> — the ${K.g("VLAN","Virtual LAN: one physical switch split into separate Layer 2 networks, each with its own MAC table and flooding. Module 4.")} the entry belongs to. A switch keeps a separate table per VLAN and floods only within the VLAN a frame arrived in. For now, think of each VLAN as a separate switch inside the box; out of the box every port is in VLAN 1.</li>
<li><b>Mac Address</b> — in Cisco's dotted format, as in lesson 1.</li>
<li><b>Type</b> — <code>DYNAMIC</code>: learned from traffic, forgotten when the device goes quiet. <code>STATIC</code>: fixed, either configured (rare) or built in by the switch.</li>
<li><b>Ports</b> — where frames for that MAC go. <code>CPU</code> means the switch's own processor handles them: <code>ffff.ffff.ffff</code> is broadcast, and <code>0100.0ccc.cccc</code> is a Cisco multicast used by protocols like CDP.</li>
<li><b>Total</b> — how many rows matched; handy when you filter by port or VLAN.</li>
</ul>
<p><code>Gi1/0/24</code> appears twice. It is the ${K.g("uplink","The port connecting an access switch to the rest of the network.")}, and every device beyond it — the router, other floors, servers — is learned on that one port. Many MACs on an uplink is normal. Many MACs on a <i>desk</i> port is a clue you'll use in the on-the-job scenario.</p>
${K.analogy(`<p>Picture a new receptionist who doesn't know where anyone sits. Each time someone walks out of a door to drop off a letter, she notes &ldquo;Mrs Bello came out of door 4.&rdquo; When a letter arrives for Mrs Bello, it goes to door 4. When one arrives for someone she has never seen, she photocopies it and pushes a copy under every door except the one it came from. She is the switch; her notebook is the MAC table.</p>`)}
${K.check({q:"A switch's MAC table shows five different MAC addresses on Gi1/0/24, its link to the core switch. What does that most likely mean?", o:["A loop: the switch is confused","Normal: every device beyond the uplink is learned on that one port","The table is full","Those five devices are plugged directly into Gi1/0/24 with a splitter"], a:1, why:"The switch only knows which of its own ports leads towards a MAC. Everything beyond the uplink is reached through that port, so it is learned there."})}

<h2>What a switch does with every frame</h2>
<p>For every frame, the switch asks two questions, always in this order. <b>Who sent this, and where did it come in?</b> That <i>builds</i> the table. <b>Who is it for, and where do I send it?</b> That <i>uses</i> it.</p>
${K.svg("0 0 720 400",
  K.box(240,8,240,42,"Frame arrives on port P","in VLAN V",true)+
  K.arrow(360,50,360,72)+
  K.box(190,74,340,44,"1. LEARN the source MAC","add or refresh: source MAC → port P, VLAN V · age timer reset",true)+
  K.arrow(360,118,360,140)+
  K.box(240,142,240,40,"2. LOOK UP the destination MAC","")+
  K.arrow(290,182,130,240,"broadcast / multicast")+
  K.arrow(360,182,360,240,"known unicast")+
  K.arrow(430,182,590,240,"unknown unicast")+
  K.box(20,242,220,54,"FLOOD","all ports in VLAN V except P")+
  K.box(260,242,200,40,"Is that port P itself?","")+
  K.box(480,242,220,54,"FLOOD (unknown unicast)","all ports in VLAN V except P")+
  K.arrow(320,282,255,330,"no")+
  K.arrow(400,282,465,330,"yes")+
  K.box(140,332,220,54,"FORWARD","out that one port only",true)+
  K.box(380,332,220,54,"FILTER","drop it: the destination is behind P"),
  "The decision a switch makes for every frame. Learning always happens first, from the source address. Only then does the destination decide forward, filter or flood.")}
<h3>Step 1 — learn from the source</h3>
<p>The switch reads the <b>source MAC</b> and notes the ${K.g("ingress port","The port a frame came in on.")} and VLAN. Then:</p>
<ul>
<li>MAC not in the table → <b>add</b> it (MAC, port, VLAN, DYNAMIC).</li>
<li>Already there on the same port → <b>refresh</b> it: the age timer restarts from zero.</li>
<li>There, but on a <i>different</i> port → the device has moved, so <b>move the entry</b>. One MAC, one VLAN, one port — never two.</li>
</ul>
<p>Learning uses <b>only the source</b>. A frame sent <i>to</i> someone tells you nothing about where they are; only a frame <i>from</i> them does.</p>
<h3>Step 2 — decide from the destination</h3>
<p>Now the switch reads the <b>destination MAC</b> and makes one of three choices.</p>
<p><b>Forward.</b> The destination is a ${K.g("unicast","A frame addressed to exactly one device's MAC.")} MAC in the table (same VLAN) on a different port. The switch sends the frame out of that one port only. This ${K.g("forwarding","Sending a frame out of the single port where its destination was learned.")} is what makes a switch better than a hub: other ports never see the conversation, so they aren't slowed by it and can't easily eavesdrop.</p>
<p><b>Filter.</b> The destination is in the table on the <i>same</i> port the frame arrived on — two devices behind one port, say on a small hub or unmanaged switch. The frame has already reached its destination on that side, so the switch drops it. This is ${K.g("filtering","Dropping a frame whose destination is on the port it arrived on.")}.</p>
<p><b>Flood.</b> The switch sends a copy out of <b>every port in the same VLAN except the one it came in on</b>. ${K.g("Flooding","Sending a frame out of every port in the VLAN except the ingress port.")} happens in three cases:</p>
<ul>
<li>${K.g("Broadcast","A frame to ffff.ffff.ffff, for every device in the VLAN.")} — destination <code>ffff.ffff.ffff</code>, meant for everyone. ARP requests (lesson 4) and DHCP discovers are broadcasts.</li>
<li>${K.g("Unknown unicast","A unicast frame whose destination MAC isn't in the table, so it is flooded.")} — the switch has no idea which port leads there, so it plays safe and sends it everywhere. The destination answers, the switch learns it from the answer, and later frames are forwarded, not flooded.</li>
<li>${K.g("Multicast","A frame to a group of devices (IPv4 multicast MACs start 0100.5e). Used for video, routing protocols and discovery.")} — by the basic rule, treated like broadcast and flooded. ${K.g("IGMP snooping","Lets a switch send multicast only to ports that joined the group. On by default on Catalyst.")} lets a switch send multicast only to ports that asked for it; for the CCNA, just know it exists.</li>
</ul>
<p>Two things never happen: a flooded frame is <b>never sent back out its ingress port</b>, and it <b>never crosses into another VLAN</b> — that needs a router (Module 4).</p>
${K.remember(`<b>&ldquo;Source teaches, destination decides.&rdquo;</b> Then: <b>known → Forward · same port → Filter · unknown, broadcast or multicast → Flood</b> — and a flood goes everywhere in the VLAN <i>except home</i>.`)}
${K.dyk(`Switches are ${K.g("transparent bridges","The IEEE term: a switch learns and forwards without hosts knowing it exists.")}: PCs never know a switch is there. A PC addresses its frame to the destination's MAC, not the switch's, and the switch passes it on unchanged. That is why you can swap a hub for a switch without changing a single setting on any computer.`)}
${K.exam(`Update the table <b>first</b> (from the source), then decide. Two traps: a flooded frame never goes back out the ingress port, and flooding stays inside the frame's VLAN. Older switches used <code>show mac-address-table</code> (with a hyphen); current IOS uses <code>show mac address-table</code>.`)}
${K.check({q:"A frame from MAC 0000.0000.000a arrives on Gi0/1. Its destination, 0000.0000.000b, is in the table on Gi0/1 too. What does the switch do?", o:["Forwards it out Gi0/1","Floods it out every port except Gi0/1","Filters (drops) it","Floods it out every port including Gi0/1"], a:2, why:"The destination is on the port the frame arrived on, so it has already reached that segment (through a hub or small switch on that port). The switch filters it."})}
${K.q({type:"order", q:"Put the switch's handling of one arriving frame in the correct order.", items:["The frame arrives on a port in a VLAN","The switch reads the source MAC and adds or refreshes it in the table against that port and VLAN","The switch looks up the destination MAC in that VLAN's table","The switch forwards out one port, filters, or floods out every other port in the VLAN"], why:"Learning always comes first and uses only the source address. Then the destination lookup decides: forward (known, other port), filter (known, same port) or flood (broadcast, multicast or unknown unicast)."})}

<h2>Worked example: four hosts, one switch, five frames</h2>
<p>The best way to understand learning is on paper, frame by frame. This switch has just booted — perhaps after a power cut — so its table is empty. To keep addresses readable, each host's MAC ends in its letter:</p>
${K.svg("0 0 720 300",
  K.dev("switch",360,64,"SW1","table empty at start")+
  K.dev("pc",90,220,"Host A","0000.0000.000a")+K.dev("pc",270,220,"Host B","0000.0000.000b")+
  K.dev("pc",450,220,"Host C","0000.0000.000c")+K.dev("pc",630,220,"Host D","0000.0000.000d")+
  K.link(340,76,96,198,"Gi0/1")+K.link(352,76,272,198,"Gi0/2")+K.link(368,76,448,198,"Gi0/3")+K.link(380,76,624,198,"Gi0/4")+
  K.arrow(150,170,300,88,"",true)+K.txt(150,98,"frame 1: A → B",{c:"accent",s:10.5,mid:true})+
  K.arrow(390,92,282,186,"",true)+K.arrow(400,92,452,186,"",true)+K.arrow(410,92,606,186,"",true)+
  K.txt(20,24,"Frame 1: switch learns A on Gi0/1.",{c:"fg",s:11.5})+
  K.txt(20,40,"B is unknown → flooded out Gi0/2, Gi0/3, Gi0/4.",{c:"fg",s:11.5})+
  K.txt(470,24,"C and D receive it, see it is not",{s:11})+
  K.txt(470,40,"their MAC, and ignore it.",{s:11}),
  "Frame 1 of the walk-through: an unknown unicast. The switch learns the sender's port and floods the frame to every other port; only B keeps it.")}
${K.steps([
  ["Frame 1 — A sends to B", `<p><b>Learn:</b> A on Gi0/1 → add it. <b>Decide:</b> B isn't in the table → unknown unicast → <b>flood</b> out Gi0/2, Gi0/3, Gi0/4. B keeps it; C and D discard it.</p><p>Table: <code>A Gi0/1</code></p>`],
  ["Frame 2 — B replies to A", `<p><b>Learn:</b> B on Gi0/2 → add it. <b>Decide:</b> A is known on Gi0/1 → <b>forward</b> out Gi0/1 only. C and D never see it.</p><p>Table: <code>A Gi0/1 · B Gi0/2</code></p>`],
  ["Frame 3 — C sends a broadcast (an ARP request)", `<p><b>Learn:</b> C on Gi0/3 → add it. <b>Decide:</b> <code>ffff.ffff.ffff</code> → <b>flood</b> out Gi0/1, Gi0/2, Gi0/4. Broadcasts are always flooded, however full the table.</p><p>Table: <code>A Gi0/1 · B Gi0/2 · C Gi0/3</code></p>`],
  ["Frame 4 — A sends to C", `<p><b>Learn:</b> A is already on Gi0/1 → <b>refresh</b> its timer. <b>Decide:</b> C is known on Gi0/3 → <b>forward</b> out Gi0/3 only.</p><p>Table: unchanged.</p>`],
  ["Frame 5 — D sends to B", `<p><b>Learn:</b> D on Gi0/4 → add it. <b>Decide:</b> B is known on Gi0/2 → <b>forward</b> out Gi0/2 only.</p><p>Table: <code>A Gi0/1 · B Gi0/2 · C Gi0/3 · D Gi0/4</code> — complete after five frames, only two of them flooded.</p>`],
])}
<p>Notice two things. D was <b>silent</b> until frame 5, so it wasn't in the table, even though it was plugged in and on: a switch knows only devices that have <i>sent</i> something. And flooding stopped by itself: each flood made the destination reply, and each reply taught the switch where it lives. That is why switches need no configuration to work.</p>
${K.tip(`In practice a host's first frame is usually an ARP broadcast (lesson 4), so the switch learns it the moment it starts talking. Very quiet devices — some printers, cameras, badge readers — age out and get flooded to now and then. That is normal.`)}
<h3>Try it yourself: continue the walk-through on paper</h3>
<p>Start from the table after frame 5. Now a small hub is plugged into <b>Gi0/5</b>, with two new hosts on it, <b>E</b> (<code>…000e</code>) and <b>F</b> (<code>…000f</code>). For each event, write what the switch learns, what it does (forward, filter or flood — out of which ports), and the table afterwards.</p>
<ol>
<li>E sends a frame to F.</li>
<li>F replies to E.</li>
<li>B sends a broadcast.</li>
<li>Host A is unplugged from Gi0/1, plugged into Gi0/6, and sends a frame to D.</li>
<li>Six minutes pass. Every host keeps talking except C, which sends nothing. Then D sends a frame to C.</li>
</ol>
${K.hint(`For each frame: learn from the <b>source</b> first (new entry, refresh, or move), then look up the <b>destination</b>. For event 2, ask where E was learned — and where F's frame came in. For event 5, the default aging time is 300 seconds (5 minutes).`)}
${K.reveal("Show the answers",`<ol>
<li><b>E → F.</b> Learn <code>E · Gi0/5</code>. F unknown → flood out Gi0/1–Gi0/4 (not Gi0/5). F already got it: the hub repeated it. Table: A1, B2, C3, D4, E5.</li>
<li><b>F → E.</b> Learn <code>F · Gi0/5</code>. E is on Gi0/5, the arrival port → <b>filter</b>. E already got it through the hub. Table now has two MACs on Gi0/5 — the clue that something sits behind that port.</li>
<li><b>B → broadcast.</b> Refresh B. Flood out Gi0/1, Gi0/3, Gi0/4, Gi0/5 (E and F both get it via the hub).</li>
<li><b>A moves to Gi0/6.</b> Pulling A's cable takes Gi0/1 down, which deletes its entries. A's first frame on Gi0/6 creates <code>A · Gi0/6</code> (had the old entry survived, it would be <b>moved</b>: one MAC, one port per VLAN). D is known → forward out Gi0/4.</li>
<li><b>C ages out.</b> Silent for over 300 seconds, so its entry is gone. D → C is an <b>unknown unicast</b> → flood out every port except Gi0/4. C's reply re-learns it on Gi0/3.</li>
</ol>`)}
${K.check({q:"A switch has just rebooted after a power cut. A PC sends its first frame, to the file server. What does the switch do with that frame?", o:["Drops it until the table is built","Forwards it to the server's port, which it remembers from before the reboot","Learns the PC's port, then floods the frame out every other port in the VLAN","Sends it only to the uplink"], a:2, why:"Dynamic entries live in memory and are lost on restart. The empty table means the switch learns the source and floods the frame as an unknown unicast; the server's reply teaches it the server's port."})}

<h2>Keeping the table current: aging, moves, clearing — and a full table</h2>
<p>If a switch only ever added entries, the table would fill with devices that left months ago, and a laptop moved to another desk would keep getting frames on its old port. So the table cleans itself.</p>
<h3>Aging: 300 seconds by default</h3>
<p>Every dynamic entry has an ${K.g("aging time","How long an entry survives without a frame from that source. Catalyst default: 300 seconds.")}: <b>300 seconds</b> (5 minutes) by default on Catalyst. Each frame <i>from</i> that MAC resets the timer. After 300 seconds of silence the entry is deleted, and frames <i>to</i> that MAC are flooded as unknown unicasts until it speaks again. The global command <code>mac address-table aging-time</code> changes it, but leave the default unless a design gives you a reason.</p>
<h3>When a device moves</h3>
<p>Two things keep the table right when people move desks:</p>
<ul>
<li><b>Link down flushes the port.</b> Cable pulled or PC off: the switch deletes the dynamic entries on that port at once.</li>
<li><b>A MAC seen on a new port moves.</b> A frame from a known MAC on a different port updates the entry immediately — this matters when the old port stays up, such as a laptop moved off a desk hub to a wall socket.</li>
</ul>
<p>If one MAC jumps between two ports many times a second, Catalyst logs <code>%SW_MATM-4-MACFLAP_NOTIF: Host 3c52.82a1.0c11 in vlan 10 is flapping between port Gi1/0/5 and port Gi1/0/7</code>. That isn't desk moving; it usually means a ${K.g("switching loop","Redundant paths that let frames circle forever until the network stops. Spanning Tree prevents it.")}, which you'll study with Spanning Tree later.</p>
<h3>Reading and clearing the table on purpose</h3>
<p>The variants narrow the output, which matters on a switch with hundreds of entries:</p>
<div class="tablewrap"><table>
<tr><th>Command</th><th>Shows</th></tr>
<tr><td><code>show mac address-table</code></td><td>Every entry, static CPU entries included</td></tr>
<tr><td><code>show mac address-table dynamic</code></td><td>Only learned entries</td></tr>
<tr><td><code>show mac address-table address 0011.85fe.2a10</code></td><td>The port for one MAC — &ldquo;where is this device?&rdquo;</td></tr>
<tr><td><code>show mac address-table interface Gi0/7</code></td><td>Every MAC on one port — &ldquo;what is behind this socket?&rdquo;</td></tr>
<tr><td><code>show mac address-table vlan 20</code></td><td>Every entry in one VLAN</td></tr>
<tr><td><code>clear mac address-table dynamic</code></td><td>Deletes all dynamic entries; the switch re-learns</td></tr>
</table></div>
<p>Real switches also accept <code>address</code>, <code>interface</code> or <code>vlan</code> after the clear command, to clear part of the table, and <code>| include</code> to filter output.</p>
${K.when([
  ["<code>... address &lt;mac&gt;</code>","You know the MAC (from <code>ipconfig /all</code>, a label or ARP) and need the port","Goes straight to the one row","You only know the IP — get the MAC from ARP first"],
  ["<code>... interface &lt;port&gt;</code>","You want to know what's behind a socket","Shows one PC, a phone plus PC, or a hidden switch","It's an uplink — dozens of MACs are normal there"],
  ["<code>clear ... dynamic</code>","Testing, or after re-cabling, to force fresh learning","No reboot needed","A busy core switch in working hours — everything floods until it re-learns"],
], "Which MAC table command, and when")}
<h3>Practise the commands</h3>
<p>This HR-floor switch already has a full table: desk PCs, a printer, the core uplink, and one port with something odd behind it. Explore it, then clear it and see what comes back first.</p>
${K.hint(`Show commands work at the <code>#</code> prompt, so start with <code>enable</code>. Abbreviations work: <code>sh mac add d</code> is <code>show mac address-table dynamic</code>. Interfaces can be typed short: <code>gi0/7</code>.`)}
${K.term({env:"ios2", title:"read the MAC table on SW-HR-2F", opts:{kind:"switch", host:"SW-HR-2F", model:"C9200L-24P-4G",
  motd:"SW-HR-2F — console session. HR floor access switch. Gi0/10 is the uplink to CORE-SW."},
  setup:env=>{
    const T0 = [
      [10,"3c52.82a1.0c11","Gi0/1",1],[10,"3c52.82a1.0c12","Gi0/2",0],[10,"e4b9.7a3d.5501","Gi0/3",0],[20,"0011.85fe.2a10","Gi0/5",0],
      [10,"3c52.82a1.1b07","Gi0/7",1],[10,"6c4b.9020.aa31","Gi0/7",0],[10,"a4bb.6d55.0192","Gi0/7",0],[10,"f018.98c2.4e70","Gi0/7",0],[10,"0c9d.92b1.77d3","Gi0/7",0],
      [10,"0c1a.2b00.0101","Gi0/10",1],[10,"00aa.bb21.0a01","Gi0/10",0],[10,"5c26.0a11.93e4","Gi0/10",0],[10,"b8ca.3a7f.21c0","Gi0/10",0],
      [20,"0c1a.2b00.0102","Gi0/10",1],[20,"00aa.bb21.0a14","Gi0/10",0]];
    let T = T0.slice(), relearn = false;
    env.macCleared = 0; env.macSeen = [];
    const run = env.exec;
    env.exec = line => {
      const o = run(line);
      if (typeof o!=="string") return o;
      const t = String(line).trim().toLowerCase().split(/\s+/); if (t[0]==="do") t.shift();
      if (o==="" && /^cl/.test(t[0]||"") && /^m/.test(t[1]||"")){ T = []; relearn = true; env.macCleared++; return o; }
      if (o.indexOf("Mac Address Table")<0) return o;
      if (relearn){ T = T0.filter(r=>r[3]); relearn = false; }
      const f = t[3]||"", arg = t.slice(4).join("");
      let rows = T.slice(), port = null;
      if (/^a/.test(f)) rows = rows.filter(r=>r[1]===arg);
      else if (/^i/.test(f)){ const m = arg.match(/^g[a-z]*(\d+\/\d+)$/); port = m ? "Gi"+m[1] : null; rows = rows.filter(r=>r[2]===port); }
      else if (/^v/.test(f)) rows = rows.filter(r=>r[0]===+arg);
      env.macSeen.push({f, arg, port, afterClear: env.macCleared>0});
      rows.sort((a,b)=>a[0]-b[0] || (+a[2].split("/")[1])-(+b[2].split("/")[1]));
      let s = "          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n";
      if (!f) s += " All    0100.0ccc.cccc    STATIC      CPU\n All    ffff.ffff.ffff    STATIC      CPU\n";
      for (const r of rows) s += (" "+r[0]).padEnd(8) + r[1].padEnd(18) + "DYNAMIC".padEnd(12) + r[2] + "\n";
      return s + "Total Mac Addresses for this criterion: " + (rows.length + (f?0:2));
    };
  },
  intro:"A Catalyst access switch with a table already learned. Use <code>enable</code>, then the show commands. Everything here is read-only except the clear.",
  tasks:[
    {text:"<code>enable</code>, then <code>show mac address-table</code> — spot the STATIC CPU rows and the uplink Gi0/10", done:e=>e.macSeen.some(s=>!s.f)},
    {text:"Hide the static rows with <code>show mac address-table dynamic</code>", done:e=>e.macSeen.some(s=>/^d/.test(s.f))},
    {text:"The HR printer's MAC is <code>0011.85fe.2a10</code>. Find its port with <code>show mac address-table address 0011.85fe.2a10</code>", done:e=>e.macSeen.some(s=>/^a/.test(s.f) && s.arg==="0011.85fe.2a10")},
    {text:"Gi0/7 is one desk socket. See what's behind it: <code>show mac address-table interface gi0/7</code> — how many MACs?", done:e=>e.macSeen.some(s=>/^i/.test(s.f) && s.port==="Gi0/7")},
    {text:"List only VLAN 20 with <code>show mac address-table vlan 20</code>", done:e=>e.macSeen.some(s=>/^v/.test(s.f) && s.arg==="20")},
    {text:"Clear the learned entries: <code>clear mac address-table dynamic</code>", done:e=>e.macCleared>0},
    {text:"Run <code>show mac address-table dynamic</code> again — which entries are already back, and why those?", done:e=>e.macSeen.some(s=>s.afterClear && /^d/.test(s.f))},
  ],
  win:"You found a device by MAC, counted what's behind a socket, filtered by VLAN, and watched the busiest talkers (the gateway and active PCs) re-learn within seconds of a clear.",
  solve:["enable","show mac address-table","show mac address-table dynamic","show mac address-table address 0011.85fe.2a10","show mac address-table interface gi0/7","show mac address-table vlan 20","clear mac address-table dynamic","show mac address-table dynamic"]})}
<p>Did you count <b>five MACs on Gi0/7</b>? A desk socket normally shows one MAC, or two with an IP phone between wall and PC. Five means a small switch is hiding under that desk. After the clear, the first entries back were the gateway and the busiest hosts, because they send constantly; quiet devices return when they next speak.</p>
${K.mistake(`Treating two MACs on a desk port as a fault. An <b>IP phone with a PC plugged into it</b> shows two MACs, usually in two VLANs (voice and data) — normal and by design. Five or forty is not.`)}
<h3>When the table fills up: the MAC flooding attack</h3>
<p>The CAM table has a fixed size. Imagine someone plugs a laptop into a spare socket and runs a tool sending thousands of frames a second, each with a made-up source MAC. The switch learns every one, and within seconds the table is full.</p>
<p>Now real devices can't be added, so frames <i>to</i> them become unknown unicasts — flooded out every port, including the attacker's. The switch has turned itself into a hub, and the attacker can capture other people's traffic. This is a ${K.g("MAC flooding attack","Filling the MAC table with fake source MACs so real traffic is flooded to every port, including the attacker's.")}. The defence, ${K.g("port security","Limits how many MACs a port may learn, and acts (for example, shuts the port) when the limit is broken.")}, limits MACs per port; you'll configure it in the security module. Remember the chain: <b>table full → can't learn → unknown unicast → flood → eavesdropping</b>.</p>
${K.myth([
  ["A switch learns MAC addresses from the destination field.","Only from the <b>source</b>. A frame addressed <i>to</i> someone says nothing about where they are."],
  ["A switch sends every frame to every port, like a hub.","It floods only broadcasts, multicasts (without IGMP snooping) and unknown unicasts. Known unicasts go out one port; same-port frames are filtered."],
  ["Unknown unicast flooding means something is broken.","Brief flooding is normal after a reboot, a clear or aging. Constant heavy flooding is the warning sign: a full table, an attack or a loop."],
  ["If a device is plugged in and on, it is in the MAC table.","Only devices that have <b>sent</b> a frame in the last 300 seconds are."],
  ["You must configure a switch with its devices' MAC addresses.","It learns them automatically. Static entries exist but are rare."],
])}
${K.check({q:"An attacker floods a switch with frames from thousands of fake source MACs until the table is full. A user's PC then sends a frame to a server that the switch has not yet learned. What happens to that frame?", o:["It is dropped because the table is full","It is flooded out every port in the VLAN, including the attacker's","It is forwarded to the server's port using the IP address","The switch reboots to clear the table"], a:1, why:"With no room to learn the server, frames to it stay unknown unicasts and are flooded — to the attacker too, which is the point of the attack. Port security stops it."})}
${K.q({type:"match", q:"Match each situation with what the switch does with the frame.", pairs:[["Destination is in the table on another port","Forward out that one port"],["Destination is in the table on the arrival port","Filter (drop) it"],["Destination is not in the table","Flood as unknown unicast"],["Destination is ffff.ffff.ffff","Flood as a broadcast"],["A frame arrives from a MAC already learned on a different port","Move the entry to the new port"]], why:"Learning comes first: a known MAC on a new port is moved, never duplicated. Then the destination decides: known on another port means forward; same port means filter; unknown or broadcast means flood to every port in the VLAN except the ingress port."})}

<h2>How fast does it send? Store-and-forward vs cut-through</h2>
<p>One more decision: <i>when</i> to start sending the frame out.</p>
<p>A ${K.g("store-and-forward","Receive the whole frame, check the FCS, forward only if it is error-free.")} switch waits for the <b>whole frame</b> and checks the ${K.g("FCS","Frame Check Sequence: the 4-byte error check at the end of every Ethernet frame.")} you met in Module 1. Damaged frames are discarded; only good ones are forwarded. Catalyst access and distribution switches, the ones you'll meet in offices, work this way.</p>
<p>A ${K.g("cut-through","Start forwarding once the destination MAC is read. Lower delay, but damaged frames are forwarded too.")} switch starts sending as soon as it has read the <b>destination MAC</b>, the first 6 bytes of the frame. Less delay, but damaged frames are passed on for the receiver to discard. Low-latency data-centre switches often use it. ${K.g("Fragment-free","Waits for the first 64 bytes, so collision fragments are dropped.")} waits for the first 64 bytes, catching the fragments collisions caused on old shared Ethernet.</p>
${K.when([
  ["Store-and-forward","Normal LANs: offices, campuses, branches","Drops bad frames at the first switch; handles different in/out port speeds","Every microsecond matters (trading, some data-centre fabrics)"],
  ["Cut-through","Low-latency data-centre networks with clean links","Lowest delay","Links with errors — bad frames travel every hop"],
  ["Fragment-free","Mostly history: shared, half-duplex segments","Drops collision fragments","Modern full-duplex networks"],
], "Switching methods")}
${K.exam(`Store-and-forward checks the FCS and drops errored frames; cut-through reads only the destination MAC first, so it is faster but forwards errored frames. &ldquo;Frames with CRC errors were forwarded to the next switch&rdquo; = cut-through.`)}
${K.check({q:"A network shows the same CRC errors on every switch along a path, not just on the link where a bad cable is. Which switching method would explain that?", o:["Store-and-forward","Cut-through","Fragment-free on a full-duplex link","Port security"], a:1, why:"Cut-through starts sending before the FCS arrives, so it can't drop a damaged frame; the damage shows up at every later hop. Store-and-forward would discard it at the first switch."})}

<h2>Hands-on: watch a switch learn</h2>
<p>Now watch it happen. This bench has a switch, four PCs already cabled and addressed, and a laptop for the console. The frame log (&ldquo;What just happened on the wire&rdquo;) is open, so after each ping you can read what the switch learned and whether it forwarded or flooded each frame. Amber dots are broadcasts; teal dots are unicasts.</p>
${K.bench({id:"m2-mac-learn", points:70, from:"CCNA · Module 2 · lesson 2", title:"watch the MAC table fill, clear and re-learn", viewBox:"0 0 760 370", openLog:true,
  intro:"Plug the console cable from the laptop's USB port to the switch's CON port, open the Terminal app with the right serial settings, then use each PC's Command Prompt to make traffic. PC MACs end in 1111, 2222, 3333 and 4444 so you can spot them in the table.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · office floor", x:170, y:20,
      setup:d=>{ const e = d.env, run = e.exec; e.seen = [];
        e.exec = line => { const o = run(line); const t = String(line).trim().split(/\s+/); if (/^do$/i.test(t[0]||"")) t.shift();
          if (o==="" && /^cl/i.test(t[0]||"") && /^m/i.test(t[1]||"")) e.seen.push({clear:true});
          else if (typeof o==="string" && o.indexOf("Mac Address Table")>-1) e.seen.push({line:String(line), f:(t[3]||"").toLowerCase(), rows:[...o.matchAll(/^\s*\d+\s+([0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})\s+DYNAMIC\s+(\S+)/gm)].map(m=>({mac:m[1], port:m[2]}))});
          return o; }; }},
    {id:"pc1", kind:"pc", label:"PC1", x:40, y:250, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d00.1111"},
    {id:"pc2", kind:"pc", label:"PC2", x:210, y:250, ip:"192.168.10.12", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d00.2222"},
    {id:"pc3", kind:"pc", label:"PC3", x:380, y:250, ip:"192.168.10.13", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d00.3333"},
    {id:"pc4", kind:"pc", label:"PC4", x:550, y:250, ip:"192.168.10.14", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d00.4444"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:630, y:120},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw1:g3"}, {type:"cat6", a:"pc4:eth", b:"sw1:g4"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into SW1: console cable laptop USB → SW1 CON, then the Terminal app at 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control", done:B=>Bench.consoleOk(B,"sw1")},
    {text:"Before any PC sends anything: <code>enable</code>, then <code>show mac address-table dynamic</code> — the table is empty", done:B=>B.devs.sw1.env.seen.some(s=>s.rows && !/^[aiv]/.test(s.f) && s.rows.length===0)},
    {text:"From PC1's Command Prompt, <code>ping 192.168.10.12</code> (PC2). Read the frame log: the ARP broadcast is flooded, the replies are forwarded", done:B=>Bench.pinged(B,"pc1","192.168.10.12")},
    {text:"On SW1, <code>show mac address-table dynamic</code> again — exactly 2 entries: PC1 on Gi0/1 and PC2 on Gi0/2", done:B=>B.devs.sw1.env.seen.some(s=>s.rows && s.rows.length===2 && s.rows.some(r=>r.mac==="a4bb.6d00.1111" && r.port==="Gi0/1") && s.rows.some(r=>r.mac==="a4bb.6d00.2222" && r.port==="Gi0/2"))},
    {text:"From PC1, <code>ping 192.168.10.13</code> (PC3), then show the table — 3 entries now", done:B=>Bench.pinged(B,"pc1","192.168.10.13") && B.devs.sw1.env.seen.some(s=>s.rows && s.rows.length===3 && s.rows.some(r=>r.mac==="a4bb.6d00.3333" && r.port==="Gi0/3"))},
    {text:"Look for PC4 with <code>show mac address-table address a4bb.6d00.4444</code> — the switch returns no entries at all (Total: 0), because PC4 has never sent a frame", done:B=>B.devs.sw1.env.seen.some(s=>s.rows && /4444/.test(s.line) && s.rows.length===0)},
    {text:"<code>clear mac address-table dynamic</code>, then show the dynamic table — empty again", done:B=>{ const s = B.devs.sw1.env.seen, i = s.findIndex(x=>x.clear); return i>-1 && s.slice(i+1).some(x=>x.rows && !/^[aiv]/.test(x.f) && x.rows.length===0); }},
    {text:"From PC1, ping PC2 again, then show the table. PC1 still has PC2's MAC cached, so there's no ARP this time — find the <i>unknown unicast</i> flood in the log. Table: PC1 and PC2 only", done:B=>{ const s = B.devs.sw1.env.seen, i = s.findIndex(x=>x.clear); return i>-1 && s.slice(i+1).some(x=>x.rows && x.rows.length===2 && x.rows.some(r=>r.mac==="a4bb.6d00.1111") && x.rows.some(r=>r.mac==="a4bb.6d00.2222")); }},
  ],
  win:"You watched a switch learn from source addresses only, saw a silent host stay invisible, cleared the table and caught an unknown unicast being flooded — the whole lesson, live.",
  solve:[["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","show mac address-table dynamic"],["pc","pc1","ping 192.168.10.12"],["term","show mac address-table dynamic"],
    ["pc","pc1","ping 192.168.10.13"],["term","show mac address-table dynamic"],["term","show mac address-table address a4bb.6d00.4444"],
    ["term","clear mac address-table dynamic"],["term","show mac address-table dynamic"],["pc","pc1","ping 192.168.10.12"],["term","show mac address-table dynamic"]]})}
${K.hint(`<code>% Invalid input</code> on <code>show mac address-table</code>? Check the prompt: at <code>SW1&gt;</code> you're in user EXEC; type <code>enable</code> to get <code>SW1#</code>. Garbage characters in the terminal mean wrong serial settings — close the session and fix speed and flow control.`)}
<p>After the first ping, the log shows the ARP broadcast flooded to PC2, PC3 and PC4, then PC2's reply forwarded to PC1 alone; every echo after that goes out one port. After the clear, the switch &ldquo;doesn't know&rdquo; PC2 and floods PC1's echo request to all three other PCs, and PC3 and PC4 ignore it. That is unknown unicast flooding, in front of you.</p>
<h3>Bench 2: many MACs on one uplink</h3>
<p>Two switches in a row: PC1 and PC2 on SW1, PC3 and PC4 on SW2, joined by a copper uplink on port 8. To SW1, PC3 and PC4 are both &ldquo;out of Gi0/8&rdquo; — it can't see past the other switch.</p>
${K.bench({id:"m2-uplink-macs", points:40, from:"CCNA · Module 2 · lesson 2", title:"two switches: learning across an uplink", viewBox:"0 0 760 400", openLog:true,
  intro:"Console into SW1 only. Make PC1 and PC2 talk to the PCs on SW2, then look at where SW1 has learned them.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · floor 1", x:10, y:20,
      setup:d=>{ const e = d.env, run = e.exec; e.seen = [];
        e.exec = line => { const o = run(line); const t = String(line).trim().split(/\s+/); if (/^do$/i.test(t[0]||"")) t.shift();
          if (typeof o==="string" && o.indexOf("Mac Address Table")>-1) e.seen.push({line:String(line), f:(t[3]||"").toLowerCase(), rows:[...o.matchAll(/^\s*\d+\s+([0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})\s+DYNAMIC\s+(\S+)/gm)].map(m=>({mac:m[1], port:m[2]}))});
          return o; }; }},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · floor 2", x:330, y:160},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:20, y:150},
    {id:"pc1", kind:"pc", label:"PC1", x:150, y:290, ip:"10.20.0.11", mask:"255.255.255.0", gw:"10.20.0.1", mac:"b8ca.3a10.0001"},
    {id:"pc2", kind:"pc", label:"PC2", x:280, y:290, ip:"10.20.0.12", mask:"255.255.255.0", gw:"10.20.0.1", mac:"b8ca.3a10.0002"},
    {id:"pc3", kind:"pc", label:"PC3", x:480, y:290, ip:"10.20.0.13", mask:"255.255.255.0", gw:"10.20.0.1", mac:"b8ca.3a20.0003"},
    {id:"pc4", kind:"pc", label:"PC4", x:620, y:290, ip:"10.20.0.14", mask:"255.255.255.0", gw:"10.20.0.1", mac:"b8ca.3a20.0004"},
  ],
  cables:[ {type:"cat6", a:"sw1:g8", b:"sw2:g8"}, {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw2:g3"}, {type:"cat6", a:"pc4:eth", b:"sw2:g4"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into SW1 from the laptop (9600 8N1, no flow control)", done:B=>Bench.consoleOk(B,"sw1")},
    {text:"From PC1, <code>ping 10.20.0.13</code> (PC3, on the other switch)", done:B=>Bench.pinged(B,"pc1","10.20.0.13")},
    {text:"From PC2, <code>ping 10.20.0.14</code> (PC4)", done:B=>Bench.pinged(B,"pc2","10.20.0.14")},
    {text:"On SW1, <code>show mac address-table dynamic</code> — four entries, and PC3 and PC4 are both on Gi0/8", done:B=>B.devs.sw1.env.seen.some(s=>s.rows && s.rows.length===4 && s.rows.some(r=>r.mac==="b8ca.3a20.0003" && r.port==="Gi0/8") && s.rows.some(r=>r.mac==="b8ca.3a20.0004" && r.port==="Gi0/8"))},
    {text:"Show just the uplink: <code>show mac address-table interface gi0/8</code>", done:B=>B.devs.sw1.env.seen.some(s=>s.rows && /^i/.test(s.f) && s.rows.length>=2 && s.rows.every(r=>r.port==="Gi0/8"))},
  ],
  win:"SW1 learned two hosts it has never been directly connected to, both on its uplink. On a real network that uplink would show every MAC beyond it — dozens or hundreds — and that is normal.",
  solve:[["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["pc","pc1","ping 10.20.0.13"],["pc","pc2","ping 10.20.0.14"],["term","show mac address-table dynamic"],["term","show mac address-table interface gi0/8"]]})}
<p>SW1's table is a signpost, not a map: it says &ldquo;PC3 is <i>that way</i>&rdquo;, not &ldquo;PC3 is on SW2 port 3&rdquo;. To find PC3's socket you'd run the same <code>address</code> command on SW2 — exactly what happens in the case study below.</p>
${K.dodont([
  "Use <code>show mac address-table address</code> to find a device's port before walking the floor.",
  "Follow a MAC across uplinks, switch by switch, until it lands on an access port.",
  "Expect one MAC per desk port (two with an IP phone) and investigate anything more.",
  "Update the cabling record whenever the MAC table proves it wrong.",
],[
  "Don't clear the whole table on a busy core switch in working hours &ldquo;to fix it&rdquo; — it floods everything and fixes nothing.",
  "Don't expect a silent device to be in the table; ping it first.",
  "Don't treat many MACs on an <i>uplink</i> as a problem.",
  "Don't change the 300-second aging time without a design reason.",
])}

${K.job("“The HR corner is slow” — and Gi1/0/14 has seven MACs",`
<p><b>The ticket.</b> &ldquo;HR, 2nd floor, Lagos office. Ngozi and two new interns say the network has been very slow since Monday. Others on the floor are fine.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Which desks?&rdquo; — <i>&ldquo;Ngozi's, 2-14; the interns sit with her.&rdquo;</i> &ldquo;How many wall sockets there?&rdquo; — <i>&ldquo;One. The interns connect through a little box.&rdquo;</i> Three affected people sharing one socket and &ldquo;a little box&rdquo;: that's your lead.</p>
<p><b>Checks.</b> The cabling sheet maps desk 2-14 to <code>Gi1/0/14</code> on SW-HR-2F:</p>
${K.out(`SW-HR-2F#show mac address-table interface Gi1/0/14
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    3c52.82a1.1b07    DYNAMIC     Gi1/0/14
  10    6c4b.9020.aa31    DYNAMIC     Gi1/0/14
  10    a4bb.6d55.0192    DYNAMIC     Gi1/0/14
  10    f018.98c2.4e70    DYNAMIC     Gi1/0/14
  10    0c9d.92b1.77d3    DYNAMIC     Gi1/0/14
  10    1c69.7a0e.33b2    DYNAMIC     Gi1/0/14
  10    58ef.68c4.0a19    DYNAMIC     Gi1/0/14
Total Mac Addresses for this criterion: 7`, "Seven MACs learned on one desk port: there is a switch (or hub) behind it.")}
<p>Seven MACs on a desk port: three laptops, a personal printer, a desktop PC, a scanner and a small NAS drive. <code>show interfaces status</code> shows the port at <code>a-full a-100</code> while its neighbours run <code>a-1000</code> — from Module 1, that means the far end can only do 100 Mb/s. The box is an old 10/100 unmanaged switch, and seven devices share one 100 Mb/s link. That is the slowness.</p>
<p><b>The fix.</b> Policy says no unmanaged switches on desks: they bypass port security, and one looped cable can take down the floor. The desk has a second unused outlet (2-15) and there is a spare at 2-17. You patch them to spare ports <code>Gi1/0/21</code> and <code>Gi1/0/22</code>, set a <code>description</code>, <code>no shutdown</code> and save, then plug Ngozi straight into 2-14. The little switch goes back to the HR manager with a note. <code>show mac address-table interface Gi1/0/14</code> now shows one MAC, at <code>a-1000</code>.</p>
<p><b>What you say.</b> &ldquo;A small extra switch under the desk was sharing one slow connection between seven devices. You each have your own full-speed connection now. If you need more sockets, raise a ticket and we'll patch them properly.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;HR 2-14 slow. sh mac address-table int Gi1/0/14 = 7 MACs; port a-100. Cause: unmanaged 10/100 switch under desk, 3 laptops + printer + PC + scanner + NAS on one 100 Mb link. Removed (returned to HR manager, policy reminder sent). Patched 2-15 → Gi1/0/21, 2-17 → Gi1/0/22, descriptions set, saved. Verified 1 MAC per port, a-full a-1000, files open normally. Cabling sheet updated. 40 min.&rdquo;</i></p>`)}

${K.case("The teller who moved desks: finding devices when the paperwork is wrong",`
<p>A bank branch in Wuse, Abuja, re-arranged its banking hall over a weekend. On Monday, an engineer from the bank's MSP was asked to move teller 3's PC into the cashier VLAN. The spreadsheet said <code>Gi1/0/12</code> on the hall switch — but <code>show mac address-table interface Gi1/0/12</code> showed a MAC that wasn't teller 3's. It was the queue-ticket kiosk, moved into that socket. The engineer had nearly reconfigured the wrong port.</p>
<p>So the engineer used the switch, not the spreadsheet. <code>ipconfig /all</code> on teller 3's PC gave <code>3C-52-82-1A-7F-09</code>, which is <code>3c52.821a.7f09</code> in Cisco format. On the hall switch, <code>show mac address-table address 3c52.821a.7f09</code> showed <code>Gi1/0/24</code> — the uplink to the back-office switch, because the new desk was cabled there. On the back-office switch, the same command showed <code>Gi1/0/9</code>: the real port.</p>
<p>The engineer repeated this for every device in the hall, rebuilt the spreadsheet from the MAC tables, and changed the right port. The MSP's write-up: <b>the MAC table is the truth, documentation is a guess</b>; <b>a MAC on an uplink means follow it to the next switch</b>; <b>check the MAC on a port before changing that port</b>. Five minutes of checking prevented a teller outage on a Monday morning.</p>`)}
${K.mistake(`Changing a port's configuration because a spreadsheet says that's where the user is. Desks move and paperwork drifts. Confirm with <code>show mac address-table interface</code> or <code>address</code> first — it takes seconds.`)}

<h2>Interview corner</h2>
${K.hint(`In order: frame arrives → learn the source (add, refresh or move) → look up the destination → the three outcomes and when each happens. Finish with aging.`)}
${K.reveal("“Walk me through what a switch does when a frame arrives.”",`<p>"It reads the source MAC and records it against the ingress port and VLAN — adding it if new, resetting its age timer if known, moving it if it was on another port. Then it looks up the destination in that VLAN's table. A known unicast on another port is forwarded out that one port. If the destination is on the arrival port, the frame is filtered. Broadcasts, multicasts without IGMP snooping and unknown unicasts are flooded out every port in the VLAN except the ingress port. Dynamic entries age out after 300 seconds of silence. A store-and-forward switch also drops frames with a bad FCS before any of this."</p>`)}
${K.hint(`Define it, give the three normal causes, then say when it becomes a problem.`)}
${K.reveal("“What is unknown unicast flooding, and when should it worry you?”",`<p>"A unicast frame for a MAC that isn't in the table is sent out every port in the VLAN except the ingress port. It's normal after a reboot, a table clear, or when a quiet device ages out. It's brief: the destination replies, the switch learns it, and later frames are forwarded. It worries me when it's constant — for example a full CAM table from a MAC flooding attack, where fake source MACs crowd out real ones so real traffic is flooded to the attacker. I'd check the table size and the MACs per port, and use port security."</p>`)}
${K.hint(`Find the MAC (from the IP if needed), look it up, follow uplinks, confirm at the access port.`)}
${K.reveal("“How would you find which switch port a device is plugged into?”",`<p>"I get its MAC — from <code>ipconfig /all</code>, a label, or the ARP table if I only know the IP. On the access switch I run <code>show mac address-table address</code> with that MAC. An access port is the socket; I confirm there are only one or two MACs on it. An uplink means I follow it to the next switch and repeat. If the device isn't in the table, it hasn't sent anything recently, so I ping it first."</p>`)}

${K.recap([
  "The MAC address table (CAM table) maps MAC → port, per VLAN. The switch builds it automatically from traffic.",
  "Learning uses only the source MAC: add it if new, refresh the timer if known, move it if it appears on a new port.",
  "Known unicast on another port → forward out that port only. Destination on the arrival port → filter (drop).",
  "Broadcasts, multicasts (without IGMP snooping) and unknown unicasts are flooded to every port in the VLAN except the ingress port.",
  "Dynamic entries age out after 300 seconds of silence; a port going down removes its entries; silent devices are not in the table.",
  "show mac address-table [dynamic | address | interface | vlan] finds devices; clear mac address-table dynamic forces re-learning.",
  "Many MACs on an uplink is normal; many on a desk port means a hidden switch or hub. A full table means flooding — the MAC flooding attack.",
  "Store-and-forward checks the FCS and drops bad frames; cut-through starts after the destination MAC — faster, but forwards errors.",
])}
${K.next(`<b>Lesson 3 — Collision domains, broadcast domains and duplex.</b> You've seen what a switch floods and what it keeps to one port. Next: how far a collision and a broadcast can travel, why hubs created one big shared collision domain, and why every switch port being its own full-duplex link changed Ethernet for good.`)}
`,
quiz:[
  {lvl:1, q:"Which part of an arriving frame does a switch use to build its MAC address table?", o:["The destination MAC address","The source MAC address","The source IP address","The FCS"], a:1, why:"A switch learns from the source MAC address and the port the frame arrived on. The destination tells it nothing about where the destination device is."},
  {lvl:1, q:"What is the default aging time for dynamic MAC address table entries on a Cisco Catalyst switch?", o:["30 seconds","60 seconds","300 seconds","4 hours"], a:2, why:"Dynamic entries are removed after 300 seconds (5 minutes) without a frame from that source. Each new frame from the MAC resets the timer. (4 hours is the default ARP timeout on Cisco routers, a different table.)"},
  {lvl:2, q:"A frame arrives on Gi0/3 in VLAN 1. Its destination MAC is not in the MAC table. What does the switch do?", o:["Drops the frame","Forwards it out the uplink only","Floods it out every port in VLAN 1 except Gi0/3","Floods it out every port on the switch, including Gi0/3"], a:2, why:"An unknown unicast is flooded to every port in the same VLAN except the ingress port. It never goes back out the port it came in on, and never into other VLANs."},
  {lvl:2, q:"A small hub is connected to switch port Gi0/5, with hosts E and F on the hub. The switch has learned both E and F on Gi0/5. E sends a frame to F. What does the switch do with it?", o:["Forwards it out Gi0/5","Floods it out every port except Gi0/5","Filters (drops) it","Learns F on a new port"], a:2, why:"The destination F is in the table on the same port the frame arrived on. F already received it from the hub, so the switch filters the frame instead of sending it back."},
  {lvl:2, type:"multi", q:"Which two frames will a switch flood out every port in the VLAN except the ingress port? (Choose two.)", o:["A frame sent to ffff.ffff.ffff","A unicast frame whose destination MAC is not in the table","A unicast frame whose destination MAC is in the table on a different port","A unicast frame whose destination MAC is in the table on the arrival port","A frame whose FCS check fails on a store-and-forward switch"], a:[0,1], why:"Broadcasts and unknown unicasts are flooded. A known unicast is forwarded out one port; a destination on the arrival port is filtered; a store-and-forward switch discards a frame with a bad FCS."},
  {lvl:1, type:"order", q:"Put these in the order a store-and-forward switch handles a frame.", items:["Receive the whole frame","Check the FCS and discard the frame if it is damaged","Learn the source MAC against the ingress port and VLAN","Look up the destination MAC in that VLAN's table","Forward, filter or flood"], why:"A store-and-forward switch receives the entire frame and checks the FCS first, so damaged frames go no further. It then learns from the source, looks up the destination, and acts on the result."},
  {lvl:2, type:"match", q:"Match each switch term with what it means.", pairs:[["Forwarding","Sending a frame out the single port where its destination was learned"],["Filtering","Dropping a frame whose destination is on the port it arrived on"],["Flooding","Sending a frame out every port in the VLAN except the ingress port"],["Aging","Removing a dynamic entry after 300 seconds without a frame from that MAC"],["Learning","Recording a frame's source MAC against its ingress port and VLAN"]], why:"These five words describe the whole life of the MAC table: learning fills it, aging empties it, and every frame is then forwarded, filtered or flooded based on what the table holds."},
  {lvl:1, type:"fill", q:"Which command shows only the MAC addresses a Cisco switch has learned from traffic, hiding the static CPU entries?", fields:[{label:"Command", a:["show mac address-table dynamic"], ios:true}], why:"show mac address-table dynamic lists only learned (dynamic) entries. Without the keyword you also see the switch's built-in STATIC entries pointing to the CPU."},
  {lvl:2, type:"fill", q:"You moved several cables in a comms room and want the switch to forget all learned entries and re-learn them from new traffic, without reloading. Which command do you type at the privileged EXEC prompt?", fields:[{label:"Command", a:["clear mac address-table dynamic"], ios:true}], why:"clear mac address-table dynamic deletes all dynamic entries. The switch re-learns each device from its next frame; until then, frames to those devices are flooded as unknown unicasts."},
  {lvl:3, q:"A user on desk 3-08 complains that the network has been slow since some new staff joined her team. You see this on the access switch. What is the most likely explanation?", ex:"SW-3F#show mac address-table interface Gi1/0/8\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  10    3c52.82a1.2201    DYNAMIC     Gi1/0/8\n  10    6c4b.9020.1d3e    DYNAMIC     Gi1/0/8\n  10    a4bb.6d55.7f10    DYNAMIC     Gi1/0/8\n  10    f018.98c2.0b44    DYNAMIC     Gi1/0/8\n  10    5c26.0a11.6a02    DYNAMIC     Gi1/0/8\n  10    0c9d.92b1.13aa    DYNAMIC     Gi1/0/8\nTotal Mac Addresses for this criterion: 6", o:["The MAC table is full, so the switch is flooding","An IP phone with a PC behind it, which is normal","An unmanaged switch or hub has been connected to the desk socket, and several devices are sharing that one port","Gi1/0/8 is the uplink to the core switch"], a:2, why:"Six MACs on one desk port means a switch or hub is hiding behind it, and every device behind it shares one link — often a slow one. A phone plus a PC shows only two MACs. The port is described as a desk port, not an uplink. Check show interfaces status for the speed, then patch the users onto their own ports."},
  {lvl:2, q:"Based on the exhibit, a frame arrives on Gi0/2 from 0011.2233.4402 with destination 0011.2233.4403. What does SW1 do?", ex:"SW1#show mac address-table dynamic\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0011.2233.4401    DYNAMIC     Gi0/1\n   1    0011.2233.4402    DYNAMIC     Gi0/2\n   1    0011.2233.4404    DYNAMIC     Gi0/4\nTotal Mac Addresses for this criterion: 3", o:["Forwards it out Gi0/3 only","Drops it because the destination is unknown","Floods it out every port in VLAN 1 except Gi0/2","Forwards it out Gi0/1 and Gi0/4 only"], a:2, why:"0011.2233.4403 is not in the table, so it is an unknown unicast. The switch refreshes 4402 on Gi0/2, then floods the frame out every other port in VLAN 1. When 4403 replies, the switch learns it."},
  {lvl:3, q:"Users across one VLAN suddenly report that a security scan found their traffic visible from a spare wall socket. On the switch, the MAC table is at its maximum size, with thousands of entries on Gi0/19 that change constantly. What is happening, and what stops it?", o:["A switching loop; fix it with Spanning Tree","A MAC flooding attack filling the CAM table so traffic is flooded to every port; limit MACs per port with port security","A duplex mismatch on Gi0/19; set both ends to auto","The aging time is too long; reduce it to 30 seconds"], a:1, why:"Thousands of changing MACs on one port is a MAC flooding attack. With the table full, the switch can't learn real hosts, so their frames are flooded — including to the attacker on Gi0/19. Port security limits the number of MACs a port may learn and can shut the port when the limit is broken."},
  {lvl:2, q:"A laptop learned on Gi0/4 is unplugged from a desk hub that stays connected to Gi0/4, and plugged into a wall socket on Gi0/9. It sends a frame. What does the switch do with its MAC table entry?", o:["Keeps both entries, Gi0/4 and Gi0/9","Moves the entry to Gi0/9","Ignores the new port until the old entry ages out after 300 seconds","Shuts down Gi0/9 for a duplicate MAC"], a:1, why:"One MAC can be on only one port per VLAN. When a frame from a known MAC arrives on a different port, the switch updates the entry to the new port immediately."},
  {lvl:2, q:"A data-centre team reports CRC errors counting up on the receiving port of every switch along a path, though only one cable at the start of the path is faulty. Which explains why the errors appear everywhere?", o:["The switches use store-and-forward, which re-sends damaged frames","The switches use cut-through, which starts forwarding after the destination MAC and cannot drop frames with a bad FCS","The MAC tables are full, so frames are flooded","IGMP snooping is disabled"], a:1, why:"A cut-through switch begins sending before the FCS has arrived, so a frame damaged on the first link is passed on and fails the FCS check at every later hop. Store-and-forward would drop it at the first switch."},
  {lvl:2, q:"You run clear mac address-table dynamic on an access switch. A network printer that rarely sends anything is not in the table afterwards. A user prints to it. Why does the print job still reach the printer?", o:["The switch remembers the printer's port from its startup-config","The switch uses the printer's IP address to find it","The first frames to the printer are flooded as unknown unicasts, so they reach it; its reply lets the switch learn its port","The printer's frames are sent to the CPU entry"], a:2, why:"With no entry for the printer, the frames are unknown unicasts and are flooded to every port in the VLAN, so the printer receives them. When it replies, the switch learns its port and forwards from then on."},
],
cards:[
  {f:"What is the MAC address table (CAM table)?", b:"The switch's list of MAC address → port mappings, per VLAN, learned automatically from traffic. CAM hardware searches it by content in one step."},
  {f:"What does a switch learn from, and when?", b:"From the source MAC of every arriving frame, before it makes any forwarding decision. It adds new MACs, refreshes known ones and moves MACs seen on a new port."},
  {f:"Forward", b:"Destination MAC known, on a different port than the frame arrived on: send it out that one port only."},
  {f:"Filter", b:"Destination MAC known on the same port the frame arrived on (e.g. behind a hub): drop it."},
  {f:"Flood", b:"Send out every port in the VLAN except the ingress port. Happens for broadcasts, unknown unicasts and multicasts (unless IGMP snooping limits them)."},
  {f:"Unknown unicast", b:"A unicast frame whose destination MAC is not in the table. Flooded until the destination replies and is learned. Normal after a reboot, a clear or aging."},
  {f:"Default MAC aging time on Catalyst", b:"300 seconds (5 minutes) without a frame from that source. Each frame from the MAC resets the timer. A port going down removes its entries at once."},
  {f:"show mac address-table variants", b:"dynamic (learned only), address <mac> (where is this device?), interface <port> (what's behind this port?), vlan <n> (one VLAN)."},
  {f:"clear mac address-table dynamic", b:"Deletes all dynamic entries; the switch re-learns from the next frames. Brief flooding follows. Avoid on busy core switches in working hours."},
  {f:"Many MACs on one port: normal or not?", b:"Uplink: normal, everything beyond it is learned there. Desk port: 1 MAC, or 2 with an IP phone; more means a hidden switch or hub."},
  {f:"MAC flooding attack", b:"Fake source MACs fill the CAM table; real hosts can't be learned, so their frames are flooded to every port, including the attacker's. Defence: port security."},
  {f:"Store-and-forward vs cut-through", b:"Store-and-forward: whole frame, FCS checked, bad frames dropped (Catalyst access). Cut-through: starts after the destination MAC; lower delay but forwards errored frames."},
],
});
// ---------- Module 2 · Lesson 3 ----------
L.push({
id:"sw-domains", mins:65, level:"Beginner · builds on lessons 1–2",
t:"Collision domains, broadcast domains and duplex — and why hubs died",
html:`
${K.goals([
  "Explain step by step how CSMA/CD shares one cable, and why full duplex makes it unnecessary.",
  "Say why a hub is one collision domain where every device sees every frame, and why that is a security problem.",
  "Count the collision and broadcast domains in any CCNA-style topology without double-counting.",
  "Explain why broadcast domains must stay small, and what splits them.",
  "Diagnose a duplex mismatch from user symptoms and <code>show interfaces</code> output, and fix it on a Cisco switch.",
])}
${K.pre(["Module 1, especially lesson 2 (hubs) and lesson 3 (speed, duplex, autonegotiation).","Module 2 lessons 1–2: MAC addresses, the broadcast address ffff.ffff.ffff, and how a switch learns, floods and forwards."])}

<h2>Why this matters at work</h2>
<p>Tuesday morning at an accounting firm in Ikoyi, Lagos. Scanned invoices that used to reach the scan server in seconds now take twenty-five minutes. &ldquo;The network is fine,&rdquo; says a colleague. &ldquo;I pinged the server and it answered.&rdquo; He is right about the ping and wrong about the network.</p>
<p>The cause is one line of configuration on one switch port, left over from an old server, which makes the two ends of the cable disagree about whether they may talk at the same time. By the end of this lesson you'll know why that lets pings through but crushes file copies, which counters prove it, and the two commands that fix it. On the way you'll learn what the CCNA loves to test: collisions, collision domains, broadcast domains, and why the hub disappeared.</p>

<h2>Shared media, collisions and CSMA/CD</h2>
<p>Early Ethernet clipped every computer in an office onto <b>one long coaxial cable</b>, a ${K.g("shared medium","One channel used by several devices, so only one can send successfully at a time.")}: when one computer sent, every other computer heard the signal.</p>
<p>If two computers start at the same moment, their signals overlap and neither frame can be read. That is a ${K.g("collision","Two devices transmitting on a shared medium at once, so both frames are destroyed.")}, and both frames must be sent again. The devices that can collide with each other form a ${K.g("collision domain","The devices whose transmissions can collide: everything on one shared cable or hub, or one switch port and its device.")}. On that coax cable, the whole office was one.</p>
${K.analogy(`<p>A shared cable is a single walkie-talkie channel. If two people press the button at once, everyone hears noise and both messages are lost. So you agree rules: listen first, talk when it's quiet, and if you clash, both stop and wait a random moment before trying again.</p>`)}
<h3>The rules: CSMA/CD, one step at a time</h3>
<p>Ethernet's rules for a shared cable are ${K.g("CSMA/CD","Carrier Sense Multiple Access with Collision Detection: listen before sending, keep listening while sending, and on a collision jam and wait a random time. Half duplex only.")}: <b>Carrier Sense</b> (listen), <b>Multiple Access</b> (many share the cable), <b>Collision Detection</b> (notice clashes). Every time a card wants to send a frame:</p>
${K.steps([
  ["1 · Listen (carrier sense)", `<p>The card checks whether anyone is already transmitting. If it senses a signal, it waits until the cable has been quiet for a short gap.</p>`],
  ["2 · Transmit, and keep listening", `<p>It sends the frame while comparing what is on the wire with what it is sending.</p>`],
  ["3 · Detect a collision", `<p>If another card started at almost the same moment, the wire no longer matches. The frame is destroyed.</p>`],
  ["4 · Send a jam signal", `<p>The card sends a short ${K.g("jam signal","A 32-bit pattern sent after a collision so every device notices it and discards the damaged frame.")} so every device notices the collision and discards the fragment.</p>`],
  ["5 · Back off for a random time", `<p>Each card waits a <b>random</b> number of ${K.g("slot times","The CSMA/CD waiting unit: the time to send 512 bits (51.2 µs at 10 Mb/s).")} — the ${K.g("backoff","A random wait after a collision. The range doubles after each collision on the same frame.")}. Random waits make a second clash unlikely, and the range doubles after each further collision, so a busy cable calms itself.</p>`],
  ["6 · Try again", `<p>Back to step 1. After <b>16</b> collisions on the same frame, the card gives up and drops it (<i>excessive collisions</i>).</p>`],
])}
${K.svg("0 0 720 230",
  K.box(20,92,112,48,"1 · Listen","carrier sense")+
  K.box(160,92,118,48,"2 · Transmit","keep listening")+
  K.box(306,92,120,48,"3 · Collision?","compare the wire",true)+
  K.box(462,34,112,46,"Frame sent","no collision")+
  K.box(462,152,112,46,"4 · Jam","32-bit signal")+
  K.box(596,152,112,46,"5 · Back off","random wait")+
  K.arrow(132,116,158,116)+K.arrow(278,116,304,116)+
  K.arrow(426,104,460,62,"no")+K.arrow(426,128,460,170,"yes",true)+
  K.arrow(574,175,594,175)+
  `<path d="M652,152 V14 H76 V88" fill="none" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#karr)"/>`+
  K.txt(300,28,"6 · try again (gives up after 16 collisions)",{mid:true})+
  K.txt(360,222,"Only half-duplex ports run this loop. Full-duplex ports skip it entirely.",{mid:true,c:"fg"}),
  "CSMA/CD: listen, transmit while listening, and on a collision jam, back off for a random time and start again.")}
${K.remember(`<b>&ldquo;Look, Leap, Listen, Jam, Wait, Again.&rdquo;</b> Carrier sense → transmit → detect while transmitting → jam → random backoff → retry (up to 16 times).`)}
<h3>The 64-byte minimum, and &ldquo;late&rdquo; collisions</h3>
<p>A card only detects collisions while it is still sending. So Ethernet makes every frame long enough that, on a correctly built network, any collision reaches the sender in time: the <b>64-byte minimum frame</b> from Module 1 lesson 6. 64 bytes is 512 bits, one slot time.</p>
<p>A collision detected <i>after</i> the first 64 bytes is a ${K.g("late collision","A collision detected after the first 64 bytes of a frame. Never normal: usually a duplex mismatch.")}. Late collisions are never normal, and on modern networks they almost always mean a duplex mismatch — you'll hunt one down later.</p>
<h3>Half duplex and full duplex</h3>
<p>A port following CSMA/CD sends <i>or</i> receives, never both: ${K.g("half duplex","Send or receive, not both at once, like a walkie-talkie. Uses CSMA/CD.")}. A port on a private link, one device at each end with separate pairs for each direction, can do both at once: ${K.g("full duplex","Send and receive at the same time. No collisions possible, so CSMA/CD is off.")}. Collisions can't happen in full duplex, so CSMA/CD is switched off.</p>
${K.dyk(`CSMA/CD grew partly out of ALOHAnet, a radio network linking University of Hawaii sites around 1970, where stations transmitted and resent if a message was lost. Bob Metcalfe's Ethernet at Xerox PARC added "listen first" and "detect the clash". The first version ran on thick coax, with stations clamped on by "vampire taps".`)}
${K.check({q:"A half-duplex network card detects a collision while sending. What does it do next?", o:["Stops silently and resends immediately","Sends a jam signal, then waits a random backoff before retrying","Switches to full duplex","Drops the frame and never retries"], a:1, why:"It jams so everyone notices, backs off for a random number of slot times, then starts again with carrier sense. It only gives up after 16 collisions on one frame."})}
${K.q({type:"order", q:"Put the CSMA/CD steps in the order a half-duplex network card performs them when its frame collides.", items:["Listen for a carrier until the cable is quiet","Start transmitting while comparing the wire with what it sends","Notice that the signal on the wire no longer matches: a collision","Send a 32-bit jam signal","Wait a random number of slot times (backoff)","Start again by listening for a carrier"], why:"Listen, transmit while listening, detect, jam, back off, retry. The jam makes every station notice the clash; the random backoff makes a second clash unlikely."})}

<h2>Hubs: one big collision domain — and why they died</h2>
<p>Coax was fragile: one bad clamp broke the whole office. So offices moved to twisted pair in a <b>star</b>, with one cable from each PC to a box in the cupboard: the ${K.g("hub","An obsolete Layer 1 multiport repeater that copies every incoming signal out of every other port.")} you met in Module 1 lesson 2.</p>
<p>A hub is a <b>multiport</b> ${K.g("repeater","A Layer 1 device that regenerates a signal and sends it on. It reads no addresses.")}: whatever bits arrive on one port, it regenerates and sends out of <b>every other port</b>. It reads no MAC addresses. Cabled as a star, it behaves as one shared wire. That gives four permanent problems:</p>
<ul>
<li><b>One collision domain.</b> Every port runs half duplex with CSMA/CD.</li>
<li><b>Shared bandwidth.</b> A 100 Mb/s hub gives 100 Mb/s to <i>everyone together</i>, and collisions waste more as traffic grows.</li>
<li><b>Everyone sees everything.</b> A frame from PC A to PC B reaches every PC. Their cards see the destination MAC isn't theirs and discard it — but they <i>received</i> it.</li>
<li><b>A security hole.</b> Any PC can tell its card to keep every frame, using ${K.g("promiscuous mode","A network card setting that passes every received frame to the computer, not only its own. Packet-capture tools use it.")}. With a free capture tool such as Wireshark, anyone on a hub can record colleagues' unencrypted traffic.</li>
</ul>
${K.mistake(`Thinking a hub "sends the frame to the right PC". A hub has no idea where anyone is. It copies every frame everywhere, and each PC's own card decides to ignore frames not addressed to it. Nothing stops a PC from keeping them.`)}
<h3>Why hubs died</h3>
<p>A ${K.g("bridge","An early Layer 2 device with a few ports that learned MAC addresses and split a network into separate collision domains.")} split a hub network into separate collision domains by reading MAC addresses. A switch is, in effect, a many-port bridge in fast hardware. Once switch chips became cheap, there was no reason to buy a hub. From 10 Gb/s upwards, Ethernet doesn't even define half duplex: there is no such thing as a 10-gigabit hub.</p>
${K.dyk(`10 Mb/s hub networks had to obey the <b>5-4-3 rule</b>: between two stations, at most 5 segments joined by 4 repeaters or hubs, with computers on only 3 of them. Break it and signals took too long to cross the network, so news of a collision could reach the sender after its first 64 bytes had gone (a late collision) or after it had finished sending, too late to notice at all.`)}
${K.check({q:"PC1, PC2 and PC3 are on a hub. PC1 sends a unicast frame to PC2. Which devices receive it?", o:["Only PC2","PC2 and PC3 — the hub repeats it out of every other port","Only the hub","Nobody until the hub learns PC2's MAC"], a:1, why:"A hub is a Layer 1 repeater, so PC3 receives the frame too. PC3's card discards it because the MAC isn't its own, unless it is in promiscuous mode."})}

<h2>Switches: a collision domain per port, and full duplex</h2>
<p>In lesson 2 you watched a switch learn MACs and forward each frame only out of the destination's port. That changes the physics as well as the delivery.</p>
<p>Every switch port is a separate link with two devices on it: the switch and whatever is plugged in. So every switch port is its own collision domain. Giving each device its own collision domain is called ${K.g("microsegmentation","Giving each device its own switch port, and so its own collision domain.")}. With two devices and separate pairs per direction, the link runs <b>full duplex</b>: CSMA/CD is off and collisions cannot happen. On a modern switched network, collision counters should sit at zero. If they don't, a port is running half duplex when it shouldn't.</p>
${K.svg("0 0 720 270",
  `<ellipse cx="170" cy="138" rx="158" ry="110" fill="none" stroke="var(--warn)" stroke-width="1.6" stroke-dasharray="6 4"/>`+
  K.dev("hub",170,70,"HUB","")+
  K.dev("pc",70,190,"PC A","")+K.dev("pc",170,190,"PC B","")+K.dev("pc",270,190,"PC C","")+
  K.link(160,79,74,172)+K.link(170,79,170,172)+K.link(180,79,266,172)+
  K.txt(170,22,"1 collision domain · half duplex · shared",{mid:true,c:"warn",b:true})+
  `<ellipse cx="492" cy="126" rx="62" ry="15" transform="rotate(-42.3 492 126)" fill="none" stroke="var(--ok)" stroke-width="1.6" stroke-dasharray="6 4"/>`+
  `<ellipse cx="540" cy="126" rx="15" ry="52" fill="none" stroke="var(--ok)" stroke-width="1.6" stroke-dasharray="6 4"/>`+
  `<ellipse cx="588" cy="126" rx="62" ry="15" transform="rotate(42.3 588 126)" fill="none" stroke="var(--ok)" stroke-width="1.6" stroke-dasharray="6 4"/>`+
  K.dev("switch",540,70,"SWITCH","")+
  K.dev("pc",440,190,"PC D","")+K.dev("pc",540,190,"PC E","")+K.dev("pc",640,190,"PC F","")+
  K.link(528,81,446,172)+K.link(540,81,540,172)+K.link(552,81,634,172)+
  K.txt(540,22,"3 collision domains · full duplex · own bandwidth",{mid:true,c:"ok",b:true})+
  K.txt(360,262,"Both sides are still ONE broadcast domain: a broadcast reaches every PC.",{mid:true,c:"fg"}),
  "Left: a hub makes all its devices one collision domain. Right: a switch gives every port its own (microsegmentation), so links run full duplex.")}
${K.when([
  ["Hub","Never, in a production network","Repeats everything everywhere; one half-duplex collision domain; easy to eavesdrop on","Always — replace any you find"],
  ["Switch (Layer 2)","Connecting devices inside one network","One collision domain per port, full duplex, unicasts only where needed","You need to stop broadcasts — it floods them"],
  ["Router (Layer 3)","Joining different networks or subnets","Splits collision <i>and</i> broadcast domains; forwards by IP","Joining PCs in the same subnet — that's a switch's job"],
], "Which device splits what")}
<h3>Hands-on: a hub and a switch side by side</h3>
<p>The left island is a hub with three PCs; the right is a switch with three PCs; all are in <code>10.0.0.0/24</code>. Do each ping, then read <b>What just happened on the wire</b> under the picture (open by default). Amber dots are broadcasts, teal dots unicasts.</p>
${K.bench({id:"m2-hub-vs-switch", points:70, from:"CCNA · Module 2 · lesson 3", title:"hub vs switch — who sees the frame?", viewBox:"0 0 760 360", openLog:true,
  intro:"Under each PC: <b>Command Prompt</b>. On the hub, look in the log for a PC that <i>saw a frame and ignored it</i>.",
  devices:[
    {id:"hub", kind:"hub", label:"HUB", model:"10/100 hub (repeater)", x:60, y:30},
    {id:"sw", kind:"switch", label:"SW1", model:"Catalyst 9200 · 8× RJ45 + 2× SFP", x:310, y:30},
    {id:"h1", kind:"pc", label:"HUB-PC1", x:10, y:250, ip:"10.0.0.11", mask:"255.255.255.0"},
    {id:"h2", kind:"pc", label:"HUB-PC2", x:128, y:250, ip:"10.0.0.12", mask:"255.255.255.0"},
    {id:"h3", kind:"pc", label:"HUB-PC3", x:246, y:250, ip:"10.0.0.13", mask:"255.255.255.0"},
    {id:"s1", kind:"pc", label:"SW-PC1", x:400, y:250, ip:"10.0.0.21", mask:"255.255.255.0"},
    {id:"s2", kind:"pc", label:"SW-PC2", x:520, y:250, ip:"10.0.0.22", mask:"255.255.255.0"},
    {id:"s3", kind:"pc", label:"SW-PC3", x:640, y:250, ip:"10.0.0.23", mask:"255.255.255.0"},
  ],
  cables:[ {type:"cat6", a:"h1:eth", b:"hub:p1"}, {type:"cat6", a:"h2:eth", b:"hub:p2"}, {type:"cat6", a:"h3:eth", b:"hub:p3"},
           {type:"cat6", a:"s1:eth", b:"sw:g1"}, {type:"cat6", a:"s2:eth", b:"sw:g2"} ],
  tray:["cat6"],
  tasks:[
    {text:"From <b>HUB-PC1</b>, <code>ping 10.0.0.12</code> (HUB-PC2). In the log, find the line showing HUB-PC3 received the echo request too", done:B=>Bench.pinged(B,"h1","10.0.0.12")},
    {text:"SW-PC3 isn't patched in. Plug it into a free switch port with a Cat6 cable", done:B=>Bench.upAt(B,"s3:eth")},
    {text:"From <b>SW-PC1</b>, <code>ping 10.0.0.22</code> <b>twice</b>. The first run starts with an ARP broadcast flooded to every port; the second needs no ARP, and every frame goes out one port only", done:B=>Bench.pinged(B,"s1","10.0.0.22") && B.events.filter(e=>e.a[0]==="pc" && e.a[1]==="s1" && /ping\s+10\.0\.0\.22/.test(e.a[2]||"")).length>=2},
    {text:"Join the islands: cable the hub's port 4 to switch port 8", done:B=>Bench.up(B,"hub:p4","sw:g8")},
    {text:"From <b>SW-PC2</b>, <code>ping 10.0.0.13</code> (HUB-PC3). The switch forwards out Gi0/8 only, but the hub then repeats it to all three hub PCs", done:B=>Bench.pinged(B,"s2","10.0.0.13")},
  ],
  win:"The hub copied a unicast to every PC; the switch sent it only to its destination once it had learned the MACs. The hub on port 8 is one collision domain hanging off a single switch port.",
  solve:[["pc","h1","ping 10.0.0.12"],["plug","cat6","s3:eth","sw:g3"],["pc","s1","ping 10.0.0.22"],["pc","s1","ping 10.0.0.22"],["plug","cat6","hub:p4","sw:g8"],["pc","s2","ping 10.0.0.13"]]})}
${K.hint("After the last task, count: how many devices share the collision domain on switch port 8? (Three hub PCs plus the switch port.) How many broadcast domains on the whole bench? (One: there's no router, so an ARP broadcast from any PC reaches all six.)")}
<p>On the switch side, the <b>ARP request</b> (a broadcast) still went to every port — switches flood broadcasts — but the <b>echo request</b>, a unicast, went only to the destination's port. On the hub, the same unicast reached every PC. That difference is why switches replaced hubs.</p>
${K.check({q:"24 PCs are each on their own port of one switch, all full duplex. How many collisions should those ports log?", o:["About 24 per minute","A few during busy hours","None — full-duplex links cannot have collisions","It depends on the number of broadcasts"], a:2, why:"Each port is its own collision domain running full duplex, so CSMA/CD is off and collisions are impossible. Collisions on a modern port point to half duplex, usually a mismatch."})}

<h2>Broadcast domains: what switches flood and routers stop</h2>
<p>Switches solved collisions but deliberately leave the ${K.g("broadcast","A frame sent to ffff.ffff.ffff, meant for every device on the local network.")} alone. A frame to <code>ffff.ffff.ffff</code> is for everyone, so a switch floods it out of every port except the one it came in on, and the next switch floods it on again. The devices that receive each other's broadcasts form a ${K.g("broadcast domain","The devices that receive each other's broadcasts: one per router interface, or one per VLAN inside switches.")}.</p>
<p>Everyday protocols rely on broadcasts. ARP asks &ldquo;who has this IP?&rdquo; (lesson 4). A booting PC broadcasts to find a DHCP server. Printers, media devices and some Windows services announce themselves the same way.</p>
<h3>Routers stop broadcasts</h3>
<p>A router does not forward broadcasts between its interfaces. Each router interface is the edge of a separate broadcast domain, which is also a separate subnet.</p>
${K.svg("0 0 720 260",
  `<rect x="18" y="94" width="324" height="160" rx="10" fill="none" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="6 4"/>`+
  `<rect x="378" y="94" width="324" height="160" rx="10" fill="none" stroke="var(--link)" stroke-width="1.5" stroke-dasharray="6 4"/>`+
  K.dev("router",360,42,"R1","")+
  K.dev("switch",180,130,"SW-A","")+K.dev("switch",540,130,"SW-B","")+
  K.dev("pc",90,206,"PC1","")+K.dev("pc",180,206,"PC2","")+K.dev("pc",270,206,"PC3","")+
  K.dev("pc",450,206,"PC4","")+K.dev("pc",540,206,"PC5","")+K.dev("pc",630,206,"PC6","")+
  K.link(338,48,206,122,"G0/0")+K.link(382,48,514,122,"G0/1")+
  K.link(172,141,94,188)+K.link(180,141,180,188)+K.link(188,141,266,188)+
  K.link(532,141,454,188)+K.link(540,141,540,188)+K.link(548,141,626,188)+
  K.txt(28,112,"Broadcast domain 1 · 192.168.10.0/24",{c:"warn",b:true})+
  K.txt(692,112,"Broadcast domain 2 · 192.168.20.0/24",{end:true,c:"link",b:true})+
  K.txt(30,22,"PC1's ARP broadcast reaches PC2, PC3",{c:"fg"})+K.txt(30,36,"and R1's G0/0 — and stops there.",{c:"fg"}),
  "Each router interface bounds a broadcast domain. Switches flood broadcasts; the router doesn't pass them on.")}
<p>Inside switches you can also create separate broadcast domains with ${K.g("VLANs","Virtual LANs: separate broadcast domains inside switches. Module 4.")} — that's Module 4. Until then, assume all switch ports are in one VLAN, so <b>a switch, and every switch joined to it, is one broadcast domain</b>.</p>
${K.analogy(`<p>A broadcast domain is a building with one public-address system. Everyone hears every announcement — useful for &ldquo;Has anyone seen Mrs Okafor?&rdquo;, exhausting if a thousand people use it all day. Routers are the walls between buildings.</p>`)}
<h3>Why broadcast domains must not get too big</h3>
<p>Every device must receive every broadcast and look at it, because it is addressed to everyone. Make the domain large and three things go wrong:</p>
<ul>
<li><b>Chatter grows.</b> Illustration: if 1,000 hosts each send one broadcast every 10 seconds, every host receives 100 broadcasts a second, all day. On Wi-Fi it hurts more: broadcasts go out at a slow basic rate, using shared airtime.</li>
<li><b>Faults spread.</b> A faulty card spewing frames, or a rogue DHCP server, affects everyone in the domain.</li>
<li><b>Storms take everything down.</b> Loop two switch ports together (a cable between two wall sockets will do) and a broadcast goes round and round, copied at every switch. Ethernet frames have no hop limit, so they multiply until links fill and every device in the domain stops working: a ${K.g("broadcast storm","Broadcasts looping endlessly between switches and multiplying until the network is overwhelmed. Prevented by Spanning Tree.")}. Spanning Tree Protocol, in a later module, prevents loops; a smaller domain limits the damage.</li>
</ul>
<p>So designers keep domains modest. Around 250 devices (a <code>/24</code>) per floor, department or function is common practice, not a law. Routers or Layer 3 switches, plus VLANs, do the splitting.</p>
${K.myth([
  ["A switch stops broadcasts.","A switch floods broadcasts out of every port in the VLAN. Only a router (or a Layer 3 switch) stops them."],
  ["Each switch is one collision domain.","Each switch <i>port</i> is a collision domain: 24 devices on a 24-port switch = 24 collision domains."],
  ["Collisions are normal on Ethernet today.","Full-duplex links can't collide. Collisions on a modern port mean half duplex — usually a mismatch."],
  ["One big flat network is simpler, so it's better.","Simpler to build, worse to run: more chatter for every host, and one loop or rogue device hits everyone."],
])}
${K.case("One flat network for a whole campus",`
<p>A polytechnic in Kaduna grew its network for fifteen years by adding unmanaged switches wherever ports ran out. Everything sat in one <code>/20</code> subnet — around 2,500 devices on a busy day, one broadcast domain across the campus.</p>
<p><b>Symptoms.</b> Mornings were slow and laptops waited ages for DHCP. Captures showed a constant stream of ARP and discovery broadcasts hitting every machine, the bursary's payment PCs included. Then, during exams, a student plugged a loose cable into two wall sockets in a lecture hall. The unmanaged switch had no loop protection, and the broadcast storm took down the <i>entire campus</i> for most of an hour, until someone walked from building to building pulling cables.</p>
<p><b>Redesign.</b> Managed switches replaced the unmanaged ones, and the campus was split into separate broadcast domains per building and function (staff, students, bursary, Wi-Fi), each a <code>/24</code> or <code>/23</code>, routed by a Layer 3 core switch, with Spanning Tree for loop protection. The audit also turned up two 1990s hubs in the computer lab, which were replaced.</p>
<p><b>Result.</b> DHCP was quick again, and when a hostel loop happened a year later, only that hostel was affected, for seconds. Small broadcast domains keep faults small.</p>`)}
${K.check({q:"A PC sends a DHCP broadcast. Its switch links to two more switches, one of which connects to a router interface. Who receives it?", o:["Only the PC's own switch","Every device on all three switches, plus that router interface — nothing beyond the router","Every device in the company","Only the DHCP server"], a:1, why:"Switches flood broadcasts to every port in the VLAN, so all three switches and everything on them receive it, including the router interface. The router doesn't forward it further: that's the broadcast domain edge."})}

<h2>Counting collision and broadcast domains</h2>
<p>&ldquo;How many collision domains and broadcast domains are in this diagram?&rdquo; is a CCNA classic, and interviewers ask it too. Count in a fixed order:</p>
${K.steps([
  ["Broadcast domains first: look for routers", `<p>With no VLANs, each <b>router interface in use</b> bounds one broadcast domain — including a router-to-router link, which is its own small subnet. No router at all? Then everything is <b>one</b> broadcast domain.</p>`],
  ["Collision domains: one per link on a switch or router port", `<p>Every cable into a switch or router port is one collision domain. Count each cable once: a switch-to-switch cable is one, not two.</p>`],
  ["A hub and everything on it count as one", `<p>The hub, its devices and the switch port it hangs off form <b>one</b> collision domain — the one you already counted for its uplink.</p>`],
  ["Add up and sanity-check", `<p>Collision domains usually far outnumber broadcast domains. More broadcast domains than router interfaces (with no VLANs) means a counting slip.</p>`],
])}
${K.remember(`<b>&ldquo;Routers fence broadcasts. Switches slice collisions. Hubs slice nothing.&rdquo;</b>`)}
<h3>Worked example 1 — a router and two switches</h3>
<p>R1 G0/0 connects to SW1 (four PCs); G0/1 connects to SW2 (three PCs). No hubs.</p>
${K.steps([
  ["Broadcast domains", `<p>Two router interfaces in use: <b>2</b>.</p>`],
  ["Collision domains", `<p>SW1: four PCs + the R1 uplink = 5. SW2: three PCs + the R1 uplink = 4. Total <b>9</b>.</p>`],
])}
<h3>Worked example 2 — a hub under the desk</h3>
<p>One switch, no router. Three PCs plug into the switch; a fourth switch port goes to a hub with four PCs.</p>
${K.steps([
  ["Broadcast domains", `<p>No router: <b>1</b>.</p>`],
  ["Collision domains", `<p>Three PC links + one hub link (the hub and its four PCs inside it) = <b>4</b>.</p>`],
  ["Replace the hub with a switch", `<p>The switch-to-switch link is still 1, and each of the four PCs gets its own port: 3 + 1 + 4 = <b>8</b>. Broadcast domains: still <b>1</b>.</p>`],
])}
${K.exam(`Tell hub icons from switch icons carefully. Count a collision domain for every switch and router link <i>even when it's full duplex</i> — that's the exam's convention. Trap answers count each switch as one collision domain, or each switch as its own broadcast domain.`)}
<h3>Try it yourself: count this network</h3>
<p>With pen and paper, count the collision domains and broadcast domains below (no VLANs). Then: what changes if HUB1 is replaced with a switch?</p>
${K.svg("0 0 760 370",
  K.dev("router",380,40,"R1","")+
  K.dev("switch",190,120,"","")+K.txt(158,116,"SW1",{end:true,c:"fg",b:true,f:"display",s:12})+
  K.dev("switch",570,120,"","")+K.txt(602,116,"SW2",{c:"fg",b:true,f:"display",s:12})+
  K.dev("pc",50,215,"PC1","")+K.dev("pc",140,215,"PC2","")+
  K.dev("hub",270,215,"","")+K.txt(300,204,"HUB1",{c:"fg",b:true,f:"display",s:12})+
  K.dev("pc",200,305,"PC3","")+K.dev("pc",270,305,"PC4","")+K.dev("pc",340,305,"PC5","")+
  K.dev("pc",450,215,"PC6","")+K.dev("pc",540,215,"PC7","")+
  K.dev("switch",670,215,"","")+K.txt(700,200,"SW3",{c:"fg",b:true,f:"display",s:12})+
  K.dev("pc",630,305,"PC8","")+K.dev("pc",710,305,"PC9","")+
  K.link(358,48,212,112,"G0/0")+K.link(402,48,548,112,"G0/1")+
  K.link(182,131,54,197)+K.link(190,131,142,197)+K.link(200,131,262,206)+
  K.link(262,224,204,287)+K.link(270,224,270,287)+K.link(278,224,336,287)+
  K.link(562,131,454,197)+K.link(570,131,542,197)+K.link(580,131,662,204)+
  K.link(662,226,634,287)+K.link(678,226,706,287),
  "Count the collision and broadcast domains. R1 is a router, SW1–SW3 are switches, HUB1 is a hub. No VLANs.")}
${K.hint(`Broadcast domains first: how many router interfaces are in use? Then go switch by switch, counting each cable once. HUB1, PC3, PC4 and PC5 all sit inside the collision domain of the SW1–HUB1 cable. The SW2–SW3 cable is one collision domain, not two.`)}
${K.reveal("Show the answers",`<p><b>Broadcast domains: 2</b> — R1's G0/0 side (SW1, HUB1, PC1–PC5) and G0/1 side (SW2, SW3, PC6–PC9).</p>
<p><b>Collision domains: 10.</b> SW1: R1 link, PC1, PC2, HUB1 link = 4 (PC3–PC5 are inside the HUB1 link's domain). SW2: R1 link, PC6, PC7, SW3 link = 4. SW3: PC8, PC9 = 2 (its uplink is already counted). 4 + 4 + 2 = <b>10</b>.</p>
<p><b>Follow-up:</b> with a switch instead of HUB1, PC3, PC4 and PC5 each get their own collision domain: <b>13</b>. Broadcast domains stay at <b>2</b>.</p>`)}
${K.q({type:"fill", q:"R1 has two interfaces in use. G0/0 connects to a switch with 10 PCs on it. G0/1 connects to a hub with 5 PCs on it. No VLANs. How many collision domains and broadcast domains are there?", fields:[{label:"Collision domains", a:["12","twelve"]},{label:"Broadcast domains", a:["2","two"]}], why:"The switch gives 10 PC links plus its uplink to R1 = 11. The hub, its 5 PCs and R1's G0/1 share one more = 12. Two router interfaces in use = 2 broadcast domains."})}
${K.mistake(`Counting a hub's PCs separately. Five PCs on a hub share <b>one</b> collision domain. The opposite slip: counting a switch-to-switch cable twice, once per switch.`)}
${K.check({q:"No router: three switches in a line with 20 PCs spread across them. How many broadcast domains?", o:["1","3","20","23"], a:0, why:"Without a router or VLANs nothing stops broadcasts, so it's all one broadcast domain. The switches create many collision domains, but only routers or VLANs split broadcast domains."})}

<h2>Speed, duplex and autonegotiation — and the duplex mismatch</h2>
<p>Back to the slow scans in Ikoyi. Module 1 lesson 3 introduced the duplex mismatch; here is the full picture, because it is one of the commonest &ldquo;slow network&rdquo; faults you'll fix.</p>
<h3>How autonegotiation works</h3>
<p>When a copper cable is plugged in, both ports run ${K.g("autonegotiation","Two copper ports advertise the speeds and duplex modes they support and pick the best common one. Required for 1000BASE-T.")}: each advertises what it can do with small link pulses, and both choose the best shared option, in this order: 1000 full, 1000 half, 100 full, 100 half, 10 full, 10 half. Two modern ports on auto agree on <b>1000 Mb/s full duplex</b>. Gigabit copper needs autonegotiation to work at all, so mismatches are mostly a 10/100 problem: old printers, cameras, door controllers, industrial kit.</p>
<h3>What happens when one side is hard-coded</h3>
<p>On a Cisco switch, <code>speed 100</code> plus <code>duplex full</code> on a port turns autonegotiation off: the port stops advertising. The other end, still on auto:</p>
${K.steps([
  ["Hears no advertisements", `<p>The far end has gone quiet.</p>`],
  ["Still detects the speed", `<p>It can tell 10 from 100 Mb/s by the signal itself (${K.g("parallel detection","How an auto port that hears no advertisements still works out the far end's speed from its signal — but not its duplex.")}), so the speed matches.</p>`],
  ["Cannot detect the duplex", `<p>Nothing in the signal says &ldquo;full duplex&rdquo;, so the standard makes it assume the old default: <b>half</b> at 10 or 100 Mb/s.</p>`],
  ["Result: a duplex mismatch", `<p>One end full, the other half. The link is up and ping works: a ${K.g("duplex mismatch","One end full duplex, the other half, usually because only one end was hard-coded. Up, but slow.")}.</p>`],
])}
<h3>Why it's slow but ping works</h3>
<p>The <b>full-duplex</b> side sends whenever it likes. The <b>half-duplex</b> side runs CSMA/CD: whenever a frame arrives while it is sending, it calls that a collision, stops mid-frame, jams and backs off.</p>
${K.svg("0 0 720 250",
  K.box(20,30,250,62,"Switch Gi0/5 · FULL duplex","speed 100 + duplex full (hard-coded)",true)+
  K.box(450,30,250,62,"Server NIC · HALF duplex","auto → no advertisements → half")+
  K.arrow(272,52,448,52,"sends whenever it likes",true)+
  K.arrow(448,74,272,74,"stops mid-frame on 'collision'")+
  K.box(20,128,250,74,"Full side counts","CRC errors + runts (cut-off frames)")+
  K.box(450,128,250,74,"Half side counts","late collisions + collisions")+
  K.link(145,92,145,128,"",true)+K.link(575,92,575,128,"",true)+
  K.txt(360,232,"Small pings slip through the gaps. Big transfers collide constantly, and TCP keeps resending.",{mid:true,c:"fg"}),
  "Duplex mismatch: the full side transmits freely; the half side treats incoming frames as collisions and aborts its own.")}
<ul>
<li>The <b>half-duplex side</b> counts collisions, many after its first 64 bytes: <b>late collisions</b>.</li>
<li>The <b>full-duplex side</b> receives the aborted frames cut short: ${K.g("runts","Frames shorter than the 64-byte minimum, often collision fragments.")} and ${K.g("CRC errors","Frames whose FCS checksum doesn't match, so they're discarded. Caused by bad cabling, interference or a duplex mismatch.")}.</li>
<li>A ping is small and occasional, so it slips through a quiet moment. A file copy is a constant two-way stream (data one way, TCP acknowledgements back), so the sides clash constantly, TCP keeps waiting and resending, and throughput collapses.</li>
</ul>
${K.remember(`<b>&ldquo;Late on the half, CRC on the full.&rdquo;</b>`)}
<h3>Seeing it on a Cisco switch</h3>
<p>Start with <code>show interfaces status</code>. The Duplex and Speed columns show how each value was reached:</p>
${K.out(`SW-2F#show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi0/1     RECEPTION-PC       connected    1          a-full a-1000 10/100/1000BaseTX
Gi0/2     ACCTS-PC           connected    1          a-full a-1000 10/100/1000BaseTX
Gi0/5     PRINT-SRV          connected    1            full    100 10/100/1000BaseTX
Gi0/7                        notconnect   1            auto   auto 10/100/1000BaseTX`, "show interfaces status on the Ikoyi switch. The 'a-' prefix means 'reached by autonegotiation'.")}
<ul>
<li><b>a-full a-1000</b> (Gi0/1, Gi0/2) — negotiated gigabit full duplex. Healthy.</li>
<li><b>full 100</b> with <b>no a-</b> (Gi0/5) — <i>configured</i> on the port. Fine if the server is set the same; a mismatch if it's on auto.</li>
<li><b>auto auto</b> (Gi0/7) — nothing plugged in yet.</li>
<li>Watch also for <b>a-half a-100</b>: the switch is on auto and fell back because the <i>device</i> is hard-coded. On a modern port, a-half almost always means a mismatch.</li>
</ul>
<p>Then look at the suspect port:</p>
${K.out(`SW-2F#show interfaces GigabitEthernet0/5
GigabitEthernet0/5 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 00aa.bb00.0005 (bia 00aa.bb00.0005)
  Description: PRINT-SRV
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 10 usec,
     reliability 241/255, txload 1/255, rxload 3/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  [... lines trimmed ...]
     312 runts, 0 giants, 0 throttles
     2912 input errors, 2871 CRC, 41 frame, 0 overrun, 0 ignored
     26511 packets output, 3950112 bytes, 0 underruns
     0 output errors, 0 collisions, 0 interface resets
     0 late collision, 0 deferred`, "The full-duplex side of a mismatch: up/up, but thousands of CRC errors and hundreds of runts.")}
<ul>
<li><b>up, line protocol is up</b> — the link works, so nobody suspects it.</li>
<li><b>Full-duplex, 100Mb/s</b> — this side thinks it may send at any time.</li>
<li><b>312 runts, 2871 CRC</b> — the half side's cut-off frames. A healthy port shows zero or a handful built up over months.</li>
<li><b>0 collisions, 0 late collision</b> — full-duplex ports never count collisions; the late collisions are on the server's side.</li>
</ul>
${K.exam(`A link that is <b>up</b>, pings fine, but is slow, with CRC errors on one end or late collisions on the other = duplex mismatch. Late collisions mark the half side. <code>a-half</code>, or fixed values on one end only, are the clues. CRC errors <i>alone</i> on an a-full port point to cabling or interference instead.`)}
${K.mistake(`"Fixing" a mismatch with <code>duplex half</code> on the full side. Both ends now agree — on colliding forever. The fix is auto on both ends, or the <b>same</b> fixed full-duplex values on both.`)}
${K.when([
  ["Auto on both ends","Almost every port: PCs, servers, APs, phones, uplinks","Both ends agree on the best speed and full duplex; gigabit copper requires it","A device with a known negotiation bug the vendor says must be fixed"],
  ["Fixed on both ends, same values","An old or specialist device that can't negotiate reliably","Both ends agree because you made them","You don't control the far end's settings"],
  ["Fixed on one end only","Never","It causes exactly this mismatch: the auto side falls back to half","Always"],
], "Speed and duplex settings")}
${K.tip(`Run <code>clear counters</code> (it asks you to confirm) before and after a fix, wait a few minutes under normal traffic, and look again. Old errors can sit there for months; what matters is whether they're still <i>rising</i>.`)}
<h3>Practise the commands</h3>
<p>On this third-floor switch, Gi0/3 connects an old label printer whose manual says it must be fixed at 100/full, and it already is, so the switch must match. Gi0/6, an HR PC on auto, was &ldquo;fixed&rdquo; months ago with <code>speed 100</code> and <code>duplex half</code>. Put it back to autonegotiation.</p>
${K.hint(`At <code>(config-if)#</code>: <code>interface g0/3</code> → <code>speed 100</code> → <code>duplex full</code>. Type <code>interface g0/6</code> to move straight to the next port. To restore negotiation, set both values to <code>auto</code>.`)}
${K.term({env:"ios2", title:"match one port, undo a bad fix", opts:{kind:"switch", host:"SW-3F", model:"C9200L-24P-4G"},
  setup:env=>{ const I=env.intfs;
    I["GigabitEthernet0/1"].desc="RECEPTION-PC"; I["GigabitEthernet0/3"].desc="LABEL-PRINTER fixed 100/full";
    I["GigabitEthernet0/6"].desc="HR-PC"; I["GigabitEthernet0/6"].speed=100; I["GigabitEthernet0/6"].duplex="half";
    I["GigabitEthernet0/7"].shut=true; I["GigabitEthernet0/8"].shut=true; },
  intro:"Start with <code>enable</code>. In configuration mode, put <code>do</code> in front of a show command to run it.",
  tasks:[
    {text:"Run <code>show interfaces status</code> and find the ports without the <i>a-</i> prefix", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+st/i.test(h))},
    {text:"Make Gi0/3 match the printer: <code>speed 100</code> and <code>duplex full</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/3"]; return String(i.speed)==="100" && i.duplex==="full"; }},
    {text:"Put Gi0/6 back to autonegotiation: <code>speed auto</code> and <code>duplex auto</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/6"]; return i.speed==="auto" && i.duplex==="auto"; }},
    {text:"Verify with <code>do show interfaces status</code> — Gi0/3 shows <i>full 100</i>, Gi0/6 shows <i>a-full a-1000</i>", done:e=>{ const h=e.history; let fix=-1, sh=-1; h.forEach((x,k)=>{ if(/^\s*(speed|duplex)\s+a/i.test(x)) fix=k; if(/^\s*(do\s+)?sh\w*\s+int\w*\s+st/i.test(x)) sh=k; }); const i=e.intfs["GigabitEthernet0/6"]; return fix>-1 && sh>fix && i.speed==="auto" && i.duplex==="auto"; }},
    {text:"<code>end</code>, then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"Gi0/3 matches the printer because both ends are fixed the same, and Gi0/6 negotiates gigabit full duplex again: auto on both ends, or the same fixed values on both.",
  solve:["enable","show interfaces status","configure terminal","interface g0/3","speed 100","duplex full","interface g0/6","speed auto","duplex auto","do show interfaces status","end","copy running-config startup-config",""]})}
${K.check({q:"show interfaces status shows a modern PC's port as 'a-half a-100'. Most likely explanation?", o:["The PC is hard-coded to 100 Mb/s, so the switch's auto side fell back to half duplex","The cable is over 100 m","The port is in the wrong VLAN","The PC is off"], a:0, why:"'a-' means negotiated. A modern device ending up at half duplex means the switch heard no advertisements: the PC is hard-coded. The switch sensed 100 Mb/s but not the duplex, so it assumed half."})}
<h3>Hands-on: find and fix the mismatch</h3>
<p>This is the Ikoyi office. The scan server on Gi0/5 was replaced last month; the new one is on auto, but the switch port still has the old server's fixed settings. Console in, prove the mismatch, fix it and verify.</p>
${K.bench({id:"m2-duplex-mismatch", points:80, from:"CCNA · Module 2 · lesson 3", title:"the slow print server", viewBox:"0 0 760 370",
  intro:"Click switch port 5 to inspect the link (red light: up, but mismatched). Tray → <b>Console</b> from the laptop's <b>USB</b> to the switch's <b>CON</b>, then <b>Terminal app (PuTTY)</b> under the laptop.",
  devices:[
    {id:"sw", kind:"switch", label:"SW-2F", model:"Catalyst 9200 · 2nd floor", x:300, y:30,
      config:env=>{ env.exec("enable"); env.exec("configure terminal"); env.exec("interface g0/2"); env.exec("description ACCTS-PC"); env.exec("interface g0/5"); env.exec("description PRINT-SRV"); env.exec("speed 100"); env.exec("duplex full"); env.exec("end"); }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:40, y:40},
    {id:"pc1", kind:"pc", label:"ACCTS-PC", x:300, y:250, ip:"10.20.0.21", mask:"255.255.255.0"},
    {id:"srv", kind:"server", label:"PRINT-SRV", x:580, y:250, ip:"10.20.0.30", mask:"255.255.255.0"},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw:g2"}, {type:"cat6", a:"srv:eth", b:"sw:g5"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into SW-2F (laptop USB → switch CON, PuTTY at 9600 8N1, no flow control)", done:B=>Bench.consoleOk(B,"sw")},
    {text:"Run <code>show interfaces status</code>. Which port has fixed values with no <i>a-</i> prefix?", done:B=>B.devs.sw.env.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+st/i.test(h))},
    {text:"Run <code>show interfaces g0/5</code> and find the CRC and runt counters on this full-duplex side", done:B=>B.devs.sw.env.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/5\s*$/i.test(h))},
    {text:"Fix it: on Gi0/5 set <code>speed auto</code> and <code>duplex auto</code> so both ends negotiate (the light turns green)", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/5"]; return i.speed==="auto" && i.duplex==="auto" && Bench.upAt(B,"srv:eth") && !Bench.mismatch(B,"srv:eth","sw:g5"); }},
    {text:"Verify with <code>show interfaces status</code> again — Gi0/5 should read <i>a-full a-1000</i>", done:B=>{ const h=B.devs.sw.env.history; let fix=-1, sh=-1; h.forEach((x,k)=>{ if(/^\s*(speed|duplex)\s+a/i.test(x)) fix=k; if(/^\s*(do\s+)?sh\w*\s+int\w*\s+st/i.test(x)) sh=k; }); return fix>-1 && sh>fix && !Bench.mismatch(B,"srv:eth","sw:g5"); }},
    {text:"Save the configuration, then from ACCTS-PC <code>ping 10.20.0.30</code> to confirm the server is reachable", done:B=>B.devs.sw.env.savedOnce && Bench.pinged(B,"pc1","10.20.0.30")},
  ],
  win:"You proved a duplex mismatch from the switch's own counters, removed the one-sided hard-coding, and the link renegotiated gigabit full duplex. The 25-minute copy would now take seconds.",
  solve:[["plug","console","lap:usb","sw:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","show interfaces status"],["term","show interfaces g0/5"],["term","configure terminal"],["term","interface g0/5"],["term","speed auto"],["term","duplex auto"],["term","end"],["term","show interfaces status"],["term","copy running-config startup-config"],["term",""],["pc","pc1","ping 10.20.0.30"]]})}
${K.hint("Before fixing it, ping 10.20.0.30 from ACCTS-PC: it works. That's the trap from the opening — a ping proves the path exists, not that it performs. After the fix, <code>show interfaces g0/5</code> reads Full-duplex, 1000Mb/s with clean counters.")}

${K.job("File copies to the print server are painfully slow, but ping works",`
<p><b>The ticket.</b> &ldquo;Accounts, 2nd floor. Saving scans to the print/scan server takes 20–30 minutes since last month. Was seconds. Internet fine. PC rebooted twice.&rdquo; Eight users affected.</p>
<p><b>Questions.</b> &ldquo;Everyone, or one PC?&rdquo; — <i>&ldquo;Everyone.&rdquo;</i> &ldquo;Only that server, or the shared drive too?&rdquo; — <i>&ldquo;Shared drive is fine.&rdquo;</i> &ldquo;Anything change when it started?&rdquo; — <i>&ldquo;The vendor installed a new scan server.&rdquo;</i> All users, one server, a recent hardware change: suspect the server's own connection.</p>
<p><b>Checks.</b></p>
<ol>
<li><code>ping 10.20.0.30</code> from an Accounts PC: replies under 1 ms. Reachability is fine; this is performance.</li>
<li><code>show interfaces status</code>: PCs show <code>a-full a-1000</code>; Gi0/5 (PRINT-SRV) shows <code>full 100</code> — fixed values.</li>
<li><code>show interfaces g0/5</code>: up/up, Full-duplex, 100Mb/s, thousands of CRC errors and hundreds of runts. <code>clear counters</code>, five minutes of test copying: still climbing.</li>
<li><code>show running-config</code>: <code>speed 100</code> and <code>duplex full</code> under Gi0/5, left over from the old server.</li>
<li>The vendor reads the new server's NIC: &ldquo;Auto negotiation; link 100 Mbps half duplex.&rdquo; Mismatch confirmed.</li>
</ol>
<p><b>The fix.</b> The link drops for a few seconds while it renegotiates, so warn Accounts first. Then <code>interface g0/5</code>, <code>speed auto</code>, <code>duplex auto</code>, <code>end</code>, <code>copy running-config startup-config</code>. The port comes back <code>a-full a-1000</code>; after <code>clear counters</code> and ten minutes of use, CRC and runts stay at 0. A 600 MB batch of scans saves in about ten seconds.</p>
<p><b>What you say.</b> &ldquo;Fixed. The network socket for the new scan server was still set up for the old one, so the two ends were talking past each other: small messages got through, big files kept being interrupted. They're matched now, and faster than the old server ever was.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Slow saves to PRINT-SRV (10.20.0.30) since server swap; ping OK. SW-2F Gi0/5 hard-coded speed 100/duplex full (legacy config); new NIC on auto fell back to 100/half. Duplex mismatch: CRC 2871, runts 312, rising. Set Gi0/5 speed auto/duplex auto (users warned), saved. Now a-full a-1000, counters clean after 10 min, 600 MB test ~10 s. Added 'check switch port speed/duplex' to the server-swap checklist. 35 min.&rdquo;</i></p>`)}

${K.dodont([
  "Leave speed and duplex on auto at both ends unless there's a documented reason.",
  "If a device must be fixed, fix the switch port to the <b>same</b> values and say why in the port description.",
  "Check <code>show interfaces status</code> for <code>a-half</code> and one-sided fixed values when users report &ldquo;slow but working&rdquo;.",
  "Replace any hub you find, and consider who could have captured traffic on it.",
],[
  "Don't hard-code one end of a link and leave the other on auto.",
  "Don't &ldquo;fix&rdquo; a mismatch with half duplex.",
  "Don't treat a successful ping as proof a link is healthy.",
  "Don't change speed or duplex on a busy port without warning its users.",
])}

<h2>Interview corner</h2>
${K.hint(`Define each in one sentence, say which device splits it, and give a number.`)}
${K.reveal("“What's the difference between a collision domain and a broadcast domain?”",`<p>"A collision domain is the set of devices whose transmissions can collide: everything on a hub, or one switch port and its device. Switches split collision domains, one per port, and with full duplex there are no collisions at all. A broadcast domain is the set of devices that receive each other's broadcasts, such as ARP and DHCP. Switches flood broadcasts, so a switched network is one broadcast domain per VLAN; routers split them, one per interface. A router with two LAN interfaces, each to a 24-port switch, gives two broadcast domains but around fifty collision domains."</p>`)}
${K.hint(`Cause, mechanism, symptoms on each side, commands, fix.`)}
${K.reveal("“What causes a duplex mismatch, and how do you spot it?”",`<p>"Usually one end is hard-coded and the other left on auto. The hard-coded side stops advertising; the auto side senses the speed but not the duplex, so at 10 or 100 Mb/s it falls back to half. The link stays up and pings work, but the half side treats incoming frames as collisions and aborts its own, so transfers crawl. I'd run <code>show interfaces status</code> and look for <code>a-half</code> or fixed values on one end, then <code>show interfaces</code>: CRC errors and runts on the full side, late collisions on the half side. The fix is auto on both ends, or the same fixed values on both — never half duplex."</p>`)}
${K.hint(`Problem (shared medium) → rules (CSMA/CD) → why it vanished → where it still matters.`)}
${K.reveal("“What is CSMA/CD, and is it still used?”",`<p>"It's how half-duplex Ethernet shares a medium: listen for a carrier, transmit while listening, and on a collision send a jam signal, back off a random number of slot times and retry, up to 16 times. It was essential on coax and hubs. On switched full-duplex links it's switched off, because collisions can't happen. It only matters when a port runs half duplex, which today usually means a duplex mismatch — the source of late collisions."</p>`)}

${K.recap([
  "A collision domain is the set of devices that can collide; CSMA/CD (listen, transmit, detect, jam, back off, retry) shares it in half duplex.",
  "A hub is a multiport repeater: one half-duplex collision domain, shared bandwidth, and every device sees every frame.",
  "A switch gives every port its own collision domain and lets links run full duplex, with no collisions.",
  "Switches flood broadcasts (one broadcast domain per VLAN); routers stop them (one per interface).",
  "Counting: broadcast domains = router interfaces in use; collision domains = switch and router links, each hub counted once.",
  "Big broadcast domains mean more chatter and a wider blast radius for loops and storms.",
  "Duplex mismatch: one end hard-coded, the auto end falls back to half. Up and pingable but slow; CRC and runts on the full side, late collisions on the half side. Fix: auto on both ends, or the same fixed values on both.",
])}
${K.next(`<b>Lesson 4 — ARP: how IP finds MAC.</b> You've watched ARP broadcasts flood through this lesson's benches. Next you'll take ARP apart: request and reply, the ARP cache, why a PC ARPs for its default gateway, and what gratuitous ARP is for.`)}
`,
quiz:[
  {q:"What does a hub do with a frame that arrives on port 1?", o:["Forwards it only to the port where the destination MAC was learned","Repeats it out of every other port","Drops it unless it is a broadcast","Routes it using the destination IP address"], a:1, why:"A hub is a Layer 1 multiport repeater. It reads no addresses and repeats every signal out of every other port, so all devices on it share one collision domain.", lvl:1},
  {q:"A half-duplex network card detects a collision while transmitting. What is the very next thing it does?", o:["Waits a random backoff time","Sends a jam signal","Switches to full duplex","Resends the frame immediately"], a:1, why:"After detecting a collision the card first sends a 32-bit jam signal so every station notices the collision, then backs off for a random number of slot times and starts again with carrier sense.", lvl:1},
  {q:"Which device separates broadcast domains?", o:["Hub","Layer 2 switch","Router","Repeater"], a:2, why:"Routers do not forward broadcasts between their interfaces, so each router interface bounds a broadcast domain. Switches flood broadcasts within a VLAN; hubs and repeaters repeat everything.", lvl:1},
  {q:"Why do network designers keep broadcast domains to a sensible size?", o:["Because switches can only learn 250 MAC addresses","Because every host must receive and process every broadcast, and a loop or faulty device affects the whole domain","Because routers cannot route to large subnets","Because broadcasts are only allowed on gigabit links"], a:1, why:"Every device in a broadcast domain receives every broadcast (ARP, DHCP, discovery traffic) and must process it. A large domain means more background chatter for everyone, and problems such as broadcast storms spread to every device in it.", lvl:1},
  {q:"A PC and a switch port are both set to auto, and both support 10/100/1000 Mb/s in full and half duplex. What do they negotiate?", o:["100 Mb/s half duplex","100 Mb/s full duplex","1000 Mb/s full duplex","1000 Mb/s half duplex"], a:2, why:"Autonegotiation picks the best mode both ends support, in the order 1000 full, 1000 half, 100 full, 100 half, 10 full, 10 half. Two modern ports on auto agree on 1000 Mb/s full duplex.", lvl:1},
  {q:"On a half-duplex Ethernet link, what is a late collision?", o:["A collision that happens during the preamble","A collision detected after the first 64 bytes (512 bits) of the frame have been sent","Any collision on a link longer than 100 m","A collision that happens after the frame has been fully received"], a:1, why:"The 64-byte minimum frame ensures that on a correctly built half-duplex network any collision is detected within the first 512 bits. A collision detected after that is a late collision, and on modern networks it usually means a duplex mismatch.", lvl:2},
  {type:"multi", q:"Which two statements are true of a switch port running full duplex? (Choose two.)", o:["It can send and receive at the same time","CSMA/CD is switched off, because collisions cannot happen on the link","It forms a separate broadcast domain from the other ports","It shares its bandwidth with every other port on the switch","It must connect to a hub"], a:[0,1], why:"Full duplex means simultaneous send and receive on separate paths with only two devices on the link, so collisions are impossible and CSMA/CD is not used. The port is still in the same broadcast domain as the other ports in its VLAN, and each switch port has its own bandwidth.", lvl:2},
  {q:"Using the topology in the exhibit (no VLANs), how many collision domains and broadcast domains are there?", ex:"R1 G0/0 --- SW1\n   SW1 has PC1, PC2 and PC3 plugged in\nR1 G0/1 --- SW2\n   SW2 has PC4 and PC5 plugged in\n   SW2 port Gi0/8 --- HUB1\n      HUB1 has PC6, PC7 and PC8 plugged in", o:["8 collision domains, 2 broadcast domains","11 collision domains, 2 broadcast domains","8 collision domains, 3 broadcast domains","3 collision domains, 2 broadcast domains"], a:0, why:"SW1: three PC links plus the R1 uplink = 4. SW2: two PC links, the R1 uplink and the HUB1 link = 4; HUB1 and its three PCs share the HUB1 link's collision domain. Total 8. Two router interfaces in use = 2 broadcast domains. 11 is the trap of counting each hub PC separately.", lvl:2},
  {type:"fill", q:"A single switch, with no router and no VLANs, has 6 PCs plugged directly into it and one port connected to a hub with 4 PCs. How many collision domains and broadcast domains are there?", fields:[{label:"Collision domains", a:["7","seven"]},{label:"Broadcast domains", a:["1","one"]}], why:"Six direct PC links give 6 collision domains, and the hub with its 4 PCs is one more, sharing the switch port it hangs off: 7. With no router and no VLANs, everything is one broadcast domain.", lvl:2},
  {q:"Which port in the exhibit shows the classic sign that the device on it was hard-coded while the switch port was left on auto?", ex:"SW-LOBBY#show interfaces status\n\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi1/0/3   RECEPTION-PC       connected    10         a-full a-1000 10/100/1000BaseTX\nGi1/0/4   LABEL-PRINTER      connected    10         a-half  a-100 10/100/1000BaseTX\nGi1/0/5   GATE-CAMERA        connected    30           full    100 10/100/1000BaseTX\nGi1/0/6   OLD-NVR            connected    30         a-full  a-100 10/100/1000BaseTX", o:["Gi1/0/3","Gi1/0/4","Gi1/0/5","Gi1/0/6"], a:1, why:"The a- prefix means the switch reached the value by autonegotiation. a-half on Gi1/0/4 means the switch heard no advertisements from the printer, sensed 100 Mb/s and fell back to half duplex: the printer is hard-coded. Gi1/0/5 is configured on the switch itself, and Gi1/0/6 negotiated full duplex at 100 Mb/s, which is normal for a 100 Mb/s-only device.", lvl:2},
  {type:"match", q:"Match each observation with what it tells you about a duplex mismatch.", pairs:[["Late collisions rising on a port","That port is the half-duplex side"],["CRC errors and runts rising on a port","That port is the full-duplex side"],["a-half in show interfaces status","The switch is on auto and fell back because the far end is hard-coded"],["full 100 with no a- prefix","The switch port itself has been configured with fixed values"]], why:"The half-duplex side runs CSMA/CD and counts collisions, many of them late. The full-duplex side receives the half side's aborted frames as runts and CRC errors. The a- prefix shows a value was negotiated; fixed values without it were typed into the port's configuration.", lvl:2},
  {type:"fill", q:"Which two interface commands put a Cisco switch port back to autonegotiating its speed and duplex?", fields:[{label:"Speed command", a:["speed auto"], ios:true},{label:"Duplex command", a:["duplex auto"], ios:true}], why:"speed auto and duplex auto restore autonegotiation on the port. With both ends on auto, the port and the device advertise their abilities and agree on the best common speed in full duplex.", lvl:2},
  {type:"order", q:"A user says copies to a server are slow but ping works. Put these steps to diagnose and fix a suspected duplex mismatch in order.", items:["Run show interfaces status and look for a-half or fixed values on the server's port","Run show interfaces on that port and read the CRC, runt and late collision counters","Check the server NIC's speed and duplex settings at the other end","Set both ends to auto (or both to the same fixed values) and save","Clear the counters and confirm the errors stop rising during a test copy"], why:"Start with the quick overview, then the detailed counters on the suspect port, then confirm what the far end is doing. Fix both ends consistently, never with half duplex, and prove the fix by watching freshly cleared counters stay at zero under real traffic.", lvl:2},
  {q:"Users report slow transfers to a server on Gi0/5. Based on the exhibit, what is the most likely cause and the best fix?", ex:"SW-2F#show running-config\n...\ninterface GigabitEthernet0/5\n description FILE-SRV\n speed 100\n duplex full\n...\nSW-2F#show interfaces GigabitEthernet0/5\nGigabitEthernet0/5 is up, line protocol is up (connected)\n  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX\n     298 runts, 0 giants, 0 throttles\n     2650 input errors, 2611 CRC, 39 frame, 0 overrun, 0 ignored\n     0 output errors, 0 collisions, 0 interface resets\n     0 late collision, 0 deferred", o:["A faulty cable; replace the patch cord","A duplex mismatch: the server is on auto and fell back to half duplex; set speed auto and duplex auto on Gi0/5 (or fix the server to 100/full too)","The port is in the wrong VLAN; change the access VLAN","The switch port is overloaded; upgrade to 10 Gb/s"], a:1, why:"The port is hard-coded to 100/full, so it sends no autonegotiation advertisements. A server on auto will sense 100 Mb/s but fall back to half duplex. CRC errors and runts on the full-duplex side, with no collisions there, is exactly the mismatch pattern. A cable fault would not explain the one-sided fixed config, and changing the VLAN or speed wouldn't fix the duplex disagreement.", lvl:3},
  {q:"A server team says they set a server NIC to 100 Mb/s full duplex 'for stability'. The switch port is on auto and shows a-half a-100, with late collisions climbing, and backups are failing. Which action is best?", o:["Set the switch port to duplex half so both ends match","Set the server NIC back to auto so both ends negotiate, or, if it truly must stay fixed, configure the switch port to speed 100 and duplex full as well","Replace the cable and leave the settings as they are","Shut and no shut the port to force it to renegotiate"], a:1, why:"The mismatch exists because only one end is fixed. The fix is consistency: auto on both ends (best, and it allows gigabit), or the same fixed full-duplex values on both. Setting the switch to half 'matches' but leaves the link colliding forever. A cable swap or port bounce won't change the settings, so the switch would fall back to half again.", lvl:3},
  {type:"multi", q:"An auditor at a bank branch finds an old hub under the teller counter. It connects three teller PCs to one switch port. Which two risks should be reported? (Choose two.)", o:["Any device on the hub, including a laptop plugged into a spare hub port, can capture the other tellers' traffic","The three PCs share one half-duplex collision domain and its bandwidth, so they slow each other down","The hub creates a separate broadcast domain, so the tellers cannot reach the core banking server","The hub will route the tellers' traffic into the wrong subnet","The switch port will automatically shut down because a hub is attached"], a:[0,1], why:"A hub repeats every frame to every port, so a capture tool in promiscuous mode sees all the tellers' unencrypted traffic, and all its devices share one half-duplex collision domain. A hub does not split broadcast domains or route anything, and switches do not shut a port merely because a hub is connected.", lvl:3},
],
cards:[
  {f:"What is a collision?", b:"Two or more devices transmitting on a shared medium at the same time, so their signals overlap and both frames are destroyed and must be resent."},
  {f:"CSMA/CD steps", b:"Listen for a carrier; transmit while listening; detect a collision; send a 32-bit jam signal; back off a random number of slot times; retry. Gives up after 16 collisions. Half duplex only."},
  {f:"Half vs full duplex", b:"Half: send or receive, not both; uses CSMA/CD; collisions possible. Full: send and receive at once on separate paths; no collisions; CSMA/CD off."},
  {f:"What is a hub?", b:"An obsolete Layer 1 multiport repeater. Repeats every signal out of every other port: one collision domain, half duplex, shared bandwidth, everyone sees every frame."},
  {f:"Why is a hub a security problem?", b:"Every device receives every frame. A PC in promiscuous mode running a capture tool such as Wireshark can record everyone's unencrypted traffic."},
  {f:"Collision domain", b:"The devices whose transmissions can collide. A whole hub and everything on it is one; each switch port and router port is its own."},
  {f:"Broadcast domain", b:"The devices that receive each other's broadcasts (ffff.ffff.ffff). Switches flood broadcasts within a VLAN; routers stop them, so each router interface bounds one."},
  {f:"Counting domains (no VLANs)", b:"Broadcast domains = router interfaces in use. Collision domains = one per link on a switch or router port, each hub counted once, each switch-to-switch link counted once."},
  {f:"What is a late collision?", b:"A collision detected after the first 64 bytes (512 bits) of a frame have been sent. Never normal; usually a duplex mismatch, on the half-duplex side."},
  {f:"Why keep broadcast domains small?", b:"Every host must process every broadcast (ARP, DHCP, discovery). Big domains mean more chatter, and loops, broadcast storms or rogue devices affect everyone."},
  {f:"How does a duplex mismatch happen?", b:"One end hard-coded (e.g. speed 100, duplex full), the other on auto. The auto side senses the speed but not the duplex, so at 10/100 it falls back to half."},
  {f:"Duplex mismatch symptoms", b:"Link up, ping works, big transfers slow. CRC errors and runts on the full-duplex side; late collisions on the half-duplex side."},
  {f:"Reading show interfaces status Duplex/Speed", b:"a-full a-1000 = autonegotiated (healthy). full 100 = configured on the port. a-half = auto side fell back because the far end is hard-coded: suspect a mismatch."},
  {f:"Fixing a duplex mismatch", b:"Auto on both ends (speed auto, duplex auto), or the same fixed full-duplex values on both. Never 'fix' it with half duplex. Clear counters and confirm errors stop rising."},
],
});
// ---------- Module 2 · Lesson 4 ----------
L.push({
id:"sw-arp", mins:60, level:"Beginner · builds on Module 2 lessons 1–3",
t:"ARP: how IP finds MAC — and why your gateway's MAC is everywhere",
html:`
${K.goals([
  "Explain why a host that knows an IP address still can't send a frame — and how ARP fills the gap.",
  "Decide, from an IP address and mask, whether a host ARPs for the destination itself or for its default gateway.",
  "Read an ARP request and reply field by field: sender/target MAC and IP, opcode 1 and 2, EtherType 0x0806.",
  "Read and clear the ARP cache on Windows (<code>arp -a</code>, <code>arp -d</code>) and read a router's <code>show ip arp</code>, including the <code>-</code> age and the first lost ping (<code>.!!!!</code>).",
  "Recognise gratuitous ARP, proxy ARP, a duplicate IP and ARP spoofing from their symptoms.",
])}
${K.pre(["Module 1: encapsulation, the Ethernet frame, MAC and IP addresses, default gateway, your first IOS session.","Module 2 lessons 1–3: MAC formats, how a switch learns and floods, broadcast domains."])}

<h2>Why this matters at work</h2>
<p>Monday morning at a managed service provider in Victoria Island, Lagos. A client calls: two PCs in accounts "keep dropping off the network every few minutes". When one comes back, the other goes. Rebooting helps for a while. The cables, the switch and the internet link are fine.</p>
<p>The engineer who fixes this in ten minutes doesn't guess. She runs <code>arp -a</code> on a third PC twice, a minute apart, and watches one IP address change its MAC between readings — the fingerprint of a <b>duplicate IP address</b>, invisible unless you understand the small protocol between IP and Ethernet: ARP. By the end of this lesson you'll read that fingerprint yourself, and know why the router's MAC turns up in almost every frame that leaves an office.</p>

<h2>The gap between Layer 3 and Layer 2</h2>
<p>In Module 1 you saw a packet wrapped in layers: data inside a segment, the segment inside an IP packet, the packet inside an Ethernet frame. The packet carries the <b>destination IP</b>; the frame carries the <b>destination MAC</b>. In lessons 1 and 2 you saw that switches read only MACs.</p>
<p>Now stand inside PC1. A user types <code>ping 192.168.10.12</code>. The IP packet is easy: source <code>192.168.10.11</code>, destination <code>192.168.10.12</code>. The source MAC is PC1's own card. But the <b>destination MAC</b>? Users type IPs, and DNS only returns IPs. There's a blank in the header, and a switch can't deliver to a blank.</p>
${K.svg("0 0 720 250",
  K.dev("pc",70,170,"PC1","192.168.10.11")+K.dev("switch",360,170,"Switch","reads MACs only")+K.dev("pc",650,170,"PC2","192.168.10.12")+
  K.link(95,170,334,170)+K.link(386,170,625,170)+
  K.band(110,30,120,30,"Dst MAC: ????","var(--chip)")+K.band(232,30,120,30,"Src MAC: PC1")+K.band(354,30,90,30,"Type 0x0800")+K.band(446,30,170,30,"IP .11 → .12  | data")+
  `<rect x="110" y="30" width="120" height="30" rx="5" fill="none" stroke="var(--bad)" stroke-width="2" stroke-dasharray="5 3"/>`+
  K.txt(170,80,"the blank ARP has to fill",{mid:true,c:"bad",s:11})+
  K.txt(360,108,"Layer 3 knows WHERE (IP)  ·  Layer 2 needs WHO (MAC)",{mid:true,c:"fg",s:12,f:"display",b:true}),
  "PC1 can build the IP packet, but the Ethernet header needs a destination MAC it doesn't know yet. ARP is how it finds out.")}
<p>The protocol that fills the blank is the ${K.g("Address Resolution Protocol (ARP)","Finds the MAC address that belongs to an IPv4 address on the local network. RFC 826.")}. Its job in one sentence: <b>given an IPv4 address on my local network, find its MAC address.</b> It asks everyone at once with a ${K.g("broadcast","A frame to ffff.ffff.ffff. Switches flood it to every port in the VLAN.")} and lets the owner of that IP answer.</p>
${K.analogy(`<p>You bring a parcel for "Desk 12" into an open-plan office. You know <i>where</i> it goes, not <i>who</i> sits there. So you call out: "Who's at desk 12? I'm at desk 11." Everyone hears; only Chidi at desk 12 answers. You hand it over and remember his face. Calling out is the ARP request, Chidi's answer the reply, remembering the cache.</p>`)}
<p>Three facts follow, and you'll use them all lesson:</p>
<ul>
<li><b>ARP works only inside one local network.</b> Routers stop broadcasts (lesson 3), so a host can only ARP within its own ${K.g("broadcast domain","One VLAN/subnet, up to the router (lesson 3).")}.</li>
<li><b>ARP is not IP.</b> It rides directly in Ethernet with ${K.g("EtherType","What the frame carries: 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6.")} <code>0x0806</code> — no IP header, no TTL, so it can't be routed.</li>
<li><b>ARP is IPv4 only.</b> IPv6 uses Neighbor Discovery (NDP) instead — see the IPv6 module.</li>
</ul>
${K.check({q:"PC1 knows the IP address of a printer on its own subnet but has never talked to it. What is missing before PC1 can send it a frame?", o:["The printer's IP address","PC1's own MAC address","The printer's MAC address","The switch port the printer is on"], a:2, why:"PC1 has both IPs and its own MAC. The destination MAC is the blank. PC1 never needs the switch port — that's the switch's job, using its MAC table."})}

<h2>The decision every host makes: local or remote?</h2>
<p>Before ARPing, a host asks one question: <b>is the destination on my own subnet?</b> The answer decides <i>whose</i> MAC it asks for:</p>
<ul>
<li><b>Local</b> → ARP for the <b>destination's own IP</b>. The frame goes straight to it.</li>
<li><b>Remote</b> → ARP for the <b>default gateway's IP</b>. The frame goes to the router, which takes it from there.</li>
</ul>
<p>The second line surprises almost everyone. When your PC talks to a server on another network, it <b>never</b> ARPs for that server — it couldn't, because the server isn't in its broadcast domain. The PC puts the <b>router's MAC</b> in the frame and the <b>server's IP</b> in the packet. That is why your gateway's MAC is everywhere: nearly every internet or cloud frame from an office PC is addressed to it.</p>
${K.svg("0 0 720 300",
  K.box(250,14,220,44,"Packet to send","destination IP = D",true)+
  K.arrow(360,58,360,88)+
  K.box(200,90,320,52,"Is D on my subnet?","compare D with my IP, using my mask")+
  K.arrow(260,142,150,186,"yes — local")+K.arrow(460,142,570,186,"no — remote",true)+
  K.box(30,188,240,52,"ARP for D itself","frame dst MAC = D's MAC")+
  K.box(450,188,240,52,"ARP for my default gateway","frame dst MAC = router's MAC",true)+
  K.txt(150,268,"e.g. PC2 on the same switch",{mid:true})+K.txt(570,268,"e.g. a server on another subnet, the internet",{mid:true})+
  K.txt(560,288,"no gateway? → Windows: \"General failure\"",{mid:true,c:"warn"}),
  "Every IPv4 host runs this test for every packet. The answer decides whose MAC address it ARPs for.")}
<h3>How "is it on my subnet?" is worked out</h3>
<p>The host uses its ${K.g("subnet mask","A value such as 255.255.255.0 marking which part of an IP address is the network. Full calculations come in the subnetting module.")}. Subnetting gets its own module later; for now you only need masks of 255s and 0s (plus one easy exception):</p>
<ul>
<li>Where the mask says <b>255</b>, that number is network — it must <b>match</b>.</li>
<li>Where the mask says <b>0</b>, that number is the host's own — it can be <b>anything</b>.</li>
</ul>
<p>(Technically the host ANDs both addresses with its mask, bit by bit, and compares the results. With 255s and 0s, that's the same thing.)</p>
${K.steps([
  ["PC1 pings PC2 — same subnet", `<p>PC1 is <code>192.168.10.11</code>, mask <code>255.255.255.0</code>; destination <code>192.168.10.12</code>. First three numbers: <code>192.168.10</code> vs <code>192.168.10</code> — match. <b>Local:</b> PC1 ARPs for <code>192.168.10.12</code>.</p>`],
  ["PC1 pings a file server — another subnet", `<p>Destination <code>192.168.20.50</code>: <code>192.168.10</code> vs <code>192.168.20</code> — different. <b>Remote:</b> PC1 ARPs for its gateway, <code>192.168.10.1</code>. The frame carries the router's MAC; the packet still says <code>192.168.20.50</code>.</p>`],
  ["A bigger network: mask 255.255.0.0", `<p>A host is <code>172.16.5.20</code>, mask <code>255.255.0.0</code>; destination <code>172.16.200.9</code>. Only two numbers are network: <code>172.16</code> vs <code>172.16</code> — <b>local</b>, even though the third number differs. It ARPs for <code>172.16.200.9</code> directly.</p>`],
  ["The easy exception: 255.255.255.128", `<p>This mask splits the last number into halves: 0–127 and 128–255. A host at <code>10.20.0.13</code> is in the lower half; <code>10.20.0.200</code> is in the upper half — a <b>different</b> subnet, so the host uses its gateway, even though both start <code>10.20.0</code>. You'll use this case in bench 2.</p>`],
])}
${K.remember(`<p><b>"Local? Ask the host. Remote? Ask the router."</b> A host only ever ARPs for the destination itself (same subnet) or its default gateway (anything else). A PC ARPing for an address on another subnet has a wrong mask.</p>`)}
${K.mistake(`Thinking a PC ARPs for the far-away server and the router "passes the ARP along". ARP never crosses a router. The PC ARPs for the gateway; the router, if it needs to, ARPs for the server on the far side — a separate exchange on a different network.`)}
${K.check({q:"A laptop is 192.168.50.23, mask 255.255.255.0, gateway 192.168.50.1. The user opens a web app at 10.4.1.80. Which IP does the laptop put in its ARP request?", o:["10.4.1.80","192.168.50.1","192.168.50.255","None — it sends a broadcast to 10.4.1.80"], a:1, why:"10.4.1 doesn't match 192.168.50, so it's remote. The laptop ARPs for its gateway, 192.168.50.1, and sends the frame to the router's MAC with 10.4.1.80 as the IP destination."})}

<h3>Pen and paper: which MAC goes in the frame?</h3>
<p>Router R has <b>G0/0</b> = <code>192.168.1.1/24</code> (MAC <code>R0</code>) and <b>G0/1</b> = <code>10.0.0.1/24</code> (MAC <code>R1</code>). <code>/24</code> is shorthand for <code>255.255.255.0</code>. Four hosts, MACs shortened to letters:</p>
<div class="tablewrap"><table>
<tr><th>Host</th><th>IP address</th><th>Mask</th><th>Gateway</th><th>MAC</th></tr>
<tr><td>A</td><td>192.168.1.10</td><td>255.255.255.0</td><td>192.168.1.1</td><td>AAAA</td></tr>
<tr><td>B</td><td>192.168.1.20</td><td>255.255.255.0</td><td>192.168.1.1</td><td>BBBB</td></tr>
<tr><td>C</td><td>10.0.0.30</td><td>255.255.255.0</td><td>10.0.0.1</td><td>CCCC</td></tr>
<tr><td>D</td><td>192.168.1.40</td><td>255.255.0.0 (typed by hand)</td><td>192.168.1.1</td><td>DDDD</td></tr>
</table></div>
<p>What is the <b>destination MAC</b> of the frame as it leaves the sender?</p>
<ol>
<li>A sends to B.</li>
<li>A sends to C. (And what are the destination and source MACs on the far side of the router?)</li>
<li>C replies to A.</li>
<li>D sends to C.</li>
<li>D sends to a server at <code>192.168.7.5</code> in another branch, reached through R.</li>
</ol>
${K.hint("Run the local-or-remote test with the <i>sender's</i> mask. Host D's mask is the odd one: with 255.255.0.0, only the first two numbers must match.")}
${K.reveal("Show the answers", `<ol>
<li><b>BBBB.</b> 192.168.1 matches — local.</li>
<li><b>R0.</b> 10.0.0 ≠ 192.168.1 — remote, so A ARPs for 192.168.1.1. Beyond the router, a <i>new</i> frame: destination <b>CCCC</b>, source <b>R1</b>. The IPs inside never change; MACs change per hop, as in Module 1.</li>
<li><b>R1.</b> To C, 192.168.1.10 is remote, so it ARPs for its own gateway, 10.0.0.1.</li>
<li><b>R0.</b> D compares "192.168" with "10.0" — different, so it uses the gateway and it works. A wrong mask doesn't always break things, which makes it sneaky.</li>
<li><b>Trouble.</b> "192.168" vs "192.168" — the same! D thinks the server is local and ARPs for it directly. Nobody on the LAN owns it, so nobody answers — unless the router answers for it with <b>proxy ARP</b> (later), giving R0 anyway. The root fault is D's mask.</li>
</ol>`)}

<h2>Inside an ARP exchange: request and reply</h2>
<p>Slow it right down. PC1 (<code>192.168.10.11</code>, MAC <code>0050.9a50.54cf</code>) wants PC2 (<code>192.168.10.12</code>) and has no ARP entry for it.</p>
${K.svg("0 0 720 300",
  K.dev("pc",70,80,"PC1","192.168.10.11")+K.dev("switch",330,150,"Switch","")+K.dev("pc",620,60,"PC2","192.168.10.12")+K.dev("pc",620,160,"PC3","192.168.10.13")+K.dev("router",620,250,"Router","192.168.10.1")+
  K.link(95,90,304,145)+K.link(356,145,595,70)+K.link(356,152,595,160)+K.link(356,158,596,245)+
  K.arrow(110,70,290,128,"1  request: broadcast")+
  `<path d="M372,140 L580,64 M372,150 L580,152 M372,160 L580,236" stroke="#f59e0b" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#karr)"/>`+
  K.txt(470,120,"2  flooded to every port",{mid:true,c:"warn"})+
  K.arrow(590,40,120,40,"3  reply: unicast, only from PC2",true)+
  K.txt(596,190,"PC3, router: not me → ignore",{end:true,s:10}),
  "The request is a broadcast, so the switch floods it to everyone in the VLAN. Only the owner of the IP replies, unicast, straight back to the asker.")}
<h3>Step 1 — the request</h3>
<p>PC1 puts an ARP message in a broadcast frame. A capture tool such as Wireshark summarises it as <i>"Who has 192.168.10.12? Tell 192.168.10.11"</i>. The fields that matter:</p>
<div class="tablewrap"><table>
<tr><th>Where</th><th>Field</th><th>Request (PC1 asks)</th><th>Reply (PC2 answers)</th></tr>
<tr><td rowspan="3">Ethernet header</td><td>Destination MAC</td><td><code>ffff.ffff.ffff</code> (broadcast)</td><td><code>0050.9a50.54cf</code> (PC1 — unicast)</td></tr>
<tr><td>Source MAC</td><td><code>0050.9a50.54cf</code> (PC1)</td><td><code>0050.9b50.5662</code> (PC2)</td></tr>
<tr><td>EtherType</td><td><code>0x0806</code> (ARP)</td><td><code>0x0806</code> (ARP)</td></tr>
<tr><td rowspan="5">ARP message</td><td>Opcode</td><td><b>1</b> = request</td><td><b>2</b> = reply</td></tr>
<tr><td>Sender MAC</td><td><code>0050.9a50.54cf</code> (PC1)</td><td><code>0050.9b50.5662</code> — <i>the answer</i></td></tr>
<tr><td>Sender IP</td><td><code>192.168.10.11</code></td><td><code>192.168.10.12</code></td></tr>
<tr><td>Target MAC</td><td><code>0000.0000.0000</code> (unknown — the question)</td><td><code>0050.9a50.54cf</code> (PC1)</td></tr>
<tr><td>Target IP</td><td><code>192.168.10.12</code></td><td><code>192.168.10.11</code></td></tr>
</table></div>
<p>Four housekeeping fields never change on Ethernet (hardware type 1, protocol type 0x0800, sizes 6 and 4), and the 28-byte message is padded to Ethernet's 64-byte minimum. The ${K.g("opcode","1 = request ('who has?'), 2 = reply ('is at').")} says which kind it is. In the reply the roles swap: the replier becomes the <b>sender</b> and fills in its own MAC.</p>
<h3>Step 2 — the switch floods it</h3>
<p>Destination <code>ffff.ffff.ffff</code>, so the switch learns PC1's MAC on the incoming port and <b>floods</b> the frame out every other port in the VLAN (lesson 2). PC2, PC3, the router and the printer all receive it and read the <b>target IP</b>. Not theirs? They drop it.</p>
<h3>Step 3 — the owner replies, unicast</h3>
<p>PC2 sees its own IP as the target. It <b>stores PC1's mapping</b> from the request (saving an ARP later), then sends an ${K.g("ARP reply","Opcode 2, unicast to the requester, with the replier's MAC in the sender MAC field.")}, unicast to PC1: Wireshark shows <i>"192.168.10.12 is at 00:50:9b:50:56:62"</i>. The switch already knows PC1's port, so the reply goes out that one port.</p>
<h3>Step 4 — PC1 caches it and sends the real frame</h3>
<p>PC1 stores <code>192.168.10.12 → 0050.9b50.5662</code> in its ${K.g("ARP cache","A device's table of recently learned IP-to-MAC mappings. Entries age out and are re-learned when needed.")}, fills in the blank MAC and sends the ping. Later frames to PC2 go out instantly, with no ARP, until the entry ages out.</p>
${K.q({type:"order", q:"PC1 has an empty ARP cache and pings PC2 on the same subnet. Put these events in the order they happen.", items:["PC1 decides PC2 is on its own subnet and finds no ARP cache entry for it","PC1 sends an ARP request in a frame addressed to ffff.ffff.ffff","The switch floods the request out every other port in the VLAN","PC2 adds PC1 to its own ARP cache and sends a unicast ARP reply","PC1 caches PC2's MAC and sends the ICMP echo request to that MAC"], why:"The local-or-remote test and cache check come first; only a miss triggers ARP. The broadcast request is flooded. PC2 learns PC1 from the request, then replies unicast. Only then can PC1 fill in the destination MAC and send the ping."})}
${K.dyk(`ARP was written up by David C. Plummer in RFC 826 in November 1982 and has barely changed since. The same request and reply run on every IPv4 Ethernet network on earth, from a two-PC office in Ibadan to a hyperscale data centre.`)}
${K.exam(`Know the direction of each message: <b>request = broadcast</b> (<code>ffff.ffff.ffff</code>), <b>reply = unicast</b>. Distractors love "the reply is broadcast so every host can learn it" and "ARP is carried inside an IP packet" — both false. ARP rides directly in Ethernet with EtherType 0x0806.`)}
${K.check({q:"In an ARP request, what is in the <b>target MAC</b> field?", o:["ffff.ffff.ffff","The sender's own MAC","0000.0000.0000 — the unknown being asked for","The default gateway's MAC"], a:2, why:"The target MAC is what's being asked for, so it's all zeros. Don't confuse it with the <i>Ethernet</i> destination MAC, which is ffff.ffff.ffff because the frame is a broadcast."})}

<h3>Across a router: the same idea, twice</h3>
<p>Now PC1 pings the file server <code>192.168.20.50</code> behind the router. PC1's test says <b>remote</b>, so it ARPs for <code>192.168.10.1</code> (the router's G0/0) and sends the ping to the router's MAC. The router strips the frame, checks the destination IP against its routing table, finds <code>192.168.20.0/24</code> connected on G0/1 — and needs the server's MAC for the new frame. So the <i>router</i> runs its own ARP on the second network: <i>"Who has 192.168.20.50? Tell 192.168.20.1."</i></p>
${K.svg("0 0 740 260",
  K.dev("pc",60,180,"PC1","192.168.10.11")+K.dev("switch",220,180,"SW1","")+K.dev("router",420,180,"R1","G0/0 .10.1 · G0/1 .20.1")+K.dev("server",660,180,"FILESRV","192.168.20.50")+
  K.link(85,180,194,180)+K.link(246,180,396,180,"G0/0")+K.link(444,180,640,180,"G0/1")+
  K.txt(200,24,"Hop 1 — on 192.168.10.0/24",{mid:true,c:"fg",b:true})+
  K.band(40,32,150,26,"dst MAC: R1 G0/0")+K.band(192,32,120,26,"src MAC: PC1")+K.band(314,32,60,26,"0x0800")+
  K.band(40,62,334,26,"IP 192.168.10.11 → 192.168.20.50")+
  K.txt(570,24,"Hop 2 — on 192.168.20.0/24",{mid:true,c:"fg",b:true})+
  K.band(400,96,140,26,"dst MAC: FILESRV")+K.band(542,96,130,26,"src MAC: R1 G0/1")+K.band(674,96,60,26,"0x0800")+
  K.band(400,126,334,26,"IP 192.168.10.11 → 192.168.20.50")+
  K.txt(200,112,"PC1 ARPed for the GATEWAY",{mid:true,c:"accent"})+K.txt(560,74,"R1 ARPed for the server",{mid:true,c:"accent"}),
  "Two separate ARP exchanges on two separate networks. The IPs stay the same end to end; the MACs are rewritten at the router.")}
<p>So PC1 caches the router's MAC, never the server's. You'll prove it in the bench.</p>
${K.mistake(`Expecting <code>arp -a</code> on a PC to list the internet servers it talked to. It lists only devices on its own subnet — a few local machines and, above all, the gateway. An entry for an address on another subnet means a wrong mask (or a router answering with proxy ARP).`)}

<h2>The ARP cache on Windows and on Cisco</h2>
<p>ARPing before every frame would be slow and noisy, so every device caches what it learns — and reading that cache is a core troubleshooting skill.</p>
<h3>Windows: arp -a</h3>
${K.out(`C:\\Users\\Ada> arp -a

Interface: 192.168.10.11 --- 0x4
  Internet Address      Physical Address      Type
  192.168.10.1          00-50-0c-53-00-01     dynamic
  192.168.10.12         00-50-9b-50-56-62     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  224.0.0.251           01-00-5e-00-00-fb     static
  239.255.255.250       01-00-5e-7f-ff-fa     static
  255.255.255.255       ff-ff-ff-ff-ff-ff     static`, "arp -a on a real Windows 10/11 PC. The lab bench shows a shortened version with just the first broadcast and multicast rows.")}
<ul>
<li><b>Interface: 192.168.10.11 --- 0x4</b> — the table for this adapter (<code>0x4</code> is Windows' index for it).</li>
<li><b>192.168.10.1 dynamic</b> — the gateway, learned by ARP; almost always there.</li>
<li><b>192.168.10.12 dynamic</b> — a local host talked to recently. ${K.g("Dynamic","Learned by ARP request and reply; ages out and is re-learned automatically.")} entries age out.</li>
<li><b>192.168.10.255 … static</b> — the subnet broadcast. Any IP broadcast always goes to <code>ff-ff-ff-ff-ff-ff</code>, so no ARP is needed. "Static" here means calculated, not learned.</li>
<li><b>224.x and 239.x → 01-00-5e-…</b> — ${K.g("multicast","Traffic to a group of interested receivers. IPv4 multicast MACs start 01-00-5e.")} groups the PC has joined. Their MACs are calculated from the IP (<code>01-00-5e</code> + the low 23 bits), so no ARP either.</li>
</ul>
<p>Windows writes MACs with hyphens, Cisco with dots (<code>0050.0c53.0001</code>) — compare the twelve hex digits (lesson 1). To <b>clear</b> the cache, run <code>arp -d *</code> from an administrator prompt (or <code>arp -d 192.168.10.12</code> for one entry). It's safe — entries come back when needed — and it's the standard step after fixing a duplicate IP or replacing a device. Linux uses <code>ip neigh</code>.</p>
<h3>Aging</h3>
<p>Devices get replaced and IPs reassigned, so entries must expire. Windows and Linux drop unused entries within seconds to minutes. Cisco routers are patient: the default ${K.g("ARP timeout","How long a Cisco router keeps a dynamic ARP entry: 4 hours by default.")} is <b>4 hours</b>, shown in <code>show interfaces</code> as <code>ARP Timeout 04:00:00</code>.</p>
${K.dyk(`A Catalyst switch forgets an idle MAC after 300 seconds (lesson 2), but the router beside it keeps the ARP entry for 4 hours. So the router can keep sending to a MAC the switch has forgotten, and the switch floods that "unknown unicast" out every port — a classic cause of mysterious floods. Remember: <b>MAC aging 300 s, ARP timeout 4 h</b>.`)}
<h3>Cisco: show ip arp</h3>
<p>On a router, <code>show ip arp</code> (or <code>show arp</code>) shows the table. Here's the bench router after a few pings:</p>
${K.out(`LAG-RTR1# show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.10.1     -          0050.0c53.0001  ARPA   GigabitEthernet0/0
Internet  192.168.20.1     -          0050.0c53.0002  ARPA   GigabitEthernet0/1
Internet  192.168.10.11    0          0050.9a50.54cf  ARPA   GigabitEthernet0/0
Internet  192.168.20.50    0          0050.c63c.cd52  ARPA   GigabitEthernet0/1
Internet  192.168.10.12    0          0050.9b50.5662  ARPA   GigabitEthernet0/0`, "show ip arp on a Cisco router: one IP-to-MAC mapping per row, with the interface it sits behind.")}
<ul>
<li><b>Age (min)</b> — minutes since the entry was learned or refreshed. <b>A dash means the router's own interface address</b>: listed, not learned, never ages. Two dash rows here confirm both interfaces have IPs and are up.</li>
<li><b>Hardware Addr</b> — the MAC. <code>Incomplete</code> means the router asked and nobody answered: the device is off, unplugged, in the wrong VLAN, or doesn't exist.</li>
<li><b>Type ARPA</b> — ordinary Ethernet II ARP (a name from ARPANET days).</li>
<li><b>Interface</b> — which side of the router the host is on.</li>
</ul>
${K.when([
  ["<code>arp -a</code> on a PC", "A PC can't reach its gateway or a local device, or you suspect a duplicate IP", "Shows the MAC <i>this PC</i> actually sends to", "The problem is beyond the first router"],
  ["<code>show ip arp</code> on the router", "You need the whole subnet's IP-to-MAC view, or who is using an IP", "Every host the gateway talked to, with its interface", "You need the switch port — the router doesn't know it"],
  ["<code>show mac address-table</code> on the switch", "You have a MAC and need the port it's plugged into", "Port, VLAN and MAC — the last step to the desk", "You only have an IP — get the MAC first"],
], "Which ARP-related tool to reach for")}
${K.tip(`IP → MAC → port is the classic hunt for "where is this device plugged in?": <code>show ip arp</code> on the gateway turns the IP into a MAC, then <code>show mac address-table address &lt;mac&gt;</code> on the switch turns the MAC into a port. You'll use it in the job below and again in lesson 7.`)}
${K.q({type:"match", q:"Match each row or column of ARP output with what it tells you.", pairs:[["Windows row 192.168.10.1 ... dynamic","The gateway's MAC, learned by ARP"],["Windows row 192.168.10.255 ff-ff-ff-ff-ff-ff static","The subnet broadcast, mapped without ARP"],["Cisco Age (min) shown as -","The router's own interface address"],["Cisco Type ARPA","Standard Ethernet II ARP framing"],["Cisco Hardware Addr shown as Incomplete","An ARP request was sent but nobody replied"]], why:"Dynamic rows are learned; static broadcast and multicast rows are calculated. On a router a dash in the Age column marks its own interface addresses; ARPA is ordinary Ethernet ARP; Incomplete means it asked and nobody answered."})}

<h3>Try it yourself: a router's own ARP table</h3>
<p>This router's two LAN interfaces are already up. Read its ARP table, add a third subnet for printers, and watch its new address appear with a dash. Then find the interface MAC and ARP timeout.</p>
${K.hint("<code>enable</code>, then <code>configure terminal</code> → <code>interface g0/2</code> → <code>ip address 192.168.30.1 255.255.255.0</code> → <code>no shutdown</code> → <code>end</code>. Router interfaces start shut down.")}
${K.term({env:"ios2", title:"read a router's ARP table", opts:{kind:"router", host:"LAG-RTR1"},
  setup:env=>{ const a=env.intfs["GigabitEthernet0/0"], b=env.intfs["GigabitEthernet0/1"]; a.ip="192.168.10.1"; a.mask="255.255.255.0"; a.shut=false; a.desc="LAN - staff"; b.ip="192.168.20.1"; b.mask="255.255.255.0"; b.shut=false; b.desc="LAN - servers"; },
  intro:"LAG-RTR1 is the gateway for the staff and server subnets. Nothing has talked to it in this terminal yet, so you'll see only its own addresses.",
  tasks:[
    {text:"Move to privileged EXEC with <code>enable</code>", done:e=>e.history.some(h=>/^\s*en(a|ab|abl|able)?\s*$/i.test(h))},
    {text:"Run <code>show ip arp</code> — two rows, both with <code>-</code> in the Age column", done:e=>e.history.some(h=>/^\s*(do\s+)?sh(o|ow)?\s+(ip\s+)?arp\s*$/i.test(h))},
    {text:"Give <code>GigabitEthernet0/2</code> the address <code>192.168.30.1 255.255.255.0</code> and bring it up", done:e=>{ const i=e.intfs["GigabitEthernet0/2"]; return i.ip==="192.168.30.1" && i.mask==="255.255.255.0" && !i.shut; }},
    {text:"Run <code>show ip arp</code> again (with <code>do</code> if still in config mode) — a third <code>-</code> row appears", done:e=>{ const h=e.history; let c=-1, s=-1; h.forEach((x,i)=>{ if(/^\s*no\s+sh/i.test(x)) c=i; if(/^\s*(do\s+)?sh(o|ow)?\s+(ip\s+)?arp\s*$/i.test(x)) s=i; }); const g=e.intfs["GigabitEthernet0/2"]; return c>-1 && s>c && g.ip==="192.168.30.1" && !g.shut; }},
    {text:"Run <code>show interfaces g0/0</code> and find the MAC (<i>address is …</i>) and the <i>ARP Timeout</i> line", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/0\s*$/i.test(h))},
  ],
  win:"You read the router's ARP table, saw its own addresses with a dash, and found the 4-hour timeout. On a live network, dynamic rows fill in below as hosts talk to their gateway.",
  solve:["enable","show ip arp","configure terminal","interface g0/2","ip address 192.168.30.1 255.255.255.0","no shutdown","end","show ip arp","show interfaces g0/0"]})}
${K.check({q:"In <code>show ip arp</code>, the row for 192.168.10.1 has <code>-</code> in the Age column. What does that mean?", o:["The entry is incomplete — nobody answered","192.168.10.1 is one of the router's own interface addresses","The entry is about to expire","It's a static entry typed by an administrator"], a:1, why:"A dash marks the router's own interface addresses, which aren't learned and never age. An unanswered ARP shows <code>Incomplete</code> in the Hardware Addr column instead."})}

<h2>Hands-on: watch ARP happen</h2>
<p>Two PCs on a switch, a router as their gateway, and a file server on the router's second subnet. The router is already routing and your laptop is on its console port. The frame log is open: after each ping, read every ARP request, reply and frame. Amber dots are broadcasts, teal unicasts.</p>
${K.bench({id:"m2-arp-gateway", points:80, from:"CCNA · Module 2 · lesson 4", title:"watch ARP: same subnet vs the gateway", viewBox:"0 0 760 400", openLog:true,
  intro:"Open <b>Command Prompt</b> under PC1. For the router, open <b>Terminal app (PuTTY)</b> under your laptop — the console cable is plugged in; use 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control.",
  devices:[
    {id:"sw1", kind:"switch", label:"LAN-SW1", model:"Catalyst 9200 · office floor", x:40, y:150},
    {id:"r1", kind:"router", label:"LAG-RTR1", model:"ISR 1100 · default gateway", x:500, y:20,
      config:env=>{ ["enable","configure terminal","interface g0/0","description LAN - staff 192.168.10.0/24","ip address 192.168.10.1 255.255.255.0","no shutdown","interface g0/1","description LAN - servers 192.168.20.0/24","ip address 192.168.20.1 255.255.255.0","no shutdown","end"].forEach(c=>env.exec(c)); }},
    {id:"pc1", kind:"pc", label:"PC1", x:40, y:290, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"pc2", kind:"pc", label:"PC2", x:190, y:290, ip:"192.168.10.12", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:370, y:290},
    {id:"srv", kind:"server", label:"FILESRV", x:610, y:290, ip:"192.168.20.50", mask:"255.255.255.0", gw:"192.168.20.1"},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"r1:g0", b:"sw1:g8"}, {type:"cat6", a:"r1:g1", b:"srv:eth"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On PC1, run <code>arp -a</code> <b>before</b> pinging anything — only static broadcast and multicast rows, no dynamic ones", done:B=>{ let dirty=false; for (const e of B.events){ const op=e.a[0], c=String(op==="pc"?e.a[2]:e.a[1]||"").trim().toLowerCase().replace(/\s+/g," "); if ((op==="pc"||op==="term") && /^ping /.test(c)) dirty=true; if (op==="ip" && e.a[1]==="pc1") dirty=false; if (op==="pc" && e.a[1]==="pc1" && /^arp -d/.test(c)) dirty=false; if (op==="pc" && e.a[1]==="pc1" && c==="arp -a" && !dirty) return true; } return false; }},
    {text:"From PC1, <code>ping 192.168.10.12</code> (PC2, same subnet). In the log, PC1's ARP request asks for <b>PC2's</b> IP", done:B=>Bench.pinged(B,"pc1","192.168.10.12")},
    {text:"Run <code>arp -a</code> on PC1 again — PC2's IP now has a <b>dynamic</b> row", done:B=>{ const E=B.events.filter(e=>e.a[0]==="pc"&&e.a[1]==="pc1").map(e=>String(e.a[2]).trim().toLowerCase().replace(/\s+/g," ")); const i=E.lastIndexOf("ping 192.168.10.12"); return Bench.arpHas(B,"pc1","192.168.10.12") && i>-1 && E.slice(i+1).includes("arp -a"); }},
    {text:"From PC1, <code>ping 192.168.20.50</code> (FILESRV, another subnet). In the log: who did PC1 ARP for? Who did the router ARP for?", done:B=>Bench.pinged(B,"pc1","192.168.20.50")},
    {text:"Run <code>arp -a</code> on PC1 — the <b>gateway</b> (192.168.10.1) is there, the server (192.168.20.50) is not", done:B=>{ const E=B.events.filter(e=>e.a[0]==="pc"&&e.a[1]==="pc1").map(e=>String(e.a[2]).trim().toLowerCase().replace(/\s+/g," ")); const i=E.lastIndexOf("ping 192.168.20.50"); return Bench.arpHas(B,"pc1","192.168.10.1") && !Bench.arpHas(B,"pc1","192.168.20.50") && i>-1 && E.slice(i+1).includes("arp -a"); }},
    {text:"On the router console: <code>enable</code>, then <code>show ip arp</code> — PC1 and FILESRV on different interfaces, the router's own addresses with <code>-</code>", done:B=>B.devs.r1.env.history.some(h=>/^\s*(do\s+)?sh(o|ow)?\s+(ip\s+)?arp\s*$/i.test(h))},
    {text:"From the router, <code>ping 192.168.10.12</code> twice: first <code>.!!!!</code>, then <code>!!!!!</code> — the router had to ARP for PC2 first", done:B=>Bench.arpHas(B,"r1","192.168.10.12") && B.devs.r1.env.history.filter(h=>/^\s*ping\s+192\.168\.10\.12\s*$/i.test(h)).length>=2},
  ],
  win:"You watched ARP from both sides: PC1 ARPed for PC2 when it was local, but only for the gateway when the server was remote — and the router ran its own ARP on the far subnet. The router's first-ping dot was ARP doing its job.",
  solve:[["pc","pc1","arp -a"],["pc","pc1","ping 192.168.10.12"],["pc","pc1","arp -a"],["pc","pc1","ping 192.168.20.50"],["pc","pc1","arp -a"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip arp"],["term","ping 192.168.10.12"],["term","ping 192.168.10.12"]]})}
${K.hint("Task won't tick? Order matters: the first <code>arp -a</code> must come before any ping (or run <code>arp -d *</code> to empty the cache and try again), and each later <code>arp -a</code> must follow the ping it checks. <b>Reset bench</b> starts fresh.")}
<p>For the server ping, the log shows <i>"Who has 192.168.10.1? Tell 192.168.10.11"</i> — the gateway, not the server. Then the router routes it and a new ARP appears on the far side: <i>"Who has 192.168.20.50? Tell 192.168.20.1"</i>. The server didn't ARP on the way back: it learned the router's MAC from that request. PC1's replies show TTL 127 — one router hop.</p>
<h3>Why the router's first ping loses one packet</h3>
<p>When the router first pinged PC2, it had no ARP entry for <code>192.168.10.12</code>. IOS doesn't hold that first echo while it waits — it sends the ARP request and <b>drops the packet that triggered it</b>. The 2-second timer expires and IOS prints a <code>.</code>; by the next echo the entry exists: <code>.!!!!</code>, 80 percent. Ping again: <code>!!!!!</code>. Any router that must ARP for its next hop can lose a first packet this way. Windows queues the packet while it ARPs, so PC1 showed four replies.</p>
${K.exam(`<code>.!!!!</code> on a router's first ping to a new neighbour is <b>normal</b>: the first packet was dropped while ARP resolved the next hop. If an exhibit shows <code>.!!!!</code> then <code>!!!!!</code>, the answer is ARP — not congestion, a loop or duplex. <code>.....</code> is a real failure.`)}
${K.check({q:"After PC1 successfully pings 192.168.20.50 (another subnet), what do you expect <code>arp -a</code> on PC1 to show?", o:["A dynamic entry for 192.168.20.50 with the server's MAC","A dynamic entry for 192.168.20.50 with the router's MAC","A dynamic entry for 192.168.10.1 (the gateway) and nothing for 192.168.20.50","No new entries — remote pings don't use ARP"], a:2, why:"The server is remote, so PC1 ARPed for its gateway and framed everything to the router's MAC. PC1 never learns anything about 192.168.20.50 at Layer 2."})}

<h3>Bench 2: a wrong mask that "works"</h3>
<p>At an Abuja branch, someone typed the ACCOUNTS PC's mask by hand as <code>255.255.255.128</code> instead of <code>255.255.255.0</code>. The printer at <code>10.20.0.200</code> is on the same switch and the same <code>/24</code> — but ACCOUNTS now believes it's in the other half. Watch what it does.</p>
${K.bench({id:"m2-arp-mask", points:50, from:"CCNA · Module 2 · lesson 4", title:"the mask decides who you ARP for", viewBox:"0 0 760 400", openLog:true,
  intro:"Use <b>Command Prompt</b> and <b>IP settings</b> under ACCOUNTS. After each ping, the ARP request line in the log shows who ACCOUNTS thought it should talk to.",
  devices:[
    {id:"sw1", kind:"switch", label:"ABJ-SW1", model:"Catalyst 9200 · branch", x:40, y:150},
    {id:"r1", kind:"router", label:"ABJ-RTR1", model:"ISR 1100 · default gateway", x:500, y:20,
      config:env=>{ ["enable","configure terminal","interface g0/0","description LAN 10.20.0.0/24","ip address 10.20.0.1 255.255.255.0","no shutdown","end"].forEach(c=>env.exec(c)); }},
    {id:"acc", kind:"pc", label:"ACCOUNTS", x:60, y:290, ip:"10.20.0.13", mask:"255.255.255.128", gw:"10.20.0.1"},
    {id:"prn", kind:"server", label:"PRINTER", x:400, y:290, ip:"10.20.0.200", mask:"255.255.255.0", gw:"10.20.0.1"},
  ],
  cables:[ {type:"cat6", a:"acc:eth", b:"sw1:g1"}, {type:"cat6", a:"prn:eth", b:"sw1:g2"}, {type:"cat6", a:"r1:g0", b:"sw1:g8"} ],
  tray:["cat6"],
  tasks:[
    {text:"On ACCOUNTS, run <code>ipconfig</code> and spot the odd subnet mask", done:B=>B.events.some(e=>e.a[0]==="pc"&&e.a[1]==="acc"&&/^ipconfig/i.test(String(e.a[2]).trim()))},
    {text:"With the wrong mask still set, <code>ping 10.20.0.200</code> — it works! In the log, ACCOUNTS ARPs for the <b>gateway</b>, and the router sends it back out the same interface", done:B=>{ let m="255.255.255.128"; for (const e of B.events){ if (e.a[0]==="ip" && e.a[1]==="acc") m=e.a[3]; if (e.a[0]==="pc" && e.a[1]==="acc" && /^ping\s+10\.20\.0\.200$/i.test(String(e.a[2]).trim()) && m==="255.255.255.128") return true; } return false; }},
    {text:"Fix it: in <b>IP settings</b> set the mask to <code>255.255.255.0</code> (keep IP 10.20.0.13 and gateway 10.20.0.1)", done:B=>{ const d=B.devs.acc; return d.mask==="255.255.255.0" && d.ip==="10.20.0.13" && d.gw==="10.20.0.1"; }},
    {text:"Ping the printer again, then <code>arp -a</code>: the <b>printer's</b> MAC is cached and the gateway isn't — the frames went direct", done:B=>{ const d=B.devs.acc; const E=B.events.filter(e=>e.a[0]==="pc"&&e.a[1]==="acc").map(e=>String(e.a[2]).trim().toLowerCase().replace(/\s+/g," ")); const i=E.lastIndexOf("ping 10.20.0.200"); return d.mask==="255.255.255.0" && Bench.arpHas(B,"acc","10.20.0.200") && !Bench.arpHas(B,"acc","10.20.0.1") && i>-1 && E.slice(i+1).includes("arp -a"); }},
  ],
  win:"You proved the mask decides the ARP target: with the wrong mask every print job hairpinned through the router; with the right one, ACCOUNTS ARPed for the printer and went direct.",
  solve:[["pc","acc","ipconfig"],["pc","acc","ping 10.20.0.200"],["ip","acc","10.20.0.13","255.255.255.0","10.20.0.1"],["pc","acc","ping 10.20.0.200"],["pc","acc","arp -a"]]})}
<p>Two clues. With the wrong mask, <code>arp -a</code> showed the broadcast row as <code>10.20.0.127</code>, not <code>.255</code> — Windows calculates it from the mask, so an odd broadcast row is a quick tell. And the printer's reply came straight back without the router, because the <i>printer's</i> mask was right. (A real Cisco router would also send the PC an ICMP redirect.) It all "works" — until the router reboots in a power cut and LAN printing stops too.</p>

<h2>Gratuitous ARP, duplicates, proxy ARP and spoofing</h2>
<h3>Gratuitous ARP: announcing yourself</h3>
<p>A ${K.g("gratuitous ARP","An unsolicited ARP about the sender's own address: sender IP = target IP, broadcast.")} is an ARP nobody asked for: a device broadcasts one about <i>its own</i> address, with <b>sender IP and target IP the same</b>. Two main uses:</p>
<ul>
<li><b>Duplicate address detection.</b> When a PC brings up an address (boot, DHCP, typed in), it ARPs for its own IP first. (Strictly, modern Windows sends that first check as an <i>ARP probe</i> with sender IP 0.0.0.0, RFC 5227, then announces itself with a true gratuitous ARP.) Any reply means someone already has it, and Windows shows <i>"Windows has detected an IP address conflict"</i>. A Cisco router that hears another device claim one of its own addresses logs <code>%IP-4-DUPADDR: Duplicate address 192.168.10.1 on GigabitEthernet0/0, sourced by 3c52.821a.7f09</code> — and hands you the culprit's MAC.</li>
<li><b>Updating caches after a change.</b> When a backup router takes over a gateway address (as ${K.g("HSRP","Hot Standby Router Protocol: two Cisco routers share one virtual gateway IP. Later module.")} does), it sends gratuitous ARPs so hosts and switches stop sending to the dead MAC at once. Moved VMs and failed-over NIC teams do the same.</li>
</ul>
<h3>Duplicate IP addresses: the MAC flip</h3>
<p>When two devices share an IP, both answer ARP for it. Everyone else's entry flips between two MACs depending on who spoke last, so <b>both</b> devices drop in and out. The fingerprint: <code>arp -a</code> or <code>show ip arp</code> for that IP, twice, shows two different MACs.</p>
<h3>Proxy ARP: the router answers for someone else</h3>
<p>With ${K.g("proxy ARP","A router answering an ARP for a remote IP with its own MAC. On by default in Cisco IOS.")}, a router that hears an ARP for an IP on <i>another</i> network — one it can route to out of a <i>different</i> interface — answers with <b>its own MAC</b>. The host frames the packet to the router, which routes it. That rescues hosts with a too-wide mask, like host D, and even hosts with no gateway at all. IOS enables it by default on every interface (<code>ip proxy-arp</code>). Many security baselines, such as the ${K.g("CIS benchmarks","Free, consensus security configuration guides from the Center for Internet Security, including ones for Cisco IOS.")}, disable it (<code>no ip proxy-arp</code>) because it hides misconfigured hosts until the router changes. Tell-tale sign: remote IPs in <code>arp -a</code> carrying the router's MAC. The bench routers behave like real IOS: proxy ARP is on unless a lab says the router is hardened.</p>
<p>At an HR office in Ikeja, a contractor set up HR-PC by hand: <code>192.168.10.40</code>, mask <code>255.255.0.0</code>, <b>no gateway</b>. It still opens the HR server at <code>192.168.30.5</code>, behind the router. Find out why, harden the router, then fix the PC properly.</p>
${K.bench({id:"m2-proxy-arp", points:40, from:"CCNA · Module 2 · lesson 4", title:"proxy ARP: the router covering for a broken PC", viewBox:"0 0 760 400", openLog:true,
  intro:"Use <b>Command Prompt</b> and <b>IP settings</b> under HR-PC. IKJ-RTR2 has proxy ARP at the IOS default (on) and no enable secret; your laptop is on its console (9600 8N1, no flow control).",
  devices:[
    {id:"sw1", kind:"switch", label:"IKJ-SW2", model:"Catalyst 9200 · HR floor", x:40, y:150},
    {id:"r1", kind:"router", label:"IKJ-RTR2", model:"ISR 1100 · HR router", x:500, y:20,
      config:env=>{ ["enable","configure terminal","interface g0/0","description LAN - HR 192.168.10.0/24","ip address 192.168.10.1 255.255.255.0","no shutdown","interface g0/1","description LAN - servers 192.168.30.0/24","ip address 192.168.30.1 255.255.255.0","no shutdown","end"].forEach(c=>env.exec(c)); }},
    {id:"pc", kind:"pc", label:"HR-PC", x:60, y:290, ip:"192.168.10.40", mask:"255.255.0.0"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:330, y:290},
    {id:"srv", kind:"server", label:"HRSRV", x:610, y:290, ip:"192.168.30.5", mask:"255.255.255.0", gw:"192.168.30.1"},
  ],
  cables:[ {type:"cat6", a:"pc:eth", b:"sw1:g1"}, {type:"cat6", a:"r1:g0", b:"sw1:g8"}, {type:"cat6", a:"r1:g1", b:"srv:eth"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On HR-PC, run <code>ipconfig</code> (mask 255.255.0.0, gateway blank), then <code>ping 192.168.30.5</code>. It works! In the log, HR-PC ARPs for the <b>server's</b> IP and the router sends a <b>Proxy ARP reply</b>", done:B=>Bench.proxied(B) && Bench.tried(B,"pc",/^\s*ipconfig/i)},
    {text:"Run <code>arp -a</code> on HR-PC: 192.168.30.5 is listed with the MAC from the proxy reply — the <b>router's</b> G0/0 MAC (<code>show interfaces g0/0</code> on the console confirms it), not the server's. The odd broadcast row, 192.168.255.255, gives away the /16 mask", done:B=>Bench.proxied(B) && Bench.tried(B,"pc",/^\s*arp\s+-a\s*$/i)},
    {text:"Harden the router: on the console, <code>enable</code>, <code>configure terminal</code>, <code>interface g0/0</code>, <code>no ip proxy-arp</code>. On HR-PC, <code>arp -d *</code> and ping again: <code>Destination host unreachable</code> — nobody answers the ARP now", done:B=>B.devs.r1.env.intfs["GigabitEthernet0/0"].proxyArp===false && Bench.tried(B,"pc",/^\s*arp\s+-d/i)},
    {text:"Fix HR-PC properly in <b>IP settings</b>: mask <code>255.255.255.0</code>, gateway <code>192.168.10.1</code>. Ping 192.168.30.5 again — it works through the gateway, with proxy ARP still off", done:B=>{ const d=B.devs.pc; return d.mask==="255.255.255.0" && d.gw==="192.168.10.1" && B.devs.r1.env.intfs["GigabitEthernet0/0"].proxyArp===false && Bench.pinged(B,"pc","192.168.30.5"); }},
  ],
  win:"You watched proxy ARP cover for a PC with a wrong mask and no gateway — the router answered for the server with its own MAC. Hardening the router exposed the hidden fault, and fixing the PC made it work the right way. That's why baselines switch proxy ARP off.",
  solve:[["pc","pc","ipconfig"],["pc","pc","ping 192.168.30.5"],["pc","pc","arp -a"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/0"],["term","no ip proxy-arp"],["term","end"],["pc","pc","arp -d *"],["pc","pc","ping 192.168.30.5"],["ip","pc","192.168.10.40","255.255.255.0","192.168.10.1"],["pc","pc","ping 192.168.30.5"]]})}
<p>Nothing on HR-PC changed when you hardened the router, yet it "broke". Until you ran <code>arp -d *</code> it kept working on the cached proxy entry — on a real network that lasts until the cache ages out or the router reboots. That's how such faults surface months later, after a router swap or an audit. Fix the host, don't lean on the router.</p>
<h3>ARP spoofing: a security weak spot</h3>
<p>ARP has no authentication: any device can send a reply or gratuitous ARP claiming any IP, and most hosts believe it. In ${K.g("ARP spoofing","Also called ARP poisoning: forged ARP messages claim another device's IP (usually the gateway) so victims send traffic to the attacker.")} an attacker keeps telling victims <i>"192.168.10.1 is at</i> <b>my</b> <i>MAC"</i>. Their caches are poisoned: gateway-bound frames go to the attacker, who can read or alter them and pass them on to the real router. That's a ${K.g("man-in-the-middle (MITM)","An attacker secretly relaying — and able to read or change — traffic between two parties.")} attack, and free tools make it trivial on an unprotected LAN.</p>
${K.svg("0 0 720 250",
  K.dev("pc",90,170,"Victim PC","192.168.10.11")+K.dev("switch",360,170,"Switch","")+K.dev("router",630,170,"Gateway","192.168.10.1 · MAC R")+K.dev("laptop",360,60,"Attacker","MAC X")+
  K.link(115,170,334,170)+K.link(386,170,606,170)+K.link(360,80,360,159)+
  K.arrow(330,52,130,130,"\"192.168.10.1 is at X\"",true)+
  K.txt(118,230,"cache: 192.168.10.1 → X (poisoned)",{mid:true,c:"bad"})+
  `<path d="M115,190 C200,240 300,120 345,80" stroke="var(--bad)" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#karr)"/>`+
  `<path d="M385,70 C480,60 560,120 610,155" stroke="var(--bad)" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#karr)"/>`+
  K.txt(560,90,"relayed to the real router",{mid:true,c:"bad",s:10}),
  "ARP spoofing: forged replies make the victim send gateway-bound frames to the attacker, who relays them on — a man-in-the-middle.")}
<p>The defence is ${K.g("Dynamic ARP Inspection (DAI)","A Catalyst feature that drops ARP messages that don't match known IP-to-MAC bindings from DHCP snooping.")}: the switch checks ARP on user ports against DHCP snooping's record of which MAC owns which IP, and drops the lies. You'll configure both in the security module. For now, know the symptom: a gateway entry in <code>arp -a</code> whose MAC isn't the router's — often matching another PC.</p>
${K.myth([
  ["A PC ARPs for every server it talks to, wherever it is.", "Only for addresses on its own subnet. For anything remote it ARPs once for the gateway and reuses that MAC."],
  ["The ARP reply is broadcast so everyone can learn it.", "A normal reply is unicast to the requester. Only gratuitous ARPs go to everyone on purpose."],
  ["A lost first ping (.!!!!) means the link is unreliable.", "It's normal when a router had no ARP entry for the next hop. Ping again."],
  ["Clearing the ARP cache fixes duplicate IP problems.", "It hides them for seconds. Fix the address first, then clear the caches."],
])}
${K.mistake(`Treating "works after a reboot, drops again a few minutes later" on two devices in turn as a hardware fault and swapping PCs or cables. That pattern is the classic duplicate IP. Check ARP for a MAC flip before touching hardware.`)}
${K.check({q:"A switch receives an ARP whose sender IP and target IP are both 192.168.10.1, sent to ffff.ffff.ffff. What is it most likely to be?", o:["A normal ARP request for the gateway","A proxy ARP reply","A gratuitous ARP — a device announcing or checking its own address","A corrupted frame"], a:2, why:"Sender IP equal to target IP, broadcast, is a gratuitous ARP: a device announcing it owns 192.168.10.1 (for example after a failover) or checking nobody else uses it."})}

${K.job("“Two PCs keep dropping off the network every few minutes”",`
<p><b>The ticket.</b> An accounting client in Ikeja: <i>"Ngozi's and Bayo's PCs keep losing the network. When one comes back the other goes. Rebooting helps for a few minutes. Started Monday."</i></p>
<p><b>Your questions.</b> "Anyone else affected?" — <i>"No."</i> "Anything change on Monday?" — <i>"Bayo's PC was rebuilt over the weekend."</i> Two devices taking turns after a rebuild: you suspect a duplicate IP. Now prove it.</p>
<p><b>Check 1 — the PCs.</b> Over remote support, <code>ipconfig /all</code> on Ngozi's PC: <i>IPv4 192.168.10.45, DHCP Enabled: Yes</i>. On Bayo's: <i>IPv4 192.168.10.45, DHCP Enabled: No</i>. The technician typed a static address that DHCP had already leased to Ngozi.</p>
<p><b>Check 2 — the MAC flip.</b> Proof that the network sees two owners — on the router, a minute apart:</p>
${K.out(`IKJ-RTR1# show ip arp 192.168.10.45
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.10.45           0   3c52.821a.7f09  ARPA   GigabitEthernet0/0

IKJ-RTR1# show ip arp 192.168.10.45
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.10.45           0   b8ae.ed4c.21d0  ARPA   GigabitEthernet0/0`, "Same IP, two MACs, a minute apart: whichever PC spoke last 'owns' the address.")}
<p><b>Check 3 — where are they?</b> On the floor switch, <code>show mac address-table address 3c52.821a.7f09</code> gives <code>Gi1/0/14</code> (Ngozi's desk); <code>b8ae.ed4c.21d0</code> gives <code>Gi1/0/22</code> (Bayo's).</p>
<p><b>The fix.</b> Set Bayo's adapter back to "Obtain an IP address automatically" — he gets <code>192.168.10.61</code>. Run <code>arp -d *</code> on both PCs as administrator. Ten minutes later <code>show ip arp 192.168.10.45</code> still shows only <code>3c52.821a.7f09</code>, and nobody has dropped.</p>
<p><b>What you say.</b> "Bayo's computer was given the same network address as Ngozi's when it was rebuilt, so they were taking turns. It now gets its address automatically, so both will stay connected."</p>
<p><b>Ticket note.</b> <i>"Intermittent loss on 2 PCs. Cause: duplicate IP 192.168.10.45 — static on Bayo's PC (rebuilt at weekend) clashed with Ngozi's DHCP lease. Proof: show ip arp 192.168.10.45 flipped between 3c52.821a.7f09 (Gi1/0/14) and b8ae.ed4c.21d0 (Gi1/0/22). Fix: Bayo's PC to DHCP (now .61), ARP caches cleared, stable 10 min, users confirmed. Follow-up: build checklist — no static IPs on staff PCs; fixed addresses via DHCP reservation or outside the pool."</i></p>`)}

${K.case("The firewall failover that took four hours to finish",`
<p>A fintech start-up in Lekki ran two firewalls as a high-availability pair sharing one public IP towards the ISP's router. One night the active firewall's power supply died. The standby took over the IP in under a second and sent gratuitous ARPs. Inside the office nothing changed; from outside, the staff VPN and the partners' payment API calls all timed out.</p>
<p>The ISP's router was hardened to ignore unsolicited ARP, so it kept its old entry — <i>our public IP → the dead firewall's MAC</i> — with a 4-hour timeout. The on-call engineer spent an hour checking healthy firewalls before calling the ISP, whose NOC cleared that one entry. Traffic flowed instantly.</p>
<p>The lasting fix was a shared <b>virtual MAC</b> that moves with the active firewall, so the ISP's entry stays right — the idea HSRP uses on a LAN. Lessons: failover depends on <i>other people's</i> ARP caches; know your upstream's ARP timeout; test failover with the ISP watching.</p>`)}

${K.dodont([
  "Run <code>arp -a</code> early on any \"can't reach the gateway\" or intermittent-drop ticket.",
  "Compare MACs, not just IPs: one IP with two MACs means two owners.",
  "Chase an unknown device: IP → MAC (<code>show ip arp</code>) → port (<code>show mac address-table address</code>).",
  "Give fixed-address devices a DHCP reservation or an address outside the pool.",
  "Clear ARP caches <i>after</i> fixing a duplicate or replacing a device.",
],[
  "Assume a PC ARPs for remote servers — it ARPs for its gateway.",
  "Clear the ARP cache as a \"fix\" before you know the cause.",
  "Type static IPs on staff PCs \"just for now\" — that's how duplicates are born.",
  "Panic at <code>.!!!!</code> on a router's first ping; ping again.",
  "Ignore a gateway MAC that matches another PC — possible spoofing; escalate to security.",
])}

<h2>Interview corner</h2>
${K.hint("In order: the local-or-remote test, ARP for the gateway, the frame to the gateway's MAC, the router's own ARP on the far side, and MACs rewritten while IPs stay the same.")}
${K.reveal("“What happens at Layer 2 when you ping a host on another subnet?”",`<p>"The PC compares the destination with its own IP and mask, sees it's remote, and uses its default gateway. If the gateway's MAC isn't cached, it broadcasts an ARP request; the switch floods it and the router replies unicast. The echo goes in a frame to the router's MAC, with the remote host's IP in the packet. The router routes it and, on the outgoing network, ARPs for the host or next hop if needed, then builds a new frame with its own MAC as source. IPs stay the same end to end; MACs change at every hop, and the PC never learns the remote host's MAC."</p>`)}
${K.hint("One-line definition (unsolicited, sender IP = target IP, broadcast), then two uses with an example each.")}
${K.reveal("“What is gratuitous ARP?”",`<p>"An ARP a device sends about its own address without being asked — sender and target IP the same, broadcast. Two uses: duplicate detection, where any answer means a conflict (behind Windows' IP conflict warning and Cisco's %IP-4-DUPADDR log); and cache updates when an HSRP standby becomes active, a VM moves or a NIC team fails over, so nobody keeps sending to the old MAC. Because hosts accept them unasked, attackers abuse them for ARP spoofing — Dynamic ARP Inspection is the defence."</p>`)}
${K.hint("They want a method: which commands, what pattern you look for, and how you physically find the second device.")}
${K.reveal("“How would you track down a duplicate IP address?”",`<p>"Symptoms are two devices dropping in turn, or a conflict warning. I check show ip arp for that IP on the gateway twice — if the MAC flips, there are two owners. Then show mac address-table address on the access switch turns each MAC into a port, and the port into a desk. I fix the root cause — usually a static IP inside the DHCP pool — with DHCP or a reservation, clear the caches, and confirm the entry stays stable."</p>`)}

${K.recap([
  "ARP finds the MAC for an IPv4 address on the local network; it rides in Ethernet with EtherType 0x0806 and never crosses a router.",
  "Local destination → ARP for it. Remote → ARP for the default gateway. That's why the gateway's MAC is in almost every frame.",
  "Request: opcode 1, broadcast to ffff.ffff.ffff, target MAC all zeros — \"who has X? tell Y\". Reply: opcode 2, unicast — \"X is at MAC\".",
  "arp -a shows a Windows cache (dynamic = learned; broadcast and multicast rows are calculated); arp -d * clears it.",
  "show ip arp: a dash in Age = the router's own interface; ARPA = Ethernet ARP; Incomplete = no answer; default timeout 4 hours.",
  "A router's first ping to a new neighbour often shows .!!!! — the packet that triggered ARP is dropped.",
  "Gratuitous ARP (sender IP = target IP) announces or checks an address; a duplicate IP shows as one IP flipping between two MACs.",
  "Proxy ARP lets a router answer for remote IPs (on by default in IOS); ARP spoofing poisons caches for a man-in-the-middle, and DAI is the defence.",
])}
${K.next(`<b>Lesson 5 — Setting a switch up for management.</b> Your switch has forwarded frames without an IP of its own. Next you'll give it one on an SVI, point it at a default gateway (which it ARPs for exactly like a PC), and secure it with passwords, a banner and tidy, documented ports.`)}
`,
quiz:[
  {q:"What does ARP do?", o:["Translates host names into IP addresses","Finds the MAC address that belongs to a known IPv4 address on the local network","Assigns IP addresses to hosts automatically","Finds the switch port a MAC address is connected to"], a:1, lvl:1, why:"ARP maps a known IPv4 address to a MAC address on the same local network. DNS translates names, DHCP assigns addresses, and the switch's MAC address table maps MACs to ports."},
  {q:"An ARP request is sent to which destination MAC address?", o:["0000.0000.0000","The default gateway's MAC","ffff.ffff.ffff","0100.5e00.0001"], a:2, lvl:1, why:"The request is a broadcast, so the Ethernet destination is ffff.ffff.ffff and the switch floods it to every port in the VLAN. All zeros appears in the ARP target MAC field, not in the Ethernet destination."},
  {q:"How is a normal ARP reply sent?", o:["As a broadcast so every host can update its cache","As a unicast frame to the host that sent the request","As a multicast to all routers","Inside an IP packet with TTL 1"], a:1, lvl:1, why:"The owner of the IP sends the reply unicast, straight back to the requester's MAC, which it learned from the request. ARP is never carried inside IP."},
  {q:"A PC has IP 192.168.10.11, mask 255.255.255.0 and default gateway 192.168.10.1. The user pings 8.8.8.8 and the PC's ARP cache is empty. Which IP address does the PC put in the target IP field of its ARP request?", o:["8.8.8.8","192.168.10.1","192.168.10.255","255.255.255.255"], a:1, lvl:2, why:"8.8.8.8 is not on 192.168.10.0/24, so the destination is remote and the PC must send the frame to its default gateway. It ARPs for 192.168.10.1. The ICMP packet inside the frame still carries 8.8.8.8 as its destination IP."},
  {q:"PC1 (192.168.10.11/24, gateway 192.168.10.1) has just pinged a file server at 192.168.20.50 successfully. Based on the exhibit, which statement is correct?", ex:"C:\\Users\\PC1> arp -a\n\nInterface: 192.168.10.11 --- 0x4\n  Internet Address      Physical Address      Type\n  192.168.10.1          00-50-0c-53-00-01     dynamic\n  192.168.10.255        ff-ff-ff-ff-ff-ff     static\n  224.0.0.22            01-00-5e-00-00-16     static", o:["The ARP entry for the server has already aged out","PC1 sent the frames to the router's MAC because the server is on another subnet","PC1 has a wrong subnet mask, so it could not ARP for the server","The server replied to PC1's ARP request with the router's MAC"], a:1, lvl:2, why:"The server is remote, so PC1 ARPed only for its gateway, 192.168.10.1, and sent every frame to that MAC. A host never ARPs for an address on another subnet, so there is no server entry to age out. The broadcast row of 192.168.10.255 confirms the /24 mask is correct."},
  {q:"An engineer pings a host on a directly connected LAN from a router for the first time, then repeats the ping immediately. What is the most likely explanation for the first result?", ex:"LAG-RTR1# ping 192.168.10.12\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 192.168.10.12, timeout is 2 seconds:\n.!!!!\nSuccess rate is 80 percent (4/5), round-trip min/avg/max = 1/1/3 ms\nLAG-RTR1# ping 192.168.10.12\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 192.168.10.12, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/1/3 ms", o:["The link has a duplex mismatch that loses one packet in five","The router had no ARP entry for 192.168.10.12 and dropped the first echo while ARP resolved the MAC","The host's firewall blocked the first echo request","There is a routing loop that drops packets with a low TTL"], a:1, lvl:2, why:"The router had to ARP for the host first. IOS drops the packet that triggered ARP, so the first echo times out (the dot) and the rest succeed. Once the entry is cached, the second ping is a clean !!!!!. A duplex mismatch or loop would not disappear on the second run."},
  {type:"multi", q:"Which two statements describe a gratuitous ARP? (Choose two.)", o:["The sender IP address and the target IP address are the same","It is sent unicast to the default gateway only","It lets hosts and switches update their caches after a failover, without waiting for old entries to age out","It is the reply a router sends on behalf of a remote host","It always needs a reply before the sender can use the address"], a:[0,2], lvl:2, why:"A gratuitous ARP is unsolicited and announces the sender's own mapping, so sender IP equals target IP, and it is broadcast. It's used for duplicate address detection and to refresh other devices' caches after a change such as an HSRP or firewall failover. A router answering for a remote host is proxy ARP; a reply to a gratuitous ARP means there's a conflict."},
  {type:"order", q:"PC1 has an empty ARP cache and pings PC2 on the same subnet. Put the events in order.", items:["PC1 decides PC2 is local and finds no ARP entry for it","PC1 broadcasts an ARP request: who has PC2's IP? tell PC1's IP","The switch learns PC1's MAC and floods the request out its other ports","PC2 stores PC1's mapping and unicasts an ARP reply with its own MAC","PC1 caches PC2's MAC and sends the ICMP echo request to it"], lvl:1, why:"The local-or-remote test and the cache lookup come first. A miss triggers the broadcast request, which the switch floods. PC2 learns PC1 from the request and replies unicast. Only then can PC1 fill in the destination MAC and send the ping."},
  {type:"match", q:"Match each ARP or Ethernet value with its meaning.", pairs:[["Opcode 1","ARP request"],["Opcode 2","ARP reply"],["EtherType 0x0806","The frame carries ARP"],["Ethernet destination ffff.ffff.ffff","Broadcast to every host in the VLAN"],["Target MAC 0000.0000.0000 in a request","The unknown MAC being asked for"]], lvl:1, why:"The opcode says request (1) or reply (2). EtherType 0x0806 marks ARP, as opposed to 0x0800 for IPv4. The request's Ethernet destination is the broadcast address, while the ARP target MAC field is left as all zeros because that is the answer being requested."},
  {type:"fill", q:"Which Windows command displays the PC's ARP cache, including dynamic entries and the static broadcast and multicast rows?", a:["arp -a","arp -g","arp /a"], lvl:1, why:"arp -a (or the older arp -g) lists the ARP table for each interface. Dynamic rows were learned by ARP; static rows for the broadcast and multicast addresses are calculated by Windows. arp -d * clears the cache from an administrator prompt."},
  {type:"fill", q:"On a Cisco router in privileged EXEC mode, type the command that displays the router's ARP table using the ip keyword.", fields:[{label:"Command", a:["show ip arp"], ios:true}], lvl:2, why:"show ip arp, abbreviated sh ip arp, lists every IP-to-MAC mapping with its age in minutes, type (ARPA) and interface. show arp gives the same table. The router's own interface addresses appear with a dash in the Age column."},
  {q:"In show ip arp on a router, several rows have a dash in the Age (min) column. What are those rows?", o:["Entries that have not been refreshed in over 4 hours","The router's own interface addresses","Static entries typed in by an administrator","ARP requests that received no reply"], a:1, lvl:2, why:"A dash in the Age column marks the router's own interface IPs. They aren't learned and never age out, so listing them also confirms the interface is up with an IP. Unanswered requests show Incomplete in the hardware address column instead."},
  {q:"Two users report that their PCs lose the network for a few minutes at a time, taking turns. You run the same command twice, a minute apart, on their gateway. What is the most likely cause, and what is your next step?", ex:"IKJ-RTR1# show ip arp 192.168.10.45\nProtocol  Address          Age (min)  Hardware Addr   Type   Interface\nInternet  192.168.10.45           0   3c52.821a.7f09  ARPA   GigabitEthernet0/0\n\nIKJ-RTR1# show ip arp 192.168.10.45\nProtocol  Address          Age (min)  Hardware Addr   Type   Interface\nInternet  192.168.10.45           0   b8ae.ed4c.21d0  ARPA   GigabitEthernet0/0", o:["The router's ARP timeout is too short; increase it to 8 hours","Two devices are using 192.168.10.45; find each MAC's switch port with show mac address-table address and correct one device's address","The switch has a duplex mismatch on the uplink; set both ends to auto","ARP spoofing by the router; enable proxy ARP to stop it"], a:1, lvl:3, why:"The same IP mapping to two different MACs within a minute means two devices are claiming it — a duplicate IP. Each one updates the router's cache when it speaks, so traffic swings between them. Locate both MACs on the switch, fix the misconfigured device (usually a static IP inside the DHCP pool), then clear the ARP caches. A timer change or duplex setting would not create two MACs for one IP."},
  {q:"A user's PC was set up by hand as 192.168.10.40 with mask 255.255.0.0 (the LAN is really 192.168.10.0/24) and gateway 192.168.10.1. It reaches the internet, but not a server at 192.168.30.5 on another subnet behind the same router, where proxy ARP has been disabled. Why?", o:["The router has no route to 192.168.30.0/24","With the /16 mask the PC thinks 192.168.30.5 is local, ARPs for it directly, and nobody answers","The server's ARP cache is full","The internet works, so the mask cannot be the problem"], a:1, lvl:3, why:"With 255.255.0.0 the PC compares only 192.168, so 192.168.30.5 looks local and the PC ARPs for it instead of using the gateway. The server is on another subnet and never hears the broadcast, and with proxy ARP disabled the router won't answer for it. Internet addresses still look remote, so they go to the gateway and work — which is why a wrong mask is easy to miss."},
  {q:"Users on one VLAN complain that web logins are being stolen. On a victim PC, arp -a shows the default gateway 192.168.10.1 with MAC 00-1e-4f-aa-31-07, which matches a desktop on the same floor, not the router. What is happening, and which switch feature is designed to stop it?", o:["Proxy ARP; disable it with no ip proxy-arp on the router","A duplicate IP between two routers; configure HSRP","ARP spoofing — the desktop is poisoning caches to be a man-in-the-middle; Dynamic ARP Inspection","MAC aging on the switch is too short; increase it to 4 hours"], a:2, lvl:3, why:"A gateway IP mapped to an ordinary desktop's MAC means that desktop is sending forged ARP replies so victims send their gateway traffic through it — ARP spoofing, a man-in-the-middle. Dynamic ARP Inspection, backed by DHCP snooping, checks ARP messages on user ports and drops forged ones. Proxy ARP would show the router's own MAC, not a desktop's."},
  {type:"multi", q:"PC1 (192.168.10.11/24) pings a server at 192.168.20.50 through router R1. Which two addresses are in the frame as it leaves PC1? (Choose two.)", o:["Destination MAC: R1's G0/0 MAC","Destination MAC: the server's MAC","Destination IP: 192.168.20.50","Destination IP: 192.168.10.1","Source MAC: R1's G0/1 MAC"], a:[0,2], lvl:2, why:"The server is remote, so the frame goes to the gateway: destination MAC is R1's G0/0. The IP packet inside is still addressed to the server, 192.168.20.50. The gateway's IP is only used to find its MAC through ARP; it never appears as the packet's destination. R1's G0/1 MAC becomes the source only on the far side."},
],
cards:[
  {f:"What is ARP for?", b:"Finding the MAC address that goes with a known IPv4 address on the local network. RFC 826. IPv6 uses Neighbor Discovery instead."},
  {f:"Local or remote: who does a host ARP for?", b:"Destination on my subnet: ARP for the destination itself. Anything else: ARP for my default gateway. A host never ARPs for an address on another subnet."},
  {f:"ARP request", b:"Opcode 1. Ethernet destination ffff.ffff.ffff (broadcast), EtherType 0x0806, target MAC 0000.0000.0000. 'Who has 192.168.10.12? Tell 192.168.10.11.'"},
  {f:"ARP reply", b:"Opcode 2, sent unicast to the requester. The sender MAC field carries the answer. '192.168.10.12 is at 00:50:9b:50:56:62.' The replier also caches the requester."},
  {f:"Why is the gateway's MAC in almost every frame?", b:"All traffic to other subnets and the internet is framed to the default gateway's MAC; only the IP header carries the real destination."},
  {f:"arp -a rows on Windows", b:"Dynamic = learned by ARP, ages out. Static broadcast (x.x.x.255, 255.255.255.255 -> ff-ff-ff-ff-ff-ff) and multicast (01-00-5e-...) rows are calculated, not learned. arp -d * clears the cache (admin)."},
  {f:"show ip arp: Age shown as a dash", b:"The router's own interface address. It's listed, not learned, and never ages. Incomplete in the hardware column means an ARP got no reply."},
  {f:"Two timers to remember", b:"Catalyst MAC address aging: 300 seconds. Cisco router ARP timeout: 4 hours (ARP Timeout 04:00:00 in show interfaces)."},
  {f:"Router ping shows .!!!! the first time", b:"Normal: the router had no ARP entry for the next hop, so it dropped the packet that triggered ARP. The next ping shows !!!!!."},
  {f:"Gratuitous ARP", b:"Unsolicited ARP about your own address: sender IP = target IP, broadcast. Used for duplicate address detection and to update caches after failover (HSRP, VM moves, NIC teams)."},
  {f:"Duplicate IP fingerprint", b:"Two devices drop in turn; the same IP shows two different MACs at different moments in arp -a or show ip arp. Find both with show mac address-table address, fix one, then clear caches."},
  {f:"Proxy ARP", b:"A router answers an ARP for a remote IP with its own MAC. On by default in IOS (ip proxy-arp); often disabled with no ip proxy-arp. Hides wrong masks."},
  {f:"ARP spoofing and its defence", b:"Forged ARP replies claim the gateway's IP so victims send traffic to the attacker (man-in-the-middle). Defence: Dynamic ARP Inspection with DHCP snooping on Catalyst switches."},
],
});
// ---------- Module 2 · Lesson 5 ----------
L.push({
id:"sw-mgmt", mins:75, level:"Beginner · builds on Module 1 lesson 8 and Module 2 lessons 1–4",
t:"Setting a switch up for management: SVI, default gateway, passwords and port hygiene",
html:`
${K.goals([
  "Explain why a Layer 2 switch needs an IP, and why it lives on an SVI, not a port.",
  "Configure a management SVI and <code>ip default-gateway</code>, and prove reachability from another subnet.",
  "Apply and explain a security baseline, including why type 7 is weak.",
  "Describe every used port, shut every unused one, and use <code>show interfaces status</code> as your inventory.",
  "Read <code>show running-config</code> section by section and follow an MSP's day-one checklist.",
])}
${K.pre([
  "Module 1 lesson 8 — console, IOS modes, <code>hostname</code>, <code>enable secret</code>, line passwords, saving.",
  "Module 2 lesson 2 (switches forward by MAC) and lesson 4 (ARP, including ARP for the default gateway).",
  "From Module 1: hosts on the same subnet talk directly; anything else goes through a router.",
])}

<h2>Why this matters at work</h2>
<p>Tuesday morning, a law firm in Maitama, Abuja. Your MSP has sold them a new access switch. You rack it, patch in the server, printer and router uplink, and every PC works at once. The office manager is happy. You are not finished.</p>
<p>Out of the box, only someone at it with a console cable can log in. Your NOC in Lagos can't monitor or fix it at 2 a.m.; anyone in the comms room can take it over; the empty port behind reception is live. This lesson makes it a <b>managed</b> switch — reachable, locked, labelled, documented — work you'll do on every switch you install.</p>

<h2>A switch that never routes still needs an address</h2>
<p>In lesson 2 a switch forwarded frames by looking up the destination <b>MAC</b> in its MAC table. It never needed an IP address.</p>
${K.dyk(`Cheap unmanaged switches — the eight-port boxes sold in Computer Village — never have an IP address. They forward traffic perfectly. You can't log in, see their MAC table, shut a port or find out why something is slow.`)}
<p>So why give a managed switch an IP? Because <b>you</b> want to talk to <b>it</b>: logging in with SSH (lesson 6), monitoring with ping and ${K.g("SNMP","Simple Network Management Protocol: lets monitoring tools read device counters and status.")}, sending logs to a ${K.g("syslog","A standard for sending device log messages to a central log server.")} server, getting the time from ${K.g("NTP","Network Time Protocol: keeps device clocks accurate, so log timestamps can be trusted.")}, and copying backups and software on and off the box.</p>
<p>Engineers split a device's work in two. The ${K.g("data plane","The part of a device that forwards users' traffic.")} forwards users' traffic and needs no IP on a Layer 2 switch. The ${K.g("management plane","How you configure, monitor and maintain the device itself.")} is how you manage the device itself — that is what needs the address. "The switch's IP" always means its <b>management</b> IP.</p>
${K.analogy(`<p>In a block of flats, the corridors carry residents to their doors without needing a flat number — the data plane. To write to the caretaker, though, the office needs its own address. The management IP is the caretaker's door number.</p>`)}
<h3>Why the IP can't go on a physical port</h3>
<p>On a router, every port is a separate network with its own IP address. Your first instinct on a switch is the same: give the port facing the router an address. IOS refuses. On a Layer 2-only switch such as a Catalyst 2960:</p>
${K.out(`Switch(config)#interface gigabitEthernet 0/1
Switch(config-if)#ip address 192.168.10.2 255.255.255.0
                     ^
% Invalid input detected at '^' marker.`, "A Layer 2 switch port has no ip address command at all, so IOS stops at the word it doesn't recognise.")}
<p>The caret sits under <code>address</code>: the port knows some <code>ip</code> commands, but not that one. A multilayer switch (one that can also route, such as a Catalyst 9300) says it differently: <code>% IP addresses may not be configured on L2 links.</code></p>
<p>The reason: a port in ${K.g("VLAN","Virtual LAN: a group of ports forming one broadcast domain. Every port starts in VLAN 1.")} 1 is a doorway into one shared Layer 2 segment. Tie the IP to Gi0/1, move the router to Gi0/5, and management breaks. The address must belong to the <b>whole VLAN</b>.</p>
<p>That address lives on a ${K.g("switched virtual interface (SVI)","A virtual Layer 3 interface attached to one VLAN, giving the switch's CPU an IP on it.")}: a virtual network card inside the switch, plugged into the VLAN like one more device. It's named after the VLAN — <code>interface vlan 1</code>, shown as <code>Vlan1</code> — has its own MAC, ARPs like a PC (lesson 4), and answers pings and SSH.</p>
${K.svg("0 0 740 360",
  `<rect x="140" y="14" width="440" height="196" rx="10" fill="none" stroke="var(--line)" stroke-width="1.4" stroke-dasharray="6 4"/>`+
  K.txt(152,32,"Inside the switch",{c:"fg",b:true,s:12,f:"display"})+
  K.box(250,42,220,46,"Switch CPU · management plane","SSH · ping · SNMP · syslog · NTP",true)+
  K.link(360,88,360,108)+
  K.box(272,108,176,42,"interface Vlan1 (SVI)","192.168.10.2 /24 · own MAC",true)+
  K.link(360,150,360,168)+
  K.band(158,168,404,28,"VLAN 1 · frames switched by MAC address — no IP needed")+
  [["Gi0/1",170],["Gi0/2",270],["Gi0/3",370],["Gi0/8",470]].map(([n,x])=>K.link(x+40,196,x+40,226)+K.box(x,226,80,30,n,"no IP")).join("")+
  K.link(210,256,210,282)+K.link(310,256,310,282)+K.link(410,256,410,282)+K.link(510,256,510,282)+
  K.dev("pc",210,300,"SRV-PC","192.168.10.11")+K.dev("server",310,300,"FILE-SRV","192.168.10.20")+
  K.dev("printer",410,300,"PRINTER","192.168.10.30")+K.dev("router",510,300,"R1","192.168.10.1")+
  K.txt(600,120,"The SVI is one more",{c:"accent",b:true})+K.txt(600,136,"'host' on VLAN 1,",{c:"accent"})+K.txt(600,152,"reachable through",{c:"accent"})+K.txt(600,168,"any port in VLAN 1",{c:"accent"})+
  K.txt(20,240,"Physical ports:",{c:"fg",b:true})+K.txt(20,256,"Layer 2 doorways,",{})+K.txt(20,272,"no IP address",{}),
  "The management IP lives on a virtual interface (the SVI) that sits on VLAN 1 inside the switch. Users' frames are switched by MAC and never touch it; only traffic addressed to 192.168.10.2 reaches the CPU.")}
${K.exam(`If a question asks where a Layer 2 switch's management address is configured, the answer is an SVI — <code>interface vlan 1</code> (or another VLAN). Options that put <code>ip address</code> under <code>interface GigabitEthernet0/1</code> on an access switch are traps.`)}
${K.check({q:"Why does a Layer 2 access switch need an IP address?", o:["To forward users' frames between ports","To route between VLANs","So engineers and tools can manage it remotely: SSH, monitoring, logs, backups","So PCs can use it as their default gateway"], a:2, why:"Forwarding frames uses MAC addresses only. The IP address is for the management plane — traffic to and from the switch itself."})}

<h2>Building the management SVI</h2>
<p>Three things make an SVI work: an address, an enabled interface, and a live VLAN underneath it. Here is the whole job on a fresh switch, step by step.</p>
${K.steps([
  ["Get to global configuration", `<p><code>enable</code>, then <code>configure terminal</code> — the Module 1 ladder.</p>`],
  ["Enter the SVI", `<p><code>interface vlan 1</code>. The prompt becomes <code>Switch(config-if)#</code>: to IOS an SVI is an interface like any other.</p>`],
  ["Give it an address and mask", `<p><code>ip address 192.168.10.2 255.255.255.0</code>. Use an address no PC, printer or DHCP pool uses, and record it. Many companies reserve a block for infrastructure, such as .2 to .9.</p>`],
  ["Enable it", `<p><code>no shutdown</code>. On many Catalyst models — and in this simulator — <code>Vlan1</code> starts shut down. It does no harm on an interface that's already up, so always type it.</p>`],
  ["Check it", `<p><code>do show ip interface brief</code>: <code>Vlan1</code> with your address, <b>up</b> and <b>up</b>. Then ping something on the same subnet, such as the router.</p>`],
])}
${K.out(`Switch(config)#interface vlan 1
Switch(config-if)#ip address 192.168.10.2 255.255.255.0
Switch(config-if)#no shutdown
Switch(config-if)#
%LINK-3-UPDOWN: Interface Vlan1, changed state to up
%LINEPROTO-5-UPDOWN: Line protocol on Interface Vlan1, changed state to up
Switch(config-if)#do show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.10.2    YES manual up                    up
GigabitEthernet0/1     unassigned      YES unset  up                    up
GigabitEthernet0/2     unassigned      YES unset  down                  down`, "Configuring the SVI. The two log messages are the interface (Layer 1 style) and its line protocol (Layer 2 style) coming up.")}
<ul>
<li><b>Vlan1 192.168.10.2 YES manual</b> — the address is set, and <i>manual</i> means you typed it rather than getting it from DHCP.</li>
<li><b>up / up</b> — the SVI is enabled <i>and</i> has a live VLAN under it. Only now can it send and receive.</li>
<li><b>Gi0/1 unassigned</b> — normal. Physical switch ports carry no IP. Don't "fix" it.</li>
</ul>
<h3>When the SVI says up but not up</h3>
<p>An SVI has no cable, so IOS brings its line protocol up only when its VLAN is alive — ${K.g("autostate","An SVI is up only while its VLAN has an active, forwarding port.")}. All three must be true:</p>
<ol>
<li>The VLAN exists on the switch (VLAN 1 always does).</li>
<li>At least one port in that VLAN — an access port, or a trunk carrying it (VLAN module) — is up and forwarding.</li>
<li>The SVI itself is not shut down.</li>
</ol>
${K.out(`Switch#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.10.2    YES manual up                    down
GigabitEthernet0/1     unassigned      YES unset  down                  down
GigabitEthernet0/2     unassigned      YES unset  down                  down`, "An SVI that is enabled but has no live port in its VLAN: up / down.")}
<p><b>Status up</b> means nobody typed <code>shutdown</code>; <b>Protocol down</b> means nothing is underneath it yet — here no port is connected. Plug a cable into any VLAN 1 port and the SVI comes up/up by itself. <b>Administratively down / down</b> instead means it's shut: type <code>no shutdown</code>.</p>
${K.mistake(`Typing the IP address under <code>interface vlan 1</code> and walking away without <code>no shutdown</code>. Everything looks right in <code>show running-config</code> — the address is there — but the SVI is <i>administratively down</i> and nothing can reach it. Always confirm with <code>show ip interface brief</code>.`)}
${K.remember(`<b>"Address it, wake it, give it a way out."</b> <code>ip address</code> → <code>no shutdown</code> → <code>ip default-gateway</code> (next section).`)}
${K.q({type:"fill", q:"Type the commands that give a new switch the management address 192.168.10.2/24 and let it reach other subnets through the router at 192.168.10.1.", fields:[
  {label:"1. Enter the SVI for VLAN 1 (from global config)", a:["interface vlan 1","interface vlan1"], ios:true},
  {label:"2. Set the address and mask", a:["ip address 192.168.10.2 255.255.255.0"], ios:true},
  {label:"3. Enable the SVI", a:["no shutdown"], ios:true},
  {label:"4. Global command: the router to use for other subnets", a:["ip default-gateway 192.168.10.1"], ios:true}],
  why:"The address goes on the SVI (interface vlan 1), not a physical port. no shutdown wakes it up — on many switches Vlan1 starts shut. ip default-gateway is a global command, so it doesn't belong to any interface: it tells the switch which router to send its own replies through when the other end is on a different subnet."})}
${K.check({q:"show ip interface brief shows 'Vlan1 192.168.10.2 YES manual up down'. What is the most likely reason?", o:["The SVI needs no shutdown","The IP address is wrong","No port in VLAN 1 is up — nothing is plugged in, or every VLAN 1 port is shut","The default gateway is missing"], a:2, why:"Status up means the SVI isn't shut. Protocol down on an SVI means its VLAN has no active port (autostate). A missing default gateway never changes the interface state."})}

<h2>The default gateway: being reachable from another subnet</h2>
<p>With the SVI up, the server-room PC on 192.168.10.0/24 can ping the switch. The NOC tries from 10.10.10.50 and gets <code>Request timed out.</code> Cable fine, SVI up/up, router routing. What's missing is what any PC needs to talk off its own subnet: a ${K.g("default gateway","The router a device sends traffic to when the destination is not on its own subnet.")}.</p>
<p>The surprise is <b>where</b> it fails. The request <b>arrives</b>; it's the reply that has nowhere to go:</p>
${K.steps([
  ["NOC-PC sends the request", `<p>192.168.10.2 is off-subnet, so it goes to <b>its</b> gateway, R1 (lesson 4).</p>`],
  ["R1 routes it", `<p>R1 ARPs for 192.168.10.2 on G0/0, the SVI answers, and the request is delivered.</p>`],
  ["The switch builds the reply", `<p>10.10.10.50 isn't on 192.168.10.0/24, so the reply needs a router.</p>`],
  ["No gateway: the reply dies", `<p>With no default gateway, IOS ARPs for 10.10.10.50 itself, as if it were local. Nobody on 192.168.10.0/24 owns it, nobody answers, and the switch drops the reply. NOC-PC prints <code>Request timed out.</code></p>`],
  ["With a gateway: the reply goes home", `<p>With <code>ip default-gateway 192.168.10.1</code>, the reply goes to R1's MAC and on to the NOC.</p>`],
])}
${K.svg("0 0 740 300",
  K.dev("pc",70,70,"NOC-PC","10.10.10.50")+
  K.dev("router",300,70,"R1",".1 G0/1 · G0/0 .1")+
  K.dev("switch",520,70,"NEW-SW","SVI 192.168.10.2")+
  K.dev("pc",680,70,"SRV-PC","192.168.10.11")+
  K.link(92,70,276,70,"10.10.10.0/24")+K.link(324,70,494,70,"192.168.10.0/24")+K.link(546,70,656,70)+
  K.arrow(90,140,500,140,"① echo request: NOC → R1 → switch — it arrives",true)+
  K.arrow(500,185,320,185,"")+K.txt(432,174,"② reply to 10.10.10.50 — 'not my subnet;",{mid:true,s:10})+K.txt(432,206,"which router?'",{mid:true,s:10})+
  K.txt(300,190,"✗",{c:"bad",b:true,s:22,end:true})+
  K.txt(80,190,"no ip default-gateway:",{c:"bad",b:true})+K.txt(80,205,"reply dropped in the switch",{c:"bad"})+
  K.arrow(500,245,90,245,"③ with ip default-gateway 192.168.10.1: reply → R1 → NOC",true)+
  K.arrow(560,110,640,110,"")+K.txt(600,80,"same subnet: direct",{mid:true,s:10})+
  K.txt(370,280,"A PC on the switch's own subnet never needs the gateway —",{mid:true})+K.txt(370,294,"so 'it pings from the server room' proves nothing about remote access.",{mid:true}),
  "Why the NOC's ping fails: the request reaches the switch through R1, but without a default gateway the switch cannot send the reply off its own subnet.")}
${K.out(`C:\\Users\\NOC>ping 192.168.10.2

Pinging 192.168.10.2 with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.

Ping statistics for 192.168.10.2:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),`, "From the NOC, before the switch has a default gateway. 'Request timed out' means the request left and no reply came back — it says nothing about which direction failed.")}
<p>The fix is one <b>global</b> command — the gateway belongs to the whole switch, not an interface:</p>
${K.out(`ABJ-MAI-SW01(config)#ip default-gateway 192.168.10.1
ABJ-MAI-SW01(config)#end
%SYS-5-CONFIG_I: Configured from console by console
ABJ-MAI-SW01#ping 192.168.10.1
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.10.1, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/3 ms`, "Setting the gateway, then testing it from the switch. The first dot is normal: the switch was ARPing for the router's MAC while the first echo timed out.")}
<p>As on a PC, the gateway must be on the SVI's <b>own subnet</b> — the router's address on <b>this</b> side (192.168.10.1, not 10.10.10.1). On a Layer 2 switch, <code>show ip route</code> shows no routing table, only <code>Default gateway is 192.168.10.1</code> — or <code>Default gateway is not set</code>. </p>
<h3>The trap: proxy ARP can hide a missing gateway</h3>
<p>Remember <b>proxy ARP</b> from lesson 4: a router answers an ARP for an address on <i>another</i> network it can route to, with its own MAC. It is <b>on by default</b> on every Cisco router interface. So when the gateway-less switch broadcasts <i>"Who has 10.10.10.50?"</i>, a default-config R1 replies <i>"10.10.10.50 is at my MAC"</i>, the reply goes to R1, and the NOC ping <b>works</b> — with no gateway configured. The fault hides until someone hardens or replaces the router — then management "breaks" for no visible reason.</p>
<p>That is one reason hardened baselines, such as the ${K.g("CIS benchmarks","Free, consensus security configuration guides from the Center for Internet Security, including ones for Cisco IOS.")} for Cisco IOS, tell you to disable it on router interfaces with <code>no ip proxy-arp</code>: it hides misconfigured hosts, and it makes the router answer ARP on behalf of whole networks. The bench router below is hardened this way, so a missing gateway really shows; the last task switches proxy ARP back on so you can watch it mask the fault.</p>
${K.when([
  ["<code>ip default-gateway A.B.C.D</code>","A normal Layer 2 access switch (IP routing off)","The switch acts as a host: one gateway for its off-subnet replies","<code>ip routing</code> is on — IOS then ignores it"],
  ["<code>ip route 0.0.0.0 0.0.0.0 A.B.C.D</code>","A multilayer switch with <code>ip routing</code> on","A routing device uses its routing table, so it needs a default route","A plain Layer 2 switch"],
], "Which 'default gateway' command?")}
${K.exam(`"Same-subnet PCs reach the switch, other subnets can't" → <code>ip default-gateway</code> is missing or wrong. "Which command lets a Layer 2 switch be managed from remote networks?" → <code>ip default-gateway</code>, not <code>ip route</code>.`)}
${K.mistake(`Pointing the gateway at the router's far side (10.10.10.1) or any off-subnet address. IOS accepts it without complaint, and remote management still fails.`)}
<h3>Hands-on: bring a new switch under management</h3>
<p>The Maitama job in miniature: a factory-fresh <b>NEW-SW</b>, SRV-PC on 192.168.10.0/24, R1 as the office router and WAN, and <b>NOC-PC</b> (10.10.10.50) in the NOC. After each ping, read the frame log to see where the reply dies.</p>
${K.hint(`Console settings are 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control. Then: <code>enable</code> → <code>configure terminal</code> → <code>interface g0/1</code> → try <code>ip address 192.168.10.2 255.255.255.0</code> and read the error → <code>interface vlan 1</code> → the same <code>ip address</code> → <code>no shutdown</code>.`)}
${K.bench({id:"m2-sw-mgmt", points:70, from:"CCNA · Module 2 · lesson 5", title:"make a new switch reachable from the NOC", viewBox:"0 0 820 380", openLog:true,
  intro:"Console in with the laptop, give the switch a management IP, and test from both PCs. Click a PC's <b>Command Prompt</b> to ping. Watch the log: amber dots are broadcasts (ARP), teal ones unicasts. <b>R1 is hardened:</b> proxy ARP is disabled on both interfaces (<code>no ip proxy-arp</code>), as CIS-style baselines require. R1 has no enable secret here.",
  devices:[
    {id:"sw1", kind:"switch", label:"NEW-SW", host:"Switch", model:"Catalyst switch · factory default", x:40, y:30, fresh:true},
    {id:"r1", kind:"router", label:"R1", model:"ISR · office router + WAN to NOC", x:580, y:30,
      config: env => { ["enable","configure terminal","hostname R1","interface g0/0","description LAN 192.168.10.0/24","ip address 192.168.10.1 255.255.255.0","no ip proxy-arp","no shutdown","interface g0/1","description to NOC 10.10.10.0/24","ip address 10.10.10.1 255.255.255.0","no ip proxy-arp","no shutdown","end"].forEach(c=>env.exec(c)); }},
    {id:"pc1", kind:"pc", label:"SRV-PC", x:60, y:250, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:260, y:250},
    {id:"noc", kind:"pc", label:"NOC-PC", x:640, y:250, ip:"10.10.10.50", mask:"255.255.255.0", gw:"10.10.10.1"},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"sw1:g8", b:"r1:g0"}, {type:"cat6", a:"r1:g1", b:"noc:eth"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Plug the console cable from the laptop's USB port into NEW-SW's CON port and open PuTTY at 9600 8N1, no flow control", done:B=>Bench.consoleOk(B,"sw1")},
    {text:"Prove the IP can't go on a port: <code>interface g0/1</code>, then <code>ip address 192.168.10.2 255.255.255.0</code> — read the error", done:B=>{ const h = B.devs.sw1.env.history; return h.some((x,i)=>/^\s*int\S*\s+g\S*\s*0\/1\s*$/i.test(x) && /^\s*ip\s+add/i.test(h[i+1]||"")); }},
    {text:"Give <code>interface vlan 1</code> the address 192.168.10.2 255.255.255.0", done:B=>{ const v = B.devs.sw1.env.intfs.Vlan1; return v.ip==="192.168.10.2" && v.mask==="255.255.255.0"; }},
    {text:"Bring the SVI up with <code>no shutdown</code> (it comes up/up because SRV-PC's port is live in VLAN 1)", done:B=>{ const v = B.devs.sw1.env.intfs.Vlan1; return !!v.ip && v.shut===false; }},
    {text:"From <b>SRV-PC</b> (same subnet), <code>ping 192.168.10.2</code> — replies", done:B=>Bench.pinged(B,"pc1","192.168.10.2")},
    {text:"Before adding any gateway, ping 192.168.10.2 from <b>NOC-PC</b> (other subnet) — it times out. Open the log: the request arrives; the switch ARPs for 10.10.10.50 itself and nobody answers, so the reply can't leave", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+192\.168\.10\.2\s*$/i) && Bench.tried(B,"noc",/^\s*ping\s+192\.168\.10\.2\s*$/i)},
    {text:"Configure <code>ip default-gateway 192.168.10.1</code> and ping again from NOC-PC — replies", done:B=>B.devs.sw1.env.defaultGw==="192.168.10.1" && Bench.pinged(B,"noc","192.168.10.2")},
    {text:"Save it: <code>copy running-config startup-config</code>", done:B=>!!B.devs.sw1.env.savedOnce && !!B.devs.sw1.env.startup && B.devs.sw1.env.startup.defaultGw==="192.168.10.1"},
    {text:"<b>Experiment — why baselines turn proxy ARP off.</b> On NEW-SW, <code>no ip default-gateway</code>. Move the console to <b>R1</b> and turn proxy ARP back on: <code>interface g0/0</code>, <code>ip proxy-arp</code>. Ping 192.168.10.2 from NOC-PC: it replies with no gateway — find the <b>Proxy ARP reply</b> from R1 in the log. Then restore both: <code>no ip proxy-arp</code> on R1 G0/0, and <code>ip default-gateway 192.168.10.1</code> on NEW-SW", done:B=>Bench.proxied(B) && B.devs.r1.env.intfs["GigabitEthernet0/0"].proxyArp===false && B.devs.sw1.env.defaultGw==="192.168.10.1"},
  ],
  win:"You gave a factory-fresh switch a management address on its SVI, proved the same-subnet test can fool you, watched the reply die without a gateway, fixed it and saved — then saw how a router's proxy ARP can hide that same fault. That is exactly the 'pings from the server room, not from the NOC' ticket — solved before anyone raised it.",
  solve:[
    ["plug","console","lap:usb","sw1:con"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],
    ["term","enable"],["term","configure terminal"],
    ["term","interface g0/1"],["term","ip address 192.168.10.2 255.255.255.0"],
    ["term","interface vlan 1"],["term","ip address 192.168.10.2 255.255.255.0"],["term","no shutdown"],["term","end"],
    ["pc","pc1","ping 192.168.10.2"],
    ["pc","noc","ping 192.168.10.2"],
    ["term","configure terminal"],["term","ip default-gateway 192.168.10.1"],["term","end"],
    ["pc","noc","ping 192.168.10.2"],
    ["term","copy running-config startup-config"],["term",""],
    ["term","configure terminal"],["term","no ip default-gateway"],["term","end"],
    ["unplug","lap:usb"],["plug","console","lap:usb","r1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],
    ["term","enable"],["term","configure terminal"],["term","interface g0/0"],["term","ip proxy-arp"],["term","end"],
    ["pc","noc","ping 192.168.10.2"],
    ["term","configure terminal"],["term","interface g0/0"],["term","no ip proxy-arp"],["term","end"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],
    ["term","enable"],["term","configure terminal"],["term","ip default-gateway 192.168.10.1"],["term","end"],
    ["pc","noc","ping 192.168.10.2"],
  ]})}
${K.check({q:"SRV-PC (192.168.10.11) can ping the switch at 192.168.10.2, but the NOC at 10.10.10.50 cannot. The SVI is up/up. What is the most likely fix?", o:["no shutdown on interface vlan 1","ip default-gateway 192.168.10.1 on the switch","ip address 10.10.10.2 on Gi0/1","Change SRV-PC's default gateway"], a:1, why:"Same-subnet works, so the SVI is fine. The NOC's request arrives, but the switch can't route its reply off 192.168.10.0/24 without a default gateway on its own subnet."})}

<h2>Locking the front door: passwords, the console line and the banner</h2>
<p>In Module 1 you set a hostname, an <code>enable secret</code> and a console password with <code>login</code>. Now: how strong each line really is, and the console settings that make a switch safe and pleasant to work on.</p>
<p><b>Hostname first.</b> <code>ABJ-MAI-SW01</code> follows a convention — city, site, role, number. With six SSH sessions open, the prompt is what stops you configuring the wrong switch, and the name appears in monitoring, logs and backups.</p>
<h3>How passwords are stored</h3>
<p>Configs leave the switch all the time — pasted into tickets, emailed, saved to backup servers. So ask: what does a stranger see when they read the config? IOS stores passwords in numbered <b>types</b>:</p>
<div class="tablewrap"><table>
<tr><th>Type</th><th>What it is</th><th>How you get it</th><th>Can it be read back?</th></tr>
<tr><td><b>0</b></td><td>Plain text</td><td><code>enable password</code> or a line <code>password</code>, with no encryption service</td><td>Yes — it's sitting there</td></tr>
<tr><td><b>7</b></td><td>Reversible ${K.g("Vigenère-style scrambling","A simple substitution cipher with a fixed, publicly known key. Anyone with the algorithm can reverse it.")}</td><td>Plain-text passwords after <code>service password-encryption</code></td><td>Yes — in seconds, with free tools</td></tr>
<tr><td><b>5</b></td><td>Salted MD5 ${K.g("hash","A one-way fingerprint of the password. You can check a guess against it, but not turn it back into the password.")}</td><td><code>enable secret</code> on older IOS</td><td>No — only by guessing</td></tr>
<tr><td><b>8 / 9</b></td><td>PBKDF2-SHA-256 / ${K.g("scrypt","A slow, memory-hungry hashing method designed to make password guessing expensive.")} hash</td><td><code>enable secret</code> on recent IOS XE (shown as <code>9</code>)</td><td>No — and guessing is far slower</td></tr>
</table></div>
<p>The ${K.g("salt","Random data mixed into a password before hashing, so the same password gives a different hash on every device.")} makes one password hash differently on every switch, so comparing configs doesn't reveal shared passwords.</p>
<p><b>enable secret, and no enable password.</b> When both exist, the secret wins (Module 1). The professional habit goes further: never configure <code>enable password</code>, and remove one you inherit with <code>no enable password</code>. Unused, it is still a readable password in every backup — and people reuse passwords.</p>
<h3>What service password-encryption really does</h3>
<p>Once on, IOS scrambles every <b>plain-text</b> password in the config into type 7: line passwords, any <code>enable password</code>, <code>username … password</code> entries. It doesn't touch <code>enable secret</code>, which is already hashed.</p>
<p>Why is type 7 weak? Its key is the same on every Cisco device and has been public for decades. Anyone with the config can paste <code>106D591716471E0E4F252821767E</code> into a free web page and read the password. It only stops shoulder-surfing. Turn it on (it's free), but real protection is <code>enable secret</code>, users with <code>secret</code> (lesson 6), and keeping configs private.</p>
${K.q({type:"match", q:"Match each password type with what an attacker who has the config file can do with it.", pairs:[["Type 0","Read it directly — it's plain text"],["Type 7","Reverse it in seconds with free tools"],["Type 5","Only guess, against a salted MD5 hash"],["Type 9","Only guess, slowly, against an scrypt hash"]], why:"Types 0 and 7 are readable: 0 is plain text and 7 uses a public, fixed key. Types 5, 8 and 9 are one-way hashes, so the only attack is guessing — and type 9 (scrypt) is designed to make each guess slow and expensive. That's why enable secret beats enable password even with service password-encryption on."})}
<h3>Hardening the console line</h3>
<p>The console is the back door: anyone at the rack can use it, and it works even when the network is down. Four lines make it safe and usable:</p>
${K.out(`ABJ-MAI-SW01(config)#line console 0
ABJ-MAI-SW01(config-line)#password C0ns0le#Abj26
ABJ-MAI-SW01(config-line)#login
ABJ-MAI-SW01(config-line)#exec-timeout 10 0
ABJ-MAI-SW01(config-line)#logging synchronous
ABJ-MAI-SW01(config-line)#exit`, "A hardened console line.")}
<ul>
<li><b>password … / login</b> — set it, then make IOS ask for it. In lesson 6 this becomes <code>login local</code> with named users.</li>
<li><b>exec-timeout 10 0</b> — log out after 10 minutes 0 seconds idle (the default; many companies use 5). <code>exec-timeout 0 0</code> means <b>never</b>: an engineer walks away logged in at <code>#</code>, and the next person to pick up the cable owns the switch.</li>
<li><b>logging synchronous</b> — without it, a message such as <code>%LINK-3-UPDOWN</code> prints in the middle of your typing. With it, IOS prints the message, then redraws your half-typed command on a fresh line.</li>
</ul>
${K.mistake(`Setting <code>exec-timeout 0 0</code> in a lab "because the timeout is annoying", then pasting that template onto production. A comms room in a shared building isn't private — cleaners, contractors and other tenants' IT people pass through.`)}
<h3>The banner: a legal warning, not a welcome</h3>
<p><code>banner motd</code> sets the ${K.g("message of the day","A banner IOS shows to everyone who connects, before the login prompt.")}, shown to everyone who connects, before login. Its job is legal: in many countries, prosecuting unauthorised access is easier when the intruder was clearly warned.</p>
${K.out(`ABJ-MAI-SW01(config)#banner motd #
Enter TEXT message.  End with the character '#'.
AUTHORISED ACCESS ONLY. This device belongs to the client and is managed
by its IT provider. Disconnect now if you are not authorised.
All activity is monitored and logged.
#`, "A legal banner. The # is a delimiter: it marks the start and end of the text, so it must not appear inside the message.")}
<p>Good wording says three things: access is <b>for authorised users only</b>, activity is <b>monitored</b>, and others must <b>disconnect</b>. Never "Welcome" (an invitation), and never the model, software version, IP addresses or internal names — free reconnaissance for an attacker. Many companies get the exact wording from their legal team.</p>
<h3>no ip domain-lookup: stop the typo freeze</h3>
<p>Mistype a command at the <code>#</code> prompt — <code>shwo</code> — and IOS assumes it's a hostname to Telnet to, tries a DNS lookup by broadcasting to 255.255.255.255, and freezes for several seconds:</p>
${K.out(`ABJ-MAI-SW01#shwo
Translating "shwo"...domain server (255.255.255.255)

% Bad IP address or host name
% Unknown command or computer name, or unable to find computer address`, "The typo trap. The wait is IOS trying a DNS lookup that will never succeed.")}
<p><code>no ip domain-lookup</code> turns off ${K.g("DNS lookup","Translating a name into an IP address by asking a DNS server.")}, so typos fail instantly. IOS XE displays it as <code>no ip domain lookup</code>; both spellings work. Stuck in a lookup? ${K.kbd("Ctrl")}+${K.kbd("Shift")}+${K.kbd("6")} interrupts it.</p>
${K.myth([
  ["A config showing 'password 7 …' is safe to paste into a ticket.", "Type 7 reverses in seconds — treat it as plain text."],
  ["The switch's default gateway carries the users' traffic.", "PCs use their own gateway. The switch's is only for packets the switch itself sends."],
  ["An SVI with an IP and no shutdown is always up.", "Only while a port in its VLAN is up and forwarding (autostate)."],
  ["A banner should welcome users and list device details.", "The hostname tells engineers where they are. A banner is a legal warning."],
  ["Unused ports don't matter if the comms room is locked.", "Every wall socket in the building is patched to the switch."],
])}
${K.check({q:"A new engineer configures exec-timeout 0 0 on the console line. What does that do?", o:["Logs the console out immediately","Disables the console port","Means the console session never times out","Sets the default timeout of 10 minutes"], a:2, why:"0 minutes 0 seconds means no timeout at all, so an unattended logged-in console stays open forever. The default is 10 minutes (exec-timeout 10 0)."})}

<h2>Port hygiene: describe what's used, shut what isn't</h2>
<p>A tidy switch tells the next engineer what's plugged in without a trip to the comms room. Two rules: every <b>used</b> port gets a description; every <b>unused</b> port gets shut.</p>
<h3>Descriptions on every used port</h3>
<p>A ${K.g("description","A free-text label on an interface. It changes nothing about how the port works.")} such as <code>description UPLINK to ABJ-MAI-RTR01 G0/0</code> shows in status output, monitoring and backups. Say <b>what</b> is connected and, for network devices, <b>the far-end port</b>. Put key words first: the status view shows only 18 characters, so <code>FILE-SRV01 NIC1</code> beats <code>Connected to the main file server</code>.</p>
<h3>Shut every unused port</h3>
<p>An enabled, unused port is an open door. Patch panels usually connect every wall socket to the switch, so a visitor in the meeting room can plug in and land next to the file server. <code>interface range</code> shuts many at once:</p>
${K.out(`ABJ-MAI-SW01(config)#interface range gigabitEthernet 0/4 - 10
ABJ-MAI-SW01(config-if-range)#shutdown
%LINK-5-CHANGED: Interface GigabitEthernet0/4, changed state to administratively down
%LINK-5-CHANGED: Interface GigabitEthernet0/5, changed state to administratively down
[... one line per port ...]`, "Shutting seven ports in one go. Note the prompt: config-if-range.")}
<p>When a desk needs a port, describe it and <code>no shutdown</code> it — a five-minute, recorded change. The VLAN module adds one more habit: parking unused ports in an unused VLAN as well.</p>
${K.svg("0 0 740 220",
  `<rect x="40" y="40" width="660" height="92" rx="8" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.4"/>`+
  K.txt(56,60,"ABJ-MAI-SW01 · front panel",{c:"fg",b:true,s:12,f:"display"})+
  [1,2,3,4,5,6,7,8,9,10].map(n=>{ const x = 70+(n-1)*62, used = n<=3;
    return `<rect x="${x}" y="78" width="40" height="30" rx="3" fill="${used?"var(--chip)":"var(--bg)"}" stroke="${used?"var(--ok)":"var(--muted)"}" stroke-width="${used?2:1.2}"/>`+
      `<circle cx="${x+20}" cy="72" r="3.5" fill="${used?"var(--ok)":"var(--line)"}"/>`+
      K.txt(x+20,98,"Gi0/"+n,{mid:true,s:9.5,c:"fg"})+
      K.txt(x+20,124,used?"connected":"disabled",{mid:true,s:9,c:used?"ok":"muted"}); }).join("")+
  K.txt(90,160,"UPLINK to",{mid:true,c:"accent",s:10})+K.txt(90,173,"RTR01 G0/0",{mid:true,c:"accent",s:10})+
  K.txt(152,160,"FILE-SRV01",{mid:true,c:"accent",s:10})+K.txt(152,173,"NIC1",{mid:true,c:"accent",s:10})+
  K.txt(214,160,"PRINTER",{mid:true,c:"accent",s:10})+K.txt(214,173,"RECEPTION",{mid:true,c:"accent",s:10})+
  K.txt(490,165,"Gi0/4 – Gi0/10: no description, shutdown",{mid:true,c:"muted",s:11})+
  K.txt(370,205,"Used ports: described, enabled.  Unused ports: shut until someone asks for them.",{mid:true}),
  "Port hygiene on a small switch: the three used ports carry descriptions; the seven unused ones are administratively shut.")}
<h3>show interfaces status: your inventory</h3>
<p>One command shows every physical port with its description, state, VLAN, duplex and speed:</p>
${K.out(`ABJ-MAI-SW01#show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi0/1     UPLINK to ABJ-MAI- connected    1          a-full a-1000 10/100/1000BaseTX
Gi0/2     FILE-SRV01 NIC1    connected    1          a-full a-1000 10/100/1000BaseTX
Gi0/3     PRINTER RECEPTION  connected    1          a-full  a-100 10/100/1000BaseTX
Gi0/4                        disabled     1            auto   auto 10/100/1000BaseTX
Gi0/5                        disabled     1            auto   auto 10/100/1000BaseTX
Gi0/6                        notconnect   1            auto   auto 10/100/1000BaseTX
Gi0/7                        disabled     1            auto   auto 10/100/1000BaseTX`, "Inventory at a glance (trimmed). Gi0/6 was missed: no description, not shut.")}
<ul>
<li><b>Name</b> — the description, cut to 18 characters. A blank Name beside <i>connected</i> is a question: what is that?</li>
<li><b>connected</b> — link up. <b>notconnect</b> — enabled, no link. <b>disabled</b> — administratively shut. <b>err-disabled</b> — shut automatically by the switch after a fault or security rule (later lessons).</li>
<li><b>a-full a-1000</b> — auto-negotiated full duplex, 1 Gb/s. The printer's <b>a-100</b> is fine for a 100 Mb/s device.</li>
<li><b>Gi0/6 notconnect, no description</b> — an unused port someone forgot to shut.</li>
</ul>
${K.mistake(`Shutting a range that includes the port you're managing the switch through. Over SSH, <code>interface range g0/1 - 10</code> then <code>shutdown</code> cuts the uplink — and your session — and someone drives to site with a console cable. Check <code>show interfaces status</code> first and leave the uplink out.`)}
${K.check({q:"In show interfaces status, a port shows Status 'connected' with an empty Name column. What should you do?", o:["Shut it immediately — undocumented ports are always attacks","Nothing; descriptions are optional","Find out what is connected (MAC table, cable trace, ask the client), then describe it or shut it","Change it to a different VLAN"], a:2, why:"A blank description on a live port is an unknown device. Identify it first — it might be the MD's laptop — then label it or, if it shouldn't be there, shut it."})}

<h2>Read it back, save it: the day-one checklist</h2>
<p>Never trust your memory of what you typed. Read the running-config back, top to bottom, as an auditor will.</p>
${K.out(`ABJ-MAI-SW01#show running-config
Building configuration...

Current configuration : 2311 bytes
!
version 17.9
service password-encryption
!
hostname ABJ-MAI-SW01
!
enable secret 9 $9$Hq3Lr8zK1vNcPe$Zt0yH1xQm7Gf2kWb9sLd4RcVa6Ej8uTn5pYo0iXzMw2
!
no ip domain lookup
!
interface GigabitEthernet0/1
 description UPLINK to ABJ-MAI-RTR01 G0/0
!
interface GigabitEthernet0/2
 description FILE-SRV01 NIC1
!
interface GigabitEthernet0/3
 description PRINTER RECEPTION
!
interface GigabitEthernet0/4
 shutdown
!
[... Gi0/5 to Gi0/10 the same ...]
interface Vlan1
 ip address 192.168.10.2 255.255.255.0
!
ip default-gateway 192.168.10.1
!
banner motd ^CAUTHORISED ACCESS ONLY. ... All activity is monitored and logged.^C
!
line con 0
 password 7 106D591716471E0E4F252821767E
 logging synchronous
 login
line vty 0 4
 login
line vty 5 15
 login
!
end`, "A baselined switch. Read it in sections, not as one wall of text.")}
${K.steps([
  ["The header", `<p><code>service password-encryption</code> is on — now check that no password below is still plain text.</p>`],
  ["Identity and privileged access", `<p>The <code>hostname</code> fits the convention. An <code>enable secret</code> (type 9), and <b>no</b> <code>enable password</code>.</p>`],
  ["Global services", `<p><code>no ip domain lookup</code>. Real templates add NTP, syslog and SNMP here.</p>`],
  ["Interfaces", `<p>Used ports described, unused ports <code>shutdown</code>. Physical ports first, then <code>interface Vlan1</code> with the address — and no <code>shutdown</code> under it.</p>`],
  ["Gateway and banner", `<p><code>ip default-gateway</code> is on the SVI's subnet. The banner (delimiter shown as <code>^C</code>) carries the legal wording only.</p>`],
  ["The lines", `<p><code>line con 0</code>: type 7 password (no <code>exec-timeout</code> line — 10 0 is the default, and IOS hides default values), <code>logging synchronous</code>, <code>login</code>. The VTY lines are lesson 6; until then <code>login</code> with no password means nobody can log in remotely.</p>`],
  ["Save", `<p><code>copy running-config startup-config</code>, and see the <code>[OK]</code>. A power cut before you save — not a theoretical risk in Abuja — and the switch boots as <code>Switch</code>.</p>`],
])}
${K.tip(`Filter long output: <code>show running-config | section line con</code>, <code>| include default-gateway</code>. Before a risky remote change, <code>reload in 10</code> reboots to the saved config if you lock yourself out; <code>reload cancel</code> when all is well. Both work in these terminals.`)}
<h3>Try it: spot the problems</h3>
<p>A colleague asks you to check their baseline before they leave site. Find four problems.</p>
${K.out(`hostname Switch
!
enable password Lagos2026
!
interface GigabitEthernet0/5
!
interface Vlan1
 ip address 192.168.10.2 255.255.255.0
 shutdown
!
ip default-gateway 10.10.10.1
!
line con 0
 exec-timeout 0 0
 login`, "Excerpt of a colleague's 'finished' baseline.")}
${K.hint(`Go section by section: name, privileged password, ports, SVI, gateway, console. For each line ask "would I want an auditor or the NOC to see this?"`)}
${K.reveal("Show the problems",`<ol>
<li><b>hostname Switch</b> — never named.</li>
<li><b>enable password Lagos2026</b> in plain text, no <code>enable secret</code>. Add the secret, <code>no enable password</code>, and <code>service password-encryption</code>.</li>
<li><b>Gi0/5</b>: no description, not shut — an open port.</li>
<li><b>Vlan1 shutdown</b> — management can't work; <code>no shutdown</code>.</li>
<li><b>ip default-gateway 10.10.10.1</b> isn't on the SVI's subnet; use 192.168.10.1.</li>
<li><b>line con 0</b> has <code>login</code> but no password, so there is nothing to check — IOS even warns <i>Login disabled on line 0, until 'password' is set</i> — and <code>exec-timeout 0 0</code> never times out. Set a password and a sensible timeout.</li>
</ol><p>That's six, not four — a "finished" baseline often hides more than you're told to look for.</p>`)}
<h3>The day-one checklist an MSP uses</h3>
<p>Good MSPs don't rely on memory: a written baseline and a config template, the same on every switch.</p>
${K.remember(`<b>Name it · Lock it · Warn them · Reach it · Tidy it · Save it.</b><br>
<b>Name</b>: hostname. <b>Lock</b>: enable secret, encryption, console line. <b>Warn</b>: banner. <b>Reach</b>: SVI, no shutdown, gateway, test from the NOC. <b>Tidy</b>: no ip domain-lookup, descriptions, unused ports shut. <b>Save</b>: copy run start, off-box backup, documentation.`)}
<p>Documentation is what lets an MSP support a client at 2 a.m.: name, IP, gateway, port map and config go into the client's records the same day. SSH joins the checklist in lesson 6.</p>
${K.dodont([
  "Test management from the NOC's subnet, not only from the same room.",
  "Use enable secret; remove any inherited enable password.",
  "Describe used ports: device and far-end port, key words first.",
  "Shut unused ports — but never the one you're connected through.",
  "Save, back the config up off the switch, update the records.",
],[
  "Don't put the management IP on an access port or leave the SVI shut.",
  "Don't point ip default-gateway outside the SVI's subnet.",
  "Don't treat type 7 as protection.",
  "Don't use exec-timeout 0 0 or a 'Welcome' banner.",
  "Don't leave site unsaved — one power cut undoes the visit.",
])}
<h3>Hands-on: the full baseline</h3>
<p>A fresh switch for Maitama. Site survey: Gi0/1 uplink to <code>ABJ-MAI-RTR01 G0/0</code>, Gi0/2 file server, Gi0/3 reception printer, Gi0/4 to Gi0/10 unused. This terminal has no real cables, so every port that isn't shut shows as connected — trust the survey.</p>
${K.hint(`Global first: <code>hostname</code>, <code>enable secret</code>, <code>service password-encryption</code>, <code>no ip domain-lookup</code>, a one-line <code>banner motd #Authorised access only...#</code>. Then <code>line console 0</code>: password, login, exec-timeout, logging synchronous. Then each used port's <code>description</code>, and <code>interface range g0/4 - 10</code> with <code>shutdown</code>. <code>end</code>, then <code>copy running-config startup-config</code>.`)}
${K.term({env:"ios2", title:"day-one baseline for ABJ-MAI-SW01",
  opts:{kind:"switch", host:"Switch", model:"C9200L-24P-4G", motd:"Factory-fresh Catalyst. Press Enter, or type enable to begin."},
  intro:"Type the commands yourself — abbreviations, <code>?</code> help and Tab completion work. Run <code>show running-config</code> and <code>show interfaces status</code> as often as you like.",
  tasks:[
    {text:"Name the switch <code>ABJ-MAI-SW01</code>", done:e=>e.host==="ABJ-MAI-SW01"},
    {text:"Set an <code>enable secret</code> (any password) — and no <code>enable password</code>", done:e=>!!e.enableSecret && !e.enablePassword},
    {text:"Turn on <code>service password-encryption</code>", done:e=>!!e.servicePwEnc},
    {text:"Console line: a <code>password</code> and <code>login</code>", done:e=>!!e.lines.con.password && !!e.lines.con.login},
    {text:"Console line: <code>exec-timeout</code> (anything except 0 0) and <code>logging synchronous</code>", done:e=>!!e.lines.con.timeout && e.lines.con.timeout!=="0 0" && !!e.lines.con.sync},
    {text:"A <code>banner motd</code> that says access is for <i>authorised</i> users only", done:e=>e.banner!=null && /authori[sz]ed/i.test(e.banner)},
    {text:"Stop the typo freeze: <code>no ip domain-lookup</code>", done:e=>e.domainLookup===false},
    {text:"Describe the three used ports, Gi0/1, Gi0/2 and Gi0/3", done:e=>["GigabitEthernet0/1","GigabitEthernet0/2","GigabitEthernet0/3"].every(n=>e.intfs[n].desc && e.intfs[n].desc.trim())},
    {text:"Shut every unused port, Gi0/4 to Gi0/10 — and leave Gi0/1–0/3 up", done:e=>[4,5,6,7,8,9,10].every(n=>e.intfs["GigabitEthernet0/"+n].shut) && [1,2,3].every(n=>!e.intfs["GigabitEthernet0/"+n].shut)},
    {text:"Save when you're done — the saved config must include the banner, encryption and shut ports", done:e=>!!e.savedOnce && !!e.startup && !!e.startup.servicePwEnc && e.startup.banner!=null && !!e.startup.intfs["GigabitEthernet0/10"].shut && e.startup.host==="ABJ-MAI-SW01"},
  ],
  win:"Named, locked, warned, tidied and saved — the baseline every switch at this client will get. Run show running-config once more and read it section by section, as you would before leaving site.",
  solve:["enable","configure terminal","hostname ABJ-MAI-SW01","enable secret Mait4ma!Core26","service password-encryption","no ip domain-lookup",
    "banner motd #Authorised access only. Disconnect now if you are not authorised. All activity is monitored and logged.#",
    "line console 0","password C0ns0le#Abj26","login","exec-timeout 10 0","logging synchronous","exit",
    "interface g0/1","description UPLINK to ABJ-MAI-RTR01 G0/0","interface g0/2","description FILE-SRV01 NIC1","interface g0/3","description PRINTER RECEPTION",
    "interface range g0/4 - 10","shutdown","end","copy running-config startup-config",""]})}
<p>Then compare the console's <code>password 7 …</code> with <code>enable secret 9 $9$…</code> in <code>show running-config</code>: one scrambled, one hashed.</p>
${K.check({q:"You finish a baseline and run show running-config. Which line should worry you most?", o:["enable secret 9 $9$...","service password-encryption","enable password 7 0822455D0A16","no ip domain lookup"], a:2, why:"An enable password, even as type 7, is reversible in seconds — and people reuse passwords. Remove it with no enable password and rely on the enable secret."})}

${K.job("Day-one switch baseline in Maitama — and 'it pings from the server room, not from the NOC'",`
<p><b>The work order.</b> "Law firm, Maitama, Abuja. Install and baseline ABJ-MAI-SW01. Management 192.168.10.2/24, gateway 192.168.10.1 (ABJ-MAI-RTR01). Hand over to NOC monitoring."</p>
<p><b>On site.</b> You rack and patch it (uplink Gi0/1, file server Gi0/2, printer Gi0/3), console in and paste the MSP template in pieces. From the server-room PC, <code>ping 192.168.10.2</code> replies. You save and pack up.</p>
<p><b>The ticket.</b> Twenty minutes later, the NOC in Lagos: <i>"ABJ-MAI-SW01 192.168.10.2 is DOWN in monitoring."</i> You reply that it pings from the server room. <i>"Not from here. 100% loss."</i></p>
<p><b>Questions.</b> "Where are you pinging from?" — <i>"Our monitoring server, 10.10.10.50."</i> "Can you reach ABJ-MAI-RTR01?" — <i>"Yes, both addresses."</i> WAN and router are fine; same subnet works, other subnet doesn't. That pattern points at the switch's gateway.</p>
<p><b>Checks, in order.</b></p>
<ol>
<li><code>show ip interface brief</code> — <code>Vlan1 192.168.10.2 YES manual up up</code>. SVI fine.</li>
<li><code>ping 192.168.10.1</code> from the switch — <code>!!!!!</code>. The local subnet works.</li>
<li><code>show ip route</code> — <code>Default gateway is not set</code>. There's the fault: the NOC's pings arrive, the replies have no router to go to. (ABJ-MAI-RTR01 runs the MSP's hardened template with <code>no ip proxy-arp</code>, so nothing masks it.)</li>
<li><code>show running-config | include default-gateway</code> — nothing. The template line was missed while pasting in pieces.</li>
</ol>
<p><b>Fix.</b> <code>configure terminal</code>, <code>ip default-gateway 192.168.10.1</code>, <code>end</code>, <code>copy running-config startup-config</code>. <code>show ip route</code> now says <code>Default gateway is 192.168.10.1</code>; the NOC retests and monitoring turns green.</p>
<p><b>What you say.</b> To the NOC: "Fixed — no default gateway, so it answered the server room but not you. Set to 192.168.10.1 and saved." To the office manager: "One last setting so our Lagos team can see the switch. Nothing changed for your staff."</p>
<p><b>Ticket note.</b> <i>"ABJ-MAI-SW01 down in NOC monitoring after install. Vlan1 up/up, local ping OK. show ip route: Default gateway is not set. Fix: ip default-gateway 192.168.10.1, saved. NOC confirms reachable from 10.10.10.50. Checklist: test from NOC before leaving site. 15 min."</i></p>`)}

${K.case("Type 7 on a shared drive",`
<p>A Lagos microfinance bank's MSP copied all forty branch switch configs to a shared folder every month. Every password showed as <code>password 7 …</code>, so the engineer considered them encrypted. Every switch used <code>enable password</code>, not <code>enable secret</code>, and every branch shared it.</p>
<p>A penetration tester with a staff account found the folder, decoded one type 7 string online and had privileged access to every branch switch. The fix took a weekend: <code>enable secret</code> and <code>no enable password</code> everywhere, unique per-site passwords in the MSP's vault, local users with <code>secret</code> (lesson 6), and backups moved to a server only the network team can read. The report's line stuck: <i>"Type 7 is encoding, not encryption."</i></p>`)}

<h2>Interview corner</h2>
${K.hint(`Two halves: why an IP at all (management, not forwarding), then why a gateway (replies to other subnets). Mention the SVI and the classic symptom.`)}
${K.reveal("“Why does a Layer 2 switch need an IP address and a default gateway?”",`<p>"Not to forward traffic — that uses MACs. The IP is for managing the switch: SSH, monitoring, syslog, NTP, backups. It goes on an SVI such as <code>interface vlan 1</code>, because Layer 2 ports don't take an IP. The switch then acts like a host, so replies to a NOC on another subnet must go through a router — <code>ip default-gateway</code>. Without it, it pings from its own subnet but not from the NOC. A routing switch would use a default route instead."</p>`)}
${K.hint(`Three commands, three strengths. How is each stored, can it be read back, and what do you actually configure?`)}
${K.reveal("“Explain enable secret, enable password and service password-encryption.”",`<p>"<code>enable password</code> protects privileged EXEC but is stored in plain text. <code>service password-encryption</code> turns plain-text passwords into type 7, which uses a fixed public key and reverses in seconds — it only stops shoulder-surfing. <code>enable secret</code> is a one-way hash — type 5 on older IOS, 8 or 9 on newer — and wins if both exist. So I configure <code>enable secret</code>, remove any <code>enable password</code>, still turn on encryption because it's free, and treat any config with type 7 in it as sensitive."</p>`)}
${K.hint(`Walk through it in the order you'd type it; finish with how you prove it and hand it over.`)}
${K.reveal("“You're given a brand-new access switch. What do you configure before it goes into production?”",`<p>"Our baseline, over the console: hostname; enable secret, no enable password, service password-encryption; console password, login, exec-timeout, logging synchronous; a legal banner; SVI address, no shutdown, ip default-gateway; SSH with local users; descriptions on used ports, unused ports shut; no ip domain-lookup. Then I read the config back, save, test from the NOC's subnet, back it up and update the client's documentation."</p>`)}

${K.recap([
  "A Layer 2 switch forwards by MAC with no IP; the management IP is for managing the switch itself.",
  "That IP lives on an SVI — interface vlan 1 — because Layer 2 ports can't take one.",
  "SVI: ip address, no shutdown; up/up only if its VLAN has an active port (autostate).",
  "No ip default-gateway = pings work from the same subnet, fail from the NOC — unless a router's proxy ARP (on by default) hides it.",
  "enable secret is a hash and wins; remove enable password. Type 7 reverses in seconds.",
  "Console: password + login, exec-timeout (never 0 0), logging synchronous. Banner: legal warning only.",
  "no ip domain-lookup; describe used ports, shut unused ones; show interfaces status is the inventory.",
  "Read the running-config section by section, save, back up, test from another subnet.",
])}
${K.next(`<b>Lesson 6 — Secure remote management: SSH vs Telnet, local users and VTY lines.</b> Your switch is now reachable from the NOC. Next you let engineers log in remotely — securely — with SSH, named local users and VTY lines that refuse Telnet.`)}
`,
quiz:[
  {lvl:1, q:"A Layer 2 access switch forwards frames between its ports perfectly without any IP address. Why do engineers still configure one?", o:["Frames cannot be forwarded between VLAN 1 ports without it","So the switch itself can be managed remotely: SSH, monitoring, syslog, backups","So PCs can use the switch as their default gateway","To enable autonegotiation on the ports"], a:1, why:"Forwarding uses MAC addresses only. The IP address belongs to the management plane: it lets engineers and tools talk to the switch itself."},
  {lvl:1, q:"On a Layer 2 Catalyst access switch, where is the management IP address configured?", o:["Under the physical port facing the router","Under line console 0","Under an SVI, such as interface vlan 1","In the VLAN database with vlan 1"], a:2, why:"A switched virtual interface (SVI) is a virtual Layer 3 interface attached to a VLAN. Physical access ports reject ip address on a Layer 2 switch."},
  {lvl:2, q:"An engineer configured the switch's management IP, but nothing can ping it. Based on the exhibit, what is the fix?", ex:"SW1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nVlan1                  192.168.10.2    YES manual administratively down down\nGigabitEthernet0/1     unassigned      YES unset  up                    up\nGigabitEthernet0/2     unassigned      YES unset  up                    up", o:["Configure ip default-gateway","Enter no shutdown under interface vlan 1","Move the IP address to GigabitEthernet0/1","Re-enter the IP address with a different mask"], a:1, why:"Administratively down means the SVI is shut in the configuration. Ports in VLAN 1 are up, so no shutdown under interface vlan 1 will bring it up/up."},
  {lvl:2, q:"A switch's SVI shows 'Vlan1 is up, line protocol is down'. The SVI has an IP address and is not shut. What is the most likely cause?", o:["The default gateway is missing","service password-encryption is off","No port carrying VLAN 1 is up — nothing is connected, or every VLAN 1 port is shut","The banner is misconfigured"], a:2, why:"An SVI's line protocol follows its VLAN (autostate): it comes up only when at least one port in that VLAN is up and forwarding. The default gateway never affects interface state."},
  {lvl:3, q:"A new switch answers pings from SRV-PC (192.168.20.15) but not from the monitoring server at 10.10.10.50. R1 routes between both subnets and the monitoring server can ping R1's 192.168.20.1. Based on the exhibit, what should you configure?", ex:"SW-ACC2#show running-config\n...\ninterface Vlan1\n ip address 192.168.20.5 255.255.255.0\n!\nline con 0\n password 7 0822455D0A16\n login\n!\nend\n\nSW-ACC2#show ip route\nDefault gateway is not set", o:["ip default-gateway 192.168.20.1","ip default-gateway 10.10.10.1","ip route 10.10.10.0 255.255.255.0 GigabitEthernet0/1","no shutdown under interface vlan 1"], a:0, why:"Same subnet works and the SVI is clearly up, so the switch can't send replies off 192.168.20.0/24: it has no default gateway. The gateway must be R1's address on the switch's own subnet, 192.168.20.1 — 10.10.10.1 is on another subnet and would not work."},
  {lvl:2, type:"multi", q:"Which two statements about service password-encryption are true? (Choose two.)", o:["It converts plain-text passwords in the configuration, such as line passwords, to type 7","Type 7 can be reversed back to the password in seconds with freely available tools","It converts the enable secret into a stronger hash","It encrypts SSH and Telnet sessions","Once it is on, configs can be shared safely"], a:[0,1], why:"service password-encryption only scrambles plain-text passwords into type 7, which uses a fixed public key and is trivially reversed. enable secret is already hashed and is not affected; session encryption is SSH's job (lesson 6)."},
  {lvl:2, q:"An auditor flags this line in a switch backup: 'enable password 7 08314D5D1A0E'. There is no enable secret. What is the best fix?", o:["Nothing — the password is already encrypted as type 7","Configure enable secret with a new password and remove the old one with no enable password","Turn on service password-encryption","Add a banner motd warning"], a:1, why:"Type 7 is reversible, so the auditor is right. enable secret stores a one-way hash; removing enable password takes the readable password out of every future backup. service password-encryption is clearly already on (the 7)."},
  {lvl:2, type:"order", q:"The switch has an SVI 192.168.10.2/24 and ip default-gateway 192.168.10.1. Put the steps of a ping from NOC-PC (10.10.10.50) to the switch in order.", items:["NOC-PC sees 192.168.10.2 is on another subnet and sends the echo request to its gateway R1","R1 routes the packet out of its 192.168.10.1 interface, ARPing for 192.168.10.2 if needed","The switch's SVI receives the echo request","The switch sees 10.10.10.50 is not on 192.168.10.0/24 and picks its default gateway","The switch sends the echo reply to R1's MAC address","R1 routes the reply back to NOC-PC"], why:"The request reaches the switch through R1 whether or not the switch has a gateway. The gateway matters at step 4: without it the switch has no router to send the reply to, so the reply never leaves and NOC-PC sees Request timed out."},
  {lvl:1, type:"match", q:"Match each command with what it does.", pairs:[["banner motd","Shows a legal warning before login"],["logging synchronous","Redraws your typing after a log message interrupts it"],["no ip domain-lookup","Stops typos being treated as hostnames to look up"],["description","Labels a port with what is connected to it"],["login","Makes the line ask for its password"]], why:"These are the small baseline commands that make a switch safe and pleasant to work on. login is the one beginners forget: without it, a line password is never checked."},
  {lvl:2, type:"fill", q:"Type the command for each job on a new switch.", fields:[{label:"Global: stop the 'Translating...domain server' freeze after typos", a:["no ip domain-lookup","no ip domain lookup"], ios:true},{label:"Under line console 0: redraw my half-typed command after log messages", a:["logging synchronous"], ios:true},{label:"Under line console 0: log out after 5 idle minutes", a:["exec-timeout 5 0","exec-timeout 5"], ios:true}], why:"no ip domain-lookup turns off DNS lookups so a mistyped command fails instantly. logging synchronous stops log messages scrambling your input. exec-timeout takes minutes then seconds, so 5 0 is five minutes; 0 0 would mean never time out."},
  {lvl:3, q:"You are reviewing a client's switch before handover. Based on the exhibit, which plan follows good port hygiene?", ex:"SW-RECEP#show interfaces status\n\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi0/1     UPLINK to RTR01 G0 connected    1          a-full a-1000 10/100/1000BaseTX\nGi0/2     MEETING-RM WALL 2  notconnect   1            auto   auto 10/100/1000BaseTX\nGi0/3                        connected    1          a-full  a-100 10/100/1000BaseTX\nGi0/4                        notconnect   1            auto   auto 10/100/1000BaseTX", o:["Shut every port that shows notconnect, including Gi0/2, and leave Gi0/3 as it is","Shut Gi0/1 to Gi0/4 with one interface range and re-enable what users complain about","Identify the device on Gi0/3 (MAC table, cable trace, ask the client) and describe it; shut Gi0/4; agree with the client whether the meeting-room socket on Gi0/2 stays enabled","Add descriptions to Gi0/3 and Gi0/4 saying UNKNOWN"], a:2, why:"Gi0/3 is a live, unknown device — find out what it is before labelling or shutting it. Gi0/4 is unused and undocumented: shut it. Gi0/2 is documented but idle; whether a meeting-room socket stays live is a client decision. Shutting a range that includes Gi0/1 would cut off the uplink."},
  {lvl:1, q:"What does exec-timeout 0 0 under line console 0 do?", o:["Disconnects the console immediately","Disables the console port","The console session never times out","Restores the default timeout"], a:2, why:"The values are minutes and seconds of idle time, and 0 0 means never. The default is 10 minutes. A console that never logs out is a risk in any shared comms room."},
  {lvl:2, q:"Which banner motd text is the best choice for a client's production switch?", o:["Welcome to ABJ-MAI-SW01 (C9200L, IOS XE 17.9, mgmt 192.168.10.2). Call IT on 0803 000 0000 for the password.","Hello! Please log in.","AUTHORISED ACCESS ONLY. Activity on this device is monitored and logged. Disconnect now if you are not authorised.","Property of the network team. Default password is in the comms room."], a:2, why:"A banner is a legal warning: restricted to authorised users, monitored, disconnect if unauthorised. Welcomes invite people in, and model, version, IP addresses, phone numbers or password hints only help an attacker."},
  {lvl:2, q:"A multilayer switch has ip routing enabled. An engineer adds ip default-gateway 192.168.10.1, but the switch still cannot reach other subnets. Why?", o:["ip default-gateway only works on routers","A routing switch ignores ip default-gateway and uses its routing table, so it needs a default route such as ip route 0.0.0.0 0.0.0.0 192.168.10.1","The SVI must be shut down first","The gateway must be configured under interface vlan 1"], a:1, why:"ip default-gateway is used only while IP routing is off — the switch then acts as a host. With ip routing on, the switch makes routing decisions from its routing table and needs a default route instead."},
  {lvl:3, q:"Yesterday you baselined a switch and NOC monitoring showed it green. This morning, after an overnight power cut that outlasted the UPS, the NOC can't reach it. On the console the prompt is 'Switch>' and show ip interface brief shows Vlan1 unassigned. What happened, and what should you do?", o:["The power cut erased the startup-config; replace the switch","The configuration was never saved, so it booted with factory defaults; reapply the baseline, copy running-config startup-config, and back it up off the switch","The SVI went down because of the power cut; type no shutdown","The default gateway was lost because the router rebooted; re-add it on the router"], a:1, why:"A hostname of Switch and no SVI address mean the switch booted with no startup-config: the work lived only in RAM. Power cuts don't erase NVRAM. Reapply, save, and keep an off-box backup so a rebuild is a paste, not a rewrite."},
  {lvl:3, q:"During an assessment, a tester finds 'password 7 104D000A061843595F' under line con 0 in configs copied to a widely readable file share. All forty branch switches use the same console and enable passwords. What is the most complete response?", o:["Nothing — type 7 is encrypted","Turn on service password-encryption again on every switch","Treat the passwords as exposed: change them on every switch, use unique per-site passwords, use enable secret with no enable password, and move backups somewhere only the network team can read","Add a stronger banner motd"], a:2, why:"Type 7 reverses in seconds, so anyone who read the share effectively has the passwords. Change them everywhere, stop reuse, rely on hashes (enable secret, and later username secret), and control who can read config backups."},
],
cards:[
  {f:"Why does a Layer 2 switch need an IP address?", b:"Not to forward frames (that uses MACs) but for the management plane: SSH, monitoring (ping/SNMP), syslog, NTP, backups and upgrades."},
  {f:"What is an SVI?", b:"Switched virtual interface: a virtual Layer 3 interface attached to a VLAN (interface vlan 1). It gives the switch's CPU an IP and MAC on that VLAN."},
  {f:"Why can't the management IP go on Gi0/1 of a Layer 2 switch?", b:"Layer 2 ports have no ip address command (Invalid input; on multilayer switches: IP addresses may not be configured on L2 links). The address belongs to the VLAN, via the SVI."},
  {f:"When is an SVI up/up?", b:"When it isn't shut AND its VLAN exists AND at least one port in that VLAN (access or trunk) is up and forwarding — autostate."},
  {f:"Management IP in three commands", b:"interface vlan 1 → ip address 192.168.10.2 255.255.255.0 → no shutdown. Then, globally, ip default-gateway 192.168.10.1."},
  {f:"What does ip default-gateway do on a switch?", b:"Tells the switch which router to send its own traffic (replies to SSH, pings, monitoring) through when the far end is on another subnet. Must be on the SVI's subnet."},
  {f:"Classic symptom of a missing switch default gateway", b:"Pings to the switch work from the same subnet but time out from another subnet (the NOC). The request arrives; the reply can't leave."},
  {f:"ip default-gateway vs default route", b:"ip default-gateway: Layer 2 switch / ip routing off. With ip routing on, it's ignored — use ip route 0.0.0.0 0.0.0.0 next-hop."},
  {f:"Password types 0, 7, 5, 8/9", b:"0 plain text. 7 reversible scrambling (service password-encryption). 5 salted MD5 hash. 8 PBKDF2, 9 scrypt hash (enable secret on recent IOS XE)."},
  {f:"enable secret vs enable password", b:"secret = one-way hash, wins if both exist. password = plain text or type 7. Configure enable secret, remove enable password with no enable password."},
  {f:"Hardened console line", b:"line console 0: password + login, exec-timeout 10 0 (or 5 0, never 0 0), logging synchronous."},
  {f:"What makes a good banner motd?", b:"A legal warning: authorised users only, activity monitored, disconnect if unauthorised. No 'welcome', no model, version, IPs or names."},
  {f:"no ip domain-lookup", b:"Stops IOS treating a typo at the prompt as a hostname and freezing on a DNS lookup (Translating...domain server). Trade-off: no name resolution on the switch."},
  {f:"Port hygiene and the inventory command", b:"Describe every used port (what + far-end port, key words in the first 18 characters), shut every unused port. show interfaces status: connected, notconnect, disabled, err-disabled."},
],
});
// ---------- Module 2 · Lesson 6 ----------
L.push({
id:"sw-ssh", mins:60, level:"Beginner · hands-on",
t:"Secure remote management: SSH vs Telnet, local users and VTY lines",
html:`
${K.goals([
  "Explain what a VTY line is and why a Catalyst switch has 16 of them.",
  "Show what an attacker on the path sees in a Telnet session, and what SSH changes.",
  "Configure SSH version 2 on a Cisco switch in the right order, saying why each prerequisite exists.",
  "Verify SSH with <code>show ip ssh</code>, <code>show users</code> and <code>show running-config</code>, and log in from a Windows PC.",
  "Diagnose refused, timed-out and denied SSH logins, and move a live switch from Telnet to SSH without locking yourself out.",
])}
${K.pre([
  "Module 1, lesson 8 — console, IOS modes, <code>hostname</code>, <code>enable secret</code>, saving, in-band vs out-of-band.",
  "Module 1, lesson 6 — TCP and port numbers.",
  "Module 2, lessons 4 (ARP) and 5 (the management SVI and <code>ip default-gateway</code>).",
])}

<h2>Why this matters at work</h2>
<p>A microfinance bank has 38 branches between Lagos, Ibadan and Port Harcourt, and every branch has a small switch behind the teller counters. On Tuesday, a security auditor sends a one-line finding: <i>&ldquo;Telnet (TCP 23) is open on the management address of 31 branch switches. Credentials are sent in clear text. Remediate within 14 days.&rdquo;</i></p>
<p>Nobody is driving to 31 branches. The work has to be done remotely, over the same network you are about to change. Do it carelessly and you lock yourself out of a switch 500 km away, and someone books a flight. Do it properly — SSH set up and tested, Telnet removed, the console kept as a safety net — and the finding is closed by Friday. This lesson teaches the proper way, one command at a time, with the reason behind each.</p>

<h2>Managing switches you can't touch: in-band access and VTY lines</h2>
<p>In Module 1 you configured a new switch through its console port. That cable is perfect on day one: no IP address, no configuration needed. But <b>you have to be standing next to the switch</b>: one cable, one device, one engineer in the room.</p>
<p>The bank above has 38 branches plus a 12-floor head office: more than 50 switches. If every change needed someone on site, changing a password everywhere would take weeks of travel. And at 2 a.m., when a branch reports an outage, you want to see the switch from your desk in two minutes.</p>
<p>So once a switch has a management IP (the SVI from lesson 5), engineers reach it <b>over the network</b>, through the same switches and links that carry users' traffic. That is called ${K.g("in-band management","Managing a device over the same network that carries user traffic, for example SSH to the switch's VLAN 1 address. Convenient, but if that network breaks, so does your access.")}. The console stays as the ${K.g("out-of-band","A management path separate from the production network: the console port, a console server, or a dedicated management port. Still works when the network is broken.")} path for emergencies.</p>
${K.svg("0 0 720 290",
  K.dev("pc",60,135,"ADMIN-PC","Lagos HQ")+K.dev("router",185,135,"HQ router","")+K.dev("cloud",320,135,"Bank WAN","")+
  K.dev("switch",500,50,"ABJ-SW1","10.30.0.2")+K.dev("switch",500,140,"IBD-SW1","10.40.0.2")+K.dev("switch",500,230,"PHC-SW1","10.50.0.2")+
  K.link(85,135,161,135)+K.link(209,135,296,135)+K.arrow(346,128,472,58,"SSH",true)+K.arrow(350,138,472,140,"SSH",true)+K.arrow(346,148,472,224,"SSH",true)+
  K.box(570,28,135,44,"VTY 0–15","16 remote 'doors'")+K.box(570,118,135,44,"VTY 0–15","16 remote 'doors'")+K.box(570,208,135,44,"VTY 0–15","16 remote 'doors'")+
  K.link(526,50,570,50,"",true)+K.link(526,140,570,140,"",true)+K.link(526,230,570,230,"",true)+
  K.txt(82,215,"one desk, many switches:",{mid:true,c:"fg"})+K.txt(82,230,"in-band, over the WAN",{mid:true}),
  "In-band management: one engineer at head office reaches every branch switch over the network. Each remote session lands on one of the switch's VTY lines.")}
<h3>What a VTY line is</h3>
<p>Inside IOS, every way of getting a command prompt is called a <b>line</b>. The console port is <code>line con 0</code>. Remote sessions arrive on ${K.g("VTY lines","Virtual teletype lines: the 'virtual' terminal lines that remote sessions (SSH or Telnet) connect to. Each session uses one line; the line's settings decide how it logs in and which protocols it accepts.")} (<i>virtual teletype</i>). They are not physical: no cable, no port. Each one is a slot for one remote session. When you SSH in, IOS gives you the lowest-numbered free VTY line, and that line's settings decide everything: <b>which protocols</b> it accepts, <b>how you log in</b> and <b>how long</b> you can sit idle.</p>
${K.analogy(`<p>The switch is an office. The <b>console</b> is the staff door at the back: you must be in the building. The <b>VTY lines</b> are numbered phone lines into reception; each caller takes the lowest free line, and each line has its rules written on it: &ldquo;secure language only&rdquo;, &ldquo;ask for name and secret&rdquo;, &ldquo;hang up after 10 minutes of silence&rdquo;. Write the rules on lines 0 to 4 only, and line 5 still answers with the old ones.</p>`)}
<h3>0 4 or 0 15?</h3>
<p>The number of VTY lines is the number of people who can be logged in remotely at once. A Catalyst switch has <b>16</b>, numbered 0 to 15; many routers show 5 (0 to 4). You configure them as a range: <code>line vty 0 4</code> (the first five) or <code>line vty 0 15</code> (all sixteen). <b>On switches, use 0 15.</b></p>
<p>Why? A Catalyst running-config shows two blocks, <code>line vty 0 4</code> and <code>line vty 5 15</code>. Secure only 0 to 4 and lines 5 to 15 keep their old settings. A sixth simultaneous session — or an attacker who opens six on purpose — lands on line 5, where Telnet may still be allowed.</p>
${K.check({q:"An engineer secures <code>line vty 0 4</code> on a Catalyst switch and leaves the rest alone. What is the risk?", o:["None — switches only have five VTY lines","Lines 5 to 15 keep their old settings, so a sixth simultaneous session may still get in with Telnet or a weak password","The console port stops working","SSH will only allow four users"], a:1, why:"Catalyst switches have 16 VTY lines (0–15). Settings apply only to the lines you configure, so always use <code>line vty 0 15</code> on a switch."})}

<h2>Telnet vs SSH: what crosses the wire</h2>
<p>Two protocols can carry a remote command-line session to a VTY line.</p>
<p>${K.g("Telnet","An old remote-terminal protocol on TCP port 23. Everything — usernames, passwords, commands and output — crosses the network as plain readable text.")} runs on <b>TCP port 23</b>. It is very old and protects nothing: every keystroke and every line of output travels as ${K.g("cleartext","Data sent without encryption. Anyone who can capture the packets can read it directly.")}.</p>
<p>${K.g("SSH","Secure Shell: an encrypted remote-login protocol on TCP port 22. Version 2 (SSHv2) is the current standard. It encrypts the whole session and lets the client check the server's identity.")} (Secure Shell) runs on <b>TCP port 22</b>. Before any login prompt appears, the PC and the switch agree on encryption keys; from then on, username, password, commands and output are all ${K.g("encrypted","Scrambled with a key so that only the two ends of the session can turn it back into readable data.")}. SSH also lets your PC check it is talking to the real switch, not an impostor.</p>
${K.dyk(`Telnet is older than Ethernet. It was one of the first applications on ARPANET around 1969; Ethernet was invented in 1973. SSH arrived in 1995, written by Tatu Ylönen at Helsinki University of Technology after a password-sniffing attack on his university network. It was built to replace exactly the kind of Telnet logins this lesson removes.`)}
<h3>What an attacker on the path actually sees</h3>
<p>&ldquo;Cleartext&rdquo; sounds abstract, so here is what it looks like. Anyone who can see the frames — a compromised PC on the same VLAN, a laptop on a mirrored switch port, or an attacker who has poisoned ARP caches the way you saw in lesson 4 — can open a free tool like Wireshark and choose <i>Follow TCP Stream</i>. For a Telnet login to a switch, this is roughly what appears (illustrative capture):</p>
${K.out(`Follow TCP Stream (tcp.stream eq 4)   192.168.10.50:51544 -> 192.168.10.2:23

User Access Verification

Username: nneettaaddmmiinn
Password: Cisco123
BR-SW1>eenn
Password: En4ble!Br1
BR-SW1#sshh  rruunn
Building configuration...
hostname BR-SW1
enable secret 9 $9$Wq2kZr...
username netadmin password 0 Cisco123
interface Vlan1
 ip address 192.168.10.2 255.255.255.0
...`, "An illustrative Wireshark 'Follow TCP Stream' of a Telnet session. Nothing is hidden.")}
<p>Read it line by line:</p>
<ul>
<li><b>tcp.stream … :23</b> — the session went to TCP port 23, Telnet.</li>
<li><b>nneettaaddmmiinn</b> — every letter twice: the key you pressed, then the switch echoing it back to your screen.</li>
<li><b>Password: Cisco123</b> — once only, because the switch doesn't echo passwords. Still readable on the wire.</li>
<li><b>En4ble!Br1</b> — the enable secret, the key to privileged mode, in the clear.</li>
<li><b>show run output</b> — the whole configuration, including a user stored with <code>password 0</code>. The attacker has a map of the switch and a second login.</li>
</ul>
<p>Over SSH the same session is a wall of random-looking bytes: the capture shows only that someone connected to TCP 22.</p>
${K.svg("0 0 720 352",
  K.txt(20,22,"TELNET · TCP 23",{c:"bad",b:true,s:12})+
  K.dev("pc",60,80,"ADMIN-PC","")+K.dev("switch",655,80,"BR-SW1","")+K.link(85,80,629,80)+
  K.band(150,46,420,24,"Username: netadmin   Password: Cisco123   show run","var(--chip)")+
  K.dev("laptop",360,135,"anyone on the path","reads every word")+`<line x1="360" y1="118" x2="360" y2="83" stroke="var(--bad)" stroke-width="1.5" stroke-dasharray="4 3"/>`+
  K.txt(20,198,"SSH v2 · TCP 22",{c:"ok",b:true,s:12})+
  K.dev("pc",60,250,"ADMIN-PC","")+K.dev("switch",655,250,"BR-SW1","")+K.link(85,250,629,250)+
  K.band(150,216,420,24,"7f 1c e9 a4 33 0b 9d 52 c8 e1 06 af 4d …  (encrypted)","var(--chip)")+
  K.dev("laptop",360,295,"anyone on the path","sees only noise")+`<line x1="360" y1="278" x2="360" y2="253" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/>`,
  "The same login, two protocols. Telnet hands the eavesdropper your credentials; SSH hands them random bytes.")}
<h3>SSH version 1 vs version 2</h3>
<p>SSH itself has two versions. <b>SSHv1</b> has known design weaknesses and should never be used. <b>SSHv2</b> is the current standard. When you first turn SSH on, a Cisco switch reports <i>version 1.99</i>, which means &ldquo;I will accept version 1 or version 2&rdquo;. You fix that with <code>ip ssh version 2</code>, so old, weak version 1 connections are refused.</p>
${K.myth([
  ["Telnet is fine inside our own LAN — only the internet is dangerous.", "Most credential theft starts inside: an infected PC, a visitor plugged into a spare wall socket, a contractor's laptop, or an ARP-spoofing attacker on the same VLAN. Anything on the path can read Telnet."],
  ["<code>service password-encryption</code> makes Telnet safe.", "It only hides passwords when someone views the config file, using weak, reversible type 7 encoding. On the wire, Telnet still sends exactly what you type."],
  ["If SSH fails, the switch must be down.", "&ldquo;Connection refused&rdquo; proves the switch is up and reachable; it just isn't accepting SSH. Each failure message points somewhere different."],
  ["Typing <code>transport input ssh</code> will drop my current Telnet session.", "Existing sessions carry on; the setting applies to new connections. That is exactly why you must open and test a new SSH session before you log out of the old one."],
])}
${K.q({type:"match", q:"Match each item with the right fact.", pairs:[["Telnet","TCP 23, everything in cleartext"],["SSH","TCP 22, the whole session encrypted"],["SSH version 1.99 on a switch","Accepts both version 1 and version 2 clients"],["ip ssh version 2","Refuses the weak version 1"],["VTY lines on a Catalyst switch","Sixteen, numbered 0 to 15"]], why:"Telnet (23) and SSH (22) are the two remote-terminal protocols; only SSH encrypts. A switch that has just generated keys reports 1.99 — it will accept either version — until you set ip ssh version 2. Remote sessions land on VTY lines, and a Catalyst switch has 16 of them."})}
${K.check({q:"An auditor captures traffic between an admin PC and a switch and can read the admin's password. Which protocol was in use?", o:["SSH version 2 on TCP 22","Telnet on TCP 23","SSH version 1.99 on TCP 22","HTTPS on TCP 443"], a:1, why:"Only Telnet sends credentials as readable text. Any SSH version encrypts the session (v1 has weaknesses, which is why you force v2, but a password is not simply readable in a capture)."})}

<h2>Configuring SSH: the prerequisites in order, and why each one exists</h2>
<p>Turning SSH on is not one command. It is a short chain, and each link depends on the one before it. If you learn <i>why</i> each link exists, you never have to memorise the order: it follows from the reasons.</p>
${K.svg("0 0 740 300",
  K.box(20,30,150,46,"hostname BR-SW1","anything but 'Switch'")+K.box(20,96,150,46,"ip domain-name","ladderlab.local")+
  K.arrow(170,53,218,76,"",false)+K.arrow(170,119,218,96,"",false)+
  K.box(220,60,170,50,"RSA key pair","BR-SW1.ladderlab.local",true)+
  K.arrow(390,85,428,85,"",true)+K.box(430,60,150,50,"SSH server on","1.99 → ip ssh version 2")+
  K.box(20,170,150,46,"username … secret …","local user database")+K.arrow(170,193,218,193,"",false)+
  K.box(220,170,170,46,"line vty 0 15","login local")+K.box(220,232,170,46,"transport input ssh","Telnet refused")+
  K.box(430,170,150,46,"Vlan1 IP + no shut","reachable on TCP 22")+
  K.box(610,120,115,60,"ssh works","from ADMIN-PC",true)+
  K.arrow(580,92,608,135,"",true)+K.arrow(390,193,428,193,"",false)+K.arrow(580,193,608,163,"",true)+K.arrow(390,255,608,172,"",true)+
  K.txt(370,290,"Every box must be in place. Miss one and the PC sees a different error.",{mid:true}),
  "The SSH dependency chain: the name and domain form the key's name, the key turns the SSH server on, the user and VTY settings decide who gets in, and the management IP makes it reachable.")}
${K.steps([
  ["Give the switch a real hostname", `<p><code>hostname BR-SW1</code>. <b>Why:</b> the RSA key is named after the switch, so IOS refuses while it is still called <code>Switch</code>: <i>% Please define a hostname other than Switch.</i></p>`],
  ["Set a domain name", `<p><code>ip domain-name ladderlab.local</code>. <b>Why:</b> the key's full name is <i>hostname.domain</i>, here <code>BR-SW1.ladderlab.local</code>. Without it: <i>% Please define a domain-name first.</i> The domain only has to be set, not exist on the internet. Newer IOS XE shows it as <code>ip domain name</code>; both forms are accepted.</p>`],
  ["Generate the RSA key pair", `<p><code>crypto key generate rsa modulus 2048</code>. <b>Why:</b> SSH uses the ${K.g("RSA key pair","A matching public and private key. The switch keeps the private key secret; SSH uses the pair to agree session keys and to prove the switch is who it claims to be.")} to set up encryption and to prove the switch's identity. The ${K.g("modulus","The size of the RSA key in bits. SSHv2 needs at least 768; use 2048 or more today.")} is the key size: SSHv2 needs <b>at least 768 bits</b>; 2048 is today's sensible minimum. Without <code>modulus</code>, IOS asks <i>How many bits in the modulus [2048]:</i>. Once the key exists, the switch logs <i>SSH 1.99 has been enabled</i>.</p>`],
  ["Force SSH version 2", `<p><code>ip ssh version 2</code>. <b>Why:</b> 1.99 still accepts the broken version 1. This only works <i>after</i> the key exists; before that IOS replies <i>Please create RSA keys to enable SSH…</i></p>`],
  ["Create a local user", `<p><code>username netadmin secret Br4nch!SSH</code>. <b>Why:</b> SSH logs you in with a <b>username and password</b>, and the switch checks them against its ${K.g("local user database","Usernames and secrets stored in the switch's own configuration with the username command. Checked when a line uses 'login local'.")}. Use <code>secret</code> (a one-way hash: type 9 on current IOS XE, type 5 on older images), never <code>password</code> (clear text or weak type 7).</p>`],
  ["VTY lines: login local", `<p><code>line vty 0 15</code>, then <code>login local</code>. <b>Why:</b> the lines now check usernames against the local database. Plain <code>login</code> checks only a line password, and SSH logins fail. Create the user <i>first</i>: with an empty database, nobody gets in remotely.</p>`],
  ["VTY lines: transport input ssh", `<p><code>transport input ssh</code>. <b>Why:</b> this is the command that <b>switches Telnet off</b>. Depending on the IOS version the default may still accept Telnet, so never rely on it. Everything else adds SSH; this removes the insecure door.</p>`],
  ["Optional but professional", `<p><code>exec-timeout 10 0</code> logs out a session idle for 10 minutes, so an unlocked laptop doesn't hold a switch session open all night. (10 minutes is in fact the IOS default, so <code>show running-config</code> won't list it; typing it documents your intent, and many hardening baselines tighten it to <code>5 0</code>.) Never use <code>exec-timeout 0 0</code> on VTY lines. In the security module you'll add <code>access-class</code>, an access list that lets only the management subnet reach the VTY lines at all.</p>`],
])}
${K.remember(`<p>The order: <b>H</b>ow <b>D</b>o <b>K</b>eys <b>V</b>erify <b>U</b>sers? <b>L</b>ines! — <b>H</b>ostname, <b>D</b>omain, <b>K</b>ey (crypto key generate rsa), <b>V</b>ersion 2, <b>U</b>sername … secret, <b>L</b>ine vty 0 15 (login local + transport input ssh).</p>`)}
<p>Here is the whole thing typed on a console, including the two errors you get if you jump straight to the key:</p>
${K.out(`Switch>enable
Switch#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)#crypto key generate rsa
% Please define a hostname other than Switch.
Switch(config)#hostname BR-SW1
BR-SW1(config)#crypto key generate rsa
% Please define a domain-name first.
BR-SW1(config)#ip domain-name ladderlab.local
BR-SW1(config)#crypto key generate rsa modulus 2048
The name for the keys will be: BR-SW1.ladderlab.local
% The key modulus size is 2048 bits
% Generating 2048 bit RSA keys, keys will be non-exportable...
[OK] (elapsed time was 1 seconds)
%SSH-5-ENABLED: SSH 1.99 has been enabled
BR-SW1(config)#ip ssh version 2
BR-SW1(config)#username netadmin secret Br4nch!SSH
BR-SW1(config)#line vty 0 15
BR-SW1(config-line)#login local
BR-SW1(config-line)#transport input ssh
BR-SW1(config-line)#exec-timeout 10 0
BR-SW1(config-line)#end
BR-SW1#copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]`, "SSH from scratch on a console. The two refusals at the top are the prerequisites announcing themselves.")}
<ul>
<li><b>The name for the keys will be: BR-SW1.ladderlab.local</b> — hostname plus domain: why steps 1 and 2 exist.</li>
<li><b>keys will be non-exportable</b> — the private key never leaves the switch, so nobody can copy it off to impersonate it.</li>
<li><b>SSH 1.99 has been enabled</b> — the SSH server starts by itself once a key exists, in &ldquo;v1 or v2&rdquo; mode until you fix it.</li>
</ul>
${K.when([
  ["<code>login local</code>", "Any switch you reach over SSH without a central login server", "Each admin has their own name and secret; logs show who did what", "A working AAA server (RADIUS/TACACS+) exists — use it, with local users as fallback"],
  ["<code>login</code> + line <code>password</code>", "A lab, or a console in a locked cabinet", "Quick; no user database", "Anything reachable over the network: one shared password, no names, and SSH fails"],
  ["<code>no login</code>", "Never on VTY lines", "—", "Always: anyone who reaches the IP gets a prompt"],
], "How should the VTY lines check who you are?")}
${K.exam(`&ldquo;Which commands are required to enable SSH?&rdquo; has several right answers: a non-default <b>hostname</b>, <b>ip domain-name</b>, <b>crypto key generate rsa</b>, a <b>username</b>, and VTY lines with <b>login local</b> (plus <b>transport input ssh</b> for SSH only). Traps: <code>enable password</code>, <code>service password-encryption</code> and <code>ip default-gateway</code> are good practice, not SSH prerequisites. Remember <b>768</b>: the minimum modulus for SSHv2.`)}
${K.mistake(`Typing <code>username netadmin password Cisco123</code> instead of <code>secret</code>. The password is stored in clear (or reversible type 7), so anyone who sees a config backup has a working login.`)}
<h3>Try it yourself: feel every prerequisite</h3>
<p>This switch is straight out of the box. Do the steps <i>out of order on purpose</i> first, to see the refusals yourself, then fix them one by one.</p>
${K.hint(`Start with <code>enable</code> and <code>configure terminal</code>. The third <code>crypto key generate rsa</code> will ask for the modulus: type <code>2048</code>. The VTY commands go under <code>line vty 0 15</code>.`)}
${K.term({env:"ios2", title:"SSH prerequisites, the hard way", opts:{kind:"switch", host:"Switch", motd:"Switch — console session on a factory-default Catalyst. You are at user EXEC (>)."},
  intro:"Each refusal is IOS telling you which prerequisite is missing. Read it, fix it, try again.",
  tasks:[
    {text:"In global config, type <code>crypto key generate rsa</code> before anything else and read why it refuses", done:e=>e.history.some(h=>/^\s*cry\w*\s+k/i.test(h))},
    {text:"Give the switch a real name, for example <code>hostname BR-SW1</code>", done:e=>e.host!=="Switch"},
    {text:"Try the key again, read the new refusal, then set <code>ip domain-name ladderlab.local</code>", done:e=>!!e.domain},
    {text:"Generate the key: <code>crypto key generate rsa</code>, and answer <code>2048</code> at the modulus question", done:e=>e.rsa>=2048},
    {text:"Force version 2: <code>ip ssh version 2</code>", done:e=>e.sshVer==="2"},
    {text:"Create a local user with a hashed secret: <code>username netadmin secret Br4nch!SSH</code>", done:e=>!!(e.users.netadmin && e.users.netadmin.secret)},
    {text:"Under <code>line vty 0 15</code>: <code>login local</code> and <code>transport input ssh</code>", done:e=>e.lines.vty.loginLocal && e.lines.vty.transport==="ssh"},
    {text:"Verify with <code>do show ip ssh</code> — it should say <i>SSH Enabled - version 2.0</i>", done:e=>{ const h=e.history; let v=-1, s=-1; h.forEach((x,i)=>{ if(/^\s*ip\s+ssh\s+v/i.test(x)) v=i; if(/^\s*(do\s+)?sh\w*\s+ip\s+ssh/i.test(x)) s=i; }); return e.sshVer==="2" && v>-1 && s>v; }},
  ],
  win:"You met both refusals, satisfied every prerequisite in order, and proved SSH version 2 is running. That chain is now yours: hostname, domain, key, version, user, lines.",
  solve:["enable","configure terminal","crypto key generate rsa","hostname BR-SW1","crypto key generate rsa","ip domain-name ladderlab.local","crypto key generate rsa","2048","ip ssh version 2","username netadmin secret Br4nch!SSH","line vty 0 15","login local","transport input ssh","do show ip ssh"]})}
${K.check({q:"On a new switch named BR-SW1 you type <code>crypto key generate rsa</code> and IOS replies <i>% Please define a domain-name first.</i> What do you do next?", o:["Change the hostname back to Switch","Configure <code>ip domain-name</code>, then generate the key again","Type <code>ip ssh version 2</code> first","Create a username first"], a:1, why:"The key is named hostname.domain. The hostname is already set; the domain is missing. Set <code>ip domain-name</code> and run the key command again."})}

<h2>Verify, connect, and read the failures</h2>
<p>A configuration you haven't verified is a guess. Three show commands tell you the truth, and the PC's error message tells you the rest.</p>
<h3>show ip ssh</h3>
${K.out(`BR-SW1#show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3`, "show ip ssh (trimmed) on a correctly configured switch.")}
<ul>
<li><b>SSH Enabled - version 2.0</b> — a key exists and only v2 is accepted. If it says <b>1.99</b>, you forgot <code>ip ssh version 2</code>.</li>
<li><b>Authentication timeout: 120 secs</b> — someone who connects has two minutes to finish logging in.</li>
<li><b>Authentication retries: 3</b> — three wrong passwords and the connection is closed.</li>
</ul>
<p>On a switch with no key, the same command says <i>SSH Disabled - version 1.99</i> and <i>%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).</i> That one line diagnoses half of all &ldquo;SSH doesn't work&rdquo; tickets.</p>
<h3>show users</h3>
${K.out(`BR-SW1#show users
    Line       User       Host(s)              Idle       Location
*  0 con 0                idle                 00:00:00
   1 vty 0     netadmin   idle                 00:00:41 192.168.10.50`, "show users: who is on the switch right now, and on which line.")}
<ul>
<li><b>*</b> marks <i>your own</i> session — here, the console.</li>
<li><b>vty 0 netadmin … 192.168.10.50</b> — someone logged in as netadmin from 192.168.10.50 is on the first VTY line. Before you change remote access, this tells you whether a colleague is also logged in.</li>
</ul>
<h3>show running-config (the relevant parts)</h3>
${K.out(`hostname BR-SW1
!
username netadmin secret 9 $9$mQ3xT1bL0aZp9E$Kd8...
ip domain name ladderlab.local
ip ssh version 2
!
interface Vlan1
 ip address 192.168.10.2 255.255.255.0
!
line con 0
line vty 0 4
 login local
 transport input ssh
line vty 5 15
 login local
 transport input ssh`, "show running-config excerpt on a Catalyst switch after typing the settings once under line vty 0 15.")}
<ul>
<li><b>secret 9</b> — hashed; nobody can read it back from the config.</li>
<li><b>line vty 0 4 and line vty 5 15</b> — IOS splits the range; both blocks carry your settings because you typed <code>0 15</code>.</li>
<li><b>No exec-timeout line</b> — 10 minutes is the default, and IOS hides default values in the running-config. Set <code>5 0</code> and it appears. (The lab simulator lists it anyway.)</li>
<li><b>No RSA key in sight</b> — keys are not in the running-config. <code>show ip ssh</code> proves one exists.</li>
</ul>
<h3>Connecting from a PC</h3>
<p>Windows 10 and 11 include an SSH client: open Command Prompt and type either form, which mean the same thing:</p>
<ul>
<li><code>ssh -l netadmin 192.168.10.2</code> — <code>-l</code> is &ldquo;login name&rdquo;. This is also the syntax on Cisco IOS itself, if you SSH from one switch to another.</li>
<li><code>ssh netadmin@192.168.10.2</code> — the <i>user@host</i> form used on Linux and macOS too.</li>
</ul>
${K.out(`C:\\Users\\ADMIN-PC>ssh -l netadmin 192.168.10.2
The authenticity of host '192.168.10.2 (192.168.10.2)' can't be established.
RSA key fingerprint is SHA256:Qm8r2c1xYbS0f7tHnV3kLw9pEaZ4uJ6dR5gT1oNcX2s.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.10.2' (RSA) to the list of known hosts.
netadmin@192.168.10.2's password:
BR-SW1>enable
Password:
BR-SW1#`, "A first SSH login from Windows. Passwords are not echoed. (The fingerprint shown is illustrative.)")}
<ul>
<li><b>The authenticity of host … can't be established</b> — your PC has never seen this switch's public key. The <b>fingerprint</b> summarises the RSA key you generated; answer <i>yes</i> and the PC remembers it.</li>
<li>If that fingerprint later changes without a reason (new keys, replaced switch), stop: something may be impersonating the switch. Telnet can never give you this check.</li>
<li><b>BR-SW1&gt;</b> — user EXEC, as on the console. <code>enable</code> asks for the enable secret. With <i>no</i> enable password or secret at all, IOS refuses <code>enable</code> on a VTY line: <i>% No password set</i>.</li>
</ul>
<h3>What each failure means</h3>
<p>When SSH fails, the PC's message is a diagnosis. Learn these three.</p>
<div class="tablewrap"><table>
<tr><th>The PC says</th><th>What it means</th><th>Check on the console</th></tr>
<tr><td><code>ssh: connect to host 192.168.10.2 port 22: Connection timed out</code></td><td>Nothing answered: an <b>IP path</b> problem.</td><td>Is <code>interface vlan 1</code> up with the right IP? Same subnet, or <code>ip default-gateway</code> for a remote PC? Does ping work?</td></tr>
<tr><td><code>ssh: connect to host 192.168.10.2 port 22: Connection refused</code></td><td>The switch answered — with &ldquo;no&rdquo;. Nothing accepts SSH on port 22.</td><td><code>show ip ssh</code>: no RSA key? Under <code>line vty</code>: <code>transport input telnet</code> or <code>none</code>?</td></tr>
<tr><td><code>netadmin@192.168.10.2: Permission denied (password).</code></td><td>SSH works; the login doesn't.</td><td>Wrong username or secret? Does the user exist? Do the VTY lines say <code>login local</code>?</td></tr>
</table></div>
${K.remember(`<b>Timed out</b> = you can't reach the building. <b>Refused</b> = you reached it, but the door isn't there. <b>Denied</b> = the door is there, your key is wrong.`)}
${K.mistake(`Treating every SSH failure as &ldquo;the switch is down&rdquo; and asking someone on site to power-cycle it. &ldquo;Refused&rdquo; and &ldquo;denied&rdquo; both prove the switch is up and answering. A reboot fixes neither, and drops every user in the branch.`)}
<h3>Exercise: why does this switch refuse SSH?</h3>
<p>A colleague says &ldquo;SSH to PHC-SW1 gives connection refused, but I can ping it.&rdquo; You open the console and see:</p>
${K.out(`PHC-SW1#show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3
PHC-SW1#show running-config
...
username netadmin secret 9 $9$Lp0...
ip domain name ladderlab.local
ip ssh version 2
...
line vty 0 4
 login local
 transport input telnet
line vty 5 15
 login local
 transport input telnet`)}
${K.hint(`The key exists (SSH is enabled, version 2.0) and the user exists. &ldquo;Refused&rdquo; means nothing is accepting the protocol on port 22. Which line decides which protocols the VTY lines accept?`)}
${K.reveal("Show the answer", `<p><b>Cause:</b> <code>transport input telnet</code> on every VTY line. The SSH server is running, but the lines accept only Telnet, so the switch refuses port 22 connections.</p><p><b>Fix:</b> <code>line vty 0 15</code> → <code>transport input ssh</code>. Then test a new SSH session from the PC before you close the console, and save. As a bonus, Telnet is now closed — the auditor's finding fixed too.</p>`)}
<h3>Hands-on: from unboxed switch to SSH prompt</h3>
<p>Now the whole job by hand: a factory-default switch (no name, no IP, no users), an admin PC already addressed 192.168.10.50/24, and a console laptop. Console in, give the switch a management address, build the SSH chain, then log in from the PC as head office would.</p>
${K.bench({id:"m2-ssh-build", points:90, from:"CCNA · Module 2 · lesson 6", title:"SSH into a brand-new branch switch", viewBox:"0 0 760 360",
  intro:"Tray → <b>Console</b> → laptop <b>USB</b> → switch <b>CON</b>, then open the console session. Patch ADMIN-PC with <b>Cat6</b>. Configure on the console; test from <b>ADMIN-PC → Command Prompt</b> (<code>ping</code>, then <code>ssh -l netadmin 192.168.10.2</code>).",
  devices:[
    {id:"sw", kind:"switch", label:"BRANCH-SW", host:"Switch", model:"Catalyst 9200 · factory default", x:250, y:24, fresh:true},
    {id:"admin", kind:"pc", label:"ADMIN-PC", x:90, y:220, ip:"192.168.10.50", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"lap", kind:"laptop", label:"CONSOLE-LAPTOP", x:520, y:220},
  ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console in: console cable from the laptop's USB to the switch's CON port, then open the session at 9600 8N1, no flow control", done:B=>Bench.consoleOk(B,"sw")},
    {text:"Patch <b>ADMIN-PC</b> into a switch port — its light goes green", done:B=>Bench.upAt(B,"admin:eth")},
    {text:"Management address: <code>interface vlan 1</code> → <code>ip address 192.168.10.2 255.255.255.0</code> → <code>no shutdown</code>. Prove it from ADMIN-PC with <code>ping 192.168.10.2</code>", done:B=>{ const v=B.devs.sw.env.intfs.Vlan1; return v.ip==="192.168.10.2" && !v.shut && Bench.pinged(B,"admin","192.168.10.2"); }},
    {text:"Name it (<code>hostname BR-SW1</code> — anything but Switch) and set <code>ip domain-name ladderlab.local</code>", done:B=>B.devs.sw.env.host!=="Switch" && !!B.devs.sw.env.domain},
    {text:"Generate a 2048-bit RSA key pair, then force <code>ip ssh version 2</code>", done:B=>B.devs.sw.env.rsa>=2048 && B.devs.sw.env.sshVer==="2"},
    {text:"Set an <code>enable secret</code> and create <code>username netadmin secret …</code> (secret, not password)", done:B=>{ const e=B.devs.sw.env; return !!(e.enableSecret && e.users.netadmin && e.users.netadmin.secret); }},
    {text:"<code>line vty 0 15</code>: <code>login local</code> and <code>transport input ssh</code>", done:B=>B.devs.sw.env.lines.vty.loginLocal && B.devs.sw.env.lines.vty.transport==="ssh"},
    {text:"From ADMIN-PC: <code>ssh -l netadmin 192.168.10.2</code>, enter netadmin's secret, and land at the switch's <code>&gt;</code> prompt", done:B=>{ const s=Bench.session(B,"admin"); return !!(s && s.proto==="ssh" && s.host==="192.168.10.2"); }},
    {text:"Inside the SSH session: <code>enable</code> (the enable secret), then <code>copy running-config startup-config</code>", done:B=>{ const s=Bench.session(B,"admin"); return !!(s && s.proto==="ssh" && B.devs.sw.env.mode==="priv" && B.devs.sw.env.savedOnce); }},
  ],
  win:"You took a factory-default switch to a working, encrypted, per-user remote login — and saved it from inside the SSH session, exactly as you would from head office. Telnet was never even possible on this switch.",
  solve:[["plug","console","lap:usb","sw:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["plug","cat6","admin:eth","sw:g1"],
    ["term","enable"],["term","configure terminal"],["term","hostname BR-SW1"],
    ["term","interface vlan 1"],["term","ip address 192.168.10.2 255.255.255.0"],["term","no shutdown"],["term","exit"],["term","ip default-gateway 192.168.10.1"],
    ["term","ip domain-name ladderlab.local"],["term","crypto key generate rsa modulus 2048"],["term","ip ssh version 2"],
    ["term","enable secret En4ble!Br1"],["term","username netadmin secret Br4nch!SSH"],
    ["term","line vty 0 15"],["term","login local"],["term","transport input ssh"],["term","exec-timeout 10 0"],["term","end"],
    ["pc","admin","ping 192.168.10.2"],["pc","admin","ssh -l netadmin 192.168.10.2"],["pc","admin","Br4nch!SSH"],
    ["pc","admin","enable"],["pc","admin","En4ble!Br1"],["pc","admin","copy running-config startup-config"],["pc","admin",""]]})}
${K.hint(`Break it on purpose before you finish. Try <code>ssh</code> from the PC <i>before</i> generating the key (refused), with the wrong secret (permission denied), and with Vlan1 shut down (timed out). Each message points to a different step — that is the skill you'll use on real tickets.`)}
${K.q({type:"order", q:"Put the SSH set-up steps in the order IOS needs them on a factory-default switch.", items:["hostname BR-SW1","ip domain-name ladderlab.local","crypto key generate rsa modulus 2048","ip ssh version 2","username netadmin secret Br4nch!SSH","line vty 0 15, then login local and transport input ssh"], why:"The key is named hostname.domain, so both must exist before crypto key generate rsa. ip ssh version 2 is refused until a key exists. The user must exist before login local, or nobody can log in remotely. The VTY settings come last and decide who gets in and which protocol is allowed."})}
${K.check({q:"From a PC on the same subnet, <code>ping 192.168.10.2</code> works, but <code>ssh -l netadmin 192.168.10.2</code> says <i>Permission denied (password)</i>, even with the right secret. What is the most likely cause?", o:["No RSA key on the switch","Vlan1 is shut down","The VTY lines use <code>login</code> (line password) instead of <code>login local</code>","The PC has no default gateway"], a:2, why:"Permission denied means SSH connected (so the key and transport are fine) but the login failed. With the right secret, the usual cause is that the VTY lines aren't checking the local user database: they need <code>login local</code>."})}

<h2>Moving a live switch from Telnet to SSH without locking yourself out</h2>
<p>The real job is changing remote access on a switch that is <b>in service and far away</b>, often while connected by the very protocol you are removing. One wrong order and your session drops with nothing to replace it.</p>
<p>The rule: <b>add the new way in, prove it works, then remove the old way</b> — and keep an independent way back in throughout: the console (someone on site, or a ${K.g("console server","A device in the comms room with many serial ports cabled to the consoles of other devices. You reach it over a separate network, then hop onto any device's console remotely.")}).</p>
${K.job("Auditor flags Telnet on branch switches",`
<p><b>The ticket.</b> &ldquo;Security audit finding SEC-114: Telnet (TCP 23) open on management IP of branch switches, including IKJ-BR-SW2 (10.20.0.2). Credentials in clear text. Remediate within 14 days.&rdquo;</p>
<p><b>Questions first.</b> Is anyone on site at Ikeja tomorrow? (<i>Yes, Bola, the branch IT officer, from 8 a.m.</i>) Is there a console cable and laptop in the branch? (<i>Yes.</i>) Change window? (<i>7:30–8:30 a.m., before the banking hall opens.</i>) You work from Lagos, with Bola holding the console as a safety net.</p>
<p><b>Checks.</b> You Telnet in once more to confirm the finding — the last time anyone will.</p>
<ul>
<li><code>show ip ssh</code> → <i>SSH Disabled - version 1.99</i>: no key exists.</li>
<li><code>show running-config | section line vty</code> → both VTY blocks have <code>password 7 …</code>, <code>login</code> and <code>transport input telnet</code>: one shared password, no usernames, Telnet only.</li>
<li><code>show users</code> → only your own session, so you won't knock a colleague off.</li>
<li>Hostname, <code>ip domain name</code> and a <code>username netadmin secret</code> are already there: someone started the job months ago and stopped.</li>
</ul>
<p><b>Safety net.</b> Bola connects the console laptop and reads out <code>IKJ-BR-SW2&gt;</code>. You now have a way in that doesn't depend on VTY lines.</p>
<p><b>Fix, in the safe order.</b></p>
<ol>
<li><code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>; <code>show ip ssh</code> → <i>version 2.0</i>.</li>
<li><code>line vty 0 15</code> → <code>login local</code> → <code>transport input ssh</code> → <code>exec-timeout 10 0</code>. Your Telnet session stays up.</li>
<li><b>Test before you close:</b> from a second window, <code>ssh -l netadmin 10.20.0.2</code>, log in, <code>enable</code>. Only then close Telnet.</li>
<li>Prove the old door is shut: <code>telnet 10.20.0.2</code> → <i>Connect failed</i>.</li>
<li><code>no password</code> under the VTY lines, then <code>copy running-config startup-config</code>.</li>
</ol>
<p><b>What you say.</b> To Bola: &ldquo;Done — you can disconnect the console. Thanks for standing by.&rdquo; To your manager: &ldquo;IKJ-BR-SW2 accepts SSH version 2 only, with individual logins; Telnet is refused. I'll roll the same change to the other 30 switches this week.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;SEC-114, IKJ-BR-SW2 (10.20.0.2). Found: no RSA key, VTY 0–15 login (shared line password), transport input telnet. Console safety net held on site (B. Adeyemi). Generated RSA 2048, ip ssh version 2; VTY 0–15 login local, transport input ssh, exec-timeout 10 0; removed line password. Verified: new SSH v2 session OK and enable OK before closing Telnet; Telnet now refused; show ip ssh = v2.0. Saved. 35 min, no user impact.&rdquo;</i></p>`)}
${K.tip(`No one on site? Type <code>reload in 15</code> before touching the VTY lines. If you lock yourself out, the switch reboots in 15 minutes into its saved, working config. If all is well, <code>reload cancel</code> and save — and do cancel it: an unplanned reboot in banking hours is its own incident.`)}
${K.dodont([
  "Have the console (or a console server) ready before you change VTY settings.",
  "Test a <i>new</i> SSH session before you close the Telnet one.",
  "Configure <code>line vty 0 15</code> on switches.",
  "Give each engineer their own username and <code>secret</code>.",
],[
  "Don't log out straight after typing <code>transport input ssh</code>.",
  "Don't set <code>login local</code> before a local user exists.",
  "Don't use <code>exec-timeout 0 0</code> on VTY lines.",
  "Don't share one password between everyone.",
])}
<h3>Hands-on: close the audit finding</h3>
<p>The Ikeja switch from the job, as found: Telnet with a shared line password, a user and domain already there, no key. The console laptop is cabled — open it first; it's your safety net. Make the changes on the console or inside your Telnet session.</p>
${K.bench({id:"m2-telnet-to-ssh", points:100, from:"CCNA · Module 2 · lesson 6", title:"audit finding: replace Telnet with SSH", viewBox:"0 0 760 360",
  intro:"The Telnet line password is <code>telnet123</code>, the enable secret is <code>Ikj!En4ble</code>, and netadmin's secret is <code>Ikj!SSH24</code> (all from the bank's password vault). Use <b>ADMIN-PC → Command Prompt</b> for <code>telnet</code> and <code>ssh</code>; type <code>exit</code> to leave a remote session.",
  devices:[
    {id:"sw", kind:"switch", label:"IKJ-BR-SW2", model:"Catalyst 9200 · Ikeja branch", x:250, y:24,
      config: env => { ["enable","configure terminal","hostname IKJ-BR-SW2","enable secret Ikj!En4ble","interface vlan 1","ip address 10.20.0.2 255.255.255.0","no shutdown","exit","ip default-gateway 10.20.0.1","ip domain-name ladderlab.local","username netadmin secret Ikj!SSH24","line vty 0 15","password telnet123","login","transport input telnet","end"].forEach(c=>env.exec(c)); }},
    {id:"admin", kind:"pc", label:"ADMIN-PC", x:90, y:220, ip:"10.20.0.50", mask:"255.255.255.0", gw:"10.20.0.1"},
    {id:"lap", kind:"laptop", label:"BRANCH-LAPTOP", x:520, y:220},
  ],
  cables:[ {type:"cat6", a:"admin:eth", b:"sw:g1"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Confirm the finding: from ADMIN-PC, <code>telnet 10.20.0.2</code>, log in with the line password, look around, then <code>exit</code>", done:B=>Bench.tried(B,"admin",/^\s*telnet\s/i)},
    {text:"Safety net first: open the console session on BRANCH-LAPTOP (9600 8N1, no flow control)", done:B=>Bench.consoleOk(B,"sw")},
    {text:"Try <code>ssh -l netadmin 10.20.0.2</code> from ADMIN-PC and read the failure message", done:B=>Bench.tried(B,"admin",/^\s*ssh\s/i)},
    {text:"Fix what makes SSH refuse: an RSA key of at least 2048 bits, and SSH version 2", done:B=>B.devs.sw.env.rsa>=2048 && B.devs.sw.env.sshVer==="2"},
    {text:"Make all 16 VTY lines check the local user database and accept SSH only", done:B=>B.devs.sw.env.lines.vty.loginLocal && B.devs.sw.env.lines.vty.transport==="ssh"},
    {text:"Prove the old door is shut: after the change, <code>telnet 10.20.0.2</code> from ADMIN-PC must fail", done:B=>{ const ev=B.events.map(e=>e.a.map(x=>typeof x==="string"?x:"").join(" ")); const t=ev.reduce((k,s,i)=>/tr\w*\s+in\w*\s+ssh/i.test(s)?i:k,-1); return t>-1 && B.devs.sw.env.lines.vty.transport==="ssh" && ev.some((s,i)=>i>t && /^pc admin\s+telnet\s/i.test(s)); }},
    {text:"Test before you close: open a <i>new</i> SSH session from ADMIN-PC as netadmin and reach privileged mode (<code>#</code>)", done:B=>{ const s=Bench.session(B,"admin"); return !!(s && s.proto==="ssh" && B.devs.sw.env.mode==="priv"); }},
    {text:"Tidy up and save: remove the old line password (<code>no password</code> under <code>line vty 0 15</code>) and <code>copy running-config startup-config</code>", done:B=>{ const s=B.devs.sw.env.startup; return !!(B.devs.sw.env.savedOnce && s && s.lines.vty.transport==="ssh" && !s.lines.vty.password); }},
  ],
  win:"Finding closed the professional way: safety net held, SSH v2 added and tested with a fresh session before anything was closed, Telnet proven refused, the shared password gone, and the change saved. Write the ticket note and move to the next branch.",
  solve:[["pc","admin","telnet 10.20.0.2"],["pc","admin","telnet123"],["pc","admin","exit"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],
    ["pc","admin","ssh -l netadmin 10.20.0.2"],
    ["term","enable"],["term","Ikj!En4ble"],["term","configure terminal"],["term","crypto key generate rsa modulus 2048"],["term","ip ssh version 2"],
    ["term","line vty 0 15"],["term","login local"],["term","transport input ssh"],["term","no password"],["term","exec-timeout 10 0"],["term","end"],
    ["pc","admin","telnet 10.20.0.2"],
    ["pc","admin","ssh -l netadmin 10.20.0.2"],["pc","admin","Ikj!SSH24"],["pc","admin","enable"],["pc","admin","Ikj!En4ble"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`If <code>ssh</code> says <i>Connection refused</i>, ask two questions: does a key exist (<code>show ip ssh</code>)? Do the VTY lines allow SSH (<code>transport input</code>)? If it says <i>Permission denied</i>, look for <code>login local</code>.`)}
${K.case("A Lagos MSP and the password everyone knew",`
<p>A Lagos managed service provider looked after about 40 small clients: clinics, schools, a logistics firm. Every client switch was managed by Telnet, with the same VTY password on all of them. Easy: any engineer could log in anywhere.</p>
<p>One Saturday night, three access ports on a client's switch were moved into the wrong VLAN and the CCTV recorder went offline. The logs showed a VTY login from inside the client's office — but with a shared password and no usernames, nothing about <i>who</i>. It later emerged that a contractor had captured traffic on a mirrored port months earlier; the Telnet password was sitting in the capture file.</p>
<p>The fix took three weeks: SSH version 2 only, <code>transport input ssh</code> on every VTY line, a named account per engineer, <code>exec-timeout</code>, and an access list allowing only the MSP's management subnet. When an engineer later left, one account was removed in minutes instead of changing a shared password on 40 networks.</p>
<p><b>The lesson:</b> encryption stops the password being stolen; named users tell you who did what. SSH with <code>login local</code> gives you both.</p>`)}
${K.dyk(`SSH carries more than command lines: SCP and SFTP copy files over the same encrypted protocol, which is how many teams move IOS images and config backups securely.`)}
${K.exam(`Scenario questions pair a config with a symptom: map <b>timed out</b> → IP path, <b>refused</b> → key or <code>transport input</code>, <b>denied</b> → credentials or <code>login local</code>. And a switch config showing only <code>line vty 0 4</code> is usually a question about lines 5 to 15.`)}
${K.check({q:"You are connected to a remote switch by Telnet. You have generated keys and set <code>transport input ssh</code> on all VTY lines. What should you do next?", o:["Log out of Telnet and then try SSH","Open a new SSH session from another window, confirm you can log in and enable, and only then close the Telnet session","Reload the switch so the change takes effect","Remove the local user to force SSH"], a:1, why:"Your Telnet session survives the change, but once you log out you can't get back in by Telnet. Prove the replacement works with a fresh SSH session first. Keep the console available as well."})}

<h2>Interview corner</h2>
${K.hint(`List the prerequisites in order and give the reason for each one in a few words. Finish with verification.`)}
${K.reveal("&ldquo;What do you need to configure SSH on a Cisco switch?&rdquo;",`<p>&ldquo;A reachable management IP — an SVI, plus <code>ip default-gateway</code> if I manage it from another subnet. Then a non-default hostname and <code>ip domain-name</code>, because the RSA key is named hostname-dot-domain. <code>crypto key generate rsa</code> with at least 2048 bits — v2 needs 768 minimum — and <code>ip ssh version 2</code>. A local user with <code>username … secret</code>. On <code>line vty 0 15</code>, <code>login local</code> and <code>transport input ssh</code> so Telnet is refused. I'd add <code>exec-timeout</code> and an <code>access-class</code>. Then I verify with <code>show ip ssh</code> showing version 2.0 and a real login from a PC, and save.&rdquo;</p>`)}
${K.hint(`Say what Telnet sends and how, who can see it, and what SSH adds besides encryption.`)}
${K.reveal("&ldquo;Why is Telnet insecure — and is it ever acceptable?&rdquo;",`<p>&ldquo;Telnet on TCP 23 sends everything in clear text: username, password, the enable secret, every command and all the output, including the config. Anyone who can capture the traffic — an infected PC, a mirrored port, an ARP spoofer on the VLAN — can read it in Wireshark. It also can't prove you're talking to the real device. SSH encrypts the session, and the host key lets the client spot an impostor. I'd allow Telnet only in an isolated lab; in production, <code>transport input ssh</code> on all VTY lines and a test that Telnet is refused.&rdquo;</p>`)}
${K.hint(`Use the three failure messages as your structure: what each proves, and what you check next.`)}
${K.reveal("&ldquo;You SSH to a switch and it fails. How do you troubleshoot?&rdquo;",`<p>&ldquo;I read the exact error first. <b>Timed out</b> means nothing answered — an IP path problem — so I ping it and check the SVI and the default gateway. <b>Refused</b> means the switch is up but not accepting SSH, so on the console I check <code>show ip ssh</code> for a key and <code>transport input</code> on the VTY lines. <b>Permission denied</b> means SSH works but the login doesn't: wrong credentials, or <code>login</code> instead of <code>login local</code>. And I check all VTY lines, 0 to 15, match.&rdquo;</p>`)}

${K.recap([
  "Console doesn't scale: in-band management over SSH lets one engineer reach every switch, and the console stays as the out-of-band safety net.",
  "Remote sessions land on VTY lines. A Catalyst switch has 16 (0–15); configure <code>line vty 0 15</code> so no line keeps old settings.",
  "Telnet (TCP 23) sends usernames, passwords and config in clear text. SSH (TCP 22) encrypts everything; use version 2 only.",
  "SSH chain: hostname → ip domain-name → crypto key generate rsa (2048; 768+ for v2) → ip ssh version 2 → username … secret → VTY login local + transport input ssh.",
  "<code>transport input ssh</code> is the line that closes Telnet; <code>login local</code> makes the lines check named users.",
  "Verify with <code>show ip ssh</code> (version 2.0), <code>show users</code> and <code>show running-config</code>; connect with <code>ssh -l user ip</code> or <code>ssh user@ip</code>.",
  "Timed out = no IP path. Refused = no key or SSH not allowed on the lines. Permission denied = wrong credentials or no login local.",
  "On a live switch: keep the console, add SSH, test a new SSH session, then close Telnet and save.",
])}
${K.next(`<b>Lesson 7 — Verifying and troubleshooting a switched LAN.</b> You can now reach any switch securely. Next you'll use that access to read a whole LAN — interfaces, MAC tables, ARP and CDP — find faults in a fixed order, and then take on the Module 2 challenge: a pre-broken network to fix with real commands.`)}
`,
quiz:[
  {q:"Which statement about Telnet is TRUE?", o:["It uses TCP port 22 and encrypts the session","It uses TCP port 23 and sends usernames and passwords in clear text","It uses UDP port 23 and only encrypts the password","It needs an RSA key before it works"], a:1, lvl:1, why:"Telnet runs on TCP 23 and encrypts nothing: credentials, commands and output are all readable in a capture. SSH runs on TCP 22 and needs an RSA key."},
  {q:"How many VTY lines does a Catalyst switch have, and which command configures all of them?", o:["5 lines; line vty 0 4","16 lines; line vty 0 15","16 lines; line vty 1 16","1 line; line vty 0"], a:1, lvl:1, why:"Catalyst switches have 16 VTY lines numbered 0 to 15. Configuring line vty 0 15 applies the same settings to all of them, so no line keeps old, weaker settings."},
  {q:"On a switch already named BR-SW1, crypto key generate rsa returns '% Please define a domain-name first.' What is the correct next step?", o:["Configure ip ssh version 2","Configure ip domain-name, then generate the key again","Create a local username first","Change the hostname back to Switch"], a:1, lvl:2, why:"The RSA key is named hostname.domain. The hostname is set, so the missing piece is the domain. ip ssh version 2 is refused until a key exists, and a username is not a key prerequisite."},
  {q:"An engineer runs this command on a switch that should accept SSH. What is missing?", ex:"BR-SW1#show ip ssh\nSSH Disabled - version 1.99\n%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).", o:["A local username","An RSA key pair, generated with crypto key generate rsa","transport input ssh on the VTY lines","An IP address on interface Vlan1"], a:1, lvl:2, why:"show ip ssh reports SSH Disabled until an RSA key pair exists. The username, VTY settings and SVI matter for logging in, but this output is specifically about the missing key."},
  {q:"A PC can ping the switch at 10.20.0.2, but ssh -l netadmin 10.20.0.2 returns 'Connection refused'. Which cause fits?", o:["The PC has the wrong default gateway","The VTY lines have transport input telnet","The netadmin secret was typed wrongly","Interface Vlan1 is shut down"], a:1, lvl:2, why:"Refused means the switch was reached and actively said no to port 22. With a working ping the path is fine, so either no RSA key exists or the VTY lines don't allow SSH. A wrong secret gives Permission denied; a shut SVI or bad gateway gives Timed out."},
  {q:"An admin on a different subnet gets 'ssh: connect to host 10.30.0.2 port 22: Connection timed out'. On the console, show ip ssh says 'SSH Enabled - version 2.0' and the VTY lines have login local and transport input ssh. What should you check next?", o:["Generate a bigger RSA key","Whether the switch has ip default-gateway set and the PC can reach the switch's subnet","Whether the user has a secret instead of a password","Whether line vty 0 4 is configured"], a:1, lvl:2, why:"Timed out means nothing came back: an IP path problem. SSH itself is configured correctly. A switch managed from another subnet needs ip default-gateway so its replies can leave the local subnet."},
  {q:"An auditor reports Telnet still works on this switch, even though the engineer 'set SSH only'. Why?", ex:"line vty 0 4\n exec-timeout 5 0\n login local\n transport input ssh\nline vty 5 15\n password 7 0822455D0A16\n login\n transport input telnet", o:["transport input ssh needs a reload to take effect","Only lines 0 to 4 were changed; lines 5 to 15 still accept Telnet with the old line password","The password 7 encryption allows Telnet","exec-timeout 5 0 re-enables Telnet after 5 minutes"], a:1, lvl:3, why:"The engineer configured line vty 0 4 only. Lines 5 to 15 kept transport input telnet and a shared password, so a sixth session, or a scanner opening several sessions, lands on line 5 and gets in by Telnet. Configure line vty 0 15 and remove the old password."},
  {type:"multi", q:"Which two must be configured before crypto key generate rsa will succeed on a factory-default switch? (Choose two.)", o:["A hostname other than Switch","ip domain-name","username netadmin secret","transport input ssh","ip ssh version 2"], a:[0,1], lvl:2, why:"The key is named hostname.domain, so IOS refuses until the hostname is not the default and a domain name is set. The username and VTY transport matter for logging in, and ip ssh version 2 can only be set after the key exists."},
  {type:"multi", q:"Which two statements about transport input ssh on the VTY lines are true? (Choose two.)", o:["It makes the VTY lines refuse new Telnet connections","It does not drop an existing Telnet session, so you can test SSH before logging out","It generates the RSA key automatically","It encrypts the console port","It is only needed on routers, not switches"], a:[0,1], lvl:2, why:"transport input ssh decides which protocols new sessions may use, so Telnet is refused from then on. Sessions already connected carry on, which is what lets you test a new SSH session before closing the old one. It does not create keys and has nothing to do with the console line."},
  {type:"order", q:"You are converting a remote branch switch from Telnet to SSH. Put these steps in the safest order.", items:["Make sure the console (or an on-site person with a console cable) is available","Generate the RSA key and set ip ssh version 2","Under line vty 0 15, set login local and transport input ssh","Open a new SSH session and confirm login and enable work","Close the Telnet session and confirm Telnet is now refused","Save with copy running-config startup-config"], lvl:3, why:"Keep an independent way back in first. Add SSH before restricting the lines. Changing transport does not drop your Telnet session, so prove a fresh SSH session works before closing the old one, then confirm Telnet is shut and save the working result."},
  {type:"match", q:"Match each command with what it does.", pairs:[["ip domain-name ladderlab.local","Supplies the second half of the RSA key name"],["crypto key generate rsa modulus 2048","Creates the key pair and starts the SSH server"],["ip ssh version 2","Refuses SSH version 1 clients"],["login local","Makes the lines check the local username database"],["exec-timeout 10 0","Logs out a session after 10 minutes idle"]], lvl:1, why:"Each command is one link in the chain: the domain names the key, the key turns SSH on, version 2 removes the weak protocol, login local enables per-user logins, and exec-timeout closes forgotten sessions."},
  {type:"fill", q:"Under line vty 0 15, which two commands make the lines check local usernames and accept only SSH?", fields:[{label:"Login method", a:["login local"], ios:true},{label:"Protocol", a:["transport input ssh"], ios:true}], lvl:2, why:"login local tells the VTY lines to check usernames and secrets created with the username command; plain login checks only a line password, and SSH logins fail. transport input ssh refuses Telnet and any other protocol on new sessions."},
  {type:"fill", q:"From a Windows PC, type the command that opens an SSH session to 192.168.10.2 as the user netadmin.", a:["ssh -l netadmin 192.168.10.2","ssh netadmin@192.168.10.2"], lvl:1, why:"Windows 10 and 11 include an OpenSSH client. ssh -l user ip and ssh user@ip mean the same thing. The -l form is also the syntax on Cisco IOS when you SSH from one device to another."},
  {q:"A remote switch is configured with 'username netadmin secret …' and SSH works for netadmin. A new engineer's account is needed. Which approach is best practice?", o:["Share the netadmin secret with the new engineer","Create a second user with its own username and secret","Add a VTY line password for the new engineer","Set the VTY lines to no login for convenience"], a:1, lvl:2, why:"Named accounts mean the logs show who did what, and one person's access can be removed without changing everyone's password. Shared credentials and no login remove accountability."},
  {q:"Every engineer gets 'Permission denied (password)' when they SSH to a switch, even with correct credentials. show ip ssh says version 2.0, ping works, and the VTY lines are shown. What is the fix?", ex:"line vty 0 4\n password 7 05080F1C2243\n login\n transport input ssh\nline vty 5 15\n password 7 05080F1C2243\n login\n transport input ssh", o:["Generate a new RSA key","Under line vty 0 15, replace login with login local (and make sure a username exists)","Change transport input ssh to transport input all","Set exec-timeout 0 0"], a:1, lvl:3, why:"SSH connects (key and transport are fine), but the lines use login, which checks only the line password; SSH presents a username and password. login local makes the lines check the local database. Allowing Telnet or removing the timeout would only make security worse."},
  {q:"You must change the VTY settings on a switch 400 km away, and nobody is on site today. Which precaution best protects you from locking yourself out?", o:["Type reload in 15 before the change, and reload cancel once a new SSH session is proven","Set exec-timeout 0 0 so your session never drops","Configure line vty 0 4 only, leaving 5 to 15 as a backup","Remove the local user so the old line password still works"], a:0, lvl:3, why:"reload in 15 schedules a reboot into the saved, working configuration: if you lock yourself out, the switch comes back with its old access in 15 minutes. Once a fresh SSH session works, reload cancel stops it. Leaving lines open or removing users weakens security instead of protecting the change."},
],
cards:[
  {f:"In-band vs out-of-band management", b:"In-band: over the production network (SSH to the switch's SVI). Out-of-band: a separate path that still works when the network is broken (console, console server)."},
  {f:"What is a VTY line?", b:"A virtual terminal line: the slot a remote SSH or Telnet session lands on. Its settings decide the allowed protocols, how you log in and the idle timeout."},
  {f:"VTY lines on a Catalyst switch", b:"16, numbered 0 to 15. Always configure line vty 0 15 so lines 5 to 15 don't keep old settings."},
  {f:"Telnet vs SSH", b:"Telnet: TCP 23, everything in clear text, no server identity check. SSH: TCP 22, the whole session encrypted, host key proves the server's identity. Use SSHv2 only."},
  {f:"SSH prerequisites in order", b:"hostname (not Switch) → ip domain-name → crypto key generate rsa modulus 2048 → ip ssh version 2 → username X secret Y → line vty 0 15: login local + transport input ssh. Plus a reachable management IP."},
  {f:"Why the hostname and domain name?", b:"The RSA key is named hostname.domain. IOS refuses to generate keys while the hostname is the default or no domain is set."},
  {f:"RSA modulus for SSHv2", b:"At least 768 bits is required for version 2. Use 2048 or more today."},
  {f:"SSH 1.99", b:"The switch accepts both SSH version 1 and version 2. Fix with ip ssh version 2."},
  {f:"login vs login local", b:"login: check a line password only. login local: check usernames and secrets from the local database (required for SSH logins without AAA)."},
  {f:"What does transport input ssh do?", b:"Allows only SSH on the VTY lines, so new Telnet connections are refused. Existing sessions are not dropped."},
  {f:"SSH verification commands", b:"show ip ssh (SSH Enabled - version 2.0), show users (who is on which line, from where), show running-config (VTY, user, domain, ip ssh version)."},
  {f:"SSH failure messages", b:"Timed out: no IP path (SVI, subnet, default gateway). Refused: no RSA key or transport doesn't allow SSH. Permission denied: wrong credentials or no login local."},
  {f:"Changing remote access safely", b:"Keep the console available (or reload in N), add SSH, test a new SSH session, then close Telnet, confirm it's refused, and save."},
],
});
// ---------- Module 2 · Lesson 7 ----------
L.push({
id:"sw-verify", mins:80, level:"Beginner+ · builds on Module 2 lessons 1–6",
t:"Verifying and troubleshooting a switched LAN — and the Module 2 challenge",
html:`
${K.goals([
  "Work a &ldquo;user can't connect&rdquo; ticket in a fixed bottom-up order, and say why the order saves time.",
  "Read <code>show interfaces status</code> and <code>show interfaces</code>: spot a port that is shut, err-disabled, unplugged or duplex-mismatched.",
  "Map an unknown network with CDP and LLDP, and find a PC's switch port from its MAC address.",
  "Check the host side with <code>ipconfig /all</code>, <code>arp -a</code> and <code>ping</code>, and read each kind of ping failure.",
  "Document findings — then fix a five-fault network in the Module 2 challenge.",
])}
${K.pre(["Module 2 lessons 1–6: MACs, switch learning, duplex, ARP, switch management (SVI, default gateway) and SSH.","Module 1 lesson 3: cables, optics and Tx/Rx polarity."])}

<h2>Why this matters at work</h2>
<p>7:55 on a Monday at a managed-service provider in Lekki. The NOC queue already holds a lawyer who &ldquo;can't connect&rdquo;, a design studio whose &ldquo;NAS is crawling&rdquo;, a clinic asking which port its new label printer is on, and an alert that a switch in Ikeja has stopped answering. No diagrams. Switches you've never logged into.</p>
<p>Engineers who survive mornings like this run the same short sequence of checks on every ticket, know what &ldquo;good&rdquo; looks like at each step, and write down what they found. This lesson gives you that sequence, then a five-fault challenge.</p>

<h2>A workflow you can repeat: bottom-up, one layer at a time</h2>
<p>A user who can't reach something has dozens of possible causes. Trying them at random wastes time, and you end up changing things that were fine. The cure is a fixed order of checks where each one either proves a layer healthy or shows you the fault.</p>
<p>For a switched LAN the most reliable order is ${K.g("bottom-up troubleshooting","Start at Layer 1 and move up one layer at a time; each layer depends on those below it.")}: start with the physical link, because nothing above it works without it, and climb one step at a time.</p>
${K.svg("0 0 720 400",
  [["1 · Physical","cable · light · power","look at it · swap the cord · Status column","LED green; port not notconnect"],
   ["2 · Port state","shut? err-disabled?","show interfaces status · show ip interface brief","connected · up / up"],
   ["3 · Speed and duplex","and error counters","show interfaces Gi0/x","a-full a-1000 · CRC / late collisions not rising"],
   ["4 · VLAN","right access VLAN?","show interfaces status · show vlan brief","same VLAN as the server or gateway"],
   ["5 · MAC table","is the host seen?","show mac address-table address / interface","host MAC learned on the expected port"],
   ["6 · ARP","IP to MAC","arp -a (PC) · show ip arp (switch)","gateway or target MAC is present"],
   ["7 · IP settings","address, mask, gateway","ipconfig /all · ping gateway, then server","right subnet and gateway; replies"]]
  .map((r,i)=>{ const y = 10+i*55; return K.box(20,y,190,42,r[0],r[1],i===0)+K.txt(232,y+17,r[2],{c:"fg",s:11.5})+K.txt(232,y+34,"good: "+r[3],{c:"ok",s:10.5,f:"body"})+(i<6?K.arrow(115,y+42,115,y+55):""); }).join(""),
  "The switched-LAN troubleshooting ladder. Climb from the bottom of the stack (physical) upwards; stop at the first step that doesn't look like the 'good' line.")}
<p>Each passed step <b>removes a whole class of causes</b>. Once a port shows <code>connected a-full a-1000</code> with no errors, you stop wondering about the cable. Jump straight to IP settings and you may spend twenty minutes on a DHCP theory when the port was shut all along.</p>
${K.analogy(`<p>A mechanic with a car that won't start checks fuel, battery, spark — quick checks that each rule out a whole system — before touching the gearbox. The ladder is your fuel–battery–spark.</p>`)}
${K.remember(`<p>The seven rungs, bottom to top: <b>P</b>lease <b>S</b>top <b>D</b>ropping <b>V</b>aluable <b>M</b>angoes <b>A</b>t <b>I</b>keja — <b>P</b>hysical, port <b>S</b>tate, speed/<b>D</b>uplex, <b>V</b>LAN, <b>M</b>AC table, <b>A</b>RP, <b>I</b>P settings.</p>`)}
<p>Before you climb, ask Module 1's questions: <b>who</b> is affected, <b>what</b>, and <b>what changed</b>? One desk points at that port, cable or PC. A whole floor points at something shared, such as the floor switch's ${K.g("uplink","The link from an access switch towards the core. If it fails, everything on that switch is cut off.")}. Everyone points at the core, router or a server.</p>
${K.when([
  ["Bottom-up","One user or device can't connect at all","Each step proves a layer, cheapest first","The link is fine and only one application fails"],
  ["Top-down","The network works but one application doesn't","Starts where the symptom is (app, DNS, firewall)","Nothing works at all"],
  ["Divide and conquer","You have a quick middle test, like pinging the gateway","One test halves the problem","The middle test can't be trusted (ICMP blocked)"],
  ["Follow the path","Traffic crosses several switches","Walk hop by hop with CDP and the MAC table","A single desk problem"],
], "Which troubleshooting approach — and when")}
${K.tip(`Change <b>one thing at a time</b> and re-test. Change three and it starts working, and you won't know which fixed it.`)}
${K.check({q:"Only Funmi's PC on the second floor can't reach anything; her colleagues on the same switch are fine. Where do you start?", o:["The core switch's configuration","The router's routing table","Funmi's own switch port and cable — step 1 and 2 of the ladder","The DNS server"], a:2, why:"One user affected and neighbours fine means the shared parts are healthy. Climb the ladder on her port."})}

<h2>Is the port alive? State, speed, duplex and error counters</h2>
<p>Steps 1 to 3 happen mostly on the switch, with three commands.</p>
<h3>show interfaces status — the one-screen health check</h3>
<p>Type this first on any switch you are troubleshooting: one line per port with its description, state, VLAN, duplex and speed.</p>
${K.out(`SW-FLOOR2#show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi1/0/1   UPLINK-CORE        connected    trunk      a-full a-1000 10/100/1000BaseTX
Gi1/0/2   DESK-2.02 ACCTS    connected    20         a-full a-1000 10/100/1000BaseTX
Gi1/0/3   PRN-2F-ACCOUNTS    connected    20           full    100 10/100/1000BaseTX
Gi1/0/4   DESK-2.04 ACCTS    notconnect   20           auto   auto 10/100/1000BaseTX
Gi1/0/5   DESK-2.05 HR       err-disabled 30           auto   auto 10/100/1000BaseTX
Gi1/0/6                      disabled     1            auto   auto 10/100/1000BaseTX
Gi1/0/7   DESK-2.07 HR       connected    30         a-half  a-100 10/100/1000BaseTX`, "show interfaces status on a floor switch. Seven ports, at least four different stories.")}
<ul>
<li><b>Name</b> — the port's <code>description</code>. A blank name on a live port is a documentation fault.</li>
<li><b>Status</b> — <code>connected</code> = link up. <code>notconnect</code> = enabled but hearing nothing (no cable, broken cable, device off, wrong optic). <code>disabled</code> = <code>shutdown</code> is configured. <code>err-disabled</code> = the switch shut it itself (below).</li>
<li><b>Vlan</b> — the ${K.g("VLAN","Virtual LAN: a separate Layer 2 network (its own broadcast domain) inside a switch. Ports in different VLANs can't talk directly. Configured fully in a later module.")} of an ${K.g("access port","A switch port carrying exactly one VLAN — the normal port for a PC, printer or server.")}. <code>trunk</code> = a link carrying many VLANs, usually between switches (a later module).</li>
<li><b>Duplex</b> and <b>Speed</b> — the <b>a-</b> prefix means auto-negotiated. <code>a-full a-1000</code> is the healthy desk port. No <code>a-</code>, as in <code>full 100</code>, means hard-coded on this port.</li>
</ul>
<p>Two of these ports show a <b>duplex mismatch</b>, seen from opposite ends. Gi1/0/3 shows <code>full 100</code>: hard-coded on this switch, so the printer on auto can sense the speed but not the duplex, and falls back to half (lesson 3). Gi1/0/7 shows <code>a-half a-100</code>: this port negotiated but ended at half duplex, which on a modern network almost always means <b>the far end is hard-coded</b>.</p>
${K.exam(`<code>a-full</code> / <code>a-1000</code> = negotiated; <code>full</code> / <code>100</code> = hard-coded. A port at <code>a-half</code> means &ldquo;the other end is hard-coded&rdquo;. The fix: auto on both ends, or the same fixed values on both.`)}
<h3>err-disabled: the switch turned the port off</h3>
<p>${K.g("err-disabled","Error-disabled: the switch itself shut the port after detecting a violation, such as port security or BPDU guard. Traffic stops completely.")} is a protective state: the switch saw something it was told never to allow and shut the port. It stays down until someone intervenes. The log names the cause:</p>
${K.out(`%PM-4-ERR_DISABLE: psecure-violation error detected on Gi1/0/5, putting Gi1/0/5 in err-disable state`, "The log message when port security err-disables a port.")}
<p>Typical causes (later modules): a <b>port-security violation</b> (an unknown MAC on a locked port), <b>BPDU guard</b> (a switch plugged into a PC-only port) and <b>link flapping</b>. The recovery:</p>
${K.steps([
  ["Find out why", `<p>Read the log, or <code>show interfaces status err-disabled</code> on a real switch. Ask: &ldquo;Did anyone plug anything new in?&rdquo;</p>`],
  ["Remove the cause", `<p>Unplug the extra switch or looped cable, or the port err-disables again within seconds.</p>`],
  ["Bounce the port", `<p><code>shutdown</code>, then <code>no shutdown</code>. Automatic recovery (<code>errdisable recovery</code>) exists but is off by default.</p>`],
  ["Verify and record", `<p><code>show interfaces status</code> says <code>connected</code>; the cause goes in the ticket.</p>`],
])}
${K.mistake(`Bouncing an err-disabled port without removing the cause. It err-disables again, and you've hidden the evidence.`)}
<h3>show interfaces &lt;port&gt; — the first line and the counters</h3>
<p>Zoom in on one port with <code>show interfaces Gi1/0/3</code>. The first line has two halves: the interface state is Layer 1 (signal?) and &ldquo;line protocol&rdquo; is Layer 2 (data link working?).</p>
<div class="tablewrap"><table>
<tr><th>First line of show interfaces</th><th>show ip int brief</th><th>What it means</th><th>Where you go next</th></tr>
<tr><td>is up, line protocol is up (connected)</td><td>up / up</td><td>Layers 1 and 2 working</td><td>Check speed, duplex, counters</td></tr>
<tr><td>is down, line protocol is down (notconnect)</td><td>down / down</td><td>No signal from the far end</td><td>Physical: cable, patch, power, optics</td></tr>
<tr><td>is administratively down, line protocol is down (disabled)</td><td>administratively down / down</td><td><code>shutdown</code> configured</td><td>Find out why, then <code>no shutdown</code></td></tr>
<tr><td>is down, line protocol is down (err-disabled)</td><td>down / down</td><td>The switch shut it</td><td>Remove the cause, then shut / no shut</td></tr>
<tr><td>is up, line protocol is down</td><td>up / down</td><td>Signal, but Layer 2 failing</td><td>Rare on access ports; classic on serial WAN links</td></tr>
</table></div>
<p>Below are the <b>counters</b>, where an &ldquo;up but bad&rdquo; link gives itself away. Here is the hard-coded printer port:</p>
${K.out(`SW-FLOOR2#show interfaces Gi1/0/3
GigabitEthernet1/0/3 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 7c21.0e4a.9b03 (bia 7c21.0e4a.9b03)
  Description: PRN-2F-ACCOUNTS
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 251/255, txload 1/255, rxload 3/255
  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  [... lines trimmed ...]
     312 runts, 0 giants, 0 throttles
     3224 input errors, 2871 CRC, 41 frame, 0 overrun, 0 ignored
  [... lines trimmed ...]
     0 output errors, 0 collisions, 0 interface resets
     0 late collision, 0 deferred`, "The full-duplex side of a duplex mismatch: CRC errors and runts climbing, no collisions.")}
<ul>
<li><b>up, line protocol is up</b> — the lights look fine, which is why mismatches go unnoticed for months.</li>
<li><b>Full-duplex, 100Mb/s</b> — a gigabit port held at 100 full by its configuration.</li>
<li><b>reliability 251/255</b> — ${K.g("reliability","A five-minute average of error-free frames, out of 255. Below 255 means errors are happening now.")}: errors are happening now.</li>
<li><b>312 runts</b> — ${K.g("runts","Frames shorter than the 64-byte minimum, usually fragments left by a collision.")}: fragments of frames the half-duplex printer abandoned when it thought it heard a collision.</li>
<li><b>2871 CRC</b> — ${K.g("CRC errors","Frames whose checksum (the FCS in the trailer, lesson 1) doesn't match: damaged in transit and discarded.")}: damaged frames, discarded. <b>Input errors</b> totals every receive problem.</li>
<li><b>0 late collision</b> — a full-duplex port never listens for collisions. The half-duplex end (the printer, or Gi1/0/7 above) counts ${K.g("late collisions","Collisions detected after a frame's first 64 bytes. A correctly built network never has them; today they mean a duplex mismatch.")}.</li>
</ul>
${K.remember(`<p><b>&ldquo;Full side counts CRC, half side counts late.&rdquo;</b></p>`)}
${K.dyk(`Ethernet's 64-byte minimum frame exists so that a collision is always detected within the first 64 bytes (512 bit times). A &ldquo;late&rdquo; collision is therefore something a properly built network can't produce — today, almost always a duplex mismatch.`)}
<p>Counters are <b>cumulative</b>: 2,871 CRC errors might be from last month. Run <code>clear counters</code>, let the user work, look again. Only <b>rising</b> counters describe today's problem. (<b>Giants</b>, oversized frames, point to MTU or NIC faults.)</p>
${K.q({type:"match", q:"Match each show interfaces counter or field with what it tells you.", pairs:[["CRC","Frames arrived damaged and failed the checksum"],["runts","Frames shorter than the 64-byte minimum"],["giants","Frames bigger than the maximum frame size"],["late collision","A collision after the first 64 bytes: look for a duplex mismatch"],["reliability 255/255","No errors in the five-minute average"]], why:"CRC errors and runts appear on the full-duplex side of a mismatch (and with bad cables or interference); late collisions appear on the half-duplex side. Giants usually mean an MTU or NIC problem. Reliability is a running five-minute average out of 255."})}
<h3>Try it: read the switch, fix the switch side</h3>
<p>This practice switch isn't cabled, so enabled ports show connected with clean counters; the benches below have real errors. Gi0/7 is for practising the err-disabled recovery keystrokes.</p>
${K.hint(`<code>speed auto</code> and <code>duplex auto</code> go under <code>interface g0/3</code>. Inside configuration mode, put <code>do</code> in front of a show command to run it without leaving.`)}
${K.term({env:"ios2", title:"read port states and repair a desk port", opts:{kind:"switch", host:"SW-FLOOR2", model:"C9200L-24P-4G", motd:"SW-FLOOR2 — console session (lab switch, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","interface g0/1","description UPLINK to CORE Gi1/0/1","interface g0/2","shutdown","interface g0/3","description PRN-2F-ACCOUNTS","speed 100","duplex full","interface g0/4","shutdown","interface g0/5","description DESK-2.05 FINANCE","shutdown","interface g0/6","shutdown","interface g0/7","description CCTV-NVR","interface g0/8","shutdown","interface g0/9","shutdown","interface g0/10","shutdown","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. Read the Status, Duplex and Speed columns before you change anything.",
  tasks:[
    {text:"<code>enable</code>, then <code>show interfaces status</code> — find the hard-coded port (no <code>a-</code>), the disabled desk port and the uplink", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+st/i.test(h))},
    {text:"Gi0/3 (the printer) is hard-coded on the switch only. Put it back to <code>speed auto</code> and <code>duplex auto</code>", done:e=>e.intfs["GigabitEthernet0/3"].speed==="auto" && e.intfs["GigabitEthernet0/3"].duplex==="auto"},
    {text:"Desk 2.05 is now patched: bring Gi0/5 up", done:e=>e.intfs["GigabitEthernet0/5"].shut===false},
    {text:"Practise the err-disabled recovery on Gi0/7: under <code>interface g0/7</code>, type <code>shutdown</code> and then <code>no shutdown</code>", done:e=>{ const h=e.history; const i=h.findIndex(x=>/^\s*int\S*\s+g\S*\s*0\/7\s*$/i.test(x)); if (i<0) return false; const s=h.findIndex((x,k)=>k>i && /^\s*shut(d(o(w(n)?)?)?)?\s*$/i.test(x)); if (s<0) return false; const n=h.findIndex((x,k)=>k>s && /^\s*no\s+shut/i.test(x)); return n>-1 && e.intfs["GigabitEthernet0/7"].shut===false; }},
    {text:"Verify with <code>do show interfaces status</code> (or <code>show interfaces status</code> after <code>end</code>) — Gi0/3 now reads <code>a-full a-1000</code>", done:e=>e.history.filter(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+st/i.test(h)).length>=2 && e.intfs["GigabitEthernet0/3"].speed==="auto"},
    {text:"Save: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"You read a whole switch in one screen, removed a one-sided hard-code, enabled a patched desk and practised the exact keystrokes that recover an err-disabled port.",
  solve:["enable","show interfaces status","configure terminal","interface g0/3","speed auto","duplex auto","interface g0/5","no shutdown","interface g0/7","shutdown","no shutdown","do show interfaces status","end","copy running-config startup-config",""]})}
${K.check({q:"A port shows 'connected' and 'a-half a-100' in show interfaces status, and the user says file copies crawl. Most likely cause?", o:["The cable is unplugged","The port is err-disabled","The device on the other end has hard-coded its speed and duplex, so this auto port fell back to half duplex","The port is in the wrong VLAN"], a:2, why:"An auto port ends at half duplex when the far end is hard-coded and stops negotiating. The far end runs full: a duplex mismatch."})}

<h2>Who is plugged in where? CDP, LLDP and the MAC table</h2>
<p>Half the difficulty of a real ticket is not knowing the network. Which port is the uplink? What's on the other end of Gi0/24? Switches can tell you.</p>
<h3>CDP and LLDP: devices introducing themselves</h3>
<p>${K.g("CDP","Cisco Discovery Protocol: Cisco-proprietary, Layer 2. Each Cisco device advertises its name, model, IP address and the port the advertisement left from, every 60 seconds. On by default.")} and ${K.g("LLDP","Link Layer Discovery Protocol (IEEE 802.1AB): the vendor-neutral equivalent of CDP. Off by default on Catalyst switches — enable it with lldp run.")} do the same job. Each device regularly sends a small frame out of every port saying, in effect: &ldquo;I am CORE-SW, a C9300, my address is 10.40.1.2, and this left my port Gi1/0/3.&rdquo; Each directly connected ${K.g("neighbour","The device at the other end of one of your links. Discovery frames are never forwarded, so only direct neighbours appear.")} keeps that for the ${K.g("holdtime","How long a neighbour's advertisement is kept without a new one: 180 s for CDP, 120 s for LLDP by default.")}.</p>
<p>The advertisement names the <b>remote</b> port, so you learn both ends of every link — and it works at Layer 2, even when IP settings are wrong.</p>
${K.out(`ACC-SW3#show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
CORE-SW          Gi0/10            151        S I         C9300     Gi1/0/3
LOBBY-R1         Gi0/1             138        R I         C1111-4P  Gi0/0/1

Total cdp entries displayed : 2`, "show cdp neighbors on an access switch.")}
<ul>
<li><b>Device ID</b> — the neighbour's hostname.</li>
<li><b>Local Intrfce</b> — <i>your</i> port: Gi0/10 leads to CORE-SW, so it's the uplink.</li>
<li><b>Holdtme</b> — seconds until expiry; counts down from 180, reset every 60 s.</li>
<li><b>Capability</b>, <b>Platform</b> — R router, S switch; the model.</li>
<li><b>Port ID</b> — the <i>neighbour's</i> port (Gi1/0/3). Both ends of the cable, from your chair.</li>
</ul>
<p><code>show cdp neighbors detail</code> adds each neighbour's <b>IP address</b> and software version. The IP is the address you SSH to next.</p>
${K.out(`ACC-SW3#show cdp neighbors detail
-------------------------
Device ID: CORE-SW
Entry address(es):
  IP address: 10.40.1.2
Platform: C9300,  Capabilities: Switch  IGMP
Interface: GigabitEthernet0/10,  Port ID (outgoing port): GigabitEthernet1/0/3
Holdtime : 151 sec`, "One neighbour from show cdp neighbors detail (trimmed). Real switches also show the native VLAN and duplex.")}
${K.tip(`Two Cisco devices that disagree on duplex log <code>%CDP-4-DUPLEX_MISMATCH</code> — a fault found before any user calls.`)}
${K.dyk(`The <code>STATIC 0100.0ccc.cccc → CPU</code> entry in every MAC table this module is CDP's multicast address: the switch hands those frames to its CPU instead of flooding them — which is why CDP only sees direct neighbours.`)}
<h3>LLDP: the same idea, for every vendor</h3>
<p>CDP is Cisco-only. HPE or Juniper switches, IP phones, access points and Linux servers speak LLDP. On Catalyst switches LLDP is <b>off by default</b>: <code>lldp run</code> turns it on globally, and <code>no lldp transmit</code> / <code>no lldp receive</code> stop one direction on a port.</p>
${K.out(`ACC-SW3#show lldp neighbors
Capability codes:
    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device
    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other

Device ID           Local Intf     Hold-time  Capability      Port ID
CORE-SW             Gi0/10         120        B               Gi1/0/3

Total entries displayed: 1`, "show lldp neighbors. A switch shows as B (bridge); holdtime 120 s.")}
<p>Both ends must run it: <code>% LLDP is not enabled</code> means this switch is off; an empty table means the far end isn't sending.</p>
${K.when([
  ["CDP","Every device on the link is Cisco","On by default; rich detail (IP, version, native VLAN, duplex)","Ports facing the internet, an ISP or kit you don't control"],
  ["LLDP","Mixed vendors: phones, APs, servers","Open IEEE 802.1AB standard","Untrusted ports — it leaks the same information"],
  ["Neither","Ports facing the ISP, guests or the public","Discovery hands attackers your models, versions and IPs","Uplinks and phone ports you rely on"],
], "CDP or LLDP — and where to turn them off")}
${K.exam(`Know the defaults: <b>CDP</b> — Cisco proprietary, enabled by default, advertisements every <b>60 s</b>, holdtime <b>180 s</b>. <b>LLDP</b> — IEEE 802.1AB, disabled by default on Catalyst, every <b>30 s</b>, holdtime <b>120 s</b>. Global on/off: <code>cdp run</code> / <code>no cdp run</code>, <code>lldp run</code> / <code>no lldp run</code>. Per interface: <code>no cdp enable</code>; <code>no lldp transmit</code> and <code>no lldp receive</code>.`)}
${K.term({env:"ios2", title:"switch on LLDP, silence CDP towards the ISP", opts:{kind:"switch", host:"SW-LOBBY", model:"C9200L-24P-4G", motd:"SW-LOBBY — console session. Gi0/1 connects to the ISP's managed router (not ours). This lab switch is not cabled, so its neighbour tables are empty."},
  setup:e=>{ ["enable","configure terminal","interface g0/1","description ISP-CPE MainOne (not ours)","interface g0/2","description UPLINK to CORE Gi1/0/12","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Discovery on everywhere you trust, off where you don't.",
  tasks:[
    {text:"<code>enable</code>, then <code>show lldp neighbors</code> — read what a Catalyst says about LLDP out of the box", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+lldp\s+n/i.test(h))},
    {text:"Turn LLDP on for the whole switch with <code>lldp run</code>", done:e=>e.lldpRun===true},
    {text:"Gi0/1 faces the ISP's router. Stop CDP on that port only: <code>interface g0/1</code>, <code>no cdp enable</code>", done:e=>e.intfs["GigabitEthernet0/1"].cdp===false},
    {text:"Check <code>show running-config</code>: <code>lldp run</code> near the top, <code>no cdp enable</code> under Gi0/1", done:e=>e.lldpRun && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+run/i.test(h))},
    {text:"Save with <code>write memory</code>", done:e=>!!e.savedOnce},
  ],
  win:"LLDP is on for every vendor's kit, and the ISP's device no longer gets a free description of your switch.",
  solve:["enable","show lldp neighbors","configure terminal","lldp run","interface g0/1","no cdp enable","end","show running-config","write memory"]})}
<h3>Finding a PC by its MAC address</h3>
<p>CDP and LLDP map network devices. To find a <b>host</b>, use the MAC address table (lesson 2): ask which port learned the host's MAC, and if that port is an uplink, follow it to the next switch and ask again.</p>
${K.svg("0 0 720 345",
  K.dev("switch",360,50,"CORE-SW","10.40.1.2")+K.dev("switch",160,170,"FL1-SW","floor 1")+K.dev("switch",560,170,"FL2-SW","floor 2")+
  K.dev("pc",470,270,"RECEP-PC","")+K.dev("pc",640,270,"XRAY-PC","0050.56a1.3c2e")+K.dev("pc",90,270,"NURSE-PC","")+
  K.link(334,58,186,162)+K.link(386,58,534,162)+K.link(160,181,100,252)+K.link(560,181,478,252)+K.link(570,181,632,252)+
  K.txt(300,95,"Gi1/0/47",{end:true})+K.txt(420,95,"Gi1/0/48",{c:"accent",b:true})+K.txt(520,145,"Gi1/0/52",{end:true})+K.txt(625,225,"Gi1/0/14",{c:"accent",b:true})+K.txt(505,225,"Gi1/0/3",{end:true})+
  K.band(10,8,230,26,"① CORE: MAC is on Gi1/0/48")+K.band(480,8,230,26,"② CDP: Gi1/0/48 = FL2-SW")+K.band(530,118,180,22,"③ FL2-SW: on Gi1/0/14")+
  K.txt(360,338,"Uplink ports show every MAC behind them. Keep following until the port is NOT an uplink.",{mid:true}),
  "Hunting XRAY-PC: the core switch learned its MAC on an uplink, CDP says where that uplink goes, and the next switch shows the real access port.")}
${K.steps([
  ["Get the MAC address", `<p><code>ipconfig /all</code> shows <code>00-50-56-A1-3C-2E</code> (a printer prints it on its config page). Cisco format: groups of four, dots, lowercase — <code>0050.56a1.3c2e</code>.</p>`],
  ["Make sure the switches have seen it", `<p>Entries age out after 300 s of silence (lesson 2); a <code>ping</code> from the PC to its gateway refreshes them.</p>`],
  ["Ask the first switch", `<p>CORE-SW: <code>show mac address-table address 0050.56a1.3c2e</code> → <code>Gi1/0/48</code>. But <code>show cdp neighbors</code> lists FL2-SW on Gi1/0/48: an uplink. The PC is behind FL2-SW.</p>`],
  ["Follow the uplink", `<p>SSH to FL2-SW (IP from <code>show cdp neighbors detail</code>) and repeat → <code>Gi1/0/14</code>. No CDP neighbour there, and <code>show mac address-table interface Gi1/0/14</code> lists one MAC: the access port.</p>`],
  ["Confirm and document", `<p>Gi1/0/14 is <code>connected a-full a-1000</code>. Add <code>description XRAY-PC</code> and record switch and port in the ticket.</p>`],
])}
${K.mistake(`Stopping at the first switch. The core learns every MAC on a floor through that floor's uplink. A port with a switch as its CDP/LLDP neighbour, or many MACs, is an uplink — keep following.`)}
<h3>Hands-on: map an office you've never seen</h3>
<p>A small office: a router, two switches on a fibre uplink, three PCs, and no documentation. Map the links with CDP and LLDP, write descriptions, then find HR-PC3's port by its MAC — the way you would when the cables vanish into the ceiling. These lab switches have no enable secret.</p>
${K.bench({id:"m2-cdp-map", points:90, from:"CCNA · Module 2 · lesson 7", title:"map an office you've never seen", viewBox:"0 0 760 500",
  intro:"Console is cabled to SW-A: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. To reach SW-B, click SW-A's console port, <b>Unplug</b>, and plug a tray console cable into SW-B's CON port.",
  devices:[
    {id:"r1", kind:"router", label:"OFFICE-R1", model:"ISR 1100 · comms room", x:20, y:20, config:e=>{ ["en","conf t","hostname OFFICE-R1","lldp run","interface g0/0","description LAN","ip address 10.30.1.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"swa", kind:"switch", label:"SW-A", model:"Catalyst 9200 · comms room", x:300, y:20, sfp:{g9:"sfp-sx"}, config:e=>{ ["en","conf t","hostname SW-A","interface vlan 1","ip address 10.30.1.2 255.255.255.0","no shutdown","exit","ip default-gateway 10.30.1.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"swb", kind:"switch", label:"SW-B", model:"Catalyst 9200 · HR floor cabinet", x:300, y:250, sfp:{g9:"sfp-sx"}, config:e=>{ ["en","conf t","hostname SW-B","interface vlan 1","ip address 10.30.1.3 255.255.255.0","no shutdown","exit","ip default-gateway 10.30.1.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pc1", kind:"pc", label:"RECEPTION", x:30, y:150, ip:"10.30.1.10", mask:"255.255.255.0", gw:"10.30.1.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:170, y:150},
    {id:"pc2", kind:"pc", label:"HR-PC2", x:330, y:390, ip:"10.30.1.22", mask:"255.255.255.0", gw:"10.30.1.1"},
    {id:"pc3", kind:"pc", label:"HR-PC3", x:520, y:390, ip:"10.30.1.23", mask:"255.255.255.0", gw:"10.30.1.1"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"swa:g1"}, {type:"cat6", a:"pc1:eth", b:"swa:g2"}, {type:"mmf", a:"swa:g9", b:"swb:g9"},
           {type:"cat6", a:"pc2:eth", b:"swb:g3"}, {type:"cat6", a:"pc3:eth", b:"swb:g6"}, {type:"console", a:"lap:usb", b:"swa:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Open the console session to SW-A from YOUR LAPTOP (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control)", done:B=>Bench.consoleOk(B,"swa") || B.devs.swa.env.history.length>0},
    {text:"On SW-A: <code>enable</code>, then <code>show cdp neighbors</code> (try <code>detail</code> too). Which SW-A port leads to which neighbour?", done:B=>B.devs.swa.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+cdp\s+n/i.test(h))},
    {text:"Document it: on SW-A, give the port facing SW-B a description containing <code>SW-B</code>, and the port facing the router one containing <code>OFFICE-R1</code>", done:B=>{ const end=(x,y)=>{ const c=B.cables.find(c=>[c.a,c.b].some(r=>r.startsWith(x+":")) && [c.a,c.b].some(r=>r.startsWith(y+":"))); return c ? (c.a.startsWith(x+":")?c.a:c.b) : null; }; const desc=r=>{ const p=B.devs.swa.ports.find(p=>p.id===r.split(":")[1]); return (p && p.ios && B.devs.swa.env.intfs[p.ios].desc) || ""; }; const u=end("swa","swb"), r=end("swa","r1"); return !!(u && r && /SW-B/i.test(desc(u)) && /OFFICE-R1/i.test(desc(r))); }},
    {text:"HR want to know which port HR-PC3 is on. On HR-PC3's Command Prompt, run <code>ipconfig /all</code> (note the Physical Address) and <code>ping 10.30.1.1</code> so the switches learn its MAC", done:B=>Bench.pinged(B,"pc3","10.30.1.1")},
    {text:"On SW-A, look it up: <code>show mac address-table address xxxx.xxxx.xxxx</code> (Cisco format — dots, lowercase). Which port? What does CDP say is on the other end of it?", done:B=>B.devs.swa.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+mac\s+a\S*\s+(a|i)/i.test(h))},
    {text:"Turn on LLDP: <code>lldp run</code> on SW-A, then move the console to SW-B and do the same there. On SW-B, <code>show lldp neighbors</code> should list SW-A", done:B=>B.devs.swa.env.lldpRun && B.devs.swb.env.lldpRun && B.devs.swb.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+lldp\s+n/i.test(h))},
    {text:"On SW-B, find HR-PC3's real access port from the MAC table and label it: <code>description HR-PC3</code>", done:B=>{ const c=Bench.cableAt(B,"pc3:eth"); if (!c) return false; const f = c.a==="pc3:eth" ? c.b : c.a; if (!f.startsWith("swb:")) return false; const p=B.devs.swb.ports.find(p=>p.id===f.split(":")[1]); return !!(p && p.ios && /HR-PC3/i.test(B.devs.swb.env.intfs[p.ios].desc||"")); }},
  ],
  win:"You mapped a network you'd never seen using only what the devices told you — CDP and LLDP for the links, the MAC table for the hosts — and left descriptions so the next engineer doesn't have to repeat it.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show cdp neighbors"],["term","show cdp neighbors detail"],["term","configure terminal"],["term","interface g0/9"],["term","description UPLINK to SW-B Gi0/9"],["term","interface g0/1"],["term","description OFFICE-R1 Gi0/0"],["term","exit"],["term","lldp run"],["term","end"],
    ["pc","pc3","ipconfig /all"],["pc","pc3","ping 10.30.1.1"],["term","show mac address-table address 0050.9c50.57f5"],["term","show lldp neighbors"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","swb:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","configure terminal"],["term","lldp run"],["term","end"],["term","show lldp neighbors"],["term","show mac address-table address 0050.9c50.57f5"],["term","configure terminal"],["term","interface g0/6"],["term","description HR-PC3"],["term","end"],["term","show interfaces status"],["term","write memory"]]})}
${K.hint(`On SW-A the MAC turns up on the port CDP calls SW-B — that's the uplink, not the PC. On SW-B, run the same lookup. Also notice what <code>show lldp neighbors</code> on SW-A shows <i>before</i> you've enabled LLDP on SW-B: only the router, because LLDP needs both ends.`)}
<p>Sketch it as you go: that's the diagram nobody left you.</p>
${K.check({q:"On a core switch, show mac address-table address shows a laptop's MAC on Gi1/0/24. show cdp neighbors lists a switch called FL3-SW on Gi1/0/24. What do you do next?", o:["Label Gi1/0/24 with the laptop's name","Shut Gi1/0/24 to see if the laptop disconnects","Connect to FL3-SW and look the MAC up again there","Clear the whole MAC table on the core"], a:2, why:"Gi1/0/24 is an uplink, so every device on that floor appears there. Follow it and repeat the lookup."})}

<h2>The host side: VLAN, ARP and IP settings</h2>

<h3>Step 4: is the port in the right VLAN?</h3>
<p>VLANs get their own module later. For now: a VLAN is a separate broadcast domain inside a switch (lesson 3), and each access port belongs to one — VLAN 1 by default. A PC in the wrong VLAN has a perfect link and correct settings, but its ARP broadcasts never reach the gateway: &ldquo;the light's on but nothing works&rdquo;.</p>
<p>Check the <b>Vlan</b> column of <code>show interfaces status</code>, or <code>show vlan brief</code>, and compare with a neighbour who works. Fix with <code>switchport access vlan N</code> under the interface.</p>
${K.mistake(`Testing a VLAN problem by pinging from the switch. The switch pings from its management SVI (often VLAN 1), so it may reach the server while the user's VLAN 30 port can't. Test from the user's PC.`)}
<h3>Step 5: does the switch see the PC?</h3>
<p><code>show mac address-table interface Gi0/5</code> should list the PC's MAC in the expected VLAN. Nothing there on a connected port? The PC isn't sending — adapter disabled, or asleep.</p>
<h3>Steps 6 and 7: ARP and IP settings on the PC</h3>
<ul>
<li><code>ipconfig /all</code> — address, mask and gateway must fit the port's subnet. <code>169.254.x.x</code> = DHCP failed; <code>Media disconnected</code> = no link, back to step 1.</li>
<li><code>arp -a</code> — after pinging the gateway, its IP should appear with a MAC (lesson 4). No entry: ARP got no answer.</li>
<li><code>ping</code> — the gateway, then the server. The <i>kind</i> of failure is a clue:</li>
</ul>
<div class="tablewrap"><table>
<tr><th>What Windows ping says</th><th>What it means</th><th>Usual causes</th></tr>
<tr><td>Reply from 10.20.1.20: bytes=32 time&lt;1ms TTL=128</td><td>Request and reply worked</td><td>Nothing wrong on this path</td></tr>
<tr><td>Reply from <i>your own IP</i>: Destination host unreachable</td><td>ARP for the target or gateway got no answer</td><td>Wrong VLAN, uplink or target down, wrong IP/mask</td></tr>
<tr><td>Request timed out</td><td>The request left; no reply came back</td><td>Far end can't route back (missing gateway), firewall</td></tr>
<tr><td>PING: transmit failed. General failure.</td><td>The PC couldn't send at all</td><td>No link, no IP, adapter disabled</td></tr>
</table></div>
<p>The switch is a host too, on its management ${K.g("SVI","Switch Virtual Interface: the switch's own interface in a VLAN (e.g. interface vlan 1), holding its management IP (lesson 5).")}: <code>show ip interface brief</code> should show <code>Vlan1</code> <code>up / up</code> with the right IP. To answer anyone on another subnet — a NOC behind a router — it also needs <code>ip default-gateway</code>. Without it, the switch hears the SSH request but can't reply, and the NOC sees <code>Connection timed out</code>.</p>
${K.q({type:"order", q:"A user's PC can't reach the file server. Put these checks in bottom-up ladder order.", items:["Check the cable and the port light at the desk","Check show interfaces status for connected, disabled or err-disabled","Check speed, duplex and error counters with show interfaces","Compare the port's VLAN with a working neighbour's","Look for the PC's MAC with show mac address-table interface","Check arp -a on the PC after pinging the gateway","Check ipconfig /all and ping the gateway, then the server"], why:"Physical first, because nothing works without a link; then whether the port is shut; then the link's quality; then the broadcast domain; then whether the switch sees the PC; then ARP; and finally IP settings. Each passed step removes a whole set of causes."})}
${K.check({q:"Sade's link is connected a-full a-1000 and her IP settings match her neighbours', but pinging the server gives 'Reply from 10.50.2.31: Destination host unreachable'. Her neighbours reach the server fine. What do you check next?", o:["Replace the patch cord","Her switch port's VLAN compared with her neighbours'","The server's DNS record","Reload the switch"], a:1, why:"Unreachable from her own IP means ARP got no reply. With link, settings and neighbours fine, her port is most likely in another VLAN."})}

<h2>Writing it down: documenting what you found</h2>
<p>A fix that lives only in your head is half a fix. Leave the next engineer:</p>
<ul>
<li><b>Port descriptions</b> on every live port; uplinks name the far device and port (<code>UPLINK to CORE Gi1/0/3</code>).</li>
<li><b>A topology diagram</b> from CDP and LLDP, with port names at both ends of each link.</li>
<li><b>A ${K.g("baseline","A saved record of what healthy looks like — port speeds, counters, neighbours — to compare against when something breaks.")}</b>: <code>show interfaces status</code>, <code>show cdp neighbors</code> and <code>show running-config</code> saved while healthy, so &ldquo;what's different?&rdquo; has an instant answer.</li>
<li><b>The ticket note</b>: symptom, cause, fix, proof — now with real command output.</li>
</ul>
${K.job("A multi-ticket morning at an MSP NOC",`
<p>Your ${K.g("MSP","Managed Service Provider: runs other organisations' networks for a fee, from a Network Operations Centre (NOC).")} looks after forty small businesses; you can SSH to all their switches.</p>
<h3>Ticket 4411 · 08:02 · Law firm, Victoria Island — &ldquo;Barrister Okafor can't connect&rdquo;</h3>
<p><b>Questions.</b> &ldquo;Anyone else affected?&rdquo; — <i>&ldquo;No.&rdquo;</i> &ldquo;Anything change at his desk?&rdquo; — <i>&ldquo;His son set up a little box so he can plug in two laptops.&rdquo;</i></p>
<p><b>Checks.</b> <code>show interfaces status</code>: Gi1/0/14 <code>DESK-1.14 OKAFOR</code> is <code>err-disabled</code>; the log says <code>psecure-violation</code>. Each port is locked to one device (port security, a later module); the box was a desk switch adding a second MAC.</p>
<p><b>Fix.</b> The office manager removes the desk switch. You run <code>shutdown</code> / <code>no shutdown</code> on Gi1/0/14: <code>connected a-full a-1000</code>, one MAC in <code>show mac address-table interface Gi1/0/14</code>.</p>
<p><b>What you say.</b> &ldquo;You're back on. The switch shut your port as a security measure when a second device appeared. Need two laptops? Raise a request and we'll add a port.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Gi1/0/14 err-disabled (psecure-violation): unmanaged desk switch. Removed; shut/no shut; connected a-full a-1000, single MAC, user confirmed. 14 min.&rdquo;</i></p>
<h3>Ticket 4415 · 08:40 · Design studio, Ikoyi — &ldquo;the NAS is crawling&rdquo;</h3>
<p><b>Questions.</b> &ldquo;Everyone or one person?&rdquo; — <i>&ldquo;Everyone, all week; web is fine.&rdquo;</i> &ldquo;Anything changed?&rdquo; — <i>&ldquo;The NAS was upgraded Friday.&rdquo;</i> Everyone, but only the NAS: check the one port they all share.</p>
<p><b>Checks.</b> Gi1/0/2 <code>NAS-01</code> shows <code>full 100</code> — hard-coded. <code>clear counters</code>, a designer copies a big file, and <code>show interfaces Gi1/0/2</code> shows CRC climbing by hundreds a minute. The NAS, on auto, has fallen back to half duplex.</p>
<p><b>Fix.</b> <code>speed auto</code>, <code>duplex auto</code>: now <code>a-full a-1000</code>. Counters cleared again; CRC stays at 0 under load; copies go from about 9 MB/s to 110 MB/s.</p>
<p><b>What you say.</b> &ldquo;Fixed — the NAS and its switch port disagreed on a setting, so data was being damaged and resent.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Duplex mismatch Gi1/0/2 (NAS-01): switch 100/full hard-coded, NAS auto → half. Set auto/auto; a-full a-1000; 0 CRC under load; 9 → 110 MB/s. Saved. 22 min.&rdquo;</i></p>
<h3>Ticket 4419 · 09:25 · Clinic, Surulere — &ldquo;which port is the new label printer on?&rdquo;</h3>
<p><b>Checks.</b> The printer's config page gives <code>001b.a944.7c10</code>. CORE-SW: MAC on <code>Gi1/0/48</code>; CDP says that's FL2-SW (IP from <code>detail</code>). On FL2-SW the MAC is on <code>Gi1/0/31</code>, no CDP neighbour, <code>connected a-full a-100</code> — a 10/100 NIC, negotiated properly.</p>
<p><b>Fix and note.</b> <code>description PRN-LABEL-PHARMACY</code>, saved. <i>&ldquo;Label printer located FL2-SW Gi1/0/31 via CORE Gi1/0/48 uplink; described; asset register updated. 9 min.&rdquo;</i></p>
`)}
${K.case("The bank branch that dropped off every afternoon",`
<p>A bank branch in Wuse, Abuja, had teller PCs freezing for five minutes most afternoons. The ISP and router logs were clean.</p>
<p>An MSP engineer walked the path. <code>show cdp neighbors</code> on the branch switch revealed a <b>second</b> switch nobody had documented, feeding the teller counters. Its <code>show version</code> said uptime 2 hours, &ldquo;System returned to ROM by power-on&rdquo;: it was rebooting every afternoon.</p>
<p>It was plugged into a wall socket, not the UPS. When the grid failed and the generator took over, the few seconds' gap didn't touch the router or main switch on the UPS, but the teller switch lost power and took four minutes to boot. Moving it to the UPS ended an eight-month fault. New standard: map every branch with CDP, document every switch, check uptime for periodic faults.</p>`)}
${K.myth([
  ["If the link light is green, the problem isn't the switch.","Green proves Layer 1 only. The port can still be in the wrong VLAN or duplex-mismatched."],
  ["CDP shows every device on the network.","Only directly connected CDP speakers. Its frames go to the CPU and are never forwarded, so you hop switch by switch."],
  ["LLDP is on by default, like CDP.","On Catalyst switches it is off until lldp run — and the far end must run it too."],
  ["Error counters show what's happening now.","They are totals since boot or the last clear counters. Clear, wait, and look for rising counters."],
  ["An err-disabled port fixes itself if you wait.","Not by default: it needs shutdown / no shutdown (or configured errdisable recovery), after removing the cause."],
])}
${K.dodont([
  "Ask who, what and what changed before typing anything.",
  "Climb the ladder in order; stop at the first step that isn't 'good'.",
  "Clear counters and re-check under load, before and after a fix.",
  "Describe every port you identify, and save.",
  "Disable CDP and LLDP on ports facing the ISP, guests or the public.",
],[
  "Bounce an err-disabled port without finding the cause.",
  "Hard-code speed or duplex on one end to 'fix' a slow link.",
  "Label a port with a host's name before checking it isn't an uplink.",
  "Reload a switch to fix one user's port.",
  "Close a ticket without real output and the user's confirmation.",
])}
${K.check({q:"Why save show interfaces status and show cdp neighbors output from a healthy network?", o:["IOS needs it to boot","So you have a baseline to compare against when something breaks","It makes CDP faster","It is required before using SSH"], a:1, why:"A baseline records what normal looked like — ports, speeds, neighbours — so 'what's different now?' has an instant answer."})}

<h2>The Module 2 challenge</h2>
<p>Time to prove it. A client office run by your MSP: an edge router; a comms-room switch (SW1) with the file and print server (FS1) and the Accounts printer (PRN-1); an Accounts-floor switch (SW2) on a single-mode fibre uplink; two Accounts PCs; and the NOC PC on its own subnet behind the router. Five complaints are waiting.</p>
<p>There are <b>at least five independent faults</b> drawn from Modules 1 and 2: cabling and optics, port state, duplex, VLANs and switch management. No step-by-step instructions: climb the ladder on each complaint, with the switch show commands and the PCs' <code>ipconfig</code>, <code>arp -a</code> and <code>ping</code>. Click any port to read its link state. Some faults hide others, so fix shared causes first.</p>
${K.tip(`Every complaint has a <b>Hint</b> button. Hints cost nothing — no points lost — but try each complaint without one first. Being stuck for ten minutes and then finding it yourself teaches more than any hint.`)}
${K.bench({id:"m2-challenge", points:150, challenge:true, from:"CCNA · Module 2 · lesson 7", title:"Module 2 challenge — the Monday-morning tickets", viewBox:"0 0 780 560",
  intro:"Console cable is on SW1 (9600 8N1, no flow control) — move it to SW2 when you need to, or SSH from NOC-PC once a switch is reachable. Enable secret on both switches: <code>NocLab26</code>. NOC SSH login: user <code>noc</code>, password <code>Lagos2026</code>. You can't change the printer's own settings. EDGE-R1 is built to the MSP's hardened baseline (proxy ARP disabled, <code>no ip proxy-arp</code>) and is not at fault.",
  devices:[
    {id:"r1", kind:"router", label:"EDGE-R1", model:"ISR 1100 · comms room", x:20, y:20, config:e=>{ ["en","conf t","hostname EDGE-R1","interface g0/0","description LAN to SW1 Gi0/1","ip address 10.20.1.1 255.255.255.0","no ip proxy-arp","no shutdown","interface g0/1","description NOC segment","ip address 10.20.99.1 255.255.255.0","no ip proxy-arp","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · comms room", x:330, y:20, sfp:{g10:"sfp-lx"}, config:e=>{ ["en","conf t","hostname SW1","enable secret NocLab26","ip domain-name office.lan","username noc secret Lagos2026","crypto key generate rsa modulus 2048","ip ssh version 2","line vty 0 15","login local","transport input ssh","exit",
      "interface g0/1","description EDGE-R1 G0/0","interface g0/2","description FS1 file and print server","interface g0/3","description PRN-1 Accounts printer","speed 100","duplex full","interface g0/10","description UPLINK to SW2 Gi0/10",
      "interface vlan 1","ip address 10.20.1.2 255.255.255.0","no shutdown","exit","ip default-gateway 10.20.1.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"noc", kind:"pc", label:"NOC-PC", x:20, y:150, ip:"10.20.99.10", mask:"255.255.255.0", gw:"10.20.99.1"},
    {id:"fs1", kind:"server", label:"FS1", x:170, y:150, ip:"10.20.1.20", mask:"255.255.255.0", gw:"10.20.1.1"},
    {id:"prn", kind:"printer", label:"PRN-1", x:320, y:150, ip:"10.20.1.30", mask:"255.255.255.0", gw:"10.20.1.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:470, y:150},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · Accounts floor", x:330, y:290, sfp:{g10:"sfp-lx"}, config:e=>{ ["en","conf t","hostname SW2","enable secret NocLab26","ip domain-name office.lan","username noc secret Lagos2026","crypto key generate rsa modulus 2048","ip ssh version 2","line vty 0 15","login local","transport input ssh","exit","vlan 99","name QUARANTINE","exit",
      "interface g0/1","description ACC-PC1 Amaka","switchport access vlan 99","interface g0/2","description ACC-PC2 new starter","shutdown","interface g0/10","description UPLINK to SW1 Gi0/10",
      "interface vlan 1","ip address 10.20.1.3 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pc1", kind:"pc", label:"ACC-PC1", x:360, y:440, ip:"10.20.1.51", mask:"255.255.255.0", gw:"10.20.1.1"},
    {id:"pc2", kind:"pc", label:"ACC-PC2", x:540, y:440, ip:"10.20.1.52", mask:"255.255.255.0", gw:"10.20.1.1"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g1"}, {type:"cat6", a:"noc:eth", b:"r1:g1"}, {type:"cat6", a:"fs1:eth", b:"sw1:g2"}, {type:"cat6", a:"prn:eth", b:"sw1:g3"},
           {type:"smf", a:"sw1:g10", b:"sw2:g10", swapped:true}, {type:"cat6", a:"pc1:eth", b:"sw2:g1"}, {type:"cat6", a:"pc2:eth", b:"sw2:g2"}, {type:"console", a:"lap:usb", b:"sw1:con"} ],
  tray:["cat6","console","smf","mmf","sfp-sx","sfp-lx"],
  tasks:[
    {text:"<b>Monitoring alert:</b> &ldquo;SW1 Gi0/10 — UPLINK to SW2 — is down.&rdquo; Everyone on the Accounts floor is affected. <i>Done when the uplink is up at both ends.</i>", hint:"Both ends have LX optics on yellow single-mode fibre, so the optics and the fibre type match. Click either end of the fibre and read why the link is down. Module 1 lesson 3 told you what to do when both ends transmit and neither receives — and at how many ends to do it.", done:B=>Bench.up(B,"sw1:g10","sw2:g10")},
    {text:"<b>Amaka (ACC-PC1):</b> &ldquo;I can't open anything on the file server, FS1. My cable's in and the light is on.&rdquo; <i>Done when ACC-PC1 can ping 10.20.1.20.</i>", hint:"Her link is up, so climb the ladder on SW2. Compare her port's Vlan column in show interfaces status with the uplink's and the other desk port's. (If nobody on SW2 can reach FS1, deal with the uplink alert first.)", done:B=>Bench.pinged(B,"pc1","10.20.1.20")},
    {text:"<b>New starter (ACC-PC2):</b> &ldquo;Windows says Network cable unplugged. Facilities swear the desk is patched.&rdquo; <i>Done when ACC-PC2 can ping FS1.</i>", hint:"Media disconnected with a good patch means look at the switch end. What does show interfaces status say for that port: notconnect, disabled or err-disabled? Each one has a different fix.", done:B=>Bench.pinged(B,"pc2","10.20.1.20")},
    {text:"<b>Accounts:</b> &ldquo;Printing to PRN-1 is painfully slow — a 20-page job takes ten minutes.&rdquo; FS1 is the print server. <i>Done when PRN-1's link is clean (no duplex mismatch) and FS1 can ping 10.20.1.30.</i>", hint:"The printer prints, so the link is up — the question is how well. On SW1, read the printer port's Duplex and Speed columns: is there an a- in front? Then read that port's counters with show interfaces. You can only change the switch end.", done:B=>{ const c=Bench.cableAt(B,"prn:eth"); if (!c) return false; const s=Bench.linkState(B,c); return s.up && !s.mismatch && Bench.pinged(B,"fs1","10.20.1.30"); }},
    {text:"<b>NOC:</b> &ldquo;We can SSH to SW1 (10.20.1.2) from NOC-PC, but SW2 (10.20.1.3) times out.&rdquo; <i>Done when NOC-PC has an SSH session logged in to SW2.</i>", hint:"SW1 works from the NOC, so NOC-PC, the router and the SSH method are fine. NOC-PC is on a different subnet (10.20.99.0/24). Compare SW1's and SW2's show running-config: what does a switch need before it can reply to a host on another subnet? (Lesson 5.)", done:B=>{ const s=Bench.session(B,"noc"); return !!(s && s.host==="10.20.1.3" && s.proto==="ssh"); }},
  ],
  win:"Five faults across three layers — polarity, an access VLAN, a shut port, a one-sided hard-code and a missing default gateway — found by climbing the same ladder every time. That's a Monday morning on a real NOC desk, done properly.",
  solve:[["flip","sw1:g10"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","NocLab26"],["term","configure terminal"],["term","interface g0/3"],["term","speed auto"],["term","duplex auto"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","NocLab26"],["term","configure terminal"],["term","interface g0/1"],["term","switchport access vlan 1"],["term","interface g0/2"],["term","no shutdown"],["term","exit"],["term","ip default-gateway 10.20.1.1"],["term","end"],["term","write memory"],
    ["pc","pc1","ping 10.20.1.20"],["pc","pc2","ping 10.20.1.20"],["pc","fs1","ping 10.20.1.30"],["pc","noc","ssh -l noc 10.20.1.3"],["pc","noc","Lagos2026"]]})}
${K.hint(`Stuck on where to begin? Take the complaint that affects the most people first — a dead uplink hides everything behind it. Then go port by port on SW2 with <code>show interfaces status</code>, then SW1's printer port, then compare the two switches' running-configs line by line.`)}
${K.reveal("Instructor walkthrough — every fault, how you'd find it, the fix",`
<p><b>Fault 1 — uplink Tx/Rx swapped.</b> <i>Found:</i> SW1 Gi0/10 <code>notconnect</code>; the fibre reports no light received. Optics (LX) and fibre (single-mode) match, which leaves polarity. <i>Fix:</i> flip the LC at <b>one</b> end. <i>Proof:</i> <code>connected</code> both ends; <code>show cdp neighbors</code> on SW1 lists SW2. It masked faults 2, 3 and 5.</p>
<p><b>Fault 2 — ACC-PC1 in the wrong VLAN.</b> <i>Found:</i> after the uplink fix, ACC-PC1 still gets <code>Destination host unreachable</code> from its own IP. SW2 shows Gi0/1 in VLAN <code>99</code> (QUARANTINE in <code>show vlan brief</code>); everything else is VLAN 1. <i>Fix:</i> <code>interface g0/1</code>, <code>switchport access vlan 1</code>. <i>Proof:</i> FS1 replies; her MAC appears in VLAN 1.</p>
<p><b>Fault 3 — ACC-PC2's port shut.</b> <i>Found:</i> <code>Media disconnected</code> on the PC; SW2 Gi0/2 <code>disabled</code> — the unused-port policy, never reversed. <i>Fix:</i> <code>no shutdown</code>. <i>Proof:</i> <code>connected a-full a-1000</code>; ACC-PC2 pings FS1.</p>
<p><b>Fault 4 — printer duplex mismatch.</b> <i>Found:</i> SW1 Gi0/3 at <code>full 100</code>, no <code>a-</code>: hard-coded switch side, so the auto printer fell to half. <code>show interfaces g0/3</code> shows CRC and runts on this full side. <i>Fix:</i> <code>speed auto</code>, <code>duplex auto</code> (the printer can't be changed, so auto on both ends). <i>Proof:</i> <code>a-full a-1000</code>, no mismatch, FS1 pings PRN-1; on a real job, clear counters and print a test page.</p>
<p><b>Fault 5 — SW2 has no default gateway.</b> <i>Found:</i> SSH to SW1 works, so NOC-PC, the router and SSH are fine. SW2's Vlan1 is <code>up / up</code> and its SSH config matches SW1's — but SW1 has <code>ip default-gateway 10.20.1.1</code> and SW2 has none, so it can't reply to 10.20.99.10. (With proxy ARP left at its default, EDGE-R1 would have answered SW2's ARP for 10.20.99.10 and hidden this fault; its baseline disables it.) <i>Fix:</i> <code>ip default-gateway 10.20.1.1</code>. <i>Proof:</i> <code>ssh -l noc 10.20.1.3</code> logs in.</p>
<p><b>Finally</b> <code>write memory</code> on both switches. Ticket note: <i>&ldquo;SW1–SW2 fibre polarity flipped at SW1. SW2 Gi0/1 VLAN 99 → 1. SW2 Gi0/2 no shut. SW1 Gi0/3 100/full hard-code → auto. SW2 ip default-gateway 10.20.1.1 added; NOC SSH OK. Verified, saved.&rdquo;</i></p>`)}

<h2>Interview corner</h2>
${K.hint(`Show a method: scope first, then the ladder, with exact commands.`)}
${K.reveal("&ldquo;A user says the network is slow. How do you troubleshoot it from the switch?&rdquo;",`<p>&ldquo;First I scope it: one user or many, everything or one application, since when? For one user I find their port — by description, or by their MAC with <code>show mac address-table address</code>, following uplinks with CDP. In <code>show interfaces status</code> I want <code>connected a-full a-1000</code>; <code>a-half</code> or a hard-coded value suggests a duplex mismatch, <code>a-100</code> on a gigabit PC a cable fault. In <code>show interfaces</code> I look at CRC and runts, late collisions and reliability, then <code>clear counters</code> and see what rises while they work. I check the uplink the same way, since it carries everyone. If the switch is clean, I move up to the NIC, server or application — and I put before-and-after output in the ticket.&rdquo;</p>`)}
${K.hint(`Who made it, who speaks it, defaults and timers, commands — then security.`)}
${K.reveal("&ldquo;What's the difference between CDP and LLDP?&rdquo;",`<p>&ldquo;Both are Layer 2 discovery protocols: devices advertise their name, model, management IP and sending port, so you can map who's connected where. CDP is Cisco proprietary, on by default, every 60 seconds with a 180-second holdtime — <code>show cdp neighbors [detail]</code>. LLDP is the IEEE 802.1AB standard, so phones, APs, servers and other vendors speak it; it's off by default on Catalyst, enabled with <code>lldp run</code>, 30 and 120 seconds — <code>show lldp neighbors</code>. Both show only direct neighbours. I disable both on ports facing the ISP or public, because they leak models, versions and IPs.&rdquo;</p>`)}
${K.hint(`Define it, two causes, recovery in order — and what you'd never do.`)}
${K.reveal("&ldquo;A port is err-disabled. What does that mean and how do you bring it back?&rdquo;",`<p>&ldquo;The switch shut the port itself after a violation — typically port security, BPDU guard catching a switch on an access port, or link flapping. The log names the cause. I remove the cause first, then <code>shutdown</code> and <code>no shutdown</code>, verify <code>connected</code>, and record the cause. Bouncing it without fixing the cause just err-disables it again and hides the evidence. <code>errdisable recovery</code> can automate it, but it's off by default and should be a deliberate choice.&rdquo;</p>`)}

${K.recap([
  "Troubleshoot bottom-up: physical, port state, speed/duplex, VLAN, MAC table, ARP, IP settings.",
  "connected = up; notconnect = physical; disabled = shutdown; err-disabled = the switch shut it. a- = negotiated.",
  "Duplex mismatch: link up, CRC and runts on the full side, late collisions on the half side.",
  "Counters are cumulative: clear counters, then watch what rises.",
  "err-disabled: remove the cause, then shutdown / no shutdown.",
  "CDP: Cisco, on by default, 60/180 s. LLDP: IEEE 802.1AB, off on Catalyst until lldp run, 30/120 s. Direct neighbours only.",
  "Find a host by MAC, following uplinks with CDP until the port has no switch neighbour.",
  "A switch needs ip default-gateway to reply off-subnet. Document with descriptions, diagrams, baselines and proof.",
])}
${K.next(`<b>Module 3 — Binary, IPv4 addressing and subnetting.</b> You've read masks like 255.255.255.0 all module. Next: what they mean bit by bit — binary, IPv4 addressing and private ranges, and subnetting fast enough for the exam or a NOC call.`)}
`,
quiz:[
  {q:"In show interfaces status, a port shows Duplex 'a-full' and Speed 'a-1000'. What does the 'a-' prefix mean?", o:["The value was hard-coded by an administrator","The value was autonegotiated with the device at the other end","The port is an access port","The port is administratively down"], a:1, why:"The a- prefix means auto: the port negotiated full duplex at 1000 Mb/s with its neighbour. A value without the prefix, such as full 100, has been hard-coded on that port.", lvl:1},
  {q:"A port shows Status 'disabled' in show interfaces status. What is the most likely reason?", o:["Nothing is plugged into it","The switch shut it down after a security violation","It has the shutdown command in its configuration","It is in the wrong VLAN"], a:2, why:"disabled means administratively down: someone configured shutdown on it. notconnect means enabled but no signal from the far end; err-disabled means the switch shut it itself.", lvl:1},
  {q:"A user's port is shown below. The log says a port-security violation occurred after the user plugged in a small desk switch. What is the correct order of actions?", ex:"SW-FLOOR2#show interfaces status\n\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi1/0/5   DESK-2.05 HR       err-disabled 30           auto   auto 10/100/1000BaseTX", o:["Run shutdown then no shutdown on Gi1/0/5 immediately, then ask the user what changed","Remove the desk switch, then run shutdown and no shutdown on Gi1/0/5 and verify it shows connected","Reload the switch so the port resets","Move the user's cable to another free port"], a:1, why:"An err-disabled port must be shut and re-enabled to recover, but only after the cause is removed; otherwise the violation repeats and the port err-disables again. Reloading disconnects everyone, and moving ports avoids the policy rather than fixing the problem.", lvl:2},
  {q:"show interfaces Gi0/4 begins with 'GigabitEthernet0/4 is down, line protocol is down (notconnect)'. What should you check first?", o:["The VLAN assignment of Gi0/4","Whether Gi0/4 has the shutdown command","The physical path: patch cord, patch panel, cable and whether the far device is powered on","The switch's default gateway"], a:2, why:"down/down with notconnect means the port is enabled but hears no signal from the far end: a physical problem. A shut port would say administratively down (disabled); VLAN and gateway are higher up the ladder and can't matter until the link is up.", lvl:2},
  {q:"Users say large copies to the server attached to Gi0/7 are very slow, but pings work. Based on the output, what is the cause and fix?", ex:"SW1#show interfaces Gi0/7\nGigabitEthernet0/7 is up, line protocol is up (connected)\n  Description: FILESRV-02\n  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,\n     reliability 255/255, txload 2/255, rxload 1/255\n  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX\n     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored\n     5810 collisions, 0 interface resets\n     1946 late collision, 0 deferred", o:["A broken cable pair; replace the patch cord","A duplex mismatch: the server is hard-coded to full duplex and the switch fell back to half; set auto on both ends (or match both)","The port is err-disabled; bounce it","The server is in the wrong VLAN"], a:1, why:"Half-duplex with late collisions on a modern switch port is the half side of a duplex mismatch: the server end was hard-coded, so this auto port could sense the speed but not the duplex and fell back to half. The full side (the server) would be counting CRC errors. Fix with auto on both ends, or identical fixed settings on both.", lvl:2},
  {q:"Which statement about discovery protocols on a Cisco Catalyst switch with default settings is TRUE?", o:["CDP and LLDP are both disabled until configured","CDP is enabled; LLDP is disabled until you enter lldp run","LLDP is enabled; CDP is disabled until you enter cdp run","Both are enabled, but only on trunk ports"], a:1, why:"CDP is on by default on Cisco devices. LLDP, the IEEE 802.1AB standard, is off by default on Catalyst switches and is enabled globally with lldp run.", lvl:1},
  {type:"multi", q:"Which two statements about CDP are true? (Choose two.)", o:["It is a Cisco-proprietary Layer 2 protocol","It shows only directly connected neighbours","Its frames are forwarded through switches, so you can see the whole network from one device","It is defined by IEEE 802.1AB","By default it advertises every 30 seconds with a 120-second holdtime"], a:[0,1], why:"CDP is Cisco proprietary and runs at Layer 2. Its advertisements go to the receiving device's CPU and are never forwarded, so you only see direct neighbours. IEEE 802.1AB is LLDP, and 30 s / 120 s are LLDP's defaults; CDP uses 60 s and 180 s.", lvl:2},
  {type:"fill", q:"Which global configuration command enables LLDP on a Cisco Catalyst switch?", why:"lldp run turns LLDP on for the whole switch; no lldp run turns it off. Per interface you can use no lldp transmit and no lldp receive. CDP's equivalent global command is cdp run, and it is already on by default.", fields:[{label:"Command", a:["lldp run"], ios:true}], lvl:1},
  {type:"fill", q:"A PC's ipconfig /all shows Physical Address 00-50-9C-50-57-F5. Type the full command that shows which switch port has learned this MAC address.", fields:[{label:"Command", a:["show mac address-table address 0050.9c50.57f5"], ios:true}], why:"Cisco writes MAC addresses as three dot-separated groups of four hex digits, in lowercase: 0050.9c50.57f5. show mac address-table address filters the table to that one entry and shows the VLAN and port it was learned on.", lvl:2},
  {q:"You are looking for a CCTV recorder. On the core switch you see the output below. What is your next step?", ex:"CORE-SW#show mac address-table address 001b.a944.9e21\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  40    001b.a944.9e21    DYNAMIC     Gi1/0/48\n\nCORE-SW#show cdp neighbors\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nFL2-SW           Gi1/0/48          142        S I         C9200L    Gi1/0/52\nFL1-SW           Gi1/0/47          151        S I         C9200L    Gi1/0/52", o:["Label Gi1/0/48 on CORE-SW as the CCTV recorder's port","Connect to FL2-SW and look up 001b.a944.9e21 in its MAC address table","Connect to FL1-SW and look up the MAC there","Shut Gi1/0/48 and see whether the recorder goes offline"], a:1, why:"The core learned the MAC on Gi1/0/48, but CDP shows that port is an uplink to FL2-SW (whose end is Gi1/0/52). Every device behind FL2-SW appears on that port, so follow the uplink and repeat the lookup on FL2-SW until the MAC appears on a port with no switch neighbour. Shutting an uplink would take a whole floor offline.", lvl:3},
  {type:"order", q:"Put the switched-LAN troubleshooting ladder in bottom-up order.", items:["Physical: cable, light, power","Port state: connected, disabled or err-disabled","Speed, duplex and error counters","VLAN of the access port","MAC address table: is the host seen on the expected port?","ARP: is the gateway's or target's MAC resolved?","IP settings: address, mask, gateway and ping tests"], why:"Each step depends on the ones below it: no link means nothing else matters; a shut port can't pass traffic; a bad link corrupts everything above it; the wrong VLAN isolates the user's broadcasts; the switch must see the host; the host must resolve MACs; and only then do IP settings and pings tell you about higher layers.", lvl:1},
  {type:"match", q:"Match each symptom on a switch port with its most likely meaning.", pairs:[["Status notconnect","No signal from the far end: a physical problem"],["Status disabled","The shutdown command is configured"],["Status err-disabled","The switch shut the port after a violation"],["Duplex a-half on a desk port","The device at the far end is hard-coded"],["Rising CRC errors and runts","The full-duplex side of a mismatch, or a damaged cable"]], why:"Status tells you who or what stopped the port: physics (notconnect), an administrator (disabled) or the switch itself (err-disabled). An auto port that ends up half duplex means the far end stopped negotiating. CRC errors and runts are what the full-duplex side sees in a mismatch, and also appear with bad cabling or interference.", lvl:1},
  {q:"A finance PC's port is connected a-full a-1000 with clean counters, and its IP address, mask and gateway match its neighbours'. Pinging the gateway gives 'Reply from 10.60.4.27: Destination host unreachable' and arp -a shows no entry for the gateway. Neighbours on the same switch work. What is the most likely fault?", o:["A duplex mismatch on the PC's port","The PC's switch port is in a different VLAN from the gateway and its neighbours","The router's interface is shut down","The switch has no default gateway"], a:1, why:"The PC's ARP request for the gateway gets no answer, but the link is clean and the settings are right, and neighbours on the same switch reach the gateway — so the gateway is up. The PC's broadcasts are not reaching the gateway's broadcast domain: its access port is in another VLAN. A missing switch default gateway affects only the switch's own management traffic.", lvl:3},
  {type:"multi", q:"The NOC (10.20.99.10, behind a router) can SSH to SW1 at 10.20.1.2 but SSH to SW2 at 10.20.1.3 times out. Both switches have identical SSH settings and are on the same subnet. Which two faults could each cause this on their own? (Choose two.)", o:["SW2 has no ip default-gateway configured","SW2's interface vlan 1 is shut down","The NOC PC's default gateway is wrong","LLDP is disabled on SW1","SW1's printer port is hard-coded to 100/full"], a:[0,1], why:"SSH to SW1 works, so the NOC PC's settings, the router and the SSH method are fine. If SW2's management SVI is down, nothing reaches 10.20.1.3. If SW2 has no default gateway, it receives the request but can't send the reply to another subnet, so the session times out. LLDP and the printer port don't affect management traffic to SW2.", lvl:3},
  {q:"You've just changed a server port from a one-sided hard-code back to auto. What is the best way to prove the duplex mismatch is fixed before you close the ticket?", o:["Check that the port light is green","Run show running-config and confirm speed and duplex lines are gone","Confirm a-full a-1000 in show interfaces status, clear counters, have the user copy a large file, then check CRC and collision counters stay at zero and the user confirms the speed","Reload the switch to make sure the change survives"], a:2, why:"The light was green during the mismatch too, and the configuration only shows intent. Proof is behaviour: the negotiated result, counters cleared and then checked under real load, and the user confirming. Reloading a switch to test a port change disconnects everyone; save the configuration instead.", lvl:3},
  {q:"A PC pings a server and gets 'Request timed out' four times. What does that message tell you?", o:["The PC has no network link","The echo request was sent, but no reply came back","The PC has no IP address","The printer's MAC address is unknown to the PC"], a:1, why:"'Request timed out' means the request left the PC but nothing came back: the far end didn't reply or its reply couldn't return. 'Destination host unreachable' from your own IP means ARP got no answer; 'General failure' means the PC couldn't send at all (no link or no IP).", lvl:2},
],
cards:[
  {f:"The switched-LAN troubleshooting ladder (bottom-up)", b:"Physical, port state, speed/duplex and counters, VLAN, MAC table, ARP, IP settings. Mnemonic: Please Stop Dropping Valuable Mangoes At Ikeja."},
  {f:"show interfaces status: connected / notconnect / disabled / err-disabled", b:"connected = link up. notconnect = enabled, no signal (physical). disabled = shutdown configured. err-disabled = the switch shut it after a violation."},
  {f:"a-full a-1000 vs full 100", b:"a- = autonegotiated. No a- = hard-coded on this port. a-half on a desk port usually means the far end is hard-coded."},
  {f:"Duplex mismatch counters", b:"Full-duplex side: CRC errors and runts. Half-duplex side: collisions and late collisions. Link stays up; pings work; big transfers crawl."},
  {f:"show interfaces first-line combinations", b:"up/up = healthy. down/down (notconnect) = physical. administratively down/down = shutdown. down/down (err-disabled) = switch shut it. up/down = Layer 2 problem (rare on access ports)."},
  {f:"err-disabled recovery", b:"Find the cause (log, show interfaces status err-disabled), remove it, then shutdown and no shutdown on the interface. Automatic errdisable recovery is off by default."},
  {f:"Common err-disabled causes", b:"Port-security violation, BPDU guard (a switch plugged into an access port), link flapping. Configured in later modules."},
  {f:"CDP", b:"Cisco proprietary, Layer 2, on by default, every 60 s, holdtime 180 s. show cdp neighbors [detail]. no cdp run (global), no cdp enable (interface)."},
  {f:"LLDP", b:"IEEE 802.1AB, vendor-neutral, off by default on Catalyst: lldp run. Every 30 s, holdtime 120 s. show lldp neighbors. no lldp transmit / no lldp receive per interface."},
  {f:"Finding a host's switch port", b:"Get the MAC (ipconfig /all), convert to xxxx.xxxx.xxxx, show mac address-table address, and if the port is an uplink (CDP neighbour), follow it and repeat."},
  {f:"Windows ping failures", b:"Destination host unreachable (from own IP) = ARP got no answer. Request timed out = no reply came back. General failure = no link or no IP."},
  {f:"Why counters can mislead", b:"They are cumulative since boot or the last clear counters. Clear them, wait under load, and look only at counters that rise."},
  {f:"Switch reachable locally but not from another subnet", b:"Check the management SVI is up/up with the right IP, then ip default-gateway: without it the switch can't reply off-subnet."},
],
});

const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>l.mod==="ccna-m1").length;
K.module("ccna", {
  id:"ccna-m2", t:"Ethernet switching & ARP",
  blurb:"MAC addresses, how switches learn and forward, collision and broadcast domains, ARP, managing a switch over SSH, and troubleshooting a switched LAN — ending in the Module 2 challenge.",
}, L, { at, modAt:1, replace:["Ethernet LAN switching: MAC learning, frames, unicast & broadcast"] });
})();
