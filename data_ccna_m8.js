// CCNA · Module 8 — Security fundamentals: threats, device access, AAA and VPNs, ACLs, port security, DHCP snooping and DAI (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "Security fundamentals: CIA, AAA, attacks, port security, DHCP snooping, DAI" (wireless security moves to Module 9).
(function(){
const L = [];

// ---------- Module 8 · Lesson 1 ----------
L.push({
id:"sec-concepts", mins:95, level:"Intermediate · builds on Modules 1–7",
t:"Security concepts: threats, vulnerabilities and exploits, attack types, and what an exposed device looks like",
html:`
${K.goals([
  "Explain confidentiality, integrity and availability with a network example of each, and say which one an incident damages.",
  "Tell an asset, a threat, a vulnerability, an exploit, a risk and a mitigation apart in a real scenario — the way the exam words them.",
  "Recognise the main attack categories — reconnaissance, DoS and DDoS, spoofing, man-in-the-middle, malware, social engineering and phishing, password attacks — by what the attacker is after and what the network team notices, and match each one to the control that stops it.",
  "Explain defence in depth and the three security-programme elements the CCNA names: user awareness, training and physical access control.",
  "Audit a router or switch for the obvious management-plane holes (Telnet, shared and plain-text passwords, no enable secret, no timeouts, an open console) and close them with what Module 2 taught.",
])}
${K.pre(["Module 2 lessons 5–6: enable secret vs enable password, password types 0/7/9, <code>service password-encryption</code>, console and VTY lines, <code>exec-timeout</code>, <code>banner motd</code>, and replacing Telnet with SSH (<code>ip domain name</code>, <code>crypto key generate rsa</code>, <code>username … secret</code>, <code>login local</code>, <code>transport input ssh</code>).","Module 1: TCP and UDP, ports and the three-way handshake. Modules 2 and 4: ARP, MAC tables and VLANs.","Module 7: DHCP (and the rogue-DHCP case study), DNS, NTP and syslog — security leans on all of them."])}

<h2>Why this matters at work</h2>
<p>Your first week at a managed-service provider. The team lead forwards an email from a client's auditor: &ldquo;Before we sign off the new branch, confirm the network meets a basic security standard.&rdquo; Attached is a 40-line checklist with words you half know: <i>threat, vulnerability, mitigation, defence in depth, physical access control</i>. The client wants a yes or no. Your lead wants the evidence: which holes exist, how bad each one is, and what closes it.</p>
<p>That is what network security is on the job — not hooded figures, but plain questions asked carefully. What are we protecting? From whom? Where is it weak? What would it cost if that weakness were used? What do we change, and how do we prove it changed? This lesson gives you the vocabulary and the logic. Then you audit two exposed devices yourself, because the commonest real finding isn't exotic: it's a router that still accepts Telnet with a shared password the installer wrote on a sticky note.</p>
${K.tip(`This module covers CCNA 200-301 domain 5, &ldquo;Security Fundamentals&rdquo;. Lesson 1 is topics 5.1 (key concepts) and 5.2 (security-programme elements); lessons 2–8 turn the ideas into configuration. Wireless security is in Module 9.`)}

<h2>Security in one triangle: confidentiality, integrity, availability</h2>
${K.remember(`<b>The rule in one line:</b> every security problem damages at least one of three things — <b>C</b>onfidentiality (only the right people can read it), <b>I</b>ntegrity (nobody changed it without being noticed), <b>A</b>vailability (it works when it's needed). The ${K.g("CIA triad","Confidentiality, Integrity, Availability: the three properties security protects. Nothing to do with the intelligence agency — the letters are a memory hook.")}. Name the letter first; the right control follows.`)}
<p>A bank, a hospital and a school protect very different things, but the questions are the same three. Ask them about anything on the network — a payroll file, a router's configuration, a link to head office:</p>
${K.svg("0 0 760 360",
  `<polygon points="380,70 150,250 610,250" fill="none" stroke="var(--line)" stroke-width="1.6"/>`+
  K.box(270,20,220,50,"Confidentiality","only the right people can read it",true)+
  K.box(40,250,220,50,"Integrity","nobody changed it unnoticed",true)+
  K.box(500,250,220,50,"Availability","it works when it is needed",true)+
  K.txt(380,166,"Every control protects at least one",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,184,"of the three — name it first.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(500,40,"damaged by: eavesdropping,",{s:10.5,f:"body"})+K.txt(500,56,"stolen passwords, leaked backups",{s:10.5,f:"body"})+
  K.txt(150,320,"damaged by: tampering in transit,",{mid:true,s:10.5,f:"body"})+K.txt(150,336,"unauthorised config changes",{mid:true,s:10.5,f:"body"})+
  K.txt(610,320,"damaged by: DoS and DDoS,",{mid:true,s:10.5,f:"body"})+K.txt(610,336,"ransomware, a cut cable, a power cut",{mid:true,s:10.5,f:"body"}),
  "The CIA triad. Security isn't only about secrets: a router that someone quietly reconfigures (integrity) or a link that is flooded (availability) is a security incident too.")}
<h3>Each letter, with a network example</h3>
<ul>
<li><b>Confidentiality</b> — data is readable only by those allowed to read it. Telnet breaks it: the session, password included, crosses the wire as readable text (Module 2), so anyone who can capture the traffic can read it. SSH, HTTPS and VPNs protect it with ${K.g("encryption","Scrambling data with a key so that only someone with the right key can turn it back into readable form.")}; so do access controls that stop the wrong people reaching the data at all.</li>
<li><b>Integrity</b> — data and configurations are what they should be, and a change is noticed. A config change nobody approved, a DHCP server handing out the wrong gateway (Module 7), or a packet altered on its way all break integrity. Defences: named logins and logs that say who changed what, a ${K.g("hash","A fixed-length fingerprint calculated from data. Change one bit of the data and the fingerprint changes completely, so it reveals tampering. (Module 2 met hashes as a way to store passwords.)")} that reveals tampering, config backups to compare against.</li>
<li><b>Availability</b> — the service works when people need it. A flood of traffic, a broadcast storm (Module 4), ransomware that locks the file server, a stolen access switch or a generator that never started all break availability. Defences: redundancy (HSRP, EtherChannel, two ISPs — Modules 4–5), capacity, backups, a UPS — and the controls in this module that stop an attacker taking things down.</li>
</ul>
${K.analogy(`A bank's paper ledger. <b>Confidentiality</b>: only the account officer may read it. <b>Integrity</b>: nobody may rub out a figure and write a new one without a signed correction. <b>Availability</b>: when a customer arrives at 9 a.m., the ledger is on the desk, not locked in a room whose key went home with someone.`)}
<p>The three pull against each other. A switch locked in a safe is very confidential and not at all available. Good security finds the balance the business can live with — which is why the first question about any control is &ldquo;which letter does this protect, and what does it cost the others?&rdquo;</p>
${K.check({q:"A former employee still knows the shared VTY password and logs in to a branch switch to look around. Nothing is changed and nothing breaks. Which part of the CIA triad has been damaged?", o:["Only availability","Confidentiality — someone not allowed to see the configuration has seen it","Integrity — the configuration was altered","None, because nothing was changed"], a:1, why:"Reading what you're not allowed to read is a confidentiality breach even when nothing changes. Had they changed a VLAN, integrity would be hit too; had they shut the uplink, availability."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Five incidents from one month at a hospital. Match each with the CIA property it damaged most directly.", pairs:[["A USB stick with unencrypted patient records is lost on a bus","Confidentiality"],["Someone changes a DHCP pool so ward PCs get a gateway that doesn't exist","Integrity"],["A flood of traffic fills the internet link and the appointment website stops answering","Availability"],["A visitor reads a nurse's password from a note stuck to the monitor","Confidentiality (credentials exposed)"],["The only core switch dies and no spare is on site","Availability (no redundancy)"]], why:"1. What is asked? Which property each incident damages. 2. Which rule? Readable by the wrong people = C; changed without authorisation = I; not working when needed = A. 3. Apply it: lost records and an exposed password are C; a tampered pool is I (even though it then hurts availability); a flood and a dead switch with no spare are A. Name the first property hit — that's how exam questions are written."})}

${K.drill({title:"which part of the triad does it hit?", types:["cia"], count:5})}
<h2>The vocabulary of risk: assets, threats, vulnerabilities, exploits, mitigation</h2>
${K.remember(`<b>The rule:</b> a <b>threat</b> uses an <b>exploit</b> against a <b>vulnerability</b> to harm an <b>asset</b>. <b>Risk</b> is how likely that is times how bad it would be. A <b>mitigation</b> breaks the chain at any link. Say it as one sentence about the thing in front of you and the words stop being confusing.`)}
<p>The exam (CCNA topic 5.1) and every audit report use these words precisely. Here they are, each with the same branch router as the example:</p>
<div class="tablewrap"><table>
<tr><th>Term</th><th>Plain meaning</th><th>Branch-router example</th></tr>
<tr><td><b>${K.g("Asset","Anything of value to the organisation: data, devices, services, people's time, reputation.")}</b></td><td>Something of value you protect</td><td>The edge router and the configuration that keeps the branch online</td></tr>
<tr><td><b>${K.g("Threat","Anything that could cause harm to an asset: a person (an attacker, a careless insider), malware, or an event such as a flood.")}</b></td><td>Who or what could cause harm</td><td>A visitor on the guest Wi-Fi; a disgruntled former contractor; malware on a staff laptop</td></tr>
<tr><td><b>${K.g("Vulnerability","A weakness that a threat could use: a design flaw, a software bug, a missing setting, a weak password, an unlocked door.")}</b></td><td>The weakness</td><td>Telnet enabled, a shared password <code>phc123</code>, no enable secret</td></tr>
<tr><td><b>${K.g("Exploit","The method or piece of code that takes advantage of a specific vulnerability.")}</b></td><td>The way the weakness is used</td><td>Logging in with the shared password; reading it from captured Telnet traffic</td></tr>
<tr><td><b>${K.g("Risk","The chance that a threat uses a vulnerability, combined with the harm that would follow — often scored as likelihood × impact.")}</b></td><td>Likelihood × impact</td><td>High: easy to do (likely) and it gives full control of the branch (severe)</td></tr>
<tr><td><b>${K.g("Mitigation","A control that reduces risk: removing the vulnerability, making the exploit harder, detecting it sooner or limiting the damage.")}</b></td><td>What reduces the risk</td><td>SSH only, individual users, an enable secret, a VTY access list, logging</td></tr>
</table></div>
${K.svg("0 0 760 300",
  K.txt(20,20,"The chain an attack follows — and where each kind of control breaks it",{c:"fg",s:12.5,b:true,f:"body"})+
  K.box(14,36,165,52,"Threat","who or what could harm")+K.box(207,36,165,52,"Exploit","how the weakness is used")+
  K.box(400,36,165,52,"Vulnerability","the weakness",true)+K.box(593,36,165,52,"Asset","what you are protecting")+
  K.arrow(179,62,205,62)+K.arrow(372,62,398,62)+K.arrow(565,62,591,62)+
  K.txt(96,108,"a visitor on the LAN",{mid:true,s:10})+K.txt(289,108,"logs in with phc123",{mid:true,s:10})+
  K.txt(482,108,"Telnet + shared password",{mid:true,s:10})+K.txt(675,108,"the branch edge router",{mid:true,s:10})+
  K.band(14,124,744,30,"risk = likelihood (how easy, how exposed) × impact (what it would cost)")+
  K.box(14,176,165,52,"Deter","banner, awareness")+K.box(207,176,165,52,"Detect","log failed logins",true)+
  K.box(400,176,165,52,"Prevent","SSH, own user, secret",true)+K.box(593,176,165,52,"Recover","config backups")+
  K.arrow(96,174,96,156)+K.arrow(289,174,289,156)+K.arrow(482,174,482,156)+K.arrow(675,174,675,156)+
  K.txt(386,258,"You rarely remove every threat. You remove vulnerabilities, make exploits harder,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(386,276,"notice attempts sooner and limit the damage — together that lowers the risk.",{mid:true,c:"fg",s:11,f:"body"}),
  "Threat → exploit → vulnerability → asset. Mitigations act on different links: prevention removes the weakness, detection and recovery limit the harm.")}
<h3>Why the words matter</h3>
<p>Because the fix depends on which one you're talking about. You can't patch a threat (the visitor still exists) and you can't &ldquo;detect&rdquo; a vulnerability into going away. When an auditor writes &ldquo;vulnerability: Telnet enabled on PHC-R1; threat: any LAN user; risk: high&rdquo;, they're telling you to remove the weakness, because the threat can't be removed.</p>
<p>Two more words you will meet. A ${K.g("zero-day","A vulnerability the vendor doesn't yet know about or hasn't yet fixed — defenders have had 'zero days' to patch it.")} is a vulnerability with no fix yet, so other layers have to hold. A ${K.g("buffer overflow","A software bug: a program accepts more data than the memory space set aside for it, so the extra overwrites neighbouring memory. Results range from a crash (a DoS) to the attacker's own code running.")} is a classic class of software vulnerability: a program receives more input than it expects, and the overflow crashes it or, worse, lets attacker-supplied code run. The defence is the vendor's fix, so <b>patching</b> network devices (reading Cisco's security advisories and upgrading IOS) is part of the job, not an optional extra.</p>
<h3>Kinds of mitigation</h3>
<p>Controls come in three families, and a good design mixes them:</p>
<ul>
<li><b>Technical</b> — configured in devices: SSH, ACLs (lessons 4–5), port security (lesson 6), DHCP snooping and DAI (lesson 7), encryption, firewalls.</li>
<li><b>Administrative</b> — rules and processes: a password policy, change control, an awareness programme, a joiners-and-leavers process that removes accounts the day someone leaves.</li>
<li><b>Physical</b> — locks, badges, cameras, a locked comms cabinet, a guard who asks visitors to sign in.</li>
</ul>
<p>Each can also be described by <i>when</i> it acts: <b>preventive</b> (stops it — SSH only), <b>detective</b> (notices it — a syslog alert on failed logins) or <b>corrective</b> (repairs it — restoring last night's config backup).</p>
${K.when([
  ["Technical control","The weakness lives in a device or protocol (Telnet, a flat VLAN, no ACL)","Enforced every time, automatically, at line speed","The real weakness is human or physical — a lock or a process is cheaper and works better"],
  ["Administrative control","People's behaviour or a process is the weak point (shared passwords, no leaver process)","Changes what people do; covers what devices can't see","Nobody checks it — a policy no one follows is not a control"],
  ["Physical control","Someone could touch the kit: comms rooms, wall ports, console cables","Most technical controls can be defeated by physical access","Used alone — a locked room doesn't stop an attack over the network"],
], "Which kind of control fits the weakness?")}
${K.exam(`Reading a security-concepts question: before you look at the options, decide which word the question is really asking for. &ldquo;A <b>weakness</b> in a system&rdquo; = vulnerability. &ldquo;A <b>potential danger</b> / something that could cause harm&rdquo; = threat. &ldquo;The <b>code or technique</b> that takes advantage of a weakness&rdquo; = exploit. &ldquo;<b>Likelihood</b> and <b>impact</b>&rdquo; = risk. &ldquo;<b>Reduces</b> the risk&rdquo; = mitigation. Trap: an option that names a real attack (&ldquo;phishing&rdquo;) when the question asks for the vulnerability (&ldquo;users not trained to spot fake emails&rdquo;).`)}
${K.check({q:"An audit says: 'The access switches run an IOS version with a published flaw that lets a crafted packet reload the switch.' What is the published flaw?", o:["A threat","A vulnerability","An exploit","A mitigation"], a:1, why:"The flaw is the weakness: a vulnerability. The crafted packet that triggers it is the exploit; whoever might send it is the threat; upgrading IOS is the mitigation. Reloading the switch would damage availability."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Kano warehouse: the label printer sits on a wall port in the public collection area, the port is live in the staff VLAN, and the printer's web page still uses the factory admin password. Match each part of the situation to its role.", pairs:[["The staff VLAN and the stock system on it","Asset"],["A member of the public waiting at the counter","Threat"],["A live staff-VLAN port in a public area, and a factory default password","Vulnerability"],["Plugging a laptop into that wall port","Exploit"],["Moving the printer to its own VLAN, shutting unused ports, changing the default password","Mitigation"]], why:"1. What is asked? The role of each piece. 2. Which rule? A threat uses an exploit against a vulnerability to reach an asset; a mitigation breaks the chain. 3. Apply it: the stock system is what's valued; the public is who could harm it; the live port and the default password are the weaknesses; plugging in is how the weakness is used; the fixes remove the weaknesses. The threat never went away — the vulnerabilities did."})}

<h2>Attack categories: what the attacker is after, and what stops it</h2>
${K.remember(`<b>The rule:</b> to defend against an attack, ask <b>what is the attacker after</b> (which CIA letter), <b>what would my team notice</b>, and <b>which control breaks the chain</b>. The category's name is a label for those answers.`)}
<p>The CCNA asks you to recognise these categories and match each to its control — so does the job, where an incident arrives as a symptom and naming it brings the right controls into play. The table looks from the defender's side only.</p>
<div class="tablewrap"><table>
<tr><th>Category</th><th>What the attacker is after</th><th>What the network team notices</th><th>What stops it (and where in this course)</th></tr>
<tr><td><b>${K.g("Reconnaissance","Information gathering before an attack: what answers on the network, what software runs, who works there.")}</b></td><td>A map of your network and people, to pick a target.</td><td>One source trying many addresses or ports in a short time.</td><td>ACLs that allow only what's needed (lessons 4–5), unused services off (lesson 8), logs someone reads (Module 7).</td></tr>
<tr><td><b>${K.g("DoS","Denial of service: an attack on availability — swamping or crashing a device, link or service.")} and ${K.g("DDoS","Distributed DoS: the same goal from many sources at once, so blocking one address doesn't help.")}</b></td><td>To make a service, link or device stop working.</td><td>A link or CPU suddenly at 100%, from very many sources — sometimes replies to requests nobody sent (${K.g("reflection and amplification","A DDoS that arrives as large replies from innocent servers to requests the victim never sent.")}).</td><td>Upstream filtering by the ISP or a ${K.g("scrubbing service","A provider, often the ISP, that filters the flood out of your traffic during a DDoS.")}, spare capacity and redundancy (Modules 4–5) — your own ACL can't help once the link is full.</td></tr>
<tr><td><b>${K.g("Spoofing","Faking an identity — an IP or MAC address, a DHCP server, a caller ID, an email sender — in order to be trusted.")}</b></td><td>To be trusted by pretending to be another address, device or person.</td><td>Addresses on ports where they don't belong, or users handed a wrong gateway.</td><td>Port security (lesson 6), DHCP snooping and DAI (lesson 7), edge ACLs that drop impossible sources, such as your own addresses arriving from the internet (ACLs: lessons 4–5).</td></tr>
<tr><td><b>${K.g("Man-in-the-middle (MITM)","An attacker sits between two parties, reading or changing their traffic while both think they are talking directly.")}</b></td><td>To read or change a conversation in transit.</td><td>A gateway whose MAC address changed, or browser certificate warnings.</td><td>Encryption that proves who the other end is — SSH, HTTPS, VPNs (lesson 3) — plus DHCP snooping and DAI (lesson 7).</td></tr>
<tr><td><b>Malware</b>: ${K.g("virus","Malware attached to a file; it runs when a person opens it.")}, ${K.g("worm","Malware that spreads across the network by itself.")}, ${K.g("trojan","Malware disguised as a useful program.")}, ${K.g("ransomware","Malware that encrypts files and demands payment for the key.")}</td><td>To run its own code on your devices — to steal, spread or hold data to ransom.</td><td>Anti-malware alerts, a PC suddenly talking to many others, files that no longer open.</td><td>Patching, anti-malware and offline backups; VLANs and ACLs that limit the spread (lessons 4–5); awareness.</td></tr>
<tr><td><b>${K.g("Social engineering","Manipulating people, not technology — posing as someone trusted, with a made-up story (a pretext) and false urgency.")} and ${K.g("phishing","Fake messages, usually email, sent to many people to get a click, an attachment opened or a password typed.")}</b>: ${K.g("spear phishing","Phishing aimed at a named person or team, using real details.")}, ${K.g("whaling","Spear phishing aimed at senior executives.")}, ${K.g("vishing","Phishing by phone call.")}, ${K.g("smishing","Phishing by text message (SMS).")}, ${K.g("tailgating","Following an authorised person through a secured door.")}</td><td>A password, a payment approval, or a door held open.</td><td>Users reporting odd emails, calls or texts; a login from an unusual place; strangers in staff areas.</td><td>Awareness and training, a call-back rule for passwords and payments, ${K.g("MFA","Multi-factor authentication: two or more kinds of proof — something you know, have or are (lesson 2).")} (lesson 2), badges and visitor rules (next section).</td></tr>
<tr><td><b>Password attacks</b>: ${K.g("guessing","Trying likely passwords: defaults, the company name, Password1.")}, ${K.g("dictionary","Trying every entry in a list of common passwords.")}, ${K.g("brute force","Trying every combination; each extra character multiplies the work.")}</td><td>A working login to a device or account.</td><td>Many failed logins for one account, or from one source.</td><td>Long passwords, no defaults, hashed storage (<code>enable secret</code>), SSH with named users (this lesson's bench), login blocking and MFA (lesson 2).</td></tr>
</table></div>
<p>Each row works because of a vulnerability — trust without checking, people under pressure, weak passwords, unpatched or unneeded services — which is why the last column is mostly what you'll configure in this module.</p>
${K.exam(`Reading an attack question: underline the clue words first — <b>many sources</b> (DDoS), <b>an executive</b> (whaling), <b>phone</b> or <b>text</b> (vishing, smishing), <b>a word list</b> or <b>every combination</b> (dictionary, brute force), <b>spreads by itself</b> (worm). Then check what is asked: the category, the CIA letter, or the mitigation.`)}
<h3>Defence in depth</h3>
<p>No single control stops every row, and every control eventually fails — a password is phished, a door propped open. ${K.g("Defence in depth","Protecting an asset with several independent layers of controls, so that when one fails the next still stands.")} stacks independent layers — physical, device access, network filtering, switch edge, monitoring, people — so one failure isn't the end. This module builds them one at a time.</p>
${K.svg("0 0 760 330",
  `<rect x="20" y="14" width="600" height="300" rx="12" fill="none" stroke="var(--line)" stroke-width="1.4"/>`+
  `<rect x="64" y="40" width="512" height="248" rx="11" fill="none" stroke="var(--line)" stroke-width="1.4"/>`+
  `<rect x="108" y="66" width="424" height="196" rx="10" fill="none" stroke="var(--line)" stroke-width="1.4"/>`+
  `<rect x="152" y="92" width="336" height="144" rx="9" fill="none" stroke="var(--line)" stroke-width="1.4"/>`+
  `<rect x="196" y="118" width="248" height="92" rx="8" fill="none" stroke="var(--accent)" stroke-width="1.4"/>`+
  K.txt(32,31,"People — awareness and training (this lesson)",{c:"fg",s:11,f:"body"})+
  K.txt(76,57,"Physical — locked rooms, badges, console access",{c:"fg",s:11,f:"body"})+
  K.txt(120,83,"Network filtering — ACLs at the edge (lessons 4–5)",{c:"fg",s:11,f:"body"})+
  K.txt(164,109,"Switch edge — port security, DHCP snooping, DAI",{c:"fg",s:10.5,f:"body"})+
  K.txt(208,135,"Device access — SSH, secrets (2–3)",{c:"fg",s:10.5,f:"body"})+
  K.box(240,145,160,52,"The asset","config, data, service",true)+
  `<rect x="640" y="14" width="106" height="300" rx="10" fill="var(--chip)" stroke="var(--line)"/>`+
  K.txt(693,42,"Monitoring",{mid:true,c:"fg",s:12,b:true,f:"body"})+
  K.txt(693,62,"syslog, NTP,",{mid:true,s:10.5,f:"body"})+K.txt(693,78,"SNMP, alerts",{mid:true,s:10.5,f:"body"})+K.txt(693,94,"(Module 7)",{mid:true,s:10.5,f:"body"})+
  K.txt(693,150,"watches every",{mid:true,s:10.5,f:"body"})+K.txt(693,166,"ring and tells",{mid:true,s:10.5,f:"body"})+K.txt(693,182,"you when one",{mid:true,s:10.5,f:"body"})+K.txt(693,198,"is tested",{mid:true,s:10.5,f:"body"})+
  K.arrow(638,166,624,166),
  "Defence in depth: an attacker must get through every ring, each a different kind of control, so one mistake isn't the end. Monitoring watches them all.")}
${K.check({q:"The internet link at an Abuja fintech is completely full. The traffic comes from thousands of addresses in many countries, and customers can't reach the payments website. Which category is this, and which CIA property does it damage?", o:["Reconnaissance — confidentiality","DDoS — availability","Man-in-the-middle — integrity","A password attack — confidentiality"], a:1, why:"Many sources and an unusable service: a DDoS, an attack on availability. The link itself is full, so filtering must happen upstream (the ISP or a scrubbing service), not on the fintech's router."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Six incident reports from one month at a Lagos insurance company. Match each with its category and the control that would have stopped it.", pairs:[["An email to the chief executive names a real supplier and a real board meeting, and asks her to approve an urgent transfer today","Whaling — training plus a call-back rule for payments"],["Overnight, one guest Wi-Fi address tried to connect to every address in the server subnet on dozens of ports","Reconnaissance — edge ACLs and logs someone reads"],["Syslog shows 400 failed SSH logins for 'admin' from one address in ten minutes","Password attack — long passwords, named users, login blocking"],["Users on one floor suddenly have a different default gateway, and their browsers show certificate warnings","Man-in-the-middle — DHCP snooping, DAI and encrypted protocols"],["The file server's documents are all unreadable, with a note demanding payment for the key","Ransomware — offline backups, patching, segmentation"],["Someone without a badge follows a member of staff through the comms-room door","Tailgating — badge doors, visitor rules and staff who challenge"]], why:"1. What is asked? The category and its control for each incident. 2. Which rule? Name what the attacker is after and what the team noticed; the control follows from that, not from the name. 3. Apply it: a named executive and a payment = whaling (a procedure stops it, not a firewall); one source probing many addresses = reconnaissance; many failed logins = a password attack; a changed gateway plus certificate warnings = someone in the middle; locked files with a ransom note = ransomware; following through a door = tailgating."})}

<h2>A security programme: awareness, training and physical access control</h2>
${K.remember(`<b>The rule:</b> configuration protects devices; a <b>security programme</b> makes people part of the defence. CCNA topic 5.2 names three elements — <b>user awareness</b> (everyone recognises and reports threats), <b>training</b> (each role's procedures) and <b>physical access control</b> (only authorised people touch the equipment). <b>Know it, do it, lock it.</b>`)}
<p>A ${K.g("security programme","The organisation-wide plan that keeps security working over time: policies, awareness, training, physical controls and regular checks that they are followed.")} keeps controls working after their engineer has moved on — and one phone call can get round a perfect configuration.</p>
<h3>User awareness — everyone, all the time</h3>
<p>Short, repeated, for every member of staff: posters, a few minutes at induction, a monthly real example, simulated phishing emails that show those who click what they missed. The goal: people <b>recognise</b> a suspicious email, call, text or visitor and <b>report</b> it quickly, without fear of blame. A report in the first ten minutes beats any log read the next day.</p>
<h3>Training — the procedures each role needs</h3>
<p>Deeper, formal, role-specific and usually recorded. The helpdesk verifies a caller before resetting a password — calling back the number in the staff directory, never one the caller gives. Finance confirms emailed payment requests by phone. The network team learns secure configuration, change control and incident response. Awareness makes people suspicious; training tells them exactly what to do next.</p>
<h3>Physical access control — who can touch the kit</h3>
<p>Someone standing at a router can get round most technical controls: unplug it, use a spare port, or use the console. Physical controls include:</p>
<ul>
<li><b>Locked comms rooms and cabinets</b>, keys or codes held by named people — not on a hook at reception.</li>
<li><b>Badge readers</b>: each badge is personal, is disabled the day someone leaves, and every entry is logged.</li>
<li><b>Visitor rules</b>: sign in, wear a visitor badge, be escorted — and staff who politely challenge strangers, which is what defeats tailgating.</li>
<li><b>Console access</b>: a console password, a short <code>exec-timeout</code>, no laptop left plugged in. The console gives full control to whoever holds the cable.</li>
<li><b>Cameras and door alarms</b>, so an entry outside working hours is noticed — the detective control.</li>
</ul>
${K.dyk(`Every Cisco router and switch has a <b>password-recovery</b> procedure, built in on purpose so an owner who forgets the enable secret isn't locked out. It needs only physical access to the device — which is why physical security is the first layer: anyone who can touch the box can, given a few minutes, get in.`)}
${K.when([
  ["User awareness","People don't notice phishing, odd calls or strangers","Short reminders reach everyone and make staff early reporters","One team needs a specific procedure — that's training"],
  ["Training","A role must act safely: verify callers, confirm payments, configure devices","A procedure to follow under pressure, recorded","The message is for everyone — awareness repeats better"],
  ["Physical access control","Someone could touch the kit or enter staff areas","Otherwise unplugging or the console bypasses technical controls","Used alone — a lock doesn't stop a network or phone attack"],
], "Awareness, training or physical control?")}
${K.mistake(`Treating the comms cupboard as &ldquo;inside&rdquo;. Cleaners, contractors, other tenants and visitors all pass it. A broken lock plus a console with no password is an open door to the whole network — the job later in this lesson is exactly that.`)}
${K.case("The helpdesk call that opened a mailbox",`
<p>An Abuja logistics company, Monday 07:50. A caller says he is the Kano regional manager: at the airport, phone dead, presenting to the board at nine, password &ldquo;stopped working&rdquo;. He knows his line manager's name and the presentation's title — all public online. He sounds stressed and senior. The analyst resets the password and reads it out.</p>
<p><b>What the attacker was after:</b> one mailbox — the regional manager approves supplier payments. <b>Category:</b> vishing, with a pretext and false urgency. No device was misconfigured.</p>
<p><b>How it was noticed:</b> at 08:40 the real manager, in the Kano office, couldn't log in and called the helpdesk. The mail logs showed a 07:56 login from an unfamiliar country and a new rule forwarding invoices outside.</p>
<p><b>What would have stopped it, layer by layer:</b> <i>training</i> (reset only after calling back the directory number), <i>MFA</i> (the password alone wouldn't be enough), <i>awareness</i> (staff told this story is common), <i>monitoring</i> (an alert on new-country logins at 07:56, not 08:40).</p>
<p><b>What changed:</b> a call-back rule that day and MFA for email within the month. Nobody was disciplined: the process had no check in it, and blame only teaches people not to report.</p>`)}
${K.check({q:"After a simulated phishing campaign, 18 of the 60 finance staff typed their password into the test page; the rest of the company did far better. What is the best next step for the security programme?", o:["Block every email that contains a link","Targeted training for the finance team, who handle payments, while awareness for everyone continues","A stronger enable secret on every router","Lock the finance office"], a:1, why:"The weakness is a skill gap in one role that is a prime target, so training fits — specific, deeper and recorded — with ongoing awareness for everyone else. Blocking every link breaks normal work; router secrets and locks don't touch this weakness."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"An audit of a Port Harcourt clinic lists four findings. Match each with the control family that fixes it.", pairs:[["Staff can't tell a fake bank text message from a real one","User awareness"],["The helpdesk resets passwords for anyone who sounds confident on the phone","Training (a caller-verification procedure)"],["The comms-cupboard key hangs on a hook at reception","Physical access control"],["The edge router accepts Telnet with one shared password","A technical control (device configuration)"]], why:"1. What is asked? Which kind of control closes each finding. 2. Which rule? Everyone needs to recognise and report = awareness; a role needs a procedure = training; someone can reach the kit = physical; the weakness lives in a device = technical. 3. Apply it: the texts are an everyone problem; the helpdesk is one role's procedure; the key is physical; Telnet is configuration — and it's the next section's job."})}

<h2>What an exposed device looks like — and closing the obvious holes</h2>
${K.remember(`<b>The rule:</b> audit in the order an intruder meets the device. <b>1. Reach</b> — who gets a login prompt, over Telnet or SSH? <b>2. Login</b> — shared or named, plain or hashed? <b>3. Privilege</b> — what protects <code>enable</code>? <b>4. Idle</b> — do sessions close? <b>5. Warning</b> — a legal banner? <b>6. Saved</b>? Fix with Module 2's commands, then prove each fix from where the threat sits.`)}
<p>Everything so far becomes one practical skill: looking at a device and saying, with evidence, what's wrong. The commonest real finding isn't a clever attack — it's the installer's defaults, still there years later.</p>
<h3>Worked example: the library router</h3>
<p>A public library's one LAN, 192.168.1.0/24, is shared by staff PCs and twelve public PCs. A volunteer set up LIB-R1 (192.168.1.1) years ago. The question: can a member of the public reach its configuration?</p>
${K.steps([
  ["Reach — try it from where the threat sits", `<p>From PUBLIC-PC7, <code>telnet 192.168.1.1</code>:</p>${K.out(`User Access Verification

Password:`, "A Telnet login prompt on a public PC: one password stands between the public and the router, and Telnet carries it in readable text.")}`],
  ["Login and privilege — read the configuration", `<p>From the console (out-of-band, so VTY changes can't cut you off), <code>enable</code>, then:</p>${K.out(`LIB-R1#show running-config | include password|secret
no service password-encryption
enable password library
 password library
LIB-R1#show running-config | section line
line con 0
line vty 0 4
 exec-timeout 0 0
 password library
 login
 transport input telnet
LIB-R1#show ip ssh
SSH Disabled - version 1.99
%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).`, "Three commands, six findings; the full show running-config adds a seventh — no banner. ('atleast' is IOS's own spelling.)")}`],
  ["Write the findings down before you change anything", `<div class="tablewrap"><table>
<tr><th>#</th><th>Finding</th><th>Why it matters</th><th>Fix (Module 2)</th></tr>
<tr><td>1</td><td><code>transport input telnet</code>; SSH disabled</td><td>The password crosses the LAN readable (C)</td><td><code>ip domain name</code>, <code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>, <code>transport input ssh</code></td></tr>
<tr><td>2</td><td>One shared VTY password with <code>login</code></td><td>Nobody knows who logged in; leavers still know it</td><td><code>username … secret</code>, <code>login local</code>, <code>no password</code></td></tr>
<tr><td>3</td><td><code>enable password library</code>, no secret — the same word as the line</td><td>One readable word gives full control</td><td><code>enable secret</code>, then <code>no enable password</code></td></tr>
<tr><td>4</td><td><code>no service password-encryption</code></td><td>Passwords readable over a shoulder</td><td><code>service password-encryption</code> (type 7: casual eyes only)</td></tr>
<tr><td>5</td><td><code>exec-timeout 0 0</code> on the VTY lines</td><td>An abandoned session never closes</td><td><code>exec-timeout 5 0</code> (default 10 minutes)</td></tr>
<tr><td>6</td><td>Console: no password, no <code>login</code></td><td>Anyone with a cable gets a prompt</td><td><code>password</code>, <code>login</code>, <code>exec-timeout</code>; lock the cabinet</td></tr>
<tr><td>7</td><td>No banner</td><td>No authorised-users-only warning</td><td><code>banner motd</code></td></tr>
</table></div>`],
])}
<h3>Fixing it in a safe order</h3>
${K.steps([
  ["Work from the console", `<p>VTY changes can end or refuse remote sessions; the console isn't affected. Working remotely? Keep your session open and test from a second window first.</p>`],
  ["Privileged mode: add before you remove", `<p><code>enable secret Lib-Ex4mple!26</code>, then <code>no enable password</code>, then <code>service password-encryption</code>.</p>`],
  ["SSH and a named user", `<p><code>ip domain name library.example.net</code>, <code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>, <code>username amaka secret Am4ka-Ex4mple!</code>. Look for accounts you didn't create with <code>show running-config | include username</code>; delete one with <code>no username NAME</code>.</p>`],
  ["The VTY lines", `<p><code>line vty 0 4</code>: <code>login local</code>, <code>transport input ssh</code>, <code>exec-timeout 5 0</code> and <code>no password</code> (the shared word is no longer used).</p>`],
  ["The console and the banner", `<p><code>line con 0</code>: <code>password Con-Ex4mple!26</code>, <code>login</code>, <code>exec-timeout 5 0</code>. Then <code>banner motd #Authorised staff only. All access is logged.#</code></p>`],
  ["Prove it from the threat's seat, then save", `${K.out(`LIB-R1#show running-config | section line
line con 0
 exec-timeout 5 0
 password 7 08024340443C1D431F1B00016B7972
 login
line vty 0 4
 exec-timeout 5 0
 login local
 transport input ssh
LIB-R1#show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3`, "The console asks for a password and both lines time out; the VTY lines take SSH only and check named users.")}${K.out(`C:\\Users\\PUBLIC-PC7>telnet 192.168.1.1
Connecting To 192.168.1.1...Could not open connection to the host, on port 23: Connect failed

C:\\Users\\PUBLIC-PC7>ssh -l amaka 192.168.1.1
(amaka@192.168.1.1) Password:`, "From the public PC: Telnet refused; SSH wants a named user's password.")}<p>Then <code>copy running-config startup-config</code>. A Telnet session already open when you changed the lines stays up until it ends — check <code>show users</code>.</p>`],
])}
${K.mistake(`Removing the old enable password before adding the secret. Privileged mode then has no password: the console goes straight in, but over a VTY session IOS refuses with <code>% No password set</code> — working remotely, you've locked yourself out of privileged mode. Add <code>enable secret</code> first, then <code>no enable password</code>.`)}
${K.dyk(`With a Telnet line password, IOS closes the connection after three wrong tries with <code>% Bad passwords</code>. It sounds like protection, but the same source can reconnect at once and by default nothing is logged. Real protection is lesson 2's: <code>login block-for</code> pauses logins after repeated failures, and every failure is logged.`)}
<h3>Try it: the Kano warehouse switch</h3>
<p>The Kano warehouse from the risk-section practice: the label printer has moved to Gi0/3 in the back office, and the reception wall port, Gi0/8, is spare but still live. Fix what the console can; remote access is the bench after this.</p>
${K.term({env:"ios2", title:"KAN-WH-SW3 — close the holes you can fix from the console", opts:{kind:"switch", host:"KAN-WH-SW3", model:"C9200L-24T-4G", motd:"KAN-WH-SW3 — console session in the warehouse comms cabinet (lab switch).", hooks:{linkUp:n=>["GigabitEthernet0/1","GigabitEthernet0/2","GigabitEthernet0/3"].includes(n)}},
  setup:env=>{ ["enable","configure terminal","hostname KAN-WH-SW3","enable secret Kan0!Wh#Sec26","no ip domain-lookup","interface vlan 1","ip address 10.81.0.3 255.255.255.0","no shutdown","exit","ip default-gateway 10.81.0.1","interface g0/1","description UPLINK KAN-WH-R1","interface g0/2","description FORKLIFT-TERMINAL","interface g0/3","description LABEL-PRINTER","interface g0/8","description RECEPTION WALL PORT","exit","line con 0","exec-timeout 0 0","exit","line vty 0 15","password wh2019","login","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; if (env.log) env.log.length=0; },
  intro:"Enable secret (build sheet): <code>Kan0!Wh#Sec26</code> — a lab example; pick your own for anything new. Gi0/1–Gi0/3 are in use; Gi0/4–Gi0/7 are empty.",
  tasks:[
    {text:"<code>enable</code>, then audit: <code>show running-config | include password|secret</code>, <code>show running-config | section line</code> and <code>show interfaces status</code>. Which findings could someone standing at this cabinet use?", done:e=>e.mode!=="user" && e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*i\S*\s+pass/i.test(h)) && e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*sec\S*\s+line/i.test(h)) && e.history.some(h=>/sh\S*\s+int\S*\s+stat/i.test(h))},
    {text:"<code>configure terminal</code>, <code>service password-encryption</code>, then <code>do show running-config | include password</code>. What changed for <code>wh2019</code> — and why is it still a finding?", done:e=>!!e.servicePwEnc},
    {text:"The console: <code>line console 0</code>, a <code>password</code>, <code>login</code> and <code>exec-timeout 5 0</code>", done:e=>!!e.lines.con.password && !!e.lines.con.login && !!e.lines.con.timeout && e.lines.con.timeout!=="0 0"},
    {text:"Shut every port with nothing on it in one go — Gi0/4 to Gi0/8 (the public wall port included) and the two empty SFP slots, Gi0/9–Gi0/10: <code>interface range g0/4 - 10</code>, <code>shutdown</code>. Leave Gi0/1–Gi0/3 up.", done:e=>[4,5,6,7,8].every(n=>e.intfs["GigabitEthernet0/"+n].shut) && [1,2,3].every(n=>!e.intfs["GigabitEthernet0/"+n].shut)},
    {text:"A <code>banner motd</code> that says access is for authorised users only", done:e=>e.banner!=null && /authori[sz]ed/i.test(e.banner)},
    {text:"<code>end</code>, check with <code>show interfaces status</code>, and save: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.mode==="priv"},
  ],
  win:"From the console alone: type 7 line passwords (unreadable at a glance, not protection), a console that asks for a password and logs out after five idle minutes, every unused port — the public wall port among them — shut, and a legal banner, all saved. The VTY lines still take the shared word wh2019 over Telnet: that is exactly what SSH with named users fixes, on a router, in the bench below.",
  solve:["enable","Kan0!Wh#Sec26","show running-config | include password|secret","show running-config | section line","show interfaces status","configure terminal","service password-encryption","do show running-config | include password","line console 0","password C0ns!Kano26","login","exec-timeout 5 0","exit","interface range g0/4 - 10","shutdown","exit","banner motd #Authorised staff only. Disconnect now if you are not authorised.#","end","show interfaces status","copy running-config startup-config",""]})}
${K.hint(`Task 1: the enable secret is type 9 — fine. The findings: plain-text <code>wh2019</code> on both VTY blocks, a console with no password and <code>exec-timeout 0 0</code>, and empty ports left enabled. Task 2: type 7 reverses in seconds (Module 2), so the shared password still has to go.`)}
${K.check({q:"After the library fixes, PUBLIC-PC7 can still open an SSH connection to LIB-R1 and gets a password prompt. What is true?", o:["The fixes failed — SSH should have refused the connection","That is expected: SSH removed readable passwords and the shared login, but keeping public PCs away from the prompt altogether needs a VTY access list (lesson 4) or a separate staff VLAN","The banner is missing","service password-encryption should have blocked it"], a:1, why:"transport input ssh decides which protocol is accepted, not who may connect. The public now needs a named user's secret — far lower risk; restricting who reaches the prompt is another layer (access-class in lesson 4, or separate VLANs)."})}

<h3>Hands-on: the router the clinic's auditor flagged</h3>
<p>A Port Harcourt clinic's audit report: &ldquo;PHC-R1 accepts Telnet from the staff LAN <i>and the guest Wi-Fi</i>, with one shared password; no enable secret.&rdquo; Prove it, close it, prove it again — and expect a hole the library didn't have.</p>
${K.bench({id:"m8-exposed-router", points:100, from:"CCNA · Module 8 · lesson 1", title:"Port Harcourt clinic: prove the auditor's finding, close the holes, prove it again", viewBox:"0 0 760 400",
  intro:"<b>Build sheet:</b> PHC-R1 Gi0/0 = staff LAN 10.70.4.0/24 (gateway .1); Gi0/1 = guest Wi-Fi 10.70.9.0/24 (gateway .1). GUEST-LAPTOP stands in for any guest device (the access point isn't drawn). The installer's password for everything: <code>phc123</code> (a lab example). Console on PHC-R1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. Choose your own example passwords for the new secret, user and console, and note them for task 7.",
  devices:[
    {id:"r1", kind:"router", label:"PHC-R1", x:330, y:20, config:e=>{ ["en","conf t","hostname PHC-R1","no ip domain-lookup","enable password phc123","username installer password phc123","int g0/0","description STAFF LAN","ip address 10.70.4.1 255.255.255.0","no shut","int g0/1","description GUEST WIFI","ip address 10.70.9.1 255.255.255.0","no shut","exit","line con 0","exec-timeout 0 0","exit","line vty 0 4","password phc123","login","transport input telnet","exec-timeout 0 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"PHC-SW1", x:40, y:150},
    {id:"adm", kind:"pc", label:"ADMIN-PC", x:40, y:290, ip:"10.70.4.20", mask:"255.255.255.0", gw:"10.70.4.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:330, y:290},
    {id:"gst", kind:"laptop", label:"GUEST-LAPTOP", x:620, y:150, ip:"10.70.9.30", mask:"255.255.255.0", gw:"10.70.9.1"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"adm:eth", b:"sw:g2"}, {type:"cat6", a:"gst:eth", b:"r1:g1"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the finding from the guest network. On GUEST-LAPTOP, <code>telnet 10.70.9.1</code> (the router's guest-side address) and mistype the password three times: what does PHC-R1 do, and what stops you trying again straight away? Then connect again, log in with <code>phc123</code>, <code>enable</code> (same password), and <code>exit</code>", done:B=>Bench.loginFailures(B,"r1")>=3 && Bench.tried(B,"gst",/^\s*en\S*\s*$/i)},
    {text:"Console to PHC-R1, <code>enable</code>, and audit before you change anything: <code>show running-config</code> and <code>show ip ssh</code>. List every hole — there are more than in the library example", done:B=>{ const h=B.devs.r1.env.history; return h.some(x=>/^\s*sh\S*\s+run/i.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ssh/i.test(x)); }},
    {text:"Privileged mode, in the safe order: <code>enable secret</code> (your own example), then <code>no enable password</code>, then <code>service password-encryption</code>", done:B=>{ const e=B.devs.r1.env; return !!e.enableSecret && !e.enablePassword && !!e.servicePwEnc; }},
    {text:"Accounts: the audit found a local account you didn't create. Delete it with <code>no username installer</code> (removes that local user), then create your own with <code>username</code> <i>name</i> <code>secret</code> <i>password</i>. Why must the old account go before the VTY lines use <code>login local</code>?", done:B=>{ const u=B.devs.r1.env.users; return !u.installer && Object.values(u).some(x=>!!x.secret); }},
    {text:"SSH only on the VTY lines: the Module 2 prerequisites (<code>ip domain name</code>, <code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>), then under <code>line vty 0 4</code>: <code>login local</code>, <code>transport input ssh</code>, <code>exec-timeout 5 0</code> and <code>no password</code>", done:B=>{ const e=B.devs.r1.env, v=e.lines.vty; return e.sshReady() && !!v.loginLocal && v.transport==="ssh" && !v.password && !!v.timeout && v.timeout!=="0 0"; }},
    {text:"The console and the banner: under <code>line con 0</code> a password with <code>login</code> and an <code>exec-timeout</code> that isn't 0 0; then a <code>banner motd</code> saying access is for authorised users only", done:B=>{ const e=B.devs.r1.env, c=e.lines.con; return ((!!c.login && !!c.password) || !!c.loginLocal) && c.timeout!=="0 0" && e.banner!=null && /authori[sz]ed/i.test(e.banner); }},
    {text:"Prove it from where the threats sit. GUEST-LAPTOP: <code>telnet 10.70.9.1</code> again — what now? ADMIN-PC: <code>ssh -l</code> with your new user to 10.70.4.1, <code>enable</code> with the new secret, then <code>show users</code>", done:B=>{ const s=Bench.session(B,"adm"); return !!s && s.proto==="ssh" && B.devs.r1.env.lines.vty.transport==="ssh" && Bench.tried(B,"adm",/show\s+users/i) && Bench.tried(B,"gst",/^\s*telnet\b/i); }},
    {text:"Save from your SSH session: <code>copy running-config startup-config</code>", done:B=>!!B.devs.r1.env.savedOnce},
  ],
  win:"The auditor's line is closed with evidence. Before: the guest Wi-Fi reached a Telnet prompt, three wrong guesses only closed one connection, and one word — phc123 — opened the line, privileged mode and a forgotten installer account. After: Telnet is refused, SSH checks your own named user, privileged mode needs a hashed secret, idle sessions close, the banner warns, and it's saved. The guest network can still reach the SSH prompt — keeping it out altogether is lesson 4's access-class.",
  solve:[["pc","gst","telnet 10.70.9.1"],["pc","gst","phc12"],["pc","gst","phc1234"],["pc","gst","pch123"],["pc","gst","telnet 10.70.9.1"],["pc","gst","phc123"],["pc","gst","enable"],["pc","gst","phc123"],["pc","gst","exit"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","phc123"],["term","show running-config"],["term","show ip ssh"],
    ["term","configure terminal"],["term","enable secret Phc!Edge#2026"],["term","no enable password"],["term","service password-encryption"],
    ["term","no username installer"],["term","username tobi secret Tob1!Phc#26"],
    ["term","ip domain name phc.example.com"],["term","crypto key generate rsa modulus 2048"],["term","ip ssh version 2"],
    ["term","line vty 0 4"],["term","login local"],["term","transport input ssh"],["term","exec-timeout 5 0"],["term","no password"],["term","exit"],
    ["term","line con 0"],["term","password C0nsole!Phc26"],["term","login"],["term","exec-timeout 10 0"],["term","exit"],
    ["term","banner motd #Authorised access only. Activity is monitored and logged.#"],["term","end"],
    ["pc","gst","telnet 10.70.9.1"],["pc","adm","ssh -l tobi 10.70.4.1"],["pc","adm","Tob1!Phc#26"],["pc","adm","enable"],["pc","adm","Phc!Edge#2026"],["pc","adm","show users"],
    ["pc","adm","copy running-config startup-config"],["pc","adm",""]]})}
${K.hint(`Task 1: <code>% Bad passwords</code> closes one connection; the next <code>telnet</code> gets three fresh tries. Task 2: don't miss the <code>username installer</code> line. Task 4: <code>login local</code> admits <i>every</i> local account — keep the installer's and phc123 still opens the router, now by SSH. Task 7: the guest's Telnet should end in <code>Connect failed</code>.`)}
${K.mistake(`Turning on <code>login local</code> without reading the local user list first. Every <code>username</code> line becomes a way in — including an installer's account from five years ago with the shared password. Run <code>show running-config | include username</code>, delete what isn't yours or isn't needed with <code>no username NAME</code>, and give each engineer their own account.`)}
${K.job("“Ward 4's comms cupboard was open — and the switch was logged in”",`
<p><b>The report.</b> Tuesday 14:10, a teaching hospital in Ibadan. The facilities walk-round found Ward 4's comms cupboard propped open, a laptop on the floor with a console cable into WARD-SW2, and its terminal showing <code>WARD-SW2#</code>. Nobody claims the laptop.</p>
<p><b>Questions first.</b> Is anyone working on it? (No change booked; the last work was a contractor's VLAN change on Friday.) Is the prompt live, and at what level? Was anything changed? Are other cupboards the same?</p>
<p><b>Checks.</b> Take over the session — don't unplug yet; it's evidence:</p>
${K.out(`WARD-SW2#show users
    Line       User       Host(s)              Idle       Location
*  0 con 0                idle                 00:00:00
WARD-SW2#show running-config | section line con
line con 0
 exec-timeout 0 0
WARD-SW2#show logging | include CONFIG_I
WARD-SW2#`, "Only the console is in use. It asks for no password and never times out. No configuration change in the log buffer.")}
<p><b>Reading it.</b> No console password and <code>exec-timeout 0 0</code>: Friday's contractor session, left at privileged EXEC, never closed — four days of full control for anyone passing. The empty <code>CONFIG_I</code> search says nothing changed since the buffer started; the buffer is small (Friday's own change has already scrolled out) and lost on a reload, so you also compare the running-config with Friday's backup and check the syslog server (Module 7). Both match.</p>
<p><b>Fix.</b> On the console:</p>
${K.out(`WARD-SW2#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
WARD-SW2(config)#line con 0
WARD-SW2(config-line)#password Ward-Con!Ex26
WARD-SW2(config-line)#login
WARD-SW2(config-line)#exec-timeout 5 0
WARD-SW2(config-line)#end
WARD-SW2#show running-config | section line con
line con 0
 exec-timeout 5 0
 password 7 046C0A140B6C6F410758200F405D
 login`, "Trimmed (the %SYS-5-CONFIG_I line after end). service password-encryption was already on, so the new password is stored as type 7.")}
<p>Then <code>copy running-config startup-config</code>, hand the laptop to security, and ask facilities to repair the lock. Over SSH, <code>show running-config | section line con</code> on the other ward switches finds two more with <code>exec-timeout 0 0</code>; fix those too.</p>
<p><b>What you say</b> (to facilities and your IT manager): &ldquo;The console had no password and never logged out, so Friday's contractor session stayed open in an unlocked cupboard. Nothing was changed — I've checked the logs and the backup. The console now needs a password and logs out after five minutes, on two other switches too. The real fix is the door: can the lock be repaired today, and badge readers go on the comms cupboards next quarter?&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;14:10 Ward 4 cupboard open, unknown laptop on WARD-SW2 console at priv EXEC (console: no password, exec-timeout 0 0, since Friday's contractor work). No config change (log, backup, syslog). Console now password + login + exec-timeout 5 0, saved; same on WARD-SW5/SW7. Laptop to security. Lock repair today; badge readers requested. Contractors to be briefed: exit before leaving.&rdquo;</i></p>`)}
${K.myth([
  ["Security is the firewall's job.","A firewall is one layer. This lesson's findings — Telnet, shared passwords, an open console, an unlocked cupboard — sit behind it, and social engineering goes round it."],
  ["Attacks come from outside the building.","Threats include insiders: careless staff, former employees who know a shared password, contractors, guests on the Wi-Fi — so the bench tests from the guest network."],
  ["A strong password makes Telnet safe.","Telnet sends the password as readable text however strong it is. Length protects against guessing; only encryption (SSH) protects against someone reading the traffic."],
])}
${K.dodont([
  "Audit before you change; record each finding with its evidence.",
  "Work from the console when you change how remote logins work.",
  "Add enable secret before removing enable password; check the user list before login local.",
  "Test from where the threat sits — the guest network, a public PC.",
  "Give every engineer a named account; remove accounts the day someone leaves.",
],[
  "Don't leave exec-timeout 0 0, or a laptop on a console, anywhere.",
  "Don't reuse one password for the lines, enable and every device.",
  "Don't treat type 7 or a 'strong' Telnet password as protection.",
  "Don't remove Telnet over a Telnet session before SSH is proven.",
])}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A different site: an Abuja branch switch. Which three statements describe real holes in this configuration? (Choose three.)", ex:"ABJ-BR-SW1#show running-config | include password|secret|username\nservice password-encryption\nenable secret 9 $9$Hq3Lr8zK1vNcPe$Zt0yH1xQm7Gf2kWb9sLd4RcVa6Ej8uTn5pYo0iXzMw2\nusername ngozi secret 9 $9$Pw7Tq2sKd9LmXe$Rb4Nf8hC1yJ6uVt3aZq0oWs5Ge2iKl7Dp9Mn4Xc8Hv0\n password 7 05080F1C22434B0C1D\n password 7 05080F1C22434B0C1D\nABJ-BR-SW1#show running-config | section line vty\nline vty 0 4\n exec-timeout 0 0\n password 7 05080F1C22434B0C1D\n login\n transport input telnet ssh\nline vty 5 15\n exec-timeout 0 0\n password 7 05080F1C22434B0C1D\n login\n transport input telnet ssh", o:["The VTY lines still accept Telnet, so a password typed there crosses the network as readable text","The VTY lines check a shared line password (login, not login local), so ngozi's account is never used and the logs can't say who logged in","exec-timeout 0 0 means abandoned remote sessions never close","The enable secret is type 9, which can be reversed in seconds","service password-encryption is on, so the type 7 line passwords are safe to share","Because ngozi has a secret, her Telnet sessions are encrypted"], a:[0,1,2], why:"1. What is asked? Which lines are real holes. 2. Which rule? Walk the audit order: reach (Telnet or SSH?), login (shared or named?), privilege, idle. 3. Apply it: transport input telnet ssh still allows Telnet; login uses the shared type 7 password, so the named account is ignored; exec-timeout 0 0 never closes a session. Type 9 is a strong one-way hash, type 7 reverses in seconds (Module 2), and a secret stored on the switch doesn't encrypt Telnet traffic. Fix: login local, transport input ssh, exec-timeout 5 0 and no password on both VTY ranges."})}

<h2>Interview corner</h2>
${K.hint(`Pick one example and walk it along the chain: who, how, what weakness, what asset.`)}
${K.reveal("“What's the difference between a threat, a vulnerability and an exploit?”",`<p>"A vulnerability is the weakness, a threat is whoever or whatever could use it, and an exploit is the way it's used. On a branch router that accepts Telnet with a shared password, the vulnerability is Telnet plus that password; the threat is anyone on the LAN or guest Wi-Fi, or a former employee; the exploit is logging in with it. Risk — likelihood times impact — is high. I can't remove the threat, so I remove the vulnerability: SSH only, named users, an enable secret, a VTY access list."</p>`)}
${K.hint(`Layers, a failure in one layer, and the next layer catching it.`)}
${K.reveal("“What is defence in depth? Give a network example.”",`<p>"Several independent layers, so one failure isn't the end. At a branch: a locked, badge-controlled comms cabinet; SSH only with named users and an enable secret; ACLs keeping the guest VLAN away from servers and management addresses; port security, DHCP snooping and DAI on access ports; syslog and NTP to a server someone watches; phishing awareness for staff. If someone is phished and their laptop infected, the ACLs and switch-edge controls limit what it reaches, and the logs tell us."</p>`)}
${K.hint(`Audit first; console; add before remove; test SSH before removing Telnet; prove from the threat's side; save; report what's left.`)}
${K.reveal("“You inherit a router that accepts Telnet with one shared password. What do you do?”",`<p>"First the evidence: show running-config, show ip ssh, and a Telnet attempt from networks that shouldn't reach it. Then, from the console or with a second session open, a safe order: enable secret, then no enable password and service password-encryption; domain name, RSA key, ip ssh version 2; my own username with a secret, after deleting old local accounts; then login local, transport input ssh, an exec-timeout and a banner. I prove it — Telnet refused, SSH working — save, and note what's still open, such as a VTY access list."</p>`)}

${K.recap([
  "CIA: confidentiality, integrity, availability — name the letter an incident damages first.",
  "A threat uses an exploit against a vulnerability to harm an asset. Risk = likelihood × impact. A mitigation breaks the chain — usually by removing the vulnerability.",
  "Recognise an attack by what the attacker is after and what you notice — reconnaissance, DoS/DDoS, spoofing, MITM, malware, social engineering and phishing, password attacks — then match the control.",
  "Defence in depth: people, physical, network filtering, switch edge, device access — with monitoring watching all of them.",
  "A security programme: user awareness (everyone recognises and reports), training (each role's procedures), physical access control (locked rooms, badges, visitor rules, the console).",
  "Audit in the order an intruder meets the device: reach, login, privilege, idle, warning, saved — and prove each fix from where the threat sits.",
  "Safe order: console; enable secret before no enable password; SSH prerequisites and your own user (old accounts gone) before login local and transport input ssh; save.",
])}
${K.next(`<b>Lesson 2 — Device access control and password policy.</b> What this lesson's bench still lacked: password types and why type 7 isn't protection, <code>algorithm-type scrypt</code>, minimum lengths, <code>login block-for</code> and failure logging (the answer to <code>% Bad passwords</code>), <code>show login</code> — and password policy: length, password managers and MFA.`)}
`,
quiz:[
  {lvl:1, q:"Ransomware encrypts every document on a school's file server. The files are still there, but nobody can open them. Which CIA property is damaged most directly?", o:["Confidentiality","Integrity","Availability","None — the files weren't deleted"], a:2, why:"The data exists but can't be used when it's needed: availability. Many ransomware groups also copy data before encrypting it, which adds a confidentiality breach — but the property damaged first and most directly is availability. Offline backups are the main recovery control."},
  {lvl:1, type:"match", q:"Match each security term with its meaning.", pairs:[["Asset","Something of value the organisation protects"],["Threat","Someone or something that could cause harm"],["Vulnerability","A weakness that could be used"],["Exploit","The method that takes advantage of a specific weakness"],["Mitigation","A control that reduces the risk"]], why:"A threat uses an exploit against a vulnerability to harm an asset; a mitigation breaks that chain. Risk combines how likely that is with how bad it would be."},
  {lvl:1, type:"order", q:"Put the links of the attack chain in order, from the start of an attack to the harm.", items:["A threat — who or what could cause harm","uses an exploit — the method","against a vulnerability — the weakness","to harm an asset — what you value"], why:"Threat → exploit → vulnerability → asset. Controls can act on any link: you can't usually remove the threat, but you can remove the vulnerability, make the exploit harder, detect it sooner or limit the damage."},
  {lvl:2, q:"A Lagos fintech's risk register has four entries. Which one is a vulnerability?", o:["A criminal group known to target payment companies","The customer database","The edge router still runs an IOS release with a published security flaw","Upgrading the edge router to the fixed IOS release"], a:2, why:"The unpatched flaw is the weakness: a vulnerability. The criminal group is a threat, the customer database is an asset, and the upgrade is the mitigation. Exam trap: options that name a real danger (the group) when the question asks for the weakness."},
  {lvl:1, q:"What makes a DDoS attack different from a DoS attack?", o:["It targets confidentiality instead of availability","The attack traffic comes from many sources at once, so blocking one address doesn't stop it","It always needs malware on the victim's own PCs","It can only target web servers"], a:1, why:"Both aim at availability. Distributed means many sources — often thousands of compromised devices, or innocent servers replying in a reflection attack — so filtering one address is useless, and a full link has to be cleaned upstream by the ISP or a scrubbing service."},
  {lvl:2, type:"match", q:"Match each approach with its social-engineering category.", pairs:[["An email to all staff: 'Your mailbox is full — log in here to keep your messages'","Phishing"],["A text message: 'Your salary payment failed — confirm your bank login at this link'","Smishing"],["A phone call from 'IT support' asking for your password to fix your account","Vishing"],["An email to the chief executive naming a real supplier and a real board meeting, asking her to approve a transfer","Whaling"],["Someone without a badge follows staff through the secure door carrying boxes","Tailgating"]], why:"Mass email = phishing; by text = smishing; by voice = vishing; aimed at a senior executive with real details = whaling (a kind of spear phishing); following someone through a controlled door = tailgating, a physical form of social engineering."},
  {lvl:2, q:"Syslog shows 300 failed SSH logins for the user admin in ten minutes, trying passwords such as password, welcome1, letmein, admin123 and qwerty. What is this, and which controls help most?", o:["Brute force — a longer banner","A dictionary attack — common passwords from a list; long, uncommon passphrases, no account called admin, and blocking logins after repeated failures","Reconnaissance — an ACL on the user's PC","Man-in-the-middle — DHCP snooping"], a:1, why:"Trying common words and passwords from a list is a dictionary attack; brute force would try every combination. It works only if the password is on such a list, so long uncommon passphrases defeat it; login blocking and failure logging (lesson 2) slow it and make it visible, and a non-obvious username removes half of the guesswork."},
  {lvl:1, q:"A monthly two-minute email shows every employee a real phishing example and how to report one. Which security-programme element is this?", o:["User awareness","Role-specific training","Physical access control","A technical control"], a:0, why:"Short, repeated messages aimed at everyone, so they recognise and report threats, are awareness. Training is deeper and role-specific (the helpdesk's caller-verification procedure); physical access control is locks, badges and visitor rules."},
  {lvl:2, type:"multi", q:"Which two of these are physical access controls? (Choose two.)", o:["A badge reader on the comms-room door that logs each entry","A locked rack cabinet whose key is signed out to named engineers","enable secret on every router","A monthly phishing-awareness email","transport input ssh on the VTY lines"], a:[0,1], why:"Badges and locked cabinets control who can physically reach the equipment. enable secret and transport input ssh are technical controls configured on devices; the email is user awareness."},
  {lvl:2, type:"fill", q:"Type the line-configuration command for each job on a router's VTY lines.", fields:[{label:"Accept SSH only", a:["transport input ssh"], ios:true},{label:"Log out a session after 5 idle minutes", a:["exec-timeout 5 0","exec-timeout 5"], ios:true}], why:"transport input ssh refuses Telnet on those lines (it needs the RSA key and a local user to be useful). exec-timeout takes minutes and seconds; 5 0 is five minutes. exec-timeout 0 0 means never — the classic finding."},
  {lvl:1, type:"fill", q:"Which global configuration command converts every plain-text password in the configuration to type 7?", fields:[{label:"Command", a:["service password-encryption"], ios:true}], why:"service password-encryption scrambles line passwords, any enable password and username … password entries into type 7. It doesn't touch enable secret or username … secret, which are already hashed — and type 7 is reversible, so it only stops casual eyes."},
  {lvl:2, q:"After a hardening change, nobody can log in to BR-R4 remotely, and Telnet attempts are refused too. Based on the exhibit, what is missing?", ex:"BR-R4#show ip ssh\nSSH Disabled - version 1.99\n%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).\nBR-R4#show running-config | section line vty\nline vty 0 4\n login local\n transport input ssh", o:["An RSA key pair — crypto key generate rsa, which needs a hostname and ip domain name — so SSH isn't running, and transport input ssh refuses Telnet as well","An enable secret","service password-encryption","A banner motd"], a:0, why:"SSH Disabled with 'Please create RSA keys' means the router can't run SSH yet. With transport input ssh the lines accept nothing else, so every remote login fails. Set ip domain name, crypto key generate rsa modulus 2048 and ip ssh version 2 — from the console, since nobody can get in remotely."},
  {lvl:2, q:"Which statement about privileged access on BR-R2 is true?", ex:"BR-R2#show running-config | include password|secret\nno service password-encryption\nenable secret 9 $9$Wq1Lr8zK3vNcPe$Ab4Cd8eF1gH6iJ3kL0mN5oP2qR7sT9uV4wX8yZ0aB2c\nenable password Branch2!\n password Branch2!", o:["enable asks for Branch2!, because the enable password was configured last","enable asks for the enable secret, because the secret wins when both exist — but the plain-text enable password is still a finding: it matches the line password, and anyone who reads the configuration learns it","Both passwords are accepted at the enable prompt","The enable password is harmless because an enable secret exists"], a:1, why:"When both exist, IOS uses the enable secret. The leftover enable password is still readable in every backup and is the same as the line password, so anyone who learns one learns both — and it may be reused on other devices. Fix: no enable password and service password-encryption, then replace the shared line password with named users over SSH."},
  {lvl:3, q:"A contractor plugs an infected laptop into a meeting-room wall port at a bank branch. The malware tries to reach the branch servers and the routers' login prompts. Which approach limits the damage best?", o:["Several layers: port security on the wall port, ACLs that keep the meeting-room VLAN away from the servers and management addresses, SSH with named users on the devices, and logs someone watches","An enable secret and SSH on every router — device access is the layer that matters","Anti-malware on the servers alone — the network can't help once the laptop is plugged in","Locking the comms room"], a:0, why:"Each wrong option is one layer on its own, and each can fail: device access doesn't stop the malware reaching servers, server anti-malware misses new strains, and the comms room isn't where the laptop is. Defence in depth stacks the switch edge, network filtering, device access and monitoring so a failure in one is caught by the next."},
  {lvl:3, q:"A guest laptop's Telnet window showed the exhibit after three password attempts against a clinic router's guest-side address. What does it show, and what is the most important first fix?", ex:"User Access Verification\n\nPassword:\nPassword:\nPassword:\n% Bad passwords", o:["The router locked the guest out for good, so nothing more is needed","The guest network reaches a Telnet login protected only by a line password; three wrong tries close one connection, but the guest can reconnect at once and nothing is logged by default. First fix: SSH only with named users and secrets — then an access-class (lesson 4) to keep the guest network away from the prompt","The router is under a DDoS attack, so call the ISP","DHCP snooping is missing on the guest VLAN"], a:1, why:"'User Access Verification' with only a Password prompt means a line password (login, not login local), and the prompt came over Telnet from the guest network. % Bad passwords closes that connection only — no lockout, no log by default. Removing Telnet and the shared password removes the vulnerability; access-class and login block-for (lessons 4 and 2) add layers."},
  {lvl:3, type:"order", q:"You must move BR-R7, 600 km away, from Telnet to SSH, and your only way in is your current Telnet session. Put the steps in the order that never locks you out.", items:["Prepare SSH: ip domain name, crypto key generate rsa modulus 2048, and username … secret for yourself","Under line vty 0 4: login local and transport input telnet ssh","From a second window, log in by SSH with the new user and test enable","Under line vty 0 4: transport input ssh","copy running-config startup-config"], why:"The key and your account must exist before the lines rely on them. login local with transport input telnet ssh lets both protocols in while you test — your open Telnet session isn't dropped. Only after a proven SSH login (and a working enable) do you remove Telnet, and you save once it's proven. Removing Telnet first, or forgetting the user before login local, means a drive to the branch."},
],
cards:[
  {f:"CIA triad", b:"Confidentiality: only the right people can read it. Integrity: nobody changed it without being noticed. Availability: it works when it's needed. Every incident damages at least one — name it first."},
  {f:"Threat, vulnerability, exploit", b:"Vulnerability = the weakness (Telnet + shared password). Threat = who or what could use it (a guest, a former employee, malware). Exploit = the way it's used (logging in with the password)."},
  {f:"Risk and mitigation", b:"Risk = likelihood × impact. A mitigation reduces it by removing the vulnerability, making the exploit harder, detecting it sooner or limiting the damage. You rarely remove the threat."},
  {f:"Kinds of control", b:"Technical (configured in devices), administrative (policies, processes, training), physical (locks, badges, cameras). By timing: preventive, detective, corrective."},
  {f:"Reconnaissance", b:"Information gathering before an attack: what answers, what runs, who works there. Noticed as one source probing many addresses or ports. Stopped by tight ACLs, unused services off, logs someone reads."},
  {f:"DoS vs DDoS", b:"Both attack availability. DDoS comes from many sources at once (sometimes as replies from innocent servers: reflection and amplification), so blocking one address fails. A full link must be cleaned upstream (ISP or scrubbing service)."},
  {f:"Spoofing and man-in-the-middle", b:"Spoofing: pretending to be another address, device or person. MITM: sitting between two parties to read or change traffic. Stopped by port security, DHCP snooping, DAI and encryption that authenticates the other end (SSH, HTTPS, VPNs)."},
  {f:"Malware types", b:"Virus: attached to a file, needs a person to run it. Worm: spreads across the network by itself. Trojan: disguised as a useful program. Ransomware: encrypts data and demands payment (availability)."},
  {f:"Social-engineering variants", b:"Phishing: mass fake messages. Spear phishing: targeted at a person or team. Whaling: targeted at senior executives. Vishing: by phone. Smishing: by text. Tailgating: following someone through a secured door."},
  {f:"Password attacks", b:"Guessing: likely passwords and defaults. Dictionary: every entry in a list of common passwords and words. Brute force: every combination. Defences: long passphrases, no defaults, hashed storage, login blocking, MFA."},
  {f:"Defence in depth", b:"Independent layers so one failure isn't the end: people, physical, network filtering (ACLs), switch edge (port security, snooping, DAI), device access (SSH, secrets, AAA), with monitoring watching them all."},
  {f:"Security programme elements (CCNA 5.2)", b:"User awareness (everyone recognises and reports), training (role-specific procedures), physical access control (locked rooms, badges, visitor rules, console access). Know it, do it, lock it."},
  {f:"Auditing an exposed device", b:"In the order an intruder meets it: reach (Telnet or SSH, from where?), login (shared or named?), privilege (enable secret?), idle (exec-timeout 0 0?), warning (banner?), saved. Prove each fix from where the threat sits."},
  {f:"Safe hardening order", b:"Work from the console. enable secret, then no enable password, then service password-encryption. Domain name, RSA key, ip ssh version 2, your own username … secret (delete old accounts). Then login local, transport input ssh, exec-timeout, banner. Test, then save."},
],
});

// ---------- Module 8 · Lesson 2 ----------
L.push({
id:"sec-access", mins:100, level:"Intermediate · builds on Module 2 lessons 5–6 and lesson 1",
t:"Device access control: password types, local users, login blocking and logging, banners — and password policy",
html:`
${K.goals([
  "Read any IOS running-config and say, for every password line, whether someone holding the file could read it or only guess it — and how slowly (types 0, 5, 7, 8, 9).",
  "Create local users with <code>algorithm-type scrypt</code>, replace an <code>enable password</code> with a type 9 <code>enable secret</code>, and enforce a minimum length with <code>security passwords min-length</code>.",
  "Configure <code>login block-for</code>, a quiet-mode exemption and login logging, then read <code>show login</code> and %SEC_LOGIN messages to say who is failing.",
  "Choose between <code>banner motd</code> and <code>banner login</code> by what console and SSH users see, and when.",
  "Explain a modern password policy (length, no scheduled changes, breach screening, vaults, no sharing) and when MFA, certificates or biometrics fit.",
])}
${K.pre([
  "Module 2 lessons 5–6: <code>enable secret</code> vs <code>enable password</code>, the password-type table (0, 5, 7, 8/9), <code>service password-encryption</code>, console and VTY lines, <code>exec-timeout</code>, <code>banner motd</code>, and SSH (<code>ip domain name</code>, <code>crypto key generate rsa</code>, <code>username … secret</code>, <code>login local</code>, <code>transport input ssh</code>).",
  "Module 7: the standard access list (<code>ip access-list standard NAME</code>, <code>permit</code>, <code>remark</code>) as a &ldquo;who&rdquo; list, and syslog severities.",
  "Lesson 1: password attacks (guessing, dictionary, brute force) and why they work.",
])}

<h2>Why this matters at work</h2>
<p>A Port Harcourt fintech has passed its first external audit with one finding marked <b>high</b>: &ldquo;Network devices: local accounts stored with reversible encoding; shared enable password; no protection against repeated login attempts; idle sessions never time out.&rdquo; The CTO wants it closed before the regulator's visit in three weeks. Your lead hands you the list of 40 switches and routers and one sentence: &ldquo;Fix it everywhere, prove it, and don't lock the NOC out while you do it.&rdquo;</p>
<p>Every word of that finding can be checked and changed from the CLI. Module 2 gave you SSH and the first passwords; this lesson is about <b>how strong those locks really are</b> — how IOS stores what you type, how to forbid short passwords, how to slow down someone who keeps guessing, how to make every failure leave evidence — and the policy questions the auditor asks next.</p>
${K.tip(`CCNA 200-301 topics 5.3 (device access control with local passwords) and 5.4 (password policy: management, complexity, alternatives). Central login servers are lesson 3; restricting <i>where</i> logins come from (<code>access-class</code>) is lesson 4.`)}

<h2>Who gets in, and how far: lines, privilege levels and the two questions</h2>
${K.remember(`<b>The rule:</b> every way in is a <b>line</b> (console, or VTY for SSH), and every line asks <b>&ldquo;who are you?&rdquo;</b> That lands you at a <b>privilege level</b>; reaching 15 (<code>#</code>) answers a second question, <b>&ldquo;may you change things?&rdquo;</b> — via the enable secret, or an account that already carries privilege 15.`)}
<p>Module 2 set up both questions. Here they are on one picture, with the new checks this lesson adds in the middle:</p>
${K.svg("0 0 760 300",
  K.box(20,40,170,50,"Console port","line con 0 · someone on site")+
  K.box(20,150,170,50,"VTY lines 0–15","SSH across the network")+
  `<rect x="240" y="30" width="210" height="190" rx="7" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.4"/>`+
  K.txt(345,52,"Checks on the line",{mid:true,c:"fg",s:12.5,b:true,f:"display"})+
  K.txt(254,78,"transport input ssh (VTY)",{s:10.5})+
  K.txt(254,100,"access-class (lesson 4)",{s:10.5})+
  K.txt(254,122,"quiet mode — login block-for",{s:10.5,c:"accent"})+
  K.txt(254,144,"login local: user + secret",{s:10.5})+
  K.txt(254,166,"(or login: one line password)",{s:10.5})+
  K.txt(254,188,"3 tries, then disconnect",{s:10.5})+
  K.txt(254,208,"logging: on-failure log",{s:10.5,c:"accent"})+
  K.box(520,40,220,50,"User EXEC  &gt;","privilege level 1")+
  K.box(520,150,220,50,"Privileged EXEC  #","privilege level 15",true)+
  K.arrow(190,65,238,90)+K.arrow(190,175,238,150)+K.arrow(450,95,518,68)+
  K.arrow(630,92,630,148)+K.txt(622,124,"enable + enable secret",{s:10.5,end:true})+
  K.arrow(450,175,518,175,"",true)+K.txt(520,222,"privilege-15 account: straight to #",{s:10.5})+
  K.band(20,250,720,30,"exec-timeout logs idle sessions out on every line · quiet mode never blocks the console"),
  "The line decides whether you log in and who you are; the privilege level decides what you may do. New in this lesson: quiet mode and logging (highlighted).")}
<h3>Privilege levels: what &gt; and # really mean</h3>
<p>IOS has 16 ${K.g("privilege levels","Numbers 0 to 15 deciding which commands a session may run: 1 is user EXEC (>), 15 is privileged EXEC (#).")}, 0 to 15. <b>Level 1</b> is user EXEC (<code>&gt;</code>: some <code>show</code> commands, <code>ping</code>); every login starts there unless the account says otherwise. <b>Level 15</b> is privileged EXEC (<code>#</code>: everything, including <code>configure terminal</code> and <code>reload</code>). <b>Level 0</b> allows almost nothing. Levels 2–14 can hold custom command sets — building them is beyond the CCNA, and larger networks do that job with a central server's per-command authorisation (lesson 3).</p>
<p>An account can carry its own level: <code>username ops privilege 15 algorithm-type scrypt secret …</code>. With <code>login local</code>, the router puts <code>ops</code> straight at <code>#</code>; an account without <code>privilege</code> gets level 1 and must type <code>enable</code>.</p>
${K.when([
  ["Account with privilege 15","Each engineer has a named account","No shared enable secret; a leaver is one deleted account","Someone only needs to look — give level 1"],
  ["Level-1 account + enable secret","Helpdesk needs show commands; few may configure","Knowing the login isn't enough to configure","The enable secret becomes an untraceable shared password — vault it, change it when holders leave"],
], "Privilege 15 on the account, or a separate enable secret?")}
${K.check({q:"A switch has <code>username audit secret …</code> (no privilege keyword), <code>login local</code> on its VTY lines and no enable secret or enable password. The auditor logs in by SSH and types <code>enable</code>. What happens?", o:["The switch goes to # because no enable secret is set","The switch answers % No password set and the auditor stays at >","The switch asks for the audit user's secret again","The SSH session is closed"], a:1, why:"The account has level 1, so the session starts at >. With no enable secret or password configured, IOS refuses enable from a VTY line with % No password set (Module 2). (The console, by contrast, lets you go to # when nothing is set.)"})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Five complaints from engineers trying to manage a Lagos branch switch over the network. Match what each one saw with the check that stopped them.", pairs:[
  ["telnet 10.12.0.2 → Could not open connection to the host, on port 23: Connect failed","transport input ssh on the VTY lines"],
  ["(tunde@10.12.0.2) Password: asked three times, then Permission denied","The username and secret check (login local)"],
  ["Logged in at >, typed enable → % No password set","No enable secret is configured"],
  ["Logged in at >, enable asked Password: three times → % Bad secrets","The enable secret was wrong"],
  ["Logged in fine, went to lunch, came back to a closed session","exec-timeout on the line"]],
  why:"1. What is asked? Which layer of the two-question model said no. 2. Which rule? The line decides whether you connect and who you are (transport, then the credential check); enable decides the step to #; exec-timeout ends idle sessions. 3. Apply it: a refused port 23 is the transport, before any password; Permission denied is the credential check; % No password set and % Bad secrets are both enable — missing versus wrong; a closed idle session is the timeout, which is doing its job."})}

<h2>How IOS stores what you type — and why type 7 is not protection</h2>
${K.remember(`<b>The rule:</b> a password stored <b>reversibly</b> (type 0 or 7) can be read by anyone with the config. One stored as a <b>one-way hash</b> (5, 8, 9) can only be <i>guessed</i> — and the slower the hash, the fewer guesses per second. Ask of every line: <b>readable, or only guessable — and how slowly?</b>`)}
${K.svg("0 0 760 290",
  K.band(20,30,300,28,"REVERSIBLE — readable from the config","var(--chip)")+
  K.band(360,30,380,28,"ONE-WAY HASH — can only be guessed","var(--chip)")+
  K.box(20,72,140,56,"Type 0","plain text")+
  K.box(180,72,140,56,"Type 7","known-key scrambling")+
  K.box(360,72,116,56,"Type 5","salted MD5")+
  K.box(492,72,116,56,"Type 8","PBKDF2-SHA-256",true)+
  K.box(624,72,116,56,"Type 9","scrypt",true)+
  K.arrow(160,100,178,100)+
  K.arrow(360,160,738,160,"each guess costs the attacker more time (and, for 9, memory)",true)+
  K.txt(90,152,"service password-encryption",{mid:true,s:10})+K.txt(90,166,"turns 0 into 7 — nothing else",{mid:true,s:10})+
  K.txt(20,200,"enable secret / username … secret  →  always a hash (5, 8 or 9), never 0 or 7",{c:"fg",s:11,f:"body"})+
  K.txt(20,222,"algorithm-type md5 | sha256 | scrypt  →  picks type 5 | 8 | 9",{c:"fg",s:11,f:"body"})+
  K.txt(20,244,"enable password / username … password / line password  →  0, or 7 with the service on",{c:"fg",s:11,f:"body"})+
  K.txt(20,266,"Cisco's hardening guidance: use type 8 or 9; treat 0 and 7 as if they were written on the wall",{c:"fg",s:11,f:"body"}),
  "Two families. Within the hashes, moving right changes only how fast an attacker can guess.")}
<h3>The types, with what each one really means</h3>
<div class="tablewrap"><table>
<tr><th>Type</th><th>How it's stored</th><th>What someone holding the config can do</th></tr>
<tr><td><b>0</b></td><td>Plain text</td><td>Read it.</td></tr>
<tr><td><b>7</b></td><td>Scrambled with a fixed key, the same on every Cisco device and public for decades</td><td>Reverse it in seconds with free tools.</td></tr>
<tr><td><b>5</b></td><td>${K.g("Salted","A salt is a random value mixed into the hash and stored with it, so the same password gives different hashes and each must be attacked separately.")} ${K.g("MD5","Message Digest 5: an old, fast hash. Fast is bad for passwords: it allows huge numbers of guesses per second.")} hash</td><td>Only guess — but MD5 is fast, so short or common passwords fall quickly.</td></tr>
<tr><td><b>8</b></td><td>${K.g("PBKDF2","Password-Based Key Derivation Function 2: repeats a hash thousands of times so each guess costs that much work.")} with ${K.g("SHA-256","Secure Hash Algorithm, 256-bit output.")}, salted, 20,000 rounds</td><td>Only guess, and each guess costs far more work than a type 5 guess.</td></tr>
<tr><td><b>9</b></td><td>scrypt, salted (Module 2's glossary: slow and memory-hungry by design)</td><td>Only guess; each guess also needs a block of memory, which blunts specialised guessing chips.</td></tr>
</table></div>
<p>Two more numbers turn up in old configs. <b>Type 4</b> was a flawed SHA-256 version (no salt, no repeated rounds) that Cisco withdrew — replace any <code>secret 4</code>. <b>Type 6</b> is reversible AES encryption for keys the router must read back, such as VPN pre-shared keys; login passwords belong in one-way hashes instead, and type 6 is outside the CCNA.</p>
${K.dyk(`scrypt was designed in 2009 by Colin Percival for an online backup service, to make password guessing expensive on custom hardware. Its trick is memory: each guess needs a block of RAM, and RAM is far harder to multiply cheaply on a chip than arithmetic.`)}
<h3>Choosing the algorithm: algorithm-type</h3>
<p>Plain <code>enable secret</code> and <code>username … secret</code> (Module 2) let IOS choose the hash; recent IOS XE picks type 9. To choose it yourself, and make your intent visible in a template, add <code>algorithm-type</code>: <code>enable algorithm-type scrypt secret Kaduna-En4ble-2026</code>, or <code>username ops9 privilege 15 algorithm-type scrypt secret Kaduna-Ops9-2026</code> — the word order is fixed: <code>username NAME [privilege N] algorithm-type md5|sha256|scrypt secret PASSWORD</code>. Here's how four such lines read back:</p>
${K.out(`KD-EDGE-R1#show running-config | include enable|username
enable secret 9 $9$BkFvMvMAzuAIZe$Vz5zUNlrD2KvMrexYC1.6yfRFzJ44G6Wfzx7mb5XaVo
username ops9 privilege 15 secret 9 $9$YvenHr3yaKcujS$u4Ab4buxhCaXYl9oUtNp1hi1LTsmFmt7.S7j66hfviw
username ops8 secret 8 $8$8bHmdXWX8Lv/gm$/ErYurlTC8h94Lbi7dxed8.OzgNxdsZrv1Ruc0sBhq2
username old5 secret 5 $1$yX3e$6lpQv7I7MBUu/P3dOPzU/1`, "md5 → 5, sha256 → 8, scrypt → 9. The algorithm name never appears — only the type and $type$salt$hash. The filter enable|username shows lines containing either word.")}
<p>Type 5 is on its way out: recent IOS XE warns about or refuses <code>algorithm-type md5</code>, depending on release, and from 16.12 converts stored type 5 secrets to type 9 (Cisco). The lab, like older IOS, still makes a 5 — as inherited configs will.</p>
<p>You can paste a hash back in: <code>enable secret 9 $9$…</code> or <code>username ops9 secret 9 $9$…</code> sets the same secret on another device without anyone typing the password — so templates hold hashes, never passwords.</p>
<h3>What service password-encryption really does</h3>
<p>The exact rule, because exams and auditors test it: <code>service password-encryption</code> stores every <b>type 0</b> entry — line passwords, any <code>enable password</code>, every <code>username … password</code> — as <b>type 7</b>. Nothing else. It never touches a <code>secret</code>, never produces anything stronger than 7, and turning it off doesn't turn existing 7s back into plain text.</p>
${K.out(`KD-EDGE-R1(config)#do show running-config | section username audit|line vty
username audit password 0 Kaduna-Aud1t-26
line vty 0 4
 password Vty-Line-Pass1
KD-EDGE-R1(config)#service password-encryption
KD-EDGE-R1(config)#do show running-config | section username audit|line vty
username audit password 7 080A4D4A1C17045A331E08553E66767E
line vty 0 4
 password 7 0817585744350C1917463C05393875`, "Before and after: plain text became type 7. Any secret in the file is untouched.")}
${K.tip(`Try it in the terminal below: <code>no service password-encryption</code> leaves the existing type 7 lines as they are; only passwords you set afterwards stay plain text. Either way, the fix is a <code>secret</code>.`)}
<h3>A floor under every new password: security passwords min-length</h3>
<p>Nothing so far stops a secret of <code>abc</code>. <code>security passwords min-length N</code> (global, N 0–16 on most releases) makes IOS refuse any new enable, username or line password shorter than N:</p>
${K.out(`KD-EDGE-R1(config)#security passwords min-length 14
KD-EDGE-R1(config)#username short algorithm-type scrypt secret Short-Pass-1
% Password too short - must be at least 14 characters. Password configuration failed
KD-EDGE-R1(config)#enable secret Kad-En4ble-1
% Password too short - must be at least 14 characters. Password configuration failed
KD-EDGE-R1(config)#enable algorithm-type scrypt secret Kaduna-En4ble-2026
KD-EDGE-R1(config)#`, "A refused command changes nothing: user short isn't created and the old enable secret stays — so a script that ignores the message leaves the old password in place.")}
${K.mistake(`Believing <code>security passwords min-length</code> fixed the short passwords already on the device. It checks passwords <b>as they are configured from now on</b>; a four-character console password from last year keeps working. Find and replace the old short ones yourself.`)}
<h3>Worked example: reading an inherited config line by line</h3>
<p>You take over a Kaduna edge router. Before changing anything, apply the rule — readable, or only guessable, and how slowly? — to each line:</p>
${K.out(`KD-EDGE-R1#show running-config
!
service password-encryption
!
hostname KD-EDGE-R1
!
enable secret 5 $1$Ux3P$KU3CHtQFE0EKbW0s/i7iL.
enable password 7 15390A0811242A7678626C
!
username ops9 privilege 15 secret 9 $9$YvenHr3yaKcujS$u4Ab4buxhCaXYl9oUtNp1hi1LTsmFmt7.S7j66hfviw
username audit password 7 080A4D4A1C17045A331E08553E66767E
!
line con 0
 password 7 0831444D584B56
 login
line vty 0 4
 exec-timeout 0 0
 login local
 transport input ssh`, "An inherited config, trimmed to the access lines.")}
${K.steps([
  ["enable secret 5", `<p>Guessable, but MD5 is fast — and this is the key to <code>#</code>. <b>Replace</b> with <code>enable algorithm-type scrypt secret …</code>.</p>`],
  ["enable password 7", `<p>Readable. The secret wins, so it grants nothing here — but a reused password leaks with the file. <b>Remove:</b> <code>no enable password</code>.</p>`],
  ["username ops9 … secret 9", `<p>scrypt, named, privilege 15: the target state.</p>`],
  ["username audit password 7", `<p>Readable: anyone with a backup has a login. <b>Re-create</b> with <code>algorithm-type scrypt secret</code>, or delete it: <code>no username audit</code>.</p>`],
  ["line con 0 password 7 + login", `<p>Readable, shared, nameless. <b>Use</b> <code>login local</code> on the console and remove the shared one with <code>no password</code>.</p>`],
  ["exec-timeout 0 0 on the VTYs", `<p>An open session never closes. <b>Set</b> <code>exec-timeout 5 0</code>.</p>`],
])}
${K.term({env:"ios2", title:"password storage on KD-EDGE-R1",
  intro:"An inherited weak account (<code>audit</code>) and a plain VTY line password. See every storage type for yourself, then leave the router in good shape. Passwords are lab examples.",
  opts:{kind:"router", host:"KD-EDGE-R1", motd:"KD-EDGE-R1 — console session. You are at user EXEC (>). No enable secret is set yet."},
  setup:env=>{ ["enable","configure terminal","username audit password Kaduna-Aud1t-26","line vty 0 4","password Vty-Line-Pass1","login","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; },
  tasks:[
    {text:"<code>enable</code>, then read what you inherited: <code>show running-config | section username|line vty</code> (is anything plain text?)", done:e=>e.history.some(c=>/^\s*sh\S*\s+run/i.test(c))},
    {text:"Turn on <code>service password-encryption</code> and look again — which lines changed to type 7, and is that protection?", done:e=>!!e.servicePwEnc},
    {text:"Create <code>ops9</code> at privilege 15 with <code>algorithm-type scrypt</code>, and <code>ops8</code> with <code>algorithm-type sha256</code> — then read their type numbers", done:e=>!!(e.users.ops9 && e.users.ops9.alg==="9" && e.users.ops9.priv===15 && e.users.ops8 && e.users.ops8.alg==="8")},
    {text:"See type 5 for yourself: create <code>old5</code> with <code>algorithm-type md5</code>, read it, then remove it with <code>no username old5</code>", done:e=>!e.users.old5 && e.history.some(c=>/algorithm-type\s+md5/i.test(c))},
    {text:"Set <code>security passwords min-length 14</code> and try one secret that is too short (read the refusal)", done:e=>e.secMinLen>=14 && e.history.some(c=>{ const m = c.match(/^\s*(username|enable)\b.*\bsecret\s+(\S+)\s*$/i); return !!(m && m[2].length<14); })},
    {text:"Finish the clean-up: an <code>enable algorithm-type scrypt secret</code> of 14+ characters, and remove the weak <code>audit</code> account", done:e=>e.enableAlg==="9" && !!e.enableSecret && !e.users.audit},
  ],
  win:"Every login secret on KD-EDGE-R1 is now a slow hash, the min-length floor refuses short new passwords, and you have seen with your own eyes that service password-encryption only turns plain text into type 7 — scrambled, not protected. (The VTY line password is still type 7; in the bench below you replace line passwords with login local.)",
  solve:["enable","show running-config | section username|line vty","configure terminal","service password-encryption","do show running-config | section username|line vty",
    "username ops9 privilege 15 algorithm-type scrypt secret Kaduna-Ops9-2026","username ops8 algorithm-type sha256 secret Kaduna-Ops8-2026",
    "username old5 algorithm-type md5 secret Kaduna-Old5-2026","do show running-config | include username","no username old5",
    "security passwords min-length 14","username short algorithm-type scrypt secret Short-Pass-1",
    "enable algorithm-type scrypt secret Kaduna-En4ble-2026","no username audit","end","show running-config | include enable|username|security"]})}
${K.check({q:"An engineer turns on <code>service password-encryption</code> on a switch whose config has <code>enable secret 5 $1$…</code>, <code>username noc secret 9 $9$…</code> and <code>line con 0</code> / <code>password C0ns0le-Pa55</code>. Which line changes?", o:["All three become type 7","Only the console password, which becomes type 7","The enable secret upgrades from type 5 to type 9","None — the service only affects new passwords"], a:1, why:"The service converts only type 0 (plain text) entries to type 7. Secrets are left exactly as they are, and existing plain-text entries are converted, not only new ones."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Kano switch has service password-encryption ON. For each command, which type number appears in show running-config?", fields:[
  {label:"username sani algorithm-type sha256 secret Kano-Sani-2026x", a:["8","type 8"]},
  {label:"username guard password Kano-Guard-2026", a:["7","type 7"]},
  {label:"enable algorithm-type md5 secret Kano-Enable-2026", a:["5","type 5"]}],
  why:"1. What is asked? How each line is stored. 2. Which rule? secret → a hash whose type algorithm-type picks (md5 5, sha256 8, scrypt 9); password → plain text, which the service turns into 7. 3. Apply it: sha256 gives 8; the guard account uses password, so it is type 7 — readable by anyone with the backup; md5 gives 5."})}
${K.bench({id:"m8-ph-harden", points:110, from:"CCNA · Module 8 · lesson 2", title:"Port Harcourt audit finding: harden PH-ACC-SW3's management access", viewBox:"0 0 760 340",
  intro:"<b>Finding:</b> &ldquo;PH-ACC-SW3: accounts stored reversibly, shared enable password, Telnet allowed, sessions never time out.&rdquo; Vault (lab examples): console password <code>con1</code>, enable secret <code>Harc0urt23</code>, <code>helpdesk</code> / <code>help1</code>. Newly issued: <code>ops</code> → <code>Ops-Rivers-2026!</code>, <code>helpdesk</code> → <code>Help-Desk-Rivers-26</code>, enable → <code>Enable-Bonny-Isl4nd</code>. Console: <b>Terminal app</b> on LAPTOP, 9600 8N1, no flow control. ADMIN-PC (10.40.10.50) is the NOC desk.",
  devices:[
    {id:"sw", kind:"switch", label:"PH-ACC-SW3", model:"Catalyst 9200", x:330, y:60, config:e=>{ ["en","conf t","hostname PH-ACC-SW3","no ip domain-lookup","enable algorithm-type md5 secret Harc0urt23","enable password Rivers2023","service password-encryption","ip domain name ph.example.net","username ops password Ops2024","username helpdesk password help1","interface vlan 1","ip address 10.40.10.3 255.255.255.0","no shutdown","exit","ip default-gateway 10.40.10.1","line vty 0 15","login local","transport input telnet ssh","exec-timeout 0 0","exit","line console 0","password con1","login","exit","crypto key generate rsa","2048"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"adm", kind:"pc", label:"ADMIN-PC", x:160, y:240, ip:"10.40.10.50", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:520, y:240},
  ],
  cables:[ {type:"cat6", a:"adm:eth", b:"sw:g2"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the finding from ADMIN-PC: <code>telnet 10.40.10.3</code>, log in as <code>helpdesk</code> / <code>help1</code>, then <code>exit</code>. A five-character password over clear-text Telnet works", done:B=>Bench.tried(B,"adm",/^\s*telnet\s+10\.40\.10\.3/)},
    {text:"Console in (line password <code>con1</code>), <code>enable</code> (<code>Harc0urt23</code>), <code>show running-config</code>. Classify every password line: readable, or only guessable?", done:B=>B.devs.sw.env.history.some(c=>/^\s*sh\S*\s+run/i.test(c))},
    {text:"<code>configure terminal</code>, set <code>security passwords min-length 12</code>, then prove it works: try the helpdesk's old style, <code>username helpdesk algorithm-type scrypt secret help2026</code>, and read the refusal", done:B=>B.devs.sw.env.secMinLen>=12},
    {text:"Re-create both accounts as type 9 with the issued secrets: <code>ops</code> at <code>privilege 15</code>, <code>helpdesk</code> at the default level", done:B=>{ const u=B.devs.sw.env.users; return !!(u.ops && u.ops.alg==="9" && u.ops.priv===15 && !u.ops.password && u.helpdesk && u.helpdesk.alg==="9" && !u.helpdesk.password); }},
    {text:"Privileged access: <code>enable algorithm-type scrypt secret Enable-Bonny-Isl4nd</code> and remove the shared <code>enable password</code>", done:B=>{ const e=B.devs.sw.env; return e.enableAlg==="9" && !e.enablePassword; }},
    {text:"Lines: <code>line vty 0 15</code> → SSH only and <code>exec-timeout 5 0</code>. <code>line console 0</code> → <code>login local</code>, <code>no password</code> (removes the shared line password) and <code>exec-timeout 5 0</code>. Then <code>end</code>", done:B=>{ const L=B.devs.sw.env.lines; return L.vty.transport==="ssh" && L.vty.timeout && L.vty.timeout!=="0 0" && L.con.loginLocal && !L.con.password && L.con.timeout && L.con.timeout!=="0 0"; }},
    {text:"Test like the auditor from ADMIN-PC: <code>telnet 10.40.10.3</code> again (what now?), then <code>ssh -l ops 10.40.10.3</code> with the new secret. Read the prompt: <code>ops</code> carries privilege 15, so you land straight at <code>#</code> with no <code>enable</code> step. Then <code>exit</code>", done:B=>{ const s=Bench.session(B,"adm"); return B.devs.sw.env.lines.vty.transport==="ssh" && !!(s && s.proto==="ssh" && s.user==="ops") && Bench.sessionMode(B,"adm")==="priv"; }},
    {text:"Evidence and save, on the console: <code>show running-config | include username|enable|security</code> (the <code>|</code> between words means &ldquo;or&rdquo;), then <code>copy running-config startup-config</code>", done:B=>{ const e=B.devs.sw.env; return !!e.savedOnce && !!e.startup && e.startup.secMinLen>=12 && e.startup.lines.vty.transport==="ssh"; }},
  ],
  win:"Finding closed on PH-ACC-SW3: Telnet is refused, both accounts are scrypt (type 9) and named, the enable password is gone, idle sessions end after 5 minutes on every line, and no new password shorter than 12 characters can be configured. The twist in task 3: the refused command left the old helpdesk account untouched — min-length protects the future only.",
  solve:[["pc","adm","telnet 10.40.10.3"],["pc","adm","helpdesk"],["pc","adm","help1"],["pc","adm","exit"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","con1"],["term","enable"],["term","Harc0urt23"],["term","show running-config"],
    ["term","configure terminal"],["term","security passwords min-length 12"],["term","username helpdesk algorithm-type scrypt secret help2026"],
    ["term","username ops privilege 15 algorithm-type scrypt secret Ops-Rivers-2026!"],["term","username helpdesk algorithm-type scrypt secret Help-Desk-Rivers-26"],
    ["term","enable algorithm-type scrypt secret Enable-Bonny-Isl4nd"],["term","no enable password"],
    ["term","line vty 0 15"],["term","transport input ssh"],["term","exec-timeout 5 0"],["term","line console 0"],["term","login local"],["term","no password"],["term","exec-timeout 5 0"],["term","end"],
    ["pc","adm","telnet 10.40.10.3"],["pc","adm","ssh -l ops 10.40.10.3"],["pc","adm","Ops-Rivers-2026!"],["pc","adm","exit"],
    ["term","show running-config | include username|enable|security"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 3's test command is <i>meant</i> to fail: 8 characters against a floor of 12. Task 6: on the console, set <code>login local</code> while you are still logged in — your session carries on, and the next console login will ask for a username. If ADMIN-PC's SSH is refused, check <code>transport input</code> under <code>line vty 0 15</code>.`)}

${K.drill({title:"read a password line: which type, and can it be reversed?", types:["pwtype"], count:5})}
<h2>Slowing down guessing: login block-for, quiet mode and login logging</h2>
${K.remember(`<b>The rule:</b> the router <b>counts failed logins</b> in a time window; at your limit it enters <b>quiet mode</b> and refuses new remote logins for a set time — except from sources you exempt. Separately it can <b>log</b> failures and successes. Read <code>login block-for 120 attempts 3 within 60</code> as &ldquo;block for 120 s if 3 attempts fail within 60 s&rdquo;.`)}
<h3>Why this works against guessing</h3>
<p>Lesson 1 described password guessing. Against a router it is ${K.g("online guessing","Trying passwords against a live login prompt, as opposed to offline guessing against a stolen hash.")}: password after password against the login prompt itself. Every attempt is a real connection, so speed is its weakness. Allow 3 failures, then 2 minutes of silence, and a guesser gets about 2,000 tries a day instead of many thousands an hour — against a 12-character password, the difference between &ldquo;eventually&rdquo; and &ldquo;never&rdquo;. It does <b>not</b> stop offline guessing of a hash from a leaked config (type 9's job) or a password stolen elsewhere (uniqueness and MFA, last section). Each control slows a different attack.</p>
<h3>The commands</h3>
${K.out(`KN-CORE-R1(config)#login block-for 120 attempts 3 within 60
KN-CORE-R1(config)#ip access-list standard NOC
KN-CORE-R1(config-std-nacl)#permit 10.60.99.0 0.0.0.255
KN-CORE-R1(config-std-nacl)#exit
KN-CORE-R1(config)#login quiet-mode access-class NOC
KN-CORE-R1(config)#login on-failure log
KN-CORE-R1(config)#login on-success log every 5
KN-CORE-R1(config)#login delay 2`, "A Kano core router. The NOC LAN is 10.60.99.0/24; staff are on 10.60.10.0/24.")}
<ul>
<li><b><code>login block-for 120 attempts 3 within 60</code></b> — the watch. Cisco's guide says to enter it before the other <code>login</code> commands: it switches the protection on. It also adds a default 1-second delay between attempts.</li>
<li><b><code>login quiet-mode access-class NOC</code></b> — the exemption: during quiet mode, sources the list <i>permits</i> may still log in. It's an ordinary standard access list (Module 7's &ldquo;who&rdquo; list; lesson 4 covers ACLs fully).</li>
<li><b><code>login on-failure log</code></b> / <b><code>login on-success log</code></b> — a syslog message per failed / successful login; <code>every N</code> logs every Nth one.</li>
<li><b><code>login delay 2</code></b> — 2 seconds (1–10) between attempts: slows a guesser, locks nobody out.</li>
</ul>
<h3>Reading show login and the log</h3>
<p>Before any failure, <code>show login</code> lists the delay, the quiet-mode list and what is logged, then &ldquo;Router enabled to watch for login Attacks&rdquo;, the three numbers, and &ldquo;Router presently in Normal-Mode&rdquo; with the failure count (you'll read it in the bench). Without <code>login block-for</code> it ends &ldquo;Router NOT enabled to watch for login Attacks&rdquo;.</p>
<p>Now Ibrahim, on the staff LAN (10.60.10.77), logs in by SSH with his own account and mistypes his password three times — Caps Lock, the old year, a swapped letter. Honest mistakes:</p>
${K.out(`KN-CORE-R1#show logging | include SEC_LOGIN
*Oct 12 08:30:56.096: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: ibrahim] [Source: 10.60.10.77] [localport: 22] [Reason: Login Authentication Failed] at 08:30:56 UTC Mon Oct 12 2026
*Oct 12 08:31:03.233: %SEC_LOGIN-1-QUIET_MODE_ON: Still timeleft for watching failures is 60 secs, [user: ibrahim] [Source: 10.60.10.77] [localport: 22] [Reason: Login Authentication Failed] [ACL: NOC] at 08:31:03 UTC Mon Oct 12 2026`, "The last of three LOGIN_FAILED lines (two identical ones scroll above it), then quiet mode. Each names the user, the source and the port (22 SSH, 23 Telnet). QUIET_MODE_ON is severity 1, alert.")}
${K.out(`KN-CORE-R1#show login
     A login delay of 2 seconds is applied.
     Quiet-Mode access list NOC is applied.
     Every 5 successful login is logged and generate SNMP traps.
     All failed login is logged and generate SNMP traps.

     Router enabled to watch for login Attacks.
     If more than 3 login failures occur in 60 seconds or less,
     logins will be disabled for 120 seconds.

     Router presently in Quiet-Mode.
     Will remain in Quiet-Mode for 120 seconds.
     Restricted logins filtered by applied ACL NOC.`, "Quiet mode: how long, and who is still allowed. With no exemption list the last line reads 'Denying logins from all sources.'")}
${K.svg("0 0 760 300",
  K.txt(20,24,"login block-for 120 attempts 3 within 60",{c:"fg",s:12.5,b:true})+
  K.band(60,44,300,26,"watch window: 3 failures within 60 s?")+
  K.txt(190,100,"each failure → %SEC_LOGIN-4-LOGIN_FAILED",{mid:true,s:10.5})+
  K.arrow(40,150,740,150)+K.txt(700,170,"time",{s:10.5})+
  `<circle cx="100" cy="150" r="7" fill="var(--bad)"/><circle cx="190" cy="150" r="7" fill="var(--bad)"/><circle cx="280" cy="150" r="7" fill="var(--bad)"/>`+
  K.txt(100,132,"1",{mid:true,c:"bad",s:12,b:true})+K.txt(190,132,"2",{mid:true,c:"bad",s:12,b:true})+K.txt(280,132,"3",{mid:true,c:"bad",s:12,b:true})+
  K.link(280,157,280,190,"",true)+K.link(610,157,610,190,"",true)+
  K.band(280,190,330,26,"quiet mode: 120 s (block-for)")+
  K.txt(445,236,"new remote logins refused — except sources the",{mid:true,s:10.5})+
  K.txt(445,252,"quiet-mode access-class permits · the console still works",{mid:true,s:10.5})+
  K.txt(20,284,"the 3rd failure starts it (show login says 'more than 3')",{s:10.5})+
  K.txt(610,284,"QUIET_MODE_OFF → normal mode",{mid:true,s:10.5,c:"ok"}),
  "Failures from every source and remote protocol count together; quiet mode ends on its own when block-for runs out.")}
<h3>Four details that decide real outcomes</h3>
<ul>
<li><b>&ldquo;More than 3&rdquo; versus the third failure.</b> <code>show login</code> says &ldquo;more than 3&rdquo;, but quiet mode starts on the 3rd failure inside the window, as the log shows. Count to N.</li>
<li><b>The count is per device, not per person.</b> Failures from every source and remote protocol add up: three users each mistyping once inside a minute trigger it for everyone not exempted.</li>
<li><b>Each connection gives three tries.</b> SSH gives three password prompts per connection; Telnet with a line password closes after three with <code>% Bad passwords</code>. With <code>attempts 4</code> it takes a second connection.</li>
<li><b>Quiet mode guards remote logins only.</b> The console is never blocked — your safety net. Pings and traffic through the router are untouched.</li>
</ul>
${K.tip(`Lab note: the bench clock moves only when a task moves it, so a lab quiet period lasts until you reset the bench; a real router ends it after block-for and logs <code>%SEC_LOGIN-5-QUIET_MODE_OFF: Quiet Mode is OFF, because block period timed out</code>. A refused SSH shows <i>Connection refused</i> here and normally on a real router: quiet mode puts an access list (yours, or IOS's <code>sl_def_acl</code>) on the VTY lines, which refuse the connection.`)}
${K.mistake(`Adding <code>login block-for</code> to a remote router with no <code>login quiet-mode access-class</code>. Any three typos — a colleague's, a script's, yours — now refuse every remote login, the NOC's included. Build and test the exemption list (with your own management subnet) first, then add the watch.`)}
${K.exam(`Reading device-access questions: before the options, write down <b>which line</b> (console or VTY, Telnet or SSH), <b>which check</b> (identity, storage type, failure count, banner) and <b>the numbers</b> in order — <code>block-for</code> seconds, <code>attempts</code>, <code>within</code> seconds. Traps: &ldquo;service password-encryption <i>encrypts</i>&rdquo; (only reversible type 7), &ldquo;more than N&rdquo; in show login (quiet mode starts on the Nth failure), and options that block the console (nothing here does).`)}
${K.check({q:"A router has <code>login block-for 300 attempts 4 within 90</code> and <code>login quiet-mode access-class MGMT</code>, where MGMT permits 10.8.99.0/24. Two staff PCs on 10.8.20.0/24 each fail twice within 40 seconds. What happens next?", o:["Nothing — each source has only two failures","The router enters quiet mode for 300 seconds; staff are refused, 10.8.99.0/24 can still log in, and the console still works","The router enters quiet mode and refuses everyone, including 10.8.99.0/24","The staff PCs' traffic through the router is blocked for 300 seconds"], a:1, why:"The count is per device: 2 + 2 = 4 failures inside 90 seconds reaches the limit, so quiet mode starts for 300 seconds. MGMT exempts the admin subnet; the console is never blocked; traffic is unaffected."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"An Enugu router has login block-for 180 attempts 5 within 30 and no quiet-mode access-class. Failed logins arrive at 0 s, 4 s, 9 s, 13 s and 19 s (from three different PCs). Answer each field.", fields:[
  {label:"Quiet mode starts at (seconds)", a:["19","19 s","19s"]},
  {label:"It ends at about (seconds)", a:["199","199 s","199s"]},
  {label:"Can an admin on the NOC subnet SSH in during it? (yes/no)", a:["no"]},
  {label:"Can someone on site use the console? (yes/no)", a:["yes"]}],
  why:"1. What is asked? When quiet mode starts and ends, and who gets in. 2. Which rule? Count failures per device inside the window; the Nth failure (here the 5th) starts quiet mode for block-for seconds; only quiet-mode access-class sources are exempt; the console is never blocked. 3. Apply it: five failures by 19 s, all within 30 s, so quiet mode starts at 19 s and lasts 180 s, ending at about 199 s. No exemption list, so the NOC is refused too; the console still works."})}
${K.bench({id:"m8-abj-quiet", points:120, from:"CCNA · Module 8 · lesson 2", title:"Abuja: keep the login protection, stop it locking IT out", viewBox:"0 0 900 420",
  intro:"<b>Ticket:</b> &ldquo;Monday 09:10–09:15 nobody in IT could SSH to ABJ-WAN-R1; helpdesk was trying the router password after Friday's change. Keep the brute-force protection, but IT must always get in, and show us who fails.&rdquo; Gi0/0 = staff LAN 172.16.20.0/24 (HELPDESK-PC .40); Gi0/1 = IT admin LAN 172.16.99.0/24 (ADMIN-PC .10). Vault (lab examples): <code>netops</code> / <code>Abj-N3tops-2026</code>, enable secret <code>Abj-En4ble-2026</code>; helpdesk's secret is <code>Abj-H3lpdesk-NEW</code>, but the technician still types <code>Abj-H3lpdesk-OLD</code>. Console: <b>Terminal app</b> on LAPTOP, 9600 8N1, no flow control, <code>login local</code>. <b>Lab clock:</b> it moves only when a task moves it, so quiet mode here lasts until you reset the bench (a real router ends it after the block-for time).",
  devices:[
    {id:"r", kind:"router", label:"ABJ-WAN-R1", x:380, y:20, config:e=>{ ["en","conf t","hostname ABJ-WAN-R1","no ip domain-lookup","enable algorithm-type scrypt secret Abj-En4ble-2026","ip domain name abj.example.com","security passwords min-length 12","username netops privilege 15 algorithm-type scrypt secret Abj-N3tops-2026","username helpdesk algorithm-type scrypt secret Abj-H3lpdesk-NEW","int g0/0","description STAFF LAN","ip address 172.16.20.1 255.255.255.0","no shut","int g0/1","description IT ADMIN LAN","ip address 172.16.99.1 255.255.255.0","no shut","exit","line vty 0 4","login local","transport input ssh","exec-timeout 5 0","exit","line console 0","login local","exec-timeout 5 0","exit","login block-for 300 attempts 4 within 120","banner motd #ABJ-WAN-R1 - authorised users only. Activity is logged.#","crypto key generate rsa","2048"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"sw1", kind:"switch", label:"ABJ-SW-STAFF", x:20, y:150},
    {id:"sw2", kind:"switch", label:"ABJ-SW-IT", x:460, y:150},
    {id:"hd", kind:"pc", label:"HELPDESK-PC", x:80, y:300, ip:"172.16.20.40", mask:"255.255.255.0", gw:"172.16.20.1"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:380, y:300},
    {id:"adm", kind:"pc", label:"ADMIN-PC", x:700, y:300, ip:"172.16.99.10", mask:"255.255.255.0", gw:"172.16.99.1"},
  ],
  cables:[ {type:"cat6", a:"r:g0", b:"sw1:g1"}, {type:"cat6", a:"hd:eth", b:"sw1:g2"}, {type:"cat6", a:"r:g1", b:"sw2:g1"}, {type:"cat6", a:"adm:eth", b:"sw2:g2"}, {type:"console", a:"lap:usb", b:"r:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console in as <code>netops</code> (privilege 15, so you land at <code>#</code>), then <code>show login</code>. Read it like the ticket: what would happen to IT if four logins failed in two minutes?", done:B=>B.devs.r.env.history.some(c=>/^\s*sh\S*\s+login/i.test(c))},
    {text:"Evidence first: <code>login on-failure log</code> and <code>login on-success log</code>", done:B=>{ const e=B.devs.r.env; return !!e.loginLogFail && !!e.loginLogOk; }},
    {text:"The exemption: <code>ip access-list standard IT-ADMIN</code> with a <code>remark</code> and one <code>permit</code> for the IT admin LAN 172.16.99.0/24, then <code>login quiet-mode access-class IT-ADMIN</code>. Check with <code>show login</code>", done:B=>{ const e=B.devs.r.env, A=window.ACL; return e.loginQuietAcl==="IT-ADMIN" && !!e.acl.lists["IT-ADMIN"] && A.check(e.acl,"IT-ADMIN",{src:"172.16.99.10"},false).permit && !A.check(e.acl,"IT-ADMIN",{src:"172.16.20.40"},false).permit; }},
    {text:"Reproduce Monday safely: from HELPDESK-PC, <code>ssh -l helpdesk 172.16.20.1</code> and type the old password (<code>Abj-H3lpdesk-OLD</code>, or any mistyping) until you're refused, then connect again and fail once more. Four failures in all", done:B=>Bench.quietMode(B,"r") && Bench.loginFailures(B,"r")>=4},
    {text:"Prove the design. HELPDESK-PC: SSH again (what does it say?) and <code>ping 172.16.20.1</code> (does quiet mode stop pings?). ADMIN-PC: <code>ssh -l netops 172.16.99.1</code>, then <code>show login</code> and <code>show logging | include SEC_LOGIN</code> — who failed, from where, and when did quiet mode start?", done:B=>Bench.quietMode(B,"r") && Bench.pinged(B,"hd","172.16.20.1") && Bench.logged(B,"r",/LOGIN_SUCCESS.*172\.16\.99\.10/) && Bench.tried(B,"adm",/sh\S*\s+login/i) && Bench.tried(B,"adm",/sh\S*\s+logg/i)},
    {text:"Close the ticket: <code>exit</code> the SSH session; on the console <code>show running-config | include login</code> and <code>copy running-config startup-config</code>. (The real fix for the helpdesk is a people one: they get the new secret from the vault.)", done:B=>{ const e=B.devs.r.env; return !!e.savedOnce && !!e.startup && e.startup.loginQuietAcl==="IT-ADMIN" && !!e.startup.loginLogFail; }},
  ],
  win:"Monday can't happen again: the helpdesk's typos still trigger quiet mode — so a real guesser on the staff LAN is slowed to four tries per five minutes — but the IT admin LAN logs in throughout, the console never stopped working, and every failure is now logged with user, source and port. The log showed an old password from one desk, not an attack — and the count crossed two SSH connections.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","netops"],["term","Abj-N3tops-2026"],["term","show login"],
    ["term","configure terminal"],["term","login on-failure log"],["term","login on-success log"],["term","ip access-list standard IT-ADMIN"],["term","remark IT admin LAN keeps access in quiet mode"],["term","permit 172.16.99.0 0.0.0.255"],["term","exit"],["term","login quiet-mode access-class IT-ADMIN"],["term","end"],["term","show login"],
    ["pc","hd","ssh -l helpdesk 172.16.20.1"],["pc","hd","Abj-H3lpdesk-OLD"],["pc","hd","Abj-H3lpdesk-OLD"],["pc","hd","Abj-H3lpdesk-0LD"],
    ["pc","hd","ssh -l helpdesk 172.16.20.1"],["pc","hd","Abj-H3lpdesk-OLD"],["pc","hd","Abj-H3lpdesk-old"],["pc","hd","Abj-H3lpdesk-OLD!"],
    ["pc","hd","ssh -l helpdesk 172.16.20.1"],["pc","hd","ping 172.16.20.1"],
    ["pc","adm","ssh -l netops 172.16.99.1"],["pc","adm","Abj-N3tops-2026"],["pc","adm","show login"],["pc","adm","show logging | include SEC_LOGIN"],["pc","adm","exit"],
    ["term","show running-config | include login"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 3: a /24 is 255.255.255.0, so the wildcard is 0.0.0.255. Task 4: watch <code>show login</code> on the console between connections — &ldquo;Present login failure count&rdquo; climbs to 3 after the first connection and quiet mode starts on the 4th failure. If ADMIN-PC is refused in task 5, the IT-ADMIN list doesn't permit 172.16.99.10: check it with <code>show running-config | section IT-ADMIN</code>.`)}
${K.job("“NOC can't SSH to PHC-EDGE-R2 — but only sometimes”",`
<p><b>The ticket.</b> Tuesday 07:50, NOC lead Amaka: &ldquo;Since Thursday, SSH to PHC-EDGE-R2 sometimes gives <i>Connection refused</i> for ten minutes. Also at 02:00 and 03:00 last night. Is someone attacking it?&rdquo;</p>
<p><b>Questions first.</b> Who? Everyone remote, the NOC (10.50.99.0/24) included. When? Ten-minute bursts, overnight too. What changed Thursday? &ldquo;Rotated the <code>cfgbackup</code> secret on all edge routers (leaver in the backup team).&rdquo; &ldquo;Attack&rdquo; is a hypothesis to test, not a conclusion.</p>
<p><b>Checks</b>, through the site's console server (out-of-band console access, never blocked by quiet mode):</p>
${K.out(`PHC-EDGE-R2#show login
     A default login delay of 1 seconds is applied.
     No Quiet-Mode access list has been configured.
     All failed login is logged and generate SNMP traps.

     Router enabled to watch for login Attacks.
     If more than 3 login failures occur in 60 seconds or less,
     logins will be disabled for 600 seconds.

     Router presently in Quiet-Mode.
     Will remain in Quiet-Mode for 600 seconds.
     Denying logins from all sources.`, "Ten minutes of quiet mode, no exemption list: the NOC is refused with everyone else.")}
${K.out(`PHC-EDGE-R2#show logging | include SEC_LOGIN
*Oct 13 02:00:19.386: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] at 02:00:19 UTC Tue Oct 13 2026
*Oct 13 02:00:26.523: %SEC_LOGIN-1-QUIET_MODE_ON: Still timeleft for watching failures is 39 secs, [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] [ACL: sl_def_acl] at 02:00:26 UTC Tue Oct 13 2026`, "The third failure and QUIET_MODE_ON (two identical failures above). One user, one source, on the hour. sl_def_acl is IOS's default quiet-mode list when you haven't named one: it blocks everyone.")}
<p><b>Reading it.</b> 10.50.200.15 is the config-backup server; its scheduled job still holds the <b>old</b> secret, fails three times each run, and trips quiet mode. Not an attack — guessing usually shows many usernames, many sources or failures at all hours. <b>Fix:</b> (1) update the credential in the backup tool from the vault and run one job by hand; (2) remove the design flaw that turned a script error into an outage:</p>
${K.out(`PHC-EDGE-R2(config)#ip access-list standard NOC-MGMT
PHC-EDGE-R2(config-std-nacl)#remark NOC keeps SSH during login quiet mode
PHC-EDGE-R2(config-std-nacl)#permit 10.50.99.0 0.0.0.255
PHC-EDGE-R2(config-std-nacl)#exit
PHC-EDGE-R2(config)#login quiet-mode access-class NOC-MGMT
PHC-EDGE-R2(config)#login on-success log every 10`, "The backup server is deliberately not in the list: if its credential breaks again, quiet mode still applies to it while the NOC keeps working.")}
<p><b>What you say to Amaka.</b> &ldquo;Not an attack. The backup server still had the old cfgbackup password, failed three times each run, and the guessing protection locked everyone out for ten minutes. The backup job is fixed and tested, and the NOC is now exempt from that lock-out on all edge routers.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;NET-2291. PHC-EDGE-R2 quiet mode (block-for 600/3/60, no quiet-mode ACL) tripped hourly by cfgbackup@10.50.200.15 using the pre-rotation secret. Updated the backup tool's credential from the vault; manual job OK 08:12. Added NOC-MGMT (10.50.99.0/24) as login quiet-mode access-class on all edge routers (CHG-0817); verified show login; saved. Follow-up: backup tool added to the rotation checklist.&rdquo;</i></p>`)}

<h2>What people see first: banner motd, banner login and the order of screens</h2>
${K.remember(`<b>The rule:</b> on the console you see <code>banner motd</code> first, then <code>banner login</code>, then the prompts. Over SSH credentials come first, so the login banner appears before authentication and the ${K.g("MOTD","Message of the day — the banner motd text (Module 2).")} only <i>after</i> you're in.`)}
<p><code>banner login</code> uses Module 2's delimiter syntax: <code>banner login #Sign in with your own named account.#</code>. The console view of a router with both:</p>
${K.out(`ABJ-WAN-R1 - authorised users only. Activity is logged.

Sign in with your own named account.

User Access Verification

Username:`, "MOTD, login banner, then the login local prompts. (The running-config lists banner login first and shows the delimiter as ^C.)")}
<p>SSH authenticates before it opens a terminal, so the login banner is sent as a pre-login message — before <code>(netops@172.16.99.1) Password:</code>, to clients that send the username first, as <code>ssh -l</code> does — and the MOTD appears only after login. So a legal warning that must be seen <b>before</b> anyone tries to log in belongs in <code>banner login</code>. IOS also has <code>banner exec</code>, shown after login on any line (the lab doesn't model it).</p>
${K.when([
  ["banner login","The legal warning, or &ldquo;use your own named account&rdquo;","Seen by everyone who attempts a login, console or SSH, before credentials","The notice is only for logged-in staff"],
  ["banner motd","A notice such as &ldquo;maintenance tonight&rdquo;","Shown first on the console; after login over SSH","It's your only legal warning and admins use SSH"],
  ["banner exec","A message for people already in (change freeze)","Appears after login on any line","Legal text — it comes too late"],
], "Which banner for which message?")}
${K.check({q:"A bank's lawyer says the warning &ldquo;Authorised users only; activity is monitored&rdquo; must be displayed before anyone attempts to authenticate — and every engineer uses SSH. The warning is in banner motd today. What should you change?", o:["Nothing — banner motd is always shown first","Put the warning in banner login, because over SSH the MOTD appears only after authentication","Put the warning in banner exec","Configure the warning as the hostname"], a:1, why:"On the console, MOTD does come first. Over SSH the session authenticates before a terminal exists, so the MOTD is displayed after login; the login banner is the one SSH shows before authentication. Banner exec appears after login too."})}
<h3>Same logic, new situation</h3>
<p>A Lagos ISP wants: (a) the legal warning, seen before credentials; (b) &ldquo;Maintenance Saturday 01:00–03:00&rdquo; for console users this week; (c) &ldquo;Change freeze — change number required&rdquo; once engineers are in. Which banner carries each?</p>
${K.hint(`Ask of each message: who must see it, and must they see it before or after logging in? Then recall the order on the console and over SSH.`)}
${K.reveal("Show the answer", `<p><b>1. What is asked?</b> Which banner fits each audience and moment. <b>2. Which rule?</b> login banner: before credentials everywhere; MOTD: first on the console, after login on SSH; exec: after login. <b>3. Apply it:</b> (a) <code>banner login</code>; (b) <code>banner motd</code>, the console's first screen; (c) <code>banner exec</code> (real IOS; not in the lab). Keep device details out of all three.</p>`)}

<h2>Password policy: length, management, and what to use instead</h2>
${K.remember(`<b>The rule:</b> strength is <b>how many guesses it takes</b>. Length multiplies that far faster than symbol rules — and a leaked or reused password takes <b>one</b> guess at any length. So: long, unique, never shared, changed for a reason, and where it matters not the only factor.`)}
<p>CCNA topic 5.4 asks for password <b>management</b>, <b>complexity</b> and <b>alternatives</b>. Devices enforce part of a policy; the policy itself is written for people.</p>
<h3>Length beats complexity — the arithmetic</h3>
<p>Count the possibilities. 8 random characters from all 95 printable keyboard characters: 95<sup>8</sup> ≈ 6.6 × 10<sup>15</sup>. 16 random lowercase letters: 26<sup>16</sup> ≈ 4.4 × 10<sup>22</sup> — over six million times more, with no symbols. A ${K.g("passphrase","A password made of several random words, such as 'cassava ledger window marble': easy to remember, strong if the words are random.")} of five random words from a 7,776-word list: 7,776<sup>5</sup> ≈ 2.8 × 10<sup>19</sup>.</p>
<p>And people don't choose randomly. Told &ldquo;one capital, one digit, one symbol&rdquo;, most produce <code>Lagos2026!</code> — a pattern guessing tools try first. Complexity rules add less than they seem and make passwords harder to remember, so people write them down or reuse them.</p>
<h3>What NIST recommends</h3>
<p>The most-cited guidance is the US ${K.g("NIST","National Institute of Standards and Technology, a US standards body. Its Special Publication (SP) 800-63B, Digital Identity Guidelines, is the most widely used reference for password rules.")} Special Publication (SP) 800-63B (2017, revised 2025):</p>
<ul>
<li><b>Length:</b> the 2025 revision (800-63B-4) requires at least <b>15</b> characters when the password is the only factor, and 8 when it is part of MFA (the 2017 version said 8 for all); accept at least 64, spaces included.</li>
<li><b>No composition rules:</b> don't demand mixtures of character types.</li>
<li><b>No scheduled forced changes</b> — but <b>do</b> force one on evidence of compromise.</li>
<li><b>Screen against a blocklist:</b> breached passwords, dictionary words, sequences (<code>123456</code>), the company's name.</li>
<li><b>Allow password managers</b> and pasting; no password hints and no &ldquo;security questions&rdquo;.</li>
<li><b>Limit failed attempts</b> — which is exactly what <code>login block-for</code> does for a router.</li>
</ul>
${K.dyk(`The rules most offices still use — symbols, digits, change every 90 days — trace back to a 2003 NIST appendix. When NIST rewrote the guidance in 2017, the author of that appendix told a newspaper he regretted much of it. Guidance changes as evidence arrives; so should your policy.`)}
<p>The exam still says <i>complexity</i>: know that classic rules (mixed character types, a minimum length) are one policy element, and that current guidance ranks length, uniqueness and blocklist screening above the mix.</p>
<h3>Management: who knows a password, and where it lives</h3>
<ul>
<li><b>No sharing.</b> One named account per person (<code>username … secret</code> now, a central server in lesson 3). A shared account makes every log line &ldquo;someone with the password&rdquo;.</li>
<li><b>Unique per device or site.</b> If the same secret is on all 40 switches, one leaked config is 40 compromised switches.</li>
<li><b>A ${K.g("password manager","Software that generates long random passwords and stores them encrypted behind one master password (plus MFA). Team versions (vaults) add access control and a record of who viewed what.")} or team vault</b> for the secrets that must exist: the enable secret, a ${K.g("break-glass account","An emergency local account used only when the normal login path (such as the central login server) is down; its secret is vaulted and changed after each use.")}, service accounts like <code>cfgbackup</code>.</li>
<li><b>Change on events, not the calendar:</b> a leaver, a leaked config, a device sent for repair — and put every automation that stores the secret on the checklist (the ticket above).</li>
<li><b>Never in tickets, chat or email,</b> and never type 7 configs in a shared folder (Module 2's case study).</li>
</ul>
${K.case("The 30-day rule that made passwords weaker",`
<p>An engineering-services firm in Port Harcourt forced every account, device logins included, to change every 30 days, with a capital, a digit and a symbol. Resets became the helpdesk's biggest ticket category, and an awareness session showed the same shape everywhere: <code>Rivers@Jan</code>, <code>Rivers@Feb</code>. The current router password lived on a sticky note in the comms room. An outside tester given one old password guessed the current one on the second try by moving the month on.</p>
<p>The new policy: passphrases of 15+ characters where a password is the only factor, a breached-password check, no scheduled changes but immediate ones for leavers or suspected compromise, a team vault for device secrets, MFA for VPN and remote device admin (lesson 3), and on the devices <code>security passwords min-length 15</code>, scrypt secrets and <code>login block-for</code> with a NOC exemption. Resets fell and the sticky notes disappeared.</p>
<p><b>The lesson:</b> rules that fight memory get worked around. Make the strong choice the easy one, and let devices enforce what they can.</p>`)}
<h3>Alternatives and additions: MFA, certificates, biometrics</h3>
<p>A password is <b>something you know</b>. ${K.g("Multifactor authentication","MFA: two or more factors from DIFFERENT categories — something you know, have, or are.")} adds a factor from a <b>different</b> category:</p>
<ul>
<li><b>Something you know</b> — a password, passphrase or PIN.</li>
<li><b>Something you have</b> — an authenticator app's changing six-digit code, a hardware token, a smart card, a text-message code (weaker: texts can be intercepted or the number moved to another phone).</li>
<li><b>Something you are</b> — a ${K.g("biometric","A body measurement used for identification (fingerprint, face, iris). It can't be changed if copied, and readers sometimes reject the right person or accept the wrong one.")}: fingerprint, face, iris.</li>
</ul>
<p>A stolen password alone no longer logs anyone in. For network devices, MFA normally arrives through the central login server (${K.g("RADIUS","Remote Authentication Dial-In User Service: a protocol routers use to ask a central login server — lesson 3.")}, lesson 3).</p>
<p>A ${K.g("digital certificate","An electronic document binding a public key to an identity, signed by a certificate authority. The holder proves identity with the matching private key.")} replaces the shared secret altogether: the device or user proves who it is with a private key that never crosses the network, and the other side checks the certificate's signature against a ${K.g("certificate authority (CA)","A trusted organisation or internal server that signs certificates.")} it trusts. HTTPS servers, 802.1X on switch ports (lesson 3) and many VPNs use them. With no password, guessing and reuse have nothing to work on; the risk moves to protecting private keys and running the CA.</p>
<p>Biometrics usually work locally: the fingerprint unlocks a key stored on the phone or laptop, and the key proves identity; the fingerprint itself normally isn't sent across the network.</p>
${K.when([
  ["Password only","Low-risk internal access with long unique passwords, block-for and logging","Works everywhere, even on the console in an outage","Remote admin of production devices"],
  ["Password + second factor (MFA)","VPN, device admin via a central server, email, cloud consoles","A stolen password alone isn't enough","The console in an outage — keep a vaulted break-glass account"],
  ["Certificates","Machines and users at scale: 802.1X, VPN clients, servers","No secret to guess, phish or reuse","Nobody can run the CA and revoke lost certificates"],
  ["Biometrics","Unlocking a device or a key held on it; doors","Fast, nothing to forget","Alone for high-value access — it can't be changed if copied"],
], "Which way of proving identity fits?")}
${K.myth([
  ["<code>service password-encryption</code> encrypts passwords properly.", "It produces type 7, which reverses in seconds. Use secrets (type 8 or 9) for logins."],
  ["<code>login block-for</code> stops attackers.", "It slows online guessing only — not offline guessing of a leaked hash, not a password stolen elsewhere — and without an exemption it can lock out your own team."],
  ["Symbols and a change every 90 days make passwords strong.", "Length and uniqueness matter more; forced changes breed patterns. NIST drops both rules but requires a change when compromise is suspected."],
  ["A password plus a security question is two-factor authentication.", "Both are something you know — one factor twice. MFA needs factors from different categories: know, have, are."],
])}
${K.dodont([
  "Give every engineer a named account: <code>username NAME [privilege 15] algorithm-type scrypt secret …</code>.",
  "Set <code>security passwords min-length</code> (12 or more; 15 if the password is the only factor) — then replace the old short ones.",
  "Build and test the quiet-mode exemption list, with your own management subnet, before adding <code>login block-for</code>.",
  "Turn on <code>login on-failure log</code> and send the messages to your syslog server (Module 7), so failures reach a person.",
  "Keep device secrets in a team vault, unique per device or site, changed when someone leaves.",
],[
  "Don't share one admin account or one enable secret across the whole team.",
  "Don't keep an <code>enable password</code> or any <code>username … password</code> line — they are type 0 or 7.",
  "Don't paste configs with type 7 lines into tickets, chat or shared folders.",
  "Don't add <code>login block-for</code> to a remote device with no exemption and no console path.",
  "Don't force calendar-based password changes on people; change on events instead.",
])}
${K.check({q:"Which password policy best follows current NIST SP 800-63B guidance for staff accounts protected by a password alone?", o:["8 characters minimum, one capital, one digit, one symbol, changed every 60 days","At least 15 characters, passphrases allowed, checked against a breached-password list, changed when compromise is suspected rather than on a schedule","12 characters, changed every 30 days, the last 10 passwords may not be reused","Any length, as long as a security question is also set"], a:1, why:"Current guidance: length (15+ when it's the only factor in the 2025 revision; 8 minimum with MFA), no composition rules, blocklist screening, no routine forced changes but a change on evidence of compromise, and no security questions."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A fintech in Lagos is choosing a login method for engineers who administer its routers remotely. Which two options are true multifactor authentication? (Choose two.)", o:["A password and the answer to 'What was your first school?'","A password and a six-digit code from an authenticator app on the engineer's phone","A smart card plus the PIN that unlocks it","A fingerprint and a face scan on the same laptop","Two different passwords, typed one after the other"], a:[1,2], why:"1. What is asked? Which pairs combine different factor categories. 2. Which rule? MFA = factors from different categories: know, have, are. 3. Apply it: password + app code = know + have; smart card + PIN = have + know. A security answer and a second password are both 'know' — one factor twice. Fingerprint + face are both 'are'. (For routers, the second factor normally comes through the central login server — lesson 3.)"})}

<h2>Interview corner</h2>
${K.reveal("“How would you secure local access to a Cisco router before it goes into production?”",`<p>&ldquo;Who can connect, who they are, what they can do. SSH only, with an access list on the VTY lines for the management subnet. Named accounts with <code>algorithm-type scrypt secret</code>, privilege 15 only for those who configure; a vaulted <code>enable algorithm-type scrypt secret</code> and no <code>enable password</code>; <code>security passwords min-length</code>; <code>exec-timeout</code> on every line. Against guessing, <code>login block-for</code> with a tested quiet-mode exemption for the management subnet, and failure/success logging to syslog. A <code>banner login</code> with the legal warning. Then I verify — only types 8 or 9 in the config, <code>show login</code>, test logins from an allowed and a refused source — and save. At scale, accounts move to a central server with MFA and the local one becomes break-glass.&rdquo;</p>`)}
${K.reveal("“What is the difference between type 7 and type 9 passwords?”",`<p>&ldquo;Type 7 is reversible: it's a scrambling with a key that's public, so anyone with the config can read the password in seconds. It's what <code>service password-encryption</code> produces, and it only stops shoulder-surfing. Type 9 is an scrypt hash — one-way, salted, and deliberately slow and memory-hungry — so someone with the config can only guess, and each guess is expensive. I use type 9 or 8 for every login secret, and I treat any type 0 or 7 line I find as already disclosed.&rdquo;</p>`)}
${K.reveal("“Your company still forces password changes every 30 days. Would you keep that?”",`<p>&ldquo;I'd propose changing it, with evidence. NIST SP 800-63B recommends against scheduled changes because people respond with predictable patterns and write passwords down. It favours long passphrases, breached-password screening, changes on evidence of compromise, and MFA where the risk justifies it. I'd keep event-driven changes for shared and service secrets, and put every automation that stores a secret on the change checklist — a stale stored password can lock people out when login blocking is on.&rdquo;</p>`)}
${K.recap([
  "Every way in is a line that asks who you are; enable or a privilege-15 account decides who may configure.",
  "Types 0 and 7 are readable from the config; types 5, 8 and 9 can only be guessed — 9 (scrypt) is the slowest. algorithm-type md5/sha256/scrypt picks 5/8/9.",
  "service password-encryption only turns type 0 into type 7; it never touches secrets and never protects for real.",
  "security passwords min-length N refuses new short passwords with '% Password too short' — old ones stay until you replace them.",
  "login block-for S attempts N within W: the Nth failure in W seconds starts quiet mode for S seconds (show login says 'more than N'); the count is per device; the console is never blocked.",
  "login quiet-mode access-class exempts your management subnet; on-failure/on-success log write %SEC_LOGIN-4-LOGIN_FAILED, -5-LOGIN_SUCCESS and -1-QUIET_MODE_ON with user, source and port.",
  "Console order: banner motd, banner login, then the prompts. Over SSH the login banner comes before authentication and the MOTD after.",
  "Policy: length and uniqueness over symbol rules, blocklist screening, no calendar-based changes, vaults, no sharing; MFA mixes know/have/are; certificates and biometrics are alternatives.",
])}
${K.next(`You now control <i>who</i> can log in to a device with local accounts. Next, lesson 3 moves those accounts to a central server: AAA with RADIUS and TACACS+, method lists with a local fallback, and how VPNs protect traffic that crosses networks you don't control.`)}
`,
quiz:[
  {lvl:1, q:"Which IOS password type can be turned back into the original password, in seconds, by anyone who has the configuration file?", o:["Type 5","Type 7","Type 8","Type 9"], a:1, why:"Type 7 uses a fixed, publicly known key, so it is reversible with free tools. Types 5, 8 and 9 are one-way hashes that can only be guessed."},
  {lvl:1, q:"A router has enable secret 9 $9$... configured. An engineer then enters service password-encryption. What happens to the enable secret line?", o:["It is re-encrypted as type 7","It is unchanged, because the service only converts plain-text (type 0) passwords to type 7","It is upgraded to a stronger hash","It is removed and must be re-entered"], a:1, why:"service password-encryption converts only type 0 entries (line passwords, enable password, username ... password) to type 7. Secrets are already hashes and are left alone."},
  {lvl:2, type:"multi", q:"An auditor sends you this excerpt from a switch backup on a shared drive. Which two lines should you treat as passwords that are already disclosed? (Choose two.)", ex:"service password-encryption\n!\nenable secret 9 $9$BkFvMvMAzuAIZe$Vz5zUNlrD2KvMrexYC1.6yfRFzJ44G6Wfzx7mb5XaVo\n!\nusername noc privilege 15 secret 9 $9$YvenHr3yaKcujS$u4Ab4buxhCaXYl9oUtNp1hi1LTsmFmt7.S7j66hfviw\nusername backup password 7 1435130807113A6676786161\n!\nline con 0\n password 7 0831444D584B56\n login", o:["enable secret 9 $9$...","username noc privilege 15 secret 9 $9$...","username backup password 7 ...","line con 0 password 7 ...","service password-encryption"], a:[2,3], why:"Type 7 entries reverse in seconds, so the backup account and the console password must be treated as known and changed (re-create backup with algorithm-type scrypt secret; use login local on the console). The type 9 secrets can only be guessed, slowly. service password-encryption is the reason the other two show as 7 instead of plain text — not a protection."},
  {lvl:1, type:"fill", q:"Type the global configuration command that makes IOS refuse any new password shorter than 12 characters.", fields:[{label:"Command", a:["security passwords min-length 12"], ios:true}], why:"security passwords min-length 12. A shorter password is refused with '% Password too short - must be at least 12 characters. Password configuration failed'."},
  {lvl:2, q:"A switch's console line has had password con1 (4 characters) for a year. Today you configure security passwords min-length 12. What happens to the console password?", o:["The console line stops accepting logins until a longer password is set","It keeps working; min-length checks only passwords configured from now on, so you must replace it yourself","IOS deletes it and the console asks for nothing","IOS pads it to 12 characters"], a:1, why:"min-length is enforced when a password is configured. Existing passwords aren't re-checked, so after adding it, find and replace old short passwords (or move the console to login local)."},
  {lvl:2, type:"fill", q:"Type the command that creates local user ops at privilege level 15 with the secret Rivers-Ops-2026 stored as type 9.", fields:[{label:"Command", a:["username ops privilege 15 algorithm-type scrypt secret Rivers-Ops-2026"], ios:true}], why:"username NAME privilege N algorithm-type scrypt secret PASSWORD. The running-config then shows username ops privilege 15 secret 9 $9$..."},
  {lvl:2, q:"Based on the exhibit, a staff PC at 10.60.10.77 now tries ssh -l ibrahim 10.60.10.1. What happens?", ex:"KN-CORE-R1#show login\n     A login delay of 2 seconds is applied.\n     Quiet-Mode access list NOC is applied.\n     All failed login is logged and generate SNMP traps.\n\n     Router enabled to watch for login Attacks.\n     If more than 3 login failures occur in 60 seconds or less,\n     logins will be disabled for 120 seconds.\n\n     Router presently in Quiet-Mode.\n     Will remain in Quiet-Mode for 95 seconds.\n     Restricted logins filtered by applied ACL NOC.\n\nKN-CORE-R1#show running-config | section NOC\nip access-list standard NOC\n 10 permit 10.60.99.0 0.0.0.255", o:["The login prompt appears, because the PC hasn't failed itself","The connection is refused for about 95 more seconds, because the router is in quiet mode and NOC doesn't permit 10.60.10.77","The PC's traffic through the router is dropped for 95 seconds","The SSH session opens but drops to user EXEC only"], a:1, why:"Quiet mode refuses new remote logins from every source the quiet-mode access-class doesn't permit. NOC permits only 10.60.99.0/24. Quiet mode doesn't block traffic through the router, and the console still works."},
  {lvl:3, q:"Abuja WAN router: login block-for 300 attempts 4 within 120 is configured with nothing else. On Monday a helpdesk technician kept typing an old password and IT couldn't SSH in for five minutes. Management wants to keep the protection but never lock IT out again. What is the best change?", o:["Remove login block-for","Raise attempts to 1000 so it never triggers","Add a standard ACL permitting the IT admin subnet and apply it with login quiet-mode access-class; add login on-failure log; give the technician the current secret from the vault","Set exec-timeout 0 0 on the VTY lines so IT sessions never close"], a:2, why:"The exemption keeps the guessing protection for everyone else while IT logs in during quiet mode; logging shows who fails; and the root cause is a people/credential problem. Removing or neutering block-for throws the protection away; exec-timeout 0 0 is a new weakness and doesn't help new logins."},
  {lvl:1, type:"match", q:"Match each command with what it does.", pairs:[["login block-for 120 attempts 3 within 60","Starts quiet mode for 120 s when 3 logins fail within 60 s"],["login quiet-mode access-class NOC","Lets sources permitted by NOC log in during quiet mode"],["login on-failure log","Writes %SEC_LOGIN-4-LOGIN_FAILED for failed logins"],["login delay 2","Waits 2 seconds between login attempts"],["exec-timeout 5 0","Ends a session after 5 idle minutes"]], why:"Read login block-for as a sentence: block for S seconds if there are N attempts within W seconds. The quiet-mode access-class is an exemption list; on-failure log creates evidence; login delay slows attempts without locking anyone out; exec-timeout is about idle sessions, not failures."},
  {lvl:2, type:"order", q:"A router has banner motd, banner login and login local on the console. Put what a console user sees in order, from first to last.", items:["The banner motd text","The banner login text","User Access Verification, then the Username: and Password: prompts","The router prompt, for example ABJ-WAN-R1>"], why:"On the console the MOTD comes first, then the login banner, then the login prompts; after a successful login, the prompt (with real IOS, any banner exec appears immediately before it). Over SSH the order differs: login banner before authentication, MOTD after."},
  {lvl:1, q:"Which combination is multifactor authentication?", o:["A password and a PIN","A password and a code from an authenticator app on the user's phone","A fingerprint and a face scan","A password and a security question"], a:1, why:"MFA combines different categories: something you know (password) and something you have (the phone generating the code). A password + PIN or a security question are both 'know'; fingerprint + face are both 'are'."},
  {lvl:2, type:"multi", q:"Which two practices match current NIST SP 800-63B password guidance? (Choose two.)", o:["Screen new passwords against lists of breached and common passwords","Allow long passwords and passphrases, and permit password managers and pasting","Force every user to change password every 90 days","Require at least one symbol, one digit and one capital letter","Use security questions as a backup login method"], a:[0,1], why:"NIST recommends blocklist screening, accepting long passphrases (64+ characters) and password managers. It recommends against routine forced changes (change on evidence of compromise instead), composition rules and knowledge-based security questions."},
  {lvl:3, q:"The exhibit is from PHC-EDGE-R2 the morning after a password rotation; the NOC reports SSH refused for ten minutes at a time, several times overnight. What is the most likely cause and the best first fix?", ex:"*Oct 13 03:00:04.512: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] at 03:00:04 UTC Tue Oct 13 2026\n*Oct 13 03:00:11.649: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] at 03:00:11 UTC Tue Oct 13 2026\n*Oct 13 03:00:18.786: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] at 03:00:18 UTC Tue Oct 13 2026\n*Oct 13 03:00:25.923: %SEC_LOGIN-1-QUIET_MODE_ON: Still timeleft for watching failures is 39 secs, [user: cfgbackup] [Source: 10.50.200.15] [localport: 22] [Reason: Login Authentication Failed] [ACL: sl_def_acl] at 03:00:25 UTC Tue Oct 13 2026", o:["A brute-force attack from the internet; shut the WAN interface","The backup server's job still uses the old cfgbackup secret and trips quiet mode on every run; update the stored credential, then add a quiet-mode access-class for the NOC","The NOC's SSH clients use the wrong key size; regenerate RSA keys","exec-timeout is too short; set exec-timeout 0 0"], a:1, why:"One user, one internal source, exactly on the hour, starting after a rotation: a stale automation credential. Three failures trip quiet mode with sl_def_acl (no exemption), locking out the NOC too. Fix the credential, then add an exemption so a broken script can't cause an outage again."},
  {lvl:3, q:"Forty branch switches share one account, username admin password 7 ..., and their configs sit in a widely readable folder. A contractor who had folder access left last week. What is the most complete response?", o:["Nothing — the password is encrypted as type 7","Turn on service password-encryption everywhere","Treat the password as disclosed: create named accounts with algorithm-type scrypt secret and unique per-site secrets in a vault, remove the shared admin account, restrict the folder, set security passwords min-length, and plan central AAA with MFA","Change the shared password to a longer one on all forty switches"], a:2, why:"Type 7 is readable, so the account is effectively public and a leaver had access. A longer shared password repeats the same weakness (shared, stored reversibly with password instead of secret). The complete fix removes sharing, uses slow hashes, unique secrets, access control on backups, a length floor, and a path to central authentication with a second factor."},
  {lvl:3, q:"You are connected by SSH from 10.80.5.9 to a remote branch router with no on-site staff today. You plan to add login block-for 600 attempts 2 within 30. What is the safest way to do it?", o:["Add it now; quiet mode never affects the session that configures it","First build a standard ACL permitting your management subnet (including 10.80.5.9), apply login quiet-mode access-class, confirm an out-of-band console path, then add login block-for and test from a second session before logging out","Add login block-for, then log out and log back in to test it","Add exec-timeout 0 0 first so your session can't be closed"], a:1, why:"With attempts 2, two typos by anyone would refuse every remote login for 10 minutes — including yours, from a new session. Build and test the exemption first, know your console path, and prove a new session works before you leave the current one (Module 2's 'test before you close' habit)."},
  {lvl:2, q:"On a Cisco router, the VTY lines have login local and transport input ssh. User amaka was created with username amaka privilege 15 algorithm-type scrypt secret .... Where does her SSH session start after she logs in?", o:["At user EXEC (>), and she must type enable","At privileged EXEC (#), because the account carries privilege 15","At global configuration mode","At privilege level 0"], a:1, why:"With login local, IOS applies the account's privilege level, so a privilege-15 user lands at # with no enable step (in the lab too). A user created without privilege gets level 1."},
],
cards:[
  {f:"IOS password types", b:"0 plain text · 7 reversible (public key) · 5 salted MD5 hash · 8 PBKDF2-SHA-256 hash · 9 scrypt hash. 4 was a flawed SHA-256 (withdrawn). 0 and 7 are readable from the config; 5/8/9 can only be guessed; use 8 or 9."},
  {f:"service password-encryption", b:"Turns type 0 entries (line passwords, enable password, username ... password) into type 7. Never touches secrets, never stronger than 7. Turning it off doesn't decrypt existing 7s."},
  {f:"algorithm-type", b:"enable algorithm-type scrypt secret P · username N [privilege L] algorithm-type scrypt|sha256|md5 secret P → type 9|8|5. Pasting enable secret 9 $9$... copies a hash without the password."},
  {f:"security passwords min-length N", b:"Global, N 0–16. New passwords shorter than N are refused: '% Password too short - must be at least N characters. Password configuration failed'. Existing passwords are not re-checked."},
  {f:"Privilege levels", b:"0 almost nothing · 1 user EXEC (>) · 15 privileged EXEC (#) · 2–14 custom. username X privilege 15 + login local → straight to #, no enable step."},
  {f:"login block-for S attempts N within W", b:"The Nth failure within W seconds starts quiet mode for S seconds (show login says 'more than N'). Count is per device, all sources and remote protocols. Default login delay 1 s. Console never blocked."},
  {f:"login quiet-mode access-class ACL", b:"Exemption list: sources the standard ACL permits may still log in during quiet mode. Without it: 'Denying logins from all sources' and [ACL: sl_def_acl] in the log. Build and test it before block-for."},
  {f:"Login logging", b:"login on-failure log / login on-success log [every N]. %SEC_LOGIN-4-LOGIN_FAILED (user, source, localport 22/23, reason), -5-LOGIN_SUCCESS, -1-QUIET_MODE_ON, -5-QUIET_MODE_OFF."},
  {f:"show login", b:"Delay, quiet-mode ACL, what is logged, the watch ('If more than N failures in W s, disabled for S s'), then Normal-Mode with window time and failure count, or Quiet-Mode with time left and who is allowed."},
  {f:"banner motd vs banner login", b:"Console: MOTD first, then login banner, then Username/Password. SSH: login banner before authentication, MOTD after login. Legal warning → banner login. banner exec = after login (not in the lab)."},
  {f:"NIST SP 800-63B essentials", b:"Long over complex (800-63B-4: 15+ if the only factor, 8+ with MFA; allow 64+), no composition rules, no routine forced changes (change on compromise), blocklist screening, allow password managers, no hints/security questions, limit failed attempts."},
  {f:"MFA factors", b:"Something you know (password, PIN) · have (authenticator app, token, smart card) · are (fingerprint, face). MFA = two or more DIFFERENT categories. Two passwords or password + security question = one factor."},
  {f:"Certificates and biometrics", b:"Certificate: identity proved with a private key, checked against a trusted CA — nothing to guess or reuse (802.1X, VPNs, HTTPS). Biometrics: usually unlock a key on the device; can't be changed if copied."},
  {f:"Password management", b:"Named accounts, no sharing; unique per device/site; team vault for enable, break-glass and service accounts; change on events (leaver, leak, repair); every automation that stores a secret on the rotation checklist."},
],
});

// ---------- Module 8 · Lesson 3 ----------
L.push({
id:"sec-aaa-vpn", mins:105, level:"Intermediate · builds on Module 2 SSH and lessons 1–2",
t:"AAA and VPNs — who may log in, what they may do, and how traffic crosses the internet safely",
html:`
${K.goals([
  "Explain authentication, authorization and accounting with workplace examples, and choose local or server-based AAA.",
  "Compare RADIUS and TACACS+: transport and ports, what each encrypts, how each handles the three A's, where each is used.",
  "Configure <code>aaa new-model</code>, a RADIUS or TACACS+ server, default and named method lists with a local fallback, and <code>login authentication</code> — and predict exactly when the fallback is used.",
  "Describe 802.1X: supplicant, authenticator, authentication server and EAP.",
  "Explain site-to-site and remote-access VPNs: IPsec's services, IKE phases, ESP vs AH, tunnel vs transport mode, NAT-T, GRE over IPsec and TLS VPNs.",
])}
${K.pre(["Module 2: SSH remote access — <code>username … secret</code>, <code>line vty</code>, <code>login local</code>, <code>transport input ssh</code>, <code>ssh -l</code>.","Lesson 2: <code>enable secret</code>, <code>algorithm-type scrypt</code>, why type 7 is not protection, <code>login on-failure log</code> and %SEC_LOGIN messages.","Module 1: TCP vs UDP and ports; what a VPN is. Module 7: NAT/PAT and syslog. Lesson 1: confidentiality, integrity, threats and mitigations."])}

<h2>Why this matters at work</h2>
<p>A microfinance bank, forty branches, head office in Abuja. The IT audit has four findings: &ldquo;Twelve engineers share one <i>admin</i> password on 180 routers and switches.&rdquo; &ldquo;A contractor who left in March can still log in.&rdquo; &ldquo;Nobody can say who changed the core switch on 2 August.&rdquo; &ldquo;Branches reach head office across the internet — show the traffic is protected.&rdquo;</p>
<p>The first three are one problem: logins are checked on each box separately and recorded nowhere central. The fix is <b>AAA</b> with a central server, spoken to over ${K.g("RADIUS","Remote Authentication Dial-In User Service (RFC 2865/2866): an open UDP protocol a device uses to ask a central server whether a user may log in or connect.")} or ${K.g("TACACS+","Terminal Access Controller Access-Control System Plus (Cisco, RFC 8907): a TCP port 49 protocol a device uses to ask a central server to authenticate admins, authorise commands and record them.")}. The fourth is a <b>VPN</b>, usually IPsec. You'll build AAA in the lab; VPNs and 802.1X are concepts and config reading — the lab has no engine for them.</p>

<h2>AAA: three questions every login answers</h2>
${K.remember(`<b>The rule in one line:</b> <b>Authentication</b> = <i>who are you?</i> (prove it); <b>Authorization</b> = <i>what may you do?</i>; <b>Accounting</b> = <i>what did you do, and when?</i> They happen in that order: no rights before identity, and the record runs for the whole session.`)}
<p>AAA (Module 2) splits &ldquo;login security&rdquo; into three jobs, so each can be done and checked separately.</p>
${K.analogy(`A hotel: the front desk checks your passport (<b>authentication</b>); your key card opens room 412 and the gym, not the staff office (<b>authorization</b>); the door system logs every door it opened (<b>accounting</b>).`)}
${K.svg("0 0 760 300",
  K.txt(20,20,"AAA: the device asks, the server decides and records",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("laptop",80,70,"ADMIN","ssh to the router")+K.dev("router",380,70,"BR-R1","network access device")+K.dev("server",680,70,"AAA SERVER","RADIUS or TACACS+")+
  K.arrow(110,60,350,60,"1 · username + password",true)+K.arrow(410,60,650,60,"2 · is this user OK?",true)+K.arrow(650,90,410,90,"3 · accept / reject + rights")+
  K.box(20,150,230,62,"Authentication","who are you? prove it",true)+K.box(265,150,230,62,"Authorization","what may you do?")+K.box(510,150,230,62,"Accounting","what did you do, and when?")+
  K.txt(135,236,"badge + PIN at the door",{mid:true,c:"fg",s:11,f:"body"})+K.txt(135,254,"password, certificate, MFA code",{mid:true,s:11,f:"body"})+
  K.txt(380,236,"which floors the badge opens",{mid:true,c:"fg",s:11,f:"body"})+K.txt(380,254,"privilege level, allowed commands",{mid:true,s:11,f:"body"})+
  K.txt(625,236,"the door log",{mid:true,c:"fg",s:11,f:"body"})+K.txt(625,254,"login times, every command typed",{mid:true,s:11,f:"body"})+
  K.txt(380,288,"Local AAA keeps the user list on each device; server-based AAA asks one central server for every device.",{mid:true,s:11,f:"body"}),
  "The three A's. The router (the network access device) never has to know the user's password when a server decides.")}
<div class="tablewrap"><table>
<tr><th>A</th><th>On a router or switch</th><th>In a bank branch</th></tr>
<tr><td><b>Authentication</b></td><td>Username, password (plus an MFA code, lesson 2) before you get a prompt</td><td>A teller signs in with an ID and a token</td></tr>
<tr><td><b>Authorization</b></td><td>Helpdesk may run <code>show</code> commands, not <code>configure terminal</code></td><td>Deposits up to a limit; bigger ones need a supervisor</td></tr>
<tr><td><b>Accounting</b></td><td>Session times and every command typed, sent to the server</td><td>The audit trail of who posted what, when</td></tr>
</table></div>
<h3>Local AAA or server-based AAA?</h3>
<p><b>Local</b> is what Module 2 and lesson 2 built: <code>username netops algorithm-type scrypt secret …</code> on each device. It needs no server — but every joiner, leaver and password change must be typed on every device, and each box keeps its own logs. On 180 devices, that's how a contractor who left in March keeps a working account.</p>
<p><b>Server-based</b> means each device acts as a ${K.g("network access device","The router, switch, wireless controller or VPN firewall a user logs in to or through. It passes the login to the AAA server and enforces the answer (RADIUS calls it the NAS).")} and asks one AAA server — for example Cisco ${K.g("ISE","Identity Services Engine: Cisco's AAA and network-access policy server. It speaks both RADIUS and TACACS+ and can check users against Active Directory.")} or Microsoft ${K.g("NPS","Network Policy Server: the RADIUS server role built into Windows Server. It speaks RADIUS only, not TACACS+.")}, which usually checks the company ${K.g("directory","The central list of staff accounts and groups, usually Microsoft Active Directory. Disable someone there and every system that asks it refuses them.")}. Disable a leaver once and every device refuses them; every admin has their own name; the records sit in one place. You still keep one strong local <b>break-glass</b> account on every device for the day the server can't be reached — and you'll see exactly when IOS uses it.</p>
${K.when([
  ["Local AAA", "A handful of devices — and always as the fallback", "Needs no server, so works when the network is broken", "Many devices or admins: every change repeated everywhere"],
  ["Server-based AAA (RADIUS / TACACS+)", "Many devices and admins, audits, same-day leaver removal", "One account per person, one place to disable it, central records", "It would be the only way in — always end the list with local"],
], "Local or server-based AAA?")}
${K.check({q:"A contractor's last day is Friday. He logs in to 180 routers and switches with his own username. Which design removes his access everywhere with one change?", o:["A local username on every device, deleted device by device","Server-based AAA checking the company directory: disable his directory account once","service password-encryption on every device","A banner login warning contractors not to log in"], a:1, why:"The devices ask the server, which asks the directory, so one disabled account is refused everywhere. Local accounts are removed device by device — exactly how leavers get missed. Encryption and banners don't decide who may log in."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"An insurance firm's AAA server handles five events from its VPN headend and routers. Which two are AUTHORIZATION? (Choose two.)", o:["A VPN user is asked for a username, a password and a one-time code from an app","Contractors are put in a group that can reach only the ticketing system","Helpdesk engineers logged in to the routers are refused configure terminal","The server records that a user was connected from 09:02 to 17:40","A laptop's certificate is checked before the tunnel starts"], a:[1,2], why:"1. What is asked? Which events decide what an identity may do. 2. Which rule? Authentication proves who you are; authorization decides what you may do; accounting records what happened. 3. Apply it: limiting contractors to one system and refusing configure terminal are rights — authorization. The password + code and the certificate check prove identity (authentication); the connection times are accounting."})}

<h2>RADIUS vs TACACS+: two ways to ask the server</h2>
${K.remember(`<b>The rule:</b> <b>RADIUS</b> — UDP 1812/1813, encrypts <b>only the password</b>, authentication + authorization in one answer, open standard, for <b>network access</b>. <b>TACACS+</b> — TCP 49, encrypts the <b>whole body</b>, keeps the <b>three A's separate</b> (per-command control), Cisco-designed, for <b>device administration</b>.`)}
<h3>RADIUS</h3>
<p>RADIUS runs almost every enterprise Wi-Fi, 802.1X and VPN login. The device sends an <b>Access-Request</b>; the server replies <b>Access-Accept</b> — authorization attributes (privilege level, VLAN, group) in the same reply — <b>Access-Reject</b>, or <b>Access-Challenge</b> (&ldquo;I need more&rdquo;, e.g. an MFA code). Accounting is a separate exchange.</p>
<ul>
<li><b>Ports:</b> UDP <b>1812</b> authentication, <b>1813</b> accounting. The legacy <b>1645/1646</b> are still seen — and Cisco documents them as IOS's defaults when you leave the ports out, which is why configs spell out <code>auth-port 1812 acct-port 1813</code>.</li>
<li><b>Encryption:</b> a shared secret hides <b>only the User-Password field</b>. Username, device address and authorization attributes cross the network readable.</li>
<li><b>UDP:</b> no connection tells the device the server is gone, so it waits and retries (IOS: 5 seconds, 3 retransmissions).</li>
</ul>
<h3>TACACS+</h3>
<p>Cisco built TACACS+ for administrators logging in to network devices, over <b>TCP port 49</b> — the handshake shows at once whether the server is there. The three A's are <b>separate conversations</b>, so the router can authenticate you, then ask about each command (&ldquo;may amaka run <code>configure terminal</code>?&rdquo;) and account for it. It encrypts the <b>entire body</b>; only the header is readable. It is <b>not</b> a newer version of the old TACACS protocol or its Extended TACACS variant — both obsolete and incompatible.</p>
${K.svg("0 0 760 235",
  K.txt(20,22,"What an eavesdropper on the device–server link can read",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(20,50,"RADIUS · UDP 1812 (authentication) / 1813 (accounting)",{c:"fg",s:11.5,b:true,f:"body"})+
  K.band(20,58,60,32,"IP")+K.band(80,58,60,32,"UDP")+K.band(140,58,120,32,"RADIUS hdr")+K.band(260,58,150,32,"User-Name: amaka")+K.band(410,58,140,32,"User-Password","var(--panel2)")+K.band(550,58,190,32,"other attributes")+
  `<rect x="406" y="54" width="148" height="40" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`+
  K.txt(480,110,"hidden with the shared key",{mid:true,c:"accent",s:10.5,f:"body"})+K.txt(200,110,"readable by anyone on the path",{mid:true,s:10.5,f:"body"})+K.txt(645,110,"readable",{mid:true,s:10.5,f:"body"})+
  K.txt(20,138,"TACACS+ · TCP 49",{c:"fg",s:11.5,b:true,f:"body"})+
  K.band(20,146,60,32,"IP")+K.band(80,146,60,32,"TCP")+K.band(140,146,120,32,"TACACS+ hdr")+K.band(260,146,480,32,"body: user, password, command, privilege level","var(--panel2)")+
  `<rect x="256" y="142" width="488" height="40" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`+
  K.txt(500,198,"the whole body is encrypted with the shared key (the header stays readable)",{mid:true,c:"accent",s:10.5,f:"body"})+
  K.txt(380,224,"RADIUS: a capture shows who logged in and what was authorised. TACACS+: only that a session happened.",{mid:true,c:"fg",s:11,f:"body"}),
  "The dashed outline marks what is encrypted. The shared key is configured on the device and on the server; it never crosses the wire.")}
<div class="tablewrap"><table>
<tr><th></th><th>RADIUS</th><th>TACACS+</th></tr>
<tr><td><b>Transport and ports</b></td><td>UDP 1812 auth (+ authorization), 1813 accounting; legacy 1645/1646</td><td>TCP 49</td></tr>
<tr><td><b>Encrypted</b></td><td>Only the password</td><td>The whole message body</td></tr>
<tr><td><b>The three A's</b></td><td>Authentication and authorization combined in one reply; accounting separate</td><td>All three separate — per-command authorization and accounting</td></tr>
<tr><td><b>Standard · servers</b></td><td>Open IETF (RFC 2865/2866) · ISE, NPS, FreeRADIUS</td><td>Cisco-developed (RFC 8907) · ISE</td></tr>
<tr><td><b>Typical use</b></td><td>Network access: 802.1X, Wi-Fi, VPN users</td><td>Device administration: who may log in, and run what</td></tr>
</table></div>
${K.remember(`<b>TACACS+:</b> <b>T</b>CP and <b>T</b>otal encryption — and the <b>+</b> keeps the three A's apart. <b>RADIUS:</b> UDP, hides only the password, made for <b>R</b>emote users joining the network. Ports: <b>1812 before 1813</b> — you authenticate before you're accounted for.`)}
${K.when([
  ["TACACS+", "Admins logging in to routers, switches and firewalls", "Per-command authorization and accounting; whole body encrypted", "The only server speaks RADIUS (e.g. Windows NPS)"],
  ["RADIUS", "Users joining the network (802.1X, Wi-Fi, VPN) — or device logins where only a RADIUS server exists", "Universal open standard", "You need per-command authorization, or usernames must not be readable on the path"],
], "RADIUS or TACACS+?")}
${K.dyk(`RFC 8907 — TACACS+ became an RFC only in 2020, after two decades as an unfinished 1990s draft — calls its body protection <i>obfuscation</i>, not encryption, and says TACACS+ must run over networks that already protect the traffic — one reason AAA traffic stays on the management network.`)}
${K.check({q:"An auditor wants every command an engineer types on the core switches approved and logged individually, and nothing readable on the wire between switch and server. Which protocol fits?", o:["RADIUS, because it is an open standard","TACACS+, because it separates authorization and accounting per command and encrypts the whole body","RADIUS, because UDP is faster than TCP","Either — they encrypt the same fields"], a:1, why:"Per-command authorization and accounting need the A's kept separate, which TACACS+ does; it also encrypts the whole body. RADIUS combines authentication and authorization in one reply and hides only the password."})}
<h3>Same logic, new situation</h3>
<p>An audit capture between a wireless controller and the AAA server shows UDP to port 1812: the auditor reads <code>User-Name = tunde.a</code> and a VLAN number, but no password. A capture from the core routers to the same server shows TCP port 49 and nothing readable after the header. Which protocol is each — and is either a finding?</p>
${K.hint(`Port and transport identify the protocol. Then: which fields does it encrypt — and is what you can read surprising?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Name each protocol; judge whether it's a fault. <b>2. Which rule?</b> UDP 1812 is RADIUS, which hides only the password; TCP 49 is TACACS+, which encrypts the whole body. <b>3. Apply it:</b> both behave as designed. Worth a note: anyone on the RADIUS path learns staff usernames, so that traffic belongs on a protected management network.</p>`)}

${K.drill({title:"RADIUS or TACACS+?", types:["radtac"], count:5})}
<h2>Configuring AAA on IOS: method lists and the local safety net</h2>
${K.remember(`<b>The rule:</b> <code>aaa new-model</code> hands logins to AAA. A <b>method list</b> is an ordered list of ways to check a login; IOS moves to the next method <b>only if the current one can't answer</b> (server down, unreachable, none configured). <b>Accept or Reject is final</b>. A line uses the list it names with <code>login authentication NAME</code>, otherwise <code>default</code>.`)}
<h3>What aaa new-model changes</h3>
<p>Before <code>aaa new-model</code>, every <code>aaa authentication …</code> command is refused (<code>% Invalid input detected</code>). After it, <code>login</code> / <code>login local</code> on lines stop deciding, and until a <code>default</code> list exists:</p>
<ul>
<li><b>VTY lines</b> check the <b>local</b> username list — with no local users yet, you've just locked yourself out of SSH.</li>
<li><b>The console</b> asks for <b>nothing</b>: anyone with a console cable gets a prompt — a hole to close (lesson 1: physical access is security).</li>
</ul>
${K.out(`LAG-CORE1#show running-config | section line
line con 0
line vty 0 4
 login local
 transport input ssh
LAG-CORE1#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
LAG-CORE1(config)#aaa new-model
LAG-CORE1(config)#do show running-config | section line
line con 0
line vty 0 4
 transport input ssh`, "As in the lab, so on a real router (Cisco documents the same): login local vanishes from the VTY block once AAA is on. IOS also adds aaa session-id common by itself (how accounting records are numbered — nothing to configure at CCNA level).")}
<h3>Method lists and server blocks</h3>
<p><code>aaa authentication login</code> <i>NAME</i> <i>method1</i> [<i>method2</i> …] — NAME is <code>default</code> or one you choose. The <code>default</code> list applies to <b>every line that doesn't name a list, the console included</b>; a named list does nothing until a line says <code>login authentication NAME</code>.</p>
<div class="tablewrap"><table>
<tr><th>Method</th><th>Checks the login against</th><th>Use it</th></tr>
<tr><td><code>group tacacs+</code></td><td>The configured TACACS+ servers</td><td>First, for device administration</td></tr>
<tr><td><code>group radius</code></td><td>The configured RADIUS servers</td><td>First, where only RADIUS exists</td></tr>
<tr><td><code>local</code></td><td>The device's <code>username … secret</code> list</td><td>Last: the break-glass fallback</td></tr>
<tr><td><code>enable</code></td><td>The enable secret, as the login password</td><td>Avoid — everyone shares it</td></tr>
<tr><td><code>line</code></td><td>The line's own <code>password</code></td><td>Rare with AAA</td></tr>
<tr><td><code>none</code></td><td>Nothing — anyone gets in</td><td>Never on VTY lines</td></tr>
</table></div>
<p>Each server is a named block with its address and a <b>shared key</b> matching the server's entry for this router (ISE: network device; NPS: RADIUS client). For RADIUS: <code>radius server NPS-LAG1</code> → <code>address ipv4 10.10.99.30 auth-port 1812 acct-port 1813</code> → <code>key …</code>. With <code>service password-encryption</code> the key shows as <code>key 7 …</code> — reversible (lesson 2), so a config with keys in it is itself a secret.</p>
<h3>Worked example: Lagos HQ core router</h3>
<p>Design: admins SSH to LAG-CORE1 with their ISE (TACACS+) accounts; if ISE can't be reached, the local break-glass account <code>netops</code> works; the console always asks for a local username, so a broken ISE policy can never lock it.</p>
${K.steps([
  ["Break-glass account, then AAA on", "<code>username netops algorithm-type scrypt secret Lag-Br3ak-Gl4ss!</code> (lesson 2); prove SSH works and keep that session open; then <code>aaa new-model</code>."],
  ["Server, lists, lines", "The TACACS+ block (TCP 49 is the default port), a VTY list ending in <code>local</code>, a local-only console list, each applied with <code>login authentication</code> — as below."],
  ["Test from a new session", "Log in from a <b>fresh</b> SSH session before closing the old one; read the config back; save."],
])}
${K.out(`LAG-CORE1(config)#tacacs server ISE-LAG1
LAG-CORE1(config-server-tacacs)#address ipv4 10.10.99.20
LAG-CORE1(config-server-tacacs)#key Ex4mple-Tac-K3y
LAG-CORE1(config-server-tacacs)#exit
LAG-CORE1(config)#aaa authentication login VTY-AUTH group tacacs+ local
LAG-CORE1(config)#aaa authentication login CON-AUTH local
LAG-CORE1(config)#line vty 0 4
LAG-CORE1(config-line)#login authentication VTY-AUTH
LAG-CORE1(config-line)#line console 0
LAG-CORE1(config-line)#login authentication CON-AUTH
LAG-CORE1(config-line)#end
LAG-CORE1#show running-config | section aaa
aaa new-model
aaa authentication login VTY-AUTH group tacacs+ local
aaa authentication login CON-AUTH local
aaa session-id common
LAG-CORE1#show running-config | section line
line con 0
 login authentication CON-AUTH
line vty 0 4
 login authentication VTY-AUTH
 transport input ssh`, "As the lab prints it. For each line block: which list, so which methods?")}
${K.svg("0 0 760 315",
  K.txt(20,22,"aaa authentication login VTY-AUTH group radius local — how IOS walks the list",{c:"fg",s:12,b:true,f:"body"})+
  K.box(20,50,170,52,"SSH login arrives","username + password")+K.arrow(190,76,236,76,"")+
  K.box(240,50,220,52,"1 · group radius","ask the RADIUS server(s)",true)+K.arrow(460,76,526,76,"no answer",true)+
  K.box(530,50,210,52,"2 · local","check the username list")+
  K.arrow(300,102,240,168,"Accept")+K.arrow(400,102,450,168,"Reject")+
  K.box(150,170,170,52,"Logged in","the server said yes")+K.box(370,170,170,52,"Login fails","local is never tried")+
  K.arrow(585,102,585,168,"")+K.txt(578,140,"match",{end:true,s:10.5,f:"body"})+K.arrow(695,102,695,168,"")+K.txt(702,140,"no match",{s:10.5,f:"body"})+
  K.box(530,170,105,52,"Logged in","local user")+K.box(645,170,95,52,"Fails","wrong or unknown")+
  K.txt(380,256,"The next method is tried only when the current one can't answer: server down, unreachable, or none configured.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,276,"Accept and Reject are both answers, and final. A user the server doesn't know is rejected, not handed to local.",{mid:true,s:11,f:"body"})+
  K.txt(380,296,"Every method used up with no answer means the login fails too — that's why a server list should end with local.",{mid:true,s:11,f:"body"}),
  "IOS calls a method that can't answer an ERROR and a Reject a FAIL. Only an ERROR moves IOS down the list.")}
${K.mistake(`Treating local as a &ldquo;second chance&rdquo; when the server says no. If ISE is up and rejects <code>netops</code> (it exists only on the router), the login fails — local is never checked. The break-glass account works <b>only while the server is silent</b>; while it's up, use the console's local list.`)}
${K.mistake(`<code>aaa new-model</code> on a remote device with no local user (SSH locks at once), or <code>aaa authentication login default group tacacs+</code> alone (every line, console included, locks when the server is unreachable). Create the local account first, end lists with <code>local</code>, keep a second session or <code>reload in 10</code> (Module 2) as a way back.`)}

<h3>Authorization and accounting: reading a real config</h3>
<p>The lab models only login authentication; on real devices the same method lists drive authorization and accounting:</p>
${K.out(`aaa authorization exec default group tacacs+ local
aaa authorization commands 15 default group tacacs+ local
aaa accounting exec default start-stop group tacacs+
aaa accounting commands 15 default start-stop group tacacs+`, "Real-IOS reference, not runnable in the lab. exec = may this user have a CLI; commands 15 = ask about every level-15 command; start-stop = a record at start and end.")}
${K.check({q:"A router has aaa new-model and aaa authentication login VTY-AUTH group radius local, applied to line vty 0 4 only. No default list exists. What does the console ask for?", o:["A RADIUS username and password","A local username and password","Nothing — with AAA on and no default list, the console has no login check","The enable secret"], a:2, why:"VTY-AUTH is used only where a line names it. The console names no list and there is no default list, so with AAA on it asks for nothing — add a console list (or a default list) to close the gap."})}
<h3>Try it: a Port Harcourt access switch on one default list</h3>
<p>PH-ACC-SW3's design: one <code>default</code> list for every line, TACACS+ first, local second. Notice where it ends up applying.</p>
${K.term({env:"ios2", title:"PH-ACC-SW3 — AAA with one default list", opts:{kind:"switch", host:"PH-ACC-SW3", model:"C9200L-24P-4G", motd:"PH-ACC-SW3 — console session (lab switch, no enable secret)."},
  setup:env=>{ env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Lab note: there is no TACACS+ server anywhere in the lab, so this terminal can only build and read the config.",
  tasks:[
    {text:"Try <code>aaa authentication login default group tacacs+ local</code> <b>before</b> AAA is on. What does IOS say, and why?", done:e=>e.history.some(h=>/^\s*aaa\s+authentication\s+login\s+default/i.test(h))},
    {text:"Create the break-glass account first (lesson 2): <code>username breakglass algorithm-type scrypt secret Br3ak-Gl4ss-PH!</code>", done:e=>!!(e.users && e.users.breakglass)},
    {text:"Turn AAA on with <code>aaa new-model</code>, then add the server: <code>tacacs server TAC-PH1</code>, <code>address ipv4 10.30.99.20</code>, <code>key T4c-Ex4mple-K3y</code>, <code>exit</code>", done:e=>!!(e.aaa && e.aaa.on && e.aaa.tacacs["TAC-PH1"] && e.aaa.tacacs["TAC-PH1"].ip==="10.30.99.20" && e.aaa.tacacs["TAC-PH1"].key)},
    {text:"Now the default list works: <code>aaa authentication login default group tacacs+ local</code>", done:e=>!!(e.aaa && e.aaa.lists["default"] && e.aaa.lists["default"].join()==="group tacacs+,local")},
    {text:"<code>service password-encryption</code>, then <code>do show running-config | section tacacs</code>. How is the key shown now — and is that protection? (Lesson 2.)", done:e=>!!e.servicePwEnc && e.history.some(h=>/sh\S*\s+run\S*.*\|\s*sec\S*\s+tacacs/i.test(h))},
    {text:"<code>end</code>, then <code>show running-config | section line</code>. No line names a list — so which methods do <code>line con 0</code>, <code>vty 0 4</code> and <code>vty 5 15</code> use?", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+run\S*.*\|\s*sec\S*\s+line/i.test(h))},
  ],
  win:"One default list now covers the console and all sixteen VTY lines: TACACS+ first, the scrypt break-glass account if the server doesn't answer. The key shows as type 7 — reversible, so the config file itself is still a secret. On a switch where the console should never depend on the server, you'd add a named console list instead.",
  solve:["enable","configure terminal","aaa authentication login default group tacacs+ local","username breakglass algorithm-type scrypt secret Br3ak-Gl4ss-PH!","aaa new-model","tacacs server TAC-PH1","address ipv4 10.30.99.20","key T4c-Ex4mple-K3y","exit","aaa authentication login default group tacacs+ local","service password-encryption","do show running-config | section tacacs","end","show running-config | section line"]})}
${K.hint(`Task 1: AAA commands don't exist until <code>aaa new-model</code>. Task 6: a line without <code>login authentication</code> uses <code>default</code>.`)}
<h3>Hands-on: Abuja branch — RADIUS first, local as the safety net</h3>
<p>A Windows NPS server arrives at the Abuja branch next month (10.20.99.30). Today: prepare ABJ-BR1 so SSH logins go to RADIUS once it's live — without locking anyone out meanwhile. Then settle an argument and close the console gap.</p>
${K.bench({id:"m8-abuja-aaa", points:110, from:"CCNA · Module 8 · lesson 3", title:"Abuja: RADIUS first, local as the safety net", viewBox:"0 0 900 420",
  intro:"<b>Design:</b> ABJ-BR1 Gi0/1 = IT admin LAN 10.20.99.0/24 (gateway .1); ADMIN-PC 10.20.99.10, ADMIN-LAP 10.20.99.11. SSH is set up (Module 2): local user <code>netops</code> / <code>Abj-Netops!26</code>; enable secret <code>Abj-En4ble!26</code>; <code>login on-failure log</code> on (lesson 2). RADIUS server: <b>10.20.99.30</b>, ports 1812/1813, key <code>Rad-Ex4mple-K3y</code> — <b>not installed yet: nothing answers there</b> (lab examples). Console on ABJ-BR1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab notes:</b> the lab has no RADIUS or TACACS+ server device, so a method list always moves past its <code>group</code> method — as a real router does when its server is silent. A real router first waits (RADIUS defaults: 5 seconds per try, 3 retransmissions); the lab moves on at once. A real server that answers decides the login itself.",
  devices:[
    {id:"r", kind:"router", label:"ABJ-BR1", x:340, y:20, config:e=>{ ["en","conf t","hostname ABJ-BR1","no ip domain-lookup","enable algorithm-type scrypt secret Abj-En4ble!26","ip domain name abuja.example.com","username netops algorithm-type scrypt secret Abj-Netops!26","login on-failure log","int g0/1","description IT ADMIN LAN","ip address 10.20.99.1 255.255.255.0","no shut","line vty 0 4","login local","transport input ssh","exit","crypto key generate rsa",""].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"ABJ-SW1", x:460, y:140},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:220, y:290},
    {id:"ad", kind:"pc", label:"ADMIN-PC", x:500, y:290, ip:"10.20.99.10", mask:"255.255.255.0", gw:"10.20.99.1"},
    {id:"ad2", kind:"laptop", label:"ADMIN-LAP", x:680, y:290, ip:"10.20.99.11", mask:"255.255.255.0", gw:"10.20.99.1"},
  ],
  cables:[ {type:"cat6", a:"r:g1", b:"sw:g1"}, {type:"cat6", a:"ad:eth", b:"sw:g2"}, {type:"cat6", a:"ad2:eth", b:"sw:g3"}, {type:"console", a:"lap:usb", b:"r:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Before you change anything, prove your way in: from ADMIN-PC <code>ssh -l netops 10.20.99.1</code>, log in with the build-sheet password, then <code>exit</code>", done:B=>Bench.remoteTo(B,"ad")==="10.20.99.1"},
    {text:"Console to ABJ-BR1, <code>enable</code>, <code>configure terminal</code>, <code>aaa new-model</code>, <code>end</code>. Run <code>show running-config | section line</code> — what vanished from the VTY block? Then <code>exit</code> the console and press Enter: did it ask for a username?", done:B=>{ const e=B.devs.r.env; return !!(e.aaa && e.aaa.on) && e.history.some(h=>/^\s*sh\S*\s+run\S*.*\|\s*sec\S*\s+line/i.test(h)); }},
    {text:"Back in configuration mode: <code>radius server RAD-ABJ</code> with <code>address ipv4 10.20.99.30 auth-port 1812 acct-port 1813</code> and <code>key Rad-Ex4mple-K3y</code>; the list <code>aaa authentication login VTY-AUTH group radius local</code>; and under <code>line vty 0 4</code>, <code>login authentication VTY-AUTH</code>", done:B=>{ const e=B.devs.r.env, s=e.aaa && e.aaa.radius["RAD-ABJ"]; return !!s && s.ip==="10.20.99.30" && /1812/.test(s.ports||"") && !!s.key && (e.aaa.lists["VTY-AUTH"]||[]).join()==="group radius,local" && e.lines.vty.authList==="VTY-AUTH"; }},
    {text:"Prove the safety net: from ADMIN-PC, <code>ping 10.20.99.30</code> (does anything answer there?), then SSH in as <code>netops</code>. Which method let you in, and why was it allowed to try?", done:B=>{ const e=B.devs.r.env; return (e.aaa.lists["VTY-AUTH"]||[]).join()==="group radius,local" && e.lines.vty.authList==="VTY-AUTH" && Bench.tried(B,"ad",/ping\s+10\.20\.99\.30/) && Bench.remoteTo(B,"ad")==="10.20.99.1"; }},
    {text:"Your colleague Halima: &ldquo;Policy says RADIUS — take <code>local</code> out of the list.&rdquo; Test her idea: <code>exit</code> ADMIN-PC's session, set <code>aaa authentication login VTY-AUTH group radius</code> on the console, then from ADMIN-LAP SSH in as netops with the <b>correct</b> password (three tries). Read <code>show logging | include SEC_LOGIN</code> on the console", done:B=>{ const e=B.devs.r.env; return (e.aaa.lists["VTY-AUTH"]||[]).join()==="group radius" && Bench.loginFailures(B,"r")>=1 && Bench.tried(B,"ad2",/^\s*ssh\b/) && e.history.some(h=>/sh\S*\s+log\S*.*SEC_LOGIN/i.test(h)); }},
    {text:"Put the safety net back (<code>aaa authentication login VTY-AUTH group radius local</code>) and prove ADMIN-LAP now logs in", done:B=>{ const e=B.devs.r.env; return (e.aaa.lists["VTY-AUTH"]||[]).join()==="group radius,local" && Bench.remoteTo(B,"ad2")==="10.20.99.1"; }},
    {text:"Close the console gap from task 2: <code>aaa authentication login CON-AUTH local</code> and, under <code>line console 0</code>, <code>login authentication CON-AUTH</code>. <code>end</code>, <code>exit</code> the console and log back in as netops, then <code>enable</code> and <code>copy running-config startup-config</code>", done:B=>{ const e=B.devs.r.env; return e.lines.con.authList==="CON-AUTH" && (e.aaa.lists["CON-AUTH"]||[]).join()==="local" && !!e.savedOnce; }},
  ],
  win:"ABJ-BR1 is ready for NPS: SSH goes to RADIUS first and falls back to the local scrypt account only because nothing answers at 10.20.99.30 — and you proved that without local, a silent server means nobody gets in (three LOGIN_FAILED lines with the right password). The console now always asks for a local username. Remember the other half: when NPS goes live and ANSWERS, its word is final — netops will be rejected over SSH unless NPS knows it, so the break-glass account is for server outages (and the console), not daily use.",
  solve:[["pc","ad","ssh -l netops 10.20.99.1"],["pc","ad","Abj-Netops!26"],["pc","ad","exit"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Abj-En4ble!26"],["term","configure terminal"],["term","aaa new-model"],["term","end"],["term","show running-config | section line"],["term","exit"],["term",""],
    ["term","enable"],["term","Abj-En4ble!26"],["term","configure terminal"],["term","radius server RAD-ABJ"],["term","address ipv4 10.20.99.30 auth-port 1812 acct-port 1813"],["term","key Rad-Ex4mple-K3y"],["term","exit"],
    ["term","aaa authentication login VTY-AUTH group radius local"],["term","line vty 0 4"],["term","login authentication VTY-AUTH"],["term","end"],
    ["pc","ad","ping 10.20.99.30"],["pc","ad","ssh -l netops 10.20.99.1"],["pc","ad","Abj-Netops!26"],["pc","ad","exit"],
    ["term","configure terminal"],["term","aaa authentication login VTY-AUTH group radius"],["term","end"],
    ["pc","ad2","ssh -l netops 10.20.99.1"],["pc","ad2","Abj-Netops!26"],["pc","ad2","Abj-Netops!26"],["pc","ad2","Abj-Netops!26"],
    ["term","show logging | include SEC_LOGIN"],
    ["term","configure terminal"],["term","aaa authentication login VTY-AUTH group radius local"],["term","end"],
    ["pc","ad2","ssh -l netops 10.20.99.1"],["pc","ad2","Abj-Netops!26"],["pc","ad2","exit"],
    ["term","configure terminal"],["term","aaa authentication login CON-AUTH local"],["term","line console 0"],["term","login authentication CON-AUTH"],["term","end"],["term","exit"],["term","netops"],["term","Abj-Netops!26"],
    ["term","enable"],["term","Abj-En4ble!26"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: no default list, so a plain Enter gives you <code>ABJ-BR1&gt;</code>. Task 4: the ping says <code>Destination host unreachable</code> from ADMIN-PC's own address — nothing at .30 even answers ARP, so RADIUS gets no reply and IOS moves to <code>local</code>. Task 5: right password, still <code>Permission denied</code> — the only method is silent. Task 7: after <code>exit</code> the console now asks <code>Username:</code> (a real router shows it once you press Enter).`)}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Catalyst in Kano has aaa authentication login VTY-AUTH group tacacs+ local on its VTY lines. netops exists only on the switch; amaka.o exists only in the TACACS+ server's directory. Match each situation with what happens.", pairs:[["Server powered off; netops types the right password","Logged in — the server was silent, so local was tried"],["Server up; netops types the right password","Login fails — the server answered Reject, so local is never tried"],["Server up; amaka.o types her right password","Logged in — the server answered Accept"],["Server powered off; amaka.o types her right password","Login fails — the server is silent and the local list doesn't know her"]], why:"1. What is asked? The result of four logins under one method list. 2. Which rule? IOS moves to the next method only when the current one can't answer; an Accept or a Reject is final. 3. Apply it: with the server off, every login falls through to local — netops is there, amaka.o isn't. With the server up, the server alone decides: it knows amaka.o and doesn't know netops. That second line is the one people get wrong in interviews and outages."})}
${K.exam(`Reading an AAA question: before the options, write down <b>1.</b> which list the line uses (its <code>login authentication</code> name, or <code>default</code> — which covers the console), <b>2.</b> the methods in order, <b>3.</b> whether the server <b>answered</b> or <b>didn't</b>. Then it's mechanical. Traps: &ldquo;falls back to local because the password was wrong&rdquo;, &ldquo;RADIUS uses TCP&rdquo;, &ldquo;TACACS+ encrypts only the password&rdquo;.`)}
${K.job("“My directory login stopped working on the Lagos routers — the netops one still does”",`
<p><b>The ticket.</b> Tuesday 09:10, Chidi (network team): &ldquo;Since the weekend server migration my own account fails on every Lagos router; the emergency netops account works. Is my account broken?&rdquo;</p>
<p><b>Questions first.</b> Only Lagos? Yes. What changed? NPS moved subnet on Saturday. Directory account fails + local works is a fingerprint: local only gets a turn when RADIUS is <b>silent</b>.</p>
<p><b>Checks</b> on LAG-R2's console (CON-AUTH local):</p>
${K.out(`LAG-R2#show running-config | section radius
aaa authentication login VTY-AUTH group radius local
radius server NPS-LAG1
 address ipv4 10.10.99.30 auth-port 1812 acct-port 1813
 key Ex4mple-Rad-K3y
LAG-R2#ping 10.10.99.30
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.10.99.30, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)
LAG-R2#ping 10.10.98.30
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.10.98.30, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/3 ms`, "As the lab prints it. The router still asks the old address, where nothing answers; the new server (10.10.98.30, from the change record) replies — the first dot is the ARP wait.")}
<p>Every RADIUS request goes unanswered, so IOS falls through to <code>local</code>, which knows netops but not Chidi. His account is fine. (Real IOS also has <code>show aaa servers</code>: each server's state and its counts of requests and timeouts — the lab doesn't.)</p>
<p><b>Fix</b> (approved by the team lead): on each Lagos router, <code>radius server NPS-LAG1</code> → <code>address ipv4 10.10.98.30 auth-port 1812 acct-port 1813</code>; the server team confirms each router is a RADIUS client on the new NPS with the same key. Chidi logs in from a <b>new</b> SSH session.</p>
<p><b>The twist to tell people:</b> with NPS answering again, <code>netops</code> over SSH is now <b>rejected</b> — correctly. It is for outages and the console.</p>
<p><b>What you say.</b> &ldquo;Your account was fine. Our routers were still asking the old server address, got no answer and fell back to the emergency account. They now point at the new server. The emergency account won't work over SSH while the server is healthy — by design.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Lagos routers' radius server NPS-LAG1 still 10.10.99.30 after NPS move (ping 0/5) → VTY-AUTH fell through to local. Changed to 10.10.98.30 on LAG-R1..R4; server team confirmed clients/keys. Chidi OK 09:42. Team told netops is rejected while NPS is up. RADIUS address added to the migration checklist.&rdquo;</i></p>`)}

<h2>802.1X: logging in before the port opens</h2>
${K.remember(`<b>The rule:</b> with 802.1X a switch port (or Wi-Fi network) carries <b>nothing but login messages</b> until the device proves who it is. The switch doesn't decide — it relays the proof to a <b>RADIUS server</b> and opens the port only on Access-Accept.`)}
<p>Port security (lesson 6) checks MAC addresses, which can be copied (Module 2). ${K.g("802.1X","IEEE 802.1X: port-based network access control. A device must authenticate before a switch port or Wi-Fi network will carry its traffic.")} asks &ldquo;<b>who</b> is this user or machine?&rdquo; and checks a password or certificate. It has three roles:</p>
${K.svg("0 0 760 275",
  K.txt(20,22,"802.1X: the port stays closed until the RADIUS server says yes",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("laptop",90,80,"SUPPLICANT","laptop: 802.1X client")+K.dev("switch",380,80,"AUTHENTICATOR","switch port Gi1/0/5")+K.dev("server",670,80,"AUTH SERVER","RADIUS · e.g. Cisco ISE")+
  K.link(115,82,350,82,"EAP over LAN (EAPoL)")+K.link(410,82,650,82,"EAP inside RADIUS (UDP 1812)")+
  K.txt(40,160,"1  The laptop plugs in. The port is unauthorised: only EAPoL frames pass — no DHCP, no ping, nothing else.",{c:"fg",s:11,f:"body"})+
  K.txt(40,182,"2  The switch asks who it is (an EAP identity request); the laptop answers with a user or machine identity.",{c:"fg",s:11,f:"body"})+
  K.txt(40,204,"3  The switch relays each EAP message to the server inside RADIUS; the server checks a password or certificate.",{c:"fg",s:11,f:"body"})+
  K.txt(40,226,"4  Access-Accept: the switch authorises the port (the reply can also pick a VLAN). Access-Reject: it stays closed.",{c:"fg",s:11,f:"body"})+
  K.txt(380,260,"The switch never stores the user's password — it only passes EAP along.",{mid:true,s:11,f:"body"}),
  "The three 802.1X roles. On Wi-Fi the access point or wireless controller is the authenticator (Module 9).")}
<p>The <b>supplicant</b> is the software asking to join (built into Windows, macOS, phones); the <b>authenticator</b> is the switch, AP or wireless controller that controls the port; the <b>authentication server</b> is a RADIUS server such as ISE, usually checking the directory. The proof travels as ${K.g("EAP","Extensible Authentication Protocol: a framework that carries many different login methods (passwords, certificates, tokens) without the switch needing to understand them.")}. Between laptop and switch, EAP rides directly in Ethernet frames called ${K.g("EAPoL","EAP over LAN: EAP carried in Ethernet frames (EtherType 0x888E) between the supplicant and the authenticator, before the device has any IP address.")}; between switch and server it rides inside RADIUS. Common methods: <b>EAP-TLS</b> (certificates on device and server — strongest, no passwords) and <b>PEAP</b> (Protected EAP: a password inside a TLS tunnel, after the server proves itself with its certificate).</p>
<p>Devices with no supplicant — printers, cameras — can be let in by ${K.g("MAB","MAC Authentication Bypass: for a device that doesn't speak 802.1X, the switch sends its MAC address to RADIUS as its identity. Weaker — MACs can be copied.")}, ideally into a restricted VLAN. Enterprise Wi-Fi (WPA2/WPA3-Enterprise) is 802.1X on the wireless side — Module 9.</p>
${K.out(`aaa new-model
radius server ISE-ABJ1
 address ipv4 10.20.99.40 auth-port 1812 acct-port 1813
 key Ex4mple-Dot1x-K3y
aaa authentication dot1x default group radius
dot1x system-auth-control
!
interface GigabitEthernet1/0/5
 switchport mode access
 switchport access vlan 20
 authentication port-control auto
 dot1x pae authenticator`, "Real-IOS reference (classic Catalyst syntax; newer IOS XE also offers access-session commands) — the lab has no 802.1X engine. system-auth-control turns 802.1X on; port-control auto makes this port require it.")}
${K.check({q:"A laptop is plugged into a port with 802.1X enabled but has no 802.1X client running, and no MAB or guest VLAN is configured. What happens?", o:["It gets full access, because the switch only checks devices that offer credentials","It stays unauthorised: only EAPoL frames are accepted, so it gets no DHCP address and reaches nothing","The switch checks its password against its own local user list","The port goes err-disabled immediately"], a:1, why:"Until the authenticator receives Access-Accept for this port, it passes only EAPoL. A device that never answers stays shut out (unless MAB or a guest VLAN is configured). The switch never checks passwords itself, and an unanswered 802.1X login doesn't err-disable the port — that's port security and BPDU guard."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A hotel's staff Wi-Fi uses WPA2-Enterprise: phones connect through access points managed by a wireless LAN controller, which checks logins with a RADIUS server in head office. Match each part with its 802.1X role or job.", pairs:[["The Wi-Fi login software on a housekeeping manager's phone","Supplicant"],["The wireless LAN controller the access points report to","Authenticator"],["The RADIUS server in head office","Authentication server"],["The messages between the phone and the controller","EAP carried over the wireless link (EAPoL)"],["The messages between the controller and head office","EAP carried inside RADIUS"]], why:"1. What is asked? The 802.1X roles on Wi-Fi instead of a switch. 2. Which rule? The supplicant asks, the authenticator controls access and relays, the server decides; EAP runs directly to the authenticator and inside RADIUS beyond it. 3. Apply it: phone = supplicant; the controller (for its APs) = authenticator; RADIUS server decides. Same roles, different medium."})}

<h2>IPsec VPNs: crossing the internet safely</h2>
${K.remember(`<b>The rule:</b> a VPN wraps packets so a shared network (the internet) behaves like a private link. IPsec gives each packet four protections: <b>confidentiality</b> (encrypted), <b>integrity</b> (any change is detected), <b>authentication</b> (it really came from the other end) and <b>anti-replay</b> (a copied old packet is rejected).`)}
<p>Module 1 met the VPN as the cheap WAN option. In lesson 1's terms: an eavesdropper threatens <b>confidentiality</b>; a man-in-the-middle altering a payment instruction threatens <b>integrity</b>; a fake &ldquo;head office&rdquo; threatens <b>authentication</b>; re-sending yesterday's captured &ldquo;transfer ₦500,000&rdquo; packet is a <b>replay</b>. IPsec (Module 1) counters all four — anti-replay by numbering every packet and refusing numbers already seen.</p>
${K.svg("0 0 760 330",
  K.txt(20,18,"Site-to-site: the routers build the tunnel — PCs and servers send ordinary packets",{c:"fg",s:12,b:true,f:"body"})+
  `<rect x="200" y="38" width="360" height="18" rx="9" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+K.txt(380,51,"IPsec tunnel (ESP) · always on",{mid:true,c:"accent",s:10.5,f:"body"})+
  K.dev("pc",60,88,"LAG-PC","10.1.1.20")+K.dev("router",200,88,"LAG-R1","203.0.113.1")+K.dev("cloud",380,88,"INTERNET","")+K.dev("router",560,88,"ABJ-R1","198.51.100.2")+K.dev("server",700,88,"ABJ-SRV","10.2.2.50")+
  K.link(80,90,174,90)+K.link(226,90,354,90)+K.link(406,90,534,90)+K.link(586,90,682,90)+
  K.txt(20,172,"Remote access: software on each laptop builds its own tunnel to a VPN headend",{c:"fg",s:12,b:true,f:"body"})+
  `<rect x="80" y="190" width="440" height="18" rx="9" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+K.txt(300,203,"TLS (TCP 443) or IPsec IKEv2 tunnel · per user, on demand",{mid:true,c:"accent",s:10.5,f:"body"})+
  K.dev("laptop",80,240,"HOME LAPTOP","VPN client app")+K.dev("cloud",300,240,"INTERNET","home broadband · 4G")+K.dev("firewall",520,240,"VPN HEADEND","203.0.113.10")+K.dev("server",690,240,"INTRANET","10.1.5.20")+
  K.link(102,242,276,242)+K.link(326,242,498,242)+K.link(542,242,675,242)+
  K.txt(380,318,"Both protect traffic only between the tunnel's two ends — beyond the headend it is ordinary LAN traffic.",{mid:true,s:11,f:"body"}),
  "Site-to-site joins networks, permanently, between gateways. Remote access joins one user's device, when they connect.")}
<p><b>Site-to-site</b>: two gateways keep a tunnel up between two networks, and hosts know nothing about it — LAG-R1 sees traffic for the Abuja subnet, encrypts it and sends it to 198.51.100.2. <b>Remote access</b>: a client on each laptop builds a tunnel when the user connects (next section).</p>
<h3>IKE: agreeing algorithms and keys before any data moves</h3>
<p>First the routers prove who they are and agree algorithms and keys — without sending the keys. That is ${K.g("IKE","Internet Key Exchange (UDP 500): how IPsec peers authenticate each other and agree algorithms and keys. IKEv1 uses two phases; IKEv2 (RFC 7296) fewer messages.")}'s job, on <b>UDP 500</b>; its agreements are ${K.g("SAs","Security associations: one-way agreements between IPsec peers on algorithms, keys and lifetime. Each direction has its own.")}.</p>
${K.steps([
  ["Phase 1 — a protected channel for the routers", `They authenticate each other with a ${K.g("pre-shared key","A secret configured on both VPN peers in advance; each proves it knows it without sending it. Simple, but every peer must be given the key securely.")} or certificates, and run ${K.g("Diffie–Hellman","A key-agreement method: two parties exchange public values and each calculates the same secret key; someone who sees every message cannot calculate it.")} to create shared keys. Result: the IKE SA.`],
  ["Phase 2 — IPsec SAs for user traffic", `Inside that channel: what to protect (10.1.0.0/16 ↔ 10.2.0.0/16), with ${K.g("ESP","Encapsulating Security Payload (IP protocol 50): the IPsec protocol that encrypts and integrity-checks each packet. Compared with AH below.")}, AES and SHA-based integrity (the families Module 7's SNMPv3 used). One SA per direction.`],
  ["Data", "Packets are encrypted and checked with ESP; keys are replaced when their lifetime ends."],
])}
<p><b>IKEv2</b> (RFC 7296) does the same in fewer messages and calls phase 2 SAs <i>child SAs</i>; &ldquo;phase 1/phase 2&rdquo; is IKEv1 language.</p>
${K.dyk(`Diffie–Hellman lets two routers agree a secret key while an eavesdropper watches every message. But it can't tell you <i>who</i> you agreed it with — which is why phase 1 also authenticates the peer with a pre-shared key or certificate.`)}
<h3>ESP and AH</h3>
<div class="tablewrap"><table>
<tr><th></th><th>ESP — Encapsulating Security Payload</th><th>${K.g("AH","Authentication Header (IP protocol 51): IPsec's integrity-only protocol — no encryption.")} — Authentication Header</th></tr>
<tr><td><b>IP protocol</b></td><td><b>50</b> (a protocol number, like TCP's 6 — not a port)</td><td><b>51</b></td></tr>
<tr><td><b>Encryption</b></td><td>Yes</td><td><b>No</b></td></tr>
<tr><td><b>Integrity, authentication, anti-replay</b></td><td>Yes</td><td>Yes — its check also covers the outer IP header</td></tr>
<tr><td><b>Through NAT</b></td><td>Works (with NAT-T)</td><td><b>Breaks</b>: NAT changes the header AH protects</td></tr>
</table></div>
${K.remember(`<b>ESP</b> = <b>E</b>ncrypts (and checks) — almost every VPN. <b>AH</b> = <b>A</b>uthenticates only. Numbers: <b>50</b> ESP, <b>51</b> AH.`)}
<h3>Tunnel mode and transport mode</h3>
${K.svg("0 0 760 300",
  K.txt(20,20,"What ESP does to a packet: tunnel mode vs transport mode",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(20,52,"Original packet",{c:"fg",s:11,b:true,f:"body"})+
  K.band(130,60,210,30,"IP 10.1.1.20 → 10.2.2.50")+K.band(340,60,60,30,"TCP")+K.band(400,60,120,30,"data")+
  K.txt(20,118,"Tunnel mode (site-to-site gateways)",{c:"fg",s:11,b:true,f:"body"})+
  K.band(130,126,100,30,"new IP hdr","var(--panel2)")+K.band(230,126,80,30,"ESP hdr","var(--panel2)")+K.band(310,126,100,30,"orig IP hdr")+K.band(410,126,60,30,"TCP")+K.band(470,126,110,30,"data")+K.band(580,126,100,30,"ESP trailer")+K.band(680,126,60,30,"ICV","var(--panel2)")+
  `<rect x="306" y="122" width="378" height="38" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`+
  K.txt(495,176,"encrypted",{mid:true,c:"accent",s:10.5,f:"body"})+K.txt(180,176,"203.0.113.1 → 198.51.100.2",{mid:true,s:10.5})+
  K.txt(20,214,"Transport mode (host-to-host, or inside GRE)",{c:"fg",s:11,b:true,f:"body"})+
  K.band(130,222,100,30,"orig IP hdr","var(--panel2)")+K.band(230,222,80,30,"ESP hdr","var(--panel2)")+K.band(310,222,60,30,"TCP")+K.band(370,222,110,30,"data")+K.band(480,222,100,30,"ESP trailer")+K.band(580,222,60,30,"ICV","var(--panel2)")+
  `<rect x="306" y="218" width="278" height="38" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`+
  K.txt(445,272,"encrypted",{mid:true,c:"accent",s:10.5,f:"body"})+
  K.txt(380,294,"Tunnel mode wraps the whole packet in a new header between the gateways; transport mode keeps the original header.",{mid:true,c:"fg",s:11,f:"body"}),
  "The ICV (integrity check value) at the end lets the receiver detect any change from the ESP header to the trailer.")}
<p><b>Tunnel mode</b> (the site-to-site default) hides the whole original packet behind a new header: the internet sees only 203.0.113.1 talking ESP to 198.51.100.2. <b>Transport mode</b> keeps the original header — for host-to-host tunnels, or when ${K.g("GRE","Generic Routing Encapsulation (IP protocol 47): wraps any packet, multicast included, in a new IP header, giving a virtual point-to-point Tunnel interface. No encryption.")} (below) already supplies the outer header.</p>
<h3>NAT-T and GRE over IPsec</h3>
<p>ESP has no ports, so PAT (Module 7) can't track it. With ${K.g("NAT-T","NAT Traversal: IPsec peers detect a NAT device during IKE and then wrap ESP in UDP port 4500, which NAT/PAT can translate like any UDP flow.")} the peers detect NAT during IKE and move IKE and ESP into <b>UDP 4500</b>. A VPN gateway's firewall therefore allows <b>UDP 500</b>, <b>UDP 4500</b> and (no NAT) <b>IP protocol 50</b>.</p>
<p>A classic IPsec tunnel carries only the unicast traffic its policy matches — OSPF's multicast hellos (224.0.0.5, Module 5) don't cross it. GRE carries anything, multicast included, but encrypts nothing. <b>GRE over IPsec</b>: GRE carries the routing protocol, IPsec encrypts the GRE packets (usually transport mode). A ${K.g("VTI","Virtual Tunnel Interface: an IPsec tunnel presented as a routable tunnel interface (tunnel mode ipsec ipv4), which can carry routing protocols without GRE.")} does the same without GRE.</p>
<h3>Reading a site-to-site config</h3>
${K.out(`crypto isakmp policy 10
 encryption aes 256
 hash sha256
 authentication pre-share
 group 14
crypto isakmp key Ex4mple-PSK-2026 address 198.51.100.2
!
crypto ipsec transform-set TS-AES256 esp-aes 256 esp-sha256-hmac
 mode tunnel
!
ip access-list extended VPN-TRAFFIC
 permit ip 10.1.0.0 0.0.255.255 10.2.0.0 0.0.255.255
!
crypto map VPN-MAP 10 ipsec-isakmp
 set peer 198.51.100.2
 set transform-set TS-AES256
 match address VPN-TRAFFIC
!
interface GigabitEthernet0/0/0
 ip address 203.0.113.1 255.255.255.0
 crypto map VPN-MAP`, "Real-IOS reference (IKEv1), not runnable in the lab. Phase 1: isakmp policy + key. Phase 2: transform set. The ACL (lesson 5) picks the traffic.")}
${K.out(`LAG-R1#show crypto isakmp sa
IPv4 Crypto ISAKMP SA
dst             src             state          conn-id status
198.51.100.2    203.0.113.1     QM_IDLE           1001 ACTIVE

LAG-R1#show crypto ipsec sa
interface: GigabitEthernet0/0/0
    Crypto map tag: VPN-MAP, local addr 203.0.113.1
   local  ident (addr/mask/prot/port): (10.1.0.0/255.255.0.0/0/0)
   remote ident (addr/mask/prot/port): (10.2.0.0/255.255.0.0/0/0)
   current_peer 198.51.100.2 port 500
    #pkts encaps: 1250, #pkts encrypt: 1250, #pkts digest: 1250
    #pkts decaps: 1236, #pkts decrypt: 1236, #pkts verify: 1236
   ...`, "Real-IOS reference, trimmed. QM_IDLE = the phase 1 SA is up. The ident lines are the ACL's traffic; port 500 means no NAT (behind NAT it reads 4500). Encaps and decaps both rising = traffic flows both ways; decaps stuck at 0 points at the far end or the return path.")}
${K.check({q:"A branch router sits behind the ISP's PAT router. IKE starts on UDP 500 and the peers detect the NAT. How does user traffic travel from then on?", o:["As ESP, IP protocol 50, exactly as without NAT","Inside UDP port 4500 (NAT-T), which PAT can translate","Inside TCP port 49","As AH, because AH is designed for NAT"], a:1, why:"ESP has no ports for PAT to track, so NAT-T wraps it in UDP 4500. AH can't survive NAT at all. TCP 49 is TACACS+."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Kano branch firewall sits behind a mobile operator's PAT. Its IPsec tunnel to head office will use IKEv2 with NAT-T, and head office's internet firewall drops everything inbound. Which two inbound flows from the branch must head office allow? (Choose two.)", o:["UDP 500","UDP 4500","TCP 49","UDP 1812","IP protocol 51","TCP 443"], a:[0,1], why:"1. What is asked? The flows a NAT-T IPsec tunnel needs. 2. Which rule? IKE starts on UDP 500; once NAT is detected, IKE and ESP move to UDP 4500. 3. Apply it: UDP 500 and 4500. Protocol 50 is needed only without NAT; 51 is AH, which can't cross NAT; TCP 49 is TACACS+, UDP 1812 RADIUS, TCP 443 a TLS VPN."})}
${K.case("Port Harcourt: the tunnel was up, but the routes never came",`
<p>An oil-services firm linked its Port Harcourt yard to head office with a crypto-map tunnel like the reference. <code>show crypto isakmp sa</code> said QM_IDLE and pings between the server subnets worked — but OSPF, meant to learn new subnets automatically, never formed a neighbour.</p>
<p><b>Why.</b> The tunnel carried only unicast traffic matching its ACL; hellos to 224.0.0.5 matched nothing, and every new subnet needed hand-edited ACL lines on both ends.</p>
<p><b>The fix.</b> GRE between the two public addresses, OSPF on the <code>Tunnel0</code> interfaces, IPsec protecting the GRE traffic. OSPF formed and new subnets appeared by themselves. <b>Lesson:</b> &ldquo;tunnel up&rdquo; proves IKE and IPsec, not routing.</p>`)}

<h2>Remote-access VPNs and TLS VPNs</h2>
${K.remember(`<b>The rule:</b> remote access joins <b>one user's device</b> on demand. A client builds the tunnel to a headend with <b>IPsec (IKEv2)</b> or <b>TLS</b>; TLS uses <b>TCP 443</b>, the HTTPS port, so it gets through almost any hotel or café network.`)}
<p>The client authenticates the <b>user</b> — normally RADIUS to the directory plus MFA (lesson 2) — and the headend assigns an inside address, routes and DNS. All three A's apply: who gets in, which subnets their group reaches, when they were connected. Examples: Cisco Secure Client (formerly AnyConnect) to a Cisco firewall; Windows' built-in IKEv2 client.</p>
<ul>
<li><b>TLS VPN client</b> — a full tunnel for every application. As in Module 1's SSL VPN case, clients try ${K.g("DTLS","Datagram TLS: TLS over UDP, so a lost packet doesn't hold up the rest — better for voice and video.")} on UDP 443 first, then TLS over TCP 443. (&ldquo;SSL VPN&rdquo; usually means a TLS VPN.)</li>
<li><b>Clientless TLS VPN</b> — a browser portal to a few web apps. <b>IPsec remote access</b> — IKEv2 on UDP 500/4500, which some guest networks block.</li>
</ul>
<p>Every design also chooses ${K.g("split tunnelling","Sending only company-bound traffic (the company's subnets) through the VPN and everything else straight to the internet. Full tunnelling sends everything through the company.")} (less headend load) or full tunnelling (everything inspected) — set by the headend's policy, not the user.</p>
${K.when([
  ["Site-to-site IPsec", "Joining offices, or an office to a cloud network, permanently", "Gateways do it all; hosts need nothing", "Individual travelling users"],
  ["TLS VPN client (or IKEv2 client)", "Staff working from home, hotels, 4G", "TCP/UDP 443 passes almost every firewall (IKEv2 needs UDP 500/4500)", "You can't install or manage the client on the device"],
  ["Clientless TLS portal", "Contractors or personal devices needing one or two web apps", "Nothing to install; access limited to what is published", "Users need file shares or full network access"],
], "Which kind of VPN?")}
${K.mistake(`Treating &ldquo;VPN connected&rdquo; as &ldquo;secure&rdquo;. A VPN protects traffic between the tunnel's ends only — it doesn't clean a malware-infected laptop. Users still need MFA, patched devices and limited authorization.`)}
${K.check({q:"A sales manager's hotel network blocks all UDP and every TCP port except 80 and 443. Which VPN is most likely to connect?", o:["Site-to-site IPsec","Remote-access IPsec with IKEv2 on UDP 500/4500","A TLS VPN client, falling back to TLS over TCP 443","GRE over IPsec"], a:2, why:"IKE needs UDP 500/4500, which the hotel blocks. A TLS VPN runs over TCP 443 like any HTTPS site (without DTLS, calls may be less smooth). Site-to-site and GRE are gateway-to-gateway designs."})}
<h3>Same logic, new situation</h3>
<p>A Lagos fintech needs one VPN for call-centre agents (company laptops, home broadband) and another for an external audit firm (their own laptops, two weeks' access to one web-based audit system). Which kind fits each, and which AAA rules would you add?</p>
${K.hint(`For each group: managed device or not? Full network or one web app? Then authentication, authorization, accounting.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> VPN type and AAA policy for two groups. <b>2. Which rule?</b> A client gives full access and needs a managed device; a clientless portal reaches only published web apps. <b>3. Apply it:</b> agents: a TLS VPN client, directory login + MFA, authorised only into call-centre subnets, accounting on. Auditors: the clientless portal with only the audit system, MFA, accounts expiring in two weeks, accounting on.</p>`)}
${K.myth([
  ["RADIUS encrypts the whole login.","It hides only the password; usernames and attributes are readable. TACACS+ encrypts the whole body."],
  ["If the AAA server rejects my password, the router tries the local account next.","Only when the server doesn't answer. A Reject is final."],
  ["TACACS+ is the newer version of TACACS.","It's a separate Cisco protocol, incompatible with the obsolete TACACS and Extended TACACS."],
  ["AH is the more secure choice because it authenticates more.","AH doesn't encrypt and breaks through NAT. Nearly every VPN uses ESP."],
  ["With 802.1X, the switch checks each user's password.","It only relays EAP to the RADIUS server and opens the port on Access-Accept."],
])}
${K.dodont([
  "Create and test a strong local break-glass account before aaa new-model.",
  "End every server method list with local; give the console its own local list.",
  "Test new logins from a fresh session while your current one stays open.",
  "Use TACACS+ for device administration, RADIUS for network access.",
  "Use GRE over IPsec or a VTI when a routing protocol must cross the VPN.",
],[
  "Don't write group radius or group tacacs+ with nothing after it.",
  "Don't use none on VTY lines, or the break-glass account for daily work.",
  "Don't choose AH when NAT is anywhere in the path.",
  "Don't read &ldquo;tunnel up&rdquo; as &ldquo;routing works&rdquo; — check routes and encaps/decaps.",
])}

<h2>Interview corner</h2>
${K.hint(`Transport and ports, what's encrypted, how the A's are handled, typical use — then your choice, with the fallback.`)}
${K.reveal("“What's the difference between RADIUS and TACACS+, and which would you use for router logins?”",`<p>"RADIUS is the open standard on UDP 1812/1813; it hides only the password and returns authentication and authorization together — ideal for network access: 802.1X, Wi-Fi, VPN. TACACS+ is Cisco's, on TCP 49; it encrypts the whole body and keeps the three A's separate, so every command can be authorised and logged. For router logins I'd use TACACS+ with per-command accounting and a local break-glass account last in the list; with only NPS available, RADIUS works too, minus per-command control."</p>`)}
${K.hint(`Method list order; an error versus a reject; what that means for the local account.`)}
${K.reveal("“You've set aaa authentication login default group tacacs+ local. When does the local account actually work?”",`<p>"Only when TACACS+ can't answer — servers down, unreachable or not configured. IOS moves on after an error, not a rejection: if the server rejects or doesn't know the user, the login fails. So local is for outages. A default list also covers the console, so I'd give the console its own local list, and test from a fresh session before closing mine."</p>`)}
${K.hint(`IKE on UDP 500, phase 1 then phase 2, ESP in tunnel mode, NAT-T — and what you'd check.`)}
${K.reveal("“Explain how a site-to-site IPsec VPN comes up.”",`<p>"Matching traffic triggers IKE on UDP 500. Phase 1: the routers authenticate each other (pre-shared key or certificates) and use Diffie–Hellman to build the IKE SA. Phase 2: they agree the IPsec SAs — ESP, AES, SHA, one per direction. ESP then encrypts each packet in tunnel mode behind a new header, with anti-replay numbers; behind NAT it moves to UDP 4500. I'd check show crypto isakmp sa for QM_IDLE and encaps/decaps in show crypto ipsec sa. For OSPF across it: GRE over IPsec or a VTI."</p>`)}

${K.recap([
  "Authentication = who are you; authorization = what may you do; accounting = what did you do, when. Server-based AAA: one account per person, one place to disable it; keep a local break-glass account.",
  "RADIUS: UDP 1812/1813 (legacy 1645/1646), hides only the password, authN + authZ together, network access. TACACS+: TCP 49, whole body encrypted, three A's separate, device administration.",
  "aaa new-model first; with no default list, VTY lines use local users and the console asks for nothing.",
  "aaa authentication login default|NAME methods…; lines use login authentication NAME, else default (console included).",
  "The next method is tried only when the current one can't answer; Accept and Reject are final. End server lists with local.",
  "802.1X: supplicant, authenticator, authentication server (RADIUS); EAPoL to the switch, EAP inside RADIUS beyond.",
  "IPsec: confidentiality, integrity, authentication, anti-replay. IKE UDP 500 (phase 1, phase 2); ESP 50 encrypts, AH 51 doesn't and breaks with NAT; NAT-T UDP 4500.",
  "Tunnel mode wraps the whole packet; transport keeps the header. GRE over IPsec carries routing protocols. Remote access: IKEv2 or TLS (TCP 443), client or clientless.",
])}
${K.next(`<b>Lesson 4 — ACLs part 1.</b> From who may log in to which packets may pass: how an access list decides (top down, first match, implicit deny), wildcard masks, standard lists, direction and placement — and <code>access-class</code>, which limits where SSH logins may even come from.`)}
`,
quiz:[
  {lvl:1, q:"The AAA server's report shows that a user ran reload on a core switch at 02:14. Which part of AAA produced that record?", o:["Authentication","Authorization","Accounting","Encryption"], a:2, why:"Accounting records what was done and when — session times and, with TACACS+, each command. Authentication proved who the user was; authorization decided whether reload was allowed."},
  {lvl:1, q:"Which ports does a modern RADIUS deployment use?", o:["UDP 1812 for authentication and UDP 1813 for accounting","TCP 49 for everything","UDP 500 and UDP 4500","TCP 1812 and TCP 1813"], a:0, why:"RADIUS runs over UDP: 1812 for authentication (authorization comes back in the same reply) and 1813 for accounting; 1645/1646 are the legacy equivalents. TCP 49 is TACACS+; UDP 500/4500 are IKE and NAT-T."},
  {lvl:1, q:"Which IP protocol number identifies ESP, the IPsec protocol that encrypts traffic?", o:["47","50","51","500"], a:1, why:"ESP is IP protocol 50 and AH is 51 — protocol numbers in the IP header, not ports. 47 is GRE; 500 is IKE's UDP port."},
  {lvl:2, type:"multi", q:"Which three statements about TACACS+ are true? (Choose three.)", o:["It uses TCP port 49","It encrypts the entire body of each message","It keeps authentication, authorization and accounting separate, so commands can be authorised one by one","It uses UDP 1812 and 1813","It hides only the password field","It is the protocol 802.1X uses between switch and server"], a:[0,1,2], why:"TACACS+ runs on TCP 49, encrypts the whole body (the header stays readable) and separates the three A's, which allows per-command authorization and accounting. UDP 1812/1813 and password-only hiding describe RADIUS, which is also what 802.1X uses to reach the authentication server."},
  {lvl:2, type:"match", q:"Match each method in an aaa authentication login list with what it checks.", pairs:[["group tacacs+","The configured TACACS+ servers"],["group radius","The configured RADIUS servers"],["local","The device's own username and secret list"],["enable","The enable secret, used as the login password"],["none","Nothing — the login always succeeds"]], why:"Server groups ask the servers; local checks username … secret on the device; enable uses the enable secret (shared by everyone, so avoid it); none performs no check and must never be used on VTY lines."},
  {lvl:2, type:"fill", q:"On a router where every aaa authentication command is rejected with Invalid input, which global configuration command must be entered first?", fields:[{label:"Command", a:["aaa new-model"], ios:true}], why:"aaa new-model turns AAA on; until then the aaa authentication commands don't exist. Once it is on, VTY lines check the local user list until a default list is written, and the console asks for nothing."},
  {lvl:2, type:"fill", q:"You have created aaa authentication login VTY-AUTH group radius local. Under line vty 0 4, which command makes those lines use it?", fields:[{label:"Line command", a:["login authentication VTY-AUTH"], ios:true}], why:"A named list does nothing until a line names it with login authentication NAME. Lines that don't name a list use the list called default."},
  {lvl:3, q:"ISE-1 is up and reachable. A contractor engineer tries to SSH in as netops, an account that exists only on the router, with the right password. ISE's live log shows the request rejected (user not found). What happens, and why?", ex:"aaa new-model\naaa authentication login VTY-AUTH group tacacs+ local\n!\nusername netops secret 9 $9$...\n!\ntacacs server ISE-1\n address ipv4 10.10.99.20\n key 7 ...\n!\nline vty 0 4\n login authentication VTY-AUTH\n transport input ssh", o:["The login succeeds, because local is the fallback when TACACS+ rejects a user","The login fails: ISE answered with a reject, and IOS moves to the next method only when a server can't answer","The login succeeds, because local users always take priority over servers","The login fails because TACACS+ cannot be used with SSH"], a:1, why:"IOS walks a method list only on an error (no answer). ISE answered — a reject, even for an unknown user, is final — so local is never checked. To use netops while ISE is up, add it to ISE or use the console with a local list; over SSH it is a break-glass account for ISE outages."},
  {lvl:3, q:"RAD1 has been offline since a power failure. Based on the exhibit, what can the engineers do?", ex:"aaa new-model\naaa authentication login default group radius\n!\nradius server RAD1\n address ipv4 10.9.9.30 auth-port 1812 acct-port 1813\n key 7 ...\n!\nline con 0\nline vty 0 4\n transport input ssh", o:["Log in by SSH with their local usernames, because IOS always falls back to local","Log in on the console only, because the console never uses AAA","Nothing: neither SSH nor the console can log in until RAD1 answers, because the default list covers every line and has no method after group radius","Log in by SSH with no password, because a silent server means none"], a:2, why:"No line names a list, so every line — the console included — uses default. Its only method can't answer, and with no method left the login fails. The fix for next time: end the list with local and give the console its own local list. Now they need RAD1 back (or a password-recovery procedure on site)."},
  {lvl:2, type:"order", q:"Put the steps of an IKEv1 site-to-site IPsec tunnel coming up in order.", items:["Traffic matching the VPN policy arrives at the router","Phase 1: the peers authenticate each other (pre-shared key or certificate) and use Diffie–Hellman to build the IKE SA","Phase 2: inside the IKE SA they agree the IPsec SAs — ESP, algorithms, which traffic — one per direction","User packets are encrypted and integrity-checked with ESP","Keys are renegotiated when the SA lifetime ends"], why:"Interesting traffic triggers IKE (UDP 500). Phase 1 builds the protected management channel; phase 2 builds the SAs that protect data; ESP then carries the traffic; lifetimes force fresh keys. IKEv2 calls the phase 2 SAs child SAs and needs fewer messages."},
  {lvl:2, q:"Why can't AH protect traffic that passes through a NAT router?", o:["AH has no encryption algorithm","AH's integrity check covers the outer IP header, and NAT changes that header's addresses, so every packet fails the check","AH uses TCP, which NAT blocks","AH needs UDP 4500, which NAT doesn't support"], a:1, why:"AH authenticates the packet including the unchanging fields of the IP header. NAT rewrites the source address, so the receiver's check fails. ESP doesn't protect the outer header and, with NAT-T in UDP 4500, crosses NAT."},
  {lvl:3, q:"A new branch's IPsec tunnel to head office forms (show crypto isakmp sa shows QM_IDLE) when the branch router is plugged straight into a test line, but in production, behind the mobile operator's PAT, phase 1 completes and no user traffic arrives at head office. Head office's firewall allows UDP 500 and IP protocol 50 from the branch. What is the most likely fix?", o:["Allow TCP 49 on the head-office firewall","Allow UDP 4500 on the head-office firewall, because behind NAT the peers switch to NAT-T","Change ESP to AH so the traffic survives NAT","Change the transform set to transport mode"], a:1, why:"Without NAT, IKE on UDP 500 and ESP (protocol 50) is enough — which is why the test line worked. Behind PAT the peers detect NAT and move to UDP 4500, which the firewall drops. AH would make it worse; transport mode doesn't help gateway-to-gateway; TCP 49 is TACACS+."},
  {lvl:2, q:"Two routers protect traffic between 10.1.0.0/16 and 10.2.0.0/16 across the internet. Which IPsec mode is normally used, and why?", o:["Transport mode, because it adds less overhead","Tunnel mode, because it encrypts the whole original packet and adds a new header between the gateways' public addresses","Tunnel mode, because only tunnel mode provides integrity","Transport mode, because private addresses can't be routed"], a:1, why:"Site-to-site gateways use tunnel mode: the original packet, private addresses included, is encrypted inside a new header between the two routers' public addresses. Transport mode keeps the original header, so it suits host-to-host or GRE over IPsec. Both modes provide integrity."},
  {lvl:3, q:"A branch reaches head office over an MPLS link, with a crypto-map IPsec tunnel across the internet as the backup. OSPF neighbours form over MPLS but never across the tunnel. When the MPLS link failed last week, the branch lost every head-office route, although show crypto isakmp sa still showed QM_IDLE. What design change gives OSPF a working backup path?", o:["Replace ESP with AH so the hellos are authenticated","Run OSPF over a GRE tunnel interface protected by IPsec (or an IPsec VTI), so the backup path carries multicast hellos and is a routed interface","Move the tunnel to UDP 4500","Add a static default route on the branch pointing at the MPLS link"], a:1, why:"A crypto map protects only unicast traffic matching its ACL; OSPF's hellos to 224.0.0.5 never cross it, so there is no neighbour and no backup routes — 'tunnel up' says nothing about routing. GRE (or a VTI) gives a tunnel interface that carries multicast; OSPF forms over it and, when MPLS fails, moves the routes onto the tunnel. AH and NAT-T don't change what the crypto map carries; a static route towards the failed MPLS link goes nowhere."},
  {lvl:2, type:"match", q:"Match each part of an 802.1X login with its role or job.", pairs:[["The 802.1X client software on a laptop","Supplicant"],["The access switch port the laptop plugs into","Authenticator"],["The RADIUS server that checks the user's certificate","Authentication server"],["The framework that carries the login method between them","EAP"]], why:"The supplicant asks to join, the authenticator controls the port and relays, the authentication server (RADIUS) decides. EAP carries the actual method (EAP-TLS, PEAP) — as EAPoL frames to the switch, and inside RADIUS from the switch to the server."},
  {lvl:2, q:"Field engineers' TLS VPN client connects from a customer's guest Wi-Fi, but softphone calls through it are choppy; from home the same calls are clear. The guest network allows only TCP 80 and 443. What is the most likely explanation?", o:["UDP is blocked, so the client can't use DTLS on UDP 443 and runs over TLS on TCP 443, where one lost packet holds up the ones behind it","A TLS VPN can't carry voice, so the calls bypass the tunnel","The guest network's NAT breaks ESP","The headend is rejecting the engineers' RADIUS logins"], a:0, why:"The client connected, so login and NAT aren't the problem — and a TLS VPN carries no ESP. With UDP blocked, DTLS fails and the tunnel falls back to TLS over TCP 443: it works, but TCP delivers in order, so a lost packet delays everything behind it, which voice notices. At home UDP 443 is allowed and DTLS is used."},
],
cards:[
  {f:"The three A's", b:"Authentication: who are you (prove it). Authorization: what may you do. Accounting: what did you do, and when. In that order."},
  {f:"Local vs server-based AAA", b:"Local: username … secret on each device — no server needed, but every change is repeated everywhere. Server-based: devices ask a RADIUS/TACACS+ server (often backed by the directory) — one account per person, one place to disable, central records. Keep a local break-glass account."},
  {f:"RADIUS", b:"UDP 1812 auth (+ authorization in the same reply), 1813 accounting; legacy 1645/1646 (IOS's default if you don't name ports). Hides only the password. Open standard. Network access: 802.1X, Wi-Fi, VPN."},
  {f:"TACACS+", b:"TCP 49. Encrypts the whole body. Authentication, authorization and accounting separate — per-command authorization and accounting. Cisco-developed (RFC 8907). Device administration."},
  {f:"aaa new-model", b:"Turns AAA on (needed before any aaa authentication command). With no default list: VTY lines use the local user list; the console asks for nothing. IOS also adds aaa session-id common."},
  {f:"Method list syntax", b:"aaa authentication login default|NAME method1 [method2 …]. Methods: group tacacs+, group radius, local, enable, line, none. Apply a named list with login authentication NAME under the line; lines without one use default (console included)."},
  {f:"When IOS uses the next method", b:"Only on an ERROR — the method can't answer (server down, unreachable, none configured). An Accept or a Reject (FAIL) is final. All methods used up with no answer = login fails."},
  {f:"radius server / tacacs server blocks", b:"radius server NAME → address ipv4 IP auth-port 1812 acct-port 1813 → key K. tacacs server NAME → address ipv4 IP → key K. The key must match the server's entry for the device; with service password-encryption it shows as key 7 (reversible)."},
  {f:"802.1X roles", b:"Supplicant (client software on the device), authenticator (switch, AP or wireless controller), authentication server (RADIUS, e.g. ISE). EAP over LAN (EAPoL) to the switch, EAP inside RADIUS beyond. Only EAPoL passes until Access-Accept."},
  {f:"IPsec services", b:"Confidentiality (encryption), integrity (changes detected), authentication (the peer and each packet are genuine), anti-replay (sequence numbers reject copies)."},
  {f:"IKE phases", b:"UDP 500. Phase 1: authenticate peers (pre-shared key or certificates), Diffie–Hellman, build the IKE SA. Phase 2: negotiate the IPsec SAs for data (one per direction). IKEv2: fewer messages; phase 2 SAs are child SAs."},
  {f:"ESP vs AH", b:"ESP, IP protocol 50: encryption + integrity + authentication + anti-replay; works through NAT with NAT-T (UDP 4500). AH, protocol 51: integrity and authentication only, no encryption; breaks through NAT."},
  {f:"Tunnel vs transport mode", b:"Tunnel: the whole original packet encrypted, new outer IP header between the gateways — site-to-site. Transport: original header kept, payload protected — host-to-host or inside GRE."},
  {f:"GRE over IPsec and TLS VPNs", b:"GRE (protocol 47) carries multicast and routing protocols but doesn't encrypt; IPsec encrypts the GRE packets (or use a VTI). TLS VPNs: remote access over TCP 443 (DTLS on UDP 443), with a client or clientless in a browser."},
],
});

// ---------- Module 8 · Lesson 4 ----------
L.push({
id:"sec-acl-std", mins:105, level:"Intermediate · builds on Module 7 lesson 4 and Module 5",
t:"ACLs part 1 — how an access list decides: wildcards, standard lists, direction, placement and VTY access-class",
html:`
${K.goals([
  "Explain what an ACL does as a filter, and how that differs from Module 7's NAT and SNMP &ldquo;who&rdquo; lists.",
  "Predict any packet's fate: top down, first match wins, invisible deny at the end.",
  "Write wildcards for a host, any, a subnet and a block of subnets — and spot a mask typed as a wildcard.",
  "Configure numbered and named standard ACLs, apply them on the right interface in the right direction, and prove it with <code>show access-lists</code> and <code>show ip interface</code>.",
  "Recognise what a blocked user sees and restrict SSH to an admin subnet with <code>access-class</code>.",
])}
${K.pre(["Module 7 lesson 4: the standard access list as NAT's &ldquo;who gets translated&rdquo; list — <code>access-list N permit …</code>, named lists, <code>show access-lists</code>, sequence numbers, the mask-instead-of-wildcard mistake.","Module 5: wildcard masks (OSPF <code>network</code>, lesson 4); ping, traceroute, <code>U.U.U</code> and <code>!H</code>.","Module 2: SSH remote access — <code>line vty</code>, <code>login local</code>, <code>transport input ssh</code>, <code>ssh -l</code>.","Lessons 1–3 of this module: why security is layered, and how device logins are protected."])}

<h2>Why this matters at work</h2>
<p>Monday morning at a fintech in Port Harcourt. The external auditor's report has two findings with your name next to them: &ldquo;Contractor laptops can open the HR portal, which holds salary and bank details&rdquo;, and &ldquo;Any staff PC can reach the SSH login prompt of the branch routers.&rdquo; Nobody broke in — but nothing stops anyone who tries.</p>
<p>Both have the same fix: an <b>access control list</b>, a short ordered list of permit and deny lines a router checks packets against. Get the logic right and a few lines close both holes; get the order, wildcard, interface or direction wrong and you block the whole branch at 09:00 — or nothing, while the ticket says &ldquo;done&rdquo;. This lesson is the logic, the standard list and where it goes; lesson 5 adds extended lists.</p>

<h2>What an ACL is for — and how it decides</h2>
${K.remember(`<b>The rule in one line:</b> an ACL on its own does nothing. It is a list of <b>permit</b> and <b>deny</b> lines, and it acts only where a feature <i>uses</i> it. Applied to an interface with <code>ip access-group</code>, it is a <b>filter</b>: permit = forward the packet, deny = drop it.`)}
<p>You met the ${K.g("ACL","Access control list: an ordered list of permit/deny lines matching packets — by source address in a standard list, and by protocol, source, destination and ports in an extended list (lesson 5).")} in Module 7: NAT used one to decide <i>who gets translated</i>, SNMP <i>whom the agent answers</i>. Same syntax — what changes is the feature reading it, and so what &ldquo;deny&rdquo; means:</p>
<div class="tablewrap"><table>
<tr><th>Where the ACL is used</th><th>Command</th><th>Permit means</th><th>Deny means</th></tr>
<tr><td>NAT (Module 7 lesson 4)</td><td><code>ip nat inside source list 10 …</code></td><td>translate this source</td><td>not translated — the packet still leaves, untranslated</td></tr>
<tr><td>SNMP community (Module 7 lesson 7)</td><td><code>snmp-server community X RO 20</code></td><td>the agent answers this manager</td><td>the agent ignores the request</td></tr>
<tr><td><b>An interface</b> (this lesson)</td><td><code>ip access-group 20 in|out</code></td><td>forward the packet</td><td><b>drop the packet</b> (and usually tell the sender)</td></tr>
<tr><td><b>The VTY lines</b> (this lesson)</td><td><code>access-class 20 in</code></td><td>allow the SSH/Telnet session</td><td>refuse the session</td></tr>
</table></div>
<p>As a filter, the router becomes a ${K.g("packet filter","A device that checks each packet's header against rules and forwards or drops it. A router with an interface ACL is one; a firewall is a more capable one.")}, and a <b>${K.g("stateless","Judging each packet on its own, with no memory of earlier packets. A router ACL doesn't know that a packet is the reply to something a PC asked for; a stateful firewall does.")}</b> one: each packet is judged on its own header, with no memory that it is the reply to a request a second ago. That matters for extended lists in lesson 5.</p>
<ul>
<li><b>Standard</b> lists match the <b>source address only</b> — &ldquo;nothing from the contractors' subnet&rdquo;, but never &ldquo;contractors may browse but not SSH&rdquo;. Numbers 1–99 and 1300–1999, or a name.</li>
<li><b>Extended</b> lists match protocol, source, destination and ports (100–199, 2000–2699, or a name): lesson 5.</li>
</ul>
${K.analogy(`An estate gate in Lekki: the guard reads the clipboard <b>from the top</b> and stops at the <b>first line that fits you</b> — &ldquo;Delivery vans: no&rdquo; stops a van even if line 9 says &ldquo;Block C residents: yes&rdquo;. Fit <b>no line</b> and you don't get in. And the clipboard does nothing until it's handed to the guard at a particular gate, checking people walking in or out.`)}
${K.dyk(`The same logic follows you to the cloud. AWS network ACLs on a VPC subnet are stateless lists checked in rule-number order, the first match wins, and a final <code>*</code> rule denies the rest — an IOS ACL with different syntax.`)}
${K.check({q:"An ACL 30 with the single line access-list 30 deny host 10.9.9.9 exists on a router but is not referenced anywhere. What does it do to traffic from 10.9.9.9?", o:["Drops it on every interface","Drops it only on interfaces facing 10.9.9.9","Nothing — an ACL acts only where a feature such as ip access-group, access-class or NAT uses it","Logs it but forwards it"], a:2, why:"An ACL is a definition. Until an interface, the VTY lines or another feature references it, no packet is compared with it."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"The same access list 20 (permit 10.30.5.0 0.0.0.255) is used by four different features. A packet or request from 10.30.9.14 arrives at each. Match each feature with what happens.", pairs:[["ip nat inside source list 20 interface g0/1 overload","Leaves untranslated, with its private source"],["snmp-server community Mon-ro RO 20","The agent ignores the poll"],["ip access-group 20 in on the LAN interface","The packet is dropped"],["access-class 20 in under line vty 0 4","The SSH session is refused"]], why:"1. What is asked? What 'not permitted' means to each feature. 2. Which rule? 10.30.9.14 matches no line, so the implicit deny applies — and deny means whatever the feature using the list says it means. 3. Apply it: NAT = not translated (still forwarded); SNMP = no answer; interface = dropped; VTY = session refused."})}

<h3>The logic: top down, first match, invisible deny</h3>
${K.remember(`<b>The rule:</b> the router compares the packet with line 1, then line 2, and so on. The <b>first line that matches decides</b> — permit or deny — and the rest are <b>never read</b>. If no line matches, an invisible last line, the <b>implicit deny any</b>, drops it. So every list needs <b>at least one permit</b>, and specific lines must come <b>before</b> general ones.`)}
${K.svg("0 0 760 372",
  K.box(40,10,260,40,"A packet meets an applied ACL","standard list: read the source address",true)+
  K.arrow(170,50,170,70)+
  K.box(40,70,260,40,"Does line 10 match the packet?","only the bits where the wildcard is 0")+
  K.arrow(170,110,170,130)+K.txt(180,124,"no",{s:10.5})+
  K.box(40,130,260,40,"Does line 20 match?","")+
  K.arrow(170,170,170,190)+K.txt(180,184,"no",{s:10.5})+
  K.box(40,190,260,40,"… every line, in sequence order","")+
  K.arrow(170,230,170,250)+K.txt(180,244,"no",{s:10.5})+
  K.box(40,250,260,40,"Nothing matched: end of the list","")+
  K.arrow(170,290,170,310)+
  K.box(40,310,260,44,"Implicit deny any: DROP","invisible · not shown · not counted")+
  K.arrow(300,90,438,90,"yes",true)+K.box(440,70,290,40,"Do what line 10 says — and STOP","permit = forward · deny = drop",true)+
  K.arrow(300,150,438,150,"yes",true)+K.box(440,130,290,40,"Do what line 20 says — and STOP","",true)+
  K.arrow(300,210,438,210,"yes",true)+K.box(440,190,290,40,"Do what that line says — and STOP","",true)+
  K.txt(585,262,"Later lines are never read once one matches,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(585,280,"so specific lines go first, general lines last.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(585,330,"A list with no permit line denies everything.",{mid:true,c:"bad",s:11,f:"body"}),
  "How a router reads any ACL, standard or extended. The first match wins; the implicit deny catches the rest.")}
<h3>Worked example: four packets through one list</h3>
<p>A clinic router's list, as <code>show access-lists</code> prints it (left: sequence numbers):</p>
${K.out(`Standard IP access list 40
    10 permit 172.16.31.20
    20 deny   172.16.30.0, wildcard bits 0.0.1.255
    30 permit any`, "Line 20 covers 172.16.30.0–172.16.31.255 (wildcards: next section).")}
${K.steps([
  ["Source 172.16.31.20 (the pharmacy tablet)", "Line 10 matches exactly → <b>permit</b>, stop. Line 20 would have denied it, but it is never read."],
  ["Source 172.16.31.44 (a ward tablet)", "Line 10: no. Line 20: 172.16.31.44 is inside 172.16.30.0–172.16.31.255 → <b>deny</b>, stop."],
  ["Source 172.16.10.21 (a nurse's PC)", "Line 10: no. Line 20: no (third octet 10 is outside 30–31). Line 30, <code>any</code>: <b>permit</b>."],
  ["Same list without line 30, source 172.16.10.21", "No line matches; the implicit deny drops it. One forgotten <code>permit any</code> cuts off every nurse."],
])}
<p>Swap lines 10 and 20 and the tablet is denied. Order isn't style — it is the logic.</p>
${K.myth([
  ["The router checks every line and uses the best (most specific) match.","First match, not best match — the opposite of the routing table's longest match and OSPF's most specific network statement (Module 5)."],
  ["A list that only has deny lines blocks just those hosts.","It blocks everyone: whatever the deny lines don't catch reaches the implicit deny."],
  ["You must type deny any at the end, or everything else gets through.","The deny is implicit. Some engineers add an explicit deny any anyway, because the implicit one has no counter."],
  ["An ACL protects whatever it is near.","It filters only where it is applied, in the direction it is applied. On the wrong interface or direction it is valid — and useless."],
])}
${K.check({q:"List 12 is: 10 permit 10.4.0.0 0.0.255.255, 20 deny host 10.4.7.7, 30 permit any. What happens to a packet from 10.4.7.7?", o:["Denied by line 20, because it is the most specific line","Permitted by line 10 — it matches first, so line 20 is never read","Denied by the implicit deny","Permitted by line 30"], a:1, why:"10.4.7.7 is inside 10.4.0.0/16, so line 10 matches and the router stops. To deny that one host, the host line must come before the /16 line."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A list has four lines and no 'permit any': 10 deny host 192.168.7.9 · 20 permit 192.168.7.0 0.0.0.255 · 30 deny 192.168.0.0 0.0.255.255 · 40 permit 10.0.0.0 0.255.255.255. Match each source address with what decides its fate.", pairs:[["192.168.7.9","Line 10 — denied"],["192.168.7.200","Line 20 — permitted"],["192.168.9.4","Line 30 — denied"],["10.200.1.1","Line 40 — permitted"],["172.16.1.1","No line matches — implicit deny"]], why:"1. What is asked? Which line catches each source. 2. Which rule? Top down, first match, implicit deny at the end. 3. Apply it: .7.9 hits the host line first; .7.200 misses line 10 and is in 192.168.7.0/24; .9.4 is outside 7.0/24 but inside 192.168.0.0/16 (line 30); 10.200.1.1 is in 10.0.0.0/8; 172.16.1.1 fits nothing, so the invisible deny drops it."})}

<h2>Wildcard masks for ACLs: host, any, subnets and ranges</h2>
${K.remember(`<b>The rule (Module 5's OSPF wildcards, unchanged):</b> a wildcard bit of <b>0 = must match</b>, <b>1 = don't care</b>. For a subnet, the wildcard is <b>255.255.255.255 minus the mask</b>. Two shortcuts: <code>host A</code> = <code>A 0.0.0.0</code> (exactly one address) and <code>any</code> = <code>0.0.0.0 255.255.255.255</code> (every address).`)}
<p>The ${K.g("wildcard mask","A 32-bit pattern next to an address in an ACL or OSPF network command: 0 bit = this bit must match, 1 bit = ignore it.")} tells the router which source bits to compare. Module 5 used it to pick interfaces for OSPF; here it picks packets:</p>
<div class="tablewrap"><table>
<tr><th>To match…</th><th>Write</th><th>Why</th></tr>
<tr><td>one PC, 10.20.10.21</td><td><code>host 10.20.10.21</code> (or <code>10.20.10.21 0.0.0.0</code>; a standard list also takes a bare <code>10.20.10.21</code>)</td><td>every bit must match</td></tr>
<tr><td>every address</td><td><code>any</code></td><td>no bit must match</td></tr>
<tr><td>the /24 10.20.20.0</td><td><code>10.20.20.0 0.0.0.255</code></td><td>255.255.255.255 − 255.255.255.0</td></tr>
<tr><td>the /27 10.70.99.0 (.0–.31)</td><td><code>10.70.99.0 0.0.0.31</code></td><td>− 255.255.255.224</td></tr>
<tr><td>the /22 10.60.0.0 (10.60.0.0–10.60.3.255)</td><td><code>10.60.0.0 0.0.3.255</code></td><td>− 255.255.252.0</td></tr>
<tr><td>four /24s, 10.20.4.0 to 10.20.7.255</td><td><code>10.20.4.0 0.0.3.255</code></td><td>they form one aligned block of 4 — a /22</td></tr>
</table></div>
<h3>Matching a range of subnets with one line</h3>
<p>One line covers several subnets <b>only if they form one aligned block</b>: a power of two (2, 4, 8 …) of subnets, starting on a multiple of that number.</p>
${K.steps([
  ["Count", "172.16.30.0/24 and 172.16.31.0/24: 2 subnets, a power of two."],
  ["Check the start", "Block size 2, so the third octet must start on a multiple of 2: 30 is. (31 and 32 together would not be.)"],
  ["Write the wildcard", "2 × 256 addresses = 512 → <code>0.0.1.255</code>. Line: <code>deny 172.16.30.0 0.0.1.255</code>."],
  ["Test the edges", "172.16.30.0 to 172.16.31.255. 172.16.32.1? Third octet 32 = 00100000 differs from 30 = 00011110 in a must-match bit → no match."],
])}
<p>Three subnets, or an odd start, need two lines. One wider wildcard &ldquo;to be safe&rdquo; quietly catches neighbours — the on-the-job ticket later in this lesson is exactly that.</p>
<h3>What IOS does with your typing</h3>
${K.out(`IKJ-R1(config)#access-list 15 remark Admin PCs and the IT LAN
IKJ-R1(config)#access-list 15 permit host 10.1.1.10
IKJ-R1(config)#access-list 15 permit 10.1.1.77 0.0.0.255
IKJ-R1(config)#access-list 15 permit host 10.1.1.20
% Access rule can't be configured at higher sequence num as it is part of the existing rule at sequence num 20
IKJ-R1(config)#access-list 15 permit 10.1.3.0 255.255.255.0
IKJ-R1(config)#do show access-lists 15
Standard IP access list 15
    10 permit 10.1.1.10
    20 permit 10.1.1.0, wildcard bits 0.0.0.255
    30 permit 0.0.0.0, wildcard bits 255.255.255.0`, "Three lessons in one screen, explained below.")}
<ul>
<li><b>Line 20</b> — <code>10.1.1.77 0.0.0.255</code> is stored as <code>10.1.1.0</code>: read the stored form, it is what the router really matches.</li>
<li><b>The refusal</b> — first match again: after line 20, a line for .20 could never be reached, so IOS rejects a host line an earlier line already covers. (It doesn't check subnet lines this way — those are your job.)</li>
<li><b>Line 30</b> — Module 7's classic, a <b>mask</b> typed as the wildcard: &ldquo;ignore the first three octets, the last must be 0&rdquo; — no PC matches, so <code>deny 10.20.20.0 255.255.255.0</code> blocks nobody while the ticket says &ldquo;blocked&rdquo;. Unlike OSPF's <code>network</code> command, an ACL never inverts it for you: read every list back.</li>
</ul>
${K.drill({title:"masks to wildcards until it's automatic", types:["wildcard"], count:5})}
${K.check({q:"Which source address does access-list 7 permit 172.16.32.0 0.0.15.255 match?", o:["172.16.31.200","172.16.47.200","172.16.48.1","172.17.32.1"], a:1, why:"0.0.15.255 is the wildcard of a /20: 16 values in the third octet starting at 32, so 172.16.32.0–172.16.47.255. 47 is the last one; 31 and 48 are just outside; 172.17 changes a must-match octet."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"Write the address and wildcard (or keyword form) a standard ACL line needs for each target. None of these were in the table.", fields:[{label:"The /29 10.8.8.16 (.16–.23)", a:["10.8.8.16 0.0.0.7"]},{label:"Only the printer 192.168.5.9", a:["host 192.168.5.9","192.168.5.9 0.0.0.0","192.168.5.9"]},{label:"Eight /24s, 10.30.8.0 to 10.30.15.255", a:["10.30.8.0 0.0.7.255"]}], why:"1. What is asked? Address + wildcard for each target. 2. Which rule? Wildcard = 255.255.255.255 − mask; a block of subnets needs a power-of-two count on an aligned start. 3. Apply it: /29 = 255.255.255.248 → 0.0.0.7. One host = host keyword (or a 0.0.0.0 wildcard). Eight /24s starting at 8 (a multiple of 8) = one /21 → 0.0.7.255."})}

${K.drill({title:"one access-list line for a range — address and wildcard", types:["aclwild"], count:5})}
<h2>Standard ACLs: numbered and named</h2>
${K.remember(`<b>The rule:</b> a <b>numbered</b> standard list (1–99, 1300–1999) is built with global <code>access-list N …</code> lines, appended in the order you type them. A <b>named</b> list is built inside <code>ip access-list standard NAME</code>, where you can also give a <b>sequence number</b> to put a line exactly where it belongs. Both are checked the same way: lowest sequence number first.`)}
<h3>Numbered lists</h3>
${K.out(`access-list 20 remark Guests and ward tablets stay out of patient records
access-list 20 permit host 172.16.31.20
access-list 20 deny 172.16.30.0 0.0.1.255
access-list 20 permit any`, "Global configuration. remark is a comment stored with the list — put one on every list.")}
<p>IOS numbers the lines 10, 20, 30 as they arrive. <code>no access-list 20</code> — whatever follows the number — deletes the <b>whole list</b>. IOS XE stores numbered lists as <code>ip access-list standard 20</code> blocks, so you can open one that way and edit single lines, as with Module 7's NAT list: <code>no 30</code>, then <code>30 permit …</code>.</p>
<h3>Named lists — the way most teams write them</h3>
${K.out(`ABJ-CORE(config)#ip access-list standard PROTECT-RECORDS
ABJ-CORE(config-std-nacl)#remark Guests and ward tablets stay out of patient records
ABJ-CORE(config-std-nacl)#permit host 172.16.31.20
ABJ-CORE(config-std-nacl)#deny 172.16.30.0 0.0.1.255
ABJ-CORE(config-std-nacl)#permit any
ABJ-CORE(config-std-nacl)#exit`, "(config-std-nacl)# is standard named ACL mode: permit, deny or remark, optionally after a sequence number.")}
<ul>
<li><b>The name says what the list is for</b> — <code>PROTECT-RECORDS</code> beats <code>20</code> among forty lists. Names are case-sensitive.</li>
<li><b>Insert with a sequence number.</b> A visiting consultant, 172.16.30.88, needs records next week: <code>15 permit host 172.16.30.88</code> lands between line 10 and the deny at 20. Without a number it would go to the end — and IOS would refuse it, since line 20 already covers it.</li>
<li><b>Remove one line</b> with <code>no 15</code>. Resequencing is lesson 5.</li>
</ul>
${K.out(`ABJ-CORE#show access-lists PROTECT-RECORDS
Standard IP access list PROTECT-RECORDS
    10 permit 172.16.31.20
    20 deny   172.16.30.0, wildcard bits 0.0.1.255
    30 permit any`, "A host line shows without the word host. Remarks appear only in the running-config (on IOS XE 16.12 and later, numbered with the line after them).")}
${K.when([
  ["Numbered (access-list 20 …)","Short lists, old configs, commands that want a number","Quick; every IOS accepts it","Lists people edit often — a number says nothing"],
  ["Named (ip access-list standard NAME)","Anything you'll keep: interface, VTY and NAT lists","Self-describing; edit single lines by number","Only where a command takes a number"],
], "Numbered or named?")}
<h3>Try it: build and read standard lists on LOS-EDGE</h3>
<p>LOS-EDGE, a Lagos office router: Gi0/1 faces finance, Gi0/2 the meeting rooms. Policies: &ldquo;From the old 10.5.1.0/24 LAN only the supervisor's PC 10.5.1.10 may reach finance; other LANs may&rdquo;, and &ldquo;CCTV cameras (10.5.8.0–10.5.11.255) must not reach the meeting rooms&rdquo;.</p>
${K.term({env:"ios2", title:"LOS-EDGE — write, fix and apply standard lists", opts:{kind:"router", host:"LOS-EDGE", model:"C1111-4P", motd:"LOS-EDGE — console session (lab router, no enable secret)."},
  setup:env=>{ ["enable","configure terminal","interface g0/1","description FINANCE LAN","ip address 10.5.20.1 255.255.255.0","no shutdown","interface g0/2","description MEETING ROOMS","ip address 10.5.30.1 255.255.255.0","no shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Work out each wildcard before you type, and read every list back with <code>do show access-lists</code>.",
  tasks:[
    {text:"Numbered list 25, in this order: a <code>remark</code>, permit the supervisor <code>host 10.5.1.10</code>, deny the rest of 10.5.1.0/24, permit everyone else", done:e=>{ const A=window.ACL, l=e.acl.lists["25"]; return !!l && l.entries.some(x=>x.remark) && A.check(e.acl,"25",{src:"10.5.1.10"},false).permit && !A.check(e.acl,"25",{src:"10.5.1.77"},false).permit && A.check(e.acl,"25",{src:"10.5.2.9"},false).permit; }},
    {text:"A second supervisor, 10.5.1.20, gets the same access. Try <code>access-list 25 permit host 10.5.1.20</code> and read IOS's answer. Then put the line where it can work: <code>ip access-list standard 25</code> and <code>15 permit host 10.5.1.20</code>", done:e=>{ const l=e.acl.lists["25"]; return !!l && l.entries.some(x=>!x.remark && x.seq===15) && window.ACL.check(e.acl,"25",{src:"10.5.1.20"},false).permit && !window.ACL.check(e.acl,"25",{src:"10.5.1.21"},false).permit; }},
    {text:"Named list <code>NO-CAMERAS</code>: deny the four camera /24s 10.5.8.0–10.5.11.255 in <b>one</b> line, then permit everyone else", done:e=>{ const A=window.ACL; return !!e.acl.lists["NO-CAMERAS"] && !A.check(e.acl,"NO-CAMERAS",{src:"10.5.8.1"},false).permit && !A.check(e.acl,"NO-CAMERAS",{src:"10.5.11.200"},false).permit && A.check(e.acl,"NO-CAMERAS",{src:"10.5.12.1"},false).permit && A.check(e.acl,"NO-CAMERAS",{src:"10.5.7.250"},false).permit; }},
    {text:"Apply each list where its destination is: list 25 <b>out</b> on Gi0/1 (finance), <code>NO-CAMERAS</code> <b>out</b> on Gi0/2 (meeting rooms) — <code>interface g0/1</code>, <code>ip access-group 25 out</code>, and the same for Gi0/2", done:e=>e.intfs["GigabitEthernet0/1"].aclOut==="25" && e.intfs["GigabitEthernet0/2"].aclOut==="NO-CAMERAS"},
    {text:"<code>end</code>, then prove it: <code>show access-lists</code> and <code>show ip interface g0/2</code> (find the Outgoing access list line)", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+(ip\s+)?acc\S*/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+g\S*0\/2/i.test(h))},
  ],
  win:"Two standard lists built, fixed and applied: a host line inserted at 15 because IOS refused it after the /24, four camera subnets in one aligned /22 line (10.5.8.0 0.0.3.255), and each list outbound on the interface facing what it protects.",
  solve:["enable","configure terminal","access-list 25 remark Finance - supervisors only from the old LAN","access-list 25 permit host 10.5.1.10","access-list 25 deny 10.5.1.0 0.0.0.255","access-list 25 permit any","access-list 25 permit host 10.5.1.20","ip access-list standard 25","15 permit host 10.5.1.20","exit","ip access-list standard NO-CAMERAS","remark CCTV stays out of the meeting rooms","deny 10.5.8.0 0.0.3.255","permit any","exit","interface g0/1","ip access-group 25 out","interface g0/2","ip access-group NO-CAMERAS out","end","show access-lists","show ip interface g0/2"]})}
${K.hint(`Task 2: the refusal names line 20 — the /24 deny already catches .20, so the host line must sit <i>before</i> it. Task 3: four /24s starting at 8 (a multiple of 4) form one /22: wildcard 0.0.3.255.`)}
${K.check({q:"You open ip access-list standard WEB-USERS (lines 10, 20, 30) and type permit host 10.2.2.2 with no number. Where does it go?", o:["At the top, sequence 1","At the end, sequence 40 — after whatever line 30 is","Between 10 and 20","IOS asks you for a number"], a:1, why:"Without a number it is appended as the next multiple of 10 — after line 30, where a permit any or a covering deny means it never decides anything. Give it a number (5, 15…)."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A Kano depot's server-LAN list reads 10 permit any · 20 deny 10.70.40.0 0.0.0.255 · 30 permit host 10.70.40.5, and the ticket says 'stores PCs blocked, except the stores supervisor 10.70.40.5'. It blocks nobody. Put the three lines in the order that does what the ticket says.", items:["permit host 10.70.40.5","deny 10.70.40.0 0.0.0.255","permit any"], why:"1. What is asked? An order that blocks the stores LAN but lets its supervisor in. 2. Which rule? Top down, first match: with permit any first, every packet matches line 10 and nothing else is ever read. 3. Apply it: the most specific line first (the supervisor's host), then the stores /24 deny, then permit any for everyone else. Edit in place by sequence number (no 10, then 5 permit host 10.70.40.5 and 40 permit any) rather than deleting the live list."})}

${K.drill({title:"standard ACL — which line matches first?", types:["aclmatchstd"], count:5})}
<h2>Direction and placement: in, out, and close to the destination</h2>
${K.remember(`<b>The rules:</b> <b>direction</b> is from the router's point of view — <b>in</b> = packets arriving through that interface, checked <i>before</i> routing; <b>out</b> = packets leaving through it, checked <i>after</i> the routing decision. <b>One ACL per interface, per direction, per protocol</b> (IPv4/IPv6). A <b>standard</b> ACL goes <b>close to the destination</b>, because it can only see the source.`)}
${K.svg("0 0 760 250",
  K.dev("pc",90,110,"SOURCE LAN","10.20.20.0/24")+K.dev("router",380,110,"ROUTER","")+K.dev("server",670,110,"DESTINATION LAN","10.20.50.0/24")+
  K.link(118,112,354,112)+K.link(406,112,645,112)+
  K.txt(340,100,"G0/2",{end:true,s:10.5})+K.txt(420,100,"G0/0",{s:10.5})+
  K.arrow(130,66,340,66,"IN on G0/2: arriving, before routing",true)+
  K.arrow(420,66,640,66,"OUT on G0/0: leaving, after routing",true)+
  K.arrow(640,180,420,180,"reply: IN on G0/0")+K.arrow(340,180,130,180,"reply: OUT on G0/2")+
  K.txt(380,218,"Direction is always the router's view: in = into the router through that interface.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,238,"One conversation is IN on one interface and OUT on the other — and its replies the reverse.",{mid:true,s:11,f:"body"}),
  "In and out, from the router's point of view. A request from the source LAN can be filtered in on G0/2 or out on G0/0.")}
<h3>What in and out change</h3>
<ul>
<li><b>Inbound</b> is checked on arrival, before the routing lookup (and before NAT, so it sees Module 7's inside local addresses). It sees <b>everything</b> entering — including packets to the router itself, such as DHCP requests (the case study below).</li>
<li><b>Outbound</b> is checked once the exit is chosen, so it catches only traffic <b>routed out</b> of that interface, whichever interface it came from. (Packets the router creates itself: lesson 5.)</li>
<li><b>One per interface, per direction, per protocol.</b> A second <code>ip access-group … in</code> on the same interface silently <b>replaces</b> the first. Need more lines? Put them in the one list.</li>
</ul>
${K.remember(`<b>The three P's:</b> one ACL <b>per protocol</b>, <b>per interface</b>, <b>per direction</b>. Placement: <b>S</b>tandard → near the <b>D</b>estination, <b>E</b>xtended → near the <b>S</b>ource: &ldquo;S-D, E-S&rdquo;.`)}
<h3>Why a standard list belongs next to the destination</h3>
<p>A standard ACL knows only who sent the packet; it can't tell a contractor going to HR from the same contractor going to the intranet. So it blocks that source from <b>everything behind the point where it sits</b>. Near the source, that's far more than you meant; next to the thing you're protecting, it's only that thing. Cisco calls this a guideline: who controls each router, link bandwidth and ease of management can move the choice.</p>
${K.svg("0 0 760 300",
  K.dev("laptop",70,80,"CONTRACTORS","10.20.20.0/24")+K.dev("router",230,80,"PH-BR1","")+K.dev("router",450,80,"PH-HQ","")+
  K.dev("server",660,40,"HR SERVER","10.20.50.0/24")+K.dev("server",660,170,"INTRANET","10.20.60.0/24")+
  K.link(96,82,204,82)+K.link(256,82,424,82,"WAN 10.20.255.0/30")+K.link(476,76,640,46)+K.link(476,90,640,166)+
  K.txt(230,150,"✗ in on PH-BR1, near the source",{mid:true,c:"bad",b:true,f:"body"})+
  K.txt(230,166,"contractors lose HR, the intranet",{mid:true,s:10.5,f:"body"})+
  K.txt(230,180,"and everything else beyond PH-BR1",{mid:true,s:10.5,f:"body"})+
  K.txt(540,24,"✓ out on PH-HQ G0/0",{mid:true,c:"ok",b:true,f:"body"})+
  K.txt(540,38,"only HR is protected",{mid:true,s:10.5,f:"body"})+
  K.txt(380,252,"A standard list sees only the source, so it blocks that source from everything behind the point where it sits.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,272,"Close to the destination, 'everything behind' is just the thing you're protecting.",{mid:true,s:11,f:"body"})+
  K.txt(380,292,"The cost: denied packets cross the WAN first. Extended lists (lesson 5) can sit near the source.",{mid:true,s:11,f:"body"}),
  "Placement of a standard ACL: the same two lines, two very different results.")}
${K.mistake(`The wrong direction. Contractors' packets to HR <b>leave</b> PH-HQ through G0/0, so <code>ip access-group HR-ONLY in</code> on G0/0 never sees them — only the server's replies (source 10.20.50.10, which <code>permit any</code> passes). The deny line's counter stays at zero. Ask: which way does the packet I want to stop cross <i>this</i> interface?`)}
${K.exam(`Reading an ACL question: before the options, write down the <b>source</b>, the <b>destination</b>, the <b>protocol/port</b> (a standard list sees only the source — notice when the question cares about more) and the <b>direction</b> relative to the router in the exhibit. Then walk the packet down the list. Traps: a mask for a wildcard, a host line after a subnet line that catches it, no permit, a standard list near the source.`)}
${K.check({q:"Router R2 has G0/0 to the server LAN and G0/1 to the WAN. A standard ACL must stop 10.1.5.0/24 reaching the server LAN while it can still use the WAN to reach everything else. Which is right?", o:["ip access-group on G0/1 in","ip access-group on G0/0 out","ip access-group on G0/0 in","ip access-group on G0/1 out"], a:1, why:"Packets to the servers leave R2 through G0/0, so out on G0/0 catches exactly them. In on G0/1 would block 10.1.5.0/24 from everything reached through R2; in on G0/0 sees only the servers' own packets; out on G0/1 sees traffic heading to the WAN."})}
<h3>Same logic, new situation</h3>
<p>A university: lecture-hall Wi-Fi 10.90.64.0/20 is on router CAMPUS-A; the exam-results server 10.90.200.5 is on CAMPUS-C's G0/1, two routers away. Students must not reach it but keep the library, email and internet. Standard ACL only: where, which direction, which lines?</p>
${K.hint(`Find the last interface the packets cross before the server. One deny for the Wi-Fi block (a /20's wildcard?), and the line everyone else needs.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Interface, direction, lines. <b>2. Which rule?</b> Standard = as close to the destination as possible. <b>3. Apply it:</b> CAMPUS-C, <b>out</b> on G0/1: <code>ip access-list standard NO-STUDENT-WIFI</code>, <code>deny 10.90.64.0 0.0.15.255</code> (/20 = 255.255.240.0), <code>permit any</code>. On CAMPUS-A it would cut the halls off from everything. If other servers share that LAN, students lose them too — then you need an extended list naming 10.90.200.5 (lesson 5).</p>`)}

${K.drill({title:"where does the standard ACL go?", types:["aclplacestd"], count:5})}
<h2>Applying and verifying — and what a blocked user sees</h2>
${K.remember(`<b>The rule:</b> apply with <code>ip access-group NAME|N in|out</code> in interface mode, then prove it three ways: <code>show ip interface</code> (applied, which direction?), <code>show access-lists</code> (which line is matching, how often?) and a test from a real source.`)}
<h3>Worked example: protecting patient records in Abuja</h3>
<p>ABJ-CORE routes a clinic: Gi0/0 staff 172.16.10.0/24, Gi0/1 records LAN 172.16.40.0/24 (server .10), Gi0/2 a /30 to the Wi-Fi router serving guests (172.16.30.0/24) and ward tablets (172.16.31.0/24). Policy: the earlier PROTECT-RECORDS list.</p>
${K.steps([
  ["Write the list", "<code>PROTECT-RECORDS</code> as built above."],
  ["Interface and direction", "The interface facing the destination, <b>Gi0/1</b>; packets to the server leave through it: <b>out</b>. <code>interface g0/1</code>, <code>ip access-group PROTECT-RECORDS out</code> — effective at once."],
  ["Test and read the evidence", "A guest, a ward tablet and a nurse each ping 172.16.40.10; then <code>show ip interface g0/1</code> and <code>show access-lists</code>."],
])}
${K.out(`C:\\Users\\guest>ping 172.16.40.10

Pinging 172.16.40.10 with 32 bytes of data:
Reply from 10.0.0.1: Destination protocol unreachable.
Reply from 10.0.0.1: Destination protocol unreachable.
Reply from 10.0.0.1: Destination protocol unreachable.
Reply from 10.0.0.1: Destination protocol unreachable.

Ping statistics for 172.16.40.10:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`, "The guest. The replies come from 10.0.0.1 — ABJ-CORE's Gi0/2, where the packet entered — not from the server. Received = 4 counts the error replies; no times, no TTL.")}
${K.out(`ABJ-CORE#show ip interface g0/1 | include access list
  Outgoing Common access list is not set
  Outgoing access list is PROTECT-RECORDS
  Inbound Common access list is not set
  Inbound  access list is not set
ABJ-CORE#show access-lists
Standard IP access list PROTECT-RECORDS
    10 permit 172.16.31.20
    20 deny   172.16.30.0, wildcard bits 0.0.1.255 (8 matches)
    30 permit any (4 matches)`, "Guest + ward tablet = 2 × 4 echoes on line 20; the nurse = 4 on line 30. Line 10 has matched nothing yet, so it shows no count.")}
<ul>
<li><b>Outgoing access list is PROTECT-RECORDS</b> — applied, outbound, right interface (ignore the &ldquo;Common&rdquo; lines).</li>
<li><b>Counters</b> rise with every packet a line decides: a Windows ping adds 4, an IOS ping 5. For a clean test, <code>clear access-list counters PROTECT-RECORDS</code>, test once, read again.</li>
<li><b>The implicit deny has no counter.</b> To see what falls off the end, finish with an explicit <code>deny any</code> (lesson 5 adds <code>log</code>).</li>
<li><b>An applied list that doesn't exist permits everything.</b> IOS accepts a mistyped name in <code>ip access-group</code>; compare <code>show ip interface</code> with <code>show access-lists</code>.</li>
</ul>
${K.tip(`Prove every change with two numbers: clear the counters, test once from a source that must be blocked and once from one that must pass, and paste both counts into the ticket.`)}
<h3>What the blocked user sees</h3>
<p>When an ACL drops a packet, IOS normally sends the sender an ${K.g("ICMP","Internet Control Message Protocol (Modules 1 and 5): IP's error and test messages — echo for ping, time exceeded for traceroute, destination unreachable for failures.")} <b>destination unreachable, code 13 — &ldquo;administratively prohibited&rdquo;</b>. Recognise it in every tool:</p>
<div class="tablewrap"><table>
<tr><th>Tool</th><th>Blocked by an ACL</th><th>With <code>no ip unreachables</code></th></tr>
<tr><td>Windows <code>ping</code></td><td><code>Reply from 10.0.0.1: Destination protocol unreachable.</code> — from a router, not the target</td><td><code>Request timed out.</code></td></tr>
<tr><td>Windows <code>tracert</code></td><td><code>2  10.0.0.1  reports: Destination protocol unreachable.</code></td><td>time-outs</td></tr>
<tr><td>IOS <code>ping</code></td><td><code>U.U.U</code>, success rate 0 percent</td><td><code>.....</code></td></tr>
<tr><td>IOS <code>traceroute</code></td><td><code>1 10.0.0.1 !A  *  !A</code> (A = administratively prohibited)</td><td><code>*  *  *</code></td></tr>
<tr><td>Browser or <code>curl</code></td><td>waits about 21 s while Windows retries, then <code>curl: (28) Failed to connect …</code> (or <code>(7)</code>, depending on the error Windows hands curl)</td><td>the same</td></tr>
</table></div>
<p>${K.g("curl","A command-line tool that fetches a web page (or any URL) and prints what came back. Built into Windows 10/11, Linux and macOS. curl: (7) = connection refused; curl: (28) = timed out.")} is how the benches test web access: <code>curl http://10.20.50.10</code> prints the page or an error. <code>U.U.U</code> rather than <code>UUUUU</code>: IOS rate-limits unreachables (one per 500 ms by default), exactly as for Module 5's &ldquo;no route&rdquo; — so let traceroute tell them apart: <code>!H</code> = no route, <code>!A</code> = a filter.</p>
${K.dyk(`Windows has no wording for &ldquo;administratively prohibited&rdquo;: its ping status code for &ldquo;prohibited&rdquo; is the same number as &ldquo;protocol unreachable&rdquo;, so it prints <i>Destination protocol unreachable</i> — misleading, but a reliable ACL fingerprint. Linux ping says <i>Packet filtered</i>.`)}
<h3><code>no ip unreachables</code>: block quietly</h3>
<p>The unreachable tells the sender &ldquo;a filter stopped you, here&rdquo; — useful to your helpdesk, and to anyone mapping your network before an attack. <code>no ip unreachables</code> stops the router sending them from an interface; put it on the one the denied packets arrive on, which the error would go back out of (Gi0/2 at ABJ-CORE). The guest sees <code>Request timed out.</code>; <code>show ip interface</code> says <code>ICMP unreachables are never sent</code>. The cost: &ldquo;no route&rdquo; messages go quiet too, so many teams do this only on internet-facing interfaces.</p>
<h3>Hands-on: the auditor's first finding — contractors and the HR portal</h3>
<p>Back at the Port Harcourt fintech: contractors sit on PH-BR1; the HR portal and the intranet on two LANs behind PH-HQ. Close the finding without breaking anything else — and see why the obvious interface is the wrong one.</p>
${K.bench({id:"m8-hr-contractors", points:110, openLog:true, from:"CCNA · Module 8 · lesson 4", title:"Port Harcourt: keep contractors out of the HR portal — and only the HR portal", viewBox:"0 0 900 420",
  intro:"<b>Design:</b> PH-BR1 Gi0/0 = staff 10.20.10.0/24, Gi0/1 = contractors 10.20.20.0/24, Gi0/2 = WAN 10.20.255.1/30. PH-HQ Gi0/2 = WAN .2, Gi0/0 = HR LAN 10.20.50.0/24 (HR-SRV .10), Gi0/1 = intranet LAN 10.20.60.0/24 (INTRANET .10); static routes in place. <b>Policy:</b> contractors lose the HR LAN only; staff keep everything. Console on PH-HQ: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab note:</b> the lab's curl fails at once where real Windows retries for about 21 seconds.",
  devices:[
    {id:"r1", kind:"router", label:"PH-BR1", x:40, y:20, config:e=>{ ["en","conf t","hostname PH-BR1","no ip domain-lookup","int g0/0","description STAFF LAN","ip address 10.20.10.1 255.255.255.0","no shut","int g0/1","description CONTRACTORS","ip address 10.20.20.1 255.255.255.0","no shut","int g0/2","description WAN to PH-HQ","ip address 10.20.255.1 255.255.255.252","no shut","exit","ip route 10.20.50.0 255.255.255.0 10.20.255.2","ip route 10.20.60.0 255.255.255.0 10.20.255.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"r2", kind:"router", label:"PH-HQ", x:560, y:20, config:e=>{ ["en","conf t","hostname PH-HQ","no ip domain-lookup","int g0/0","description HR SERVER LAN","ip address 10.20.50.1 255.255.255.0","no shut","int g0/1","description INTRANET LAN","ip address 10.20.60.1 255.255.255.0","no shut","int g0/2","description WAN to PH-BR1","ip address 10.20.255.2 255.255.255.252","no shut","exit","ip route 10.20.10.0 255.255.255.0 10.20.255.1","ip route 10.20.20.0 255.255.255.0 10.20.255.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"PH-SW1", x:20, y:140},
    {id:"st", kind:"pc", label:"STAFF-1", x:20, y:290, ip:"10.20.10.21", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"con", kind:"laptop", label:"CONTR-1", x:170, y:290, ip:"10.20.20.31", mask:"255.255.255.0", gw:"10.20.20.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:320, y:290},
    {id:"hr", kind:"server", label:"HR-SRV", x:560, y:170, ip:"10.20.50.10", mask:"255.255.255.0", gw:"10.20.50.1", services:{web:{title:"HR portal"}}},
    {id:"in", kind:"server", label:"INTRANET", x:720, y:170, ip:"10.20.60.10", mask:"255.255.255.0", gw:"10.20.60.1", services:{web:{title:"Staff intranet"}}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"st:eth", b:"sw:g2"}, {type:"cat6", a:"con:eth", b:"r1:g1"}, {type:"cat6", a:"r1:g2", b:"r2:g2"}, {type:"cat6", a:"hr:eth", b:"r2:g0"}, {type:"cat6", a:"in:eth", b:"r2:g1"}, {type:"console", a:"lap:usb", b:"r2:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Prove the finding: on CONTR-1's Command Prompt, <code>curl http://10.20.50.10</code> (curl fetches a web page and prints it). The HR portal opens for a contractor. Then <code>curl http://10.20.60.10</code> — the intranet, which contractors are meant to have", done:B=>Bench.fetched(B,"con","10.20.50.10") && Bench.fetched(B,"con","10.20.60.10")},
    {text:"Console to PH-HQ, <code>enable</code>, <code>configure terminal</code>. Build the named standard list <code>HR-ONLY</code>: a <code>remark</code>, deny the contractors' /24, permit everyone else", done:B=>{ const e=B.devs.r2.env, A=window.ACL, l=e.acl.lists["HR-ONLY"]; return !!l && l.kind==="standard" && l.entries.some(x=>x.remark) && !A.check(e.acl,"HR-ONLY",{src:"10.20.20.31"},false).permit && A.check(e.acl,"HR-ONLY",{src:"10.20.10.21"},false).permit && A.check(e.acl,"HR-ONLY",{src:"10.20.255.1"},false).permit; }},
    {text:"A colleague says: &ldquo;Put it on G0/2 <b>in</b> — that's where the contractors' packets enter PH-HQ.&rdquo; Try it (<code>interface g0/2</code>, <code>ip access-group HR-ONLY in</code>), then from CONTR-1 curl both servers again. What happened to the intranet — and why?", done:B=>{ const e=B.devs.r2.env, l=e.acl.lists["HR-ONLY"]; const hits = l ? l.entries.filter(x=>!x.remark && x.action==="deny").reduce((a,x)=>a+x.hits,0) : 0; return e.history.some(h=>/ip\s+access-group\s+HR-ONLY\s+in/i.test(h)) && hits>0 && Bench.tried(B,"con",/curl\s.*10\.20\.60\.10/); }},
    {text:"Move it to where a standard list belongs: remove it from G0/2 (<code>no ip access-group HR-ONLY in</code>) and apply it <b>out</b> on G0/0, the HR server LAN. Done when contractors are blocked from HR only — curl the HR portal and the intranet from CONTR-1, and the HR portal from STAFF-1", done:B=>{ const e=B.devs.r2.env, A=window.ACL; return e.intfs["GigabitEthernet0/0"].aclOut==="HR-ONLY" && !e.intfs["GigabitEthernet0/2"].aclIn && !A.check(e.acl,"HR-ONLY",{src:"10.20.20.31"},false).permit && A.check(e.acl,"HR-ONLY",{src:"10.20.10.21"},false).permit && Bench.fetched(B,"st","10.20.50.10") && Bench.tried(B,"con",/curl\s.*10\.20\.50\.10/); }},
    {text:"See it as the contractor and as the router: from CONTR-1 <code>ping 10.20.50.10</code> and <code>tracert 10.20.50.10</code> — who answers, with what? On PH-HQ, <code>show access-lists HR-ONLY</code> (which line counted, and by how many per ping?) and <code>show ip interface g0/0</code> (find Outgoing access list)", done:B=>{ const h=B.devs.r2.env.history; return Bench.tried(B,"con",/^\s*ping\s+10\.20\.50\.10/) && Bench.tried(B,"con",/^\s*tracert\s+10\.20\.50\.10/) && h.some(x=>/sh\S*\s+(ip\s+)?acc\S*/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+int\S*\s+g\S*0\/0/i.test(x)); }},
    {text:"Security asks you not to advertise the filter. On the interface the contractors' packets arrive on, G0/2: <code>no ip unreachables</code>. Ping again from CONTR-1 — what changed? Then save: <code>copy running-config startup-config</code>", done:B=>{ const e=B.devs.r2.env; return !!e.intfs["GigabitEthernet0/2"].noUnreach && !!e.savedOnce; }},
  ],
  win:"Finding closed the right way: HR-ONLY outbound on PH-HQ G0/0 blocks contractors from the HR server LAN only. You saw why: inbound on G0/2 the same two lines cut contractors off from the intranet too, because a standard list sees nothing but the source. The deny line's counter rose by 4 per ping, the contractor got 'Destination protocol unreachable' from 10.20.255.2 (tracert named the same router), and with no ip unreachables the block became a silent time-out.",
  solve:[["pc","con","curl http://10.20.50.10"],["pc","con","curl http://10.20.60.10"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],
    ["term","ip access-list standard HR-ONLY"],["term","remark Contractors keep out of the HR server LAN"],["term","deny 10.20.20.0 0.0.0.255"],["term","permit any"],["term","exit"],
    ["term","interface g0/2"],["term","ip access-group HR-ONLY in"],["term","end"],
    ["pc","con","curl http://10.20.50.10"],["pc","con","curl http://10.20.60.10"],
    ["term","configure terminal"],["term","interface g0/2"],["term","no ip access-group HR-ONLY in"],["term","interface g0/0"],["term","ip access-group HR-ONLY out"],["term","end"],
    ["pc","con","curl http://10.20.50.10"],["pc","con","curl http://10.20.60.10"],["pc","st","curl http://10.20.50.10"],
    ["pc","con","ping 10.20.50.10"],["pc","con","tracert 10.20.50.10"],["term","show access-lists HR-ONLY"],["term","show ip interface g0/0"],
    ["term","configure terminal"],["term","interface g0/2"],["term","no ip unreachables"],["term","end"],["pc","con","ping 10.20.50.10"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 3: inbound on G0/2 the list judges <i>every</i> contractor packet entering PH-HQ — it can't tell HR from intranet. Task 4: packets to HR-SRV leave through G0/0, so an <i>outbound</i> list there sees only them. Task 6: unreachables go back out of the interface the denied packets came in on.`)}
${K.job("“Since Tuesday, the Kaduna tellers can't open core banking”",`
<p><b>The ticket.</b> Wednesday 08:20, a bank's network team: &ldquo;Kaduna branch: tellers can't load core banking. The manager's PC is fine. Since yesterday afternoon.&rdquo;</p>
<p><b>Questions first.</b> Who: all tellers (10.44.12.0/24); managers (10.44.20.0/24) are fine, so the server and WAN are up. What changed: the change calendar says <i>&ldquo;HQ-CORE: block decommissioned ATM-management subnet 10.44.8.0/24 from the core-banking LAN&rdquo;</i>. A filter change and one subnet broken — suspicious.</p>
<p><b>Checks, from the teller's side</b> (remote session to TELLER-3, 10.44.12.25):</p>
${K.out(`C:\\Users\\teller3>curl http://10.44.100.20
curl: (28) Failed to connect to 10.44.100.20:80 after 21045 ms: Could not connect to server

C:\\Users\\teller3>ping 10.44.100.20

Pinging 10.44.100.20 with 32 bytes of data:
Reply from 10.44.255.1: Destination protocol unreachable.
Reply from 10.44.255.1: Destination protocol unreachable.
Reply from 10.44.255.1: Destination protocol unreachable.
Reply from 10.44.255.1: Destination protocol unreachable.

C:\\Users\\teller3>tracert 10.44.100.20

Tracing route to 10.44.100.20 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.44.12.1
  2  10.44.255.1  reports: Destination protocol unreachable.`, "The ACL fingerprint: a router (10.44.255.1, HQ-CORE's WAN side) answers instead of the server, and tracert names it. (Lab output; real curl's wording varies a little by version.)")}
<p><b>Checks, on that router:</b></p>
${K.out(`HQ-CORE#show ip interface g0/1 | include access list
  Outgoing Common access list is not set
  Outgoing access list is CBS-PROTECT
  Inbound Common access list is not set
  Inbound  access list is not set
HQ-CORE#show access-lists CBS-PROTECT
Standard IP access list CBS-PROTECT
    10 deny   10.44.8.0, wildcard bits 0.0.7.255 (2391 matches)
    20 permit any (48117 matches)`, "Line 10 has counted thousands of packets since yesterday afternoon — the decommissioned subnet is meant to be silent, so this is live traffic from somewhere else. The wildcard is the clue.")}
<p><b>Diagnosis.</b> <code>0.0.7.255</code> is a /21: 10.44.8.0 to <b>10.44.15.255</b>, eight /24s including the tellers' 10.44.12.0/24. Placement and direction are right; the wildcard should be <code>0.0.0.255</code>.</p>
<p><b>Fix</b> (emergency change, approved by the duty manager by phone): only line 10 — <code>ip access-list standard CBS-PROTECT</code>, <code>no 10</code>, <code>10 deny 10.44.8.0 0.0.0.255</code>. Retyping the whole list would leave the LAN briefly with none, or half of one.</p>
<p><b>Verify.</b> <code>clear access-list counters CBS-PROTECT</code>; the teller's curl returns the page; line 10 stays at zero while line 20 counts the teller. <code>copy running-config startup-config</code>.</p>
<p><b>What you say</b> to the branch: &ldquo;Yesterday's security change blocked a wider range than intended, including your tellers. It's corrected — please refresh core banking.&rdquo; To the change owner: the wildcard, and a rule that every ACL change is tested from one source that must still work.</p>
<p><b>Ticket note.</b> <i>&ldquo;HQ-CORE CBS-PROTECT (out Gi0/1) line 10 was deny 10.44.8.0 0.0.7.255 (= 10.44.8.0–10.44.15.255), catching Kaduna tellers 10.44.12.0/24. Line 10 replaced with deny 10.44.8.0 0.0.0.255 at 08:47. Verified TELLER-3 curl OK, line 10 0 matches after clear. Saved. Root cause: /21 wildcard for a /24. 30 min.&rdquo;</i></p>`)}
${K.check({q:"A user's ping shows Reply from 10.44.255.1: Destination protocol unreachable for a server at 10.44.100.20. What does it tell you first?", o:["The server's network cable is unplugged","A router at 10.44.255.1 refused the packet — most likely an ACL there (administratively prohibited)","The server is up but its firewall blocked the ping","DNS resolved the wrong address"], a:1, why:"The reply comes from a router, not the server, with the message Windows uses for ICMP code 13. Go to that router: show ip interface for the applied lists, show access-lists for the line counting the user's packets."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Five tickets from different sites. Match what the engineer saw with what it means.", pairs:[["Reply from 10.9.0.1: Destination protocol unreachable.","An ACL on the router at 10.9.0.1 denied the packet"],["IOS traceroute ends with !H at a router","That router has no route to the destination"],["Request timed out, and the deny line's counter rises with each ping","Denied by the ACL, with no ip unreachables on the arrival interface"],["The deny line stays at 0 matches, permit any keeps counting, the user still gets through","The list is on the wrong interface or in the wrong direction"],["New DHCP clients get 169.254 addresses after an inbound list was added; leased PCs are fine","The implicit deny drops Discovers from 0.0.0.0"]], why:"1. What is asked? What each fingerprint proves. 2. Which rules? A filtering router answers with ICMP code 13 (Windows: Destination protocol unreachable; IOS: !A), a missing route gives !H, no ip unreachables turns a block into a silent time-out, counters show which line decides, and an inbound list also filters traffic to the router itself. 3. Apply them one ticket at a time: the counter that doesn't move is often the most useful clue of all."})}
${K.case("The school where only new laptops broke",`
<p>An Enugu secondary school, mid-term. ENU-R1 is the DHCP server for the students' LAN 10.60.0.0/22 (Module 7), with 7-day leases. On Saturday a contractor &ldquo;tightened security&rdquo;: inbound on the LAN interface, a standard list <code>STUDENTS-ONLY</code> with one line, <code>permit 10.60.0.0 0.0.3.255</code> — &ldquo;only our own addresses may enter&rdquo;.</p>
<p><b>The symptom.</b> Monday: laptops that were in use last week work; every new laptop shows 169.254.x.x.</p>
<p><b>Why.</b> A new laptop's DHCP Discover comes from <b>0.0.0.0</b> (Module 7 lesson 1). The inbound list matches no line and the <b>implicit deny</b> drops it before the router's DHCP server sees it. Laptops with an unexpired lease keep their address and renew with a <b>unicast</b> Request from their own 10.60.x.x address, which line 10 permits. The lab shows it plainly:</p>
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from NEW-PC: "is there a DHCP server?"
  · ACL STUDENTS-ONLY in on ENU-R1 Gi0/0 denies UDP 0.0.0.0:68 → 255.255.255.255:67 — no line matched, so the implicit deny any at the end drops it
No DHCP Offer came back. Windows keeps trying and meanwhile gives itself an APIPA address (169.254.x.x, mask 255.255.0.0)`, "The lab's frame log (trimmed). The dropped Discovers left no counter in show access-lists.")}
<p><b>The fix.</b> Let address-less clients in, ahead of everything: <code>ip access-list standard STUDENTS-ONLY</code>, <code>5 permit host 0.0.0.0</code>. New laptops lease at once; <code>show access-lists</code> now counts the address-less clients on line 5.</p>
<p><b>The lessons.</b> An inbound list also filters traffic <i>to the router itself</i>; the implicit deny catches what you forgot existed; and &ldquo;only some users broken&rdquo; often means &ldquo;only users doing something different&rdquo;.</p>`)}

<h2>Securing the VTY lines with access-class</h2>
${K.remember(`<b>The rule:</b> <code>access-class N in</code> under <code>line vty</code> filters <b>who may open an SSH or Telnet session to the device itself</b>, by source address, whichever of the router's addresses they connect to. It uses a standard list. It doesn't filter pings, routing or any traffic passing through.`)}
<p>The second finding is about the ${K.g("VTY lines","Virtual terminal lines (Module 2): the router's remote-login sessions, line vty 0 4 on routers (0 15 on most switches), used by SSH and Telnet.")} from Module 2. Every desk that reaches the prompt can try to guess the password; limiting where a login can start from is the next layer. An interface ACL would need extended entries (lesson 5) on every interface, since SSH works to any of the router's addresses; <code>access-class</code> guards the lines themselves, once.</p>
${K.out(`KN-R1(config)#ip access-list standard VTY-ADMINS
KN-R1(config-std-nacl)#remark IT admin LAN only
KN-R1(config-std-nacl)#permit 10.70.99.0 0.0.0.31
KN-R1(config-std-nacl)#exit
KN-R1(config)#line vty 0 4
KN-R1(config-line)#access-class VTY-ADMINS in
KN-R1(config-line)#end
KN-R1#show running-config | section line vty
line vty 0 4
 access-class VTY-ADMINS in
 login local
 transport input ssh`, "The keyword is access-class (not access-group); in = sessions coming into the device.")}
<ul>
<li><b>Every line in use.</b> Catalyst switches also have <code>line vty 5 15</code>: apply the same access-class there (<code>line vty 0 15</code> does all at once), or the sixth session gets in unfiltered.</li>
<li><b>A refused user sees</b> <code>ssh: connect to host 10.70.10.1 port 22: Connection refused</code> — at once, no password prompt. Ping still answers.</li>
<li><b>Counters</b> in <code>show access-lists VTY-ADMINS</code> count permitted sessions; refused ones hit the implicit deny and leave none.</li>
<li><code>access-class … out</code> limits where a logged-in user may connect onward from the router — rarely used.</li>
</ul>
${K.mistake(`Locking yourself out. SSH'd in from 10.80.5.9, you apply an access-class permitting only 10.70.99.0/27: the session you're in survives, your next login is refused. Before changing VTY access remotely, permit your own source, keep console access possible, and consider <code>reload in 10</code> first — a reload to the saved config in 10 minutes, cancelled with <code>reload cancel</code> once a fresh login works.`)}
${K.when([
  ["ip access-group on an interface","Filtering traffic through the router","Sees every packet crossing that interface that way","Protecting only the router's logins"],
  ["access-class on line vty","Restricting who can SSH/Telnet to the device","One command covers every address the box has","Filtering transit traffic — it never sees it"],
], "Which ACL command?")}
${K.check({q:"KN-R1 has access-class VTY-ADMINS in on line vty 0 4, and VTY-ADMINS permits only 10.70.99.0 0.0.0.31. A staff PC at 10.70.10.25 pings 10.70.10.1 and then tries SSH to it. What happens?", o:["Both fail: the access-class blocks all traffic from 10.70.10.25","The ping succeeds; SSH is refused with Connection refused","The ping fails; SSH asks for a password","Both succeed, because access-class only applies to Telnet"], a:1, why:"access-class filters only sessions to the VTY lines (SSH and Telnet alike). Pings and transit traffic are untouched; the SSH attempt from a source the list doesn't permit is refused before any password prompt."})}
<h3>Hands-on: the auditor's second finding — SSH from any desk</h3>
<p>Kano depot. The two-year-old design document says the IT admin LAN is <b>10.70.99.0/28</b>. Build what it says, test it like an auditor, then handle the ticket that follows.</p>
${K.bench({id:"m8-kano-vty", points:110, from:"CCNA · Module 8 · lesson 4", title:"Kano: only the IT admin LAN may SSH to KN-R1", viewBox:"0 0 900 420",
  intro:"<b>Design document:</b> KN-R1 Gi0/0 = staff LAN 10.70.10.0/24; Gi0/1 = IT admin LAN <b>10.70.99.0/28</b>. SSH is set up (Module 2): user <code>netadmin</code> / <code>Kn0-Adm1n!</code>, enable secret <code>Kn0-En4ble!</code> (lab examples). ADMIN-PC 10.70.99.5, ADMIN-LAP 10.70.99.20. Console: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control.",
  devices:[
    {id:"kn", kind:"router", label:"KN-R1", x:340, y:20, config:e=>{ ["en","conf t","hostname KN-R1","no ip domain-lookup","enable secret Kn0-En4ble!","ip domain name kano.example.com","username netadmin secret Kn0-Adm1n!","int g0/0","description STAFF LAN","ip address 10.70.10.1 255.255.255.0","no shut","int g0/1","description IT ADMIN LAN","ip address 10.70.99.1 255.255.255.224","no shut","line vty 0 4","login local","transport input ssh","exit","crypto key generate rsa",""].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KN-SW1", x:20, y:140},
    {id:"sw2", kind:"switch", label:"KN-SW2", x:460, y:140},
    {id:"st", kind:"pc", label:"STAFF-PC", x:40, y:290, ip:"10.70.10.25", mask:"255.255.255.0", gw:"10.70.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:220, y:290},
    {id:"ad", kind:"pc", label:"ADMIN-PC", x:500, y:290, ip:"10.70.99.5", mask:"255.255.255.224", gw:"10.70.99.1"},
    {id:"ad2", kind:"laptop", label:"ADMIN-LAP", x:680, y:290, ip:"10.70.99.20", mask:"255.255.255.224", gw:"10.70.99.1"},
  ],
  cables:[ {type:"cat6", a:"kn:g0", b:"sw:g1"}, {type:"cat6", a:"st:eth", b:"sw:g2"}, {type:"cat6", a:"kn:g1", b:"sw2:g1"}, {type:"cat6", a:"ad:eth", b:"sw2:g2"}, {type:"cat6", a:"ad2:eth", b:"sw2:g3"}, {type:"console", a:"lap:usb", b:"kn:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the finding: from STAFF-PC, <code>ssh -l netadmin 10.70.10.1</code>. A staff desk gets the login prompt — log in with the build-sheet password to prove anyone who learns it could, then <code>exit</code>", done:B=>Bench.tried(B,"st",/^\s*ssh\b.*10\.70\.10\.1/)},
    {text:"Console to KN-R1, <code>enable</code>, <code>configure terminal</code>. Build <code>ip access-list standard VTY-ADMINS</code> with a <code>remark</code> and one permit for the design document's admin LAN, 10.70.99.0/28. Then <code>line vty 0 4</code> and <code>access-class VTY-ADMINS in</code>", done:B=>{ const e=B.devs.kn.env, A=window.ACL; return e.lines.vty.acl==="VTY-ADMINS" && !!e.acl.lists["VTY-ADMINS"] && A.check(e.acl,"VTY-ADMINS",{src:"10.70.99.5"},false).permit && !A.check(e.acl,"VTY-ADMINS",{src:"10.70.10.25"},false).permit; }},
    {text:"Test like an auditor: STAFF-PC tries SSH again (what does it say now?) and <code>ping 10.70.10.1</code> (does access-class stop pings?). ADMIN-PC: <code>ssh -l netadmin 10.70.99.1</code>, log in, <code>enable</code>, <code>show users</code> (lists the sessions on the router: which VTY line, from where), <code>exit</code>", done:B=>{ const l=B.devs.kn.env.acl.lists["VTY-ADMINS"]; const hits = l ? l.entries.reduce((a,x)=>a+(x.hits||0),0) : 0; return B.devs.kn.env.lines.vty.acl==="VTY-ADMINS" && Bench.pinged(B,"st","10.70.10.1") && Bench.tried(B,"ad",/show\s+users/i) && hits>0; }},
    {text:"An hour later, a ticket from Musa in IT: &ldquo;ADMIN-LAP (10.70.99.20) gets Connection refused on KN-R1 since your change.&rdquo; Reproduce it from ADMIN-LAP. Then work as you would from the IT office: from ADMIN-PC, SSH to KN-R1, <code>enable</code>, and check the facts — <code>show ip interface brief</code> and <code>show running-config | section interface GigabitEthernet0/1</code>: what prefix is the admin LAN really? Fix the permit line by its sequence number (you're editing the list that let you in — your current session stays up), read <code>show access-lists VTY-ADMINS</code>, save with <code>copy running-config startup-config</code> and <code>exit</code>", done:B=>{ const e=B.devs.kn.env, A=window.ACL; return e.lines.vty.acl==="VTY-ADMINS" && A.check(e.acl,"VTY-ADMINS",{src:"10.70.99.20"},false).permit && !A.check(e.acl,"VTY-ADMINS",{src:"10.70.99.40"},false).permit && !A.check(e.acl,"VTY-ADMINS",{src:"10.70.10.25"},false).permit && Bench.tried(B,"ad2",/^\s*ssh\b/) && !!e.savedOnce; }},
    {text:"Prove it for Musa: ADMIN-LAP <code>ssh -l netadmin 10.70.99.1</code> and log in — then check STAFF-PC is still refused", done:B=>{ const e=B.devs.kn.env, A=window.ACL; return Bench.remoteTo(B,"ad2")==="10.70.99.1" && !A.check(e.acl,"VTY-ADMINS",{src:"10.70.10.25"},false).permit && e.lines.vty.acl==="VTY-ADMINS"; }},
  ],
  win:"The second finding is closed: only the admin LAN reaches KN-R1's login prompt, whichever router address it uses; staff get 'Connection refused' at once but can still ping their gateway. And the ticket showed why you check the device, not the document: the admin LAN had grown to a /27 (10.70.99.0 0.0.0.31), so the /28 wildcard locked out half the IT team until line 10 was replaced by sequence number.",
  solve:[["pc","st","ssh -l netadmin 10.70.10.1"],["pc","st","Kn0-Adm1n!"],["pc","st","exit"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Kn0-En4ble!"],["term","configure terminal"],
    ["term","ip access-list standard VTY-ADMINS"],["term","remark IT admin LAN only"],["term","permit 10.70.99.0 0.0.0.15"],["term","exit"],["term","line vty 0 4"],["term","access-class VTY-ADMINS in"],["term","end"],
    ["pc","st","ssh -l netadmin 10.70.10.1"],["pc","st","ping 10.70.10.1"],
    ["pc","ad","ssh -l netadmin 10.70.99.1"],["pc","ad","Kn0-Adm1n!"],["pc","ad","enable"],["pc","ad","Kn0-En4ble!"],["pc","ad","show users"],["pc","ad","exit"],
    ["pc","ad2","ssh -l netadmin 10.70.99.1"],["pc","ad2","ipconfig"],
    ["pc","ad","ssh -l netadmin 10.70.99.1"],["pc","ad","Kn0-Adm1n!"],["pc","ad","enable"],["pc","ad","Kn0-En4ble!"],["pc","ad","show ip interface brief"],["pc","ad","show running-config | section interface GigabitEthernet0/1"],
    ["pc","ad","configure terminal"],["pc","ad","ip access-list standard VTY-ADMINS"],["pc","ad","no 10"],["pc","ad","10 permit 10.70.99.0 0.0.0.31"],["pc","ad","end"],["pc","ad","show access-lists VTY-ADMINS"],["pc","ad","copy running-config startup-config"],["pc","ad",""],["pc","ad","exit"],
    ["pc","ad2","ssh -l netadmin 10.70.99.1"],["pc","ad2","Kn0-Adm1n!"],["pc","st","ssh -l netadmin 10.70.10.1"],["pc","ad2","exit"]]})}
${K.hint(`Task 2: a /28 is 255.255.255.240, so the wildcard is 0.0.0.15 (.0–.15). Task 4: ADMIN-LAP's mask is 255.255.255.224 — a /27, .0–.31 — and .20 is outside the /28. Inside <code>ip access-list standard VTY-ADMINS</code>, <code>no 10</code> removes the old line and <code>10 permit …</code> puts the corrected one back in the same place; <code>copy running-config startup-config</code> asks for a file name — press Enter for the default.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Catalyst switch, SW-ABJ3, has: ip access-list standard MGMT · 10 permit host 10.30.50.20 · 20 permit 10.30.200.0 0.0.0.63 — and access-class MGMT in under line vty 0 4 only. Line vty 5 15 has login local and transport input ssh, no access-class. Which two statements are true? (Choose two.)", o:["10.30.200.40 can open an SSH session on one of the first five VTY lines","10.30.200.70 is refused on vty 0 4 because it is outside 10.30.200.0–10.30.200.63","10.30.50.21 can never log in to SW-ABJ3 by SSH","access-class MGMT stops 10.30.200.70 pinging the switch","access-class MGMT also filters traffic the switch forwards between its ports"], a:[0,1], why:"1. What is asked? Which sources the VTY filter admits, and what it touches. 2. Which rule? access-class compares the source with the list (first match, implicit deny) only on the lines it is applied to, and only for logins. 3. Apply it: 0.0.0.63 covers .0–.63, so .40 is permitted and .70 refused on vty 0 4. 'Never' is wrong: vty 5 15 has no access-class, so once the first five lines are busy anyone with the password gets in on line 5 — apply MGMT under line vty 0 15. Pings and forwarded traffic are never checked by access-class."})}
${K.dodont([
  "Write the policy in one sentence first: who, to what, allowed or not.",
  "Specific lines first; end a filter with a permit for everyone else (or a deny you mean).",
  "Use named lists with a remark; edit single lines by sequence number.",
  "Test from a source that must be blocked AND one that must still work; record the counters.",
  "Apply access-class to every VTY range, with your own source permitted.",
],[
  "Don't type a mask where the wildcard goes.",
  "Don't apply a deny-only list to an interface.",
  "Don't delete and retype a live list to change one line.",
  "Don't put a standard list next to the source unless you mean &ldquo;nowhere beyond here&rdquo;.",
  "Don't change VTY access remotely without a way back in.",
])}

<h2>Interview corner</h2>
${K.hint(`Top down, first match, implicit deny — then one example of why order matters, and where it's applied.`)}
${K.reveal("“How does a router process an access list?”",`<p>"An ACL is an ordered list of permit and deny lines that acts only where it's applied — an interface with ip access-group, the VTY lines with access-class, or a feature like NAT. The router reads from the lowest sequence number down; the first matching line decides and nothing after it is read. No match means the implicit deny any drops it, so a filter needs at least one permit, and specific lines go first — a host denied after a permit for its subnet is never denied. I verify with show access-lists: the counters show which line is catching the traffic."</p>`)}
${K.hint(`What a standard list can see; what that means near the source versus near the destination; the trade-off.`)}
${K.reveal("“Where do you place a standard ACL, and why?”",`<p>"As close to the destination as possible. A standard list sees only the source, so it blocks that source from everything behind where it sits. Near the source, a line meant to keep contractors off the HR server also cuts them off from the intranet and the internet; outbound on the interface facing the HR LAN it affects only HR. The cost is that denied traffic crosses the network first — when that matters, or I need ports or destinations, I use an extended list near the source."</p>`)}
${K.hint(`Which command, which kind of list, what it filters and what it doesn't, how you avoid locking yourself out, how you test.`)}
${K.reveal("“How would you make sure only the admin team can SSH to a router?”",`<p>"On top of SSH-only and proper logins, I restrict the VTY lines with access-class: a standard ACL permitting the admin subnet — VTY-ADMINS, permit 10.70.99.0 0.0.0.31 — and access-class VTY-ADMINS in under every VTY range. It covers every address the device has and leaves transit traffic alone. Remotely, I permit my own source and set reload in 10 first. Then I test: an admin PC logs in, a staff PC gets Connection refused."</p>`)}

${K.recap([
  "An ACL acts only where it is used; as an interface filter (ip access-group) deny = drop. Router ACLs are stateless.",
  "Top down, first match wins, implicit deny any at the end (no counter): specific lines first, at least one permit.",
  "Wildcard: 0 = must match, 1 = don't care, 255.255.255.255 − mask; host / any; one line per aligned power-of-two block of subnets.",
  "Standard lists match the source only: 1–99, 1300–1999 or named; remarks; edit single lines by sequence number.",
  "in = arriving, before routing; out = leaving, after routing; one ACL per protocol, interface and direction; standard lists close to the destination.",
  "Verify: show ip interface, show access-lists counters (Windows ping +4, IOS ping +5), tests from a blocked and an allowed source.",
  "Blocked: Destination protocol unreachable from a router (Windows), U.U.U, !A; with no ip unreachables, time-outs.",
  "access-class N in under every line vty range restricts who may SSH/Telnet to the device; pings and transit traffic are untouched.",
])}
${K.next(`<b>Lesson 5 — ACLs part 2: extended lists.</b> Match protocols and ports as well as addresses — web yes, SSH no, ping logged — place them close to the source, edit and resequence named lists, read <code>%SEC-6-IPACCESSLOG</code> messages, and find out why an inbound list that forgets OSPF takes a neighbour down.`)}
`,
quiz:[
  {lvl:1, q:"A packet is compared with an applied ACL and matches none of its lines. What happens?", o:["It is forwarded, because no line denied it","It is dropped by the implicit deny any at the end of every ACL","It is compared with the next ACL on the interface","The router logs it and forwards it"], a:1, why:"Every IOS ACL ends with an invisible deny any. A packet that matches no configured line is dropped — and the implicit deny has no counter in show access-lists. There is only one ACL per interface per direction, so there is no 'next' list."},
  {lvl:1, q:"Which part of a packet does a standard IPv4 ACL match?", o:["Source and destination addresses","The source address only","The destination address and port","The protocol and source port"], a:1, why:"Standard lists (1–99, 1300–1999, or named standard) look only at the source address. Protocol, destination and ports need an extended list (lesson 5) — which is why a standard list must sit close to the destination."},
  {lvl:1, type:"fill", q:"Write the wildcard mask a standard ACL needs to match the subnet 10.40.8.64/26.", fields:[{label:"Wildcard", a:["0.0.0.63"]}], why:"A /26 mask is 255.255.255.192; 255.255.255.255 minus it is 0.0.0.63, covering 10.40.8.64 to 10.40.8.127."},
  {lvl:1, type:"match", q:"Match each IPv4 ACL number range with the kind of list it creates.", pairs:[["1–99","Standard"],["100–199","Extended"],["1300–1999","Standard (expanded range)"],["2000–2699","Extended (expanded range)"]], why:"Standard lists use 1–99 and the expanded 1300–1999; extended lists use 100–199 and 2000–2699. Named lists say standard or extended explicitly."},
  {lvl:2, q:"Based on the exhibit, list 30 is applied out on the interface facing the server LAN. Which source can reach the servers?", ex:"R4#show access-lists 30\nStandard IP access list 30\n    10 deny   192.168.8.0, wildcard bits 0.0.3.255 (41 matches)\n    20 permit 192.168.12.0, wildcard bits 0.0.0.255 (118 matches)\n    30 deny   192.168.13.7", o:["192.168.9.25","192.168.13.70","192.168.12.44","172.16.1.10"], a:2, why:"Line 10 covers 192.168.8.0–192.168.11.255, so 192.168.9.25 is denied there. 192.168.12.44 matches line 20 and is permitted. 192.168.13.70 is not 192.168.13.7 (a host line), and nothing else matches it, so it falls to the implicit deny — as does 172.16.1.10. There is no permit any: only 192.168.12.0/24 gets through."},
  {lvl:2, type:"multi", q:"Which two statements about ip access-group are true? (Choose two.)", o:["An interface can have one IPv4 ACL inbound and one outbound at the same time","A second ip access-group NAME in on the same interface replaces the first","Inbound ACLs are checked after the routing decision","An ACL must be created before ip access-group will accept its name","Outbound ACLs drop packets before they are routed"], a:[0,1], why:"One ACL per protocol, per interface, per direction: one in and one out, and a new one in the same direction replaces the old. Inbound lists are checked before routing, outbound after. IOS accepts a name that doesn't exist yet — and an applied list that doesn't exist permits everything."},
  {lvl:2, type:"order", q:"A packet from a PC arrives on R1's G0/1 and is routed out of G0/0. Both interfaces have ACLs. Put R1's steps in order.", items:["The packet arrives on G0/1","The inbound ACL on G0/1 is checked","R1 looks up the destination and chooses G0/0 as the exit","The outbound ACL on G0/0 is checked","The packet is sent out of G0/0"], why:"Inbound lists are checked as the packet arrives, before the routing lookup; outbound lists after the router knows the exit interface. A deny at either check drops the packet there."},
  {lvl:2, q:"Router R2 has G0/0 to the payroll LAN, G0/1 to the WAN and G0/2 to the printers. A standard ACL must stop 10.1.5.0/24 reaching payroll, while it can still print and use the WAN. Where should it be applied?", o:["R2 G0/1 in","R2 G0/0 out","R2 G0/0 in","On the router nearest 10.1.5.0/24, inbound on its LAN interface"], a:1, why:"Standard = close to the destination. Packets to payroll leave R2 through G0/0, so out on G0/0 catches only them. G0/1 in, or the source router's LAN, would also block printing and the WAN; G0/0 in sees only payroll's own packets."},
  {lvl:2, type:"fill", q:"Under line vty 0 4, write the command that allows SSH/Telnet sessions only from sources permitted by standard ACL 15.", fields:[{label:"Command", a:["access-class 15 in"], ios:true}], why:"access-class N in filters incoming VTY sessions by source address. ip access-group is the interface command; on a line it is access-class."},
  {lvl:2, q:"A user pings a server and gets the exhibit. What is the most likely cause?", ex:"C:\\Users\\ade>ping 10.20.50.10\n\nPinging 10.20.50.10 with 32 bytes of data:\nReply from 10.20.255.2: Destination protocol unreachable.\nReply from 10.20.255.2: Destination protocol unreachable.\nReply from 10.20.255.2: Destination protocol unreachable.\nReply from 10.20.255.2: Destination protocol unreachable.", o:["The server 10.20.50.10 is switched off","The router at 10.20.255.2 dropped the packets with an ACL and sent ICMP administratively-prohibited replies","There is no route to 10.20.50.0/24","The PC's default gateway is wrong"], a:1, why:"Replies come from a router, not the server, with the text Windows prints for ICMP unreachable code 13 (administratively prohibited). A missing route would show Destination host/net unreachable; a powered-off server on a routed LAN gives a time-out or host unreachable. Next: show ip interface and show access-lists on 10.20.255.2's router."},
  {lvl:2, q:"Which source address does deny 172.20.16.0 0.0.7.255 match?", o:["172.20.15.9","172.20.23.250","172.20.24.1","172.21.16.1"], a:1, why:"0.0.7.255 is a /21: eight values in the third octet starting at 16, so 172.20.16.0–172.20.23.255. 23.250 is inside; 15.9 and 24.1 are just outside; 172.21 changes a must-match octet."},
  {lvl:3, q:"Contractors (10.20.20.0/24) can still reach the payroll server after a change. Based on the exhibit from the router whose G0/0 faces the payroll LAN, what is the fix?", ex:"PAY-R1#show ip interface g0/0 | include access list\n  Outgoing Common access list is not set\n  Outgoing access list is not set\n  Inbound Common access list is not set\n  Inbound  access list is NO-CONTRACTORS\nPAY-R1#show access-lists NO-CONTRACTORS\nStandard IP access list NO-CONTRACTORS\n    10 deny   10.20.20.0, wildcard bits 0.0.0.255\n    20 permit any (312 matches)", o:["Change line 10's wildcard to 255.255.255.0","Move the list: no ip access-group NO-CONTRACTORS in, then ip access-group NO-CONTRACTORS out on G0/0","Add deny any as line 30","Apply the list inbound on the contractors' router instead"], a:1, why:"The list is right but faces the wrong way. Contractors' packets to payroll leave through G0/0; inbound on G0/0 the list only sees the payroll servers' own packets, so line 10 never matches and line 20 counts the servers (312). Outbound on G0/0 it sees exactly the traffic to protect. A mask in place of the wildcard would break line 10; a deny any would block everyone; the contractors' router would block them from everything."},
  {lvl:3, q:"An Enugu school router is the DHCP server for 10.60.0.0/22. After an inbound standard ACL with the single line permit 10.60.0.0 0.0.3.255 was put on the LAN interface, laptops with unexpired leases keep working, but every new laptop gets 169.254.x.x. What is the cause and fix?", o:["The pool is exhausted; shorten the lease","New laptops' Discovers come from 0.0.0.0, match no line and hit the implicit deny; insert permit host 0.0.0.0 before line 10","The wildcard should be 0.0.0.255","Outbound ACLs block DHCP Offers; move the list outbound"], a:1, why:"A client with no address sends its Discover from 0.0.0.0, which 10.60.0.0 0.0.3.255 doesn't cover, so the implicit deny drops it before the router's DHCP server sees it. Leased laptops renew by unicast from their own 10.60.x.x address, which line 10 permits. 5 permit host 0.0.0.0 lets first-time clients in. The wildcard is right for a /22."},
  {lvl:3, type:"multi", q:"KN-R1 has line vty 0 4 with access-class VTY-ADMINS in, and VTY-ADMINS is: 10 permit 10.70.99.0 0.0.0.15. Which two hosts can open an SSH session to KN-R1? (Choose two.)", o:["10.70.99.5","10.70.99.14","10.70.99.20","10.70.10.25","10.70.99.31"], a:[0,1], why:"0.0.0.15 covers 10.70.99.0–10.70.99.15, so .5 and .14 match line 10. .20 and .31 are in the /27 admin LAN but outside the /28 the list describes — they are refused, which is exactly the Kano ticket. 10.70.10.25 matches nothing and hits the implicit deny."},
  {lvl:3, q:"You are connected by SSH from 10.80.5.9 to a remote branch router and must restrict its VTY lines to the admin LAN 10.70.99.0/27. What is the safest sequence?", o:["Apply access-class first, then build the list, so there is no gap","Build the list with 10.70.99.0 0.0.0.31 and permit host 10.80.5.9, set reload in 10, apply access-class to every VTY range, test a new SSH session from your source, then reload cancel and save","Use ip access-group on every interface instead, because access-class can lock you out","Delete the VTY passwords first so the ACL is the only control"], a:1, why:"Make sure your own source is permitted before the filter goes live, keep a way back (reload in 10 reverts to the saved config if you are locked out), cover all VTY ranges, prove a fresh session works, then cancel the reload and save. Applying an empty or wrong list first, or removing logins, creates the very gaps you are trying to avoid."},
],
cards:[
  {f:"ACL — what it is", b:"An ordered list of permit/deny lines. It does nothing until a feature uses it: ip access-group (interface filter: deny = drop), access-class (VTY logins), NAT, SNMP communities."},
  {f:"ACL processing logic", b:"Top down by sequence number; the first matching line decides and the rest are never read; no match = implicit deny any (not shown, not counted). Every filter needs at least one permit."},
  {f:"Wildcard masks", b:"0 = must match, 1 = don't care. Subnet wildcard = 255.255.255.255 − mask (/24 → 0.0.0.255, /27 → 0.0.0.31, /22 → 0.0.3.255). host A = A 0.0.0.0; any = 0.0.0.0 255.255.255.255."},
  {f:"One line for several subnets", b:"Only if they form one aligned block: a power-of-two count starting on a multiple of that count. 172.16.30.0 + 31.0 = 172.16.30.0 0.0.1.255; 10.20.4.0–10.20.7.255 = 10.20.4.0 0.0.3.255."},
  {f:"Mask instead of wildcard", b:"permit 10.1.3.0 255.255.255.0 is stored as 0.0.0.0 wildcard 255.255.255.0: matches only addresses ending in .0. ACLs never invert it for you. Read lists back with show access-lists."},
  {f:"Standard ACL numbers and syntax", b:"1–99 and 1300–1999. access-list N permit|deny|remark …, or ip access-list standard NAME → (config-std-nacl)# [seq] permit|deny|remark …. Matches the source address only."},
  {f:"Editing by sequence number", b:"Inside ip access-list standard NAME|N: 15 permit host … inserts between 10 and 20; no 15 removes it. no access-list N deletes the whole numbered list."},
  {f:"Direction in / out", b:"Router's view. in = arriving on that interface, checked before routing (sees traffic to the router too). out = leaving through it, checked after routing. One ACL per protocol, per interface, per direction."},
  {f:"Standard ACL placement", b:"Close to the destination: it sees only the source, so it blocks that source from everything behind where it sits. Extended (lesson 5): close to the source."},
  {f:"Verifying an ACL", b:"show ip interface X (Inbound/Outgoing access list is …), show access-lists (per-line counters: Windows ping +4, IOS ping +5), clear access-list counters [NAME], a test from a blocked and an allowed source."},
  {f:"What a blocked user sees", b:"ICMP unreachable code 13 (administratively prohibited): Windows ping 'Reply from <router>: Destination protocol unreachable.', tracert 'reports: …', IOS ping U.U.U, traceroute !A. With no ip unreachables: time-outs."},
  {f:"access-class on VTY lines", b:"ip access-list standard VTY-ADMINS · permit <admin LAN> <wildcard> · line vty 0 4 (0 15 on switches) · access-class VTY-ADMINS in. Refused: 'Connection refused'. Pings and transit traffic unaffected."},
],
});

// ---------- Module 8 · Lesson 5 ----------
L.push({
id:"sec-acl-ext", mins:115, level:"Intermediate · builds on lesson 4",
t:"Extended ACLs: filter by protocol and port, place them near the source, and troubleshoot what they break",
html:`
${K.goals([
  "Turn a written traffic policy into extended ACL lines with the right protocol, addresses, ports and order.",
  "Use port operators (<code>eq neq lt gt range</code>), IOS port names, ICMP types and <code>established</code>, and say exactly what each matches.",
  "Edit named and numbered lists with sequence numbers, remarks and <code>ip access-list resequence</code>, and read <code>%SEC-6-IPACCESSLOG…</code> messages from the <code>log</code> keyword.",
  "Place an extended ACL near the source and predict its effect on the router's own traffic: DHCP, SSH, OSPF hellos, its own pings.",
  "Troubleshoot from evidence: wrong direction, wrong order, a field too broad or too narrow, missing return traffic, a forgotten <code>permit ospf</code>.",
])}
${K.pre(["Lesson 4: first match, the implicit <code>deny any</code>, wildcards, standard lists, direction, <code>ip access-group</code>, <code>show access-lists</code>, <code>show ip interface</code>, and what a blocked user sees.","Module 1: TCP, UDP, ports, the three-way handshake, ICMP. Module 5: OSPF neighbours. Module 7: DHCP, DNS, syslog. Module 2: SSH."])}

<h2>Why this matters at work</h2>
<p>Tuesday at a fintech in Victoria Island, Lagos. The auditors' report has one red line: &ldquo;Any staff PC can reach the loan database server on any port.&rdquo; Your manager writes the policy on the whiteboard: staff may <b>browse</b> the loan portal, the <b>admin PC alone</b> may SSH to the server router, everyone may <b>ping</b> the servers, and the PCs must still get <b>addresses from DHCP</b>. Everything else is refused, and the refusals are logged.</p>
<p>Lesson 4's standard ACL can't write that: it sees only the source. An <b>extended ACL</b> also sees the destination, protocol and port, so one list can let a PC browse a server while refusing SSH to it. That precision breaks things too: a forgotten DHCP line puts every PC on 169.254, a missing <code>permit ospf</code> takes a branch off the map, a port on the wrong side blocks the very service you meant to allow. This lesson builds extended lists, places them, and fixes them from evidence.</p>

<h2>What an extended ACL matches: protocol, source, destination</h2>
${K.remember(`<b>The rule in one line:</b> an extended ${K.g("ACE","Access Control Entry: one permit or deny line in an access list. A list is a sequence of ACEs, checked top-down.")} names a <b>protocol</b>, a <b>source</b> and a <b>destination</b> (and, for TCP and UDP, optionally ports). <b>Every field on the line must match</b> for the line to match; the list is still read top-down and the <b>first matching line decides</b>, with the implicit <code>deny any</code> after the last line (lesson 4).`)}
<p>A standard ACL asks <i>who sent this?</i> An extended ACL asks up to five questions — source address, destination address, protocol, source port, destination port — often called the ${K.g("5-tuple","The five values that identify a conversation: source IP, destination IP, protocol, source port and destination port. Firewalls and extended ACLs filter on them.")}.</p>
${K.analogy(`<p>A standard ACL is a guard who checks only your ID card. An extended ACL is a receptionist with a visitor list: <i>who</i> you are, <i>which floor</i> and <i>which meeting room</i>. &ldquo;Chidi: floor 6, room 2&rdquo; opens that one room — not floor 6's other rooms, not room 2 elsewhere.</p>`)}
${K.svg("0 0 760 250",
  K.txt(20,22,"One extended ACE, read left to right",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(20,44,"access-list 110 permit tcp 10.20.30.0 0.0.0.255 host 10.20.99.10 eq 443",{c:"accent",s:12})+
  K.box(20,62,96,54,"110","list number")+K.box(122,62,80,54,"permit","action")+K.box(208,62,70,54,"tcp","protocol")+
  K.box(284,62,176,54,"10.20.30.0 0.0.0.255","source + wildcard",true)+K.box(466,62,150,54,"host 10.20.99.10","destination",true)+K.box(622,62,118,54,"eq 443","destination port",true)+
  K.txt(20,142,"protocol: ip (everything) · icmp · tcp · udp · ospf — or a protocol number (TCP 6, UDP 17, OSPF 89)",{c:"fg",s:11,f:"body"})+
  K.txt(20,162,"addresses: any · host A.B.C.D · address + wildcard — source AND destination are both always written",{s:11,f:"body"})+
  K.txt(20,182,"ports (tcp and udp only): eq · neq · lt · gt · range — after the source = source port, after the destination = destination port",{s:11,f:"body"})+
  K.txt(20,202,"optional tail: an ICMP type (icmp lines) · established (tcp lines) · log",{s:11,f:"body"})+
  K.txt(20,232,"All fields on one line must match (AND). Lines are tried top-down and the first match decides (lesson 4).",{c:"fg",s:11.5,f:"body"}),
  "Anatomy of an extended ACE: &ldquo;the accounting LAN may open HTTPS sessions to the server 10.20.99.10&rdquo;.")}
<h3>The parts, one at a time</h3>
<ul>
<li><b>Number or name.</b> Numbered extended lists use <b>100–199</b> and <b>2000–2699</b> (standard: 1–99 and 1300–1999). Named lists use <code>ip access-list extended NAME</code>.</li>
<li><b>Protocol.</b> <code>ip</code> means <i>any IPv4 packet</i> — TCP, UDP, ICMP, OSPF and the rest. <code>icmp</code>, <code>tcp</code>, <code>udp</code>, <code>ospf</code> or a protocol number narrow it.</li>
<li><b>Source, then destination</b>, each as <code>any</code>, <code>host A.B.C.D</code> or an address with a wildcard (lesson 4).</li>
<li><b>Ports, ICMP types, established, log</b> — the next two sections.</li>
</ul>
<h3>Worked example: from a policy to lines</h3>
<p>The Abuja office of a payments company. Accounting is 10.20.30.0/24; the server farm 10.20.99.0/24, where 10.20.99.10 is the finance web app (HTTP and HTTPS). <b>Policy:</b> Accounting may use the web app, may ping anything, may reach nothing else in the server farm, and may reach everything outside it.</p>
${K.steps([
  ["1 · Write each sentence as source → destination, protocol, port", "web app: 10.20.30.0/24 → host 10.20.99.10, TCP 80 and TCP 443 · ping: 10.20.30.0/24 → any, ICMP echo · server farm: 10.20.30.0/24 → 10.20.99.0/24, any protocol, <b>deny</b> · the rest: anything → anything, <b>permit</b>."],
  ["2 · Order them: specific before general", "The web-app permits go <b>before</b> the server-farm deny: 10.20.99.10 is inside 10.20.99.0/24 and the first match decides. The catch-all permit goes last, or the implicit deny would block the internet too."],
  ["3 · Translate and place", "A /24 is <code>0.0.0.255</code>, one address is <code>host</code>, the server's port goes <b>after the destination</b>. Apply it inbound on the interface facing Accounting — near the source: <code>interface g0/0</code>, <code>ip access-group 110 in</code> (lesson 4)."],
])}
${K.out(`ABJ-R1(config)#access-list 110 permit tcp 10.20.30.0 0.0.0.255 host 10.20.99.10 eq 80
ABJ-R1(config)#access-list 110 permit tcp 10.20.30.0 0.0.0.255 host 10.20.99.10 eq 443
ABJ-R1(config)#access-list 110 permit icmp 10.20.30.0 0.0.0.255 any echo
ABJ-R1(config)#access-list 110 deny ip 10.20.30.0 0.0.0.255 10.20.99.0 0.0.0.255
ABJ-R1(config)#access-list 110 permit ip any any
ABJ-R1(config)#do show access-lists
Extended IP access list 110
    10 permit tcp 10.20.30.0 0.0.0.255 host 10.20.99.10 eq www
    20 permit tcp 10.20.30.0 0.0.0.255 host 10.20.99.10 eq 443
    30 permit icmp 10.20.30.0 0.0.0.255 any echo
    40 deny ip 10.20.30.0 0.0.0.255 10.20.99.0 0.0.0.255
    50 permit ip any any`, "Typed as numbers, shown by IOS with sequence numbers 10, 20, 30… and port 80 rewritten as its name, www. (Lab output; real IOS prints the same lines.)")}
<p>Read it like the router does. 10.20.30.44 opening <code>https://10.20.99.10</code> (TCP 443): line 10 fails on the port, line 20 permits. The same PC opening Remote Desktop to 10.20.99.25 (TCP 3389): line 40 denies. 10.20.40.7 from <i>another</i> department to 10.20.99.25: lines 10–40 need a 10.20.30.x source, so line 50 permits it — this list controls Accounting only.</p>
${K.mistake(`Writing a bare address in an extended list: <code>access-list 110 permit ip 10.20.30.5 any</code> gets <code>% Invalid input detected</code>. Standard lists accept a bare address; extended lists want <code>host 10.20.30.5</code>.`)}
${K.check({q:"The 10.5.5.0/24 LAN may use only the web service (TCP 80) on server 10.5.9.9. Which line does that?", o:["access-list 120 permit tcp 10.5.5.0 0.0.0.255 eq 80 host 10.5.9.9","access-list 120 permit tcp 10.5.5.0 0.0.0.255 host 10.5.9.9 eq 80","access-list 120 permit udp 10.5.5.0 0.0.0.255 host 10.5.9.9 eq 80","access-list 120 permit ip 10.5.5.0 0.0.0.255 host 10.5.9.9"], a:1, why:"Web is TCP, and the server's port is the destination port, so eq 80 goes after the destination. Option A matches packets FROM port 80 (clients use ephemeral source ports, so it never matches a request); C is UDP; D permits every protocol and port to the server."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A hospital in Port Harcourt uses 172.16.0.0/16. Match each line with the traffic it matches.", pairs:[
  ["permit tcp any host 172.16.5.9 eq 25","Mail (SMTP) sent to the server 172.16.5.9 from anywhere"],
  ["permit udp 172.16.0.0 0.0.255.255 any eq 53","DNS queries from any 172.16.x.x host to any DNS server"],
  ["permit icmp host 172.16.1.1 any echo","Pings sent by 172.16.1.1 only"],
  ["deny ip 172.16.8.0 0.0.3.255 any","Every packet from 172.16.8.0 to 172.16.11.255"],
  ["permit ospf any any","OSPF routing packets (IP protocol 89)"]],
  why:"1. What is asked? Which packets each line matches. 2. Which rule? Read protocol, source, destination, then the port or type: every field must match. 3. Apply it: TCP to host 172.16.5.9 port 25 is SMTP to that server; UDP from 172.16.0.0/16 to any, port 53, is DNS; ICMP echo from one host is its pings; wildcard 0.0.3.255 covers four third-octet values (8–11) and ip covers every protocol; ospf is protocol 89."})}

<h2>Ports, operators, ICMP types and established</h2>
${K.remember(`<b>The rule:</b> a port written <b>after the source</b> is the source port; a port written <b>after the destination</b> is the destination port. A server listens on a <b>well-known port</b>; a client sends from a random <b>ephemeral port</b>. So &ldquo;traffic <i>to</i> a service&rdquo; means <b>destination port = the service</b>, and the server's replies come back <b>from</b> that port.`)}
<p>A conversation is two ${K.g("sockets","An IP address plus a port number, e.g. 192.168.60.20:80. A conversation is a pair of sockets.")} (Module 1): the browser sends from a free high port (51000) to port 80; the server answers from 80 to 51000. An ACL sees each packet on its own, in the direction it travels.</p>
${K.svg("0 0 760 320",
  K.dev("pc",80,46,"PC-ADMIN","192.168.20.10")+K.dev("server",680,46,"LOANS-WEB","192.168.60.20")+
  K.link(80,104,80,262,"",true)+K.link(680,104,680,262,"",true)+
  K.arrow(84,130,676,130,"1 · SYN — the client opens the conversation",true)+
  K.txt(380,150,"src 192.168.20.10 : 51000 (ephemeral)  →  dst 192.168.60.20 : 80 (www)",{mid:true,s:10.5})+
  K.txt(380,170,"matched by: permit tcp 192.168.20.0 0.0.0.255 host 192.168.60.20 eq www",{mid:true,s:10.5,c:"accent"})+
  K.arrow(676,210,84,210,"2 · SYN-ACK — the server answers (ACK bit set)")+
  K.txt(380,230,"src 192.168.60.20 : 80  →  dst 192.168.20.10 : 51000",{mid:true,s:10.5})+
  K.txt(380,250,"matched by: permit tcp host 192.168.60.20 eq www 192.168.20.0 0.0.0.255 established",{mid:true,s:10.5,c:"accent"})+
  K.txt(380,286,"The server's port is the DESTINATION port going there and the SOURCE port coming back,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,306,"so the port goes after whichever address is the server in that direction.",{mid:true,s:11,f:"body"}),
  "One web conversation, two directions. Each arrow is checked separately by any ACL it passes.")}
<h3>The five port operators</h3>
<div class="tablewrap"><table>
<tr><th>Operator</th><th>Matches</th><th>Example</th></tr>
<tr><td><code>eq</code></td><td>exactly this port — the usual one</td><td><code>eq 443</code></td></tr>
<tr><td><code>neq</code></td><td>any port except this one</td><td><code>neq 23</code></td></tr>
<tr><td><code>lt</code> · <code>gt</code></td><td>lower than · greater than</td><td><code>lt 1024</code> (well-known) · <code>gt 1023</code> (client ports, incl. every ephemeral one)</td></tr>
<tr><td><code>range</code></td><td>from–to, inclusive</td><td><code>range 20 21</code> (FTP)</td></tr>
</table></div>
<h3>Port names, and TCP or UDP</h3>
<p>IOS accepts names for well-known ports and <b>shows numbers as names</b> whether you typed the name or not:</p>
<div class="tablewrap"><table>
<tr><th>Service</th><th>Protocol and port</th><th>IOS shows</th></tr>
<tr><td>Web</td><td>TCP 80 · TCP 443</td><td><code>www</code> · <code>443</code> (no keyword)</td></tr>
<tr><td>SSH · Telnet</td><td>TCP 22 · TCP 23</td><td><code>22</code> (no keyword) · <code>telnet</code></td></tr>
<tr><td>DNS</td><td><b>UDP</b> 53 (TCP 53 for large answers)</td><td><code>domain</code></td></tr>
<tr><td>DHCP</td><td>UDP 67 server · UDP 68 client</td><td><code>bootps</code> · <code>bootpc</code></td></tr>
<tr><td>NTP · SNMP · syslog · TFTP</td><td>UDP 123 · 161 · 514 · 69</td><td><code>ntp snmp syslog tftp</code></td></tr>
</table></div>
<p>Notice how many services are <b>UDP</b>: a <code>tcp</code> line never matches DNS lookups, DHCP, NTP or SNMP.</p>
${K.dyk(`Type <code>eq 80</code> and IOS stores <code>eq www</code>; <code>range 20 21</code> reads back as <code>range ftp-data ftp</code>. In an exhibit, <code>www</code>, <code>domain</code> and <code>bootps</code> are 80, 53 and 67, while 22 and 443 stay digits.`)}
${K.mistake(`Putting the server's port after the <b>source</b>: <code>permit tcp 10.50.1.0 0.0.0.255 eq 443 host 10.50.9.30</code> means &ldquo;<i>from</i> port 443&rdquo;. Clients send from ephemeral ports, so the line never matches a request and its counter stays at 0. Ask: <i>which device listens?</i> Its port goes after <i>its</i> address.`)}
<h3>ICMP types: name the message, not just the protocol</h3>
<p>${K.g("ICMP","Internet Control Message Protocol (Module 1): ping, error reports such as unreachable and time exceeded. IP protocol 1.")} carries many messages, each with a <b>type</b>. An <code>icmp</code> line with no type matches them all; a type name matches one:</p>
<div class="tablewrap"><table>
<tr><th>IOS keyword</th><th>Type / code</th><th>What it is</th></tr>
<tr><td><code>echo</code> · <code>echo-reply</code></td><td>8 · 0</td><td>a ping request · the answer, travelling <b>back</b></td></tr>
<tr><td><code>time-exceeded</code></td><td>11</td><td>&ldquo;TTL expired in transit&rdquo; — each traceroute hop's answer</td></tr>
<tr><td><code>unreachable</code></td><td>3</td><td>destination unreachable, all codes (IOS traceroute's last hop sends port unreachable)</td></tr>
<tr><td><code>administratively-prohibited</code></td><td>3 / 13</td><td>&ldquo;an ACL dropped your packet&rdquo; (lesson 4)</td></tr>
<tr><td><code>packet-too-big</code></td><td>3 / 4</td><td>&ldquo;fragmentation needed&rdquo;, used by ${K.g("path MTU discovery","How a sender learns the largest packet a path can carry: a router that must drop a too-big packet sends ICMP 'fragmentation needed'. Block that message and large transfers can hang while small ones work.")}</td></tr>
</table></div>
<p>Windows <code>tracert</code> sends echoes with rising TTLs: routers answer <b>time-exceeded</b>, the destination <b>echo-reply</b>. IOS <code>traceroute</code> sends UDP probes, answered by time-exceeded and finally port unreachable. Let <code>echo-reply</code> back but not <code>time-exceeded</code>, and pings work while traceroute shows <code>*</code> — the second bench shows it.</p>
<h3>established: let TCP replies in, not new sessions</h3>
<p>Every TCP segment after the opening SYN has the ${K.g("ACK","Acknowledgement flag in the TCP header (Module 1). Set on every segment of a connection except the very first SYN.")} flag set (or ${K.g("RST","Reset flag in the TCP header: 'abort this connection'. A host sends it to refuse or kill a connection.")}). On a <code>tcp</code> line, <code>established</code> matches only segments with ACK or RST set: <b>replies and the rest of a conversation</b>, never the SYN that <i>starts</i> one.</p>
${K.out(`ip access-list extended FROM-INTERNET
 10 permit tcp any 192.168.1.0 0.0.0.255 established`, "Inbound on an internet-facing interface: replies get in; a SYN from outside hits the implicit deny.")}
<ul>
<li><b>It gives you:</b> inside users open sessions outwards; nobody outside can open a TCP session inwards.</li>
<li><b>It does not</b> keep any record of who opened what — it reads a flag, so a packet crafted with ACK set passes. And it is <b>TCP only</b>: DNS replies (UDP) and ping replies (ICMP) need their own lines.</li>
<li><b>The real tool</b> is a ${K.g("stateful firewall","A firewall that records each connection an inside host opens and lets in only the matching replies (Module 1). Cisco IOS has one built in, the Zone-Based Firewall — beyond CCNA.")}, which remembers every conversation.</li>
</ul>
${K.check({q:"An internet-facing interface has only this inbound ACL: permit tcp any 192.168.1.0 0.0.0.255 established. Inside users browse by name, using a DNS server on the internet. What happens?", o:["Everything works: replies are permitted","Web pages by IP address load, but name lookups fail, because DNS replies are UDP and established matches TCP only","Nothing works, because established blocks every SYN including the users' own","Pings work but web doesn't"], a:1, why:"The users' own SYNs leave through the other interface; the SYN-ACKs and later segments carry ACK, so they match. DNS answers come back as UDP from port 53 and match nothing — implicit deny. Ping replies (ICMP echo-reply) are dropped too. The fix is a UDP line for the DNS replies, or a stateful firewall."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"Router KN-R1 (address 10.9.1.1) may be polled by SNMP (UDP 161) only from the monitoring server 10.9.0.50. Write the one numbered line for extended list 130 that permits exactly that.", fields:[{label:"ACE", a:["access-list 130 permit udp host 10.9.0.50 host 10.9.1.1 eq 161","access-list 130 permit udp host 10.9.0.50 host 10.9.1.1 eq snmp","access-list 130 permit udp 10.9.0.50 0.0.0.0 host 10.9.1.1 eq 161","access-list 130 permit udp 10.9.0.50 0.0.0.0 host 10.9.1.1 eq snmp","access-list 130 permit udp host 10.9.0.50 10.9.1.1 0.0.0.0 eq 161","access-list 130 permit udp host 10.9.0.50 10.9.1.1 0.0.0.0 eq snmp","access-list 130 permit udp 10.9.0.50 0.0.0.0 10.9.1.1 0.0.0.0 eq 161","access-list 130 permit udp 10.9.0.50 0.0.0.0 10.9.1.1 0.0.0.0 eq snmp"], ios:true}], why:"1. What is asked? One line: protocol, source, destination, port. 2. Which rule? SNMP polls are UDP to port 161 on the agent; the agent is the destination, so eq 161 goes after the destination; single addresses use host. 3. Apply it: access-list 130 permit udp host 10.9.0.50 host 10.9.1.1 eq 161 (IOS shows eq snmp). A tcp line would never match SNMP."})}

${K.drill({title:"extended ACL — which line matches first?", types:["aclmatchext"], count:5})}
<h2>Named lists, sequence numbers, remarks and the log keyword</h2>
${K.remember(`<b>The rule:</b> every ACE has a <b>sequence number</b> (10, 20, 30… by default), and the list is checked in that order. Inside <code>ip access-list extended NAME</code> you can <b>insert</b> (<code>15 permit …</code>) and <b>delete one line</b> (<code>no 20</code>); the global command <code>ip access-list resequence NAME 10 10</code> <b>renumbers</b>. The change takes effect <b>immediately</b> on every interface using the list — no re-apply.`)}
<p><code>ip access-list extended STAFF-IN</code> puts you in <code>(config-ext-nacl)#</code>. A line typed without a number goes to the end (10 more than the last); with a number first, it goes exactly there:</p>
${K.out(`LAG-R1(config)#ip access-list extended STAFF-IN
LAG-R1(config-ext-nacl)#remark staff may browse the loan portal
LAG-R1(config-ext-nacl)#permit tcp 192.168.20.0 0.0.0.255 host 192.168.60.20 eq www
LAG-R1(config-ext-nacl)#5 permit udp any any eq bootps
LAG-R1(config-ext-nacl)#20 permit tcp any any
% Duplicate sequence number
%Failed to add ace to access-list
LAG-R1(config-ext-nacl)#end
LAG-R1#show access-lists STAFF-IN
Extended IP access list STAFF-IN
    5 permit udp any any eq bootps
    10 permit tcp 192.168.20.0 0.0.0.255 host 192.168.60.20 eq www`, "Line 5 was inserted above line 10. A number already in use is refused. Remarks don't appear in show access-lists — only in the running-config.")}
<h3>Edit numbered lists the same way</h3>
<p>Numbered lists edit the same way: <code>ip access-list extended 110</code>, then <code>25 deny tcp any any eq telnet</code> lands between 20 and 30. (IOS XE stores numbered lists in the running-config as numbered <code>ip access-list extended 110</code> blocks.)</p>
${K.mistake(`Removing one line with <code>no access-list 110 deny tcp any any eq telnet</code>. On IOS, <b>any</b> <code>no access-list 110 …</code> deletes the <b>whole list</b> — and an applied list that doesn't exist permits everything. Delete one line by number: <code>ip access-list extended 110</code>, <code>no 25</code>.`)}
<h3>Resequencing, and remarks</h3>
<p>When inserts use up the gaps, <code>ip access-list resequence STAFF-IN 10 10</code> renumbers from 10 in steps of 10, keeping order and counters. A ${K.g("remark","A comment line in an ACL (remark text). Stored in the running-config, never matched, not shown by show access-lists.")} documents <i>why</i> a line exists (&ldquo;ticket 4471: HQ jump host&rdquo;).</p>
${K.tip(`Build a list <b>before</b> you apply it. An applied list that is empty permits everything; the moment it has one line, the implicit <code>deny any</code> is live behind it — typing a ten-line policy into an applied list drops traffic in between. For risky remote changes, type <code>reload in 10</code> first: the router reboots to its saved config in ten minutes unless you type <code>reload cancel</code>.`)}
<h3>The log keyword: evidence of what was dropped</h3>
<p>Add <code>log</code> to a line and each match produces a syslog message (Module 7) with the list, action, protocol, addresses and, for TCP/UDP, ports:</p>
${K.out(`LAG-R1#show logging | include SEC
*Oct 12 08:32:06.466: %SEC-6-IPACCESSLOGP: list STAFF-IN denied tcp 192.168.20.21(51000) -> 192.168.60.1(22), 1 packet
*Oct 12 08:32:13.603: %SEC-6-IPACCESSLOGDP: list STAFF-IN denied icmp 192.168.20.21 -> 192.168.20.1 (8/0), 1 packet`, "From this lesson's first bench. The source port is in brackets; (8/0) is ICMP type 8, an echo request.")}
<p>The ending tells you the kind: <code>…LOGP</code> = TCP/UDP with ports, <code>…LOGDP</code> = ICMP with type/code, <code>…LOGNP</code> = other protocols (OSPF and the rest) by number, <code>…LOGS</code> = a standard list (source only). Severity 6 is <i>informational</i>, so a <code>logging trap</code> level below 6 won't send them to the syslog server. Two habits:</p>
<ul>
<li><b>End important lists with an explicit <code>deny ip any any log</code>.</b> The implicit deny has no counter and logs nothing; an explicit one does both without changing what the list does.</li>
<li><b>Don't log busy permit lines</b> — logging costs router CPU. Log denies, investigate, then remove the <code>log</code>.</li>
</ul>
${K.dyk(`Real IOS rate-limits ACL logging: the <b>first</b> matching packet is logged at once, then matches are summed and reported about every <b>five minutes</b> (&ldquo;… 37 packets&rdquo;). The lab writes one line per test so you can see each one.`)}
<h3>Try it: guest Wi-Fi at an Abuja co-working space</h3>
<p>Guest VLAN 10.70.8.0/24 on ABJ-GW's G0/2; the company's networks are all in 10.0.0.0/8. <b>Policy:</b> guests get DHCP from this router, may use the internal DNS resolver 10.70.1.53 and nothing else internal (logged), and may browse (80, 443) anywhere else. Then the manager adds internet pings.</p>
${K.term({env:"ios2", title:"ABJ-GW — build, edit and apply a guest ACL", opts:{kind:"router", host:"ABJ-GW", model:"ISR 1100", motd:"ABJ-GW — console session (lab router, no enable secret). G0/2 = guest VLAN 10.70.8.0/24."},
  setup:env=>{ env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. Write the policy as lines on paper first — the order matters.",
  tasks:[
    {text:"Guest interface: <code>interface g0/2</code>, <code>ip address 10.70.8.1 255.255.255.0</code>, <code>no shutdown</code>, <code>exit</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/2"]; return i.ip==="10.70.8.1" && i.mask==="255.255.255.0" && !i.shut; }},
    {text:"<code>ip access-list extended GUEST-IN</code>, then five lines in this order: DHCP (<code>permit udp any any eq bootps</code>); DNS to the resolver only (<code>permit udp 10.70.8.0 0.0.0.255 host 10.70.1.53 eq domain</code>); everything else internal denied and logged (<code>deny ip 10.70.8.0 0.0.0.255 10.0.0.0 0.255.255.255 log</code>); then web to anywhere (<code>permit tcp 10.70.8.0 0.0.0.255 any eq www</code> and the same with <code>eq 443</code>)", done:e=>{ const s=(window.ACL.show(e.acl,"GUEST-IN")||"").split("\n").slice(1).map(x=>x.trim().replace(/^\d+\s+/,"")); const i=t=>s.indexOf(t);
      const a=i("permit udp any any eq bootps"), b=i("permit udp 10.70.8.0 0.0.0.255 host 10.70.1.53 eq domain"), c=i("deny ip 10.70.8.0 0.0.0.255 10.0.0.0 0.255.255.255 log"), d=i("permit tcp 10.70.8.0 0.0.0.255 any eq www"), f=i("permit tcp 10.70.8.0 0.0.0.255 any eq 443");
      return a>-1 && b>a && c>b && d>c && f>c; }},
    {text:"The manager's addition: guests may ping the internet but not inside. Insert <code>permit icmp 10.70.8.0 0.0.0.255 any echo</code> with a sequence number that puts it <b>below</b> the internal deny (why below?)", done:e=>{ const s=(window.ACL.show(e.acl,"GUEST-IN")||"").split("\n").slice(1).map(x=>x.trim().replace(/^\d+\s+/,"")); const c=s.indexOf("deny ip 10.70.8.0 0.0.0.255 10.0.0.0 0.255.255.255 log"), p=s.indexOf("permit icmp 10.70.8.0 0.0.0.255 any echo"); return c>-1 && p>c; }},
    {text:"Tidy the numbering: <code>exit</code> to global configuration and <code>ip access-list resequence GUEST-IN 10 10</code>", done:e=>{ const l=e.acl.lists["GUEST-IN"]; return !!l && l.entries.filter(x=>!x.remark).map(x=>x.seq).join()==="10,20,30,40,50,60"; }},
    {text:"Apply it inbound on the guest interface: <code>interface g0/2</code>, <code>ip access-group GUEST-IN in</code>", done:e=>e.intfs["GigabitEthernet0/2"].aclIn==="GUEST-IN"},
    {text:"<code>end</code>, then verify with <code>show access-lists GUEST-IN</code> and <code>show ip interface g0/2</code> (find the Inbound access list line)", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+(ip\s+)?acc\S*/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+g\S*\s*0\/2/i.test(h))},
  ],
  win:"A guest policy in six ordered lines: DHCP first (the guests' Discover arrives on this interface), DNS to one resolver, everything else internal denied and logged, then web and pings to the internet — the echo line sits below the internal deny, so guests can't ping inside. Resequencing turned the inserted line's odd number into a clean 10-step list. Replies from the internet arrive on the WAN interface, so this inbound list never sees them.",
  solve:["enable","configure terminal","interface g0/2","ip address 10.70.8.1 255.255.255.0","no shutdown","exit",
    "ip access-list extended GUEST-IN","10 permit udp any any eq bootps","20 permit udp 10.70.8.0 0.0.0.255 host 10.70.1.53 eq domain","30 deny ip 10.70.8.0 0.0.0.255 10.0.0.0 0.255.255.255 log","40 permit tcp 10.70.8.0 0.0.0.255 any eq www","50 permit tcp 10.70.8.0 0.0.0.255 any eq 443",
    "45 permit icmp 10.70.8.0 0.0.0.255 any echo","exit","ip access-list resequence GUEST-IN 10 10","interface g0/2","ip access-group GUEST-IN in","end","show access-lists GUEST-IN","show ip interface g0/2"]})}
${K.hint(`The internal deny covers <i>every</i> protocol to 10.0.0.0/8. A ping line above it would let guests ping internal hosts; below it, internal destinations are already denied, so only internet pings reach the echo line. Any number between the deny and the end works — 45 is one choice.`)}
${K.check({q:"Named list EDGE has lines 10, 20 and 30 and is applied inbound on G0/1. You type ip access-list extended EDGE, then 15 deny tcp any any eq 23. What happens?", o:["Nothing until you remove and re-apply ip access-group EDGE in","The line is added at the end, as line 40","The line is inserted between 10 and 20 and takes effect immediately on G0/1","IOS refuses it because 15 isn't a multiple of 10"], a:2, why:"A number before the line places it exactly there; any free number from 1 to 2147483647 is valid. The interface references the list by name, so the edited list is in force at once — which is also why edits to a live list need care."})}
<h3>Same logic, new situation</h3>
<p>After a year of tickets, the list KANO-EDGE reads: 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30. A new rule must go between 12 and 13. What do you do, and does anything stop working while you do it?</p>
${K.hint(`There is no free number between 12 and 13. One global command makes room without changing the order.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> How to insert where no number is free, and whether that disrupts anything. <b>2. Which rule?</b> Sequence numbers decide order; <code>ip access-list resequence</code> renumbers but keeps order and counters. <b>3. Apply it:</b> <code>ip access-list resequence KANO-EDGE 10 10</code> turns the twelve lines into 10 … 120 (old 12 = 30, old 13 = 40); then <code>35 …</code> inside <code>ip access-list extended KANO-EDGE</code>. Same order, so filtering is unchanged until the new line goes in — but notes quoting old line numbers are now wrong.</p>`)}

<h2>Placement and what an ACL really sees: near the source, the router's own traffic, OSPF</h2>
${K.remember(`<b>The placement rule:</b> put an <b>extended</b> ACL <b>as close to the source</b> of the traffic as possible; a <b>standard</b> ACL as close to the <b>destination</b> (lesson 4). <b>Why:</b> an extended line is precise (source, destination, protocol, port), so near the source it drops exactly the unwanted traffic before it crosses the network; a standard line sees only the source, so near the source it would cut that source off from <i>everything</i>.`)}
${K.svg("0 0 760 270",
  K.txt(20,20,"Same goal, two kinds of list: stop STAFF reaching the payroll server",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",60,70,"STAFF LAN","10.20.30.0/24")+K.dev("router",220,70,"R1","")+K.dev("router",380,70,"R2","")+K.dev("router",540,70,"R3","")+K.dev("server",700,70,"PAYROLL","10.20.99.10")+
  K.link(84,72,194,72)+K.link(246,72,354,72,"WAN")+K.link(406,72,514,72,"WAN")+K.link(566,72,682,72)+
  K.box(110,150,220,50,"Extended ACL — R1 Gi0/0 in","near the source: protocol and port",true)+K.box(430,150,220,50,"Standard ACL — R3 Gi0/0 out","near the destination: source only")+
  K.arrow(220,148,220,116,"",true)+K.arrow(540,148,540,116,"")+
  K.txt(380,226,"Extended near the source: denied packets die at the first router and never cross the WAN.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,246,"Standard near the destination: it sees only the source, so near the source it would cut STAFF off from everything.",{mid:true,s:11,f:"body"}),
  "Where each kind of list does its job with the least side effect.")}
<p>Cisco's current wording is softer than a slogan: put each ACL <b>where it does the job with the least unwanted effect</b>. Two real-world limits: you can only configure routers you manage, and a list protecting a site or the router itself sits on that edge, facing the traffic it guards (the branch bench later). Direction is as in lesson 4 — inbound before the routing lookup, outbound after — and a second <code>ip access-group</code> in the same direction replaces the first.</p>
<h3>What an inbound ACL sees that people forget</h3>
${K.svg("0 0 760 290",
  K.txt(20,20,"What an ACL on an interface actually sees",{c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(312,40,"inbound ACL · Gi0/1",{mid:true,c:"accent",s:11})+K.band(300,48,24,182,"","var(--chip)")+
  K.arrow(30,74,296,74,"transit: a PC's traffic from HQ")+K.arrow(30,109,296,109,"OSPF hello → 224.0.0.5 (protocol 89)")+K.arrow(30,144,296,144,"SSH to the router itself (TCP 22)")+
  K.arrow(30,179,296,179,"DHCP Discover → 255.255.255.255:67")+K.arrow(30,214,296,214,"replies to the router's own pings")+
  K.arrow(326,140,440,140,"",true)+K.dev("router",470,137,"PH-BR1","")+
  K.arrow(510,137,740,137,"the router's own packets",true)+K.txt(625,158,"pings, hellos, SSH replies",{mid:true,s:10.5})+K.txt(625,174,"skip any outbound ACL",{mid:true,s:10.5,c:"accent"})+
  K.txt(380,256,"Inbound: everything that arrives is checked, including traffic addressed to the router itself.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,276,"Outbound: only packets the router forwards are checked; packets it creates itself are not.",{mid:true,s:11,f:"body"}),
  "The two blind spots: inbound filters the router's own control traffic; outbound never filters what the router sends.")}
<p>An inbound list checks <b>every</b> packet arriving, not only users' traffic passing through:</p>
<ul>
<li><b>OSPF hellos</b> (protocol 89, to 224.0.0.5). Denied, the neighbour's dead timer runs out (40 s by default on Ethernet) and every route via that neighbour disappears.</li>
<li><b>HSRP hellos</b> (UDP 1985). Denied, a Standby router stops hearing the Active one and goes Active itself — two Actives on one LAN.</li>
<li><b>DHCP.</b> The Discover (0.0.0.0 → 255.255.255.255, UDP 68 → 67) arrives on the LAN interface whether the router is the server or a relay. No <code>permit udp any any eq bootps</code> → 169.254.</li>
<li><b>Management and replies:</b> SSH or ping to the router's own addresses, and the replies to anything the router itself sends.</li>
</ul>
${K.out(`PH-BR1(config)#access-list 170 permit tcp any any
PH-BR1(config)#interface g0/1
PH-BR1(config-if)#ip access-group 170 in
PH-BR1(config-if)#end
PH-BR1#show logging | include OSPF
*Oct 12 08:31:10.370: %OSPF-5-ADJCHG: Process 1, Nbr 10.255.0.1 on GigabitEthernet0/1 from LOADING to FULL, Loading Done
*Oct 12 08:31:52.192: %OSPF-5-ADJCHG: Process 1, Nbr 10.255.0.1 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Dead timer expired
PH-BR1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface`, "No line for OSPF: the hellos hit the implicit deny and the neighbour is gone. (The lab drops it at once; real routers wait out the dead interval.)")}
${K.mistake(`A new inbound ACL on an OSPF link without <code>permit ospf</code> at the top. Users don't see an ACL problem — they see &ldquo;the network is down&rdquo;, and <code>tracert</code> ends at the router with <code>Destination host unreachable</code> because the routes are gone. First line: <code>permit ospf any any</code> (or <code>permit ospf host &lt;neighbour&gt; any</code>).`)}
<h3>And what an outbound ACL never sees</h3>
<p>An outbound list filters packets the router <b>forwards</b>; packets it <b>creates</b> — its own pings, hellos, SSH replies, syslog — skip it. PH-BR1 with <code>deny icmp any any log</code> outbound on G0/1:</p>
${K.out(`C:\\Users\\bola>ping 10.1.99.20

Pinging 10.1.99.20 with 32 bytes of data:
Reply from 10.40.10.1: Destination protocol unreachable.
Reply from 10.40.10.1: Destination protocol unreachable.
...
PH-BR1#ping 10.1.99.20
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.1.99.20, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/3 ms
PH-BR1#show access-lists
Extended IP access list 150
    10 deny icmp any any log (4 matches)
    20 permit ip any any`, "The PC's echoes are forwarded: denied, 4 matches. The router's own ping skips the outbound list (the first dot is the ARP), and OSPF over G0/1 stays FULL.")}
<p>So &ldquo;the router can ping it&rdquo; proves nothing about users. Test from a host behind the router, or with a ping sourced from a LAN interface — and an <i>inbound</i> list still filters the replies to the router's own ping.</p>
${K.when([
  ["Standard ACL (lesson 4)","Only the source matters: VTY access-class, NAT match lists, SNMP community lists","Simple and short","You need a protocol, port or destination"],
  ["Extended ACL","The policy names a service, destination or protocol","Precise, so it can sit near the source","A one-host-from-everything rule — standard is clearer"],
  ["Named extended list","Anything you'll edit or hand over","The name documents the job; sequence edits, remarks","—  (numbered lists stay valid and appear in exams)"],
  ["established on an inbound edge","A small site with no firewall: TCP replies in, no inbound sessions","One line covers every outbound TCP session","You need UDP/ICMP replies too, or real state — use a firewall"],
], "Which list, and which tool?")}
<h3>A short word on IPv6 ACLs</h3>
<p>IPv6 lists are always named (<code>ipv6 access-list NAME</code>), use prefix lengths instead of wildcards, and are applied with <code>ipv6 traffic-filter NAME in|out</code>. Each ends with hidden <code>permit icmp any any nd-na</code>, <code>permit icmp any any nd-ns</code> and <code>deny ipv6 any any</code>, so ${K.g("Neighbor Discovery","IPv6's replacement for ARP (Module 6): Neighbor Solicitation and Neighbor Advertisement messages, carried in ICMPv6.")} keeps working — your own <code>deny ipv6 any any log</code> sits above them, so add ND permits before it. The lab filters IPv4 only.</p>
${K.check({q:"R1 has this outbound on G0/1 (towards the server LAN): deny icmp any any, then permit ip any any. Which ping fails?", o:["R1's own ping from its CLI to a server on the G0/1 LAN","A PC behind R1's G0/0 pinging a server on the G0/1 LAN","Neither — outbound ACLs never filter ICMP","Both"], a:1, why:"The PC's echo is forwarded out G0/1, so the outbound list checks it and line 1 denies it. R1's own echo is created by R1, and outbound lists don't filter router-originated packets. The servers' replies arrive on G0/1 inbound, which has no list here."})}
<h3>Hands-on: one ACL, four services</h3>
<p>The Lagos fintech from the opening. A colleague applied a first draft of STAFF-IN written from the policy's first sentence only. Watch four services fail in four different ways before you change anything.</p>
${K.bench({id:"m8-acl-four-services", points:120, openLog:true, from:"CCNA · Module 8 · lesson 5", title:"Lagos loan office — web, ping, SSH and DHCP under one extended ACL", viewBox:"0 0 960 410",
  intro:"<b>Design:</b> staff LAN 192.168.20.0/24 on LAG-R1 Gi0/0 (gateway and DHCP server .1); OSPF to LAG-R2; server LAN 192.168.60.0/24 on LAG-R2, LOANS-WEB 192.168.60.20; LAG-R2 takes SSH on 192.168.60.1 (<code>netops</code> / <code>Ex4mple-Only!</code>). PC-ADMIN 192.168.20.10; PC-STAFF on DHCP. <b>Policy for STAFF-IN</b> (inbound on LAG-R1 Gi0/0): DHCP works; staff browse the portal and may ping the server LAN; only PC-ADMIN may SSH to 192.168.60.1; everything else denied and logged. Console on LAG-R1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab notes:</b> a Windows ping adds 4 matches, a TCP connection 1; one log line per test (real IOS: first packet, then 5-minute summaries).",
  devices:[
    {id:"r1", kind:"router", label:"LAG-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname LAG-R1","no ip domain-lookup",
      "int g0/0","description STAFF LAN","ip address 192.168.20.1 255.255.255.0","no shut","int g0/1","description LINK TO LAG-R2","ip address 10.0.12.1 255.255.255.252","no shut","exit",
      "router ospf 1","network 192.168.20.0 0.0.0.255 area 0","network 10.0.12.0 0.0.0.3 area 0","exit",
      "ip dhcp excluded-address 192.168.20.1 192.168.20.20","ip dhcp pool STAFF","network 192.168.20.0 255.255.255.0","default-router 192.168.20.1","exit",
      "ip access-list extended STAFF-IN","remark first draft - staff may browse the loan portal","permit tcp 192.168.20.0 0.0.0.255 host 192.168.60.20 eq www","exit",
      "int g0/0","ip access-group STAFF-IN in","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"r2", kind:"router", label:"LAG-R2", x:520, y:20, config:e=>{ ["en","conf t","hostname LAG-R2","no ip domain-lookup",
      "int g0/0","description SERVER LAN","ip address 192.168.60.1 255.255.255.0","no shut","int g0/1","description LINK TO LAG-R1","ip address 10.0.12.2 255.255.255.252","no shut","exit",
      "router ospf 1","network 192.168.60.0 0.0.0.255 area 0","network 10.0.12.0 0.0.0.3 area 0","exit",
      "ip domain name lagos.example.com","username netops secret Ex4mple-Only!","line vty 0 4","login local","transport input ssh","exit","crypto key generate rsa","","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw1", kind:"switch", label:"SW-STAFF", x:20, y:150},
    {id:"sw2", kind:"switch", label:"SW-SRV", x:520, y:150},
    {id:"adm", kind:"pc", label:"PC-ADMIN", x:20, y:300, ip:"192.168.20.10", mask:"255.255.255.0", gw:"192.168.20.1"},
    {id:"stf", kind:"pc", label:"PC-STAFF", x:150, y:300, dhcp:true},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:280, y:300},
    {id:"web", kind:"server", label:"LOANS-WEB", x:560, y:300, ip:"192.168.60.20", mask:"255.255.255.0", gw:"192.168.60.1", services:{web:{title:"Loan portal"}}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g1"}, {type:"cat6", a:"adm:eth", b:"sw1:g2"}, {type:"cat6", a:"stf:eth", b:"sw1:g3"}, {type:"cat6", a:"r1:g1", b:"r2:g1"},
    {type:"cat6", a:"r2:g0", b:"sw2:g1"}, {type:"cat6", a:"web:eth", b:"sw2:g2"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Before changing anything, test the four services and note HOW each fails. On PC-ADMIN: <code>curl http://192.168.60.20</code> (curl, built into Windows, fetches a web page), <code>ping 192.168.60.20</code> and <code>ssh -l netops 192.168.60.1</code>. On PC-STAFF: <code>ipconfig /renew</code>. Which works, which gets an answer from LAG-R1, which just times out?", done:B=>Bench.fetched(B,"adm","192.168.60.20") && Bench.tried(B,"adm",/^ping\s+192\.168\.60\.20/i) && Bench.tried(B,"adm",/^ssh\s/i) && Bench.tried(B,"stf",/ipconfig\s+\/renew/i)},
    {text:"Console to LAG-R1, <code>enable</code>, then read the evidence: <code>show access-lists</code> (which line has matches, and what took the rest?) and <code>show ip interface g0/0</code> (which list, which direction?)", done:B=>{ const h=B.devs.r1.env.history; return h.some(x=>/sh\S*\s+(ip\s+)?acc\S*/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+int\S*\s+g\S*\s*0\/0/i.test(x)); }},
    {text:"DHCP first. PC-STAFF's Discover arrives on Gi0/0 from 0.0.0.0 to 255.255.255.255, UDP 68 → 67. <code>configure terminal</code>, <code>ip access-list extended STAFF-IN</code>, <code>5 permit udp any any eq bootps</code> (numbered 5 so it lands above line 10), <code>end</code>, then <code>ipconfig /renew</code> on PC-STAFF. Done when PC-STAFF holds a lease", done:B=>!!Bench.leased(B,"stf")},
    {text:"Finish the policy with numbered lines in STAFF-IN: <code>20</code> staff ICMP <code>echo</code> to the server LAN 192.168.60.0/24; <code>30</code> TCP port 22 from <code>host 192.168.20.10</code> to <code>host 192.168.60.1</code> only; <code>40 deny ip any any log</code>. Done when PC-ADMIN pings LOANS-WEB and logs in to LAG-R2 over SSH (then type <code>exit</code> to leave the session)", done:B=>Bench.pinged(B,"adm","192.168.60.20") && Bench.remoteTo(B,"adm")==="192.168.60.1"},
    {text:"Prove the deny side: from PC-STAFF try <code>ssh -l netops 192.168.60.1</code> and <code>ping 192.168.20.1</code> — its own gateway. Then on LAG-R1 <code>show logging | include SEC</code> (only the log lines containing <code>SEC</code>). Why is a ping to the router itself blocked by a list on the LAN interface?", done:B=>Bench.logged(B,"r1",/IPACCESSLOGP: list STAFF-IN denied tcp 192\.168\.20\.\d+\(\d+\) -> 192\.168\.60\.1\(22\)/) && Bench.logged(B,"r1",/IPACCESSLOGDP: list STAFF-IN denied icmp 192\.168\.20\.\d+ -> 192\.168\.20\.1 /)},
    {text:"Tidy and save: <code>configure terminal</code>, <code>ip access-list resequence STAFF-IN 10 10</code>, <code>end</code>, <code>show access-lists STAFF-IN</code> (did the counters survive the renumbering?), then <code>copy running-config startup-config</code>", done:B=>{ const l=B.devs.r1.env.acl.lists["STAFF-IN"]; return !!l && l.entries.filter(x=>!x.remark).map(x=>x.seq).join()==="10,20,30,40,50" && !!B.devs.r1.env.savedOnce; }},
  ],
  win:"One list, four fingerprints. The web worked from the start (line 10). The ping came back 'Destination protocol unreachable' from LAG-R1 — the implicit deny answering. SSH and curl don't print the ICMP message: they retry the SYN, then report a failed connection. DHCP failed silently into 169.254, because the Discover arrives on the very interface the list guards. Line 5 fixed DHCP without touching anything else, numbered lines finished the policy, the explicit deny logged the refusals, and a ping to the router's own gateway address proved that an inbound list also filters traffic for the router itself.",
  solve:[["pc","adm","curl http://192.168.60.20"],["pc","adm","ping 192.168.60.20"],["pc","adm","ssh -l netops 192.168.60.1"],["pc","stf","ipconfig /renew"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show access-lists"],["term","show ip interface g0/0"],
    ["term","configure terminal"],["term","ip access-list extended STAFF-IN"],["term","5 permit udp any any eq bootps"],["term","end"],["pc","stf","ipconfig /renew"],
    ["term","configure terminal"],["term","ip access-list extended STAFF-IN"],["term","20 permit icmp 192.168.20.0 0.0.0.255 192.168.60.0 0.0.0.255 echo"],["term","30 permit tcp host 192.168.20.10 host 192.168.60.1 eq 22"],["term","40 deny ip any any log"],["term","end"],
    ["pc","adm","ping 192.168.60.20"],["pc","adm","ssh -l netops 192.168.60.1"],["pc","adm","Ex4mple-Only!"],["pc","adm","exit"],
    ["pc","stf","ssh -l netops 192.168.60.1"],["pc","stf","ping 192.168.20.1"],["term","show logging | include SEC"],
    ["term","configure terminal"],["term","ip access-list resequence STAFF-IN 10 10"],["term","end"],["term","show access-lists STAFF-IN"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: the frame log names the list and line behind each drop. Task 3: <code>bootps</code> is UDP 67, where the client's request goes. Task 4: the port goes after the destination: <code>host 192.168.60.1 eq 22</code>. Task 5: the ping to 192.168.20.1 arrives on Gi0/0.`)}
<div class="tablewrap"><table>
<tr><th>Service</th><th>What the user sees when the ACL drops it</th></tr>
<tr><td>Ping</td><td><code>Reply from 192.168.20.1: Destination protocol unreachable.</code> — the admin-prohibited reply (lesson 4)</td></tr>
<tr><td>Web · SSH</td><td><code>curl: (28) Failed to connect … after 21045 ms</code> · <code>Connection timed out</code> — Windows retries the SYN, then gives up (the lab's wording; when the router sends the ICMP reply, real Windows may report the host as unreachable instead)</td></tr>
<tr><td>DHCP</td><td>169.254, and <code>ipconfig /renew</code>: <i>unable to contact your DHCP server</i></td></tr>
</table></div>
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A different site: router R5's LAN interface G0/0 is the DHCP server for the LAN, runs HSRP with a partner router on that LAN, and has an OSPF neighbour (the partner) there too. A new inbound list on G0/0 permits only TCP from the LAN to the server farm. Which three lines must be added near the top so R5's own services keep working? (Choose three.)", o:["permit udp any any eq bootps","permit ospf any any","permit udp any any eq 1985","permit udp any any eq bootpc","permit tcp any any established","permit icmp any any echo-reply"], a:[0,1,2], why:"1. What is asked? Which control traffic arrives inbound on G0/0 for R5 itself. 2. Which rule? An inbound list sees everything arriving, including the router's own protocols; the implicit deny drops whatever isn't permitted. 3. Apply it: clients' DHCP requests go to UDP 67 (bootps — 68/bootpc is the client's port); the partner's OSPF hellos are protocol 89; HSRP hellos are UDP 1985. established and echo-reply aren't needed for those three services."})}

${K.drill({title:"standard or extended — where does it go?", types:["aclplace"], count:5})}
<h2>Troubleshooting extended ACLs: five questions and their fingerprints</h2>
${K.remember(`<b>The method:</b> when an ACL may be involved, ask five questions in order. <b>1. Right interface?</b> <b>2. Right direction?</b> (<code>show ip interface</code>.) <b>3. Right order?</b> (an earlier line matching first.) <b>4. Right fields?</b> (protocol, addresses, wildcards, which side the port is on.) <b>5. What else crosses that interface?</b> (return traffic, routing hellos, DHCP, management.) Counters and log lines answer most of them.`)}
<div class="tablewrap"><table>
<tr><th>Fault</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td><b>Wrong direction</b> or interface</td><td>the lines you expected stay at 0; counters climb on the return traffic instead</td><td><code>no ip access-group NAME out</code>, then <code>… in</code> (or move it)</td></tr>
<tr><td><b>Wrong order</b></td><td>a broader line above takes the matches (and the log names it); the specific line stays at 0</td><td>re-add the specific line above it with a lower number</td></tr>
<tr><td><b>Too narrow</b> (port on the source side, tight wildcard, tcp for a UDP service)</td><td>the allowed service fails; its permit stays at 0</td><td>rewrite the line; ask which device listens</td></tr>
<tr><td><b>Too broad</b> (<code>ip</code> for <code>tcp</code>, <code>any</code> for a host)</td><td>traffic that should be refused works; a permit counts it</td><td>narrow it; test from a host that should be refused</td></tr>
<tr><td><b>Missing return traffic</b></td><td>web works but ping says <code>Request timed out</code> (not &ldquo;prohibited&rdquo;); traceroute shows <code>*</code></td><td>permit <code>echo-reply</code>, <code>time-exceeded</code>, <code>unreachable</code> (or UDP replies)</td></tr>
<tr><td><b>Control traffic denied</b></td><td>OSPF neighbour gone (<code>Dead timer expired</code>), whole site &ldquo;down&rdquo;; or 169.254 addresses</td><td><code>permit ospf …</code>, <code>permit udp any any eq bootps</code> at the top</td></tr>
</table></div>
${K.exam(`Reading an ACL question: before the options, write down the <b>source</b>, the <b>destination</b>, the <b>protocol and port</b> (which device listens?) and the <b>interface and direction</b> the packet crosses. Then walk the list top-down for that one packet. Traps: the port on the source side, <code>ip</code> vs <code>tcp</code>, a wildcard one subnet too wide or narrow, a deny above the permit, and the reply travelling the other way.`)}
${K.job("“Since Saturday's change, the CRM won't load — but we can ping it”",`
<p><b>The ticket.</b> Monday 08:20, an insurer's contact centre in Ikeja: &ldquo;No agent can open the ${K.g("CRM","Customer Relationship Management system: the application agents use to look up and update customer records — here a web app on HTTPS.")} (https://10.50.9.30). Ping to it works. Started this morning.&rdquo; Saturday's change log: &ldquo;CHG-2207: replace the old permit-any on CC-R1 Gi0/0 with a least-privilege list.&rdquo;</p>
<p><b>Questions first.</b> Who? All agents, 10.50.1.0/24. What? HTTPS to one server; ping and DNS fine. What changed? A new inbound list — the obvious suspect, but prove it.</p>
<p><b>Checks.</b> On an agent PC, PowerShell's <code>Test-NetConnection 10.50.9.30 -Port 443</code> says <code>TcpTestSucceeded : False</code>, <code>PingSucceeded : True</code>: the path is fine, TCP 443 isn't. On the router:</p>
${K.out(`CC-R1#show ip interface g0/0 | include access list
  Outgoing Common access list is not set
  Outgoing access list is not set
  Inbound Common access list is not set
  Inbound  access list is CC-IN
CC-R1#show access-lists CC-IN
Extended IP access list CC-IN
    10 permit tcp 10.50.1.0 0.0.0.255 eq 443 host 10.50.9.30
    20 permit icmp 10.50.1.0 0.0.0.255 any echo (812 matches)
    30 permit udp any any eq bootps (64 matches)
    40 permit udp 10.50.1.0 0.0.0.255 host 10.50.9.53 eq domain (3410 matches)
    50 deny ip any any log (1906 matches)
CC-R1#show logging | include IPACCESSLOGP
*Oct 12 08:14:51.204: %SEC-6-IPACCESSLOGP: list CC-IN denied tcp 10.50.1.37(52114) -> 10.50.9.30(443), 1 packet`, "Line 10 has no matches at all, the deny is busy, and the log shows agents' packets TO port 443 FROM port 52114.")}
<p><b>Diagnosis.</b> Line 10 has <code>eq 443</code> after the <b>source</b>, so it matches packets <i>from</i> port 443. Browsers send from ephemeral ports (52114) <i>to</i> 443: line 10 never matches, line 50 drops them. Too narrow — the port is on the wrong side.</p>
<p><b>Fix</b> (emergency change, approved by the team lead): <code>ip access-list extended CC-IN</code>, <code>15 permit tcp 10.50.1.0 0.0.0.255 host 10.50.9.30 eq 443</code> first — so there's no moment with nothing permitted — then <code>no 10</code>. (<i>Not</i> <code>no access-list</code>, which would delete the whole list.)</p>
<p><b>Verify.</b> The CRM opens; line 15 is counting; <code>Test-NetConnection</code> says <code>True</code>. Save.</p>
<p><b>What you say.</b> &ldquo;Saturday's new filter had one line written backwards, so it blocked the CRM. It's corrected and saved; please refresh and tell me if anything else fails.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;CC-R1 CC-IN (in Gi0/0, CHG-2207) line 10 had eq 443 on the source side: 0 matches, agents' 443 traffic hitting line 50 (log). Added 15 with the port after the destination, removed 10, 08:41. CRM OK, saved. Action: test ACL changes from a client before closing the window.&rdquo;</i></p>`)}
<h3>Hands-on: the Port Harcourt branch after Friday's change</h3>
<p>Three stacked faults: fixing one reveals the next. Collect evidence before each change, and change one thing at a time.</p>
${K.bench({id:"m8-acl-branch-ticket", points:140, openLog:true, from:"CCNA · Module 8 · lesson 5", title:"Port Harcourt ticket — 'no intranet, no pings, and the NOC can't get in'", viewBox:"0 0 960 410",
  intro:"<b>Ticket 5520:</b> &ldquo;Since Friday night's change (CHG-4471: inbound list FROM-HQ on PH-BR1's WAN link), the branch can't open the HQ intranet, pings to HQ fail, and the NOC jump host can't SSH in to PH-BR1.&rdquo; <b>Design:</b> branch LAN 10.40.10.0/24 on PH-BR1 Gi0/0; WAN 10.255.0.0/30 (HQ-R1 .1, PH-BR1 .2) with OSPF; HQ LAN 10.1.99.0/24 with INTRANET 10.1.99.20 and the "+K.g("NOC","Network Operations Centre: the team (and room) that monitors and manages the network around the clock.")+"'s jump host 10.1.99.5. <b>Intended policy:</b> OSPF from HQ-R1; TCP replies to sessions branch users open; replies to the branch's pings and traceroutes; SSH to 10.255.0.2 from NOC-JUMP only (other SSH denied and logged); everything else denied and logged. PH-BR1 SSH account: <code>noc</code> / <code>Ex4mple-NOC-pass</code>. Console on PH-BR1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab note:</b> OSPF reacts at once here; real routers wait out the 40-second dead interval.",
  devices:[
    {id:"hq", kind:"router", label:"HQ-R1", x:520, y:20, config:e=>{ ["en","conf t","hostname HQ-R1","no ip domain-lookup",
      "int g0/0","description HQ SERVER LAN","ip address 10.1.99.1 255.255.255.0","no shut","int g0/1","description WAN TO PH-BR1","ip address 10.255.0.1 255.255.255.252","no shut","exit",
      "router ospf 1","network 10.1.99.0 0.0.0.255 area 0","network 10.255.0.0 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"br", kind:"router", label:"PH-BR1", x:20, y:20, config:e=>{ ["en","conf t","hostname PH-BR1","no ip domain-lookup",
      "int g0/0","description BRANCH LAN","ip address 10.40.10.1 255.255.255.0","no shut","int g0/1","description WAN TO HQ-R1","ip address 10.255.0.2 255.255.255.252","no shut","exit",
      "router ospf 1","network 10.40.10.0 0.0.0.255 area 0","network 10.255.0.0 0.0.0.3 area 0","exit",
      "ip domain name ph.example.net","username noc secret Ex4mple-NOC-pass","line vty 0 4","login local","transport input ssh","exit","crypto key generate rsa","",
      "ip access-list extended FROM-HQ","remark CHG-4471 replies to sessions branch users opened","10 permit tcp any 10.40.10.0 0.0.0.255 established",
      "remark nobody else may SSH to the branch router","20 deny tcp any any eq 22 log","remark the HQ jump host manages this router","30 permit tcp host 10.1.99.5 host 10.255.0.2 eq 22","40 deny ip any any log","exit",
      "int g0/1","ip access-group FROM-HQ in","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"BR-SW1", x:20, y:150},
    {id:"hsw", kind:"switch", label:"HQ-SW1", x:520, y:150},
    {id:"p1", kind:"pc", label:"BR-PC1", x:20, y:300, ip:"10.40.10.21", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:200, y:300},
    {id:"web", kind:"server", label:"INTRANET", x:540, y:300, ip:"10.1.99.20", mask:"255.255.255.0", gw:"10.1.99.1", services:{web:{title:"Staff intranet"}}},
    {id:"jmp", kind:"pc", label:"NOC-JUMP", x:700, y:300, ip:"10.1.99.5", mask:"255.255.255.0", gw:"10.1.99.1"},
  ],
  cables:[ {type:"cat6", a:"br:g0", b:"sw:g1"}, {type:"cat6", a:"p1:eth", b:"sw:g2"}, {type:"cat6", a:"br:g1", b:"hq:g1"}, {type:"cat6", a:"hq:g0", b:"hsw:g1"},
    {type:"cat6", a:"web:eth", b:"hsw:g2"}, {type:"cat6", a:"jmp:eth", b:"hsw:g3"}, {type:"console", a:"lap:usb", b:"br:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket. On BR-PC1: <code>curl http://10.1.99.20</code>, <code>ping 10.1.99.20</code> and <code>tracert 10.1.99.20</code>. On NOC-JUMP: <code>ssh -l noc 10.255.0.2</code>. Does BR-PC1's failure look like an ACL drop (prohibited) or like a missing route?", done:B=>Bench.tried(B,"p1",/^curl\s/i) && Bench.tried(B,"p1",/^ping\s+10\.1\.99\.20/i) && Bench.tried(B,"p1",/^tracert\s+10\.1\.99\.20/i) && Bench.tried(B,"jmp",/^ssh\s/i)},
    {text:"Console to PH-BR1, <code>enable</code>. Collect evidence: <code>show ip ospf neighbor</code>, <code>show ip route</code>, <code>show ip interface g0/1</code> and <code>show access-lists</code>. Which line of FROM-HQ would let HQ-R1's hellos in?", done:B=>{ const h=B.devs.br.env.history; return h.some(x=>/sh\S*\s+ip\s+ospf\s+nei/i.test(x)) && h.some(x=>/sh\S*\s+(ip\s+)?acc\S*/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+int\S*\s+g\S*\s*0\/1/i.test(x)); }},
    {text:"Fault 1: let OSPF in from the neighbour, above everything else — in <code>ip access-list extended FROM-HQ</code> add <code>5 permit ospf host 10.255.0.1 any</code>. Done when HQ-R1 is a FULL neighbour again and PH-BR1 has the OSPF route to 10.1.99.0/24", done:B=>Bench.ospfNbr(B,"br","10.255.0.1") && !!Bench.route(B,"br","10.1.99.0/24","O")},
    {text:"Test again from BR-PC1: curl now works, but the ping says <code>Request timed out</code> — a different message from before. Read the frame log and <code>show access-lists</code>: what is dropped, and in which direction? Add lines 15, 16 and 17 permitting ICMP <code>echo-reply</code>, <code>time-exceeded</code> and <code>unreachable</code> from <code>any</code> to the branch LAN. Done when BR-PC1 pings INTRANET and its tracert completes", done:B=>Bench.fetched(B,"p1","10.1.99.20") && Bench.pinged(B,"p1","10.1.99.20") && Bench.traced(B,"p1","10.1.99.20")},
    {text:"Fault 3: NOC-JUMP's SSH still times out. <code>show logging | include SEC</code> (only the ACL log lines) names the line that drops it. Fix the order: <code>no 30</code>, then put the jump-host permit back ABOVE line 20 (e.g. <code>18 permit tcp host 10.1.99.5 host 10.255.0.2 eq 22</code>). Done when NOC-JUMP logs in to PH-BR1 over SSH (then <code>exit</code>)", done:B=>Bench.remoteTo(B,"jmp")==="10.255.0.2"},
    {text:"Prove it and save: <code>show access-lists</code> (which of your new lines are counting, and which kind of traffic hasn't happened yet?), then <code>copy running-config startup-config</code>", done:B=>!!B.devs.br.env.savedOnce && Bench.aclHits(B,"br","FROM-HQ",18)>0 && Bench.aclHits(B,"br","FROM-HQ",15)>0},
  ],
  win:"Three faults, three fingerprints. No permit for OSPF: the neighbour vanished, and with it the route — BR-PC1 saw 'Destination host unreachable', a routing symptom caused by an ACL. Missing return traffic: established let TCP replies in, but echo-replies and time-exceeded messages died at Gi0/1, so the ping just timed out and tracert showed * at hop 2. Wrong order: the broad 'deny tcp any any eq 22' sat above the jump host's permit, and its log line said so. Each fix was one numbered line in the right place.",
  solve:[["pc","p1","curl http://10.1.99.20"],["pc","p1","ping 10.1.99.20"],["pc","p1","tracert 10.1.99.20"],["pc","jmp","ssh -l noc 10.255.0.2"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip route"],["term","show ip interface g0/1"],["term","show access-lists"],
    ["term","configure terminal"],["term","ip access-list extended FROM-HQ"],["term","5 permit ospf host 10.255.0.1 any"],["term","end"],["term","show ip ospf neighbor"],
    ["pc","p1","curl http://10.1.99.20"],["pc","p1","ping 10.1.99.20"],["term","show access-lists"],
    ["term","configure terminal"],["term","ip access-list extended FROM-HQ"],["term","15 permit icmp any 10.40.10.0 0.0.0.255 echo-reply"],["term","16 permit icmp any 10.40.10.0 0.0.0.255 time-exceeded"],["term","17 permit icmp any 10.40.10.0 0.0.0.255 unreachable"],["term","end"],
    ["pc","p1","ping 10.1.99.20"],["pc","p1","tracert 10.1.99.20"],
    ["pc","jmp","ssh -l noc 10.255.0.2"],["term","show logging | include SEC"],
    ["term","configure terminal"],["term","ip access-list extended FROM-HQ"],["term","no 30"],["term","18 permit tcp host 10.1.99.5 host 10.255.0.2 eq 22"],["term","end"],
    ["pc","jmp","ssh -l noc 10.255.0.2"],["pc","jmp","Ex4mple-NOC-pass"],["pc","jmp","exit"],
    ["term","show access-lists"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: &ldquo;Destination host unreachable&rdquo; from 10.40.10.1 means PH-BR1 has no route — so ask why OSPF is down. Task 4: the echo reply travels HQ → branch, so it arrives on Gi0/1 inbound; line 10 is TCP only. Task 5: the log line names the list and the protocol and ports — which line of FROM-HQ matches TCP to port 22 first?`)}
${K.case("The change that cut forty branches off — twice",`
<p>A regional bank schedules a 22:00 change: an inbound list on the head-office WAN aggregation router to stop Telnet from the branches — two lines denying TCP 23, then <code>permit tcp any any</code>.</p>
<p><b>What happened.</b> Forty seconds after <code>ip access-group</code>, every branch's OSPF adjacency on that router died: hellos are protocol 89, not TCP. The engineer's SSH session crossed the same WAN, so he lost the router too; a colleague drove to the data centre for the console, and the branches were dark for 70 minutes. The next night <code>permit ospf any any</code> went in — and the branches' relayed DHCP traffic through that router failed until <code>permit udp any any eq bootps</code> joined it.</p>
<p><b>What they changed.</b> Every ACL change starts with <code>reload in 15</code>; lists are reviewed offline by someone who asks &ldquo;what else crosses this interface?&rdquo;; control-plane permits go first with remarks; changes are tested in a lab with the real routing protocol; core routers get out-of-band console access.</p>
<p><b>Lesson.</b> An extended ACL does exactly what it says — including denying everything it doesn't mention.</p>`)}
${K.myth([
  ["An outbound ACL on the WAN interface also stops the router's own pings and OSPF hellos.","Outbound lists filter forwarded traffic only. Router-originated packets skip them — so the router's own ping proves nothing about users."],
  ["established makes an ACL stateful, like a firewall.","It only checks the ACK or RST flag on TCP segments. No session table, so crafted packets pass, and UDP and ICMP replies are not covered at all."],
  ["If you don't add deny ip any any, the ACL lets everything else through.","The implicit deny is always there. An explicit deny ip any any log only adds a counter and log lines."],
  ["Blocking all ICMP makes a network safer at no cost.","It breaks ping, traceroute and the 'fragmentation needed' messages path MTU discovery relies on. Permit the types you need."],
])}
${K.dodont([
  "Write the policy as source → destination, protocol, port before typing.",
  "Put control-plane permits (OSPF, DHCP, HSRP, management) first, with remarks.",
  "End important lists with deny ip any any log.",
  "Test from a host that should pass and one that should be refused.",
],[
  "Don't put the server's port after the client's address.",
  "Don't type a long policy into a list that is already applied.",
  "Don't trust the router's own ping as proof that users get through.",
  "Don't remove a line with no access-list N …",
])}
${K.check({q:"Inbound on a branch WAN interface: permit ospf any any, then permit tcp any 10.40.10.0 0.0.0.255 established. Branch users can browse HQ's intranet, but their pings to it say Request timed out. Why?", o:["The echo requests are denied on the way out","The echo replies arrive on the WAN interface inbound, match no line and are dropped by the implicit deny","established blocks ICMP explicitly","OSPF is down"], a:1, why:"The requests leave through the WAN interface outbound, which has no list. The replies come back inbound: ICMP doesn't match the TCP established line, so the implicit deny drops them. The sender gets no prohibited message (that goes to the replying server), so it just times out. Fix: permit icmp any 10.40.10.0 0.0.0.255 echo-reply."})}
<h3>Same logic, new situation</h3>
${K.hint(`For each piece of evidence, ask which of the five questions — interface, direction, order, fields, what else crosses — it answers.`)}
${K.q({type:"match", q:"Five sites, five broken lists. Match each piece of evidence with the fault it proves.", pairs:[
  ["The list meant to block a LAN's Telnet shows 0 matches on its deny line, while its permit counts the replies coming back to that LAN","Applied in the wrong direction"],
  ["Log: list EDGE denied tcp 10.6.0.9(50122) -> 10.6.1.1(22), from the broad deny line above the jump host's permit","A broad deny sits above a specific permit"],
  ["The permit for TCP 443 has 0 matches; it reads ... eq 443 host 10.7.9.30 after the client subnet","Port written on the source side"],
  ["Web replies get in, but every ping times out and traceroute shows * after hop 1","Return ICMP not permitted"],
  ["show ip ospf neighbor is empty and the log shows Dead timer expired right after the change","OSPF hellos denied by the implicit deny"]],
  why:"1. What is asked? Which fault each fingerprint proves. 2. Which rule? Counters and logs show which line took the traffic and in which direction. 3. Apply it: deny line idle while replies are counted = wrong direction; the log naming the broad line = order; a permit at 0 with the port after the source = too narrow; replies dropped = return traffic; neighbour lost on apply = control traffic."})}

<h2>Interview corner</h2>
${K.hint(`What each kind matches, then where each goes and why.`)}
${K.reveal("“What's the difference between a standard and an extended ACL, and where do you put each?”",`<p>"A standard ACL matches only the source address; an extended ACL matches protocol, source and destination, and for TCP and UDP the ports, plus ICMP types and established. Standard lists are 1–99 and 1300–1999, extended 100–199 and 2000–2699, or either can be named. An extended line is precise, so I put it close to the source and unwanted traffic dies before it uses the network. A standard line near the source would block that source from everything, so it goes near the destination. And a list protecting a site's edge sits on that edge."</p>`)}
${K.hint(`What arrives inbound; protocol 89; the dead timer; the first line.`)}
${K.reveal("“You applied an inbound ACL on a WAN interface and soon after the OSPF neighbour went down. What happened?”",`<p>"An inbound ACL checks everything that arrives, including traffic for the router itself, and OSPF hellos are IP protocol 89 to 224.0.0.5. My list didn't permit OSPF, so the implicit deny dropped the hellos and the dead timer expired — 40 seconds by default on Ethernet. I'd confirm with show ip ospf neighbor and the 'Dead timer expired' ADJCHG message, then insert permit ospf from the neighbour as the first line. Same thinking for DHCP, HSRP and management. For remote changes I start with reload in."</p>`)}
${K.hint(`The flag it checks, what it's good for, and what it can't do.`)}
${K.reveal("“What does the established keyword do, and is it a firewall?”",`<p>"On a TCP line it matches segments with ACK or RST set — everything except the opening SYN. Inbound on an edge, permit tcp any &lt;inside&gt; established lets replies in while an outside SYN hits the implicit deny. It isn't a firewall: it keeps no state, so a crafted packet with ACK set passes, and it does nothing for UDP or ICMP — DNS and ping replies need their own lines. For real state I'd use a stateful firewall, an appliance or the IOS zone-based firewall."</p>`)}

${K.recap([
  "An extended ACE matches protocol, source, destination and (TCP/UDP) ports; every field must match, the first matching line decides. Numbers 100–199 and 2000–2699, or a name.",
  "The port goes after the address of the device that listens; replies from a server carry its port as the source port.",
  "eq, neq, lt, gt, range; IOS shows www, domain, bootps; ICMP types echo, echo-reply, time-exceeded, unreachable.",
  "established matches TCP segments with ACK or RST — replies, not new sessions — and is not stateful.",
  "Insert with 15 permit …, delete with no 20, renumber with ip access-list resequence; no access-list N … deletes the whole list.",
  "log gives %SEC-6-IPACCESSLOGP/DP/NP/S; end important lists with deny ip any any log.",
  "Extended near the source. Inbound lists see OSPF, HSRP, DHCP, management and replies to the router; outbound lists never filter its own packets.",
])}
${K.next(`<b>Lesson 6 — Port security.</b> ACLs filter by address and port at Layer 3 and 4. Next, the switch port itself: limit which MAC addresses may use an access port, watch a port go err-disabled when an unknown laptop appears, and tidy unused ports, DTP and the native VLAN.`)}
`,
quiz:[
  {lvl:1, q:"Which numbers can a numbered extended IPv4 ACL use?", o:["1–99 and 1300–1999","100–199 and 2000–2699","100–199 only","200–299 and 2700–2799"], a:1, why:"Extended lists use 100–199 and the expanded range 2000–2699. 1–99 and 1300–1999 are standard lists. IOS rejects access-list 200 with an IP extended syntax."},
  {lvl:1, q:"An extended line reads permit ip 10.1.1.0 0.0.0.255 any. Which traffic from 10.1.1.0/24 does it match?", o:["Only IP packets that are not TCP or UDP","Every IPv4 packet: TCP, UDP, ICMP, OSPF and the rest","Only ICMP","Only traffic to the router itself"], a:1, why:"The protocol keyword ip means any IPv4 packet, so the line covers every protocol from that source to any destination. Use tcp, udp, icmp or ospf to narrow it."},
  {lvl:1, type:"match", q:"Match each IOS keyword in show access-lists with the port number it stands for.", pairs:[["www","TCP 80"],["domain","53 (DNS)"],["bootps","UDP 67"],["telnet","TCP 23"],["ntp","UDP 123"]], why:"IOS rewrites well-known ports as names: www 80, domain 53, bootps 67 (DHCP server), bootpc 68 (DHCP client), telnet 23, ntp 123. Ports without a keyword, such as 22 and 443, stay as numbers."},
  {lvl:1, q:"A branch router's WAN interface has an inbound ACL. For a branch PC's tracert to list each router on the path, which ICMP type must that ACL permit back towards the PC?", o:["echo","time-exceeded","redirect","echo-reply only"], a:1, why:"Each router on the path answers the expiring probe with ICMP time-exceeded (type 11); only the destination answers with echo-reply. Permit echo-reply alone and the trace shows * for every hop before the last."},
  {lvl:2, type:"fill", q:"Write one numbered line for list 120 that lets the 10.8.4.0/24 LAN open HTTPS (TCP 443) sessions to the server 10.8.9.25 and nothing else.", fields:[{label:"ACE", a:["access-list 120 permit tcp 10.8.4.0 0.0.0.255 host 10.8.9.25 eq 443","access-list 120 permit tcp 10.8.4.0 0.0.0.255 10.8.9.25 0.0.0.0 eq 443"], ios:true}], why:"Protocol tcp; source 10.8.4.0 with wildcard 0.0.0.255; destination host 10.8.9.25; the server listens on 443, so eq 443 goes after the destination. Writing eq 443 after the source would match packets from port 443 and never match a request."},
  {lvl:2, q:"Agents can ping the CRM server but its web page never loads. Based on the exhibit (inbound on the agents' LAN interface), what is wrong?", ex:"CC-R1#show access-lists CC-IN\nExtended IP access list CC-IN\n    10 permit tcp 10.50.1.0 0.0.0.255 eq 443 host 10.50.9.30\n    20 permit icmp 10.50.1.0 0.0.0.255 any echo (812 matches)\n    30 permit udp 10.50.1.0 0.0.0.255 host 10.50.9.53 eq domain (3410 matches)\n    40 deny ip any any log (1906 matches)", o:["The ACL is applied in the wrong direction","Line 10 has the port on the source side, so it only matches packets from port 443; the agents' requests fall through to line 40","Line 20 permits too much and shadows line 10","The DNS line must come first"], a:1, why:"Line 10 has no matches while the deny is busy. Agents send from ephemeral ports to 443, so the port belongs after the destination: permit tcp 10.50.1.0 0.0.0.255 host 10.50.9.30 eq 443. Line 20 is ICMP, so it can't shadow TCP; working pings and DNS show the direction is right."},
  {lvl:2, type:"multi", q:"Which two statements about the established keyword are true? (Choose two.)", o:["It matches TCP segments that have the ACK or RST flag set","It records each connection, like a stateful firewall","It lets replies to ping back in","It can be used only on tcp lines","It matches the first SYN of a new connection"], a:[0,3], why:"established tests the ACK/RST flags, so it matches everything in a TCP conversation except the opening SYN, and IOS accepts it only on tcp lines. It keeps no state, does nothing for ICMP or UDP replies, and by design never matches the first SYN."},
  {lvl:2, type:"order", q:"A packet arrives on G0/0, which has an inbound extended ACL, and is routed out of G0/1, which has an outbound extended ACL. Put the router's steps in order.", items:["The inbound ACL on G0/0 is checked","The router looks up the destination in its routing table","The outbound ACL on G0/1 is checked","The packet is sent out of G0/1"], why:"Inbound filtering happens as the packet arrives, before routing, so a denied packet costs no lookup. Outbound filtering happens after routing has chosen the exit interface. A deny at either list stops the packet there."},
  {lvl:2, q:"Seconds after you apply a new inbound list on a WAN link, show ip ospf neighbor on that router is empty and the log says Neighbor Down: Dead timer expired. The list permits only TCP and UDP services. What is the best fix?", o:["Apply the list outbound instead","Insert permit ospf from the neighbour (or any) as the first line, using a sequence number","Add permit ip any any at the end of the list","Restart OSPF with clear ip ospf process"], a:1, why:"OSPF hellos are IP protocol 89, so the implicit deny drops them and the adjacency dies. One line at the top restores them without weakening the rest. Moving the list outbound changes what it filters; permit ip any any defeats the list; restarting OSPF doesn't help while hellos are still dropped."},
  {lvl:2, q:"R1 has deny icmp any any followed by permit ip any any applied OUTBOUND on G0/1. From R1's own CLI you ping a server on the G0/1 LAN. What happens?", o:["The ping fails with U.U.U","The ping succeeds, because outbound ACLs don't filter packets the router itself creates","The ping succeeds only with ping … source g0/0","The ping fails silently with ....."], a:1, why:"Outbound lists check forwarded traffic. R1's own echoes skip the list, and the replies arrive inbound on G0/1, which has no list. A PC behind R1 pinging the same server would be denied with administratively-prohibited replies."},
  {lvl:2, q:"List 110 has eight lines and is applied inbound on G0/0. An engineer types no access-list 110 deny tcp any any eq telnet. What happens?", o:["Only the telnet line is removed","The whole list 110 is deleted, so G0/0 now filters nothing","IOS rejects the command","The line is disabled but kept"], a:1, why:"On IOS any no access-list N … deletes the entire numbered list. An ip access-group that refers to a list that doesn't exist permits everything. To delete one line: ip access-list extended 110, then no <sequence number>."},
  {lvl:2, type:"fill", q:"Write the global configuration command that renumbers the named list EDGE so it starts at 10 and goes up in steps of 10.", fields:[{label:"Command", a:["ip access-list resequence EDGE 10 10"], ios:true}], why:"ip access-list resequence NAME start step keeps the order and the counters and changes only the numbers — useful when inserted lines have used up the gaps."},
  {lvl:3, q:"The exhibit is from PH-BR1, whose FROM-HQ list is inbound on the WAN interface. The NOC jump host 10.1.99.5 can't SSH to 10.255.0.2. What is the fault, and the fix?", ex:"PH-BR1#show logging | include SEC\n*Oct 12 08:31:38.918: %SEC-6-IPACCESSLOGP: list FROM-HQ denied tcp 10.1.99.5(51000) -> 10.255.0.2(22), 1 packet\nPH-BR1#show access-lists FROM-HQ\nExtended IP access list FROM-HQ\n    5 permit ospf host 10.255.0.1 any\n    10 permit tcp any 10.40.10.0 0.0.0.255 established (12 matches)\n    20 deny tcp any any eq 22 log (3 matches)\n    30 permit tcp host 10.1.99.5 host 10.255.0.2 eq 22\n    40 deny ip any any log", o:["Line 30 has the port on the wrong side","Line 20 matches the jump host's SSH first; move the permit above it (no 30, then e.g. 18 permit tcp host 10.1.99.5 host 10.255.0.2 eq 22)","The list must be applied outbound","established blocks the SYN; remove line 10"], a:1, why:"The log shows TCP from 10.1.99.5 to port 22 denied, and line 20 (any to any, port 22, log) has the matches while line 30 has none: first match wins, so the broad deny shadows the specific permit. Line 30 itself is written correctly; the fix is order."},
  {lvl:3, type:"multi", q:"The exhibit is a guest list applied inbound on the guest VLAN interface (10.70.8.0/24); the company uses 10.0.0.0/8 internally and runs its DNS resolver at 10.70.1.53. Which two statements are true? (Choose two.)", ex:"ip access-list extended GUEST-IN\n 10 permit udp any any eq bootps\n 20 permit icmp 10.70.8.0 0.0.0.255 any echo\n 30 permit udp 10.70.8.0 0.0.0.255 host 10.70.1.53 eq domain\n 40 deny ip 10.70.8.0 0.0.0.255 10.0.0.0 0.255.255.255 log\n 50 permit tcp 10.70.8.0 0.0.0.255 any eq www\n 60 permit tcp 10.70.8.0 0.0.0.255 any eq 443", o:["Guests can ping internal hosts, because line 20 comes before the internal deny","Guests can browse internal web servers on port 80","Guests get DHCP addresses from the router on this interface","Guests' DNS lookups fail because DNS is TCP","Replies from internet web servers are dropped by this list"], a:[0,2], why:"Line 20 permits echo to any destination, including 10.0.0.0/8, before line 40 can deny it — move it below 40. Line 10 lets the Discover in. Internal web is denied by line 40 before 50 is reached; DNS lookups are UDP and match line 30; replies from the internet arrive on another interface, so this inbound list never sees them."},
  {lvl:3, q:"Three sites in a row: the HR LAN behind R1, a WAN core R2, and the server LAN behind R3. HR (10.30.4.0/24) must not reach the payroll server 10.30.99.10 on TCP 1433, but must reach everything else, including other services on that server. You can configure any router. Which is best?", o:["A standard list on R1 G0/0 in: deny 10.30.4.0 0.0.0.255, permit any","An extended list on R1's HR interface inbound: deny tcp 10.30.4.0 0.0.0.255 host 10.30.99.10 eq 1433, then permit ip any any","An extended list on R3's server interface outbound denying all traffic from 10.30.4.0/24","A standard list on R3 G0/0 out: deny 10.30.4.0 0.0.0.255, permit any"], a:1, why:"The rule names a protocol, destination and port, so it needs an extended list, and an extended list belongs near the source: the denied packets die at R1 and never cross the WAN. Both standard options block HR from far more than one service (near R1 from everything, near R3 from the whole server LAN); option C blocks every service on the server, not just 1433."},
  {lvl:3, type:"match", q:"After an ACL change at a branch, match each symptom with its most likely cause.", pairs:[["Everything to HQ fails; tracert ends at the branch router with Destination host unreachable","OSPF hellos denied, so the routes are gone"],["Web to HQ works, but ping says Request timed out","Echo-reply not permitted back in"],["Ping works, but tracert shows * for the middle hop","Time-exceeded not permitted back in"],["New PCs get 169.254 addresses; existing PCs are fine for now","DHCP (UDP 67) denied inbound on the LAN interface"],["The jump host's SSH times out and the log names the broad deny tcp any any eq 22 line","A broad deny above the specific permit"]], why:"Each symptom points at one kind of traffic: a routing failure caused by dropped hellos; a reply type missing on the way back (echo-reply for ping, time-exceeded for traceroute's middle hops); DHCP Discovers dropped where they arrive; and an order problem shown by which line logged the drop."},
],
cards:[
  {f:"Extended ACL — what it matches", b:"Protocol (ip, icmp, tcp, udp, ospf or a number), source and destination (any, host, address + wildcard), and for TCP/UDP source and destination ports; optional ICMP type, established, log. All fields must match."},
  {f:"Extended ACL numbers", b:"100–199 and 2000–2699 (standard: 1–99 and 1300–1999). Or a name: ip access-list extended NAME."},
  {f:"Where the port goes", b:"After the address of the device that listens. To a server: after the destination (… host S eq 443). Replies from the server: after the source (host S eq 443 …)."},
  {f:"Port operators", b:"eq (equal), neq (not equal), lt (less than), gt (greater than), range a b (inclusive). TCP and UDP lines only."},
  {f:"IOS port names", b:"www 80, telnet 23, smtp 25, ftp 21, ftp-data 20, domain 53, bootps 67, bootpc 68, tftp 69, ntp 123, snmp 161, syslog 514. 22 and 443 stay numbers. IOS shows numbers as names."},
  {f:"ICMP types in ACLs", b:"echo (8) ping request · echo-reply (0) · unreachable (3) · time-exceeded (11, traceroute hops) · administratively-prohibited (3/13) · packet-too-big (3/4, path MTU discovery)."},
  {f:"established", b:"TCP only: matches segments with ACK or RST set — replies and the rest of a conversation, never the opening SYN. Not stateful; UDP and ICMP replies need their own lines."},
  {f:"Editing with sequence numbers", b:"ip access-list extended NAME (or number) → 15 permit … inserts; no 20 deletes one line; ip access-list resequence NAME 10 10 renumbers. Changes apply at once. no access-list N … deletes the whole list."},
  {f:"ACL log messages", b:"%SEC-6-IPACCESSLOGP (TCP/UDP, with ports), IPACCESSLOGDP (ICMP type/code), IPACCESSLOGNP (other protocols), IPACCESSLOGS (standard lists). Severity 6. Real IOS logs the first packet, then summaries about every 5 minutes."},
  {f:"Placement", b:"Extended ACLs near the source (precise, drops traffic before it crosses the network); standard ACLs near the destination. One IPv4 ACL per interface per direction."},
  {f:"Inbound ACLs and the control plane", b:"An inbound list sees everything arriving: OSPF hellos (protocol 89), HSRP (UDP 1985), DHCP Discovers (UDP 67), SSH to the router, replies to the router's own traffic. Permit them first."},
  {f:"Outbound ACLs and router traffic", b:"Outbound lists filter only forwarded packets. The router's own pings, hellos and SSH replies are not checked — so a ping from the router proves nothing about users."},
  {f:"Five troubleshooting questions", b:"Right interface? Right direction? Right order? Right fields (protocol, addresses, which side the port is on)? What else crosses the interface (return traffic, routing, DHCP, management)?"},
],
});

// ---------- Module 8 · Lesson 6 ----------
L.push({
id:"sec-port-security", mins:100, level:"Intermediate · builds on Modules 2 and 4",
t:"Port security and access-port hygiene — deciding what may plug into the switch",
html:`
${K.goals([
  "Explain the threats port security answers — an unknown device on a desk port, MAC flooding of the CAM table — and what it cannot stop.",
  "Configure port security: the access-mode requirement, <code>maximum</code>, static, dynamic and sticky secure addresses (STATIC in the MAC table).",
  "Choose shutdown, restrict or protect by what each drops, logs and counts; recover an err-disabled port in the right order; explain <code>errdisable recovery</code>.",
  "Verify and troubleshoot with the <code>show port-security</code> commands, <code>show interfaces status</code> and the log.",
  "Harden every access port: shut and park unused ports, <code>switchport mode access</code> + <code>nonegotiate</code>, an unused native VLAN, <code>no cdp enable</code> at the edge.",
])}
${K.pre(["Module 2: how a switch learns source MACs into its MAC (CAM) table, MAC flooding, shutting unused ports, <code>show interfaces status</code>, CDP.","Module 4: access ports and trunks, DTP and <code>switchport nonegotiate</code>, the native VLAN, the parking VLAN, BPDU guard and err-disabled recovery.","Module 7: syslog severities and DHCP. Lesson 1 of this module: threats, controls and defence in depth."])}

<h2>Why this matters at work</h2>
<p>Monday, 09:10, at a fintech office in Abuja. A contractor couldn't get on the guest Wi-Fi, so he unplugged the finance PC under the nearest desk and plugged in his own laptop. It got an address from the staff DHCP pool and could reach the payments servers. Nothing alerted anyone; the internet firewall never saw him — he was already inside.</p>
<p>The audit asked the question every security review asks: <b>who decides what may plug into a switch port?</b> On a default switch, nobody. Every port is live, learns any MAC address and will even negotiate a trunk with anything that asks. This lesson gives the switch a say — port security on every desk port, then the hygiene settings that close the other doors at the access edge.</p>

<h2>The threat at the edge: unknown devices and a full CAM table</h2>
${K.remember(`<b>The rule in one line:</b> a switch learns whatever <b>source MAC</b> arrives on a port and trusts it (Module 2). ${K.g("Port security","A per-port switch feature that limits which and how many source MACs an access port accepts, and acts when another appears.")} changes &ldquo;learn anything&rdquo; into &ldquo;accept only the addresses I allow, only as many as I allow, and act when something else turns up&rdquo;.`)}
<p>Port security answers two threats at the <b>access edge</b> — the desk sockets, meeting rooms and printer ports where devices join the network.</p>
<h3>Threat 1: an unknown device on a known port</h3>
<p><b>The goal:</b> a foothold inside. Every wall socket is patched to a switch, so whoever plugs in lands in that VLAN with the reach of the PC they unplugged. <b>Why it works:</b> the switch has no idea which device belongs on Gi0/5; it learns the newcomer's MAC in milliseconds. Usually it's innocent — a visitor, a home Wi-Fi router, a personal laptop — but it is still an unapproved device inside. <b>What the team sees without controls:</b> a link down/up in the log, a new MAC, a new DHCP lease. Nobody reads those at 09:10 on a Monday.</p>
<h3>Threat 2: MAC flooding — filling the CAM table</h3>
<p>From Module 2: the MAC table lives in fixed-size ${K.g("CAM","Content Addressable Memory: the hardware holding the MAC address table — CAM table and MAC table mean the same.")} hardware. <b>The goal</b> of a flood is to fill it with made-up source MACs from one port, so real devices can't be learned. Frames to them become unknown unicasts, flooded out of every port — including the flooder's, who can now capture other people's traffic. <b>What it looks like:</b> thousands of MACs on one access port and a slow VLAN. <b>The control:</b> a per-port <b>maximum</b>. If Gi0/5 may hold one secure address, the second made-up MAC is already a violation and the table never fills.</p>
${K.svg("0 0 760 330",
  K.txt(20,20,"One access switch, five ways in — and the control that closes each",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("switch",380,52,"ACC-SW","access edge: desk ports")+
  K.link(80,126,380,108,"",true)+K.link(230,126,380,108,"",true)+K.link(380,126,380,108,"",true)+K.link(530,126,380,108,"",true)+K.link(680,126,380,108,"",true)+
  K.dev("laptop",80,150,"VISITOR LAPTOP","unknown MAC")+
  K.dev("hub",230,150,"DESK SWITCH","6 MACs, 1 socket")+
  K.dev("pc",380,150,"FLOODING HOST","fake MACs by 1000s")+
  K.dev("switch",530,150,"TEST SWITCH","DTP desirable")+
  `<rect x="645" y="134" width="70" height="30" rx="4" fill="var(--panel2)" stroke="var(--muted)" stroke-width="1.3"/>`+K.txt(680,153,"socket",{mid:true,s:10})+
  K.txt(680,184,"SPARE SOCKET",{mid:true,c:"fg",s:11.5,b:true,f:"display"})+K.txt(680,197,"live, in VLAN 1",{mid:true,s:10})+
  K.arrow(80,202,80,216)+K.arrow(230,202,230,216)+K.arrow(380,202,380,216)+K.arrow(530,202,530,216)+K.arrow(680,202,680,216)+
  K.box(12,218,136,46,"port security","max 1, sticky",true)+K.box(162,218,136,46,"maximum N","sized to the desk",true)+K.box(312,218,136,46,"max + shutdown","table can't fill",true)+
  K.box(462,218,136,46,"mode access","+ nonegotiate",true)+K.box(612,218,136,46,"shutdown","+ parking VLAN",true)+
  K.txt(380,292,"On the uplink trunk: an unused native VLAN on both ends (Module 4's double-tagging defence).",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,310,"On every edge port: no cdp enable, so the switch doesn't describe itself to whoever plugs in.",{mid:true,c:"fg",s:11,f:"body"}),
  "The access edge. Port security covers the first three; the hygiene settings later in the lesson cover the rest.")}
<h3>What port security cannot do</h3>
<p>Port security checks only the <b>source MAC</b> — which software can change. So it is a <b>speed bump</b>, not a lock: it stops the accidental and the casual (the contractor, the home router, the hub, the flood) and makes a deliberate intruder leave traces. Proving <i>who</i> is plugged in needs authentication — ${K.g("802.1X","IEEE port-based access control: a device's traffic passes only after it authenticates to a server. Lesson 3.")} (lesson 3). Defence in depth layers the rest: locked comms rooms, DHCP snooping and ${K.g("DAI","Dynamic ARP Inspection: drops ARP messages claiming an IP address the device was never given. Lesson 7.")} (lesson 7), ACLs (lessons 4–5).</p>
${K.check({q:"Overnight, the MAC table on an access switch jumps from 140 entries to the platform's limit, almost all learned on Gi0/14, and users complain that the network is slow. Which port-security setting would have stopped the table filling?", o:["switchport port-security violation protect on the uplink","A per-port maximum on Gi0/14 (for example the default of 1), so the second source MAC is already a violation","switchport nonegotiate on Gi0/14","A static MAC address on the uplink"], a:1, why:"Thousands of source MACs on one access port is the MAC flooding fingerprint. A maximum caps what that port can add to the table; in shutdown mode it err-disables at the first extra MAC. nonegotiate is about DTP, and port security never belongs on an uplink."})}
<h3>Same logic, new situation</h3>
<p>A hotel's conference floor has 40 exhibitor sockets in VLAN 60. On day two the IT lead sees 1,800 MACs on Gi0/31; every other socket has one or two. Is this the Abuja contractor's threat, and what would you put on Gi0/31 next time?</p>
${K.hint(`One unknown device wants a foothold. What do thousands of source MACs want the switch to do?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which threat, which control. <b>2. Which rule?</b> An unknown device is <i>one</i> new MAC (a foothold); flooding is <i>many</i> made-up MACs on one port (to fill the CAM table). A maximum stops the second. <b>3. Apply it:</b> 1,800 MACs is flooding — or innocently a big unmanaged switch, so find out who is there. Port security with <code>maximum 2</code> (a laptop and a display) in shutdown mode would have err-disabled Gi0/31 at the third address and logged it.</p>`)}

<h2>Turning port security on: requirements, maximum and secure addresses</h2>
${K.remember(`<b>The rule:</b> port security is configured <b>per interface</b>, on a port you have <b>nailed down as an access port</b>. <code>switchport port-security</code> alone gives the defaults: <b>maximum 1</b> secure address, learned <b>dynamically</b> from the first frame, violation mode <b>shutdown</b>.`)}
<h3>Requirement: a static access port</h3>
<p>A port left in a ${K.g("dynamic","A DTP mode (auto, the Catalyst default, or desirable) in which a port may negotiate itself into a trunk. Module 4.")} DTP mode might become a trunk, so IOS refuses port security until you decide what the port is:</p>
${K.out(`ABJ-FIN-SW1(config)#interface g0/5
ABJ-FIN-SW1(config-if)#switchport port-security
Command rejected: GigabitEthernet0/5 is a dynamic port.
ABJ-FIN-SW1(config-if)#switchport mode access
ABJ-FIN-SW1(config-if)#switchport port-security
ABJ-FIN-SW1(config-if)#`, "The first rejection everyone meets. switchport mode access first, then port security is accepted.")}
${K.tip(`Catalysts also accept port security on a static trunk (say, to a server with several VMs), but CCNA and most designs use it on access ports. Never on an uplink to another switch: every MAC behind it arrives on one port.`)}
<h3>The commands, one job each</h3>
<div class="tablewrap"><table>
<tr><th>Interface command</th><th>What it does</th><th>Default</th></tr>
<tr><td><code>switchport port-security</code></td><td>Turns it on. Without this line the others are stored but do nothing.</td><td>Off</td></tr>
<tr><td><code>switchport port-security maximum 2</code></td><td>How many secure MACs the port may hold.</td><td>1</td></tr>
<tr><td><code>switchport port-security mac-address 0050.56aa.0740</code></td><td>A <b>configured (static)</b> secure address: you type the MAC.</td><td>none</td></tr>
<tr><td><code>switchport port-security mac-address sticky</code></td><td><b>Sticky learning:</b> learn MACs as they arrive and write each into the running-config.</td><td>dynamic</td></tr>
<tr><td><code>switchport port-security violation restrict</code></td><td>What happens when a frame breaks the rule: <code>shutdown</code>, <code>restrict</code> or <code>protect</code> (next section).</td><td>shutdown</td></tr>
</table></div>
<h3>Three kinds of secure address</h3>
<p>A ${K.g("secure MAC address","A MAC address port security accepts on a port.")} is one the port accepts. Three ways to get one:</p>
<ul>
<li><b>Static (configured)</b> — you type it; precise, but retyped whenever a device is replaced. Shown as <code>SecureConfigured</code>.</li>
<li><b>Dynamic</b> — the default: the first <i>maximum</i> MACs heard. Only in the MAC table, so a reload forgets them (most Catalysts also clear them when the port goes down). <code>SecureDynamic</code>.</li>
<li><b>Sticky</b> — learned, then written into the <b>running-config</b> as <code>switchport port-security mac-address sticky H.H.H</code>. Saved, they survive a reload. <code>SecureSticky</code>.</li>
</ul>
${K.when([
  ["Static (configured)","A device that must never be swapped: CCTV recorder, card terminal, server","The exact MAC is in the config from day one","Hundreds of desks — hand-typed MACs don't scale"],
  ["Sticky","Fixed desks: each port learns its PC once and keeps it","No typing, yet written down and reload-proof once saved","Hot desks and meeting rooms, where a new laptop daily is normal"],
  ["Dynamic","Hot desks, or only capping the count (MAC flooding)","Nothing to maintain; the port forgets addresses","You need a swap caught — after a reload or link drop the next device is simply learned"],
], "Static, sticky or dynamic secure addresses?")}
${K.mistake(`Turning on sticky learning and not saving once the addresses are learned. Sticky addresses live in the <b>running-config</b>. After a power cut the switch boots from a startup-config that has the port-security lines but no learned addresses, and the first device to speak on each port becomes its sticky address, whoever owns it. <code>copy running-config startup-config</code> is part of the change.`)}
<h3>Worked example: the Abuja finance desks</h3>
<p>ABJ-FIN-SW1, staff VLAN 20. Gi0/5 and Gi0/6 are fixed desks (PC-ADA, PC-EMEKA); Gi0/7 feeds the ${K.g("NVR","Network Video Recorder: records the CCTV cameras.")} for the ${K.g("CCTV","Closed-circuit television: the security cameras.")} cameras (MAC 0050.56aa.0740 from its label). Gi0/1, the uplink, gets <b>no</b> port security.</p>
${K.steps([
  ["Nail the desks down, then secure them", "<code>interface range g0/5 - 6</code> · <code>switchport mode access</code> · <code>switchport access vlan 20</code> · <code>switchport port-security</code> · <code>switchport port-security mac-address sticky</code>. Maximum 1, mode shutdown: one PC per desk."],
  ["Pin the recorder", "<code>interface g0/7</code> · access mode and VLAN 20 · <code>switchport port-security</code> · <code>switchport port-security mac-address 0050.56aa.0740</code>."],
  ["Let the devices talk", "Sticky and dynamic addresses are learned from a device's <b>first frame</b>; a PC that is off is learned when it next speaks."],
  ["Verify, then save", "<code>show port-security address</code>, <code>show mac address-table</code>, <code>show running-config</code>, then <code>copy running-config startup-config</code>."],
])}
${K.out(`ABJ-FIN-SW1#show port-security address
               Secure Mac Address Table
-----------------------------------------------------------------------------
Vlan    Mac Address       Type                          Ports   Remaining Age
                                                                   (mins)
----    -----------       ----                          -----   -------------
  20    0050.56a3.1102    SecureSticky                  Gi0/5           -
  20    0050.56a3.1187    SecureSticky                  Gi0/6           -
  20    0050.56aa.0740    SecureConfigured              Gi0/7           -
-----------------------------------------------------------------------------
Total Addresses in System (excluding one mac per port)     : 0
Max Addresses limit in System (excluding one mac per port) : 4096`, "Every secure address and how it was obtained (the dash: no aging configured).")}
${K.out(`ABJ-FIN-SW1#show mac address-table vlan 20
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 20     0050.0c53.0001    DYNAMIC     Gi0/1
 20     0050.56a3.1102    STATIC      Gi0/5
 20     0050.56a3.1187    STATIC      Gi0/6
 20     0050.56aa.0740    STATIC      Gi0/7
Total Mac Addresses for this criterion: 4`, "Secure addresses are STATIC, however obtained; the router's MAC on the uplink is ordinary DYNAMIC.")}
<p>STATIC matters: a secure address isn't aged out by the normal 300-second timer. The running-config shows how each port got its address:</p>
${K.out(`ABJ-FIN-SW1#show running-config | section interface GigabitEthernet0/[567]
interface GigabitEthernet0/5
 switchport access vlan 20
 switchport mode access
 switchport port-security
 switchport port-security mac-address sticky
 switchport port-security mac-address sticky 0050.56a3.1102
interface GigabitEthernet0/6
 switchport access vlan 20
 switchport mode access
 switchport port-security
 switchport port-security mac-address sticky
 switchport port-security mac-address sticky 0050.56a3.1187
interface GigabitEthernet0/7
 switchport access vlan 20
 switchport mode access
 switchport port-security
 switchport port-security mac-address 0050.56aa.0740`, "You typed one sticky line per port; the switch wrote the second, with the MAC it learned.")}
<h3>Sizing the maximum</h3>
<p>Count what is behind each socket: a desk PC, 1; a phone with a PC behind it, 2 (Cisco's guides say 2; many engineers allow 3, because some phones are also learned in the access VLAN). <code>show mac address-table interface g0/5</code> gives today's count — set the maximum to what is <i>approved</i>. (<code>switchport port-security aging time</code> makes a port forget addresses after some minutes; the lab accepts it but doesn't count down.)</p>
<h3>Try it: a Lagos school office switch</h3>
<p>LOS-SCH-SW1, admin block: VLAN 30 ADMIN, VLAN 40 VOICE. Gi0/2–Gi0/4 are the bursar's desks; Gi0/5 the head teacher's (phone + PC); Gi0/6 the CCTV recorder (MAC 0050.56c0.0a77).</p>
${K.term({env:"ios2", title:"LOS-SCH-SW1 — port security to the school's policy", opts:{kind:"switch", host:"LOS-SCH-SW1", model:"C9200L-24T", motd:"LOS-SCH-SW1 — console session. Admin block access switch. VLAN 30 = ADMIN, VLAN 40 = VOICE."},
  setup:env=>{ ["en","conf t","vlan 30","name ADMIN","vlan 40","name VOICE","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; },
  intro:"No cables here, so nothing is learned — this is about the configuration. Start with <code>enable</code> and <code>configure terminal</code>.",
  tasks:[
    {text:"Make the classic mistake on purpose: <code>interface g0/2</code>, then <code>switchport port-security</code> while the port is still dynamic. Read the rejection.", done:e=>e.history.some(h=>/^\s*sw\S*\s+port-s\S*\s*$/i.test(h))},
    {text:"Bursar's desks: <code>interface range g0/2 - 4</code>, <code>switchport mode access</code>, <code>switchport access vlan 30</code>, <code>switchport port-security</code>, <code>switchport port-security mac-address sticky</code>", done:e=>["2","3","4"].every(n=>{ const i=e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===30 && i.psec && i.psecSticky; })},
    {text:"Head teacher's desk Gi0/5: access VLAN 30, <code>switchport voice vlan 40</code>, port security with <code>maximum 2</code> (phone + PC) and <code>violation restrict</code> — a third device is dropped and logged, but the phone keeps working", done:e=>{ const i=e.intfs["GigabitEthernet0/5"]; return i.mode==="access" && i.vlan===30 && i.voiceVlan===40 && i.psec && i.psecMax===2 && i.psecViol==="restrict"; }},
    {text:"CCTV recorder on Gi0/6: access port, port security with the configured address <code>0050.56c0.0a77</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/6"]; return i.mode==="access" && i.psec && (i.psecMacs||[]).some(m=>m.mac==="0050.56c0.0a77" && m.type==="static"); }},
    {text:"A safety net in global configuration: <code>errdisable recovery cause psecure-violation</code> and <code>errdisable recovery interval 600</code> (retry after ten minutes — next section explains the trade-off)", done:e=>(e.errRecovery||[]).includes("psecure-violation") && e.errRecoveryInt===600},
    {text:"<code>end</code>, then <code>show port-security</code> (one row per secured port — check MaxSecureAddr and Security Action) and save with <code>copy running-config startup-config</code>", done:e=>e.savedOnce && e.history.some(h=>/^\s*sh\S*\s+port-s\S*\s*$/i.test(h))},
  ],
  win:"The school's policy as configuration: three sticky desk ports, a phone desk sized for two devices in restrict mode, a recorder pinned to its own MAC, automatic recovery after ten minutes, all saved. show port-security lists five secured ports with CurrentAddr 0 for the learned ones — nothing has talked yet — and 1 for the recorder's configured address.",
  solve:["enable","configure terminal","interface g0/2","switchport port-security","interface range g0/2 - 4","switchport mode access","switchport access vlan 30","switchport port-security","switchport port-security mac-address sticky","interface g0/5","switchport mode access","switchport access vlan 30","switchport voice vlan 40","switchport port-security","switchport port-security maximum 2","switchport port-security violation restrict","interface g0/6","switchport mode access","switchport port-security","switchport port-security mac-address 0050.56c0.0a77","exit","errdisable recovery cause psecure-violation","errdisable recovery interval 600","end","show port-security","copy running-config startup-config",""]})}
${K.hint(`Port security is refused until <code>switchport mode access</code>. The maximum and violation lines can come in any order; IOS lists them its own way. <code>errdisable recovery</code> is global: <code>exit</code> the interface first.`)}
${K.check({q:"Which kind of secure address survives a reload without anyone typing a MAC address?", o:["Dynamic","Sticky — once the running-config has been saved","Static (configured)","None: every secure address is lost at a reload"], a:1, why:"Sticky addresses are learned and written into the running-config; saved, they come back after a reload. Dynamic addresses live only in the MAC table; static ones survive but had to be typed."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A bank branch has a teller desk on Gi0/12 with an IP phone and a PC behind it, and a cash-counting machine on Gi0/13 that must never be swapped (MAC 0050.56e1.33c0). Type the interface command that sizes Gi0/12 for its devices, and the one that pins Gi0/13 to its machine.", fields:[{label:"Gi0/12", a:["switchport port-security maximum 2"], ios:true},{label:"Gi0/13", a:["switchport port-security mac-address 0050.56e1.33c0","switchport port-security mac-address 0050.56E1.33C0"], ios:true}], why:"1. What is asked? A maximum for a two-device desk, and a pinned device. 2. Which rule? The maximum counts every source MAC behind the socket (phone + PC = 2); a device that must never change gets a configured (static) secure address. 3. Apply it: maximum 2 on Gi0/12; switchport port-security mac-address 0050.56e1.33c0 on Gi0/13. Both still need switchport mode access and switchport port-security."})}

<h2>Violation modes and err-disabled: what happens when the rule is broken</h2>
${K.remember(`<b>The rule:</b> a <b>violation</b> is a frame from a MAC that is not secure on this port, arriving when the port already holds its maximum. Frames from secure addresses are never the problem. The <b>violation mode</b> decides the rest: drop it quietly (<b>protect</b>), drop and report it (<b>restrict</b>), or shut the whole port (<b>shutdown</b>, the default).`)}
${K.svg("0 0 760 330",
  K.box(20,24,190,50,"Frame arrives","on a secure access port")+
  K.arrow(212,49,268,49)+
  K.box(270,24,220,50,"Source MAC secure here?","static · sticky · dynamic")+
  K.arrow(492,49,548,49,"yes",true)+
  K.box(550,24,190,50,"Forward it","normal switching",true)+
  K.arrow(380,76,380,110)+K.txt(392,97,"no",{s:10.5})+
  K.box(270,112,220,50,"Fewer than maximum?","secure count &lt; maximum")+
  K.arrow(492,137,548,137,"yes",true)+
  K.box(550,112,190,50,"Learn it, forward it","dynamic, or sticky → config")+
  K.arrow(380,164,380,194)+K.txt(392,184,"no",{s:10.5})+
  K.txt(380,210,"VIOLATION — the port's mode decides what happens",{mid:true,c:"bad",s:11.5,b:true,f:"body"})+
  K.box(20,222,230,54,"protect","drop · no log · no count")+K.box(265,222,230,54,"restrict","drop · log · count +1 · port up")+K.box(510,222,230,54,"shutdown (default)","err-disable · log · count +1")+
  K.txt(380,302,"Only the SOURCE MAC is checked. In protect and restrict, secure devices keep working;",{mid:true,s:11,f:"body"})+
  K.txt(380,320,"in shutdown mode the whole port stops — for every device on it, secure or not.",{mid:true,s:11,f:"body"}),
  "How a secure port decides, frame by frame.")}
<div class="tablewrap"><table>
<tr><th>Mode</th><th>Offending frames</th><th>Log message (syslog/SNMP)</th><th>Violation counter</th><th>The port</th></tr>
<tr><td><b>protect</b></td><td>Dropped</td><td>None</td><td>Not increased</td><td>Stays up; secure devices keep working</td></tr>
<tr><td><b>restrict</b></td><td>Dropped</td><td><code>%PORT_SECURITY-2-PSECURE_VIOLATION</code></td><td>+1 for each violation</td><td>Stays up; secure devices keep working</td></tr>
<tr><td><b>shutdown</b> (default)</td><td>Dropped — with everything else</td><td><code>%PM-4-ERR_DISABLE</code> + <code>PSECURE_VIOLATION</code></td><td>+1</td><td><b>err-disabled</b>: down for everyone until recovered</td></tr>
</table></div>
<p>(Cisco's configuration-guide summary table marks shutdown &ldquo;no syslog, no trap&rdquo;; its own description of the mode, and real switches, log both lines.)</p>
${K.remember(`<b>P-R-S, from quietest to loudest:</b> <b>P</b>rotect = <i>Peace and quiet</i> (drop only). <b>R</b>estrict = <i>Report it</i> (drop, log, count). <b>S</b>hutdown = <i>Slam the door</i> (the whole port goes err-disabled). Only shutdown changes the port's state.`)}
<h3>Shutdown: the port goes err-disabled</h3>
<p>A week later the contractor tries again: he unplugs PC-ADA from Gi0/5 and plugs in his laptop (0050.56c8.9e01). Its first frame, an ARP for the gateway, meets a port that already holds its one sticky address:</p>
${K.out(`ABJ-FIN-SW1#show logging | include PSECURE|ERR_DISABLE|UPDOWN
*Oct 12 08:30:49.959: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/5, changed state to down
*Oct 12 08:30:56.096: %LINK-3-UPDOWN: Interface GigabitEthernet0/5, changed state to down
*Oct 12 08:31:03.233: %LINK-3-UPDOWN: Interface GigabitEthernet0/5, changed state to up
*Oct 12 08:31:10.370: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/5, changed state to up
*Oct 12 08:31:17.507: %PM-4-ERR_DISABLE: psecure-violation error detected on Gi0/5, putting Gi0/5 in err-disable state
*Oct 12 08:31:24.644: %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0050.56c8.9e01 on port GigabitEthernet0/5.
*Oct 12 08:31:31.781: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/5, changed state to down
*Oct 12 08:31:38.918: %LINK-3-UPDOWN: Interface GigabitEthernet0/5, changed state to down`, "PC-ADA unplugged (down), the laptop plugged in (up), the violation and its MAC, then the switch takes the port down.")}
<p><code>%PM-4-ERR_DISABLE</code> gives the reason; <code>%PORT_SECURITY-2-PSECURE_VIOLATION</code> names the MAC. The 2 is severity <b>critical</b> (Module 7), so it reaches a log server even at a strict trap level.</p>
${K.out(`ABJ-FIN-SW1#show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Gi0/1                        connected    20         a-full   a-1000 10/100/1000BaseTX
Gi0/5                        err-disabled 20         auto     auto   10/100/1000BaseTX
Gi0/6                        connected    20         a-full   a-1000 10/100/1000BaseTX
Gi0/7                        connected    20         a-full   a-1000 10/100/1000BaseTX
ABJ-FIN-SW1#show port-security interface g0/5
Port Security              : Enabled
Port Status                : Secure-shutdown
Violation Mode             : Shutdown
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0050.56c8.9e01:20
Security Violation Count   : 1`, "Trimmed to the interesting ports. err-disabled in the status list; Secure-shutdown, one violation and the laptop's MAC as the last source.")}
<p>The user sees an unplugged cable: no link (amber LED on many Catalysts), <code>Media disconnected</code> in Windows — so these tickets arrive as &ldquo;my cable is broken&rdquo;.</p>
${K.mistake(`Bouncing the port with the cause still plugged in: the laptop's next frame err-disables it again, with a second violation logged. Remove the cause first.`)}
<h3>Recovering an err-disabled port</h3>
${K.svg("0 0 760 190",
  K.txt(20,20,"From violation back to Secure-up — the order matters",{c:"fg",s:12.5,b:true,f:"body"})+
  K.box(10,38,128,54,"Violation","2nd MAC on Gi0/5")+K.arrow(140,65,161,65)+
  K.box(163,38,128,54,"err-disabled","link down, amber LED")+K.arrow(293,65,314,65)+
  K.box(316,38,128,54,"Remove the cause","unplug, or approve",true)+K.arrow(446,65,467,65)+
  K.box(469,38,128,54,"Bounce the port","shutdown, no shutdown")+K.arrow(599,65,620,65)+
  K.box(622,38,128,54,"Secure-up","verify + ticket note",true)+
  K.txt(380,122,"errdisable recovery cause psecure-violation automates step 4 after the interval (300 s by default).",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,142,"It can never do step 3: if the cause is still plugged in, the port fails again and flaps every interval.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,170,"Lab note: the bench clock moves only when a task moves it, so in this lesson's bench you recover by hand.",{mid:true,s:10.5,f:"body"}),
  "Manual recovery is the same as for BPDU guard in Module 4: cause first, then shutdown / no shutdown.")}
${K.steps([
  ["Find out why", "<code>show logging | include PSECURE</code> names the MAC; <code>show port-security interface</code> confirms port and mode. Then: whose MAC is it?"],
  ["Remove the cause — or approve it", "Unplug the visitor, reconnect the right PC. For a legitimate replacement, forget the old sticky address with <code>clear port-security sticky interface Gi0/5</code>."],
  ["Bounce the port", "<code>interface g0/5</code> · <code>shutdown</code> · <code>no shutdown</code>. Shutdown clears err-disabled; no shutdown brings the port back."],
  ["Verify and record", "connected, Secure-up, the user works. Note whose MAC it was — this was a security event."],
])}
<p><code>errdisable recovery cause psecure-violation</code> makes the switch do the bounce itself after <code>errdisable recovery interval</code> seconds (300 by default) — the trade-off you met with BPDU guard:</p>
${K.when([
  ["Manual recovery (the default)","Office desks: a violation should mean a conversation","Every swap gets looked at","Sites with no on-site IT, where a dead port waits days"],
  ["errdisable recovery cause psecure-violation (+ interval)","Remote branches, clinical or production areas","The port heals itself once the cause is gone","Nobody reads the logs — a port failing every interval goes unnoticed"],
], "Recover by hand, or let the switch retry?")}
<h3>Restrict and protect: the port stays up</h3>
<p>Emeka plugged a small desk switch into Gi0/6 so his own laptop could share it. Gi0/6 had been set to <code>violation restrict</code>:</p>
${K.out(`ABJ-FIN-SW1#show interfaces status | include Gi0/6
Gi0/6                        connected    20         a-full   a-1000 10/100/1000BaseTX
ABJ-FIN-SW1#show port-security interface g0/6
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0050.56a3.1187:20
Security Violation Count   : 3
ABJ-FIN-SW1#show logging | include PSECURE
*Oct 12 08:30:56.096: %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0050.56d2.40aa on port GigabitEthernet0/6.`, "Trimmed to the last log line. Connected and Secure-up: PC-EMEKA (the sticky address) works; the laptop's frames are dropped, counted (3) and logged with its MAC.")}
<p>The trap: <b>Last Source Address</b> is just the last MAC heard — here Emeka's own PC. The culprit is in the log. In <b>protect</b> mode the laptop is dropped the same way, but the counter stays 0 and nothing is logged: the port looks healthy while one device on it silently fails.</p>
${K.when([
  ["shutdown","Ordinary desks: one approved device, and a swap must stop everything","Loud and certain: someone has to look","A phone or other approved device must keep working through a violation"],
  ["restrict","Phone desks, and during a rollout to see what would be caught","Drops and reports, port stays up","You need the intruder's port stopped completely"],
  ["protect","Rarely: capping the count where logs would flood","No log noise","Almost always — nobody learns anything was blocked"],
], "Which violation mode?")}
${K.myth([
  ["Protect is the most secure violation mode.","It is the quietest: it drops like restrict but logs and counts nothing, so nobody learns a violation happened."],
  ["Port security stops anyone who copies an allowed MAC address.","It checks the source MAC only. With the real device unplugged, a copied MAC passes; 802.1X (lesson 3) authenticates the device itself."],
  ["Sticky addresses survive a reload automatically.","They are in the running-config; only copy running-config startup-config makes them survive a reload."],
  ["errdisable recovery fixes a port-security problem.","It only re-enables the port. If the cause is still plugged in, the port fails again every interval."],
])}
${K.dyk(`err-disabled is the switch saying &ldquo;I shut this port, not a person&rdquo;. Port security, BPDU guard (Module 4) and DHCP snooping rate limits (lesson 7) all use it; <code>show interfaces status</code> shows each as <code>err-disabled</code> and the log gives the reason.`)}
<h3>Hands-on: lock the Kano clinic's front desk, then catch a swapped cable</h3>
<p>A diagnostics clinic in Kano: KN-SW1 Gi0/2 reception, Gi0/3 the lab desk, Gi0/4 the shared printer, Gi0/1 the uplink to KN-R1. Secure the desks, pin the printer, play the visitor who swaps a cable — and recover properly.</p>
${K.bench({id:"m8-psec-kano", points:100, openLog:true, from:"CCNA · Module 8 · lesson 6", title:"Kano clinic: secure the desk ports, catch the swap, recover in the right order", viewBox:"0 0 760 300",
  intro:"<b>Design:</b> LAN 10.50.20.0/24, gateway KN-R1 .1 (also DHCP). PC-RECEPTION .21 on Gi0/2, PC-LAB .22 on Gi0/3, PRINTER .50 on Gi0/4 (MAC 0050.56b1.2f40). VISITOR is set to obtain an address automatically and isn't plugged in. Console: Terminal app on YOUR LAPTOP, 9600 8N1. <b>Lab notes:</b> dynamic secure addresses are forgotten when the link goes down, as on real Catalysts — hence sticky here; the bench clock only moves when a task moves it, so you recover the port by hand (a real switch with <code>errdisable recovery</code> retries after the interval).",
  devices:[
    {id:"r1", kind:"router", label:"KN-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname KN-R1","no ip domain-lookup","int g0/0","description CLINIC LAN","ip address 10.50.20.1 255.255.255.0","no shut","exit","ip dhcp excluded-address 10.50.20.1 10.50.20.99","ip dhcp pool CLINIC","network 10.50.20.0 255.255.255.0","default-router 10.50.20.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KN-SW1", x:300, y:20, config:e=>{ ["en","conf t","hostname KN-SW1","no ip domain-lookup","int g0/1","description UPLINK KN-R1 G0/0","switchport mode access","int g0/2","description RECEPTION","int g0/3","description LAB DESK","int g0/4","description PRINTER","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"prec", kind:"pc", label:"PC-RECEPTION", x:20, y:180, ip:"10.50.20.21", mask:"255.255.255.0", gw:"10.50.20.1", mac:"0050.56b1.0a21"},
    {id:"plab", kind:"pc", label:"PC-LAB", x:150, y:180, ip:"10.50.20.22", mask:"255.255.255.0", gw:"10.50.20.1", mac:"0050.56b1.0a22"},
    {id:"prn", kind:"printer", label:"PRINTER", x:280, y:180, ip:"10.50.20.50", mask:"255.255.255.0", gw:"10.50.20.1", mac:"0050.56b1.2f40"},
    {id:"vis", kind:"laptop", label:"VISITOR", x:440, y:180, dhcp:true, mac:"0050.56f7.e413"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:610, y:180},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"prec:eth", b:"sw:g2"}, {type:"cat6", a:"plab:eth", b:"sw:g3"}, {type:"cat6", a:"prn:eth", b:"sw:g4"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console to KN-SW1, <code>enable</code>. Read <code>show interfaces status</code> and <code>show port-security</code>: which ports are live, and how many are secured today?", done:B=>Bench.consoleOk(B,"sw") && B.devs.sw.env.history.some(h=>/^\s*sh\S*\s+port-s\S*\s*$/i.test(h))},
    {text:"Desk ports Gi0/2–Gi0/3 in one go: <code>interface range g0/2 - 3</code>, <code>switchport mode access</code>, <code>switchport port-security</code>, <code>switchport port-security mac-address sticky</code>", done:B=>["GigabitEthernet0/2","GigabitEthernet0/3"].every(n=>{ const i=B.devs.sw.env.intfs[n]; return i.mode==="access" && i.psec && i.psecSticky; })},
    {text:"The printer never moves: on Gi0/4 an access port with port security and the configured address <code>switchport port-security mac-address 0050.56b1.2f40</code>", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/4"]; return i.mode==="access" && i.psec && (i.psecMacs||[]).some(m=>m.mac==="0050.56b1.2f40" && m.type==="static"); }},
    {text:"Make the desks talk: ping the printer (10.50.20.50) from PC-RECEPTION and from PC-LAB. Then on KN-SW1: <code>show port-security address</code> (which type is each?), <code>show mac address-table</code> (and there?) and <code>show running-config</code> — find the lines the switch wrote itself", done:B=>{ const h=B.devs.sw.env.history; return Bench.secureMacs(B,"sw","g2").some(m=>/sticky$/.test(m)) && Bench.secureMacs(B,"sw","g3").some(m=>/sticky$/.test(m)) && h.some(x=>/sh\S*\s+port-s\S*\s+add/i.test(x)) && h.some(x=>/sh\S*\s+mac\S*\s+add/i.test(x)); }},
    {text:"Save, so the sticky addresses survive a power cut: <code>copy running-config startup-config</code>", done:B=>B.devs.sw.env.savedOnce && JSON.stringify(B.devs.sw.env.startup||{}).includes("0050.56b1.0a22")},
    {text:"Now be the visitor: unplug PC-LAB's cable from Gi0/3, plug VISITOR into Gi0/3 with a Cat6 from the tray, and run <code>ipconfig</code> on VISITOR. What does the laptop see — and what did KN-SW1 do (frame log)?", done:B=>Bench.errdis(B,"sw","g3")==="psecure-violation" && Bench.tried(B,"vis",/ipconfig/i)},
    {text:"Read the evidence on KN-SW1: <code>show logging</code> (which two messages, and whose MAC — compare VISITOR's <code>ipconfig /all</code>), <code>show interfaces status</code> and <code>show port-security interface g0/3</code> (Port Status, count, Last Source Address)", done:B=>{ const h=B.devs.sw.env.history; return Bench.psecViolations(B,"sw","g3")>0 && h.some(x=>/sh\S*\s+log/i.test(x)) && h.some(x=>/sh\S*\s+port-s\S*\s+int/i.test(x)); }},
    {text:"Recover in the right order: unplug VISITOR, put PC-LAB back on Gi0/3, then on KN-SW1 <code>interface g0/3</code>, <code>shutdown</code>, <code>no shutdown</code>. Done when Gi0/3 is up and PC-LAB pings its gateway 10.50.20.1 (try the bounce with VISITOR still plugged in first, if you want to see why the order matters)", done:B=>!Bench.errdis(B,"sw","g3") && Bench.psecViolations(B,"sw","g3")>0 && Bench.linked(B,"plab:eth","sw:g3") && Bench.pinged(B,"plab","10.50.20.1")},
  ],
  win:"You secured two desks with sticky learning (written into the config and saved), pinned the printer to its MAC, and watched secure addresses appear as STATIC in the MAC table. The visitor's laptop asked for an address the moment it was plugged in, broke the rule with its first frame, and Gi0/3 went err-disabled — the laptop saw only Media disconnected. The log named its MAC; you removed the cause before bouncing the port, and PC-LAB was back in seconds.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces status"],["term","show port-security"],
    ["term","configure terminal"],["term","interface range g0/2 - 3"],["term","switchport mode access"],["term","switchport port-security"],["term","switchport port-security mac-address sticky"],
    ["term","interface g0/4"],["term","switchport mode access"],["term","switchport port-security"],["term","switchport port-security mac-address 0050.56b1.2f40"],["term","end"],
    ["pc","prec","ping 10.50.20.50"],["pc","plab","ping 10.50.20.50"],["term","show port-security address"],["term","show mac address-table"],["term","show running-config"],
    ["term","copy running-config startup-config"],["term",""],
    ["unplug","plab:eth"],["plug","cat6","vis:eth","sw:g3"],["pc","vis","ipconfig"],["pc","vis","ipconfig /all"],
    ["term","show logging"],["term","show interfaces status"],["term","show port-security interface g0/3"],
    ["unplug","vis:eth"],["plug","cat6","plab:eth","sw:g3"],["term","configure terminal"],["term","interface g0/3"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["pc","plab","ping 10.50.20.1"],["term","show port-security interface g0/3"]]})}
${K.hint(`Task 4: addresses are learned from a device's first frame. Task 6: a DHCP laptop sends a Discover the moment its link comes up — that frame is the violation. Task 7: the MAC in the <code>PSECURE_VIOLATION</code> line is VISITOR's Physical Address, with dots instead of dashes.`)}
${K.check({q:"Gi0/8 is in violation restrict mode with maximum 1. A user's PC (the sticky address) works, but a second laptop on a desk switch behind it can't reach anything. What does the network team see?", o:["Gi0/8 err-disabled, one violation","Gi0/8 connected; the violation count rising and a %PORT_SECURITY-2-PSECURE_VIOLATION line naming the laptop's MAC","Gi0/8 connected; nothing logged and the count at 0","Gi0/8 err-disabled with no log message"], a:1, why:"Restrict drops, logs and counts each violation but leaves the port up for the secure address. Silent with count 0 would be protect; err-disabled would be shutdown."})}
<h3>Same logic, new situation</h3>
<p>A Lagos warehouse uses <code>violation protect</code>, maximum 1, sticky on its scanner docks. A new dock on Gi0/14 has never worked; the port says connected, violation count 0, and still holds the old dock's sticky address. What is happening, and what would make the next one visible?</p>
${K.hint(`Which mode drops without counting or logging? Which address does the port think belongs there?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why it fails without evidence, and how to get evidence. <b>2. Which rule?</b> A non-secure MAC on a port at its maximum is a violation; <b>protect</b> drops it silently and the port stays up. <b>3. Apply it:</b> every frame from the new dock is dropped — connected, count 0, no log. Remove the old sticky address (<code>clear port-security sticky interface Gi0/14</code>). <b>Restrict</b> would drop the same frames but log and count them, turning the next swap into a PSECURE_VIOLATION line instead of a mystery.</p>`)}

${K.drill({title:"what happens to this frame and the port?", types:["psecviol"], count:5})}
<h2>Verifying and troubleshooting port security</h2>
${K.remember(`<b>The rule:</b> read three things in this order: what the port <b>is</b> (<code>show interfaces status</code>: connected or err-disabled), what it <b>allows</b> (maximum, mode, which secure addresses), and what it has <b>seen</b> (the violation count, and the culprit's MAC in the log).`)}
<div class="tablewrap"><table>
<tr><th>Command</th><th>The question it answers</th></tr>
<tr><td><code>show port-security</code></td><td>The whole switch: every secured port with MaxSecureAddr, CurrentAddr, violation count and action</td></tr>
<tr><td><code>show port-security interface g0/5</code></td><td>One port: Port Status, mode, maximum, configured/sticky counts, last source MAC, violation count</td></tr>
<tr><td><code>show port-security address</code></td><td>Every secure MAC with VLAN, port and type</td></tr>
<tr><td><code>show mac address-table</code></td><td>Secure addresses as <code>STATIC</code></td></tr>
<tr><td><code>show interfaces status</code> (<code>| include err</code>)</td><td>Which ports are err-disabled (<code>show interfaces status err-disabled</code> lists only those, with a reason column)</td></tr>
<tr><td><code>show logging | include PSECURE</code></td><td>Who did it: the offending MAC and port</td></tr>
</table></div>
<p>Port Status: <b>Secure-up</b> = on and working; <b>Secure-shutdown</b> = err-disabled by a violation; <b>Secure-down</b> = on, but no link or administratively shut.</p>
<h3>Fingerprints</h3>
<div class="tablewrap"><table>
<tr><th>The user says</th><th>Fingerprint</th><th>Cause → fix</th></tr>
<tr><td>&ldquo;My cable is broken&rdquo;</td><td>err-disabled; Secure-shutdown; a <code>PSECURE_VIOLATION</code> line</td><td>Swapped or extra device, shutdown mode → remove the cause, bounce the port</td></tr>
<tr><td>&ldquo;Light on, no network&rdquo;</td><td>connected; count rising; <code>PSECURE_VIOLATION</code> lines</td><td>restrict: device isn't the secure address (new PC, dock) → clear the old sticky address or raise the maximum if approved</td></tr>
<tr><td>&ldquo;Light on, no network&rdquo;</td><td>connected; count 0; no log</td><td>protect dropping silently → same fix, then use restrict</td></tr>
<tr><td>&ldquo;Since the power cut, desk 4 is dead&rdquo;</td><td>The sticky address is someone else's MAC</td><td>Sticky addresses not saved after learning; whoever spoke first was learned → correct it, save</td></tr>
<tr><td>&ldquo;My phone works, my PC doesn't&rdquo;</td><td>maximum 1 on a phone desk in restrict mode (in shutdown mode the phone would die too)</td><td>→ <code>switchport port-security maximum 2</code></td></tr>
</table></div>
${K.exam(`Reading a port-security question: before the options, write down <b>1.</b> the <b>maximum</b> (default 1), <b>2.</b> how many MACs arrive, <b>3.</b> which addresses are secure and how (sticky — saved?), <b>4.</b> the <b>mode</b> (default shutdown). Then predict: forwarded, logged, counted, port state. Traps: protect doesn't count; restrict keeps the port up; access mode comes first.`)}
${K.job("“Hot desk 4: the light's on but nothing works”",`
<p><b>The ticket.</b> 08:50, a Lagos fintech: &ldquo;New starter at hot desk 4, 3rd floor. Laptop on the dock, network light on, Windows says no internet. Yesterday's person was fine.&rdquo;</p>
<p><b>Questions first.</b> Desk 4 is patched to LOS-HQ-SW3 Gi0/7. What changed? A new laptop and a new dock — and a dock has its own network card, so a new MAC.</p>
<p><b>Checks,</b> in the rule's order — what the port is, what it allows, what it has seen:</p>
${K.out(`LOS-HQ-SW3#show interfaces status | include Gi0/7
Gi0/7     HOT DESK 4         connected    20         a-full   a-1000 10/100/1000BaseTX
LOS-HQ-SW3#show port-security interface g0/7
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0050.56d9.7d04:20
Security Violation Count   : 27
LOS-HQ-SW3#show port-security address
...
  20    0050.56d9.1e22    SecureSticky                  Gi0/7           -`, "Trimmed. Connected and Secure-up, so not shutdown mode; 27 violations; the sticky address isn't the dock's MAC.")}
<p><b>Diagnosis.</b> Months ago the port learned the first dock ever used there as its sticky address. Today's dock is new, so restrict mode drops and counts its every frame — light on, nothing works. Not the laptop's fault: a hot desk configured like a fixed desk.</p>
<p><b>Fix.</b> Facilities confirm the dock is company kit (asset tag). Clear the stale sticky address — on this Catalyst <code>clear port-security sticky interface Gi0/7</code> — and the dock is learned from its next frame. Teams opens.</p>
<p><b>Verify.</b> <code>show port-security address</code> lists 0050.56d9.7d04 as SecureSticky on Gi0/7; no new PSECURE lines after 08:58.</p>
<p><b>What you say.</b> &ldquo;That socket remembered the first device ever plugged into it, and your new dock isn't it. I've reset it — it isn't your laptop, and I'm raising a change so the next person doesn't hit it.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;LOS-HQ-SW3 Gi0/7 (hot desk 4): restrict, max 1, stale sticky 0050.56d9.1e22; new dock 0050.56d9.7d04 dropped (27 violations). Asset verified; sticky cleared 08:57; user OK. Change request: hot-desk ports to dynamic learning with aging; longer term 802.1X.&rdquo;</i></p>`)}
${K.check({q:"show port-security interface g0/3 shows Port Status Secure-down. What does that tell you?", o:["A violation err-disabled the port","Port security is enabled but the port has no link, or is administratively shut","Port security is disabled on the port","The port has reached its maximum and is dropping frames"], a:1, why:"Secure-down = port security configured, port not up (unplugged or shut). A violation in shutdown mode shows Secure-shutdown; a port at its maximum that is still working shows Secure-up."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"Read the exhibit from a branch switch. How many more devices could the port accept before its next violation, and what will happen to the port when that violation comes?", ex:"BR-SW2#show port-security interface g0/9\nPort Security              : Enabled\nPort Status                : Secure-up\nViolation Mode             : Shutdown\nAging Time                 : 0 mins\nAging Type                 : Absolute\nSecureStatic Address Aging : Disabled\nMaximum MAC Addresses      : 3\nTotal MAC Addresses        : 2\nConfigured MAC Addresses   : 1\nSticky MAC Addresses       : 1\nLast Source Address:Vlan   : 0050.56b0.7731:10\nSecurity Violation Count   : 0", fields:[{label:"More devices accepted", a:["1","one"]},{label:"Port state after the violation", a:["err-disabled","err disabled","errdisabled","err-disable","error disabled","secure-shutdown"]}], why:"1. What is asked? Room left under the maximum, and the result of the next violation. 2. Which rule? A new MAC is learned while Total is below Maximum; after that, the violation mode decides. 3. Apply it: maximum 3, total 2 (one configured, one sticky), so one more device is learned (sticky, since sticky learning is on). The device after that is a violation, and Shutdown mode err-disables the port (Port Status: Secure-shutdown)."})}

<h2>Access-port hygiene: the rest of the edge</h2>
${K.remember(`<b>The rule:</b> every access port is either <b>in use and nailed down</b> (access mode, DTP off, its VLAN, port security, no CDP to the desk) or <b>shut and parked</b>. No port is left to decide for itself what it is.`)}
<p>Port security answers &ldquo;which device?&rdquo;. The other doors are settings from Modules 2 and 4 — here they become a security baseline:</p>
<div class="tablewrap"><table>
<tr><th>Baseline item</th><th>Commands</th><th>What it stops</th></tr>
<tr><td><b>Unused ports shut</b> (M2)</td><td><code>interface range g0/9 - 12</code> · <code>shutdown</code></td><td>Plugging into a spare socket and landing on the network</td></tr>
<tr><td><b>Unused ports parked</b> (M4)</td><td><code>switchport access vlan 999</code> (PARKING)</td><td>A port enabled by mistake reaching anything: the ${K.g("parking VLAN","An unused VLAN (often 999) with no gateway or devices, for unused ports.")} has no SVI, gateway or DHCP</td></tr>
<tr><td><b>Access mode, DTP off</b> (M4)</td><td><code>switchport mode access</code> · <code>switchport nonegotiate</code></td><td>A desk port negotiating a trunk and receiving every VLAN</td></tr>
<tr><td><b>Unused native VLAN</b> (M4)</td><td><code>switchport trunk native vlan 99</code>, both ends</td><td>Double tagging, which needs a device in the native VLAN</td></tr>
<tr><td><b>No CDP to the desk</b> (M2)</td><td><code>no cdp enable</code> (LLDP: <code>no lldp transmit</code>)</td><td>The switch announcing its name, model, software version and management address to whoever plugs in</td></tr>
<tr><td><b>Port security</b> + BPDU guard (M4)</td><td>this lesson; <code>spanning-tree bpduguard enable</code></td><td>Unknown or extra devices, MAC flooding, a switch on a desk port</td></tr>
</table></div>
<p><b>Shut and park:</b> a shut port is a locked door; a parked port opens onto an empty room. <b>Access mode and nonegotiate:</b> a Catalyst port defaults to <code>dynamic auto</code> and trunks if the far end asks — ${K.g("switch spoofing","A desk-port device negotiating a trunk with DTP to receive every VLAN.")} relies on exactly that. Access mode removes the possibility; nonegotiate stops DTP frames altogether. IOS refuses <code>nonegotiate</code> on a dynamic port — mode first:</p>
${K.out(`ABJ-FIN-SW1(config)#interface g0/8
ABJ-FIN-SW1(config-if)#switchport nonegotiate
Command rejected: Conflict between 'nonegotiate' and 'dynamic' status.`, "The same order as port security: decide what the port is, then lock it.")}
<p><b>Native VLAN:</b> an unused one (99, never given to a device) leaves a double-tagged frame nowhere to start. Change <b>both ends</b>; CDP reports a mismatch as <code>%CDP-4-NATIVE_VLAN_MISMATCH</code>. <b>CDP:</b> anyone on a desk port can read the same announcements you used in Module 2. Keep it on uplinks (and phone ports that need it for the voice VLAN); turn it off toward users and visitors.</p>
${K.out(`ABJ-FIN-SW1(config)#vlan 999
ABJ-FIN-SW1(config-vlan)#name PARKING
ABJ-FIN-SW1(config-vlan)#interface range g0/2 - 4 , g0/8
ABJ-FIN-SW1(config-if-range)#switchport mode access
ABJ-FIN-SW1(config-if-range)#switchport access vlan 999
ABJ-FIN-SW1(config-if-range)#switchport nonegotiate
ABJ-FIN-SW1(config-if-range)#no cdp enable
ABJ-FIN-SW1(config-if-range)#shutdown
ABJ-FIN-SW1(config-if-range)#end
ABJ-FIN-SW1#show running-config | section interface GigabitEthernet0/2
interface GigabitEthernet0/2
 switchport access vlan 999
 switchport mode access
 switchport nonegotiate
 no cdp enable
 shutdown`, "Four unused ports parked in one range (the comma joins two ranges; shutdown messages trimmed).")}
${K.dodont([
  "Count the MACs behind each port before rollout and set maximums from what is approved.",
  "Roll out in restrict mode for a week, read the <code>PSECURE_VIOLATION</code> lines, then move desks to shutdown.",
  "Save after sticky addresses are learned.",
  "Park and shut every unused port, empty SFP cages included.",
],[
  "Don't put port security on uplinks to other switches.",
  "Don't bounce an err-disabled port before you know whose MAC caused it.",
  "Don't use protect on desks: a silent drop is a ticket nobody can diagnose.",
  "Don't turn CDP off on uplinks, or reuse the parking VLAN as the native VLAN.",
])}
${K.mistake(`Applying the baseline to a range that includes the uplink. <code>interface range g0/1 - 24</code> then <code>switchport mode access</code> turns the trunk into an access port, and every VLAN but one drops — your SSH session too. Check <code>show interfaces trunk</code> first and leave uplinks out.`)}
${K.case("The teaching hospital that switched it on everywhere",`
<p>An audit at a teaching hospital in Ibadan found &ldquo;no control over devices on clinical network ports&rdquo;. On a Friday evening an engineer applied one template to all 640 access ports: access mode, port security, sticky — so maximum 1 and shutdown.</p>
<p><b>Monday, 08:30:</b> seventy-one ports err-disabled. Every consulting room with a phone and a PC behind it (two MACs); every nurses' station on a small unmanaged switch (four to six); and radiology, where the template had caught the port to a departmental switch — 38 MACs, the whole floor down at the first violation.</p>
<p><b>Recovery:</b> affected ports to restrict, maximums raised where devices were approved, port security removed from the radiology uplink, ports bounced. Working by 10:00.</p>
<p><b>The redesign:</b> MAC counts per port checked against the asset list; <b>port profiles</b> instead of one template — desk 1, phone desk 2, configured addresses for CCTV and medical devices, nurses' stations moved to managed switches, uplinks untouched; two weeks in restrict reading the violation log lines; manual recovery for offices, <code>errdisable recovery</code> at 600 s on clinical ports with every recovery on the log server; save, and a quarterly violations report.</p>
<p><b>The lesson:</b> port security is a policy about devices, so it fails when nobody has counted the devices.</p>`)}
<h3>Hands-on: Port Harcourt — the finance desk that dies every morning, and the audit list</h3>
<p>Two tickets for PH-ACC1 on a Port Harcourt finance floor.</p>
${K.bench({id:"m8-ph-edge", points:120, openLog:true, from:"CCNA · Module 8 · lesson 6", title:"Port Harcourt finance floor: an approved desk printer, a rogue trunk and the audit list", viewBox:"0 0 960 480",
  intro:"<b>Ticket 1:</b> &ldquo;Desk F-3 (Gi0/3): fine at 08:00, dead by 08:30, daily. A desk switch there serves PC-FIN1 and the label printer (approved, CHG-4471).&rdquo; <b>Ticket 2, audit:</b> unused ports live in VLAN 1; meeting-room socket Gi0/4 is a trunk; the uplink logs a native VLAN mismatch; CDP on every desk port. <b>Baseline:</b> users in VLAN 10; native VLAN 99 on trunks (PH-DIST changed its end last night); unused ports in VLAN 999 PARKING and shut; access ports with mode access + nonegotiate; no CDP except on the uplink. Gateway PH-R1 10.60.10.1. Console from YOUR LAPTOP, 9600 8N1. <b>Lab note:</b> the desk switch is drawn as a hub — to port security every MAC behind it arrives on Gi0/3.",
  devices:[
    {id:"r1", kind:"router", label:"PH-R1", x:20, y:10, config:e=>{ ["en","conf t","hostname PH-R1","no ip domain-lookup","int g0/0","description FINANCE LAN","ip address 10.60.10.1 255.255.255.0","no shut","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"dist", kind:"switch", label:"PH-DIST", x:260, y:10, config:e=>{ ["en","conf t","hostname PH-DIST","no ip domain-lookup","vlan 10","name FINANCE","vlan 99","name NATIVE-UNUSED","exit","int g0/1","description DOWNLINK PH-ACC1","switchport mode trunk","switchport trunk native vlan 99","switchport nonegotiate","int g0/2","description PH-R1 G0/0","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"acc", kind:"switch", label:"PH-ACC1", x:260, y:140, config:e=>{ ["en","conf t","hostname PH-ACC1","no ip domain-lookup","vlan 10","name FINANCE","vlan 99","name NATIVE-UNUSED","exit","int g0/1","description UPLINK PH-DIST G0/1","switchport mode trunk","int range g0/2 - 3","switchport mode access","switchport access vlan 10","switchport port-security","switchport port-security mac-address sticky","int g0/2","description DESK F-2","int g0/3","description DESK F-3","int g0/4","description MEETING ROOM","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"test", kind:"switch", label:"TEST-SW", x:520, y:270, config:e=>{ ["en","conf t","hostname TEST-SW","int g0/1","switchport mode dynamic desirable","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"hub", kind:"hub", label:"DESK SWITCH F-3", x:20, y:270},
    {id:"f1", kind:"pc", label:"PC-FIN1", x:20, y:380, ip:"10.60.10.31", mask:"255.255.255.0", gw:"10.60.10.1", mac:"0050.56c4.0331"},
    {id:"lbl", kind:"printer", label:"LABEL-PRN", x:140, y:380, ip:"10.60.10.60", mask:"255.255.255.0", gw:"10.60.10.1", mac:"0050.56c4.0360"},
    {id:"f2", kind:"pc", label:"PC-FIN2", x:260, y:380, ip:"10.60.10.32", mask:"255.255.255.0", gw:"10.60.10.1", mac:"0050.56c4.0332"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:380, y:380},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"dist:g2"}, {type:"cat6", a:"dist:g1", b:"acc:g1"}, {type:"cat6", a:"hub:p1", b:"acc:g3"}, {type:"cat6", a:"f1:eth", b:"hub:p2"}, {type:"cat6", a:"lbl:eth", b:"hub:p3"}, {type:"cat6", a:"f2:eth", b:"acc:g2"}, {type:"cat6", a:"test:g1", b:"acc:g4"}, {type:"console", a:"lap:usb", b:"acc:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce ticket 1: on PC-FIN1 ping the gateway 10.60.10.1 (08:00 — fine), then ping LABEL-PRN 10.60.10.60 (the printer wakes up), then the gateway again. What changed, and why can PC-FIN1 still reach the printer?", done:B=>Bench.errdis(B,"acc","g3")==="psecure-violation" && Bench.tried(B,"f1",/ping\s+10\.60\.10\.60/)},
    {text:"Console to PH-ACC1, <code>enable</code>: <code>show interfaces status</code>, <code>show port-security interface g0/3</code> and <code>show logging | include PSECURE</code>. Maximum, mode, and whose MAC broke the rule?", done:B=>{ const h=B.devs.acc.env.history; return Bench.psecViolations(B,"acc","g3")>0 && h.some(x=>/sh\S*\s+port-s\S*\s+int/i.test(x)) && h.some(x=>/sh\S*\s+log/i.test(x)); }},
    {text:"Fix it the approved way, without weakening the rest of the floor: on Gi0/3 only, <code>switchport port-security maximum 2</code> (keep shutdown mode), then bounce the port. Done when Gi0/3 holds two sticky addresses and PC-FIN1 reaches the gateway", done:B=>{ const i=B.devs.acc.env.intfs["GigabitEthernet0/3"]; return !Bench.errdis(B,"acc","g3") && i.psecMax===2 && (i.psecViol||"shutdown")==="shutdown" && Bench.secureMacs(B,"acc","g3").filter(m=>/sticky$/.test(m)).length===2 && Bench.pinged(B,"f1","10.60.10.1"); }},
    {text:"Audit: the meeting room. <code>show interfaces trunk</code> and <code>show cdp neighbors</code> — what is on Gi0/4, and why is it a trunk? Nothing is approved there, so: create <code>vlan 999</code> named <code>PARKING</code>, then on Gi0/4 <code>switchport mode access</code>, <code>switchport nonegotiate</code>, <code>switchport access vlan 999</code>, <code>shutdown</code>", done:B=>{ const e=B.devs.acc.env, i=e.intfs["GigabitEthernet0/4"]; return /^parking$/i.test(e.vlans[999]||"") && i.mode==="access" && i.nonegotiate && i.vlan===999 && i.shut && !Bench.trunking(B,"acc","g4"); }},
    {text:"Audit: unused ports. Park Gi0/5–Gi0/10 (the two empty SFP cages too) in one range: access mode, VLAN 999, nonegotiate, shutdown", done:B=>[5,6,7,8,9,10].every(n=>{ const i=B.devs.acc.env.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===999 && i.nonegotiate && i.shut; })},
    {text:"Audit: the desk ports Gi0/2–Gi0/3 still send DTP — add <code>switchport nonegotiate</code>. Then <code>no cdp enable</code> on every port except the uplink (one range, Gi0/2–Gi0/10). Leave CDP on Gi0/1", done:B=>{ const I=B.devs.acc.env.intfs; return I["GigabitEthernet0/2"].nonegotiate && I["GigabitEthernet0/3"].nonegotiate && [2,3,4,5,6,7,8,9,10].every(n=>I["GigabitEthernet0/"+n].cdp===false) && I["GigabitEthernet0/1"].cdp!==false; }},
    {text:"Audit: the uplink. <code>show logging | include NATIVE</code> — which end says what? Set <code>switchport trunk native vlan 99</code> on Gi0/1, check <code>show interfaces trunk</code>, prove VLAN 10 still crosses (PC-FIN2 pings 10.60.10.1) and save", done:B=>B.devs.acc.env.intfs["GigabitEthernet0/1"].native===99 && Bench.pinged(B,"f2","10.60.10.1") && B.devs.acc.env.savedOnce},
  ],
  win:"Ticket 1: the approved label printer was a second MAC on a maximum-1 port, so Gi0/3 err-disabled the moment the printer answered — PC-FIN1 could still print across the desk switch, but nothing beyond it worked. Maximum 2 on that one port fixed it without weakening anyone else's. Ticket 2: a test switch in dynamic desirable had turned the meeting-room socket into a trunk carrying every VLAN; that port and the six unused ones are now access, non-negotiating, parked in VLAN 999 and shut; CDP no longer talks to desks; and the native VLAN matches PH-DIST's 99, which ends the mismatch messages.",
  solve:[["pc","f1","ping 10.60.10.1"],["pc","f1","ping 10.60.10.60"],["pc","f1","ping 10.60.10.1"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces status"],["term","show port-security interface g0/3"],["term","show logging | include PSECURE"],
    ["term","configure terminal"],["term","interface g0/3"],["term","switchport port-security maximum 2"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["pc","f1","ping 10.60.10.60"],["pc","f1","ping 10.60.10.1"],["term","show port-security address"],
    ["term","show interfaces trunk"],["term","show cdp neighbors"],
    ["term","configure terminal"],["term","vlan 999"],["term","name PARKING"],["term","interface g0/4"],["term","switchport mode access"],["term","switchport nonegotiate"],["term","switchport access vlan 999"],["term","shutdown"],
    ["term","interface range g0/5 - 10"],["term","switchport mode access"],["term","switchport access vlan 999"],["term","switchport nonegotiate"],["term","shutdown"],
    ["term","interface range g0/2 - 3"],["term","switchport nonegotiate"],["term","interface range g0/2 - 10"],["term","no cdp enable"],["term","end"],
    ["term","show logging | include NATIVE"],["term","configure terminal"],["term","interface g0/1"],["term","switchport trunk native vlan 99"],["term","end"],["term","show interfaces trunk"],
    ["pc","f2","ping 10.60.10.1"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: the printer's reply crosses the desk switch and enters PH-ACC1 on Gi0/3 — its MAC is the second one that port has heard. Task 3: <code>shutdown</code> then <code>no shutdown</code> on Gi0/3; then make both devices talk so the printer's MAC is learned. Task 4: <code>show interfaces trunk</code> lists Gi0/4 with Mode <code>auto</code> — PH-ACC1's default — and CDP names the device that asked. Task 7: the CDP message gives this switch's native VLAN first, the neighbour's second.`)}
${K.check({q:"A desk port is configured with switchport mode access and switchport nonegotiate. Someone plugs in a switch set to dynamic desirable. What happens?", o:["A trunk forms, because desirable always wins","The port stays an access port: it is not dynamic, and with nonegotiate it doesn't even send DTP","The port err-disables","The port becomes a trunk only for the native VLAN"], a:1, why:"mode access means the port never trunks, whatever the far end asks; nonegotiate stops DTP frames too. Only a dynamic port can be talked into a trunk; err-disabling would need BPDU guard or a port-security violation."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"An auditor at a law firm lists five findings on one access switch. Match each finding with the baseline setting that closes it.", pairs:[["Gi0/18 in a meeting room shows up in show interfaces trunk as trunking","switchport mode access + switchport nonegotiate"],["Twelve ports show notconnect in VLAN 1","shutdown + switchport access vlan 999"],["A visitor's laptop on a desk port could read the switch's model and software version","no cdp enable on that port"],["The trunk to the core uses native VLAN 1, which also holds the printers","An unused native VLAN on both ends"],["A desk port learned 2,400 MACs in ten minutes","Port security with a small maximum"]], why:"1. What is asked? The control for each finding. 2. Which rule? Every port is either in use and nailed down (access mode, DTP off, port security, no CDP to the desk) or shut and parked; trunks get an unused native VLAN. 3. Apply it: a desk port trunking = DTP left on; live unused ports = shut and park; CDP readable from a desk = no cdp enable; native VLAN shared with devices = move it to an unused VLAN on both ends; thousands of MACs = MAC flooding, stopped by a maximum."})}

<h2>Interview corner</h2>
${K.hint(`What it checks (source MAC), what it limits (count and which), what it does (modes) — and what it can't stop.`)}
${K.reveal("“What does port security do, and what are its limits?”",`<p>"It controls which source MACs an access port accepts and how many — configured by hand, learned, or sticky, so learned once and written into the config. When a non-allowed MAC arrives at a port that's at its maximum, the violation mode acts: shutdown err-disables the port (the default), restrict drops, logs and counts, protect drops silently. It stops the casual cases — a swapped cable, a home router, a hub under a desk — and MAC flooding, because the maximum stops the CAM table filling. Its limit: it trusts the MAC, which software can change, so it isn't authentication. For that I'd add 802.1X."</p>`)}
${K.hint(`Evidence before action: log, port detail, the device. Then cause, bounce, verify, record.`)}
${K.reveal("“A user's port is err-disabled by port security. Walk me through it.”",`<p>"I find out why before bouncing it: the PSECURE_VIOLATION log line gives the MAC and port, show port-security interface the mode, maximum and sticky address. Then what is that MAC — a replaced PC, a dock, a personal device? Unapproved, it's unplugged and reported; a legitimate replacement, I clear the old sticky address, or raise the maximum if a second device is approved. Only then shutdown and no shutdown. I verify Secure-up and the user working, save if sticky addresses changed, and write a ticket note — it's a security event as much as a fault."</p>`)}
${K.hint(`In-use ports nailed down, unused ports shut and parked, trunks with an unused native VLAN, CDP only where needed — and a safe rollout.`)}
${K.reveal("“How would you harden the access ports on a new switch?”",`<p>"Every port is either in use and nailed down, or shut and parked. In-use ports get switchport mode access and nonegotiate, their VLAN, port security sized to the approved devices — sticky for fixed desks, configured addresses for CCTV recorders, dynamic for hot desks — PortFast with BPDU guard, and no cdp enable unless a phone needs it. Unused ports go into a parking VLAN with no gateway and are shut. Trunks get an unused native VLAN on both ends. I'd count MACs per port first, run restrict mode for a week, then move desks to shutdown, save, and verify with show port-security and show interfaces trunk."</p>`)}

${K.recap([
  "Port security limits which and how many source MACs an access port accepts — against unknown devices and MAC flooding. It trusts the MAC, so it isn't authentication (802.1X is).",
  "It needs a static access port. switchport port-security alone = maximum 1, dynamic learning, violation shutdown.",
  "Secure addresses: static (typed), dynamic (learned, lost at reload), sticky (learned into the running-config — save it). All show as STATIC in the MAC table.",
  "protect drops silently; restrict drops, logs and counts, port up; shutdown err-disables the port (%PM-4-ERR_DISABLE + %PORT_SECURITY-2-PSECURE_VIOLATION).",
  "Recover: find the MAC, remove or approve the cause, shutdown / no shutdown, verify, record. errdisable recovery retries after the interval (300 s default) but can't remove the cause.",
  "Every port in use: access + nonegotiate + port security + no CDP to the desk. Every unused port: shut and parked. Trunks: an unused native VLAN on both ends.",
])}
${K.next(`<b>Lesson 7 — DHCP snooping and Dynamic ARP Inspection.</b> Port security controls <i>which device</i> is on a port; snooping and DAI control <i>what it may claim</i>: a home Wi-Fi router handing out addresses from a desk port, and a static-IP printer that DAI drops until you write it an ARP ACL.`)}
`,
quiz:[
  {lvl:1, q:"An engineer configures switchport mode access and switchport port-security on an interface and nothing else. Which settings does the port use?", o:["Maximum 1 secure MAC, learned dynamically, violation mode shutdown","Maximum 1 secure MAC, which must be configured by hand, violation mode restrict","Unlimited MACs, violation mode protect","Maximum 2 secure MACs, sticky learning, violation mode shutdown"], a:0, why:"The defaults are maximum 1, dynamic learning from the first frame, and shutdown. Sticky learning, a configured address, a different maximum or another mode each need their own command."},
  {lvl:1, q:"How does a secure MAC address learned by port security appear in show mac address-table?", o:["As DYNAMIC, like any learned address","As STATIC","As SECURE","It doesn't appear in the MAC table, only in show port-security address"], a:1, why:"Secure addresses — configured, sticky or dynamic — are installed as STATIC entries, so they don't age out with the normal MAC aging timer. show port-security address shows how each was obtained (SecureConfigured, SecureSticky, SecureDynamic)."},
  {lvl:1, type:"match", q:"Match each port-security setting with what it does when a violation happens (or when it acts).", pairs:[["violation protect","Drops the offending frames; no log message, no counter increase"],["violation restrict","Drops the offending frames, logs them and increases the counter; the port stays up"],["violation shutdown","Puts the port into err-disabled for every device on it"],["errdisable recovery cause psecure-violation","Re-enables an err-disabled port by itself after the recovery interval"]], why:"Protect and restrict both drop only the offending frames and keep the port up; restrict also reports. Shutdown (the default) err-disables the whole port. errdisable recovery is global and only re-enables the port after the interval (300 s by default) — it doesn't remove the cause."},
  {lvl:1, type:"fill", q:"Write the interface command that makes a port learn secure MAC addresses and write them into the running-config.", fields:[{label:"Command", a:["switchport port-security mac-address sticky"], ios:true}], why:"Sticky learning: switchport port-security mac-address sticky. Each learned address is added to the running-config as switchport port-security mac-address sticky H.H.H; save the configuration so they survive a reload."},
  {lvl:2, q:"A user reports that her network cable is broken. Based on the exhibit, what is the right next step?", ex:"KD-SW4#show port-security interface g0/11\nPort Security              : Enabled\nPort Status                : Secure-shutdown\nViolation Mode             : Shutdown\nAging Time                 : 0 mins\nAging Type                 : Absolute\nSecureStatic Address Aging : Disabled\nMaximum MAC Addresses      : 1\nTotal MAC Addresses        : 1\nConfigured MAC Addresses   : 0\nSticky MAC Addresses       : 1\nLast Source Address:Vlan   : 0050.56e2.91af:30\nSecurity Violation Count   : 1", o:["Identify the device with MAC 0050.56e2.91af, remove it or approve it, then shutdown and no shutdown on Gi0/11","Replace the patch cable, because the port has no link","Enter no switchport port-security on Gi0/11 so the user can work","Change the violation mode to protect so the port stays up"], a:0, why:"Secure-shutdown with one violation means a MAC other than the sticky address arrived and the port was err-disabled — which looks like a dead cable to the user. Find out what 0050.56e2.91af is first; then remove the cause (or, for an approved replacement, clear the old sticky address) and bounce the port. Removing port security or hiding violations with protect throws the control away."},
  {lvl:2, type:"multi", q:"Which two statements about configuring port security on a Catalyst access switch are true? (Choose two.)", o:["switchport port-security is rejected on a port left in a dynamic DTP mode","Port security should be enabled on uplinks to distribution switches to block MAC flooding","Sticky addresses are written into the running-config and survive a reload only if the configuration is saved","Protect mode increases the violation counter but doesn't log","The maximum must be set before switchport port-security will be accepted"], a:[0,2], why:"IOS answers 'Command rejected: … is a dynamic port.' until you set switchport mode access. Sticky addresses go into the running-config; only a save makes them survive a reload. Uplinks carry many MACs, so port security doesn't belong there; protect neither logs nor counts; and the maximum is optional (default 1) and can be configured in any order."},
  {lvl:2, type:"order", q:"A port-security violation has err-disabled a desk port. Put the recovery steps in the right order.", items:["Read the log and show port-security interface to find the offending MAC","Remove the unapproved device (or approve it and clear the old sticky address)","Enter shutdown on the interface","Enter no shutdown on the interface","Verify Secure-up and that the user works, then record the event"], why:"Cause before cure: bouncing the port with the device still connected err-disables it again at its next frame. shutdown clears the err-disabled state and no shutdown brings the port up; then verify and write the ticket note — it was a security event."},
  {lvl:2, q:"Two ports have maximum 1 and an extra laptop sending frames. Gi0/4 uses restrict, Gi0/5 uses protect. What is different between them?", o:["Gi0/4 err-disables; Gi0/5 stays up","Both drop the laptop's frames and stay up, but only Gi0/4 logs a PSECURE_VIOLATION message and increases its violation counter","Gi0/5 drops the laptop's frames; Gi0/4 forwards them but logs them","There is no difference; protect and restrict are synonyms"], a:1, why:"Restrict and protect drop the same frames and leave the port up for the secure device. Restrict reports (syslog/SNMP and the counter); protect is silent. Only shutdown err-disables."},
  {lvl:2, q:"Fixed desks use sticky port security. The configuration was saved when port security was set up, but not after the sticky addresses were learned. After a power cut, a visitor's laptop is plugged into desk 7 before the staff PC is switched on. What happens?", o:["The laptop is a violation, because desk 7's sticky address survived the power cut","The laptop is learned as desk 7's new sticky address; the staff PC becomes the violation when it's switched on","Port security is disabled after a reload until the configuration is saved","Neither device works until an engineer runs shutdown and no shutdown"], a:1, why:"The switch boots from the startup-config, which has the port-security lines but not the unsaved sticky addresses. The first source MAC heard — the visitor's — is learned and becomes sticky, and the staff PC is now the stranger. Saving after sticky addresses are learned is part of the change."},
  {lvl:2, q:"Based on the exhibit from an access switch, what has happened on Gi0/9 and what is the fix?", ex:"ACC-2F#show interfaces trunk\n\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/1       on               802.1q         trunking      99\nGi0/9       auto             802.1q         trunking      1\n...\nACC-2F#show cdp neighbors\nCapability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\n                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nCORE-1           Gi0/1             151        S I         C9300     Gi1/0/24\nLAB-SW           Gi0/9             151        S I         C9200L    Gi0/1", o:["Gi0/9, a desk port left in dynamic auto, negotiated a trunk with a switch someone plugged in; configure switchport mode access and switchport nonegotiate on Gi0/9","Gi0/9 has a native VLAN mismatch with CORE-1; set native VLAN 99 on Gi0/9","Gi0/1 is the problem because its mode is on; set it to auto","Port security has err-disabled Gi0/9"], a:0, why:"Mode auto is the Catalyst default (dynamic auto); with a far end asking (desirable or trunk) it becomes a trunk carrying every VLAN, and CDP names the device. Nailing the port down — switchport mode access plus nonegotiate — removes the possibility; then park and shut it if nothing is approved there. Gi0/1 is the real uplink (mode on = switchport mode trunk)."},
  {lvl:2, type:"fill", q:"An unused port must be placed in the parking VLAN 999 and disabled. Type the two interface commands.", fields:[{label:"Put it in VLAN 999", a:["switchport access vlan 999"], ios:true},{label:"Disable it", a:["shutdown","shut"], ios:true}], why:"switchport access vlan 999 parks it in a VLAN with no gateway or devices; shutdown disables it. Together, a port enabled by mistake still leads nowhere. Add switchport mode access and switchport nonegotiate so it can't negotiate a trunk either."},
  {lvl:3, q:"A hospital ward's nurses' station is fed by a small unmanaged switch with four approved PCs, on access port Gi0/22 with default port security. Every morning the port err-disables. Which change fixes it while keeping the control useful?", o:["switchport port-security maximum 4 with sticky learning on Gi0/22, saved — or better, replace the unmanaged switch with a managed one on its own uplink","no switchport port-security on Gi0/22","switchport port-security violation protect on Gi0/22","errdisable recovery cause psecure-violation with a 30-second interval"], a:0, why:"Four approved MACs on a maximum-1 port make the second PC a violation every morning. Sizing the maximum to the approved count, with sticky addresses saved, keeps unknown devices out; replacing the unmanaged switch removes the hidden-devices problem altogether. Removing port security or hiding it with protect loses the control, and a short recovery interval just makes the port flap."},
  {lvl:3, q:"A security review finds that desk ports use violation protect. Staff never complain, and show port-security lists every port with a violation count of 0. Why is the reviewer still unhappy?", o:["Protect mode doesn't drop anything","Protect drops offending frames without logging or counting, so a count of 0 proves nothing — violations could be happening daily and nobody would know; restrict gives the same protection with evidence","Protect mode err-disables ports without logging","A violation count of 0 means port security isn't enabled"], a:1, why:"Protect and restrict drop the same frames, but protect produces no syslog/SNMP message and no counter. The network team is blind to swaps, extra devices or a flood. Restrict keeps desks working and makes every violation visible; shutdown stops the port entirely."},
  {lvl:3, type:"multi", q:"An auditor reviews the exhibit for a desk port in an open-plan office. Which two items break the access-port baseline? (Choose two.)", ex:"interface GigabitEthernet0/14\n description DESK 2-14\n switchport access vlan 20\n switchport mode access\n switchport port-security\n switchport port-security violation restrict\n switchport port-security mac-address sticky\n switchport port-security mac-address sticky 0050.56a8.3c19\n spanning-tree portfast\n spanning-tree bpduguard enable", o:["switchport nonegotiate is missing, so the port still sends DTP frames toward the desk","CDP is still enabled on a port facing a desk (there is no no cdp enable)","Restrict is not a valid violation mode","Sticky learning can't be combined with BPDU guard","The port should be in the parking VLAN 999"], a:[0,1], why:"The port is nailed to access mode, but without switchport nonegotiate it still sends DTP, and without no cdp enable it still describes the switch to whoever plugs in — both baseline items. Restrict is a valid mode, sticky learning and BPDU guard combine fine, and an in-use desk port belongs in its user VLAN, not the parking VLAN."},
  {lvl:3, q:"An intruder unplugs a desk PC, sets their laptop's MAC to the PC's sticky address, and plugs into the same socket on a shutdown-mode port. What happens, and which control would actually stop it?", o:["The port err-disables, because port security detects the changed MAC","The laptop is accepted, because port security checks only the source MAC; the link down/up is logged, and 802.1X authentication (plus physical security) is the control that would stop it","The laptop is accepted, and nothing at all is logged","The switch detects the duplicate and shuts both ports"], a:1, why:"Port security compares source MACs; a copied MAC on the same port matches the sticky address. The evidence is the link going down and up in the log. Authenticating the device itself — 802.1X (lesson 3) — and keeping people away from the cabling are what stop it. Port security is a speed bump, not a lock."},
],
cards:[
  {f:"Port security", b:"A per-port switch feature that limits which and how many source MAC addresses an access port accepts, and acts when another appears. Answers unknown devices on desk ports and MAC flooding of the CAM table."},
  {f:"Port security requirement", b:"A static access port (switchport mode access). On a dynamic DTP port IOS says: Command rejected: … is a dynamic port. Never on uplinks to other switches."},
  {f:"Port security defaults", b:"switchport port-security alone = maximum 1, dynamic learning from the first frame, violation mode shutdown."},
  {f:"Static, dynamic, sticky secure addresses", b:"Static (configured): typed with switchport port-security mac-address H.H.H. Dynamic: learned, only in the MAC table, lost at reload (and on most Catalysts at link down). Sticky: learned and written into the running-config — save it."},
  {f:"Secure addresses in the MAC table", b:"Show as STATIC in show mac address-table, whichever way they were obtained. show port-security address gives the type: SecureConfigured, SecureSticky, SecureDynamic."},
  {f:"Violation modes", b:"protect: drop, no log, no count. restrict: drop, log (%PORT_SECURITY-2-PSECURE_VIOLATION), count, port stays up. shutdown (default): err-disable the whole port, log, count. Memory aid: Peace, Report, Slam."},
  {f:"Shutdown-mode violation log lines", b:"%PM-4-ERR_DISABLE: psecure-violation error detected on Gi0/5, putting Gi0/5 in err-disable state — then %PORT_SECURITY-2-PSECURE_VIOLATION naming the offending MAC and port."},
  {f:"Recovering an err-disabled port", b:"Find the MAC (log, show port-security interface) → remove the cause or approve it → shutdown → no shutdown → verify Secure-up → record it."},
  {f:"errdisable recovery", b:"Global: errdisable recovery cause psecure-violation and errdisable recovery interval N (300 s default). The switch re-enables the port after the interval — it can't remove the cause, so a port can flap."},
  {f:"Port Status values", b:"Secure-up: on and working. Secure-shutdown: err-disabled by a violation. Secure-down: port security on, but no link or administratively shut."},
  {f:"Sizing the maximum", b:"Count what is approved behind the socket: desk PC 1, IP phone + PC 2, small desk switch = every device behind it. Check the live count with show mac address-table interface."},
  {f:"Access-port hygiene baseline", b:"In use: switchport mode access + switchport nonegotiate + port security + no cdp enable. Unused: switchport access vlan 999 (parking) + shutdown. Trunks: an unused native VLAN on both ends."},
  {f:"What port security can't stop", b:"A device using a copied MAC with the real device unplugged — it checks only the source MAC. 802.1X authentication and physical security close that gap."},
],
});

// ---------- Module 8 · Lesson 7 ----------
L.push({
id:"sec-snoop-dai", mins:100, level:"Intermediate · builds on Module 7 and lessons 1–6",
t:"DHCP snooping and Dynamic ARP Inspection — which ports may speak for the network",
html:`
${K.goals([
  "Explain what a rogue DHCP server, DHCP starvation and ARP poisoning try to achieve, why the protocols allow them, what the network team sees, and which switch feature stops each.",
  "Configure DHCP snooping: global and per-VLAN, trust toward the real server, rate limits, and the binding table.",
  "Explain why option 82 with giaddr 0.0.0.0 silences an IOS DHCP server, and fix it from the switch or the router.",
  "Configure Dynamic ARP Inspection, trust the right ports, and let static-IP devices through with an ARP ACL.",
  "Troubleshoot both from evidence: the frame log, <code>show ip dhcp snooping [binding]</code>, <code>show ip arp inspection</code> and <code>%SW_DAI-4-DHCP_SNOOPING_DENY</code>.",
])}
${K.pre(["Module 7 lessons 1–2: DORA, UDP 67/68, leases and renewal, <code>ip helper-address</code> and giaddr, <code>ipconfig /all</code>, <code>/release</code>, <code>/renew</code>.","Modules 1 and 4: ARP, the MAC address table, VLANs, access ports and trunks.","Lesson 1: threats, spoofing and man-in-the-middle. Lesson 6: port security and err-disabled ports."])}

<h2>Why this matters at work</h2>
<p>Tuesday, 10:20, at an insurance broker in Abuja. Half the claims team say &ldquo;it works for a minute, then nothing&rdquo;; the other half are fine. The broken laptops show <b>DHCP Server 192.168.0.1</b> in <code>ipconfig /all</code> — a box nobody owns. A visiting consultant had plugged a travel Wi-Fi router into the meeting-room socket, DHCP server on by default.</p>
<p>Module 7 showed you how to <i>find</i> that box. This lesson makes the switch <i>refuse</i> it. ${K.g("DHCP snooping","A Catalyst switch feature that decides, port by port, where DHCP server messages may come from, and records which address each client received on which port (the binding table).")} decides which ports may answer as a DHCP server; ${K.g("Dynamic ARP Inspection (DAI)","A switch feature that checks every ARP arriving on an untrusted port against the DHCP snooping bindings (or an ARP ACL) and drops ARPs that claim an IP address that isn't theirs.")} uses snooping's records so no device can claim an address that isn't its own. A few lines per switch — and either can cut off a whole floor if you trust the wrong port.</p>

<h2>Three ways a LAN's trust gets abused: rogue DHCP, starvation, ARP poisoning</h2>
${K.remember(`<b>The rule in one line:</b> DHCP and ARP were designed for friendly LANs. A client believes the <b>first</b> DHCP server that answers; a host believes <b>any</b> ARP reply it hears. Neither checks who is speaking. Snooping and DAI add that check where the network knows exactly what is plugged in: the switch port.`)}
<p>Each threat is described as a defender needs it: the goal, why it works, what you see, what stops it.</p>
${K.analogy(`A hospital lobby with no reception desk: a visitor asks &ldquo;where is ward 4?&rdquo; and follows the first person who answers — even a stranger pointing at the car park. DHCP snooping adds a counter: only directions from behind it (the trusted port) count.`)}
<h3>A rogue DHCP server</h3>
<ul>
<li><b>Goal or effect:</b> a ${K.g("rogue DHCP server","Any DHCP server the network team didn't authorise — usually an accident (a home router, a test VM), sometimes deliberate.")} gives clients <b>its</b> gateway and DNS. If that gateway goes nowhere, those users have an outage; if it is the rogue box and it passes traffic on, the box is a ${K.g("man-in-the-middle","A device placed between two parties so their traffic flows through it, where it can be read or altered before being passed on (lesson 1).")}.</li>
<li><b>Why DHCP allows it:</b> the Discover is a broadcast, nothing proves a server is genuine, and the client takes the first Offer (Module 7).</li>
<li><b>What you see:</b> a split fault; broken PCs show a foreign subnet and a DHCP Server that isn't yours.</li>
<li><b>What stops it:</b> DHCP snooping — server messages accepted only on trusted ports.</li>
</ul>
${K.svg("0 0 760 320",
  K.txt(20,22,"A rogue DHCP server: the first Offer wins, and the gateway it names decides where traffic goes",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",90,90,"STAFF-PC","took the first Offer")+K.dev("switch",330,90,"SW1","access switch")+K.dev("router",570,90,"BRANCH-R1","real gateway · DHCP")+K.dev("cloud",700,90,"WAN","")+
  K.link(108,92,304,92)+K.link(356,92,546,92,"uplink")+K.link(594,92,676,92)+
  K.dev("router",180,232,"HOME-WIFI","plugged into a desk socket")+K.link(305,100,198,216)+
  K.box(430,190,310,62,"What users notice","some PCs fine, some not · DHCP Server isn't 10.20.0.1")+
  K.txt(380,292,"1 · HOME-WIFI's Offer reached STAFF-PC first: 192.168.0.23, gateway 192.168.0.1 (itself).",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,310,"2 · Traffic for other networks now goes to HOME-WIFI: dropped (an outage) or relayed on (a man-in-the-middle).",{mid:true,s:11,f:"body"}),
  "Same cabling, same routing, two DHCP servers. The PC was told the wrong gateway.")}
<h3>DHCP starvation</h3>
<ul>
<li><b>Goal:</b> ${K.g("DHCP starvation","A denial-of-service attack on a DHCP server: a flood of requests, each claiming a different client hardware address, leases every free address.")} empties the pool. One device asks for address after address, each time as a &ldquo;new client&rdquo;; genuine newcomers get APIPA — a ${K.g("denial of service","An attack that makes a service unavailable to its real users (lesson 1).")}, often the first step before a rogue server, since the real server has nothing left to offer.</li>
<li><b>Why DHCP allows it:</b> the server identifies a client by the ${K.g("client hardware address","The chaddr field inside a DHCP message: the MAC the client says is its own. Separate from the frame's source MAC, although on an honest client they are the same.")} inside the message (<b>chaddr</b>), and nothing stops a device inventing one per request.</li>
<li><b>What you see:</b> <code>show ip dhcp pool</code> with nothing free, bindings full of unknown MACs — many on one switch port — and new users on 169.254.</li>
<li><b>What stops it:</b> a snooping <b>rate limit</b> (err-disables a flooding port), snooping's source-MAC-equals-chaddr check, and port security's MAC limit (lesson 6).</li>
</ul>
<h3>ARP poisoning</h3>
<ul>
<li><b>Goal:</b> with ${K.g("ARP poisoning","Also called ARP spoofing: a host sends ARPs claiming another host's IP (usually the gateway's) is at its own MAC, so neighbours send that traffic to it.")}, a host announces &ldquo;the gateway's IP is at <i>my</i> MAC&rdquo;. Neighbours update their ARP caches and send gateway traffic to it — a man-in-the-middle or an outage.</li>
<li><b>Why ARP allows it:</b> ARP has no authentication, and hosts accept replies they never asked for — the mechanism behind a legitimate ${K.g("gratuitous ARP","An ARP a host sends about its own address without being asked, e.g. after an HSRP failover; receivers update their caches.")} (HSRP relies on it).</li>
<li><b>What you see:</b> <code>arp -a</code> on a victim maps the gateway's IP to a MAC that isn't the router's (often another PC's); drop-outs and slowness.</li>
<li><b>What stops it:</b> DAI — the switch drops ARPs whose &ldquo;IP X is at MAC Y&rdquo; doesn't match what snooping recorded.</li>
</ul>
${K.mistake(`Treating every rogue DHCP server as a hacker. Most are accidents (home routers, test VMs, a printer with DHCP on): contain the port, remove the box, explain, prevent with snooping.`)}
${K.check({q:"New laptops at a training centre get 169.254 addresses, existing users are fine, the pool has no free addresses, and the bindings show 200+ unknown MACs, most learned on one access port. Which threat, and which controls?", o:["A rogue DHCP server — snooping trust on the uplink","DHCP starvation — a snooping rate limit on access ports plus port security","ARP poisoning — Dynamic ARP Inspection","A broadcast storm — Spanning Tree"], a:1, why:"A rogue would give a wrong subnet, not APIPA. One port claiming hundreds of clients drained the pool: a rate limit err-disables it and port security caps its MACs."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four tickets from four sites. Match each with the control that would have stopped it.", pairs:[["A PC's arp -a shows the gateway 10.4.0.1 at the same MAC as PC 10.4.0.37","Dynamic ARP Inspection"],["Laptops near the lab bench get 192.168.1.x from a server called 192.168.1.1","DHCP snooping with only the uplink trusted"],["The pool is empty and one access port shows hundreds of new MACs in a minute","Snooping rate limit plus port security"],["A visitor unplugs a desk PC and plugs in their own laptop","Port security on the desk port (lesson 6)"]], why:"1. What is asked? The control for each symptom. 2. Which rule? Rogue servers: trust only the server-facing port; false ARP claims: DAI; request floods: rate and MAC limits; a swapped device: port security. 3. Apply it: the gateway at a PC's MAC is a false ARP claim; a foreign DHCP server is a rogue; an empty pool with hundreds of MACs on one port is starvation; a swapped device is port security's job."})}

<h2>DHCP snooping: trusted ports, untrusted ports and server messages</h2>
${K.remember(`<b>The rule:</b> in a snooping VLAN every port is <b>untrusted</b> unless configured otherwise. Untrusted ports may carry DHCP <b>client</b> messages (Discover, Request, Release, Decline, Inform). A <b>server</b> message (<b>Offer, Ack, NAK</b>) arriving on an untrusted port is dropped. Trust the ports that lead toward the real DHCP server — nothing else.`)}
<p>Why by <b>port</b>? A home router's Offer looks exactly like the company router's — but the switch knows its cabling: the real server (or its relay) is up the uplink, and no desk socket should have a server behind it. A ${K.g("trusted port","In DHCP snooping (and DAI): a port the switch accepts DHCP server messages (or unchecked ARPs) from — normally only the uplink or trunk toward the real server.")} is a statement about direction, not about a person.</p>
${K.svg("0 0 760 330",
  K.txt(20,22,"One switch, two kinds of port",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("router",90,110,"R1","real DHCP server")+K.dev("switch",380,110,"SW1","snooping on VLAN 10")+
  K.link(114,110,354,110,"Gi0/8 · TRUSTED")+K.txt(234,132,"Offer · Ack · NAK accepted",{mid:true,c:"ok",s:10.5,f:"body"})+
  K.dev("pc",650,50,"PC1","Gi0/2 · untrusted")+K.dev("pc",650,150,"PC2","Gi0/3 · untrusted")+K.dev("router",650,250,"HOME-WIFI","Gi0/6 · untrusted")+
  K.link(406,106,628,54)+K.link(406,112,628,152)+K.link(406,118,626,244)+
  K.txt(430,262,"✗ its Offer is dropped at Gi0/6",{c:"bad",s:10.5,f:"body"})+
  K.txt(20,310,"Untrusted ports may send client messages (Discover, Request, Release, Decline). Server messages are accepted only from Gi0/8.",{s:11,f:"body",c:"fg"}),
  "PC1's Discover still floods to every port — HOME-WIFI hears it and answers — but the answer never gets past the port it came in on.")}
<div class="tablewrap"><table>
<tr><th>Message</th><th>Sent by</th><th>On an untrusted port</th></tr>
<tr><td>Discover, Request, Inform</td><td>Client</td><td>Allowed (by default the frame's source MAC must equal the chaddr)</td></tr>
<tr><td>Release, Decline</td><td>Client</td><td>Allowed only from the port where that client's binding was learned</td></tr>
<tr><td><b>Offer, Ack, NAK</b> (Cisco's list also names lease-query packets, beyond CCNA)</td><td><b>Server</b></td><td><b>Dropped</b></td></tr>
<tr><td>A message already carrying option 82 or a non-zero giaddr</td><td>A relay</td><td>Dropped (&ldquo;Option 82 on untrusted port is not allowed&rdquo;)</td></tr>
</table></div>
${K.remember(`<b>&ldquo;O-A-N: Only Authorised Nodes&rdquo;</b> — <b>O</b>ffer, <b>A</b>ck, <b>N</b>AK are the server's words; only trusted ports may speak them.`)}
<p><b>Snooping's second job.</b> Each time an Ack passes from a trusted port to a client on an untrusted port, the switch writes a row in its ${K.g("binding table","The DHCP snooping database: one row per DHCP client on an untrusted port — MAC, leased IP, lease time, VLAN and port. DAI uses it to decide what is genuine.")}: MAC, IP, lease, VLAN, port — its evidence that &ldquo;this address belongs to this MAC on this port&rdquo;, which DAI will need. Hand-typed (static) addresses never get a row by themselves.</p>
<h3>Worked example: snooping on a Port Harcourt access switch</h3>
<p>Staff VLAN 10 (10.20.10.0/24) on PH-SW1; PH-R1, gateway and DHCP server, on Gi0/8; desks on Gi0/1–Gi0/7.</p>
${K.steps([
  ["Trust the way to the real server first", "<code>interface g0/8</code> → <code>ip dhcp snooping trust</code>, so the real Offers are never dropped. With several switches, trust each uplink toward the server."],
  ["Rate-limit the desk ports", "<code>interface range g0/1 - 7</code> → <code>ip dhcp snooping limit rate 10</code>. Don't rate-limit the trusted uplink: it carries everyone's DHCP (Cisco allows it, but only with a much higher limit)."],
  ["Decide about option 82", "<code>no ip dhcp snooping information option</code>, because PH-R1 is an IOS DHCP server (next section)."],
  ["Choose the VLANs, then switch it on", "<code>ip dhcp snooping vlan 10</code> (lists like <code>10,20,30-32</code> work) and <code>ip dhcp snooping</code>. Both are needed: neither works alone."],
  ["Verify", "<code>show ip dhcp snooping</code>, then <code>show ip dhcp snooping binding</code> once clients renew."],
])}
${K.out(`PH-SW1#show ip dhcp snooping
Switch DHCP snooping is enabled
...
DHCP snooping is operational on following VLANs:
10
...
Insertion of option 82 is disabled
...
Option 82 on untrusted port is not allowed
Verification of hwaddr field is enabled
Verification of giaddr field is enabled
...
Interface                  Trusted    Allow option    Rate limit (pps)
-----------------------    -------    ------------    ----------------
GigabitEthernet0/1         no         no              10
  Custom circuit-ids:
...
GigabitEthernet0/8         yes        yes             unlimited
  Custom circuit-ids:`, "The lab's PH-SW1, trimmed. Enabled, operational on VLAN 10, option 82 insertion off, Gi0/8 the only trusted port, desks limited to 10 packets per second.")}
<ul>
<li><b>operational on following VLANs</b> — the VLANs really protected (a configured VLAN that doesn't exist isn't operational).</li>
<li><b>Verification of hwaddr field</b> — the source-MAC-equals-chaddr check, on by default: a starvation defence.</li>
<li>Only ports with a trust or rate setting are listed; every other port is untrusted with no limit.</li>
</ul>
${K.mistake(`Typing <code>ip dhcp snooping vlan 10</code> on a live network before trusting the uplink. From that moment the real server's Offers and Acks are dropped like a rogue's: new clients get APIPA and renewals fail. Trust first; enable the VLAN last.`)}
${K.check({q:"An engineer enables ip dhcp snooping and ip dhcp snooping vlan 30 but forgets ip dhcp snooping trust on the uplink to the DHCP server. What happens?", o:["Nothing until ports are configured as untrusted","The real server's Offers and Acks arrive on an untrusted port and are dropped, so new clients get no address","Only rogue servers stop working","The switch trusts its uplink automatically because it's a trunk"], a:1, why:"Every port is untrusted by default, uplinks and trunks included, so the real server's messages are dropped like a rogue's."})}
<h3>Same logic, new situation</h3>
<p>Two switches in a Lagos office: desks on LOS-ACC1, whose Gi0/1 is a trunk to LOS-CORE; LOS-CORE's Gi0/2 goes to the router that relays DHCP. Snooping is on in VLAN 40 on <b>both</b>. Which ports must be trusted?</p>
${K.hint(`Follow an Offer from the server to a desk PC. Each switch judges the port the Offer <i>arrives</i> on.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The trusted ports on two switches. <b>2. Which rule?</b> Server messages are dropped on untrusted ports; trust toward the real server. <b>3. Apply it:</b> the Offer enters LOS-CORE on <b>Gi0/2</b> and LOS-ACC1 on <b>Gi0/1</b> — trust both. LOS-CORE's port down to LOS-ACC1 stays untrusted: no server there. Trap: if LOS-ACC1 inserts option 82, LOS-CORE drops those messages on that untrusted port — next section.</p>`)}

${K.drill({title:"forwarded or dropped by DHCP snooping?", types:["snoopdrop"], count:5})}
<h2>Option 82, rate limits and the binding table — the details that break DHCP</h2>
${K.remember(`<b>The rule:</b> by default a snooping switch adds <b>option 82</b> to clients' DHCP messages but leaves <b>giaddr at 0.0.0.0</b>, because it isn't a relay. An IOS DHCP server or relay receiving that combination on an interface it doesn't trust for relay information <b>drops it silently</b>. Stop the switch adding it, or tell the router to trust it.`)}
<p>Option 82 (RFC 3046, Module 7) is relay agent information: a snooping switch adds a <b>circuit ID</b> (VLAN and port) and a <b>remote ID</b> (its MAC), which ISPs and some servers use to assign addresses per port. But normally only a relay adds option 82, and a relay always writes its own address into giaddr. Option 82 with giaddr 0.0.0.0 looks to IOS like relay information from nowhere it trusts — RFC 3046 tells a first-hop relay to discard exactly that from an untrusted circuit — so it's discarded: no Offer, no log line by default, every client on 169.254. It's the classic &ldquo;DHCP broke when we enabled snooping&rdquo; — and the lab's frame log names it:</p>
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from PH-PC1 (0050.56a1.2a01): "is there a DHCP server?"
  · PH-SW1 Gi0/2 — DHCP snooping inserts option 82 (relay agent information, giaddr 0.0.0.0) into the client's message
  · PH-SW1 received a broadcast → flooded out Gi0/8 in VLAN 10
  · PH-R1 Gi0/0 drops it: it carries option 82 from the DHCP-snooping switch PH-SW1 with giaddr 0.0.0.0, which an IOS DHCP server/relay doesn't trust — fix: no ip dhcp snooping information option on the switch, or ip dhcp relay information trust-all on the router
No DHCP Offer came back. Windows keeps trying and meanwhile gives itself an APIPA address (169.254.x.x, mask 255.255.0.0) — usable only with other APIPA hosts on the same link`, "PH-SW1 before the option-82 line (one learning line trimmed): trust is right, and still nobody gets an address.")}
${K.when([
  ["<code>no ip dhcp snooping information option</code> (switch)","Nothing uses option 82 — most enterprise LANs","Fixes it at the source","Your server or ISP really assigns by port"],
  ["<code>ip dhcp relay information trusted</code> (router interface facing the switch)","An IOS server or relay should keep receiving option 82 from that LAN","Trust limited to one interface","Many interfaces need it"],
  ["<code>ip dhcp relay information trust-all</code> (router, global)","Every interface faces your own snooping switches","One line covers all","Some interfaces face networks you don't control"],
], "Fixing the giaddr 0.0.0.0 problem")}
${K.tip(`The fix goes where the dropping happens. Behind a relay (Module 7 lesson 2), it's the <b>relay's</b> LAN interface that first receives option 82 with giaddr 0.0.0.0. Non-IOS servers (Windows Server, ISP systems) treat option 82 their own way — check, don't assume.`)}
<h3>Rate limits: the starvation brake</h3>
<p><code>ip dhcp snooping limit rate N</code> caps the DHCP packets per second (${K.g("pps","Packets per second.")}) an untrusted port may send. A PC sends a handful per boot; a flood goes far past the limit and the switch <b>err-disables</b> the port (cause <code>dhcp-rate-limit</code>) — recovered as in lesson 6: remove the cause, then <code>shutdown</code> / <code>no shutdown</code>, or <code>errdisable recovery cause dhcp-rate-limit</code>. Cisco advises no more than 100 pps on untrusted ports; access ports commonly use 10–20. <b>Lab note:</b> the lab shows the limit but never fires it — its devices don't flood.</p>
<h3>Reading the binding table</h3>
${K.out(`PH-SW1#show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  --------------------
00:50:56:A1:2A:01   10.20.10.31      86302       dhcp-snooping   10    GigabitEthernet0/2
00:50:56:A1:2A:02   10.20.10.32      86302       dhcp-snooping   10    GigabitEthernet0/3
Total number of bindings: 2`, "Two PCs leased after snooping went live. The MAC uses colons here, dots elsewhere in IOS.")}
<ul>
<li><b>Lease(sec)</b> counts down the lease; the row goes when the lease ends or the client releases.</li>
<li><b>Interface</b> ties address and MAC to a <i>port</i> — what makes the table useful to DAI.</li>
<li><b>Who's missing?</b> Static devices, and clients that leased <b>before</b> snooping and haven't talked DHCP since; the switch learns those from their next renewal's Ack.</li>
</ul>
${K.dyk(`The binding table lives in memory: after a switch reload it starts empty and refills only as clients renew — unless a <b>DHCP snooping database agent</b> saves it to flash or a server (beyond CCNA). With DAI on, a freshly reloaded switch has nothing to compare ARPs with.`)}
<h3>Try it: snooping on a fintech's second floor</h3>
<p>LEK-ACC2 in Lekki, Lagos: Finance VLAN 60 on Gi0/2–Gi0/8; Gi0/1 is the trunk to LEK-CORE, an IOS router that relays DHCP to head office.</p>
${K.term({env:"ios2", title:"LEK-ACC2 — snooping in the safe order", opts:{kind:"switch", host:"LEK-ACC2", model:"C9200L-24T-4G", motd:"LEK-ACC2 — console session (lab switch, no enable secret)."},
  setup:env=>{ ["en","conf t","vlan 60","name FINANCE","exit","interface range g0/2 - 8","switchport mode access","switchport access vlan 60","exit","interface g0/1","switchport mode trunk","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. VLAN 60 and the access ports already exist.",
  tasks:[
    {text:"Trust the uplink before anything else: <code>interface g0/1</code>, <code>ip dhcp snooping trust</code>", done:e=>!!e.intfs["GigabitEthernet0/1"].snoopTrust},
    {text:"Limit the seven desk ports to 15 DHCP packets per second in one go: <code>interface range g0/2 - 8</code>, <code>ip dhcp snooping limit rate 15</code>, then <code>exit</code>", done:e=>[2,3,4,5,6,7,8].every(n=>e.intfs["GigabitEthernet0/"+n].snoopRate===15)},
    {text:"LEK-CORE is an IOS relay, so stop the switch inserting option 82: <code>no ip dhcp snooping information option</code> (global configuration)", done:e=>e.snoop.opt82===false},
    {text:"Now switch it on: <code>ip dhcp snooping vlan 60</code> and <code>ip dhcp snooping</code>", done:e=>e.snoop.on && e.snoop.vlans.includes(60)},
    {text:"<code>end</code>, then <code>show ip dhcp snooping</code>. Is VLAN 60 operational? Which port is trusted, and which have a rate of 15?", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+ip\s+dhcp\s+snoop\S*\s*$/i.test(h))},
  ],
  win:"Snooping in the safe order: the uplink trusted before the VLAN went live, desk ports rate-limited, option 82 off because the relay is IOS — and show ip dhcp snooping proves VLAN 60 is operational with Gi0/1 the only trusted port.",
  solve:["enable","configure terminal","interface g0/1","ip dhcp snooping trust","interface range g0/2 - 8","ip dhcp snooping limit rate 15","exit","no ip dhcp snooping information option","ip dhcp snooping vlan 60","ip dhcp snooping","end","show ip dhcp snooping"]})}
${K.hint(`<code>interface range g0/2 - 8</code> needs spaces around the dash. Trust and rate limits are interface commands; the VLAN and option-82 lines are global.`)}
<h3>Hands-on: the travel router in the meeting room</h3>
<p>The opening ticket, on the bench. In the frame log you'll see the rogue's Offer dropped — then a second, quieter failure that is the switch's own doing.</p>
${K.bench({id:"m8-rogue-dhcp", points:100, openLog:true, from:"CCNA · Module 8 · lesson 7", title:"a travel Wi-Fi router in the meeting room — let the switch refuse it", viewBox:"0 0 760 370",
  intro:"<b>The ticket:</b> Abuja, 10:20 — &ldquo;Since this morning the claims laptops work for a minute, then nothing.&rdquo; <b>Design:</b> VLAN 20 STAFF, 192.168.20.0/24. ABJ-R1 (gateway .1 and DHCP server, .1–.20 excluded) is on ABJ-SW1 <b>Gi0/8</b>; the claims PCs on Gi0/2 and Gi0/3; the meeting-room socket <b>Gi0/5</b> has the consultant's travel router (HOME-WIFI). Console to ABJ-SW1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab notes:</b> leases never expire; a PC with no address retries by itself; <code>/release</code> then <code>/renew</code> runs a full DORA.",
  devices:[
    {id:"r1", kind:"router", label:"ABJ-R1", x:300, y:20, config:e=>{ ["en","conf t","hostname ABJ-R1","no ip domain-lookup","int g0/0","description STAFF VLAN 20","ip address 192.168.20.1 255.255.255.0","no shut","exit","ip dhcp excluded-address 192.168.20.1 192.168.20.20","ip dhcp pool STAFF","network 192.168.20.0 255.255.255.0","default-router 192.168.20.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"ABJ-SW1", model:"Catalyst 9200", x:300, y:140, config:e=>{ ["en","conf t","hostname ABJ-SW1","no ip domain-lookup","vlan 20","name STAFF","exit","interface range g0/1 - 8","switchport mode access","switchport access vlan 20","exit","interface g0/8","description UPLINK ABJ-R1","interface g0/5","description MEETING ROOM","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"p1", kind:"pc", label:"CLAIMS-PC1", x:20, y:270, dhcp:true, mac:"0050.56a2.1102"},
    {id:"p2", kind:"pc", label:"CLAIMS-PC2", x:170, y:270, dhcp:true, mac:"0050.56a2.1103"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:320, y:270},
    {id:"home", kind:"router", label:"HOME-WIFI", x:530, y:270, config:e=>{ ["en","conf t","hostname HOME-WIFI","int g0/0","ip address 192.168.0.1 255.255.255.0","no shut","exit","ip dhcp pool HOME","network 192.168.0.0 255.255.255.0","default-router 192.168.0.1","exit","ip dhcp relay information trust-all","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g8"}, {type:"cat6", a:"p1:eth", b:"sw:g2"}, {type:"cat6", a:"p2:eth", b:"sw:g3"}, {type:"cat6", a:"home:g0", b:"sw:g5"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce: on CLAIMS-PC1 run <code>ipconfig /all</code>. Whose are the DHCP Server and the Default Gateway — and is that address anywhere in the design?", done:B=>Bench.tried(B,"p1",/ipconfig\s+\/all/i)},
    {text:"Console to ABJ-SW1, <code>enable</code>, <code>configure terminal</code>. Trust only the uplink (<code>interface g0/8</code>, <code>ip dhcp snooping trust</code>, <code>exit</code>), then switch snooping on for VLAN 20 (<code>ip dhcp snooping vlan 20</code>, <code>ip dhcp snooping</code>)", done:B=>{ const e=B.devs.sw.env; return e.snoop.on && e.snoop.vlans.includes(20) && !!e.intfs["GigabitEthernet0/8"].snoopTrust && !e.intfs["GigabitEthernet0/5"].snoopTrust; }},
    {text:"On CLAIMS-PC2: <code>ipconfig /release</code>, then <code>ipconfig /renew</code>, with the frame log open. Two different lines stop the PC getting an address — one is the protection working, the other is the switch breaking DHCP. Which is which?", done:B=>B.devs.sw.env.snoop.on && Bench.tried(B,"p2",/ipconfig\s+\/release/i) && Bench.tried(B,"p2",/ipconfig\s+\/renew/i)},
    {text:"ABJ-R1 is an IOS DHCP server: on ABJ-SW1 add <code>no ip dhcp snooping information option</code>. Done when CLAIMS-PC2 holds a lease from ABJ-R1 (192.168.20.x)", done:B=>B.devs.sw.env.snoop.opt82===false && /^192\.168\.20\./.test(Bench.leased(B,"p2")||"")},
    {text:"CLAIMS-PC1 still holds HOME-WIFI's lease. Move it with <code>ipconfig /release</code> and <code>ipconfig /renew</code>. Done when it has a 192.168.20.x lease and pings ABJ-R1 (192.168.20.1)", done:B=>/^192\.168\.20\./.test(Bench.leased(B,"p1")||"") && Bench.pinged(B,"p1","192.168.20.1")},
    {text:"Evidence and containment on ABJ-SW1: <code>show ip dhcp snooping binding</code> (which ports are the two rows on?), then shut the meeting-room port until facilities collect the box (<code>interface g0/5</code>, <code>shutdown</code>), <code>end</code> and <code>copy running-config startup-config</code>", done:B=>{ const e=B.devs.sw.env; return !!e.intfs["GigabitEthernet0/5"].shut && !!e.savedOnce && e.history.some(h=>/sh\S*\s+ip\s+dhcp\s+snoop\S*\s+bin/i.test(h)); }},
  ],
  win:"The switch now refuses HOME-WIFI: its Offer died on untrusted Gi0/5, the frame log showed the second failure — option 82 with giaddr 0.0.0.0, silently dropped by an IOS server — and one line fixed it. Both PCs lease from ABJ-R1, the binding table records them on Gi0/2 and Gi0/3, and the meeting-room port is shut until the box is gone.",
  solve:[["pc","p1","ipconfig /all"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/8"],["term","ip dhcp snooping trust"],["term","exit"],["term","ip dhcp snooping vlan 20"],["term","ip dhcp snooping"],["term","end"],
    ["pc","p2","ipconfig /release"],["pc","p2","ipconfig /renew"],
    ["term","configure terminal"],["term","no ip dhcp snooping information option"],["term","end"],
    ["pc","p2","ipconfig"],
    ["pc","p1","ipconfig /release"],["pc","p1","ipconfig /renew"],["pc","p1","ping 192.168.20.1"],
    ["term","show ip dhcp snooping binding"],["term","configure terminal"],["term","interface g0/5"],["term","shutdown"],["term","end"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 3: one line says a DHCP Offer is a SERVER message on an untrusted port (HOME-WIFI refused — good); the other is ABJ-R1 dropping a Discover carrying option 82 with giaddr 0.0.0.0. Task 4: the PC retries by itself once insertion is off. A PC holding the rogue's lease can't renew it either — the rogue's Ack arrives on untrusted Gi0/5 and is dropped (try <code>ipconfig /renew</code> alone: the PC keeps its old lease) — so on a real network it would move over only when that lease ran out; <code>/release</code> and <code>/renew</code> does it now.`)}
${K.check({q:"In the bench, before you removed option 82 insertion, ABJ-R1 had a pool for VLAN 20 and the uplink was trusted, yet CLAIMS-PC2 got APIPA. Why?", o:["The real server's Offer was dropped on the trusted port","The switch added option 82 with giaddr 0.0.0.0 and the IOS server dropped the Discover without answering","HOME-WIFI's Offer reached the PC first","Snooping blocks every Discover until the PC has a binding"], a:1, why:"Trust was right; the Discover never earned an Offer. A non-relay switch adds option 82 but can't set giaddr, and IOS drops that combination unless told to trust it."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"At a Kaduna branch the DHCP server is a central IOS router reached through a relay: KAD-R1 has ip helper-address on its LAN interface G0/0. The access switch inserts option 82 and everyone gets APIPA. The team wants to keep option 82 for reporting. Which interface command fixes it, and on which device and interface?", fields:[{label:"Command", a:["ip dhcp relay information trusted"], ios:true},{label:"Device and interface", a:["KAD-R1 G0/0","KAD-R1 g0/0","KAD-R1 GigabitEthernet0/0","G0/0 on KAD-R1","g0/0 on KAD-R1","KAD-R1 Gi0/0","KAD-R1, G0/0","KAD-R1 G0/0 (the LAN interface)"]}], why:"1. What is asked? Where IOS drops the message, and the per-interface trust command. 2. Which rule? The first IOS device receiving option 82 with giaddr 0.0.0.0 on an untrusted interface drops it — here the relay, before it writes its own giaddr. 3. Apply it: on KAD-R1 G0/0, ip dhcp relay information trusted. Turning insertion off on the switch would also work, but loses the option 82 the team wants."})}

<h2>Dynamic ARP Inspection: no binding, no ARP</h2>
${K.remember(`<b>The rule:</b> in a VLAN with DAI, the switch intercepts every ARP request and reply arriving on an <b>untrusted</b> port and checks its sender pair — &ldquo;IP X is at MAC Y&rdquo; — against the snooping bindings for that VLAN (and any ARP ACL applied). <b>Match: forwarded. No match: dropped and logged.</b> ARPs on trusted ports aren't checked.`)}
<p>Recall ARP (Module 1): a broadcast request (&ldquo;who has 10.50.30.1? tell 10.50.30.21&rdquo;) and a unicast reply (&ldquo;10.50.30.1 is at …&rdquo;). Both carry a <b>sender IP and MAC</b>, and receivers learn from both. ARP poisoning is a false sender pair; DAI compares it with the one source of truth the switch has — what snooping saw the DHCP server give that MAC on that port.</p>
${K.svg("0 0 760 330",
  K.txt(20,22,"DAI on KAN-SW1, VLAN 30: every ARP on an untrusted port is checked against the bindings",{c:"fg",s:12.5,b:true,f:"body"})+
  K.dev("pc",70,72,"KAN-PC1","DHCP · Gi0/2")+K.dev("router",690,72,"KAN-R1","trusted Gi0/1")+
  K.arrow(98,64,660,64,"ARP: 10.50.30.21 is at 0050.56a4.3021",true)+
  K.txt(380,86,"✓ matches a binding → forwarded",{mid:true,c:"ok",s:11,f:"body"})+
  K.link(380,92,380,112,"",true)+
  K.band(220,114,320,24,"KAN-SW1 binding table · VLAN 30")+
  K.band(220,140,320,22,"0050.56a4.3021  10.50.30.21  Gi0/2","var(--panel2)")+
  K.band(220,164,320,22,"0050.56a4.3022  10.50.30.22  Gi0/3","var(--panel2)")+
  K.link(380,188,380,206,"",true)+
  K.dev("printer",70,232,"PRN-SALES","static · Gi0/5")+
  K.arrow(98,224,360,224,"ARP: 10.50.30.5 is at 0017.c8a2.5e10")+
  K.txt(372,228,"✗ no binding → dropped",{c:"bad",s:11,f:"body"})+
  K.txt(372,246,"%SW_DAI-4-DHCP_SNOOPING_DENY logged",{c:"warn",s:10.5})+
  K.txt(380,300,"The printer's address was typed by hand, so snooping never saw it. To DAI it looks exactly like a false claim.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,318,"KAN-R1's ARPs arrive on trusted Gi0/1 and aren't checked — a router's static address has no binding either.",{mid:true,s:11,f:"body"}),
  "What DAI compares: the sender IP and MAC inside the ARP, the VLAN, and the binding for that MAC — on requests and replies alike.")}
<h3>Which ports to trust for DAI</h3>
<p>Trust the uplink or trunk toward the router and the rest of the network. The router's address is static — no binding — so if its replies arrive on an untrusted port, DAI drops them and the <b>whole VLAN loses its gateway</b>. Between two DAI switches, trust the trunk so each ARP is checked once, where it entered. Desk ports, printers and anything a user can reach stay untrusted.</p>
${K.mistake(`Trusting the uplink for snooping and forgetting DAI's own trust command. <code>ip dhcp snooping trust</code> and <code>ip arp inspection trust</code> are separate. Miss the second and every PC gets <code>Destination host unreachable</code> for its own gateway.`)}
<h3>Extra checks and the ARP rate limit</h3>
<p><code>ip arp inspection validate</code> adds consistency checks: <b>src-mac</b> — the frame's source MAC must equal the ARP's sender MAC; <b>dst-mac</b> — in replies, the frame's destination MAC must equal the ARP's target MAC; <b>ip</b> — no impossible addresses (0.0.0.0, 255.255.255.255, multicast). Each new <code>validate</code> line <b>replaces</b> the last, so put all three on one line. DAI also limits ARP on untrusted ports to <b>15 packets per second by default</b> and err-disables a port that exceeds it (cause <code>arp-inspection</code>); <code>ip arp inspection limit rate N</code> changes it. (The lab shows the validate settings but its devices never send inconsistent ARPs, and it doesn't model the ARP rate limit.)</p>
<h3>Worked example: DAI at an Enugu clinic</h3>
<p>ENU-SW1, VLAN 12 (172.16.12.0/24); snooping has run for a week, so every DHCP device has a binding; ENU-R1 is on Gi0/1.</p>
${K.steps([
  ["Check the bindings are complete", "<code>show ip dhcp snooping binding</code> against <code>show mac address-table vlan 12</code>: any DHCP device missing is dropped the moment DAI starts."],
  ["Trust the uplink, add the checks", "<code>interface g0/1</code> → <code>ip arp inspection trust</code>; then <code>ip arp inspection validate src-mac dst-mac ip</code>."],
  ["Switch it on", "<code>ip arp inspection vlan 12</code>."],
  ["Test and read", "Ping the gateway and a printer from a PC; <code>show ip arp inspection</code>, <code>show logging | include DAI</code>."],
])}
<p>Reception reaches the gateway — but not the CCTV ${K.g("NVR","Network video recorder: records the CCTV cameras; usually on a static address.")} or the printer, both hand-typed:</p>
${K.out(`C:\\Users\\reception>ping 172.16.12.8
Reply from 172.16.12.20: Destination host unreachable.
...
ENU-SW1#show logging | include DAI
*Oct 12 08:30:42.822: %SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi0/4, vlan 12.([0050.56b1.2208/172.16.12.8/0050.56b1.2a31/172.16.12.20/08:30:42 UTC Mon Oct 12 2026])
*Oct 12 08:30:49.959: %SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi0/5, vlan 12.([0050.56b1.2209/172.16.12.9/0050.56b1.2a31/172.16.12.20/08:30:49 UTC Mon Oct 12 2026])
ENU-SW1#show ip arp inspection statistics vlan 12
 Vlan      Forwarded        Dropped     DHCP Drops      ACL Drops
 ----      ---------        -------     ----------      ---------
   12              3              2              2              0`, "Trimmed. The PC's request was fine (it has a binding); the NVR's and printer's replies weren't. Unreachable from the PC's own address = ARP never completed (Module 7).")}
<p>Read a DAI line in four pieces: <b>(Res)</b>/<b>(Req)</b> — reply or request dropped; <b>on Gi0/4, vlan 12</b> — where to find the device; <b>[0050.56b1.2208/172.16.12.8/</b> — the <b>sender MAC and IP</b>, the claim DAI couldn't match (your ARP ACL needs this pair); then target MAC/IP (zeros in a request) and the time. <b>DHCP Drops</b> counts ARPs with no matching binding; <b>ACL Drops</b> those an ARP ACL denied.</p>
${K.check({q:"With DAI on VLAN 50, every PC suddenly gets Destination host unreachable for its gateway 10.5.50.1, and the log shows DHCP_SNOOPING_DENY (Res) on Gi0/1 with sender IP 10.5.50.1. Gi0/1 is the uplink. The fix?", o:["Add the gateway to the DHCP pool","ip arp inspection trust on Gi0/1, so the router's ARP replies aren't checked","ip dhcp snooping trust on every access port","Disable ip arp inspection validate"], a:1, why:"The router's static address has no binding, and its replies arrive on an uplink that isn't DAI-trusted. Trusting the uplink for DAI fixes the whole VLAN. Snooping trust is a separate setting."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"Decode this line from a warehouse switch: %SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Req) on Gi0/14, vlan 22.([3c52.82aa.10f0/172.22.4.40/0000.0000.0000/172.22.4.1/09:12:07 UTC Tue Oct 13 2026]). Which port is the device on, what IP does it claim, and which address was it looking for?", fields:[{label:"Port", a:["Gi0/14","g0/14","GigabitEthernet0/14","0/14","gi0/14"]},{label:"Claimed (sender) IP", a:["172.22.4.40"]},{label:"Address it was looking for", a:["172.22.4.1"]}], why:"1. What is asked? Three fields from one DAI line. 2. Which rule? The bracket is sender MAC / sender IP / target MAC / target IP / time; (Req) = a request, so the target MAC is zeros. 3. Apply it: the device on Gi0/14 claims 172.22.4.40 and is asking for 172.22.4.1 — probably its gateway. Next: is it a static device that needs an ARP ACL, or something claiming an address it was never leased?"})}

<h2>Static-IP devices: ARP ACLs for printers, recorders and servers</h2>
${K.remember(`<b>The rule:</b> a hand-typed address never did DHCP, so it has no binding and DAI drops its ARPs. An ${K.g("ARP ACL","A list of permitted IP-to-MAC pairs (arp access-list NAME, then permit ip host A mac host M) that DAI checks before the bindings; used for static-IP devices.")} lists &ldquo;this IP belongs to this MAC&rdquo;. Applied with <code>ip arp inspection filter NAME vlan N</code>, it is checked <b>first</b>: a permit lets the ARP through; with no matching line, DAI falls back to the bindings — unless you add <code>static</code>, which makes the ACL the only list.`)}
<h3>Worked example: the clinic's NVR and printer</h3>
${K.steps([
  ["Get each MAC from two sources", "The DAI log's sender pair, and the device's label or configuration page. If they disagree, find out why before permitting anything."],
  ["Write the ARP ACL", "<code>arp access-list ENU-STATIC</code> → one <code>permit ip host … mac host …</code> line per device, MACs in Cisco's dotted format."],
  ["Apply it to the VLAN", "<code>ip arp inspection filter ENU-STATIC vlan 12</code> — <b>without</b> <code>static</code>: the PCs still depend on their bindings."],
  ["Verify", "Ping the devices from a PC; <code>show ip arp inspection</code> shows ENU-STATIC under ACL Match and ACL Permits rising."],
])}
${K.out(`ENU-SW1(config)#arp access-list ENU-STATIC
ENU-SW1(config-arp-nacl)#permit ip host 172.16.12.8 mac host 0050.56b1.2208
ENU-SW1(config-arp-nacl)#permit ip host 172.16.12.9 mac host 0050.56b1.2209
ENU-SW1(config-arp-nacl)#exit
ENU-SW1(config)#ip arp inspection filter ENU-STATIC vlan 12
ENU-SW1(config)#end
ENU-SW1#show ip arp inspection
...
 Vlan     Configuration    Operation   ACL Match          Static ACL
 ----     -------------    ---------   ---------          ----------
   12     Enabled          Active      ENU-STATIC         No
...
 Vlan   DHCP Permits    ACL Permits  Probe Permits   Source MAC Failures
 ----   ------------    -----------  -------------   -------------------
   12              5              2              0                     0`, "The lab's ENU-SW1 after the ACL, trimmed. Static ACL No: the bindings still count for everyone else.")}
${K.when([
  ["<code>ip arp inspection filter NAME vlan N</code>","A few static devices share a VLAN with DHCP clients","ACL first, bindings as fallback","—"],
  ["<code>… vlan N static</code>","A VLAN of static devices only (servers, cameras)","Anything not in the ACL is dropped","Any DHCP client is in the VLAN"],
  ["A DHCP reservation","Printers and recorders that can use DHCP","They get a binding: no ACL to maintain","The device must work when DHCP is down"],
  ["<code>ip arp inspection trust</code> on its port","Infrastructure you control (a router, another DAI switch)","Its ARPs aren't checked","Any port a user can reach"],
], "A static device and DAI: which option?")}
${K.dyk(`The same binding table can feed <b>IP Source Guard</b> (beyond CCNA), which filters every IP packet — not only ARP — whose source doesn't match the port's binding. Snooping is the foundation; DAI and Source Guard are built on it.`)}
<h3>Hands-on: Kano — since Friday the printers don't print</h3>
<p>Nobody touched the printers; somebody touched the switch.</p>
${K.bench({id:"m8-dai-printers", points:100, openLog:true, from:"CCNA · Module 8 · lesson 7", title:"Kano branch: since Friday nobody can print — and the switch log is full of DAI messages", viewBox:"0 0 760 370",
  intro:"<b>The ticket:</b> Monday 08:30, Kano branch — &ldquo;Since Friday nobody can print. Email and the banking app are fine.&rdquo; On Friday evening a colleague enabled DHCP snooping and DAI on KAN-SW1 (VLAN 30) from the security baseline. <b>Design:</b> 10.50.30.0/24; KAN-R1 .1 — gateway and DHCP server — on <b>Gi0/1</b> (trusted for both); PCs by DHCP on Gi0/2 and Gi0/3; two printers with hand-typed addresses: <b>PRN-SALES 10.50.30.5</b> on Gi0/5 and <b>PRN-STORE 10.50.30.6</b> on Gi0/6. Console to KAN-SW1: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control.",
  devices:[
    {id:"r1", kind:"router", label:"KAN-R1", x:300, y:20, config:e=>{ ["en","conf t","hostname KAN-R1","no ip domain-lookup","int g0/0","description BRANCH VLAN 30","ip address 10.50.30.1 255.255.255.0","no shut","exit","ip dhcp excluded-address 10.50.30.1 10.50.30.20","ip dhcp pool BRANCH","network 10.50.30.0 255.255.255.0","default-router 10.50.30.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KAN-SW1", model:"Catalyst 9200", x:300, y:140, config:e=>{ ["en","conf t","hostname KAN-SW1","no ip domain-lookup","vlan 30","name BRANCH","exit","interface range g0/1 - 8","switchport mode access","switchport access vlan 30","exit","interface g0/1","description UPLINK KAN-R1","ip dhcp snooping trust","ip arp inspection trust","exit","no ip dhcp snooping information option","ip dhcp snooping vlan 30","ip dhcp snooping","ip arp inspection vlan 30","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"p1", kind:"pc", label:"KAN-PC1", x:20, y:270, dhcp:true, mac:"0050.56a4.3021"},
    {id:"p2", kind:"pc", label:"KAN-PC2", x:150, y:270, dhcp:true, mac:"0050.56a4.3022"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:280, y:270},
    {id:"pr1", kind:"printer", label:"PRN-SALES", x:420, y:270, ip:"10.50.30.5", mask:"255.255.255.0", gw:"10.50.30.1", mac:"0017.c8a2.5e10"},
    {id:"pr2", kind:"printer", label:"PRN-STORE", x:560, y:270, ip:"10.50.30.6", mask:"255.255.255.0", gw:"10.50.30.1", mac:"0017.c8a2.6f31"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"p1:eth", b:"sw:g2"}, {type:"cat6", a:"p2:eth", b:"sw:g3"}, {type:"cat6", a:"pr1:eth", b:"sw:g5"}, {type:"cat6", a:"pr2:eth", b:"sw:g6"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce from KAN-PC1: <code>ping 10.50.30.5</code>. Whose address does &ldquo;Destination host unreachable&rdquo; come from, and what does that say about ARP? Then <code>ping 10.50.30.1</code> — why does the gateway work when the printer doesn't?", done:B=>Bench.tried(B,"p1",/ping\s+10\.50\.30\.5\b/) && Bench.tried(B,"p1",/ping\s+10\.50\.30\.1\b/)},
    {text:"From KAN-PC2: <code>ping 10.50.30.6</code>, so PRN-STORE answers at least once", done:B=>Bench.tried(B,"p2",/ping\s+10\.50\.30\.6\b/)},
    {text:"Console to KAN-SW1, <code>enable</code>. Read the evidence: <code>show logging | include DAI</code> (write down each dropped sender's IP and MAC), <code>show ip dhcp snooping binding</code> (who is missing?) and <code>show ip arp inspection</code> (which counter is rising?)", done:B=>{ const h=B.devs.sw.env.history; return h.some(x=>/sh\S*\s+log/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+dhcp\s+snoop\S*\s+bin/i.test(x)) && h.some(x=>/sh\S*\s+ip\s+arp\s+insp/i.test(x)); }},
    {text:"Write an ARP ACL with one permit line per printer — <code>arp access-list KANO-PRINTERS</code>, then <code>permit ip host 10.50.30.5 mac host</code> followed by PRN-SALES's MAC from the log, the same for PRN-STORE, and <code>exit</code> — and apply it with <code>ip arp inspection filter KANO-PRINTERS vlan 30</code> (no <code>static</code>: the PCs still need their bindings). Done when KAN-PC1 pings PRN-SALES and KAN-PC2 pings PRN-STORE", done:B=>{ const e=B.devs.sw.env; return !!e.dai.filters[30] && !(e.dai.statics||{})[30] && Bench.pinged(B,"p1","10.50.30.5") && Bench.pinged(B,"p2","10.50.30.6"); }},
    {text:"Prove it and save: <code>show ip arp inspection</code> — the ACL Match column and the ACL Permits counter — then <code>copy running-config startup-config</code>. Check the PCs still reach KAN-R1 (<code>ping 10.50.30.1</code> from KAN-PC2)", done:B=>!!B.devs.sw.env.savedOnce && Bench.pinged(B,"p2","10.50.30.1")},
  ],
  win:"Friday's change worked exactly as designed — that was the problem: the printers' addresses were typed by hand, so snooping had no binding for them and DAI treated their ARP replies as false claims. The log gave you each printer's sender pair; an ARP ACL without static let them through while the PCs kept passing on their bindings. Printing is back, and the protection stays on.",
  solve:[["pc","p1","ping 10.50.30.5"],["pc","p1","ping 10.50.30.1"],["pc","p2","ping 10.50.30.6"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging | include DAI"],["term","show ip dhcp snooping binding"],["term","show ip arp inspection"],
    ["term","configure terminal"],["term","arp access-list KANO-PRINTERS"],["term","permit ip host 10.50.30.5 mac host 0017.c8a2.5e10"],["term","permit ip host 10.50.30.6 mac host 0017.c8a2.6f31"],["term","exit"],["term","ip arp inspection filter KANO-PRINTERS vlan 30"],["term","end"],
    ["pc","p1","ping 10.50.30.5"],["pc","p2","ping 10.50.30.6"],
    ["term","show ip arp inspection"],["term","copy running-config startup-config"],["term",""],["pc","p2","ping 10.50.30.1"]]})}
${K.hint(`Task 1: the reply comes from KAN-PC1's own address — its ARP got no answer, because DAI dropped the printer's reply on Gi0/5. The gateway's replies arrive on trusted Gi0/1. Task 4: the sender MAC is the first field inside the square brackets.`)}
${K.check({q:"After the Kano fix, a colleague suggests ip arp inspection filter KANO-PRINTERS vlan 30 static 'to be stricter'. What would happen?", o:["Nothing — static only changes the logging","The printers keep working, but every DHCP PC is dropped: with static only the ARP ACL counts, and the PCs aren't in it","The printers stop working and the PCs keep working","DAI would be disabled on VLAN 30"], a:1, why:"static removes the fallback to the bindings. That suits a VLAN of static devices only, not a mixed branch VLAN."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Port Harcourt site adds a door-access controller with the static address 10.70.5.20. Its label shows the MAC in Windows style: 00-1A-2B-3C-4D-5E. DAI is on in VLAN 5 and the ARP ACL is called SITE-STATIC. Write the line you add inside arp access-list SITE-STATIC.", fields:[{label:"ARP ACL line", a:["permit ip host 10.70.5.20 mac host 001a.2b3c.4d5e","permit ip host 10.70.5.20 mac host 001A.2B3C.4D5E"]}], why:"1. What is asked? One ARP ACL line. 2. Which rule? permit ip host <IP> mac host <MAC>, MAC in Cisco's dotted format (three groups of four hex digits). 3. Apply it: 00-1A-2B-3C-4D-5E regrouped is 001a.2b3c.4d5e. The ACL is already applied to VLAN 5, so the controller passes as soon as the line exists."})}

${K.drill({title:"does DAI forward this ARP?", types:["daicheck"], count:5})}
<h2>Rolling it out safely — and troubleshooting when a floor goes dark</h2>
${K.remember(`<b>The order rule:</b> snooping before DAI, evidence before enforcement. <b>1</b> trust the uplinks for snooping · <b>2</b> enable snooping per VLAN (option 82 decided) · <b>3</b> wait until the bindings list every DHCP device · <b>4</b> ARP ACL for the statics · <b>5</b> trust the uplinks for DAI · <b>6</b> enable DAI per VLAN. Hook: &ldquo;<b>Trust, Snoop, Wait, List, Trust, Inspect</b>&rdquo;.`)}
<p>Why wait? Clients that leased before snooping have no binding until their next DHCP exchange (with 1-day leases, most renew within 12 hours). So: snooping one evening, DAI a day or two later, once the binding count matches the active devices.</p>
<div class="tablewrap"><table>
<tr><th>Symptom</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td>Snooping on: nobody new gets an address</td><td>The real Offer dropped as a server message; uplink not trusted in <code>show ip dhcp snooping</code></td><td>Trust the uplink</td></tr>
<tr><td>Same, uplink trusted, IOS server</td><td>&ldquo;Insertion of option 82 is enabled&rdquo;; the server never answers</td><td>Insertion off, or relay information trust</td></tr>
<tr><td>One desk port err-disabled</td><td>Cause <code>dhcp-rate-limit</code> or <code>arp-inspection</code></td><td>Find what flooded; raise the limit if legitimate; recover</td></tr>
<tr><td>DAI on: one static device unreachable</td><td>DAI drops with its static IP as sender</td><td>ARP ACL entry or DHCP reservation</td></tr>
<tr><td>DAI on: whole VLAN loses its gateway</td><td><b>(Res)</b> drops from the gateway's IP on the uplink</td><td><code>ip arp inspection trust</code> on the uplink</td></tr>
<tr><td>DAI on (or after a reload): older PCs fail, newcomers fine</td><td>They're missing from the bindings; <b>(Req)</b> drops</td><td>Back DAI out, let bindings fill, re-enable</td></tr>
</table></div>
${K.exam(`Reading snooping and DAI questions: before the options, write down <b>1.</b> the port the message <i>arrives</i> on and whether it's trusted, <b>2.</b> whether it's a server message (Offer, Ack, NAK) or a client one, and for ARP <b>3.</b> whether the sender has a binding or ARP ACL entry. Traps: trusting access ports instead of the uplink; &ldquo;DAI works without snooping&rdquo;; forgetting that routers and printers have static addresses; option 82 offered as an attack.`)}
${K.job("“The whole Sales floor lost everything after last night's change”",`
<p><b>The alert.</b> 08:15 at a Lagos fintech: &ldquo;Nobody on the Sales floor can reach anything; Wi-Fi users are fine.&rdquo; Last night's change: <i>&ldquo;Enable DAI on VLAN 40, LOS-ACC1 (snooping enabled last week).&rdquo;</i> LOS-ACC1 Gi0/1 is a trunk to LOS-CORE, which connects to router LOS-R1 (10.60.40.1).</p>
<p><b>Questions first.</b> Who? Every wired Sales PC. What changed? DAI on LOS-ACC1, nine hours ago — and Wi-Fi doesn't pass through it.</p>
<p><b>Checks.</b> A Sales PC's <code>ipconfig</code>: 10.60.40.21, gateway 10.60.40.1 — addressing fine. Then:</p>
${K.out(`C:\\Users\\sales>ping 10.60.40.1
Reply from 10.60.40.21: Destination host unreachable.
...
LOS-ACC1#show logging | include DAI
*Oct 13 08:16:02.411: %SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi0/1, vlan 40.([00a3.8e21.5f01/10.60.40.1/0050.56a4.4021/10.60.40.21/08:16:02 UTC Tue Oct 13 2026])
LOS-ACC1#show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  --------------------
00:50:56:A4:40:21   10.60.40.21      51217       dhcp-snooping   40    GigabitEthernet0/2
...
Total number of bindings: 23`, "The PC's request got out; the router's reply was dropped where it entered the access switch — on the uplink.")}
<p><b>Diagnosis.</b> The bindings are complete (23, matching the wired PCs in <code>show mac address-table vlan 40</code>). The dropped message is a <b>reply</b> from <b>10.60.40.1</b> on <b>Gi0/1</b>: the gateway's static address has no binding, and the trunk was never made DAI-trusted.</p>
<p><b>Fix</b> (emergency change, approved by the duty manager): <code>interface g0/1</code> → <code>ip arp inspection trust</code>. A Sales PC pings 10.60.40.1; no new DAI lines; <code>show ip arp inspection</code> shows Forwarded rising, Dropped flat; config saved.</p>
<p><b>What you say.</b> &ldquo;Last night's protection was also checking the router's announcements, which it can't vouch for, so PCs couldn't find their gateway. The switch now trusts the link to the router; everything works and the protection stays on.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;08:15 Sales VLAN 40 outage after DAI change on LOS-ACC1. Cause: Gi0/1 (trunk to LOS-CORE) not DAI-trusted; gateway ARP replies dropped (SW_DAI-4-DHCP_SNOOPING_DENY Res on Gi0/1). Fixed 08:29: ip arp inspection trust Gi0/1; verified; saved. Action: add DAI uplink trust to the change template.&rdquo;</i></p>`)}
${K.case("A school that kept getting 'free Wi-Fi'",`
<p><b>The setting.</b> A secondary school in Ibadan with an IOS router as DHCP server. Twice a term someone plugged a travel router into a classroom socket and lab PCs took 192.168.x.x addresses mid-lesson; finding each box took IT an hour.</p>
<p><b>The decision.</b> Prevention over detection: snooping, then DAI. Port security alone wouldn't do — in a spare socket a travel router is the first and only MAC (its Wi-Fi users hide behind its NAT), so it passes a maximum of 1 — and 802.1X (lesson 3) was too big for one term.</p>
<p><b>The rollout.</b> A pilot switch in a holiday week (uplink trusted, option 82 off, desks at 15 pps) surfaced two static devices — a photocopier and a card terminal — which moved to DHCP reservations instead of ARP ACLs. A week later, with binding counts matching the MAC tables, DAI went on from the pilot's checklist.</p>
<p><b>The result.</b> The next travel router's Offers never left its port. The rate limit err-disabled one port in the first month: a lab PC whose faulty driver re-sent requests in a loop. <b>The lesson:</b> these features fail on what nobody listed — statics, uplinks, option 82. A pilot turns those into a checklist.</p>`)}
${K.myth([
  ["DHCP snooping removes the rogue server.","It drops the rogue's server messages at its port. The box is still there — find it, remove it, talk to its owner."],
  ["Trusted ports are for trusted people.","Trust is about direction: toward the real server. A desk port stays untrusted however senior the person at it."],
  ["DAI works on its own.","DAI needs snooping bindings (or ARP ACLs). Without snooping there are no bindings, so on untrusted ports it drops every ARP that no ARP ACL permits — every DHCP client included."],
  ["Static addresses are safe from DAI.","They break first: no DHCP, no binding. They need an ARP ACL entry, a reservation, or (infrastructure only) a trusted port."],
  ["Option 82 is part of an attack.","It's a standard relay option (RFC 3046). The problem is only that a snooping switch sends it with giaddr 0.0.0.0, which IOS refuses unless trusted."],
])}
${K.dodont([
  "Trust the uplink before enabling snooping on a live VLAN.",
  "Decide about option 82 before go-live.",
  "Compare the binding count with active DHCP devices before enabling DAI.",
  "Trust uplinks for DAI as well as for snooping.",
  "List every static device first; prefer DHCP reservations where possible.",
],[
  "Don't trust desk ports to make a complaint go away.",
  "Don't enable snooping and DAI in the same change window.",
  "Don't rate-limit trusted uplinks.",
  "Don't use static on an ARP filter in a VLAN with DHCP clients.",
])}
${K.check({q:"Snooping and DAI were enabled on VLAN 70 in the same evening. Next morning, PCs left on overnight can't reach their gateway; PCs booted that morning work. Why?", o:["The morning PCs have different MAC addresses","The overnight PCs leased before snooping existed and have had no DHCP exchange since, so they have no bindings and DAI drops their ARPs; the morning PCs ran a full DORA through the switch","DAI blocks PCs that have been on for more than 8 hours","The DHCP pool ran out overnight"], a:1, why:"Bindings come from DHCP traffic through the switch. An older lease has none — and its unicast renewal needs ARP, which DAI now drops. Back DAI out, let bindings fill, re-enable."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A Kano warehouse switch has a trunk uplink, a DHCP server behind it, desk PCs on DHCP and two static label printers. Put the rollout steps in a safe order.", items:["Trust the uplink for DHCP snooping","Turn option 82 insertion off (the relay is IOS), then enable snooping for the VLAN","Wait until show ip dhcp snooping binding lists every DHCP device","Create an ARP ACL for the two printers and apply it to the VLAN without static","Trust the uplink for DAI","Enable ip arp inspection for the VLAN"], why:"1. What is asked? A safe order for six steps. 2. Which rule? Evidence before enforcement: snooping correct and complete before DAI relies on it, and every exception (statics, uplinks) in place before checking starts. 3. Apply it: trust, option 82, snooping on, bindings complete, printers listed, uplink trusted for DAI, then DAI."})}

<h2>Interview corner</h2>
${K.hint(`Port-based trust, which messages, the binding table, what you check before go-live.`)}
${K.reveal("“What is DHCP snooping, and how would you deploy it?”",`<p>"It makes switch ports trusted or untrusted for DHCP: Offer, Ack and NAK are accepted only on trusted ports, so a rogue server on a desk port is ignored, and rate limits slow starvation. It also builds the binding table DAI uses. I'd trust the uplinks first, decide about option 82 — IOS drops it with giaddr 0.0.0.0 — rate-limit access ports, enable it per VLAN on a pilot switch, and check the bindings."</p>`)}
${K.hint(`What it compares, what it depends on, what it breaks.`)}
${K.reveal("“How does DAI stop ARP spoofing — and what breaks when you turn it on?”",`<p>"ARP has no authentication. DAI checks the sender IP and MAC of each ARP on untrusted ports against the snooping bindings or an ARP ACL, and drops and logs mismatches. Anything without a binding breaks: static printers (ARP ACL or reservation), the router's replies if the uplink isn't DAI-trusted — the whole VLAN — and clients that leased before snooping. So: snooping first, wait for bindings, list statics, trust uplinks, then DAI."</p>`)}
${K.hint(`The uplink is trusted, so the trust model is fine. Which other snooping default affects an IOS server?`)}
${K.reveal("“Right after you enable snooping, every user gets 169.254. The uplink is trusted. What's going on?”",`<p>"169.254 means no Offer arrived. With trust right, the classic cause is option 82: the switch inserts it with giaddr 0.0.0.0 and an IOS server or relay drops it silently — show ip dhcp snooping says insertion is enabled. Fix: no ip dhcp snooping information option, or ip dhcp relay information trusted on the router if we need option 82; then renew a client and check its binding."</p>`)}

${K.recap([
  "DHCP and ARP trust whoever answers: a rogue server hands out a wrong gateway, starvation empties the pool, ARP poisoning claims another host's IP. Snooping and DAI add the check at the switch port.",
  "Snooping: ports untrusted by default; Offer, Ack and NAK accepted only on trusted ports; trust only toward the real server.",
  "Config: ip dhcp snooping plus ip dhcp snooping vlan N, trust on the uplink, limit rate on access ports (exceeded = err-disabled).",
  "Option 82 is inserted with giaddr 0.0.0.0; IOS drops it. Fix: no ip dhcp snooping information option, or ip dhcp relay information trusted / trust-all.",
  "The binding table (MAC, IP, lease, VLAN, port) comes from DHCP traffic; statics and older leases aren't in it, and a reload empties it.",
  "DAI checks each untrusted ARP's sender pair against the bindings or an ARP ACL; mismatches are dropped and logged as %SW_DAI-4-DHCP_SNOOPING_DENY. Trust the uplinks for DAI too.",
  "Static devices: arp access-list with permit ip host IP mac host MAC, applied with ip arp inspection filter NAME vlan N — without static in mixed VLANs.",
  "Rollout: trust, snoop, wait for bindings, list statics, trust for DAI, inspect.",
])}
${K.next(`<b>Lesson 8 — Putting it together: harden and verify a site.</b> A security checklist for the management plane, the data plane and the switch edge, how to prove each item with show commands — and the Module 8 challenge, where a broken site hides an untrusted uplink and a printer dropped by DAI among its faults.`)}
`,
quiz:[
  {lvl:2, type:"multi", q:"DHCP snooping is enabled on VLAN 20. Which three messages are dropped if they arrive on an untrusted port? (Choose three.)", o:["DHCP Discover","DHCP Offer","DHCP Request","DHCP Ack","DHCP NAK","DHCP Release from the port where the client's binding was learned"], a:[1,3,4], why:"Offer, Ack and NAK are server messages, accepted only on trusted ports. Discover and Request are client messages, allowed on untrusted ports (with checks). A Release is dropped only when it comes from a different port than the binding's."},
  {lvl:1, q:"Which port should normally be configured with ip dhcp snooping trust on an access switch?", o:["Every port with a PC on it","The uplink toward the legitimate DHCP server","The port with the most DHCP traffic","No port — snooping trusts the uplink automatically"], a:1, why:"Trust describes direction: the real server's Offers and Acks arrive on the uplink, so that port is trusted. Every port is untrusted by default, uplinks included, and desk ports should stay untrusted."},
  {lvl:1, q:"What does Dynamic ARP Inspection compare an ARP message with?", o:["The switch's MAC address table","The DHCP snooping binding table (or an ARP ACL) for that VLAN","The router's routing table","The PC's own ARP cache"], a:1, why:"DAI checks the sender IP and MAC in the ARP against the snooping bindings for that VLAN, or a configured ARP ACL. The MAC table shows where a MAC is, not which IP it's entitled to."},
  {lvl:1, q:"Why does ARP poisoning work on a LAN without DAI?", o:["ARP messages are encrypted with a weak key","ARP has no authentication, and hosts update their caches from replies they never asked for","Switches forward ARP only to the gateway","ARP uses TCP, which can be hijacked"], a:1, why:"Any host can send an ARP claiming an IP; receivers believe it and update their caches (the same mechanism as a legitimate gratuitous ARP). DAI adds the missing check at the switch."},
  {lvl:2, q:"Right after DHCP snooping is enabled on SW1, every client on it falls back to APIPA. The DHCP server is the IOS router R1 on Gi0/8. Based on the exhibit, what is the best fix?", ex:"SW1#show ip dhcp snooping\nSwitch DHCP snooping is enabled\nSwitch DHCP gleaning is disabled\nDHCP snooping is configured on following VLANs:\n10\nDHCP snooping is operational on following VLANs:\n10\n...\nInsertion of option 82 is enabled\n   circuit-id default format: vlan-mod-port\n   remote-id: 0050.4a52.00ff (MAC)\nOption 82 on untrusted port is not allowed\n...\nInterface                  Trusted    Allow option    Rate limit (pps)\n-----------------------    -------    ------------    ----------------\nGigabitEthernet0/8         yes        yes             unlimited", o:["ip dhcp snooping trust on every access port","no ip dhcp snooping information option on SW1 (or ip dhcp relay information trust-all on R1)","ip dhcp snooping limit rate 100 on Gi0/8","Remove ip dhcp snooping vlan 10"], a:1, why:"Gi0/8 is trusted, so the trust model is fine. Option 82 insertion is enabled: SW1 adds option 82 with giaddr 0.0.0.0, and the IOS server drops those Discovers. Turn insertion off on the switch or make the router trust the relay information. Trusting access ports would let rogue servers in."},
  {lvl:2, type:"fill", q:"Write the global command that stops a snooping switch inserting option 82 into clients' DHCP messages.", fields:[{label:"Command", a:["no ip dhcp snooping information option"], ios:true}], why:"no ip dhcp snooping information option. With an IOS DHCP server or relay that would otherwise drop option 82 with giaddr 0.0.0.0, this is the simplest fix when nothing uses option 82."},
  {lvl:2, type:"order", q:"Put the rollout of DHCP snooping and DAI on a live access switch in a safe order.", items:["Trust the uplink for DHCP snooping","Enable DHCP snooping for the VLAN (with the option-82 decision made)","Check that the binding table lists every DHCP device","Create and apply an ARP ACL for the static devices","Trust the uplink for DAI","Enable DAI for the VLAN"], why:"Trust before enabling, so the real server is never dropped; bindings complete before DAI relies on them; every exception (statics, uplinks) in place before inspection starts. Enabling DAI early drops every device without a binding."},
  {lvl:2, type:"match", q:"Match each threat with the control that addresses it.", pairs:[["A home router on a desk port answering Discovers","DHCP snooping with only the uplink trusted"],["A host claiming the gateway's IP with its own MAC","Dynamic ARP Inspection"],["One port requesting hundreds of addresses a minute","DHCP snooping rate limit (with port security)"],["An unknown laptop replacing the PC on a desk port","Port security"]], why:"Rogue servers are stopped by port-based trust for server messages; false ARP claims by DAI; floods of requests by rate limits and MAC limits; an unexpected device on a known port by port security."},
  {lvl:2, q:"Users report a printer stopped working after DAI was enabled. Based on the exhibit, what is the right fix?", ex:"BR-SW1#show logging | include DAI\n*Oct 12 08:30:42.822: %SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi0/9, vlan 15.([0017.c8a2.7a44/10.15.0.8/0050.56a4.1510/10.15.0.31/08:30:42 UTC Mon Oct 12 2026])", o:["Add an ARP ACL with permit ip host 10.15.0.8 mac host 0017.c8a2.7a44 and apply it with ip arp inspection filter NAME vlan 15","ip arp inspection trust on Gi0/9","ip dhcp snooping trust on Gi0/9","Clear the DHCP snooping binding table"], a:0, why:"The dropped sender is 10.15.0.8 at 0017.c8a2.7a44 — the static printer, which has no binding. An ARP ACL entry for exactly that pair lets it through while the port stays checked. Trusting Gi0/9 would stop checking a port users can reach."},
  {lvl:2, type:"fill", q:"Inside arp access-list STATIC, write the line that permits the camera recorder 10.9.9.9 whose MAC is 0050.56aa.0001.", fields:[{label:"Line", a:["permit ip host 10.9.9.9 mac host 0050.56aa.0001"]}], why:"permit ip host <sender IP> mac host <sender MAC>, MAC in dotted format. Applied with ip arp inspection filter STATIC vlan N, DAI checks it before the bindings."},
  {lvl:2, q:"An untrusted access port configured with ip dhcp snooping limit rate 10 receives 40 DHCP packets in one second. What happens on a Catalyst switch?", o:["The extra packets are queued and sent later","The port is err-disabled; it recovers with shutdown / no shutdown or errdisable recovery cause dhcp-rate-limit","The port becomes trusted","The DHCP server's pool is locked"], a:1, why:"Exceeding the snooping rate limit err-disables the port (cause dhcp-rate-limit), like a port-security shutdown. Fix the cause, then bounce the port or let errdisable recovery retry after its interval."},
  {lvl:3, q:"On a two-switch site, DAI is enabled on access switch ACC1 for VLAN 40. All wired PCs suddenly show Destination host unreachable for their gateway 10.60.40.1, while the binding table lists every PC. ACC1's log shows DHCP_SNOOPING_DENY (Res) on Gi0/1 with sender IP 10.60.40.1. Gi0/1 is the trunk to the core switch. What is the cause?", o:["The PCs' leases expired","Gi0/1 isn't DAI-trusted: the gateway's static address has no binding, so its ARP replies are dropped as they enter ACC1","The core switch needs DAI enabled first","Option 82 is being inserted"], a:1, why:"The PCs have bindings, so their requests pass. The dropped messages are replies from 10.60.40.1 arriving on the uplink. The router's address is static, so DAI must not check that port: ip arp inspection trust on Gi0/1."},
  {lvl:3, q:"Snooping and DAI were enabled on VLAN 70 in the same overnight change. In the morning, PCs left on overnight can't reach their gateway; PCs started that morning are fine; show ip dhcp snooping binding lists only the morning PCs. What is the best immediate action?", o:["Make every access port DAI-trusted","Disable DAI for VLAN 70 (no ip arp inspection vlan 70), let the remaining clients renew and appear in the binding table, then re-enable DAI","Clear the DHCP server's bindings","Add every PC to an ARP ACL with static"], a:1, why:"The overnight PCs leased before snooping existed, so they have no bindings, and their unicast renewals need ARP — which DAI now drops. Backing DAI out restores service at once while snooping keeps protecting DHCP; once the bindings are complete, DAI goes back on. Trusting access ports or listing every PC defeats the purpose."},
  {lvl:3, type:"multi", q:"A data-centre switch's VLAN 200 holds only servers with static addresses, all listed in ARP ACL DC-SERVERS. Then a technician connects a DHCP laptop to VLAN 200 for testing, and it gets an address but can't ping anything. Based on the exhibit, which two statements are true? (Choose two.)", ex:"DC-SW1#show ip arp inspection vlan 200\n...\n Vlan     Configuration    Operation   ACL Match          Static ACL\n ----     -------------    ---------   ---------          ----------\n  200     Enabled          Active      DC-SERVERS         Yes", o:["Static ACL Yes means only DC-SERVERS counts: the laptop's DHCP binding is ignored and its ARPs are dropped","The laptop's lease failed because DAI blocks DHCP","Removing static from the filter would let the laptop pass on its binding while the servers still pass on the ACL","DAI must be trusted on the laptop's port for the laptop to get an address","The ARP ACL needs a permit for the DHCP server first"], a:[0,2], why:"With static, DAI has no fallback to the bindings, so a DHCP client not in the ACL is dropped (it still leases: DHCP isn't ARP). Without static, the ACL is checked first and the bindings are the fallback — the servers pass on the ACL, the laptop on its binding. Trusting a port a technician can plug into would remove the check altogether."},
  {lvl:3, q:"At a training centre, new laptops get 169.254, existing users are fine, show ip dhcp pool shows no free addresses, and the binding list holds hundreds of client IDs nobody recognises, almost all learned on one access port. Which combination best prevents a repeat while keeping normal users working?", o:["Shorten the lease to one hour and do nothing else","DHCP snooping with a rate limit on access ports, its source-MAC/chaddr check, and port security limiting the MACs per port","Trust that access port for DHCP snooping","Enable DAI only"], a:1, why:"This is DHCP starvation: one port claiming many client addresses. A rate limit err-disables a flooding port, the chaddr check drops requests whose claimed address doesn't match the frame, and port security caps the MACs the port may use. Short leases only speed recovery; DAI protects ARP, not the pool; trusting the port does the opposite of what's needed."},
],
cards:[
  {f:"DHCP snooping — the rule", b:"Every port in a snooping VLAN is untrusted unless configured. Server messages (Offer, Ack, NAK) are dropped on untrusted ports; client messages are allowed but checked. Trust only the ports toward the real DHCP server."},
  {f:"Enabling DHCP snooping", b:"ip dhcp snooping (global) AND ip dhcp snooping vlan N — both needed. Interface: ip dhcp snooping trust (uplink), ip dhcp snooping limit rate N (access ports). Verify: show ip dhcp snooping."},
  {f:"Safe order for snooping", b:"Trust the uplink first, then enable the VLAN. Enabling the VLAN with the uplink untrusted drops the real server's Offers: new clients get APIPA and renewals fail."},
  {f:"Option 82 and giaddr 0.0.0.0", b:"A snooping switch inserts option 82 by default but can't set giaddr. An IOS DHCP server or relay drops option 82 with giaddr 0.0.0.0. Fix: no ip dhcp snooping information option (switch) or ip dhcp relay information trusted / trust-all (router)."},
  {f:"DHCP snooping binding table", b:"MAC, IP, lease (sec), VLAN, port for each DHCP client on an untrusted port. Built from DHCP traffic; static devices and clients that leased earlier aren't in it; a reload empties it. show ip dhcp snooping binding."},
  {f:"Snooping rate limit", b:"ip dhcp snooping limit rate N (pps) on untrusted ports. Exceeded = err-disabled (dhcp-rate-limit); recover with shutdown / no shutdown or errdisable recovery. Don't rate-limit trusted uplinks."},
  {f:"Rogue DHCP vs starvation vs ARP poisoning", b:"Rogue: a second server hands out a wrong gateway (outage or man-in-the-middle) — snooping. Starvation: many fake requests empty the pool — rate limit, chaddr check, port security. ARP poisoning: a host claims another's IP — DAI."},
  {f:"Dynamic ARP Inspection — the rule", b:"On untrusted ports in an inspected VLAN, each ARP's sender IP/MAC must match a snooping binding or an ARP ACL; no match = dropped and logged (%SW_DAI-4-DHCP_SNOOPING_DENY). Trusted ports aren't checked. Depends on DHCP snooping."},
  {f:"DAI commands", b:"ip arp inspection vlan N · interface: ip arp inspection trust (uplinks) · ip arp inspection validate src-mac dst-mac ip (one line — each new line replaces the last) · show ip arp inspection [statistics]. Default ARP rate limit on untrusted ports: 15 pps."},
  {f:"Reading a DAI log line", b:"(Req)/(Res) on PORT, vlan N.([sender MAC/sender IP/target MAC/target IP/time]). The sender pair is the claim DAI couldn't match — the pair an ARP ACL needs."},
  {f:"ARP ACL for static devices", b:"arp access-list NAME → permit ip host IP mac host MAC; apply: ip arp inspection filter NAME vlan N. Checked before the bindings. Add static only if the VLAN has no DHCP clients — static ignores the bindings."},
  {f:"Two trust commands", b:"ip dhcp snooping trust and ip arp inspection trust are separate. Forget DAI trust on the uplink and the router's ARP replies (static address, no binding) are dropped: the whole VLAN loses its gateway."},
],
});

L.push({
id:"sec-harden-verify", mins:135, level:"Intermediate · builds on Module 8 lessons 1–7",
t:"Putting it together: harden and verify a site — the security checklist, a team baseline, and the Module 8 challenge",
html:`
${K.goals([
  "Harden a small site plane by plane — management, control, data and the switch edge — and say what each control stops.",
  "Prove each control with the show command that confirms it is configured and the test from the user's side that confirms it works, both the allowed way and the refused way.",
  "Write a one-page security baseline that a team can apply, check and keep up to date.",
  "Find and fix seven independent faults and holes in the Module 8 challenge from the devices' own evidence.",
  "Document a security portfolio project — policy, configs, evidence and a write-up — that an employer can check.",
])}
${K.pre(["Module 8 lessons 1–7: threats and mitigations, device access and passwords, AAA, standard and extended ACLs, port security, DHCP snooping and DAI.","Module 7: NTP, syslog severity levels and config backups with TFTP.","Module 2: SSH set-up (domain name, RSA keys, local users, VTY lines).","Module 5: OSPF neighbours and passive interfaces."])}

<h2>Why this matters at work</h2>
<p>Thursday, 10:00, at a managed-service provider in Victoria Island, Lagos. A client's external auditor has a list: &ldquo;Telnet is disabled on every device. Only the IT team can log in. Failed logins are recorded centrally. Unknown devices can't use a desk port.&rdquo; Next to each line is one word: <b>evidence</b>. Your manager forwards it: &ldquo;You configured that site in March. Can you prove it by Monday?&rdquo;</p>
<p>Configuring security is half the job. The other half is showing that it works — and noticing when a change, a desk move or a template from 2019 has quietly undone it. This lesson joins lessons 1–7 into one checklist, shows how to verify each item, turns the checklist into a baseline a team can use, and ends with a broken site to fix and a portfolio project to build.</p>

<h2>The hardening logic: four places to protect, two ways to prove</h2>
${K.remember(`<p><b>The hardening rule:</b> every way <i>into</i> or <i>through</i> a device is either needed — and then limited to the people and devices that need it — or it is switched off. <b>A control is finished only when you have seen it work both ways:</b> the allowed thing still works, the refused thing fails the way you expected, and a counter or log line recorded it.</p>`)}
<p>${K.g("Hardening","Reducing what a device will accept, so fewer things can go wrong or be misused: closing unused services and ports, limiting who can log in and from where, and recording what happens.")} becomes manageable when you split each device into the jobs it does — its <b>planes</b>:</p>
<ul>
<li><b>${K.g("Management plane","Everything used to manage the device itself: logins over the console, SSH and Telnet, AAA, SNMP, NTP, syslog, config backups.")}</b> — logging in to and managing the device. One stolen admin login undoes every other control.</li>
<li><b>${K.g("Control plane","The device's own decision-making traffic: routing protocols such as OSPF, ARP, STP and similar protocols that build the tables the device forwards with.")}</b> — the protocols that build the tables. The risk: false information, such as a fake OSPF neighbour advertising routes.</li>
<li><b>${K.g("Data plane","The users' traffic passing through the device — the packets it forwards from one interface to another. ACLs filter it.")}</b> — users' packets passing through. The risk: reaching what they shouldn't, such as the finance server from guest Wi-Fi.</li>
<li><b>The switch edge</b> — the access ports anyone can plug into, with their own threats (lessons 6–7): unknown devices, rogue DHCP servers, false ARP replies.</li>
</ul>
<p>This is lesson 1's <b>defence in depth</b>: a laptop in a desk port meets port security, then DAI, then the edge ACL; a login attempt meets the VTY access-class, then AAA, then login blocking — and every refusal is logged.</p>
${K.svg("0 0 760 336",
  [["SWITCH EDGE","lessons 6–7",["port security, sticky","DHCP snooping, trusted uplink","DAI + ARP ACL for static IPs","unused ports shut, DTP off"]],
   ["DATA PLANE","lessons 4–5",["ACLs at the edge","extended near the source","ends deny ip any any log","proof: counters, direction"]],
   ["MANAGEMENT PLANE","lessons 2–3",["SSH only, VTY access-class","AAA with local fallback","login block-for, banners","NTP, syslog, backups"]],
   ["CONTROL PLANE","Module 5, lesson 5",["passive-interface on LANs","permit ospf in WAN ACLs","only the neighbours you expect","proof: show ip ospf neighbor"]]].map(([t,s,ls],k)=>{ const x = 10+k*187; return `<rect x="${x}" y="12" width="179" height="114" rx="7" fill="var(--panel2)" stroke="${k===2?"var(--accent)":"var(--line)"}" stroke-width="1.4"/>`+K.txt(x+89.5,32,t,{mid:true,f:"display",s:12,c:"fg",b:true})+K.txt(x+89.5,46,s,{mid:true,s:9.5})+ls.map((l,j)=>K.txt(x+89.5,66+j*16,l,{mid:true,s:10,c:"fg",f:"body"})).join(""); }).join("")+
  K.dev("pc",50,236,"USER PC","")+K.dev("switch",200,236,"ACCESS SW","")+K.dev("router",430,236,"EDGE ROUTER","")+K.dev("cloud",650,236,"WAN","OSPF neighbours")+
  K.link(70,238,172,238)+K.link(228,238,404,238)+K.link(456,238,624,238)+
  K.arrow(99,128,180,220,"",false)+K.arrow(286,128,410,220,"",false)+K.arrow(476,128,440,220,"",true)+K.arrow(664,128,560,230,"",false)+
  K.txt(380,320,"Each plane has its own controls — and each control has a show command and a user-side test that prove it.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "Where the controls of lessons 1–7 sit on a small site. The management plane is highlighted because one admin login can undo every other control.")}
<h3>Configured is not the same as working</h3>
<p>Every control can be checked at three levels, and only the last two are proof:</p>
<ol>
<li><b>Intent</b> — <code>show running-config</code>: what someone typed, not whether it works (a list on the wrong interface, a port err-disabled).</li>
<li><b>State</b> — the operational show commands: <code>show ip interface</code> (which list, which direction), <code>show login</code>, <code>show port-security interface</code>, <code>show ip dhcp snooping</code>.</li>
<li><b>Behaviour</b> — a <b>positive test</b> (the IT desk's SSH gets a password prompt) and a <b>negative test</b> (a staff desk's SSH is refused), with a counter or log line as the record.</li>
</ol>
${K.svg("0 0 760 214",
  [["Configure","the change"],["Read it back","show run, show …"],["Positive test","allowed works"],["Negative test","refused fails"],["Evidence","counter, log line"],["Record","baseline, ticket"]].map(([a,b],k)=>K.txt(65+k*126,22,"step "+(k+1),{mid:true,s:9.5})+K.box(10+k*126,30,110,58,a,b,k===2||k===3)).join("")+
  [0,1,2,3,4].map(k=>K.arrow(120+k*126,59,134+k*126,59)).join("")+
  [["ip access-group … in","access-class 15 in"],["show ip int g0/0","sh run | sec vty"],["curl → the page","IT desk: Password:"],["ping → prohibited","user: refused"],["SEC-6 line, matches","LOGIN_SUCCESS"],["baseline item ✓","ticket note"]].map(([a,b],k)=>K.txt(65+k*126,108,a,{mid:true,s:9.5})+K.txt(65+k*126,122,b,{mid:true,s:9.5})).join("")+
  `<path d="M695,130 V160 H65 V94" fill="none" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#karr)"/>`+
  K.txt(380,176,"repeat after every change, and on a schedule — configs drift",{mid:true,s:10.5})+
  K.txt(380,202,"Steps 1–2 show intent. Only steps 3–5 prove the control works; step 6 keeps it that way.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "The verification loop, with two worked examples underneath: an edge ACL (top line) and a VTY access-class (bottom line).")}
${K.analogy(`<p>A bank branch's night check. Reading the rota that says &ldquo;doors locked at 18:00&rdquo; is step 2. Pushing every door, opening the staff door with a badge and checking the alarm panel logged both is steps 3–5 — the only check that catches a door propped open with a chair.</p>`)}
${K.check({q:"An engineer says 'Telnet is off on SW3 — I can see transport input ssh in the running-config.' What would turn that from intent into proof?", o:["Saving the configuration with write memory","Running show running-config a second time","A Telnet attempt from a PC that fails, plus an SSH login from an IT desk that works","Reloading the switch"], a:2, why:"The running-config is intent. A negative test (Telnet from a PC is refused) and a positive test (SSH from the IT desk works) prove the control behaves as intended. Saving and reloading change nothing about whether it works."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Port Harcourt hospital's checklist mixes four controls. Match each with the plane it protects.", pairs:[["passive-interface g0/0 on the router's ward LAN","Control plane"],["exec-timeout 10 0 on the VTY lines","Management plane"],["An ACL stopping the guest Wi-Fi reaching the patient-records server","Data plane"],["ip arp inspection vlan 40 on the ward switch","Switch edge"]], why:"1. What is asked? Which plane each control belongs to. 2. Which rule? Ask what the control protects: logins (management), routing (control), users' traffic (data) or the access port (switch edge). 3. Apply it: passive-interface stops OSPF hellos on a user LAN — control. exec-timeout ends idle admin sessions — management. The guest ACL filters users' packets — data. DAI checks ARP at access ports — switch edge."})}

<h2>The management plane: who may log in, from where, how — and the proof</h2>
${K.remember(`<p><b>Five questions for every device's management plane</b> — answer each with a setting and a proof: <b>Who</b> may log in (AAA, local users, strong secrets)? From <b>where</b> (the VTY access-class)? <b>How</b> (SSH version 2 only)? For how <b>long</b>, and how many <b>tries</b> (exec-timeout, login block-for)? What is <b>recorded</b> (banner, login logging, NTP, syslog, backups)? Memory hook: <b>&ldquo;Who, Where, How, How long, What's recorded.&rdquo;</b></p>`)}
<p>The management plane comes first because whoever logs in with privilege can remove every other control. Each row was taught in lessons 2–3 or Modules 2 and 7; the new part is the right-hand column.</p>
<div class="tablewrap"><table>
<tr><th>Item</th><th>Configure</th><th>Prove it</th></tr>
<tr><td><b>SSH v2 only</b></td><td><code>ip domain name kd.example.com</code>, <code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>; <code>transport input ssh</code> on <code>line vty 0 4</code> (<code>0 15</code> on a switch)</td><td><code>show ip ssh</code>: <code>SSH Enabled - version 2.0</code>; <code>telnet</code> from a PC: <code>Connect failed</code></td></tr>
<tr><td><b>Only from IT desks</b></td><td><code>access-list 15 permit 10.30.99.0 0.0.0.255</code>; <code>access-class 15 in</code> on the VTY lines (lesson 4)</td><td>IT desk: password prompt; anyone else: <code>Connection refused</code></td></tr>
<tr><td><b>Strong secrets</b></td><td><code>security passwords min-length 10</code>, <code>enable algorithm-type scrypt secret …</code>, <code>username netops algorithm-type scrypt secret …</code>, <code>service password-encryption</code>; remove the old ones with <code>no enable password</code>, <code>no username admin</code>, <code>no password</code> on lines using <code>login local</code> (lesson 2)</td><td><code>show running-config | include secret|username|password</code>: the enable and user lines all read <code>secret 9 $9$…</code>; no <code>enable password</code> or <code>username … password</code></td></tr>
<tr><td><b>AAA, local fallback</b></td><td><code>aaa new-model</code>, <code>aaa authentication login default group tacacs+ local</code> (lesson 3)</td><td><code>show running-config | section aaa</code>; a login with the server unreachable still works</td></tr>
<tr><td><b>Limited tries</b></td><td><code>login block-for 120 attempts 3 within 60</code>, <code>login quiet-mode access-class 15</code>, <code>login on-failure log</code>, <code>login on-success log</code></td><td><code>show login</code>; three wrong passwords in a test log <code>QUIET_MODE_ON</code>, and IT still gets in</td></tr>
<tr><td><b>Idle timeout</b></td><td><code>exec-timeout 10 0</code> on <code>line con 0</code> and the VTY lines</td><td><code>show running-config | section line</code> has no <code>exec-timeout 0 0</code> (10 0 is the default, so IOS hides it)</td></tr>
<tr><td><b>Warning banner</b></td><td><code>banner login #Authorised users only. All activity is logged.#</code>; <code>no banner motd</code> for a &ldquo;welcome&rdquo;</td><td>Shown before <code>Username:</code>; never says &ldquo;welcome&rdquo;</td></tr>
<tr><td><b>Time, logs, backups</b></td><td><code>ntp server</code>, <code>logging host</code>, <code>logging trap notifications</code> (<code>informational</code> if ACL log lines, severity 6, must reach it), <code>copy running-config tftp:</code> after each change (Module 7)</td><td><code>show clock</code> without <code>*</code>; a <code>%SYS-5-CONFIG_I</code> reaches the server; the backup file exists</td></tr>
<tr><td><b>Unused services off</b></td><td><code>no ip http server</code>, <code>no ip http secure-server</code> (the lab doesn't model the router's web server); SNMP read-only with an ACL</td><td><code>show running-config | include http|snmp</code> shows nothing unexplained</td></tr>
</table></div>
<p>Three of those proofs on a router that passes (replayed in the lab — real IOS XE's <code>show ip ssh</code> adds algorithm and key lines; LAG-R2 uses AAA with local fallback):</p>
${K.out(`LAG-R2#show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3
LAG-R2#show running-config | section line
line con 0
 logging synchronous
line vty 0 4
 access-class IT-DESKS in
 transport input ssh
LAG-R2#show login
     A default login delay of 1 seconds is applied.
     Quiet-Mode access list IT-DESKS is applied.
     All successful login is logged and generate SNMP traps.
     All failed login is logged and generate SNMP traps.

     Router enabled to watch for login Attacks.
     If more than 3 login failures occur in 60 seconds or less,
     logins will be disabled for 120 seconds.

     Router presently in Normal-Mode.
     Current Watch Window remaining time 60 seconds.
     Present login failure count 0.`, "Read what is missing too: no login local (with aaa new-model the method list decides, so IOS hides it), no exec-timeout (the 10-minute default), no password lines.")}
${K.mistake(`Checking only <code>line vty 0 4</code> on a switch. A Catalyst has sixteen VTY lines, shown as <code>line vty 0 4</code> <i>and</i> <code>line vty 5 15</code>; a session can land on any free line — at the latest the sixth — and lines 5–15 may still accept Telnet. Configure <code>line vty 0 15</code> and read both blocks.`)}
${K.tip(`Changing VTY access over SSH? Type <code>reload in 10</code> first. If the new access-class locks you out, the device reloads to its saved configuration in ten minutes; once a second session proves you can still log in, <code>reload cancel</code> and save. Better still, have a console path ready.`)}
<h3>Try it: bring a 2019 template up to the baseline</h3>
<p>KD-R1 in Kaduna was built from an old template and is audited on Friday. Read first, fix every finding against the table, then prove it. The IT subnet is 10.30.99.0/24.</p>
${K.hint(`Look for at least seven findings. Set <code>security passwords min-length 10</code> <i>before</i> the new secrets, so they are checked against it.`)}
${K.term({env:"ios2", title:"KD-R1 — a 2019 template meets the baseline", opts:{kind:"router", host:"KD-R1", model:"ISR4331", motd:"KD-R1 — console session. Built from the 2019 branch template; the audit is on Friday. You are at user EXEC; the old enable password is Kaduna2019."},
  setup:e=>{ ["enable","configure terminal","hostname KD-R1","no ip domain-lookup","enable password Kaduna2019","username admin password cisco123",
    "interface g0/0","description KADUNA LAN","ip address 10.30.10.1 255.255.255.0","no shutdown","interface g0/1","description WAN to HQ","ip address 10.30.255.2 255.255.255.252","no shutdown","exit",
    "banner motd #Welcome to the Kaduna network#","line con 0","exec-timeout 0 0","exit","line vty 0 4","password cisco","login","transport input telnet","exec-timeout 0 0","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code> (password <code>Kaduna2019</code> — for now). The router is alone here; the benches later test logins end to end.",
  tasks:[
    {text:"Read before you change: <code>show running-config | include enable|username|banner</code> and <code>show running-config | section line</code>. List every line that breaks the baseline", done:e=>e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*i\S*\s+/i.test(h)) && e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*sec\S*\s+line/i.test(h))},
    {text:"Secrets: <code>security passwords min-length 10</code> first, then <code>no enable password</code>, <code>enable algorithm-type scrypt secret K4duna-Enable26</code> and <code>service password-encryption</code>", done:e=>e.secMinLen>=10 && !e.enablePassword && !!e.enableSecret && e.enableAlg==="9" && !!e.servicePwEnc},
    {text:"Users: add <code>username netops algorithm-type scrypt secret Kd-N3tops-2026</code>, then remove the clear-text user with <code>no username admin</code>", done:e=>!e.users.admin && !!e.users.netops && !!e.users.netops.secret && e.users.netops.alg==="9"},
    {text:"SSH needs a name and keys: <code>ip domain name kd.example.com</code>, <code>crypto key generate rsa modulus 2048</code>, <code>ip ssh version 2</code>", done:e=>e.rsa>=2048 && String(e.sshVer)==="2" && !!e.domain},
    {text:"The lines: <code>access-list 15 permit 10.30.99.0 0.0.0.255</code>; under <code>line vty 0 4</code>: <code>no password</code>, <code>login local</code>, <code>transport input ssh</code>, <code>exec-timeout 10 0</code>, <code>access-class 15 in</code>; and <code>exec-timeout 10 0</code> under <code>line con 0</code>", done:e=>{ const v=e.lines.vty, A=window.ACL; return v.transport==="ssh" && !!v.loginLocal && !v.password && v.timeout!=="0 0" && !!v.acl && A.check(e.acl,v.acl,{src:"10.30.99.20"},false).permit && !A.check(e.acl,v.acl,{src:"10.30.10.50"},false).permit && e.lines.con.timeout!=="0 0"; }},
    {text:"Tries and the warning: <code>login block-for 120 attempts 3 within 60</code>, <code>login quiet-mode access-class 15</code>, <code>login on-failure log</code>, <code>login on-success log</code>, <code>no banner motd</code> and <code>banner login #Authorised users only. All activity is logged.#</code>", done:e=>!!e.loginBlock && !!e.loginQuietAcl && !!e.loginLogFail && !!e.loginLogOk && !!e.bannerLogin && !(e.banner && /welcome/i.test(e.banner))},
    {text:"Prove it and save: <code>show login</code>, <code>show ip ssh</code>, <code>show running-config | section line</code>, then <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.history.some(h=>/sh\S*\s+login/i.test(h)) && e.history.some(h=>/sh\S*\s+ip\s+ssh/i.test(h))},
  ],
  win:"Eight findings closed: a type 0 enable password replaced by a scrypt secret, a clear-text user replaced, a shared line password removed, Telnet off and SSH version 2 on, the VTY lines limited to the IT subnet, idle sessions ending after ten minutes, login attacks blocked with the IT subnet exempt, and a warning instead of a welcome. show login and show ip ssh are your evidence — paste them into the audit ticket.",
  solve:["enable","Kaduna2019","show running-config | include enable|username|banner","show running-config | section line","configure terminal",
    "security passwords min-length 10","no enable password","enable algorithm-type scrypt secret K4duna-Enable26","service password-encryption",
    "username netops algorithm-type scrypt secret Kd-N3tops-2026","no username admin",
    "ip domain name kd.example.com","crypto key generate rsa modulus 2048","ip ssh version 2",
    "access-list 15 permit 10.30.99.0 0.0.0.255","line vty 0 4","no password","login local","transport input ssh","exec-timeout 10 0","access-class 15 in","exit","line con 0","exec-timeout 10 0","exit",
    "login block-for 120 attempts 3 within 60","login quiet-mode access-class 15","login on-failure log","login on-success log","no banner motd","banner login #Authorised users only. All activity is logged.#","end",
    "show login","show ip ssh","show running-config | section line","copy running-config startup-config",""]})}
${K.job("“The NOC keeps getting locked out of KN-R1”",`
<h3>Ticket 7714 · 07:50 · &ldquo;Since yesterday our SSH sessions to KN-R1 are refused for a couple of minutes at a time, several times an hour. The password is right.&rdquo;</h3>
<p><b>Symptom and questions.</b> Refused, not timed out: the router is reachable and saying no. &ldquo;Everyone, or just you?&rdquo; — <i>everyone</i>. &ldquo;What changed?&rdquo; — <i>the quarterly password rotation</i>. A refusal that comes and goes after a password change points at login blocking (lesson 2).</p>
<p><b>Checks.</b> From the console (SSH is what's broken):</p>
${K.out(`KN-R1#show login
     A default login delay of 1 seconds is applied.
     No Quiet-Mode access list has been configured.
     All successful login is logged and generate SNMP traps.
     All failed login is logged and generate SNMP traps.

     Router enabled to watch for login Attacks.
     If more than 3 login failures occur in 60 seconds or less,
     logins will be disabled for 120 seconds.

     Router presently in Quiet-Mode.
     Will remain in Quiet-Mode for 120 seconds.
     Denying logins from all sources.
KN-R1#show logging | include SEC_LOGIN
*Oct 12 08:30:35.685: %SEC_LOGIN-4-LOGIN_FAILED: Login failed [user: noc] [Source: 10.50.50.30] [localport: 22] [Reason: Login Authentication Failed] at 08:30:35 UTC Mon Oct 12 2026
...
*Oct 12 08:30:56.096: %SEC_LOGIN-1-QUIET_MODE_ON: Still timeleft for watching failures is 60 secs, [user: noc] [Source: 10.50.50.30] [localport: 22] [Reason: Login Authentication Failed] [ACL: sl_def_acl] at 08:30:56 UTC Mon Oct 12 2026`, "Replayed in the lab (two identical failures trimmed). Every failure comes from 10.50.50.30, not a NOC desk. sl_def_acl is IOS's built-in quiet-mode list when you haven't named one: it blocks every source.")}
<p><b>Diagnosis.</b> 10.50.50.30 is the monitoring server; its scripted SSH check still uses last quarter's password, so each run fails three times and trips quiet mode — which, with no quiet-mode access-class, refuses <i>everyone</i>. The protection worked as configured; the configuration lacked its exception.</p>
<p><b>Fix.</b> The cause: the monitoring team updates the credential (better, moves the check to SNMP read-only). The gap: <code>ip access-list standard NOC-HOSTS</code>, <code>permit host 10.50.50.10</code>, <code>login quiet-mode access-class NOC-HOSTS</code>. Proof: in the next quiet period <code>show login</code> says <code>Restricted logins filtered by applied ACL NOC-HOSTS.</code> and a NOC desk still gets <code>(noc@10.50.50.1) Password:</code>.</p>
<p><b>What you say.</b> &ldquo;The router blocks logins for two minutes after three failures; the failures were our monitoring server using the old password. That's being fixed, and the NOC desks are now exempt, so a broken script can't lock us out again.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;KN-R1 quiet mode tripped by MON-SRV 10.50.50.30 (stale credential after rotation); no quiet-mode ACL, so all sources denied. Added NOC-HOSTS as the quiet-mode access-class, verified; MON team updating the credential. Baseline M5: quiet-mode access-class now mandatory.&rdquo;</i></p>`)}
${K.check({q:"show running-config | section line on a router shows line vty 0 4 with transport input ssh and access-class 15 in, and no exec-timeout line at all. What is the idle timeout on the VTY lines?", o:["None — sessions never time out","10 minutes — the default, which IOS doesn't show","5 minutes","It can't be known without show line"], a:1, why:"exec-timeout 10 0 is the default, so the running-config hides it. A session that never times out would show exec-timeout 0 0 — that is the line to look for."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Jos branch router logs %SEC_LOGIN-1-QUIET_MODE_ON whenever a misconfigured backup script fails three logins, and show login then says 'Denying logins from all sources.' A standard ACL named NOC already permits the NOC's hosts. Type the one global configuration command that keeps the NOC able to log in during quiet mode.", fields:[{label:"Command", a:["login quiet-mode access-class NOC"], ios:true}], why:"1. What is asked? Keeping some hosts able to log in during login blocking. 2. Which rule? Quiet mode refuses every source the quiet-mode access-class doesn't permit; with none, IOS uses sl_def_acl and denies all. 3. Apply it: login quiet-mode access-class NOC — and fix the script's password, because the exception is not the cure."})}

<h2>Data plane, control plane and the switch edge: checklist and proof</h2>
${K.remember(`<p><b>The proof rule for filters:</b> take <b>three readings around two tests</b> — where the filter is applied and in which direction, what it matched (counters), and what it refused (a log line) — with one test that should pass and one that should fail.</p>`)}
<h3>The data plane: ACLs at the edge</h3>
<p>Lessons 4–5 taught the design. Two habits make an ACL <i>provable</i>: end it with an explicit <code>deny ip any any log</code> (it drops nothing the invisible deny wouldn't, but gives drops a counter and a log line), and check the direction with <code>show ip interface</code>, which spells out &ldquo;Inbound&rdquo; and &ldquo;Outgoing&rdquo;.</p>
<p>A worked example. Enugu's guest LAN (10.60.20.0/24, EN-R1 Gi0/0) may get DHCP, use the portal on WEB (10.60.50.20, port 80) and reach the internet — nothing else in 10.60.0.0/16. GUEST-IN is applied inbound on Gi0/0. One positive test (the portal), two negative ones (a ping and a web request to the file server 10.60.50.30), then the readings:</p>
${K.out(`EN-R1#show ip interface g0/0 | include access list
  Outgoing Common access list is not set
  Outgoing access list is not set
  Inbound Common access list is not set
  Inbound  access list is GUEST-IN

C:\\Users\\guest>curl http://10.60.50.20
<!DOCTYPE html>
<html><head><title>Enugu visitor portal</title></head>
...
C:\\Users\\guest>ping 10.60.50.30
Reply from 10.60.20.1: Destination protocol unreachable.
...
C:\\Users\\guest>curl http://10.60.50.30
curl: (28) Failed to connect to 10.60.50.30:80 after 21045 ms: Could not connect to server

EN-R1#show access-lists GUEST-IN
Extended IP access list GUEST-IN
    10 permit udp any any eq bootps (2 matches)
    20 permit tcp 10.60.20.0 0.0.0.255 host 10.60.50.20 eq www (1 match)
    30 deny ip 10.60.20.0 0.0.0.255 10.60.0.0 0.0.255.255 log (5 matches)
    40 permit ip 10.60.20.0 0.0.0.255 any
EN-R1#show logging | include SEC-6
*Oct 12 08:32:41.151: %SEC-6-IPACCESSLOGDP: list GUEST-IN denied icmp 10.60.20.21 -> 10.60.50.30 (8/0), 1 packet
*Oct 12 08:32:48.288: %SEC-6-IPACCESSLOGP: list GUEST-IN denied tcp 10.60.20.21(51000) -> 10.60.50.30(80), 1 packet`, "Replayed in the lab (trimmed). Line 10 counted the guest's DHCP Discover and Request, line 20 the portal visit, line 30 four echoes plus the web attempt (a Windows ping adds 4 matches here; on real kit the client's SYN retries add a few more). The log names the guest as the source — the list sees the guests' own packets.")}
<p>Always read the log line's <b>source</b>. An inbound list on a user LAN should log users as sources. If the source is a <i>server</i> answering from port 80 or 443, the list is seeing <b>replies</b>: it faces the wrong way, or sits on the wrong interface.</p>
<h3>The control plane: only the neighbours you expect</h3>
<ul>
<li><b><code>passive-interface</code> on every user and server LAN</b> (Module 5): the subnet is still advertised, but no hellos are sent there, so a device on a desk port can never become a neighbour and inject routes. Prove it with <code>show ip protocols</code> (it lists passive interfaces) and <code>show ip ospf neighbor</code> (only the expected neighbours).</li>
<li><b>An inbound ACL on a routing link must permit the routing protocol</b> (lesson 5): <code>permit ospf any any</code> above the final deny, or the hellos fall to the deny and every route through that link disappears.</li>
</ul>
<h3>The switch edge</h3>
<div class="tablewrap"><table>
<tr><th>Item (lesson)</th><th>Prove it</th><th>&ldquo;On but broken&rdquo; looks like</th></tr>
<tr><td><b>Port security</b> (6)</td><td><code>show port-security</code>: every secured port, counts, action</td><td>A desk port <code>err-disabled</code>; <code>Secure-shutdown</code> with a <code>Last Source Address</code> that isn't the sticky one</td></tr>
<tr><td><b>Unused ports parked</b> (6)</td><td><code>show interfaces status</code>: <code>disabled</code>, VLAN 999</td><td>An empty port <code>notconnect</code> in a user VLAN — live the moment someone plugs in</td></tr>
<tr><td><b>No accidental trunks</b> (6)</td><td><code>show interfaces g0/2 switchport</code>: <code>Negotiation of Trunking: Off</code></td><td><code>Administrative Mode: dynamic auto</code> on a desk port</td></tr>
<tr><td><b>DHCP snooping</b> (7)</td><td><code>show ip dhcp snooping</code> lists the uplink, and only the uplink, as trusted; the binding table fills</td><td>No trusted interface, zero bindings, every PC on 169.254.x.x</td></tr>
<tr><td><b>DAI</b> (7)</td><td><code>show ip arp inspection</code>: VLAN Active, ACL Match named, Dropped not rising</td><td><code>%SW_DAI-4-DHCP_SNOOPING_DENY</code> naming a printer's static address</td></tr>
</table></div>
${K.when([
  ["<code>show running-config</code>","Auditing configured lines against the baseline","Shows intent exactly; it is what you back up","As your only proof"],
  ["Operational <code>show</code> commands","Checking a control is active now","Direction, counters, port status, bindings, quiet mode","Before any test — zero counters prove nothing"],
  ["A user-side test","Proving behaviour, allowed and refused","It is what users and auditors experience","On production without warning people"],
  ["Log lines on a syslog server","Evidence that outlives the session","Timestamped and central; the local buffer is lost on reload","Before NTP is synchronised — the times mislead"],
], "Which kind of evidence, when")}
${K.myth([
  ["If it's in the running-config, it's protecting the network.","The running-config is intent. A list can face the wrong way and a port can be err-disabled — only state and tests show what is happening."],
  ["Adding deny ip any any log changes what the ACL blocks.","It blocks exactly what the invisible deny blocked; it adds a counter and a log line — the evidence."],
  ["Hardening means turning every feature on.","It means closing what isn't needed and limiting what is. A feature without its exceptions (a quiet-mode access-class, an ARP ACL for printers) causes outages — and then gets switched off."],
  ["Once a site is hardened, it stays hardened.","Desk moves, emergency fixes and old templates undo controls quietly. That drift is why baselines are re-checked on a schedule."],
])}
${K.exam(`Reading verification questions: before the options, write down <b>1.</b> the device and the plane, <b>2.</b> for traffic, source, destination, protocol/port and the interface and direction it crosses, and <b>3.</b> whether the question asks what is <i>configured</i> or what is <i>happening</i>. Trap options offer the right command for the wrong question — <code>show access-lists</code> when it asks which direction a list is applied.`)}
${K.check({q:"A switch's show ip dhcp snooping shows snooping operational on VLAN 30, but no trusted interfaces, and the binding table has 0 bindings. PCs show 169.254 addresses. What is the most likely fault?", o:["Option 82 is enabled","The uplink to the DHCP server isn't trusted, so the server's Offers are dropped as server messages on an untrusted port","DAI is dropping the DHCP Discover","Port security is blocking the PCs"], a:1, why:"Snooping drops DHCP server messages arriving on untrusted ports. With no trusted interface, the real server's Offers are dropped: no leases, no bindings, APIPA everywhere. ip dhcp snooping trust on the uplink fixes it."})}
<h3>Same logic, new situation</h3>
<p>A Kano hotel's router has a list GUEST-WEB on its guest interface (guest LAN 10.9.20.0/24). Guests say no website loads, and the log is full of lines like this:</p>
${K.out(`%SEC-6-IPACCESSLOGP: list GUEST-WEB denied tcp 203.0.113.80(443) -> 10.9.20.33(51544), 1 packet`, "203.0.113.80 is a website on the internet.")}
${K.hint(`Which end is the source in this line, and from which port? A guest's request — or something coming back to a guest?`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Why guests can't browse through a list meant to allow it. <b>2. Which rule?</b> A list written about guest sources must see the guests' own packets — inbound on the guest interface. <b>3. Apply it.</b> The dropped packet comes <i>from</i> the website's port 443 <i>to</i> a guest's high port: a reply. So GUEST-WEB meets only replies — it is applied outbound on the guest interface — and its guest-source lines never match. Confirm with <code>show ip interface</code> (the Outgoing line names it), move it with <code>no ip access-group GUEST-WEB out</code> and <code>ip access-group GUEST-WEB in</code>, then prove it: a guest's <code>curl</code> works and the permit line counts.</p>`)}

<h2>Writing a security baseline a team can use</h2>
${K.remember(`<p><b>The baseline rule:</b> every line is a <b>testable promise</b> — a requirement, the configuration that meets it, and the command that proves it, with what &ldquo;good&rdquo; looks like. A line that can't be checked is an opinion, not a baseline.</p>`)}
<p>A ${K.g("security baseline","The minimum set of settings every device of one type must have — written down, versioned and checkable line by line. Anything that differs is either a recorded exception or a fault.")} lets a team build the fortieth branch the same way as the first, and lets an auditor check it. It sits between the <b>policy</b> (why and what, in business words: &ldquo;only IT staff may administer network devices&rdquo;) and the <b>procedure</b> (how to build a branch, step by step).</p>
<h3>What every line needs</h3>
${K.steps([
  ["An ID and a requirement in plain words","&ldquo;M2 — Remote management only from the IT desks.&rdquo; Tickets and audit findings can point at one line."],
  ["The reason","&ldquo;A stolen password is useless from a staff desk.&rdquo; People keep rules they understand."],
  ["The exact configuration","<code>access-class VTY-MGMT in</code> on <code>line vty 0 15</code>, with the list's contents."],
  ["The proof and what good looks like","&ldquo;A staff desk gets <code>Connection refused</code>; an IT desk gets <code>Password:</code>.&rdquo;"],
  ["Exceptions, with an owner","&ldquo;A branch with no IT desk adds the HQ jump host — approved by the network lead, recorded in the asset register.&rdquo; An unapproved exception is a fault."],
])}
<p>The first page of a branch baseline written that way — keep yours to one page per device type:</p>
${K.out(`TAMARIND NETWORK BASELINE TNB-01 v1.3 - branch router and access switch
Owner: network lead · Review: every 6 months and after incidents · Exceptions: change request

ID  Requirement (why)                          Proof (good looks like)
M1  SSH v2 only - no clear-text logins         show ip ssh "version 2.0"; telnet from a PC fails
M2  Logins only from IT desks 10.20.10.8/29    staff desk: Connection refused; IT desk: Password:
M3  Named users, scrypt secrets, length 10+    no "enable password"; only "secret 9" lines
M5  Block guessing; IT desks exempt            show login; test trips QUIET_MODE_ON, IT still in
M8  Trusted time, central logs                 show clock no "*"; CONFIG_I at the server
D1  Staff LAN ACL inbound, ends deny ... log   show ip interface "Inbound"; counters rise in tests
C1  OSPF passive on LANs; WAN ACLs permit it   show ip ospf neighbor = the expected list only
E1  Desk ports: access, nonegotiate, max 1     show port-security; a test device err-disables
E3  Snooping on; uplink only trusted           uplink "yes"; one binding per DHCP client
E4  DAI; ARP ACL for every static-IP device    no DHCP_SNOOPING_DENY for known devices
B1  Config backed up after every change        backup file on the server, dated today`, "Plain text fits in a ticket, a wiki or a README. The config for each ID sits on the next page; every row here ends in something you can run or watch.")}
<h3>Keeping it true</h3>
<p>Devices drift: an engineer fixes an outage at 02:00 with <code>no ip access-group</code> and forgets it; a replacement switch is built from an old template; a desk move leaves a stale sticky address. ${K.g("Configuration drift","The gap that grows between what the baseline says and what devices really run, through unrecorded changes, emergency fixes and old templates.")} is found the way it is prevented — by checking: against the baseline on a schedule (by hand at a small site, by comparing backups with a tool at scale — the automation module), and after every change, which needs a plan, its positive and negative tests, and a way back.</p>
${K.when([
  ["Enforce from day one","A new site with a known device list","Nothing legitimate is unknown","A live site whose static devices nobody has listed"],
  ["Observe first, then enforce","Adding DAI, port security or an ACL to a running site","<code>restrict</code> mode, ACL log lines and DAI counters show what <i>would</i> break","Observing with no enforce date"],
  ["A recorded exception","One device genuinely can't meet a line","The gap is known, owned, reviewed","As a way to skip work — give it an expiry"],
], "Rolling a baseline out: which approach, when")}
${K.dodont([
  "Write each line as requirement, reason, config and proof.",
  "Prove every change both ways before you close the ticket.",
  "Keep a console path (or <code>reload in 10</code>) whenever you change how you log in.",
  "Back up after every approved change, and test a restore once.",
],[
  "Paste an old template without reading every line against the baseline.",
  "Enable an enforcing feature without its exceptions.",
  "Leave an emergency workaround in place without a follow-up change.",
  "Put real passwords, keys or community strings in a baseline, ticket or portfolio.",
])}
${K.dyk(`You rarely start from a blank page. Published hardening guides — the Center for Internet Security (CIS) Benchmarks for Cisco IOS and Cisco's own IOS hardening guide — list hundreds of checks; a team picks those that fit, adds its addressing and exceptions, and that is its baseline. Audit tools can compare saved configs against such lists automatically.`)}
${K.case("Forty branches, one baseline, one bad Tuesday",`
<p><i>A composite of common rollouts, not one company's story.</i> A Lagos fintech rolled a baseline to forty branches in waves of five, each with a change, a test plan and a rollback. Wave 1's tests caught a backup script still using Telnet.</p>
<p><b>Wave 2's bad Tuesday:</b> an engineer applied the new VTY access-class to the Kano router over SSH from the HQ jump host — which the list didn't include. The session froze; the branch had no on-site IT. The plan's first line saved it: <code>reload in 15</code>. The router reloaded to its saved config, the engineer added the jump host, proved a login from a second session, then saved and cancelled the reload.</p>
<p><b>The switch edge</b> went on observe-first: port security in <code>restrict</code> mode for a week found 31 desks with a small unmanaged switch underneath and 4 moved printers, each fixed or approved before <code>shutdown</code> mode. DAI followed snooping by two days, once the binding counts matched, with ARP ACLs for every printer and camera. Six months later the re-check found three branches drifted — all emergency fixes nobody had undone.</p>`)}
${K.mistake(`Writing the baseline after the rollout, from whatever the first branch happened to have — its mistakes become the standard. Write it first, build one site from it, correct the baseline where the build disagreed, then roll out.`)}
${K.check({q:"Which baseline line can a colleague actually check?", o:["'Devices must be secure and follow best practice.'","'M2 — SSH only from the IT desks 10.20.10.8/29: access-class VTY-MGMT in on all VTY lines; proof: a staff desk gets Connection refused, an IT desk gets Password:.'","'Use strong passwords where possible.'","'Telnet should probably be disabled.'"], a:1, why:"A checkable line states the requirement, the config and a test with its expected result. The others are opinions: nobody can prove a device meets or fails them."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"An Abuja clinic's switch has never had DHCP snooping or DAI. Its eight printers and two cameras use hand-typed addresses. Put the safe change plan in order.", items:["List every static-IP device with its IP and MAC, and the uplink towards the DHCP server","Trust the uplink for DHCP snooping, then enable snooping on the VLAN (option 82 decided for the IOS server)","Wait until show ip dhcp snooping binding lists every DHCP client","Write the ARP ACL for the static devices and apply it with ip arp inspection filter (no static keyword)","Trust the uplink for DAI and enable ip arp inspection on the VLAN","Prove it: a PC and a printer both work, and show ip arp inspection shows no drops for known devices"], why:"1. What is asked? A safe order for enforcing features on a live site. 2. Which rule? Observe and prepare before you enforce: DAI depends on snooping's bindings and on an ARP ACL for devices that never use DHCP, and both features need the uplink trusted first. 3. Apply it: list, trust and snoop, let bindings fill, write the ARP ACL, trust and inspect, then prove both kinds of device work. DAI first would cut off every printer and camera."})}

${K.drill({title:"Module 8 mixed review — every security decision", types:["cia","pwtype","radtac","aclwild","aclmatchstd","aclmatchext","aclplace","psecviol","snoopdrop","daicheck"], count:10})}
<h2>The Module 8 challenge</h2>
<p>Tamarind Microfinance hardened its Lagos head office and Ibadan branch over the weekend; on Monday seven tickets arrive. Some are outages (a protection that broke something), some are holes (a protection that isn't there). The faults are independent — fix them in any order — and a ticket ticks only when its fault is fixed <i>and</i> its protection is still on.</p>
${K.svg("0 0 760 362",
  K.dev("server",90,60,"SRV1","portal · syslog")+K.dev("router",260,60,"HQ-R1","")+K.dev("router",560,60,"BR-R1","")+
  K.link(108,62,234,62,"10.20.60.0/24")+K.link(286,62,534,62,"WAN 10.20.255.0/30 · OSPF area 0")+
  K.txt(260,108,"AAA · STAFF-IN · VTY-MGMT",{mid:true,s:9.5})+K.txt(560,108,"DHCP · WAN-IN · VTY-MGMT",{mid:true,s:9.5})+
  K.dev("switch",260,190,"","")+K.dev("switch",560,190,"","")+
  K.txt(226,186,"HQ-SW1",{end:true,f:"display",c:"fg",b:true,s:11.5})+K.txt(226,200,"port security · .2",{end:true,s:9.5})+
  K.txt(594,186,"BR-SW1",{f:"display",c:"fg",b:true,s:11.5})+K.txt(594,200,"snooping · DAI",{s:9.5})+
  K.link(240,116,240,178)+K.link(580,116,580,178)+
  K.dev("pc",110,296,"ADMIN-PC",".10 · IT desk")+K.dev("pc",230,296,"STAFF-PC3",".30")+K.dev("pc",350,296,"STAFF-PC6",".36 · moved")+
  K.dev("pc",470,296,"IB-PC2","DHCP")+K.dev("pc",590,296,"IB-PC3","DHCP")+K.dev("printer",700,296,"PRN-IB1","10.20.30.5")+
  K.link(240,202,114,276)+K.link(256,202,232,276)+K.link(276,202,348,276)+
  K.link(546,202,474,276)+K.link(566,202,588,276)+K.link(584,202,696,276)+
  K.txt(225,160,"HQ staff LAN 10.20.10.0/24",{end:true,s:10})+K.txt(596,160,"VLAN 30 · 10.20.30.0/24",{s:9.5}),
  "The challenge network. HQ-R1 runs AAA (TACACS+ with local fallback) and filters the staff LAN; BR-R1 is the branch gateway and DHCP server and filters what arrives over the WAN; both routers send syslog to SRV1.")}
${K.tip(`Work like the job: <b>reproduce</b> from the user's device, <b>read the device's own evidence</b>, make the <b>smallest fix</b> that keeps the protection, <b>prove it both ways</b>. Give each ticket ten honest minutes before its Hint, and keep a scratch list — ticket, plane, fingerprint, fix, proof — for your portfolio.`)}
${K.bench({id:"m8-challenge", points:250, challenge:true, openLog:true, from:"CCNA · Module 8 · lesson 8", title:"Module 8 challenge — the Monday after the security weekend", viewBox:"0 0 1000 420",
  intro:"Seven tickets after the security weekend. <b>Access:</b> console cable on HQ-R1 (9600 8N1, no flow control) — move it as needed; SSH from ADMIN-PC. Logins: user <code>netadmin</code>, password <code>Adm1n-Lab26!</code> (BR-SW1 has no user and no management address — console only); enable secret <code>Tamarind-Lab26</code> everywhere. <b>Design:</b> HQ staff LAN 10.20.10.0/24 (HQ-R1 .1, HQ-SW1 .2, IT desks .8–.15, ADMIN-PC .10); servers 10.20.60.0/24 (SRV1 .20: portal and syslog); WAN 10.20.255.0/30 (HQ-R1 .1, BR-R1 .2), OSPF area 0; Ibadan VLAN 30, 10.20.30.0/24 (BR-R1 .1 gateway and DHCP; PRN-IB1 static 10.20.30.5). <b>Policy:</b> SSH only, from the IT desks only; staff may use the portal and ping; port security, snooping and DAI stay on. <b>Lab notes:</b> HQ-R1's TACACS+ server doesn't exist here, so logins fall back to the local user (real routers fall back only when the server doesn't answer); a DHCP PC asks again when its network changes, or run <code>ipconfig /renew</code>.",
  devices:[
    {id:"srv", kind:"server", label:"SRV1", x:20, y:10, ip:"10.20.60.20", mask:"255.255.255.0", gw:"10.20.60.1", mac:"0050.56aa.6020", services:{ web:{ title:"Tamarind staff portal" }, syslog:true }},
    {id:"hq", kind:"router", label:"HQ-R1", x:180, y:20, config:e=>{ ["en","conf t","hostname HQ-R1","enable algorithm-type scrypt secret Tamarind-Lab26","service password-encryption","no ip domain-lookup","ip domain name tamarind.example.com",
      "username netadmin algorithm-type scrypt secret Adm1n-Lab26!","security passwords min-length 10","login block-for 120 attempts 3 within 60","login on-failure log","login on-success log",
      "banner login #Tamarind Microfinance - authorised staff only. Activity is logged.#",
      "aaa new-model","tacacs server TAC1","address ipv4 10.20.60.40","key T4cacs-Lab-Key","exit","aaa authentication login default group tacacs+ local",
      "ip access-list extended STAFF-IN","remark staff LAN: SSH from the IT desks, the portal, ping - nothing else","permit tcp 10.20.10.8 0.0.0.7 any eq 22","permit tcp 10.20.10.0 0.0.0.255 host 10.20.60.20 eq www","permit icmp 10.20.10.0 0.0.0.255 any","deny ip any any log","exit",
      "ip access-list standard VTY-MGMT","remark who may open a VTY session","permit 10.20.50.0 0.0.0.255","exit",
      "int g0/0","description STAFF LAN HQ-SW1","ip address 10.20.10.1 255.255.255.0","ip access-group STAFF-IN out","no shut",
      "int g0/1","description WAN to BR-R1","ip address 10.20.255.1 255.255.255.252","no shut",
      "int g0/2","description SERVER LAN","ip address 10.20.60.1 255.255.255.0","no shut","exit",
      "router ospf 1","router-id 10.20.0.1","network 10.20.10.0 0.0.0.255 area 0","network 10.20.60.0 0.0.0.255 area 0","network 10.20.255.0 0.0.0.3 area 0","passive-interface g0/0","passive-interface g0/2","exit",
      "logging host 10.20.60.20","logging trap notifications",
      "line con 0","exec-timeout 10 0","logging synchronous","exit",
      "line vty 0 4","access-class VTY-MGMT in","exec-timeout 10 0","transport input ssh","end"].forEach(c=>e.exec(c)); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec("ip ssh version 2"); e.exec("end"); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:440, y:10},
    {id:"br", kind:"router", label:"BR-R1", x:640, y:20, config:e=>{ ["en","conf t","hostname BR-R1","enable algorithm-type scrypt secret Tamarind-Lab26","service password-encryption","no ip domain-lookup","ip domain name tamarind.example.com",
      "username netadmin algorithm-type scrypt secret Adm1n-Lab26!","security passwords min-length 10","login block-for 120 attempts 3 within 60","login on-failure log","login on-success log",
      "banner login #Tamarind Microfinance - authorised staff only. Activity is logged.#",
      "ip dhcp excluded-address 10.20.30.1 10.20.30.20","ip dhcp pool IBADAN","network 10.20.30.0 255.255.255.0","default-router 10.20.30.1","domain-name tamarind.example.com","exit",
      "ip access-list extended WAN-IN","remark from HQ: IT SSH, ping, portal replies - the rest logged and dropped","permit tcp 10.20.10.8 0.0.0.7 any eq 22","permit icmp any any","permit tcp host 10.20.60.20 eq www 10.20.30.0 0.0.0.255 established","deny ip any any log","exit",
      "ip access-list standard VTY-MGMT","remark who may open a VTY session","permit 10.20.10.8 0.0.0.7","exit",
      "int g0/0","description IBADAN LAN BR-SW1","ip address 10.20.30.1 255.255.255.0","no shut",
      "int g0/1","description WAN to HQ-R1","ip address 10.20.255.2 255.255.255.252","ip access-group WAN-IN in","no shut","exit",
      "router ospf 1","router-id 10.20.0.2","network 10.20.30.0 0.0.0.255 area 0","network 10.20.255.0 0.0.0.3 area 0","passive-interface g0/0","exit",
      "logging host 10.20.60.20","logging trap notifications",
      "line con 0","exec-timeout 10 0","logging synchronous","exit",
      "line vty 0 4","access-class VTY-MGMT in","login local","exec-timeout 10 0","transport input ssh","end"].forEach(c=>e.exec(c)); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec("ip ssh version 2"); e.exec("end"); e.history.length=0; }},
    {id:"hqsw", kind:"switch", label:"HQ-SW1", model:"Catalyst 9200 · HQ staff", x:20, y:170, config:e=>{ ["en","conf t","hostname HQ-SW1","enable algorithm-type scrypt secret Tamarind-Lab26","service password-encryption","no ip domain-lookup","ip domain name tamarind.example.com",
      "username netadmin algorithm-type scrypt secret Adm1n-Lab26!","login on-failure log","login on-success log","banner login #Tamarind Microfinance - authorised staff only. Activity is logged.#",
      "vlan 10","name STAFF","vlan 999","name PARKING","exit",
      "interface range g0/1 - 8","switchport mode access","switchport access vlan 10","switchport nonegotiate","exit",
      "interface g0/1","description UPLINK HQ-R1 G0/0","exit",
      "interface range g0/2 - 6","switchport port-security","switchport port-security mac-address sticky","exit",
      "interface g0/2","description DESK IT-1","interface g0/3","description DESK STAFF-3","interface g0/6","description DESK STAFF-6","switchport port-security mac-address sticky 0050.56aa.1f06","exit",
      "interface range g0/4 - 5","switchport access vlan 999","shutdown","exit",
      "interface range g0/7 - 10","switchport mode access","switchport access vlan 999","switchport nonegotiate","shutdown","exit",
      "interface vlan 10","ip address 10.20.10.2 255.255.255.0","no shut","exit","ip default-gateway 10.20.10.1",
      "line vty 0 15","login local","exec-timeout 10 0","transport input telnet ssh","end"].forEach(c=>e.exec(c)); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec("ip ssh version 2"); e.exec("end"); e.history.length=0; }},
    {id:"brsw", kind:"switch", label:"BR-SW1", model:"Catalyst 9200 · Ibadan", x:560, y:170, config:e=>{ ["en","conf t","hostname BR-SW1","enable algorithm-type scrypt secret Tamarind-Lab26","service password-encryption","no ip domain-lookup",
      "vlan 30","name IBADAN","vlan 999","name PARKING","exit",
      "interface range g0/1 - 8","switchport mode access","switchport access vlan 30","switchport nonegotiate","exit",
      "interface g0/1","description UPLINK BR-R1 G0/0","ip arp inspection trust","exit",
      "interface range g0/2 - 3","switchport port-security","switchport port-security mac-address sticky","exit",
      "interface g0/2","description DESK IB-2","interface g0/3","description DESK IB-3","interface g0/5","description PRINTER PRN-IB1","interface g0/4","switchport access vlan 999","shutdown","exit",
      "interface range g0/6 - 10","switchport mode access","switchport access vlan 999","switchport nonegotiate","shutdown","exit",
      "no ip dhcp snooping information option","ip dhcp snooping vlan 30","ip dhcp snooping","ip arp inspection vlan 30","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"admin", kind:"pc", label:"ADMIN-PC", x:20, y:300, ip:"10.20.10.10", mask:"255.255.255.0", gw:"10.20.10.1", mac:"0050.56aa.1010"},
    {id:"staff", kind:"pc", label:"STAFF-PC3", x:140, y:300, ip:"10.20.10.30", mask:"255.255.255.0", gw:"10.20.10.1", mac:"0050.56aa.1030"},
    {id:"desk6", kind:"pc", label:"STAFF-PC6", x:260, y:300, ip:"10.20.10.36", mask:"255.255.255.0", gw:"10.20.10.1", mac:"0050.56aa.1036"},
    {id:"bp1", kind:"pc", label:"IB-PC2", x:560, y:300, dhcp:true, mac:"0050.56aa.3002"},
    {id:"bp2", kind:"pc", label:"IB-PC3", x:680, y:300, dhcp:true, mac:"0050.56aa.3003"},
    {id:"prn", kind:"printer", label:"PRN-IB1", x:800, y:300, ip:"10.20.30.5", mask:"255.255.255.0", gw:"10.20.30.1", mac:"0017.c8b1.3005"},
  ],
  cables:[ {type:"cat6", a:"srv:eth", b:"hq:g2"}, {type:"cat6", a:"hq:g0", b:"hqsw:g1"}, {type:"cat6", a:"hq:g1", b:"br:g1"}, {type:"cat6", a:"br:g0", b:"brsw:g1"},
    {type:"cat6", a:"admin:eth", b:"hqsw:g2"}, {type:"cat6", a:"staff:eth", b:"hqsw:g3"}, {type:"cat6", a:"desk6:eth", b:"hqsw:g6"},
    {type:"cat6", a:"bp1:eth", b:"brsw:g2"}, {type:"cat6", a:"bp2:eth", b:"brsw:g3"}, {type:"cat6", a:"prn:eth", b:"brsw:g5"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>HQ staff (Ada, STAFF-PC3):</b> &ldquo;Since the weekend the staff portal on 10.20.60.20 never loads, and I can't even ping it.&rdquo; <i>Done when STAFF-PC3 opens the portal (<code>curl http://10.20.60.20</code>) and HQ-R1 still filters what the staff LAN sends, as the policy says.</i>", hint:"Reproduce it, then read HQ-R1's <code>show ip interface g0/0</code> and <code>show access-lists STAFF-IN</code>. Look at the log lines the list produces: whose address is the <i>source</i> of what it drops — the staff PC, or the portal answering it? Which direction should a list written about staff sources face?", done:B=>{ const e=B.devs.hq.env, i=e.intfs["GigabitEthernet0/0"], A=window.ACL; return Bench.fetched(B,"staff","10.20.60.20") && i.aclIn==="STAFF-IN" && !i.aclOut && !A.check(e.acl,"STAFF-IN",{src:"10.20.10.30",dst:"10.20.255.2",proto:"tcp",sport:50000,dport:22},false).permit && A.check(e.acl,"STAFF-IN",{src:"10.20.10.30",dst:"10.20.60.20",proto:"tcp",sport:50000,dport:80},false).permit; }},
    {text:"<b>Ibadan branch (Tunde):</b> &ldquo;Nothing at head office answers us — the portal, the HQ phones directory, nothing.&rdquo; <i>Done when BR-R1 has a FULL OSPF neighbour (HQ-R1, 10.20.0.1) and an OSPF route to 10.20.60.0/24 — with WAN-IN still applied inbound on its WAN interface and still refusing what the policy doesn't allow (SSH from a staff desk).</i>", hint:"You can't SSH to a router you have no route to — that is what the console is for. On BR-R1: <code>show ip ospf neighbor</code>, <code>show ip route ospf</code>, then <code>show access-lists WAN-IN</code>. OSPF is IP protocol 89, with hellos to 224.0.0.5 — which line would let them in? (A real router would also count the dropped hellos on the deny line and log them; the lab doesn't.)", done:B=>{ const e=B.devs.br.env; return Bench.ospfNbr(B,"br","10.20.0.1") && !!Bench.route(B,"br","10.20.60.0/24","O") && e.intfs["GigabitEthernet0/1"].aclIn==="WAN-IN" && !window.ACL.check(e.acl,"WAN-IN",{src:"10.20.10.30",dst:"10.20.30.1",proto:"tcp",sport:50000,dport:22},false).permit; }},
    {text:"<b>IT (you, ADMIN-PC):</b> &ldquo;HQ-R1 refuses my SSH — <code>Connection refused</code> — even though the password is right.&rdquo; <i>Done when ADMIN-PC has logged in to HQ-R1 over SSH and HQ-R1's VTY lines still refuse the staff desks (STAFF-PC3 may not open a session).</i>", hint:"&ldquo;Connection refused&rdquo; before any password prompt means the router said no before it asked who you are. Use the console: <code>show running-config | section line vty</code> and <code>show access-lists VTY-MGMT</code>. Which addresses does the list permit — and where do the IT desks live now? Compare with BR-R1's list of the same name.", done:B=>{ const e=B.devs.hq.env, v=e.lines.vty||{}, A=window.ACL; return !!v.acl && A.check(e.acl,v.acl,{src:"10.20.10.10"},false).permit && !A.check(e.acl,v.acl,{src:"10.20.10.30"},false).permit && Bench.logged(B,"hq",/%SEC_LOGIN-5-LOGIN_SUCCESS: Login Success \[user: netadmin\] \[Source: 10\.20\.10\.10\] \[localport: 22\]/); }},
    {text:"<b>Audit (Ngozi, external auditor):</b> &ldquo;From a staff desk I was offered a login prompt by HQ-SW1 (10.20.10.2) over Telnet — clear text on the staff LAN.&rdquo; <i>Done when HQ-SW1's VTY lines accept SSH only and ADMIN-PC has logged in to HQ-SW1 over SSH.</i>", hint:"Reproduce it from ADMIN-PC: <code>telnet 10.20.10.2</code>. Then look at the lines that decide which protocols a VTY accepts: <code>show running-config | section line vty</code> on HQ-SW1 (over SSH — it accepts SSH too).", done:B=>{ const t=String(((B.devs.hqsw.env.lines||{}).vty||{}).transport||""); return /ssh/.test(t) && !/telnet|all/.test(t) && Bench.logged(B,"hqsw",/%SEC_LOGIN-5-LOGIN_SUCCESS: .*\[Source: 10\.20\.10\.10\] \[localport: 22\]/); }},
    {text:"<b>HQ staff (Emeka, STAFF-PC6):</b> &ldquo;Facilities moved my PC to desk 6 on Friday. The network light came on, then went off, and nothing works.&rdquo; <i>Done when STAFF-PC6 pings its gateway 10.20.10.1, with port security still on Gi0/6 (maximum 1, shutdown mode) and Emeka's PC as the port's only secure address.</i>", hint:"Reproduce it (ping 10.20.10.1 from STAFF-PC6), then on HQ-SW1: <code>show interfaces status</code>, <code>show port-security interface g0/6</code>, <code>show port-security address</code> and <code>show logging | include PSECURE</code>. Whose MAC does the port think belongs at desk 6? Facilities confirm Emeka's PC is company kit.", done:B=>{ const i=B.devs.hqsw.env.intfs["GigabitEthernet0/6"], m=Bench.secureMacs(B,"hqsw","g6"); return Bench.pinged(B,"desk6","10.20.10.1") && !Bench.errdis(B,"hqsw","g6") && !!i.psec && (i.psecMax||1)===1 && (i.psecViol||"shutdown")==="shutdown" && m.length===1 && m[0].startsWith(B.devs.desk6.mac); }},
    {text:"<b>Ibadan branch (Tunde):</b> &ldquo;Our PCs show 169.254 addresses since Saturday.&rdquo; <i>Done when IB-PC2 and IB-PC3 both lease addresses in 10.20.30.0/24 from BR-R1, with DHCP snooping still enabled on VLAN 30 and both PCs in the binding table.</i>", hint:"Open the frame log and make IB-PC2 ask again (<code>ipconfig /renew</code>). Where does the Offer stop, and what does the switch say about the port it arrived on? On BR-SW1: <code>show ip dhcp snooping</code> — which interface is listed as trusted? Option 82 was already handled on Saturday.", done:B=>{ const e=B.devs.brsw.env; return /^10\.20\.30\./.test(Bench.leased(B,"bp1")||"") && /^10\.20\.30\./.test(Bench.leased(B,"bp2")||"") && e.snoop.on && e.snoop.vlans.includes(30) && Bench.snoopBound(B,"brsw",B.devs.bp1.mac) && Bench.snoopBound(B,"brsw",B.devs.bp2.mac); }},
    {text:"<b>HQ print team (Fatima):</b> &ldquo;Jobs for the Ibadan printer PRN-IB1 (10.20.30.5) leave our print server and vanish — BR-R1 can't even ping the printer.&rdquo; <i>Done when BR-R1 has PRN-IB1 in its ARP table (ping 10.20.30.5 from BR-R1), with Dynamic ARP Inspection still on for VLAN 30, the printer's and PCs' ports still inspected (not trusted), and the DHCP PCs still checked against their bindings.</i>", hint:"From BR-R1, <code>ping 10.20.30.5</code>, then <code>show ip arp</code>: is the printer there? On BR-SW1: <code>show logging | include DAI</code> — the first field in the brackets is the dropped sender's MAC. Does a hand-typed address ever get a snooping binding? What does DAI need instead?", done:B=>{ const e=B.devs.brsw.env; return e.dai.vlans.includes(30) && !!e.dai.filters[30] && (e.arpAcls[e.dai.filters[30]]||[]).some(x=>x.action==="permit" && x.ip==="10.20.30.5") && !(e.dai.statics||{})[30] && !["GigabitEthernet0/2","GigabitEthernet0/3","GigabitEthernet0/5"].some(n=>(e.intfs[n]||{}).daiTrust) && Bench.arpHas(B,"br","10.20.30.5"); }},
  ],
  win:"Seven holes and faults from one weekend, one method: reproduce, read the device's own evidence, fix the smallest thing, prove it from the user's side. A staff list facing the wrong way (its log showed the portal's replies being dropped); a WAN list with no permit ospf (nothing for protocol 89, and no neighbour); a VTY access-class still naming a retired admin subnet; Telnet left open on a switch; a sticky address that remembered the previous PC; a snooping uplink that was trusted for DAI but not for DHCP; and a static-IP printer DAI couldn't vouch for. Every protection is still on — and now each one does what the baseline says.",
  solve:[
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","netadmin"],["term","Adm1n-Lab26!"],["term","enable"],["term","Tamarind-Lab26"],
    ["term","show ip interface g0/0"],["term","show access-lists STAFF-IN"],["term","show access-lists VTY-MGMT"],
    ["term","configure terminal"],["term","interface g0/0"],["term","no ip access-group STAFF-IN out"],["term","ip access-group STAFF-IN in"],["term","exit"],
    ["term","ip access-list standard VTY-MGMT"],["term","no 10"],["term","permit 10.20.10.8 0.0.0.7"],["term","end"],["term","write memory"],
    ["pc","staff","curl http://10.20.60.20"],
    ["pc","admin","ssh -l netadmin 10.20.10.1"],["pc","admin","Adm1n-Lab26!"],["pc","admin","exit"],
    ["pc","admin","ssh -l netadmin 10.20.10.2"],["pc","admin","Adm1n-Lab26!"],["pc","admin","enable"],["pc","admin","Tamarind-Lab26"],
    ["pc","admin","configure terminal"],["pc","admin","line vty 0 15"],["pc","admin","transport input ssh"],["pc","admin","exit"],
    ["pc","admin","end"],["pc","admin","clear port-security sticky interface g0/6"],["pc","admin","configure terminal"],["pc","admin","interface g0/6"],["pc","admin","shutdown"],["pc","admin","no shutdown"],["pc","admin","end"],
    ["pc","desk6","ping 10.20.10.1"],["pc","admin","write memory"],["pc","admin","exit"],
    ["unplug","lap:usb"],["plug","console","lap:usb","br:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Tamarind-Lab26"],
    ["term","show access-lists WAN-IN"],["term","configure terminal"],["term","ip access-list extended WAN-IN"],["term","5 permit ospf any any"],["term","end"],["term","show ip ospf neighbor"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","brsw:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Tamarind-Lab26"],
    ["term","show ip dhcp snooping"],["term","configure terminal"],["term","interface g0/1"],["term","ip dhcp snooping trust"],["term","exit"],
    ["term","arp access-list IBADAN-STATIC"],["term","permit ip host 10.20.30.5 mac host 0017.c8b1.3005"],["term","exit"],["term","ip arp inspection filter IBADAN-STATIC vlan 30"],["term","end"],["term","write memory"],
    ["pc","bp1","ipconfig /renew"],["pc","bp2","ipconfig /renew"],
    ["pc","admin","ssh -l netadmin 10.20.255.2"],["pc","admin","Adm1n-Lab26!"],["pc","admin","ping 10.20.30.5"],["pc","admin","enable"],["pc","admin","Tamarind-Lab26"],["pc","admin","show ip arp"],["pc","admin","exit"]]})}
${K.hint(`Stuck on where to start? HQ-R1 needs the console until its VTY list is fixed, and BR-R1 can't be reached from HQ while OSPF is down — the console is your way in there too.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried: the fingerprint, the fix, the proof.</p>
${K.reveal("Ticket 1 — STAFF-IN faces the wrong way",`<p><b>Found:</b> STAFF-PC3's curl ends in <code>curl: (28)</code>; on HQ-R1, <code>show ip interface g0/0</code> says <code>Outgoing access list is STAFF-IN</code>, and the log shows what the list sees:</p>
${K.out(`*Oct 12 08:36:18.398: %SEC-6-IPACCESSLOGP: list STAFF-IN denied tcp 10.20.60.20(80) -> 10.20.10.30(51000), 1 packet
*Oct 12 08:36:25.535: %SEC-6-IPACCESSLOGDP: list STAFF-IN denied icmp 10.20.60.20 -> 10.20.10.30 (0/0), 1 packet`, "The portal's replies (source port 80; an echo reply, type 0) — a list about staff sources applied where only replies cross it.")}
<p><b>Data plane. Fix:</b> <code>interface g0/0</code>, <code>no ip access-group STAFF-IN out</code>, <code>ip access-group STAFF-IN in</code>. <b>Proof:</b> the portal loads and pings answer, lines 20 and 30 count, and staff still can't SSH to the routers (line 10 permits only 10.20.10.8 0.0.0.7).</p>`)}
${K.reveal("Ticket 2 — WAN-IN forgot OSPF",`<p><b>Found:</b> on BR-R1's console, <code>show ip ospf neighbor</code> is empty and <code>show ip route ospf</code> has no routes. <code>show access-lists WAN-IN</code> permits SSH, ICMP and portal replies, then <code>40 deny ip any any log</code> — nothing permits OSPF (IP protocol 89), so HQ-R1's hellos to 224.0.0.5 are dropped. A real router would also count them on line 40 and log a <code>%SEC-6-IPACCESSLOGNP … denied 89 10.20.255.1 -> 224.0.0.5</code> line; the lab doesn't count hellos, so here the evidence is the missing neighbour and the missing permit.</p>
<p><b>Control plane. Fix:</b> <code>ip access-list extended WAN-IN</code>, <code>5 permit ospf any any</code>. <b>Proof:</b> <code>10.20.0.1  1  FULL/BDR … GigabitEthernet0/1</code>, and <code>O 10.20.60.0/24 [110/2] via 10.20.255.1</code> is back. WAN-IN stays applied.</p>`)}
${K.reveal("Ticket 3 — the VTY list names a retired subnet",`<p><b>Found:</b> <code>Connection refused</code> before any password prompt — the router refused the <i>address</i>; the frame log names <code>access-class VTY-MGMT in</code>. On the console (log in as netadmin — the AAA default list covers it), <code>show access-lists VTY-MGMT</code>: <code>10 permit 10.20.50.0, wildcard bits 0.0.0.255</code>, the old management subnet; BR-R1's list permits <code>10.20.10.8 0.0.0.7</code>.</p>
<p><b>Management plane. Fix:</b> <code>ip access-list standard VTY-MGMT</code>, <code>no 10</code>, <code>permit 10.20.10.8 0.0.0.7</code>. <b>Proof:</b> ADMIN-PC logs in and HQ-R1 logs <code>%SEC_LOGIN-5-LOGIN_SUCCESS: Login Success [user: netadmin] [Source: 10.20.10.10] [localport: 22]</code>. Removing the access-class would also &ldquo;fix&rdquo; it — and open the router to every staff desk, which is why the ticket checks they are still refused.</p>`)}
${K.reveal("Ticket 4 — Telnet still open on HQ-SW1",`<p><b>Found:</b> <code>telnet 10.20.10.2</code> from ADMIN-PC answers <code>Trying 10.20.10.2 ... Open</code>, the banner and <code>Username:</code>. Over SSH, <code>show running-config | section line vty</code> shows <code>transport input telnet ssh</code> in both blocks.</p>
<p><b>Management plane. Fix:</b> <code>line vty 0 15</code>, <code>transport input ssh</code>. <b>Proof:</b> Telnet now gives <code>Could not open connection to the host, on port 23: Connect failed</code>; SSH still logs in. (Follow-up change: HQ-SW1's VTY lines have no access-class either — the policy's &ldquo;from the IT desks only&rdquo; needs one.)</p>`)}
${K.reveal("Ticket 5 — desk 6 remembers the previous PC",`<p><b>Found:</b> <code>show interfaces status</code>: <code>Gi0/6  DESK STAFF-6  err-disabled</code>; the log names <code>MAC address 0050.56aa.1036 on port GigabitEthernet0/6</code>; <code>show port-security address</code> holds the sticky <code>0050.56aa.1f06</code> — the PC that used to sit there.</p>
<p><b>Switch edge. Fix</b> (Emeka's PC is company kit): <code>clear port-security sticky interface g0/6</code> (privileged EXEC) forgets the stale address, then <code>interface g0/6</code>, <code>shutdown</code>, <code>no shutdown</code>; sticky learning is still on, so the PC's next frame is learned and written into the config. (The longer way: <code>no switchport port-security mac-address sticky</code> turns the sticky address into a dynamic one, the bounce clears it, then <code>switchport port-security mac-address sticky</code> turns learning back on.) <b>Proof:</b> <code>Secure-up</code>, <code>0050.56aa.1036  SecureSticky  Gi0/6</code>; maximum 1 and shutdown mode unchanged.</p>`)}
${K.reveal("Ticket 6 — trusted for DAI, not for DHCP",`<p><b>Found:</b> IB-PC2 has <code>Autoconfiguration IPv4 Address</code>; the frame log shows BR-R1's Offer dropped at BR-SW1 Gi0/1 as <i>a SERVER message and this port is untrusted</i>. <code>show ip dhcp snooping</code> lists no trusted interface (option 82 is already off); Gi0/1 has <code>ip arp inspection trust</code> but no <code>ip dhcp snooping trust</code>.</p>
<p><b>Switch edge. Fix:</b> <code>interface g0/1</code>, <code>ip dhcp snooping trust</code>. <b>Proof:</b> both PCs lease from <code>DHCP Server . . . : 10.20.30.1</code>, Gi0/1 shows <code>yes</code>, and the binding table has two entries on the PCs' own ports.</p>`)}
${K.reveal("Ticket 7 — a printer DAI can't vouch for",`<p><b>Found:</b> BR-R1's <code>ping 10.20.30.5</code> gives <code>.....</code> and no ARP entry; BR-SW1 logs <code>%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi0/5, vlan 30.([0017.c8b1.3005/10.20.30.5/…])</code>. A hand-typed address never gets a binding.</p>
<p><b>Switch edge. Fix:</b> <code>arp access-list IBADAN-STATIC</code>, <code>permit ip host 10.20.30.5 mac host 0017.c8b1.3005</code>, <code>exit</code>, <code>ip arp inspection filter IBADAN-STATIC vlan 30</code> (no <code>static</code>, so the PCs keep passing on bindings). <b>Proof:</b> <code>.!!!!</code>, the printer in <code>show ip arp</code>, and <code>ACL Match IBADAN-STATIC</code> in <code>show ip arp inspection</code>.</p>
<p><b>Finally</b> <code>write memory</code> everywhere you changed, a ticket note per complaint, and two baseline updates: &ldquo;E3 — trust the uplink for snooping <i>and</i> DAI&rdquo;, &ldquo;E1 — clear sticky addresses in every desk move&rdquo;.</p>`)}

<h2>Portfolio project: secure your three-site network — and prove it</h2>
<p>&ldquo;How have you secured a network?&rdquo; comes up in almost every network interview. A repository with a policy table, configs, a baseline and <i>evidence</i> — refused attempts, counters, log lines on a syslog server — answers it better than a certificate line. Build on your Module 5–7 three-site network in the Ladder Lab builder, Packet Tracer, GNS3 or CML.</p>
<h3>The brief</h3>
<div class="tablewrap"><table>
<tr><th>Deliverable</th><th>What it contains</th><th>Lessons</th></tr>
<tr><td><b>ACL policy table + configs</b></td><td>One row per rule: source, destination and port, action, where applied (interface, direction), why</td><td>4, 5</td></tr>
<tr><td><b>Management-plane hardening</b></td><td>Every row of the management-plane table above</td><td>2, 3, M7</td></tr>
<tr><td><b>Switch-edge security</b></td><td>Port security, parked ports, DTP off, native VLAN, snooping and DAI with an ARP ACL</td><td>6, 7</td></tr>
<tr><td><b>A one-page baseline</b></td><td>Requirement, reason, config, proof — like TNB-01 above, for your devices</td><td>8</td></tr>
<tr><td><b>Evidence</b></td><td>Unedited outputs of every proof, both ways, and the syslog server's list</td><td>8</td></tr>
<tr><td><b>Break/fix log</b></td><td>Three faults introduced on purpose: symptom, plane, fingerprint, fix, proof</td><td>4–8</td></tr>
</table></div>
<h3>Rehearse the evidence first</h3>
<p>The challenge fixed a broken site; this bench rehearses the sign-off on a correct one and produces your first evidence.</p>
${K.bench({id:"m8-evidence", points:140, openLog:true, from:"CCNA · Module 8 · lesson 8", title:"portfolio rehearsal — prove every control works, and collect the evidence in one place", viewBox:"0 0 760 400",
  intro:"The sign-off on Abuja's new branch: prove each control both ways, with a log line on the central server. <b>Design:</b> LAN 10.40.10.0/24 on AB-R1 Gi0/0 (AB-SW1 .2; IT-PC .10 is the only IT desk; USER-PC .40); LOG-SRV 10.40.50.10 on Gi0/1 — syslog server and NTP source (stratum 2). Console on AB-R1; user <code>netops</code> / <code>Ab-N3tops-2026</code>, enable secret <code>Abuja-Lab26</code>. LOG-SRV's Server services panel lists what it receives. <b>Lab notes:</b> NTP syncs instantly (real: minutes); quiet mode stays on once triggered, because the lab clock only moves when a task moves it.",
  devices:[
    {id:"log", kind:"server", label:"LOG-SRV", x:20, y:10, ip:"10.40.50.10", mask:"255.255.255.0", gw:"10.40.50.1", services:{ syslog:true, ntp:{stratum:2, ref:"192.0.2.123"} }},
    {id:"r1", kind:"router", label:"AB-R1", x:200, y:20, config:e=>{ ["en","conf t","hostname AB-R1","enable algorithm-type scrypt secret Abuja-Lab26","service password-encryption","no ip domain-lookup","ip domain name abuja.example.net",
      "username netops algorithm-type scrypt secret Ab-N3tops-2026","security passwords min-length 10",
      "ip access-list standard IT-DESKS","permit host 10.40.10.10","exit",
      "login block-for 120 attempts 3 within 60","login quiet-mode access-class IT-DESKS","login on-failure log","login on-success log","banner login #Authorised staff only. Activity is logged.#",
      "ip access-list extended LAN-IN","permit tcp host 10.40.10.10 any eq 22","permit icmp host 10.40.10.10 any","permit udp 10.40.10.0 0.0.0.255 host 10.40.50.10 eq syslog","permit udp 10.40.10.0 0.0.0.255 host 10.40.50.10 eq ntp","deny icmp 10.40.10.0 0.0.0.255 10.40.50.0 0.0.0.255 log","deny ip any any log","exit",
      "int g0/0","description BRANCH LAN AB-SW1","ip address 10.40.10.1 255.255.255.0","ip access-group LAN-IN in","no shut",
      "int g0/1","description SERVER LAN","ip address 10.40.50.1 255.255.255.0","no shut","exit",
      "clock timezone WAT 1","logging host 10.40.50.10","logging trap notifications",
      "line con 0","logging synchronous","exit","line vty 0 4","access-class IT-DESKS in","login local","transport input ssh","end"].forEach(c=>e.exec(c)); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec("ip ssh version 2"); e.exec("end"); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:460, y:10},
    {id:"vis", kind:"laptop", label:"VISITOR LAPTOP", x:620, y:10, ip:"10.40.10.77", mask:"255.255.255.0", gw:"10.40.10.1", mac:"0050.56bb.7777"},
    {id:"sw", kind:"switch", label:"AB-SW1", model:"Catalyst 9200 · Abuja", x:200, y:160, config:e=>{ ["en","conf t","hostname AB-SW1","enable algorithm-type scrypt secret Abuja-Lab26","service password-encryption","no ip domain-lookup","ip domain name abuja.example.net",
      "username netops algorithm-type scrypt secret Ab-N3tops-2026","login on-failure log","login on-success log","banner login #Authorised staff only. Activity is logged.#",
      "vlan 10","name BRANCH","vlan 999","name PARKING","exit",
      "interface range g0/1 - 8","switchport mode access","switchport access vlan 10","switchport nonegotiate","exit","interface g0/1","description UPLINK AB-R1 G0/0","exit",
      "interface range g0/2 - 4","switchport port-security","switchport port-security mac-address sticky","exit",
      "interface g0/2","description DESK IT-1","interface g0/3","description DESK USER-1","interface g0/4","description DESK USER-2 (Halima, on leave)","switchport port-security mac-address sticky 0050.56bb.1042","exit",
      "interface range g0/5 - 10","switchport access vlan 999","shutdown","exit",
      "interface vlan 10","ip address 10.40.10.2 255.255.255.0","no shut","exit","ip default-gateway 10.40.10.1",
      "clock timezone WAT 1","logging host 10.40.50.10","logging trap notifications","ntp server 10.40.50.10",
      "ip access-list standard IT-DESKS","permit host 10.40.10.10","exit","line vty 0 15","access-class IT-DESKS in","login local","transport input ssh","end"].forEach(c=>e.exec(c)); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec("ip ssh version 2"); e.exec("end"); e.history.length=0; }},
    {id:"it", kind:"pc", label:"IT-PC", x:200, y:290, ip:"10.40.10.10", mask:"255.255.255.0", gw:"10.40.10.1", mac:"0050.56bb.1010"},
    {id:"user", kind:"pc", label:"USER-PC", x:330, y:290, ip:"10.40.10.40", mask:"255.255.255.0", gw:"10.40.10.1", mac:"0050.56bb.1040"},
  ],
  cables:[ {type:"cat6", a:"log:eth", b:"r1:g1"}, {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"it:eth", b:"sw:g2"}, {type:"cat6", a:"user:eth", b:"sw:g3"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Trustworthy time first.</b> Evidence with a wrong clock is weak evidence. AB-SW1 already takes time from LOG-SRV; AB-R1 doesn't. On AB-R1 add <code>ntp server 10.40.50.10</code>, then check <code>show ntp associations</code> and <code>show clock</code> (no <code>*</code> in front). Done when AB-R1 is synchronised", done:B=>Bench.ntpSynced(B,"r1") && (B.devs.r1.env.ntpServers||[]).includes("10.40.50.10")},
    {text:"<b>SSH works for the right person.</b> From IT-PC, <code>ssh -l netops 10.40.10.1</code> and log in. Done when LOG-SRV has received AB-R1's <code>%SEC_LOGIN-5-LOGIN_SUCCESS</code> for 10.40.10.10", done:B=>Bench.syslogGot(B,"log",/%SEC_LOGIN-5-LOGIN_SUCCESS: .*\[Source: 10\.40\.10\.10\]/)},
    {text:"<b>…and for nobody else.</b> From USER-PC try three doors: <code>ssh -l netops 10.40.10.1</code> (AB-R1), <code>ssh -l netops 10.40.10.2</code> (AB-SW1) and <code>telnet 10.40.10.2</code>. Write down the exact reply to each and which control produced it — three different replies from three different controls (AB-R1's <code>show logging | include SEC-6</code> explains the first)", done:B=>Bench.tried(B,"user",/^ssh\s.*10\.40\.10\.1\b/) && Bench.tried(B,"user",/^ssh\s.*10\.40\.10\.2\b/) && Bench.tried(B,"user",/^telnet\s+10\.40\.10\.2\b/) &&!Bench.syslogGot(B,"log",/LOGIN_SUCCESS: .*10\.40\.10\.40/)},
    {text:"<b>A password-guessing test.</b> From IT-PC, open SSH to AB-R1 and type a wrong password three times. Done when LOG-SRV holds the <code>%SEC_LOGIN-1-QUIET_MODE_ON</code> message — then prove the quiet-mode exception: IT-PC can still log in (correct password), and <code>show login</code> says Quiet-Mode", done:B=>Bench.syslogGot(B,"log",/%SEC_LOGIN-1-QUIET_MODE_ON/) && Bench.syslogGot(B,"log",/%SEC_LOGIN-4-LOGIN_FAILED/) && Bench.quietMode(B,"r1") && B.devs.r1.env.history.some(h=>/sh\S*\s+login/i.test(h))},
    {text:"<b>The data-plane test.</b> From USER-PC, <code>ping 10.40.50.10</code>: LAN-IN denies it with <code>log</code>. AB-R1's <code>show logging | include SEC-6</code> has the line — but LOG-SRV doesn't. Why not? (What severity does the <b>6</b> in <code>%SEC-6</code> mean, and what does <code>logging trap notifications</code> send?) Change AB-R1 to <code>logging trap informational</code>, ping again, and check <code>show access-lists LAN-IN</code>. Done when LOG-SRV has received the <code>%SEC-6-IPACCESSLOGDP</code> line for USER-PC", done:B=>Bench.syslogGot(B,"log",/%SEC-6-IPACCESSLOGDP: list LAN-IN denied icmp 10\.40\.10\.40 -> 10\.40\.50\.10/) && B.devs.r1.env.logTrap>=6},
    {text:"<b>The edge test.</b> A visitor plugs a laptop into Halima's desk socket while she's on leave: <code>plug</code> VISITOR LAPTOP's Ethernet into AB-SW1 Gi0/4 and ping 10.40.10.1 from it. Done when AB-SW1 has err-disabled Gi0/4 and LOG-SRV has the <code>%PORT_SECURITY-2-PSECURE_VIOLATION</code> line naming the visitor's MAC — then unplug the visitor and recover the port (<code>shutdown</code>, <code>no shutdown</code>)", done:B=>Bench.syslogGot(B,"log",/%PORT_SECURITY-2-PSECURE_VIOLATION: .*0050\.56bb\.7777/) && !Bench.errdis(B,"sw","g4") && !Bench.linked(B,"vis:eth","sw:g4")},
    {text:"<b>Save the evidence and the config.</b> <code>write memory</code> on AB-R1 and on AB-SW1 (over SSH from IT-PC, or move the console). Then copy every output you used into your portfolio's evidence folder", done:B=>!!B.devs.r1.env.savedOnce && !!B.devs.sw.env.savedOnce},
  ],
  win:"A sign-off you can show anyone: synchronised clocks, an SSH login that works for the IT desk and is refused everywhere else, a password-guessing run that tripped quiet mode while the IT desk kept its way in, a denied ping logged centrally once the trap level included severity 6, and a visitor's laptop err-disabling a desk port — every one of them on LOG-SRV with a trustworthy timestamp.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Abuja-Lab26"],
    ["term","configure terminal"],["term","ntp server 10.40.50.10"],["term","end"],["term","show ntp associations"],["term","show clock"],
    ["pc","it","ssh -l netops 10.40.10.1"],["pc","it","Ab-N3tops-2026"],["pc","it","exit"],
    ["pc","user","ssh -l netops 10.40.10.1"],["pc","user","ssh -l netops 10.40.10.2"],["pc","user","telnet 10.40.10.2"],["term","show logging | include SEC-6"],
    ["pc","it","ssh -l netops 10.40.10.1"],["pc","it","wrong-pass-1"],["pc","it","wrong-pass-2"],["pc","it","wrong-pass-3"],
    ["pc","it","ssh -l netops 10.40.10.1"],["pc","it","Ab-N3tops-2026"],["pc","it","exit"],["term","show login"],
    ["pc","user","ping 10.40.50.10"],["term","show logging | include SEC-6"],["term","configure terminal"],["term","logging trap informational"],["term","end"],["pc","user","ping 10.40.50.10"],["term","show access-lists LAN-IN"],
    ["plug","cat6","vis:eth","sw:g4"],["pc","vis","ping 10.40.10.1"],["unplug","vis:eth"],
    ["pc","it","ssh -l netops 10.40.10.2"],["pc","it","Ab-N3tops-2026"],["pc","it","enable"],["pc","it","Abuja-Lab26"],["pc","it","show interfaces status"],["pc","it","configure terminal"],["pc","it","interface g0/4"],["pc","it","shutdown"],["pc","it","no shutdown"],["pc","it","end"],["pc","it","write memory"],["pc","it","exit"],
    ["term","write memory"]]})}
${K.hint(`Task 3: three replies, three controls — <code>Connection timed out</code> (the interface ACL LAN-IN dropped the SYN before the VTY lines ever saw it; its SEC-6 line names USER-PC), <code>Connection refused</code> (AB-SW1's VTY access-class), and <code>Connect failed</code> on port 23 (AB-SW1 accepts SSH only). Task 5: ACL log messages are severity 6 (informational); <code>logging trap notifications</code> sends 0–5 only.`)}
<h3>Build it, break it, prove it</h3>
${K.steps([
  ["Policy first","The policy table and baseline before any command: IT desk range, parking VLAN, static-IP device list."],
  ["One plane at a time","Prove each item both ways before the next, so a fault has one possible cause."],
  ["Capture evidence as you go","Unedited outputs in files named by baseline ID (M2-access-class.txt), refusals and log lines included."],
  ["Break it on purpose","Three faults from this lesson, one at a time, each written up."],
  ["Publish","On GitHub, with every password, key and community string replaced by a placeholder."],
])}
<h3>A write-up template you can copy</h3>
<p>Save this as <code>README.md</code> and fill in each angle bracket.</p>
${K.out(`# Securing a three-site network: management plane, ACLs, switch edge — with evidence
Author: <name> · Built with: <Packet Tracer / GNS3 / CML / Ladder Lab> · <month year>

## 1. Problem
<2-4 sentences: what needed protecting, from what (threats in plain words), and the constraints>

## 2. Security policy (and why)
| # | Who (source)      | What (dest, protocol/port) | Action | Where (device, interface, direction) | Why |
|---|-------------------|----------------------------|--------|--------------------------------------|-----|

## 3. Baseline: /baseline/BASELINE.md (ID, requirement, config, proof)
## 4. What I configured, per plane: management, control, data, switch edge

## 5. Verification evidence (configs in /configs, outputs in /evidence)
| Baseline ID | Positive test (allowed works) | Negative test (refused fails) | Evidence (counter / log line) |
|-------------|-------------------------------|-------------------------------|-------------------------------|
| M2 | IT desk SSH: Password: | staff desk SSH: Connection refused | LOGIN_SUCCESS at syslog server |

## 6. What broke and how I fixed it
| # | Fault | Symptom | Plane | Fingerprint (command + line) | Fix | Proof |
|---|-------|---------|-------|------------------------------|-----|-------|

## 7. Limits and next steps
- Simulated in <tool + version>; simplifications <e.g. no TACACS+ server>; next <802.1X, SNMPv3>`, "Copy the whole block. Every claim in section 4 should have a row in section 5 — that is the difference between a config dump and a security project.")}
<h3>What &ldquo;done&rdquo; evidence looks like</h3>
<ul>
<li><code>show ip ssh</code>, <code>show login</code>, <code>show running-config | section line</code> per device; a refused Telnet and SSH from a user desk, an accepted SSH from the IT desk.</li>
<li>Per ACL: <code>show ip interface</code>, an allowed and a denied test, the counters after both, the SEC-6 line on the syslog server.</li>
<li><code>show ip ospf neighbor</code> (only expected neighbours) and <code>show ip protocols</code> (passive interfaces).</li>
<li><code>show port-security</code> with a test violation, <code>show interfaces status</code>, <code>show ip dhcp snooping</code>, the binding table, <code>show ip arp inspection</code>.</li>
<li>The syslog server's LOGIN_FAILED, QUIET_MODE_ON, LOGIN_SUCCESS, IPACCESSLOG and PSECURE_VIOLATION messages with synchronised times.</li>
</ul>
${K.tip(`Post it: 150 words on LinkedIn — problem, diagram, one fault proved by one log line, the link. &ldquo;The ACL facing the wrong way — its log showed the web server as the source&rdquo; is a ready interview story.`)}
${K.check({q:"Which evidence best proves that a VTY access-class works?", o:["The access-class line in the running-config","An SSH login from a permitted IT desk that reaches the password prompt, an SSH attempt from a staff desk that gets 'Connection refused', and the LOGIN_SUCCESS message for the IT desk on the syslog server","show ip ssh showing version 2.0","A screenshot of the ACL in show access-lists"], a:1, why:"The running-config and show access-lists show intent; show ip ssh proves SSH is on, not who may use it. A positive test, a negative test and a central log line together prove the control behaves as the baseline says."})}

<h2>Interview corner</h2>
${K.hint(`Answer plane by plane, and end with how you'd prove it — interviewers listen for the proof.`)}
${K.reveal("&ldquo;You've been given a new branch router and access switch. How would you harden them?&rdquo;",`<p>&ldquo;From our baseline, plane by plane. Management first, because it's the master key: SSH v2 only, a VTY access-class for the IT range, scrypt secrets, AAA with local fallback, login block-for with a quiet-mode exception, a banner, exec-timeout, NTP, syslog, backups, unused services off. Control plane: passive interfaces on LANs, <code>permit ospf</code> in WAN ACLs. Data plane: inbound ACLs on user LANs ending <code>deny ip any any log</code>. Switch edge: access and nonegotiate, port security, parked ports, snooping with only the uplink trusted, DAI with an ARP ACL. Then I prove each item both ways and keep the evidence.&rdquo;</p>`)}
${K.hint(`Configured, state, behaviour — and why the first isn't enough.`)}
${K.reveal("&ldquo;How do you know a security control is actually working?&rdquo;",`<p>&ldquo;The running-config shows intent; operational commands show state — <code>show ip interface</code> for direction, <code>show login</code>, <code>show port-security</code>. Proof is behaviour: a test that should pass and one that should fail in a specific way — <code>Connection refused</code> from an access-class, <code>Destination protocol unreachable</code> from an ACL — with a counter or log line on a synchronised syslog server. And I re-check on a schedule, because configs drift.&rdquo;</p>`)}
${K.hint(`Restore service first, keep the protection if you can, find out why, and change the process so it can't happen again.`)}
${K.reveal("&ldquo;You enabled a security feature last night and this morning part of the office can't work. What do you do?&rdquo;",`<p>&ldquo;Restore service first, keeping the protection if I can — add the ARP ACL entries rather than disable DAI — or roll back as the plan says, and tell users and my manager what's happening. Then find the root cause in the device's evidence and ask why the test plan missed it. Finally fix the process: the exception goes into the baseline, the case into the test plan, and I roll forward in a scheduled change.&rdquo;</p>`)}

${K.recap([
  "Every way in or through is needed and limited, or off; a control is finished when it has been seen working both ways, with a record.",
  "Four places: management plane (logins), control plane (routing), data plane (users' traffic), switch edge (access ports).",
  "Management plane: Who, Where, How, How long, What's recorded.",
  "Intent (show running-config) is not proof; state (show commands) and behaviour (a positive and a negative test with a counter or log line) are.",
  "An ACL log line whose source is a server answering on port 80 or 443 means the list is seeing replies — wrong direction or wrong interface.",
  "End lists with deny ip any any log for evidence; ACL log lines are severity 6, so the syslog trap level must be informational to send them.",
  "A baseline line is a testable promise: requirement, reason, config, proof, exceptions with an owner. Re-check it on a schedule — configs drift.",
  "Roll out enforcing features observe-first, and never change how you log in without a console path or reload in.",
])}
${K.next(`<b>Module 9 — Wireless networking.</b> Everything in this module assumed a cable and a switch port. Next, the radio: how 802.11 works, access points and controllers, SSIDs and VLANs — and the wireless half of the CCNA's security domain, WPA2 and WPA3, where &ldquo;who may connect&rdquo; is decided before a frame ever reaches a switch.`)}
`,
quiz:[
  {q:"An ACL on a router filters which users may reach the finance server. Which plane does it protect?", o:["Management plane","Control plane","Data plane","None — ACLs only protect the router itself"], a:2, why:"Users' packets passing through the router are the data plane. The management plane is logging in to and managing the device; the control plane is the routing protocols that build its tables.", lvl:1},
  {q:"show running-config | section line shows no exec-timeout line under line vty 0 4. What idle timeout applies?", o:["Sessions never time out","10 minutes, the default — IOS doesn't show it","1 minute","30 minutes"], a:1, why:"exec-timeout 10 0 is the default, so the running-config omits it. exec-timeout 0 0 (never) would be shown — that is the line a baseline check looks for.", lvl:1},
  {type:"order", q:"Put the verification loop for a new security control in order.", items:["Configure the control","Read it back with show commands (direction, state)","Run a positive test: the allowed thing works","Run a negative test: the refused thing fails the expected way","Collect the evidence: counters and log lines","Record the result against the baseline and in the ticket"], why:"Steps 1–2 show intent and state; only the tests with their evidence prove behaviour; recording it makes the next check possible.", lvl:1},
  {type:"match", q:"Match each control with the command that best shows it is active.", pairs:[["Login blocking","show login"],["SSH version 2","show ip ssh"],["Which ACL is applied, and in which direction","show ip interface"],["The DHCP snooping trusted uplink","show ip dhcp snooping"],["Secured desk ports and their violations","show port-security"]], why:"Each feature has a state command: show login for block-for and quiet mode, show ip ssh for the SSH version, show ip interface for the Inbound/Outgoing access list lines, show ip dhcp snooping for trusted interfaces, show port-security for every secured port's counts and action.", lvl:1},
  {type:"multi", q:"An auditor asks you to prove that Telnet is disabled on a switch. Which two pieces of evidence together prove it? (Choose two.)", o:["show running-config | section line vty showing transport input ssh on every VTY block","A telnet attempt from a PC that fails with 'Connect failed' on port 23","show ip ssh showing version 2.0","show interfaces status showing all ports connected","A copy of the change request"], a:[0,1], why:"The configuration on every VTY block (0 4 and 5 15 on a Catalyst) shows intent; a refused Telnet from a PC proves behaviour. show ip ssh proves SSH is on, not that Telnet is off; the other two say nothing about Telnet.", lvl:2},
  {type:"fill", q:"Type the command that shows whether an access list is applied to GigabitEthernet0/0 and in which direction (Inbound or Outgoing).", fields:[{label:"Command", a:["show ip interface g0/0","show ip interface gigabitethernet0/0","show ip interface gi0/0","show ip interface gigabitethernet 0/0"], ios:true}], why:"show ip interface lists 'Outgoing access list is …' and 'Inbound access list is …' for the interface. show access-lists shows the entries and counters, but not where a list is applied.", lvl:2},
  {q:"Based on the log line, what is wrong with GUEST-IN on the router's guest interface (guest LAN 10.9.20.0/24)?", ex:"%SEC-6-IPACCESSLOGP: list GUEST-IN denied tcp 203.0.113.80(443) -> 10.9.20.33(51544), 1 packet", o:["Guests are trying to reach a blocked website","The list sees replies from the website (source port 443) coming back to a guest, so it is applied outbound on the guest interface or on the wrong interface","The router has no route to 203.0.113.80","HTTPS is not supported by ACLs"], a:1, why:"The denied packet's source is the website on port 443 and its destination a guest's high port — a reply. A list written about guest sources must face the guests' own packets: inbound on the guest interface. Move it with no ip access-group GUEST-IN out, ip access-group GUEST-IN in.", lvl:2},
  {q:"A router's show logging buffer contains %SEC-6-IPACCESSLOGDP lines for denied pings, but the central syslog server receives the router's %SYS-5-CONFIG_I messages and never the ACL lines. Its config includes logging host 10.40.50.10 and logging trap notifications. What should you change?", o:["Add log-input to every ACL line","Set logging trap informational, because ACL log messages are severity 6 and notifications sends only 0–5","Point logging host at the router's own address","Nothing — ACL messages are never sent to syslog servers"], a:1, why:"logging trap sets the most detailed severity sent to hosts. %SEC-6 is informational (6); notifications (5) excludes it while still sending CONFIG_I (severity 5). logging trap informational sends 0–6.", lvl:2},
  {q:"The NOC can't SSH to a router for two minutes at a time. Based on the output, what single change keeps the NOC hosts able to log in when this happens again?", ex:"KN-R1#show login\n     A default login delay of 1 seconds is applied.\n     No Quiet-Mode access list has been configured.\n     All successful login is logged and generate SNMP traps.\n     All failed login is logged and generate SNMP traps.\n\n     Router enabled to watch for login Attacks.\n     If more than 3 login failures occur in 60 seconds or less,\n     logins will be disabled for 120 seconds.\n\n     Router presently in Quiet-Mode.\n     Will remain in Quiet-Mode for 120 seconds.\n     Denying logins from all sources.", o:["no login block-for","login quiet-mode access-class with a list permitting the NOC hosts","exec-timeout 0 0 on the VTY lines","transport input all"], a:1, why:"Quiet mode refuses every source not permitted by the quiet-mode access-class; with none configured, all sources are denied. A list of NOC hosts applied with login quiet-mode access-class keeps protection on and the NOC in. Removing login block-for throws the protection away; the cause (whoever is failing) still needs fixing.", lvl:2},
  {type:"multi", q:"Which three should every line of a security baseline contain? (Choose three.)", o:["The requirement in plain words, with its reason","The exact configuration that meets it","The command or test that proves it, with what good looks like","The current passwords for the devices","The serial numbers of every device"], a:[0,1,2], why:"A baseline line is a testable promise: what and why, the config, and the proof. Real passwords never belong in a baseline; asset details live in the inventory.", lvl:2},
  {type:"fill", q:"DAI is enabled on VLAN 40 with an ARP ACL called SITE-STATIC applied. A new IP camera has the static address 10.70.40.9 and the MAC 00a1.b2c3.d4e5. Type the line to add inside arp access-list SITE-STATIC.", fields:[{label:"ARP ACL line", a:["permit ip host 10.70.40.9 mac host 00a1.b2c3.d4e5","permit ip host 10.70.40.9 mac host 00A1.B2C3.D4E5"]}], why:"A static-IP device never gets a DHCP snooping binding, so DAI needs an ARP ACL entry: permit ip host <IP> mac host <MAC>. Because the filter is already applied to VLAN 40 (without static), the camera passes as soon as the line exists and DHCP clients keep passing on their bindings.", lvl:2},
  {q:"You must change the VTY access-class on a branch router 400 km away, over SSH, with no one on site. What is the best protection against locking yourself out?", o:["Apply the change and hope the list is right","Type reload in 15 first; apply the change; prove a new login from a second session; then save and reload cancel","Remove the access-class entirely before you start","Use Telnet instead, because it isn't filtered by access-class"], a:1, why:"A scheduled reload brings the router back to its saved configuration if the change locks you out. Proving a fresh login from a second session before saving and cancelling the reload turns 'I think it's right' into evidence. Removing the protection or using Telnet defeats the purpose.", lvl:3},
  {q:"A staff member moved desks on Friday. Based on the output, what is the right fix that keeps the desk policy (maximum 1, shutdown mode)?", ex:"HQ-SW1#show port-security interface g0/6\nPort Security              : Enabled\nPort Status                : Secure-shutdown\nViolation Mode             : Shutdown\n...\nMaximum MAC Addresses      : 1\nTotal MAC Addresses        : 1\nConfigured MAC Addresses   : 0\nSticky MAC Addresses       : 1\nLast Source Address:Vlan   : 0050.56aa.1036:10\nSecurity Violation Count   : 1", o:["switchport port-security maximum 2 on Gi0/6","After confirming the new PC is company kit, remove the old sticky address and recover the port (shutdown, no shutdown) so the new PC is learned","no switchport port-security on Gi0/6","Change the violation mode to protect"], a:1, why:"The port holds one sticky address (the previous PC's) and saw a new source, 0050.56aa.1036 — a violation in shutdown mode. The policy is still right; the stored address is stale. Clear it (clear port-security sticky interface Gi0/6), bounce the port and the new PC is learned. The other options weaken the desk policy.", lvl:3},
  {q:"After a weekend change, every PC at a branch shows a 169.254 address. The access switch has ip arp inspection trust on its uplink, ip dhcp snooping vlan 30, no ip dhcp snooping information option, and ip dhcp snooping. show ip dhcp snooping binding shows 0 bindings. What is the most likely cause?", o:["DAI is dropping the DHCP Discover messages","The uplink is trusted for DAI but not for DHCP snooping, so the router's Offers are dropped as server messages on an untrusted port","Option 82 insertion is still enabled","The PCs need static addresses when DAI is on"], a:1, why:"DAI trust and snooping trust are separate interface commands. Without ip dhcp snooping trust, the uplink is untrusted for snooping and every Offer from the real server is dropped: no leases, no bindings, APIPA. Option 82 is already disabled in this config. Add ip dhcp snooping trust on the uplink.", lvl:3},
  {q:"A branch router's OSPF neighbour over the WAN disappeared right after an inbound ACL called WAN-IN was applied to the WAN interface. WAN-IN permits SSH from the IT desks, ICMP and established web replies, then ends with deny ip any any log. Routes from HQ are gone, but pings across the WAN link work. What is the fix?", o:["Remove WAN-IN from the interface","Insert permit ospf any any (or permit ospf from the neighbour's address) above the final deny","Make the WAN interface passive","Add permit icmp any any"], a:1, why:"An inbound ACL also filters routing-protocol packets arriving at the router. OSPF (IP protocol 89, hellos to 224.0.0.5) matches none of the permits, so hellos fall to the deny and the adjacency dies; pings still work because ICMP is permitted. A sequence-numbered permit ospf line above the deny restores the neighbour while keeping the filter. A passive WAN interface would stop OSPF on that link entirely.", lvl:3},
  {q:"An audit script checks every switch with show running-config | section line vty 0 4 and reports 'transport input ssh — compliant'. Why might a Catalyst switch still accept Telnet?", o:["Catalyst switches ignore transport input","The switch has sixteen VTY lines; line vty 5 15 is a separate block that the check never read, and it can still allow Telnet","Telnet uses the console line","transport input ssh only applies after a reload"], a:1, why:"Catalysts show line vty 0 4 and line vty 5 15 as two blocks. A check that reads only the first can miss Telnet on lines 5–15, which a session can land on — at the latest once five sessions are open. Configure line vty 0 15 and check both blocks — and prove it with a Telnet attempt.", lvl:3},
],
cards:[
  {f:"The hardening rule", b:"Every way into or through a device is either needed and limited to who needs it, or switched off. A control is finished only when it has been seen working both ways (allowed works, refused fails as expected) with a counter or log line as the record."},
  {f:"The four places to protect", b:"Management plane: logins and device management. Control plane: routing protocols and the tables they build. Data plane: users' traffic passing through. Switch edge: access ports — what may plug in and what it may claim."},
  {f:"Management plane: five questions", b:"Who (AAA, named users, scrypt secrets, min-length), Where (VTY access-class), How (SSH v2 only), How long and how many tries (exec-timeout, login block-for + quiet-mode access-class), What's recorded (banner, login logging, NTP, syslog, backups)."},
  {f:"Intent, state, behaviour", b:"Intent: show running-config. State: show ip interface, show login, show port-security, show ip dhcp snooping, show ip arp inspection. Behaviour: a positive and a negative test plus a counter or log line. Only state and behaviour are proof."},
  {f:"Proving an ACL", b:"show ip interface (which list, Inbound or Outgoing), one allowed and one denied test, show access-lists counters after both, the SEC-6 log line. End lists with deny ip any any log so drops leave evidence."},
  {f:"Wrong-direction fingerprint", b:"An ACL log line whose source is a server answering from port 80/443 (or an echo reply, icmp 0/0) means the list sees replies: it is applied in the wrong direction or on the wrong interface."},
  {f:"exec-timeout in the config", b:"exec-timeout 10 0 is the default and is hidden in the running-config. A missing line is fine; exec-timeout 0 0 (never time out) is the red flag."},
  {f:"Quiet mode without an exception", b:"show login 'Denying logins from all sources' = no quiet-mode access-class (IOS uses sl_def_acl). Add login quiet-mode access-class with the IT/NOC hosts, and fix whatever is failing the logins."},
  {f:"ACL logs and the syslog trap level", b:"%SEC-6-IPACCESSLOG lines are severity 6 (informational). logging trap notifications sends 0-5 only; use logging trap informational if ACL drops must reach the central server."},
  {f:"Switch-edge proofs", b:"show port-security (counts, action), show interfaces status (err-disabled / parked ports disabled), show ip dhcp snooping (uplink trusted 'yes'), show ip dhcp snooping binding (one per DHCP client), show ip arp inspection (ACL Match, drops)."},
  {f:"Snooping trust vs DAI trust", b:"Two separate interface commands: ip dhcp snooping trust and ip arp inspection trust. An uplink trusted only for DAI still drops the DHCP server's Offers: zero bindings, APIPA everywhere."},
  {f:"A good baseline line", b:"ID + requirement in plain words + reason + exact config + proof with what good looks like + exceptions with an owner and expiry. If a line can't be checked, it's an opinion."},
  {f:"Changing how you log in, safely", b:"Have a console path, or type reload in 10 first; make the change; prove a fresh login from a second session; then save and reload cancel. Roll out enforcing features observe-first."},
],
});


const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[1-7]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m8", t:"Security fundamentals: device access, AAA, ACLs, port security, DHCP snooping and DAI",
  blurb:"Think like a defender — threats, vulnerabilities and mitigations — then lock down who can reach and log in to your devices (strong secrets, login blocking, AAA with RADIUS/TACACS+), filter traffic with standard and extended ACLs, stop unknown devices with port security, and stop rogue DHCP servers and false ARP replies with DHCP snooping and DAI — then secure a broken site in the Module 8 challenge.",
}, L, { at, modAt:7, replace:["Security fundamentals: CIA, AAA, attacks, port security, DHCP snooping, DAI"] });
})();
