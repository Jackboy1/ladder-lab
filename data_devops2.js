// Phase-2 deepening pack — Docker hardening, day-2 Terraform, pipeline security, Helm + Compose→K8s case study, on-call/incidents
(function(){
const D = id => LL.tracks.find(t=>t.id===id);

/* ---------------- DOCKER ---------------- */
D("docker").lessons.push(
{t:"Debugging and hardening containers", html:`
<p>Running containers is lesson one; production asks two harder questions: <i>why is it broken?</i> and <i>how much damage can it do?</i></p>
<h3>The debugging ladder</h3>
<pre><code>docker ps -a                         # did it even stay up? Exit codes talk:
#   0 clean · 1 app error · 137 = 128+9 KILLED (OOM or docker kill) · 139 segfault · 126/127 bad CMD/not found
docker logs --tail 100 -f web        # stdout of PID 1 — the app's own story
docker inspect web                   # the full truth: env, mounts, network, restart policy
docker inspect -f '{{.State.OOMKilled}}' web      # the one-field version
docker exec -it web sh               # go inside: ls the config, ss -tlnp, env | sort
docker stats                         # live CPU/MEM per container — find the one eating the host
docker events --since 10m            # what the daemon did while you weren't looking</code></pre>
<p>Reflex for "container keeps restarting": <code>ps -a</code> for the exit code → <code>logs --tail</code> for the why → <code>inspect</code> for OOMKilled/env — same funnel you'll reuse as CrashLoopBackOff triage in Kubernetes, one layer down.</p>
<h3>Exit 137 deserves its own paragraph</h3>
<p>137 means SIGKILL: either you ran <code>docker kill</code>, or the kernel's OOM killer fired because the container hit its memory limit. <code>docker inspect</code> shows <code>OOMKilled: true</code>. Fix = raise <code>--memory</code>, fix the leak, or both — and notice this is exactly K8s's OOMKilled with the same meaning.</p>
<h3>Hardening the image (what scanners and reviewers flag)</h3>
<pre><code>FROM python:3.12-slim
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER app                          # ← non-root: a breakout lands as 'app', not root
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')" || exit 1
CMD ["python", "main.py"]</code></pre>
<ul>
<li><b>USER non-root</b> — the single highest-value line; root-in-container plus one kernel bug = root on the host.</li>
<li><b>HEALTHCHECK</b> turns "running" into "actually serving" (<code>docker ps</code> shows healthy/unhealthy; orchestrators act on it — it previews K8s probes).</li>
<li><b>Pin bases</b> (<code>python:3.12.6-slim</code>, or by digest) — ":latest" builds are unreproducible by definition.</li>
<li><b>Scan</b>: <code>docker scout cves</code> / Trivy in CI — your pipeline (CI/CD track) should fail on criticals, which is also an interview-ready sentence.</li>
<li>Runtime belts: <code>--read-only</code> root fs with a tmpfs for /tmp, <code>--cap-drop ALL</code> then add back only what's needed, resource limits always (<code>--memory 256m --cpus 0.5</code>).</li>
</ul>
<h3>Slimming — why your image is 1.2 GB and what to do</h3>
<pre><code>docker history myapp:1.0             # layer-by-layer size — find the fat one
# usual culprits and fixes:
#  full base image        → -slim / distroless / alpine (mind musl gotchas)
#  build tools shipped    → multi-stage: compile in stage 1, COPY --from the artifact
#  forgot .dockerignore   → venv/, .git/, datasets ride into the context
#  apt caches             → apt-get install --no-install-recommends && rm -rf /var/lib/apt/lists/*</code></pre>
<p>Small images aren't vanity: faster pulls = faster scaling and deploys, and fewer packages = fewer CVEs for the scanner to find. Typical win: 1.2 GB → 150 MB with multi-stage + slim base.</p>`});

D("docker").quiz.push(
{q:"A container exits with code 137. Most likely:", o:["Clean shutdown","Segfault","SIGKILL — OOM killer hit the memory limit (inspect shows OOMKilled)","Bad CMD path"], a:2, why:"137 = 128+9. Check docker inspect OOMKilled; raise --memory or fix the leak. (139=segfault, 126/127=command problems.)"},
{q:"USER app in a Dockerfile exists because…", o:["It speeds builds","A container breakout then lands as an unprivileged user, not root","pip requires it","Compose needs it"], a:1, why:"Root-in-container + one kernel/runtime bug = root on the host. Non-root is the cheapest big win."},
{q:"docker ps says Up, users say down. The feature that closes that gap:", o:["--restart always","HEALTHCHECK — 'running' becomes 'actually answering'","EXPOSE","docker stats"], a:1, why:"Health checks probe the app itself; orchestrators (and K8s probes, same idea) act on the result."},
{q:"Your image is 1.2GB. First diagnostic:", o:["docker system prune","docker history <image> to find the fat layers","Rebuild with :latest","Push anyway"], a:1, why:"history shows per-layer size — then multi-stage, slim base, .dockerignore and cache cleanup target the real culprits."},
{q:"Pinning FROM python:3.12.6-slim (vs :latest) buys you…", o:["Smaller image","Reproducible builds — today's rebuild equals last month's","Faster pip","Security scanning"], a:1, why:"Mutable tags make builds non-deterministic; pins (or digests) make them auditable and repeatable."},
{q:"--cap-drop ALL then adding back only NET_BIND_SERVICE is an example of…", o:["Multi-stage building","Least privilege at runtime","Layer caching","Health checking"], a:1, why:"Capabilities are root's powers sliced up; drop everything, re-grant the one the app truly needs."}
);
D("docker").cards.push(
{f:"Exit codes", b:"0 clean · 1 app error · 137 SIGKILL/OOM (inspect OOMKilled) · 139 segfault · 126/127 CMD problems."},
{f:"Container triage funnel", b:"ps -a (exit code) → logs --tail (why) → inspect (env/OOM/mounts) → exec -it (inside) → stats."},
{f:"Hardening five", b:"USER non-root · pinned base · HEALTHCHECK · resource limits · scan in CI (fail on criticals)."},
{f:"Slimming kit", b:"docker history → multi-stage · slim/distroless base · .dockerignore · clean apt caches."},
{f:"Runtime belts", b:"--read-only + tmpfs /tmp · --cap-drop ALL (+add minimal) · --memory/--cpus always."},
{f:"HEALTHCHECK", b:"Turns 'Up' into 'serving'; previews K8s liveness/readiness."}
);

/* ---------------- TERRAFORM ---------------- */
D("terraform").lessons.push(
{t:"Day-2 Terraform: import, state surgery, workspaces, plan-in-PR", html:`
<p>Writing fresh HCL is day one. Real estates arrive with click-built resources, renames, and teammates — day-2 skills are what separate "did a tutorial" from "ran it at work".</p>
<h3>Adopting click-built resources: import</h3>
<pre><code># modern (1.5+): declarative import blocks — reviewable, repeatable
import {
  to = aws_security_group.web
  id = "sg-0a1b2c3d4e"
}
resource "aws_security_group" "web" { ... }   # then: terraform plan until it shows NO changes
# classic CLI form: terraform import aws_security_group.web sg-0a1b2c3d4e</code></pre>
<p>The loop: write a best-guess resource block → import → <code>plan</code> → copy reality's attributes into the code until the plan is empty. An empty plan is the proof of adoption. (Bulk helper: run <code>plan -generate-config-out=generated.tf</code> with import blocks to draft the HCL for you, then clean it.)</p>
<h3>State surgery — rename without destroy</h3>
<pre><code>You renamed aws_instance.web → aws_instance.frontend. Plan now says: DESTROY web, CREATE frontend. 😱
# modern: a moved block IN the code (reviewable, survives in history)
moved { from = aws_instance.web, to = aws_instance.frontend }
# classic: terraform state mv aws_instance.web aws_instance.frontend

terraform state list / show ADDR      # inspect what Terraform thinks it owns
terraform state rm ADDR               # forget (stop managing) WITHOUT destroying
terraform apply -replace=ADDR         # force recreate one resource (old: taint)
terraform refresh                     # resync state attrs from reality (plan does this too)</code></pre>
<p>Rule: the state file is a database — you operate on it with these commands, never a text editor.</p>
<h3>One codebase, many environments</h3>
<div class="tablewrap"><table>
<tr><th>Pattern</th><th>How</th><th>Verdict</th></tr>
<tr><td><b>Directories per env</b> (envs/dev, envs/prod calling shared modules)</td><td>Separate state & tfvars per dir</td><td>Industry default: explicit, blast-radius-isolated, different sizes per env are natural</td></tr>
<tr><td>Workspaces</td><td>terraform workspace new dev — same code, state keyed per workspace</td><td>Fine for near-identical copies; risky when prod needs to differ — one wrong 'workspace select' before apply is the horror story</td></tr>
<tr><td>Terragrunt / stacks</td><td>Wrapper generating backends & inputs</td><td>Worth knowing the name at scale</td></tr>
</table></div>
<h3>Terraform in the pipeline (this is Project 7's spine)</h3>
<pre><code>on PR:    terraform fmt -check · validate · plan -out=tf.plan   → plan posted as a PR comment
          + tflint / checkov (policy: "no SG open to 0.0.0.0/0:22")
on merge: apply tf.plan              ← apply EXACTLY the reviewed plan artifact
auth:     cloud creds via OIDC role assumption, not long-lived secrets (CI/CD lesson next door)
locking:  remote state w/ lock — two applies can't collide; CI is the only applier in prod</code></pre>
<p>That "humans review a plan, machines apply it" loop is infrastructure code review — the same cultural move GitOps makes for Kubernetes. Interview soundbite: "nobody applies from a laptop; the pipeline applies the artifact the reviewer approved."</p>
<h3>Secrets & drift, revisited with day-2 eyes</h3>
<ul>
<li>Inputs via env/SSM/Vault at plan time; remember <b>state stores values in clear</b> — lock the backend down (encryption, access policy) like the secret store it accidentally is.</li>
<li>Scheduled <code>plan</code> (cron pipeline) = a drift detector: a non-empty nightly plan pages someone before the surprise does.</li>
<li><code>prevent_destroy</code> lifecycle on the database; <code>ignore_changes</code> for fields another system legitimately mutates (e.g. ASG desired_count under autoscaling — otherwise Terraform and the autoscaler fight forever, a classic).</li>
</ul>`});

D("terraform").quiz.push(
{q:"You renamed a resource and plan shows destroy+create. Correct move:", o:["Apply, it's fine","A moved block (or terraform state mv) so state follows the rename","Delete the state","terraform refresh"], a:1, why:"The name is the state key; moved/state mv re-points it so reality is untouched."},
{q:"terraform state rm does what?", o:["Destroys the resource","Stops managing it — removed from state, left running in the cloud","Deletes the backend","Rolls back"], a:1, why:"Forget ≠ destroy. Use when handing a resource to another stack/team."},
{q:"Import is finished when…", o:["The import command returns 0","terraform plan shows NO changes against your written block","Apply succeeds","State list shows it"], a:1, why:"An empty plan proves code == reality; until then your HCL doesn't match what you adopted."},
{q:"Teams usually prefer per-env directories over workspaces because…", o:["Workspaces cost money","A forgotten 'workspace select' applies dev intentions to prod; dirs make the target explicit and lets envs differ","Workspaces can't use modules","Directories are faster"], a:1, why:"Explicit beats modal. Workspaces suit near-identical throwaway copies."},
{q:"ASG desired_count keeps flip-flopping between Terraform and the autoscaler. Fix:", o:["Bigger ASG","lifecycle ignore_changes on desired_count","Remove the ASG","Run apply hourly"], a:1, why:"Two controllers, one field: tell Terraform that field belongs to the autoscaler."},
{q:"In the PR pipeline, merge should apply…", o:["A fresh plan computed at merge time","The exact saved plan artifact the reviewer approved (plan -out, then apply that file)","Whatever main contains","Nothing automatically"], a:1, why:"Re-planning at merge can differ from what was reviewed; applying the artifact closes that gap."}
);
D("terraform").cards.push(
{f:"Import loop", b:"import block (or CLI) → plan → fix HCL → repeat until plan is EMPTY. -generate-config-out drafts it."},
{f:"moved / state mv", b:"Renames re-point state instead of destroy+create."},
{f:"state rm vs destroy", b:"Forget (leave running) vs delete for real."},
{f:"-replace", b:"terraform apply -replace=ADDR — surgically recreate one resource (successor to taint)."},
{f:"Envs pattern", b:"Directories per env calling shared modules > workspaces (modal-select risk)."},
{f:"TF pipeline", b:"PR: fmt/validate/plan(+policy scan) posted · merge: apply the saved plan · OIDC creds · state lock; nobody applies from laptops."},
{f:"Two-controller fields", b:"ignore_changes where autoscalers/ops legitimately mutate; prevent_destroy on crown jewels."},
{f:"Drift detector", b:"Nightly scheduled plan ≠ empty → alert. State stores secrets in clear — guard the backend."}
);

/* ---------------- CI/CD ---------------- */
D("cicd").lessons.push(
{t:"Pipeline security & speed: OIDC, environments, caching, matrices", html:`
<p>The first workflow proves the idea; this lesson makes it deployable to prod without keys lying around — the part security reviews actually check.</p>
<h3>Kill the long-lived cloud keys: OIDC</h3>
<pre><code># instead of AWS_SECRET_ACCESS_KEY in repo secrets (rotates never, leaks forever):
permissions: { id-token: write, contents: read }
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/gha-deployer
      aws-region: eu-west-2
# GitHub mints a short-lived OIDC token; AWS's trust policy says
# "repo:akpevwe/net-auditor:ref:refs/heads/main may assume this role" —
# credentials exist for minutes, scoped to one repo+branch, nothing stored.</code></pre>
<p>This is the IAM-roles-not-keys rule from the AWS track, extended to robots. Same mechanism exists for GCP/Azure. Interview line: "my pipelines hold zero cloud secrets; they assume roles via OIDC."</p>
<h3>Environments, approvals, and protected deploys</h3>
<pre><code>jobs:
  deploy-prod:
    environment: production        # ← gate: required reviewers, wait timer, env-scoped secrets
    needs: [test, deploy-staging]
    if: github.ref == 'refs/heads/main'</code></pre>
<ul>
<li>Env-scoped secrets mean staging creds literally cannot reach a prod job.</li>
<li>Branch protection (checks + review required) makes CI the gate, not a suggestion; the deploy history per environment becomes your change log.</li>
<li>Pin third-party actions to a SHA (<code>uses: some/action@3f1a…</code>) for supply-chain hygiene; least-privilege the default <code>GITHUB_TOKEN</code> via <code>permissions:</code>.</li>
</ul>
<h3>Make it fast (slow CI is ignored CI)</h3>
<pre><code>- uses: actions/cache@v4            # or setup-python's cache: pip
  with: { path: ~/.cache/pip, key: pip-\${{ hashFiles('requirements.txt') }} }
- uses: docker/build-push-action@v6
  with: { cache-from: type=gha, cache-to: type=gha,mode=max }   # layer cache across runs
strategy:
  matrix: { python: ["3.11", "3.12"] }     # parallel fan-out; fail-fast: false to see all results
concurrency: { group: deploy-prod, cancel-in-progress: false }  # never two prod deploys at once</code></pre>
<h3>Artifacts & provenance</h3>
<pre><code>build once → push image tagged \${{ github.sha }} → EVERY later stage deploys that digest
upload-artifact / download-artifact pass files between jobs (fresh VMs share nothing)
test reports as artifacts = debuggable failures; image digest in the deploy log = provenance</code></pre>
<p><b>The shape to memorise</b>: lint+test (PR) → build+scan once → deploy staging → smoke test → gated prod deploy of the <i>same digest</i>, under a concurrency lock, with OIDC-assumed credentials. Say that sentence in an interview and the follow-ups write themselves.</p>`});

D("cicd").quiz.push(
{q:"OIDC in pipelines replaces…", o:["YAML","Long-lived cloud keys in secrets — the pipeline assumes a role with minutes-long credentials scoped to repo+branch","Branch protection","Docker login"], a:1, why:"Nothing stored, nothing to leak or rotate; trust policy pins exactly which repo/ref may assume."},
{q:"environment: production on a job gives you…", o:["Faster runners","Required approvals, wait timers, and env-scoped secrets staging jobs can't read","Auto-rollback","A bigger VM"], a:1, why:"Environments are the gate + secret boundary + per-env deploy history."},
{q:"Why deploy the image digest built once, rather than rebuilding per stage?", o:["Rebuilds are slow only","What you tested is byte-for-byte what reaches prod — provenance","Registries require it","Caching breaks otherwise"], a:1, why:"Rebuilding risks drift between tested and deployed artifacts; build-once/promote is the principle."},
{q:"Pinning actions to a commit SHA guards against…", o:["Slow checkouts","A compromised action tag shipping malicious updates into your pipeline (supply chain)","Merge conflicts","Rate limits"], a:1, why:"Tags are mutable; SHAs aren't. Same logic as pinning Docker bases."},
{q:"concurrency: group: deploy-prod exists so that…", o:["Jobs run faster","Two prod deploys can never interleave","Secrets rotate","Caches persist"], a:1, why:"Serialised deploys prevent half-of-A-plus-half-of-B states during overlapping merges."},
{q:"matrix: python [3.11, 3.12] does what?", o:["Picks the faster one","Runs the job in parallel once per version","Installs both in one job","Only lints"], a:1, why:"Fan-out testing across versions/OSes in parallel; fail-fast:false to see every result."}
);
D("cicd").cards.push(
{f:"OIDC deploys", b:"id-token: write + configure-aws-credentials role-to-assume → minutes-long creds, zero stored keys."},
{f:"Environments", b:"Approvals + wait timers + env-scoped secrets + per-env deploy history. Prod is a gated job."},
{f:"Build once, promote", b:"Tag by github.sha; every stage deploys that digest — tested == shipped."},
{f:"Supply-chain pins", b:"Actions @SHA · minimal permissions: on GITHUB_TOKEN · scan images before push."},
{f:"Speed kit", b:"deps cache keyed on lockfile hash · docker layer cache (type=gha) · matrices · path filters."},
{f:"Concurrency lock", b:"group: deploy-prod — one prod deploy at a time, ever."}
);

/* ---------------- KUBERNETES ---------------- */
D("k8s").lessons.push(
{t:"Packaging: Helm (and kustomize) without the mystique", html:`
<p>Raw YAML works until app #2 and environment #2. Then you're copy-pasting 400 lines and changing six values — the problem Helm and kustomize exist to solve, each differently.</p>
<h3>Helm: charts = templates + values</h3>
<pre><code>mychart/
├── Chart.yaml            # name, version, appVersion
├── values.yaml           # the knobs users turn (defaults)
└── templates/
    ├── deployment.yaml   # YAML with {{ .Values.* }} holes
    └── service.yaml

# templates/deployment.yaml (excerpt)
  replicas: {{ .Values.replicaCount }}
  containers:
    - name: {{ .Chart.Name }}
      image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
      resources: {{- toYaml .Values.resources | nindent 10 }}</code></pre>
<pre><code>helm install auditor ./mychart -f values-prod.yaml      # render + apply as a tracked RELEASE
helm upgrade auditor ./mychart --set image.tag=1.5      # change = new revision
helm rollback auditor 3                                 # releases remember history
helm template ./mychart | less                          # render WITHOUT applying — debug here
helm repo add bitnami https://charts.bitnami.com/bitnami && helm install db bitnami/postgresql
helm ls · helm get values auditor</code></pre>
<p>Two superpowers: <b>values per environment</b> (one chart, values-dev/values-prod) and <b>the ecosystem</b> — Postgres, Prometheus, ingress-nginx arrive as maintained charts instead of 1,000 lines you hand-roll. Releases + rollback give you deployment history inside the cluster.</p>
<h3>kustomize: patches, no templates</h3>
<pre><code>base/                 # plain, valid YAML (kubectl applies it as-is)
overlays/prod/kustomization.yaml:
  resources: ["../../base"]
  patches:  [{ path: replicas.yaml }]      # overlay changes ONLY the diff
kubectl apply -k overlays/prod             # built into kubectl</code></pre>
<p>Choosing: <b>Helm</b> for distributing/installing software and many-knob apps; <b>kustomize</b> for your own manifests with small per-env diffs (and it's GitOps-native — ArgoCD renders both). Plenty of teams use Helm for third-party, kustomize for in-house; saying exactly that is a solid interview answer.</p>
<h3>Where this meets the capstone</h3>
<p>Project 6's repo becomes: your app chart (or base+overlays) in the manifests repo → CI bumps the image tag value → ArgoCD renders and syncs. Helm/kustomize is the layer that makes "config per environment" a one-file diff instead of a fork.</p>`},

{t:"Case study: migrating the Compose stack to Kubernetes", html:`
<p>The rite of passage: take the api+db compose file from the Docker track and run it properly on a cluster. Every concept you've met clicks into place as a translation.</p>
<h3>The translation table</h3>
<div class="tablewrap"><table>
<tr><th>Compose</th><th>Kubernetes</th><th>Why it changes</th></tr>
<tr><td>services: api</td><td>Deployment (replicas, rolling updates)</td><td>Compose runs 1 container; K8s manages a fleet of them</td></tr>
<tr><td>DNS by service name</td><td>Service (ClusterIP) — same name habit survives!</td><td>Pods churn; the Service VIP doesn't</td></tr>
<tr><td>ports: 8000:8000</td><td>Service + Ingress (host/path, TLS)</td><td>One entry point for many apps</td></tr>
<tr><td>environment:</td><td>ConfigMap (+ Secret for creds)</td><td>Config becomes a managed object, mounted or env-injected</td></tr>
<tr><td>volumes: pgdata</td><td>PersistentVolumeClaim (+ StorageClass)</td><td>Storage provisioned by the cluster, follows the pod</td></tr>
<tr><td>depends_on</td><td>Readiness probes (+ init containers)</td><td>"Started" ≠ "ready"; probes gate traffic honestly</td></tr>
<tr><td>restart: always</td><td>The reconciliation loop itself</td><td>It's not a flag; it's the whole system</td></tr>
</table></div>
<h3>The migrated manifests (api half, abridged but real)</h3>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
      - name: api
        image: ghcr.io/akpevwe/net-auditor:1.5
        envFrom:
        - configMapRef: { name: api-config }     # DB_HOST=db etc.
        - secretRef:    { name: api-secrets }    # DB_PASS
        readinessProbe: { httpGet: { path: /ready,   port: 8000 } }
        livenessProbe:  { httpGet: { path: /healthz, port: 8000 } }
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits:   { cpu: 500m, memory: 256Mi }
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec: { selector: { app: api }, ports: [{ port: 80, targetPort: 8000 }] }
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: api }
spec:
  rules:
  - host: auditor.coscharis.dev
    http: { paths: [{ path: /, pathType: Prefix,
             backend: { service: { name: api, port: { number: 80 } } } }] }</code></pre>
<p>The database gets a <b>StatefulSet + PVC</b> — or, the grown-up answer: managed Postgres (RDS) outside the cluster, because "do I really want to operate a database on K8s?" is a question with a famous default. Say both options and why; that's architecture maturity.</p>
<h3>Migration order that doesn't hurt</h3>
<ol>
<li>Image already in a registry (done in Docker track) — compose <code>build:</code> has no K8s equivalent.</li>
<li>Config out of the image → ConfigMap/Secret objects first; app unchanged (12-factor pays off here).</li>
<li>Stateless api first: Deployment+Service, scale 1 → test via port-forward (<code>kubectl port-forward svc/api 8080:80</code>) → replicas 3.</li>
<li>State last: PVC/StatefulSet or external DB; point api's ConfigMap at it.</li>
<li>Ingress + TLS; delete the NodePort scaffolding.</li>
<li>Only now: HPA, PodDisruptionBudget, NetworkPolicies — production seasoning on a working base.</li>
</ol>
<div class="callout">Hands-on: the new <b>K8s lab “Ship a new service”</b> runs this story's first half live — create the deployment, watch pods appear, expose it, scale it, and watch reconciliation replace a pod you kill.</div>`});

D("k8s").quiz.push(
{q:"Compose's depends_on maps in K8s to…", o:["A Deployment flag","Readiness probes (and init containers) — 'started' isn't 'ready'","Service ordering","Namespaces"], a:1, why:"K8s starts things concurrently; probes gate traffic until the dependency is truly answerable."},
{q:"helm template ./chart is used to…", o:["Install quietly","Render the YAML locally WITHOUT applying — the debugging step","Rollback","Package for a repo"], a:1, why:"See exactly what your values produce before the cluster does."},
{q:"One chart, values-dev.yaml and values-prod.yaml is Helm's answer to…", o:["Secrets","Per-environment configuration without forking manifests","RBAC","Autoscaling"], a:1, why:"Templates + values: envs differ by a values file, not a copy of the YAML."},
{q:"helm rollback works because…", o:["It re-runs CI","Releases store revision history in-cluster","Git is required","Pods cache YAML"], a:1, why:"Each install/upgrade is a numbered revision Helm can restore."},
{q:"kustomize's pitch versus Helm:", o:["Faster pods","Plain-YAML bases with per-env patch overlays, no templating language, built into kubectl","Better databases","Windows support"], a:1, why:"Common split: Helm for third-party software, kustomize for your own manifests. ArgoCD renders both."},
{q:"Running the production database IN the cluster vs managed (RDS):", o:["Always in-cluster","StatefulSet+PVC works, but managed DBs outsource backups/failover/patching — state the trade-off","Never possible","Only with Helm"], a:1, why:"The mature answer names both and picks per context — operating stateful systems is the hard part of K8s."},
{q:"kubectl port-forward svc/api 8080:80 is for…", o:["Production ingress","Testing a ClusterIP service from your laptop before any Ingress exists","Scaling","TLS"], a:1, why:"A temporary tunnel through the API server — migration step 3's smoke test."},
{q:"envFrom: configMapRef/secretRef does what?", o:["Mounts volumes","Injects every key of the ConfigMap/Secret as container env vars","Creates the ConfigMap","Restarts pods"], a:1, why:"The direct translation of Compose's environment: block, now as managed objects."}
);
D("k8s").cards.push(
{f:"Compose→K8s table", b:"service→Deployment · name-DNS→Service · ports→Ingress · environment→ConfigMap/Secret · volume→PVC · depends_on→readiness · restart→reconciliation."},
{f:"Helm anatomy", b:"Chart.yaml + values.yaml + templates/{{ .Values.* }} → install/upgrade/rollback as tracked releases."},
{f:"Helm debug", b:"helm template renders locally; helm get values shows what a release runs with."},
{f:"Helm vs kustomize", b:"Distribute/many-knob apps → Helm. Own manifests, small env diffs → kustomize (apply -k). Teams mix."},
{f:"Migration order", b:"Registry image → config out (CM/Secret) → stateless Deployment+Service → state (PVC or RDS) → Ingress/TLS → HPA/PDB/NetPol."},
{f:"port-forward", b:"kubectl port-forward svc/x 8080:80 — laptop tunnel for pre-Ingress testing."},
{f:"DB on K8s?", b:"Possible (StatefulSet+PVC); managed DB outsources the hard ops. Name the trade-off."}
);
D("k8s").labs.push("k8s-deploy");

/* ---------------- SRE ---------------- */
D("sre").lessons.push(
{t:"On-call & incident response: severity, roles, comms, runbooks", html:`
<p>Postmortems (last lesson) happen after; this is <i>during</i> — the 02:00 craft that interviews probe with "walk me through an incident you'd run".</p>
<h3>Severity levels — agree them before you need them</h3>
<div class="tablewrap"><table>
<tr><th>Sev</th><th>Meaning</th><th>Response</th></tr>
<tr><td><b>SEV1</b></td><td>Customer-facing outage / data at risk (checkout down)</td><td>Page now · incident commander · comms cadence · all-hands allowed</td></tr>
<tr><td><b>SEV2</b></td><td>Major degradation, workaround exists (p99 5×, one region limping)</td><td>Page on-call · fix within hours · stakeholder updates</td></tr>
<tr><td>SEV3</td><td>Minor impact / single customer / risk building</td><td>Ticket + business hours</td></tr>
<tr><td>SEV4</td><td>Cosmetic / internal</td><td>Backlog</td></tr>
</table></div>
<p>Two rules that keep teams sane: <b>declare early, downgrade cheerfully</b> (a SEV2 that turns out minor costs nothing; a "let's wait" that was a SEV1 costs the quarter), and the <b>error budget</b> (SLO lesson) decides how aggressive mitigation gets.</p>
<h3>Roles in a real incident</h3>
<ul>
<li><b>Incident Commander</b>: owns the incident, not the keyboard — coordinates, decides, delegates. Explicitly NOT debugging.</li>
<li><b>Ops lead(s)</b>: hands on the system, one investigation thread each.</li>
<li><b>Comms lead</b>: stakeholder/status-page updates on a cadence ("update in 30 min even if nothing changed") so leadership doesn't page the debuggers.</li>
<li>Scribe: timeline as it happens — the postmortem writes itself later.</li>
</ul>
<p>Small-team version: one person wears IC+comms, one debugs — but the <i>separation of deciding from typing</i> survives even at two people, and naming that is a senior signal.</p>
<h3>The first 10 minutes, scripted</h3>
<pre><code>1. Acknowledge the page (unacked pages escalate — that's a feature)
2. Is it real & user-facing? Dashboards: RED on top (rate/errors/duration), deploy markers overlaid
3. "What changed?" — last deploy/config/flag/infra change.
   If correlated: ROLL BACK FIRST, diagnose later. Mitigation beats diagnosis mid-incident.
4. Declare severity in the incident channel; start the timeline; assign roles
5. Stabilise with the blunt instruments: rollback · scale out · shed load/feature-flag off · fail over
6. Only once users are breathing: root-cause hunting (that's postmortem fuel, not 2am work)</code></pre>
<h3>Runbook anatomy — write them before the incident</h3>
<pre><code># Runbook: orders-queue-backlog
Symptoms:   oldest-message age > 5 min (alert ORD-AGE-HIGH)
Dashboards: grafana/d/orders  ·  Logs: journalctl -u worker / kubectl logs -l app=worker
Checks:     1) workers healthy? kubectl get pods -l app=worker
            2) dependency slow? p99 on payment-gateway panel
            3) poison message? DLQ depth
Mitigations: scale workers (kubectl scale deploy worker --replicas=…)
             · enable queue-drain feature flag · redrive DLQ after fix
Escalate:   payments vendor if gateway p99 > 2s for 15m (contact in oncall notes)
Known failure modes: links to past postmortems</code></pre>
<p>Test: a competent engineer who has never seen this service should get to mitigation using only the runbook. Every incident that needed tribal knowledge produces a runbook PR — and every runbook that gets executed twice is an automation candidate (the toil loop from last lesson closes).</p>
<h3>Humane on-call is an engineering output</h3>
<p>Rotations with real handoffs · every page actionable (alert-craft lesson) · page counts tracked and treated as a bug when high · follow-the-sun when teams span zones. "Our on-call got quieter quarter over quarter" is one of the strongest things an SRE can say in an interview — it means the system, and the alerting, got engineered.</p>`});

D("sre").quiz.push(
{q:"Mid-incident, the error rate started right after a deploy. The move:", o:["Debug the root cause live","Roll back first; diagnose from the postmortem timeline later","Scale the database","Mute the alert"], a:1, why:"Mitigation beats diagnosis while users bleed; correlation with a change is enough to act."},
{q:"The Incident Commander's defining property:", o:["Best debugger types fastest","Owns coordination and decisions, explicitly NOT hands-on-keyboard","Writes the postmortem alone","Most senior title"], a:1, why:"Separating deciding from typing prevents the rabbit-hole-with-no-driver failure mode."},
{q:"'Declare early, downgrade cheerfully' exists because…", o:["SEV1s are fun","A too-high severity costs nothing; a delayed declaration costs response time and trust","Paging is free","Auditors require it"], a:1, why:"Asymmetric costs: over-declare and relax beats under-declare and scramble."},
{q:"A good runbook is proven by…", o:["Length","A stranger to the service reaching mitigation using only it","Being in Confluence","Having diagrams"], a:1, why:"Runbooks exist for 2am-you and new on-callers; tribal-knowledge gaps are bugs to PR away."},
{q:"A runbook has been executed by hand three times this quarter. SRE response:", o:["Laminate it","Automate it — repeated executable runbooks are toil by definition","Add more steps","Rotate on-call faster"], a:1, why:"The runbook→script→automation ladder is the toil-elimination loop in practice."},
{q:"The comms lead's cadence promise ('update every 30 min, even if nothing changed') exists to…", o:["Fill the channel","Keep stakeholders informed so they don't page the people debugging","Satisfy legal","Train juniors"], a:1, why:"Unanswered execs interrupt responders; a cadence buys the debuggers silence."}
);
D("sre").cards.push(
{f:"Severity ladder", b:"SEV1 outage/page-now+IC · SEV2 major-degraded/hours · SEV3 minor/ticket · SEV4 cosmetic. Declare early, downgrade cheerfully."},
{f:"Incident roles", b:"IC decides (never types) · ops debug · comms updates on cadence · scribe timelines. Separation survives even at 2 people."},
{f:"First 10 minutes", b:"Ack → real? (RED + deploy markers) → what changed? rollback first → declare+roles → blunt mitigations → RCA later."},
{f:"Blunt instruments", b:"Rollback · scale out · feature-flag off / shed load · fail over."},
{f:"Runbook anatomy", b:"Symptoms · dashboards/logs · ordered checks · mitigations · escalation contacts · past postmortems. Stranger-executable."},
{f:"On-call health", b:"Actionable pages only, tracked page counts, real handoffs — 'on-call got quieter' is an engineering result."}
);

/* ---------------- new K8s lab ---------------- */
LL.labs["k8s-deploy"] = {
  env:"k8s", title:"Ship a new service: create, expose, scale", points:60,
  scenario:"The audit team wants a status page in the cluster. Do the compose→K8s story's first half live: create the deployment imperatively, verify its pods, give it a stable Service, scale for launch, and watch reconciliation cover a pod you kill.",
  objectives:[
    { text:"Create it: kubectl create deployment web --image=nginx:1.27 --replicas=2", done:st=>st.created.includes("web")&&st.deploys.web },
    { text:"Verify the pods arrived (kubectl get pods — look for web-…)", done:st=>st.history.some(h=>/kubectl\s+get\s+po/.test(h))&&st.pods.some(p=>p.name.startsWith("web-")) },
    { text:"Give it a stable address: kubectl expose deployment web --port=80", done:st=>st.exposed.includes("web")&&st.services.web&&st.services.web.port===80 },
    { text:"Confirm the Service: kubectl get svc (web → ClusterIP)", done:st=>st.history.some(h=>/kubectl\s+get\s+(svc|service)/.test(h))&&st.services.web },
    { text:"Launch load: kubectl scale deployment web --replicas=4", done:st=>st.deploys.web&&st.deploys.web.replicas===4 },
    { text:"Prove reconciliation: delete one web pod, then get pods shows 4 again", done:st=>st.deletedPods.some(n=>n.startsWith("web-"))&&st.pods.filter(p=>p.name.startsWith("web-")).length===4 },
  ],
};
})();
