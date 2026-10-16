# Ladder Lab — roadmap

Goal: one place to learn, practise and **build provable experience** along the career path
IT Support → Network Engineer → Cloud Engineer → DevOps / Platform → Cloud Network Architect.
Every lesson follows [CONTENT_GUIDE.md](CONTENT_GUIDE.md). Depth benchmark: the best-known courses for each
topic (Jeremy's IT Lab CCNA, Stephane Maarek's AWS courses, Andrei's network automation, etc.) — used to check
*coverage*, never copied. Each module ships as its own commit.

Status: ✅ rebuilt · 🔨 in progress · ⬜ planned (classic short lessons stay visible until their module is rebuilt)

## Part A — Courses

### Phase 0 · Foundations
**1. IT Support & Hardware (CompTIA A+ Core 1 & 2 level)**
⬜ M1 Inside the computer: CPU, RAM, storage, motherboards, power, building and upgrading a PC
⬜ M2 Operating systems: Windows install/repair, settings, Control Panel vs Settings, macOS & Linux basics
⬜ M3 Windows command line & disk management: `cmd`/PowerShell, copy/xcopy/robocopy, chkdsk, sfc/DISM, diskpart, PowerShell scripting for everyday admin tasks
⬜ M4 Networks for support: IP config, DHCP vs static, DNS, Wi-Fi, shared printers, mapped drives
⬜ M5 Active Directory & accounts: domains vs workgroups, joining a domain, users/groups/OUs, password resets, GPO basics, Microsoft 365/Entra ID
⬜ M6 Troubleshooting methodology & customer service: the CompTIA 7 steps, tickets, SLAs, talking to users
⬜ M8 Number systems: binary, hex, how computers count (shared with CCNA M2)

**2. Networking — CCNA 200-301** (v1.1 until 2 Feb 2027; v2.0 from 3 Feb 2027 — same code, more troubleshooting, new AI-in-network-operations domain ~10%: covered as it lands)
✅ M1 How networks work — what a network is, devices, cables, topologies, OSI/TCP-IP, encapsulation, TCP/UDP, first IOS session · Core/Exam/Stretch quizzes · Module 1 challenge
✅ M2 Ethernet switching & ARP — MAC learning and the MAC table, flooding, broadcast & collision domains, ARP, switch basics and verification
✅ M3 Binary, IPv4 addressing & subnetting — binary/hex, address classes & private ranges, masks & CIDR, subnetting the fast way, VLSM, drills
✅ M4 VLANs, trunks & Spanning Tree — 7 lessons (VLANs + voice VLAN, 802.1Q trunks/native/allowed/DTP/VTP, inter-VLAN routing ROAS + L3 switch, STP basics, Rapid PVST+ in practice with PortFast/BPDU guard/root guard, EtherChannel LACP/PAgP/on, troubleshooting + 8-fault challenge); 13 benches, 7 terminals, 25 diagrams, all fact-checked
✅ M5 Routing — 8 lessons (reading the routing table: longest match, AD, metric; static/default/host/floating routes and recursion; OSPF concepts; single-area OSPF config; DR/BDR and network types; OSPF cost and adjacency troubleshooting + multi-area first look; HSRP with VRRP/GLBP compared; end-to-end troubleshooting + 7-fault challenge + first portfolio project); 14 benches, 8 terminals, 27 diagrams, all fact-checked
✅ M6 IPv6 — 6 lessons (reading/shortening addresses; address types and /48 subnet planning; router config, EUI-64, link-local; NDP, SLAAC vs DHCPv6, what Windows shows; static, default, floating and link-local-next-hop routes; dual-stack troubleshooting + 6-fault challenge + portfolio project); 9 benches, 6 terminals, 22 diagrams, all fact-checked; IPv6 engine (RA/SLAAC, ND, routing, traceroute return path, extended ping)
✅ M7 IP services — 8 lessons (DHCP server and the Windows client; relay with ip helper-address and the router as DHCP client; DNS; NAT and static/dynamic NAT; PAT, port forwarding and NAT troubleshooting; NTP and syslog; SNMP and TFTP backups; QoS + 6-fault challenge + portfolio project); 16 benches, 8 terminals, 31 diagrams, all fact-checked; IP-services engine (DHCP/relay/client, NAT/PAT in the packet path, DNS, NTP, syslog servers, SNMP + Net-SNMP tools, TFTP)
✅ M8 Security fundamentals — 8 lessons (security concepts, attack categories and a security programme + auditing an exposed device; device access: password types, scrypt users, min-length, login block-for/quiet mode/logging, banners, password policy and MFA; AAA with RADIUS vs TACACS+, method lists and local fallback, 802.1X, IPsec and TLS VPN concepts; standard ACLs and VTY access-class; extended ACLs, ports, logging, placement and troubleshooting; port security and access-port hygiene; DHCP snooping and Dynamic ARP Inspection; hardening checklist + 7-fault challenge + portfolio project); 14 benches, 8 terminals, 28 diagrams, 13 drills ("Different question": ACL first match, range→wildcard, placement, port-security outcome, snooping drop, DAI decision, password types, RADIUS vs TACACS+, CIA), 125 quiz questions, all fact-checked; security engine (ACLs in the packet path, port security, DHCP snooping, DAI, login hardening, AAA); wireless security moves to M9
✅ M9 Wireless — 7 lessons (RF and 802.11 fundamentals; bands, channels and service sets; Cisco architectures and AP modes; PoE, switch ports, LAG, CAPWAP and the AP join with DHCP option 43; the WLC GUI — interfaces, WLANs, QoS, management access; wireless security WEP→WPA3 and configuring WPA2-PSK; troubleshooting + 7-fault challenge + portfolio project); 11 benches, 8 terminals, 28 diagrams, 8 drills (channel ↔ frequency, overlap, channel plans, dBm, SNR), 107 quiz questions, all fact-checked; wireless engine (lightweight APs, an AireOS-style WLC GUI, Wi-Fi laptops, CAPWAP discovery, local vs FlexConnect switching, WPA2/WPA3, Windows netsh)
⬜ M10 WAN, virtualization & cloud — WAN options, MPLS, SD-WAN, VMs, containers, VRFs, cloud service models
⬜ M11 Automation & programmability — planes (data/control/management), SDN (SBI/NBI), REST & JSON, Ansible/Terraform/Puppet/Chef, Catalyst Center
⬜ M12 Troubleshooting capstone & exam prep — multi-fault scenarios, full timed mock exams

### Phase 1 · Core
**3. Linux** — filesystem · permissions · processes/systemd/logs · text tools · bash scripting · networking · SSH · packages & cron · disks/LVM · hardening · troubleshooting scenarios
**4. Git & GitHub** — how Git thinks · branching & merging · conflicts · remotes & PRs · rebase/reset/revert safely · GitHub Actions intro · team workflows
**5. Python & network automation** — Python from zero (types, collections incl. sets, functions, scope, errors, OOP) · files & JSON · Paramiko/Netmiko · scaling to 500 routers · threading · regex/TextFSM · REST APIs/RESTCONF · Ansible · testing & packaging
**6. AWS** — Cloud Practitioner foundations → Solutions Architect Associate (IAM, EC2, storage, ELB/ASG, S3, databases, Route 53/CloudFront, VPC, decoupling, serverless, containers, monitoring, security, DR, cost) → AI Practitioner
**7. Web & API engineering** *(new, 15 Oct 2026, owner-approved)* — how the web works (HTTP/HTTPS, methods, status codes, headers, URL anatomy, the request lifecycle, browser rendering; DNS/TCP/TLS basics refer back to CCNA), web security (authN vs authZ, sessions vs JWT, OAuth 2.0/OIDC, cookie flags, XSS, CSRF, SQL injection, CORS, CSP, HSTS, SSRF, clickjacking, hashing vs encryption, secrets management, input validation, the OWASP Top 10 as its own lesson, MFA/passkeys, least privilege), caching (Cache-Control, ETags/304, CDNs, Redis, invalidation, stale-while-revalidate, cache layers), APIs (REST, JSON, GraphQL, WebSockets, SSE, webhooks, rate limiting/429, pagination, idempotency, versioning, API gateways, OpenAPI); drills for status codes, cache headers, cookie/JWT flags and CORS decisions; the owner's real site (Vercel + Payload + Neon) as the portfolio project
**8. Cloud networking & BGP** *(new, 12 Oct 2026)* — BGP from zero (neighbours, AS numbers, path attributes, best-path choice, eBGP vs iBGP), hybrid connectivity (site-to-site VPN and AWS Direct Connect over BGP), VPC design and IP planning, Transit Gateway and route tables, hybrid DNS (Route 53 Resolver), load balancers, troubleshooting cloud and hybrid paths — the core of the Cloud Network Architect target
**9. Security for network & cloud engineers** *(new, 12 Oct 2026; 6–8 lessons, builds on CCNA M8)* — stateful vs stateless filtering, zones and next-gen firewalls, hands-on IPsec site-to-site and remote-access VPNs, TLS and PKI (certificates, chains, why expiry breaks things), cloud IAM and least privilege, zero trust, logging and alerting (SIEM basics); Security+ stays optional (see Certs); application security lives in course 7 and is linked, not repeated
**10. Databases & SQL** *(new)* — relational thinking, SQL from SELECT to joins/indexes, ORMs and the N+1 trap, migrations, transactions/ACID, normalisation, connection pooling, replication/sharding, point-in-time recovery, PostgreSQL admin, NoSQL, backups, on AWS (RDS/Aurora/DynamoDB)

### Phase 2 · Platform
**11. Docker** · **12. Terraform** · **13. CI/CD & GitHub Actions** *(incl. the testing pyramid, linting/formatting, static typing, environments, 12-factor config, rollbacks, blue-green and feature flags, domains + TLS setup)* · **14. Kubernetes** · **15. Observability, SRE & GitOps** *(incl. reverse proxies, load balancing, scaling, message queues, health checks and graceful shutdown)* · **16. DevSecOps** *(pipeline and supply-chain security, secrets, image scanning, policy as code — network and cloud security moved to course 8)*

### Phase 3 · Builder & AI *(new)*
**17. Full-stack web development** *(incl. performance — Core Web Vitals, code splitting, compression, images, Lighthouse — and frontend architecture — SPA/MPA, CSR/SSR/SSG/ISR, hydration, state, a11y, SEO, PWAs)* — HTML/CSS/JS, a backend API, databases, auth, deployment
**18. AI, ML & generative AI** — ML fundamentals, deep learning, LLMs, prompting, RAG, fine-tuning, AI on AWS

## Part B — Building real experience ("Work Experience" mode)

Employers ask for years of experience because they want proof that you've handled real situations.
This mode is how you get that proof before your first role:

- **A simulated job.** You join a made-up company (an MSP in Lagos serving banks, schools and offices) at the
  level you've unlocked: Service Desk → NOC → Network Engineer → Cloud/DevOps. Work arrives as tickets,
  change requests and incidents with SLAs, and you resolve them inside the simulators (not by picking A/B/C).
- **An experience log.** Everything you resolve is logged: what broke, how you diagnosed it, what you changed,
  how you verified it. The log turns into **CV bullet points** and **STAR interview stories** written from your own work.
- **Real portfolio projects.** Each phase ends in a project you build for real and push to your GitHub
  (e.g. a network-audit tool, a Terraform VPC, a CI/CD pipeline, a Kubernetes deployment), with a
  checklist of what a hiring manager looks for.
- **Interview loop.** Mock interviews pull from the topics *and* the incidents you've personally handled.

## Part D — Certification roadmap
✅ **Certs tab** — each certification on the path, with verdict, timing notes, the courses that prepare you, and a
readiness meter (course progress + best Hard-mode exam). Aligned with the Infrastructure Ladder plan; exam facts
checked Oct 2026 (CCNA v2.0 from Feb 2027, DevNet Associate → CCNA Automation, AWS Advanced Networking retiring).

## Build order (agreed with the owner, 11 Oct 2026)
1. Finish CCNA: M5 routing (OSPF, statics, HSRP) → M6 IPv6 → M7 IP services → M8 security → M9 wireless → M10 WAN, virtualization
   & cloud → M11 automation & programmability → M12 troubleshooting capstone & exam prep.
   Every module ends with a portfolio project (built for real, with a write-up template).
2. Finish the platform: Work Experience mode (simulated job: tickets, change requests, incidents, STAR stories),
   portfolio projects for M1–M4, access points + firewalls in the topology builder, curated videos.
3. The foundations ladder, rebuilt to the same standard: Git → Linux → AWS → Python, then Web & API engineering (added
   15 Oct 2026) → Cloud networking & BGP → Security for network & cloud engineers (added 12 Oct 2026) → Databases & SQL,
   all owner-approved. Topics already taught in CCNA are referred back to, not repeated.
4. Then DevOps: Docker → Terraform → CI/CD → Kubernetes → SRE.

## Part E — Next big builds (from the owner's testing)
- ✅ **Topology builder (sandbox)** — Labs → Topology builder: palette (router, L2 switch, multilayer switch, hub, PC,
  laptop, server, printer, Internet/ISP), drag to place, cable from the tray, CLI/IP settings/Command Prompt on each
  device, rename/delete, autosave, named saves, export/import. Templates: small office, two-tier campus, three-tier
  campus, HQ + branch WAN, spine-leaf data centre. ⬜ Still to add to the palette: access points + wireless clients,
  firewalls (needs the wireless and ACL/NAT engine work).
- ⬜ **Wireless:** access points and wireless clients on the bench — SSIDs, bands/channels, WPA2/WPA3 PSK vs Enterprise,
  autonomous vs controller-based (WLC) and how APs look/mount in real offices and campuses (CCNA M9).
- ⬜ **Routing protocols in the engine:** OSPF adjacencies and LSAs for Module 5, then **BGP** — eBGP to an ISP, AS
  numbers, path selection basics, and how it underpins internet edges and AWS Direct Connect/VPN (taught after CCNA as
  part of the cloud-networking track; BGP basics also appear in CCNP ENCOR).
- ✅ **VLANs, trunks, Spanning Tree and EtherChannel on the bench** — 802.1Q tags on the wire, DTP, native/allowed
  VLANs, router-on-a-stick, SVIs, PVST/Rapid PVST+ elections with real blocked ports, a live broadcast storm when STP
  is off, BPDU guard err-disable, LACP/PAgP/on bundles.
- ✅ **Worked solutions everywhere:** every bench, in-lesson terminal and classic lab has "Show solution" and a
  step-by-step "Watch it / Type it for me" player; watching never awards points. ✅ Back button + browser history.

## Part C — Simulator upgrades

Also shipped: CCNA-style question types (multi-select, ordering, matching, fill-in, exhibits) in quizzes, the timed exam and lessons;
Core / Exam / Stretch difficulty tags and a Hard-mode exam; module challenge benches; Cisco IOS engine v2 (`sim_ios.js`).


1. **Service Desk simulator** — a simulated Windows/Active Directory admin console (reset passwords, unlock accounts,
   map drives and printers, read event logs) driven by ticket queues and user chat.
2. 🔨 **Network topology lab** — ✅ first version shipped as the hands-on bench (`bench.js`): cabling, SFP optics,
   fibre polarity, console + PuTTY settings, PC IP settings, ipconfig/ping, link lights and IOS-aware link state.
   Next: multiple routers with routing between subnets, VLAN-aware switching, drag-to-cable on touch screens.
   Original goal: multi-device labs where you cable devices together (console, copper, fibre) and traffic
   really flows between them: ping/traceroute across routers, VLANs, OSPF neighbours, ACLs blocking traffic.
3. **Richer Linux box** — services that break, logs to read, disks that fill, broken permissions to fix.
4. **Cloud console sandbox** — a simulated AWS console/CLI for VPCs, security groups, EC2 and S3 scenarios.
