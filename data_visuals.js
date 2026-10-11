// Visual diagrams (inline SVG, theme-aware) injected into key lessons + curated video/deep-dive resources per track
(function(){
const S = {
  box:(x,y,w,h,label,sub,accent)=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="var(--panel2)" stroke="${accent?"var(--accent)":"var(--line)"}" stroke-width="1.4"/><text x="${x+w/2}" y="${y+(sub?h/2-4:h/2+4)}" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--display)">${label}</text>${sub?`<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${sub}</text>`:""}</g>`,
  arrow:(x1,y1,x2,y2,label)=>`<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#llarr)"/>${label?`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-6}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${label}</text>`:""}</g>`,
  txt:(x,y,t,opts)=>`<text x="${x}" y="${y}" fill="var(--${(opts&&opts.c)||"muted"})" font-size="${(opts&&opts.s)||11}" ${opts&&opts.mid?'text-anchor="middle"':""} font-family="var(--mono)">${t}</text>`,
  wrap:(vb,inner,caption)=>`<figure style="margin:14px 0"><svg viewBox="${vb}" style="max-width:100%;display:block" role="img"><defs><marker id="llarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>${inner}</svg><figcaption class="small muted" style="margin-top:4px">${caption}</figcaption></figure>`,
};

/* 1 — Encapsulation stack (CCNA lesson 1) */
const encap = S.wrap("0 0 680 230",
  S.box(250,10,180,34,"Data","HTTP, DNS, SSH payload")+
  S.arrow(340,44,340,58)+
  S.box(190,58,300,34,"TCP header | Data","= SEGMENT · L4 · ports")+
  S.arrow(340,92,340,106)+
  S.box(130,106,420,34,"IP header | Segment","= PACKET · L3 · IPs stay end-to-end")+
  S.arrow(340,140,340,154)+
  S.box(70,154,540,34,"Eth header | Packet | FCS trailer","= FRAME · L2 · MACs rewritten every hop")+
  S.txt(340,215,"bits on the wire (L1) →",{mid:1}),
  "Encapsulation: each layer wraps the one above. De-encapsulation unwraps in reverse at the receiver.");

/* 2 — Switch learning / forwarding (CCNA lesson 2) */
const swlearn = S.wrap("0 0 680 250",
  S.box(270,20,140,46,"SWITCH","MAC table (CAM)",1)+
  S.box(40,160,120,40,"PC-A","MAC A · Gi0/1")+
  S.box(280,160,120,40,"PC-B","MAC B · Gi0/2")+
  S.box(520,160,120,40,"PC-C","MAC C · Gi0/3")+
  S.arrow(100,160,300,66,"1. frame in: src A → learn 'A=Gi0/1'")+
  S.arrow(355,66,340,160,"2a. dest B known → ONE port")+
  S.arrow(395,66,575,160,"2b. dest unknown / broadcast → FLOOD")+
  S.txt(340,236,"Learn from sources · forward known unicast · flood unknown + broadcast",{mid:1}),
  "The whole switching algorithm. Replies teach the table; entries age out (~5 min).");

/* 3 — VLANs, trunk, SVIs (CCNA lesson 5) */
const vlansvg = S.wrap("0 0 680 250",
  S.box(60,20,250,60,"SW-Access","VLAN10 ports · VLAN20 ports")+
  S.box(400,20,230,60,"L3 Switch","SVI 10: .10.1 · SVI 20: .20.1",1)+
  S.arrow(310,50,400,50,"802.1Q TRUNK (tags 10,20)")+
  S.box(40,170,120,40,"Finance PC","VLAN 10 · gw .10.1")+
  S.box(200,170,120,40,"Eng PC","VLAN 20 · gw .20.1")+
  S.arrow(100,170,140,80)+
  S.arrow(260,170,220,80)+
  S.box(480,170,120,40,"ip routing","routes 10↔20 in hardware")+
  S.arrow(515,80,530,170)+
  S.txt(340,236,"Frames cross VLANs only through a router/SVI — never at layer 2",{mid:1}),
  "Inter-VLAN routing with SVIs: the modern replacement for router-on-a-stick.");

/* 4 — Elastic web tier (AWS lesson 3) */
const awsscale = S.wrap("0 0 680 260",
  S.box(20,20,110,40,"Users","global")+
  S.arrow(130,40,180,40)+
  S.box(180,20,130,40,"CloudFront","caches ~80% static")+
  S.arrow(310,40,360,40)+
  S.box(360,20,110,40,"ALB","3 AZs · TLS",1)+
  S.arrow(415,60,415,92)+
  `<rect x="200" y="92" width="430" height="110" rx="8" fill="none" stroke="var(--accent)" stroke-dasharray="5 4"/>`+
  S.txt(215,110,"Auto Scaling Group · min 6 → max 60 · target-tracking",{c:"accent",s:11})+
  S.box(220,122,110,50,"EC2 ×n","AZ-a · stateless")+
  S.box(350,122,110,50,"EC2 ×n","AZ-b · stateless")+
  S.box(480,122,110,50,"EC2 ×n","AZ-c · stateless")+
  S.arrow(300,202,300,222)+S.arrow(470,202,470,222)+
  S.box(230,222,160,34,"ElastiCache","sessions + hot cache")+
  S.box(420,222,170,34,"SQS → workers","absorbs slow payments")+
  S.txt(100,130,"S3 (assets)",{})+S.arrow(245,56,150,120)+
  "",
  "The promo-day trio: CDN offloads static, ALB spreads, ASG breathes — stateless instances + external sessions make scale-in safe.");

/* 5 — Kubernetes architecture (K8s lesson 1) */
const k8sarch = S.wrap("0 0 680 260",
  `<rect x="20" y="20" width="300" height="220" rx="10" fill="none" stroke="var(--line)"/>`+
  S.txt(35,40,"CONTROL PLANE (managed on EKS)",{s:10.5})+
  S.box(40,52,120,38,"API server","the front door",1)+
  S.box(180,52,120,38,"etcd","desired + actual state")+
  S.box(40,104,120,38,"Scheduler","places new Pods")+
  S.box(180,104,120,38,"Controllers","reconcile loops")+
  S.txt(45,170,"desired ≠ actual → act",{c:"accent"})+
  `<rect x="360" y="20" width="300" height="220" rx="10" fill="none" stroke="var(--line)"/>`+
  S.txt(375,40,"WORKER NODES",{s:10.5})+
  S.box(380,52,120,38,"kubelet","runs containers")+
  S.box(520,52,120,38,"kube-proxy/CNI","service + pod network")+
  S.box(380,110,120,46,"Pod · Pod","api ×2")+
  S.box(520,110,120,46,"Pod · Pod","worker ×2")+
  S.arrow(320,70,360,70,"watch/apply")+
  S.arrow(100,142,100,170)+
  S.txt(340,250,"kubectl → API server → etcd; controllers close the gap forever (reconciliation)",{mid:1,s:10.5}),
  "One idea underneath everything: declare desired state; controllers reconcile reality to it.");

/* 6 — The three Linux streams & a pipeline (Linux text-tools lesson) */
const pipesvg = S.wrap("0 0 680 150",
  S.box(20,50,120,44,"grep Failed","auth.log → lines")+
  S.arrow(140,72,180,72,"stdout→stdin")+
  S.box(180,50,130,44,"awk '{print $11}'","keep the IP column")+
  S.arrow(310,72,350,72)+
  S.box(350,50,80,44,"sort","group dups")+
  S.arrow(430,72,462,72)+
  S.box(462,50,90,44,"uniq -c","count runs")+
  S.arrow(552,72,584,72)+
  S.box(584,50,80,44,"sort -rn","rank",1)+
  S.txt(340,130,"extract → sort → count → rank: the most reused one-liner in operations",{mid:1}),
  "Pipes connect stdout to stdin. Each tool does one thing; the chain does analysis.");

const inject = [
  ["ccna",0,encap], ["ccna",1,swlearn], ["ccna",4,vlansvg],
  ["aws",2,awsscale], ["k8s",0,k8sarch], ["linux",3,pipesvg],
];
for (const [tid,li,svg] of inject){
  const t = LL.tracks.find(x=>x.id===tid);
  if (t && t.lessons[li]) t.lessons[li].html = svg + t.lessons[li].html;
}

/* -------- curated watch/practice resources per track (open in a new tab) -------- */
const V = {
  itsupport:[
    {t:"Professor Messer — free CompTIA A+ video course", u:"https://www.professormesser.com/free-a-plus-training/"},
  ],
  ccna:[
    {t:"Jeremy's IT Lab — full free CCNA course (the one you took; rewatch per topic)", u:"https://www.youtube.com/c/JeremysITLab"},
    {t:"Cisco Packet Tracer — free full network simulator for bigger topologies", u:"https://www.netacad.com/courses/packet-tracer"},
    {t:"Subnetting practice generator", u:"https://subnettingpractice.com/"},
  ],
  linux:[
    {t:"OverTheWire: Bandit — the Linux command-line game (do levels 0–20)", u:"https://overthewire.org/wargames/bandit/"},
    {t:"Linux Journey — free structured reading", u:"https://linuxjourney.com/"},
    {t:"Sadservers — real broken servers to fix in the browser", u:"https://sadservers.com/"},
  ],
  git:[
    {t:"Learn Git Branching — visual interactive playground", u:"https://learngitbranching.js.org/"},
    {t:"Pro Git book (free) — chapters 1–3", u:"https://git-scm.com/book/en/v2"},
  ],
  python:[
    {t:"Kirk Byers — free Python for Network Engineers email course", u:"https://pynet.twb-tech.com/"},
    {t:"Cisco DevNet Sandboxes — free real IOS XE devices to automate", u:"https://developer.cisco.com/site/sandbox/"},
    {t:"Exercism Python track — free drills with mentoring", u:"https://exercism.org/tracks/python"},
  ],
  aws:[
    {t:"AWS Skill Builder — free official courses + labs", u:"https://skillbuilder.aws/"},
    {t:"Tutorials Dojo cheat sheets (SAA)", u:"https://tutorialsdojo.com/aws-cheat-sheets/"},
    {t:"AWS Free Tier — build Project 2 for real", u:"https://aws.amazon.com/free/"},
  ],
  docker:[
    {t:"TechWorld with Nana — Docker full tutorial", u:"https://www.youtube.com/results?search_query=techworld+with+nana+docker+tutorial+full"},
    {t:"Play with Docker — free browser playground", u:"https://labs.play-with-docker.com/"},
  ],
  terraform:[
    {t:"HashiCorp official tutorials (free, excellent)", u:"https://developer.hashicorp.com/terraform/tutorials"},
  ],
  cicd:[
    {t:"GitHub Actions docs — quickstart", u:"https://docs.github.com/en/actions/quickstart"},
    {t:"GitHub Skills — free interactive courses", u:"https://skills.github.com/"},
  ],
  k8s:[
    {t:"Killercoda — free Kubernetes scenario labs (CKA-style)", u:"https://killercoda.com/"},
    {t:"TechWorld with Nana — Kubernetes full course", u:"https://www.youtube.com/results?search_query=techworld+with+nana+kubernetes+full+course"},
    {t:"Play with Kubernetes", u:"https://labs.play-with-k8s.com/"},
  ],
  sre:[
    {t:"Google SRE books — free online", u:"https://sre.google/books/"},
    {t:"Prometheus getting-started", u:"https://prometheus.io/docs/prometheus/latest/getting_started/"},
    {t:"ArgoCD getting-started", u:"https://argo-cd.readthedocs.io/en/stable/getting_started/"},
  ],
};
for (const [tid,list] of Object.entries(V)){
  const t = LL.tracks.find(x=>x.id===tid);
  if (t) t.videos = list;
}
})();
