// Certification roadmap — aligned with the Infrastructure Ladder plan (data_career.js) and checked against
// public sources in Oct 2026. Exam facts change: every card links to "check the vendor page before booking".
// tracks: Ladder Lab courses that prepare you. readiness = course progress + best Hard-mode exam on those courses.
(function(){
LL.certs = [
  // ---------- Foundations ----------
  { id:"ccna", stage:"Foundations", name:"Cisco CCNA", code:"200-301", vendor:"Cisco", verdict:"YES — core credential",
    tracks:["ccna"], hands:"Multiple choice, drag-and-drop and simulations, about 120 minutes",
    why:"The networking credential employers recognise everywhere. It's the base of your network → cloud network edge, and Ladder Lab's CCNA course is being built to beyond-exam depth.",
    timing:"v1.1 runs until 2 Feb 2027; v2.0 (same 200-301 code, same CCNA credential) starts 3 Feb 2027 with a heavier troubleshooting focus and a new AI-in-network-operations domain (~10%). Ladder Lab covers both — the troubleshooting benches and Stretch questions are exactly what v2.0 rewards." },
  { id:"secplus", stage:"Foundations", name:"CompTIA Security+", code:"SY0-701", vendor:"CompTIA", verdict:"FINISH FAST OR PARK",
    tracks:[], hands:"Multiple choice plus performance-based questions, 90 minutes",
    why:"A respected security baseline (and a hard requirement for some government/defence roles), but not the strongest cert for a cloud path. Your plan: finish it in 6 weeks if you're far in, otherwise park it.",
    timing:"Ladder Lab's Security course is planned; until then use the CCNA security module plus your existing study." },
  { id:"aplus", stage:"Foundations", name:"CompTIA A+", code:"Core 1 + Core 2", vendor:"CompTIA", verdict:"OPTIONAL",
    tracks:["itsupport"], hands:"Two exams, multiple choice plus performance-based",
    why:"Useful for help-desk and field-support roles. You've already studied the material; take it only if a specific job asks for it." },
  // ---------- Core ----------
  { id:"rhcsa", stage:"Core", name:"Red Hat RHCSA", code:"EX200", vendor:"Red Hat", verdict:"STRONG YES (when Linux is solid)",
    tracks:["linux"], hands:"100% hands-on: you configure real systems against a task list",
    why:"Linux is your real gap and it blocks everything from Docker up. RHCSA is performance-based, so it proves you can actually do it — employers rate it above multiple-choice Linux certs. Gentler starts: LPI Linux Essentials or CompTIA Linux+." },
  { id:"saa", stage:"Core", name:"AWS Solutions Architect – Associate", code:"SAA-C03", vendor:"AWS", verdict:"YES",
    tracks:["aws"], hands:"Multiple choice / multiple response, 130 minutes",
    why:"The most requested cloud certification. Your plan: skip Cloud Practitioner and go straight here, with Project 2 (a full VPC in Terraform) as proof." },
  { id:"ccnaauto", stage:"Core", name:"Cisco CCNA Automation (was DevNet Associate)", code:"200-901 CCNAAUTO", vendor:"Cisco", verdict:"CHEAP YES",
    tracks:["python","ccna"], hands:"Multiple choice and simulations, 120 minutes",
    why:"Sits exactly on your crossover: Python, APIs, network automation. Renamed from DevNet Associate in Feb 2026 — same exam content, new name; existing DevNet holders were moved across automatically." },
  // ---------- Platform ----------
  { id:"cka", stage:"Platform", name:"Certified Kubernetes Administrator", code:"CKA", vendor:"CNCF / Linux Foundation", verdict:"YES at step 9",
    tracks:["k8s","docker"], hands:"Hands-on in live clusters, 2 hours, heavy on troubleshooting",
    why:"The platform-engineering credential that carries weight because it's practical. Take it after Docker, Terraform and CI/CD so it makes sense. KCNA is the entry version; CKS (security) comes after." },
  { id:"terraform", stage:"Platform", name:"HashiCorp Terraform Associate", code:"Terraform Associate", vendor:"HashiCorp", verdict:"SKILL, NOT CERT",
    tracks:["terraform"], hands:"Multiple choice, about 1 hour",
    why:"Your plan says show the code instead — modules, remote state and plan-in-PR in a public repo beat the badge. It's cheap, so take it only if a job advert asks for it." },
  { id:"sap", stage:"Advanced", name:"AWS Solutions Architect – Professional", code:"SAP-C02", vendor:"AWS", verdict:"YES after step 11",
    tracks:["aws","sre","terraform"], hands:"Long scenario-based multiple choice",
    why:"One associate then a professional beats collecting associates. This is where AWS depth now lives, especially with Advanced Networking Specialty gone." },
  { id:"ans", stage:"Advanced", name:"AWS Advanced Networking – Specialty", code:"ANS-C01", vendor:"AWS", verdict:"RETIRED — learn it, don't plan the exam",
    tracks:["aws"], retired:true, hands:"—",
    why:"AWS is retiring it with no replacement (sources give 25 Aug or 31 Dec 2026 as the last exam date). The knowledge — Transit Gateway, Direct Connect + BGP, PrivateLink, hybrid DNS — still matters for cloud network roles, so Ladder Lab will still teach it." },
  { id:"ccnp", stage:"Advanced", name:"Cisco CCNP Enterprise", code:"ENCOR 350-401 + one concentration", vendor:"Cisco", verdict:"LATER — if your job goes deep network",
    tracks:["ccna"], hands:"Core exam + concentration exam",
    why:"Mastery-level enterprise networking. Worth it if your role leans network engineering or network architecture; otherwise SAP + CKA serve the cloud/platform path better." },
  { id:"aip", stage:"AI & security", name:"AWS Certified AI Practitioner", code:"AIF-C01", vendor:"AWS", verdict:"OPTIONAL, QUICK",
    tracks:[], hands:"Multiple choice, 90 minutes",
    why:"Shows you understand AI/ML services and generative AI on AWS — useful for the AI-infrastructure direction in step 12. Ladder Lab's AI course is planned." },
  { id:"cks", stage:"AI & security", name:"Certified Kubernetes Security Specialist", code:"CKS", vendor:"CNCF / Linux Foundation", verdict:"AFTER CKA",
    tracks:["k8s"], hands:"Hands-on, requires an active CKA",
    why:"Security for clusters and supply chains — a strong add for platform/SRE roles once CKA is done." },
];
LL.certStages = ["Foundations","Core","Platform","Advanced","AI & security"];
})();
