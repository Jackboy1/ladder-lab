// Ticket queue — help-desk and NOC practice scenarios with model approaches
(function(){
LL.tickets = [
{
  id:"tk-onepc", sev:"P2", from:"Accounts team", system:"Help Desk",
  title:"One PC lost connectivity — neighbours are fine",
  body:"A user's desktop cannot browse or receive email. The PCs around her work normally. She has already restarted the machine.",
  asks:["What does 'only one PC affected' tell you about where the fault is?","Which diagnostic output tells you the most, and what three fields do you read?","What address pattern would point at DHCP, and what then?"],
  model:`<ul>
<li>One machine affected while neighbours work → the fault is local to that drop: the PC's NIC settings, its patch cable, the wall port, or that one switch port.</li>
<li>Read the IP configuration output: the assigned IP, the default gateway, and the DHCP server fields.</li>
<li>A self-assigned 169.254.x.x address means DHCP never answered → renew the lease, try a known-good cable and port, and confirm the switch port/VLAN actually serves DHCP.</li>
<li>If the address looks normal, test reachability outward in layers: gateway first, then a public IP, then a name — a public IP that answers while names fail isolates DNS.</li>
<li>Document cause and fix in the ticket so the pattern is visible next time.</li></ul>`,
},
{
  id:"tk-newstarter", sev:"P3", from:"HR", system:"Help Desk",
  title:"New starter begins Monday — full setup",
  body:"A new analyst joins the finance team. HR asks IT to have her account, machine, email, shared drives and printing ready on day one.",
  asks:["List the setup checklist in order.","How should access to the finance share be granted, and why that way?","What one step do people forget that causes a day-one call?"],
  model:`<ul>
<li>Checklist: directory account created in the right OU → added to the team's security groups → machine imaged and joined to the domain → mailbox/sign-in verified → mapped drives arrive via group policy → printer added → MFA enrolled → a short welcome note with first-login steps.</li>
<li>Access goes through a security group that already sits on the share's permissions — never direct user-to-resource grants. People change; the group on the resource stays auditable.</li>
<li>Commonly forgotten: group membership applies at next sign-in — if the account was adjusted while she was logged in to the imaging session, she needs a fresh login before drives and shares appear. Also licence assignment for mail.</li></ul>`,
},
{
  id:"tk-slowapp", sev:"P2", from:"Operations manager", system:"Help Desk / Sysadmin",
  title:"\"The whole system is slow today\"",
  body:"Several users report the internal web app crawling since mid-morning. The server is a Linux VM you can shell into.",
  asks:["What do you look at first on the server, and what are you comparing?","How do you tell a memory problem from a CPU problem from a disk problem?","What's your check when the service looks fine but users still complain?"],
  model:`<ul>
<li>Start with the live picture: process viewer + load average, compared against the core count — load far above cores means a queue is forming.</li>
<li>Memory pressure shows as high memory use with heavy swapping; CPU-bound shows one or more processes pinned at the top; disk trouble shows in a nearly full filesystem or waits on I/O. Check free disk space early — a full log partition quietly breaks apps.</li>
<li>Service status and its recent journal entries tell you if the app itself is erroring or restarting; confirm its port is listening and that a local request answers quickly.</li>
<li>If the box is healthy and local requests are fast, the slowness lives between users and the server — network path, proxy, or an upstream dependency — so widen the investigation rather than restarting things at random.</li>
<li>Note the metric that proved the cause in the ticket; "restarted it" with no cause is a repeat visit waiting to happen.</li></ul>`,
},
{
  id:"tk-intdown", sev:"P1", from:"Monitoring", system:"NOC",
  title:"Alert: uplink interface down on access switch",
  body:"The NMS pages you: the uplink from access switch ASW-3 to distribution is down/down. Roughly forty users on that switch have no connectivity.",
  asks:["What does down/down mean versus administratively down?","Give your verification sequence on the switch.","If the interface was error-disabled, what's the professional recovery?"],
  model:`<ul>
<li>Status/protocol both down = a physical or remote-end problem (cable, SFP, far side). "Administratively down" would mean someone shut it — a config action, not a fault.</li>
<li>Sequence: check interface status output for the uplink → read the interface detail for errors and the last state change → check logs for the moment it dropped → inspect the far end's matching port → reseat or swap optics/cable if physical.</li>
<li>If error-disabled, read why (the log names the feature that tripped — e.g. a protection feature reacting to something plugged in). Fix the underlying cause first, then bounce the port with a shut / no shut to recover it. Re-enabling without fixing the cause just re-trips it.</li>
<li>Close out: confirm users are back, note cause, and if an optic or cable was swapped, label and log it.</li></ul>`,
},
{
  id:"tk-vlanreach", sev:"P2", from:"Project team", system:"NOC",
  title:"New VLAN 30 hosts can't reach VLAN 10 servers",
  body:"A project VLAN (30) was created yesterday on the L3 switch. Its hosts reach each other but not the server VLAN (10). VLAN 10 is unaffected otherwise.",
  asks:["What are the four usual suspects for new inter-VLAN reachability failures?","Which verification outputs settle each suspect?","Hosts can ping their gateway but nothing beyond — what does that narrow it to?"],
  model:`<ul>
<li>Suspects: the new SVI isn't up (an SVI needs at least one active port in its VLAN) · the trunk between switches doesn't carry VLAN 30 · host gateway settings point at the wrong address · an access control list or policy blocks the new subnet.</li>
<li>Verify with: interface brief for the SVI state · the trunk summary for allowed VLANs · the VLAN table for port membership · the routing table for the new subnet · the ACL counters for matches.</li>
<li>Gateway reachable but nothing past it → layer 2 is fine; the problem is routing or filtering above the gateway: missing return route on the other side, or policy between the VLANs.</li>
<li>Pattern worth keeping: new-segment problems are almost always "the new thing wasn't added everywhere it needed to be" — trunks, routing, policy, DHCP scope.</li></ul>`,
},
{
  id:"tk-s3site", sev:"P2", from:"Marketing", system:"Cloud",
  title:"New landing page returns 403 for visitors",
  body:"Marketing's static site (S3 behind CloudFront) shows AccessDenied to the public since last night's 'security tightening'.",
  asks:["What change pattern most likely caused this?","What's the correct architecture for private-bucket + public-site?","How do you verify at each hop?"],
  model:`<ul>
<li>Likely cause: public access was blocked on the bucket (correctly!) but the distribution was never granted its own read path — so the edge can no longer fetch objects.</li>
<li>Correct shape: bucket stays private with public access blocked; the CDN distribution gets origin access permission via the bucket policy, and only it can read; HTTPS terminates at the edge with a managed certificate.</li>
<li>Verify hop by hop: request through the site URL (edge) vs. the bucket endpoint directly — if the edge 403s but policy shows the distribution allowed, check the origin settings reference the right bucket/path and invalidate cached errors; also confirm a default root object is set so '/' maps to the index page.</li>
<li>Write up the fix so the next "tightening" keeps the origin-access grant in place.</li></ul>`,
},
{
  id:"tk-queue", sev:"P1", from:"Pager", system:"Cloud / SRE",
  title:"Orders backlog: queue depth climbing, customers waiting",
  body:"During a promo, the orders queue's depth has grown for 30 minutes. Workers are running. Checkout still accepts orders.",
  asks:["Is 'queue growing' an outage? What does the queue buy you here?","What are the three usual causes and their signals?","What do you do right now vs. after the incident?"],
  model:`<ul>
<li>Not an outage — it's the design working: the queue is absorbing a burst so checkout never drops orders. The question is whether drain rate will catch up before promises break.</li>
<li>Causes: consumers too few (healthy workers, high per-message time normal → scale workers out, ideally automatically on queue depth) · a slow dependency (worker logs show long waits on the payment/email call → raise concurrency carefully, add timeouts) · poison messages cycling (same message IDs reappearing, per-message errors → ensure a dead-letter queue catches them after N attempts so one bad order stops looping).</li>
<li>Now: scale consumers, confirm the dead-letter path, watch oldest-message age (the customer-facing number) rather than raw depth. After: postmortem — why didn't scaling fire on its own, and alert on message age, not just depth.</li></ul>`,
},
{
  id:"tk-cert", sev:"P2", from:"Support inbox", system:"Sysadmin / Cloud",
  title:"Browser warnings on the internal portal since this morning",
  body:"Users report 'connection not private' warnings on the internal HR portal. It worked Friday.",
  asks:["What's the most common cause of a sudden, everyone-at-once TLS warning?","How do you confirm in under a minute?","What prevents the repeat?"],
  model:`<ul>
<li>Most common: the certificate expired over the weekend (sudden + universal is the signature). Runners-up: the name on the cert doesn't match a newly-changed URL, or an incomplete chain after a renewal.</li>
<li>Confirm by inspecting the certificate the site presents — validity dates, the name it covers, and the chain. The browser's own certificate viewer answers it fastest.</li>
<li>Fix by renewing/deploying the certificate (and the full chain). Prevent with managed auto-renewing certificates where possible, and an expiry alert (30/14/7 days) where not. Add the cert's location + renewal steps to the runbook.</li></ul>`,
},
];
})();
