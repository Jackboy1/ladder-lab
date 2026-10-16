// Ladder Lab — core registry. Other data files push into these.
window.LL = {
  tracks: [],          // {id, phase, title, tag, hours, blurb, lessons:[{t,html}], quiz:[{q,o,a,why}], cards:[{f,b}], labs:[labId], codelabs:[{id,t,brief,starter,checks:[{re,hint}],model}]}
  labs: {},            // id -> {env:'linux'|'ios'|'k8s'|'git', title, scenario, objectives:[{text, done(st)}], points}
  benches: {},         // id -> hands-on bench config (bench.js); registered by K.bench({id, ...}) inside lessons
  tickets: [],
  interview: [],
  phases: [
    { id: 0, name: "Phase 0 · Foundations refresh", note: "What you already studied — kept sharp so it never fades." },
    { id: 1, name: "Phase 1 · Core", note: "Git, Linux, AWS, Python — then web & APIs, cloud networking, security and databases. These carry most of the employability gain." },
    { id: 2, name: "Phase 2 · Platform", note: "Docker → Terraform → CI/CD → Kubernetes → Observability → GitOps → DevSecOps." },
    { id: 3, name: "Phase 3 · Builder & AI", note: "Full-stack web development, then AI and machine learning." },
  ],
  // courses on the agreed roadmap that aren't built yet — shown as "coming soon" in their place (see ROADMAP.md)
  planned: [
    { phase: 1, title: "Web & API engineering", blurb: "How the web really works (HTTP, status codes, headers, the request lifecycle), web security from authentication to the OWASP Top 10, caching and CDNs, and API design — REST, webhooks, rate limits, idempotency." },
    { phase: 1, title: "Cloud networking & BGP", blurb: "BGP from zero, hybrid VPN and Direct Connect, VPC design, Transit Gateway, hybrid DNS and load balancers — the core of the cloud network architect role." },
    { phase: 1, title: "Security for network & cloud engineers", blurb: "Firewalls and zones, hands-on IPsec VPNs, TLS and certificates, cloud IAM and least privilege, zero trust, logging and alerting." },
    { phase: 1, title: "Databases & SQL", blurb: "SQL from SELECT to joins and indexes, transactions, ORMs and the N+1 trap, migrations, replication, backups — on PostgreSQL and AWS." },
    { phase: 2, title: "DevSecOps", blurb: "Pipeline and supply-chain security, secrets, image scanning and policy as code." },
    { phase: 3, title: "Full-stack web development", blurb: "HTML/CSS/JS, a backend API, auth and deployment — plus performance (Core Web Vitals) and frontend architecture (CSR/SSR/SSG)." },
    { phase: 3, title: "AI, ML & generative AI", blurb: "ML fundamentals, LLMs, prompting, RAG and AI on AWS." },
  ],
  ranks: [
    { points: 0,    title: "First Line Support" },
    { points: 300,  title: "IT Support Foundations" },
    { points: 800,  title: "Help Desk Technician" },
    { points: 1500, title: "NOC Analyst" },
    { points: 2600, title: "Network Engineer" },
    { points: 4000, title: "Cloud Engineer" },
    { points: 6000, title: "DevOps Engineer" },
    { points: 8500, title: "Platform Engineer" },
    { points: 12000,title: "Cloud Network Architect" },
  ],
  badges: [
    { id:"first-lesson", name:"Page One",        desc:"Complete your first lesson." },
    { id:"first-quiz",   name:"Pass Mark",       desc:"Pass your first quiz (70%+)." },
    { id:"first-lab",    name:"Terminal Tamer",  desc:"Complete your first hands-on lab." },
    { id:"five-tickets", name:"Ticket Closer",   desc:"Resolve 5 tickets." },
    { id:"mock-5",       name:"Interview Ready", desc:"Finish 5 mock interview sessions." },
    { id:"streak-7",     name:"7-Day Streak",    desc:"Practise 7 days in a row." },
    { id:"track-done",   name:"Certified",       desc:"Earn your first track certificate." },
    { id:"cards-100",    name:"Recall Machine",  desc:"Review 100 flashcards." },
  ],
  points: { lesson: 10, quiz: 25, lab: 50, codelab: 35, ticket: 30, mock: 20, cardsession: 5 },
};
