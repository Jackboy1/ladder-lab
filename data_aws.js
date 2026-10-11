// Phase 1 — AWS Solutions Architect (Ladder step 4) — Maarek SAA coverage + real-world scaling scenarios
(function(){

LL.tracks.push({
  id:"aws", phase:1, title:"AWS Solutions Architect", tag:"Ladder step 4 · SAA", hours:"16–22h",
  blurb:"The Maarek SAA arc rebuilt — IAM, EC2, ELB/ASG, S3, VPC, Route 53/CloudFront, SQS/SNS/Lambda, databases — each with the 'how companies actually run this' scenario, ending in a full Black-Friday-scale architecture.",
  lessons:[
  {t:"IAM & the global picture: accounts, regions, shared responsibility", html:`
<h3>The lay of the land</h3>
<p><b>Regions</b> (e.g. eu-west-2 London, af-south-1 Cape Town) are clusters of <b>Availability Zones</b> — physically separate data centres with independent power/network, linked by fast fibre. The core design rule of the whole exam: <b>an app that matters runs in at least two AZs</b>, because AZs fail. <b>Edge locations</b> (400+) are CloudFront's cache points — closer to users than any region.</p>
<p><b>Shared responsibility</b>: AWS secures the cloud (hardware, facilities, hypervisor); you secure what's <i>in</i> it (your data, IAM, OS patching on EC2, security groups, encryption choices). Exam phrasing: “who patches the EC2 guest OS?” — you. “Who patches Lambda's runtime hosts?” — AWS.</p>
<h3>IAM — identity is the real perimeter</h3>
<ul>
<li><b>Users</b> = people/long-lived credentials (console password, access keys). <b>Groups</b> = attach policies to many users at once. <b>Roles</b> = identities <i>assumed temporarily</i> — by EC2 instances, Lambda functions, or humans federating in. No permanent keys.</li>
<li><b>Policies</b> are JSON: Effect (Allow/Deny), Action (<code>s3:GetObject</code>), Resource (ARN), optional Condition. An explicit <b>Deny always wins</b>; everything is denied until allowed.</li>
</ul>
<pre><code>{ "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::coscharis-reports/*",
    "Condition": {"IpAddress": {"aws:SourceIp": "41.58.0.0/16"}}
}]}</code></pre>
<h3>The pattern that appears in every scenario: IAM Roles for EC2</h3>
<p>An app on EC2 needs S3. Wrong answer: paste access keys into the instance (they leak — scraped from AMIs, GitHub, instance metadata). Right answer: attach an <b>instance profile role</b>; the app gets auto-rotated temporary credentials from the metadata service, and the SDK picks them up with zero code. <b>Any exam option that stores long-lived keys on an instance is wrong.</b></p>
<h3>Hygiene companies enforce</h3>
<ul>
<li>Root account: MFA, no access keys, used only for the tasks that require it.</li>
<li>Least privilege; permissions boundaries for delegated admins; IAM Access Analyzer to spot over-broad access.</li>
<li>Humans federate via <b>IAM Identity Center</b> (SSO from AD/Entra) — your Active Directory knowledge maps straight onto this.</li>
<li>CloudTrail logs every API call (who did what, when, from where) — the audit trail for incidents.</li>
</ul>
<div class="callout"><b>Scenario:</b> “A fintech's auditor asks how a leaked developer laptop couldn't access prod S3.” Answer shape: no long-lived keys (Identity Center short sessions + MFA), roles with least privilege, SCP guardrails at the Organizations level, CloudTrail evidencing all of it.</div>`},

  {t:"EC2 deep dive: instances, EBS/EFS, ENI, placement groups, snapshots", html:`
<h3>Instances & buying them like a company does</h3>
<p>Families: general (t3/m7), compute-opt (c7), memory-opt (r7/x2), storage-opt (i4). Pricing is an architecture decision:</p>
<div class="tablewrap"><table>
<tr><th>Option</th><th>Discount</th><th>Use when</th></tr>
<tr><td>On-Demand</td><td>—</td><td>Spiky/unknown, short-lived</td></tr>
<tr><td>Reserved / Savings Plans (1–3 yr)</td><td>~40–72%</td><td>The steady 24/7 baseline</td></tr>
<tr><td>Spot</td><td>up to 90%</td><td>Interruptible work: batch, CI, rendering — can be reclaimed with a 2-min warning</td></tr>
</table></div>
<p>Real companies blend: Reserved for the floor, On-Demand for daily waves, Spot for batch. (Netflix famously runs huge encode farms on Spot.)</p>
<h3>Storage attached to EC2</h3>
<ul>
<li><b>Instance store</b>: physically on the host — fastest, but <i>gone</i> when the instance stops. Caches/scratch only.</li>
<li><b>EBS</b>: network block storage, persists independently; one instance at a time (io2 adds Multi-Attach), locked to its AZ. Types: gp3 (general SSD — set IOPS/throughput independently of size), io2 (provisioned IOPS for databases), st1/sc1 (cheap HDD throughput). Moving an EBS volume across AZs = snapshot → create volume in target AZ.</li>
<li><b>Snapshots</b>: incremental copies to S3; the basis of backups, AMIs (golden images), and cross-region DR.</li>
<li><b>EFS</b>: NFS file system mounted by <i>many</i> instances across AZs simultaneously — shared content, home dirs. Linux only. <b>FSx</b> fills the gaps: FSx for Windows (SMB + AD integration — note for a Coscharis Windows estate) and FSx for Lustre (HPC speed).</li>
</ul>
<p>Exam separator: block for one instance → EBS; shared POSIX across many → EFS; Windows shares → FSx-W; “hundreds of GB/s for ML training” → FSx Lustre.</p>
<h3>Networking bits</h3>
<ul>
<li><b>ENI</b> — elastic network interface: the virtual NIC holding private IP(s), MAC, security groups. Detachable → movable: a licensing/failover trick is floating an ENI to a standby instance.</li>
<li><b>Security groups</b>: stateful instance firewalls, allow-rules only, reference other SGs (“app SG allows 3306 from web SG” — tiering without IP lists).</li>
</ul>
<h3>Placement groups</h3>
<ul>
<li><b>Cluster</b>: same rack-ish, lowest latency/highest throughput — HPC, tightly-coupled nodes. One AZ; one hardware failure can hit all.</li>
<li><b>Spread</b>: each instance on distinct hardware (max 7/AZ) — a handful of critical boxes that must not die together.</li>
<li><b>Partition</b>: groups on separate racks, partitions visible to the app — Kafka/Hadoop/Cassandra style.</li>
</ul>
<h3>Metadata & user data</h3>
<p><code>http://169.254.169.254/latest/meta-data/</code> (recognise that APIPA-range IP!) serves instance identity + the role's temp credentials — use IMDSv2 (session tokens) to blunt SSRF attacks. <b>User data</b> = boot script (install agent, join config management) — how golden AMIs finish themselves.</p>`},

  {t:"Scaling the web tier: ELB types, target groups, ASG policies", html:`
<h3>Why this lesson is the heart of SAA</h3>
<p>“How does a company survive 50× traffic without 50× cost?” The answer is always the same trio: a <b>load balancer</b> spreading requests, an <b>Auto Scaling Group</b> changing the fleet size, and <b>stateless instances</b> so any server can take any request.</p>
<h3>The load balancers</h3>
<div class="tablewrap"><table>
<tr><th>Type</th><th>Layer</th><th>Routes on</th><th>Reach for it when</th></tr>
<tr><td><b>ALB</b></td><td>7 (HTTP/S)</td><td>Path (/api/*), host, headers, query</td><td>Web apps, microservices, containers (dynamic ports)</td></tr>
<tr><td><b>NLB</b></td><td>4 (TCP/UDP/TLS)</td><td>Flows</td><td>Millions of req/s, static IPs per AZ, non-HTTP protocols, source-IP preservation</td></tr>
<tr><td><b>GWLB</b></td><td>3 (GENEVE)</td><td>All packets</td><td>Inserting firewall/IDS appliance fleets transparently in the path</td></tr>
</table></div>
<p><b>Target groups</b> hold the backends (instances, IPs, Lambdas) plus the <b>health check</b> (e.g. GET /health expecting 200). Unhealthy targets stop receiving traffic — the mechanism behind “self-healing”.</p>
<ul>
<li><b>Sticky sessions</b>: a cookie pins a user to one instance. It papers over state kept in memory — and breaks scale-in (sessions die with the instance). Professional fix: externalise sessions to ElastiCache/DynamoDB, keep instances stateless, turn stickiness off.</li>
<li><b>Cross-zone LB</b>: distribute evenly across all targets regardless of AZ (ALB: on by default; NLB: optional, inter-AZ data fees apply).</li>
<li><b>TLS</b>: certificates from <b>ACM</b> (free, auto-renewing) attach to the listener; <b>SNI</b> lets one ALB serve many certificates/domains. Usual pattern: terminate TLS at the ALB, HTTP inside the VPC (or re-encrypt for compliance).</li>
<li>Connection draining (deregistration delay) lets in-flight requests finish before an instance is removed.</li>
</ul>
<h3>Auto Scaling Groups</h3>
<p>You give an ASG a <b>launch template</b> (AMI, type, user data, SG, role), min/max/desired, and subnets across AZs. It keeps desired count alive (replaces failed instances) and moves desired between min and max by policy:</p>
<ul>
<li><b>Target tracking</b> — the one to default to: “keep average CPU at 50%” or “keep ALB RequestCountPerTarget at 1000”. AWS does the math both directions.</li>
<li><b>Step scaling</b>: CloudWatch alarm thresholds add/remove N instances per band.</li>
<li><b>Scheduled</b>: known rhythms — scale to 40 at 08:45 before Lagos logs on, down to 6 at 22:00.</li>
<li><b>Predictive</b>: ML on history forecasts the wave and scales ahead of it.</li>
</ul>
<p>Scale-out is fast; <b>instance warm-up / cooldown</b> stops double-firing while new capacity boots. Scale-in picks oldest-launch-config first; termination happens AZ-balanced. Lifecycle hooks pause instances entering/leaving for setup/log-drain.</p>
<div class="callout"><b>Scenario — flash sale, 09:00 announcement, traffic 12× by 09:05:</b> ALB in 3 AZs → ASG (min 6, max 60) on target-tracking RequestCountPerTarget + a scheduled action at 08:30 pre-warming to 20 → sessions in ElastiCache so scale-in hurts nobody → static assets already offloaded to S3+CloudFront so the fleet only serves the dynamic 20%. That one sentence is about four exam questions and one real interview answer.</div>`},

  {t:"S3 mastery: classes, lifecycle, replication, encryption, events, static sites", html:`
<h3>What S3 is</h3>
<p>Object storage: buckets (globally unique names) hold objects (up to 5 TB) under keys. 11 nines durability (data spread across ≥3 AZs), virtually infinite scale, pay per GB + requests. It is not a filesystem — no appends; you overwrite whole objects.</p>
<h3>Storage classes & lifecycle — where the money is</h3>
<div class="tablewrap"><table>
<tr><th>Class</th><th>For</th><th>Catch</th></tr>
<tr><td>Standard</td><td>Hot data</td><td>Priciest storage</td></tr>
<tr><td><b>Intelligent-Tiering</b></td><td>Unknown/shifting access</td><td>Small monitoring fee; auto-moves tiers — the safe default</td></tr>
<tr><td>Standard-IA / One Zone-IA</td><td>Monthly-ish access / re-creatable data</td><td>Retrieval fee, 30-day min; One-Zone dies with its AZ</td></tr>
<tr><td>Glacier Instant / Flexible / Deep Archive</td><td>Archives & compliance</td><td>ms / minutes–hours / up to 12h retrieval; 90/180-day minimums</td></tr>
</table></div>
<pre><code>Lifecycle rule (logs/):  Standard → IA after 30d → Glacier Flexible after 90d → delete after 7y
Plus: AbortIncompleteMultipartUpload after 7d  (invisible money leak otherwise)</code></pre>
<h3>Protecting objects</h3>
<ul>
<li><b>Versioning</b>: overwrites/deletes become new versions; a delete just adds a delete marker — your undo button. Required for replication.</li>
<li><b>Replication</b>: CRR (cross-region — DR, latency, sovereignty) or SRR (same-region — log aggregation, prod→test copies). New objects only unless you run Batch Replication.</li>
<li><b>Encryption</b>: SSE-S3 (AWS keys, on by default) · <b>SSE-KMS</b> (your KMS key: audit trail of every decrypt, key policies, the compliance answer) · SSE-C (you ship the key per request) · client-side. In transit: HTTPS, enforceable via bucket policy condition <code>aws:SecureTransport</code>.</li>
<li><b>Access</b>: Block Public Access stays ON; share via bucket policies, <b>presigned URLs</b> (time-limited links your app signs — how download features are built), or CloudFront + Origin Access Control so the bucket is never public even for a public site. Object Lock (WORM) for regulators.</li>
</ul>
<h3>Event-driven S3 — the thumbnail pipeline from the course</h3>
<pre><code>User uploads photo → s3:ObjectCreated event → (optionally via SQS) → Lambda
→ resizes → writes thumbnail to a SECOND bucket → DynamoDB metadata row</code></pre>
<p>Second bucket matters: writing back to the source bucket re-triggers the event — infinite loop, infinite bill. Events can also fan out via SNS/EventBridge.</p>
<h3>The rest of the toolbox</h3>
<ul>
<li><b>Static website hosting</b>: S3 serves HTML/CSS/JS; CloudFront in front gives HTTPS + caching — the standard way companies host frontends for cents.</li>
<li><b>CORS</b>: browser-enforced — if app.coscharis.com fetches from the API/bucket on another origin, that origin must return Access-Control-Allow-Origin headers. “Browser console shows CORS error” → fix the bucket/API CORS config.</li>
<li><b>Performance</b>: multipart upload (&gt;100 MB), Transfer Acceleration (upload via nearest edge), byte-range fetches.</li>
<li><b>Snow family</b>: Snowcone/Snowball Edge/Snowmobile — trucks beat the internet for 10s of TB+ or disconnected sites (an oil-rig/mine scenario; relevant to Nigerian energy clients).</li>
<li><b>S3 Select</b>/Athena: query data where it lies instead of downloading it.</li>
</ul>`},

  {t:"VPC networking — your CCNA superpower, cloud edition", html:`
<p>A <b>VPC</b> is your private network in a region: you pick the CIDR (e.g. 10.0.0.0/16) and carve <b>subnets</b>, each living in exactly one AZ. Everything you know about subnetting applies — AWS just reserves 5 IPs per subnet (first 4 + last).</p>
<h3>The standard 3-AZ layout every company draws</h3>
<pre><code>VPC 10.0.0.0/16
├─ Public  subnets  10.0.1.0/24 (AZ-a)  10.0.2.0/24 (AZ-b)  10.0.3.0/24 (AZ-c)   ← ALB, NAT
├─ Private app      10.0.11.0/24        10.0.12.0/24        10.0.13.0/24          ← EC2/ECS
└─ Private data     10.0.21.0/24        10.0.22.0/24        10.0.23.0/24          ← RDS, ElastiCache</code></pre>
<ul>
<li><b>Internet Gateway (IGW)</b>: the VPC's door to the internet. A subnet is “public” because its <b>route table</b> has 0.0.0.0/0 → IGW (and instances have public IPs).</li>
<li><b>NAT Gateway</b>: lets <i>private</i> subnets reach out (updates, APIs) while nothing can reach in. Lives in a public subnet; deploy one per AZ or an AZ failure cuts the others' egress. Managed, scales, billed per hour + per GB.</li>
<li><b>Route tables</b> = your routing fundamentals: longest prefix match, local route for the VPC CIDR always present.</li>
</ul>
<h3>Two firewalls, one exam favourite</h3>
<div class="tablewrap"><table>
<tr><th></th><th>Security Group</th><th>Network ACL</th></tr>
<tr><td>Attaches to</td><td>ENI/instance</td><td>Subnet</td></tr>
<tr><td>State</td><td><b>Stateful</b> — replies auto-allowed</td><td><b>Stateless</b> — must allow return traffic (ephemeral ports!)</td></tr>
<tr><td>Rules</td><td>Allow only</td><td>Allow + Deny, numbered, first match</td></tr>
<tr><td>Use</td><td>Primary control, SG-references for tiering</td><td>Coarse subnet guardrails, explicit blocks</td></tr>
</table></div>
<h3>Connecting worlds</h3>
<ul>
<li><b>VPC Peering</b>: 1:1, non-transitive (A–B and B–C ≠ A–C), no overlapping CIDRs — fine for a few VPCs, a mesh nightmare at 20.</li>
<li><b>Transit Gateway</b>: the hub — thousands of VPCs + VPNs + Direct Connect attach once, route centrally. The enterprise answer (and where your routing skills become architect skills).</li>
<li><b>Site-to-Site VPN</b>: IPsec over internet from your office router/firewall — quick hybrid. <b>Direct Connect</b>: private physical circuit — consistent latency/bandwidth, runs <b>BGP</b> (your BGP study meets AWS exactly here).</li>
<li><b>VPC Endpoints</b>: reach AWS services privately, skipping the NAT. <b>Gateway endpoints</b> (S3, DynamoDB — free, a route-table entry) vs <b>Interface endpoints</b> (PrivateLink ENIs for most services, hourly+GB). “Reduce NAT charges for S3 traffic” → gateway endpoint, every time.</li>
<li><b>VPC Flow Logs</b>: NetFlow-style records per ENI/subnet/VPC → CloudWatch/S3 — your packet-level troubleshooting instinct, cloud edition.</li>
</ul>
<div class="callout"><b>Scenario:</b> “Private-subnet app suddenly can't call a third-party API after an AZ outage” → single NAT gateway sat in the dead AZ. Fix: NAT per AZ, each private route table pointing at its local NAT.</div>`},

  {t:"Global performance: Route 53, CloudFront, Global Accelerator, caching layers", html:`
<h3>Route 53 — DNS with opinions</h3>
<p>Hosted zones hold records (A/AAAA/CNAME/MX…). <b>Alias records</b> point the zone apex (coscharis.com) at AWS resources (ALB, CloudFront) — something plain CNAME can't do, and alias queries are free. TTL is your propagation lever: drop it to 60s before a migration, raise it after.</p>
<p>Routing policies — pick by scenario keyword:</p>
<div class="tablewrap"><table>
<tr><th>Policy</th><th>Chooses by</th><th>Scenario smell</th></tr>
<tr><td>Simple / Weighted</td><td>Static / percentages</td><td>Canary: 5% to the new version</td></tr>
<tr><td><b>Latency-based</b></td><td>Measured RTT to regions</td><td>“Fastest experience worldwide” — Lagos users → eu-west, São Paulo → sa-east</td></tr>
<tr><td>Failover</td><td>Health check on primary</td><td>Active-passive DR to another region/static S3 sorry-page</td></tr>
<tr><td>Geolocation / Geoproximity</td><td>Where the user IS</td><td>Content rules, data residency, shifting load with bias</td></tr>
<tr><td>Multivalue</td><td>Up to 8 healthy IPs</td><td>Poor-man's health-checked round robin</td></tr>
</table></div>
<h3>CloudFront — the CDN</h3>
<p>400+ edge locations cache your content near users. Origins: S3 (with <b>Origin Access Control</b> so only CloudFront can read the bucket), ALB, any HTTP server. Controls: TTLs/cache policies, invalidations, signed URLs/cookies (paid content), HTTPS with ACM certs (requested in us-east-1 for CloudFront), WAF attachment, Functions/Lambda@Edge for logic at the edge.</p>
<p>Why companies lean on it: in a traffic spike, maybe 80% of requests are images/CSS/JS — CloudFront absorbs those at the edge, so your fleet scales only for the dynamic 20%, and per-GB egress via CloudFront is cheaper than straight from EC2.</p>
<h3>Global Accelerator — and the exam's favourite contrast</h3>
<p>GA gives you <b>2 static anycast IPs</b>; user traffic enters the nearest edge and rides AWS's backbone to your ALB/NLB in one or more regions, with near-instant regional failover. <b>CloudFront caches HTTP content; GA accelerates the connection path for any TCP/UDP app and caches nothing.</b> Gaming/VoIP/trading, or “we need fixed IPs for customer firewall allowlists” → GA.</p>
<h3>The caching ladder (interview gold)</h3>
<pre><code>Browser cache → CloudFront (edge) → ALB → app → ElastiCache (Redis/Memcached) → database
                                              ↑ session store, hot queries, leaderboards
DynamoDB-side: DAX in front for µs reads</code></pre>
<p>Each layer that answers a request spares everything behind it. The classic outage story — “DB at 100% CPU during a promo” — is almost always a missing ElastiCache layer or a cache stampede; know write-through vs lazy-loading and TTL jitter as the fixes.</p>`},

  {t:"Decoupling & serverless: SQS, SNS, Lambda, DynamoDB, API Gateway, containers", html:`
<h3>Why decouple</h3>
<p>Synchronous chains fail together and must scale together. A queue between tiers lets the front door absorb spikes while workers drain at their own pace — orders are not lost because the resize/payment/email step was busy.</p>
<h3>SQS — the shock absorber</h3>
<ul>
<li><b>Standard</b>: unlimited throughput, at-least-once, best-effort order (design consumers idempotent). <b>FIFO</b>: exactly-once, strict order per message-group, ~3k msg/s batched.</li>
<li>Mechanics you'll be quizzed on: <b>visibility timeout</b> (message hidden while a worker processes; crash → it reappears), long polling (cheaper, fewer empty receives), <b>DLQ</b> after maxReceiveCount (poison messages quarantined, not looping), 14-day max retention.</li>
<li>Pattern: ASG on queue-depth metric (ApproximateNumberOfMessages ÷ workers) — the worker fleet breathes with the backlog.</li>
</ul>
<h3>SNS — fan-out</h3>
<p>Pub/sub: one publish → many subscribers (SQS queues, Lambda, email/SMS, HTTP). The canonical combo: <b>SNS → multiple SQS queues</b>, so ordering/analytics/fraud each get their own durable copy. EventBridge is the richer event bus (filtering, SaaS + AWS service events, schedules).</p>
<pre><code>checkout ──publish──▶ SNS topic "order-placed"
                        ├──▶ SQS fulfilment  ──▶ warehouse workers
                        ├──▶ SQS analytics   ──▶ ETL consumer
                        └──▶ SQS fraud-check ──▶ scoring Lambda
one event, three independent, durable consumers — one slow consumer never blocks the others
(direct SQS-to-SQS doesn't exist; SNS in front is HOW you fan out)</code></pre>
<h3>Lambda — code without servers</h3>
<ul>
<li>Triggers: API Gateway, S3 events, SQS, EventBridge schedules, DynamoDB streams… Pay per request + GB-ms; scales out per-event automatically.</li>
<li>Limits that decide architectures: <b>15-min max runtime</b>, memory 128MB–10GB (CPU scales with it), /tmp scratch, cold starts (mitigate: provisioned concurrency). Long/stateful work → Step Functions orchestrating many Lambdas, or containers.</li>
<li>The thumbnail service, fully serverless: S3 upload → event → Lambda resize → bucket B + DynamoDB row. Zero idle cost, infinite parallel uploads.</li>
</ul>
<h3>DynamoDB — the serverless database</h3>
<ul>
<li>Key-value/document store, single-digit-ms at any scale, multi-AZ by default. Model around the <b>partition key</b> (+ optional sort key); GSIs give alternate query paths. Hot partitions (everyone hitting one key) are the classic self-inflicted wound.</li>
<li>On-demand vs provisioned capacity (+autoscaling); <b>DAX</b> = drop-in cache for µs reads; <b>Streams</b> trigger Lambdas on changes; <b>Global Tables</b> = active-active multi-region. TTL expires items free.</li>
</ul>
<h3>API Gateway</h3>
<p>The managed front door for APIs: routes → Lambda/HTTP backends, auth (IAM, Cognito, JWT), throttling + usage plans/API keys, caching, WAF. REST vs cheaper HTTP APIs; WebSocket APIs for realtime.</p>
<h3>Containers on AWS (bridge to Phase 2)</h3>
<p><b>ECR</b> stores images. <b>ECS</b> runs them — on EC2 you manage, or <b>Fargate</b> (serverless containers: no hosts at all). <b>EKS</b> is managed Kubernetes — where your Ladder steps 6–9 land in AWS. Rule of thumb: simplest ops → Fargate; K8s skills/portability → EKS.</p>
<h3>Relational data: RDS & Aurora (gap filled)</h3>
<p><b>RDS</b> = managed MySQL/Postgres/etc: <b>Multi-AZ</b> is a synchronous standby for <i>failover</i> (not extra read capacity); <b>read replicas</b> (async) are for read scaling/reporting and can be promoted. <b>Aurora</b>: AWS-built engine, storage auto-grows across 3 AZs/6 copies, up to 15 replicas, Aurora Serverless v2 scales with load. Promo-day pattern: writes → primary; reads → replica endpoint; hot queries → ElastiCache in front anyway.</p>`},

  {t:"Putting it together: Black-Friday architecture, monitoring, DR, analytics, IaC", html:`
<h3>The scenario interviewers and the exam both love</h3>
<p><b>A Lagos e-commerce startup normally serves 2,000 users/day. A celebrity promo will bring ~800,000 in six hours. Design it.</b></p>
<pre><code>Users
 └─ Route 53 (latency + health-checked failover)
     └─ CloudFront (caches 80% static; WAF attached; S3 origin w/ OAC for assets)
         └─ ALB across 3 AZs  (TLS via ACM, /api/* → app target group)
             └─ ASG web/app tier (min 6 → max 80; target-tracking on RequestCountPerTarget;
                 scheduled pre-warm 1h before promo; stateless — sessions in ElastiCache Redis)
                 ├─ ElastiCache Redis (sessions + hot product cache)
                 ├─ SQS "orders" queue → worker ASG scaling on queue depth → payment/email
                 │        └─ DLQ for poison orders
                 ├─ Aurora MySQL (writer + 3 readers; reads via reader endpoint)
                 └─ DynamoDB (carts: key=userId; on-demand capacity; DAX optional)
Static media uploads → S3 → Lambda thumbnails → CloudFront
Everything in private subnets; NAT per AZ; gateway endpoint for S3</code></pre>
<p>Why each piece is there, in one line each: CloudFront so the fleet only sees dynamic traffic · ALB+ASG so capacity follows demand instead of guesses · stateless + Redis so scale-in is painless · SQS so checkout survives downstream slowness (orders queue up rather than 500) · Aurora readers because promo traffic is 90% reads · DynamoDB for the write-hot cart where relational would melt · pre-warm because scaling reacts in minutes and marketing emails do not.</p>
<h3>Monitoring & operations (CloudWatch, CloudTrail, Config)</h3>
<ul>
<li><b>CloudWatch</b>: metrics (1–5 min; detailed = 1 min), dashboards, <b>alarms</b> (→ SNS/Auto Scaling), <b>Logs</b> + Logs Insights queries, synthetic canaries. Know: default EC2 metrics lack memory/disk — the CloudWatch agent adds them.</li>
<li><b>CloudTrail</b>: API audit (who/what/when). <b>Config</b>: resource state history + compliance rules (“every SG with 0.0.0.0/0:22 → flag”).</li>
<li><b>Trusted Advisor</b>/Compute Optimizer: cost + rightsizing hints. Cost anomaly alerts before the bill surprises you.</li>
</ul>
<h3>Disaster recovery — the four postures (RTO/RPO ladder)</h3>
<div class="tablewrap"><table>
<tr><th>Strategy</th><th>Idea</th><th>RTO</th></tr>
<tr><td>Backup &amp; restore</td><td>Snapshots/S3 CRR; rebuild on disaster</td><td>Hours+ · cheapest</td></tr>
<tr><td>Pilot light</td><td>Data replicated live; minimal core idle in region B</td><td>Tens of minutes</td></tr>
<tr><td>Warm standby</td><td>Scaled-down full copy always running</td><td>Minutes</td></tr>
<tr><td>Multi-site active-active</td><td>Both regions serve; Route 53 splits</td><td>~Zero · priciest</td></tr>
</table></div>
<p>RPO = how much data you may lose; RTO = how long you may be down. Every DR question is “which posture matches the stated RTO/RPO and budget”.</p>
<h3>Analytics & data services (your Maarek list, placed)</h3>
<p><b>Athena</b>: SQL straight on S3 (pair with Glue catalog; partition + Parquet to cut cost) · <b>Redshift</b>: the warehouse for heavy BI joins · <b>EMR</b>: managed Spark/Hadoop clusters for big processing · <b>Kinesis/Firehose</b>: streaming ingest (Firehose → S3/Redshift with zero code) · <b>QuickSight</b>: the dashboards on top. Pipeline cliché worth memorising: app logs → Firehose → S3 → Athena → QuickSight.</p>
<h3>CloudFormation — infrastructure as code</h3>
<p>Declare the whole stack in YAML; CloudFormation creates/updates/deletes as a unit, with <b>change sets</b> to preview and rollback on failure. Same philosophy as Terraform (Ladder step 7) — declarative, repeatable, reviewable; Terraform adds multi-cloud + the workflow you'll actually use for Project 2 (“a full VPC in Terraform”).</p>
<h3>KMS & secrets (gap filled)</h3>
<p><b>KMS</b>: managed keys, envelope encryption, every use logged in CloudTrail — the answer to any “auditable encryption” phrase. <b>Secrets Manager</b> (rotation built-in, e.g. RDS passwords) vs SSM <b>Parameter Store</b> (free tier, config + secrets without rotation).</p>
<div class="callout"><b>Well-Architected pillars</b> — the exam's skeleton: Operational excellence, Security, Reliability, Performance efficiency, Cost optimization, Sustainability. When torn between answers, pick the one a pillar would pick.</div>`},
  ],
  quiz:[
  {q:"An app on EC2 needs S3 access. Best practice:", o:["Access keys in a config file","IAM user per instance","Attach an IAM role (instance profile)","Make the bucket public"], a:2, why:"Roles give auto-rotated temporary credentials via instance metadata — any stored-key option is wrong by reflex."},
  {q:"Shared responsibility: patching the OS inside an EC2 instance is…", o:["AWS's job","Yours","The AMI vendor's","Automatic"], a:1, why:"AWS secures the cloud; everything inside the instance — OS, patches, your app — is you."},
  {q:"Many Linux instances across AZs must mount the same file store:", o:["EBS Multi-Attach","Instance store","EFS","S3 via s3fs"], a:2, why:"EFS is NFS, multi-AZ, many readers/writers. EBS is block for one instance in one AZ."},
  {q:"A tightly-coupled HPC workload wants lowest inter-node latency:", o:["Spread placement","Cluster placement group","Partition group","Multi-region"], a:1, why:"Cluster packs instances close for 10-GbE+ node-to-node speed — accepting shared failure risk."},
  {q:"Microservices need routing by URL path and host header:", o:["NLB","GWLB","ALB","Classic LB"], a:2, why:"Layer-7 rules (path/host/header/query) are ALB's defining feature."},
  {q:"Sticky sessions are causing lost carts on scale-in. The architectural fix:", o:["Longer cookies","Bigger instances","Externalise session state to ElastiCache and disable stickiness","Disable scale-in"], a:2, why:"Stateless instances are what make elasticity safe; stickiness is the band-aid, not the design."},
  {q:"Traffic doubles every Monday 9am. Cheapest effective ASG addition:", o:["Raise min to peak size","Scheduled scaling action before 9am","Manual scaling","Spot only"], a:1, why:"Known rhythm → scheduled action; target tracking still handles surprises."},
  {q:"Logs must be queryable for 30 days, kept 7 years, cost-minimised:", o:["Standard forever","Lifecycle: Standard → IA/Glacier → Deep Archive","One Zone-IA only","Delete after 30 days"], a:1, why:"Lifecycle rules walk objects down the class ladder automatically."},
  {q:"S3 upload → Lambda resize wrote thumbnails back to the same bucket. Result:", o:["Nothing","Faster processing","Event→Lambda→event infinite loop and a huge bill","Versioning blocks it"], a:2, why:"The write re-fires ObjectCreated. Output to a second bucket (or strict prefix filters)."},
  {q:"'Serve the S3 site over HTTPS without making the bucket public':", o:["Bucket policy allow *","CloudFront with Origin Access Control","Presigned URLs for every visitor","Enable website endpoint TLS"], a:1, why:"OAC lets only the distribution read the bucket; CloudFront terminates HTTPS with an ACM cert."},
  {q:"Private-subnet instances need outbound internet. You add:", o:["Internet Gateway route directly","NAT Gateway in a public subnet + private route 0/0 → NAT","VPC peering","Elastic IPs on each"], a:1, why:"NAT translates outbound for private hosts; IGW-direct would require public IPs (no longer private)."},
  {q:"Security groups vs NACLs — the key behavioural difference:", o:["SGs are subnet-level","SGs are stateful; NACLs stateless and need return-traffic rules","NACLs allow-only","No difference"], a:1, why:"Stateless NACLs must permit ephemeral return ports — the classic 'it half-works' misconfig."},
  {q:"Cut NAT charges for heavy S3 traffic from private subnets:", o:["Bigger NAT","S3 Transfer Acceleration","Gateway VPC endpoint for S3","CloudFront"], a:2, why:"Gateway endpoints route S3/DynamoDB privately and free — bypassing NAT entirely."},
  {q:"Peering VPC A–B and B–C exists. A reaches C?", o:["Yes, transitively","Only with matching CIDRs","No — peering is non-transitive; use Transit Gateway","Yes if same region"], a:2, why:"Non-transitivity is peering's defining limit; TGW is the hub that fixes the mesh."},
  {q:"Global users of a TCP (non-HTTP) app need static IPs and fast failover:", o:["CloudFront","Global Accelerator","Route 53 weighted","Multivalue DNS"], a:1, why:"GA: 2 anycast IPs, backbone routing, any TCP/UDP, caches nothing — the CloudFront contrast."},
  {q:"Checkout must survive the payment service being slow:", o:["Bigger payment instances","Synchronous retries","SQS between order intake and payment workers, DLQ for poison messages","DNS failover"], a:2, why:"The queue absorbs bursts and outages; orders wait instead of failing. Decoupling 101."},
  {q:"A worker crashes mid-message. SQS behaviour:", o:["Message lost","Message reappears after visibility timeout","Queue halts","DLQ immediately"], a:1, why:"Visibility timeout hides in-flight messages; no delete → redelivery. Hence idempotent consumers."},
  {q:"RDS Multi-AZ primarily provides…", o:["Read scaling","Automatic failover to a synchronous standby","Cross-region DR","Cheaper storage"], a:1, why:"Multi-AZ = availability. Read replicas (async) = read scaling. Different tools, favourite trick question."},
  {q:"Which DR posture gives near-zero RTO?", o:["Backup & restore","Pilot light","Warm standby","Multi-site active-active"], a:3, why:"Both regions live and serving; Route 53 shifts users instantly. Cost scales with ambition."},
  {q:"SQL queries directly on files in S3, serverless:", o:["Redshift only","Athena","EMR mandatory","RDS import"], a:1, why:"Athena queries S3 in place (Glue catalog, pay per data scanned)."},
  ],
  cards:[
  {f:"Region / AZ / Edge", b:"Region = cluster of AZs; AZ = isolated DC(s); edge = CloudFront POPs. Serious apps span ≥2 AZs."},
  {f:"IAM role vs user", b:"User: long-lived person creds. Role: assumed temporarily (EC2, Lambda, federation) — no stored keys. Explicit Deny wins."},
  {f:"EC2 pricing blend", b:"Reserved/Savings = baseline · On-Demand = waves · Spot (−90%, 2-min reclaim) = interruptible batch."},
  {f:"EBS vs EFS vs FSx vs instance store", b:"Block 1-instance 1-AZ / NFS many-instance multi-AZ / Windows-SMB & Lustre-HPC / ephemeral fastest."},
  {f:"Placement groups", b:"Cluster = low latency one rack · Spread = max 7/AZ separate hardware · Partition = rack-aware big-data."},
  {f:"ALB vs NLB vs GWLB", b:"L7 path/host routing · L4 extreme perf + static IPs · L3 appliance insertion."},
  {f:"ASG policies", b:"Target tracking (default), step, scheduled (known rhythm), predictive (ML). Warm-up stops double-fires."},
  {f:"Stateless rule", b:"Sessions in ElastiCache/DynamoDB so any instance serves anyone — what makes scale-in safe."},
  {f:"S3 class ladder", b:"Standard → Intelligent → IA/OneZone-IA → Glacier Instant/Flexible/Deep. Lifecycle rules automate it."},
  {f:"S3 encryption", b:"SSE-S3 default · SSE-KMS auditable · SSE-C your key per call · enforce TLS via SecureTransport condition."},
  {f:"Presigned URL", b:"Time-limited signed link to one object — app-controlled downloads/uploads without public buckets."},
  {f:"S3 event loop trap", b:"Lambda writing output to its trigger bucket = infinite loop. Second bucket or prefix filter."},
  {f:"Public subnet =", b:"Route table has 0.0.0.0/0 → IGW (+ public IPs). NAT GW = private outbound only, one per AZ."},
  {f:"SG vs NACL", b:"Stateful allow-only on ENI vs stateless numbered allow/deny on subnet (remember ephemeral returns)."},
  {f:"Endpoints", b:"Gateway (S3/DynamoDB, free, route entry) vs Interface/PrivateLink (ENI, most services, paid)."},
  {f:"Peering vs TGW", b:"1:1 non-transitive vs hub-and-spoke for many VPC/VPN/DX. BGP rides Direct Connect."},
  {f:"R53 policies", b:"Weighted=canary · Latency=global speed · Failover=DR · Geo=residency · Multivalue=healthy RR. Alias for apex→AWS."},
  {f:"CloudFront vs Global Accelerator", b:"Cache HTTP at edge vs static anycast IPs + backbone for any TCP/UDP, no caching."},
  {f:"Caching ladder", b:"Browser → CloudFront → app → ElastiCache → DB (+ DAX for DynamoDB). Each hit spares the layers behind."},
  {f:"SQS mechanics", b:"Visibility timeout, long polling, DLQ after maxReceive, 14d retention; Standard at-least-once vs FIFO ordered."},
  {f:"SNS→SQS fan-out", b:"One event, many durable consumers (orders → fulfilment + analytics + fraud)."},
  {f:"Lambda limits", b:"15 min, 128MB–10GB (CPU follows memory), cold starts → provisioned concurrency; Step Functions for workflows."},
  {f:"DynamoDB", b:"Partition(+sort) key design, GSIs, on-demand vs provisioned, DAX µs cache, Streams→Lambda, Global Tables."},
  {f:"RDS Multi-AZ vs read replica", b:"Sync standby = failover/HA. Async replicas = read scaling, promotable. Aurora: 6-copy storage, 15 readers."},
  {f:"DR ladder", b:"Backup&restore → pilot light → warm standby → active-active. Match stated RTO/RPO to cheapest posture."},
  {f:"Analytics pipeline cliché", b:"Firehose → S3 → Athena (Glue catalog) → QuickSight. Redshift for heavy BI, EMR for Spark."},
  {f:"KMS / Secrets", b:"KMS: envelope encryption + CloudTrail audit. Secrets Manager rotates; Parameter Store is the free config shelf."},
  ],
  labs:[],
  codelabs:[{
    id:"aws-scale", t:"Design lab: survive the promo",
    brief:"In the box, design (in words/ASCII) the architecture for: a ticket-sales page, normally 500 users/day, expecting 300,000 in 3 hours after a radio announcement, sessions must survive instance loss, checkout must not drop orders if the payment provider slows down. Name the AWS service for each role.",
    starter:"Users\n -> ...\n",
    checks:[
      {re:"cloudfront|cdn", hint:"Offload static content at the edge — name the CDN."},
      {re:"alb|application load balancer", hint:"An ALB should front the web tier across AZs."},
      {re:"asg|auto.?scal", hint:"The fleet must grow and shrink — Auto Scaling Group with a policy."},
      {re:"elasticache|redis|dynamodb", hint:"Sessions must live OUTSIDE instances (ElastiCache/DynamoDB)."},
      {re:"sqs|queue", hint:"Decouple checkout from the slow payment provider with a queue."},
      {re:"dlq|dead.?letter", hint:"Where do poison/failed order messages go? Add a DLQ."},
    ],
    model:`Users
 -> Route 53 (health-checked)
 -> CloudFront + WAF  (static assets from S3 via OAC; absorbs ~80% of requests)
 -> ALB across 3 AZs (ACM TLS)
 -> ASG web tier: min 4 / max 60, target-tracking on RequestCountPerTarget,
    scheduled pre-warm 30 min before the radio spot; instances STATELESS
      -> ElastiCache Redis: sessions + hot seat-map cache
      -> SQS "orders" (long polling) -> worker ASG scaling on queue depth
           -> payment provider (slow? queue absorbs it; workers retry)
           -> DLQ after 5 receives -> alarm to ops
      -> Aurora (writer + readers for seat lookups)
Private subnets everywhere; NAT per AZ; S3 gateway endpoint; CloudWatch alarms on p99 latency + queue age.`,
  }],
});

})();
