// CCNA · Module 7 — IP services: DHCP and relay, DNS, NAT/PAT, NTP, syslog, SNMP, TFTP/FTP and QoS (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "Network services: DHCP, DNS, NAT/PAT, ACLs, SNMP, FTP/TFTP, QoS" (ACLs move to Module 8).
(function(){
const L = [];

// ---------- Module 7 · Lesson 1 ----------
L.push({
id:"svc-dhcp", mins:95, level:"Beginner+ · builds on Modules 1–6",
t:"IP services and DHCP — how every device gets its address",
html:`
${K.goals([
  "Explain what IP services are, why every network needs them, and which question each Module 7 service answers.",
  "Describe how a PC gets an address with DHCP, message by message: Discover, Offer, Request, Ack — which are broadcasts, which ports, and why.",
  "Explain leases, renewal at 50% and 87.5%, release, and what a 169.254 (APIPA) address proves.",
  "Configure a Cisco router as a DHCP server: excluded addresses, a pool, network, default-router, dns-server, domain-name and lease.",
  "Verify and troubleshoot DHCP from both ends: <code>show ip dhcp binding</code>, <code>pool</code> and <code>conflict</code> on IOS; <code>ipconfig /all</code>, <code>/release</code> and <code>/renew</code> on Windows.",
])}
${K.pre(["Module 3: IPv4 addresses, masks, network and broadcast addresses, private ranges.","Modules 1–2 and 4: broadcasts, MAC addresses, ARP — and that a VLAN is one broadcast domain.","Module 5: routers route between subnets but never forward broadcasts.","Module 2: the IOS command line, configuration modes and the console cable."])}

<h2>Why this matters at work</h2>
<p>Thursday afternoon at a managed-service provider in Lagos. A logistics client opens a new branch on Monday: forty laptops, six printers, desk phones and guest Wi-Fi. Cabling and routing to head office are done (Module 5). Your senior engineer hands you the checklist that turns &ldquo;packets can move&rdquo; into &ldquo;people can work&rdquo;: addresses for every device, names that resolve, internet for private addresses, one correct time, central logs, monitoring, config backups and voice that doesn't stutter.</p>
<p>Every line is an <b>IP service</b>, and the first fails loudest: if laptops can't get an address, forty people tell the helpdesk &ldquo;the internet is down&rdquo; at 08:01. This lesson maps the services, then takes DHCP apart: how a laptop with no address gets one, how a Cisco router hands them out, and how to read the evidence when it doesn't.</p>

<h2>IP services: the jobs every network runs on top of routing</h2>
${K.remember(`<b>The rule in one line:</b> routing moves a packet from one network to another; <b>IP services</b> are what make a routed network usable and manageable: settings for devices, names, shared public addresses, time, logs, health checks, backups and priority on a busy link.`)}
<p>Modules 1–6 built the roads. Without services on top, every laptop needs an engineer to type its address, users must remember server addresses, two routers' logs disagree about when an outage started, and a dead router is rebuilt from memory.</p>
${K.svg("0 0 760 310",
  K.txt(20,18,"Routing moves packets. IP services make the network usable and manageable.",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("laptop",70,58,"LAPTOP","needs an address")+K.dev("switch",250,58,"SW1","")+K.dev("router",430,58,"R1","gateway · NAT")+K.dev("cloud",650,58,"ISP / INTERNET","")+
  K.link(92,60,222,60)+K.link(278,60,404,60)+K.link(456,60,624,60)+
  K.box(20,130,174,52,"DHCP","address, gateway, DNS · L1–2",true)+K.box(202,130,174,52,"DNS","names → addresses · L3")+K.box(384,130,174,52,"NAT / PAT","share public IPv4 · L4–5")+K.box(566,130,174,52,"NTP","one correct clock · L6")+
  K.box(20,196,174,52,"Syslog","collect every log · L6")+K.box(202,196,174,52,"SNMP","poll health, get alerts · L7")+K.box(384,196,174,52,"TFTP / FTP","back up configs · L7")+K.box(566,196,174,52,"QoS","voice and video first · L8")+
  K.txt(380,276,"Each service answers a question routing can't: who am I, what is that name's address,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,294,"how do fifty laptops share one public address, what time is it, what happened, is it healthy?",{mid:true,c:"fg",s:11,f:"body"}),
  "The Module 7 map. DHCP is the first service a device meets: without an address it can't use the others.")}
<p>This module covers CCNA 200-301 domain 4, &ldquo;IP Services&rdquo; (about a tenth of the v1.1 exam). Most are small protocols on ${K.g("UDP","User Datagram Protocol (Module 1): connectionless transport — no handshake, no retransmission. Small request/reply services prefer it.")}: one short question, one short answer.</p>
<div class="tablewrap"><table>
<tr><th>Service</th><th>The question it answers</th><th>Runs on</th><th>Lesson</th></tr>
<tr><td><b>DHCP</b></td><td>&ldquo;What address, mask, gateway and DNS server should I use?&rdquo;</td><td>UDP 67 (server), 68 (client)</td><td>1–2</td></tr>
<tr><td><b>DNS</b></td><td>&ldquo;What is the address of portal.example.com?&rdquo;</td><td>UDP 53 (TCP 53 for large answers)</td><td>3</td></tr>
<tr><td><b>NAT / PAT</b></td><td>&ldquo;How do private addresses reach the internet?&rdquo;</td><td>a router feature — no port of its own</td><td>4–5</td></tr>
<tr><td><b>NTP</b></td><td>&ldquo;What is the exact time?&rdquo;</td><td>UDP 123</td><td>6</td></tr>
<tr><td><b>${K.g("Syslog","The standard way devices send log messages (&ldquo;interface down&rdquo;, &ldquo;config changed&rdquo;) to a central log server. Lesson 6.")}</b></td><td>&ldquo;What happened, on which device, and when?&rdquo;</td><td>UDP 514</td><td>6</td></tr>
<tr><td><b>SNMP</b></td><td>&ldquo;How busy and healthy is each device?&rdquo;</td><td>UDP 161 (polls), 162 (alerts)</td><td>7</td></tr>
<tr><td><b>TFTP / FTP</b></td><td>&ldquo;Where is the backup of this router's config?&rdquo;</td><td>TFTP UDP 69; FTP TCP 20/21</td><td>7</td></tr>
<tr><td><b>QoS</b></td><td>&ldquo;When the link is full, which packets go first?&rdquo;</td><td>a set of router and switch features</td><td>8</td></tr>
</table></div>
<p>A booting laptop needs them in order: <b>DHCP</b> (an address), <b>DNS</b> (names), <b>NAT</b> (the internet). The rest are the network looking after itself.</p>
${K.check({q:"After a router replacement at a branch, laptops get addresses and can ping 198.51.100.10 by its address, but every website name fails to load. Which IP service is the most likely fault?", o:["DHCP — the laptops have no address","DNS — names aren't being turned into addresses","NTP — the clocks are wrong","QoS — the link is congested"], a:1, why:"A ping by address proves the address, gateway and path. The failing step turns names into addresses: DNS (lesson 3). DHCP told the laptop which DNS server to ask, so check DNS Servers in ipconfig /all next."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Each ticket points at one IP service. Match the ticket with the service to investigate first.", pairs:[["New laptops show 169.254.x.x and can't reach anything","DHCP"],["ping 10.1.1.20 works but ping files.example.com says it can't find the host","DNS"],["Two routers' logs put the same outage 47 minutes apart","NTP"],["The NOC never received the 'interface down' message from the branch","Syslog"],["Calls break up whenever someone uploads a video","QoS"]], why:"1. What is asked? Which service each symptom belongs to. 2. Which rule? Each service answers one question — address, name, time, log, priority. 3. Apply it: 169.254 = no DHCP answer; address works but name fails = DNS; logs disagree on time = NTP; a missing log message = syslog; voice suffers under load = QoS."})}

<h2>DHCP in four messages: Discover, Offer, Request, Ack</h2>
${K.remember(`<b>The rule:</b> a device with no address <b>broadcasts</b> its question; a DHCP server in that broadcast domain offers an address; the client broadcasts which offer it takes; the server confirms. <b>D</b>iscover, <b>O</b>ffer, <b>R</b>equest, <b>A</b>ck — <b>${K.g("DORA","Discover, Offer, Request, Acknowledgement — the four DHCP messages a client with no address goes through. A memory aid, not a protocol name.")}</b>.`)}
<p>${K.g("DHCP","Dynamic Host Configuration Protocol (RFC 2131): a server hands out IPv4 addresses and settings to clients for a limited time.")} solves a chicken-and-egg problem: to ask for an address you have to talk, and to talk you need an address. The way out is a <b>broadcast</b>, which every device in the VLAN receives. A router receives it but never forwards it to another network (Module 5) — which decides where a DHCP server must be (lesson 2 covers relays).</p>
<p>DHCP has fixed ports at both ends: servers listen on <b>UDP 67</b> and clients on <b>UDP 68</b>. A fixed client port matters because a reply may itself be a broadcast, and only the DHCP client software, listening on 68, should take it. The exchange is called DORA:</p>
${K.svg("0 0 760 390",
  K.dev("pc",80,46,"HQ-PC14","no IPv4 address yet")+K.dev("router",680,46,"HQ-R1","DHCP server · 10.10.20.1")+
  K.link(80,104,80,356,"",true)+K.link(680,104,680,356,"",true)+
  K.arrow(84,132,676,132,"1 · DHCP DISCOVER — broadcast",true)+
  K.txt(380,150,"0.0.0.0:68 → 255.255.255.255:67 · “any DHCP server? my MAC is 0050.56a1.0c21”",{mid:true,s:10.5})+
  K.arrow(676,196,84,196,"2 · DHCP OFFER")+
  K.txt(380,214,"“you can have 10.10.20.21 /24 · gateway .1 · DNS 10.10.5.53 · 7 days”",{mid:true,s:10.5})+
  K.arrow(84,260,676,260,"3 · DHCP REQUEST — broadcast again",true)+
  K.txt(380,278,"“I'll take 10.10.20.21 from server 10.10.20.1” — every server hears which offer won",{mid:true,s:10.5})+
  K.arrow(676,324,84,324,"4 · DHCP ACK")+
  K.txt(380,342,"“it's yours for 7 days” — the PC now configures address, mask, gateway and DNS",{mid:true,s:10.5})+
  K.txt(380,378,"Coloured arrows are broadcasts. The Offer and Ack go to the client's MAC (or as a broadcast if the client asks for that).",{mid:true,s:11,f:"body"}),
  "DORA between a Windows PC and a Cisco router acting as DHCP server, on the same LAN. Client port 68, server port 67.")}
<h3>Message by message</h3>
${K.steps([
  ["1 · Discover — &ldquo;is there a DHCP server?&rdquo;", "Source <code>0.0.0.0</code> (no address yet), destination <code>255.255.255.255</code> (server unknown), frame to <code>ffff.ffff.ffff</code>. Inside: the PC's MAC and, if it had one before, the address it would like back. The switch floods it."],
  ["2 · Offer — &ldquo;you can have this&rdquo;", "Each server that hears it offers a free address and its settings. A Cisco router first <b>pings</b> that address (two pings by default) and skips it if anything answers. The Offer goes to the client's MAC, or as a broadcast if the client set the <i>broadcast flag</i>."],
  ["3 · Request — &ldquo;I'll take that one&rdquo;", "The client broadcasts again, naming the address and server it chose. <b>Why broadcast, when it knows the server?</b> There may have been several offers: every server must hear which won, so the losers put their addresses back. And the client still has no confirmed address."],
  ["4 · Ack — &ldquo;confirmed&rdquo;", `The chosen server records the ${K.g("binding","The DHCP server's record of which address is leased to which client (by MAC / client ID), and until when. IOS: show ip dhcp binding.")} and acknowledges. Only now does the client use the address (Windows ARPs for it first, to check nobody else has it).`],
])}
<p>A ${K.g("NAK","DHCP Negative Acknowledgement: the server refuses a Request — typically a laptop asking to keep an address from another subnet. The client starts again with a Discover.")} is the server saying &ldquo;no&rdquo; to a Request; a <b>Release</b> is the client handing an address back early (unicast).</p>
<h3>What an Offer carries: DHCP options</h3>
<p>The PC also needs its mask, gateway and DNS server. Those travel as numbered ${K.g("DHCP options","Numbered fields in a DHCP message that carry settings besides the address: 1 = subnet mask, 3 = router (default gateway), 6 = DNS servers, 15 = domain name, 51 = lease time.")}:</p>
<div class="tablewrap"><table>
<tr><th>Option</th><th>Carries</th><th>Windows shows it as</th><th>IOS pool command</th></tr>
<tr><td>1</td><td>Subnet mask</td><td>Subnet Mask</td><td>from <code>network</code></td></tr>
<tr><td>3</td><td>Router — the default gateway</td><td>Default Gateway</td><td><code>default-router</code></td></tr>
<tr><td>6</td><td>DNS servers</td><td>DNS Servers</td><td><code>dns-server</code></td></tr>
<tr><td>15</td><td>Domain name — the DNS suffix (lesson 3)</td><td>Connection-specific DNS Suffix</td><td><code>domain-name</code></td></tr>
<tr><td>51</td><td>Lease time</td><td>Lease Obtained / Lease Expires</td><td><code>lease</code></td></tr>
</table></div>
${K.remember(`<b>Ports:</b> the server is the lower number — <b>67 server, 68 client</b>. <b>Options:</b> <b>3</b> is the router, <b>6</b> the DNS (double the router), <b>15</b> the domain, <b>51</b> the lease.`)}
<h3>Watch it in the lab's frame log</h3>
<p>HQ-PC14 switched to <i>Obtain an IP address automatically</i>, as the benches' frame log shows it:</p>
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from HQ-PC14 (0050.56a1.0c21): "is there a DHCP server?"
DHCP Offer from HQ-R1: "you can have 10.10.20.21 255.255.255.0, gateway 10.10.20.1, DNS 10.10.5.53, lease 7 days" (pool HQ-STAFF)
DHCP Request (broadcast again) from HQ-PC14: "I'll take 10.10.20.21 from server 10.10.20.1" — broadcast, so any other server that made an offer knows it wasn't chosen
DHCP Ack from HQ-R1: lease confirmed — HQ-PC14 now uses 10.10.20.21`, "The lab's frame log (switch lines trimmed): the switch floods the Discover and Request, and sends the Offer and Ack only to the PC's port.")}
${K.dyk(`DHCP grew out of ${K.g("BOOTP","Bootstrap Protocol (RFC 951, 1985): DHCP's predecessor, which gave diskless workstations an address and a boot file.")} and kept its message format and ports — which is why port lists call 67 and 68 <code>bootps</code> and <code>bootpc</code>, and RFC 2131 still calls the forwarder a &ldquo;BOOTP relay agent&rdquo; (lesson 2 sets one up).`)}
${K.check({q:"Why does a DHCP client send its Discover from 0.0.0.0 to 255.255.255.255?", o:["Because DHCP only works with broadcasts","Because it has no address yet to use as a source, and doesn't know which server — or whether any — exists","Because 255.255.255.255 is the DHCP server's address","Because routers forward that address to the internet"], a:1, why:"0.0.0.0 means 'no address yet'; 255.255.255.255 reaches every device on the local network. Routers never forward it — hence relays (lesson 2)."})}
<h3>Same logic, new situation</h3>
<p>At a small office, a staff member plugs a home Wi-Fi router into a desk port. Now each PC that boots gets two Offers: one from the company router (10.30.4.0/24) and one from the home router (192.168.0.0/24). What decides which address a PC ends up with, and how does the other server find out?</p>
${K.hint(`The client takes one Offer — usually the first that arrives — and then sends a message that every server can hear.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which offer wins, and how the losing server learns it lost. <b>2. Which rule?</b> The client accepts one Offer (in practice the first to arrive) and <b>broadcasts</b> its Request naming the chosen server; every server that offered hears it. <b>3. Apply it:</b> whichever box answers faster wins that PC. Those PCs get 192.168.0.x and a useless gateway; the company router hears the Request name another server and returns its address to the pool. That's the rogue DHCP server in this lesson's case study.</p>`)}

<h2>Leases, renewal and release — and APIPA when nobody answers</h2>
${K.remember(`<b>The rule:</b> a DHCP address is <b>lent, not given</b>. The ${K.g("lease","How long a client may use a DHCP address before it must renew it. IOS default: 1 day.")} has a length; at <b>50%</b> (${K.g("T1","The renewal time: by default half the lease. The client asks its own server, by unicast, to extend the lease.")}) the client asks its own server to extend it; at <b>87.5%</b> (${K.g("T2","The rebinding time: by default 87.5% of the lease. With no answer from its server, the client broadcasts a Request that any DHCP server may answer.")}) it asks any server; at <b>100%</b> it must stop using the address.`)}
<p>Why lend? Laptops leave and phones visit; permanent addresses would fill a pool with devices long gone. An address that isn't renewed comes back by itself. Short leases recycle faster (guest Wi-Fi); long ones depend less on the server (desktops).</p>
${K.svg("0 0 760 180",
  K.txt(20,22,"A 1-day lease (the IOS default), on the client's clock",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(20,56,"lease starts",{s:11,f:"body"})+K.txt(380,56,"T1 = 50%",{mid:true,c:"fg",s:11})+K.txt(650,56,"T2 = 87.5%",{mid:true,c:"fg",s:11})+K.txt(740,56,"expires",{end:true,s:11,f:"body"})+
  K.band(20,64,360,34,"BOUND — uses the address")+K.band(380,64,270,34,"RENEWING — unicast to its server","var(--panel2)")+K.band(650,64,90,34,"REBIND","var(--panel2)")+
  K.txt(20,118,"0 h",{s:11})+K.txt(380,118,"12 h",{mid:true,s:11})+K.txt(650,118,"21 h",{mid:true,s:11})+K.txt(740,118,"24 h",{end:true,s:11})+
  K.txt(380,146,"T1: the client asks ITS server (unicast) to extend the lease. T2: still no answer, so it broadcasts to ANY server.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,166,"At 100% with no answer it must stop using the address and start again with a Discover.",{mid:true,s:11,f:"body"}),
  "Lease timers. A successful renewal at T1 restarts the clock, so a healthy client never reaches T2.")}
<p>A renewal is two messages: a <b>unicast</b> Request and an Ack — no Discover, no Offer. If the server is down at T1 the client keeps working and retries.</p>
<h3>The Windows side: ipconfig /all, /release and /renew</h3>
<p><code>ipconfig /all</code> shows the DHCP picture, <code>ipconfig /release</code> hands the address back (a Release), and <code>ipconfig /renew</code> asks for one — a unicast Request if the PC holds a lease, a full DORA if not. HQ-PC14 again:</p>
${K.out(`C:\\Users\\tunde>ipconfig /all
...
Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : corp.example.com
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.10.20.21(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Monday, October 12, 2026 8:30:00 AM
   Lease Expires . . . . . . . . . . : Monday, October 19, 2026 8:30:00 AM
   Default Gateway . . . . . . . . . : 10.10.20.1
   DHCP Server . . . . . . . . . . . : 10.10.20.1
   DNS Servers . . . . . . . . . . . : 10.10.5.53
...`, "A DHCP client with a 7-day lease, trimmed to the DHCP lines (the lab prints the same fields as real Windows 10/11).")}
<ul>
<li><b>DHCP Enabled: Yes</b> — set to obtain automatically. A static PC says <code>No</code>, and <code>/release</code> / <code>/renew</code> refuse to run.</li>
<li><b>Lease Obtained / Lease Expires</b> — option 51 in action: seven days. Halfway through — Thursday evening — it renews by itself.</li>
<li><b>Default Gateway</b> (3), <b>DNS Servers</b> (6), <b>DNS Suffix</b> (15) — the pool's settings as sent. Wrong here = fix the server.</li>
<li><b>DHCP Server</b> — who gave this lease; it names any unexpected server.</li>
</ul>
${K.out(`C:\\Users\\tunde>ipconfig /release

Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::250:56ff:fea1:c21%4
   Default Gateway . . . . . . . . . :

C:\\Users\\tunde>ipconfig /renew
...
   IPv4 Address. . . . . . . . . . . : 10.10.20.21
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.10.20.1`, "After /release: no IPv4 address. /renew runs a full DORA, asks for its old address and gets it back.")}
${K.tip(`<code>ipconfig /release</code> cuts the PC off IPv4 until <code>/renew</code> succeeds. On a PC you reach over remote desktop, run <code>ipconfig /renew</code> alone — or both on one line, <code>ipconfig /release &amp;&amp; ipconfig /renew</code>, so the renew still runs after you're cut off.`)}
<h3>APIPA: what 169.254 really means</h3>
<p>If no Offer arrives, Windows gives itself an ${K.g("APIPA","Automatic Private IP Addressing: when DHCP gets no answer, Windows picks an address in 169.254.0.0/16 for itself (RFC 3927 link-local addressing). It works only with other such hosts on the same link.")} address: a random address in <b>169.254.0.0/16</b> (RFC 3927 keeps the first and last /24 aside, so 169.254.1.0–169.254.254.255), mask <b>255.255.0.0</b>, <b>no default gateway</b>. It ARPs to check nobody else has it, and keeps asking DHCP — Microsoft documents a retry every five minutes.</p>
${K.out(`C:\\Users\\tunde>ipconfig

Windows IP Configuration

Ethernet adapter Ethernet:
...
   Autoconfiguration IPv4 Address. . : 169.254.9.74
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :

C:\\Users\\tunde>ipconfig /renew

Windows IP Configuration

An error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out.`, "APIPA: Autoconfiguration IPv4 Address, a /16 mask, no gateway; /renew confirms no server answered.")}
<p>A 169.254 address proves the adapter is on DHCP (static PCs never get one), <b>the link is up</b> (an unplugged cable shows <code>Media disconnected</code>), and <b>no Offer arrived</b>. So ask &ldquo;why did no server answer?&rdquo; — no server or pool for this subnet, a full pool, no relay (lesson 2), or the port in the wrong VLAN (Module 4). Two APIPA PCs on one switch can even ping each other, which can make it look like &ldquo;the network works&rdquo;.</p>
${K.mistake(`Reading 169.254 as a cable problem and swapping patch leads. APIPA means the link worked and DHCP didn't — check the port's VLAN and the server.`)}
${K.check({q:"A PC received a 4-hour lease at 09:00. When does it first try to renew, and how does it send that request?", o:["At 11:00, as a unicast Request to the server that gave it the lease","At 11:00, as a broadcast Discover","At 12:30, as a broadcast Request to any server","At 13:00, after the lease has expired"], a:0, why:"T1 = 50% of 4 h → 11:00, a unicast Request to its own server. Only at T2 (87.5%, 12:30) does it broadcast."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A guest-Wi-Fi pool is set to lease 0 6 (6 hours). A visitor's phone gets its lease at 10:00, and the router then loses power until evening. At what times (24-hour clock) does the phone first try to renew with its own server (T1), start broadcasting to any server (T2), and lose its address?", fields:[{label:"T1 (renew, unicast)", a:["13:00","1300","13.00","1pm","1 pm","1:00pm","1:00 pm","13:00 h"]},{label:"T2 (rebind, broadcast)", a:["15:15","1515","15.15","3:15pm","3:15 pm","3.15pm"]},{label:"Lease expires", a:["16:00","1600","16.00","4pm","4 pm","4:00pm","4:00 pm"]}], why:"1. What is asked? The three lease timers for a 6-hour lease starting at 10:00. 2. Which rule? T1 = 50%, T2 = 87.5%, expiry = 100% of the lease. 3. Apply it: 50% of 6 h = 3 h → 13:00; 87.5% of 6 h = 5 h 15 min → 15:15; 100% → 16:00. With the router dead, both attempts fail and at 16:00 the address must go."})}

<h2>Configuring a Cisco router as a DHCP server</h2>
${K.remember(`<b>The rule:</b> a router answers a Discover only from a <b>pool whose <code>network</code> contains the address of the interface the Discover arrived on</b>. It hands out that network minus your <b>exclusions</b>, with the options you put in the pool.`)}
<p>On small sites the router — already on every LAN as the gateway — is often the DHCP server. IOS has it built in and on (<code>service dhcp</code>), idle until you give it a ${K.g("pool","A named set of addresses and settings a DHCP server hands out for one subnet. IOS: ip dhcp pool NAME. Windows Server calls it a scope.")}, which is an address plan written down:</p>
${K.svg("0 0 760 180",
  K.txt(20,22,"One /24, three jobs: HQ staff LAN 10.10.20.0/24",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(275,58,"ip dhcp excluded-address 10.10.20.1 10.10.20.20",{mid:true,c:"fg",s:11})+K.txt(530,58,"the pool hands these out",{mid:true,c:"accent",s:11,f:"body"})+
  K.band(20,66,60,36,".0 net","var(--panel2)")+K.band(80,66,90,36,".1 gateway","var(--panel2)")+K.band(170,66,210,36,".2–.20 statics","var(--panel2)")+K.band(380,66,300,36,".21–.254 leased by DHCP")+K.band(680,66,60,36,".255","var(--panel2)")+
  K.txt(380,128,"network 10.10.20.0 255.255.255.0 → the pool covers .1–.254 (network and broadcast addresses are never leased)",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,150,"Excluded addresses are never offered: list the gateway and every static device before the pool goes live.",{mid:true,s:11,f:"body"}),
  "An address plan turned into DHCP (not to scale).")}
<h3>Worked example: HQ's staff LAN</h3>
<p>The plan: staff LAN 10.10.20.0/24 on HQ-R1 Gi0/0 (gateway .1); statics .2–.20; DNS 10.10.5.53; domain corp.example.com; desktops rarely move, so a 7-day lease.</p>
${K.steps([
  ["Exclude first — in global configuration", "<code>ip dhcp excluded-address 10.10.20.1 10.10.20.20</code> (one address alone also works). Exclusions are global — they apply to every pool. Enter them <b>before</b> the pool, so no client can lease a static address in between."],
  ["Create the pool", "<code>ip dhcp pool HQ-STAFF</code>. The prompt becomes <code>HQ-R1(dhcp-config)#</code>; the name is just a label."],
  ["Tie it to the LAN with <code>network</code>", "<code>network 10.10.20.0 255.255.255.0</code> (or <code>/24</code>). Two jobs: the address range, and the match — Discovers arriving on Gi0/0 (10.10.20.1 is inside 10.10.20.0/24) use this pool."],
  ["Add the options", "<code>default-router 10.10.20.1</code> (option 3) · <code>dns-server 10.10.5.53</code> (option 6; up to eight, in order) · <code>domain-name corp.example.com</code> (option 15). Without <code>default-router</code>, clients reach only their own subnet."],
  ["Set the lease", "<code>lease 7</code> = 7 days. Format <code>lease days [hours] [minutes]</code>: <code>lease 0 8</code> = 8 hours; <code>lease infinite</code>. Default 1 day."],
  ["Verify", "<code>show running-config | section dhcp</code> (only the DHCP lines) and <code>show ip dhcp pool</code>; then test from a PC."],
])}
${K.out(`HQ-R1#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
HQ-R1(config)#ip dhcp excluded-address 10.10.20.1 10.10.20.20
HQ-R1(config)#ip dhcp pool HQ-STAFF
HQ-R1(dhcp-config)#network 10.10.20.0 255.255.255.0
HQ-R1(dhcp-config)#default-router 10.10.20.1
HQ-R1(dhcp-config)#dns-server 10.10.5.53
HQ-R1(dhcp-config)#domain-name corp.example.com
HQ-R1(dhcp-config)#lease 7
HQ-R1(dhcp-config)#end
HQ-R1#show running-config | section dhcp
ip dhcp excluded-address 10.10.20.1 10.10.20.20
ip dhcp pool HQ-STAFF
 network 10.10.20.0 255.255.255.0
 default-router 10.10.20.1
 dns-server 10.10.5.53
 domain-name corp.example.com
 lease 7`, "The whole server in seven lines: exclusions first, then each pool with its settings indented.")}
${K.tip(`On a live LAN, type the options before <code>network</code>. A pool answers the moment it has a network, so a PC asking mid-typing may get no gateway — and keep it until it renews.`)}
${K.mistake(`Forgetting the exclusions. IOS skips its own interface addresses and pings before offering — but a printer switched off overnight doesn't answer, so a laptop gets its address and at 08:00 the two fight. Exclude the gateway and every static, kept in one block.`)}
${K.when([
  ["Static address, typed on the device","Routers, switch management, servers, the DHCP and DNS servers","Works when DHCP is down; others point at it","Laptops, phones, anything numerous or mobile"],
  ["DHCP reservation (same address for this MAC every time)","Printers, cameras, access points","Fixed address, recorded in one place","It must work before DHCP is up (IOS: a host pool — not covered here)"],
  ["Dynamic DHCP from a pool","Laptops, desktops, phones, guests","Zero typing; addresses return when leases end","Anything others must find at a fixed address"],
], "Static, reserved or dynamic?")}
<h3>Try it: a DHCP server for a dental clinic</h3>
<p>The clinic's LAN is a <b>/25</b>, 172.16.40.0 (usable .1–.126). Router .1; X-ray workstation, printers and card terminal .2–.15; DNS 172.16.40.10 and .11; domain clinic.example.com; 12-hour shifts, so 12-hour leases.</p>
${K.term({env:"ios2", title:"CLINIC-R1 — build a pool for a /25", opts:{kind:"router", host:"CLINIC-R1", model:"C1111-4P", motd:"CLINIC-R1 — console session (lab router, no enable secret)."},
  setup:env=>{ env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Work out the mask and the excluded range before you type.",
  tasks:[
    {text:"LAN interface: <code>interface g0/0</code>, <code>ip address 172.16.40.1 255.255.255.128</code>, <code>no shutdown</code>, then <code>exit</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/0"]; return i.ip==="172.16.40.1" && i.mask==="255.255.255.128" && !i.shut; }},
    {text:"Keep the router and the clinic's static devices out of the pool: one <code>ip dhcp excluded-address</code> line for 172.16.40.1 to 172.16.40.15", done:e=>{ const N=ip=>ip.split(".").reduce((a,o)=>a*256+(+o),0); return e.dhcp.excluded.some(r=>r[0]===N("172.16.40.1") && r[1]===N("172.16.40.15")); }},
    {text:"Create <code>ip dhcp pool CLINIC-STAFF</code> and give it the /25: <code>network 172.16.40.0 255.255.255.128</code>", done:e=>{ const p=e.dhcp.pools["CLINIC-STAFF"]; return !!p && p.net===2886739968 && p.len===25; }},
    {text:"Options: gateway 172.16.40.1 (<code>default-router</code>), both DNS servers on one <code>dns-server</code> line (172.16.40.10 first), and <code>domain-name clinic.example.com</code>", done:e=>{ const p=e.dhcp.pools["CLINIC-STAFF"]; return !!p && p.routers[0]==="172.16.40.1" && p.dns.join()==="172.16.40.10,172.16.40.11" && p.domain==="clinic.example.com"; }},
    {text:"A 12-hour lease: <code>lease 0 12</code> (days, then hours)", done:e=>{ const p=e.dhcp.pools["CLINIC-STAFF"]; return !!p && Array.isArray(p.lease) && p.lease.join()==="0,12,0"; }},
    {text:"<code>end</code>, then <code>show running-config | section dhcp</code> and <code>show ip dhcp pool</code>. How many addresses can this pool actually lease? (Total minus Excluded.)", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+run\S*.*\|\s*sec\S*\s+dhcp/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+dhcp\s+pool/i.test(h))},
  ],
  win:"A complete DHCP server for a /25: the static block excluded first, a pool tied to the LAN by its network, gateway, two DNS servers, the suffix and a 12-hour lease. show ip dhcp pool says Total 126, Excluded 15 — so 111 addresses for clients.",
  solve:["enable","configure terminal","interface g0/0","ip address 172.16.40.1 255.255.255.128","no shutdown","exit","ip dhcp excluded-address 172.16.40.1 172.16.40.15","ip dhcp pool CLINIC-STAFF","network 172.16.40.0 255.255.255.128","default-router 172.16.40.1","dns-server 172.16.40.10 172.16.40.11","domain-name clinic.example.com","lease 0 12","end","show running-config | section dhcp","show ip dhcp pool"]})}
${K.hint(`A /25 mask is 255.255.255.128. The excluded range is two addresses on one line: the first and the last. <code>lease 0 12</code> means 0 days and 12 hours.`)}
${K.check({q:"A router has pool A (network 10.30.1.0 255.255.255.0) and pool B (network 10.30.2.0 255.255.255.0). Its G0/1 interface is 10.30.2.1/24. A PC on G0/1's LAN sends a Discover. What happens?", o:["The router offers from pool A, the first pool configured","The router offers from pool B, because 10.30.2.1 is inside 10.30.2.0/24","The router offers from both pools","The router ignores it, because the pools aren't applied to interfaces"], a:1, why:"IOS never 'applies' a pool to an interface. It matches the receiving interface's address (10.30.2.1) against each pool's network; pool B contains it. No match = silence."})}
<h3>Same logic, new situation</h3>
<p>A branch LAN is <b>10.8.12.64/26</b>. The router takes the first usable address; printers and access points take the next ten. Write the exclusion and the pool's <code>network</code> and <code>default-router</code> lines, and say how many addresses are left for clients.</p>
${K.hint(`Find the usable range first: a /26 is a block of 64 starting at .64. Then the router is the first usable address, and ten more follow it.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Three commands and a count. <b>2. Which rule?</b> The pool's <code>network</code> is the subnet address and mask; exclusions cover the gateway and statics; leasable = usable − excluded. <b>3. Apply it:</b> 10.8.12.64/26 runs .64–.127: network .64, broadcast .127, usable .65–.126 (62 addresses). Router .65, statics .66–.75:</p>
<p><code>ip dhcp excluded-address 10.8.12.65 10.8.12.75</code><br><code>ip dhcp pool BRANCH</code><br><code>network 10.8.12.64 255.255.255.192</code><br><code>default-router 10.8.12.65</code></p>
<p>Excluded: 11 addresses, so 62 − 11 = <b>51 leasable</b>. The trap: <code>network 10.8.12.0</code> is a different /26, which the .65 interface wouldn't match.</p>`)}

<h2>Verifying DHCP: bindings, pools and conflicts</h2>
${K.remember(`<b>The rule:</b> check both ends: the <b>client</b> says what it got (<code>ipconfig /all</code>); the <b>server</b> says what it handed out (<code>show ip dhcp binding</code>), how full it is (<code>show ip dhcp pool</code>) and what it refused (<code>show ip dhcp conflict</code>).`)}
<h3>show ip dhcp binding — who has what</h3>
${K.out(`HQ-R1#show ip dhcp binding
Bindings from all pools not associated with VRF:
IP address      Client-ID/              Lease expiration        Type       State      Interface
                Hardware address/
                User name
10.10.20.21     0100.5056.a10c.21       Oct 19 2026 08:30 AM    Automatic  Active     GigabitEthernet0/0`, "One lease. Seven days from Monday 08:30.")}
<ul>
<li><b>IP address</b> — the leased address.</li>
<li><b>Client-ID</b> — <code>01</code> (Ethernet) + the MAC, regrouped in fours: <code>0100.5056.a10c.21</code> is 00-50-56-A1-0C-21. That's how you find a binding's owner.</li>
<li><b>Lease expiration</b>; <b>Type Automatic</b> = from the pool (reservations show <code>Manual</code>); <b>Interface</b> where the Discover arrived.</li>
</ul>
<p>Bindings live in memory, not the configuration: after a reload they're gone (unless a database agent saves them — beyond CCNA). Clients keep their addresses and the router re-learns them as they renew.</p>
<h3>show ip dhcp pool — how full is it?</h3>
${K.out(`HQ-R1#show ip dhcp pool

Pool HQ-STAFF :
 Utilization mark (high/low)    : 100 / 0
 Subnet size (first/next)       : 0 / 0
 Total addresses                : 254
 Leased addresses               : 1
 Excluded addresses             : 20
 Pending event                  : none
 1 subnet is currently in the pool :
 Current index        IP address range                    Leased/Excluded/Total
 10.10.20.22          10.10.20.1       - 10.10.20.254      1     / 20    / 254`, "Total 254 = every usable address in the /24. Excluded 20: the range excluded by hand. Free: 254 − 1 − 20 = 233.")}
<ul>
<li><b>Free = Total − Leased − Excluded.</b> At zero the pool is <b>exhausted</b>: newcomers get APIPA, existing clients carry on.</li>
<li><b>Current index</b> — the next address to try (<code>0.0.0.0</code> once nothing is free); <b>IP address range</b> — from <code>network</code>: if it doesn't match the LAN, nothing there leases.</li>
</ul>
<h3>show ip dhcp conflict — the addresses it refused</h3>
<p>Later that morning someone set a camera recorder to 10.10.20.22 by hand — inside the pool. Then the next laptop booted:</p>
${K.out(`HQ-R1#show ip dhcp conflict
IP address        Detection method   Detection time          VRF
10.10.20.22       Ping               Oct 12 2026 09:05 AM
HQ-R1#show logging | include DHCPD
*Oct 12 09:05:12.548: %DHCPD-4-PING_CONFLICT: DHCP address conflict:  server pinged 10.10.20.22.`, "The router pinged .22 before offering it, got a reply, set it aside and offered .23 instead. Until cleared, a conflict address counts as Excluded: show ip dhcp pool now says Excluded 21.")}
<p>A conflict is a clue: a device sits in the pool without a lease. Move it into the static range or exclude its address, then <code>clear ip dhcp conflict *</code> empties the list. Its partner <code>clear ip dhcp binding *</code> (or one address) makes the server forget leases; clients aren't told and keep their addresses until they renew.</p>
${K.dyk(`Two checks guard against duplicates: the <b>server</b> pings before offering, and the <b>client</b> ARPs after the Ack. If the ARP gets a reply, the client sends a DHCP <b>Decline</b> and starts over, and the server records a conflict.`)}
<h3>Hands-on: watch DORA, a conflict and APIPA happen</h3>
<p>A training centre: TC-R1 serves the staff LAN, but the new training room has no pool yet. Keep the frame log open.</p>
${K.bench({id:"m7-dora", points:80, openLog:true, from:"CCNA · Module 7 · lesson 1", title:"watch DORA, the ping check and APIPA — then give the training room a pool", viewBox:"0 0 760 370",
  intro:"<b>Design:</b> staff LAN 192.168.50.0/24 on TC-R1 Gi0/0 (gateway .1, statics .1–.20 excluded, pool STAFF, DNS 192.168.50.10, domain training.example.com); training room 192.168.60.0/24 on Gi0/1 (gateway .1, statics .1–.10) — no pool yet. PC-A has a static address today; the printer was set to 192.168.50.21 by hand. Console on TC-R1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab notes:</b> the clock stands still and leases never expire; a PC set to automatic asks again whenever the network changes (real Windows: about every five minutes).",
  devices:[
    {id:"r1", kind:"router", label:"TC-R1", x:300, y:20, config:e=>{ ["en","conf t","hostname TC-R1","no ip domain-lookup","int g0/0","description STAFF LAN","ip address 192.168.50.1 255.255.255.0","no shut","int g0/1","description TRAINING ROOM","ip address 192.168.60.1 255.255.255.0","no shut","exit",
      "ip dhcp excluded-address 192.168.50.1 192.168.50.20","ip dhcp pool STAFF","network 192.168.50.0 255.255.255.0","default-router 192.168.50.1","dns-server 192.168.50.10","domain-name training.example.com","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"SW1", x:20, y:130},
    {id:"pca", kind:"pc", label:"PC-A", x:20, y:260, ip:"192.168.50.30", mask:"255.255.255.0", gw:"192.168.50.1", mac:"0050.56a7.1a2b"},
    {id:"prn", kind:"printer", label:"PRINTER", x:160, y:260, ip:"192.168.50.21", mask:"255.255.255.0", gw:"192.168.50.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:300, y:260},
    {id:"pct", kind:"pc", label:"PC-T", x:600, y:150, dhcp:true, mac:"0050.56a7.6c01"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"pca:eth", b:"sw:g2"}, {type:"cat6", a:"prn:eth", b:"sw:g3"}, {type:"cat6", a:"pct:eth", b:"r1:g1"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"PC-A: open its IP settings and choose <b>Obtain an IP address automatically</b>. Read the four DHCP messages in the frame log — which two were flooded by SW1, and which address was offered?", done:B=>!!Bench.leased(B,"pca")},
    {text:"On PC-A run <code>ipconfig /all</code>: find the DHCP Server, Lease Obtained / Lease Expires and DNS Servers. The pool starts at .21 — why did PC-A get a different address? (The frame log's ping line says.)", done:B=>!!Bench.leased(B,"pca") && Bench.tried(B,"pca",/ipconfig\s+\/all/i)},
    {text:"Console to TC-R1, <code>enable</code>, then <code>show ip dhcp binding</code> (match PC-A's Client-ID to its MAC) and <code>show ip dhcp conflict</code> (which address did the router refuse to offer, and how did it find out?)", done:B=>{ const h=B.devs.r1.env.history; return h.some(x=>/sh\S*\s+ip\s+dhcp\s+bin/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+dhcp\s+con/i.test(x)); }},
    {text:"On PC-A: <code>ipconfig /renew</code> (with a lease in hand — how many messages this time, and unicast or broadcast?), then <code>ipconfig /release</code> and <code>ipconfig /renew</code> again. Does PC-A get the same address back?", done:B=>!!Bench.leased(B,"pca") && Bench.tried(B,"pca",/ipconfig\s+\/release/i) && Bench.tried(B,"pca",/ipconfig\s+\/renew/i)},
    {text:"PC-T in the training room: run <code>ipconfig</code> — what kind of address is that? Then <code>ipconfig /renew</code> and read the frame log: what did TC-R1 do with the Discover, and why?", done:B=>Bench.tried(B,"pct",/^\s*ipconfig\s*$/i) && Bench.tried(B,"pct",/ipconfig\s+\/renew/i)},
    {text:"Give the training room its pool on TC-R1: exclude 192.168.60.1–192.168.60.10, then <code>ip dhcp pool TRAINING</code> with <code>default-router 192.168.60.1</code>, <code>dns-server 192.168.50.10</code> and, last, <code>network 192.168.60.0 255.255.255.0</code>. Done when PC-T holds a lease with gateway 192.168.60.1 and can ping PC-A (if PC-T leased before you'd added the gateway, <code>ipconfig /renew</code> on it)", done:B=>!!Bench.leased(B,"pct") && B.devs.pct.gw==="192.168.60.1" && !!B.devs.pca.ip && Bench.pinged(B,"pct",B.devs.pca.ip)},
  ],
  win:"You watched DORA (two broadcasts, two replies to PC-A's MAC), the ping check catching the hand-set printer, a two-message unicast renewal, release and a full DORA back to the same address, APIPA on a LAN with no pool — and the fix: a pool whose network matches the interface. PC-T leased by itself, because Windows keeps asking.",
  solve:[["dhcp","pca"],["pc","pca","ipconfig /all"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip dhcp binding"],["term","show ip dhcp conflict"],
    ["pc","pca","ipconfig /renew"],["pc","pca","ipconfig /release"],["pc","pca","ipconfig /renew"],
    ["pc","pct","ipconfig"],["pc","pct","ipconfig /renew"],
    ["term","configure terminal"],["term","ip dhcp excluded-address 192.168.60.1 192.168.60.10"],["term","ip dhcp pool TRAINING"],["term","default-router 192.168.60.1"],["term","dns-server 192.168.50.10"],["term","network 192.168.60.0 255.255.255.0"],["term","end"],
    ["pc","pct","ipconfig"],["pc","pct","ping 192.168.50.22"]]})}
${K.hint(`Task 2: the frame log's line between the Discover and the Offer starts &ldquo;TC-R1 pings each address before offering it&rdquo;. Task 5: an address starting 169.254 with mask 255.255.0.0 is Windows talking to itself. Task 6: the pool must contain Gi0/1's own address, 192.168.60.1.`)}
${K.check({q:"After a router reload, show ip dhcp binding is empty although the pool is configured and users are working normally. What explains it?", o:["The pool was deleted by the reload","Bindings are kept in memory, not in the configuration, so a reload forgets them; clients keep their addresses and the router re-learns them as they renew","Every client was given APIPA during the reload","DHCP needs copy running-config startup-config after each lease"], a:1, why:"Pools and options are saved configuration; bindings are live state. Clients still hold valid leases and renew at T1; the ping check protects addresses in use."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A shop router's pool is shown in the exhibit. How many more clients can get an address, and what is the prefix length of the pool's network?", ex:"SHOP-R1#show ip dhcp pool\n\nPool SHOP :\n Utilization mark (high/low)    : 100 / 0\n Subnet size (first/next)       : 0 / 0\n Total addresses                : 30\n Leased addresses               : 22\n Excluded addresses             : 5\n Pending event                  : none\n 1 subnet is currently in the pool :\n Current index        IP address range                    Leased/Excluded/Total\n 10.20.7.28           10.20.7.1        - 10.20.7.30        22    / 5     / 30", fields:[{label:"Free addresses", a:["3","three"]},{label:"Prefix length", a:["/27","27"]}], why:"1. What is asked? Free count and subnet size. 2. Which rule? Free = Total − Leased − Excluded; Total = usable addresses. 3. Apply it: 30 − 22 − 5 = 3. 30 usable means a block of 32: /27. A fourth new phone would show 169.254."})}

<h2>Troubleshooting DHCP: fingerprints and a ticket</h2>
${K.remember(`<b>The rule:</b> the client got <b>nothing</b> (APIPA), got <b>the wrong thing</b> (bad options, or the wrong server), or the server <b>can't use part of its pool</b> (conflicts, exhaustion). <code>ipconfig /all</code> on the client tells you which.`)}
<div class="tablewrap"><table>
<tr><th>Fault</th><th>The user sees</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td><b>No pool for the subnet</b> (or a typo in <code>network</code>)</td><td>169.254 on every DHCP device on that LAN</td><td><code>show ip dhcp pool</code> range doesn't contain the interface address</td><td>In the pool: <code>no network …</code>, then the right <code>network</code></td></tr>
<tr><td><b>Pool exhausted</b></td><td>Newcomers get 169.254; existing users fine</td><td>Leased + Excluded = Total; Current index <code>0.0.0.0</code></td><td>Shorter leases, a bigger subnet, or move guests to their own VLAN and pool</td></tr>
<tr><td><b>Wrong or missing <code>default-router</code></b></td><td>Address OK, local printer OK, nothing beyond</td><td>Default Gateway blank or wrong; <code>Destination host unreachable</code> from the PC's own address (wrong gateway) or <code>General failure</code> (none)</td><td>Fix the pool option; clients <code>ipconfig /renew</code></td></tr>
<tr><td><b>Wrong <code>dns-server</code></b></td><td>Ping by address works, names fail</td><td><code>ipconfig /all</code>: DNS Servers isn't your DNS server</td><td>Fix the option; renew (lesson 3)</td></tr>
<tr><td><b>Statics inside the pool</b> (exclusion missing or wrong)</td><td>Usually nothing — until a static device is off during the ping check</td><td>Entries in <code>show ip dhcp conflict</code>; %DHCPD-4-PING_CONFLICT in the log</td><td>Exclude the static block (<code>no ip dhcp excluded-address …</code> to replace a wrong line); <code>clear ip dhcp conflict *</code></td></tr>
<tr><td><b>Rogue DHCP server</b></td><td>Some PCs get a foreign subnet</td><td><code>ipconfig /all</code>: DHCP Server isn't yours</td><td>Find and remove it; DHCP snooping (security module)</td></tr>
</table></div>
${K.mistake(`Fixing the pool and walking away. A changed <code>default-router</code> or <code>dns-server</code> is sent <i>next time</i>; clients keep the old settings until they renew. Have users <code>ipconfig /renew</code> and check one with <code>ipconfig /all</code>.`)}
${K.exam(`Reading a DHCP question: first write down <b>1.</b> the interface the clients sit behind and its address (behind a relay, the relay's — lesson 2); <b>2.</b> whether a pool's <code>network</code> contains it; <b>3.</b> whether <code>default-router</code> and the exclusions sit in that subnet. Then the symptom: 169.254 = no Offer; right subnet but nothing beyond = options; a conflict = a static inside the pool. Traps: ports 67/68 swapped, and a pool &ldquo;applied to an interface&rdquo; — IOS has no such command.`)}
${K.job("“Monday: the new starters can't get on the network”",`
<p><b>The ticket.</b> 08:40 at a consultancy's office: &ldquo;Three new starters plugged in their laptops: No Internet. Everyone else is fine. The meeting-room PC, rebooted this morning, is broken too.&rdquo;</p>
<p><b>Questions first.</b> Who? Only devices that asked for an address <i>today</i>. What changed? Last week's three-day workshop put about forty visitors' laptops and phones on the staff Wi-Fi.</p>
<p><b>Checks.</b> On a new starter's laptop:</p>
${K.out(`C:\\Users\\ngozi>ipconfig /all
...
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   Autoconfiguration IPv4 Address. . : 169.254.142.17(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :
...`, "Trimmed. APIPA with DHCP enabled: the link is up and no Offer arrived.")}
<p>So the question moves to the server:</p>
${K.out(`FIRM-R1#show ip dhcp pool

Pool STAFF :
 Utilization mark (high/low)    : 100 / 0
 Subnet size (first/next)       : 0 / 0
 Total addresses                : 62
 Leased addresses               : 52
 Excluded addresses             : 10
 Pending event                  : none
 1 subnet is currently in the pool :
 Current index        IP address range                    Leased/Excluded/Total
 0.0.0.0              10.60.8.1        - 10.60.8.62        52    / 10    / 62
FIRM-R1#show running-config | section dhcp
ip dhcp excluded-address 10.60.8.1 10.60.8.10
ip dhcp pool STAFF
 network 10.60.8.0 255.255.255.192
 default-router 10.60.8.1
 lease 8`, "52 leased + 10 excluded = 62, and Current index 0.0.0.0: nothing left to offer — and 8-day leases.")}
<p><b>Diagnosis.</b> The /26 was sized for 35 staff; the visitors took the rest, and with 8-day leases their addresses won't return until later this week. <code>show ip dhcp binding</code>: dozens of Client-IDs not on the asset list.</p>
<p><b>Fix</b> (change approved by the office manager by phone):</p>
<ol>
<li><code>ip dhcp pool STAFF</code> → <code>lease 1</code>: from now on addresses come back within a day.</li>
<li>The visitors' leases were stale: <code>clear ip dhcp binding *</code>. Staff laptops keep their addresses and renew (at worst with a fresh DORA), and the ping check protects addresses in use. Where PCs block ping, clear the visitors' addresses one by one instead.</li>
<li>New starters: <code>ipconfig /renew</code> — they leased; the meeting-room PC leased by itself.</li>
</ol>
<p><b>Verify.</b> <code>show ip dhcp pool</code>: Leased 4 — the new starters and the meeting-room PC; staff laptops reappear in <code>show ip dhcp binding</code> as they renew (and any staff address the ping check hit shows in <code>show ip dhcp conflict</code>). A new starter's <code>ipconfig /all</code>: 10.60.8.x, DHCP Server 10.60.8.1, a one-day lease; email opens.</p>
<p><b>What you say.</b> &ldquo;The network has a limited number of addresses and last week's visitors were still holding them. I've freed them and shortened how long devices keep one. To stop it recurring I'm proposing a separate guest Wi-Fi.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;FIRM-R1 pool STAFF (10.60.8.0/26) exhausted (52/10/62), lease 8 d, visitors on staff SSID. Lease now 1 d; bindings cleared 08:58 (staff PCs answer ping); new starters OK. Change request to follow: guest SSID/VLAN with own pool.&rdquo;</i></p>`)}
<h3>Hands-on: since the move, the Ibadan laptops show 169.254</h3>
<p>The Ibadan office moved floors on Saturday; IB-R1's DHCP section was copied from the company template and edited by hand. This morning: &ldquo;No laptop can get on the network.&rdquo; Reproduce, read the evidence, change one thing, test.</p>
${K.bench({id:"m7-ibadan-dhcp", points:100, openLog:true, from:"CCNA · Module 7 · lesson 1", title:"Ibadan after the move — a pool that doesn't match the floor", viewBox:"0 0 760 370",
  intro:"<b>Design:</b> staff LAN 10.40.30.0/24 on IB-R1 Gi0/0, gateway 10.40.30.1; statics .1–.20 (the printer is 10.40.30.2); DHCP for the rest, DNS = FILES (10.40.50.10), domain ibadan.example.com. FILES is on the server LAN 10.40.50.0/24 on Gi0/1. Console on IB-R1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. Lab notes as in the last bench.",
  devices:[
    {id:"r1", kind:"router", label:"IB-R1", x:300, y:20, config:e=>{ ["en","conf t","hostname IB-R1","no ip domain-lookup","int g0/0","description STAFF LAN - new floor","ip address 10.40.30.1 255.255.255.0","no shut","int g0/1","description SERVER LAN","ip address 10.40.50.1 255.255.255.0","no shut","exit",
      "ip dhcp excluded-address 10.40.30.1","ip dhcp pool IBADAN-STAFF","network 10.40.31.0 255.255.255.0","default-router 10.40.30.254","dns-server 10.40.50.10","domain-name ibadan.example.com","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"IB-SW1", x:20, y:130},
    {id:"l1", kind:"laptop", label:"LAP-1", x:20, y:260, dhcp:true, mac:"0050.56b4.3001"},
    {id:"l2", kind:"laptop", label:"LAP-2", x:150, y:260, dhcp:true, mac:"0050.56b4.3002"},
    {id:"prn", kind:"printer", label:"PRINTER", x:280, y:260, ip:"10.40.30.2", mask:"255.255.255.0", gw:"10.40.30.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:420, y:260},
    {id:"srv", kind:"server", label:"FILES", x:600, y:150, ip:"10.40.50.10", mask:"255.255.255.0", gw:"10.40.50.1"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"l1:eth", b:"sw:g2"}, {type:"cat6", a:"l2:eth", b:"sw:g3"}, {type:"cat6", a:"prn:eth", b:"sw:g4"}, {type:"cat6", a:"srv:eth", b:"r1:g1"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the complaint: on LAP-1 run <code>ipconfig</code>, then <code>ipconfig /renew</code> with the frame log open. What did IB-R1 do when it heard the Discover — and what does that tell you about its pools?", done:B=>Bench.tried(B,"l1",/ipconfig\s+\/renew/i)},
    {text:"Console to IB-R1, <code>enable</code>. Compare <code>show ip interface brief</code> with <code>show running-config | section dhcp</code> and <code>show ip dhcp pool</code>. Fix the pool so it serves the floor Gi0/0 is really on (inside the pool: <code>no network</code> with the old value, then the right <code>network</code>). Done when both laptops hold leases", done:B=>{ const p=window.DHCP.poolFor(B.devs.r1.env.dhcp,"10.40.30.1"); return !!p && p.len===24 && !!Bench.leased(B,"l1") && !!Bench.leased(B,"l2"); }},
    {text:"The laptops lease now — but <code>ping 10.40.50.10</code> (FILES) from LAP-1 fails. Read LAP-1's <code>ipconfig /all</code>: which line breaks the design? Fix it in the pool, then <code>ipconfig /renew</code> on both laptops. Done when both have the right gateway and LAP-1 pings FILES", done:B=>B.devs.l1.gw==="10.40.30.1" && B.devs.l2.gw==="10.40.30.1" && Bench.pinged(B,"l1","10.40.50.10")},
    {text:"<code>show ip dhcp conflict</code>: which address did IB-R1 refuse to offer, and whose is it? The design keeps .1–.20 for statics, but only .1 is excluded. Replace the exclusion (<code>no ip dhcp excluded-address 10.40.30.1</code>, then one line for .1–.20), empty the conflict list with <code>clear ip dhcp conflict *</code>, and move both laptops out of the static range with <code>ipconfig /release</code> then <code>ipconfig /renew</code>. Done when both laptops hold addresses above .20 and LAP-2 pings FILES", done:B=>{ const N=ip=>ip.split(".").reduce((a,o)=>a*256+(+o),0), st=B.devs.r1.env.dhcp; const cov=st.excluded.some(r=>r[0]<=N("10.40.30.1") && r[1]>=N("10.40.30.20")); const hi=id=>{ const ip=Bench.leased(B,id); return !!ip && +ip.split(".")[3]>20; }; return cov && st.conflicts.length===0 && hi("l1") && hi("l2") && Bench.pinged(B,"l2","10.40.50.10"); }},
    {text:"Prove it from the server side with <code>show ip dhcp binding</code>, then save: <code>copy running-config startup-config</code>", done:B=>!!B.devs.r1.env.savedOnce && B.devs.r1.env.history.some(x=>/sh\S*\s+ip\s+dhcp\s+bin/i.test(x))},
  ],
  win:"Three template leftovers, three fingerprints: a pool network for the wrong floor (the router heard every Discover and had no pool to answer from — APIPA), a default-router nobody owns (addresses fine, nothing beyond the LAN until the laptops renewed), and an exclusion that covered only the gateway (the printer caught by the ping check). The laptops now hold addresses above the static block and FILES answers.",
  solve:[["pc","l1","ipconfig"],["pc","l1","ipconfig /renew"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show running-config | section dhcp"],["term","show ip dhcp pool"],
    ["term","configure terminal"],["term","ip dhcp pool IBADAN-STAFF"],["term","no network 10.40.31.0 255.255.255.0"],["term","network 10.40.30.0 255.255.255.0"],["term","end"],
    ["pc","l1","ipconfig"],["pc","l1","ping 10.40.50.10"],["pc","l1","ipconfig /all"],
    ["term","configure terminal"],["term","ip dhcp pool IBADAN-STAFF"],["term","default-router 10.40.30.1"],["term","end"],
    ["pc","l1","ipconfig /renew"],["pc","l2","ipconfig /renew"],["pc","l1","ping 10.40.50.10"],
    ["term","show ip dhcp conflict"],["term","configure terminal"],["term","no ip dhcp excluded-address 10.40.30.1"],["term","ip dhcp excluded-address 10.40.30.1 10.40.30.20"],["term","end"],["term","clear ip dhcp conflict *"],
    ["pc","l1","ipconfig /release"],["pc","l1","ipconfig /renew"],["pc","l2","ipconfig /release"],["pc","l2","ipconfig /renew"],["pc","l2","ping 10.40.50.10"],
    ["term","show ip dhcp binding"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: the pool's range in <code>show ip dhcp pool</code> should contain 10.40.30.1. Task 3: a ping that ends <code>Destination host unreachable</code> from the laptop's own address means it couldn't ARP its gateway. Task 4: excluding an address doesn't take it back from a client that already holds it — the laptop keeps it until it next renews, when IB-R1 answers with a DHCP <b>NAK</b> (that address is excluded now) and the laptop starts again with a Discover. <code>/release</code> then <code>/renew</code> moves it straight away with a fresh DORA; a plain <code>/renew</code> gets there too — look for the NAK in the frame log.`)}
${K.case("The bank branch where half the tellers vanished",`
<p>A bank branch in Kaduna, 10:15: some teller PCs can't reach core banking, others can. Rebooting sometimes fixes one — and sometimes breaks a working one.</p>
<p><b>The evidence.</b> On a broken PC, <code>ipconfig /all</code> shows IPv4 Address 192.168.0.103, Default Gateway 192.168.0.1 and <b>DHCP Server 192.168.0.1</b>. Working PCs show the branch LAN, 10.72.14.0/24, and DHCP Server 10.72.14.1 — two servers are answering, and each PC keeps the first Offer.</p>
<p><b>Finding it.</b> <code>arp -a</code> on the broken PC gives 192.168.0.1's MAC; <code>show mac address-table address</code> with that MAC on the access switch (Module 4) names the port: a back-office desk, where someone had plugged in a home Wi-Fi router whose DHCP server was on by default.</p>
<p><b>The fix.</b> Remove it; <code>ipconfig /release</code> and <code>/renew</code> on affected PCs. <b>Prevention:</b> <b>DHCP snooping</b> (the security module) trusts DHCP replies only on the uplink and drops Offers from desk ports. When users get a strange address, read the <b>DHCP Server</b> line first.</p>`)}
${K.myth([
  ["A 169.254 address means the cable is unplugged.","An unplugged cable shows Media disconnected. 169.254 means the link is up, DHCP is on, and no Offer arrived."],
  ["DHCP only gives out the IP address.","It sends the mask, default gateway, DNS servers, DNS suffix and lease time too — and wrong options break a PC just as surely as a wrong address."],
  ["ipconfig /renew always runs the full Discover–Offer–Request–Ack.","With a valid lease it sends one unicast Request and gets an Ack. Only a PC with no lease starts with a Discover."],
  ["A router passes DHCP broadcasts on to the server automatically.","Routers never forward broadcasts. A server on another subnet needs a relay — ip helper-address, lesson 2."],
])}
${K.dodont([
  "Write the address plan first: gateway, static block, pool range, DNS, lease.",
  "Exclude the gateway and every static device before the pool goes live.",
  "Start every DHCP ticket with ipconfig /all on an affected client.",
  "After changing pool options, renew a client and check its ipconfig /all.",
],[
  "Don't leave statics scattered through the pool and rely on the ping check.",
  "Don't run ipconfig /release on a PC you're reaching remotely.",
  "Don't copy a pool from another site without checking network, default-router and exclusions against this site's plan.",
])}
${K.check({q:"On one LAN, half the PCs have 10.72.14.x addresses from DHCP server 10.72.14.1; the other half have 192.168.1.x with DHCP Server 192.168.1.1, a box nobody recognises. What is the most likely cause?", o:["The pool on 10.72.14.1 is exhausted","A second, unauthorised DHCP server on the LAN is answering Discovers, and each PC keeps whichever Offer arrived first","The router is relaying to the wrong server","The PCs' DNS suffix is wrong"], a:1, why:"Exhaustion gives APIPA, not a different subnet. A second server answering, each client keeping one Offer, is the rogue-DHCP fingerprint."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A different branch, five different laptops. Match what each laptop's ipconfig /all shows with the most likely fault.", pairs:[["Autoconfiguration IPv4 Address 169.254.77.3, DHCP Enabled Yes, link up","No DHCP Offer reached it"],["IPv4 10.9.4.37, Default Gateway blank","The pool has no default-router"],["IPv4 10.9.4.38, Default Gateway 10.9.4.1, DNS Servers 10.9.9.99 (not a DNS server)","The pool's dns-server option is wrong"],["IPv4 192.168.0.12, DHCP Server 192.168.0.1 (not the branch router)","A rogue DHCP server answered first"],["Media State: Media disconnected","No link: cable, port or Wi-Fi association"]], why:"1. What is asked? The fault behind each client view. 2. Which rule? ipconfig /all tells you whether the client got nothing (APIPA), the wrong options, an address from the wrong server, or never had a link. 3. Apply it: APIPA with the link up = no Offer; blank gateway = option 3 missing; a wrong DNS server = option 6; a foreign DHCP Server = rogue; Media disconnected is Layer 1, not DHCP at all."})}

<h2>Interview corner</h2>
${K.hint(`Broadcast because it has no address; four messages; ports; why the Request is broadcast; what the lease carries.`)}
${K.reveal("“Walk me through how a laptop gets an IP address.”",`<p>"With DHCP. Having no address, it broadcasts a Discover from 0.0.0.0 to 255.255.255.255, UDP 68 to 67. A server on that segment — or reached through a relay — answers with an Offer: an address plus mask, gateway, DNS servers, domain and lease time; a Cisco server pings the address first. The laptop broadcasts a Request naming the offer it accepts, so other servers withdraw theirs, and the server confirms with an Ack and records the binding. The laptop ARP-checks the address, uses it, renews at half the lease by unicast and broadcasts at 87.5% if its server is silent."</p>`)}
${K.hint(`What 169.254 proves, then client side, then server side — in that order.`)}
${K.reveal("“A user's PC has a 169.254 address. What do you do?”",`<p>"169.254 is APIPA: DHCP is on, the link is up — otherwise it would say media disconnected — and no Offer arrived. I scope it: one PC or the whole LAN? One PC: check its switch port's VLAN and try ipconfig /renew. The whole LAN: on the router, show ip dhcp pool — is there a pool for that subnet, and is it full? — and, for a remote server, an ip helper-address. Afterwards I renew a client and check ipconfig /all shows the right address, gateway, DNS and DHCP server."</p>`)}
${K.hint(`Plan, exclusions, pool, network, options, lease, verify — and why the exclusion goes first.`)}
${K.reveal("“How would you set up DHCP on a Cisco router for a new office?”",`<p>"From the address plan: subnet, gateway, a static block, DNS, domain and lease. First ip dhcp excluded-address for the gateway and statics, before the pool exists, so nobody leases them. Then ip dhcp pool with network for the subnet — the router matches it to the receiving interface's address — plus default-router, dns-server, domain-name and lease. I verify with show ip dhcp pool, a test laptop's ipconfig /all and show ip dhcp binding, then save. For many sites I'd prefer a central server with ip helper-address on each LAN."</p>`)}

${K.recap([
  "IP services make a routed network usable and manageable: DHCP, DNS, NAT/PAT, NTP, syslog, SNMP, TFTP/FTP, QoS.",
  "DORA: Discover (broadcast, 0.0.0.0:68 → 255.255.255.255:67), Offer, Request (broadcast, so every server hears which offer won), Ack.",
  "A lease carries the address plus options: mask (1), gateway (3), DNS (6), domain (15), lease time (51). Renew at 50% by unicast, rebind at 87.5% by broadcast, stop at 100%.",
  "169.254.x.x (APIPA) = DHCP on, link up, no Offer: look at server, pool, VLAN or relay — not the cable.",
  "IOS: ip dhcp excluded-address first, then ip dhcp pool with network, default-router, dns-server, domain-name, lease (default 1 day). The receiving interface's address picks the pool.",
  "Verify both ends: ipconfig /all and show ip dhcp binding / pool / conflict. Free = Total − Leased − Excluded.",
  "A conflict = a static inside the pool; changed options reach clients when they renew; bindings don't survive a reload.",
])}
${K.next(`<b>Lesson 2 — DHCP across subnets, and the router as a DHCP client.</b> Routers never forward broadcasts, so a central server needs <code>ip helper-address</code>; the relay's giaddr picks the pool. Then what breaks — and a router leasing its own address from the ISP.`)}
`,
quiz:[
  {lvl:1, type:"order", q:"A laptop with no address joins the LAN. Put the DHCP messages in the order they are sent.", items:["Discover — from the client, broadcast","Offer — from the server","Request — from the client, broadcast","Acknowledgement — from the server"], why:"DORA: the client broadcasts a Discover; each server that can help replies with an Offer; the client broadcasts a Request naming the offer it accepts; the chosen server confirms with an Ack and only then does the client use the address."},
  {lvl:1, q:"Which UDP ports does DHCP use?", o:["Server 67, client 68","Server 68, client 67","Both server and client use 53","Server 69, client 68"], a:0, why:"DHCP servers listen on UDP 67 and clients on UDP 68 (inherited from BOOTP: bootps and bootpc). 53 is DNS, 69 is TFTP."},
  {lvl:1, q:"A Windows laptop shows Autoconfiguration IPv4 Address 169.254.37.112, mask 255.255.0.0, and no default gateway. What does that tell you first?", o:["The network cable is unplugged","The laptop is set to obtain an address automatically, its link is up, and no DHCP Offer reached it","A DHCP server gave it a private address","Someone typed a wrong static address"], a:1, why:"That is APIPA: Windows gave itself a 169.254 address because DHCP got no answer. An unplugged cable would show Media disconnected, and a static PC never gets APIPA. The next step is to find why no server answered."},
  {lvl:2, type:"multi", q:"A PC with no address gets its first lease. Which two of the PC's messages are broadcasts? (Choose two.)", o:["Discover","Offer","Request","Ack","Release"], a:[0,2], why:"The client broadcasts the Discover (it has no address and doesn't know the server) and the Request (so every server that offered learns which offer won). Offer and Ack come from the server. A Release is a unicast sent by a client that has an address."},
  {lvl:2, type:"match", q:"Match each IOS DHCP pool command with what it gives the client or the pool.", pairs:[["network 10.1.5.0 255.255.255.0","Which LAN the pool serves and the addresses it can hand out"],["default-router 10.1.5.1","The client's default gateway (option 3)"],["dns-server 10.1.9.53","The DNS server the client will ask (option 6)"],["domain-name corp.example.com","The DNS suffix added to short names (option 15)"],["lease 0 8","An 8-hour lease (option 51)"]], why:"network defines the range and, through the receiving interface's address, which LAN the pool answers; the rest become options in the Offer and Ack. lease takes days, hours, minutes — 0 8 is eight hours."},
  {lvl:2, type:"fill", q:"Write the global configuration command that stops the router offering 10.1.5.1 through 10.1.5.30.", fields:[{label:"Command", a:["ip dhcp excluded-address 10.1.5.1 10.1.5.30"], ios:true}], why:"ip dhcp excluded-address takes the first and last address of the range (or one address alone). It is a global command — not inside the pool — and is best entered before the pool so no client can lease those addresses."},
  {lvl:2, q:"New starters get 169.254 addresses; staff who were already connected are fine. Based on the exhibit, what is the cause?", ex:"FIRM-R1#show ip dhcp pool\n\nPool STAFF :\n Utilization mark (high/low)    : 100 / 0\n Subnet size (first/next)       : 0 / 0\n Total addresses                : 62\n Leased addresses               : 52\n Excluded addresses             : 10\n Pending event                  : none\n 1 subnet is currently in the pool :\n Current index        IP address range                    Leased/Excluded/Total\n 0.0.0.0              10.60.8.1        - 10.60.8.62        52    / 10    / 62", o:["The pool is exhausted: 52 leased plus 10 excluded uses all 62 addresses","The pool has no default-router","The router's LAN interface is down","The pool's network doesn't match the LAN"], a:0, why:"Free = Total − Leased − Excluded = 62 − 52 − 10 = 0 (hence Current index 0.0.0.0), so new clients get no Offer and fall back to APIPA while existing clients keep their leases. The range .1–.62 does match a /26 LAN, and existing clients working proves the interface is up. Fixes: shorter leases, a bigger subnet, or moving guests to their own pool."},
  {lvl:2, q:"Users on 10.20.0.0/24 can print to a printer on their own LAN but reach nothing else. The router's LAN address is 10.20.0.1 and nothing uses 10.20.0.254. Based on the exhibit, which fix is right?", ex:"C:\\Users\\ade>ipconfig /all\n...\n   DHCP Enabled. . . . . . . . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : 10.20.0.57(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.20.0.254\n   DHCP Server . . . . . . . . . . . : 10.20.0.1\n   DNS Servers . . . . . . . . . . . : 10.20.0.1", o:["In the router's pool set default-router 10.20.0.1, then have clients run ipconfig /renew","Add ip helper-address on the router's LAN interface","Exclude 10.20.0.254 from the pool","Give each PC a static address"], a:0, why:"The address and mask are fine and the server is the router, but option 3 points at an address nobody owns, so nothing leaves the subnet. Fix the pool's default-router; clients pick it up when they renew. A helper is for servers on other subnets, and excluding .254 changes nothing."},
  {lvl:3, q:"A pool is set to lease 0 8. A PC gets its lease at 08:00. The router serving the pool loses power from 11:00 to 17:30, and there is no other DHCP server. What does the user's ipconfig show at 16:30?", o:["The original address — Windows keeps it until the server returns","An Autoconfiguration IPv4 Address in 169.254.0.0/16 — the lease expired at 16:00","No IPv4 address at all, and Media disconnected","A new address from a different subnet"], a:1, why:"T1 = 12:00 (unicast renewal fails), T2 = 15:00 (broadcast rebind fails — no server), expiry = 16:00: the PC must stop using the address. Windows then falls back to APIPA and keeps trying DHCP; after 17:30 its next attempt gets a lease again. The link stays up throughout, so not Media disconnected."},
  {lvl:3, q:"Some PCs at a branch show IPv4 192.168.0.103, Default Gateway 192.168.0.1, DHCP Server 192.168.0.1. The branch LAN is 10.72.14.0/24, served by the router at 10.72.14.1. What is the best next step to find the cause?", o:["Run arp -a on an affected PC to get 192.168.0.1's MAC, then show mac address-table address with that MAC on the access switch to find its port","Reload the branch router so it answers Discovers faster","Shorten the router's lease so its Offers win","Add ip helper-address 192.168.0.1 on the router"], a:0, why:"A second DHCP server is answering on the LAN. The PC has an ARP entry for its 'gateway' 192.168.0.1, which gives the rogue box's MAC; the switch's MAC table maps that MAC to a port. Then remove the device, release/renew the PCs, and plan DHCP snooping. Lease length doesn't decide which Offer arrives first."},
  {lvl:2, q:"Why is the DHCP Request broadcast, even though the client already knows which server made the Offer?", o:["Because UDP can't send unicasts","So every server that made an offer learns which one was accepted and can return its own offered address to the pool — and because the client has no confirmed address yet","So the switch can learn the server's MAC address","Because routers need to forward it to other subnets"], a:1, why:"Several servers may have offered. The broadcast Request names the chosen server; the others withdraw their offers. The client also has no confirmed address to send a unicast from. Routers never forward it — that's what relays are for."},
  {lvl:3, type:"multi", q:"Since a router swap, laptops on BR-R1's Gi0/0 LAN all show 169.254 addresses. Based on the exhibit, which two statements are true? (Choose two.)", ex:"BR-R1#show ip interface brief | include 0/0\nGigabitEthernet0/0     172.20.80.1     YES manual up                    up\nBR-R1#show running-config | section dhcp\nip dhcp excluded-address 172.20.80.1 172.20.80.10\nip dhcp pool BRANCH\n network 172.20.8.0 255.255.255.0\n default-router 172.20.80.1\n dns-server 172.20.80.5", o:["BR-R1 doesn't answer the Discovers because no pool's network contains 172.20.80.1","After the pool's network is corrected to 172.20.80.0 255.255.255.0, the laptops will lease without anyone touching them, because Windows keeps retrying","The laptops need ip helper-address on Gi0/0","The excluded-address line blocks every lease","The pool needs a lease command before it will hand out addresses"], a:[0,1], why:"The pool's network is 172.20.8.0/24 (a missing 0), so a Discover arriving on 172.20.80.1 matches no pool and the router stays silent. Fix the network and Windows' background retries pick up leases. The server is the router itself, so no helper is needed; the exclusion only covers .1–.10; and without a lease command IOS uses 1 day."},
  {lvl:1, type:"fill", q:"Which Windows command shows the lease times, the DHCP server and the DNS servers a PC received?", fields:[{label:"Command", a:["ipconfig /all","ipconfig/all","ipconfig -all"]}], why:"ipconfig /all adds the DHCP details plain ipconfig leaves out: DHCP Enabled, Lease Obtained, Lease Expires, DHCP Server, DNS Servers and the physical (MAC) address."},
  {lvl:2, q:"A PC already holds a valid lease. The user runs ipconfig /renew. What crosses the wire?", o:["A unicast Request to its DHCP server and an Ack back","All four DORA messages","A Release, then a Discover","A broadcast Discover only"], a:0, why:"With a lease in hand the PC knows its server and has a working address, so renewing is one unicast Request and one Ack — the same as the automatic renewal at T1. A full DORA happens only when the PC has no lease (after /release, or with APIPA)."},
  {lvl:2, q:"The exhibit is from a router serving 172.31.4.0/24, where statics are meant to be .1–.20. What does it show, and what should you do?", ex:"BR2-R1#show ip dhcp conflict\nIP address        Detection method   Detection time          VRF\n172.31.4.40       Ping               Oct 12 2026 08:30 AM\nBR2-R1#show logging | include DHCPD\n*Oct 12 08:30:28.548: %DHCPD-4-PING_CONFLICT: DHCP address conflict:  server pinged 172.31.4.40.", o:["A device with a hand-set address sits inside the pool: the router pinged .40 before offering it and got a reply. Move that device into the static range (or exclude .40), then clear ip dhcp conflict *","Two DHCP servers are on the LAN","The pool is exhausted","A PC at 172.31.4.40 has a duplicate MAC address"], a:0, why:"Detection method Ping means the server's own pre-offer ping got an answer, so some device uses .40 without a lease. Put it where the plan says statics go (or exclude its address), then clear the conflict record so the address isn't held back. A rogue server would show in clients' DHCP Server line, not here."},
  {lvl:1, q:"Which IP service keeps device clocks in agreement, so that logs from different routers line up?", o:["NTP","DHCP","SNMP","TFTP"], a:0, why:"NTP (Network Time Protocol, UDP 123, lesson 6) synchronises clocks. DHCP hands out addresses, SNMP monitors devices and TFTP transfers files such as config backups."},
],
cards:[
  {f:"IP services", b:"Protocols and features on top of routing that make a network usable and manageable: DHCP (addresses), DNS (names), NAT/PAT (sharing public IPv4), NTP (time), syslog (logs), SNMP (monitoring), TFTP/FTP (file transfer and backups), QoS (priority)."},
  {f:"DORA", b:"Discover (client broadcast) → Offer (server) → Request (client broadcast) → Ack (server). Only after the Ack does the client use the address."},
  {f:"DHCP ports", b:"Server UDP 67, client UDP 68 (BOOTP's bootps and bootpc). A Discover goes from 0.0.0.0:68 to 255.255.255.255:67."},
  {f:"Why the DHCP Request is broadcast", b:"So every server that made an offer learns which one won and returns its offered address to the pool — and because the client has no confirmed address yet."},
  {f:"Common DHCP options", b:"1 subnet mask · 3 router (default gateway) · 6 DNS servers · 15 domain name (DNS suffix) · 51 lease time."},
  {f:"Lease timers", b:"T1 = 50%: unicast Request to its own server to renew. T2 = 87.5%: broadcast Request to any server. 100%: stop using the address and start again with a Discover. IOS default lease: 1 day."},
  {f:"APIPA (169.254.x.x)", b:"Windows gives itself 169.254.0.0/16, mask 255.255.0.0, no gateway, when no DHCP Offer arrives. Proves: DHCP on, link up, no Offer. Media disconnected means no link instead."},
  {f:"IOS DHCP server — the commands", b:"ip dhcp excluded-address FIRST [LAST] (global, first) · ip dhcp pool NAME → network NET MASK · default-router · dns-server · domain-name · lease DAYS [HOURS] [MIN] | infinite."},
  {f:"How IOS picks a pool", b:"The pool whose network contains the address of the interface the Discover arrived on (or the relay's giaddr — lesson 2). No matching pool = no Offer."},
  {f:"show ip dhcp binding / pool / conflict", b:"binding: who has which address (Client-ID = 01 + MAC), until when, on which interface. pool: Total / Leased / Excluded and the range. conflict: addresses the server refused because its ping got an answer."},
  {f:"DHCP ping check and conflicts", b:"IOS pings an address before offering it (2 pings by default). A reply = conflict: %DHCPD-4-PING_CONFLICT, listed in show ip dhcp conflict, held back until clear ip dhcp conflict *."},
  {f:"ipconfig /release and /renew", b:"/release sends a Release and removes the IPv4 address. /renew with a lease = unicast Request + Ack; with no lease = full DORA (asking for its last address). Both refuse to run on a static adapter."},
  {f:"Changed pool options", b:"Clients holding a lease keep the old gateway or DNS until they renew. After a fix, ipconfig /renew a client and check ipconfig /all."},
],
});

// ---------- Module 7 · Lesson 2 ----------
L.push({
id:"svc-relay", mins:80, level:"Beginner+ · builds on Modules 1–6 and lesson 1",
t:"DHCP across subnets: relay with ip helper-address, and the router as a DHCP client",
html:`
${K.goals([
  "Explain why a DHCP Discover stops at the first router, and what the PC shows (APIPA) when nothing relays it.",
  "Configure <code>ip helper-address</code> on the right interface and explain how giaddr picks the server's pool and receives its reply.",
  "Trace a relayed DORA hop by hop and prove it with <code>show ip dhcp binding</code>, <code>ipconfig /all</code> and an extended ping.",
  "Diagnose the four relay faults — not heard, not reached, not handled, no route home — from their evidence.",
  "Make a router a DHCP client with <code>ip address dhcp</code>, read <code>S* 0.0.0.0/0 [254/0]</code> and <code>show dhcp lease</code>, and explain why a stale static default beats it.",
])}
${K.pre([
  "Lesson 1: DORA on UDP 67/68, pools, exclusions, <code>show ip dhcp binding</code>, <code>ipconfig /all</code>, <code>/renew</code>, APIPA.",
  "Module 5: administrative distance, static and default routes, the return path, <code>ping &lt;ip&gt; source &lt;interface&gt;</code>.",
  "Modules 2 and 4: broadcast domains, VLANs and SVIs.",
])}

<h2>Why this matters at work</h2>
<p>Tuesday, 08:05, at a managed-service provider in Abuja. A pharmacy chain has moved its accounts team onto a new VLAN at head office; twelve PCs show 169.254 addresses and can't open the accounting system. The DHCP server two floors down is serving every other floor. &ldquo;It must be the new PCs,&rdquo; says the office manager.</p>
<p>It isn't the PCs. Any network bigger than one room has one DHCP server, many subnets, and routers between them that throw broadcasts away by design. The fix is one line per interface — if you know <i>which</i> interface and what must be true on the server side. That afternoon the chain's Kano shop needs its internet router to take its address from the ISP by DHCP. This lesson covers both.</p>

<h2>Why a DHCP Discover stops at the router</h2>
${K.remember(`<b>The rule in one line:</b> a router never forwards a broadcast. A DHCP Discover is a broadcast (from 0.0.0.0 to 255.255.255.255), so it reaches every device in its own subnet and VLAN — and dies at the router interface, unless that interface has been told where to relay it.`)}
<p>Lesson 1's PCs got addresses because the server — the router — sat on their LAN. Move it to another subnet and the same PC gets nothing, for two reasons you already know:</p>
<ul>
<li><b>The client can only broadcast.</b> It has no address yet (source 0.0.0.0) and doesn't know the server's, so its only possible destination is &ldquo;everyone here&rdquo;: 255.255.255.255.</li>
<li><b>A broadcast lives inside one broadcast domain.</b> Switches flood it through the VLAN (Module 2); the router interface is the edge — the router reads it but never sends it out of another interface.</li>
</ul>
<p><b>Why?</b> If routers passed broadcasts on, every ARP and every Discover would reach every network in the company, and one looping broadcast would become a company-wide storm. Stopping broadcasts at layer 3 is what lets networks grow.</p>
${K.svg("0 0 760 290",
  `<rect x="24" y="92" width="402" height="114" rx="8" fill="none" stroke="var(--warn)" stroke-width="1.4" stroke-dasharray="6 4"/>`+
  K.dev("pc",90,135,"KAD-PC1","source 0.0.0.0")+K.dev("switch",230,135,"KAD-SW1","floods it")+K.dev("router",360,135,"KAD-R1","G0/0 10.40.10.1")+
  K.dev("router",530,135,"HQ-CORE","")+K.dev("server",680,135,"DC-DHCP1","10.0.50.10")+
  K.link(108,135,204,135)+K.link(256,135,336,135)+K.link(384,135,506,135,"WAN",true)+K.link(554,135,665,135)+
  K.txt(225,199,"one broadcast domain: 10.40.10.0/24",{c:"warn",s:10,mid:true})+
  K.arrow(90,70,330,70,"DHCP Discover to 255.255.255.255",true)+
  K.txt(345,77,"✗",{c:"bad",s:22,mid:true,b:true})+
  K.txt(366,64,"the router reads it and drops it:",{c:"bad",s:10.5,f:"body"})+K.txt(366,78,"broadcasts never cross a router",{c:"bad",s:10.5,f:"body"})+
  K.txt(380,240,"No Offer ever comes back, so Windows gives itself a 169.254.x.x address (APIPA, lesson 1).",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(380,262,"DC-DHCP1 is healthy and serving other subnets — it simply never hears this PC.",{c:"muted",s:11,mid:true,f:"body"}),
  "A Kaduna branch PC asks for an address. The switch floods the Discover through the VLAN; the branch router is the edge of the broadcast domain, so the central server never hears it.")}
<h3>What the user sees</h3>
<p>Exactly what lesson 1 showed when no server answers. Here is KAD-PC1 in the lab, with the central server two routers away and nothing on KAD-R1 to relay:</p>
${K.out(`C:\\>ipconfig

Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::250:a0ff:fe4e:d67a%4
   Autoconfiguration IPv4 Address. . : 169.254.232.23
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :

C:\\>ipconfig /renew

Windows IP Configuration

An error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out.`, "The fingerprint of &ldquo;no Offer came back&rdquo;: an Autoconfiguration (APIPA) address, a 255.255.0.0 mask, no gateway, and /renew timing out. It says nothing about why.")}
<p>APIPA tells you only that <b>no Offer arrived</b> — not whether the Discover was stopped, ignored or answered into a black hole. The fixes: a pool on every router (lesson 1's way, configured and audited site by site), or <b>one central server and a relay on each router</b> — the normal design once a company has more than a few sites, and the rest of this lesson.</p>
${K.check({q:"A PC on VLAN 30 shows 169.254.18.7 with mask 255.255.0.0. The DHCP server, in VLAN 99, is serving VLAN 10 normally. What does the 169.254 address prove?", o:["The PC's network card is faulty","No DHCP Offer reached the PC, so Windows assigned itself an APIPA address","The DHCP server has run out of addresses for every VLAN","The PC has a static address typed by mistake"], a:1, why:"APIPA means Discovers went out and no Offer came back — somewhere between PC and server (relay, pool or return path). VLAN 10 being fine shows the server itself works."})}
<h3>Same logic, new situation</h3>
<p>A small office has one Layer 3 switch with two VLANs: VLAN 10 (staff, 10.5.10.0/24, SVI 10.5.10.1) and VLAN 20 (guests, 10.5.20.0/24, SVI 10.5.20.1). The DHCP server is a PC-sized box plugged into a VLAN 10 port. Staff PCs get addresses. Do guest laptops — and why?</p>
${K.hint(`Where does each VLAN's broadcast domain end? What sits at that edge?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether a guest's Discover reaches a server in another VLAN. <b>2. Rule:</b> a broadcast stays in its broadcast domain; routing between VLANs never forwards it. <b>3. Apply it:</b> the Discover floods VLAN 20 and stops at SVI Vlan20. One box, two broadcast domains: <b>guests get APIPA</b>. The fix is a relay on interface Vlan20 — next.</p>`)}

<h2>ip helper-address: the router becomes a relay agent</h2>
${K.remember(`<b>The rule:</b> <code>ip helper-address &lt;server&gt;</code>, under the interface where the clients live, tells the router: &ldquo;when a DHCP broadcast arrives <i>here</i>, send a copy as a unicast to this server — and write my address on <i>this</i> interface into it.&rdquo; The router is now a ${K.g("DHCP relay agent","A device that receives a client's DHCP broadcasts on one subnet and forwards them as unicasts to a DHCP server on another subnet, then passes the server's answers back. On Cisco routers and Layer 3 switches, ip helper-address turns it on.")}.`)}
<p>The client still broadcasts; the relay, which <i>has</i> an address and a routing table, turns that broadcast into an ordinary unicast that routers carry anywhere.</p>
<h3>giaddr: the address that does two jobs</h3>
<p>Every DHCP message has a field called ${K.g("giaddr","Gateway IP address: a field in the DHCP message header. The first relay agent writes into it the address of the interface where it heard the client; 0.0.0.0 means 'not relayed'. 'Gateway' means the relay — though on a router it's usually also the PCs' default gateway.")}. Clients send 0.0.0.0; the relay writes the address of the interface the broadcast arrived on — KAD-R1's G0/0, 10.40.10.1. At the server it does two jobs:</p>
<ol>
<li><b>It chooses the pool.</b> The client has no address, so the server uses the pool whose network contains giaddr: 10.40.10.0/24, pool KAD-STAFF. (Lesson 1's router chose by its receiving interface; for relayed requests giaddr takes that role.)</li>
<li><b>It is where the reply goes.</b> Offer and Ack are unicast to giaddr on UDP 67, so the server needs a <b>route back to giaddr</b> — Module 5's return-path rule.</li>
</ol>
${K.svg("0 0 760 370",
  K.dev("pc",70,70,"KAD-PC1","no address yet")+K.dev("switch",185,70,"KAD-SW1","")+K.dev("router",320,70,"KAD-R1","G0/0 10.40.10.1")+K.dev("router",500,70,"HQ-CORE","routes")+K.dev("server",670,70,"DC-DHCP1","10.0.50.10")+
  K.link(88,70,159,70)+K.link(211,70,296,70)+K.link(344,70,476,70)+K.link(524,70,655,70)+
  K.txt(320,134,"ip helper-address 10.0.50.10",{c:"accent",s:10.5,mid:true})+
  K.arrow(70,170,312,170,"1  Discover · broadcast on the LAN",true)+
  K.arrow(328,205,662,205,"2  Discover · unicast to 10.0.50.10 · giaddr = 10.40.10.1",true)+
  K.arrow(662,245,328,245,"3  Offer · unicast back to giaddr 10.40.10.1")+
  K.arrow(312,280,70,280,"4  Offer · delivered on the LAN")+
  K.box(470,300,280,52,"giaddr 10.40.10.1 → pool KAD-STAFF","offer 10.40.10.21 · gateway 10.40.10.1",true)+
  K.txt(20,320,"Request and Ack travel the same way (1–4).",{c:"fg",s:11,f:"body"})+
  K.txt(20,340,"Renewals later go straight to 10.0.50.10.",{c:"muted",s:11,f:"body"}),
  "A relayed exchange. The relay turns the client's broadcast into a unicast carrying giaddr; the server picks the pool from giaddr and replies to giaddr; the relay hands the answer to the client on its LAN.")}
<h3>Worked example: relay the Kaduna branch to the central server</h3>
<p>Kaduna's staff LAN 10.40.10.0/24 sits behind KAD-R1 (G0/0 10.40.10.1); the central server DC-DHCP1 (10.0.50.10) is in the head-office data centre behind HQ-CORE. Real central servers usually run Windows Server or Linux; in these labs it's an IOS router — the relay side is identical.</p>
${K.steps([
  ["On the relay, choose the interface that hears the clients", "The Discover arrives on <b>G0/0</b>, the LAN — not the WAN. On a Layer 3 switch it's the clients' SVI (<code>interface vlan 30</code>); on a router-on-a-stick, the subinterface."],
  ["Point it at the server", "<code>interface g0/0</code>, <code>ip helper-address 10.0.50.10</code>. A second line (<code>ip helper-address 10.0.50.11</code>) sends a copy to a second server too."],
  ["On the server, create the pool for that subnet", "On DC-DHCP1: <code>ip dhcp excluded-address 10.40.10.1 10.40.10.20</code>, then <code>ip dhcp pool KAD-STAFF</code>, <code>network 10.40.10.0 255.255.255.0</code>, <code>default-router 10.40.10.1</code>, <code>dns-server 10.0.50.53</code>, <code>domain-name example.com</code>. The default router is the <b>branch's</b> gateway, the relay's G0/0 — not the server's own gateway."],
  ["Check the server can reach giaddr", "DC-DHCP1 defaults to HQ-CORE, which has <code>ip route 10.40.0.0 255.255.0.0 10.0.0.2</code>: the Offer to 10.40.10.1 has a way home."],
  ["Verify from both ends", "PC: <code>ipconfig /all</code>. Server: <code>show ip dhcp binding</code>. Relay: <code>show running-config | section interface</code> (<code>| section</code> prints only the matching blocks)."],
])}
${K.out(`KAD-R1#show running-config | section interface GigabitEthernet0/0
interface GigabitEthernet0/0
 ip address 10.40.10.1 255.255.255.0
 ip helper-address 10.0.50.10`, "The helper sits under the LAN interface. Its address — 10.40.10.1 — is the giaddr the server will see.")}
${K.tip(`<code>show ip interface g0/0</code> confirms it too: <code>Helper address is 10.0.50.10</code> (with two helper lines, <code>Helper addresses are 10.0.50.10</code> and the second address on the line below; with none, <code>Helper address is not set</code>). The running-config shows the same thing with less to read.`)}
<p>Plug in KAD-PC1 and the lab's frame log tells the story (switch lines trimmed):</p>
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from KAD-PC1 (0050.a04e.d67a): "is there a DHCP server?"
Relay: KAD-R1 Gi0/0 has ip helper-address 10.0.50.10 — it turns the broadcast into a unicast to 10.0.50.10 (sent from its interface towards the server) and writes giaddr = 10.40.10.1, so the server knows which subnet the client is on
HQ-CORE received it on Gi0/1, decrements TTL to 254 and routes it
DHCP Offer (to the relay) 10.0.50.10 → frame to 0050.503a.0001 (TTL 255)
DHCP Offer from KAD-R1 (relaying for DC-DHCP1): "you can have 10.40.10.21 255.255.255.0, gateway 10.40.10.1, DNS 10.0.50.53, lease 1 day" (pool KAD-STAFF)
DHCP Request (broadcast again) from KAD-PC1: "I'll take 10.40.10.21 from server 10.0.50.10" — broadcast, so any other server that made an offer knows it wasn't chosen
  · KAD-R1 relays the Request to the server too`, "Excerpt of the lab's frame log. HQ-CORE routes the relayed Discover and the Offer like any unicast; DC-DHCP1 answers giaddr, not the PC; KAD-R1 then hands the Offer over on the LAN (to the PC's MAC, or as a broadcast, depending on a flag the client set). The Request is still a broadcast, so it needs the relay too.")}
${K.out(`C:\\>ipconfig /all
   (excerpt)
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.40.10.21(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.40.10.1
   DHCP Server . . . . . . . . . . . : 10.0.50.10
   DNS Servers . . . . . . . . . . . : 10.0.50.53

DC-DHCP1#show ip dhcp binding
Bindings from all pools not associated with VRF:
IP address      Client-ID/              Lease expiration        Type       State      Interface
                Hardware address/
                User name
10.40.10.21     0100.50a0.4ed6.7a       Oct 13 2026 08:30 AM    Automatic  Active     Unknown`, "Two clues that a lease came through a relay: the PC's DHCP Server is the central server, not its gateway; and the server's binding says Interface Unknown — the client isn't on any of the server's own interfaces.")}
${K.mistake(`Pointing the pool's <code>default-router</code> at the server's own gateway (10.0.50.1). The pool describes the <b>client's</b> subnet: PCs need their LAN gateway, 10.40.10.1 — the same address as giaddr — or they get an address and can't leave the LAN.`)}
${K.dyk(`Relay agents are older than DHCP: they were defined for ${K.g("BOOTP","Bootstrap Protocol (RFC 951, 1985): DHCP's predecessor. DHCP (RFC 2131) kept its message format and ports, UDP 67 and 68.")}, and DHCP reused BOOTP's format so the same relays work for both — which is why giaddr is in every DHCP packet.`)}
${K.dyk(`<code>ip helper-address</code> relays more than DHCP: by default, UDP broadcasts for eight services — Time (37), the IEN-116 name service (42, an obsolete pre-DNS name lookup), ${K.g("TACACS","Terminal Access Controller Access-Control System: an old protocol for checking device logins against a central server (its successor TACACS+ is covered with device security later).")} (49), DNS (53), BOOTP/DHCP (67 and 68, counted as one service), TFTP (69), NetBIOS name service (137) and NetBIOS datagram service (138). <code>no ip forward-protocol udp &lt;port&gt;</code> removes one.`)}
<h3>Try it: stage KAD-R1's relays</h3>
<p>A contractor half-configured KAD-R1. Fix the relays: both central servers (10.0.50.10 and standby 10.0.50.11) for the staff LAN on G0/0, the primary for the CCTV LAN on G0/2, nothing on the WAN. <code>no ip helper-address &lt;server&gt;</code> removes one helper line.</p>
${K.term({env:"ios2", title:"KAD-R1 — put the helpers where the clients are", opts:{kind:"router", host:"KAD-R1", model:"ISR 1100", motd:"KAD-R1 — bench staging for the Kaduna branch (lab router, no enable secret). G0/0 staff LAN 10.40.10.0/24 · G0/1 WAN to HQ-CORE · G0/2 CCTV LAN 10.40.20.0/24."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","description STAFF LAN","ip address 10.40.10.1 255.255.255.0","no shutdown","interface g0/1","description WAN to HQ-CORE","ip address 10.0.0.2 255.255.255.252","ip helper-address 10.0.50.10","no shutdown","interface g0/2","description CCTV LAN","ip address 10.40.20.1 255.255.255.0","no shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code>. Predict what the running-config will show before each check.",
  tasks:[
    {text:"<code>enable</code>, then <code>show running-config | section interface</code>. Find the helper the contractor added — on the WAN interface, where no client ever broadcasts", done:e=>e.log.some(l=>/section/i.test(l.cmd||"") && /interface GigabitEthernet0\/1\n description WAN to HQ-CORE\n ip address 10\.0\.0\.2 255\.255\.255\.252\n ip helper-address 10\.0\.50\.10/.test(l.out||""))},
    {text:"Remove it: <code>configure terminal</code>, <code>interface g0/1</code>, <code>no ip helper-address 10.0.50.10</code>", done:e=>!(e.intfs["GigabitEthernet0/1"].helpers||[]).length},
    {text:"Staff LAN: <code>interface g0/0</code>, then <code>ip helper-address 10.0.50.10</code> and <code>ip helper-address 10.0.50.11</code> — two lines, so each server gets its own copy of every Discover", done:e=>{ const h = e.intfs["GigabitEthernet0/0"].helpers||[]; return h.includes("10.0.50.10") && h.includes("10.0.50.11"); }},
    {text:"CCTV LAN: <code>interface g0/2</code>, <code>ip helper-address 10.0.50.10</code>. Same server — but the cameras' giaddr will be 10.40.20.1, so the server picks a different pool for them", done:e=>(e.intfs["GigabitEthernet0/2"].helpers||[]).includes("10.0.50.10")},
    {text:"<code>end</code>, then <code>show running-config | section interface</code> again: two helpers under G0/0, one under G0/2, none under G0/1", done:e=>e.log.some(l=>/section/i.test(l.cmd||"") && /interface GigabitEthernet0\/0\n description STAFF LAN\n ip address 10\.40\.10\.1 255\.255\.255\.0\n ip helper-address 10\.0\.50\.10\n ip helper-address 10\.0\.50\.11\ninterface GigabitEthernet0\/1\n description WAN to HQ-CORE\n ip address 10\.0\.0\.2 255\.255\.255\.252\ninterface GigabitEthernet0\/2\n description CCTV LAN\n ip address 10\.40\.20\.1 255\.255\.255\.0\n ip helper-address 10\.0\.50\.10/.test(l.out||""))},
    {text:"Save it: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>e.savedOnce},
  ],
  win:"You moved the helper from the WAN, where it could never hear a client, to the two LAN interfaces where the broadcasts arrive — two servers for staff, one for the cameras — and each LAN's own address will be the giaddr that picks its pool.",
  solve:["enable","show running-config | section interface","configure terminal","interface g0/1","no ip helper-address 10.0.50.10","interface g0/0","ip helper-address 10.0.50.10","ip helper-address 10.0.50.11","interface g0/2","ip helper-address 10.0.50.10","end","show running-config | section interface","copy running-config startup-config",""]})}
${K.check({q:"KAD-R1's CCTV LAN is 10.40.20.0/24 (G0/2 = 10.40.20.1) and its staff LAN 10.40.10.0/24 (G0/0 = 10.40.10.1). Both relay to 10.0.50.10. How does the server know to give a camera a 10.40.20.x address?", o:["The camera's MAC address tells the server which subnet it is on","The relay writes giaddr = 10.40.20.1 for broadcasts heard on G0/2, and the server picks the pool whose network contains giaddr","The server offers from every pool and the camera keeps the one that fits","The camera asks for a 10.40.20.x address in its Discover"], a:1, why:"The client has no address, so the server can't see its subnet. giaddr — the address of the relay interface that heard the broadcast — tells it. 10.40.20.1 is in 10.40.20.0/24, so the server uses that pool. MAC addresses carry no subnet information."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Layer 3 switch has SVIs Vlan10 (10.1.10.1/24, staff), Vlan20 (10.1.20.1/24, phones) and Vlan99 (10.1.99.1/24, servers). The DHCP server is 10.1.99.5 in VLAN 99 and must serve staff and phones. Which two interfaces need ip helper-address 10.1.99.5? (Choose two.)", o:["interface Vlan10","interface Vlan20","interface Vlan99","The uplink port towards the internet router","The access port the DHCP server is plugged into"], a:[0,1], why:"1. Asked: where the relay must listen. 2. Rule: the helper goes on the interface that hears the clients' broadcasts — the edge of each client broadcast domain. 3. Apply: staff broadcasts arrive on Vlan10 and phones' on Vlan20, so both SVIs get the helper (giaddr 10.1.10.1 and 10.1.20.1 pick two pools). Vlan99 is the server's own VLAN: no relay needed there. The uplink and the server's port never hear a client Discover."})}

<h2>One central server for many subnets</h2>
<p>With relays, one pair of servers can serve every subnet: each subnet is a pool (on Windows Server a ${K.g("scope","Windows Server's name for a DHCP pool: one subnet's range, exclusions and options.")}), and each router or core switch needs only helper lines.</p>
${K.remember(`<b>Centralising moves the work, it doesn't remove it.</b> For every new subnet, three things must be true: a <b>helper</b> on the interface that hears its clients, a <b>pool</b> on the server whose network contains that interface's address, and a <b>route</b> from the server back to that address.`)}
<p><b>Why centralise?</b> &ldquo;Who had 10.40.10.37 at 14:10 on Friday?&rdquo; becomes one query on one server, not forty routers whose bindings vanish on reload (lesson 1). Options change once; printers keep reservations; the security team and ${K.g("IPAM","IP Address Management: the system or spreadsheet recording which addresses and subnets are assigned where.")} tools read one lease database; redundancy is built once.</p>
<h3>Two servers, two helpers</h3>
<p>With two helper lines each Discover reaches both servers, and both may offer; the PC names its choice in the broadcast Request and the other withdraws. The catch: two independent servers must <b>not</b> hand out the same addresses — split the range between them or use the servers' failover feature, so they share one view of the leases.</p>
<h3>Leases, renewals and the WAN</h3>
<p>At ${K.g("T1","The renewal timer: by default at 50% of the lease. The client asks the server that gave the lease, by unicast, to extend it.")} (half the lease) a relayed client sends a <b>unicast</b> Request straight to the server — no relay needed now. If that keeps failing, at ${K.g("T2","The rebinding timer: by default at 87.5% of the lease. The client broadcasts the Request to any server — which, on a relayed LAN, the relay forwards.")} it broadcasts, through the relay again. Only when the lease runs out does it lose the address. So <b>a PC that already has a lease survives a WAN outage</b>; new devices, and leases that expire during it, don't. Choose lease lengths longer than your worst realistic outage.</p>
${K.when([
  ["A pool on each branch router (lesson 1)","A handful of sites, or a site that must lease with its WAN down","Nothing central to depend on","You need one lease record, central reservations or audit"],
  ["Central servers + ip helper-address","Multi-site companies, campuses with many VLANs, businesses that must log who had which address","One place for scopes, options, reservations and logs","The WAN is unreliable <i>and</i> leases are short"],
], "Where should DHCP live?")}
<p>A relay can add more than giaddr: with ${K.g("option 82","The Relay Agent Information option (RFC 3046): details such as which switch and port the client is on.")} it attaches which switch and port the request came from. ISPs use it to tie each customer's line to its address; you'll meet it again with DHCP snooping in a later module.</p>
${K.case("Forty branch pools become two central servers",`
<p><b>The company.</b> A microfinance bank, 38 branches, a DHCP pool on every branch router. An auditor asks which PC had 10.17.4.52 during a disputed transaction. Nobody can say: that router had reloaded in a power cut, and IOS bindings don't survive a reload.</p>
<p><b>The decision.</b> Two Windows DHCP servers (Lagos and Abuja data centres) in failover mode; two helper lines on every branch router; branch pools deleted; leases logged centrally. Each scope's default gateway stayed the branch router's LAN address.</p>
<p><b>The twist.</b> In month one the Kano fibre was cut for nine hours. Staff PCs carried on — at first. But Kano's scope had two-hour leases, copied from a guest Wi-Fi template, so by lunchtime PCs reaching the end of their lease fell to 169.254, and new laptops never got an address. Staff scopes went to eight days; short leases stayed for guests only.</p>
<p><b>Lesson.</b> Centralising fixed the audit trail, and made the WAN part of DHCP: lease length became a resilience setting.</p>`)}
${K.check({q:"A branch's WAN link to the central DHCP servers is down for three hours. Staff PCs got 3-day leases yesterday. What happens at the branch?", o:["Every PC immediately drops to a 169.254 address","PCs that already have leases keep their addresses; only new or freshly reset devices fail to get one","The branch router starts handing out addresses from its helper","PCs switch to static addresses automatically"], a:1, why:"A lease stays valid until it expires. Renewals start at T1 (half the lease) and failures are retried, so a three-hour outage only stops devices that need a new lease. A relay has no addresses of its own to give out."})}
<h3>Same logic, new situation</h3>
<p>A clinic group is adding a third clinic whose WAN link often drops for up to eight hours during storms. The template gives every scope a 4-hour lease. Using the renewal logic, what will happen during a long storm — and what single change fixes it?</p>
${K.hint(`A device loses its address when its lease runs out, not when the server becomes unreachable. Compare the lease length with the outage length.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> What a long outage does with 4-hour leases. <b>2. Rule:</b> a client keeps its address until the lease expires; renewing (T1 at 2 h, T2 at 3.5 h) needs the server. <b>3. Apply it:</b> a lease renewed just before the outage has 4 hours left, so well before 8 hours <b>every PC falls to 169.254</b>, though the LAN is fine. Fix: leases longer than the worst outage — days, for staff devices (or a local pool, losing the central record).</p>`)}

<h2>When relayed DHCP breaks: follow the Discover</h2>
<p>Every relay fault gives the same symptom — 169.254 and a /renew that times out — so follow the Discover from the PC to the server and back, and stop at the first &ldquo;no&rdquo;.</p>
${K.svg("0 0 760 240",
  K.txt(380,28,"Follow the Discover: the first “no” is the fault",{c:"fg",s:12.5,mid:true,b:true,f:"body"})+
  K.box(12,52,168,64,"1 · Heard?","helper on the client side",true)+K.box(198,52,168,64,"2 · Reached?","server reachable from relay")+
  K.box(384,52,168,64,"3 · Handled?","a pool contains giaddr")+K.box(570,52,168,64,"4 · Home?","route from server to giaddr",true)+
  K.arrow(180,84,196,84)+K.arrow(366,84,382,84)+K.arrow(552,84,568,84)+
  K.txt(96,146,"show running-config",{mid:true,s:10})+K.txt(96,162,"| section interface",{mid:true,s:10})+
  K.txt(282,146,"ping <server>",{mid:true,s:10})+K.txt(282,162,"(from the relay)",{mid:true,s:10})+
  K.txt(468,146,"show ip dhcp pool",{mid:true,s:10})+K.txt(468,162,"(or the server's scopes)",{mid:true,s:10})+
  K.txt(654,146,"ping <server>",{mid:true,s:10})+K.txt(654,162,"source <client interface>",{mid:true,s:10})+
  K.txt(380,206,"Symptom for all four: the PC shows 169.254.x.x and ipconfig /renew times out.",{c:"muted",s:11,mid:true,f:"body"})+
  K.txt(380,226,"After it works, two more checks from lesson 1: the right default-router, and a pool that isn't exhausted.",{c:"muted",s:11,mid:true,f:"body"}),
  "Four checkpoints in the order the Discover travels, each with the command that answers it.")}
${K.remember(`<b>Heard, Reached, Handled, Home.</b> Was the broadcast <b>heard</b> by an interface with a helper? Was the server <b>reached</b>? Was it <b>handled</b> — is there a pool containing giaddr? Can the reply get <b>home</b> to giaddr?`)}
<div class="tablewrap"><table>
<tr><th>Fault</th><th>Evidence</th><th>Fix</th></tr>
<tr><td><b>1. Not heard</b> — no helper, or it's on the WAN</td><td>No <code>ip helper-address</code> under the client-facing interface or SVI; the server sees nothing. Lab log: &ldquo;no DHCP pool … and no ip helper-address&rdquo;.</td><td>Helper under the clients' interface; remove any on the WAN.</td></tr>
<tr><td><b>2. Not reached</b> — typo'd or unreachable helper</td><td><code>ping &lt;helper address&gt;</code> from the relay fails, or it isn't the server's address.</td><td>Correct the helper, or routing towards the server.</td></tr>
<tr><td><b>3. Not handled</b> — no pool for the subnet</td><td>The server has no pool (scope) containing giaddr: a new VLAN with no scope, or a typo such as 10.40.1.0/24 for 10.40.10.0/24.</td><td>Create or correct the pool.</td></tr>
<tr><td><b>4. Not home</b> — no route back to giaddr</td><td>Plain <code>ping &lt;server&gt;</code> from the relay <b>succeeds</b>; <code>ping &lt;server&gt; source &lt;client interface&gt;</code> <b>fails</b>; server side: <code>show ip route &lt;giaddr&gt;</code> → <code>% Subnet not in table</code>.</td><td>Add the route (or a summary) on the server's side.</td></tr>
</table></div>
<p>Two more: <code>no service dhcp</code> on the relay turns off the IOS DHCP server <b>and</b> the relay agent. And if the relay router also has its own pool for that subnet, IOS answers from it instead of relaying — a pool left behind after a move to central DHCP silently keeps serving.</p>
<h3>Worked example: the fault that hides from a router's ping</h3>
<p>Fault 4 hides, because the obvious test passes. Kaduna again, but DC-DHCP1's hand-written routes cover only head office (10.10.0.0/16) and the WAN links (10.0.0.0/24).</p>
${K.out(`KAD-R1#ping 10.0.50.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.0.50.10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/3 ms
KAD-R1#ping 10.0.50.10 source g0/0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.0.50.10, timeout is 2 seconds:
Packet sent with a source address of 10.40.10.1
.....
Success rate is 0 percent (0/5)

DC-DHCP1#show ip route 10.40.10.1
% Subnet not in table`, "The same destination, two sources. The second ping uses giaddr as its source — exactly the address the server's Offer must reach.")}
${K.steps([
  ["The plain ping", "Sourced from KAD-R1's WAN address, 10.0.0.2, which DC-DHCP1 can route to: <b>success</b> — proving only that the WAN address is routable."],
  ["The extended ping", "Sourced from giaddr, 10.40.10.1: the echoes arrive, the replies have no route — <b>0 percent</b>, exactly like the Offer."],
  ["Fix where the gap is", "On DC-DHCP1: <code>ip route 10.40.0.0 255.255.0.0 10.0.50.1</code> (or a default route). Windows retries by itself and the PCs lease."],
])}
${K.mistake(`Closing the ticket because <code>ping &lt;server&gt;</code> from the relay works. The Offer goes to the <b>client-facing</b> address, so test with <code>source &lt;client interface&gt;</code> — Module 5's user-like test.`)}
${K.exam(`Reading relay questions: <b>1. Label the addresses</b> — client subnet, the relay interface facing it (giaddr and the clients' gateway), the server. <b>2. Check three facts</b>: helper under the client-facing interface; a pool containing giaddr with that interface as default-router; a route from the server's side to giaddr. Favourite traps: the helper on the WAN, the server's gateway as default-router, and &ldquo;the relay can ping the server&rdquo; offered as proof.`)}
${K.job("“The new accounts VLAN gets 169.254 — everyone else is fine”",`
<p><b>The ticket.</b> 08:05, the opening scenario: &ldquo;Accounts moved to the new network last night. All 12 PCs say 169.254. Everyone else is fine.&rdquo; Change record: VLAN 30 (10.20.30.0/24) on CORE-SW1, a Layer 3 switch — SVI 10.20.30.1 with <code>ip helper-address 10.0.50.10</code>; scope ACCOUNTS created on DHCP1 (10.0.50.10), behind the data-centre router DC-RTR.</p>
<p><b>Questions first.</b> Did anything ever work on VLAN 30? No. Any other change? No. So one new subnet, with helper and scope reportedly done.</p>
<p><b>Checks, in Discover order.</b> <i>Heard:</i> <code>show running-config | section interface Vlan30</code> — helper present. <i>Reached:</i> <code>ping 10.0.50.10</code> from CORE-SW1 — success. <i>Handled:</i> on DHCP1, <code>show ip dhcp pool ACCOUNTS</code> — 10.20.30.0/24, default-router 10.20.30.1. <i>Home:</i></p>
${K.out(`CORE-SW1#ping 10.0.50.10 source vlan30
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.0.50.10, timeout is 2 seconds:
Packet sent with a source address of 10.20.30.1
.....
Success rate is 0 percent (0/5)

DC-RTR#show ip route 10.20.30.1
% Subnet not in table
DC-RTR#show ip route 10.20.10.1
Routing entry for 10.20.10.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.0.9.1
      Route metric is 0, traffic share count is 1`, "From the new SVI the server is unreachable; DC-RTR has a static route for the staff VLAN, and none for VLAN 30.")}
<p><b>Diagnosis.</b> DC-RTR, in front of the server room, has one static route per user VLAN; nobody added VLAN 30, so DHCP1's Offers to giaddr 10.20.30.1 died there.</p>
<p><b>The fix.</b> Change approved: on DC-RTR <code>ip route 10.20.30.0 255.255.255.0 10.0.9.1</code>, then save. Within a minute the PCs had leased; DHCP1's <code>show ip dhcp binding</code> listed 10.20.30.21 upwards (Interface Unknown), and a user confirmed the accounts app opened.</p>
<p><b>What you say.</b> &ldquo;The new network's requests reached the DHCP server, but one router had never been told about the new network, so the answers couldn't get back. That's fixed — all twelve PCs have addresses — and I'm adding the step to our VLAN checklist.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;VLAN 30 APIPA. Helper and scope OK; ping 10.0.50.10 source vlan30 failed — DC-RTR had no route to 10.20.30.0/24. Added static, saved; 12/12 leased 08:41. Proposed: one summary 10.20.0.0/16 (or OSPF) on DC-RTR instead of per-VLAN statics. 36 min.&rdquo;</i></p>`)}
<h3>Hands-on: the new Warri office shows 169.254</h3>
<p>Warri, Monday 08:20, the new office's first day: <i>&ldquo;The contractor installed our router on Friday. All the laptops say 169.254.&rdquo;</i> Build sheet: Warri LAN 10.30.8.0/24, gateway .1, .1–.10 reserved for the router and printers; DHCP from the central server LOS-CORE (Lagos) at 10.255.30.1, with DNS 10.10.0.53 and domain example.com. Find every fault, fix each where it lives, prove it from a user's PC.</p>
${K.bench({id:"m7-relay-warri", points:110, from:"CCNA · Module 7 · lesson 2", title:"Warri opening day — relay the Discover, then give it a pool", viewBox:"0 0 860 430", openLog:true,
  intro:"LAPTOP-WRI is on WRI-R1's console and LAPTOP-HQ on LOS-CORE's (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control). After you switch laptops, press Enter and type <code>enable</code> again. Warri LAN 10.30.8.0/24 (WRI-R1 G0/0 .1) · WAN 10.255.30.0/30 (LOS-CORE .1, WRI-R1 .2) · Lagos LAN 10.10.0.0/24 with FS1 at 10.10.0.20. Click a PC or the server to open its Command Prompt. In this lab LOS-CORE plays the central DHCP server; leases never expire, and a PC set to obtain an address automatically retries by itself whenever the network changes (real Windows retries every few minutes).",
  devices:[
    {id:"lapw", kind:"laptop", label:"LAPTOP-WRI", x:30, y:20},
    {id:"wri", kind:"router", label:"WRI-R1", model:"ISR 1100 · Warri office", x:190, y:120,
      config:e=>{ ["en","conf t","hostname WRI-R1","interface g0/0","description WARRI LAN (new office)","ip address 10.30.8.1 255.255.255.0","no shutdown","interface g0/1","description WAN to LOS-CORE","ip address 10.255.30.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.255.30.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wsw", kind:"switch", label:"WRI-SW1", model:"Catalyst 9200", x:170, y:240},
    {id:"wp1", kind:"pc", label:"WRI-PC1", x:70, y:320, dhcp:true},
    {id:"wp2", kind:"laptop", label:"WRI-LAP2", x:280, y:320, dhcp:true},
    {id:"laph", kind:"laptop", label:"LAPTOP-HQ", x:720, y:20},
    {id:"hq", kind:"router", label:"LOS-CORE", model:"ISR 4331 · Lagos HQ · central DHCP", x:560, y:120,
      config:e=>{ ["en","conf t","hostname LOS-CORE","interface g0/0","description HQ LAN","ip address 10.10.0.1 255.255.255.0","no shutdown","interface g0/1","description WAN to WRI-R1","ip address 10.255.30.1 255.255.255.252","no shutdown","exit","ip route 10.30.8.0 255.255.255.0 10.255.30.2",
        "ip dhcp excluded-address 10.10.0.1 10.10.0.30",
        "ip dhcp pool LOS-STAFF","network 10.10.0.0 255.255.255.0","default-router 10.10.0.1","dns-server 10.10.0.53","domain-name example.com","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"fs1", kind:"server", label:"FS1", x:660, y:320, ip:"10.10.0.20", mask:"255.255.255.0", gw:"10.10.0.1"},
  ],
  cables:[ {type:"cat6", a:"wri:g0", b:"wsw:g1"}, {type:"cat6", a:"wp1:eth", b:"wsw:g2"}, {type:"cat6", a:"wp2:eth", b:"wsw:g3"}, {type:"cat6", a:"wri:g1", b:"hq:g1"}, {type:"cat6", a:"fs1:eth", b:"hq:g0"},
           {type:"console", a:"lapw:usb", b:"wri:con"}, {type:"console", a:"laph:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket on WRI-PC1: <code>ipconfig</code> shows an Autoconfiguration IPv4 Address (169.254.x.x), and <code>ipconfig /renew</code> times out. In the frame log, find the line where the Discover stops — and which device says so", done:B=>Bench.tried(B,"wp1",/^\s*ipconfig\s+\/renew\s*$/i)},
    {text:"On LAPTOP-WRI: console into WRI-R1, <code>enable</code>, <code>show running-config | section interface</code>. Which interface faces the users — and what's missing under it?", done:B=>B.devs.wri.env.log.some(l=>/section/i.test(l.cmd||"") && /interface GigabitEthernet0\/0\n description WARRI LAN/.test(l.out||""))},
    {text:"Before relying on a relay, check the reply's way home: <code>ping 10.255.30.1 source g0/0</code>. IOS prints <code>Packet sent with a source address of 10.30.8.1</code> — the address that will be giaddr — and it succeeds (the first dot is ARP), so LOS-CORE can reach the new LAN", done:B=>B.devs.wri.env.log.some(l=>/^\s*ping\s+10\.255\.30\.1\s+source\s/i.test(l.cmd||"") && /source address of 10\.30\.8\.1/.test(l.out||"") && /Success rate is [1-9]\d* percent/.test(l.out||""))},
    {text:"Add the relay on the users' interface: <code>configure terminal</code>, <code>interface g0/0</code>, <code>ip helper-address 10.255.30.1</code>, <code>end</code>. Then on WRI-PC1 run <code>ipconfig /renew</code> again — and read the frame log: the relay line shows giaddr, and LOS-CORE answers… nothing", done:B=>{ const i = B.devs.wri.env.intfs; return (i["GigabitEthernet0/0"].helpers||[]).includes("10.255.30.1") && !(i["GigabitEthernet0/1"].helpers||[]).length && Bench.tried(B,"wp1",/^\s*ipconfig\s+\/renew\s*$/i); }},
    {text:"On LAPTOP-HQ: console into LOS-CORE, <code>enable</code>, <code>show ip dhcp pool</code>. Is there any pool whose network contains giaddr 10.30.8.1?", done:B=>B.devs.hq.env.log.some(l=>/^\s*sh\S*\s+ip\s+dhcp\s+pool/i.test(l.cmd||"") && /Pool LOS-STAFF/.test(l.out||""))},
    {text:"Create Warri's pool on LOS-CORE from the build sheet: <code>ip dhcp excluded-address 10.30.8.1 10.30.8.10</code>, then <code>ip dhcp pool WRI-STAFF</code> with <code>default-router 10.30.8.1</code>, <code>dns-server 10.10.0.53</code>, <code>domain-name example.com</code> — and <code>network 10.30.8.0 255.255.255.0</code> <i>last</i>: a pool goes live the moment its network matches giaddr, and the waiting PCs lease with whatever options it has at that instant", done:B=>{ const st = B.devs.hq.env.dhcp, p = st.pools["WRI-STAFF"], n = ip => ip.split(".").reduce((a,o)=>a*256+(+o),0); return !!p && p.net===n("10.30.8.0") && p.len===24 && p.routers[0]==="10.30.8.1" && p.dns[0]==="10.10.0.53" && st.excluded.some(r=>r[0]===n("10.30.8.1") && r[1]===n("10.30.8.10")); }},
    {text:"Back on WRI-PC1: <code>ipconfig /all</code>. It has leased by itself (Windows retries): a 10.30.8.x address, gateway 10.30.8.1 — and DHCP Server 10.255.30.1, the central server, not its own router. (No gateway? It leased before your default-router line: <code>ipconfig /renew</code> collects the options.)", done:B=>(Bench.leased(B,"wp1")||"").startsWith("10.30.8.") && B.devs.wp1.gw==="10.30.8.1" && Bench.tried(B,"wp1",/^\s*ipconfig\s+\/all\s*$/i)},
    {text:"On LOS-CORE: <code>show ip dhcp binding</code>. Both Warri clients are listed with Interface <code>Unknown</code> — they came through a relay, not one of LOS-CORE's own LANs", done:B=>(Bench.leased(B,"wp2")||"").startsWith("10.30.8.") && B.devs.hq.env.log.some(l=>/binding/i.test(l.cmd||"") && (String(l.out||"").match(/10\.30\.8\.\d+\s+\S+\s+.*Unknown/g)||[]).length>=2)},
    {text:"Prove it like a user: from WRI-PC1, <code>ping 10.10.0.20</code> (FS1 in Lagos)", done:B=>Bench.pinged(B,"wp1","10.10.0.20")},
    {text:"Save both routers' configurations", done:B=>B.devs.wri.env.savedOnce && B.devs.hq.env.savedOnce},
  ],
  win:"You followed the Discover: it was never heard by a relay (no helper on WRI-R1 G0/0), and once relayed it wasn't handled (the central server had no pool containing giaddr 10.30.8.1 — the scope was never created). You checked the way home with a ping sourced from giaddr before you needed it, fixed each fault on the device where it lived, and proved it from the user's PC.",
  solve:[["pc","wp1","ipconfig"],["pc","wp1","ipconfig /renew"],
    ["console","lapw",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show running-config | section interface"],["term","ping 10.255.30.1 source g0/0"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ip helper-address 10.255.30.1"],["term","end"],["pc","wp1","ipconfig /renew"],
    ["console","laph",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip dhcp pool"],
    ["term","configure terminal"],["term","ip dhcp excluded-address 10.30.8.1 10.30.8.10"],["term","ip dhcp pool WRI-STAFF"],["term","default-router 10.30.8.1"],["term","dns-server 10.10.0.53"],["term","domain-name example.com"],["term","network 10.30.8.0 255.255.255.0"],["term","end"],
    ["pc","wp1","ipconfig /all"],["term","show ip dhcp binding"],["pc","wp1","ping 10.10.0.20"],["term","copy running-config startup-config"],["term",""],
    ["console","lapw",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`After the helper is in, the frame log names the next problem: look for the line that begins <i>&ldquo;LOS-CORE got the relayed Discover, but…&rdquo;</i>. Then look for a pool in <code>show ip dhcp pool</code> whose range contains giaddr.`)}
${K.reveal("Walkthrough — what the evidence said",`<p><b>Not heard:</b> WRI-R1 G0/0 had no pool and no helper, so the Discover died there. <b>Not handled:</b> with the helper in, the log showed <i>giaddr = 10.30.8.1</i> and LOS-CORE finding no pool containing it — only LOS-STAFF (10.10.0.0/24) existed; the scope request was still in someone's queue. Building it with the network line last meant the first leases already carried the gateway, DNS and domain. The return path was fine all along — the sourced ping proved it. You never touched a PC.</p>`)}
${K.check({q:"In the bench, before you created WRI-STAFF, what did LOS-CORE do with the relayed Discover carrying giaddr 10.30.8.1?", o:["Offered an address from LOS-STAFF, because that is its only pool","Found no pool whose network contains 10.30.8.1, so it sent no Offer","Forwarded it to another DHCP server","Offered a 10.30.8.x address from a default range"], a:1, why:"The server chooses the pool by giaddr. 10.30.8.1 is not in 10.10.0.0/24, so nothing matched and no Offer was sent. An IOS server never offers from a pool that doesn't contain giaddr — which also stops a Lagos address landing in Warri."})}
<h3>Same logic, new situation</h3>
<p>Port Harcourt branch: PH-R1 G0/0 is 172.16.40.1/24 with <code>ip helper-address 172.16.1.10</code>. The central server at 172.16.1.10 has a pool <code>network 172.16.4.0 255.255.255.0</code>, <code>default-router 172.16.4.1</code>. PH-R1 can ping the server, and <code>ping 172.16.1.10 source g0/0</code> succeeds too. The PCs still show 169.254. Which checkpoint fails, and what's the fix?</p>
${K.hint(`Heard, Reached, Home are all proven. Write giaddr down and compare it with the pool, digit by digit.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which checkpoint fails. <b>2. Rule:</b> the server uses the pool containing giaddr. <b>3. Apply it:</b> giaddr is <b>172.16.40.1</b>; the pool is 172.16.<b>4</b>.0/24 — a typo — so <b>Handled fails</b> (Heard, Reached and Home are proven). Fix on the server, inside the pool: <code>no network 172.16.4.0 255.255.255.0</code>, <code>default-router 172.16.40.1</code>, then <code>network 172.16.40.0 255.255.255.0</code>, plus exclusions.</p>`)}

<h2>The router as a DHCP client: ip address dhcp on the ISP link</h2>
<p>Now the other way round: a small office's internet router often <i>receives</i> its address from the ISP by DHCP. One line on the ISP-facing interface:</p>
${K.remember(`<b>The rule:</b> <code>ip address dhcp</code> makes the interface run DORA like a PC. From the ISP's Offer it takes an address and mask — and the offered default router becomes a <b>static default route with administrative distance 254</b>: <code>S* 0.0.0.0/0 [254/0] via &lt;ISP gateway&gt;</code>.`)}
<p><b>Why 254?</b> It's almost the worst trust IOS gives a route (255 = never use), so anything you configure yourself — a static default (1), an OSPF default (110) — beats it. The flip side: a leftover static default <b>also</b> beats it, even one pointing at a gateway that's gone.</p>
${K.svg("0 0 760 270",
  K.dev("pc",60,80,"LAN PCs","192.168.70.0/24")+K.dev("router",250,80,"KAN-EDGE","G0/1: ip address dhcp")+K.dev("router",480,80,"ISP-BNG","pool 198.51.100.32/29")+K.dev("cloud",670,80,"INTERNET","")+
  K.link(78,80,226,80,"G0/0")+K.link(274,80,456,80,"G0/1")+K.link(504,80,646,80)+
  K.arrow(262,160,468,160,"Discover · Request (from G0/1)",true)+
  K.arrow(468,192,262,192,"Offer · Ack: 198.51.100.34/29, router 198.51.100.33")+
  K.box(150,214,460,46,"KAN-EDGE installs  S* 0.0.0.0/0 [254/0] via 198.51.100.33","AD 254: any default route you configure yourself wins",true),
  "The same DORA as a PC, from a router interface. The address goes on G0/1; option 3 (default-router) becomes an AD-254 default route.")}
<h3>Worked example: KAN-EDGE takes its address from the ISP</h3>
<p>The pharmacy's new Kano shop; the ISP's email says only <i>&ldquo;set your WAN interface to obtain an address automatically&rdquo;</i>.</p>
${K.out(`KAN-EDGE(config)#interface g0/1
KAN-EDGE(config-if)#ip address dhcp
KAN-EDGE(config-if)#no shutdown
KAN-EDGE(config-if)#end
KAN-EDGE#show logging | include DHCP
*Oct 12 08:30:49.959: %DHCP-6-ADDRESS_ASSIGN: Interface GigabitEthernet0/1 assigned DHCP address 198.51.100.34, mask 255.255.255.248, hostname KAN-EDGE
KAN-EDGE#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.70.1    YES manual up                    up
GigabitEthernet0/1     198.51.100.34   YES DHCP   up                    up
GigabitEthernet0/2     unassigned      YES unset  administratively down down
KAN-EDGE#show ip route
(legend omitted)
Gateway of last resort is 198.51.100.33 to network 0.0.0.0

S*    0.0.0.0/0 [254/0] via 198.51.100.33
      198.51.100.0/24 is variably subnetted, 2 subnets, 2 masks
C        198.51.100.32/29 is directly connected, GigabitEthernet0/1
L        198.51.100.34/32 is directly connected, GigabitEthernet0/1`, "The address arrives on its own, the syslog message records it, Method says DHCP, and the default route appears with AD 254. (show logging | include DHCP keeps only the lines containing 'DHCP'.)")}
<ul>
<li><code>%DHCP-6-ADDRESS_ASSIGN</code> — an informational (severity 6) message: interface, address, mask, hostname. Lesson 6 explains the format.</li>
<li><code>YES DHCP</code> — the address was learned, not typed (<code>manual</code>).</li>
<li><code>S* … [254/0] via 198.51.100.33</code> — a static candidate default, AD 254, next hop = the Offer's default-router.</li>
</ul>
${K.out(`KAN-EDGE#show dhcp lease
Temp IP addr: 198.51.100.34  for peer on Interface: GigabitEthernet0/1
Temp  sub net mask: 255.255.255.248
   DHCP Lease server: 198.51.100.33, state: 3 Bound
   DHCP transaction id: 1A2B
   Lease: 86400 secs,  Renewal: 43200 secs,  Rebind: 75600 secs
Temp default-gateway addr: 198.51.100.33
   Next timer fires after: 11:59:38
   Retry count: 0   Client-ID: cisco-0050.56f6.0002-Gi0/1
   Client-ID hex dump: 636973636F2D303035302E353666362E
                       303030322D4769302F31
   Hostname: KAN-EDGE`, "show dhcp lease — the router's own view of its lease, as the lab prints it. The number before Bound differs between IOS releases (3 in older ones, 5 in many current ones); the word Bound is what tells you the lease is in use.")}
<p><b>Lease server</b> is who renewals go to (unicast). <b>Lease / Renewal / Rebind</b>: one day, T1 at half, T2 at seven-eighths — a PC's timers. <b>Temp default-gateway</b> became the AD-254 route. <b>Client-ID</b>: IOS identifies itself as <code>cisco-&lt;MAC&gt;-&lt;interface&gt;</code>, which the ISP's <code>show ip dhcp binding</code> prints as long wrapped hex. And <code>show running-config</code> keeps <code>ip address dhcp</code>, never the learned address — after a reload the router asks again.</p>
${K.when([
  ["<code>ip address dhcp</code>","The ISP hands out WAN addresses by DHCP, or a temporary site","Follows ISP changes by itself","You publish services that need a fixed address"],
  ["Static WAN address + static default","The ISP assigned a fixed block (servers, VPNs)","Address and gateway never move","The ISP expects DHCP and may change details"],
], "Static or DHCP on the WAN interface")}
${K.mistake(`Moving the WAN to <code>ip address dhcp</code> but leaving the old <code>ip route 0.0.0.0 0.0.0.0 &lt;old gateway&gt;</code>. If that next hop still falls inside the new connected subnet, the AD-1 static stays and the AD-254 default never appears.`)}
${K.myth([
  ["ip helper-address goes on the interface that faces the DHCP server.","It goes on the interface that hears the clients — the client-facing LAN interface or SVI. The unicast leaves wherever the routing table says."],
  ["ip helper-address makes the router forward all broadcasts.","Only UDP broadcasts for eight services by default (DHCP included), as unicasts to that server. ARP still stops at the router."],
  ["A 169.254 address means the PC or its network card is broken.","It means no DHCP Offer came back. The cause is almost always on the path — relay, pool or route — not the PC."],
  ["A default route learned by DHCP is the same as one you type.","It has AD 254, so any default route you configure — static (1) or from OSPF (110) — replaces it."],
])}
${K.dodont([
  "Add &ldquo;helper + scope + return route&rdquo; to the checklist for every new VLAN.",
  "Make each pool's default-router the relay's client-facing address (giaddr).",
  "Test with <code>ping &lt;server&gt; source &lt;client interface&gt;</code>.",
  "Remove the old static default when a WAN moves to <code>ip address dhcp</code>.",
],[
  "Don't put a helper on the WAN — no client broadcasts arrive there.",
  "Don't leave an old pool on a branch router after moving to central DHCP.",
  "Don't use <code>no service dhcp</code> on a relay router — it kills the relay too.",
  "Don't give staff short leases across an unreliable WAN.",
])}
<h3>Try it on the bench: the Abuja shop's new fibre</h3>
<p>Ticket, Monday 09:30: <i>&ldquo;The ISP moved our Abuja shop's fibre to a new access router and emailed: set your WAN interface to DHCP. ABJ-EDGE still can't reach anything beyond the ISP.&rdquo;</i> Do what the ISP asked, find why it still fails, fix it, and prove it from the router. (The LAN PC can't browse whatever you do — private addresses need NAT, lesson 4.)</p>
${K.bench({id:"m7-edge-dhcp", points:100, from:"CCNA · Module 7 · lesson 2", title:"Abuja shop — the WAN goes DHCP, the internet doesn't", viewBox:"0 0 860 430", openLog:true,
  intro:"LAPTOP is on ABJ-EDGE's console (9600 8N1, no flow control). ABJ-EDGE: G0/0 shop LAN 192.168.50.0/24 (it is also the LAN's DHCP server) · G0/1 to the ISP, currently 203.0.113.18/29 typed by hand. ISP-PE is the ISP's router — you have no login to it, as in real life. WEB 198.51.100.10 is the ISP's test server. In this lab the ISP's DHCP server is an IOS router and leases never expire.",
  devices:[
    {id:"lapa", kind:"laptop", label:"LAPTOP", x:30, y:20},
    {id:"edge", kind:"router", label:"ABJ-EDGE", model:"ISR 1100 · Abuja shop", x:200, y:130,
      config:e=>{ ["en","conf t","hostname ABJ-EDGE","interface g0/0","description SHOP LAN","ip address 192.168.50.1 255.255.255.0","no shutdown","interface g0/1","description WAN to ISP - circuit ABJ-0042","ip address 203.0.113.18 255.255.255.248","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.17",
        "ip dhcp excluded-address 192.168.50.1 192.168.50.9","ip dhcp pool SHOP-LAN","network 192.168.50.0 255.255.255.0","default-router 192.168.50.1","dns-server 198.51.100.53","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"asw", kind:"switch", label:"ABJ-SW1", model:"Catalyst 9200", x:120, y:240},
    {id:"ap1", kind:"pc", label:"ABJ-PC1", x:300, y:320, dhcp:true},
    {id:"isp", kind:"router", label:"ISP-PE", model:"ISP access router (no login)", x:540, y:130,
      config:e=>{ ["en","conf t","hostname ISP-PE","interface g0/1","description CUST ABJ-0042","ip address 203.0.113.22 255.255.255.248","no shutdown","interface g0/0","ip address 198.51.100.1 255.255.255.0","no shutdown","exit",
        "ip dhcp excluded-address 203.0.113.17","ip dhcp excluded-address 203.0.113.19 203.0.113.22","ip dhcp pool CUST-ABJ-0042","network 203.0.113.16 255.255.255.248","default-router 203.0.113.22","dns-server 198.51.100.53","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"web", kind:"server", label:"WEB", x:720, y:250, ip:"198.51.100.10", mask:"255.255.255.0", gw:"198.51.100.1"},
  ],
  cables:[ {type:"cat6", a:"edge:g0", b:"asw:g1"}, {type:"cat6", a:"ap1:eth", b:"asw:g2"}, {type:"cat6", a:"edge:g1", b:"isp:g1"}, {type:"cat6", a:"web:eth", b:"isp:g0"}, {type:"console", a:"lapa:usb", b:"edge:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce from the router: console into ABJ-EDGE, <code>enable</code>, <code>ping 198.51.100.10</code> — 0 percent", done:B=>B.devs.edge.env.log.some(l=>/^\s*ping\s+198\.51\.100\.10\s*$/i.test(l.cmd||"") && /Success rate is 0 percent/.test(l.out||""))},
    {text:"Do what the ISP asked: <code>configure terminal</code>, <code>interface g0/1</code>, <code>ip address dhcp</code> (this replaces the typed address), <code>end</code>", done:B=>Bench.ifLeased(B,"edge","GigabitEthernet0/1")==="203.0.113.18"},
    {text:"Read the result: <code>show logging | include DHCP</code> (the %DHCP-6-ADDRESS_ASSIGN message), <code>show ip interface brief</code> (Method DHCP) and <code>show dhcp lease</code> — which gateway did the ISP's Offer name?", done:B=>B.devs.edge.env.log.some(l=>/DHCP Lease server: 203\.0\.113\.22/.test(l.out||"")) && B.devs.edge.env.log.some(l=>/GigabitEthernet0\/1\s+203\.0\.113\.18\s+YES DHCP/.test(l.out||""))},
    {text:"<code>ping 198.51.100.10</code> still fails. <code>show ip route</code>: which default route is installed, and why is there no <code>[254/0]</code> line? (Think administrative distance, and whether the old next hop still resolves)", done:B=>{ const L = B.devs.edge.env.log, k = L.findIndex(l=>/^\s*ip\s+add\S*\s+dhcp\s*$/i.test(l.cmd||"")); return k>=0 && L.slice(k).some(l=>/S\*\s+0\.0\.0\.0\/0 \[1\/0\] via 203\.0\.113\.17/.test(l.out||"")); }},
    {text:"Remove the stale route: <code>configure terminal</code>, <code>no ip route 0.0.0.0 0.0.0.0 203.0.113.17</code>, <code>end</code>. Then <code>show ip route</code>: <code>S* 0.0.0.0/0 [254/0] via 203.0.113.22</code> takes its place", done:B=>!B.devs.edge.env.routes.some(r=>r.net==="0.0.0.0" && r.nh==="203.0.113.17") && B.devs.edge.env.log.some(l=>/S\*\s+0\.0\.0\.0\/0 \[254\/0\] via 203\.0\.113\.22/.test(l.out||""))},
    {text:"Prove it: <code>ping 198.51.100.10</code> (the first dot is ARP for the new gateway) and <code>traceroute 198.51.100.10</code> — hop 1 is the ISP's new router, 203.0.113.22", done:B=>{ const L = B.devs.edge.env.log; return L.some(l=>/^\s*ping\s+198\.51\.100\.10\s*$/i.test(l.cmd||"") && /Success rate is [1-9]\d* percent/.test(l.out||"")) && L.some(l=>/^\s*tr\S*\s+198\.51\.100\.10/i.test(l.cmd||"") && /1 203\.0\.113\.22 /.test(l.out||"")); }},
    {text:"<code>show running-config | section interface GigabitEthernet0/1</code> keeps <code>ip address dhcp</code>, not the learned address. Save with <code>copy running-config startup-config</code>", done:B=>B.devs.edge.env.savedOnce && B.devs.edge.env.log.some(l=>/section/i.test(l.cmd||"") && /interface GigabitEthernet0\/1\n[\s\S]*ip address dhcp/.test(l.out||""))},
    {text:"Finally, on ABJ-PC1: <code>ipconfig</code>. It leased 192.168.50.x from ABJ-EDGE — the same router is a DHCP <b>server</b> on G0/0 and a DHCP <b>client</b> on G0/1", done:B=>(Bench.leased(B,"ap1")||"").startsWith("192.168.50.") && Bench.tried(B,"ap1",/^\s*ipconfig\s*$/i)},
  ],
  win:"You moved the WAN interface to DHCP and read the evidence — the ADDRESS_ASSIGN message, Method DHCP, the lease and its gateway — then spotted why the internet still failed: the old static default (AD 1) still resolved inside the new /29 and beat the DHCP default (AD 254). Removing it let S* [254/0] via the ISP's real gateway take over.",
  solve:[["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","ping 198.51.100.10"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip address dhcp"],["term","end"],
    ["term","show logging | include DHCP"],["term","show ip interface brief"],["term","show dhcp lease"],["term","ping 198.51.100.10"],["term","show ip route"],
    ["term","configure terminal"],["term","no ip route 0.0.0.0 0.0.0.0 203.0.113.17"],["term","end"],["term","show ip route"],
    ["term","ping 198.51.100.10"],["term","traceroute 198.51.100.10"],["term","show running-config | section interface GigabitEthernet0/1"],["term","copy running-config startup-config"],["term",""],
    ["pc","ap1","ipconfig"]]})}
${K.hint(`Stuck at task 4? The lease put G0/1 back into 203.0.113.16/29, so the old next hop 203.0.113.17 is &ldquo;directly connected&rdquo; again and the AD-1 static is still valid as far as IOS is concerned. Two defaults for the same prefix: the lower AD wins. Who still answers at .17?`)}
${K.reveal("Walkthrough — why the DHCP default was invisible",`<p>The ISP kept the address (.18) and the /29, but its new router answers on <b>.22</b>. The old static via .17 still resolved through the connected /29, so it stayed: AD 1 beats 254, and only the winner is installed. Packets went to .17, which nobody answers ARP for. Without the stale static the DHCP default took over by itself — the ISP's email was right, but incomplete.</p>`)}
${K.check({q:"A router's ISP interface uses ip address dhcp and the lease gives default-router 198.51.100.33. The engineer also configures ip route 0.0.0.0 0.0.0.0 198.51.100.33. What does show ip route show for 0.0.0.0/0?", o:["S* 0.0.0.0/0 [254/0] via 198.51.100.33 only","S* 0.0.0.0/0 [1/0] via 198.51.100.33 only — the typed static (AD 1) wins","Both routes, load-sharing","Neither, because they conflict"], a:1, why:"Same prefix, two sources: the lower administrative distance wins, and only the winner is installed. Here both point to the same gateway, so traffic flows either way — but the typed route will stay even if the ISP later changes its gateway."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A branch router learns a default route from head office by OSPF (O*E2 0.0.0.0/0 [110/1]) over an MPLS link. Its G0/2 goes to a cheap broadband line with ip address dhcp, whose lease names gateway 203.0.113.9. Fill in the administrative distance of each default, and which next hop the router uses while MPLS is up.", fields:[
  {label:"AD of the OSPF default", a:["110"]},
  {label:"AD of the DHCP-learned default", a:["254"]},
  {label:"Next hop used while MPLS is up (OSPF or the broadband gateway's IP)", a:["ospf","the ospf next hop","the ospf route","via ospf","ospf next hop","head office","mpls"]}],
  why:"1. Asked: which default wins, and why. 2. Rule: for the same prefix the lower AD wins; a DHCP-learned default is AD 254. 3. Apply: OSPF's 110 beats 254, so traffic follows the OSPF default over MPLS. If MPLS fails and the OSPF default disappears, the DHCP default (254) is installed by itself — AD 254 makes a DHCP-learned default a ready-made floating backup."})}

<h2>Interview corner</h2>
${K.hint(`Walk the Discover: heard, reached, handled, home — and name the command for each.`)}
${K.reveal("“A new VLAN's PCs all get 169.254 addresses, but every other VLAN is fine. How do you troubleshoot it?”",`<p>"169.254 means no Offer arrived, so I follow the Discover. Heard: does the new SVI have ip helper-address to our servers? Reached: can the switch ping the server? Handled: is there a scope containing the SVI's address — the giaddr — with the SVI as gateway? Home: I ping the server sourced from the new SVI, because the Offer goes to giaddr; a missing route back is common with new VLANs and a plain ping hides it. Then I check one PC's ipconfig /all."</p>`)}
${K.hint(`Two jobs: choosing the pool, and being the reply address.`)}
${K.reveal("“What is giaddr, and why does it matter?”",`<p>"It's the gateway IP address field in the DHCP header. The client sends zero; the first relay writes the address of the interface that heard the client. The server picks the scope whose subnet contains giaddr — its only clue to where an addressless client is — and sends the Offer and Ack back to giaddr. So the server needs a route to every relay interface, and each scope's gateway is normally that address: on Cisco, the interface carrying ip helper-address."</p>`)}
${K.hint(`ip address dhcp, the default-router option, AD 254 — and what can beat it.`)}
${K.reveal("“Your branch router gets its WAN address from the ISP by DHCP. How does it get a default route, and what could stop that working?”",`<p>"With ip address dhcp the interface runs DORA like a PC; the default-router option becomes S* 0.0.0.0/0 [254/0]. I verify with show ip interface brief (Method DHCP), show dhcp lease and show ip route. AD 254 means any other default wins — useful when DHCP broadband is the backup behind OSPF, a trap when an old static points at a dead gateway. The address isn't in the config; after a reload it asks again."</p>`)}

${K.recap([
  "Routers never forward broadcasts, so a Discover dies at the first router unless that interface relays it; with no Offer, Windows uses APIPA.",
  "ip helper-address goes on the interface or SVI that hears the clients; it unicasts the Discover to the server with giaddr = that interface's address.",
  "The server picks the pool containing giaddr and replies to giaddr — so it needs a route back; the pool's default-router is that same address.",
  "Relayed clues: DHCP Server in ipconfig /all is the central server; the IOS binding says Interface Unknown.",
  "Follow the Discover: Heard, Reached, Handled, Home — the last tested with ping &lt;server&gt; source &lt;client interface&gt;.",
  "Leased devices survive WAN outages until the lease expires: make leases longer than the worst outage; two servers need split ranges or failover.",
  "ip address dhcp: Method DHCP, %DHCP-6-ADDRESS_ASSIGN, show dhcp lease, and S* 0.0.0.0/0 [254/0], which any default you configure overrides.",
])}
${K.next(`<b>Lesson 3 — DNS.</b> Every lease you handed out today carried a DNS server option. Next: what that server does with a name — resolvers and authoritative servers, A and other records, the DNS suffix — and how to tell a DNS fault from a routing fault with nslookup, ping by name and a router's own DNS commands.`)}
`,
quiz:[
  {lvl:1, q:"A branch PC set to obtain an address automatically gets 169.254.40.11. The DHCP server is at head office, and the branch router has only IP addresses and a default route configured. Why?", o:["The head-office server has run out of addresses","The DHCP Discover is a broadcast, and the branch router doesn't forward broadcasts, so the server never hears it","DHCP only works when the server and PC use the same switch model","The PC's default gateway is wrong"], a:1, why:"A Discover goes to 255.255.255.255, and routers stop broadcasts at their interfaces. Without ip helper-address on the branch LAN interface, nothing relays it, no Offer comes back, and Windows assigns itself an APIPA address. The PC has no gateway yet, so the gateway can't be the cause."},
  {lvl:1, type:"fill", q:"Which interface configuration command makes a router relay the DHCP broadcasts it hears on that interface to a DHCP server at 10.0.50.10?", fields:[{label:"Command", a:["ip helper-address 10.0.50.10"], ios:true}], why:"ip helper-address 10.0.50.10 (abbreviated ip helper 10.0.50.10), entered under the client-facing interface. Each helper line sends a copy of each relayed broadcast to that server."},
  {lvl:1, q:"On which interface does ip helper-address belong?", o:["The interface that receives the clients' broadcasts — the client-facing LAN interface or SVI","The interface facing the DHCP server","Every interface on the router","The WAN interface towards head office"], a:0, why:"The relay acts on broadcasts it hears, so the helper goes where the clients' broadcasts arrive. The relayed unicast leaves by whatever interface the routing table picks — no helper is needed there."},
  {lvl:2, q:"What does a DHCP server use the giaddr field of a relayed Discover for?", o:["Only to log which router relayed the request","To choose the pool whose network contains giaddr, and as the address it sends the Offer back to","To set the client's DNS server","To check the client's MAC address against a reservation"], a:1, why:"The client has no address, so giaddr — the relay interface that heard it — is the server's only clue to the client's subnet. The server also unicasts its replies to giaddr, which is why the server needs a route back to it."},
  {lvl:2, type:"order", q:"Put the steps of a relayed DHCP exchange in order.", items:["The PC broadcasts a Discover on its LAN","The relay writes giaddr and sends the Discover to the server as a unicast","The server picks the pool containing giaddr and sends an Offer to giaddr","The relay delivers the Offer to the PC on its LAN","The PC broadcasts a Request, which the relay forwards to the server the same way","The server's Ack reaches the PC through the relay"], why:"Discover (broadcast) → relayed unicast with giaddr → Offer to giaddr → Offer delivered on the LAN → Request (broadcast again, relayed) → Ack via the relay. Later renewals at T1 go straight to the server as unicasts."},
  {lvl:2, type:"multi", q:"With its default settings, which two of these broadcasts does ip helper-address forward to the helper address? (Choose two.)", o:["A DHCP Discover (UDP 67)","A DNS query sent as a broadcast (UDP 53)","An ARP request","An OSPF hello","An HTTPS connection (TCP 443)"], a:[0,1], why:"By default the helper forwards UDP broadcasts for eight services: Time 37, IEN-116 name service 42, TACACS 49, DNS 53, BOOTP/DHCP 67 and 68, TFTP 69, NetBIOS 137 and 138. ARP isn't UDP and is never relayed; OSPF hellos are multicast to routers; HTTPS is TCP unicast."},
  {lvl:2, q:"Branch PCs on 192.168.60.0/24 get APIPA addresses. The central DHCP server at 10.0.50.10 has a correct pool for 192.168.60.0/24 and a route back to the branch. Based on the exhibit, what is wrong?", ex:"ENU-R1#show running-config | section interface\ninterface GigabitEthernet0/0\n description ENUGU LAN\n ip address 192.168.60.1 255.255.255.0\ninterface GigabitEthernet0/1\n description WAN to HQ\n ip address 10.0.0.6 255.255.255.252\n ip helper-address 10.0.50.10", o:["The helper is on the WAN interface; it must be under G0/0, where the PCs' broadcasts arrive","The helper address must be the server's gateway, not the server","The pool needs default-router 10.0.0.6","ENU-R1 needs no service dhcp"], a:0, why:"No client broadcasts arrive on G0/1, so the helper there never fires; the Discovers die on G0/0. Move it: interface g0/1, no ip helper-address 10.0.50.10; interface g0/0, ip helper-address 10.0.50.10. The pool's default-router should be 192.168.60.1."},
  {lvl:3, q:"Since Kaduna moved to central DHCP, PCs get addresses but can't reach anything outside their own LAN, not even the gateway's other interfaces. Based on the exhibit, what is the fix?", ex:"C:\\>ipconfig /all\n   (excerpt)\n   DHCP Enabled. . . . . . . . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : 10.40.20.33(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.0.50.1\n   DHCP Server . . . . . . . . . . . : 10.0.50.10\n   DNS Servers . . . . . . . . . . . : 10.0.50.53", o:["On the server, change the pool's default-router to 10.40.20.1, the relay's address on the PCs' LAN","Add a second ip helper-address on the branch router","Change the PCs to static addresses with gateway 10.0.50.1","Add a route on the server back to 10.40.20.0/24"], a:0, why:"The lease worked — relay, pool and return route are fine — but the pool hands out 10.0.50.1, the server's own gateway, which isn't on 10.40.20.0/24. A PC's gateway must be on its own subnet, because the PC has to reach it directly on the LAN. The pool's default-router must be the branch LAN's gateway, 10.40.20.1 (the giaddr). PCs pick it up at renewal, or at once with ipconfig /renew."},
  {lvl:3, type:"multi", q:"New VLAN 40 (10.20.40.0/24) on a Layer 3 switch: its SVI has the helper, and the DHCP server has a scope for 10.20.40.0/24. PCs get APIPA. From the switch, ping 10.0.50.10 succeeds, but ping 10.0.50.10 source vlan40 fails. Which two statements are correct? (Choose two.)", o:["The routers on the server's side have no route to 10.20.40.0/24, so the Offer sent to giaddr can't get back","Moving the helper to the switch's uplink port will fix it","A summary route such as 10.20.0.0/16 towards the core on the server-side router would fix this and future VLANs","The scope's default-router must be the server's address","Running no service dhcp on the switch will let the server answer directly"], a:[0,2], why:"The sourced ping uses giaddr, 10.20.40.1: it failing while the plain ping works means the server's side has no route back to the new subnet. Adding that route — or a summary covering all user VLANs, or advertising it by OSPF — fixes it. The helper must stay on the SVI, the scope's gateway is the SVI, and no service dhcp would disable the relay."},
  {lvl:1, type:"match", q:"Match each term with its meaning.", pairs:[["giaddr","The relay interface's address, written into a relayed DHCP message"],["ip helper-address","Interface command that turns on DHCP relay to a server"],["APIPA","169.254.x.x address Windows uses when no DHCP Offer arrives"],["S* 0.0.0.0/0 [254/0]","Default route learned from a DHCP lease on a router"],["Interface Unknown in show ip dhcp binding","A lease given to a client reached through a relay"]], why:"giaddr is the relay's interface address; ip helper-address enables the relay; APIPA is Windows' fallback; AD 254 marks the DHCP-learned default; a relayed client isn't on any of the server's own interfaces, so the binding says Unknown."},
  {lvl:2, q:"An edge router was moved to ip address dhcp. The lease is bound (exhibit), but nothing beyond the ISP answers. Why is there no [254/0] route?", ex:"KAD-EDGE#show dhcp lease\nTemp IP addr: 203.0.113.10  for peer on Interface: GigabitEthernet0/1\nTemp  sub net mask: 255.255.255.248\n   DHCP Lease server: 203.0.113.14, state: 3 Bound\n   Lease: 86400 secs,  Renewal: 43200 secs,  Rebind: 75600 secs\nTemp default-gateway addr: 203.0.113.14\n\nKAD-EDGE#show ip route | include 0.0.0.0/0\nS*    0.0.0.0/0 [1/0] via 203.0.113.9", o:["An old static default via 203.0.113.9 (AD 1) is still configured and resolves in the new subnet, so it beats the DHCP default (AD 254)","The lease has expired","DHCP-learned routes never appear in show ip route","The ISP didn't send a default-router option"], a:0, why:"The lease names 203.0.113.14 as gateway, so the DHCP default exists — but for the same prefix only the lowest AD is installed, and the typed static (AD 1) via 203.0.113.9, which is inside 203.0.113.8/29, still resolves. Remove it with no ip route 0.0.0.0 0.0.0.0 203.0.113.9 and S* [254/0] via 203.0.113.14 appears."},
  {lvl:2, type:"fill", q:"Fill in the commands for a router that takes its WAN address from the ISP.", fields:[{label:"Interface command that makes G0/1 a DHCP client", a:["ip address dhcp"], ios:true},{label:"Privileged EXEC command showing the lease server, gateway and timers", a:["show dhcp lease"], ios:true}], why:"ip address dhcp under the interface starts DORA from that interface; show dhcp lease shows the leased address, lease server, default gateway, lease/renewal/rebind timers and the client ID. show ip dhcp binding is the server-side view, not the client's."},
  {lvl:3, q:"A bank runs DHCP from two central servers. A branch's WAN link fails for five hours. Staff PCs have 8-day leases; a visitor arrives with a new laptop during the outage. What happens?", o:["The staff PCs keep working with their leases; the visitor's laptop gets a 169.254 address until the link returns","Every PC drops to 169.254 as soon as renewal fails","The branch router hands the visitor an address from its helper","The staff PCs switch to their second server, which is local"], a:0, why:"A lease stays valid until it expires; renewal failures are retried (unicast at T1, broadcast at T2) and five hours is nothing against 8 days. A new device has no lease and its relayed Discovers can't reach either server, so it falls back to APIPA. A relay has no addresses of its own."},
  {lvl:2, q:"A branch router relays DHCP for its LAN. An engineer types no service dhcp on it to make sure it 'isn't also acting as a server'. What happens to the branch's PCs?", o:["Nothing changes — the relay keeps working","The router stops relaying as well, so PCs that need a new lease get APIPA","The PCs get addresses from the router's interface instead","Existing leases are cancelled immediately"], a:1, why:"On IOS, no service dhcp disables both the DHCP server and the relay agent. Existing leases run on until they expire, but new requests and rebinding broadcasts are no longer relayed. To stop the router serving locally, remove its pool instead."},
  {lvl:2, q:"Based on the exhibit, when will KAN-EDGE first try to extend its lease, and how?", ex:"KAN-EDGE#show dhcp lease\nTemp IP addr: 198.51.100.34  for peer on Interface: GigabitEthernet0/1\nTemp  sub net mask: 255.255.255.248\n   DHCP Lease server: 198.51.100.33, state: 3 Bound\n   Lease: 86400 secs,  Renewal: 43200 secs,  Rebind: 75600 secs\nTemp default-gateway addr: 198.51.100.33", o:["After 43,200 seconds (12 hours), with a unicast Request to the lease server 198.51.100.33","After 86,400 seconds, with a broadcast Discover","After 75,600 seconds, with a unicast Request to 198.51.100.33","Never: router leases are permanent"], a:0, why:"Renewal is T1, half the 1-day lease: 43,200 s. The client asks the server that gave the lease, by unicast. Only if that keeps failing does it rebind at T2 (75,600 s, 87.5%) by broadcasting to any server."},
  {lvl:3, q:"A campus adds a second DHCP server. Both servers are given the full range 10.20.30.21–254 for VLAN 30, with no failover, and the SVI gets a helper for each. What risk does this create?", o:["Each server tracks only its own leases, so both can hand the same address to two different PCs — conflicts","The relay will refuse two helper addresses","PCs will receive two addresses each","No risk: the PC's broadcast Request stops the other server from ever offering anything"], a:0, why:"Both servers receive every Discover and may both offer. Each knows only its own bindings, so server B can later offer an address server A already leased to another PC. Pinging before offering (IOS does this) reduces but doesn't remove the risk. Split the range between the servers, or use their failover feature so they share one lease database."},
],
cards:[
  {f:"Why a DHCP Discover stops at a router", b:"It's a broadcast (0.0.0.0 → 255.255.255.255) and routers never forward broadcasts. Without a relay the server never hears it; Windows ends up with APIPA 169.254.x.x."},
  {f:"ip helper-address", b:"Interface command that makes a router a DHCP relay agent: broadcasts heard on that interface are sent as unicasts to the server, with giaddr = that interface's address. One line per server."},
  {f:"Where the helper goes", b:"Under the interface that hears the clients — the client-facing LAN interface, subinterface or SVI. Never the WAN or the server's side."},
  {f:"giaddr", b:"Gateway IP address field. The relay writes the client-facing interface address. The server (1) picks the pool containing giaddr and (2) sends its Offer and Ack to giaddr."},
  {f:"Heard, Reached, Handled, Home", b:"Follow the Discover: helper on the client interface? server reachable from the relay? a pool containing giaddr? a route from the server back to giaddr (test: ping server source <client interface>)?"},
  {f:"Default-router in a relayed pool", b:"The relay's client-facing address (same as giaddr) — the clients' own LAN gateway, never the server's gateway."},
  {f:"Clues a lease was relayed", b:"ipconfig /all: DHCP Server = the central server, not the gateway. show ip dhcp binding on an IOS server: Interface Unknown."},
  {f:"Services ip helper-address forwards by default", b:"Eight UDP services: Time 37, IEN-116 name service 42, TACACS 49, DNS 53, BOOTP/DHCP 67 and 68, TFTP 69, NetBIOS 137 and 138. ARP is never relayed."},
  {f:"no service dhcp", b:"Disables the IOS DHCP server AND the relay agent. Don't use it on a relay router to stop local serving — remove the pool instead."},
  {f:"Central DHCP and WAN outages", b:"Devices with leases keep working until the lease expires (renew at T1 = 50%, rebind at T2 = 87.5%). New devices fail. Make staff leases longer than the worst outage."},
  {f:"Two DHCP servers", b:"Two helper lines send each Discover to both. Give them split ranges or use failover — two independent full ranges can lease one address to two PCs."},
  {f:"ip address dhcp", b:"Makes a router interface a DHCP client. Verify: %DHCP-6-ADDRESS_ASSIGN, show ip interface brief (Method DHCP), show dhcp lease, show ip route. The config keeps 'ip address dhcp', not the address."},
  {f:"S* 0.0.0.0/0 [254/0]", b:"The default route a router builds from the DHCP lease's default-router option. AD 254: a static (1) or OSPF (110) default beats it — handy as a backup, a trap with a stale static."},
],
});

// ---------- Module 7 · Lesson 3 ----------
L.push({
id:"svc-dns", mins:90, level:"Beginner+ · builds on Modules 1–6 and lessons 1–2",
t:"DNS: how names become addresses — and how to tell a DNS fault from a routing fault",
html:`
${K.goals([
  "Explain how a name becomes an IP address: stub resolver, recursive resolver, authoritative servers, cache and TTL.",
  "Say what A, AAAA, CNAME, MX, PTR, NS and SOA records answer, and how the DNS suffix completes a short name.",
  "Use ipconfig /all, nslookup, ping/tracert by name and ipconfig /flushdns on Windows, and read every line nslookup prints.",
  "Configure IOS name services — ip host, ip domain lookup, ip domain name, ip name-server — and ip dns server on a branch router.",
  "Decide in three commands whether a ticket is a DNS or a routing fault, and fix DNS faults at their source — often the DHCP pool.",
])}
${K.pre(["Module 1: what DNS is for (the phone book), ports, TCP and UDP, and reading <code>ipconfig /all</code>.","Module 2: <code>no ip domain-lookup</code> and the typo trap, and <code>ip domain-name</code> for SSH keys.","Module 5: the routing table, <code>show ip route</code> and the troubleshooting method; Module 6: AAAA records and anycast.","Lessons 1–2 of this module: DHCP pools and their <code>dns-server</code> and <code>domain-name</code> options, <code>ipconfig /renew</code>, relay."])}

<h2>Why this matters at work</h2>
<p>Tuesday, 08:40, at a managed-service provider in Ikeja. Three tickets arrive in ten minutes. A haulage company in Port Harcourt: &ldquo;the intranet is down&rdquo; — yet a technician on site opens it by typing its IP address. The Kano branch of a distributor: &ldquo;nothing opens by name since the router was replaced&rdquo;. And an accounts office: &ldquo;payroll works for half of us; the rest get a dead page since the weekend migration&rdquo;.</p>
<p>None of the three is a routing fault, and none needs a new cable. All three are <b>name resolution</b>: a PC asking the wrong server, a router that doesn't answer DNS, and old answers remembered too long. Proving that in a few commands closes them before lunch; this lesson gives you the proof.</p>

<h2>What DNS does: names for people, addresses for packets</h2>
${K.remember(`<b>The rule:</b> packets carry IP addresses, never names. Before a PC can send the first packet to a name, it must turn that name into an address — that is DNS's whole job. If it fails, <b>nothing is sent to the destination at all</b> — so &ldquo;works by IP, not by name&rdquo; points at name resolution first.`)}
<p>Module 1 called ${K.g("DNS","Domain Name System: the distributed database that turns names into IP addresses (and answers other questions about names). Module 1.")} the internet's phone book. Here is how the book is organised.</p>
<h3>A name is read from right to left</h3>
<p>A complete name such as <code>portal.corp.example.com.</code> is a ${K.g("FQDN","Fully Qualified Domain Name: a name written all the way to the root of the DNS tree — nothing left to guess.")}. It is a list of ${K.g("labels","The parts of a DNS name between the dots, up to 63 characters each: portal, corp, example, com.")} separated by dots, and it is read <b>right to left</b>, from the top of a tree downwards:</p>
<ul>
<li>the final dot is the <b>root</b> — rarely typed, always there;</li>
<li><code>com</code> is the ${K.g("TLD","Top-Level Domain: the last label of a name — generic ones such as com, net, org, or country codes such as ng (Nigeria) and uk.")};</li>
<li><code>example.com</code> is the organisation's domain; <code>corp</code> a subdomain it created; <code>portal</code> one device's name.</li>
</ul>
${K.svg("0 0 760 410",
  K.txt(380,24,"portal . corp . example . com . (root)",{c:"fg",s:14,mid:true,b:true})+
  K.band(40,38,110,30,"portal")+K.band(170,38,100,30,"corp")+K.band(290,38,120,30,"example")+K.band(430,38,90,30,"com")+K.band(540,38,60,30,".")+
  K.txt(95,88,"host name",{mid:true,s:10.5,f:"body"})+K.txt(220,88,"subdomain",{mid:true,s:10.5,f:"body"})+K.txt(350,88,"organisation's",{mid:true,s:10.5,f:"body"})+K.txt(350,102,"domain",{mid:true,s:10.5,f:"body"})+
  K.txt(475,88,"top-level",{mid:true,s:10.5,f:"body"})+K.txt(475,102,"domain (TLD)",{mid:true,s:10.5,f:"body"})+K.txt(570,88,"root",{mid:true,s:10.5,f:"body"})+
  K.arrow(600,129,60,129,"read right to left = down the tree",true)+
  K.box(330,140,100,40,"\".\"","root zone",true)+
  K.box(130,200,100,34,"com")+K.box(330,200,100,34,"net")+K.box(530,200,100,34,"ng")+
  K.link(380,180,180,200)+K.link(380,180,380,200)+K.link(380,180,580,200)+
  K.box(115,258,130,34,"example.com")+K.link(180,234,180,258)+
  K.box(100,316,160,34,"corp.example.com")+K.link(180,292,180,316)+
  K.box(100,372,160,30,"portal → 10.10.50.80","",true)+K.link(180,350,180,372)+
  K.txt(290,272,"a zone: its authoritative servers answer for it",{s:11,f:"body",c:"fg"})+
  K.txt(290,330,"a subdomain: in the same zone, or handed to other servers",{s:11,f:"body",c:"fg"})+
  K.txt(290,390,"a record inside the zone: name, type A, address",{s:11,f:"body",c:"fg"}),
  "One FQDN and the tree it lives in. Each level only knows who is responsible for the level below it; the address itself is held by the servers for the zone at the bottom.")}
<h3>Nobody holds the whole book</h3>
<p>No server knows every name. The tree is cut into ${K.g("zones","A part of the DNS tree that one set of servers is responsible for, e.g. example.com and everything under it (unless handed on to others).")}, and each zone's owner runs the ${K.g("authoritative servers","The DNS servers that hold a zone's records and give the definitive answers for it.")} for it. The root knows only who runs each TLD, <code>com</code> only who runs <code>example.com</code>. This ${K.g("delegation","A parent zone pointing at the servers of a child zone: 'I don't hold example.com — ask these servers.'")} is why DNS scales: every organisation looks after its own part.</p>
<p>DNS queries travel in ${K.g("UDP","User Datagram Protocol: connectionless transport, one request and one reply, no handshake (Module 1).")} on <b>port 53</b> — one question, one answer. TCP port 53 is used for answers too big for one UDP reply and for <b>zone transfers</b> (a secondary server copying a whole zone).</p>
${K.dyk(`Before DNS, every ARPANET computer downloaded one hand-edited file, <code>HOSTS.TXT</code>, from SRI's Network Information Center. By the early 1980s it couldn't keep up, and Paul Mockapetris designed DNS (RFCs 882/883, 1983; today's RFCs 1034/1035 are from 1987). The idea survives as every PC's <code>hosts</code> file and IOS's <code>ip host</code>.`)}
${K.check({q:"A user can open https://10.10.50.80 but not https://portal.corp.example.com. Which statement is true?", o:["The router has no route to 10.10.50.0/24","Name resolution is failing: by name, the PC never learns the address, so it never sends a packet to the portal","The portal's web server is down","The switch port is in the wrong VLAN"], a:1, why:"The working IP proves path, server and VLAN. By name the PC must first ask DNS; if that fails, no packet is sent towards the portal."})}
<h3>Same logic, new situation</h3>
<p>A colleague says, &ldquo;the Abuja router can't route to <code>mail.abuja.example.net</code>&rdquo;. And the manager asks: if every DNS server in Lagos failed, which servers could still answer for <code>mail.abuja.example.net</code>?</p>
${K.hint(`What does a router forward on — names or addresses? And which servers hold the records for a zone?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether a router &ldquo;routes to a name&rdquo;, and who holds a name's address. <b>2. Rules:</b> routers forward on addresses only; a zone's records are held by its authoritative servers. <b>3. Apply it:</b> either the PC failed to resolve the name (DNS) or the router can't reach the resulting address (routing) — find out which. The answer comes from <code>example.net</code>'s authoritative servers (or <code>abuja.example.net</code>'s, if delegated). Lagos's servers matter only if they are those servers or the resolvers users ask.</p>`)}

<h2>How a lookup travels: resolvers, authoritative servers and the cache</h2>
${K.remember(`<b>The rule:</b> your PC asks <b>one</b> server <b>one</b> question and waits for a complete answer. That server — the <b>recursive resolver</b> — does the legwork: it asks the root, then the TLD servers, then the zone's authoritative servers, each of which replies &ldquo;not me — ask them&rdquo; until the last one gives the answer. Every answer carries a <b>TTL</b>, and everyone who receives it may <b>cache</b> it for that many seconds.`)}
<p>Three roles, often confused:</p>
<ul>
<li>The ${K.g("stub resolver","The DNS client built into every operating system (Windows: the DNS Client service). It asks its configured server and caches answers; it never walks the tree.")} on the PC asks its configured DNS server and caches what comes back.</li>
<li>The ${K.g("recursive resolver","A DNS server that finds the full answer for a client by asking root, TLD and authoritative servers, then caches it — a company, ISP or public DNS server.")} — the PC's <i>DNS Servers</i> line — finds the answer.</li>
<li>The <b>authoritative servers</b> hold the zone's records. Their answers are <i>authoritative</i>; one passed on from a cache is <i>non-authoritative</i> — nslookup says which.</li>
</ul>
<p>The PC's question is a <b>recursive query</b> (&ldquo;give me the final answer&rdquo;). The resolver's questions to the tree are <b>iterative</b>: each server answers with what it knows — often a ${K.g("referral","A reply saying 'not me — these servers handle the next part of the name'.")}.</p>
${K.svg("0 0 760 430",
  K.dev("pc",80,190,"PC","stub resolver")+K.dev("server",330,190,"RESOLVER","recursive · caches")+
  K.dev("server",640,60,"ROOT SERVER","\".\": who runs com?")+K.dev("server",640,190,"com TLD SERVER","who runs example.com?")+K.dev("server",640,320,"ns1.example.com","authoritative for example.com")+
  K.arrow(102,182,306,182,"1 · portal.corp.example.com?",true)+K.arrow(306,200,102,200,"8 · 10.10.50.80, TTL 3600")+
  K.link(356,176,614,68,"2 query · 3 referral")+K.link(358,190,612,190,"4 query · 5 referral")+K.link(352,204,614,312,"6 query · 7 answer")+
  K.txt(20,282,"1  The PC asks its DNS server — one recursive query.",{s:11,f:"body",c:"fg"})+
  K.txt(20,299,"2–3  Root: \"I don't know — ask the com servers.\"",{s:11,f:"body"})+
  K.txt(20,316,"4–5  com: \"ask example.com's servers.\"",{s:11,f:"body"})+
  K.txt(20,333,"6–7  ns1.example.com: \"10.10.50.80\" (authoritative).",{s:11,f:"body"})+
  K.txt(20,350,"8  The resolver caches it and answers the PC.",{s:11,f:"body",c:"fg"})+
  K.txt(20,378,"Next PC to ask within 3600 s: steps 2–7 are skipped —",{s:11,f:"body",c:"accent"})+
  K.txt(20,395,"the answer comes straight from the resolver's cache.",{s:11,f:"body",c:"accent"}),
  "A lookup from a cold cache. The PC talks only to its resolver; the resolver walks the tree with iterative queries. Real resolvers also cache the referrals, so after the first lookup they rarely need the root at all.")}
<h3>Worked example: three lookups, three amounts of work</h3>
${K.steps([
  ["08:00 — <code>portal.corp.example.com</code>, nothing cached","Root (its addresses are built in), then <code>com</code>, then <code>example.com</code>'s servers: <code>10.10.50.80</code>, TTL 3600. Six messages outside, two on the LAN."],
  ["08:05 — another PC, same name","Answered at once from the cache (3,300 s left): a <i>non-authoritative</i> answer — correct, but second-hand."],
  ["09:01 — the portal again","The TTL ran out at 09:00, so it asks afresh (it still remembers the referral to <code>example.com</code>'s servers, so it skips the root). Had the portal moved at 08:30, users got the <b>old</b> address until 09:00 — the price of caching, and the third ticket from the opening."],
])}
<h3>TTL: how long an answer may be remembered</h3>
<p>The ${K.g("TTL","Time To Live. In DNS: the number of seconds a record may be cached before it must be asked for again — set by the zone's owner, typically 300 (5 minutes) to 86,400 (1 day). (Not the same as the IP header's TTL hop count from Module 1.)")} is set by the zone's owner on each record. Long TTLs mean fewer queries; short TTLs mean changes spread quickly. &ldquo;No such name&rdquo; answers are cached too (${K.g("negative caching","Remembering a 'no such name' answer for a while, so the same wrong question isn't asked again and again (RFC 2308).")}), usually for a shorter time set in the zone's ${K.g("SOA","Start of Authority record: the zone’s primary server, administrator mailbox, serial number and timers.")} record (the records come next).</p>
<p>Caches exist at every step: resolver, PC, many browsers. A company DNS server usually doesn't walk the tree for internet names either: it is a ${K.g("forwarder","A DNS server that sends questions it can't answer from its own zones or cache to another resolver, instead of walking the tree itself, then caches the replies.")}. A Cisco router can be one for a branch, later in this lesson.</p>
${K.when([
  ["Company DNS servers","Any office with internal names (intranet, a Windows domain)","They hold internal zones and forward the rest","—"],
  ["A branch router as DNS server (<code>ip dns server</code>)","A small branch with a few local names and a slow WAN","Local names, a cache, one address for the DHCP pool","Large sites, or a Windows domain's PCs"],
  ["The ISP's or a public resolver","Guest Wi-Fi, home networks, a company server's forwarders","Nothing to run","Staff PCs — it has never heard of internal names"],
  ["<code>hosts</code> file / <code>ip host</code>","A lab, a test, a router's names for its neighbours","No server; checked first","Anything that changes: every copy is edited by hand"],
], "Who should answer a PC's DNS questions")}
${K.mistake(`Thinking the second address in <i>DNS Servers</i> is a back-up for <b>missing names</b>. Windows moves on only when the first server <b>doesn't answer at all</b>; &ldquo;no such name&rdquo; is an answer, and Windows believes it. So every server you hand out must know the same names — never one internal plus one public.`)}
${K.check({q:"A PC asks its company DNS server for www.example.org. The server has never looked it up and isn't authoritative for example.org. What does the PC's query ask for, and who walks the tree?", o:["An iterative query; the PC asks the root itself","A recursive query; the company server (or the resolver it forwards to) finds the answer for the PC","A zone transfer from the root","A broadcast to every DNS server on the LAN"], a:1, why:"Stubs send recursive queries ('give me the final answer'); the company server, or the resolver it forwards to, walks the tree iteratively and caches the result."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A resolver whose cache is EMPTY gets a laptop's query for shop.example.net. Put what happens in order.", items:["The laptop sends one recursive query to its configured DNS server","The resolver asks a root server and is referred to the net TLD servers","The resolver asks a net server and is referred to example.net's authoritative servers","An example.net server answers with the A record and its TTL","The resolver caches the answer and replies to the laptop","A second laptop asking within the TTL is answered from the cache"], why:"1. What is asked? The order of a cold-cache lookup. 2. Rule: the stub asks once; the resolver walks the tree top-down (root, TLD, zone), caches, then answers; the cache serves repeats until the TTL expires. 3. Apply it: laptop to resolver, root referral, net referral, authoritative answer, cache and reply, then cache hits. A different TLD (net instead of com) changes nothing in the method."})}

<h2>DNS records, and the suffix that completes a short name</h2>
${K.remember(`<b>The rule:</b> a zone is a list of <b>records</b>. Each record has a <b>name</b>, a <b>type</b>, a <b>TTL</b> and <b>data</b>, and the type says which question it answers. Ask for the wrong type and you get an empty answer (no records of that type), even when the name exists.`)}
<div class="tablewrap"><table>
<tr><th>Type</th><th>Answers the question</th><th>Example data</th><th>You meet it when…</th></tr>
<tr><td><b>A</b></td><td>Which IPv4 address has this name?</td><td><code>10.10.50.80</code></td><td>Almost every lookup (the lab has only these)</td></tr>
<tr><td><b>AAAA</b></td><td>Which IPv6 address? (Module 6)</td><td><code>2001:db8:a:50::80</code></td><td>Dual-stack hosts</td></tr>
<tr><td><b>${K.g("CNAME","Canonical name record: makes one name an alias of another.")}</b></td><td>Is this name an alias? Then look up that other name</td><td><code>portal.corp.example.com.</code></td><td><code>www</code> → a server's real name</td></tr>
<tr><td><b>${K.g("MX","Mail exchanger record: the servers that accept email for a domain, each with a preference number.")}</b></td><td>Which servers accept email for this domain, in what order?</td><td><code>10 mail.corp.example.com.</code></td><td>Email; lower number tried first</td></tr>
<tr><td><b>${K.g("PTR","Pointer record: maps an address back to a name (a reverse lookup).")}</b></td><td>Which name belongs to this address? (reverse lookup)</td><td><code>portal.corp.example.com.</code></td><td>Logs, traceroute names, nslookup's <i>Server:</i> line</td></tr>
<tr><td><b>NS</b> / <b>SOA</b></td><td>Which servers are authoritative? Who owns the zone, and its timers?</td><td><code>ns1.corp.example.com.</code></td><td>Delegation; zone timers</td></tr>
</table></div>
${K.out(`$TTL 3600
@         IN  SOA   ns1.corp.example.com. hostmaster.corp.example.com. ( 2026101201 3600 900 1209600 300 )
@         IN  NS    ns1.corp.example.com.
@         IN  MX    10 mail.corp.example.com.
ns1       IN  A     10.10.50.53
mail      IN  A     10.10.50.25
portal    IN  A     10.10.50.80
portal    IN  AAAA  2001:db8:a:50::80
intranet  IN  CNAME portal.corp.example.com.`, "Part of the zone corp.example.com in the classic zone-file format of "+K.g("BIND","The most widely used open-source DNS server software; its zone-file format is the standard way to write records.")+". @ = the zone's own name.")}
<ul>
<li><code>$TTL 3600</code> — the default cache time: one hour. <code>SOA</code> — primary server, admin mailbox, a serial bumped on every change, timers (the last, <code>300</code>, is the &ldquo;no such name&rdquo; cache time).</li>
<li><code>portal</code> has A and AAAA records; <code>intranet</code> is a CNAME resolvers follow to them. Names without a final dot get the zone's name added — a forgotten dot is a classic bug.</li>
</ul>
<p><b>Reverse lookups</b> live in a separate tree, <code>in-addr.arpa</code>, with the octets written backwards — the PTR for 10.10.50.80 is <code>80.50.10.10.in-addr.arpa</code> (IPv6: <code>ip6.arpa</code>), created separately. Without one, nslookup prints <code>Server: UnKnown</code> (it reverse-looks-up its DNS server first) — cosmetic, not a fault.</p>
<h3>The DNS suffix: completing a name without a dot</h3>
<p>A name with no dot is incomplete, so the PC <b>adds a suffix</b> before asking: on Windows the <i>Connection-specific DNS Suffix</i>, usually ${K.g("DHCP option 15","The DHCP option carrying the client's DNS suffix — the pool's domain-name line (lesson 1). Option 6 carries the DNS servers (dns-server).")} from the pool's <code>domain-name</code>, plus its search list. A router uses <code>ip domain name</code>.</p>
${K.out(`   DNS Suffix Search List. . . . . . : ikj.example.com

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : ikj.example.com
   ...
   DHCP Server . . . . . . . . . . . : 172.16.10.1
   ...
   DNS Servers . . . . . . . . . . . : 172.16.50.53`, "ipconfig /all on IKJ-PC07, an Ikeja PC leasing from IKJ-R1: both values came from the pool (options 15 and 6).")}
<p>So <code>ping hr</code> on this PC really asks for <code>hr.ikj.example.com</code>. A static PC often has <b>no</b> suffix (unless it has joined a Windows domain, which gives it a <i>Primary Dns Suffix</i>): the full name works, the short one fails — it looks like a missing record but isn't.</p>
${K.mistake(`Testing a new record by its short name from a PC with no suffix: <i>Non-existent domain</i>, because plain <code>files</code> exists nowhere. Test the FQDN first.`)}
${K.exam(`Record questions test <b>which question each type answers</b>: name → IPv4 is A, name → IPv6 is AAAA, alias is CNAME, mail is MX, address → name is PTR. Trap options pair a name with &ldquo;MAC address&rdquo; (that's ARP, not DNS) or say DNS hands out IP addresses (that's DHCP).`)}
${K.check({q:"Users can open intranet.corp.example.com. The zone shows 'intranet IN CNAME portal.corp.example.com.' and portal has an A record. What do users' PCs receive?", o:["Only the CNAME, so the browser fails","The CNAME and the A record of portal, so they connect to portal's address","An MX record","A PTR record for the intranet"], a:1, why:"A CNAME says 'this name is another name's alias'. The resolver follows it and returns the target's addresses with the alias, so users connect to portal's IP while the browser keeps showing intranet."})}
${K.q({type:"match", q:"Match each question a computer asks with the record type that answers it.", pairs:[["What is the IPv4 address of erp.example.com?","A"],["What is the IPv6 address of erp.example.com?","AAAA"],["Where should email for example.com be delivered?","MX"],["Which name belongs to 10.20.0.70?","PTR"],["www.example.com is another name for which host?","CNAME"],["Which servers are authoritative for example.com?","NS"]], why:"A = name to IPv4, AAAA = name to IPv6 (four times the size of an A, hence the name), MX = mail servers for a domain, PTR = reverse lookup from address to name, CNAME = alias, NS = the zone's authoritative servers."})}
<h3>Same logic, new situation</h3>
<p>On the Abuja office's guest Wi-Fi, a visitor's <code>ping files</code> can't find the host, but <code>ping files.abj.example.com</code> replies. Wired staff PCs use the short name fine. What's different?</p>
${K.hint(`What does a PC add to a name without a dot — and where does it get that from?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why the full name works and the short one doesn't. <b>2. Rule:</b> a name without a dot gets the client's DNS suffix, which DHCP hands out as option 15. <b>3. Apply it:</b> the FQDN works, so server and record are fine. The guest pool has no (or a different) <code>domain-name</code>, so the laptop asks for plain <code>files</code> — perhaps deliberately, since guests shouldn't depend on internal names.</p>`)}

<h2>Asking DNS from Windows: ipconfig, nslookup, ping by name, flushdns</h2>
${K.remember(`<b>The rule:</b> three questions, three tools. <b>Which server does the PC ask?</b> — <code>ipconfig /all</code>. <b>What does it say?</b> — <code>nslookup</code>, straight to the server, <b>skipping</b> the PC's cache and hosts file. <b>What does the application get?</b> — <code>ping</code>/<code>tracert</code> by name, through the PC's normal resolver.`)}
<h3>nslookup, line by line</h3>
<p>On IKJ-PC07 (the staff PC above), <code>nslookup hr</code>:</p>
${K.out(`C:\\Users\\funmi>nslookup hr
Server:  ns1.ikj.example.com
Address:  172.16.50.53

Name:    hr.ikj.example.com
Address:  172.16.50.40`, "An authoritative answer: NS1 holds the ikj.example.com zone itself, so there is no 'Non-authoritative answer' line.")}
<ul>
<li><b>Server / Address</b> — <i>who was asked</i> (the first <i>DNS Servers</i> entry) and its name from PTR.</li>
<li><b>Name</b> — what was really looked up: <code>hr</code> + suffix. <b>Address</b> — the answer (an IPv6 one too on dual stack: nslookup asks for A and AAAA).</li>
</ul>
<p><code>nslookup &lt;name&gt; &lt;server&gt;</code> asks a server you choose — the fastest test of &ldquo;the server, or the PC's setting?&rdquo;. nslookup's verdicts:</p>
${K.out(`C:\\Users\\funmi>nslookup payrol
Server:  ns1.ikj.example.com
Address:  172.16.50.53

*** ns1.ikj.example.com can't find payrol: Non-existent domain

C:\\Users\\funmi>nslookup hr 172.16.50.99
DNS request timed out.
    timeout was 2 seconds.
Server:  UnKnown
Address:  172.16.50.99

DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
*** Request to UnKnown timed-out`, "Top: the server answered — 'no such name' (a typo here). Bottom: nobody at 172.16.50.99 answered DNS at all.")}
<div class="tablewrap"><table>
<tr><th>nslookup says</th><th>What it proves</th><th>Look next at</th></tr>
<tr><td><code>Name:</code> / <code>Address:</code></td><td>The server knows the name; DNS works for this question</td><td>Is it the <i>right</i> address? Then reachability (ping the address)</td></tr>
<tr><td><code>Non-existent domain</code></td><td>The server is reachable and answered: that exact name doesn't exist</td><td>The spelling, the suffix (try the FQDN), the record in the zone</td></tr>
<tr><td><code>DNS request timed out</code></td><td>Nothing answered from that address at all</td><td>Is it the right server address? Ping it; is there a route both ways?</td></tr>
<tr><td><code>*** UnKnown can't find NAME: No response from server</code></td><td>Something at that address is alive, but it doesn't run DNS (it refuses UDP 53)</td><td>Is that really the DNS server? Is the service on there (on a router: <code>ip dns server</code>)?</td></tr>
</table></div>
<h3>Ping and tracert by name: the brackets are the proof</h3>
${K.out(`C:\\Users\\funmi>ping hr

Pinging hr.ikj.example.com [172.16.50.40] with 32 bytes of data:
Reply from 172.16.50.40: bytes=32 time<1ms TTL=127

C:\\Users\\funmi>ping nothere
Ping request could not find host nothere. Please check the name and try again.

C:\\Users\\funmi>tracert nothere
Unable to resolve target system name nothere.`, "Shortened. Brackets = resolution worked; what follows is reachability. 'Could not find host' / 'Unable to resolve' = nothing was sent.")}
<h3>The PC's own memory: cache and hosts file</h3>
<p>The Windows stub resolver checks, in order: its <b>cache</b> (answers it received earlier, kept for their TTL), which also holds the entries of the <b>hosts file</b> <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code>, and only then the DNS servers (if DNS has no answer for a short name, Windows may still try local-network fallbacks such as ${K.g("LLMNR","Link-Local Multicast Name Resolution: Windows asking the local subnet 'who has this name?' by multicast when DNS can't answer. Not a CCNA topic.")} and NetBIOS). <code>ipconfig /displaydns</code> lists the cache; <code>ipconfig /flushdns</code> empties it (hosts-file entries are reloaded). The lab has both: <code>/displaydns</code> lists the answers a PC has received, and <code>/flushdns</code> prints <i>Successfully flushed the DNS Resolver Cache.</i> and empties the list (<code>/displaydns</code> then says <i>Could not display the DNS Resolver Cache.</i>). Lab PCs still ask their server every time, though, so a stale cached answer can't happen here; the on-the-job scenario later shows the effect.</p>
${K.when([
  ["Windows","<code>ipconfig /all</code> (DNS Servers, suffix) · <code>nslookup</code> · <code>Resolve-DnsName</code> in PowerShell · <code>ipconfig /flushdns</code>","Resolve-DnsName uses the application path; nslookup bypasses it","—"],
  ["macOS","<code>scutil --dns</code> (servers and search domains) · <code>dig</code> or <code>nslookup</code>","Servers can differ per interface and VPN","Trusting <code>/etc/resolv.conf</code> alone"],
  ["Linux","<code>resolvectl status</code> (systemd-resolved) or <code>cat /etc/resolv.conf</code> · <code>dig</code> · <code>getent hosts NAME</code>","dig shows TTL and flags (aa = authoritative)","Reading <code>127.0.0.53</code> as the server — it's the local stub"],
], "The same three questions on each client OS (CCNA 1.10)")}
${K.mistake(`&ldquo;nslookup works, so DNS is fine&rdquo; — while the user's browser still fails. nslookup skips the PC's cache and hosts file. A stale cached answer, or an old line in the hosts file, makes applications use a different address from the one nslookup shows. Compare <code>ping NAME</code> (what the PC really uses) with <code>nslookup NAME</code> (what the server says).`)}
${K.check({q:"ping crm returns 'Pinging crm.lagos.example.com [10.7.0.90] ...' and then 'Request timed out.' four times. What do you know?", o:["DNS failed","DNS worked — the name became 10.7.0.90 — so investigate reaching 10.7.0.90 (or whether that is the right address)","The suffix is missing","The DNS server is down"], a:1, why:"The bracketed address proves the name was resolved. The failure is after resolution: reachability of 10.7.0.90, or a wrong address in DNS. A missing suffix or a dead DNS server would have given 'could not find host'."})}
${K.q({type:"fill", q:"Type the Windows command for each job.", fields:[
  {label:"Show which DNS servers and suffix the PC uses", a:["ipconfig /all","ipconfig/all","ipconfig -all"]},
  {label:"Ask the server 10.9.0.53 directly for files.example.com", a:["nslookup files.example.com 10.9.0.53","nslookup files.example.com. 10.9.0.53"]},
  {label:"Empty the PC's DNS cache", a:["ipconfig /flushdns","ipconfig/flushdns","ipconfig -flushdns"]}],
  why:"ipconfig /all lists DNS Servers and the Connection-specific DNS Suffix. nslookup NAME SERVER sends the question to that server instead of the default one, which separates 'the server is wrong' from 'the PC asks the wrong server'. ipconfig /flushdns empties the resolver cache so the next lookup asks the server again."})}
<h3>Same logic, new situation</h3>
<p>A Kaduna accountant: <code>nslookup erp</code> shows <code>Address: 10.3.0.70</code>, the new server. <code>ping erp</code> shows <code>Pinging erp.kad.example.com [10.3.0.17]</code> — the old one, switched off last night. Nobody has changed this PC since. What is going on, and what do you do?</p>
${K.hint(`Which of the two commands uses the PC's own memory of past answers?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why two tools give two addresses. <b>2. Rule:</b> nslookup asks the server; ping uses the PC's cache and hosts file first. <b>3. Apply it:</b> the server has the new record; the PC cached the old answer (TTL not yet expired) or has an old hosts-file line. <code>ipconfig /flushdns</code> and ping again; still 10.3.0.17 → check the hosts file.</p>`)}

<h2>IOS and DNS: the router as a client — and as a server</h2>
${K.remember(`<b>The rule:</b> a router resolves a name for itself in a fixed order: its own <b>host table</b> (<code>ip host</code>) first; then, only if <b>domain lookup</b> is on, the servers in <code>ip name-server</code>, after adding <code>ip domain name</code> to any name without a dot. With <code>ip dns server</code> it also answers other devices: from its host table, or (lookup on) by asking its own name servers and caching the reply.`)}
<h3>The router as a DNS client</h3>
<p>Module 2 met the default: lookup is <b>on</b>, and with no name server IOS asks the broadcast address 255.255.255.255 — the &ldquo;Translating…&rdquo; freeze after a typo such as <code>shwo</code>. <code>no ip domain lookup</code> (older spelling <code>no ip domain-lookup</code>) cured it, and stopped all DNS lookups. The full set:</p>
<div class="tablewrap"><table>
<tr><th>Command (global config)</th><th>What it does</th></tr>
<tr><td><code>ip host core-sw 172.16.10.2</code></td><td>A static host-table entry, checked first (up to eight addresses)</td></tr>
<tr><td><code>ip domain name ikj.example.com</code></td><td>The default domain for names without a dot (Module 2's <code>ip domain-name</code>, printed with a space)</td></tr>
<tr><td><code>ip name-server 172.16.50.53</code></td><td>The DNS servers to ask, in order (up to six)</td></tr>
<tr><td><code>ip domain lookup</code> / <code>no ip domain lookup</code></td><td>Allow or forbid lookups (the older spelling <code>ip domain-lookup</code> works too)</td></tr>
</table></div>
<p>On IKJ-R1, the Ikeja router, with <code>ip domain name ikj.example.com</code>, <code>ip name-server 172.16.50.53</code> and <code>ip host core-sw 172.16.10.2</code>:</p>
${K.out(`IKJ-R1#ping hr
Translating "hr"...domain server (172.16.50.53) [OK]

Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 172.16.50.40, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/3 ms
IKJ-R1#ping payroll
Translating "payroll"...domain server (172.16.50.53) [OK]

Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 172.16.50.44, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)
IKJ-R1#ping nothere
Translating "nothere"...domain server (172.16.50.53)
% Unrecognized host or address, or protocol not running.`, "[OK] = an address came back. payroll resolved but doesn't answer: reachability (or a stale record), not DNS. nothere: no address.")}
${K.out(`IKJ-R1#show hosts
Name lookup view: Global
Default domain is ikj.example.com
Name/address lookup uses domain service
Name servers are 172.16.50.53

Codes: UN - unknown, EX - expired, OK - OK, ?? - revalidate
       temp - temporary, perm - permanent
       NA - Not Applicable None - Not defined

Host                      Port  Flags      Age Type   Address(es)
core-sw                   None  (perm, OK)  0   IP     172.16.10.2
hr.ikj.example.com        None  (temp, OK)  0   IP     172.16.50.40
payroll.ikj.example.com   None  (temp, OK)  0   IP     172.16.50.44`, "show hosts: the router's whole name picture.")}
<ul>
<li>The top lines are the three global settings: with lookup off it reads <i>static mappings</i>; with no name server, <i>255.255.255.255</i>.</li>
<li><b>perm</b> = typed with <code>ip host</code>. <b>temp</b> = learned from DNS and cached until its TTL runs out (real IOS: <code>clear host *</code> clears the cached names so they are looked up afresh; the lab doesn't have it). Pinging <code>core-sw</code> prints no <i>Translating</i> line: the host table answered.</li>
</ul>
${K.tip(`Want lookups on <i>and</i> no typo freeze? Keep <code>ip domain lookup</code> and add <code>transport preferred none</code> under <code>line con 0</code> and <code>line vty 0 15</code>: IOS stops treating an unknown word as a hostname to connect to.`)}
<h3>Try it: a comms-room router's host table</h3>
<p>COMMS-R1 manages a floor of switches and access points on 10.30.1.0/24. Give two of them short names, then prepare the router for DNS. This router has no name server it can reach, so names must come from its host table.</p>
${K.term({env:"ios2", title:"COMMS-R1 — host table, domain lookup on and off", opts:{kind:"router", host:"COMMS-R1", model:"ISR 1100", motd:"COMMS-R1 — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","interface g0/0","description MGMT LAN","ip address 10.30.1.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); if (e.baseline) e.baseline(); e.history.length=0; if (e.log) e.log.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. Predict each output before you press Enter.",
  tasks:[
    {text:"<code>enable</code>, then mistype <code>shwo</code> on purpose. Why does IOS say <i>Translating &quot;shwo&quot;…domain server (255.255.255.255)</i>?", done:e=>(e.log||[]).some(l=>/Translating "[^"]+"\.\.\.domain server \(255\.255\.255\.255\)/.test(l.out||""))},
    {text:"<code>configure terminal</code>, <code>no ip domain lookup</code>, <code>end</code>, and mistype <code>shwo</code> again: an instant error now", done:e=>(e.log||[]).some(l=>/^\s*no\s+ip\s+domain[- ]lookup\s*$/i.test(l.cmd||"")) && (e.log||[]).some(l=>/^% Unknown command or computer name/.test(l.out||""))},
    {text:"In config mode, name two devices: <code>ip host core-sw 10.30.1.2</code> and <code>ip host ap-floor2 10.30.1.21</code>", done:e=>e.iosHosts["core-sw"]==="10.30.1.2" && e.iosHosts["ap-floor2"]==="10.30.1.21"},
    {text:"<code>end</code>, <code>show hosts</code>, then <code>ping core-sw</code>. There's no <i>Translating</i> line — where did the address come from, with lookup switched off?", done:e=>(e.log||[]).some(l=>/^\s*sh\S*\s+hosts/i.test(l.cmd||"")) && (e.log||[]).some(l=>/ping\s+core-sw/i.test(l.cmd||"") && /!!!!!/.test(l.out||""))},
    {text:"Prepare for the head-office DNS servers: in config mode <code>ip domain-lookup</code> (lookups back on), <code>ip domain name corp.example.com</code> and <code>ip name-server 10.10.50.53 10.10.60.53</code>", done:e=>e.domainLookup && e.domain==="corp.example.com" && e.nameServers.includes("10.10.50.53") && e.nameServers.includes("10.10.60.53")},
    {text:"<code>end</code>, <code>show hosts</code> again — which of the first four lines changed? — then <code>show running-config | include ip host|ip name|ip domain</code>", done:e=>(e.log||[]).some(l=>/^\s*sh\S*\s+hosts/i.test(l.cmd||"") && /uses domain service/.test(l.out||"") && /Name servers are 10\.10\.50\.53, 10\.10\.60\.53/.test(l.out||"")) && (e.log||[]).some(l=>/^\s*sh\S*\s+run\S*\s*\|\s*i/i.test(l.cmd||"") && /ip name-server 10\.10\.50\.53 10\.10\.60\.53/.test(l.out||""))},
  ],
  win:"You saw the typo trap come from DNS lookup and go with it, built a host table that answers with lookup off (no Translating line), and set the three settings a router needs to ask real DNS servers: lookup on, a default domain and name servers — all visible in show hosts.",
  solve:["enable","shwo","configure terminal","no ip domain lookup","end","shwo","configure terminal","ip host core-sw 10.30.1.2","ip host ap-floor2 10.30.1.21","end","show hosts","ping core-sw","configure terminal","ip domain-lookup","ip domain name corp.example.com","ip name-server 10.10.50.53 10.10.60.53","end","show hosts","show running-config | include ip host|ip name|ip domain"]})}
${K.hint(`Task 4: the host table is checked before DNS and needs no lookup at all. Task 6: compare &ldquo;Name/address lookup uses …&rdquo; and &ldquo;Name servers are …&rdquo; before and after.`)}
<h3>The router as a DNS server for a branch</h3>
<p><code>ip dns server</code> makes the router a small DNS server: host table first, otherwise (with domain lookup on) it asks its <code>ip name-server</code>s, passes the answer back and caches it. At a branch that buys one DNS address for the DHCP pool, local names for local kit without a head-office record, and a cache so a hundred PCs don't send a hundred questions across the WAN.</p>
${K.svg("0 0 760 260",
  K.dev("pc",80,110,"LKK-PC02","DNS server = 172.16.20.1")+K.dev("router",380,110,"LKK-R1","ip dns server · host table · cache")+K.dev("server",680,110,"NS1","172.16.50.53 · Ikeja")+
  K.arrow(104,98,350,98,"1 · hr.ikj.example.com?",true)+K.arrow(350,122,104,122,"4 · 172.16.50.40 (non-authoritative)")+
  K.arrow(408,98,654,98,"2 · not in my table: ask NS1",true)+K.arrow(654,122,408,122,"3 · 172.16.50.40 (authoritative)")+
  K.txt(380,196,"A name in the router's host table (ip host lkk-prn.ikj.example.com 172.16.20.30)",{mid:true,s:11,f:"body",c:"fg"})+
  K.txt(380,214,"is answered at step 1 — no WAN trip. Cached answers are reused for every PC until they expire.",{mid:true,s:11,f:"body"})+
  K.txt(380,240,"The router must reach its name server both ways — DNS is UDP 53, so it needs routing like any packet.",{mid:true,s:11,f:"body",c:"muted"}),
  "Lekki branch: LKK-R1 answers its PCs and forwards what it doesn't know to the Ikeja DNS server across the WAN.")}
<p>From a Lekki PC, after <code>ip name-server 172.16.50.53</code>, <code>ip dns server</code> and <code>ip host lkk-prn.ikj.example.com 172.16.20.30</code> on LKK-R1:</p>
${K.out(`C:\\Users\\tobi>nslookup hr
Server:  UnKnown
Address:  172.16.20.1

Non-authoritative answer:
Name:    hr.ikj.example.com
Address:  172.16.50.40

C:\\Users\\tobi>nslookup lkk-prn
Server:  UnKnown
Address:  172.16.20.1

Non-authoritative answer:
Name:    lkk-prn.ikj.example.com
Address:  172.16.20.30`, "The first answer was passed on from NS1; the printer came from the router's host table. Both are non-authoritative: Cisco's DNS guide says that unless the router is set up as authoritative for a zone (an advanced feature, not CCNA), even its locally defined hosts get non-authoritative answers.")}
<p>Keep domain lookup <b>on</b> for a router that resolves names for others. Cisco's DNS configuration guide says the router decides whether to forward a question it can't answer itself to its name servers <b>based on <code>ip domain lookup</code></b> — with <code>no ip domain lookup</code>, it answers only from its host table (the lab behaves the same way).</p>
${K.mistake(`Enabling <code>ip dns server</code> on an internet-facing router: it answers on <b>every</b> interface, and an ${K.g("open resolver","A DNS server that answers recursive questions from anyone on the internet — abused to amplify attacks against third parties.")} on a public address gets found and abused. Use it towards internal LANs; at the edge, filter it with an access list (Module 8) or don't use it.`)}
${K.check({q:"A branch router has ip dns server and ip name-server 10.10.50.53. Branch PCs resolve every name, but on the router itself 'ping portal' gives 'Translating \"portal\"...domain server (10.10.50.53)' and '% Unrecognized host or address'. The PCs' suffix is corp.example.com. What is missing on the router?", o:["ip dns server","ip domain name corp.example.com — the router asked for plain 'portal'","A route to the DNS server","ip host portal"], a:1, why:"The server was reached (it's named in the Translating line, and the PCs' queries work through the router), but 'portal' alone doesn't exist. PCs add their suffix; the router adds only its own default domain, set with ip domain name."})}
<h3>Hands-on: Kano branch — make the router answer DNS</h3>
<p>A distributor's Kano branch got a new router last week, built from the standard branch template. Its pool tells PCs to use the router (192.168.20.1) for DNS, as designed — but nothing opens by name. Head office runs NS1 (10.10.50.53) for <code>corp.example.com</code>; the printer, 192.168.20.30, has no record there.</p>
${K.hint(`Who is KANO-PC1 really asking, and is anything listening there? On the router, read which name-service lines exist before adding any. The template is the same one Module 2 taught you to build.`)}
${K.bench({id:"m7-dns-branch", points:100, from:"CCNA · Module 7 · lesson 3", title:"Kano branch: a router that answers DNS, forwards to head office and names the printer", viewBox:"0 0 900 430",
  intro:"Console cable on KN-R1: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control); no enable secret. Use KANO-PC1's <b>Command Prompt</b>. Open NS1's <b>Server services</b> panel to see the head-office records. Lab notes: A records only; DNS questions aren't drawn in the frame log.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:760, y:30},
    {id:"hq", kind:"router", label:"HQ-R1", model:"ISR 4331 · head office", x:150, y:40, config:e=>{ ["en","conf t","hostname HQ-R1","no ip domain-lookup","interface g0/0","description HQ SERVERS","ip address 10.10.50.1 255.255.255.0","no shutdown","interface g0/1","description WAN TO KANO","ip address 10.0.0.1 255.255.255.252","no shutdown","exit","ip route 192.168.20.0 255.255.255.0 10.0.0.2","end"].forEach(c=>e.exec(c)); e.history.length=0; if (e.log) e.log.length=0; }},
    {id:"kn", kind:"router", label:"KN-R1", model:"ISR 1100 · Kano branch", x:560, y:40, config:e=>{ ["en","conf t","hostname KN-R1","no ip domain-lookup","interface g0/0","description KANO LAN","ip address 192.168.20.1 255.255.255.0","no shutdown","interface g0/1","description WAN TO HQ","ip address 10.0.0.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.0.0.1",
      "ip dhcp excluded-address 192.168.20.1 192.168.20.49","ip dhcp pool KANO","network 192.168.20.0 255.255.255.0","default-router 192.168.20.1","dns-server 192.168.20.1","domain-name corp.example.com","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; if (e.log) e.log.length=0; }},
    {id:"hqsw", kind:"switch", label:"HQ-SW", x:150, y:200, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"knsw", kind:"switch", label:"KN-SW", x:560, y:200, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"ns", kind:"server", label:"NS1", x:60, y:330, ip:"10.10.50.53", mask:"255.255.255.0", gw:"10.10.50.1", services:{dns:{name:"ns1.corp.example.com", records:{"ns1.corp.example.com":"10.10.50.53","portal.corp.example.com":"10.10.50.80","hr.corp.example.com":"10.10.50.81"}}}},
    {id:"web", kind:"server", label:"PORTAL", x:240, y:330, ip:"10.10.50.80", mask:"255.255.255.0", gw:"10.10.50.1"},
    {id:"p1", kind:"pc", label:"KANO-PC1", x:470, y:330, dhcp:true},
    {id:"prn", kind:"printer", label:"KANO-PRN", x:660, y:330, ip:"192.168.20.30", mask:"255.255.255.0", gw:"192.168.20.1"},
  ],
  cables:[ {type:"cat6", a:"hq:g0", b:"hqsw:g1"}, {type:"cat6", a:"ns:eth", b:"hqsw:g2"}, {type:"cat6", a:"web:eth", b:"hqsw:g3"}, {type:"cat6", a:"hq:g1", b:"kn:g1"},
    {type:"cat6", a:"kn:g0", b:"knsw:g1"}, {type:"cat6", a:"p1:eth", b:"knsw:g2"}, {type:"cat6", a:"prn:eth", b:"knsw:g3"}, {type:"console", a:"lap:usb", b:"kn:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On KANO-PC1: <code>ipconfig /all</code> (which DNS server did the pool hand out?), <code>ping 10.10.50.80</code> (the portal by address) and <code>nslookup portal</code>. Routing works — so what does <i>No response from server</i> from 192.168.20.1 tell you?", done:B=>Bench.tried(B,"p1",/^\s*ipconfig\s+\/all/i) && Bench.pinged(B,"p1","10.10.50.80") && Bench.tried(B,"p1",/^\s*nslookup\s+portal/i)},
    {text:"Console into KN-R1, <code>enable</code>, and list its name-service lines: <code>show running-config | include ip dns|ip name|ip host|domain</code>. Which ones exist?", done:B=>B.devs.kn.env.history.some(h=>/^\s*sh\S*\s+run\S*\s*\|\s*i\S*\s+.*(dns|name|domain)/i.test(h))},
    {text:"Make KN-R1 a forwarding DNS server: in config mode turn lookups back on with <code>ip domain-lookup</code>, point it at head office with <code>ip name-server 10.10.50.53</code>, then <code>ip dns server</code>. Done when KANO-PC1's <code>nslookup portal</code> gets an answer from 192.168.20.1", done:B=>{ const e = B.devs.kn.env; return e.domainLookup && e.nameServers.includes("10.10.50.53") && e.dnsServer && Bench.resolved(B,"p1","portal"); }},
    {text:"The printer has no record at head office. Name it on the router: <code>ip host kano-prn.corp.example.com 192.168.20.30</code>. Done when KANO-PC1 can <code>ping kano-prn</code>", done:B=>B.devs.kn.env.iosHosts["kano-prn.corp.example.com"]==="192.168.20.30" && Bench.pinged(B,"p1","192.168.20.30") && Bench.tried(B,"p1",/^\s*ping\s+kano-prn\s*$/i)},
    {text:"Now the router's own lookups: <code>ping portal</code> on KN-R1. Which name did it really ask for? Fix it with <code>ip domain name corp.example.com</code>, <code>ping portal</code> again, and read <code>show hosts</code> — which entries are perm, which temp?", done:B=>{ const e = B.devs.kn.env; return e.domain==="corp.example.com" && (e.log||[]).some(l=>/Translating "portal"\.\.\.domain server \(10\.10\.50\.53\) \[OK\]/.test(l.out||"")) && e.history.some(h=>/^\s*sh\S*\s+hosts/i.test(h)); }},
    {text:"Save KN-R1: <code>copy running-config startup-config</code>", done:B=>!!B.devs.kn.env.savedOnce},
  ],
  win:"The pool already pointed PCs at the router, but nothing on the router answered DNS — so every lookup got 'No response from server' while routing was perfect. You made KN-R1 a forwarder (lookups on, a name server, ip dns server), gave the printer a local name, and found the router's own blind spot: it adds only its own default domain, so 'portal' meant nothing to it until ip domain name.",
  solve:[["pc","p1","ipconfig /all"],["pc","p1","ping 10.10.50.80"],["pc","p1","nslookup portal"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show running-config | include ip dns|ip name|ip host|domain"],
    ["term","configure terminal"],["term","ip domain-lookup"],["term","ip name-server 10.10.50.53"],["term","ip dns server"],["term","end"],["pc","p1","nslookup portal"],
    ["term","configure terminal"],["term","ip host kano-prn.corp.example.com 192.168.20.30"],["term","end"],["pc","p1","ping kano-prn"],
    ["term","ping portal"],["term","configure terminal"],["term","ip domain name corp.example.com"],["term","end"],["term","ping portal"],["term","show hosts"],
    ["term","copy running-config startup-config"],["term",""]]})}
<h3>Same logic, new situation</h3>
<p>After the bench, a head-office engineer on HQ-R1 (now set up with domain lookup on, <code>ip name-server 10.10.50.53</code> and <code>ip domain name corp.example.com</code>) types <code>ping kano-prn</code> and gets <i>% Unrecognized host or address</i>. KANO-PC1 pings it fine. Why?</p>
${K.hint(`Where does the name kano-prn exist — and whom does HQ-R1 ask?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why a name works at the branch only. <b>2. Rule:</b> a router's host table is its own; others see it only by using that router as their DNS server. <b>3. Apply it:</b> <code>kano-prn</code> exists only on KN-R1. HQ-R1 asks NS1, which has no such record. Add the record to NS1 if head office needs the name.</p>`)}

<h2>DNS fault or routing fault? Decide in three commands</h2>
${K.remember(`<b>The rule:</b> resolution happens <b>before</b> the first packet to the destination is sent. So ask two questions in order. <b>1. Did the name become the right address?</b> If not, it's DNS: wrong or unreachable server, no DNS service, missing record or suffix, an old cached answer. <b>2. Can I reach that address?</b> If not, it's reachability — Module 5's method — and DNS is innocent.`)}
${K.svg("0 0 760 360",
  K.box(230,8,300,44,"A name doesn't work","first: ipconfig /all — which DNS server?",true)+
  K.box(230,82,300,46,"Did the name turn into an address?","ping shows [x.x.x.x] · nslookup Name/Address")+
  K.arrow(380,52,380,80)+
  K.box(20,170,350,46,"NO → a DNS problem","run nslookup NAME, then nslookup NAME SERVER")+
  K.box(390,170,350,46,"YES → is it the right address?","compare with the design or the server team")+
  K.arrow(300,128,200,168,"no")+K.arrow(460,128,560,168,"yes")+
  K.box(20,246,170,52,"DNS request timed out","no answer from the server")+K.box(200,246,170,52,"Non-existent domain","no record, or no suffix")+
  K.box(390,246,170,52,"Wrong address","old record or cached copy")+K.box(570,246,170,52,"Right address","routing: ping IP, tracert",true)+
  K.arrow(105,216,105,244)+K.arrow(285,216,285,244)+K.arrow(475,216,475,244)+K.arrow(655,216,655,244)+
  K.txt(380,330,"Once the name has become the right address, DNS's work is done: the rest is Module 5 routing.",{c:"fg",s:11.5,mid:true,f:"body"}),
  "The decision in pictures. Every branch ends at a short list of causes and the command that proves one.")}
<p>One subtlety: a DNS <i>timeout</i> can itself be a routing fault — the route <b>to the DNS server</b>. If the server's address doesn't answer a ping either, follow Module 5's method towards it; if it pings but nslookup says <i>No response from server</i>, the service isn't running there (a router without <code>ip dns server</code>, say).</p>
${K.exam(`Reading a DNS-or-not question: <b>1. Find the resolution step.</b> A bracketed address in a Windows ping, <code>[OK]</code> in IOS's <i>Translating</i> line, or <code>Name:</code>/<code>Address:</code> in nslookup = DNS worked; the answer is about reachability. <b>2. Read who was asked</b> (<i>Server/Address</i>, <i>DNS Servers</i>). <b>3. Read the failure:</b> a timeout means nobody answered; <i>Non-existent domain</i> is an answer. Trap options blame DNS for a ping that already shows the address.`)}
${K.job("“Payroll works for half of us since the migration”",`
<p><b>The ticket.</b> &ldquo;Since the payroll server moved on Saturday, about half of accounts get a page that never loads. The others are fine. Same office, same floor.&rdquo; — Ikeja office, Monday 08:50.</p>
<p><b>Questions first.</b> &ldquo;What moved?&rdquo; — payroll is a new virtual machine, <code>172.16.50.144</code>; the old one (<code>172.16.50.44</code>) went off on Sunday. &ldquo;The DNS record?&rdquo; — changed only on Sunday at 18:00, after testing finished. &ldquo;Who is affected?&rdquo; — desktops left on over the weekend; payroll's desktop client checks in with the server every few hours. &ldquo;Who is fine?&rdquo; — mostly people whose laptops were off all weekend.</p>
<p><b>Checks, on an affected PC.</b> Ask the server, then what the PC uses:</p>
${K.out(`C:\\Users\\kemi>nslookup payroll
Server:  ns1.ikj.example.com
Address:  172.16.50.53

Name:    payroll.ikj.example.com
Address:  172.16.50.144

C:\\Users\\kemi>ping payroll

Pinging payroll.ikj.example.com [172.16.50.44] with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.`, "The server has the new address; the PC is still using the old one.")}
<p>The two tools disagree, so the PC isn't asking the server — it's answering from memory. <code>ipconfig /displaydns</code> shows why:</p>
${K.out(`    payroll.ikj.example.com
    ----------------------------------------
    Record Name . . . . . : payroll.ikj.example.com
    Record Type . . . . . : 1
    Time To Live  . . . . : 22187
    Data Length . . . . . : 4
    Section . . . . . . . : Answer
    A (Host) Record . . . : 172.16.50.44`, "One entry from the list (shortened). Record Type 1 = A. About 6 hours left of a one-day (86,400 s) TTL: cached on Sunday at about 15:00, three hours before the record changed.")}
<p><b>Cause and fix.</b> The one-day TTL let every PC that looked payroll up in the 24 hours before the change keep the old address for up to a day afterwards; laptops that were off asked afresh. The hosts file was clean. On each affected PC: <code>ipconfig /flushdns</code>, then <code>ping payroll</code> — now <code>[172.16.50.144]</code>, replies, page loads. Left alone, it would have cleared as the TTLs ran out.</p>
<p><b>What you say.</b> &ldquo;Your PC remembered payroll's old address from before the move. I've cleared that memory; it now goes to the new server. If anyone else sees it, restart the PC or call us.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Payroll migrated to 172.16.50.144; A record changed Sun 18:00 with TTL 86400, so clients that looked it up on Sunday cached the old 172.16.50.44 (powered off Sun). nslookup correct, ping/browser used cache (ipconfig /displaydns). Flushed DNS cache on 9 PCs; verified ping and page. Change-process note: lower the record's TTL to 300 at least one TTL period before any server move, raise it again afterwards. 40 min.&rdquo;</i></p>`)}
${K.check({q:"Which pair of results proves a DNS server address handed out by DHCP is wrong, rather than the record being missing?", o:["nslookup NAME times out, but nslookup NAME CORRECT-SERVER answers","ping by IP fails, and ping by name fails","nslookup NAME says Non-existent domain, and so does nslookup NAME CORRECT-SERVER","tracert by name shows the address in brackets, then stops"], a:0, why:"A timeout from the PC's own server plus a good answer from the correct server proves the record and the real server are fine and the PC is asking the wrong address. Non-existent domain would mean a server did answer; brackets would mean resolution worked."})}
<h3>Hands-on: &ldquo;the intranet works by IP but not by name&rdquo;</h3>
<p>Port Harcourt, Harbour Logistics. The ticket: <i>&ldquo;Since PH-R1 was reconfigured on Friday, the intranet won't open by name. Reception says only the long name works. Also on today's list: the payroll page and the backup portal.&rdquo;</i> Build sheet: staff LAN 10.40.10.0/24 leases from PH-R1's pool STAFF; DNS1 is <b>10.40.50.53</b> (zone <code>ph.example.com</code>), INTRANET 10.40.50.80; the backup site 10.40.70.0/24 isn't linked yet.</p>
${K.hint(`Prove each step before you change anything: is it name or route? Which server does PC1 ask? Does the build-sheet server know the name? Then fix the setting where PC1 gets it from — and remember a PC keeps its lease (and its DNS setting) until it renews.`)}
${K.bench({id:"m7-dns-byname", points:110, from:"CCNA · Module 7 · lesson 3", title:"Port Harcourt: works by IP, not by name — find out why, fix it at the source", viewBox:"0 0 900 430", openLog:true,
  intro:"Use each PC's <b>Command Prompt</b>. Console cable on PH-R1: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control); no enable secret. DNS1's <b>Server services</b> panel shows its records. Lab notes: A records only; DNS questions aren't drawn in the frame log; lab PCs list their answers in <code>ipconfig /displaydns</code> but never answer from that cache.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"r1", kind:"router", label:"PH-R1", model:"ISR 1100 · Port Harcourt", x:400, y:40, config:e=>{ ["en","conf t","hostname PH-R1","no ip domain-lookup","interface g0/0","description STAFF LAN","ip address 10.40.10.1 255.255.255.0","no shutdown","interface g0/1","description SERVER LAN","ip address 10.40.50.1 255.255.255.0","no shutdown","exit",
      "ip dhcp excluded-address 10.40.10.1 10.40.10.20","ip dhcp pool STAFF","network 10.40.10.0 255.255.255.0","default-router 10.40.10.1","dns-server 10.40.50.35","domain-name ph.example.com","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; if (e.log) e.log.length=0; }},
    {id:"sw", kind:"switch", label:"STAFF-SW", x:200, y:200, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"sw2", kind:"switch", label:"SRV-SW", x:620, y:200, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"p1", kind:"pc", label:"PC1", x:80, y:330, dhcp:true},
    {id:"p2", kind:"pc", label:"RECEPTION", x:300, y:330, ip:"10.40.10.15", mask:"255.255.255.0", gw:"10.40.10.1", dns:"10.40.50.53"},
    {id:"dns", kind:"server", label:"DNS1", x:560, y:330, ip:"10.40.50.53", mask:"255.255.255.0", gw:"10.40.50.1", services:{dns:{name:"dns1.ph.example.com", records:{"dns1.ph.example.com":"10.40.50.53","intranet.ph.example.com":"10.40.50.80","backup.ph.example.com":"10.40.70.10"}}}},
    {id:"web", kind:"server", label:"INTRANET", x:760, y:330, ip:"10.40.50.80", mask:"255.255.255.0", gw:"10.40.50.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"p1:eth", b:"sw:g2"}, {type:"cat6", a:"p2:eth", b:"sw:g3"},
    {type:"cat6", a:"r1:g1", b:"sw2:g1"}, {type:"cat6", a:"dns:eth", b:"sw2:g2"}, {type:"cat6", a:"web:eth", b:"sw2:g3"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket on PC1: <code>ping 10.40.50.80</code> (the intranet by address), then <code>ping intranet</code>. One works and one doesn't — is this a name problem or a route problem?", done:B=>Bench.pinged(B,"p1","10.40.50.80") && Bench.tried(B,"p1",/^\s*ping\s+intranet\s*$/i)},
    {text:"<code>ipconfig /all</code> on PC1: which DNS server does it ask? Compare it with the build sheet", done:B=>Bench.tried(B,"p1",/^\s*ipconfig\s+\/all/i)},
    {text:"Ask DNS directly: <code>nslookup intranet</code> (PC1's own server), then <code>nslookup intranet 10.40.50.53</code> (the build-sheet server). What does each answer say about the record, the server and PC1's setting?", done:B=>Bench.tried(B,"p1",/^\s*nslookup\s+intranet\s*$/i) && Bench.tried(B,"p1",/^\s*nslookup\s+intranet(\.ph\.example\.com\.?)?\s+10\.40\.50\.53\s*$/i)},
    {text:"Fix it where PC1's setting comes from: console into PH-R1, <code>enable</code>, read <code>show running-config | section dhcp</code>, and correct the STAFF pool's DNS server (<code>ip dhcp pool STAFF</code>, then <code>dns-server 10.40.50.53</code> — it replaces the old address)", done:B=>{ const p = B.devs.r1.env.dhcp.pools.STAFF; return !!p && p.dns.length===1 && p.dns[0]==="10.40.50.53"; }},
    {text:"Back on PC1, <code>ipconfig /renew</code> (lesson 1: ask the DHCP server again) — done when PC1's DNS server is 10.40.50.53 and <code>ping intranet</code> replies by name", done:B=>(B.devs.p1.dns||[])[0]==="10.40.50.53" && Bench.tried(B,"p1",/^\s*ipconfig\s+\/renew/i) && Bench.resolved(B,"p1","intranet")},
    {text:"RECEPTION: <code>ping intranet</code> fails but <code>ping intranet.ph.example.com</code> works — its DNS server is right, so what's missing? Open its IP settings and choose <b>Obtain an IP address automatically</b> so the pool gives it everything. Done when <code>ping intranet</code> works there", done:B=>B.devs.p2.dhcp && !!Bench.leased(B,"p2") && Bench.tried(B,"p2",/^\s*ping\s+intranet\.ph\.example\.com\s*$/i) && Bench.tried(B,"p2",/^\s*ping\s+intranet\s*$/i) && Bench.resolved(B,"p2","intranet")},
    {text:"The rest of today's list, from PC1: <code>nslookup payroll</code> (what kind of answer is that, and whose job is the fix?) and <code>ping backup</code> (did DNS do its job? who replies?). Then on PH-R1, <code>show ip route 10.40.70.10</code>", done:B=>Bench.tried(B,"p1",/^\s*nslookup\s+payroll/i) && Bench.tried(B,"p1",/^\s*ping\s+backup/i) && B.devs.r1.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+10\.40\.70\./i.test(h))},
    {text:"Save PH-R1: <code>copy running-config startup-config</code>", done:B=>!!B.devs.r1.env.savedOnce},
  ],
  win:"Three different faults behind one sentence. PC1 asked 10.40.50.35 — a typo in the pool's dns-server — so lookups timed out while routing was perfect; you fixed the pool and renewed. RECEPTION had the right server but no DNS suffix, so only full names worked. And of the morning's list, payroll has no record (a DNS-team job: the server answered 'no such name'), while backup resolved fine and then hit a router with no route — not DNS at all.",
  solve:[["pc","p1","ping 10.40.50.80"],["pc","p1","ping intranet"],["pc","p1","ipconfig /all"],["pc","p1","nslookup intranet"],["pc","p1","nslookup intranet 10.40.50.53"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show running-config | section dhcp"],
    ["term","configure terminal"],["term","ip dhcp pool STAFF"],["term","dns-server 10.40.50.53"],["term","end"],
    ["pc","p1","ipconfig /renew"],["pc","p1","ipconfig /all"],["pc","p1","ping intranet"],
    ["pc","p2","ping intranet"],["pc","p2","ping intranet.ph.example.com"],["dhcp","p2"],["pc","p2","ping intranet"],
    ["pc","p1","nslookup payroll"],["pc","p1","ping backup"],["term","show ip route 10.40.70.10"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.case("The bank branch that &ldquo;sped up DNS&rdquo;",`
<p><b>Situation.</b> A microfinance bank's Abuja branch had slow browsing. A contractor changed the pool's <code>dns-server</code> from the bank's two internal DNS servers to the ISP's resolver, <code>203.0.113.53</code>. Browsing improved; next morning thirty calls: the loan app (<code>loans.abj.example.com</code>) &ldquo;not found&rdquo;, shared drives missing, minutes at the Windows logon screen.</p>
<p><b>Diagnosis.</b> <code>ipconfig /all</code>: <i>DNS Servers 203.0.113.53</i>. <code>nslookup loans.abj.example.com</code>: <i>Non-existent domain</i> — correct from the ISP's point of view. Logons were slow because Windows PCs find domain controllers through ${K.g("SRV records","DNS records that say which servers offer a service, e.g. which domain controllers handle logons for a Windows domain.")} that exist only on the internal servers.</p>
<p><b>Options.</b> Put the internal servers back and stay slow; hand out internal first and ISP second (rejected — the second is used only when the first is silent, and its 'no such name' is believed); or put the internal servers back and fix the slowness on them.</p>
<p><b>Decision.</b> The last. The internal servers had been forwarding internet names to head office over a congested WAN; they now forward to the ISP's resolver directly. Staff PCs use only internal DNS; guest Wi-Fi gets the ISP's resolver on purpose.</p>
<p><b>Lessons.</b> Staff PCs ask servers that know the company's names; every DNS server you hand out must give the same answers; and a change of who answers DNS is a change, with a test plan.</p>`)}
${K.myth([
  ["If ping by name fails, DNS is broken.","Only if the name didn't become an address. If ping shows [address] and then fails, the problem is reachability."],
  ["The second DNS server is used when the first doesn't know a name.","It's used only when the first doesn't answer at all. 'No such name' is a final answer."],
  ["Server: UnKnown in nslookup means the DNS server is broken.","It usually just means the reverse lookup of the server's address found no PTR record — cosmetic."],
])}
${K.dodont([
  "Test the full name (FQDN) first, then the short name — it separates record faults from suffix faults.",
  "Use <code>nslookup NAME SERVER</code> to test the design's server directly.",
  "Fix DNS settings where they come from — the DHCP pool's <code>dns-server</code> and <code>domain-name</code> — then <code>ipconfig /renew</code>.",
  "Lower a record's TTL a day before moving a server, and raise it again afterwards.",
],[
  "Don't hand out a mix of internal and public DNS servers to staff PCs.",
  "Don't call it DNS when ping already shows the address in brackets.",
  "Don't run <code>ip dns server</code> on an internet-facing interface without a filter.",
  "Don't fix one PC by hand and leave the pool wrong.",
])}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Jos clinic reports five different problems. Match each result with the most likely fault.", pairs:[["ping lab-srv: could not find host; nslookup lab-srv: No response from server; ping of the DNS server's address works","The DNS server address doesn't run DNS"],["ping lab-srv.jos.example.com works; ping lab-srv: could not find host","Missing DNS suffix on the client"],["ping lab-srv: Pinging lab-srv.jos.example.com [10.60.0.15] ... Destination host unreachable","A routing fault — DNS worked"],["nslookup lab-srv shows 10.60.0.21; ping lab-srv shows [10.60.0.15]","A stale cached answer or hosts-file entry"],["nslookup lab-srv.jos.example.com: Non-existent domain from the clinic's DNS server","The record doesn't exist"]], why:"1. What is asked? Which fault each result proves. 2. Rule: first check whether the name became the right address; a timeout or No response from server means no DNS answer, Non-existent domain is an answer, and brackets mean resolution worked. 3. Apply it: a reachable address that won't answer DNS is a box without the service; FQDN-yes/short-no is the suffix; brackets then unreachable is routing; nslookup and ping disagreeing is the PC's cache or hosts file; Non-existent domain for the FQDN is a missing record."})}

<h2>Interview corner</h2>
${K.hint(`Stub, recursive resolver, root, TLD, authoritative — and the cache and TTL. Bring it back to what you'd check on a PC.`)}
${K.reveal("“Walk me through what happens when someone types portal.example.com into a browser — just the DNS part.”",`<p>"The browser asks the OS's stub resolver, which checks its cache and hosts file, then sends one recursive query over UDP 53 to the DNS server DHCP gave it. If that resolver hasn't cached the name, it walks the tree: root, then the com servers, then example.com's authoritative servers, which return the A (and AAAA) record with a TTL. Both cache it for the TTL, and the browser connects — from there it's routing and TCP."</p>`)}
${K.hint(`Name or route first; which server; the three nslookup verdicts; fix at the source.`)}
${K.reveal("“A user can reach a server by IP but not by name. How do you troubleshoot?”",`<p>"By IP working means the path is fine, so it's name resolution. ipconfig /all shows which DNS servers and suffix the PC has — I compare them with the design. Then nslookup: a timeout means nothing answered at that address, so I ping the server and check it runs DNS; 'Non-existent domain' is an answer, so I try the FQDN to rule out the suffix. nslookup with the correct server proves the record. If nslookup and ping disagree, it's the cache or hosts file. I fix it at the source, usually the DHCP pool."</p>`)}
${K.hint(`Answer locally, forward the rest, cache — and the two settings people forget.`)}
${K.reveal("“When would you make a Cisco router a DNS server, and how?”",`<p>"At a small branch: one DNS address for the DHCP pool, local names for printers in the host table, and a cache so lookups don't keep crossing the WAN. I'd set ip name-server to the company DNS servers, keep ip domain lookup on, add ip dns server and ip host entries, and ip domain name so the router's own short-name lookups work. Never unfiltered on an internet-facing interface — open resolvers get abused."</p>`)}

${K.recap([
  "DNS turns a name into an address before the first packet is sent: 'works by IP, not by name' points at name resolution first.",
  "Names are read right to left down a tree; each zone's authoritative servers hold its records, parents only delegate.",
  "The stub resolver sends one recursive query (UDP 53); the recursive resolver walks root, TLD and authoritative servers, caches for the TTL and replies — non-authoritative from a cache.",
  "A = IPv4, AAAA = IPv6, CNAME = alias, MX = mail servers, PTR = address to name (in-addr.arpa); NS and SOA describe the zone.",
  "A name without a dot gets the DNS suffix: option 15 (pool domain-name) on Windows, ip domain name on IOS.",
  "ipconfig /all (which server), nslookup NAME [SERVER] (what the server says), ping NAME (what the PC uses), ipconfig /flushdns.",
  "IOS: ip host first, then (lookup on) ip name-server; show hosts lists perm and temp entries; ip dns server answers and forwards for a LAN.",
  "Did the name become the right address? No = DNS (timeout = no answer; Non-existent domain = an answer). Yes = routing.",
])}
${K.next(`<b>Lesson 4 — NAT.</b> Every PC in this lesson used a private 10.x or 172.16.x address. When one asks a resolver on the internet, its packets can't come back to a private address — unless the edge router translates it. Next: why NAT exists, the four address names (inside/outside, local/global), and static and dynamic NAT on IOS.`)}
`,
quiz:[
  {lvl:1, q:"What is the main job of DNS?", o:["To give hosts IP addresses automatically","To turn names such as portal.example.com into IP addresses (and answer other questions about names)","To find the MAC address of a known IP address","To translate private addresses into public ones"], a:1, why:"DNS resolves names to addresses. DHCP hands out addresses (lessons 1–2), ARP finds MAC addresses (Module 2), and NAT translates addresses (lesson 4)."},
  {lvl:1, type:"match", q:"Match each DNS record type with the question it answers.", pairs:[["A","Which IPv4 address has this name?"],["AAAA","Which IPv6 address has this name?"],["CNAME","Which name is this one an alias of?"],["MX","Which servers accept email for this domain?"],["PTR","Which name belongs to this address?"]], why:"A and AAAA map names to IPv4 and IPv6 addresses; CNAME makes an alias; MX lists mail servers with a preference; PTR is the reverse lookup used by logs, traceroute names and nslookup's Server line."},
  {lvl:1, q:"Which transport and port do ordinary DNS queries from a PC use?", o:["TCP 80","UDP 53","UDP 67","TCP 22"], a:1, why:"Ordinary DNS queries and answers use UDP port 53: one small request, one small reply. TCP 53 is used for large answers and zone transfers. UDP 67/68 is DHCP; TCP 22 is SSH; TCP 80 is HTTP."},
  {lvl:1, type:"fill", q:"Which Windows command empties the PC's DNS resolver cache?", fields:[{label:"Command", a:["ipconfig /flushdns","ipconfig/flushdns","ipconfig -flushdns"]}], why:"ipconfig /flushdns clears cached answers so the next lookup asks the DNS server again. ipconfig /displaydns shows the cache; nslookup ignores it."},
  {lvl:1, type:"fill", q:"Which IOS global configuration command makes the router answer DNS queries from other devices?", fields:[{label:"Command", a:["ip dns server"], ios:true}], why:"ip dns server enables the router's DNS server: it answers from its host table (ip host) and, with ip domain lookup on, forwards other questions to its ip name-server addresses, caching the replies."},
  {lvl:2, type:"order", q:"Put the steps of a lookup for www.example.org from a resolver with an EMPTY cache in order.", items:["The PC sends a recursive query to its configured DNS server","The resolver asks a root server and gets a referral to the org TLD servers","The resolver asks an org server and gets a referral to example.org's servers","An authoritative example.org server returns the A record with its TTL","The resolver caches the record and answers the PC"], why:"The stub resolver asks once; the recursive resolver walks the tree top-down with iterative queries (root, TLD, authoritative), caches the answer for its TTL and replies. Later lookups within the TTL skip the walk."},
  {lvl:2, q:"Based on the exhibit, which statement is correct?", ex:"C:\\Users\\amaka>nslookup mail\nServer:  UnKnown\nAddress:  192.168.30.1\n\nNon-authoritative answer:\nName:    mail.abj.example.com\nAddress:  10.20.0.25", o:["The DNS server at 192.168.30.1 is broken because its name is UnKnown","The PC asked 192.168.30.1, which passed on an answer it got from (or cached from) another server; abj.example.com was added as the suffix","The PC asked the authoritative server for abj.example.com","The lookup failed"], a:1, why:"Server/Address name who was asked: 192.168.30.1 (here a branch router with ip dns server), whose address has no PTR record — hence UnKnown, which is cosmetic. Non-authoritative means the answer was passed on or cached, not served by the zone's own server. The PC typed mail; the suffix made it mail.abj.example.com."},
  {lvl:2, q:"A PC's ping by name shows 'Ping request could not find host files'. nslookup files times out from the PC's DNS server, 10.5.0.35, but nslookup files 10.5.0.53 returns the right address. The PC uses DHCP. Where is the best fix?", o:["Add a hosts-file entry on the PC","Correct the dns-server line in the DHCP pool to 10.5.0.53, then renew the lease on the PCs","Add a static route to 10.5.0.53","Create the files record on 10.5.0.53"], a:1, why:"The record and the right server are proven by the second nslookup; the PC asks the wrong address. Its setting came from the DHCP pool, so fix dns-server there (it replaces the old list) and have clients renew. A hosts-file entry would fix one name on one PC only."},
  {lvl:2, type:"multi", q:"Which TWO results prove that DNS did its job and the fault lies elsewhere? (Choose two.)", o:["Pinging erp.kad.example.com [10.3.0.70] with 32 bytes of data: Request timed out.","Translating \"erp\"...domain server (10.3.0.53) [OK] followed by .....","Ping request could not find host erp.","*** ns1.kad.example.com can't find erp: Non-existent domain","DNS request timed out."], a:[0,1], why:"An address in brackets (Windows) or [OK] in IOS's Translating line means the name became an address — the failure is reachability, or a wrong record. Could not find host, Non-existent domain and a DNS timeout all mean resolution itself failed."},
  {lvl:2, q:"Based on the exhibit, why does ping erp fail on this PC while the same command works on DHCP clients in the same office?", ex:"   Connection-specific DNS Suffix  . :\n   DHCP Enabled. . . . . . . . . . . : No\n   IPv4 Address. . . . . . . . . . . : 10.20.0.103(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.20.0.1\n   DNS Servers . . . . . . . . . . . : 203.0.113.53", o:["The PC has no default gateway","The PC is static: it has no DNS suffix and it asks a public resolver that doesn't know internal names","The subnet mask is wrong","The DNS server address is not a valid IP address"], a:1, why:"Two problems from one static setup: the empty suffix means erp is asked for as plain 'erp', and 203.0.113.53 (an ISP or public resolver) has no records for the internal zone anyway. DHCP clients get the internal DNS server and the suffix from the pool. Switching the PC to DHCP fixes both."},
  {lvl:2, type:"multi", q:"An IOS router has ip domain name corp.example.com, ip name-server 10.10.50.53 and ip host core-sw 10.30.1.2. Which TWO statements are true? (Choose two.)", o:["ping core-sw uses the host table and doesn't ask the DNS server","ping portal asks 10.10.50.53 for portal.corp.example.com","ping portal asks 10.10.50.53 for plain portal","With no ip domain lookup, ping portal would still be resolved by 10.10.50.53","show hosts lists core-sw as a temp entry"], a:[0,1], why:"The host table is checked first, so core-sw needs no DNS. A name without a dot gets the default domain added before the router asks its name server. With domain lookup off, only the host table works. ip host entries show as perm; names learned from DNS show as temp."},
  {lvl:3, q:"A finance user reports that the expenses site opens on her colleague's PC but not hers. On her PC, nslookup expenses returns 10.8.0.44 (the new server). ping expenses shows [10.8.0.12] (the old server, now decommissioned). ipconfig /flushdns doesn't change the ping result. What should you check next?", o:["The DHCP pool's dns-server option","The hosts file on her PC, which probably has an old line for expenses","The route to 10.8.0.44","The DNS server's PTR records"], a:1, why:"nslookup asks the server (correct), ping uses the PC's resolver (wrong). Flushing the cache didn't help, so the old address is coming from the hosts file, which is reloaded after a flush. A wrong DNS server would make nslookup wrong too; routing and PTR records don't explain two different addresses."},
  {lvl:3, q:"The ERP server moves to a new address on Saturday night. Its A record has a TTL of 86,400 seconds. Which plan keeps Monday's disruption smallest?", o:["Change the record on Saturday night and ask users to restart on Monday","On Thursday, lower the record's TTL to 300 seconds; change the address on Saturday; raise the TTL again after the move","Set the TTL to 0 permanently","Add the new address to every PC's hosts file"], a:1, why:"Caches keep an answer for up to the TTL they received. Lowering the TTL at least one old-TTL period (a day) before the move means that by Saturday every cache holds the record for at most 5 minutes, so the change spreads in minutes. TTL 0 for ever adds load and some resolvers ignore it; hosts files create the stale-address problem later."},
  {lvl:3, q:"A Jos branch router is the DNS server for its PCs (ip dns server, ip name-server 10.20.0.53, ip domain name abj.example.com). PCs resolve erp.abj.example.com to 10.20.0.70, but the ERP page won't load and the router's own ping erp shows the exhibit. What is your conclusion?", ex:"JOS-R1#ping erp\nTranslating \"erp\"...domain server (10.20.0.53) [OK]\n\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 10.20.0.70, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)", o:["The router's DNS server isn't working","The router needs ip domain lookup","DNS works — the name resolves to 10.20.0.70 — so check reachability of 10.20.0.70 and whether that is still the ERP server's address","The PCs need the router's address in their hosts files"], a:2, why:"[OK] means the name server returned an address, and the PCs get the same one. The dots are an unanswered ping to 10.20.0.70: either something on the path or the server itself, or the record points at an address nothing uses any more. Check with the server team, then trace and read the routes as in Module 5."},
  {lvl:3, type:"multi", q:"A company's DHCP pool hands staff PCs two DNS servers: the internal server 10.1.0.53 first and a public resolver 198.51.100.53 second, 'for resilience'. Which TWO problems does this design cause? (Choose two.)", o:["Whenever a PC falls back to the public resolver, internal names such as intranet and the domain controllers' records fail","The public resolver will return 'no such name' for internal names, and Windows treats that as a final answer","PCs will stop receiving IP addresses","Internet names will no longer resolve","The internal server will refuse queries from PCs that also know a public resolver"], a:[0,1], why:"Windows uses the second server when the first doesn't respond; the public resolver has never heard of internal zones, so intranet names and SRV records for logons fail, and its 'Non-existent domain' answer is believed. Resilience means two internal servers that give the same answers (and forward internet names); addressing and internet names are unaffected."},
],
cards:[
  {f:"What DNS does", b:"Turns names into addresses (and answers other questions about names) before the first packet is sent. Works by IP but not by name = a name-resolution problem, never routing."},
  {f:"FQDN", b:"Fully qualified domain name, read right to left down the tree: root (the final dot), TLD (com, ng), the organisation's domain, subdomains, host. e.g. portal.corp.example.com."},
  {f:"Stub vs recursive resolver vs authoritative", b:"Stub = the PC's DNS client (asks one server, caches). Recursive resolver = the DNS server the PC asks; walks root, TLD, authoritative, caches. Authoritative = holds the zone's records and gives definitive answers."},
  {f:"TTL and caching", b:"Each record carries a TTL in seconds; resolvers and PCs may cache it that long. Long TTL = fewer queries, slow changes. Lower the TTL a day before moving a server."},
  {f:"Record types", b:"A = IPv4, AAAA = IPv6, CNAME = alias, MX = mail servers (lower number first), PTR = address to name (in-addr.arpa), NS = authoritative servers, SOA = zone owner, serial, timers."},
  {f:"DNS ports", b:"UDP 53 for ordinary queries; TCP 53 for large answers and zone transfers."},
  {f:"DNS suffix", b:"Added to a name without a dot. Windows: Connection-specific DNS Suffix, usually DHCP option 15 (pool domain-name). IOS: ip domain name. Static PCs often have none: the FQDN works, the short name fails."},
  {f:"nslookup's verdicts", b:"Name/Address = answered. Non-existent domain = the server answered, no such name. DNS request timed out = nothing answered at that address. No response from server = the address is alive but runs no DNS. nslookup NAME SERVER tests a chosen server."},
  {f:"nslookup vs ping", b:"nslookup asks the DNS server directly and skips the PC's cache and hosts file; ping uses them. If they disagree: ipconfig /flushdns, then check the hosts file."},
  {f:"Non-authoritative answer / Server: UnKnown", b:"Non-authoritative = the answer came from a resolver's cache or was passed on, not from a server authoritative for the zone (a router answering from its host table counts as non-authoritative too). UnKnown = the DNS server's address has no PTR record (cosmetic)."},
  {f:"IOS name lookup order", b:"Host table (ip host) first; then, only with ip domain lookup on, the ip name-server servers, with ip domain name added to names without a dot. No name server = broadcast 255.255.255.255 (the typo trap)."},
  {f:"show hosts", b:"Default domain, lookup mode (domain service or static mappings), name servers, then the table: perm = ip host entries, temp = names learned from DNS and cached."},
  {f:"ip dns server", b:"Makes the router a DNS server: answers from its host table, forwards other questions to its ip name-servers (only with ip domain lookup on) and caches. Good for small branches; never unfiltered on an internet-facing interface (open resolver)."},
  {f:"DNS fault or routing fault?", b:"1. Did the name become the right address? (brackets in ping, [OK] in IOS, Name/Address in nslookup). No = DNS. 2. Yes = reachability: ping the IP, tracert, show ip route — DNS is innocent."},
],
});

// ---------- Module 7 · Lesson 4 ----------
L.push({
id:"svc-nat", mins:90, level:"Intermediate · builds on Modules 3 and 5 and lessons 1–3",
t:"NAT: private addresses, the four address names, static and dynamic NAT",
html:`
${K.goals([
  "Explain why a PC with a private address can send to the internet but never gets the reply — and how NAT fixes it.",
  "Label any address in a NAT scenario as inside local, inside global, outside local or outside global, and read <code>show ip nat translations</code> column by column.",
  "Configure static NAT so the internet can reach an inside server, and prove it from outside.",
  "Configure dynamic NAT from a pool, with a standard access list as the &ldquo;who gets translated&rdquo; list, and recognise a pool that has run out.",
  "Use NAT's order of operations to predict what the access list must match and what the ISP must route.",
])}
${K.pre(["Module 3: public versus private (RFC 1918) addresses, masks and prefix lengths.","Module 5 lesson 4: wildcard masks in the OSPF <code>network</code> command — this lesson's access lists use the same wildcards.","Module 5 lessons 1–2: the routing table, default routes and the return path.","Lessons 1–3 of this module: DHCP, relay and DNS."])}

<h2>Why this matters at work</h2>
<p>Friday afternoon at a managed-service provider in Abuja. A property company has moved offices. Staff can print and open shares, and the new recorder stores every camera. But two tickets have landed: the security company that watches the cameras overnight &ldquo;can't connect to the recorder any more&rdquo;, and the accounts team &ldquo;can't open the bank's portal&rdquo; while reception can.</p>
<p>Both come down to one idea: every office device has a private address the internet never routes, so the edge must swap private for public on the way out — and, for the recorder, public back to private on the way in. That is NAT. This lesson gives you its four address names, its two basic forms and the router's order of operations, so you fix both tickets from evidence.</p>

<h2>Why NAT exists: private space meets the public internet</h2>
${K.remember(`<b>The rule:</b> private (RFC 1918) addresses are free for anyone to use inside, so the internet doesn't route them. A packet <i>from</i> a private address can reach a server; the reply <i>to</i> it has nowhere to go. ${K.g("NAT","Network Address Translation: a router rewrites addresses in the IP header as packets cross it — usually a private source to a public one on the way out, and back for the replies. Described in RFC 3022 (&ldquo;Traditional NAT&rdquo;, 2001), which replaced the original RFC 1631.")} fixes this by rewriting the private address to a public one the internet can route back to.`)}
<p>Module 3 split IPv4 in two. <b>Public</b> addresses are unique on the whole internet. <b>Private</b> addresses — <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code> (172.16.0.0 to 172.31.255.255) and <code>192.168.0.0/16</code> — belong to nobody, and thousands of networks use <code>192.168.1.0/24</code> at the same moment. That is exactly why the internet can't route them: an ISP router can't know which of a thousand <code>192.168.1.25</code>s a packet is for, so it carries no routes for private space.</p>
<p>Follow one ping from an Ibadan PC, <code>192.168.30.21</code>, to a web server, <code>198.51.100.10</code>, with no NAT:</p>
${K.steps([
  ["Out through the edge", "The PC sends to its default gateway, the edge router, which routes the packet to the ISP. Routing never changes addresses, so the source is still 192.168.30.21."],
  ["The request arrives", "Routers forward on the <i>destination</i>, and 198.51.100.10 is public, so the server gets the request."],
  ["The reply dies", "The server replies to 192.168.30.21. The ISP has no route for private space and drops it — in the lab's frame log, <i>ISP has no route to 192.168.30.21</i>. The PC just sees <code>Request timed out.</code>"],
])}
${K.svg("0 0 760 230",
  K.dev("pc",70,80,"PC1","192.168.30.21")+K.dev("router",270,80,"IBD-EDGE","no NAT yet")+K.dev("router",480,80,"ISP","")+K.dev("server",690,80,"WEB","198.51.100.10")+
  K.link(92,82,244,82)+K.link(296,82,454,82)+K.link(506,82,672,82)+
  K.arrow(100,38,660,38,"1  echo request: source 192.168.30.21 → destination 198.51.100.10",true)+
  K.arrow(668,162,510,162,"2  echo reply to 192.168.30.21")+
  K.txt(492,169,"✗",{c:"bad",s:22,mid:true,b:true})+
  K.txt(480,200,"ISP: no route to private space — the reply is dropped",{c:"bad",s:11,mid:true,f:"body"})+
  K.txt(380,222,"Private addresses can send, but nothing on the internet can answer them.",{c:"muted",s:11,mid:true,f:"body"}),
  "Without NAT the request is routed on its public destination and arrives; the reply is addressed to a private address no internet router knows, so it is dropped at the ISP.")}
<p><b>The fix.</b> The edge router has a private address on the LAN and a public one towards the ISP. With NAT it rewrites the outgoing source to a public address it owns and records the swap in a ${K.g("translation table","The NAT router's list of current address swaps: which private address is using which public one, and with which outside host. Shown by show ip nat translations.")}. The reply comes back to the public address — which the ISP <i>can</i> route — and the table tells the router to rewrite the destination back to the PC's private address.</p>
${K.analogy(`<p>A company post room. Staff write their desk number on letters; the post room puts each in an envelope with the street address and notes &ldquo;to the bank — from desk 21&rdquo; in a book. When the bank's reply reaches the street address, the book says which desk gets it. The bank never sees desk numbers — and couldn't deliver to one if it did.</p>`)}
<p>NAT became universal because public IPv4 has run out (Module 6 lesson 1) — an office of 200 devices gets a handful of public addresses, often one. It comes in three forms:</p>
<ul>
<li><b>Static NAT</b> — one private address permanently paired with one public address, for servers the internet must reach. (This lesson.)</li>
<li><b>Dynamic NAT</b> — inside hosts borrow public addresses from a pool, one per host at a time. (This lesson.)</li>
<li>${K.g("PAT","Port Address Translation, or NAT overload: many inside hosts share one public address at once, told apart by port numbers. Lesson 5.")} — many hosts share <b>one</b> public address by port number. Nearly every office and home uses it — <b>lesson 5</b>, built on this lesson's table and rules.</li>
</ul>
${K.myth([
  ["NAT is a firewall: devices behind it are protected.","NAT only rewrites addresses. Static NAT exposes an inside server to the whole internet. Filtering is the job of access lists (Module 8) and firewalls."],
  ["A router needs a route to its own public NAT addresses.","It doesn't: inbound packets are translated to the inside address before the routing lookup. It's the ISP that must route the public addresses to you."],
  ["Dynamic NAT lets many PCs share one public address.","Dynamic NAT gives each active host its own pool address. Sharing one address is PAT (lesson 5)."],
])}
${K.check({q:"A PC is set up with 172.20.4.15/16 and a correct gateway, but the edge router has no NAT. A ping to a public server times out. Where is the reply most likely dropped?", o:["At the PC, because 172.20.4.15 isn't a valid host address","At the first internet router with no route for 172.16.0.0/12 space — usually the ISP","At the server, which refuses requests from private addresses","At the edge router, which never forwards private sources"], a:1, why:"172.20.4.15 is inside 172.16.0.0/12. The request is routed on its public destination and arrives; the reply is addressed to a private address internet routers have no route for. The edge router forwards private sources happily — routing ignores the source."})}
<h3>Same logic, new situation</h3>
<p>A trainee builds a lab LAN, <code>10.99.0.0/24</code>, behind the office edge router, which translates <code>192.168.0.0/16</code> only. Lab PCs can ping office PCs but not the internet; office PCs browse fine. Why?</p>
${K.hint(`Follow the reply, not the request. Which sources does the edge router rewrite?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why one private range gets out and another doesn't. <b>2. Rule:</b> a reply to a private address only returns if the edge translated that address to a public one. <b>3. Apply it:</b> office sources (192.168.x.x) are rewritten, so their replies return. Lab sources (10.99.0.x) leave unchanged and their replies die at the ISP. Fix: add the lab range to the edge's &ldquo;who gets translated&rdquo; list — which you'll write later in this lesson.</p>`)}

<h2>The four address names</h2>
${K.remember(`<b>Two words, two meanings.</b> <b>Inside / outside</b> = <i>where the host lives</i>: on your network, or beyond the edge. <b>Local / global</b> = <i>which side you're looking from</i>: the inside network, or the outside. Combine them and every address has exactly one name.`)}
<div class="tablewrap"><table>
<tr><th>Name</th><th>Whose address?</th><th>Seen from</th><th>Ibadan example</th></tr>
<tr><td><b>Inside local</b></td><td>An inside host</td><td>The inside</td><td><code>192.168.30.21</code> — what PC1 has configured</td></tr>
<tr><td><b>Inside global</b></td><td>The same inside host</td><td>The outside</td><td><code>192.0.2.18</code> — the public address PC1 appears as</td></tr>
<tr><td><b>Outside local</b></td><td>An outside host</td><td>The inside</td><td><code>198.51.100.10</code> — the server as PC1 sees it</td></tr>
<tr><td><b>Outside global</b></td><td>The same outside host</td><td>The outside</td><td><code>198.51.100.10</code> — the server's real address</td></tr>
</table></div>
<p>Outside local and outside global are the same because the router only translates the <i>inside</i> host's address — <b>inside source NAT</b>, which the <code>ip nat inside source</code> commands configure. Routers can also translate outside addresses, which makes them differ, but that's beyond the CCNA.</p>
${K.svg("0 0 760 340",
  K.band(20,14,330,24,"INSIDE — G0/0 is ip nat inside")+K.band(430,14,310,24,"OUTSIDE — G0/1 is ip nat outside")+
  K.dev("pc",80,92,"PC1","")+K.dev("router",385,92,"IBD-EDGE","translates here")+K.dev("server",680,92,"WEB","")+
  K.link(102,94,359,94,"G0/0")+K.link(411,94,662,94,"G0/1")+
  K.box(20,160,330,60,"Packet on the inside","src 192.168.30.21 → dst 198.51.100.10")+
  K.box(430,160,310,60,"Same packet on the outside","src 192.0.2.18 → dst 198.51.100.10",true)+
  K.arrow(352,190,428,190,"NAT",true)+
  K.txt(36,250,"192.168.30.21 = inside local",{c:"fg",s:11.5})+K.txt(36,270,"198.51.100.10 = outside local",{c:"fg",s:11.5})+
  K.txt(446,250,"192.0.2.18 = inside global",{c:"fg",s:11.5})+K.txt(446,270,"198.51.100.10 = outside global",{c:"fg",s:11.5})+
  K.txt(380,306,"Inside/outside = where the host lives. Local/global = which side of the router you are looking from.",{c:"muted",s:11,mid:true,f:"body"})+
  K.txt(380,326,"Only the inside host's address changes, so outside local = outside global in inside source NAT.",{c:"muted",s:11,mid:true,f:"body"}),
  "The four address names on one packet. The router rewrites the inside host's address as the packet crosses from the inside interface to the outside one.")}
<p>The Ibadan router after PC1 (<code>.21</code>) and PC2 (<code>.22</code>) each pinged the server — <code>show ip nat translations</code> prints one column per name:</p>
${K.out(`IBD-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 192.0.2.18:1          192.168.30.21:1       198.51.100.10:1       198.51.100.10:1
icmp 192.0.2.19:1          192.168.30.22:1       198.51.100.10:1       198.51.100.10:1
---  192.0.2.18            192.168.30.21         ---                   ---
---  192.0.2.19            192.168.30.22         ---                   ---
Total number of translations: 4`, "Dynamic NAT after two pings. Inside GLOBAL is the first column.")}
<ul>
<li><b>The <code>---</code> rows</b> are the address pairings: PC1 is using <code>192.0.2.18</code>, PC2 <code>192.0.2.19</code>.</li>
<li><b>The <code>icmp</code> rows</b> are conversations, adding the outside host. <code>:1</code> is the ICMP query identifier, which IOS shows where a port would go — lesson 5 is all about those numbers.</li>
<li><b>Column order:</b> inside global comes <i>before</i> inside local. Misreading it is the classic exam slip.</li>
</ul>
${K.exam(`Reading any NAT question: before you look at the options, <b>write a label next to every address</b> in the question or exhibit — does this host live inside or outside, and is this the address seen inside or outside? Then answer. Typical traps: inside local and global swapped, or the outside server's public address called &ldquo;inside global&rdquo;.`)}
${K.q({type:"match", q:"A Lagos PC, 10.8.4.33, browses a supplier's site at 203.0.113.80. The edge router translates the PC to 198.51.100.66. Match each address with its NAT name.", pairs:[["10.8.4.33","Inside local"],["198.51.100.66","Inside global"],["203.0.113.80 as the PC sees it","Outside local"],["203.0.113.80 on the internet","Outside global"]], why:"The PC lives inside: its configured 10.8.4.33 is inside local, and 198.51.100.66, what the internet sees, is inside global. The supplier lives outside and isn't translated, so 203.0.113.80 is both outside local (seen from inside) and outside global."})}
${K.mistake(`Calling every public address &ldquo;global&rdquo;. The outside server's public address is <b>outside local</b> when described from the inside. Decide inside/outside by where the host lives first, then local/global by the point of view.`)}
${K.check({q:"In show ip nat translations, which column holds the address the inside host has configured on its network card?", o:["Inside global (first column)","Inside local (second column)","Outside local (third column)","Outside global (fourth column)"], a:1, why:"The host's own address is the inside local — the inside host seen from the inside. IOS prints inside global first, so it's the second column."})}
<h3>Same logic, new situation</h3>
<p>A Kaduna exhibit shows <code>icmp 203.0.113.44:1  10.66.2.9:1  192.0.2.200:1  192.0.2.200:1</code>. A colleague says &ldquo;10.66.2.9 is pinging 203.0.113.44&rdquo;. Right?</p>
${K.hint(`Name the four columns in order before you decide who is talking to whom.`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> who talks to whom. <b>2. Rule:</b> the columns are inside global, inside local, outside local, outside global. <b>3. Apply it:</b> <code>203.0.113.44</code> and <code>10.66.2.9</code> are the <b>same inside host</b> (its global and local); the outside host is <code>192.0.2.200</code>. The colleague read two names for one host as two hosts.</p>`)}

<h2>Static NAT: a permanent pairing for servers</h2>
${K.remember(`<b>The rule:</b> a static entry pairs <b>one inside local with one inside global, permanently</b>. Because it exists before any traffic, it works in <b>both directions</b>: the host's outgoing packets get the public source, and packets from the internet to the public address reach the host. One-to-one: each public address leads to one inside address only.`)}
<p>Dynamic NAT and PAT create a translation only when an inside host <i>starts</i> a conversation. A server waits for someone outside to connect, so it needs a public address that is <i>always</i> mapped to it. Every NAT configuration has three pieces:</p>
<ol>
<li><b>Roles:</b> <code>ip nat inside</code> under interfaces facing your LANs, <code>ip nat outside</code> under the one facing the ISP. Only packets crossing between an inside and an outside interface are translated.</li>
<li><b>The mapping:</b> for static NAT, <code>ip nat inside source static &lt;inside local&gt; &lt;inside global&gt;</code> in global configuration.</li>
<li><b>Delivery:</b> the ISP must send packets for that public address to your router (the order-of-operations section explains how).</li>
</ol>
<h3>Worked example: the Lagos web server</h3>
<p>LOS-EDGE joins the Lagos LAN (<code>192.168.50.0/24</code>) to the ISP over <code>192.0.2.0/29</code>: ISP <code>.1</code>, LOS-EDGE <code>.2</code>, and the whole /29 is the customer's. Web server <code>192.168.50.10</code> must be reachable at <code>192.0.2.5</code>; a test client on the internet is <code>203.0.113.77</code>.</p>
${K.steps([
  ["Prove the problem", "The client's <code>ping 192.0.2.5</code> times out: the ISP asks &ldquo;Who has 192.0.2.5?&rdquo; on the /29 and nobody answers."],
  ["Roles", "<code>interface g0/0</code> → <code>ip nat inside</code>; <code>interface g0/1</code> → <code>ip nat outside</code>."],
  ["The pairing", "<code>ip nat inside source static 192.168.50.10 192.0.2.5</code> — <i>for inside sources, statically, this inside local ↔ this inside global</i>."],
  ["Check", "<code>show ip nat translations</code> lists it at once: a static entry is configuration, not traffic."],
  ["Test both ways", "The client's ping now gets replies — LOS-EDGE answers the ISP's ARP for 192.0.2.5 — and the server's own pings leave with source 192.0.2.5."],
])}
${K.out(`LOS-EDGE(config)#interface g0/0
LOS-EDGE(config-if)#ip nat inside
LOS-EDGE(config-if)#interface g0/1
LOS-EDGE(config-if)#ip nat outside
LOS-EDGE(config-if)#exit
LOS-EDGE(config)#ip nat inside source static 192.168.50.10 192.0.2.5
LOS-EDGE(config)#end
LOS-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
---  192.0.2.5             192.168.50.10         ---                   ---
Total number of translations: 1
LOS-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 192.0.2.5:1           192.168.50.10:1       203.0.113.77:1        203.0.113.77:1
---  192.0.2.5             192.168.50.10         ---                   ---
Total number of translations: 2`, "The static entry appears before any traffic. The second table is after the client's ping: an icmp flow created by a conversation that started outside.")}
${K.dyk(`When a static or pool address sits on the outside interface's own subnet, IOS answers ARP for it by itself — it creates an <b>alias</b> (<code>show ip aliases</code> lists them, type <i>Dynamic</i>). The alias comes from the static and the interface's subnet alone, so it exists even before the interface is marked <code>ip nat outside</code>. That's why the ISP's &ldquo;Who has 192.0.2.5?&rdquo; suddenly gets an answer, though 192.0.2.5 is configured on no interface.`)}
${K.mistake(`Testing a static NAT server from <i>inside</i> by pinging its public address. Many routers won't loop that packet back in, and success proves nothing about the internet path. Test from a host really outside — a phone on mobile data, or the lab's PC beyond the ISP.`)}
${K.check({q:"An engineer configures ip nat inside source static 192.168.50.10 192.0.2.5 but forgets ip nat inside and ip nat outside. What happens when the client pings 192.0.2.5?", o:["It works: the static entry is enough","It fails: the router only translates packets crossing between inside and outside interfaces","It works for the first ping only","IOS rejects the static line until the interfaces are marked"], a:1, why:"IOS accepts and lists the static, but translation only happens between an ip nat inside and an ip nat outside interface, so the packet to 192.0.2.5 is never translated."})}
<h3>Try it: static and dynamic NAT syntax on PHC-EDGE</h3>
<p>Port Harcourt's PHC-EDGE has G0/0 <code>172.16.20.1/24</code> (staff) and G0/1 <code>203.0.113.18/29</code> to the ISP (<code>.17</code>), which assigned <code>203.0.113.16/29</code>. The plan: booking server <code>172.16.20.80</code> ↔ <code>203.0.113.20</code>; staff in <code>172.16.20.0/24</code> and <code>172.16.21.0/24</code> (behind the core switch) borrow <code>.21</code>–<code>.22</code>. Tasks 4–6 preview the next section — read IOS's answers.</p>
${K.term({env:"ios2", title:"NAT roles, a static mapping and a pool on PHC-EDGE", opts:{kind:"router", host:"PHC-EDGE", model:"ISR 1100"},
  setup:env=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","ip address 172.16.20.1 255.255.255.0","no shutdown","interface g0/1","ip address 203.0.113.18 255.255.255.248","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.17","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Predict IOS's answer before every command that might be refused.",
  tasks:[
    {text:"Roles: <code>interface g0/0</code> → <code>ip nat inside</code>, then <code>interface g0/1</code> → <code>ip nat outside</code>", done:e=>!!e.intfs["GigabitEthernet0/0"].natIn && !!e.intfs["GigabitEthernet0/1"].natOut},
    {text:"<code>exit</code>, then pair the booking server: <code>ip nat inside source static 172.16.20.80 203.0.113.20</code>", done:e=>!!e.nat && e.nat.statics.some(s=>!s.proto && s.local==="172.16.20.80" && s.global==="203.0.113.20")},
    {text:"Try the backup server on the same public address: <code>ip nat inside source static 172.16.20.81 203.0.113.20</code>. Why does IOS refuse?", done:e=>e.log.some(l=>/already mapped/.test(l.out||""))},
    {text:"The &ldquo;who&rdquo; list: <code>access-list 7 permit 172.16.20.0 0.0.0.255</code> and <code>access-list 7 permit 172.16.21.0 0.0.0.255</code> (each line of a standard access list permits sources matching an address and wildcard)", done:e=>{ const A = window.ACL; return !!(e.acl && e.acl.lists["7"]) && A.check(e.acl,"7",{src:"172.16.20.9"},false).permit && A.check(e.acl,"7",{src:"172.16.21.9"},false).permit && !A.check(e.acl,"7",{src:"172.16.22.9"},false).permit; }},
    {text:"The pool: try <code>ip nat pool PHC 203.0.113.21 203.0.113.30 netmask 255.255.255.248</code> and read the refusal; then <code>ip nat pool PHC 203.0.113.21 203.0.113.22 netmask 255.255.255.248</code>", done:e=>e.log.some(l=>/End address not on same subnet/.test(l.out||"")) && !!(e.nat && e.nat.pools.PHC) && e.nat.pools.PHC.end - e.nat.pools.PHC.start===1},
    {text:"Join them: <code>ip nat inside source list 7 pool PHC</code>", done:e=>!!e.nat && e.nat.rules.some(r=>r.acl==="7" && r.pool==="PHC" && !r.overload)},
    {text:"<code>end</code>, <code>show ip nat translations</code>: why only one entry?", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ip\s+nat\s+tr/i.test(l.cmd||"") && /203\.0\.113\.20\s+172\.16\.20\.80/.test(l.out||"") && /Total number of translations: 1/.test(l.out||""))},
    {text:"<code>show running-config | include ip nat</code> — every NAT line in one place", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+run\S*\s*\|\s*inc\S*\s+ip nat/i.test(l.cmd||"") && /ip nat inside source list 7 pool PHC/.test(l.out||""))},
  ],
  win:"You set the roles, made a one-to-one static (and saw IOS refuse two servers on one public address), built a standard ACL as the match list, saw a pool range refused for leaving its /29, and joined list to pool. Only the static is in the table: dynamic entries are made by packets, not configuration.",
  solve:["enable","configure terminal","interface g0/0","ip nat inside","interface g0/1","ip nat outside","exit","ip nat inside source static 172.16.20.80 203.0.113.20","ip nat inside source static 172.16.20.81 203.0.113.20","access-list 7 permit 172.16.20.0 0.0.0.255","access-list 7 permit 172.16.21.0 0.0.0.255","ip nat pool PHC 203.0.113.21 203.0.113.30 netmask 255.255.255.248","ip nat pool PHC 203.0.113.21 203.0.113.22 netmask 255.255.255.248","ip nat inside source list 7 pool PHC","end","show ip nat translations","show running-config | include ip nat"]})}
${K.hint(`Task 5: a /29 is a block of 8 starting at a multiple of 8 — which block holds .16–.23, and which holds .30? Task 7: what creates a dynamic entry?`)}
<h3>Hands-on: the Abuja NVR the security company can't see</h3>
<p>The opening ticket, on its own network. ABJ-EDGE joins the Abuja LAN (<code>172.16.5.0/24</code>) to the ISP over <code>203.0.113.0/29</code>. The camera recorder (${K.g("NVR","Network Video Recorder: the box that stores camera footage and lets authorised people view it remotely.")}) must be reachable at <code>203.0.113.6</code>. On Friday the old NVR (<code>172.16.5.40</code>) was replaced by one at <code>172.16.5.50</code>, and a contractor re-racked the router. Since then the security company (<code>198.51.100.25</code>) can't reach it.</p>
${K.hint(`Two faults. After each ping, read the frame log: who answers the ISP's ARP for 203.0.113.6, and is the packet then translated — or does ABJ-EDGE try to deliver 203.0.113.6 itself? Once it is translated, which inside address is the packet sent to?`)}
${K.bench({id:"m7-nat-static-nvr", points:100, from:"CCNA · Module 7 · lesson 4", title:"Abuja office: make the new NVR reachable from the internet again", viewBox:"0 0 900 440", openLog:true,
  intro:"LAPTOP-NOC is on ABJ-EDGE's console (9600 8N1, no flow control). Click Viewer, NVR or DESK for a Command Prompt. Build sheet: NVR 172.16.5.50/24 (gateway .1) ↔ public 203.0.113.6; ABJ-EDGE G0/0 172.16.5.1/24, G0/1 203.0.113.2/29; ISP 203.0.113.1; Viewer 198.51.100.25.",
  devices:[
    {id:"lap", kind:"laptop", label:"LAPTOP-NOC", x:20, y:20},
    {id:"edge", kind:"router", label:"ABJ-EDGE", model:"ISR 1100 · Abuja office edge", x:300, y:120,
      config:e=>{ ["en","conf t","hostname ABJ-EDGE","no ip domain-lookup","interface g0/0","description OFFICE LAN","ip address 172.16.5.1 255.255.255.0","ip nat inside","no shutdown","interface g0/1","description ISP","ip address 203.0.113.2 255.255.255.248","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip nat inside source static 172.16.5.40 203.0.113.6","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"isp", kind:"router", label:"ISP", model:"ISP access router", x:600, y:120,
      config:e=>{ ["en","conf t","hostname ISP","no ip domain-lookup","interface g0/1","ip address 203.0.113.1 255.255.255.248","no shutdown","interface g0/0","ip address 198.51.100.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"SW-OFFICE", x:300, y:230},
    {id:"nvr", kind:"server", label:"NVR", x:180, y:330, ip:"172.16.5.50", mask:"255.255.255.0", gw:"172.16.5.1"},
    {id:"desk", kind:"pc", label:"DESK", x:420, y:330, ip:"172.16.5.21", mask:"255.255.255.0", gw:"172.16.5.1"},
    {id:"v", kind:"pc", label:"Viewer", x:760, y:280, ip:"198.51.100.25", mask:"255.255.255.0", gw:"198.51.100.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"edge:con"}, {type:"cat6", a:"edge:g0", b:"sw:g1"}, {type:"cat6", a:"nvr:eth", b:"sw:g2"}, {type:"cat6", a:"desk:eth", b:"sw:g3"},
           {type:"cat6", a:"edge:g1", b:"isp:g1"}, {type:"cat6", a:"v:eth", b:"isp:g0"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket: on Viewer, <code>ping 203.0.113.6</code>. In the frame log, who answers the ISP's ARP for 203.0.113.6 — and is there a NAT line for the packet that follows?", done:B=>Bench.tried(B,"v",/^\s*ping\s+203\.0\.113\.6\s*$/i)},
    {text:"On LAPTOP-NOC: console into ABJ-EDGE, <code>enable</code>, <code>show ip nat translations</code>. Compare the inside local with the build sheet", done:B=>B.devs.edge.env.log.some(l=>/^\s*sh\S*\s+ip\s+nat\s+tr/i.test(l.cmd||"") && /203\.0\.113\.6\s+172\.16\.5\.40/.test(l.out||""))},
    {text:"<code>show running-config | section interface</code>: which interface has lost its NAT role?", done:B=>B.devs.edge.env.log.some(l=>/^\s*sh\S*\s+run/i.test(l.cmd||"") && /interface GigabitEthernet0\/1\n( description ISP\n)? ip address 203\.0\.113\.2 255\.255\.255\.248\n(?! ip nat)/.test(l.out||""))},
    {text:"In <code>configure terminal</code>, give G0/1 its role. Ping 203.0.113.6 from Viewer again: still timing out — read the NAT line in the frame log. Where is the packet sent now?", done:B=>!!B.devs.edge.env.intfs["GigabitEthernet0/1"].natOut},
    {text:"Replace the stale mapping: <code>no</code> in front of the exact old line, then pair 172.16.5.50 with 203.0.113.6", done:B=>{ const s = B.devs.edge.env.nat.statics; return s.some(x=>!x.proto && x.local==="172.16.5.50" && x.global==="203.0.113.6") && !s.some(x=>x.local==="172.16.5.40"); }},
    {text:"From Viewer, <code>ping 203.0.113.6</code>: four replies. Find the request's NAT line — destination 203.0.113.6 → 172.16.5.50, logged <i>before</i> ABJ-EDGE routes it — and the reply's: source 172.16.5.50 → 203.0.113.6, logged <i>after</i> routing, by the same static entry.", done:B=>Bench.pinged(B,"v","203.0.113.6")},
    {text:"On ABJ-EDGE, <code>show ip nat translations</code>: name the four addresses in the new icmp row", done:B=>B.devs.edge.env.log.some(l=>/icmp 203\.0\.113\.6:\d+\s+172\.16\.5\.50:\d+\s+198\.51\.100\.25:\d+\s+198\.51\.100\.25/.test(l.out||""))},
    {text:"The NVR sends alerts out too: from NVR, <code>ping 198.51.100.25</code>. The log shows 172.16.5.50 → 203.0.113.6 after routing — the static works outbound", done:B=>Bench.pinged(B,"nvr","198.51.100.25")},
    {text:"From Viewer, <code>ping 172.16.5.50</code>. Who answers, and why?", done:B=>Bench.tried(B,"v",/^\s*ping\s+172\.16\.5\.50\s*$/i)},
    {text:"Save ABJ-EDGE's configuration (<code>write memory</code>)", done:B=>B.devs.edge.env.savedOnce},
  ],
  win:"You found both Friday faults from evidence: G0/1 had lost ip nat outside (so ABJ-EDGE answered the ARP for 203.0.113.6 but translated nothing), and the static still pointed at the old NVR. The new mapping works both ways — the viewer reaches 203.0.113.6 and the NVR's alerts leave as 203.0.113.6 — while the private address stays unreachable from the internet.",
  solve:[["pc","v","ping 203.0.113.6"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip nat translations"],["term","show running-config | section interface"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip nat outside"],["term","end"],["pc","v","ping 203.0.113.6"],
    ["term","configure terminal"],["term","no ip nat inside source static 172.16.5.40 203.0.113.6"],["term","ip nat inside source static 172.16.5.50 203.0.113.6"],["term","end"],
    ["pc","v","ping 203.0.113.6"],["term","show ip nat translations"],["pc","nvr","ping 198.51.100.25"],["pc","v","ping 172.16.5.50"],["term","write memory"]]})}
${K.reveal("Walkthrough — what the evidence said",`<p>First ping: ABJ-EDGE answered the ISP's ARP for 203.0.113.6 — IOS builds that alias from the static and the interface subnet alone — but G0/1 had no <code>ip nat outside</code>, so it did no NAT: the packet kept destination 203.0.113.6, which ABJ-EDGE routed back out G0/1 and ARPed for there, and nobody answered. With the role back, ABJ-EDGE translated — to <code>172.16.5.40</code>, the old NVR, whose ARP nobody answered. The new pairing fixed it. <code>ping 172.16.5.50</code> from Viewer gets <code>Destination host unreachable</code> from the ISP: no route to private space, which is why the NVR needs a public mapping at all.</p>`)}
${K.check({q:"In the bench, before any fix, the static entry 172.16.5.40 ↔ 203.0.113.6 was listed and ABJ-EDGE answered the ISP's ARP for 203.0.113.6. Why did the first ping still fail?", o:["A static only starts working after the inside host's first outbound packet","G0/1 had no ip nat outside, so the packet wasn't translated: ABJ-EDGE tried to deliver 203.0.113.6 on the ISP link, where nothing has that address","The ISP needed a static route to 203.0.113.6","The NVR was switched off"], a:1, why:"A static line only translates traffic between ip nat inside and ip nat outside interfaces. The ARP alias exists anyway (the global is in G0/1's subnet), so the packet arrived — untranslated. 203.0.113.6 is on the ISP's connected /29, so no extra route was needed."})}
<h3>Same logic, new situation</h3>
<p>A Kano school has one public address left, <code>198.51.100.14</code>, and two servers that must be reachable: web (port 80) and remote desktop (port 3389). A colleague proposes two static lines with that address. Will it work?</p>
${K.hint(`What does static NAT pair — addresses, or addresses and ports?`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> can two servers share one public address with static NAT? <b>2. Rule:</b> plain static NAT is one-to-one, every port. <b>3. Apply it:</b> the second line is refused, as PHC-EDGE refused <code>172.16.20.81</code>. With one address the router must tell the servers apart by <b>port</b> — static port translation, or port forwarding, in lesson 5. And exposing remote desktop to the whole internet is risky: a VPN or a filter (Module 8) belongs in the plan.</p>`)}

<h2>Dynamic NAT: a pool and a &ldquo;who gets translated&rdquo; list</h2>
${K.remember(`<b>The rule:</b> dynamic NAT hands public addresses from a <b>pool</b> to inside hosts that a <b>standard access list</b> permits — one per host, first come, first served. The pairing is made by the host's first outgoing packet and held until it times out. When the pool is empty, the next host's packets are <b>dropped</b>.`)}
<h3>The access list as a match list — just enough ACL</h3>
<p>An ${K.g("ACL","Access control list: an ordered list of permit/deny lines matching packets by address (and, in extended lists, protocol and port). Used to filter traffic (Module 8) and, here, to select which sources NAT translates.")} is a list of lines that each <i>permit</i> or <i>deny</i> an address pattern. ACLs are best known for filtering traffic on interfaces — that's <b>Module 8</b>; nothing in this lesson filters anything. NAT borrows a <b>standard</b> ACL, which matches only the source address, to say <i>which inside sources get translated</i>.</p>
<ul>
<li><b>Numbered:</b> <code>access-list 10 permit 192.168.30.0 0.0.0.255</code>. Standard lists are numbered 1–99 (and 1300–1999); each line adds to the list; lines are checked top down and the first match decides.</li>
<li><b>Wildcards:</b> exactly Module 5's OSPF wildcards — 0 bit = must match, 1 bit = don't care; for a subnet, 255.255.255.255 minus the mask (/24 → <code>0.0.0.255</code>, /22 → <code>0.0.3.255</code>, /20 → <code>0.0.15.255</code>). <code>host 192.168.30.40</code> matches one address.</li>
<li><b>Implicit deny:</b> every list ends with an invisible &ldquo;deny everything else&rdquo;. For NAT, deny means <b>not translated</b>: the packet still leaves, with its private source, and its reply never returns.</li>
<li><b>Named:</b> <code>ip access-list standard NAT-STAFF</code> opens <code>(config-std-nacl)#</code>, where you type lines such as <code>permit 192.168.30.0 0.0.0.255</code>; the NAT rule then uses the name. Names say what the list is for.</li>
</ul>
${K.out(`IBD-EDGE#show access-lists 10
Standard IP access list 10
    10 permit 192.168.30.0, wildcard bits 0.0.0.255`, "Each line has a sequence number (10, 20, …). IOS XE also stores numbered lists in the running-config as ip access-list standard 10 blocks.")}
${K.mistake(`Typing the subnet mask where the wildcard belongs: <code>access-list 10 permit 192.168.40.0 255.255.255.0</code>. IOS accepts it and stores <code>permit 0.0.0.0, wildcard bits 255.255.255.0</code> — &ldquo;ignore the first three octets, the last must be 0&rdquo; — which no PC matches, so the whole LAN goes untranslated. Always read the list back with <code>show access-lists</code>.`)}
<h3>The pool and the rule</h3>
<p><code>ip nat pool &lt;name&gt; &lt;first&gt; &lt;last&gt; netmask &lt;mask&gt;</code> (or <code>prefix-length &lt;n&gt;</code>) lists the public addresses to hand out. The netmask creates no interface; IOS uses it to check that first and last are in the same block. Use addresses the ISP routes to you, never the router's own outside address or the ISP's. <code>ip nat inside source list &lt;acl&gt; pool &lt;name&gt;</code> joins them: <i>sources this list permits take an address from this pool</i>. Add <code>overload</code> and it becomes PAT — lesson 5.</p>
<h3>Worked example: the Ibadan design office</h3>
<p>IBD-EDGE's LAN is <code>192.168.30.0/24</code>; the ISP link is <code>192.0.2.16/29</code> (ISP <code>.22</code>, IBD-EDGE <code>.17</code>), and the office reserves <code>.18</code>–<code>.20</code> for browsing.</p>
${K.steps([
  ["Who", "<code>access-list 10 permit 192.168.30.0 0.0.0.255</code> — the inside <b>local</b> addresses, because NAT checks the list before it translates."],
  ["What", "<code>ip nat pool IBADAN 192.0.2.18 192.0.2.20 netmask 255.255.255.248</code> — three addresses in the 192.0.2.16/29 block."],
  ["Join", "<code>ip nat inside source list 10 pool IBADAN</code> — no <code>overload</code>: one public address per host."],
  ["Roles", "<code>ip nat inside</code> on G0/0, <code>ip nat outside</code> on G0/1."],
  ["Verify", "<code>show ip nat translations</code> stays empty until traffic flows; after two pings it is the table you read earlier."],
])}
${K.out(`IBD-EDGE#show running-config | include ip nat
 ip nat inside
 ip nat outside
ip nat pool IBADAN 192.0.2.18 192.0.2.20 netmask 255.255.255.248
ip nat inside source list 10 pool IBADAN`, "Every NAT line at once: the two roles (indented — they live under interfaces), the pool and the rule.")}
<h3>When the pool runs out</h3>
<p>A host keeps its public address while its translation lives — in real IOS a simple dynamic translation (the <code>---</code> pairing row) lasts <b>24 hours</b> (86,400 seconds) after last use by default. (The per-conversation <code>icmp</code> rows expire much sooner — 60 seconds for ICMP — but the pairing row is what holds the address.) So a pool serves only as many PCs as it has addresses: Ibadan's three-address pool serves the day's first three, and the next PC's packets are dropped, with a log message (lesson 6 decodes the format). A two-address pool at Kano, after its third PC tried:</p>
${K.out(`*Oct 12 08:30:49.959: %NAT-6-ADDR_ALLOC_FAILURE: Address allocation failed; pool 1 may be exhausted [2]
...
 pool KANO: id 1, netmask 255.255.255.248
	start 198.51.100.33 end 198.51.100.34
	type generic, total addresses 2, allocated 2 (100%), misses 4`, "From show logging, then the pool section of show ip nat statistics (lesson 5 reads the whole command): both addresses allocated, and a miss for each of the third PC's four pings that found no free address.")}
<p>The fixes: more pool addresses, a shorter timeout, or — usually — PAT. To change a pool that is in use, first <code>clear ip nat translation *</code>, which deletes every <i>dynamic</i> translation (statics stay; hosts get new entries with their next packet). IOS refuses to remove a pool that dynamic translations are still using (<code>%Pool KANO in use, cannot destroy</code>) and may refuse to change one, so clear first, then redefine.</p>
${K.when([
  ["Static NAT","An inside server must be reachable from the internet, or a device must always appear as one address (a partner allow-lists it)","The pairing exists before traffic, so it works inbound","For ordinary PCs — one public address per device"],
  ["Dynamic NAT","You have a public block and want each active host to have its own address","No sharing: every host looks distinct outside","More hosts are active than the pool holds — the extras are dropped"],
  ["PAT (lesson 5)","Ordinary offices, homes and branches","Thousands of hosts share one address","Outsiders must start conversations to the host"],
], "Static, dynamic or PAT")}
${K.q({type:"fill", q:"Write the three global configuration commands that let 10.12.0.0/22 borrow 198.51.100.65 to 198.51.100.70 (block 198.51.100.64/29) with dynamic NAT. Use access list 15 and pool BRANCH.", fields:[
  {label:"The access list", a:["access-list 15 permit 10.12.0.0 0.0.3.255"], ios:true},
  {label:"The pool", a:["ip nat pool BRANCH 198.51.100.65 198.51.100.70 netmask 255.255.255.248","ip nat pool BRANCH 198.51.100.65 198.51.100.70 prefix-length 29"], ios:true},
  {label:"The rule", a:["ip nat inside source list 15 pool BRANCH"], ios:true}],
  why:"A /22 mask is 255.255.252.0, so the wildcard is 0.0.3.255 (10.12.0.x to 10.12.3.x). The pool names first, last and the block's mask (or prefix-length 29). The rule joins list 15 to pool BRANCH; without overload it is one address per host."})}
${K.check({q:"A dynamic NAT rule uses ACL 10, permit 192.168.30.0 0.0.0.255. A PC in 192.168.31.0/24 behind the same router pings the internet. What happens?", o:["The ACL drops it at the edge router","It leaves untranslated, with its private source, and the reply never comes back","It is translated with the next free pool address anyway","It is translated to the outside interface address"], a:1, why:"A NAT ACL decides translation, not forwarding. No permit line matches, so the implicit deny means 'don't translate'; the packet is routed out unchanged and its reply is dropped by the ISP."})}
<h3>Hands-on: the Kano clinic where the third PC never gets out</h3>
<p>KAN-EDGE joins a Kano clinic LAN (<code>10.40.1.0/24</code>) to the ISP over <code>203.0.113.8/30</code>. The ISP routes <code>198.51.100.32/29</code> to the clinic; the owner has approved <code>.33</code>–<code>.34</code> for browsing. PCs must reach the regional health portal, <code>192.0.2.80</code>. There's no NAT yet.</p>
${K.bench({id:"m7-nat-dynamic-pool", points:110, from:"CCNA · Module 7 · lesson 4", title:"Kano clinic: dynamic NAT from a two-address pool — and the morning it ran out", viewBox:"0 0 900 440", openLog:true,
  intro:"LAPTOP-KANO is on KAN-EDGE's console (9600 8N1, no flow control). Build sheet: RECEPTION 10.40.1.21, LAB 10.40.1.22, PHARMACY 10.40.1.23 (gateway 10.40.1.1). KAN-EDGE G0/1 203.0.113.10/30, ISP 203.0.113.9. Block routed to the clinic: 198.51.100.32/29. PORTAL 192.0.2.80.",
  devices:[
    {id:"lap", kind:"laptop", label:"LAPTOP-KANO", x:20, y:20},
    {id:"edge", kind:"router", label:"KAN-EDGE", model:"ISR 1100 · Kano clinic", x:300, y:120,
      config:e=>{ ["en","conf t","hostname KAN-EDGE","no ip domain-lookup","interface g0/0","description CLINIC LAN","ip address 10.40.1.1 255.255.255.0","no shutdown","interface g0/1","description ISP","ip address 203.0.113.10 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.9","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"isp", kind:"router", label:"ISP", model:"ISP access router", x:600, y:120,
      config:e=>{ ["en","conf t","hostname ISP","no ip domain-lookup","interface g0/1","ip address 203.0.113.9 255.255.255.252","no shutdown","interface g0/0","ip address 192.0.2.1 255.255.255.0","no shutdown","exit","ip route 198.51.100.32 255.255.255.248 203.0.113.10","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"SW-CLINIC", x:300, y:230},
    {id:"r1", kind:"pc", label:"RECEPTION", x:150, y:330, ip:"10.40.1.21", mask:"255.255.255.0", gw:"10.40.1.1"},
    {id:"lab", kind:"pc", label:"LAB", x:300, y:330, ip:"10.40.1.22", mask:"255.255.255.0", gw:"10.40.1.1"},
    {id:"ph", kind:"pc", label:"PHARMACY", x:450, y:330, ip:"10.40.1.23", mask:"255.255.255.0", gw:"10.40.1.1"},
    {id:"portal", kind:"server", label:"PORTAL", x:760, y:280, ip:"192.0.2.80", mask:"255.255.255.0", gw:"192.0.2.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"edge:con"}, {type:"cat6", a:"edge:g0", b:"sw:g1"}, {type:"cat6", a:"r1:eth", b:"sw:g2"}, {type:"cat6", a:"lab:eth", b:"sw:g3"}, {type:"cat6", a:"ph:eth", b:"sw:g4"},
           {type:"cat6", a:"edge:g1", b:"isp:g1"}, {type:"cat6", a:"portal:eth", b:"isp:g0"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Before NAT: from RECEPTION, <code>ping 192.0.2.80</code>. It times out — find where the frame log says the reply died", done:B=>Bench.tried(B,"r1",/^\s*ping\s+192\.0\.2\.80\s*$/i)},
    {text:"Console into KAN-EDGE, <code>enable</code>, <code>configure terminal</code>: standard access list 1 permitting the clinic LAN (address and wildcard)", done:B=>{ const e = B.devs.edge.env, A = window.ACL; return !!(e.acl && e.acl.lists["1"]) && ["10.40.1.21","10.40.1.22","10.40.1.23"].every(ip=>A.check(e.acl,"1",{src:ip},false).permit) && !A.check(e.acl,"1",{src:"10.40.2.5"},false).permit; }},
    {text:"Pool <code>CLINIC</code>: 198.51.100.33 to 198.51.100.34, netmask 255.255.255.248", done:B=>{ const p = B.devs.edge.env.nat && B.devs.edge.env.nat.pools.CLINIC, n = x=>x.split(".").reduce((a,o)=>a*256+(+o),0); return !!p && p.start===n("198.51.100.33") && p.end>=n("198.51.100.34") && p.len===29; }},
    {text:"Join list 1 to pool CLINIC (no <code>overload</code>), and give G0/0 and G0/1 their NAT roles", done:B=>{ const e = B.devs.edge.env; return !!e.nat && e.nat.rules.some(r=>r.acl==="1" && r.pool==="CLINIC" && !r.overload) && !!e.intfs["GigabitEthernet0/0"].natIn && !!e.intfs["GigabitEthernet0/1"].natOut; }},
    {text:"From RECEPTION, then LAB, <code>ping 192.0.2.80</code>: replies from both", done:B=>Bench.pinged(B,"r1","192.0.2.80") && Bench.pinged(B,"lab","192.0.2.80")},
    {text:"On KAN-EDGE, <code>show ip nat translations</code>: which public address did each PC get?", done:B=>B.devs.edge.env.log.some(l=>/---\s+198\.51\.100\.33\s+10\.40\.1\.2[12]/.test(l.out||"") && /---\s+198\.51\.100\.34\s+10\.40\.1\.2[12]/.test(l.out||""))},
    {text:"The ticket: &ldquo;Pharmacy can't open the portal.&rdquo; From PHARMACY, <code>ping 192.0.2.80</code>; read the frame log's NAT line, then <code>show logging</code> on KAN-EDGE", done:B=>Bench.tried(B,"ph",/^\s*ping\s+192\.0\.2\.80\s*$/i) && B.devs.edge.env.log.some(l=>/ADDR_ALLOC_FAILURE/.test(l.out||""))},
    {text:"The owner approves .35 to .38 too. <code>clear ip nat translation *</code>, then redefine pool CLINIC as 198.51.100.33 to 198.51.100.38, same netmask", done:B=>{ const p = B.devs.edge.env.nat && B.devs.edge.env.nat.pools.CLINIC; return !!p && p.end - p.start===5; }},
    {text:"From PHARMACY, then RECEPTION, <code>ping 192.0.2.80</code>; then <code>show ip nat translations</code> — each PC has its own public address", done:B=>Bench.pinged(B,"ph","192.0.2.80") && B.devs.edge.env.log.some(l=>/---\s+198\.51\.100\.3\d\s+10\.40\.1\.23/.test(l.out||"") && /---\s+198\.51\.100\.3\d\s+10\.40\.1\.21/.test(l.out||""))},
    {text:"Save KAN-EDGE's configuration (<code>write memory</code>)", done:B=>B.devs.edge.env.savedOnce},
  ],
  win:"You built dynamic NAT from its three parts — an ACL naming the inside local sources, a pool the ISP routes to you, and the rule joining them — watched each PC take its own address, saw the third dropped with %NAT-6-ADDR_ALLOC_FAILURE, and fixed it by clearing and widening the pool. Lesson 5 solves the same problem without more addresses.",
  solve:[["pc","r1","ping 192.0.2.80"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],
    ["term","access-list 1 permit 10.40.1.0 0.0.0.255"],["term","ip nat pool CLINIC 198.51.100.33 198.51.100.34 netmask 255.255.255.248"],["term","ip nat inside source list 1 pool CLINIC"],
    ["term","interface g0/0"],["term","ip nat inside"],["term","interface g0/1"],["term","ip nat outside"],["term","end"],
    ["pc","r1","ping 192.0.2.80"],["pc","lab","ping 192.0.2.80"],["term","show ip nat translations"],
    ["pc","ph","ping 192.0.2.80"],["term","show logging"],
    ["term","clear ip nat translation *"],["term","configure terminal"],["term","ip nat pool CLINIC 198.51.100.33 198.51.100.38 netmask 255.255.255.248"],["term","end"],
    ["pc","ph","ping 192.0.2.80"],["pc","r1","ping 192.0.2.80"],["term","show ip nat translations"],["term","write memory"]]})}
${K.hint(`Task 1: follow the reply, not the request. Lab note: translations never time out in this lab, so the morning's first two PCs never give their addresses back.`)}
${K.reveal("Walkthrough — what the evidence said",`<p>Before NAT the reply died at the ISP (<i>no route to 10.40.1.21</i>). Then RECEPTION took <code>.33</code> and LAB <code>.34</code>; the ISP's route for <code>198.51.100.32/29</code> brought replies to KAN-EDGE, which translated them before routing. PHARMACY matched ACL 1 but found the pool empty: <i>the NAT pool has no free address — the packet is dropped</i>, and <code>%NAT-6-ADDR_ALLOC_FAILURE</code>. Note what KAN-EDGE never needed: a route or an interface for 198.51.100.32/29.</p>`)}
<h3>Same logic, new situation</h3>
<p>An Enugu office has a four-address pool and an ACL permitting <code>10.5.0.0 0.0.0.255</code>. At 08:00, six PCs in <code>10.5.0.0/24</code> and then a printer at <code>10.5.1.9</code> try to reach the internet. Who gets out?</p>
${K.hint(`Two checks for each device: does the list permit it, and is there a free address?`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> which of seven devices are translated. <b>2. Rules:</b> no ACL match = untranslated; ACL match + empty pool = dropped. <b>3. Apply it:</b> PCs 1–4 take the four addresses. PCs 5–6 match but find the pool empty: dropped, with <code>%NAT-6-ADDR_ALLOC_FAILURE</code>. The printer isn't in <code>10.5.0.0 0.0.0.255</code>, so it leaves untranslated and its replies die at the ISP — a different failure with the same symptom. Two fixes: more addresses (or PAT) for the PCs, and an ACL line for <code>10.5.1.0 0.0.0.255</code>.</p>`)}

<h2>Order of operations: route, translate — translate, route</h2>
${K.remember(`<b>The order:</b> <b>inside → outside</b>: <b>route first, then translate</b> the source. <b>Outside → inside</b>: <b>translate the destination first, then route</b>. Hook: <i>NAT sits on the outside edge of the router</i> — a packet meets it last when leaving and first when arriving.`)}
${K.svg("0 0 760 290",
  K.txt(20,24,"Inside → outside (a PC's request)",{c:"fg",s:12.5,b:true,f:"body"})+
  K.box(20,38,165,56,"1 · Arrives inside","on G0/0 (ip nat inside)")+K.box(210,38,165,56,"2 · Route lookup","finds the exit: G0/1")+K.box(400,38,165,56,"3 · NAT","source: local → global",true)+K.box(590,38,150,56,"4 · Leaves G0/1","with a public source")+
  K.arrow(185,66,208,66)+K.arrow(375,66,398,66)+K.arrow(565,66,588,66)+
  K.txt(20,140,"Outside → inside (the reply, or a visitor to a static server)",{c:"fg",s:12.5,b:true,f:"body"})+
  K.box(20,154,165,56,"1 · Arrives outside","on G0/1 (ip nat outside)")+K.box(210,154,165,56,"2 · NAT","destination: global → local",true)+K.box(400,154,165,56,"3 · Route lookup","on the inside local address")+K.box(590,154,150,56,"4 · Leaves G0/0","to the inside host")+
  K.arrow(185,182,208,182)+K.arrow(375,182,398,182)+K.arrow(565,182,588,182)+
  K.txt(380,248,"So the NAT ACL is checked against inside LOCAL sources, and the router routes inbound traffic on private addresses —",{c:"muted",s:11,mid:true,f:"body"})+
  K.txt(380,268,"it needs no route of its own for its public NAT addresses. The ISP is the one that must route them to you.",{c:"muted",s:11,mid:true,f:"body"}),
  "Cisco IOS order of operations for inside source NAT: translation is the last step on the way out and the first on the way in.")}
<p>These two lines explain three facts you'd otherwise memorise:</p>
<ol>
<li><b>The NAT ACL lists inside local addresses.</b> When it is checked, the source hasn't been rewritten. A list of the public pool addresses matches nothing.</li>
<li><b>The router needs no route for its NAT addresses.</b> A reply to <code>198.51.100.33</code> becomes <code>10.40.1.21</code> on arrival and is routed as a connected address.</li>
<li><b>The ISP must deliver the public addresses.</b> Either they're on the shared link's subnet (IOS answers ARP, as at Lagos and Abuja) or the ISP routes the block to your outside address (Kano). If neither, replies never arrive — the classic &ldquo;NAT is configured but nothing comes back&rdquo; ticket.</li>
</ol>
<p>The lab's frame log shows the order (lab output, not IOS):</p>
${K.out(`KAN-EDGE received it on Gi0/0, decrements TTL to 127 and routes it
NAT on KAN-EDGE (Gi0/0 inside → Gi0/1 outside): source 10.40.1.21:1 → 198.51.100.33:1 (inside local → inside global)
  ...
NAT on KAN-EDGE (arriving on outside Gi0/1): destination 198.51.100.33:1 → 10.40.1.21:1 (inside global → inside local)
KAN-EDGE received it on Gi0/1, decrements TTL to 126 and routes it`, "One ping through dynamic NAT. Request: route, then translate. Reply: translate, then route.")}
${K.q({type:"order", q:"A reply from the internet arrives at an edge router for an inside PC using dynamic NAT. Put the router's steps in order.", items:["The packet arrives on the interface marked ip nat outside","NAT finds the translation for the destination (the inside global address)","The destination is rewritten to the PC's inside local address","The router looks up the inside local address in its routing table","The packet is forwarded out of the ip nat inside interface towards the PC"], why:"Outside to inside, NAT comes first: the router matches the destination in its table and rewrites it to the inside local address, and only then routes — on the private address, which it knows. That's why it needs no route for its public NAT addresses."})}
${K.check({q:"An engineer writes the NAT ACL as access-list 1 permit 198.51.100.32 0.0.0.7 (the pool's block) instead of the LAN. What happens?", o:["NAT works, because the ACL and pool agree","Nothing is translated: the ACL is checked against the private inside local sources, which never match","Only the first pool address is used","The router translates pool addresses back into the LAN"], a:1, why:"Inside to outside, the router checks the NAT ACL before translating, against the original private source. No PC has a source in 198.51.100.32/29, so everything leaves untranslated."})}
${K.dodont([
  "Write the NAT ACL with the inside local subnets, and read it back with show access-lists.",
  "Ask the ISP how your public addresses reach you: on the link subnet, or a routed block.",
  "Test static NAT from a host that is really outside, and outbound from the inside host itself.",
  "Describe interfaces (which side is inside) and name or remark the NAT list.",
],[
  "Don't use permit any in a NAT ACL — it translates traffic you never meant to (Cisco advises against it).",
  "Don't put the router's or the ISP's own address inside a dynamic pool.",
  "Don't treat static NAT as security: once mapped, the server is reachable by everyone unless something filters it.",
  "Don't forget the default route: NAT traffic still needs a path to the ISP.",
])}
<h3>Same logic, new situation</h3>
<p>A Kaduna branch's ISP assigns a routed block, <code>203.0.113.64/29</code>, for servers but forgets to add the route for it. The branch's static (<code>10.66.5.10</code> ↔ <code>203.0.113.66</code>) and roles are correct. Outside users time out. Does the <i>branch</i> router need a route to 203.0.113.64/29?</p>
${K.hint(`Where does an inbound packet for 203.0.113.66 get stuck — before or after it reaches the branch router?`)}
${K.reveal("Show the reasoning",`<p><b>1. Asked:</b> where the missing route belongs. <b>2. Rule:</b> outside → inside, the branch translates first and routes on the inside local; the ISP must deliver the inside global. <b>3. Apply it:</b> packets for <code>203.0.113.66</code> never reach the branch — the ISP has no route, and the address isn't on the link subnet, so no ARP alias helps. The branch needs nothing; the ISP needs <code>ip route 203.0.113.64 255.255.255.248 &lt;branch outside address&gt;</code>. Your evidence: <code>show ip nat translations</code> shows the static but no flow entries from outside users — nothing is arriving.</p>`)}

<h2>Verifying NAT at work</h2>
<p>Five questions, each with a command (lesson 5 adds the full method):</p>
${K.steps([
  ["Roles in place?", "<code>show running-config | include ip nat</code> (roles appear indented) or the first lines of <code>show ip nat statistics</code> (<i>Outside interfaces</i>, <i>Inside interfaces</i>)."],
  ["Mapping or rule there?", "The same include shows the statics, pool and rule; <code>show ip nat translations</code> lists statics even with no traffic."],
  ["Does the list match?", "<code>show access-lists</code>: does each address + wildcard cover the inside <b>local</b> subnets?"],
  ["Is traffic translated?", "Generate traffic from the real host, then <code>show ip nat translations</code>: no entry for its inside local means it never matched — or never arrived."],
  ["Pool exhausted?", "<code>show logging</code> for <code>%NAT-6-ADDR_ALLOC_FAILURE</code>, and the pool section of <code>show ip nat statistics</code>."],
])}
${K.job("“Accounts can't open the bank portal — reception can”",`
<p><b>The ticket.</b> &ldquo;Since IT added the Accounts VLAN on Monday, nobody in Accounts can open the bank's payment portal. Reception is fine. Payroll runs tomorrow.&rdquo; Site: the Ibadan office; IBD-EDGE has dynamic NAT and a new inside interface, G0/2, for Accounts (<code>192.168.40.0/24</code>).</p>
<p><b>Questions first.</b> Internal servers work (so DHCP, gateway and routing are fine) but every internet site fails: an internet-only failure for one subnet is a translation question.</p>
<p><b>Checks.</b> From Accounts PC <code>192.168.40.15</code>, <code>ping 198.51.100.10</code> times out; Reception's replies. On IBD-EDGE:</p>
${K.out(`IBD-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 192.0.2.18:1          192.168.30.21:1       198.51.100.10:1       198.51.100.10:1
---  192.0.2.18            192.168.30.21         ---                   ---
Total number of translations: 2

IBD-EDGE#show access-lists 10
Standard IP access list 10
    10 permit 192.168.30.0, wildcard bits 0.0.0.255
    20 permit 0.0.0.0, wildcard bits 255.255.255.0`, "Reception has a translation; Accounts has none. Line 20 is the giveaway.")}
<p><b>Reasoning.</b> No entry for <code>192.168.40.15</code>: it never matched the list. G0/2 has <code>ip nat inside</code> and the pool has free addresses. Line 20 is the fault — someone typed <code>access-list 10 permit 192.168.40.0 255.255.255.0</code>, a mask where the wildcard belongs.</p>
<p><b>The fix.</b> With approval, edit only that line by sequence number: <code>configure terminal</code>, <code>ip access-list standard 10</code>, <code>no 20</code>, <code>20 permit 192.168.40.0 0.0.0.255</code>, <code>end</code>. (<code>no access-list 10</code> would delete the whole list and cut Reception off too.) <code>show access-lists 10</code> now shows <code>20 permit 192.168.40.0, wildcard bits 0.0.0.255</code>, and after a new ping <code>show ip nat translations</code> lists <code>192.0.2.19</code> ↔ <code>192.168.40.15</code>. <code>write memory</code>. One more check: the pool <code>.18</code>–<code>.20</code> has three addresses for nine people at once — it will run out on payroll morning.</p>
<p><b>What you say.</b> &ldquo;A typo in the rule that lets Accounts' addresses be translated meant their traffic left the building with an internal address nothing outside can answer. It's fixed and the portal opens. One risk for tomorrow: three public addresses for nine people. I'd like to switch the office to address sharing (PAT) this evening.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;IBD-EDGE NAT ACL 10 line 20 was permit 192.168.40.0 255.255.255.0 (mask, stored as 0.0.0.0 wildcard 255.255.255.0) — Accounts went out untranslated. Replaced line 20 with permit 192.168.40.0 0.0.0.255; verified 192.168.40.15 → 192.0.2.19, portal OK; saved 16:40. Risk: pool <code>IBADAN</code> 3 addresses / 9 concurrent users — change request raised for PAT. 25 min.&rdquo;</i></p>`)}
${K.tip(`Edit numbered lists line by line through <code>ip access-list standard &lt;number&gt;</code> and sequence numbers. Deleting and retyping a whole list causes outages: while it's gone, the NAT rule matches nothing.`)}
${K.case("The law firm that outgrew its address pool",`
<p>A Victoria Island law firm moved into a new building with a block of 16 public addresses. The installer used two statics for the mail and web servers and a dynamic pool of the remaining usable addresses for 45 staff, &ldquo;because only a dozen browse at once&rdquo;.</p>
<p><b>What went wrong.</b> It worked until the firm moved to cloud documents and every laptop and phone synced all day. Each always-active device held a pool address, so by 09:15 the pool was empty and late arrivals got nothing but <code>%NAT-6-ADDR_ALLOC_FAILURE</code> in the logs; clearing translations at lunch just moved the problem to the afternoon.</p>
<p><b>The options.</b> A bigger block (costly), a shorter timeout (sync keeps translations alive anyway), or PAT for staff with the statics kept.</p>
<p><b>The decision.</b> PAT, on a Saturday. The statics were untouched, so mail and web kept the addresses partners had allow-listed. Monday's late arrivals noticed nothing.</p>
<p><b>Lessons.</b> One address per active host suits few, briefly active hosts — not always-talking devices. Statics keep their job for servers, alongside PAT: lesson 5.</p>`)}
${K.dyk(`NAT's first specification, RFC 1631 (May 1994), offered address reuse as &ldquo;another short-term solution&rdquo; to IPv4 address depletion, to buy time until longer-term protocols with bigger addresses were ready; RFC 3022 replaced it in 2001. Three decades later it runs on almost every IPv4 edge, and the long-term fix — IPv6 (Module 6) — runs alongside it rather than having replaced it.`)}
${K.check({q:"A static NAT server is reachable from the internet, but a new dynamic rule for staff translates nobody: show ip nat translations shows only the static after staff traffic. What do you check first?", o:["The default route","The NAT ACL: does it permit the staff's inside local subnet?","The ISP's route to the static address","Whether ip nat inside is on the outside interface"], a:1, why:"The working static proves the interface roles and the ISP path are fine. A dynamic rule that creates no entries while traffic flows almost always means the sources don't match its ACL (wrong subnet, mask instead of wildcard, or the rule names another list)."})}

<h2>Interview corner</h2>
${K.hint(`Define the two words separately, then give one example with all four addresses.`)}
${K.reveal("“Explain inside local, inside global, outside local and outside global.”",`<p>"Inside/outside is where a host lives; local/global is which side we're looking from. An office PC at 192.168.30.21 is the inside local; the public address it's translated to, say 192.0.2.18, is its inside global. The web server it talks to, 198.51.100.10, is the outside global, and as the PC sees it the outside local — the same address, because inside source NAT only translates our hosts. In show ip nat translations the columns run inside global, inside local, outside local, outside global, so I label them before reading."</p>`)}
${K.hint(`Static mapping, interface roles, how the ISP delivers the address, and testing from outside.`)}
${K.reveal("“Our web server is behind NAT and customers can't reach it. What do you check?”",`<p>"The server needs a static NAT entry, because dynamic NAT and PAT only create translations when an inside host starts the conversation. I'd check show ip nat translations — the static should be listed with no traffic, and its inside local must match the server's current address. Then the roles: ip nat inside towards the server, ip nat outside towards the ISP. Then delivery: is the public address on the ISP link's subnet, so the router answers ARP, or a routed block the ISP must route to us? I'd test from a genuinely outside host and watch for a new flow entry — none means nothing is arriving, which points at the ISP."</p>`)}
${K.hint(`One-to-one, pool, many-to-one — and a real use for each.`)}
${K.reveal("“Static NAT, dynamic NAT and PAT — what's the difference, and when do you use each?”",`<p>"Static NAT is a permanent one-to-one pairing that works both ways — for servers the internet must reach, or a device that must always appear as one address. Dynamic NAT gives inside hosts addresses from a pool, selected by a standard ACL, one per active host; when the pool's empty the next host is dropped, so it only fits when there are enough public addresses. PAT, or overload, lets many hosts share one address by tracking ports — what almost every office uses for browsing."</p>`)}

${K.recap([
  "RFC 1918 addresses (10/8, 172.16/12, 192.168/16) aren't routed on the internet: a private source can send, but the reply can't return. NAT rewrites it to a public address at the edge.",
  "Inside/outside = where the host lives; local/global = the side you see it from. Inside local = the host's own address; inside global = its public face; outside local = outside global in inside source NAT.",
  "show ip nat translations columns: inside global, inside local, outside local, outside global — label before you read.",
  "Static NAT: ip nat inside source static LOCAL GLOBAL — permanent, one-to-one, works inbound and outbound; how the internet reaches an inside server.",
  "Dynamic NAT: a standard ACL of inside local subnets (wildcards), ip nat pool, ip nat inside source list N pool NAME. One address per active host; an empty pool drops the next host (%NAT-6-ADDR_ALLOC_FAILURE).",
  "Every NAT needs ip nat inside and ip nat outside. A NAT ACL deny means 'not translated', not 'dropped'; ACL filtering is Module 8.",
  "Inside → outside: route, then translate. Outside → inside: translate, then route. So the ACL matches private sources, the router needs no route for its NAT addresses, and the ISP must deliver them.",
])}
${K.next(`<b>Lesson 5 — PAT and NAT troubleshooting.</b> The Kano clinic ran out of addresses; PAT (NAT overload) lets the whole clinic share one public address by port number. You'll read ports in the translation table, use show ip nat statistics and clear ip nat translation properly, forward ports to inside servers, and fix the classic faults — inside and outside swapped, an ACL that doesn't match, a missing ip nat outside, an exhausted pool and a missing return route.`)}
`,
quiz:[
  {lvl:1, q:"Which of these addresses is a private (RFC 1918) address?", o:["172.32.10.5","172.20.10.5","192.169.1.5","11.0.0.5"], a:1, why:"RFC 1918 reserves 10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16. 172.20.10.5 is inside 172.16.0.0/12. 172.32.x is just past the /12, 192.169.x is just past 192.168/16, and 11.x is public."},
  {lvl:1, type:"match", q:"Match each NAT term with its meaning.", pairs:[["Inside local","An inside host's address as seen on the inside network"],["Inside global","An inside host's address as seen from the outside"],["Outside local","An outside host's address as seen from the inside"],["Outside global","An outside host's address as seen on the outside"]], why:"Inside/outside says where the host lives; local/global says which side you're looking from. In inside source NAT only inside addresses are changed, so outside local and outside global are normally the same address."},
  {lvl:2, q:"Based on the exhibit, what is the inside global address of the host 10.20.1.15?", ex:"BR-EDGE#show ip nat translations\nPro  Inside global         Inside local          Outside local         Outside global\nicmp 198.51.100.21:1       10.20.1.14:1          203.0.113.50:1        203.0.113.50:1\nicmp 198.51.100.22:1       10.20.1.15:1          203.0.113.50:1        203.0.113.50:1\n---  198.51.100.21         10.20.1.14            ---                   ---\n---  198.51.100.22         10.20.1.15            ---                   ---\nTotal number of translations: 4", o:["10.20.1.15","198.51.100.21","198.51.100.22","203.0.113.50"], a:2, why:"The columns run inside global, inside local, outside local, outside global. The row with inside local 10.20.1.15 has inside global 198.51.100.22. 198.51.100.21 belongs to 10.20.1.14, and 203.0.113.50 is the outside host (outside local and outside global)."},
  {lvl:2, type:"fill", q:"Write the global configuration command that permanently maps inside server 10.1.1.10 to public address 198.51.100.10.", fields:[{label:"Command", a:["ip nat inside source static 10.1.1.10 198.51.100.10"], ios:true}], why:"ip nat inside source static <inside local> <inside global>. The inside local (the server's own address) comes first, then the public address. It also needs ip nat inside and ip nat outside on the right interfaces."},
  {lvl:2, type:"multi", q:"An edge router must translate staff in 10.30.0.0/24 with dynamic NAT from a pool. Which three are required? (Choose three.)", o:["A standard ACL that permits 10.30.0.0 0.0.0.255","ip nat inside on the LAN-facing interface and ip nat outside on the ISP-facing interface","ip nat inside source list <acl> pool <name> together with the ip nat pool","A static route on the edge router for the pool's public addresses","ip nat inside source static for each staff PC","The keyword overload on the end of the rule"], a:[0,1,2], why:"Dynamic NAT needs the who (ACL with the inside local subnet), the roles (inside/outside interfaces) and the what plus the join (pool and rule). The edge router needs no route for its own pool, because inbound packets are translated before routing; statics are for servers; overload turns it into PAT."},
  {lvl:2, type:"order", q:"An inside PC sends a packet to an internet server through a router running dynamic NAT. Put the router's steps in order.", items:["The packet arrives on the ip nat inside interface","The router looks up the destination in its routing table and picks the outside interface","NAT checks the source against the ACL and takes an address from the pool","The source is rewritten from inside local to inside global","The packet leaves the ip nat outside interface"], why:"Inside to outside, IOS routes first and translates last: the routing decision is made, then NAT (ACL check against the original private source, pool allocation, rewrite), then the packet leaves. Coming back it's the reverse: translate first, then route."},
  {lvl:1, q:"A NAT access list does not permit a PC's source address. What does the router do with that PC's internet-bound packets?", o:["Drops them and sends an ICMP error to the PC","Forwards them untranslated, with the private source address","Translates them with the router's outside interface address","Holds them until a pool address is free"], a:1, why:"For NAT, the ACL only decides what gets translated. Unmatched packets are routed out unchanged; with a private source, their replies are dropped on the internet. Filtering traffic with ACLs is Module 8."},
  {lvl:2, q:"A NAT access list must match the inside subnet 172.16.32.0/20. Which line is correct?", o:["access-list 5 permit 172.16.32.0 255.255.240.0","access-list 5 permit 172.16.32.0 0.0.15.255","access-list 5 permit 172.16.32.0 0.0.31.255","access-list 5 permit 172.16.0.0 0.0.15.255"], a:1, why:"A /20 mask is 255.255.240.0, so the wildcard is 255.255.255.255 minus that = 0.0.15.255, covering 172.16.32.0 to 172.16.47.255. The first option uses the mask itself (IOS would store a different, useless pattern); 0.0.31.255 is a /19; the last starts at the wrong subnet."},
  {lvl:3, q:"Since a change on Monday, PCs in 192.168.40.0/24 can't reach the internet, while 192.168.30.0/24 can. Both LAN interfaces have ip nat inside and the pool has free addresses. Based on the exhibit, what is the cause?", ex:"EDGE#show access-lists 10\nStandard IP access list 10\n    10 permit 192.168.30.0, wildcard bits 0.0.0.255\n    20 permit 0.0.0.0, wildcard bits 255.255.255.0\nEDGE#show running-config | include ip nat inside source\nip nat inside source list 10 pool OFFICE", o:["Line 20 was entered with a subnet mask instead of a wildcard, so it matches only addresses ending in .0 and the 192.168.40.0/24 PCs go out untranslated","The pool is too small for two LANs","Line 10 hides line 20, because the first match wins","Standard ACLs can only have one line when used for NAT"], a:0, why:"access-list 10 permit 192.168.40.0 255.255.255.0 is stored as 0.0.0.0 with wildcard 255.255.255.0: the last octet must be 0, the rest is ignored — no PC matches. Fix line 20 by sequence number (no 20, then 20 permit 192.168.40.0 0.0.0.255). Line 10 can't hide it: a 192.168.40.x source doesn't match line 10."},
  {lvl:2, q:"A dynamic NAT pool has three addresses, and three inside PCs already hold translations. A fourth PC, permitted by the ACL, pings the internet. What happens?", o:["It shares the third PC's public address","Its packets are dropped and the router logs %NAT-6-ADDR_ALLOC_FAILURE","It is translated to the outside interface address","Its packets go out untranslated"], a:1, why:"Dynamic NAT without overload is one public address per host. With the pool empty, the packet matches the rule but can't be translated, so it is dropped and IOS logs an allocation failure. Sharing an address is PAT; going out untranslated happens only when the ACL doesn't match."},
  {lvl:3, q:"Outside users can't reach a web server behind static NAT. Based on the exhibit, what is wrong?", ex:"EDGE#show running-config | include ip nat|interface\ninterface GigabitEthernet0/0\n ip nat inside\ninterface GigabitEthernet0/1\n ip nat inside\ninterface GigabitEthernet0/2\nip nat inside source static 10.10.10.80 198.51.100.80\n\nG0/0 = server LAN, G0/1 = ISP link, G0/2 = unused", o:["The static is written backwards: the public address must come first","G0/1, the ISP link, is marked ip nat inside; it must be ip nat outside, or nothing is translated between inside and outside","The router needs a route for 198.51.100.80","A static mapping needs an ACL to select the server"], a:1, why:"Translation happens only between an inside and an outside interface. Both used interfaces are marked inside, so packets from the ISP to 198.51.100.80 aren't translated. The static's order (local first, then global) is correct; the router never needs a route to its own inside global; statics don't use an ACL."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command lists the current NAT translations, static and dynamic?", fields:[{label:"Command", a:["show ip nat translations"], ios:true}], why:"show ip nat translations (sh ip nat tr) prints the translation table: Pro, Inside global, Inside local, Outside local, Outside global, and the total. Static entries appear even with no traffic; dynamic ones appear when traffic creates them."},
  {lvl:2, q:"With ordinary inside source NAT, which statement about outside local and outside global addresses is true?", o:["Outside local is always a private address","They are normally the same address, because only inside hosts' addresses are translated","Outside global is the router's outside interface address","Outside local is the inside host's public address"], a:1, why:"Inside source NAT rewrites only the inside host's address. The outside host's address crosses the router unchanged, so it's the same seen from the inside (outside local) and on the internet (outside global). They differ only when outside addresses are translated too, which is beyond the CCNA."},
  {lvl:3, q:"A Lagos branch has one routed /29 from its ISP (six usable public addresses), three servers that customers must reach, and 60 staff who browse. Which design fits?", o:["Dynamic NAT for everyone, servers included, from a pool of six addresses","Static NAT for the three servers, and PAT (overload) for the 60 staff on one of the remaining addresses or the outside interface","Static NAT for all 63 devices","PAT for the servers and dynamic NAT for staff"], a:1, why:"Servers that the outside must reach need fixed, permanent mappings: static NAT. Sixty staff can't each have one of six addresses at once, so dynamic NAT would run out; PAT lets them share one address (lesson 5). PAT alone doesn't let outsiders start connections to the servers without port forwarding, and 63 statics need 63 addresses."},
  {lvl:2, type:"fill", q:"Write the command that creates a NAT pool named BR-POOL with addresses 198.51.100.65 to 198.51.100.70, which belong to the block 198.51.100.64/29.", fields:[{label:"Command", a:["ip nat pool BR-POOL 198.51.100.65 198.51.100.70 netmask 255.255.255.248","ip nat pool BR-POOL 198.51.100.65 198.51.100.70 prefix-length 29"], ios:true}], why:"ip nat pool <name> <first> <last> netmask <mask> — /29 is 255.255.255.248, or use prefix-length 29. IOS checks that the first and last addresses are in the same block; the netmask doesn't create an interface anywhere."},
  {lvl:3, q:"A static NAT maps 10.66.5.10 to 203.0.113.66, from a routed block the ISP assigned (not the link subnet). The roles and mapping are correct, show ip nat translations shows only the static line, and outside users time out. What is the most likely cause?", o:["The edge router needs ip route 203.0.113.64 255.255.255.248 Null0 to own the block","The ISP has no route for 203.0.113.64/29 pointing at the branch's outside address, so the packets never arrive","The NAT ACL doesn't permit 10.66.5.10","The edge router is routing before translating inbound packets"], a:1, why:"No flow entries from outside users means nothing is arriving. Outside to inside, the edge router translates first and routes on 10.66.5.10, so it needs no route for the block; static NAT doesn't use an ACL. With the address outside the link subnet, only an ISP route can deliver it."},
],
cards:[
  {f:"Why NAT exists", b:"RFC 1918 private addresses aren't unique, so the internet doesn't route them. A private source can send, but replies can't come back. NAT rewrites it to a public address at the edge; also stretches scarce public IPv4."},
  {f:"RFC 1918 ranges", b:"10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 – 172.31.255.255), 192.168.0.0/16."},
  {f:"Inside local vs inside global", b:"Inside local = the inside host's own (usually private) address, as seen inside. Inside global = the public address it appears as on the outside."},
  {f:"Outside local vs outside global", b:"An outside host's address as seen from the inside (local) and on the outside (global). Same address in normal inside source NAT."},
  {f:"show ip nat translations — column order", b:"Pro · Inside global · Inside local · Outside local · Outside global. Inside GLOBAL comes first. --- rows are address pairings; icmp/tcp/udp rows are flows."},
  {f:"Static NAT", b:"ip nat inside source static LOCAL GLOBAL. Permanent and one-to-one; works inbound and outbound; in the table with no traffic. Used for servers the internet must reach."},
  {f:"Interface roles", b:"ip nat inside on LAN-facing interfaces, ip nat outside on the ISP-facing one. NAT only translates packets crossing between an inside and an outside interface."},
  {f:"Dynamic NAT — three parts", b:"access-list N permit <inside local subnet> <wildcard> (who) · ip nat pool NAME first last netmask M (what) · ip nat inside source list N pool NAME (join). No overload = one public address per host."},
  {f:"A NAT ACL's deny", b:"Means 'not translated', not 'dropped'. The packet leaves with its private source and the reply dies on the internet. ACL filtering is Module 8."},
  {f:"Pool exhausted", b:"Dynamic NAT drops the next host's packets and logs %NAT-6-ADDR_ALLOC_FAILURE. Simple dynamic translations last 24 h (86,400 s) by default. Fix: more addresses, shorter timeout, or PAT."},
  {f:"NAT order of operations", b:"Inside → outside: route, then translate the source. Outside → inside: translate the destination, then route. So the ACL matches inside LOCAL addresses and the router needs no route for its NAT addresses."},
  {f:"How the ISP delivers inside globals", b:"Either they're on the shared link subnet (IOS answers ARP for them — an alias) or the ISP has a route for the block pointing at your outside address."},
  {f:"Mask instead of wildcard", b:"access-list 10 permit 192.168.40.0 255.255.255.0 is stored as 0.0.0.0 wildcard 255.255.255.0 — matches only .0 addresses. Read lists back with show access-lists; fix one line by sequence number."},
],
});

// ---------- Module 7 · Lesson 5 ----------
L.push({
id:"svc-pat", mins:90, level:"Intermediate · builds on lesson 4",
t:"PAT: the whole office on one public address — ports, verification, port forwarding and NAT troubleshooting",
html:`
${K.goals([
  "Explain how PAT lets a whole office share one public IPv4 address, using ports (and ICMP identifiers for pings) to keep conversations apart.",
  "Configure PAT on an ISP-facing interface — including a DHCP-learned one — and on a pool, and say when to use each.",
  "Read PAT rows in <code>show ip nat translations</code>, hits, misses and the pool line in <code>show ip nat statistics</code>, and use <code>clear ip nat translation *</code> safely.",
  "Publish one inside service with port forwarding (<code>ip nat inside source static tcp …</code>) and say what to warn the customer about.",
  "Troubleshoot NAT from evidence: swapped roles, an access list that misses a subnet, a missing <code>ip nat outside</code>, an exhausted pool, a missing return route.",
])}
${K.pre(["Lesson 4: why NAT exists, the four address names (inside local/global, outside local/global), static NAT, dynamic NAT from a pool, the standard access list as the &ldquo;who gets translated&rdquo; list, the order of operations and <code>show ip nat translations</code>.","Lesson 2: <code>ip address dhcp</code> on an ISP-facing interface and the <code>S* 0.0.0.0/0 [254/0]</code> default route it installs.","Module 1: TCP and UDP port numbers and how a client picks its source port. Module 5: wildcard masks and the troubleshooting method (follow the packet, both ways)."])}

<h2>Why this matters at work</h2>
<p>A design studio in Yaba, Lagos, moves into a new floor with forty staff, a fibre line and a contract that says &ldquo;one dynamic public IPv4 address&rdquo;. The ISP's router hands that address to the studio's router by DHCP, and it may change. Lesson 4's dynamic NAT needs one public address <i>per person online</i> — with one address, the second person to open a browser would get nothing.</p>
<p>Yet the whole floor browses and video-calls at once. The trick is <b>PAT</b>: one address, told apart by port numbers. It runs on almost every office and home router, so on the job you'll configure it, read its tables, open one port through it for a camera recorder — and find out why &ldquo;the internet is down for Finance only&rdquo;.</p>

<h2>PAT: one address, thousands of conversations</h2>
${K.remember(`<b>The rule in one line:</b> a reply can be matched by <b>address and port</b>, not only address. So ${K.g("PAT","Port Address Translation: NAT that rewrites the source address AND, when it has to, the source port, so many inside hosts share one inside global address. Cisco calls it NAT overload.")} rewrites every inside source to the <i>same</i> inside global address, keeps or changes the source port so each conversation's address:port is unique, and records the pair. A reply for <code>203.0.113.6:1024</code> belongs to exactly one inside host.`)}
<h3>Why lesson 4's pool runs out</h3>
<p>Dynamic NAT (lesson 4) lends each inside host a whole inside global address while its translation lives; with a pool of four, the fifth host is refused. ISPs give small businesses one address or a handful, never one per employee.</p>
<p>The way out comes from Module 1: every TCP or UDP segment carries source and destination ${K.g("port number","A 16-bit number (0–65,535) in the TCP or UDP header that says which program or conversation a segment belongs to. Servers listen on well-known ports (443 for HTTPS); clients use a temporary source port.")}s. A browser talks from a temporary ${K.g("ephemeral port","A short-lived source port the operating system picks for each new outgoing connection — on Windows from 49152–65535 by default.")} such as 51514 to port 443. Address plus port — a ${K.g("socket","An IP address plus a port number, e.g. 192.168.10.21:51514: one end of a conversation.")} — identifies a conversation, so the router needs a different <b>address:port</b> per conversation, not a different address per host.</p>
${K.analogy(`A company with one public phone number. When Amaka calls the bank, the switchboard notes &ldquo;line 1024 = Amaka's desk&rdquo;, so the bank's call back on line 1024 rings her desk, not Tunde's. Number = inside global address, line = port, the switchboard's notebook = the NAT table.`)}
${K.svg("0 0 760 420",
  K.txt(20,22,"Three PCs, one inside global address: PAT tells them apart by port",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",70,70,"PC1","10.44.1.21 · id 1")+K.dev("pc",70,160,"PC2","10.44.1.22 · id 1")+K.dev("pc",70,250,"PC3","10.44.1.23 · id 1")+
  K.dev("router",340,160,"YAB-EDGE","inside G0/0 · outside G0/1")+K.dev("server",660,160,"WEB","203.0.113.80")+
  K.link(92,72,314,152)+K.link(92,162,314,160)+K.link(92,252,314,168)+
  K.link(366,160,642,160,"src 198.51.100.2 :1 / :1024 / :1025")+
  K.txt(200,86,"src 10.44.1.21:1",{s:10,f:"mono",c:"muted"})+K.txt(200,150,"src 10.44.1.22:1",{s:10,f:"mono",c:"muted"})+K.txt(200,236,"src 10.44.1.23:1",{s:10,f:"mono",c:"muted"})+
  K.txt(380,306,"The router's notebook (show ip nat translations)",{c:"fg",s:11.5,mid:true,f:"body",b:true})+
  K.band(150,316,230,24,"inside local","var(--chip)")+K.band(390,316,230,24,"inside global","var(--chip)")+
  K.band(150,344,230,22,"10.44.1.21:1","var(--panel2)")+K.band(390,344,230,22,"198.51.100.2:1","var(--panel2)")+
  K.band(150,368,230,22,"10.44.1.22:1","var(--panel2)")+K.band(390,368,230,22,"198.51.100.2:1024","var(--panel2)")+
  K.band(150,392,230,22,"10.44.1.23:1","var(--panel2)")+K.band(390,392,230,22,"198.51.100.2:1025","var(--panel2)"),
  "Each PC pings with ICMP identifier 1. PC1 keeps it; PC2 and PC3 get 1024 and 1025 on the same inside global address, so replies to 198.51.100.2:1024 go to PC2 only. (Real values from this lesson's first bench.)")}
<h3>How the router chooses the port</h3>
${K.steps([
  ["Check the access list", "Does lesson 4's &ldquo;who gets translated&rdquo; list permit this source? If not, no translation."],
  ["Keep the source port if it's free", "If no other conversation of the same protocol uses that port on the inside global address, it stays — called port preservation, the normal case."],
  ["Otherwise pick a free one", "Current IOS XE routers commonly hand out the next free port from 1024 upwards, as you'll see in this lesson's labs. Older IOS documentation describes a search from the start of the original port's own range (0–511, 512–1023 or 1024–65535), so the exact number varies by version — what never varies is that the address:port is unique."],
  ["Write it down, both ways", "The entry records inside local, inside global and the outside address:port. Later packets get the same rewrite; replies to the inside global address:port are rewritten back."],
])}
<h3>Pings have no ports: the ICMP identifier</h3>
<p>A ping is ICMP, so there are no ports. But an echo request carries a 16-bit ${K.g("ICMP identifier","A 16-bit field in ICMP echo request and echo reply messages that ties each reply to its request. PAT uses it in place of a port number.")}, which the reply copies. PAT uses it exactly like a port: it shows after the colon (<code>10.44.1.21:1</code>) and is renumbered on a clash. Clashes are common: Windows' ping normally uses identifier 1, so three Windows PCs all arrive with <code>:1</code> — the first keeps it, the others are renumbered, as in the diagram.</p>
${K.dyk(`Port numbers are 16 bits, so one inside global address has 65,536 per protocol — TCP, UDP and ICMP identifiers are counted separately: tens of thousands of conversations on one address. ISPs running ${K.g("CGNAT","Carrier-Grade NAT: PAT run by the ISP, sharing one public address among many customers.")} (Module 6) share addresses among customers this way.`)}
${K.check({q:"Forty staff share one inside global address through PAT. Two of them open the same website, and both laptops happen to pick source port 50112. What does the router do?", o:["Drops the second laptop's connection until the first one closes","Translates the first laptop to 50112 and gives the second laptop's conversation a different free port on the same inside global address","Gives the second laptop a different inside global address","Sends both out with port 50112, because the inside local addresses differ"], a:1, why:"Two conversations can't share one inside global address:port, so the second gets a free port (IOS often from 1024 up) on the same address. A different address would be pool behaviour; one shared port would make replies ambiguous."})}
<h3>Same logic, new situation</h3>
<p>An Ibadan office's router does PAT on 203.0.113.9 and its table is empty. In order: host A <code>10.8.0.14:53001</code> queries DNS server <code>192.0.2.53:53</code> (UDP); host B <code>10.8.0.27:53001</code> queries the same server (UDP); host B opens <code>198.51.100.70:443</code> from port 49822 (TCP). Assume a free port is kept, otherwise the lowest free from 1024.</p>
${K.hint(`One question per conversation: is this port already used, <i>for this protocol</i>, on 203.0.113.9?`)}
${K.q({type:"fill", q:"Which inside global port does each conversation get?", fields:[
  {label:"Host A, UDP from port 53001", a:["53001","203.0.113.9:53001"]},
  {label:"Host B, UDP from port 53001", a:["1024","203.0.113.9:1024"]},
  {label:"Host B, TCP from port 49822", a:["49822","203.0.113.9:49822"]}],
  why:"1. What is asked? The global port for three conversations on one address. 2. Rule: keep the port if no same-protocol conversation uses it there; otherwise take a free one. 3. Apply it: A keeps 53001. B's UDP 53001 is taken by A, so B gets 1024. B's TCP 49822 is free (TCP and UDP are counted separately), so it stays. One host, several entries — one per conversation."})}

<h2>Configuring PAT: on the interface, or on a pool</h2>
${K.remember(`<b>The config rule:</b> PAT is lesson 4's dynamic NAT plus one word: the same four pieces — <b>inside</b> interface, <b>outside</b> interface, an <b>access list</b>, a <b>rule</b> joining list to address — with <code>overload</code> at the end. Cisco calls PAT <i>NAT overload</i>.`)}
<h3>Worked example: PAT on the outside interface's address</h3>
<p>An Abuja law firm: staff LAN 192.168.10.0/24 on <code>ABJ-EDGE</code> G0/0 (.1); G0/1 to the ISP with the static address 203.0.113.6/29 and a default route to 203.0.113.1. Users share the router's own address.</p>
${K.steps([
  ["Mark the inside and the outside", "<code>interface g0/0</code> → <code>ip nat inside</code>; <code>interface g0/1</code> → <code>ip nat outside</code>. The router translates only packets crossing between the two. Say it out loud first: &ldquo;LAN inside, ISP link outside&rdquo;."],
  ["Say who gets translated", "<code>access-list 1 permit 192.168.10.0 0.0.0.255</code> — a standard list (lesson 4) used as a match list, with an OSPF-style wildcard (Module 5). It filters nothing until Module 8."],
  ["Join the list to the interface's address, with overload", "<code>ip nat inside source list 1 interface g0/1 overload</code>: &ldquo;sources matched by list 1 become G0/1's address, many at once&rdquo;. <code>interface g0/1</code> means <i>whatever address G0/1 has</i>."],
  ["Test, then read the table", "Ping from a PC, then <code>show ip nat translations</code>: every row has inside global 203.0.113.6 and its own port."],
])}
${K.out(`ABJ-EDGE#show running-config | include nat
 ip nat inside
 ip nat outside
ip nat inside source list 1 interface GigabitEthernet0/1 overload`, "Three NAT lines. The two indented ones sit under G0/0 and G0/1; IOS expands g0/1 to its full name in the rule. (The lab's ABJ-EDGE, after the four steps.)")}
<p>An interface has one role; typing <code>ip nat inside</code> on an outside interface replaces it.</p>
<h3>When the ISP hands out the address by DHCP</h3>
<p>Lesson 2's <code>ip address dhcp</code> learns the outside address and an <code>S* 0.0.0.0/0 [254/0]</code> default route from the ISP. The <code>interface</code> form is made for this: it names the interface, not an address, so when the ISP gives a new address next month, PAT uses it with no config change (live conversations break and reconnect).</p>
${K.mistake(`Forgetting <code>overload</code>. Without it, <code>ip nat inside source list 1 pool PUB</code> is dynamic NAT: each host borrows a whole address. With a two-address pool the first two people online get the internet and nobody else does — and since idle dynamic translations last up to 24 hours by default on IOS, it can be the same two all day. You'll fix exactly this on a bench later.`)}
<h3>PAT on a pool</h3>
<p>When the ISP gives a block — say 203.0.113.16/29 — you may not want users on the router's own address: keep staff and guest Wi-Fi on different public addresses (a blocklisted guest address doesn't stop staff mail), or spread a big office across several. Then PAT uses a pool:</p>
${K.out(`ip nat pool STAFF-PAT 203.0.113.19 203.0.113.19 netmask 255.255.255.248
ip nat inside source list 1 pool STAFF-PAT overload`, "A pool of one address, overloaded. The netmask describes the subnet the pool's addresses belong to; start and end must be inside it.")}
<p>With <code>overload</code>, IOS uses the pool's first address for everybody and moves on only when its ports run out, so a one-address pool serves a whole office. Replies must reach you: a pool address in the outside interface's subnet is answered by ARP on that link (lesson 4); a separate block needs an ISP route pointing at your router.</p>
${K.when([
  ["PAT on the interface (<code>… interface g0/1 overload</code>)","One public address, especially a DHCP one","Follows whatever address the interface has","Groups must appear on different public addresses"],
  ["PAT on a pool (<code>… pool NAME overload</code>)","The ISP gave a block; users on an address other than the router's, or one per group","You choose each group's public address","The address is learned by DHCP — a pool hard-codes it"],
  ["Dynamic NAT, no overload (lesson 4)","Each host needs a whole address while active, and you have enough","No port rewriting, which some old protocols prefer","More hosts than addresses"],
  ["Static NAT or port forwarding","An inside server must be reachable from outside","The mapping exists before any traffic (next section)","Only outgoing access is needed"],
], "Which kind of NAT to configure")}
${K.check({q:"A branch's ISP-facing interface G0/1 uses ip address dhcp, and its address changed twice last month. Which rule lets all 30 staff browse, and keeps working after the next change?", o:["ip nat inside source list 1 pool BRANCH overload, with the pool set to the current G0/1 address","ip nat inside source list 1 interface g0/1 overload","ip nat inside source static 192.168.1.0 203.0.113.2","ip nat inside source list 1 pool BRANCH, with a pool of 30 addresses"], a:1, why:"The interface form uses G0/1's current address, shared by port. A pool hard-codes today's address; static NAT maps one host; they have no 30-address block."})}
<h3>Same logic, new situation</h3>
<p>A Kaduna school's router runs <code>ip nat pool SCHOOL 198.51.100.10 198.51.100.10 netmask 255.255.255.252</code> and <code>ip nat inside source list 5 pool SCHOOL overload</code>. Over the holiday the ISP moved the school to DHCP; G0/1 is now up with 198.51.100.22, and pupils get nothing. What's wrong, and what should the rule be?</p>
${K.hint(`Which address does the rule put on the pupils' packets — and is that address still the school's?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why PAT stopped after the ISP change, and the right config. <b>2. Rule:</b> a pool hard-codes addresses; the <code>interface</code> form follows the interface's current address. <b>3. Apply it:</b> the rule still writes 198.51.100.10 on pupils' packets, an address that isn't the school's any more, so replies never come back. Clear the table, <code>no ip nat inside source list 5 pool SCHOOL overload</code>, then <code>ip nat inside source list 5 interface g0/1 overload</code>, and remove the old pool. Now it uses 198.51.100.22 — and next term's address too.</p>`)}

<h2>Reading the evidence: ports in the table, hits and misses, clearing</h2>
${K.remember(`<b>The reading rule:</b> in a PAT table every row has the <b>same inside global address</b> and its own <b>port</b>; one row is one conversation, not one host. Read it as a sentence: &ldquo;this inside global address:port stands for this inside local address:port, talking to that outside address:port&rdquo;.`)}
<p>On ABJ-EDGE, three PCs (.21–.23) each ping the ISP's test server 198.51.100.40:</p>
${K.out(`ABJ-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 203.0.113.6:1         192.168.10.21:1       198.51.100.40:1       198.51.100.40:1
icmp 203.0.113.6:1024      192.168.10.22:1       198.51.100.40:1       198.51.100.40:1024
icmp 203.0.113.6:1025      192.168.10.23:1       198.51.100.40:1       198.51.100.40:1025
Total number of translations: 3`, "Three conversations, one inside global address. Lab output; real IOS prints the same columns.")}
<ul>
<li><code>Pro icmp</code> — PAT rows are always <code>tcp</code>, <code>udp</code> or <code>icmp</code>: <i>extended</i> entries, keyed by port or identifier.</li>
<li><b>Inside global</b> <code>203.0.113.6:1024</code> — what the internet sees; all rows share the address.</li>
<li><b>Inside local</b> <code>192.168.10.22:1</code> — the PC's real address and identifier. All three used 1; PC2 and PC3 were renumbered.</li>
<li><b>Outside local / global</b> <code>198.51.100.40</code> — the server, unchanged (as in lesson 4). For ICMP, IOS shows the translated identifier in the outside global column (<code>:1024</code>), because an echo has one identifier, not two ports.</li>
</ul>
<p>The lab generates only pings and traceroutes (<code>icmp</code> rows). A real office router on a Monday looks like this:</p>
${K.out(`Pro  Inside global         Inside local          Outside local         Outside global
udp  203.0.113.6:58211     192.168.10.21:58211   192.0.2.53:53         192.0.2.53:53
tcp  203.0.113.6:51514     192.168.10.21:51514   198.51.100.40:443     198.51.100.40:443
tcp  203.0.113.6:51515     192.168.10.21:51515   198.51.100.40:443     198.51.100.40:443
tcp  203.0.113.6:1024      192.168.10.35:51514   198.51.100.40:443     198.51.100.40:443
tcp  203.0.113.6:62007     192.168.10.35:62007   192.0.2.99:993        192.0.2.99:993
Total number of translations: 5`, "An illustration of a real table (not lab output): a DNS lookup, two HTTPS connections from one laptop, a port clash, and secure email on TCP 993.")}
<p>Read it as sentences. Laptop .21 asked a DNS server (UDP 53) and opened two HTTPS connections. Laptop .35 also chose 51514, already held by .21, so it went out as 1024; its email port, 62007, was free and kept.</p>
${K.tip(`With IOS defaults, an idle ICMP entry goes after about a minute, UDP after five minutes and TCP after up to 24 hours (a closed TCP connection within about a minute). The lab keeps every translation until you clear it.`)}
<h3><code>show ip nat statistics</code>: the health check</h3>
${K.out(`ABJ-EDGE#show ip nat statistics
Total active translations: 3 (0 static, 3 dynamic; 3 extended)
Outside interfaces:
  GigabitEthernet0/1
Inside interfaces:
  GigabitEthernet0/0
Hits: 21  Misses: 3
Expired translations: 0
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 interface GigabitEthernet0/1 refcount 3
nat-limit statistics:
 max entry: max allowed 0, used 0, missed 0
In-to-out drops: 0  Out-to-in drops: 0
Pool stats drop: 0  Mapping stats drop: 0
Port block alloc fail: 0
IP alias add fail: 0
Limit entry add fail: 0`, "The same router after the three pings (lab output, modelled on IOS XE).")}
<ul>
<li><code>Total active translations: 3 (0 static, 3 dynamic; 3 extended)</code> — rows by type; every PAT row is extended.</li>
<li><code>Outside interfaces</code> / <code>Inside interfaces</code> — the roles <b>as the router understands them</b>. Read this first when NAT misbehaves.</li>
<li><code>Hits: 21  Misses: 3</code> — a <b>miss</b> is a packet that found no translation, so NAT created one: the first packet of each conversation. A <b>hit</b> matched an existing entry. Each Windows ping is four requests and four replies: one miss, 7 hits, and 3 × 7 = 21. (The lab's frame log shows one exchange per ping but counts four.)</li>
<li><code>[Id: 1] … refcount 3</code> — the dynamic rule and how many translations use it now. Refcount 0 while users complain = it has never translated anything.</li>
<li>A pool rule adds <code>total addresses 2, allocated 2 (100%), misses 1</code>. 100% allocated with misses climbing = an exhausted pool.</li>
</ul>
<h3><code>clear ip nat translation *</code></h3>
<p><code>clear ip nat translation *</code> deletes every <b>dynamic</b> translation. Static entries, port forwards and the counters stay (<code>clear ip nat statistics</code> resets those). The next packet of each conversation is a miss and builds a fresh entry.</p>
<p>Use it after changing NAT config — IOS won't simply remove a rule that live translations use: depending on the version it refuses (<code>%Dynamic mapping in use, cannot remove</code>) or asks <code>Dynamic mapping in use, do you want to delete all entries? [no]:</code> — or when testing. On a busy router warn people first: every live TCP conversation breaks. Real IOS can also clear single entries (e.g. <code>clear ip nat translation inside 203.0.113.3 192.168.10.21</code>).</p>
${K.exam(`Reading any NAT question: <b>before you look at the options, label every address</b> in the exhibit inside local, inside global, outside local or outside global, say which interface is inside, and for PAT add the port. Traps: the PC's private address offered as the &ldquo;inside global&rdquo;; a PAT table where every inside global is the same (correct, not a fault); &ldquo;Misses&rdquo; read as failures — a miss is a new conversation.`)}
${K.check({q:"show ip nat statistics on a PAT router shows Hits: 0 Misses: 0 and refcount 0, although staff say they have been trying to browse for an hour. What does that tell you?", o:["NAT is working; counters only update every hour","No packet has ever been looked at by NAT — traffic isn't crossing from an inside to an outside interface, so check the inside/outside roles first","The pool is exhausted","The access list is matching too many hosts"], a:1, why:"Zero misses means NAT never saw a packet to translate: roles missing or swapped, or traffic not reaching the router. An exhausted pool shows misses climbing and 100% allocated. Read the Inside/Outside lines first, then the access list."})}
<h3>Same logic, new situation</h3>
<p>A Port Harcourt clinic's engineer runs <code>show ip nat statistics</code> twice, a minute apart, during a &ldquo;the internet is slow&rdquo; complaint: <code>Hits: 88012  Misses: 1204</code>, then <code>Hits: 91530  Misses: 1210</code>, with Inside and Outside listed correctly. Is NAT failing?</p>
${K.hint(`What does one miss stand for, and what does a rising hit count prove?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether the counters show a NAT fault. <b>2. Rule:</b> a miss is the first packet of a new conversation; a hit is a packet matching an existing entry. <b>3. Apply it:</b> six new conversations started in that minute and about 3,500 packets flowed through existing ones, in the right roles. NAT is translating normally — look elsewhere for the slowness (the link's load, the ISP, DNS). Misses are not errors.</p>`)}

<h3>Try it: the whole office shares one address</h3>
<p>The Yaba studio from the opening. <code>YAB-EDGE</code> leases staff addresses (lesson 1) and learns its outside address by DHCP (lesson 2), but has no NAT. Prove the problem, configure PAT on the DHCP-learned address, read the evidence and watch a cleared table rebuild. Unlike Abuja, there's no address to type into the rule.</p>
${K.bench({id:"m7-pat-shared", points:100, openLog:true, from:"CCNA · Module 7 · lesson 5", title:"Yaba studio: the whole office shares one DHCP-learned address", viewBox:"0 0 960 470",
  intro:"Console cable on YAB-EDGE: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secret. <b>Design:</b> staff LAN 10.44.1.0/24 (YAB-EDGE G0/0 = .1, DHCP pool STAFF from .21); G0/1 to the ISP with <code>ip address dhcp</code>; the ISP's test server WEB is 203.0.113.80. The ISP has no routes for private addresses. <b>Lab notes:</b> the frame log shows one echo exchange per ping but NAT counts four each way, like Windows; translations never expire here.",
  devices:[
    {id:"edge", kind:"router", label:"YAB-EDGE", x:40, y:20, config:e=>{ ["en","conf t","hostname YAB-EDGE","no ip domain-lookup","int g0/0","description STAFF LAN","ip address 10.44.1.1 255.255.255.0","no shut","int g0/1","description ISP uplink (DHCP)","ip address dhcp","no shut","exit",
      "ip dhcp excluded-address 10.44.1.1 10.44.1.20","ip dhcp pool STAFF","network 10.44.1.0 255.255.255.0","default-router 10.44.1.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"isp", kind:"router", label:"ISP-PE", x:520, y:20, config:e=>{ ["en","conf t","hostname ISP-PE","int g0/1","description CUSTOMER 0412 YABA","ip address 198.51.100.1 255.255.255.252","no shut","int g0/0","description TEST SERVERS","ip address 203.0.113.1 255.255.255.0","no shut","exit",
      "ip dhcp excluded-address 198.51.100.1","ip dhcp pool CUST-0412","network 198.51.100.0 255.255.255.252","default-router 198.51.100.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"web", kind:"server", label:"WEB", x:800, y:150, ip:"203.0.113.80", mask:"255.255.255.0", gw:"203.0.113.1"},
    {id:"sw", kind:"switch", label:"SW-YAB", x:20, y:170},
    {id:"p1", kind:"pc", label:"PC1", x:20, y:330, dhcp:true},
    {id:"p2", kind:"pc", label:"PC2", x:150, y:330, dhcp:true},
    {id:"p3", kind:"pc", label:"PC3", x:280, y:330, dhcp:true},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:520, y:330},
  ],
  cables:[ {type:"cat6", a:"edge:g0", b:"sw:g1"}, {type:"cat6", a:"p1:eth", b:"sw:g2"}, {type:"cat6", a:"p2:eth", b:"sw:g3"}, {type:"cat6", a:"p3:eth", b:"sw:g4"},
    {type:"cat6", a:"edge:g1", b:"isp:g1"}, {type:"cat6", a:"web:eth", b:"isp:g0"}, {type:"console", a:"lap:usb", b:"edge:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Prove the problem: on PC1 run <code>ipconfig</code>, then <code>ping 203.0.113.80</code>. It times out. Open the frame log: the request reaches WEB — so where does the reply die, and why?", done:B=>Bench.tried(B,"p1",/ping\s+203\.0\.113\.80/)},
    {text:"On YAB-EDGE's console (<code>enable</code>): <code>show ip interface brief</code> and <code>show ip route</code>. Which address did G0/1 learn (Method DHCP), and where did the <code>S*</code> default route come from?", done:B=>{ const h = B.devs.edge.env.history; return h.some(x=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(x)) && h.some(x=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s*$/i.test(x)); }},
    {text:"Configure PAT on the DHCP-learned address: <code>access-list 1 permit 10.44.1.0 0.0.0.255</code>, <code>ip nat inside source list 1 interface g0/1 overload</code>, and the roles — <code>ip nat inside</code> on G0/0, <code>ip nat outside</code> on G0/1", done:B=>{ const e = B.devs.edge.env; return e.nat.rules.some(r=>r.acl==="1" && r.intf==="GigabitEthernet0/1" && r.overload) && !!e.intfs["GigabitEthernet0/0"].natIn && !!e.intfs["GigabitEthernet0/1"].natOut && window.ACL.check(e.acl,"1",{src:"10.44.1.77"},false).permit && !!e.acl.lists["1"]; }},
    {text:"Ping 203.0.113.80 from PC1, PC2 and PC3, then <code>show ip nat translations</code>. Predict before you look: how many inside global addresses, and which ports?", done:B=>[21,22,23].every(n=>Bench.natHas(B,"edge",new RegExp("198\\.51\\.100\\.2:\\d+\\s+10\\.44\\.1\\."+n+":1\\s"))) && B.devs.edge.env.history.some(x=>/sh\S*\s+ip\s+nat\s+tr/i.test(x))},
    {text:"<code>show ip nat statistics</code>: which interfaces does the router list as inside and outside? Why are there three misses but many more hits?", done:B=>B.devs.edge.env.history.some(x=>/sh\S*\s+ip\s+nat\s+stat/i.test(x))},
    {text:"<code>clear ip nat translation *</code>, then <code>show ip nat translations</code> (empty). Now ping 203.0.113.80 from <b>PC2 first</b> and show the table again: which port does PC2 get this time, and why?", done:B=>{ const L = B.devs.edge.env.log, c = L.findIndex(l=>/^\s*clear\s+ip\s+nat\s+tr\S*\s+\*\s*$/i.test(l.cmd||"")); return c>=0 && L.some((l,i)=>i>c && /198\.51\.100\.2:1\s+10\.44\.1\.22:1\s/.test(l.out||"")); }},
    {text:"Save the config: <code>copy running-config startup-config</code>", done:B=>!!B.devs.edge.env.savedOnce},
  ],
  win:"One DHCP-learned address now carries the whole office. Before NAT, the ISP had no way to route a reply to 10.44.1.21; after it, every PC appeared as 198.51.100.2 with its own identifier (1, 1024, 1025), the first packet of each conversation was a miss and the rest were hits — and after a clear, PC2 got identifier 1 back because nobody else held it.",
  solve:[["pc","p1","ipconfig"],["pc","p1","ping 203.0.113.80"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show ip route"],
    ["term","configure terminal"],["term","access-list 1 permit 10.44.1.0 0.0.0.255"],["term","ip nat inside source list 1 interface g0/1 overload"],["term","interface g0/0"],["term","ip nat inside"],["term","interface g0/1"],["term","ip nat outside"],["term","end"],
    ["pc","p1","ping 203.0.113.80"],["pc","p2","ping 203.0.113.80"],["pc","p3","ping 203.0.113.80"],["term","show ip nat translations"],["term","show ip nat statistics"],
    ["term","clear ip nat translation *"],["term","show ip nat translations"],["pc","p2","ping 203.0.113.80"],["term","show ip nat translations"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: the log line to find is the ISP router saying it has no route to a 10.44.1.x address. Task 6: after the clear, the table is empty, so nobody holds identifier 1 on 198.51.100.2 — whoever pings first keeps it.`)}

<h2>Port forwarding: letting the internet in on one port</h2>
${K.remember(`<b>The rule:</b> PAT builds entries only for conversations the <i>inside</i> starts; an unsolicited connection from the internet finds none. ${K.g("Port forwarding","A static NAT entry for one protocol and port: traffic arriving at a public address:port is sent to one inside address:port. Also called static PAT or a port mapping.")} adds a permanent entry before any traffic exists: &ldquo;TCP arriving at <i>public address:port</i> goes to <i>inside address:port</i>&rdquo;.`)}
<p>Lesson 4's static NAT gave a server a whole public address. Port forwarding is the thrifty version — one address can publish a portal on 443 <i>and</i> a recorder on 8443 — and the command is static NAT with a protocol and two ports:</p>
${K.out(`ip nat inside source static tcp 192.168.40.25 443 203.0.113.20 443
ip nat inside source static tcp 192.168.40.30 443 203.0.113.20 8443`, "ip nat inside source static {tcp|udp} <inside local> <local port> <inside global> <global port>")}
<ul>
<li>Line 1: TCP to 203.0.113.20:443 goes to the patient portal, 192.168.40.25:443.</li>
<li>Line 2: TCP to 203.0.113.20:<b>8443</b> goes to the recorder, 192.168.40.30:<b>443</b>. Both servers listen on 443, but one address has only one public 443, so the port is translated too.</li>
<li>Replies get the reverse rewrite, so the remote user sees one consistent address:port.</li>
</ul>
${K.svg("0 0 760 300",
  K.txt(20,22,"Port forwarding on one public address",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("laptop",70,150,"REMOTE DOCTOR","192.0.2.77")+K.dev("cloud",230,150,"INTERNET","")+K.dev("router",420,150,"IKJ-EDGE","203.0.113.20")+
  K.dev("server",660,80,"PORTAL","192.168.40.25:443")+K.dev("server",660,220,"NVR","192.168.40.30:443")+
  K.link(92,150,206,150)+K.arrow(256,150,394,150,"to 203.0.113.20:443 or :8443",true)+
  K.arrow(444,140,642,88,":443 → .25:443",true)+K.arrow(444,160,642,214,":8443 → .30:443",true)+
  K.txt(380,286,"Nothing else on 203.0.113.20 is forwarded: a connection to any other port finds no entry.",{c:"muted",s:11,mid:true,f:"body"}),
  "Two static TCP entries on 203.0.113.20: the destination port picks the inside server, and is rewritten when the sides differ.")}
${K.mistake(`Forwarding to a host whose address can change. If the recorder takes a new DHCP lease, the forward points at nothing — or at someone's laptop. Give forwarded servers a fixed address (static, or a ${K.g("DHCP reservation","A DHCP server setting that always gives one client, identified by its MAC address, the same address.")}).`)}
<p><b>Real IOS, DHCP outside address:</b> you can name the interface instead of an address — <code>ip nat inside source static tcp 192.168.40.25 443 interface GigabitEthernet0/1 443</code> — so the forward follows it. The lab accepts both forms.</p>
<h3>What to tell the customer</h3>
<p>A forward publishes the service to the whole internet, not only to the doctor, and scanners find new open ports within minutes. Forward only what's needed, to a patched service with a strong login; never forward management protocols such as ${K.g("RDP","Remote Desktop Protocol: Windows remote control, TCP 3389. Constantly attacked when exposed to the internet.")} (3389), Telnet or a router's web page; prefer a VPN for home workers; restrict sources with firewall rules (Module 8).</p>
${K.term({env:"ios2", title:"Ikeja clinic: PAT on a pool, and two port forwards", opts:{kind:"router", host:"IKJ-EDGE", model:"C1111-4P", motd:"IKJ-EDGE — console session (lab router, no enable secret)."},
  setup:env=>{ ["en","conf t","hostname IKJ-EDGE","no ip domain-lookup","interface g0/0","description CLINIC LAN","ip address 192.168.40.1 255.255.255.0","no shutdown","interface g0/1","description ISP uplink 203.0.113.16/29","ip address 203.0.113.18 255.255.255.248","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.17","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"The ISP gave the clinic 203.0.113.16/29: .17 is the ISP's gateway, .18 is IKJ-EDGE's G0/1. Staff browse from <b>.19</b>; <b>.20</b> publishes the patient portal and CCTV recorder. Interfaces are addressed. Start with <code>enable</code> and <code>configure terminal</code>; with no users behind this terminal, you verify by config and tables.",
  tasks:[
    {text:"Mark the roles: <code>interface g0/0</code> → <code>ip nat inside</code>; <code>interface g0/1</code> → <code>ip nat outside</code>", done:e=>!!e.intfs["GigabitEthernet0/0"].natIn && !!e.intfs["GigabitEthernet0/1"].natOut},
    {text:"Who gets translated: <code>access-list 7 permit 192.168.40.0 0.0.0.255</code>", done:e=>!!e.acl.lists["7"] && window.ACL.check(e.acl,"7",{src:"192.168.40.77"},false).permit && !window.ACL.check(e.acl,"7",{src:"192.168.41.77"},false).permit},
    {text:"A colleague's draft pool runs from .19 to .30. Try it — <code>ip nat pool IKJ-PAT 203.0.113.19 203.0.113.30 netmask 255.255.255.248</code> — and read why IOS refuses (which addresses does a /29 starting at .16 hold?). Then create the one-address pool: <code>ip nat pool IKJ-PAT 203.0.113.19 203.0.113.19 netmask 255.255.255.248</code>", done:e=>e.log.some(l=>/End address not on same subnet/.test(l.out||"")) && !!e.nat.pools["IKJ-PAT"] && e.nat.pools["IKJ-PAT"].start===e.nat.pools["IKJ-PAT"].end},
    {text:"PAT for staff on that pool: <code>ip nat inside source list 7 pool IKJ-PAT overload</code>", done:e=>e.nat.rules.some(r=>r.acl==="7" && r.pool==="IKJ-PAT" && r.overload)},
    {text:"Forward the patient portal: <code>ip nat inside source static tcp 192.168.40.25 443 203.0.113.20 443</code>. Then the recorder, whose page is also on 443 inside, on public port 8443: <code>ip nat inside source static tcp 192.168.40.30 443 203.0.113.20 8443</code>", done:e=>e.nat.statics.some(s=>s.proto==="tcp" && s.local==="192.168.40.25" && s.lport===443 && s.global==="203.0.113.20" && s.gport===443) && e.nat.statics.some(s=>s.proto==="tcp" && s.local==="192.168.40.30" && s.lport===443 && s.global==="203.0.113.20" && s.gport===8443)},
    {text:"<code>end</code>, then <code>show ip nat translations</code>. Two rows already, with no traffic at all — and <code>---</code> in the outside columns. Why?", done:e=>e.log.some(l=>/sh\S*\s+ip\s+nat\s+tr/i.test(l.cmd||"") && /203\.0\.113\.20:8443\s+192\.168\.40\.30:443/.test(l.out||""))},
    {text:"<code>show ip nat statistics</code>: how many static and dynamic translations? What does the pool line say is allocated, and why?", done:e=>e.log.some(l=>/sh\S*\s+ip\s+nat\s+stat/i.test(l.cmd||"") && /2 static/.test(l.out||"") && /pool IKJ-PAT/.test(l.out||""))},
    {text:"<code>show running-config | include nat</code> — the whole NAT design in six lines", done:e=>e.log.some(l=>/sh\S*\s+run\S*\s*\|\s*i\S*\s+nat/i.test(l.cmd||"") && /ip nat inside source list 7 pool IKJ-PAT overload/.test(l.out||""))},
  ],
  win:"You put staff on .19 by PAT, published two servers that both listen on 443 inside through one public address (443 and 8443), and saw the forwards sit in the table before any traffic, while the pool showed 0% allocated — PAT entries only appear when someone inside starts a conversation.",
  solve:["enable","configure terminal","interface g0/0","ip nat inside","interface g0/1","ip nat outside","exit","access-list 7 permit 192.168.40.0 0.0.0.255",
    "ip nat pool IKJ-PAT 203.0.113.19 203.0.113.30 netmask 255.255.255.248","ip nat pool IKJ-PAT 203.0.113.19 203.0.113.19 netmask 255.255.255.248","ip nat inside source list 7 pool IKJ-PAT overload",
    "ip nat inside source static tcp 192.168.40.25 443 203.0.113.20 443","ip nat inside source static tcp 192.168.40.30 443 203.0.113.20 8443","end","show ip nat translations","show ip nat statistics","show running-config | include nat"]})}
${K.hint(`Task 3: a /29 is 8 addresses, so the block starting at .16 ends at .23. Task 6: a static entry comes from configuration — it exists before anyone connects, and nobody outside is talking to it yet, so there's no outside address to show.`)}
${K.check({q:"An office has one public address, 198.51.100.30, used for staff PAT. The owner wants a contractor to reach an inside web server, 10.1.1.80, on TCP 443. Which command publishes it without breaking staff browsing?", o:["ip nat inside source static 10.1.1.80 198.51.100.30","ip nat inside source static tcp 10.1.1.80 443 198.51.100.30 443","ip nat outside source static tcp 198.51.100.30 443 10.1.1.80 443","ip nat inside source list 1 interface g0/1 overload"], a:1, why:"A static TCP entry maps only port 443 to the server; staff PAT keeps every other port. A one-to-one static takes the whole address and breaks PAT; outside source rewrites outside addresses; the PAT rule publishes nothing."})}
<h3>Same logic, new situation</h3>
<p>A Warri logistics firm's engineer needs to reach a Linux server's SSH (TCP 22) at 10.0.5.20 from home. The spare public address is 203.0.113.9, and they agree on public port 2222 to dodge most SSH scanners.</p>
${K.hint(`Fill the template: static, protocol, inside local and its port, then inside global and its port.`)}
${K.q({type:"fill", q:"Write the port-forwarding command.", fields:[{label:"Command", a:["ip nat inside source static tcp 10.0.5.20 22 203.0.113.9 2222"], ios:true}],
  why:"1. What is asked? A forward from a public port to a different inside port. 2. Rule: ip nat inside source static tcp <inside local> <local port> <inside global> <global port> — inside first. 3. Apply it: ip nat inside source static tcp 10.0.5.20 22 203.0.113.9 2222. The engineer connects to 203.0.113.9:2222 and lands on 10.0.5.20:22. The odd port only dodges lazy scanners — SSH still needs keys or a strong password, and a source-limiting firewall rule is better."})}

<h2>Troubleshooting NAT: five faults, five fingerprints</h2>
${K.remember(`<b>The journey rule:</b> a packet needs five things to cross NAT and return. <b>IN</b> — it arrives on an <code>ip nat inside</code> interface. <b>LIST</b> — the access list permits its source. <b>RULE</b> — a <code>source list</code> rule joins the list to an address (<code>overload</code> if shared). <b>OUT</b> — it leaves an <code>ip nat outside</code> interface. <b>BACK</b> — the world routes the inside global back to you. Check in that order.`)}
<p>Every NAT fault looks the same to the user: a ping that times out. Follow the packet both ways (Module 5) with sharper tools: the table (was a translation built?), the statistics (roles), the logs and pool line (allocation failures).</p>
${K.svg("0 0 760 290",
  K.dev("pc",60,70,"PC","inside local")+K.dev("router",300,70,"EDGE","NAT")+K.dev("cloud",520,70,"ISP","")+K.dev("server",690,70,"SERVER","")+
  K.link(82,72,274,72,"LAN")+K.link(326,72,494,72,"uplink")+K.link(546,72,672,72)+
  K.box(12,150,136,48,"1 · IN","LAN: ip nat inside",true)+K.box(160,150,136,48,"2 · LIST","ACL permits source",true)+K.box(308,150,136,48,"3 · RULE","source list … overload",true)+
  K.box(456,150,136,48,"4 · OUT","uplink: ip nat outside",true)+K.box(604,150,136,48,"5 · BACK","route to the global",true)+
  K.txt(80,222,"stats: LAN not under",{mid:true,s:10,f:"body"})+K.txt(80,236,"Inside interfaces",{mid:true,s:10,f:"body"})+
  K.txt(228,222,"log: not matched by",{mid:true,s:10,f:"body"})+K.txt(228,236,"any rule's access list",{mid:true,s:10,f:"body"})+
  K.txt(376,222,"no row; pool 100%",{mid:true,s:10,f:"body"})+K.txt(376,236,"+ ADDR_ALLOC_FAILURE",{mid:true,s:10,f:"body"})+
  K.txt(524,222,"stats: Outside",{mid:true,s:10,f:"body"})+K.txt(524,236,"interfaces empty",{mid:true,s:10,f:"body"})+
  K.txt(672,222,"row appears,",{mid:true,s:10,f:"body"})+K.txt(672,236,"reply never comes",{mid:true,s:10,f:"body"})+
  K.txt(380,272,"Same symptom for all five — the ping times out. The fingerprint underneath tells you which one.",{c:"fg",s:11,mid:true,f:"body"}),
  "The five checkpoints on the way out and back, and the evidence that points at each. Swapped roles fail checks 1 and 4 at once.")}
<h3>The five faults in detail</h3>
<div class="tablewrap"><table>
<tr><th>Fault</th><th>What the router does</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td><b>Inside/outside swapped</b></td><td>LAN traffic enters an &ldquo;outside&rdquo; interface and leaves an &ldquo;inside&rdquo; one: never translated</td><td>Statistics list the LAN under <i>Outside</i>; Hits/Misses 0; empty table; traceroute stops after the gateway</td><td>Swap the roles</td></tr>
<tr><td><b>Access list doesn't match</b> (wrong wildcard, a new subnet left out)</td><td>The packet leaves with its private source; the reply has nowhere to go</td><td>No row for that host while others work; <code>show access-lists</code> lacks the subnet; lab log: &ldquo;isn't matched by any NAT rule's access list&rdquo;</td><td>Fix the list (a new LAN also needs <code>ip nat inside</code>)</td></tr>
<tr><td><b>Missing <code>ip nat outside</code></b></td><td>Nothing ever crosses inside→outside</td><td><code>Outside interfaces:</code> with nothing under it; counters 0</td><td><code>ip nat outside</code> on the uplink</td></tr>
<tr><td><b>Pool exhausted</b> (no <code>overload</code>)</td><td>The first few hosts get an address each; the rest are dropped</td><td><code>allocated … (100%), misses …</code>; <code>%NAT-6-ADDR_ALLOC_FAILURE</code></td><td>Add <code>overload</code> (clear first) or a bigger pool</td></tr>
<tr><td><b>No return route</b></td><td>Translation works, but the ISP doesn't route the pool to you</td><td>A row <i>does</i> appear; no reply</td><td>The ISP routes the block to your uplink (or use the link's subnet)</td></tr>
</table></div>
<p>The exhausted-pool fingerprint: ABJ-EDGE set up with a two-address pool and no <code>overload</code>, after three PCs tried:</p>
${K.out(`ABJ-EDGE#show logging | include NAT
*Oct 12 08:30:49.959: %NAT-6-ADDR_ALLOC_FAILURE: Address allocation failed; pool 1 may be exhausted [2]
ABJ-EDGE#show ip nat statistics
Total active translations: 4 (0 static, 4 dynamic; 2 extended)
Outside interfaces:
  GigabitEthernet0/1
Inside interfaces:
  GigabitEthernet0/0
Hits: 14  Misses: 6
Expired translations: 0
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 pool ABJ-PUB refcount 4
 pool ABJ-PUB: id 1, netmask 255.255.255.248
	start 203.0.113.3 end 203.0.113.4
	type generic, total addresses 2, allocated 2 (100%), misses 4`, "Lab output (the statistics are trimmed after the pool line). The * before the time means the clock isn't synchronised — lesson 6 fixes that with NTP.")}
<ul>
<li><code>%NAT-6-ADDR_ALLOC_FAILURE … pool 1 may be exhausted</code> — severity 6 (informational): pool id 1 had no free address for a new host.</li>
<li><code>4 dynamic; 2 extended</code> — dynamic NAT keeps an address-only entry per host <i>and</i> an extended entry per conversation.</li>
<li><code>allocated 2 (100%), misses 4</code> — both addresses lent out, and an allocation refused for each of PC3's four echo requests (they also count in <code>Misses: 6</code>, next to the first packets of PC1 and PC2). In a real office this climbs all morning.</li>
</ul>
${K.mistake(`Adding a new LAN without telling NAT. It needs <b>two</b> things: <code>ip nat inside</code> on its interface <i>and</i> a line in the NAT access list. With only the list line, NAT never sees the packets; with only <code>ip nat inside</code>, NAT sees them but won't translate them (&ldquo;not matched&rdquo;), so they leave with their private source — the changing evidence is itself a clue.`)}
${K.job("“Jos office: the whole site lost the internet after last night's router swap”",`
<p><b>The ticket.</b> &ldquo;JOS-EDGE was replaced overnight (hardware fault) and configured from the old router's printout. Since 07:30 nobody can reach anything on the internet. Phones on mobile data are fine.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Can staff reach local things?&rdquo; — <i>yes</i>. &ldquo;Did the ISP change anything?&rdquo; — <i>no, the ISP sees the router</i>. Local fine, internet dead, after a rebuild: think NAT.</p>
<p><b>Checks.</b> From a staff PC (172.16.20.31): <code>ping 198.51.100.66</code> (the router's outside address) replies; <code>ping 203.0.113.80</code> times out and <code>tracert</code> stops after hop 1:</p>
${K.out(`C:\\Users\\staff>tracert 203.0.113.80

Tracing route to 203.0.113.80 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  172.16.20.1
  2     *        *        *     Request timed out.
  3     *        *        *     Request timed out.`, "Lab output, trimmed after hop 3. The ISP router's answers are addressed to 172.16.20.31, which it can't route.")}
<p>On the router:</p>
${K.out(`JOS-EDGE#show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
Total number of translations: 0
JOS-EDGE#show ip nat statistics
Total active translations: 0 (0 static, 0 dynamic; 0 extended)
Outside interfaces:
  GigabitEthernet0/0
Inside interfaces:
  GigabitEthernet0/1
Hits: 0  Misses: 0
Expired translations: 0
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 interface GigabitEthernet0/1 refcount 0
JOS-EDGE#show access-lists
Standard IP access list 1
    10 permit 172.16.20.0, wildcard bits 0.0.0.255
JOS-EDGE#show running-config | section interface
interface GigabitEthernet0/0
 description STAFF LAN
 ip address 172.16.20.1 255.255.255.0
 ip nat outside
interface GigabitEthernet0/1
 description ISP uplink
 ip address 198.51.100.66 255.255.255.252
 ip nat inside
interface GigabitEthernet0/2
 no ip address
 shutdown
ip nat inside source list 1 interface GigabitEthernet0/1 overload`, "Lab output (statistics trimmed after the mapping line). Read the Outside/Inside lines against the descriptions.")}
<p><b>Reading it.</b> Zero translations, zero misses: NAT has never tried. The list and rule are right, but the <b>STAFF LAN</b> (G0/0) is <i>outside</i> and the <b>ISP uplink</b> <i>inside</i> — the roles were typed under the wrong blocks of the printout. Staff packets leave untranslated, with 172.16.20.31 as the source.</p>
<p><b>The fix.</b> With the change approved: <code>configure terminal</code>, <code>interface g0/0</code>, <code>ip nat inside</code>, <code>interface g0/1</code>, <code>ip nat outside</code>, <code>end</code>. The PC's ping replies; <code>show ip nat translations</code> shows <code>icmp 198.51.100.66:1  172.16.20.31:1  203.0.113.80:1  203.0.113.80:1</code>; statistics show <code>Hits: 7  Misses: 1</code> with G0/1 under Outside. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;The replacement router had its address-sharing labels on the wrong ports, so your traffic went out with an address the internet can't reply to. It's corrected and saved; browsing works. Tell me if anything still fails.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;JOS-EDGE rebuilt 02:10 from printout; ip nat inside/outside reversed (G0/0 STAFF = outside, G0/1 ISP = inside). Evidence: 0 translations, Hits/Misses 0, tracert stops at hop 1. Swapped roles 08:05; ping/tracert OK, translations building, saved. Action: restore rebuilds from TFTP backups (lesson 7), not paper. 35 min.&rdquo;</i></p>`)}
<h3>Try it: the Kano ticket</h3>
<p>A ticket with more than one cause. Unlike Jos, the roles here are mostly right. Collect evidence before changing anything.</p>
${K.bench({id:"m7-nat-ticket", points:120, openLog:true, from:"CCNA · Module 7 · lesson 5", title:"Kano ticket: 'only the early birds get internet — and Finance gets none'", viewBox:"0 0 960 470",
  intro:"<b>Ticket 8817, Bompai office:</b> &ldquo;Since the contractor's NAT change, only two people ever have internet — whoever is in first. The new Finance LAN that went in on Saturday has none at all.&rdquo; Console on KAN-EDGE: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secret. <b>Design:</b> STAFF 10.20.10.0/24 on G0/0; FINANCE 10.20.30.0/24 on G0/2 (new); G0/1 = 203.0.113.50/29 (ISP .49); spare addresses .51–.52 are for staff browsing; test server WEB 198.51.100.25. <b>Lab note:</b> translations never expire here.",
  devices:[
    {id:"edge", kind:"router", label:"KAN-EDGE", x:40, y:20, config:e=>{ ["en","conf t","hostname KAN-EDGE","no ip domain-lookup","int g0/0","description STAFF LAN","ip address 10.20.10.1 255.255.255.0","ip nat inside","no shut","int g0/2","description FINANCE LAN (new Sat)","ip address 10.20.30.1 255.255.255.0","no shut",
      "int g0/1","description ISP uplink 203.0.113.48/29","ip address 203.0.113.50 255.255.255.248","ip nat outside","no shut","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.49",
      "access-list 10 permit 10.20.10.0 0.0.0.255","ip nat pool KANO-PUB 203.0.113.51 203.0.113.52 netmask 255.255.255.248","ip nat inside source list 10 pool KANO-PUB","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"isp", kind:"router", label:"ISP-PE", x:520, y:20, config:e=>{ ["en","conf t","hostname ISP-PE","int g0/1","description CUSTOMER KANO-BOMPAI","ip address 203.0.113.49 255.255.255.248","no shut","int g0/0","description TEST SERVERS","ip address 198.51.100.1 255.255.255.0","no shut","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"web", kind:"server", label:"WEB", x:800, y:150, ip:"198.51.100.25", mask:"255.255.255.0", gw:"198.51.100.1"},
    {id:"sw", kind:"switch", label:"SW-STAFF", x:20, y:170},
    {id:"fin", kind:"pc", label:"PC-FIN", x:520, y:170, ip:"10.20.30.21", mask:"255.255.255.0", gw:"10.20.30.1"},
    {id:"pa", kind:"pc", label:"PC-A", x:20, y:330, ip:"10.20.10.11", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"pb", kind:"pc", label:"PC-B", x:150, y:330, ip:"10.20.10.12", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"pc3", kind:"pc", label:"PC-C", x:280, y:330, ip:"10.20.10.13", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:660, y:330},
  ],
  cables:[ {type:"cat6", a:"edge:g0", b:"sw:g1"}, {type:"cat6", a:"pa:eth", b:"sw:g2"}, {type:"cat6", a:"pb:eth", b:"sw:g3"}, {type:"cat6", a:"pc3:eth", b:"sw:g4"},
    {type:"cat6", a:"fin:eth", b:"edge:g2"}, {type:"cat6", a:"edge:g1", b:"isp:g1"}, {type:"cat6", a:"web:eth", b:"isp:g0"}, {type:"console", a:"lap:usb", b:"edge:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket: <code>ping 198.51.100.25</code> from PC-A, then PC-B (the early birds), then PC-C, then PC-FIN. Who fails? Read the frame log's NAT line for PC-C and for PC-FIN — they fail for different reasons", done:B=>["pa","pb","pc3","fin"].every(p=>Bench.tried(B,p,/ping\s+198\.51\.100\.25/))},
    {text:"Collect evidence on KAN-EDGE (<code>enable</code>): <code>show ip nat translations</code> (who holds the two public addresses?), <code>show ip nat statistics</code> (the pool line; which interfaces are inside?), <code>show logging | include NAT</code> (shows only the log lines containing NAT) and <code>show access-lists</code> (which subnets does list 10 cover?)", done:B=>{ const h = B.devs.edge.env.history; return h.some(x=>/sh\S*\s+ip\s+nat\s+tr/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+nat\s+stat/i.test(x)) && h.some(x=>/sh\S*\s+log/i.test(x)) && h.some(x=>/sh\S*\s+(ip\s+)?acc\S*/i.test(x)); }},
    {text:"Fix the early-bird problem by making the pool rule PAT. Clear the table first (<code>clear ip nat translation *</code> — IOS won't change or remove a mapping that live translations use), then in configuration mode <code>ip nat inside source list 10 pool KANO-PUB overload</code>. Done when PC-C pings WEB and the table shows staff PCs sharing 203.0.113.51 by port", done:B=>{ const e = B.devs.edge.env; return e.nat.rules.some(r=>r.acl==="10" && r.pool==="KANO-PUB" && r.overload) && Bench.pinged(B,"pc3","198.51.100.25") && Bench.natHas(B,"edge",/203\.0\.113\.51:\d+\s+10\.20\.10\.13:/); }},
    {text:"Finance: the new LAN needs both things NAT checks — <code>ip nat inside</code> on G0/2, and a line in list 10, <code>access-list 10 permit 10.20.30.0 0.0.0.255</code>. Add one, ping from PC-FIN and read the frame log; then add the other and ping again. Done when PC-FIN reaches WEB through a translation", done:B=>{ const e = B.devs.edge.env; return !!e.intfs["GigabitEthernet0/2"].natIn && Bench.pinged(B,"fin","198.51.100.25") && Bench.natHas(B,"edge",/203\.0\.113\.51:\d+\s+10\.20\.30\.21:/); }},
    {text:"Prove it and save: <code>show ip nat statistics</code> must list both LANs as inside interfaces; then <code>copy running-config startup-config</code>", done:B=>{ const e = B.devs.edge.env; return e.log.some(l=>/sh\S*\s+ip\s+nat\s+stat/i.test(l.cmd||"") && /GigabitEthernet0\/0, GigabitEthernet0\/2/.test(l.out||"")) && !!e.savedOnce; }},
  ],
  win:"Two faults behind one ticket. A two-address pool without overload lent a whole address to each of the first two people — %NAT-6-ADDR_ALLOC_FAILURE and 'allocated 2 (100%)' proved it — and overload put everyone on 203.0.113.51 by port. Finance needed ip nat inside AND a line in list 10: with one missing, NAT either never saw its packets or wouldn't translate them.",
  solve:[["pc","pa","ping 198.51.100.25"],["pc","pb","ping 198.51.100.25"],["pc","pc3","ping 198.51.100.25"],["pc","fin","ping 198.51.100.25"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","show ip nat translations"],["term","show ip nat statistics"],["term","show logging | include NAT"],["term","show access-lists"],
    ["term","clear ip nat translation *"],["term","configure terminal"],["term","ip nat inside source list 10 pool KANO-PUB overload"],["term","end"],
    ["pc","pc3","ping 198.51.100.25"],["pc","pa","ping 198.51.100.25"],["term","show ip nat translations"],
    ["term","configure terminal"],["term","interface g0/2"],["term","ip nat inside"],["term","end"],["pc","fin","ping 198.51.100.25"],
    ["term","configure terminal"],["term","access-list 10 permit 10.20.30.0 0.0.0.255"],["term","end"],["pc","fin","ping 198.51.100.25"],
    ["term","show ip nat translations"],["term","show ip nat statistics"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`PC-C's log line says the rule covers it but there's no free address — that's the pool. PC-FIN's log has no NAT line at all at first: which interface did its packet arrive on, and is that interface inside?`)}
${K.case("“Which laptop was it?” — PAT and the abuse report",`
<p>An Enugu accounting firm's ISP forwards a complaint: abusive traffic from <code>203.0.113.6</code>, source port 51514, at 14:02 on Tuesday. Deal with the machine responsible.</p>
<p><b>The problem.</b> The whole firm is 203.0.113.6 — that's PAT. Only the translation that existed at 14:02 (203.0.113.6:51514 = some 192.168.x.y) names the laptop, and it timed out days ago; <code>show ip nat translations</code> shows now, not Tuesday.</p>
<p><b>What they changed.</b> (1) <b>Translation logging:</b> IOS can send a syslog message when each translation is created or deleted (on many versions <code>ip nat log translations syslog</code>) to the central syslog server of lesson 6. (2) <b>Correct time:</b> &ldquo;14:02&rdquo; is useless if the router's clock is twenty minutes off — NTP (lesson 6). (3) <b>Retention:</b> logs kept for an agreed period, readable by few people, because they record everyone's browsing.</p>
<p><b>Lessons.</b> PAT hides who did what behind one address. CGNAT ISPs log port allocations for exactly this reason. When you design PAT for a business, decide up front how you'd answer &ldquo;which machine was it?&rdquo;.</p>`)}
${K.myth([
  ["PAT is a firewall: nothing on the internet can reach us.","Unsolicited inbound traffic finds no translation — a side effect, not a policy. Forwards open the way on purpose, and anything an inside host starts (malware too) works. Filtering is for ACLs and firewalls (Module 8)."],
  ["PAT needs a pool of public addresses.","The interface form uses the uplink's own address — even a DHCP one."],
  ["Every inside host keeps its own source port on the internet.","Only when it's free; otherwise the router picks another (often from 1024 up)."],
  ["Ping can't work through PAT, because ICMP has no ports.","PAT uses the ICMP echo identifier in place of a port."],
  ["clear ip nat translation * resets NAT completely.","It deletes only dynamic translations; config, static entries, forwards and counters stay. It does break every live conversation."],
])}
${K.dodont([
  "Label inside and outside on a drawing before configuring NAT — then check <code>show ip nat statistics</code>.",
  "Use <code>… interface &lt;uplink&gt; overload</code> when the ISP gives one address.",
  "Make &ldquo;NAT access list + <code>ip nat inside</code>&rdquo; part of every new-LAN change.",
  "Forward only needed ports, to fixed-address hosts, from restricted sources.",
],[
  "Don't leave <code>overload</code> off a small pool.",
  "Don't forward RDP, Telnet or admin pages to the internet.",
  "Don't clear all translations on a busy router without warning users.",
  "Don't blame NAT config for an empty table before checking traffic reaches the router.",
])}
${K.check({q:"After adding a new Projects LAN (10.30.40.0/24) on G0/3, its users can't browse; staff on G0/0 can. show ip nat statistics lists Inside interfaces: GigabitEthernet0/0, GigabitEthernet0/3, and the lab's frame log for a Projects ping says the source 'isn't matched by any NAT rule's access list'. What is missing?", o:["ip nat inside on G0/3","ip nat outside on the uplink","A line in the NAT access list permitting 10.30.40.0 0.0.0.255","The overload keyword"], a:2, why:"G0/3 is already inside, and staff traffic proves the outside role and rule. NAT sees the Projects packets but won't translate them: the access list lacks 10.30.40.0/24. Missing overload would show exhaustion, not 'not matched'."})}
<h3>Same logic, new situation</h3>
${K.hint(`For each line, ask which of the five checkpoints — in, list, rule, out, back — it proves broken.`)}
${K.q({type:"match", q:"A handover note lists five NAT faults found at five branch offices. Match each piece of evidence with the fault it proves.", pairs:[
  ["show ip nat statistics: the LAN interface is listed under Outside interfaces","Inside and outside roles swapped"],
  ["Frame log: the source isn't matched by any NAT rule's access list","The access list doesn't cover that subnet"],
  ["Pool line: allocated 4 (100%), misses 37, and %NAT-6-ADDR_ALLOC_FAILURE","Dynamic pool without overload is exhausted"],
  ["Outside interfaces: with nothing listed under it","ip nat outside missing on the uplink"],
  ["A translation row is created, but the ISP router has no route for the pool's addresses","No return route to the inside global"]],
  why:"1. What is asked? Which fault each fingerprint proves. 2. Rule: in, list, rule, out, back — each fails visibly. 3. Apply it: LAN under Outside = swapped; 'not matched' = the list; 100% allocated = needs overload; empty Outside = no out; a row but no reply = no way back. Only the last builds a row."})}

<h2>Interview corner</h2>
${K.hint(`Address versus address-and-port; why offices only get one address; the word Cisco uses.`)}
${K.reveal("“What's the difference between NAT and PAT, and why does almost every network use PAT?”",`<p>"Static and dynamic NAT map addresses — one inside address to one public address. PAT, Cisco's NAT overload, also uses the port, so all inside hosts share one public address: each conversation gets a unique address and port, replies to that port go to the right host, and a clashing port is renumbered; pings use the ICMP identifier. Everyone uses it because ISPs give businesses one address or a few, and one address carries tens of thousands of conversations. On IOS: ip nat inside source list 1 interface g0/1 overload."</p>`)}
${K.hint(`Reproduce, then the table, the statistics, the access list, the logs — in, list, rule, out, back.`)}
${K.reveal("“Users can't reach the internet after someone changed NAT. Walk me through what you'd check.”",`<p>"I reproduce it and find who's affected — everyone, one subnet, some users. On the router, show ip nat translations: is anything built for those hosts? show ip nat statistics: are the LANs under Inside and the uplink under Outside, are misses rising? Wrong roles explain everyone failing. If one subnet has no rows, show access-lists — the NAT list may not cover it, a classic after adding a VLAN. For a pool, 100% allocated and %NAT-6-ADDR_ALLOC_FAILURE mean exhaustion; overload fixes it. If rows appear but replies don't, it's routing back. One fix at a time, retest from the user's PC, note it in the ticket."</p>`)}
${K.hint(`Static TCP entry; fixed inside address; exposure; VPN as the better answer.`)}
${K.reveal("“A customer wants staff to view the office CCTV recorder from home. How would you do it, and what would you warn them about?”",`<p>"The better answer is a VPN: staff join the office network first, then reach the recorder's private address, and nothing is exposed. If they insist on direct access, port forwarding — ip nat inside source static tcp with the recorder's address and port and a public address and port — with the recorder on a fixed address. And I'd warn them a forward publishes the recorder to the whole internet; scanners find it within minutes and recorders are a favourite target, so it must be patched, have a strong unique password and ideally accept only known source addresses through a firewall rule."</p>`)}

${K.recap([
  "PAT (NAT overload) shares one inside global address by making every conversation's address:port unique; pings use the ICMP identifier.",
  "The source port is kept when free, otherwise renumbered (IOS often from 1024 up).",
  "Config = lesson 4's four pieces plus overload: … interface g0/1 overload (follows a DHCP address) or … pool NAME overload.",
  "show ip nat translations: one row per conversation. show ip nat statistics: roles as the router sees them, hits, misses (new conversations), the pool line.",
  "clear ip nat translation * removes dynamic entries only, and breaks live conversations.",
  "Port forwarding = ip nat inside source static tcp|udp local-ip local-port global-ip global-port — it publishes that port to the whole internet.",
  "Troubleshoot in, list, rule, out, back: each fault leaves its own fingerprint.",
])}
${K.next(`<b>Lesson 6 — Time and logs: NTP and syslog.</b> The NAT message carried a <code>*</code> before its timestamp, and the abuse report needed correct times. Next: NTP to agree on the time, syslog to collect messages centrally, and the eight severity levels.`)}
`,
quiz:[
  {lvl:1, q:"What does the overload keyword add to ip nat inside source list 1 pool PUBLIC?", o:["It lets the router use more addresses than the pool contains","It turns dynamic NAT into PAT: many inside hosts share the pool's address, told apart by port","It makes the translations permanent","It translates outside addresses as well as inside ones"], a:1, why:"Without overload, each inside host borrows a whole pool address. With it, the router shares an address among many hosts by rewriting ports as needed — Cisco's name for PAT is NAT overload. It doesn't add addresses, make entries permanent or touch outside addresses."},
  {lvl:1, q:"In a PAT table, what makes each translation unique when every row has the same inside global address?", o:["The MAC address of the inside host","The inside global port number (or ICMP identifier)","The VLAN the host is in","The outside local address"], a:1, why:"Replies are matched on inside global address plus port. With one shared address, the port (or the ICMP echo identifier for pings) is what tells conversations apart. MAC addresses and VLANs never leave the LAN, and many hosts can talk to the same outside address."},
  {lvl:1, q:"A ping is ICMP, which has no port numbers. What does PAT use instead to keep pings from different hosts apart?", o:["The ICMP echo identifier","The TTL field","The IP header checksum","Nothing — PAT cannot translate pings"], a:0, why:"Echo requests carry a 16-bit identifier that the reply copies. PAT treats it like a port: it appears after the colon in show ip nat translations and is renumbered when two hosts use the same value (Windows normally uses 1)."},
  {lvl:1, type:"match", q:"Match each column of show ip nat translations on a PAT router with what it holds.", pairs:[["Pro","tcp, udp or icmp"],["Inside global","The shared public address and the port the internet sees"],["Inside local","The inside host's real private address and port"],["Outside global","The real address and port of the server on the internet"]], why:"Inside global is the inside host as the outside sees it (shared address, unique port); inside local is the host's own address and port; outside local/global hold the far end (the same here, because nothing translates outside addresses). Pro is the protocol — PAT rows are always tcp, udp or icmp."},
  {lvl:2, q:"Based on the exhibit, which host does a reply arriving for 198.51.100.2:1024 go to?", ex:"YAB-EDGE#show ip nat translations\nPro  Inside global         Inside local          Outside local         Outside global\nicmp 198.51.100.2:1        10.44.1.21:1          203.0.113.80:1        203.0.113.80:1\nicmp 198.51.100.2:1024     10.44.1.22:1          203.0.113.80:1        203.0.113.80:1024\nicmp 198.51.100.2:1025     10.44.1.23:1          203.0.113.80:1        203.0.113.80:1025\nTotal number of translations: 3", o:["10.44.1.21","10.44.1.22","10.44.1.23","203.0.113.80"], a:1, why:"Find 198.51.100.2:1024 in the Inside global column: that row's inside local is 10.44.1.22:1, so the router rewrites the destination to 10.44.1.22 with identifier 1. All three PCs used identifier 1; PC1 kept it and the others were renumbered."},
  {lvl:2, type:"fill", q:"Write the global configuration command that makes every source permitted by access list 1 share the address of GigabitEthernet0/1 (which learns its address by DHCP).", fields:[{label:"Command", a:["ip nat inside source list 1 interface g0/1 overload","ip nat inside source list 1 interface gi0/1 overload","ip nat inside source list 1 interface gig0/1 overload","ip nat inside source list 1 interface gigabitethernet0/1 overload","ip nat inside source list 1 interface gigabitethernet 0/1 overload","ip nat inside source list 1 interface ge0/1 overload","ip nat inside source list 1 interface gi 0/1 overload","ip nat inside source list 1 interface g 0/1 overload"], ios:true}], why:"ip nat inside source list 1 interface g0/1 overload. The interface form uses whatever address G0/1 has, so it keeps working when the ISP's DHCP server hands out a new one; overload shares it by port."},
  {lvl:2, type:"fill", q:"Write the command that forwards TCP port 443 arriving at 203.0.113.20 to the inside web server 192.168.5.10 on port 443.", fields:[{label:"Command", a:["ip nat inside source static tcp 192.168.5.10 443 203.0.113.20 443"], ios:true}], why:"ip nat inside source static tcp <inside local> <local port> <inside global> <global port>: the inside address and port come first, then the public ones. The entry exists before any traffic and covers only TCP 443, so the address can still be used for other forwards or PAT."},
  {lvl:2, type:"order", q:"A PC on the inside LAN sends the first packet of a new conversation to an internet server through a PAT router. Put the router's steps in order.", items:["The packet arrives on an interface marked ip nat inside","The router routes it and chooses the exit interface, which is marked ip nat outside","The NAT access list is checked against the packet's source address","The router keeps the source port if free (or picks another), rewrites the source and records the entry","The packet leaves with the shared inside global address and port"], why:"Inside to outside, IOS routes first and translates after (lesson 4's order of operations): arrive on inside, route to an outside exit, check the access list, allocate the port and write the entry, then send. On the way back the order flips: translate first, then route."},
  {lvl:2, type:"multi", q:"After a NAT change, show ip nat translations is empty and show ip nat statistics shows Hits: 0 Misses: 0 although users keep trying. Which two faults could cause exactly this? (Choose two.)", o:["ip nat inside and ip nat outside are swapped","The uplink has no ip nat outside","A dynamic pool without overload has run out of addresses","The ISP has no route back to the PAT address","Two PCs chose the same source port"], a:[0,1], why:"Misses count new conversations NAT tried to translate; 0 means NAT never saw a packet crossing inside→outside — the roles are swapped or the outside role is missing. An exhausted pool shows misses and 100% allocated; a missing return route still builds rows; a port clash is renumbered normally."},
  {lvl:2, q:"What does clear ip nat translation * do on a router with PAT for staff and two port forwards?", o:["Deletes every NAT entry and the NAT configuration","Deletes the dynamic translations; the port forwards, configuration and hit/miss counters stay, and live staff sessions break","Resets only the hit and miss counters","Deletes the port forwards but keeps the staff translations"], a:1, why:"Only dynamic entries are removed. Static entries and forwards come from configuration and stay; counters stay (clear ip nat statistics resets them). Every TCP conversation that was using a cleared entry breaks and has to reconnect."},
  {lvl:2, q:"In show ip nat statistics, the line reads Hits: 21  Misses: 3 after three users each sent one Windows ping. What do the misses represent?", o:["Packets NAT failed to translate","The first packet of each new conversation, which found no entry so NAT created one","Replies that arrived after the translation expired","Pings that timed out"], a:1, why:"A miss is a packet that found no existing translation, so the router had to build one — here, the first echo of each of three conversations. Every other packet (3 more echoes and 4 replies per ping) matched an entry: 3 × 7 = 21 hits. Misses are not errors."},
  {lvl:2, q:"How many TCP conversations can PAT keep apart on one inside global address, in principle?", o:["About 254, one per host on a /24","One per inside host","Up to about 65,000, because the port field is 16 bits","Unlimited, because the outside addresses differ"], a:2, why:"The port number is 16 bits — 65,536 values per protocol on each address (in practice the router avoids some low ports). That's why one address serves a whole office, and why CGNAT can share an address among customers by giving each a port block."},
  {lvl:3, q:"A clinic's router is configured as in the exhibit. Every inside ping now gets a row in show ip nat translations with inside global 192.0.2.42, yet no reply ever arrives. The ISP's router has routes only for its own links. What is wrong?", ex:"ip nat pool ROUTED 192.0.2.42 192.0.2.42 netmask 255.255.255.248\nip nat inside source list 1 pool ROUTED overload\ninterface GigabitEthernet0/1\n ip address 203.0.113.6 255.255.255.248\n ip nat outside", o:["Overload can't be used with a pool","The pool address isn't in the outside interface's subnet, and the ISP has no route sending 192.0.2.42 to this router, so replies are dropped at the ISP","The access list must be extended","ip nat inside is missing on the uplink"], a:1, why:"The rows prove in, list, rule and out all work — translation happens. The reply is addressed to 192.0.2.42, which isn't on the 203.0.113.0/29 link, so the router can't answer ARP for it there; the ISP needs a route for 192.0.2.42 pointing at 203.0.113.6 (or the pool should use spare addresses from the link's subnet). That's the 'back' checkpoint."},
  {lvl:3, q:"Since a router replacement, nobody at a branch can browse. tracert from a PC stops after hop 1, and the exhibit shows the router's NAT statistics. What is the fix?", ex:"BR-EDGE#show ip nat statistics\nTotal active translations: 0 (0 static, 0 dynamic; 0 extended)\nOutside interfaces:\n  GigabitEthernet0/0\nInside interfaces: \n  GigabitEthernet0/1\nHits: 0  Misses: 0\n...\nBR-EDGE#show interfaces description\nInterface                      Status         Protocol Description\nGi0/0                          up             up       STAFF LAN\nGi0/1                          up             up       ISP uplink\nGi0/2                          admin down     down", o:["Add overload to the NAT rule","Configure ip nat inside on G0/0 (STAFF LAN) and ip nat outside on G0/1 (ISP uplink)","Add the staff subnet to the access list","Clear the NAT translations"], a:1, why:"The descriptions show G0/0 is the staff LAN and G0/1 the uplink, but the statistics list them the other way round, and Hits/Misses 0 confirm NAT never translated anything. Swapping the roles fixes it; each ip nat inside/outside command replaces the old role. Hop 1 answers because the gateway is local; the ISP's replies to the private source can't come back."},
  {lvl:3, type:"multi", q:"A Lagos office has 30 staff. The exhibit is from its router at 09:40, when most people say the internet is 'off'. Which two changes would fix it? (Choose two.)", ex:"%NAT-6-ADDR_ALLOC_FAILURE: Address allocation failed; pool 1 may be exhausted [2]\n...\n[Id: 1] access-list 1 pool LAG-PUB refcount 8\n pool LAG-PUB: id 1, netmask 255.255.255.248\n\tstart 203.0.113.11 end 203.0.113.14\n\ttype generic, total addresses 4, allocated 4 (100%), misses 26", o:["Add overload to the rule: ip nat inside source list 1 pool LAG-PUB overload (clearing the table first)","Replace the rule with ip nat inside source list 1 interface <uplink> overload","Add ip nat outside to the LAN interface","Run clear ip nat statistics","Add a static route to the LAN"], a:[0,1], why:"Four addresses lent to four early hosts, 100% allocated, 26 refusals and the allocation-failure message: dynamic NAT without overload. Either overload on the pool or PAT on the uplink's address lets all 30 share. Clearing statistics only resets counters; ip nat outside on the LAN would break NAT; routing isn't the problem."},
  {lvl:3, q:"A security firm wants to view a warehouse's camera recorder (192.168.8.30, web page on TCP 443) from its office. The warehouse already uses 203.0.113.25:443 to publish its order portal, and has no VPN yet. Which plan is best?", o:["ip nat inside source static 192.168.8.30 203.0.113.25, so the recorder gets the whole address","ip nat inside source static tcp 192.168.8.30 443 203.0.113.25 8443, give the recorder a fixed address, keep it patched with a strong password, and allow only the security firm's address through the firewall","Forward TCP 443 to the recorder instead of the portal; customers can use the recorder's page","Turn off PAT so the recorder becomes reachable"], a:1, why:"A static TCP entry on another public port shares the address with the portal (443 stays the portal's). A one-to-one static would take every port, including the portal's; swapping 443 breaks the portal; turning off PAT breaks staff browsing and still publishes nothing. A forward exposes the recorder to the whole internet, so the fixed address, hardening and a source restriction (or a VPN later) matter."},
],
cards:[
  {f:"PAT (NAT overload)", b:"Many inside hosts share one inside global address. Each conversation gets a unique address:port; the router keeps the source port if free, otherwise picks another (IOS often from 1024 up)."},
  {f:"Why PAT and not a dynamic pool", b:"A pool without overload lends one whole public address per host, so it runs out after a few users. PAT serves a whole office from one address — up to tens of thousands of conversations."},
  {f:"ICMP identifier", b:"Pings have no ports. The 16-bit echo identifier, copied into the reply, is used like a port by PAT; it appears after the colon in show ip nat translations. Windows normally uses 1."},
  {f:"PAT on the interface", b:"access-list 1 permit <LAN> <wildcard>; ip nat inside source list 1 interface g0/1 overload; ip nat inside on the LAN, ip nat outside on the uplink. Follows a DHCP-learned address."},
  {f:"PAT on a pool", b:"ip nat pool NAME start end netmask M; ip nat inside source list 1 pool NAME overload. Uses the pool's first address until its ports run out. The ISP must route the pool to you if it isn't in the link's subnet."},
  {f:"Reading a PAT table", b:"One row per conversation. Same inside global address in every row, a different port; inside local = the host's real address:port; outside columns = the server."},
  {f:"Hits and misses", b:"show ip nat statistics. Miss = a packet that found no entry, so one was created (first packet of a conversation). Hit = a packet that matched an existing entry. Misses are not errors."},
  {f:"clear ip nat translation *", b:"Deletes dynamic translations only. Static entries, port forwards, configuration and counters stay. Live sessions break. clear ip nat statistics resets the counters."},
  {f:"Port forwarding", b:"ip nat inside source static tcp|udp <local ip> <local port> <global ip> <global port>. Exists before any traffic (--- in the outside columns). Publishes that port to the whole internet."},
  {f:"NAT checkpoints: in, list, rule, out, back", b:"Arrive on ip nat inside; the access list permits the source; a source list rule (overload if shared); leave by ip nat outside; the world routes the inside global back to you."},
  {f:"Fingerprint: roles swapped or missing", b:"show ip nat statistics lists the LAN under Outside (or nothing under Outside); Hits and Misses stay 0; empty table; tracert stops after the gateway."},
  {f:"Fingerprint: pool exhausted", b:"%NAT-6-ADDR_ALLOC_FAILURE in show logging; pool line allocated 100% with misses rising. Fix: add overload (clear first) or use PAT on the interface."},
  {f:"New LAN, no internet", b:"It needs both ip nat inside on its interface and a line in the NAT access list. Only the ACL line: NAT never sees the packets. Only ip nat inside: NAT sees them but doesn't translate them (not matched), so they leave with the private source."},
],
});

L.push({
id:"svc-ntp-syslog", mins:95, level:"Beginner+ · builds on Module 7 lessons 1–5 and Modules 2, 4 and 5",
t:"NTP and syslog: one clock for the whole network, and logs the NOC can act on",
html:`
${K.goals([
  "Explain why every device needs the same, correct time — logs, certificates, putting events in order — and what NTP's stratum number says about a clock.",
  "Build an NTP hierarchy with <code>ntp server</code> (and <code>ntp master</code> only as a fallback), set <code>clock timezone</code>, and prove it with <code>show ntp status</code>, <code>show ntp associations</code> and the <code>*</code> in <code>show clock</code>.",
  "Read any IOS log message — timestamp, <code>%FACILITY-SEVERITY-MNEMONIC</code>, description — and place it on the eight-level severity ladder.",
  "Send logs to a central syslog server with <code>logging host</code>, choose the <code>logging trap</code> level the NOC needs, and read <code>show logging</code>.",
  "Use synchronised timestamps to put events from several devices in order.",
])}
${K.pre([
  "Module 1: UDP and well-known ports — NTP is UDP 123, syslog UDP 514.",
  "Module 2: the IOS CLI, <code>logging synchronous</code>, SSH remote access.",
  "Modules 4–5: you used <code>show logging | include</code> to find <code>%SW_MATM-4-MACFLAP_NOTIF</code>, <code>%SPANTREE-2-BLOCK_BPDUGUARD</code>, <code>%CDP-4-NATIVE_VLAN_MISMATCH</code> and <code>%OSPF-5-ADJCHG</code>. Here you learn what each part of those messages means and where else they can go.",
  "Module 5: the &lsquo;there and back&rsquo; rule — an NTP or syslog server must be reachable like any other host.",
])}

<h2>Why this matters at work</h2>
<p>Monday, 07:50, at a bank's ${K.g("NOC","Network Operations Centre: the team (and room) that watches the network around the clock, takes alerts and runs incidents.")} in Victoria Island, Lagos. Over the weekend the Kano branch lost its WAN link for eleven minutes and its ATMs went offline. The incident manager wants a timeline.</p>
<p>The Kano router's logs are stamped <code>*Mar 1 1993</code> — its clock reset in a power cut and nobody set it. The HQ core switch says 09:14; the firewall says 10:14, because it shows local time and the switch shows ${K.g("UTC","Coordinated Universal Time: the world reference time every time zone is defined from. Lagos (West Africa Time) is UTC+1 all year.")}. No timeline. And the log server has nothing from Kano: the router's logging level hid exactly the interface messages you needed. This lesson fixes both: <b>one trusted clock everywhere (NTP)</b> and <b>logs that reach the NOC at the right level (syslog)</b>.</p>

<h2>Why time matters — and how NTP shares it</h2>
${K.remember(`<p><b>The rule:</b> every device keeps its own clock, and every clock drifts. NTP lets a device copy the time from a better clock over the network. The <b>stratum</b> counts the copies: <b>a device's stratum is its server's stratum plus one</b>, and 16 means &lsquo;not synchronised — don't take time from me&rsquo;.</p>`)}
<h3>Three reasons the clock matters</h3>
<ul>
<li><b>Logs you can put in order.</b> One outage leaves traces on many devices (a link drop, an OSPF neighbour lost, an HSRP failover); you can only say which caused which if the clocks agree.</li>
<li><b>Security that depends on time.</b> The certificates behind HTTPS and many ${K.g("VPNs","Virtual Private Networks: encrypted tunnels across an untrusted network such as the internet (later modules).")} are valid only between two dates, so a device that thinks it's 1993 rejects them. ${K.g("Kerberos","The login system Windows Active Directory uses. By default it rejects tickets whose time differs from the server's by more than 5 minutes.")} refuses logins when clocks differ by over five minutes.</li>
<li><b>Evidence.</b> Auditors and incident reviews ask &lsquo;exactly when was this changed, and by whom?&rsquo;. A wrong or unsynchronised timestamp is weak evidence.</li>
</ul>
<p>Why not set clocks by hand? They <b>drift</b>: a router's quartz can gain or lose seconds a day, and many switches have no battery-backed clock, restarting from a factory date after every power cut.</p>
${K.dyk(`<p>A Catalyst switch running classic IOS has no battery-backed calendar and boots believing it is <b>1 March 1993</b>; older Cisco routers without a set calendar do the same (newer IOS XE platforms may start from a different factory date). <code>*Mar 1</code> timestamps are the classic sign of a device that has never had NTP.</p>`)}
<h3>How NTP works</h3>
<p>NTP — <b>Network Time Protocol</b> — is client/server on UDP port 123. The client stamps its request; the server notes when it arrived and when it replied; the client notes when the reply came back. From those four timestamps the client works out the <b>delay</b> (the round trip) and the <b>${K.g("offset","How far the client's clock is from the server's, worked out from the four timestamps assuming the trip there takes as long as the trip back.")}</b> (how far its clock is out). It corrects small offsets gradually (it &lsquo;slews&rsquo; the clock), so log times don't leap about; only a large error is stepped in one go. It keeps polling (every 64 seconds at first). On a LAN, clocks typically stay within a few milliseconds.</p>
<p>What makes it scale: <b>a synchronised device can serve time to others</b> — a router following a time server can serve its branch switches. That gives you a tree.</p>
<h3>Stratum: how many steps from a real clock</h3>
<p>All time comes from a <b>reference clock</b>: an atomic clock or a ${K.g("GPS","Global Positioning System: satellites that carry atomic clocks and broadcast their time; a GPS receiver knows the time to within a millionth of a second.")} receiver.</p>
<ul>
<li><b>Stratum 0</b> — the reference clock itself, wired into a server, not on the network.</li>
<li><b>Stratum 1</b> — a server attached to it: a GPS time appliance in your server room, or a national time lab's server.</li>
<li><b>Stratum 2, 3 …</b> — a device synchronised to a stratum N server is N+1, up to 15.</li>
<li><b>Stratum 16</b> — unsynchronised. NTP devices won't take time from it.</li>
</ul>
${K.svg("0 0 760 470",
  K.txt(16,40,"stratum 0",{c:"accent",b:true,s:12})+K.txt(16,120,"stratum 1",{c:"accent",b:true,s:12})+K.txt(16,220,"stratum 2",{c:"accent",b:true,s:12})+K.txt(16,320,"stratum 3",{c:"accent",b:true,s:12})+K.txt(16,410,"stratum 4",{c:"accent",b:true,s:12})+
  K.box(290,16,180,46,"Reference clock","GPS / atomic — not on the network",true)+
  K.dev("server",380,115,"TIME-SRV","GPS appliance")+
  K.dev("router",380,215,"HQ-CORE","ntp server TIME-SRV")+
  K.dev("router",220,315,"BR-1","ntp server HQ-CORE")+K.dev("router",540,315,"BR-2","ntp server HQ-CORE")+
  K.dev("switch",220,405,"BR1-SW","ntp server BR-1")+K.dev("switch",540,405,"BR2-SW","ntp server BR-2")+
  K.arrow(380,62,380,92)+K.arrow(380,166,380,196)+K.arrow(355,266,245,296)+K.arrow(405,266,515,296)+K.arrow(220,366,220,390)+K.arrow(540,366,540,390)+
  K.txt(392,82,"wired",{s:10.5})+K.txt(392,186,"+1",{s:11,c:"fg",b:true})+K.txt(282,290,"+1",{s:11,c:"fg",b:true,end:true})+K.txt(478,290,"+1",{s:11,c:"fg",b:true})+K.txt(232,384,"+1",{s:11,c:"fg",b:true})+K.txt(552,384,"+1",{s:11,c:"fg",b:true})+
  K.txt(600,40,"the real time source",{f:"body",s:11})+K.txt(600,120,"attached to stratum 0",{f:"body",s:11})+K.txt(600,220,"one copy from TIME-SRV",{f:"body",s:11})+K.txt(600,320,"two copies away",{f:"body",s:11})+K.txt(600,410,"three copies away",{f:"body",s:11}),
  "An NTP hierarchy. Time flows down the arrows; each device is its server's stratum plus one. If TIME-SRV fails, everything below it loses its source together — which is why real designs have two or three sources at the top.")}
<p>A lower stratum isn't automatically more accurate — a nearby stratum 3 can beat a distant stratum 1 — but among healthy servers that agree, NTP normally picks the lower stratum (it also weighs each server's delay, dispersion and agreement with the others). A good design is short: two or three internal sources at the top, everything else pointing at them.</p>
${K.analogy(`<p>You set your watch from the banking-hall clock, which the bank sets from the radio time signal: signal 0, hall clock 1, your watch 2 — and a colleague who copies <i>your</i> watch is 3. If the hall clock stops, everyone who copied it slowly drifts apart, and nobody notices until two watches disagree.</p>`)}
${K.check({q:"A branch switch uses ntp server pointing at its branch router. The branch router follows HQ-CORE, and HQ-CORE follows a GPS time appliance. Once everything is synchronised, what stratum does the switch report?", o:["1","2","3","4"], a:3, why:"Count from the source: the GPS appliance is stratum 1 (attached to the stratum 0 GPS signal), HQ-CORE 2, the branch router 3, the switch 4. Each device is its server's stratum plus one."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"DIST-2's show ntp associations has one line marked *~ for server 10.0.0.9, and that line's st column says 3. SW-9 is configured with ntp server pointing at DIST-2. Once both are synchronised, what stratum does DIST-2 report, and what stratum does SW-9 report?", fields:[{label:"DIST-2 stratum", a:["4"]},{label:"SW-9 stratum", a:["5"]}], why:"1. What is asked? Two stratum numbers further down a chain. 2. Which rule? Your stratum = your server's stratum + 1; the st column in show ntp associations is the server's own stratum. 3. Apply it: 10.0.0.9 is 3, so DIST-2 (following it) is 4, and SW-9 (following DIST-2) is 5. You never need to know what is above 10.0.0.9."})}

<h2>NTP on Cisco IOS: ntp server, ntp master and the clock</h2>
${K.remember(`<p><b>The rule:</b> <code>ntp server &lt;address&gt;</code> makes a device a <b>client</b> of that server — and, once synchronised, a server for anyone below it. <code>ntp master [stratum]</code> makes a device trust <b>its own clock</b> and announce itself as synchronised at that stratum: use it only where there is no better source, with a high number so real servers win.</p>`)}
<div class="tablewrap"><table>
<tr><th>Command</th><th>Mode</th><th>What it does</th></tr>
<tr><td><code>ntp server 10.40.50.5</code></td><td>global config</td><td>Poll this server and synchronise to it; add two or three for redundancy (<code>prefer</code> favours one). Remove with <code>no ntp server 10.40.50.5</code>.</td></tr>
<tr><td><code>ntp master [1–15]</code></td><td>global config</td><td>Treat the local clock as authoritative at that stratum (default 8).</td></tr>
<tr><td><code>clock timezone WAT 1</code></td><td>global config</td><td>Display name and offset from UTC: hours, then optional minutes (<code>clock timezone IST 5 30</code>). NTP itself works in UTC. ${K.g("WAT","West Africa Time: UTC+1, used by Nigeria all year, with no daylight-saving change.")} needs no <code>clock summer-time</code> line.</td></tr>
<tr><td><code>clock set 14:05:00 12 Oct 2026</code></td><td>privileged EXEC</td><td>Set the clock by hand — a stopgap before NTP (not modelled in this lab).</td></tr>
<tr><td><code>ntp update-calendar</code></td><td>global config</td><td>Copy NTP time into the battery-backed calendar, so a reboot starts close to right.</td></tr>
<tr><td><code>show ntp status</code> · <code>show ntp associations</code> · <code>show clock [detail]</code></td><td>privileged EXEC</td><td>Verify: synchronised or not, which server, what stratum, what the clock says.</td></tr>
</table></div>
<h3>Worked example: Abuja HQ and its branch</h3>
<p>ABJ-CORE's Gi0/0 faces the ISP, which runs a time server at 203.0.113.123. The branch router ABJ-BR1 reaches ABJ-CORE over the WAN link 10.1.0.0/30 (ABJ-CORE is 10.1.0.1). Plan: ABJ-CORE follows the ISP; ABJ-BR1 follows ABJ-CORE; both display West Africa Time.</p>
${K.steps([
  ["Look before you touch","On ABJ-BR1, <code>show clock</code> says <code>*08:30:00.000 UTC Mon Oct 12 2026</code>: the <code>*</code> means nothing has vouched for this time. <code>show ntp status</code> says <code>%NTP is not enabled.</code>"],
  ["Core to the outside source","<code>ABJ-CORE(config)#ntp server 203.0.113.123</code>, <code>clock timezone WAT 1</code>."],
  ["Branch to the core","<code>ABJ-BR1(config)#ntp server 10.1.0.1</code>, <code>clock timezone WAT 1</code>. Why not the ISP directly? Only the core then needs UDP 123 to the internet, and every device's time comes from one place you control; add the high-stratum <code>ntp master</code> fallback from later in this section on the core and, if the internet fails, every device keeps agreeing with it instead of drifting apart."],
  ["Verify from the bottom","<code>show ntp associations</code> and <code>show ntp status</code> on ABJ-BR1 (below). Real routers take a few minutes — NTP wants several good replies first. The lab is instant."],
  ["Read the clock","<code>09:30:00.000 WAT Mon Oct 12 2026</code>: no <code>*</code>, and the hour has moved by the offset."],
])}
${K.out(`ABJ-BR1#show ntp associations
  address         ref clock       st   when   poll reach  delay  offset   disp
*~10.1.0.1        203.0.113.123    3     14     64   377  1.000   0.000  0.123
 * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured
ABJ-BR1#show ntp status
Clock is synchronized, stratum 4, reference is 10.1.0.1
nominal freq is 250.0000 Hz, actual freq is 250.0000 Hz, precision is 2**10
...
clock offset is 0.0000 msec, root delay is 1.00 msec
root dispersion is 7.55 msec, peer dispersion is 0.12 msec`, "ABJ-BR1 in the lab (trimmed). The ISP's server is stratum 2, so ABJ-CORE is 3 and ABJ-BR1 is 4. Real routers show real, uneven offsets and delays.")}
<ul>
<li><b>The marks in front</b> — <code>*</code> the <b>sys.peer</b> (the server in use), <code>~</code> configured, <code>+</code> a healthy candidate (backup), <code>-</code> outlyer and <code>x</code> falseticker (rejected because their time disagrees), <code>#</code> selected.</li>
<li><b>ref clock</b> — what <i>that server</i> follows: an address, <code>.GPS.</code> for a GPS appliance, or <code>.INIT.</code> (${K.g("INIT","Initialising: the server hasn't answered yet, so NTP can't say what it follows.")}) if it has never answered. <b>st</b> — the server's stratum (3), one less than yours.</li>
<li><b>when / poll</b> — seconds since the last reply, and between polls. <b>reach</b> — the last eight polls in ${K.g("octal","Base 8, three bits per digit: 377 octal is 11111111 binary — eight successful polls in a row.")}: <b>377</b> all answered, <b>0</b> none.</li>
<li><b>show ntp status, first line</b> — the answer: synchronised, at which stratum, following whom. Unsynchronised reads <code>Clock is unsynchronized, stratum 16, no reference clock</code>. Root delay and dispersion add up delay and uncertainty back to stratum 1.</li>
</ul>
<h3>The <code>*</code> and the <code>.</code> in show clock</h3>
<ul>
<li><code>*08:30:00.000 UTC …</code> — <b>not authoritative</b>: typically never synchronised. Log timestamps carry the same <code>*</code>.</li>
<li><code>.09:30:00.000 WAT …</code> — authoritative, but NTP is <b>not synchronised now</b>: typically it <b>was</b> synchronised and has lost its source — close, but drifting from now on.</li>
<li>No symbol — authoritative: synchronised now (or set by hand, or from a trusted calendar). <code>show clock detail</code> adds <code>Time source is NTP</code> or <code>hardware calendar</code>.</li>
</ul>
<h3>ntp master: when there is no better clock</h3>
<p>A factory floor, an isolated lab, a site cut off for a week: their devices must still <i>agree with each other</i>, even if the shared time is slightly wrong. <code>ntp master 5</code> on one router makes it announce &lsquo;synchronised, stratum 5&rsquo; from its own clock, which <code>show ntp associations</code> lists as <code>127.127.1.1</code>, ref clock <code>.LOCL.</code> (${K.g("LOCL","Local: the router's own clock, used because of ntp master.")}), one stratum lower (4).</p>
<p>It also makes a good <b>fallback</b>. A router with <code>ntp server 10.40.50.5</code> (a stratum 1 appliance) <i>and</i> <code>ntp master 10</code> follows the appliance at stratum 2; if the appliance dies, it carries on at stratum 10 and everything below keeps agreeing.</p>
${K.mistake(`Putting <code>ntp master</code> on every router &lsquo;so they all have time&rsquo;. Each then trusts its own drifting quartz and the logs disagree again within weeks. One or two masters at most, with a high stratum, and <code>ntp server</code> everywhere else.`)}
${K.mistake(`Configuring <code>ntp server</code> with an address the device can't reach — a renumbered server, or no route back to the client. Nothing complains: the server sits in <code>show ntp associations</code> as <code>.INIT.</code>, stratum 16, reach 0, and <code>show clock</code> keeps its <code>*</code>. NTP needs replies, so routes are needed both ways.`)}
${K.when([
  ["ntp server (internal source)","Every ordinary router and switch","Short, controlled chain; only the top needs outside access","The device IS the top of your tree"],
  ["ntp server (external source)","The two or three devices at the top","Real, traceable time","You have a GPS appliance, or can't allow UDP 123 out"],
  ["ntp master &lt;high stratum&gt;","No outside source, or as a fallback at the top","Devices keep agreeing when the real source is gone","On more than one or two devices"],
], "Where does this device get its time?")}
${K.tip(`At work you'll also see NTP <b>authentication</b> (<code>ntp authenticate</code>, <code>ntp authentication-key 1 md5 &lt;key&gt;</code>, <code>ntp trusted-key 1</code>, <code>key 1</code> on the server line) so a device only accepts time from servers that know the key. A fake time source can break certificates or hide an attacker's tracks — time is a security service.`)}
${K.exam(`Expect stratum arithmetic, <code>*</code> in <code>show clock</code>, <code>show ntp status</code> as the proof, UDP 123 and <code>ntp master</code>'s default stratum (8). Trap: <code>ntp server X</code> makes the device a <b>client</b> of X.`)}
<h3>Try it: one time for an isolated site</h3>
<p>Maiduguri field office: no internet or GPS yet, but the router, switches and camera recorder must agree on the time. MD-R1 becomes the site's source.</p>
${K.hint(`Stratum 16 already means &lsquo;unsynchronised&rsquo;. The local clock's line in <code>show ntp associations</code> is one stratum below the master's.`)}
${K.term({env:"ios2", title:"MD-R1 — make the router the site's time source", opts:{kind:"router", host:"MD-R1", model:"ISR4331", motd:"MD-R1 — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description FIELD LAN","ip address 10.77.10.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>: the NTP configuration needs the privileged prompt (<code>#</code>).",
  tasks:[
    {text:"Read the starting point: <code>show clock</code> and <code>show ntp status</code>. What do the <code>*</code> and the NTP message tell you?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+clo/i.test(h)) && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ntp\s+st/i.test(h))},
    {text:"In global configuration, try <code>ntp master 16</code> and read IOS's answer — why can't a master be stratum 16? Then make MD-R1 the site's source at stratum 5 with <code>ntp master 5</code>", done:e=>e.ntpMaster===5 && e.history.some(h=>/^\s*ntp\s+mas\S*\s+16\s*$/i.test(h))},
    {text:"Set <code>clock timezone WAT 1</code>, leave configuration mode, then read <code>show ntp status</code> (stratum? reference?) and <code>show ntp associations</code> (what is 127.127.1.1, and why is its <i>st</i> 4?)", done:e=>!!e.tz && e.tz.name==="WAT" && e.tz.h===1 && e.log.some(l=>/sh\S*\s+ntp\s+ass/i.test(l.cmd) && /127\.127\.1\.1/.test(l.out))},
    {text:"<code>show clock</code> once more — no <code>*</code>, and West Africa Time — then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.log.some(l=>/sh\S*\s+clo/i.test(l.cmd) && /^\d\d:\d\d:\d\d\.\d+ WAT/.test(l.out))},
  ],
  win:"MD-R1 now vouches for its own clock at stratum 5, so the site's switches and recorder can follow it (they'll be stratum 6) and their logs will agree. It is still only as right as MD-R1's quartz: when the satellite link arrives, add ntp server lines and keep ntp master as a high-stratum fallback.",
  solve:["enable","show clock","show ntp status","configure terminal","ntp master 16","ntp master 5","clock timezone WAT 1","end","show ntp status","show ntp associations","show clock","copy running-config startup-config",""]})}
${K.check({q:"On R5, show ntp associations lists ' ~10.9.0.1  .INIT.  16  -  64  0' and show clock starts with '*'. What does this tell you?", o:["R5 is synchronised to 10.9.0.1 at stratum 16","10.9.0.1 is configured but has never answered R5 — check the address and that R5 and 10.9.0.1 can reach each other both ways","10.9.0.1 is a falseticker that NTP rejected","R5 is an NTP master"], a:1, why:"The ~ says configured; .INIT., stratum 16 and reach 0 say no reply has ever arrived; the * on the clock agrees that nothing has vouched for the time. Check the server address (a renumbered server?) and the routes there and back, then UDP 123 filtering."})}
<h3>Same logic, new situation</h3>
<p>BR-7 has <code>ntp server 10.0.0.1</code> (a router that is itself stratum 3) and <code>ntp server 10.0.0.2</code> (a stratum 1 GPS appliance). Both answer. Which does BR-7 follow, at what stratum — and what does <code>show clock</code> show if both later stop answering?</p>
${K.hint(`What would BR-7's stratum be through each server? Then remember what the <code>.</code> in <code>show clock</code> means.`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Which server wins, BR-7's stratum, and its clock after losing both. <b>2. Which rule?</b> Your stratum is your server's plus one, and NTP normally prefers the lower stratum when both servers are healthy and agree. <b>3. Apply it.</b> Through 10.0.0.1 BR-7 would be stratum 4; through 10.0.0.2, stratum 2 — so it follows 10.0.0.2 (<code>*</code>) and keeps 10.0.0.1 as a candidate (<code>+</code>). If both die with no <code>ntp master</code> fallback, it becomes unsynchronised, and because it <i>was</i> synchronised, <code>show clock</code> starts with <code>.</code>, not <code>*</code>.</p>`)}
<h3>Hands-on: the Ibadan time chain</h3>
<p>Ibadan has a GPS time appliance; the Ogbomosho branch still points at a pre-renumbering address. Build the chain, watch each stratum appear, then pull the plug on the top.</p>
${K.bench({id:"m7-ntp-tree", points:100, from:"CCNA · Module 7 · lesson 6", title:"Ibadan time chain — fix the branch, build the hierarchy, watch the stratum change", viewBox:"0 0 800 200",
  intro:"Console cable on OG-R2: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secrets. <b>Design:</b> TIME-SRV 10.40.50.5 is a stratum 1 GPS appliance on IB-R1's server LAN (10.40.50.0/24, IB-R1 .1); WAN 10.40.255.0/30 (IB-R1 .1, OG-R2 .2). IB-R1 follows TIME-SRV, OG-R2 follows IB-R1, both display WAT. <b>Ticket:</b> &ldquo;Every OG-R2 log line starts with *.&rdquo; <b>Lab notes:</b> NTP synchronises instantly here (real routers take a few minutes, and several missed polls to give a server up). TIME-SRV has no panel.",
  devices:[
    {id:"ts", kind:"server", label:"TIME-SRV", x:20, y:60, ip:"10.40.50.5", mask:"255.255.255.0", gw:"10.40.50.1", services:{ntp:{stratum:1, ref:".GPS."}}},
    {id:"ib", kind:"router", label:"IB-R1", x:160, y:60, config:e=>{ ["en","conf t","hostname IB-R1","no ip domain-lookup","int g0/0","description SERVER LAN - TIME-SRV","ip address 10.40.50.1 255.255.255.0","no shut","int g0/1","description WAN to OG-R2","ip address 10.40.255.1 255.255.255.252","no shut","exit","ip route 10.40.20.0 255.255.255.0 10.40.255.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"og", kind:"router", label:"OG-R2", x:400, y:60, config:e=>{ ["en","conf t","hostname OG-R2","no ip domain-lookup","int g0/0","description OGBOMOSHO LAN","ip address 10.40.20.1 255.255.255.0","no shut","int g0/1","description WAN to IB-R1","ip address 10.40.255.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.40.255.1","ntp server 10.40.99.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:660, y:60},
  ],
  cables:[ {type:"cat6", a:"ts:eth", b:"ib:g0"}, {type:"cat6", a:"ib:g1", b:"og:g1"}, {type:"console", a:"lap:usb", b:"og:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On OG-R2: <code>enable</code>, then <code>show clock</code> (what does the leading <code>*</code> mean?) and <code>show ntp associations</code>. Which server is OG-R2 trying, what are its stratum and <i>reach</i> — and is that address anywhere in the design?", done:B=>{ const h = B.devs.og.env.history; return h.some(x=>/^\s*(do\s+)?sh\S*\s+clo/i.test(x)) && h.some(x=>/^\s*(do\s+)?sh\S*\s+ntp\s+ass/i.test(x)); }},
    {text:"Move the console cable to IB-R1. Make it a client of TIME-SRV with <code>ntp server 10.40.50.5</code>, then read <code>show ntp associations</code> (TIME-SRV's stratum?) and <code>show ntp status</code> (IB-R1's stratum?). Save with <code>copy running-config startup-config</code>", done:B=>{ const e = B.devs.ib.env; return e.ntpServers.includes("10.40.50.5") && e.ntpMaster==null && Bench.ntpSynced(B,"ib") && e.history.some(x=>/sh\S*\s+ntp\s+st/i.test(x)) && !!e.savedOnce; }},
    {text:"Back on OG-R2: remove the stale server with <code>no ntp server 10.40.99.1</code> and follow IB-R1's WAN address with <code>ntp server 10.40.255.1</code>. Done when OG-R2's <code>show ntp status</code> says synchronized at stratum 3", done:B=>{ const e = B.devs.og.env; return e.ntpServers.length===1 && e.ntpServers[0]==="10.40.255.1" && Bench.ntpSynced(B,"og") && e.log.some(l=>/Clock is synchronized, stratum 3/.test(l.out)); }},
    {text:"Set OG-R2 to display West Africa Time with <code>clock timezone WAT 1</code>, then <code>show clock</code>: the <code>*</code> has gone and the hour has moved. Save OG-R2", done:B=>{ const e = B.devs.og.env; return !!e.tz && e.tz.name==="WAT" && e.tz.h===1 && !!e.savedOnce && e.log.some(l=>/sh\S*\s+clo/i.test(l.cmd) && /^\d\d:\d\d:\d\d\.\d+ WAT/.test(l.out)); }},
    {text:"Failure drill: unplug TIME-SRV's cable (its power supply has &lsquo;failed&rsquo;). On OG-R2, run <code>show ntp status</code> and <code>show clock</code> — what does the leading <code>.</code> mean, and why did a fault two hops away reach the branch? Then plug a Cat6 from TIME-SRV back into IB-R1 G0/0 and confirm OG-R2 is synchronised again", done:B=>B.devs.og.env.log.some(l=>/sh\S*\s+clo/i.test(l.cmd) && /^\./.test(l.out)) && Bench.up(B,"ts:eth","ib:g0") && Bench.ntpSynced(B,"og")},
  ],
  win:"You built a three-level chain — TIME-SRV at stratum 1, IB-R1 at 2, OG-R2 at 3 — and watched each number appear only once the level above it was synchronised. The stale server sat at .INIT., stratum 16, reach 0 without a single error message. And when the top failed, the branch lost sync too: '.' means 'I was right, but nobody vouches for me now'. That's why real designs put two or three sources at the top (or an ntp master fallback with a high stratum).",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show clock"],["term","show ntp associations"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ib:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","ntp server 10.40.50.5"],["term","end"],["term","show ntp associations"],["term","show ntp status"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","og:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","no ntp server 10.40.99.1"],["term","ntp server 10.40.255.1"],["term","end"],["term","show ntp status"],
    ["term","configure terminal"],["term","clock timezone WAT 1"],["term","end"],["term","show clock"],["term","copy running-config startup-config"],["term",""],
    ["unplug","ts:eth"],["term","show ntp status"],["term","show clock"],["plug","cat6","ts:eth","ib:g0"],["term","show ntp status"]]})}
${K.hint(`Task 1: 10.40.99.1 isn't in the design — it's the old address. Task 3: OG-R2 must use an IB-R1 address it can reach: IB-R1's end of the WAN, 10.40.255.1. Task 5: <code>*</code> = never synchronised; <code>.</code> = was synchronised, lost its source.`)}

<h2>Reading a log message: %FACILITY-SEVERITY-MNEMONIC</h2>
${K.remember(`<p><b>The rule:</b> every IOS message has the same shape — <b>when</b>, <b>which feature</b>, <b>how serious</b>, <b>which event</b>, <b>details</b> — and the digit in the middle is the <b>severity: 0 is the worst, 7 the most trivial</b>. You don't need to have seen a message to know how serious IOS thinks it is.</p>`)}
<p>You've seen these since Module 2: <code>%SYS-5-CONFIG_I</code> when you leave configuration mode, <code>%LINK-3-UPDOWN</code> when a port comes up. They are <b>syslog</b> messages — syslog is both the format and the protocol for sending them to a log server.</p>
${K.svg("0 0 760 210",
  K.band(10,28,160,32,"*Oct 12 08:31:10.370:")+K.band(176,28,58,32,"%LINK")+K.band(238,28,40,32,"-3-")+K.band(282,28,76,32,"UPDOWN:")+K.band(364,28,390,32,"Interface GigabitEthernet0/2, changed state to up")+
  K.arrow(90,62,90,84)+K.arrow(205,62,205,84)+K.arrow(258,62,258,134)+K.arrow(320,62,320,84)+K.arrow(559,62,559,84)+
  K.txt(90,100,"timestamp",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(90,116,"* = clock not in sync",{mid:true,f:"body",s:10.5})+
  K.txt(205,100,"facility",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(205,116,"the feature",{mid:true,f:"body",s:10.5})+
  K.txt(258,150,"severity",{mid:true,c:"accent",b:true,f:"body",s:11.5})+K.txt(258,166,"0–7: 3 = errors",{mid:true,f:"body",s:10.5})+
  K.txt(320,100,"mnemonic",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(320,116,"event code",{mid:true,f:"body",s:10.5})+
  K.txt(559,100,"description",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(559,116,"the details, in words",{mid:true,f:"body",s:10.5})+
  K.txt(380,198,"Every Cisco message: timestamp: %FACILITY-SEVERITY-MNEMONIC: description",{mid:true,f:"body",s:11,c:"fg"}),
  "Anatomy of an IOS log message. The severity digit is the part you can act on without knowing the message: it decides where the message is sent.")}
<ul>
<li><b>Timestamp</b> — from <code>service timestamps log datetime msec</code>, on by default in current IOS. A leading <code>*</code> = clock not synchronised. <code>service sequence-numbers</code> adds a running number (<code>000123:</code>) so gaps show lost messages.</li>
<li><b>%FACILITY</b> — the part of IOS that raised it: <code>LINK</code> (physical interface), <code>LINEPROTO</code> (line protocol, Layer 2), <code>SYS</code> (configuration, reloads), <code>OSPF</code>, <code>HSRP</code>, <code>DHCP</code>, <code>SPANTREE</code>, <code>SW_MATM</code> (MAC table).</li>
<li><b>${K.g("MNEMONIC","A short, memorable code word; in a Cisco message it names the exact event.")}</b> — the exact event: <code>UPDOWN</code>, <code>CHANGED</code>, <code>CONFIG_I</code>, <code>ADJCHG</code>. Facility plus mnemonic is what you search Cisco's documentation for.</li>
<li><b>Description</b> — the details: which interface, neighbour or user.</li>
</ul>
${K.mistake(`Mixing up two &lsquo;facilities&rsquo;. In the message text, Cisco's facility is the feature (<code>LINK</code>, <code>OSPF</code>). The syslog <i>protocol</i> also carries a facility field that servers sort by — IOS sends <code>local7</code> by default (<code>logging facility</code> changes it). An exam question about &lsquo;the facility in %OSPF-5-ADJCHG&rsquo; means OSPF.`)}
<h3>The eight severity levels</h3>
${K.svg("0 0 760 330",
  K.txt(20,26,"level",{f:"body",s:10.5})+K.txt(70,26,"IOS keyword",{f:"body",s:10.5})+K.txt(235,26,"meaning",{f:"body",s:10.5})+K.txt(430,26,"you will see, e.g.",{f:"body",s:10.5})+K.txt(748,26,"trap warnings",{f:"body",s:10.5,end:true})+
  [["0","emergencies","system unusable","(rare)"],["1","alerts","act immediately","(rare)"],["2","critical","critical condition","%SPANTREE-2-BLOCK_BPDUGUARD"],["3","errors","error condition","%LINK-3-UPDOWN"],["4","warnings","warning condition","%CDP-4-NATIVE_VLAN_MISMATCH"],["5","notifications","normal but significant","%LINEPROTO-5-UPDOWN · %SYS-5-CONFIG_I"],["6","informational","for information","%DHCP-6-ADDRESS_ASSIGN"],["7","debugging","debug output","output of debug commands"]]
  .map((r,i)=>{ const y = 38+i*32; return K.band(20,y,40,26,r[0],i<=4?"var(--chip)":"var(--panel2)")+K.band(70,y,150,26,r[1],i<=4?"var(--chip)":"var(--panel2)")+K.txt(235,y+17,r[2],{f:"body",s:11,c:"fg"})+K.txt(430,y+17,r[3],{s:10})+K.txt(748,y+17,i<=4?"sent":"not sent",{end:true,s:10.5,c:i<=4?"ok":"bad",b:true}); }).join("")+
  K.link(14,197,752,197,"",true)+
  K.txt(380,312,"Lower number = more severe. A level setting means: this number and every number below it.",{mid:true,f:"body",s:11,c:"fg"}),
  "The severity ladder (RFC 5424 levels with their IOS keywords). The dashed line shows logging trap warnings: levels 0–4 go to the syslog server, 5–7 stay behind.")}
${K.remember(`<p><b>&ldquo;Every Awesome Cisco Engineer Will Need Ice cream Daily&rdquo;</b> — <b>E</b>mergencies 0, <b>A</b>lerts 1, <b>C</b>ritical 2, <b>E</b>rrors 3, <b>W</b>arnings 4, <b>N</b>otifications 5, <b>I</b>nformational 6, <b>D</b>ebugging 7. <b>The lower the number, the louder the alarm.</b></p>`)}
<p>Severity belongs to the <b>type of message</b>, not the outcome: <code>%LINK-3-UPDOWN</code> is level 3 whether the interface went down <i>or came back up</i>. When you shut a port yourself, IOS logs <code>%LINK-5-CHANGED … administratively down</code> at 5 — deliberate, not a failure. The bench router from later in this lesson, after <code>shutdown</code> then <code>no shutdown</code> on a spare port:</p>
${K.out(`KN-R1(config-if)#shutdown
Oct 12 08:31:24.644: %LINK-5-CHANGED: Interface GigabitEthernet0/2, changed state to administratively down
Oct 12 08:31:31.781: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/2, changed state to down
KN-R1(config-if)#no shutdown
Oct 12 08:31:38.918: %LINK-3-UPDOWN: Interface GigabitEthernet0/2, changed state to up
Oct 12 08:31:45.055: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/2, changed state to up
KN-R1(config-if)#end
KN-R1#
Oct 12 08:31:52.192: %SYS-5-CONFIG_I: Configured from console by console`, "From the lab (its message times step about 7 seconds apart; a real router logs them a second or two apart). No * before the timestamps: this router is synchronised by NTP.")}
<p>Layer 1 down on purpose (5), Layer 2 follows (5); Layer 1 back (3 — the message a cable failure gives, with &lsquo;down&rsquo;); then <code>CONFIG_I</code> (5), which over SSH names the user and address: <code>Configured from console by admin on vty0 (10.20.0.15)</code>.</p>
${K.dyk(`<p>The hex in <code>show ntp status</code> — <code>reference time is EE771908.3F5C28F6</code> — is the real NTP timestamp: seconds since <b>1 January 1900</b>, then fractions. Those 32 bits of seconds run out on 7 February 2036, when a new &lsquo;era&rsquo; begins; NTPv4 (RFC 5905) is designed to cope.</p>`)}
${K.check({q:"Which of these messages does IOS consider the most severe?", o:["%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed state to down","%LINK-3-UPDOWN: Interface Gi0/1, changed state to down","%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.","%DHCP-6-ADDRESS_ASSIGN: Interface Gi0/0 assigned DHCP address 203.0.113.2, mask 255.255.255.248, hostname EDGE"], a:2, why:"Read only the digit after the facility: 5, 3, 2, 6. The lowest number is the most severe, so the BPDU guard message (2, critical) wins — a port has just been shut down by the switch itself."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A router sends to its syslog server at trap level errors. These messages are new to you. Which two reach the server? (Choose two.)", o:["%SYS-2-MALLOCFAIL: Memory allocation of 65536 bytes failed","%SEC_LOGIN-5-LOGIN_SUCCESS: Login Success [user: admin] [Source: 10.20.0.15]","%BGP-3-NOTIFICATION: sent to neighbor 198.51.100.9 4/0 (hold time expired)","%IP-4-DUPADDR: Duplicate address 10.8.1.1 on GigabitEthernet0/0","%SSH-5-SSH2_SESSION: SSH2 Session request from 10.20.0.15 (tty = 0)"], a:[0,2], why:"1. What is asked? Which messages pass a filter. 2. Which rule? errors is level 3, and a level means that number and every lower one, so only digits 0–3 pass. 3. Apply it — read the digits, not the words: MALLOCFAIL is 2 and BGP NOTIFICATION is 3 (the word 'NOTIFICATION' in its name is not its severity), so both go; DUPADDR is 4, LOGIN_SUCCESS and SSH2_SESSION are 5, so they stay on the router."})}

<h2>Where messages go: console, terminal, buffer and the syslog server</h2>
${K.remember(`<p><b>The rule:</b> IOS copies each message to several places, and <b>each place has its own level</b>. A message goes there when its severity number is <b>at or below</b> that level — the level you name and everything more severe. One place's level never changes another's.</p>`)}
<div class="tablewrap"><table>
<tr><th>Destination</th><th>Command</th><th>Default</th><th>What to know</th></tr>
<tr><td><b>Console</b></td><td><code>logging console &lt;level&gt;</code></td><td>debugging (7)</td><td>With <code>debug</code> on a busy router it can flood the CPU; many teams set <code>logging console warnings</code>.</td></tr>
<tr><td><b>Terminal</b> (SSH/Telnet)</td><td><code>logging monitor &lt;level&gt;</code> + <code>terminal monitor</code> in the session</td><td>debugging, shown only after <code>terminal monitor</code></td><td>Why an SSH session shows no messages.</td></tr>
<tr><td><b>Buffer</b> (RAM)</td><td><code>logging buffered [size] [level]</code></td><td>on at debugging on current kit; size varies</td><td>What <code>show logging</code> lists. Circular; lost at reload.</td></tr>
<tr><td><b>Syslog server</b></td><td><code>logging host &lt;ip&gt;</code> + <code>logging trap &lt;level&gt;</code></td><td>trap informational (6)</td><td>UDP 514, one-way. Several hosts = several servers, same trap level.</td></tr>
</table></div>
<p>(Events can also go out as SNMP traps — ${K.g("SNMP","Simple Network Management Protocol: how monitoring systems read device status and receive alerts (lesson 7).")} is lesson 7. Despite its name, <code>logging trap</code> sets the <b>syslog server</b> level.) <code>logging host 10.60.0.25</code> and the older <code>logging 10.60.0.25</code> both work; <code>logging trap 4</code> is stored as <code>logging trap warnings</code>. Moving to a new server? Add it, then <code>no logging host</code> the old one — otherwise the router sends to both.</p>
<h3>Worked example: Port Harcourt to the NOC</h3>
<p>PH-R1 runs a Trans-Amadi office for a retailer with 400 sites; the NOC's syslog server is 10.60.0.25. Small-site policy: <b>warnings and worse to the NOC; routine messages stay in the router's buffer</b> — at 400 sites, level 5 and 6 chatter would bury the problems.</p>
${K.steps([
  ["Prove the path","<code>ping 10.60.0.25</code> from PH-R1. Syslog is one-way, so the router will never tell you its messages go nowhere."],
  ["Name the server and the level","<code>logging host 10.60.0.25</code>, <code>logging trap warnings</code>: levels 0–4 — interface failures (3), CDP and MAC-flap warnings (4). Not sent: <code>LINEPROTO-5</code>, <code>CONFIG_I</code>, DHCP."],
  ["Keep a local copy, pick a time convention (real IOS)","<code>logging buffered 64000 informational</code> keeps 0–6 in RAM (the lab accepts it but reports its default buffer). Logs are stamped in UTC unless you add <code>localtime</code>: <code>service timestamps log datetime msec localtime show-timezone</code> gives <code>Oct 12 09:31:10.370 WAT:</code>."],
  ["Verify","<code>show logging</code>: the Trap logging level and a <code>Logging to 10.60.0.25</code> block."],
])}
${K.out(`KN-R1#show logging
Syslog logging: enabled (0 messages dropped, 0 messages rate-limited, 0 flushes, 0 overruns, xml disabled, filtering disabled)
...
    Console logging: level debugging, 15 messages logged, xml disabled,
...
    Buffer logging:  level debugging, 15 messages logged, xml disabled,
...
    Trap logging: level notifications, 5 message lines logged
        Logging to 192.168.50.20  (udp port 514, audit disabled,
              link up),
              5 message lines logged,
...
Log Buffer (8192 bytes):

Oct 12 08:31:24.644: %LINK-5-CHANGED: Interface GigabitEthernet0/2, changed state to administratively down
...`, "The lab router from the second bench, at the end (trimmed). Real IOS prints the same blocks.")}
<ul>
<li><b>Console / Buffer logging: level …</b> — each destination's own level (default debugging).</li>
<li><b>Trap logging: level notifications, 5 message lines logged</b> — the syslog server level: 0–5 are sent. The count is of messages that passed the trap level when they happened: only the last test event's five, because at <code>critical</code> the earlier ten were held back.</li>
<li><b>Logging to 192.168.50.20 … 5 message lines logged</b> — one block per <code>logging host</code>. It proves the router <i>sent</i> them, not that anyone received them.</li>
<li><b>Log Buffer</b> — the messages, oldest first; filter with <code>| include</code> as in Modules 4–5.</li>
</ul>
${K.when([
  ["informational (6) — the default","Most networks, with a server sized for it","Keeps DHCP, NAT and other routine events for investigations","The server can't take the volume"],
  ["notifications (5)","The NOC wants every link, config and neighbour change, but not routine information","CONFIG_I, LINEPROTO and OSPF/HSRP changes are level 5","You rely on informational messages in investigations"],
  ["warnings (4) or errors (3)","Huge estates, or tiny sites where only problems should reach the centre","Only things going wrong","You need config-change evidence (CONFIG_I is 5)"],
  ["debugging (7)","Briefly, while debugging, usually to the buffer only","Everything","As the permanent trap level"],
], "Which logging trap level?")}
${K.exam(`How to read a logging question: <b>1. Turn every keyword into its number</b> (warnings = 4). <b>2. Find the digit</b> in each message (<code>%LINEPROTO-5-…</code> = 5). <b>3. Apply &lsquo;at or below&rsquo;</b>. Traps: <code>logging trap warnings</code> sends 0–4, not &lsquo;only warnings&rsquo;; a word inside a mnemonic (<code>BGP-3-NOTIFICATION</code>) isn't its severity; and <code>logging console</code> says nothing about what reaches the server.`)}
${K.mistake(`Setting <code>logging trap critical</code> or <code>errors</code> to &lsquo;cut noise&rsquo; and losing the evidence you need most: <code>%SYS-5-CONFIG_I</code> (who changed what) and <code>%LINEPROTO-5-UPDOWN</code> are level 5. List what the NOC must see, find the highest-numbered message on the list, and use that number.`)}
${K.check({q:"A router has logging host 10.20.0.50, logging trap warnings and logging console informational. Which messages reach 10.20.0.50?", o:["Levels 0–6, because the console level is informational","Only level 4 (warnings) messages","Levels 0–4 — warnings and everything more severe","Nothing, because the console level and the trap level disagree"], a:2, why:"Each destination has its own level. The server uses the trap level: warnings = 4, and 'at or below' means 0–4. The console setting affects only the console."})}
<h3>Same logic, new situation</h3>
<p>The monitoring team says: &ldquo;From R9 we get <code>%LINK-3-UPDOWN</code>, but never <code>%LINEPROTO-5-UPDOWN</code> or <code>%SYS-5-CONFIG_I</code>.&rdquo; Without logging in, what can you say about R9's trap level?</p>
${K.hint(`Each message that arrives sets a lower limit on the level; each one that never arrives sets an upper limit.`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> The trap level, deduced from what arrives. <b>2. Which rule?</b> A message is sent when its digit is at or below the trap level. <b>3. Apply it.</b> Level 3 arrives, so the level is at least 3; level 5 never does, so it's below 5: <b>errors (3) or warnings (4)</b>. Whether a level 4 message such as <code>%CDP-4-NATIVE_VLAN_MISMATCH</code> arrives would tell them apart — or read <code>show logging</code>. To give the team what it asked for: <code>logging trap notifications</code>.</p>`)}
<h3>Hands-on: Kano's logs never reach the NOC</h3>
<p>Kano's router has been &lsquo;sending&rsquo; to the NOC for months — or so everyone thought. Find where its messages go, fix them, and watch them arrive.</p>
${K.bench({id:"m7-syslog-noc", points:100, from:"CCNA · Module 7 · lesson 6", title:"Kano to the NOC — fix the destination, pick the trap level, prove it arrives", viewBox:"0 0 820 320",
  intro:"Console cable on KN-R1: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secrets. <b>Design:</b> SYSLOG-SRV 192.168.50.20 at HQ (the old server, 192.168.50.21, was retired in August); KN-R1 reaches it through HQ-R1 (WAN 10.0.13.0/30: HQ-R1 .1, KN-R1 .2). Both routers take NTP from HQ-R1. <b>NOC policy:</b> &ldquo;Every router sends severity 5 (notifications) and more severe to SYSLOG-SRV — nothing informational or debug.&rdquo; <b>Ticket:</b> &ldquo;KN-R1's LAN port flapped last night; SYSLOG-SRV has never received anything from Kano.&rdquo; Gi0/2 is a spare port to a test PC: use it for test events. <b>Lab note:</b> SYSLOG-SRV's <b>Server services</b> shows what arrived.",
  devices:[
    {id:"sl", kind:"server", label:"SYSLOG-SRV", x:20, y:30, ip:"192.168.50.20", mask:"255.255.255.0", gw:"192.168.50.1", services:{syslog:true}},
    {id:"hq", kind:"router", label:"HQ-R1", x:150, y:30, config:e=>{ ["en","conf t","hostname HQ-R1","no ip domain-lookup","int g0/0","description NOC SERVER LAN","ip address 192.168.50.1 255.255.255.0","no shut","int g0/1","description WAN to KN-R1","ip address 10.0.13.1 255.255.255.252","no shut","exit","ip route 192.168.30.0 255.255.255.0 10.0.13.2","ip route 192.168.31.0 255.255.255.0 10.0.13.2","ntp master 3","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"kn", kind:"router", label:"KN-R1", x:380, y:30, config:e=>{ ["en","conf t","hostname KN-R1","no ip domain-lookup","int g0/0","description KANO LAN","ip address 192.168.30.1 255.255.255.0","no shut","int g0/1","description WAN to HQ-R1","ip address 10.0.13.2 255.255.255.252","no shut","int g0/2","description SPARE - test port","ip address 192.168.31.1 255.255.255.0","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.0.13.1","ntp server 10.0.13.1","logging trap critical","logging host 192.168.50.21","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:620, y:30},
    {id:"tp", kind:"pc", label:"TEST-PC", x:240, y:200},
    {id:"sw", kind:"switch", label:"KN-SW", x:380, y:200},
  ],
  cables:[ {type:"cat6", a:"sl:eth", b:"hq:g0"}, {type:"cat6", a:"hq:g1", b:"kn:g1"}, {type:"cat6", a:"kn:g0", b:"sw:g1"}, {type:"cat6", a:"kn:g2", b:"tp:eth"}, {type:"console", a:"lap:usb", b:"kn:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On KN-R1: <code>enable</code>, then <code>show logging</code>. Find two lines — <b>Trap logging: level …</b> and <b>Logging to …</b> — and compare each with the NOC policy and the design", done:B=>B.devs.kn.env.history.some(x=>/^\s*(do\s+)?sh\S*\s+logg/i.test(x))},
    {text:"Make a test event on the spare port: <code>configure terminal</code>, <code>interface g0/2</code>, <code>shutdown</code>, <code>no shutdown</code>, <code>end</code>. Read the messages on the console (which severities?), then open SYSLOG-SRV's <b>Server services</b>: did anything arrive?", done:B=>Bench.logged(B,"kn",/%LINK-3-UPDOWN: Interface GigabitEthernet0\/2, changed state to up/)},
    {text:"Fix the destination: <code>no logging host 192.168.50.21</code>, then <code>logging host 192.168.50.20</code>. Make another test event on Gi0/2 and check the server again. Does anything arrive now? Use the severity digits to explain what you see", done:B=>{ const h = B.devs.kn.env.logHosts; return h.length===1 && h[0]==="192.168.50.20"; }},
    {text:"Set the trap level the NOC policy asks for — severity 5 and everything more severe — with <code>logging trap</code> (keyword or number). Make one more test event: SYSLOG-SRV should now list %LINK-5-CHANGED, %LINK-3-UPDOWN, %LINEPROTO-5-UPDOWN and %SYS-5-CONFIG_I from 10.0.13.2 (KN-R1)", done:B=>B.devs.kn.env.logTrap===5 && Bench.syslogGot(B,"sl",/%LINEPROTO-5-UPDOWN/) && Bench.syslogGot(B,"sl",/%SYS-5-CONFIG_I/) && Bench.syslogGot(B,"sl",/%LINK-3-UPDOWN/)},
    {text:"Prove and save: <code>show logging</code> again (the Trap logging level, and the <i>message lines logged</i> under <b>Logging to 192.168.50.20</b>), then <code>copy running-config startup-config</code>. Last night's flaps still aren't on the server — why will they never be?", done:B=>{ const e = B.devs.kn.env; return !!e.savedOnce && e.history.filter(x=>/^\s*(do\s+)?sh\S*\s+logg/i.test(x)).length>=2; }},
  ],
  win:"Two faults, both silent: KN-R1 was sending to a server that no longer existed, and its trap level (critical, 2) hid everything the NOC needed — link changes are 3 and 5, config changes 5. Neither produced an error, because syslog is one-way UDP: the router never learns whether anyone is listening. And the messages from before the fix are gone for good — nothing queues them — so 'check that the logs actually arrive' belongs on every new-device checklist.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging"],
    ["term","configure terminal"],["term","interface g0/2"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["term","configure terminal"],["term","no logging host 192.168.50.21"],["term","logging host 192.168.50.20"],["term","interface g0/2"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["term","configure terminal"],["term","logging trap notifications"],["term","interface g0/2"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["term","show logging"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: the design says 192.168.50.20; critical is level 2. Task 3: with the right server but trap level 2, which of your test messages (digits 3 and 5) can pass? Task 4: <code>logging trap notifications</code> or <code>logging trap 5</code>.`)}

<h2>Logs as evidence: time order, one convention, one central server</h2>
${K.remember(`<p><b>The rule:</b> logs only tell a story when every device stamps them from the same clock. <b>Synchronise first</b>, <b>choose one timestamp convention</b> (UTC or local, zone shown), <b>collect centrally</b>, then read across devices <b>in time order</b>.</p>`)}
<p>Why a central server when every router has <code>show logging</code>? The buffer is small and wiped by a reload; a crashed device can't show you anything; one search beats three hundred logins; the server can alert on level 0–2; and an intruder can <code>clear logging</code> on a router but not the copy already sent. Large organisations feed syslog into a ${K.g("SIEM","Security Information and Event Management: a system that collects logs from many sources, correlates them and raises security alerts.")}; the router side is the same.</p>
<p>Know its limits: classic syslog over UDP 514 has <b>no acknowledgement, retransmission or encryption</b>. A message sent while the path is down is lost — often over the very link that failed — so keep the local buffer too. On real kit, <code>logging source-interface Loopback0</code> makes a router's messages always come from one address (not in the lab).</p>
<h3>Reading across devices</h3>
<p>Collect the relevant lines from each device, convert every timestamp to one zone, and sort. The cause is usually the <b>earliest</b> event; the next few seconds show the knock-on effects.</p>
${K.out(`CORE-SW#show logging | include 13:05
Oct 13 13:05:41.220: %LINK-3-UPDOWN: Interface GigabitEthernet1/0/24, changed state to down
Oct 13 13:05:42.221: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/24, changed state to down

LG-R1#show logging | include 14:05
Oct 13 14:05:43.004 WAT: %OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.9 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Interface down or detached`, "Real IOS: CORE-SW logs in UTC (the default), LG-R1 in local time with show-timezone. Both follow the same NTP source.")}
<h3>Same logic, new situation</h3>
${K.hint(`Put both lines in the same zone first. WAT is UTC+1.`)}
${K.reveal("In what order did these happen — and what probably caused the OSPF drop?",`<p><b>1. What is asked?</b> The order of events across two timestamp conventions. <b>2. Which rule?</b> Convert to one zone, then sort; the earliest event is the likely cause. <b>3. Apply it.</b> 14:05:43 WAT is 13:05:43 UTC. CORE-SW's port went down at 13:05:41, its line protocol at :42, and LG-R1 lost its OSPF neighbour at :43 — &lsquo;Interface down or detached&rsquo;. The link failure came first: check that cable and its ports. Unsynchronised, the hour's difference might have looked like a separate incident.</p>`)}
${K.job("A Kaduna auditor asks: &lsquo;when was this router changed, and by whom?&rsquo;",`
<h3>Ticket 6120 · 11:20 · &ldquo;Internal audit: KD-R1's configuration differs from the approved baseline. Provide date, time and user of the change.&rdquo;</h3>
<p><b>Questions.</b> Which difference? — <i>&ldquo;an extra local user&rdquo;</i>. The evidence will be the <code>%SYS-5-CONFIG_I</code> lines: they name the user and source address.</p>
<p><b>Checks.</b> SSH to KD-R1 (Module 2) and read the buffer:</p>
${K.out(`KD-R1#show logging | include CONFIG_I
*Mar  3 19:42:11.507: %SYS-5-CONFIG_I: Configured from console by tunde on vty0 (10.20.0.31)
*Mar  4 08:02:55.118: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.20.0.15)
KD-R1#show clock
*21:14:09.902 UTC Fri Mar 5 1993
KD-R1#show ntp status
%NTP is not enabled.
KD-R1#show running-config | include logging|ntp
logging host 10.20.0.50`, "Real IOS. Every line has a *, the date is 1993 and there's no NTP: the times count up from the factory date since the last power cut.")}
<p><b>Reasoning.</b> The user and address are trustworthy; the dates aren't — but the error can be measured. Right now (Wednesday 14 October, 10:24 UTC) the router says 5 March 1993, 21:14 UTC. Note that pair <b>before</b> you fix anything: &ldquo;Mar 3 19:42&rdquo; is about 2 days 1.5 hours before the router's &lsquo;now&rsquo;, so about Monday 12 October, 08:52 UTC (09:52 WAT). The <code>logging host</code> line at the default trap level means the CONFIG_I lines (level 5) should also be on the server, with its own receive time — an independent check.</p>
<p><b>Fix.</b> <code>ntp server 10.20.0.1</code> (the synchronised Kaduna core), <code>clock timezone WAT 1</code>; wait for the <code>*</code> in <code>show ntp associations</code> (a few minutes on real kit); <code>show clock</code> without <code>*</code>; <code>ntp update-calendar</code> (if it has a hardware calendar); save. Then <code>show running-config | include ntp</code> on every Kaduna device.</p>
<p><b>What you say.</b> &ldquo;User tunde made the change from 10.20.0.31, about 09:50 on Monday the 12th — the router's clock was wrong, so I worked back from its error, and the log server's receive time agrees. The router now takes its time from our time server.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;CONFIG_I by tunde@10.20.0.31; clock unsynchronised (*Mar 5 1993 21:14 UTC at 2026-10-14 10:24 UTC); change ~2026-10-12 08:52 UTC, confirmed by syslog receive time. Added ntp server 10.20.0.1 + clock timezone WAT 1; synchronised stratum 3; saved. Follow-up: NTP audit of Kaduna devices; NTP on the new-device checklist.&rdquo;</i></p>`)}
${K.case("The outage review nobody could put in order",`
<p>A bank with sites in Lagos, Abuja and Port Harcourt had a 40-minute card-payment outage, and the review couldn't agree on the cause. The core switches stamped UTC; two branch routers stamped local time without showing the zone; one router had never had NTP; the firewall followed a different time server 90 seconds off. The router whose logs mattered most had rebooted mid-outage, taking its buffer with it — and it sent to the syslog server at <code>logging trap errors</code>, so its routing messages (level 5) never left the box.</p>
<p>The fix was a standard: two internal stratum 2 sources per region and two <code>ntp server</code> lines on every device; UTC timestamps with <code>show-timezone</code>; <code>logging trap informational</code> to two syslog servers; a monthly unsynchronised-device report. The next timeline took twenty minutes.</p>`)}
${K.myth([
  ["<code>logging trap warnings</code> sends only warning messages.","It sends warnings and everything more severe: levels 0–4."],
  ["A higher severity number means a more serious problem.","The opposite: 0 is emergencies, 7 is debugging."],
  ["If the syslog server is down, the router keeps the messages and sends them later.","Classic syslog is fire-and-forget UDP: those messages are lost. Only the local buffer keeps a copy, until it wraps or the router reloads."],
  ["<code>ntp master</code> makes a router's clock accurate.","It makes the router <i>claim</i> its clock is authoritative, right or wrong — a fallback, not a time source."],
])}
${K.dodont([
  "Point every device at two or three internal NTP sources, and verify with <code>show ntp status</code>, not by eye.",
  "Use one timestamp convention network-wide, with the zone shown.",
  "Decide the trap level from what the NOC must see, then prove arrival with a harmless test event.",
  "Before fixing a wrong clock, note what it says and the real time — you need that offset to read the old logs.",
],[
  "Put <code>ntp master</code> on every router, or leave <code>ntp master 1</code> anywhere.",
  "Set <code>logging trap</code> below 5 if config-change and line-protocol messages matter.",
  "Assume logs arrive because <code>logging host</code> is configured.",
  "Run heavy <code>debug</code> on a busy router with console logging at debugging.",
])}
${K.check({q:"A router reloaded at 02:10 after a power problem. At 09:00 an engineer runs show logging on it to find out what happened before the reload. What will they most likely see?", o:["Every message from before the reload, because the buffer is saved with the configuration","Only messages since the reload: the buffer is in RAM and was lost, so the evidence is on the syslog server, if the router was sending there","Nothing at all until terminal monitor is typed","The messages, but with * timestamps"], a:1, why:"The log buffer lives in RAM, isn't part of the saved configuration and is wiped by a reload. A central syslog server — reached at a trap level that includes the messages you need — is what preserves the story."})}

<h2>Interview corner</h2>
${K.hint(`Logs in order, security that depends on time, evidence — then how NTP solves it and how you'd prove it.`)}
${K.reveal("&ldquo;Why does accurate time matter on network devices, and how do you provide it?&rdquo;",`<p>&ldquo;To correlate logs across devices during an incident, because certificates and Kerberos fail when clocks are wrong, and because audit evidence needs trustworthy timestamps. I use a short NTP hierarchy: two or three internal sources following GPS or trusted external servers, and every device pointing at two of them with <code>ntp server</code>. One timestamp convention everywhere. I verify with <code>show ntp status</code> and <code>show ntp associations</code> — a <code>*</code> and reach 377 — and a <code>*</code> at the start of <code>show clock</code> tells me a device has never synchronised.&rdquo;</p>`)}
${K.hint(`Turn the keyword into a number, read the digit in the message, compare.`)}
${K.reveal("&ldquo;A router has <code>logging trap warnings</code>. Will <code>%LINEPROTO-5-UPDOWN</code> reach the syslog server? What would you change if the NOC needs it?&rdquo;",`<p>&ldquo;No. Warnings is level 4, and the trap level sends 0 to 4; the 5 in the message is notifications, so it stays in the buffer and on the console. If the NOC needs line-protocol and configuration changes — both level 5 — I'd set <code>logging trap notifications</code> or leave the default, informational, then make a test event on a spare port and check it arrives, because syslog over UDP never tells the router whether anything was received.&rdquo;</p>`)}
${K.hint(`Stratum 0 to 16, plus one per step, and how you avoid a single point of failure.`)}
${K.reveal("&ldquo;Explain NTP stratum. What does stratum 16 mean, and how would you design time for a head office and twelve branches?&rdquo;",`<p>&ldquo;Stratum counts steps from a reference clock: 0 is the atomic or GPS clock, 1 a server attached to it, and each client is its server's stratum plus one, up to 15. Sixteen means unsynchronised. I'd put two HQ devices at the top, each following GPS or several external servers, with a high-stratum <code>ntp master</code> fallback, and point every branch device at both. I'd add NTP authentication and allow UDP 123 both ways across the WAN.&rdquo;</p>`)}

${K.recap([
  "Every clock drifts; NTP (UDP 123) lets devices copy a better clock. Your stratum = your server's + 1; 0 is the reference clock, 16 means unsynchronised.",
  "ntp server X makes a device a client of X (and a server below it); ntp master [n] trusts the local clock — a high-stratum fallback on one or two devices only.",
  "show ntp status: 'Clock is synchronized, stratum N, reference is X'. show ntp associations: * sys.peer, ~ configured, reach 377 good, .INIT./16/reach 0 never answered.",
  "show clock: * = not authoritative (typically never synchronised), . = NTP not synchronised now (typically lost sync), nothing = authoritative (synchronised). clock timezone WAT 1 changes the display; NTP works in UTC.",
  "Every IOS message: timestamp: %FACILITY-SEVERITY-MNEMONIC: description. 0 emergencies … 7 debugging — lower is worse.",
  "Each destination has its own level, meaning 'this number and all lower ones'. logging host + logging trap (default informational) feed the syslog server: UDP 514, one-way, no retries.",
  "Prove logging with a test event; messages sent before a fix are gone. Synchronise, one convention, collect centrally, read in time order.",
])}
${K.next(`<b>Lesson 7 — managing devices: SNMP, TFTP and FTP.</b> Syslog tells the NOC what happened; SNMP lets it ask devices how they are and receive alerts (traps) on UDP 162. Then backing up and restoring configurations — and why SSH is still the way in.`)}
`,
quiz:[
  {q:"What does stratum 16 mean in show ntp status or show ntp associations?", o:["The most accurate clock on the network","Not synchronised: no device should take time from it","The device is 16 hops from the NTP server","The device runs NTP version 16"], a:1, why:"Stratum counts steps from a reference clock (0) through 1–15. Sixteen is reserved for 'unsynchronised'. A server listed at stratum 16 with reach 0 has never answered.", lvl:1},
  {type:"order", q:"Put the IOS logging severity keywords in order from level 0 (most severe) to level 7.", items:["emergencies","alerts","critical","errors","warnings","notifications","informational","debugging"], why:"Every Awesome Cisco Engineer Will Need Ice cream Daily: 0 emergencies, 1 alerts, 2 critical, 3 errors, 4 warnings, 5 notifications, 6 informational, 7 debugging.", lvl:1},
  {q:"R3 has ntp server 10.8.0.1. The router at 10.8.0.1 shows 'Clock is synchronized, stratum 2, reference is 10.8.255.5'. Once R3 synchronises, what is the first line of R3's show ntp status?", o:["Clock is synchronized, stratum 2, reference is 10.8.255.5","Clock is synchronized, stratum 3, reference is 10.8.0.1","Clock is synchronized, stratum 1, reference is 10.8.0.1","Clock is unsynchronized, stratum 16, no reference clock"], a:1, why:"R3 follows 10.8.0.1, so its reference is 10.8.0.1 (not that router's own source), and its stratum is one more than its server's: 2 + 1 = 3.", lvl:2},
  {type:"multi", q:"A switch has logging host 10.20.0.50 and logging trap warnings. Which three of these messages are sent to the syslog server? (Choose three.)", o:["%LINK-3-UPDOWN: Interface GigabitEthernet1/0/1, changed state to down","%SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.20.0.15)","%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi1/0/5 with BPDU Guard enabled. Disabling port.","%SW_MATM-4-MACFLAP_NOTIF: Host 00aa.bb21.0a14 in vlan 30 is flapping between port Gi1/0/31 and port Gi1/0/32","%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/1, changed state to down"], a:[0,2,3], why:"warnings = 4, and the trap level sends that level and every lower number. The digits are 3, 5, 2, 4 and 5: the 3, 2 and 4 go; both level 5 messages stay in the switch's buffer.", lvl:2},
  {type:"fill", q:"Type the global configuration command that sends this router's log messages to a syslog server at 10.20.0.50.", fields:[{label:"Command", a:["logging host 10.20.0.50","logging 10.20.0.50"], ios:true}], why:"logging host 10.20.0.50 (or the older logging 10.20.0.50) adds a syslog server. What reaches it is set by logging trap, default informational (6).", lvl:1},
  {type:"fill", q:"Type the global configuration command that sends severity 0 to 5 messages — and nothing less severe — to the configured syslog servers.", fields:[{label:"Command", a:["logging trap notifications","logging trap 5"], ios:true}], why:"Level 5 is notifications, and a trap level includes everything more severe, so logging trap notifications (or logging trap 5) sends 0–5 and keeps informational and debugging messages on the router.", lvl:2},
  {q:"An auditor asks why R8's log messages are dated 1993. Based on the output, what is the best fix?", ex:"R8#show clock\n*00:14:52.318 UTC Mon Mar 1 1993\nR8#show ntp status\n%NTP is not enabled.", o:["Replace the router's battery so the date survives reboots","Configure ntp server with the address of the company's time source (and clock timezone if local time is wanted), then verify with show ntp status","Configure ntp master 1 on R8 so its clock becomes the most accurate on the network","Set logging trap debugging so the timestamps are refreshed"], a:1, why:"The * and '%NTP is not enabled.' say nothing sets or vouches for this clock: it is counting from the factory date. Point it at your NTP source. ntp master 1 would make the wrong clock authoritative at stratum 1 for everyone else — the worst choice; logging levels have nothing to do with the clock.", lvl:2},
  {q:"What stratum does BR-4 report, and what is 10.4.0.1's role?", ex:"BR-4#show ntp associations\n  address         ref clock       st   when   poll reach  delay  offset   disp\n+~10.4.0.1        10.4.255.9       3     41     64   377  2.000   0.410  0.188\n*~10.4.0.2        .GPS.            1     12     64   377  1.000   0.120  0.130\n * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured", o:["Stratum 2; 10.4.0.1 is a candidate it could use if 10.4.0.2 fails","Stratum 4; 10.4.0.1 is the server it follows","Stratum 1; both servers are configured peers","Stratum 2; 10.4.0.1 has been rejected as a falseticker"], a:0, why:"The * marks the sys.peer: 10.4.0.2, a stratum 1 GPS appliance, so BR-4 is stratum 2. 10.4.0.1 (stratum 3) is marked + — a healthy candidate, not rejected (that would be x or -). Both are ~ configured.", lvl:2},
  {type:"match", q:"Match each part of this message with what it is: %OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.2 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Dead timer expired", pairs:[["OSPF","Facility: the part of IOS that raised it"],["5","Severity: notifications"],["ADJCHG","Mnemonic: the event's short name (adjacency change)"],["Process 1, Nbr 10.0.0.2 ... Dead timer expired","Description: the details in plain text"]], why:"Every IOS message is %FACILITY-SEVERITY-MNEMONIC: description. Only the digit decides where it is sent: 5 reaches a server at trap level notifications or higher-numbered levels.", lvl:1},
  {q:"Since Saturday's WAN change to a new provider, the Warri router's log times drift away from HQ's. HQ's NTP source is the router 10.30.0.1. What do the outputs tell you, and what do you check first?", ex:"WR-R2#show clock\n.14:22:09.731 WAT Tue Oct 13 2026\nWR-R2#show ntp associations\n  address         ref clock       st   when   poll reach  delay  offset   disp\n ~10.30.0.1       .INIT.          16      -     64     0  0.000   0.000  15937.\n * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured", o:["WR-R2 was never configured for NTP; add ntp server 10.30.0.1","WR-R2 was synchronised before (the '.') but gets no replies from 10.30.0.1 now (reach 0, stratum 16): check that WR-R2 and 10.30.0.1 can reach each other over the new path — routes both ways, and any filtering of UDP 123","10.30.0.1 is a falseticker; remove it","The timezone is wrong; clock timezone WAT 1 will stop the drift"], a:1, why:"The ~ shows it is configured, and the '.' (not '*') shows the router used to be synchronised. reach 0 and .INIT. mean no replies at all now. After a WAN change the usual causes are a missing route on one side (often the way back) or a filter dropping UDP 123. Test with ping 10.30.0.1 from WR-R2 and a ping back from HQ; the timezone only changes the display.", lvl:3},
  {q:"The NOC's syslog disk keeps filling, mostly with severity 6 messages. The NOC must still receive interface up/down (%LINK-3, %LINEPROTO-5), OSPF neighbour changes (%OSPF-5-ADJCHG) and configuration changes (%SYS-5-CONFIG_I). Which trap level gives exactly that, with nothing at 6 or 7?", o:["logging trap informational","logging trap notifications","logging trap warnings","logging trap errors"], a:1, why:"The highest-numbered message the NOC needs is level 5, so the trap level is 5, notifications: it sends 0–5. Warnings (4) or errors (3) would lose LINEPROTO-5, ADJCHG and CONFIG_I; informational keeps the 6s that fill the disk.", lvl:2},
  {q:"All 40 routers send logs to the new syslog server, 10.50.0.52. Messages arrive from every router except R7, which can ping 10.50.0.52. Based on R7's output, what is wrong?", ex:"R7#show logging\n...\n    Trap logging: level informational, 212 message lines logged\n        Logging to 10.50.0.25  (udp port 514, audit disabled,\n              link up),\n              212 message lines logged,\n              0 message lines rate-limited,\n...", o:["The trap level is too low to include interface messages","R7 is sending to 10.50.0.25 — the digits are swapped — so its messages go to an address with no syslog server; add logging host 10.50.0.52 and remove the wrong one","The syslog server must acknowledge each message, and it hasn't learned R7 yet","The log buffer is full, so nothing is sent"], a:1, why:"212 lines logged to a host proves R7 is sending — just to the wrong address (.25, not .52). Syslog is one-way UDP, so R7 never notices. Informational already includes everything up to level 6, and syslog has no acknowledgements.", lvl:2},
  {type:"multi", q:"You are designing time for a company with a head office (two internet links) and 12 branches reached over a WAN. Which two choices follow good practice? (Choose two.)", o:["Point two HQ routers at trusted external servers (or GPS appliances), and point every branch device at both of those HQ routers","Configure ntp master 1 on every branch router so each branch keeps exact time if the WAN fails","Point every branch device straight at internet NTP servers so the chain is as short as possible","Optionally add ntp master with a high stratum, such as 10, on the HQ routers as a last-resort fallback so devices still agree if the outside sources fail","Use clock set on each device once a month instead of NTP"], a:[0,3], why:"A short internal hierarchy with two sources at the top gives redundancy, and keeps UDP 123 to the internet limited to two devices; a high-stratum ntp master on the top devices is a safe fallback that keeps branches agreeing even when the internet is down. ntp master 1 everywhere makes every drifting clock 'authoritative'; direct internet NTP from every branch needs internet access and firewall rules everywhere; clock set drifts.", lvl:3},
  {q:"In an incident review you have two lines. DIST-SW (logs in UTC): Oct 20 23:59:58.640: %LINK-3-UPDOWN: Interface TenGigabitEthernet1/1/1, changed state to down. AB-R3 (logs in local time, WAT = UTC+1): Oct 21 01:00:00.112 WAT: %OSPF-5-ADJCHG: Process 10, Nbr 10.2.0.5 on GigabitEthernet0/0/1 from FULL to DOWN, Neighbor Down: Interface down or detached. Both devices are NTP-synchronised. What happened?", o:["The OSPF neighbour went down an hour after the link, on the next day — a separate incident","The link went down about 1.5 seconds before the OSPF neighbour was lost, just before midnight UTC — consistent with the link failure causing it","The OSPF neighbour was lost first, which then brought the switch link down","The times can't be compared because the devices use different time zones and even different dates"], a:1, why:"Convert to one zone: 01:00:00.112 WAT on 21 October is 00:00:00.112 UTC on 21 October — about 1.5 seconds after the link went down at 23:59:58.640 UTC on the 20th. The date differs only because the conversion crosses midnight. 'Interface down or detached' fits a lost link. Different zones (and dates) are fine once both clocks are synchronised and you know each device's convention — which is why show-timezone matters.", lvl:3},
  {type:"order", q:"The syslog server shows nothing from one router. Put these checks in a sensible order.", items:["On the router, show logging: is there a Logging to line, with the right server address?","Read the Trap logging level: would the messages you expect (their severity digits) pass it?","Test the path: ping the server from the router (syslog is one-way UDP, so the router never reports a failure)","Make a harmless test event, such as a change on a spare port, and watch the server","Save the fixed configuration, and note that messages from before the fix are gone for good"], why:"Start with what the router thinks it is doing (destination, then level), prove the path, then prove arrival with a test event you control. Messages sent before the fix were never queued, so they can't be recovered from the router — only from its buffer, if it hasn't wrapped or reloaded.", lvl:2},
  {type:"fill", q:"Type the global configuration command that makes a router display West Africa Time (UTC+1) under the name WAT.", fields:[{label:"Command", a:["clock timezone WAT 1","clock timezone WAT 1 0","clock timezone WAT +1"], ios:true}], why:"clock timezone <name> <hours> [<minutes>]. The running-config shows clock timezone WAT 1 0. NTP keeps working in UTC; only the display changes (and log timestamps stay UTC unless service timestamps ... localtime is set).", lvl:1},
],
cards:[
  {f:"Why accurate time matters", b:"1) Log correlation: put events from many devices in order. 2) Security: certificates have validity dates, Kerberos rejects more than 5 minutes of skew, one-time codes use the time. 3) Evidence for audits and incident reviews."},
  {f:"How NTP works", b:"Client/server on UDP 123. Four timestamps give the delay (round trip) and offset (clock difference); the client adjusts gradually and keeps polling (64 s at first). A synchronised device can serve time to others, so NTP forms a tree."},
  {f:"NTP stratum", b:"0 = reference clock (GPS, atomic), not on the network. 1 = server attached to it. Each client = its server's stratum + 1, up to 15. 16 = unsynchronised: nobody takes time from it."},
  {f:"ntp server vs ntp master", b:"ntp server X: be a client of X (and a server for devices below). ntp master [1-15, default 8]: trust the local clock as authoritative — only for isolated networks or as a high-stratum fallback on one or two devices."},
  {f:"show ntp status", b:"First line is the answer: 'Clock is synchronized, stratum 4, reference is 10.1.0.1' (synced, at what stratum, following whom) or 'Clock is unsynchronized, stratum 16, no reference clock'. No NTP configured: '%NTP is not enabled.'"},
  {f:"show ntp associations", b:"* sys.peer (the server in use), + candidate, - outlyer, x falseticker, # selected, ~ configured. ref clock = what that server follows (.GPS., .LOCL., .INIT.). st = its stratum. reach 377 = last 8 polls answered; 0 = none."},
  {f:"show clock symbols", b:"* = not authoritative (typically never synchronised). . = authoritative but NTP not synchronised now (typically was synchronised, has lost its source). No symbol = authoritative (synchronised, or set by hand). show clock detail adds 'Time source is NTP' or 'hardware calendar'. The same * appears on log timestamps."},
  {f:"clock timezone", b:"clock timezone WAT 1 (name, hours, optional minutes) changes the displayed time; NTP itself works in UTC. Log timestamps stay UTC unless service timestamps log datetime msec localtime; add show-timezone to label them."},
  {f:"IOS log message format", b:"timestamp: %FACILITY-SEVERITY-MNEMONIC: description. Example: *Oct 12 08:31:10.370: %LINK-3-UPDOWN: Interface Gi0/2, changed state to up. Facility = the feature (LINK, SYS, OSPF); mnemonic = the event code; * = clock not synchronised."},
  {f:"Syslog severity levels", b:"0 emergencies, 1 alerts, 2 critical, 3 errors, 4 warnings, 5 notifications, 6 informational, 7 debugging. Every Awesome Cisco Engineer Will Need Ice cream Daily. Lower number = more severe. Severity belongs to the message type: LINK-3-UPDOWN is 3 for up and down."},
  {f:"Logging destinations and defaults", b:"Console (logging console, default debugging), terminal/VTY (logging monitor + terminal monitor), buffer in RAM (logging buffered, show logging, circular, lost at reload), syslog server (logging host + logging trap, default informational). Each has its own level."},
  {f:"What a logging level means", b:"'This severity and everything more severe': a message goes to a destination if its digit is at or below the level. logging trap warnings sends 0-4; logging trap notifications sends 0-5. CONFIG_I and LINEPROTO-5 need at least notifications."},
  {f:"Syslog server facts", b:"UDP 514, one-way: no acknowledgements, retries or encryption, and no error on the router if nobody receives. Messages sent while the path or server is down are lost. Prove it works with a test event; keep a local buffer too."},
],
});

// ---------- Module 7 · Lesson 7 ----------
L.push({
id:"svc-snmp-tftp", mins:100, level:"Beginner+ · builds on Module 7 lessons 1–6 and Module 2",
t:"Managing devices: SNMP monitoring, TFTP config backups and restores, and secure ways in",
html:`
${K.goals([
  "Explain SNMP — manager, agent, MIB, OID, get, set, trap, inform, UDP 161/162 — and why v1/v2c are not secure while v3 is.",
  "Configure IOS SNMP: RO and RW communities limited by an access list, location, contact and traps to a management server.",
  "Poll a router with Net-SNMP (<code>snmpget</code>, <code>snmpwalk</code>, <code>snmpset</code>) and tell a wrong community from a blocked or unreachable agent.",
  "Back up with <code>copy running-config tftp:</code>, restore with <code>copy tftp: running-config</code>, and predict exactly what a merge changes.",
  "Choose between TFTP, FTP, SCP and SFTP, and manage devices securely with SSH, SNMPv3 and SCP/SFTP.",
])}
${K.pre(["Module 7 lessons 1–6: DHCP, relay, DNS, NAT/PAT (lesson 4 used a standard access list as a &ldquo;who&rdquo; list), NTP and syslog — this lesson sends its alerts to the same management server.","Module 2: SSH remote access — usernames, <code>login local</code>, <code>transport input ssh</code> and <code>ssh -l</code> from a PC.","Module 1: UDP and TCP, and the well-known ports (69 TFTP, 20/21 FTP, 22 SSH, 161/162 SNMP)."])}

<h2>Why this matters at work</h2>
<p>Monday, 08:10, at a managed-service provider's network operations centre in Abuja. Forty customer routers are green on the monitoring wall — and one Kano branch is grey, &ldquo;no response&rdquo;, since its router was replaced on Friday, though staff say everything works. The same morning a bank's auditor reports three devices answering SNMP with <code>public</code> and <b>write</b> access, and a core-router backup seven months old.</p>
<p>None of this is about forwarding packets. It's the <b>management plane</b> from Module 2: watching devices, collecting their alerts and keeping a copy of every configuration so a broken router is rebuilt in minutes. This lesson covers SNMP for monitoring, TFTP (and FTP, SCP, SFTP) for backups and restores — without handing an attacker the keys.</p>

<h2>SNMP: how a monitoring server reads a device</h2>
${K.remember(`<b>The rule in one line:</b> the <b>manager asks</b> and the <b>agent answers</b> (requests go to the agent on <b>UDP 161</b>); when something happens, the <b>agent tells</b> the manager without being asked (traps and informs go to the manager on <b>UDP 162</b>). Everything an agent can report is an object in its ${K.g("MIB","Management Information Base: the structured list of objects an agent can report or change — interface names, states, traffic counters, the device's name and location.")}, named by a number called an ${K.g("OID","Object Identifier: the dotted number that names one object in the MIB tree, such as 1.3.6.1.2.1.1.5 for sysName.")}.`)}
<p>SNMP (Module 1) has two roles. The ${K.g("manager","The SNMP side that asks: monitoring software on a server (an NMS) that polls devices and receives their alerts.")} is monitoring software on a server — the ${K.g("NMS","Network Management System: the monitoring server and software that polls devices, draws graphs and raises alarms.")}. The ${K.g("agent","The SNMP side that answers: software inside the router, switch, UPS or printer that reports the device's state and sends its alerts.")} runs inside every managed device: router, switch, UPS, printer. The NMS polls hundreds of agents every few minutes and raises an alarm when something changes.</p>
${K.analogy(`<p>The meter reader walks round and <b>reads</b> each meter: a poll. The smoke alarm doesn't wait to be asked; it <b>shouts</b>: a trap. You need both — readings for the trend, a shout for the emergency.</p>`)}
${K.svg("0 0 760 300",
  K.dev("server",90,150,"NMS (manager)","10.10.50.10")+
  K.dev("router",470,150,"LOS-R1 (agent)","10.10.50.1")+
  K.arrow(122,84,440,84,"GetRequest sysName.0 → agent, UDP 161",true)+
  K.arrow(440,118,122,118,"Response: sysName.0 = LOS-R1")+
  K.arrow(440,214,122,214,"Trap: linkDown Gi0/0 → manager, UDP 162 (never acknowledged)",true)+
  K.arrow(440,252,122,252,"Inform → UDP 162 (the manager must reply, or it is resent)")+
  K.box(548,74,196,150,"","")+K.band(548,74,196,26,"MIB inside LOS-R1")+
  K.txt(560,122,"sysName.0 = LOS-R1",{c:"fg",s:10.5})+
  K.txt(560,142,"sysLocation.0 = Lagos HQ",{c:"fg",s:10.5})+
  K.txt(560,162,"ifDescr.2 = Gi0/1",{c:"fg",s:10.5})+
  K.txt(560,182,"ifOperStatus.2 = up(1)",{c:"fg",s:10.5})+
  K.txt(560,202,"ifInOctets.2 = 81723990",{c:"fg",s:10.5})+
  K.txt(380,290,"Polls start at the manager and go to UDP 161. Alerts start at the agent and go to UDP 162.",{c:"muted",s:11,mid:true,f:"body"}),
  "SNMP's two directions. The manager polls the agent's MIB objects; the agent pushes traps (unacknowledged) or informs (acknowledged) when something happens.")}
<h3>The MIB and OIDs: every fact has a number</h3>
<p>The <b>MIB</b> is the agent's catalogue of facts — a standard list of objects every vendor answers the same way. Each object has an <b>OID</b>: a dotted number that walks a worldwide tree from the root to that fact; tools translate it into names such as <code>sysName</code>.</p>
${K.svg("0 0 760 250",
  K.txt(20,22,"sysName.0 — the device's name",{c:"fg",s:12.5,b:true,f:"body"})+
  [["1","iso"],["3","org"],["6","dod"],["1","internet"],["2","mgmt"],["1","mib-2"],["1","system"],["5","sysName"],["0","instance"]].map(([n,w],i)=>K.band(20+i*80,34,72,28,n,i>=6?"var(--panel2)":"var(--chip)")+K.txt(56+i*80,80,w,{mid:true,s:10.5,f:"body"})).join("")+
  K.txt(20,124,"ifOperStatus.2 — is interface 2 up?",{c:"fg",s:12.5,b:true,f:"body"})+
  [["1","iso"],["3","org"],["6","dod"],["1","internet"],["2","mgmt"],["1","mib-2"],["2","interfaces"],["2","ifTable"],["1","ifEntry"],["8","ifOperStatus"],["2","ifIndex 2"]].map(([n,w],i)=>K.band(20+i*66,136,60,28,n,i>=9?"var(--panel2)":"var(--chip)")+K.txt(50+i*66,182,w,{mid:true,s:9.5,f:"body"})).join("")+
  K.txt(380,218,"1.3.6.1.2.1 is the standard part every vendor shares; vendor objects live under 1.3.6.1.4.1 (Cisco is .9).",{c:"fg",s:11,mid:true,f:"body"})+
  K.txt(380,238,"A single-value object ends in .0; a table entry ends in the row number, here the interface index.",{c:"muted",s:11,mid:true,f:"body"}),
  "Two OIDs read from the root. Net-SNMP prints these as SNMPv2-MIB::sysName.0 and IF-MIB::ifOperStatus.2; the numbers are what actually travel in the packet.")}
<ul>
<li><b>Scalar objects</b> have one value per device, instance <code>.0</code>: <code>sysName.0</code>, <code>sysLocation.0</code>, <code>sysContact.0</code>, <code>sysUpTime.0</code>, <code>sysDescr.0</code> (the software description).</li>
<li><b>Table objects</b> have one value per row, numbered by the interface's ${K.g("ifIndex","The number an agent gives each interface in the SNMP interface table, so ifDescr.2, ifOperStatus.2 and ifInOctets.2 all describe the same interface.")}: <code>ifDescr.2</code> is interface 2's name, <code>ifOperStatus.2</code> up (1) or down (2), <code>ifAdminStatus.2</code> whether it is shut, <code>ifInOctets.2</code> bytes received.</li>
<li><b>Counters only go up.</b> The NMS reads <code>ifInOctets</code> every five minutes, subtracts the last reading and divides by the time — that's how every bandwidth graph is drawn.</li>
</ul>
<h3>The SNMP messages</h3>
<div class="tablewrap"><table>
<tr><th>Message</th><th>Who sends it</th><th>What it does</th></tr>
<tr><td><b>Get</b></td><td>Manager → agent</td><td>&ldquo;Give me this OID's value.&rdquo;</td></tr>
<tr><td><b>GetNext</b></td><td>Manager → agent</td><td>&ldquo;Give me the <i>next</i> object&rdquo; — repeated, it walks a table of unknown length.</td></tr>
<tr><td><b>GetBulk</b></td><td>Manager → agent</td><td>Many GetNexts in one request (v2c+).</td></tr>
<tr><td><b>Set</b></td><td>Manager → agent</td><td>&ldquo;Change this object&rdquo; — needs write access.</td></tr>
<tr><td><b>Response</b></td><td>Agent → manager</td><td>The answer to a request (and the acknowledgement of an Inform).</td></tr>
<tr><td><b>Trap</b></td><td>Agent → manager</td><td>An unrequested alert (link down, reboot). Never acknowledged — if lost, nobody knows.</td></tr>
<tr><td><b>Inform</b></td><td>Agent → manager</td><td>An alert the manager must acknowledge, resent until it is (v2c+).</td></tr>
</table></div>
${K.dyk(`<code>sysUpTime</code> counts in ${K.g("timeticks","SNMP's unit of time: hundredths of a second.")} in a 32-bit counter. 2<sup>32</sup> hundredths is about <b>497 days</b>, so after 16 months uptime &ldquo;wraps&rdquo; to zero — and a careless NMS reports a reboot that never happened.`)}
${K.check({q:"A UPS in the comms room loses mains power and immediately alerts the monitoring server, which does not reply. Which SNMP message and destination port is that?", o:["A Get to UDP 161 on the UPS","A Trap to UDP 162 on the monitoring server","An Inform to UDP 161 on the monitoring server","A Set to UDP 162 on the UPS"], a:1, why:"The agent (the UPS) starts the conversation and expects no reply, so it is a Trap, sent to the manager on UDP 162. An Inform would also go to 162 but must be acknowledged. Gets and Sets come from the manager to the agent on UDP 161."})}
${K.q({type:"match", q:"Match each job to the SNMP message that does it.", pairs:[["Read sysLocation.0 from a router","Get"],["Walk every row of the interface table, one row per request","GetNext"],["Fetch fifty rows of a table in one v2c request","GetBulk"],["Change a switch's sysContact.0","Set"],["Report a link failure and wait to be acknowledged","Inform"],["Report a link failure and forget about it","Trap"]], why:"Gets, GetNexts, GetBulks and Sets are the manager's requests to the agent (UDP 161). Traps and Informs are the agent's own alerts to the manager (UDP 162): an Inform is acknowledged, a Trap is not. GetBulk and Inform arrived with v2c."})}
<h3>Same logic, new situation</h3>
<p>A Kano school's NMS asks each access switch for its interface counters every five minutes. One night a switch reboots and tells the NMS as it comes up. Which side starts each conversation, and which port does each use?</p>
${K.hint(`Ask who speaks first. The side that asks is the manager; the side that tells without being asked is the agent.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The direction and port of two SNMP exchanges. <b>2. Rule:</b> the manager asks the agent on UDP 161; the agent alerts the manager on UDP 162. <b>3. Apply it:</b> the five-minute counter reads start at the NMS — Gets (or GetBulks) to the switch's <b>UDP 161</b>, answered by Responses. The reboot message starts at the switch — a Trap (a <i>coldStart</i> or <i>warmStart</i>) to the NMS's <b>UDP 162</b>. A firewall between them must allow both, or you get graphs but no alarms.</p>`)}

<h2>SNMP versions: why v1 and v2c are not secure, and what v3 adds</h2>
${K.remember(`<b>The rule:</b> SNMPv1 and v2c prove who you are with a ${K.g("community string","The shared password of SNMPv1/v2c. It travels in clear text in every request, and it also decides read-only or read-write access.")} — a shared password carried <b>in clear text in every packet</b>. Capture one poll and you have it. <b>SNMPv3</b> uses <b>users</b>, and can authenticate and encrypt every message.`)}
<p>The &ldquo;c&rdquo; in v2c stands for <b>community</b>, not crypto: v2c kept v1's security and added GetBulk, Informs and 64-bit counters. It's everywhere because it's easy — so keep it on a trusted management network, with an ACL on every community.</p>
<p>${K.g("SNMPv3","SNMP version 3: SNMP with users instead of communities, optional message authentication (HMAC with SHA) and optional encryption (AES). The secure version.")} has three ${K.g("security levels","SNMPv3's three settings: noAuthNoPriv (username only), authNoPriv (messages authenticated) and authPriv (authenticated and encrypted).")}: <b>noAuthNoPriv</b> (a username only — no better than a community), <b>authNoPriv</b> (each message carries a keyed hash — ${K.g("HMAC","Hash-based Message Authentication Code: a fingerprint of the message computed with a secret key, so the receiver can tell who sent it and that it was not changed.")} with ${K.g("SHA","Secure Hash Algorithm: a family of hash functions used to fingerprint data; SHA-1 and the SHA-2 family are common.")} — so the agent knows who sent it and that it wasn't altered — but the data is readable) and <b>authPriv</b> (authenticated <i>and</i> encrypted, usually with ${K.g("AES","Advanced Encryption Standard: the standard modern encryption algorithm, used by SNMPv3, Wi-Fi WPA2/WPA3, VPNs and HTTPS.")} — what a bank auditor expects).</p>
${K.remember(`<b>Auth</b> = &ldquo;prove who you are&rdquo;; <b>Priv</b> = &ldquo;keep it private&rdquo; (encrypt). <b>noAuthNoPriv &lt; authNoPriv &lt; authPriv</b> — only authPriv protects password and data.`)}
<p>On IOS, v3 is a <b>group</b> with a security level plus <b>users</b> in it; Net-SNMP names the user and both passwords:</p>
${K.out(`! IOS: a group that requires authPriv, and a user in it
snmp-server group NOC-V3 v3 priv
snmp-server user nocpoll NOC-V3 v3 auth sha <auth-password> priv aes 128 <priv-password>

$ snmpget -v3 -l authPriv -u nocpoll -a SHA -A <auth-password> -x AES -X <priv-password> 10.10.50.1 sysName.0`, "For recognition only — the lab supports v2c (and v1).")}
${K.tip(`IOS doesn't show <code>snmp-server user</code> lines in the running-config (use <code>show snmp user</code>), so a config backup doesn't carry your v3 users — keep them in your build notes.`)}
${K.when([
  ["SNMPv1","A very old device that speaks nothing else","Universal, but no GetBulk, no Informs","Anything newer"],
  ["SNMPv2c","A closed management network, every community ACL-locked to the NMS","Simple, everywhere, GetBulk and Informs","The path is untrusted or an auditor needs encryption"],
  ["SNMPv3 authPriv","Banks, ISPs, anything crossing a WAN","Per-user logins, tamper-proof, encrypted","A device can't do it (then isolate its v2c)"],
], "Choosing an SNMP version")}
${K.exam(`Reading an SNMP question: <b>1.</b> find <b>who starts</b> the exchange — manager to agent is Get/GetNext/GetBulk/Set on UDP 161; agent to manager is Trap/Inform on UDP 162. <b>2.</b> find the <b>version clue</b> — &ldquo;community&rdquo; means v1/v2c, clear text; &ldquo;user&rdquo;, &ldquo;authentication&rdquo; or &ldquo;encryption&rdquo; means v3. Traps: &ldquo;v2c is encrypted&rdquo;, &ldquo;traps are acknowledged&rdquo;, &ldquo;the agent listens on 162&rdquo; — all false.`)}
${K.check({q:"Which statement about SNMPv2c is true?", o:["It encrypts the community string with AES","It sends the community string in clear text, so anyone who captures a packet can read it","It replaces communities with usernames and passwords","It cannot send alerts — only SNMPv3 can"], a:1, why:"v2c kept v1's community model: the shared string travels unencrypted in every message. v2c added GetBulk, Informs and 64-bit counters. Users, authentication and encryption are SNMPv3. Both v1 and v2c send traps."})}
<h3>Same logic, new situation</h3>
<p>During an audit at an Abuja microfinance bank, a consultant runs a packet capture on the server VLAN and shows the string <code>Mfb-Watch24</code> sitting readable inside a UDP packet to port 161. Which SNMP versions could produce that, and what would stop it?</p>
${K.hint(`Which versions put a password into every request? And which security level encrypts the message?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which SNMP versions expose a readable string, and the fix. <b>2. Rule:</b> v1 and v2c authenticate with a community string carried in clear text; v3 authPriv authenticates and encrypts. <b>3. Apply it:</b> a readable string in a request to UDP 161 is a <b>v1 or v2c community</b>. A longer string is still readable. The fix is <b>SNMPv3 authPriv</b> plus an ACL; until every device supports v3, isolate v2c and replace that community — it's now known.</p>`)}

<h2>Configuring SNMP on IOS and polling it</h2>
${K.remember(`<b>The rule:</b> the IOS agent stays off until your first <code>snmp-server</code> command, and a v1/v2c manager gets answers only through a community you configure. Each community is <b>a password + a permission (${K.g("RO","Read-only: the community may read MIB objects but not change them.")} or ${K.g("RW","Read-write: the community may read and change MIB objects — effectively an admin password.")}) + optionally an ACL of who may use it</b>. Alerts need two commands: <b>where</b> to send them (<code>snmp-server host</code>) and <b>what</b> to send (<code>snmp-server enable traps</code>).`)}
<h3>Worked example: LOS-R1 and the NMS</h3>
<p>The Lagos office router LOS-R1 (10.10.50.1) must be monitored by the NMS at 10.10.50.10. Before anything is configured, the NMS's poll gets no answer and the router confirms its agent is off:</p>
${K.out(`NMS> snmpget -v2c -c L4gos-ro 10.10.50.1 sysName.0
Timeout: No Response from 10.10.50.1.

LOS-R1#show snmp
%SNMP agent not enabled`, "With no community configured, IOS doesn't answer SNMP at all. The manager just waits and times out.")}
${K.steps([
  ["Read-only community", "<code>snmp-server community L4gos-ro RO</code> — anyone who knows <code>L4gos-ro</code> can <b>read</b> the MIB; this also switches the agent on. Communities are <b>case-sensitive</b>."],
  ["Location and contact", "<code>snmp-server location Lagos HQ, comms room 2</code> and <code>snmp-server contact noc@example.com</code> fill <code>sysLocation.0</code> and <code>sysContact.0</code> — where the box is and who looks after it."],
  ["A who-list for writes", "<code>access-list 10 permit host 10.10.50.10</code> — lesson 4's standard access list, naming the only address allowed to use the next community."],
  ["Read-write community, locked down", "<code>snmp-server community L4gos-rw RW 10</code> — the number after RW is the access list; other sources get no answer. (Filtering traffic <i>through</i> the router is Module 8; this ACL only decides whom the agent answers.)"],
  ["Where to send alerts", "<code>snmp-server host 10.10.50.10 version 2c L4gos-ro</code> — v2c traps to the NMS. Leave out <code>version 2c</code> and IOS sends <b>v1</b> traps."],
  ["What to send", "<code>snmp-server enable traps</code> — every trap type the platform supports; IOS stores it as a list of types (a real router lists many more than the lab)."],
])}
${K.out(`LOS-R1#show running-config | include snmp
snmp-server community L4gos-ro RO
snmp-server community L4gos-rw RW 10
snmp-server location Lagos HQ, comms room 2
snmp-server contact noc@example.com
snmp-server enable traps snmp authentication linkdown linkup coldstart warmstart
snmp-server enable traps config
snmp-server host 10.10.50.10 version 2c L4gos-ro
LOS-R1#show access-lists 10
Standard IP access list 10
    10 permit 10.10.50.10`, "The agent's configuration. RO and RW communities, the ACL number on the RW one, and the trap destination.")}
<p>The RO community answers anyone who can reach the router (in production, lock it with an ACL too); the RW one answers only sources ACL 10 permits, and RW includes read. In the traps line, <i>authentication</i> fires on a wrong community, <i>linkdown/linkup</i> on interface changes, <i>coldstart/warmstart</i> after a reboot. On the <code>host</code> line the community is a label carried in the trap, not a permission.</p>
<h3>Polling from the management server: the Net-SNMP tools</h3>
<p>Most monitoring servers run Linux with ${K.g("Net-SNMP","The standard open-source SNMP toolkit: snmpget, snmpwalk, snmpset and friends, found on most Linux monitoring servers.")}, whose tools test an agent by hand before you blame the NMS. All take the shape <code>tool -v2c -c &lt;community&gt; &lt;agent address&gt; &lt;object&gt;</code>: <code>snmpget</code> sends a Get, <code>snmpwalk</code> sends GetNext after GetNext to print a whole table, and <code>snmpset</code> sends a Set (<code>s</code> before the value means &ldquo;string&rdquo;). When no answer comes, each tool waits 1 second and resends, up to 5 times (its <code>-t</code> and <code>-r</code> defaults), before it prints <code>Timeout</code>.</p>
${K.out(`NMS> snmpget -v2c -c L4gos-ro 10.10.50.1 sysName.0 sysLocation.0 sysContact.0
SNMPv2-MIB::sysName.0 = STRING: LOS-R1
SNMPv2-MIB::sysLocation.0 = STRING: Lagos HQ, comms room 2
SNMPv2-MIB::sysContact.0 = STRING: noc@example.com
NMS> snmpwalk -v2c -c L4gos-ro 10.10.50.1 ifOperStatus
IF-MIB::ifOperStatus.1 = INTEGER: up(1)
IF-MIB::ifOperStatus.2 = INTEGER: up(1)
IF-MIB::ifOperStatus.3 = INTEGER: down(2)
IF-MIB::ifOperStatus.4 = INTEGER: up(1)
NMS> snmpwalk -v2c -c L4gos-ro 10.10.50.1 ifDescr
IF-MIB::ifDescr.1 = STRING: GigabitEthernet0/0
IF-MIB::ifDescr.2 = STRING: GigabitEthernet0/1
IF-MIB::ifDescr.3 = STRING: GigabitEthernet0/2
IF-MIB::ifDescr.4 = STRING: Null0`, "One Get for three objects, then two walks. Each line is MIB::object.instance = TYPE: value.")}
<p><code>SNMPv2-MIB::sysName.0</code> is the defining MIB, the object and its instance; <code>STRING:</code> and <code>INTEGER:</code> give the type, and <code>up(1)</code> is a number with its meaning beside it. Read the two walks <b>together by index</b>: ifIndex 3 is GigabitEthernet0/2, the unused, shut port; <code>Null0</code> is the router's built-in discard interface, always up.</p>
<p>Now try writing. The read-only community is refused; the read-write one, from the address ACL 10 allows, works:</p>
${K.out(`NMS> snmpset -v2c -c L4gos-ro 10.10.50.1 sysLocation.0 s "Lagos HQ, rack B4"
Error in packet.
Reason: noAccess
Failed object: SNMPv2-MIB::sysLocation.0
NMS> snmpset -v2c -c L4gos-rw 10.10.50.1 sysLocation.0 s "Lagos HQ, rack B4"
SNMPv2-MIB::sysLocation.0 = STRING: Lagos HQ, rack B4
NMS> snmpget -v2c -c l4gos-ro 10.10.50.1 sysName.0
Timeout: No Response from 10.10.50.1.`, "RO can't write: the agent sends back an error (shown here as noAccess; some Cisco releases report notWritable — either way, not with this community). RW from the permitted host can, and the running-config now shows the new location. One wrong letter (lower-case l) gets silence.")}
<p>That last line matters most: a v2c agent <b>never answers a wrong community</b>. To Net-SNMP, a wrong community, a blocking ACL, an agent that's off and no route all look identical — <code>Timeout</code>. The router's counters tell them apart:</p>
${K.out(`LOS-R1#show snmp | include input|community
19 SNMP packets input
    6 Unknown community name
    1 Illegal operation for community name supplied`, "After the commands above, 19 requests arrived: one Get, five GetNexts per walk (one per row, plus one that steps past the end), two Sets — and the wrong-letter Get six times, because snmpget resent it five times. Six Unknown community name; one Illegal operation (the Set with the RO community). The lab's snmpget doesn't resend, so the same commands there give 14 and 1.")}
${K.steps([
  ["Can the NMS reach the router?", "<code>ping</code> from the NMS. No reply → a routing or path problem (Module 5), not SNMP."],
  ["Is the agent on, and do polls arrive?", "<code>show snmp</code>: <code>%SNMP agent not enabled</code> → no community. <i>SNMP packets input</i> not rising as you poll → the requests aren't arriving."],
  ["Wrong community?", "<i>Unknown community name</i> rises with each poll → compare the strings character by character (case-sensitive). Many IOS releases also count a request that the community's ACL refused here, so if the strings match exactly, go to the next step."],
  ["Blocked by the community's ACL?", "Polls arrive, the string matches a community, still no answer → <code>show running-config | include snmp</code> for the ACL number, <code>show access-lists</code> for who it permits."],
])}
${K.mistake(`Leaving <code>public</code> or <code>private</code> configured, or one string for both RO and RW. Attackers try the defaults first, and many printers and UPSs ship with them. Every community: unique, long, ACL-limited — and RW only if something must write.`)}
${K.mistake(`Assuming a timeout means &ldquo;the router is down&rdquo;. A working router still times out SNMP with a mistyped community or an ACL listing the old NMS. Ping first, then read <code>show snmp</code>.`)}
<h3>Try it: fix a colleague's SNMP config to match the change request</h3>
<p>A colleague configured IKJ-EDGE (Ikeja) from change request CR-2291 before going on leave. It says: <b>read-only</b> community <code>Ikj-mon</code>, usable <b>only</b> by the NMS at <code>10.40.50.10</code> (ACL 30); <b>no read-write community at all</b>; location <code>Ikeja office, ground-floor rack</code>; contact <code>noc@example.com</code>; <b>v2c</b> traps to the NMS with community <code>Ikj-mon</code>. Fix where the router differs.</p>
${K.term({env:"ios2", title:"audit and fix SNMP on IKJ-EDGE", opts:{kind:"router", host:"IKJ-EDGE", model:"C1111-4P", motd:"IKJ-EDGE — console session (lab router, no enable secret)."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","ip address 10.40.10.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.40.50.1 255.255.255.0","no shutdown","exit",
    "access-list 30 permit host 10.40.50.11","snmp-server community Ikj-mon RW","snmp-server contact noc@example.com","snmp-server host 10.40.50.10 Ikj-mon","snmp-server enable traps","end","copy running-config startup-config","","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code>. Read before you change anything, and compare every line with CR-2291.",
  tasks:[
    {text:"Read the handover: <code>show running-config | include snmp</code> and <code>show access-lists</code>. Which three things differ from the request — and which is a security problem?", done:e=>e.log.some(l=>/sh\S*\s+run\S*\s*\|\s*i\S*\s+snmp/i.test(l.cmd||"")) && e.log.some(l=>/sh\S*\s+acc\S*/i.test(l.cmd||""))},
    {text:"Make <code>Ikj-mon</code> read-only and bind it to ACL 30: <code>configure terminal</code>, then <code>snmp-server community Ikj-mon RO 30</code> (re-entering a community replaces its permission)", done:e=>{ const c = e.snmp.communities["Ikj-mon"]; return !!c && c.mode==="ro" && c.acl==="30" && Object.values(e.snmp.communities).every(x=>x.mode==="ro"); }},
    {text:"ACL 30 names the wrong host. Remove the whole list with <code>no access-list 30</code> and rebuild it so only the NMS, 10.40.50.10, is permitted", done:e=>window.ACL && e.acl.lists["30"] && window.ACL.check(e.acl,"30",{src:"10.40.50.10"},false).permit && !window.ACL.check(e.acl,"30",{src:"10.40.50.11"},false).permit},
    {text:"The trap line has no version, so IOS sends v1 traps. Remove it with <code>no snmp-server host 10.40.50.10 Ikj-mon</code> and add the v2c one the request asks for", done:e=>e.snmp.hosts.length===1 && e.snmp.hosts[0].ip==="10.40.50.10" && e.snmp.hosts[0].ver==="2c" && e.snmp.hosts[0].community==="Ikj-mon"},
    {text:"Add the missing location: <code>snmp-server location Ikeja office, ground-floor rack</code>", done:e=>e.snmp.location==="Ikeja office, ground-floor rack"},
    {text:"<code>end</code>, check with <code>show running-config | include snmp</code> again, then save with <code>copy running-config startup-config</code>", done:e=>!!e.startup && e.startup.snmp.communities["Ikj-mon"] && e.startup.snmp.communities["Ikj-mon"].mode==="ro" && e.startup.snmp.communities["Ikj-mon"].acl==="30" && e.startup.snmp.hosts.some(h=>h.ver==="2c") && e.startup.snmp.location==="Ikeja office, ground-floor rack"},
  ],
  win:"IKJ-EDGE now matches CR-2291: one read-only community that only the NMS can use, v2c traps, location and contact — and no read-write community anyone could use to change the router. The RW permission was the security problem; the wrong ACL host would have shown up as a grey 'no response' tile; the v1 traps might have been ignored by an NMS expecting v2c.",
  solve:["enable","show running-config | include snmp","show access-lists","configure terminal","snmp-server community Ikj-mon RO 30","no access-list 30","access-list 30 permit host 10.40.50.10","no snmp-server host 10.40.50.10 Ikj-mon","snmp-server host 10.40.50.10 version 2c Ikj-mon","snmp-server location Ikeja office, ground-floor rack","end","show running-config | include snmp","copy running-config startup-config",""]})}
${K.hint(`Three differences: <code>RW</code> where the request says read-only (the security problem), an ACL permitting <code>.11</code> instead of <code>.10</code>, and a trap host with no <code>version 2c</code>. The location line is simply missing.`)}
${K.check({q:"A router has snmp-server community Abj-mon RO 15 and access-list 15 permit host 10.30.50.20. The new NMS at 10.30.50.10 polls with Abj-mon and times out; the old server at .20 still gets answers. What is the fix?", o:["Change the community to RW","Add access-list 15 permit host 10.30.50.10","Add snmp-server host 10.30.50.10 version 2c Abj-mon","Configure snmp-server enable traps"], a:1, why:"The community is right (the old server proves it) but ACL 15 only permits .20, so the agent ignores the new NMS. Permitting .10 in ACL 15 fixes polling. snmp-server host and enable traps control alerts, not polls; RW would only add risk."})}
${K.q({type:"fill", q:"Write the IOS global configuration command for each requirement.", fields:[
  {label:"A read-only community Kd-mon that only the hosts in access list 12 may use", a:["snmp-server community Kd-mon RO 12"], ios:true},
  {label:"Send SNMPv2c traps to 10.60.50.10 with the community Kd-mon", a:["snmp-server host 10.60.50.10 version 2c Kd-mon"], ios:true},
  {label:"Turn on every trap type the router supports", a:["snmp-server enable traps"], ios:true},
  {label:"Record that the router lives in the Kaduna comms room", a:["snmp-server location Kaduna comms room"], ios:true}],
  why:"A community is snmp-server community STRING RO|RW [ACL]. Traps need a destination (snmp-server host IP version 2c COMMUNITY — without version 2c IOS sends v1) and permission to send (snmp-server enable traps). snmp-server location fills sysLocation.0."})}
<h3>Same logic, new situation</h3>
<p>A Port Harcourt NOC engineer says: &ldquo;Our NMS times out on PH-BR5, so the router must be down.&rdquo; Users are working. You SSH in and watch <code>show snmp</code> while she polls three times (one request each, no retries): <i>SNMP packets input</i> rises by 3, and so does <i>Unknown community name</i>. What's wrong, and what isn't?</p>
${K.hint(`Packets input rising tells you about the path. The second counter tells you about the string.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why polls time out on a router that works. <b>2. Rule:</b> a v2c agent silently ignores a wrong community; <i>SNMP packets input</i> proves the polls arrive, and <i>Unknown community name</i> proves the string doesn't match. <b>3. Apply it:</b> the router is up and reachable — all three polls arrived — and they carried a community the router doesn't have. Compare the NMS's string with <code>show running-config | include snmp</code> character by character (case matters). Not routing, and not &ldquo;the router is down&rdquo;. (Many IOS releases also count a source refused by a community's ACL as an unknown community — so if the strings match exactly, check that community's ACL next.)</p>`)}
<h3>Hands-on: the grey tile and the audit finding</h3>
<p>Abuja NOC. The new NMS (10.70.50.10) shows KN-BR1 as &ldquo;no response&rdquo;; the old server MON-OLD (10.70.50.20), retiring on Friday, still graphs it. The auditor adds: &ldquo;KN-BR1 accepts SNMP writes with <i>public</i>.&rdquo; Work from the NMS: SSH to the router (Module 2), test with Net-SNMP.</p>
${K.bench({id:"m7-snmp-noc", points:100, from:"CCNA · Module 7 · lesson 7", title:"a grey tile, a public RW community and no traps", viewBox:"0 0 900 380",
  intro:"NMS and MON-OLD have the Net-SNMP tools in their <b>Command Prompt</b>; NMS's <b>Server services</b> lists received traps. KN-BR1 SSH: user <code>noc</code>, password <code>N0c-Kano!</code>, enable secret <code>Arewa-26</code>; inside the session you're typing to the router — <code>exit</code> to return. <b>Lab notes:</b> v2c only; the agent knows the sys* objects plus ifDescr, ifAdminStatus and ifOperStatus; one interface bounce may list more than one linkDown or linkUp row.",
  devices:[
    {id:"core", kind:"router", label:"ABJ-CORE", x:20, y:20, config:e=>{ ["en","conf t","hostname ABJ-CORE","no ip domain-lookup","int g0/0","description NOC LAN","ip address 10.70.50.1 255.255.255.0","no shut","int g0/1","description WAN to KN-BR1","ip address 10.70.255.1 255.255.255.252","no shut","exit","ip route 10.70.20.0 255.255.255.0 10.70.255.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"kn", kind:"router", label:"KN-BR1", x:640, y:20, config:e=>{ ["en","conf t","hostname KN-BR1","enable secret Arewa-26","no ip domain-lookup","ip domain-name example.net","username noc secret N0c-Kano!","crypto key generate rsa modulus 2048","ip ssh version 2","line vty 0 4","login local","transport input ssh","exit",
      "int g0/0","description KANO STAFF LAN","ip address 10.70.20.1 255.255.255.0","no shut","int g0/1","description WAN to ABJ-CORE","ip address 10.70.255.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.70.255.1",
      "access-list 15 permit host 10.70.50.20","snmp-server community Kn0-mon RO 15","snmp-server community public RW","snmp-server location Kano branch, comms cabinet","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"NOC-SW", x:20, y:140},
    {id:"nms", kind:"server", label:"NMS", x:40, y:262, ip:"10.70.50.10", mask:"255.255.255.0", gw:"10.70.50.1", services:{nms:true}},
    {id:"old", kind:"server", label:"MON-OLD", x:220, y:262, ip:"10.70.50.20", mask:"255.255.255.0", gw:"10.70.50.1", services:{nms:true}},
    {id:"pc", kind:"pc", label:"KN-PC1", x:680, y:262, ip:"10.70.20.50", mask:"255.255.255.0", gw:"10.70.20.1"},
  ],
  cables:[ {type:"cat6", a:"core:g0", b:"sw:g1"}, {type:"cat6", a:"nms:eth", b:"sw:g2"}, {type:"cat6", a:"old:eth", b:"sw:g3"}, {type:"cat6", a:"core:g1", b:"kn:g1"}, {type:"cat6", a:"pc:eth", b:"kn:g0"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce it. On MON-OLD run <code>snmpget -v2c -c Kn0-mon 10.70.255.2 sysName.0 sysLocation.0</code> (it answers), then the identical command on NMS (Timeout). Still on NMS, try <code>snmpget -v2c -c public 10.70.255.2 sysName.0</code> — what does its answer prove about the audit finding?", done:B=>Bench.tried(B,"old",/snmpget\s.*-c\s+Kn0-mon\b/) && Bench.tried(B,"nms",/snmpget\s.*-c\s+Kn0-mon\b/) && Bench.tried(B,"nms",/-c\s+public\b/)},
    {text:"From NMS, <code>ssh -l noc 10.70.255.2</code>, log in, <code>enable</code>. Read <code>show snmp community</code>, <code>show access-lists</code> and <code>show snmp</code>: why does the router answer MON-OLD but not NMS with the same community?", done:B=>{ const h = B.devs.kn.env.history; return h.some(x=>/^\s*sh\S*\s+snmp\s+comm/i.test(x)) && h.some(x=>/^\s*sh\S*\s+acc/i.test(x)); }},
    {text:"Let the new NMS poll: add it to the community's list with <code>access-list 15 permit host 10.70.50.10</code>. Prove it from NMS (<code>exit</code> the SSH session first): the same <code>snmpget</code> now answers, and <code>snmpwalk -v2c -c Kn0-mon 10.70.255.2 ifOperStatus</code> lists the interfaces", done:B=>{ const E = B.devs.kn.env; return window.ACL && E.acl.lists["15"] && window.ACL.check(E.acl,"15",{src:"10.70.50.10"},false).permit && E.snmp.communities["Kn0-mon"] && E.snmp.communities["Kn0-mon"].acl==="15" && Bench.tried(B,"nms",/snmpwalk\s.*-c\s+Kn0-mon\b.*ifOperStatus/); }},
    {text:"Close the audit finding: remove <code>public</code> with <code>no snmp-server community public</code>, and create a write community <code>Kn0-adm</code> that <b>only</b> the NMS may use (a new access list 16 that permits only 10.70.50.10). Prove it: from NMS, <code>snmpset -v2c -c Kn0-adm 10.70.255.2 sysContact.0 s \"noc@example.net\"</code> works; the same command on MON-OLD times out", done:B=>{ const E = B.devs.kn.env, c = E.snmp.communities["Kn0-adm"]; return !E.snmp.communities["public"] && !!c && c.mode==="rw" && !!c.acl && window.ACL && E.acl.lists[c.acl] && window.ACL.check(E.acl,c.acl,{src:"10.70.50.10"},false).permit && !window.ACL.check(E.acl,c.acl,{src:"10.70.50.20"},false).permit && E.snmp.contact==="noc@example.net" && Bench.tried(B,"nms",/snmpset\s.*Kn0-adm/) && Bench.tried(B,"old",/snmpset\s.*Kn0-adm/); }},
    {text:"The NMS should hear about link changes: on KN-BR1 add <code>snmp-server host 10.70.50.10 version 2c Kn0-mon</code> and <code>snmp-server enable traps</code>. It's Sunday and the branch is closed, so test the alarm: on Gi0/0, <code>shutdown</code> then <code>no shutdown</code>. Open NMS's <b>Server services</b>: are linkDown and linkUp there?", done:B=>Bench.trapGot(B,"nms",/changed state to down/) && Bench.trapGot(B,"nms",/changed state to up/)},
    {text:"Save KN-BR1 with <code>copy running-config startup-config</code> (press Enter at the filename prompt), then <code>exit</code> the session", done:B=>{ const s = B.devs.kn.env.startup; return !!s && !s.snmp.communities["public"] && !!s.snmp.communities["Kn0-adm"] && s.snmp.hosts.some(h=>h.ip==="10.70.50.10" && h.ver==="2c") && s.snmp.traps; }},
  ],
  win:"The grey tile was never a dead router: KN-BR1 answered the community from the one address its ACL listed — the old server. Now the new NMS polls it, only the NMS can write, public is gone, and a linkDown/linkUp pair proved the alarms arrive. Friday's job, when MON-OLD is switched off: remove 10.70.50.20 from ACL 15.",
  solve:[["pc","old","snmpget -v2c -c Kn0-mon 10.70.255.2 sysName.0 sysLocation.0"],["pc","nms","snmpget -v2c -c Kn0-mon 10.70.255.2 sysName.0 sysLocation.0"],["pc","nms","snmpget -v2c -c public 10.70.255.2 sysName.0"],
    ["pc","nms","ssh -l noc 10.70.255.2"],["pc","nms","N0c-Kano!"],["pc","nms","enable"],["pc","nms","Arewa-26"],["pc","nms","show snmp community"],["pc","nms","show access-lists"],["pc","nms","show snmp"],
    ["pc","nms","configure terminal"],["pc","nms","access-list 15 permit host 10.70.50.10"],["pc","nms","end"],["pc","nms","exit"],
    ["pc","nms","snmpget -v2c -c Kn0-mon 10.70.255.2 sysName.0 sysLocation.0"],["pc","nms","snmpwalk -v2c -c Kn0-mon 10.70.255.2 ifOperStatus"],
    ["pc","nms","ssh -l noc 10.70.255.2"],["pc","nms","N0c-Kano!"],["pc","nms","enable"],["pc","nms","Arewa-26"],["pc","nms","configure terminal"],["pc","nms","no snmp-server community public"],["pc","nms","access-list 16 permit host 10.70.50.10"],["pc","nms","snmp-server community Kn0-adm RW 16"],["pc","nms","end"],["pc","nms","exit"],
    ["pc","nms","snmpset -v2c -c Kn0-adm 10.70.255.2 sysContact.0 s \"noc@example.net\""],["pc","old","snmpset -v2c -c Kn0-adm 10.70.255.2 sysContact.0 s \"noc@example.net\""],
    ["pc","nms","ssh -l noc 10.70.255.2"],["pc","nms","N0c-Kano!"],["pc","nms","enable"],["pc","nms","Arewa-26"],["pc","nms","configure terminal"],["pc","nms","snmp-server host 10.70.50.10 version 2c Kn0-mon"],["pc","nms","snmp-server enable traps"],
    ["pc","nms","interface g0/0"],["pc","nms","shutdown"],["pc","nms","no shutdown"],["pc","nms","end"],["pc","nms","copy running-config startup-config"],["pc","nms",""],["pc","nms","exit"]]})}
${K.hint(`Task 2: <code>show snmp community</code> shows <code>access-list: 15</code> next to Kn0-mon; <code>show access-lists</code> shows who list 15 permits. Task 4: a new list 16 keeps writes stricter than reads, which must admit MON-OLD until Friday.`)}

<h2>Backing up and restoring configurations with TFTP</h2>
${K.remember(`<b>The rule:</b> <code>copy &lt;from&gt; &lt;to&gt;</code> — read it left to right. <code>copy running-config tftp:</code> = a backup <b>to</b> a server. <code>copy tftp: running-config</code> loads a file <b>into</b> the running config as a <b>merge</b>: each line is applied as if typed, and nothing else is removed.`)}
<p>TFTP (Module 1) is the simplest file copy: the client names a file on <b>UDP 69</b> (to read or to write it) and the data then moves in small numbered blocks (512 bytes by default), each acknowledged before the next is sent. There's <b>no login, no encryption and no directory listing</b> — you must know the exact name, and anyone who can reach the server can read or write its files. Simple enough for every router and IP phone; safe only on a management network.</p>
${K.dyk(`A TFTP transfer doesn't stay on port 69. The server answers from a new, random port, so a firewall rule for UDP 69 alone isn't enough — firewalls and NAT need a TFTP helper.`)}
<h3>Worked example: back up IBD-R1</h3>
<p>The Ibadan router IBD-R1 (172.16.10.1 on its server LAN) backs up to the TFTP server at 172.16.10.5.</p>
${K.out(`IBD-R1#copy running-config tftp:
Address or name of remote host []? 172.16.10.5
Destination filename [ibd-r1-confg]?
!!
488 bytes copied in 0.512 secs (953 bytes/sec)`, "A backup. IOS asks two questions; the square brackets hold the default you get by pressing Enter.")}
${K.steps([
  ["<code>copy running-config tftp:</code>", "From the running configuration to a TFTP server. <code>copy startup-config tftp:</code> sends the saved one — they differ whenever someone forgot to save."],
  ["<code>Address or name of remote host []?</code>", "The TFTP server. The router needs a route to it; TFTP is UDP, so a missing route shows up only as a timeout."],
  ["<code>Destination filename [ibd-r1-confg]?</code>", "IOS suggests the hostname in lower case plus <code>-confg</code>. Press Enter, or type a better name such as <code>ibd-r1-2026-10-12</code>."],
  ["<code>!!</code> and the byte count", "Progress, then how much arrived. <code>%Error opening tftp://… (Timed out)</code> instead means the server never answered: no route, wrong address, or no TFTP service."],
])}
${K.mistake(`Pressing Enter at <code>Destination filename</code> on a broken router. The default is the nightly job's name, and most TFTP servers overwrite — replacing last night's <b>good</b> backup with today's broken config. Save broken configs as evidence under a different name.`)}
<h3>Worked example: restore — and what a merge really does</h3>
<p>That afternoon someone types <code>description TEMP</code> and <code>shutdown</code> on Gi0/0, removes <code>logging host 172.16.10.5</code>, and adds a test route, <code>ip route 10.99.0.0 255.255.0.0 172.16.10.254</code>. You load the morning's file back:</p>
${K.out(`IBD-R1#copy tftp: running-config
Address or name of remote host []? 172.16.10.5
Source filename []? ibd-r1-confg
Destination filename [running-config]?
Accessing tftp://172.16.10.5/ibd-r1-confg...
Loading ibd-r1-confg from 172.16.10.5 (via GigabitEthernet0/1): !
[OK - 488 bytes]

488 bytes copied in 0.312 secs (1564 bytes/sec)

IBD-R1#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     172.16.20.1     YES manual administratively down down
GigabitEthernet0/1     172.16.10.1     YES manual up                    up
GigabitEthernet0/2     unassigned      YES unset  administratively down down
IBD-R1#show running-config | include description|logging host|ip route
 description STAFF LAN
 description SERVER LAN
ip route 0.0.0.0 0.0.0.0 172.16.10.254
ip route 10.99.0.0 255.255.0.0 172.16.10.254
logging host 172.16.10.5`, "Press Enter at Destination [running-config]. The file loaded — yet the router is NOT what it was this morning.")}
<p>Each change met a different fate (the diagram below sets them side by side). Two need explaining. The test route is <b>kept</b> because a merge never removes anything: statics, communities and ACL entries can have many lines, so new ones join the old. And Gi0/0 is <b>still shut</b> because a running-config shows <code>shutdown</code> only on interfaces that <i>are</i> shut — an interface that was up has no <code>no shutdown</code> line, so nothing in the file brings it back.</p>
${K.svg("0 0 760 330",
  K.band(15,10,230,26,"running-config now")+K.band(265,10,230,26,"+ ibd-r1-confg (this morning)")+K.band(515,10,230,26,"= after the merge")+
  K.box(15,50,230,46,"description TEMP","Gi0/0, typed this afternoon")+K.box(265,50,230,46,"description STAFF LAN","the morning's value")+K.box(515,50,230,46,"description STAFF LAN","overwritten: one value per interface",true)+
  K.box(15,106,230,46,"(no logging host)","removed this afternoon")+K.box(265,106,230,46,"logging host 172.16.10.5","in the file")+K.box(515,106,230,46,"logging host 172.16.10.5","added back",true)+
  K.box(15,162,230,46,"ip route 10.99.0.0 …","added this afternoon")+K.box(265,162,230,46,"(no such line)","the file never had it")+K.box(515,162,230,46,"ip route 10.99.0.0 …","kept: a merge never deletes",true)+
  K.box(15,218,230,46,"shutdown","Gi0/0, typed this afternoon")+K.box(265,218,230,46,"(no shutdown line)","up interfaces have no such line")+K.box(515,218,230,46,"shutdown","still shut: nothing undoes it",true)+
  K.txt(380,292,"Merge (copy tftp: running-config): every file line is typed in again; nothing else changes.",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(380,314,"Replace (copy tftp: startup-config, then reload): the router comes back exactly as the file says.",{c:"muted",s:11,mid:true,f:"body"}),
  "What a merge does to four kinds of change. The right-hand column is what IBD-R1 looked like after copy tftp: running-config.")}
${K.remember(`<b>The merge rules — &ldquo;Back, Over, Stay, Shut&rdquo;:</b> lines missing from the router come <b>back</b>; single-value lines are written <b>over</b>; extra lines <b>stay</b>; a shut interface stays <b>shut</b>. After every restore, check <code>show ip interface brief</code> and remove what shouldn't be there.`)}
<h3>When you need a real replace</h3>
${K.when([
  ["Merge: <code>copy tftp: running-config</code>","Putting back deleted lines, or loading a snippet (new SNMP or NTP lines)","No reload, no outage","The router must match the file exactly"],
  ["Replace with a reload: <code>copy tftp: startup-config</code>, then <code>reload</code>","A badly mangled router, or a spare built from the old one's backup","After the reboot it runs exactly the file","Business hours — the reload is an outage"],
  ["<code>configure replace</code> (IOS / IOS XE)","Routine rollbacks: IOS applies additions <i>and</i> removals","Exact match without a reload","The file isn't a complete config — beyond CCNA, not in this lab"],
], "Restoring a configuration: merge or replace?")}
${K.tip(`Name backups hostname plus date (<code>wr-br1-2026-10-12</code>) and keep weeks of them. IOS can automate this with its <code>archive</code> feature, and many teams run a backup tool that pulls every config nightly over SSH.`)}
${K.check({q:"Yesterday's backup of a router contains ip route 0.0.0.0 0.0.0.0 10.0.0.1. Today someone added ip route 0.0.0.0 0.0.0.0 10.0.0.9 and removed snmp-server location. After copy tftp: running-config with yesterday's file, what does the router have?", o:["Only the route via 10.0.0.1, and the location back","Both default routes, and the location back","Only the route via 10.0.0.9, and no location","Exactly yesterday's configuration"], a:1, why:"A merge only applies the file's lines. The location comes back (it's in the file), the route via 10.0.0.1 is re-entered, and the route via 10.0.0.9 stays because nothing in the file removes it. Only a replace makes the router match the file exactly."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"Last night's backup of KD-BR2 was taken with every interface up. Today an intern shut Gi0/1, deleted the line ntp server 10.60.50.5 and added snmp-server community test RW. You run copy tftp: running-config with last night's file. Which THREE are true afterwards?", o:["ntp server 10.60.50.5 is back","Gi0/1 is still administratively down","snmp-server community test RW is still configured","Gi0/1 is up again because the file has its configuration","The test community is removed because the file doesn't have it","The router now matches last night's file exactly"], a:[0,1,2], why:"1. What is asked? The state after a merge. 2. Rule: a merge re-types every file line and removes nothing; shut interfaces stay shut because an up interface has no 'no shutdown' line in a config. 3. Apply it: the NTP line is in the file, so it's back. Gi0/1's lines are re-applied, but none of them is 'no shutdown', so it stays down. The test community isn't in the file, so nothing removes it — and it's a write community, so remove it by hand with no snmp-server community test."})}
${K.q({type:"order", q:"A branch router was mangled this morning and users are down. Put the restore in a safe order.", items:["Back up the broken config under a new name, e.g. copy running-config tftp: as kd-br2-broken","copy tftp: running-config with last night's file","Check what the merge couldn't fix: show ip interface brief and show running-config","Bring up any shut interface and remove lines that shouldn't be there","Test from a user's PC, then copy running-config startup-config","Take a fresh, dated backup"], why:"Evidence first (and under a new name, so last night's file survives); then merge the good file; then fix what a merge can't — shut interfaces and extra lines; prove it from the user's side; save, so a reboot doesn't undo the fix; and record the good state with a new backup."})}
<h3>Hands-on: the Warri restore</h3>
<p>Monday. At 07:00 a contractor &ldquo;tidied up&rdquo; the Warri depot router WR-BR1; since then every depot PC shows a 169.254 address. Last night's backup, <code>wr-br1-confg</code>, on the BACKUP server predates his work. You're at the depot with the NOC laptop on WR-BR1's console.</p>
${K.bench({id:"m7-tftp-restore", points:100, from:"CCNA · Module 7 · lesson 7", title:"restore a mangled branch router from last night's backup", viewBox:"0 0 900 380",
  intro:"Console on WR-BR1: <b>Terminal app (PuTTY)</b> on NOC LAPTOP, 9600 8N1, no flow control (lab router: no enable secret). <b>Design:</b> Warri LAN 172.20.30.0/24 (WR-BR1 .1, pool WR-LAN); WAN 172.20.255.4/30 (LG-CORE .5, WR-BR1 .6); BACKUP 172.20.60.10 runs TFTP and syslog — its <b>Server services</b> lists the files (click one to read it) and arriving log messages. <b>Lab notes:</b> TFTP only; the server overwrites a same-named file without asking; the PCs ask for an address again whenever the network changes.",
  devices:[
    {id:"core", kind:"router", label:"LG-CORE", x:20, y:20, config:e=>{ ["en","conf t","hostname LG-CORE","no ip domain-lookup","int g0/0","description SERVER LAN","ip address 172.20.60.1 255.255.255.0","no shut","int g0/1","description WAN to WR-BR1","ip address 172.20.255.5 255.255.255.252","no shut","exit","ip route 172.20.30.0 255.255.255.0 172.20.255.6","logging host 172.20.60.10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wr", kind:"router", label:"WR-BR1", x:400, y:20, config:e=>{ ["en","conf t","hostname WR-BR1","no ip domain-lookup","ip dhcp excluded-address 172.20.30.1 172.20.30.20",
      "int g0/0","description WARRI STAFF LAN","ip address 172.20.30.1 255.255.255.0","shutdown","int g0/1","description WAN to LG-CORE","ip address 172.20.255.6 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 172.20.255.5",
      "logging host 172.20.60.10","access-list 20 permit host 172.20.60.20","snmp-server community WRmon-ro RO 20","snmp-server community public RW","snmp-server location Warri depot, store room","snmp-server contact noc@example.net","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"bk", kind:"server", label:"BACKUP", x:60, y:262, ip:"172.20.60.10", mask:"255.255.255.0", gw:"172.20.60.1", services:{syslog:true, tftp:{files:{
      "lg-core-confg":["!","! Last configuration change at 11:42:19 UTC Thu Oct 8 2026","!","version 17.9","no service password-encryption","!","hostname LG-CORE","!","no ip domain lookup","!","interface GigabitEthernet0/0"," description SERVER LAN"," ip address 172.20.60.1 255.255.255.0","!","interface GigabitEthernet0/1"," description WAN to WR-BR1"," ip address 172.20.255.5 255.255.255.252","!","interface GigabitEthernet0/2"," no ip address"," shutdown","!","ip route 172.20.30.0 255.255.255.0 172.20.255.6","logging host 172.20.60.10","!","!","line con 0","line vty 0 4","!","end"].join("\n"),
      "wr-br1-confg":["!","! Last configuration change at 16:05:11 UTC Fri Oct 9 2026","!","version 17.9","no service password-encryption","!","hostname WR-BR1","!","no ip domain lookup","!","ip dhcp excluded-address 172.20.30.1 172.20.30.20","!","ip dhcp pool WR-LAN"," network 172.20.30.0 255.255.255.0"," default-router 172.20.30.1"," dns-server 172.20.60.53"," domain-name warri.example.net","!","!","interface GigabitEthernet0/0"," description WARRI STAFF LAN"," ip address 172.20.30.1 255.255.255.0","!","interface GigabitEthernet0/1"," description WAN to LG-CORE"," ip address 172.20.255.6 255.255.255.252","!","interface GigabitEthernet0/2"," no ip address"," shutdown","!","ip route 0.0.0.0 0.0.0.0 172.20.255.5","!","ip access-list standard 20"," 10 permit 172.20.60.20","logging host 172.20.60.10","snmp-server community WRmon-ro RO 20","snmp-server location Warri depot, store room","snmp-server contact noc@example.net","!","!","line con 0","line vty 0 4","!","end"].join("\n") }}}},
    {id:"wsw", kind:"switch", label:"WR-SW", x:400, y:140},
    {id:"p1", kind:"pc", label:"WR-PC1", x:420, y:262, dhcp:true},
    {id:"p2", kind:"pc", label:"WR-PC2", x:560, y:262, dhcp:true},
    {id:"lap", kind:"laptop", label:"NOC LAPTOP", x:740, y:262},
  ],
  cables:[ {type:"cat6", a:"core:g0", b:"bk:eth"}, {type:"cat6", a:"core:g1", b:"wr:g1"}, {type:"cat6", a:"wr:g0", b:"wsw:g1"}, {type:"cat6", a:"p1:eth", b:"wsw:g2"}, {type:"cat6", a:"p2:eth", b:"wsw:g3"}, {type:"console", a:"lap:usb", b:"wr:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Evidence first. Connect to WR-BR1's console, <code>enable</code>, and back up the broken config with <code>copy running-config tftp:</code> to 172.20.60.10 — but at <code>Destination filename</code> type <code>wr-br1-broken</code>. (Pressing Enter would overwrite last night's good file; if that happens, press <b>Reset bench</b>.)", done:B=>{ const f = B.devs.bk.services.tftp.files; return !!f["wr-br1-broken"] && /community public RW/.test(f["wr-br1-broken"]) && /ip dhcp pool WR-LAN/.test(f["wr-br1-confg"]||"") && !/public/.test(f["wr-br1-confg"]||""); }},
    {text:"Compare the two files in BACKUP's <b>Server services</b> with what you see on the router (<code>show running-config</code>). Then restore last night's file: <code>copy tftp: running-config</code>, server 172.20.60.10, source <code>wr-br1-confg</code>, Enter at the destination. Done when the DHCP pool WR-LAN is back (<code>show running-config | include dhcp</code>)", done:B=>!!B.devs.wr.env.dhcp.pools["WR-LAN"]},
    {text:"The depot PCs still have 169.254 addresses. Using the merge rules, work out what the restore could not undo, fix it on WR-BR1, and prove it: WR-PC1 gets a 172.20.30.x lease and pings BACKUP (172.20.60.10)", done:B=>!!Bench.leased(B,"p1") && Bench.pinged(B,"p1","172.20.60.10")},
    {text:"Something the backup never had is still on the router — and it's exactly what last lesson's audit would flag. Find it with <code>show running-config | include snmp</code> and remove it", done:B=>{ const E = B.devs.wr.env; return !E.snmp.communities["public"] && !!E.snmp.communities["WRmon-ro"]; }},
    {text:"Make it stick and record it: <code>copy running-config startup-config</code>, then back up the fixed router under a dated name, <code>wr-br1-2026-10-12</code>", done:B=>{ const E = B.devs.wr.env, s = E.startup, f = B.devs.bk.services.tftp.files["wr-br1-2026-10-12"]; return !!s && !s.snmp.communities["public"] && !!s.dhcp.pools["WR-LAN"] && !s.intfs["GigabitEthernet0/0"].shut && !!f && !/public/.test(f) && /ip dhcp pool WR-LAN/.test(f); }},
  ],
  win:"The merge put back what the contractor deleted (the WR-LAN pool), but it couldn't undo his shutdown or remove the public RW community he added — you did those by hand, proved it from a depot PC, saved, and left a dated backup plus the broken one as evidence for the change review.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","copy running-config tftp:"],["term","172.20.60.10"],["term","wr-br1-broken"],["term","show running-config"],
    ["term","copy tftp: running-config"],["term","172.20.60.10"],["term","wr-br1-confg"],["term",""],
    ["term","show ip interface brief"],["term","configure terminal"],["term","interface g0/0"],["term","no shutdown"],["term","end"],["term","show ip dhcp binding"],["pc","p1","ipconfig"],["pc","p1","ping 172.20.60.10"],
    ["term","show running-config | include snmp"],["term","configure terminal"],["term","no snmp-server community public"],["term","end"],
    ["term","copy running-config startup-config"],["term",""],["term","copy running-config tftp:"],["term","172.20.60.10"],["term","wr-br1-2026-10-12"]]})}
${K.hint(`Task 3: &ldquo;Back, Over, Stay, Shut&rdquo; — which of the four can a file never undo? <code>show ip interface brief</code> on WR-BR1 shows it. Task 4: the backup's only community is <code>WRmon-ro</code>.`)}
${K.job("“Kano branch shows ‘no response’ since the router swap”",`
<p><b>The ticket.</b> &ldquo;KN-BR3's router failed Friday; the field engineer installed the spare. Users are fine, but the NMS tile has been grey all weekend and Saturday's link flap raised no alarm.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;How was the spare configured?&rdquo; — <i>typed by hand from the template, not restored from the old router's backup.</i> &ldquo;What does the NMS poll with?&rdquo; — v2c, community <code>Kn3-Mon</code>.</p>
<p><b>Checks, in order.</b> From the NMS, <code>ping 10.71.255.2</code> replies — the path is fine; <code>snmpget -v2c -c Kn3-Mon 10.71.255.2 sysName.0</code> times out. SSH in (<code>ssh -l noc 10.71.255.2</code>) and watch <code>show snmp</code> while polling twice: <i>SNMP packets input</i> and <i>Unknown community name</i> both rise by 12 (two snmpgets, each sent six times) — the polls arrive, and the configuration shows why they're refused:</p>
${K.out(`KN-BR3#show running-config | include snmp
snmp-server community Kn3-mon RO 15
snmp-server location Kano branch 3, comms room
snmp-server contact noc@example.net`, "The hand-typed spare. Two faults: Kn3-mon (lower-case m) is not Kn3-Mon, and there is no snmp-server host or enable traps — no alarms could ever leave this router.")}
<p><b>The fix.</b> The old router's last good file has <code>snmp-server community Kn3-Mon RO 15</code>, <code>snmp-server host 10.70.50.10 version 2c Kn3-Mon</code> and <code>snmp-server enable traps</code>. With the change approved: <code>no snmp-server community Kn3-mon</code>, then <code>copy tftp: running-config</code> with the old file — here a merge is exactly right, because you <i>want</i> its lines added to the spare. <code>show ip interface brief</code> is unchanged; <code>show running-config | include snmp</code> matches the old router; the NMS poll answers and a test bounce in the maintenance window produced a linkDown trap. Saved, then a fresh dated backup.</p>
<p><b>What you say.</b> &ldquo;The replacement router worked, but it was set up by hand with one letter different in its monitoring password and no alarm settings, so our system couldn't see it. It now has the old router's full configuration and monitoring is back.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;KN-BR3 spare: community typed Kn3-mon (NMS uses Kn3-Mon; Unknown community name climbing), no trap host. Removed Kn3-mon, merged kn-br3-2026-10-08 from TFTP, interfaces verified, NMS poll OK, test trap 10:41, saved, backup kn-br3-2026-10-12. Root cause: spare built from template, not last backup — propose restoring replacements from the latest backup. 40 min.&rdquo;</i></p>`)}

<h2>FTP, TFTP, SCP and SFTP — and SSH as the secure way in</h2>
${K.remember(`<b>The rule:</b> <b>TFTP</b> = UDP 69, no login, nothing encrypted. <b>FTP</b> = TCP 21 (control) and 20 or a high port (data), with a username and password — but both travel in clear text. <b>SCP</b> and <b>SFTP</b> run inside <b>SSH</b> on TCP 22: a login <i>and</i> encryption. `)}
<p>A configuration is a map of your network — addresses, routes, communities, password hashes. Copy it in clear text and anyone listening has the map.</p>
<ul>
<li><b>FTP</b> adds a login and runs over TCP, so big files such as IOS images transfer reliably. On IOS: <code>ip ftp username</code>, <code>ip ftp password</code>, then <code>copy running-config ftp:</code>. The login and the file are still readable on the wire.</li>
<li>${K.g("SCP","Secure Copy: copies a file over an SSH connection — logged in and encrypted, on TCP 22.")} and ${K.g("SFTP","SSH File Transfer Protocol: file transfer (with directory listing, resume and so on) carried inside SSH on TCP 22.")} reuse SSH from Module 2: the same login, the same encryption. IOS can be an SCP client (<code>copy running-config scp:</code>) and, with <code>ip scp server enable</code> and AAA authorisation, a server.</li>
</ul>
${K.when([
  ["TFTP","An isolated management network; bootloaders and IP phones","Simplest; everything supports it","The path is untrusted or the file holds secrets"],
  ["FTP","Large files on a trusted network","Reliable TCP; has a login","Anyone could capture the login or file"],
  ["SCP","Config backups and image copies on any network","SSH login and encryption","A device that only knows TFTP"],
  ["SFTP","Backup tools that need listing and resume","Full file transfer inside SSH","The device doesn't support it — use SCP"],
], "Moving files to and from network devices")}
<h3>SSH is the secure way in</h3>
<p>Module 2 replaced Telnet with SSH because Telnet sends every keystroke, password included, in clear text. Apply the same thinking to every management job: <b>SSH</b> (<code>transport input ssh</code>, <code>login local</code>) for the CLI, <b>SNMPv3 authPriv</b> for monitoring, <b>SCP/SFTP</b> for files — and syslog, NTP and SNMP servers on a management network (lesson 6).</p>
${K.dodont([
  "Keep SNMP, syslog, TFTP and SSH on a management network; ACL-lock every community to the NMS.",
  "Use SNMPv3 authPriv wherever supported; give v2c communities long, unique strings.",
  "Back up after every change, under dated names, and test a restore before you need one.",
  "Build replacement routers from the old router's latest backup, not a hand-typed template.",
],[
  "Leave <code>public</code>, <code>private</code> or any default community on routers, printers or UPSs.",
  "Create an RW community &ldquo;just in case&rdquo;.",
  "Send configs over TFTP or FTP across an untrusted WAN.",
  "Press Enter at the destination filename when backing up a broken router.",
])}
${K.myth([
  ["SNMPv2c is secure because it is newer than v1.","The c is for community: clear text, exactly like v1. Only SNMPv3 authPriv authenticates and encrypts."],
  ["A wrong community gets an error message back.","A v2c agent stays silent, so the manager times out, as if the device were unreachable. show snmp counters tell the difference."],
  ["copy tftp: running-config makes the router identical to the backup.","It merges: extra lines stay and shut interfaces stay shut. A replace needs copy tftp: startup-config and a reload, or configure replace."],
  ["A read-only community is harmless.","RO reveals interfaces, addresses, routes and software versions — a reconnaissance gift. ACL-lock it, and prefer v3."],
  ["TFTP asks for a password, just like FTP.","TFTP has no login at all. FTP has one, but sends it in clear text."],
])}
${K.case("The 'public' community at a microfinance bank",`
<p><b>The finding.</b> A penetration tester at an Abuja microfinance bank scanned for UDP 161. Twenty-two devices answered <code>public</code> — printers, UPSs, an old switch and the core router, which also had <code>private</code> configured <b>RW</b> from an installation years earlier.</p>
<p><b>Why it mattered.</b> With an RW community an attacker doesn't need the CLI. Cisco routers have a config-copy MIB (CISCO-CONFIG-COPY-MIB): a few SNMP Sets make the router send its running-config to <i>the attacker's</i> TFTP server, or load one from it. The tester did exactly that from the guest Wi-Fi.</p>
<p><b>The options.</b> (1) Long random strings, carry on with v2c. (2) SNMPv3 authPriv everywhere at once. (3) A staged plan.</p>
<p><b>The decision.</b> Staged. Week 1: remove every RW and default community, lock new v2c RO communities to the NMS with ACLs, block UDP 161 from user and guest networks. Month 1: SNMPv3 authPriv on every router and switch; the v2c-only printers and UPSs moved to a VLAN only the NMS can reach; backups moved from TFTP to SCP.</p>
<p><b>Lessons.</b> RW plus clear-text communities is an unlocked admin door: treat an RW community exactly like an admin password. The re-test found nothing answering <code>public</code>.</p>`)}
${K.check({q:"A team must copy router configs nightly across a WAN link run by a third-party carrier to a backup server in another city. Which transfer method fits best?", o:["TFTP, because every router supports it","FTP, because it has a username and password","SCP, because it runs inside SSH with a login and encryption","SNMP Sets with the config-copy MIB and an RW community"], a:2, why:"Across a network you don't control, the file (a map of your network) and the login must be encrypted. SCP runs inside SSH on TCP 22. TFTP has no login or encryption; FTP's login and data are clear text; using RW SNMP for it adds the weakest link of all."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Match each situation with the best choice.", pairs:[["A brand-new IP phone needs its boot file from the server on the voice VLAN","TFTP"],["Nightly config backups of 200 routers across a carrier's WAN","SCP"],["Monitoring a bank's core switches; the auditor wants encrypted management traffic","SNMPv3 authPriv"],["An old UPS that only speaks v2c must be monitored","SNMPv2c on an isolated management VLAN, ACL to the NMS"],["An engineer needs the CLI of a router in another state","SSH"]], why:"1. What is asked? The right management tool for each job. 2. Rule: pick the option that authenticates and encrypts when the path or the data needs protecting; fall back to the simple protocol only where devices can't do better, and isolate it. 3. Apply it: the phone only speaks TFTP and stays on its own VLAN; WAN backups need SCP; the bank needs v3 authPriv; the v2c-only UPS is isolated and ACL-limited; remote CLI is SSH, never Telnet."})}
${K.exam(`Reading a copy question: say it as <b>copy FROM TO</b>. <code>copy running-config tftp:</code> = backup; <code>copy tftp: running-config</code> = merge; <code>copy tftp: startup-config</code> = replace at the next reload; <code>copy running-config startup-config</code> = save. Traps: &ldquo;restores the router exactly&rdquo; for a merge, and TFTP with &ldquo;authentication&rdquo; or &ldquo;TCP&rdquo;.`)}

<h2>Interview corner</h2>
${K.hint(`Roles and direction first (manager, agent, 161, 162), then versions and security, then how you'd troubleshoot.`)}
${K.reveal("“Explain SNMP to me — and how you'd secure it.”",`<p>"SNMP lets a monitoring server — the manager — read a device's state from its agent. The manager polls UDP 161 for MIB objects named by OIDs, such as sysName.0; the agent pushes traps, or acknowledged informs, to UDP 162. v1 and v2c communities travel in clear text, so I'd use read-only, unique strings, an ACL so only the NMS is answered, and a management network. Where devices support it, SNMPv3 authPriv gives per-user logins with SHA authentication and AES encryption. And no RW unless something must write — RW can change or even copy out the whole config."</p>`)}
${K.hint(`Copy is FROM TO; merge versus replace; what survives a merge.`)}
${K.reveal("“A router was misconfigured and you have last night's backup on a TFTP server. Walk me through the restore.”",`<p>"First I back up the broken config under a new name, as evidence and so last night's file stays safe. Then <code>copy tftp: running-config</code> — a merge: deleted lines come back and single values are overwritten, but added lines stay and a shut interface stays shut, because a config has no 'no shutdown' lines. So I check <code>show ip interface brief</code> and the running-config for leftovers, fix them, test from the user side, save and take a dated backup. For an exact match I'd copy the file to startup-config and reload in a maintenance window, or use configure replace."</p>`)}
${K.hint(`Each protocol's transport, login and encryption — then where each still belongs.`)}
${K.reveal("“What's the difference between TFTP, FTP and SCP, and which would you use for config backups?”",`<p>"TFTP is UDP 69 with no login and no encryption — fine for bootloaders and IP phones, but anyone who can reach the server can read or write files. FTP is TCP 21 for control and 20 or a high port for data, with a login that travels in clear text. SCP runs inside SSH on TCP 22: a real login and encryption. A config holds password hashes and SNMP strings, so I'd back up with SCP or SFTP, and keep TFTP to an isolated management network or devices that can't do better."</p>`)}

${K.recap([
  "SNMP: the manager (NMS) polls the agent on UDP 161 with Get, GetNext, GetBulk and Set; the agent alerts the manager on UDP 162 with Traps (unacknowledged) or Informs (acknowledged).",
  "Each MIB object has an OID such as 1.3.6.1.2.1.1.5.0 (sysName.0); scalars end in .0, table rows in an index such as ifIndex.",
  "SNMPv1/v2c authenticate with a community string sent in clear text; SNMPv3 uses users, and authPriv adds SHA authentication and AES encryption — the secure option.",
  "IOS: snmp-server community STRING RO|RW [ACL], snmp-server location / contact, snmp-server host IP version 2c COMMUNITY plus snmp-server enable traps for alerts.",
  "Wrong community, blocking ACL and unreachable agent all look like Timeout; ping, then the router's show snmp counters, tell them apart.",
  "copy FROM TO: copy running-config tftp: backs up; copy tftp: running-config merges — missing lines come back, single values are overwritten, extras stay, shut interfaces stay shut.",
  "TFTP = UDP 69, no login or encryption; FTP = TCP 21/20 with a clear-text login; SCP and SFTP run inside SSH (TCP 22) — use them, SSH and SNMPv3 to manage devices securely.",
])}
${K.next(`<b>Lesson 8 — QoS and the Module 7 challenge.</b> When a link is full, which packets go first? Classification and marking, the trust boundary, queuing, policing and shaping — then a branch where DHCP, DNS, NAT, NTP, syslog and SNMP are all broken at once, and a portfolio project for your CV.`)}
`,
quiz:[
  {lvl:1, q:"On which port does an SNMP agent listen for requests from the manager?", o:["UDP 161","UDP 162","TCP 161","UDP 69"], a:0, why:"Agents listen on UDP 161 for Get, GetNext, GetBulk and Set requests. UDP 162 is where the manager listens for traps and informs. UDP 69 is TFTP."},
  {lvl:1, q:"Which SNMP message does an agent send on its own, without being asked and without expecting a reply?", o:["Get","Set","Trap","Inform"], a:2, why:"A Trap is an unrequested, unacknowledged alert from the agent to the manager (UDP 162). An Inform is the same kind of alert but must be acknowledged. Get and Set are the manager's requests."},
  {lvl:2, type:"multi", q:"Which two statements about SNMPv2c are true? (Choose two.)", o:["The community string travels in clear text in every message","It added GetBulk and Inform messages","It encrypts messages with AES","It authenticates each user with SHA","It uses TCP port 161 for reliability"], a:[0,1], why:"v2c kept the v1 community model (clear text) and added GetBulk, Informs and 64-bit counters. Per-user authentication (SHA) and encryption (AES) are SNMPv3. SNMP uses UDP, not TCP."},
  {lvl:2, q:"The new NMS at 10.50.50.10 polls this router with snmpget -v2c -c Ops-ro and gets Timeout. The old NMS at 10.50.50.30 still gets answers with the same community. What is the cause?", ex:"BR7#show running-config | include snmp\nsnmp-server community Ops-ro RO 25\nsnmp-server location Enugu branch 7\nsnmp-server host 10.50.50.30 version 2c Ops-ro\nsnmp-server enable traps snmp authentication linkdown linkup coldstart warmstart\nBR7#show access-lists 25\nStandard IP access list 25\n    10 permit 10.50.50.30", o:["The community should be RW for polling","Access list 25 permits only the old NMS, so the agent ignores requests from 10.50.50.10","The snmp-server host line points at the old NMS, which blocks polls from the new one","Traps must be disabled before a new NMS can poll"], a:1, why:"The community is correct (the old NMS proves it), but it is bound to ACL 25, which permits only 10.50.50.30. Add access-list 25 permit host 10.50.50.10. The snmp-server host line only controls where traps go — the new NMS will also need its own host line to receive alerts, but that doesn't affect polling."},
  {lvl:2, type:"fill", q:"Write the IOS global configuration command that creates the read-only community Mon-ro, usable only by hosts permitted in access list 12.", fields:[{label:"Command", a:["snmp-server community Mon-ro RO 12"], ios:true}], why:"snmp-server community STRING RO|RW [access-list]. The number after RO binds the community to ACL 12, so only permitted sources get answers."},
  {lvl:1, type:"match", q:"Match each SNMP term with its meaning.", pairs:[["Manager","The monitoring software that polls devices and receives alerts"],["Agent","The software in a device that answers polls and sends alerts"],["MIB","The catalogue of objects a device can report"],["OID","The dotted number that names one object"],["Community","The shared clear-text password of SNMPv1/v2c"]], why:"The manager (NMS) asks and the agent answers; the MIB lists what can be asked; each object has an OID; v1/v2c authenticate with a community string."},
  {lvl:2, type:"order", q:"Put the prompts of a restore with copy tftp: running-config in the order IOS asks them.", items:["Address or name of remote host []?","Source filename []?","Destination filename [running-config]?","Accessing tftp://<server>/<file>... then Loading ... !"], why:"copy tftp: running-config asks where the server is, which file to fetch, and confirms the destination (Enter accepts running-config). Then IOS fetches the file over TFTP and merges it. A backup (copy running-config tftp:) asks only for the host and the destination filename."},
  {lvl:2, q:"Yesterday's backup of R3 has snmp-server community Ops-ro RO 10. Today someone added snmp-server community test RW. After copy tftp: running-config with yesterday's file, which communities does R3 have?", o:["Only Ops-ro","Only test","Both Ops-ro and test","Neither — the merge clears all SNMP lines first"], a:2, why:"A merge applies the file's lines and removes nothing. Ops-ro is re-applied and test stays, because nothing in the file removes it. Remove it by hand with no snmp-server community test — and notice it's RW."},
  {lvl:3, q:"Users at a branch work normally, but the NMS has timed out on the branch router since a weekend change. The NMS can ping the router. Based on the exhibit, taken while the NMS polled twice, what is the most likely cause?", ex:"BR2#show running-config | include snmp-server community\nsnmp-server community Br2-mon RO\nBR2#show snmp | include community|packets\n58 SNMP packets input\n    12 Unknown community name\n    0 Illegal operation for community name supplied\n46 SNMP packets output\n(two polls later)\nBR2#show snmp | include community|packets\n60 SNMP packets input\n    14 Unknown community name\n    0 Illegal operation for community name supplied\n46 SNMP packets output", o:["A firewall is dropping UDP 161 between the NMS and the router","The router's SNMP agent is not enabled","The NMS is using a community string the router doesn't have — compare them, including case","The router's access list for the community blocks the NMS"], a:2, why:"Packets input rose by 2, so the polls arrive (not a firewall or routing problem), and the agent is running (it counts them). Unknown community name rose by 2, so the string doesn't match any configured community — often a case difference after a hand-typed change. The only community has no access list, so no ACL can be refusing the NMS."},
  {lvl:2, q:"Which statement about TFTP and FTP is correct?", o:["TFTP uses TCP 69 and requires a login; FTP uses UDP 21","TFTP uses UDP 69 with no login; FTP uses TCP 21 for control and requires a login","Both encrypt the file but not the password","FTP is connectionless; TFTP is connection-oriented"], a:1, why:"TFTP: UDP 69, no authentication, no listing. FTP: TCP, port 21 for control and 20 or a high port for data, with a username and password — but neither protocol encrypts anything. SCP or SFTP (inside SSH) encrypt."},
  {lvl:3, type:"multi", q:"An auditor at a bank finds SNMP answering 'public' on the core router, and router configs backed up over TFTP across a carrier's WAN. Which three changes address the findings best? (Choose three.)", o:["Move device monitoring to SNMPv3 at the authPriv level","Remove every RW and default community, and bind the remaining communities to an ACL that permits only the NMS","Back up configurations with SCP or SFTP instead of TFTP","Keep v2c but use a 40-character community, because a long string is encrypted","Move backups from TFTP to FTP so they have a password","Change SNMP to TCP port 161 so it can be secured"], a:[0,1,2], why:"v3 authPriv authenticates and encrypts; removing RW and default strings and ACL-limiting the rest closes the open door; SCP/SFTP protect configs in transit. A long v2c string is still clear text, FTP sends its password and file unencrypted, and SNMP doesn't become secure by changing transport."},
  {lvl:1, q:"In the SNMP object sysName.0, what does the .0 mean?", o:["SNMP version 0","The first interface on the device","The single instance of a scalar object (an object with one value per device)","The object is read-only"], a:2, why:"Scalar objects such as sysName, sysLocation and sysUpTime have one value per device, and their instance is .0. Table objects end in a row index instead, such as ifOperStatus.2 for interface index 2."},
  {lvl:3, q:"A backup of a branch router fails as in the exhibit. What should you check first?", ex:"KD-BR4#copy running-config tftp:\nAddress or name of remote host []? 10.80.60.10\nDestination filename [kd-br4-confg]?\n%Error opening tftp://10.80.60.10/kd-br4-confg (Timed out)\nKD-BR4#ping 10.80.60.10\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 10.80.60.10, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)", o:["The TFTP server's username and password","Whether the file kd-br4-confg already exists on the server","The route between KD-BR4 and 10.80.60.10 in both directions — the ping fails too","The SNMP community on KD-BR4"], a:2, why:"Timed out means the server never answered, and the ping proves the router can't reach it at all — a routing or path problem (Module 5's method: show ip route 10.80.60.10, and the route back). TFTP has no username or password, and an existing file would be overwritten, not cause a timeout."},
  {lvl:3, q:"After restoring a branch router with copy tftp: running-config from a good backup, the DHCP pool is back but the branch PCs still show 169.254 addresses. Based on the exhibit, what is the fix?", ex:"WR-BR9#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     172.21.30.1     YES manual administratively down down\nGigabitEthernet0/1     172.21.255.6    YES manual up                    up\nGigabitEthernet0/2     unassigned      YES unset  administratively down down", o:["Restore the backup a second time","no shutdown on GigabitEthernet0/0 — the merge can't undo a shutdown, because a config file has no 'no shutdown' lines","Add ip helper-address on GigabitEthernet0/1","Reload the router so the PCs see the pool"], a:1, why:"The LAN interface is administratively down. A backup taken while it was up has no line that brings it up, so a merge leaves the shutdown in place. no shutdown on Gi0/0 lets the PCs reach the pool; they ask again by themselves. Reloading would load the startup-config, which might hold the broken state too."},
  {lvl:2, q:"Which SNMPv3 security level both authenticates and encrypts messages?", o:["noAuthNoPriv","authNoPriv","authPriv","privNoAuth"], a:2, why:"authPriv = authentication (HMAC, e.g. SHA) plus privacy (encryption, e.g. AES). authNoPriv authenticates but leaves data readable; noAuthNoPriv is a username only. privNoAuth doesn't exist."},
  {lvl:1, type:"fill", q:"A router's hostname is KD-BR4. What destination filename does copy running-config tftp: suggest by default?", fields:[{label:"Default filename", a:["kd-br4-confg"]}], why:"IOS suggests the hostname in lower case followed by -confg. Pressing Enter accepts it — which overwrites any older file of that name on most TFTP servers."},
],
cards:[
  {f:"SNMP manager and agent", b:"The manager (NMS) polls and receives alerts; the agent runs in each device, answers polls and sends alerts."},
  {f:"SNMP ports", b:"Requests to the agent: UDP 161. Traps and informs to the manager: UDP 162."},
  {f:"MIB and OID", b:"The MIB is the catalogue of objects an agent can report; each object is named by an OID, e.g. 1.3.6.1.2.1.1.5.0 = sysName.0."},
  {f:"SNMP messages", b:"Get, GetNext, GetBulk (v2c+), Set from the manager; Response from the agent; Trap (unacknowledged) and Inform (acknowledged, v2c+) as alerts."},
  {f:"Trap vs Inform", b:"Both are alerts from the agent to the manager on UDP 162. A trap is fire-and-forget; an inform is acknowledged and resent until it is."},
  {f:"SNMPv1/v2c security", b:"A community string sent in clear text in every message; RO or RW. The c in v2c is for community, not crypto."},
  {f:"SNMPv3 security levels", b:"noAuthNoPriv (username only), authNoPriv (authenticated, e.g. SHA), authPriv (authenticated and encrypted, e.g. AES) — authPriv is the secure choice."},
  {f:"IOS SNMP commands", b:"snmp-server community STRING RO|RW [ACL]; snmp-server location / contact; snmp-server host IP version 2c COMMUNITY; snmp-server enable traps."},
  {f:"Net-SNMP tools", b:"snmpget -v2c -c COMMUNITY AGENT OBJECT; snmpwalk walks a table with GetNext; snmpset ... OBJECT s \"value\" writes (needs RW)."},
  {f:"SNMP Timeout", b:"Wrong community, a community ACL that blocks you, agent not enabled, or no route — all look the same. Ping, then read show snmp counters on the router."},
  {f:"copy FROM TO", b:"copy running-config tftp: = backup; copy tftp: running-config = merge; copy tftp: startup-config + reload = replace; copy running-config startup-config = save."},
  {f:"Merge rules", b:"Back, Over, Stay, Shut: missing lines come back, single values are overwritten, extra lines stay, shut interfaces stay shut."},
  {f:"TFTP vs FTP vs SCP/SFTP", b:"TFTP: UDP 69, no login, no encryption. FTP: TCP 21/20, clear-text login. SCP/SFTP: inside SSH on TCP 22, login and encryption."},
],
});

L.push({
id:"svc-qos-verify", mins:120, level:"Beginner+ · builds on Module 7 lessons 1–7",
t:"QoS for voice and video, troubleshooting IP services — and the Module 7 challenge",
html:`
${K.goals([
  "Explain why voice needs QoS — delay, jitter, loss — and work out where a queue forms and how long a packet waits in it.",
  "Read DSCP (EF 46, AF, CS) and CoS markings, and say where the trust boundary belongs.",
  "Pick the right QoS tool for a problem: FIFO, CBWFQ, LLQ, tail drop versus WRED, policing versus shaping.",
  "Troubleshoot any IP service with one four-question method and recognise each common fault's fingerprint.",
  "Fix six faults in the Module 7 challenge and document a services portfolio project an employer can check.",
])}
${K.pre(["Module 7 lessons 1–7: DHCP, relay, DNS, NAT/PAT, NTP, syslog, SNMP and TFTP.","Module 4: the 802.1Q tag, its CoS priority bits and the voice VLAN.","Module 1: TCP slows down after a loss; UDP doesn't.","Module 5 lesson 8: find where the packet stops, both ways."])}

<h2>Why this matters at work</h2>
<p>Monday, 13:05, at a managed-service provider in Wuse, Abuja. Two tickets land within a minute. A microfinance bank's branch: &ldquo;calls to head office break up every lunchtime — robot voices, missing words&rdquo;. A logistics customer: &ldquo;since the weekend change, Kano can't get on the internet, Kano's laptops show strange addresses, and the NOC got no alert about anything&rdquo;.</p>
<p>The first is a <b>QoS</b> problem: a link that copes all morning fills at lunch, and voice waits behind backups. The second is a chain of <b>IP service</b> faults of the kinds lessons 1–7 taught. QoS has no lab engine here, so diagrams and numbers do the work; the services part ends in a broken network to fix.</p>

<h2>Why QoS exists: delay, jitter, loss — and where queues form</h2>
${K.remember(`<p><b>The QoS rule:</b> an interface sends one packet at a time. When packets arrive faster than it can send them, they wait in a queue; when the queue is full, new arrivals are dropped. <b>QoS doesn't make a link faster — it decides who waits and who is dropped while the link is busy.</b> With no congestion there is no queue, and QoS changes nothing.</p>`)}
<p>${K.g("QoS","Quality of Service: features that treat some traffic better — sooner, with less loss — when a link is congested.")} matters because applications feel congestion differently. A TCP file transfer that loses a packet resends it and finishes a second later. Voice travels in small ${K.g("RTP","Real-time Transport Protocol: carries audio and video inside UDP, with sequence numbers and timestamps.")}-in-UDP packets, one every 20 ms, and a late packet is useless — its moment has already been played. Voice cares about three numbers, all of which grow when a queue builds:</p>
<ul>
<li><b>Delay</b> — mouth to ear. Design target: <b>150 ms or less one way</b> (ITU-T G.114); beyond it, people talk over each other.</li>
<li><b>${K.g("Jitter","Variation in delay between packets of one stream: 20 ms for one packet and 45 ms for the next is 25 ms of jitter. Large jitter sounds robotic or clipped.")}</b> — how much the delay varies packet to packet. Target: <b>30 ms or less</b>.</li>
<li><b>Loss</b> — target <b>1% or less</b>; above that, words go missing.</li>
</ul>
<p>Interactive video needs similar delay and jitter, more bandwidth, and suffers visibly from loss. Email, web and file transfers need none of this — but they fill the queues.</p>
<h3>Where queues form: speed changes and many-to-one</h3>
<p>Congestion happens wherever traffic arrives faster than it can leave: a 1 Gb/s LAN feeding a 20 Mb/s WAN, or forty desk ports sharing one uplink. The queue builds on the <b>outgoing</b> interface at that point, so that is where QoS must act.</p>
${K.svg("0 0 720 240",
  K.dev("phone",50,58,"IP PHONE","voice: ~87 kb/s")+K.dev("pc",50,160,"PCs","backup: 300 Mb/s")+
  K.dev("switch",200,110,"ACCESS SW","1 Gb/s LAN")+K.dev("router",360,110,"BRANCH-R1","queue builds here")+K.dev("cloud",650,110,"WAN","to HQ")+
  K.link(66,64,172,104)+K.link(70,156,172,114)+K.link(228,110,334,110,"1 Gb/s")+K.link(386,110,624,110,"20 Mb/s WAN")+
  [0,1,2,3,4,5,6].map(i=>`<rect x="${560-i*22}" y="66" width="18" height="16" rx="2" fill="var(--chip)" stroke="var(--line)"/>`).join("")+
  `<rect x="406" y="66" width="18" height="16" rx="2" fill="var(--accent)" stroke="var(--accent)"/>`+
  K.txt(490,56,"output queue: new arrivals left, next out on the right",{mid:true,s:10.5})+
  K.txt(415,98,"voice",{mid:true,c:"accent",s:10})+
  K.txt(360,228,"Fast in, slow out: packets wait at the speed change. That outgoing queue is the only place QoS can help.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "A branch at lunchtime: up to 1 Gb/s in, 20 Mb/s out. The voice packet (accent) waits behind seven backup packets unless QoS lets it jump the queue.")}
<h3>A worked example: how long does a voice packet wait?</h3>
<p>Four delays add up on every hop: <b>propagation</b> (about 5 ms per 1,000 km of fibre), <b>processing</b> (microseconds), <b>serialisation</b> (clocking the bits onto the wire) and <b>queuing</b> (waiting behind other packets) — the one that changes moment to moment, so the main cause of jitter.</p>
${K.steps([
  ["One data packet","1,500 bytes = 12,000 bits; on the 20 Mb/s WAN, 12,000 ÷ 20,000,000 = <b>0.6 ms</b> (on 1 Gb/s, 0.012 ms — why LAN queues rarely matter)."],
  ["Voice arrives behind 40 of them","40 × 0.6 ms = <b>24 ms</b> of queuing before it starts to leave."],
  ["The next voice packet finds 10 ahead","10 × 0.6 = 6 ms. Same call, 24 ms then 6 ms: <b>18 ms of jitter</b> from one router."],
  ["Make the link slower","On 2 Mb/s each packet takes 6 ms, so 40 is <b>240 ms</b> — the whole 150 ms budget gone at one hop."],
])}
<p>How much bandwidth does a call need? The G.711 ${K.g("codec","How a phone turns speech into bits: G.711 sends 64 kb/s uncompressed; G.729 compresses to 8 kb/s.")} sends 160 bytes of audio every 20 ms (50 packets a second). With 40 bytes of IP, UDP and RTP headers that is 200 × 8 × 50 = 80 kb/s; add Ethernet's 18 bytes and it's <b>87.2 kb/s per direction</b> (G.729: 31.2 kb/s). The problem is never voice's bandwidth — it is voice waiting.</p>
${K.analogy(`<p>A toll plaza on the Lagos–Ibadan expressway with one booth open. QoS can't build a second booth. It can wave the ambulance through first (priority queue), give buses a guaranteed share of turns (weighted queues), turn some cars away early (early drops), and hold lorries in a lay-by so they arrive at a steady pace (shaping).</p>`)}
<h3>The QoS toolbox, in the order a packet meets it</h3>
${K.remember(`<p><b>&ldquo;Can My Queue Drop Politely, Smoothly?&rdquo;</b> — <b>C</b>lassify (what is this packet?), <b>M</b>ark (write the answer in the header), <b>Q</b>ueue (decide the order packets leave in), <b>D</b>rop early (before the queue is full), <b>P</b>olice (cap a rate by dropping or re-marking), <b>S</b>hape (cap a rate by buffering).</p>`)}
<p>The CCNA names three QoS models: <b>best effort</b> (no QoS), <b>IntServ</b> (each flow reserves bandwidth end to end with ${K.g("RSVP","Resource Reservation Protocol: signals a bandwidth reservation along a path, hop by hop.")} — precise, but it doesn't scale), and <b>${K.g("DiffServ","Differentiated Services: packets are marked into a few classes and each device independently gives each class its configured treatment. No reservations.")}</b>: mark packets into a few classes and let each device apply that class's ${K.g("per-hop behaviour (PHB)","What one device does with a class — which queue, what share, how likely to be dropped. Expedited Forwarding (EF) is the PHB for voice.")}. DiffServ is what you meet at work and on the exam.</p>
${K.check({q:"Branch users upload large files to HQ from a 1 Gb/s LAN over a 50 Mb/s WAN link. Where does the queue that delays their voice calls to HQ form?", o:["On the access switch's port facing the PCs","On the branch router's WAN interface, in the outbound direction","On the HQ router's LAN interface","Nowhere: 50 Mb/s is plenty for voice"], a:1, why:"Queues form at the speed change: the branch router's outgoing WAN interface. Voice needs under 100 kb/s a call, but waits behind the uploads unless QoS gives it priority there."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A clinic's router has a 10 Mb/s link to its lab partner. A voice packet arrives when 25 full-size (1,500-byte) data packets are already queued ahead of it. How many milliseconds does it wait before it starts to leave?", fields:[{label:"Waiting time (ms)", a:["30","30 ms","30ms","30.0"]}], why:"1. What is asked? Queuing delay behind other packets. 2. Which rule? Each queued packet must be serialised first: bits ÷ link speed. 3. Apply it: 1,500 × 8 = 12,000 bits; 12,000 ÷ 10,000,000 = 1.2 ms each; 25 × 1.2 = 30 ms — a fifth of the whole one-way voice budget, at one hop."})}

<h2>Classification, marking and the trust boundary</h2>
${K.remember(`<p><b>The marking rule:</b> classification asks &ldquo;what is this packet?&rdquo;; marking writes the answer into a header field so that every later device can act on it at a glance instead of inspecting the packet again. <b>Classify and mark once, as close to the source as you can trust; every hop after that reads the mark.</b></p>`)}
<p>A device classifies by the arrival interface, by addresses and ports (an ACL, as for NAT in lesson 4), by an existing marking, or by inspecting the application with ${K.g("NBAR","Network-Based Application Recognition: Cisco's way of identifying applications beyond their port numbers.")}. Then it marks one of two fields:</p>
<ul>
<li><b>CoS</b> (Module 4) — the 3-bit PCP field in the 802.1Q tag, 0–7, present only on trunks and the voice VLAN. A router builds a new frame for each hop, so <b>CoS disappears at the first router</b>.</li>
<li><b>${K.g("DSCP","Differentiated Services Code Point: the top 6 bits of the IPv4 header's second byte (the DS field, once Type of Service) or IPv6's Traffic Class. Values 0–63.")}</b> — 6 bits in the IP header, 0–63, so <b>DSCP survives every router</b> unless re-marked. The byte's last 2 bits are ${K.g("ECN","Explicit Congestion Notification: lets a congested router mark a packet instead of dropping it, so TCP slows down.")}.</li>
</ul>
${K.svg("0 0 720 262",
  K.txt(20,22,"Layer 2: the 802.1Q tag — CoS lives here (trunks and the voice VLAN only)",{f:"body",s:12,c:"fg",b:true})+
  K.band(20,34,90,26,"Dst MAC")+K.band(114,34,90,26,"Src MAC")+K.band(208,34,110,26,"802.1Q tag","var(--panel2)")+K.band(322,34,60,26,"Type")+K.band(386,34,200,26,"Data (the IP packet)")+K.band(590,34,60,26,"FCS")+
  K.link(208,60,160,82,"",true)+K.link(318,60,672,82,"",true)+
  K.band(160,82,170,26,"TPID 0x8100 · 16 bits")+K.band(334,82,120,26,"PCP (CoS) · 3 bits","var(--panel2)")+K.band(458,82,60,26,"DEI · 1")+K.band(522,82,150,26,"VLAN ID · 12 bits")+
  K.txt(394,124,"0–7 · voice = 5",{mid:true,c:"accent"})+
  K.txt(20,152,"Layer 3: the IPv4 header — DSCP lives here (end to end, across every router)",{f:"body",s:12,c:"fg",b:true})+
  K.band(20,164,90,26,"Ver · IHL")+K.band(114,164,110,26,"DS byte (ToS)","var(--panel2)")+K.band(228,164,110,26,"Total length")+K.band(342,164,240,26,"… TTL, protocol, addresses …")+K.band(586,164,64,26,"Data")+
  K.link(114,190,100,212,"",true)+K.link(224,190,524,212,"",true)+
  K.band(100,212,300,26,"DSCP · 6 bits (0–63)","var(--panel2)")+K.band(404,212,120,26,"ECN · 2 bits")+
  K.txt(360,254,"EF = 46 = 101110 → its first three bits, 101, read as IP Precedence 5 — the same 5 that voice uses for CoS",{mid:true,s:10.5}),
  "CoS (3 bits) rides in the 802.1Q tag and is lost at the first router; DSCP (6 bits) rides in the IP header across the whole path.")}
<h3>The DSCP values you need</h3>
<div class="tablewrap"><table>
<tr><th>Name</th><th>Decimal</th><th>Binary</th><th>Typical use</th></tr>
<tr><td><b>Default Forwarding (DF)</b>, best effort</td><td>0</td><td>000000</td><td>Everything not classified</td></tr>
<tr><td><b>EF</b> — Expedited Forwarding</td><td>46</td><td>101110</td><td>Voice audio: low delay, low jitter, low loss</td></tr>
<tr><td><b>AF41 / AF42 / AF43</b></td><td>34 / 36 / 38</td><td>100010 …</td><td>Interactive video</td></tr>
<tr><td><b>AF31 / AF32 / AF33</b></td><td>26 / 28 / 30</td><td>011010 …</td><td>Streaming video or important business apps</td></tr>
<tr><td><b>AF21 / AF22 / AF23</b></td><td>18 / 20 / 22</td><td>010010 …</td><td>Transactional data (databases, banking apps)</td></tr>
<tr><td><b>AF11 / AF12 / AF13</b></td><td>10 / 12 / 14</td><td>001010 …</td><td>Bulk data (file transfers)</td></tr>
<tr><td><b>CS1 … CS7</b> — Class Selector</td><td>8, 16 … 56</td><td>xxx000</td><td>CS1 &ldquo;scavenger&rdquo; (less than best effort), CS3 call signalling in Cisco's classic designs (RFC 4594 suggests CS5), CS6 routing protocols</td></tr>
</table></div>
<p>&ldquo;Typical use&rdquo; follows common guidance (RFC 4594 and Cisco's guides differ in places); the arithmetic never changes.</p>
${K.remember(`<p><b>${K.g("AF","Assured Forwarding: four classes (used for video and data), each with three drop precedences.")}<i>xy</i>:</b> <i>x</i> = class (1–4: which queue), <i>y</i> = drop precedence (1 = keep, 3 = drop first). <b>Decimal = 8<i>x</i> + 2<i>y</i>.</b> Inside one class, <b>AF13 is dropped before AF12, before AF11</b> — a higher last digit means <i>more</i> droppable, not more important. Class Selector (CS) values: <b>CS<i>x</i> = 8<i>x</i></b> (the last three bits are 0). <b>EF = 46.</b></p>`)}
${K.steps([
  ["AF31 to decimal and binary","Class 3, drop precedence 1. 8 × 3 + 2 × 1 = <b>26</b>. In bits: class 3 = <code>011</code>, drop 1 = <code>01</code>, then a final <code>0</code> → <code>011010</code> = 16 + 8 + 2 = 26. Both routes agree."],
  ["DSCP 36 back to a name","36 ÷ 8 = 4 remainder 4; the remainder is 2<i>y</i>, so <i>y</i> = 2: <b>AF42</b>. (Binary 100100: class 100 = 4, drop 10 = 2.)"],
  ["Why EF and CoS 5 line up","EF 46 = <code>101110</code>. Devices that read only the first three bits (IP Precedence) see <code>101</code> = 5 — the value IP phones use for CoS."],
])}
${K.dyk(`<p>The DS (Differentiated Services) byte has been reinvented twice: &ldquo;Type of Service&rdquo; with 3 precedence bits (RFC 791, 1981), the top 6 bits redefined as DSCP (RFC 2474, 1998), the last 2 given to ECN (RFC 3168, 2001). The Class Selectors keep DSCP compatible with the old precedence bits.</p>`)}
<h3>The trust boundary: whose markings do you believe?</h3>
<p>Any PC can mark all its traffic DSCP 46; if the network believed it, a download marked EF would push real calls aside. So a network chooses a <b>${K.g("trust boundary","Where markings start to be believed. Traffic from beyond it is re-marked (usually to 0) or classified afresh.")}</b>: beyond it markings are rewritten or ignored; inside it they are acted on.</p>
${K.svg("0 0 720 222",
  K.dev("pc",60,84,"PC","marks anything")+K.dev("phone",200,84,"IP PHONE","voice CoS 5 / EF")+K.dev("switch",350,86,"ACCESS SW","trusts the phone")+K.dev("router",510,86,"WAN ROUTER","queues on DSCP")+K.dev("cloud",650,86,"WAN","")+
  K.link(80,86,188,86)+K.link(212,86,322,86)+K.link(378,86,484,86)+K.link(536,86,624,86)+
  `<line x1="130" y1="30" x2="130" y2="150" stroke="var(--warn)" stroke-width="2" stroke-dasharray="6 4"/>`+
  K.txt(130,22,"trust boundary",{mid:true,c:"warn",f:"body",s:12,b:true})+
  K.txt(8,172,"untrusted: PC traffic",{c:"bad",s:10.5})+K.txt(8,186,"re-marked to CoS 0",{c:"bad",s:10.5})+
  K.txt(430,172,"trusted: markings are believed and acted on at every hop",{mid:true,c:"ok",s:10.5})+
  K.txt(360,212,"Mark as close to the source as you can trust — then every later device only reads the marking.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "The usual design for a phone with a PC behind it (Module 4's voice VLAN): the switch trusts the phone, and the phone re-marks the PC's frames.")}
<p>By default a Cisco IP phone marks voice CoS 5 / EF and call signalling CS3, and rewrites the CoS of its PC's frames to 0. With &ldquo;conditional trust&rdquo; (<code>trust device cisco-phone</code>) the switch trusts a port only while CDP sees a Cisco phone on it, so swapping the phone for a laptop removes the trust. Defaults differ: on older Catalysts QoS is off (markings pass unchanged) until you enable <code>mls qos</code>, which makes every port untrusted until configured; Catalyst 9000s trust markings by default — there you untrust user ports on purpose, with a policy that re-marks them.</p>
${K.mistake(`Marking only at the WAN router: voice has already crossed the switches unmarked, and the router must classify everything again. Mark at the access edge and let the WAN router act on DSCP. The opposite mistake — trusting every port — lets one user's &ldquo;priority&rdquo; download compete with calls.`)}
${K.check({q:"Voice packets leave a branch IP phone marked CoS 5 and DSCP EF, cross the access switch and two routers, and arrive at HQ. Which marking can the HQ router still read?", o:["CoS 5 only","DSCP EF only — CoS lives in the 802.1Q tag, which the first router removes when it builds a new frame","Both, unchanged","Neither: markings are removed by every device"], a:1, why:"CoS is in the 802.1Q tag, and each router builds a new frame, so it is gone after the first router. DSCP is in the IP header, which crosses the whole path unless someone re-marks it."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A video-streaming class is marked AF32. What is its DSCP value in decimal, and in 6-bit binary?", fields:[{label:"Decimal", a:["28"]},{label:"Binary (6 bits)", a:["011100"]}], why:"1. What is asked? Convert an AF name. 2. Which rule? AF = 8 × class + 2 × drop precedence; in bits, the class is the first three bits, the drop precedence the next two, and the last bit is 0. 3. Apply it: 8 × 3 + 2 × 2 = 28; class 3 = 011, drop 2 = 10, then 0 → 011100 (16 + 8 + 4 = 28). Inside class 3, AF33 (30) is dropped before AF32, and AF32 before AF31 (26)."})}

<h2>Queuing, dropping, policing and shaping</h2>
${K.remember(`<p><b>Three different questions:</b> <b>queuing</b> decides the <i>order</i> packets leave in; <b>congestion avoidance</b> decides <i>which</i> packets to drop, and when, as a queue fills; <b>policing and shaping</b> decide <i>how fast</i> a class (or a whole interface) may send. Each tool answers one question only.</p>`)}
<p>The interface's own small hardware queue (the ${K.g("transmit ring","The interface's small first-in, first-out buffer; the QoS software queues are used only when it is full.")}) is always ${K.g("FIFO","First in, first out: packets leave in the order they arrived.")}; the QoS queues sit in front of it and fill only when it is full — that is, during congestion.</p>
<h3>From one queue to a priority queue</h3>
<ul>
<li><b>FIFO</b> — one queue, first in, first out; the default on most fast interfaces. Voice waits behind whatever arrived first.</li>
<li><b>Weighted fair queuing</b> (a queue per flow) and its class-based form, <b>${K.g("CBWFQ","Class-Based Weighted Fair Queuing: a queue per class, served in turn so each class gets at least its configured share during congestion.")}</b> — a queue per class and a scheduler that takes turns, guaranteeing each class a minimum share. Nobody starves, but voice still waits for its turn, which adds jitter.</li>
<li><b>${K.g("LLQ","Low Latency Queuing: CBWFQ plus one strict-priority queue, sent first and policed to its configured rate during congestion.")}</b> — CBWFQ plus one <b>strict-priority queue</b>: whenever it holds a packet, that packet goes next. So that it can't starve everyone else, it is <b>policed to its configured bandwidth during congestion</b>. Voice (and often interactive video) belongs here.</li>
</ul>
${K.svg("0 0 720 262",
  K.box(16,100,110,60,"Classify","DSCP · ACL · NBAR")+
  K.box(190,16,250,42,"Priority queue (LLQ)","EF voice · always next · policed",true)+
  K.box(190,72,250,42,"Video · bandwidth 25%","AF41")+
  K.box(190,128,250,42,"Business data · bandwidth 30%","AF21 / AF31")+
  K.box(190,184,250,42,"class-default · fair-queue","everything else")+
  K.arrow(126,124,188,37,"",true)+K.arrow(126,128,188,93)+K.arrow(126,132,188,149)+K.arrow(126,136,188,205)+
  K.box(500,100,104,60,"Scheduler","priority first")+
  K.arrow(440,37,498,118,"",true)+K.arrow(440,93,498,124)+K.arrow(440,149,498,136)+K.arrow(440,205,498,142)+
  K.arrow(604,130,704,130,"out: 20 Mb/s")+
  K.txt(360,252,"LLQ = CBWFQ (a guaranteed share per class) + one strict-priority queue for voice",{mid:true,f:"body",s:11.5,c:"fg"}),
  "LLQ on a WAN interface: the scheduler empties the priority queue first (up to its policed rate), then shares the link by the other queues' guarantees.")}
<h3>A worked example: sizing the priority queue</h3>
${K.steps([
  ["Count the calls","25 phones, at most 20 calls at once over the WAN: 20 × 87.2 kb/s = 1,744 kb/s."],
  ["Add headroom","Give the priority queue 2 Mb/s — 10% of a 20 Mb/s link, well under the usual ceiling of about a third for strict priority."],
  ["Know the limit","2,000 ÷ 87.2 ≈ 22 calls fit. A 23rd makes the policer drop voice, damaging <i>every</i> call — which is why phone systems use call admission control to refuse calls the link can't carry."],
  ["Share the rest","Video AF41 gets <code>bandwidth</code> 2.5 Mb/s; everything else shares the remainder with <code>fair-queue</code>."],
])}
${K.out(`class-map match-any VOICE
 match dscp ef
class-map match-any VIDEO
 match dscp af41
!
policy-map WAN-OUT
 class VOICE
  priority 2000
 class VIDEO
  bandwidth 2500
 class class-default
  fair-queue
!
interface GigabitEthernet0/0/1
 service-policy output WAN-OUT`, "LLQ in IOS XE's Modular QoS CLI (rates in kb/s): class-maps classify, the policy-map says what each class gets, service-policy applies it outbound. The CCNA asks you to recognise it; the lab has no QoS engine, so this is for reading only.")}
<h3>Tail drop versus early drops</h3>
<p>When a queue is full, <b>tail drop</b> discards every new arrival. That interacts badly with TCP, which cuts its rate after a loss (Module 1): dozens of flows lose packets in the same instant, all slow down, the link half-empties, all speed up, the queue overflows again — <b>TCP global synchronisation</b>.</p>
<p><b>${K.g("RED","Random Early Detection: as the average queue depth passes a minimum threshold, drop a small, growing, random share of arrivals so a few TCP flows slow down early.")}</b> drops a few random packets <i>before</i> the queue is full, so only a few flows slow down at a time. <b>${K.g("WRED","Weighted RED: a different drop profile per IP Precedence or DSCP value.")}</b> weights that by marking: higher drop precedence loses packets earlier. It suits TCP data classes, not voice — UDP doesn't slow down after a loss, and voice belongs in the priority queue.</p>
${K.svg("0 0 720 270",
  `<line x1="80" y1="210" x2="664" y2="210" stroke="var(--muted)" stroke-width="1.4"/><line x1="80" y1="210" x2="80" y2="34" stroke="var(--muted)" stroke-width="1.4"/>`+
  `<line x1="80" y1="40" x2="664" y2="40" stroke="var(--line)" stroke-dasharray="3 4"/>`+
  `<polyline points="368,210 560,150 560,40 656,40" fill="none" stroke="var(--bad)" stroke-width="2.4"/>`+
  `<polyline points="464,210 560,150" fill="none" stroke="var(--ok)" stroke-width="2.4"/>`+
  `<line x1="80" y1="210" x2="368" y2="210" stroke="var(--fg)" stroke-width="2.4"/>`+
  K.txt(72,44,"100%",{end:true})+K.txt(72,154,"10%",{end:true})+K.txt(72,214,"0",{end:true})+K.txt(88,28,"drop probability (not to scale)",{f:"body"})+
  K.txt(368,226,"24",{mid:true})+K.txt(464,226,"32",{mid:true})+K.txt(560,226,"40",{mid:true})+
  K.txt(372,250,"average queue depth (packets) →",{mid:true,f:"body"})+
  `<line x1="110" y1="68" x2="134" y2="68" stroke="var(--bad)" stroke-width="2.4"/>`+K.txt(142,72,"AF13 (high drop precedence): random drops start at 24",{f:"body",c:"fg"})+
  `<line x1="110" y1="92" x2="134" y2="92" stroke="var(--ok)" stroke-width="2.4"/>`+K.txt(142,96,"AF11 (low drop precedence): random drops start at 32",{f:"body",c:"fg"})+
  K.txt(570,146,"1 in 10 at the max threshold",{f:"body",s:10.5})+K.txt(570,58,"above max: drop all",{f:"body",s:10.5})+
  K.txt(220,200,"below the min threshold: no drops",{mid:true,f:"body",s:10.5}),
  "WRED with example thresholds: no drops below the minimum, a growing random share up to the maximum (1 in 10 here), everything above it. AF13 loses packets before AF11.")}
<h3>Policing versus shaping</h3>
<p>Both enforce a rate, often a contract's ${K.g("CIR","Committed Information Rate: the rate a provider promises and enforces — for example 50 Mb/s on a 1 Gb/s port.")}. They differ in what happens to the excess:</p>
<ul>
<li><b>Policing</b> <b>drops (or re-marks) the excess</b> at once: no buffer, no delay, inbound or outbound. Providers police what customers send; you might police guest Wi-Fi. TCP resends what a policer drops, so a policed link can look busy and slow at once.</li>
<li><b>Shaping</b> <b>buffers the excess</b> and sends it later at the allowed rate: little is lost, but packets wait — and it works outbound only, in the output queue. You shape to match a provider's policer.</li>
</ul>
${K.svg("0 0 720 232",
  K.txt(190,22,"Policing: cut the excess",{mid:true,f:"body",s:12.5,c:"fg",b:true})+K.txt(530,22,"Shaping: delay the excess",{mid:true,f:"body",s:12.5,c:"fg",b:true})+
  `<line x1="50" y1="180" x2="330" y2="180" stroke="var(--muted)"/><line x1="50" y1="180" x2="50" y2="40" stroke="var(--muted)"/><line x1="390" y1="180" x2="670" y2="180" stroke="var(--muted)"/><line x1="390" y1="180" x2="390" y2="40" stroke="var(--muted)"/>`+
  `<line x1="50" y1="110" x2="330" y2="110" stroke="var(--warn)" stroke-dasharray="5 4"/><line x1="390" y1="110" x2="670" y2="110" stroke="var(--warn)" stroke-dasharray="5 4"/>`+
  K.txt(46,114,"CIR",{end:true,c:"warn"})+K.txt(386,114,"CIR",{end:true,c:"warn"})+
  `<polyline points="50,170 90,170 100,60 140,60 150,170 190,170 200,70 240,70 250,170 330,170" fill="none" stroke="var(--muted)" stroke-dasharray="4 3"/>`+
  `<polyline points="50,170 90,170 100,110 140,110 150,170 190,170 200,110 240,110 250,170 330,170" fill="none" stroke="var(--accent)" stroke-width="2.4"/>`+
  `<polyline points="390,170 430,170 440,60 480,60 490,170 530,170 540,70 580,70 590,170 670,170" fill="none" stroke="var(--muted)" stroke-dasharray="4 3"/>`+
  `<polyline points="390,170 430,170 440,110 625,110 635,170 670,170" fill="none" stroke="var(--accent)" stroke-width="2.4"/>`+
  K.txt(120,52,"dropped",{mid:true,c:"bad",s:10.5})+K.txt(220,62,"dropped",{mid:true,c:"bad",s:10.5})+
  K.txt(500,196,"excess sent later, at the CIR",{mid:true,c:"accent",s:10.5})+
  K.txt(330,196,"time →",{end:true,f:"body",s:10.5})+K.txt(670,196,"time →",{end:true,f:"body",s:10.5})+
  K.txt(190,220,"no delay added · losses make TCP resend",{mid:true,f:"body",s:11})+K.txt(530,220,"adds delay · outbound only · smooth output",{mid:true,f:"body",s:11}),
  "The same bursts (dashed) against the same CIR: the policer clips the tops off; the shaper sends them later, so it stays at the CIR for longer.")}
<p>Both meter with a ${K.g("token bucket","Tokens (permission to send bits) arrive at the CIR; a packet may go only if enough tokens are waiting. The bucket size (Bc) sets the largest burst.")}. A shaper sends in time slices: per interval Tc it may send <b>Bc = CIR × Tc</b> bits. At 50 Mb/s with Tc = 10 ms (an illustration — IOS picks Tc itself unless you set Bc) that is 500,000 bits (62,500 bytes); once a slice's allowance is used, the rest wait for the next slice — the delay shaping adds.</p>
${K.when([
  ["FIFO","The link never congests","Nothing to configure","Voice shares a link that fills up"],
  ["CBWFQ","Data classes each need a guaranteed minimum share","No class starves the others","Voice — it still waits its turn"],
  ["LLQ","Voice and interactive video on a congesting link","Strict priority: least delay and jitter","Bulk data — if everything is priority, nothing is"],
  ["WRED","Queues full of TCP flows","Early random drops avoid global synchronisation","Voice (UDP)"],
  ["Policing","Capping a rate where excess may be dropped or re-marked","No buffer, no delay","Loss-sensitive traffic you could shape instead"],
  ["Shaping","A provider polices below your port speed","The queue forms in your router, where your LLQ decides","Inbound traffic (can't be shaped)"],
], "Which QoS tool solves which problem")}
${K.exam(`How to read a QoS question: <b>1. Name the tool from the verbs</b> — buffers/delays/smooths = shaping; drops or re-marks, no delay = policing; strict priority = LLQ; minimum bandwidth guarantee = CBWFQ; random drops before the queue is full = WRED. <b>2. Name the layer</b> — 3 bits in a tag = CoS; 6 bits in the IP header = DSCP. <b>3. Check direction</b> — shaping and queuing act outbound. Trap: in AF the <i>higher</i> second digit is dropped <i>first</i>.`)}
${K.myth([
  ["QoS creates bandwidth.","It only decides who waits and who is dropped. A link that is always full needs more bandwidth."],
  ["Marking a packet EF makes it go faster.","A marking is a label; it matters only where queues are configured to act on it, during congestion."],
])}
${K.case("The bank whose QoS never switched on",`
<p>An Abuja microfinance branch bought a 10 Mb/s WAN service, delivered on a 100 Mb/s handoff and <b>policed</b> at 10 Mb/s. LLQ was configured on the branch router's WAN interface — EF in the priority queue — yet calls broke up daily at 13:00, when the CCTV recorder uploaded footage.</p>
<p><b>Why the LLQ did nothing:</b> uploads peaked at about 40 Mb/s on a 100 Mb/s interface, so the interface never congested and its queues never filled. The congestion was one hop on, in the provider's policer, which dropped voice and video alike.</p>
<p><b>The fix:</b> a parent policy <b>shapes</b> to 10 Mb/s and the existing LLQ runs inside it, so the queue forms in the bank's router, where the bank's rules apply:</p>
${K.out(`policy-map SHAPE-10M
 class class-default
  shape average 10000000
  service-policy WAN-OUT
!
interface GigabitEthernet0/0/1
 no service-policy output WAN-OUT
 service-policy output SHAPE-10M`, "Hierarchical QoS in IOS XE: shape average takes bits per second; the child policy WAN-OUT (the LLQ from earlier) runs inside the shaped rate.")}
<p>Testing found a second fault: a new access switch rewrote the phones' EF to 0 on untrusted ports. <b>Lessons:</b> queuing works only where the congestion is; shape to a provider's rate; check markings survive from phone to router.</p>`)}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A hotel's network team describes five problems. Match each problem with the QoS tool that addresses it.", pairs:[["Front-desk calls sound robotic whenever guests stream video over the shared WAN link","LLQ: a priority queue for EF voice"],["Dozens of TCP downloads all slow down and speed up together each time the queue overflows","WRED on the data classes"],["The provider drops everything above the 100 Mb/s contract on a 1 Gb/s port","Shape outbound to 100 Mb/s"],["Guest Wi-Fi must never use more than 20 Mb/s, and excess may be dropped","Police the guest class at 20 Mb/s"],["A guest laptop marks all its traffic DSCP 46","Re-mark at the trust boundary: guest ports are untrusted"]], why:"1. What is asked? Which tool fits each problem. 2. Which rule? Queuing fixes order (LLQ for delay-sensitive voice); WRED fixes synchronised TCP drops; shaping buffers to match someone else's policer; policing caps a rate by dropping; trust decides whose markings count. 3. Apply it: each problem names its own question — order, which to drop, matching a provider, capping, or believing a mark."})}

<h2>Troubleshooting IP services: one method, nine fingerprints</h2>
${K.remember(`<p><b>The services rule:</b> every IP service is a conversation between a client and a server. Most run over UDP, so when something is wrong <b>nothing reports an error — the client just waits</b>. Check four things in order, from the client's side — <b>the four A's</b>:</p>
<ol><li><b>Aim</b> — is the client pointed at the right server address?</li><li><b>Alive</b> — is the service running there?</li><li><b>Away and back</b> — can packets get there <i>and</i> return (routes, NAT)?</li><li><b>Allowed</b> — do the server's rules include this client (a pool for its subnet, the community ACL, a trap level that includes the message)?</li></ol>`)}
<p>Each service fails in a few recognisable ways, each with a <b>fingerprint</b> — one output line that proves it. Keep this table beside you for the challenge.</p>
<div class="tablewrap"><table>
<tr><th>Fault</th><th>Users see</th><th>Fingerprint (and where)</th></tr>
<tr><td><b>DHCP: no relay</b></td><td>169.254.x.x on one remote LAN</td><td><code>ipconfig</code>: <code>Autoconfiguration IPv4 Address</code>; no <code>ip helper-address</code> on the client-facing interface</td></tr>
<tr><td><b>DHCP: wrong option</b></td><td>An address, but nothing off-subnet, or no names</td><td><code>ipconfig /all</code>: <code>Default Gateway</code> / <code>DNS Servers</code> differ from the design; the pool in <code>show running-config | section dhcp</code></td></tr>
<tr><td><b>DNS</b></td><td>Ping by address works, by name fails</td><td><code>nslookup</code>: <code>DNS request timed out.</code> = nobody answers there; <code>Non-existent domain</code> = no record</td></tr>
<tr><td><b>NAT: ACL misses a LAN</b></td><td>One LAN has no internet</td><td><code>show ip nat translations</code>: none of its inside locals; <code>show access-lists</code> doesn't permit it</td></tr>
<tr><td><b>NAT: inside/outside swapped</b></td><td>Nobody reaches the internet</td><td><code>show ip nat statistics</code>: <code>Inside interfaces:</code> lists the ISP-facing one</td></tr>
<tr><td><b>NTP</b></td><td>Wrong clock; log times don't line up</td><td><code>show ntp associations</code>: <code>.INIT.</code>, stratum 16, reach 0; <code>show clock</code> starts with <code>*</code></td></tr>
<tr><td><b>Syslog</b></td><td>The server misses messages</td><td><code>show logging</code>: <code>Trap logging: level warnings</code> (too low) or <code>Logging to</code> a wrong address</td></tr>
<tr><td><b>SNMP</b></td><td>The NMS says unreachable</td><td><code>snmpget</code>: <code>Timeout: No Response</code> — community, community ACL or route</td></tr>
<tr><td><b>TFTP</b></td><td>Backups fail</td><td><code>copy running-config tftp:</code>: <code>%Error opening tftp://… (Timed out)</code></td></tr>
</table></div>
<p>One of these in real output — an NTP client whose server address has a typo:</p>
${K.out(`JS-R1#show ntp associations
  address         ref clock       st   when   poll reach  delay  offset   disp
 ~10.44.255.9     .INIT.          16      -     64     0  0.000   0.000  15937.
 * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured
JS-R1#show clock
*09:30:00.000 WAT Mon Oct 12 2026`, "From the lab. ~ = configured; .INIT. and st 16 = never heard from; reach (last eight polls, octal) 0 = none answered, 377 = all. The * before the time: not synchronised.")}
<p>Fixed (<code>ntp server 10.44.255.1</code>), it reads <code>*~10.44.255.1 … 3 … 377</code> — instantly in the lab, after minutes on real routers. (A syslog one follows in the ticket below.)</p>
${K.mistake(`Fixing a DHCP pool option and expecting PCs to change. Clients keep their lease's options until they renew (<code>ipconfig /renew</code>, or the automatic renewal at half the lease). Renew one client and read its <code>ipconfig /all</code> before calling it fixed.`)}
<h3>Try it: audit a router before it ships</h3>
<p>Port Harcourt's new edge router, PH-EDGE, was built from a template and is about to be couriered out. Audit its services against the design: LAN 10.80.10.0/24 on Gi0/0 (gateway .1); ISP on Gi0/1; WAN to HQ on Gi0/2 (HQ end 10.80.255.1); PAT for the LAN; NTP from HQ; syslog to 10.80.50.10 at notifications; SNMP read-only from 10.80.50.10 only. Note what's right, too.</p>
${K.hint(`Read before you change: <code>show running-config | section dhcp</code>, <code>show ip nat statistics</code>, <code>show running-config | include snmp|ntp|logging</code>. Compare every line with the design.`)}
${K.term({env:"ios2", title:"PH-EDGE — audit the services before it ships", opts:{kind:"router", host:"PH-EDGE", model:"ISR4331", motd:"PH-EDGE — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description PH LAN","ip address 10.80.10.1 255.255.255.0","ip nat outside","no shutdown",
    "interface g0/1","description ISP uplink","ip address 198.51.100.34 255.255.255.252","ip nat inside","no shutdown",
    "interface g0/2","description WAN to HQ","ip address 10.80.255.2 255.255.255.252","no shutdown","exit",
    "ip route 0.0.0.0 0.0.0.0 198.51.100.33","ip route 10.80.50.0 255.255.255.0 10.80.255.1",
    "ip dhcp excluded-address 10.80.10.1 10.80.10.20","ip dhcp pool PH-LAN","network 10.80.10.0 255.255.255.0","dns-server 10.80.50.10","domain-name ph.example.com","exit",
    "access-list 1 permit 10.80.10.0 0.0.0.255","ip nat inside source list 1 interface g0/1 overload",
    "snmp-server community public RW","snmp-server location Port Harcourt comms room","snmp-server contact noc@example.com",
    "ntp master 1","logging host 10.80.50.10","logging trap notifications","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. The router is alone on the bench, so nothing leases or synchronises — you're checking the configuration.",
  tasks:[
    {text:"DHCP: read <code>show running-config | section dhcp</code> (only the DHCP part of the config) and <code>show ip dhcp pool</code>. The PH-LAN pool is missing an option every PC needs — add it in the pool (<code>ip dhcp pool PH-LAN</code>, then <code>default-router 10.80.10.1</code>)", done:e=>{ const p = e.dhcp.pools["PH-LAN"]; return !!p && p.routers.length===1 && p.routers[0]==="10.80.10.1" && e.history.some(h=>/sh\S*\s+(run\S*\s*\|\s*sec\S*\s+dhcp|ip\s+dhcp\s+pool)/i.test(h)); }},
    {text:"NAT: read <code>show ip nat statistics</code>. Which interfaces are listed as inside and outside — and which should be? Fix both interfaces with <code>ip nat inside</code> / <code>ip nat outside</code>", done:e=>{ const a = e.intfs["GigabitEthernet0/0"], b = e.intfs["GigabitEthernet0/1"]; return !!a.natIn && !a.natOut && !!b.natOut && !b.natIn; }},
    {text:"SNMP: the template left <code>snmp-server community public RW</code> — a well-known string with write access, open to anyone. Remove it (<code>no snmp-server community public</code>), create <code>access-list 20 permit host 10.80.50.10</code>, and add a read-only community limited to that list: <code>snmp-server community PhN0c-View RO 20</code>", done:e=>{ const C = e.snmp.communities; if (C.public) return false; return Object.values(C).some(c=>c.mode==="ro" && c.acl && window.ACL.check(e.acl, c.acl, {src:"10.80.50.10"}, false).permit && !window.ACL.check(e.acl, c.acl, {src:"10.80.10.50"}, false).permit) && !Object.values(C).some(c=>c.mode==="rw"); }},
    {text:"NTP: <code>show ntp associations</code> shows the router taking time from 127.127.1.1, its own clock — <code>ntp master 1</code> makes a branch router announce itself as stratum 1. Remove it (<code>no ntp master 1</code>) and point it at HQ with <code>ntp server 10.80.255.1</code>", done:e=>e.ntpMaster==null && (e.ntpServers||[]).includes("10.80.255.1")},
    {text:"Prove and save: <code>show running-config | include nat|snmp|ntp|logging</code> (every line containing any of those words) — the logging lines were right all along — then <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*i\S*\s+.*(nat|snmp|ntp)/i.test(h))},
  ],
  win:"Four faults caught before the courier left: a pool with no default-router, NAT inside and outside swapped, a public read-write SNMP community, and a branch router claiming to be a stratum-1 clock. The logging lines matched the design — an audit records what's right, too.",
  solve:["enable","show running-config | section dhcp","show ip dhcp pool","configure terminal","ip dhcp pool PH-LAN","default-router 10.80.10.1","exit","end","show ip nat statistics","configure terminal","interface g0/0","ip nat inside","interface g0/1","ip nat outside","exit",
    "no snmp-server community public","access-list 20 permit host 10.80.50.10","snmp-server community PhN0c-View RO 20","end","show ntp associations","configure terminal","no ntp master 1","ntp server 10.80.255.1","end",
    "show running-config | include nat|snmp|ntp|logging","copy running-config startup-config",""]})}
${K.job("The outage the NOC never saw",`
<h3>Ticket 6120 · 09:40 · &ldquo;A technician at Kaduna shut KD-R1's LAN port by mistake this morning and brought it back up. Our syslog server shows nothing from KD-R1 — not this morning, not all month.&rdquo;</h3>
<p><b>Symptom and questions.</b> One router, silent for a month. &ldquo;What changed a month ago?&rdquo; — <i>&ldquo;We moved the syslog server to new hardware.&rdquo;</i> That points at <b>Aim</b>.</p>
<p><b>Checks.</b> On KD-R1, <code>show logging</code>: the buffer holds this morning's messages, so the router logged them. The header shows where they went:</p>
${K.out(`KD-R1#show logging
...
    Trap logging: level notifications, 5 message lines logged
        Logging to 10.60.50.11  (udp port 514, audit disabled,
              link up),
              5 message lines logged,
...
Oct 12 08:30:56.096: %LINK-5-CHANGED: Interface GigabitEthernet0/0, changed state to administratively down
Oct 12 08:31:03.233: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to down
Oct 12 08:31:10.370: %LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up
Oct 12 08:31:17.507: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up
Oct 12 08:31:24.644: %SYS-5-CONFIG_I: Configured from console by console
KD-R1#ping 10.60.50.11
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.60.50.11, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)`, "Replayed in the lab (lab timestamps, in UTC — IOS's default for log timestamps unless you add localtime). &ldquo;5 message lines logged&rdquo; means sent: syslog is one-way UDP, so nothing told KD-R1 that no server lives at 10.60.50.11 any more.")}
<p>The trap level is right; the address is the old server's. The new server is 10.60.50.10, and <code>ping 10.60.50.10</code> replies <code>!!!!!</code> — <b>Away and back</b> is fine. <code>show clock</code> has no <code>*</code>, so the timestamps can be trusted.</p>
<p><b>Fix.</b> <code>no logging host 10.60.50.11</code>, <code>logging host 10.60.50.10</code>, <code>end</code>. Leaving config mode logs <code>%SYS-5-CONFIG_I</code> (severity 5), which appears on the new server — a free test message. <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;KD-R1 was still sending its logs to the old server's address, so they went nowhere. It now sends to the new one — I've watched a test message arrive. This morning's messages are still in the router's buffer; I've attached them.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;KD-R1 logged to retired 10.60.50.11 (UDP, unreceived). Changed to 10.60.50.10; test CONFIG_I received; saved; buffer extract attached. Follow-up: check <code>logging host</code> on all routers.&rdquo;</i></p>`)}
${K.dodont([
  "Test every service from the client's side: <code>ipconfig /all</code>, <code>nslookup</code>, <code>show ntp associations</code>, an <code>snmpget</code> from the NMS itself.",
  "After a syslog change, generate a test message (leaving config mode logs <code>%SYS-5-CONFIG_I</code>) and see it arrive.",
  "Mark voice at the access edge, trust the phones, shape to a provider's rate, keep the priority queue small.",
],[
  "Trust a sending-side counter: &ldquo;5 message lines logged&rdquo; means sent, not received.",
  "Leave <code>public</code> communities, or any RW community without an ACL.",
  "Put <code>ntp master</code> on every router &ldquo;to be safe&rdquo; — each becomes a false clock.",
])}
${K.check({q:"Nightly backups from a router to 10.33.50.10 fail. The router pings 10.33.50.10, and that is the address on the asset list, but the server team says it is a file server with no TFTP service installed. Which of the four A's failed?", o:["Aim — the router uses the wrong address","Alive — nothing on that server is running TFTP","Away and back — there is no return route","Allowed — the router's ACL blocks TFTP"], a:1, why:"The address matches the design (Aim) and ping proves the path both ways. Nothing runs TFTP there, so no conversation can start: enable a TFTP service or use a server that has one."})}
<h3>Same logic, new situation</h3>
<p>Jos: the NOC replaced its NMS (10.44.50.10) with a new one at 10.44.50.20, which now shows JS-R1 as unreachable: <code>snmpget -v2c -c Jos-View 10.44.255.2 sysName.0</code> returns <code>Timeout: No Response from 10.44.255.2.</code> The new NMS pings JS-R1 fine, with the same community string as before.</p>
${K.hint(`Work the four A's in order. Ping proves one of them. The community string is the same — so what else does <code>snmp-server community Jos-View RO 5</code> say about who may ask?`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Why an SNMP poll times out when ping works. <b>2. Which rule?</b> The four A's: Aim, Alive (the old NMS was answered) and Away and back (ping) are fine — so <b>Allowed</b>: a community can carry an ACL, and the agent stays silent to managers it doesn't permit. <b>3. Apply it.</b> <code>show running-config | include snmp|access-list</code> shows <code>snmp-server community Jos-View RO 5</code> and <code>access-list 5 permit host 10.44.50.10</code> — the old NMS only. Add <code>access-list 5 permit host 10.44.50.20</code> and repeat the <code>snmpget</code>.</p>`)}

<h2>The Module 7 challenge</h2>
<p>Harmattan Logistics has its head office in Abuja and a depot in Kano. Over the weekend a contractor &ldquo;tidied up&rdquo; both routers, rebuilding the Kano router from an old template. On Monday the NOC has six complaints. The ISP and the internet server aren't Harmattan's — the faults are all on Harmattan's side.</p>
${K.svg("0 0 760 382",
  K.dev("server",110,50,"INTERNET-SRV","198.51.100.123 · NTP stratum 1")+K.dev("router",300,50,"ISP","")+
  K.dev("router",420,150,"EDGE","DHCP · PAT · NTP · syslog")+K.dev("router",640,150,"KANO-R1","relay · NTP client")+
  K.dev("switch",220,240,"","")+K.txt(190,236,"HQ-SW",{end:true,f:"display",c:"fg",b:true,s:11.5})+K.txt(190,250,"Abuja LAN 10.70.10.0/24",{end:true,s:10})+
  K.dev("pc",110,320,"PC-ABUJA","DHCP")+K.dev("server",300,320,"SRV","10.70.10.10 · DNS, syslog, SNMP, TFTP")+
  K.dev("pc",640,296,"PC-KANO","DHCP via relay · 10.70.20.0/24")+
  K.link(128,52,276,52,"198.51.100.0/24")+K.link(320,62,402,140)+K.txt(362,96,"203.0.113.0/30",{s:10})+K.link(444,152,616,152,"10.70.255.0/30")+
  K.link(398,158,246,234)+K.link(208,252,122,298)+K.link(232,252,294,298)+K.link(640,204,640,276),
  "The challenge network. EDGE serves DHCP to both LANs (Kano via a relay), translates both with PAT, takes time from INTERNET-SRV and serves it to KANO-R1, and logs to SRV, the DNS server for harmattan.example.com.")}
${K.tip(`Complaints are outcomes, not instructions, and one fault can hide another (&ldquo;fix X first&rdquo; in a hint). Work the four A's from the user's side, give each complaint ten honest minutes before its <b>Hint</b>, re-test after every fix, and keep a scratch list — complaint, A, fingerprint, fix, proof — for your ticket notes and portfolio.`)}
${K.bench({id:"m7-challenge", points:200, challenge:true, openLog:true, from:"CCNA · Module 7 · lesson 8", title:"Module 7 challenge — the Monday after the tidy-up", viewBox:"0 0 960 480",
  intro:"Console cable on EDGE (9600 8N1, no flow control); move it to KANO-R1 when you need to. Enable secret on both: <code>Harmattan26</code>. <b>Design:</b> Abuja LAN 10.70.10.0/24 (gateway EDGE .1); Kano LAN 10.70.20.0/24 (gateway KANO-R1 .1); .1–.20 reserved on both; WAN 10.70.255.0/30 (EDGE .1, KANO-R1 .2). EDGE: DHCP pools <code>HQ</code> and <code>KANO</code> (DNS 10.70.10.10, domain harmattan.example.com), relayed by KANO-R1; PAT for <b>both</b> LANs to 203.0.113.2; NTP from INTERNET-SRV 198.51.100.123, serving KANO-R1; syslog to SRV at <b>notifications</b>. <b>Lab notes:</b> NTP syncs instantly (real: minutes); leases don't expire; a DHCP PC asks again whenever the network changes, but keeps a lease's options until <code>ipconfig /renew</code>.",
  devices:[
    {id:"inet", kind:"server", label:"INTERNET-SRV", x:10, y:10, ip:"198.51.100.123", mask:"255.255.255.0", gw:"198.51.100.1", services:{ntp:{stratum:1, ref:".GPS."}}},
    {id:"isp", kind:"router", label:"ISP", x:150, y:10, config:e=>{ ["en","conf t","hostname ISP","no ip domain-lookup","int g0/1","description CUSTOMER HARMATTAN","ip address 203.0.113.1 255.255.255.252","no shut",
      "int g0/0","description PUBLIC SERVERS","ip address 198.51.100.1 255.255.255.0","no shut","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:840, y:10},
    {id:"edge", kind:"router", label:"EDGE", x:380, y:140, config:e=>{ ["en","conf t","hostname EDGE","enable secret Harmattan26","no ip domain-lookup",
      "int g0/0","description ABUJA LAN","ip address 10.70.10.1 255.255.255.0","ip nat inside","no shut",
      "int g0/1","description ISP uplink","ip address 203.0.113.2 255.255.255.252","ip nat outside","no shut",
      "int g0/2","description WAN to KANO-R1","ip address 10.70.255.1 255.255.255.252","ip nat inside","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip route 10.70.20.0 255.255.255.0 10.70.255.2",
      "ip dhcp excluded-address 10.70.10.1 10.70.10.20","ip dhcp excluded-address 10.70.20.1 10.70.20.20",
      "ip dhcp pool HQ","network 10.70.10.0 255.255.255.0","default-router 10.70.10.254","dns-server 10.70.10.10","domain-name harmattan.example.com","exit",
      "ip dhcp pool KANO","network 10.70.20.0 255.255.255.0","default-router 10.70.20.1","dns-server 10.70.10.100","domain-name harmattan.example.com","exit",
      "access-list 1 permit 10.70.10.0 0.0.0.255","ip nat inside source list 1 interface g0/1 overload",
      "clock timezone WAT 1","ntp server 198.51.100.123","logging trap warnings","logging host 10.70.10.10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"br", kind:"router", label:"KANO-R1", x:700, y:140, config:e=>{ ["en","conf t","hostname KANO-R1","enable secret Harmattan26","no ip domain-lookup",
      "int g0/0","description KANO LAN","ip address 10.70.20.1 255.255.255.0","no shut",
      "int g0/1","description WAN to EDGE","ip address 10.70.255.2 255.255.255.252","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 10.70.255.1","clock timezone WAT 1","ntp server 10.70.225.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"HQ-SW", x:10, y:260, model:"Catalyst 9200 · Abuja LAN", platform:"C9200L"},
    {id:"pcbr", kind:"pc", label:"PC-KANO", x:740, y:260, dhcp:true},
    {id:"pchq", kind:"pc", label:"PC-ABUJA", x:40, y:370, dhcp:true},
    {id:"srv", kind:"server", label:"SRV", x:200, y:370, ip:"10.70.10.10", mask:"255.255.255.0", gw:"10.70.10.1",
      services:{ dns:{ name:"srv.harmattan.example.com", records:{ "portal.harmattan.example.com":"10.70.10.10", "srv.harmattan.example.com":"10.70.10.10" } }, syslog:true, nms:true, tftp:{ files:{} } }},
  ],
  cables:[ {type:"cat6", a:"inet:eth", b:"isp:g0"}, {type:"cat6", a:"isp:g1", b:"edge:g1"}, {type:"cat6", a:"edge:g0", b:"sw:g1"}, {type:"cat6", a:"edge:g2", b:"br:g1"},
    {type:"cat6", a:"pchq:eth", b:"sw:g2"}, {type:"cat6", a:"srv:eth", b:"sw:g3"}, {type:"cat6", a:"pcbr:eth", b:"br:g0"}, {type:"console", a:"lap:usb", b:"edge:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Kano depot (Musa):</b> &ldquo;Since the weekend our laptops show 169.254 addresses and can't open anything.&rdquo; <i>Done when PC-KANO has a DHCP lease in 10.70.20.0/24.</i>", hint:"Open the frame log after PC-KANO asks again (its IP settings: Obtain automatically, OK). Where does the Discover stop, and what does that router say it lacks? Routers don't forward broadcasts — which interface needs to be told where the DHCP server is, and what is EDGE's address on the link KANO-R1 can reach?", done:B=>/^10\.70\.20\./.test(Bench.leased(B,"pcbr")||"")},
    {text:"<b>Kano depot, later (Musa):</b> &ldquo;We have addresses now, and the portal opens if I type 10.70.10.10 — but typing <code>portal</code> gives an error.&rdquo; <i>Done when PC-KANO resolves portal.</i>", hint:"Fix the Kano addresses first. On PC-KANO: ipconfig /all — which DNS server does it use? nslookup portal says 'timed out' or 'non-existent'? Compare with the design, find where that option comes from on EDGE (show running-config | section dhcp), fix it, then make the PC renew.", done:B=>Bench.resolved(B,"pcbr","portal")},
    {text:"<b>Kano depot (Musa):</b> &ldquo;We can reach Abuja, but no internet site answers us.&rdquo; <i>Done when PC-KANO can ping INTERNET-SRV (198.51.100.123).</i>", hint:"Fix the Kano addresses first. Ping 198.51.100.123 from PC-KANO and read the frame log at EDGE. Then show ip nat translations after a ping from each LAN: whose inside local addresses appear? show access-lists — which subnets does the NAT rule's list cover?", done:B=>Bench.pinged(B,"pcbr","198.51.100.123")},
    {text:"<b>Abuja office (Ada):</b> &ldquo;Our PCs get addresses and open the portal on SRV, but nothing in Kano or on the internet answers.&rdquo; <i>Done when PC-ABUJA uses gateway 10.70.10.1 and can ping INTERNET-SRV (198.51.100.123).</i>", hint:"SRV is on PC-ABUJA's own subnet, so it needs no gateway — everything else does. Read PC-ABUJA's ipconfig /all: is its Default Gateway an address any router owns? Where did the PC get that value?", done:B=>B.devs.pchq.gw==="10.70.10.1" && Bench.pinged(B,"pchq","198.51.100.123")},
    {text:"<b>NOC (Fatima):</b> &ldquo;KANO-R1's log timestamps don't line up with EDGE's, and its clock has a star in front of it.&rdquo; <i>Done when KANO-R1 is synchronised by NTP (it should be stratum 3: one below EDGE).</i>", hint:"On KANO-R1: show ntp associations — what are st and reach for its configured server? Compare that address, digit by digit, with the WAN link's addressing. Which router should KANO-R1 take time from?", done:B=>Bench.ntpSynced(B,"br")},
    {text:"<b>Security audit (Emeka):</b> &ldquo;Policy says every configuration change on EDGE must be recorded on the syslog server. SRV has nothing from EDGE.&rdquo; <i>Done when SRV's syslog has received a %SYS-5-CONFIG_I message from EDGE.</i>", hint:"On EDGE: show logging — where is it logging to, and at what trap level? What severity is %SYS-5-CONFIG_I, and does that level include it? After the fix, leaving config mode creates a fresh CONFIG_I — check SRV's Server services panel.", done:B=>Bench.syslogGot(B,"srv",/%SYS-5-CONFIG_I/)},
  ],
  win:"Six faults across five services, one method: a missing relay, a DNS option pointing at nothing, a NAT list that forgot a LAN, a gateway option for a long-gone firewall, an NTP address with one wrong digit, and a trap level that hid the audit trail. Each time you asked the four A's from the user's side and read the line that proved the answer.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Harmattan26"],
    ["term","show running-config | section dhcp"],["term","show ip nat statistics"],["term","show access-lists"],["term","show logging"],
    ["term","configure terminal"],["term","ip dhcp pool HQ"],["term","default-router 10.70.10.1"],["term","exit"],["term","ip dhcp pool KANO"],["term","dns-server 10.70.10.10"],["term","exit"],
    ["term","access-list 1 permit 10.70.20.0 0.0.0.255"],["term","logging trap notifications"],["term","end"],["term","write memory"],
    ["pc","pchq","ipconfig /renew"],["pc","pchq","ping 198.51.100.123"],
    ["unplug","lap:usb"],["plug","console","lap:usb","br:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Harmattan26"],
    ["term","show ip interface g0/0"],["term","show ntp associations"],["term","configure terminal"],["term","interface g0/0"],["term","ip helper-address 10.70.255.1"],["term","exit"],
    ["term","no ntp server 10.70.225.1"],["term","ntp server 10.70.255.1"],["term","end"],["term","show ntp status"],["term","write memory"],
    ["pc","pcbr","ipconfig /all"],["pc","pcbr","nslookup portal"],["pc","pcbr","ping 198.51.100.123"],["pc","pcbr","ping portal"]]})}
${K.hint(`Stuck? Start with the PCs that have no working address or gateway — they can't test anything else. Then Kano's names and internet, then NTP and syslog, which involve no PC at all.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Fault 1 — Kano: no DHCP relay",`<p><b>Found:</b> PC-KANO has an <code>Autoconfiguration IPv4 Address</code> (169.254.x.x). The frame log: KANO-R1 Gi0/0 heard the Discover but has <i>no DHCP pool for 10.70.20.0/24 and no ip helper-address</i>; <code>show ip interface g0/0</code> confirms it: <code>Helper address is not set</code>. <b>A:</b> Aim — the client can't reach any server. <b>Fix:</b> <code>interface g0/0</code>, <code>ip helper-address 10.70.255.1</code> (EDGE's address on the link). <b>Proof:</b> the PC asks again by itself and gets a lease (press OK in its IP settings to watch the relayed Discover, Offer, Request, Ack in the frame log); <code>ipconfig /all</code> shows 10.70.20.21 with <code>DHCP Server . . : 10.70.255.1</code>.</p>`)}
${K.reveal("Fault 2 — the Kano pool's DNS server doesn't exist",`<p><b>Found:</b> PC-KANO pings 10.70.10.10, but <code>ping portal</code> can't find the host. <code>ipconfig /all</code>: <code>DNS Servers . . : 10.70.10.100</code>; <code>nslookup portal</code>: <code>DNS request timed out.</code> — nobody answers there (a missing record would say <i>Non-existent domain</i>). EDGE's <code>show running-config | section dhcp</code>: pool <code>KANO</code> has <code>dns-server 10.70.10.100</code>. <b>A:</b> Aim, set by DHCP. <b>Fix:</b> in <code>ip dhcp pool KANO</code>, <code>dns-server 10.70.10.10</code>; then <code>ipconfig /renew</code> on PC-KANO. <b>Proof:</b> <code>nslookup portal</code> answers <code>portal.harmattan.example.com</code>, <code>10.70.10.10</code> — the suffix was added for you.</p>`)}
${K.reveal("Fault 3 — the NAT list forgot Kano",`<p><b>Found:</b> PC-KANO's internet ping times out; the frame log says 10.70.20.x <i>isn't matched by any NAT rule's access list</i>, so it leaves untranslated and the ISP can't route the reply. <code>show ip nat translations</code> lists only 10.70.10.x; <code>show access-lists</code>: <code>10 permit 10.70.10.0, wildcard bits 0.0.0.255</code>. Gi0/2 is correctly <code>ip nat inside</code>. <b>A:</b> Away and back. <b>Fix:</b> <code>access-list 1 permit 10.70.20.0 0.0.0.255</code>. <b>Proof:</b> the ping replies; the table adds <code>icmp 203.0.113.2:1024 10.70.20.21:1 …</code> beside Abuja's entry — one inside global, different ports.</p>`)}
${K.reveal("Fault 4 — Abuja's pool points at a gateway that isn't there",`<p><b>Found:</b> PC-ABUJA reaches SRV (same subnet, no gateway needed); anything else gives <code>Reply from 10.70.10.21: Destination host unreachable.</code> — its ARP for the gateway gets no answer. <code>ipconfig /all</code>: <code>Default Gateway . . : 10.70.10.254</code>, the old firewall, from the HQ pool's <code>default-router</code>. <b>A:</b> Aim, set by DHCP. <b>Fix:</b> in <code>ip dhcp pool HQ</code>, <code>default-router 10.70.10.1</code>; <code>ipconfig /renew</code> on the PC (its unicast renewal's Ack carries the new option). <b>Proof:</b> gateway 10.70.10.1; the internet ping replies.</p>`)}
${K.reveal("Fault 5 — one wrong digit in KANO-R1's NTP server",`<p><b>Found:</b> <code>show clock</code> starts with <code>*</code>; <code>show ntp associations</code>: <code>~10.70.225.1 .INIT. 16 … 0</code>. The WAN is 10.70.<b>255</b>.0/30 — 10.70.<b>225</b>.1 belongs to nobody. EDGE is fine: <code>*~198.51.100.123 .GPS. 1</code>. <b>A:</b> Aim. <b>Fix:</b> <code>no ntp server 10.70.225.1</code>, <code>ntp server 10.70.255.1</code>. <b>Proof:</b> <code>Clock is synchronized, stratum 3, reference is 10.70.255.1</code>; <code>*~10.70.255.1 198.51.100.123 2 … 377</code>. The hierarchy reads stratum 1 → 2 (EDGE) → 3 (KANO-R1).</p>`)}
${K.reveal("Fault 6 — a trap level that hides the audit trail",`<p><b>Found:</b> EDGE's <code>show logging</code>: <code>Trap logging: level warnings</code>, <code>Logging to 10.70.10.10</code> — the right server, directly connected. Warnings sends severities 0–4; <code>%SYS-5-CONFIG_I</code> is 5. <b>A:</b> Allowed — the router's own rule excluded the message. <b>Fix:</b> <code>logging trap notifications</code> (or <code>logging trap 5</code>). <b>Proof:</b> <code>end</code> logs a fresh CONFIG_I, which appears in SRV's Server services panel at severity 5. Earlier messages are never resent.</p>
<p><b>Finally</b> <code>write memory</code> on both routers, and a ticket note per complaint: the A that failed, the fingerprint, the fix, the proof.</p>`)}

<h2>Portfolio project: add the services to your three-site network</h2>
<p>&ldquo;Have you set up DHCP, NAT, NTP and syslog?&rdquo; is a standard support-role question. A repository with a services design, real configs, client-side proof and an honest break/fix log answers it better than a CV line. Build on your Module 5/6 three-site network (head office, two branches, an &ldquo;ISP&rdquo; router) in the Ladder Lab builder, Packet Tracer, GNS3 or CML.</p>
<h3>The brief</h3>
<div class="tablewrap"><table>
<tr><th>Service</th><th>Where and how</th><th>Key commands</th></tr>
<tr><td><b>Central DHCP + relay</b></td><td>A pool per LAN on one server; a relay on each branch LAN interface</td><td><code>ip dhcp excluded-address</code>, <code>ip dhcp pool</code>, <code>default-router</code>, <code>dns-server</code>, <code>domain-name</code>, <code>ip helper-address</code></td></tr>
<tr><td><b>DNS</b></td><td>A DNS server (or the HQ router) with a record for every server</td><td><code>ip name-server</code>, <code>ip host</code>, <code>ip dns server</code></td></tr>
<tr><td><b>PAT to the ISP</b></td><td>On the edge, covering <i>every</i> LAN; optionally one port forward</td><td><code>ip nat inside</code> / <code>outside</code>, <code>access-list</code>, <code>ip nat inside source list … overload</code></td></tr>
<tr><td><b>NTP hierarchy</b></td><td>Edge from an outside source (or <code>ntp master</code> on the ISP router as a stand-in); the rest from the edge</td><td><code>ntp server</code>, <code>clock timezone</code></td></tr>
<tr><td><b>Syslog + SNMP</b></td><td>All routers to one management server: syslog at notifications; SNMPv2c read-only with an ACL, plus traps (production: SNMPv3)</td><td><code>logging host</code>, <code>logging trap</code>, <code>snmp-server community … RO acl</code>, <code>snmp-server host</code>, <code>snmp-server enable traps</code></td></tr>
<tr><td><b>TFTP backups</b></td><td>Every router's config to the server — by hand in the lab; scheduled in production (IOS's archive feature or a script)</td><td><code>copy running-config tftp:</code>, test restore with <code>copy tftp: running-config</code></td></tr>
<tr><td><b>QoS (on paper)</b></td><td>DSCP per traffic type, the trust boundary, the LLQ size for your call count</td><td>A class table and the policy you would apply</td></tr>
</table></div>
<h3>Rehearse the management plane first</h3>
<p>The challenge covered the user-facing services. This bench rehearses the management half — NTP, syslog, SNMP, TFTP — on two sites, and gives you your first evidence.</p>
${K.bench({id:"m7-mgmt-plane", points:120, from:"CCNA · Module 7 · lesson 8", title:"portfolio rehearsal — time, logs, monitoring and backups for two routers", viewBox:"0 0 760 380",
  intro:"Console cable on HQ-R1 (9600 8N1, no flow control, no enable secret); move it to BR-R1 as needed. <b>Design:</b> MGMT-SRV 10.90.50.10 (syslog, SNMP manager, TFTP) on HQ-R1 Gi0/0; WAN 10.90.255.0/30 (HQ-R1 .1, BR-R1 .2); TIME-SRV 192.0.2.123, a stratum-1 stand-in, on HQ-R1 Gi0/2. Both routers: WAT +1, syslog at notifications, read-only community <code>N0cView</code> for MGMT-SRV only (ACL 10). NTP syncs instantly here.",
  devices:[
    {id:"time", kind:"server", label:"TIME-SRV", x:10, y:10, ip:"192.0.2.123", mask:"255.255.255.0", gw:"192.0.2.1", services:{ntp:{stratum:1, ref:".GPS."}}},
    {id:"hq", kind:"router", label:"HQ-R1", x:200, y:130, config:e=>{ ["en","conf t","hostname HQ-R1","no ip domain-lookup","int g0/0","description MGMT LAN","ip address 10.90.50.1 255.255.255.0","no shut",
      "int g0/1","description WAN to BR-R1","ip address 10.90.255.1 255.255.255.252","no shut","int g0/2","description TIME SOURCE","ip address 192.0.2.1 255.255.255.0","no shut","exit",
      "ip route 10.90.20.0 255.255.255.0 10.90.255.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"br", kind:"router", label:"BR-R1", x:520, y:130, config:e=>{ ["en","conf t","hostname BR-R1","no ip domain-lookup","int g0/0","description BRANCH LAN","ip address 10.90.20.1 255.255.255.0","no shut",
      "int g0/1","description WAN to HQ-R1","ip address 10.90.255.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.90.255.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"mgmt", kind:"server", label:"MGMT-SRV", x:120, y:270, ip:"10.90.50.10", mask:"255.255.255.0", gw:"10.90.50.1", services:{syslog:true, nms:true, tftp:{files:{}}}},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:380, y:270},
    {id:"pcb", kind:"pc", label:"PC-BRANCH", x:600, y:270, ip:"10.90.20.50", mask:"255.255.255.0", gw:"10.90.20.1"},
  ],
  cables:[ {type:"cat6", a:"time:eth", b:"hq:g2"}, {type:"cat6", a:"hq:g0", b:"mgmt:eth"}, {type:"cat6", a:"hq:g1", b:"br:g1"}, {type:"cat6", a:"br:g0", b:"pcb:eth"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Time:</b> on both routers <code>clock timezone WAT 1</code>; HQ-R1 <code>ntp server 192.0.2.123</code>, BR-R1 <code>ntp server 10.90.255.1</code> (HQ-R1). Done when BR-R1 is synchronised — <code>show ntp status</code> should say stratum 3", done:B=>Bench.ntpSynced(B,"br") && (B.devs.hq.env.ntpServers||[]).includes("192.0.2.123") && (B.devs.br.env.ntpServers||[]).includes("10.90.255.1") && B.devs.hq.env.ntpMaster==null && !!B.devs.br.env.tz && !!B.devs.hq.env.tz},
    {text:"<b>Logs:</b> on both routers <code>logging host 10.90.50.10</code> and <code>logging trap notifications</code>. Done when both are configured and a <code>%SYS-5-CONFIG_I</code> has reached MGMT-SRV (open its Server services panel)", done:B=>["hq","br"].every(r=>{ const e = B.devs[r].env; return e.logHosts.includes("10.90.50.10") && e.logTrap>=5; }) && Bench.syslogGot(B,"mgmt",/%SYS-5-CONFIG_I/)},
    {text:"<b>Monitoring:</b> on both routers <code>access-list 10 permit host 10.90.50.10</code>, <code>snmp-server community N0cView RO 10</code>, a <code>snmp-server location</code> and <code>snmp-server contact</code>. Then from MGMT-SRV's Command Prompt poll each router: <code>snmpget -v2c -c N0cView 10.90.255.2 sysName.0 sysLocation.0</code> (and the same for 10.90.50.1)", done:B=>["hq","br"].every(r=>{ const e = B.devs[r].env, C = Object.values(e.snmp.communities); return C.length>0 && C.every(c=>c.mode==="ro" && c.acl && window.ACL.check(e.acl, c.acl, {src:"10.90.50.10"}, false).permit && !window.ACL.check(e.acl, c.acl, {src:"10.90.20.50"}, false).permit) && !!e.snmp.location; }) && Bench.tried(B,"mgmt",/snmpget\s.*\s10\.90\.255\.2\b/) && Bench.tried(B,"mgmt",/snmpget\s.*\s10\.90\.(50|255)\.1\b/)},
    {text:"<b>Alerts:</b> on BR-R1 <code>snmp-server host 10.90.50.10 version 2c N0cView</code> and <code>snmp-server enable traps</code>. Test it the way you'd test a fire alarm: <code>shutdown</code> then <code>no shutdown</code> on BR-R1's Gi0/0 (the branch PC loses its link for a moment). Done when MGMT-SRV lists a linkDown trap", done:B=>Bench.trapGot(B,"mgmt",/changed state to (administratively )?down/)},
    {text:"<b>Backups:</b> <code>copy running-config tftp:</code> on each router to 10.90.50.10, accepting the suggested file name. Done when MGMT-SRV holds <code>hq-r1-confg</code> and <code>br-r1-confg</code> — then <code>write memory</code> on both", done:B=>Bench.tftpFile(B,"mgmt","hq-r1-confg") && Bench.tftpFile(B,"mgmt","br-r1-confg") && !!B.devs.hq.env.savedOnce && !!B.devs.br.env.savedOnce},
  ],
  win:"A management plane you can show an employer: a two-tier NTP hierarchy (stratum 1 → 2 → 3), every config change and link event logged centrally at notifications, read-only SNMP that answers only the management server, a trap that proves the alarm works, and config backups on the TFTP server. Paste each proof into your portfolio's evidence folder.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","clock timezone WAT 1"],["term","ntp server 192.0.2.123"],["term","logging host 10.90.50.10"],["term","logging trap notifications"],
    ["term","access-list 10 permit host 10.90.50.10"],["term","snmp-server community N0cView RO 10"],["term","snmp-server location Abuja HQ comms room"],["term","snmp-server contact noc@example.com"],["term","end"],
    ["term","show ntp associations"],["term","copy running-config tftp:"],["term","10.90.50.10"],["term",""],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","br:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","clock timezone WAT 1"],["term","ntp server 10.90.255.1"],["term","logging host 10.90.50.10"],["term","logging trap notifications"],
    ["term","access-list 10 permit host 10.90.50.10"],["term","snmp-server community N0cView RO 10"],["term","snmp-server location Kano branch rack 2"],["term","snmp-server contact noc@example.com"],
    ["term","snmp-server host 10.90.50.10 version 2c N0cView"],["term","snmp-server enable traps"],["term","end"],["term","show ntp status"],
    ["pc","mgmt","snmpget -v2c -c N0cView 10.90.255.2 sysName.0 sysLocation.0"],["pc","mgmt","snmpget -v2c -c N0cView 10.90.50.1 sysName.0 sysLocation.0"],
    ["term","configure terminal"],["term","interface g0/0"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["term","copy running-config tftp:"],["term","10.90.50.10"],["term",""],["term","write memory"]]})}
<h3>Build it, break it, prove it</h3>
${K.steps([
  ["Design","Add a services column to your addressing table (who serves what, to whom) and write the QoS class table."],
  ["Build one service at a time","DHCP and relay, DNS, PAT, then NTP, syslog, SNMP, TFTP — proving each from the <i>client's</i> side before the next."],
  ["Capture evidence","Paste outputs unedited into text files (the list below)."],
  ["Break it on purpose","Three faults from the fingerprint table, one at a time: symptom, the A that failed, fingerprint, fix, proof."],
  ["Publish","README, configs, evidence and diagram on GitHub — community strings, passwords and anything real removed."],
])}
<h3>A write-up template you can copy</h3>
<p>Save this as <code>README.md</code> and fill in each angle bracket.</p>
${K.out(`# IP services for a three-site network: DHCP, DNS, PAT, NTP, syslog, SNMP, TFTP
Author: <name> · Built with: <Packet Tracer / GNS3 / CML / Ladder Lab> · <month year>

## 1. Problem
<2-4 sentences: what the business needs (addresses, names, internet, time, monitoring, backups)>

## 2. Design (and why)
- DHCP: pools on <server>; relays on <branch interfaces>; exclusions <ranges>
- DNS: <server>, domain <example.com name>; records for <servers>
- PAT: <edge router> overload on <interface>; ACL <n> covers <every LAN>
- NTP: <source> (stratum <n>) -> <edge> -> <branches>; timezone <zone>
- Syslog: all routers -> <server> at notifications
- SNMP: v2c RO community with ACL <n> (production: SNMPv3 authPriv); traps to <server>
- Backups: copy running-config tftp: to <server>, file names <host>-confg
- QoS (design only): voice EF in LLQ <size> kb/s; video AF41; trust boundary at <phones>

## 3. Service plan
| Service | Server / source | Clients | Key setting |
|---------|-----------------|---------|-------------|

## 4. Verification evidence (configs in /configs, outputs in /evidence)
| Test | Expected | Observed |
|------|----------|----------|
| Branch PC ipconfig /all | address, gateway, DNS from its pool | |
| show ntp associations (each tier) | * peer, reach 377, stratum +1 per tier | |
| Branch interface shut | syslog message + linkDown trap | |

## 5. What broke and how I fixed it
| # | Fault | Symptom | Which A failed | Fingerprint (command + line) | Fix | Proof |
|---|-------|---------|----------------|------------------------------|-----|-------|

## 6. How to check my work / what next
- Simulated in <tool + version>; simplifications: <e.g. ISP router as NTP source, SNMPv2c>
- Outputs pasted unedited; next: <SNMPv3, DHCP snooping, ACLs (Module 8)>`, "Copy the whole block. Keep each evidence file as plain text pasted from the CLI, say what was simulated, and never tidy an output.")}
<h3>What &ldquo;done&rdquo; evidence looks like</h3>
<ul>
<li><code>ipconfig /all</code> from a PC on <b>every</b> LAN (relayed ones naming the central server), <code>show ip dhcp binding</code> and <code>nslookup</code> per site.</li>
<li><code>show ip nat translations</code> with inside locals from two sites sharing one inside global.</li>
<li><code>show ntp associations</code> per tier, strata counting up; no <code>*</code> on any <code>show clock</code>.</li>
<li>Syslog and trap lists with an event from each router; an <code>snmpget</code> per router, and one that times out from a non-management address; the TFTP file list.</li>
<li>Three break/fix entries with real fingerprint lines, and your LLQ arithmetic.</li>
</ul>
${K.tip(`Post it: 150 words on LinkedIn — problem, diagram, one fault proved by one output line, the link. &ldquo;The NTP server with one wrong digit&rdquo; is a ready answer to &ldquo;tell me about a time you troubleshot something&rdquo;.`)}
${K.check({q:"Which evidence best proves that central DHCP with relay works for a branch?", o:["The ip dhcp pool lines in the HQ router's running-config","A branch PC's ipconfig /all showing an address from the branch pool, the right gateway and DNS server, and 'DHCP Server' naming the central server — plus the matching entry in show ip dhcp binding","show ip interface brief on the branch router","The addressing table in the README"], a:1, why:"Configuration shows intent. The branch PC's ipconfig /all proves the relay, the pool chosen by giaddr and the options; the server's binding confirms it from the other side."})}

<h2>Interview corner</h2>
${K.hint(`Why voice suffers, what marks it, where it's queued, and what you'd check — numbers help.`)}
${K.reveal("&ldquo;Users say calls break up when the WAN is busy. How would you use QoS to fix it?&rdquo;",`<p>&ldquo;Voice needs under about 150 ms one way, low jitter and under 1% loss, and it suffers when it queues behind bulk data at a congested interface, usually the WAN edge. I'd mark at the source — phones mark EF, the switch trusts the phone but not the PC behind it — and on the WAN router put EF in an LLQ priority queue sized from the call count (about 87 kb/s per G.711 call), with bandwidth shares for data. If the provider's rate is below the port speed, I'd shape to it with the LLQ inside the shaper, or the queue never forms where my policy acts. Then I'd check markings survive end to end and test in the busy hour.&rdquo;</p>`)}
${K.hint(`A method, not a list: the client's view first, then the four things every service needs.`)}
${K.reveal("&ldquo;A branch says 'the internet is down'. How do you work through the IP services?&rdquo;",`<p>&ldquo;I start at a user's PC. <code>ipconfig /all</code>: 169.254 means DHCP never answered — at a branch, usually the relay; a wrong gateway or DNS server points at the pool's options. Then ping by address and by name: address works, name fails is DNS, and <code>nslookup</code> says whether the server is silent or the record missing. If the internet fails by address while HQ works, I check NAT on the edge — translations for that branch, the ACL, inside and outside. For each service I ask: is the client aimed at the right server, is the service alive, can packets get there and back, is this client allowed? And I prove the fix from the user's PC.&rdquo;</p>`)}

${K.recap([
  "QoS acts only where a queue forms — speed changes and many-to-one points, outbound. It decides who waits and who is dropped; it never adds bandwidth.",
  "Voice: 150 ms one way, 30 ms jitter, 1% loss; G.711 ≈ 87.2 kb/s per direction on Ethernet. The problem is waiting, not bandwidth.",
  "CoS = 3 bits in the 802.1Q tag, lost at the first router; DSCP = 6 bits in the IP header, end to end. EF = 46; AF = 8 × class + 2 × drop precedence, higher drop precedence dropped first; CS = 8 × class.",
  "Trust the phone, not the PC behind it; mark as close to the source as you can trust.",
  "FIFO → CBWFQ (a share per class) → LLQ (plus a strict, policed priority queue). Tail drop synchronises TCP; WRED drops early, by drop precedence.",
  "Policing drops or re-marks the excess, no delay; shaping buffers it, adds delay, outbound only. Shape to a provider's policed rate.",
  "Every IP service needs the four A's — Aim, Alive, Away and back, Allowed — and fails silently, so test from the client.",
  "Fingerprints: 169.254 = no relay or pool; wrong gateway/DNS in ipconfig /all = pool option; .INIT. stratum 16 = NTP server unreachable; level warnings hides severity 5.",
])}
${K.next(`<b>Module 8 — Security fundamentals.</b> The access lists you've used to choose who gets translated start <i>filtering</i> traffic; DHCP snooping protects the DHCP service you built here from rogue servers, and port security limits what can plug in; and you'll see why SNMPv3 and SSH replace the clear-text protocols.`)}
`,
quiz:[
  {q:"What DSCP decimal value is Expedited Forwarding (EF), the marking normally used for voice audio?", o:["34","40","46","48"], a:2, why:"EF is 46 (binary 101110). 34 is AF41 (interactive video), 40 is CS5, 48 is CS6 (network control, such as routing protocols).", lvl:1},
  {type:"fill", q:"Using AF = 8 × class + 2 × drop precedence, what is the DSCP decimal value of AF31?", fields:[{label:"DSCP", a:["26"]}], why:"Class 3, drop precedence 1: 8 × 3 + 2 × 1 = 26 (binary 011010).", lvl:1},
  {q:"Where is the Class of Service (CoS) value carried?", o:["In the 6-bit DSCP field of the IP header","In the 3-bit PCP field of the 802.1Q tag","In the TCP header's flags","In the Ethernet FCS"], a:1, why:"CoS is the 3-bit Priority Code Point inside the 802.1Q tag (values 0–7), so it exists only on tagged frames — trunks and the voice VLAN — and disappears at the first router. DSCP is the 6-bit field in the IP header.", lvl:1},
  {type:"match", q:"Match each QoS tool with what it does.", pairs:[["Classification","Identifies what kind of traffic a packet is"],["Marking","Writes a value such as DSCP into a header field"],["LLQ","Sends packets from a strict-priority queue first, policed to its rate"],["WRED","Drops some packets randomly before a queue is full, by drop precedence"],["Policing","Drops or re-marks traffic above a rate, without buffering"],["Shaping","Buffers traffic above a rate and sends it later"]], why:"Can My Queue Drop Politely, Smoothly: classify, mark, queue (LLQ/CBWFQ), drop early (WRED), police, shape. Each tool answers a single question: what is it, label it, what order, which to drop, how fast (by dropping or by delaying).", lvl:1},
  {type:"order", q:"Put the QoS treatment of a voice packet in order, from the phone to the WAN.", items:["The IP phone marks the voice packet CoS 5 and DSCP EF","The access switch trusts the phone's marking at the trust boundary","The WAN router classifies the packet by its DSCP value, EF","The router places it in the LLQ strict-priority queue","The scheduler sends it before the packets waiting in the other queues"], why:"Mark at the source you trust, keep the mark across the trusted network, and let the congested interface act on DSCP: classify, queue in the priority queue, and the scheduler serves that queue first.", lvl:1},
  {type:"multi", q:"Which two statements about Low Latency Queuing (LLQ) are true? (Choose two.)", o:["Packets in the priority queue are sent before packets in the other queues","During congestion, the priority queue is policed to its configured bandwidth","LLQ guarantees zero delay for voice","Bulk backups should be placed in the priority queue so they finish sooner","LLQ works only on inbound traffic"], a:[0,1], why:"LLQ adds a strict-priority queue to CBWFQ: it is always served first, and it is policed during congestion so it can't starve the other classes. Delay is minimised, not zero (a voice packet may wait for the packet already being sent). Queuing acts on outgoing traffic; bulk data in the priority queue would ruin it.", lvl:2},
  {q:"Two packets in the same AF class queue are AF21 and AF23. The queue is filling and WRED is enabled. Which statement is true?", o:["AF21 is dropped first because 1 is the lowest priority","AF23 is more likely to be dropped first, because a higher drop precedence starts losing packets at a shallower queue depth","Both are dropped equally — the second digit is ignored by WRED","Neither is dropped; WRED only drops voice"], a:1, why:"In an AF name the second digit is drop precedence: 1 low, 3 high. DSCP-based WRED gives AFx3 a lower minimum threshold, so it starts losing packets earlier than AFx1. Trap: the higher number is more droppable, not more important.", lvl:2},
  {q:"Why can tail drop make a congested link less efficient than WRED?", o:["Tail drop delays voice packets","Tail drop drops packets from many TCP flows at once, so they all slow down and speed up together (global synchronisation), leaving the link alternately overloaded and under-used","Tail drop re-marks packets to DSCP 0","Tail drop only works on UDP"], a:1, why:"TCP cuts its sending rate after a loss. When a full queue drops everyone's packets at the same moment, all flows back off together and then ramp up together — a sawtooth. WRED drops a few random packets early, so only some flows slow down at a time.", lvl:2},
  {q:"A provider sells a branch 20 Mb/s on a 100 Mb/s Ethernet handoff and drops traffic above 20 Mb/s. Which branch-router configuration best protects voice?", o:["Police outbound at 20 Mb/s","Shape outbound to 20 Mb/s with an LLQ policy inside the shaper","Configure LLQ on the 100 Mb/s interface only","Enable WRED on the voice class"], a:1, why:"The router's 100 Mb/s interface never congests, so LLQ alone never activates; the drops happen in the provider's policer, which ignores your classes. Shaping to 20 Mb/s moves the queue into your router, where the LLQ inside the shaper sends voice first. Policing would only drop more.", lvl:2},
  {q:"Based on the output from KD-R2, why is the router's clock marked as unsynchronised?", ex:"KD-R2#show ntp associations\n  address         ref clock       st   when   poll reach  delay  offset   disp\n ~10.62.255.9     .INIT.          16      -     64     0  0.000   0.000  15937.\n * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured\nKD-R2#show clock\n*09:30:00.000 WAT Mon Oct 12 2026\nKD-R2#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.62.30.1      YES manual up                    up\nGigabitEthernet0/1     10.62.255.2     YES manual up                    up", o:["NTP needs ntp master on KD-R2 as well","The configured server 10.62.255.9 has never answered (reach 0, .INIT., stratum 16); the WAN neighbour is probably 10.62.255.1, so the server address is wrong","The time zone is wrong","Stratum 16 is the most accurate stratum, so the clock is fine"], a:1, why:"~ means configured; no * in front means it isn't the chosen peer; .INIT., stratum 16 and reach 0 mean no reply has ever arrived. KD-R2's WAN address is 10.62.255.2, so its neighbour on that link is most likely .1 (on the usual /30 WAN, only .1 and .2 are usable) — the configured .9 isn't on the link. Fix the address; never add ntp master to cover it up.", lvl:2},
  {type:"fill", q:"The NOC wants a router to send syslog messages of severity 0 to 5 (including %SYS-5-CONFIG_I) to its server. Type the global configuration command that sets this level.", fields:[{label:"Command", a:["logging trap notifications","logging trap 5"], ios:true}], why:"logging trap sets the most detailed severity sent to syslog hosts: that level and everything more severe (lower numbers). Notifications is level 5, so 0–5 are sent. The default is informational (6).", lvl:2},
  {q:"A user in the Enugu branch can open the intranet at 10.44.10.20 by typing its address, but 'ping intranet' fails. Based on the output, what is the most likely cause?", ex:"C:\\Users\\chika>ipconfig /all\n...\n   IPv4 Address. . . . . . . . . . . : 10.44.30.25(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.44.30.1\n   DHCP Server . . . . . . . . . . . : 10.44.255.1\n   DNS Servers . . . . . . . . . . . : 10.44.30.53\n\nC:\\Users\\chika>nslookup intranet\nDNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  10.44.30.53", o:["The relay on the branch router is missing","The DHCP pool for the branch hands out DNS server 10.44.30.53, where nothing answers DNS; correct the pool's dns-server and renew the PC","The intranet server has no DNS record","The default gateway is wrong"], a:1, why:"The PC has a relayed lease (DHCP Server 10.44.255.1) and a working gateway — it reaches the intranet by address. 'DNS request timed out' means no DNS reply came from 10.44.30.53; a missing record would give 'Non-existent domain'. The DNS server address came from the pool's dns-server option: fix it on the DHCP server, then ipconfig /renew.", lvl:3},
  {q:"A branch voice team says calls are clear in the morning but break up every afternoon. The branch router has an LLQ policy on its WAN interface, and the 'show policy-map interface' counters show zero packets ever matched in the VOICE class. Phones connect to a recently replaced access switch. What is the most likely cause?", o:["The priority queue is too small","Voice is arriving with DSCP 0 — the new access switch isn't trusting the phones, so markings are rewritten before the router can classify them","WRED is dropping voice","The WAN link is too fast for QoS"], a:1, why:"Zero matches means the router never saw EF packets, not that the queue is undersized. The common cause after a switch swap is a port that doesn't trust the phone, re-marking voice to 0 — so it lands in class-default with the afternoon's bulk traffic. Restore trust for the phones (conditional trust) and confirm the counters start climbing.", lvl:3},
  {type:"multi", q:"A new branch's PCs get correct DHCP leases and can ping HQ servers by address. Internet access fails only from the new branch; HQ users browse fine through the same edge router running PAT. Which two faults on the edge router could each explain this? (Choose two.)", o:["The NAT access list doesn't permit the new branch's subnet","The edge interface facing the new branch is missing ip nat inside","The branch router is missing ip helper-address","The DHCP pool for the branch hands out the wrong DNS server","The edge router's ntp server address is wrong"], a:[0,1], why:"Leases work, so the relay is fine; pings by address work, so DNS isn't the issue for this test; NTP doesn't affect forwarding. Translation needs both a matching ACL entry and traffic arriving on an ip nat inside interface. If either is missing, the branch's packets leave with private source addresses and the replies can't return.", lvl:3},
  {q:"A receptionist uses a softphone application on her PC, which marks its own voice EF. The PC connects through a Cisco IP phone to an access switch that trusts the phone and the phone re-marks PC traffic to 0. What is the best way to give the softphone's voice priority without trusting everything the PC sends?", o:["Trust all markings on the access switch port","Leave the PC port untrusted and classify the softphone's traffic on the access switch (for example by its addresses and ports, or NBAR), marking only that traffic EF","Put all of the PC's traffic in the priority queue","Disable QoS on the phone"], a:1, why:"Trusting the PC would let any application claim EF. Keep the trust boundary at the phone, and instead classify the specific softphone traffic at the access switch and mark it there — the network, not the user's PC, decides what is voice.", lvl:3},
],
cards:[
  {f:"The QoS rule", b:"An interface sends one packet at a time; when traffic arrives faster than it can leave, packets queue and then drop. QoS decides who waits and who is dropped during congestion — it never adds bandwidth, and does nothing without a queue."},
  {f:"Voice targets and bandwidth", b:"One-way delay 150 ms or less, jitter 30 ms or less, loss 1% or less. G.711: 160-byte audio every 20 ms; 80 kb/s at Layer 3, 87.2 kb/s per direction on Ethernet. G.729: 31.2 kb/s on Ethernet."},
  {f:"Where queues form", b:"At speed changes (1 Gb/s LAN into a 20 Mb/s WAN) and many-to-one points, on the outgoing interface. Serialisation = bits / link speed: 1,500 bytes on 20 Mb/s = 0.6 ms; queuing delay is what varies and causes jitter."},
  {f:"CoS vs DSCP", b:"CoS: 3-bit PCP in the 802.1Q tag (0-7), only on trunks and voice VLANs, gone after the first router. DSCP: top 6 bits of the IP header's DS byte (0-63), carried end to end. Voice = CoS 5 / DSCP EF 46."},
  {f:"DSCP arithmetic", b:"EF = 46 (101110). AF = 8 x class + 2 x drop precedence: AF11 10, AF21 18, AF31 26, AF41 34; higher drop precedence = dropped first (AF13 before AF11). CS = 8 x class (CS3 24, CS6 48). Default = 0."},
  {f:"Trust boundary", b:"Where markings start to be believed. Mark close to the source you trust: the switch trusts the Cisco IP phone (conditional trust via CDP); the phone re-marks the PC's frames to CoS 0. Never trust user PCs."},
  {f:"FIFO, CBWFQ, LLQ", b:"FIFO: one queue. CBWFQ: a queue per class with a guaranteed minimum share. LLQ: CBWFQ plus one strict-priority queue, served first and policed to its rate during congestion — for voice (keep it to about a third of the link or less)."},
  {f:"Tail drop vs WRED", b:"Tail drop discards every arrival when the queue is full, so many TCP flows back off together (global synchronisation). WRED drops a growing random share between min and max thresholds, earlier for higher drop precedence. Not for voice."},
  {f:"Policing vs shaping", b:"Policing: drops or re-marks the excess at once; no delay; inbound or outbound (providers police). Shaping: buffers the excess and sends it later; adds delay; outbound only. Shape to a provider's policed CIR; Bc = CIR x Tc."},
  {f:"The four A's of any IP service", b:"Aim (client points at the right server), Alive (service running), Away and back (route both ways, NAT), Allowed (the server's rules include this client: pool, ACL, community, trap level). UDP services fail silently — test from the client."},
  {f:"Fingerprints: DHCP and DNS", b:"169.254 on a remote LAN = no ip helper-address (or no pool for its giaddr). Address but no off-subnet access = default-router option wrong. Ping by IP works, by name fails = DNS: 'timed out' = nobody answers there; 'Non-existent domain' = no record."},
  {f:"Fingerprints: NAT, NTP, syslog", b:"One LAN can't get out = NAT ACL misses it (no translations for its inside locals) or its interface lacks ip nat inside. NTP: .INIT., stratum 16, reach 0 = server never answered; '*' in show clock. Syslog: 'Trap logging: level warnings' hides severity 5 (CONFIG_I, LINK-5)."},
  {f:"Services portfolio evidence", b:"ipconfig /all from every LAN (relayed ones naming the central server), show ip dhcp binding, nslookup per site, show ip nat translations from two sites, show ntp associations per tier, syslog + trap lists, snmpget per router, TFTP file list, three break/fix entries, a QoS class table with LLQ sizing."},
],
});


const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[1-6]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m7", t:"IP services: DHCP, DNS, NAT/PAT, NTP, syslog, SNMP, TFTP and QoS",
  blurb:"Hand out addresses with DHCP (and relay it across subnets), resolve names with DNS, share one public address with NAT and PAT, keep every clock right with NTP, collect logs with syslog, monitor with SNMP, back configs up with TFTP — and know what QoS does for voice — then fix a broken branch in the Module 7 challenge.",
}, L, { at, modAt:6, replace:["Network services: DHCP, DNS, NAT/PAT, ACLs, SNMP, FTP/TFTP, QoS"] });
})();
