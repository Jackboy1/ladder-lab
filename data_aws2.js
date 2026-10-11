// AWS expansion pack — databases decided, security in depth, FinOps, and three full case-study architectures
(function(){
const T = LL.tracks.find(t=>t.id==="aws"); if(!T) return;

const pipesvg = `<figure style="margin:14px 0"><svg viewBox="0 0 680 210" style="max-width:100%;display:block" role="img">
<defs><marker id="awarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
<g font-family="var(--display)" font-size="12" font-weight="600">
<rect x="15" y="70" width="90" height="44" rx="7" fill="var(--panel2)" stroke="var(--line)"/><text x="60" y="89" text-anchor="middle" fill="var(--fg)">Creators</text><text x="60" y="104" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">mobile app</text>
<rect x="140" y="70" width="95" height="44" rx="7" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/><text x="187" y="89" text-anchor="middle" fill="var(--fg)">S3 uploads</text><text x="187" y="104" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">presigned PUT</text>
<rect x="270" y="20" width="95" height="40" rx="7" fill="var(--panel2)" stroke="var(--line)"/><text x="317" y="37" text-anchor="middle" fill="var(--fg)">SQS</text><text x="317" y="51" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">buffer + DLQ</text>
<rect x="270" y="120" width="95" height="44" rx="7" fill="var(--panel2)" stroke="var(--line)"/><text x="317" y="139" text-anchor="middle" fill="var(--fg)">Lambda</text><text x="317" y="154" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">transcode/resize</text>
<rect x="400" y="70" width="100" height="44" rx="7" fill="var(--panel2)" stroke="var(--line)"/><text x="450" y="89" text-anchor="middle" fill="var(--fg)">S3 media</text><text x="450" y="104" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">+ DynamoDB meta</text>
<rect x="535" y="70" width="120" height="44" rx="7" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/><text x="595" y="89" text-anchor="middle" fill="var(--fg)">CloudFront</text><text x="595" y="104" text-anchor="middle" fill="var(--muted)" font-size="10" font-weight="400">signed URLs · OAC</text>
</g>
<line x1="105" y1="92" x2="140" y2="92" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#awarr)"/>
<line x1="235" y1="80" x2="270" y2="48" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#awarr)"/>
<line x1="317" y1="60" x2="317" y2="120" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#awarr)"/>
<line x1="365" y1="130" x2="402" y2="102" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#awarr)"/>
<line x1="500" y1="92" x2="535" y2="92" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#awarr)"/>
<text x="175" y="140" fill="var(--muted)" font-size="10.5" font-family="var(--mono)">ObjectCreated event</text>
<text x="340" y="196" text-anchor="middle" fill="var(--muted)" font-size="11">Zero idle servers · scales per upload · failures quarantined in the DLQ, never lost</text>
</svg><figcaption class="small muted" style="margin-top:4px">Case study A: the serverless media pipeline — pay only while work happens.</figcaption></figure>`;

T.lessons.push(
{t:"Databases decided: picking the right store under pressure", html:`
<p>SAA scenarios and real design meetings are the same game: match the <i>access pattern</i> to the store. Learn the deciding questions, not just the product names.</p>
<h3>The decision table (memorise the left column)</h3>
<div class="tablewrap"><table>
<tr><th>The scenario says…</th><th>Reach for</th><th>Because</th></tr>
<tr><td>Joins, transactions, existing SQL app</td><td><b>RDS</b> (MySQL/Postgres…)</td><td>Managed relational: patching, backups, Multi-AZ failover handled</td></tr>
<tr><td>Relational + "high performance / scale reads / global"</td><td><b>Aurora</b></td><td>6-copy storage across 3 AZs, up to 15 readers, Global Database, Serverless v2 scales with load</td></tr>
<tr><td>Key-value at any scale, single-digit-ms, serverless</td><td><b>DynamoDB</b></td><td>Partition-key design, on-demand capacity, Streams, Global Tables</td></tr>
<tr><td>Microsecond reads / sessions / leaderboards / hot cache</td><td><b>ElastiCache</b> (Redis)</td><td>In-memory; sits in FRONT of the others</td></tr>
<tr><td>Analytics over huge history, BI joins, columnar</td><td><b>Redshift</b></td><td>The warehouse — OLAP, not OLTP</td></tr>
<tr><td>SQL on files already in S3, occasionally</td><td><b>Athena</b></td><td>Serverless, pay per scan — no cluster to run</td></tr>
<tr><td>Graph relationships ("friends of friends")</td><td>Neptune</td><td>Graph traversal is miserable in SQL</td></tr>
<tr><td>Time-series at ingest scale / ledger with proof</td><td>Timestream / QLDB</td><td>Purpose-built beats bent-into-shape</td></tr>
</table></div>
<p>Anti-pattern flags examiners plant: "team knows SQL" ≠ Redshift for an app backend; "millions of IoT writes/sec" screams DynamoDB/Timestream, not RDS; "cache" never means another RDS replica.</p>
<h3>RDS operations you're expected to know cold</h3>
<ul>
<li><b>Backups</b>: automated daily snapshot + transaction logs → <b>point-in-time restore</b> (any second in the window, up to 35 days). Manual snapshots keep forever. Restores always create a NEW instance — plan the DNS/endpoint swap.</li>
<li><b>Multi-AZ vs read replicas</b> (the eternal trick): synchronous standby = failover/HA, serves nothing; async replicas = read scaling + promotable, can be cross-region. Aurora blurs it: its replicas are both readers and failover targets.</li>
<li><b>Storage autoscaling</b>, Performance Insights for "DB is slow" triage, and IAM database authentication to kill password sprawl.</li>
<li><b>RDS Proxy</b>: connection pooling — the fix when Lambda's thousand cold starts exhaust Postgres connections (a modern-architecture classic).</li>
</ul>
<h3>DynamoDB design in one worked example</h3>
<pre><code>Access patterns first, table second:
  "get cart by user"            → PK = USER#id
  "get order + its items"       → PK = ORDER#id, SK = ITEM#n   (one query, no joins)
  "orders by status for ops"    → GSI: PK = status, SK = date
Hot-partition trap: PK = "today's date" funnels ALL writes to one partition → throttling.
Fix: spread the key (date#shard) or rethink the pattern.</code></pre>
<p>Plus: TTL auto-expires rows free (sessions!), Streams → Lambda for change-driven work, DAX when even 5 ms is too slow, and on-demand capacity until traffic is predictable.</p>
<h3>Moving databases: DMS + SCT</h3>
<p><b>DMS</b> replicates a live database into AWS with minimal downtime (full load + CDC change capture); <b>SCT</b> converts schemas across engines (Oracle → Aurora Postgres is the licensed-dollars-to-open-source story every migration deck tells). Exam phrase "migrate with minimal downtime" = DMS, reflexively.</p>
<div class="callout">Drill it: the <b>“Pick the store” code lab</b> below gives five mini-scenarios; answer with service names and get checked.</div>`},

{t:"Security in depth: KMS, Secrets, Organizations, and the detection stack", html:`
<p>IAM was the perimeter; this is the rest of the fortress — the services behind every "auditor asks…" scenario.</p>
<h3>KMS and envelope encryption (actually understand it once)</h3>
<pre><code>Your 10 GB file is NOT encrypted directly with the KMS key:
1. KMS generates a one-off DATA KEY
2. The data key encrypts the file locally (fast, any size)
3. KMS encrypts the data key with your CMK; the WRAPPED key is stored beside the file
4. To read: send the wrapped key to KMS → Decrypt (logged in CloudTrail!) → unwrap → read
Result: bulk crypto stays local; the master key never leaves KMS; every use is auditable.</code></pre>
<ul>
<li>Key types: AWS-managed (free, invisible) vs <b>customer-managed</b> (key policies, rotation, the compliance answer) vs imported/external for "we must hold the material".</li>
<li>Killer property: a KMS <b>key policy</b> can deny even account admins — and <i>deleting/disabling a key renders everything under it unreadable</i> (crypto-shredding; also an outage class — hence 7–30-day deletion waiting periods).</li>
<li>S3 SSE-KMS vs SSE-S3 in one line: same AES-256; KMS adds per-use audit + your key policy + the ability to revoke.</li></ul>
<h3>Secrets Manager vs Parameter Store (asked constantly)</h3>
<p><b>Secrets Manager</b>: built-in rotation (RDS natively), cross-account sharing, ~$0.40/secret. <b>SSM Parameter Store</b>: free standard tier, SecureString via KMS, config + secrets without rotation. Rule: rotating credentials → Secrets Manager; everything else → Parameter Store. Both beat the real-world default of .env files in a repo.</p>
<h3>Organizations: many accounts on purpose</h3>
<p>Real companies run <b>one account per environment/team</b> (blast-radius isolation, clean billing) under AWS Organizations: consolidated billing, OUs, and <b>SCPs</b> — guardrails that cap what even root in a member account can do ("no one leaves eu-west, no one disables CloudTrail"). SCPs don't grant anything; they set the outer boundary IAM lives inside. Control Tower is the paved road for setting this up.</p>
<h3>The detection & protection stack (match service → job)</h3>
<div class="tablewrap"><table>
<tr><th>Service</th><th>Job</th><th>Scenario keyword</th></tr>
<tr><td><b>CloudTrail</b></td><td>Who called which API, when, from where</td><td>"audit", "investigate the incident"</td></tr>
<tr><td><b>GuardDuty</b></td><td>Threat detection from logs/DNS/flow (ML)</td><td>"compromised instance", "crypto-mining"</td></tr>
<tr><td><b>Inspector</b></td><td>Vulnerability scanning: EC2, ECR images, Lambda</td><td>"CVEs", "unpatched"</td></tr>
<tr><td><b>Macie</b></td><td>Finds sensitive data (PII) in S3</td><td>"customer data in buckets"</td></tr>
<tr><td><b>WAF</b></td><td>L7 rules on ALB/CloudFront/API GW: SQLi, XSS, rate limits, geo</td><td>"web attacks", "block abusive IPs"</td></tr>
<tr><td><b>Shield / Advanced</b></td><td>DDoS (L3/4 free; Advanced adds response team + cost protection)</td><td>"DDoS"</td></tr>
<tr><td><b>Security Hub / Config</b></td><td>Aggregated findings / resource compliance rules</td><td>"single pane", "every SG open to the world → flag"</td></tr>
</table></div>
<h3>Incident muscle memory (interview scenario: leaked access key)</h3>
<pre><code>1. Disable the key (IAM) — don't delete yet, you'll want its trail
2. CloudTrail: every call that key made → scope of damage
3. Rotate any secrets it could read; check for persistence (new users/keys/roles it created)
4. GuardDuty findings review; isolate affected instances (SG swap)
5. Postmortem: WHY was a long-lived key in play? → move the workload to roles</code></pre>
<p>Notice the ending: the fix is the IAM lesson's opening rule. Security answers in AWS circle back to "roles, not keys" with satisfying regularity.</p>`},

{t:"Cost optimization like a FinOps engineer (and the bill-horror case study)", html:`
<p>Architecture decisions ARE cost decisions. This lesson is the difference between a $400 and a $4,000 month on the same workload — and it's interview material, because companies bleed here.</p>
<h3>Case study: the ₦-burning startup bill, dissected</h3>
<pre><code>Symptoms on the invoice           → Root cause found
EC2 $1,900 (was $600)             → dev ASGs left at prod size over the weekend; zero Savings Plans
NAT Gateway data $740             → app pulled 8 TB from S3 THROUGH the NAT (per-GB processing fee)
Inter-AZ transfer $310            → chatty services split across AZs without need; NLB cross-zone on
EBS $280                          → 40 unattached volumes + 900 old snapshots from deleted test stacks
S3 $190 rising monthly            → no lifecycle rules; logs in Standard forever + abandoned multipart uploads
CloudWatch $120                   → debug-level logs shipped at full volume, never expired</code></pre>
<p>Fixes, in order of payback: S3 <b>gateway endpoint</b> (NAT bypass for S3 = that $740 → ~0) · scheduled scaling to shrink dev out of hours · Savings Plan on the measured steady floor · lifecycle rules + AbortIncompleteMultipartUpload · a weekly janitor script for unattached EBS/old snapshots (your bash/boto3 skills, literally billable) · log retention policies. Same app, ~60% off.</p>
<h3>The levers, ranked</h3>
<ol>
<li><b>Turn things off</b>: schedules for non-prod (nights/weekends ≈ 65% of the week!), janitors for orphans. Boring, biggest, first.</li>
<li><b>Buy correctly</b>: measure the 24/7 floor → cover it with <b>Savings Plans</b>/RIs (40–72% off); waves on-demand; batch on <b>Spot</b> (to 90% off, 2-min reclaim — design for interruption with checkpoints/queues).</li>
<li><b>Right-size</b>: Compute Optimizer + CloudWatch say the m5.2xlarge runs at 6% CPU. Also <i>modernise-size</i>: Graviton (arm) instances ≈ 20% better price/perf for most Linux workloads.</li>
<li><b>Storage ladders</b>: gp2→gp3 (cheaper AND configurable IOPS — a free win), S3 Intelligent-Tiering/lifecycle, log expiry everywhere.</li>
<li><b>Data transfer — the invisible lever</b>: inbound free; egress to internet billed; <b>inter-AZ billed both directions</b>; NAT bills processing per GB. Patterns: keep chatty tiers AZ-local where safe, VPC endpoints for S3/DynamoDB, CloudFront egress is cheaper than EC2 egress (the CDN pays for itself twice).</li>
<li><b>Architecture itself</b>: serverless for spiky/low-duty (pay-per-request beats idle fleets); caching layers cut the expensive tiers' size; one ALB + host rules instead of ten.</li>
</ol>
<h3>Visibility: you can't cut what you can't see</h3>
<ul>
<li><b>Tag everything</b> (project/env/owner) and activate cost-allocation tags — untagged spend is unaccountable spend.</li>
<li>Cost Explorer for trends; <b>Budgets with alerts</b> (and actions) so the surprise arrives on day 3, not day 30; <b>Cost Anomaly Detection</b> for the 3 a.m. recursion bug; CUR → Athena when finance wants real answers.</li>
<li>Guardrails: SCP blocking exotic instance families in dev; budget alarm → SNS → the team channel.</li></ul>
<h3>Well-Architected tie-back</h3>
<p>This is the Cost Optimization pillar operationalised. Interview soundbite: "My first week on any account: tagging audit, top-10 Cost Explorer services, orphan sweep, NAT/data-transfer review, then a Savings Plan sized to the measured floor — in that order, because the first three are free."</p>`},

{t:"Case studies: three architectures end-to-end", html: pipesvg + `
<h3>A — Serverless media pipeline (diagram above)</h3>
<p><b>Brief:</b> a Lagos creator app: users upload videos/photos; the platform transcodes, thumbnails, and serves globally; traffic is wildly spiky; the team is three people who refuse to babysit servers.</p>
<pre><code>Mobile → presigned S3 PUT (app never proxies bytes; IAM-scoped, expiring)
S3 ObjectCreated → SQS (buffer; DLQ after 5 fails) → Lambda transcode/resize
   → outputs to a SECOND media bucket + metadata row in DynamoDB (PK USER#id, SK MEDIA#ts)
Serving: CloudFront + OAC on the media bucket; signed URLs for private content
Ops: CloudWatch alarms on DLQ depth & Lambda error rate; cost = cents while idle</code></pre>
<p><b>Why each piece</b>: presigned URLs push bandwidth to S3, not your servers · SQS between event and compute absorbs the 10k-upload influencer moment and quarantines poison files · second bucket kills the infinite-loop trap · DynamoDB because the pattern is pure key-value · total idle cost ≈ zero. <b>Failure drill</b>: Lambda bug ships → errors pile into DLQ, alarm fires, you fix, then redrive the DLQ — no upload ever lost.</p>
<h3>B — Multi-region DR with real numbers</h3>
<p><b>Brief:</b> a payments API in eu-west-2 must survive a regional outage. Business signed off: RTO 15 minutes, RPO 1 minute. Budget: not active-active.</p>
<pre><code>Posture chosen: WARM STANDBY (pilot light misses the RTO; active-active overshoots the budget)
Primary eu-west-2: ALB + ASG(6) + Aurora writer
Standby eu-west-1: same stack via the SAME Terraform, ASG min=1 ("warm"),
                   Aurora Global Database secondary (replication lag ~<1s → meets RPO)
Route 53 failover record, health check on the primary's /health
Runbook (practised quarterly, because an untested DR plan is a rumour):
 1. Health check fails 3× → alarm; human confirms it's regional, not a bad deploy
 2. Promote Aurora secondary (managed failover)   ~1–2 min
 3. Scale standby ASG 1→6                          ~3–5 min
 4. Route 53 flips (TTL 60)                        ~1–2 min
 Measured total ≈ 8–10 min ✓   Data loss ≤ replication lag ✓</code></pre>
<p><b>The traps this design dodges</b>: secrets/AMIs/parameters must already exist in region B (Terraform guarantees it) · quotas in the standby region raised in advance · DNS TTL pre-lowered · and the one everyone forgets — the standby's dependencies (third-party IP allowlists, webhooks) tested too.</p>
<h3>C — Hybrid enterprise (the Coscharis-shaped one)</h3>
<p><b>Brief:</b> a group with on-prem AD, legacy ERP in a Lagos data centre, and a mandate to run new workloads in AWS without re-badging every employee.</p>
<pre><code>Identity: AD Connector / managed AD trust → IAM Identity Center → SSO into AWS with existing creds
Network: Site-to-Site VPN day one → Direct Connect when steady (BGP — your CCNA meets the cloud here),
         Transit Gateway hub: on-prem ↔ shared-services VPC ↔ per-team VPCs (no peering mesh)
Landing:  Organizations + Control Tower: accounts per env, SCPs as guardrails, central CloudTrail/Config
Workloads: new apps in private subnets behind ALB; ERP stays put, reached over the DX;
          FSx for Windows for the file shares; DMS trickles reporting data into Aurora for analytics
Exit criteria per app, not big-bang: measure, migrate, verify, repoint DNS</code></pre>
<p><b>Why it's shaped this way</b>: identity federation first because password sprawl kills adoption · TGW because the third VPC is when peering stops scaling · guardrails before workloads because retrofitting governance is 10× the cost · and the migration is a sequence of boring, reversible steps — which is the entire art of enterprise cloud.</p>
<div class="callout">Interview use: pick ONE of these, draw it from memory, and narrate the failure drill. A candidate who volunteers "and here's what happens when it breaks" is remembered.</div>`}
);

T.quiz.push(
{q:"An app needs millisecond key-value reads for 10M users with unpredictable spikes, no joins. Choose:", o:["RDS MySQL Multi-AZ","Redshift","DynamoDB on-demand","Aurora Serverless"], a:2, why:"Pure key-value at scale with spiky traffic = DynamoDB with on-demand capacity. Relational engines solve a problem this app doesn't have."},
{q:"Lambda functions are exhausting your Postgres connections. The designed fix:", o:["Bigger RDS instance","RDS Proxy for connection pooling","More Lambdas","Switch to Redshift"], a:1, why:"Each concurrent Lambda opens connections; RDS Proxy multiplexes them — the canonical serverless+relational pattern."},
{q:"'Restore the database to 09:41:30 last Tuesday' is possible because of:", o:["Multi-AZ","Automated backups + transaction logs (point-in-time restore)","Read replicas","DAX"], a:1, why:"PITR replays logs onto the nearest snapshot — to any second inside the retention window, as a NEW instance."},
{q:"A DynamoDB table keyed on today's date throttles every evening. Cause:", o:["Table too small","Hot partition — all writes funnel to one partition key","Missing GSI","TTL enabled"], a:1, why:"Low-cardinality time-based keys concentrate load; shard the key or redesign the pattern."},
{q:"'Migrate the on-prem Oracle DB to Aurora PostgreSQL with minimal downtime' maps to:", o:["Snapshot + restore","SCT for schema + DMS with CDC replication","S3 sync","Storage Gateway"], a:1, why:"SCT converts the schema across engines; DMS full-load + change-data-capture keeps it live until cutover."},
{q:"KMS envelope encryption means:", o:["KMS encrypts your 10GB file directly","A data key encrypts the data locally; KMS encrypts only the data key, logging every unwrap","Keys are emailed","S3-only feature"], a:1, why:"Bulk crypto stays local and fast; the master key never leaves KMS; CloudTrail records every decrypt."},
{q:"Credentials that must rotate automatically belong in:", o:["Parameter Store standard","Secrets Manager","A tagged S3 bucket","User data"], a:1, why:"Rotation is Secrets Manager's defining feature (native for RDS); Parameter Store is the free config/secrets shelf without it."},
{q:"An SCP in Organizations…", o:["Grants admin to member accounts","Sets the outer boundary even root in a member account cannot cross","Replaces IAM","Only affects billing"], a:1, why:"SCPs are guardrails, not grants — IAM operates inside whatever the SCP leaves possible."},
{q:"'An EC2 instance is making DNS queries associated with crypto-mining.' Which service told you?", o:["Inspector","Macie","GuardDuty","WAF"], a:2, why:"GuardDuty does threat detection from CloudTrail/VPC flow/DNS telemetry. Inspector = vulnerabilities, Macie = PII in S3, WAF = L7 filtering."},
{q:"A leaked access key is confirmed. First action:", o:["Delete the IAM user","Disable the key, then read its CloudTrail history for scope","Email AWS","Rotate the root password"], a:1, why:"Disable stops the bleeding while preserving the audit trail you need next; deletion can wait."},
{q:"Private-subnet workers pull 8 TB/month from S3 and the NAT line item explodes. Fix:", o:["Bigger NAT","Second NAT","S3 gateway VPC endpoint","Transfer Acceleration"], a:2, why:"Gateway endpoints route S3/DynamoDB privately and free — the single most common real-bill fix."},
{q:"Dev environments run 24/7 at prod size. Highest-payback first move:", o:["Savings Plan on everything","Schedule them off nights/weekends, then buy commitments for the measured floor","Spot for the databases","Move to another region"], a:1, why:"Turn-off is free and immediate; commit only to the floor you then actually measure. (Spot databases lose data on reclaim.)"},
{q:"Which is billed BOTH directions and silently punishes chatty cross-AZ services?", o:["Inbound internet traffic","Inter-AZ data transfer","S3 GET requests","IAM calls"], a:1, why:"Inter-AZ transfer charges each way — the invisible line item behind 'we split everything across AZs for no reason'."},
{q:"RTO 15 min / RPO 1 min, budget forbids active-active. Posture:", o:["Backup & restore","Pilot light","Warm standby with Aurora Global + Route 53 failover","Multi-site"], a:2, why:"Backup/restore and pilot light miss the RTO; warm standby (scaled-down live copy, sub-second replication) hits both numbers at sane cost."},
);

T.cards.push(
{f:"DB decision reflex", b:"Joins/transactions→RDS · relational at scale/global→Aurora · key-value any scale→DynamoDB · µs/hot→ElastiCache · BI history→Redshift · SQL-on-S3→Athena."},
{f:"PITR", b:"Automated snapshot + tx logs → restore to any second in window (≤35d), always as a NEW instance."},
{f:"RDS Proxy", b:"Connection pooling — the Lambda-exhausts-Postgres fix."},
{f:"DynamoDB hot partition", b:"Low-cardinality PK (e.g. date) funnels load → throttle. Shard/spread the key."},
{f:"DMS + SCT", b:"'Minimal downtime migration' = DMS (full load + CDC). Cross-engine schema = SCT."},
{f:"Envelope encryption", b:"Data key encrypts data locally; KMS encrypts the data key; every unwrap hits CloudTrail."},
{f:"Secrets vs Parameter Store", b:"Needs rotation → Secrets Manager. Config/static secrets, free → SSM Parameter Store."},
{f:"SCP", b:"Org guardrail: outer boundary even member-account root can't cross. Grants nothing."},
{f:"Detection stack map", b:"CloudTrail=who did what · GuardDuty=threats · Inspector=CVEs · Macie=PII in S3 · WAF=L7 · Shield=DDoS · Config=compliance."},
{f:"Leaked key drill", b:"Disable → CloudTrail scope → rotate reachable secrets → hunt persistence → postmortem: why not a role?"},
{f:"Top 3 bill-killers", b:"NAT per-GB (→ S3 endpoint) · inter-AZ chatter (both directions!) · zombie dev fleets (→ schedules + janitor script)."},
{f:"Buying order", b:"Turn off → right-size (+Graviton, gp2→gp3) → Savings Plan the measured floor → Spot the interruptible."},
{f:"Cost visibility kit", b:"Tags + cost-allocation · Budgets alerts · Anomaly Detection · CUR→Athena."},
{f:"DR numbers habit", b:"Quote the posture WITH measured RTO/RPO and a practised runbook — 'an untested DR plan is a rumour'."},
);

T.codelabs.push(
{
  id:"aws-iam", t:"Code lab: write the IAM policy",
  brief:"The reporting app on EC2 must read and write objects ONLY under the 'reports/' prefix of bucket coscharis-data, and list that bucket. Write the JSON policy: Version 2012-10-17, one statement allowing s3:GetObject and s3:PutObject on arn:aws:s3:::coscharis-data/reports/*, and a second allowing s3:ListBucket on the bucket ARN itself (no /*).",
  starter:"{\n  \n}\n",
  checks:[
    {re:"\"Version\"\\s*:\\s*\"2012-10-17\"", hint:"Include \"Version\": \"2012-10-17\"."},
    {re:"\"Effect\"\\s*:\\s*\"Allow\"", hint:"Statements need \"Effect\": \"Allow\"."},
    {re:"s3:GetObject", hint:"Allow s3:GetObject for reads."},
    {re:"s3:PutObject", hint:"Allow s3:PutObject for writes."},
    {re:"arn:aws:s3:::coscharis-data/reports/\\*", hint:"Object actions target the prefix: arn:aws:s3:::coscharis-data/reports/*"},
    {re:"s3:ListBucket", hint:"Listing is a separate action: s3:ListBucket."},
    {re:"\"arn:aws:s3:::coscharis-data\"", hint:"ListBucket applies to the BUCKET arn itself — no /* (the classic split)."},
  ],
  model:`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjectRW",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::coscharis-data/reports/*"
    },
    {
      "Sid": "ListIt",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::coscharis-data",
      "Condition": { "StringLike": { "s3:prefix": "reports/*" } }
    }
  ]
}`,
},
{
  id:"aws-pick", t:"Code lab: pick the store (5 scenarios)",
  brief:"Answer each line with the AWS service you'd choose, one per line, with a word on why: 1) gaming leaderboard updated 50k×/sec, read in microseconds · 2) 7 years of invoices, SQL reports for finance monthly, data already lands in S3 · 3) shopping-cart state for 5M users, serverless stack · 4) existing Django app lifting-and-shifting, needs automatic failover · 5) sub-ms session cache in front of the database.",
  starter:"1) \n2) \n3) \n4) \n5) \n",
  checks:[
    {re:"1\\).*(elasticache|redis|memorydb)", hint:"1) Microsecond leaderboard = in-memory: ElastiCache/Redis (sorted sets are literally built for this)."},
    {re:"2\\).*(athena)", hint:"2) Occasional SQL over files already in S3 = Athena (a running warehouse would idle 29 days a month)."},
    {re:"3\\).*(dynamodb)", hint:"3) Serverless key-value carts = DynamoDB (PK per user, TTL for abandonment)."},
    {re:"4\\).*(rds)(?!.*redshift)|4\\).*aurora", hint:"4) Lift-and-shift relational with failover = RDS Multi-AZ (or Aurora)."},
    {re:"5\\).*(elasticache|redis|dax|memcached)", hint:"5) Session cache in front of a DB = ElastiCache."},
  ],
  model:`1) ElastiCache (Redis) — sorted sets give microsecond ranked reads at that write rate
2) Athena (+ Glue catalog, Parquet partitions) — SQL on S3, pay only on query days
3) DynamoDB — serverless key-value, PK=USER#id, TTL expires abandoned carts free
4) RDS (Postgres/MySQL) Multi-AZ — managed relational with automatic failover; Aurora if growth demands
5) ElastiCache Redis — write-through session store; any instance can serve any user`,
}
);
})();
