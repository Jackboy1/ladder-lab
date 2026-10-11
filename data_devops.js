// Phase 2 — Docker, Terraform, CI/CD, Kubernetes, Observability & GitOps/SRE (Ladder steps 6–11)
(function(){

LL.tracks.push({
  id:"docker", phase:2, title:"Docker", tag:"Ladder step 6", hours:"5–7h",
  blurb:"The step that makes Kubernetes learnable. Images vs containers, Dockerfiles, networks, volumes, Compose — and Project 4: containerise something of yours.",
  lessons:[
  {t:"Containers, images, and the Docker workflow", html:`
<h3>The problem Docker solves</h3>
<p>“Works on my machine” dies when the machine ships with the app. A <b>container</b> packages your code + runtime + libraries + config into one unit that runs identically on your laptop, a server, or EKS. Unlike a VM it shares the host <b>kernel</b> — no guest OS — so it's megabytes and starts in milliseconds. Isolation comes from Linux namespaces (its own view of processes/network/filesystem) and cgroups (CPU/RAM limits): your Linux track, weaponised.</p>
<h3>Image vs container — the distinction everything rests on</h3>
<p>An <b>image</b> is the frozen template (read-only layers). A <b>container</b> is a running instance of it with a thin writable layer on top. Class vs object. Delete the container, the image remains; anything written inside the container and not volumed out dies with it.</p>
<pre><code>docker pull nginx:1.27          # image from a registry (Docker Hub, ECR)
docker run -d --name web -p 8080:80 nginx:1.27   # -d detached, host:container port map
docker ps                        # running;  docker ps -a  includes stopped
docker logs -f web               # stdout of PID 1 — containers log to stdout by design
docker exec -it web bash         # shell INSIDE the container (your debugging door)
docker stop web && docker rm web
docker images ; docker rmi nginx:1.27
docker system prune              # reclaim disk from stopped/dangling leftovers</code></pre>
<h3>Writing a Dockerfile</h3>
<pre><code>FROM python:3.12-slim            # base image — slim/alpine keep it small
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # BEFORE copying code → layer caching
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]        # exec form; PID 1 gets signals properly</code></pre>
<p><b>Layer caching is the skill:</b> each instruction is a cached layer, invalidated downward from the first change. Copying requirements and installing <i>before</i> copying source means code edits rebuild in seconds, not re-downloading every package. Add a <code>.dockerignore</code> (venv/, .git/, *.log) so the build context stays lean. <code>RUN</code> happens at build; <code>CMD</code> at run; <code>ENTRYPOINT</code> fixes the executable with CMD as default args.</p>
<h3>Multi-stage builds — how production images get small</h3>
<pre><code>FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN go build -o app .

FROM gcr.io/distroless/base      # final image: binary only, no compiler, tiny attack surface
COPY --from=build /src/app /app
CMD ["/app"]</code></pre>
<h3>Ship it (Project 4)</h3>
<pre><code>docker build -t net-auditor:0.1 .
docker tag net-auditor:0.1 ghcr.io/akpevwe/net-auditor:0.1
docker push ghcr.io/akpevwe/net-auditor:0.1</code></pre>
<p>Tags are labels, not versions enforced by anyone — <code>:latest</code> is just a default name, and pulling it tomorrow may give a different image. Real pipelines pin tags (or digests).</p>`},
  {t:"Networks, volumes, env config and Compose", html:`
<h3>Container networking</h3>
<p>Default <b>bridge</b>: containers get private IPs behind the host; <code>-p 8080:80</code> is NAT/port-forwarding (recognise it from CCNA). On a <b>user-defined bridge network</b>, containers resolve each other <b>by name</b> via embedded DNS — the mechanism Compose and Kubernetes services build on:</p>
<pre><code>docker network create appnet
docker run -d --name db  --network appnet -e POSTGRES_PASSWORD=dev postgres:16
docker run -d --name api --network appnet -p 8000:8000 myapi:0.1
# inside api, "db:5432" just works — DNS by container name</code></pre>
<h3>Volumes — state that outlives containers</h3>
<pre><code>docker volume create pgdata
docker run -d -v pgdata:/var/lib/postgresql/data postgres:16   # named volume (Docker-managed)
docker run -v $(pwd):/app myapi:0.1                            # bind mount — live code for dev</code></pre>
<p>Rule: containers are disposable, volumes are not. Databases without a volume lose everything on <code>rm</code> — the classic beginner data-loss story.</p>
<h3>Configuration: 12-factor style</h3>
<p>One image, many environments: config enters via environment variables (<code>-e API_URL=...</code>, <code>--env-file .env</code>), not baked-in files. Secrets never go in the image — layers are inspectable with <code>docker history</code>.</p>
<h3>Docker Compose — the whole stack in one file</h3>
<pre><code># compose.yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      DB_HOST: db
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:</code></pre>
<pre><code>docker compose up -d      # build + network + start everything
docker compose logs -f api
docker compose down       # add -v to also drop volumes</code></pre>
<p>Compose is dev/single-host orchestration; the YAML shapes you learn here (services, images, env, volumes) are 70% of reading Kubernetes manifests later. Health checks (<code>healthcheck:</code>) and resource limits preview K8s probes/limits.</p>
<div class="callout"><b>Real scenario:</b> “API can't reach the database, but both run.” Checklist: same network? (<code>docker network inspect</code>) using the service <i>name</i> not localhost? (localhost inside a container is <i>itself</i>) env vars set? port actually listened on inside (exec in, <code>ss -tlnp</code>)? That localhost trap catches everyone exactly once.</div>`},
  ],
  quiz:[
  {q:"Image vs container:", o:["Synonyms","Image = read-only template; container = running instance with a writable layer","Container is the compressed image","Images run, containers store"], a:1, why:"Class vs object. Many containers can run from one image."},
  {q:"Containers start in milliseconds (vs VM minutes) because…", o:["They're compressed","They share the host kernel — no guest OS to boot","They skip networking","They run in RAM only"], a:1, why:"Namespaces+cgroups isolate processes on one kernel; a VM boots an entire OS."},
  {q:"Copying requirements.txt and pip-installing BEFORE copying the source exists to…", o:["Satisfy pip","Exploit layer caching so code changes don't re-install packages","Shrink the image","Avoid root"], a:1, why:"Cache invalidates downward from the changed layer; dependencies change rarely, code constantly."},
  {q:"Inside container 'api', connecting to the DB container on the same user network uses…", o:["localhost:5432","The host's public IP","db:5432 — DNS by container/service name","The bridge gateway"], a:2, why:"User-defined networks give name-based DNS; localhost inside a container is that container."},
  {q:"A Postgres container without a volume is removed. The data…", o:["Moves to the image","Is gone with the writable layer","Auto-backs up to Hub","Persists on the host"], a:1, why:"State belongs in volumes; containers are disposable."},
  {q:"docker exec -it web bash does what?", o:["Restarts web","Opens a shell inside the running container","Builds an image","Copies files out"], a:1, why:"Your inspection door: look at files, env, run ss/curl from inside."},
  {q:":latest means…", o:["The newest semver automatically verified","Just a default tag name — mutable, unpinned","LTS build","Signed release"], a:1, why:"Tags are mutable labels; production pins explicit versions or digests."},
  {q:"Multi-stage builds exist mainly to…", o:["Run tests","Ship a final image without compilers/build tools — small and safer","Enable Compose","Parallelise pulls"], a:1, why:"Build in a fat stage, COPY --from the artifact into a minimal runtime stage."},
  ],
  cards:[
  {f:"Container vs VM", b:"Shares host kernel (namespaces+cgroups) → MBs, ms startup. VM boots a whole OS."},
  {f:"Daily commands", b:"run -d -p · ps · logs -f · exec -it … bash · stop/rm · images · system prune."},
  {f:"Layer caching order", b:"COPY deps → install → COPY code. .dockerignore keeps context lean."},
  {f:"RUN vs CMD vs ENTRYPOINT", b:"Build-time vs default run command vs fixed executable (+CMD as args)."},
  {f:"localhost trap", b:"Inside a container, localhost = that container. Use service names on a shared network."},
  {f:"Named volume vs bind mount", b:"Docker-managed persistence vs host-path mapping (dev live-reload)."},
  {f:"12-factor config", b:"Same image everywhere; env vars carry config; secrets never in layers."},
  {f:"Compose verbs", b:"up -d · logs -f · down (-v drops volumes). One YAML = whole dev stack."},
  ],
  labs:[],
  codelabs:[{
    id:"dockerfile", t:"Code lab: Dockerfile for the auditor",
    brief:"Write a Dockerfile for a Python app (main.py + requirements.txt): slim 3.12 base, /app workdir, dependency layer cached before source copy, no pip cache, exec-form CMD running main.py.",
    starter:"# Dockerfile\n",
    checks:[
      {re:"FROM\\s+python:3\\.12-slim", hint:"Base: python:3.12-slim."},
      {re:"WORKDIR\\s+/app", hint:"Set WORKDIR /app."},
      {re:"COPY\\s+requirements\\.txt", hint:"Copy requirements.txt by itself first (caching)."},
      {re:"RUN\\s+pip\\s+install\\s+--no-cache-dir\\s+-r\\s+requirements\\.txt", hint:"pip install --no-cache-dir -r requirements.txt."},
      {re:"COPY\\s+\\.\\s+\\.", hint:"Then COPY . . for the source."},
      {re:"CMD\\s*\\[", hint:"Exec-form CMD: CMD [\"python\", \"main.py\"]."},
    ],
    model:`FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]`,
  }],
});

LL.tracks.push({
  id:"terraform", phase:2, title:"Terraform", tag:"Ladder step 7", hours:"5–7h",
  blurb:"Infrastructure as code: HCL, the plan/apply loop, state, variables and modules — the language of Project 2 (the full VPC built with no console clicks).",
  lessons:[
  {t:"IaC thinking, HCL, and the plan/apply loop", html:`
<h3>Why code instead of clicking</h3>
<p>Console-built infrastructure can't be reviewed, repeated, or recovered. Terraform is <b>declarative</b>: you describe the end state, it computes the steps — same idempotency idea as Ansible, aimed at provisioning rather than configuring. One codebase → dev, staging, prod, identical; a teardown is <code>destroy</code>, not an afternoon of hunting resources. 66.6% of platform work per the Ladder's survey data.</p>
<h3>HCL essentials</h3>
<pre><code>terraform {
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}
provider "aws" { region = "eu-west-2" }

resource "aws_vpc" "main" {               # TYPE  "LOCAL NAME"
  cidr_block = var.vpc_cidr
  tags = { Name = "lab-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id     # reference = implicit dependency graph
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-west-2a"
}

data "aws_ami" "al2023" {                 # data source: READ existing things
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name"; values = ["al2023-ami-*-x86_64"] }
}

output "vpc_id" { value = aws_vpc.main.id }</code></pre>
<p>References (<code>aws_vpc.main.id</code>) build the dependency graph — Terraform orders creation itself, no numbering needed.</p>
<h3>The loop you run forever</h3>
<pre><code>terraform init       # download providers, set up backend (once per machine/backend change)
terraform fmt        # format
terraform validate   # syntax/type check
terraform plan       # THE diff: + create  ~ update in-place  -/+ destroy-and-recreate  - destroy
terraform apply      # execute (type yes);  terraform destroy  tears it all down</code></pre>
<p>Read plans like a surgeon reads scans: a <code>-/+</code> on a database means Terraform intends to <b>replace</b> it — some attribute changes force recreation. The plan is the safety mechanism; teams gate applies on a reviewed plan in CI.</p>
<h3>State — the part that bites</h3>
<p><code>terraform.tfstate</code> maps your code to real resource IDs; it's how Terraform knows what it owns. Consequences: it contains secrets (treat accordingly) · hand-editing it breaks things · two people applying with local state = corruption. Hence <b>remote state</b>: an S3 backend with locking, so the team shares one truth:</p>
<pre><code>terraform {
  backend "s3" {
    bucket       = "coscharis-tfstate"
    key          = "network/lab.tfstate"
    region       = "eu-west-2"
    use_lockfile = true      # (older setups: a DynamoDB lock table)
  }
}</code></pre>
<p><b>Drift</b>: someone clicks in the console → reality ≠ state. <code>terraform plan</code> exposes it; the team rule is “fix it in code”, and <code>terraform import</code> adopts resources born outside Terraform.</p>`},
  {t:"Variables, outputs, modules — Project 2 shape", html:`
<h3>Variables make code reusable</h3>
<pre><code>variable "env"       { type = string }
variable "vpc_cidr"  { type = string, default = "10.0.0.0/16" }
variable "azs"       { type = list(string), default = ["eu-west-2a","eu-west-2b"] }

# terraform.tfvars        → env = "dev"
# CLI                     → terraform apply -var="env=prod"
# environment             → TF_VAR_env=prod
locals { name_prefix = "coscharis-\${var.env}" }        # computed values
resource "aws_subnet" "public" {
  count      = length(var.azs)                          # count / for_each = loops
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index) # 10.0.0.0/24, 10.0.1.0/24…
  availability_zone = var.azs[count.index]
}</code></pre>
<p><code>cidrsubnet()</code> doing your subnetting arithmetic is the moment CCNA-you meets Terraform-you. <code>for_each</code> over a map beats <code>count</code> when items have identities (removing one from the middle of a count-list renumbers — and recreates — the rest).</p>
<h3>Modules — functions for infrastructure</h3>
<pre><code>module "vpc" {
  source   = "./modules/vpc"      # or registry: terraform-aws-modules/vpc/aws
  env      = var.env
  vpc_cidr = "10.0.0.0/16"
  azs      = var.azs
}
resource "aws_instance" "app" {
  subnet_id = module.vpc.private_subnet_ids[0]   # consume its outputs
}</code></pre>
<p>A module is just a folder of .tf files with variables in and outputs out. Project 2's final form: a <code>modules/vpc</code> you wrote, called twice (dev + prod) with different CIDRs — that refactor is the Ladder's step-7 deliverable.</p>
<h3>Project 2, specified</h3>
<pre><code>VPC 10.0.0.0/16, 2–3 AZs
├─ public + private subnets per AZ (cidrsubnet + count)
├─ IGW; NAT gateway per AZ; route tables wired
├─ security groups: alb-sg (80/443 in), app-sg (8080 from alb-sg only)
├─ ALB + target group + ASG (launch template, user-data nginx)
└─ outputs: alb_dns_name, subnet ids
Definition of done: apply → curl the ALB DNS → page loads → destroy → re-apply → identical. "Destroy and re-apply until it is boring."</code></pre>
<h3>Hygiene that marks professionals</h3>
<ul>
<li>Never commit: .tfstate, .tfvars with secrets, .terraform/ — a ready-made .gitignore exists.</li>
<li>Secrets come from variables/SSM/Vault at apply time, not literals in .tf files.</li>
<li>Pin provider versions; one workspace/state per environment; small stacks over one giant one.</li>
<li>The Ladder's advice stands: show the code, skip the Terraform cert for now.</li>
</ul>`},
  ],
  quiz:[
  {q:"'Declarative' means Terraform…", o:["Runs steps you list in order","Converges reality to the described end state, computing the steps itself","Only reads infrastructure","Is YAML"], a:1, why:"You declare WHAT; the provider graph works out HOW and in what order."},
  {q:"-/+ next to a resource in a plan means…", o:["Update in place","Destroy and recreate — a replacement","Rename","No change"], a:1, why:"Some attribute changes force recreation; on stateful resources that's data loss unless planned."},
  {q:"terraform.tfstate exists to…", o:["Cache providers","Map code to real-world resource IDs so Terraform knows what it manages","Store logs","Hold variables"], a:1, why:"No state → Terraform can't tell create from update from drift."},
  {q:"A team of 3 should keep state…", o:["Each developer local","Committed to Git","Remote backend (e.g. S3) with locking","In outputs"], a:2, why:"Shared single truth + locking prevents concurrent-apply corruption; Git state also leaks secrets."},
  {q:"A console-made change to a Terraform-managed SG is…", o:["Merged automatically","Drift — plan will show it and apply will revert/reconcile","Ignored forever","A new resource"], a:1, why:"Reality diverged from code; the discipline is fix-in-code (or import)."},
  {q:"for_each over count is preferred when…", o:["Always","Items have stable identities — removing one mustn't renumber/recreate the rest","Using modules","On AWS only"], a:1, why:"count is positional; deleting index 1 shifts everything after it."},
  {q:"cidrsubnet(\"10.0.0.0/16\", 8, 2) returns…", o:["10.0.2.0/24","10.2.0.0/24","10.0.0.2/32","10.0.2.0/16"], a:0, why:"Adds 8 bits (→/24) and takes the 3rd (index 2) subnet: 10.0.2.0/24. Subnetting as a function."},
  {q:"Which never belongs in the repo?", o:["main.tf",".gitignore","terraform.tfstate","variables.tf"], a:2, why:"State holds IDs and secrets; it lives in the remote backend."},
  ],
  cards:[
  {f:"Core loop", b:"init → fmt → validate → plan → apply (→ destroy). Plan is the reviewed diff."},
  {f:"Plan symbols", b:"+ create · ~ in-place update · -/+ replace (danger on stateful) · - destroy."},
  {f:"State", b:"Code↔reality map. Remote backend + locking for teams; never commit; contains secrets."},
  {f:"Drift", b:"Console change vs code. plan reveals; fix in code; import adopts strays."},
  {f:"Reference = dependency", b:"aws_subnet uses aws_vpc.main.id → Terraform orders the graph itself."},
  {f:"data vs resource", b:"data reads existing (AMI lookup); resource creates/manages."},
  {f:"Variables precedence", b:"-var/CLI > tfvars files > TF_VAR_ env > defaults. locals = computed."},
  {f:"Module", b:"Folder of .tf with inputs/outputs — write once, instantiate per env."},
  ],
  labs:[],
  codelabs:[{
    id:"tf-vpc", t:"Code lab: VPC + subnet in HCL",
    brief:"Write Terraform for: an aws_vpc named main with cidr_block 10.0.0.0/16, an aws_subnet named public_a in that VPC (reference its id) with cidr_block 10.0.1.0/24 and availability_zone eu-west-2a, and an output vpc_id exposing the VPC id.",
    starter:"",
    checks:[
      {re:"resource\\s+\"aws_vpc\"\\s+\"main\"", hint:"Declare resource \"aws_vpc\" \"main\"."},
      {re:"cidr_block\\s*=\\s*\"10\\.0\\.0\\.0/16\"", hint:"VPC cidr_block = \"10.0.0.0/16\"."},
      {re:"resource\\s+\"aws_subnet\"\\s+\"public_a\"", hint:"Declare resource \"aws_subnet\" \"public_a\"."},
      {re:"vpc_id\\s*=\\s*aws_vpc\\.main\\.id", hint:"Reference the VPC: vpc_id = aws_vpc.main.id (this builds the dependency)."},
      {re:"availability_zone\\s*=\\s*\"eu-west-2a\"", hint:"Pin the subnet to eu-west-2a."},
      {re:"output\\s+\"vpc_id\"", hint:"Add output \"vpc_id\" { value = aws_vpc.main.id }."},
    ],
    model:`resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "lab-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-west-2a"
}

output "vpc_id" {
  value = aws_vpc.main.id
}`,
  }],
});

LL.tracks.push({
  id:"cicd", phase:2, title:"CI/CD & GitHub Actions", tag:"Ladder step 8", hours:"3–4h",
  blurb:"72.8% of platform work and one of the smallest steps: pipelines that test and deploy on every push — Project 5.",
  lessons:[
  {t:"Pipeline thinking and GitHub Actions anatomy", html:`
<h3>CI vs CD, in one breath</h3>
<p><b>Continuous Integration</b>: every push is built and tested by a machine, so broken code is caught in minutes, on a neutral environment, before review. <b>Continuous Delivery/Deployment</b>: the same pipeline packages and ships what passed — delivery stops at “ready, click to release”, deployment goes all the way automatically. The payoff is cultural as much as technical: small changes, always releasable, rollback = redeploy previous version.</p>
<h3>GitHub Actions vocabulary</h3>
<p><b>Workflow</b> (a YAML in <code>.github/workflows/</code>) → triggered by <b>events</b> (<code>push</code>, <code>pull_request</code>, <code>schedule</code>, manual) → runs <b>jobs</b> (parallel by default, on fresh runner VMs) → each job is <b>steps</b> (shell commands or reusable <b>actions</b> from the marketplace).</p>
<pre><code># .github/workflows/ci.yml
name: ci
on:
  push: { branches: [main] }
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4            # an action: fetch the repo
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: ruff check .                     # lint
      - run: pytest -q                        # tests — a failing step fails the job

  build-and-push:
    needs: test                               # ordering: only after test passes
    if: github.ref == 'refs/heads/main'       # don't publish from PRs
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - run: |
          echo "\${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u akpevwe --password-stdin
          docker build -t ghcr.io/akpevwe/net-auditor:\${{ github.sha }} .
          docker push ghcr.io/akpevwe/net-auditor:\${{ github.sha }}</code></pre>
<p>Key mechanics: jobs don't share disks (pass files with artifacts/upload+download) · <code>\${{ secrets.NAME }}</code> injects repo secrets, masked in logs — credentials never live in YAML · tagging images with <code>github.sha</code> means every running container is traceable to an exact commit · <code>needs:</code> builds the stage graph.</p>
<h3>What good pipelines also do</h3>
<ul>
<li>Matrix builds (test on 3.11 and 3.12 at once) · caching deps for speed · branch protection requiring green checks before merge — CI becomes the gatekeeper, not a suggestion.</li>
<li>Deploy stage: environments with approvals for prod; strategies you should be able to define in interviews — <b>rolling</b> (replace a few at a time), <b>blue-green</b> (two stacks, flip traffic, instant rollback), <b>canary</b> (1–5% first, watch metrics, then ramp).</li>
<li>For infra: a workflow that runs <code>terraform plan</code> on PRs (posting the diff for review) and <code>apply</code> on merge — code review for networks. That is Project 7's spine: config changes as pull requests, validated, staged.</li>
</ul>
<div class="callout"><b>Project 5:</b> the workflow above pointed at your Project-4 container — the Ladder calls the first commit that reaches a running system untouched by your hands “the moment this stops being study”.</div>`},
  ],
  quiz:[
  {q:"CI's core promise:", o:["Faster laptops","Every push is built+tested automatically on neutral ground, failing fast","No code review needed","Monthly releases"], a:1, why:"Machines catch breakage in minutes; main stays releasable."},
  {q:"Two jobs in one workflow, by default…", o:["Run in sequence","Run in parallel on separate fresh runners","Share a filesystem","Need the same OS"], a:1, why:"Parallel, isolated VMs; needs: creates ordering, artifacts pass files."},
  {q:"Secrets reach a workflow via…", o:["Plaintext YAML","${{ secrets.X }} from repo settings, masked in logs","A committed .env","Base64 in comments"], a:1, why:"Secrets store + masking; credentials never enter version control."},
  {q:"Tagging images with github.sha gives you…", o:["Smaller images","Exact traceability: any running container ↔ the commit that built it","Auto-rollback","Faster pulls"], a:1, why:"Provenance; rollback = redeploy a previous sha."},
  {q:"Blue-green deployment means…", o:["Two feature flags","Full second environment; switch traffic over; instant rollback by switching back","5% canary","Database mirroring"], a:1, why:"Flip at the LB/DNS; the old stack stays warm as the rollback."},
  {q:"Running terraform plan on PRs and apply on merge achieves…", o:["Nothing extra","Reviewed, auditable infrastructure changes — GitOps for infra","Faster applies","Secret rotation"], a:1, why:"The diff gets human review before reality changes — Project 7's pattern."},
  ],
  cards:[
  {f:"Workflow anatomy", b:"Event → workflow → jobs (parallel, fresh VMs) → steps (run / uses@v)."},
  {f:"needs: / if:", b:"Job ordering and conditions (e.g. publish only on main)."},
  {f:"Secrets", b:"${{ secrets.NAME }} — stored in repo settings, masked in logs."},
  {f:"Image tag = commit", b:"ghcr.io/you/app:${{ github.sha }} → traceable deploys, easy rollback."},
  {f:"Rolling / blue-green / canary", b:"Few-at-a-time vs flip-whole-stack vs small-%-then-ramp."},
  {f:"Branch protection", b:"Require green checks + review before merge — CI as gatekeeper."},
  ],
  labs:[],
  codelabs:[{
    id:"gha", t:"Code lab: the CI workflow",
    brief:"Write a GitHub Actions workflow: name ci, trigger on push, one job 'test' on ubuntu-latest with steps: checkout (actions/checkout@v4), setup Python 3.12 (actions/setup-python@v5), install requirements, run pytest.",
    starter:"name: ci\n",
    checks:[
      {re:"on:\\s*[\\s\\S]*push", hint:"Trigger on push."},
      {re:"runs-on:\\s*ubuntu-latest", hint:"Job runs-on: ubuntu-latest."},
      {re:"uses:\\s*actions/checkout@v4", hint:"First step: actions/checkout@v4."},
      {re:"uses:\\s*actions/setup-python@v5", hint:"Use actions/setup-python@v5 (with python-version 3.12)."},
      {re:"pip install -r requirements\\.txt", hint:"Install deps: pip install -r requirements.txt."},
      {re:"pytest", hint:"Run the tests with pytest."},
    ],
    model:`name: ci
on:
  push:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: pytest -q`,
  }],
});

LL.tracks.push({
  id:"k8s", phase:2, title:"Kubernetes", tag:"Ladder step 9 · CKA path", hours:"14–18h",
  blurb:"Now it makes sense — Docker, Terraform and pipelines sit under it. Architecture, Pods/Deployments/Services, config, probes, kubectl fluency, and the networking angle where your background is the advantage.",
  lessons:[
  {t:"Why Kubernetes, and the architecture", html:`
<h3>The problem at fleet scale</h3>
<p>Docker runs containers on one host. Production asks: spread 40 containers over 12 nodes, restart them when they die, replace them when a node dies, roll out v2 with zero downtime, scale to 80 for the promo, give them stable names while they churn. Doing that by hand is a pager lifestyle; Kubernetes is the control system that does it from a declaration. 82% production use among container users — the centre of gravity the Ladder points at.</p>
<h3>Control plane vs worker nodes</h3>
<div class="tablewrap"><table>
<tr><th>Component</th><th>Role</th></tr>
<tr><td><b>kube-apiserver</b></td><td>The front door — every kubectl call, every component, talks through it</td></tr>
<tr><td><b>etcd</b></td><td>The cluster's database: desired + observed state</td></tr>
<tr><td><b>scheduler</b></td><td>Chooses a node for each new Pod (resources, affinity, taints)</td></tr>
<tr><td><b>controller-manager</b></td><td>The reconciliation loops: notice desired ≠ actual → act</td></tr>
<tr><td>kubelet (per node)</td><td>Agent that actually starts/stops containers and reports back</td></tr>
<tr><td>kube-proxy / CNI (per node)</td><td>Service traffic rules / the Pod network itself</td></tr>
</table></div>
<p><b>The one idea everything is built on — reconciliation:</b> you write desired state into the API (“3 replicas of api:1.4”); controllers forever compare it with reality and close the gap. Delete a Pod → the gap is 2 vs 3 → a new one appears. Nobody “restarts your app”; the system reconciles. Managed control planes (EKS/GKE/AKS) run the left column for you; your job is the right column and everything you deploy.</p>
<h3>The Pod</h3>
<p>The smallest deployable unit: one or more tightly-coupled containers sharing an IP and volumes (sidecars like log shippers ride along). Pods are <b>mortal</b> — they are cattle, not pets; their IPs change on every reschedule, which is exactly why Services exist.</p>
<h3>kubectl — your hands</h3>
<pre><code>kubectl get pods -o wide                 # list (+node, IP)
kubectl get all -n payments              # everything in a namespace
kubectl describe pod api-7d9f...         # state + the Events section = 80% of debugging
kubectl logs -f api-7d9f... [-c sidecar] # container logs
kubectl exec -it api-7d9f... -- sh       # shell inside
kubectl apply -f deploy.yaml             # declare desired state
kubectl delete pod api-7d9f...           # watch reconciliation resurrect it</code></pre>
<p><b>Namespaces</b> partition the cluster (team/env isolation, quotas); <b>labels</b> (key=value on everything) are how objects find each other — Services select Pods by label, you filter with <code>-l app=api</code>. Labels are the glue of the whole system.</p>`},
  {t:"Deployments, Services, Ingress — running and reaching apps", html:`
<h3>Deployment → ReplicaSet → Pods</h3>
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
        image: ghcr.io/akpevwe/net-auditor:1.4
        ports: [{ containerPort: 8000 }]
        resources:
          requests: { cpu: "100m", memory: "128Mi" }   # scheduler promises
          limits:   { cpu: "500m", memory: "256Mi" }   # hard ceilings (OOMKill above)</code></pre>
<p>Update the image → <code>kubectl apply</code> → <b>rolling update</b>: new Pods come up, old drain, zero downtime; <code>kubectl rollout status / history / undo deployment/api</code> is your deploy-and-rollback kit. <code>kubectl scale deploy api --replicas=10</code> scales by hand; the <b>HPA</b> (HorizontalPodAutoscaler) scales on metrics — the ASG idea, pod-sized.</p>
<h3>Services — stable names over mortal Pods</h3>
<pre><code>apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }          # label match → live endpoint list
  ports: [{ port: 80, targetPort: 8000 }]
  type: ClusterIP                 # default</code></pre>
<ul>
<li><b>ClusterIP</b>: internal VIP + DNS name (<code>api.payments.svc.cluster.local</code>) — in-cluster traffic.</li>
<li><b>NodePort</b>: opens a 30000-range port on every node — dev/bare-metal exposure.</li>
<li><b>LoadBalancer</b>: asks the cloud for a real LB (on EKS: an NLB/ALB) per service.</li>
<li><b>Ingress</b>: one entry point, layer-7 rules — host/path routing + TLS across many services; an ingress controller (nginx, ALB controller) does the work. One LB, many apps = the economical pattern.</li>
</ul>
<p><b>Your advantage lives here:</b> service VIPs, kube-proxy rules, CNI plugins (Calico/Cilium), NetworkPolicies (firewall rules between Pods — default is allow-everything!), eBPF — “the part of Kubernetes most people find hardest is hardest because it is networking.” You arrive with the hard half done.</p>
<h3>Config, secrets, probes, storage — the production seasoning</h3>
<pre><code>env:
- name: DB_HOST
  valueFrom: { configMapKeyRef: { name: app-config, key: db_host } }
- name: DB_PASS
  valueFrom: { secretKeyRef: { name: app-secrets, key: db_pass } }
livenessProbe:  { httpGet: { path: /healthz, port: 8000 }, periodSeconds: 10 }
readinessProbe: { httpGet: { path: /ready,  port: 8000 } }</code></pre>
<ul>
<li><b>ConfigMaps/Secrets</b>: config out of images (12-factor again); Secrets are base64-wrapped, not encrypted — real clusters add KMS envelope encryption or external vaults.</li>
<li><b>Liveness</b> = “restart me if this fails”; <b>readiness</b> = “don't send traffic yet” — the difference between a blip and a cascading outage during deploys.</li>
<li>Storage: PersistentVolumeClaims request disks via StorageClasses (on EKS → EBS); StatefulSets give databases stable identities. DaemonSets run one Pod per node (log/metric agents); Jobs/CronJobs for batch.</li>
</ul>
<h3>Debug drill (interview + CKA bread and butter)</h3>
<pre><code>Pod Pending   → describe: unschedulable? resources too big, taints, no nodes
ImagePullBackOff → wrong tag / private registry creds (imagePullSecrets)
CrashLoopBackOff → logs (+ logs --previous): app dies at boot — env? config? migrations?
Running but unreachable → readiness failing? Service selector ≠ Pod labels? (kubectl get endpoints)
OOMKilled     → memory limit too low or a leak; raise limits or fix the leak</code></pre>
<p>That table, memorised, carries you through most K8s interviews. The <b>Killercoda</b> free labs + CKA path (KodeKloud) are the Ladder's step-9 resources; the lab here keeps the kubectl reflexes warm between sessions.</p>`},
  ],
  quiz:[
  {q:"The component that stores all cluster state:", o:["kubelet","etcd","scheduler","kube-proxy"], a:1, why:"etcd is the source-of-truth database behind the API server."},
  {q:"You delete a Deployment-managed Pod. What happens?", o:["Gone until you recreate it","A controller reconciles desired vs actual and starts a replacement","The node reboots","The Service deletes too"], a:1, why:"Reconciliation: replicas says 3, reality says 2 → gap closed automatically."},
  {q:"Pods get stable reachability through…", o:["Static Pod IPs","A Service selecting them by label","Node hostnames","etcd DNS"], a:1, why:"Pod IPs churn; the Service VIP + DNS name endures, endpoints update by label match."},
  {q:"Liveness vs readiness:", o:["Same probe, two names","Liveness restarts the container; readiness gates traffic to it","Readiness restarts; liveness gates","Both only log"], a:1, why:"Failing liveness → kill/restart. Failing readiness → removed from endpoints, left running."},
  {q:"CrashLoopBackOff — first command:", o:["kubectl delete node","kubectl logs <pod> --previous","kubectl scale --replicas=0","Reinstall the CNI"], a:1, why:"The app is dying at start; the previous container's logs say why."},
  {q:"Expose 12 web apps on one cloud load balancer with host/path routing:", o:["12 LoadBalancer Services","NodePort each","One Ingress + controller","ClusterIP only"], a:2, why:"Ingress gives L7 rules behind a single entry point; per-app LBs cost 12×."},
  {q:"resources.requests vs limits:", o:["Synonyms","Requests guide scheduling; limits are enforced ceilings (OOMKill/throttle)","Limits guide scheduling","Requests are per node"], a:1, why:"Scheduler bin-packs on requests; the kernel enforces limits at runtime."},
  {q:"Service has no endpoints though Pods run. Classic cause:", o:["etcd full","Service selector doesn't match the Pod labels","Too many replicas","Missing PVC"], a:1, why:"Label/selector mismatch — check kubectl get endpoints and the labels."},
  {q:"Kubernetes Secrets are, by default…", o:["AES-encrypted at rest everywhere","Base64-encoded — encode ≠ encrypt; harden with KMS/external vaults","Hashed","Stored on Pods"], a:1, why:"Base64 is reversible; production clusters enable envelope encryption or external secret stores."},
  {q:"Run exactly one logging agent on every node:", o:["Deployment replicas=nodes","StatefulSet","DaemonSet","CronJob"], a:2, why:"DaemonSet = one Pod per node, tracking node additions automatically."},
  ],
  cards:[
  {f:"Control plane four", b:"apiserver (door) · etcd (state) · scheduler (placement) · controller-manager (reconcile loops)."},
  {f:"Reconciliation", b:"Declare desired state; controllers forever close the gap with reality. The one idea."},
  {f:"Pod", b:"Smallest unit; 1+ containers sharing IP/volumes; mortal — IPs churn."},
  {f:"Deployment chain", b:"Deployment → ReplicaSet → Pods; rolling updates; rollout undo = rollback."},
  {f:"Service types", b:"ClusterIP (internal DNS) · NodePort (30000s) · LoadBalancer (cloud LB) · Ingress = L7 router over many."},
  {f:"Probes", b:"Liveness = restart if dead · Readiness = no traffic until ready. Deploy safety."},
  {f:"Requests vs limits", b:"Scheduling promise vs enforced ceiling (OOMKilled when memory limit hit)."},
  {f:"Debug table", b:"Pending=unschedulable · ImagePullBackOff=tag/creds · CrashLoop=logs --previous · no traffic=readiness/selector · OOMKilled=limits."},
  {f:"ConfigMap/Secret", b:"Config & creds out of images; Secrets are base64 — add KMS/vault for real secrecy."},
  {f:"DaemonSet / StatefulSet / Job", b:"Per-node agents · stable-identity stateful apps · run-to-completion batch."},
  {f:"kubectl core", b:"get -o wide · describe (Events!) · logs -f · exec -it · apply -f · rollout status/undo · scale."},
  {f:"K8s networking edge", b:"CNI, kube-proxy, NetworkPolicies (default allow-all!), Cilium/eBPF — where network people win."},
  ],
  labs:["k8s-triage"], codelabs:[],
});

LL.tracks.push({
  id:"sre", phase:2, title:"Observability, GitOps & SRE", tag:"Ladder steps 10–11", hours:"5–7h",
  blurb:"Prometheus & Grafana, the metrics that matter, ArgoCD-style GitOps, SLOs and error budgets, and blameless postmortems — the capstone's operating system.",
  lessons:[
  {t:"Observability: Prometheus, Grafana, and what to measure", html:`
<h3>Three pillars</h3>
<p><b>Metrics</b> (numbers over time — cheap, aggregate, alert on these) · <b>logs</b> (event records — the why) · <b>traces</b> (one request's journey across services — the where). Monitoring asks known questions (“is CPU high?”); observability means the system emits enough that you can ask <i>new</i> questions during an incident you didn't predict.</p>
<h3>Prometheus — how it actually works</h3>
<p><b>Pull model</b>: Prometheus scrapes <code>/metrics</code> HTTP endpoints on an interval; apps expose counters/gauges/histograms via client libraries, infrastructure via <b>exporters</b> (node_exporter for Linux boxes, SNMP exporter for your switches — yes, your network gear plugs into this world). In Kubernetes, service discovery finds scrape targets automatically. Data = time series keyed by labels.</p>
<pre><code># PromQL you'll actually write
rate(http_requests_total{job="api"}[5m])                         # req/s over 5m
sum by (status) (rate(http_requests_total[5m]))                  # split by status code
histogram_quantile(0.99, rate(http_request_seconds_bucket[5m]))  # p99 latency
node_filesystem_avail_bytes / node_filesystem_size_bytes &lt; 0.10  # disk &lt;10% free</code></pre>
<p>Metric types: <b>counter</b> (only up — always wrap in <code>rate()</code>), <b>gauge</b> (current value), <b>histogram</b> (latency buckets → percentiles). <b>Averages lie</b>: a 100ms average hides the 4 seconds your p99 users feel — SLOs are written on percentiles.</p>
<h3>What to measure — the two acronyms</h3>
<ul>
<li><b>RED</b> for services: Rate, Errors, Duration — every service dashboard starts here.</li>
<li><b>USE</b> for resources: Utilisation, Saturation, Errors — nodes, disks, links (saturation = the queue building before utilisation shows it).</li>
<li>The Four Golden Signals (Google SRE): latency, traffic, errors, saturation — same ideas.</li>
</ul>
<h3>Grafana & Alertmanager</h3>
<p>Grafana renders PromQL into dashboards (service RED on top, resource USE below, deploy markers overlaid). <b>Alertmanager</b> routes alerts (dedupe, group, silence, escalate). The alerting craft: alert on <b>symptoms users feel</b> (“error rate &gt; 1% for 5m”, “p99 &gt; 2s”), not every cause (“CPU 85%” at 3am helps nobody if users are fine); every page must be actionable or it trains people to ignore pages. Step-10 deliverable: instrument your own cluster — dashboards and alert rules that <i>actually fire</i> when you break things on purpose.</p>`},
  {t:"GitOps, SLOs, error budgets, and the capstone", html:`
<h3>GitOps — deployment as reconciliation</h3>
<p>CI pushing to the cluster means credentials in pipelines and drift nobody sees. GitOps flips the direction: a repo holds the desired manifests; an agent <b>in the cluster</b> (ArgoCD / Flux) continuously pulls, diffs, and syncs. Consequences: Git log = deploy log (who/what/when) · rollback = <code>git revert</code> · manual kubectl edits show as drift and get reverted · cluster credentials never leave the cluster. 56.5% of platform teams and near-zero among immature ones — the Ladder's marker of which group you're in. Flow: push code → CI builds image v1.5 → CI bumps the tag in the <i>manifests repo</i> → ArgoCD notices and syncs → cluster converges. Same reconciliation idea as Kubernetes itself, one level up.</p>
<h3>SLIs, SLOs, error budgets</h3>
<ul>
<li><b>SLI</b>: the measured indicator — “fraction of requests under 300ms that returned non-5xx”.</li>
<li><b>SLO</b>: the target — “99.9% over 30 days”. (An SLA is the SLO with lawyers and refunds attached.)</li>
<li><b>Error budget</b>: 100% − SLO. At 99.9% you may “spend” 43.2 minutes of badness a month. Budget healthy → ship fast. Budget burned → freeze features, pay down reliability. This turns the eternal dev-vs-ops fight into arithmetic — the single most quotable SRE idea in interviews.</li>
</ul>
<p>Why not 100%? Each extra nine roughly 10×es the cost, users can't tell 99.99% from 100%, and a 100% target forbids all change. Choosing the <i>right</i> number is the engineering.</p>
<h3>Toil and the SRE job description</h3>
<p><b>Toil</b> = manual, repetitive, automatable ops work that scales with service size. SRE caps toil (~50%) and spends the rest engineering it away — “administrators automating their own routine tasks” is the BLS line from your plan; SRE is that, institutionalised. Runbooks document the response; the best runbook eventually becomes a script, then an operator nobody runs by hand.</p>
<h3>Blameless postmortems</h3>
<p>After an incident: timeline, impact (in SLO terms), contributing causes (plural — “root cause” is usually several), what detection/response/prevention changes, action items with owners. Blameless because punished engineers hide information and the next incident learns nothing. The Ladder's capstone ends exactly here on purpose: <i>break your own system and publish the postmortem</i> — almost nobody applying can show one.</p>
<h3>The capstone, assembled (Project 6)</h3>
<pre><code>Terraform  → provisions the cluster + VPC            (steps 4,7)
CI         → tests, builds, pushes image, bumps tag  (steps 3,6,8)
ArgoCD     → syncs manifests repo → cluster          (step 11)
Prometheus/Grafana → RED+USE dashboards, alerts      (step 10)
You        → wrote the SLOs, broke it, postmortem    (step 11)</code></pre>
<p>One system demonstrating the top five things platform teams do. Lead every interview with it.</p>`},
  ],
  quiz:[
  {q:"Prometheus gathers metrics by…", o:["Agents pushing UDP","Scraping /metrics endpoints on an interval (pull)","Reading logs","SSH polling"], a:1, why:"Pull + service discovery; exporters translate things (Linux, SNMP devices) that can't expose metrics natively."},
  {q:"A counter metric must be read through…", o:["Its raw value","rate() over a window","max()","A gauge"], a:1, why:"Counters only increase; the useful signal is their rate of change."},
  {q:"Your average latency is 120ms but users complain. Look at…", o:["The mean again","p95/p99 percentiles (histogram_quantile)","Total requests","Uptime"], a:1, why:"Averages hide the tail; SLOs and complaints live at the percentiles."},
  {q:"RED stands for…", o:["Reliability, Efficiency, Durability","Rate, Errors, Duration — the per-service trio","Requests, Egress, Disk","Restart, Evaluate, Deploy"], a:1, why:"Every service dashboard: throughput, error rate, latency distribution. USE covers resources."},
  {q:"Good paging alerts fire on…", o:["Every cause metric (CPU, disk, GC)","User-felt symptoms breaching thresholds for a sustained window","Each deploy","Log volume"], a:1, why:"Symptom-based + duration = actionable pages; cause-noise trains people to ignore alerts."},
  {q:"In GitOps, deployment happens when…", o:["CI runs kubectl apply with cluster creds","An in-cluster agent pulls the manifests repo and syncs the diff","An engineer SSHes in","Terraform applies"], a:1, why:"Pull-based reconciliation: Git is the source of truth, rollback is git revert, drift gets reverted."},
  {q:"A 99.9% monthly SLO gives an error budget of about…", o:["4.3 hours","43 minutes","4 minutes","7 hours"], a:1, why:"0.1% of ~30 days ≈ 43.2 minutes — the spend-it-or-freeze currency."},
  {q:"The error budget is exhausted mid-month. The SRE playbook says…", o:["Raise the SLO","Pause feature launches; spend effort on reliability until budget recovers","Mute alerts","Add replicas and continue"], a:1, why:"The budget is the contract that converts reliability vs velocity into arithmetic."},
  {q:"Postmortems are blameless because…", o:["Nobody is ever at fault","Fear hides information; learning requires honest timelines","HR requires it","It's faster"], a:1, why:"Systems, not scapegoats: contributing causes + action items prevent the repeat."},
  {q:"'Toil' specifically means…", o:["All hard work","Manual, repetitive, automatable work that grows with the service","On-call hours","Writing docs"], a:1, why:"SRE caps toil and engineers it away — the exact administrator→architect bridge your plan is built on."},
  ],
  cards:[
  {f:"Three pillars", b:"Metrics (alert) · Logs (why) · Traces (where). Observability = answering unanticipated questions."},
  {f:"Prometheus model", b:"Pull /metrics · exporters (node, SNMP!) · time series + labels · Alertmanager routes."},
  {f:"Metric types", b:"Counter (rate() it) · Gauge (current) · Histogram (buckets → percentiles)."},
  {f:"PromQL staples", b:"rate(x[5m]) · sum by (label) · histogram_quantile(0.99, …)."},
  {f:"RED vs USE", b:"Services: Rate/Errors/Duration. Resources: Utilisation/Saturation/Errors."},
  {f:"Alert craft", b:"Symptoms users feel, sustained window, always actionable — or pages get ignored."},
  {f:"GitOps", b:"Manifests repo = truth; in-cluster agent (ArgoCD) pulls & syncs; rollback = git revert; drift reverted."},
  {f:"SLI→SLO→SLA", b:"Measurement → target → target with contractual penalties."},
  {f:"Error budget", b:"100%−SLO. 99.9%/mo ≈ 43 min. Healthy=ship; burned=freeze+harden."},
  {f:"Toil", b:"Manual, repetitive, automatable, scales with service — cap it, automate it away."},
  {f:"Postmortem skeleton", b:"Timeline · impact (SLO terms) · contributing causes · detection/response/prevention actions + owners. Blameless."},
  ],
  labs:[], codelabs:[],
});

})();
