// Hard-mode wave — six multi-cause P1 incident tickets (loads AFTER data_tickets/itsupport2)
(function(){
LL.tickets.push(
{
  id:"tk-checkout500", sev:"P1", from:"Pager + CEO WhatsApp", system:"Cloud / SRE",
  title:"Checkout throwing 500s mid-promo — revenue bleeding",
  body:"Ten minutes into a radio promo, 30% of checkout requests return 500. Web tier ASG scaled 6→28 as designed. Aurora writer CPU is 96%; app logs show 'too many connections' and slow product-page queries.",
  asks:["What made scaling the web tier WORSE here?","Order your mitigations for the next 10 minutes.","What are the two architectural causes a postmortem should name?"],
  model:`<ul>
<li><b>The twist:</b> each new web instance opens its own DB connection pool — scaling 6→28 multiplied connections ~5× into a fixed-size database. The 'self-healing' layer amplified the failure: classic retry/scale storm onto a saturated dependency.</li>
<li><b>Mitigate now, in order:</b> cap the web ASG max (stop feeding the fire) → shrink per-instance pool size via config/flag → push read traffic to the reader endpoint if the app supports it → enable the product-cache flag / raise ElastiCache TTLs so hot queries stop hitting Aurora → if a connection proxy (RDS Proxy) exists but is bypassed, route through it. Each step sheds database load without touching data.</li>
<li><b>Verify with numbers:</b> writer CPU falling, connection count under the limit, 5xx rate on the ALB panel returning to baseline — not "it feels better".</li>
<li><b>Postmortem causes (plural):</b> (1) no connection pooling layer between an elastic tier and a fixed-capacity database; (2) read-heavy promo traffic hitting the writer because caching/reader-routing wasn't in the hot path. Actions: RDS Proxy or pool caps as code, cache-first product reads, and a load test that includes the database, not just the web tier.</li></ul>`,
},
{
  id:"tk-halfoffice", sev:"P1", from:"Floor 2 + Floor 3", system:"NOC",
  title:"Intermittent everything for half the building",
  body:"~80 users report pages half-loading, VoIP robot-voice, drives disconnecting — then fine for a minute, then bad again. The other half of the building is clean. No changes logged. It started ~09:30.",
  asks:["What does 'intermittent + one half of the topology' tell you versus a hard-down?","Where do you look, and for what counters?","Name the two classic physical causes for this exact signature."],
  model:`<ul>
<li>Hard-down says 'broken thing'; <b>intermittent says degraded path</b> — something flapping or erroring, not dead. One half affected = the fault sits on the shared path those users ride: their distribution uplink or the switch pair serving that half.</li>
<li>Go to the distribution/access uplinks for the affected half: interface counters (CRC/input errors climbing? late collisions?), interface last-flap timers, logs showing repeated UPDOWN around 09:30, and STP topology-change counts — a flapping uplink makes spanning tree reconverge repeatedly, which feels like the whole segment 'blinking'.</li>
<li>The two classics with this signature: a <b>failing cable/optic (SFP)</b> on the uplink — CRC errors climbing proves it; and a <b>duplex/auto-negotiation mismatch</b> after someone 'tidied' a config — late collisions prove that one. Either way: swap optic/cable or fix negotiation, watch counters STOP incrementing (clear them first), then confirm with users.</li>
<li>Why no change was logged matters: cabling work, a cleaner knocking a patch panel, or a slowly dying transceiver don't file change requests. The postmortem action is monitoring interface error rates and flaps — this should have paged you before floor 2 did.</li></ul>`,
},
{
  id:"tk-dnsdown", sev:"P1", from:"Everyone at once", system:"Help Desk / Infra",
  title:"'The internet is down' — except it isn't",
  body:"Every app, intranet and website 'fails' company-wide at 11:02. You can ping 8.8.8.8 and the gateway from any PC. nslookup anything times out. The two DCs also run internal DNS.",
  asks:["The pings-work/names-fail split proves what immediately?","Why did BOTH DNS servers effectively fail at once — likely patterns?","Mitigation vs fix — what buys users back fastest?"],
  model:`<ul>
<li>IP connectivity proven end-to-end; <b>only name resolution is dead</b> — this is a DNS outage wearing an 'internet down' costume. The CCNA split (ping IP vs ping name) scales to company-wide incidents unchanged.</li>
<li>Both-at-once patterns: clients actually point at only ONE of them (the 'secondary' was never in DHCP options — single point of failure hiding in plain sight); both DCs took the same change window/patch and the DNS service didn't come back; or upstream forwarders died and everything non-cached expired together at the TTL boundary — explaining the sharp 11:02 edge.</li>
<li>Fastest user relief ≠ root fix: restart the DNS service on one DC and confirm resolution returns; if the service won't rise, temporarily point DHCP's DNS option at a working resolver (second DC or a standing internal fallback) and shorten lease renewal — users recover while you diagnose the broken box properly.</li>
<li>Verify from a client: name lookups answer, apps log in. Postmortem: why clients had one effective resolver, why no synthetic check was querying DNS every minute (the alert that should have beaten the users), and whether DC patching is staggered.</li></ul>`,
},
{
  id:"tk-diskchain", sev:"P1", from:"Night shift", system:"Sysadmin / SRE",
  title:"App down — and so is the monitoring that should have warned us",
  body:"The internal ERP died at 02:10. The monitoring dashboard for that host is ALSO blank since 01:40. SSH works. df -h: /var is 100%. A debug flag left on since Friday has been writing gigabytes of logs.",
  asks:["Reconstruct the chain of events from the timestamps.","What's the safe space-recovery move (and the unsafe one)?","This incident indicts the monitoring design — how?"],
  model:`<ul>
<li>Chain: Friday's debug flag → /var fills over the weekend → 01:40 the metrics agent (which spools to /var) dies first, blinding you → 02:10 the ERP can no longer write its own logs/temp files and crashes. The monitoring dying BEFORE the app is the tell that they shared the failing resource.</li>
<li>Safe recovery: <b>truncate</b> the giant log (or the >-redirect trick) so space frees instantly even while the process holds the file; the unsafe classic is <code>rm</code> on an open file — the handle keeps the space and df doesn't move (the Linux-track trap, live). Then: turn the debug flag OFF, restart the app and the monitoring agent, confirm both with their own logs.</li>
<li>Follow-through tonight, not someday: logrotate policy on that path, a separate partition or quota so logs can't starve the app, and the debug flag tied to a TTL/auto-revert.</li>
<li>The design indictment: disk-usage alerting lived ON the host it watched, in the same partition it should have warned about — monitoring must fail independently of what it monitors (external scrape, different volume). 'Who watches the watcher' is a design requirement, not philosophy.</li></ul>`,
},
{
  id:"tk-aclchange", sev:"P1", from:"Change window fallout", system:"NOC",
  title:"New 'security hardening' ACL — branch can reach nothing",
  body:"At 21:00 a change applied an extended ACL inbound on the HQ core interface facing the branch WAN link, meant to 'allow only business apps'. Since then the branch reaches nothing at HQ; HQ-to-branch pings also fail. The change ticket says 'tested in the lab'.",
  asks:["First action at 21:05, before any analysis?","The pings failing BOTH directions despite an 'inbound-only' ACL — explain the mechanism.","What did the lab test miss, and what makes ACL changes safe in future?"],
  model:`<ul>
<li>First action: <b>roll back</b> — remove the ACL from the interface (or apply the pre-change config). Correlated with a change window, restoration precedes diagnosis; the SRE first-10-minutes rule applies to network changes exactly.</li>
<li>Mechanism of the both-ways failure: traffic is bidirectional — HQ→branch requests leave fine, but the branch's <i>replies</i> arrive inbound at that interface and meet the ACL's <b>implicit deny any</b>, because the author listed a few 'business app' ports and forgot return traffic (established/ephemeral ports) plus underlying services: DNS, and ICMP itself — which is why even pings died. An ACL doesn't need to block a direction to kill a conversation; killing one side kills both.</li>
<li>The lab missed real traffic shape: it tested the allowed apps outbound, not replies, not DNS, not management protocols (and possibly cut the very routing protocol/session the WAN rides — the self-locking classic).</li>
<li>Safe-ACL practice going forward: counters review (<code>show access-lists</code> hit counts in a monitor-first pass), explicit permits for return/established traffic and infrastructure protocols, out-of-band access before touching the path you manage through, a scheduled auto-rollback (reload in N) armed before applying — and this is precisely what Project 7 automates: ACL changes as tested, staged pull requests.</li></ul>`,
},
{
  id:"tk-badrollout", sev:"P1", from:"ArgoCD alert + users", system:"Platform / K8s",
  title:"Fleet-wide CrashLoop after the 14:00 release",
  body:"Release 2.7 synced to prod at 14:00. Within 3 minutes every api pod is CrashLoopBackOff; the HPA is spawning more crashing pods. Old 2.6 pods are gone. kubectl logs --previous shows 'relation \"orders_v2\" does not exist'.",
  asks:["Immediate mitigation — and the one-line command family that does it?","Why didn't the rollout's safety mechanisms (probes, surge) save you?","The log line names the real process failure — what is it, and what's the durable fix?"],
  model:`<ul>
<li>Mitigate: roll back the workload — <code>kubectl rollout undo deployment/api</code> (or, GitOps-properly, <code>git revert</code> the manifest bump and let ArgoCD sync; do the kubectl undo first if users are down and reconcile Git immediately after so the agent doesn't re-apply 2.7). Verify: pods Running, error rate falling.</li>
<li>Safety didn't trigger because the failure mode beat it: if readiness probes pass at boot (app starts, THEN dies on first query) or maxUnavailable allowed full replacement before crashes accumulated, the rollout completes and only then collapses. Probes gate traffic — they don't validate schema compatibility. HPA adding replicas of a broken image is reconciliation faithfully amplifying a bad desired state.</li>
<li>The log line says the app needed a database migration ('orders_v2') that never ran — a <b>code/schema ordering failure</b>: 2.7 assumed a migration that wasn't applied (or runs after pods start). Durable fix: migrations as an explicit pre-deploy step (migration Job gating the rollout) and <b>backward-compatible releases</b> — code that runs against old AND new schema, so deploy order can never strand you. Plus a canary stage: 5% of pods on 2.7 would have crashed loudly without taking the fleet.</li>
<li>Postmortem actions: migration gate in the pipeline, canary + automatic rollback on error-rate, and an alert on CrashLoop count that pages before users do.</li></ul>`,
}
);
})();
