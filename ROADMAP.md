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
⬜ M3 Windows command line & disk management: `cmd`/PowerShell, copy/xcopy/robocopy, chkdsk, sfc/DISM, diskpart
⬜ M4 Networks for support: IP config, DHCP vs static, DNS, Wi-Fi, shared printers, mapped drives
⬜ M5 Active Directory & accounts: domains vs workgroups, joining a domain, users/groups/OUs, password resets, GPO basics, Microsoft 365/Entra ID
⬜ M6 Troubleshooting methodology & customer service: the CompTIA 7 steps, tickets, SLAs, talking to users
⬜ M7 Security for support: malware removal, MFA, phishing, BitLocker, backups, least privilege
⬜ M8 Number systems: binary, hex, how computers count (shared with CCNA M2)

**2. Networking — CCNA 200-301** (v1.1 until 2 Feb 2027; v2.0 from 3 Feb 2027 — same code, more troubleshooting, new AI-in-network-operations domain ~10%: covered as it lands)
✅ M1 How networks work — what a network is, devices, cables, topologies, OSI/TCP-IP, encapsulation, TCP/UDP, first IOS session · Core/Exam/Stretch quizzes · Module 1 challenge
✅ M2 Ethernet switching & ARP — MAC learning and the MAC table, flooding, broadcast & collision domains, ARP, switch basics and verification
✅ M3 Binary, IPv4 addressing & subnetting — binary/hex, address classes & private ranges, masks & CIDR, subnetting the fast way, VLSM, drills
✅ M4 VLANs, trunks & Spanning Tree — 7 lessons (VLANs + voice VLAN, 802.1Q trunks/native/allowed/DTP/VTP, inter-VLAN routing ROAS + L3 switch, STP basics, Rapid PVST+ in practice with PortFast/BPDU guard/root guard, EtherChannel LACP/PAgP/on, troubleshooting + 8-fault challenge); 13 benches, 7 terminals, 25 diagrams, all fact-checked
⬜ M5 Routing — routing table logic, static & default routes, longest-prefix match, administrative distance, OSPF (single/multi-area, DR/BDR, cost, troubleshooting), RIP/EIGRP overview, FHRP/HSRP
⬜ M6 IPv6 — addressing & shortening, types, EUI-64, SLAAC, DHCPv6, static IPv6 routing
⬜ M7 IP services — DHCP (and relay), DNS, NAT/PAT, NTP, SNMP, syslog, SSH, FTP/TFTP, QoS
⬜ M8 Security — CIA, threats & attacks (DoS/DDoS, spoofing, MITM, social engineering), AAA/RADIUS/TACACS+, standard & extended ACLs, port security, DHCP snooping, DAI, VPNs, wireless security
⬜ M9 Wireless — RF basics (reflection, refraction, absorption, diffraction, scattering), 802.11 standards, SSIDs/service sets, AP modes, autonomous vs lightweight vs cloud APs, WLC config, WPA2/WPA3
⬜ M10 WAN, virtualization & cloud — WAN options, MPLS, SD-WAN, VMs, containers, VRFs, cloud service models
⬜ M11 Automation & programmability — planes (data/control/management), SDN (SBI/NBI), REST & JSON, Ansible/Terraform/Puppet/Chef, Catalyst Center
⬜ M12 Troubleshooting capstone & exam prep — multi-fault scenarios, full timed mock exams

### Phase 1 · Core
**3. Linux** — filesystem · permissions · processes/systemd/logs · text tools · bash scripting · networking · SSH · packages & cron · disks/LVM · hardening · troubleshooting scenarios
**4. Git & GitHub** — how Git thinks · branching & merging · conflicts · remotes & PRs · rebase/reset/revert safely · GitHub Actions intro · team workflows
**5. Python & network automation** — Python from zero (types, collections incl. sets, functions, scope, errors, OOP) · files & JSON · Paramiko/Netmiko · scaling to 500 routers · threading · regex/TextFSM · REST APIs/RESTCONF · Ansible · testing & packaging
**6. AWS** — Cloud Practitioner foundations → Solutions Architect Associate (IAM, EC2, storage, ELB/ASG, S3, databases, Route 53/CloudFront, VPC, decoupling, serverless, containers, monitoring, security, DR, cost) → AI Practitioner
**7. Databases & SQL** *(new)* — relational thinking, SQL from SELECT to joins/indexes, PostgreSQL admin, NoSQL, backups, on AWS (RDS/Aurora/DynamoDB)

### Phase 2 · Platform
**8. Docker** · **9. Terraform** · **10. CI/CD & GitHub Actions** · **11. Kubernetes** · **12. Observability, SRE & GitOps** · **13. Security engineering** *(new — network, cloud and DevSecOps)*

### Phase 3 · Builder & AI *(new)*
**14. Full-stack web development** — HTML/CSS/JS, a backend API, databases, auth, deployment
**15. AI, ML & generative AI** — ML fundamentals, deep learning, LLMs, prompting, RAG, fine-tuning, AI on AWS

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
1. Finish CCNA: M5 routing (OSPF, statics, HSRP) → M6 IPv6 → M7 IP services → M8 security → M9 wireless → M10 automation.
   Every module ends with a portfolio project (built for real, with a write-up template).
2. Finish the platform: Work Experience mode (simulated job: tickets, change requests, incidents, STAR stories),
   portfolio projects for M1–M4, access points + firewalls in the topology builder, curated videos.
3. The foundations ladder, rebuilt to the same standard: Git → Linux → AWS → Python.
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
