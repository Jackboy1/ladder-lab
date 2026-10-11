// Phase 0 — IT Support (CompTIA A+ territory) and Networking (CCNA refresh, Jeremy's IT Lab coverage)
(function(){

LL.tracks.push({
  id:"itsupport", phase:0, title:"IT Support & Hardware", tag:"CompTIA A+", hours:"6–8h",
  blurb:"How machines actually work, Windows CLI you used at Africa Re level, disks, domains, printers, AD, and binary — the first-line toolkit.",
  lessons:[
  {t:"Inside the machine: CPU, RAM, storage, GPU, firmware", html:`
<p>Everything in IT support comes back to the same loop: the <b>CPU</b> executes instructions, <b>RAM</b> holds what it is working on right now, and <b>storage</b> keeps everything when power is off. Firmware is the tiny program baked into the board that wakes all of it up.</p>
<h3>CPU</h3>
<p>Measured in <b>cores</b> (how many things at once) and clock speed in <b>GHz</b> — hertz means cycles per second, so 3.5&nbsp;GHz is 3.5 billion cycles per second. More cores helps parallel work (VMs, compiling); higher clock helps single tasks. Server CPUs (Xeon, EPYC) trade clock speed for many cores and ECC memory support.</p>
<h3>RAM vs storage — the mistake users make</h3>
<p>“My computer has 500&nbsp;GB of memory” usually means storage. RAM is <i>volatile</i> (empties on power-off) and fast; storage is persistent and slower. When RAM fills up, the OS pages to disk and everything crawls — that is the classic “it's slow” ticket. Check Task Manager → Performance before blaming the CPU.</p>
<h3>HDD vs SSD vs NVMe</h3>
<div class="tablewrap"><table>
<tr><th>Type</th><th>How it works</th><th>Typical speed</th><th>Failure mode</th></tr>
<tr><td>HDD</td><td>Spinning platters + moving head</td><td>~100–200 MB/s</td><td>Clicking noise, bad sectors, dies from drops</td></tr>
<tr><td>SATA SSD</td><td>Flash chips, SATA cable</td><td>~550 MB/s (SATA limit)</td><td>Wears out by writes, dies silently</td></tr>
<tr><td>NVMe SSD</td><td>Flash on the PCIe bus (M.2 slot)</td><td>3,000–7,000+ MB/s</td><td>Same as SSD, watch temperatures</td></tr>
</table></div>
<p>The single cheapest upgrade that fixes “slow laptop” tickets: clone HDD → SSD.</p>
<h3>GPU and firmware</h3>
<p>The GPU does massively parallel math — graphics, and now AI workloads. Integrated GPUs share RAM; discrete cards have their own VRAM. <b>Firmware</b> = BIOS/UEFI on the motherboard: it POSTs the hardware, then hands off to the bootloader. UEFI replaced BIOS and adds Secure Boot and GPT disk support (&gt;2&nbsp;TB boot drives). A machine that powers on but shows nothing is usually a firmware/POST-stage problem: listen for beep codes, reseat RAM first.</p>
<h3>Types of computers</h3>
<p>Workstation → server (headless, redundant PSUs, RAID, remote management like iDRAC/iLO) → supercomputer (thousands of nodes on a fast interconnect). A server is not “a big PC”: it is built so one component failing doesn't take the service down.</p>
<div class="callout"><b>Ticket reflex:</b> slow machine → check RAM usage and disk type; no display → POST/beep codes and reseat RAM; random shutdowns → temperatures and PSU.</div>`},

  {t:"Windows CLI & disk management: copy, chkdsk, diskpart", html:`
<p>First-line work still lives in <code>cmd</code> and PowerShell. These are the commands you listed from your A+ study, with when to actually use each.</p>
<h3>Files and copying</h3>
<pre><code>dir            :: list files (ls equivalent)
cd \\Users\\ak   :: change directory
copy a.txt D:\\  :: single files only
xcopy C:\\data D:\\backup /E /H /C   :: folders, /E empty dirs too, /H hidden, /C continue on error
robocopy C:\\data D:\\backup /MIR /R:1 /W:1  :: the professional one — mirrors, retries, logs, resumes</code></pre>
<p><b>robocopy</b> is what you use for real migrations: it survives network drops and <code>/MIR</code> makes the destination an exact mirror (careful — it deletes extras at the destination).</p>
<h3>Disk health</h3>
<pre><code>chkdsk C:        :: read-only scan
chkdsk C: /f     :: fix filesystem errors (locks the volume — schedules at reboot for C:)
chkdsk C: /r     :: /f plus locate bad sectors and recover data (slow)
sfc /scannow     :: repair corrupted Windows system files
DISM /Online /Cleanup-Image /RestoreHealth  :: repair the component store sfc pulls from</code></pre>
<p>Order for “Windows is corrupted” tickets: <code>chkdsk</code> → <code>DISM</code> → <code>sfc</code> → reboot.</p>
<h3>diskpart — partitions from the CLI</h3>
<pre><code>diskpart
list disk          :: see physical disks
select disk 1
clean              :: WIPES the disk — triple-check the number
convert gpt
create partition primary
format fs=ntfs quick label=Data
assign letter=E</code></pre>
<div class="callout warn"><code>clean</code> in diskpart has ended careers. <code>list disk</code> twice, check sizes, then select.</div>
<h3>Networking checks you run on every machine</h3>
<pre><code>ipconfig /all        :: IP, gateway, DNS, DHCP server, MAC
ipconfig /release && ipconfig /renew   :: re-ask DHCP
ipconfig /flushdns   :: clear the DNS cache
ping 192.168.1.1     :: can I reach the gateway?
tracert 8.8.8.8      :: where does the path die?
nslookup google.com  :: is DNS answering?</code></pre>`},

  {t:"Workgroups, domains, DHCP vs static, printers, Active Directory", html:`
<p>This is the lesson behind “set up the new starter's machine” — the ticket you will see most in any Lagos office.</p>
<h3>Workgroup vs Domain</h3>
<p>A <b>workgroup</b> is peer-to-peer: every machine keeps its own local accounts. Fine for 5 PCs, chaos at 50. A <b>domain</b> centralises identity on a <b>Domain Controller</b> running <b>Active Directory (AD)</b>: one account, any machine, one place to reset passwords and push policy (GPO).</p>
<div class="tablewrap"><table>
<tr><th></th><th>Workgroup</th><th>Domain</th></tr>
<tr><td>Accounts</td><td>Local, per machine</td><td>Central in AD — one identity everywhere</td></tr>
<tr><td>Password reset</td><td>Walk to each PC</td><td>One click in ADUC</td></tr>
<tr><td>Policy (wallpaper, drives, security)</td><td>Manual per machine</td><td>GPO pushed to OUs</td></tr>
<tr><td>Scales to</td><td>~10 machines</td><td>Thousands</td></tr>
<tr><td>Needs</td><td>Nothing</td><td>Domain Controller(s), DNS, licences</td></tr>
</table></div>
<p>Joining a domain: System → Rename this PC (advanced) → Change → Domain → enter <code>corp.coscharis.local</code> → domain-admin credentials → reboot. The machine then gets a computer account in AD.</p>
<h3>DHCP vs static IP</h3>
<p><b>DHCP</b> leases an address automatically via the DORA exchange — <b>D</b>iscover, <b>O</b>ffer, <b>R</b>equest, <b>A</b>cknowledge (remember it; it comes up in interviews). Clients get IP, subnet mask, default gateway, DNS servers, lease time.</p>
<p>Use <b>static</b> (or better, a DHCP <i>reservation</i> keyed to the MAC) for things others must find at a fixed address: servers, printers, switches, cameras. A machine with <code>169.254.x.x</code> (APIPA) asked DHCP and got silence — check the cable/VLAN/DHCP server, not the user's apps.</p>
<h3>Printers</h3>
<ul>
<li><b>Direct IP printing</b>: each PC talks to the printer's IP. Simple, but drivers live on every PC.</li>
<li><b>Print server</b>: PCs send jobs to a server share (<code>\\\\printsrv\\HP-Floor2</code>); the server queues and holds drivers. One place to fix things.</li>
<li>Classic fixes: stuck queue → restart the <b>Print Spooler</b> service (<code>net stop spooler && net start spooler</code>, clear <code>C:\\Windows\\System32\\spool\\PRINTERS</code>); “offline” → ping the printer, check it still has its reserved IP.</li>
</ul>
<h3>Active Directory day-to-day</h3>
<ul>
<li><b>Users and Computers (ADUC)</b>: create users, reset passwords, unlock accounts (“account locked out” after too many bad tries is a daily ticket).</li>
<li><b>OUs</b> organise objects; <b>Group Policy (GPO)</b> applies settings to OUs — mapped drives, wallpaper, password policy, blocking USB storage.</li>
<li><b>Security groups</b> grant access: add the user to <code>GRP-Finance-Share</code> rather than permissioning individuals. Group → resource, never user → resource.</li>
</ul>
<div class="callout"><b>New starter checklist:</b> AD user in the right OU + groups → machine imaged and domain-joined → Outlook signs in → mapped drives appear via GPO → printer added → MFA enrolled. Write this once, reuse forever.</div>`},

  {t:"Numbering systems: binary and hex without fear", html:`
<p>Binary is the base skill under subnetting, MAC addresses and memory sizes. Ten minutes here pays off through the whole CCNA track.</p>
<h3>Binary → decimal</h3>
<p>Each bit position is a power of 2. For one octet (8 bits):</p>
<pre><code>128  64  32  16   8   4   2   1
  1   1   0   0   0   0   0   0   = 128+64 = 192
  1   0   1   0   1   0   0   0   = 128+32+8 = 168</code></pre>
<p>So <code>11000000.10101000.00000001.00000001</code> = 192.168.1.1. To convert decimal → binary, subtract the largest power that fits and mark a 1: 215 → 128(✓) 87 → 64(✓) 23 → 32(✗) 16(✓) 7 → 8(✗) 4(✓) 2(✓) 1(✓) = <code>11010111</code>.</p>
<h3>Hex</h3>
<p>Base 16, digits 0–9 then A–F (A=10 … F=15). One hex digit = exactly 4 bits, which is why it is used for MAC addresses (<code>00:1A:2B:3C:4D:5E</code>) and IPv6. Convert via binary in 4-bit chunks:</p>
<pre><code>hex  B    =  1011
hex  3C   =  0011 1100  = 60 decimal (3×16 + 12)</code></pre>
<h3>The sizes table interviewers expect cold</h3>
<div class="tablewrap"><table>
<tr><th>Value</th><th>Equals</th></tr>
<tr><td>1 byte</td><td>8 bits</td></tr>
<tr><td>1 KB / 1 KiB</td><td>1,000 bytes / 1,024 bytes</td></tr>
<tr><td>/24 network</td><td>last octet is host bits → 256 addresses, 254 usable</td></tr>
<tr><td>MAC address</td><td>48 bits = 12 hex digits</td></tr>
<tr><td>IPv4</td><td>32 bits = 4 octets</td></tr>
<tr><td>IPv6</td><td>128 bits = 32 hex digits</td></tr>
</table></div>
<h3>Three conversions, fully worked</h3>
<pre><code>215 → binary:  128 fits (87 left) · 64 fits (23) · 32 no · 16 fits (7) · 8 no · 4 fits (3) · 2 fits (1) · 1 fits
            =  1101 0111
1010 1000 → decimal:  128 + 32 + 8 = 168
hex 2F → decimal:  2×16 + 15 = 47      (and 47 → binary: 0010 1111 — notice the nibbles ARE the hex digits)</code></pre>
<p>Why this matters beyond trivia: a subnet mask is just a run of binary 1s (<code>/26</code> = 26 ones = <code>255.255.255.192</code>, because <code>11000000</code> = 192), a MAC address is 12 hex digits because 12 × 4 bits = 48, and memory sizes double because every added bit doubles the count. Once binary stops being scary, subnetting becomes arithmetic — which is exactly where the CCNA track picks this up.</p>
<div class="callout">Drill: convert your age, 172, and 255 to binary, and <code>2F</code> to decimal. If you can do those without the table, you are ready for subnetting — then go hammer the Subnetting drills in the Labs tab.</div>`},
  ],
  quiz:[
  {q:"A user says their PC 'has 8GB of memory and it's full after saving photos'. What are they confusing?", o:["CPU with GPU","RAM with storage","Cache with RAM","Firmware with the OS"], a:1, why:"Photos live on storage (disk). RAM is volatile working memory — saving files doesn't fill it."},
  {q:"Which command mirrors a folder, retries on network failure, and is the right tool for a data migration?", o:["copy /all","xcopy /E","robocopy /MIR","move /Y"], a:2, why:"robocopy (robust copy) resumes, retries, logs, and /MIR creates an exact mirror. xcopy is older and less resilient."},
  {q:"chkdsk C: /r does what beyond /f?", o:["Runs faster","Also locates bad sectors and recovers readable data","Formats the drive","Only scans without fixing"], a:1, why:"/r includes /f and additionally scans the surface for bad sectors — much slower but more thorough."},
  {q:"A machine shows IP 169.254.10.5. What happened?", o:["Static IP was set","DHCP gave it a reserved lease","It never reached a DHCP server (APIPA)","DNS failed"], a:2, why:"169.254.0.0/16 is APIPA — self-assigned when DHCP gets no answer. Check cable, VLAN, or the DHCP server."},
  {q:"DORA stands for…", o:["Discover, Offer, Request, Acknowledge","Detect, Open, Route, Assign","Discover, Obtain, Register, Accept","DNS, Offer, Request, ARP"], a:0, why:"The four DHCP messages, in order, that lease an address."},
  {q:"Best practice for a network printer's address:", o:["Normal DHCP lease","DHCP reservation or static IP","APIPA","IPv6 only"], a:1, why:"Printers must be findable at a stable address; a reservation keeps DHCP management with a fixed outcome."},
  {q:"Print jobs are stuck for everyone on one printer. First restart:", o:["The DNS Client service","The Print Spooler service","Active Directory","The user's PC"], a:1, why:"The spooler queues jobs; restarting it (and clearing the PRINTERS folder) fixes most stuck queues."},
  {q:"In AD, access to a file share should be granted by…", o:["Adding each user to the share ACL","Adding users to a security group that is on the ACL","Making users local admins","GPO wallpaper policy"], a:1, why:"Group-based access (AGDLP) keeps permissions auditable — users change, the group on the resource stays."},
  {q:"Binary 10101100 in decimal is:", o:["172","168","204","156"], a:0, why:"128+32+8+4 = 172 — the first octet of the 172.16.0.0/12 private range."},
  {q:"One hex digit represents how many bits?", o:["2","4","8","16"], a:1, why:"16 values = 4 bits. That's why a 48-bit MAC is 12 hex digits."},
  {q:"UEFI improves on legacy BIOS with:", o:["Spinning disk support","Secure Boot and GPT boot disks over 2TB","Faster RAM","Built-in antivirus"], a:1, why:"UEFI supports GPT partitioning (large boot drives) and Secure Boot signature checking."},
  ],
  cards:[
  {f:"RAM vs storage", b:"RAM: volatile, fast, working set. Storage: persistent, holds files. Full RAM → paging → slow PC."},
  {f:"DORA", b:"DHCP lease: Discover → Offer → Request → Acknowledge."},
  {f:"APIPA address range", b:"169.254.0.0/16 — self-assigned when DHCP doesn't answer."},
  {f:"robocopy /MIR", b:"Mirror a directory tree exactly (deletes extras at destination); retries and resumes — the migration tool."},
  {f:"Corrupted Windows repair order", b:"chkdsk → DISM /RestoreHealth → sfc /scannow → reboot."},
  {f:"Workgroup vs domain", b:"Workgroup: local accounts per machine. Domain: central identity via AD on a Domain Controller."},
  {f:"GPO", b:"Group Policy Object — settings pushed from AD to OUs: drive maps, password policy, restrictions."},
  {f:"Stuck print queue fix", b:"Restart Print Spooler service; clear C:\\Windows\\System32\\spool\\PRINTERS."},
  {f:"Static IP use-cases", b:"Servers, printers, network gear, cameras — anything others must find at a fixed address (prefer DHCP reservations)."},
  {f:"1 hex digit / MAC length", b:"1 hex digit = 4 bits; MAC = 48 bits = 12 hex digits."},
  {f:"HDD vs SATA SSD vs NVMe", b:"~150 MB/s vs ~550 MB/s vs 3,000–7,000 MB/s. NVMe rides PCIe, not SATA."},
  {f:"UEFI vs BIOS", b:"UEFI: GPT (>2TB boot), Secure Boot, graphical setup. BIOS: legacy, MBR."},
  ],
  labs:[], codelabs:[],
});

LL.tracks.push({
  id:"ccna", phase:0, title:"Networking (CCNA Refresh)", tag:"Jeremy's IT Lab", hours:"14–18h",
  blurb:"The whole CCNA arc you studied — OSI to OSPF, VLANs, STP, ACLs, NAT, security, wireless, automation — rebuilt as lessons, quizzes and a live IOS lab.",
  lessons:[
  {t:"What a network is: clients, servers, OSI & TCP/IP, encapsulation", html:`
<p>A network is devices sharing data. A <b>client</b> asks, a <b>server</b> answers — and any machine can be both at once. Between them sit <b>switches</b> (connect devices inside a LAN), <b>routers</b> (connect networks to each other), and <b>firewalls</b> (decide which traffic may pass).</p>
<h3>The OSI model — and the one you actually use</h3>
<div class="tablewrap"><table>
<tr><th>#</th><th>OSI layer</th><th>Unit (PDU)</th><th>Lives here</th></tr>
<tr><td>7</td><td>Application</td><td>Data</td><td>HTTP, DNS, SSH, SMTP</td></tr>
<tr><td>6</td><td>Presentation</td><td>Data</td><td>Encryption/format (TLS, JPEG)</td></tr>
<tr><td>5</td><td>Session</td><td>Data</td><td>Session handling</td></tr>
<tr><td>4</td><td>Transport</td><td><b>Segment</b></td><td>TCP, UDP, port numbers</td></tr>
<tr><td>3</td><td>Network</td><td><b>Packet</b></td><td>IP addresses, routers</td></tr>
<tr><td>2</td><td>Data Link</td><td><b>Frame</b></td><td>MAC addresses, switches, Ethernet</td></tr>
<tr><td>1</td><td>Physical</td><td>Bits</td><td>Cables, fibre, radio</td></tr>
</table></div>
<p>TCP/IP collapses this to 4 layers (Application = 5–7, then Transport, Internet, Link). Troubleshoot bottom-up: link light → IP/gateway → port/service → application.</p>
<h3>Encapsulation — the exam favourite</h3>
<p>Sending data wraps it layer by layer; receiving unwraps (<b>de-encapsulation</b>):</p>
<pre><code>Data
→ [TCP header | Data]                       = Segment   (L4)
→ [IP header | Segment]                     = Packet    (L3)
→ [Eth header | Packet | Eth trailer(FCS)]  = Frame     (L2)
→ bits on the wire                                      (L1)</code></pre>
<p>Key consequence: as a packet crosses routers, the <b>IP addresses stay the same end-to-end</b> but the <b>MAC addresses change at every hop</b> — each router re-frames for the next link.</p>
<h3>Cables and ports</h3>
<ul>
<li>UTP copper: Cat5e/6, RJ45, 100 m limit. Old rule: straight-through vs crossover — modern <b>auto MDI-X</b> makes it moot.</li>
<li>Fibre via <b>SFP</b> modules: <b>single-mode</b> (laser, long distance, thin core) vs <b>multimode</b> (LED, shorter runs, cheaper).</li>
<li>Full duplex killed <b>collisions</b>; CSMA/CD only mattered on hubs/half duplex. A duplex mismatch today shows up as late collisions and a crawling link.</li>
</ul>
<h3>TCP vs UDP and the three-way handshake</h3>
<pre><code>Client            Server
  ── SYN ──────────▶
  ◀───────── SYN-ACK
  ── ACK ──────────▶   connection established</code></pre>
<p>TCP: reliable, ordered, acknowledged (web, SSH, email). UDP: fire-and-forget, low overhead (DNS queries, VoIP, streaming). Ports you must know: 22 SSH, 23 Telnet, 53 DNS, 67/68 DHCP, 80 HTTP, 443 HTTPS, 25 SMTP, 110/143 mail, 161 SNMP, 20/21 FTP, 69 TFTP, 3389 RDP.</p>`},

  {t:"Ethernet LAN switching: MAC learning, frames, unicast & broadcast", html:`
<p>A switch is a layer-2 device: it forwards <b>frames</b> using <b>MAC addresses</b> and never looks at IPs (that's the router's job — switches do not route between networks).</p>
<h3>The MAC address</h3>
<p>48 bits, written as 12 hex digits. First half = OUI (vendor), second half = device. It is burned in at the factory — <b>BIA</b>, burned-in address. <code>FFFF.FFFF.FFFF</code> is the broadcast MAC.</p>
<h3>The Ethernet frame</h3>
<pre><code>| Preamble+SFD (8B) | Dest MAC | Src MAC | Type | Payload 46–1500B | FCS |</code></pre>
<ul>
<li><b>Preamble + SFD</b>: 7 bytes of alternating bits + start delimiter — synchronises the receiver (not counted in frame size).</li>
<li><b>Type</b>: what's inside — 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6.</li>
<li><b>FCS</b> (trailer): CRC checksum; bad FCS → frame dropped.</li>
<li>Minimum payload is 46 bytes — smaller payloads get <b>padding</b> of zeroes (why ARP frames carry padding).</li>
</ul>
<h3>How a switch learns (the core mechanism)</h3>
<ol>
<li>Frame arrives on port Gi0/1 from MAC A → switch records <i>A is on Gi0/1</i> in its <b>MAC address table</b> (CAM table).</li>
<li>Destination MAC B known? → forward out that one port (<b>known unicast</b>).</li>
<li>Destination unknown? → <b>flood</b> out every port except the one it came in (<b>unknown unicast</b>).</li>
<li>Destination FFFF.FFFF.FFFF? → flood (<b>broadcast</b>).</li>
<li>Entries age out (default 5 min) so the table stays current.</li>
</ol>
<pre><code>SW1# show mac address-table
Vlan  Mac Address     Type     Ports
  1   0050.7966.6800  DYNAMIC  Gi0/1
  1   0050.7966.6801  DYNAMIC  Gi0/2</code></pre>
<h3>ARP and ICMP — gluing L2 to L3</h3>
<p>To send an IP packet on a LAN you need the destination <b>MAC</b>. <b>ARP</b> asks: broadcast “who has 192.168.1.10?” → owner replies unicast with its MAC → sender caches it. <b>ICMP</b> is the control protocol <code>ping</code> uses: Echo Request / Echo Reply. The first ping to a host often times out or drops one packet — that's the ARP resolution happening first; the retry succeeds.</p>
<div class="callout"><b>Interview one-liner:</b> “A switch floods when it doesn't know, learns from source MACs, and forwards when it does. Routers separate broadcast domains; switch ports only separate collision domains.”</div>`},

  {t:"IPv4 addressing & subnetting — the worked method", html:`
<p>An IPv4 address is 32 bits: <b>network part</b> + <b>host part</b>, split by the mask. <code>/24</code> means the first 24 bits are network. Private ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. 127.0.0.1 is <b>loopback</b> (the machine itself).</p>
<h3>The 5-step subnetting method</h3>
<p>For any address+prefix, find: network, broadcast, first/last usable, host count.</p>
<pre><code>Example: 192.168.10.77/26
1) Host bits = 32−26 = 6  → addresses = 2^6 = 64, usable = 62
2) Block size = 64 → subnets start at .0, .64, .128, .192
3) 77 falls in the .64 block → Network   = 192.168.10.64
4) Broadcast = next block − 1            = 192.168.10.127
5) Usable    = .65 … .126</code></pre>
<p>Second example, different octet: <code>10.1.37.200/20</code>. /20 → 4 borrowed bits in the 3rd octet, block size 16 there: subnets 10.1.0.0, 10.1.16.0, 10.1.32.0, 10.1.48.0… → 37 falls in 32 → network <b>10.1.32.0/20</b>, broadcast <b>10.1.47.255</b>, usable 10.1.32.1–10.1.47.254, hosts 2¹²−2 = 4094.</p>
<h3>Designing: “I need N hosts”</h3>
<p>Need 500 hosts → 2⁹=512 ≥ 502 → 9 host bits → <b>/23</b>. Need 60 → 2⁶=64 → /26. Point-to-point links: /30 (2 usable) or /31.</p>
<h3>Why ping fails even when IPs are right</h3>
<ul>
<li><b>Wrong gateway</b>: host can reach its own subnet but nothing beyond — a PC with no/wrong default gateway pings neighbours fine, internet never.</li>
<li><b>Mask mismatch</b>: one side thinks they share a subnet, the other doesn't → asymmetric failure.</li>
<li><b>Interface down</b>: on Cisco gear every interface starts <code>shutdown</code> — bring it up:</li>
</ul>
<pre><code>R1(config)# interface g0/2
R1(config-if)# ip address 192.168.10.65 255.255.255.192
R1(config-if)# no shutdown
R1(config-if)# do show ip interface brief</code></pre>
<p><code>show ip interface brief</code> is the first verification command for everything: Status = layer 1, Protocol = layer 2. <i>administratively down</i> means you forgot <code>no shutdown</code>.</p>
<div class="callout">Drill until automatic: 172.16.91.10/19 → network 172.16.64.0, broadcast 172.16.95.255, usable .64.1–.95.254. Do three of these every visit — the flashcard deck has more.</div>`},

  {t:"Routing fundamentals: static routes, dynamic protocols, OSPF", html:`
<p><b>Routing</b> is choosing the exit interface/next hop for a packet whose destination is in another network. Switches keep traffic inside a LAN; routers move it between LANs — and between you and the internet.</p>
<h3>The routing table and route selection</h3>
<p>A router matches the destination IP against its routes and picks the <b>longest prefix match</b> (most specific). Tie at same prefix → lowest <b>administrative distance</b> (trustworthiness of the source): Connected 0, Static 1, OSPF 110, EIGRP 90 internal, RIP 120. Same AD → compare the protocol's <b>metric</b>.</p>
<pre><code>R1(config)# ip route 10.2.0.0 255.255.0.0 192.168.12.2   ! static route
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1         ! default route ("gateway of last resort")
R1# show ip route</code></pre>
<p><b>Static</b>: predictable, no overhead — fine for small/stub networks, painful at scale (your 500-router scenario is why automation exists). <b>Dynamic</b>: routers advertise and learn automatically, converge around failures.</p>
<h3>The protocols in one view</h3>
<div class="tablewrap"><table>
<tr><th>Protocol</th><th>Type</th><th>Metric</th><th>Notes</th></tr>
<tr><td>RIP</td><td>Distance vector</td><td>Hop count (max 15)</td><td>Legacy; fine for labs</td></tr>
<tr><td>EIGRP</td><td>Advanced DV</td><td>Bandwidth + delay</td><td>Cisco-born, fast convergence</td></tr>
<tr><td>OSPF</td><td><b>Link-state</b></td><td>Cost = 100Mbps ÷ bandwidth</td><td>The open standard everyone runs</td></tr>
<tr><td>BGP</td><td>Path vector</td><td>Policy/attributes</td><td>Between organisations — the internet's protocol</td></tr>
</table></div>
<h3>OSPF in practice</h3>
<p>Every OSPF router floods LSAs describing its links; all routers build an identical map (LSDB) and run Dijkstra's SPF to compute best paths. Routers must agree on <b>area</b> (area 0 = backbone), subnet, hello/dead timers, and authentication to become neighbors (states: Down → Init → 2-Way → Exstart → Exchange → Loading → <b>Full</b>).</p>
<pre><code>R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.12.0 0.0.0.3 area 0     ! wildcard mask = inverted subnet mask
R1(config-router)# passive-interface g0/0                ! don't send hellos to the LAN
R1# show ip ospf neighbor
R1# show ip route ospf</code></pre>
<p>On multi-access segments OSPF elects a <b>DR/BDR</b> (highest priority, then highest router-id) so n routers don't form n² adjacencies.</p>
<h3>First-hop redundancy (FHRP)</h3>
<p>Hosts get one default gateway — what if that router dies? <b>HSRP</b> (Cisco) / <b>VRRP</b> (open) / GLBP share a <b>virtual IP + virtual MAC</b> between two routers; the standby takes over the virtual identity on failure and hosts never notice.</p>`},

  {t:"VLANs, trunks, inter-VLAN routing & SVIs", html:`
<p>A <b>VLAN</b> slices one physical switch into separate broadcast domains: Finance in VLAN 10 and Engineering in VLAN 20 can share hardware but cannot talk at layer 2 — a frame never crosses VLANs without a router.</p>
<h3>Access vs trunk ports</h3>
<ul>
<li><b>Access port</b>: belongs to one VLAN; the PC never sees VLAN tags.</li>
<li><b>Trunk port</b>: carries many VLANs between switches; each frame gets an <b>802.1Q tag</b> (4 bytes inserted in the header) naming its VLAN. The <b>native VLAN</b> travels untagged — must match on both ends (mismatch = classic fault + security issue; move it off VLAN 1).</li>
</ul>
<pre><code>SW1(config)# vlan 10
SW1(config-vlan)# name FINANCE
SW1(config)# interface g0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10

SW1(config)# interface g0/24
SW1(config-if)# switchport trunk encapsulation dot1q   ! on switches that still ask
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1# show vlan brief
SW1# show interfaces trunk</code></pre>
<h3>Getting between VLANs — three generations</h3>
<ol>
<li><b>Router with one link per VLAN</b> — doesn't scale.</li>
<li><b>Router-on-a-stick</b>: one trunk to a router, subinterfaces per VLAN:
<pre><code>R1(config)# interface g0/0.10
R1(config-subif)# encapsulation dot1q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0</code></pre></li>
<li><b>Multilayer (L3) switch with SVIs</b> — the modern answer. An <b>SVI</b> is a virtual interface that is the gateway for its VLAN, routed in hardware:
<pre><code>SW1(config)# ip routing
SW1(config)# interface vlan 10
SW1(config-if)# ip address 192.168.10.1 255.255.255.0
SW1(config-if)# no shutdown</code></pre></li>
</ol>
<div class="callout"><b>Troubleshooting order for “VLAN 20 can't reach VLAN 10”:</b> access ports in right VLANs → trunk allows both VLANs → SVIs up/up (an SVI needs at least one active port in its VLAN) → hosts' gateways point at the SVIs.</div>`},

  {t:"Spanning Tree & EtherChannel", html:`
<p>Redundant links between switches are good — but at layer 2 a loop is fatal: frames have <b>no TTL</b>, so one broadcast circulates forever and multiplies into a <b>broadcast storm</b> that melts the LAN. <b>STP (802.1D)</b> keeps the redundancy but blocks just enough ports to make the topology a loop-free tree.</p>
<h3>How STP decides</h3>
<ol>
<li>Elect a <b>root bridge</b>: lowest bridge ID (priority, default 32768, then lowest MAC). Set it yourself — don't let the oldest switch win: <code>spanning-tree vlan 10 root primary</code>.</li>
<li>Every non-root switch picks one <b>root port</b> (lowest cost path toward root).</li>
<li>Each segment gets one <b>designated port</b>; everything else <b>blocks</b>.</li>
</ol>
<p>Classic STP ports crawl through Blocking → Listening → Learning → Forwarding (~30–50s). <b>Rapid STP (802.1w)</b> converges in seconds and is today's default.</p>
<h3>The STP toolkit (lab + interview staple)</h3>
<ul>
<li><b>PortFast</b>: access ports to PCs skip straight to forwarding (a PC can't cause a loop) — fixes "DHCP fails for 30s after plugging in".</li>
<li><b>BPDU Guard</b>: if a PortFast port ever receives a BPDU (someone plugged in a switch), error-disable it. Pair them always.</li>
<li><b>Root Guard</b>: stop a downstream switch hijacking the root role.</li>
<li><b>Loop Guard</b>: protect against unidirectional link failures silently unblocking a port.</li>
</ul>
<pre><code>SW1(config-if)# spanning-tree portfast
SW1(config-if)# spanning-tree bpduguard enable
SW1# show spanning-tree vlan 10</code></pre>
<h3>EtherChannel — use the links STP would block</h3>
<p>Bundle 2–8 physical links into one logical link; STP sees one interface, so nothing blocks, and you get bandwidth + redundancy. Negotiated by <b>LACP</b> (open: modes active/passive) or PAgP (Cisco: desirable/auto), or forced <code>on</code>. Both sides must match speed, duplex, VLANs.</p>
<pre><code>SW1(config)# interface range g0/1-2
SW1(config-if-range)# channel-group 1 mode active
SW1# show etherchannel summary</code></pre>`},

  {t:"Network services: DHCP, DNS, NAT/PAT, ACLs, SNMP, FTP/TFTP, QoS", html:`
<h3>DHCP on a Cisco router</h3>
<pre><code>R1(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.10
R1(config)# ip dhcp pool LAN
R1(dhcp-config)# network 192.168.1.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.1.1
R1(dhcp-config)# dns-server 8.8.8.8</code></pre>
<p>When the DHCP server is in another subnet, the local router forwards broadcasts with <code>ip helper-address &lt;server&gt;</code> on the LAN interface — a favourite exam detail.</p>
<h3>DNS</h3>
<p>Names → IPs. Resolution chain: client cache → recursive resolver → root → TLD → authoritative. Records: <b>A</b> (IPv4), <b>AAAA</b> (IPv6), <b>CNAME</b> (alias), <b>MX</b> (mail), <b>NS</b>. “Ping 8.8.8.8 works but ping google.com fails” = DNS problem, full stop.</p>
<h3>NAT and PAT</h3>
<p>Private addresses can't cross the internet, so the edge router translates. <b>Static NAT</b>: one private ↔ one public (servers). <b>Dynamic NAT</b>: pool. <b>PAT / NAT overload</b>: the whole office shares one public IP, distinguished by port numbers — what your home router does.</p>
<pre><code>R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface g0/0 overload
R1(config)# interface g0/1
R1(config-if)# ip nat inside
R1(config)# interface g0/0
R1(config-if)# ip nat outside
R1# show ip nat translations</code></pre>
<h3>ACLs — the packet filter</h3>
<ul>
<li><b>Standard</b> (1–99): match source IP only → place <b>close to the destination</b>.</li>
<li><b>Extended</b> (100–199 or named): match source+dest+protocol+port → place <b>close to the source</b>.</li>
<li>Processed top-down, first match wins, invisible <b>implicit deny any</b> at the end.</li>
</ul>
<pre><code>R1(config)# ip access-list extended BLOCK-TELNET
R1(config-ext-nacl)# deny tcp 192.168.1.0 0.0.0.255 any eq 23
R1(config-ext-nacl)# permit ip any any
R1(config)# interface g0/0
R1(config-if)# ip access-group BLOCK-TELNET in</code></pre>
<h3>Management & transfer protocols</h3>
<p><b>SNMP</b> (161): monitoring — manager polls agents' MIBs; v3 adds auth+encryption, use it. <b>Syslog</b> (514): levels 0 emergency → 7 debug. <b>FTP</b> (20/21, auth) vs <b>TFTP</b> (69, UDP, no auth — IOS image copies in labs). <b>NTP</b> (123): one true clock so logs correlate.</p>
<h3>QoS in one paragraph</h3>
<p>When a link congests, something must wait or drop. QoS classifies (DSCP markings) and queues so voice (EF) jumps ahead of bulk data. Voice wants: low delay (&lt;150 ms), low jitter, low loss — priority queuing (LLQ) gives it a strict lane.</p>`},

  {t:"Security fundamentals: CIA, AAA, attacks, port security, DHCP snooping, DAI", html:`
<h3>The frame: CIA + AAA</h3>
<p><b>Confidentiality</b> (only the right eyes — encryption), <b>Integrity</b> (not tampered — hashing), <b>Availability</b> (up when needed — redundancy). A <b>vulnerability</b> is a weakness; an <b>exploit</b> is the tool/technique that uses it; a <b>threat</b> is the potential for someone to; <b>mitigation</b> is what you do about it.</p>
<p><b>AAA</b>: <b>Authentication</b> (who are you), <b>Authorization</b> (what may you do), <b>Accounting</b> (what did you do). Centralised with RADIUS (combines authc+authz, UDP, encrypts only the password — used for network/user access, 802.1X) or TACACS+ (separates all three, TCP, encrypts everything — used for device administration).</p>
<h3>The attacks to recognise</h3>
<ul>
<li><b>DoS/DDoS</b>: exhaust a service. TCP <b>SYN flood</b>: endless SYNs, never the final ACK, connection table fills.</li>
<li><b>Spoofing</b>: fake a source — IP, MAC, or email sender.</li>
<li><b>Man-in-the-middle</b>: <b>ARP poisoning</b> — attacker answers ARP with its own MAC for the gateway's IP and silently relays everything.</li>
<li><b>DHCP attacks</b>: <i>starvation</i> (lease the whole pool with fake MACs) then a <i>rogue DHCP server</i> hands victims the attacker as gateway/DNS.</li>
<li><b>Social engineering</b>: phishing (and spear phishing/whaling), vishing, tailgating, shoulder surfing. Humans are the top entry point — hence training + MFA.</li>
</ul>
<h3>The switch-level defences (know the trio cold)</h3>
<ul>
<li><b>Port security</b>: limit/learn MACs per access port.
<pre><code>SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 2
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# switchport port-security violation shutdown   ! or restrict / protect
SW1# show port-security interface g0/1</code></pre>
A violated <i>shutdown</i> port goes <b>err-disabled</b>: fix the cause, then <code>shutdown</code> / <code>no shutdown</code> to recover.</li>
<li><b>DHCP snooping</b>: mark uplinks <i>trusted</i>; DHCP server replies arriving on untrusted ports are dropped → rogue servers dead. Builds a binding table of IP↔MAC↔port.</li>
<li><b>Dynamic ARP Inspection (DAI)</b>: checks ARP replies against that binding table → ARP poisoning dead.</li>
</ul>
<p>Device hardening basics: <code>enable secret</code> (hashed, never <code>enable password</code>), SSH v2 only (<code>transport input ssh</code>), <code>service password-encryption</code>, login banners, and disable unused ports into a dead VLAN.</p>`},

  {t:"Wireless fundamentals", html:`
<p>Wi-Fi is Ethernet's half-duplex cousin on radio: one device per channel talks at a time (CSMA/<b>CA</b> — collision <i>avoidance</i>).</p>
<h3>RF behaviour (the five words)</h3>
<p>Signals suffer <b>absorption</b> (walls, water — people!), <b>reflection</b> (metal, glass), <b>refraction</b> (bending through materials), <b>diffraction</b> (bending around obstacles, creates shadows), and <b>scattering</b> (rough surfaces, dust). Site surveys exist because of these five.</p>
<h3>Bands & channels</h3>
<div class="tablewrap"><table>
<tr><th>Band</th><th>Reach / penetration</th><th>Non-overlapping channels</th><th>Reality</th></tr>
<tr><td><b>2.4 GHz</b></td><td>Longest, best through walls</td><td>Only <b>1, 6, 11</b></td><td>Crowded: microwaves, Bluetooth, every neighbour</td></tr>
<tr><td><b>5 GHz</b></td><td>Shorter</td><td>20+ (DFS adds more)</td><td>Faster, cleaner — the default for clients today</td></tr>
<tr><td><b>6 GHz</b> (Wi-Fi 6E/7)</td><td>Shortest</td><td>Many, wide (80/160 MHz)</td><td>Pristine spectrum, newest gear only</td></tr>
</table></div>
<pre><code>Channel plan rule: adjacent APs on DIFFERENT non-overlapping channels —
   AP-1 ch1   AP-2 ch6   AP-3 ch11   AP-4 ch1 (far from AP-1) …
Same channel next door = co-channel interference: they take turns, everyone slows.</code></pre>
<h3>Service sets</h3>
<p><b>BSS</b>: one AP + its clients (identified by BSSID = AP radio MAC). <b>ESS</b>: multiple APs sharing one SSID so you can roam. <b>IBSS</b>: ad-hoc, no AP. The AP bridges wireless ↔ wired via its <b>distribution system</b>.</p>
<h3>Autonomous vs lightweight APs</h3>
<ul>
<li><b>Autonomous</b>: each AP configured alone — fine for a café, unmanageable for a campus.</li>
<li><b>Lightweight + WLC</b>: APs tunnel to a <b>Wireless LAN Controller</b> via <b>CAPWAP</b> (control 5246/data 5247, UDP). The WLC handles config, roaming, RF tuning; this is <i>split-MAC</i> — real-time radio stays on the AP, management moves to the controller. <b>Cloud-managed</b> (Meraki-style) moves the controller to the cloud.</li>
</ul>
<h3>Security</h3>
<p>Open &lt; WEP (broken) &lt; WPA &lt; <b>WPA2</b> (AES-CCMP) &lt; <b>WPA3</b> (SAE handshake, forward secrecy). Home: WPA2/3-<b>Personal</b> (pre-shared key). Office: WPA2/3-<b>Enterprise</b> — 802.1X with a RADIUS server, per-user credentials, which is what you'd deploy at Coscharis.</p>`},

  {t:"Virtualization, cloud, containers & network automation (SDN)", html:`
<h3>Virtualization</h3>
<p>A <b>hypervisor</b> runs multiple isolated VMs on one physical machine. <b>Type 1</b> (bare-metal: ESXi, Hyper-V, KVM) for servers; <b>Type 2</b> (VirtualBox, VMware Workstation) on top of a desktop OS — your lab. Each VM has virtual NICs patched into a <b>virtual switch</b>. <b>VRF</b> is virtualization inside a router: multiple independent routing tables on one box, so two customers can both use 10.0.0.0/8 without colliding.</p>
<h3>Containers vs VMs</h3>
<p>A VM virtualises hardware and carries a whole OS (GBs, minutes to boot). A <b>container</b> shares the host kernel and packages just the app + its dependencies (MBs, milliseconds) — Docker builds/runs them, Kubernetes orchestrates fleets. This is Phase 2 of your ladder; here you just need the comparison.</p>
<h3>Cloud models</h3>
<p><b>IaaS</b> (you manage OS up — EC2), <b>PaaS</b> (you bring code — Elastic Beanstalk), <b>SaaS</b> (you just use it — Gmail). Deployment: public, private, hybrid.</p>
<h3>The three planes — the idea SDN hangs on</h3>
<ul>
<li><b>Data plane</b>: forwarding the actual packets/frames (hardware ASICs).</li>
<li><b>Control plane</b>: deciding how — routing protocols, ARP, STP, MAC learning.</li>
<li><b>Management plane</b>: you configuring it — SSH, SNMP, APIs.</li>
</ul>
<p><b>SDN</b> pulls the control plane into a central <b>controller</b> with the whole-network view. The controller speaks <b>SBI</b> (southbound: to devices — OpenFlow, NETCONF/RESTCONF) and <b>NBI</b> (northbound: to apps/scripts — REST APIs returning JSON). Your Python + REST skills plug in at the NBI: instead of SSHing to 500 routers, you POST intent to the controller once. Cisco's campus controller is DNA Center / Catalyst Center.</p>
<pre><code>        your Python / apps
              │  NBI  (REST + JSON — requests.get/post)
        ┌─────▼─────┐
        │ CONTROLLER│   whole-network view, policy, inventory
        └─────┬─────┘
              │  SBI  (NETCONF / RESTCONF / OpenFlow)
   ┌────────┬─▼──────┬────────┐
   SW1      SW2      R1       R2     ← data planes keep forwarding in hardware

# one NBI call instead of 500 SSH sessions:
requests.post(f"{dnac}/api/v1/interface/update", json=intent, headers=auth)</code></pre>
<h3>Config management & IaC</h3>
<p><b>Ansible</b> (agentless, YAML playbooks over SSH), Puppet/Chef (agents) push device config at scale; <b>Terraform</b> declares infrastructure (cloud VPCs, VMs) and reconciles reality to the code. These turn the CCNA knowledge into the automation career — exactly the crossover the Infrastructure Ladder is built on.</p>
<h3>Topologies vocabulary</h3>
<p>Campus LANs: <b>access → distribution → core</b> three-tier (or collapsed core for smaller sites); modern data centres use <b>spine-leaf</b> (every leaf to every spine, equal 2-hop paths). WAN options: leased lines, MPLS, site-to-site VPN over internet, SD-WAN as the overlay brain.</p>`},
  ],
  quiz:[
  {q:"As a packet crosses three routers to a web server, what changes at each hop?", o:["Source and destination IP","Source and destination MAC","Only the TTL — headers are untouched","The TCP ports"], a:1, why:"IPs stay end-to-end; each router strips and rebuilds the L2 frame, so MACs change every hop (TTL also decrements, but the MAC rewrite is the defining L2/L3 distinction)."},
  {q:"A switch receives a frame for a MAC not in its table. It will…", o:["Drop it","Send it to the default gateway","Flood it out all ports except the incoming one","ARP for the MAC"], a:2, why:"Unknown unicast → flood. The reply then teaches the switch where that MAC lives."},
  {q:"192.168.10.77/26 — the broadcast address is:", o:["192.168.10.63","192.168.10.127","192.168.10.255","192.168.10.95"], a:1, why:"/26 → block 64; .77 sits in the .64–.127 block, broadcast .127, usable .65–.126."},
  {q:"You need subnets for 500 hosts each. Smallest prefix:", o:["/24","/23","/22","/25"], a:1, why:"2^9 = 512 ≥ 502 (500 hosts + network + broadcast) → 9 host bits → /23."},
  {q:"Administrative distance decides between…", o:["Two OSPF paths with equal cost","Routes to the same prefix from different sources","Which VLAN a frame joins","DR and BDR"], a:1, why:"AD ranks route sources: connected 0 < static 1 < EIGRP 90 < OSPF 110 < RIP 120. Longest prefix match is checked first; AD breaks same-prefix ties."},
  {q:"Two OSPF routers won't form a neighborship. Least likely cause:", o:["Mismatched area","Mismatched hello/dead timers","Different router IDs","Different subnet on the link"], a:2, why:"Router IDs MUST differ — identical IDs break OSPF. Area, timers, subnet and auth must match."},
  {q:"PCs in VLAN 20 can't reach VLAN 10 through an L3 switch. SVIs show up/up, access ports correct. Next check:", o:["STP root bridge","The trunk's allowed VLAN list","The DNS server","Port security sticky MACs"], a:1, why:"A trunk pruning one of the VLANs is the classic silent killer once SVIs and access ports check out."},
  {q:"PortFast + BPDU Guard on access ports gives you:", o:["Faster trunks","Instant forwarding for PCs, and err-disable if a switch appears","Root bridge election control","Loop-free EtherChannel"], a:1, why:"PortFast skips listening/learning for hosts; BPDU Guard shuts the port if BPDUs (a switch) show up."},
  {q:"NAT overload (PAT) distinguishes inside hosts by…", o:["MAC address","VLAN tag","Source port numbers","DSCP marking"], a:2, why:"Many private IPs share one public IP; the router rewrites and tracks unique source ports."},
  {q:"A standard ACL should be placed…", o:["Close to the source","Close to the destination","On the trunk","Only inbound"], a:1, why:"It matches only source IPs — placed near the source it would over-block traffic to everything."},
  {q:"DHCP snooping stops which attack directly?", o:["SYN flood","Rogue DHCP server","ARP poisoning","Phishing"], a:1, why:"Server-type DHCP messages are only accepted on trusted ports; DAI then uses snooping's binding table to stop ARP poisoning."},
  {q:"In SDN, Python scripts and apps talk to the controller over the…", o:["Southbound interface","Northbound interface","Data plane","CAPWAP tunnel"], a:1, why:"NBI = controller's REST APIs for apps/automation; SBI = controller down to devices (NETCONF, OpenFlow)."},
  {q:"Lightweight APs reach their WLC using…", o:["SNMPv3","CAPWAP tunnels","Trunk native VLAN","RADIUS"], a:1, why:"CAPWAP (UDP 5246 control / 5247 data) carries AP management and tunneled client traffic to the controller."},
  {q:"First command to verify interface state after configuration:", o:["show running-config","show ip interface brief","show version","show mac address-table"], a:1, why:"One screen: every interface, IP, Status (L1) and Protocol (L2). 'administratively down' = missing no shutdown."},
  ],
  cards:[
  {f:"OSI 7 layers (down)", b:"Application, Presentation, Session, Transport, Network, Data Link, Physical — 'All People Seem To Need Data Processing'."},
  {f:"PDU names L4/L3/L2", b:"Segment → Packet → Frame (then bits)."},
  {f:"What changes per router hop", b:"MAC addresses rewritten each hop; IPs stay end-to-end; TTL −1."},
  {f:"Switch logic", b:"Learn source MACs; known unicast → one port; unknown/broadcast → flood all except ingress."},
  {f:"ARP", b:"Broadcast 'who has IP x?' → unicast reply with MAC. First ping often loses a packet to this."},
  {f:"Subnet 5-step", b:"Host bits → block size → find block → broadcast = next block −1 → usable = between."},
  {f:"Hosts formula", b:"Usable hosts = 2^(host bits) − 2. /26→62, /23→510, /20→4094, /30→2."},
  {f:"Administrative distances", b:"Connected 0, Static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120."},
  {f:"OSPF neighbor requirements", b:"Same area, subnet, hello/dead timers, auth; UNIQUE router IDs. Final state: Full."},
  {f:"OSPF cost", b:"Reference bandwidth ÷ interface bandwidth (default ref 100 Mbps — raise it on gig+ networks)."},
  {f:"Trunk vs access", b:"Access: one VLAN, untagged to host. Trunk: many VLANs, 802.1Q tags; native VLAN untagged, must match."},
  {f:"Router-on-a-stick", b:"One trunk; subinterfaces with 'encapsulation dot1q <vlan>' + IP = gateway per VLAN."},
  {f:"STP election", b:"Root = lowest bridge ID (priority then MAC). Then root ports (lowest cost to root), designated ports, rest block."},
  {f:"PortFast + BPDU Guard", b:"Host ports forward immediately; err-disable if a BPDU arrives. Always paired."},
  {f:"EtherChannel modes", b:"LACP: active/passive. PAgP: desirable/auto. 'on' forces. Bundle = one logical link, STP can't block members individually."},
  {f:"PAT / NAT overload", b:"Whole LAN behind one public IP, tracked by translated source ports."},
  {f:"ACL rules", b:"Top-down, first match, implicit deny any. Standard = src only, near destination. Extended = 5-tuple, near source."},
  {f:"ip helper-address", b:"On the LAN interface: relays DHCP broadcasts as unicast to a remote DHCP server."},
  {f:"Port security recovery", b:"Violation 'shutdown' → err-disabled → fix cause → shut / no shut."},
  {f:"RADIUS vs TACACS+", b:"RADIUS: UDP, combines authc/authz, network access. TACACS+: TCP, separates AAA, full encryption, device admin."},
  {f:"Three planes", b:"Data = forward packets. Control = decide (OSPF, STP, ARP). Management = configure (SSH/API). SDN centralises control."},
  {f:"SBI vs NBI", b:"SBI: controller→devices (NETCONF, RESTCONF, OpenFlow). NBI: apps/scripts→controller (REST + JSON)."},
  {f:"2.4 GHz channels", b:"Only 1, 6, 11 don't overlap."},
  {f:"WPA3", b:"SAE handshake replaces PSK 4-way capture attacks; forward secrecy. Enterprise = 802.1X + RADIUS."},
  ],
  labs:["ios-setup","ios-ip","ios-vlan"], codelabs:[],
});

})();
