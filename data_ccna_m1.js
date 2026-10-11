// CCNA · Module 1 — How networks work (rebuilt to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "What a network is: clients, servers, OSI & TCP/IP, encapsulation".
(function(){
const L = [];

// ---------- Lesson 1 ----------
L.push({
id:"net-what", mins:50, level:"Beginner · no experience needed",
t:"What a network is — and what really happens when you open a website",
html:`
${K.goals([
  "Explain what a network is, using a real office as the example.",
  "Tell the difference between a client and a server — and why it is a <i>role</i>, not a type of box.",
  "Say what a MAC address and an IP address are for, and why every device needs both.",
  "Tell a LAN from a WAN from the internet, with a real example of each.",
  "Walk through, step by step, what happens between typing a website and seeing the page — the map for this whole course.",
])}
${K.pre(["Nothing — this is the very first lesson. If you can use a phone and a browser, you are ready."])}

<h2>Why this matters at work</h2>
<p>It is your second week on a service desk in Lekki. The phone rings: <i>"The internet is down."</i> Thirty seconds later, a second call from the same floor: <i>"My email isn't working."</i> A third: <i>"I can open Google but not our HR portal."</i></p>
<p>To the callers, these are three different problems. To someone who understands networks, they are clues to <b>one</b> problem, and the clues already point to where it is. The difference between a technician who guesses and one who fixes things in five minutes is not memorised commands. It is having a clear picture in your head of how data actually moves. This lesson builds that picture. Every later lesson zooms into one part of it.</p>

<h2>What a network actually is</h2>
<p>A <b>network</b> is two or more devices connected so they can exchange data. That is the whole definition. Two laptops joined by one cable are a network. The Wi-Fi in your house is a network. The internet is a network — in fact it is a <i>network of networks</i>: millions of separate networks owned by different companies, all agreeing to pass traffic to each other.</p>
<p>Each device on a network is called a ${K.g("host","Any device that sends or receives data on a network and has an address: laptops, phones, servers, printers, cameras, smart TVs. Network devices that only forward traffic (switches) are usually not called hosts.")} or a ${K.g("node","Any connection point on a network — hosts plus the devices that forward traffic (switches, routers). A slightly wider word than host.")}. The connection between two devices — a cable or a wireless signal — is called a <b>link</b>.</p>
${K.analogy(`<p>Picture a city's road system. <b>Houses</b> are hosts — where data starts and ends. <b>Roads</b> are links. <b>Junctions and roundabouts</b> are the network devices that decide which way traffic goes next. And every house needs an <b>address</b>, or nothing can be delivered to it. Almost everything in networking maps onto this picture, and we will come back to it often.</p>`)}
<p>Why build networks at all? To <b>share</b>: files on a server instead of on twenty USB sticks; one printer for the whole floor; one internet connection for a hundred staff; one accounting system everyone logs into. Sharing is the reason businesses pay for networks, and it is why network problems stop work instantly.</p>

${K.dyk(`The first message ever sent over ARPANET — the network that grew into the internet — was meant to be "LOGIN", sent from UCLA to the Stanford Research Institute (SRI) on 29 October 1969. The system crashed after two letters, so the first message in internet history was "LO".`)}
<h3>A real small office, piece by piece</h3>
<p>Here is a typical small office — say a 15-person accounting firm. Everything inside the office forms one ${K.g("LAN","Local Area Network: the devices in one building, floor or home, joined by switches and Wi-Fi over links you own. More on LAN vs WAN later in this lesson.")}; the router connects it to the outside world through an ${K.g("ISP","Internet Service Provider: the company that connects you to the internet — e.g. MTN, Airtel, Glo, Spectranet, MainOne, Starlink. Your router's outside link goes to them.")}, on what engineers call the ${K.g("WAN","Wide Area Network: links that join sites across cities or countries, usually rented from a provider. The office's link out to the ISP is its WAN side.")} side. You will see this layout, with small variations, in thousands of businesses.</p>
${K.svg("0 0 720 325",
  K.dev("laptop",70,60,"Laptop","staff")+K.dev("pc",70,150,"Desktop","reception")+K.dev("printer",70,240,"Printer","shared")+
  K.dev("ap",230,240,"Wi-Fi AP","")+K.dev("phone",320,250,"","")+
  K.dev("switch",260,150,"Switch","joins the LAN")+
  K.dev("server",260,52,"File server","")+
  K.dev("router",430,150,"Router","office edge")+K.dev("firewall",540,150,"Firewall","")+
  K.dev("cloud",650,150,"Internet","via the ISP")+
  K.link(95,62,234,145)+K.link(95,150,234,150)+K.link(95,238,236,158)+K.link(245,228,250,162)+K.link(260,72,260,139)+
  K.link(286,150,406,150)+K.link(454,150,518,150)+K.link(562,150,622,150,"ISP link")+
  `<path d="M300,235 q10,-8 20,-2" stroke="var(--accent)" fill="none" stroke-dasharray="3 3"/>`+
  K.txt(170,318,"── the LAN (inside the office) ──",{mid:true})+K.txt(600,218,"── towards the WAN ──",{mid:true}),
  "A small office: hosts connect to a switch (the LAN); the router and firewall connect the LAN to the internet through the ISP.")}
<p>Read it from left to right, because that is the way your traffic goes:</p>
<ul>
<li><b>Hosts</b> — laptops, the reception desktop, the shared printer, the file server, phones on Wi-Fi.</li>
<li>A <b>switch</b> — the box with many ports that all the cables plug into. It joins the devices <i>inside</i> the office into one local network.</li>
<li>A <b>wireless access point (AP)</b> — lets phones and laptops join that same local network without a cable.</li>
<li>A <b>router</b> — joins the office network to <i>other</i> networks (here, the internet). It is the office's door to the outside.</li>
<li>A <b>firewall</b> — decides which traffic is allowed in and out. In small offices the router, firewall and Wi-Fi are often one box.</li>
<li>The <b>ISP</b> (Internet Service Provider) — the company whose link connects you to everyone else.</li>
</ul>
<p>You will meet each of these devices properly in the next lesson. For now, the key idea is the split: <b>inside</b> (the local network, joined by switches) and <b>outside</b> (other networks, reached through a router).</p>
${K.check({q:"In the office above, which device connects the office's local network to the internet?", o:["The switch","The router","The access point","The file server"], a:1, why:"A switch joins devices <i>inside</i> one local network. Joining your network to <i>other</i> networks — like the internet — is the router's job."})}

<h2>Clients and servers: roles, not boxes</h2>
<p>Almost every conversation on a network has two sides. The <b>client</b> asks for something; the <b>server</b> provides it. When you open a website, your browser is the client and the machine holding the website is the server. When you print, your laptop is the client and the print server is the server.</p>
<p>Here is the part that trips beginners up: <b>client and server are roles in a conversation, not kinds of hardware.</b> A "server" is any device running software that listens for requests and answers them. Your own laptop becomes a server the moment you share a folder on it. A huge rack-mounted machine in a data centre is only a server because of the software it runs.</p>
<p>That said, in companies, the machines we <i>call</i> servers are built differently: two power supplies, mirrored disks, remote management cards, no screen. They are built so that one broken part does not stop the service everyone depends on.</p>
<div class="tablewrap"><table>
<tr><th>Service</th><th>What the client asks for</th><th>Example at work</th></tr>
<tr><td>Web</td><td>"Send me this page"</td><td>Company intranet, HR portal, any website</td></tr>
<tr><td>File</td><td>"Open / save this file"</td><td>The shared <code>S:</code> drive on a file server</td></tr>
<tr><td>Print</td><td>"Print this job"</td><td>The second-floor printer queue</td></tr>
<tr><td>Email</td><td>"Send this / give me new mail"</td><td>Microsoft 365, Google Workspace</td></tr>
<tr><td>Addresses (${K.g("DHCP","Dynamic Host Configuration Protocol: the service that automatically gives every device that joins the network an address (plus its gateway and DNS server), so nobody has to type them in by hand.")})</td><td>"Give me an address"</td><td>Your router hands out addresses to every laptop that joins</td></tr>
<tr><td>${K.g("Names (DNS)","Domain Name System: the internet's phone book. It turns names people can remember, like google.com, into the numeric addresses computers actually use.")}</td><td>"What is the address of this name?"</td><td>Turning <code>portal.company.com</code> into a number computers can use</td></tr>
</table></div>
<p>The last two — DHCP and DNS — are invisible to users, but they sit underneath almost everything. When they fail, users report "the internet is down" even though the internet is fine. Keep that in mind; it is the answer to more tickets than you would believe.</p>
${K.when([
  ["Client–server", "There are more than a handful of users, data must be backed up, or access must be controlled", "One central place to secure, back up and manage", "It's two people swapping one file once"],
  ["Peer-to-peer", "A tiny office or a one-off share between two devices", "Nothing to buy or maintain", "Data matters, users change often, or you need to know who opened what"],
], "Client–server or peer-to-peer?")}
<p>There is a second model, <b>peer-to-peer</b>, where devices share directly with each other without a central server — like AirDrop between two phones, or a small office where everyone shares folders from their own PC. It is simple but gets messy fast: no central backups, no central control of who can see what. That is why businesses move to client–server as they grow.</p>
${K.check({q:"You share a folder from your own laptop so a colleague can copy a file from it. In that moment, what is your laptop?", o:["A client — laptops are always clients","A server — it is answering your colleague's requests","A router","Neither; laptops can't share files"], a:1, why:"Client and server are roles. Your laptop is answering requests for the shared folder, so it is acting as a server, even though it's a laptop."})}

<h2>Every device has two addresses</h2>
<p>For data to reach a device, the device needs an address. In fact every device on a modern network has <b>two</b>, and they do different jobs. Understanding why is one of the most important ideas in networking.</p>
<h3>The MAC address — who you are on the local network</h3>
<p>A ${K.g("MAC address","Media Access Control address: a 48-bit hardware address, written as 12 hex digits such as 3C-52-82-1A-7F-09. Assigned to the network card by the manufacturer; used to deliver data within one local network.")} is a hardware address built into every network interface — every Wi-Fi card, every Ethernet port — by the manufacturer. It looks like <code>3C-52-82-1A-7F-09</code>: twelve ${K.g("hexadecimal","Base-16 numbering: digits 0–9 then A–F (A=10 … F=15). Two hex digits = one byte. Covered fully in the binary & hex lesson.")} digits. The first half identifies the manufacturer; the second half is unique to that card.</p>
<p>MAC addresses are used for delivery <b>within one local network</b> — from your laptop to the switch to the printer in the same office. They do not travel across the internet.</p>
<h3>The IP address — where you are, end to end</h3>
<p>An ${K.g("IP address","Internet Protocol address: a logical address such as 192.168.1.25 (IPv4) given to a device by configuration or by DHCP. Used to deliver data across networks, end to end.")} is a logical address, like <code>192.168.1.25</code>. It is not burned in: the network gives it to you (usually automatically) based on <i>where</i> you are connected. Take your laptop from the office to your house and its IP address changes; its MAC address does not.</p>
<p>IP addresses are what routers use to move data <b>between networks</b>, from your office all the way to a server in another country.</p>
${K.analogy(`<p>Your <b>MAC address</b> is like your full name: it identifies <i>you</i>, and it stays the same wherever you go. Your <b>IP address</b> is like your current delivery address: it tells the courier <i>where</i> to bring the parcel, and it changes when you move. A courier crossing the country navigates by the address; the person at the door checks the name.</p>`)}
<p>Here is what this looks like on a real Windows laptop. Open Command Prompt and type <code>ipconfig /all</code>. You will see something like this (trimmed):</p>
${K.out(`Wireless LAN adapter Wi-Fi:

   Description . . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz
   Physical Address. . . . . . . . . : 3C-52-82-1A-7F-09
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.1.25(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.1`, "ipconfig /all on Windows. On a Mac or Linux the equivalent is ifconfig or ip address.")}
<p>Every line here is something you will master in this course. For today, find these four:</p>
<ul>
<li><b>Physical Address</b> — the MAC address of the Wi-Fi card.</li>
<li><b>IPv4 Address</b> — the IP address the network gave this laptop.</li>
<li><b>Default Gateway</b> — the router: the door out of this local network. Anything not local gets sent here.</li>
<li><b>DNS Servers</b> — who this laptop asks to turn names into IP addresses.</li>
</ul>
${K.tip(`On a support call, "Can you open Command Prompt and read me what it says next to IPv4 Address and Default Gateway?" is one of the most useful sentences you'll ever say. An address starting <code>169.254.</code> means the laptop never got an address from DHCP — a very different problem from "the internet is down".`)}
${K.myth([
  ["Wi-Fi and the internet are the same thing.", "Wi-Fi is only the wireless link from your device to the access point inside the building. You can have perfect Wi-Fi and no internet (the ISP link is down), or internet with no Wi-Fi (on a cable)."],
  ["Full Wi-Fi bars means the internet is fast.", "Bars show signal strength to the nearest access point — nothing about the internet link behind it, which may be slow or congested."],
  ["An IP address permanently identifies a person or a device.", "IP addresses are handed out by the network you join and change when you move; many devices also share one public address through "+K.g("NAT","Network Address Translation: the router swaps the private addresses used inside your network for its own public internet address on the way out, and back again for the replies. You'll configure it in a later module.")+"."],
  ["Restarting the router fixes most network problems.", "It sometimes hides a symptom, and it always disconnects everyone. Find out who is affected and where the path breaks first."],
])}
${K.check({q:"A user's laptop works at the office. At home it has a different IP address. What has stayed the same?", o:["The IP address","The default gateway","The MAC address","The DNS server"], a:2, why:"The MAC address is built into the network card and travels with the device. The IP address, gateway and DNS server all come from whichever network you are connected to."})}
${K.q({type:"match", q:"Match each line of ipconfig /all output with what it tells you.", pairs:[["Physical Address","The MAC address of the network card"],["IPv4 Address","The logical address this network gave the laptop"],["Default Gateway","The router used to reach anything that is not local"],["DNS Servers","Who the laptop asks to turn names into IP addresses"]], why:"These four lines are the first things to read on any support call. Physical Address is the burned-in MAC; the IPv4 address, gateway and DNS servers all come from the network the laptop is joined to, usually via DHCP."})}

<h2>Sizes of network: LAN, WAN and the internet</h2>
<p>Networks are described by how much ground they cover and who owns the links.</p>
<div class="tablewrap"><table>
<tr><th>Type</th><th>What it covers</th><th>Who owns the links</th><th>Real example</th></tr>
<tr><td><b>LAN</b> — Local Area Network</td><td>One building, floor or home</td><td>You do</td><td>The accounting firm's office; your home Wi-Fi</td></tr>
<tr><td><b>WLAN</b> — Wireless LAN</td><td>The wireless part of a LAN</td><td>You do</td><td>The office Wi-Fi network "Firm-Staff"</td></tr>
<tr><td><b>Campus</b></td><td>Several buildings close together</td><td>You do</td><td>A university, a hospital, a factory site</td></tr>
<tr><td><b>WAN</b> — Wide Area Network</td><td>Cities, countries</td><td>Usually rented from a provider</td><td>A bank joining 200 branches to its head office</td></tr>
<tr><td><b>The internet</b></td><td>The planet</td><td>Thousands of providers, together</td><td>Everything public</td></tr>
</table></div>
<p>The important split is <b>LAN vs WAN</b>. Inside a LAN, links are cheap and fast and you control them: you can run a new cable tomorrow. A WAN link between Lagos and Abuja is rented from a provider, costs money every month, is slower, and when it fails you are on the phone to the provider with a ticket number. That difference shapes how networks are designed, and it is why you will learn both.</p>
${K.case("A bank with 200 branches",`<p>A Nigerian bank has a head office and data centre in Lagos and 200 branches across the country. Each branch has its own small LAN: teller PCs, an ATM, a printer, ${K.g("CCTV","Closed-circuit television: security cameras that send their video to a recorder on site instead of broadcasting it. Modern ones are IP cameras plugged into the network.")}, joined by a switch. Each branch router connects back to the data centre over a WAN — circuits rented from providers such as MainOne or MTN, often with a second link from a different provider in case the first one fails.</p>
<p>When a teller in Kano posts a deposit, the data crosses the branch LAN, travels the WAN to Lagos, reaches the core banking server, and the answer comes back — in under a second. If the branch's main WAN link drops, the router switches to the backup link, and tellers might notice only a short pause. Designing, monitoring and fixing exactly this is the day job of thousands of network engineers.</p>`)}
${K.check({q:"The bank's link between the Kano branch and the Lagos data centre is best described as…", o:["A LAN","A WLAN","A WAN","A campus network"], a:2, why:"It spans cities and is rented from a provider — a Wide Area Network link. Each branch's own office network is a LAN."})}

<h2>What happens when you open a website</h2>
<p>This is the most famous question in networking interviews, and for good reason: answering it well shows you understand how everything fits together. You won't know every detail yet — that is what the rest of the course is for. But you should know the <i>shape</i> of the journey from day one, because it is your map.</p>
<p>You are in the office, on Wi-Fi, and you type <code>portal.company.com</code> into your browser.</p>
${K.steps([
  ["Your laptop already has an address (DHCP)", `<p>When you joined the Wi-Fi, your laptop asked "can someone give me an IP address?" A DHCP server (here, the router) answered: "use <code>192.168.1.25</code>, your gateway is <code>192.168.1.1</code>, ask <code>192.168.1.1</code> for DNS." Without this, nothing else works.</p>`],
  ["The name becomes a number (DNS)", `<p>Computers route by IP address, not by name. So your laptop asks its DNS server: "what is the IP address of <code>portal.company.com</code>?" The answer comes back — say <code>41.203.10.50</code>.</p>`],
  ["Local or not? (subnet mask)", `<p>Your laptop compares <code>41.203.10.50</code> with its own address and subnet mask. It is not on the local network, so the data must go to the <b>default gateway</b> — the router.</p>`],
  ["Find the router's MAC address (ARP)", `<p>To hand something to the router across the local network, your laptop needs the router's <i>MAC</i> address. It shouts a question to the whole LAN: "who has <code>192.168.1.1</code>?" The router replies with its MAC. This is called ${K.g("ARP","Address Resolution Protocol: the local-network question \"who has this IP address? Tell me your MAC address.\" It never leaves the LAN.")}.</p>`],
  ["Across the LAN (switching)", `<p>Your laptop wraps the data with the router's MAC address and sends it. The access point and switch read that MAC address and pass the data to the port where the router is. Switches deliver by MAC address.</p>`],
  ["Out of the office (routing and NAT)", `<p>The router looks at the destination IP address, sees it must go towards the ISP, swaps your private address for the office's public address (NAT), and sends it on. Routers across the internet pass it from network to network, each one choosing the next hop, until it reaches the server's network.</p>`],
  ["A conversation is set up (TCP and TLS)", `<p>Before any web page moves, your laptop and the server agree to talk reliably — the ${K.g("TCP","Transmission Control Protocol: the rules that make delivery reliable. It numbers the data, confirms what arrived and resends anything lost. Lesson 7 covers it in detail.")} three-way handshake — and then set up ${K.g("TLS encryption","Transport Layer Security: the encryption that keeps web traffic private and proves you reached the real site. It is what the padlock in your browser means.")} (the padlock in your browser).</p>`],
  ["The page is requested and sent (HTTP)", `<p>Your browser sends an ${K.g("HTTP","Hypertext Transfer Protocol: the language browsers and web servers use to ask for and send web pages.")} request — "GET me the page" (over TLS it is called ${K.g("HTTPS (HTTP Secure)","HTTP Secure: ordinary HTTP carried inside a TLS-encrypted connection. Any web address starting https:// uses it.")}); the server sends the page back, broken into many packets. Every reply travels the whole journey in reverse. Your browser reassembles the packets and draws the page. All of this usually takes less than a second.</p>`],
])}
${K.svg("0 0 720 210",
  K.dev("laptop",50,70,"You","192.168.1.25")+K.dev("switch",175,70,"Switch / AP","by MAC")+K.dev("router",310,70,"Router","192.168.1.1")+
  K.dev("cloud",450,70,"Internet","many routers")+K.dev("server",620,70,"portal server","41.203.10.50")+
  K.arrow(78,62,148,62,"",true)+K.arrow(202,62,282,62,"",true)+K.arrow(338,62,420,62,"",true)+K.arrow(482,62,598,62,"",true)+
  K.box(15,150,130,44,"DHCP + DNS","get address, find IP")+K.box(155,150,130,44,"ARP + switching","local delivery")+K.box(295,150,130,44,"Routing + NAT","between networks")+K.box(435,150,130,44,"TCP + TLS","reliable, private")+K.box(575,150,130,44,"HTTP","the actual page",true),
  "The journey of one web request. Each box underneath is a topic you will master in this course.")}
<p>Look at the row of boxes in that diagram. That row is the table of contents of networking: addressing (DHCP, DNS), local delivery (MAC addresses, switches, ARP), moving between networks (IP, routing, NAT), reliable conversations (TCP), and the applications on top (HTTP). When something breaks, it breaks at one of those boxes — and your job will be to find which.</p>
${K.remember(`<p>The order of the journey: <b>D</b>on't <b>D</b>rop <b>A</b>ny <b>S</b>andwiches, <b>R</b>un <b>T</b>o <b>H</b>ome — <b>D</b>HCP, <b>D</b>NS, <b>A</b>RP, <b>S</b>witch, <b>R</b>outer, <b>T</b>CP (and TLS), <b>H</b>TTP.</p>`)}
${K.exam(`CCNA questions call PCs, laptops, phones, printers and servers <b>end devices</b> or <b>hosts</b>. Switches and routers are <b>network devices</b> (intermediary devices), not hosts — even though they also have IP addresses for management.`)}
${K.check({q:"A user can open <code>https://41.203.10.50</code> (typing the IP address directly) but not <code>portal.company.com</code>. Which step is most likely failing?", o:["DHCP — getting an address","DNS — turning the name into an IP address","The switch","The web server itself"], a:1, why:"If the IP address works, the path to the server and the server itself are fine. Only turning the name into a number is broken — that's DNS."})}

<h2>Thinking like a network technician</h2>
<p>Now you can see why those three phone calls at the start were really one problem. "The internet is down", "my email isn't working" and "I can open Google but not the HR portal" — if <i>many</i> people on <i>one</i> floor have <i>different</i> symptoms at the same time, the cause is something they share: a switch, the Wi-Fi, a DNS server, the internet link.</p>
<p>Good technicians narrow the problem with a few fast questions before touching anything:</p>
<ol>
<li><b>Who is affected?</b> One person, one floor, or everyone? One person → their device or their cable. Everyone → something shared.</li>
<li><b>What is affected?</b> One website, all websites, or internal systems too?</li>
<li><b>Since when — and what changed?</b> "It worked this morning" plus "we moved desks at lunch" solves a lot of tickets.</li>
<li><b>Walk the path.</b> Does the device have an address? Can it reach the gateway? Can it reach the internet by IP? By name?</li>
</ol>
${K.job("“The internet is down” — a real first-line call",`
<p><b>The call.</b> Chiamaka in Finance: "The internet is down on my computer. It's urgent, I need to submit the tax remittance before 3pm."</p>
<p><b>Your first questions.</b> "Is anyone near you having the same problem?" — <i>"No, Tunde next to me is fine."</i> One person affected, so the internet link, router and DNS are probably fine. Focus on her machine and its connection.</p>
<p><b>Check the address.</b> You ask her to open Command Prompt and run <code>ipconfig</code>. She reads out: <i>IPv4 Address 169.254.37.112, Default Gateway blank.</i> That <code>169.254</code> address means her PC never got an address from DHCP — it gave itself one (an ${K.g("APIPA","Automatic Private IP Addressing: when Windows gets no answer from a DHCP server, it gives itself a 169.254.x.x address. That address can't reach the gateway or the internet — a sure sign DHCP failed.")} address), and it can't reach anything.</p>
<p><b>Why would DHCP fail for one desk?</b> Most often: the cable. You ask her to look under the desk. <i>"Oh — the cleaner moved the bin, the blue cable is half out."</i> She pushes it in until it clicks. Ten seconds later, <code>ipconfig</code> shows <code>192.168.1.41</code>, gateway <code>192.168.1.1</code>. She's online.</p>
<p><b>What you say.</b> "You're back on. It was the network cable — it had been knocked loose. If it happens again, check that blue cable clicks in first." <b>What you write in the ticket:</b> <i>"User had APIPA address (169.254.x.x) — no DHCP lease. Cause: patch cable partially unplugged at desk. Reseated, user received 192.168.1.41, internet confirmed. Resolved, 6 min."</i></p>
<p>Notice what you did <i>not</i> do: restart the router, call the ISP, or panic about "the internet". The picture in your head told you where to look.</p>`)}
${K.dodont([
  "Ask who else is affected before you touch anything shared.",
  "Get the user to read you real values (<code>ipconfig</code>) instead of guessing.",
  "Explain the fix in one plain sentence the user can repeat.",
  "Write symptom, cause, fix and proof in the ticket.",
],[
  "Restart shared equipment to fix one person's problem.",
  "Blame \"the internet\" or the ISP before you've walked the path.",
  "Use jargon with the user (\"your DHCP lease failed\") without explaining it.",
  "Close a ticket without confirming with the user that it works.",
])}
<h3>Exercise: read a broken laptop's settings</h3>
<p>A user on the same office network says "nothing loads". They read you this:</p>
${K.out(`IPv4 Address. . . . . . . . . . . : 192.168.1.37
Subnet Mask . . . . . . . . . . . : 255.255.255.0
Default Gateway . . . . . . . . . : 192.168.1.1
DNS Servers . . . . . . . . . . . : 10.0.0.53`)}
<p>Their colleague, whose laptop works, has DNS server <code>192.168.1.1</code>. What do you suspect, and what would you test next?</p>
${K.hint("The address, mask and gateway all look normal for this office. Which line is different from the working laptop — and what does that server do?")}
${K.reveal("Show the answer", `<p>The DNS server is wrong. <code>10.0.0.53</code> is not this office's DNS server (probably left over from another network or set by hand). The laptop has an address and a gateway, so it can probably reach the internet <i>by IP</i> but cannot turn names into IP addresses — so "nothing loads".</p><p><b>Test:</b> <code>ping 192.168.1.1</code> (gateway — should work), <code>ping 8.8.8.8</code> (internet by IP — should work), <code>nslookup google.com</code> (should fail or time out). <b>Fix:</b> set DNS back to automatic (DHCP) on the adapter, then <code>ipconfig /flushdns</code>.</p>`)}
${K.mistake(`Restarting the shared router or "the internet box" because one user reported a problem. You disconnect everyone else in the office to fix something that was only ever on one desk. Always ask who else is affected first.`)}
${K.mistake(`Writing "fixed" in the ticket. The next technician — or you, in three months — learns nothing. Write the symptom, the cause, the fix, and how you proved it was fixed.`)}
${K.q({type:"order", q:"One user says nothing loads. You have already confirmed that only they are affected. Put these checks in the order you would walk the path.", items:["Check the PC has a valid IP address and gateway with ipconfig","Ping the default gateway","Ping an internet address by IP, such as 8.8.8.8","Test name resolution with nslookup"], why:"Walk the path from the user outwards: no address means nothing else can work; the gateway proves the LAN; an internet IP proves routing beyond the office; a name lookup proves DNS. The first test that fails tells you which box in the journey is broken."})}

<h2>Your first look at a real network device</h2>
<p>Enough reading — time to touch a device. Below is a simulated Cisco router, the same kind of command line you would see when you plug a laptop into a real router's console port. You will learn all of this properly in the last lesson of this module. For now, follow the tasks; type each command and press <b>Enter</b>.</p>
${K.term({env:"ios", title:"look inside an office router", opts:{host:"OFFICE-RTR", kind:"router",
  intfs:{"GigabitEthernet0/0":{ip:"192.168.1.1",mask:"255.255.255.0",shut:false,vlan:1,mode:"access",allowed:null,desc:"LAN"},
         "GigabitEthernet0/1":{ip:"102.89.4.18",mask:"255.255.255.252",shut:false,vlan:1,mode:"access",allowed:null,desc:"ISP"},
         "GigabitEthernet0/2":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null}},
  motd:"OFFICE-RTR — console session. You are at user EXEC (the > prompt)."},
  intro:"The prompt ending in <code>&gt;</code> means you can look but not change much. <code>enable</code> moves you to privileged mode (<code>#</code>).",
  tasks:[
    {text:"Type <code>enable</code> to get to privileged mode — the prompt changes from <code>&gt;</code> to <code>#</code>", done:e=>e.mode!=="user" || e.history.some(h=>/^\s*en/i.test(h))},
    {text:"Type <code>show ip interface brief</code> — find the LAN interface (192.168.1.1, the default gateway) and the ISP interface", done:e=>e.history.some(h=>/^\s*sh(ow)?\s+ip\s+int/i.test(h))},
    {text:"Type <code>ping 8.8.8.8</code> — test reaching a server on the internet (Google's DNS server)", done:e=>!!(e.pinged&&e.pinged["8.8.8.8"])},
  ],
  win:"You just logged into a router, read its interfaces and tested the internet path — the same first three moves engineers make on a real device.",
  solve:["enable","show ip interface brief","ping 8.8.8.8"]})}
<p>Look at the output of <code>show ip interface brief</code>. <code>GigabitEthernet0/0</code> has <code>192.168.1.1</code> — the exact address the laptop listed as its default gateway. That is the router's "inside" door. <code>GigabitEthernet0/1</code> faces the ISP. <code>GigabitEthernet0/2</code> is unused and "administratively down" — switched off on purpose. You just read the router's side of the office diagram from earlier.</p>

<h3>Now build one: a tiny office network</h3>
<p>Reading a diagram is one thing; building the network is another. Below is a workbench with a switch, two PCs and a file server, the same pieces as the office at the top of this lesson. Take a patch cable from the tray, click a PC's network port, then click any numbered port on the switch. Watch the small light above each port: <b>green</b> means the link is up. Then give each PC an address and prove they can talk.</p>
${K.bench({id:"m1-office-lan", points:60, from:"CCNA · Module 1 · lesson 1", title:"build a tiny office LAN", viewBox:"0 0 760 330",
  intro:"Tray → <b>Cat6 straight</b> → click a PC's <b>NIC</b> port → click a switch port. Use <b>IP settings</b> under each PC, then <b>Command Prompt</b> to test.",
  devices:[
    {id:"sw1", kind:"switch", label:"OFFICE-SW1", model:"Catalyst 9200 · 8× RJ45 + 2× SFP", x:180, y:30},
    {id:"pc1", kind:"pc", label:"PC1", x:60, y:210},
    {id:"pc2", kind:"pc", label:"PC2", x:250, y:210},
    {id:"srv1", kind:"server", label:"FILESRV", x:560, y:210, ip:"192.168.1.50", mask:"255.255.255.0", gw:"192.168.1.1"},
  ],
  tray:["cat6"],
  tasks:[
    {text:"Patch <b>PC1</b> into the switch — its port light turns green", done:B=>Bench.upAt(B,"pc1:eth")},
    {text:"Patch <b>PC2</b> and the <b>file server</b> into the switch", done:B=>Bench.upAt(B,"pc2:eth") && Bench.upAt(B,"srv1:eth")},
    {text:"Give PC1 the address <code>192.168.1.10</code>, mask <code>255.255.255.0</code>", done:B=>B.devs.pc1.ip==="192.168.1.10" && B.devs.pc1.mask==="255.255.255.0"},
    {text:"Give PC2 the address <code>192.168.1.11</code>, mask <code>255.255.255.0</code>", done:B=>B.devs.pc2.ip==="192.168.1.11" && B.devs.pc2.mask==="255.255.255.0"},
    {text:"From PC1's Command Prompt, run <code>ipconfig</code>, then <code>ping 192.168.1.50</code> (the file server) and get replies", done:B=>Bench.pinged(B,"pc1","192.168.1.50")},
    {text:"From PC2, <code>ping 192.168.1.10</code> (PC1) and get replies", done:B=>Bench.pinged(B,"pc2","192.168.1.10")},
  ],
  win:"You cabled a LAN, addressed two hosts by hand and proved end-to-end connectivity — the switch delivered every frame by MAC address without any configuration at all.",
  solve:[["plug","cat6","pc1:eth","sw1:g1"],["plug","cat6","pc2:eth","sw1:g2"],["plug","cat6","srv1:eth","sw1:g3"],["ip","pc1","192.168.1.10","255.255.255.0",""],["ip","pc2","192.168.1.11","255.255.255.0",""],["pc","pc1","ping 192.168.1.50"],["pc","pc2","ping 192.168.1.10"]]})}
${K.hint("If a ping says <i>Destination host unreachable</i>, the PC can't find that address on its local network: check both cables are green and both addresses start <code>192.168.1.</code>. If it says <i>General failure</i>, that PC has no working link or no IP address yet.")}
<p>Try breaking it on purpose, too: click PC2's cable and <b>Unplug</b> it, then ping PC2 again from PC1. Run <code>ipconfig</code> on PC2 and you'll see <i>Media disconnected</i>, exactly what a real Windows PC reports when its cable is out. Breaking things deliberately and reading the symptoms is one of the fastest ways to get good at fixing them.</p>

<h2>Interview corner</h2>
${K.reveal("“What happens when you type a website address into a browser?”",`<p><b>A strong entry-level answer, in order:</b> "First the device needs an IP address, usually from DHCP. The browser asks DNS to resolve the name to an IP address. The device checks whether that IP is on its local subnet; it isn't, so it sends the traffic to its default gateway, using ARP to learn the gateway's MAC address. The switch forwards the frame to the router by MAC address. The router routes the packet towards the destination — usually translating the private address with NAT — and routers across the internet forward it hop by hop. The client and server set up a TCP connection with a three-way handshake, then TLS for HTTPS, and then the browser sends an HTTP GET and the server returns the page."</p><p>Mentioning DHCP → DNS → ARP/gateway → routing/NAT → TCP → TLS → HTTP in order puts you ahead of most candidates for a support or junior network role.</p>`)}
${K.reveal("“What's the difference between a client and a server?”",`<p>"A client requests a service and a server provides it. It's a role defined by software, not hardware — a laptop sharing a folder is acting as a file server. In practice, dedicated servers are built for reliability, with redundant power supplies and disks and remote management."</p>`)}
${K.reveal("“What's the difference between a MAC address and an IP address?”",`<p>"A MAC address is a 48-bit hardware address on the network interface, used to deliver frames within the local network; it doesn't change when you move. An IP address is a logical address assigned by the network, used to route packets end-to-end between networks; it changes depending on where you connect."</p>`)}

${K.recap([
  "A network is two or more devices connected to share data; the internet is a network of networks.",
  "Hosts are the devices that send and receive; switches join devices inside a LAN; routers join networks together.",
  "Client and server are roles: the client asks, the server answers.",
  "MAC address = hardware identity, used for local delivery. IP address = logical location, used to route end to end.",
  "LAN = your building, links you own. WAN = between sites, links you rent.",
  "Opening a website: DHCP → DNS → local or not? → ARP for the gateway → switch → router/NAT → internet → TCP → TLS → HTTP.",
  "Troubleshoot by asking who, what, since when — then walk the path.",
])}
${K.next(`<b>Lesson 2 — The devices.</b> You've seen switches, routers, firewalls and access points as icons. Next you'll learn exactly what each one does with your data, how to recognise them in a comms room, and how to explain the difference to a user.`)}
`,
quiz:[
  {lvl:1, q:"Which statement best defines a network?", o:["A group of computers that all run the same operating system","Two or more devices connected so they can exchange data","Any device with internet access","A set of servers in a data centre"], a:1, why:"Two connected devices that can exchange data already make a network."},
  {lvl:1, q:"A device that forwards traffic between different networks (for example, the office and the internet) is a…", o:["Switch","Router","Access point","Hub"], a:1, why:"Routers connect networks together; switches connect devices within one network."},
  {lvl:1, q:"Your laptop shares a folder that a colleague opens. Which statement is TRUE?", o:["Your laptop is acting as a server","Only machines in a data centre can be servers","Your laptop is acting as a router","The colleague's PC is the server"], a:0, why:"Server is a role: whichever device answers the request is acting as the server."},
  {lvl:1, q:"Which address is burned into the network card and is used to deliver data inside the local network?", o:["IP address","MAC address","Default gateway","DNS address"], a:1, why:"The MAC address is the hardware address used for local delivery."},
  {lvl:1, q:"Which of these is a valid MAC address format?", o:["192.168.1.25","3C-52-82-1A-7F-09","255.255.255.0","fe80::1"], a:1, why:"MAC addresses are 12 hex digits (48 bits). 192.168.1.25 is an IPv4 address, 255.255.255.0 a subnet mask, fe80::1 an IPv6 address."},
  {lvl:1, q:"In ipconfig output, the 'Default Gateway' is…", o:["The DNS server","The switch","The router your device sends traffic to when the destination isn't local","The ISP's web server"], a:2, why:"The default gateway is the router — the door out of the local network."},
  {lvl:1, q:"A link between a company's Lagos head office and its Abuja branch, rented from a provider, is a…", o:["LAN","WLAN","WAN","Campus link"], a:2, why:"Links between distant sites rented from a provider are WAN links."},
  {lvl:2, q:"A user can reach a site by typing its IP address but not by its name. Which service is most likely failing?", o:["DHCP","DNS","ARP","The switch"], a:1, why:"DNS converts names to IP addresses. If the IP works, the path is fine and only name resolution is broken."},
  {lvl:1, q:"Before your laptop can send data to the default gateway on the LAN, which protocol does it use to learn the gateway's MAC address?", o:["DNS","DHCP","ARP","HTTP"], a:2, why:"ARP (Address Resolution Protocol) maps a known IP address to a MAC address on the local network."},
  {lvl:1, q:"One user reports 'no internet'; their colleagues at the next desk are fine. What should you suspect first?", o:["The ISP link","The office router","The user's own device or cable","The DNS server for the whole company"], a:2, why:"When only one person is affected, the cause is almost always local to that person: their cable, Wi-Fi or device settings."},
  {lvl:1, type:"multi", q:"Which two statements about a MAC address are true? (Choose two.)", o:["It is 48 bits long, written as 12 hexadecimal digits","It is used to deliver data within the local network","It is handed out by the DHCP server when the device joins","It changes when a laptop moves from the office network to a home network","Routers on the internet use it to find the destination server"], a:[0,1], why:"A MAC address is a 48-bit hardware address set by the manufacturer and used for delivery inside one local network. DHCP hands out IP addresses, not MACs; the MAC travels with the card and stays the same on any network; and routers move packets across the internet using IP addresses, not MAC addresses."},
  {lvl:2, type:"order", q:"A laptop has just joined the office Wi-Fi and the user types portal.company.com into the browser. Put these steps in the order they happen.", items:["The laptop gets an IP address, gateway and DNS server from DHCP","The laptop asks DNS for the IP address of portal.company.com","The laptop uses ARP to learn the default gateway's MAC address","The router forwards the packet towards the ISP, translating the private address with NAT","The laptop and the server complete the TCP three-way handshake","The browser sends an HTTP GET request and the server returns the page"], why:"Nothing works without an address, so DHCP comes first. The name must become an IP (DNS) before the laptop can decide the server is not local and needs the gateway's MAC (ARP). Only after the packet can leave the LAN (routing and NAT) can a TCP connection be set up, and only over that connection does HTTP fetch the page."},
  {lvl:1, type:"match", q:"Match each type of network with its description.", pairs:[["LAN","One building, floor or home, with links you own"],["WLAN","The wireless part of a local network"],["Campus network","Several buildings close together, with links you own"],["WAN","Sites in different cities, joined by links usually rented from a provider"],["The internet","Thousands of providers' networks joined into a network of networks"]], why:"The key split is ownership and distance: inside a LAN, WLAN or campus you own the cabling and can change it tomorrow; WAN links between cities are rented from a provider; the internet is the global network of networks run by thousands of providers together."},
  {lvl:1, type:"fill", q:"On a Windows PC, which command shows the full adapter details, including the Physical Address (MAC), DHCP server and DNS servers?", a:["ipconfig /all","ipconfig/all","ipconfig -all"], why:"Plain ipconfig shows the IPv4 address, subnet mask and default gateway. Adding /all also shows the Physical Address (the MAC), whether DHCP is enabled, the DHCP server and the DNS servers. On macOS or Linux the equivalents are ifconfig or ip address."},
  {lvl:2, q:"A user in the Lekki office reports that nothing loads. Colleagues on the same floor are working normally. The user reads you this output. What is the most likely cause?", ex:"C:\\Users\\tunde> ipconfig\n\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   Autoconfiguration IPv4 Address. . : 169.254.37.112\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :", o:["The ISP link for the office is down","The PC did not receive an address from DHCP, often because of a loose cable or a DHCP problem","The DNS server has the wrong record for the website","The default gateway router has crashed for the whole office"], a:1, why:"A 169.254.x.x address (APIPA) with no default gateway means the PC gave itself an address because no DHCP server answered. Because only one user is affected, the shared ISP link, router and DNS are probably fine; check that PC's cable or Wi-Fi first, then the DHCP server."},
  {lvl:2, q:"Ngozi (192.168.10.25) has just printed to the office printer at 192.168.10.40 and opened the company website, which is hosted in another country. She then runs the command in the exhibit. Why is there no entry for the web server's address?", ex:"C:\\Users\\ngozi> arp -a\n\nInterface: 192.168.10.25 --- 0x7\n  Internet Address      Physical Address      Type\n  192.168.10.1          00-1e-49-6b-21-c0     dynamic\n  192.168.10.40         3c-52-82-1a-7f-09     dynamic\n  192.168.10.255        ff-ff-ff-ff-ff-ff     static\n  224.0.0.22            01-00-5e-00-00-16     static", o:["ARP only works inside the local network: frames for the remote web server are sent to the gateway's MAC, 00-1e-49-6b-21-c0, and the router carries them on","The web server's entry has already expired, because ARP entries last only one second","Web servers do not have MAC addresses, only IP addresses","DNS has replaced the ARP entry with the server's name"], a:0, why:"Her PC compared the web server's IP address with its own address and mask, saw that it was not local, and sent the frames to the default gateway instead. So the only ARP entry it needs for internet traffic is the gateway's (192.168.10.1). The printer is local, so it has its own entry. Remote servers do have MAC addresses, but they are only used on the server's own LAN."},
  {lvl:3, q:"Femi's PC was given a fixed address last week. Today he can print to 192.168.10.40 and open a colleague's shared folder, but no websites or email work, and ping 8.8.8.8 fails. Everyone else in the office is fine. Based on the exhibit, what is the fault, and what is the safest way to fix it?", ex:"C:\\Users\\femi> ipconfig\n\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 192.168.10.57\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1", o:["The default gateway is on a different network from the PC (192.168.1.x instead of 192.168.10.x). Set it to the office router's LAN address, checked against a working colleague's ipconfig","The DNS server has failed, so change the PC's DNS server to 8.8.8.8","The cable is faulty, so replace the patch lead","The PC's MAC address is a duplicate, so replace the network card"], a:0, why:"Local printing and file sharing work, so the cable, the switch and his address are fine. Everything off the LAN fails, even a ping to an IP address, so DNS is not the problem. The gateway 192.168.1.1 is not on his 192.168.10.0 network, so the PC has no usable door out. Copy the gateway from a working PC on the same network (here most likely 192.168.10.1) rather than guessing, and note the change in the ticket."},
  {lvl:3, type:"multi", q:"At 09:05, after an overnight power cut, the whole Abuja branch reports 'no internet'. The internal file server and the printers still work. Which two checks should you make first? (Choose two.)", o:["From a branch PC, ping the default gateway and then a public IP address such as 8.8.8.8, to see where the path stops","Check the router's ISP-facing link and the ISP's modem or optical network terminal (ONT) — the fibre box — including whether it is on the uninterruptible power supply (UPS) and has powered back up","Check the cable and network card on the first caller's PC, because most faults affect one user","Restart the internal file server","Clear the DNS cache on every PC in the branch"], a:[0,1], why:"Everyone is affected but local services work, so the fault is at the shared door out: the router, its ISP link or the ISP's equipment. Pinging the gateway and then a public IP tells you whether the router answers and whether traffic gets beyond it. After a power cut, an ISP box that is not on the UPS, or did not restart, is a very common cause. One user's cable can't explain a whole-branch outage, the file server is working, and clearing DNS caches won't help when a ping by IP also fails."},
  {lvl:2, type:"order", q:"A PC sends data to the printer on its own LAN for the first time since it booted. Put the steps in order.", items:["The PC compares the printer's IP address with its own address and subnet mask and decides the printer is local","The PC broadcasts an ARP request: who has the printer's IP address?","The printer replies with its MAC address","The PC builds a frame addressed to the printer's MAC address and sends it to the switch","The switch looks up that MAC address and sends the frame out of the printer's port only"], why:"Local or remote comes first, because it decides whose MAC address the PC needs. For a local destination it ARPs for the destination itself (for a remote one it would ARP for the gateway). Only once it knows the MAC can it build the frame, and the switch then delivers it by MAC."},
  {lvl:2, type:"match", q:"Who is affected tells you where to look. Match each report with the most likely place for the fault.", pairs:[["One user is down; colleagues at the next desk are fine","That user's device, cable or settings"],["Everyone on floor 3 is down; other floors are fine","Floor 3's switch or its uplink"],["The whole office has no internet, but internal servers work","The router or the ISP link"],["Everyone can browse, except one website that fails for all","That website's servers or its provider"]], why:"Find what the affected people share that nobody else does. One person shares only their own kit; one floor shares a switch and its uplink; the whole office shares the router and the ISP link; a single site failing for everyone points away from your network altogether."},
  {lvl:3, q:"An 8-person Lagos office keeps its shared files in a folder on the managing director's laptop. When she travels, nobody can open the files. Which change fixes this best?", o:["Move the shared files to an always-on network-attached storage box or a cloud file service, so the server role no longer depends on one person's laptop","Connect the laptop by cable instead of Wi-Fi","Give the laptop a fixed IP address","Add a second router so the laptop can still be reached from home"], a:0, why:"Server is a role: her laptop is acting as the file server, so when it leaves, the server leaves. A cable or a fixed IP only helps while the laptop is in the office. A small network-attached storage box on a UPS, or a cloud file service, is always available, can be backed up and does not depend on one person's diary. That is the practical trade-off between peer-to-peer sharing and client-server."},
],
cards:[
  {f:"What is a network?", b:"Two or more devices connected so they can exchange data. The internet is a network of networks."},
  {f:"Host vs node", b:"Host: a device that sends or receives data and has an address (PC, phone, server). Node: any connection point, including switches and routers."},
  {f:"Client vs server", b:"Roles, not hardware. The client requests a service; the server provides it."},
  {f:"MAC address", b:"48-bit hardware address (12 hex digits, e.g. 3C-52-82-1A-7F-09), set by the manufacturer, used for delivery inside the local network."},
  {f:"IP address", b:"Logical address (e.g. 192.168.1.25) given by the network, used to route data end to end between networks. Changes when you move."},
  {f:"Default gateway", b:"The router a device sends traffic to when the destination is not on its local network."},
  {f:"LAN vs WAN", b:"LAN: one building/site, links you own, fast and cheap. WAN: between sites/cities, links usually rented from a provider."},
  {f:"169.254.x.x address on a PC means…", b:"APIPA: the PC did not get an address from DHCP and assigned itself one. Check the cable/Wi-Fi and the DHCP server."},
  {f:"Web request in order", b:"DHCP → DNS → local or remote? → ARP for gateway → switch → router/NAT → internet routing → TCP handshake → TLS → HTTP GET/response."},
  {f:"First three troubleshooting questions", b:"Who is affected? What is affected? Since when — and what changed?"},
],
});
// ---------- Lesson 2 ----------
L.push({
id:"net-devices", mins:55, level:"Beginner · builds on lesson 1",
t:"The devices: switches, routers, firewalls, access points — what each one does with your data",
html:`
${K.goals([
  "Tell an endpoint from a network device, and name the job of every box your data passes through.",
  "Explain why hubs disappeared and what a switch does differently.",
  "Say what a router, a multilayer switch, a firewall, an access point and a wireless controller each do — and at which layer.",
  "Recognise each device in a comms room by its ports, LEDs and labels.",
  "Log in to a Cisco switch and read <code>show version</code>, <code>show ip interface brief</code> and <code>show mac address-table</code>.",
])}
${K.pre(["Lesson 1 — MAC vs IP addresses, LAN vs WAN, and what the default gateway is."])}

<h2>Why this matters at work</h2>
<p>Your first week at an IT support company in Victoria Island. A senior engineer messages: <i>"Go to the fourth-floor comms room and tell me if the firewall has any amber lights."</i> You open the cabinet: a stack of black boxes, blinking, humming, hundreds of cables. Nothing says "FIREWALL".</p>
<p>Users won't help: to them every box is "the router". Your value is knowing what each device does with data, because that tells you where a problem can live. "Only the second floor" points at one switch. "Wi-Fi only" points at the access points. "Websites fail, internal systems work" points at the router, firewall or ISP. This lesson gives you that map.</p>

<h2>Endpoints and the boxes in between</h2>
<p>Every device on a network is one of two kinds.</p>
<p>${K.g("Endpoints","Devices where data starts or ends: PCs, phones, servers, printers, cameras. Also called end devices or hosts.")} are where data <b>starts and ends</b>: a laptop sends an email, a printer receives a job. These are the hosts from lesson 1.</p>
<p>${K.g("Network devices","Devices that move data between endpoints: switches, routers, firewalls, access points. Cisco calls them intermediary devices.")} sit <b>in between</b> and move data towards its destination. Users never use them directly — they only notice them when they fail.</p>
${K.analogy(`<p>Think of the postal service. Senders and recipients are the endpoints. Sorting offices, vans and the border post are the network devices: each handles the letter for a moment, makes <b>one decision</b> about where it goes next, and passes it on.</p>`)}
<p>Here is where each device sits in a typical company. The rest of the lesson walks through it piece by piece.</p>
${K.svg("0 0 740 370",
  K.dev("server",100,70,"Servers","file · DHCP · DNS")+
  K.dev("switch",250,70,"Core switch","Layer 3")+
  K.dev("router",400,70,"Router","Cisco ISR")+
  K.dev("firewall",540,70,"Firewall","")+
  K.dev("cloud",675,70,"Internet","via the ISP")+
  K.link(116,70,223,70)+K.link(277,70,375,70)+K.link(425,70,517,70)+K.link(563,70,649,70)+
  K.txt(470,30,"inside",{mid:true})+K.txt(612,30,"outside",{mid:true})+
  K.dev("server",540,195,"Web server","DMZ zone")+K.link(540,88,540,173,"DMZ")+
  K.dev("server",420,195,"WLC","Wi-Fi controller")+K.link(272,122,405,175)+
  K.dev("switch",130,190,"FLOOR2-SW","access")+K.dev("switch",290,190,"FLOOR3-SW","access")+
  K.link(235,122,145,178,"uplink")+K.link(258,122,286,178)+
  K.dev("pc",50,300,"PC","")+K.dev("printer",125,300,"Printer","")+K.dev("phone",195,300,"IP phone","")+
  K.link(112,244,58,280)+K.link(128,244,125,284)+K.link(145,244,192,281)+
  K.dev("ap",270,300,"Access point","PoE")+K.dev("laptop",355,300,"Laptop","Wi-Fi")+K.dev("camera",440,300,"IP camera","PoE")+
  K.link(282,244,272,290)+K.link(302,244,428,287)+
  `<path d="M292,296 q20,-12 38,-2" stroke="var(--accent)" fill="none" stroke-dasharray="3 3"/>`,
  "Endpoints at the bottom, an access switch per floor, a core switch joining the floors, then router and firewall at the edge. The DMZ, short for demilitarised zone, holds servers the public may reach.")}
<p>Read it from the bottom up, the way most traffic travels. Endpoints plug into an <b>access switch</b> on their floor, or reach it over Wi-Fi through an <b>access point</b>. Each floor switch has a fast <b>uplink</b> to a <b>core switch</b>. Traffic for the outside goes through the <b>router</b> and <b>firewall</b> to the ISP. (Some designs put the firewall first; small offices use one box for both.)</p>
<h3>Servers and the other endpoints</h3>
<p>Servers are endpoints too. In a company they provide DHCP (addresses), DNS (names), logins (usually Microsoft Active Directory), shared files and printing, and business applications. Most now run as ${K.g("virtual machines","Software servers: one physical machine runs many separate virtual servers, each with its own operating system.")}, and much — email especially — has moved to cloud services like Microsoft 365. To the network that only changes <i>where</i> the server is.</p>
<p>Modern networks carry far more than PCs:</p>
<ul>
<li><b>IP phones</b> — many have a built-in mini switch, so the PC plugs into the phone and one cable serves both.</li>
<li><b>IP cameras</b> — CCTV streaming video all day to a recorder (an ${K.g("NVR","Network Video Recorder: stores the video from IP cameras.")}).</li>
<li><b>Printers</b> — usually given a fixed IP address so every PC can always find them.</li>
<li><b>${K.g("IoT","Internet of Things: small connected devices — door readers, sensors, smart TVs, generator monitors.")}</b> devices — door access readers, meeting-room screens, the diesel generator's monitor.</li>
</ul>
<p>Phones, cameras and access points are often powered <b>through the network cable</b> by the switch. That feature, PoE, comes in the next section.</p>
${K.check({q:"Which of these is an <b>endpoint</b>?", o:["The core switch","An IP camera on the car park wall","The firewall","The floor-2 access switch"], a:1, why:"The camera is where data starts — it produces the video. Switches and firewalls only move data on."})}

<h2>Hubs and switches: from shouting to sorting</h2>
<h3>The hub: one big shouting room</h3>
<p>In the 1990s offices joined PCs with a <b>hub</b>. Whatever signal arrives on one port, a hub repeats out of <b>every other port</b>. It reads no addresses and understands nothing — a ${K.g("Layer 1","The physical layer: raw signals, cables and connectors. The layer model is lesson 5.")} device.</p>
<p>Everyone on a hub shares one channel. If two PCs send at once, the signals crash — a ${K.g("collision","Two devices sending on a shared medium at once; both signals are destroyed and must be re-sent.")}. Both stop, wait a random moment and retry, following a rule called ${K.g("CSMA/CD","Listen before sending; on a collision, stop, wait a random time, retry. Only needed on shared links.")}. The results:</p>
<ol>
<li><b>Shared bandwidth.</b> A 10 Mbps hub gave 10 Mbps to everyone <i>together</i>.</li>
<li><b>${K.g("Half duplex","Send or receive, not both at once — like a walkie-talkie. Full duplex is both at once, like a phone call.")} only.</b></li>
<li><b>No privacy.</b> Every PC received a copy of everyone's traffic.</li>
</ol>
${K.dyk(`The first Ethernet networks were literally one shared coaxial cable snaking past every desk. CSMA/CD was invented for that single wire. Modern full-duplex switch links never collide, so CSMA/CD simply isn't used on them.`)}
${K.svg("0 0 720 250",
  K.txt(180,22,"HUB — repeats every bit to every port",{mid:true,c:"fg",b:true})+
  K.txt(540,22,"SWITCH — sends it only where it goes",{mid:true,c:"fg",b:true})+
  K.dev("pc",60,60,"PC A","sender")+K.dev("pc",300,60,"PC B","receiver")+K.dev("pc",60,180,"PC C","")+K.dev("pc",300,180,"PC D","")+
  K.dev("hub",180,120,"Hub","")+
  K.arrow(82,70,160,110,"",true)+K.arrow(200,110,276,72,"",true)+K.arrow(200,130,276,170,"",true)+K.arrow(160,130,84,170,"",true)+
  K.dev("pc",420,60,"PC A","sender")+K.dev("pc",660,60,"PC B","receiver")+K.dev("pc",420,180,"PC C","")+K.dev("pc",660,180,"PC D","")+
  K.dev("switch",540,120,"Switch","")+
  K.arrow(442,70,514,108,"",true)+K.arrow(566,108,636,72,"",true)+K.link(566,132,638,170)+K.link(514,132,442,170)+
  `<line x1="360" y1="40" x2="360" y2="235" stroke="var(--line)" stroke-dasharray="4 4"/>`,
  "PC A sends to PC B. The hub copies it to C and D too. The switch reads the destination MAC and sends it only to B.")}
<h3>The switch: a sorting office</h3>
<p>A <b>switch</b> looks like a hub but is a ${K.g("Layer 2","The data link layer: delivery within one local network using MAC addresses.")} device: it reads the MAC address on every ${K.g("frame","A unit of data on a local network, with source and destination MAC addresses in its header.")}.</p>
<p>It keeps a <b>MAC address table</b> — which MAC lives behind which port — learned by noticing the <i>source</i> MAC of each incoming frame. It then sends each frame out of the one port where the <i>destination</i> MAC lives. Broadcasts, and frames for addresses not yet learned, go out of all ports. The learning process is a later lesson; the headline is: <b>a switch forwards by destination MAC address.</b></p>
<p>That fixes every hub problem. Each port is its own link, so each device gets the full port speed (1 Gbps each, not shared). With one device per link nothing can collide, so links run <b>full duplex</b>. And PC C no longer sees PC A's traffic.</p>
<p>Two interview terms come from this. A ${K.g("collision domain","Devices whose transmissions can collide: a whole hub, or one switch port.")} is a whole hub, but just one switch port. A ${K.g("broadcast domain","Devices that hear each other's broadcasts: all ports of a switch. Routers separate broadcast domains.")} covers <b>all</b> the ports of a switch; only a router (or a Layer 3 switch) splits it.</p>
${K.exam(`Expect diagrams asking "how many collision domains and broadcast domains?". Count every switch port in use as one collision domain, a whole hub as one, and each router interface as the edge of a broadcast domain. The trap: assuming a switch splits broadcast domains — it doesn't (without ${K.g("VLANs","Virtual LANs: a switch's ports divided into separate logical networks, each its own broadcast domain, as if they were on separate switches. You'll configure them in a later module.")}).`)}
<h3>What you will see on a real switch</h3>
<ul>
<li><b>Ports</b> — 24 or 48 copper ports for endpoints.</li>
<li><b>Uplinks</b> — two to four faster ports, usually ${K.g("SFP","A slot taking a small plug-in module, so one port can use fibre or copper. SFP+ is the 10 Gbps version.")} slots, often fibre at 10 Gbps, linking the switch to the core.</li>
<li><b>Managed or unmanaged</b> — unmanaged has no settings: fine at home, unacceptable at work because you can't see or secure it. Managed switches have Cisco IOS, a management IP, VLANs and security. This course is about managed switches.</li>
<li><b>Cisco Catalyst</b> — Cisco's switch family. Older Catalyst 2960s are everywhere in Nigerian offices; current models are the 9200 and 9300 (access) and 9500 (core). Several can be joined into a <b>stack</b> that behaves as one switch.</li>
<li><b>PoE</b> — ${K.g("Power over Ethernet","The switch sends electrical power down the same cable as the data, so the device needs no power socket.")} powers phones, APs and cameras over the data cable. ${K.g("802.3af","The first IEEE PoE standard (2003), often just called PoE: up to 15.4 W per port.")} gives 15.4 W per port, ${K.g("802.3at","The 2009 IEEE standard known as PoE+: up to 30 W per port, enough for most Wi-Fi access points.")} (PoE+) 30 W, ${K.g("802.3bt","The 2018 IEEE standard (sometimes called PoE++) that uses all four wire pairs: 60 W (Type 3) or 90 W (Type 4) per port.")} 60 W or more.</li>
</ul>
${K.tip(`A PoE switch has a total <b>power budget</b> (say 370 W across 48 ports). Exceed it and new devices quietly get no power — check with <code>show power inline</code>. And if a PoE switch loses power, every phone, AP and camera on it dies too, so it belongs on the UPS.`)}
<h3>A preview: the multilayer switch</h3>
<p>A ${K.g("multilayer switch","Also called a Layer 3 switch: a switch that can also route between networks at full switch speed.")} can also route between networks at switch speed. The core switch in the map is one: when floor 2 prints to floor 3 (two networks), it routes between them without touching the edge router. You'll configure this in the inter-VLAN routing lesson.</p>
${K.mistake(`Thinking a switch separates networks. Every port on a switch is in the same network and broadcast domain by default. Separating departments needs a router, a Layer 3 switch or VLANs.`)}
${K.check({q:"Twelve PCs share an old 100 Mbps <b>hub</b>. Compared with a 100 Mbps switch, what is the main problem?", o:["The PCs cannot get IP addresses","All twelve share one half-duplex channel and can collide","The hub routes to the wrong network","The hub blocks broadcasts"], a:1, why:"A hub is one collision domain with shared, half-duplex bandwidth. A switch gives every port its own full-duplex 100 Mbps."})}
${K.q({type:"multi", q:"An office replaces its old hub with a switch. Which two things improve? (Choose two.)", o:["Each port gets its own full-duplex bandwidth instead of sharing one channel","Once a MAC is learned, frames go only out of the port where that device is","Every port becomes its own broadcast domain","Broadcasts stop being sent to other PCs","PCs no longer need IP addresses"], a:[0,1], why:"A switch makes every port its own collision domain running full duplex, and it forwards each frame only to the destination's port once it has learned that MAC. It does not split the broadcast domain: broadcasts still reach every port. Only a router, a Layer 3 switch or VLANs separate broadcast domains."})}

<h2>Routers and firewalls: the doors and the guards</h2>
<h3>Routers join networks</h3>
<p>A switch moves frames <b>inside</b> one network. A <b>router</b> moves data <b>between</b> networks: office to internet, branch to head office. It works at ${K.g("Layer 3","The network layer: delivery between networks using IP addresses.")}, reading the destination IP of each ${K.g("packet","A unit of data at Layer 3, with source and destination IP addresses.")} and looking it up in its ${K.g("routing table","The router's list of known networks and which way to send traffic for each.")}.</p>
${K.analogy(`<p>A router is a junction with a signpost. It reads the destination town (IP address), checks the signpost (routing table), and sends the car down the next road. It doesn't know the whole route to Kano — only the next turn.</p>`)}
<p>Part of a real routing table, from a small Abuja branch with a staff LAN, a CCTV LAN and one ISP link:</p>
${K.out(`ABJ-RTR#show ip route
Codes: L - local, C - connected, S - static, O - OSPF
       * - candidate default

Gateway of last resort is 102.89.4.17 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 102.89.4.17
      10.0.0.0/8 is variably subnetted, 4 subnets, 2 masks
C        10.50.1.0/24 is directly connected, GigabitEthernet0/0/1
L        10.50.1.1/32 is directly connected, GigabitEthernet0/0/1
C        10.50.2.0/24 is directly connected, GigabitEthernet0/0/2
L        10.50.2.1/32 is directly connected, GigabitEthernet0/0/2
      102.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        102.89.4.16/30 is directly connected, GigabitEthernet0/0/0
L        102.89.4.18/32 is directly connected, GigabitEthernet0/0/0`, "show ip route (codes shortened). /24 and /30 are short ways of writing a subnet mask — covered in the subnetting module.")}
<ul>
<li><b>C 10.50.1.0/24 … Gi0/0/1</b> — the staff LAN, plugged into this port, known automatically (C = connected).</li>
<li><b>L 10.50.1.1/32</b> — the router's own address on that LAN: the staff PCs' <b>default gateway</b> (L = local).</li>
<li><b>C 10.50.2.0/24 … Gi0/0/2</b> — the CCTV LAN. The router is the door between the two.</li>
<li><b>C 102.89.4.16/30 … Gi0/0/0</b> — the link to the ISP.</li>
<li><b>S* 0.0.0.0/0 via 102.89.4.17</b> — the <b>default route</b>, typed by an engineer (S = static): "anything not listed, send to the ISP".</li>
</ul>
<p>Routers also separate broadcast domains, do NAT, terminate WAN links (often two providers, say MainOne and MTN, with failover) and, in small sites, run DHCP. Cisco's branch routers are the <b>ISR</b> family (ISR 1000, ISR 4000), now succeeded by the Catalyst 8000 Edge platforms. Note the few ports, named like <code>GigabitEthernet0/0/0</code>.</p>
${K.check({q:"A staff PC sends a packet to <code>41.203.10.50</code>. Which entry in the table above does the router use?", o:["C 10.50.1.0/24","L 10.50.1.1/32","C 10.50.2.0/24","S* 0.0.0.0/0 via 102.89.4.17"], a:3, why:"That address is in no connected network, so the default route sends it to the ISP at 102.89.4.17."})}

<h3>Firewalls decide what is allowed</h3>
<p>A router's instinct is to forward. A <b>firewall</b>'s is to <b>block everything unless a rule allows it</b>. It thinks in ${K.g("zones","Groups of interfaces with the same trust: inside, outside, DMZ.")}:</p>
<ul>
<li><b>Inside</b> — the staff network. Trusted.</li>
<li><b>Outside</b> — the internet. Untrusted.</li>
<li><b>${K.g("DMZ","A separate firewall zone for public-facing servers. If one is hacked, the firewall still stands between it and the inside.")}</b> — public-facing servers such as the website.</li>
</ul>
<p>Typical policy: inside may start connections out; outside may reach only specific DMZ servers on specific ports; nobody outside may start a connection to the inside. Cisco's ASA expresses trust as a <b>security level</b>, 0 (outside) to 100 (inside).</p>
<p>So how does a web page get back in? Through ${K.g("stateful inspection","The firewall records each connection in a state table and lets matching return traffic back in automatically.")}:</p>
${K.steps([
  ["A user starts a connection", `<p>A laptop (<code>10.20.2.45</code>) connects to a web server on port 443. The rules allow inside-to-outside on 443.</p>`],
  ["The firewall writes it down", `<p>It records the conversation in its <b>state table</b>: who, which ports, which server.</p>`],
  ["The reply comes back", `<p>Outside-to-inside is normally blocked — but the reply matches a state-table entry, so it is let through.</p>`],
  ["A stranger knocks", `<p>A scanner on the internet sends an unsolicited packet to the same laptop. No rule, no matching entry: <b>dropped</b>.</p>`],
  ["The door closes", `<p>When the connection ends or goes quiet, the entry is removed.</p>`],
])}
<p>A ${K.g("next-generation firewall","NGFW: stateful firewall plus application awareness, intrusion prevention, URL filtering and user identity.")} (NGFW) looks deeper: it recognises <b>applications</b> (allow WhatsApp chat, block its file transfers), runs ${K.g("intrusion prevention (IPS)","Intrusion Prevention System: spots known attack patterns in traffic and blocks them.")} to block known attacks, filters <b>${K.g("URLs","Uniform Resource Locators: full web addresses such as https://portal.company.com/login — the site name plus the exact page.")}</b> by category, inspects files for <b>malware</b>, and writes rules about <b>users</b> ("Finance may reach the banking portal"). Vendors: <b>Cisco</b> Secure Firewall (formerly Firepower) and the older ASA, <b>Fortinet</b> FortiGate (very common in Nigerian businesses) and <b>Palo Alto Networks</b>.</p>
${K.check({q:"Why does the firewall let a web page back in when outside-to-inside traffic is blocked?", o:["A rule allows all inbound port 443","The reply matches a connection in the state table","Firewalls don't check web traffic","The router sends replies around the firewall"], a:1, why:"Stateful inspection: the outbound connection was recorded, so its return traffic is allowed. Unsolicited traffic is dropped."})}
${K.q({type:"order", q:"Put these events in the order a stateful firewall handles a staff member's visit to a website.", items:["An inside laptop opens a connection to a web server on port 443, which the rules allow","The firewall records the connection in its state table","The web server's reply arrives from outside and matches the state-table entry, so it is let in","The connection ends or goes quiet and the firewall removes the entry"], why:"Stateful inspection only lets outside-to-inside traffic in when it matches a connection an inside user started. The entry is created when the connection goes out and deleted when it ends, so an unsolicited packet from the internet never matches anything and is dropped."})}

<h2>Wireless: access points and controllers</h2>
<p>A ${K.g("wireless access point","AP: connects Wi-Fi clients to the wired network. Usually on the ceiling, powered by PoE.")} (AP) bridges Wi-Fi to the wired network. Phones talk to it by radio, using one of the IEEE 802.11 Wi-Fi standards such as ${K.g("802.11ac","The IEEE Wi-Fi standard sold as Wi-Fi 5; the newer 802.11ax is Wi-Fi 6. Every Wi-Fi standard's number starts 802.11.")}; it passes their frames to its switch. It is a <b>Layer 2</b> device: it does not route and hands out no addresses — Wi-Fi clients get theirs from the same DHCP server as wired PCs.</p>
<p>Each AP broadcasts network names called ${K.g("SSIDs","The Wi-Fi network names users see, e.g. CORP-STAFF, CORP-GUEST.")}, such as <code>CORP-STAFF</code> and <code>CORP-GUEST</code>. Beyond a handful of APs, configuring them one by one is impossible, so there are three management models:</p>
${K.when([
  ["Autonomous APs","One to three APs: a small office or shop.","Simple: each AP configured on its own, no extra kit.","More than a few APs — every change must be repeated on each."],
  ["Lightweight APs + WLC","Dozens to thousands of APs on one campus: hospital, university, HQ.",`A ${K.g("wireless LAN controller (WLC)","Configures and monitors many lightweight APs centrally. Cisco: Catalyst 9800.")} pushes settings to all APs over ${K.g("CAPWAP","The protocol between lightweight APs and their WLC. By default client data also travels through this tunnel.")}; one change updates all.`,"A tiny site where a controller is overkill."],
  ["Cloud-managed APs","Many small branches — a pharmacy chain across Lagos and Abuja.","Managed from a web dashboard (Cisco Meraki); nothing to install on site.","Sites with no reliable internet, or rules against cloud management."],
], "Which way to manage access points")}
<p>With a WLC, change the Wi-Fi password once and 300 APs update together; if one AP dies, its neighbours raise power to cover the gap. You'll configure one in the wireless module.</p>
${K.myth([
  ["The box from the ISP is \"just a router\".","It is a router, a switch, an access point and a firewall in one box, usually with a DHCP server too."],
  ["An access point gives out IP addresses.","A plain AP is a Layer 2 bridge. Addresses come from a DHCP server or the router."],
  ["Full Wi-Fi bars mean fast internet.","The bars show signal to the nearest AP only. The internet link behind it can still be slow or down."],
  ["Once you have a firewall, you are safe.","It only controls traffic that passes through it. A user who clicks a phishing link over an allowed connection is still at risk."],
])}
${K.check({q:"A Wi-Fi user has IP address 10.20.3.88. Which device most likely gave it?", o:["The access point","The DHCP server (or the router acting as one)","The WLC","The DMZ"], a:1, why:"An AP only bridges Wi-Fi to the wired LAN. Wireless clients get addresses from the same DHCP server as wired ones."})}

<h2>A tour of a real comms room</h2>
<p>Back to that fourth-floor cabinet. Most racks follow the same pattern, top to bottom:</p>
${K.svg("0 0 760 410",
  `<rect x="172" y="10" width="356" height="388" rx="4" fill="none" stroke="var(--line)" stroke-width="2"/>`+
  K.box(180,18,340,36,"Patch panel A — ports 1–48","each port wired to one desk socket")+
  K.band(180,58,340,16,"cable manager")+
  K.box(180,78,340,36,"Switch stack member 1","48 PoE+ ports · 2 SFP+ uplinks",true)+
  K.box(180,118,340,36,"Switch stack member 2","acts as one switch with member 1",true)+
  K.band(180,158,340,16,"cable manager")+
  K.box(180,178,340,36,"Fibre patch panel","uplinks to the core and other floors")+
  K.box(180,222,340,36,"Router","ISP links: fibre + 4G backup")+
  K.box(180,262,340,36,"Firewall","inside · outside · DMZ ports")+
  K.box(180,302,340,36,"Server","two power supplies · management port")+
  K.box(180,350,340,40,"UPS","batteries — heaviest, so at the bottom")+
  K.txt(540,40,"no power, no lights")+K.txt(540,100,"amber/green port LEDs")+K.txt(540,136,"stack cables at the back")+
  K.txt(540,200,"thin yellow or aqua cables")+K.txt(540,244,"few ports, console port")+K.txt(540,284,"ports labelled by zone")+
  K.txt(540,374,"buys time in a power cut")+
  K.txt(160,40,"label every port",{end:true})+K.txt(160,70,"short patch leads",{end:true})+K.txt(160,244,"ISP kit on a shelf",{end:true})+
  K.txt(160,374,"keeps all of it up",{end:true}),
  "A typical rack: desks feed the patch panel, short leads join it to the switch stack, fibre uplinks go to the core, and the router and firewall lead out to the ISP.")}
<ul>
<li><b>${K.g("Patch panel","Passive numbered sockets; permanent cables behind them run to each desk socket. No power, no electronics.")}</b> — numbered sockets wired through the walls to desks: panel port 14 <i>is</i> desk socket 2-14. No power, no lights.</li>
<li><b>Cable managers</b> — keep patch leads tidy. You can't trace a cable you can't follow.</li>
<li><b>Switch stack</b> — the floor switches; short leads join panel ports to switch ports.</li>
<li><b>Fibre patch panel</b> — where uplinks from the core arrive.</li>
<li><b>Router and firewall</b> — few ports, leading to the ISP's fibre box and perhaps a 4G/5G backup router from MTN or Airtel.</li>
<li><b>Server</b> — deeper, two power supplies, a management port.</li>
<li><b>${K.g("UPS","Uninterruptible Power Supply: batteries that keep equipment running through a power cut and smooth out surges.")}</b> — when NEPA takes the light, it carries the rack until the generator starts, and shields it from the surge when power returns.</li>
</ul>
${K.dyk(`Rack equipment is measured in "U": 1U is 1.75 inches (44.45 mm) of height. A full-height rack is usually 42U, and most access switches are 1U thin.`)}
<h3>Recognising a device by its ports and lights</h3>
<ul>
<li><b>24/48 identical ports plus a few SFP slots</b> → access switch.</li>
<li><b>A few ports named like <code>GE 0/0/0</code>, a console port, module slots</b> → router.</li>
<li><b>Ports labelled <code>WAN1</code>, <code>DMZ</code>, <code>internal</code></b> → firewall.</li>
<li><b>Numbered sockets, no power cable, no LEDs</b> → patch panel.</li>
<li><b>A disc on the ceiling with one cable</b> → access point.</li>
</ul>
<p>Cisco switch port LEDs: <b>off</b> = no link; <b>steady green</b> = link up; <b>flickering green</b> = traffic; <b>amber</b> = link but not forwarding yet (for example the first 30 seconds or so while the switch checks for loops), or blocked, or a fault. A port that <i>stays</i> amber deserves a look.</p>
${K.mistake(`Treating the patch panel as the switch. "Port 14 is dead" on the panel is only switch port 14 if the lead runs from panel 14 to switch 14. Follow the actual lead, then confirm on the switch.`)}
${K.dodont([
  "Label both ends of every patch lead, and every port description on the switch.",
  "Photograph each rack on your first visit — it saves an hour at 9pm.",
  "Keep switches, router and firewall on the UPS, and test the UPS.",
  "Use the console or "+K.g("SSH","Secure Shell: an encrypted way to log in to a device's command line over the network. Lesson 8 compares it with the console cable.")+" to check a device before touching cables.",
],[
  "Power-cycle the core switch or router to fix one user's problem.",
  "Pull a cable you haven't traced \"to see what happens\".",
  "Install hubs or unmanaged switches under desks to get more ports.",
  "Leave the comms room unlocked — physical access beats every password.",
])}
<h3>The whole cast at a glance</h3>
<div class="tablewrap"><table>
<tr><th>Device</th><th>Layer</th><th>Forwards by</th><th>Its job</th></tr>
<tr><td>Hub</td><td>1</td><td>Nothing — repeats every signal everywhere</td><td>Obsolete shared, half-duplex channel</td></tr>
<tr><td>Switch</td><td>2</td><td>Destination MAC (MAC address table)</td><td>Joins devices inside one LAN</td></tr>
<tr><td>Access point</td><td>2</td><td>MAC — bridges Wi-Fi to Ethernet</td><td>Puts wireless devices on the LAN</td></tr>
<tr><td>WLC</td><td>Management</td><td>— (controls APs; client data may tunnel through it)</td><td>Configures and monitors many APs</td></tr>
<tr><td>Multilayer switch</td><td>2 and 3</td><td>MAC inside a network, IP between</td><td>Core of the LAN; routes internally at switch speed</td></tr>
<tr><td>Router</td><td>3</td><td>Destination IP (routing table)</td><td>Joins networks; default gateway; NAT; WAN</td></tr>
<tr><td>Firewall</td><td>3 and up</td><td>Rules + connection state (addresses, ports, apps, users)</td><td>Allows or blocks traffic between zones</td></tr>
</table></div>
${K.remember(`<p><b>1-2-3: Bits, MACs, IPs.</b> The <b>hub</b> (Layer 1) handles bits, the <b>switch</b> (Layer 2) reads MACs, the <b>router</b> (Layer 3) reads IPs. Each step up the ladder reads one layer deeper into the data.</p>`)}
<h3>The home "router" is four devices in one box</h3>
<p>The ISP box at home — an MTN or Airtel 4G/5G router, or a fibre router — is really a <b>router</b> with NAT, a small <b>switch</b> (the yellow LAN ports), a Wi-Fi <b>access point</b> and a basic <b>firewall</b>, plus a DHCP server and often the modem. Engineers call it a ${K.g("SOHO","Small Office / Home Office: an all-in-one router-switch-AP-firewall box for a few users.")} router. Perfect for a home; trouble for a growing business.</p>
${K.case("A Lagos logistics firm outgrows one box",`<p>An Ikeja logistics company started with 8 staff on one ISP 4G router. Three years later: 60 staff, a warehouse, CCTV and guests — on the same box. Wi-Fi collapsed every morning when 70 phones joined; nobody could see who used the bandwidth; guests, cameras and the payroll PC shared one flat network; every power cut rebooted everything.</p>
<p>The fix gave each job to a proper device: fibre from one provider plus 4G backup from another, into a <b>FortiGate firewall</b> doing NAT, rules and failover; a 48-port <b>Catalyst PoE+ switch</b> powering six ceiling <b>APs</b> and the cameras; separate networks for staff, CCTV and guests; and a <b>UPS</b> to bridge to the generator. An all-in-one box isn't wrong — it's <i>small</i>. Spotting when a business has outgrown it is part of the job.</p>`)}
<h3>Putting it together: follow one print job</h3>
<p>Amaka is on her laptop, on Wi-Fi, on floor 3. She prints to the big printer on floor 2. Watch what each device does with her data.</p>
${K.steps([
  ["Laptop to access point", `<p>The laptop sends the print job by radio to the ceiling AP. The AP passes the frames onto its cable unchanged — Layer 2, no routing, no addresses handed out.</p>`],
  ["Access point to floor switch", `<p>The AP's cable runs through the patch panel into <code>FLOOR3-SW</code>, which also powers the AP with PoE. The printer is on a different network, so the laptop has addressed the frame to its default gateway — the core switch. <code>FLOOR3-SW</code> looks up that destination MAC and sends the frame out of its uplink.</p>`],
  ["The core routes", `<p>The multilayer core switch reads the destination <b>IP</b> address, sees it belongs to the floor-2 network, and routes it there at switch speed. The edge router and firewall never see it, because it never leaves the building.</p>`],
  ["Down to the printer", `<p>The core sends it down the floor-2 uplink. <code>FLOOR2-SW</code> finds the printer's MAC address in its MAC address table and sends the frame out of the one port the printer is on.</p>`],
])}
<p>If Amaka opens a website instead, the first two steps are the same. Then the core sees an internet address and hands the packet to the router, which uses its default route. The firewall checks its rules and records the connection, and the packet leaves through the ISP. Each device made one decision about her data and passed it on.</p>
<p><b>Exercise — name that device.</b> In a rack you find a 1U box with eight ports labelled <code>port1</code> to <code>port8</code>, two more labelled <code>wan1</code> and <code>wan2</code>, a console port and a power cable. What is it most likely to be?</p>
${K.hint(`Count the ports, then read the labels. Which device has "WAN" sides and "inside" sides?`)}
${K.reveal("Show the answer",`<p>A <b>firewall</b> (this labelling is typical of a FortiGate). Few ports rules out an access switch; power and a console port rule out a patch panel; separate WAN ports for two ISPs plus internal ports matches a firewall's outside and inside zones. A router is the next-best guess — confirm by logging in.</p>`)}
${K.check({q:"A 1U unit has 24 numbered sockets, no power cable and no lights. What is it?", o:["An unmanaged switch","A patch panel","A hub","A router missing its power supply"], a:1, why:"A patch panel is passive. Every switch, hub or router needs power and has LEDs."})}

<h2>Hands-on: log in to a floor switch</h2>
<p>On an unfamiliar switch, the first command most engineers type is <code>show version</code>: what is this box? Useful lines from a real Catalyst 2960-X:</p>
${K.out(`FLOOR2-SW#show version
Cisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E8, RELEASE SOFTWARE (fc1)
...
FLOOR2-SW uptime is 41 weeks, 2 days, 6 hours, 12 minutes
System returned to ROM by power-on
System image file is "flash:c2960x-universalk9-mz.152-7.E8.bin"
...
48 Gigabit Ethernet interfaces
2 Ten Gigabit Ethernet interfaces
...
Model number                    : WS-C2960X-48FPD-L
System serial number            : FOC2134X0AB`, "show version on a Catalyst 2960-X, trimmed. Lines differ between models and versions.")}
<ul>
<li><b>Version 15.2(7)E8</b> — the IOS version, for checking security fixes.</li>
<li><b>uptime</b> — time since the last restart. A switch that rebooted ten minutes ago during an "outage" points at power — check the UPS.</li>
<li><b>returned to ${K.g("ROM","Read-Only Memory: a small chip holding the start-up program a device runs before its operating system loads. \"Returned to ROM\" means the device restarted.")} by power-on</b> — <i>why</i> it restarted: power was lost.</li>
<li><b>48 Gigabit … 2 Ten Gigabit</b> — 48 access ports, 2 uplinks.</li>
<li><b>Model and serial number</b> — the exact model (<code>FP</code> = full PoE+) and what Cisco support will ask for.</li>
</ul>
<p>Your turn. <code>FLOOR2-SW</code> below has three ports: <code>Gi0/0</code> is the uplink to the core, <code>Gi0/1</code> a desk PC, <code>Gi0/2</code> the floor printer — not yet labelled. (A real switch has 24 or 48; the lab's <code>show version</code> is shortened too.)</p>
${K.term({env:"ios", title:"inspect a floor switch", opts:{host:"FLOOR2-SW", kind:"switch",
  intfs:{"GigabitEthernet0/0":{ip:null,mask:null,shut:false,vlan:1,mode:"trunk",allowed:null,desc:"UPLINK-TO-CORE"},
         "GigabitEthernet0/1":{ip:null,mask:null,shut:false,vlan:1,mode:"access",allowed:null,desc:"DESK-2-07"},
         "GigabitEthernet0/2":{ip:null,mask:null,shut:false,vlan:1,mode:"access",allowed:null},
         "Vlan1":{ip:"10.20.2.11",mask:"255.255.255.0",shut:false,vlan:1,mode:"svi",allowed:null,desc:"MANAGEMENT"}},
  motd:"FLOOR2-SW — console session. You are at user EXEC (the > prompt)."},
  intro:"Type each command and press <b>Enter</b>. Commands can be shortened (<code>sh ver</code>), but type them in full the first time.",
  tasks:[
    {text:"Type <code>enable</code> to reach privileged mode (the prompt changes to <code>#</code>)", done:e=>e.mode!=="user" || e.history.some(h=>/^\s*en(a(b(le?)?)?)?\s*$/i.test(h))},
    {text:"Type <code>show version</code> — what is the software version and the uptime?", done:e=>{ const i=e.history.findIndex(h=>/^\s*en(a(b(le?)?)?)?\s*$/i.test(h)); return i>-1 && e.history.slice(i+1).some(h=>/^\s*(do\s+)?sh(o(w)?)?\s+ver/i.test(h)); }},
    {text:"Type <code>show ip interface brief</code> — which interface holds the switch's own IP address?", done:e=>{ const i=e.history.findIndex(h=>/^\s*en(a(b(le?)?)?)?\s*$/i.test(h)); return i>-1 && e.history.slice(i+1).some(h=>/^\s*(do\s+)?sh(o(w)?)?\s+ip\s+int/i.test(h)); }},
    {text:"Type <code>show mac address-table</code> — which port has the printer's MAC, <code>0050.7966.6801</code>?", done:e=>{ const i=e.history.findIndex(h=>/^\s*en(a(b(le?)?)?)?\s*$/i.test(h)); return i>-1 && e.history.slice(i+1).some(h=>/^\s*(do\s+)?sh(o(w)?)?\s+mac/i.test(h)); }},
    {text:"Label the printer's port: <code>configure terminal</code>, <code>interface g0/2</code>, <code>description FLOOR2-PRINTER</code>, <code>end</code>", done:e=>/print/i.test((e.intfs["GigabitEthernet0/2"]||{}).desc||"")},
  ],
  win:"You identified the switch, read its interfaces, found a device by its MAC address and labelled its port — an engineer's first visit to a site.",
  solve:["enable","show version","show ip interface brief","show mac address-table","configure terminal","interface g0/2","description FLOOR2-PRINTER","end"]})}
${K.hint(`Stuck on "Invalid input"? Some <code>show</code> commands (such as <code>show running-config</code>) and all configuration need privileged mode — check your prompt ends in <code>#</code>. For the last task, the prompt should change to <code>(config)#</code> and then <code>(config-if)#</code>.`)}
${K.reveal("What the outputs mean",`<ul>
<li><b>show ip interface brief</b>: the physical ports are <code>unassigned</code> — switch ports forward frames and need no IP. Only <code>Vlan1</code> has one, <code>10.20.2.11</code>, so you can reach the switch itself to manage it. <code>up / up</code> means healthy; ignore <b>OK?</b> and <b>Method</b> for now.</li>
<li><b>show mac address-table</b>: <code>0050.7966.6801</code> is on <code>Gi0/2</code> — the printer's port. <code>DYNAMIC</code> means learned from traffic. A real floor switch lists hundreds.</li>
<li><b>description</b>: run <code>show running-config</code> and you'll see it under <code>interface GigabitEthernet0/2</code>. Configuration is lesson 8.</li>
</ul>`)}
${K.tip(`One MAC, three spellings: Windows <code>00-50-79-66-68-01</code>, Linux/Mac <code>00:50:79:66:68:01</code>, Cisco <code>0050.7966.6801</code>. Convert to Cisco's dotted format before pasting into a switch command.`)}
${K.check({q:"<code>show ip interface brief</code> on an access switch shows every physical port as <i>unassigned</i> and only Vlan1 with an IP. What does that mean?", o:["The switch is broken","Normal: ports forward by MAC; the Vlan1 address is for managing the switch","All ports are shut down","The switch is routing"], a:1, why:"A Layer 2 switch needs no IP on its ports. The single management IP lets you reach the switch itself."})}

${K.job("“Half of the third floor has no internet” — a home router on the office network",`
<p><b>The call.</b> 10:05, Thursday. Adaeze in Operations: "My internet's gone. Two others near me too, but some people on our floor are fine."</p>
<p><b>Questions.</b> "Since when?" — <i>"About 9:30."</i> "Anything new on the floor?" — <i>"We have a new intern."</i> Several users, one floor, mixed results: something on the floor is treating some users differently.</p>
<p><b>Check the address.</b> Adaeze's <code>ipconfig</code>: <i>IPv4 192.168.0.104, gateway 192.168.0.1</i>. Floor 3 uses <code>10.20.3.x</code>, gateway <code>10.20.3.1</code>; her working colleague has <code>10.20.3.57</code>. She isn't offline — she got an address from the <b>wrong DHCP server</b>.</p>
<p><b>Find it.</b> <code>arp -a</code> on her PC gives the rogue gateway's MAC:</p>
${K.out(`Interface: 192.168.0.104 --- 0xc
  Internet Address      Physical Address      Type
  192.168.0.1           c4-6e-1f-22-9a-10     dynamic
  192.168.0.255         ff-ff-ff-ff-ff-ff     static`, "arp -a on Windows.")}
<p>Converted to Cisco format, the floor switch says where it lives:</p>
${K.out(`FLOOR3-SW#show mac address-table address c46e.1f22.9a10
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  30    c46e.1f22.9a10    DYNAMIC     Gi1/0/23
Total Mac Addresses for this criterion: 1`, "Learned on port Gi1/0/23.")}
<p>Port 23 is patched to panel port 23: desk 3-23. Under the intern's desk is a home Wi-Fi router, one of its yellow <b>LAN</b> ports plugged into the wall so his phone could have Wi-Fi. Its DHCP server is answering office PCs, and whoever it answers first gets a useless <code>192.168.0.x</code> address.</p>
<p><b>Fix.</b> Unplug it. Affected users restart, or run <code>ipconfig /release</code> then <code>ipconfig /renew</code>. Adaeze gets <code>10.20.3.64</code>, gateway <code>10.20.3.1</code>; internet works. Confirm with the other two.</p>
<p><b>What you say.</b> To the intern, kindly: "No harm meant, but this box hands out addresses and took three people offline. For your phone, use CORP-GUEST." To your manager: "Rogue DHCP from a personal router at 3-23, removed. We should enable DHCP snooping on the access switches."</p>
<p><b>Ticket note:</b> <i>"3 users floor 3 had 192.168.0.x (gw 192.168.0.1) — rogue DHCP. Traced MAC c46e.1f22.9a10 via arp -a / show mac address-table to FLOOR3-SW Gi1/0/23, desk 3-23. Personal home router on LAN port. Removed; leases renewed; 10.20.3.x and internet confirmed. Recommend DHCP snooping. Resolved, 25 min."</i></p>`)}
${K.mistake(`Calling every box with antennas a router. A plain access point would have broken nothing — it hands out no addresses. The home router broke things because it contains a DHCP server. Knowing what's inside a box tells you what harm it can do.`)}
<p>Had the intern used the <b>WAN</b> port instead, office PCs would have been fine — but his devices would hide behind its NAT on Wi-Fi the company doesn't control. Different problem, still not allowed. The switch features that stop both, DHCP snooping and port security, come in the security module.</p>
${K.video({t:"Comms-room and network rack tours", u:"https://www.youtube.com/results?search_query=network+rack+comms+room+tour+patch+panel+switch", by:"YouTube search", why:"Watch a few real racks and name each device before the presenter does."})}

<h2>Interview corner</h2>
${K.hint(`For each question, answer out loud first. Structure: what it is, which layer, what it forwards by, one consequence.`)}
${K.reveal("“What's the difference between a hub, a switch and a router?”",`<p>"A hub is Layer 1: it repeats every signal out of every port, so devices share bandwidth and one collision domain, half duplex. It's obsolete. A switch is Layer 2: it learns MAC addresses and forwards each frame only to the destination's port, so each port is its own collision domain and runs full duplex — but all ports are one broadcast domain. A router is Layer 3: it forwards packets between networks by destination IP using its routing table, separates broadcast domains, and is hosts' default gateway."</p><p>Mentioning collision vs broadcast domains lifts this from basic to good.</p>`)}
${K.reveal("“What does it mean that a firewall is stateful?”",`<p>"It tracks each connection in a state table. When an inside user opens a connection out, the matching return traffic is allowed back automatically, without an inbound rule; unsolicited traffic from outside is dropped. A next-generation firewall adds application awareness, IPS, URL filtering and user identity."</p>`)}
${K.reveal("“Why use lightweight APs with a WLC instead of autonomous APs?”",`<p>"Scale and consistency. Autonomous APs are configured one by one — fine for two or three. A WLC configures and monitors lightweight APs centrally over CAPWAP, so one change reaches hundreds of APs and it can adjust power and channels when one fails. Cloud-managed APs like Meraki give similar control from a dashboard."</p>`)}

${K.recap([
  "Endpoints are where data starts and ends; network devices move it in between.",
  "A hub (Layer 1) repeats everything to everyone: shared bandwidth, collisions, half duplex. Obsolete.",
  "A switch (Layer 2) forwards frames by destination MAC; each port is its own collision domain, full duplex — but all ports are one broadcast domain.",
  "A router (Layer 3) forwards packets between networks by its routing table; it is the default gateway. A multilayer switch can route too.",
  "A firewall blocks by default, allows by rule and tracks connections statefully; zones are inside, outside, DMZ. NGFWs add apps, IPS, URL filtering, identity.",
  "An AP bridges Wi-Fi to the LAN; APs are autonomous, lightweight with a WLC, or cloud-managed.",
  "A rack: patch panel, switch stack, fibre panel, router, firewall, servers, UPS at the bottom.",
  "A home router is router + switch + AP + firewall + DHCP — plugged into an office, a rogue DHCP server.",
])}
${K.next(`<b>Lesson 3 — Cables and connectors.</b> You've met the boxes; next, the links between them: copper, fibre and Wi-Fi, RJ45 and SFP, which cable goes where in that rack — and why a cable can look perfect and still be the problem.`)}
`,
quiz:[
  {lvl:1, q:"Which device forwards frames based on the destination MAC address?", o:["Hub","Switch","Router","Firewall"], a:1, why:"Switches are Layer 2 devices that look up the destination MAC in their MAC address table."},
  {lvl:1, q:"Which statement about a hub is TRUE?", o:["Each port is its own collision domain","It forwards frames only to the destination port","All connected devices share one collision domain and operate half duplex","It separates broadcast domains"], a:2, why:"A hub repeats every signal to every port, so devices share bandwidth, can collide, and use half duplex with CSMA/CD."},
  {lvl:1, q:"Which device separates broadcast domains by default?", o:["Hub","Unmanaged switch","Managed Layer 2 switch","Router"], a:3, why:"All switch ports are one broadcast domain by default. Routers do not forward broadcasts between networks."},
  {lvl:2, q:"A firewall lets a reply from an internet web server reach an inside PC with no inbound rule. Which feature makes this possible?", o:["NAT","Stateful inspection","Port security","PoE"], a:1, why:"A stateful firewall records outbound connections and permits their return traffic automatically."},
  {lvl:2, q:"A public web server must be reachable from the internet, but if compromised must not reach staff PCs directly. Where should it go?", o:["The inside zone with staff PCs","A DMZ on the firewall","The access switch with the printers","Behind the WLC"], a:1, why:"The DMZ is a separate zone for public-facing servers; traffic from it to the inside is still controlled by the firewall."},
  {lvl:1, q:"Which feature is characteristic of a next-generation firewall rather than a basic packet filter?", o:["Forwarding frames by MAC address","Identifying and controlling traffic by application, with integrated intrusion prevention","Supplying power to APs","Learning routes automatically from neighbouring routers"], a:1, why:"NGFWs add application awareness, IPS, URL filtering and user identity on top of stateful filtering."},
  {lvl:1, q:"In a network with lightweight access points, what does the WLC do?", o:["Assigns IP addresses to Wi-Fi clients","Centrally configures, monitors and manages the APs over CAPWAP","Routes traffic to the internet","Provides PoE to the APs"], a:1, why:"Lightweight APs depend on a WLC for configuration and management via CAPWAP. DHCP and PoE come from other devices."},
  {lvl:1, q:"Which PoE standard is PoE+, providing up to 30 W per port?", o:["802.3af","802.3at","802.3bt","802.11ac"], a:1, why:"802.3af = 15.4 W, 802.3at (PoE+) = 30 W, 802.3bt = 60 W or more. 802.11ac is Wi-Fi."},
  {lvl:1, q:"On a Layer 2 access switch, only interface Vlan1 has an IP address. What is it for?", o:["The PCs' default gateway","Managing the switch remotely","Routing between floors","DHCP for the floor"], a:1, why:"Layer 2 switch ports need no IP. The management interface address lets you reach the switch itself."},
  {lvl:1, q:"An ISP-supplied home 'router' typically combines which functions?", o:["Router only","Router, switch, wireless AP and basic firewall (plus DHCP)","Switch and patch panel","WLC and NGFW"], a:1, why:"SOHO routers combine routing/NAT, a small switch, Wi-Fi, a basic firewall and usually DHCP in one box."},
  {lvl:1, type:"multi", q:"Which two of these devices forward traffic using MAC addresses (Layer 2)? (Choose two.)", o:["Switch","Wireless access point","Hub","Router","Patch panel"], a:[0,1], why:"A switch looks up the destination MAC in its MAC address table, and an access point bridges Wi-Fi frames onto Ethernet by MAC. A hub is Layer 1 and reads no addresses, a router forwards by destination IP (Layer 3), and a patch panel is passive wiring with no electronics at all."},
  {lvl:2, type:"order", q:"Amaka, on Wi-Fi on floor 3, prints to the printer on floor 2 (a different network). Put the path of her print job in order.", items:["Her laptop sends the frames by radio to the ceiling access point","The access point passes the frames onto its cable to FLOOR3-SW","FLOOR3-SW looks up the core switch's MAC (the gateway) and sends the frame out of its uplink","The multilayer core switch reads the destination IP and routes it to the floor-2 network","FLOOR2-SW finds the printer's MAC in its table and sends the frame out of the printer's port"], why:"The AP only bridges Wi-Fi to the wire. Because the printer is on another network, the laptop addresses the frame to its default gateway, the core. The core is a Layer 3 switch, so it routes between the floor networks itself; the edge router and firewall never see the job. Finally the floor-2 access switch delivers by MAC."},
  {lvl:1, type:"match", q:"Match each device with what it uses to decide where traffic goes.", pairs:[["Hub","Nothing: it repeats every signal out of every port"],["Switch","The destination MAC address and its MAC address table"],["Router","The destination IP address and its routing table"],["Firewall","Its rules plus the state table of existing connections"],["Wireless LAN controller","It does not forward by address; it centrally configures lightweight APs"]], why:"Each step up reads one layer deeper: the hub handles bits, the switch reads MACs, the router reads IPs. A firewall adds policy and connection state on top. A WLC is a management device: it pushes configuration to lightweight APs over CAPWAP."},
  {lvl:1, type:"fill", q:"Windows shows a laptop's MAC address as 3C-52-82-1A-7F-09. Write it in the dotted format Cisco IOS uses, for example in show mac address-table.", a:["3c52.821a.7f09","3C52.821A.7F09"], why:"Cisco writes a MAC as three groups of four hex digits separated by dots. Remove the dashes and regroup: 3C52 821A 7F09 becomes 3c52.821a.7f09. Capital or small letters both mean the same hex value."},
  {lvl:3, q:"At 10:15 users on floor 2 report that everything stopped for about ten minutes and then came back. You log in to their access switch and see this. What is the most likely cause?", ex:"FLOOR2-SW#show version\nCisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E8, RELEASE SOFTWARE (fc1)\n...\nFLOOR2-SW uptime is 0 weeks, 0 days, 0 hours, 9 minutes\nSystem returned to ROM by power-on\nSystem image file is \"flash:c2960x-universalk9-mz.152-7.E8.bin\"\n...\nModel number                    : WS-C2960X-48FPD-L", o:["The ISP link went down","The switch lost power and restarted, so check its power feed and the UPS","Someone reloaded the switch to install new software","A rogue DHCP server is handing out wrong addresses"], a:1, why:"An uptime of 9 minutes matches the outage, and 'returned to ROM by power-on' says the restart was caused by power being lost, not by a reload command or a software crash. Check the UPS and the power feed to that rack. Because it is a PoE switch, the phones and APs on it went down too."},
  {lvl:3, q:"The lab bench point on Gi0/2 has three old test PCs on it, and users say it is extremely slow. Nothing on the switch port has been hard-coded. Based on the exhibit, what is most likely plugged into Gi0/2?", ex:"FLOOR1-SW#show interfaces status\n\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi0/1     RECEPTION-PC       connected    10         a-full a-1000 10/100/1000BaseTX\nGi0/2     LAB-BENCH          connected    10         a-half   a-10 10/100/1000BaseTX\nGi0/3     PRINTER-1F         connected    10         a-full  a-100 10/100/1000BaseTX", o:["An old hub: it negotiated 10 Mb/s half duplex, so all three PCs share 10 Mb/s in one collision domain","A duplex mismatch caused by a hard-coded PC","An IP phone drawing PoE","A router, because routers always run half duplex"], a:0, why:"The a- prefix means both values were auto-negotiated, so this is not a mismatch: the device at the other end can only do 10 Mb/s half duplex, which is typical of an old hub. Every PC behind it shares that 10 Mb/s and must take turns (CSMA/CD), so collisions and slowness are expected. Replace the hub with a small switch, or give each PC its own point."},
  {lvl:3, type:"fill", q:"A Catalyst access switch has a 370 W PoE budget. You plan to connect 10 Wi-Fi access points, each allocated 30 W (PoE+), and 6 IP cameras, each allocated 15.4 W (802.3af). Work it out.", fields:[{label:"Total power allocated if every device is connected (W)", a:["392.4","392.4 W","392.4W"]},{label:"How many cameras can be powered once all 10 APs are up?", a:["4","four"]}], why:"10 × 30 = 300 W for the APs and 6 × 15.4 = 92.4 W for the cameras: 392.4 W, which is 22.4 W over the budget. Once the APs are up, 70 W is left, and 70 ÷ 15.4 is 4 whole cameras (61.6 W), so 2 cameras get no power at all. They stay dark, which looks exactly like a broken camera or cable. Fixes: a switch with a bigger budget (or a second power supply, where the model supports it), or move some devices to another PoE switch."},
  {lvl:2, type:"multi", q:"An office replaces its old 24-port hub with a 24-port switch. Which two improvements does this bring? (Choose two.)", o:["Each switch port is its own collision domain, so devices no longer collide with each other","Devices can run full duplex, sending and receiving at the same time","Broadcasts no longer reach every device in the office","PCs on different IP networks can now talk without a router","Devices no longer need MAC addresses"], a:[0,1], why:"A switch gives every port its own collision domain and allows full duplex, so each device gets the full port speed. But all its ports are still one broadcast domain by default: an ARP broadcast still reaches every device. Moving between IP networks still needs a router (or a Layer 3 switch), and a switch depends on MAC addresses to work at all."},
  {lvl:2, type:"match", q:"Match each requirement with the device that meets it.", pairs:[["Power 40 ceiling access points over their data cables","A PoE switch"],["Configure and monitor 40 lightweight APs from one place","A wireless LAN controller"],["Let replies to staff browsing back in, but block new connections from the internet","A stateful firewall"],["Block one application that shares TCP 443 with apps you allow","A next-generation firewall"],["Join the office network to the ISP and choose paths between networks","A router"]], why:"Each requirement names the job, not the box. Power over Ethernet comes from the switch port, central AP management from a WLC (over CAPWAP), connection tracking from a stateful firewall, and application awareness from an NGFW, because a port number alone can't tell two apps on 443 apart. Choosing paths between networks is a router's job."},
  {lvl:2, q:"SW1 receives a frame on Gi0/1 from 0050.7966.6800 addressed to 0050.7966.6805. Based on the exhibit, what does SW1 do with it?", ex:"SW1#show mac address-table dynamic\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0050.7966.6800    DYNAMIC     Gi0/1\n   1    0050.7966.6801    DYNAMIC     Gi0/2\n   1    3c52.821a.7f09    DYNAMIC     Gi0/3\nTotal Mac Addresses for this criterion: 3", o:["Floods it out of every port in VLAN 1 except Gi0/1, because the destination is not in the table","Drops it, because the destination is not in the table","Sends it out of Gi0/2 only, because 6801 is the closest MAC address","Sends it to the default gateway"], a:0, why:"0050.7966.6805 is an unknown unicast: it isn't in the table, so the switch floods it out of every other port in the same VLAN, expecting the owner to be on one of them. When the owner replies, the switch learns its port and later frames go only there. A switch never guesses from similar-looking addresses, and a Layer 2 switch knows nothing about gateways."},
],
cards:[
  {f:"Endpoint vs network device", b:"Endpoint: where data starts/ends (PC, server, phone, printer, camera). Network device: moves it in between (switch, router, firewall, AP)."},
  {f:"Hub", b:"Layer 1. Repeats every signal out of every port. One collision domain, shared bandwidth, half duplex (CSMA/CD). Obsolete."},
  {f:"Switch", b:"Layer 2. Learns source MACs into a MAC address table; forwards by destination MAC. Each port = own collision domain, full duplex. All ports = one broadcast domain."},
  {f:"Collision domain vs broadcast domain", b:"Collision: devices that can collide (a whole hub; one switch port). Broadcast: devices that hear each other's broadcasts (a whole switch/VLAN). Routers split broadcast domains."},
  {f:"Router", b:"Layer 3. Forwards packets between networks by destination IP using the routing table. Default gateway; often NAT and WAN links. Cisco ISR."},
  {f:"Multilayer (Layer 3) switch", b:"A switch that can also route between networks/VLANs at switch speed. Found at the core/distribution."},
  {f:"Stateful firewall", b:"Records each connection in a state table and allows its return traffic; drops unsolicited inbound. Zones: inside, outside, DMZ."},
  {f:"NGFW", b:"Stateful filtering + application awareness, IPS, URL filtering, malware inspection, user identity. E.g. Cisco Secure Firewall, FortiGate, Palo Alto."},
  {f:"Access point (AP)", b:"Layer 2 bridge between Wi-Fi and the wired LAN. Broadcasts SSIDs; usually PoE-powered. Doesn't route or hand out addresses."},
  {f:"AP management models", b:"Autonomous (each configured alone); lightweight + WLC (central, over CAPWAP, e.g. Catalyst 9800); cloud-managed (dashboard, e.g. Meraki)."},
  {f:"PoE standards", b:"802.3af 15.4 W · 802.3at PoE+ 30 W · 802.3bt 60–90 W. The switch has a total power budget."},
  {f:"Patch panel", b:"Passive numbered sockets wired to desk outlets. No power, no LEDs. Short patch leads join it to the switch."},
],
});
// ---------- Lesson 3 ----------
L.push({
id:"net-cables", mins:60, level:"Beginner · builds on lessons 1–2",
t:"Cables, connectors and ports: copper, fibre and SFPs — and why a link won't come up",
html:`
${K.goals([
  "Explain what the physical layer does, and what &ldquo;the link is up&rdquo; really proves.",
  "Choose a copper category or fibre type for a job and justify it: speed, distance, interference, cost.",
  "Read an RJ45 pin-out, say which pairs 100 Mb/s and 1 Gb/s Ethernet use, and know when a crossover cable matters.",
  "Read names like 1000BASE-T and 10GBASE-LR, and spot a duplex mismatch in switch output.",
  "Troubleshoot a dead copper or fibre link in a fixed order, and bring a Cisco port up with a proper description.",
])}
${K.pre(["Lesson 1 (networks, MAC and IP addresses) and lesson 2 (what switches and routers do). No tools needed."])}

<h2>Why this matters at work</h2>
<p>Monday, 8:10 a.m., an office in Wuse II, Abuja. A new accountant's laptop is plugged into the wall socket, and Windows says <i>&ldquo;Network cable unplugged.&rdquo;</i> Upstairs, the third floor has been offline since a contractor &ldquo;tidied the comms cabinet&rdquo; over the weekend.</p>
<p>Neither problem involves IP addresses. Both are <b>physical</b>: a socket never connected at the other end, and two strands of glass plugged in the wrong way round. Engineers who check the physical layer first, in a set order, fix these in minutes. So will you.</p>

<h2>The physical layer: bits become signals</h2>
<p>A computer's data is ones and zeros, but ones and zeros can't travel down a wire. Only physical things travel: voltage changes on copper, pulses of light in glass, radio waves in the air. The ${K.g("physical layer","Layer 1 of the network models (lesson 5): cables, connectors, pin-outs, signals, speeds and distances.")} turns bits into those signals and back again.</p>
<p>In practice it means things you can hold: the <b>medium</b>, the <b>connector</b>, the <b>pin-out</b> and the <b>signal rules</b> (speed, distance). Layer 1 doesn't know what the bits mean; it only gets them to the far port without errors.</p>
<h3>What &ldquo;the link is up&rdquo; proves</h3>
<p>When you plug in a cable, the two ports signal to each other. If each hears the other and they agree on a speed, the ${K.g("link","The physical connection between two directly connected ports. 'Up' means both ends hear each other and agree on speed and duplex.")} comes <b>up</b>: a light appears and the switch logs <code>changed state to up</code>.</p>
<p>An up link proves only that Layer 1 works between those two ports — not that the user can reach the internet. But a <b>down</b> link means nothing above it can work. So check Layer 1 first: it's the foundation, and the cheapest check.</p>
${K.analogy(`<p>The physical layer is the phone line itself: is there a dial tone? Whether you both speak the same language is a higher layer. With no dial tone, there's no point checking the language.</p>`)}
${K.check({q:"A switch port's light is on and the log says the interface changed state to up. What does that prove?", o:["The user can reach the internet","The PC has a valid IP address","The two directly connected ports can hear each other","DNS is working"], a:2, why:"An up link proves Layer 1 between those two ports. Addressing, routing and DNS still need checking separately."})}

<h2>Copper: twisted pairs, categories and the RJ45 plug</h2>
<p>Open an office ${K.g("Ethernet","The family of wired LAN standards (IEEE 802.3), over copper or fibre.")} cable and you'll find <b>eight wires twisted into four pairs</b>: orange, green, blue and brown, each paired with a white wire striped in the same colour.</p>
<h3>Why the wires are twisted</h3>
<p>Wires pick up electrical noise. Some comes from neighbouring pairs, called ${K.g("crosstalk","Signal on one pair leaking onto a neighbouring pair.")}. Some comes from outside — motors, lift machinery, a diesel generator — called ${K.g("EMI","Electromagnetic interference: electrical noise from motors, power cables, generators and similar sources.")}.</p>
<p>Ethernet's defence: each pair carries the signal on one wire and its <b>mirror image</b> on the other, and the receiver looks only at the <i>difference</i>. Noise hits both wires equally, so it cancels out. Twisting keeps both wires equally exposed, and each pair has a different twist rate so pairs don't leak into each other. That's why installers untwist no more than about 13 mm when fitting a plug.</p>
<p>Most office cable is ${K.g("UTP","Unshielded twisted pair: no metal shield. Cheap, standard in offices.")}. ${K.g("STP","Shielded twisted pair: foil or braid around the pairs, for strong EMI. Must be grounded.")} adds a metal shield for noisy places — factory floors, lift rooms, beside a generator house. It's stiffer and dearer, and the shield must be grounded.</p>
<h3>Categories and the 100 m rule</h3>
<p>Cable is sold in ${K.g("categories","TIA performance grades (Cat5e, Cat6…). Higher categories are tested to higher frequencies, so they carry higher speeds.")}; higher ones are built more tightly and carry higher speeds.</p>
<div class="tablewrap"><table>
<tr><th>Category</th><th>Speed</th><th>Distance</th><th>Where</th></tr>
<tr><td><b>Cat5e</b></td><td>1 Gb/s</td><td>100 m</td><td>Older offices; fine for desks</td></tr>
<tr><td><b>Cat6</b></td><td>1 Gb/s (10 Gb/s short)</td><td>100 m; ~55 m at 10 Gb/s</td><td>Most new offices</td></tr>
<tr><td><b>Cat6a</b></td><td>10 Gb/s</td><td>100 m</td><td>New builds, fast Wi-Fi APs</td></tr>
<tr><td><b>Cat8</b></td><td>25–40 Gb/s</td><td>30 m</td><td>Data centres only</td></tr>
</table></div>
<p>For twisted-pair Ethernet, the whole channel from switch port to device must be <b>100 m or less</b>: usually up to 90 m of fixed cable in the walls plus 10 m of patch cords. Beyond that, the signal weakens and you get errors or no link.</p>
${K.mistake(`Running 130 m of copper to a camera at the far end of a compound "because it worked when we tested it". Over-length runs often fail later, in heat or under load. Beyond 100 m, use fibre or put a switch in the middle.`)}
<h3>RJ45, T568A and T568B</h3>
<p>The plug is an ${K.g("RJ45","The common name for the 8-pin modular plug used for twisted-pair Ethernet (properly 8P8C).")}. Two wiring standards set the colour order, <b>T568A</b> and <b>T568B</b>. They're identical except the <b>orange and green pairs swap</b>. Neither is better; what matters is using the site's standard at <b>both ends</b>.</p>
${K.svg("0 0 720 300",
  `<rect x="170" y="14" width="528" height="48" rx="7" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/>`+
  [1,2,3,4,5,6,7,8].map(p=>{const x=203+66*(p-1); return `<rect x="${x-7}" y="20" width="14" height="18" rx="2" fill="var(--chip)" stroke="var(--accent)"/>`+K.txt(x,55,String(p),{mid:true,c:"fg",b:true});}).join("")+
  K.txt(20,43,"RJ45 pin",{c:"fg",b:true,s:12})+
  K.txt(20,98,"T568A",{c:"fg",b:true,s:12})+K.txt(20,138,"T568B",{c:"fg",b:true,s:12})+
  K.txt(20,188,"10/100BASE-T",{c:"fg",b:true,s:12})+K.txt(20,202,"(PC side)",{s:10})+
  K.txt(20,238,"1000BASE-T",{c:"fg",b:true,s:12})+K.txt(20,252,"(pair letter)",{s:10})+
  `<rect x="174" y="80" width="130" height="68" rx="5" fill="none" stroke="var(--warn)" stroke-dasharray="4 3"/>`+
  `<rect x="306" y="80" width="58" height="68" rx="5" fill="none" stroke="var(--warn)" stroke-dasharray="4 3"/>`+
  `<rect x="504" y="80" width="58" height="68" rx="5" fill="none" stroke="var(--warn)" stroke-dasharray="4 3"/>`+
  ["wht/grn","green","wht/org","blue","wht/blu","orange","wht/brn","brown"].map((c,i)=>K.txt(203+66*i,98,c,{mid:true,c:"fg"})).join("")+
  ["wht/org","orange","wht/grn","blue","wht/blu","green","wht/brn","brown"].map((c,i)=>K.txt(203+66*i,138,c,{mid:true,c:"fg"})).join("")+
  ["TX+","TX−","RX+","unused","unused","RX−","unused","unused"].map((c,i)=>K.txt(203+66*i,195,c,{mid:true,c:(c==="unused"?"muted":"accent"),b:c!=="unused"})).join("")+
  ["A","A","B","C","C","B","D","D"].map((c,i)=>K.txt(203+66*i,245,c,{mid:true,c:"accent",b:true,s:12})).join("")+
  K.txt(360,280,"Dashed boxes: pins 1, 2, 3 and 6, the only pins that differ between T568A and T568B.",{mid:true}),
  "RJ45 pin-out. T568A and T568B swap the orange and green pairs. 10/100 Mb/s uses only pins 1, 2, 3 and 6; gigabit uses all four pairs, both ways at once.")}
<p><b>10BASE-T and 100BASE-TX use only two pairs</b>: a PC sends on pins 1,2 and receives on 3,6. <b>1000BASE-T uses all four pairs</b>, each carrying data in both directions at once. (Its IEEE standard number is ${K.g("802.3ab","The IEEE standard that defines 1000BASE-T: gigabit Ethernet over all four pairs of Cat5e or better copper, up to 100 m.")}.)</p>
${K.dyk(`Gigabit sends and receives on the same pair at the same moment. Each port subtracts its own outgoing signal from what it hears — echo cancellation, the same idea as noise-cancelling headphones.`)}
<p>That explains a classic symptom. Break one wire in the blue or brown pair and 100 Mb/s still works but gigabit can't, so many network cards fall back to 100 Mb/s. The user says &ldquo;it's slow&rdquo;; the switch shows 100 instead of 1000 — a cable fault hiding behind a speed number.</p>
<h3>Straight-through, crossover and Auto MDI-X</h3>
<p>If a PC sends on pins 1,2, the far end must receive on 1,2. So PCs, routers and servers use ${K.g("MDI","PC-style port wiring: transmit on 1,2, receive on 3,6.")} ports, and switches use ${K.g("MDI-X","Switch-style port wiring: the crossing is done inside the port (receive on 1,2, transmit on 3,6).")} ports with the crossing built in.</p>
<ul>
<li><b>Straight-through</b> (same standard both ends): for <b>unlike</b> devices — PC to switch, router to switch.</li>
<li><b>Crossover</b> (A one end, B the other): historically for <b>like</b> devices — switch to switch, PC to PC, router to router, and PC to router (both MDI).</li>
</ul>
<p>Today ${K.g("Auto MDI-X","A port feature that detects the far end's wiring and swaps its own pairs to match, so either cable type works.")} makes this mostly history: the port detects the wiring and swaps pairs itself. Exceptions: very old 10/100 kit, some industrial gear, and ports where it's off. On many Cisco switches it only works while speed and duplex are on <b>auto</b>.</p>
${K.remember(`<b>&ldquo;Like crosses, unlike goes straight.&rdquo;</b> And for pins: <b>1-2-3-6 for 10/100; gig takes all eight.</b>`)}
${K.exam(`Unless a question says Auto MDI-X is on, answer the classic way: switch–switch or PC–router = crossover; PC–switch or router–switch = straight-through. And read "STP" in context: in cabling it's shielded twisted pair, in switching it's Spanning Tree Protocol.`)}
${K.check({q:"Two old 10/100 switches without Auto MDI-X must be connected together. Which cable?", o:["Straight-through, T568B both ends","Crossover, T568A one end and T568B the other","Any cable — switches always auto-detect","A console cable"], a:1, why:"Switch to switch is like-to-like: both transmit on 3,6. A crossover puts each side's transmit pins onto the other's receive pins."})}

<h2>Ethernet names, speed and duplex</h2>
<p>Names like <code>1000BASE-T</code> follow a pattern. <b>The number</b> is the speed in Mb/s (or Gb/s with G). <b>BASE</b> means ${K.g("baseband","One signal uses the whole cable. Every Ethernet standard in use today is baseband.")}. <b>The suffix</b> is the medium: <code>T</code>/<code>TX</code> = twisted pair; for fibre, <code>S</code> = short wavelength (multimode) and <code>L</code> = long wavelength (usually single-mode) — so a 1 Gb/s fibre optic is ${K.g("SX","Short wavelength: 850 nm optics for multimode fibre, as in 1000BASE-SX (about 550 m).")} or ${K.g("LX","Long wavelength: 1310 nm optics, usually on single-mode fibre, as in 1000BASE-LX (5–10 km).")}. In 10G names, SR (short reach) and LR (long reach) mean the same idea.</p>
<div class="tablewrap"><table>
<tr><th>Standard</th><th>Speed</th><th>Medium</th><th>Typical reach</th></tr>
<tr><td>10BASE-T</td><td>10 Mb/s</td><td>Twisted pair, 2 pairs</td><td>100 m</td></tr>
<tr><td>100BASE-TX</td><td>100 Mb/s</td><td>Cat5+, 2 pairs</td><td>100 m</td></tr>
<tr><td>1000BASE-T</td><td>1 Gb/s</td><td>Cat5e+, 4 pairs</td><td>100 m</td></tr>
<tr><td>10GBASE-T</td><td>10 Gb/s</td><td>Cat6a (Cat6 short)</td><td>100 m (~55 m on Cat6)</td></tr>
<tr><td>1000BASE-SX</td><td>1 Gb/s</td><td>Multimode, 850 nm</td><td>~550 m</td></tr>
<tr><td>1000BASE-LX</td><td>1 Gb/s</td><td>Single-mode, 1310 nm</td><td>5 km (many optics 10 km)</td></tr>
<tr><td>10GBASE-SR</td><td>10 Gb/s</td><td>Multimode, 850 nm</td><td>300 m OM3 / 400 m OM4</td></tr>
<tr><td>10GBASE-LR</td><td>10 Gb/s</td><td>Single-mode, 1310 nm</td><td>10 km</td></tr>
</table></div>
<h3>Try it: pick the standard</h3>
<p>Without looking at the table, choose a standard for each link: (1) a desk PC 40 m from the switch, at 1 Gb/s; (2) a 10 Gb/s uplink between two racks 150 m apart in one building, over multimode; (3) a 10 Gb/s link to a warehouse 4 km away.</p>
${K.hint(`Ask two questions for each: copper or fibre (is it under 100 m)? If fibre, short or long (multimode or single-mode)? Then read the speed off the front of the name.`)}
${K.reveal("Show the answers",`<p>(1) <b>1000BASE-T</b> over Cat5e or Cat6 — copper, well under 100 m. (2) <b>10GBASE-SR</b> — S for short, 850 nm on multimode, and 150 m is inside its 300 m on OM3. (3) <b>10GBASE-LR</b> on single-mode — 4 km is far beyond multimode, and LR reaches 10 km.</p>`)}
<h3>Duplex and autonegotiation</h3>
<p>${K.g("Half duplex","Send or receive, never both at once, like a walkie-talkie. Collisions are possible (CSMA/CD).")} means a port sends <i>or</i> receives, never both — a leftover from hubs, where devices shared a cable and took turns. ${K.g("Full duplex","Both ends send and receive at the same time. No collisions. Normal on modern switch ports.")} means both at once, with no collisions. Every modern switch port runs full duplex, so collisions today are a warning sign.</p>
<p>Normally the ports use ${K.g("autonegotiation","Two copper ports advertise their speeds and duplex modes and pick the best common one. Required for 1000BASE-T.")}: each advertises what it can do, and both pick the best common speed in full duplex.</p>
<p>Trouble starts when someone hard-codes <i>one</i> end — say a printer set to 100 Mb/s full — and leaves the switch on auto. The printer stops advertising. The switch can still sense the <b>speed</b> from the signal, but not the <b>duplex</b>, so it falls back to <b>half</b>. That's a ${K.g("duplex mismatch","One end full duplex, the other half. Link stays up but performs badly: late collisions on the half side, CRC errors on the full side.")}. The link stays up and pings work, but big transfers crawl. On the switch:</p>
${K.out(`SW-FLOOR2#show interfaces GigabitEthernet1/0/7
GigabitEthernet1/0/7 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 7c21.0e4a.9b07 (bia 7c21.0e4a.9b07)
  Description: PRINTER-2F-ACCOUNTS
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
  [... lines trimmed ...]
  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  [... lines trimmed ...]
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
  [... lines trimmed ...]
     0 babbles, 412 late collision, 0 deferred`, "show interfaces on a switch port facing a printer hard-coded to 100/full.")}
<ul>
<li><b>up, line protocol is up</b> — Layers 1 and 2 look fine, so mismatches go unnoticed for months.</li>
<li><b>${K.g("BW","Bandwidth: the speed IOS records for the link, in kilobits per second. 100000 Kbit/sec = 100 Mb/s.")} 100000 Kbit/sec</b>, <b>100Mb/s</b> — a gigabit port forced down to 100 by the printer.</li>
<li><b>Half-duplex</b> — the switch couldn't learn the duplex; the printer is full. The mismatch.</li>
<li><b>412 late collision</b> — the giveaway; healthy links never have them. The printer's side would count ${K.g("CRC","Cyclic Redundancy Check: the maths check on every frame's trailer. A CRC error means a frame arrived damaged and was thrown away.")} errors.</li>
</ul>
${K.exam(`If a question describes a link that is <i>up</i> but slow, with late collisions or CRC errors, think duplex mismatch first. Late collisions point to the half-duplex side.`)}
<p>The fix: <b>auto on both ends</b>. If a device truly needs fixed settings, set <b>both</b> ends the same (on Cisco: <code>speed 100</code> and <code>duplex full</code>).</p>
${K.check({q:"A switch port shows 'Half-duplex, 100Mb/s' and rising late collisions. The device was manually set to 100 Mb/s full duplex. What's wrong?", o:["The cable is over 100 m","A duplex mismatch from hard-coding one end","The port is administratively down","It needs a crossover cable"], a:1, why:"The hard-coded side stops advertising, so the auto side falls back to half duplex. Late collisions on the half side are the classic sign."})}

<h2>Fibre: data as light</h2>
<p>Copper stops at 100 m and suffers from electrical noise. To go further, you use ${K.g("fibre","Fibre-optic cable: strands of very pure glass carrying data as pulses of light.")}. A laser or LED flashes on and off billions of times a second; on and off are the bits. The glass has a <b>core</b> wrapped in <b>cladding</b> that bends light slightly less, so light hitting the boundary bounces back into the core and travels on, even round gentle bends.</p>
<p>Light in glass is <b>immune to EMI</b> and doesn't conduct electricity. A copper cable between two buildings can carry a lightning surge into your switches; glass can't. In a rainy-season storm in Lagos, that can save a pair of switches.</p>
${K.mistake(`Looking into a fibre end or optic "to see if light is coming out". The light is mostly invisible infrared and lasers can damage your eye. Use a light meter or the switch's optical readings.`)}
<h3>Single-mode vs multimode</h3>
<p>${K.g("Multimode fibre","MMF: wide core, many light paths, hundreds of metres.")} (MMF) has a wide core, 50 or 62.5 µm. Light takes many paths (<b>modes</b>) of slightly different lengths, so pulses spread out and blur after a few hundred metres. It suits <b>short runs</b> inside buildings, with cheaper 850 nm optics. Jacket: <b>aqua</b> (OM3/OM4) or <b>orange</b> (OM1/OM2).</p>
<p>${K.g("Single-mode fibre","SMF: tiny core, one light path, kilometres.")} (SMF) has a ~9 µm core, so light travels essentially <b>one path</b> and pulses stay sharp for <b>kilometres</b>. It needs precise 1310 or 1550 nm lasers, so optics cost more. Jacket: <b>yellow</b>. Campus links and the fibre MainOne or MTN brings to your building are single-mode.</p>
${K.analogy(`<p>Multimode is a wide corridor where people walk at slightly different angles: they arrive spread out, so it must be short. Single-mode is a narrow tube that forces single file: everyone arrives in order, however long the walk.</p>`)}
${K.dyk(`A single-mode core is about 9 µm across — roughly a tenth of the width of a human hair. That is why one speck of dust on a connector can kill a link.`)}
<div class="tablewrap"><table>
<tr><th></th><th>Copper (UTP)</th><th>Multimode fibre</th><th>Single-mode fibre</th></tr>
<tr><td>Reach</td><td>100 m</td><td>~300–550 m</td><td>10 km and beyond</td></tr>
<tr><td>EMI / lightning</td><td>Affected; conducts surges</td><td>Immune; no conduction</td><td>Immune; no conduction</td></tr>
<tr><td>Carries PoE</td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>Cost</td><td>Cheapest; easy to terminate</td><td>Cheaper optics</td><td>Dearer optics</td></tr>
<tr><td>Typical use</td><td>Desks, phones, APs, cameras</td><td>Uplinks within a building</td><td>Between buildings, ISP links</td></tr>
</table></div>
${K.when([
  ["Copper UTP (Cat6/6a)","Devices within 100 m of the switch","Cheap, easy to terminate, carries PoE","Over 100 m, between buildings, beside heavy EMI"],
  ["Multimode + SR optics","Uplinks inside a building or data centre","Cheaper optics; ample reach for a few hundred metres","Beyond ~300–550 m"],
  ["Single-mode + LR optics","Between buildings, sites, ISP handoffs","Kilometres of reach; immune to EMI and lightning","Short in-rack runs, where it's needless cost"],
  [K.g("DAC cable","Direct-attach copper: a short cable with SFP+/QSFP ends moulded on, for runs of a few metres."),"Switch to server in the same rack","Cheapest 10G+ option over a few metres","Anything beyond a few metres"],
], "Which medium for which link")}
<h3>Connectors and Tx/Rx</h3>
<p>The common connectors are <b>${K.g("LC","Lucent Connector: a small fibre connector with a latch, named after the company that designed it.")}</b> (small, latching, usually clipped in pairs — the standard on SFP optics) and <b>${K.g("SC","Subscriber Connector: an older, larger square fibre connector that pushes in and pulls out.")}</b> (larger, square, push-pull — older panels and ISP kit). In data centres you'll also see multi-fibre ${K.g("MPO","Multi-fibre Push-On: one connector carrying 8, 12 or more fibres at once, used for high-speed links in data centres.")}.</p>
<p>A fibre link uses <b>two strands</b>, one each way. Each optic has a ${K.g("Tx","Transmit: the side that sends.")} and an ${K.g("Rx","Receive: the side that listens.")} side, and each Tx must reach the far Rx. Duplex patch cords cross over for you — until someone unclips a pair and plugs the halves back reversed.</p>
${K.svg("0 0 720 240",
  K.dev("switch",70,112,"CORE-SW","Te1/1/1")+
  K.box(130,70,120,84,"SFP+ optic","10GBASE-LR",true)+
  K.txt(244,98,"Tx",{end:true,c:"accent",b:true})+K.txt(244,140,"Rx",{end:true,c:"accent",b:true})+
  K.box(470,70,120,84,"SFP+ optic","10GBASE-LR",true)+
  K.txt(476,98,"Rx",{c:"accent",b:true})+K.txt(476,140,"Tx",{c:"accent",b:true})+
  K.dev("switch",650,112,"FLOOR3-SW","Te1/1/1")+
  K.arrow(254,94,466,94,"strand 1: light this way",true)+
  K.arrow(466,136,254,136,"strand 2: light this way",true)+
  K.link(96,112,130,112)+K.link(590,112,624,112)+
  K.txt(360,200,"Correct: each Tx reaches the far Rx. Swap the strands at one end",{mid:true})+
  K.txt(360,218,"and Tx faces Tx: neither receiver gets light, and the link stays down.",{mid:true}),
  "A duplex fibre link: two strands, one each way. Tx must land on Rx.")}
<p>For a fibre link that won't come up: <b>clean it, check the optics match, then swap Tx and Rx at one end</b>. Dirt is the most common fibre fault — a speck on a 9 µm core blocks much of the light.</p>
${K.check({q:"Two campus buildings 2 km apart need a 10 Gb/s link. Which fits?", o:["Cat6a UTP","Multimode with 10GBASE-SR","Single-mode with 10GBASE-LR","Cat8"], a:2, why:"2 km is beyond copper (100 m) and multimode (hundreds of metres). LR on single-mode reaches 10 km, and glass keeps lightning out of both buildings."})}
${K.q({type:"multi", q:"Which two are real advantages of fibre over copper UTP? (Choose two.)", o:["It is immune to electrical noise (EMI) and cannot carry a lightning surge between buildings","It can reach far beyond 100 m: hundreds of metres on multimode, kilometres on single-mode","It can power phones and access points with PoE","It is always faster than copper at the same standard","Its connectors are cheaper and easier to terminate"], a:[0,1], why:"Fibre's real advantages are distance and immunity to EMI, because glass carries light and does not conduct electricity. Speed is set by the standard, not the medium (10GBASE-T and 10GBASE-SR are both 10 Gb/s). Only copper carries PoE, and copper is the cheaper, easier cable to terminate."})}

<h2>Transceivers, PoE, lights and structured cabling</h2>
<h3>SFPs: why ports are modular</h3>
<p>Many business switches have empty slots for ${K.g("transceivers","Plug-in modules (optics) that convert a switch's signals for a particular medium and distance.")}: hot-swappable modules that match the port to the link. <b>SFP</b> = 1 Gb/s, <b>SFP+</b> = 10 Gb/s, <b>SFP28</b> = 25 Gb/s, <b>${K.g("QSFP","Quad Small Form-factor Pluggable: a wider SFP-style module that runs four lanes side by side, giving 40 Gb/s (QSFP+) or 100 Gb/s (QSFP28).")}+</b>/<b>QSFP28</b> = 40/100 Gb/s.</p>
<p>Ports are modular because the switch can't know the link in advance: one model may need a multimode optic in one building and a 10 km single-mode optic in another. A failed optic is a palm-sized swap, not a new switch. Two rules: optics must <b>match each other</b> (SR with SR, LR with LR) and <b>match the fibre</b> (SR on multimode, LR on single-mode). Some switches warn about or refuse other vendors' optics.</p>
<h3>Power over Ethernet</h3>
<p>${K.g("PoE","Power over Ethernet: DC power sent down the same copper cable as the data.")} powers phones, access points and IP cameras down the data cable, so ceiling devices need no socket and one comms-room UPS keeps them alive through a power cut. <b>802.3af</b> gives up to 15.4 W per port, <b>802.3at</b> (PoE+) 30 W, <b>802.3bt</b> 60 W or 90 W. Each switch has a <b>total budget</b> (say 370 W); exceed it and the last devices get no power — a camera that &ldquo;won't come on&rdquo; can be a budget problem.</p>
<h3>Reading the lights</h3>
<p>Patterns vary by model, but on many Cisco switches: <b>off</b> = no link (nothing connected, bad cable, far end off, or port shut); <b>solid green</b> = link; <b>flashing green</b> = traffic; <b>amber</b> = not forwarding yet — normal for up to about 30 seconds after plugging in while the switch checks for loops, a problem if it stays; <b>alternating green/amber</b> = a link fault, often a bad cable.</p>
${K.myth([
  ["A green light means the network is working.","Green proves only Layer 1. Speed, duplex, VLAN and the IP address can all still be wrong."],
  ["Fibre is faster than copper.","Speed is set by the standard, not the medium: 10GBASE-T and 10GBASE-SR are both 10 Gb/s. Fibre's real advantages are distance and immunity to EMI."],
  ["Cat6 always gives you 10 Gb/s.","Only up to about 55 m. For 10 Gb/s over the full 100 m you need Cat6a."],
  ["Shielded cable is always better.","Only near strong EMI, and only if grounded properly. A badly grounded shield can make noise worse."],
  ["You need a crossover cable between two switches.","Not on modern ports: Auto MDI-X swaps pairs itself. Crossovers matter only on old or unusual kit."],
])}
<h3>Structured cabling, labels and testers</h3>
<p>In a professional building, desk cables follow ${K.g("structured cabling","A standard building layout (TIA-568): outlets wired by fixed horizontal cables to patch panels, then patch cords to switches; fibre backbones join comms rooms.")}:</p>
${K.svg("0 0 740 260",
  K.dev("pc",45,100,"Desk PC","Finance")+
  K.box(110,80,80,40,"Outlet","3-22")+
  K.box(330,75,110,50,"Patch panel","3 · port 22")+
  K.dev("switch",545,100,"Access switch","Gi1/0/22")+
  K.dev("switch",690,100,"Core","MDF")+
  K.link(63,100,110,100,"cord")+
  K.link(190,100,330,100,"horizontal · ≤ 90 m",true)+
  K.link(440,100,519,100,"patch cord")+
  K.link(571,100,664,100,"fibre")+
  K.band(15,185,180,24,"work area")+K.band(200,185,125,24,"walls / ceiling")+K.band(330,185,280,24,"comms room (IDF)")+K.band(615,185,115,24,"core (MDF)")+
  K.txt(360,240,"Whole copper channel, desk port to switch port: ≤ 100 m (90 m fixed + 10 m of cords)",{mid:true}),
  "Structured cabling: outlet → fixed horizontal cable → patch panel → patch cord → switch, with a fibre backbone to the core.")}
<p>The desk's cord plugs into a numbered <b>outlet</b> (<code>3-22</code>). A fixed <b>horizontal cable</b> runs in the walls to the same-numbered port on a ${K.g("patch panel","A rack panel of numbered sockets where building cables end; patch cords link each port to a switch port.")} in the comms room. A short <b>patch cord</b> joins that panel port to a switch port; only patch cords move when people change desks. So a new desk can be &ldquo;dead&rdquo; because nobody patched its panel port — which is why every outlet, panel port and cord end needs a <b>label</b>, and a record of which outlet goes to which switch port.</p>
<p>Tools: a <b>cable tester</b> finds breaks, shorts and ${K.g("split pairs","Pins connected end to end, but the wrong wires twisted together. Continuity passes; crosstalk fails.")}; a <b>certifier</b> proves a cable meets its category; a <b>toner and probe</b> finds an unlabelled cable; for fibre, an <b>inspection scope</b>, cleaning kit and <b>light meter</b>.</p>
${K.check({q:"A new desk's outlet 3-22 tests fine, but the PC says 'Network cable unplugged'. Where's the most likely fault?", o:["The PC's IP settings","DNS","Panel 3 port 22 isn't patched to the switch, or the switch port is shut","The fibre backbone"], a:2, why:"The horizontal cable is fine, so the gap is in the comms room. 'Cable unplugged' means no link at all, so IP and DNS aren't the issue yet."})}
${K.q({type:"match", q:"Match each transceiver type with its speed.", pairs:[["SFP","1 Gb/s"],["SFP+","10 Gb/s"],["SFP28","25 Gb/s"],["QSFP28","100 Gb/s"]], why:"The same palm-sized slot family scales up: SFP is 1 Gb/s, SFP+ 10 Gb/s, SFP28 25 Gb/s, and the wider QSFP+ and QSFP28 carry 40 and 100 Gb/s. Whatever the speed, the two optics on a link must match each other and the fibre type."})}

<h2>When a link won't come up: check in this order</h2>
<p>Don't start with what you know best. Work bottom-up, cheapest and likeliest first:</p>
${K.steps([
  ["Is it connected at both ends?", `<p>Check the desk end, then follow the label to the comms room. Is the panel port patched to a switch port? Is every plug clicked in?</p>`],
  ["What do the lights say?", `<p>No light at either end = no physical link. Amber that stays, or green/amber alternating = a link with a problem.</p>`],
  ["What does the switch say?", `<p><code>show ip interface brief</code>: <b>administratively down</b> = shut in config. <b>down/down</b> = no signal from the far end — physical. <b>err-disabled</b> (in <code>show interfaces status</code>) = shut automatically by the switch.</p>`],
  ["Swap the cheap parts", `<p>Known-good patch cords at both ends; a different laptop on the outlet; the laptop on a different outlet; then a cable tester on the horizontal run.</p>`],
  ["Speed and duplex", `<p>Up but slow or erroring? Compare both ends. Auto on both is the goal. Gigabit stuck at 100 suggests a damaged pair.</p>`],
  ["Fibre: optics, cleaning, polarity", `<p>Matching optics, right for the fibre type. Clean and inspect. Check receive light levels. Then swap Tx/Rx at one end.</p>`],
  ["The end device", `<p>Adapter disabled in Windows? Device powered — or PoE budget exhausted? Only now move up to addressing.</p>`],
])}
${K.remember(`<b>&ldquo;Follow the cable before you follow the config.&rdquo;</b> Plug → lights → port state → parts → speed/duplex → strands → station.`)}
${K.dodont([
  "Label both ends of every cable, and update the cabling record when you patch.",
  "Leave speed and duplex on auto at both ends — or hard-code both the same.",
  "Inspect and clean every fibre connector before plugging it in.",
  "Swap in a known-good patch cord early; it's the cheapest test there is.",
  "Keep fibre caps on unused optics and cords.",
],[
  "Don't untwist more than about 13 mm of a pair when terminating.",
  "Don't run copper beyond 100 m, or bend fibre into tight loops.",
  "Don't look into a fibre end or an optic port.",
  "Don't hard-code speed or duplex on one end only.",
  "Don't restart the switch for a single dead port — it disconnects everyone else.",
])}
${K.out(`SW-FLOOR3#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  unassigned      YES unset  administratively down down
GigabitEthernet1/0/1   unassigned      YES unset  up                    up
GigabitEthernet1/0/2   unassigned      YES unset  down                  down
GigabitEthernet1/0/3   unassigned      YES unset  administratively down down`, "show ip interface brief on a Catalyst switch. Access ports hold no IP address, so 'unassigned' is normal.")}
<ul>
<li><b>GigabitEthernet1/0/2</b> = switch 1, module 0, port 2; type it as <code>Gi1/0/2</code>.</li>
<li><b>Gi1/0/1 up / up</b> — healthy: Status is Layer 1, Protocol is Layer 2.</li>
<li><b>Gi1/0/2 down / down</b> — enabled, but no signal from the far end. Go and look at cables.</li>
<li><b>Gi1/0/3 administratively down / down</b> — it has <code>shutdown</code> configured. Cables won't fix this; configuration will.</li>
</ul>
${K.tip(`Many companies shut every unused port so a visitor can't plug into a spare wall socket and land on the internal network. A new desk then needs <b>two</b> fixes: a patch cord in the comms room <i>and</i> <code>no shutdown</code> on the switch.`)}
<h3>Hands-on: bring a desk port up properly</h3>
<p>This switch shuts unused ports by policy. The new accountant's outlet is patched to <code>Gi0/1</code>. Enable it the professional way — with a description for the next engineer — and verify. The simulator's far end is always plugged in, so the port comes straight up; on a real switch, <b>down/down</b> at this point would mean the remaining fault is physical.</p>
${K.hint(`The path is <code>enable</code> → <code>configure terminal</code> → <code>interface g0/1</code>. The prompt tells you where you are: <code>#</code>, then <code>(config)#</code>, then <code>(config-if)#</code>. Description and <code>no shutdown</code> are typed at <code>(config-if)#</code>.`)}
${K.term({env:"ios", title:"enable a new desk port", opts:{host:"SW-FLOOR3", kind:"switch",
  motd:"SW-FLOOR3 — console session. Unused ports are shut by policy. You are at user EXEC (the > prompt)."},
  setup:env=>{ env.intfs = {
    "GigabitEthernet0/0":{ip:null,mask:null,shut:false,vlan:1,mode:"trunk",allowed:null,desc:"UPLINK to CORE-SW Te1/1/1"},
    "GigabitEthernet0/1":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null},
    "GigabitEthernet0/2":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null} }; },
  intro:"Start with <code>enable</code>. Inside configuration mode, put <code>do</code> in front of a show command to run it.",
  tasks:[
    {text:"Run <code>show ip interface brief</code> (after <code>enable</code>) — Gi0/1 should be <i>administratively down</i>", done:e=>e.history.some(h=>/^\s*(do\s+)?sh(ow)?\s+ip\s+int/i.test(h))},
    {text:"<code>configure terminal</code>, <code>interface g0/1</code>, then <code>description DESK-3.22 FINANCE</code>", done:e=>!!(e.intfs["GigabitEthernet0/1"].desc && e.intfs["GigabitEthernet0/1"].desc.trim())},
    {text:"Bring it up with <code>no shutdown</code> — watch for <i>changed state to up</i>", done:e=>e.intfs["GigabitEthernet0/1"].shut===false},
    {text:"Verify with <code>do show ip interface brief</code> — Gi0/1 should be up / up", done:e=>{ const h=e.history; let ns=-1, sh=-1; h.forEach((x,i)=>{ if(/^\s*no\s+sh/i.test(x)) ns=i; if(/^\s*(do\s+)?sh(ow)?\s+ip\s+int/i.test(x)) sh=i; }); return e.intfs["GigabitEthernet0/1"].shut===false && ns>-1 && sh>ns; }},
    {text:"<code>end</code>, then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"Labelled, enabled, verified and saved. Had it stayed down/down, you'd head to the patch panel, not the PC.",
  solve:["enable","show ip interface brief","configure terminal","interface g0/1","description DESK-3.22 FINANCE","no shutdown","do show ip interface brief","end","copy running-config startup-config"]})}
<p>After <code>no shutdown</code>, <code>%LINK-3-UPDOWN</code> is Layer 1 coming up and <code>%LINEPROTO-5-UPDOWN</code> is Layer 2 following. Run <code>show running-config</code> and your description now sits under <code>interface GigabitEthernet0/1</code>.</p>

${K.job("A new starter's desk port is dead",`
<p><b>The ticket.</b> &ldquo;New staff, Finance, desk 3-22. Laptop says network cable unplugged. Urgent.&rdquo;</p>
<p><b>Questions.</b> &ldquo;Is there a label on the wall socket?&rdquo; — <i>&ldquo;3-22.&rdquo;</i> &ldquo;Did anyone use this desk before?&rdquo; — <i>&ldquo;No, it's new.&rdquo;</i> A new desk with no link at all points to the physical path.</p>
<p><b>Checks.</b> Her laptop works on a colleague's outlet, so the laptop is fine; a known-good cord changes nothing at 3-22. In the comms room, panel 3 port 22 has <b>no patch cord</b>. The cabling sheet maps it to <code>Gi1/0/22</code> on SW-FLOOR3, and <code>show interfaces status</code> shows that port <code>disabled</code> — shut by policy.</p>
<p><b>Fix.</b> A labelled cord from P3-22 to <code>Gi1/0/22</code>; on the switch, <code>description DESK-3.22 FINANCE</code>, the staff VLAN (VLANs come later), <code>no shutdown</code>, save. The LED goes amber, then green. <code>show interfaces status</code> shows <code>connected ... a-full a-1000</code> — auto-negotiated full duplex at 1 Gb/s — and her laptop gets a DHCP address.</p>
<p><b>What you say.</b> &ldquo;You're connected. Your desk socket was new and hadn't been linked to the network in the comms room. That's done, so it'll keep working.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Desk 3-22 no link. Laptop OK elsewhere; known-good cord no change. Cause: P3-22 never patched; Gi1/0/22 shut (unused-port policy). Patched P3-22 to SW-FLOOR3 Gi1/0/22, description added, staff VLAN, no shut, saved. Verified a-full/a-1000, DHCP OK, user logged in. Cabling sheet updated. 25 min.&rdquo;</i></p>`)}

${K.case("A whole floor offline after a weekend tidy-up",`
<p>A logistics firm in Ikeja links each floor's switch to the core over single-mode fibre with 10GBASE-LR optics. A contractor re-dressed the core rack's patch cords over the weekend. On Monday, floor 3 alone was dead — no Wi-Fi, desks or phones.</p>
<p>Only floor 3 affected meant only floor 3's uplink. The core port showed <b>down/down</b>; optical readings showed both ends transmitting normally but <i>no light received</i> at either end. Both sending, neither receiving, right after the cords were handled: polarity. The contractor had unclipped a duplex LC and refitted the halves reversed.</p>
<p>The engineer cleaned both ends and swapped the connectors at the core end only; the link came up in seconds. The firm now labels each strand A and B and photographs racks before and after contractor work. The outage took 50 minutes; with a physical-layer checklist, it could have taken five.</p>`)}
${K.mistake(`Swapping Tx and Rx at <b>both</b> ends. The two swaps cancel out and the link stays down. Swap at one end only.`)}

<h2>Hands-on: cable a floor, from desk to core</h2>
<p>Time to do it with your hands. This bench is a small slice of a real building: an access switch on the third floor, the core switch in the comms room, a server already patched into the core, and an empty desk PC. Everything you learned in this lesson is in play: copper to the desk, transceivers and fibre for the uplink, matching optics, and a fibre link that won't come up.</p>
${K.bench({id:"m1-floor-fibre", points:80, from:"CCNA · Module 1 · lesson 3", title:"third floor to the comms room", viewBox:"0 0 760 470",
  intro:"Click a port to inspect it (cable type, link state and why it's down). Pick items from the tray to insert or plug. <i>Two uplinks between the same two switches would normally have Spanning Tree block one of them — you'll meet that in a later module.</i>",
  devices:[
    {id:"core", kind:"switch", label:"CORE-SW", model:"Catalyst 9300 · comms room", x:300, y:20, sfp:{g9:"sfp-sx", g10:"sfp-lx"}},
    {id:"acc", kind:"switch", label:"FLOOR3-SW", model:"Catalyst 9200 · floor 3 cabinet", x:40, y:190, sfp:{g10:"sfp-lx"}},
    {id:"pc1", kind:"pc", label:"DESK-3-14", x:60, y:350, ip:"10.10.0.31", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"srv", kind:"server", label:"APP-SRV", x:620, y:190, ip:"10.10.0.20", mask:"255.255.255.0", gw:"10.10.0.1"},
  ],
  cables:[ {type:"smf", a:"acc:g10", b:"core:g10", swapped:true}, {type:"cat6", a:"srv:eth", b:"core:g1"} ],
  tray:["cat6","xover","mmf","smf","sfp-sx","sfp-lx"],
  tasks:[
    {text:"FLOOR3-SW port 9 needs an optic that matches the core's port 9 (click core port 9 to see what it has). Insert the right SFP", done:B=>B.devs.acc.ports.find(p=>p.id==="g9").sfp==="sfp-sx"},
    {text:"Run the right type of fibre between FLOOR3-SW port 9 and CORE-SW port 9 — both lights green", done:B=>Bench.up(B,"acc:g9","core:g9")},
    {text:"The second uplink (port 10 to port 10) is cabled but dark. Click it, read why, and fix it", done:B=>Bench.up(B,"acc:g10","core:g10")},
    {text:"Patch desk PC <b>DESK-3-14</b> into FLOOR3-SW with copper", done:B=>Bench.upAt(B,"pc1:eth")},
    {text:"From DESK-3-14's Command Prompt, <code>ping 10.10.0.20</code> (the app server) and get replies", done:B=>Bench.pinged(B,"pc1","10.10.0.20")},
  ],
  win:"You matched optics to the fibre, fixed a polarity fault and proved a desk can reach a server across the building — the exact physical-layer work a field engineer does on a fit-out.",
  solve:[["insert","acc:g9","sfp-sx"],["plug","mmf","acc:g9","core:g9"],["flip","acc:g10"],["plug","cat6","pc1:eth","acc:g1"],["pc","pc1","ping 10.10.0.20"]]})}
${K.hint("Try the wrong things on purpose: put an LX module in port 9, or use yellow single-mode fibre with the SX optics, and click the port to read why the link stays down. That message is the diagnosis you'd be making with a light meter and the switch logs on a real job.")}

<h2>Interview corner</h2>
${K.hint(`Structure it: core size → how light travels → distance → light source and cost → jacket colour → where you would use each.`)}
${K.reveal("“What's the difference between single-mode and multimode fibre?”",`<p>"Multimode has a wide core, 50 or 62.5 microns, so light takes many paths. That spreads pulses and limits it to a few hundred metres — 10GBASE-SR does about 300 m on OM3. It uses cheaper 850 nm optics; the jacket is usually aqua or orange. Single-mode has a ~9 micron core, so light takes one path and stays sharp over kilometres — 10GBASE-LR does 10 km. It uses 1310 or 1550 nm lasers, so optics cost more; the jacket is yellow. Multimode inside buildings, single-mode between buildings and for ISP links — and the optics must match each other and the fibre."</p>`)}
${K.hint(`Say what a crossover was for, why Auto MDI-X made it rare, then name the exceptions.`)}
${K.reveal("“When would you need a crossover cable today?”",`<p>"Rarely. Crossovers were for like devices — switch to switch, PC to PC, router to router — because both ends transmit on the same pins. Auto MDI-X now detects the wiring and swaps pairs automatically on almost every port. I'd still need one with very old 10/100 gear, some industrial devices, or a port with Auto MDI-X off — on many Cisco switches it depends on speed and duplex being auto. A crossover is T568A at one end and T568B at the other."</p>`)}
${K.hint(`Think about which pins 100 Mb/s needs and which gigabit needs. Settings first, then the cable.`)}
${K.reveal("“A user's port shows 100 Mb/s instead of 1 Gb/s. What do you check?”",`<p>"First, speed and duplex on both ends, in case either was hard-coded. If both are auto, I suspect the cable: 100BASE-TX needs only pins 1, 2, 3 and 6, but gigabit needs all four pairs, so a broken blue or brown wire, a bad crimp or an old Cat5 cord makes the card fall back to 100. I'd swap the patch cords, then test the permanent link, and check the interface for errors and half duplex."</p>`)}

${K.recap([
  "The physical layer moves bits as voltage, light or radio. An up link proves only that two ports hear each other.",
  "Twisted pairs cancel noise; UTP for offices, grounded STP near strong EMI.",
  "Cat5e/Cat6 = 1 Gb/s, Cat6a = 10 Gb/s, Cat8 = 25–40 Gb/s at 30 m. Copper channel limit: 100 m.",
  "T568A/B swap orange and green. 10/100 uses pins 1, 2, 3, 6; gigabit uses all four pairs.",
  "Straight-through for unlike devices, crossover for like — Auto MDI-X makes either work on modern ports.",
  "Duplex mismatch: link up, slow, late collisions on the half side. Auto on both ends, or the same fixed settings on both.",
  "Multimode: wide core, 850 nm, hundreds of metres. Single-mode: 9 µm core, lasers, kilometres, yellow. Tx must reach Rx.",
  "Dead link: patching → lights → port state → swap cords → speed/duplex → optics and polarity → end device.",
])}
${K.next(`<b>Lesson 4 — Topologies.</b> You know how one link works. Next: how many links are arranged into whole networks — star, mesh, two- and three-tier designs, spine-leaf, and the office and WAN layouts you'll meet at work.`)}
`,
quiz:[
  {lvl:1, q:"What is the maximum channel length for 1000BASE-T over Cat5e or Cat6 copper?", o:["55 m","100 m","300 m","550 m"], a:1, why:"Twisted-pair Ethernet is limited to 100 m: up to 90 m fixed cable plus up to 10 m of patch cords."},
  {lvl:1, q:"Why are the wires in UTP cable twisted in pairs?", o:["To make the cable more flexible","So it can carry PoE","To cancel noise and reduce crosstalk between pairs","To tell T568A from T568B"], a:2, why:"Twisting exposes both wires of a pair equally to noise, which differential signalling cancels; different twist rates reduce crosstalk."},
  {lvl:1, q:"Which pins does 100BASE-TX use?", o:["1, 2, 3 and 6","4, 5, 7 and 8","All eight","1, 2, 4 and 5"], a:0, why:"10BASE-T and 100BASE-TX use pins 1,2 and 3,6. 1000BASE-T uses all four pairs."},
  {lvl:1, q:"Without Auto MDI-X, which connection historically required a crossover cable?", o:["PC to switch","Router to switch","Switch to switch","Printer to switch"], a:2, why:"Like devices (switch–switch, PC–PC, router–router, PC–router) need a crossover; unlike devices use straight-through."},
  {lvl:1, q:"In 10GBASE-LR, what do '10G' and 'LR' tell you?", o:["10 Gb/s over twisted pair, long run","10 Gb/s over single-mode fibre, long reach (1310 nm)","10 Gb/s over multimode, low resistance","100 Mb/s over fibre, long reach"], a:1, why:"10G = 10 Gb/s; LR is the long-reach single-mode standard, about 10 km."},
  {lvl:2, q:"A switch port is on auto; the server is hard-coded to 100 Mb/s full duplex. Most likely result?", o:["The link stays down","100 Mb/s half duplex on the switch — a duplex mismatch","1 Gb/s full on both","100 Mb/s full on both"], a:1, why:"The hard-coded side stops advertising; the auto side senses speed but not duplex, and falls back to half."},
  {lvl:1, q:"Which statement about single-mode fibre is TRUE?", o:["It has a 50 or 62.5 µm core for short runs","It typically uses 850 nm light sources","It has a ~9 µm core and reaches kilometres using lasers","Its jacket is normally aqua"], a:2, why:"Single-mode: ~9 µm core, 1310/1550 nm lasers, long distances, yellow jacket. The others describe multimode."},
  {lvl:2, q:"A new fibre link is down. Both optics are 10GBASE-LR on single-mode, connectors are clean, and both ends transmit but neither receives light. Next step?", o:["Replace the fibre with Cat6a","Swap Tx and Rx at one end","Change both optics to SR","Swap Tx and Rx at both ends"], a:1, why:"Both sending, neither receiving = Tx facing Tx. Swap at one end only; swapping both cancels out."},
  {lvl:1, q:"Which PoE standard provides up to 30 W per port?", o:["802.3af","802.3at (PoE+)","802.3bt Type 4","802.3ab"], a:1, why:"802.3af = 15.4 W, 802.3at = 30 W, 802.3bt = 60/90 W. 802.3ab is 1000BASE-T."},
  {lvl:1, q:"'show ip interface brief' shows a port as 'administratively down / down'. Meaning?", o:["The cable is broken","The far-end device is off","The port is disabled with the shutdown command","A duplex mismatch"], a:2, why:"Administratively down = shut in configuration; fix with no shutdown. A physical fault shows as down / down."},
  {lvl:1, type:"multi", q:"On older equipment without Auto MDI-X, which two connections use a straight-through cable? (Choose two.)", o:["PC to switch","Router to switch","Switch to switch","PC to router","Router to router"], a:[0,1], why:"Like crosses, unlike goes straight. A PC or router port (MDI) connecting to a switch port (MDI-X) needs straight-through, because the switch does the crossing inside the port. Switch to switch, router to router and PC to router are like-to-like (both ends transmit on the same pins), so they need a crossover."},
  {lvl:1, type:"order", q:"A desk's copper link will not come up. Put these checks in the order the lesson recommends.", items:["Check the cable is connected and patched at both ends","Read the port lights at both ends","Check the port state on the switch with show ip interface brief","Swap in known-good patch cords and test the horizontal cable","Compare speed and duplex settings at both ends","Check the end device: adapter enabled, powered, PoE budget"], why:"Work bottom-up, cheapest and likeliest first: a missing patch cord or unclipped plug is found in seconds, lights and port state tell you whether the problem is physical or configuration, then swap cheap parts, then look at negotiation, and only then at the device itself. Addressing comes after all of this."},
  {lvl:1, type:"match", q:"Match each Ethernet standard with its medium and typical reach.", pairs:[["100BASE-TX","Copper, two pairs, 100 m"],["1000BASE-T","Copper, all four pairs, 100 m"],["1000BASE-SX","Multimode fibre, 850 nm, about 550 m"],["10GBASE-SR","Multimode fibre, 850 nm, about 300 m on OM3"],["10GBASE-LR","Single-mode fibre, 1310 nm, 10 km"]], why:"The number is the speed, T means twisted pair, S means short wavelength on multimode and L means long wavelength on single-mode. Copper always stops at 100 m; 100 Mb/s needs only pins 1, 2, 3 and 6, while gigabit uses all eight wires."},
  {lvl:2, type:"fill", q:"A printer truly needs fixed settings of 100 Mb/s full duplex. Which two interface commands do you type on the Cisco switch port so both ends match?", fields:[{label:"Speed command", a:["speed 100"], ios:true},{label:"Duplex command", a:["duplex full"], ios:true}], why:"If one end is hard-coded and the other left on auto, the auto side can sense the speed but not the duplex and falls back to half duplex, causing a mismatch. The rule: auto on both ends, or the same fixed values on both ends, which on Cisco means speed 100 and duplex full under the interface."},
  {lvl:3, q:"A user complains that file copies to the server are slow. Their laptop has a gigabit card, and both the laptop and the switch port are on auto. You see this on the switch. What is the most likely cause?", ex:"SW-FLOOR2#show interfaces status\n\nPort      Name               Status       Vlan       Duplex  Speed Type\nGi1/0/11  DESK-2.11 ACCTS    connected    20         a-full a-1000 10/100/1000BaseTX\nGi1/0/12  DESK-2.12 ACCTS    connected    20         a-full  a-100 10/100/1000BaseTX\nGi1/0/13                     notconnect   20           auto   auto 10/100/1000BaseTX", o:["A duplex mismatch on Gi1/0/12","A damaged wire in the blue or brown pair, or an old Cat5 cord, so the link fell back to 100 Mb/s","Gi1/0/12 is administratively down","The port needs a crossover cable"], a:1, why:"The user's port Gi1/0/12 auto-negotiated full duplex (a-full), so it is not a duplex mismatch, but only 100 Mb/s (a-100) while its neighbour runs at a-1000. 100 Mb/s needs only pins 1, 2, 3 and 6; gigabit needs all four pairs. A broken wire in the blue or brown pair, a bad crimp or an old cord makes the card fall back to 100. Swap the patch cords, then test the permanent link."},
  {lvl:3, q:"The finance printer prints very slowly and some jobs fail. The vendor set up the printer last week; the switch port is on auto. Based on the exhibit, what is the cause and the fix?", ex:"SW-FLOOR1#show interfaces GigabitEthernet0/14\nGigabitEthernet0/14 is up, line protocol is up (connected)\n  Hardware is Gigabit Ethernet, address is 00aa.bb00.000e (bia 00aa.bb00.000e)\n  Description: FINANCE-PRINTER\n  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,\n     reliability 255/255, txload 1/255, rxload 1/255\n  Encapsulation ARPA, loopback not set\n  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX\n  ...\n     48211 packets input, 9120544 bytes, 0 no buffer\n     0 runts, 0 giants, 0 throttles\n     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored\n     51022 packets output, 7311820 bytes, 0 underruns\n     0 output errors, 3104 collisions, 0 interface resets\n     0 babbles, 1877 late collision, 0 deferred", o:["The printer is probably hard-coded to 100 Mb/s full duplex, so the auto switch port fell back to half duplex: a duplex mismatch. Set both ends to auto, or both to 100/full","A damaged cable is corrupting frames, so replace the patch lead","The cable run is longer than 100 m","The printer needs PoE+ and keeps browning out"], a:0, why:"The switch side is running half duplex at 100 Mb/s and counting collisions and, above all, late collisions. A half-duplex port sees late collisions when the other end transmits whenever it likes, which is full-duplex behaviour. That points to a mismatch caused by the vendor hard-coding the printer. The full-duplex end would be the one logging CRC errors and runts, which is why this side shows 0 CRC. Make both ends match."},
  {lvl:3, q:"Two buildings on a campus are 1.8 km apart. The only fibre between them is old OM3 multimode, and the link must run at 1 Gb/s. What is the right plan?", o:["Install single-mode fibre between the buildings and use 1000BASE-LX optics at both ends (about 10 km reach)","Use 1000BASE-SX optics on the existing OM3, because multimode reaches 2 km at 1 Gb/s","Use 1000BASE-LX at one end and 1000BASE-SX at the other, over the OM3","Run Cat6a, which reaches 2 km at 1 Gb/s"], a:0, why:"1000BASE-SX on multimode is good for roughly 550 m, so 1.8 km is far beyond it. Single-mode with LX optics reaches about 10 km and is the normal choice between buildings. Both ends must use the same optic type, matched to the fibre, so mixing LX and SX never works, and copper stops at 100 m whatever its category."},
  {lvl:3, q:"A contractor has just installed the new uplink to building B over single-mode fibre. Both ends stay down. Based on the exhibit, what should you fix first?", ex:"CORE-SW#show interfaces status | include Gi1/1/3\nGi1/1/3   UPLINK-BLDG-B      notconnect   1            full   1000 1000BaseSX SFP\n\nBLDG-B-SW#show interfaces status | include Gi1/1/1\nGi1/1/1   UPLINK-CORE        notconnect   1            full   1000 1000BaseLX SFP", o:["Replace the SX optic in CORE-SW Gi1/1/3 with an LX optic, so both ends match each other and the single-mode fibre","Swap Tx and Rx at both ends","Replace the single-mode fibre with multimode, so the SX end works","Hard-code speed 1000 and duplex full on both ends"], a:0, why:"The Type column names the transceivers: SX (multimode, 850 nm) at the core and LX (single-mode, 1310 nm) in building B. They can never talk, so fix the optics first, using the type that matches the installed fibre: LX. Only then is polarity worth checking, and you swap at one end, never both. Changing the fibre to multimode would still leave the LX end mismatched, and speed settings can't fix light that never arrives."},
  {lvl:2, type:"multi", q:"Which two of these will give a working 1 Gb/s link? (Choose two.)", o:["1000BASE-SX optics at both ends, over 300 m of OM3 multimode fibre","1000BASE-LX optics at both ends, over 8 km of single-mode fibre","1000BASE-SX at one end and 1000BASE-LX at the other, over single-mode fibre","1000BASE-T over a 140 m Cat6 run","1000BASE-SX optics at both ends, over 5 km of single-mode fibre"], a:[0,1], why:"Three things must agree: the optic at each end, the fibre type and the distance. SX is multimode and short reach (about 550 m), so 300 m of OM3 is fine; LX is single-mode and reaches about 10 km. Mixed optics never link, SX is not designed for single-mode or for 5 km, and every twisted-pair standard stops at 100 m."},
  {lvl:2, type:"match", q:"Match each symptom with its most likely cause.", pairs:[["Both fibre ends transmit light, but neither receives any","Tx and Rx are swapped at one end"],["Link is up; late collisions on one end, CRC errors on the other","A duplex mismatch"],["A gigabit PC on auto links at only 100 Mb/s","A broken wire in the blue or brown pair, or an old Cat5 cord"],["show ip interface brief shows administratively down","The port was disabled with shutdown"],["A new AP stays dark on a port where a laptop links fine","The switch's PoE budget is used up, or the port has no PoE"]], why:"Each symptom points at one cause: light sent but none received is polarity; collisions on one side and CRC errors on the other is duplex; a fall-back to 100 Mb/s means only two pairs work; administratively down is configuration; and a device that is powered by the port stays dark when the port can't give it power."},
],
cards:[
  {f:"What does the physical layer (Layer 1) do?", b:"Moves raw bits between directly connected ports as signals — voltage, light or radio. Covers cables, connectors, pin-outs, speed and distance."},
  {f:"Why are twisted pairs twisted?", b:"Each pair carries a signal and its mirror image; twisting exposes both wires equally to noise so it cancels. Different twist rates reduce crosstalk."},
  {f:"UTP vs STP", b:"UTP: unshielded, cheap, standard in offices. STP: shielded for strong EMI; the shield must be grounded."},
  {f:"Copper categories", b:"Cat5e: 1 Gb/s. Cat6: 1 Gb/s (10 Gb/s to ~55 m). Cat6a: 10 Gb/s at 100 m. Cat8: 25–40 Gb/s at 30 m."},
  {f:"Copper distance limit", b:"100 m channel: up to 90 m fixed horizontal cable + 10 m of patch cords."},
  {f:"T568A vs T568B", b:"Identical except orange and green pairs swap. Same at both ends = straight-through; A at one end, B at the other = crossover."},
  {f:"Pairs used: 10/100 vs 1000BASE-T", b:"10/100: pins 1,2 and 3,6 only. 1000BASE-T: all four pairs, both directions at once."},
  {f:"Straight-through vs crossover vs Auto MDI-X", b:"Straight: unlike devices (PC–switch). Crossover: like devices (switch–switch, PC–PC, router–router, PC–router). Auto MDI-X swaps pairs so either works."},
  {f:"Duplex mismatch symptoms", b:"Link up, pings OK, slow transfers; late collisions on the half side, CRC errors on the full side. Caused by hard-coding one end only."},
  {f:"Single-mode vs multimode", b:"SMF: ~9 µm core, 1310/1550 nm lasers, km, yellow, dearer optics. MMF: 50/62.5 µm, 850 nm, hundreds of metres, aqua/orange."},
  {f:"SFP family", b:"SFP 1 Gb/s, SFP+ 10 Gb/s, SFP28 25 Gb/s, QSFP+/QSFP28 40/100 Gb/s. Optics must match each other and the fibre type."},
  {f:"PoE standards", b:"802.3af 15.4 W; 802.3at (PoE+) 30 W; 802.3bt 60 W (Type 3) / 90 W (Type 4). Watch the switch's total budget."},
],
});
// ---------- Lesson 4 ----------
L.push({
id:"net-topology", mins:60, level:"Beginner · builds on lessons 1–3",
t:"Network topologies and architectures: from a home router to a campus and a data centre",
html:`
${K.goals([
  "Tell physical from logical topology, and name bus, ring, star, extended star, mesh and hybrid.",
  "Calculate full-mesh links with n(n−1)/2, and explain why nobody fully meshes 50 branches.",
  "Find the single points of failure in a design and say what redundancy removes each one.",
  "Explain SOHO, two-tier and three-tier campus designs, spine-leaf, and the common WAN shapes.",
  "Read and draw proper physical and logical network diagrams.",
])}
${K.pre([
  "Lessons 1 and 2: LAN vs WAN, and what switches, routers, firewalls and access points do.",
  "A pen and paper — this lesson has no terminal. You will design networks by hand, as engineers do on a whiteboard.",
])}

<h2>Why this matters at work</h2>
<p>A logistics company in Ikeja calls your firm. They have grown from one floor to three, signed a lease on the building next door, and open branches in Abuja and Port Harcourt next year. The managing director asks: <i>"What should our network look like, so we are not rebuilding it every year?"</i></p>
<p>That is not a question about commands. It is about <b>shape</b>: which device connects to which, where traffic flows, and what happens when one box or cable dies. Get the shape right and the network grows smoothly for years. Get it wrong and one failed switch stops a whole floor — which happens in real offices every week.</p>

<h2>Topology: the shape of a network</h2>
<p>A ${K.g("topology","The arrangement of a network: which devices connect to which (physical topology) and how data actually flows between them (logical topology).")} is the shape of a network — how its devices are arranged and connected. Every network has <b>two</b> topologies:</p>
<ul>
<li>The ${K.g("physical topology","How devices and cables are actually laid out and plugged in: which port goes to which port, in which room and rack.")} — where the cables really run. Follow every cable through the building with a torch and you are drawing it.</li>
<li>The ${K.g("logical topology","How data flows and how the network is divided up, regardless of the cabling: subnets, VLANs, routing paths.")} — how the data flows and how the network is divided into groups and subnets. Two PCs on the same switch can be in completely separate logical networks.</li>
</ul>
<p>The classic example is the old ${K.g("hub","An obsolete device that repeated every signal out of every port, so everything connected to it shared one signal. Replaced by switches.")}. Physically, PCs on a hub formed a star: one cable from each PC to the box. Logically, the hub repeated every signal out of every port, so the PCs behaved as if they shared one cable — a logical bus.</p>

<h3>The classic shapes — and why two of them are history</h3>
${K.svg("0 0 720 255",
  '<line x1="240" y1="10" x2="240" y2="245" stroke="var(--line)" stroke-dasharray="4 4"/><line x1="480" y1="10" x2="480" y2="245" stroke="var(--line)" stroke-dasharray="4 4"/>'+
  '<line x1="20" y1="130" x2="220" y2="130" stroke="var(--muted)" stroke-width="3"/><rect x="12" y="123" width="8" height="14" fill="var(--warn)"/><rect x="220" y="123" width="8" height="14" fill="var(--warn)"/>'+
  K.link(55,89,55,130)+K.link(120,130,120,167)+K.link(185,89,185,130)+
  K.dev("pc",55,75)+K.dev("pc",120,185)+K.dev("pc",185,75)+
  K.txt(120,26,"Bus (historic)",{mid:true,c:"fg",b:true,f:"display",s:13})+K.txt(120,238,"one shared coax cable",{mid:true,s:10})+
  '<circle cx="360" cy="135" r="70" fill="none" stroke="var(--muted)" stroke-width="1.6"/>'+
  K.dev("pc",360,65)+K.dev("pc",430,135)+K.dev("pc",360,205)+K.dev("pc",290,135)+
  K.txt(360,26,"Ring (historic)",{mid:true,c:"fg",b:true,f:"display",s:13})+K.txt(360,238,"data passed node to node",{mid:true,s:10})+
  K.link(530,70,600,135)+K.link(670,70,600,135)+K.link(530,205,600,135)+K.link(670,205,600,135)+
  K.dev("pc",530,70)+K.dev("pc",670,70)+K.dev("pc",530,205)+K.dev("pc",670,205)+K.dev("switch",600,135)+
  K.txt(600,26,"Star (today)",{mid:true,c:"fg",b:true,f:"display",s:13})+K.txt(600,238,"own cable to a central switch",{mid:true,s:10}),
  "Three classic physical topologies. Bus and ring are history; every modern office LAN is cabled as a star.")}
<p><b>Bus.</b> In the 1980s, Ethernet ran over one coaxial cable snaking past every desk, with a ${K.g("terminator","A resistor plug fitted at each end of a bus cable so signals were absorbed instead of bouncing back.")} at each end. Only one device could talk at a time, and one loose connector anywhere took down <i>everyone</i>.</p>
${K.dyk(`Ethernet was born as a bus. Bob Metcalfe's original 1973 design at Xerox PARC sent every signal along one shared coaxial cable — the "ether" in its name. Every switched Ethernet LAN today still uses the frame format that grew out of that design.`)}
<p><b>Ring.</b> Each device connected to the next in a loop, and data travelled round from node to node. IBM's ${K.g("Token Ring","A 1980s–90s LAN technology (IEEE 802.5) where a 'token' frame circulated and only the device holding it could transmit. Replaced by Ethernet.")} was the famous example. One broken node could break the loop. Rings are gone from office LANs, though some service-provider fibre networks around cities still use them: if a fibre is cut, traffic goes the other way round.</p>
<p><b>Star.</b> Every device has its own cable to a central switch. This is every modern office floor, and it won because one bad cable affects one user, adding a desk means one more patch cable, and each port can be tested on its own. Its weakness is <b>the centre</b>: if the switch dies, everything on it is cut off. Hold that thought.</p>

<h3>Extended star: stars joined together</h3>
<p>A switch has 24 or 48 ports, and copper runs are limited to 100 metres (lesson 3). So a three-floor office puts a switch on each floor and connects them to a central switch: an ${K.g("extended star","Several stars whose central switches connect to a higher-level central switch — a star of stars. The normal shape of a multi-floor building.")}, a star of stars.</p>
${K.svg("0 0 720 262",
  K.link(345,61,150,129)+K.link(360,61,360,129)+K.link(375,61,570,129)+
  [150,360,570].map(x=>K.link(x-20,151,x-70,217)+K.link(x+20,151,x+70,217)+K.dev("pc",x-70,235)+K.dev("pc",x+70,235)).join("")+
  K.dev("switch",360,50)+K.dev("switch",150,140,"Floor 1")+K.dev("switch",360,140,"Floor 2")+K.dev("switch",570,140,"Floor 3")+
  K.txt(395,46,"Central switch",{c:"fg",b:true,f:"display",s:12})+K.txt(395,64,"one box, one cable each = single points of failure",{c:"bad",s:10}),
  "An extended star: a star per floor, joined to a central switch. Simple, common — and full of single points of failure.")}
${K.check({q:"An old network used a hub: every PC had its own cable to the hub, but the hub repeated every signal to every port. Physically and logically, this was…", o:["A physical bus and a logical star","A physical star and a logical bus","A physical ring and a logical ring","A full mesh"], a:1, why:"The cabling was a star, but the hub made everyone share one signal, so data flowed as on one shared cable — a logical bus."})}

<h2>Mesh, single points of failure and redundancy</h2>
<p>A ${K.g("single point of failure","Any one device, cable, power feed or service whose failure alone stops the network (or part of it). Shortened to SPOF.")} (SPOF) is any one thing whose failure, on its own, stops something working. In the extended star above, the central switch is a SPOF for the building, each floor switch for its floor, and each single cable too.</p>
<p>The cure is ${K.g("redundancy","Having more than one of something — devices, links, power supplies, providers — so when one fails another takes over.")}: more than one path, so losing one cuts nobody off. Adding redundant paths moves you towards a mesh.</p>

<h3>Full mesh and partial mesh</h3>
<p>In a ${K.g("full mesh","Every node has a direct link to every other node. Maximum redundancy, maximum cost.")}, every device connects directly to every other. In a ${K.g("partial mesh","Only some nodes have direct links to each other — the important ones get extra paths.")}, you add extra links only where they matter most.</p>
${K.svg("0 0 720 265",
  '<line x1="360" y1="10" x2="360" y2="255" stroke="var(--line)" stroke-dasharray="4 4"/>'+
  K.link(90,75,270,75)+K.link(90,195,270,195)+K.link(90,75,90,195)+K.link(270,75,270,195)+K.link(90,75,270,195)+K.link(270,75,90,195)+
  K.dev("router",90,75)+K.dev("router",270,75)+K.dev("router",90,195)+K.dev("router",270,195)+
  K.txt(58,79,"R1",{end:true,c:"fg",b:true,f:"display",s:12})+K.txt(302,79,"R2",{c:"fg",b:true,f:"display",s:12})+K.txt(58,199,"R3",{end:true,c:"fg",b:true,f:"display",s:12})+K.txt(302,199,"R4",{c:"fg",b:true,f:"display",s:12})+
  K.txt(180,28,"Full mesh: every site to every site",{mid:true,c:"fg",b:true,f:"display",s:13})+K.txt(180,250,"4 × 3 ÷ 2 = 6 links",{mid:true,c:"accent"})+
  K.link(450,75,630,75)+K.link(450,75,450,195)+K.link(630,75,630,195)+K.link(450,195,630,195)+K.link(450,75,630,195)+
  K.dev("router",450,75)+K.dev("router",630,75)+K.dev("router",450,195)+K.dev("router",630,195)+
  K.txt(418,79,"R1",{end:true,c:"fg",b:true,f:"display",s:12})+K.txt(662,79,"R2",{c:"fg",b:true,f:"display",s:12})+K.txt(418,199,"R3",{end:true,c:"fg",b:true,f:"display",s:12})+K.txt(662,199,"R4",{c:"fg",b:true,f:"display",s:12})+
  K.txt(540,28,"Partial mesh: links where they matter",{mid:true,c:"fg",b:true,f:"display",s:13})+K.txt(540,250,"5 links, not 6: every site still has two paths",{mid:true,c:"accent"}),
  "Full mesh (left): a direct link for every pair. Partial mesh (right): two paths per site with fewer links.")}
<p>Full mesh sounds perfect — until you count the links. Each of n devices needs a link to the other (n − 1), and every link has two ends, so:</p>
<p><b>Links in a full mesh = n(n − 1) ÷ 2</b></p>
${K.steps([
  ["Count the nodes", `<p>A company wants to fully mesh 5 sites: Lagos, Abuja, Port Harcourt, Kano and Ibadan. <b>n = 5</b>.</p>`],
  ["Links from each node", `<p>Each site connects to every <i>other</i> site: <b>n − 1 = 4</b>. So each router also needs <b>4 WAN interfaces</b> — that costs money too.</p>`],
  ["Multiply, then divide by two", `<p>5 × 4 = 20, but that counts the Lagos–Abuja link once from each end. 20 ÷ 2 = <b>10 links</b>.</p>`],
  ["Watch it explode", `<p>20 sites: 20 × 19 ÷ 2 = <b>190 links</b>. 50 branches: 50 × 49 ÷ 2 = <b>1,225 links</b>, each a monthly bill, each router needing 49 WAN connections. Links grow with roughly the <i>square</i> of the sites, which is why large WANs are never full meshes.</p>`],
])}
${K.remember(`It is the <b>handshake problem</b>. Put n people in a room and everyone shakes hands with everyone else once: each person shakes n − 1 hands, and each handshake involves two people. Handshakes = n(n − 1) ÷ 2. Five people, ten handshakes; five sites, ten links.`)}
<p>So full mesh is used where nodes are few and failure is unacceptable — a pair or four of core switches, or a handful of data centres. Everywhere else, engineers use a partial mesh: enough paths that no single failure cuts anyone off.</p>

<h3>Redundancy is more than extra cables</h3>
<p>Hunt for single points of failure wider than switches. Real outages in Nigerian offices often come from things that are not "network" at all:</p>
<ul>
<li><b>Devices and links</b> — one core switch, one firewall, one uplink, one fibre between buildings.</li>
<li><b>Power</b> — a switch with one power supply, on a ${K.g("UPS","Uninterruptible Power Supply: a battery unit that keeps equipment running through a power cut, or until the generator starts.")} whose battery died last year. Generator changeovers reboot unprotected switches.</li>
<li><b>Providers</b> — one ISP. If MTN's fibre is cut on the expressway, a second provider (Airtel, MainOne, or a 4G/5G backup) keeps you online.</li>
<li><b>Paths</b> — two fibres in the <i>same</i> trench are not redundant. One digger cuts both.</li>
</ul>
<p>Most real networks are a ${K.g("hybrid topology","A network combining two or more basic topologies — e.g. star on each floor, mesh between core devices, hub-and-spoke across the WAN.")}: a star on each floor, a mesh between core switches, hub-and-spoke to the branches. The skill is choosing the right shape for each part.</p>
${K.myth([
  ["More links always means a more reliable network.", "Only if the links are truly independent. Two fibres in one trench, two ISPs sharing one cable route, or two switches on one power socket fail together."],
  ["A full mesh is the best topology.", "It has the most redundancy but the most cost: n(n − 1) ÷ 2 links. It suits a few core devices, not a whole WAN."],
  ["Physical and logical topology are the same thing.", "A hub was a physical star but a logical bus. Today, one switch can carry several separate logical networks (VLANs)."],
  ["Bus and ring are still common in office LANs.", "They are history in LANs. Offices are star and extended star; rings survive mainly in some provider fibre networks."],
])}
${K.mistake(`Counting links as n × (n − 1) and forgetting to divide by 2. For 6 sites that gives 30 instead of the correct <b>15</b>. If an exam option is exactly double the right answer, it is there to catch this.`)}
${K.check({q:"How many links does a full mesh of 7 routers need?", o:["14","21","42","49"], a:1, why:"n(n − 1) ÷ 2 = 7 × 6 ÷ 2 = 21. 42 is the trap answer — it counts every link twice."})}
${K.q({type:"multi", q:"Which two of these look redundant but would fail together, so they are not truly redundant? (Choose two.)", o:["Two fibres between buildings laid in the same trench","Two ISPs whose cables share one route into the building","Dual power supplies, one on the UPS and one on a separate circuit","An access switch with one uplink to each of two core switches","Two core switches in different buildings joined on separate fibre routes"], a:[0,1], why:"Redundancy only works if the paths are independent. One digger cuts both fibres in a trench, and one cable cut takes out both ISPs on a shared route. Separate circuits, separate core switches and separate fibre routes are independent, so one failure leaves the other path working."})}

<h2>From a SOHO box to a campus: two-tier and three-tier</h2>
<h3>SOHO: everything in one box</h3>
<p>A ${K.g("SOHO","Small Office / Home Office: a network for a home or a few users, usually built around one all-in-one wireless router.")} network serves a home or a handful of users, built around one all-in-one box that the ISP often supplies. That box is several devices at once: a <b>router</b> with NAT, a small <b>switch</b> (the four LAN ports on the back), a <b>wireless access point</b>, a basic <b>firewall</b> and DHCP server — and often the <b>modem</b>, fibre terminal or a 4G/5G radio.</p>
<p>For five people in a small Lekki office, this is the right answer: cheap and managed from one web page. But everything in it is a single point of failure, it has few ports, and its Wi-Fi will not cover three floors. Outgrow it and you move to a campus design.</p>

<h3>The three layers of a campus network</h3>
<p>A ${K.g("campus network","The LAN for one organisation's site — one building or several close together — that the organisation owns and runs.")} is the LAN for a site you own. Cisco and most of the industry describe it in up to three layers:</p>
<div class="tablewrap"><table>
<tr><th>Layer</th><th>Its job, in plain words</th><th>Typical features</th></tr>
<tr><td><b>Access</b></td><td>Where users and devices plug in. "Let people onto the network."</td><td>Lots of ports, ${K.g("PoE","Power over Ethernet: the switch port sends electrical power down the network cable to power phones, access points and cameras.")} for phones, APs and cameras, VLANs per port, port security.</td></tr>
<tr><td><b>Distribution</b></td><td>Collects all the access switches in a building or area. "Gather the floors together and apply the rules."</td><td>Routing between VLANs, the boundary between Layer 2 and Layer 3, access lists and policy, redundant uplinks to every access switch.</td></tr>
<tr><td><b>Core</b></td><td>Joins the distribution blocks together. "Move traffic between buildings as fast as possible."</td><td>Very high speed, redundant, as few features and policies as possible so nothing slows it down.</td></tr>
</table></div>
${K.remember(`Bottom to top: <b>A-D-C — Attach, Decide, Carry.</b> Access <b>attaches</b> devices (the street outside each house). Distribution <b>decides</b> — routing and policy (the main road with traffic lights). Core <b>carries</b> traffic fast between buildings (the expressway: no traffic lights).`)}
<p>Distribution and core switches are usually ${K.g("multilayer switches","Switches that can also route between VLANs and subnets in hardware (Layer 3 switches). You met them in lesson 2.")}. Every access switch connects to <b>two</b> distribution switches, so losing one switch or one uplink does not cut off a floor.</p>

<h3>Two-tier: the collapsed core</h3>
<p>In a single building, a separate core would connect one distribution pair to… nothing. So most single-building and small-campus networks combine the two upper layers into one pair of switches: the ${K.g("collapsed core","A two-tier campus design where core and distribution are combined into one pair of switches. Common for a single building or small campus.")}, or <b>two-tier</b> design.</p>
${K.svg("0 0 760 305",
  '<line x1="372" y1="10" x2="372" y2="295" stroke="var(--line)" stroke-dasharray="4 4"/>'+
  K.txt(190,20,"Two-tier (collapsed core)",{mid:true,c:"fg",b:true,f:"display",s:13})+
  K.txt(8,84,"CORE+DIST",{s:10,c:"accent"})+K.txt(8,204,"ACCESS",{s:10,c:"accent"})+
  K.link(166,80,224,80)+[105,195,285].map(x=>K.link(x,189,140,91)+K.link(x,189,250,91)).join("")+
  K.dev("switch",140,80)+K.dev("switch",250,80)+K.txt(140,60,"Core/Dist 1",{mid:true,c:"fg",b:true,f:"display",s:11})+K.txt(250,60,"Core/Dist 2",{mid:true,c:"fg",b:true,f:"display",s:11})+
  K.dev("switch",105,200,"Floor 1")+K.dev("switch",195,200,"Floor 2")+K.dev("switch",285,200,"Floor 3")+
  K.txt(195,280,"one building, up to a few hundred users",{mid:true,s:10})+
  K.txt(570,20,"Three-tier: core, distribution, access",{mid:true,c:"fg",b:true,f:"display",s:13})+
  K.txt(384,64,"CORE",{s:10,c:"accent"})+K.txt(384,154,"DIST",{s:10,c:"accent"})+K.txt(384,254,"ACCESS",{s:10,c:"accent"})+
  K.link(571,60,599,60)+[465,545,625,705].map(x=>K.link(x,139,545,71)+K.link(x,139,625,71)).join("")+
  K.link(491,150,519,150)+K.link(651,150,679,150)+
  [[465,545],[625,705]].map(p=>p.map(a=>K.link(a,239,p[0],161)+K.link(a,239,p[1],161)).join("")).join("")+
  K.dev("switch",545,60)+K.dev("switch",625,60)+
  [465,545,625,705].map(x=>K.dev("switch",x,150)+K.dev("switch",x,250)).join("")+
  K.txt(505,292,"Building A",{mid:true})+K.txt(665,292,"Building B",{mid:true}),
  "Two-tier: every access switch uplinks to both collapsed core switches. Three-tier: a distribution pair per building, joined by a core pair.")}
<p>In two-tier, the collapsed core pair is the heart of the building: it routes between VLANs and connects the firewall, internet edge and servers.</p>

<h3>When do you need a third tier?</h3>
<p>The core solves the same counting problem as mesh. Picture a campus growing building by building, each with its own distribution pair. Without a core, every distribution switch needs links to every other one.</p>
${K.steps([
  ["Four buildings, no core", `<p>4 × 2 = <b>8 distribution switches</b>. Fully meshed: 8 × 7 ÷ 2 = <b>28 links</b>, many of them long fibre runs, 7 uplinks per switch. A fifth building needs new fibre to <i>every</i> existing building.</p>`],
  ["Four buildings, with a core pair", `<p>Each distribution switch connects to both cores: 8 × 2 = 16, plus 1 between the cores = <b>17 links</b>, 2 uplinks per switch.</p>`],
  ["Add a fifth building", `<p>Add 2 distribution switches and 4 links to the core. Nothing in the other buildings changes. That predictable growth is the point.</p>`],
])}
<p>Rule of thumb: at <b>three or more</b> distribution blocks (usually three or more buildings), a dedicated core pays for itself.</p>
${K.when([
  ["SOHO all-in-one box", "Home or a handful of users in one room", "Cheapest and simplest; one device does routing, switching, Wi-Fi and firewall", "Uptime matters, or you need more than a few ports or one floor of Wi-Fi"],
  ["Two-tier (collapsed core)", "One building, or two close together; up to a few hundred users", "Redundant pair at the top without paying for a separate core", "You have three or more distribution blocks to join"],
  ["Three-tier", "A campus of several buildings, each with its own distribution pair", "The core keeps links between buildings few and growth predictable", "One building — the core would add cost and connect nothing"],
], "Which campus architecture?")}
${K.exam(`"Two-tier" and "collapsed core" mean the same thing, and the exam may use either. A collapsed core merges <b>core and distribution</b> — never access. If an option says it merges access and distribution, it is wrong.`)}

${K.job("“The whole of the second floor is down”",`
<p><b>The alert.</b> 9:40 on a Monday at an insurance office in Victoria Island. Monitoring shows switch <code>VI-FL2-SW1</code> unreachable. Within two minutes the service desk has eleven calls from the second floor: no network, no phones, printer offline. Floors 1 and 3 are fine.</p>
<p><b>Your first questions.</b> "Is it everyone on floor 2, wired and Wi-Fi?" — yes, even the phones, which get power from the switch through PoE. "Anything happen this morning?" — the grid went off at 9:35 and the generator came on. When <i>everyone</i> on one floor loses <i>everything</i> at once, suspect the one thing the floor shares: its access switch or its uplink.</p>
<p><b>Your checks, in order.</b> (1) On the collapsed core switch, the port facing <code>VI-FL2-SW1</code> is down — not a core configuration problem. (2) In the floor 2 comms cupboard the switch is dark: no fan, no lights. (3) It has <b>one</b> power supply, plugged into a wall socket — <i>not</i> the UPS, which was moved during a refit. The changeover surge killed the power supply.</p>
<p><b>The fix today.</b> You fetch the spare 48-port switch, load the saved configuration backup, plug it into the UPS, and move the uplink and the urgent ports (claims team, reception, the access points) first. Floor 2 is back in 50 minutes; the vendor replaces the failed unit under warranty.</p>
<p><b>What you say to the manager.</b> "Floor 2 had one switch, one power supply and no UPS — three single points of failure stacked together. For the cost of a second switch, a UPS and a second uplink, one failure would affect half a floor at most, or nobody."</p>
<p><b>How redundancy would have prevented it.</b> Two switches on the floor, stacked so they are managed as one, with each department's desks and APs spread across both; each with an uplink to each core switch; dual power supplies, one on the UPS and one on a separate circuit; a tested UPS in every cupboard. The surge would have killed one power supply and nobody would have noticed.</p>
<p><b>The ticket note.</b> <i>"09:35 generator changeover; VI-FL2-SW1 lost power (single ${K.g("PSU","Power Supply Unit: the part inside a device that turns mains electricity into the power it runs on. Business switches can take two, so one can fail safely.")}, not on UPS). Whole floor 2 offline incl. PoE phones/APs. Replaced with spare, config restored from backup 08/10, on UPS. Service restored 10:30. ${K.g("RCA","Root cause analysis: the write-up of why a fault really happened, not just what was done to fix it.")}: three SPOFs (single switch, single PSU, no UPS). Recommend: second switch (stack), dual PSUs, dual uplinks, UPS per cupboard. Change request 2231 raised."</i></p>`)}
${K.check({q:"In a three-tier campus, which layer is responsible for connecting end devices, supplying PoE to phones and enforcing port security?", o:["Core","Distribution","Access","WAN edge"], a:2, why:"Access is where devices plug in, so PoE, per-port VLANs and port security live there. Distribution aggregates and applies policy; core moves traffic fast between distribution blocks."})}

<h2>Inside the data centre: spine-leaf</h2>
<p>A data centre is a room — or a building — full of servers. For years data centres used the same three-tier design as campuses. Then the traffic changed direction.</p>
<h3>North-south and east-west traffic</h3>
<p>Engineers describe direction as if the diagram were a map with the internet at the top:</p>
<ul>
<li>${K.g("North-south traffic","Traffic entering or leaving the data centre: between users outside and servers inside.")} goes in and out — a customer's phone loading a banking app.</li>
<li>${K.g("East-west traffic","Traffic between servers inside the same data centre — a web server talking to a database, storage replicating.")} goes sideways, server to server.</li>
</ul>
<p>Today one click in a banking app can trigger dozens of server conversations: the front end calls a login service, which calls a database, which replicates to a second database, while a fraud-scoring service is checked too. Add ${K.g("virtualisation","Running many virtual servers (virtual machines or containers) on one physical server; they can move between physical hosts while running.")} and storage replication, and most data-centre traffic is now east-west.</p>
<p>In three-tier, server-to-server traffic often climbed to the distribution or core layer and back down, so two servers could be two switches apart or six. And to stop loops, ${K.g("STP","Spanning Tree Protocol: stops Layer 2 loops by blocking redundant links. Covered in a later module.")} blocked some redundant links, leaving expensive links idle.</p>

<h3>How spine-leaf works</h3>
<p>The ${K.g("spine-leaf","A two-layer data-centre architecture: servers connect to leaf switches, every leaf connects to every spine, and leaves never connect to each other.")} design has two layers and three strict rules:</p>
<ol>
<li>Servers, storage, firewalls and routers connect only to ${K.g("leaf switches","The lower layer in spine-leaf. Servers and other endpoints plug into leaves; each leaf has an uplink to every spine.")} — often one or two leaves at the top of each server rack.</li>
<li><b>Every leaf connects to every spine.</b></li>
<li>Leaves never connect to other leaves, and ${K.g("spine switches","The upper layer in spine-leaf. Spines connect only to leaves and forward traffic between them.")} never connect to other spines.</li>
</ol>
${K.svg("0 0 720 298",
  K.txt(360,18,"every leaf connects to every spine; no leaf-to-leaf or spine-to-spine links",{mid:true,s:10})+
  [200,360,520].map(s=>[120,280,440,600].map(l=>K.link(l,159,s,73)).join("")).join("")+
  '<line x1="120" y1="159" x2="360" y2="73" stroke="var(--accent)" stroke-width="3"/><line x1="360" y1="73" x2="600" y2="159" stroke="var(--accent)" stroke-width="3"/><line x1="120" y1="181" x2="120" y2="225" stroke="var(--accent)" stroke-width="3"/><line x1="600" y1="181" x2="600" y2="225" stroke="var(--accent)" stroke-width="3"/>'+
  K.link(280,181,280,225)+K.link(440,181,440,225)+
  [200,360,520].map((s,i)=>K.dev("switch",s,62)+K.txt(s,42,"Spine "+(i+1),{mid:true,c:"fg",b:true,f:"display",s:11})).join("")+
  [120,280,440,600].map((l,i)=>K.dev("switch",l,170)+K.txt(l+32,174,"Leaf "+(i+1),{c:"fg",b:true,f:"display",s:11})).join("")+
  K.dev("server",120,245,"Server A")+K.dev("server",280,245)+K.dev("server",440,245)+K.dev("server",600,245,"Server B")+
  K.txt(360,288,"A to B: leaf, spine, leaf — always the same distance",{mid:true,c:"accent",s:10}),
  "Spine-leaf with 3 spines and 4 leaves: 12 links. Any two servers on different leaves are leaf, spine, leaf apart.")}
<p>Server A is on Leaf 1, Server B on Leaf 4: traffic goes Leaf 1 → a spine → Leaf 4. Any two servers on different leaves are the same distance apart: <b>leaf, spine, leaf</b>. That brings three advantages:</p>
<ul>
<li><b>Predictable distance.</b> Every server-to-server path crosses the same number of switches, so delay is low and the same everywhere.</li>
<li><b>All links in use.</b> Leaf 1 has three equal paths to Leaf 4, one per spine. Fabrics route between leaves and use ${K.g("ECMP","Equal-Cost Multi-Path: spreading traffic across several paths of the same cost at once, instead of using one and blocking the rest.")} to spread traffic across all of them.</li>
<li><b>Simple growth.</b> More server ports? Add a leaf and connect it to every spine. More bandwidth? Add a spine and connect it to every leaf. Losing one spine of three removes a third of the capacity; nothing is cut off.</li>
</ul>
<p>Cables = <b>leaves × spines</b>: 4 × 3 = 12. It is not a full mesh (leaves never meet leaves), so n(n − 1) ÷ 2 does not apply. Growth is limited by spine ports: a 32-port spine supports at most 32 leaves.</p>
${K.dyk(`Spine-leaf is older than Ethernet. In 1953 Charles Clos of Bell Labs described building a huge telephone exchange from stages of small switches, each connected to every switch in the next stage. Data centres borrowed the idea, so spine-leaf is also called a <b>Clos</b> design.`)}
${K.exam(`Watch the wording. Correct: "each leaf connects to every spine" and "servers connect to leaf switches". Wrong: "leaves connect to each other", "spines form a full mesh", "servers connect to spines".`)}
${K.mistake(`Drawing a link between two leaves "for extra redundancy". It breaks the predictable leaf-spine-leaf path; redundancy comes from having several spines. (Vendors sometimes pair two leaves in a rack for dual-connected servers — a special case.)`)}
${K.check({q:"Why have modern data centres moved from three-tier designs to spine-leaf?", o:["Spine-leaf uses fewer cables than any other design","Most traffic is now server-to-server (east-west), and spine-leaf gives every path the same short, predictable length with all links in use","Spine-leaf removes the need for routers and firewalls","Spine-leaf connects every server directly to every other server"], a:1, why:"East-west traffic now dominates. In spine-leaf, any two servers on different leaves are always leaf → spine → leaf apart, and ECMP uses all the spine links instead of blocking some."})}

<h2>Joining sites: WAN topologies and the cloud</h2>
<p>The WAN joins your sites over links you usually rent (lesson 1). They cost money every month and are slower than LAN links, so WAN shapes are chosen carefully.</p>
<h3>The basic WAN shapes</h3>
<ul>
<li><b>Point-to-point</b> — one dedicated link between two sites, often a ${K.g("leased line","A private circuit rented from a provider between two fixed points, with bandwidth only you use.")}. Simple, private, predictable.</li>
<li><b>Hub-and-spoke</b> — every branch (spoke) connects to one central site (hub), usually head office or the data centre. Branches reach each other <i>through</i> the hub.</li>
<li><b>Full mesh</b> — every site to every other: n(n − 1) ÷ 2 again.</li>
<li><b>Partial mesh</b> — hub-and-spoke for most branches, plus direct links between sites that talk a lot, such as two data centres.</li>
</ul>
${K.svg("0 0 720 300",
  K.txt(360,20,"spoke-to-spoke traffic travels through the hub",{mid:true,s:10})+
  K.link(140,60,360,150,"MPLS")+K.link(580,60,360,150,"MPLS")+K.link(80,150,360,150,"internet VPN")+K.link(640,150,360,150,"internet VPN")+K.link(140,240,360,150,"MPLS")+K.link(580,240,360,150,"",true)+K.txt(500,200,"4G backup",{s:10})+
  K.dev("router",360,150,"Lagos HQ","hub + data centre")+
  K.dev("router",140,60,"Abuja")+K.dev("router",580,60,"Kano")+K.dev("router",80,150,"Ibadan")+K.dev("router",640,150,"Kaduna")+K.dev("router",140,240,"Port Harcourt")+K.dev("router",580,240,"Enugu"),
  "Hub-and-spoke WAN: six branches connect to the Lagos hub over a mix of transports. Kano to Abuja goes via Lagos.")}
<p>Hub-and-spoke is the most common branch WAN because it matches how branches work: most of their traffic goes to head office and the data centre anyway. It needs one link per branch (n − 1 for n sites), and security and monitoring can sit at the hub.</p>
<p>Its weaknesses: the hub is a single point of failure for the <i>whole company</i>, so hubs get two routers, two providers and often a second hub in another city. And branch-to-branch traffic — a Kano–Abuja video call — takes the long way through Lagos.</p>
<h3>Which links? ${K.g("MPLS (Multiprotocol Label Switching)","Multiprotocol Label Switching: the technique providers use to run private WAN services for many customers over one shared network. To the customer it looks like a private any-to-any WAN.")}, internet VPN and SD-WAN</h3>
<p>The shape says who connects to whom; the <b>transport</b> says what carries it. Three to know at CCNA level:</p>
<ul>
<li><b>Internet VPN</b> — each site has ordinary internet, and routers build encrypted tunnels to each other: a ${K.g("VPN","Virtual Private Network: an encrypted tunnel across a shared network (usually the internet) that makes sites behave as if on a private link. IPsec is the common site-to-site method.")}, usually ${K.g("IPsec","IP Security: a family of standards that encrypts and checks traffic between two routers or firewalls across the internet.")}.</li>
<li><b>MPLS</b> — MPLS is a provider's private WAN service: your sites connect to the provider, which carries traffic between them, separated from other customers, usually with an ${K.g("SLA","Service Level Agreement: the provider's contractual promise about availability, delay and repair times, with penalties if missed.")}.</li>
<li><b>SD-WAN</b> — ${K.g("SD-WAN","Software-Defined WAN: branch routers managed by a central controller, using several transports at once and choosing the best path per application from live link quality.")} puts a controller in charge of every branch router. Each branch can use MPLS, fibre broadband and 4G at once, and each application goes over the best-performing path right now: voice on the cleanest link, backups on the cheapest.</li>
</ul>
${K.when([
  ["Internet VPN", "Low budget, sites anywhere with internet access", "Cheap and quick to set up; encryption makes the public internet usable", "You need guaranteed delay for voice or a contractual SLA"],
  ["MPLS", "Critical traffic needs predictable performance and a provider SLA", "Private provider network with promised uptime and delay", "Budget is tight, or a site is where the provider has no network"],
  ["SD-WAN", "Many branches, several link types, central control wanted", "Uses all links at once and picks the best path per application", "Two sites only — a VPN or leased line is simpler"],
], "Which WAN transport?")}
<p>The number of internet links a site has also has names you may see in exam questions:</p>
<div class="tablewrap"><table>
<tr><th>Term</th><th>Meaning</th><th>Survives…</th></tr>
<tr><td><b>Single-homed</b></td><td>One link to one ISP</td><td>Nothing — any failure means offline</td></tr>
<tr><td><b>Dual-homed</b></td><td>Two links to the same ISP</td><td>A cut cable or failed router, but not an ISP-wide outage</td></tr>
<tr><td><b>Multihomed</b></td><td>Links to two or more different ISPs</td><td>One whole ISP failing</td></tr>
<tr><td><b>Dual multihomed</b></td><td>Two links to each of two or more ISPs</td><td>The most failures — at the highest cost</td></tr>
</table></div>
${K.case("A teaching hospital that cannot go offline",`<p>A 600-bed teaching hospital has nine buildings on one campus: wards, theatres, laboratory, radiology, outpatients, administration. Patient records, lab results, X-ray images and drug-dispensing cabinets all depend on the network. An outage here delays treatment.</p>
<p><b>Campus.</b> With nine buildings, the engineers chose <b>three-tier</b>. Each building has a distribution pair, and every access switch uplinks to both. The two core switches sit in <i>different</i> buildings, joined by fibre on two separate routes, so a fire or flood in one building cannot take out the core. Every cupboard has a UPS; core and distribution switches have dual power supplies on separate circuits, backed by the generator.</p>
<p><b>Data centre.</b> The server room is small but runs a two-spine, six-leaf fabric, because the radiology image archive and patient-record database replicate heavily between servers — classic east-west traffic.</p>
<p><b>WAN and cloud.</b> Four outlying clinics connect <b>hub-and-spoke</b> to the hospital over SD-WAN, each with fibre plus a 4G backup. Email and training run in the cloud; patient records stay on-premises for regulatory and performance reasons. The hospital is <b>multihomed</b> to two ISPs. The result is a hybrid of almost every topology in this lesson — each chosen for a reason the engineers can explain.</p>`)}

<h3>On-premises, cloud and hybrid</h3>
<p>The last question is <i>where the servers live</i>:</p>
<ul>
<li>${K.g("On-premises","Servers and network equipment owned and run by the organisation in its own building or rented data-centre space. Shortened to on-prem.")} — you own the servers and run them in your own server room. Full control, but you buy, power, cool and replace everything — and in Lagos, you pay for the diesel when the grid fails.</li>
<li><b>Public cloud</b> — you rent computing and storage from a provider such as AWS, Microsoft Azure or Google Cloud and pay for what you use, reaching it over the internet or a dedicated link.</li>
<li><b>Hybrid</b> — some systems on-premises, some in the cloud, joined by a VPN or private connection. Most medium and large organisations are here, like the hospital.</li>
</ul>
<p>For network design, the cloud is one more site on your WAN diagram: it needs a path, redundancy and planned capacity like any branch. A later module goes deeper.</p>
${K.check({q:"A company has 30 branches. Most branch traffic goes to the data centre at head office. Which WAN topology fits best, and how many links does it need?", o:["Full mesh — 465 links","Hub-and-spoke — 30 links","Ring — 31 links","Bus — 1 shared link"], a:1, why:"Hub-and-spoke matches the traffic pattern (branch → head office) and needs one link per branch: 30. A full mesh of 31 sites would need 31 × 30 ÷ 2 = 465 links — far too many."})}
${K.q({type:"match", q:"Match each WAN option with its description.", pairs:[["Leased line","A private point-to-point circuit between two fixed sites"],["Internet VPN","Encrypted tunnels over ordinary internet links: cheap, but no SLA"],["MPLS","A provider's private WAN service, separated from other customers, usually with an SLA"],["SD-WAN","A central controller steers each application over the best of several links"]], why:"A leased line is a shape and a transport in one: two sites, one private circuit. Internet VPN uses IPsec tunnels to make the public internet usable cheaply. MPLS is the provider's private network with promised performance. SD-WAN manages many branch routers centrally and uses MPLS, broadband and 4G together, choosing per application."})}

<h2>Reading and drawing a network diagram</h2>
<p>Every topology ends up as a drawing. You will read diagrams to troubleshoot and draw them for change requests, handovers and audits. A good one answers questions in seconds; a bad one causes outages.</p>
<h3>Physical (Layer 1) vs logical (Layer 3) diagrams</h3>
<p>Engineers keep at least two kinds, because one drawing cannot show everything clearly:</p>
${K.svg("0 0 720 265",
  '<line x1="360" y1="8" x2="360" y2="258" stroke="var(--line)" stroke-dasharray="4 4"/>'+
  K.txt(180,18,"Layer 1 (physical) diagram",{mid:true,c:"fg",b:true,f:"display",s:13})+
  K.link(170,74,100,169)+K.link(190,74,260,169)+K.txt(126,124,"Cat6",{end:true,s:10})+K.txt(236,124,"Cat6",{s:10})+
  K.dev("router",180,66)+K.txt(180,40,"HQ-RTR1",{mid:true,c:"fg",b:true,f:"display",s:11})+
  K.txt(148,92,"Gi0/0",{end:true,s:10})+K.txt(102,155,"Gi1/0/48",{end:true,s:10})+K.txt(212,92,"Gi0/1",{s:10})+K.txt(258,155,"Gi1/0/48",{s:10})+
  K.dev("switch",90,180,"SW-FL1","Comms rm 1, rack A")+K.dev("switch",270,180,"SW-FL2","Comms rm 2, rack A")+
  K.txt(180,252,"devices · ports · cables · locations",{mid:true,s:10})+
  K.txt(540,18,"Layer 3 (logical) diagram",{mid:true,c:"fg",b:true,f:"display",s:13})+
  K.link(530,74,465,160)+K.link(550,74,625,160)+
  K.dev("router",540,66)+K.txt(540,40,"HQ-RTR1",{mid:true,c:"fg",b:true,f:"display",s:11})+
  K.txt(495,110,"10.10.10.1",{end:true,s:10})+K.txt(590,110,"10.10.20.1",{s:10})+
  K.box(395,160,140,50,"Staff · VLAN 10","10.10.10.0/24")+K.box(555,160,140,50,"Voice · VLAN 20","10.10.20.0/24")+
  K.txt(540,252,"subnets · gateways · VLANs · routing",{mid:true,s:10}),
  "The same network drawn twice: physical (ports, cables, locations) and logical (subnets and gateway addresses).")}
<ul>
<li>A <b>physical (Layer 1) diagram</b> shows real boxes and cables: device names, interface names at <i>both</i> ends of every link, cable type, and location (building, room, rack). You use it in the comms room deciding which cable to unplug.</li>
<li>A <b>logical (Layer 3) diagram</b> shows how the network is divided and routed: subnets, router interface IP addresses, VLANs. You use it to answer "why can't these two users reach each other?" It deliberately hides most cables.</li>
</ul>
<p>Many teams also keep a Layer 2 diagram (VLANs and trunks) and a WAN diagram. Lesson 5 explains the layer numbers; for now, "Layer 1" means cabling and "Layer 3" means IP addressing and routing.</p>

<h3>What every good diagram has</h3>
<p>In Cisco-style diagrams a router is a round cylinder, a switch a flat box with arrows, a firewall a brick wall, and the internet or a provider a cloud — the icons used throughout this course. Every diagram needs a ${K.g("legend","The key on a diagram explaining each icon, line style and colour — e.g. solid = copper, dashed = backup or wireless link.")}. The rest is habit:</p>
${K.dodont([
  "Use the real hostnames (<code>HQ-RTR1</code>, <code>VI-FL2-SW1</code>) so you can find devices in monitoring.",
  "Label the interface at <b>both</b> ends of every link — <code>Gi0/0</code> on the router, <code>Gi1/0/48</code> on the switch (Gi = GigabitEthernet, Te = TenGigabitEthernet).",
  "Add a legend, title, date, version and author.",
  "Update the diagram as part of every change, and check it against the real devices now and then.",
],[
  "Cram every cable, port, VLAN and subnet into one picture — keep L1 and L3 separate.",
  "Use nicknames like \"the big switch\" or \"Tunde's router\".",
  "Let a diagram go undated — someone will troubleshoot from a three-year-old version.",
  "Store the only copy on one engineer's laptop.",
])}

<h3>Worked example: mapping a network you have inherited</h3>
<p>Often the only diagram is a photo of a whiteboard from 2019. You can rebuild the physical diagram from the devices themselves with ${K.g("CDP","Cisco Discovery Protocol: Cisco devices announce their name, model and port to directly connected neighbours.")} or its vendor-neutral equivalent ${K.g("LLDP","Link Layer Discovery Protocol (IEEE 802.1AB): the vendor-neutral version of CDP.")}. You will configure these later; here is how the output helps you draw.</p>
${K.out(`VI-FL2-SW1#show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,
                  D - Remote, C - CVTA, M - Two-port Mac Relay

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
VI-CORE1         Gig 1/1/1         152             R S I  C9300-48P Gig 1/0/2
VI-CORE2         Gig 1/1/2         139             R S I  C9300-48P Gig 1/0/2
SEP0C1167A2B3C4  Gig 1/0/7         127              H P M IP Phone  Port 1

Total cdp entries displayed : 3`, "show cdp neighbors on a floor access switch: every directly connected Cisco device, and which ports join them.")}
${K.steps([
  ["Read the columns", `<p><b>Device ID</b> = the neighbour's name. <b>Local Intrfce</b> = the port on <i>this</i> switch. <b>Holdtme</b> = seconds the entry lasts without a fresh announcement. <b>Capability</b> = what the neighbour is (R router, S switch, P phone). <b>Platform</b> = its model. <b>Port ID</b> = the port on the <i>neighbour</i>.</p>`],
  ["Draw the first link", `<p>Line 1: this switch's <code>Gig 1/1/1</code> goes to <code>VI-CORE1</code> port <code>Gig 1/0/2</code>. Two boxes, one line, both port names at the correct ends.</p>`],
  ["Draw the second — and spot the design", `<p>Line 2: <code>Gig 1/1/2</code> goes to <code>VI-CORE2</code>. Two uplinks, one to each core: the redundant two-tier design. Line 3 is an IP phone (H, P) — leave hosts off physical diagrams.</p>`],
  ["Repeat on each neighbour", `<p>Log in to <code>VI-CORE1</code> and run the same command. Each switch reveals the next. In an hour you can map a whole building — then add date, version and legend.</p>`],
])}
${K.tip(`Before trusting any diagram, check two or three links against <code>show cdp neighbors</code> or <code>show lldp neighbors</code>. If they don't match, the diagram is out of date — tell the team and fix it.`)}
${K.check({q:"You need to find which switch port a cable from the router plugs into, so you can replace a faulty patch lead. Which diagram helps most?", o:["The Layer 3 diagram, because it shows subnets","The Layer 1 physical diagram, because it shows ports, cables and rack locations","The WAN diagram","Any diagram — they all show the same thing"], a:1, why:"Physical (L1) diagrams show the actual cabling: which interface connects to which, the cable type and where the devices are. Logical (L3) diagrams show subnets and addressing and usually hide individual cables."})}

<h2>Hands-on: design it on paper</h2>
<p>Take a sheet of paper. Do each exercise before opening the answer — the point is to practise the reasoning.</p>
<h3>Exercise 1: count the links</h3>
<ol>
<li>How many links does a full mesh of 6 sites need? How many WAN interfaces does each router need?</li>
<li>A company has a head office and 11 branches. How many links for hub-and-spoke? For a full mesh?</li>
<li>Five sites are in hub-and-spoke. How many extra links would you need to turn it into a full mesh?</li>
<li>A data centre has 4 spines and 10 leaves. How many spine-to-leaf links are there? How many uplink ports does each leaf use?</li>
</ol>
${K.hint(`Questions 1–3: decide first whether the shape is a full mesh (n(n − 1) ÷ 2) or hub-and-spoke (one link per branch). Count the head office as a site. Question 4 is not a mesh at all: each leaf links once to each spine.`)}
${K.reveal("Show answers — Exercise 1",`<ol>
<li>6 × 5 ÷ 2 = <b>15 links</b>. Each router connects to the other 5 sites: <b>5 WAN interfaces</b>.</li>
<li>12 sites in total. Hub-and-spoke: one link per branch = <b>11 links</b>. Full mesh: 12 × 11 ÷ 2 = <b>66 links</b> — six times as many.</li>
<li>Full mesh of 5 = 5 × 4 ÷ 2 = 10. Hub-and-spoke of 5 = 4. Extra links needed: 10 − 4 = <b>6</b>.</li>
<li>Every leaf to every spine: 10 × 4 = <b>40 links</b>. Each leaf uses <b>4 uplinks</b>, one per spine. (Not 14 × 13 ÷ 2 — spine-leaf is not a full mesh.)</li>
</ol>`)}

<h3>Exercise 2: grow a Lagos company</h3>
<p>Ìrìn Freight is a logistics company. At each stage, sketch the topology, name the architecture, and circle every single point of failure.</p>
<ol>
<li><b>Stage 1.</b> One building in Ikeja, three floors, about 120 staff. PoE desk phones, Wi-Fi on every floor, a small ground-floor server room, one fibre line from one ISP.</li>
<li><b>Stage 2.</b> They take the building next door: three more floors, 100 more staff. A third building on the same compound is planned for next year.</li>
<li><b>Stage 3.</b> Branches open in Abuja, Port Harcourt and Kano (about 15 staff each), and the accounting system moves to the cloud.</li>
</ol>
${K.hint(`Stage 1: count buildings — one building usually means two-tier. Stage 2: count distribution blocks, including the planned one, and remember the rule of thumb of three. Stage 3: ask where branch traffic mostly goes. For SPOFs, walk every path from a desk to the internet and ask "if this one thing died, who is cut off?" — include power and providers.`)}
${K.reveal("Show model answer — Stage 1",`<p><b>Two-tier (collapsed core), star on each floor.</b> One or two PoE access switches per floor (a busy floor of staff, phones and APs needs more than 48 ports). A collapsed core pair in the server room, every access switch uplinked to <i>both</i>; servers, firewall and internet router connect to that pair.</p>
<p><b>SPOFs to circle:</b> the single ISP line; a single edge firewall/router; each access switch; a single power feed and UPS; any missing second uplink. <b>Cheapest fixes first:</b> second uplinks and a UPS per cupboard cost little; a second ISP or 4G/5G backup is next, because the internet line affects everyone.</p>`)}
${K.reveal("Show model answer — Stage 2",`<p><b>With two buildings</b>, a collapsed core can still work: the new building connects back to the collapsed core pair over fibre — two fibres on <b>physically separate routes</b>, since one trench is one SPOF.</p>
<p><b>With the third building planned</b>, design for <b>three-tier</b> now: a distribution pair per building and a core pair joining them. Three distribution blocks is where a core pays off, and building four later will not need new fibre to every building. Put the two core switches in <i>different</i> buildings so one fire or flood cannot take out both.</p>`)}
${K.reveal("Show model answer — Stage 3",`<p><b>Hub-and-spoke WAN</b> with Ikeja as the hub, because branch traffic mostly goes to head office and the cloud: 3 links. A full mesh of 4 sites (6 links) is not worth paying for.</p>
<p><b>Transport:</b> internet VPN is the low-cost start; SD-WAN is a strong choice, letting each branch use fibre plus a 4G/5G backup from a different provider, managed centrally. Each branch is SOHO-sized: one router or firewall, one PoE switch, an AP or two.</p>
<p><b>Cloud</b> makes the company <b>hybrid</b>, and head office internet becomes critical for everyone if branch cloud traffic passes through the hub. So the hub must be <b>multihomed</b> with two edge firewalls. SPOFs: the hub, each branch's single router, any branch with one internet link.</p>`)}

<h2>Interview corner</h2>
${K.reveal("“Explain the three-tier campus model.”",`<p><b>A strong answer:</b> "The three-tier model splits the campus into access, distribution and core. Access is where end devices connect: port density, PoE, VLAN assignment, port security. Distribution aggregates the access switches of a building; it's usually the Layer 2/Layer 3 boundary, routes between VLANs and applies policy such as ${K.g("ACLs","Access Control Lists: ordered permit/deny rules on a router or switch that decide which traffic may pass. You will write them in a later module.")}, and each access switch has redundant uplinks to a distribution pair. The core is a fast, highly available backbone joining the distribution blocks, with minimal policy. In smaller sites core and distribution are combined — a two-tier collapsed core. You add a separate core at around three or more distribution blocks, because otherwise the distribution switches need a near-full mesh between them."</p>`)}
${K.reveal("“What is spine-leaf, and why is it used in data centres?”",`<p><b>A strong answer:</b> "It's a two-layer data-centre architecture. Servers connect to leaf switches, every leaf connects to every spine, and there are no leaf-to-leaf or spine-to-spine links. It's used because data-centre traffic is now mostly east-west, from virtualisation, microservices and storage replication. Any two servers on different leaves are always leaf-spine-leaf apart, so latency is low and predictable, and ECMP uses all the spine links instead of spanning tree blocking some. It scales out: add leaves for ports, spines for bandwidth."</p>`)}
${K.video({t:"Search: spine-leaf vs three-tier architecture explained", u:"https://www.youtube.com/results?search_query=spine+leaf+vs+three+tier+network+architecture+CCNA", by:"YouTube search", why:"Pick a recent video from a CCNA instructor and check it against the rules in this lesson."})}

${K.recap([
  "Physical topology = how cables run; logical = how data flows. Bus and ring are history; star and extended star are today; real networks are hybrids.",
  "Full mesh needs n(n − 1) ÷ 2 links — fine for 4 core switches, impossible for 50 branches.",
  "A single point of failure is any one device, link, power feed or provider whose loss stops things; redundancy removes it.",
  "SOHO = one all-in-one box. Campus = access (attach), distribution (decide), core (carry). Two-tier collapses core and distribution; add a core at about three distribution blocks.",
  "Spine-leaf: every leaf to every spine, never leaf to leaf; leaf-spine-leaf for every path; built for east-west traffic.",
  "WAN shapes: point-to-point, hub-and-spoke, full and partial mesh; transports: internet VPN, MPLS, SD-WAN. Servers live on-premises, in the cloud, or both.",
  "Keep separate physical (L1) and logical (L3) diagrams, with real names, ports at both ends, a legend and a date.",
])}
${K.next(`<b>Lesson 5 — The ${K.g("OSI","Open Systems Interconnection: the seven-layer model that splits networking into separate jobs, from the cable (Layer 1) up to the application (Layer 7).")} and TCP/IP models.</b> You have met "Layer 1" and "Layer 3" several times. Next: what the layers are, why networking is layered at all, and how to troubleshoot from the cable upwards.`)}
`,
quiz:[
  {lvl:2, q:"An old Ethernet network used a hub. Each PC had its own cable to the hub, which repeated every signal out of every port. What were its physical and logical topologies?", o:["Physical bus, logical star","Physical star, logical bus","Physical ring, logical star","Physical mesh, logical ring"], a:1, why:"The cabling formed a star, but because the hub repeated everything to everyone, data flowed as if on one shared cable — a logical bus."},
  {lvl:2, q:"How many links are required to fully mesh 8 sites?", o:["16","28","56","64"], a:1, why:"n(n − 1) ÷ 2 = 8 × 7 ÷ 2 = 28. 56 forgets to divide by two; 64 is 8 squared."},
  {lvl:1, q:"In a three-tier campus design, which layer aggregates access switches, routes between VLANs and applies policy such as ACLs?", o:["Access","Distribution","Core","Spine"], a:1, why:"The distribution layer collects the access switches of a building or area, is usually the Layer 2/Layer 3 boundary and applies policy. The core is kept fast and simple."},
  {lvl:1, q:"What does a collapsed core design combine?", o:["Access and distribution layers","Distribution and core layers","Core and WAN edge","Spine and leaf layers"], a:1, why:"A two-tier, collapsed-core design merges the distribution and core layers into one pair of switches; access remains separate."},
  {lvl:1, q:"Which statement about spine-leaf architecture is TRUE?", o:["Every leaf connects to every other leaf","Servers connect directly to spine switches","Every leaf connects to every spine, and leaves do not connect to each other","Spines are connected to each other in a full mesh"], a:2, why:"The rules: endpoints connect to leaves, every leaf links to every spine, no leaf-to-leaf or spine-to-spine links."},
  {lvl:1, q:"What change in traffic patterns drove data centres towards spine-leaf designs?", o:["More north-south traffic from users","More east-west traffic between servers","Less traffic overall","More wireless clients"], a:1, why:"Virtualisation, microservices and storage replication made server-to-server (east-west) traffic dominant, and spine-leaf gives every such path the same short length."},
  {lvl:1, q:"In a hub-and-spoke WAN, how does traffic between two branch sites usually travel?", o:["Directly between the two branches","Through the hub site","Through the internet without encryption","It cannot travel between branches"], a:1, why:"Spokes connect only to the hub, so spoke-to-spoke traffic passes through the hub. That's one of the trade-offs of the design."},
  {lvl:1, q:"A small home office has one ISP-supplied device providing Wi-Fi, four LAN ports, NAT, DHCP and a basic firewall. This is typical of which architecture?", o:["Three-tier campus","Spine-leaf","SOHO","Full mesh WAN"], a:2, why:"Small Office / Home Office networks are usually built around one all-in-one wireless router that combines router, switch, AP and firewall functions."},
  {lvl:1, q:"Which WAN approach uses a central controller to manage branch routers and choose, per application, between several transports such as MPLS, broadband and 4G?", o:["Leased line","Full mesh","SD-WAN","Token Ring"], a:2, why:"SD-WAN centralises policy and steers each application over the best available path across multiple transports."},
  {lvl:1, q:"A company connects to two different ISPs, with one link to each. What is this called?", o:["Single-homed","Dual-homed","Multihomed","Collapsed core"], a:2, why:"Links to two or more different ISPs = multihomed. Two links to the same ISP = dual-homed. One link to one ISP = single-homed."},
  {lvl:2, type:"multi", q:"Which two statements about a hub-and-spoke WAN are true? (Choose two.)", o:["It needs one link per branch: n − 1 links for n sites","Unless it is made redundant, the hub is a single point of failure for the whole company","Branch-to-branch traffic travels directly between the two branches","It needs n(n − 1) ÷ 2 links","It can only be built with MPLS"], a:[0,1], why:"Each spoke has one link to the hub, so n sites need n − 1 links, far fewer than a full mesh's n(n − 1) ÷ 2. The cost is that spoke-to-spoke traffic goes through the hub, and losing the hub cuts everyone off, which is why hubs get two routers and two providers. The shape says nothing about the transport: it can run over internet VPN, MPLS or SD-WAN."},
  {lvl:1, type:"order", q:"In a three-tier campus, a PC in building A opens a file on a server plugged into an access switch in building B. Put the switches its traffic crosses in order.", items:["The access switch the PC plugs into in building A","A distribution switch in building A","A core switch","A distribution switch in building B","The access switch the server plugs into in building B"], why:"Traffic climbs from access to distribution to core, then back down the other side. Access attaches devices, distribution aggregates a building and applies policy, and the core carries traffic between distribution blocks. Without the core, every distribution switch would need links to every other one."},
  {lvl:1, type:"match", q:"Match each term with how a site connects to the internet.", pairs:[["Single-homed","One link to one ISP"],["Dual-homed","Two links to the same ISP"],["Multihomed","Links to two or more different ISPs"],["Dual multihomed","Two links to each of two or more ISPs"]], why:"Dual-homed survives a cut cable or failed router but not an outage across the whole ISP; multihomed survives one ISP failing completely; dual multihomed survives the most failures at the highest cost. Single-homed survives nothing."},
  {lvl:2, type:"fill", q:"Calculate the number of links needed for each design.", fields:[{label:"A full mesh of 10 sites", a:["45"]},{label:"A spine-leaf fabric with 4 spines and 12 leaves", a:["48"]}], why:"A full mesh needs n(n − 1) ÷ 2 = 10 × 9 ÷ 2 = 45 links (90 is the trap that counts each link twice). Spine-leaf is not a full mesh: every leaf links once to every spine, so links = leaves × spines = 12 × 4 = 48."},
  {lvl:3, q:"The design document says this access switch has redundant uplinks, one to each collapsed-core switch, HQ-CORE1 and HQ-CORE2. You run this command on it. What does the output show?", ex:"HQ-FL1-SW1#show cdp neighbors\nCapability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\n                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,\n                  D - Remote, C - CVTA, M - Two-port Mac Relay\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nHQ-CORE1         Gig 1/1/1         163             R S I  C9300-48P Gig 1/0/5\nHQ-CORE1         Gig 1/1/2         163             R S I  C9300-48P Gig 1/0/6\nSEP0C1167A2B3C4  Gig 1/0/7         127              H P M IP Phone  Port 1\n\nTotal cdp entries displayed : 3", o:["The design is correct: two uplinks, one to each core switch","Both uplinks go to HQ-CORE1, so HQ-CORE1 is a single point of failure for this floor and the cabling or the document is wrong","HQ-CORE2 is connected to port Gig 1/0/7","The switch has no uplinks; both entries are IP phones"], a:1, why:"Read Device ID and Port ID together: Gig 1/1/1 and Gig 1/1/2 both lead to HQ-CORE1 (its ports Gig 1/0/5 and 1/0/6). There are two cables but only one core switch, so if HQ-CORE1 fails the floor is cut off. The entry on Gig 1/0/7 is an IP phone (H, P). Checking a diagram against show cdp neighbors is how you catch this before an outage does."},
  {lvl:3, q:"A retail chain has 40 branches and one HQ data centre. Almost all branch traffic goes to HQ applications, the budget is tight, and a branch can live with a few seconds of failover but not a day without HQ. Which WAN design fits best?", o:["Hub-and-spoke, with HQ as the hub built on two routers and links to two different ISPs","A full mesh between all 41 sites","A single-homed hub: one router and one ISP link at HQ","A ring that joins each branch to the next one"], a:0, why:"Traffic flows branch to HQ, so hub-and-spoke matches it and needs only 40 links. A full mesh of 41 sites would need 41 × 40 ÷ 2 = 820 links to carry branch-to-branch traffic nobody sends. The weak point of hub-and-spoke is the hub, so that is where the money goes: two routers and two ISPs (multihomed). A single-homed hub leaves all 40 branches depending on one box and one provider, and a ring makes traffic cross other branches to reach HQ."},
  {lvl:2, q:"A data centre fabric has 4 spine switches and 20 leaves, cabled correctly. One spine fails. What happens?", o:["Every leaf keeps three of its four uplinks, so all servers can still reach each other in two hops, with about 25% less fabric bandwidth","Every leaf connected to that spine is cut off","Traffic now crosses two spines, so paths get longer","Leaves start forwarding to each other directly"], a:0, why:"Every leaf connects to every spine, so losing one spine removes one uplink from each leaf, not a whole leaf. Any server can still reach any other leaf through one of the remaining spines: leaf, spine, leaf, the same two hops as before. The fabric loses a quarter of its capacity, which is why spines are sized with headroom. There are no leaf-to-leaf links to fall back on."},
  {lvl:3, type:"multi", q:"You are reviewing the design notes in the exhibit for a new branch. Which four are single points of failure? (Choose four.)", ex:"Design notes, Ikeja branch (draft 2)\n- Internet: one fibre from ISP-A into BR-RTR1\n- BR-RTR1 to BR-FW1: one cable\n- BR-FW1 to CORE-SW1 and to CORE-SW2: one cable each\n- CORE-SW1 to CORE-SW2: two cables\n- ACC-SW1 to ACC-SW4: one uplink to CORE-SW1 and one to CORE-SW2\n- Power: all comms-room equipment on one UPS; generator auto-start", o:["The single ISP-A fibre (and ISP-A itself)","BR-RTR1","BR-FW1","The single UPS","CORE-SW1","The links between CORE-SW1 and CORE-SW2"], a:[0,1,2,3], why:"A single point of failure is anything whose loss alone takes the service down. Internet traffic must cross one ISP link, one router and one firewall, so each of those is one, and so is the single UPS, because it feeds both core switches too. The core itself is redundant: if CORE-SW1 dies, the firewall and every access switch still reach CORE-SW2, and the core-to-core links are doubled. Fixes in order of value: a second ISP, then a second router and firewall, then a second UPS."},
  {lvl:2, type:"fill", q:"A company has two hub sites joined by one link, and 18 branches. Each branch has one link to each hub. How many WAN links is that in total?", a:["37"], why:"Each branch has 2 links, one per hub: 18 × 2 = 36. Add the link between the hubs: 37. A full mesh of the same 20 sites would need 20 × 19 ÷ 2 = 190 links. Dual hubs remove the single hub as a point of failure for a small fraction of the cost of a mesh."},
  {lvl:2, q:"A campus has grown from one building to five, each with its own pair of distribution switches. Why is this the point to add a separate core layer?", o:["Without a core, every distribution block needs links to every other block, so links and complexity grow quickly; a core joins them all with a few fast links","A two-tier design can't route between VLANs","Distribution switches can't be made redundant without a core","The core layer is where user PCs and APs plug in"], a:0, why:"Without a core, the distribution blocks link to each other directly. Five blocks in a mesh means 5 × 4 ÷ 2 = 10 sets of links, and every new building adds more. With a core, each block connects only to the core pair, so the design stays simple as it grows. Two-tier designs route perfectly well and can be fully redundant, and users plug into the access layer, not the core."},
],
cards:[
  {f:"Physical vs logical topology", b:"Physical: how cables and devices are actually laid out. Logical: how data flows and how the network is divided (subnets, VLANs, routing)."},
  {f:"Full mesh link formula", b:"n(n − 1) ÷ 2. Example: 5 sites → 10 links; 20 sites → 190; each router needs n − 1 links."},
  {f:"Single point of failure (SPOF)", b:"Any one device, link, power feed or provider whose failure alone stops the network or part of it. Fixed with redundancy."},
  {f:"Star vs extended star", b:"Star: every device cabled to one central switch. Extended star: several stars whose switches connect to a central switch (a star of stars)."},
  {f:"Three-tier campus layers", b:"Access: end devices, PoE, port security. Distribution: aggregates access, inter-VLAN routing, policy. Core: fast, redundant backbone between distribution blocks."},
  {f:"Collapsed core (two-tier)", b:"Core and distribution combined into one switch pair. Common for one building or a small campus; add a separate core at about 3+ distribution blocks."},
  {f:"SOHO", b:"Small Office/Home Office: one all-in-one box acting as router, switch, Wi-Fi AP, firewall and DHCP server (often modem too)."},
  {f:"Spine-leaf rules", b:"Endpoints connect to leaves; every leaf connects to every spine; no leaf-leaf or spine-spine links. Every path is leaf → spine → leaf."},
  {f:"North-south vs east-west traffic", b:"North-south: in and out of the data centre (users ↔ servers). East-west: server to server inside the data centre."},
  {f:"Hub-and-spoke WAN", b:"Every branch links to a central hub; n − 1 links for n sites; branch-to-branch goes via the hub; the hub must be redundant."},
  {f:"Internet VPN vs MPLS vs SD-WAN", b:"VPN: encrypted tunnels over the internet, cheap, no SLA. MPLS: provider's private WAN with an SLA. SD-WAN: central controller, multiple transports, per-application path choice."},
  {f:"L1 vs L3 diagram", b:"L1 physical: devices, ports at both ends, cable types, racks. L3 logical: subnets, gateway IPs, VLANs, routing. Both need names, legend, date and version."},
],
});
// ---------- Lesson 5 ----------
L.push({
id:"net-models", mins:60, level:"Beginner · builds on lessons 1–4",
t:"The OSI and TCP/IP models — the map you'll troubleshoot with every day",
html:`
${K.goals([
  "Explain why networks need standards and who writes them (IEEE, IETF, ISO).",
  "Name the seven OSI layers in order, with each one's job, an example protocol, its device and its PDU.",
  "Map OSI onto the TCP/IP model, and say what a “Layer 3 switch” or “Layer 7 firewall” is.",
  "Pick a troubleshooting method — bottom-up, top-down, divide-and-conquer, follow-the-path — to fit the problem.",
  "Narrow a vague ticket like “the VPN connects but nothing loads” to one layer with a few tests.",
])}
${K.pre([
  "Lesson 1 — the web-request journey (DHCP, DNS, ARP, routing, TCP, HTTP). Here you sort those steps into layers.",
  "Lessons 2–4 — the devices, cables and topologies. This lesson tells you which <i>layer</i> each device works at.",
])}

<h2>Why this matters at work</h2>
<p>Your first stand-up meeting with a network team in Victoria Island: <i>"Ikoyi branch is a Layer 1 problem — the ISP is sending someone. Abuja is fine at Layer 3, the pings work, so it's 4 or 7 — probably the new firewall rule."</i> Everybody nods. Nobody explains.</p>
<p>The numbers are layers of a model — a shared map. It lets a team split "the system is slow" into seven small, testable questions, and lets two engineers who have never met agree in one sentence on where a fault is. This lesson gives you the map, then teaches you to troubleshoot with it.</p>

<h2>Why networks need rules: standards and protocols</h2>
<p>In a typical office the laptop is Dell, its Wi-Fi card Intel, the access point Ubiquiti, the switch Cisco, the firewall Fortinet. None of these companies asked each other's permission, yet it all works the first time you plug it in. That is ${K.g("interoperability","Products from different manufacturers working together because they follow the same published standards.")}, and it exists because every maker builds to the same published rules.</p>
<p>A ${K.g("protocol","An agreed set of rules for communication: message format, message order, and what to do when a message arrives — or doesn't.")} is a set of rules two devices follow so they understand each other: <b>what the messages look like</b>, <b>in what order</b> they are sent, and <b>what to do</b> when one arrives or goes missing. A ${K.g("standard","A protocol or specification published by a recognised body so anyone can build to it.")} is a protocol, cable spec or connector design that a recognised body has published.</p>
${K.analogy(`<p>A phone call has a protocol: "Hello?", names, taking turns, "Sorry, you broke up — say that again?", then "Bye". If one side spoke only Yoruba and the other only Hausa, a perfect line would still carry nothing useful. The cable is not enough; both sides must speak the same protocol.</p>`)}
<div class="tablewrap"><table>
<tr><th>Body</th><th>What it standardises</th><th>Examples in CCNA</th></tr>
<tr><td>${K.g("IEEE","Institute of Electrical and Electronics Engineers. Its 802 committee writes LAN standards.")}</td><td>Cables and radio inside a LAN</td><td><b>802.3</b> Ethernet, <b>802.11</b> Wi-Fi, <b>${K.g("802.1Q","The IEEE standard for VLAN tagging: a small tag added inside Ethernet frames so one cable between switches can carry many VLANs. You'll use it in a later module.")}</b> VLAN tagging</td></tr>
<tr><td>${K.g("IETF","Internet Engineering Task Force: the open community that designs internet protocols and publishes them as RFCs.")}</td><td>Internet protocols, from IP upwards</td><td>IPv4 (RFC 791), TCP (RFC 9293, replacing RFC 793), ${K.g("UDP","User Datagram Protocol: TCP's lightweight partner. It sends data without setting up a connection or resending anything lost — fast, and used for DNS lookups, voice and video. Lesson 7 compares the two.")} (RFC 768), DNS, ${K.g("OSPF","Open Shortest Path First: a routing protocol that routers use to share what they know and pick the best path automatically. You'll configure it in a later module.")}</td></tr>
<tr><td>${K.g("ISO","International Organization for Standardization.")}</td><td>International standards of every kind</td><td>The OSI reference model</td></tr>
</table></div>
<p>IETF documents are called ${K.g("RFCs","Request for Comments: numbered IETF documents, many of which officially define internet protocols.")}. "802.x" means an IEEE LAN standard; "RFC x" means an IETF internet protocol — that alone helps you read datasheets.</p>
${K.dyk(`A published RFC is never edited — a newer one replaces it, which is why TCP is now RFC 9293, not 793. The IETF also has a sense of humour: RFC 1149, published on 1 April 1990, describes carrying IP packets by pigeon.`)}
<p>A ${K.g("networking model","A way of grouping network functions into layers, each with one job.")} sorts thousands of protocols into <b>layers</b>. Each layer has one job, uses the layer below and serves the layer above. So you can change one layer without breaking the rest (your browser doesn't care if you're on Wi-Fi or 4G), vendors can specialise, and troubleshooting becomes a checklist: "Layer 1 fine? Layer 2? Layer 3?"</p>
${K.check({q:"A Huawei laptop, a TP-Link access point and a Cisco switch work together with no special setup. The main reason is…", o:["They all run the same operating system","They all follow the same published standards, such as IEEE 802.11 and 802.3","Cisco licenses its software to the others","The ISP configures them remotely"], a:1, why:"Interoperability: each maker builds to the same public standards, so their products understand each other."})}

<h2>The OSI model, layer by layer</h2>
<p>The ${K.g("OSI model","Open Systems Interconnection reference model, published by ISO: seven layers from Physical (1) to Application (7).")} was published by ISO in 1984 (as ISO 7498). Its own protocols mostly lost to TCP/IP, but its seven layers became the industry's vocabulary. "Layer 3" always means OSI Layer 3.</p>
<p>Layers are numbered from the bottom: 1 is the cable, 7 is the application. We walk them top-down, the way data travels when your laptop <i>sends</i>. Each layer wraps the data in its own information, and the wrapped unit has a name — the layer's ${K.g("PDU","Protocol Data Unit: the name for data at a layer. L5–7 data, L4 segment/datagram, L3 packet, L2 frame, L1 bits.")}. Saying "frame" or "packet" tells a listener which layer you mean. (The wrapping itself is lesson 6.)</p>

<h3>Layer 7 — Application</h3>
<p><b>Plain words:</b> the network services programs use — web pages, email, name lookups. <b>Precisely:</b> the protocols applications use to talk across the network. Chrome is not Layer 7; HTTP, the protocol Chrome speaks, is.</p>
<ul>
<li><b>Examples:</b> HTTP/HTTPS, DNS, DHCP, ${K.g("SMTP","Simple Mail Transfer Protocol: how email is sent from your mail program to a server, and from one mail server to another.")}, SSH. <b>Devices:</b> proxies, application-aware firewalls, Layer 7 load balancers. <b>PDU:</b> data.</li>
<li><b>Real fault:</b> the DNS server stops answering, so "every website is down" while the internet link is perfect.</li>
</ul>

<h3>Layers 6 and 5 — Presentation and Session</h3>
<p><b>Presentation (6)</b> makes data readable on the other side: character encoding (${K.g("ASCII","American Standard Code for Information Interchange: the classic code that turns letters and digits into numbers, e.g. capital A = 65.")}, ${K.g("UTF-8","Unicode Transformation Format, 8-bit: the modern text encoding that covers every language's characters (and emoji). Nearly every web page uses it.")}), formats (JPEG, MP4), compression and encryption. TLS, the "S" in HTTPS, is often taught here. <b>Session (5)</b> starts, tracks and ends conversations between applications; ${K.g("NetBIOS","An old Windows service for naming PCs and opening sessions between them on a LAN, used for file and printer sharing.")} and ${K.g("RPC","Remote Procedure Call: a way for a program to ask another computer to run a task for it as if it were local. Windows uses it heavily.")} are the usual examples.</p>
<ul>
<li><b>Devices:</b> none dedicated — host software does this work. <b>PDU:</b> data.</li>
<li><b>Real faults:</b> an exported report shows <code>Ad?b?y?</code> instead of <code>Adébáyọ̀</code> (encoding — L6); an app logs users out every ten minutes (session — L5).</li>
</ul>

<h3>Layer 4 — Transport</h3>
<p><b>Plain words:</b> getting data to the right <i>program</i> on the other machine, and, if asked, making sure nothing is lost. <b>Precisely:</b> end-to-end delivery between applications using ${K.g("port numbers","Numbers 0–65535 identifying the application: 80 HTTP, 443 HTTPS, 53 DNS, 22 SSH, 3389 Remote Desktop.")}; TCP adds ordering, retransmission and flow control, UDP skips them for speed (lesson 7).</p>
<ul>
<li><b>Examples:</b> TCP, UDP. <b>Devices:</b> stateful firewalls, Layer 4 load balancers. <b>PDU:</b> ${K.g("segment","Layer 4 PDU with TCP: data plus a TCP header (ports, sequence numbers).")} (TCP) or ${K.g("datagram","Layer 4 PDU with UDP.")} (UDP).</li>
<li><b>Real fault:</b> a new firewall rule blocks TCP 3389, so Remote Desktop fails while <code>ping</code> to the same server works.</li>
</ul>

<h3>Layer 3 — Network</h3>
<p><b>Plain words:</b> addresses that say <i>where</i> a device is, and a path across many networks to reach it. <b>Precisely:</b> logical addressing (IP) and routing — choosing the next hop, network by network.</p>
<ul>
<li><b>Examples:</b> IPv4, IPv6, ${K.g("ICMP","Internet Control Message Protocol: IP's error and test messages, including the echo request/reply that ping uses.")}, OSPF. <b>Devices:</b> routers, Layer 3 switches. <b>PDU:</b> ${K.g("packet","Layer 3 PDU: a segment plus an IP header with source and destination IP addresses.")}.</li>
<li><b>Real fault:</b> a PC with the wrong default gateway reaches everything in its own network and nothing beyond it.</li>
</ul>

<h3>Layer 2 — Data Link</h3>
<p><b>Plain words:</b> delivery to the <i>next device</i> on the same link — laptop to switch, switch to router — by MAC address. <b>Precisely:</b> Layer 2 builds ${K.g("frames","Layer 2 PDU: a packet plus a header with MAC addresses and a trailer (FCS) for error checking.")}, controls access to the medium and detects corruption with the ${K.g("FCS trailer","Frame Check Sequence: a checksum in the frame trailer. If it doesn't match on arrival, the frame is discarded and counted as a CRC error.")}. IEEE splits it into ${K.g("LLC","Logical Link Control (IEEE 802.2): the upper part of Layer 2, which tells the receiver what kind of Layer 3 data is inside the frame.")} (802.2) and MAC sublayers. It never crosses a router.</p>
<ul>
<li><b>Examples:</b> Ethernet 802.3, the 802.11 MAC, 802.1Q, ${K.g("PPP","Point-to-Point Protocol: a Layer 2 protocol for a link that joins exactly two devices, such as a serial WAN link or many broadband connections.")}. <b>Devices:</b> switches, bridges, access points, the ${K.g("NIC","Network Interface Card: a device's Ethernet or Wi-Fi hardware, working at Layers 1 and 2.")}. <b>PDU:</b> frame.</li>
<li><b>Real fault:</b> a switch port in the wrong ${K.g("VLAN","Virtual LAN: one switch split into separate Layer 2 networks. Covered in a later module.")}, so the PC lands on the wrong network.</li>
</ul>

<h3>Layer 1 — Physical</h3>
<p><b>Plain words:</b> cables, connectors and radio — ones and zeros as electricity, light or radio waves. <b>Precisely:</b> the medium and the signalling on it: voltages, light, frequencies, connectors, pinouts, lengths, data rates. No addresses, only ${K.g("bits","Layer 1 PDU: 1s and 0s sent as electrical, light or radio signals.")}.</p>
<ul>
<li><b>Examples:</b> 1000BASE-T with ${K.g("RJ-45","Registered Jack 45: the 8-pin plug on an Ethernet cable — the one that clicks into a laptop or switch port.")}, 10GBASE-SR fibre, the 802.11 radio. <b>Devices:</b> cables, patch panels, hubs, repeaters, ${K.g("transceivers","Modules such as SFPs that convert electrical signals to light (or another medium) and back.")}. <b>PDU:</b> bits.</li>
<li><b>Real fault:</b> a cable knocked out by a cleaner, a fibre bent too tightly, or a power cut that kills an access switch with no UPS.</li>
</ul>
${K.svg("0 0 740 450",
  K.txt(65,32,"PDU",{mid:true,c:"fg",b:true,f:"display",s:12})+K.txt(225,32,"OSI model",{mid:true,c:"fg",b:true,f:"display",s:12})+
  K.txt(465,32,"TCP/IP (5-layer, CCNA)",{mid:true,c:"fg",b:true,f:"display",s:12})+K.txt(655,32,"TCP/IP (original)",{mid:true,c:"fg",b:true,f:"display",s:12})+
  K.box(120,50,210,44,"7 · Application","HTTP, DNS, DHCP, SMTP",true)+K.box(120,100,210,44,"6 · Presentation","UTF-8, JPEG, encryption",true)+K.box(120,150,210,44,"5 · Session","NetBIOS, RPC",true)+
  K.box(120,200,210,44,"4 · Transport","TCP, UDP — ports")+K.box(120,250,210,44,"3 · Network","IPv4, IPv6, ICMP, OSPF")+
  K.box(120,300,210,44,"2 · Data Link","Ethernet 802.3, Wi-Fi MAC")+K.box(120,350,210,44,"1 · Physical","cables, fibre, radio, RJ-45")+
  K.box(380,50,170,144,"Application","OSI 5 + 6 + 7",true)+K.box(380,200,170,44,"Transport","TCP, UDP")+K.box(380,250,170,44,"Network","IP")+
  K.box(380,300,170,44,"Data Link","Ethernet, 802.11")+K.box(380,350,170,44,"Physical","the medium")+
  K.box(580,50,150,144,"Application","",true)+K.box(580,200,150,44,"Transport","")+K.box(580,250,150,44,"Internet","")+
  K.box(580,300,150,94,"Link","a.k.a. Network Access")+
  K.txt(65,126,"Data",{mid:true,c:"fg",s:12})+K.txt(65,220,"Segment",{mid:true,c:"fg",s:12})+K.txt(65,234,"(UDP: datagram)",{mid:true,s:9.5})+
  K.txt(65,276,"Packet",{mid:true,c:"fg",s:12})+K.txt(65,326,"Frame",{mid:true,c:"fg",s:12})+K.txt(65,376,"Bits",{mid:true,c:"fg",s:12})+
  K.link(330,122,380,122,"",true)+K.link(330,222,380,222,"",true)+K.link(330,272,380,272,"",true)+K.link(330,322,380,322,"",true)+K.link(330,372,380,372,"",true)+
  K.link(550,122,580,122,"",true)+K.link(550,222,580,222,"",true)+K.link(550,272,580,272,"",true)+K.link(550,347,580,347,"",true)+
  K.txt(370,428,"OSI 5–7 become one Application layer; the original model also merges Data Link + Physical into Link.",{mid:true,s:10.5}),
  "The OSI model (left) beside the two versions of the TCP/IP model. Rows that line up do the same job. The PDU column names the data at each layer.")}
${K.remember(`<p><b>Bottom-up (1 → 7):</b> "<b>P</b>lease <b>D</b>o <b>N</b>ot <b>T</b>hrow <b>S</b>ausage <b>P</b>izza <b>A</b>way" — Physical, Data Link, Network, Transport, Session, Presentation, Application.</p><p><b>Top-down (7 → 1):</b> "<b>A</b>ll <b>P</b>eople <b>S</b>eem <b>T</b>o <b>N</b>eed <b>D</b>ata <b>P</b>rocessing".</p><p><b>PDUs, top to bottom:</b> data, segment, packet, frame, bits.</p>`)}
${K.video({t:"OSI model explained", u:"https://www.youtube.com/results?search_query=OSI+model+explained+CCNA+200-301", by:"YouTube search", why:"Pick a recent CCNA 200-301 video and watch the layers animated."})}
${K.myth([
  ["OSI is software that runs on routers.", "It is a <i>reference model</i>. Networks run TCP/IP protocols; OSI numbers are how we describe them."],
  ["TCP/IP replaced OSI, so OSI is useless.", "OSI's protocols lost, but its layer numbers are the everyday language of the job."],
  ["Every device uses all seven layers.", "A switch works up to Layer 2, a router up to Layer 3. Only the end hosts use the whole stack."],
  ["If the website fails, the problem is at Layer 7.", "A fault at any layer breaks everything above it. A loose cable looks like a website problem."],
])}
${K.check({q:"A PC reaches every device in its own office but nothing outside it. Its default gateway is set to an address that doesn't exist. Which OSI layer is the fault at?", o:["Layer 1 — Physical","Layer 2 — Data Link","Layer 3 — Network","Layer 7 — Application"], a:2, why:"The gateway is the router used to leave the network — routing, Layer 3. Local traffic works, so Layers 1 and 2 are fine."})}

<h2>The TCP/IP model, and why we still say "Layer 3"</h2>
<p>While OSI was being designed by committee, the internet already ran on the ${K.g("TCP/IP model","The model behind internet protocols. Original (RFC 1122): Application, Transport, Internet, Link. CCNA's 5-layer version splits Link into Data Link and Physical.")}. It won because it was free, it worked, and it was deployed. Know both versions:</p>
<ul>
<li><b>Original, 4 layers</b> (RFC 1122): Application, Transport, Internet, Link (also called <i>Network Access</i>). It left cables to bodies such as the IEEE.</li>
<li><b>CCNA's 5 layers:</b> Application, Transport, Network, Data Link, Physical — Link split in two, so the lower layers match OSI 1–4.</li>
</ul>
<p>In both, OSI's Session, Presentation and Application become one Application layer, because in real software HTTP, encryption and session handling all live inside the application.</p>
${K.exam(`Questions may say "TCP/IP model" and mean either version. If an option says <b>Internet</b> layer, they mean the 4-layer model's Layer 3; <b>Network Access</b> or <b>Link</b> means OSI 1 + 2. Also watch PDU wording: "segment" is Layer 4, "packet" Layer 3, "frame" Layer 2 — a classic trap swaps packet and frame.`)}
<div class="tablewrap"><table>
<tr><th>OSI</th><th>TCP/IP (5)</th><th>Job</th><th>Examples</th><th>Device</th><th>PDU</th><th>Typical fault</th></tr>
<tr><td><b>7</b> Application</td><td rowspan="3">Application</td><td>Services for apps</td><td>HTTP, DNS, SMTP</td><td>Proxy, L7 firewall</td><td rowspan="3">Data</td><td>DNS down</td></tr>
<tr><td><b>6</b> Presentation</td><td>Encoding, encryption</td><td>UTF-8, JPEG</td><td>—</td><td>Garbled text</td></tr>
<tr><td><b>5</b> Session</td><td>Open/close conversations</td><td>NetBIOS, RPC</td><td>—</td><td>Forced logouts</td></tr>
<tr><td><b>4</b> Transport</td><td>Transport</td><td>Program to program, ports</td><td>TCP, UDP</td><td>Stateful firewall, L4 load balancer</td><td>Segment / datagram</td><td>Port blocked</td></tr>
<tr><td><b>3</b> Network</td><td>Network</td><td>IP addressing, routing</td><td>IPv4, IPv6, ICMP</td><td>Router, L3 switch</td><td>Packet</td><td>Wrong gateway, missing route</td></tr>
<tr><td><b>2</b> Data Link</td><td>Data Link</td><td>Next-device delivery, MAC</td><td>Ethernet, 802.11</td><td>Switch, AP, NIC</td><td>Frame</td><td>Wrong VLAN</td></tr>
<tr><td><b>1</b> Physical</td><td>Physical</td><td>Bits as signals</td><td>1000BASE-T, fibre</td><td>Cable, hub, SFP</td><td>Bits</td><td>Bad cable, power cut</td></tr>
</table></div>

<h3>Layer numbers in real jobs</h3>
<ul>
<li><b>Layer 2 switch</b> — forwards frames by MAC address within one network.</li>
<li><b>Layer 3 switch</b> (multilayer switch) — also <i>routes</i> between networks (VLANs) in hardware. Common in company cores.</li>
<li><b>Layer 4 load balancer</b> — spreads connections across servers using only IPs and ports.</li>
<li><b>Layer 7 load balancer</b> — reads the HTTP request, so it can send <code>/api</code> to one server group and <code>/images</code> to another.</li>
<li><b>Layer 7 firewall</b> (next-generation) — identifies the application, not only the port: it can allow Teams and block a game though both use 443.</li>
<li><b>"A Layer 1 issue"</b> — cabling, power, optics or radio: someone goes on site, or you call the ISP.</li>
</ul>
${K.mistake(`Saying "a switch is Layer 2, full stop". Layer 3 switches route too. The strong interview answer: "a traditional switch works at Layer 2; a multilayer switch can also route at Layer 3".`)}
${K.check({q:"A load balancer sends requests for <code>/payments</code> to one server farm and everything else to another. Which kind must it be?", o:["Layer 2","Layer 3","Layer 4","Layer 7"], a:3, why:"The URL path is inside the HTTP request — application data. A Layer 4 balancer only sees IPs and ports."})}
${K.q({type:"match", q:"Match each device to the highest OSI layer it reads to make its decision.", pairs:[["Hub","Layer 1"],["Traditional switch","Layer 2"],["Router","Layer 3"],["Firewall that filters by port number only","Layer 4"],["Next-generation firewall that tells Teams from a game, both on TCP 443","Layer 7"]], why:"A hub repeats bits without reading addresses (L1). A switch reads MAC addresses (L2), a router reads IP addresses (L3), a port-based filter reads TCP/UDP ports (L4), and identifying the application itself needs Layer 7 inspection."})}

<h2>Talking to your twin: peer layers</h2>
<p>Each layer on your laptop behaves as if it talks <b>directly to the same layer</b> on the other device: your HTTP to the server's HTTP, your TCP to the server's TCP. This is ${K.g("peer-layer communication","Each layer talks logically to the same layer on the other device using its own header, while really handing data to the layer below.")} — logical, not physical.</p>
<p>Physically, data goes <i>down</i> the sender's stack, across the cable as bits, through each device on the path, and <i>up</i> the receiver's stack. Each layer adds a ${K.g("header","Control information a layer adds in front of the data — ports (L4), IP addresses (L3), MAC addresses (L2). Only the matching layer on the far side reads it.")} that only its twin will read.</p>
${K.svg("0 0 740 360",
  K.txt(105,28,"Host A — your laptop",{mid:true,c:"fg",b:true,f:"display",s:12})+K.txt(370,28,"Router",{mid:true,c:"fg",b:true,f:"display",s:12})+K.txt(635,28,"Host B — web server",{mid:true,c:"fg",b:true,f:"display",s:12})+
  K.txt(105,44,"sends: data goes down",{mid:true})+K.txt(370,44,"goes up to Layer 3 only",{mid:true})+K.txt(635,44,"receives: data goes up",{mid:true})+
  K.box(30,60,150,40,"Application","HTTP")+K.box(30,110,150,40,"Transport","TCP")+K.box(30,160,150,40,"Network","IP")+K.box(30,210,150,40,"Data Link","Ethernet")+K.box(30,260,150,40,"Physical","bits",true)+
  K.box(295,160,150,40,"Network","IP")+K.box(295,210,150,40,"Data Link","Ethernet")+K.box(295,260,150,40,"Physical","bits",true)+
  K.box(560,60,150,40,"Application","HTTP")+K.box(560,110,150,40,"Transport","TCP")+K.box(560,160,150,40,"Network","IP")+K.box(560,210,150,40,"Data Link","Ethernet")+K.box(560,260,150,40,"Physical","bits",true)+
  K.link(180,80,560,80,"logical: HTTP talks to HTTP",true)+K.link(180,130,560,130,"logical: TCP talks to TCP",true)+
  K.link(180,180,295,180,"IP",true)+K.link(445,180,560,180,"IP",true)+K.link(180,230,295,230,"Ethernet",true)+K.link(445,230,560,230,"Ethernet",true)+
  K.arrow(180,282,293,282,"cable",true)+K.arrow(445,282,558,282,"cable",true)+
  K.arrow(18,70,18,290,"",true)+K.arrow(722,290,722,70,"",true)+
  K.txt(370,334,"Dashed = logical conversation between peer layers. Accent arrows = the real physical path.",{mid:true,s:10.5}),
  "Each layer talks logically to its twin. Physically, data goes down Host A, across each link, up to Layer 3 in the router and back down, then up Host B.")}
<p>The router only goes up to <b>Layer 3</b>: it reads the IP header, picks the next hop, builds a <i>new</i> Layer 2 frame for the next link and sends it. It never reads TCP or HTTP. A switch goes up only to Layer 2. That is what "a router is a Layer 3 device" means.</p>
<p>Ethernet talks <b>per link</b> while IP talks <b>end to end</b> — lesson 1's MAC-versus-IP split, seen through the model.</p>
${K.analogy(`<p>Two managing directors in Lagos and Nairobi exchange a contract. Each director "talks" only to the other; their personal assistants envelope and address it; the courier reads only the address. Each person deals only with their counterpart's part of the job.</p>`)}
${K.check({q:"A packet crosses a router between your laptop and a web server. Which header does the router use to choose where to send it?", o:["The HTTP header","The TCP header","The IP header","None — it floods traffic out of every port"], a:2, why:"Routers are Layer 3 devices: they read the destination IP address, choose the next hop and build a new frame. They don't need TCP or HTTP to forward."})}

<h2>Troubleshooting by layer</h2>
<p>A fault sits at one layer, and every layer above it fails too. A dead cable (L1) breaks frames, packets, TCP and the web page. Users describe the top — "the website won't load" — while the cause may be at the bottom. The model gives you an order to check things in.</p>
${K.when([
  ["Bottom-up — start at L1 and work up", "You suspect hardware, the problem is new to you, or many things fail at once.", "Methodical: nothing is skipped, and most faults are physical.", "One app fails while everything else works — slow."],
  ["Top-down — start at the app and work down", "One application fails while others work.", "The symptom points at the top, so start there.", "Nothing works at all — check the bottom first."],
  ["Divide-and-conquer — start at L3 with <code>ping</code>", "You want the fastest route; most engineers' default.", "One test clears or blames half the stack: success → go up, failure → go down.", "ICMP is blocked on that path — ping proves nothing."],
  ["Follow-the-path — trace hop by hop", "Traffic crosses several routers, sites or providers.", K.g("traceroute","Lists each router on the path to a destination (tracert on Windows), showing where traffic stops.")+" shows <i>where</i> it stops.", "Source and destination are on the same LAN."],
], "Which troubleshooting method — and why")}
<p>Lesson 1's habits still come first: <b>who</b> is affected, and <b>what changed</b>? "The whole 3rd floor, since the electrician visited" points straight at Layer 1.</p>
${K.mistake(`Treating ping as the final word. Success proves Layers 1–3 for ICMP — not that TCP 443 is open or the app is healthy. Failure doesn't always mean "down": many servers block ICMP on purpose. Use ping as evidence, then test the real port.`)}
${K.dodont([
  "Ask who is affected and what changed before touching anything.",
  "Write the layer and the evidence in the ticket: “L3 OK (ping), L4 failing (TCP 443 blocked)”.",
  "Fix at the first layer that fails, then retest every layer above it.",
],[
  "Reboot shared equipment to “see if it helps”.",
  "Stop at a successful ping and close the ticket.",
  "Jump between layers at random — you'll test things twice and miss the fault.",
])}

<h3>Worked example: a bottom-up ticket</h3>
<p><b>Ticket:</b> <i>"Funmi (Finance, Abuja office) moved to the 2nd floor this morning and can't open the accounting system or the S: drive. Everyone else on the floor is fine."</i> One person, right after a move: the cause is at her desk or PC. Bottom-up is a safe choice.</p>
${K.steps([
  ["Layer 1 — signal?", `<p>The light by the network socket on her PC is lit and blinking; Windows shows <i>Ethernet — connected</i>. <b>L1 fine.</b></p>`],
  ["Layer 2 — switch port?", `<p>The network team sees the switch port up with her PC's MAC address learned on it. <b>L2 fine.</b></p>`],
  ["Layer 3 — sensible address?", `<p>She runs <code>ipconfig</code>:</p>${K.out(`Ethernet adapter Ethernet:

   IPv4 Address. . . . . . . . . . . : 192.168.10.57
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.1`, "ipconfig on Funmi's PC after the move")}<p>The 2nd floor uses <code>192.168.20.x</code> with gateway <code>192.168.20.1</code>. Her PC kept a <b>static</b> address typed in on her old floor. (The subnetting module makes this precise; for now, the third number shows the network.)</p>`],
  ["Prove it with ping", `<p><code>ping 192.168.10.1</code>:</p>${K.out(`Pinging 192.168.10.1 with 32 bytes of data:
Reply from 192.168.10.57: Destination host unreachable.
Reply from 192.168.10.57: Destination host unreachable.
Reply from 192.168.10.57: Destination host unreachable.
Reply from 192.168.10.57: Destination host unreachable.

Ping statistics for 192.168.10.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`, "Windows ping to a gateway that isn't on this network")}<p>The replies come from <b>her own PC</b> (<code>.57</code>): Windows asked who owns 192.168.10.1 and nobody answered. "0% loss" is misleading — these are her PC's own error messages. <b>L3 is where it breaks.</b></p>`],
  ["Fix at that layer", `<p>Set the adapter to <i>Obtain an IP address automatically</i> (DHCP). <code>ipconfig</code> now shows <code>192.168.20.64</code>, gateway <code>192.168.20.1</code>, and the gateway answers: <code>Reply from 192.168.20.1: bytes=32 time&lt;1ms TTL=255</code>.</p>`],
  ["Keep climbing — L4 and L7", `<p>In PowerShell, test the file server's file-sharing port, 445:</p>${K.out(`ComputerName     : 192.168.50.10
RemoteAddress    : 192.168.50.10
RemotePort       : 445
InterfaceAlias   : Ethernet
SourceAddress    : 192.168.20.64
TcpTestSucceeded : True`, "Test-NetConnection 192.168.50.10 -Port 445")}<p><code>SourceAddress</code> is the address her PC used; <code>TcpTestSucceeded : True</code> means TCP 445 opened — L4 fine. Finally L7: the S: drive and accounting system open. Resolved.</p>`],
])}

<h3>Hands-on: walk a router bottom-up</h3>
<p>The Abuja branch has "no connection to head office". On Cisco, <code>show ip interface brief</code> shows two layers at once: <b>Status</b> is Layer 1 (physical link) and <b>Protocol</b> is Layer 2 (the line protocol).</p>
<div class="tablewrap"><table>
<tr><th>Status / Protocol</th><th>Meaning</th></tr>
<tr><td>up / up</td><td>L1 and L2 working — move on to L3</td></tr>
<tr><td>administratively down / down</td><td>Switched off with <code>shutdown</code> — fix with <code>no shutdown</code></td></tr>
<tr><td>down / down</td><td>No physical link: cable, optic, or far end off — L1</td></tr>
<tr><td>up / down</td><td>Signal present but the L2 protocol isn't up (e.g. mismatched WAN settings) — L2</td></tr>
</table></div>
${K.hint(`Find the interface described as the WAN link. If its Status is not <code>up</code>, compare it with the table above before you change anything.`)}
${K.term({env:"ios", title:"bottom-up on the Abuja branch router", opts:{host:"ABJ-BR-RTR", kind:"router", strictPing:true,
  neighbor:{ifname:"GigabitEthernet0/1", peerIp:"102.89.4.17"},
  intfs:{"GigabitEthernet0/0":{ip:"10.20.1.1",mask:"255.255.255.0",shut:false,vlan:1,mode:"access",allowed:null,desc:"BRANCH-LAN"},
         "GigabitEthernet0/1":{ip:"102.89.4.18",mask:"255.255.255.252",shut:true,vlan:1,mode:"access",allowed:null,desc:"WAN-TO-ISP"},
         "GigabitEthernet0/2":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null}},
  motd:"ABJ-BR-RTR — console. Ticket: branch has no connection to head office since last night's maintenance."},
  intro:"The ISP's end of the WAN link is <code>102.89.4.17</code>. Read Layers 1–2, fix what you find, then prove Layer 3 with a ping.",
  tasks:[
    {text:"Type <code>enable</code> to reach privileged mode (<code>#</code>)", done:e=>e.mode!=="user"},
    {text:"Run <code>show ip interface brief</code> — read the WAN interface's Status (L1) and Protocol (L2)", done:e=>e.history.some(h=>/^\s*sh(o|ow)?\s+ip\s+int/i.test(h))},
    {text:"Bring the WAN interface up: <code>configure terminal</code>, <code>interface g0/1</code>, <code>no shutdown</code>, <code>end</code>", done:e=>!e.intfs["GigabitEthernet0/1"].shut},
    {text:"Prove Layer 3: <code>ping 102.89.4.17</code> must succeed", done:e=>!!(e.pinged&&e.pinged["102.89.4.17"]===true)},
    {text:"Save the fix so it survives a reboot or power cut: <code>copy running-config startup-config</code>", done:e=>e.savedOnce},
  ],
  win:"You read Layers 1–2 from one command, fixed the fault, proved Layer 3 with ping and saved — a complete bottom-up repair.",
  solve:["enable","show ip interface brief","configure terminal","interface g0/1","no shutdown","end","ping 102.89.4.17","copy running-config startup-config"]})}
<p><code>GigabitEthernet0/1</code> was <code>administratively down</code> — someone typed <code>shutdown</code> during maintenance. After <code>no shutdown</code>, <code>%LINK-3-UPDOWN</code> (Layer 1) then <code>%LINEPROTO-5-UPDOWN</code> (Layer 2) report each layer coming up. A ping before the fix shows <code>.....</code>: every echo timed out.</p>

${K.job("“The VPN connects, but nothing loads”",`
<p><b>The ticket.</b> Monday, 8:40. Emeka, at home in Port Harcourt on an MTN 4G router: "The VPN says <i>Connected</i> but the intranet and shared drives won't open. Teams and Gmail work." Two more identical tickets arrive within ten minutes.</p>
<p><b>Questions.</b> <i>Only you?</i> No — three remote users since this morning, so suspect something shared. <i>What fails?</i> Internal sites, by name. <i>What changed?</i> The change log shows the VPN profile was updated on Sunday night.</p>
<p><b>Checks, by layer.</b> The internet works, so his link to the ISP is fine, and the VPN shows a tunnel. Divide-and-conquer from Layer 3 <i>through</i> the tunnel: <code>ping 10.10.5.20</code> (the intranet server) replies — L3 fine. <code>Test-NetConnection 10.10.5.20 -Port 443</code> gives <code>TcpTestSucceeded : True</code> — L4 fine. He uses <i>names</i>, so test DNS:</p>
${K.out(`Server:  UnKnown
Address:  192.168.8.1

*** UnKnown can't find intranet.corp.local: Non-existent domain`, "nslookup intranet.corp.local on Emeka's laptop, VPN connected")}
<p>The <code>Address</code> line is the clue: he is asking <code>192.168.8.1</code>, his home router, not the company DNS server. Everything below works; names fail — Layer 7.</p>
<p><b>Fix.</b> You escalate with this evidence. The network team finds Sunday's change removed the internal DNS server <code>10.10.1.10</code> from the VPN profile and restores it. After reconnecting, <code>nslookup</code> answers from <code>10.10.1.10</code> with <code>10.10.5.20</code>, and the intranet opens.</p>
<p><b>What you say.</b> "The VPN was connecting fine, but last night's update stopped it telling your laptop where to look up our internal names. It's corrected — please disconnect and reconnect."</p>
<p><b>Ticket note.</b> <i>"3 remote users: VPN up, internal names fail. L3 OK (ping 10.10.5.20), L4 OK (TCP 443), DNS failing — clients using home router 192.168.8.1. Cause: Sunday's VPN profile change removed DNS 10.10.1.10. Network team restored it. Users reconnected; nslookup and intranet confirmed. Resolved."</i></p>
<p>The layers saved you from reinstalling the VPN client or blaming MTN: three tests, one layer each, and the fault had nowhere to hide.</p>`)}
${K.case("The “slow website” that was a Layer 1 problem",`
<p>A logistics company in Apapa complained for a week that its booking website "is slow in the afternoons". The developers tuned the database (Layer 7). The ISP checked its link and found nothing. Nothing changed.</p>
<p>A network engineer went bottom-up on the office side. On the switch port facing the office firewall, <code>show interfaces</code> showed:</p>
${K.out(`GigabitEthernet0/24 is up, line protocol is up (connected)
  ...
  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  ...
     18342 input errors, 18342 CRC, 0 frame, 0 overrun, 0 ignored`, "Trimmed show interfaces output from the office switch")}
<p>Two clues. The port had come up at <b>100 Mb/s</b> on a gigabit link, and the <b>CRC</b> counter — frames whose FCS check failed — was in the thousands and climbing. Both point to a damaged cable. The patch lead ran behind the air-conditioner and had been crushed when the unit was serviced; errors rose as the room heated up in the afternoon. Each corrupted frame was discarded, TCP resent the data, and users felt "slowness".</p>
<p>A new cable fixed it in two minutes. The team added a line to its runbook: <b>"slow" can be any layer — check Layer 1 and 2 error counters before tuning applications.</b></p>`)}
${K.check({q:"A web app is slow. Ping to the server works, but the switch port facing the server shows thousands of rising CRC errors. Where is the fault most likely?", o:["Layer 7 — the web application","Layer 4 — TCP settings","Layer 1 — cabling or the transceiver","Layer 3 — routing"], a:2, why:"CRC errors mean frames arrive corrupted — almost always physical: a damaged cable, bad connector or failing transceiver. Ping can still succeed; TCP resends the lost data, which users feel as slowness."})}
${K.q({type:"multi", q:"A ping from a user's PC to a web server succeeds. Which two things has that NOT proved? (Choose two.)", o:["TCP port 443 is open on the server","Layers 1–3 work along the path, at least for ICMP","The web application itself is healthy","The server's IP address is reachable from the PC"], a:[0,2], why:"Ping is ICMP, which has no ports: a reply proves Layers 1–3 and that the host answers. It says nothing about whether TCP 443 is allowed through a firewall or whether the application behind it works — test the real port next."})}

<h2>Practice: which layer is it?</h2>
<p>Write down the OSI layer (1–7) for each before opening the answers.</p>
<ol>
<li>A fibre patch lead bent sharply behind a rack.</li>
<li>A switch learns which port a MAC address is on.</li>
<li>A router picks the best path to a branch using OSPF.</li>
<li>A firewall rule blocks TCP port 3389.</li>
<li>A web page returns "404 Not Found".</li>
<li>Exported names show strange symbols instead of accented letters.</li>
<li>A switch port put in the wrong VLAN.</li>
<li>A hub.</li>
<li>Wi-Fi drops whenever the kitchen microwave runs.</li>
<li>A load balancer that looks only at IP addresses and ports.</li>
</ol>
${K.hint(`For each item ask: what does it read or touch? Signals or cables → 1. MAC addresses or VLANs → 2. IP addresses or routes → 3. Port numbers → 4. The content of an app's messages → 7.`)}
${K.reveal("Show the answers",`<div class="tablewrap"><table>
<tr><th>#</th><th>Layer</th><th>Why</th></tr>
<tr><td>1</td><td>1</td><td>The light signal itself is damaged.</td></tr>
<tr><td>2</td><td>2</td><td>MAC addresses and switching.</td></tr>
<tr><td>3</td><td>3</td><td>Choosing paths between networks is routing.</td></tr>
<tr><td>4</td><td>4</td><td>Ports belong to TCP/UDP.</td></tr>
<tr><td>5</td><td>7</td><td>An HTTP response: the request arrived; the page doesn't exist.</td></tr>
<tr><td>6</td><td>6</td><td>Character encoding is data representation.</td></tr>
<tr><td>7</td><td>2</td><td>VLANs are separate Layer 2 networks.</td></tr>
<tr><td>8</td><td>1</td><td>A hub repeats bits out of every port without reading addresses.</td></tr>
<tr><td>9</td><td>1</td><td>Microwaves emit energy around 2.4 GHz and disturb the radio signal.</td></tr>
<tr><td>10</td><td>4</td><td>Deciding by IP and port alone is a Layer 4 load balancer.</td></tr>
</table></div><p>8 or more: you've got it. Fewer: reread the layer sections tomorrow and try again.</p>`)}

<h2>Interview corner</h2>
${K.reveal("“Explain the OSI model and give an example at each layer.”",`<p>"It's ISO's seven-layer reference model for describing and troubleshooting networks. 7 Application — HTTP, DNS. 6 Presentation — encoding and encryption, like UTF-8. 5 Session — opening and closing sessions, like RPC. 4 Transport — TCP and UDP, ports; the PDU is a segment. 3 Network — IP and routing; routers, packets. 2 Data Link — Ethernet and MAC addresses; switches, frames. 1 Physical — copper, fibre, radio; bits."</p><p>Then the practical point interviewers love: "We actually run TCP/IP, which merges 5 to 7, but we use the OSI numbers — I'd often start at Layer 3 with a ping and go up or down from there."</p>`)}
${K.reveal("“What layer does a switch work at? And a router?”",`<p>"A traditional switch is Layer 2: it forwards frames by MAC address within one network. A router is Layer 3: it forwards packets between networks by IP address. A multilayer switch does both. A hub is Layer 1 — it repeats bits."</p><p>To stand out: "A router strips the incoming frame, decides on the IP header and builds a new frame for the next link — so MAC addresses change hop by hop while IP addresses stay the same end to end."</p>`)}
${K.reveal("“How do the OSI and TCP/IP models differ?”",`<p>"OSI has seven layers and is a reference model; its own protocols never caught on. TCP/IP is what the internet runs on: originally four layers — Application, Transport, Internet, Link — and five in Cisco's version, which splits Link into Data Link and Physical. TCP/IP's Application layer covers OSI 5, 6 and 7."</p>`)}

${K.recap([
  "IEEE writes LAN standards (802.3, 802.11), the IETF writes internet protocols as RFCs, ISO published the OSI model — together they make interoperability possible.",
  "OSI top to bottom: Application, Presentation, Session, Transport, Network, Data Link, Physical.",
  "PDUs: data (5–7), segment/datagram (4), packet (3), frame (2), bits (1).",
  "Hub L1, switch L2, router L3, multilayer switch L2+L3; load balancers and firewalls are L4 or L7 by what they read.",
  "TCP/IP: Application, Transport, Internet, Link — or CCNA's five, with Link split into Data Link and Physical.",
  "Peer layers talk logically; physically, data goes down, across, and up.",
  "Troubleshoot bottom-up, top-down, divide-and-conquer (start at L3) or follow-the-path, and fix at the first layer that fails.",
])}
${K.next(`<b>Lesson 6 — Encapsulation.</b> You've seen that each layer adds a header. Next you'll watch it happen: a web request wrapped into a segment, packet and frame, sent as bits, and unwrapped on the far side — header by header.`)}
`,
quiz:[
  {lvl:1, q:"Which organisation publishes the 802.3 Ethernet and 802.11 Wi-Fi standards?", o:["IETF","ISO","IEEE","ICANN"], a:2, why:"The IEEE 802 committee writes LAN standards. The IETF writes internet protocols (as RFCs); ISO published the OSI model."},
  {lvl:1, q:"Which list shows the OSI layers from Layer 1 to Layer 7?", o:["Physical, Data Link, Network, Transport, Session, Presentation, Application","Physical, Network, Data Link, Transport, Session, Application, Presentation","Application, Presentation, Session, Transport, Network, Data Link, Physical","Physical, Data Link, Transport, Network, Presentation, Session, Application"], a:0, why:"Bottom-up: Please Do Not Throw Sausage Pizza Away. Option C is correct but in the reverse order (7 to 1)."},
  {lvl:1, q:"What is the PDU at the Transport layer when TCP is used?", o:["Frame","Packet","Segment","Bits"], a:2, why:"TCP data units are segments (UDP's are datagrams). Packets are Layer 3, frames Layer 2, bits Layer 1."},
  {lvl:1, q:"At which OSI layer does a traditional (non-multilayer) switch make its forwarding decisions?", o:["Layer 1","Layer 2","Layer 3","Layer 4"], a:1, why:"A Layer 2 switch forwards frames based on destination MAC addresses."},
  {lvl:1, q:"Which TCP/IP model layer corresponds to OSI Layers 5, 6 and 7?", o:["Transport","Internet","Application","Link"], a:2, why:"TCP/IP's Application layer covers OSI's Application, Presentation and Session layers."},
  {lvl:1, q:"In the original 4-layer TCP/IP model, which layer covers the functions of OSI Layers 1 and 2?", o:["Internet","Link (Network Access)","Transport","Physical"], a:1, why:"The original model's bottom layer — Link, also called Network Access — covers OSI Physical and Data Link. CCNA's 5-layer version splits it in two."},
  {lvl:2, q:"A technician starts by pinging the server. The ping succeeds, so they move on to test the application port. Which method are they using?", o:["Bottom-up","Top-down","Divide-and-conquer","Follow-the-path"], a:2, why:"Divide-and-conquer starts in the middle (typically Layer 3 with ping) and moves up or down depending on the result."},
  {lvl:2, q:"A Cisco interface shows Status 'down' and Protocol 'down' and has not been shut down. What should you check first?", o:["The routing table","The cable, transceiver and whether the far-end device is powered on","The DNS server","The firewall's access list"], a:1, why:"down/down (not administratively down) means no physical link — a Layer 1 problem such as a cable, optic or powered-off neighbour."},
  {lvl:2, q:"A firewall allows Microsoft Teams but blocks a gaming application, even though both use TCP port 443. What kind of firewall is this?", o:["A Layer 2 firewall","A Layer 3 firewall that filters by IP only","A Layer 4 firewall that filters by port only","A Layer 7 (application-aware) firewall"], a:3, why:"Both apps use the same port, so a port-based (Layer 4) filter can't tell them apart. Identifying the application requires Layer 7 inspection."},
  {lvl:1, q:"Which statement about peer-layer communication is TRUE?", o:["Each layer sends its data directly across the cable to the same layer on the other host","Each layer communicates logically with the same layer on the other device, while data physically goes down the stack, across the medium and up the other side","Only the Application layer communicates with the other host","Routers read every layer up to Layer 7 to forward packets"], a:1, why:"The peer conversation is logical; only Layer 1 actually puts signals on the medium. Routers forward using Layer 3."},
  {lvl:1, type:"multi", q:"Which two protocols operate at the OSI Network layer (Layer 3)? (Choose two.)", o:["TCP","IPv4","Ethernet (802.3)","ICMP","DNS","UDP"], a:[1,3], why:"IPv4 carries the logical addresses routers forward on, and ICMP is IP's own error and test messaging (ping uses it) — both Layer 3. TCP and UDP are Layer 4, Ethernet is Layer 2, and DNS is a Layer 7 application protocol."},
  {lvl:1, type:"order", q:"Put the PDU names in order from the top of the stack (Application) to the bottom (Physical).", items:["Data","Segment","Packet","Frame","Bits"], why:"Layers 5–7 handle data, Layer 4 makes segments (datagrams with UDP), Layer 3 packets, Layer 2 frames and Layer 1 bits. A classic exam trap swaps packet (L3) and frame (L2)."},
  {lvl:2, type:"match", q:"Match each fault to the OSI layer where it sits.", pairs:[["A patch cable crushed behind an air-conditioner","Layer 1 — Physical"],["A switch port placed in the wrong VLAN","Layer 2 — Data Link"],["A PC with the wrong default gateway","Layer 3 — Network"],["A new firewall rule blocking TCP 3389","Layer 4 — Transport"],["An exported report showing Ad?b?y? instead of accented names","Layer 6 — Presentation"],["The DNS server has stopped answering","Layer 7 — Application"]], why:"Ask what each fault touches: the signal itself (L1), VLANs and MAC delivery (L2), the gateway used to leave the network (L3), a port number (L4), character encoding (L6), an application protocol (L7). A fault at any layer breaks everything above it, so users often describe it as a Layer 7 problem."},
  {lvl:1, type:"fill", q:"In the original 4-layer TCP/IP model (RFC 1122), what is the layer that matches OSI Layer 3 called?", a:["Internet","Internet layer","the Internet layer"], why:"The original model is Application, Transport, Internet, Link. CCNA's 5-layer version calls the same layer Network. If an exam option says 'Internet layer', it is using the 4-layer model's name for Layer 3."},
  {lvl:2, q:"Users at the Abuja branch cannot reach head office. Based on the exhibit, at which OSI layer should you focus first on the WAN interface, Gi0/1?", ex:"ABJ-BR-RTR#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.20.1.1       YES manual up                    up\nGigabitEthernet0/1     102.89.4.18     YES manual up                    down\nGigabitEthernet0/2     unassigned      YES unset  administratively down down", o:["Layer 1 — there is no physical signal, so check the cable or optic","Layer 2 — the signal is present but the line protocol is down","Layer 3 — the IP address on Gi0/1 is wrong","None — bring up Gi0/2, which is administratively down"], a:1, why:"In show ip interface brief, Status is Layer 1 and Protocol is Layer 2. Gi0/1 is up/down: the physical link is there, but the Layer 2 line protocol has not come up (for example, mismatched WAN settings at the two ends). Gi0/2 has no address and was shut down on purpose — a distractor. Layer 3 can't be tested until Layer 2 is up."},
  {lvl:3, q:"A user can't open the payroll site. You run the test in the exhibit from their PC. Which statement is correct?", ex:"PS C:\\> Test-NetConnection payroll.corp.local -Port 443\nWARNING: TCP connect to (10.30.2.15 : 443) failed\n\n\nComputerName           : payroll.corp.local\nRemoteAddress          : 10.30.2.15\nRemotePort             : 443\nInterfaceAlias         : Ethernet\nSourceAddress          : 10.30.8.41\nPingSucceeded          : True\nPingReplyDetails (RTT) : 2 ms\nTcpTestSucceeded       : False", o:["Name resolution and Layers 1 to 3 to the server work; the TCP connection to 443 fails, so look at Layer 4: is the web service listening on 443, and is a firewall blocking it?","DNS is broken, because the name could not be resolved","The PC's cable is faulty, because the test failed","The server is in the wrong VLAN, a Layer 2 problem"], a:0, why:"Read what passed before what failed. The name became 10.30.2.15, so DNS works. PingSucceeded True proves Layers 1 to 3 all the way to the server and back. Only the TCP test to port 443 failed, which is Layer 4: either nothing is listening on 443 on the server, or something in the path (a firewall or ACL) blocks TCP 443. That is the conversation to have with the server or firewall team, with this output attached to the ticket."},
  {lvl:3, q:"Users on floor 2 say the network 'keeps dropping'. Both ends of the floor's uplink are left on auto. Based on the exhibit, at which layer is the fault, and what do you do next?", ex:"FLOOR2-SW#show interfaces GigabitEthernet0/24\nGigabitEthernet0/24 is up, line protocol is up (connected)\n  Description: UPLINK-TO-CORE\n  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX\n  ...\n     9812234 packets input, 4120098812 bytes, 0 no buffer\n     0 runts, 0 giants, 0 throttles\n     48812 input errors, 48790 CRC, 22 frame, 0 overrun, 0 ignored\n     8817211 packets output, 2911820044 bytes, 0 underruns\n     0 output errors, 0 collisions, 3 interface resets\n     0 babbles, 0 late collision, 0 deferred", o:["Layer 1: frames are being damaged on the way in. Suspect the cable, a connector or interference: swap the patch leads, then test the permanent link","Layer 2: the uplink is in the wrong VLAN","Layer 3: the core switch has the wrong IP address","Layer 7: the users' applications are timing out"], a:0, why:"CRC errors mean frames arrive with an FCS that doesn't match, so bits were changed on the way: a physical problem. Both ends are on auto, the port negotiated full duplex and there are no collisions, so a duplex mismatch is unlikely. That leaves the cable, its connectors, a damaged run or interference (for example a run laid along a power feed). A wrong VLAN or IP address would stop traffic, but it would never corrupt frames."},
  {lvl:3, q:"Since this morning, one internal web app, the leave-request portal, shows an error page for every user. Other web apps on the same servers, email and file shares all work, and the portal's address answers ping. Which troubleshooting approach is the most efficient here?", o:["Top-down: start at the application, because the evidence already proves the lower layers to those servers work","Bottom-up: start by checking cables and port lights for every affected user","Divide-and-conquer: start by pinging the portal, then decide whether to go up or down","Follow-the-path: trace every switch and router between one user and the server"], a:0, why:"Choosing a method means using the evidence you already have. Every user is affected, other apps on the same servers work and the address answers ping, so Layers 1 to 3 are proven. An error page, rather than a timeout, even shows TCP and HTTP got through. Start at the top: the portal application, its service and its recent changes. Bottom-up would spend an hour on cables that are fine, and the ping that divide-and-conquer starts with has already been done."},
  {lvl:2, type:"match", q:"Match each check with the highest OSI layer it proves is working.", pairs:[["Link lights on and show interfaces status says connected","Layer 1 — Physical"],["The switch has learned the PC's MAC address in show mac address-table","Layer 2 — Data Link"],["ping to the server's IP address gets replies","Layer 3 — Network"],["Test-NetConnection to port 443 succeeds","Layer 4 — Transport"],["nslookup returns the server's address","Layer 7 — Application"]], why:"Each test proves its own layer and everything below it. A connected port proves the signal; a learned MAC proves frames arrive; ping proves IP delivery both ways; a successful TCP test proves a service is reachable and listening on that port; nslookup proves the DNS application answers. Knowing this lets you choose the one test that cuts the problem in half."},
  {lvl:2, q:"A packet from a PC passes, in order, through a hub, a Layer 2 switch, a router and a stateful firewall. In normal forwarding, which is the first device that looks at the TCP port numbers?", o:["The stateful firewall","The router","The Layer 2 switch","The hub"], a:0, why:"Each device reads only as deep as its job needs. The hub repeats bits (Layer 1), the switch reads MAC addresses (Layer 2) and the router reads the destination IP address (Layer 3). A stateful firewall tracks connections by addresses and ports, so it reads Layer 4. A router can match ports if you add an access list, but plain routing never needs them."},
],
cards:[
  {f:"What is a protocol?", b:"An agreed set of rules for communication: message format, order of messages, and what to do when one arrives (or doesn't)."},
  {f:"IEEE vs IETF vs ISO", b:"IEEE: LAN standards (802.3 Ethernet, 802.11 Wi-Fi, 802.1Q). IETF: internet protocols published as RFCs (IP, TCP, DNS). ISO: published the OSI reference model."},
  {f:"OSI layers 7 → 1", b:"Application, Presentation, Session, Transport, Network, Data Link, Physical. 'All People Seem To Need Data Processing'."},
  {f:"OSI layers 1 → 7", b:"Physical, Data Link, Network, Transport, Session, Presentation, Application. 'Please Do Not Throw Sausage Pizza Away'."},
  {f:"PDU at each layer", b:"L5–7 data · L4 segment (TCP) / datagram (UDP) · L3 packet · L2 frame · L1 bits."},
  {f:"Which layer: hub, switch, router?", b:"Hub L1 (repeats bits) · switch L2 (MAC addresses, frames) · router L3 (IP addresses, packets). A multilayer switch does L2 and L3."},
  {f:"TCP/IP model — two versions", b:"Original (RFC 1122): Application, Transport, Internet, Link. CCNA 5-layer: Application, Transport, Network, Data Link, Physical."},
  {f:"L4 vs L7 load balancer", b:"L4 decides by IP addresses and ports only. L7 reads the application data (e.g. the HTTP URL) and can route by path or header."},
  {f:"Four troubleshooting methods", b:"Bottom-up (start at L1), top-down (start at the app), divide-and-conquer (start at L3, go up or down), follow-the-path (trace hop by hop)."},
  {f:"show ip interface brief — Status vs Protocol", b:"Status = Layer 1 (physical link). Protocol = Layer 2 (line protocol). admin down/down = shutdown command; down/down = L1 fault; up/down = L2 fault."},
  {f:"Peer-layer communication", b:"Each layer talks logically to the same layer on the other device using its own header; physically, data goes down the sender's stack, across the medium, and up the receiver's."},
  {f:"Why ping isn't the final word", b:"A ping proves L1–3 for ICMP only. It doesn't prove a TCP port is open or the app works — and ICMP may be blocked on purpose."},
],
});
// ---------- Lesson 6 ----------
L.push({
id:"net-encap", mins:55, level:"Beginner · builds on lessons 1–5",
t:"Encapsulation: following one packet hop by hop, header by header",
html:`
${K.goals([
  "Explain encapsulation and decapsulation, and name the PDU at each layer.",
  "Draw an Ethernet frame field by field, with sizes, and explain padding, the FCS check and the 1500-byte MTU.",
  "Read the key IPv4 header fields and say why TTL exists.",
  "Fill in the MAC addresses, IP addresses and TTL on every link of a path through several routers.",
  "Say exactly what a switch and a router each do to a frame — and read the layers in Wireshark.",
])}
${K.pre(["Lesson 1 (MAC vs IP, default gateway, ARP).","Lesson 2 (switches and routers).","Lesson 5 (the OSI and TCP/IP layers) — this lesson puts those layers to work."])}

<h2>Why this matters at work</h2>
<p>A senior engineer at a Lagos ISP hands you a capture: <i>"The customer says our router is changing their traffic. Is it?"</i> You see the same packet captured on both sides of the router. The MAC addresses are completely different. The ${K.g("TTL","Time To Live: an 8-bit IPv4 counter. Each router subtracts 1; at 0 the packet is dropped.")} has dropped by one. The IP addresses, ports and data are identical.</p>
<p>A beginner panics: "the addresses changed!" Someone who understands encapsulation knows that is exactly what a router is <i>supposed</i> to do. Follow one packet header by header and routing, switching and troubleshooting all get easier.</p>

<h2>Headers, trailers and envelopes</h2>
<p>Data never travels "bare". Each layer you met in lesson 5 adds a small block of its own information in front of the data, called a ${K.g("header","Control information a layer adds in front of the data: addresses, type fields, counters.")}. The data link layer also adds a block at the <i>end</i>, a ${K.g("trailer","Control information added after the data. In Ethernet it is the 4-byte FCS.")}.</p>
<p>Wrapping data in headers on the way down the layers is ${K.g("encapsulation","On the sender, each layer wrapping its own header (and sometimes trailer) around the data from the layer above.")}. Unwrapping on the way up, at the receiver, is ${K.g("decapsulation","On the receiver, each layer reading and removing its own header/trailer and passing the rest up.")}.</p>
${K.analogy(`<p>You write a letter (the <b>data</b>) and put it in an envelope marked "Accounts department" — the <b>transport</b> header, naming the program inside the building. That goes inside a bigger envelope with the company's full street address — the <b>IP</b> header, good for the whole journey. A courier puts it all in a bag labelled "depot A to depot B" — the <b>Ethernet</b> header, good for one short trip. At every depot the bag is replaced. The street address inside never changes.</p>`)}
<p>Each layer's "envelope plus contents" has a name, its ${K.g("PDU","Protocol Data Unit: the name of the data unit at a layer — data, segment, packet, frame, bits.")}. Exams use these names precisely:</p>
<div class="tablewrap"><table>
<tr><th>Layer</th><th>What it adds</th><th>PDU</th></tr>
<tr><td>Application</td><td>The data, e.g. an HTTP request</td><td><b>Data</b></td></tr>
<tr><td>Transport (L4)</td><td>TCP or UDP header: ports</td><td><b>Segment</b> (TCP) / <b>datagram</b> (UDP)</td></tr>
<tr><td>Network (L3)</td><td>IP header: IP addresses, TTL</td><td><b>Packet</b></td></tr>
<tr><td>Data link (L2)</td><td>Ethernet header <i>and</i> trailer</td><td><b>Frame</b></td></tr>
<tr><td>Physical (L1)</td><td>Nothing — turns the frame into signals</td><td><b>Bits</b></td></tr>
</table></div>
${K.remember(`Top to bottom: <b>D</b>o <b>S</b>ome <b>P</b>eople <b>F</b>ear <b>B</b>irthdays? — <b>D</b>ata, <b>S</b>egment, <b>P</b>acket, <b>F</b>rame, <b>B</b>its.`)}
${K.svg("0 0 720 320",
  K.txt(145,20,"encapsulate",{mid:true,c:"accent"})+K.txt(712,20,"decapsulate",{end:true,c:"accent"})+
  K.arrow(145,32,145,268,"",true)+K.arrow(705,268,705,32,"",true)+
  K.txt(16,50,"Application",{c:"fg",f:"display",b:true})+K.txt(16,105,"Transport (L4)",{c:"fg",f:"display",b:true})+K.txt(16,160,"Network (L3)",{c:"fg",f:"display",b:true})+K.txt(16,215,"Data link (L2)",{c:"fg",f:"display",b:true})+K.txt(16,270,"Physical (L1)",{c:"fg",f:"display",b:true})+
  K.band(400,30,160,30,"HTTP data","var(--panel2)")+
  K.band(330,85,70,30,"TCP hdr")+K.band(400,85,160,30,"HTTP data","var(--panel2)")+
  K.band(260,140,70,30,"IP hdr")+K.band(330,140,70,30,"TCP hdr","var(--panel2)")+K.band(400,140,160,30,"HTTP data","var(--panel2)")+
  K.band(170,195,90,30,"Eth hdr")+K.band(260,195,70,30,"IP hdr","var(--panel2)")+K.band(330,195,70,30,"TCP hdr","var(--panel2)")+K.band(400,195,160,30,"HTTP data","var(--panel2)")+K.band(560,195,60,30,"FCS")+
  K.band(170,250,450,30,"10110010 01110101 ... signals on the wire")+
  K.txt(636,50,"data",{c:"accent",b:true})+K.txt(636,105,"segment",{c:"accent",b:true})+K.txt(636,160,"packet",{c:"accent",b:true})+K.txt(636,215,"frame",{c:"accent",b:true})+K.txt(636,270,"bits",{c:"accent",b:true})+
  K.txt(360,308,"Sending: work down, adding a header at each layer. Receiving: work up, removing them.",{mid:true}),
  "Encapsulation. The shaded band in each row is what that layer added. Only layer 2 adds a trailer (the FCS).")}
<p>Two ideas from that picture matter most:</p>
<ul>
<li><b>Each layer reads only its own header.</b> That is why you can swap Wi-Fi for a cable without changing a web page.</li>
<li><b>The outer envelope is replaced most often.</b> Ethernet covers one local trip; IP covers the whole journey.</li>
</ul>
${K.check({q:"On the sending computer, which layer adds a <b>trailer</b> as well as a header?", o:["Transport (TCP/UDP)","Network (IP)","Data link (Ethernet)","Application (HTTP)"], a:2, why:"Only the data link layer adds a trailer — Ethernet's 4-byte FCS. TCP, UDP and IP add headers only."})}

<h2>The Ethernet frame, field by field</h2>
<p>Almost every wired LAN uses the same frame format, ${K.g("Ethernet II","The standard Ethernet frame format. Cisco shows it as 'Encapsulation ARPA'.")}. Here it is in the order the bits leave the card:</p>
${K.svg("0 0 740 200",
  K.band(10,40,80,40,"Preamble")+K.band(90,40,50,40,"SFD")+K.band(140,40,110,40,"Dest MAC","var(--panel2)")+K.band(250,40,110,40,"Source MAC","var(--panel2)")+K.band(360,40,70,40,"Type","var(--panel2)")+K.band(430,40,220,40,"Payload (the IP packet)","var(--panel2)")+K.band(650,40,80,40,"FCS","var(--panel2)")+
  K.txt(50,100,"7 bytes",{mid:true})+K.txt(115,100,"1",{mid:true})+K.txt(195,100,"6",{mid:true})+K.txt(305,100,"6",{mid:true})+K.txt(395,100,"2",{mid:true})+K.txt(540,100,"46 – 1500",{mid:true})+K.txt(690,100,"4",{mid:true})+
  K.txt(75,28,"wake-up + sync",{mid:true,c:"muted"})+K.txt(435,28,"the frame proper: 64 to 1518 bytes",{mid:true,c:"accent"})+
  `<line x1="140" y1="34" x2="730" y2="34" stroke="var(--accent)" stroke-width="1.2"/>`+
  K.txt(290,140,"header: 14 bytes (dest + source + type)",{mid:true,c:"fg"})+K.txt(690,140,"trailer",{mid:true,c:"fg"})+
  `<line x1="140" y1="122" x2="430" y2="122" stroke="var(--line)" stroke-width="1.2"/><line x1="650" y1="122" x2="730" y2="122" stroke="var(--line)" stroke-width="1.2"/>`+
  K.txt(370,180,"Preamble and SFD are sent on the wire but are not counted in the frame size.",{mid:true}),
  "The Ethernet II frame. Sizes in bytes.")}
<div class="tablewrap"><table>
<tr><th>Field</th><th>Size</th><th>What it is for</th></tr>
<tr><td>Preamble</td><td>7 bytes</td><td>A rhythm of <code>10101010</code> so the receiver can lock on to the signal's timing.</td></tr>
<tr><td>SFD (start frame delimiter)</td><td>1 byte</td><td><code>10101011</code> — the final two 1s mean "the frame starts now".</td></tr>
<tr><td>Destination MAC</td><td>6 bytes</td><td>Who on <i>this</i> link should take the frame. It comes first so a switch can start deciding early.</td></tr>
<tr><td>Source MAC</td><td>6 bytes</td><td>Who on this link sent it. Switches learn from this field.</td></tr>
<tr><td>Type (${K.g("EtherType","A 2-byte code naming the protocol inside the payload.")})</td><td>2 bytes</td><td>What is inside: <code>0x0800</code> IPv4, <code>0x86DD</code> IPv6, <code>0x0806</code> ARP.</td></tr>
<tr><td>Payload</td><td>46–1500 bytes</td><td>The IP packet (or ARP message) being carried.</td></tr>
<tr><td>${K.g("FCS","Frame Check Sequence: a 4-byte CRC the sender calculates over the frame. The receiver recalculates it; a mismatch means damage.")}</td><td>4 bytes</td><td>The trailer: a check value that reveals damage in transit.</td></tr>
</table></div>
<p>The Type field tells the receiver which inner envelope to open. Without it, a card would not know whether to hand the payload to IPv4, IPv6 or ARP. (You will meet <code>0x8100</code> in the VLAN lessons.)</p>
${K.dyk(`The same two bytes once meant something else. In the older IEEE 802.3 format they held the payload <i>length</i>. To keep both working, every EtherType is 0x0600 (1536) or higher, while a length can never exceed 1500 — so a card can tell which one it is reading.`)}

<h3>Why a minimum size — and padding</h3>
<p>The smallest frame is 6 + 6 + 2 + 46 + 4 = <b>64 bytes</b>. The reason is history. Early Ethernet was a shared cable; if two devices talked at once, their signals collided, and a sender only notices a collision while it is still transmitting. 64 bytes guarantees a frame lasts long enough for news of a collision at the far end to get back in time.</p>
<p>Modern full-duplex switched links have no collisions, but every device keeps the rule so old and new equipment work together.</p>
<p>Not enough data? A TCP acknowledgement is a 20-byte IP header plus a 20-byte TCP header: 40 bytes. The card adds 6 bytes of ${K.g("padding","Filler bytes added so the payload reaches 46 bytes. The receiver uses the IP length field to discard them.")} to reach 46. The receiver uses the IP header's length field to throw the padding away.</p>
<p>A frame shorter than 64 bytes is a ${K.g("runt","A frame under 64 bytes — always an error, often from collisions, a duplex mismatch or a faulty card.")}. Cisco counts runts on every interface; you will read that counter in the job scenario.</p>

<h3>The FCS: Ethernet's damage detector</h3>
<p>Before sending, the card runs a ${K.g("CRC","Cyclic Redundancy Check: a check value calculated over a block of data. Ethernet's FCS is a 32-bit CRC.")} calculation over the frame and stores the result in the FCS. The receiver repeats the calculation. A different answer means bits were changed on the way — by a damaged cable, electrical noise, a bad port or a duplex problem.</p>
<p>Then <b>the receiver silently throws the frame away.</b> No error message, no request to resend. Ethernet detects damage; it does not repair it. If the data mattered, TCP at the sending host notices the gap and resends (lesson 7). The only trace is an interface counter.</p>

<h3>MTU: the 1500-byte limit</h3>
<p>The biggest payload a standard frame carries is 1500 bytes — the ${K.g("MTU","Maximum Transmission Unit: the largest layer-3 packet a link carries in one frame. 1500 bytes on standard Ethernet.")}, the largest IP packet that fits. A full frame is 14 + 1500 + 4 = 1518 bytes. It is also why a full TCP segment carries 1460 bytes of data: 1500 minus 20 (IP) minus 20 (TCP).</p>
${K.exam(`Watch "minimum <i>payload</i>" (46) versus "minimum <i>frame</i>" (64), and MTU (1500, the packet) versus maximum frame (1518).`)}
${K.mistake(`Thinking a failed FCS check makes the switch "ask for the frame again". Ethernet never retransmits. The frame is dropped and counted; recovery is TCP's job at the end hosts. Users experience CRC errors as "slow" or "choppy", never as an error message.`)}
${K.check({q:"A UDP message is 38 bytes as an IPv4 packet (20 IP + 8 UDP + 10 data). What happens when it is put in an Ethernet frame?", o:["It is sent as a 56-byte frame","The card adds 8 bytes of padding so the payload reaches 46 bytes","It is rejected as a runt","The IP header grows to 28 bytes"], a:1, why:"The payload must be at least 46 bytes: 46 − 38 = 8 bytes of padding, giving a 64-byte frame."})}
${K.q({type:"fill", q:"Ethernet II and TCP sizes, in bytes.", fields:[{label:"Ethernet header (destination MAC + source MAC + Type)", a:["14"]},{label:"FCS trailer", a:["4"]},{label:"Minimum payload", a:["46"]},{label:"Data in a full TCP segment on a 1500-byte MTU (no options)", a:["1460"]}], why:"Header 6 + 6 + 2 = 14 bytes, FCS 4. The payload is padded up to 46 so the frame reaches 64. A full TCP segment carries 1500 − 20 (IP) − 20 (TCP) = 1460 bytes of data."})}

<h2>Inside the packet: the IP and TCP/UDP headers</h2>
<p>Open the next envelope. The IPv4 header is usually 20 bytes. For now you need five fields:</p>
<div class="tablewrap"><table>
<tr><th>Field</th><th>Size</th><th>What it does</th></tr>
<tr><td>Version</td><td>4 bits</td><td><code>4</code> for IPv4. (IPv6 has its own 40-byte header.)</td></tr>
<tr><td>TTL (Time To Live)</td><td>8 bits</td><td>A countdown. Every router subtracts 1; at 0 the packet is discarded.</td></tr>
<tr><td>Protocol</td><td>8 bits</td><td>What is inside: <code>1</code> ICMP, <code>6</code> TCP, <code>17</code> UDP.</td></tr>
<tr><td>Source IP</td><td>32 bits</td><td>The original sender.</td></tr>
<tr><td>Destination IP</td><td>32 bits</td><td>The final destination.</td></tr>
</table></div>
<p>See the pattern: Ethernet's Type says "IPv4 inside"; IP's Protocol says "TCP inside". Each envelope labels the next. ${K.g("ICMP","Internet Control Message Protocol (IP protocol 1): used by ping and traceroute, and for router error reports such as 'time exceeded'.")}, protocol 1, is what ping uses.</p>

<h3>Why TTL exists</h3>
<p>Imagine two misconfigured routers, each thinking the other is the way to a network. A packet would bounce between them forever, joined by every new packet, until the link was full. That is a ${K.g("routing loop","Routers forwarding a packet in a circle because their routes point at each other.")}.</p>
<p>TTL stops this. The sender sets a starting value — Windows 128, Linux and macOS 64, Cisco 255. Each router subtracts 1. The router that reaches 0 drops the packet and sends ICMP "time exceeded" back to the sender. A loop still hurts, but each looping packet dies after a fixed number of hops.</p>
${K.tip(`<code>traceroute</code> (Windows: <code>tracert</code>) is built on TTL. It sends packets with TTL 1, 2, 3… and each router that drops one replies "time exceeded", revealing itself. In IPv6 the same counter is called <b>Hop Limit</b>.`)}

<h3>The TCP/UDP header, briefly</h3>
<p>Inside the packet sits the transport header — at least 20 bytes for TCP, 8 for UDP. Both start with a source and destination ${K.g("port","A 16-bit number (0–65535) identifying an application or conversation on a host, e.g. 443 for HTTPS.")}, which say which program on each host the data belongs to. That is how one server runs HTTPS on <code>443</code> and DNS on <code>53</code> at one IP address. The client picks a random high port, such as <code>51514</code>. Lesson 7 covers the rest.</p>
${K.check({q:"A packet's IPv4 Protocol field is 17. What is inside?", o:["A TCP segment","A UDP datagram","An ICMP message","An ARP request"], a:1, why:"17 = UDP, 6 = TCP, 1 = ICMP. ARP is not inside IP at all; it sits directly in a frame with EtherType 0x0806."})}

<h2>Following one packet hop by hop</h2>
<p>This is the idea the whole lesson builds to. Say it out loud:</p>
<div class="callout"><b>As a packet crosses a network, the source and destination IP addresses stay the same end to end. The MAC addresses are rewritten at every router. TTL drops by 1 at every router.</b> (NAT, which rewrites IPs at the internet edge, comes in a later module.)</div>
<p>Why? A MAC address only means something on one link. R1 does not know the server's MAC and does not need it — only the MAC of the <i>next</i> device. The IP address is what every router uses to choose the direction. Each step from one layer-3 device to the next is a ${K.g("hop","One step of a packet's path between layer-3 devices. Each router crossed is one hop.")}.</p>
${K.svg("0 0 760 260",
  K.dev("pc",50,90,"PC1","192.168.10.25")+K.dev("switch",170,90,"SW1","")+K.dev("router",300,90,"R1","")+K.dev("router",460,90,"R2","")+K.dev("switch",590,90,"SW2","")+K.dev("server",705,90,"Server","172.16.20.50")+
  K.link(72,90,143,90,"link 1")+K.link(197,90,275,90,"link 2")+K.link(325,90,435,90,"link 3")+K.link(485,90,563,90,"link 4")+K.link(617,90,688,90,"link 5")+
  K.txt(280,66,"G0/0",{end:true})+K.txt(320,66,"G0/1")+K.txt(440,66,"G0/1",{end:true})+K.txt(480,66,"G0/0")+
  K.band(20,155,270,24,"192.168.10.0/24")+K.band(310,155,140,24,"10.0.0.0/30")+K.band(470,155,270,24,"172.16.20.0/24")+
  K.band(20,195,270,24,"Frame 1: PC1 → R1 (via SW1)","var(--panel2)")+K.band(310,195,140,24,"Frame 2: R1 → R2","var(--panel2)")+K.band(470,195,270,24,"Frame 3: R2 → Server (via SW2)","var(--panel2)")+
  K.txt(380,245,"One packet, 192.168.10.25 → 172.16.20.50, the whole way. A new frame on every routed link.",{mid:true,c:"fg"}),
  "Two routers split the path into three networks; each network carries its own frame.")}
<div class="tablewrap"><table>
<tr><th>Device / interface</th><th>IP address</th><th>MAC (Cisco format)</th></tr>
<tr><td>PC1 (Windows)</td><td>192.168.10.25, gateway .1</td><td>3c52.821a.7f09</td></tr>
<tr><td>R1 G0/0 · G0/1</td><td>192.168.10.1 · 10.0.0.1</td><td>a0e0.af11.1100 · a0e0.af11.1101</td></tr>
<tr><td>R2 G0/1 · G0/0</td><td>10.0.0.2 · 172.16.20.1</td><td>5c83.8f22.2201 · 5c83.8f22.2200</td></tr>
<tr><td>Server (Linux)</td><td>172.16.20.50</td><td>0026.b9aa.5050</td></tr>
</table></div>
<p>Windows writes PC1's MAC as <code>3C-52-82-1A-7F-09</code> — same address. The switches need no address on the path. PC1 opens a web page on the server:</p>
${K.steps([
  ["PC1 builds the packet and frame 1", `<p><code>172.16.20.50</code> is not local, so it goes to the gateway. ARP gives the gateway's MAC, <code>a0e0.af11.1100</code>. PC1 builds: TCP (destination port 443), IP (source <code>192.168.10.25</code>, destination <code>172.16.20.50</code>, TTL <b>128</b>, protocol 6), Ethernet (source <code>3c52.821a.7f09</code>, destination <code>a0e0.af11.1100</code>, type <code>0x0800</code>) and FCS. The destination MAC is the <b>router's</b>.</p>`],
  ["SW1 forwards it unchanged", `<p>SW1 checks the FCS, learns PC1's MAC on the incoming port, looks up <code>a0e0.af11.1100</code> and sends the frame towards R1. Same MACs, same TTL, same FCS.</p>`],
  ["R1 strips the frame and routes", `<p>The FCS is good and the destination MAC is its own, so R1 removes the Ethernet header and trailer. It reads destination <code>172.16.20.50</code>, lowers TTL to <b>127</b> (at 0 it would drop it), and finds the route: <i>172.16.20.0/24 via 10.0.0.2, out G0/1</i>.</p>`],
  ["R1 builds frame 2", `<p>Same packet, new envelope: source <code>a0e0.af11.1101</code> (R1 G0/1), destination <code>5c83.8f22.2201</code> (R2 G0/1, from ARP), new FCS.</p>`],
  ["R2 repeats the process", `<p>Strip, TTL to <b>126</b>. <code>172.16.20.0/24</code> is directly connected, so the next hop is the server itself. Frame 3: source <code>5c83.8f22.2200</code>, destination <code>0026.b9aa.5050</code>. SW2 forwards it unchanged.</p>`],
  ["The server decapsulates", `<p>FCS good → MAC is mine → type 0x0800, so to IPv4 → IP is mine → protocol 6, so to TCP → port 443, so to the web server. Each label pointed to the next envelope.</p>`],
  ["The reply reverses the journey", `<p>Source and destination IPs swap. The Linux server starts at TTL <b>64</b>, and the MACs are rewritten at R2 and R1 on the way back.</p>`],
])}
<div class="tablewrap"><table>
<tr><th>Link</th><th>Source MAC</th><th>Destination MAC</th><th>Source IP</th><th>Destination IP</th><th>TTL</th></tr>
<tr><td>1 · PC1 → SW1</td><td>3c52.821a.7f09 (PC1)</td><td>a0e0.af11.1100 (R1 G0/0)</td><td>192.168.10.25</td><td>172.16.20.50</td><td>128</td></tr>
<tr><td>2 · SW1 → R1</td><td>3c52.821a.7f09 (PC1)</td><td>a0e0.af11.1100 (R1 G0/0)</td><td>192.168.10.25</td><td>172.16.20.50</td><td>128</td></tr>
<tr><td>3 · R1 → R2</td><td><b>a0e0.af11.1101</b> (R1 G0/1)</td><td><b>5c83.8f22.2201</b> (R2 G0/1)</td><td>192.168.10.25</td><td>172.16.20.50</td><td><b>127</b></td></tr>
<tr><td>4 · R2 → SW2</td><td><b>5c83.8f22.2200</b> (R2 G0/0)</td><td><b>0026.b9aa.5050</b> (Server)</td><td>192.168.10.25</td><td>172.16.20.50</td><td><b>126</b></td></tr>
<tr><td>5 · SW2 → Server</td><td>5c83.8f22.2200 (R2 G0/0)</td><td>0026.b9aa.5050 (Server)</td><td>192.168.10.25</td><td>172.16.20.50</td><td>126</td></tr>
</table></div>
<p>IPs never change. MACs change exactly where a router sits, never at a switch. TTL loses one per router.</p>

<h3>Switch versus router</h3>
<div class="tablewrap"><table>
<tr><th></th><th>Switch (layer 2)</th><th>Router (layer 3)</th></tr>
<tr><td>Reads</td><td>Destination MAC (learns source MAC)</td><td>Destination IP</td></tr>
<tr><td>Ethernet header</td><td>Left as it is</td><td>Removed; a new one built for the next link</td></tr>
<tr><td>TTL</td><td>Not touched</td><td>Lowered by 1; dropped at 0</td></tr>
<tr><td>FCS</td><td>Checked, passed on as it is</td><td>Checked; a new one calculated</td></tr>
</table></div>

<h3>Seeing TTL with your own eyes</h3>
${K.out(`C:\\> ping 172.16.20.50

Pinging 172.16.20.50 with 32 bytes of data:
Reply from 172.16.20.50: bytes=32 time=3ms TTL=62
Reply from 172.16.20.50: bytes=32 time=2ms TTL=62
Reply from 172.16.20.50: bytes=32 time=2ms TTL=62
Reply from 172.16.20.50: bytes=32 time=2ms TTL=62`, "Ping from PC1 to the server (statistics trimmed).")}
<ul>
<li><b>Reply from 172.16.20.50</b> — the server's IP, untouched by two routers.</li>
<li><b>TTL=62</b> — the reply's TTL on arrival. Linux started at 64; R2 and R1 each took 1 off.</li>
</ul>
${K.mistake(`Saying PC1's frame carries the server's MAC. For a remote destination, the first frame always goes to the <b>default gateway's</b> MAC. PC1 never learns the server's MAC — ARP does not cross routers.`)}
${K.myth([
  ["A router changes the IP addresses of the packets it forwards.","Plain routing never touches the IPs. Only NAT rewrites them, and it is a separate feature you switch on."],
  ["TTL is a timer in seconds.","In practice it is a hop count: each router subtracts exactly 1, however long the packet waited."],
  ["Wireshark shows the frame exactly as it was on the wire.","The card strips the preamble, SFD and usually the FCS before Wireshark sees the frame."],
  ["The preamble counts towards the 64-byte minimum.","The 64 bytes run from destination MAC to FCS. Preamble and SFD are extra."],
])}
${K.exam(`Expect a topology with a "which source MAC / destination MAC / IP is in the frame on this link?" question. On a router-to-router link, the source MAC is the sending router's <i>exit</i> interface, and the IPs are still the original two hosts.`)}
${K.check({q:"On link 3 (R1 to R2), what is the <b>destination MAC</b> of PC1's packet?", o:["0026.b9aa.5050 — the server","a0e0.af11.1100 — R1 G0/0","5c83.8f22.2201 — R2 G0/1","3c52.821a.7f09 — PC1"], a:2, why:"On each routed link the destination MAC is the next device to handle the packet: R2's G0/1. The server's MAC only appears on links 4 and 5."})}
${K.q({type:"order", q:"The server receives PC1's frame. Put its decapsulation steps in order.", items:["Check the FCS — the frame arrived undamaged","See its own MAC as the destination and remove the Ethernet header and trailer","Read Type 0x0800 and hand the packet to IPv4","See its own IP address as the destination","Read Protocol 6 and hand the segment to TCP","Read destination port 443 and deliver the data to the web server"], why:"Decapsulation works up the stack, and each label points to the next envelope: FCS good, MAC is mine, Type says IPv4, IP is mine, Protocol says TCP, port says which application."})}

<h2>What Wireshark shows you</h2>
<p>${K.g("Wireshark","Free packet-capture software that records frames and decodes every header layer by layer.")} captures frames from your network card and decodes them. It has three panes:</p>
<ol>
<li><b>Packet list</b> (top) — one line per frame.</li>
<li><b>Packet details</b> (middle) — the selected frame as nested sections, outermost envelope first.</li>
<li><b>Packet bytes</b> (bottom) — the raw hex.</li>
</ol>
<p>The details pane for PC1's first packet to the server, captured on PC1:</p>
${K.out(`Frame 42: 66 bytes on wire (528 bits), 66 bytes captured (528 bits)
Ethernet II, Src: 3c:52:82:1a:7f:09, Dst: a0:e0:af:11:11:00
    Destination: a0:e0:af:11:11:00
    Source: 3c:52:82:1a:7f:09
    Type: IPv4 (0x0800)
Internet Protocol Version 4, Src: 192.168.10.25, Dst: 172.16.20.50
    0100 .... = Version: 4
    Total Length: 52
    Time to Live: 128
    Protocol: TCP (6)
Transmission Control Protocol, Src Port: 51514, Dst Port: 443, Seq: 0, Len: 0
    Source Port: 51514
    Destination Port: 443`, "Wireshark packet details, trimmed. Each unindented line is one envelope; indented lines are its fields.")}
<ul>
<li><b>Ethernet II</b> — the outer envelope. Destination is R1's MAC, written with colons.</li>
<li><b>Type: IPv4 (0x0800)</b> and <b>Protocol: TCP (6)</b> — the labels pointing to the next envelope.</li>
<li><b>Time to Live: 128</b> — Windows' starting value, since this was captured before any router.</li>
</ul>
<p>14 (Ethernet) + 20 (IP) + 32 (TCP with the options Windows puts in a ${K.g("SYN","Synchronise: the flag set on the very first TCP segment, asking to open a connection — step one of the three-way handshake in Lesson 7.")}) = 66 bytes. Preamble, SFD and FCS are missing: the card handles them in hardware. Captured at the server, the same packet would show TTL 126 and R2/server MACs — but identical IPs and ports.</p>
${K.when([
  ["ping","Quick yes/no: can I reach it?","Shows loss, time and the reply's TTL","A firewall blocks ICMP"],
  ["traceroute / tracert","You need to know <i>where</i> the path fails","Lists each router via TTL expiry","You need a packet's contents"],
  ["show interfaces","One link or user is slow or dropping","Counters reveal damaged frames","The fault is beyond that link"],
  ["Wireshark","You must prove what is inside frames","Shows every header","A ping or counter already answers it"],
], "Which tool for which question")}
${K.video({t:"Wireshark basics: reading Ethernet, IP and TCP headers", u:"https://www.youtube.com/results?search_query=wireshark+ethernet+ip+tcp+header+beginner", by:"YouTube search", why:"See the three panes on a real capture."})}
${K.tip(`Type <code>ip.addr == 172.16.20.50</code> in the display filter bar to see only that host's traffic. Comparing captures from both sides of a router is the fastest way to prove whether a device alters traffic.`)}
${K.check({q:"In Wireshark's details pane, which section shows Time to Live?", o:["Frame","Ethernet II","Internet Protocol Version 4","Transmission Control Protocol"], a:2, why:"TTL is an IP header field. Ethernet has no TTL at all, which is why loops between switches need separate protection (STP), covered later."})}

<h2>Practice and on the job</h2>
<h3>Pen-and-paper exercise</h3>
<p>A Linux laptop sends to a Windows server across three routers (MACs simplified). Path: Laptop → SW-A → RA → RB → RC → Server.</p>
<div class="tablewrap"><table>
<tr><th>Device / interface</th><th>IP</th><th>MAC</th></tr>
<tr><td>Laptop (Linux)</td><td>10.1.1.50, gateway 10.1.1.1</td><td>aaaa.aaaa.aaaa</td></tr>
<tr><td>RA G0/0 · G0/1</td><td>10.1.1.1 · 10.0.12.1</td><td>bbbb.bbbb.0000 · bbbb.bbbb.0001</td></tr>
<tr><td>RB G0/0 · G0/1</td><td>10.0.12.2 · 10.0.23.1</td><td>cccc.cccc.0000 · cccc.cccc.0001</td></tr>
<tr><td>RC G0/0 · G0/1</td><td>10.0.23.2 · 10.9.9.1</td><td>dddd.dddd.0000 · dddd.dddd.0001</td></tr>
<tr><td>Server (Windows), cabled to RC G0/1</td><td>10.9.9.9</td><td>eeee.eeee.eeee</td></tr>
</table></div>
<p>For each of the five links write the source MAC, destination MAC, source IP, destination IP and TTL. Then: (1) what TTL does the server's reply have at the laptop? (2) On the RA–RB link, what are the reply's MACs? (3) If a switch were added between RB and RC, what would change?</p>
${K.hint(`Find where each router sits. On every link before the first router, the destination MAC is the laptop's gateway. After each router, the source MAC is that router's <i>outgoing</i> interface and TTL is one lower. The IP columns never change.`)}
${K.reveal("Show the answers",`<div class="tablewrap"><table>
<tr><th>Link</th><th>Src MAC</th><th>Dst MAC</th><th>Src IP</th><th>Dst IP</th><th>TTL</th></tr>
<tr><td>Laptop → SW-A</td><td>aaaa.aaaa.aaaa</td><td>bbbb.bbbb.0000</td><td>10.1.1.50</td><td>10.9.9.9</td><td>64</td></tr>
<tr><td>SW-A → RA</td><td>aaaa.aaaa.aaaa</td><td>bbbb.bbbb.0000</td><td>10.1.1.50</td><td>10.9.9.9</td><td>64</td></tr>
<tr><td>RA → RB</td><td>bbbb.bbbb.0001</td><td>cccc.cccc.0000</td><td>10.1.1.50</td><td>10.9.9.9</td><td>63</td></tr>
<tr><td>RB → RC</td><td>cccc.cccc.0001</td><td>dddd.dddd.0000</td><td>10.1.1.50</td><td>10.9.9.9</td><td>62</td></tr>
<tr><td>RC → Server</td><td>dddd.dddd.0001</td><td>eeee.eeee.eeee</td><td>10.1.1.50</td><td>10.9.9.9</td><td>61</td></tr>
</table></div>
<p><b>1.</b> Windows starts at 128; three routers → <b>TTL 125</b>.</p>
<p><b>2.</b> The reply goes RB → RA: source <code>cccc.cccc.0000</code>, destination <code>bbbb.bbbb.0001</code>, with IPs swapped (10.9.9.9 → 10.1.1.50).</p>
<p><b>3.</b> Nothing. You would add one row identical to RB → RC, because a switch does not touch the frame. Get this right and you have the lesson.</p>`)}

${K.job("Packets dropped with CRC errors on one desk",`
<p><b>The ticket.</b> A Victoria Island law firm. Emeka: <i>"My Teams calls keep breaking up and saving big files to the S: drive keeps failing. Everyone else is fine."</i></p>
<p><b>Questions.</b> Only you? <i>Yes.</i> Wired? <i>Yes.</i> Since when? <i>Since desks moved on Monday.</i> One wired user after a move: suspect the physical path.</p>
<p><b>Check the port.</b> Using his MAC from <code>ipconfig /all</code>, <code>show mac address-table address</code> finds him on <code>Gi1/0/14</code>:</p>
${K.out(`SW-3F# show interfaces GigabitEthernet1/0/14
GigabitEthernet1/0/14 is up, line protocol is up (connected)
  Description: VI-3F-DESK-14
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 231/255, txload 1/255, rxload 2/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX
     312 runts, 0 giants, 0 throttles
     2871 input errors, 2559 CRC, 0 frame, 0 overrun, 0 ignored`, "show interfaces on a Catalyst switch, trimmed.")}
<ul>
<li><b>up, line protocol is up</b> — not a dead cable. <b>Encapsulation ${K.g("ARPA","Cisco's label for Ethernet II framing in show interfaces output — named after ARPA, the US research agency whose ARPANET grew into the internet (Ethernet II framing was the standard on its networks).")}</b>, <b>MTU 1500</b> — Ethernet II, as in this lesson.</li>
<li><b>100Mb/s</b> on a gigabit port and PC — a gigabit link settling for 100 often points to a damaged cable.</li>
<li><b>2559 CRC, 312 runts</b> — damaged or too-short frames, silently dropped.</li>
</ul>
<p><b>Live or old?</b> <code>clear counters GigabitEthernet1/0/14</code>, a large file copy, and a minute later CRC is at 214 and climbing. It is live.</p>
<p><b>Cable or duplex?</b> The classic causes are a bad physical path and a ${K.g("duplex mismatch","One end full-duplex, the other half-duplex. The full-duplex side logs CRC errors and runts; the half-duplex side logs late collisions.")}. Both ends are on auto and report full-duplex, so not a mismatch. At the desk, the patch cable runs under the new chair mat, flattened.</p>
<p><b>Fix.</b> New patch cable, routed along the desk leg. The port shows <code>Full-duplex, 1000Mb/s</code> and CRC stays at 0 under load.</p>
<p><b>What you say.</b> "Your network cable was crushed under the chair mat, so some of your data was getting damaged and dropped. I've replaced it and moved it — full speed, no errors now."</p>
<p><b>Ticket note.</b> <i>"Gi1/0/14 (DESK-14): CRC + runts incrementing live (214 CRC/60 s after clear), negotiated 100 Mb/s not 1000. Duplex auto/full both ends — mismatch ruled out. Cause: patch cable crushed under chair mat after desk move. Replaced; 1000/full, 0 CRC after 10 min. User confirmed calls and saves OK. Resolved, 25 min."</i></p>`)}
${K.dodont([
  "Clear counters, generate traffic and re-check before blaming a link.",
  "Check speed and duplex at <i>both</i> ends of the link.",
  "Capture on both sides of a device before claiming it alters traffic.",
],[
  "Don't hard-set speed/duplex on one end and leave the other on auto.",
  "Don't trust old counters — they may be weeks old.",
  "Don't restart a shared switch for one user's CRC errors.",
])}
${K.check({q:"CRC errors are rising on one switch port only. What do you suspect first?", o:["A routing loop","The physical link — cable, ports or speed/duplex at either end","A wrong DNS server","The router's MTU"], a:1, why:"A CRC error means frames were damaged on that one link. Routing, DNS and MTU problems do not corrupt frames."})}

<h2>Interview corner</h2>
${K.reveal("“What changes and what stays the same as a packet crosses a router?”",`<p>"The source and destination IP addresses stay the same end to end, unless NAT rewrites them at the edge. The layer-2 frame changes: the router removes the incoming Ethernet header and trailer and builds a new one — its own outgoing interface MAC as source, the next hop's MAC as destination, and a new FCS. It decrements TTL and recalculates the header checksum. A switch changes none of it."</p>`)}
${K.reveal("“How does a switch handle a frame compared with a router?”",`<p>"A switch works at layer 2: it checks the FCS, learns the source MAC on the incoming port, looks up the destination MAC and forwards the frame unchanged — it never reads IP or TTL. A router accepts frames sent to its own MAC, strips the layer-2 header, routes on the destination IP, decrements TTL and re-encapsulates the packet in a new frame, using ARP for the next hop's MAC."</p>`)}
${K.reveal("“CRC errors are climbing on an interface. What does it mean and what do you check?”",`<p>"Frames are arriving with an FCS that doesn't match, so they're corrupted on that link and silently dropped — users see slowness, not errors. I'd clear the counters to confirm they're still rising, check speed and duplex at both ends, then swap the cable and try another port."</p>`)}

${K.recap([
  "Encapsulation: going down, each layer adds a header; Ethernet also adds a trailer (FCS). Decapsulation reverses it.",
  "PDUs: data → segment / datagram → packet → frame → bits.",
  "Ethernet: preamble 7, SFD 1, dest MAC 6, source MAC 6, type 2, payload 46–1500, FCS 4. Frame 64–1518 bytes; MTU 1500.",
  "EtherType 0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP. IP protocol 1 ICMP, 6 TCP, 17 UDP.",
  "A failed FCS check: frame silently dropped, CRC counter up. Ethernet never resends.",
  "TTL drops by 1 per router; at 0 the packet dies and ICMP time exceeded goes back. It stops loops lasting forever.",
  "Across routers: IPs stay the same; MACs are rewritten at every router; switches change nothing.",
])}
${K.next(`<b>Lesson 7 — TCP and UDP.</b> You've seen the transport header as two port numbers. Next you open it fully: the three-way handshake, sequence numbers, how TCP resends data lost when a frame fails its FCS check, and when applications choose UDP instead.`)}
`,
quiz:[
  {lvl:1, q:"What is the PDU at the network layer (layer 3) called?", o:["Frame","Segment","Packet","Bits"], a:2, why:"Layer 3 = packet. Layer 4 = segment (TCP) or datagram (UDP), layer 2 = frame, layer 1 = bits."},
  {lvl:1, q:"Which Ethernet field tells the receiver that the payload is an IPv6 packet, and with which value?", o:["Preamble, 10101010","Type, 0x86DD","Type, 0x0800","SFD, 10101011"], a:1, why:"The 2-byte Type (EtherType) field identifies the payload: 0x86DD is IPv6, 0x0800 is IPv4, 0x0806 is ARP."},
  {lvl:1, q:"What is the minimum size of an Ethernet frame (destination MAC through FCS)?", o:["46 bytes","60 bytes","64 bytes","1518 bytes"], a:2, why:"6 + 6 + 2 + 46 (minimum payload) + 4 = 64 bytes. Shorter frames are runts. The maximum standard frame is 1518 bytes."},
  {lvl:1, q:"A switch receives a frame whose FCS does not match the value it calculates. What does it do?", o:["Asks the sender to retransmit the frame","Corrects the damaged bits and forwards it","Discards the frame and increments an error counter","Sends an ICMP message to the source"], a:2, why:"Ethernet detects errors but does not correct or resend. The frame is dropped and counted (CRC / input errors). TCP at the end hosts recovers lost data."},
  {lvl:2, q:"A packet travels from a PC through a switch and two routers to a server. Which values are the same on every link?", o:["Source and destination MAC addresses","Source and destination IP addresses","TTL","The FCS"], a:1, why:"IP addresses are end to end (ignoring NAT). MACs and the FCS are rebuilt at each router, and TTL drops by 1 per router."},
  {lvl:2, q:"A PC sends a packet to a server on another network. What is the destination MAC address in the frame as it leaves the PC?", o:["The server's MAC","The default gateway's MAC","The switch's MAC","The broadcast address FFFF.FFFF.FFFF"], a:1, why:"For a remote destination, the frame is addressed to the next hop — the default gateway. The PC never learns a remote host's MAC; ARP does not cross routers."},
  {lvl:1, q:"Which IPv4 header field is decremented by every router, and why?", o:["Protocol, to show how many routers were crossed","TTL, so that packets caught in a routing loop are eventually discarded","Version, to track IPv4 vs IPv6","Total length, to account for removed headers"], a:1, why:"Each router lowers TTL by 1; at 0 the packet is dropped and an ICMP time-exceeded message is returned. This prevents packets circulating forever in a loop."},
  {lvl:1, q:"An IPv4 packet has the value 6 in its Protocol field. What does it carry?", o:["ICMP","UDP","TCP","OSPF"], a:2, why:"Protocol 6 = TCP, 17 = UDP, 1 = ICMP."},
  {lvl:1, q:"What is the MTU of a standard Ethernet link?", o:["64 bytes","1460 bytes","1500 bytes","1518 bytes"], a:2, why:"The MTU is the largest layer-3 packet a frame can carry: 1500 bytes. 1518 is the full frame (with 18 bytes of header and FCS); 1460 is the typical TCP data size after 40 bytes of IP and TCP headers."},
  {lvl:2, q:"A Windows PC pings a Linux server and the replies show TTL=61. Assuming the server started at the usual Linux value, how many routers did the reply cross?", o:["1","3","61","67"], a:1, why:"Linux starts TTL at 64. 64 − 61 = 3, so three routers each decremented it once."},
  {lvl:2, type:"multi", q:"A router forwards a packet from one Ethernet link to the next, with no NAT. Which two values are different in the frame it sends out compared with the frame it received? (Choose two.)", o:["The destination IP address","The source MAC address","The TCP destination port","The TTL","The source IP address"], a:[1,3], why:"The router strips the old frame and builds a new one: its own exit interface MAC becomes the source MAC (and the next hop's MAC the destination), with a new FCS. It also lowers TTL by 1. IP addresses and ports stay the same end to end."},
  {lvl:1, type:"order", q:"Put the fields of an Ethernet II frame in the order they are sent, from the destination MAC to the trailer.", items:["Destination MAC","Source MAC","Type (EtherType)","Payload","FCS"], why:"Destination MAC comes first so a switch can start deciding early, then the source MAC (which switches learn from), the 2-byte Type naming the payload, the 46–1500-byte payload, and the 4-byte FCS trailer. Preamble and SFD are sent before all of these but are not counted in the frame size."},
  {lvl:1, type:"match", q:"Match each header value to what it identifies.", pairs:[["EtherType 0x0800","IPv4"],["EtherType 0x86DD","IPv6"],["EtherType 0x0806","ARP"],["IPv4 Protocol 1","ICMP"],["IPv4 Protocol 6","TCP"],["IPv4 Protocol 17","UDP"]], why:"Each envelope labels the next one. Ethernet's Type field says which Layer 3 protocol is in the payload (ARP sits directly in a frame, not inside IP). IPv4's Protocol field says what is inside the packet: 1 ICMP, 6 TCP, 17 UDP."},
  {lvl:1, type:"fill", q:"Type the TTL that each kind of sender normally starts its packets with.", fields:[{label:"Windows", a:["128"]},{label:"Linux / macOS", a:["64"]},{label:"Cisco IOS", a:["255"]}], why:"Windows 128, Linux and macOS 64, Cisco 255. Knowing these lets you read hop counts from a ping reply: a reply from a Linux server with TTL=62 has crossed two routers."},
  {lvl:2, q:"This capture was taken on the server 10.50.0.8. The client 192.168.30.14 is a Windows PC using its default starting TTL. Which statement is correct?", ex:"Frame 87: 66 bytes on wire (528 bits), 66 bytes captured (528 bits)\nEthernet II, Src: 70:10:5c:3e:01:01, Dst: 00:50:56:9a:44:12\n    Type: IPv4 (0x0800)\nInternet Protocol Version 4, Src: 192.168.30.14, Dst: 10.50.0.8\n    Time to Live: 125\n    Protocol: TCP (6)\nTransmission Control Protocol, Src Port: 50112, Dst Port: 443, Seq: 0, Len: 0", o:["The packet crossed 3 routers, and 70:10:5c:3e:01:01 is the last router's exit interface","The packet crossed 3 routers, and 70:10:5c:3e:01:01 is the Windows PC's MAC","The packet crossed 125 routers","No router was crossed, because the IP addresses are unchanged"], a:0, why:"Windows starts at TTL 128, so 128 − 125 = 3 routers. On the last link the source MAC is the last router's outgoing interface — the PC's own MAC only appears on its own LAN. IP addresses stay the same through routers (without NAT), so they tell you nothing about the hop count."},
  {lvl:3, q:"PC 192.168.40.77 can reach other PCs on its LAN but nothing on any other network. You capture on the PC and see the exhibit. What does it show?", ex:"No.  Time     Source             Destination   Protocol  Info\n 41  3.0012   Dell_3e:01:44      Broadcast     ARP       Who has 192.168.40.1? Tell 192.168.40.77\n 42  4.0031   Dell_3e:01:44      Broadcast     ARP       Who has 192.168.40.1? Tell 192.168.40.77\n 43  5.0040   Dell_3e:01:44      Broadcast     ARP       Who has 192.168.40.1? Tell 192.168.40.77\n 44  6.0102   Dell_3e:01:44      Broadcast     ARP       Who has 192.168.40.1? Tell 192.168.40.77", o:["The PC is asking for its gateway's MAC address and nothing answers, so it can't build frames for remote traffic: check that 192.168.40.1 is the right gateway and that the router interface on this network is up","DNS is failing, so names can't be resolved","The router replies, but the PC throws the replies away because of FCS errors","The PC is sending its IP packets to the broadcast MAC address"], a:0, why:"For any remote destination the PC needs the gateway's MAC address first. Repeated 'Who has 192.168.40.1?' with no reply means no working device on this LAN owns that address: a wrong gateway setting, a router interface that is shut down or unplugged, or a router on a different VLAN. Until ARP succeeds, no packet for a remote network ever leaves the PC, so DNS is never even reached."},
  {lvl:3, q:"The storage team set both the backup server and the backup target to jumbo frames (MTU 9000). Since then, nightly backups fail, but ping between the two still works. Nobody changed the switch. Based on the exhibit from the server's switch port, what is happening?", ex:"DC-SW1#show interfaces GigabitEthernet1/0/12\nGigabitEthernet1/0/12 is up, line protocol is up (connected)\n  Description: BACKUP-SRV-01\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,\n  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX\n  ...\n     2209811 packets input, 2871009221 bytes, 0 no buffer\n     0 runts, 184233 giants, 0 throttles\n     184233 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored", o:["The server is sending frames larger than the switch port accepts, so they are dropped as giants; small pings fit, large backup frames don't. Make the MTU match end to end, or set both servers back to 1500","The cable is damaged, so frames fail their CRC check","The port is running half duplex","The server's IP address changed when the NIC was reconfigured"], a:0, why:"The switch port still carries packets up to 1500 bytes. Frames larger than the port allows are counted as giants and dropped. Ping uses small packets by default, so it still works, which is why 'but ping works' is a classic clue for an MTU problem. Jumbo frames only work when every device on the path (NICs, switch ports and the target) uses the same larger MTU. CRC is 0, so the cable is fine."},
  {lvl:3, q:"Users say the accounts server, 10.20.5.50, works 'only sometimes' since the security contractor installed new cameras. You capture the exhibit on a PC. What is the cause?", ex:"No.  Time     Source             Destination        Protocol  Info\n 12  0.8811   HP_9a:10:22        Broadcast          ARP       Who has 10.20.5.50? Tell 10.20.5.12\n 13  0.8814   Dell_51:7e:03      HP_9a:10:22        ARP       10.20.5.50 is at 54:bf:64:51:7e:03\n 14  0.8816   Hikvisio_0c:aa:01  HP_9a:10:22        ARP       10.20.5.50 is at 44:19:b6:0c:aa:01 (duplicate use of 10.20.5.50 detected!)", o:["Two devices, the server and a new camera, are both using 10.20.5.50, so PCs' ARP caches keep switching between the two MAC addresses","The server has two network cards bonded together","The switch is flooding because its MAC address table is full","DNS returns two addresses for the server"], a:0, why:"One IP address should map to one MAC address. Two different MACs answering for 10.20.5.50 is an IP address conflict. Whichever reply a PC keeps decides whether its traffic goes to the real server or to the camera (Wireshark shows the camera maker's prefix as Hikvisio), hence 'only sometimes'. Find the camera's switch port with show mac address-table address 4419.b60c.aa01 and give it a free address from the camera plan."},
  {lvl:2, type:"fill", q:"On Windows, ping -f -l <size> sets the Don't Fragment bit and chooses the amount of ICMP data. The ICMP header is 8 bytes and the IPv4 header is 20 bytes. Work out the largest size that gets through each path.", fields:[{label:"A standard 1500-byte MTU path", a:["1472"]},{label:"A path through a tunnel with an MTU of 1400", a:["1372"]}], why:"The MTU limits the whole IP packet: data + 8-byte ICMP header + 20-byte IPv4 header. 1500 − 28 = 1472, and 1400 − 28 = 1372. Engineers use this test to find the real path MTU when small things work but large transfers hang, which often happens across VPN tunnels and broadband links that add headers of their own."},
  {lvl:2, type:"order", q:"PC A (10.1.1.10) sends its first packet to a server (10.2.2.20) through router R1, and no ARP cache has any entries yet. Put the events in order.", items:["PC A sees that 10.2.2.20 is not on its own network and picks its default gateway","PC A broadcasts an ARP request for R1's G0/0 address and learns R1's MAC","PC A sends the frame: destination MAC is R1 G0/0, destination IP is 10.2.2.20","R1 checks the FCS, removes the frame and reads the destination IP","R1 lowers the TTL by 1 and finds the exit interface G0/1 in its routing table","R1 ARPs on G0/1 for the server's MAC","R1 builds a new frame from its G0/1 MAC to the server's MAC and sends it"], why:"The PC decides local or remote first, because that decides whose MAC it needs. The router then strips the frame (checking the FCS), handles the packet (TTL and routing lookup), and only once it knows the exit interface can it ARP on that network and build a brand-new frame. The IP addresses stay the same the whole way; the MAC addresses change at the router."},
  {lvl:2, type:"match", q:"PC, SW1, R1, R2, server: a packet goes from the PC to the server across this path. Match each value with what it is on that link.", pairs:[["Destination MAC on the PC to R1 link","R1's LAN interface (the PC's gateway)"],["Source MAC on the R1 to R2 link","R1's interface facing R2"],["Destination MAC on the R1 to R2 link","R2's interface facing R1"],["Source MAC on the R2 to server link","R2's interface facing the server"],["Destination IP on every link","The server's IP address"]], why:"MAC addresses only describe one link: each router builds a new frame from its own exit interface to the next device. The switch doesn't change the frame, so on the PC's side the destination is still R1. The IP header's addresses are untouched end to end (without NAT), so the destination IP is the server's on every link."},
],
cards:[
  {f:"Encapsulation vs decapsulation", b:"Encapsulation: going down the stack, each layer wraps its header (Ethernet also a trailer) around the data. Decapsulation: going up at the receiver, each layer reads and removes its own."},
  {f:"PDU names by layer", b:"L7–5 data · L4 segment (TCP) / datagram (UDP) · L3 packet · L2 frame · L1 bits."},
  {f:"Ethernet II frame fields and sizes", b:"Preamble 7 · SFD 1 · Dest MAC 6 · Source MAC 6 · Type 2 · Payload 46–1500 · FCS 4. Frame (excluding preamble/SFD): 64–1518 bytes."},
  {f:"Common EtherType values", b:"0x0800 IPv4 · 0x86DD IPv6 · 0x0806 ARP."},
  {f:"Why Ethernet has a 64-byte minimum", b:"So a sender on old shared (half-duplex) Ethernet is still transmitting when a collision from the far end reaches it. Short payloads are padded to 46 bytes."},
  {f:"What happens on an FCS (CRC) mismatch?", b:"The frame is silently discarded and the CRC / input error counter goes up. Ethernet never retransmits; TCP recovers lost data end to end."},
  {f:"MTU", b:"Largest layer-3 packet a link carries in one frame. Standard Ethernet: 1500 bytes."},
  {f:"IPv4 protocol numbers", b:"1 ICMP · 6 TCP · 17 UDP."},
  {f:"TTL", b:"8-bit IPv4 counter; each router subtracts 1; at 0 the packet is dropped and ICMP time exceeded is sent back. Stops routing loops lasting forever. Defaults: Windows 128, Linux/macOS 64, Cisco 255."},
  {f:"Crossing a router: what changes?", b:"New source/destination MACs and new FCS (new frame), TTL −1, header checksum recalculated. IP addresses and ports stay the same (unless NAT)."},
  {f:"Switch vs router handling a frame", b:"Switch: reads destination MAC, forwards the frame unchanged. Router: strips L2, reads destination IP, decrements TTL, builds a new L2 header for the next hop."},
  {f:"Wireshark's three panes", b:"Packet list (one line per frame) · packet details (nested layers: Frame, Ethernet II, IPv4, TCP/UDP) · packet bytes (raw hex)."},
],
});
// ---------- Lesson 7 ----------
L.push({
id:"net-tcpudp", mins:55, level:"Beginner · builds on lessons 5–6",
t:"TCP vs UDP: ports, sockets, the three-way handshake and reliable delivery",
html:`
${K.goals([
  "Explain what Layer 4 adds that IP alone cannot: delivery to the right application and, with TCP, reliability.",
  "Name the three port ranges and the must-know ports, and say which use TCP, UDP or both.",
  "Draw the three-way handshake with sequence and acknowledgement numbers, and explain how TCP recovers a lost segment.",
  "Choose TCP or UDP for an application and defend the choice.",
  "Read <code>netstat -an</code> / <code>ss -tan</code> output and prove whether a port is reachable with <code>Test-NetConnection</code> or <code>nc</code>.",
])}
${K.pre([
  "Lesson 1 — clients, servers and the journey of a web request.",
  "Lesson 5 — the OSI and TCP/IP models (what “Layer 4” means).",
  "Lesson 6 — encapsulation: a segment inside a packet inside a frame.",
])}

<h2>Why this matters at work</h2>
<p>Monday morning at a logistics company in Ikeja. Finance has a new accounting web app, and the vendor's email says: <i>"Browse to https://10.10.5.20:8443."</i> By 9:15 there are eleven tickets: <i>"The new system won't load. Everything else works."</i></p>
<p>Email works, Google works, even <code>ping 10.10.5.20</code> works. A technician who only asks "is the network up?" is stuck, because it is. A technician who understands <b>ports</b> sees the clue at once: <code>:8443</code>. By the end of this lesson you will be able to prove what is wrong in under a minute.</p>

<h2>What Layer 4 adds: ports and sockets</h2>
<p>IP gets a packet to the right <i>device</i>. But your laptop runs a browser with several tabs, Outlook, Teams and OneDrive at once. When a packet arrives, which program gets it? The IP header cannot say — it only names devices.</p>
<p>The ${K.g("transport layer","Layer 4. Delivers data to the right application using port numbers and, with TCP, adds reliability.")} — Layer 4 — fills that gap. It has two jobs:</p>
<ol>
<li><b>Deliver to the right application.</b> Every Layer 4 header carries a source and destination <b>port number</b>. Many applications sharing one connection this way is called ${K.g("multiplexing","Many applications sharing one network connection at once, kept apart by port numbers.")}.</li>
<li><b>Reliability — optionally.</b> IP is "best effort": packets can be lost or arrive out of order and IP will not notice. <b>TCP</b> fixes that. <b>UDP</b> deliberately does not.</li>
</ol>
<p>The TCP unit of data is a ${K.g("segment","A TCP header plus a piece of application data, carried inside an IP packet.")}; the UDP unit is a ${K.g("datagram","A self-contained message sent without setting up a connection first.")}.</p>
${K.analogy(`<p>The IP address is the address of an office block. The port is the <b>suite number</b> inside it. The courier (IP) gets the parcel to the building; reception (Layer 4) reads "Suite 443" and walks it to the right door.</p>`)}

<h3>Port numbers and their three ranges</h3>
<p>A ${K.g("port number","A 16-bit number (0–65535) in the TCP or UDP header that identifies an application on a host.")} is 16 bits, so it runs from 0 to 65535. ${K.g("IANA","Internet Assigned Numbers Authority: keeps the official registry of port numbers.")} splits them into three ranges:</p>
<div class="tablewrap"><table>
<tr><th>Range</th><th>Name</th><th>Used for</th></tr>
<tr><td><b>0 – 1023</b></td><td>Well-known</td><td>Core services: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS</td></tr>
<tr><td><b>1024 – 49151</b></td><td>Registered</td><td>Vendor services: 3389 ${K.g("RDP","Remote Desktop Protocol: Microsoft's way to see and control a Windows PC's screen across the network.")}, 8443 (a common second HTTPS port)</td></tr>
<tr><td><b>49152 – 65535</b></td><td>Dynamic / ephemeral</td><td>Never assigned; clients borrow them for one connection</td></tr>
</table></div>
<p>The two sides of a conversation use ports differently. The <b>server</b> ${K.g("listens","Has asked the OS to accept incoming connections on a port. Shown as LISTENING (Windows) or LISTEN (Linux).")} on a <b>fixed</b> port, so every client knows where to knock — 443 for HTTPS. The <b>client</b> uses a <b>temporary</b> source port, an ${K.g("ephemeral port","A short-lived source port the client OS picks automatically for one connection.")}.</p>
<p>The application does not choose that port. It asks the OS for a connection to <code>41.203.10.50</code> port 443; the OS takes a free number from its ephemeral range — usually a hard-to-guess one, for security — and releases it when the connection ends. Windows uses the IANA range, 49152–65535. Linux uses 32768–60999 by default, so a Linux client on port 41022 is still ephemeral.</p>
${K.dyk(`Port 0 is reserved and never used on the wire. When a program asks the OS to use "port 0", it means "give me any free port" — which is how ephemeral ports are handed out.`)}
${K.mistake(`Writing a firewall rule on the client's <i>source</i> port. It changes with every connection. Rules for a service match the <b>destination</b> port the server listens on — "allow TCP to 10.10.5.20 port 8443".`)}

<h3>Sockets: what makes a connection unique</h3>
<p>An IP address plus a port is a ${K.g("socket","IP address + port, written 192.168.1.25:52344.")}, written <code>192.168.1.25:52344</code>. A connection has a socket at each end, and the four numbers together — the <b>4-tuple</b> — identify it: source IP, source port, destination IP, destination port. (Add the protocol for the "5-tuple": TCP 53 and UDP 53 are different.)</p>
<p><b>Worked example.</b> You open the company portal in two tabs. Both talk to <code>41.203.10.50</code> on port 443. How does the laptop keep the replies apart?</p>
${K.steps([
  ["Each tab gets its own source port", `<p>Tab 1: <code>192.168.1.25:52344 → 41.203.10.50:443</code>. Tab 2: <code>192.168.1.25:52345 → 41.203.10.50:443</code>. Three numbers match; the client port differs, so these are two connections.</p>`],
  ["Replies come back with the ports swapped", `<p>The server answers from 443 <i>to</i> 52344 or 52345. Windows reads the destination port and hands each reply to the right tab.</p>`],
  ["The server does the same in reverse", `<p>A busy web server holds thousands of connections on its one port 443, told apart by client IP and port.</p>`],
])}
${K.svg("0 0 720 270",
  K.box(20,28,290,48,"Tab 1 — portal (TCP)","192.168.1.25:52344 → 41.203.10.50:443")+
  K.box(20,103,290,48,"Tab 2 — portal (TCP)","192.168.1.25:52345 → 41.203.10.50:443")+
  K.box(20,178,290,48,"DNS lookup (UDP)","192.168.1.25:61200 → 192.168.1.1:53")+
  K.dev("server",600,82,"Web server","41.203.10.50 : 443")+
  K.dev("router",600,200,"DNS (router)","192.168.1.1 : 53")+
  K.arrow(312,52,572,76,"",true)+K.arrow(312,127,572,90,"",true)+K.arrow(312,202,570,202,"")+
  K.txt(165,252,"one laptop · 192.168.1.25",{mid:true,c:"fg"}),
  "Three conversations from one laptop. The two tabs share every number except the client's ephemeral port, which is enough to keep them apart.")}
${K.check({q:"Two tabs on one laptop open the same HTTPS site. Which part of the 4-tuple differs between the two connections?", o:["The destination IP address","The destination port (443)","The client's source port","Nothing — they share one connection"], a:2, why:"Same laptop, same server, same server port. The OS gives each connection its own ephemeral source port, which makes the 4-tuples different."})}

<h2>The ports you must know</h2>
<p>The exam expects you to match these services to their ports and transport. At work you will use them weekly — in firewall rules, troubleshooting and calls with vendors.</p>
<div class="tablewrap"><table>
<tr><th>Port</th><th>Transport</th><th>Service</th><th>What it is for</th></tr>
<tr><td>20, 21</td><td>TCP</td><td>${K.g("FTP","File Transfer Protocol: the classic way to copy files to and from a server. It sends everything, passwords included, unencrypted.")}</td><td>File transfer: 21 control, 20 data (active mode). Unencrypted.</td></tr>
<tr><td>22</td><td>TCP</td><td>SSH</td><td>Encrypted remote CLI for routers, switches, Linux. Also SFTP/SCP.</td></tr>
<tr><td>23</td><td>TCP</td><td>Telnet</td><td>Remote CLI with <b>no encryption</b>. Replace with SSH.</td></tr>
<tr><td>25</td><td>TCP</td><td>SMTP</td><td>Sending mail between servers.</td></tr>
<tr><td>53</td><td>UDP + TCP</td><td>DNS</td><td>Names to IPs. Lookups on UDP; zone transfers and large answers on TCP.</td></tr>
<tr><td>67, 68</td><td>UDP</td><td>DHCP</td><td>Handing out addresses: server 67, client 68.</td></tr>
<tr><td>69</td><td>UDP</td><td>${K.g("TFTP","Trivial File Transfer Protocol: a stripped-down file copy over UDP with no login at all, used to load IOS images, configs and IP phone files.")}</td><td>No-login file copy: IOS images, configs, IP phone boot files.</td></tr>
<tr><td>80</td><td>TCP</td><td>HTTP</td><td>Web, unencrypted.</td></tr>
<tr><td>110</td><td>TCP</td><td>${K.g("POP3","Post Office Protocol version 3: downloads mail to one device and usually removes it from the server.")}</td><td>Download mail to one device.</td></tr>
<tr><td>123</td><td>UDP</td><td>${K.g("NTP","Network Time Protocol: keeps every device's clock in step with a reliable time source.")}</td><td>Clock sync — vital for logs and certificates.</td></tr>
<tr><td>143</td><td>TCP</td><td>${K.g("IMAP","Internet Message Access Protocol: reads mail while leaving it on the server, so your phone and laptop see the same inbox.")}</td><td>Mail kept on the server, synced across devices.</td></tr>
<tr><td>161, 162</td><td>UDP</td><td>${K.g("SNMP","Simple Network Management Protocol: lets a monitoring server read a device's health (CPU, interfaces, errors) and receive its alerts.")}</td><td>Monitoring: polls go to 161; alerts (traps) go to 162.</td></tr>
<tr><td>443</td><td>TCP (UDP for HTTP/3)</td><td>HTTPS</td><td>Web encrypted with TLS — most traffic today.</td></tr>
<tr><td>514</td><td>UDP</td><td>Syslog</td><td>Devices sending logs to a central server.</td></tr>
<tr><td>3389</td><td>TCP (UDP too)</td><td>RDP</td><td>Remote Desktop to Windows.</td></tr>
</table></div>
<p>Notice the UDP services: DHCP, TFTP, NTP, SNMP, Syslog, DNS lookups. All are short exchanges — a question and an answer, or a one-way message. You will see why that suits UDP shortly. You will also meet secure variants: IMAP over TLS on 993, POP3 over TLS on 995, mail submission on 587.</p>
${K.remember(`<p>Learn ports as stories, not a list. "FTP needs two: 20 and 21." "SSH 22 replaced Telnet 23 — one number lower, much safer." "DHCP: server 67, client 68." "SNMP 161 is the question, 162 is the alarm." "HTTPS 443 is HTTP 80 with a padlock."</p>`)}
${K.check({q:"A monitoring server asks a switch for its CPU usage every five minutes. Which destination port and transport does that use?", o:["TCP 22","UDP 161","UDP 162","UDP 514"], a:1, why:"SNMP polls go to the agent on UDP 161. UDP 162 is for traps sent from the device to the manager. 514 is Syslog."})}
${K.q({type:"match", q:"Match each destination port to its service.", pairs:[["TCP 21","FTP (control)"],["TCP 25","SMTP"],["UDP 53","DNS lookup"],["TCP 110","POP3"],["TCP 143","IMAP"],["TCP 80","HTTP"]], why:"FTP control is 21 (data 20 in active mode), SMTP sends mail between servers on 25, DNS lookups use UDP 53, POP3 downloads mail to one device on 110, IMAP keeps mail on the server on 143, and unencrypted web is HTTP on 80."})}

<h2>TCP: the reliable conversation</h2>
<p>${K.g("TCP","Transmission Control Protocol: connection-oriented Layer 4 protocol that numbers bytes, acknowledges them, retransmits losses and controls the sending rate.")} is <b>connection-oriented</b>. Before data moves, the two ends agree to talk; while they talk, every byte is numbered and confirmed; when they finish, they close politely. The web, email, SSH and file transfer use TCP because they need every byte, in order, exactly once.</p>
<p>On top of IP, TCP adds connection setup and teardown, <b>sequencing</b>, <b>acknowledgement and retransmission</b>, <b>flow control</b> and port multiplexing. That needs a bigger header than UDP:</p>
${K.svg("0 0 720 280",
  K.txt(220,24,"TCP header — 20 bytes minimum",{mid:true,c:"fg",b:true,f:"display",s:12.5})+
  K.band(20,38,200,28,"Source port")+K.band(220,38,200,28,"Destination port")+
  K.band(20,70,400,28,"Sequence number","var(--panel2)")+
  K.band(20,102,400,28,"Acknowledgement number","var(--panel2)")+
  K.band(20,134,60,28,"HLEN")+K.band(80,134,140,28,"Flags (SYN/ACK…)")+K.band(220,134,200,28,"Window size","var(--panel2)")+
  K.band(20,166,200,28,"Checksum")+K.band(220,166,200,28,"Urgent pointer")+
  K.band(20,198,400,28,"Options (0–40 bytes, e.g. MSS)")+
  K.txt(220,248,"each row = 32 bits (4 bytes) · highlighted = what makes TCP reliable",{mid:true,s:10})+
  K.txt(590,24,"UDP header — 8 bytes",{mid:true,c:"fg",b:true,f:"display",s:12.5})+
  K.band(470,38,120,28,"Source port")+K.band(590,38,120,28,"Dest port")+
  K.band(470,70,120,28,"Length")+K.band(590,70,120,28,"Checksum")+
  K.txt(590,124,"that is the whole header",{mid:true,c:"fg"})+
  K.txt(590,144,"no sequence numbers",{mid:true})+
  K.txt(590,162,"no acknowledgements",{mid:true})+
  K.txt(590,180,"no window",{mid:true}),
  "TCP versus UDP headers. TCP's sequence number, acknowledgement number and window give it reliability and flow control; UDP carries only ports, a length and a checksum.")}
<p>The ${K.g("flags","One-bit markers in the TCP header: SYN (start), ACK (acknowledgement valid), FIN (finished), RST (abort), plus PSH and URG.")} to know are SYN, ${K.g("ACK","Acknowledgement: the flag that says the acknowledgement number is valid — \"I got everything up to here; send me this byte next.\"")}, ${K.g("FIN","TCP flag meaning 'I have finished sending'. Each side sends one, and each is acknowledged.")} and ${K.g("RST","Reset: TCP flag that aborts a connection at once; also the reply when nothing listens on the port.")}.</p>

<h3>The three-way handshake</h3>
<p>Every TCP connection opens with the ${K.g("three-way handshake","SYN → SYN-ACK → ACK: the three segments that open a TCP connection.")}. Each side announces where its byte numbering starts — its ${K.g("ISN","Initial Sequence Number: a random 32-bit starting number, random so attackers cannot guess it.")} — and confirms the other's. Real ISNs are large random numbers; small ones keep the arithmetic easy here.</p>
${K.steps([
  ["SYN — client to server", `<p>The laptop (port 52344) sends <b>SYN</b>, <code>seq=1000</code>, to port 443: <i>"I'd like to connect; my numbering starts at 1000."</i> State: <b>SYN-SENT</b>.</p>`],
  ["SYN-ACK — server to client", `<p>The server, in <b>LISTEN</b>, replies <b>SYN+ACK</b>, <code>seq=5000, ack=1001</code>: <i>"My numbering starts at 5000; next I expect your 1001."</i> A SYN uses one sequence number, so the ack is 1001. State: <b>SYN-RECEIVED</b>.</p>`],
  ["ACK — client to server", `<p>The client sends <b>ACK</b>, <code>seq=1001, ack=5001</code>. Both sides are <b>ESTABLISHED</b>; the first data byte will be 1001 (for HTTPS, TLS setup comes next, then HTTP).</p>`],
])}
${K.svg("0 0 720 400",
  K.dev("laptop",130,42,"Client","192.168.1.25:52344")+K.dev("server",590,44,"Server","41.203.10.50:443")+
  `<line x1="130" y1="104" x2="130" y2="388" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 4"/><line x1="590" y1="104" x2="590" y2="388" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 4"/>`+
  K.arrow(132,124,588,170,"",true)+K.txt(360,132,"1  SYN   seq=1000",{mid:true,c:"accent",s:11.5})+
  K.arrow(588,196,132,242,"",true)+K.txt(360,204,"2  SYN-ACK   seq=5000  ack=1001",{mid:true,c:"accent",s:11.5})+
  K.arrow(132,268,588,314,"",true)+K.txt(360,276,"3  ACK   seq=1001  ack=5001",{mid:true,c:"accent",s:11.5})+
  K.txt(120,128,"SYN-SENT",{end:true,s:10})+K.txt(120,272,"ESTABLISHED",{end:true,c:"ok",s:10})+
  K.txt(600,120,"LISTEN",{s:10})+K.txt(600,200,"SYN-RCVD",{s:10})+K.txt(600,318,"ESTABLISHED",{c:"ok",s:10})+
  K.band(170,344,380,28,"connection ESTABLISHED — data starts at byte 1001","var(--panel2)"),
  "The three-way handshake. Each side announces its starting sequence number and acknowledges the other's plus one, because a SYN uses one number.")}
<p>Why three messages? Both directions need proof. After message 2 the client knows both ways work, but the server does not yet know its SYN-ACK arrived. Message 3 tells it.</p>
${K.mistake(`Saying the ACK number is "the last byte received". It is the <b>next byte expected</b>: <code>ack=5001</code> means "I have everything up to 5000."`)}
${K.exam(`Expect "fill in the ACK number" questions: add one to the other side's SYN sequence number. Also watch the wording — "connection-oriented", "reliable", "sequencing", "windowing" or "acknowledgements" all point to <b>TCP</b>; "connectionless", "best effort" or "low overhead" point to <b>UDP</b>.`)}

<h3>Sequence numbers, ACKs and retransmission</h3>
<p>Once connected, every byte is numbered. If a 1,000-byte segment starts at 1001, the next starts at 2001. The receiver replies "next I expect byte X", which covers everything before X, so one ACK can confirm several segments.</p>
<p>The sender keeps a copy of each segment until it is acknowledged and runs a ${K.g("retransmission timer","A countdown for unacknowledged data; if no ACK arrives in time, the data is resent.")}. Here is a lost segment during a file upload:</p>
${K.steps([
  ["Four segments leave", `<p>The sender sends <code>seq=1001</code>, <code>2001</code>, <code>3001</code> and <code>4001</code> without waiting for an ACK after each.</p>`],
  ["One is lost", `<p>Segment 2001 is dropped — a congested router queue, or Wi-Fi interference. The other three arrive.</p>`],
  ["The receiver keeps asking for the gap", `<p>After 1001 it sends <code>ack=2001</code>. When 3001 and 4001 arrive, it buffers them and repeats <code>ack=2001</code> — <b>duplicate ACKs</b>: "still waiting for 2001".</p>`],
  ["The sender resends only the missing piece", `<p>Two duplicate ACKs aren't enough to act on, so here the sender waits for its retransmission timer for 2001 to expire, then resends segment 2001. If a <b>third</b> duplicate ACK had arrived first, most TCP stacks would resend straight away without waiting for the timer — this shortcut is called <i>fast retransmit</i>.</p>`],
  ["The gap is filled", `<p>The receiver now holds 1001–5000, sends one <code>ack=5001</code>, and hands the data to the application in order. The application never knew.</p>`],
])}
<p>The hidden cost: 3001 and 4001 had arrived, but the application could not use them until 2001 was resent. TCP delivers in order, so one loss holds up everything behind it. Fine for a file; bad for a live call.</p>

<h3>Flow control and the window</h3>
<p>A fast server could overflow a busy laptop's buffer. TCP prevents this with the ${K.g("window","How many bytes the receiver will accept beyond what it has acknowledged; advertised in every segment.")}: in every segment, the receiver advertises "you may send this many bytes before waiting for my next ACK". With a window of 64,240 bytes, up to 64,240 bytes can be in flight. As ACKs return, the window slides forward — a <b>sliding window</b>.</p>
<p>A busy receiver advertises a smaller window; at zero, the sender pauses. The receiver sets the pace — that is ${K.g("flow control","Stopping a fast sender from overwhelming a slow receiver; in TCP, done with the window.")}. (Senders also slow down when they see losses, since loss usually means congestion — that is congestion control.)</p>
${K.analogy(`<p>A warehouse dock manager shouts "room for six pallets!" The forklift brings six without waiting for a signature on each. When the dock is full, the manager shouts "zero!" and the forklift waits.</p>`)}

<h3>Closing: FIN and RST</h3>
<p>A normal close uses <b>FIN</b>, one per direction: client <b>FIN</b> → server <b>ACK</b> → server <b>FIN</b> → client <b>ACK</b> (the middle two often share a segment). The side that closed first then waits in ${K.g("TIME_WAIT","State held by the side that closed first, from about one to four minutes depending on the OS, so late segments cannot be confused with a new connection.")} before forgetting the connection.</p>
<p>The abrupt way is <b>RST</b>: "this connection is over, now." You see it when an app crashes, when a firewall actively rejects, and — most often — when you connect to a port where nothing is listening. Users see that as <b>"connection refused"</b>, a useful clue: the packet <i>reached</i> the host, but no program was waiting on that port.</p>
${K.check({q:"A client sends SYN with seq=7000. The server's SYN-ACK has seq=3000. What are the ACK numbers in the SYN-ACK and in the client's final ACK?", o:["7000 and 3000","7001 and 3001","7001 and 3000","3001 and 7001"], a:1, why:"The ACK is the next number expected, and a SYN uses one number: the server acknowledges 7001, the client acknowledges 3001."})}
${K.check({q:"A receiver advertises a TCP window of 0. What does the sender do?", o:["Retransmits everything","Sends an RST","Pauses new data until the window opens again","Switches to UDP"], a:2, why:"A zero window means 'my buffer is full'. The sender waits — that is flow control."})}
${K.q({type:"fill", q:"A client sends SYN with seq=4000. The server replies SYN-ACK with seq=9000. Fill in the missing numbers.", fields:[{label:"ack in the server's SYN-ACK", a:["4001"]},{label:"seq in the client's final ACK", a:["4001"]},{label:"ack in the client's final ACK", a:["9001"]}], why:"A SYN uses one sequence number, and an ACK names the next byte expected. So the server acknowledges 4001, the client's next segment is numbered 4001, and the client acknowledges the server's SYN with 9001."})}

<h2>UDP: fast, simple, no promises</h2>
<p>${K.g("UDP","User Datagram Protocol: connectionless Layer 4 protocol with an 8-byte header — no handshake, acknowledgements, retransmission or ordering.")} is <b>connectionless</b>: no handshake, no state, no goodbye. It adds an 8-byte header (two ports, length, ${K.g("checksum","A value calculated from the data; if the receiver's calculation differs, the data was damaged and is discarded.")}) and sends. Lost datagrams stay lost; damaged ones are discarded; order is not restored.</p>
<p>Why want that? Because for some applications TCP's guarantees get in the way:</p>
<ul>
<li><b>Voice and video calls.</b> Each packet, carried in ${K.g("RTP","Real-time Transport Protocol: the format voice and video use on top of UDP. Its sequence numbers and timestamps let the receiver play the audio in order and on time.")}, holds about 20 ms of sound. Resending a lost one is pointless — the conversation has moved on — and TCP's in-order delivery would freeze everything behind it. The app plays what arrives and hides small gaps. What hurts calls is ${K.g("latency","Delay from sender to receiver; for voice, keep one-way delay under about 150 ms.")} and ${K.g("jitter","Variation in delay between packets; makes audio choppy.")}, not the odd loss.</li>
<li><b>Live streams and games.</b> The newest frame or player position beats an old one resent.</li>
<li><b>DNS.</b> One small question, one small answer; a handshake would triple the packets. No reply? The client asks again.</li>
<li><b>DHCP.</b> A new laptop has no IP address and must broadcast — UDP can; TCP's one-to-one connections cannot.</li>
<li><b>NTP, SNMP, Syslog, TFTP.</b> Short messages where low overhead matters most (TFTP adds its own simple ACKs).</li>
</ul>
<p>The rule: <b>UDP leaves reliability to the application</b>, which builds exactly as much as it needs.</p>
${K.dyk(`DNS was designed to fit answers into 512-byte UDP messages. When an answer is too big, the server sets a "truncated" flag and the client asks again over <b>TCP</b> 53 — one reason blocking TCP 53 breaks some lookups.`)}

<h3>TCP vs UDP at a glance</h3>
<div class="tablewrap"><table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Connection</td><td>Connection-oriented (handshake)</td><td>Connectionless</td></tr>
<tr><td>Reliability</td><td>ACKs and retransmission</td><td>None</td></tr>
<tr><td>Ordering</td><td>Sequence numbers, in order</td><td>No ordering</td></tr>
<tr><td>Flow control</td><td>Window</td><td>None</td></tr>
<tr><td>Header</td><td>20–60 bytes</td><td>8 bytes</td></tr>
<tr><td>Unit</td><td>Segment</td><td>Datagram</td></tr>
<tr><td>Typical uses</td><td>HTTP/HTTPS, SMTP, IMAP, POP3, SSH, FTP, RDP</td><td>Voice/video, DNS lookups, DHCP, TFTP, SNMP, Syslog, NTP, games</td></tr>
</table></div>

<h3>A modern twist: QUIC and HTTP/3</h3>
<p>${K.g("QUIC","A transport protocol standardised by the IETF in 2021 that runs over UDP and provides reliable, encrypted connections. HTTP/3 runs over QUIC.")} runs <b>over UDP</b>, and <b>HTTP/3</b> runs over QUIC — so Chrome talking to Google or YouTube often uses <b>UDP 443</b>. QUIC builds its own acknowledgements, retransmission and TLS 1.3 encryption on top of UDP, and a loss only holds up the one stream it belongs to. If a firewall blocks UDP 443, browsers fall back to TCP 443.</p>
${K.when([
  ["TCP","Every byte must arrive, in order: web pages, email, file transfer, SSH, databases","Handshake, ACKs, retransmission and windowing guarantee complete, ordered data","The data is real-time and a late packet is useless (live voice/video)"],
  ["UDP","Real-time media, short request/reply (DNS, NTP, SNMP), broadcasts (DHCP), one-way logs (Syslog)","No setup delay, 8-byte header, no waiting on retransmissions","The app needs guaranteed delivery and does not build its own"],
  ["QUIC (over UDP 443)","Modern web and apps that want reliability without TCP's head-of-line blocking","Reliability and encryption built into the app, on top of UDP","A network blocks UDP 443 — clients fall back to TCP"],
], "TCP, UDP or QUIC?")}

${K.case("Robotic voice calls over the VPN",`<p>Staff working from home around Abuja use softphones through the company's ${K.g("SSL VPN","A remote-access VPN that runs over the same encryption as secure websites (TLS; SSL is its older name), so staff connect from home with a client app.")}. After a firewall upgrade, calls turn robotic, freeze for two seconds, then "catch up" in a rush. Every VPN client had fallen back from its UDP tunnel (${K.g("DTLS encryption","Datagram TLS: TLS adapted to run over UDP, so a lost packet does not hold up everything behind it.")}) to its TCP tunnel (TLS): the new policy had left out the VPN's UDP port.</p>
<p>The voice packets were still UDP, but now travelled <i>inside</i> TCP. A loss on home Wi-Fi made TCP hold everything until the retransmission arrived — the freeze — then deliver the backlog at once. One firewall rule restored the UDP tunnel and call quality the same afternoon. Real-time traffic wants fresh data, not perfect data.</p>`)}

${K.myth([
  ["UDP is “unreliable”, so it is only for unimportant traffic.","DNS, DHCP and voice all use UDP and are critical. UDP is chosen because it fits; the application adds reliability where it needs it."],
  ["Port 443 always means TCP.","HTTP/3 uses QUIC over <b>UDP</b> 443. Firewalls see both."],
  ["DNS only uses UDP.","Lookups use UDP 53; zone transfers and large answers use TCP 53."],
  ["Client and server use the same port number.","The server listens on a fixed port (443); the client uses an ephemeral source port chosen by its OS."],
])}

<h3>Practice: which protocol and port, and why?</h3>
<p>On paper, write the transport, destination port and one sentence of <i>why</i> for each:</p>
<ol>
<li>You log in to a core switch securely to change its configuration.</li>
<li>A new laptop joins the Wi-Fi and needs an IP address.</li>
<li>A sales rep makes a Teams video call to a client in Accra.</li>
<li>Every router sends log messages to a central server.</li>
<li>Outlook keeps one mailbox in sync on a laptop and a phone.</li>
<li>A switch's power supply fails and it alerts the monitoring system.</li>
<li>A browser loads <code>https://portal.company.com</code> through a firewall that blocks UDP 443.</li>
</ol>
${K.hint(`<p>For each one ask: "Would a late or missing piece break it, or only make it slightly worse?" Broken → TCP. Slightly worse, or a tiny one-shot message → UDP. Then find the service in the ports table. For item 6, think about which direction the message travels.</p>`)}
${K.reveal("Show the answers",`<ol>
<li><b>TCP 22, SSH.</b> Keystrokes must arrive complete, in order and encrypted. Never Telnet 23.</li>
<li><b>UDP 67/68, DHCP.</b> No address yet, so it must broadcast; UDP allows that.</li>
<li><b>UDP</b> for the media (app-chosen ports): fresh beats complete. Sign-in and chat use HTTPS over TCP.</li>
<li><b>UDP 514, Syslog.</b> Small one-way messages, no setup.</li>
<li><b>TCP 143, IMAP</b> (993 with TLS). Mail must be complete; IMAP keeps it on the server for every device.</li>
<li><b>UDP 162, SNMP trap</b> — device to manager. Polling uses 161.</li>
<li><b>TCP 443, HTTPS</b>, after falling back from HTTP/3 on UDP 443. The DNS lookup first goes to <b>UDP 53</b>.</li>
</ol>`)}
${K.check({q:"Why do voice calls use UDP rather than TCP?", o:["UDP is encrypted and TCP is not","UDP guarantees delivery","Resending late audio is useless, and TCP's in-order delivery would freeze the call after each loss","Phones do not support TCP"], a:2, why:"For real-time audio a late packet is as bad as a lost one. UDP lets the app play what arrives and keep the call live."})}

<h2>Seeing connections on a real machine</h2>
<p>On Windows, open Command Prompt and run <code>netstat -an</code>: <code>-a</code> shows all connections and listening ports, <code>-n</code> shows numbers instead of names. Trimmed, from a laptop with the portal open:</p>
${K.out(`Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING
  TCP    192.168.1.25:52344     41.203.10.50:443       ESTABLISHED
  TCP    192.168.1.25:52345     41.203.10.50:443       ESTABLISHED
  TCP    192.168.1.25:52290     142.250.184.14:443     TIME_WAIT
  TCP    192.168.1.25:52361     10.10.5.20:8443        SYN_SENT
  UDP    0.0.0.0:5353           *:*`, "netstat -an on Windows (trimmed). Add -o for the process ID; -b (as administrator) for the program name.")}
<ul>
<li><b>Columns</b> — protocol, your socket, the other end's socket, TCP state.</li>
<li><b>LISTENING on 135 and 445</b> — the laptop is a <i>server</i> on these ports (Windows services; 445 is ${K.g("SMB","Server Message Block: Windows file and printer sharing — what a mapped S: drive or a shared folder uses.")} file sharing). <code>0.0.0.0</code> means "all my addresses"; <code>0.0.0.0:0</code> means nobody is connected yet.</li>
<li><b>Two ESTABLISHED lines to <code>41.203.10.50:443</code></b> — the two portal tabs, ports 52344 and 52345.</li>
<li><b>TIME_WAIT</b> — a closed connection to a Google server; this laptop closed first. Normal; it clears itself.</li>
<li><b>SYN_SENT to <code>10.10.5.20:8443</code></b> — a SYN went out and no SYN-ACK came back. If it stays, something in the path is not answering.</li>
<li><b>UDP</b> — no state, because UDP has no connections; <code>*:*</code> means "from anyone".</li>
</ul>
<p>On Linux, use <code>ss -tan</code> (TCP, all, numeric). On the accounting server <code>10.10.5.20</code>:</p>
${K.out(`State      Recv-Q Send-Q   Local Address:Port      Peer Address:Port
LISTEN     0      128            0.0.0.0:22             0.0.0.0:*
LISTEN     0      511            0.0.0.0:8443           0.0.0.0:*
ESTAB      0      0           10.10.5.20:22        192.168.50.10:41022
ESTAB      0      0           10.10.5.20:8443      192.168.50.12:50231
TIME-WAIT  0      0           10.10.5.20:8443      192.168.50.12:50198`, "ss -tan on Linux. Older systems show the same with netstat -tan.")}
<ul>
<li><b>LISTEN on 22 and 8443</b> — SSH and the accounting app are running on all addresses. The app is fine.</li>
<li><b>${K.g("ESTAB","Short for ESTABLISHED in Linux ss output: a TCP connection that is open and passing data.")} on 22</b> — an admin is logged in over SSH from a Linux machine (ephemeral port 41022).</li>
<li><b>ESTAB and TIME-WAIT on 8443</b> — a machine on <code>192.168.50.x</code>, the IT network, uses the app. Nothing from the users' <code>192.168.1.x</code> appears.</li>
<li><b>Recv-Q / Send-Q</b> — bytes waiting in buffers; zeros on established lines are healthy.</li>
</ul>
${K.mistake(`Deciding "ping works, so the app should work". Ping is ICMP and has no ports; it proves the <i>host</i> answers, nothing more. A firewall can allow ping and still block TCP 8443. To test an app, test its <b>port</b>.`)}
${K.check({q:"In netstat, a connection to 10.10.5.20:8443 stays in SYN_SENT. What does that tell you?", o:["It is working normally","The client sent a SYN but never got a SYN-ACK","The server sent an RST","The connection closed and is waiting"], a:1, why:"SYN_SENT means the first handshake step went out and nothing came back — often a firewall dropping the traffic silently."})}

${K.job("“The new accounting app times out — everything else works”",`
<p><b>The ticket.</b> Bisi in Finance: <i>"https://10.10.5.20:8443 won't open. Chrome spins, then says ERR_CONNECTION_TIMED_OUT. Email and internet are fine. The whole team has it."</i></p>
<p><b>Questions.</b> <i>Who?</i> All of Finance plus Procurement — not one PC. <i>What?</i> Only the new app — so connection, DNS and internet are fine. <i>Ever worked?</i> "IT demoed it from their office on Friday." Big clue: it works from IT's network, not the users'.</p>
<p><b>Check 1 — the host.</b> <code>ping 10.10.5.20</code> from a Finance PC: replies in 1 ms.</p>
<p><b>Check 2 — the port.</b> In PowerShell:</p>
${K.out(`> Test-NetConnection 10.10.5.20 -Port 8443
WARNING: TCP connect to (10.10.5.20 : 8443) failed

ComputerName           : 10.10.5.20
RemoteAddress          : 10.10.5.20
RemotePort             : 8443
InterfaceAlias         : Ethernet
SourceAddress          : 192.168.1.25
PingSucceeded          : True
PingReplyDetails (RTT) : 1 ms
TcpTestSucceeded       : False`, "The host answers ping, but the TCP handshake to port 8443 fails.")}
<p>Ping True, TCP False. The same test to port 443 on a known-good server returns True, so the test is sound.</p>
<p><b>Check 3 — timeout or refused?</b> From a Linux box on the user network, <code>nc -vz 10.10.5.20 8443</code> hangs, then times out (<code>telnet 10.10.5.20 8443</code> does a similar job on Windows). <b>Refused</b> would mean an RST came back — server reached, nothing listening. <b>Timed out</b> means nothing came back — dropped in the path, almost always a firewall.</p>
<p><b>Check 4 — is the app listening?</b> The server team's <code>ss -tan</code> shows LISTEN on <code>0.0.0.0:8443</code> and sessions from <code>192.168.50.x</code> only.</p>
<p><b>Cause.</b> The internal firewall allows users to servers on TCP 443, and the IT network on any port — but has no rule for TCP 8443 from users. The vendor tested from IT's network, so nobody noticed. The firewall drops the SYNs silently: hence SYN_SENT and the timeout.</p>
<p><b>Fix.</b> A firewall change: <i>permit TCP, source 192.168.1.0/24, destination 10.10.5.20, destination port 8443</i> — one port, one server. Afterwards <code>TcpTestSucceeded : True</code> and Bisi sees the login page.</p>
<p><b>What you say.</b> To Bisi: "Fixed — the new system uses a different door, port 8443, and the firewall wasn't opening it for your team. IT already had access, which is why their demo worked. Please try now." To your manager: "The app needs TCP 8443, which wasn't in the user firewall policy. I've opened that one port to that one server. Let's add 'list the ports the app needs' to our new-system checklist."</p>
<p><b>Ticket note.</b> <i>"Users time out to https://10.10.5.20:8443; ping OK. Test-NetConnection 8443: TcpTestSucceeded False; nc timeout (not refused) → dropped in path. Server ss: LISTEN 0.0.0.0:8443, sessions from 192.168.50.0/24 only. Cause: no firewall rule for TCP 8443 from 192.168.1.0/24. Fix: change request 2291, permit TCP 192.168.1.0/24 → 10.10.5.20 dst 8443. Verified TcpTestSucceeded True, login page loads. Resolved."</i></p>`)}
${K.dodont([
  "Test the application's port (Test-NetConnection, nc), not only ping.",
  "Write firewall rules on the destination port, scoped to the sources and servers that need it.",
  "Note in the ticket whether a test was <i>refused</i> or <i>timed out</i> — it says where the fault is.",
  "Compare from a network where the app works.",
],[
  "Open “any port” to make one app work.",
  "Use Telnet (23) to manage devices — use SSH.",
  "Worry about TIME_WAIT lines; they are normal after a close.",
  "Restart the server when the test times out — the problem is usually in the path.",
])}

<h2>Interview corner</h2>
${K.reveal("“TCP vs UDP — when would you choose each?”",`<p>"TCP is connection-oriented: a three-way handshake, numbered bytes, acknowledgements and retransmission, in-order delivery and flow control with a sliding window. I'd use it when every byte must arrive correctly — web, email, file transfer, SSH. UDP is connectionless with an 8-byte header and no retransmission, so there is less overhead and no setup delay. I'd use it for real-time voice and video, where a late packet is useless and retransmission causes freezes, and for short exchanges like DNS, DHCP and NTP, where the application can retry. QUIC is a modern example: it builds reliability on top of UDP, so HTTP/3 uses UDP 443."</p>`)}
${K.reveal("“Explain the TCP three-way handshake.”",`<p>"The client sends a SYN with its initial sequence number, say 1000. The server replies SYN-ACK with its own ISN, say 5000, and ack 1001 — the next byte it expects, since the SYN uses one number. The client replies ACK 5001 and both sides are ESTABLISHED. Three messages are needed so each side's number is announced and acknowledged. Connections close with a FIN and ACK in each direction, or abruptly with an RST."</p>`)}
${K.reveal("“One user gets ‘connection refused’, another ‘connection timed out’. What's the difference?”",`<p>"Refused means a TCP RST came back: the host was reached but nothing listens on that port, so I'd check the service is running and bound to the right port with <code>ss -tan</code> or <code>netstat -an</code>. Timed out means no reply at all — usually a firewall or ACL dropping it, or a routing problem. I'd confirm with <code>Test-NetConnection host -Port N</code> or <code>nc -vz</code>, compare from a network where it works, then check the rules for that destination port."</p>`)}
${K.video({t:"TCP three-way handshake explained", u:"https://www.youtube.com/results?search_query=tcp+three+way+handshake+explained+ccna", by:"YouTube search", why:"Watch the handshake animated, then redraw it from memory with your own sequence numbers."})}

${K.recap([
  "IP delivers to the right device; Layer 4 delivers to the right application, using ports.",
  "Ports: well-known 0–1023, registered 1024–49151, ephemeral 49152–65535. Servers listen on fixed ports; clients get an ephemeral source port from the OS.",
  "Socket = IP + port. A connection is its 4-tuple: source IP, source port, destination IP, destination port.",
  "FTP 20/21, SSH 22, Telnet 23, SMTP 25, DNS 53, DHCP 67/68, TFTP 69, HTTP 80, POP3 110, NTP 123, IMAP 143, SNMP 161/162, HTTPS 443, Syslog 514, RDP 3389.",
  "TCP: SYN → SYN-ACK → ACK; ACK = next byte expected; lost segments are retransmitted; the window gives flow control; FIN closes, RST aborts.",
  "UDP: connectionless, 8-byte header, no retransmission — right for voice, video, DNS, DHCP, NTP, SNMP, Syslog. QUIC/HTTP/3 builds reliability on UDP.",
  "netstat -an / ss -tan show LISTEN, ESTABLISHED, TIME_WAIT, SYN_SENT. Ping proves the host; Test-NetConnection or nc proves the port. Refused = nothing listening; timed out = dropped in the path.",
])}
${K.next(`<b>Lesson 8 — Your first Cisco device.</b> You now know how data gets from the cable to the application. Next you get hands-on with the operating system on Cisco routers and switches: connecting, moving between modes, reading the configuration and saving changes.`)}
`,
quiz:[
  {lvl:1, q:"Which range contains the dynamic (ephemeral) ports defined by IANA?", o:["0–1023","1024–49151","49152–65535","32768–65535"], a:2, why:"IANA: 0–1023 well-known, 1024–49151 registered, 49152–65535 dynamic/private. Linux's default of 32768–60999 is an OS choice, not the IANA range."},
  {lvl:1, q:"Which pair of services both use UDP by default?", o:["SSH and HTTPS","TFTP and SNMP","FTP and SMTP","Telnet and POP3"], a:1, why:"TFTP (69) and SNMP (161/162) use UDP. SSH, HTTPS, FTP, SMTP, Telnet and POP3 use TCP."},
  {lvl:2, q:"A client sends a SYN with sequence number 200. The server replies SYN-ACK with sequence number 900. What acknowledgement number does the client send in the final ACK?", o:["200","201","900","901"], a:3, why:"The client acknowledges the server's SYN. The ACK is the next byte expected, and a SYN uses one sequence number, so it is 901."},
  {lvl:1, q:"Which TCP mechanism lets a receiver stop a faster sender from overwhelming it?", o:["The checksum","The three-way handshake","The window (flow control)","The RST flag"], a:2, why:"The receiver advertises how much more data it can accept. A small or zero window slows or pauses the sender."},
  {lvl:1, q:"How does DNS use the transport layer?", o:["TCP always","UDP for ordinary lookups; TCP for zone transfers and large responses","UDP for zone transfers; TCP for lookups","UDP always"], a:1, why:"DNS uses UDP 53 for most queries and TCP 53 for zone transfers and responses too large for UDP."},
  {lvl:1, q:"An engineer must manage a router remotely across an untrusted network. Which protocol and port should be used?", o:["Telnet, TCP 23","SSH, TCP 22","TFTP, UDP 69","HTTP, TCP 80"], a:1, why:"SSH encrypts the session, including the password; Telnet sends everything in clear text."},
  {lvl:1, q:"Which statement about UDP is correct?", o:["It retransmits lost datagrams","It uses a three-way handshake","It has an 8-byte header with ports, length and checksum","It guarantees in-order delivery"], a:2, why:"UDP's header is source port, destination port, length and checksum only — no handshake, ordering or retransmission."},
  {lvl:2, q:"A user connecting to a server on port 8443 gets 'connection refused' immediately. What is the most likely cause?", o:["A firewall is silently dropping the traffic","The server was reached but nothing is listening on 8443","The user has no IP address","DNS has failed"], a:1, why:"'Refused' means an RST came back: the host was reached but no application listens on that port. A silent drop causes a timeout instead."},
  {lvl:1, q:"Two browser tabs on one PC are connected to the same web server on port 443. How does the PC deliver each reply to the right tab?", o:["By the server's IP address","By the destination MAC address","By the different ephemeral source port of each connection","By the TCP window size"], a:2, why:"Each connection has its own client port; replies are addressed to that port, so the 4-tuples are unique."},
  {lvl:1, q:"Which netstat state shows the side that closed a TCP connection first, waiting briefly before discarding it?", o:["LISTENING","SYN_SENT","ESTABLISHED","TIME_WAIT"], a:3, why:"After a normal FIN close, the side that closed first stays in TIME_WAIT so late segments cannot confuse a new connection."},
  {lvl:1, type:"multi", q:"Which three features does TCP provide that UDP does not? (Choose three.)", o:["Source and destination port numbers","Sequence numbers, so data is delivered in order","A checksum over the data","Acknowledgements and retransmission of lost data","Flow control with an advertised window"], a:[1,3,4], why:"Both TCP and UDP carry ports and a checksum — that is nearly all of UDP's 8-byte header. Sequencing, acknowledgements with retransmission, and windowing are what make TCP reliable and connection-oriented."},
  {lvl:1, type:"order", q:"Put the steps of a normal TCP close in order, with the client finishing first.", items:["Client sends FIN","Server sends ACK","Server sends FIN","Client sends ACK","Client waits in TIME_WAIT, then forgets the connection"], why:"A polite close uses one FIN per direction, and each is acknowledged; the server's ACK and FIN often share one segment. The side that closed first holds TIME_WAIT so late segments cannot be mistaken for a new connection. An RST would end the connection at once instead."},
  {lvl:1, type:"match", q:"Match each port to its service.", pairs:[["TCP 22","SSH"],["TCP 23","Telnet"],["UDP 69","TFTP"],["UDP 123","NTP"],["UDP 514","Syslog"],["TCP 3389","RDP"]], why:"SSH 22 replaced Telnet 23 (one lower, encrypted). TFTP 69, NTP 123 and Syslog 514 are short UDP exchanges or one-way messages. RDP is 3389 for Remote Desktop to Windows."},
  {lvl:1, type:"fill", q:"DHCP runs over UDP. Type the port number used by each side.", fields:[{label:"DHCP server", a:["67","UDP 67"]},{label:"DHCP client", a:["68","UDP 68"]}], why:"The server listens on UDP 67 and answers clients on UDP 68. DHCP needs UDP because a client with no IP address yet must broadcast, and TCP's one-to-one connections cannot do that."},
  {lvl:2, q:"This output is from a Windows server, 10.20.1.40. Which statement is correct?", ex:"C:\\> netstat -an\n\nActive Connections\n\n  Proto  Local Address          Foreign Address        State\n  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING\n  TCP    10.20.1.40:3389        10.20.1.77:51022       ESTABLISHED\n  TCP    10.20.1.40:49733       10.20.9.16:443         ESTABLISHED\n  TCP    10.20.1.40:49740       10.20.9.21:8443        SYN_SENT", o:["A user at 10.20.1.77 is connected to this server by Remote Desktop","This server is using Remote Desktop to control 10.20.1.77","The connection to 10.20.9.21:8443 is established and passing data","10.20.9.16 is connecting to this server on port 49733"], a:0, why:"The server LISTENS on 3389 (RDP), and the ESTABLISHED line has 3389 as its local port with 10.20.1.77 on ephemeral port 51022 — so 10.20.1.77 is the RDP client. On 49733 the server is itself a client of 10.20.9.16's HTTPS. SYN_SENT means its SYN to 8443 got no SYN-ACK, so that connection never opened."},
  {lvl:3, q:"A developer says the new stock app on server 10.20.1.40 'is definitely running', but users get 'connection refused' on 10.20.1.40:8080. You run the exhibit on the server. What is wrong?", ex:"C:\\> netstat -an | findstr :8080\n  TCP    127.0.0.1:8080         0.0.0.0:0              LISTENING", o:["The app listens only on the loopback address, so it accepts connections from the server itself but refuses them from the network; it must listen on 0.0.0.0 or 10.20.1.40","A firewall is silently dropping port 8080","The app is using UDP instead of TCP","The server has run out of ephemeral ports"], a:0, why:"A listening socket is an address plus a port. 127.0.0.1 is loopback: only programs on the same machine can reach it. A connection arriving for 10.20.1.40:8080 finds nothing listening on that address, so the server answers with an RST and the user sees 'refused' at once. A firewall drop would give a timeout instead. The developer tested on the server itself, which is why it 'works for them'."},
  {lvl:3, q:"From a branch PC, Test-NetConnection to 10.20.1.40 on port 3389 shows PingSucceeded True and, after about 20 seconds, TcpTestSucceeded False. From a PC in the server room, Remote Desktop to the same server works. What is the most likely cause?", o:["A firewall or ACL between the branch and the server is silently dropping TCP 3389; the RDP service itself is fine","The RDP service on the server is stopped","Remote Desktop on the server listens only on 127.0.0.1","DNS is resolving the server's name to the wrong address"], a:0, why:"The server-room PC proves the service is running and listening on the network. The branch PC proves IP reaches the server, because ping works. What's left is something on the path that lets ICMP through but drops TCP 3389, and the 20-second wait (a timeout, not an instant refusal) says the SYNs are dropped without any reply. Ask the firewall team for a rule from the branch subnet to 10.20.1.40 on TCP 3389. The test used the IP address, so DNS plays no part."},
  {lvl:3, q:"A large file copy to server 10.20.1.40 keeps stalling, and the network team is being blamed. Based on the capture in the exhibit, what is happening?", ex:"No.   Time     Source       Destination  Protocol Length Info\n2210  14.002   10.20.1.40   10.20.9.16   TCP      54     [TCP ZeroWindow] 445 → 50112 [ACK] Seq=1 Ack=8814201 Win=0 Len=0\n2211  14.310   10.20.9.16   10.20.1.40   TCP      55     [TCP ZeroWindowProbe] 50112 → 445 [ACK] Seq=8814201 Ack=1 Win=64240 Len=1\n2212  14.311   10.20.1.40   10.20.9.16   TCP      54     [TCP ZeroWindow] 445 → 50112 [ACK] Seq=1 Ack=8814201 Win=0 Len=0", o:["The server is advertising a receive window of 0: it can't take data as fast as it arrives (often a slow disk or a busy application), so TCP flow control pauses the sender. The network is delivering fine","Packets are being lost on the network and retransmitted","The server is refusing the connection with RST","The copy uses UDP, so it has no flow control"], a:0, why:"Win=0 from the server means 'my receive buffer is full, stop sending'. The client obeys and only sends tiny probes to ask whether the window has reopened. Segments are arriving and being acknowledged promptly, so the path is healthy; the bottleneck is inside the server (its disk, storage or application). Port 445 is SMB file sharing over TCP. Send the capture to the server team with that explanation."},
  {lvl:2, type:"multi", q:"A team building a live voice app chooses UDP for the audio. Which two statements about that choice are true? (Choose two.)", o:["A late audio packet is useless, so waiting for TCP to retransmit it would only add delay","The app must cope with loss and ordering itself, for example with sequence numbers and timestamps in RTP","UDP is faster because routers always forward UDP ahead of TCP","UDP encrypts the audio, so it is more secure","UDP sets up a handshake before the call so that no audio is lost"], a:[0,1], why:"Live audio values timing over completeness: a missing 20 ms of sound is barely heard, but a pause while TCP retransmits is. UDP gives no ordering or recovery, so the application (RTP, with sequence numbers and timestamps) handles that itself. Routers only prefer some traffic if QoS is configured, UDP has no encryption of its own, and UDP has no handshake at all."},
  {lvl:2, type:"fill", q:"A client sends a TCP segment with Seq=5001 carrying 1460 bytes of data, and the server receives it correctly.", fields:[{label:"The acknowledgement number the server sends back", a:["6461"]},{label:"The sequence number of the client's next segment", a:["6461"]}], why:"Sequence numbers count bytes. This segment carries bytes 5001 to 6460, so the server acknowledges 6461, meaning 'I have everything up to 6460, send 6461 next'. The client's next segment starts at that byte, so its Seq is also 6461. If that ACK never arrived, the client would retransmit from 5001."},
  {lvl:2, type:"multi", q:"A new branch firewall must let staff PCs resolve names with the HQ DNS server, keep their clocks in sync with the HQ time server, and let branch switches send logs to the HQ syslog server. Which three rules are needed? (Choose three.)", o:["UDP 53 to the DNS server","UDP 123 to the time server","UDP 514 to the syslog server","TCP 23 to the switches","UDP 69 to the DNS server","TCP 3389 to the syslog server"], a:[0,1,2], why:"DNS lookups use UDP 53 (add TCP 53 for large replies and zone transfers if needed), NTP uses UDP 123 and classic syslog uses UDP 514. Telnet (TCP 23) is clear-text management and not part of the requirement, UDP 69 is TFTP for file transfers, and TCP 3389 is Remote Desktop to Windows machines."},
],
cards:[
  {f:"What does Layer 4 add to IP?", b:"Delivery to the right application using ports (multiplexing) — and, with TCP, reliability, ordering and flow control."},
  {f:"Port ranges", b:"Well-known 0–1023 · Registered 1024–49151 · Dynamic/ephemeral 49152–65535 (Linux default: 32768–60999)."},
  {f:"Socket and 4-tuple", b:"Socket = IP:port (192.168.1.25:52344). A connection = source IP, source port, destination IP, destination port (+ protocol)."},
  {f:"TCP three-way handshake", b:"SYN (seq=x) → SYN-ACK (seq=y, ack=x+1) → ACK (ack=y+1). Then ESTABLISHED."},
  {f:"TCP ACK number means…", b:"The next byte the receiver expects; it confirms everything before it."},
  {f:"TCP window", b:"Bytes the receiver will accept before the sender must wait for an ACK. Zero = pause. This is flow control."},
  {f:"FIN vs RST", b:"FIN: polite close, one per direction (FIN, ACK, FIN, ACK). RST: immediate abort; also the reply when nothing listens ('connection refused')."},
  {f:"UDP in one line", b:"Connectionless, 8-byte header (ports, length, checksum), no handshake, retransmission or ordering."},
  {f:"Why voice/video use UDP", b:"A late packet is useless; retransmission and in-order delivery would cause freezes. Low delay and jitter matter more."},
  {f:"Must-know UDP ports", b:"DNS 53 (also TCP), DHCP 67/68, TFTP 69, NTP 123, SNMP 161/162, Syslog 514."},
  {f:"Must-know TCP ports", b:"FTP 20/21, SSH 22, Telnet 23, SMTP 25, HTTP 80, POP3 110, IMAP 143, HTTPS 443, RDP 3389."},
  {f:"Timed out vs refused", b:"Refused = RST, nothing listening. Timed out = no reply, dropped in the path (usually a firewall). Test with Test-NetConnection host -Port N or nc -vz."},
],
});
// ---------- Lesson 8 ----------
L.push({
id:"net-ios", mins:60, level:"Beginner · hands-on",
t:"Your first Cisco device: the console cable, IOS modes, basic config and saving your work",
html:`
${K.goals([
  "Choose the right way into a device — console, SSH or Telnet — and explain in-band versus out-of-band management.",
  "Connect a laptop to a brand-new switch's console port and set up PuTTY or Tera Term correctly (9600 8N1, no flow control).",
  "Move up and down the IOS mode ladder, and read any prompt to know exactly where you are.",
  "Use ?, Tab, abbreviations, history and <code>do</code> — and read IOS error messages instead of fearing them.",
  "Name a device, protect it with <code>enable secret</code> and a console password, and save your work so it survives a power cut.",
])}
${K.pre([
  "Lesson 1 — you have already typed <code>enable</code> and <code>show ip interface brief</code> once.",
  "Lessons 2 and 3 — what switches and routers do, and RJ45 cables. The console cable is a special case.",
])}

<h2>Why this matters at work</h2>
<p>A courier drops two boxes at a new bank branch in Wuse 2, Abuja: a router and a 24-port switch, still in plastic. The branch opens on Monday. Neither box has an IP address, a password or a name. You cannot log in "over the network" to a device that does not yet know it is on one.</p>
<p>So you do what every network engineer has done thousands of times: plug a small blue cable into the port labelled <b>CONSOLE</b>, open a terminal program and start typing. This lesson is that moment done properly — the cable, the settings, the modes, the first commands, and the one habit (saving) that separates people who finish the job from people who come back next morning to do it again.</p>

<h2>Three ways into a device</h2>
<p>Switches and routers have no screen or keyboard. You manage them from another computer through a ${K.g("CLI","Command-line interface: you type text commands and the device answers in text.")}. There are three classic ways to reach it:</p>
${K.when([
  ["Console", "The device is new, has lost its config, or the network to it is down", "A direct cable — needs no IP address and no configuration", "You need to manage many devices from your desk every day"],
  ["SSH (TCP 22)", "Everyday remote management once the device has an IP address and login settings", "Encrypted, so passwords and config stay private", "The device has no IP yet, or the change you are making could cut your own path"],
  ["Telnet (TCP 23)", "Old labs and legacy kit only", "Simple and supported everywhere", "Any real network — it sends passwords in plain text"],
], "Console, SSH or Telnet?")}
<p>${K.g("SSH","Secure Shell: encrypted remote login on TCP port 22. You will configure it in a later module.")} and ${K.g("Telnet","Old remote login on TCP port 23 that sends everything, passwords included, unencrypted.")} both travel over the network, so they need an IP address, a working interface and login settings. A box straight out of the carton has none, which is why the console is always your first way in.</p>

<h3>In-band and out-of-band</h3>
<p>The second way to sort these methods: does your management traffic share the users' network?</p>
<ul>
<li>${K.g("In-band management","Managing a device over the same network that carries user traffic.")} — SSH across the same LAN the users are on. Convenient, but if the network breaks, so does your way in.</li>
<li>${K.g("Out-of-band management","Managing a device over a separate path that does not depend on the production network.")} — a separate path: the console cable, a dedicated management port, or a <b>console server</b> cabled to every device's console and reached over its own link (sometimes a 4G modem).</li>
</ul>
${K.analogy(`<p>In-band is phoning the security desk on the building's own phone system — fine until the phone system is what's broken. Out-of-band is the guard's personal mobile: a separate line that still works.</p>`)}
${K.check({q:"A switch has just been unboxed with no configuration. Which method can you use to configure it?", o:["SSH to its IP address","Telnet to its IP address","The console port","Any of these"], a:2, why:"SSH and Telnet need an IP address and login settings a factory-fresh device does not have. The console is a direct cable that needs nothing."})}

<h2>The console connection, cable by cable</h2>
<p>The console is a slow, simple ${K.g("serial","Sending data one bit at a time down a wire. Console ports are serial ports.")} link. It is <b>not</b> Ethernet, even though the port usually looks like one. You need four things right: the port, the cable, the adapter and the software settings.</p>
${K.svg("0 0 720 220",
  K.dev("laptop",70,90,"Laptop","PuTTY on COM3")+
  K.box(165,68,130,44,"USB-to-serial","adapter + driver")+
  K.box(350,68,140,44,"Console cable","DB9 ↔ RJ45 rollover",true)+
  K.dev("switch",630,90,"Switch","CONSOLE port")+
  K.link(96,90,165,90,"USB")+K.link(295,90,350,90,"DB9")+K.link(490,90,602,90,"RJ45")+
  K.band(160,150,400,24,"9600 baud · 8 data bits · no parity · 1 stop bit · no flow control")+
  K.txt(360,204,"Newer kit: one USB cable straight into a USB mini-B or USB-C console port",{mid:true}),
  "The classic console path: laptop → USB-to-serial adapter → rollover cable → the device's RJ45 console port.")}
<p><b>The port.</b> Almost every Cisco router and switch has a port labelled <b>CONSOLE</b> (or CON) — usually an <b>RJ45</b> socket, often outlined in light blue. Newer devices add a <b>USB mini-B</b> console port, and some of the newest a <b>USB-C</b> one; these take an ordinary USB cable, though Windows may need Cisco's USB console driver. On many models, plugging in the USB console disables the RJ45 one.</p>
<p><b>The cable.</b> The classic console cable is a ${K.g("rollover cable","A cable whose pins are reversed end to end (1↔8, 2↔7…). Used as the Cisco console cable, not for Ethernet.")}: flat, light blue, RJ45 at one end and a 9-pin <b>DB9</b> serial socket at the other, with the pin order flipped end to end.</p>
<p><b>The adapter.</b> Modern laptops have no DB9 port, so a <b>USB-to-serial adapter</b> sits in between and appears to Windows as a ${K.g("COM port","A numbered serial port in Windows (COM1, COM3…). Your terminal program must open the right one.")}. Many engineers carry a single <b>USB-to-RJ45 console cable</b> with the adapter built in.</p>
<p><b>Finding the COM port.</b> Right-click Start → <b>Device Manager</b> → <b>Ports (COM &amp; ${K.g("LPT","Line Print Terminal: Windows' old name for a parallel printer port. Ignore it — your adapter appears as a COM port.")})</b>, and watch which entry appears when you plug the adapter in:</p>
${K.out(`Ports (COM & LPT)
    Communications Port (COM1)
    USB Serial Port (COM3)`, "Device Manager: the new entry is yours — COM3 here. A yellow triangle means the driver is missing. The number can change with a different USB socket.")}
${K.mistake(`Plugging the console cable into an ordinary Ethernet port instead of CONSOLE. The plug fits, but you see nothing. Read the label before blaming the cable or the software.`)}

<h3>Terminal software and 9600 8N1</h3>
<p>A ${K.g("terminal emulator","A program that sends your keystrokes down a serial line (or SSH session) and shows the replies.")} does the talking: <b>PuTTY</b> and <b>Tera Term</b> are free; <b>SecureCRT</b> is a paid favourite in many companies. All need Cisco's default console settings: speed (${K.g("baud rate","How fast the serial line sends, roughly bits per second. Both ends must match.")}) <b>9600</b>, <b>8</b> data bits, <b>no</b> parity, <b>1</b> stop bit, <b>no</b> flow control.</p>
${K.remember(`<p><b>"9600 8N1, no flow."</b> Say it like a phone number: <i>ninety-six hundred · eight · N · one</i> — 8 data bits, <b>N</b>o parity, 1 stop bit. The only number that ever changes is the speed.</p>`)}
${K.steps([
  ["Connect", `<p>RJ45 into the <b>CONSOLE</b> port, DB9 into the adapter, adapter into the laptop — or one USB console cable.</p>`],
  ["Find the COM number", `<p>Device Manager → Ports (COM &amp; LPT). Note it, for example <b>COM3</b>.</p>`],
  ["Set up PuTTY", `<p><b>Connection type: Serial</b>, <b>Serial line</b> <code>COM3</code>, <b>Speed</b> <code>9600</code>. Under <b>Connection → Serial</b>, set flow control to <b>None</b> (PuTTY defaults to XON/XOFF). Save the session.</p>`],
  ["Open and press Enter", `<p>The window starts blank; the console only talks when spoken to. Press ${K.kbd("Enter")}. You should see <code>Switch&gt;</code> or boot messages.</p>`],
  ["Garbage or nothing?", `<p>Random symbols such as <code>ÿ¥þ</code> mean a speed mismatch — try 9600, or the speed the console was changed to. Nothing at all means the wrong COM port, wrong physical port, missing driver or no power.</p>`],
])}
${K.video({t:"Connecting to a Cisco console with PuTTY", u:"https://www.youtube.com/results?search_query=cisco+console+cable+putty+setup", by:"YouTube search", why:"Watch someone plug in the cable and set up the session before you try it on real kit."})}
${K.check({q:"You connect to a console and see only symbols like <code>ÿ¥þÿ</code>. Most likely cause?", o:["The cable is in an Ethernet port","The terminal speed does not match the console speed","The switch has no IP address","SSH is not enabled"], a:1, why:"Garbled characters mean the two ends use different speeds. A wrong port usually shows nothing at all."})}

<h3>What you see when a device boots</h3>
<p>Briefly: a small ROM program, the ${K.g("bootstrap","A ROM program that runs at power-on, tests the hardware and loads IOS, usually from flash.")}, tests the hardware, loads the IOS image from flash memory, then looks for a saved configuration. A new device has none, so it offers a wizard:</p>
${K.out(`Loading "flash:/<ios-image>.bin"...@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

         --- System Configuration Dialog ---

Would you like to enter the initial configuration dialog? [yes/no]: no


Press RETURN to get started!

Switch>`, "The end of a first boot (trimmed; exact lines vary by model).")}
<ul>
<li><b>Loading … @@@@</b> — IOS being read from flash. Do not unplug anything.</li>
<li><b>Initial configuration dialog — answer no.</b> Engineers configure from the CLI, where they control every command.</li>
<li><b>Press RETURN</b> — press ${K.kbd("Enter")} and you reach <code>Switch&gt;</code>.</li>
</ul>
<p>If you ever see that dialog on a device that was supposed to be configured, it booted with <b>no saved configuration</b>. Hold that thought.</p>
${K.q({type:"order", q:"A factory-fresh switch is powered on. Put what happens in order.", items:["The bootstrap program in ROM runs and tests the hardware","IOS is loaded from flash","IOS looks for a saved startup-config","None is found, so the initial configuration dialog is offered","You answer no, press RETURN and reach Switch>"], why:"Bootstrap, then IOS from flash, then the search for a saved configuration. A new device has none, so it offers the wizard — engineers answer no and configure from the CLI."})}

<h2>The IOS mode ladder</h2>
<p>Cisco ${K.g("IOS","The operating system on most Cisco routers and switches. Newer platforms run IOS XE, with the same CLI and modes.")} splits its CLI into <b>modes</b>, like rungs of a ladder. Each rung lets you do more, and the prompt always tells you which rung you are on.</p>
${K.svg("0 0 720 370",
  K.box(250,30,220,54,"Interface configuration","Switch(config-if)#",true)+
  K.box(250,120,220,54,"Global configuration","Switch(config)#",true)+
  K.box(250,210,220,54,"Privileged EXEC","Switch#")+
  K.box(250,300,220,54,"User EXEC","Switch&gt;")+
  K.arrow(290,298,290,266,"",true)+K.txt(280,287,"enable",{end:true,c:"accent"})+
  K.arrow(290,208,290,176,"",true)+K.txt(280,197,"configure terminal",{end:true,c:"accent"})+
  K.arrow(290,118,290,86,"",true)+K.txt(280,107,"interface g0/1",{end:true,c:"accent"})+
  K.arrow(430,266,430,298)+K.txt(440,287,"disable")+
  K.arrow(430,176,430,208)+K.txt(440,197,"exit")+
  K.arrow(430,86,430,118)+K.txt(440,107,"exit")+
  `<path d="M470,57 C560,57 560,237 472,237" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#karra)"/>`+
  K.txt(552,152,"end or Ctrl+Z",{c:"accent"})+
  K.box(20,120,210,54,"Other sub-modes","(config-line)# (config-vlan)#")+
  K.link(230,147,250,147),
  "The IOS mode ladder. Climb with enable, configure terminal and interface; step down with exit (disable from privileged EXEC). end or Ctrl+Z jumps from any configuration mode to privileged EXEC.")}
<div class="tablewrap"><table>
<tr><th>Mode</th><th>Prompt</th><th>Get there with</th><th>What you can do</th></tr>
<tr><td>User ${K.g("EXEC","Modes where commands run immediately, as opposed to configuration modes, where commands change settings.")}</td><td><code>Switch&gt;</code></td><td>Connecting</td><td>A few harmless commands (<code>ping</code>, basic <code>show</code>); no changes</td></tr>
<tr><td>Privileged EXEC</td><td><code>Switch#</code></td><td><code>enable</code></td><td>Every <code>show</code>, <code>copy</code>, <code>reload</code> — the administrator rung</td></tr>
<tr><td>Global configuration</td><td><code>Switch(config)#</code></td><td><code>configure terminal</code></td><td>Whole-device settings: hostname, passwords, routes</td></tr>
<tr><td>Interface configuration</td><td><code>Switch(config-if)#</code></td><td><code>interface g0/1</code></td><td>Settings for that one port</td></tr>
</table></div>
<p>Global configuration also leads to <b>other sub-modes</b>: <code>line console 0</code> gives <code>(config-line)#</code>, <code>vlan 10</code> gives <code>(config-vlan)#</code>, <code>router ospf 1</code> gives <code>(config-router)#</code>. The word in brackets always tells you what you are configuring. Every configuration command takes effect the moment you press Enter.</p>
<p>To move down: <code>exit</code> goes up one level — interface → global → privileged EXEC (in EXEC mode, <code>exit</code> logs you out); <code>disable</code> drops from # to &gt;; <code>end</code> or ${K.kbd("Ctrl")}+${K.kbd("Z")} jumps from any configuration mode straight to #.</p>
${K.out(`Switch>enable
Switch#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)#interface gigabitethernet0/1
Switch(config-if)#exit
Switch(config)#line console 0
Switch(config-line)#end
Switch#
*Mar  1 00:12:41.303: %SYS-5-CONFIG_I: Configured from console by console
Switch#disable
Switch>`, "A round trip through the modes. Watch the end of each prompt.")}
<p>Note <b>End with CNTL/Z</b> (IOS reminding you of ${K.kbd("Ctrl")}+${K.kbd("Z")}), and the <b>%SYS-5-CONFIG_I</b> log message when you leave configuration mode — engineers search logs for it to see when a device was last changed. The date says <code>Mar 1</code> because the clock has not been set.</p>
${K.remember(`<p>Read the prompt from the right: <b>&gt;</b> look · <b>#</b> admin · <b>(config)</b> change the box · <b>(config-if)</b> change one port. "<b>E</b>nable, <b>C</b>onfigure, <b>I</b>nterface" — climbing the ladder is <b>E-C-I</b>, "easy".</p>`)}
${K.mistake(`Typing a configuration command at the wrong prompt — <code>hostname BRANCH-SW1</code> at <code>Switch#</code>. IOS rejects it and beginners assume the command is wrong. Look at the prompt first.`)}
<p><b>Try it on paper.</b> You are at <code>Switch&gt;</code>. Write the commands to start configuring Gi0/2, then return to <code>Switch#</code> in a single step.</p>
${K.hint(`Three rungs up (E-C-I), then one command that leaves every configuration mode at once.`)}
${K.reveal("Show the answer",`<p><code>enable</code> → <code>configure terminal</code> → <code>interface g0/2</code> → <code>end</code> (or ${K.kbd("Ctrl")}+${K.kbd("Z")}). Two <code>exit</code>s would also work, but <code>end</code> is one step.</p>`)}
${K.check({q:"Your prompt is <code>BRANCH-SW1(config-if)#</code>. Which command takes you directly to <code>BRANCH-SW1#</code>?", o:["exit","disable","end","enable"], a:2, why:"<code>end</code> (or Ctrl+Z) leaves every configuration mode at once. <code>exit</code> only goes up one level, to <code>(config)#</code>."})}

<h2>Letting the CLI help you</h2>
<p>No engineer remembers every command. Experienced people let the CLI tell them.</p>
<h3>Context help with ?</h3>
${K.out(`Switch#co?
configure  connect  copy

Switch#copy running-config ?
  flash:          Copy to flash: file system
  startup-config  Copy to startup configuration
  tftp:           Copy to tftp: file system
  ...

Switch#show ip interface brief ?
  |  Output modifiers
  <cr>`, "Word help (no space before ?) and argument help (space before ?). Trimmed.")}
<ul>
<li><b>co?</b> — no space: <b>word help</b>, "which commands start with co?"</li>
<li><b>copy running-config ?</b> — a space: <b>argument help</b>, "what can come next?"</li>
<li><b>&lt;cr&gt;</b> — the command is complete; you can press Enter.</li>
</ul>
<h3>Tab, abbreviations and history</h3>
<p>Type the start of a command and press ${K.kbd("Tab")}: IOS completes it if only one command matches. IOS also accepts unambiguous <b>abbreviations</b>: <code>en</code>, <code>conf t</code>, <code>sh ip int br</code> (<code>show ip interface brief</code>), <code>sh run</code>, <code>int g0/1</code>, <code>wr</code>. The ${K.kbd("↑")} arrow (or ${K.kbd("Ctrl")}+${K.kbd("P")}) recalls recent commands — the last 10 by default — so you can fix a typo without retyping.</p>
${K.mistake(`Muscle memory with short abbreviations. <code>wr</code> saves your configuration; <code>wr er</code> (<code>write erase</code>) erases the saved configuration. Slow down on anything that writes, erases or reloads, and write commands in full in change plans and scripts — a new IOS version can make an old abbreviation ambiguous.`)}
<h3>Reading error messages</h3>
${K.out(`Switch#co
% Ambiguous command:  "co"

Switch(config)#hostname
% Incomplete command.

Switch(config)#jostname BRANCH-SW1
               ^
% Invalid input detected at '^' marker.`, "The three errors you will see most.")}
<ul>
<li><b>Ambiguous</b> — your abbreviation matches several commands. Type more letters.</li>
<li><b>Incomplete</b> — a real command missing its value. Add a space and <code>?</code>.</li>
<li><b>Invalid input</b> — the ${K.g("caret","The ^ symbol, printed under the point where IOS stopped understanding your command.")} marks the problem: here <code>j</code> for <code>h</code>. You also get this for a correct command in the wrong mode.</li>
</ul>
<h3>The do command</h3>
<p><code>show</code> commands live in privileged EXEC. From any configuration mode, put <code>do</code> in front — <code>do show ip interface brief</code> — and it runs without you leaving the mode.</p>
${K.check({q:"At <code>Switch(config-if)#</code>, how do you check interface status without leaving the mode?", o:["show ip interface brief","do show ip interface brief","exec show ip interface brief","end show ip interface brief"], a:1, why:"<code>do</code> runs an EXEC command from any configuration mode."})}

<h2>Your first configuration: name, passwords, banner</h2>
<p>Every new device gets the same first settings — a <b>baseline</b>. Companies keep a baseline template so every branch switch starts identical.</p>
<p><b>Hostname.</b> Every switch ships called <code>Switch</code>. With six SSH sessions open, a generic name is how you configure the wrong box. <code>hostname BRANCH-SW1</code> changes the prompt instantly — proof it worked. Follow your company's convention (site, role, number), such as <code>ABJ-WUSE-SW1</code>.</p>
<h3>enable password vs enable secret</h3>
<p>Out of the box, anyone with a console cable who types <code>enable</code> gets full control. Two commands lock that rung, and they are not equal:</p>
<div class="tablewrap"><table>
<tr><th></th><th><code>enable password</code></th><th><code>enable secret</code></th></tr>
<tr><td>Stored as</td><td>Plain text (weak type 7 if encryption is on)</td><td>A one-way ${K.g("hash","A scrambled fingerprint that cannot be turned back into the password.")} — type 5, or 8/9 on newer software</td></tr>
<tr><td>If both are set</td><td>Ignored</td><td><b>Wins</b></td></tr>
<tr><td>Use it?</td><td>No — legacy</td><td><b>Always</b></td></tr>
</table></div>
<p>Config files get emailed, pasted into tickets and backed up to shares. A plain-text password inside them is shared with everyone who handles the file; a hash reveals nothing.</p>
<h3>Console password, encryption and banner</h3>
${K.out(`BRANCH-SW1(config)#line console 0
BRANCH-SW1(config-line)#password Con$ole-2026
BRANCH-SW1(config-line)#login
BRANCH-SW1(config-line)#exit
BRANCH-SW1(config)#service password-encryption
BRANCH-SW1(config)#banner motd #
Enter TEXT message.  End with the character '#'.
Authorised access only. All activity is logged.
#`, "Console password, password encryption and a login banner.")}
<ul>
<li><b>line console 0</b> — the one and only console line. <b>password</b> sets it; <b>login</b> tells IOS to ask for it. Without <code>login</code>, the password is never checked — a classic exam trick.</li>
<li><b>service password-encryption</b> — scrambles plain-text passwords in the config to <b>type 7</b>. It stops shoulder-surfing, nothing more: free tools reverse type 7 in a second.</li>
<li><b>banner motd #</b> — a "message of the day" shown before login, ended by the delimiter you chose (here <code>#</code>). Use it for a legal warning; never add IP addresses or "welcome".</li>
</ul>
${K.exam(`Expect questions that mix these up. "Which command stores the privileged password as a hash?" — <code>enable secret</code>, not <code>service password-encryption</code> (that is reversible type 7). "Password set under the console line but never prompted?" — <code>login</code> is missing. And if both enable commands exist, the <b>secret</b> wins.`)}
${K.myth([
  ["<code>service password-encryption</code> makes passwords secure.", "It only applies weak, reversible type 7 scrambling. Real protection is <code>enable secret</code> and, later, usernames with <code>secret</code>."],
  ["Setting a line password is enough to protect the console.", "Without <code>login</code> under the line, IOS never asks for it."],
  ["<code>enable password</code> and <code>enable secret</code> are two names for the same thing.", "The secret is hashed and overrides the password when both exist."],
  ["Changes are saved as soon as you type them.", "They take effect at once, but only in RAM. Nothing survives a reboot until you save."],
])}
${K.tip(`Never put a <code>?</code> in a Cisco password — as you type, IOS treats it as a request for help.`)}
${K.check({q:"A config contains <code>enable password Lagos123</code> and <code>enable secret Abuja456</code>. What do you type after <code>enable</code>?", o:["Lagos123","Abuja456","Either one","Neither"], a:1, why:"When both exist, the enable secret takes priority and the enable password is ignored."})}
${K.q({type:"fill", q:"Type the command for each job (leave out the password itself).", fields:[{label:"Stores the privileged EXEC password as a one-way hash", a:["enable secret"], ios:true},{label:"Global command that scrambles plain-text passwords in the config to type 7", a:["service password-encryption"], ios:true}], why:"enable secret is hashed (type 5, 8 or 9) and wins over enable password. service password-encryption only applies weak, reversible type 7 to passwords such as enable password and line passwords — it does not make them secure."})}

<h2>Running-config vs startup-config: saving your work</h2>
<p>The most important idea in this lesson, and the one that causes the most real-world pain. A Cisco device keeps <b>two</b> configurations:</p>
<div class="tablewrap"><table>
<tr><th></th><th>running-config</th><th>startup-config</th></tr>
<tr><td>Lives in</td><td>${K.g("RAM","Working memory — fast, but emptied when power goes off.")}</td><td>${K.g("NVRAM","Non-volatile RAM: keeps its contents with the power off.")}</td></tr>
<tr><td>What it is</td><td>What the device is using <b>now</b></td><td>What it loads at the <b>next boot</b></td></tr>
<tr><td>Changes when</td><td>Every time you press Enter in config mode</td><td>Only when you save</td></tr>
<tr><td>After power loss</td><td><b>Gone</b></td><td>Still there</td></tr>
<tr><td>View with</td><td><code>show running-config</code></td><td><code>show startup-config</code></td></tr>
</table></div>
<p>(The IOS software itself lives in a third place, <b>flash</b>.) On a reload or power cut, the device empties RAM, boots, and loads NVRAM. If you never saved, that is the factory blank — and the configuration dialog.</p>
${K.analogy(`<p>The running-config is the document open on your screen; the startup-config is the copy saved on disk. Type all afternoon, but if the power goes before you press Save, you reopen the old version. IOS has no auto-save.</p>`)}
${K.out(`BRANCH-SW1#copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
BRANCH-SW1#write memory
Building configuration...
[OK]`, "Two ways to save. Press Enter to accept the default filename in square brackets.")}
<ul>
<li><b>copy running-config startup-config</b> — "copy <i>from</i> running <i>to</i> startup" (<code>copy run start</code>). <b>[OK]</b> means saved.</li>
<li><b>write memory</b> (<code>wr</code>) — the older command; same result.</li>
<li>On a never-saved device, <code>show startup-config</code> replies <code>startup-config is not present</code>. <code>reload</code> with unsaved changes warns <i>"System configuration has been modified. Save?"</i> — a power cut gives no warning.</li>
</ul>
${K.dyk(`<p>Cisco engineers use "not saving" deliberately. Before a risky remote change they type <code>reload in 10</code>, then make the change <i>without</i> saving. If it locks them out, ten minutes later the device reboots to the last saved config and comes back. If it works, <code>reload cancel</code>, then save. RAM that forgets is a safety net.</p>`)}
${K.dodont([
  "Save after every change that works, then confirm with <code>show startup-config</code>.",
  "Keep the commands you typed in a text file or the ticket.",
  "Use <code>enable secret</code> and a console password with <code>login</code> on every device.",
  "Name every device before anything else.",
],[
  "Walk away from a working change without saving it.",
  "Answer yes to the initial configuration dialog on production kit.",
  "Use Telnet or <code>enable password</code> on a real network.",
  "Rush abbreviations for commands that erase or reload.",
])}
${K.check({q:"You set a hostname and a description, then the power fails before you type anything else. What does the switch boot with?", o:["Everything you typed — IOS saves automatically","Only the hostname","Whatever was last saved to the startup-config in NVRAM","Nothing — flash is erased too"], a:2, why:"Changes live in the running-config in RAM, which is lost. At boot the device loads the startup-config from NVRAM. Flash, with IOS, is unaffected."})}

<h3>Hands-on: baseline a fresh switch</h3>
<p>One difference from real kit: real Catalyst switch ports are enabled out of the box (router interfaces start shut down). This lab switch's ports start shut down, as some company baselines do for unused ports, so you will bring Gi0/1 up yourself.</p>
${K.term({env:"ios", title:"baseline a fresh branch switch", opts:{kind:"switch"},
  intro:"A factory-fresh switch. The lab supports this lesson's commands except <code>line console</code>, <code>service password-encryption</code> and <code>banner</code>; its <code>?</code> shows short hints, and <code>description</code> must be typed in full.",
  tasks:[
    {text:"Reach privileged EXEC — the prompt ends in <code>#</code>", done:e=>e.mode!=="user" || e.history.some(h=>/^\s*en(a|ab|abl|able)?\s*$/i.test(h))},
    {text:"Reach global configuration — the prompt shows <code>(config)#</code>", done:e=>e.mode.indexOf("config")===0 || e.history.some(h=>/^\s*conf(i|ig|igu|igur|igure)?\s+t/i.test(h))},
    {text:"Name the switch <code>BRANCH-SW1</code>", done:e=>e.host==="BRANCH-SW1"},
    {text:"Set an enable secret (any password)", done:e=>!!e.enableSecret},
    {text:"Give <code>GigabitEthernet0/1</code> a description such as <code>Uplink to BRANCH-RTR1</code>", done:e=>!!e.intfs["GigabitEthernet0/1"].desc},
    {text:"Bring Gi0/1 up", done:e=>e.intfs["GigabitEthernet0/1"].shut===false},
    {text:"Return to privileged EXEC and save the configuration", done:e=>!!e.savedOnce},
  ],
  win:"A real baseline: named, secured, documented and saved. Run <code>show startup-config</code> — your work would survive a power cut.",
  solve:["enable","configure terminal","hostname BRANCH-SW1","enable secret Cl4ss-Abuja","interface g0/1","description Uplink to BRANCH-RTR1","no shutdown","end","copy running-config startup-config"]})}
${K.hint(`Climb E-C-I: <code>enable</code>, <code>conf t</code>, then <code>hostname</code> and <code>enable secret</code> at <code>(config)#</code>. <code>int g0/1</code> for the port, where <code>description …</code> and <code>no shutdown</code> go. Finish with <code>end</code> and <code>copy run start</code>.`)}
${K.reveal("Show the full solution",`<p><code>enable</code> · <code>configure terminal</code> · <code>hostname BRANCH-SW1</code> · <code>enable secret Cl4ss-Abuja</code> · <code>interface g0/1</code> · <code>description Uplink to BRANCH-RTR1</code> · <code>no shutdown</code> · <code>end</code> · <code>copy running-config startup-config</code></p><p>Then compare <code>show running-config</code> and <code>show startup-config</code>. In the lab Gi0/1 comes straight up; on a real switch it stays down until a cable is connected.</p>`)}

${K.job("Day one at a new branch in Abuja — and the morning after",`
<p><b>Day one.</b> At the Wuse 2 branch you rack the switch on the UPS, connect your USB console cable and open PuTTY on COM4. Garbage characters: your saved session was still at 115200 from another job. At 9600 you see the boot finish; you answer <code>no</code> to the dialog, apply the company baseline, save, and confirm with <code>show startup-config</code>. At 5pm your colleague Emeka arrives to configure the uplinks to the router and the ISP handover.</p>
<p><b>The symptom.</b> 8:10am next day, the branch manager: <i>"Nothing works — no printing, no banking app, no internet. NEPA took light last night and the generator didn't come on."</i></p>
<p><b>Your questions.</b> "Every desk?" — <i>Yes.</i> "Are the switch lights on?" — <i>Yes, blinking.</i> Everyone affected, switch powered, and an overnight power cut as the obvious "what changed".</p>
<p><b>The checks.</b> SSH to the switch fails — itself a clue. On site, on the console, the prompt is <code>ABJ-WUSE-SW1&gt;</code>: your saved baseline survived. <code>show version</code>: uptime 5 hours — it rebooted when the UPS ran flat. <code>show running-config</code>: none of Emeka's uplink lines. Emeka on the phone: <i>"It all worked… I was going to save in the morning."</i></p>
<p><b>The fix.</b> Emeka kept his commands in a text file (good). You paste them in, check the uplinks with <code>show ip interface brief</code>, confirm a teller PC reaches the banking app, then <code>copy running-config startup-config</code> and check <code>show startup-config</code> includes the uplinks.</p>
<p><b>What you say.</b> To the manager: "You're back up. The switch restarted when the backup power ran out, and settings added yesterday evening hadn't been saved permanently. They are now. We'll ask Facilities to check the generator." To Emeka, privately and calmly: "Working isn't finished. Save every time — <code>wr</code> takes one second."</p>
<p><b>Ticket note.</b> <i>"Branch-wide outage 08:10. Switch ABJ-WUSE-SW1 rebooted ~03:00 after UPS depletion (generator failed to start). Uplink config added 17:30 previous day was never saved, so lost on reboot. Re-applied from engineer's notes via console, verified uplinks up and core banking reachable from teller PC, saved and confirmed in startup-config. Resolved 09:25. Follow-ups: Facilities to check generator auto-start; add 'save and verify startup-config' to branch build checklist."</i></p>`)}

<h2>Hands-on: console into a brand-new router</h2>
<p>This is the whole lesson in one task. A new branch router has arrived. Its LAN port is already cabled to the branch switch and a PC, but the router is unconfigured and every interface is down. Plug in your console cable, get the serial settings right, configure the LAN interface and prove the PC can reach its gateway.</p>
${K.bench({id:"m1-branch-console", points:80, from:"CCNA · Module 1 · lesson 8", title:"day one at the Abuja branch", viewBox:"0 0 760 400",
  intro:"Tray → <b>Console</b> cable → click the laptop's <b>USB</b> port, then the router's light-blue <b>CON</b> port. Then open <b>Terminal app (PuTTY)</b> under the laptop. Try the wrong speed first if you're curious.",
  devices:[
    {id:"rtr", kind:"router", label:"ROUTER", model:"ISR 1100 · new, unconfigured", x:290, y:24},
    {id:"sw", kind:"switch", label:"BRANCH-SW", model:"Catalyst 9200", x:330, y:180},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:40, y:120},
    {id:"pc1", kind:"pc", label:"TELLER-PC", x:620, y:290, ip:"192.168.50.10", mask:"255.255.255.0", gw:"192.168.50.1"},
  ],
  cables:[ {type:"cat6", a:"rtr:g0", b:"sw:g8"}, {type:"cat6", a:"pc1:eth", b:"sw:g2"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Connect the console cable: laptop <b>USB</b> → router <b>CON</b>", done:B=>Bench.linked(B,"lap:usb","rtr:con")},
    {text:"Open PuTTY with the correct serial settings and reach the router's prompt", done:B=>Bench.consoleOk(B,"rtr")},
    {text:"Set the hostname to <code>BR-RTR1</code>", done:B=>B.devs.rtr.env.host==="BR-RTR1"},
    {text:"Give G0/0 the address <code>192.168.50.1 255.255.255.0</code> and bring it up — watch its light turn green", done:B=>{ const i=B.devs.rtr.env.intfs["GigabitEthernet0/0"]; return i.ip==="192.168.50.1" && i.mask==="255.255.255.0" && Bench.upAt(B,"rtr:g0"); }},
    {text:"Save the configuration so it survives a power cut", done:B=>B.devs.rtr.env.savedOnce},
    {text:"From TELLER-PC, <code>ping 192.168.50.1</code> — the PC can now reach its default gateway", done:B=>Bench.pinged(B,"pc1","192.168.50.1")},
  ],
  win:"Console cable, 9600 8N1, configure, verify, save — you've just done the first hour of a real branch deployment.",
  solve:[["plug","console","lap:usb","rtr:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","configure terminal"],["term","hostname BR-RTR1"],["term","interface g0/0"],["term","ip address 192.168.50.1 255.255.255.0"],["term","no shutdown"],["term","end"],["term","copy running-config startup-config"],["term",""],["pc","pc1","ping 192.168.50.1"]]})}
${K.hint("Garbled characters in PuTTY mean the serial settings don't match: Cisco consoles default to <b>9600</b> baud, <b>8</b> data bits, <b>no</b> parity, <b>1</b> stop bit, <b>no</b> flow control. Close the session, fix the settings and open it again.")}

<h2>Module 1 challenge: the branch that won't work</h2>
<p>Monday, 08:00, the new Ikeja branch. The installers finished on Saturday and signed everything off as "tested". The doors open at 09:00, and five complaints are already waiting for you.</p>
<p>This time there are no steps. Everything you need is from Module 1: reading port lights and clicking ports to see why a link is down, checking cable types and optics, <code>ipconfig</code> and <code>ping</code> on the PCs, and a console session into the router with <code>show ip interface brief</code>. Work out what is broken, fix it, and prove it with a ping from the user's own PC. There is more than one fault, and some complaints have the same cause underneath.</p>
${K.bench({id:"m1-challenge", points:120, from:"CCNA · Module 1 challenge", challenge:true, title:"the branch that won't work", viewBox:"0 0 760 560",
  intro:"Build sheet: branch LAN 192.168.60.0 /24, gateway 192.168.60.1 (BR-RTR1 G0/0). Core banking server 10.60.0.10 /24 on BR-RTR1 G0/1 (10.60.0.1). Router console password <code>Ikeja-con1</code>, enable secret <code>Ikeja-en1</code>. FL2-SW is an older switch moved here from another branch. Click any port to inspect it.",
  devices:[
    {id:"rtr", kind:"router", label:"BR-RTR1", model:"ISR 1100 · branch router", x:20, y:20, config: env => { env.exec("en"); env.exec("conf t"); env.exec("hostname BR-RTR1"); env.exec("enable secret Ikeja-en1"); env.exec("line console 0"); env.exec("password Ikeja-con1"); env.exec("login"); env.exec("interface g0/0"); env.exec("description BRANCH-LAN"); env.exec("ip address 192.168.60.1 255.255.255.0"); env.exec("no shutdown"); env.exec("interface g0/1"); env.exec("description CORE-BANKING-SERVER"); env.exec("ip address 10.60.0.1 255.255.255.0"); env.exec("shutdown"); env.exec("end"); }},
    {id:"srv", kind:"server", label:"CORE-BANKING", x:280, y:12, ip:"10.60.0.10", mask:"255.255.255.0", gw:"10.60.0.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:620, y:12},
    {id:"pc2", kind:"pc", label:"CSO-PC", x:40, y:150, ip:"192.168.60.12", mask:"255.255.255.0", gw:"192.168.60.254"},
    {id:"core", kind:"switch", label:"CORE-SW", model:"Catalyst 9200 · comms room", x:320, y:160, sfp:{g9:"sfp-lx", g10:"sfp-lx"}},
    {id:"fl1", kind:"switch", label:"FL1-SW", model:"Catalyst 9200 · ground floor", x:20, y:300, sfp:{g9:"sfp-sx"}},
    {id:"pc1", kind:"pc", label:"TELLER-1", x:520, y:290, ip:"192.168.60.11", mask:"255.255.255.0", gw:"192.168.60.1"},
    {id:"fl2", kind:"switch", label:"FL2-SW", model:"Catalyst 2960 · floor 2 · older model", x:320, y:440, sfp:{g10:"sfp-lx"}, mdix:false},
    {id:"pc3", kind:"pc", label:"LOANS-PC", x:20, y:440, ip:"192.168.60.21", mask:"255.255.255.0", gw:"192.168.60.1"},
    {id:"pc4", kind:"pc", label:"MANAGER-PC", x:160, y:440, ip:"192.168.60.22", mask:"255.255.255.0", gw:"192.168.60.1", mdix:false},
  ],
  cables:[
    {type:"cat6", a:"rtr:g0", b:"core:g8"}, {type:"cat6", a:"srv:eth", b:"rtr:g1"}, {type:"cat6", a:"pc2:eth", b:"core:g1"},
    {type:"mmf", a:"fl1:g9", b:"core:g9"}, {type:"cat6", a:"pc1:eth", b:"fl1:g1"},
    {type:"smf", a:"fl2:g10", b:"core:g10", swapped:true}, {type:"cat6", a:"pc3:eth", b:"fl2:g2"}, {type:"xover", a:"pc4:eth", b:"fl2:g3"},
  ],
  tray:["console","cat6","xover","mmf","smf","sfp-sx","sfp-lx"],
  tasks:[
    {text:"<b>Whole branch:</b> “The banking app on 10.60.0.10 is down for everyone.” Even CSO-PC, which can ping the router at 192.168.60.1, gets nothing back from the server.", hint:"The server hangs off the router, not a switch. Console into BR-RTR1 (passwords are on the build sheet) and run show ip interface brief. Read the Status column for the interface that faces the server.", done:B=>Bench.upAt(B,"srv:eth")},
    {text:"<b>TELLER-1, ground floor:</b> “Nothing works. I can't even ping the gateway.” Prove TELLER-1 reaches the banking server.", hint:"The PC's settings match the build sheet, so follow the path up. FL1-SW's uplink to CORE-SW is dark: click the port at each end and compare the transceivers with each other and with the cable between them.", done:B=>Bench.pinged(B,"pc1","10.60.0.10")},
    {text:"<b>CSO-PC, customer service desk:</b> “Other people's banking app came back, but mine still says the server can't be reached.” Prove CSO-PC reaches the banking server.", hint:"One PC, local works, remote doesn't. Run ipconfig on CSO-PC and compare every line with the build sheet.", done:B=>Bench.pinged(B,"pc2","10.60.0.10")},
    {text:"<b>LOANS-PC, floor 2:</b> “The whole floor has been dead since the cabling contractor ‘tidied up’ the comms room on Saturday.” Prove LOANS-PC reaches the banking server.", hint:"Both ends of the floor 2 uplink have LX optics on yellow single-mode fibre, which is correct. So why is no light received? Click the port and read what it says.", done:B=>Bench.pinged(B,"pc3","10.60.0.10")},
    {text:"<b>MANAGER-PC, floor 2:</b> “My PC says ‘Network cable unplugged’, and the installer already swapped in a new cable from his van.” Prove MANAGER-PC reaches the banking server.", hint:"Click the port and look at which cable the installer used. FL2-SW and the manager's old desktop both lack Auto MDI-X, so the cable type matters again: what does a PC-to-switch link need?", done:B=>Bench.pinged(B,"pc4","10.60.0.10")},
  ],
  win:"Five faults, five layers of evidence: a shut router interface, mismatched optics, a wrong gateway, swapped fibre polarity and the wrong copper cable. That is a real handover day, and you proved every fix from the user's own PC.",
  solve:[
    ["plug","console","lap:usb","rtr:con"], ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],
    ["term","Ikeja-con1"], ["term","enable"], ["term","Ikeja-en1"], ["term","show ip interface brief"],
    ["term","configure terminal"], ["term","interface g0/1"], ["term","no shutdown"], ["term","end"], ["term","write memory"],
    ["unplug","fl1:g9"], ["remove","core:g9"], ["insert","core:g9","sfp-sx"], ["plug","mmf","fl1:g9","core:g9"],
    ["pc","pc2","ipconfig"], ["ip","pc2","192.168.60.12","255.255.255.0","192.168.60.1"],
    ["flip","fl2:g10"],
    ["unplug","pc4:eth"], ["plug","cat6","pc4:eth","fl2:g3"],
    ["pc","pc1","ping 10.60.0.10"], ["pc","pc2","ping 10.60.0.10"], ["pc","pc3","ping 10.60.0.10"], ["pc","pc4","ping 10.60.0.10"],
  ]})}
${K.reveal("Instructor walkthrough: the five faults, how to find them, and the fixes", `<p><b>Start with the complaint that hits everyone.</b> One fault that affects the whole branch is worth more than four that affect one person each, and it may be hiding the others.</p>
<p><b>Fault 1: BR-RTR1 G0/1 was left shut down.</b> <i>How to find it:</i> CSO-PC can ping the gateway 192.168.60.1, so the LAN and the router's LAN side work, yet nobody reaches the server, and the server's link light is dark. Console in (USB to CON, 9600 8N1, no flow control, console password, then <code>enable</code> with the secret) and run <code>show ip interface brief</code>: G0/1 shows <code>administratively down down</code>. <i>Fix:</i> <code>configure terminal</code>, <code>interface g0/1</code>, <code>no shutdown</code>, <code>end</code>, then save with <code>write memory</code>. The bench can't check the save, but on a real router an unsaved fix disappears at the next power cut.</p>
<p><b>Fault 2: mismatched optics on the ground-floor uplink.</b> <i>How to find it:</i> TELLER-1's settings are correct but it can't even ping the gateway, so the break is between FL1-SW and the core. Clicking either end of the uplink shows an SX (multimode, 850 nm) module in FL1-SW and an LX (single-mode, 1310 nm) module in CORE-SW, on aqua multimode fibre. <i>Fix:</i> unplug the fibre, swap the core's module for an SX, and plug the fibre back in. Fitting LX at both ends would mean also replacing the cable with single-mode; inside one building the multimode run and SX optics are the right choice.</p>
<p><b>Fault 3: CSO-PC has the wrong default gateway.</b> <i>How to find it:</i> once the router is fixed everyone else works, so the fault is on that one PC. <code>ipconfig</code> shows the gateway as 192.168.60.254, an address nothing owns; pinging the server gives <code>Destination host unreachable</code> from the PC itself, because its ARP for .254 gets no reply. This is also why it could still ping 192.168.60.1: that address is on its own network, so the gateway is never used. <i>Fix:</i> set the gateway to 192.168.60.1 from the build sheet.</p>
<p><b>Fault 4: Tx and Rx swapped on the floor 2 uplink.</b> <i>How to find it:</i> the optics match each other and the yellow single-mode fibre, so this is not a parts problem. The port inspector says no light is received: transmit is facing transmit. The contractor re-patched the LC connectors the wrong way round. <i>Fix:</i> flip the LC duplex connector at <b>one</b> end only. Flipping both ends puts you back where you started.</p>
<p><b>Fault 5: a crossover cable on a switch and PC without Auto MDI-X.</b> <i>How to find it:</i> LOANS-PC on the same switch works once the uplink is fixed, so FL2-SW is fine, but the manager's port stays dark. The inspector shows an orange crossover cable. FL2-SW is an older switch and the manager's desktop is old too, and neither swaps pairs automatically. A switch-to-PC link needs straight-through. The installer's "new cable" was a different cable, but the wrong type again. <i>Fix:</i> replace it with a straight-through Cat6 patch lead.</p>
<p><b>What you write in the ticket.</b> <i>"Ikeja branch handover faults, 08:00 to 08:50. (1) BR-RTR1 G0/1 to core banking server was administratively down: no shutdown, saved. (2) FL1-SW to CORE-SW uplink: LX optic in CORE-SW Gi0/9 on multimode fibre, replaced with SX. (3) CSO-PC gateway mistyped as .254, corrected to .1. (4) FL2 uplink LC polarity reversed after Saturday's re-patch, corrected at the FL2 end. (5) MANAGER-PC on a crossover lead to FL2-SW (no Auto MDI-X), replaced with straight-through. All five users verified by ping to 10.60.0.10 from their own PCs. Follow-ups: add 'verify every port light and test from every desk' to the installer sign-off; label patch leads by type; plan to replace FL2-SW."</i></p>
<p><b>The habit to take away:</b> scope first (who is affected?), then follow the path from the user outwards, one layer at a time, and prove each fix with the user's own traffic rather than "the light is green now".</p>`)}

<h2>Interview corner</h2>
${K.reveal("“What is the difference between the running-config and the startup-config?”",`<p>"The running-config is the active configuration in RAM — every config command changes it immediately. The startup-config is in NVRAM and is loaded at boot. Changes are lost on a reload or power failure unless I save with <code>copy running-config startup-config</code> or <code>write memory</code>. I check for unsaved changes by comparing <code>show running-config</code> with <code>show startup-config</code>." Bonus: mention the <code>reload in</code> safety net.</p>`)}
${K.reveal("“What is the difference between enable password and enable secret?”",`<p>"Both protect privileged EXEC. <code>enable password</code> is plain text, or reversible type 7 with <code>service password-encryption</code>. <code>enable secret</code> is a one-way hash — type 5, or 8/9 on newer software — and takes priority if both are set. Best practice is to configure only the secret."</p>`)}
${K.reveal("“How would you connect to a brand-new switch with no configuration?”",`<p>"Through the console, because SSH and Telnet need an IP address it doesn't have. Rollover cable with a USB-to-serial adapter, or a USB console cable; find the COM port in Device Manager; PuTTY or Tera Term at 9600 baud, 8N1, no flow control. I answer no to the initial configuration dialog, set the hostname, enable secret and console password with <code>login</code>, then save."</p>`)}

${K.recap([
  "Console is out-of-band and needs no configuration; SSH (TCP 22, encrypted) and Telnet (TCP 23, plain text) are usually in-band and need an IP address.",
  "Laptop → USB-to-serial adapter → rollover cable → RJ45 CONSOLE port (or a USB mini-B / USB-C console). Find the COM port in Device Manager.",
  "9600 baud, 8 data bits, no parity, 1 stop bit, no flow control. Garbage on screen means a speed mismatch. Answer no to the initial configuration dialog.",
  "User EXEC &gt; → enable → privileged # → configure terminal → (config)# → interface → (config-if)#. exit goes up one level; end or Ctrl+Z goes straight to #.",
  "?, Tab, abbreviations, history and do make the CLI tell you what you need; the ^ marks where a command went wrong.",
  "Use enable secret (hashed), not enable password. A line password needs login. service password-encryption is only weak type 7.",
  "running-config is in RAM and lost on reboot; startup-config is in NVRAM. Save with copy running-config startup-config (or write memory) — every time.",
])}
${K.next(`<b>That completes Module 1 — How networks work.</b> <b>Module 2 — Ethernet switching in depth</b> picks up where this lesson stops: what happens inside the switch you just configured — Ethernet frames, how it learns MAC addresses into its MAC address table, and how it decides where every frame goes.`)}
`,
quiz:[
  {lvl:1, q:"Which management method does NOT require the device to have an IP address?", o:["SSH","Telnet","Console","HTTPS web interface"], a:2, why:"The console is a direct serial cable to the device, so it works on a factory-fresh device. SSH, Telnet and web access all travel over the network and need an IP address."},
  {lvl:1, q:"What are the default terminal settings for a Cisco console connection?", o:["115200 baud, 8 data bits, even parity, 2 stop bits, hardware flow control","9600 baud, 8 data bits, no parity, 1 stop bit, no flow control","9600 baud, 7 data bits, odd parity, 1 stop bit, XON/XOFF","19200 baud, 8 data bits, no parity, 1 stop bit, no flow control"], a:1, why:"Cisco consoles default to 9600 8N1 with no flow control."},
  {lvl:1, q:"Which cable is traditionally used to connect a PC's serial port to a Cisco RJ45 console port?", o:["Straight-through Ethernet cable","Crossover cable","Rollover cable","Fibre patch cable"], a:2, why:"The console cable is a rollover cable — its pins are reversed end to end (1 to 8, 2 to 7, …). It is not used for Ethernet."},
  {lvl:1, q:"Which prompt shows that you are in global configuration mode?", o:["Switch>","Switch#","Switch(config)#","Switch(config-if)#"], a:2, why:"> is user EXEC, # is privileged EXEC, (config)# is global configuration and (config-if)# is interface configuration."},
  {lvl:1, q:"You are in interface configuration mode. Which command or key returns you directly to privileged EXEC mode?", o:["exit","disable","end (or Ctrl+Z)","logout"], a:2, why:"end or Ctrl+Z leaves all configuration modes at once. exit only goes up one level, to global configuration."},
  {lvl:1, q:"An engineer types co and presses Enter in privileged EXEC mode. What does IOS reply?", o:["It runs configure terminal","It runs copy","% Ambiguous command","% Incomplete command."], a:2, why:"Several commands start with 'co' (configure, connect, copy), so IOS refuses to guess and reports an ambiguous command."},
  {lvl:1, q:"From global configuration mode, which command displays the interface summary without leaving the mode?", o:["show ip interface brief","do show ip interface brief","exec show ip interface brief","end show ip interface brief"], a:1, why:"The do prefix runs an EXEC-mode command from any configuration mode."},
  {lvl:2, q:"A router has both enable password and enable secret configured with different values. Which one is required to enter privileged EXEC?", o:["The enable password","The enable secret","Either","Both, one after the other"], a:1, why:"enable secret takes precedence over enable password when both are configured. It is also stored as a hash, which is why it is the one to use."},
  {lvl:2, q:"An administrator configures password Cisco1 under line console 0 but is never asked for a password on the console. What is missing?", o:["service password-encryption","enable secret","The login command under the line","banner motd"], a:2, why:"The login command tells IOS to check the line password. Without it the password is configured but never requested."},
  {lvl:1, q:"Changes are made to a switch, then it loses power before anything is saved. Which configuration does the switch use when it boots?", o:["The running-config from RAM","The startup-config from NVRAM","The IOS image's default config from flash, with the changes merged in","The last config that was displayed with show running-config"], a:1, why:"RAM (running-config) is lost on power failure. At boot, IOS loads the startup-config from NVRAM — whatever was last saved."},
  {lvl:1, type:"multi", q:"Which two commands save the running configuration so it survives a reload or power cut? (Choose two.)", o:["show startup-config","copy running-config startup-config","copy startup-config running-config","write memory","write erase"], a:[1,3], why:"copy running-config startup-config and the older write memory (wr) both copy RAM to NVRAM. show startup-config only displays the saved copy, copying startup to running goes the wrong way, and write erase deletes the saved configuration."},
  {lvl:1, type:"order", q:"Put the commands in order to rename a factory-fresh switch, starting at Switch>, and make the change permanent.", items:["enable","configure terminal","hostname BRANCH-SW1","end","copy running-config startup-config"], why:"Climb E-C: enable to reach #, configure terminal to reach (config)#, where hostname belongs. end returns to privileged EXEC, where copy running-config startup-config saves the change to NVRAM."},
  {lvl:1, type:"match", q:"Match each prompt to its IOS mode.", pairs:[["Switch>","User EXEC"],["Switch#","Privileged EXEC"],["Switch(config)#","Global configuration"],["Switch(config-if)#","Interface configuration"],["Switch(config-line)#","Line configuration"],["Switch(config-vlan)#","VLAN configuration"]], why:"Read the prompt from the right: > is user EXEC, # is privileged EXEC, and the word in brackets names what you are configuring — the whole device, one interface, a line such as line console 0, or a VLAN."},
  {lvl:1, type:"fill", q:"From privileged EXEC (Switch#), type the command that enters global configuration mode.", fields:[{label:"", a:["configure terminal"], ios:true}], why:"configure terminal (usually typed conf t) moves from Switch# to Switch(config)#. IOS accepts any abbreviation that matches only one command; write it in full in change plans and scripts."},
  {lvl:2, q:"An engineer types the command in the exhibit and gets an error. What is the cause?", ex:"BRANCH-SW1#hostname ABJ-WUSE-SW1\n           ^\n% Invalid input detected at '^' marker.", o:["hostname is a global configuration command, so configure terminal must be entered first","Hostnames cannot contain hyphens","The command must be abbreviated to host","An enable secret must be set before the hostname can change"], a:0, why:"The # prompt with no (config) means privileged EXEC, where hostname is not a valid command, so the caret points at its first letter. Invalid input is reported for a typo or for a correct command in the wrong mode. Hyphens are fine in hostnames."},
  {lvl:3, q:"You must change the uplink on a branch switch 500 km away, over SSH. If you get it wrong you will lose your connection, and nobody on site can help. What is the safest way to work?", o:["Save the working config, schedule reload in 10, make the change and check it; if you are cut off, the switch reloads into the saved working config; if it works, reload cancel, then save","Make the change and save it immediately, so it can't be lost","Use Telnet instead of SSH, because it reconnects faster","Erase the startup-config first, so the switch boots clean if anything goes wrong"], a:0, why:"reload in 10 sets a timer that restarts the switch in 10 minutes unless you cancel it. Because the startup-config still holds the last working config, a mistake that locks you out undoes itself. Saving the change straight away would make a mistake permanent; Telnet changes nothing except making the session insecure; and erasing the startup-config would bring the switch back with no config at all, unreachable, 500 km away. Only save after the change is confirmed and the reload is cancelled."},
  {lvl:3, type:"multi", q:"An auditor reviews the exhibit from a branch router and asks you to fix the two most serious weaknesses. Which two? (Choose two.)", ex:"BR-RTR1#show running-config\n...\nservice password-encryption\n!\nhostname BR-RTR1\n!\nenable password 7 0822455D0A16\n!\nline con 0\n password 7 02050D480809\n login\nline vty 0 4\n password 7 104D000A0618\n login\n transport input telnet\n!\nend", o:["Replace enable password with enable secret, because type 7 can be reversed in seconds","Use SSH instead of Telnet on the VTY (virtual terminal) lines that remote logins use (transport input ssh), because Telnet sends the passwords in clear text","Remove login from the console line","Turn off service password-encryption, because it hides the passwords from engineers","Change the hostname so attackers can't tell which router it is"], a:[0,1], why:"Type 7 is only scrambling: free tools reverse it instantly, so the privileged password is effectively in plain text in every backup of this config, while enable secret stores a one-way hash. Telnet is worse: every keystroke, passwords included, crosses the network readable by anyone capturing. Removing login would drop the console password altogether, and service password-encryption at least stops shoulder-surfing, so keep it."},
  {lvl:3, q:"A bank's 30 branch routers are managed over SSH across the WAN. When a branch's WAN link fails, engineers can't reach its router to fix it. Which design gives them a way in during the outage?", o:["Out-of-band management: a console server or a 4G router at each branch, connected to the routers' console ports","Allow Telnet as well as SSH on the VTY lines","Configure more VTY lines with line vty 0 15","Create a second SSH username on each router"], a:0, why:"SSH and Telnet are in-band: they travel over the same network that has just failed. Out-of-band access uses a separate path, for example a console server reached over a 4G modem and cabled to the console ports, so it works even when the router has no WAN and no IP connectivity at all. More lines, more users or adding Telnet all still depend on the broken WAN."},
  {lvl:2, type:"fill", q:"You mistype shwo at the BR-SW1# prompt and the console freezes for about 30 seconds showing Translating \"shwo\"...domain server (255.255.255.255). Type the global configuration command that stops IOS doing this.", fields:[{label:"", a:["no ip domain-lookup","no ip domain lookup"], ios:true}], why:"IOS treats an unknown word at the EXEC prompt as the name of a host to Telnet to, and tries to resolve it with DNS, broadcasting the query when no DNS server is set. no ip domain-lookup (newer IOS also accepts no ip domain lookup) turns that off. It is in many lab and branch build templates; in production some teams instead point the device at a real DNS server."},
  {lvl:2, type:"match", q:"Match each IOS message with what it means.", pairs:[["% Invalid input detected at '^' marker.","A typo, or a correct command typed in the wrong mode"],["% Incomplete command.","The command needs more keywords or values"],["% Ambiguous command: \"co\"","The abbreviation matches more than one command"],["Translating \"shwo\"...domain server","IOS took an unknown word for a hostname and is looking it up"]], why:"Each message tells you what to do next. Invalid input: check the spelling and the prompt (the caret points to where IOS stopped understanding). Incomplete: add the missing part, and ? will list the options. Ambiguous: type more letters. Translating: you mistyped at the EXEC prompt; wait, or press Ctrl+Shift+6 to abort, and add no ip domain-lookup."},
  {lvl:2, q:"On a switch delivered yesterday, you see the output in the exhibit. What does it tell you?", ex:"Switch#show startup-config\nstartup-config is not present", o:["Nothing has ever been saved to NVRAM: if the switch reloads now, it boots with factory defaults and the initial configuration dialog, whatever has been configured since","The running-config has been deleted","The switch's flash has failed and IOS is missing","The command is only valid in global configuration mode"], a:0, why:"The startup-config lives in NVRAM and is created the first time someone saves. 'Not present' means nobody has run copy running-config startup-config (or write memory) yet. Whatever the running-config holds now is in RAM only and would be lost on a reload. IOS itself lives in flash and is unaffected."},
],
cards:[
  {f:"Console vs SSH vs Telnet", b:"Console: direct serial cable, no IP needed, out-of-band. SSH: TCP 22, encrypted, needs IP. Telnet: TCP 23, plain text, avoid."},
  {f:"In-band vs out-of-band management", b:"In-band: managed over the same network users use (SSH across the LAN). Out-of-band: a separate path (console, console server, dedicated management port)."},
  {f:"Cisco console settings", b:"9600 baud, 8 data bits, no parity, 1 stop bit, no flow control — 9600 8N1."},
  {f:"Rollover cable", b:"Light-blue console cable, RJ45 to DB9, pins reversed end to end (1↔8). Use a USB-to-serial adapter on modern laptops; check the COM port in Device Manager."},
  {f:"IOS mode prompts", b:"Router> user EXEC · Router# privileged EXEC · Router(config)# global config · Router(config-if)# interface config · (config-line)# line config."},
  {f:"exit vs end", b:"exit: up one level (in EXEC, logs out). end / Ctrl+Z: from any config mode straight to privileged EXEC."},
  {f:"? with and without a space", b:"co? (no space) = word help: commands starting with 'co'. copy ? (space) = argument help: what can come next. <cr> = you can press Enter."},
  {f:"% Invalid input detected at '^' marker", b:"IOS could not understand the command at the position of the ^ — a typo, or a valid command in the wrong mode."},
  {f:"do command", b:"Runs an EXEC command (e.g. show, write) from any configuration mode: do show ip interface brief."},
  {f:"enable password vs enable secret", b:"password: plain text (type 7 with encryption). secret: one-way hash (type 5/8/9), takes priority if both exist. Always use secret."},
  {f:"service password-encryption", b:"Converts plain-text passwords in the config to type 7 — weak and reversible; only stops casual shoulder-surfing."},
  {f:"running-config vs startup-config", b:"running: RAM, active now, lost on reboot. startup: NVRAM, loaded at boot. Save with copy running-config startup-config or write memory."},
],
});

K.module("ccna", {
  id:"ccna-m1", t:"How networks work",
  blurb:"From zero: what a network is, the devices and cables, topologies, the OSI and TCP/IP models, encapsulation, TCP vs UDP, and your first Cisco console session.",
}, L, { at:0, modAt:0, replace:["What a network is: clients, servers, OSI & TCP/IP, encapsulation"] });
})();
