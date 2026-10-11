# Ladder Lab — content standard

The bar: someone with **zero experience** can start at lesson 1 and keep going, and someone
experienced still learns from it. Depth of a top paid course, explained more patiently, with
hands-on practice inside the lesson and the "what this looks like at work" layer most courses skip.

**Every lesson, every module, no exceptions** (the owner approved the CCNA Module 1 format and checks for it):
depth with patient step-by-step explanation · diagrams and visual representations · worked examples ·
"Try it yourself" terminals and hands-on benches · on-the-job scenarios and case studies · interview corner ·
hints, did-you-know, myth vs fact, do/don't, when-to-use-what, exam tips, memory aids · mixed-type quizzes at
Core / Exam / Stretch difficulty · flashcards. If a lesson is missing any of these, it isn't finished.

## Where content lives

- `kit.js` — the building blocks (`K.*`) used inside lesson HTML.
- `data_<track>_m<N>.js` — one file per rebuilt module. Load it in `index.html` **after
  `data_visuals.js`** (that file injects diagrams into the classic lessons by index).
- A module file builds its lessons and registers them:

```js
(function(){
const L = [];
L.push({ id:"net-what", t:"Lesson title", mins:45, level:"Beginner", html:`...`, quiz:[...], cards:[...] });
// ...more lessons
K.module("ccna", { id:"ccna-m1", t:"How networks work", blurb:"One sentence." }, L,
         { at:0, modAt:0, replace:["Title of the classic lesson this module replaces"] });
})();
```

`id` is permanent: progress is saved under it, so never rename an id after it ships.

## Lesson anatomy (in this order)

1. `K.goals([...])` — 3–5 concrete things the learner can *do* afterwards ("calculate…", "configure…", "explain to a user…").
2. `K.pre([...])` — what they need first (name earlier lessons). First lesson: "Nothing — start here."
3. **Why this matters at work** — a short, real-feeling opening scenario (2 short paragraphs).
4. **3–7 `<h2>` sections.** Each section:
   - plain-language explanation from zero, then the precise technical version;
   - `K.analogy(...)` when an idea is abstract;
   - a diagram (`K.svg`) whenever something connects, moves, or is layered;
   - a worked example with `K.steps([...])` when there is a procedure or a calculation;
   - real command output with `K.out(text, caption)` and what each part means;
   - a `K.check({...})` at the end of the section.
5. **Hands-on** — the learner must *do* something in every lesson, not only read:
   - `K.bench({...})` when there is anything physical or end-to-end (cabling, optics, console access, addressing
     hosts, proving connectivity with ping) — see "Hands-on benches" below;
   - `K.term({...})` for command-line practice on one device (IOS, Linux, Git, K8s);
   - otherwise a pen-and-paper exercise with `K.hint` then answers in `K.reveal(...)`.
6. `K.mistake(...)` (at least two per lesson) and `K.tip(...)` where they help.
7. `K.job(title, html)` — an in-job scenario walked through: the ticket/call/alert as it arrives,
   what you check and in what order, what you say to the user/manager, the fix, what you write in the ticket.
8. `K.case(title, html)` — a longer real-world case (a company, a design decision, an outage) where it fits.
9. **Learning aids, spread through the lesson** (not bunched at the end):
   - `K.dyk(...)` "Did you know?" — 1–2 per lesson: a surprising, true fact that makes the idea stick.
   - `K.myth([[false belief, truth], ...])` — what is NOT true: the misconceptions beginners (and some
     "experienced" people) hold, each corrected.
   - `K.dodont([...dos], [...donts])` — practical rules for doing this at work.
   - `K.when([[option, use when, why, avoid when], ...])` — whenever there is a choice (TCP vs UDP,
     single-mode vs multimode, 2-tier vs 3-tier): when and why to use each.
   - `K.exam(...)` — how the certification exam tests this, and the trick wording to watch for.
   - `K.remember(...)` — a mnemonic or memory hook when there is a list or an order to remember.
   - `K.hint(...)` — inside every exercise, a nudge before the full answer in `K.reveal`.
   - `K.video({...})` — optional; only verified links or a YouTube *search* URL
     (`https://www.youtube.com/results?search_query=...`). Never invent video IDs.
   - `K.img({...})` — optional; local files under `assets/` or verified, properly licensed URLs with credit.
10. `<h2>Interview corner</h2>` — 2–3 real interview questions, model answers inside `K.reveal`.
11. `K.recap([...])` — 5–8 bullets the learner should be able to say out loud.
12. `K.next(...)` — one or two sentences linking to the next lesson.

Plus on the lesson object: `quiz` (12–15 questions) and `cards` (8–12 flashcards). The quiz must mix types like the
real exam (see `qtypes.js`): mostly `mcq`, plus at least one each of `multi` (choose two/three), `order`, `match`,
`fill`, and one scenario question with an `ex` exhibit (real CLI/command output to read). Add 2 inline
`K.q({...})` practice questions of the non-MCQ types in the lesson body. Quiz and card text is plain text (no HTML).
They merge into the course quiz, exam pool and flashcard deck.

### Difficulty — every question carries a level
`lvl:1` **Core** (understand it) · `lvl:2` **Exam** (CCNA/AWS exam standard: scenario, two-step reasoning,
trap options, exhibits) · `lvl:3` **Stretch** (on-the-job: diagnose from symptoms and output, choose between
designs, explain trade-offs). Untagged = Core. Each lesson quiz: at least **40% Exam or Stretch, and 2+ Stretch**.
Hard-mode exams draw only Exam/Stretch questions. Don't make questions hard with trick wording — make them hard
the way the job is hard: more realistic detail, plausible wrong answers, one more step of reasoning.

### Module challenge
The last lesson of every module ends with a **challenge bench** (`challenge:true`): a pre-broken network with
several faults, tasks written as user complaints/outcomes ("Finance can't reach the file server"), each with an
optional `hint`. No step-by-step instructions — the learner diagnoses with real commands.

## Writing rules

- **Length:** 3,000–6,000 words of lesson prose (validator count). Space it out: short paragraphs, one idea each.
  Never cut good material (scenarios, worked examples, case studies) to hit a number; trim only repetition.
- **Never assume.** First use of any jargon → `K.g("term", "plain definition")`. Never write "simply",
  "obviously", "just", "as you know".
- **Explain the why**, not only the what: why the design exists, what breaks without it.
- **Concrete numbers and real outputs** (real IOS/Linux output formats, real port numbers, real MAC formats).
- **Accurate and current**: CCNA = 200-301 v1.1; AWS = current exam guides. If unsure of a detail, leave it out.
- **Context:** mostly global, with occasional Nigerian/African workplace colour (a Lagos office,
  an ISP like MTN/Airtel/MainOne, power cuts and UPSs, a bank branch in Abuja) — it should feel like real jobs.
- **Original writing only.** Course outlines (Udemy etc.) are a benchmark for *coverage*, never a source to copy.
- HTML only: `<p> <h2> <h3> <ul> <ol> <li> <b> <i> <code> <pre> <table>` (wrap tables in
  `<div class="tablewrap">`), `<div class="callout">`. No inline styles except inside SVG.
- Lesson HTML is a JS template literal: no stray backticks, and `${...}` only for `K.*` calls.
  Escape backslashes in CLI output (`\\`).

## Kit reference

| Call | Renders |
|---|---|
| `K.goals(arr)` / `K.pre(arr)` / `K.recap(arr)` | labelled boxes with bullet lists |
| `K.steps([[title, html], ...])` | numbered step-by-step timeline |
| `K.analogy(html)` / `K.tip(html)` / `K.mistake(html)` | callouts |
| `K.job(title, html)` / `K.case(title, html)` | on-the-job scenario / case study boxes |
| `K.reveal(summary, html)` | click-to-open (answers, deep dives) |
| `K.next(html)` | "next up" box |
| `K.hint(html, label?)` | collapsible hint |
| `K.dyk(html)` | "Did you know?" box |
| `K.myth([[myth, fact], ...])` | myth vs fact — what is NOT true |
| `K.dodont(dos, donts)` | two-column do / don't |
| `K.when([[option, when, why, avoid], ...], title?)` | when-to-use-what table |
| `K.exam(html)` | exam tip callout |
| `K.remember(html)` | memory aid box |
| `K.video({t, u, by, mins, why})` | video pick card (opens new tab) |
| `K.img({src, alt, caption, credit})` | image with caption and credit |
| `K.g(term, def)` | glossary term with tap/hover definition |
| `K.kbd("Ctrl")` | keyboard key |
| `K.out(text, caption)` | CLI output block (text is escaped for you) |
| `K.check({q, o:[...], a, why})` | inline quick-check question, `a` = index of the right option |
| `K.q({...})` | inline practice question of any type in `qtypes.js` |
| `K.drill({title, types:[...], count})` | endless generated practice with worked explanations (`drills.js`): `dec2bin bin2dec dec2hex hex2dec bin2hex prefix2mask mask2prefix wildcard subnet hosts2prefix subnets2prefix samesub nth` |
| `K.bench({...})` | hands-on bench: cable devices, fit optics, console in, address PCs, ping (see above) |
| `K.term({env, title, intro, opts, setup(env), tasks:[{text, done(env)}], win, solve:[cmds]})` | live terminal inside the lesson with ticking tasks. `solve` = the commands that complete every task; the validator replays them to prove the tasks are achievable |
| `K.svg(viewBox, inner, caption)` | diagram frame (theme-aware) |
| `K.dev(kind, cx, cy, label, sub)` | device icon: `pc laptop phone server switch router firewall ap cloud printer` |
| `K.box(x,y,w,h,label,sub,accent)` / `K.band(x,y,w,h,label,color)` | labelled box / header band |
| `K.link(x1,y1,x2,y2,label,dashed)` / `K.arrow(x1,y1,x2,y2,label,accent)` | cable / arrow |
| `K.txt(x,y,text,{c,s,mid,end,f,b})` | text (c = colour var name, s = size, f = font var) |

Diagram colours come from CSS variables only (`var(--accent)`, `var(--fg)`, `var(--muted)`, `var(--line)`,
`var(--panel2)`, `var(--chip)`, `var(--ok)`, `var(--warn)`, `var(--bad)`, `var(--link)`), so they work in light and dark.
Typical viewBox width 640–760.

## Question types (`qtypes.js`)

```js
{q, o:[...], a:1, why}                                   // mcq (default)
{type:"multi", q, o:[...], a:[0,3], why}                 // choose two/three — all and only these
{type:"order", q, items:["first","second","third"], why} // shown shuffled; learner reorders
{type:"match", q, pairs:[["22","SSH"],["53","DNS"],["443","HTTPS"]], why}
{type:"fill",  q, fields:[{label:"Mask", a:["255.255.255.0"]}], why}   // or a:[...] for one blank
// any type may add  ex:"show ip interface brief output…"  — an exhibit shown above the question
```

## Hands-on benches (`bench.js`)

```js
K.bench({ id:"m1-office-lan", points:60, from:"CCNA M1 · lesson 1",   // id ⇒ also listed in the Labs tab
  title, intro, viewBox:"0 0 760 360",
  devices:[ {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200", x, y, sfp:{g9:"sfp-sx"}},
            {id:"r1",  kind:"router", label:"R1", x, y},                 // router ports start shut, like real IOS
            {id:"pc1", kind:"pc", label:"PC1", x, y, ip, mask, gw},      // kinds: pc laptop server switch router
            {id:"lap", kind:"laptop", label:"LAPTOP", x, y} ],          // laptops have a USB port for the console cable
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"smf", a:"sw1:g10", b:"core:g10", swapped:true} ],  // pre-cabled
  tray:["cat6","xover","console","mmf","smf","sfp-sx","sfp-lx"],
  tasks:[ {text, done:B=>Bench.upAt(B,"pc1:eth")} ],
  win:"what they just achieved",
  solve:[ ["plug","cat6","pc1:eth","sw1:g1"], ["insert","sw1:g9","sfp-sx"], ["flip","sw1:g10"],
          ["ip","pc1","10.0.0.5","255.255.255.0","10.0.0.1"], ["pc","pc1","ping 10.0.0.1"],
          ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}], ["term","enable"] ] })
```
Ports: switch `g1`–`g8` (RJ45, IOS `GigabitEthernet0/1`–`0/8`), `g9`–`g10` (SFP), `con`; router `g0`, `g1`, `con`;
hub `p1`–`p4`; hosts `eth` (+ `usb` on laptops). Device kinds: `pc laptop server printer switch router hub`.

**Proxy ARP is modelled and ON by default on router interfaces (like real IOS).** A router answers ARP for an address it
can route out of a different interface, and an IOS switch with no `ip default-gateway` ARPs for every destination — so
a proxy-ARP router can hide a missing gateway or a too-wide mask. When a lesson's point is that such a fault breaks
things, configure the router with `no ip proxy-arp` (and say so on the build sheet). `Bench.proxied(B)` tells you it happened.

**What the bench simulates (v2):** every NIC and interface has a MAC address; switches learn source MACs per port and
VLAN, flood broadcasts/unknown unicasts and forward known unicasts; hubs repeat everything out every port; hosts,
routers and switch SVIs ARP for the next hop and keep ARP caches; routers route between connected subnets and static
routes; frames are animated on the cables (amber = broadcast, teal = unicast) and explained step by step in a
"What just happened on the wire" log. Links follow real rules: fibre needs matching optics, fibre type and Tx/Rx
polarity; interfaces must be `no shutdown`; consoles need 9600 8N1 with no flow control; fixed speed/duplex on one
end and auto on the other gives a **duplex mismatch** (link up, CRC/runts on the full side, late collisions on the half side);
different fixed speeds keep the link down.

**PC Command Prompt:** `ipconfig`, `ipconfig /all`, `ping`, `arp -a`, `arp -d`, `ssh -l <user> <ip>` / `ssh user@ip`,
`telnet <ip>`, `cls`. SSH/Telnet open a real session on the device (needs a reachable management IP and the right VTY,
user, domain-name and RSA key config); `exit` closes it.

**Pre-configured devices:** `{..., config: env => { env.exec("en"); env.exec("conf t"); ... }}` runs commands at
creation (that config counts as saved startup-config; add `fresh:true` for an out-of-the-box device).
`challenge:true` + tasks with `hint` = module challenge mode. `openLog:true` opens the frame log by default.

Task helpers: `Bench.upAt(B, ref)`, `Bench.up(B, a, b)`, `Bench.linked(B, a, b)`, `Bench.cableType(B, ref)`,
`Bench.consoleOk(B, devId)`, `Bench.pinged(B, fromId, ip)`, `Bench.macKnown(B, swId, mac)`, `Bench.macCount(B, swId)`,
`Bench.arpHas(B, devId, ip)`, `Bench.remoteTo(B, pcId)` (IP of a logged-in ssh/telnet session), `Bench.session(B, pcId)`
(`{host, proto:"ssh"|"telnet", user}` after login), `Bench.tried(B, pcId, /regex/)` (did the learner run that PC command), `Bench.mismatch(B, a, b)`,
never read `B.remote` / `B.events` directly,
plus `B.devs[id].ip / .mac` and `B.devs[id].env` (the IOS state — see below). Solve actions: `plug unplug insert remove
flip ip pc power console term` (`["term",""]` answers a `[confirm]` with Enter; `["pc","pc1","Str0ng!"]` answers an ssh password).

## Simulator commands available to `K.term`

**Cisco IOS v2 (`env:"ios2"`) — use this for all new CCNA content** (and it is what bench switches/routers run).
`opts: {kind:"switch"|"router", host, model}`. It behaves like real IOS: abbreviations (`sh ip int br`), `?` help,
Tab completion, `% Invalid input detected at '^' marker.` with the caret, `% Incomplete command.`, `% Ambiguous command`,
the `Translating "typo"...domain server` trap (and `no ip domain-lookup`), `[confirm]` prompts, `Password:` prompts with
no echo, `do` in config modes, global commands typed in a sub-mode drop back to global, reload loses unsaved changes.
State for `done(env)`: `env.mode` (`user|priv|config|config-if|config-line|config-vlan`), `env.host`, `env.enableSecret`,
`env.enablePassword`, `env.servicePwEnc`, `env.banner`, `env.lines.con/vty.{password,login,loginLocal,transport,timeout,sync}`,
`env.users[name].{secret,password}`, `env.domain`, `env.domainLookup`, `env.rsa` (bits), `env.sshVer`, `env.defaultGw`,
`env.routes`, `env.cdpRun`, `env.lldpRun`, `env.vlans[id]` (name), `env.intfs[name].{ip,mask,shut,desc,mode,vlan,allowed,native,speed,duplex,cdp,mac}`
(includes `Vlan1` SVI on switches), `env.savedOnce`, `env.startup`, `env.history`, `env.sshReady()`.
Exec: `enable disable exit logout ping traceroute show… copy running-config startup-config write [memory] erase startup-config
reload clear mac address-table dynamic clear counters terminal length`. Show: `running-config startup-config version
ip interface brief interfaces [status|<if>] vlan [brief] mac address-table [dynamic|address|interface|vlan] cdp neighbors [detail]
lldp neighbors arp ip arp ip route history users ip ssh clock`.
Global config: `hostname enable secret|password service password-encryption banner motd #…# interface <if>|range|vlan N
vlan N (name) no vlan line console 0 line vty 0 4|0 15 username X secret|password Y ip domain-name ip domain-lookup
crypto key generate rsa [modulus N] ip ssh version 2 ip default-gateway ip route cdp run lldp run` (and `no` forms).
Interface: `description shutdown no shutdown ip address speed duplex switchport mode access|trunk switchport access vlan
switchport trunk allowed vlan [add|remove] list switchport trunk native vlan switchport nonegotiate cdp enable`.
Line: `password login login local no login transport input ssh|telnet|all|none exec-timeout logging synchronous`.
Also: output modifiers `show … | include|exclude|begin|section <regex>`, `reload in N` / `reload cancel` / `show reload`,
`show users` (lists live SSH/Telnet sessions on a bench), `%SYS-5-CONFIG_I` after leaving config mode, and switch
running-configs show `line vty 0 4` and `line vty 5 15` blocks like a real Catalyst.
Solve lists may include `""` to answer a `[confirm]` or default prompt.

**Cisco IOS v1 (`env:"ios"`)** — the older, simpler engine used by Module 1 and the classic labs. — `opts: {host, kind:"router"|"switch", intfs, strictPing, neighbor, motd}`.
State you can test in `done(env)`: `env.mode` (`user|priv|config|config-if|config-vlan|config-router`),
`env.host`, `env.enableSecret`, `env.savedOnce`, `env.intfs["GigabitEthernet0/1"].{ip,mask,shut,vlan,mode,desc}`,
`env.vlans`, `env.history` (every command typed), `env.pinged[ip]`, `env.staticRoutes`, `env.ospf`.
Commands: `enable`, `disable`, `exit`, `end`, `configure terminal`/`conf t`, `show ip interface brief`,
`show running-config`, `show startup-config`, `show vlan brief`, `show mac address-table`, `show version`,
`show interfaces trunk`, `show ip route`, `show ip ospf neighbor`, `copy running-config startup-config`/`write memory`/`wr`,
`ping <ip>`, `do <cmd>` in config modes; config: `hostname`, `enable secret`, `interface g0/0..g0/2`, `vlan <id>` → `name`,
`router ospf <pid>` → `router-id`, `network <net> <wc> area <n>`, `passive-interface`; `ip route <net> <mask> <nh>`;
interface: `ip address`, `shutdown`, `no shutdown`, `description`, `switchport mode access|trunk`,
`switchport access vlan`, `switchport trunk allowed vlan`.

## Checking your work

Run `node tools/validate.js` before every commit. It loads every data file the way the browser does
and fails on broken JS, bad quiz answers, broken quick checks, unbalanced HTML and terminal tasks that throw.
It also prints words per lesson so thin lessons are easy to spot.

When you release, bump the `?v=` stamp on the script tags in `index.html` (e.g. `?v=20261012a`) so browsers fetch the
new files instead of mixing cached old ones with new ones. Then open the site with `#selftest` on the end of the URL.
