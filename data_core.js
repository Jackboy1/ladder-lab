// Ladder Lab — core registry. Other data files push into these.
window.LL = {
  tracks: [],          // {id, phase, title, tag, hours, blurb, lessons:[{t,html}], quiz:[{q,o,a,why}], cards:[{f,b}], labs:[labId], codelabs:[{id,t,brief,starter,checks:[{re,hint}],model}]}
  labs: {},            // id -> {env:'linux'|'ios'|'k8s'|'git', title, scenario, objectives:[{text, done(st)}], points}
  benches: {},         // id -> hands-on bench config (bench.js); registered by K.bench({id, ...}) inside lessons
  tickets: [],
  interview: [],
  phases: [
    { id: 0, name: "Phase 0 · Foundations refresh", note: "What you already studied — kept sharp so it never fades." },
    { id: 1, name: "Phase 1 · Core (steps 1–5 of the Ladder)", note: "Linux, Git, AWS, Python. These carry most of the employability gain." },
    { id: 2, name: "Phase 2 · Platform (steps 6–11)", note: "Docker → Terraform → CI/CD → Kubernetes → Observability → GitOps." },
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
