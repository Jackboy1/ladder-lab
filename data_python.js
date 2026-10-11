// Phase 1 — Python for Network Automation (Ladder step 5) — Andrei course coverage + the gaps filled
(function(){

LL.tracks.push({
  id:"python", phase:1, title:"Python & Network Automation", tag:"Ladder step 5 · Project 3", hours:"12–16h",
  blurb:"From the Andrei course you took — basics, sets explained properly this time, files/JSON, OOP, Paramiko/Netmiko, the 500-router scenario, threading, Ansible — plus the gaps: comprehensions, venv/pip, REST APIs.",
  lessons:[
  {t:"Python essentials: types, dynamic typing, operators, scopes, errors", html:`
<h3>Static vs dynamic typing</h3>
<p>C declares <code>int x = 5;</code> and x is an int forever (static). Python binds names to objects at runtime (dynamic): <code>x = 5</code> then <code>x = "five"</code> is legal. The type lives on the <i>object</i>, not the name. Freedom now, surprises later — which is why type hints exist: <code>def ping(host: str, count: int = 1) -&gt; bool:</code> — not enforced at runtime, but editors and reviewers love them.</p>
<pre><code>type(5)        # int        type(2.0)   # float
type("r1")     # str        type(True)  # bool
type(None)     # NoneType — "no value", what functions return by default
int("10")+5    # 15 — but int("ten") raises ValueError</code></pre>
<h3>Operators worth a second look</h3>
<pre><code>7 / 2    # 3.5  true division, always float
7 // 2   # 3    floor division
7 % 2    # 1    modulo — "every 10th router": if i % 10 == 0
2 ** 8   # 256  power — subnet host counts!
"Gi0/" + str(1)        # concatenation needs same types
f"int Gi0/{n} is {state}"   # f-strings: the only formatting you need
10 == 10.0   # True (value)      x is None   # identity — the one place to use 'is'
"ospf" in config_text         # substring / membership test</code></pre>
<h3>Truthiness</h3>
<p>Empty things are falsy: <code>"" [] {} set() 0 None</code>. So <code>if failed_hosts:</code> reads as “if any failed” — idiomatic Python.</p>
<h3>Scope — the LEGB rule</h3>
<pre><code>timeout = 10            # global
def connect():
    timeout = 5         # NEW local name — the global is untouched
def set_timeout():
    global timeout      # explicitly rebind the global (use sparingly)
    timeout = 30</code></pre>
<p>Lookup order: <b>L</b>ocal → <b>E</b>nclosing function → <b>G</b>lobal → <b>B</b>uilt-ins. Reading a global inside a function is fine; <i>assigning</i> creates a local unless you say <code>global</code>. That asymmetry explains 90% of scope confusion.</p>
<h3>Errors: read tracebacks bottom-up, handle precisely</h3>
<pre><code>try:
    conn = ConnectHandler(**device)
except NetmikoTimeoutException:
    print(f"{device['host']}: timeout — skip and continue")
except NetmikoAuthenticationException:
    print(f"{device['host']}: bad credentials")
except Exception as e:              # the safety net, last
    print(f"{device['host']}: unexpected {type(e).__name__}: {e}")
else:
    ...     # runs only if no exception
finally:
    conn.disconnect()   # runs no matter what — cleanup lives here</code></pre>
<p>Rule of automation: <b>one broken router must never kill a 500-router run.</b> try/except per device, collect failures, report at the end. Catch specific exceptions first; a bare <code>except:</code> that swallows everything (including Ctrl-C) is how bugs hide for months.</p>`},

  {t:"Collections deep dive — and sets, finally explained", html:`
<h3>Lists — ordered, changeable</h3>
<pre><code>devices = ["r1", "r2", "sw1"]
devices.append("sw2"); devices.insert(0, "fw1"); devices.remove("r2")
devices[0]      # first        devices[-1]   # last
devices[1:3]    # slice        len(devices)
sorted(devices) # new sorted list;  devices.sort()  in place</code></pre>
<h3>Tuples</h3>
<p>Immutable lists: <code>("r1", "10.0.0.1")</code>. Use for fixed records; unpack with <code>name, ip = pair</code>. Immutability means they can be dict keys and set members.</p>
<h3>Dictionaries — the shape of everything in networking</h3>
<pre><code>device = {"host": "10.0.0.1", "device_type": "cisco_ios", "username": "admin"}
device["host"]                # KeyError if missing
device.get("port", 22)        # default instead of crashing — prefer this
device["secret"] = "en-pass"  # add/update
for key, value in device.items():
    print(key, value)
inventory = {"r1": {"ip": "10.0.0.1", "site": "VI"},    # nesting = your inventory file
             "r2": {"ip": "10.0.0.2", "site": "Lekki"}}
inventory["r1"]["site"]       # "VI"</code></pre>
<p>Netmiko takes devices as dicts, APIs return JSON that becomes dicts — master this and you've mastered the data shape of the whole field.</p>
<h3>Sets — the part you said never clicked</h3>
<p>Forget the math-class framing. A set is just <b>a bag of unique items with instant membership checks and comparison operators between bags</b>. Three properties: no duplicates, no order, blazing <code>in</code> checks.</p>
<pre><code>seen = set()
seen.add("r1"); seen.add("r1")     # still just {"r1"} — dedup is automatic
"r1" in seen                        # True, and fast even with a million entries
unique_ips = set(ip_list)           # dedup any list in one call</code></pre>
<p><b>Where sets earn their living — comparing two worlds.</b> This is literally your Ladder Project 3 (config auditor):</p>
<pre><code>intended = {"r1", "r2", "r3", "sw1", "sw2"}       # devices that SHOULD have OSPF
actual   = {"r1", "r3", "sw1", "sw9"}             # devices that DO (parsed from configs)

missing  = intended - actual     # {"r2","sw2"}  → difference: should-have but don't  ⇒ FIX
rogue    = actual - intended     # {"sw9"}       → running it without approval        ⇒ INVESTIGATE
fine     = intended &amp; actual     # intersection: compliant
all_seen = intended | actual     # union: everything
intended &lt;= all_seen             # subset check: True</code></pre>
<p>Read <code>A - B</code> as “in A but not in B”. Every audit, every diff of expected-vs-actual, every “which hosts answered the scan that aren't in the inventory?” is three lines of set arithmetic. That's the whole trick — sets are the audit tool.</p>
<h3>Comprehensions (a gap in the original course notes — filled)</h3>
<pre><code>ips      = [f"10.0.0.{i}" for i in range(1, 11)]           # build a list in one line
up_hosts = [h for h in hosts if ping(h)]                    # filter
host_ip  = {d["name"]: d["ip"] for d in device_list}        # dict comprehension
vlans    = {line.split()[1] for line in cfg if line.startswith("vlan")}  # set comprehension</code></pre>`},

  {t:"Files, with-blocks, and JSON serialization", html:`
<h3>Reading and writing text files</h3>
<pre><code>with open("hosts.txt") as f:          # 'with' closes the file even on errors — always use it
    hosts = [line.strip() for line in f if line.strip()]

with open("backup_r1.txt", "w") as f:  # w overwrite, a append
    f.write(output)

# one backup file per device, dated — the pattern from the course:
from datetime import date
for name, output in results.items():
    with open(f"{name}_{date.today()}.cfg", "w") as f:
        f.write(output)</code></pre>
<p><code>.strip()</code> removes the invisible newline each line carries — forgetting it is why your hostname comparisons mysteriously fail.</p>
<h3>Serialization: objects ⇄ text</h3>
<p>Python objects live in RAM; to save or send them you <b>serialize</b> to text. JSON is the lingua franca — it looks like Python dicts/lists and every API speaks it.</p>
<pre><code>import json
device = {"host": "r1", "vlans": [10, 20], "mgmt": {"ip": "10.0.0.1"}}

text = json.dumps(device, indent=2)     # dumps = dump-to-String  (serialize)
obj  = json.loads(text)                 # loads = load-from-String (deserialize)
obj["vlans"][0]                          # 10 — it's a real dict again

with open("inventory.json", "w") as f:  # dump/load (no s) talk to FILES directly
    json.dump(inventory, f, indent=2)
with open("inventory.json") as f:
    inventory = json.load(f)</code></pre>
<p>Mnemonic: the <b>s</b> means <b>s</b>tring. dumps/loads ↔ strings; dump/load ↔ files. JSON differences from Python: <code>true/false/null</code> not <code>True/False/None</code>, keys must be strings, no trailing commas.</p>
<h3>Real scenario — an inventory-driven run</h3>
<pre><code>with open("inventory.json") as f:
    inventory = json.load(f)

for name, info in inventory.items():
    if info["site"] == "VI" and info.get("managed", True):
        configure(info["ip"])</code></pre>
<p>Config-as-data: change the JSON, not the code. (YAML is the same idea with nicer syntax — <code>import yaml; yaml.safe_load(f)</code> — and it's what Ansible playbooks are written in, so you already half-know it.)</p>
<h3>CSV, since spreadsheets find every ops team</h3>
<pre><code>import csv
with open("devices.csv") as f:
    for row in csv.DictReader(f):       # each row becomes a dict keyed by header
        print(row["hostname"], row["ip"])</code></pre>`},

  {t:"Functions and OOP (classes) without the mystery", html:`
<h3>Functions first — most automation is just good functions</h3>
<pre><code>def backup_device(device: dict, outdir: str = "backups") -&gt; bool:
    """Save running-config; return True on success."""   # docstring
    try:
        conn = ConnectHandler(**device)   # ** unpacks the dict into keyword args
        out = conn.send_command("show running-config")
        ...
        return True
    except Exception:
        return False

ok = backup_device(r1)                    # positional / keyword args, defaults
def run(*hosts, **options): ...           # *args tuple, **kwargs dict — accept anything</code></pre>
<p><code>**device</code> unpacking is why Netmiko inventories are dicts: <code>ConnectHandler(**device)</code> = <code>ConnectHandler(host=..., username=..., ...)</code>.</p>
<h3>Why classes at all?</h3>
<p>When data and the functions that act on it keep travelling together, wrap them in a class: the data becomes <b>attributes</b>, the functions <b>methods</b>.</p>
<pre><code>class NetworkDevice:
    def __init__(self, hostname, ip, device_type="cisco_ios"):
        self.hostname = hostname          # self = THIS instance
        self.ip = ip
        self.device_type = device_type
        self.reachable = None

    def check(self):
        self.reachable = ping(self.ip)
        return self.reachable

    def __repr__(self):                   # how it prints — debugging joy
        return f"&lt;{self.device_type} {self.hostname} @ {self.ip}&gt;"

r1 = NetworkDevice("r1", "10.0.0.1")      # __init__ runs; r1 is an instance
r1.check(); print(r1.reachable)</code></pre>
<h3>Inheritance — share the common, override the different</h3>
<pre><code>class CiscoIOS(NetworkDevice):
    def backup_cmd(self): return "show running-config"

class JuniperJunos(NetworkDevice):
    def backup_cmd(self): return "show configuration | display set"

for dev in fleet:                 # polymorphism: same call, right behaviour per type
    output = conn.send_command(dev.backup_cmd())</code></pre>
<p><code>super().__init__(...)</code> calls the parent's constructor when the child adds its own fields. That's 90% of the OOP you'll use in automation; dataclasses shrink the boilerplate further (<code>@dataclass</code> writes __init__/__repr__ for you).</p>
<h3>Project structure, venv and pip (gap filled)</h3>
<pre><code>python3 -m venv venv              # isolated environment per project
source venv/bin/activate          # (Windows: venv\\Scripts\\activate)
pip install netmiko rich
pip freeze &gt; requirements.txt     # lock what you used
pip install -r requirements.txt   # recreate anywhere — this file belongs in your repo</code></pre>
<p>Never pip-install into the system Python; every serious repo has a venv + requirements.txt, and interviewers check.</p>`},

  {t:"SSH automation: Paramiko, getpass, Netmiko", html:`
<h3>Paramiko — raw SSH from Python</h3>
<pre><code>import paramiko
from getpass import getpass

password = getpass("Password: ")      # prompts WITHOUT echoing — never hardcode creds

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())   # lab convenience; prod verifies keys
ssh.connect("10.0.0.1", port=22, username="admin", password=password,
            look_for_keys=False, allow_agent=False)

stdin, stdout, stderr = ssh.exec_command("show ip int brief")   # the 3 streams again!
print(stdout.read().decode())
err = stderr.read().decode()
ssh.close()</code></pre>
<p><code>exec_command</code> runs one command per channel — great on Linux boxes. Network devices often need an <b>interactive shell</b> instead (<code>ssh.invoke_shell()</code>, then <code>shell.send()</code> / <code>time.sleep()</code> / <code>shell.recv()</code>) because IOS expects a terminal with modes and prompts. Managing those prompts yourself is exactly the pain Netmiko removes.</p>
<h3>Netmiko — Paramiko that understands network devices</h3>
<pre><code>from netmiko import ConnectHandler

r1 = {
    "device_type": "cisco_ios",
    "host": "10.0.0.1",
    "username": "admin",
    "password": password,
    "secret":   enable_pass,       # enable secret
}

conn = ConnectHandler(**r1)
conn.enable()                                      # → privileged exec
output = conn.send_command("show ip int brief")    # waits for the prompt intelligently

cmds = ["interface g0/2",
        "ip address 10.20.0.1 255.255.255.0",
        "no shutdown"]
conn.send_config_set(cmds)                         # enters/exits config mode for you
conn.save_config()                                 # write mem
conn.disconnect()</code></pre>
<p>Structured output instead of string-parsing: <code>send_command("show ip int brief", use_textfsm=True)</code> returns a <b>list of dicts</b> (interface, ip, status…) — turning show-commands into data you can audit with set logic.</p>
<h3>SCP/SFTP — moving files</h3>
<pre><code>sftp = ssh.open_sftp()                 # Paramiko
sftp.put("gold_config.txt", "/flash/gold.txt")
sftp.get("/var/log/messages", "r1_messages.log")
# Netmiko: from netmiko import file_transfer — handles verification + enough-space checks</code></pre>
<div class="callout"><b>Credentials rule:</b> getpass for interactive runs, environment variables (<code>os.environ["NET_PASS"]</code>) or a vault for scheduled ones. A password in a Git repo is a resignation letter with extra steps.</div>`},

  {t:"Scale: 500 routers, OSPF everywhere, multithreading, Linux targets", html:`
<h3>The course's flagship scenario, rebuilt</h3>
<p>Task: enable OSPF on 500 routers. Serial version — a loop, resilient per device:</p>
<pre><code>import json, time
from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException

with open("inventory.json") as f:
    devices = json.load(f)                      # list of device dicts

OSPF = ["router ospf 1", "network 10.0.0.0 0.255.255.255 area 0"]

results, failures = {}, {}
for dev in devices:
    name = dev["host"]
    try:
        conn = ConnectHandler(**dev)
        conn.enable()
        conn.send_config_set(OSPF)
        results[name] = conn.send_command("show ip ospf neighbor")
        conn.save_config(); conn.disconnect()
    except NetmikoTimeoutException:   failures[name] = "timeout"
    except NetmikoAuthenticationException: failures[name] = "auth"
    except Exception as e:            failures[name] = str(e)

print(f"OK: {len(results)}  FAILED: {len(failures)}")
for name, why in failures.items(): print(f"  {name}: {why}")</code></pre>
<p>At ~8s per device that's <b>over an hour</b> for 500. The work is network-waiting, not CPU — the textbook case for threads.</p>
<h3>Multithreading done the modern way</h3>
<pre><code>from concurrent.futures import ThreadPoolExecutor, as_completed

def configure(dev):
    conn = ConnectHandler(**dev); conn.enable()
    conn.send_config_set(OSPF); conn.save_config(); conn.disconnect()
    return dev["host"], "ok"

with ThreadPoolExecutor(max_workers=20) as pool:          # 20 at a time, not 500
    futures = {pool.submit(configure, d): d["host"] for d in devices}
    for fut in as_completed(futures):
        host = futures[fut]
        try:    print(host, fut.result()[1])
        except Exception as e: print(host, "FAILED:", e)</code></pre>
<p>500 devices ÷ 20 workers ≈ 25 batches ≈ <b>3–4 minutes</b>. Why a pool and not 500 raw <code>threading.Thread</code>s: bounded concurrency protects your CPU, the devices' vty lines, and the AAA server. (The GIL footnote: Python threads don't run CPU work in parallel, but I/O waits release the GIL — perfect here. CPU-heavy work would use <code>ProcessPoolExecutor</code>.)</p>
<h3>Linux targets: subprocess</h3>
<pre><code>import subprocess
r = subprocess.run(["ping", "-c", "1", "-W", "1", host],
                   capture_output=True, text=True)
if r.returncode == 0: ...        # stdout in r.stdout, stderr in r.stderr</code></pre>
<p>Same three streams, same exit-code logic as bash — the knowledge transfers both ways. Pass args as a <b>list</b>, never one shell string with user input (command injection).</p>
<h3>Ansible — when scripts graduate</h3>
<p>Ansible is the agentless, YAML-driven version of everything above: inventory file + playbook, idempotent modules, SSH underneath.</p>
<pre><code># playbook.yml
- name: Enable OSPF everywhere
  hosts: routers
  gather_facts: no
  tasks:
    - name: OSPF process
      cisco.ios.ios_config:
        lines:
          - router ospf 1
          - network 10.0.0.0 0.255.255.255 area 0
# ansible-playbook -i inventory.ini playbook.yml</code></pre>
<p><b>Idempotent</b> = run it twice, it changes nothing the second time — it describes desired state rather than actions. When to script vs playbook: custom logic/parsing/auditing → Python; pushing declared state at scale → Ansible. Teams use both; your Project 3 auditor is the Python side, feeding findings that Ansible then fixes.</p>
<h3>REST APIs (gap filled — the modern device interface)</h3>
<pre><code>import requests
r = requests.get("https://sandbox/restconf/data/ietf-interfaces:interfaces",
                 auth=("admin", pw), headers={"Accept": "application/yang-data+json"},
                 verify=False)
data = r.json()        # JSON → dicts: everything from lesson 3 applies</code></pre>
<p>RESTCONF/controller APIs (the SDN NBI from your CCNA track) are replacing screen-scraping — and they're just <code>requests</code> + JSON, which you now own.</p>`},
  ],
  quiz:[
  {q:"intended - actual on two sets gives you…", o:["Items in both","Items in intended missing from actual","Items in actual not intended","The union"], a:1, why:"Difference reads left-to-right: 'in A but not in B' — the audit's FIX list."},
  {q:"Which structure dedups a list of 10,000 IPs in one call?", o:["tuple()","dict()","set()","sorted()"], a:2, why:"set(ip_list) — uniqueness is the data structure's definition."},
  {q:"json.dumps vs json.dump:", o:["Identical","dumps → string, dump → file object","dump is deprecated","dumps reads files"], a:1, why:"The s = string. loads/load mirror it for reading."},
  {q:"Assigning to a variable inside a function (no 'global') does what?", o:["Changes the global","Creates a new local name","Raises an error","Depends on type"], a:1, why:"Assignment creates a local; only reading reaches outward (LEGB)."},
  {q:"One router times out in a 500-device loop. Correct design:", o:["Let the script crash and restart","try/except per device, record, continue, report at end","Ping first, then skip try/except","Increase timeout to 10 minutes"], a:1, why:"One failure must never kill the run; collect and report failures."},
  {q:"getpass.getpass() exists so that…", o:["Passwords are encrypted on disk","The password isn't echoed to screen or shell history","It generates passwords","SSH keys load"], a:1, why:"Prompt without echo — no credential in code, screen, or history."},
  {q:"ConnectHandler(**device) — the ** does what?", o:["Squares the dict","Unpacks the dict into keyword arguments","Makes it global","Deep-copies it"], a:1, why:"host=..., username=... etc. straight from the dict — why inventories are dicts."},
  {q:"send_config_set() vs send_command():", o:["No difference","config_set enters/exits config mode and sends a list of config lines","send_command is for files","config_set reboots"], a:1, why:"send_command = exec-mode shows; send_config_set wraps conf t … end around your lines."},
  {q:"Threads speed up the 500-router job because…", o:["Python threads use all CPU cores","The work is I/O waiting, which releases the GIL","Netmiko requires them","They skip authentication"], a:1, why:"Network waits dominate; 20 overlapping waits ≈ 20× throughput. CPU-bound work would need processes."},
  {q:"max_workers=20 instead of one thread per device because…", o:["Threads cost $","Bounded concurrency protects your machine, device vty lines and AAA","Python allows max 32 threads","It's alphabetical"], a:1, why:"500 simultaneous SSH sessions can DoS your own infrastructure and auth servers."},
  {q:"'Idempotent' in Ansible means…", o:["Runs as root","Re-running produces no further changes when state already matches","Encrypted transport","Parallel by default"], a:1, why:"Playbooks declare desired state; already-correct devices are left untouched."},
  {q:"use_textfsm=True on a show command returns…", o:["Raw text, faster","A list of dicts — parsed, structured output","XML","A pandas DataFrame"], a:1, why:"Structured data you can filter and set-compare instead of regexing raw text."},
  ],
  cards:[
  {f:"Set operators", b:"A - B difference (in A not B) · A & B intersection · A | B union · A <= B subset. Audits = set math."},
  {f:"Why sets", b:"Unique items + instant 'in' + compare two collections. Dedup: set(list)."},
  {f:"dict.get()", b:"d.get('key', default) — no KeyError. Use for optional fields."},
  {f:"dumps/loads vs dump/load", b:"s = string. No-s versions read/write file objects."},
  {f:"with open(...)", b:"Context manager: file closes even on exceptions. Always."},
  {f:"LEGB", b:"Name lookup: Local → Enclosing → Global → Builtins. Assignment = local unless 'global'."},
  {f:"try/except/else/finally", b:"Specific exceptions first; else = no error; finally = always (cleanup)."},
  {f:"**device", b:"Dict → keyword args. ConnectHandler(**device)."},
  {f:"Netmiko big four", b:"ConnectHandler, .enable(), .send_command(), .send_config_set() + save_config()."},
  {f:"Paramiko exec_command returns", b:"stdin, stdout, stderr — read().decode() to get text."},
  {f:"ThreadPoolExecutor pattern", b:"with ThreadPoolExecutor(max_workers=N) as pool → submit → as_completed → result() in try."},
  {f:"GIL rule of thumb", b:"I/O-bound → threads fine (waits release GIL). CPU-bound → processes."},
  {f:"subprocess.run", b:"run([args], capture_output=True, text=True) → .returncode .stdout .stderr. List args, never shell strings with input."},
  {f:"Idempotency", b:"Second run changes nothing — declare state, don't replay actions. Ansible's core idea."},
  {f:"venv + requirements.txt", b:"python3 -m venv venv → activate → pip install → pip freeze > requirements.txt. Every repo."},
  {f:"TextFSM", b:"send_command(cmd, use_textfsm=True) → list of dicts from show output."},
  ],
  labs:[],
  codelabs:[
  {
    id:"py-audit", t:"Code lab: mini config auditor (Project 3 seed)",
    brief:"intended is a set of hostnames that must run OSPF. configs is a dict of hostname → running-config text. Write code that builds the set of hosts whose config contains 'router ospf', then prints MISSING (intended but not running) and ROGUE (running but not intended), one per line.",
    starter:"intended = {\"r1\", \"r2\", \"r3\", \"sw1\"}\nconfigs = {\n  \"r1\": \"hostname r1\\nrouter ospf 1\\n network 10.0.0.0 0.255.255.255 area 0\",\n  \"r2\": \"hostname r2\\nip route 0.0.0.0 0.0.0.0 10.0.0.254\",\n  \"r3\": \"hostname r3\\nrouter ospf 1\",\n  \"sw9\": \"hostname sw9\\nrouter ospf 1\",\n}\n\n# your code below\n",
    checks:[
      {re:"router ospf", hint:"Detect OSPF by checking whether 'router ospf' is in each config text."},
      {re:"for\\s+\\w+\\s*(,\\s*\\w+)?\\s+in\\s+configs\\.items\\(\\)|\\{[^}]*for[^}]*configs", hint:"Iterate configs.items() (or use a set comprehension over it)."},
      {re:"intended\\s*-\\s*\\w+|\\w+\\s*-\\s*intended", hint:"Use set difference: intended - actual for missing, actual - intended for rogue."},
      {re:"missing|MISSING", hint:"Name and print the missing set."},
      {re:"rogue|ROGUE", hint:"Name and print the rogue set."},
    ],
    model:`actual = {host for host, cfg in configs.items() if "router ospf" in cfg}

missing = intended - actual      # should run OSPF but don't  -> r2, sw1
rogue   = actual - intended      # run it without approval    -> sw9

for h in sorted(missing):
    print("MISSING", h)
for h in sorted(rogue):
    print("ROGUE", h)`,
  },
  {
    id:"py-threads", t:"Code lab: parallel backup runner",
    brief:"Given devices (a list of Netmiko-style dicts) and a backup(dev) function that returns the hostname on success, use ThreadPoolExecutor with 10 workers to run backup over all devices, printing 'OK <host>' per success and 'FAIL <host>: <error>' per exception, without letting any exception stop the run.",
    starter:"from concurrent.futures import ThreadPoolExecutor, as_completed\n\ndevices = [...]  # assume provided\n\ndef backup(dev):\n    ...  # assume provided; may raise\n\n# your code below\n",
    checks:[
      {re:"ThreadPoolExecutor\\s*\\(\\s*max_workers\\s*=\\s*10", hint:"Create the pool with max_workers=10."},
      {re:"submit\\s*\\(\\s*backup", hint:"pool.submit(backup, dev) for each device."},
      {re:"as_completed", hint:"Iterate as_completed(futures) so results print as they finish."},
      {re:"try[\\s\\S]*\\.result\\(\\)", hint:"Call fut.result() inside try — exceptions re-raise there."},
      {re:"except", hint:"Catch the exception and print FAIL with the host; the loop must continue."},
    ],
    model:`with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(backup, d): d["host"] for d in devices}
    for fut in as_completed(futures):
        host = futures[fut]
        try:
            print("OK", fut.result())
        except Exception as e:
            print(f"FAIL {host}: {e}")`,
  }],
});

})();
