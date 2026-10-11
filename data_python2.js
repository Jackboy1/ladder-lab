// Python expansion pack — regex, structured parsing, REST APIs, and professional tooling (argparse/logging/pytest)
(function(){
const T = LL.tracks.find(t=>t.id==="python"); if(!T) return;

T.lessons.push(
{t:"Regex for network engineers: turning show output into data", html:`
<p>Device output and logs are text; regex is the knife. You only need a focused slice of regex — the slice below covers 95% of network parsing.</p>
<h3>The toolkit, in the order you'll use it</h3>
<pre><code>import re
text = "GigabitEthernet0/1   10.0.12.1   YES manual up   up"

re.search(r"pattern", text)    # first match anywhere → Match object or None
re.match(r"pattern", text)     # only at the START of the string (the classic gotcha)
re.findall(r"pattern", text)   # list of all matches (or tuples, if groups)
re.finditer(r"pattern", text)  # iterator of Match objects — when you need positions
re.sub(r"old", "new", text)    # replace</code></pre>
<p><b>Always raw strings</b>: <code>r"\\d+"</code>. Without the r, Python eats your backslashes before regex ever sees them — the #1 beginner regex bug.</p>
<h3>The characters that matter</h3>
<div class="tablewrap"><table>
<tr><th>Pattern</th><th>Matches</th><th>Network use</th></tr>
<tr><td>\\d+ / \\w+ / \\S+</td><td>digits / word chars / non-space run</td><td>numbers · names · "one column"</td></tr>
<tr><td>\\s+</td><td>whitespace run</td><td>column separators in show output</td></tr>
<tr><td>. and .*</td><td>any char / greedy any-run</td><td>".*?" = lazy — stop at the FIRST chance</td></tr>
<tr><td>^ and $</td><td>line start / end (with re.M)</td><td>anchor per-line parsing</td></tr>
<tr><td>[0-9a-fA-F]{4}</td><td>exactly four hex chars</td><td>MAC chunks</td></tr>
<tr><td>(…)</td><td><b>capture group</b></td><td>the part you keep</td></tr>
<tr><td>(?P&lt;name&gt;…)</td><td>named group</td><td>m.group("intf") — self-documenting</td></tr>
<tr><td>a|b, (?:…)</td><td>alternation, non-capturing group</td><td>Gi|Fa|Te without polluting results</td></tr>
</table></div>
<h3>Worked parse #1 — interfaces with IPs from sh ip int brief</h3>
<pre><code>output = """Interface              IP-Address      OK? Method Status    Protocol
GigabitEthernet0/0     10.0.12.1       YES manual up        up
GigabitEthernet0/1     unassigned      YES unset  down      down
Loopback0              1.1.1.1         YES manual up        up"""

pairs = re.findall(r"^(\\S+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)", output, re.M)
# [('GigabitEthernet0/0', '10.0.12.1'), ('Loopback0', '1.1.1.1')]
# ^ anchors each LINE (re.M); the IP pattern itself filters out 'unassigned' — free.</code></pre>
<h3>Worked parse #2 — named groups + a dict comprehension</h3>
<pre><code>pat = re.compile(r"^(?P&lt;intf&gt;\\S+)\\s+(?P&lt;ip&gt;\\d+\\.\\d+\\.\\d+\\.\\d+).*?(?P&lt;status&gt;up|down)", re.M)
state = { m.group("intf"): m.group("status") for m in pat.finditer(output) }
down = {i for i,s in state.items() if s=="down"}        # straight into your set-audit logic</code></pre>
<h3>Worked parse #3 — MACs and versions</h3>
<pre><code>re.findall(r"(?:[0-9a-fA-F]{4}\\.){2}[0-9a-fA-F]{4}", text)      # Cisco dotted MACs
m = re.search(r"Version\\s+(\\d+\\.\\d+(?:\\.\\d+)?)", show_version)
if m: ver = m.group(1)                                             # ALWAYS check for None first</code></pre>
<h3>The discipline that keeps regex sane</h3>
<ul>
<li><b>compile once</b> (<code>pat = re.compile(...)</code>) when looping over 500 devices.</li>
<li><b>Guard every search</b>: <code>if m:</code> — calling .group() on None is the crash you'll meet otherwise.</li>
<li><b>Greedy vs lazy</b>: <code>".*"</code> grabs to the LAST possibility, <code>".*?"</code> to the first. Quote-extraction bugs live here.</li>
<li>Prefer <code>\\S+</code> columns over clever patterns; show output is columnar — lean on <code>\\s+</code> separators.</li>
<li>When the regex for one command grows past ~2 lines, stop: that's the TextFSM signal (next lesson).</li>
</ul>
<div class="callout">Do the <b>regex code lab</b> below — you'll parse real interface output into (name, IP) pairs and it gets checked.</div>`},

{t:"Structured parsing: TextFSM, ntc-templates, JSON-native devices, pandas", html:`
<p>The maturity ladder for device output: raw regex → templated parsing → structured APIs. Know all three and when each applies.</p>
<h3>TextFSM — regex industrialised</h3>
<p>A TextFSM template defines the <i>values</i> and the line patterns once; parsing any amount of that command's output becomes a one-liner. The open-source <b>ntc-templates</b> library ships hundreds of ready templates for Cisco/Juniper/Arista show commands — which is what Netmiko taps:</p>
<pre><code>rows = conn.send_command("show ip interface brief", use_textfsm=True)
# [{'interface': 'GigabitEthernet0/0', 'ip_address': '10.0.12.1', 'status': 'up', ...}, ...]

down = [r["interface"] for r in rows if r["status"] != "up"]
by_ip = {r["ip_address"]: r["interface"] for r in rows if r["ip_address"] != "unassigned"}</code></pre>
<p>Rule of thumb: <b>if ntc-templates has your command, never hand-write the regex.</b> Hand-rolled regex is for the odd command, the odd vendor, and log lines. (Genie/pyATS is Cisco's own heavier parser ecosystem — recognise the name for interviews.)</p>
<h3>When the device speaks structure natively</h3>
<pre><code>conn.send_command("show ip interface brief | json")   # many NX-OS/newer platforms
# → json.loads and you're in dict-land with ZERO parsing
# RESTCONF/NETCONF (next lesson) are the API-first version of the same idea</code></pre>
<p>The professional instinct: <i>push parsing as close to the source as possible</i>. JSON from the device beats TextFSM beats regex — fall back down the ladder only when forced.</p>
<h3>From rows to reports: csv and pandas</h3>
<pre><code>import csv
with open("audit.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["device","interface","ip","status"])
    w.writeheader()
    w.writerows(all_rows)          # managers get spreadsheets; give them spreadsheets

import pandas as pd                # when analysis starts, stop looping by hand
df = pd.DataFrame(all_rows)
df[df.status != "up"]                         # filter
df.groupby("device").size()                   # count per device
df.to_excel("audit.xlsx", index=False)        # the deliverable finance actually opens</code></pre>
<p>pandas earns its import the moment you'd write a second nested counting loop: filter/group/pivot on 50,000 rows is three lines and no bugs. (It's also the bridge toward the AI/ML course you took — same DataFrame, different destination.)</p>
<h3>Mini case study — the compliance report, end to end</h3>
<pre><code>inventory.json → Netmiko (threads) → use_textfsm=True rows
   → per-device dicts appended to one list
   → set logic: intended vs actual (lesson 2's auditor)
   → csv/xlsx report + exit code 1 if violations   ← cron/CI can now alert on it
This exact pipeline IS Ladder Project 3's architecture. You now know every stage.</code></pre>`},

{t:"REST APIs in practice: requests, auth, retries, pagination, RESTCONF", html:`
<p>Modern infrastructure is API-first: controllers (DNA Center, Meraki, vManage), cloud (boto3 wraps AWS's APIs), monitoring, ticketing. It's all HTTP + JSON, and you already own both halves.</p>
<h3>requests, properly</h3>
<pre><code>import requests, os

BASE = "https://netbox.coscharis.local/api"
HEADERS = {"Authorization": f"Token {os.environ['NETBOX_TOKEN']}",   # token from env, never code
           "Accept": "application/json"}

r = requests.get(f"{BASE}/dcim/devices/", headers=HEADERS,
                 params={"site": "vi-lagos", "status": "active"},    # ?site=...&status=...
                 timeout=10)                                          # ALWAYS set a timeout
r.raise_for_status()               # 4xx/5xx → exception here, not silent garbage later
devices = r.json()["results"]</code></pre>
<ul>
<li><b>Verbs map to intent</b>: GET read · POST create · PUT/PATCH replace/modify · DELETE remove. Status codes you react to: 200/201 ok/created · 204 no-content · 400 your payload is wrong · 401/403 auth/permission · 404 · <b>429 slow down</b> · 5xx their problem (retry).</li>
<li><b>Sending data</b>: <code>requests.post(url, json=payload, ...)</code> — the <code>json=</code> kwarg serialises AND sets Content-Type. (<code>data=</code> sends form-encoding; mixing them up is the classic 400.)</li>
<li><b>Sessions</b>: <code>s = requests.Session(); s.headers.update(HEADERS)</code> — connection reuse + DRY headers across hundreds of calls.</li>
</ul>
<h3>Pagination — every real API does it</h3>
<pre><code>def get_all(url, **kw):
    out = []
    while url:
        r = requests.get(url, **kw); r.raise_for_status()
        page = r.json()
        out += page["results"]
        url = page.get("next")          # follow the cursor until None
    return out                           # forgetting this = "why do I only see 50 devices?"</code></pre>
<h3>Retries with backoff — the difference between a script and a tool</h3>
<pre><code>import time
def get_retry(url, tries=4, **kw):
    for attempt in range(tries):
        try:
            r = requests.get(url, timeout=10, **kw)
            if r.status_code == 429 or r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code}", response=r)
            r.raise_for_status()
            return r
        except requests.RequestException:
            if attempt == tries-1: raise
            time.sleep(2 ** attempt)     # 1s, 2s, 4s — exponential backoff
# 429 handling + backoff is what keeps you from being rate-limit-banned mid-run</code></pre>
<h3>RESTCONF — the SDN NBI, hands on</h3>
<pre><code>url = "https://sandbox-iosxe.cisco.com/restconf/data/ietf-interfaces:interfaces/interface=Loopback100"
hdrs = {"Accept": "application/yang-data+json", "Content-Type": "application/yang-data+json"}
body = {"ietf-interfaces:interface": {
        "name": "Loopback100", "type": "iana-if-type:softwareLoopback", "enabled": True,
        "ietf-ip:ipv4": {"address": [{"ip": "10.100.0.1", "netmask": "255.255.255.255"}]}}}

r = requests.put(url, headers=hdrs, json=body, auth=("developer", pw), verify=False)
print(r.status_code)   # 201 created / 204 changed — you just configured an interface with NO CLI</code></pre>
<p>Same router, three eras: screen-scraped CLI → Netmiko → RESTCONF JSON. The YANG model names look scary; the mechanics are the requests calls you already know. The free <b>Cisco DevNet sandbox</b> (linked on this course page) runs real IOS XE for exactly this practice — and it's the environment Ladder Project 3 audits.</p>
<div class="callout">Do the <b>API code lab</b>: fetch, paginate-lite, handle errors, print a report — checked.</div>`},

{t:"Scripts → tools: argparse, logging, pytest, project shape", html:`
<p>The gap between "my script" and "our tool" is four boring things: a CLI, logs, tests, and a repo shape. They're also exactly what reviewers look at in your public GitHub.</p>
<h3>argparse — a real command-line interface</h3>
<pre><code>import argparse

p = argparse.ArgumentParser(description="Audit OSPF compliance across the fleet")
p.add_argument("--inventory", default="inventory.json", help="device inventory file")
p.add_argument("--site", help="limit to one site")
p.add_argument("--workers", type=int, default=10)
p.add_argument("--verbose", "-v", action="store_true")
args = p.parse_args()
# ./auditor.py --site vi-lagos -v --workers 20   ← and --help writes itself</code></pre>
<p>Hardcoded filenames and edit-the-source "configuration" end here. Flags make the tool usable by a colleague — and by cron and CI.</p>
<h3>logging — print() retires</h3>
<pre><code>import logging
logging.basicConfig(
    level=logging.DEBUG if args.verbose else logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("auditor.log")])
log = logging.getLogger("auditor")

log.debug("full payload: %s", payload)       # -v only
log.info("r1: compliant")                     # normal narrative
log.warning("r7: slow response (4.1s)")
log.error("r9: auth failed")                  # and the run CONTINUES — errors are data</code></pre>
<p>Why it beats print: levels you can dial (-v flips debug on without code edits), timestamps for free, same line to screen AND file, and per-module loggers when the tool grows. Your journald/syslog knowledge from Linux — same severity model, your side of it.</p>
<h3>pytest — prove the pure parts</h3>
<pre><code># parsing.py
def parse_intf_pairs(text):
    return re.findall(r"^(\\S+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)", text, re.M)

# test_parsing.py
from parsing import parse_intf_pairs
SAMPLE = "Gig0/0  10.0.0.1  up\\nGig0/1  unassigned  down\\n"

def test_finds_addressed_interfaces():
    assert parse_intf_pairs(SAMPLE) == [("Gig0/0", "10.0.0.1")]

def test_ignores_unassigned():
    assert all(ip != "unassigned" for _, ip in parse_intf_pairs(SAMPLE))
# $ pytest -q   →  2 passed</code></pre>
<p>Strategy for netauto: you can't pytest a live router, so <b>separate the logic from the I/O</b> — parsing, set-audit math, report building are pure functions fed by saved sample outputs (fixtures). Those get tests; the Netmiko wrapper stays thin. This split is ALSO what your GitHub Actions pipeline (CI/CD course) runs on every push — the tracks interlock here.</p>
<h3>The repo shape reviewers expect</h3>
<pre><code>net-auditor/
├── README.md            # problem · design · trade-off chosen · what you'd do differently
├── requirements.txt
├── .gitignore           # venv/ __pycache__/ .env *.log
├── auditor.py           # thin CLI entry (argparse)
├── parsing.py  rules.py # the pure, tested logic
├── tests/test_parsing.py
└── sample_outputs/      # fixtures: real show output, scrubbed</code></pre>
<p>Finishing move for Project 3: this layout + a passing pytest badge from your CI pipeline. At that point the repo doesn't say "I took courses" — it says "I ship tools."</p>`}
);

T.quiz.push(
{q:"Why must regex patterns be raw strings (r\"\\d+\")?", o:["Speed","Python would consume the backslashes before regex sees them","They compile automatically","Unicode"], a:1, why:"String escaping happens first; r\"\" hands the backslashes through intact — the #1 regex bug."},
{q:"re.match vs re.search:", o:["Identical","match anchors at the string START; search finds the first match anywhere","search is deprecated","match returns all"], a:1, why:"Mid-line patterns silently fail with match — use search (or anchor explicitly)."},
{q:"re.findall with capture groups returns…", o:["Match objects","A list of the captured groups (tuples if several)","Booleans","The whole lines"], a:1, why:"Groups change findall's output shape — handy for (interface, ip) pairs, surprising if unexpected."},
{q:"\".*\" vs \".*?\" between quotes:", o:["No difference","Greedy runs to the LAST close-quote; lazy ? stops at the first","Lazy is slower only","Greedy is invalid"], a:1, why:"Greedy maximises, lazy minimises — the quote/bracket extraction bug everyone writes once."},
{q:"Parsing show output per-line with ^ requires…", o:["re.I","re.M (multiline) so ^ matches each line start","re.S","Nothing"], a:1, why:"Without re.M, ^ means only the very start of the whole string."},
{q:"m = re.search(...); m.group(1) crashes sometimes because…", o:["Groups start at 0","m is None when nothing matched — guard with if m:","group needs a string","re is not imported"], a:1, why:"search returns None on no-match; .group on None = AttributeError. Always check."},
{q:"Netmiko's use_textfsm=True relies on which template library?", o:["pyYAML","ntc-templates","Jinja2","pandas"], a:1, why:"Community TextFSM templates for hundreds of show commands — if it has your command, don't hand-roll regex."},
{q:"requests.post(url, json=payload) vs data=payload:", o:["Same","json= serialises to JSON and sets Content-Type; data= sends form-encoded","data is faster","json needs dumps first"], a:1, why:"Mixing them up is the classic mystery 400 from JSON APIs."},
{q:"r.raise_for_status() exists so that…", o:["Slow responses retry","4xx/5xx become exceptions immediately instead of garbage parsed later","It logs in","It paginates"], a:1, why:"Fail loudly at the call site; otherwise you debug 'NoneType has no key' three functions away."},
{q:"API returns only 50 of your 800 devices. You forgot…", o:["verify=False","Pagination — follow the 'next' cursor until null","A bigger timeout","POST instead of GET"], a:1, why:"Real APIs page results; loop the next link (or page params) to completion."},
{q:"On HTTP 429 the professional response is…", o:["Retry instantly in a tight loop","Exponential backoff (1s, 2s, 4s…) and respect any Retry-After","Switch to POST","Ignore it"], a:1, why:"429 = rate limited; hammering it gets you banned mid-run. Backoff is the handshake."},
{q:"You can't pytest a live router, so you…", o:["Skip testing","Separate pure logic (parsing, audit math) from I/O and test it against saved sample outputs","Mock the internet","Test in prod"], a:1, why:"Pure functions + fixtures = fast honest tests; the Netmiko layer stays thin. CI runs them on every push."},
{q:"argparse's action=\"store_true\" creates…", o:["A required string arg","A boolean flag (--verbose) defaulting to False","A list","A subcommand"], a:1, why:"Present = True; absent = False — the standard -v pattern that then flips logging to DEBUG."},
);

T.cards.push(
{f:"Regex survival six", b:"\\d+ \\S+ \\s+ .*? (…) ^…$ with re.M — covers 95% of show-output parsing."},
{f:"Raw strings", b:"Always r\"pattern\" — else Python eats the backslashes first."},
{f:"search vs match vs findall", b:"search=first anywhere · match=start only · findall=list (of groups, if any)."},
{f:"Greedy vs lazy", b:".* runs to the LAST possibility; .*? stops at the first. Quote bugs live here."},
{f:"Guard matches", b:"m = re.search(...); if m: use m.group(...). None.group() is the crash."},
{f:"Named groups", b:"(?P<intf>\\S+) → m.group(\"intf\") — self-documenting parses."},
{f:"Parsing ladder", b:"Device JSON > TextFSM/ntc-templates > hand regex. Fall down only when forced."},
{f:"use_textfsm=True", b:"show command → list of dicts via ntc-templates. Filter/set-audit directly."},
{f:"requests essentials", b:"timeout= always · raise_for_status() · json= to send · Session() for many calls · token from os.environ."},
{f:"Status reflexes", b:"400 my payload · 401/403 auth · 404 · 429 backoff · 5xx retry."},
{f:"Pagination loop", b:"while url: fetch → extend results → url = page['next']."},
{f:"Backoff", b:"retry 429/5xx with sleep(2**attempt); last attempt re-raises."},
{f:"print → logging", b:"basicConfig(level by -v), levels DEBUG/INFO/WARNING/ERROR, stream+file handlers, timestamps free."},
{f:"Testable netauto", b:"Pure parsing/audit functions + sample-output fixtures under pytest; thin I/O wrapper untested."},
);

T.codelabs.push(
{
  id:"py-regex", t:"Code lab: parse the interface table",
  brief:"Given OUTPUT (a show ip interface brief dump), use re.findall with re.M to extract (interface, ip) pairs for addressed interfaces only, into a variable pairs — the pattern itself should exclude 'unassigned'. Then print each as 'intf -> ip'. Use a raw string.",
  starter:"import re\n\nOUTPUT = \"\"\"Interface              IP-Address      Status\nGigabitEthernet0/0     10.0.12.1       up\nGigabitEthernet0/1     unassigned      down\nLoopback0              1.1.1.1         up\"\"\"\n\n# your code below\n",
  checks:[
    {re:"re\\.findall\\s*\\(", hint:"Use re.findall to get all pairs in one call."},
    {re:"r\"|r'", hint:"The pattern must be a raw string: r\"...\"."},
    {re:"\\(\\\\S\\+\\)", hint:"Capture the interface column with (\\S+)."},
    {re:"\\\\d\\+\\\\.\\\\d\\+\\\\.\\\\d\\+\\\\.\\\\d\\+", hint:"Match a dotted IPv4: \\d+\\.\\d+\\.\\d+\\.\\d+ (this is what filters out 'unassigned')."},
    {re:"re\\.M|re\\.MULTILINE", hint:"Anchor per line: pass re.M so ^ works on every line."},
    {re:"for\\s+\\w+\\s*,\\s*\\w+\\s+in\\s+pairs", hint:"Unpack and print: for intf, ip in pairs: ..."},
  ],
  model:`pairs = re.findall(r"^(\\S+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)", OUTPUT, re.M)

for intf, ip in pairs:
    print(f"{intf} -> {ip}")

# [('GigabitEthernet0/0', '10.0.12.1'), ('Loopback0', '1.1.1.1')]
# 'unassigned' never matches the IP pattern — the filter costs nothing.`,
},
{
  id:"py-api", t:"Code lab: consume a paginated API",
  brief:"Write get_all(url, headers) that follows pagination: loop while url is truthy, requests.get with the headers and a 10s timeout, call raise_for_status(), extend a results list with page['results'], set url = page.get('next'); return the list. Then call it and print each device's 'name'.",
  starter:"import requests\n\ndef get_all(url, headers):\n    ...\n\ndevices = get_all(\"https://nb.local/api/dcim/devices/\", HEADERS)\n",
  checks:[
    {re:"while\\s+url", hint:"Pagination is a while url: loop."},
    {re:"requests\\.get\\s*\\(", hint:"Fetch each page with requests.get(...)."},
    {re:"timeout\\s*=\\s*10", hint:"Always set timeout=10 — hung sockets kill unattended runs."},
    {re:"raise_for_status\\s*\\(\\)", hint:"Fail loudly: r.raise_for_status() after each call."},
    {re:"\\.get\\(\\s*[\"']next[\"']", hint:"Advance the cursor: url = page.get('next')."},
    {re:"\\[\\s*[\"']results[\"']\\s*\\]", hint:"Collect page['results'] into your list."},
  ],
  model:`def get_all(url, headers):
    out = []
    while url:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        page = r.json()
        out.extend(page["results"])
        url = page.get("next")
    return out

devices = get_all("https://nb.local/api/dcim/devices/", HEADERS)
for d in devices:
    print(d["name"])`,
},
{
  id:"py-cli", t:"Code lab: give the auditor a real CLI",
  brief:"Wire up the tool interface: argparse with --inventory (default inventory.json), --workers (type int, default 10) and a --verbose/-v store_true flag; logging.basicConfig whose level is DEBUG when verbose else INFO; then log.info the chosen inventory and worker count.",
  starter:"import argparse, logging\n\n# your code below\n",
  checks:[
    {re:"argparse\\.ArgumentParser\\s*\\(", hint:"Create the parser with argparse.ArgumentParser(...)."},
    {re:"add_argument\\([\"']--inventory", hint:"Add --inventory with default='inventory.json'."},
    {re:"type\\s*=\\s*int", hint:"--workers should be type=int."},
    {re:"action\\s*=\\s*[\"']store_true[\"']", hint:"--verbose/-v is a boolean flag: action='store_true'."},
    {re:"logging\\.DEBUG\\s+if\\s+\\w+\\.verbose\\s+else\\s+logging\\.INFO|verbose\\s*\\?\\s*", hint:"Pick the level from the flag: logging.DEBUG if args.verbose else logging.INFO."},
    {re:"basicConfig\\s*\\(", hint:"Configure once with logging.basicConfig(level=..., format=...)."},
    {re:"\\.info\\s*\\(", hint:"Emit at least one log.info(...) using the parsed args."},
  ],
  model:`p = argparse.ArgumentParser(description="Fleet compliance auditor")
p.add_argument("--inventory", default="inventory.json")
p.add_argument("--workers", type=int, default=10)
p.add_argument("--verbose", "-v", action="store_true")
args = p.parse_args()

logging.basicConfig(
    level=logging.DEBUG if args.verbose else logging.INFO,
    format="%(asctime)s %(levelname)-7s %(message)s")
log = logging.getLogger("auditor")

log.info("inventory=%s workers=%d", args.inventory, args.workers)
log.debug("debug logging enabled")`,
}
);
})();
