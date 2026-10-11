// CCNA · Module 6 — IPv6: addresses, address types, configuration, Neighbor Discovery and SLAAC, static routes (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "IPv6: addressing, types, SLAAC and configuration".
(function(){
const L = [];

// ---------- Module 6 · Lesson 1 ----------
L.push({
id:"ipv6-why", mins:80, level:"Beginner+ · builds on Modules 1–5",
t:"Why IPv6 — and how to read, write and shorten an IPv6 address",
html:`
${K.goals([
  "Explain to a manager why IPv6 exists: IPv4 exhaustion, what NAT costs, end-to-end addressing — and why networks run dual stack for years.",
  "Read any IPv6 address as eight 16-bit hextets of hex digits, and turn a hextet into binary and back.",
  "Shorten any address with the two rules and write the RFC 5952 canonical form; expand any short form back to all 32 digits.",
  "Compare two addresses safely, spot invalid ones, and read prefix notation: find the /64 an address belongs to and say why every LAN is a /64.",
  "Configure addresses on a router in different written forms and read how IOS prints them in <code>show ipv6 interface brief</code>.",
])}
${K.pre(["Module 3: binary and hexadecimal (each hex digit is 4 bits), prefixes and prefix length, network and host bits.","Module 5 lesson 1: the routing table and longest match — IPv6 routing follows the same rules, which you'll see in lesson 5.","Module 1: what an ISP is, and what a router does at the edge of a network."])}

<h2>Why this matters at work</h2>
<p>Monday morning at a managed-service provider in Lekki, Lagos. A microfinance bank's ISP has switched on ${K.g("IPv6","Internet Protocol version 6: IPv4's successor, with 128-bit addresses instead of 32-bit ones. Standardised by the IETF in the 1990s.")} for its fifteen branches over the weekend. The monitoring dashboard is red: fourteen routers flagged &ldquo;IPv6 address does not match the plan&rdquo;. Abuja branch has also called — laptops show an IPv6 address, yet the head-office portal won't open over it.</p>
<p>Thirteen alarms are the same address written two ways; one is a real typo — a missing zero that moves a branch into the wrong network. Telling them apart in minutes is this lesson's skill: reading, shortening, expanding and comparing IPv6 addresses without guessing — plus the &ldquo;why&rdquo; for the manager who asks whether IPv6 is worth the effort.</p>

<h2>Why IPv6 exists: 4.3 billion wasn't enough</h2>
${K.remember(`<b>The rule in one line:</b> IPv4 addresses are 32 bits — about 4.3 billion, fewer than the people on Earth — and the free supply has run out. IPv6 addresses are 128 bits, enough for every device to have its own globally unique address again, without sharing one through translation.`)}
<h3>The free pool ran out</h3>
<p>IPv4 was designed in the late 1970s for a research network. Thirty-two bits give 2<sup>32</sup> = <b>4,294,967,296</b> addresses, fewer once private, multicast and other reserved ranges are removed. Today there are over eight billion people, most with a phone, plus laptops, servers, cameras and payment terminals.</p>
<p>Public IPv4 addresses are handed out in a chain: ${K.g("IANA","Internet Assigned Numbers Authority: the body at the top of the address chain.")} gives large blocks to five ${K.g("RIRs","Regional Internet Registries: the five bodies that hand out addresses in their region — AFRINIC (Africa), RIPE NCC, ARIN, APNIC and LACNIC.")}, which pass them to ISPs and customers. In February 2011 IANA handed out its last free blocks; the registries ran down their own stocks over the following years — AFRINIC, Africa's, last — and now share out only small leftovers. IPv4 addresses can still be bought from other organisations, at a market price.</p>
<h3>NAT stretched IPv4 — at a price</h3>
<p>The internet survived by sharing addresses. ${K.g("NAT","Network Address Translation: a router rewrites private source addresses to its own public address (and back for replies), so many devices share one public IPv4 address. Configured in a later module.")} puts a whole office of private addresses (Module 3) behind one public address. Many ISPs add a second layer, ${K.g("CGNAT","Carrier-Grade NAT: NAT run by the ISP, so many customers share one public IPv4 address. Customer routers get an address from 100.64.0.0/10 instead of a public one.")}, sharing one public address among hundreds of customers. Browsing and email still work. The costs:</p>
<ul>
<li><b>Nothing can call in.</b> A device behind NAT can start conversations but can't be reached from outside unless someone sets up ${K.g("port forwarding","A NAT rule that sends traffic arriving on one public port to a chosen inside device.")} — and behind CGNAT you can't, because the public address isn't yours.</li>
<li><b>Applications need workarounds.</b> Calls, games and remote-access tools need relay servers to get through two layers of translation.</li>
<li><b>The ISP carries the burden.</b> CGNAT boxes track every conversation, must log who used which address and port when, and become an expensive single point of failure.</li>
<li><b>Troubleshooting gets harder.</b> The address a server logs isn't the address of the device that connected.</li>
</ul>
<p>IPv6 restores <b>end-to-end addressing</b>: every device has a globally unique address, the server sees the device's own address, and connections can be opened in either direction. Whether they are <i>allowed</i> is the firewall's decision, as it always should have been — NAT was never a security design.</p>
${K.svg("0 0 760 330",
  K.txt(20,22,"IPv4 today: two layers of translation",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",60,75,"OFFICE PC","192.168.1.25")+K.dev("router",230,75,"OFFICE ROUTER","NAT #1")+K.dev("cloud",420,75,"ISP","CGNAT = NAT #2")+K.dev("server",640,75,"SERVER","sees 203.0.113.9")+
  K.link(80,77,204,77,"source rewritten")+K.link(256,77,394,77,"rewritten again")+K.link(446,77,622,77,"shared address")+
  K.txt(20,172,"IPv6: one address, end to end",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",60,225,"OFFICE PC","2001:db8:a0b:10::25")+K.dev("router",230,225,"ROUTER + FIREWALL","routes, no rewriting")+K.dev("cloud",420,225,"ISP","routes")+K.dev("server",640,225,"SERVER","sees 2001:db8:a0b:10::25")+
  K.link(80,227,204,227,"unchanged")+K.link(256,227,394,227,"unchanged")+K.link(446,227,622,227,"unchanged")+
  K.txt(380,318,"Top: the server can't see who really connected, and nothing can connect in. Bottom: the firewall decides what comes in.",{c:"muted",s:11,mid:true,f:"body"}),
  "IPv4 with NAT and CGNAT versus IPv6. Examples use the documentation ranges 203.0.113.0/24 and 2001:db8::/32.")}
<h3>How big is 2<sup>128</sup>?</h3>
<p>Each extra bit doubles the count, so 128 bits isn't four times IPv4 — it's 2<sup>96</sup> times. Written out, 2<sup>128</sup> = 340,282,366,920,938,463,463,374,607,431,768,211,456 — meaningless to a human, so build it in steps:</p>
${K.steps([
  ["Start with the whole IPv4 internet", "2<sup>32</sup> ≈ 4.3 billion addresses — the entire thing that ran out."],
  ["Replace every one of those addresses with a whole IPv4 internet", "4.3 billion × 4.3 billion = 2<sup>64</sup> ≈ 18.4 billion billion. <b>That is the size of one IPv6 LAN</b> — one /64, as you'll see at the end of this lesson."],
  ["Do it twice more", "2<sup>64</sup> × 2<sup>32</sup> × 2<sup>32</sup> = 2<sup>128</sup>: the whole IPv6 space."],
  ["What it means", "Design stops being about scarcity: every LAN gets the same size of subnet, and nobody shares an address."],
])}
${K.dyk(`Scanning one IPv6 LAN for live devices, one address at a time at a billion addresses per second, would take about <b>585 years</b> (2<sup>64</sup> ÷ 10<sup>9</sup> seconds). An IPv4 /24 takes a fraction of a second — so attackers can't sweep IPv6 LANs the way they sweep IPv4 ones.`)}
<h3>Dual stack: both at once, for years</h3>
<p>There is no switch-over day. IPv6 isn't backwards-compatible — an IPv4-only device can't talk to an IPv6-only one without a translator — so the normal reality is ${K.g("dual stack","Running IPv4 and IPv6 side by side on the same devices and links.")}: every interface, server and laptop keeps its IPv4 address and gains an IPv6 one, and each conversation uses whichever both ends support.</p>
<p>How does a laptop choose? DNS returns IPv6 addresses in an ${K.g("AAAA record","A DNS record mapping a name to an IPv6 address (IPv4 uses the A record). Said 'quad-A'.")} and IPv4 ones in an A record. Windows, macOS, Linux, Android and iOS prefer IPv6 when the destination has an AAAA record and the IPv6 path works, and fall back to IPv4 when it doesn't — within a fraction of a second in browsers and on Apple devices, which race the two (${K.g("Happy Eyeballs","Trying IPv6 and IPv4 almost at once and using whichever connects first, so a broken IPv6 path doesn't make users wait.")}). So a broken IPv6 path often goes unnoticed — until something is IPv6-only.</p>

${K.when([
  ["IPv4 only (with NAT)","A small site whose ISP offers nothing else yet","Nothing new to run or secure","You need inbound access behind CGNAT, or are building something to last ten years"],
  ["Dual stack","Almost every enterprise and ISP network today","IPv4 keeps working while IPv6 is added and proven link by link","You can't yet firewall and monitor IPv6 properly — fix that first"],
  [`IPv6 only (with ${K.g("NAT64","A translator at the network edge that lets IPv6-only devices reach IPv4-only servers.")} for IPv4 sites)`,"Large mobile networks and data centres that are out of IPv4","One protocol to run; translation only at the edge","Old devices or applications need IPv4 inside the network"],
], "Running IPv4, IPv6 or both")}
${K.check({q:"A company has NAT on its internet router and its ISP now uses CGNAT. A remote engineer can no longer reach the office's camera recorder through port forwarding. Why?", o:["Port forwarding never works with IPv4","The public IPv4 address belongs to the ISP's CGNAT, shared with many customers, so the office router has no public address to forward from","CGNAT blocks all outgoing traffic","The recorder needs an IPv6 address to make outgoing connections"], a:1, why:"Behind CGNAT the router's outside address is in 100.64.0.0/10. Incoming connections reach the ISP's shared address, which has no rule for this customer. IPv6 (with a firewall rule) or a paid public IPv4 address fixes it."})}
<h3>Same logic, new situation</h3>
<p>A Kano school's network is dual stack. A teacher opens a learning portal whose DNS name has only an A record; a second site has both A and AAAA records and a working IPv6 path. Which protocol does the laptop use for each?</p>
${K.hint(`What decides it is what DNS returns for each name, and whether that path works.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which protocol a dual-stack laptop uses for two destinations. <b>2. Rule:</b> dual-stack hosts prefer IPv6 when the destination has an IPv6 address (AAAA) and the IPv6 path works, otherwise IPv4. <b>3. Apply it:</b> the portal has no AAAA record, so <b>IPv4</b>. The second site has both and IPv6 works, so <b>IPv6</b>. One laptop, two protocols, chosen per destination: dual stack.</p>`)}

<h2>Reading an IPv6 address: 128 bits in eight hextets</h2>
${K.remember(`<b>The format rule:</b> an IPv6 address is 128 bits, written as <b>8 groups of 4 hex digits</b> separated by colons. Each group is a <b>hextet</b> of 16 bits; each hex digit is 4 bits. 8 × 16 = 128; 8 × 4 = 32 hex digits.`)}
<p>A full address, nothing left out: <code>2001:0db8:0a0b:0010:0000:0000:0000:0001</code>. Each block between colons is a ${K.g("hextet","One of the eight 16-bit groups in an IPv6 address, up to four hex digits. The name echoes 'octet', IPv4's 8-bit groups.")}. IPv4 splits 32 bits into four 8-bit <i>octets</i> in decimal; IPv6 splits 128 bits into eight 16-bit hextets in ${K.g("hexadecimal","Base 16: digits 0–9 then a–f for 10–15 (Module 3).")}.</p>
<p><b>Why hex?</b> 128 bits in binary is unreadable, and dotted decimal would need sixteen numbers. Hex needs 32 digits, and every digit maps to exactly four bits — a ${K.g("nibble","Half a byte: 4 bits, exactly one hex digit.")} — so you read the bits straight off the digits. The Module 3 values you'll meet most:</p>
<div class="tablewrap"><table>
<tr><th>Hex</th><th>0</th><th>1</th><th>2</th><th>8</th><th>9</th><th>a</th><th>b</th><th>c</th><th>d</th><th>e</th><th>f</th></tr>
<tr><td><b>Decimal</b></td><td>0</td><td>1</td><td>2</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td><td>13</td><td>14</td><td>15</td></tr>
<tr><td><b>Binary</b></td><td>0000</td><td>0001</td><td>0010</td><td>1000</td><td>1001</td><td>1010</td><td>1011</td><td>1100</td><td>1101</td><td>1110</td><td>1111</td></tr>
</table></div>
${K.svg("0 0 760 250",
  K.txt(380,22,"2001:0db8:0a0b:0010:0000:0000:0000:0001",{c:"fg",s:14,mid:true,b:true})+
  ["2001","0db8","0a0b","0010","0000","0000","0000","0001"].map((h,i)=>K.band(22+i*90,38,84,30,h,i===1?"var(--panel2)":"var(--chip)")+K.txt(64+i*90,86,"bits "+(1+i*16)+"–"+(16+i*16),{mid:true,s:10})).join("")+
  K.arrow(154,94,236,122,"",true)+
  [["0","0000"],["d","1101"],["b","1011"],["8","1000"]].map(([d,b],i)=>K.box(240+i*96,124,86,46,d,b,i>0)).join("")+
  K.txt(640,144,"one hex digit",{s:11,f:"body",c:"fg"})+K.txt(640,160,"= 4 bits (a nibble)",{s:11,f:"body"})+
  K.txt(380,204,"8 hextets × 16 bits = 128 bits, written as 32 hex digits. 0db8 = 0000 1101 1011 1000.",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(380,226,"Letters can be upper or lower case: 0DB8 and 0db8 are the same bits.",{c:"muted",s:11,mid:true,f:"body"}),
  "The 128-bit layout. Eight hextets of 16 bits; each hextet is four hex digits; each digit is one nibble of 4 bits, read straight from the Module 3 table.")}
<h3>Worked example: a hextet to binary and back</h3>
${K.steps([
  ["Take one hextet, <code>0db8</code>, and write each digit as 4 bits", "Work digit by digit — never convert the whole hextet to decimal: 0 → 0000 · d (13) → 1101 · b (11) → 1011 · 8 → 1000."],
  ["Join them", "<code>0db8</code> = <b>0000 1101 1011 1000</b>. Back again: split the 16 bits into fours and read each as a hex digit."],
  ["Another: <code>fe80</code>", "f → 1111 · e → 1110 · 8 → 1000 · 0 → 0000, so <b>1111 1110 1000 0000</b>. Addresses beginning with these first ten bits are a special type you'll meet in lesson 2."],
  ["Why it matters", "Prefix lengths count bits. A /64 is the first 64 bits — the first <b>four</b> hextets, 16 hex digits. A /48 is the first three hextets. Knowing &ldquo;4 bits per digit, 16 per hextet&rdquo; turns every prefix question into counting."],
])}

${K.mistake(`Treating a hextet like an IPv4 octet. An octet is 8 bits with values 0–255; a hextet is <b>16 bits</b>, 0000–ffff (0–65,535). &ldquo;Four groups make the network&rdquo; is right for IPv6's /64 only because each group is 16 bits.`)}
${K.q({type:"match", q:"Match each hextet with its 16 bits (convert one hex digit at a time).", pairs:[["0db8","0000 1101 1011 1000"],["a0b0","1010 0000 1011 0000"],["00ff","0000 0000 1111 1111"],["fe80","1111 1110 1000 0000"]], why:"Each hex digit is its own 4 bits: 0db8 = 0000|1101|1011|1000; a0b0 = 1010|0000|1011|0000; 00ff = 0000|0000|1111|1111; fe80 = 1111|1110|1000|0000. Watch a0b0 and 0db8: the position of each digit decides which nibble it fills."})}
${K.check({q:"How many hex digits does a full, unshortened IPv6 address contain?", o:["8","16","32","128"], a:2, why:"128 bits ÷ 4 bits per hex digit = 32 digits, in 8 hextets of 4 digits. 8 is the number of hextets; 128 is the number of bits."})}
<h3>Same logic, new situation</h3>
<p>A colleague reads a switch's MAC address, <code>0c1a.2b00.0001</code>, and asks: how many bits is that, and how many IPv6 hextets would it fill?</p>
${K.hint(`Count the hex digits; you know how many bits each one is.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The size of a MAC address in bits, and in hextets. <b>2. Rule:</b> one hex digit = 4 bits; one hextet = 16 bits (4 digits). <b>3. Apply it:</b> the MAC has 12 hex digits (Cisco groups them in fours with dots), so 12 × 4 = <b>48 bits</b> = 48 ÷ 16 = <b>3 hextets</b>. The same counting tells you a /64 prefix is 16 hex digits. (In lesson 3 you'll see a router stretch exactly this 48-bit MAC into a 64-bit part of an IPv6 address.)</p>`)}

<h2>Shortening an address: the two rules</h2>
<p>Real addresses are full of zeros, and 32 digits invite typos. Two rules let you leave zeros out without losing information, because the reader can always put them back.</p>
${K.remember(`<b>Rule 1 — leading zeros:</b> in each hextet you may drop the zeros at the <b>front</b>. <code>0db8</code> → <code>db8</code>, <code>0010</code> → <code>10</code>, <code>0000</code> → <code>0</code>. Never drop zeros at the end: <code>db80</code> stays <code>db80</code>.<br><b>Rule 2 — double colon:</b> <b>one</b> run of consecutive all-zero hextets may be replaced by <code>::</code>. Only once per address.`)}
<p><b>Why only leading zeros?</b> A reader always pads a short hextet on the <i>left</i>: <code>db8</code> can only mean <code>0db8</code>. Drop a trailing zero from <code>db80</code> and the reader restores <code>0db8</code> — a different number.</p>
<p><b>Why only one <code>::</code>?</b> The reader works out what <code>::</code> hides by counting: 8 minus the hextets written. With two there's no way to split the zeros. <code>2001:db8::1::5</code> hides four zero hextets — 1+3, 2+2 or 3+1? That's <code>2001:db8:0:1:0:0:0:5</code>, <code>2001:db8:0:0:1:0:0:5</code> or <code>2001:db8:0:0:0:1:0:5</code>, three different addresses — so two <code>::</code> make an address invalid.</p>
<h3>One address, one correct short form: RFC 5952</h3>
<p>The rules allow several legal spellings: <code>2001:db8:0:0:1:0:0:1</code>, <code>2001:db8::1:0:0:1</code> and <code>2001:db8:0:0:1::1</code> are one address. To end the confusion, ${K.g("RFC","Request for Comments: the numbered documents, published by the IETF, that define internet standards.")} 5952 picks exactly one ${K.g("canonical form","The single standard way of writing a value, so equal values always look identical.")}:</p>
<ol>
<li><b>Drop every leading zero</b> (Rule 1 in full — <code>0db8</code> is never written in the canonical form).</li>
<li><b>Use <code>::</code> to shorten as much as possible</b> — on the <b>longest</b> run of zero hextets.</li>
<li><b>If two runs tie, use the leftmost</b> (the first one).</li>
<li><b>Never use <code>::</code> for a single zero hextet</b> — write it as <code>0</code>. (<code>::</code> on one hextet still gives a valid address — just not the canonical form.)</li>
<li><b>Write the letters a–f in lower case.</b></li>
</ol>
${K.remember(`<b>The five Ls:</b> <b>L</b>eading zeros go · <b>L</b>ongest zero run becomes <code>::</code> · <b>L</b>eftmost wins a tie · a <b>L</b>one zero stays <code>0</code> · <b>L</b>ower case.`)}
${K.svg("0 0 760 290",
  K.txt(20,24,"Full",{c:"fg",s:12,b:true,f:"body"})+
  ["2001","0db8","0000","0042","0000","0000","0000","00c0"].map((h,i)=>K.band(110+i*80,8,74,26,h)).join("")+
  K.arrow(380,38,380,66,"",true)+K.txt(392,56,"Rule 1: drop leading zeros in each hextet",{c:"accent",s:11,f:"body"})+
  K.txt(20,98,"Rule 1",{c:"fg",s:12,b:true,f:"body"})+
  ["2001","db8","0","42","0","0","0","c0"].map((h,i)=>K.box(110+i*80,72,74,44,h,i===2?"lone 0: keep":i>=4&&i<=6?"run of 3":"",i>=4&&i<=6)).join("")+
  K.arrow(380,122,380,158,"",true)+K.txt(392,144,"Rule 2: the longest run becomes ::",{c:"accent",s:11,f:"body"})+
  K.txt(20,182,"Result",{c:"fg",s:12,b:true,f:"body"})+
  K.band(110,164,394,30,"2001:db8:0:42::c0","var(--panel2)")+
  K.txt(516,184,"5 written → :: hides 3 hextets",{s:11,f:"body"})+
  K.txt(380,232,"Hextet 3 is a single zero, so it stays as 0. Hextets 5–7 are the longest run, so they become ::.",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(380,254,"Trailing zeros (0042 → 42 is fine, but c0 keeps its 0) are never removed.",{c:"muted",s:11,mid:true,f:"body"}),
  "Shortening 2001:0db8:0000:0042:0000:0000:0000:00c0. Rule 1 per hextet, then Rule 2 once, on the longest run of zero hextets.")}

<h3>Worked examples: shorten each to its canonical form</h3>
${K.steps([
  ["<code>2001:0db8:0a0b:0010:0000:0000:0000:0001</code>", "Rule 1: <code>2001:db8:a0b:10:0:0:0:1</code>. One run of three zeros (hextets 5–7) → <b><code>2001:db8:a0b:10::1</code></b>. Check: 5 written + 3 hidden = 8."],
  ["<code>FE80:0000:0000:0000:0000:0000:0000:0001</code>", "Rule 1: <code>FE80:0:0:0:0:0:0:1</code>. Run of six → <code>FE80::1</code>; lower case → <b><code>fe80::1</code></b>. Two hextets written, six hidden."],
  ["<code>2001:0db8:0000:0000:00ab:0000:0000:0001</code>", "Rule 1: <code>2001:db8:0:0:ab:0:0:1</code>. Two runs of two zeros — a tie — so the <b>leftmost</b> becomes <code>::</code>: <b><code>2001:db8::ab:0:0:1</code></b>. <code>2001:db8:0:0:ab::1</code> is valid but not canonical."],
  ["<code>2001:0db8:0001:0000:0002:0003:0004:0005</code>", "Rule 1: <code>2001:db8:1:0:2:3:4:5</code>. The only zero hextet is alone, so no <code>::</code>: <b><code>2001:db8:1:0:2:3:4:5</code></b>."],
  ["<code>2001:0db8:a000:0b00:0000:0000:00c0:0100</code>", "Rule 1 drops only <i>leading</i> zeros: <code>a000</code> and <code>b00</code> keep theirs, <code>0100</code> → <code>100</code>. Run of two → <b><code>2001:db8:a000:b00::c0:100</code></b>."],
  ["<code>2001:0db8:0a0b:0020:0000:0000:0000:0000</code>", "The run reaches the end, so <code>::</code> goes last: <b><code>2001:db8:a0b:20::</code></b> — how network prefixes usually look. (All zeros is <code>::</code>; <code>::1</code> is loopback — lesson 2.)"],

])}
${K.mistake(`Dropping trailing zeros, or using <code>::</code> twice. <code>2001:db8:a000::1</code> &ldquo;shortened&rdquo; to <code>2001:db8:a::1</code> is a different address (<code>000a</code>, not <code>a000</code>); <code>2001:db8::1::1</code> isn't an address at all. IOS rejects the second and silently accepts the first.`)}
${K.q({type:"fill", q:"Write the RFC 5952 canonical form of each address (lower case, fully shortened).", fields:[
  {label:"2001:0db8:0000:0000:0000:0000:0bad:0001", a:["2001:db8::bad:1"]},
  {label:"2001:0db8:0010:0000:0000:0000:0000:0000", a:["2001:db8:10::"]},
  {label:"2001:0db8:0000:0001:0000:0000:0000:0001", a:["2001:db8:0:1::1"]},
  {label:"2001:0db8:0abc:0000:0000:0def:0000:0000", a:["2001:db8:abc::def:0:0"]}],
  why:"1: one run of four zeros → 2001:db8::bad:1 (0bad keeps no leading zero). 2: the run of five reaches the end → 2001:db8:10:: (0010 → 10, not 1). 3: a lone zero in hextet 3 stays 0; the run of three becomes :: → 2001:db8:0:1::1. 4: two runs of two tie, so the leftmost (hextets 4–5) becomes :: → 2001:db8:abc::def:0:0. Upper-case answers are marked right too: case never changes the address."})}
${K.when([
  ["Canonical lower case (<code>2001:db8:a0b:10::1</code>)","Docs, tickets, firewall and DNS records","Same address, same text: search and copy-paste work","—"],
  ["Full 32-digit form","IP plans you sort, or checking a prefix by eye","Every hextet in a fixed column","Anywhere people retype it"],
  ["IOS output (upper case)","Reading router output","IOS prints its own form; your typing isn't kept","Pasting into lower-case docs unconverted"],
], "Which written form to use where")}
${K.check({q:"Which is the canonical form of 2001:0db8:0000:0000:0001:0000:0000:0000?", o:["2001:db8::1:0:0:0","2001:db8:0:0:1::","2001:db8::1::","2001:db8:0:0:1:0:0:0"], a:1, why:"After Rule 1 the zero runs are hextets 3–4 (two) and 6–8 (three). The longest run gets the ::, even though it isn't the leftmost: 2001:db8:0:0:1::. The leftmost-wins rule only breaks ties. Two :: is invalid; no :: at all isn't fully shortened."})}
<h3>Same logic, new situation</h3>
<p>A firewall export shows <code>2001:0db8:0000:0000:0007:0000:0000:0000</code>. Write it in canonical form — careful, it has two zero runs and one of them is at the very end.</p>
${K.hint(`Measure both runs before you decide. &ldquo;Leftmost&rdquo; only matters when they're the same length.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The canonical form of an address with two zero runs. <b>2. Rules:</b> leading zeros go; <code>::</code> on the longest run; leftmost only for a tie. <b>3. Apply it:</b> Rule 1 gives <code>2001:db8:0:0:7:0:0:0</code>. Runs: hextets 3–4 (two zeros) and 6–8 (three). The longer one wins, so <code>::</code> goes at the end: <b><code>2001:db8:0:0:7::</code></b>. Check: five hextets written, three hidden. <code>2001:db8::7:0:0:0</code> is valid, but it shortens the smaller run.</p>`)}

<h2>Expanding, validating and comparing addresses</h2>
${K.remember(`<b>The expansion rule:</b> count the hextets that are written; the <code>::</code> stands for <b>8 minus that count</b> zero hextets; then pad every hextet on the left to four digits.`)}
<p>Expanding is the safest way into almost any IPv6 question: written as 32 digits in fixed positions, an address can only be read one way.</p>
<h3>Worked examples: expand to all 32 digits</h3>
${K.steps([
  ["<code>2001:db8:a0b:20::1</code>", "Written: 2001, db8, a0b, 20, 1 = 5 hextets → <code>::</code> = 3 zero hextets. Pad: <b><code>2001:0db8:0a0b:0020:0000:0000:0000:0001</code></b>."],
  ["<code>2001:db8::ab:0:0:1</code>", "Written: 2001, db8, ab, 0, 0, 1 = 6 → <code>::</code> = 2. Pad: <b><code>2001:0db8:0000:0000:00ab:0000:0000:0001</code></b>. The written zeros count as hextets too."],
  ["<code>fe80::e1a:2bff:fe00:1</code>", "Written: fe80, e1a, 2bff, fe00, 1 = 5 → <code>::</code> = 3. Pad: <b><code>fe80:0000:0000:0000:0e1a:2bff:fe00:0001</code></b>. (You'll see this exact address on a router shortly.)"],

  ["<code>::1</code>", "Written: 1 → <code>::</code> = 7, all at the front: <b><code>0000:0000:0000:0000:0000:0000:0000:0001</code></b>."],
])}
${K.q({type:"fill", q:"Expand each address to its full form: eight hextets of four digits each.", fields:[
  {label:"2001:db8:ac10::fe01", a:["2001:0db8:ac10:0000:0000:0000:0000:fe01"]},
  {label:"::1", a:["0000:0000:0000:0000:0000:0000:0000:0001"]},
  {label:"2001:db8:0:5::b:0", a:["2001:0db8:0000:0005:0000:0000:000b:0000"]},
  {label:"fe80::20c:29ff:fe3a:5b7e", a:["fe80:0000:0000:0000:020c:29ff:fe3a:5b7e"]}],
  why:"1: four hextets written, so :: = 4 zero hextets. 2: one written, :: = 7. 3: six written (2001, db8, 0, 5, b, 0), so :: = 2 — between 5 and b. 4: five written, :: = 3; 20c pads to 020c. Count the zeros that are written as hextets too; that's the step people skip."})}
<h3>Is it even a valid address?</h3>
<p>Before comparing or configuring an address, check it's legal. An IPv6 address is invalid if:</p>
<ul>
<li>it has <b>more than one <code>::</code></b> (<code>2001:db8::1::5</code>);</li>
<li>a hextet has <b>more than four digits</b> (<code>2001:db8:1ac0f::1</code> — five);</li>
<li>it uses a character that isn't <b>0–9 or a–f</b> (<code>2001:db8:dg::1</code> — g isn't hex);</li>
<li>it has <b>nine or more hextets</b>, or eight hextets <i>plus</i> a <code>::</code> (which must hide at least one): <code>2001:db8:0:0:9::1:2:3</code>;</li>
<li>it has <b>fewer than eight</b> hextets and no <code>::</code> (<code>2001:db8:a0b:10:1</code>).</li>
</ul>
${K.q({type:"multi", q:"Which three of these are valid IPv6 addresses (whether or not they are the canonical form)?", o:["2001:db8::7:0:0:1","2001:db8:0:0:9::1:2:3","2001:DB8:A::B:C","2001:db8::a::1","2001:db8:1ac0f::1","2001:db8:0:0:0:0:0:1","2001:db8:dg::1"], a:[0,2,5], why:"Valid: 2001:db8::7:0:0:1 (canonical); 2001:DB8:A::B:C (upper case is fine, :: hides 3 hextets); 2001:db8:0:0:0:0:0:1 (eight hextets, no :: — valid but not shortened). Invalid: eight hextets plus ::, two ::, a five-digit hextet, and g, which isn't a hex digit."})}
<h3>Comparing two addresses: put both in the same form first</h3>
${K.remember(`<b>The comparison rule:</b> never compare IPv6 addresses as text. Put both into the same form — expand both, or canonicalise both — and compare those.`)}
<p><b>Why?</b> Case, leading zeros and the position of <code>::</code> all vary, so two strings can look different and be one address, or look alike and differ. Comparing text — by eye, in Excel, in a script — fails both ways.</p>
${K.steps([
  ["Pair 1: <code>2001:DB8:0:0:A::1</code> and <code>2001:db8::a:0:0:1</code>", "First: six hextets written, <code>::</code> = 2 after <code>A</code> → <code>2001:0db8:0000:0000:000a:0000:0000:0001</code>. Second: six written, <code>::</code> = 2 after <code>db8</code> → the same 32 digits. <b>One address</b>, despite the case and the <code>::</code> position."],
  ["Pair 2: <code>2001:db8:0:a::1</code> and <code>2001:db8::a:0:1</code>", "First → <code>2001:0db8:0000:000a:0000:0000:0000:0001</code> (a in hextet 4). Second → <code>2001:0db8:0000:0000:0000:000a:0000:0001</code> (a in hextet 6). <b>Different addresses</b>, though they look alike."],
])}
${K.exam(`Reading any IPv6 question: <b>1. Find the prefix length</b> (<code>/64</code>, <code>/48</code>) — it says how many bits matter. <b>2. Expand</b> every address you must compare, at least as far as the bits the prefix covers. <b>3. Count hextets</b> in each answer option: more than one <code>::</code>, a five-digit hextet, a non-hex letter or eight hextets plus <code>::</code> make an option invalid at a glance. Typical traps: a dropped <i>trailing</i> zero (<code>:20:</code> vs <code>:2:</code>), the <code>::</code> on the shorter run, and the same address written two ways offered as &ldquo;different&rdquo;.`)}
<h3>Ask the router: IOS stores bits, not your text</h3>
<p>A router converts the address you type into 128 bits and prints them its own way. On this Lagos router one address is typed in full upper case, the other in messy mixed case. In interface configuration, <code>ipv6 address &lt;address&gt;/&lt;prefix length&gt;</code> gives the interface an IPv6 address (lesson 3 covers it properly); <code>show ipv6 interface brief</code> lists each interface's state and IPv6 addresses:</p>
${K.out(`LOS-R1(config)#interface g0/0
LOS-R1(config-if)#ipv6 address 2001:0DB8:0A0B:0010:0000:0000:0000:0001/64
LOS-R1(config-if)#no shutdown
LOS-R1(config-if)#interface g0/1
LOS-R1(config-if)#ipv6 address 2001:Db8:A0b:00fF::0001/64
LOS-R1(config-if)#no shutdown
LOS-R1(config-if)#end
LOS-R1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::E1A:2BFF:FE00:1
    2001:DB8:A0B:10::1
GigabitEthernet0/1     [up/up]
    FE80::E1A:2BFF:FE00:2
    2001:DB8:A0B:FF::1
GigabitEthernet0/2     [administratively down/down]
    unassigned`, "What you typed is gone: IOS prints both addresses in one consistent style — shortened like RFC 5952, but in upper case.")}
<ul>
<li><code>[up/up]</code> — status/protocol, as in <code>show ip interface brief</code>.</li>
<li><code>FE80::E1A:2BFF:FE00:1</code> — a <b>link-local</b> address IOS created by itself when IPv6 was enabled; every IPv6 interface has one (the address you expanded above — lessons 2 and 3 explain it).</li>
<li><code>2001:DB8:A0B:10::1</code> — the full-form address, printed shortened and upper case; <code>2001:DB8:A0B:FF::1</code> — the mixed-case one, tidied the same way.</li>
<li><code>unassigned</code> — no IPv6 on G0/2, so not even a link-local address.</li>
</ul>
${K.tip(`IOS prints upper case; Windows, Linux and most monitoring tools print lower case. Scripts should parse addresses, not compare strings — in Python, <code>ipaddress.ip_address("2001:DB8::1") == ipaddress.ip_address("2001:0db8:0:0::1")</code> is <code>True</code>, and <code>.compressed</code> / <code>.exploded</code> give the canonical and full forms.`)}
<h3>Try it: one address, many spellings</h3>
<p>The Enugu branch's IP plan arrived as a spreadsheet in full 32-digit form. Configure it on <code>ENU-R1</code> as written, in other spellings and with the plan's mistakes, and read how IOS reacts. <code>show running-config | section interface</code> shows only the interface blocks of the configuration.</p>
${K.term({env:"ios2", title:"configure and read IPv6 addresses on ENU-R1", opts:{kind:"router", host:"ENU-R1", model:"C1111-4P", motd:"ENU-R1 — console session (lab router, no enable secret)."},
  setup:env=>{ env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Predict what IOS will print before every <code>show</code>.",
  tasks:[
    {text:"Staff LAN: <code>interface g0/0</code>, then paste the plan's address exactly as written, full form and upper case — <code>ipv6 address 2001:0DB8:0E40:0010:0000:0000:0000:0001/64</code> (gives the interface this IPv6 address and prefix length) — and <code>no shutdown</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/0"]; return !i.shut && (i.ip6||[]).some(a=>window.IP6.eq(a.addr,"2001:db8:e40:10::1") && a.len===64); }},
    {text:"Server LAN: <code>interface g0/1</code>, type the address in canonical lower case this time — <code>ipv6 address 2001:db8:e40:20::1/64</code> — and <code>no shutdown</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/1"]; return !i.shut && (i.ip6||[]).some(a=>window.IP6.eq(a.addr,"2001:db8:e40:20::1") && a.len===64); }},
    {text:"<code>end</code>, then <code>show ipv6 interface brief</code>. Both addresses come out in the same upper-case, shortened style, however you typed them. Find the FE80 link-local line IOS added to each", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ipv6\s+int\S*\s+br/i.test(l.cmd||"") && /2001:DB8:E40:10::1\n/.test(l.out||"") && /2001:DB8:E40:20::1/.test(l.out||""))},
    {text:"A third spelling of the same address: back in <code>configure terminal</code>, <code>interface g0/0</code>, <code>ipv6 address 2001:db8:e40:10:0:0:0:1/64</code>, then <code>do show ipv6 interface brief</code> (<code>do</code> runs a show command from config mode). Still one line on G0/0 — IOS compared the 128 bits, not your text", done:e=>{ const I=window.IP6, seen=new Set(); let at=-1; e.log.forEach((l,i)=>{ const m=(l.cmd||"").trim().match(/^ipv6\s+ad\S*\s+([0-9a-f:.]+)\/64$/i); if (m && I.eq(m[1],"2001:db8:e40:10::1")){ seen.add(m[1].toLowerCase()); if (seen.size===2 && at<0) at=i; } }); return at>=0 && e.log.some((l,i)=>i>at && /2001:DB8:E40:10::1\n/.test(l.out||"")) && (e.intfs["GigabitEthernet0/0"].ip6||[]).length===1; }},
    {text:"The plan says the CCTV LAN on <code>interface g0/2</code> is <code>2001:db8:e40:10:cc::1/64</code>. Try it, and read IOS's refusal: which 64 bits clash, and with which interface?", done:e=>e.log.some(l=>/is overlapping with 2001:DB8:E40:10::\/64 on GigabitEthernet0\/0/.test(l.out||""))},
    {text:"Someone suggests <code>ipv6 address 2001:db8:e40::30::1/64</code> instead. Try it: why is IOS right to reject it?", done:e=>e.log.some(l=>/^\s*ipv6\s+ad\S*\s+\S*::\S*::/i.test(l.cmd||"") && /Invalid input/.test(l.out||""))},
    {text:"Give G0/2 the intended address, <code>ipv6 address 2001:db8:e40:30::1/64</code>, and <code>no shutdown</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/2"]; return !i.shut && (i.ip6||[]).some(a=>window.IP6.eq(a.addr,"2001:db8:e40:30::1")); }},
    {text:"Management loopback: <code>interface loopback0</code> (a virtual interface that is always up), <code>ipv6 address 2001:db8:e40:0:0:ff:0:1/128</code> (/128 = one single address). Predict where the <code>::</code> will go, then <code>end</code> and <code>show ipv6 interface brief</code>", done:e=>{ const i=e.intfs["Loopback0"]; return !!i && (i.ip6||[]).some(a=>window.IP6.eq(a.addr,"2001:db8:e40::ff:0:1") && a.len===128) && e.log.some(l=>/Loopback0\s+\[up\/up\]\n\s+FE80::\S+\n\s+2001:DB8:E40::FF:0:1/.test(l.out||"")); }},
    {text:"<code>show running-config | section interface</code>: the configuration is saved in IOS's own form too — your full-form typing from task 1 has gone", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+run/i.test(l.cmd||"") && /ipv6 address 2001:DB8:E40:10::1\/64/.test(l.out||""))},
  ],
  win:"You saw IOS turn every spelling into one 128-bit value and print it in its own shortened upper-case form, refuse a second address in G0/0's /64 (the first 64 bits matched), reject two '::', and put the loopback's '::' on the longer zero run while keeping the lone zero.",
  solve:["enable","configure terminal","interface g0/0","ipv6 address 2001:0DB8:0E40:0010:0000:0000:0000:0001/64","no shutdown","interface g0/1","ipv6 address 2001:db8:e40:20::1/64","no shutdown","end","show ipv6 interface brief",
    "configure terminal","interface g0/0","ipv6 address 2001:db8:e40:10:0:0:0:1/64","do show ipv6 interface brief","interface g0/2","ipv6 address 2001:db8:e40:10:cc::1/64","ipv6 address 2001:db8:e40::30::1/64","ipv6 address 2001:db8:e40:30::1/64","no shutdown",
    "interface loopback0","ipv6 address 2001:db8:e40:0:0:ff:0:1/128","end","show ipv6 interface brief","show running-config | section interface"]})}
${K.hint(`Task 5: expand <code>2001:db8:e40:10:cc::1</code> and look only at the first four hextets. Task 8: after Rule 1 the loopback address is <code>2001:db8:e40:0:0:ff:0:1</code> — measure both zero runs.`)}
<p>What happened: the CCTV address <i>looks</i> new, but its first 64 bits, <code>2001:db8:e40:10</code>, are the staff LAN's network — and one network can't be on two interfaces. The loopback became <code>2001:DB8:E40::FF:0:1</code>: the two-zero run got the <code>::</code>, and the lone zero stayed <code>0</code>.</p>
${K.check({q:"An engineer types ipv6 address 2001:0db8:0000:0000:0000:0000:0000:0042/64 on a router interface. How will show ipv6 interface brief print it?", o:["2001:0db8:0000:0000:0000:0000:0000:0042","2001:db8::42","2001:DB8::42","2001:DB8::0042"], a:2, why:"IOS stores 128 bits and prints them shortened (leading zeros removed, the longest zero run as ::) in upper case. 2001:db8::42 is the same address in RFC 5952 lower case, which is how Windows or Linux would print it."})}
${K.job("“14 of 15 branch routers fail the IPv6 audit — and Abuja can't reach the portal”",`
<p><b>The ticket.</b> &ldquo;IPv6 went live on all branches on Saturday. The audit script marks 14 of 15 branch routers <i>IPv6 address mismatch</i>. Abuja staff say the head-office portal (IPv6-only for the new app) won't load. Check before the 10:00 call.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;What does the script compare?&rdquo; — each router's LAN address against the ${K.g("IPAM","IP Address Management: the system or spreadsheet recording which addresses and subnets are assigned where.")} spreadsheet, as text, with the plan in full 32-digit form. &ldquo;What changed for Abuja?&rdquo; — its router was configured by hand; the others were pasted from a template.</p>
<p><b>Checks.</b> A flagged router with no complaints, then Abuja:</p>
${K.out(`KAN-BR1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::E1A:2BFF:FE00:1
    2001:DB8:5A1:10::1
GigabitEthernet0/1     [up/up]
    FE80::E1A:2BFF:FE00:2
    2001:DB8:5A1:FF10::2
GigabitEthernet0/2     [administratively down/down]
    unassigned

ABJ-BR1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::E1A:2BFF:FE00:1
    2001:DB8:5A1:2::1
GigabitEthernet0/1     [up/up]
    FE80::E1A:2BFF:FE00:2
    2001:DB8:5A1:FF20::2
GigabitEthernet0/2     [administratively down/down]
    unassigned`, "Kano and Abuja branch routers. The plan says Kano G0/0 = 2001:0db8:05a1:0010:0000:0000:0000:0001 and Abuja G0/0 = 2001:0db8:05a1:0020:0000:0000:0000:0001.")}
<p><b>Expand, then compare.</b> Kano's <code>2001:DB8:5A1:10::1</code> expands to <code>2001:0db8:05a1:0010:0000:0000:0000:0001</code> — identical to the plan, so the alarm is false: the script compared two spellings as text. Abuja's <code>2001:DB8:5A1:2::1</code> expands to <code>…:05a1:<b>0002</b>:…</code> against the plan's <code>…:<b>0020</b>:…</code> — a dropped <i>trailing</i> zero that moves the branch LAN into a different /64. The laptops built their addresses from the router's prefix, so they're in <code>2001:db8:5a1:2::/64</code> too, and the head-office firewall only admits the plan's branch prefixes. That's the real fault.</p>
<p><b>The fix.</b> With the change approved, on ABJ-BR1: <code>configure terminal</code>, <code>interface g0/0</code>, <code>no ipv6 address 2001:db8:5a1:2::1/64</code> (removes the wrong address), <code>ipv6 address 2001:db8:5a1:20::1/64</code>, <code>end</code>; <code>show ipv6 interface brief</code> shows <code>2001:DB8:5A1:20::1</code>; <code>write memory</code>. The laptops built new addresses from the router's next announcements; two needed reconnecting before they stopped using the old one (lesson 4 explains why). The portal loaded. The script now parses both values before comparing, and the 13 other alarms cleared.</p>
<p><b>What you say.</b> &ldquo;Thirteen alarms were the script comparing two ways of writing the same address; it now compares the addresses themselves. Abuja had a real typo — one missing zero put the branch in the wrong network, which the firewall correctly blocked. That's fixed and staff can reach the portal.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;IPv6 audit: 13 false positives — script compared plan (full form) to IOS output (compressed, upper case) as strings; changed to parse with ipaddress before comparing. ABJ-BR1 G0/0 had 2001:db8:5a1:2::1/64, plan 2001:db8:5a1:20::1/64 (trailing zero dropped). Corrected and saved 09:42; laptops now in 2001:db8:5a1:20::/64, portal OK. Suggest templates/paste for all address changes. 35 min.&rdquo;</i></p>`)}
${K.check({q:"Which pair is the SAME IPv6 address?", o:["2001:db8:0:a::1 and 2001:db8::a:0:1","2001:db8:5a1:20::1 and 2001:db8:5a1:2::1","2001:DB8:0:0:A::1 and 2001:db8::a:0:0:1","2001:db8:a000::1 and 2001:db8:a::1"], a:2, why:"Both expand to 2001:0db8:0000:0000:000a:0000:0000:0001. The first pair puts a in hextet 4 versus hextet 6; the second differs in hextet 4 (0020 vs 0002); the last differs in hextet 3 (a000 vs 000a)."})}
<h3>Same logic, new situation</h3>
<p>A security analyst sees <code>2001:db8:0:0:1::f</code> in a web server's log and <code>2001:db8::1:0:0:f</code> in the asset database. &ldquo;Different machines,&rdquo; she says. Is she right?</p>
${K.hint(`Expand both. Count carefully how many hextets each <code>::</code> hides.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether two spellings are one address. <b>2. Rule:</b> never compare as text — expand both, then compare. <b>3. Apply it:</b> the first has six hextets written (2001, db8, 0, 0, 1, f), so <code>::</code> = 2, between 1 and f: <code>2001:0db8:0000:0000:0001:0000:0000:000f</code>. The second has six written (2001, db8, 1, 0, 0, f), <code>::</code> = 2, between db8 and 1: <code>2001:0db8:0000:0000:0001:0000:0000:000f</code>. <b>Identical — one machine.</b> The canonical form is <code>2001:db8::1:0:0:f</code> (two tied runs, leftmost shortened); the log used the right-hand run, which is legal but not canonical.</p>`)}

<h2>Prefix notation, /64 and the 64/64 split</h2>
${K.remember(`<b>The prefix rule:</b> <code>/n</code> after an address means <b>the first n bits are the network prefix</b>; the remaining bits identify one interface on that network. On a LAN, n is <b>64</b>: the first four hextets say <i>which network</i>, the last four say <i>which device</i>.`)}
<p>This is Module 3's prefix length, unchanged. IPv6 has no dotted masks — IOS won't accept one — so every address and route is written <code>address/length</code>. The bits after the prefix are the ${K.g("interface ID","The host part of an IPv6 address: the bits after the prefix. On a /64, the last four hextets.")}, IPv6's name for the host bits.</p>
${K.svg("0 0 760 270",
  K.txt(380,24,"2001:db8:a0b:10:20c:29ff:fe3a:5b7e/64",{c:"fg",s:14,mid:true,b:true})+
  ["2001","0db8","0a0b","0010","020c","29ff","fe3a","5b7e"].map((h,i)=>K.band(22+i*90,40,84,28,h,i<4?"var(--chip)":"var(--panel2)")).join("")+
  K.box(22,82,354,52,"Prefix — first 64 bits","which network: 2001:db8:a0b:10::/64",true)+
  K.box(382,82,354,52,"Interface ID — last 64 bits","which device on it: 20c:29ff:fe3a:5b7e")+
  K.box(22,158,264,48,"Global routing prefix · /48","from the ISP or registry: 2001:db8:a0b")+
  K.box(292,158,84,48,"Subnet ID","16 bits: 0010")+
  K.arrow(150,136,150,156)+K.arrow(334,136,334,156)+
  K.txt(560,176,"Lesson 2: one /48 holds",{s:11,f:"body",c:"fg",mid:true})+K.txt(560,192,"65,536 of these /64 LANs",{s:11,f:"body",c:"fg",mid:true})+
  K.txt(380,240,"Same idea as IPv4's network and host bits, but on LANs the split is always at bit 64.",{c:"muted",s:11,mid:true,f:"body"}),
  "The 64/64 split of a LAN address. The prefix (top left) is usually a /48 site prefix from the ISP plus a 16-bit subnet ID chosen by you — lesson 2 builds addressing plans from it.")}
<h3>Finding the prefix of an address</h3>
<p>As with IPv4 subnets in Module 3: keep the first <i>n</i> bits, set the rest to zero. When <i>n</i> is a multiple of 4 it ends on a hex digit — keep <b>n ÷ 4</b> digits and zero the rest.</p>
${K.steps([
  ["The address: <code>2001:db8:a0b:10:20c:29ff:fe3a:5b7e/64</code>", "Expand enough to see the digits: <code>2001:0db8:0a0b:0010:020c:29ff:fe3a:5b7e</code>."],
  ["/64 → keep 64 ÷ 4 = 16 digits (4 hextets)", "<code>2001:0db8:0a0b:0010</code> then zeros → <b><code>2001:db8:a0b:10::/64</code></b>. The interface ID is <code>20c:29ff:fe3a:5b7e</code>."],
  ["/48 → keep 12 digits (3 hextets)", "<b><code>2001:db8:a0b::/48</code></b> — the whole site."],
  ["/56 on <code>2001:db8:a0b:34cd::1</code> → keep 14 digits", "Hextet 4 is <code>34cd</code>: keep <code>34</code>, zero <code>cd</code> → <b><code>2001:db8:a0b:3400::/56</code></b>. A /56 is a common size for a small site or a home."],
  ["Prefixes have the host bits zero", "So they usually end in <code>::</code>: <code>2001:db8:a0b:10::1/64</code> is an <i>address</i> with its length; <code>2001:db8:a0b:10::/64</code> is the <i>network</i>."],
])}
${K.mistake(`Deciding whether two addresses share a /64 by glancing at the start of the text. <code>2001:db8:a0b:10::1</code> and <code>2001:db8:a0b:1::1</code> both &ldquo;start with 2001:db8:a0b:1&rdquo;, but hextet 4 is <code>0010</code> in one and <code>0001</code> in the other — different networks. Expand the first four hextets, then compare.`)}
<h3>Why every LAN is a /64</h3>
<p>In IPv4 you sized each subnet to its hosts because addresses were scarce. In IPv6 <b>every LAN gets a /64</b>, whether it holds 3 devices or 3,000:</p>
<ul>
<li><b>Hosts build their own 64-bit interface ID.</b> ${K.g("SLAAC","Stateless Address Autoconfiguration: an IPv6 host hears the router's prefix and creates the rest of its address itself — no DHCP server. Lesson 4.")}, the way laptops and phones give themselves an address, adds 64 bits to the /64 the router announces. On any other length it doesn't work.</li>
<li><b>The standards expect it.</b> RFC 4291 gives ordinary unicast addresses a 64-bit interface ID.</li>
<li><b>Scarcity is gone.</b> A /48 holds 65,536 /64s, and one fixed size keeps plans simple: subnet ID = which LAN, interface ID = which device.</li>
</ul>
<p>Router-to-router links may use other sizes — some networks use /127 (RFC 6164) — but for every LAN, think /64.</p>
${K.q({type:"fill", q:"For the address 2001:db8:c0f:7e21:3c4d:5e6f:7a8b:9c0d, write each prefix (with its /length) and the interface ID.", fields:[
  {label:"Its /64 prefix", a:["2001:db8:c0f:7e21::/64","2001:db8:c0f:7e21:0:0:0:0/64","2001:db8:c0f:7e21::0:0:0/64","2001:db8:c0f:7e21::0:0/64","2001:db8:c0f:7e21::0/64","2001:db8:c0f:7e21:0::0:0/64","2001:db8:c0f:7e21:0::0/64","2001:db8:c0f:7e21:0::/64","2001:db8:c0f:7e21:0:0::0/64","2001:db8:c0f:7e21:0:0::/64","2001:db8:c0f:7e21:0:0:0::/64","2001:0db8:0c0f:7e21:0000:0000:0000:0000/64","2001:0db8:0c0f:7e21::0000:0000:0000/64","2001:0db8:0c0f:7e21::0000:0000/64","2001:0db8:0c0f:7e21::0000/64","2001:0db8:0c0f:7e21::/64","2001:0db8:0c0f:7e21:0000::0000:0000/64","2001:0db8:0c0f:7e21:0000::0000/64","2001:0db8:0c0f:7e21:0000::/64","2001:0db8:0c0f:7e21:0000:0000::0000/64","2001:0db8:0c0f:7e21:0000:0000::/64","2001:0db8:0c0f:7e21:0000:0000:0000::/64"]},
  {label:"Its /48 prefix", a:["2001:db8:c0f::/48","2001:db8:c0f:0:0:0:0:0/48","2001:db8:c0f::0:0:0:0/48","2001:db8:c0f::0:0:0/48","2001:db8:c0f::0:0/48","2001:db8:c0f::0/48","2001:db8:c0f:0::0:0:0/48","2001:db8:c0f:0::0:0/48","2001:db8:c0f:0::0/48","2001:db8:c0f:0::/48","2001:db8:c0f:0:0::0:0/48","2001:db8:c0f:0:0::0/48","2001:db8:c0f:0:0::/48","2001:db8:c0f:0:0:0::0/48","2001:db8:c0f:0:0:0::/48","2001:db8:c0f:0:0:0:0::/48","2001:0db8:0c0f:0000:0000:0000:0000:0000/48","2001:0db8:0c0f::0000:0000:0000:0000/48","2001:0db8:0c0f::0000:0000:0000/48","2001:0db8:0c0f::0000:0000/48","2001:0db8:0c0f::0000/48","2001:0db8:0c0f::/48","2001:0db8:0c0f:0000::0000:0000:0000/48","2001:0db8:0c0f:0000::0000:0000/48","2001:0db8:0c0f:0000::0000/48","2001:0db8:0c0f:0000::/48","2001:0db8:0c0f:0000:0000::0000:0000/48","2001:0db8:0c0f:0000:0000::0000/48","2001:0db8:0c0f:0000:0000::/48","2001:0db8:0c0f:0000:0000:0000::0000/48","2001:0db8:0c0f:0000:0000:0000::/48","2001:0db8:0c0f:0000:0000:0000:0000::/48"]},
  {label:"Its /56 prefix", a:["2001:db8:c0f:7e00::/56","2001:db8:c0f:7e00:0:0:0:0/56","2001:db8:c0f:7e00::0:0:0/56","2001:db8:c0f:7e00::0:0/56","2001:db8:c0f:7e00::0/56","2001:db8:c0f:7e00:0::0:0/56","2001:db8:c0f:7e00:0::0/56","2001:db8:c0f:7e00:0::/56","2001:db8:c0f:7e00:0:0::0/56","2001:db8:c0f:7e00:0:0::/56","2001:db8:c0f:7e00:0:0:0::/56","2001:0db8:0c0f:7e00:0000:0000:0000:0000/56","2001:0db8:0c0f:7e00::0000:0000:0000/56","2001:0db8:0c0f:7e00::0000:0000/56","2001:0db8:0c0f:7e00::0000/56","2001:0db8:0c0f:7e00::/56","2001:0db8:0c0f:7e00:0000::0000:0000/56","2001:0db8:0c0f:7e00:0000::0000/56","2001:0db8:0c0f:7e00:0000::/56","2001:0db8:0c0f:7e00:0000:0000::0000/56","2001:0db8:0c0f:7e00:0000:0000::/56","2001:0db8:0c0f:7e00:0000:0000:0000::/56"]},
  {label:"Its interface ID on a /64 (last four hextets)", a:["3c4d:5e6f:7a8b:9c0d"]}],
  why:"/64 keeps 16 hex digits: 2001:db8:c0f:7e21::/64. /48 keeps 12: 2001:db8:c0f::/48. /56 keeps 14 — in hextet 4 keep 7e and zero 21: 2001:db8:c0f:7e00::/56. The interface ID is the last 64 bits, 3c4d:5e6f:7a8b:9c0d. Any equivalent spelling (case, leading zeros, :: placement) is accepted for the prefixes."})}
${K.myth([
  ["IPv6 is IPv4 with longer addresses, so the old subnet-sizing habits apply.","Every LAN is a /64 regardless of host count; you size by number of LANs, not hosts. Many details also change — no broadcast (multicast instead, lesson 2), and hosts can address themselves (lesson 4)."],
  ["You can drop any zeros you like when shortening.","Only leading zeros in a hextet, plus one run of whole zero hextets as ::. Dropping a trailing zero changes the address."],

  ["Without NAT, IPv6 devices are exposed to the whole internet.","Reachable is not the same as allowed. A stateful firewall blocks unsolicited inbound traffic on IPv6 exactly as on IPv4 — NAT was never the security control."],
  ["IPv6 will replace IPv4 on a set date.","There is no switch-off day. Networks run dual stack, often for many years, and remove IPv4 only when nothing needs it."],
])}
${K.dodont([
  "Write addresses in docs and tickets in RFC 5952 canonical lower case.",
  "Expand or parse addresses before comparing them — by eye, in spreadsheets, in scripts.",
  "Give every LAN a /64 and plan by subnet ID; use 2001:db8::/32 in examples.",
  "Write IPv6 firewall rules from day one of dual stack, matching your IPv4 policy.",
],[
  "Don't retype a 32-digit address — copy and paste it.",
  "Don't drop trailing zeros or use :: twice.",
  "Don't size IPv6 LANs by host count out of IPv4 habit.",
  "Don't treat IPv6 as optional: dual-stack hosts are already using it.",
])}
${K.dyk(`<code>2001:db8::/32</code> is reserved for documentation (RFC 3849), so examples in books can never clash with a real network if pasted into a router. IPv4's equivalents are 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24.`)}
${K.case("Remote CCTV after the ISP moved to CGNAT",`
<p>A logistics company in Ikeja records its warehouse ${K.g("CCTV","Closed-circuit television: a private camera system recorded on site.")} on an ${K.g("NVR","Network Video Recorder: the box that stores camera footage and lets authorised people view it.")}. A security firm across Lagos watched it through a port-forwarding rule on the warehouse router — until one evening the view stopped. Nothing on site had changed.</p>
<p><b>What happened.</b> The router's outside address was now <code>100.64.37.12</code>, from the CGNAT range: the ISP had moved business broadband behind CGNAT. The forwarding rule was intact but unreachable — the public address belonged to the ISP, shared by hundreds of customers.</p>
<p><b>The options.</b> (1) Pay monthly for a public IPv4 address. (2) Send all video through the NVR vendor's cloud relay. (3) Turn on IPv6, which the ISP offered free with a /56.</p>
<p><b>The decision.</b> Dual stack. The NVR got a global IPv6 address, and the firewall allows inbound HTTPS to it <i>only</i> from the security firm's IPv6 prefix. The twist: the firm's own office was IPv4-only, and end-to-end IPv6 needs IPv6 at <b>both</b> ends — so the relay ran for three months until the firm's ISP enabled IPv6, then was switched off.</p>
<p><b>Lessons.</b> NAT had hidden the NVR by accident; now a written rule protects it on purpose and names who may connect. IPv6 restored direct reachability without a monthly bill — once both sides had it, which is dual stack's everyday reality.</p>`)}
${K.check({q:"Which two addresses are in the same /64?", o:["2001:db8:a0b:10::1 and 2001:db8:a0b:1::1","2001:db8:a0b:10::1 and 2001:DB8:A0B:10:FFFF::9","2001:db8:a0b:10::1 and 2001:db8:a0b:100::1","2001:db8:a0b:10::1 and 2001:db8:a0b::10:1"], a:1, why:"Compare the first four hextets after expanding. 2001:DB8:A0B:10:FFFF::9 has 2001:0db8:0a0b:0010 — the same /64 (case is irrelevant). The others have hextet 4 = 0001, 0100 and 0000 (2001:db8:a0b::10:1 expands to 2001:0db8:0a0b:0000:0000:0000:0010:0001)."})}
<h3>Same logic, new situation</h3>
<p>Head office's firewall allows the Abuja LAN with a rule for <code>2001:0DB8:05A1:0020::/64</code>. Two laptops connect: <code>2001:db8:5a1:20:9c4e:1fff:fe02:77a1</code> and <code>2001:db8:5a1:200::9</code>. Which does the rule match?</p>
${K.hint(`A /64 rule compares exactly the first four hextets. Pad hextet 4 of each laptop to four digits.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether two addresses fall inside one /64. <b>2. Rule:</b> /64 = the first 64 bits, the first four hextets; compare them after expanding. <b>3. Apply it:</b> the rule's first four hextets are <code>2001:0db8:05a1:0020</code>. Laptop 1: <code>2001:0db8:05a1:0020</code> — <b>matches</b> (the upper-case, zero-padded rule and the lower-case address are the same bits). Laptop 2: hextet 4 is <code>200</code> → <code>0200</code>, not <code>0020</code> — <b>no match</b>; it's in a different LAN, <code>2001:db8:5a1:200::/64</code>.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Exhaustion, NAT's costs, end to end — and that the firewall is the security, not NAT.`)}
${K.reveal("“We have NAT and everything works. Why should we bother with IPv6?”",`<p>"Because IPv4 has run out and NAT only hides it. Public IPv4 costs money, and ISPs are moving customers behind carrier-grade NAT, which stops inbound access — remote sites, cameras — and makes logs show a shared address instead of the real device. IPv6 gives every device its own global address, so connections work both ways and troubleshooting sees real addresses. Security doesn't get worse: a stateful firewall blocks unsolicited inbound traffic on IPv6 as on IPv4 — NAT was never the security control. And dual-stack laptops already prefer IPv6 when it works, so we must run and secure it rather than ignore it. The realistic plan is dual stack, link by link."</p>`)}
${K.hint(`State the two rules, then the RFC 5952 tie-breakers, and check by counting hextets.`)}
${K.reveal("“Shorten 2001:0db8:0000:0000:0001:0000:0000:0001 and explain the rules you used.”",`<p>"First I drop leading zeros in each hextet: 2001:db8:0:0:1:0:0:1. Then one run of all-zero hextets can become a double colon — only once, because the reader works out its length from what's left. There are two runs of two, a tie, and RFC 5952 says shorten the leftmost: <b>2001:db8::1:0:0:1</b>. Six hextets written, so the double colon hides two. RFC 5952 also says never use it for a single zero hextet, and write lower case; Cisco IOS prints the same shape in upper case."</p>`)}
${K.hint(`SLAAC and the 64-bit interface ID; the standard; no scarcity. Mention the /127 exception.`)}
${K.reveal("“Why is every IPv6 LAN a /64, even one with ten devices?”",`<p>"RFC 4291 defines a 64-bit interface ID for normal unicast addresses, and SLAAC, which hosts use to build their own addresses, only works when the router advertises a /64. Scarcity isn't a reason to go smaller: one /48 gives 65,536 /64s, so we plan by number of LANs, not hosts. A fixed size also keeps plans readable — the fourth hextet is the subnet, the last four the device. The usual exception is router-to-router links, where some networks use a /127."</p>`)}

${K.recap([
  "IPv4's 2^32 (≈ 4.3 billion) addresses have run out; NAT and CGNAT stretched them at the cost of inbound reachability, workarounds and harder troubleshooting.",
  "IPv6 has 2^128 addresses — one /64 LAN holds 2^64 — and restores end-to-end addressing; the firewall decides what's allowed in.",
  "Dual stack — IPv4 and IPv6 together — is the normal reality; hosts prefer IPv6 when the destination has an AAAA record and the path works.",
  "An address is 8 hextets × 16 bits = 128 bits, 32 hex digits; each hex digit is 4 bits. Case doesn't matter.",
  "Rule 1: drop leading zeros in a hextet (never trailing). Rule 2: replace one run of zero hextets with :: — only once. RFC 5952 canonical: longest run, leftmost if tied, never for a lone zero, lower case.",
  "Expand by counting written hextets: :: = 8 minus that count; pad each to four digits. Compare addresses only after expanding or canonicalising both.",
  "/n = the first n bits are the prefix. LANs are always /64: first four hextets = network, last four = interface ID. IOS prints addresses shortened in upper case, Windows in lower case.",
])}
${K.next(`<b>Lesson 2 — IPv6 address types.</b> You can read and write any address; next, tell what kind it is from its first digits: global unicast (and how a /48 becomes 65,536 /64 LANs), unique local, the link-local FE80 addresses you saw on every interface, multicast groups such as ff02::1 and ff02::2, anycast, loopback and unspecified.`)}
`,
quiz:[
  {lvl:1, q:"How many bits are in one hextet of an IPv6 address?", o:["4","8","16","32"], a:2, why:"A hextet is four hex digits, and each hex digit is 4 bits, so 16 bits. Eight hextets make the full 128-bit address. 4 bits is one hex digit (a nibble); 8 bits is an IPv4 octet."},
  {lvl:1, q:"Which is the correct shortened form of 2001:0db8:0000:0000:0000:0000:0000:0a01?", o:["2001:db8::a01","2001:db8::a1","2001:db8:a01","2001:db8::a010"], a:0, why:"Drop leading zeros (0db8 → db8, 0a01 → a01) and replace the run of five zero hextets with ::. a1 drops a zero from the middle of the hextet, which changes the value; 2001:db8:a01 has only three hextets and no ::, so it isn't even valid; a010 adds a trailing zero."},
  {lvl:2, type:"fill", q:"Write the RFC 5952 canonical form of 2001:0db8:0c00:0000:0000:00a0:0000:0001.", fields:[{label:"Canonical form", a:["2001:db8:c00::a0:0:1"]}], why:"Rule 1 gives 2001:db8:c00:0:0:a0:0:1 (c00 keeps its trailing zeros). The zero runs are hextets 4–5 (two) and hextet 7 (one). The two-hextet run becomes ::, and the lone zero stays as 0: 2001:db8:c00::a0:0:1."},
  {lvl:2, type:"fill", q:"Expand 2001:db8:c::d0:1 to its full form (eight hextets of four digits).", fields:[{label:"Full form", a:["2001:0db8:000c:0000:0000:0000:00d0:0001"]}], why:"Five hextets are written (2001, db8, c, d0, 1), so :: stands for 8 − 5 = 3 zero hextets, placed between c and d0. Then pad each hextet on the left: 2001:0db8:000c:0000:0000:0000:00d0:0001."},
  {lvl:2, type:"multi", q:"Which two of these are valid IPv6 addresses, even if not written in the shortest form? (Choose two.)", o:["2001:db8:c00:0:0:a0::1","::","2001:db8::1::","2001:db8:0:0:0:0:0:0:1","2001::db8::1","2001:db8:abcd:12345::"], a:[0,1], why:"2001:db8:c00:0:0:a0::1 is valid: seven hextets written, so :: hides one (legal, though RFC 5952 wouldn't use :: for a single zero). :: is the all-zeros unspecified address. Two ::, nine hextets, and a five-digit hextet (12345) are all invalid."},
  {lvl:1, type:"match", q:"Match each item with its size.", pairs:[["One hex digit","4 bits"],["One hextet","16 bits"],["A whole IPv4 address","32 bits"],["A /64 prefix","64 bits (the first four hextets)"],["A whole IPv6 address","128 bits"]], why:"A hex digit is a nibble of 4 bits; four of them make a 16-bit hextet; eight hextets make 128 bits. A /64 is half the address — the first four hextets, 16 hex digits. IPv4 is 32 bits in four octets."},
  {lvl:2, type:"order", q:"Put these from the fewest addresses (first) to the most (last).", items:["One IPv4 /24 LAN","The entire IPv4 address space","One IPv6 /64 LAN","One IPv6 /56","One IPv6 /48 site"], why:"A /24 has 2^8 = 256 addresses; all of IPv4 is 2^32; an IPv6 /64 is 2^64 (2^32 times all of IPv4); a /56 is 2^72 (256 /64s); a /48 is 2^80 (65,536 /64s). In IPv6 a shorter prefix length means a bigger block, as in IPv4."},
  {lvl:2, q:"The IP plan says the server LAN gateway is 2001:0db8:07c0:0020:0000:0000:0000:0001/64. Based on the exhibit, which interface has that address?", ex:"IKJ-R2#show ipv6 interface brief\nGigabitEthernet0/0     [up/up]\n    FE80::1\n    2001:DB8:7C0:10::1\nGigabitEthernet0/1     [up/up]\n    FE80::1\n    2001:DB8:7C0:2::1\nGigabitEthernet0/2     [up/up]\n    FE80::1\n    2001:DB8:7C0:20::1", o:["GigabitEthernet0/0","GigabitEthernet0/1","GigabitEthernet0/2","None of them"], a:2, why:"Shorten the plan's address: 2001:0db8:07c0:0020:… → 2001:db8:7c0:20::1, which IOS prints as 2001:DB8:7C0:20::1 on G0/2. G0/1's 2001:DB8:7C0:2::1 expands to hextet 4 = 0002, not 0020 — the dropped-trailing-zero trap. (The same FE80::1 on every interface is allowed: link-local addresses only need to be unique on their own link — lesson 2.)"},
  {lvl:3, type:"multi", q:"After an IPv6 rollout, a script compares the IP plan with what each branch router prints and flags all five rows in the exhibit as mismatches. Which two are REAL mismatches? (Choose two.)", ex:"Branch   IP plan (full form)                          Router shows (show ipv6 interface brief, G0/0)\nKAN-BR1  2001:0db8:05a1:0010:0000:0000:0000:0001      2001:DB8:5A1:10::1\nIBD-BR1  2001:0db8:05a1:0050:0000:0000:0000:0001      2001:DB8:5A1:50::10\nKAD-BR1  2001:0db8:05a1:0060:0000:0000:0001:0000      2001:DB8:5A1:60::1:0\nWAR-BR1  2001:0db8:05a1:0700:0000:0000:0000:0001      2001:DB8:5A1:70::1\nENU-BR1  2001:0db8:05a1:0040:0000:0000:0000:0001      2001:DB8:5A1:40::1", o:["KAN-BR1","IBD-BR1","KAD-BR1","WAR-BR1","ENU-BR1"], a:[1,3], why:"Expand each router value. IBD-BR1: 2001:DB8:5A1:50::10 ends 0010, the plan ends 0001 — wrong interface ID. WAR-BR1: 70 expands to 0070, the plan has 0700 — wrong subnet. KAD-BR1 looks odd, but 2001:DB8:5A1:60::1:0 expands to …:0060:0000:0000:0001:0000, exactly the plan. KAN-BR1 and ENU-BR1 differ only in case and compression. The script should parse addresses, not compare text."},
  {lvl:3, type:"fill", q:"A colleague's documentation lists 2001:DB8::1:0:0:0:A. Rewrite it in RFC 5952 canonical form.", fields:[{label:"Canonical form", a:["2001:db8:0:1::a"]}], why:"Expand first: seven hextets written, so :: hides one, after DB8: 2001:db8:0:1:0:0:0:a. The runs are hextet 3 (one zero) and hextets 5–7 (three). The :: belongs on the longest run, and the lone zero is written 0: 2001:db8:0:1::a, in lower case. The original was valid but used :: on a single zero hextet."},
  {lvl:2, type:"fill", q:"A laptop has the address 2001:db8:7c0:44:a1b2:c3ff:fed4:e5f6 on a /64 LAN. Write the LAN's prefix in prefix notation.", fields:[{label:"Prefix", a:["2001:db8:7c0:44::/64","2001:db8:7c0:44:0:0:0:0/64","2001:db8:7c0:44::0:0:0/64","2001:db8:7c0:44::0:0/64","2001:db8:7c0:44::0/64","2001:db8:7c0:44:0::0:0/64","2001:db8:7c0:44:0::0/64","2001:db8:7c0:44:0::/64","2001:db8:7c0:44:0:0::0/64","2001:db8:7c0:44:0:0::/64","2001:db8:7c0:44:0:0:0::/64","2001:0db8:07c0:0044:0000:0000:0000:0000/64","2001:0db8:07c0:0044::0000:0000:0000/64","2001:0db8:07c0:0044::0000:0000/64","2001:0db8:07c0:0044::0000/64","2001:0db8:07c0:0044::/64","2001:0db8:07c0:0044:0000::0000:0000/64","2001:0db8:07c0:0044:0000::0000/64","2001:0db8:07c0:0044:0000::/64","2001:0db8:07c0:0044:0000:0000::0000/64","2001:0db8:07c0:0044:0000:0000::/64","2001:0db8:07c0:0044:0000:0000:0000::/64"]}], why:"A /64 keeps the first four hextets (2001:db8:7c0:44) and sets the interface ID to zero, so the network is 2001:db8:7c0:44::/64. Any equivalent spelling is accepted (upper case, leading zeros, 2001:db8:7c0:44:0:0:0:0/64)."},
  {lvl:2, q:"Which address is NOT in the prefix 2001:db8:7c0:40::/64?", o:["2001:db8:7c0:40::abcd","2001:DB8:7C0:40:0:0:0:1","2001:db8:7c0:0040:ffff::1","2001:db8:7c0:4::40"], a:3, why:"The /64 is the first four hextets, 2001:0db8:07c0:0040. 2001:db8:7c0:4::40 has hextet 4 = 0004 — a different network (the 40 is in the interface ID). The others all have 0040 in hextet 4, whatever their case or leading zeros."},
  {lvl:1, q:"What is the main reason IPv6 was created?", o:["IPv4 is too slow for modern links","The pool of 32-bit IPv4 addresses was too small and has run out","IPv4 cannot carry encrypted traffic","IPv4 does not support routing between networks"], a:1, why:"IPv4's 32 bits give about 4.3 billion addresses — fewer than the people on Earth — and the free pool is exhausted. IPv6's 128-bit addresses remove the shortage. Speed, encryption and routing are not what IPv6 was designed to fix."},
  {lvl:2, type:"multi", q:"Which two statements about dual stack are true? (Choose two.)", o:["An interface can have an IPv4 address and an IPv6 address at the same time","A dual-stack host normally prefers IPv6 when the destination has an IPv6 address and the IPv6 path works","Dual stack translates IPv4 packets into IPv6 packets","Dual stack requires IPv4 to be switched off within a set period","A dual-stack router needs NAT to forward IPv6 traffic"], a:[0,1], why:"Dual stack runs both protocols side by side: interfaces carry both addresses and each conversation uses one or the other, IPv6 being preferred when it works. Translation between them is NAT64, a different tool; there is no deadline to remove IPv4; and IPv6 is routed without NAT."},
  {lvl:3, q:"A Port Harcourt clinic's ISP has moved it behind CGNAT, and a specialist in a Lagos hospital can no longer reach the clinic's imaging server through port forwarding. Both sites' ISPs now offer IPv6. Which plan restores direct access and keeps the server protected?", o:["Enable dual stack at both sites, give the server a global IPv6 address, and allow inbound HTTPS to it on the clinic firewall only from the hospital's IPv6 prefix","Add an IPv6 port-forwarding rule on the clinic router and leave the hospital on IPv4","Switch IPv4 off at the clinic so the ISP has to assign a public IPv4 address","Enable IPv6 at the clinic only; the hospital's IPv4 PCs will reach the server's IPv6 address automatically"], a:0, why:"IPv6 gives the server its own global address, so no translation is needed — but only if both ends speak IPv6 (an IPv4-only PC can't reach an IPv6-only address without a translator). Reachable is not the same as allowed, so a firewall rule limits inbound access to the hospital's prefix. Switching IPv4 off doesn't oblige an ISP to give out public IPv4."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command lists every interface with its status and IPv6 addresses, one address per line?", fields:[{label:"Command", a:["show ipv6 interface brief"], ios:true}], why:"show ipv6 interface brief (abbreviated sh ipv6 int br) prints each interface with [status/protocol] and its link-local and global IPv6 addresses beneath it, in IOS's upper-case shortened form. show ipv6 interface without brief gives full detail (lesson 3)."},
],
cards:[
  {f:"Size of an IPv6 address", b:"128 bits = 8 hextets × 16 bits = 32 hex digits. IPv4 is 32 bits (4 octets × 8 bits)."},
  {f:"Hextet", b:"One of the 8 colon-separated groups in an IPv6 address: 4 hex digits, 16 bits, values 0000–ffff. Each hex digit is a 4-bit nibble."},
  {f:"Why IPv6?", b:"IPv4's 2^32 (about 4.3 billion) addresses ran out — IANA's last free blocks went in 2011. IPv6's 2^128 gives every device a unique global address again, restoring end-to-end addressing."},
  {f:"What NAT and CGNAT cost", b:"No inbound connections without port forwarding (impossible behind CGNAT), applications needing relays, logs showing a shared address, and ISPs running and logging big translation boxes. NAT is not a firewall."},
  {f:"Shortening rule 1", b:"Drop leading zeros in each hextet: 0db8 → db8, 0000 → 0. Never drop trailing zeros: db80 stays db80."},
  {f:"Shortening rule 2", b:"Replace ONE run of consecutive all-zero hextets with ::. Two :: make the address invalid, because the reader couldn't tell how many zeros each hides."},
  {f:"RFC 5952 canonical form", b:"Leading zeros dropped, :: on the longest zero run (leftmost if tied), never :: for a single zero hextet, lower case. The five Ls: Leading, Longest, Leftmost, Lone zero, Lower case."},
  {f:"Expanding an address", b:"Count the hextets written; :: = 8 minus that count, as zero hextets; pad every hextet on the left to 4 digits. Example: 2001:db8:c::d0:1 = 2001:0db8:000c:0000:0000:0000:00d0:0001."},
  {f:"Comparing IPv6 addresses", b:"Never compare as text. Expand (or canonicalise) both, then compare. 2001:DB8:0:0:A::1 and 2001:db8::a:0:0:1 are the same address."},
  {f:"Prefix notation", b:"/n = the first n bits are the network prefix, the rest the interface ID. No dotted masks in IPv6. A prefix is written with the host bits zero, e.g. 2001:db8:a0b:10::/64."},
  {f:"Why every LAN is a /64", b:"SLAAC builds a 64-bit interface ID and needs a /64; RFC 4291 defines 64-bit interface IDs for normal unicast; and a /48 site still holds 65,536 /64s. Some router links use /127."},
  {f:"Dual stack", b:"IPv4 and IPv6 running side by side on the same devices and links. Hosts prefer IPv6 when the destination has an AAAA record and the IPv6 path works, and fall back to IPv4."},
  {f:"How IOS and Windows print IPv6", b:"Both store 128 bits and print them shortened. IOS uses upper case (2001:DB8:A0B:10::1), Windows lower case (2001:db8:a0b:10::1). Your typing style isn't kept."},
  {f:"2001:db8::/32", b:"The IPv6 documentation prefix (RFC 3849), for examples and labs only. IPv4 equivalents: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24."},
],
});

// ---------- Module 6 · Lesson 2 ----------
L.push({
id:"ipv6-types", mins:95, level:"Intermediate · builds on Modules 3 and 5 and lesson 1",
t:"IPv6 address types: global unicast, unique local, link-local, multicast, anycast — and planning subnets from a /48",
html:`
${K.goals([
  "Name the type of any IPv6 address from its first hextet — global unicast, unique local, link-local, multicast, loopback, unspecified — and say who can reach it.",
  "Split a global unicast address into global routing prefix, subnet ID and interface ID, and say who assigns each part.",
  "Plan /64 subnets from a /48 or a /56 on hex-digit boundaries, summarise a site in one prefix, and put a plan on a router.",
  "Explain why every IPv6 interface has a link-local address, and prove on a router that it works on its own link and nowhere else.",
  "Name the well-known multicast groups (ff02::1, ff02::2, solicited-node), work out a solicited-node address, and explain anycast, ::1 and ::.",
])}
${K.pre(["Lesson 1 of this module: reading, writing and shortening IPv6 addresses, prefix notation, and why every LAN is a /64.","Module 3: hexadecimal, binary and IPv4 subnetting.","Module 5 lesson 1: the routing table and longest match."])}

<h2>Why this matters at work</h2>
<p>Monday, 09:00, at a managed-service provider in Lagos. A microfinance bank with fourteen branches has been switched on for IPv6, and the ISP's handover email has one important line: <code>Your allocation: 2001:db8:7c00::/48</code>. Your manager wants an addressing plan by Friday. Then the help desk forwards a screenshot from a teller's laptop showing three IPv6 addresses — starting <code>fe80</code>, <code>2001</code> and <code>fd</code> — asking &ldquo;which one is the real one?&rdquo;</p>
<p>All three are real. An IPv6 interface normally has several addresses, each with a different <b>reach</b>: the whole internet, your organisation, or only the cable it's plugged into. The first hex digits tell you which. And a plan written one hex digit at a time makes routes, firewall rules and tickets easy. This lesson gives you both skills.</p>

<h2>Recognising any IPv6 address at a glance</h2>
${K.remember(`<b>The rule:</b> an IPv6 address's type is fixed by its <b>first bits</b>, so the <b>first hextet</b>, written in full, tells you who can reach it: the whole internet, your organisation, your link, or a group of listeners.`)}
<p>IPv4 had the same ideas scattered about (public, private 10/8 and friends, 127.0.0.1, 169.254, multicast, broadcast). IPv6 drops broadcast and puts each type behind a fixed prefix at the front. <b>Why the front?</b> Because those are the bits every router reads first: if link-local means &ldquo;inside fe80::/10&rdquo;, &ldquo;never forward this&rdquo; is the same prefix match the router already does for every packet (Module 5). The type is a routing decision.</p>
<div class="tablewrap"><table>
<tr><th>Type</th><th>Prefix</th><th>First hextet</th><th>Who can reach it</th><th>IPv4 cousin</th><th>Example</th></tr>
<tr><td><b>${K.g("Global unicast","GUA: unique on the whole internet and routed everywhere — IPv6's 'public address'. Assigned from 2000::/3.")}</b> (GUA)</td><td><code>2000::/3</code></td><td><code>2xxx</code>, <code>3xxx</code></td><td>The whole internet</td><td>Public address</td><td><code>2001:db8:7c00:100::1</code></td></tr>
<tr><td><b>${K.g("Unique local","ULA: for use inside one organisation, routed between its sites, never on the internet. fc00::/7, in practice fd00::/8 (RFC 4193).")}</b> (ULA)</td><td><code>fc00::/7</code></td><td><code>fdxx</code></td><td>Your organisation</td><td>10.0.0.0/8 etc.</td><td><code>fd5c:21e0:8b44:100::1</code></td></tr>
<tr><td><b>${K.g("Link-local","Valid only on one link (one cable or VLAN). Every IPv6 interface has one automatically. fe80::/10; never forwarded by routers.")}</b></td><td><code>fe80::/10</code></td><td><code>fe80</code></td><td>The same link only</td><td>169.254.x.x, roughly</td><td><code>fe80::1</code></td></tr>
<tr><td><b>${K.g("Multicast","An address naming a group: one packet reaches every member. IPv6 uses it instead of broadcast. ff00::/8.")}</b></td><td><code>ff00::/8</code></td><td><code>ffxx</code></td><td>Group members, within its scope</td><td>224.0.0.0/4</td><td><code>ff02::1</code></td></tr>
<tr><td><b>Loopback</b></td><td><code>::1/128</code></td><td><code>0000</code>, ends in 1</td><td>This device</td><td>127.0.0.1</td><td><code>::1</code></td></tr>
<tr><td><b>Unspecified</b></td><td><code>::/128</code></td><td>all zeros</td><td>Nobody: &ldquo;no address yet&rdquo;</td><td>0.0.0.0</td><td><code>::</code></td></tr>
</table></div>
<p><b>Anycast</b> has no range of its own; it borrows unicast addresses (section 6). Every example here uses <code>2001:db8::/32</code>, the ${K.g("documentation prefix","2001:db8::/32, reserved by RFC 3849 for examples and never routed, so examples can't clash with real networks.")}: carved out of 2000::/3, but never routed.</p>
${K.svg("0 0 760 280",
  K.txt(380,22,"The first hextet decides the type (widths not to scale)",{c:"fg",s:12.5,mid:true,f:"body",b:true})+
  K.box(20,40,150,56,"0000 – 1FFF","::  ::1  (rest reserved)")+
  K.box(176,40,150,56,"2000 – 3FFF","global unicast",true)+
  K.box(332,40,120,56,"4000 – FBFF","unassigned (future)")+
  K.box(458,40,96,56,"FC00 – FDFF","unique local",true)+
  K.box(560,40,90,56,"FE80 – FEBF","link-local",true)+
  K.box(656,40,84,56,"FF00 – FFFF","multicast",true)+
  K.txt(95,122,"this device / none",{mid:true,c:"fg",s:11})+K.txt(251,122,"the whole internet",{mid:true,c:"fg",s:11})+K.txt(392,122,"—",{mid:true,c:"muted",s:11})+
  K.txt(506,122,"your organisation",{mid:true,c:"fg",s:11})+K.txt(605,122,"one link",{mid:true,c:"fg",s:11})+K.txt(698,122,"a group",{mid:true,c:"fg",s:11})+
  K.txt(95,142,"::1 · ::",{mid:true,s:10.5})+K.txt(251,142,"2001:db8:7c00:100::1",{mid:true,s:10.5})+K.txt(506,142,"fd5c:21e0:8b44::1",{mid:true,s:10.5})+K.txt(605,142,"fe80::1",{mid:true,s:10.5})+K.txt(698,142,"ff02::1",{mid:true,s:10.5})+
  K.arrow(200,175,640,175,"reach shrinks as the first hextet climbs: world → organisation → one link",true)+
  K.txt(20,215,"In binary: 2000::/3 = first 3 bits 001 (hex 2 or 3) · fc00::/7 = 1111 110 (fc or fd) · fe80::/10 = 1111 1110 10 (fe8 to feb) · ff00::/8 = 1111 1111",{c:"muted",s:10.5,f:"body"})+
  K.txt(20,240,"Classify only after writing the first hextet with all four digits: fd::1 is 00fd:: — not unique local.",{c:"bad",s:11,f:"body"})+
  K.txt(20,265,"Only 2000::/3 — one eighth of all IPv6 space — is handed out as global unicast today.",{c:"muted",s:10.5,f:"body"}),
  "The IPv6 address map by first hextet: each type is a prefix, matched like any route.")}
<h3>Why &ldquo;starts with 2 or 3&rdquo;? Read the prefix in binary</h3>
${K.steps([
  ["Find the fixed bits","2000::/3: 2000 hex = <code>0010 0000 …</code>, and /3 fixes only the first 3 bits, <code>001</code>. A first hex digit of <code>0010</code> (2) or <code>0011</code> (3) keeps them, so every GUA starts with 2 or 3."],
  ["Same method for the others","fc00::/7 fixes <code>1111 110</code> → fc or fd. fe80::/10 fixes <code>1111 1110 10</code> → fe8 to feb (in practice fe80). ff00::/8 fixes all eight → ff."],
  ["Never skip leading zeros","The rule is about the <b>full</b> hextet: <code>2::1</code> is <code>0002::1</code> and <code>ff::1</code> is <code>00ff::1</code> — neither is global unicast nor multicast."],
])}
${K.remember(`<b>&ldquo;2-3 world, fd firm, fe80 floor, ff flock.&rdquo;</b> 2xxx/3xxx = the world (GUA). fd = your firm (ULA). fe80 = this floor, this link. ff = a flock that asked to listen (multicast). ::1 = me, :: = nobody yet.`)}
${K.exam(`Reading any IPv6 question: <b>expand before you compare.</b> Write the first hextet with all four digits before classifying (<code>fd::1</code> is 00fd — not a ULA), and find the <b>prefix length</b> before deciding which part is the subnet. Trap options love dropped leading zeros.`)}
${K.q({type:"match", q:"Match each address with its type.", pairs:[["FE80::21A:2BFF:FE3C:4D5E","Link-local unicast"],["2001:DB8:7C00:1200::25","Global unicast"],["fd4a:10c3:77e1:50::20","Unique local"],["ff02::1:ff3c:4d5e","Multicast"],["::1","Loopback"],["::","Unspecified"]], why:"Read the first hextet in full. FE80 = link-local. 2001 starts with 2 = global unicast. fd = unique local. ff = multicast (this one is a solicited-node group, section 6). ::1 = loopback; :: = unspecified. Case doesn't matter: Cisco prints upper case, Windows lower case."})}
${K.check({q:"Which of these is a unique local address?", o:["fd::1","fdab:12:3::1","fe80::fd","2fd0::1"], a:1, why:"fdab:12:3::1 starts with fd → fd00::/8. fd::1 expands to 00fd:… (reserved, not a ULA). fe80::fd is link-local — the fd is in the interface ID. 2fd0::1 starts with 2 → global unicast range."})}
<h3>Same logic, new situation</h3>
<p>A monitoring script marks every address beginning with &ldquo;f&rdquo; as &ldquo;private, ignore&rdquo;. It sees <code>fe80::1</code>, <code>ff02::2</code>, <code>fd12:9a::7</code> and <code>f::1</code>. Which has it misjudged?</p>
${K.hint(`Classify each by its full first hextet, then ask whether &ldquo;private&rdquo; fits that type.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether &ldquo;starts with f = private&rdquo; holds for each. <b>2. Rule:</b> type comes from the first bits of the full first hextet. <b>3. Apply it:</b> only <code>fd12:9a::7</code> (unique local) is private in the IPv4 sense. <code>fe80::1</code> is link-local, a one-link address every interface has; <code>ff02::2</code> is a multicast group (all routers); <code>f::1</code> is <code>000f::1</code>, reserved space. Right about one of four — match prefixes (fd00::/8, fe80::/10, ff00::/8), never first letters.</p>`)}

<h2>Global unicast addresses: who owns which part</h2>
${K.remember(`<b>The rule:</b> read a global unicast address in three parts. The <b>global routing prefix</b> says <i>which organisation</i> — handed to you through a registry and your ISP. The <b>subnet ID</b> says <i>which of your subnets</i> — you choose it. The <b>interface ID</b> says <i>which device</i> — the device or you choose it.`)}
<p>This is Module 3's &ldquo;network part + host part&rdquo;, with the network part split into the bit you are <i>given</i> and the bit you <i>plan</i>. With a /48 site and /64 LANs, the split falls on hextet boundaries: 48 + 16 + 64 = 128.</p>
${K.svg("0 0 760 270",
  K.txt(20,22,"First 64 bits = this LAN's prefix: 2001:db8:7c00:1200::/64",{c:"fg",s:11.5,f:"body",b:true})+
  K.band(20,34,270,32,"2001 : 0db8 : 7c00","var(--chip)")+K.band(296,34,90,32,"1200","var(--chip)")+K.band(392,34,348,32,"0000 : 0000 : 0000 : 0025","var(--panel2)")+
  K.txt(155,88,"Global routing prefix · 48 bits",{mid:true,c:"fg",s:11.5,f:"body",b:true})+K.txt(155,104,"from IANA → registry → your ISP",{mid:true,s:10.5,f:"body"})+
  K.txt(341,88,"Subnet ID · 16",{mid:true,c:"fg",s:11.5,f:"body",b:true})+K.txt(341,104,"you choose",{mid:true,s:10.5,f:"body"})+
  K.txt(566,88,"Interface ID · 64 bits",{mid:true,c:"fg",s:11.5,f:"body",b:true})+K.txt(566,104,"SLAAC, DHCPv6 or typed (::1 for a router)",{mid:true,s:10.5,f:"body"})+
  K.box(20,150,104,52,"IANA","all of 2000::/3",true)+K.box(144,150,104,52,"RIR","e.g. AFRINIC")+K.box(268,150,104,52,"ISP (LIR)","a /32 or larger")+
  K.box(392,150,104,52,"Your site","/48 (or /56)",true)+K.box(516,150,104,52,"One LAN","/64")+K.box(640,150,104,52,"One device","/128")+
  K.arrow(124,176,142,176)+K.arrow(248,176,266,176)+K.arrow(372,176,390,176)+K.arrow(496,176,514,176)+K.arrow(620,176,638,176)+
  K.txt(380,232,"Each level hands a smaller block to the next, so the internet carries one route per ISP block, not one per customer —",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,250,"route aggregation, the summary-route idea from Module 5. Sizes shown are typical, not fixed.",{mid:true,c:"fg",s:11,f:"body"}),
  "One GUA in three parts, and where the prefix comes from.")}
<p><b>Where the prefix comes from.</b> ${K.g("IANA","Internet Assigned Numbers Authority: holds the global address pool.")} gives large blocks to the five ${K.g("RIRs","Regional Internet Registries: AFRINIC, RIPE NCC, ARIN, APNIC, LACNIC.")} (Regional Internet Registries — AFRINIC for Africa). They allocate to ISPs, which act as ${K.g("LIRs","Local Internet Registries: usually ISPs, which pass smaller blocks to customers.")} (Local Internet Registries), commonly a /32 or larger. The ISP assigns each site a block — commonly a <b>/48</b> for a business, a <b>/56</b> for a small office or home (check your contract). You split it into <b>/64</b>s, one per LAN or link, because ${K.g("SLAAC","Stateless Address Autoconfiguration: a host builds its own address from the /64 prefix a router advertises plus a 64-bit interface ID. Lesson 4.")} needs a 64-bit interface ID (lesson 1). The hierarchy lets routes aggregate; the price is that changing ISP usually changes your prefix — one reason unique local addresses exist (section 5).</p>
<h3>Worked example: split one address</h3>
<p>A server at the bank's Abuja branch has <code>2001:db8:7c00:1200::25/64</code>; the site prefix is a /48.</p>
${K.steps([
  ["Expand it (lesson 1)","<code>2001:0db8:7c00:1200:0000:0000:0000:0025</code> — the <code>::</code> stood for four zero hextets."],
  ["The /48 = the first 3 hextets","48 ÷ 16 = 3: <code>2001:0db8:7c00</code> is the <b>global routing prefix</b>, the same on every address the bank owns."],
  ["The 4th hextet = the subnet ID","<code>1200</code>: the bank chose it for &ldquo;Abuja, voice VLAN&rdquo; (the plan comes next)."],
  ["The last 64 bits = the interface ID","<code>::25</code>: this server on that subnet. The LAN's prefix is <code>2001:db8:7c00:1200::/64</code>."],
])}
<h3>Reading the types on a router: show ipv6 interface brief</h3>
<p>The bank's Lagos head-office router, LAG-HQ-R1, has IPv6 on three interfaces. <code>show ipv6 interface brief</code> is the IPv6 version of <code>show ip interface brief</code>:</p>
${K.out(`LAG-HQ-R1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::1
    2001:DB8:7C00:100::1
    FD5C:21E0:8B44:100::1
GigabitEthernet0/1     [up/up]
    FE80::E1A:2BFF:FE00:2
    2001:DB8:7C00:FF01::1
GigabitEthernet0/2     [up/up]
    FE80::E1A:2BFF:FE00:3`, "Three interfaces, four address types. Cisco prints upper case; the value is the same in lower case.")}
<ul>
<li><code>[up/up]</code> — status, then one address per line; the <b>first is always the link-local</b>. <code>FE80::1</code> was typed by the engineer so the gateway reads easily (lesson 3).</li>
<li><code>2001:DB8:7C00:100::1</code> — global unicast: subnet ID <code>0100</code> (HQ staff), interface ID <code>::1</code> (the router). <code>FD5C:21E0:8B44:100::1</code> — unique local on the <b>same</b> interface, subnet ID mirrored.</li>
<li><code>GigabitEthernet0/1</code> — the WAN link: a GUA from the infrastructure range <code>ff01</code>, and a link-local built from the MAC (the <code>FFFE</code> gives away ${K.g("EUI-64","Modified EUI-64: an interface ID built from the MAC by inserting FFFE and flipping one bit. Lesson 3.")}).</li>
<li><code>GigabitEthernet0/2</code> — <b>only</b> a link-local: IPv6 is on (a new ${K.g("CCTV","Closed-circuit television: security cameras.")} VLAN) but no /64 has been given yet, so hosts there can reach the router and nothing else over IPv6.</li>
</ul>
${K.dyk(`2000::/3 alone holds 2<sup>45</sup> /48s — about 35 trillion sites, each with 65,536 /64s of 18 quintillion addresses. And that is only one eighth of IPv6: the rest is held back for the future.`)}
${K.check({q:"At a site whose prefix is a /48, a PC has 2001:db8:7c00:2101:9a4e:11ff:fe20:3b7c/64. What is its subnet ID?", o:["7c00","2101","9a4e","2001:db8"], a:1, why:"With a /48, the first three hextets (2001:db8:7c00) are the global routing prefix, the 4th hextet (2101) is the subnet ID, and the last four are the interface ID."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A university's registry assigned it 2001:db8:a1::/48. A lecturer's PC has 2001:db8:a1:3c:5a2f:1:0:9/64. Write each part with all its digits.", fields:[{label:"Global routing prefix (48 bits)", a:["2001:0db8:00a1","2001:db8:a1","2001:0db8:00a1::/48","2001:db8:a1::/48"]},{label:"Subnet ID (16 bits)", a:["003c","3c","0x3c","0x003c"]},{label:"Interface ID (64 bits)", a:["5a2f:0001:0000:0009","5a2f:1:0:9","::5a2f:1:0:9"]}], why:"1. What is asked? The three parts. 2. Rule: with a /48 and a /64 LAN, prefix = hextets 1–3, subnet ID = hextet 4, interface ID = hextets 5–8. 3. Apply it: expand first — 2001:0db8:00a1:003c:5a2f:0001:0000:0009. Prefix 2001:0db8:00a1, subnet ID 003c, interface ID 5a2f:0001:0000:0009. The trap: a1 is 00a1 and 3c is 003c, still one full hextet each."})}

<h2>Planning subnets from a /48 — and a /56</h2>
${K.remember(`<b>The rule:</b> subnet bits = 64 − your site prefix length. A /48 gives the whole 4th hextet — <b>16 bits, 65,536 /64s</b>; a /56 its last two hex digits — <b>8 bits, 256 /64s</b>. Plan <b>one hex digit (4 bits) at a time</b>, so each digit means something and each group of subnets summarises into one route.`)}
<p>This is gentler than Module 3: <b>every LAN is a /64</b>, however many hosts it has, so there is no host maths and no variable masks — you only decide what the subnet-ID digits mean.</p>
<p><b>Why hex digits?</b> One hex digit is 4 bits, a ${K.g("nibble","Four bits — one hex digit. Plans on nibble boundaries (/48, /52, /56, /60, /64) stay readable without binary.")}. With every boundary between digits (/52, /56, /60), summaries read by eye: <code>2001:db8:7c00:1000::/52</code> covers subnet IDs 1000–1fff. A mid-digit boundary such as /50 is legal but forces binary for every address.</p>
<div class="tablewrap"><table>
<tr><th>You receive</th><th>Subnet bits (64 − n)</th><th>/64 subnets</th><th>Digits you plan</th></tr>
<tr><td>/48</td><td>16</td><td>65,536</td><td>all four of the 4th hextet</td></tr>
<tr><td>/52</td><td>12</td><td>4,096</td><td>the last three</td></tr>
<tr><td>/56</td><td>8</td><td>256</td><td>the last two</td></tr>
<tr><td>/60</td><td>4</td><td>16</td><td>the last one</td></tr>
</table></div>
<h3>Worked example 1: the bank's /48</h3>
<p>Head office plus fourteen branches: fifteen sites, each with staff, voice, server and management VLANs, plus WAN links. Each subnet-ID digit gets one job:</p>
${K.out(`2001:db8:7c00:  S P N N  ::/64
               | | +-+--- number within that purpose: 00-ff
               | +------- purpose: 1 staff · 2 voice · 3 servers · 9 management
               +--------- site: 0 Lagos HQ · 1 Abuja · 2 Kano · … · e = 15th site
                          f = infrastructure (links: ff01, ff02, …)`, "The bank's subnet-ID plan: one hex digit per decision.")}
${K.steps([
  ["Copy the fixed part","Every subnet starts <code>2001:db8:7c00:</code> — the ISP's 48 bits, never touched."],
  ["Write all four digits, then compress","Lagos HQ staff: site 0, purpose 1, number 00 → <code>0100</code> → <code>2001:db8:7c00:100::/64</code>. Only the <i>leading</i> zero goes: <code>100</code>, never <code>1</code>. Abuja voice → <code>1200</code>; Kano staff → <code>2100</code>; Kano servers → <code>2300</code>; the Lagos–Kano link → <code>ff02</code>."],
  ["Summarise each site","All of Kano is subnet IDs 2000–2fff: one digit fixed after the /48 = 48 + 4 = <b>/52</b>, <code>2001:db8:7c00:2000::/52</code> — one route at head office (lesson 5). Head office itself is <code>2001:db8:7c00::/52</code>: the zeros compress away, so read carefully."],
  ["Interface IDs","Routers take <code>::1</code>; PCs build their own by SLAAC (lesson 4); servers get small fixed numbers such as <code>::25</code> for DNS and firewall rules."],
  ["Check for room","One digit per site = 16 values: 15 sites plus <code>f</code>. If a fifteenth branch (a sixteenth site) is likely, give sites two digits (a /56 each, 256 sites)."],
])}
${K.mistake(`Dropping <b>trailing</b> zeros from the subnet ID. <code>2001:db8:7c00:1200::</code> written as <code>2001:db8:7c00:12::</code> is subnet <code>0012</code> — in head office's range, not Abuja's. Only <i>leading</i> zeros may be removed.`)}
<h3>Worked example 2: a /56 for a small site</h3>
<p>A clinic in Port Harcourt gets <code>2001:db8:3c:4b00::/56</code>. The planned digits are no longer a whole hextet:</p>
${K.steps([
  ["Expand and count","<code>2001:0db8:003c:4b00::</code>. 56 bits = 14 hex digits: <code>2001 0db8 003c 4b</code> are fixed."],
  ["Find your digits","The last two of the 4th hextet: <code>4b00</code> to <code>4bff</code> — 2<sup>8</sup> = 256 subnets."],
  ["Plan them","Staff <code>4b10</code>, medical devices <code>4b20</code>, guest Wi-Fi <code>4b30</code>, management <code>4bf0</code>: staff = <code>2001:db8:3c:4b10::/64</code>, gateway <code>…:4b10::1</code>. <code>4c00</code> is the next customer's block."],
])}
<p>A popular habit: <b>write the VLAN number into the subnet ID</b> (VLAN 250 → <code>…:250::/64</code>). The digits are hex, but people read &ldquo;250&rdquo; as &ldquo;VLAN 250&rdquo;.</p>
${K.when([
  ["A /48","A business, several VLANs, or several sites under one prefix","65,536 /64s: a digit per site and per purpose","—"],
  ["A /56","A branch, clinic or home office","256 /64s is plenty for one site","Many sites from one allocation"],
  ["Site-first layout","Several sites, one summary each","Each site = one /52 or /56: one route, one firewall rule","One site — plan by purpose"],
], "How much to ask for, and how to lay it out")}
${K.dodont([
  "Write subnet IDs with four digits in the plan; compress only when typing.",
  "Keep every boundary on a hex digit (/48, /52, /56, /60, /64).",
  "Reserve a range for links (e.g. <code>ff00</code>–<code>ffff</code>); routers take <code>::1</code>.",
],[
  "Don't make a LAN smaller than /64 — SLAAC stops working.",
  "Don't drop trailing zeros: <code>2100</code> is not <code>21</code>.",
  "Don't put the whole /48 on one interface.",
])}
${K.exam(`Two fast calculations: <b>/64s = 2<sup>(64 − prefix)</sup></b> (a /56 holds 256), and the <b>Nth subnet</b> = N − 1 in hex in the subnet ID: the 17th /64 of <code>2001:db8:a::/48</code> is subnet 16 = <code>0010</code> → <code>2001:db8:a:10::/64</code>. `)}
${K.q({type:"fill", q:"The clinic owns 2001:db8:3c:4b00::/56. Write the /64 whose subnet number is hex 2a, then the /64 of the very last subnet in the block.", fields:[{label:"Subnet 0x2a", a:["2001:db8:3c:4b2a::/64","2001:0db8:003c:4b2a::/64","2001:db8:3c:4b2a::"]},{label:"Last subnet", a:["2001:db8:3c:4bff::/64","2001:0db8:003c:4bff::/64","2001:db8:3c:4bff::"]}], why:"The /56 fixes 2001:0db8:003c:4b; the last two hex digits of the 4th hextet are the subnet number. 0x2a → 4b2a → 2001:db8:3c:4b2a::/64. The last of 256 is ff → 2001:db8:3c:4bff::/64."})}
<h3>Try it: put a plan on a router</h3>
<p>Two commands lesson 3 teaches properly: <code>ipv6 unicast-routing</code> (global config) turns on IPv6 routing, and <code>ipv6 address 2001:db8:e5:10::1/64</code> (interface config) gives the interface that address and prefix length; <code>no ipv6 address 2001:db8:e5:25::1/64</code> removes one. Verify with <code>show ipv6 interface brief</code> and <code>show ipv6 route connected</code>, which shows a <code>C</code> route per /64, like the C lines of <code>show ip route</code> in Module 5. The router's own address is an <code>L</code> /128, listed by the full <code>show ipv6 route</code> (or <code>show ipv6 route local</code>).</p>
<p>The ticket: <i>&ldquo;Nairobi depot, router NBO-R1. ISP allocation 2001:db8:e5::/48. Plan: subnet ID = VLAN number; routers take ::1; links use ff00 + link number. G0/0 = VLAN 10 staff, G0/1 = VLAN 250 CCTV, G0/2 = link 3 to the yard router. A colleague started G0/1 last week.&rdquo;</i></p>
${K.hint(`Write each subnet ID as four digits first: VLAN 250 → <code>0250</code>, link 3 → <code>ff03</code>. Which zeros did your colleague drop on G0/1?`)}
${K.term({env:"ios2", title:"NBO-R1 — configure the Nairobi plan, fix a dropped zero", opts:{kind:"router", host:"NBO-R1", model:"ISR4321", motd:"NBO-R1 — console session (lab router, no enable secret)."},
  setup:env=>{ ["enable","configure terminal","hostname NBO-R1","no ip domain-lookup","interface g0/0","description VLAN 10 STAFF","interface g0/1","description VLAN 250 CCTV","ipv6 address 2001:db8:e5:25::1/64","no shutdown","interface g0/2","description LINK 3 TO YARD-R2","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code>. G0/0 and G0/2 are still shut down, as a router's ports are out of the box.",
  tasks:[
    {text:"<code>show ipv6 interface brief</code> — what is on G0/1 now, and which plan subnet should it be?", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ipv6\s+int\S*\s+br/i.test(l.cmd||"") && /2001:DB8:E5:25::1/.test(l.out||""))},
    {text:"In <code>configure terminal</code>, turn on IPv6 routing with <code>ipv6 unicast-routing</code>", done:e=>!!e.v6routing},
    {text:"G0/0, VLAN 10 staff: the router's address from the plan, then <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0"]; return !i.shut && (i.ip6||[]).some(x=>IP6.eq(x.addr,"2001:db8:e5:10::1") && x.len===64); }},
    {text:"G0/1, VLAN 250 CCTV: remove the wrong address (<code>no ipv6 address …</code>) and add the right one", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return (i.ip6||[]).some(x=>IP6.eq(x.addr,"2001:db8:e5:250::1") && x.len===64) && !(i.ip6||[]).some(x=>IP6.inPrefix(x.addr,"2001:db8:e5:25::",64)); }},
    {text:"G0/2, link 3 to the yard: the router's address from the plan, then <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/2"]; return !i.shut && (i.ip6||[]).some(x=>IP6.eq(x.addr,"2001:db8:e5:ff03::1") && x.len===64); }},
    {text:"<code>end</code>, then prove it: <code>show ipv6 interface brief</code> (notice the FE80 link-local on every interface — you never typed those) and <code>show ipv6 route connected</code> (one C /64 per interface)", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ipv6\s+ro\S*\s+con/i.test(l.cmd||"") && /2001:DB8:E5:250::\/64/.test(l.out||"") && /2001:DB8:E5:FF03::\/64/.test(l.out||""))},
  ],
  win:"You turned a written plan into interface addresses, caught a subnet ID with dropped zeros (0025 instead of 0250), and saw IOS add a link-local address to every IPv6 interface by itself.",
  solve:["enable","show ipv6 interface brief","configure terminal","ipv6 unicast-routing","interface g0/0","ipv6 address 2001:db8:e5:10::1/64","no shutdown","interface g0/1","no ipv6 address 2001:db8:e5:25::1/64","ipv6 address 2001:db8:e5:250::1/64","interface g0/2","ipv6 address 2001:db8:e5:ff03::1/64","no shutdown","end","show ipv6 interface brief","show ipv6 route connected"]})}
${K.check({q:"A company owns 2001:db8:61::/48 and gives its Ibadan region subnet IDs 3a00 to 3aff. Which single prefix summarises the whole region?", o:["2001:db8:61:3a00::/52","2001:db8:61:3a00::/56","2001:db8:61:3a::/56","2001:db8:61:3a00::/64"], a:1, why:"3a00–3aff fixes two subnet-ID digits (3a) and leaves two free: 48 + 8 = /56, 2001:db8:61:3a00::/56. A /52 would cover 3000–3fff; 2001:db8:61:3a::/56 is subnet ID 003a — trailing zeros dropped."})}
<h3>Same logic, new situation</h3>
<p>A home user's ISP delegates <code>2001:db8:91:ab30::/60</code>. How many /64s, and what are the first and last?</p>
${K.hint(`64 − 60 = ? bits. How many hex digits is that?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The count and range of /64s in a /60. <b>2. Rule:</b> subnet bits = 64 − prefix; plan by hex digit. <b>3. Apply it:</b> 4 bits = one hex digit = <b>16 subnets</b>: <code>2001:0db8:0091:ab3</code> + one free digit, from <code>2001:db8:91:ab30::/64</code> to <code>2001:db8:91:ab3f::/64</code>. <code>ab40</code> belongs to someone else.</p>`)}
${K.job("“Kano laptops have IPv6 but can't reach the loan portal over it”",`
<p><b>The ticket.</b> &ldquo;Since the ISP enabled IPv6, Kano branch laptops show an IPv6 address, but the HQ loan portal (<code>2001:db8:7c00:300::25</code>) never answers over IPv6 — it only loads, slowly, when the browser falls back to IPv4.&rdquo; Other branches are fine.</p>
<p><b>Questions first.</b> &ldquo;Which address does the laptop show? What changed?&rdquo; — a contractor set up Kano's router on Saturday. One branch broken after a change: compare it with the plan. <b>Checks</b>, on a Kano laptop:</p>
${K.out(`C:\\Users\\teller03>ipconfig

Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   IPv6 Address. . . . . . . . . . . : 2001:db8:7c00:21:6d2e:91f0:3a4c:b7e2
   Temporary IPv6 Address. . . . . . : 2001:db8:7c00:21:c15a:2e07:d941:6f3b
   Link-local IPv6 Address . . . . . : fe80::a8c3:5d1e:42b9:7f10%12
   IPv4 Address. . . . . . . . . . . : 10.2.10.57
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : fe80::1%12
                                       10.2.10.1`, "Real Windows: a stable address, a temporary (privacy) address and a link-local, all with random interface IDs. %12 is the adapter's zone index.")}
<p>Type: <code>2001…</code> is global unicast, so not &ldquo;only a link-local&rdquo;. Plan: expand the subnet ID — <code>0021</code>, but Kano staff is <code>2100</code>. The router agrees:</p>
${K.out(`KANO-R1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::1
    2001:DB8:7C00:21::1
GigabitEthernet0/1     [up/up]
    FE80::A6B2:39FF:FE5C:1E02
    2001:DB8:7C00:FF02::2`, "Subnet 0021 instead of 2100: the trailing zeros were dropped.")}
<p>Head office routes Kano with one summary, <code>2001:db8:7c00:2000::/52</code>; <code>0021</code> isn't in it, so the portal's replies never get back — Module 5's &ldquo;way back&rdquo; fault (<code>tracert</code>: KANO-R1, then <code>* * *</code>).</p>
<p><b>The fix.</b> On KANO-R1 <code>interface g0/0</code>: <code>no ipv6 address 2001:db8:7c00:21::1/64</code>, <code>ipv6 address 2001:db8:7c00:2100::1/64</code>, confirm with <code>show ipv6 interface brief</code>. A router that stops advertising a prefix doesn't tell hosts it is gone, so Windows keeps the old address until its lifetime runs out (IOS advertises 30 days valid, 7 days preferred, by default — RFC 8978 describes the problem) and may keep choosing it as the source. Staff restart their laptops (or unplug and replug the cable), which drops the stale address; then they show <code>2001:db8:7c00:2100:…</code> and the portal answers over IPv6.</p>
<p><b>What you say.</b> &ldquo;Kano's router was given a slightly wrong IPv6 network number on Saturday, so replies from head office couldn't get back. It's fixed — please restart your laptop and try the portal again.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;KANO-R1 G0/0 had 2001:db8:7c00:21::1/64 (subnet 0021, trailing zeros dropped) instead of plan 2100 — outside HQ's Kano summary 2000::/52, no return path. Replaced with 2001:db8:7c00:2100::1/64, users restarted, portal over IPv6 OK, saved. Plan sheets to show four-digit subnet IDs.&rdquo;</i></p>`)}

<h2>Unique local addresses: your private space, done right</h2>
${K.remember(`<b>The rule:</b> a unique local address is your organisation's own IPv6 space — routed between your sites, never on the internet — made &ldquo;unique&rdquo; by a <b>random 40-bit Global ID</b>, so it is very unlikely to clash with anyone else's.`)}
${K.svg("0 0 760 150",
  K.band(20,30,70,32,"fd","var(--chip)")+K.band(96,30,250,32,"5c : 21e0 : 8b44","var(--chip)")+K.band(352,30,90,32,"0100","var(--chip)")+K.band(448,30,292,32,"interface ID","var(--panel2)")+
  K.txt(55,84,"8 bits",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(55,100,"fc00::/7 + L=1",{mid:true,s:10.5,f:"body"})+
  K.txt(221,84,"Global ID · 40 bits",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(221,100,"random — generated once",{mid:true,s:10.5,f:"body"})+
  K.txt(397,84,"Subnet ID · 16",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(397,100,"you plan it",{mid:true,s:10.5,f:"body"})+
  K.txt(594,84,"Interface ID · 64 bits",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(594,100,"as for any /64",{mid:true,s:10.5,f:"body"})+
  K.txt(380,132,"fd + Global ID = your ULA /48 (fd5c:21e0:8b44::/48) — plan its 4th hextet exactly like a GUA /48.",{mid:true,c:"fg",s:11,f:"body"}),
  "A ULA: fd plus a random Global ID makes a /48.")}
<ul>
<li><b>Why fd, not fc?</b> In fc00::/7 the eighth bit (&ldquo;L&rdquo;) is 1 for locally generated prefixes — fd. fc00::/8 was kept for a central registry that never appeared, so real ULAs start with fd.</li>
<li><b>Why random?</b> Remember every company on 192.168.1.0/24 or 10.0.0.0/16: when two merge, or join with a ${K.g("VPN","Virtual Private Network: an encrypted tunnel joining two networks across the internet as if they were directly connected.")}, the ranges clash and someone renumbers or uses NAT. With 2<sup>40</sup> (about 1.1 trillion) Global IDs, two random picks almost never match. RFC 4193 suggests generating one from a hash of the time and a hardware ID; online generators do it for you.</li>
<li><b>Not an internet path.</b> Providers filter ULA prefixes, and IPv6 doesn't need ${K.g("NAT","Network Address Translation: rewriting addresses at a router, as IPv4 home routers do. A later module; IPv6 is designed not to need it.")} as IPv4 does: a host that must reach the internet also has a GUA, and a firewall — not translation — protects it.</li>
</ul>
<p><b>GUA, ULA or both?</b> Many networks use GUAs only. ULA earns its place for internal addresses that <b>must not change when the ISP prefix does</b> (printers, management, internal DNS) and for networks that never touch the internet (labs, factory machines, building management). A host with both uses the ULA for ULA destinations and the GUA for the internet by default (the RFC 6724 address-selection policy pairs ULA with ULA).</p>
${K.when([
  ["Global unicast","The device talks to the internet, or one address must work everywhere","Unique and routed; no translation","—"],
  ["Unique local","Internal-only systems, isolated networks, addresses that must survive an ISP change","Stable and never routed on the internet","It must reach the internet — add a GUA"],
  ["Link-local","Neighbour talk: router discovery, Neighbor Discovery, next hops, gateway","Always there, no planning","DNS records, remote firewall rules, app settings"],
  ["Multicast","One packet to many receivers (protocols)","One send instead of many","Never a source address"],
  ["Anycast","The same service in several places (DNS)","Users reach the nearest copy","Long sessions that must stay on one server"],
], "Which address type for which job")}
${K.case("A merger, two ULA plans — and one lazy Global ID",`
<p>A logistics group bought a courier company. Both used <code>10.0.0.0/16</code> for IPv4, so months went into NAT and renumbering.</p>
<p>IPv6 should have been easy: both used ULAs internally. The group's Global ID came from a generator, <code>fd5c:21e0:8b44::/48</code>. The courier's engineer had picked <code>fd00::/48</code> &ldquo;because it's short&rdquo; — and so had the contractor running the group's building-management system. Two networks with <code>fd00:0:0:10::/64</code>, one VPN between them, and routes for the same prefix pointing two ways.</p>
<p><b>Afterwards.</b> The courier moved to a freshly generated <code>fd6e:b17:c4a9::/48</code>, keeping its subnet IDs so firewall rules only needed the prefix changed. New standards: <b>generate every Global ID randomly and record it in the address-management system</b>; <b>use GUAs for anything facing partners or the internet</b>. &ldquo;Unique&rdquo; only works if the random part is random.</p>`)}
${K.check({q:"Why does a unique local prefix contain a 40-bit random Global ID?", o:["So ISPs can route it on the internet","So two organisations' ULA prefixes almost certainly won't clash if their networks are joined","Because RIRs assign it","So NAT can translate it"], a:1, why:"The random ID makes collisions very unlikely, so mergers and VPNs don't force renumbering. ULAs are never routed on the internet and no registry assigns them."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A factory's machine network will never touch the internet. The engineer generates the random Global ID 3b91c25e07 (10 hex digits). Write the factory's ULA /48, then the /64 for subnet ID 0042.", fields:[{label:"ULA /48", a:["fd3b:91c2:5e07::/48","fd3b:91c2:5e07::","fd3b:91c2:5e07:0000::/48"]},{label:"Subnet 0042 /64", a:["fd3b:91c2:5e07:42::/64","fd3b:91c2:5e07:0042::/64","fd3b:91c2:5e07:42::"]}], why:"1. What is asked? The ULA prefix and one subnet. 2. Rule: fd + 40-bit Global ID = the /48; the 4th hextet is the subnet ID. 3. Apply it: fd then 3b91c25e07, regrouped into hextets: fd3b:91c2:5e07::/48. Subnet 0042 → fd3b:91c2:5e07:42::/64 (only leading zeros dropped)."})}

<h2>Link-local addresses: every interface, never routed</h2>
${K.remember(`<b>The rule:</b> every IPv6 interface always has a link-local address, made automatically. It works only between devices on the <b>same link</b>, and routers <b>never forward</b> it — so IPv6 uses it for &ldquo;talking to my neighbour&rdquo;: finding routers and neighbours, and naming next hops.`)}
<p>A <b>link</b> is everything reachable without a router: one VLAN or one router-to-router cable. Every link uses <code>fe80::/64</code> (the reservation is fe80::/10; the rest of the first 64 bits are zeros). The interface ID comes from the MAC on Cisco (EUI-64, lesson 3), is random on Windows, or is typed (<code>fe80::1</code>).</p>
<p><b>Why IPv6 needs them.</b> A device has one as soon as IPv6 starts, before any global address, so it can already ask &ldquo;is there a router here?&rdquo; and check its addresses are free — that's ${K.g("NDP","Neighbor Discovery Protocol: IPv6's way to find routers, prefixes and neighbours' MAC addresses on a link, replacing ARP. Lesson 4.")} (Neighbor Discovery Protocol, lesson 4), IPv6's replacement for ARP. Hosts take the router's link-local from its ${K.g("Router Advertisement","RA: an NDP message in which a router announces itself and the link's prefix. Lesson 4.")} as their <b>default gateway</b> (hence <code>fe80::1%12</code> in ipconfig). And routing protocols use link-locals as <b>next hops</b>, as can static routes (lesson 5): they don't change when you renumber.</p>
<h3>One interface in detail: show ipv6 interface</h3>
${K.out(`LAG-HQ-R1#show ipv6 interface GigabitEthernet0/0
GigabitEthernet0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:7C00:100::1, subnet is 2001:DB8:7C00:100::/64
    FD5C:21E0:8B44:100::1, subnet is FD5C:21E0:8B44:100::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  MTU is 1500 bytes
  ICMP error messages limited to one every 100 milliseconds
  ICMP redirects are enabled
  ICMP unreachables are sent
  ND DAD is enabled, number of DAD attempts: 1
  ...`, "The first lines of the output; the lines that follow are Neighbor Discovery settings (lesson 4).")}
<ul>
<li><code>link-local address is FE80::1</code> — the link-local always gets its own line.</li>
<li><code>Global unicast address(es):</code> — IOS lists <b>every</b> non-link-local unicast address here, ULAs included. The heading doesn't make <code>FD5C:…</code> global; its first hextet makes it unique local. Each shows its subnet, so you can check the plan.</li>
<li><code>Joined group address(es):</code> — <code>FF02::1</code> (all nodes), <code>FF02::2</code> (all routers, because this router routes IPv6) and <code>FF02::1:FF00:1</code>, a solicited-node group (section 6).</li>
</ul>
<h3>The catch: which link?</h3>
<p>Since every link uses fe80::/64, a device with several interfaces can't tell from the address which link you mean — and neighbours on different links may share one (many teams give routers <code>fe80::1</code> on every LAN on purpose). So link-locals come with a ${K.g("zone","The interface a link-local address belongs to: %N after the address on Windows (fe80::1%12), the 'Output Interface' prompt on IOS.")}: Windows adds <code>%12</code> (&ldquo;on adapter 12&rdquo;) — with one active adapter it can guess if you leave it off, but with several only the zone says which link you mean — and IOS asks when you ping:</p>
${K.out(`LAG-HQ-R1#ping FE80::C2D4:13FF:FE8A:2B01
Output Interface: GigabitEthernet0/1
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to FE80::C2D4:13FF:FE8A:2B01, timeout is 2 seconds:
Packet sent with a source address of FE80::E1A:2BFF:FE00:2%GigabitEthernet0/1
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 0/1/3 ms`, "Pinging the Abuja router's link-local: IOS asks which interface, then sends from its own link-local there.")}
${K.tip(`On Windows, <code>netsh interface ipv6 show interfaces</code> lists each adapter's index (the <b>Idx</b> column) — that number is the zone you add after the %.`)}
<p>And what makes link-locals safe: <b>routers never forward a packet with a link-local source or destination to another link</b> (RFC 4291). A PC on another subnet can't reach a router's link-local at all: it treats every fe80 address as on its own link, sends a Neighbor Solicitation, hears nothing, and Windows says <code>Destination host unreachable</code>.</p>
${K.svg("0 0 760 260",
  K.dev("pc",60,90,"PC-A","fe80::a…")+K.dev("switch",190,90,"SW1","")+K.dev("router",330,90,"R1","fe80::1 | fe80::1")+K.dev("router",510,90,"R2","fe80::2 | fe80::1")+K.dev("pc",680,90,"PC-B","fe80::b…")+
  K.link(80,92,164,92)+K.link(216,92,306,92)+K.link(354,92,486,92,"WAN link")+K.link(534,92,660,92)+
  K.band(30,150,320,22,"link 1 — fe80::/64","var(--chip)")+K.band(338,150,190,22,"link 2 — fe80::/64","var(--chip)")+K.band(516,150,214,22,"link 3 — fe80::/64","var(--chip)")+
  K.arrow(60,192,322,192,"PC-A ↔ R1 fe80::1 — same link ✓",true)+
  K.link(60,222,500,222,"",true)+K.txt(280,215,"PC-A → R2's fe80::2 ✗ — R1 never forwards a link-local",{mid:true,c:"bad",s:10.5,f:"body"})+
  K.txt(380,250,"GUA and ULA packets cross R1 and R2 normally — only link-local (and ff02:: multicast) stay on their link.",{mid:true,c:"fg",s:11,f:"body"}),
  "Three links, each its own fe80::/64; fe80::1 may repeat on different links.")}
${K.myth([
  ["fe80 addresses are IPv6's private addresses, like 192.168.x.x.","The private-style range is unique local (fd00::/8), routed across your organisation. Link-local never leaves its link."],
  ["A link-local only appears when something is wrong, like 169.254.x.x.","Every IPv6 interface always has one, and IPv6 uses it constantly: Neighbor Discovery, router advertisements, next hops."],
  ["Two interfaces can't share a link-local address.","They can on different links: fe80::1 on every router LAN is common practice."],
  ["If a PC shows an IPv6 address, IPv6 works.","Check the type: link-local only reaches its own link, and even a GUA in the wrong subnet fails (the Kano ticket)."],
])}
<h3>Hands-on: name every address, then prove link-local stays home</h3>
<p>An Abuja logistics company, plan <code>2001:db8:4a10::/48</code>: <code>0010</code> = HQ staff, <code>1010</code> = Kano staff, <code>ff01</code> = the HQ–Kano link, plus a management LAN on unique local <code>fd9e:21c4:7b03:50::/64</code>. Before the rollout meeting, read every address type off the real devices and show why <code>fe80</code> addresses can't be used across sites.</p>
${K.hint(`At <code>Output Interface:</code> type the full interface name with no space, e.g. <code>GigabitEthernet0/1</code>. Which interface faces KANO-R2? The descriptions in <code>show running-config</code> or the cabling will tell you.`)}
${K.bench({id:"m6-addr-types", points:80, from:"CCNA · Module 6 · lesson 2", title:"read every IPv6 address type — and prove link-local stays on its link", viewBox:"0 0 960 500", ipv6:true, openLog:true,
  intro:"Your console cable is on <code>ABJ-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control). Use each PC's <b>Command Prompt</b> for <code>ipconfig</code> and <code>ping</code>. Everything is pre-configured; nothing needs changing. Lab note: the PCs build IPv6 interface IDs from their MAC (EUI-64) — real Windows uses random ones.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r1", kind:"router", label:"ABJ-R1", model:"ISR 1100 · Abuja HQ", x:330, y:170, config:e=>{ ["en","conf t","hostname ABJ-R1","no ip domain-lookup","ipv6 unicast-routing",
      "interface g0/0","description HQ STAFF","ip address 192.168.10.1 255.255.255.0","ipv6 address 2001:db8:4a10:10::1/64","ipv6 address fe80::1 link-local","no shutdown",
      "interface g0/1","description WAN TO KANO-R2","ipv6 address 2001:db8:4a10:ff01::1/64","ipv6 address fe80::1 link-local","no shutdown",
      "interface g0/2","description MGMT LAN (ULA only)","ip address 10.50.0.1 255.255.255.0","ipv6 address fd9e:21c4:7b03:50::1/64","no shutdown","exit",
      "ipv6 route 2001:db8:4a10:1000::/52 2001:db8:4a10:ff01::2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"r2", kind:"router", label:"KANO-R2", model:"Kano branch", x:640, y:170, config:e=>{ ["en","conf t","hostname KANO-R2","ipv6 unicast-routing",
      "interface g0/0","description KANO STAFF","ip address 192.168.20.1 255.255.255.0","ipv6 address 2001:db8:4a10:1010::1/64","ipv6 address fe80::1 link-local","no shutdown",
      "interface g0/1","description WAN TO ABJ-R1","ipv6 address 2001:db8:4a10:ff01::2/64","ipv6 address fe80::2 link-local","no shutdown","exit",
      "ipv6 route ::/0 g0/1 fe80::1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"HQ-SW", x:130, y:280},
    {id:"pc1", kind:"pc", label:"PC1", x:20, y:390, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"pc2", kind:"pc", label:"PC2", x:220, y:390, ip:"192.168.10.12", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"srv1", kind:"server", label:"MGMT-SRV", x:420, y:380, ip:"10.50.0.20", mask:"255.255.255.0", gw:"10.50.0.1"},
    {id:"kpc", kind:"pc", label:"KANO-PC", x:840, y:340, ip:"192.168.20.11", mask:"255.255.255.0", gw:"192.168.20.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"pc1:eth", b:"sw:g2"}, {type:"cat6", a:"pc2:eth", b:"sw:g3"},
    {type:"cat6", a:"r1:g2", b:"srv1:eth"}, {type:"cat6", a:"r1:g1", b:"r2:g1"}, {type:"cat6", a:"r2:g0", b:"kpc:eth"} ],
  tray:["cat6"],
  tasks:[
    {text:"Console into ABJ-R1, <code>enable</code>, <code>show ipv6 interface brief</code>. Name the type of every address on each interface (you'll be asked under the bench)", done:B=>B.devs.r1.env.log.some(l=>/^\s*sh\S*\s+ipv6\s+int\S*\s+br/i.test(l.cmd||"") && /FD9E:21C4:7B03:50::1/.test(l.out||""))},
    {text:"<code>show ipv6 interface GigabitEthernet0/0</code> — find the link-local, the global unicast address with its /64, and the three groups it joined (FF02::1, FF02::2 and one starting FF02::1:FF)", done:B=>B.devs.r1.env.log.some(l=>/Joined group/.test(l.out||"") && /FF02::1:FF00:1/.test(l.out||"") && /2001:DB8:4A10:10::\/64/.test(l.out||""))},
    {text:"<code>ipconfig</code> on PC1 and on PC2: which line is global unicast, which link-local? Same first 64 bits, different interface IDs — and why is the IPv6 gateway an fe80 address?", done:B=>Bench.tried(B,"pc1",/^\s*ipconfig/i) && Bench.tried(B,"pc2",/^\s*ipconfig/i)},
    {text:"<code>ipconfig</code> on MGMT-SRV: what type is its IPv6 address, and why does its gateway look different from PC1's?", done:B=>Bench.tried(B,"srv1",/^\s*ipconfig/i)},
    {text:"From PC1, ping the gateway's link-local on PC1's own link: <code>ping fe80::1%4</code> (the %4 names PC1's adapter)", done:B=>Bench.pinged(B,"pc1","fe80::1")},
    {text:"On ABJ-R1, <code>ping fe80::2</code> (KANO-R2's link-local). At <code>Output Interface:</code> answer the interface that faces KANO-R2", done:B=>B.devs.r1.env.log.some(l=>/FE80::1%GigabitEthernet0\/1\n!!!!!/.test(l.out||""))},
    {text:"Same ping again, but answer <code>GigabitEthernet0/0</code>: is fe80::2 on that link?", done:B=>B.devs.r1.env.log.some(l=>/Echos to FE80::2,[\s\S]*%GigabitEthernet0\/0\n\.\.\.\.\./.test(l.out||""))},
    {text:"From PC1, <code>ping fe80::2</code>, then <code>ping 2001:db8:4a10:ff01::2</code> — the same router, two address types, two results", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+fe80::2(%\d+)?\s*$/i) && Bench.pinged(B,"pc1","2001:db8:4a10:ff01::2")},
    {text:"Read KANO-PC's global address from its <code>ipconfig</code>, then ping it from PC1 across the WAN", done:B=>Bench.tried(B,"kpc",/^\s*ipconfig/i) && Bench.pinged(B,"pc1",IP6.str(IP6.withIid(IP6.parse("2001:db8:4a10:1010::"), IP6.eui64(B.devs.kpc.mac))))},
  ],
  win:"You read link-local, global unicast, unique local and multicast addresses straight off a router and three PCs, and proved the key rule: a link-local works on its own link (with an output interface), is never routed, while global and unique local addresses cross routers.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 interface brief"],["term","show ipv6 interface GigabitEthernet0/0"],
    ["pc","pc1","ipconfig"],["pc","pc2","ipconfig"],["pc","srv1","ipconfig"],["pc","pc1","ping fe80::1%4"],
    ["term","ping fe80::2"],["term","GigabitEthernet0/1"],["term","ping fe80::2"],["term","GigabitEthernet0/0"],
    ["pc","pc1","ping fe80::2"],["pc","pc1","ping 2001:db8:4a10:ff01::2"],["pc","kpc","ipconfig"],["pc","pc1","ping 2001:db8:4a10:1010:250:62ff:fe30:277"]]})}
<p>What you saw: PC1's <code>ping fe80::2</code> got <code>Destination host unreachable</code> from its own link-local — its Neighbor Solicitation (frame log) found no fe80::2 on its link — while <code>2001:db8:4a10:ff01::2</code> replied. MGMT-SRV's gateway <code>fe80::250:cff:fe53:3</code> is ABJ-R1's automatic EUI-64 link-local on G0/2.</p>
${K.q({type:"match", q:"From the bench: match each address on ABJ-R1 with what it is.", pairs:[["FE80::1 (on both G0/0 and G0/1)","Link-local — one per link, may repeat on different links"],["2001:DB8:4A10:10::1","Global unicast — HQ staff subnet 0010"],["FD9E:21C4:7B03:50::1","Unique local — management subnet 0050"],["FF02::1:FF00:1","Solicited-node multicast group"],["FF02::2","All-routers multicast group"]], why:"FE80 = link-local, legal on two links because each lives on its own link. 2001 = global unicast, subnet 0010. fd = unique local, subnet 0050. FF02 = link-scope multicast: ::2 is all routers; ::1:FF00:1 is the solicited-node group for addresses ending 00:0001 — both fe80::1 and 2001:db8:4a10:10::1."})}
${K.check({q:"A PC in Kano pings fe80::1%4 and gets replies. Which device answered?", o:["ABJ-R1 in Abuja, because it also uses fe80::1","The router on the PC's own link (KANO-R2's G0/0)","Every router that has fe80::1","Nobody — link-local can't be pinged"], a:1, why:"fe80::1%4 means fe80::1 on the link attached to adapter 4 — the Kano router's LAN interface. ABJ-R1's fe80::1 is on other links and is never reached by routing."})}
<h3>Same logic, new situation</h3>
<p>A developer puts a server in DNS as <code>fe80::5054:ff:fe12:3456</code> &ldquo;because ipconfig showed it&rdquo;. Users on the server's VLAN can open the app; users at other sites can't. Why?</p>
${K.hint(`What does a client do with a destination starting fe80? Does it even send it to its router?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why one address works for some clients only. <b>2. Rule:</b> link-locals are reachable only on their own link; hosts treat fe80 destinations as on-link and routers never forward them. <b>3. Apply it:</b> clients on the server's VLAN find it with Neighbor Discovery. A client elsewhere looks for it on its <i>own</i> link, hears nothing, and never involves its router. Fix: publish the server's global unicast (or unique local) address — a fixed one from the plan.</p>`)}

<h2>Multicast, anycast, loopback and unspecified</h2>
${K.remember(`<b>The rule:</b> a <b>multicast</b> address names a <i>group</i>: one packet reaches every interface that joined, and a digit in the address limits how far it may travel. IPv6 uses multicast where IPv4 used broadcast. An <b>anycast</b> address is one unicast address on several devices; routing delivers each packet to the <i>nearest</i>.`)}
${K.svg("0 0 760 220",
  K.band(20,30,70,32,"ff","var(--chip)")+K.band(96,30,60,32,"0","var(--chip)")+K.band(162,30,60,32,"2","var(--chip)")+K.band(228,30,512,32,"group ID · 112 bits — e.g. ::1  ::2  ::1:ff04:25","var(--panel2)")+
  K.txt(55,82,"ff = multicast",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(126,82,"flags",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(126,98,"0 = permanent",{mid:true,s:10.5,f:"body"})+
  K.txt(192,82,"scope",{mid:true,c:"fg",s:11,f:"body",b:true})+K.txt(192,98,"2 = this link",{mid:true,s:10.5,f:"body"})+
  K.txt(484,82,"scope digits: 1 interface · 2 link · 4 admin · 5 site · 8 organisation · e global",{mid:true,s:10.5,f:"body"})+
  K.txt(20,140,"Solicited-node group for 2001:db8:7c00:1200::4:25",{c:"fg",s:11.5,f:"body",b:true})+
  K.box(20,152,190,48,"…:0004:0025","last 32 bits")+K.box(240,152,150,48,"04:0025","keep the last 24 bits",true)+K.box(420,152,170,48,"ff02::1:ff04:25","ff02::1:ff + 24 bits",true)+K.box(612,152,128,48,"33:33:ff:04:00:25","Ethernet MAC")+
  K.arrow(210,176,238,176)+K.arrow(390,176,418,176)+K.arrow(590,176,610,176),
  "A multicast address's parts, and a solicited-node group built from a unicast address.")}
<p>The <b>scope</b> is the fourth hex digit. <code>ff02::</code> is link scope and, like link-local, never routed off the link; <code>ff05::</code> (site) and <code>ff0e::</code> (global) may cross routers, but only where multicast routing is configured (beyond the CCNA). Flags 0 = a permanent, IANA-assigned group.</p>
<div class="tablewrap"><table>
<tr><th>Group</th><th>Members</th><th>Used for</th></tr>
<tr><td><code>ff02::1</code></td><td>Every IPv6 interface on the link</td><td>Nearest thing to broadcast; routers' periodic RAs</td></tr>
<tr><td><code>ff02::2</code></td><td>Every router on the link (IOS joins once <code>ipv6 unicast-routing</code> is on)</td><td>Hosts' Router Solicitations (lesson 4)</td></tr>
<tr><td><code>ff02::1:ffXX:XXXX</code></td><td>Interfaces whose address ends in those 24 bits</td><td>Neighbor Solicitation — the ARP request's replacement</td></tr>
<tr><td><code>ff02::5</code>, <code>::6</code></td><td>OSPFv3 routers / DRs (<code>::a</code> EIGRP)</td><td>OSPF for IPv6 (like 224.0.0.5/6)</td></tr>
<tr><td><code>ff02::1:2</code></td><td>${K.g("DHCPv6","DHCP for IPv6: hands out IPv6 addresses and settings. Lesson 4 compares it with SLAAC.")} servers and relays</td><td>Hosts asking for DHCPv6 (lesson 4)</td></tr>
</table></div>
<h3>Solicited-node multicast</h3>
<p>An ARP request is a broadcast every device must read. IPv6 sends the same question to a group named after the <b>last 24 bits</b> of the wanted address; every interface joins one such group per unicast address, so almost nobody but the target listens (network cards filter the <code>33:33:ff:…</code> MAC in hardware).</p>
${K.steps([
  ["Take the last two hextets in full","<code>fe80::21a:2bff:fe3c:4d5e</code> → <code>fe3c:4d5e</code>."],
  ["Keep the last 24 bits (six hex digits)","<code>3c:4d5e</code>."],
  ["Put them behind ff02::1:ff","<code>ff02::1:ff3c:4d5e</code>; the frame goes to <code>33:33:ff:3c:4d:5e</code> (Cisco: <code>3333.ff3c.4d5e</code>)."],
  ["Two addresses, one group","<code>fe80::1</code> and <code>2001:db8:7c00:100::1</code> both end <code>00:0001</code>, so the router joins only <code>ff02::1:ff00:1</code> — the single FF02::1:FF line in <code>show ipv6 interface</code>."],
])}
${K.dyk(`IPv6 has no broadcast at all, not even on the local link. Multicast does every job broadcast did, and solicited-node groups mean that on a busy VLAN almost nobody else has to read a neighbour lookup.`)}
${K.q({type:"fill", q:"PC1 in the bench has 2001:db8:4a10:10:250:9aff:fe50:54cf. Write its solicited-node multicast group and the Ethernet MAC address it maps to.", fields:[{label:"Solicited-node group", a:["ff02::1:ff50:54cf","ff02:0:0:0:0:1:ff50:54cf","ff02:0000:0000:0000:0000:0001:ff50:54cf"]},{label:"Multicast MAC", a:["33:33:ff:50:54:cf","3333.ff50.54cf","33-33-ff-50-54-cf","3333ff5054cf"]}], why:"Last two hextets fe50:54cf → last 24 bits 50:54cf → ff02::1:ff50:54cf. The MAC is 33:33 plus the group's last 32 bits: 33:33:ff:50:54:cf. Upper or lower case both count."})}
<h3>Anycast, loopback and unspecified</h3>
<p><b>Anycast</b> has no range: configure the same unicast address on several devices and mark it shared, e.g. <code>ipv6 address 2001:db8:7c00:ff99::53/64 anycast</code>. Each router follows its best route, so users reach the <b>nearest</b> copy by the Module 5 rules; if one fails, its route vanishes and traffic moves to the next. Large public DNS services work this way. Every subnet also has a <b>subnet-router anycast</b> address — its prefix with an all-zero interface ID, e.g. <code>2001:db8:7c00:100::</code> — that every router on the subnet answers (RFC 4291), so never give it to a host.</p>
<ul>
<li><b><code>::1</code></b> — loopback, &ldquo;this device&rdquo;, never on a wire; <code>ping ::1</code> tests a PC's own IPv6 software. One address, where IPv4 reserved 127.0.0.0/8. Not a router's <code>interface Loopback0</code>, which takes normal addresses from your plan.</li>
<li><b><code>::</code></b> — unspecified, &ldquo;no address yet&rdquo;: the source while a device checks a new address is free (lesson 4), never a destination. With length 0, <code>::/0</code> is the default route (lesson 5).</li>
<li>Also seen: ${K.g("IPv4-mapped","::ffff:0:0/96 — an IPv4 address inside an IPv6 address, as dual-stack servers log IPv4 clients.")} addresses such as <code>::ffff:192.0.2.10</code> in server logs, and <code>fec0::/10</code> site-local in old books — abandoned in 2004 (RFC 3879) for ULAs.</li>
</ul>
${K.mistake(`Expecting link-scope addresses to work from anywhere: a vendor's discovery on <code>ff02::…</code>, a DNS entry pointing at <code>fe80::…</code>, a firewall rule letting a remote subnet reach a link-local. All fail for one reason — link scope ends at the first router.`)}
${K.check({q:"Which multicast group does every IPv6 device on a link belong to?", o:["ff02::2","ff02::1","ff05::1","ff02::1:ff00:0"], a:1, why:"ff02::1 is all nodes on the link. ff02::2 is all routers; ff05::1 would be site scope; the ff02::1:ff… solicited-node groups are per address."})}
<h3>Same logic, new situation</h3>
<p>A video-wall controller in a control room streams to <code>ff05::4b</code>. A laptop on the controller's VLAN receives it; screens on another VLAN in the same building, behind the office router, get nothing. The vendor suggests <code>ff0e::4b</code> &ldquo;so it travels far enough&rdquo;. What do you tell them?</p>
${K.hint(`Read the scope digit. Is scope what's stopping the stream?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why the stream doesn't cross the router, and whether a wider scope helps. <b>2. Rule:</b> the scope digit is a <i>limit</i> (2 link, 5 site, e global); it doesn't make routers forward anything — that takes multicast routing. <b>3. Apply it:</b> <code>ff05</code> already may cross routers inside the site, so the office router simply isn't routing multicast (beyond the CCNA). <code>ff0e</code> wouldn't fix that and would let the stream go further than it should. Had the controller used <code>ff02::4b</code>, no router setting could ever help.</p>`)}

<h2>Interview corner</h2>
${K.hint(`List the types by prefix, then say what each is for and how far it reaches.`)}
${K.reveal("“What IPv6 address types would you expect on a router interface, and what is each one for?”",`<p>"Always a link-local, fe80::/10 — automatic, never leaves the link, used for Neighbor Discovery, router advertisements and as the next hop neighbours point at. Normally a global unicast from 2000::/3 — our /48, a /64 subnet ID and ::1 for the router — and sometimes a unique local fd00::/8 address for internal services. It joins ff02::1 all nodes, ff02::2 all routers once IPv6 routing is on, and a solicited-node group, ff02::1:ff plus the last 24 bits of each address — IPv6 has no broadcast. I check it all with show ipv6 interface."</p>`)}
${K.hint(`Subnet bits, nibble boundaries, summaries — and the zero trap.`)}
${K.reveal("“Your ISP has given you a /48. How would you plan it?”",`<p>"A /48 leaves the fourth hextet — 16 bits, 65,536 /64s — and every LAN and link is a /64, so the work is deciding what the four subnet-ID digits mean. I keep boundaries on hex digits: first digit per site so each site summarises as a /52 (two digits, a /56 each, if we may pass fifteen sites), then purpose — staff, voice, servers, management — then instance, with ff00 to ffff for links. Routers get ::1, and the plan shows four-digit subnet IDs to stop dropped trailing zeros."</p>`)}
${K.hint(`Bootstrapping, NDP, gateways, next hops — and the interface prompt.`)}
${K.reveal("“Why does every IPv6 interface have a link-local address, and why do routers use them as next hops?”",`<p>"A device must talk on its link before it has a global address — to solicit a router, hear its advertisement and check its addresses — so IPv6 creates fe80 addresses on every interface automatically. Routers never forward them, which makes them safe for neighbour work. They're always there and survive renumbering, so routing protocols use them as next hops and hosts as their gateway. Every link shares fe80::/64, so a link-local only means something with its interface — hence Windows' %12 and IOS asking for the output interface."</p>`)}

${K.recap([
  "Type = prefix, read from the full first hextet: 2000::/3 GUA, fd00::/8 ULA, fe80::/10 link-local, ff00::/8 multicast, ::1 loopback, :: unspecified. fd::1 is 00fd, not a ULA.",
  "GUA = global routing prefix (IANA → RIR → ISP; typically a /48 per site) + subnet ID (you plan it) + 64-bit interface ID.",
  "Subnet bits = 64 − site prefix: /48 → 65,536 /64s, /56 → 256. Plan one hex digit at a time so sites summarise; drop only leading zeros.",
  "ULA = fd + random 40-bit Global ID + subnet ID: internal, survives ISP changes, almost never clashes. Internet traffic needs a GUA.",
  "Every IPv6 interface has a link-local, used for Neighbor Discovery, gateways and next hops; never routed, so it needs a zone (%12, Output Interface).",
  "Multicast replaces broadcast: ff02::1 all nodes, ff02::2 all routers, ff02::1:ff + last 24 bits = solicited-node; the fourth hex digit is the scope.",
  "Anycast = one unicast address on several devices, nearest wins; a subnet's all-zero interface ID is its subnet-router anycast address.",
])}
${K.next(`<b>Lesson 3 — Configuring IPv6 on routers.</b> Now create the addresses: <code>ipv6 unicast-routing</code>, every form of <code>ipv6 address</code>, modified EUI-64 bit by bit (where that <code>FFFE</code> comes from), automatic and manual link-locals, <code>ipv6 enable</code>, and verifying with <code>show ipv6 interface</code> and <code>show ipv6 route connected</code>.`)}
`,
quiz:[
  {lvl:1, q:"Which prefix contains every global unicast address that is currently being assigned?", o:["2000::/3","fc00::/7","fe80::/10","::/0"], a:0, why:"Global unicast addresses are assigned from 2000::/3, so they start with 2 or 3 in their first hex digit. fc00::/7 is unique local, fe80::/10 link-local, and ::/0 is the default route that matches everything."},
  {lvl:1, type:"match", q:"Match each address with its type.", pairs:[["2001:db8:5::9","Global unicast"],["fd7e:1:2::1","Unique local"],["fe80::9a","Link-local"],["ff02::2","Multicast (all routers)"],["::1","Loopback"]], why:"Read the first hextet in full: 2001 → 2000::/3 global unicast; fd7e → fd00::/8 unique local; fe80 → link-local; ff02 → link-scope multicast, ::2 = all routers; ::1 → loopback."},
  {lvl:1, q:"What does the IPv6 address ff02::1 represent?", o:["The router's own link-local address","All IPv6 nodes on the local link","All routers in the site","The IPv6 broadcast address for the subnet"], a:1, why:"ff02::1 is the link-scope all-nodes multicast group: every IPv6 interface on the link joins it. IPv6 has no broadcast; all routers is ff02::2."},
  {lvl:1, type:"order", q:"Put these address types in order from the widest reach to the narrowest.", items:["Global unicast (2000::/3)","Unique local (fd00::/8)","Link-local (fe80::/10)","Loopback (::1)"], why:"A GUA is routed across the whole internet, a ULA only within one organisation, a link-local only on one link, and the loopback never leaves the device."},
  {lvl:1, q:"Which statement describes an IPv6 anycast address?", o:["An address from the special range ff00::/8 that all routers join","A unicast address assigned to several devices, where routing delivers each packet to the nearest one","An address used only before a device has a real address","An address that every host on the link receives"], a:1, why:"Anycast has no range of its own: it is a unicast address configured on several devices (IOS: the anycast keyword). Routing's normal best-path rules deliver each packet to the nearest instance. ff00::/8 is multicast; :: is unspecified; ff02::1 reaches every host on the link."},
  {lvl:2, type:"fill", q:"Write the solicited-node multicast address for 2001:db8:7c00:1200::4:25.", fields:[{label:"Solicited-node group", a:["ff02::1:ff04:25","ff02::1:ff04:0025","ff02:0:0:0:0:1:ff04:25","ff02:0000:0000:0000:0000:0001:ff04:0025"]}], why:"Expand the end of the address: ...:0004:0025. The last 24 bits are 04:0025. Put them behind ff02::1:ff → ff02::1:ff04:0025, written ff02::1:ff04:25."},
  {lvl:2, type:"multi", q:"Which two statements about IPv6 link-local addresses are true? (Choose two.)", o:["Every IPv6-enabled interface has one","Routers forward them to other links if a route exists","They are used as next-hop addresses by routing protocols and as hosts' default gateway","They are assigned by the ISP from the site's /48","Two interfaces on different links can never share the same link-local address"], a:[0,2], why:"Every IPv6 interface automatically has an fe80 address, and IPv6 uses link-locals for Neighbor Discovery, as the default gateway learned from router advertisements, and as routing next hops. Routers never forward link-local traffic; link-locals aren't assigned by an ISP; and the same link-local (fe80::1, say) is fine on different links."},
  {lvl:2, q:"Based on the exhibit, why can't hosts on the new VLAN behind GigabitEthernet0/2 build a global IPv6 address with SLAAC?", ex:"BR-R1#show ipv6 interface brief\nGigabitEthernet0/0     [up/up]\n    FE80::1\n    2001:DB8:66:10::1\nGigabitEthernet0/1     [up/up]\n    FE80::E1A:2BFF:FE00:2\n    2001:DB8:66:FF01::1\nGigabitEthernet0/2     [up/up]\n    FE80::E1A:2BFF:FE00:3", o:["G0/2 is administratively down","G0/2 has only a link-local address, so there is no /64 prefix on that link for hosts to build an address from","The link-local address on G0/2 is invalid because it wasn't typed manually","Link-local addresses block SLAAC"], a:1, why:"G0/2 is up/up and IPv6 is enabled (it has an automatic EUI-64 link-local), but no global or unique local /64 is configured, so the router has no prefix to advertise there. Add the planned /64, e.g. ipv6 address 2001:db8:66:<subnet>::1/64."},
  {lvl:2, type:"fill", q:"How many /64 subnets does a /56 contain?", fields:[{label:"Number of /64s", a:["256","2^8","2 to the 8th"]}], why:"Subnet bits = 64 − 56 = 8, and 2 to the 8th = 256. That is the last two hex digits of the 4th hextet, 00 to ff."},
  {lvl:2, type:"fill", q:"An ISP delegates 2001:db8:77:9a00::/56 to a branch. Write the /64 of the last subnet in that block.", fields:[{label:"Last /64", a:["2001:db8:77:9aff::/64","2001:0db8:0077:9aff::/64","2001:db8:77:9aff::"]}], why:"The /56 fixes 2001:0db8:0077:9a; the last two hex digits of the 4th hextet are the subnet number, 00 to ff. The last is ff → 2001:db8:77:9aff::/64."},
  {lvl:2, q:"Which of these is a correctly formed unique local prefix as recommended by RFC 4193?", o:["fc12:3456:789a::/48","fd5c:21e0:8b44::/48","fe80:21e0:8b44::/48","fd00::/8 assigned as one subnet"], a:1, why:"A ULA prefix is fd (fc00::/7 with the L bit set) followed by a random 40-bit Global ID, giving a /48: fd5c:21e0:8b44::/48. fc00::/8 was reserved for a central registry that was never created, fe80 is link-local, and fd00::/8 is the whole ULA range, not one network."},
  {lvl:2, q:"A colleague says ff::1 must be a multicast address because it starts with ff. What is correct?", o:["It is a multicast address with link scope","It is a link-local address","It is not multicast: expanded, its first hextet is 00ff, which falls in the reserved 0000::/8 block","It is the all-routers group"], a:2, why:"Leading zeros are dropped when writing an address, so ff::1 means 00ff:0000:0000:0000:0000:0000:0000:0001. Its first 8 bits are 0000 0000, not 1111 1111, so it is not in ff00::/8. Always expand the first hextet before classifying."},
  {lvl:3, q:"A company has a /48 and 20 sites today, growing to about 40. It wants one summary route per site and readable prefixes. Which subnet-ID scheme fits best?", o:["First hex digit = site (one /52 per site)","First two hex digits = site (one /56 per site, 256 subnets each)","A /50 boundary, giving each site 16,384 subnets","One /64 per site"], a:1, why:"One hex digit allows only 16 sites — not enough for 20, let alone 40. Two digits allow 256 sites with 256 /64s each, and each site summarises on a nibble boundary as a /56. A /50 boundary sits inside a hex digit (unreadable, and only 4 sites). A single /64 per site leaves no room for more than one LAN."},
  {lvl:3, q:"Based on the exhibit, a user can open internal servers over IPv6 but no internet site over IPv6, while IPv4 internet access works. What is the most likely reason?", ex:"C:\\Users\\nurse04>ipconfig\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   IPv6 Address. . . . . . . . . . . : fd4a:10c3:77e1:30:8d1:4f3:9c2e:11a\n   Link-local IPv6 Address . . . . . : fe80::5b2:c4e1:9d07:6a8%7\n   IPv4 Address. . . . . . . . . . . : 10.30.0.57\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : fe80::1%7\n                                       10.30.0.1", o:["The default gateway is a link-local address, which cannot route traffic","The PC has only a unique local address (fd...), which is never routed on the internet; the router on that VLAN needs a global unicast /64 as well","The link-local address means the PC never heard from a router","DNS is broken"], a:1, why:"The PC's only non-link-local IPv6 address is fd..., a ULA: fine to internal servers, dropped on the internet. The router clearly is advertising (the PC built an fd address and lists fe80::1 as its gateway, which is normal). Adding the planned GUA /64 to the router's VLAN interface gives the PC a GUA for internet traffic. IPv4 working shows DNS and the link are fine."},
  {lvl:3, type:"fill", q:"A company owns 2001:db8:61::/48. Its Johannesburg office uses subnet IDs 7c40 to 7c4f. Write the single prefix the head-office router should use to route the whole office.", fields:[{label:"Summary prefix", a:["2001:db8:61:7c40::/60","2001:0db8:0061:7c40::/60"]}], why:"7c40 to 7c4f fixes three more hex digits (7c4, 12 bits) after the /48 and leaves one free: 48 + 12 = /60, written 2001:db8:61:7c40::/60 — 16 subnets. Writing 2001:db8:61:7c4::/60 would be subnet ID 07c4: the trailing zero matters."},
  {lvl:3, q:"Door controllers in VLAN 40 send alarms to the multicast group ff02::1:3a. The alarm server is in VLAN 50, routed by the same router, and never receives them. What is the cause?", o:["The router needs a static route for ff02::1:3a","ff02 is link scope: those packets can never leave VLAN 40, so the controllers must use a wider-scope group with multicast routing, or send alarms by unicast","Multicast addresses can't be used by controllers","The router's link-local address is wrong"], a:1, why:"The fourth hex digit of a multicast address is its scope, and 2 means link-local scope: routers never forward it, whatever routes exist. A site-scope group (ff05::...) with multicast routing, or unicast to the server's GUA/ULA, would work."},
],
cards:[
  {f:"Global unicast (GUA)", b:"2000::/3 — first hex digit 2 or 3. Routed on the whole internet. Global routing prefix (from IANA → RIR → ISP) + subnet ID (you plan) + interface ID (64 bits)."},
  {f:"Unique local (ULA)", b:"fc00::/7, in practice fd00::/8: fd + random 40-bit Global ID = a /48, then a 16-bit subnet ID. Routed inside your organisation only, never on the internet. The random ID avoids clashes in mergers and VPNs."},
  {f:"Link-local", b:"fe80::/10 (fe80:0:0:0 + interface ID in practice). Every IPv6 interface has one automatically. Used for Neighbor Discovery, router advertisements, default gateways and next hops. Never routed."},
  {f:"Zone / Output Interface", b:"Every link uses fe80::/64, so a link-local needs its interface: Windows adds %N (fe80::1%12), IOS asks 'Output Interface:' when you ping a link-local."},
  {f:"Multicast format", b:"ff00::/8: ff, a flags digit (0 = permanent), a scope digit (1 interface, 2 link, 4 admin, 5 site, 8 organisation, e global), then the group ID. ff02:: never leaves the link."},
  {f:"ff02::1 and ff02::2", b:"ff02::1 = all nodes on the link (every IPv6 interface). ff02::2 = all routers on the link (a Cisco router joins once ipv6 unicast-routing is on). IPv6 has no broadcast."},
  {f:"Solicited-node multicast", b:"ff02::1:ff + the last 24 bits of a unicast address. e.g. ...:fe3c:4d5e → ff02::1:ff3c:4d5e, MAC 33:33:ff:3c:4d:5e. Used by Neighbor Solicitation instead of an ARP broadcast."},
  {f:"Anycast", b:"No special range: a unicast address configured on several devices (IOS: ipv6 address X/64 anycast). Routing delivers to the nearest. The all-zero interface ID of each subnet is the subnet-router anycast address."},
  {f:"::1 and ::", b:"::1 = loopback (this device; IPv4 127.0.0.1). :: = unspecified (no address yet; source during duplicate address checks; never a destination). ::/0 = the default route."},
  {f:"How many /64s?", b:"2 to the power (64 − prefix length). /48 → 65,536. /52 → 4,096. /56 → 256. /60 → 16."},
  {f:"Planning a /48", b:"You plan the 4th hextet. One hex digit per decision (site, purpose, number), boundaries at /52, /56, /60 so each group summarises. Routers ::1. Write subnet IDs with four digits."},
  {f:"Trailing-zero trap", b:"Only leading zeros may be dropped. Subnet ID 2100 is 2001:db8:7c00:2100::/64, never 2001:db8:7c00:21::/64 (that is subnet 0021)."},
  {f:"Expand before you classify", b:"Type comes from the first bits of the full first hextet. fd::1 = 00fd::1 (reserved, not ULA); ff::1 = 00ff::1 (not multicast); 2::1 = 0002::1 (not GUA)."},
],
});

// ---------- Module 6 · Lesson 3 ----------
L.push({
id:"ipv6-config", mins:95, level:"Beginner+ · builds on Modules 1–5 and Module 6 lessons 1–2",
t:"Configuring IPv6 on routers: ipv6 unicast-routing, addresses, EUI-64 and link-local addresses",
html:`
${K.goals([
  "Turn a router into an IPv6 router with <code>ipv6 unicast-routing</code> and say exactly what it switches on: forwarding <i>and</i> Router Advertisements.",
  "Give interfaces IPv6 addresses three ways — manual <code>ipv6 address X/len</code>, <code>… eui-64</code>, and link-local only with <code>ipv6 enable</code> — and choose the right one.",
  "Work out a modified EUI-64 interface ID from any MAC address by hand, bit by bit, and run it backwards from an address to the MAC.",
  "Set a simple link-local address such as <code>fe80::1</code> and explain why engineers do it on routers.",
  "Verify with <code>show ipv6 interface brief</code>, <code>show ipv6 interface</code>, <code>show ipv6 route</code> and <code>show running-config</code>, and read every line that matters.",
])}
${K.pre(["Module 6 lessons 1–2: reading and shortening IPv6 addresses, why a LAN is a /64, and the address types (global unicast, link-local, multicast).","Module 3: hexadecimal and binary — you will turn one hex byte into bits and back.","Module 2: MAC addresses and the OUI.","Module 5 lesson 1: connected (C) and local (L) routes in the IPv4 routing table."])}

<h2>Why this matters at work</h2>
<p>Tuesday at a managed-service provider in Lekki, Lagos. MainOne has delivered an IPv6 block to a microfinance bank with eleven branches, and the change request says: &ldquo;Add IPv6 to every branch router. Don't touch IPv4.&rdquo; About eight lines per router. The senior engineer warns you about the one line people forget: without it, the router holds its new addresses and answers your pings — and not one laptop in the branch gets an IPv6 address.</p>
<p>Two weeks later a clinic's router, set up by a contractor with <code>eui-64</code>, needs addresses the firewall team can predict, and a server's gateway was typed as a long <code>fe80::…</code> string. This lesson covers both jobs.</p>

<h2>Two things to switch on: ipv6 unicast-routing and an address</h2>
<p>The rule in plain words: <b>a Cisco router does nothing useful with IPv6 until you tell it to twice</b> — once for the whole box (&ldquo;be an IPv6 router&rdquo;) and once per interface (&ldquo;here is your address on this link&rdquo;). Each switch alone gives a half-working result.</p>
<h3>Switch 1 — ipv6 unicast-routing (global configuration)</h3>
<p>IPv4 routing is on by default on a Cisco router; IPv6 routing is <b>off</b>. In global configuration mode:</p>
${K.out(`YABA-R1(config)#ipv6 unicast-routing`, "One line, typed once per router, in global configuration mode.")}
<p>It switches on two things:</p>
<ol>
<li><b>Forwarding.</b> The router routes IPv6 packets between interfaces using its IPv6 routing table. Without it, a packet for another network is dropped, even if the router has an address on both.</li>
<li><b>${K.g("Router Advertisements","RA: an ICMPv6 message (type 134) a router sends on a link to say 'I am a router here, this is the prefix of this link'. Hosts use it to find their gateway and build their own address. Lesson 4.")} (RAs).</b> On every IPv6-enabled interface the router now sends RAs — a few at start-up, then every 200 seconds by default, and promptly when a host asks: &ldquo;I'm a router here, use me as your gateway, the prefix is 2001:db8:4a:10::/64&rdquo;. It also joins the all-routers group <code>FF02::2</code> (lesson 2) to hear hosts asking.</li>
</ol>
<p><b>Why the RA matters:</b> Windows, macOS, phones and printers configure themselves by default. A laptop that hears an RA with a /64 prefix builds its own address from it and takes the router's link-local address as its gateway. That is SLAAC (Stateless Address Autoconfiguration, met in lessons 1–2); lesson 4 explains how. Today one fact is enough: <b>no RA, no SLAAC</b> — the laptops end up with only their own <code>fe80::</code> address.</p>
${K.svg("0 0 720 270",
  K.band(20,10,330,26,"WITHOUT ipv6 unicast-routing","var(--chip)")+K.band(370,10,330,26,"WITH ipv6 unicast-routing","var(--chip)")+
  K.dev("router",100,85,"R1","has 2001:db8:4a:10::1/64")+K.dev("pc",270,85,"Laptop","")+K.link(124,88,250,88)+
  K.txt(185,149,"no Router Advertisement",{c:"bad",s:11,mid:true,f:"body"})+
  K.txt(185,165,"laptop: fe80:: address only,",{c:"fg",s:11,mid:true,f:"body"})+K.txt(185,182,"no IPv6 address, no IPv6 gateway",{c:"fg",s:11,mid:true,f:"body"})+
  K.txt(185,212,"a packet arriving for another",{c:"muted",s:11,mid:true,f:"body"})+K.txt(185,229,"network: dropped (no forwarding)",{c:"muted",s:11,mid:true,f:"body"})+
  K.dev("router",450,85,"R1","joins FF02::2")+K.dev("pc",620,85,"Laptop","")+K.link(474,88,600,88)+
  K.arrow(480,62,596,62,"RA: prefix 2001:db8:4a:10::/64",true)+
  K.txt(535,149,"laptop builds 2001:db8:4a:10:…",{c:"ok",s:11,mid:true,f:"body"})+
  K.txt(535,165,"gateway = R1's link-local address",{c:"fg",s:11,mid:true,f:"body"})+K.txt(535,182,"(SLAAC — lesson 4 explains how)",{c:"muted",s:11,mid:true,f:"body"})+
  K.txt(535,212,"packets for other networks:",{c:"muted",s:11,mid:true,f:"body"})+K.txt(535,229,"routed out of the right interface",{c:"ok",s:11,mid:true,f:"body"})+
  K.txt(360,262,"One global command switches on both forwarding and Router Advertisements.",{c:"fg",s:11.5,mid:true,f:"body"}),
  "What ipv6 unicast-routing changes: no RAs and no forwarding without it; with it, hosts configure themselves and packets are routed.")}
${K.mistake(`Typing <code>ipv6 routing</code> — there's no such command; it's <code>ipv6 <b>unicast</b>-routing</code>. And don't take &ldquo;I can ping the router&rdquo; as proof: without IPv6 routing the router still behaves as an IPv6 host and answers pings.`)}
<h3>Switch 2 — an IPv6 address on the interface</h3>
<p>In interface configuration mode, with the <b>prefix length after a slash</b> — no dotted mask:</p>
${K.out(`YABA-R1(config)#interface g0/0
YABA-R1(config-if)#ipv6 address 2001:db8:4a:10::1/64
YABA-R1(config-if)#interface g0/1
YABA-R1(config-if)#ipv6 address 2001:db8:4a:20::1/64`, "The router takes ::1 on each /64.")}
<p>This is a global unicast address (lesson 2). Read it as two halves: <code>2001:db8:4a:10</code> is the prefix — <b>which link</b>; <code>::1</code> (in full <code>0000:0000:0000:0001</code>) is the interface ID (lesson 1) — <b>which device</b>. Pressing Enter does three things:</p>
<ul>
<li><b>IPv6 is enabled on the interface</b>, which gets a link-local address (lesson 2) automatically (section 4 shows how).</li>
<li><b>Two routes appear</b> once the interface is up/up, just like IPv4 in Module 5: <code>C 2001:DB8:4A:10::/64</code> and <code>L 2001:DB8:4A:10::1/128</code> — the local route is a /128, IPv6's version of a /32.</li>
<li><b>If <code>ipv6 unicast-routing</code> is on</b>, the router advertises <code>2001:db8:4a:10::/64</code> in its RAs on that link.</li>
</ul>
<p>Two differences from IPv4: a second <code>ipv6 address</code> line <b>adds</b> an address rather than replacing the first (no <code>secondary</code> keyword needed — handy for renumbering, a trap when you meant to <i>change</i> one); and the <code>ip address</code> line stays, so IPv4 carries on. Running both is dual stack (lesson 1), the usual way organisations add IPv6.</p>
${K.analogy(`<p>An office block adds a second numbering scheme to its doors. <code>ipv6 address</code> screws a new plate on one door; <code>ipv6 unicast-routing</code> hires the receptionist who tells each arrival the new numbering (the RA) and carries letters between floors (forwarding). Plates without a receptionist: numbers on doors, but nobody is told and nothing moves.</p>`)}
<p>The interface must also be up: router interfaces start <code>shutdown</code>, and an address on a shut interface gives no routes and no RAs.</p>
${K.out(`YABA-R1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::FA7B:20FF:FE91:1
    2001:DB8:4A:10::1
GigabitEthernet0/1     [up/up]
    FE80::FA7B:20FF:FE91:2
    2001:DB8:4A:20::1
GigabitEthernet0/2     [administratively down/down]
    unassigned`, "show ipv6 interface brief after the two address commands.")}
<p>The bracket is <b>status/protocol</b>, as in <code>show ip interface brief</code>. Under each interface come <b>all</b> its IPv6 addresses: link-local first (here the automatic <code>FE80::FA7B:20FF:FE91:1</code>), then the global ones. <code>unassigned</code> = IPv6 not enabled. IOS prints upper case, Windows lower case — same addresses.</p>
${K.check({q:"A router has 'ipv6 address 2001:db8:5:1::1/64' on G0/0, which is up/up, but no 'ipv6 unicast-routing'. Which statement is true?", o:["The PCs on G0/0 build SLAAC addresses from 2001:db8:5:1::/64","It sends no RAs and forwards no IPv6, but still answers pings to 2001:db8:5:1::1","The interface stays down until IPv6 routing is enabled","It forwards IPv6 but sends no RAs"], a:1, why:"The address and its C/L routes exist and the router answers pings as an IPv6 host. ipv6 unicast-routing turns on forwarding and RAs, so SLAAC hosts get no global address."})}
<h3>Same logic, new situation</h3>
<p>A colleague pastes a new router's config and says &ldquo;IPv6 is done&rdquo;: <code>ipv6 unicast-routing</code> at the top, then <code>interface g0/0</code>, <code>ipv6 address 2001:db8:9:1::1/64</code>, <code>shutdown</code>. Will the laptops on G0/0 get IPv6 addresses?</p>
${K.hint(`Two switches — but each one only matters when the interface is actually working.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether hosts on G0/0 will configure themselves. <b>2. Rule:</b> hosts need an RA; RAs are sent only when <code>ipv6 unicast-routing</code> is on <i>and</i> the interface has IPv6 enabled <i>and</i> is up/up. <b>3. Apply it:</b> routing and address are fine, but the interface is administratively down, so no RA leaves it (and no C route exists). <code>no shutdown</code> fixes it.</p>`)}

<h2>Modified EUI-64, bit by bit</h2>
<p>Instead of typing <code>::1</code>, you can let the router build the interface ID from the interface's MAC. The rule: <b>cut the 48-bit MAC in half, push ${K.g("FFFE","The fixed 16-bit filler (hex FF FE) that EUI-64 inserts between the two halves of the MAC.")} into the middle to make 64 bits, then flip one particular bit.</b> The result is the ${K.g("modified EUI-64","RFC 4291's way to make a 64-bit interface ID from a 48-bit MAC: split it, insert FFFE, invert bit 7 of the first byte. EUI = Extended Unique Identifier, IEEE's name for hardware IDs.")} interface ID. <b>Why?</b> A MAC is already unique, so an ID built from it is unique on the link with nobody choosing; 16 bits must be added, and the fixed filler <code>FFFE</code> makes such addresses easy to spot.</p>
<h3>Worked example: MAC 5c:a6:2d:41:7e:09 on prefix 2001:db8:a:1::/64</h3>
${K.steps([
  ["Write the MAC as six bytes", `Cisco writes <code>5ca6.2d41.7e09</code>, Windows <code>5C-A6-2D-41-7E-09</code>: bytes <code>5C A6 2D 41 7E 09</code>. The first three are the ${K.g("OUI","Organizationally Unique Identifier: the first 3 bytes of a MAC, the manufacturer's (Module 2).")}; the last three identify this interface.`],
  ["Split it in half", "<code>5C A6 2D</code> | <code>41 7E 09</code> — between the OUI and the device part."],
  ["Insert <code>FFFE</code> in the middle", "<code>5C A6 2D <b>FF FE</b> 41 7E 09</code> — now 8 bytes = 64 bits."],
  ["Flip bit 7 of the first byte", `<code>5C</code> in binary (Module 3) is <code>0101 1100</code>. Counting from the left, bit 7 is the ${K.g("U/L bit","Universal/Local bit: bit 7 (value 2) of a MAC's first byte. 0 = burned-in, IEEE-assigned; 1 = locally assigned.")}, here <code>0</code>. Invert it: <code>0101 11<b>1</b>0</code> = <code>5E</code>. Bit 7 is worth 2, so the byte moves by 2.`],
  ["Group into hextets", `<code>5EA6:2DFF:FE41:7E09</code> — four hextets: the interface ID.`],
  ["Put the prefix in front", "<b><code>2001:db8:a:1:5ea6:2dff:fe41:7e09</code></b> — no all-zero hextet, so nothing to compress. IOS prints it in capitals."],
])}
${K.svg("0 0 720 330",
  K.txt(20,40,"1 · the MAC (48 bits)",{c:"fg",s:11.5,f:"body",b:true})+
  ["5C","A6","2D"].map((b,i)=>K.band(230+i*56,22,50,28,b)).join("")+["41","7E","09"].map((b,i)=>K.band(230+(i+5)*56,22,50,28,b)).join("")+
  K.txt(311,64,"OUI (manufacturer)",{c:"muted",s:10,mid:true,f:"body"})+K.txt(591,64,"this interface",{c:"muted",s:10,mid:true,f:"body"})+
  K.txt(20,108,"2 · split, insert FFFE",{c:"fg",s:11.5,f:"body",b:true})+
  ["5C","A6","2D","FF","FE","41","7E","09"].map((b,i)=>K.band(230+i*56,90,50,28,b,i===3||i===4?"var(--panel2)":"var(--chip)")).join("")+
  K.txt(451,134,"FFFE fills 48 bits up to 64",{c:"accent",s:10.5,mid:true,f:"body"})+
  K.txt(20,178,"3 · flip bit 7 of byte 1",{c:"fg",s:11.5,f:"body",b:true})+
  K.txt(230,178,"5C = 0101 1100",{c:"fg",s:12.5})+K.arrow(355,174,415,174,"bit 7: 0 → 1",true)+K.txt(425,178,"0101 1110 = 5E",{c:"ok",s:12.5,b:true})+
  K.txt(230,198,"bits:  1234 5678   — bit 7 is worth 2, so the byte goes up or down by 2",{c:"muted",s:10.5})+
  K.txt(20,246,"4 · the interface ID",{c:"fg",s:11.5,f:"body",b:true})+
  ["5E","A6","2D","FF","FE","41","7E","09"].map((b,i)=>K.band(230+i*56,228,50,28,b,i===0?"var(--panel2)":"var(--chip)")).join("")+
  K.txt(370,300,"interface ID 5EA6:2DFF:FE41:7E09  →  2001:DB8:A:1:5EA6:2DFF:FE41:7E09",{c:"fg",s:12,mid:true,b:true})+
  K.txt(370,322,"tell-tale sign of EUI-64: FF FE in the middle of the interface ID",{c:"muted",s:10.5,mid:true,f:"body"}),
  "Modified EUI-64: split, insert FFFE, flip bit 7 of the first byte, then place the 64-bit ID behind the /64 prefix.")}
${K.remember(`<p><b>Split · Stuff · Swap.</b> Split the MAC in half, stuff <code>FFFE</code> in the middle, swap bit 7 of the first byte.</p><p><b>The swap without binary:</b> only the <b>second hex digit</b> of the first byte changes, always by 2, in pairs: <code>0↔2 · 1↔3 · 4↔6 · 5↔7 · 8↔A · 9↔B · C↔E · D↔F</code>. So <code>5C</code> becomes <code>5E</code>, <code>00</code> becomes <code>02</code>, <code>A8</code> becomes <code>AA</code>, and a <code>02</code> becomes <code>00</code>.</p>`)}
<p><b>Check yourself:</b> PC MAC <code>0050.9a50.54cf</code> → <code>00 50 9A FF FE 50 54 CF</code> → <code>00</code> becomes <code>02</code> → <code>0250:9AFF:FE50:54CF</code>, written <code>250:9aff:fe50:54cf</code> (leading zeros dropped). The lab PCs in the first bench build exactly this.</p>
<p><b>Why flip that bit?</b> In a MAC, U/L = 0 means &ldquo;universal, burned in&rdquo;. RFC 4291 inverts it so that in an interface ID 1 means universal — and the IDs people type by hand (<code>::1</code>, <code>::2</code>) naturally read as &ldquo;locally chosen&rdquo;.</p>
${K.dyk(`An EUI-64 interface ID carries the MAC, so it's the same on every network: a laptop could be tracked from a café in Ikeja to a hotel in Abuja. So Windows and most modern systems use <b>random</b> SLAAC interface IDs plus short-lived &ldquo;temporary&rdquo; addresses. Routers still use EUI-64 for automatic link-locals. The lab's PCs use EUI-64 so you can predict them; a real Windows PC won't show <code>ff:fe</code>.`)}
<h3>Configuring it: ipv6 address PREFIX/64 eui-64</h3>
<p>Give IOS only the prefix and the keyword:</p>
${K.out(`R1(config)#interface g0/1
R1(config-if)#ipv6 address 2001:db8:c1:20::/64 eui-64`, "Only the prefix is typed. The interface ID comes from G0/1's MAC address.")}
<p>Use a <b>/64</b> (EUI-64 fills the other 64 bits) and type the prefix with the host part as zeros. Each router interface has its own MAC, so each gets a different ID; interfaces without a MAC, such as serial links, borrow one from an Ethernet interface.</p>
${K.mistake(`Flipping the wrong bit. Bit 7 is the <b>second-from-last</b> bit of the first byte (value 2). Only that byte's second hex digit may change, and only by 2: <code>5C</code> → <code>DC</code> or <code>5D</code> means the wrong bit.`)}
${K.exam(`Reading any IPv6 question: <b>find the prefix length first</b> (on a /64 the interface ID is the last four hextets), then <b>expand before you compare</b> — <code>…:250:9aff:fe50:54cf</code> is <code>0250</code>, so the first byte is <code>02</code> (a MAC starting <code>00</code>), not <code>25</code>. Spot EUI-64 by <code>xxFF:FExx</code> mid-ID. Trap answers: <code>FFFE</code> inserted but no flip, or a bit flipped in the wrong place.`)}
${K.q({type:"fill", q:"An interface has MAC 00a0.c9d1.3e05 and the command ipv6 address 2001:db8:77:5::/64 eui-64. Write the interface ID, then the full address in shortest form.", fields:[{label:"Interface ID (4 hextets)", a:["02a0:c9ff:fed1:3e05","2a0:c9ff:fed1:3e05"]},{label:"Full address", a:["2001:db8:77:5:2a0:c9ff:fed1:3e05","2001:db8:77:5:02a0:c9ff:fed1:3e05","2001:0db8:0077:0005:02a0:c9ff:fed1:3e05"]}], why:"Split 00 a0 c9 | d1 3e 05, stuff ff fe → 00 a0 c9 ff fe d1 3e 05, swap bit 7 of 00 → 02. Interface ID 02a0:c9ff:fed1:3e05 (shortest 2a0:c9ff:fed1:3e05). Behind the prefix: 2001:db8:77:5:2a0:c9ff:fed1:3e05. Case doesn't matter; IOS prints it in capitals."})}
${K.check({q:"Which interface ID does modified EUI-64 build from MAC 1a2b.3c4d.5e6f?", o:["1a2b:3cff:fe4d:5e6f","182b:3cff:fe4d:5e6f","1a2b:3c4d:fffe:5e6f","9a2b:3cff:fe4d:5e6f"], a:1, why:"Split 1a 2b 3c | 4d 5e 6f, insert ff fe. First byte 1a = 0001 1010: bit 7 is already 1 (A = 1010), so it flips to 0 → 0001 1000 = 18. Pair rule: A↔8. The first option forgets the flip, the third puts fffe in the wrong place, the last flips the first bit."})}
<h3>Same logic, new situation: run it backwards</h3>
<p>A packet capture at a Port Harcourt office shows traffic from <code>fe80::21b:54ff:fec2:3a9f</code>. Which MAC address sent it?</p>
${K.hint(`Undo the steps in reverse order: un-flip, remove FFFE, rejoin. And expand the hextet <code>21b</code> first.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The MAC behind an EUI-64 interface ID. <b>2. Rule:</b> run the steps in reverse; <code>FF:FE</code> mid-ID proves it's EUI-64. <b>3. Apply it:</b> expand to <code>021B:54FF:FEC2:3A9F</code> → remove <code>FF FE</code> → <code>02 1B 54 C2 3A 9F</code> → flip <code>02</code> back to <code>00</code> → MAC <b><code>001b.54c2.3a9f</code></b>. Skip the expansion and you'd misread the first byte as <code>21</code>.</p>`)}

<h2>Link-local addresses: automatic, manual, and ipv6 enable</h2>
<p>The rule: <b>a link-local address only has to be unique on its own link, and it is never routed.</b> Yet it does important work: routers send RAs <i>from</i> it, hosts use it as their <b>default gateway</b>, and neighbouring routers use it to reach each other.</p>
<h3>The automatic one: FE80:: + EUI-64</h3>
<p>When IPv6 is enabled on an interface, IOS builds the link-local with EUI-64 behind <code>FE80::</code>. In the YABA-R1 output above, G0/0's MAC <code>f87b.2091.0001</code> gave <code>FE80::FA7B:20FF:FE91:1</code> (<code>F8</code> = <code>1111 1000</code> → <code>1111 1010</code> = <code>FA</code>).</p>
<h3>The manual one: ipv6 address fe80::1 link-local</h3>
${K.out(`YABA-R1(config)#interface g0/0
YABA-R1(config-if)#ipv6 address fe80::1 link-local
YABA-R1(config-if)#interface g0/1
YABA-R1(config-if)#ipv6 address fe80::1 link-local`, "No prefix length; the keyword link-local at the end.")}
<p><b>No <code>/64</code></b> — a link-local always belongs to FE80::/10; type <code>fe80::1/64 link-local</code> and IOS refuses it. The manual address <b>replaces</b> the automatic one: an interface has exactly one link-local. And <b>the same <code>fe80::1</code> on both interfaces is fine</b> — they're different links, and IOS always knows which interface a link-local belongs to.</p>
<h3>Why engineers set simple link-locals on routers</h3>
<p>Because the router's link-local is <b>the address everyone else uses to reach it</b>:</p>
<ul>
<li><b>It is the hosts' default gateway.</b> A SLAAC laptop shows <code>Default Gateway . . . : fe80::1%4</code> instead of <code>fe80::fa7b:20ff:fe91:1%4</code>, and servers or printers with static settings need it typed by hand. (<code>%4</code> is the zone index from lesson 2: which of the PC's own interfaces leads to it.)</li>
<li><b>It survives hardware swaps.</b> The automatic one comes from the MAC: replace the router and every static gateway or route pointing at it breaks. A manual one moves with the configuration.</li>
<li><b>It is readable</b> in routing tables, neighbour tables and captures — <code>FE80::1</code> and <code>FE80::2</code> beat two EUI-64 strings, especially in lesson 5's static routes.</li>
</ul>
${K.mistake(`Giving two routers on the <b>same</b> link the same link-local. One router with <code>fe80::1</code> on every interface is fine; two routers sharing a LAN need different ones — say <code>fe80::1</code> and <code>fe80::2</code>.`)}
<h3>ipv6 enable: IPv6 with only a link-local address</h3>
<p>A link between two of your own routers may need IPv6 but no global address. <code>ipv6 enable</code> turns IPv6 on with <b>only</b> the automatic link-local:</p>
${K.out(`R1(config)#interface g0/2
R1(config-if)#ipv6 enable
R1(config-if)#no shutdown
R1(config-if)#do show ipv6 interface brief | begin 0/2
GigabitEthernet0/2     [up/up]
    FE80::72E4:22FF:FE99:3`, "ipv6 enable: IPv6 is on, the interface has its link-local address, and nothing else.")}
<p>An interface with an <code>ipv6 address</code> doesn't need <code>ipv6 enable</code>. One with only a link-local gets no C or L route and has no prefix to advertise.</p>
${K.when([
  ["<code>ipv6 address 2001:db8:x:y::1/64</code>","Router interfaces, servers — anything people and rules must find","Predictable; survives a hardware swap","Thousands of end hosts — use SLAAC (lesson 4)"],
  ["<code>ipv6 address PREFIX/64 eui-64</code>","Labs, quick tests","Unique without planning","Anything firewall rules, DNS or monitoring point at — it changes with the hardware"],
  ["<code>ipv6 address fe80::1 link-local</code>","Every router LAN interface","Easy to type into static hosts; stable","Two routers on one link with the same value"],
  ["<code>ipv6 enable</code>","Router-to-router links needing no global address","Link-local only, nothing to plan","A LAN whose hosts need SLAAC — no prefix to advertise"],
], "Which way to give a router interface IPv6")}
${K.check({q:"An engineer types 'ipv6 address fe80::1 link-local' on G0/0, G0/1 and G0/2 of one router, each on a different LAN. What happens?", o:["IOS rejects the second and third as duplicates","All three are accepted — link-locals only need to be unique per link","Only G0/0 keeps it; the others fall back to EUI-64","The router stops sending RAs"], a:1, why:"Link-local scope is one link, and the router knows which interface each belongs to. Two devices on the same link are what must differ."})}
<h3>Same logic, new situation</h3>
<p>A school in Ibadan joins two buildings' routers with one cable. Both must run IPv6 over it, but nobody has planned a /64 for it. The second router already uses <code>fe80::1</code> on its LAN. What do you configure on each end, and what will <code>show ipv6 interface brief</code> list for that interface?</p>
${K.hint(`Which command gives IPv6 with no global address? Which addresses must differ, and on which link?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> IPv6 on a router-to-router link with no global prefix. <b>2. Rules:</b> <code>ipv6 enable</code> gives a link-local only; link-locals are unique per link, not per router. <b>3. Apply it:</b> <code>ipv6 enable</code> on both ends; each lists one <code>FE80::…</code> line (different MACs, different addresses). For readability, add <code>fe80::1 link-local</code> on one end and <code>fe80::2 link-local</code> on the other — the second router's LAN <code>fe80::1</code> is on another link, so no clash.</p>`)}

<h2>Verifying: show ipv6 interface, show ipv6 route, show running-config</h2>
<p>Four commands, four questions. <b>Brief:</b> which addresses, is it up? <b>Detail:</b> how was each address built, which groups, is it advertising? <b>Route:</b> what do its interfaces give it? <b>Running-config:</b> what was typed?</p>
<h3>show ipv6 interface — the detail</h3>
${K.out(`R1#show ipv6 interface g0/1
GigabitEthernet0/1 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::AAB4:56FF:FEC2:2
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:C1:20:AAB4:56FF:FEC2:2, subnet is 2001:DB8:C1:20::/64 [EUI]
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FFC2:2
  MTU is 1500 bytes
  ...
  ND reachable time is 30000 milliseconds (using 30000)
  ND advertised reachable time is 0 (unspecified)
  ND advertised retransmit interval is 0 (unspecified)
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.`, "An interface with ipv6 address 2001:db8:c1:20::/64 eui-64 and ipv6 unicast-routing on (some lines trimmed).")}
<ul>
<li><code>link-local address is FE80::AAB4:56FF:FEC2:2</code> — the automatic EUI-64 one (MAC <code>a8b4.56c2.0002</code>).</li>
<li><code>…, subnet is 2001:DB8:C1:20::/64 [EUI]</code> — the global address, its prefix, and <b><code>[EUI]</code></b>: built by EUI-64. A typed address has no tag.</li>
<li><code>Joined group address(es)</code> (lesson 2): <code>FF02::1</code> all nodes; <code>FF02::2</code> all routers — <b>only when <code>ipv6 unicast-routing</code> is on</b>; and one solicited-node group (<code>FF02::1:FFxx:xxxx</code>, from the last 24 bits) per unicast address. Link-local and global share one here (both end <code>C2:2</code>), as <code>FE80::1</code> and <code>2001:…::1</code> share <code>FF02::1:FF00:1</code>.</li>
<li>The <b>RA lines</b>, from <code>ND router advertisements are sent…</code> to <code>Hosts use stateless autoconfig…</code>, appear only with <code>ipv6 unicast-routing</code>. Without it the block ends <code>ND NS retransmit interval is 1000 milliseconds</code> — a router that isn't advertising. (ND, short for ${K.g("Neighbor Discovery","NDP: IPv6's ICMPv6 messages for finding routers (RS/RA), neighbours' MACs (NS/NA, replacing ARP) and duplicate addresses (DAD). Lesson 4.")}, lesson 4.)</li>
</ul>
<h3>show ipv6 route — C, L /128 and FF00::/8</h3>
${K.out(`YABA-R1#show ipv6 route
IPv6 Routing Table - default - 5 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
       B - BGP, R - RIP, H - NHRP, I1 - ISIS L1
       ...
C   2001:DB8:4A:10::/64 [0/0]
     via GigabitEthernet0/0, directly connected
L   2001:DB8:4A:10::1/128 [0/0]
     via GigabitEthernet0/0, receive
C   2001:DB8:4A:20::/64 [0/0]
     via GigabitEthernet0/1, directly connected
L   2001:DB8:4A:20::1/128 [0/0]
     via GigabitEthernet0/1, receive
L   FF00::/8 [0/0]
     via Null0, receive`, "The IPv6 routing table, separate from show ip route (legend trimmed).")}
<p>Just like the IPv4 table in Module 5, except: <b>two lines per route</b> (prefix and <code>[AD/metric]</code>, then <code>via</code>) and no classful headings; every global address gets its own <b>L /128</b> (<code>receive</code> = delivered to the router itself) while <b>link-locals get no route</b>; and <b><code>L FF00::/8 via Null0, receive</code></b> is always there — all multicast is handled by the router itself, never forwarded like unicast. ${K.g("Null0","A virtual 'nowhere' interface; with receive, the router processes that traffic itself.")} is that built-in nowhere. The count (5 entries) includes it. On a busy router you can filter: <code>show ipv6 route connected</code> lists only the C lines and <code>show ipv6 route local</code> only the L lines (<code>L FF00::/8</code> included).</p>
<h3>show running-config — what was typed</h3>
${K.out(`R1#show running-config | section interface
interface GigabitEthernet0/0
 description STAFF LAN
 ip address 10.21.10.1 255.255.255.0
 ipv6 address 2001:DB8:C1:10::/64 eui-64
interface GigabitEthernet0/1
 description RECORDS SERVERS
 ip address 10.21.20.1 255.255.255.0
 ipv6 address 2001:DB8:C1:20::/64 eui-64`, "The eui-64 line as typed: prefix only.")}
<p>The configuration stores <b>commands</b>, not results: you can't read an EUI-64 address from it (use <code>show ipv6 interface</code>, or the MAC and a pen). A manual link-local shows as <code>ipv6 address FE80::1 link-local</code>; an automatic one isn't there. <code>ipv6 unicast-routing</code> sits near the top with the global commands.</p>
${K.tip(`<code>show running-config | include ipv6</code> lists every IPv6 line on one screen — <code>ipv6 unicast-routing</code> (or its absence) first, then the address lines. The fastest &ldquo;does it match the plan?&rdquo; check.`)}
${K.q({type:"match", q:"Match each question with the command that answers it fastest.", pairs:[["Which IPv6 addresses does each interface have, and is it up?","show ipv6 interface brief"],["Was this global address built by EUI-64, and is the interface sending RAs?","show ipv6 interface g0/1"],["Which /64s is the router connected to, and which /128s are its own?","show ipv6 route"],["Was ipv6 unicast-routing actually typed on this router?","show running-config | include ipv6"]], why:"Brief = addresses and status. Detail = [EUI] tags, joined groups (ff02::2 means routing is on) and the RA lines. The routing table = C /64 and L /128 entries. The running-config = what was typed, including the global ipv6 unicast-routing line."})}
<h3>Try it: build and read IPv6 on a lab router</h3>
<p>A training router whose interface MACs are <code>70e4.2299.0001</code> (G0/0), <code>.0002</code> (G0/1) and <code>.0003</code> (G0/2). <b>Before</b> each <code>show</code>, write down the EUI-64 addresses you expect.</p>
${K.term({env:"ios2", title:"ipv6 enable, eui-64, a manual link-local and ipv6 unicast-routing on LAB-R1", opts:{kind:"router", host:"LAB-R1", model:"C1111-4P", mac:"70e4.2299", motd:"LAB-R1 — console session (training router, no enable secret)."},
  intro:"Start with <code>enable</code>, then <code>configure terminal</code>. Use <code>do</code> to run show commands from configuration mode.",
  tasks:[
    {text:"On G0/0: <code>ipv6 enable</code> and <code>no shutdown</code>, then <code>do show ipv6 interface brief</code>. Predict first: G0/0's link-local from MAC 70e4.2299.0001", done:e=>e.log.some(l=>/in\S*\s+br/i.test(l.cmd||"") && /GigabitEthernet0\/0\s+\[up\/up\]\n\s+FE80::72E4:22FF:FE99:1\n/.test(l.out||""))},
    {text:"On G0/1: <code>ipv6 address 2001:db8:77:1::/64 eui-64</code> and <code>no shutdown</code>, then <code>do show ipv6 interface g0/1</code> — find the <code>[EUI]</code> tag on the global address", done:e=>e.log.some(l=>/2001:DB8:77:1:72E4:22FF:FE99:2, subnet is 2001:DB8:77:1::\/64 \[EUI\]/.test(l.out||""))},
    {text:"<code>do show ipv6 route</code> — the C /64, the L /128 for the EUI-64 address, and <code>FF00::/8</code> via Null0. Is G0/0 in the table? Why not?", done:e=>e.log.some(l=>/L\s+2001:DB8:77:1:72E4:22FF:FE99:2\/128/.test(l.out||"") && /FF00::\/8/.test(l.out||""))},
    {text:"Make G0/1 predictable: add <code>ipv6 address fe80::1 link-local</code> and a second global address <code>ipv6 address 2001:db8:77:1::1/64</code>. <code>do show ipv6 interface brief</code>: how many global addresses does G0/1 have now?", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return i.ll==="fe80::1" && (i.ip6||[]).some(a=>!a.eui && a.addr==="2001:db8:77:1::1") && e.log.some(l=>/FE80::1\n\s+2001:DB8:77:1:72E4:22FF:FE99:2\n\s+2001:DB8:77:1::1/.test(l.out||"")); }},
    {text:"Now <code>ipv6 unicast-routing</code> (global configuration), then <code>do show ipv6 interface g0/1</code> again: <code>FF02::2</code> has joined and the RA lines have appeared", done:e=>e.log.some(l=>/GigabitEthernet0\/1 is up[\s\S]*FF02::2\n[\s\S]*ND router advertisements are sent/.test(l.out||""))},
    {text:"<code>end</code>, then <code>show running-config</code>: find <code>ipv6 unicast-routing</code> and notice the eui-64 line shows only the prefix", done:e=>e.mode==="priv" && e.log.some(l=>/^\s*sh\S*\s+run/i.test(l.cmd||"") && /ipv6 unicast-routing/.test(l.out||"") && /ipv6 address 2001:DB8:77:1::\/64 eui-64/.test(l.out||""))},
  ],
  win:"You enabled IPv6 with a link-local only, built an EUI-64 address and predicted it, saw C, L /128 and FF00::/8 in the IPv6 table, replaced the automatic link-local with fe80::1, saw that a second ipv6 address adds rather than replaces, and watched ipv6 unicast-routing add FF02::2 and the Router Advertisement lines.",
  solve:["enable","configure terminal","interface g0/0","ipv6 enable","no shutdown","do show ipv6 interface brief","interface g0/1","ipv6 address 2001:db8:77:1::/64 eui-64","no shutdown","do show ipv6 interface g0/1","do show ipv6 route","ipv6 address fe80::1 link-local","ipv6 address 2001:db8:77:1::1/64","do show ipv6 interface brief","exit","ipv6 unicast-routing","do show ipv6 interface g0/1","end","show running-config"]})}
<p>Expected: G0/0 = <code>FE80::72E4:22FF:FE99:1</code> (<code>70</code> → <code>72</code>); no route for it (link-local only); and G0/1 ends with <b>two</b> global addresses.</p>
${K.check({q:"show ipv6 interface g0/0 lists FF02::1 and FF02::1:FF00:1 but not FF02::2, and its last ND line is <code>ND NS retransmit interval is 1000 milliseconds</code>. What does that tell you?", o:["The interface is down","ipv6 unicast-routing is not configured, so the router isn't acting as an IPv6 router or sending RAs","The interface has no link-local address","The address was built by EUI-64"], a:1, why:"ff02::2 (all routers) and the 'ND router advertisements are sent…' lines appear only once ipv6 unicast-routing is on. Their absence is the fingerprint of a router acting as an IPv6 host."})}
<h3>Same logic, new situation</h3>
<p>A colleague sends one line from a router: <code>L   2001:DB8:3C:8:2E0:F7FF:FE1A:44B0/128 [0/0]   via GigabitEthernet0/1, receive</code>. Which command most likely created it, and what is G0/1's MAC?</p>
${K.hint(`An L /128 is one of the router's own addresses. Look at the middle of its interface ID. Expand <code>2E0</code> before you un-flip.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The command behind an L route, and a MAC. <b>2. Rules:</b> every global address gets an L /128; <code>FF:FE</code> mid-ID means EUI-64; reverse the steps for the MAC. <b>3. Apply it:</b> <code>02E0:F7FF:FE1A:44B0</code> → command <code>ipv6 address 2001:db8:3c:8::/64 eui-64</code> on G0/1; remove <code>FF FE</code>, flip <code>02</code> to <code>00</code> → MAC <code>00e0.f71a.44b0</code>.</p>`)}

<h2>Hands-on: bring up a dual-stack branch</h2>
<p>The ticket: <i>&ldquo;Yaba branch: add IPv6 to YABA-R1. Staff LAN 2001:db8:4a:10::/64, server LAN 2001:db8:4a:20::/64, router ::1 on each, link-locals fe80::1 (team standard — LOANS-SRV already uses gateway fe80::1). Keep IPv4 working.&rdquo;</i> The PCs are on the Windows default, &ldquo;Obtain an IPv6 address automatically&rdquo;.</p>
${K.svg("0 0 720 250",
  K.dev("pc",70,190,"PC1","SLAAC")+K.dev("pc",190,190,"PC2","SLAAC")+K.dev("switch",130,110,"YABA-SW","")+
  K.dev("router",360,110,"YABA-R1","ipv6 unicast-routing")+K.dev("server",600,110,"LOANS-SRV","2001:db8:4a:20::10/64")+
  K.link(130,122,70,170)+K.link(130,122,190,170)+K.link(156,110,336,110)+K.link(384,110,584,110)+
  K.txt(246,90,"G0/0",{c:"fg",s:11,mid:true})+K.txt(475,90,"G0/1",{c:"fg",s:11,mid:true})+
  K.txt(246,140,"2001:db8:4a:10::1/64",{c:"accent",s:10.5,mid:true})+K.txt(246,156,"fe80::1 link-local",{c:"accent",s:10.5,mid:true})+K.txt(246,172,"192.168.40.1/24",{c:"muted",s:10.5,mid:true})+
  K.txt(475,140,"2001:db8:4a:20::1/64",{c:"accent",s:10.5,mid:true})+K.txt(475,156,"fe80::1 link-local",{c:"accent",s:10.5,mid:true})+K.txt(475,172,"192.168.41.1/24",{c:"muted",s:10.5,mid:true})+
  K.txt(600,172,"gateway fe80::1 (static)",{c:"muted",s:10.5,mid:true})+
  K.txt(360,240,"Dual stack: every IPv4 address stays; IPv6 is added beside it.",{c:"fg",s:11.5,mid:true,f:"body"}),
  "The Yaba build sheet. Accent = what you add; the server's static settings expect the router at fe80::1.")}
${K.hint(`Follow the task order even if you know a better one — the point is to <i>see</i> what each switch changes. When a ping fails, the frame log's unanswered Neighbor Solicitation names the missing address.`)}
${K.bench({id:"m6-dual-stack-branch", points:100, from:"CCNA · Module 6 · lesson 3", title:"Yaba branch: add IPv6 beside IPv4 and watch SLAAC start", viewBox:"0 0 900 430", ipv6:true, openLog:true,
  intro:"Your console cable is on <code>YABA-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control). Use the PCs' Command Prompt for <code>ipconfig</code>, <code>ping</code> and <code>tracert</code>. The frame log shows the IPv6 Neighbor Solicitations and Advertisements.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r1", kind:"router", label:"YABA-R1", model:"ISR 1100 · Yaba branch", mac:"f87b.2091", x:330, y:30, config:e=>{ ["en","conf t","hostname YABA-R1","no ip domain-lookup","interface g0/0","description STAFF LAN","ip address 192.168.40.1 255.255.255.0","no shutdown","interface g0/1","description SERVER LAN","ip address 192.168.41.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"YABA-SW", model:"staff switch", x:330, y:190, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"pc1", kind:"pc", label:"PC1", x:200, y:320, ip:"192.168.40.21", mask:"255.255.255.0", gw:"192.168.40.1"},
    {id:"pc2", kind:"pc", label:"PC2", x:460, y:320, ip:"192.168.40.22", mask:"255.255.255.0", gw:"192.168.40.1"},
    {id:"srv", kind:"server", label:"LOANS-SRV", x:740, y:40, ip:"192.168.41.10", mask:"255.255.255.0", gw:"192.168.41.1", ip6:{auto:false, addr:"2001:db8:4a:20::10", len:64, gw:"fe80::1"}},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"pc1:eth", b:"sw:g2"}, {type:"cat6", a:"pc2:eth", b:"sw:g3"}, {type:"cat6", a:"srv:eth", b:"r1:g1"} ],
  tray:["cat6"],
  tasks:[
    {text:"Baseline: on PC1, <code>ipconfig</code>. IPv4 is complete; for IPv6 there is only a <code>Link-local IPv6 Address</code> — no IPv6 Address, no IPv6 gateway", done:B=>Bench.tried(B,"pc1",/^\s*ipconfig\s*$/i)},
    {text:"Console into YABA-R1, <code>enable</code>, <code>configure terminal</code>. Give G0/0 <code>2001:db8:4a:10::1/64</code> and G0/1 <code>2001:db8:4a:20::1/64</code> (<code>ipv6 address</code> in each interface)", done:B=>{ const v = B.devs.r1.env.v6info(); const has = (ios,a) => v.ifaces.some(f=>f.ios===ios && f.globals.some(g=>g.addr===a && g.len===64)); return has("GigabitEthernet0/0","2001:db8:4a:10::1") && has("GigabitEthernet0/1","2001:db8:4a:20::1"); }},
    {text:"Before turning routing on: <code>show ipv6 interface g0/0</code> (or <code>do show …</code>). The address is there — but is <code>FF02::2</code> in the joined groups, and are there any &ldquo;router advertisements are sent&rdquo; lines?", done:B=>B.devs.r1.env.log.some(l=>/2001:DB8:4A:10::1, subnet is 2001:DB8:4A:10::\/64/.test(l.out||"") && !/FF02::2\n/.test(l.out||"") && /ND NS retransmit/.test(l.out||""))},
    {text:"On PC1, <code>ping 2001:db8:4a:10::1</code> — the router's own address on PC1's LAN. Why <code>General failure</code>? (Hint: what IPv6 address and gateway does PC1 have?)", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+2001:db8:4a:10::1\s*$/i)},
    {text:"Switch on IPv6 routing on YABA-R1: <code>ipv6 unicast-routing</code> in global configuration mode", done:B=>B.devs.r1.env.v6info().routing},
    {text:"PC1: <code>ipconfig</code> again — an <code>IPv6 Address</code> 2001:db8:4a:10:… has appeared (SLAAC) and the gateway is YABA-R1's automatic link-local. Then <code>ping 2001:db8:4a:10::1</code>: replies", done:B=>Bench.pinged(B,"pc1","2001:db8:4a:10::1")},
    {text:"On-link test: from PC2, ping PC1's new IPv6 address (read it from PC1's <code>ipconfig</code>; in this lab it's prefix + EUI-64 of PC1's MAC). Watch the Neighbor Solicitation and Advertisement in the frame log", done:B=>Bench.pinged(B,"pc2","2001:db8:4a:10:250:9aff:fe50:54cf")},
    {text:"PC1: <code>ping 2001:db8:4a:20::10</code> (LOANS-SRV) — <code>Request timed out</code>. In the frame log, whose Neighbor Solicitation gets no answer, and for which address?", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+2001:db8:4a:20::10\s*$/i)},
    {text:"Apply the team standard: <code>ipv6 address fe80::1 link-local</code> on G0/0 and on G0/1", done:B=>{ const v = B.devs.r1.env.v6info(); return ["GigabitEthernet0/0","GigabitEthernet0/1"].every(n=>v.ifaces.some(f=>f.ios===n && f.ll==="fe80::1")); }},
    {text:"PC1: <code>ping</code> and <code>tracert 2001:db8:4a:20::10</code> — both work now; <code>ipconfig</code> shows the gateway has become <code>fe80::1%4</code> by itself", done:B=>Bench.pinged(B,"pc1","2001:db8:4a:20::10") && Bench.traced(B,"pc1","2001:db8:4a:20::10")},
    {text:"On YABA-R1, <code>show ipv6 route</code>: two C /64s, two L /128s, and <code>FF00::/8</code> via Null0", done:B=>B.devs.r1.env.log.some(l=>/L\s+2001:DB8:4A:20::1\/128/.test(l.out||"") && /FF00::\/8/.test(l.out||""))},
    {text:"Prove IPv4 is untouched (<code>ping 192.168.41.10</code> from PC1), then save YABA-R1's configuration (<code>write memory</code>)", done:B=>Bench.pinged(B,"pc1","192.168.41.10") && B.devs.r1.env.savedOnce},
  ],
  win:"You added IPv6 beside IPv4 without touching it. The addresses alone did nothing for the PCs; ipv6 unicast-routing started Router Advertisements, and PC1 and PC2 built their own addresses. LOANS-SRV stayed unreachable until the router really was fe80::1 — the gateway the server had been given.",
  solve:[["pc","pc1","ipconfig"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/0"],["term","ipv6 address 2001:db8:4a:10::1/64"],["term","interface g0/1"],["term","ipv6 address 2001:db8:4a:20::1/64"],["term","end"],["term","show ipv6 interface g0/0"],
    ["pc","pc1","ping 2001:db8:4a:10::1"],["term","configure terminal"],["term","ipv6 unicast-routing"],["term","end"],["pc","pc1","ipconfig"],["pc","pc1","ping 2001:db8:4a:10::1"],["pc","pc2","ping 2001:db8:4a:10:250:9aff:fe50:54cf"],["pc","pc1","ping 2001:db8:4a:20::10"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ipv6 address fe80::1 link-local"],["term","interface g0/1"],["term","ipv6 address fe80::1 link-local"],["term","end"],["pc","pc1","ping 2001:db8:4a:20::10"],["pc","pc1","tracert 2001:db8:4a:20::10"],["pc","pc1","ipconfig"],
    ["term","show ipv6 route"],["pc","pc1","ping 192.168.41.10"],["term","write memory"]]})}
<p>What you saw: with addresses but no routing, PC1 had only <code>fe80::250:9aff:fe50:54cf%4</code> — no prefix, no gateway, so <code>PING: transmit failed. General failure.</code> After <code>ipv6 unicast-routing</code> it heard an RA, built <code>2001:db8:4a:10:250:9aff:fe50:54cf</code> and took <code>fe80::fa7b:20ff:fe91:1%4</code> as gateway. The server ping failed on the <i>way back</i>: LOANS-SRV's reply needed its gateway <code>fe80::1</code>, and nothing answered that Neighbor Solicitation until you set it. (In this lab a host with static IPv6 settings ignores RAs. A real Windows server still listens to them by default and may quietly add the router's automatic link-local as a second gateway — which can hide a wrong static gateway until the RA source changes. Either way, type the gateway correctly.)</p>
${K.tip(`A real Windows PC shows a random interface ID (no <code>ff:fe</code>), usually a <code>Temporary IPv6 Address</code> too, and a random link-local. Match addresses to MACs with the router's <code>show ipv6 neighbors</code>.`)}
${K.check({q:"After 'ipv6 unicast-routing', PC1's gateway showed as fe80::fa7b:20ff:fe91:1%4. After you set 'ipv6 address fe80::1 link-local' on G0/0, it showed fe80::1%4. Why did PC1 change without anyone touching it?", o:["Windows polls the router's configuration every few seconds","PC1 uses SLAAC, so it takes its gateway from the Router Advertisements, and those now come from fe80::1","The switch rewrote the address","DHCPv6 pushed the new gateway"], a:1, why:"A SLAAC host's default gateway is the source address of the RAs it hears. The router now sends them from fe80::1, so hosts follow (the lab updates at once; a real PC adds fe80::1 when the next RA arrives — within about 200 seconds with IOS defaults — and may list the old gateway beside it for a while, until it stops answering or expires). A host with static IPv6 settings, like LOANS-SRV, never follows — its gateway has to be typed correctly."})}
<h3>Same logic, new situation</h3>
<p>At a Calabar hotel, Wi-Fi guests get IPv6, but the front-desk printer (static IPv6, gateway <code>fe80::1</code>) can't reach the cloud print service. The router's LAN link-local is <code>FE80::5A97:BDFF:FE10:6C21</code>. What's wrong, and which one command fixes it?</p>
${K.hint(`Who takes the gateway from RAs, and who has it typed in? Which address does the printer's gateway setting point at?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why static hosts fail while SLAAC hosts work. <b>2. Rule:</b> SLAAC hosts follow the RA's source; a static gateway must really exist on the link. <b>3. Apply it:</b> nothing answers for <code>fe80::1</code>. Fix: <code>ipv6 address fe80::1 link-local</code> on that interface; guests pick up the new gateway from the next RA.</p>`)}

${K.job("“Ikorodu laptops show only an fe80 address”",`
<p><b>The ticket.</b> &ldquo;Ikorodu branch: since last night's router replacement, laptops show only an fe80 address. IPv4 fine. The IPv6 test portal fails.&rdquo;</p>
<p><b>Questions first.</b> What changed? The router was swapped and the engineer restored the <i>interface</i> sections from the backup. Everyone or one laptop? Everyone — so suspect the router.</p>
<p><b>Checks.</b> A laptop, then the router:</p>
${K.out(`C:\\>ipconfig
Ethernet adapter Ethernet:
   Link-local IPv6 Address . . . . . : fe80::8d1c:2f4a:91b3:77e2%4
   IPv4 Address. . . . . . . . . . . : 192.168.60.34
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.60.1

IKD-R1#show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::1
    2001:DB8:6A:10::1
IKD-R1#show ipv6 interface g0/0 | include FF02::2|advertisements
IKD-R1#show running-config | include ipv6
 ipv6 address FE80::1 link-local
 ipv6 address 2001:DB8:6A:10::1/64`, "No IPv6 address or IPv6 gateway on the laptop. The router interface has the right addresses and is up/up — but there's no FF02::2, no RA lines, and no ipv6 unicast-routing line.")}
<p>Addresses right, interface up — but the filtered output is empty (no <code>FF02::2</code>, no RA lines) and there's no <code>ipv6 unicast-routing</code>: a global command, so it was never in the pasted interface sections. No RAs, no SLAAC.</p>
<p><b>The fix.</b> <code>ipv6 unicast-routing</code> in configuration mode. <code>show ipv6 interface g0/0</code> now shows <code>FF02::2</code> and the RA lines; usually within seconds (a router sends its first few RAs quickly once routing starts) a laptop's <code>ipconfig</code> shows an address in <code>2001:db8:6a:10::/64</code> and gateway <code>fe80::1%4</code>. Portal loads. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;One global setting that makes the router act as an IPv6 router wasn't restored after the swap, so it stopped telling laptops how to get IPv6. It's back on and saved; IPv4 was never affected.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;IKD-R1 after RMA swap (change 5203): global ipv6 unicast-routing missing → no RAs, hosts link-local only. Added, saved. Verified FF02::2 + RA lines on Gi0/0, laptop SLAAC + gateway fe80::1, portal OK 10:42. Suggest full-config restores on swaps. 22 min.&rdquo;</i></p>`)}

<h2>Hands-on: from EUI-64 to predictable addresses</h2>
<p>The ticket: <i>&ldquo;Wuse clinic, Abuja — WUSE-CLINIC-R1 was set up with eui-64. Firewall and monitoring need fixed addresses: 2001:db8:c1:10::1 (staff), 2001:db8:c1:20::1 (records), link-locals fe80::1. Approved for tonight. Note: RECORDS-SRV has static IPv6.&rdquo;</i> Plan first:</p>
${K.steps([
  ["What did EUI-64 build?", "MACs <code>a8b4.56c2.0001</code> (G0/0) and <code>.0002</code> (G0/1); <code>A8</code> → <code>AA</code>. You'll fill in the addresses in the practice question below."],
  ["What points at the old addresses?", "SLAAC hosts follow the RAs. Anything <b>typed by hand</b> doesn't: static gateways, firewall rules, monitoring, DNS. That &ldquo;note&rdquo; is a warning."],
  ["How do I replace, not add?", "Another <code>ipv6 address</code> line <i>adds</i>. Clear the interface with <code>no ipv6 address</code> (removes all its IPv6 addresses), then type the new global and link-local. You can also remove one address by repeating its line with <code>no</code> in front — here <code>no ipv6 address 2001:db8:c1:10::/64 eui-64</code>."],
])}
${K.q({type:"fill", q:"Before the change: what are WUSE-CLINIC-R1's current global address on G0/0 (MAC a8b4.56c2.0001, prefix 2001:db8:c1:10::/64, eui-64) and link-local on G0/1 (MAC a8b4.56c2.0002)?", fields:[{label:"G0/0 global", a:["2001:db8:c1:10:aab4:56ff:fec2:1","2001:db8:c1:10:aab4:56ff:fec2:0001","2001:0db8:00c1:0010:aab4:56ff:fec2:0001"]},{label:"G0/1 link-local", a:["fe80::aab4:56ff:fec2:2","fe80::aab4:56ff:fec2:0002","fe80:0:0:0:aab4:56ff:fec2:2","fe80:0000:0000:0000:aab4:56ff:fec2:0002"]}], why:"Split a8 b4 56 | c2 00 01, stuff ff fe, swap bit 7 of a8 (1010 1000 → 1010 1010 = aa): aab4:56ff:fec2:0001 → 2001:db8:c1:10:aab4:56ff:fec2:1. G0/1's MAC ends 0002, so its link-local is fe80::aab4:56ff:fec2:2. The bench below lets you confirm both."})}
${K.bench({id:"m6-eui64-to-manual", points:110, from:"CCNA · Module 6 · lesson 3", title:"Wuse clinic: replace EUI-64 addresses with predictable ones", viewBox:"0 0 900 430", ipv6:true, openLog:true,
  intro:"Your console cable is on <code>WUSE-CLINIC-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control). NURSE-PC uses SLAAC; RECORDS-SRV has static IPv6 settings (its <b>IPv6 settings</b> button opens them). IPv6 routing is already on.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r1", kind:"router", label:"WUSE-CLINIC-R1", model:"ISR 1100 · Wuse clinic", mac:"a8b4.56c2", x:330, y:30, config:e=>{ ["en","conf t","hostname WUSE-CLINIC-R1","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description STAFF LAN","ip address 10.21.10.1 255.255.255.0","ipv6 address 2001:db8:c1:10::/64 eui-64","no shutdown","interface g0/1","description RECORDS SERVERS","ip address 10.21.20.1 255.255.255.0","ipv6 address 2001:db8:c1:20::/64 eui-64","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"CLINIC-SW", model:"staff switch", x:330, y:190, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"pc1", kind:"pc", label:"NURSE-PC", x:330, y:320, ip:"10.21.10.31", mask:"255.255.255.0", gw:"10.21.10.1"},
    {id:"srv", kind:"server", label:"RECORDS-SRV", x:740, y:40, ip:"10.21.20.50", mask:"255.255.255.0", gw:"10.21.20.1", ip6:{auto:false, addr:"2001:db8:c1:20::50", len:64, gw:"fe80::aab4:56ff:fec2:2"}},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"pc1:eth", b:"sw:g2"}, {type:"cat6", a:"srv:eth", b:"r1:g1"} ],
  tray:["cat6"],
  tasks:[
    {text:"Survey the hosts first. NURSE-PC: <code>ipconfig</code> — which gateway did SLAAC give it? RECORDS-SRV: <code>ipconfig</code> — what gateway was typed in by hand?", done:B=>Bench.tried(B,"pc1",/^\s*ipconfig\s*$/i) && Bench.tried(B,"srv",/^\s*ipconfig\s*$/i)},
    {text:"Console in, <code>enable</code>, <code>show ipv6 interface brief</code>. Do G0/0 and G0/1 match the addresses you worked out?", done:B=>B.devs.r1.env.log.some(l=>/2001:DB8:C1:10:AAB4:56FF:FEC2:1/.test(l.out||"") && /FE80::AAB4:56FF:FEC2:2/.test(l.out||""))},
    {text:"<code>show running-config | section interface</code> — the configuration shows only <code>… /64 eui-64</code>. Note it in the change record as the &ldquo;before&rdquo; state", done:B=>B.devs.r1.env.log.some(l=>/^\s*sh\S*\s+run/i.test(l.cmd||"") && /ipv6 address 2001:DB8:C1:10::\/64 eui-64/.test(l.out||""))},
    {text:"G0/0: clear it with <code>no ipv6 address</code>, then <code>ipv6 address 2001:db8:c1:10::1/64</code> and <code>ipv6 address fe80::1 link-local</code>", done:B=>{ const f = B.devs.r1.env.v6info().ifaces.find(x=>x.ios==="GigabitEthernet0/0"); return !!f && f.ll==="fe80::1" && f.globals.length===1 && f.globals[0].addr==="2001:db8:c1:10::1" && !f.globals[0].eui; }},
    {text:"G0/1 the same way: <code>2001:db8:c1:20::1/64</code> and <code>fe80::1</code> link-local — no EUI-64 address left on the router", done:B=>{ const f = B.devs.r1.env.v6info().ifaces.find(x=>x.ios==="GigabitEthernet0/1"); return !!f && f.ll==="fe80::1" && f.globals.length===1 && f.globals[0].addr==="2001:db8:c1:20::1" && !f.globals[0].eui; }},
    {text:"NURSE-PC: <code>ping 2001:db8:c1:10::1</code> (the router's new address), then <code>ipconfig</code> — its gateway has moved to <code>fe80::1%4</code> on its own (at once in the lab; with the next RA on a real network)", done:B=>Bench.pinged(B,"pc1","2001:db8:c1:10::1")},
    {text:"NURSE-PC: <code>ping 2001:db8:c1:20::50</code> (RECORDS-SRV). If it times out, read the frame log: which Neighbor Solicitation gets no answer?", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+2001:db8:c1:20::50\s*$/i)},
    {text:"Fix the server: open RECORDS-SRV's <b>IPv6 settings</b> and change only the default gateway to <code>fe80::1</code> (address <code>2001:db8:c1:20::50</code>, length 64)", done:B=>{ const s = B.devs.srv.ip6; return !!s && !s.auto && s.gw==="fe80::1" && s.addr==="2001:db8:c1:20::50"; }},
    {text:"NURSE-PC: <code>ping 2001:db8:c1:20::50</code> again — replies", done:B=>Bench.pinged(B,"pc1","2001:db8:c1:20::50") && B.devs.srv.ip6.gw==="fe80::1"},
    {text:"On the router, <code>show ipv6 route</code>: the L /128s are now the predictable <code>::1</code> addresses", done:B=>B.devs.r1.env.log.some(l=>/L\s+2001:DB8:C1:20::1\/128/.test(l.out||"") && !/FEC2/.test(l.out||""))},
    {text:"<code>show ipv6 interface g0/1</code>: no <code>[EUI]</code> tag, link-local <code>FE80::1</code>. Then <code>write memory</code>", done:B=>B.devs.r1.env.log.some(l=>/GigabitEthernet0\/1 is up[\s\S]*link-local address is FE80::1 [\s\S]*2001:DB8:C1:20::1, subnet is/.test(l.out||"") && !/\[EUI\]/.test(l.out||"")) && B.devs.r1.env.savedOnce},
  ],
  win:"You predicted what EUI-64 had built, replaced it with addresses the firewall team can write down, and found the hidden dependency: a static server gateway typed as the old EUI-64 link-local. SLAAC hosts followed the change on their own; the static one needed a person.",
  solve:[["pc","pc1","ipconfig"],["pc","srv","ipconfig"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 interface brief"],["term","show running-config | section interface"],
    ["term","configure terminal"],["term","interface g0/0"],["term","no ipv6 address"],["term","ipv6 address 2001:db8:c1:10::1/64"],["term","ipv6 address fe80::1 link-local"],["term","interface g0/1"],["term","no ipv6 address"],["term","ipv6 address 2001:db8:c1:20::1/64"],["term","ipv6 address fe80::1 link-local"],["term","end"],
    ["pc","pc1","ping 2001:db8:c1:10::1"],["pc","pc1","ipconfig"],["pc","pc1","ping 2001:db8:c1:20::50"],["ip6","srv","static","2001:db8:c1:20::50","64","fe80::1"],["pc","pc1","ping 2001:db8:c1:20::50"],
    ["term","show ipv6 route"],["term","show ipv6 interface g0/1"],["term","write memory"]]})}
<p>NURSE-PC never noticed: its gateway is whatever sends the RAs. RECORDS-SRV's typed gateway <code>fe80::aab4:56ff:fec2:2</code> vanished, so its replies had nowhere to go until you changed it to <code>fe80::1</code> — which will survive the next hardware swap.</p>
${K.mistake(`Calling it done because a test straight after the change worked. If the server had talked to the router just before, its neighbour cache still holds the router's MAC, and replies keep flowing until that entry is re-checked. On real kit that is usually within a minute: an entry counts as &ldquo;reachable&rdquo; for about 30 seconds (randomised between 15 and 45), then a few seconds of unanswered checks remove it — longer while a busy TCP session keeps confirming it. (The lab re-checks at once: a cached neighbour that no longer has the address is dropped and solicited again, so there the failure shows on the first test.) Find what points at the old addresses <i>before</i> the change.`)}
${K.check({q:"An interface has 'ipv6 address 2001:db8:c1:10::/64 eui-64'. The engineer adds 'ipv6 address 2001:db8:c1:10::1/64' and nothing else. What does show ipv6 interface brief show for it?", o:["Only 2001:DB8:C1:10::1 — the new address replaces the old","Both the EUI-64 address and 2001:DB8:C1:10::1, plus the link-local","An error: two addresses in the same /64","Only the EUI-64 address — IOS keeps the first"], a:1, why:"IPv6 interfaces can hold several global addresses; a second ipv6 address line adds one. To replace, remove the old one (no ipv6 address clears them all) before adding the new."})}
<h3>Same logic, new situation</h3>
<p>An Abuja ministry office swapped a faulty router for an identical model and restored the full configuration. Users are fine, but monitoring says the router's IPv6 address is &ldquo;down&rdquo; and a partner's firewall blocks its IPv6 traffic. The config has <code>ipv6 address 2001:db8:e5:1::/64 eui-64</code>. Explain it in one sentence and propose the fix.</p>
${K.hint(`What does the eui-64 line depend on that is <i>not</i> in the configuration?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why addresses changed when the configuration didn't. <b>2. Rule:</b> an EUI-64 ID comes from the MAC, which belongs to the hardware, not the configuration. <b>3. Apply it:</b> new MACs, new address. &ldquo;The router's IPv6 address was built from its hardware ID, so the replacement got a new one that monitoring and the partner don't know.&rdquo; Fix: manual <code>2001:db8:e5:1::1/64</code> and <code>fe80::1 link-local</code>, then update monitoring and the partner once — for good.</p>`)}

${K.case("The DMZ that renumbered itself",`
<p>A Lagos fintech's DMZ routers were set up for IPv6 in a hurry: <code>eui-64</code> everywhere, automatic link-locals. For two years it worked; the firewall team copied the routers' addresses into rules, and a web server's gateway was typed as a long <code>fe80::</code> link-local.</p>
<p>A power surge killed one router's mainboard. The replacement arrived within hours and the backup configuration went straight on. IPv4 came back, and SLAAC hosts followed the new RAs at once. But the web server with the static gateway lost IPv6 within minutes, and a partner bank's allow-list, written against the old EUI-64 address, began dropping the company's IPv6 API calls. Same configuration; different MACs.</p>
<p>The review set three rules: <b>infrastructure gets manual addresses</b> (<code>::1</code>/<code>::2</code>, <code>fe80::1</code>/<code>fe80::2</code>); <b>EUI-64 only where nobody needs the address</b> (in practice, labs); <b>every swap compares <code>show ipv6 interface brief</code> before and after</b>. The next failure, a year later, needed no changes outside the router.</p>`)}
${K.myth([
  ["IPv6 routing is on by default, like IPv4.","IPv4 routing is on by default; IPv6 isn't. Without ipv6 unicast-routing the router acts as an IPv6 host: it has addresses and answers pings, but forwards nothing and sends no Router Advertisements."],
  ["ipv6 unicast-routing only affects forwarding.","It also starts Router Advertisements and joins FF02::2. Without it, SLAAC hosts on the LAN get no global address and no IPv6 gateway."],
  ["EUI-64 just copies the MAC into the address.","It splits the MAC, inserts FFFE in the middle and flips bit 7 of the first byte (the U/L bit). Forget the flip and you get the wrong address."],
  ["Each interface of a router needs a different link-local address.","A link-local only has to be unique on its own link. fe80::1 on every interface of one router is normal; two routers on the same link must differ."],
])}
${K.dodont([
  "Type <code>ipv6 unicast-routing</code> on every IPv6 router, and check for it.",
  "Give router interfaces manual addresses (<code>::1</code>, <code>fe80::1</code>) and record them in the plan.",
  "When hosts get no IPv6 address, look for <code>FF02::2</code> and the RA lines.",
  "Before re-addressing, find everything typed against the old addresses.",
],[
  "Don't use <code>eui-64</code> for addresses people or rules must know.",
  "Don't type a prefix length on a link-local.",
  "Don't give two routers on one link the same link-local.",
  "Don't treat a successful ping to the router as proof IPv6 routing is on.",
])}
${K.dyk(`On Cisco <b>Layer 3 switches</b> even IPv4 routing starts off (<code>ip routing</code>, Module 4), and IPv6 needs <code>ipv6 unicast-routing</code> too. Some older Catalyst models also needed a dual-stack Switch Database Management (SDM) template, which reserves hardware memory for IPv6, plus a reload: a Catalyst 3560 or 3750 would not route IPv6 until <code>sdm prefer dual-ipv4-and-ipv6 routing</code> was set, and a Catalyst 2960 needed a dual-stack template even to give itself an IPv6 management address. Most current models include IPv6 in their default template.`)}

<h2>Interview corner</h2>
${K.hint(`Two effects, and the symptom you'd see without it.`)}
${K.reveal("“What does ipv6 unicast-routing do, and how would you notice it was missing?”",`<p>"It turns the router from an IPv6 host into an IPv6 router: it forwards IPv6 between interfaces, and it sends Router Advertisements and joins FF02::2. Without it the interfaces still have addresses and answer pings, so it's easy to miss; the symptom is SLAAC hosts with only a link-local and no IPv6 gateway. I'd confirm with show ipv6 interface — no FF02::2, no RA lines — and the running-config."</p>`)}
${K.hint(`The three steps, a worked number, and one reason to avoid it.`)}
${K.reveal("“Walk me through modified EUI-64. Would you use it on a router?”",`<p>"It makes a 64-bit interface ID from a 48-bit MAC: split it, insert FFFE, invert bit 7 of the first byte, the universal/local bit — 5ca6.2d41.7e09 becomes 5EA6:2DFF:FE41:7E09. IOS uses it for automatic link-locals and with the eui-64 keyword. On routers I configure ::1 and fe80::1 manually instead, because EUI-64 addresses change with the hardware and firewall rules, monitoring and static gateways depend on them. It also exposes the MAC, which is why hosts now use random IDs."</p>`)}
${K.hint(`What the link-local is used for, and who depends on it.`)}
${K.reveal("“Why would you configure ipv6 address fe80::1 link-local when the router already has a link-local address?”",`<p>"Hosts use the router's link-local as their default gateway, and neighbours use it as a next hop. The automatic one comes from the MAC: long, hard to type into static hosts, and it changes when the router is replaced. fe80::1 is easy to type, readable in tables and stable across swaps. It only has to be unique per link, so it can go on every interface of one router — just not on two routers sharing a link."</p>`)}

${K.recap([
  "Two switches: ipv6 unicast-routing (global — forwarding, Router Advertisements, FF02::2) and an address per interface. IPv6 routing is off by default.",
  "ipv6 address X/64: prefix length, no mask; enables IPv6, creates a link-local, gives C /64 and L /128. A second line adds, not replaces.",
  "No RA, no SLAAC: without ipv6 unicast-routing, hosts get only a link-local and no IPv6 gateway.",
  "Modified EUI-64: split the MAC, insert FFFE, flip bit 7 of the first byte (0↔2, 4↔6, 8↔A, C↔E…). 5ca6.2d41.7e09 → 5EA6:2DFF:FE41:7E09.",
  "eui-64 addresses show [EUI] in show ipv6 interface; the running-config shows only the prefix; they change with the hardware.",
  "One link-local per interface: automatic (FE80:: + EUI-64) or ipv6 address fe80::1 link-local (no length). Unique per link, never routed. ipv6 enable = link-local only.",
  "Verify with show ipv6 interface brief, show ipv6 interface, show ipv6 route (C, L /128, FF00::/8 via Null0) and show running-config | include ipv6.",
])}
${K.next(`<b>Lesson 4 — How IPv6 hosts find neighbours and routers and build their own addresses.</b> The Neighbor Discovery messages behind what you just saw (router and neighbour solicitations and advertisements), the solicited-node groups, duplicate address detection, and when DHCPv6 takes over from SLAAC.`)}
`,
quiz:[
  {lvl:1, q:"Which two things does the global command ipv6 unicast-routing switch on that a router with IPv6 addresses but without it does not do?", o:["It enables IPv6 on every interface and creates link-local addresses","It forwards IPv6 packets between interfaces and sends Router Advertisements on IPv6-enabled interfaces","It turns on DHCPv6 and OSPFv3","It creates EUI-64 addresses on every interface"], a:1, why:"Without ipv6 unicast-routing the router acts as an IPv6 host: it has addresses and answers pings. The command turns on forwarding and Router Advertisements (and joins ff02::2). It doesn't enable IPv6 on interfaces — that's ipv6 address or ipv6 enable."},
  {lvl:1, type:"fill", q:"Which global configuration command makes a Cisco router forward IPv6 packets and send Router Advertisements?", fields:[{label:"Command", a:["ipv6 unicast-routing"], ios:true}], why:"ipv6 unicast-routing. There is no 'ipv6 routing' command. IPv4 routing is on by default on Cisco routers; IPv6 routing is not."},
  {lvl:2, type:"fill", q:"A router interface with MAC 0050.56a1.b2c3 is configured with ipv6 address 2001:db8:abc:7::/64 eui-64. What is its global unicast address? (Shortest form, any case.)", fields:[{label:"Address", a:["2001:db8:abc:7:250:56ff:fea1:b2c3","2001:db8:abc:7:0250:56ff:fea1:b2c3","2001:0db8:0abc:0007:0250:56ff:fea1:b2c3"]}], why:"Split 00 50 56 | a1 b2 c3, insert ff fe, flip bit 7 of 00 → 02: interface ID 0250:56ff:fea1:b2c3. Behind the prefix and with leading zeros dropped: 2001:db8:abc:7:250:56ff:fea1:b2c3."},
  {lvl:2, q:"Based on the exhibit, which command was used to configure the global address on G0/0?", ex:"R2#show ipv6 interface g0/0\nGigabitEthernet0/0 is up, line protocol is up\n  IPv6 is enabled, link-local address is FE80::2\n  No Virtual link-local address(es):\n  Global unicast address(es):\n    2001:DB8:9:4:6E41:6AFF:FE3D:80A1, subnet is 2001:DB8:9:4::/64 [EUI]\n  Joined group address(es):\n    FF02::1\n    FF02::2\n    FF02::1:FF00:2\n    FF02::1:FF3D:80A1", o:["ipv6 address 2001:db8:9:4:6e41:6aff:fe3d:80a1/64","ipv6 address 2001:db8:9:4::/64 eui-64","ipv6 address autoconfig","ipv6 enable"], a:1, why:"[EUI] means the interface ID was built by EUI-64 from the MAC, which the eui-64 keyword does from the /64 prefix. The link-local fe80::2 was set separately with ipv6 address fe80::2 link-local. ff02::2 shows ipv6 unicast-routing is on."},
  {lvl:2, type:"multi", q:"An engineer enters ipv6 unicast-routing on a router whose G0/0 already has ipv6 address 2001:db8:1:1::1/64 and is up/up. Which three changes follow? (Choose three.)", o:["G0/0 joins the all-routers group FF02::2","The router starts sending Router Advertisements for 2001:db8:1:1::/64 out of G0/0","The router starts forwarding IPv6 packets between its interfaces","G0/0's link-local address changes to FE80::1","IPv6 is enabled on every other interface","The router starts handing out addresses with DHCPv6"], a:[0,1,2], why:"ipv6 unicast-routing joins ff02::2, starts RAs and turns on forwarding. Link-locals don't change, other interfaces stay without IPv6 until configured, and DHCPv6 needs its own configuration (lesson 4)."},
  {lvl:1, type:"match", q:"Match each interface command with its result.", pairs:[["ipv6 enable","IPv6 on, with only an automatic link-local address"],["ipv6 address 2001:db8:5::1/64","A manually chosen global address"],["ipv6 address 2001:db8:5::/64 eui-64","A global address whose interface ID comes from the MAC"],["ipv6 address fe80::1 link-local","A manually chosen link-local that replaces the automatic one"]], why:"ipv6 enable gives link-local only. A full address with /64 is manual. eui-64 builds the interface ID from the MAC. The link-local keyword (no prefix length) sets the one link-local address an interface has."},
  {lvl:1, type:"order", q:"Put the steps of modified EUI-64 in order, starting from a 48-bit MAC address.", items:["Split the MAC into two 24-bit halves","Insert FFFE between the halves to make 64 bits","Invert bit 7 of the first byte (the U/L bit)","Write the 64 bits as four hextets and place them after the /64 prefix"], why:"Split, stuff, swap: halve the MAC, insert fffe, flip the universal/local bit, then the result is the interface ID that follows the 64-bit prefix."},
  {lvl:2, q:"Based on the exhibit, which statement is correct?", ex:"R1#show ipv6 route\nIPv6 Routing Table - default - 5 entries\nC   2001:DB8:4A:10::/64 [0/0]\n     via GigabitEthernet0/0, directly connected\nL   2001:DB8:4A:10::1/128 [0/0]\n     via GigabitEthernet0/0, receive\nC   2001:DB8:4A:20::/64 [0/0]\n     via GigabitEthernet0/1, directly connected\nL   2001:DB8:4A:20::1/128 [0/0]\n     via GigabitEthernet0/1, receive\nL   FF00::/8 [0/0]\n     via Null0, receive", o:["FF00::/8 via Null0 means multicast traffic is being dropped by mistake","The L /128 entries are the router's own global addresses; link-local addresses are not listed because they are never routed","The router has no link-local addresses","The L entries are static routes added by the engineer"], a:1, why:"Each global address gets an L /128 (deliver to me), each /64 a C route. Link-locals exist but never appear as routes. L ff00::/8 via Null0, receive is always present: multicast is handled by the router itself, not forwarded like unicast."},
  {lvl:3, q:"Since a router was replaced, laptops on its LAN show only a Link-local IPv6 Address and no IPv6 gateway; IPv4 works. Based on the exhibit from the router, what is the most likely cause?", ex:"KANO-R1#show ipv6 interface brief\nGigabitEthernet0/0     [up/up]\n    FE80::1\n    2001:DB8:B7:30::1\nKANO-R1#show ipv6 interface g0/0\nGigabitEthernet0/0 is up, line protocol is up\n  IPv6 is enabled, link-local address is FE80::1\n  Global unicast address(es):\n    2001:DB8:B7:30::1, subnet is 2001:DB8:B7:30::/64\n  Joined group address(es):\n    FF02::1\n    FF02::1:FF00:1\n  ...\n  ND reachable time is 30000 milliseconds (using 30000)\n  ND NS retransmit interval is 1000 milliseconds", o:["The interface prefix length is wrong for SLAAC","ipv6 unicast-routing is missing, so the router sends no Router Advertisements","The link-local address FE80::1 is invalid for a gateway","The laptops need IPv6 enabled in Windows"], a:1, why:"The /64 is right and the interface is up/up. But ff02::2 is missing and there are no 'router advertisements are sent' lines, so the router isn't acting as an IPv6 router. No RAs means no SLAAC address and no IPv6 gateway. Configure ipv6 unicast-routing."},
  {lvl:3, type:"fill", q:"A router's show ipv6 neighbors lists a virtual machine at fe80::a00:27ff:fe4e:66a1. Assuming the address was built by EUI-64, what is the VM's MAC address? (Any common format.)", fields:[{label:"MAC", a:["0800.274e.66a1","08-00-27-4e-66-a1","08:00:27:4e:66:a1","0800274e66a1"]}], why:"Expand a00 to 0a00: interface ID 0a00:27ff:fe4e:66a1. Remove ff fe → 0a 00 27 4e 66 a1. 0a = 0000 1010 has bit 7 set, so un-flipping gives 0000 1000 = 08. MAC 0800.274e.66a1 (08:00:27 is VirtualBox's OUI). Forget to expand and you'd start from a0."},
  {lvl:3, type:"fill", q:"A virtual router uses the locally administered MAC 0200.5e10.0001. What global address does ipv6 address 2001:db8:5:1::/64 eui-64 give it? (Shortest standard form.)", fields:[{label:"Address", a:["2001:db8:5:1:0:5eff:fe10:1","2001:db8:5:1::5eff:fe10:1","2001:db8:5:1:0000:5eff:fe10:0001","2001:db8:5:1:0:5eff:fe10:0001","2001:0db8:0005:0001:0000:5eff:fe10:0001"]}], why:"Split 02 00 5e | 10 00 01, insert ff fe, flip bit 7 of 02: it's already 1, so it becomes 0 → 00. Interface ID 0000:5eff:fe10:0001 → 2001:db8:5:1:0:5eff:fe10:1. RFC 5952 says don't use :: for a single all-zero hextet, so the recommended form keeps :0:."},
  {lvl:2, q:"An engineer types ipv6 address fe80::1/64 link-local on G0/1 and IOS rejects it. What is wrong?", o:["fe80::1 is not a valid link-local address","A link-local address is configured without a prefix length","The keyword should be local-link","Link-local addresses can only be set with ipv6 enable"], a:1, why:"The correct form is ipv6 address fe80::1 link-local, with no /64. A link-local always belongs to fe80::/10, so the length isn't given."},
  {lvl:2, q:"Which statement about link-local addresses on one Cisco router is true?", o:["Every interface must have a different link-local address","The same manual link-local, such as fe80::1, can be used on several interfaces because it only has to be unique on each link","Link-local addresses are added to the routing table as L /128 routes","A manual link-local is added alongside the automatic one"], a:1, why:"Link-local scope is one link, and IOS always knows which interface a link-local is on, so fe80::1 on every interface is common. Link-locals never appear as routes, and an interface has exactly one link-local — a manual one replaces the automatic one."},
  {lvl:3, q:"A router's interfaces use ipv6 address PREFIX/64 eui-64. After its chassis was replaced and the same configuration restored, SLAAC hosts work, but a server with a static IPv6 gateway and a partner's firewall rule both fail. What is the best long-term fix?", o:["Restore the configuration again so the EUI-64 addresses come back","Configure manual global addresses and a manual link-local such as fe80::1, then update the server and the partner's rule once","Turn off ipv6 unicast-routing so hosts stop using the router","Change the server to use the router's new EUI-64 link-local"], a:1, why:"EUI-64 interface IDs come from the hardware MAC, so new hardware means new addresses even with the same configuration. Manual addresses (::1, fe80::1) don't change with hardware. Copying the new EUI-64 link-local only fixes it until the next swap."},
  {lvl:2, q:"A link between two of your routers needs IPv6, but no global prefix has been planned for it. Which interface command gives IPv6 there with only a link-local address?", o:["ipv6 address autoconfig","ipv6 enable","ipv6 address fe80::/10","ipv6 unicast-routing"], a:1, why:"ipv6 enable turns IPv6 on with only the automatic link-local. ipv6 address autoconfig makes the interface use SLAAC (lesson 4); ipv6 unicast-routing is a global command; fe80::/10 isn't a valid address command."},
  {lvl:1, q:"In modified EUI-64, why is FFFE inserted?", o:["To mark the address as link-local","To fill the 48-bit MAC up to the 64 bits an interface ID needs","To make the address globally routable","To encrypt the MAC address"], a:1, why:"A MAC is 48 bits and an IPv6 interface ID on a /64 is 64 bits; the fixed 16-bit filler fffe goes in the middle. It's also why ff:fe in the middle of an interface ID gives EUI-64 away."},
],
cards:[
  {f:"ipv6 unicast-routing", b:"Global command. Turns a router from an IPv6 host into an IPv6 router: forwards IPv6 between interfaces, sends Router Advertisements, joins ff02::2. Off by default (IPv4 routing is on by default)."},
  {f:"No RA, no SLAAC", b:"Hosts build their IPv6 address and find their gateway from Router Advertisements. A router without ipv6 unicast-routing sends none, so hosts get only a link-local address and no IPv6 gateway."},
  {f:"ipv6 address syntax", b:"ipv6 address 2001:db8:4a:10::1/64 — the prefix length after a slash, no mask. A second line adds another address; it doesn't replace. Creates a C /64 and an L /128."},
  {f:"Modified EUI-64 steps", b:"Split the MAC in half, insert fffe, flip bit 7 of the first byte (the U/L bit). 5ca6.2d41.7e09 → 5ea6:2dff:fe41:7e09. 'Split, stuff, swap.'"},
  {f:"The bit-7 flip without binary", b:"Only the second hex digit of the first byte changes, by 2: 0↔2, 1↔3, 4↔6, 5↔7, 8↔A, 9↔B, C↔E, D↔F. 00 → 02, a8 → aa, 02 → 00."},
  {f:"ipv6 address PREFIX/64 eui-64", b:"Router builds the interface ID from that interface's MAC. show ipv6 interface tags it [EUI]; the running-config shows only the prefix. Changes if the hardware changes."},
  {f:"Automatic link-local on Cisco", b:"fe80:: + the EUI-64 interface ID from the interface MAC. Created as soon as IPv6 is enabled on the interface."},
  {f:"Manual link-local", b:"ipv6 address fe80::1 link-local — no prefix length. Replaces the automatic one (one link-local per interface). Unique per link, so fe80::1 can go on every interface of one router."},
  {f:"Why fe80::1 on routers", b:"Hosts use the router's link-local as their gateway and neighbours use it as a next hop. fe80::1 is easy to type into static hosts, readable in outputs, and survives hardware swaps."},
  {f:"ipv6 enable", b:"Enables IPv6 on an interface with only an automatic link-local address. Not needed if the interface has an ipv6 address. No global address means no C/L route and no prefix in RAs."},
  {f:"show ipv6 interface — the fingerprints", b:"[EUI] = EUI-64 address. ff02::2 joined + 'ND router advertisements are sent…' = ipv6 unicast-routing on. No FF02::2 and the ND section ending with the 'retransmit interval' line = not routing, no RAs."},
  {f:"show ipv6 route", b:"C = connected /64, L = the router's own address as a /128 (receive), plus L ff00::/8 via Null0 (multicast handled by the router itself). Link-local addresses never appear as routes."},
  {f:"SLAAC host vs static host after a link-local change", b:"SLAAC hosts take their gateway from the RA source, so they follow automatically. Static hosts keep the typed gateway — update it, or the host's replies go nowhere."},
],
});

// ---------- Module 6 · Lesson 4 ----------
L.push({
id:"ipv6-ndp", mins:80, level:"Intermediate · builds on Modules 1–5 and lessons 1–3",
t:"How IPv6 hosts find neighbours and routers and build their own addresses: NDP, SLAAC and DHCPv6",
html:`
${K.goals([
  "Name NDP's five messages (ICMPv6 types 133–137): who sends each, to where, carrying what.",
  "Work out any address's solicited-node group and its 33-33-ff MAC, and say why it beats an ARP broadcast.",
  "Walk through SLAAC step by step and watch it happen on a bench.",
  "Choose SLAAC, stateless or stateful DHCPv6 from the RA's M and O flags — and say where the gateway comes from.",
  "Read Windows <code>ipconfig</code> IPv6 lines and IOS <code>show ipv6 neighbors</code> / <code>show ipv6 interface</code>, and fix a segment whose hosts have only fe80:: addresses.",
])}
${K.pre(["Module 2: Ethernet, MAC addresses and ARP.","Module 3: the default gateway and on-subnet versus off-subnet.","Module 6 lessons 1–3: IPv6 address notation, link-local and multicast addresses, modified EUI-64, and <code>ipv6 unicast-routing</code>, <code>ipv6 address</code>, <code>show ipv6 interface</code>."])}

<h2>Why this matters at work</h2>
<p>Monday, 09:05, an insurer's Abuja head office. The ISP switched IPv6 on over the weekend. Floors 2 to 4 are fine; floor 5 floods the helpdesk with &ldquo;the test page says I have no IPv6&rdquo;. A junior engineer starts typing static addresses into laptops.</p>
<p>Stop him. IPv6 laptops <b>build their own addresses</b> from a few facts their router announces. A whole floor with only <code>fe80::</code> addresses means healthy laptops and a silent router. Know what a host listens for and what a router must say, and that morning becomes a two-command fix — which you'll make on a bench in this lesson.</p>

<h2>No ARP, no broadcast: what Neighbor Discovery replaces</h2>
<p>In IPv4 (Module 2) a host that needs a neighbour's MAC shouts an ${K.g("ARP","Address Resolution Protocol (Module 2): IPv4's broadcast 'who has this IP? tell me your MAC'.")} request to <code>ffff.ffff.ffff</code>, and every device on the subnet stops to read it. <b>IPv6 has no broadcast address at all</b> — every &ldquo;shout to everyone&rdquo; became a multicast to a group only interested devices join (lesson 2) — and no ARP. One protocol does ARP's job and more: ${K.g("NDP","Neighbor Discovery Protocol (RFC 4861): finds routers, prefixes and neighbours' MACs, checks addresses are unique, redirects hosts.")} (Neighbor Discovery Protocol, often shortened to ${K.g("ND","Neighbor Discovery — the usual short name for NDP; IOS output says ND.")}).</p>
<p>Plain version: <b>NDP is how an IPv6 device asks &ldquo;who are my routers, which prefix am I on, and what is this neighbour's MAC?&rdquo; — with a few ICMPv6 messages sent to small multicast groups.</b> Two things set it apart from ARP:</p>
<ul>
<li><b>It runs inside IPv6.</b> NDP messages are ${K.g("ICMPv6","ICMP for IPv6: errors, ping and Neighbor Discovery. IPv6 cannot work without it.")} packets, the same family as IPv6 ping. Block ICMPv6 on a LAN and IPv6 stops.</li>
<li><b>It stays on the link.</b> Every ND message is sent with ${K.g("hop limit","IPv6's TTL: lowered by each router; the packet dies at 0.")} 255, and receivers discard ND messages that arrive with less. A router would have lowered it, so a valid ND message can only come from the local link.</li>
</ul>
<h3>The five messages — ICMPv6 types 133 to 137</h3>
<p>Two pairs and one extra: a pair about <b>routers</b>, a pair about <b>neighbours</b> (any device on the link), and a correction.</p>
<div class="tablewrap"><table>
<tr><th>Type</th><th>Message</th><th>Sent by → to</th><th>Carries / used for</th></tr>
<tr><td><b>133</b></td><td>${K.g("Router Solicitation","RS: a host asking 'any routers here? advertise now'. Sent to ff02::2.")} (RS)</td><td>Host → <code>ff02::2</code> (all routers), from its link-local (or <code>::</code>)</td><td>&ldquo;Tell me your settings now&rdquo; — so a booting host needn't wait for the next periodic RA</td></tr>
<tr><td><b>134</b></td><td>${K.g("Router Advertisement","RA: a router announcing itself and the link's settings — prefixes, flags, how long to use it as default router.")} (RA)</td><td>Router → <code>ff02::1</code> (all nodes) periodically and in answer to an RS, <b>from its link-local</b></td><td>Prefix(es) and length, each with an <b>A</b> flag (&ldquo;build an address from this&rdquo;); <b>router lifetime</b> (how long to use me as default router; 0 = don't); <b>M</b> and <b>O</b> flags (section 4); MTU; the router's MAC</td></tr>
<tr><td><b>135</b></td><td>${K.g("Neighbor Solicitation","NS: 'who has this IPv6 address? here's my MAC'. Sent to the target's solicited-node group; also used for DAD.")} (NS)</td><td>Any node → the target's <b>solicited-node group</b> (or unicast, to re-check a known neighbour)</td><td>Target address + sender's MAC. ARP's job; also duplicate address detection</td></tr>
<tr><td><b>136</b></td><td>${K.g("Neighbor Advertisement","NA: the answer to an NS — 'that address is mine, here is my MAC'.")} (NA)</td><td>Owner → the asker (unicast), or <code>ff02::1</code> to announce a change</td><td>Target address + its MAC; flags R (I'm a router), S (solicited), O (override)</td></tr>
<tr><td><b>137</b></td><td>${K.g("Redirect","A router telling a host: for that destination, another router on your own link is a better first hop.")}</td><td>Router → one host</td><td>&ldquo;Don't send that through me — R2, beside you, is the better way&rdquo;</td></tr>
</table></div>
${K.remember(`<b>133 → 137 in the order a new host meets them:</b> ask for routers (RS), a router answers (RA), ask for a neighbour (NS), it answers (NA), and a router corrects you if needed (Redirect). <b>Solicitation = asking, Advertisement = answering</b> — first about routers, then about neighbours, then the correction.`)}
<p><b>Why does the RA come from the router's link-local?</b> A router's global addresses can change or be many; its link-local stays put while the interface is up. So hosts record the link-local as their gateway — which is why IPv6 PCs show gateways like <code>fe80::1</code>. Correct, not broken.</p>
${K.svg("0 0 720 290",
  K.band(10,6,340,24,"IPv4 ARP request → ffff.ffff.ffff","var(--chip)")+K.band(370,6,340,24,"IPv6 NS → 3333.ff00.0001","var(--chip)")+
  K.dev("pc",180,62,"PC-A","who has 10.1.1.1?")+
  K.arrow(176,112,52,168)+K.arrow(178,112,135,168)+K.arrow(182,112,220,168)+K.arrow(184,112,304,168,"",true)+
  K.dev("pc",50,192,"PC-B")+K.dev("pc",135,192,"PC-C")+K.dev("pc",220,192,"PC-D")+K.dev("router",305,192,"R1","10.1.1.1")+
  K.txt(50,262,"CPU reads it",{c:"bad",mid:true,s:10})+K.txt(135,262,"CPU reads it",{c:"bad",mid:true,s:10})+K.txt(220,262,"CPU reads it",{c:"bad",mid:true,s:10})+K.txt(305,262,"reads it — mine",{c:"ok",mid:true,s:10})+
  K.dev("pc",540,62,"PC-A","who has fe80::1?")+
  K.arrow(536,112,412,168)+K.arrow(538,112,495,168)+K.arrow(542,112,580,168)+K.arrow(544,112,664,168,"",true)+
  K.dev("pc",410,192,"PC-B")+K.dev("pc",495,192,"PC-C")+K.dev("pc",580,192,"PC-D")+K.dev("router",665,192,"R1","fe80::1")+
  K.txt(410,262,"NIC drops it",{c:"muted",mid:true,s:10})+K.txt(495,262,"NIC drops it",{c:"muted",mid:true,s:10})+K.txt(580,262,"NIC drops it",{c:"muted",mid:true,s:10})+K.txt(665,262,"in group: answers",{c:"ok",mid:true,s:10})+
  K.txt(360,284,"A switch without MLD snooping floods both frames to every port. The difference is who has to look inside.",{c:"fg",s:11,mid:true,f:"body"}),
  "Left: an ARP broadcast interrupts every host's processor. Right: an NS goes to the target's solicited-node multicast MAC; hosts that haven't joined that group discard it in their network card.")}
<p>IPv4's other broadcasts became multicasts too: all nodes <code>ff02::1</code> (mainly for RAs), all routers <code>ff02::2</code>, and DHCPv6 servers and relays <code>ff02::1:2</code>.</p>
${K.check({q:"A PC has only now connected and wants its router and prefix without waiting. Which message does it send, and to which address?", o:["A Neighbor Solicitation to ff02::1","A Router Solicitation (ICMPv6 133) to ff02::2","A Router Advertisement to ff02::2","An ARP request to ffff.ffff.ffff"], a:1, why:"Hosts ask with an RS, type 133, to all-routers ff02::2; routers answer with an RA (134). IPv6 has no ARP and no broadcast."})}
<h3>Same logic, new situation</h3>
<p>A security engineer at a Lagos fintech proposes &ldquo;deny all ICMPv6&rdquo; on the firewall between the staff VLAN and its gateway, &ldquo;because ping is a reconnaissance tool&rdquo;. What breaks?</p>
${K.hint(`What kind of packet is an RS, RA, NS or NA?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The effect of blocking ICMPv6 between hosts and their router. <b>2. Rule:</b> every NDP message is ICMPv6; hosts get prefix and gateway from RAs and the gateway's MAC from NS/NA. <b>3. Apply it:</b> no RAs = no SLAAC address and no gateway; no NS/NA = even static hosts can't reach the router's MAC. All IPv6 stops, not only ping. Filter specific types (such as inbound echo) at the internet edge — never NDP on the link.</p>`)}

<h2>Solicited-node multicast and duplicate address detection</h2>
<p>An NS must reach an address's owner before anyone knows the owner's MAC. IPv4 asks everyone; IPv6 asks a group that is usually one device: the target's ${K.g("solicited-node multicast","Group ff02::1:ffXX:XXXX built from an address's last 24 bits; every interface joins one per address.")} group.</p>
${K.remember(`<b>The rule:</b> group = <code>ff02::1:ff</code> + <b>the last 24 bits</b> (last 6 hex digits) of the address. Its MAC = <code>33-33</code> + the group's last 32 bits = <code>33-33-ff-</code> + those same 6 hex digits.`)}
<p><b>Why it works.</b> Every interface joins the solicited-node group of <i>each</i> of its addresses and tells its network card to accept that group's MAC. The sender knows the address it's asking about, so it can compute the group with nothing else. Only devices whose addresses share those 24 bits listen — on a normal LAN, almost always only the owner. <b>Why 33-33?</b> Ethernet reserves MACs beginning <code>33-33</code> for IPv6 multicast and copies the group's last 32 bits behind it (RFC 2464); for solicited-node groups those bits always start <code>ff</code>.</p>
${K.svg("0 0 720 250",
  K.txt(20,26,"Address  2001:db8:acad:1:21a:2bff:fe3c:4d5e  — expanded:",{c:"fg",s:12,b:true})+
  K.band(20,38,470,28,"2001:0db8:acad:0001:021a:2bff:fe","var(--chip)")+K.box(494,38,120,28,"3c:4d5e","",true)+K.txt(624,57,"last 24 bits",{c:"accent",s:11})+
  K.arrow(554,68,554,104,"",true)+
  K.txt(20,98,"Group  =  ff02::1:ff  +  last 24 bits",{c:"fg",s:12,b:true})+
  K.band(20,110,470,28,"ff02:0000:0000:0000:0000:0001:ff","var(--chip)")+K.box(494,110,120,28,"3c:4d5e","",true)+K.txt(494,153,"= ff02::1:ff3c:4d5e",{c:"fg",s:11})+
  K.arrow(470,140,470,176,"",true)+
  K.txt(20,170,"MAC  =  33-33  +  last 32 bits of the group",{c:"fg",s:12,b:true})+
  K.band(20,182,120,28,"33-33","var(--chip)")+K.box(144,182,200,28,"ff-3c-4d-5e","",true)+K.txt(354,201,"= 33-33-ff-3c-4d-5e (IOS: 3333.ff3c.4d5e)",{c:"fg",s:11})+
  K.txt(360,240,"The link-local fe80::21a:2bff:fe3c:4d5e ends in the same 24 bits, so it shares the group.",{c:"muted",s:11,mid:true,f:"body"}),
  "Building a solicited-node group and its MAC: the address's last 24 bits go behind ff02::1:ff; the group's last 32 bits go behind 33-33.")}
<h3>Worked examples: four addresses, four groups</h3>
${K.steps([
  ["<code>2001:db8:acad:1::1</code>", "Expand the tail: <code>…:0000:0000:0001</code>. Last 6 hex digits <code>000001</code> → group <code>ff02::1:ff00:1</code>, MAC <code>33-33-ff-00-00-01</code>."],
  ["<code>fe80::1</code>", "Also ends <code>000001</code>: the <b>same</b> group. A router with global <code>…::1</code> and link-local <code>fe80::1</code> joins one group for both."],
  ["<code>2001:db8:acad:1:21a:2bff:fe3c:4d5e</code>", "EUI-64 (lesson 3). <code>3c4d5e</code> → <code>ff02::1:ff3c:4d5e</code>, MAC <code>33-33-ff-3c-4d-5e</code> — the last three bytes of the PC's MAC <code>00-1A-2B-<b>3C-4D-5E</b></code>, which EUI-64 keeps unchanged."],
  ["<code>2001:db8:5::a:b12</code>", "The trap. Expand first: <code>…:0000:000a:0b12</code>. Last 6 hex digits <code>0a0b12</code> → <code>ff02::1:ff0a:b12</code>, MAC <code>33-33-ff-0a-0b-12</code>. Reading &ldquo;a:b12&rdquo; as written gives a wrong group."],
])}
${K.exam(`Reading any IPv6 question: <b>expand before you compare or slice</b> — four digits per hextet, <code>::</code> replaced by its zero hextets — then take bits from the right. Then find the prefix length: it says which part is prefix and which is interface ID. Most wrong answers on solicited-node and EUI-64 questions come from slicing a compressed address.`)}
<p><b>Why it's efficient.</b> A switch without ${K.g("MLD snooping","A switch feature that forwards each IPv6 multicast group only to ports whose hosts joined it (MLD = IPv6's group-membership protocol).")} still floods the NS frame everywhere. The saving is inside the hosts: a network card checks the destination MAC in hardware and drops a multicast it hasn't joined without disturbing the processor. With ARP, every host's operating system reads every request — on a 500-host subnet, 500 interruptions instead of one.</p>
${K.q({type:"fill", q:"A server's link-local address is fe80::2e0:fcff:fe12:3456. Give its solicited-node group and the destination MAC of an NS sent to it.", fields:[{label:"Solicited-node group", a:["ff02::1:ff12:3456","FF02::1:FF12:3456","ff02:0:0:0:0:1:ff12:3456","ff02:0000:0000:0000:0000:0001:ff12:3456","ff02::0001:ff12:3456"]},{label:"Destination MAC", a:["33-33-ff-12-34-56","33:33:ff:12:34:56","3333.ff12.3456","33-33-FF-12-34-56","3333ff123456"]}], why:"The last 24 bits are 12:3456, so the group is ff02::1:ff12:3456. The MAC is 33-33 plus the group's last 32 bits (ff12:3456): 33-33-ff-12-34-56, written 3333.ff12.3456 by Cisco."})}
<h3>Duplicate address detection (DAD)</h3>
<p>Before using <b>any</b> unicast address — link-local, SLAAC-built or typed by you — a host checks nobody on the link already has it. ${K.g("DAD","Duplicate Address Detection: an NS for the address you want, sent from ::. Any answer = taken.")} reuses the NS:</p>
${K.steps([
  ["Join and ask", "The host joins the solicited-node group of the address it wants (still <i>tentative</i>) and sends an NS whose <b>target</b> is that address, from the <b>unspecified address <code>::</code></b> — it can't use the address it's testing."],
  ["Wait", "About a second (one attempt by default; IOS: <code>ND DAD is enabled, number of DAD attempts: 1</code>)."],
  ["Decide", "Silence: the address is unique and goes into use. An NA (sent to <code>ff02::1</code>, as the asker has no address): duplicate — the address is not used."],
])}
<p>A failed DAD shows as <code>(Duplicate)</code> in Windows <code>ipconfig /all</code>, and IOS logs <code>%IPV6_ND-4-DUPLICATE: Duplicate address … on GigabitEthernet0/0</code>. The lab doesn't simulate conflicts; at work, two routers given the same <code>fe80::1</code> on one VLAN is the classic cause.</p>
${K.mistake(`Thinking DAD makes a clash harmless. It protects the <i>existing</i> owner: the second router to claim <code>2001:db8:acad:1::1</code> refuses the address, so the new router comes up without its gateway address while the old one keeps answering. On a new router, look for <code>[DUP]</code> in <code>show ipv6 interface</code> before leaving site.`)}
${K.check({q:"Which source address does a host use in the Neighbor Solicitation it sends for duplicate address detection?", o:["The address it is testing","Its link-local address","The unspecified address ::","ff02::1"], a:2, why:"The tested address isn't usable yet, so DAD uses :: as the source; the target field holds the tentative address, and the NS goes to its solicited-node group."})}
<h3>Same logic, new situation</h3>
<p>A hospital VLAN has a monitor at <code>2001:db8:6e:20::a0:1</code> and a pump at <code>2001:db8:6e:20::b0:1</code>. A PC sends an NS for the monitor. Does the pump's network card pass it up?</p>
${K.hint(`Expand both and compare the last 24 bits, not the last hextet.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether the two addresses share a group. <b>2. Rule:</b> group = <code>ff02::1:ff</code> + last 24 bits. <b>3. Apply it:</b> monitor <code>…:00a0:0001</code> → <code>a00001</code> → <code>ff02::1:ffa0:1</code>; pump <code>…:00b0:0001</code> → <code>ff02::1:ffb0:1</code>. Different groups, different MACs: the pump's card drops it. Had the pump been <code>…::1a0:1</code> (<code>…:01a0:0001</code>), its last 24 bits would also be <code>a00001</code> — both would listen, harmlessly, and only the owner answers.</p>`)}

<h2>SLAAC: how a host builds its own address</h2>
<p>${K.g("SLAAC","Stateless Address Autoconfiguration (RFC 4862): the host builds its address from an RA's prefix plus its own interface ID; no server records it.")} is how IPv6 hosts get addresses by default. The rule:</p>
${K.remember(`<b>The router announces, the host builds.</b> Address = the <b>/64 prefix from the RA</b> + an <b>interface ID the host makes</b>. Default gateway = <b>the RA's source</b>, the router's link-local. Anything inside the learned prefix is on-link (find its MAC with NS); <b>everything else goes to the default router</b> heard in the RA.`)}
<p>That's Module 3's mask-and-gateway decision with nothing typed. &ldquo;Stateless&rdquo;: no server lists who has which address. It's also why LANs are /64s (lesson 1): SLAAC needs a 64-bit interface ID.</p>
<h3>Worked example: PC1 joins R1's LAN</h3>
<p>R1's G0/0 has <code>ipv6 address 2001:db8:acad:1::1/64</code> and <code>ipv6 address fe80::1 link-local</code>, and R1 has <code>ipv6 unicast-routing</code>. PC1 (MAC <code>00-1A-2B-3C-4D-5E</code>) is plugged in.</p>
${K.svg("0 0 720 440",
  K.dev("pc",110,40,"PC1","MAC 00-1A-2B-3C-4D-5E")+K.dev("router",610,40,"R1","G0/0 · fe80::1")+
  K.link(110,98,110,430,"",true)+K.link(610,98,610,430,"",true)+
  K.txt(122,120,"1 · link up: link-local fe80::21a:2bff:fe3c:4d5e (fe80::/64 + interface ID)",{c:"fg",s:11})+
  K.arrow(110,160,330,160,"2 · DAD: NS from :: to ff02::1:ff3c:4d5e")+K.txt(340,164,"no answer = unique",{s:10.5})+
  K.arrow(110,208,606,208,"3 · RS (133) to ff02::2 — any routers here?",true)+
  K.arrow(610,256,114,256,"4 · RA (134) from fe80::1 to ff02::1: 2001:db8:acad:1::/64 · A=1 · M=0 O=0 · lifetime 1800 s",true)+
  K.txt(122,292,"5 · address = prefix + interface ID → 2001:db8:acad:1:21a:2bff:fe3c:4d5e — DAD it too",{c:"fg",s:11})+
  K.txt(122,316,"6 · default gateway = fe80::1 (the RA's source) · on-link prefix 2001:db8:acad:1::/64",{c:"fg",s:11})+
  K.arrow(110,364,606,364,"7 · first packet off-link: NS to ff02::1:ff00:1 — who has fe80::1?")+
  K.arrow(610,410,114,410,"8 · NA (136), unicast: fe80::1 is at R1's MAC — then the packet goes")+
  K.txt(360,436,"Steps 1–6 happen once, when the link comes up. Steps 7–8 happen per neighbour, when first needed.",{c:"muted",s:10.5,mid:true,f:"body"}),
  "SLAAC and first contact: link-local and DAD, RS, RA, build the global address, record the gateway; then Neighbor Discovery for the gateway's MAC.")}
${K.steps([
  ["1–2 · Link-local and DAD", "As soon as the link is up: <code>fe80::</code> + EUI-64 interface ID (split the MAC, insert <code>fffe</code>, flip the 7th bit: <code>00</code> → <code>02</code>) = <code>fe80::21a:2bff:fe3c:4d5e</code>. DAD it. PC1 can now talk on the link, with no router involved."],
  ["3 · Router Solicitation", "Rather than wait up to 200 seconds for R1's periodic RA, PC1 sends an RS to <code>ff02::2</code> from its new link-local."],
  ["4 · Router Advertisement", "R1 answers from <code>fe80::1</code>: prefix <code>2001:db8:acad:1::/64</code>, A=1, router lifetime 1800 s (use me as default router for 30 minutes — refreshed by each RA), M=0 and O=0 (no DHCPv6)."],
  ["5 · Global address", "<code>2001:db8:acad:1:</code> + <code>21a:2bff:fe3c:4d5e</code>, then DAD. (Windows would pick a random interface ID — section 5.)"],
  ["6 · Gateway and on-link prefix", "Gateway <code>fe80::1</code>. <code>2001:db8:acad:1::50</code> is on-link (NS for it directly); <code>2001:db8:beef::9</code> is off-link (send to <code>fe80::1</code>)."],
  ["7–8 · First contact", "The first off-link packet needs R1's MAC: NS to <code>ff02::1:ff00:1</code>, NA back, cached — ARP's job, by multicast."],
])}
${K.dyk(`A /64 holds about 18 quintillion (1.8 × 10<sup>19</sup>) interface IDs. That's why hosts can pick theirs at random — Windows does — and almost never clash; DAD covers the rare collision and human mistakes like two routers set to <code>fe80::1</code>.`)}
<p><b>What the router needs.</b> A Cisco router sends RAs that hosts can build an address from only when <b>both</b> are true:</p>
<ul>
<li><code>ipv6 unicast-routing</code> is configured. Without it IOS acts as an IPv6 <i>host</i>: it has addresses and answers pings on the link, but doesn't route IPv6, send RAs or join <code>ff02::2</code>.</li>
<li>The interface has a global (or unique local) <b>/64</b>, such as <code>ipv6 address 2001:db8:acad:1::1/64</code>. With only <code>ipv6 enable</code> it has a link-local and no prefix to advertise: real IOS still sends RAs there, but they carry no prefix, so hosts may list the router as their gateway yet build no global address. (The bench sends no RA in that case.)</li>
</ul>
${K.out(`R1#show ipv6 interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  MTU is 1500 bytes
  ICMP error messages limited to one every 100 milliseconds
  ICMP redirects are enabled
  ICMP unreachables are sent
  ND DAD is enabled, number of DAD attempts: 1
  ND reachable time is 30000 milliseconds (using 30000)
  ND advertised reachable time is 0 (unspecified)
  ND advertised retransmit interval is 0 (unspecified)
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.`, "R1 with ipv6 unicast-routing: it has joined FF02::2 and advertises every 200 seconds.")}
<ul>
<li><code>Joined group address(es)</code> — <code>FF02::1</code> (every IPv6 interface), <code>FF02::2</code> (only when routing), and one solicited-node group per distinct last-24-bits: <code>FF02::1:FF00:1</code> covers <code>FE80::1</code> and <code>…::1</code>.</li>
<li><code>ND reachable time is 30000 milliseconds</code> — a neighbour confirmed in the last 30 seconds is <code>REACH</code>; older entries go <code>STALE</code>.</li>
<li><code>…sent every 200 seconds</code> / <code>…live for 1800 seconds</code> — IOS's RA interval and the router lifetime it advertises.</li>
<li><code>Hosts use stateless autoconfig for addresses.</code> — M=0: hosts use SLAAC.</li>
</ul>
<p>Without <code>ipv6 unicast-routing</code> the same interface lists only <code>FF02::1</code> and its solicited-node group, and the RA lines become <code>ND NS retransmit interval is 1000 milliseconds</code>: the router is a host on that link. You'll hunt for exactly that in the floor-5 ticket.</p>
${K.mistake(`Configuring every interface and forgetting the one global command. Without <code>ipv6 unicast-routing</code>, <code>show ipv6 interface brief</code> looks perfect and the router answers pings from the LAN — but no host gets a global address or a gateway. Look for <code>FF02::2</code> in the joined groups.`)}
${K.q({type:"order", q:"Put PC1's SLAAC steps in order, from cable plugged in to its first packet leaving for the internet.", items:["Build a link-local address: fe80:: + interface ID","DAD: NS for the link-local, from ::, to its solicited-node group","Send a Router Solicitation to ff02::2","Receive a Router Advertisement with the /64 prefix, from the router's link-local","Build the global address (prefix + interface ID) and DAD it","Record the RA's source link-local as the default gateway","NS for the gateway's link-local, NA back, then send the packet"], why:"The link-local comes first because the RS needs a source address, and DAD precedes any use of an address. The RA supplies the prefix and, from its source, the gateway. ND for the gateway's MAC happens when the first off-link packet needs it."})}
<h3>Hands-on: watch a PC get its address</h3>
<p>An MSP is fitting out a client's new office in Ikoyi. IKY-R1 already serves the LAN (<code>2001:db8:40:10::/64</code>, link-local <code>fe80::1</code>) and PC2 is at its desk. PC1 has no cable yet. Plug it in, read what it built, then compare Neighbor Discovery and ARP in the frame log.</p>
<p>About the bench: it applies the RA's result the moment PC1's link comes up, without drawing the RS and RA frames. To watch them, open PC1's <b>IPv6 settings</b> and choose <b>Obtain an IPv6 address automatically</b>: the log shows the Router Solicitation to <code>ff02::2</code> and the Router Advertisement to <code>ff02::1</code> with its prefix. Its switch notes call each <code>3333.…</code> frame &ldquo;an IPv6 multicast frame&rdquo;, which a switch without MLD snooping floods like a broadcast. And, like lesson 3's labs, its PCs use EUI-64 interface IDs so you can check them against the MAC.</p>
${K.bench({id:"m6-slaac-watch", points:90, ipv6:true, openLog:true, from:"CCNA · Module 6 · lesson 4", title:"plug in a PC and watch it build its IPv6 address, then find its gateway with ND", viewBox:"0 0 760 420",
  intro:"Your console cable is on <code>IKY-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control; no enable secret). Use each PC's <b>Command Prompt</b> and the frame log (&ldquo;What just happened on the wire&rdquo;).",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r1", kind:"router", label:"IKY-R1", model:"ISR 1100 · office LAN on G0/0", x:330, y:30, config:e=>{ ["en","conf t","hostname IKY-R1","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description IKOYI OFFICE LAN","ip address 10.40.10.1 255.255.255.0","ipv6 address 2001:db8:40:10::1/64","ipv6 address fe80::1 link-local","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"IKY-SW", model:"office switch", x:330, y:170, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"pc1", kind:"pc", label:"PC1 (new desk)", x:150, y:300, ip:"10.40.10.21", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"pc2", kind:"pc", label:"PC2", x:520, y:300, ip:"10.40.10.22", mask:"255.255.255.0", gw:"10.40.10.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"pc2:eth", b:"sw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"On PC1's Command Prompt run <code>ipconfig</code> — Media disconnected. Then cable PC1's NIC to IKY-SW port 2 with a Cat6 from the tray", done:B=>Bench.tried(B,"pc1",/^\s*ipconfig/i) && Bench.upAt(B,"pc1:eth")},
    {text:"<code>ipconfig /all</code> on PC1: find the Physical Address, the <b>IPv6 Address</b>, the <b>Link-local IPv6 Address</b> and the <b>Default Gateway</b> (<code>fe80::1%4</code> above 10.40.10.1). Is the interface ID the EUI-64 of the MAC?", done:B=>Bench.upAt(B,"pc1:eth") && Bench.tried(B,"pc1",/^\s*ipconfig\s+\/all/i)},
    {text:"Console into IKY-R1, <code>enable</code>, <code>show ipv6 interface g0/0</code>: find <code>FF02::2</code> in the joined groups and <code>ND router advertisements are sent every 200 seconds</code> — why PC1 got an address", done:B=>B.devs.r1.env.log.some(l=>/ND router advertisements are sent every 200 seconds/.test(l.out||""))},
    {text:"From PC1, <code>ping fe80::1</code>. In the frame log: the <b>Neighbor Solicitation</b> to <code>ff02::1:ff00:1</code> (MAC 3333.ff00.0001) and the unicast <b>Neighbor Advertisement</b> back", done:B=>Bench.pinged(B,"pc1","fe80::1")},
    {text:"Same router over IPv4: <code>ping 10.40.10.1</code> from PC1. The log now shows an <b>ARP request broadcast to ffff.ffff.ffff</b> instead of a multicast NS", done:B=>Bench.pinged(B,"pc1","10.40.10.1")},
    {text:"<code>ping 2001:db8:40:10::1</code>, the router's global address. In the log, IKY-R1 sends its <i>own</i> NS before replying — for which address, to which group? (The bench always does this; see the note after the lab.)", done:B=>Bench.pinged(B,"pc1","2001:db8:40:10::1")},
    {text:"On IKY-R1, <code>show ipv6 neighbors</code> (the router's IPv6 neighbour cache — IPv6's ARP table): PC1 appears twice, link-local and global, with one MAC", done:B=>B.devs.r1.env.log.some(l=>/2001:DB8:40:10:[0-9A-F:]+\s+\d+\s+\S+\s+REACH Gi0\/0/.test(l.out||"") && /FE80::[0-9A-F:]+\s+\d+\s+\S+\s+REACH Gi0\/0/.test(l.out||""))},
    {text:"Read PC2's IPv6 address from PC2's <code>ipconfig</code>, work out its solicited-node group on paper, then ping it from PC1 and check the NS in the log went to your group", done:B=>Bench.pinged(B,"pc1",IP6.str(IP6.withIid(IP6.parse("2001:db8:40:10::"), IP6.eui64(B.devs.pc2.mac))))},
  ],
  win:"SLAAC's result appeared the moment the link came up — prefix from the RA, interface ID from the MAC, gateway = the router's link-local. Then one multicast NS found a MAC where IPv4 needed a broadcast, and the router learned PC1's addresses into its neighbour cache.",
  solve:[["pc","pc1","ipconfig"],["plug","cat6","pc1:eth","sw:g2"],["pc","pc1","ipconfig /all"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 interface g0/0"],
    ["pc","pc1","ping fe80::1"],["pc","pc1","ping 10.40.10.1"],["pc","pc1","ping 2001:db8:40:10::1"],["term","show ipv6 neighbors"],["pc","pc2","ipconfig"],["pc","pc1","ping 2001:db8:40:10:250:9bff:fe50:5662"]]})}
${K.hint(`PC2's IPv6 address is <code>2001:db8:40:10:</code> + the EUI-64 of its MAC, so its group is <code>ff02::1:ff</code> + the last three bytes of PC2's MAC.`)}
<p>What you saw: PC1's address came from two ingredients — R1's prefix and PC1's own MAC. The NS for <code>fe80::1</code> went to one group; the ARP for <code>10.40.10.1</code> went to everyone. Pinging R1's global address made R1 resolve PC1's <i>global</i> address with its own NS: each side resolves the address it's sending to. On real kit that NS is usually unnecessary: PC1's NS came from its global address and carried its MAC, so R1 records PC1 from it (as <code>STALE</code>: known but not yet confirmed — next section), replies at once, and confirms the entry a few seconds later with a unicast NS. The bench always shows the multicast NS.</p>
<h3>Reading show ipv6 neighbors</h3>
${K.out(`R1#show ipv6 neighbors
IPv6 Address                              Age Link-layer Addr State Interface
FE80::21A:2BFF:FE3C:4D5E                    0 001a.2b3c.4d5e  REACH Gi0/0
2001:DB8:ACAD:1:21A:2BFF:FE3C:4D5E          4 001a.2b3c.4d5e  STALE Gi0/0
2001:DB8:ACAD:1:8D2C:41E7:9B3A:6F02         1 0c4d.e9a1.7730  STALE Gi0/0
FE80::2                                     0 0050.0c12.0002  REACH Gi0/1`, "A real router's cache: an EUI-64 PC twice, a Windows PC with a random interface ID, and the next router on Gi0/1.")}
<ul>
<li><b>IPv6 Address / Link-layer Addr</b> — like <code>show ip arp</code>: one row per address the router has talked to, so one MAC on two rows is normal. <b>Age</b> — minutes since last confirmed.</li>
<li><b>State</b> — <code>REACH</code> (confirmed within 30 seconds), <code>STALE</code> (older; still used and re-checked when next needed — normal), <code>DELAY</code>/<code>PROBE</code> (being re-checked), ${K.g("INCMP","Incomplete: an NS went out and no NA came back — the neighbour isn't answering.")} (the neighbour is missing). The bench shows every entry as REACH.</li>
</ul>
${K.check({q:"An RA arrives with prefix 2001:db8:77:4::/64 from fe80::a, router lifetime 1800. The host's interface ID is 21a:2bff:fe3c:4d5e. What are its global address and default gateway?", o:["2001:db8:77:4:21a:2bff:fe3c:4d5e, gateway 2001:db8:77:4::1","2001:db8:77:4:21a:2bff:fe3c:4d5e, gateway fe80::a","fe80::21a:2bff:fe3c:4d5e, gateway fe80::a","2001:db8:77:4::a, gateway fe80::1"], a:1, why:"Address = advertised /64 + the host's own interface ID. Gateway = the RA's source, fe80::a — never a guessed ::1."})}
<h3>Same logic, new situation</h3>
<p>Two routers share a LAN: R1 advertises <code>2001:db8:c1:1::/64</code> with lifetime 1800; R2 advertises <code>2001:db8:c2:1::/64</code> with router lifetime 0. What does a laptop end up with?</p>
${K.hint(`Read each RA separately. What does A=1 allow, and what does lifetime 0 mean?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The result of two RAs on one link. <b>2. Rule:</b> each prefix with A=1 gives one SLAAC address; a router becomes a default gateway only if its lifetime is above 0. <b>3. Apply it:</b> two global addresses, one per prefix, but one default gateway — R1's link-local. R2 says &ldquo;my prefix is here, use it, but don't send me your internet traffic&rdquo; — how engineers advertise an internal-only router.</p>`)}

<h2>SLAAC, stateless or stateful DHCPv6: the M and O flags</h2>
<p>SLAAC gives an address and a gateway, but not reliably DNS servers (an RA option, RFC 8106, carries them, but not every device reads it), a domain name or a record of who had which address. For those there's ${K.g("DHCPv6","DHCP for IPv6 (RFC 8415): clients send to ff02::1:2, UDP 547; servers reply to UDP 546. No gateway option.")}. Two RA flags tell hosts whether to use it: <b>M</b> (${K.g("Managed","RA flag M=1: lease your address from DHCPv6 (stateful).")}) — &ldquo;get your <b>address</b> from DHCPv6&rdquo;; <b>O</b> (${K.g("Other","RA flag O=1: SLAAC for the address, other settings such as DNS from DHCPv6 (stateless).")}) — &ldquo;get <b>other settings</b> from DHCPv6&rdquo;.</p>
<div class="tablewrap"><table>
<tr><th>Method</th><th>Flags</th><th>Address from</th><th>DNS from</th><th>Gateway from</th><th>Per-client record?</th></tr>
<tr><td><b>SLAAC only</b></td><td>M=0 O=0</td><td>Host (prefix + ID)</td><td>RA option, or by hand</td><td><b>RA</b></td><td>No</td></tr>
<tr><td><b>Stateless DHCPv6</b></td><td>M=0 O=1</td><td>Host (prefix + ID)</td><td>DHCPv6 server</td><td><b>RA</b></td><td>No — same settings for all</td></tr>
<tr><td><b>Stateful DHCPv6</b></td><td>M=1</td><td>DHCPv6 lease</td><td>DHCPv6 server</td><td><b>RA</b></td><td>Yes, like DHCPv4</td></tr>
</table></div>
${K.remember(`<b>M = My address is Managed. O = Only the Other stuff.</b> Whatever the flags, <b>the gateway comes from the RA</b>: DHCPv6 has no gateway option, so no working RA means no IPv6 default route, however good the DHCPv6 server.`)}
<p>One more flag matters at work: the per-prefix <b>A flag</b>. With M=1 and A=1, DHCPv6-capable hosts get a leased address <i>and</i> a SLAAC one; set A=0 and only leases are allowed. Also, DHCPv6 clients identify themselves with a ${K.g("DUID","DHCP Unique Identifier: a DHCPv6 client's ID ('DHCPv6 Client DUID' in ipconfig /all) — not its MAC.")} rather than their MAC, so DHCPv4 reservations don't carry over as they are. On IOS the flags are interface commands — shown so you recognise them; the lab doesn't model DHCPv6, and DHCPv6 server setup is beyond the CCNA:</p>
${K.out(`interface GigabitEthernet0/1
 ipv6 nd other-config-flag        ! O=1: stateless DHCPv6
!
interface GigabitEthernet0/2
 ipv6 nd managed-config-flag      ! M=1: stateful DHCPv6
 ipv6 nd prefix 2001:DB8:ACAD:30::/64 no-autoconfig   ! A=0: no SLAAC address`, "Real IOS commands (not in the lab). With M=1, show ipv6 interface says 'Hosts use DHCP to obtain routable addresses.'; with only O=1 it keeps 'Hosts use stateless autoconfig for addresses.' and adds 'Hosts use DHCP to obtain other configuration.'")}
${K.when([
  ["SLAAC only","Small sites, labs, guest Wi-Fi","Nothing to run but the router; every OS supports it","You need DNS pushed centrally to every device, or address logs"],
  ["SLAAC + stateless DHCPv6 (O=1)","Most enterprise LANs","Every device gets an address (phones too); DNS controlled centrally","Auditors require per-address leases"],
  ["Stateful DHCPv6 (M=1)","Regulated networks (banks) that must log address-to-device bindings","A lease table, like DHCPv4","The VLAN has Android devices and A=0: Android doesn't lease addresses from DHCPv6"],
], "Choosing how hosts get their IPv6 settings")}
${K.check({q:"A VLAN uses stateful DHCPv6 and the server works perfectly, but RAs have been switched off on the router interface. What do the PCs lack?", o:["Nothing — DHCPv6 provides everything","Only DNS servers","A default gateway, because only RAs provide one","Only a link-local address"], a:2, why:"DHCPv6 has no default-gateway option; hosts learn their default router only from RAs (which also carry the M flag that starts DHCPv6 in the first place)."})}
<h3>Same logic, new situation</h3>
<p>A university in Ibadan wants every student device to use the campus DNS servers over IPv6, has no need to log addresses, and most students also use Android phones. Which flags should the Wi-Fi gateway advertise?</p>
${K.hint(`Two needs: an address on every device type, and centrally provided DNS.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> M, O and A for one VLAN. <b>2. Rule:</b> SLAAC gives addresses to everything; O=1 adds DNS from a stateless server; M=1 is for leases. <b>3. Apply it:</b> <b>M=0, O=1, A=1</b>. Adding the DNS servers to the RA as well (RFC 8106) matters here: it covers devices that never ask DHCPv6 — Android phones among them, as Android takes its IPv6 DNS servers from the RA. No logging need, so no reason for M=1.</p>`)}

<h2>What hosts really show: ipconfig, random IDs and the %zone</h2>
<p>A real Windows 11 laptop on a SLAAC network — compare the bench's MAC-based IDs:</p>
${K.out(`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:1:8d2c:41e7:9b3a:6f02
   Temporary IPv6 Address. . . . . . : 2001:db8:acad:1:f1a4:2c9:77b1:e3d0
   Link-local IPv6 Address . . . . . : fe80::8d2c:41e7:9b3a:6f02%12
   IPv4 Address. . . . . . . . . . . : 10.10.1.25
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : fe80::1%12
                                       10.10.1.1`, "Windows with SLAAC: random interface ID, a temporary address, and the router's link-local as gateway on interface 12.")}
<ul>
<li><b>IPv6 Address</b> — the SLAAC address. No <code>ff:fe</code> in the middle of <code>8d2c:41e7:9b3a:6f02</code>: not EUI-64. <b>Windows (since Vista) uses a random interface ID by default</b>, so the address doesn't reveal or track the MAC; macOS, iOS, Android and many Linux distributions also avoid EUI-64 by default (random or &ldquo;stable privacy&rdquo; IDs, RFC 7217). Only the prefix tells you which LAN it's on.</li>
<li><b>Temporary IPv6 Address</b> — a ${K.g("temporary address","An extra random SLAAC address used for outgoing connections and replaced regularly, for privacy (RFC 8981).")} used as the source for outgoing connections and replaced regularly (Windows defaults: a new one each day; older ones linger, unused for new connections, for up to 7 days), so websites can't follow the device by its address.</li>
<li><b>Link-local IPv6 Address</b> — <code>fe80::</code> + an interface ID (often the same random one).</li>
<li><b><code>%12</code></b> — the ${K.g("zone index","The %number after a link-local address: which interface it belongs to (on Windows, the interface index).")}. Every interface (Ethernet, Wi-Fi, VPN) has a <code>fe80::/64</code>, so &ldquo;fe80::1&rdquo; alone is ambiguous; <code>%12</code> means &ldquo;on interface 12&rdquo;. It varies by PC (<code>netsh interface ipv6 show interfaces</code> lists them). On a multi-adapter laptop, ping a link-local with it: <code>ping fe80::1%12</code>. Bench PCs show <code>%4</code> and accept pings with or without it.</li>
<li><b>Default Gateway</b> — the IPv6 gateway (from the RA) first, the IPv4 one below. A <code>fe80::</code> gateway is correct.</li>
</ul>
${K.tip(`For a lab PC where you want predictable EUI-64 addresses, an administrator can run <code>netsh interface ipv6 set global randomizeidentifiers=disabled</code> and <code>netsh interface ipv6 set privacy state=disabled</code>, then reconnect the adapter. Leave users' machines alone: the defaults exist for privacy.`)}
<p><b>The fe80-only pattern.</b> A <b>Link-local IPv6 Address</b>, <b>no IPv6 Address</b>, and only the IPv4 gateway under Default Gateway: the PC's IPv6 is working (it built a link-local) but it heard no RA at all. Go to that segment's router: <code>ipv6 unicast-routing</code>? RAs suppressed? If an <code>fe80::</code> gateway <i>does</i> appear but still no IPv6 Address, an RA arrived without a usable prefix: is there a /64 on the interface? Either way, a ping to a global address from that PC fails at once with <code>PING: transmit failed. General failure.</code> — it has no global address to send from (and without a gateway, no route to try).</p>
${K.mistake(`Calling a PC &ldquo;misconfigured&rdquo; because its address doesn't match the EUI-64 of its MAC. Random IDs are Windows' default. Check the <b>prefix</b> and the <b>gateway</b>; the interface ID is the host's business.`)}
<h3>Try it: read show ipv6 interface as evidence</h3>
<p>You're pre-staging <code>LKK-R2</code> for a Lekki branch. G0/0 already has <code>2001:db8:c0:7::1/64</code>, but the router isn't routing IPv6 yet. See what that looks like, turn routing on, and predict each new solicited-node group before you press Enter.</p>
${K.term({env:"ios2", title:"LKK-R2 — joined groups, RA lines and the neighbour cache", opts:{kind:"router", host:"LKK-R2", model:"ISR 1100", motd:"LKK-R2 — bench pre-staging for the Lekki branch (lab router, no enable secret). G0/0 = branch LAN, nothing cabled yet."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","description LEKKI LAN","ipv6 address 2001:db8:c0:7::1/64","no shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code>. Each task names the line to look for.",
  tasks:[
    {text:"<code>show ipv6 interface g0/0</code> — only <code>FF02::1</code> and the solicited-node group(s) joined, and <code>ND NS retransmit interval is 1000 milliseconds</code> instead of RA lines: a host on its LAN", done:e=>e.log.some(l=>/ND NS retransmit interval is 1000 milliseconds/.test(l.out||"") && /Joined group/.test(l.out||""))},
    {text:"In <code>configure terminal</code>, <code>ipv6 unicast-routing</code>, then <code>do show ipv6 interface g0/0</code>: <code>FF02::2</code> appears, with <code>ND router advertisements are sent every 200 seconds</code>", done:e=>e.log.some(l=>/FF02::2\n/.test(l.out||"") && /ND router advertisements are sent every 200 seconds/.test(l.out||""))},
    {text:"Under <code>interface g0/0</code> add a second address, <code>ipv6 address 2001:db8:c0:7::a:2b3c/64</code>. Predict its solicited-node group, then check with <code>do show ipv6 interface g0/0</code>", done:e=>e.log.some(l=>/FF02::1:FF0A:2B3C/.test(l.out||""))},
    {text:"Set a memorable link-local, <code>ipv6 address fe80::7 link-local</code>, and look again. Which group is new, and why does <code>FF02::1:FF00:1</code> stay?", done:e=>e.log.some(l=>/link-local address is FE80::7/.test(l.out||"") && /FF02::1:FF00:7/.test(l.out||"") && /FF02::1:FF00:1\n/.test(l.out||""))},
    {text:"<code>end</code>, then <code>show ipv6 neighbors</code>: only the heading. Nothing is cabled, so no NS or NA has happened — the cache fills only when ND runs", done:e=>e.log.some(l=>/^\s*sh\S*\s+ipv6\s+nei/i.test(l.cmd||"") && /IPv6 Address\s+Age Link-layer Addr State Interface/.test(l.out||""))},
    {text:"<code>show ipv6 interface brief</code>: the link-local first, then both global addresses", done:e=>e.log.some(l=>/FE80::7\n\s+2001:DB8:C0:7::1\n\s+2001:DB8:C0:7::A:2B3C/.test(l.out||""))},
  ],
  win:"You saw an interface's two faces — host mode (no FF02::2, an NS-retransmit line) and router mode (FF02::2, RAs every 200 seconds) — and predicted solicited-node groups from each address's last 24 bits, including FF02::1:FF00:1, shared by every address ending 00:0001.",
  solve:["enable","show ipv6 interface g0/0","configure terminal","ipv6 unicast-routing","do show ipv6 interface g0/0","interface g0/0","ipv6 address 2001:db8:c0:7::a:2b3c/64","do show ipv6 interface g0/0","ipv6 address fe80::7 link-local","do show ipv6 interface g0/0","end","show ipv6 neighbors","show ipv6 interface brief"]})}
${K.hint(`Task 1: this bench router's MAC ends <code>00-00-01</code>, so its automatic link-local (<code>…:FE00:1</code>) and <code>…::1</code> share <code>FF02::1:FF00:1</code> — on most real routers you'd see two groups there. Task 3: <code>…::a:2b3c</code> is <code>…:000a:2b3c</code>, so the last six hex digits are <code>0a2b3c</code>. Task 4: the global <code>…::1</code> still ends in <code>000001</code>.`)}
<h3>Hands-on: the floor-5 ticket</h3>
<p>The ticket: <i>&ldquo;Abuja HQ floor 5: since Saturday's router replacement, laptops in the open plan and the meeting rooms show only fe80 for IPv6. Other floors fine. Nobody can reach the floor-5 file server (static 2001:db8:a5:50::20) over IPv6.&rdquo;</i> The build sheet: ABJ-FL5 G0/0 = open plan, <code>2001:db8:a5:50::/64</code>, link-local <code>fe80::1</code>; G0/1 = meeting rooms, <code>2001:db8:a5:51::/64</code>. Diagnose from evidence before changing anything.</p>
${K.bench({id:"m6-fe80-only", points:110, ipv6:true, openLog:true, from:"CCNA · Module 6 · lesson 4", title:"floor 5 has only fe80:: addresses — diagnose, fix, verify", viewBox:"0 0 800 440",
  intro:"Console cable on <code>ABJ-FL5</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secret. IPv4 works everywhere. Laptops obtain IPv6 automatically; FL5-FILES has static IPv6 with gateway <code>fe80::1</code>.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r", kind:"router", label:"ABJ-FL5", model:"ISR 4331 · floor 5", x:330, y:40, config:e=>{ ["en","conf t","hostname ABJ-FL5","no ip domain-lookup","interface g0/0","description FL5 OPEN PLAN","ip address 10.5.50.1 255.255.255.0","ipv6 address 2001:db8:a5:50::1/64","ipv6 address fe80::1 link-local","no shutdown","interface g0/1","description FL5 MEETING ROOMS","ip address 10.5.51.1 255.255.255.0","ipv6 enable","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"swa", kind:"switch", label:"SW-OPEN", model:"open plan", x:130, y:180, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"swb", kind:"switch", label:"SW-MEET", model:"meeting rooms", x:500, y:180, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"l501", kind:"laptop", label:"LAP-501", x:60, y:320, ip:"10.5.50.31", mask:"255.255.255.0", gw:"10.5.50.1"},
    {id:"fs", kind:"server", label:"FL5-FILES", x:220, y:320, ip:"10.5.50.20", mask:"255.255.255.0", gw:"10.5.50.1", ip6:{auto:false, addr:"2001:db8:a5:50::20", len:64, gw:"fe80::1"}},
    {id:"l511", kind:"laptop", label:"LAP-511", x:560, y:320, ip:"10.5.51.44", mask:"255.255.255.0", gw:"10.5.51.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r:con"}, {type:"cat6", a:"r:g0", b:"swa:g1"}, {type:"cat6", a:"r:g1", b:"swb:g1"}, {type:"cat6", a:"l501:eth", b:"swa:g2"}, {type:"cat6", a:"fs:eth", b:"swa:g3"}, {type:"cat6", a:"l511:eth", b:"swb:g2"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce it in the meeting rooms: on LAP-511, <code>ipconfig</code> and <code>ping 2001:db8:a5:50::20</code>. What does &ldquo;General failure&rdquo; say the laptop is missing?", done:B=>Bench.tried(B,"l511",/^\s*ipconfig/i) && Bench.tried(B,"l511",/ping\s+2001:db8:a5:50::20/i)},
    {text:"Open plan: <code>ipconfig</code> on LAP-501, then <code>ping fe80::1</code>. The router answers on its link-local, so the link and ND work. What is it <i>not</i> doing?", done:B=>Bench.tried(B,"l501",/^\s*ipconfig/i) && Bench.pinged(B,"l501","fe80::1")},
    {text:"On ABJ-FL5, <code>enable</code>, <code>show ipv6 interface brief</code>, <code>show ipv6 interface g0/0</code>. The address is right — find the two clues (joined groups, ND lines) that this router isn't acting as an IPv6 router", done:B=>B.devs.r.env.log.some(l=>/GigabitEthernet0\/0 is up/.test(l.out||"") && /ND NS retransmit interval/.test(l.out||""))},
    {text:"Fix the first fault in <code>configure terminal</code> with the global command that makes IOS route IPv6 and send RAs. Done when LAP-501 pings the file server, <code>2001:db8:a5:50::20</code>", done:B=>B.devs.r.env.v6info().routing && Bench.pinged(B,"l501","2001:db8:a5:50::20")},
    {text:"LAP-511 still has no IPv6 Address (<code>ipconfig</code>), though an <code>fe80::</code> gateway has now appeared. Read <code>show ipv6 interface g0/1</code>: the RA lines are there now — so what has it got nothing of to advertise?", done:B=>B.devs.r.env.v6info().routing && B.devs.r.env.log.some(l=>/GigabitEthernet0\/1 is up/.test(l.out||"") && /ND router advertisements are sent/.test(l.out||"") && !/Global unicast/.test(l.out||""))},
    {text:"Fix the second fault: give G0/1 the meeting-room prefix from the build sheet, router address <code>::1</code>, /64", done:B=>(B.devs.r.env.intfs["GigabitEthernet0/1"].ip6||[]).some(a=>IP6.eq(a.addr,"2001:db8:a5:51::1") && a.len===64)},
    {text:"Verify from the user's side: <code>ipconfig</code> on LAP-511 — an IPv6 Address in <code>2001:db8:a5:51::/64</code> and, as gateway, G0/1's <i>automatic</i> link-local (compare <code>show ipv6 interface brief</code>). Then <code>ping 2001:db8:a5:50::20</code> from LAP-511", done:B=>Bench.pinged(B,"l511","2001:db8:a5:50::20")},
    {text:"<code>show ipv6 neighbors</code> on ABJ-FL5: LAP-511 on Gi0/1 and the file server on Gi0/0. Then save (<code>write memory</code>)", done:B=>B.devs.r.env.log.some(l=>/2001:DB8:A5:51:[0-9A-F:]+\s+\d+\s+\S+\s+REACH Gi0\/1/.test(l.out||"") && /2001:DB8:A5:50::20\s/.test(l.out||"")) && B.devs.r.env.savedOnce},
  ],
  win:"Two faults, one symptom. Without ipv6 unicast-routing the router sent no RAs at all; G0/1 had only ipv6 enable — a link-local, no prefix. You proved each from show ipv6 interface (no FF02::2 and an NS-retransmit line; then RA lines with no global address), fixed them, and verified from the laptops.",
  solve:[["pc","l511","ipconfig"],["pc","l511","ping 2001:db8:a5:50::20"],["pc","l501","ipconfig"],["pc","l501","ping fe80::1"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 interface brief"],["term","show ipv6 interface g0/0"],
    ["term","configure terminal"],["term","ipv6 unicast-routing"],["term","end"],["pc","l501","ping 2001:db8:a5:50::20"],
    ["pc","l511","ipconfig"],["term","show ipv6 interface g0/1"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ipv6 address 2001:db8:a5:51::1/64"],["term","end"],
    ["pc","l511","ipconfig"],["term","show ipv6 interface brief"],["pc","l511","ping 2001:db8:a5:50::20"],["term","show ipv6 neighbors"],["term","write memory"]]})}
${K.hint(`Task 3: compare with R1's output earlier — which group is missing, and which line replaces the RA lines? Task 5: an interface with only <code>ipv6 enable</code> has a link-local and nothing else.`)}
<p>What happened: one symptom, two causes, found in the order they mattered. The missing global command silenced RAs on <i>every</i> interface; once fixed, G0/1 advertised but had no /64 to offer. (That's why LAP-511 already listed G0/1's link-local as its IPv6 gateway at that point — an RA with no prefix still offers a default router — but still had no IPv6 Address.) LAP-511's gateway is G0/1's EUI-64 link-local because nobody set a manual one — it works, but <code>fe80::1</code> on every LAN interface makes tickets easier to read.</p>
${K.check({q:"A laptop's ipconfig shows 'Link-local IPv6 Address . . : fe80::4c1:9a2e:77d0:1b3%7', no IPv6 Address, and only 10.8.3.1 under Default Gateway. Which conclusion is best supported?", o:["IPv6 is disabled on the laptop","No usable Router Advertisement reached it: check that segment's router for ipv6 unicast-routing and a /64","The laptop needs a static IPv6 address","The DHCPv6 server is down, so it has no gateway"], a:1, why:"The link-local proves IPv6 is running. No SLAAC address and no IPv6 gateway mean no usable RA. DHCPv6 never provides a gateway, so the router is where to look."})}
<h3>Same logic, new situation</h3>
<p>Kano branch PCs have addresses in <code>2001:db8:4b:10::/64</code> and gateway <code>fe80::1%5</code>, yet can't reach even the router's <code>2001:db8:4b:10::1</code> over IPv6. <code>show ipv6 neighbors</code> on the router lists them as <code>REACH</code>. Someone says &ldquo;the router isn't sending RAs&rdquo;. Agree?</p>
${K.hint(`What would ipconfig look like if no RA had arrived?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether missing RAs fit the evidence. <b>2. Rule:</b> a SLAAC address and an <code>fe80::</code> gateway come <i>only</i> from an RA; a REACH entry proves NS/NA works. <b>3. Apply it:</b> disagree. RAs and ND are fine, so look elsewhere: an access list or host firewall dropping ICMPv6 echo, or a second device sending RAs (two <code>fe80::</code> gateways in ipconfig).</p>`)}

${K.job("“Staff phones lost IPv6 after the Wi-Fi change”",`
<p><b>The ticket.</b> &ldquo;Lagos office staff Wi-Fi (VLAN 20): since Saturday, the banking app's IPv6 health check fails on Android phones. Windows laptops on the same Wi-Fi are fine.&rdquo; Saturday's change: &ldquo;Security request — move VLAN 20 to stateful DHCPv6 so every IPv6 address is logged.&rdquo;</p>
<p><b>Questions first.</b> All Android phones? Yes. iPhones? Fine. Wired laptops? Fine. One device family, one VLAN, right after an addressing change: suspect the change.</p>
<p><b>Checks.</b> An Android phone's Wi-Fi details: only an <code>fe80::</code> address. A Windows laptop's <code>ipconfig /all</code>: an IPv6 address with <code>Lease Obtained</code> lines and a <code>DHCPv6 Client DUID</code> — leased and working. On the gateway:</p>
${K.out(`LAG-WGW1#show ipv6 interface vlan 20 | include Hosts
  Hosts use DHCP to obtain routable addresses.
LAG-WGW1#show running-config interface vlan 20
interface Vlan20
 ipv6 address 2001:DB8:4F:20::1/64
 ipv6 nd managed-config-flag
 ipv6 nd prefix 2001:DB8:4F:20::/64 no-autoconfig
 ipv6 dhcp server STAFF-WIFI`, "M=1 and A=0 on the prefix: only DHCPv6 clients can get an address.")}
<p><b>The logic.</b> M=1 says &ldquo;lease an address&rdquo;; <code>no-autoconfig</code> clears A, forbidding SLAAC. Windows and iOS lease from DHCPv6. Android doesn't lease addresses from DHCPv6 (it relies on SLAAC; recent versions can also use DHCPv6 prefix delegation where a network offers it), so with SLAAC forbidden it keeps only its link-local — the RAs still arrive, but there's no global address to use.</p>
<p><b>The fix.</b> Agreed with security first: keep M=1 so laptops are still leased and logged, and allow SLAAC again for phones. In <code>interface vlan 20</code>: <code>no ipv6 nd prefix 2001:DB8:4F:20::/64</code>, so the prefix is advertised with its default flags (A=1). Phones reconnect with <code>2001:db8:4f:20:…</code> addresses and pass the health check; laptops now hold a leased and a SLAAC address, as expected with M=1 and A=1. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;Saturday's change allowed only an addressing method Android doesn't support. I've re-enabled the one phones use alongside it; laptops are still logged, and we'll agree how to record phones.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;VLAN 20: Android link-local only after change 5120 (M=1 + prefix no-autoconfig); Android doesn't lease addresses from DHCPv6. Removed no-autoconfig (A=1), kept M=1. Verified Android SLAAC + app health check, Windows still leased. Saved. Follow-up with security on logging SLAAC devices. 35 min.&rdquo;</i></p>`)}
${K.case("The office that got a second router nobody installed",`
<p>An accounting firm in Port Harcourt ran dual stack happily for months. Then, on Tuesdays only, some websites &ldquo;hung, then loaded&rdquo;. IPv4 was clean. An affected PC's <code>ipconfig</code> showed <b>two</b> IPv6 addresses in different prefixes and <b>two</b> <code>fe80::</code> default gateways — which can only come from two RAs.</p>
<p>The engineer found the unknown link-local's MAC in the PC's neighbour cache (<code>netsh interface ipv6 show neighbors</code>) and traced it with <code>show mac address-table</code> to a meeting-room port: a visiting auditor's travel router, plugged in by its LAN side every Tuesday to share 4G. Its RAs had a non-zero router lifetime, so every PC added it as a second default router and sometimes sent traffic over a 4G link that couldn't reach the firm's servers.</p>
<p><b>Afterwards.</b> The port was shut and the visitor given guest Wi-Fi. The lasting fix was RA Guard on the switches — dropping RAs on every port where no router should be. The team's lesson: <b>in IPv6, any device that sends an RA can make itself a gateway.</b></p>`)}
${K.myth([
  ["IPv6 Neighbor Discovery is ARP with a new name — still a broadcast.","IPv6 has no broadcast. An NS goes to the target's solicited-node group; other hosts' network cards drop it in hardware."],
  ["Blocking ICMPv6 makes a network safer.","NDP is ICMPv6. Block it on a LAN and hosts get no RAs, no gateway and no neighbours' MACs."],
  ["DHCPv6 gives the PC its default gateway, like DHCPv4.","DHCPv6 has no gateway option. The gateway always comes from a Router Advertisement."],
  ["A gateway of fe80::1 means IPv6 is misconfigured.","Hosts use the router's link-local by design: the RA comes from it, and it doesn't change when global addresses do."],
  ["With SLAAC, the router assigns each host its address.","The router advertises the prefix; each host builds its own address and checks it with DAD."],
])}
${K.dodont([
  "Start an IPv6 ticket with the host's ipconfig: link-local but no IPv6 Address = check the router's RAs.",
  "Look for <code>FF02::2</code> in <code>show ipv6 interface</code> — the quickest proof the router routes IPv6.",
  "Give every LAN interface a manual link-local such as <code>fe80::1</code>.",
  "Plan M/O flags around every device type on the VLAN, phones included.",
],[
  "Don't type static IPv6 addresses into user laptops to cover for missing RAs.",
  "Don't block ICMPv6 between hosts and their gateway.",
  "Don't expect a Windows address to match its MAC's EUI-64.",
  "Don't treat <code>STALE</code> as a fault; <code>INCMP</code> is the one meaning &ldquo;no answer&rdquo;.",
])}
${K.dyk(`Every RS, RA, NS, NA and Redirect must arrive with hop limit 255. A router forwarding a packet lowers it, so a forged RA sent from another network arrives with 254 or less and is ignored. The weak point is the local link itself — hence RA Guard.`)}

<h2>Interview corner</h2>
${K.hint(`The router supplies the prefix; the host derives the rest; one source never changes.`)}
${K.reveal("“How does an IPv6 host get its address and default gateway with SLAAC?”",`<p>"It builds a link-local — fe80:: plus an interface ID — and checks it with DAD, an NS from :: to its solicited-node group. It sends a Router Solicitation to ff02::2; the router answers with a Router Advertisement from its link-local, carrying the /64 prefix with the A flag, the router lifetime and the M and O flags. The host adds its own interface ID — EUI-64, or random on Windows — runs DAD again, and uses the RA's source link-local as its gateway. With O set it gets DNS from stateless DHCPv6; with M set it leases its address, but the gateway still comes from the RA. On Cisco, RAs need ipv6 unicast-routing, and they carry a prefix only if the interface has a /64."</p>`)}
${K.hint(`Who has to read the frame in each case, and how is the group formed?`)}
${K.reveal("“Why doesn't IPv6 need ARP, and what is a solicited-node multicast address?”",`<p>"IPv6 has no broadcast. Neighbor Discovery uses ICMPv6 instead: a Neighbor Solicitation asks who has an address and the owner answers with a Neighbor Advertisement carrying its MAC. The NS goes to the target's solicited-node group — ff02::1:ff plus the address's last 24 bits — on MAC 33-33-ff plus those bits. Every interface joins the group for each of its addresses, so normally only the owner's card accepts the frame and other hosts drop it in hardware, while an ARP broadcast interrupts every host. DAD uses the same NS, sourced from ::."</p>`)}
${K.hint(`Work outward from what the host shows to what the router must be doing.`)}
${K.reveal("“A user's PC shows only an fe80:: address. How do you troubleshoot it?”",`<p>"The link-local proves IPv6 is running, so it heard no usable RA. One PC or the whole segment? If the segment, I go to its router: does show ipv6 interface list FF02::2 and the 'ND router advertisements are sent' lines? If not, ipv6 unicast-routing is missing. If so, is there a global /64 on the interface, or only ipv6 enable? Then RA suppression, or RA Guard blocking the real router. I verify from the PC: an address in the right prefix, the router's link-local as gateway, and a ping to another subnet."</p>`)}
${K.recap([
  "IPv6 has no broadcast and no ARP: NDP, carried in ICMPv6 with hop limit 255, finds routers, prefixes and neighbours' MACs.",
  "RS 133 → ff02::2; RA 134 from the router's link-local (prefix, A flag, router lifetime, M/O flags); NS 135 to the solicited-node group; NA 136 with the MAC; Redirect 137 for a better first hop.",
  "Solicited-node group = ff02::1:ff + last 24 bits (expand first); MAC = 33-33-ff + the same bits. Other NICs drop it — far cheaper than an ARP broadcast.",
  "DAD: NS for the address from ::; silence = unique, an NA = duplicate.",
  "SLAAC: link-local, DAD, RS, RA; address = /64 prefix + host-made interface ID; gateway = the RA's source link-local. Cisco sends RAs only with ipv6 unicast-routing, and they offer a prefix only if the interface has a /64 (FF02::2 joined, RA every 200 s, lifetime 1800 s).",
  "M=0 O=0 SLAAC; O=1 adds stateless DHCPv6 for DNS; M=1 stateful leases. The gateway always comes from the RA.",
  "Windows: random interface IDs and temporary addresses by default; gateway fe80::…%zone. Link-local only = no usable RA on that segment.",
  "<code>show ipv6 neighbors</code> = IPv6's ARP table: <code>REACH</code>, <code>STALE</code> (normal), <code>INCMP</code> (no answer).",
])}
${K.next(`<b>Lesson 5 — IPv6 static routes.</b> Hosts now find their router. Next the routers must reach each other's /64s: network, host, default and floating statics, why a link-local next hop needs an exit interface, and proving it with <code>show ipv6 route</code> and traceroute.`)}
`,
quiz:[
  {lvl:1, q:"Which NDP message does an IPv6 host send to ask routers on its link to advertise immediately, and to which address?", o:["Neighbor Solicitation to ff02::1","Router Solicitation (ICMPv6 type 133) to ff02::2","Router Advertisement (ICMPv6 type 134) to ff02::2","DHCPv6 Solicit to ff02::1:2"], a:1, why:"A Router Solicitation, type 133, goes to the all-routers group ff02::2. Routers answer with a Router Advertisement (134), usually to ff02::1. A DHCPv6 Solicit is a different protocol, used only when the RA's flags call for DHCPv6."},
  {lvl:1, type:"match", q:"Match each NDP message with its ICMPv6 type number.", pairs:[["Router Solicitation","133"],["Router Advertisement","134"],["Neighbor Solicitation","135"],["Neighbor Advertisement","136"],["Redirect","137"]], why:"They run in the order a new host meets them: ask for routers (133), routers answer (134), ask for a neighbour (135), the neighbour answers (136), and a router corrects a host's first hop (137)."},
  {lvl:1, type:"fill", q:"What is the solicited-node multicast group for the address 2001:db8:acad:1::1b?", fields:[{label:"Solicited-node group", a:["ff02::1:ff00:1b","FF02::1:FF00:1B","ff02::1:ff00:001b","ff02:0:0:0:0:1:ff00:1b","ff02:0:0:0:0:1:ff00:001b","ff02::0001:ff00:001b","ff02:0000:0000:0000:0000:0001:ff00:001b"]}], why:"Expand the end of the address: ...:0000:0000:0000:001b. The last 24 bits are the last six hex digits, 00001b. Behind ff02::1:ff that gives ff02::1:ff00:1b."},
  {lvl:2, type:"fill", q:"A printer has the address 2001:db8:5:3::9:4f2a. Give the solicited-node group a PC sends its Neighbor Solicitation to, and the destination MAC address of that frame.", fields:[{label:"Solicited-node group", a:["ff02::1:ff09:4f2a","FF02::1:FF09:4F2A","ff02:0:0:0:0:1:ff09:4f2a","ff02:0000:0000:0000:0000:0001:ff09:4f2a","ff02::0001:ff09:4f2a"]},{label:"Destination MAC", a:["33-33-ff-09-4f-2a","33:33:ff:09:4f:2a","3333.ff09.4f2a","33-33-FF-09-4F-2A","3333ff094f2a"]}], why:"Expand first: 2001:0db8:0005:0003:0000:0000:0009:4f2a. The last 24 bits are 09:4f2a, so the group is ff02::1:ff09:4f2a, and the MAC is 33-33 plus the group's last 32 bits (ff09:4f2a): 33-33-ff-09-4f-2a. Reading '9:4f2a' without expanding gives a wrong answer."},
  {lvl:2, q:"Based on the exhibit from a user's laptop, what is the most likely cause of the problem?", ex:"C:\\>ipconfig\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   Link-local IPv6 Address . . . . . : fe80::5d1e:8a40:c2f9:1e07%9\n   IPv4 Address. . . . . . . . . . . : 10.30.4.57\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.30.4.1\n\nC:\\>ping 2001:db8:30:1::25\n\nPinging 2001:db8:30:1::25 with 32 bytes of data:\nPING: transmit failed. General failure.", o:["IPv6 is disabled on the laptop's adapter","The laptop's link-local address is a duplicate","The laptop has heard no usable Router Advertisement: the router for this segment isn't advertising a prefix (for example, no ipv6 unicast-routing or no /64 on its interface)","The DHCPv6 server is out of addresses, so the laptop has no default gateway"], a:2, why:"A link-local address shows IPv6 is running. No IPv6 Address and no fe80:: gateway mean no usable RA arrived, so the laptop has no route for an off-link destination and fails at once ('General failure'). A DHCPv6 server never supplies a gateway, and a disabled stack would show no link-local at all."},
  {lvl:2, type:"multi", q:"Which three pieces of information can a Router Advertisement carry? (Choose three.)", o:["The on-link prefix and its length, with the A (autonomous) flag","The router lifetime, which says whether and how long to use the router as default gateway","The M and O flags that tell hosts whether to use DHCPv6","The interface ID each host must use","The lease time of each host's DHCPv6 address"], a:[0,1,2], why:"An RA carries prefixes (with length and flags such as A), the router lifetime, the M and O flags, the MTU and the router's MAC. Hosts make their own interface IDs, and DHCPv6 leases come from a DHCPv6 server, not the RA."},
  {lvl:2, type:"order", q:"Put the SLAAC process in order for a host that has been newly connected.", items:["Create a link-local address from fe80::/64 and an interface ID","Perform DAD on the link-local address","Send a Router Solicitation to ff02::2","Receive a Router Advertisement containing a /64 prefix","Combine the prefix with an interface ID, then perform DAD on the new address","Use the RA's source link-local address as the default gateway"], why:"The link-local comes first because the host needs a source address for its RS; DAD checks every address before use; the RA supplies the prefix, and its source address becomes the default gateway."},
  {lvl:1, q:"In the Neighbor Solicitation a host sends for duplicate address detection, what is the source IPv6 address?", o:["The tentative address being tested","The unspecified address ::","The host's link-local address","The all-nodes address ff02::1"], a:1, why:"The address under test can't be used yet, so DAD's NS comes from ::. Its target field holds the tentative address and it goes to that address's solicited-node group. Any NA reply means the address is already in use."},
  {lvl:2, q:"A network uses stateful DHCPv6 (M flag set). Where do the hosts learn their default gateway?", o:["From a DHCPv6 default-gateway option","From the DHCPv6 server's own address","From the Router Advertisement: the router's link-local source address","They must be configured with a static gateway"], a:2, why:"DHCPv6 has no default-gateway option. With SLAAC, stateless or stateful DHCPv6, the default router comes from RAs, and hosts record the router's link-local address as the gateway."},
  {lvl:2, type:"match", q:"Match each Router Advertisement setting with what hosts do.", pairs:[["M=0, O=0","Build an address with SLAAC; no DHCPv6"],["M=0, O=1","Build an address with SLAAC; get DNS and other settings from a stateless DHCPv6 server"],["M=1","Lease an address (and settings) from a stateful DHCPv6 server"],["Router lifetime 0","Do not use this router as a default gateway"]], why:"M means the address is Managed by DHCPv6; O means only Other settings come from DHCPv6. The router lifetime decides whether the sender becomes a default router; 0 means it does not."},
  {lvl:3, q:"Floor 3 laptops have only fe80:: addresses since a router replacement. Based on the exhibit from the new router, what should you change?", ex:"FL3-R1#show ipv6 interface g0/0\nGigabitEthernet0/0 is up, line protocol is up\n  IPv6 is enabled, link-local address is FE80::1\n  No Virtual link-local address(es):\n  Global unicast address(es):\n    2001:DB8:F3:30::1, subnet is 2001:DB8:F3:30::/64\n  Joined group address(es):\n    FF02::1\n    FF02::1:FF00:1\n  MTU is 1500 bytes\n  ICMP error messages limited to one every 100 milliseconds\n  ICMP redirects are enabled\n  ICMP unreachables are sent\n  ND DAD is enabled, number of DAD attempts: 1\n  ND reachable time is 30000 milliseconds (using 30000)\n  ND NS retransmit interval is 1000 milliseconds", o:["Add ipv6 enable to G0/0","Change the prefix length to /48 so the laptops have more room","Configure ipv6 unicast-routing in global configuration","Configure static IPv6 addresses on the laptops"], a:2, why:"The interface has a correct /64 and is up, but FF02::2 is missing from the joined groups and the ND section shows 'ND NS retransmit interval' instead of the RA lines: the router is acting as an IPv6 host. ipv6 unicast-routing makes it route IPv6 and send RAs. ipv6 enable adds nothing here, SLAAC needs a /64, and static laptops would still have no gateway."},
  {lvl:3, q:"A Windows 11 laptop with MAC 3C-52-82-11-6A-0F shows 'IPv6 Address: 2001:db8:acad:1:9b2:e4c1:57aa:310d' and 'Temporary IPv6 Address: 2001:db8:acad:1:6e0f:a3:1c9d:b244'. A colleague says SLAAC is broken because the address should be 2001:db8:acad:1:3e52:82ff:fe11:6a0f. What is correct?", o:["SLAAC is broken: the router should have sent the EUI-64 interface ID","The laptop has a static address that overrides SLAAC","SLAAC is working: the prefix is right, and Windows generates random interface IDs and temporary addresses by default instead of EUI-64","The laptop is using stateful DHCPv6, because random interface IDs only come from a server"], a:2, why:"The router supplies only the prefix (2001:db8:acad:1::/64), which is correct. Windows uses a random interface ID for its SLAAC address and adds temporary addresses for privacy by default. The colleague's EUI-64 is right for that MAC but isn't what Windows uses unless random identifiers are turned off."},
  {lvl:3, type:"multi", q:"A host has these addresses: link-local fe80::21a:2bff:fe3c:4d5e, global 2001:db8:acad:1:21a:2bff:fe3c:4d5e and temporary 2001:db8:acad:1:7c2:91f0:ab12:cd34. Which two solicited-node groups does it join? (Choose two.)", o:["ff02::1:ff3c:4d5e","ff02::1:ff12:cd34","ff02::1:ffab:12cd","ff02::1:ff21:a2b","ff02::2"], a:[0,1], why:"One group per distinct last-24-bits value. The link-local and the global share 3c:4d5e, so one group, ff02::1:ff3c:4d5e, covers both. The temporary address ends ...:ab12:cd34, whose last 24 bits are 12:cd34, giving ff02::1:ff12:cd34. ff02::2 is all routers, joined only by routers."},
  {lvl:3, q:"After a VLAN is changed to 'ipv6 nd managed-config-flag' with its prefix set to no-autoconfig, Windows laptops still get IPv6 addresses but Android phones have only link-local addresses. What explains it?", o:["Android phones need the O flag set before they read RAs","Android does not implement stateful DHCPv6 address assignment, and with the A flag cleared it may not build a SLAAC address either","RAs are no longer being sent, so phones have no gateway","Android phones only accept EUI-64 addresses"], a:1, why:"M=1 sends DHCPv6-capable clients to lease an address; no-autoconfig clears the A flag, so no device may use SLAAC. Windows leases from DHCPv6; Android doesn't lease addresses from DHCPv6 and is left with its link-local. Allowing SLAAC again (A=1) fixes it while DHCPv6 keeps serving the laptops."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command on a Cisco router shows the IPv6 neighbour cache — the IPv6 equivalent of show ip arp?", fields:[{label:"Command", a:["show ipv6 neighbors"], ios:true}], why:"show ipv6 neighbors lists each IPv6 address the router has resolved with NS/NA, its MAC, the age, the state (REACH, STALE, DELAY, PROBE, INCMP) and the interface."},
],
cards:[
  {f:"Why IPv6 has no ARP", b:"IPv6 has no broadcast. Neighbor Discovery (NDP), carried in ICMPv6, does ARP's job: a Neighbor Solicitation to a multicast group, a Neighbor Advertisement back."},
  {f:"The five NDP messages", b:"RS 133 (host to ff02::2), RA 134 (router to ff02::1, or in reply), NS 135 (who has X?), NA 136 (X is at this MAC), Redirect 137 (better first hop on your link)."},
  {f:"What a Router Advertisement carries", b:"Prefix(es) with length and A flag, router lifetime (0 = not a default router), M and O flags, MTU, the router's MAC. Its source is the router's link-local, which hosts use as gateway."},
  {f:"Solicited-node group and MAC", b:"Group = ff02::1:ff + last 24 bits of the address; MAC = 33-33-ff + the same 24 bits. Expand first. Example: 2001:db8:5::a:b12 → ff02::1:ff0a:b12, 33-33-ff-0a-0b-12."},
  {f:"Why solicited-node multicast beats ARP", b:"An ARP broadcast is read by every host's CPU. An NS's multicast MAC is accepted only by NICs in the group (normally only the owner); others drop it in hardware. Without MLD snooping the switch still floods it."},
  {f:"DAD", b:"Before using any unicast address: NS for it from :: to its solicited-node group. No reply = unique; an NA (to ff02::1) = duplicate, address not used."},
  {f:"SLAAC in one line", b:"The router announces the /64 in an RA; the host builds prefix + its own interface ID, runs DAD, and uses the RA's source link-local as default gateway."},
  {f:"When a Cisco router sends RAs", b:"RAs need ipv6 unicast-routing; a prefix hosts can use needs a /64 global (or unique local) address on the interface too. Evidence: FF02::2 joined, 'ND router advertisements are sent every 200 seconds', lifetime 1800 s."},
  {f:"M and O flags", b:"M=0 O=0: SLAAC only. M=0 O=1: SLAAC + stateless DHCPv6 for DNS. M=1: stateful DHCPv6 leases addresses. In every case the gateway comes from the RA."},
  {f:"DHCPv6 and the default gateway", b:"DHCPv6 has no gateway option. Without working RAs, hosts have no IPv6 default router, even with a perfect DHCPv6 server."},
  {f:"Windows SLAAC addresses", b:"Random interface IDs by default (not EUI-64), plus Temporary IPv6 Addresses for outgoing connections, replaced regularly. The lab uses EUI-64 so you can check against the MAC."},
  {f:"The %zone in fe80::1%12", b:"The zone index: which interface a link-local belongs to (on Windows, the interface index). Every interface has fe80::/64. Use it when pinging a link-local: ping fe80::1%12."},
  {f:"Link-local only in ipconfig", b:"IPv6 is running but no usable RA was heard: check the segment's router for ipv6 unicast-routing, a /64 on the interface, and RA suppression or RA Guard."},
  {f:"show ipv6 neighbors states", b:"REACH = confirmed in the last 30 s; STALE = older, still used, re-checked when needed (normal); DELAY/PROBE = being re-checked; INCMP = NS sent, no NA (neighbour missing)."},
],
});

// ---------- Module 6 · Lesson 5 ----------
L.push({
id:"ipv6-routes", mins:90, level:"Intermediate · builds on Module 5 and lessons 1–4",
t:"IPv6 static routes: network, host, default and floating — and link-local next hops",
html:`
${K.goals([
  "Apply Module 5's rules — longest match, then administrative distance — to IPv6 prefixes, expanding addresses before comparing them.",
  "Write <code>ipv6 route</code> in every form, and explain why IOS refuses a link-local next hop without an interface.",
  "Build network (/64), host (/128), default (::/0) and floating IPv6 statics, and predict when each is installed.",
  "Read <code>show ipv6 route</code> and prove a path both ways with ping and traceroute on IOS and Windows.",
  "Diagnose a missing IPv6 return route and a link-local next hop on the wrong interface.",
])}
${K.pre(["Module 5 lessons 1–2: longest match, administrative distance (AD), static and floating routes, recursive lookups, the return path.","Lessons 2–4 of this module: global unicast and link-local addresses; <code>ipv6 unicast-routing</code> and manual link-locals; Router Advertisements, Neighbor Discovery and IPv6 in <code>ipconfig</code>."])}

<h2>Why this matters at work</h2>
<p>An IT services company in Abuja looks after a retailer with a head office in the city and a branch in Kano. Last week the ISP switched IPv6 on for the retailer's internet link. On Monday the Kano manager calls: &ldquo;Our laptops now show an IPv6 address, but the stock portal at head office won't load over IPv6. Over IPv4 it's fine.&rdquo;</p>
<p>IPv6 doesn't ride on IPv4's routes: the routers keep a <b>separate</b> IPv6 table, and nobody has given the branch a single IPv6 route. The fix is two lines, one per router — but you need to know which two, why one names an interface, and how to prove the result from a user's laptop. The logic is Module 5's; this lesson shows what carries over and the few things that change.</p>

<h2>Same rules, new table: how an IPv6 router picks a route</h2>
${K.remember(`<b>The rule.</b> An IPv6 router decides exactly like an IPv4 router. For every packet, of all the routes whose prefix contains the destination, the <b>longest prefix wins</b>. When two sources offer <b>the identical prefix</b>, the lower <b>administrative distance</b> wins (connected 0, static 1). Only the notation and a few habits change.`)}
<p><b>Why the same?</b> A more specific route is a more deliberate claim, and a more trusted source should beat a less trusted one; 128 bits instead of 32 changes neither idea.</p>
<p>What <i>is</i> different: a ${K.g("dual-stack","Running IPv4 and IPv6 side by side on the same devices and links. Each protocol has its own addresses, routes and table; neither helps the other.")} router keeps <b>two separate tables</b>. <code>show ip route</code> lists only IPv4, <code>show ipv6 route</code> only IPv6, and an IPv4 default route does nothing for an IPv6 packet — the whole of the Kano ticket.</p>
<div class="tablewrap"><table>
<tr><th>Thing</th><th>IPv4 (Module 5)</th><th>IPv6 (this lesson)</th></tr>
<tr><td>Forwarding</td><td>On by default</td><td>Needs <code>ipv6 unicast-routing</code> (lesson 3)</td></tr>
<tr><td>Static route</td><td><code>ip route 10.1.50.0 255.255.255.0 …</code></td><td><code>ipv6 route 2001:db8:a1:20::/64 …</code> — a length, never a mask</td></tr>
<tr><td>Default · host route</td><td><code>0.0.0.0/0</code> (<code>S*</code>, &ldquo;Gateway of last resort&rdquo;) · /32</td><td><code>::/0</code> (plain <code>S</code>, no gateway line) · /128</td></tr>
<tr><td>Table layout</td><td>One line per route, classful headings</td><td>Two lines per route, no headings</td></tr>
<tr><td>Next hop</td><td>The neighbour's IPv4 address</td><td>Its global <i>or</i> link-local address (link-local with the interface)</td></tr>
<tr><td>Next hop's MAC</td><td>ARP</td><td>Neighbor Discovery (lesson 4)</td></tr>
<tr><td>Interface-only route on Ethernet</td><td>Often rescued by proxy ARP</td><td>Usually just fails</td></tr>
</table></div>
${K.svg("0 0 720 250",
  K.txt(20,40,"S",{c:"fg",s:14,b:true})+K.txt(52,40,"2001:DB8:A1:20::/64",{c:"fg",s:14})+K.txt(250,40,"[1/0]",{c:"fg",s:14})+
  K.txt(52,68,"via",{c:"fg",s:14})+K.txt(90,68,"FE80::2,",{c:"fg",s:14})+K.txt(190,68,"GigabitEthernet0/1",{c:"fg",s:14})+
  K.box(10,130,120,56,"Source","S = static",true)+K.box(140,130,130,56,"Prefix / length","what it reaches")+K.box(280,130,120,56,"[AD/metric]","trust · cost",true)+
  K.box(410,130,140,56,"Next hop","here a link-local")+K.box(560,130,150,56,"Exit interface","which link to use",true)+
  K.arrow(70,128,26,46)+K.arrow(205,128,140,46)+K.arrow(340,128,272,46)+K.arrow(480,128,130,74)+K.arrow(635,128,300,74)+
  K.txt(360,222,"IPv6 prints each route on two lines: the prefix and its [AD/metric], then an indented via line for each path.",{c:"muted",s:11,mid:true,f:"body"}),
  "One IPv6 routing-table entry, as real IOS prints a static with a link-local next hop: the same five facts as an IPv4 route, on two lines.")}
<h3>Longest match with 128-bit addresses</h3>
<p>The new skill is <i>reading</i> the addresses. Each ${K.g("hextet","One of the eight 16-bit groups of an IPv6 address, written as up to four hex digits (lesson 1).")} is 16 bits: a /48 compares three hextets, a /64 four. Each hex digit is 4 bits, so a /56 compares 14 hex digits. <b>Expand both addresses</b> (lesson 1) and line them up. A head-office router, HQ-R1, has four routes:</p>
${K.out(`S   ::/0                       via the ISP
S   2001:DB8:A1::/48           via the HQ core switch   (the whole company)
S   2001:DB8:A1:20::/64        via BR-R1                (the branch LAN)
S   2001:DB8:A1:20::99/128     via the HQ firewall      (one server at the branch)`, "A simplified table: four nested routes, from everything (/0) down to one address (/128).")}
${K.steps([
  ["2001:db8:a1:20::99", "Expanded <code>2001:0db8:00a1:0020:0000:0000:0000:0099</code>: inside the /0, /48, /64 and /128. Longest: <b>/128 → the firewall</b>."],
  ["2001:db8:a1:20::5", "First four hextets match the /64; the last is 0005, not 0099. <b>/64 → BR-R1</b>."],
  ["2001:db8:a1:7::1", "Fourth hextet <code>0007</code>, not <code>0020</code>; the first three match the /48. <b>/48 → the core switch</b>."],
  ["2001:db8:b2::1", "Third hextet <code>00b2</code>, not <code>00a1</code>: only the /0. <b>Default → the ISP</b>."],
  ["The method", "Expand, compare up to the prefix length, keep every match, pick the longest. AD only matters for the <i>same</i> prefix."],
])}
${K.exam(`<b>Reading an IPv6 question.</b> 1. Find each route's prefix length. 2. Expand the destination and prefixes to eight four-digit hextets — <code>2001:db8:a1:20::</code> and <code>2001:db8:a1:200::</code> look alike until you write <code>0020</code> and <code>0200</code>. 3. Compare only the first <i>length</i> bits (16 per hextet, 4 per hex digit). Watch for a <code>::</code> hiding a different number of zero hextets, and a /56 or /60 ending mid-hextet.`)}
${K.check({q:"An IPv6 router has S 2001:db8:44::/48 [1/0] via HQ and also learns 2001:db8:44::/48 from a routing protocol with AD 110. Which goes into show ipv6 route?", o:["The routing protocol's route — dynamic routes beat statics in IPv6","The static, because AD 1 beats AD 110 for the identical prefix","Both, as equal-cost paths","Neither — IPv6 doesn't allow duplicate prefixes"], a:1, why:"Same prefix, different sources: AD decides, as in IPv4. The static (1) wins; the other waits."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Same logic, new situation: HQ-R1's four routes are ::/0 (ISP), 2001:db8:a1::/48 (core), 2001:db8:a1:20::/64 (BR-R1) and 2001:db8:a1:20::99/128 (firewall). Match each destination, written the way a colleague pasted it, with the route it uses.", pairs:[["2001:0db8:00a1:0020:0000:0000:0000:0099","2001:db8:a1:20::99/128 (firewall)"],["2001:db8:a1:20::1:99","2001:db8:a1:20::/64 (BR-R1)"],["2001:db8:a1:200::5","2001:db8:a1::/48 (core)"],["2001:db8:a2::1","::/0 (ISP)"]], why:"1. Asked: which route each packet uses. 2. Rule: expand, keep the routes that contain it, longest wins. 3. Apply: the first is ::99 written in full — all 128 bits match the /128. 2001:db8:a1:20::1:99 expands to …:0020:0000:0000:0001:0099, so it isn't ::99 — it matches the /64. 2001:db8:a1:200::5 has fourth hextet 0200, not 0020: outside the /64 but inside the /48. 2001:db8:a2::1 has third hextet 00a2, so only the default contains it."})}

<h2>Writing ipv6 route: four ways to say &ldquo;that way&rdquo;</h2>
<p>One global configuration command: the prefix says <i>which</i> destinations, the rest says <i>where</i>.</p>
${K.out(`ipv6 route <prefix>/<length> <global-next-hop>
ipv6 route <prefix>/<length> <exit-interface>
ipv6 route <prefix>/<length> <exit-interface> <link-local-next-hop>
ipv6 route <prefix>/<length> <exit-interface> <global-next-hop>
                                   ... optionally followed by [distance]`, "Next hop, exit interface only, link-local next hop (interface required), fully specified. The interface always comes before the next hop; a number at the end is the AD.")}
<p>The worked example joins a head office to a branch over a /64 ${K.g("transit link","A link whose only job is to join two routers. It carries traffic between other networks rather than having users of its own.")}, with manual link-locals (lesson 3): <code>fe80::1</code> on HQ-R1's G0/1, <code>fe80::2</code> on BR-R1's.</p>
${K.svg("0 0 760 300",
  K.dev("pc",60,70,"HQ LAN","2001:db8:a1:10::/64")+K.link(84,70,192,70,"G0/0 ::1")+
  K.dev("router",220,70,"HQ-R1","")+K.link(246,70,514,70,"")+K.txt(380,88,"2001:db8:a1:ff::/64",{c:"muted",s:10,mid:true})+K.txt(262,56,"G0/1 ::1 · fe80::1",{c:"accent"})+K.txt(498,56,"G0/1 ::2 · fe80::2",{c:"accent",end:true})+
  K.dev("router",540,70,"BR-R1","")+K.link(566,70,676,70,"G0/0 ::1")+K.dev("pc",700,70,"BRANCH LAN","2001:db8:a1:20::/64")+
  K.band(20,138,720,24,"On HQ-R1, four ways to say &quot;2001:db8:a1:20::/64 is that way&quot;")+
  K.txt(30,186,"ipv6 route 2001:db8:a1:20::/64 2001:db8:a1:ff::2",{c:"fg",s:11.5})+K.txt(420,186,"global next hop — recursive lookup finds G0/1",{s:10.5})+
  K.txt(30,214,"ipv6 route 2001:db8:a1:20::/64 g0/1",{c:"fg",s:11.5})+K.txt(420,214,"exit interface only — weak on Ethernet",{c:"warn",s:10.5})+
  K.txt(30,242,"ipv6 route 2001:db8:a1:20::/64 g0/1 fe80::2",{c:"fg",s:11.5})+K.txt(420,242,"link-local next hop — interface required",{c:"ok",s:10.5})+
  K.txt(30,270,"ipv6 route 2001:db8:a1:20::/64 g0/1 2001:db8:a1:ff::2",{c:"fg",s:11.5})+K.txt(420,270,"fully specified — out G0/1, to ff::2",{c:"ok",s:10.5}),
  "All four send branch traffic out of G0/1; they differ in what HQ-R1 must work out and what keeps the route alive. You'd configure only one.")}
<h3>Form 1 — a global next hop, and the recursive lookup</h3>
<p>The most common form names the neighbour's global address on the shared link. As in Module 5, it says <i>who</i>, not <i>which port</i>, so the router looks again — a recursive lookup:</p>
${K.steps([
  ["Lookup 1: the destination", "<code>2001:db8:a1:20::15</code> matches <code>S 2001:DB8:A1:20::/64 via 2001:DB8:A1:FF::2</code> — an address, not an interface."],
  ["Lookup 2: the next hop", "<code>2001:db8:a1:ff::2</code> matches <code>C 2001:DB8:A1:FF::/64</code> on GigabitEthernet0/1: an exit interface."],
  ["Neighbor Discovery", `HQ-R1 sends a ${K.g("Neighbor Solicitation","NS: the IPv6 'who has this address?' message (ICMPv6 type 135), sent to the target's solicited-node multicast group. It replaces the ARP request (lesson 4).")} for <code>2001:db8:a1:ff::2</code> to its solicited-node group <code>ff02::1:ff00:2</code>; BR-R1 answers with a ${K.g("Neighbor Advertisement","NA: the reply to a Neighbor Solicitation (ICMPv6 type 136), giving the MAC address for the asked-for IPv6 address (lesson 4).")} carrying its MAC, which is cached. The packet leaves G0/1 in a frame to that MAC.`],
])}
<p>Because of lookup 2, a next-hop static stays installed only while its next hop <b>resolves</b>. If G0/1 goes down, the connected /64 vanishes and IOS withdraws the static by itself — what floating routes rely on later. One IPv6 detail: by default IOS will <i>not</i> resolve a recursive IPv6 static's next hop through a default static (<code>::/0</code>) — it needs a more specific route, such as the connected /64 (the global command <code>ipv6 route static resolve default</code> allows it, and is rarely wanted).</p>
<h3>Form 2 — exit interface only, and why it is weak on Ethernet</h3>
<p>With only <code>g0/1</code>, the router treats the destination prefix as <b>on that link</b>: for <code>2001:db8:a1:20::15</code> it Neighbor-Solicits <code>2001:db8:a1:20::15</code> itself out of G0/1. Nobody there owns it, and Cisco routers don't answer solicitations for other devices' addresses by default — there is no proxy-ARP-style rescue. HQ-R1 drops the packet and reports &ldquo;address unreachable&rdquo;. On a ${K.g("point-to-point","A link with exactly one device at each end, such as a serial line or a tunnel, where there is no neighbour to look up.")} link (serial, tunnel) there's nobody to look up, so it's fine there; on Ethernet, give a next hop.</p>
${K.mistake(`<code>ipv6 route ::/0 g0/2</code> towards an ISP over Ethernet. It shows as <code>via GigabitEthernet0/2, directly connected</code> and <i>looks</i> fine, but the router Neighbor-Solicits every internet address, nobody answers, and users get &ldquo;Destination host unreachable&rdquo;. Give the ISP router's address — global, or link-local with the interface.`)}
<h3>Form 3 — a link-local next hop, and why IOS insists on the interface</h3>
<p>Every IPv6 interface has a ${K.g("link-local address","An fe80::/10 address every IPv6 interface has. It is valid only on its own link and is never forwarded by routers (lesson 2).")}, and it makes an excellent next hop — but on its own, IOS refuses it:</p>
${K.out(`HQ-R1(config)#ipv6 route 2001:db8:a1:20::/64 fe80::2
% Interface has to be specified for a link-local nexthop
HQ-R1(config)#ipv6 route 2001:db8:a1:20::/64 g0/1 fe80::2
HQ-R1(config)#`, "The first attempt is refused; with the exit interface added, IOS accepts it silently.")}
${K.exam(`An answer option like <code>ipv6 route ::/0 fe80::1</code> is a classic distractor: valid-looking, refused by IOS. A link-local next hop is right only with the interface in front of it.`)}
<p><b>Why?</b> A link-local is unique only on its own link. Every link uses <code>fe80::/10</code>, so <code>fe80::2</code> can exist on G0/0, G0/1 and G0/2 at once — with manual link-locals it often does. A recursive lookup can't help: no route for <code>fe80::/10</code> points at one interface, because the range belongs to all of them. The router can't know which link to send its Neighbor Solicitation on, so IOS makes you say.</p>
${K.svg("0 0 720 296",
  K.dev("router",360,140,"EDGE","")+
  K.dev("router",110,60,"R-A","G0/0 fe80::2")+K.dev("router",610,60,"R-B","G0/1 fe80::2")+K.dev("router",360,250,"R-C","")+
  K.link(336,134,134,66,"G0/0")+K.link(384,134,586,66,"G0/1")+K.link(360,160,360,222,"")+K.txt(372,197,"G0/2",{c:"muted",s:10})+K.txt(372,212,"fe80::2",{c:"muted"})+
  K.box(20,140,250,58,"ipv6 route … fe80::2","which fe80::2? — refused")+
  K.box(450,140,250,58,"ipv6 route … g0/1 fe80::2","the one on G0/1 — accepted",true)+
  K.txt(360,24,"The same link-local can sit on every link: fe80::/10 is on all of them",{c:"fg",s:12,mid:true,f:"body",b:true}),
  "Three neighbours on three links, all fe80::2. A link-local next hop means something only together with its link, so IOS requires the exit interface.")}
<p>Why use link-locals at all? They <b>survive renumbering</b> (a new global /48 changes every global next hop, not <code>fe80::2</code>); they're <b>what IPv6 itself uses</b> (hosts learn their default router as a link-local from RAs, and IPv6 routing protocols use them too); and set by hand they're <b>short</b> — <code>fe80::2</code> beats <code>fe80::250:56ff:fe1c:2</code> at 2 a.m.</p>
<h3>Form 4 — fully specified</h3>
<p>Interface plus global next hop: <code>ipv6 route 2001:db8:a1:20::/64 g0/1 2001:db8:a1:ff::2</code>. No recursion, Neighbor Discovery only for the next hop, and the route lives and dies with G0/1. In <code>show ipv6 route static</code> on real IOS the four forms look like this:</p>
${K.out(`S   2001:DB8:A1:20::/64 [1/0]
     via 2001:DB8:A1:FF::2
S   2001:DB8:A1:20::/64 [1/0]
     via GigabitEthernet0/1, directly connected
S   2001:DB8:A1:20::/64 [1/0]
     via FE80::2, GigabitEthernet0/1
S   2001:DB8:A1:20::/64 [1/0]
     via 2001:DB8:A1:FF::2, GigabitEthernet0/1`, "Global next hop, exit interface only, link-local next hop, fully specified. [1/0] = AD 1, metric 0. IOS prints addresses in upper case.")}
${K.tip(`Read every <code>via</code> line the same way: next hop first, then the exit interface if the route names one. No interface printed means IOS finds it with a second, recursive lookup; <code>directly connected</code> with no next hop means the router treats the destination as on-link.`)}
${K.remember(`<b>Link-local next hop? Say which link.</b> Interface first, then the fe80 address: <code>ipv6 route &lt;prefix&gt; &lt;interface&gt; fe80::&lt;x&gt;</code>. And on Ethernet, always give a next hop — global or link-local.`)}
<p>To remove a static, repeat it exactly with <code>no</code> in front: <code>no ipv6 route 2001:db8:a1:20::/64 g0/1 fe80::2</code>. <code>show running-config | include ipv6 route</code> lists every configured static, including ones IOS has withdrawn from the table.</p>
<h3>Try it yourself: the Port Harcourt edge router</h3>
<p>PHC-EDGE, a Port Harcourt firm's internet edge. G0/0 faces the core switch CORE-L3 (<code>2001:db8:c0:ff::2</code>, link-local <code>fe80::2</code>); G0/1 the primary ISP (router link-local <code>fe80::1</code>); G0/2 an ${K.g("LTE","Long Term Evolution: 4G mobile data. An LTE router is a small router with a SIM card, often used as a backup link.")} backup router (<code>2001:db8:fe:b::1</code>). Some tasks come from a contractor's notes — read what IOS says.</p>
${K.hint(`Fix the refusal by adding the interface <i>before</i> the address. A host route is a /128. A floating route's distance goes at the end of the line.`)}
${K.term({env:"ios2", title:"IPv6 static routes on PHC-EDGE", opts:{kind:"router", host:"PHC-EDGE", model:"ISR 4331", motd:"PHC-EDGE — Port Harcourt internet edge. G0/0 core 2001:db8:c0:ff::/64 (CORE-L3 ::2, fe80::2) · G0/1 primary ISP 2001:db8:fe:a::/64 (ISP router fe80::1) · G0/2 LTE backup 2001:db8:fe:b::/64 (LTE router ::1)."},
  setup:e=>{ ["enable","configure terminal","hostname PHC-EDGE","ipv6 unicast-routing","interface g0/0","description CORE-L3","ipv6 address 2001:db8:c0:ff::1/64","ipv6 address fe80::1 link-local","no shutdown","interface g0/1","description PRIMARY ISP","ipv6 address 2001:db8:fe:a::2/64","no shutdown","interface g0/2","description LTE BACKUP","ipv6 address 2001:db8:fe:b::2/64","no shutdown","end","disable"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>; check your work with <code>do show ipv6 route static</code>.",
  tasks:[
    {text:"Default route to the primary ISP using its link-local <code>fe80::1</code>. Type <code>ipv6 route ::/0 fe80::1</code> first and read the refusal, then enter it the way IOS wants", done:e=>e.log.some(l=>/Interface has to be specified for a link-local nexthop/.test(l.out||"")) && (e.routes6||[]).some(r=>r.net==="::" && r.len===0 && r.ios==="GigabitEthernet0/1" && r.nh==="fe80::1" && !r.ad)},
    {text:"The staff LAN <code>2001:db8:c0:20::/64</code> is behind CORE-L3: add a network route with CORE-L3's <b>global</b> address as the next hop", done:e=>(e.routes6||[]).some(r=>r.net==="2001:db8:c0:20::" && r.len===64 && r.nh==="2001:db8:c0:ff::2")},
    {text:"The monitoring server <code>2001:db8:c0:30::99</code> (one address only) is behind CORE-L3: add a <b>host route</b> out of G0/0 to CORE-L3's link-local <code>fe80::2</code>", done:e=>(e.routes6||[]).some(r=>r.net==="2001:db8:c0:30::99" && r.len===128 && r.ios==="GigabitEthernet0/0" && r.nh==="fe80::2")},
    {text:"The contractor wrote <code>ipv6 route 2001:db8:c0:40::/64 g0/0</code> for the lab LAN behind CORE-L3. Enter it and look at it with <code>do show ipv6 route static</code> (<i>directly connected</i>: PHC-EDGE would Neighbor-Solicit every lab address itself). Remove it with <code>no ipv6 route 2001:db8:c0:40::/64 g0/0</code> and add it again with CORE-L3's link-local as the next hop", done:e=>e.log.some(l=>/2001:DB8:C0:40::\/64 \[1\/0\]\n\s+via GigabitEthernet0\/0, directly connected/.test(l.out||"")) && (e.routes6||[]).some(r=>r.net==="2001:db8:c0:40::" && r.len===64 && r.ios==="GigabitEthernet0/0" && r.nh==="fe80::2") && !(e.routes6||[]).some(r=>r.net==="2001:db8:c0:40::" && !r.nh)},
    {text:"Backup internet through the LTE router <code>2001:db8:fe:b::1</code>: a second default route with administrative distance <code>200</code>, so it waits in reserve", done:e=>(e.routes6||[]).some(r=>r.net==="::" && r.len===0 && r.nh==="2001:db8:fe:b::1" && r.ad===200)},
    {text:"<code>end</code>, then <code>show ipv6 route static</code>: one <code>::/0 [1/0]</code> entry towards the ISP — the <code>[200/0]</code> backup is <i>not</i> listed", done:e=>(e.routes6||[]).some(r=>r.ad===200) && e.log.some(l=>/::\/0 \[1\/0\]/.test(l.out||"") && !/\[200\/0\]/.test(l.out||""))},
    {text:"Save the configuration with <code>copy running-config startup-config</code>", done:e=>e.savedOnce},
  ],
  win:"You wrote a default route with a link-local next hop (after IOS refused it without the interface), a network route with a global next hop, a fully specified /128 host route, replaced an interface-only route with a proper next hop, and added a floating default that stays out of the table until it's needed.",
  solve:["enable","configure terminal","ipv6 route ::/0 fe80::1","ipv6 route ::/0 g0/1 fe80::1","ipv6 route 2001:db8:c0:20::/64 2001:db8:c0:ff::2","ipv6 route 2001:db8:c0:30::99/128 g0/0 fe80::2","ipv6 route 2001:db8:c0:40::/64 g0/0","do show ipv6 route static","no ipv6 route 2001:db8:c0:40::/64 g0/0","ipv6 route 2001:db8:c0:40::/64 g0/0 fe80::2","ipv6 route ::/0 2001:db8:fe:b::1 200","end","show ipv6 route static","copy running-config startup-config",""]})}
${K.check({q:"A router's G0/2 connects over Ethernet to a firewall whose link-local address is fe80::f1. Which command sends 2001:db8:44:900::/56 to that firewall?", o:["ipv6 route 2001:db8:44:900::/56 fe80::f1","ipv6 route 2001:db8:44:900::/56 fe80::f1 g0/2","ipv6 route 2001:db8:44:900::/56 g0/2 fe80::f1","ipv6 route 2001:db8:44:900:: ffff:ffff:ffff:ff00:: fe80::f1"], a:2, why:"Interface first, then the link-local. The first is refused, the second has the order wrong, and ipv6 route never takes a mask."})}
${K.q({type:"fill", q:"Same logic, new situation: router BR-R3 must send 2001:db8:3e:50::/64 to its neighbour on G0/1, whose link-local address is fe80::51. Write the static route using the link-local next hop.", fields:[{label:"Command", a:["ipv6 route 2001:db8:3e:50::/64 GigabitEthernet0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 g0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 gi0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 gig0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 gi 0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 GigabitEthernet 0/1 fe80::51","ipv6 route 2001:db8:3e:50::/64 g0/1 fe80:0:0:0:0:0:0:51","ipv6 route 2001:0db8:003e:0050::/64 g0/1 fe80::51","ipv6 route 2001:db8:3e:50:0:0:0:0/64 g0/1 fe80::51"]}], why:"1. Asked: a static with a link-local next hop. 2. Rule: a link-local is only unique on its link, so name the interface, then the address. 3. Apply: ipv6 route, the prefix with its length, G0/1, fe80::51. Leaving out g0/1 gets '% Interface has to be specified for a link-local nexthop'."})}

<h2>Network, host and default routes: /64, /128 and ::/0</h2>
<p>The prefix length decides how much a route covers: <b>the more bits it fixes, the fewer addresses it covers and the more specific it is</b>.</p>
<ul>
<li><b>Network route for one LAN</b> — a /64, since every LAN is a /64 (lesson 1).</li>
<li><b>Site summary</b> — a /48 or /56. A /48 holds 65,536 /64s (lesson 2), so one route can stand for a whole site.</li>
<li><b>${K.g("Host route","A route to exactly one address: in IPv6 a /128 (in IPv4 a /32). It beats every other route containing that address.")}</b> — a /128: steer one server through a firewall, or reach another router's management address.</li>
<li><b>Default route</b> — <code>::/0</code> compares <b>zero</b> bits, so every address matches it, and as the shortest match it loses to everything else. Use it where there's one way out.</li>
</ul>
<p>HQ-R1, fully configured. Security wants traffic to the branch's card-payment server, <code>2001:db8:a1:20::99</code>, to pass the HQ firewall at <code>2001:db8:a1:10::fe</code>; G0/2 faces the ISP:</p>
${K.out(`HQ-R1(config)#ipv6 route ::/0 g0/2 fe80::1
HQ-R1(config)#ipv6 route 2001:db8:a1:20::/64 g0/1 fe80::2
HQ-R1(config)#ipv6 route 2001:db8:a1:20::99/128 2001:db8:a1:10::fe
HQ-R1(config)#end
HQ-R1#show ipv6 route
IPv6 Routing Table - default - 10 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
       B - BGP, R - RIP, H - NHRP, I1 - ISIS L1
       ... (legend shortened)
S   ::/0 [1/0]
     via FE80::1, GigabitEthernet0/2
C   2001:DB8:A1:10::/64 [0/0]
     via GigabitEthernet0/0, directly connected
L   2001:DB8:A1:10::1/128 [0/0]
     via GigabitEthernet0/0, receive
S   2001:DB8:A1:20::/64 [1/0]
     via FE80::2, GigabitEthernet0/1
S   2001:DB8:A1:20::99/128 [1/0]
     via 2001:DB8:A1:10::FE
C   2001:DB8:A1:FF::/64 [0/0]
     via GigabitEthernet0/1, directly connected
L   2001:DB8:A1:FF::1/128 [0/0]
     via GigabitEthernet0/1, receive
C   2001:DB8:FE:7::/64 [0/0]
     via GigabitEthernet0/2, directly connected
L   2001:DB8:FE:7::2/128 [0/0]
     via GigabitEthernet0/2, receive
L   FF00::/8 [0/0]
     via Null0, receive`, "A default, a network route and a host route on HQ-R1, plus its connected and local entries.")}
<ul>
<li><code>IPv6 Routing Table - default - 10 entries</code> — &ldquo;default&rdquo; names the router's main table (routers can hold separate tables called ${K.g("VRFs","Virtual Routing and Forwarding instances: separate routing tables inside one router. Beyond CCNA; everything here uses the default table.")}); the count includes every C, L and S entry and FF00::/8.</li>
<li><b>Two lines per route</b>: code, prefix/length and <code>[AD/metric]</code>, then an indented <code>via</code>. Equal paths would add more <code>via</code> lines.</li>
<li><code>S ::/0</code> — the default. No <code>*</code>, no &ldquo;Gateway of last resort&rdquo; line: look for <code>::/0</code>.</li>
<li><code>C</code> and <code>L …/128 … receive</code> — each up/up interface with a global address gives a connected /64 and a local /128 (&ldquo;receive&rdquo; = deliver to me). Link-locals get no entries.</li>
<li><code>S 2001:DB8:A1:20::99/128 via 2001:DB8:A1:10::FE</code> — the host route; no interface printed, so IOS finds it by recursive lookup.</li>
<li><code>L FF00::/8 via Null0, receive</code> — always present: multicast is handled by the router, never forwarded as unicast. ${K.g("Null0","A virtual interface that discards whatever is sent to it. Routes 'via Null0' mean drop or handle locally, never forward.")} is IOS's discard interface.</li>
</ul>
${K.steps([
  ["2001:db8:a1:20::99", "Matches ::/0, the /64 and the /128 → <b>/128 → the firewall</b>, which passes it on."],
  ["2001:db8:a1:20::31", "Matches ::/0 and the /64 → <b>/64 → fe80::2 out of G0/1</b>."],
  ["2001:db8:a1:30::5 (a branch not built yet)", "Only ::/0 matches, so it leaks to the ISP instead of failing at HQ-R1 — a default route can hide a missing route, as in Module 5."],
])}
${K.dyk(`Because a /48 holds 65,536 LANs, IPv6 is usually <i>easier</i> to summarise than IPv4: give each site a /48 or /56 and the other sites need one route for it, however many VLANs it adds later.`)}
${K.check({q:"A router has S ::/0 via the ISP, S 2001:db8:70::/48 via HQ and S 2001:db8:70:5::/64 via BR-5. Where does a packet for 2001:db8:70:50::9 go?", o:["BR-5 — it's the most specific route","HQ — the /48 is the longest prefix that contains it","The ISP — no route matches exactly","It's dropped"], a:1, why:"Fourth hextet 0050 is not 0005, so the /64 doesn't contain it. The /48 does, and beats ::/0."})}
<h3>Same logic, new situation</h3>
<p>A regional router has <code>S 2001:db8:d0::/48</code> via head office, <code>S 2001:db8:d0:7700::/56</code> via the disaster-recovery site and <code>S ::/0</code> via the ISP. Where do packets to <code>2001:db8:d0:77aa::1</code>, <code>2001:db8:d0:7800::1</code> and <code>2001:db8:d1::1</code> go?</p>
${K.hint(`A /56 compares 14 hex digits: the first three hextets plus the first <i>two</i> digits of the fourth.`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> the route for three addresses. <b>2. Rule:</b> longest match, comparing only the first <i>length</i> bits. <b>3. Apply:</b> the /56 fixes <code>2001:0db8:00d0:77</code>, covering <code>…:7700</code>–<code>…:77ff</code>. <code>77aa</code> → <b>the DR site</b>. <code>7800</code> is outside the /56 but inside the /48 → <b>head office</b>. <code>00d1</code> in the third hextet → only the default → <b>the ISP</b>.</p>`)}

<h2>Routing is still one-way: the return path, ping and traceroute</h2>
<p>Module 5's hardest lesson applies unchanged: <b>each router decides only where to send <i>this</i> packet next, from its own table.</b> A reply is a new packet going the other way, and every router it meets needs a route back to the sender.</p>
${K.remember(`<b>Routing is one-way — in IPv6 too.</b> Every router on the way <b>there</b> needs a route to the destination's prefix; every router on the way <b>back</b> needs a route to the source's /64. After every IPv6 static, ask: &ldquo;and how does the reply get home?&rdquo;`)}
<p>The IPv6 detail: a host replies via the default router it learned from a ${K.g("Router Advertisement","RA: the message (ICMPv6 type 134) a router with ipv6 unicast-routing sends on each IPv6 LAN, giving the /64 prefix and its own link-local address as the default router (lesson 4).")} (that router's link-local); a server with static settings uses the gateway typed in. From there, each router needs its own route back.</p>
<h3>Reading the results: what Windows and IOS tell you</h3>
<p>Ping and traceroute take IPv6 addresses directly: <code>ping 2001:db8:5:1::80</code>, Windows <code>tracert 2001:db8:5:1::80</code>, IOS <code>traceroute 2001:db8:5:1::80</code>. Errors arrive as ${K.g("ICMPv6","Internet Control Message Protocol for IPv6: IPv6's helper for echo (ping), errors and Neighbor Discovery. Destination Unreachable is type 1; its code says why.")} Destination Unreachable messages:</p>
<div class="tablewrap"><table>
<tr><th>Windows shows</th><th>What happened — and where to look</th></tr>
<tr><td><code>Reply from &lt;router&gt;: Destination net unreachable.</code></td><td>That router has <b>no route</b> (code 0): its <code>show ipv6 route</code></td></tr>
<tr><td><code>Reply from &lt;router&gt;: Destination host unreachable.</code></td><td>It had a route, but its Neighbor Solicitation for the next hop or host got no answer (code 3, address unreachable): the route's next hop and interface, <code>show ipv6 neighbors</code></td></tr>
<tr><td>The same, from the PC's own address</td><td>The PC's solicitation for its gateway failed: the PC's IPv6 gateway</td></tr>
<tr><td><code>Request timed out.</code></td><td>Often the request arrived but the reply had no route home: the return path</td></tr>
<tr><td><code>PING: transmit failed. General failure.</code></td><td>No IPv6 default router on the PC: Router Advertisements</td></tr>
</table></div>
<p>Windows IPv6 replies show no TTL. IOS prints <code>!!!!!</code> for success and <code>.....</code> for timeouts, and asks for an <code>Output Interface:</code> when you ping a link-local — same reason as the route.</p>
${K.out(`C:\\>tracert 2001:db8:a1:20::31

Tracing route to 2001:db8:a1:20::31 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  2001:db8:a1:10::1
  2     1 ms    <1 ms    <1 ms  2001:db8:a1:ff::2
  3     1 ms     1 ms    <1 ms  2001:db8:a1:20::31

Trace complete.`, "HQ PC to branch PC. Each hop is a router replying from one of its own addresses — normally its interface facing the PC; the last line is the destination.")}
<p>Traceroute is a return-path test in disguise: each hop's answer must find its way back, and a hop with no route back to you shows <code>* * *</code> (Windows adds <code>Request timed out.</code>) — on real networks and in the benches alike. Stars from hop 2 on don't prove hop 2 is broken; often it just can't reach you.</p>
${K.mistake(`Closing an IPv6 ticket because the router's own ping works. It's sourced from the exit interface's global address — usually the transit /64, which the far router knows as connected — so it can pass while every user fails. Test from a host on the user's LAN. (Or source it from the LAN: <code>ping &lt;address&gt; source g0/0</code> sends from G0/0's address, so the reply must find the users' /64 — IOS confirms with <code>Packet sent with a source address of …</code>.)`)}
<h3>Hands-on: the Kano branch that has IPv6 but can't reach the portal</h3>
<p>The opening ticket, on a different network from the worked example. ABJ-HQ (Abuja, LAN <code>2001:db8:5:1::/64</code>) and KAN-BR (Kano, LAN <code>2001:db8:5:40::/64</code>) share transit link <code>2001:db8:5:12::/64</code> (link-locals <code>fe80::a</code> and <code>fe80::b</code>). IPv4 already works; the portal is <code>2001:db8:5:1::80</code>. Kano PCs use ${K.g("SLAAC","Stateless Address Autoconfiguration: a host builds its own IPv6 address from the /64 prefix in a Router Advertisement plus an interface ID (lesson 4).")}. The frame log is open.</p>
${K.hint(`Each failure names a router: the address in &ldquo;Reply from …&rdquo;. When something looks right but isn't, expand it and compare hextet by hextet.`)}
${K.bench({id:"m6-v6-return", points:100, from:"CCNA · Module 6 · lesson 5", title:"Kano branch: IPv6 statics both ways — and a return-path gap", viewBox:"0 0 760 400", openLog:true, ipv6:true,
  intro:"LAPTOP-KANO is on KAN-BR's console and LAPTOP-HQ on ABJ-HQ's (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control). After you switch laptops, press Enter and type <code>enable</code> again. Click a PC or the server to open its Command Prompt. Transit link 2001:db8:5:12::/64 — ABJ-HQ ::1 (link-local fe80::a), KAN-BR ::2 (link-local fe80::b).",
  devices:[
    {id:"lapk", kind:"laptop", label:"LAPTOP-KANO", x:20, y:20},
    {id:"br", kind:"router", label:"KAN-BR", model:"ISR 1100 · Kano branch", x:40, y:150,
      config:e=>{ ["en","conf t","hostname KAN-BR","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description KANO LAN","ip address 10.5.40.1 255.255.255.0","ipv6 address 2001:db8:5:40::1/64","ipv6 address fe80::b link-local","no shutdown","interface g0/1","description WAN to ABJ-HQ","ip address 10.5.12.2 255.255.255.252","ipv6 address 2001:db8:5:12::2/64","ipv6 address fe80::b link-local","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.5.12.1","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"pck", kind:"pc", label:"KANO-PC1", x:60, y:285, ip:"10.5.40.11", mask:"255.255.255.0", gw:"10.5.40.1"},
    {id:"laph", kind:"laptop", label:"LAPTOP-HQ", x:612, y:20},
    {id:"hq", kind:"router", label:"ABJ-HQ", model:"ISR 4331 · Abuja head office", x:520, y:150,
      config:e=>{ ["en","conf t","hostname ABJ-HQ","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description HQ LAN","ip address 10.5.1.1 255.255.255.0","ipv6 address 2001:db8:5:1::1/64","ipv6 address fe80::a link-local","no shutdown","interface g0/1","description WAN to KAN-BR","ip address 10.5.12.1 255.255.255.252","ipv6 address 2001:db8:5:12::1/64","ipv6 address fe80::a link-local","no shutdown","exit","ip route 10.5.40.0 255.255.255.0 10.5.12.2","ipv6 route 2001:db8:5:4::/64 2001:db8:5:12::2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"srv", kind:"server", label:"PORTAL", x:600, y:285, ip:"10.5.1.80", mask:"255.255.255.0", gw:"10.5.1.1", ip6:{auto:false, addr:"2001:db8:5:1::80", len:64, gw:"fe80::a"}},
  ],
  cables:[ {type:"cat6", a:"br:g1", b:"hq:g1"}, {type:"cat6", a:"pck:eth", b:"br:g0"}, {type:"cat6", a:"srv:eth", b:"hq:g0"},
           {type:"console", a:"lapk:usb", b:"br:con"}, {type:"console", a:"laph:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On KANO-PC1, <code>ipconfig</code>: note the IPv6 Address (built from KAN-BR's Router Advertisement, prefix 2001:db8:5:40::/64) and the IPv6 gateway <code>fe80::b%4</code>. Write the address down — you'll need it. (The lab builds the interface ID with EUI-64; real Windows picks a random one.)", done:B=>Bench.tried(B,"pck",/^\s*ipconfig(\s+\/all)?\s*$/i)},
    {text:"Reproduce the ticket from KANO-PC1: <code>ping 10.5.1.80</code> (IPv4 — replies), then <code>ping 2001:db8:5:1::80</code> (IPv6). Who sends <code>Destination net unreachable</code>?", done:B=>Bench.tried(B,"pck",/^\s*ping\s+10\.5\.1\.80\s*$/i) && Bench.tried(B,"pck",/^\s*ping\s+2001:db8:5:1::80\s*$/i)},
    {text:"On LAPTOP-KANO: console into KAN-BR, <code>enable</code>, <code>show ipv6 route</code>. Is there any route containing 2001:db8:5:1::80 — or a ::/0?", done:B=>B.devs.br.env.log.some(l=>/^\s*(do\s+)?sh\S*\s+ipv6\s+ro\S*\s*$/i.test(l.cmd||"") && /2001:DB8:5:40::\/64/.test(l.out||""))},
    {text:"Give KAN-BR a default route through ABJ-HQ's link-local <code>fe80::a</code>. In <code>configure terminal</code>, try <code>ipv6 route ::/0 fe80::a</code> first and read the refusal; then enter it with the exit interface", done:B=>B.devs.br.env.log.some(l=>/Interface has to be specified for a link-local nexthop/.test(l.out||"")) && B.devs.br.env.rib6().some(x=>x.code==="S" && x.len===0 && x.nhs.some(h=>h.ios==="GigabitEthernet0/1" && h.nh==="fe80::a"))},
    {text:"Ping the portal again from KANO-PC1: now <code>Request timed out.</code> — the request got further. In the frame log, follow the request to PORTAL, then follow PORTAL's reply. Then, from PORTAL's Command Prompt, ping KANO-PC1's IPv6 address (task 1): who answers, and with what?", done:B=>Bench.tried(B,"srv",/^\s*ping\s+2001:db8:5:40:/i)},
    {text:"On LAPTOP-HQ: console into ABJ-HQ, <code>enable</code>, <code>show ipv6 route</code>. Find the static that was meant for Kano and compare its prefix with Kano's real LAN, hextet by hextet", done:B=>B.devs.hq.env.log.some(l=>/S   2001:DB8:5:4::\/64/.test(l.out||""))},
    {text:"Fix the return path on ABJ-HQ: remove the mistyped route (<code>no</code> followed by the exact line) and add Kano's real /64 with KAN-BR's global transit address <code>2001:db8:5:12::2</code> as the next hop", done:B=>{ const e = B.devs.hq.env; return !(e.routes6||[]).some(r=>r.net==="2001:db8:5:4::") && e.rib6().some(x=>x.code==="S" && x.net==="2001:db8:5:40::" && x.len===64 && x.nhs.some(h=>h.cfgNh==="2001:db8:5:12::2" || (h.ios==="GigabitEthernet0/1" && h.nh==="fe80::b"))); }},
    {text:"Prove it from the user's side: KANO-PC1 <code>ping 2001:db8:5:1::80</code> (four replies, no TTL shown) and <code>tracert 2001:db8:5:1::80</code> — three lines: KAN-BR's LAN address, ABJ-HQ's transit address, PORTAL", done:B=>Bench.pinged(B,"pck","2001:db8:5:1::80") && Bench.traced(B,"pck","2001:db8:5:1::80")},
    {text:"Save the configuration on both routers (<code>write memory</code> on each)", done:B=>B.devs.br.env.savedOnce && B.devs.hq.env.savedOnce},
  ],
  win:"You fixed IPv6 in both directions: KAN-BR got a default route through ABJ-HQ's link-local address (after IOS insisted on the interface), and you found the return-path gap — a /64 typed as 2001:db8:5:4:: instead of 2001:db8:5:40:: — from PORTAL's 'Destination net unreachable' and the frame log, then proved the path from a user's PC.",
  solve:[["pc","pck","ipconfig"],["pc","pck","ping 10.5.1.80"],["pc","pck","ping 2001:db8:5:1::80"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 route"],
    ["term","configure terminal"],["term","ipv6 route ::/0 fe80::a"],["term","ipv6 route ::/0 g0/1 fe80::a"],["term","end"],["term","write memory"],
    ["pc","pck","ping 2001:db8:5:1::80"],["pc","srv","ping 2001:db8:5:40:250:54ff:fe4f:e69d"],
    ["console","laph",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 route"],
    ["term","configure terminal"],["term","no ipv6 route 2001:db8:5:4::/64 2001:db8:5:12::2"],["term","ipv6 route 2001:db8:5:40::/64 2001:db8:5:12::2"],["term","end"],
    ["pc","pck","ping 2001:db8:5:1::80"],["pc","pck","tracert 2001:db8:5:1::80"],["term","write memory"]]})}
${K.hint(`Stuck at task 5? In the log after KANO-PC1's second ping, find the line that begins &ldquo;ABJ-HQ has no IPv6 route to 2001:db8:5:40:…&rdquo;. Then write <code>2001:db8:5:4::</code> and <code>2001:db8:5:40::</code> out in full.`)}
${K.reveal("Walkthrough — what the evidence said",`<p>The first IPv6 ping got <code>Destination net unreachable</code> from <code>2001:db8:5:40::1</code> — KAN-BR itself, whose IPv6 table held only C, L and FF00::/8 (IPv4 worked: its default lives in the other table). The default via <code>g0/1 fe80::a</code> moved the failure: PORTAL's reply died at ABJ-HQ, which told PORTAL <code>Destination net unreachable</code> from <code>2001:db8:5:1::1</code> (a <code>tracert</code> from KANO-PC1 at that stage shows KAN-BR, then only stars: ABJ-HQ can't answer either). Its static was for <code>2001:db8:5:4::/64</code> — <code>…:0005:0004</code> expanded, against Kano's <code>…:0005:0040</code>: a typo IOS had no reason to refuse.</p>`)}
${K.check({q:"In the bench, once KAN-BR had its default route but before you fixed ABJ-HQ, KAN-BR itself could ping the portal while KANO-PC1 couldn't. Why?", o:["Routers ignore missing routes for their own traffic","KAN-BR's ping was sourced from its transit address 2001:db8:5:12::2, which ABJ-HQ knows as connected, so the replies had a way back","PORTAL blocks PCs but not routers","IOS pings use link-local addresses, which need no route"], a:1, why:"A router's ping is sourced from its exit interface — the transit /64, connected at ABJ-HQ. Kano's LAN wasn't routable back until the fix: ping 2001:db8:5:1::80 source g0/0 on KAN-BR would have failed just like the PC."})}
<h3>Same logic, new situation</h3>
<p>Kano later adds a second VLAN, <code>2001:db8:5:41::/64</code>. Its users get SLAAC addresses but can't reach the portal; the first VLAN still can. What's missing, and what single route could cover both VLANs?</p>
${K.hint(`Where does PORTAL's reply to a 41:: address die? Then write 0x40 and 0x41 in binary.`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> why only the new VLAN fails; one route for both. <b>2. Rule:</b> every router back needs a route to the <i>source's</i> /64. <b>3. Apply:</b> ABJ-HQ has only <code>2001:db8:5:40::/64</code> and no default, so replies to <code>…:41::</code> die there. Add <code>ipv6 route 2001:db8:5:41::/64 2001:db8:5:12::2</code> — or one /63: 0x40 = 0100 0000 and 0x41 = 0100 0001 differ only in the last bit of the fourth hextet, so <code>2001:db8:5:40::/63</code> covers exactly the two.</p>`)}

<h2>Floating static routes: a backup that waits</h2>
${K.remember(`<b>A floating static</b> is a route for the <b>same prefix</b> as the primary with a <b>higher administrative distance</b> on the end of the line. It stays out of the table — floating — until the primary is withdrawn, and steps back when the primary returns.`)}
<p><b>Why it works:</b> it's only AD (Module 5). Two routes for <code>::/0</code> at distances 1 and 200: the 1 is installed, the 200 waits in the configuration until IOS withdraws the primary. And IOS withdraws an IPv6 static only when its <b>exit interface goes down</b>, or its <b>global next hop stops resolving</b> (usually because that /64 went down with its interface — and by default IOS won't keep it alive by resolving it through the backup <code>::/0</code>). It does <b>not</b> notice a failure further away: if the ISP's router is up but its upstream is broken, your static stays installed and traffic goes into the void. Detecting that needs path-testing tools beyond this lesson.</p>
${K.svg("0 0 740 300",
  K.dev("router",120,90,"EDGE","")+K.dev("router",600,40,"PRIMARY","fibre")+K.dev("router",600,160,"BACKUP","radio")+
  K.link(146,84,574,46,"G0/1 · ::/0 [1/0]")+K.link(146,98,574,156,"G0/2 · ::/0 [200/0]",true)+
  K.box(20,212,330,70,"Fibre up: show ipv6 route static","S ::/0 [1/0] via the fibre — the [200/0] route isn't listed",true)+
  K.box(390,212,330,70,"Fibre cut: G0/1 down/down","[1/0] withdrawn · S ::/0 [200/0] via the radio installs")+
  K.txt(470,63,"✗",{c:"bad",s:22,mid:true,b:true})+K.txt(470,24,"cut here and G0/1 goes down",{c:"bad",s:10.5,mid:true}),
  "While the fibre is up only the AD-1 route is installed. A failure that takes G0/1 down withdraws it and the AD-200 route installs; when the fibre returns, AD 1 takes over again.")}
<p><b>Choosing the distance:</b> higher than what it backs up — above 1 behind a static, above 110 behind OSPF. 200 or 250 makes the intent obvious; 254 is the highest you can type (255 means &ldquo;never use&rdquo;). And the return path: the far router needs its <b>own</b> floating route back, or failover works one way only.</p>
${K.mistake(`Adding the backup <i>without</i> a distance. Both defaults have AD 1, so both are installed as equal-cost paths and flows share the slow backup all the time. Fingerprint: one <code>::/0 [1/0]</code> entry with <b>two</b> <code>via</code> lines.`)}
<h3>Hands-on: the Ikeja office's backup that never waited</h3>
<p>IKJ-EDGE (Ikeja office) reaches the Lekki data-centre router LEK-DC over a fibre (primary) and a radio link (backup). The ticket: <i>&ldquo;Since a contractor added the radio link on Friday, uploads to the data centre are slow, although the fibre is up.&rdquo;</i> Make the backup wait, then prove it takes over when the fibre is cut — at both ends.</p>
${K.hint(`Look for one prefix with two <code>via</code> lines. To make a route float, it needs a number at the end of its line — remove the old line first, then add the new one.`)}
${K.bench({id:"m6-v6-floating", points:100, from:"CCNA · Module 6 · lesson 5", title:"a floating IPv6 default over the backup link", viewBox:"0 0 960 500", ipv6:true,
  intro:"LAPTOP-IKJ is on IKJ-EDGE's console and LAPTOP-DC on LEK-DC's (9600 8N1, no flow control; after you switch laptops press Enter and <code>enable</code> again). Fibre: 2001:db8:77:f1::/64 (IKJ-EDGE ::1, LEK-DC ::2). Radio: 2001:db8:77:f2::/64 (IKJ-EDGE ::1, LEK-DC ::2). Data-centre servers: WEB 2001:db8:77:200::80 and APP 2001:db8:77:200::25. To cut the fibre, click IKJ-EDGE's Gi0/1 port and unplug the cable; a spare Cat6 is in the tray.",
  devices:[
    {id:"lap", kind:"laptop", label:"LAPTOP-IKJ", x:20, y:20},
    {id:"pc1", kind:"pc", label:"PC1 Ikeja", x:30, y:300, ip:"10.77.10.21", mask:"255.255.255.0", gw:"10.77.10.1"},
    {id:"edge", kind:"router", label:"IKJ-EDGE", model:"ISR 1100 · Ikeja office", x:170, y:190,
      config:e=>{ ["en","conf t","hostname IKJ-EDGE","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description IKEJA LAN","ip address 10.77.10.1 255.255.255.0","ipv6 address 2001:db8:77:10::1/64","ipv6 address fe80::1 link-local","no shutdown","interface g0/1","description PRIMARY FIBRE to LEK-DC","ipv6 address 2001:db8:77:f1::1/64","no shutdown","interface g0/2","description BACKUP RADIO to LEK-DC","ipv6 address 2001:db8:77:f2::1/64","no shutdown","exit","ipv6 route ::/0 2001:db8:77:f1::2","ipv6 route ::/0 2001:db8:77:f2::2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"lapd", kind:"laptop", label:"LAPTOP-DC", x:760, y:20},
    {id:"dc", kind:"router", label:"LEK-DC", model:"ISR 4331 · Lekki data centre", x:450, y:190,
      config:e=>{ ["en","conf t","hostname LEK-DC","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description DC SERVERS","ipv6 address 2001:db8:77:200::1/64","ipv6 address fe80::1 link-local","no shutdown","interface g0/1","description PRIMARY FIBRE to IKJ-EDGE","ipv6 address 2001:db8:77:f1::2/64","no shutdown","interface g0/2","description BACKUP RADIO to IKJ-EDGE","ipv6 address 2001:db8:77:f2::2/64","no shutdown","exit","ipv6 route 2001:db8:77:10::/64 2001:db8:77:f1::1","ipv6 route 2001:db8:77:10::/64 2001:db8:77:f2::1 200","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"DC-SW", model:"server switch", x:700, y:290, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"web", kind:"server", label:"WEB", x:640, y:395, ip:"10.77.200.80", mask:"255.255.255.0", gw:"10.77.200.1", ip6:{auto:false, addr:"2001:db8:77:200::80", len:64, gw:"fe80::1"}},
    {id:"app", kind:"server", label:"APP", x:820, y:395, ip:"10.77.200.25", mask:"255.255.255.0", gw:"10.77.200.1", ip6:{auto:false, addr:"2001:db8:77:200::25", len:64, gw:"fe80::1"}},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"edge:con"}, {type:"console", a:"lapd:usb", b:"dc:con"}, {type:"cat6", a:"pc1:eth", b:"edge:g0"},
    {type:"cat6", a:"edge:g1", b:"dc:g1"}, {type:"cat6", a:"edge:g2", b:"dc:g2"}, {type:"cat6", a:"dc:g0", b:"sw:g1"}, {type:"cat6", a:"web:eth", b:"sw:g2"}, {type:"cat6", a:"app:eth", b:"sw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"On LAPTOP-IKJ: console into IKJ-EDGE, <code>enable</code>, <code>show ipv6 route static</code>. Find the one prefix with two <code>via</code> lines — that's why uploads are sharing the radio", done:B=>B.devs.edge.env.log.some(l=>/::\/0 \[1\/0\]\n\s+via 2001:DB8:77:F1::2\n\s+via 2001:DB8:77:F2::2/.test(l.out||""))},
    {text:"Make the radio route float: in <code>configure terminal</code>, remove it with <code>no ipv6 route ::/0 2001:db8:77:f2::2</code> and add it again with distance <code>200</code> on the end", done:B=>{ const r = B.devs.edge.env.routes6||[]; return r.some(x=>x.net==="::" && x.nh==="2001:db8:77:f2::2" && x.ad===200) && !r.some(x=>x.net==="::" && x.nh==="2001:db8:77:f2::2" && !x.ad); }},
    {text:"<code>show ipv6 route static</code> again: <code>::/0 [1/0]</code> with a single <code>via</code> line, the fibre. The <code>[200/0]</code> route is configured but not listed", done:B=>(B.devs.edge.env.routes6||[]).some(x=>x.ad===200) && B.devs.edge.env.log.some(l=>/::\/0 \[1\/0\]\n\s+via 2001:DB8:77:F1::2(?!\n\s+via)/.test(l.out||""))},
    {text:"From PC1, <code>tracert 2001:db8:77:200::80</code> (WEB). Hop 2 should be LEK-DC's fibre address, 2001:db8:77:f1::2", done:B=>Bench.traced(B,"pc1","2001:db8:77:200::80") && (B.devs.edge.env.lookup6("2001:db8:77:200::80")||{}).nh==="2001:db8:77:f1::2"},
    {text:"Cut the fibre: unplug the cable from IKJ-EDGE Gi0/1", done:B=>!Bench.upAt(B,"edge:g1")},
    {text:"On IKJ-EDGE, <code>show ipv6 route static</code>: the <code>[1/0]</code> route has gone (its next hop no longer resolves) and <code>::/0 [200/0]</code> via the radio has installed", done:B=>B.devs.edge.env.log.some(l=>/::\/0 \[200\/0\]\n\s+via 2001:DB8:77:F2::2/.test(l.out||""))},
    {text:"Prove it with the other server: from PC1, <code>tracert 2001:db8:77:200::25</code> (APP). Hop 2 is now the radio address, 2001:db8:77:f2::2", done:B=>Bench.traced(B,"pc1","2001:db8:77:200::25") && (B.devs.edge.env.lookup6("2001:db8:77:200::25")||{}).nh==="2001:db8:77:f2::2"},
    {text:"The return path: on LAPTOP-DC, console into LEK-DC, <code>enable</code>, <code>show ipv6 route static</code>. Its own floating route back to the Ikeja LAN, <code>[200/0]</code>, has taken over too", done:B=>B.devs.dc.env.log.some(l=>/2001:DB8:77:10::\/64 \[200\/0\]/.test(l.out||""))},
    {text:"The fibre is repaired: plug a Cat6 from the tray between IKJ-EDGE Gi0/1 and LEK-DC Gi0/1. Back on IKJ-EDGE, <code>show ipv6 route static</code> — the <code>[1/0]</code> route is back and the backup floats again, with nobody typing a command", done:B=>Bench.up(B,"edge:g1","dc:g1") && (B.devs.edge.env.lookup6("2001:db8:77:200::80")||{}).nh==="2001:db8:77:f1::2" && B.devs.edge.env.log.some(l=>/::\/0 \[200\/0\]/.test(l.out||""))},
    {text:"Save IKJ-EDGE's configuration (<code>write memory</code>)", done:B=>B.devs.edge.env.savedOnce},
  ],
  win:"You turned an accidental equal-cost backup into a floating default (AD 200), watched it stay out of the table, cut the fibre and saw IOS withdraw the primary and install the backup — at both ends, because LEK-DC had its own floating route back — and saw the primary take over again when the fibre returned.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 route static"],
    ["term","configure terminal"],["term","no ipv6 route ::/0 2001:db8:77:f2::2"],["term","ipv6 route ::/0 2001:db8:77:f2::2 200"],["term","end"],["term","show ipv6 route static"],
    ["pc","pc1","tracert 2001:db8:77:200::80"],["unplug","edge:g1"],["term","show ipv6 route static"],["pc","pc1","tracert 2001:db8:77:200::25"],
    ["console","lapd",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 route static"],
    ["plug","cat6","edge:g1","dc:g1"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 route static"],["term","write memory"]]})}
<p>What you saw: cutting the fibre took G0/1 down, the connected <code>2001:db8:77:f1::/64</code> went, the primary's next hop stopped resolving, and the floating route installed — on LEK-DC too, for the replies.</p>
${K.check({q:"An edge router has ipv6 route ::/0 2001:db8:fe:a::1 and ipv6 route ::/0 2001:db8:fe:b::1 200. The primary ISP's router stays up, but its link to the rest of the internet fails. What happens?", o:["The floating route installs, because the primary can no longer reach the internet","Nothing changes: G0/1 is still up and 2001:db8:fe:a::1 still resolves, so the primary stays installed and traffic is lost","Both routes are installed and shared","The router removes both routes"], a:1, why:"A static is withdrawn only when its interface goes down or its next hop stops resolving. A failure beyond the neighbour is invisible, so the backup never takes over."})}
${K.q({type:"order", q:"Same logic, new situation: a branch router has ipv6 route ::/0 g0/1 fe80::1 (primary, over a fibre) and ipv6 route ::/0 g0/2 fe80::9 210 (backup, over LTE). A digger cuts the fibre. Put what happens in order.", items:["The fibre is cut and G0/1 goes down/down","IOS withdraws the primary ::/0, because its exit interface is down","The ::/0 [210/0] route via G0/2 and fe80::9 is installed","Traffic to the internet leaves by the LTE router","When the fibre is repaired, the [1/0] route returns and the backup floats again"], why:"A static with an exit interface lives only while that interface is up. Once it is withdrawn, AD no longer has a competitor to compare, so the AD-210 route installs. No command is needed either way: the primary's return wins on AD and pushes the backup out again."})}

<h2>Troubleshooting IPv6 statics at work</h2>
${K.when([
  ["Global next hop","Most network routes","Readable; IOS finds the interface itself","The route must follow one particular link"],
  ["Link-local next hop + interface","Branch and edge defaults; links with manual link-locals","Survives a change of global prefix","You haven't checked which interface the neighbour is on"],
  ["Fully specified (interface + global)","The route must follow one link","No recursion; dies cleanly with the interface","A next hop alone would do"],
  ["Exit interface only","Point-to-point links (serial, tunnels)","Nobody to look up at the far end","Ethernet — nobody answers the solicitations"],
  ["Floating static (higher AD)","A backup behind a static or learned route","Hidden until the primary is withdrawn","The failure won't take your interface down"],
], "Which IPv6 static to write — and when")}
${K.mistake(`A link-local next hop on the <b>wrong interface</b>: <code>ipv6 route 2001:db8:e:30::/64 g0/2 fe80::2</code> when fe80::2 is on G0/1. G0/2 is up, so the route installs — and every packet triggers a Neighbor Solicitation on G0/2 that nobody answers. Users get &ldquo;Destination host unreachable&rdquo; from the router.`)}
${K.job("“The regional office can't reach the new HR server over IPv6”",`
<p><b>The ticket.</b> &ldquo;Regional office: since last night's change, the new HR system (2001:db8:e:30::25) won't open. Everything else works.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;What changed?&rdquo; — a contractor connected the new HR router, HR-R2, to REG-R1 and added a route. &ldquo;Everyone?&rdquo; — yes. One new destination broken after a change: suspect the new route.</p>
<p><b>Checks.</b> From a staff PC, the error names the router and the kind of failure:</p>
${K.out(`C:\\>ping 2001:db8:e:30::25

Pinging 2001:db8:e:30::25 with 32 bytes of data:
Reply from 2001:db8:e:1::1: Destination host unreachable.
Reply from 2001:db8:e:1::1: Destination host unreachable.
Reply from 2001:db8:e:1::1: Destination host unreachable.
Reply from 2001:db8:e:1::1: Destination host unreachable.`, "The reply comes from REG-R1's LAN address and says host unreachable, not net unreachable: REG-R1 has a route, but its next hop didn't answer Neighbor Discovery.")}
${K.out(`REG-R1#show ipv6 route static
...
S   2001:DB8:E:30::/64 [1/0]
     via FE80::2, GigabitEthernet0/2
REG-R1#show ipv6 neighbors
IPv6 Address                              Age Link-layer Addr State Interface
FE80::2                                     0 -               INCMP Gi0/2
FE80::250:9AFF:FE50:54CF                    0 0050.9a50.54cf  REACH Gi0/0
REG-R1#show cdp neighbors
Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
HR-R2            Gig 0/1           151             R B   ISR4331   Gig 0/1`, `The route sends HR traffic to fe80::2 on Gi0/2; the neighbour entry there is ${K.g("INCMP","Incomplete: the router has sent a Neighbor Solicitation for this address, but no Neighbor Advertisement has come back.")}. CDP shows HR-R2 is on Gi0/1.`)}
<p>The route is installed because G0/2 is up; IOS can't know fe80::2 lives on another link. REG-R1 solicits fe80::2 on G0/2, nobody answers, and it sends the PC ICMPv6 &ldquo;address unreachable&rdquo;.</p>
<p><b>The fix.</b> <code>no ipv6 route 2001:db8:e:30::/64 g0/2 fe80::2</code>, then <code>ipv6 route 2001:db8:e:30::/64 g0/1 fe80::2</code>. <code>show ipv6 route static</code> shows the route via Gi0/1, <code>show ipv6 neighbors</code> lists FE80::2 as REACH on Gi0/1, and from the PC <code>ping</code> replies and <code>tracert</code> shows REG-R1 then HR-R2. Return path checked: HR-R2 has <code>ipv6 route ::/0 g0/1 fe80::1</code>. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;The new route pointed at the right router but out of the wrong port. I've corrected it and HR opens from the regional office now; I've asked the contractor to confirm ports with CDP before adding routes.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Regional office → HR 2001:db8:e:30::25 failing since change 5120. PC: Destination host unreachable from REG-R1. Static 2001:db8:e:30::/64 via g0/2 fe80::2, but HR-R2 is on Gi0/1 (CDP); Neighbor Discovery incomplete on Gi0/2. Replaced with g0/1 fe80::2, saved. Ping/tracert OK from 2 PCs; return route on HR-R2 confirmed. 24 min.&rdquo;</i></p>`)}
${K.case("A managed-service provider renumbers thirty branches",`
<p>A managed-service provider runs IPv6 for a pharmacy chain: thirty branch routers, each with one link to head office. Every branch default used HQ's <b>global</b> address on the link — clear, and easy to read in a traceroute.</p>
<p>Two years later the chain changed ISP, and with it the /48 its addresses came from. During the renumbering weekend, the moment HQ's side of each link took its new address, that branch's default route pointed at an address that no longer existed, and the branch lost IPv6 until someone reached its router and typed a new one. Six trial branches already used <code>ipv6 route ::/0 g0/1 fe80::1</code> with manual link-locals. They never noticed: <code>fe80::1</code> didn't change.</p>
<p><b>Afterwards</b> the standard became: manual link-locals on every router-to-router link (<code>fe80::1</code> HQ side, <code>fe80::2</code> branch side), branch defaults by link-local plus interface, globals kept for monitoring. The trade-off they recorded: the route is tied to an interface name, so moving a WAN link to another port means editing it. Some sites also moved internal links to ${K.g("unique local addresses","ULA: IPv6 addresses from fd00::/8, private to an organisation and never routed on the internet, so they never change when the ISP does (lesson 2).")}, which don't depend on the ISP at all.</p>`)}
${K.myth([
  ["IPv6 needs a new way of choosing routes.","Module 5's logic is unchanged: longest match, then AD for the identical prefix."],
  ["A link-local can't be a next hop because it isn't routable.","It's the normal IPv6 next hop: a next hop only has to be reachable on the link. IOS just needs the interface with it."],
  ["Once you've typed ipv6 route, the router forwards IPv6.","Without ipv6 unicast-routing it doesn't forward IPv6 for others or send Router Advertisements (lesson 3)."],
  ["If IPv4 works between two sites, IPv6 follows the same routes.","Separate tables: every IPv4 static needs an IPv6 twin — the Kano ticket in one sentence."],
  ["Adding ::/0 sets a 'gateway of last resort' you can check.","IPv6 tables have no such line and no asterisk; look for ::/0 itself."],
])}
${K.dodont([
  "Set short manual link-locals (fe80::1, fe80::2) on router-to-router links.",
  "Check the neighbour's interface (<code>show cdp neighbors</code>) before writing a link-local next hop.",
  "After every static, check the route back on the far router.",
  "Prove changes from a user's PC with ping and tracert.",
  "Test floating routes in a change window.",
],[
  "Don't use interface-only IPv6 statics on Ethernet.",
  "Don't compare IPv6 prefixes by eye — expand them.",
  "Don't assume an IPv4 route carries IPv6.",
  "Don't take the router's own ping as proof for users.",
  "Don't forget the far end's floating route back.",
])}
${K.dyk(`<code>show ipv6 interface</code> shows <code>ICMP error messages limited to one every 100 milliseconds</code>: routers ration ICMPv6 errors so a flood can't become an attack — one reason a traceroute through a busy router can show <code>*</code> on a healthy path.`)}
${K.check({q:"Users get 'Reply from 2001:db8:9:1::1: Destination host unreachable.' when they ping a server behind another router. 2001:db8:9:1::1 is their own gateway router. What is the most likely cause?", o:["The gateway router has no route to the server's prefix","The gateway has a route, but its next hop isn't answering Neighbor Discovery — for example a link-local next hop on the wrong interface","The users' PCs have no IPv6 default router","The server has no route back"], a:1, why:"Host unreachable (code 3) means address resolution failed. No route gives 'net unreachable', no default router 'General failure', a missing return route 'Request timed out'."})}
<h3>Same logic, new situation</h3>
<p>A colleague's route <code>ipv6 route 2001:db8:60:5::/64 g0/1</code> (Ethernet to a neighbour router) is in <code>show ipv6 route</code>, yet users get &ldquo;Destination host unreachable&rdquo; from the router. Why?</p>
${K.hint(`With only an interface, which address does the router try to find on that link?`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> why an installed route fails. <b>2. Rule:</b> an interface-only static treats the destination as on-link, so the router Neighbor-Solicits the destination itself; nobody answers → host unreachable. <b>3. Apply:</b> installed (G0/1 is up) but useless on Ethernet. Replace it with the neighbour's global address, or <code>g0/1</code> plus its link-local.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Start from Module 5's rule, then say what's different — don't list commands.`)}
${K.reveal("“How is IPv6 static routing different from IPv4?”",`<p>"The decision is the same: longest prefix match, then administrative distance for the same prefix — a static is AD 1 and can float with a higher distance. The differences are practical: a separate table, so every IPv4 route needs an IPv6 twin; <code>ipv6 unicast-routing</code>; prefix lengths, not masks, with <code>::/0</code> and /128; and link-local next hops, which need the exit interface. I verify with <code>show ipv6 route</code> and ping and traceroute from a user's machine, both ways."</p>`)}
${K.hint(`What is special about the fe80 range, and what does the router need to know before it can send a Neighbor Solicitation?`)}
${K.reveal("“Why does IOS reject ipv6 route ::/0 fe80::1?”",`<p>"A link-local is only unique on its own link. Every interface has an address in fe80::/10, so fe80::1 could be on any of them, and no route for fe80::/10 points at one interface. IOS must know which link to send the Neighbor Solicitation on, so it insists on the interface: <code>ipv6 route ::/0 g0/1 fe80::1</code>. I like link-local defaults because they survive a change of global prefix — I check the interface with CDP first."</p>`)}
${K.hint(`Two things must both be true for a backup to work: when it installs, and what the other end does.`)}
${K.reveal("“You've added a floating IPv6 default for a backup link. How do you know it will actually work?”",`<p>"Three checks. It floats: <code>show ipv6 route static</code> shows only the primary, the backup sits in the config with a higher distance. It can take over: the primary is withdrawn only if its interface goes down or its next hop stops resolving, so an upstream failure won't trigger it. The return path: the far end needs its own floating route back. Then I test in a change window — primary down, backup installs at both ends, tracert from a user PC, primary back."</p>`)}

${K.recap([
  "IPv6 uses Module 5's rules: longest match per packet, AD for the identical prefix. Expand addresses before comparing.",
  "IPv6 has its own table (show ipv6 route) and needs ipv6 unicast-routing; IPv4 routes do nothing for IPv6.",
  "ipv6 route prefix/length + global next hop, exit interface, interface + link-local, or interface + global, optionally + distance.",
  "A link-local next hop needs the exit interface — fe80::/10 is on every link — or IOS says '% Interface has to be specified for a link-local nexthop'.",
  "/64 = one LAN, /48 or /56 = a site, /128 = one host, ::/0 = default (no gateway-of-last-resort line).",
  "Interface-only statics fail on Ethernet: the router Neighbor-Solicits the destination itself.",
  "Routing is one-way. Net unreachable = no route; host unreachable = Neighbor Discovery failed; timeout = often the return path.",
  "A floating static (same prefix, higher AD) installs only when the primary's interface goes down or its next hop stops resolving; the far end needs its own.",
])}
${K.next(`<b>Lesson 6 — Troubleshooting IPv6 and dual stack.</b> A structured method for dual-stack faults, the Module 6 challenge — a pre-broken network with several IPv6 faults — and a portfolio project.`)}
`,
quiz:[
  {lvl:1, q:"Which command lists a Cisco router's IPv6 routes?", o:["show ip route ipv6","show ipv6 route","show route ipv6","show ipv6 interface brief"], a:1, why:"IPv6 has its own routing table, shown by show ipv6 route (with filters such as static and connected). show ip route lists only IPv4; show ipv6 interface brief lists interface addresses, not routes."},
  {lvl:1, type:"fill", q:"Write the IPv6 default static route that sends everything to the next hop 2001:db8:acad:9::1.", fields:[{label:"Command", a:["ipv6 route ::/0 2001:db8:acad:9::1","ipv6 route ::/0 2001:db8:acad:9:0:0:0:1","ipv6 route ::/0 2001:0db8:acad:0009::1","ipv6 route ::/0 2001:0db8:acad:0009:0000:0000:0000:0001","ipv6 route 0::/0 2001:db8:acad:9::1","ipv6 route ::0/0 2001:db8:acad:9::1"]}], why:"The IPv6 default route is ::/0 — zero bits compared, so it matches every address. The next hop can be written compressed or in full and in either case."},
  {lvl:2, q:"Based on the exhibit, which path does the router use for a packet to 2001:db8:c3:2a::7?", ex:"R1#show ipv6 route static\nIPv6 Routing Table - default - 12 entries\nCodes: C - Connected, L - Local, S - Static\nS   ::/0 [1/0]\n     via FE80::9, GigabitEthernet0/0\nS   2001:DB8:C3::/48 [1/0]\n     via FE80::1, GigabitEthernet0/1\nS   2001:DB8:C3:20::/60 [1/0]\n     via 2001:DB8:FF:1::2\nS   2001:DB8:C3:2B::/64 [1/0]\n     via FE80::3, GigabitEthernet0/2", o:["FE80::3 out of G0/2 — 2B is the closest match","2001:DB8:FF:1::2 — the /60 is the longest prefix that contains the address","FE80::1 out of G0/1 — the /48 contains it","FE80::9 out of G0/0 — no route matches exactly"], a:1, why:"Expand the fourth hextet: 002a. The /64 needs 002b, so it doesn't contain the address. The /60 fixes the first 15 hex digits (2001:0db8:00c3:002), covering 0020 to 002f — 002a is inside. The /60 is longer than the /48 and the /0, so it wins."},
  {lvl:1, q:"Why does IOS reply '% Interface has to be specified for a link-local nexthop' to ipv6 route ::/0 fe80::1?", o:["Link-local addresses can never be used as next hops","Every interface has addresses in fe80::/10, so the router can't tell which link fe80::1 is on without being told","The default route must use a global next hop","fe80::1 is reserved for the router itself"], a:1, why:"Link-locals are unique only on their own link and there's no route for fe80::/10 pointing at one interface. Naming the exit interface tells the router where to send the Neighbor Solicitation: ipv6 route ::/0 g0/1 fe80::1."},
  {lvl:2, type:"multi", q:"Which two commands correctly create a default route via the neighbour whose link-local address is fe80::1 on G0/1? (Choose two.)", o:["ipv6 route ::/0 GigabitEthernet0/1 fe80::1","ipv6 route ::/0 fe80::1","ipv6 route ::/0 fe80::1 GigabitEthernet0/1","ipv6 route ::/0 g0/1 fe80::1 200","ipv6 route 0.0.0.0 0.0.0.0 fe80::1"], a:[0,3], why:"The interface comes first, then the link-local address, optionally followed by a distance (the fourth is valid — a floating default). Without the interface IOS refuses; the interface can't follow the address; and ipv6 route never takes an IPv4 mask."},
  {lvl:2, type:"order", q:"R1 has S 2001:db8:a1:20::/64 via 2001:db8:a1:ff::2 and C 2001:db8:a1:ff::/64 on G0/1. Put the steps for forwarding a packet to 2001:db8:a1:20::15 in order.", items:["Look up 2001:db8:a1:20::15: the static /64 matches, via 2001:db8:a1:ff::2","Look up the next hop 2001:db8:a1:ff::2: the connected /64 on G0/1 matches","Send a Neighbor Solicitation for 2001:db8:a1:ff::2 out of G0/1 (if not already in the neighbour table)","Receive the Neighbor Advertisement with the neighbour's MAC address","Forward the packet out of G0/1 in a frame to that MAC"], why:"A next-hop-only static needs a recursive lookup to find the exit interface; then Neighbor Discovery (instead of ARP) resolves the next hop's MAC, cached for later packets."},
  {lvl:1, type:"match", q:"Match each IPv6 route with what it is.", pairs:[["::/0","Default route — matches every address"],["2001:db8:a::25/128","Host route — exactly one address"],["2001:db8:a:10::/64","Network route for one LAN"],["2001:db8:a::/48","Summary covering a whole site"],["FF00::/8 via Null0","Multicast range the router never unicast-forwards"]], why:"Prefix length decides coverage: /0 everything, /48 a site (65,536 /64s), /64 one LAN, /128 one address. IOS always lists L FF00::/8 via Null0, receive: multicast is handled locally, not routed as unicast."},
  {lvl:2, q:"A user's ping shows 'Reply from 2001:db8:9:40::1: Destination net unreachable.' 2001:db8:9:40::1 is the branch router's LAN address. What does it tell you?", ex:"C:\\>ping 2001:db8:9:1::80\n\nPinging 2001:db8:9:1::80 with 32 bytes of data:\nReply from 2001:db8:9:40::1: Destination net unreachable.\nReply from 2001:db8:9:40::1: Destination net unreachable.\nReply from 2001:db8:9:40::1: Destination net unreachable.\nReply from 2001:db8:9:40::1: Destination net unreachable.", o:["The server is switched off","The branch router has no IPv6 route that contains 2001:db8:9:1::80","The branch router's next hop isn't answering Neighbor Discovery","The PC has no IPv6 default router"], a:1, why:"Net unreachable (ICMPv6 code 0) means the router named in the reply has no route. A failed Neighbor Discovery gives host unreachable; no default router on the PC gives General failure. Check show ipv6 route on the branch router — perhaps it has an IPv4 default but no IPv6 one."},
  {lvl:3, q:"Based on the exhibit, users complain that uploads to the data centre are slow although the primary fibre (G0/1, next hop 2001:DB8:77:F1::2) is healthy. What is the best fix?", ex:"EDGE#show ipv6 route static\nIPv6 Routing Table - default - 9 entries\nCodes: C - Connected, L - Local, S - Static\nS   ::/0 [1/0]\n     via 2001:DB8:77:F1::2\n     via 2001:DB8:77:F2::2\nEDGE#show running-config | include ipv6 route\nipv6 route ::/0 2001:DB8:77:F1::2\nipv6 route ::/0 2001:DB8:77:F2::2", o:["Remove the backup route — two defaults aren't allowed","Remove ipv6 route ::/0 2001:db8:77:f2::2 and add it again with a distance such as 200, so it floats behind the fibre","Lower the fibre route's distance to 0","Change the backup to ipv6 route ::0/1 2001:db8:77:f2::2 so it's less specific"], a:1, why:"Both defaults have AD 1, so both are installed and flows are shared with the slow backup. A higher distance on the backup leaves only the fibre installed until it fails. A static's distance can't be 0 (that's connected), and changing the prefix would change which addresses the route covers."},
  {lvl:3, q:"Kano PCs ping an HQ server over IPv6 and get 'Request timed out.' From the server, pinging a Kano PC gives 'Reply from 2001:db8:5:1::1: Destination net unreachable.' (2001:db8:5:1::1 is the HQ router's LAN address). The Kano router itself can ping the server. What do you change?", o:["Add a default route on the Kano router","Add (or fix) a route on the HQ router for the Kano LAN's /64","Give the server a link-local gateway","Enable ipv6 unicast-routing on the Kano router"], a:1, why:"The HQ router names itself as having no route to the Kano PC: the return path is missing there. The Kano router's own ping passes because it is sourced from its transit address, which HQ knows as connected. Requests clearly get through, so Kano's default route is fine."},
  {lvl:2, q:"An edge router has a primary ::/0 static via the ISP and a floating ::/0 with distance 200 via LTE. The ISP's router stays up but loses its own upstream connection. What happens?", o:["The floating route installs automatically","Nothing: the primary's interface is up and its next hop still resolves, so the primary stays installed","Both routes are installed and shared","The router reloads its routing table"], a:1, why:"A static is withdrawn only when its exit interface goes down or its next hop stops resolving. A failure beyond the directly connected neighbour is invisible to it, so the backup never takes over without extra path-testing tools."},
  {lvl:3, type:"multi", q:"Based on the exhibit, staff can't reach 2001:db8:e:30::25 and see 'Destination host unreachable' from REG-R1. Which two statements are true? (Choose two.)", ex:"REG-R1#show ipv6 route static\nS   2001:DB8:E:30::/64 [1/0]\n     via FE80::2, GigabitEthernet0/2\nREG-R1#show ipv6 neighbors\nIPv6 Address                              Age Link-layer Addr State Interface\nFE80::2                                     0 -               INCMP Gi0/2\nREG-R1#show cdp neighbors\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nHR-R2            Gig 0/1           151             R B   ISR4331   Gig 0/1", o:["The route is installed but points out of the wrong interface: HR-R2 is on Gi0/1","REG-R1 has no route to 2001:db8:e:30::/64","Re-entering the route as ipv6 route 2001:db8:e:30::/64 g0/1 fe80::2 (after removing the old one) fixes it","The fix is to change the next hop to fe80::/10","HR-R2 must be given a global address before it can be a next hop"], a:[0,2], why:"The S route exists, so the problem isn't a missing route. Neighbor Discovery for fe80::2 on Gi0/2 never completes (INCMP), and CDP shows HR-R2 on Gi0/1. Link-local next hops are fine — they just need the right interface."},
  {lvl:1, type:"fill", q:"Read this IPv6 route: S 2001:DB8:5:40::/64 [1/0] via 2001:DB8:5:12::2. Fill in the values.", fields:[{label:"Administrative distance", a:["1"]},{label:"Prefix length", a:["64","/64"]},{label:"Next hop", a:["2001:db8:5:12::2","2001:0db8:0005:0012::2","2001:db8:5:12:0:0:0:2","2001:0db8:0005:0012:0000:0000:0000:0002"]}], why:"[1/0] is AD 1 (static) and metric 0; /64 is the prefix length; the via line gives a global next hop, with no interface printed because IOS finds it by recursive lookup."},
  {lvl:3, q:"An MSP manages 40 branches whose IPv6 addresses come from the ISP's /48, which may change if the customer switches ISP. Which branch default-route design keeps working through a renumbering?", o:["ipv6 route ::/0 <HQ's global address on the link>","ipv6 route ::/0 <exit interface> with no next hop","ipv6 route ::/0 <exit interface> fe80::1, with fe80::1 set manually on HQ's side of each link","No default route — rely on the IPv4 default"], a:2, why:"A manual link-local doesn't change when the global prefix does, so the route keeps resolving. A global next hop changes with the renumbering and the route is withdrawn; an interface-only route fails on Ethernet; and IPv4 routes don't carry IPv6."},
  {lvl:2, q:"A router has ipv6 route 2001:db8:7:20::/64 g0/1, where G0/1 is Ethernet towards another router. A PC pings 2001:db8:7:20::5. What happens?", o:["The router forwards to the neighbour on G0/1 as normal","The router sends a Neighbor Solicitation for 2001:db8:7:20::5 itself out of G0/1; nobody answers, so the PC gets 'Destination host unreachable'","IOS rejects the route without a next hop","The packet follows the default route instead"], a:1, why:"With only an interface, the router treats the destination as on-link and tries to resolve it directly. Routers don't answer solicitations for other devices' addresses by default, so address resolution fails. On Ethernet, give a next hop."},
],
cards:[
  {f:"IPv6 routing decision", b:"Same as IPv4: longest matching prefix wins per packet; for the identical prefix from different sources, the lowest AD wins (connected 0, static 1)."},
  {f:"show ipv6 route", b:"The IPv6 table (separate from IPv4). Two lines per route: code, prefix/length, [AD/metric], then indented via line(s). Filters: static, connected."},
  {f:"ipv6 unicast-routing", b:"Needed for a router to forward IPv6 for others and to send Router Advertisements. Static routes can be typed without it, but nothing is forwarded."},
  {f:"The four ipv6 route forms", b:"prefix/len + global next hop; + exit interface only; + interface and link-local next hop; + interface and global next hop (fully specified). Optional distance at the end."},
  {f:"% Interface has to be specified for a link-local nexthop", b:"IOS's reply to a link-local next hop without an interface. fe80::/10 is on every link, so the router must be told which one: ipv6 route ::/0 g0/1 fe80::1."},
  {f:"Why use link-local next hops", b:"They survive a change of global prefix, they are what RAs and IPv6 routing protocols use, and manual ones (fe80::1, fe80::2) are short. Check the neighbour's interface first."},
  {f:"::/0, /128, /64, /48", b:"::/0 = default (matches everything, loses to everything). /128 = host route. /64 = one LAN. /48 = a site (65,536 /64s). IPv6 has no gateway-of-last-resort line."},
  {f:"Exit-interface-only static on Ethernet", b:"The router treats the destination as on-link and Neighbor-Solicits it directly; nobody answers, so it fails (host unreachable). Fine on point-to-point links."},
  {f:"When IOS installs an IPv6 static", b:"Interface forms: while the interface is up. Global next hop: while the next hop resolves (recursive lookup — by default not through ::/0). Otherwise it stays in the config but leaves the table."},
  {f:"Floating IPv6 static", b:"Same prefix, higher AD (e.g. ipv6 route ::/0 2001:db8:fe:b::1 200). Hidden until the primary is withdrawn; steps aside when it returns. The far end needs its own floating route back."},
  {f:"Windows IPv6 ping messages", b:"Destination net unreachable = that router has no route (code 0). Destination host unreachable = Neighbor Discovery failed (code 3). Request timed out = often no return route. General failure = no IPv6 default router."},
  {f:"IPv6 return path", b:"Every router on the way back needs a route to the source's /64. A router's own ping (sourced from its transit address) can pass while users fail — test from a user's PC."},
  {f:"L FF00::/8 via Null0, receive", b:"Always in show ipv6 route: the multicast range is handled by the router itself and never forwarded as unicast. Null0 is IOS's discard interface."},
],
});

L.push({
id:"ipv6-verify", mins:105, level:"Beginner+ · builds on Module 6 lessons 1–5",
t:"Troubleshooting IPv6 and dual stack — and the Module 6 challenge",
html:`
${K.goals([
  "Work any IPv6 or dual-stack ticket with one method: which stack failed, the host first, then the first hop, then each router — there <i>and</i> back.",
  "Read <code>ipconfig</code>, IPv6 ping and <code>tracert -6</code> results, <code>show ipv6 interface</code>, <code>show ipv6 route</code> and <code>show ipv6 neighbors</code> as evidence.",
  "Recognise seven IPv6 fingerprints, from a missing <code>ipv6 unicast-routing</code> to a missing return route.",
  "Find and fix six faults on a dual-stack three-site network in the Module 6 challenge, and document a dual-stack portfolio project.",
])}
${K.pre(["Module 6 lessons 1–5: IPv6 addresses and types, router configuration (<code>ipv6 unicast-routing</code>, EUI-64, link-local), Neighbor Discovery and SLAAC, IPv6 static routes.","Module 5 lesson 8: the routing troubleshooting method — find where the packet stops, both ways.","Module 3: hex — you'll compare addresses hextet by hextet."])}

<h2>Why this matters at work</h2>
<p>Tuesday, 08:30, at a managed-service provider in Ikeja, Lagos. A customer's ISP switched IPv6 on last month, and the queue now has a new kind of ticket: &ldquo;the Kano laptops have an IPv6 address but can't open the HQ portal over IPv6&rdquo;; &ldquo;the stock app takes twenty seconds to open, then works&rdquo;; &ldquo;the CCTV recorder can't upload — but IPv4 ping to HQ is fine&rdquo;.</p>
<p>These networks run <b>dual stack</b>: IPv4 and IPv6 side by side on the same cables. That doubles what can go wrong and hides half of it: when IPv6 breaks, applications quietly fall back to IPv4 and users report &ldquo;slow&rdquo;, not &ldquo;down&rdquo;.</p>

<h2>Dual stack: two networks on one cable — which one did the host use?</h2>
${K.remember(`<p><b>The dual-stack rule:</b> dual stack (lesson 1) is two separate networks sharing cables and boxes. Each has its own addresses, its own way of finding the gateway (ARP for IPv4, Neighbor Discovery (ND) for IPv6), its own routing table and its own filters. <b>IPv4 working proves the cables and switches — and nothing about IPv6.</b></p>`)}
<p>Nothing is shared above Layer 2: a router keeps separate tables (<code>show ip route</code>, <code>show ipv6 route</code>), an IPv4 static carries no IPv6, and IPv4 routing says nothing about <code>ipv6 unicast-routing</code>. A PC's IPv6 gateway is normally the router's link-local address, heard in a Router Advertisement (lesson 4).</p>
${K.analogy(`<p>Two bus companies share the road from Lagos to Kano, each with its own timetable and depots. If one drops its Kano route, the other's buses still run, and passengers who can take either barely notice. That's how a broken IPv6 path hides behind a working IPv4 one.</p>`)}
${K.svg("0 0 760 300",
  K.box(20,16,330,50,"IPv4 stack on the laptop","10.30.50.24/24 · gateway 10.30.50.1 · ARP")+
  K.box(410,16,330,50,"IPv4 on the router","its own table: show ip route")+
  K.dev("laptop",70,150,"KANO LAPTOP","dual stack")+K.dev("switch",250,150,"KN-SW","Layer 2: shared")+K.dev("router",440,150,"KN-R1","gateway for both")+K.dev("cloud",640,150,"WAN","to HQ")+
  K.link(92,152,224,152)+K.link(276,152,416,152)+K.link(464,152,616,152)+
  K.box(20,232,330,50,"IPv6 stack on the laptop","2001:db8:4b:50::/64 (SLAAC) · gateway fe80::1 · NDP",true)+
  K.box(410,232,330,50,"IPv6 on the router","needs ipv6 unicast-routing · show ipv6 route",true)+
  K.txt(380,105,"same cables, same switch — two separate networks above Layer 2",{mid:true,f:"body",s:11.5,c:"fg"}),
  "Dual stack. Cable and switch are shared; addresses, gateways, neighbour discovery and routing tables are not. A fault in one stack leaves the other untouched.")}
<h3>Which address does the host use?</h3>
<p>A name can resolve, through ${K.g("DNS","Domain Name System: turns names such as portal.example.com into addresses. An A record holds an IPv4 address, an AAAA (&lsquo;quad-A&rsquo;) record an IPv6 address.")}, to an <b>A</b> record (IPv4) and an <b>AAAA</b> record (IPv6). Which one the host tries follows simple logic:</p>
<ul>
<li><b>It prefers IPv6 when it has a global IPv6 address and an IPv6 gateway</b> (the default address-selection rules of RFC 6724, used by Windows, macOS and Linux: their policy table ranks IPv6 above IPv4).</li>
<li><b>With only a link-local address it uses IPv4</b> for anything off its link — a link-local source can never leave the link. A PC that has lost its IPv6 address often looks perfectly healthy.</li>
<li><b>Browsers race the two</b> (Happy Eyeballs, lesson 1: IPv6 gets a head start of about 250 ms, RFC 8305) and use whichever connects first; simpler programs may wait for IPv6 to time out before trying IPv4 — the &ldquo;twenty seconds, then it works&rdquo; ticket.</li>
</ul>
<p>So the first question on any dual-stack ticket is <b>&ldquo;IPv4, IPv6 or both?&rdquo;</b>, and the PC answers it: <code>ping</code> by name shows the address it chose in brackets; <code>ping -4</code> and <code>ping -6</code> (and <code>tracert -4</code> / <code>tracert -6</code>) force one stack.</p>
${K.out(`C:\\Users\\amina>ping portal.example.com

Pinging portal.example.com [2001:db8:4b:10::443] with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.

C:\\Users\\amina>ping -4 portal.example.com

Pinging portal.example.com [10.30.10.43] with 32 bytes of data:
Reply from 10.30.10.43: bytes=32 time=18ms TTL=125
Reply from 10.30.10.43: bytes=32 time=18ms TTL=125`, "A Kano laptop (trimmed): Windows picks IPv6 because it has a global address and a gateway; IPv6 fails, IPv4 works. IPv6 replies show no TTL.")}
<div class="tablewrap"><table>
<tr><th>From the user's PC</th><th>What it means</th></tr>
<tr><td><code>ping -4</code> works, <code>ping -6</code> fails</td><td>An IPv6-only fault: work the IPv6 method below, starting with <code>ipconfig</code></td></tr>
<tr><td>Both fail</td><td>Something shared: the PC's link, switch port or VLAN, the name, the server (Modules 4–5)</td></tr>
<tr><td>Both ping, the app fails on one stack</td><td>A filter or the application (e.g. a server listening on IPv4 only)</td></tr>
<tr><td>No IPv6 address, &ldquo;everything works&rdquo;</td><td>Quietly using IPv4 — still a fault</td></tr>
</table></div>
${K.case("The bank whose IPv6 worked for ping but not for files",`
<p>An Abuja bank enabled IPv6 to its data centre. Pings and small pages worked; large statement downloads from two branches hung at 0%. The firewall team had copied its IPv4 habit — block ICMP except echo. But ICMPv6 (lesson 4) isn't optional: Neighbor Discovery runs on it, and IPv6 routers never fragment — when a packet is too big for the next link, the router drops it and sends <b>Packet Too Big</b> so the sender can shrink its packets. Those branches sat behind a link with a smaller ${K.g("MTU","Maximum Transmission Unit: the largest packet a link can carry, normally 1500 bytes on Ethernet; tunnels and some WAN links carry less.")}, so big packets vanished while small pings got through. The fix: permit the ICMPv6 types IPv6 needs (RFC 4890 lists them).</p>
<p>The change template now says <b>&ldquo;IPv6 policy reviewed for ICMPv6 — not copied from IPv4.&rdquo;</b></p>`)}
${K.check({q:"Since the ISP enabled IPv6, branch staff say the intranet 'feels slow'. From a branch PC, ping -4 intranet replies in 15 ms and ping -6 intranet times out. What does this tell you?", o:["The intranet server is down","The IPv6 path is broken while IPv4 works; browsers try IPv6, give up and fall back to IPv4 — which feels slow","The branch switch is faulty, because both stacks share it","DNS is broken, because the name has two addresses"], a:1, why:"The IPv4 reply proves the cables, switch and server. The PC has an IPv6 address, so it tries the AAAA first; when IPv6 fails, the browser falls back after a delay. Work the IPv6 method — don't disable IPv6."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A laptop's ipconfig shows Link-local IPv6 Address fe80::5d2:4e1a:93b0:12c7%9 and IPv4 Address 10.8.4.22 — no other IPv6 line. The user runs ping files.example.com, which has both an A and an AAAA record. Which address family will the ping use: IPv4 or IPv6?", fields:[{label:"Address family", a:["IPv4","ipv4","v4","IP version 4"]}], why:"1. What is asked? Which stack the host picks. 2. Which rule? A host prefers IPv6 only with a global IPv6 address and an IPv6 gateway; a link-local source can't leave the link. 3. Apply it: this laptop has only fe80::, so it uses the A record and pings over IPv4 — the missing IPv6 address is invisible to the user."})}

<h2>The IPv6 troubleshooting method: host first, then hop by hop — both ways</h2>
${K.remember(`<p><b>The rule:</b> an IPv6 host decides on-link versus off-link from the prefix it has (learned from a Router Advertisement, or typed in); everything off-link goes to its default router — the link-local it heard in the RA, or the one you typed. From there it's the Module 5 rule with a second table: <b>every router on the way needs a route to the destination, and every router on the way back a route to the source.</b></p>`)}
<p>Start at the <b>host</b>: its address, its gateway, even whether it uses IPv6 at all depend on what it heard from the router, so its <code>ipconfig</code> tells you whether the router did its part.</p>
${K.svg("0 0 720 330",
  [["1 · Scope it","which stack? who? what changed?","ping -4 name · ping -6 name","you know which stack failed"],
   ["2 · The host first","ipconfig","IPv6 Address? Link-local? Default Gateway fe80::…%N?","a global address in the right /64 + a gateway"],
   ["3 · The first hop","ping the gateway's link-local","ping fe80::1%4 · then its global address","replies"],
   ["4 · Trace it","tracert -6 · IOS traceroute","last hop that answered · 'reports' lines · stars","the router to log in to"],
   ["5 · Read the router","where the path stops","show ipv6 interface brief · show ipv6 route · show ipv6 neighbors","up, a /64, the route installed, the neighbour reachable"],
   ["6 · The way back","on every router back to the user","show ipv6 route — look for the SOURCE prefix","a route home on each one"]]
  .map((r,i)=>{ const y = 8+i*53; return K.box(16,y,206,42,r[0],r[1],i===1)+K.txt(240,y+17,r[2],{c:"fg",s:11.5})+K.txt(240,y+34,"good: "+r[3],{c:"ok",s:10.5,f:"body"})+(i<5?K.arrow(119,y+42,119,y+53):""); }).join(""),
  "The IPv6 troubleshooting method. Steps 1–3 happen on the user's PC; 4–6 find the router where the packet stops and why. Stop at the first answer that isn't 'good', fix it, and re-test from the user's PC.")}
${K.remember(`<p><b>&ldquo;Some Hosts Fail To Route Back&rdquo;</b> — <b>S</b>cope (which stack?), <b>H</b>ost (<code>ipconfig</code>), <b>F</b>irst hop (ping the gateway's link-local), <b>T</b>race (<code>tracert -6</code>), <b>R</b>outer tables, <b>B</b>ack (the return path).</p>`)}
<h3>Step 2: the host's ipconfig — three lines decide where you look</h3>
${K.out(`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   IPv6 Address. . . . . . . . . . . : 2001:db8:4b:50:9d3e:61f2:c48a:2b17
   Temporary IPv6 Address. . . . . . : 2001:db8:4b:50:4e15:a0c9:7d32:e861
   Link-local IPv6 Address . . . . . : fe80::9d3e:61f2:c48a:2b17%7
   IPv4 Address. . . . . . . . . . . : 10.30.50.24
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : fe80::1%7
                                       10.30.50.1`, "Healthy SLAAC on a real Windows 11 laptop: a global address in the branch's /64, a temporary (privacy) address for outgoing connections, and the router's link-local as IPv6 gateway, above the IPv4 one.")}
<ul>
<li><b>IPv6 Address</b> — a global address inside the right /64? Expand both and compare the first four hextets. Real Windows makes the last 64 bits random, so you rarely see EUI-64's <code>ff:fe</code>.</li>
<li><b>Link-local IPv6 Address … %7</b> — always present, RA or not. <code>%7</code> is the zone index (lesson 4): which interface the link-local belongs to — a number that differs from PC to PC.</li>
<li><b>Default Gateway fe80::1%7</b> — the router's link-local from its RA (or typed, on a static host).</li>
</ul>
${K.out(`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::9d3e:61f2:c48a:2b17%7
   IPv4 Address. . . . . . . . . . . : 10.30.50.24
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.30.50.1`, "Link-local only, and no IPv6 gateway: no Router Advertisement reached this PC at all. Look at the ROUTER — on Cisco, first: is ipv6 unicast-routing on?")}
<p>The other link-local-only picture: <code>Default Gateway</code> lists <code>fe80::1%7</code>, but there's still no <code>IPv6 Address</code> line. An RA arrived, without a prefix SLAAC can use — real IOS still advertises from a LAN with only <code>ipv6 enable</code> (no prefix) or with a /56 or /120 (a prefix hosts won't use), so read that LAN interface's address and prefix length. Either way the PC has no global address: nothing over IPv6 beyond its link, and names quietly go over IPv4.</p>
<h3>Step 3: ping the first hop by its link-local address</h3>
<p><code>ping fe80::1%7</code>, with the zone index from <code>ipconfig</code> — every interface owns fe80::/10, so without it the PC can't know which link to use. On IOS, <code>ping fe80::2</code> answers with an <code>Output Interface:</code> prompt instead. A reply proves the link, Neighbor Discovery both ways and the router's IPv6 — no routing involved. Then ping the gateway's global address.</p>
<div class="tablewrap"><table>
<tr><th>Windows IPv6 ping says</th><th>What happened</th><th>Look at</th></tr>
<tr><td><code>PING: transmit failed. General failure.</code></td><td>The PC has no IPv6 route for it — typically no global address or gateway</td><td><code>ipconfig</code>, then the router's RA</td></tr>
<tr><td><code>Reply from &lt;own address&gt;: Destination host unreachable.</code></td><td>Neighbor Discovery for the next hop got no answer</td><td>The PC's gateway setting; the router's interface</td></tr>
<tr><td><code>Reply from &lt;router&gt;: Destination net unreachable.</code></td><td>That router has no route (ICMPv6 Destination Unreachable, code 0)</td><td><code>show ipv6 route</code> there</td></tr>
<tr><td><code>Reply from &lt;router&gt;: Destination host unreachable.</code></td><td>The last router couldn't find the host by ND (code 3)</td><td>The destination host</td></tr>
<tr><td><code>Request timed out.</code></td><td>Silence: no return route, a router not routing IPv6, or a filter</td><td>The way back, then <code>ipv6 unicast-routing</code> on transit routers</td></tr>
</table></div>
<h3>Steps 4–6: trace it, read the router, check the way back</h3>
<p><code>tracert -6</code> lists each router by its arrival interface. A <code>reports: Destination … unreachable</code> line names a router with no route; endless stars start at a router that can't reply — often one with no route back to you. Log in there:</p>
${K.out(`KN-R1#show ipv6 interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:4B:50::1, subnet is 2001:DB8:4B:50::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  MTU is 1500 bytes
  ...
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.`, "What matters for SLAAC: the prefix length, FF02::2 (the all-routers group) and the RA lines.")}
<ul>
<li><b>subnet is …/64</b> — the prefix the RA advertises. SLAAC needs exactly /64: the host's interface ID is 64 bits, and prefix + interface ID must make 128.</li>
<li><b>FF02::2</b> and <b>ND router advertisements are sent every 200 seconds</b> — present only with <code>ipv6 unicast-routing</code>. Without it the router acts as an IPv6 <i>host</i>.</li>
<li><b>Hosts use stateless autoconfig for addresses.</b> — IOS prints it whatever the prefix length, so it doesn't prove SLAAC can work.</li>
</ul>
<p><code>show ipv6 interface brief</code> condenses this to status, link-local and globals per interface. <code>show ipv6 route</code> reads like <code>show ip route</code> (<code>C</code>, <code>L</code> for the router's own /128, <code>S</code>); a static whose next hop can't be found is simply absent (lesson 5). <code>show ipv6 neighbors</code> is IPv6's ARP table: address, MAC, state (<code>REACH</code>, <code>STALE</code>; on real IOS <code>INCMP</code> means nobody answered), interface.</p>
<h3>A worked example: the Kano ticket</h3>
<p>Kano's laptops (2001:db8:4b:50::/64, gateway KN-R1) can't open the HQ portal, 2001:db8:4b:10::443, over IPv6. KN-R1 reaches HQ-CORE over the WAN link 2001:db8:4b:ff05::/64.</p>
${K.steps([
  ["Scope","Only Kano, only IPv6 (<code>ping -4</code> works, <code>ping -6</code> times out); HQ's IPv6 statics were added that week."],
  ["Host and first hop","<code>ipconfig</code>: an address in the /64, gateway <code>fe80::1%7</code>, which answers a ping."],
  ["Trace it","<code>tracert -6</code>: hop 1 is 2001:db8:4b:50::1, then stars for ever. Silence, not &ldquo;unreachable&rdquo;: suspect the way back from hop 2."],
  ["Read KN-R1","<code>S ::/0</code> towards HQ-CORE — fine. Its own <code>ping 2001:db8:4b:10::443</code> even works: its source is the WAN address, connected on HQ-CORE."],
  ["The way back, with the right source","<code>ping 2001:db8:4b:10::443 source g0/0</code> (from 2001:db8:4b:50::1) fails. On HQ-CORE, <code>show ipv6 route static</code> lists Abuja and Enugu — no 2001:db8:4b:50::/64."],
  ["Fix and prove","On HQ-CORE: <code>ipv6 route 2001:db8:4b:50::/64 2001:db8:4b:ff05::2</code>. From a Kano laptop: <code>ping -6</code> replies, <code>tracert -6</code> completes."],
])}
${K.out(`C:\\Users\\amina>tracert -6 portal.example.com

Tracing route to portal.example.com [2001:db8:4b:10::443]
over a maximum of 30 hops:

  1     1 ms    <1 ms    <1 ms  2001:db8:4b:50::1
  2     *        *        *     Request timed out.
  3     *        *        *     Request timed out.

KN-R1#ping 2001:db8:4b:10::443 source g0/0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 2001:DB8:4B:10::443, timeout is 2 seconds:
Packet sent with a source address of 2001:DB8:4B:50::1
.....
Success rate is 0 percent (0/5)`, "Before the fix, on real kit: HQ-CORE gets every probe but can't reply to Kano's /64, so it stays silent; the router's ping sourced from its LAN address proves it.")}
${K.mistake(`Testing from the router and closing the ticket. KN-R1's plain ping works because HQ knows its WAN address. Test from a PC in the users' /64, or with <code>ping … source &lt;LAN interface&gt;</code>, which sends from the users' /64 and so tests their way back.`)}
${K.when([
  ["ping -4 / ping -6 by name","Which stack is broken?","Forces one stack; brackets show the address chosen","You already know it's IPv6"],
  ["ipconfig","Did the host get an address and a gateway?","Shows SLAAC's result","The host is static — open its IPv6 settings"],
  ["tracert -6","Where does the path stop?","Names the last router that answered","A firewall drops probes"],
  ["show ipv6 interface / route / neighbors","Is the router advertising? Does it know the way? Did ND work?","Prefix length, FF02::2, routes, ND entries","The fault is on the host"],
], "Which tool answers which IPv6 question")}
${K.exam(`How to read an IPv6 question: <b>1. Expand before you compare</b> — 2001:db8:4b:5::/64 and 2001:db8:4b:50::/64 differ (0005 vs 0050). <b>2. Find the prefix length</b> on every address and route: a LAN that isn't /64 can't do SLAAC. <b>3. Spot link-local next hops</b>: a route via fe80:: must name an exit interface. <b>4. Ask whose output it is</b> — host or router, and which direction. Trap: &ldquo;net unreachable&rdquo; from a router and &ldquo;host unreachable&rdquo; from your own address point at different devices.`)}
${K.check({q:"A PC has a global address in 2001:db8:61:20::/64 and Default Gateway fe80::1%5. ping fe80::1%5 replies; ping -6 to an HQ server gives 'Reply from 2001:db8:61:20::1: Destination net unreachable.' Where do you look next?", o:["The PC's IPv6 settings","The gateway router's show ipv6 route — it has no route to the server's prefix","The HQ server's gateway","The switch port's VLAN"], a:1, why:"Host and first hop are proven. The error comes from the gateway itself, saying it has no route forward. Read its IPv6 table for the server's prefix."})}
<h3>Same logic, new situation</h3>
<p>Port Harcourt: PCs on 2001:db8:9e:30::/64 ping their gateway PH-R2 (link-local and 2001:db8:9e:30::1), but <code>ping -6</code> beyond gives <code>Request timed out.</code> PH-R2's next hop, PH-R1, has IPv6 addresses and routes but no <code>ipv6 unicast-routing</code> line.</p>
${K.hint(`What does a router without <code>ipv6 unicast-routing</code> do with an IPv6 packet that isn't addressed to itself? Does it send an error back?`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Why pings beyond the gateway time out. <b>2. Which rule?</b> Every router on the path must forward IPv6, and <code>ipv6 unicast-routing</code> is what makes a Cisco router do it; without it the router acts as a host and drops transit packets, usually without a word. <b>3. Apply it.</b> PH-R1 silently drops them: timed out, not unreachable. Fix: <code>ipv6 unicast-routing</code> on PH-R1 (its own LANs had no RAs either).</p>`)}

<h2>Fingerprints: seven IPv6 faults and the line that gives each away</h2>
<p>Each fault answers one question: <i>why didn't the host get an address?</i>, <i>why can't it reach its gateway?</i>, or <i>why is a route missing or wrong?</i></p>
<div class="tablewrap"><table>
<tr><th>Fault</th><th>Users see</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td><b>No <code>ipv6 unicast-routing</code></b></td><td>LAN PCs link-local only, no IPv6 gateway; transit traffic dies silently</td><td>No such line in <code>show running-config | include ipv6</code>; no FF02::2, no RA lines</td><td>Add it</td></tr>
<tr><td><b>LAN prefix isn't /64</b></td><td>Link-local only on that LAN (the fe80:: gateway is still listed)</td><td><code>subnet is …/56</code> (or /120, /48)</td><td>Remove, re-add as /64</td></tr>
<tr><td><b>LAN with only <code>ipv6 enable</code></b></td><td>Link-local only on that LAN (gateway listed)</td><td>Only FE80:: under it in <code>show ipv6 interface brief</code>; no <code>C</code> route</td><td>Add the /64</td></tr>
<tr><td><b>Static host, wrong or off-link gateway</b></td><td>The host works on its link, nothing beyond</td><td><code>Destination host unreachable</code> from its own address; gateway outside its /64</td><td>Gateway = router's link-local</td></tr>
<tr><td><b>Typo in a static</b></td><td>One remote subnet unreachable</td><td>In the config but not in <code>show ipv6 route static</code>, or installed for the wrong prefix</td><td><code>no ipv6 route …</code>, re-add</td></tr>
<tr><td><b>Link-local next hop, no interface</b></td><td>A route someone &ldquo;added&rdquo; is missing</td><td><code>% Interface has to be specified for a link-local nexthop</code></td><td>Name the exit interface</td></tr>
<tr><td><b>Missing return route</b></td><td>Timed out; works from the router, not the PC</td><td>No route for the source /64 on a far router</td><td>Add it</td></tr>
</table></div>
<h3>No RA, no address: three router-side causes</h3>
<ul>
<li><b>No <code>ipv6 unicast-routing</code>.</b> A Cisco router sends RAs only when it routes IPv6; with perfect interface addresses it still acts as a host. Easy to miss when only interface sections are pasted.</li>
<li><b>A LAN prefix that isn't /64.</b> The RA still goes out and names the router as gateway, but hosts ignore a /56 or /120 for SLAAC (RFC 4862): their interface ID is 64 bits. Classic slips: the site's /48 or /56 copied onto the LAN, or the IPv4 habit of &ldquo;small subnets&rdquo;.</li>
<li><b>Only <code>ipv6 enable</code>.</b> A link-local and nothing else: the RA carries no prefix (hosts get a gateway, no address), and there's no <code>C</code> route.</li>
</ul>
${K.out(`OW-R2#show ipv6 interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:7E:4::1, subnet is 2001:DB8:7E::/56
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  ...
  Hosts use stateless autoconfig for addresses.`, "Owerri, a /56 on a LAN: the router routes and advertises (its PCs list fe80::1 as gateway), but the prefix is 2001:DB8:7E::/56 — no host can build a 128-bit address from it. Fix: no ipv6 address 2001:db8:7e:4::1/56, then ipv6 address 2001:db8:7e:4::1/64.")}
${K.mistake(`Typing the right address and assuming it replaced the wrong one. Unlike <code>ip address</code>, an IPv6 interface can hold several global addresses, so never count on a new <code>ipv6 address</code> line overwriting the old one. Remove the old one with <code>no ipv6 address …</code> first, then check in <code>show ipv6 interface</code> that only the /64 is left.`)}
<h3>Static hosts and static routes: typed is not working</h3>
<ul>
<li><b>A host gateway that isn't on-link</b> (a WAN address copied from a diagram): no Neighbor Solicitation for it is ever answered. Local users work; remote users time out; the host's own remote pings say <code>Reply from &lt;its address&gt;: Destination host unreachable.</code> Use the router's link-local (or its global address <i>on that LAN</i>).</li>
<li><b>A typo in a host address</b>: a wrong prefix digit puts it in a subnet that isn't on that link; a duplicate is caught by Duplicate Address Detection (DAD) from lesson 4: the PC doesn't use it, and <code>ipconfig /all</code> marks it <code>(Duplicate)</code>.</li>
<li><b>A typo in a route's next hop</b> (2001:db8:91:f::2 for 2001:db8:91:f0::2): on no connected subnet, so it never installs. Compare <code>show running-config | include ipv6 route</code> with <code>show ipv6 route static</code>.</li>
<li><b>A typo in a route's prefix</b>: installed, for a network that doesn't exist. Expand and compare hextet by hextet.</li>
<li><b>A link-local next hop with no interface</b>: refused, because fe80:: addresses are unique only per link:</li>
</ul>
${K.out(`CB-EDGE(config)#ipv6 route ::/0 fe80::7
% Interface has to be specified for a link-local nexthop
CB-EDGE(config)#ipv6 route ::/0 g0/1 fe80::7
CB-EDGE(config)#`, "A refused command leaves no trace in the running-config — a route in someone's notes may never have existed. The working form names the exit interface first.")}
<h3>Try it: an edge router with two IPv6 slips</h3>
<p>Calabar clinic: CB-EDGE was configured from a handover note and the clinic PCs show only link-local addresses. Design: clinic LAN 2001:db8:c4:10::/64 on Gi0/0; ISP on Gi0/1 (its router's link-local is FE80::7); a default to the ISP. The note says <code>ipv6 route ::/0 fe80::7</code>.</p>
${K.hint(`Read the prefix length after &ldquo;subnet is&rdquo;. Is there a default route in <code>show ipv6 route</code> at all?`)}
${K.term({env:"ios2", title:"CB-EDGE — a LAN that isn't /64, a default route that never took", opts:{kind:"router", host:"CB-EDGE", model:"ISR4331", motd:"CB-EDGE — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","no ip domain-lookup","ipv6 unicast-routing","interface g0/0","description CLINIC LAN","ip address 10.44.10.1 255.255.255.0","ipv6 address 2001:db8:c4:10::1/48","ipv6 address fe80::1 link-local","no shutdown",
    "interface g0/1","description ISP uplink - ISP router link-local FE80::7","ip address 192.0.2.2 255.255.255.252","ipv6 address 2001:db8:fe:7::2/64","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 192.0.2.1","ipv6 route ::/0 fe80::7","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. Both interfaces are up; IPv4 works.",
  tasks:[
    {text:"Read the IPv6 state: <code>show ipv6 interface brief</code>, then <code>show ipv6 interface g0/0</code>. Which line explains why the clinic PCs can't build an address?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ipv6\s+int\S*\s+br/i.test(h)) && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ipv6\s+int\S*\s+g\S*0\/0/i.test(h))},
    {text:"Give Gi0/0 the design's /64: remove the wrong address with <code>no ipv6 address 2001:db8:c4:10::1/48</code>, then add <code>ipv6 address 2001:db8:c4:10::1/64</code>", done:e=>{ const a = (e.intfs["GigabitEthernet0/0"].ip6||[]); return a.length===1 && a[0].len===64 && a[0].addr==="2001:db8:c4:10::1"; }},
    {text:"Check <code>show ipv6 route</code> for a default route. Then type the note's command exactly (<code>ipv6 route ::/0 fe80::7</code>), read IOS's answer, and enter it correctly with the exit interface Gi0/1 before the link-local", done:e=>(e.routes6||[]).some(r=>r.net==="::" && r.len===0 && r.ios==="GigabitEthernet0/1" && r.nh==="fe80::7") && e.history.some(h=>/^\s*ipv6\s+ro\S*\s+::\/0\s+fe80::7\s*$/i.test(h))},
    {text:"Prove it — <code>show ipv6 route</code> now lists <code>C 2001:DB8:C4:10::/64</code> and <code>S ::/0</code> — and save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && (e.routes6||[]).some(r=>r.net==="::") && e.history.filter(h=>/^\s*(do\s+)?sh\S*\s+ipv6\s+ro/i.test(h)).length>=2},
  ],
  win:"Two slips from one handover: a LAN given the site's /48, so its RAs carried a prefix no host could use, and a default route IOS refused because a link-local next hop needs its interface. Neither showed as an error in the running-config — the interface detail and the routing table told the truth.",
  solve:["enable","show ipv6 interface brief","show ipv6 interface g0/0","show ipv6 route","configure terminal","interface g0/0","no ipv6 address 2001:db8:c4:10::1/48","ipv6 address 2001:db8:c4:10::1/64","exit","ipv6 route ::/0 fe80::7","ipv6 route ::/0 g0/1 fe80::7","end","show ipv6 route","copy running-config startup-config",""]})}
${K.myth([
  ["If IPv4 works, the network is fine for IPv6 too.","Dual stack is two networks. IPv6 needs its own addresses, RAs, routes and routing command."],
  ["Smaller IPv6 LAN prefixes (/112, /120) save addresses, like IPv4 /28s.","There's no shortage to save, and SLAAC needs a /64 — a longer LAN prefix stops hosts building addresses."],
  ["ICMPv6 can be blocked like IPv4 ICMP.","Neighbor Discovery and Packet Too Big run on ICMPv6. Block it wholesale and IPv6 breaks."],
  ["If the route is in the running-config, it's in the routing table.","A static whose next hop doesn't resolve isn't installed, and a refused command isn't in the config at all."],
])}
<h3>Hands-on: watch the fingerprints happen</h3>
<p>Enugu polytechnic: EN-CORE (admin block) and EN-LIB (library), linked on Gi0/1. An intern added IPv6 yesterday; IPv4 works. Watch the frame log for Neighbor Solicitations and Advertisements as you ping — and PC-ADMIN's address appearing once its router advertises.</p>
${K.bench({id:"m6-fingerprints", points:100, ipv6:true, openLog:true, from:"CCNA · Module 6 · lesson 6", title:"no RAs, a LAN with only ipv6 enable, a static that never installed", viewBox:"0 0 760 360",
  intro:"Console cable on EN-CORE: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secrets. <b>Design:</b> admin LAN 2001:db8:e2:10::/64 (EN-CORE ::1, fe80::1); library LAN 2001:db8:e2:20::/64 (EN-LIB ::1); link 2001:db8:e2:f0::/64 (EN-CORE ::1 / fe80::1, EN-LIB ::2 / fe80::2). <b>Lab notes:</b> lab PCs build SLAAC addresses with EUI-64 (real Windows uses random interface IDs); a lab PC's zone index is %4; lab PCs have no DNS, so ping addresses (<code>ping -6</code> and <code>ping -4</code> work).",
  devices:[
    {id:"core", kind:"router", label:"EN-CORE", x:40, y:110, config:e=>{ ["en","conf t","hostname EN-CORE","no ip domain-lookup","int g0/0","description ADMIN LAN","ip address 10.62.10.1 255.255.255.0","ipv6 address 2001:db8:e2:10::1/64","ipv6 address fe80::1 link-local","no shut",
      "int g0/1","description LINK to EN-LIB","ip address 10.62.255.1 255.255.255.252","ipv6 address 2001:db8:e2:f0::1/64","ipv6 address fe80::1 link-local","no shut","exit",
      "ip route 10.62.20.0 255.255.255.0 10.62.255.2","ipv6 route 2001:db8:e2:20::/64 2001:db8:e2:f::2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lib", kind:"router", label:"EN-LIB", x:500, y:110, config:e=>{ ["en","conf t","hostname EN-LIB","no ip domain-lookup","ipv6 unicast-routing","int g0/0","description LIBRARY LAN","ip address 10.62.20.1 255.255.255.0","ipv6 enable","no shut",
      "int g0/1","description LINK to EN-CORE","ip address 10.62.255.2 255.255.255.252","ipv6 address 2001:db8:e2:f0::2/64","ipv6 address fe80::2 link-local","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 10.62.255.1","ipv6 route ::/0 g0/1 fe80::1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pca", kind:"pc", label:"PC-ADMIN", x:60, y:240, ip:"10.62.10.50", mask:"255.255.255.0", gw:"10.62.10.1", mac:"0050.56a1.1a10"},
    {id:"pcl", kind:"pc", label:"PC-LIB", x:560, y:240, ip:"10.62.20.50", mask:"255.255.255.0", gw:"10.62.20.1", mac:"0050.56a1.2b3c"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:300, y:240},
  ],
  cables:[ {type:"cat6", a:"core:g0", b:"pca:eth"}, {type:"cat6", a:"core:g1", b:"lib:g1"}, {type:"cat6", a:"pcl:eth", b:"lib:g0"}, {type:"console", a:"lap:usb", b:"core:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On PC-ADMIN's Command Prompt run <code>ipconfig</code>: which IPv6 line is missing? Then <code>ping 2001:db8:e2:10::1</code> (the gateway's global address) and <code>ping fe80::1%4</code> (its link-local). One fails, one works — what does the working one prove?", done:B=>Bench.tried(B,"pca",/ipconfig/) && Bench.tried(B,"pca",/ping\s+2001:db8:e2:10::1\b/i) && Bench.pinged(B,"pca","fe80::1")},
    {text:"On EN-CORE's console, <code>enable</code>, then find out why no RA arrives: <code>show running-config | include ipv6</code> (is there an <code>ipv6 unicast-routing</code> line?) and <code>show ipv6 interface g0/0</code> (is FF02::2 joined? any &lsquo;ND router advertisements&rsquo; lines?)", done:B=>{ const h = B.devs.core.env.history; return h.some(x=>/^\s*(do\s+)?sh\S*\s+run/i.test(x)) && h.some(x=>/sh\S*\s+ipv6\s+int\S*\s+g/i.test(x)); }},
    {text:"Turn on IPv6 routing with <code>ipv6 unicast-routing</code> (global config). Done when PC-ADMIN's <code>ipconfig</code> shows a global address and gateway, and <code>ping 2001:db8:e2:10::1</code> works", done:B=>B.devs.core.env.v6info().routing && Bench.pinged(B,"pca","2001:db8:e2:10::1")},
    {text:"The library: PC-LIB has no IPv6 Address either — yet its <code>ipconfig</code> lists an <code>fe80::</code> gateway, so EN-LIB routes IPv6 and its RAs arrive. Move the console cable to EN-LIB and read <code>show ipv6 interface brief</code> — what is under Gi0/0? Give Gi0/0 the design address <code>ipv6 address 2001:db8:e2:20::1/64</code>. Done when PC-LIB pings 2001:db8:e2:20::1", done:B=>{ const f = B.devs.lib.env.v6info().ifaces.find(i=>i.ios==="GigabitEthernet0/0"); return !!f && f.globals.some(g=>g.len===64 && g.addr==="2001:db8:e2:20::1") && Bench.pinged(B,"pcl","2001:db8:e2:20::1"); }},
    {text:"From PC-ADMIN, ping PC-LIB's new address (read it from PC-LIB's <code>ipconfig</code>): who replies, and with what? Back on EN-CORE compare <code>show running-config | include ipv6 route</code> with <code>show ipv6 route static</code>. Remove the broken static with <code>no ipv6 route …</code>, then add it via EN-LIB's link-local: first type <code>ipv6 route 2001:db8:e2:20::/64 fe80::2</code> and read the answer, then enter it with the exit interface. Done when PC-ADMIN pings PC-LIB", done:B=>{ const e = B.devs.core.env; return (e.routes6||[]).some(r=>r.net==="2001:db8:e2:20::" && r.len===64 && r.ios==="GigabitEthernet0/1" && r.nh==="fe80::2") && !(e.routes6||[]).some(r=>r.nh==="2001:db8:e2:f::2") && e.history.some(h=>/^\s*ipv6\s+ro\S*\s+2001:db8:e2:20::\/64\s+fe80::2\s*$/i.test(h)) && Bench.pinged(B,"pca","2001:db8:e2:20:250:56ff:fea1:2b3c"); }},
    {text:"Prove the path: <code>tracert 2001:db8:e2:20:250:56ff:fea1:2b3c</code> from PC-ADMIN, and <code>show ipv6 neighbors</code> on EN-CORE (which neighbours did ND find?). Save EN-CORE with <code>copy running-config startup-config</code>", done:B=>Bench.traced(B,"pca","2001:db8:e2:20:250:56ff:fea1:2b3c") && B.devs.core.env.history.some(h=>/sh\S*\s+ipv6\s+nei/i.test(h)) && !!B.devs.core.env.savedOnce},
  ],
  win:"Three fingerprints, three lines that proved them: no ipv6 unicast-routing meant no FF02::2 and no RAs, so PC-ADMIN had link-local only; a library LAN with only ipv6 enable advertised a gateway but no prefix; and a static with one missing digit never reached the table, while its link-local replacement needed the exit interface. The link-local ping worked throughout — it proves the link, not the routing.",
  solve:[["pc","pca","ipconfig"],["pc","pca","ping 2001:db8:e2:10::1"],["pc","pca","ping fe80::1%4"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show running-config | include ipv6"],["term","show ipv6 interface g0/0"],
    ["term","configure terminal"],["term","ipv6 unicast-routing"],["term","end"],["pc","pca","ipconfig"],["pc","pca","ping 2001:db8:e2:10::1"],
    ["pc","pcl","ipconfig"],["unplug","lap:usb"],["plug","console","lap:usb","lib:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ipv6 interface brief"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ipv6 address 2001:db8:e2:20::1/64"],["term","end"],["pc","pcl","ipconfig"],["pc","pcl","ping 2001:db8:e2:20::1"],
    ["pc","pca","ping 2001:db8:e2:20:250:56ff:fea1:2b3c"],["unplug","lap:usb"],["plug","console","lap:usb","core:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","show running-config | include ipv6 route"],["term","show ipv6 route static"],["term","configure terminal"],["term","no ipv6 route 2001:db8:e2:20::/64 2001:db8:e2:f::2"],["term","ipv6 route 2001:db8:e2:20::/64 fe80::2"],["term","ipv6 route 2001:db8:e2:20::/64 g0/1 fe80::2"],["term","end"],["term","show ipv6 route static"],
    ["pc","pca","ping 2001:db8:e2:20:250:56ff:fea1:2b3c"],["pc","pca","tracert 2001:db8:e2:20:250:56ff:fea1:2b3c"],["term","show ipv6 neighbors"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: the link-local ping needs no routing — only the link and Neighbor Discovery. Task 4: an interface with only <code>ipv6 enable</code> lists one FE80:: line. Task 5: the broken static's next hop is missing a digit; compare it with the link's prefix, 2001:db8:e2:f0::/64.`)}
${K.dyk(`ND asks by multicast, not broadcast (lesson 4): the NS for 2001:db8:e2:10::1 goes to its solicited-node group, which only interfaces whose addresses end in the same 24 bits have joined, and the NA comes back unicast. Other PCs' network cards drop the frame without bothering their CPUs.`)}
${K.check({q:"Hosts on a router's Gi0/1 LAN have only link-local addresses. The router has ipv6 unicast-routing, and show ipv6 interface brief lists Gi0/1 [up/up] with one line under it: FE80::C800:1BFF:FE5A:1. What is the fix?", o:["Add ipv6 enable to Gi0/1","Add a global /64 address to Gi0/1, e.g. ipv6 address 2001:db8:...::1/64","Add a default route on the router","Configure a manual link-local address on Gi0/1"], a:1, why:"A single link-local line means ipv6 enable and nothing else: no prefix for the RA, no C route for the LAN. Adding the LAN's /64 fixes both."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A router has just been handed over and LAN hosts have problems. Match each line you find with the fault it proves.", pairs:[["show running-config | include ipv6 has no ipv6 unicast-routing line","The router doesn't route IPv6 or send RAs"],["show ipv6 interface g0/0: subnet is 2001:DB8:5C::/56","The LAN prefix isn't /64, so SLAAC can't work"],["show ipv6 interface brief: only FE80::1 under Gi0/0","The LAN has only ipv6 enable — no prefix to advertise"],["% Interface has to be specified for a link-local nexthop","A static via fe80:: was typed without its exit interface"],["An ipv6 route line in the config, but nothing in show ipv6 route static","The static's next hop doesn't resolve"]], why:"1. What is asked? Which fault each line proves. 2. Which rule? SLAAC needs an RA (routing on) carrying a /64 (a global address of that length on the interface); a route needs a resolvable next hop, and a link-local next hop needs an interface. 3. Apply it: the first three are the three ways to stop an RA carrying a usable /64; the last two are the two ways a typed static never reaches the table."})}
${K.job("Benin City pharmacy chain: 'the stock app takes 20 seconds to open'",`
<h3>Ticket 4471 · 10:05 · &ldquo;Since Friday the stock app hangs about twenty seconds, then works. Only at the Ugbowo shop.&rdquo;</h3>
<p><b>Symptom and questions.</b> One shop, slow not dead. &ldquo;Anything change Friday?&rdquo; — <i>&ldquo;Head office finished IPv6.&rdquo;</i> Slow-then-works smells like an IPv6-to-IPv4 fallback.</p>
<p><b>Checks.</b> <code>ping stock.example.com</code> shows <code>[2001:db8:b7:60::25]</code> and times out; <code>ping -4</code> replies. <code>ipconfig</code>: an address in 2001:db8:b7:60::/64, gateway <code>fe80::1%6</code>, which answers a ping. <code>tracert -6</code>: the shop router, HQ-R1 (2001:db8:b7:ff60::1), then stars — the server's replies die on the way back. HQ-R1's <code>show ipv6 route static</code> lists <code>S 2001:DB8:B7:6::/64</code>. Expanded: 2001:0db8:00b7:<b>0006</b>:: against the shop's 2001:0db8:00b7:<b>0060</b>:: — one missing zero.</p>
<p><b>Fix.</b> <code>no ipv6 route 2001:db8:b7:6::/64 2001:db8:b7:ff60::2</code>, <code>ipv6 route 2001:db8:b7:60::/64 2001:db8:b7:ff60::2</code>. From the shop: <code>ping -6</code> replies, the app opens at once. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;The new IPv6 setup had a one-digit typo for your shop, so the app waited before falling back. It's fixed — please open it and tell me if it's instant.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;HQ-R1 IPv6 static for Ugbowo typed as 2001:db8:b7:6::/64 (plan: :60::/64); replies unroutable, app fell back to IPv4 after a timeout. Route replaced; ping -6/tracert -6 from shop PC OK; user confirmed; saved. Follow-up: audit all shop statics against the plan, expanded.&rdquo;</i></p>
`)}
${K.dodont([
  "Ask &ldquo;IPv4, IPv6 or both?&rdquo; first, with <code>ping -4</code> and <code>ping -6</code> from the user's PC.",
  "Read the host's <code>ipconfig</code> before touching a router: link-local only sends you to the RA.",
  "Expand addresses to four digits per hextet before comparing a route with the plan.",
  "Use a /64 on every LAN, and memorable router link-locals (<code>ipv6 address fe80::1 link-local</code>) so gateway lines read at a glance.",
],[
  "Disable IPv6 on PCs to make a slow app fast.",
  "Copy an IPv4 ICMP-blocking policy onto IPv6.",
  "Trust a handover note: a refused command never reached the config.",
  "Close the ticket because the router's own ping works.",
])}

<h2>The Module 6 challenge</h2>
<p>Savannah Agro (head office in Ikoyi, branches in Warri and Jos) had a contractor add IPv6 over the weekend. IPv4 has worked for years and still does. On Monday the NOC has six complaints, all IPv6.</p>
${K.svg("0 0 780 410",
  K.dev("router",390,50,"SV-HQ","Ikoyi · fe80::1")+K.dev("switch",170,150,"HQ-SW","HQ LAN 2001:db8:5a:10::/64")+
  K.dev("pc",60,270,"HQ-PC","SLAAC")+K.dev("server",170,270,"HQ-WEB","::80 static")+K.dev("server",280,270,"HQ-FILES","::20 static")+
  K.dev("router",520,200,"SV-WARRI","LAN :20::/64 · fe80::2")+K.dev("router",690,200,"SV-JOS","fe80::3")+
  K.dev("pc",520,330,"PC-WARRI","SLAAC")+K.dev("pc",640,330,"PC-JOS","LAN :30::/64")+K.dev("server",740,330,"NVR-JOS","CCTV :31::20")+
  K.link(366,58,196,140)+K.link(160,204,60,252)+K.link(170,204,170,250)+K.link(180,204,280,250)+
  K.link(410,60,512,188,":ff01::/64")+K.link(414,56,680,188,":ff02::/64")+K.link(520,254,520,312)+K.link(680,254,642,312)+K.link(700,254,738,310),
  "The challenge network, 2001:db8:5a::/48. Every LAN is meant to be a /64; branch defaults point at SV-HQ's link-local; SV-HQ has one static per branch subnet; servers use their router's link-local as gateway.")}
${K.tip(`Each complaint is an outcome, not an instruction; some faults hide others (&ldquo;fix X first&rdquo; in a hint means the test path runs through X). Give each ten honest minutes before its <b>Hint</b>, re-test after each fix, and keep a scratch list — complaint, stack, failing hop, fingerprint, fix, proof — for your ticket notes and portfolio.`)}
${K.bench({id:"m6-challenge", points:200, challenge:true, ipv6:true, from:"CCNA · Module 6 · lesson 6", title:"Module 6 challenge — the Monday after IPv6 went in", viewBox:"0 0 960 480",
  intro:"Console cable on SV-HQ (9600 8N1, no flow control); move it as needed. Enable secret: <code>Savannah26</code>. <b>Design:</b> <code>ipv6 unicast-routing</code> everywhere; a /64 per LAN from 2001:db8:5a::/48 — HQ :10, Warri :20, Jos :30, Jos CCTV :31; WAN 2001:db8:5a:ff01::/64 (SV-HQ ::1, SV-WARRI ::2) and :ff02::/64 (SV-HQ ::1, SV-JOS ::2); link-locals fe80::1 / ::2 / ::3 on all interfaces of SV-HQ / SV-WARRI / SV-JOS; branch defaults ::/0 to SV-HQ's link-local; SV-HQ one static per branch subnet via the branch's WAN address; servers static (HQ-WEB ::80, HQ-FILES ::20, NVR-JOS 2001:db8:5a:31::20), gateway = their router's link-local. <b>Handover note:</b> &ldquo;Branches: <code>ipv6 route ::/0 fe80::1</code> — done.&rdquo; <b>Lab notes:</b> SLAAC uses EUI-64; no DNS, so ping addresses.",
  devices:[
    {id:"hqpc", kind:"pc", label:"HQ-PC", x:10, y:10, ip:"10.90.10.50", mask:"255.255.255.0", gw:"10.90.10.1", mac:"0050.56b7.1a10"},
    {id:"web", kind:"server", label:"HQ-WEB", x:140, y:10, ip:"10.90.10.80", mask:"255.255.255.0", gw:"10.90.10.1", ip6:{auto:false, addr:"2001:db8:5a:10::80", len:64, gw:"2001:db8:5a:ff01::1"}},
    {id:"files", kind:"server", label:"HQ-FILES", x:270, y:10, ip:"10.90.10.20", mask:"255.255.255.0", gw:"10.90.10.1", ip6:{auto:false, addr:"2001:db8:5a:10::20", len:64, gw:"fe80::1"}},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:840, y:10},
    {id:"hqsw", kind:"switch", label:"HQ-SW", x:10, y:130, model:"Catalyst 9200 · HQ LAN", platform:"C9200L"},
    {id:"hq", kind:"router", label:"SV-HQ", x:480, y:130, config:e=>{ ["en","conf t","hostname SV-HQ","enable secret Savannah26","no ip domain-lookup","ipv6 unicast-routing",
      "int g0/0","description HQ LAN","ip address 10.90.10.1 255.255.255.0","ipv6 address 2001:db8:5a:10::1/120","ipv6 address fe80::1 link-local","no shut",
      "int g0/1","description WAN to SV-WARRI","ip address 10.90.255.1 255.255.255.252","ipv6 address 2001:db8:5a:ff01::1/64","ipv6 address fe80::1 link-local","no shut",
      "int g0/2","description WAN to SV-JOS","ip address 10.90.255.5 255.255.255.252","ipv6 address 2001:db8:5a:ff02::1/64","ipv6 address fe80::1 link-local","no shut","exit",
      "ip route 10.90.20.0 255.255.255.0 10.90.255.2","ip route 10.90.30.0 255.255.255.0 10.90.255.6","ip route 10.90.31.0 255.255.255.0 10.90.255.6",
      "ipv6 route 2001:db8:5a:20::/64 2001:db8:5a:ff01::2","ipv6 route 2001:db8:a5:30::/64 2001:db8:5a:ff02::2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wr", kind:"router", label:"SV-WARRI", x:300, y:260, config:e=>{ ["en","conf t","hostname SV-WARRI","enable secret Savannah26","no ip domain-lookup",
      "int g0/0","description WARRI LAN","ip address 10.90.20.1 255.255.255.0","ipv6 address 2001:db8:5a:20::1/64","ipv6 address fe80::2 link-local","no shut",
      "int g0/1","description WAN to SV-HQ","ip address 10.90.255.2 255.255.255.252","ipv6 address 2001:db8:5a:ff01::2/64","ipv6 address fe80::2 link-local","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 10.90.255.1","ipv6 route ::/0 fe80::1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"js", kind:"router", label:"SV-JOS", x:620, y:260, config:e=>{ ["en","conf t","hostname SV-JOS","enable secret Savannah26","no ip domain-lookup","ipv6 unicast-routing",
      "int g0/0","description JOS LAN","ip address 10.90.30.1 255.255.255.0","ipv6 address 2001:db8:5a:30::1/64","ipv6 address fe80::3 link-local","no shut",
      "int g0/1","description WAN to SV-HQ","ip address 10.90.255.6 255.255.255.252","ipv6 address 2001:db8:5a:ff02::2/64","ipv6 address fe80::3 link-local","no shut",
      "int g0/2","description JOS CCTV","ip address 10.90.31.1 255.255.255.0","ipv6 address 2001:db8:5a:31::1/64","ipv6 address fe80::3 link-local","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 10.90.255.5","ipv6 route ::/0 g0/1 fe80::1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pcw", kind:"pc", label:"PC-WARRI", x:330, y:370, ip:"10.90.20.50", mask:"255.255.255.0", gw:"10.90.20.1", mac:"0050.56b7.2a20"},
    {id:"pcj", kind:"pc", label:"PC-JOS", x:600, y:370, ip:"10.90.30.50", mask:"255.255.255.0", gw:"10.90.30.1", mac:"0050.56b7.3a01"},
    {id:"nvr", kind:"server", label:"NVR-JOS", x:740, y:370, ip:"10.90.31.20", mask:"255.255.255.0", gw:"10.90.31.1", ip6:{auto:false, addr:"2001:db8:5a:31::20", len:64, gw:"fe80::3"}},
  ],
  cables:[ {type:"cat6", a:"hq:g0", b:"hqsw:g1"}, {type:"cat6", a:"hqpc:eth", b:"hqsw:g2"}, {type:"cat6", a:"web:eth", b:"hqsw:g3"}, {type:"cat6", a:"files:eth", b:"hqsw:g4"},
    {type:"cat6", a:"hq:g1", b:"wr:g1"}, {type:"cat6", a:"hq:g2", b:"js:g1"}, {type:"cat6", a:"pcw:eth", b:"wr:g0"}, {type:"cat6", a:"pcj:eth", b:"js:g0"}, {type:"cat6", a:"nvr:eth", b:"js:g2"},
    {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>HQ staff (Bisi):</b> &ldquo;Since the weekend our PCs show no IPv6 address — IT says they should have one. The servers look fine.&rdquo; <i>Done when SV-HQ's LAN has only a /64 global address and HQ-PC can ping HQ-FILES (2001:db8:5a:10::20) over IPv6.</i>", hint:"HQ-PC's ipconfig: an IPv6 gateway but no IPv6 Address — an RA arrives, without a prefix SLAAC can use. The servers are static, so they don't need an RA — the PCs do. SV-HQ routes IPv6 (look for FF02::2), so what does show ipv6 interface g0/0 say after 'subnet is'? Remove the wrong address before adding the right one.", done:B=>{ const f = B.devs.hq.env.v6info().ifaces.find(i=>i.ios==="GigabitEthernet0/0"); return !!f && f.globals.length>0 && f.globals.every(g=>g.len===64) && Bench.pinged(B,"hqpc","2001:db8:5a:10::20"); }},
    {text:"<b>Warri branch (Efe):</b> &ldquo;Our laptops have no IPv6 address at all. IPv4 is fine.&rdquo; <i>Done when PC-WARRI has a SLAAC address and can ping its gateway's global address, 2001:db8:5a:20::1.</i>", hint:"Like HQ, no IPv6 Address — but PC-WARRI has no IPv6 gateway either: no RA at all. SV-WARRI's Gi0/0 has the right /64 — so read show running-config | include ipv6 for a global line that's missing, and check show ipv6 interface g0/0 for FF02::2.", done:B=>B.devs.wr.env.v6info().routing && Bench.pinged(B,"pcw","2001:db8:5a:20::1")},
    {text:"<b>Warri branch, later:</b> &ldquo;Now we have IPv6 addresses but nothing at HQ answers over IPv6.&rdquo; <i>Done when PC-WARRI can ping HQ-FILES (2001:db8:5a:10::20) over IPv6.</i>", hint:"Fix the Warri addresses first. Then: who sends 'Destination net unreachable'? Read SV-WARRI's show ipv6 route — is there a ::/0? The handover note says it was typed. Type it exactly as the note says and read IOS's answer.", done:B=>!!B.devs.wr.env.lookup6("2001:db8:5a:10::20") && Bench.pinged(B,"pcw","2001:db8:5a:10::20")},
    {text:"<b>Web team (Tolu):</b> &ldquo;HQ staff can open the new IPv6 intranet on HQ-WEB (2001:db8:5a:10::80), but nobody at the branches can — and HQ-FILES works for them.&rdquo; <i>Done when PC-WARRI can ping HQ-WEB over IPv6 and HQ-WEB keeps its static address.</i>", hint:"Warri must reach HQ-FILES first. HQ-FILES works and HQ-WEB doesn't, on the same LAN through the same router — so compare the two servers. Requests reach HQ-WEB (show ipv6 neighbors on SV-HQ lists it); what happens to its replies? Run ipconfig on HQ-WEB and read its gateway: is it on HQ-WEB's own link?", done:B=>!!B.devs.web.ip6 && !B.devs.web.ip6.auto && Bench.pinged(B,"pcw","2001:db8:5a:10::80")},
    {text:"<b>Jos branch (Danjuma):</b> &ldquo;Our PCs have IPv6 addresses, but HQ says they can't reach us over IPv6 — they want to push updates to PC-JOS.&rdquo; <i>Done when HQ-PC can ping PC-JOS's IPv6 address (read it from PC-JOS's ipconfig), SV-HQ routes the Jos LAN with a /64 static, and the wrong route is gone.</i>", hint:"HQ-PC needs its own IPv6 address first (complaint 1). Ping PC-JOS from HQ-PC: who sends 'Destination net unreachable'? On SV-HQ, show ipv6 route static: expand each prefix and compare it with the design, hextet by hextet.", done:B=>{ const I = window.IP6, a = I.str(I.withIid(I.parse("2001:db8:5a:30::"), I.eui64(B.devs.pcj.mac))), e = B.devs.hq.env, r = e.lookup6(a); return !!r && r.code==="S" && r.net==="2001:db8:5a:30::" && r.len===64 && !(e.routes6||[]).some(x=>x.net==="2001:db8:a5:30::") && Bench.pinged(B,"hqpc",a); }},
    {text:"<b>Jos security (Ngozi):</b> &ldquo;The CCTV recorder, NVR-JOS, should upload clips to HQ-FILES over IPv6. Every upload times out. Jos PCs reach HQ fine.&rdquo; <i>Done when NVR-JOS can ping HQ-FILES over IPv6.</i>", hint:"Timed out, not unreachable — and the Jos PCs work through the same SV-JOS default. So the requests probably arrive; what about the replies? Which subnet is the NVR in, and does SV-HQ's table have a route back to it?", done:B=>{ const r = B.devs.hq.env.lookup6("2001:db8:5a:31::20"); return !!r && r.code==="S" && Bench.pinged(B,"nvr","2001:db8:5a:10::20"); }},
  ],
  win:"Six faults, one method — a /120 LAN no host could build from, a branch router that never routed IPv6, a default route refused because its link-local next hop had no interface, a server whose gateway wasn't on its link, a static with two digits swapped, and a CCTV subnet with no way home. Each time you asked which stack, read the host first, found where the packet stopped, and read the line that proved why.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Savannah26"],
    ["term","show ipv6 interface g0/0"],["term","show ipv6 route static"],["term","configure terminal"],["term","interface g0/0"],["term","no ipv6 address 2001:db8:5a:10::1/120"],["term","ipv6 address 2001:db8:5a:10::1/64"],["term","exit"],
    ["term","no ipv6 route 2001:db8:a5:30::/64 2001:db8:5a:ff02::2"],["term","ipv6 route 2001:db8:5a:30::/64 2001:db8:5a:ff02::2"],["term","ipv6 route 2001:db8:5a:31::/64 2001:db8:5a:ff02::2"],["term","end"],["term","write memory"],
    ["ip6","web","static","2001:db8:5a:10::80","64","fe80::1"],
    ["unplug","lap:usb"],["plug","console","lap:usb","wr:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Savannah26"],
    ["term","show running-config | include ipv6"],["term","configure terminal"],["term","ipv6 unicast-routing"],["term","ipv6 route ::/0 g0/1 fe80::1"],["term","end"],["term","write memory"],
    ["pc","hqpc","ping 2001:db8:5a:10::20"],["pc","pcw","ping 2001:db8:5a:20::1"],["pc","pcw","ping 2001:db8:5a:10::20"],["pc","pcw","ping 2001:db8:5a:10::80"],
    ["pc","pcj","ipconfig"],["pc","hqpc","ping 2001:db8:5a:30:250:56ff:feb7:3a01"],["pc","nvr","ping 2001:db8:5a:10::20"]]})}
${K.hint(`Stuck? The two &ldquo;no address&rdquo; complaints come first — a PC without a global address can't test anything else. Then Warri's way out, then the server that only fails from far away, then the two Jos routes on SV-HQ. Re-run earlier pings after each fix.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Fault 1 — HQ LAN: a /120 instead of a /64",`<p><b>Found:</b> HQ-PC has gateway <code>fe80::1%4</code> but no IPv6 Address (the RA arrives; its prefix is useless); the static servers work, so the LAN and router are fine — only SLAAC fails. SV-HQ routes IPv6 (FF02::2, RA lines), but <code>show ipv6 interface g0/0</code> says <code>subnet is 2001:DB8:5A:10::/120</code>: the contractor &ldquo;saved addresses&rdquo; the IPv4 way. <b>Fix:</b> <code>no ipv6 address 2001:db8:5a:10::1/120</code>, <code>ipv6 address 2001:db8:5a:10::1/64</code>. <b>Proof:</b> <code>C 2001:DB8:5A:10::/64</code>; HQ-PC gets an address in 2001:db8:5a:10::/64 beside its gateway <code>fe80::1%4</code>, and pings HQ-FILES.</p>`)}
${K.reveal("Fault 2 — Warri: no ipv6 unicast-routing",`<p><b>Found:</b> PC-WARRI link-local only — and, unlike HQ-PC, no IPv6 gateway: no RA at all — although Gi0/0 has a correct /64. <code>show running-config | include ipv6</code> has only interface lines; <code>show ipv6 interface g0/0</code> has no FF02::2 and no RA lines. <b>Fix:</b> <code>ipv6 unicast-routing</code>. <b>Proof:</b> PC-WARRI gets 2001:db8:5a:20:… with gateway <code>fe80::2%4</code> and pings 2001:db8:5a:20::1.</p>`)}
${K.reveal("Fault 3 — Warri: the default route IOS refused",`<p><b>Found:</b> <code>Reply from 2001:db8:5a:20::1: Destination net unreachable.</code> — the gateway has no route. No <code>::/0</code> in SV-WARRI's table; typing the handover note's command shows why: <code>% Interface has to be specified for a link-local nexthop</code>. It never reached the config. <b>Fix:</b> <code>ipv6 route ::/0 g0/1 fe80::1</code>. <b>Proof:</b> <code>S ::/0</code>; PC-WARRI pings HQ-FILES.</p>`)}
${K.reveal("Fault 4 — HQ-WEB: a gateway that isn't on its link",`<p><b>Found:</b> from Warri, HQ-FILES answers and HQ-WEB times out — same LAN, same router, so the difference is the server. SV-HQ's <code>show ipv6 neighbors</code> lists 2001:DB8:5A:10::80, so requests reach it. HQ-WEB's <code>ipconfig</code>: gateway <code>2001:db8:5a:ff01::1</code>, SV-HQ's Warri WAN address copied from the diagram — not on HQ-WEB's link, so nobody answers its Neighbor Solicitations, and its own remote pings say <code>Reply from 2001:db8:5a:10::80: Destination host unreachable.</code> HQ users worked because they're on-link. <b>Fix:</b> HQ-WEB's IPv6 settings: gateway <code>fe80::1</code>, address unchanged. <b>Proof:</b> PC-WARRI pings 2001:db8:5a:10::80.</p>`)}
${K.reveal("Fault 5 — SV-HQ: a static with two digits swapped",`<p><b>Found:</b> HQ-PC to PC-JOS: <code>Reply from 2001:db8:5a:10::1: Destination net unreachable.</code> <code>show ipv6 route static</code> lists <code>S 2001:DB8:A5:30::/64</code> — expanded, 2001:0db8:00<b>a5</b>:0030 against the design's 2001:0db8:00<b>5a</b>:0030. (Jos PCs pinging HQ saw <code>Request timed out</code>: the same fault from the other end.) <b>Fix:</b> <code>no ipv6 route 2001:db8:a5:30::/64 2001:db8:5a:ff02::2</code>, <code>ipv6 route 2001:db8:5a:30::/64 2001:db8:5a:ff02::2</code>. <b>Proof:</b> HQ-PC pings PC-JOS (2001:db8:5a:30:250:56ff:feb7:3a01 in the lab).</p>`)}
${K.reveal("Fault 6 — the CCTV subnet had no way home",`<p><b>Found:</b> NVR-JOS (gateway fe80::3, correct) times out to HQ-FILES while Jos PCs work through the same default — so its replies die. SV-HQ has nothing for 2001:db8:5a:31::/64; HQ-PC pinging the NVR shows it from the other side: <code>Destination net unreachable</code> from SV-HQ. (<code>tracert -6</code> from the NVR shows hop 1, SV-JOS, then stars.) <b>Fix:</b> <code>ipv6 route 2001:db8:5a:31::/64 2001:db8:5a:ff02::2</code>. <b>Proof:</b> the NVR's ping replies.</p>
<p><b>Finally</b> <code>write memory</code> on SV-HQ and SV-WARRI, and a ticket note per complaint: stack, fingerprint, fix, proof.</p>`)}

<h2>Portfolio project: add IPv6 to your three-site network</h2>
<p>&ldquo;Have you done IPv6?&rdquo; is a common interview question; a repository with a dual-stack design, configs, verification output and an honest break/fix log answers it better than a CV line. Build on your Module 5 portfolio network or a fresh three-site design.</p>
<h3>The brief</h3>
<ul>
<li><b>An addressing plan from one /48</b>, written before you configure — 2001:db8:120::/48 (documentation space: never a real prefix you don't own), a /64 per LAN and link.</li>
<li><b>Dual stack everywhere</b>, with SLAAC on user LANs and a static server whose gateway is its router's link-local.</li>
<li><b>IPv6 statics</b> between sites (at least one via a link-local next hop with its interface) and an <b>IPv6 default</b> to a small &ldquo;ISP&rdquo; router, with a floating backup (<code>ipv6 route ::/0 … 250</code>, lesson 5). Give the ISP a route to your /48 — that's how real ISPs route IPv6, with no NAT.</li>
</ul>
<div class="tablewrap"><table>
<tr><th>Subnet ID</th><th>Prefix</th><th>Use</th><th>IPv4 twin</th></tr>
<tr><td>0010 / 0020 / 0030</td><td>2001:db8:120:10::/64 …</td><td>HQ, branch A, branch B users</td><td>10.120.10.0/24 …</td></tr>
<tr><td>ff01, ff02</td><td>2001:db8:120:ff01::/64 …</td><td>HQ–branch links</td><td>10.120.255.0/30 …</td></tr>
<tr><td>ff10</td><td>2001:db8:120:ff10::/64</td><td>Edge to the &ldquo;ISP&rdquo;</td><td>a public /30</td></tr>
</table></div>
<p>Mirroring the IPv4 octet is a readability habit, not maths: &ldquo;10&rdquo; in an octet is decimal, in a hextet it's hex (sixteen).</p>
${K.steps([
  ["Design and build","Diagram, addressing table and route list (each with a <i>why</i>); add IPv6 one router at a time, checking <code>show ipv6 interface brief</code> and a link-local ping to each neighbour."],
  ["Route and verify","From every LAN: <code>ipconfig</code>, <code>ping -6</code> and <code>tracert -6</code> to the other sites and the ISP host — saving every output."],
  ["Fail it","Shut the primary internet link: capture <code>show ipv6 route</code> (the floating default appears) and a <code>tracert -6</code> over the backup."],
  ["Break it on purpose","Three of this lesson's fingerprints, one at a time: symptom, fingerprint line, fix, proof."],
  ["Publish","README, configs, evidence, diagram — passwords and anything real removed."],
])}
<h3>A write-up template you can copy</h3>
<p>Save this as <code>README.md</code> and fill in each angle bracket.</p>
${K.out(`# Dual-stack three-site network: IPv6 added to an IPv4 design
Author: <name> · Built with: <Packet Tracer / GNS3 / CML / Ladder Lab> · <month year>

## 1. Problem
<2-4 sentences: why the business needs IPv6, what must keep working on IPv4>

## 2. Design (and why)
- 2001:db8:120::/48; a /64 per LAN and link; subnet IDs mirror IPv4 octets
- ipv6 unicast-routing everywhere; link-locals fe80::1 / ::2 / ::3 per site
- SLAAC on user LANs; servers static, gateway = router link-local
- Routing: <statics>; default via <primary>, floating ::/0 AD 250 via <backup>

## 3. Addressing plan
| Subnet ID | IPv6 prefix | IPv4 subnet | Purpose | Gateway |
|-----------|-------------|-------------|---------|---------|

## 4. Verification evidence (configs in /configs, outputs in /evidence)
| Test | Expected | Observed |
|------|----------|----------|
| Branch PC ipconfig | SLAAC address in its /64, gateway fe80::x | |
| ping -6 and ping -4, site to site | both reply | |
| Primary internet down | floating ::/0 [250/0]; tracert -6 via backup | |

## 5. What broke and how I fixed it
| # | Fault | Symptom | Fingerprint (command + line) | Fix | Proof |
|---|-------|---------|------------------------------|-----|-------|

## 6. How to check my work / what next
- Simulated in <tool + version>; simplifications: <e.g. EUI-64 hosts>
- Outputs pasted unedited; next: <OSPFv3, IPv6 ACLs>`, "Copy the whole block; keep each evidence file as plain text pasted from the CLI. Say what was simulated, and never tidy an output.")}
<h3>What &ldquo;done&rdquo; evidence looks like</h3>
<ul>
<li><code>show ipv6 interface brief</code> and <code>show ipv6 route</code> from <b>every</b> router.</li>
<li>A branch <code>ipconfig</code> with a SLAAC address and an fe80:: gateway.</li>
<li><code>ping -6</code> and <code>tracert -6</code> between every pair of sites, normally and during the internet failure, beside the IPv4 tests.</li>
<li>Three break/fix entries with real fingerprint lines (<code>subnet is …/56</code>, the link-local refusal, a return route proved from a PC).</li>
</ul>
${K.tip(`Post it: 150 words on LinkedIn — problem, diagram, one fault you proved, the link. In interviews, &ldquo;the /120 that stopped SLAAC&rdquo; is a ready-made answer to &ldquo;tell me about a time you troubleshot something&rdquo;.`)}
${K.check({q:"Which evidence best proves your IPv6 user LANs work as designed?", o:["The ipv6 address lines from each running-config","A host ipconfig showing a SLAAC address in the LAN's /64 with an fe80:: gateway, plus ping -6 and tracert -6 from that host to another site","show ipv6 interface brief from one router","The addressing table"], a:1, why:"Configs and tables show intent. The host's ipconfig proves the RA reached it with a usable /64, and ping/tracert from the host prove the path both ways — the user's view."})}

<h2>Interview corner</h2>
${K.hint(`Which stack, the host first, where it stops (both ways), why — a command for each step, and proof at the end.`)}
${K.reveal("&ldquo;A user says IPv6 doesn't work but IPv4 does. How do you troubleshoot it?&rdquo;",`<p>&ldquo;I confirm it's IPv6 only with <code>ping -4</code> and <code>ping -6</code> to the same name. Then the host's <code>ipconfig</code>: link-local only means no usable Router Advertisement, so I check the router — <code>ipv6 unicast-routing</code>, a /64 on the LAN. With an address and gateway, I ping the gateway's link-local with the zone index, <code>tracert -6</code> to the last hop that answers, and read that router's <code>show ipv6</code> interface, route and neighbor tables; timeouts send me to the return route. I fix the device whose own config is wrong and prove it from the user's PC.&rdquo;</p>`)}
${K.hint(`Two separate networks; what the host prefers; why users don't notice.`)}
${K.reveal("&ldquo;What is dual stack, and why can IPv6 be broken for weeks without anyone noticing?&rdquo;",`<p>&ldquo;Hosts and routers run IPv4 and IPv6 side by side — separate addresses, gateways, neighbour discovery and routing tables over the same links. Hosts prefer IPv6 when they have a global address and a route, but browsers race the two and fall back fast, and a host with only link-local uses IPv4 — so broken IPv6 looks like &lsquo;slow&rsquo; or nothing. I test both stacks explicitly, and I'd never fix it by disabling IPv6 on PCs.&rdquo;</p>`)}
${K.hint(`What makes a link-local address different from a global one — and what a link-local next hop gains you.`)}
${K.reveal("&ldquo;Why does IOS insist on an exit interface when a static route's next hop is link-local — and why use one at all?&rdquo;",`<p>&ldquo;A link-local address is unique only on its link, and every interface has one from fe80::/10, so fe80::2 could exist on every link at once. The router can't choose the link, so <code>ipv6 route ::/0 fe80::2</code> is refused; the form is <code>ipv6 route ::/0 g0/1 fe80::2</code>. Link-local next hops survive a renumbering of the link's global prefix.&rdquo;</p>`)}

${K.recap([
  "Dual stack is two networks on one set of cables: IPv4 working proves Layers 1–2 only. Ask &ldquo;IPv4, IPv6 or both?&rdquo; with ping -4 and ping -6.",
  "A host prefers IPv6 only with a global address and an IPv6 gateway; with link-local only it quietly uses IPv4.",
  "Method: Scope, Host (ipconfig), First hop (ping fe80::…%N), Trace (tracert -6), Router tables, the way Back.",
  "Link-local only = no RA with a usable /64: no ipv6 unicast-routing, a LAN prefix that isn't /64, or only ipv6 enable.",
  "General failure = no IPv6 route on the PC; host unreachable from your own address = ND for the next hop failed; net unreachable from a router = no route there; timed out = return path first.",
  "Statics: typed isn't installed; expand prefixes before comparing; a link-local next hop needs its exit interface. Prove every fix from the user's PC.",
])}
${K.next(`<b>Module 7 — IP services.</b> With IPv4 and IPv6 routed end to end, next come the services on top: DHCP and relaying it, DNS — including the AAAA records you met here — NAT and ${K.g("PAT","Port Address Translation: NAT that lets many inside hosts share one public IPv4 address by also translating port numbers (Module 7).")} at the IPv4 edge, and NTP.`)}
`,
quiz:[
  {q:"A Windows PC's ipconfig shows a Link-local IPv6 Address but no IPv6 Address line, and its only Default Gateway is an IPv4 address. What is the most likely explanation?", o:["IPv6 is disabled on the PC","No Router Advertisement reached the PC, so it has neither a SLAAC address nor an IPv6 gateway","The PC has a duplicate IPv4 address","The router's IPv4 routing is turned off"], a:1, why:"Every IPv6 interface has a link-local address on its own. The IPv6 gateway comes from an RA, and a SLAAC address from an RA carrying a /64. With neither, no RA arrived: start with the router's ipv6 unicast-routing. (An fe80:: gateway but no IPv6 Address would mean an RA came without a usable /64.)", lvl:1},
  {type:"fill", q:"Type the global configuration command a Cisco router needs before it forwards IPv6 packets and sends Router Advertisements.", fields:[{label:"Command", a:["ipv6 unicast-routing"], ios:true}], why:"Without ipv6 unicast-routing, a Cisco router treats itself as an IPv6 host: its interfaces can have addresses, but it sends no RAs and forwards no IPv6 packets.", lvl:1},
  {q:"What does the %7 in fe80::1%7 mean on a Windows PC?", o:["The prefix length","The zone index: Windows' number for the interface, saying which link the link-local address is on","The seventh hextet","The hop limit"], a:1, why:"Every interface has a link-local address in fe80::/10, so a link-local address alone is ambiguous. The zone index (an interface number on Windows, a name such as %eth0 on Linux) says which link to use. It differs from PC to PC.", lvl:1},
  {type:"match", q:"Match each Windows IPv6 ping result with what it most likely means.", pairs:[["PING: transmit failed. General failure.","The PC has no IPv6 route at all, e.g. no global address or gateway"],["Reply from the PC's own address: Destination host unreachable.","Neighbor Discovery for the next hop got no answer"],["Reply from a router: Destination net unreachable.","That router has no route to the destination"],["Request timed out.","Silence: often a missing return route or a router not routing IPv6"]], why:"General failure is the PC refusing to send; host unreachable from your own address is a failed Neighbor Solicitation (wrong or off-link gateway); net unreachable is a router reporting no route (ICMPv6 code 0); a timeout means nothing came back.", lvl:1},
  {type:"order", q:"Put the IPv6 troubleshooting method in order.", items:["Scope it: IPv4, IPv6 or both (ping -4 / ping -6)","Read the host: ipconfig","Ping the gateway's link-local address with its zone index","tracert -6 to find the last hop that answers","On that router: show ipv6 interface brief, show ipv6 route, show ipv6 neighbors","Check the return route on the routers back to the user"], why:"Some Hosts Fail To Route Back: scope picks the stack, the host and first hop prove the local side, the trace finds where it stops, the router tables show why, and the return path catches one-way failures.", lvl:1},
  {q:"Hosts on Gi0/0 get only link-local addresses, although the router has ipv6 unicast-routing. Based on the output, what is the fix?", ex:"OK-R2#show ipv6 interface g0/0\nGigabitEthernet0/0 is up, line protocol is up\n  IPv6 is enabled, link-local address is FE80::1\n  No Virtual link-local address(es):\n  Global unicast address(es):\n    2001:DB8:91:4::1, subnet is 2001:DB8:91::/56\n  Joined group address(es):\n    FF02::1\n    FF02::2\n    FF02::1:FF00:1\n  ...\n  ND router advertisements are sent every 200 seconds\n  Hosts use stateless autoconfig for addresses.", o:["Add ipv6 unicast-routing","Remove the /56 address and configure 2001:db8:91:4::1/64 — SLAAC needs a /64 prefix","Add ipv6 enable to Gi0/0","Add a default route to the router"], a:1, why:"FF02::2 and the RA lines show the router is advertising, but the prefix it advertises is a /56. A host's interface ID is 64 bits, so it can only build an address from a /64. Remove the /56 (no ipv6 address 2001:db8:91:4::1/56) and add the /64.", lvl:2},
  {q:"A user's IPv6 ping to a server returns 'Reply from 2001:db8:3c:20::1: Destination net unreachable.' The address 2001:db8:3c:20::1 is the user's own gateway router. Where do you look?", o:["The user's IPv6 settings","The gateway router's IPv6 routing table for the server's prefix","The server's default gateway","The switch port's VLAN"], a:1, why:"The message comes from a router's address, not the PC's, so the PC reached its gateway fine; the gateway is reporting that it has no route forward (ICMPv6 Destination Unreachable, no route). Read show ipv6 route there and find why the route is missing.", lvl:2},
  {q:"An engineer types R1(config)#ipv6 route 2001:db8:77::/48 fe80::2 and IOS answers '% Interface has to be specified for a link-local nexthop'. Why?", o:["fe80::2 is not a valid IPv6 address","Link-local addresses are unique only on one link and every interface has fe80::/10, so the router can't tell which link the next hop is on","Static routes can't point to a /48","IPv6 static routes need an administrative distance"], a:1, why:"fe80::2 could exist on every link at once. IOS needs the exit interface to know which link to send on: ipv6 route 2001:db8:77::/48 g0/1 fe80::2. The refused command doesn't appear in the running-config at all.", lvl:2},
  {type:"fill", q:"Type the full command that adds a default IPv6 route out of GigabitEthernet0/2 via the ISP router's link-local address fe80::9.", fields:[{label:"Command", a:["ipv6 route ::/0 gigabitethernet0/2 fe80::9","ipv6 route ::/0 g0/2 fe80::9","ipv6 route ::/0 gi0/2 fe80::9","ipv6 route ::/0 gig0/2 fe80::9","ipv6 route ::/0 gigabitethernet0/2 fe80:0:0:0:0:0:0:9","ipv6 route ::/0 g0/2 fe80:0:0:0:0:0:0:9","ipv6 route 0:0:0:0:0:0:0:0/0 g0/2 fe80::9","ipv6 route ::/0 gigabitethernet 0/2 fe80::9","ipv6 route 0::/0 g0/2 fe80::9"], ios:true}], why:"::/0 is the IPv6 default route. Because the next hop is link-local, the exit interface comes first: ipv6 route ::/0 g0/2 fe80::9.", lvl:2},
  {type:"multi", q:"A dual-stack branch: ping -4 to HQ works, ping -6 to HQ fails. Which two faults could explain this on their own? (Choose two.)", o:["The branch router has no ipv6 unicast-routing","HQ has no IPv6 route back to the branch's /64","The branch PC is in the wrong VLAN","The branch PC's cable is faulty","The branch router has no IPv4 default route"], a:[0,1], why:"Anything that breaks the link, the VLAN or IPv4 routing would break ping -4 too. IPv6-only causes are IPv6 settings: a router not routing IPv6, or a missing IPv6 route (here the return route).", lvl:2},
  {type:"fill", q:"An HQ static route was typed as ipv6 route 2001:db8:47:3::/64 2001:db8:47:ff03::2, but the branch LAN in the plan is 2001:0db8:0047:0300::/64. Type the correct prefix in compressed form, with /64.", fields:[{label:"Prefix", a:["2001:db8:47:300::/64","2001:DB8:47:300::/64","2001:db8:47:0300::/64","2001:0db8:0047:0300::/64","2001:0db8:0047:300::/64","2001:db8:47:300:0:0:0:0/64","2001:0db8:0047:0300:0000:0000:0000:0000/64"]}], why:"Expand before comparing: 2001:db8:47:3:: is 2001:0db8:0047:0003::, but the plan is 2001:0db8:0047:0300::. Leading zeros can be dropped (0300 becomes 300), trailing zeros never can. Correct: 2001:db8:47:300::/64.", lvl:2},
  {type:"multi", q:"Hosts on a router's Gi0/1 LAN have only link-local addresses. show ipv6 interface brief shows Gi0/1 [up/up] with one line under it: FE80::C800:1BFF:FE5A:1. The router has ipv6 unicast-routing. Which two statements are true? (Choose two.)", o:["Gi0/1 has IPv6 enabled but no global address, so there's no prefix to advertise","Adding a global /64 address to Gi0/1 lets the hosts build SLAAC addresses","Gi0/1 has no link-local address","The hosts need static IPv4 addresses","ipv6 enable advertises a /64 automatically"], a:[0,1], why:"A single FE80:: line is what ipv6 enable alone gives: a link-local and nothing else. With unicast-routing on, adding the LAN's /64 gives the RA a prefix (and the router a C route for the LAN).", lvl:2},
  {q:"Users on the same LAN can reach a static IPv6 server, but users at other sites time out. Based on the server's output, what is wrong?", ex:"C:\\Users\\Administrator>ipconfig\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   IPv6 Address. . . . . . . . . . . : 2001:db8:6e:40::25\n   Link-local IPv6 Address . . . . . : fe80::4c1:22ff:fe9a:713%3\n   IPv4 Address. . . . . . . . . . . : 10.66.40.25\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 2001:db8:6e:41::1\n                                       10.66.40.1", o:["The server's IPv6 address is in the wrong /64","The IPv6 gateway 2001:db8:6e:41::1 isn't on the server's link (2001:db8:6e:40::/64), so replies to remote users can't leave; set the gateway to the router's link-local or its 2001:db8:6e:40:: address","The server needs a temporary IPv6 address","The router has no route to 2001:db8:6e:40::/64"], a:1, why:"Local users need no gateway, so they work. Remote users' requests arrive, but the server sends replies to a gateway in 2001:db8:6e:41::/64 — another link — and its Neighbor Solicitations go unanswered. If the router lacked a route to the server's LAN, local users would be unaffected too, but the router's other LANs would get 'net unreachable', not a timeout.", lvl:3},
  {q:"Users can't reach 2001:db8:d4:70::/64 behind R-EKO. Based on the output, why?", ex:"R-LAG#show running-config | include ipv6 route\nipv6 route 2001:DB8:D4:70::/64 2001:DB8:D4:F7::2\nipv6 route 2001:DB8:D4:80::/64 2001:DB8:D4:F8::2\n\nR-LAG#show ipv6 route static\nIPv6 Routing Table - default - 7 entries\n...\nS   2001:DB8:D4:80::/64 [1/0]\n     via 2001:DB8:D4:F8::2\n\nR-LAG#show ipv6 interface brief\nGigabitEthernet0/0     [up/up]\n    FE80::1\n    2001:DB8:D4:10::1\nGigabitEthernet0/1     [up/up]\n    FE80::1\n    2001:DB8:D4:F8::1", o:["The 70 route has a typo in its next hop (F7 instead of F8): the next hop is on no connected subnet, so the route was never installed","R-EKO's LAN isn't a /64","The 80 route overrides the 70 route","IPv6 static routes need ipv6 unicast-routing on R-EKO only"], a:0, why:"Config is what was typed; the table is what the router believes. 2001:db8:d4:f7::2 isn't inside any connected prefix (the link is 2001:db8:d4:f8::/64), so the recursive lookup fails and the route isn't installed. Re-enter it via 2001:db8:d4:f8::2.", lvl:3},
  {q:"Branch PCs in 2001:db8:2b:60::/64 get 'Request timed out' pinging an HQ server over IPv6, yet the branch router pings the server successfully. HQ-R1's IPv6 table has statics for 2001:db8:2b:50::/64 and 2001:db8:2b:70::/64, and the branch WAN link 2001:db8:2b:ff06::/64 is connected on HQ-R1. What is the most likely fault, and why does the router's ping work?", o:["The server's gateway is wrong; the router's ping uses a different server","HQ-R1 has no route back to 2001:db8:2b:60::/64; the branch router's ping is sourced from its WAN address, which HQ-R1 has as a connected route","The branch router has no ipv6 unicast-routing; routers can always ping","The branch LAN isn't a /64"], a:1, why:"A timeout from PCs while the router succeeds is the classic return-path fingerprint. The router's own ping comes from 2001:db8:2b:ff06::x, which HQ-R1 knows; the PCs' /64 isn't in HQ-R1's table, so replies die there. Add ipv6 route 2001:db8:2b:60::/64 via the branch's WAN address, and test from a PC.", lvl:3},
  {q:"Since IPv6 was enabled, staff say an old in-house stock app takes about 20 seconds to open, then works; web browsers feel normal. ping -6 to the app server times out, ping -4 replies. What is the best response?", o:["Disable IPv6 on the staff PCs","The IPv6 path to the server is broken; the app tries IPv6, waits for it to time out, then uses IPv4, while browsers race both and fall back quickly — find and fix the IPv6 fault with the method","Remove the server's A record","Increase the PCs' TCP timeout"], a:1, why:"Slow-then-works is a fallback: the PC prefers the AAAA because it has a global IPv6 address and gateway. Browsers use Happy Eyeballs and hide the fault; simpler apps wait for a timeout. Disabling IPv6 hides the fault and leaves it for the next service — fix the IPv6 route.", lvl:3},
],
cards:[
  {f:"The dual-stack rule", b:"IPv4 and IPv6 are two separate networks on the same cables: separate addresses, gateways (ARP vs Neighbor Discovery), routing tables (show ip route vs show ipv6 route) and filters. IPv4 working proves Layer 1 and 2 only."},
  {f:"Which stack does a host use?", b:"It prefers IPv6 (AAAA) when it has a global IPv6 address and an IPv6 gateway (RFC 6724); with link-local only it uses IPv4. Browsers race both (Happy Eyeballs). ping by name shows the choice in brackets; ping -4 / ping -6 force one."},
  {f:"The IPv6 troubleshooting method", b:"Some Hosts Fail To Route Back: Scope (which stack?), Host (ipconfig), First hop (ping fe80::…%N), Trace (tracert -6), Router tables (show ipv6 interface / route / neighbors), the way Back (return route)."},
  {f:"ipconfig shows link-local only", b:"No IPv6 gateway either: no RA arrived — check ipv6 unicast-routing. An fe80:: gateway but no IPv6 Address: the RA had no usable /64 — check the LAN interface has a global /64 (not /56, /120, or only ipv6 enable)."},
  {f:"Pinging a link-local address", b:"Add the zone index: ping fe80::1%7 on Windows (the number from ipconfig), %eth0 on Linux; IOS asks 'Output Interface:'. A reply proves the link, ND and the router's IPv6 — no routing involved."},
  {f:"Windows IPv6 ping messages", b:"General failure = no IPv6 route on the PC (no address/gateway). Host unreachable from own address = ND for the next hop failed. Net unreachable from a router = that router has no route. Timed out = silence: return path first."},
  {f:"Fingerprint: no ipv6 unicast-routing", b:"LAN hosts link-local only; transit traffic dies silently. No ipv6 unicast-routing line in show running-config | include ipv6; no FF02::2 and no 'ND router advertisements are sent' in show ipv6 interface."},
  {f:"Fingerprint: LAN prefix isn't /64, or only ipv6 enable", b:"Hosts link-local only. show ipv6 interface: 'subnet is …/56' (or /120); or show ipv6 interface brief lists only FE80:: under the LAN. SLAAC needs a /64 (64-bit interface ID). Remove the wrong address, add the /64."},
  {f:"Fingerprint: static host with a wrong or off-link gateway", b:"The host reaches its own link but nothing beyond; its own pings say 'Reply from <own address>: Destination host unreachable'; remote users time out. Gateway must be on its link: the router's link-local (usual) or its global address on that LAN."},
  {f:"Fingerprint: a typo in a static route", b:"Next-hop typo: in show running-config but missing from show ipv6 route static (next hop doesn't resolve). Prefix typo: installed for a network that doesn't exist — expand to four digits per hextet and compare with the plan."},
  {f:"Fingerprint: link-local next hop without interface", b:"'% Interface has to be specified for a link-local nexthop' — refused, so it never reaches the config. Correct form: ipv6 route PREFIX/len <exit-interface> fe80::x."},
  {f:"Fingerprint: missing return route (IPv6)", b:"PCs get Request timed out; the router's own ping works (sourced from its WAN address); tracert -6 goes silent at the router with no way back. Fix: a route for the source /64 on that router; test from a PC."},
  {f:"Dual-stack portfolio evidence", b:"/48 plan with a /64 per LAN; show ipv6 interface brief from every router; a host ipconfig with SLAAC address and fe80:: gateway; show ipv6 route; ping -6 and tracert -6 between sites, normally and during failover; three break/fix entries with real fingerprint lines."},
],
});


const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[1-5]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m6", t:"IPv6: addresses, types, configuration, SLAAC and static routes",
  blurb:"Read and shorten IPv6 addresses, tell every address type apart, configure IPv6 on routers (EUI-64, link-local), see how hosts find routers and build their own addresses with NDP and SLAAC, route IPv6 statically — and troubleshoot a dual-stack network in the Module 6 challenge.",
}, L, { at, modAt:5, replace:["IPv6: addressing, types, SLAAC and configuration"] });
})();
