// Linux expansion pack — 4 more lessons, extra quiz/cards, 2 new terminal labs (service triage + log pipeline)
(function(){
const T = LL.tracks.find(t=>t.id==="linux"); if(!T) return;

T.lessons.push(
{t:"Linux networking toolkit: ip, ss, dig, curl, traceroute", html:`
<p>Your CCNA brain, pointed at a server. These are the commands a cloud/network engineer runs on a Linux box every day — <code>ifconfig</code> is legacy; the modern suite is <code>ip</code> and <code>ss</code>.</p>
<h3>Addresses and routes</h3>
<pre><code>ip a                      # addresses on every interface (link state too)
ip -br a                  # brief — the 'show ip int brief' of Linux
ip route                  # routing table; 'default via 10.0.0.1 dev eth0' = the gateway
ip route get 8.8.8.8      # which route/interface WOULD this destination use
ip neigh                  # ARP table (REACHABLE / STALE / FAILED)</code></pre>
<p>Reading <code>ip route</code> is longest-prefix-match, same as a router — a /32 host route beats the default. "No route to host" vs "connection refused" is a diagnosis in itself: no route = L3 path problem; refused = packet arrived, nothing listening (or firewall reset).</p>
<h3>Who is listening — ss</h3>
<pre><code>ss -tlnp     # TCP listeners, numeric ports, owning process
ss -tn       # current TCP connections
# -t tcp  -u udp  -l listening  -n numeric  -p process</code></pre>
<p><code>ss -tlnp</code> is the first question of every "service unreachable" ticket: is anything on that port at all, and is it bound to 0.0.0.0 or only 127.0.0.1 (localhost-only binding is the classic "works on the box, dead from outside")?</p>
<h3>Path and name testing</h3>
<pre><code>ping -c3 10.0.0.1          # reachability + loss + latency
traceroute 8.8.8.8         # where the path dies (mtr = live version)
dig google.com             # full DNS answer; dig +short for just the IP
dig @8.8.8.8 google.com    # ask a SPECIFIC server — isolates "my resolver" vs "DNS itself"
dig -x 41.58.10.5          # reverse lookup
resolvectl status          # what resolver the box actually uses (systemd-resolved)
cat /etc/hosts             # static overrides — checked BEFORE DNS, and a classic gotcha</code></pre>
<h3>Application-layer truth — curl</h3>
<pre><code>curl -v https://api.example.com/health    # -v shows DNS, TCP, TLS, headers — the whole story
curl -I https://site.com                  # headers only (status code, redirects)
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://site.com   # code + timing
nc -zv 10.0.0.5 443                       # raw TCP port test, no HTTP needed</code></pre>
<h3>The funnel, end to end (interview answer)</h3>
<pre><code>"Server unreachable" from the Linux side:
ip -br a        → do I have an address and is the link up?
ip route        → is there a route / correct gateway?
ping gateway    → L2/L3 local health
dig name        → does the name resolve (and to what I expect)?
nc -zv ip port  → does the port answer?
curl -v         → what does the application say?
Each step splits the world in half — say it in this order and you sound like ops.</code></pre>
<div class="callout">Now run <b>Lab: Service down — find the blocker</b>: a web service that won't start, and the evidence trail (status → journal → ss → kill → restart) is exactly this lesson.</div>`},

{t:"SSH mastery: keys, config, scp/rsync, tunnels", html:`
<p>SSH is your transport for everything — admin, git, Ansible, Netmiko. Mastering it is mastering remote work.</p>
<h3>Keys, properly</h3>
<pre><code>ssh-keygen -t ed25519 -C "akpevwedeboss101@gmail.com"   # modern key type
ssh-copy-id ak@server1        # installs your public key in the server's authorized_keys
ssh ak@server1                # now passwordless (key + agent)</code></pre>
<p>Private key never leaves your machine; the <i>public</i> key travels. Permissions law (from the earlier lesson): <code>~/.ssh</code> 700, keys 600 — or sshd silently ignores them. <code>ssh-agent</code> holds decrypted keys per session so a passphrase-protected key doesn't nag you per command; <code>ssh -A</code> forwards the agent (use sparingly — the far host can use your identity while connected).</p>
<h3>~/.ssh/config — stop typing</h3>
<pre><code>Host r1
    HostName 10.0.0.1
    User admin
Host bastion
    HostName 41.58.20.7
    User ak
Host prod-*
    ProxyJump bastion          # hop through the bastion automatically
    IdentityFile ~/.ssh/id_ed25519</code></pre>
<p>Now <code>ssh r1</code> and <code>ssh prod-db1</code> just work — and so do scp, rsync, git and Netmiko-style tools that respect the config. <code>ProxyJump</code> (-J on the CLI) is how real estates are reached: nothing in the private subnet is exposed; everything hops via one hardened bastion. Recognise the AWS version: private EC2 behind a bastion, or better, SSM Session Manager with no open port 22 at all.</p>
<h3>Moving files: scp vs rsync</h3>
<pre><code>scp backup.tar.gz ak@server1:/backups/        # simple one-shot copy
scp -r configs/ ak@server1:/opt/configs/
rsync -avz --progress configs/ ak@server1:/opt/configs/
rsync -avz --delete site/ web1:/var/www/site/ # mirror (deletes extras — like robocopy /MIR)</code></pre>
<p>rsync only transfers the <i>differences</i>, resumes, and preserves permissions (-a). Rule: scp for a file, rsync for a directory or anything repeated. Trailing slash matters: <code>dir/</code> = contents, <code>dir</code> = the directory itself.</p>
<h3>Tunnels — the party trick that's actually daily work</h3>
<pre><code>ssh -L 8080:localhost:80 ak@web1
# local forward: browse http://localhost:8080 → arrives at web1's port 80
ssh -L 5432:db1.internal:5432 ak@bastion
# reach a PRIVATE database through the bastion from your laptop's localhost:5432
ssh -R 9000:localhost:3000 ak@public-box     # remote forward: expose your local dev outward
ssh -D 1080 ak@bastion                       # SOCKS proxy — route a browser through it</code></pre>
<p>Pattern to memorise: <code>-L local_port:target_host:target_port via_host</code> — "open a door on my machine that comes out over there."</p>
<h3>Hardening sshd (what auditors check)</h3>
<pre><code>/etc/ssh/sshd_config:
  PermitRootLogin no
  PasswordAuthentication no      # keys only — ends the brute-force noise in auth.log
  AllowUsers ak deploy
then: sudo systemctl restart sshd   (test a NEW session before closing the old one!)</code></pre>
<p>Pair with fail2ban (auto-bans brute-forcing IPs from the very auth.log you'll mine in the pipeline lab). And the golden rule: never restart sshd and close your only session before confirming a fresh login works.</p>`},

{t:"Packages, PATH, and scheduled jobs (apt, cron, systemd timers)", html:`
<h3>Where software comes from</h3>
<p>Distros ship software as signed packages from repositories. Debian/Ubuntu family uses <b>apt</b>; RHEL/Fedora uses <b>dnf</b> — same ideas, different spelling.</p>
<pre><code>sudo apt update            # refresh the package INDEX (changes nothing installed)
sudo apt upgrade           # apply available upgrades
sudo apt install nmap tree # install
apt search netcat ; apt show nmap
dpkg -l | grep ssh         # what's installed
sudo apt remove pkg ; sudo apt autoremove</code></pre>
<p><b>update vs upgrade</b> is a beloved interview trap: update refreshes the catalogue, upgrade installs from it. Security practice: unattended-upgrades for security patches on servers, with reboots scheduled, not hoped for.</p>
<h3>PATH, which, and your shell environment</h3>
<pre><code>echo $PATH                 # where the shell looks for commands, in order
which python3              # which file actually runs
type ll                    # is it an alias/function/binary?
export API_URL="https://..."      # env var for this session
alias gs="git status"             # shortcut for this session
# make either permanent: append to ~/.bashrc, then: source ~/.bashrc</code></pre>
<p>"Command not found" after installing something usually means its directory isn't on PATH, or you need a new shell. <code>./script.sh</code> needs the <code>./</code> because the current directory is (deliberately) not on PATH.</p>
<h3>Cron — the classic scheduler</h3>
<pre><code>crontab -e                 # edit your schedule        crontab -l  # list
# m  h  dom mon dow   command
  0  2   *   *   *    /home/ak/backup.sh >> /home/ak/backup.log 2>&1
 */5 *   *   *   *    /home/ak/reachability.sh
  0  8   *   *   1-5  /home/ak/report.sh</code></pre>
<p>Cron gotchas that bite everyone once: cron's environment is minimal (PATH is short — use absolute paths in scripts), no terminal, and output is mailed/dropped unless you redirect it. Always redirect to a log as above; "the cron job didn't run" is usually "it ran and died silently".</p>
<h3>systemd timers — cron's successor</h3>
<pre><code># /etc/systemd/system/backup.timer
[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true            # missed while powered off? run on next boot
[Install]
WantedBy=timers.target
# pairs with backup.service (the ExecStart you saw in the systemd lesson)
sudo systemctl enable --now backup.timer
systemctl list-timers      # next-run times, last-run times — visibility cron never had
journalctl -u backup.service    # logs captured automatically</code></pre>
<p>Why teams migrate: timers log into journald, show next/last run, can depend on other units, and <code>Persistent=true</code> handles downtime. For interviews: "cron for quick personal jobs, systemd timers for production services" is a tidy answer.</p>`},

{t:"Disks and filesystems: df, du, mounts, fstab, LVM", html:`
<h3>The block device chain</h3>
<pre><code>disk (/dev/sda, /dev/nvme0n1) → partition (sda1) → filesystem (ext4/xfs) → mounted at a directory
lsblk        # the tree: disks, partitions, mountpoints — start every disk task here
blkid        # UUIDs and fs types
df -h        # space per MOUNTED filesystem        df -i   # inode usage (see below!)
du -sh /var/* | sort -h    # who's eating a filesystem</code></pre>
<h3>Mounting</h3>
<pre><code>sudo mkfs.ext4 /dev/sdb1          # format (destroys!) a new partition
sudo mount /dev/sdb1 /data        # attach it at a directory
umount /data                      # detach ('target is busy' = something has files open there; lsof /data)</code></pre>
<p>Manual mounts vanish at reboot; <b>/etc/fstab</b> makes them permanent — five fields worth knowing cold:</p>
<pre><code>UUID=3f1a-...   /data   ext4   defaults,noatime   0 2
# device(by UUID!)  mountpoint  fstype  options  dump  fsck-order</code></pre>
<p>Mount by UUID, never by /dev/sdb — device letters can shuffle between boots, and a wrong fstab line can drop a server to emergency mode. Test with <code>sudo mount -a</code> (applies fstab now) <i>before</i> rebooting.</p>
<h3>The inode trap (senior-signal knowledge)</h3>
<p>"No space left on device" while <code>df -h</code> shows 40% free? Check <code>df -i</code>: the filesystem ran out of <b>inodes</b> — millions of tiny files (mail queues, session files, cache spam) exhausted the entry table while bytes remained. Fix the file-spam source; you can't add inodes to ext4 after creation. Pairs with the other classic from lesson 1: deleted-but-open files holding space.</p>
<h3>LVM — resize without tears</h3>
<p>LVM inserts a flexible layer between partitions and filesystems, and it's on every enterprise VM for one reason: growing storage online.</p>
<pre><code>Physical Volume (PV)  →  Volume Group (VG)  →  Logical Volume (LV)  →  filesystem
   /dev/sdb               vg_data                lv_var                 ext4 on /var

# "/var is 95% full" — the online fix after attaching a new disk:
sudo pvcreate /dev/sdc
sudo vgextend vg_data /dev/sdc
sudo lvextend -L +20G /dev/vg_data/lv_var
sudo resize2fs /dev/vg_data/lv_var        # ext4 grows LIVE (xfs: xfs_growfs)
df -h /var                                 # bigger, zero downtime</code></pre>
<p>Order matters and interviewers probe it: PV → VG → LV → filesystem; grow outer-to-inner. On AWS, the same move is: grow the EBS volume in the console/API, then <code>growpart</code> + <code>resize2fs</code> inside the instance — your cloud and Linux tracks meeting again.</p>
<h3>Swap in one paragraph</h3>
<p>Swap is disk pretending to be RAM: it prevents OOM kills at the price of speed. A little swap is a safety net; heavy, sustained swapping (watch <code>free -h</code> and si/so in vmstat) means buy RAM or fix the leak — that's the "server slow" ticket mechanism from lesson 3.</p>`}
);

T.quiz.push(
{q:"The modern replacements for ifconfig and netstat are:", o:["ipconfig and ports","ip and ss","net and sock","ifctl and lsnet"], a:1, why:"iproute2 suite: ip a / ip route for addressing-routing, ss for sockets."},
{q:"'Connection refused' (vs timeout) usually means…", o:["No route to the host","Packet arrived but nothing is listening on that port (or it actively rejected)","DNS failed","MTU too small"], a:1, why:"Refusal is an answer — the host is reachable; the service/port isn't there. Timeouts suggest path/firewall-drop problems."},
{q:"A service works via curl on the box but not from other machines. ss -tlnp shows 127.0.0.1:8080. Diagnosis:", o:["Firewall","It's bound to localhost only — rebind to 0.0.0.0 (or the LAN IP)","DNS","Wrong gateway"], a:1, why:"Loopback binding serves only the box itself — the classic works-locally-dead-remotely cause."},
{q:"dig @8.8.8.8 example.com answers correctly but plain dig fails. The problem is…", o:["example.com is down","Your configured resolver, not DNS itself","The route to 8.8.8.8","IPv6"], a:1, why:"Querying a specific server isolates the layer: records are fine; the box's resolver settings aren't."},
{q:"ssh -L 5432:db1.internal:5432 ak@bastion lets you…", o:["Expose your laptop to the internet","Reach the private db1:5432 via your own localhost:5432, tunnelled through the bastion","Copy files to db1","Proxy the bastion's browser"], a:1, why:"Local forward: a door on your machine that comes out at target_host:target_port from the jump host."},
{q:"For repeatedly syncing a directory to a server, prefer…", o:["scp -r every time","rsync -avz (delta transfer, resumable, preserves perms)","cat over ssh","ftp"], a:1, why:"rsync moves only differences and survives interruptions; scp recopies everything."},
{q:"apt update vs apt upgrade:", o:["Same thing","update refreshes the package index; upgrade installs the newer versions","update installs; upgrade refreshes","Both reboot"], a:1, why:"Catalogue first, then apply — the pair interviewers love to ask."},
{q:"A cron job 'never runs' but runs fine by hand. Most common causes:", o:["Cron is deprecated","Minimal cron PATH/env + unredirected output hiding the failure","Wrong timezone only","Scripts can't run at night"], a:1, why:"Use absolute paths and redirect output to a log; cron's environment is tiny and silent."},
{q:"systemd timers beat cron for production because…", o:["They're faster","Logged in journald, list-timers shows next/last runs, Persistent catches missed runs, unit dependencies","They need no root","They email you"], a:1, why:"Observability + missed-run handling + integration with services."},
{q:"df -h shows 40% free but writes fail with 'No space left'. Check…", o:["RAM","df -i — inode exhaustion from millions of tiny files","Swap","The GPU"], a:1, why:"Out of inodes = out of file slots regardless of free bytes. Find and fix the tiny-file spam."},
{q:"fstab should reference devices by…", o:["/dev/sdb1 always","UUID (blkid) — device letters can reorder across boots","Label never","IP address"], a:1, why:"UUIDs are stable; letters aren't. A wrong fstab can drop boot to emergency mode — test with mount -a."},
{q:"Correct order to grow /var on LVM after adding a disk:", o:["resize2fs → lvextend → vgextend","pvcreate → vgextend → lvextend → resize2fs","mkfs → mount → pvcreate","fstab edit only"], a:1, why:"Outer to inner: PV joins VG, LV grows, then the filesystem grows into it — all online."}
);

T.cards.push(
{f:"ip -br a / ip route", b:"Linux's 'show ip int brief' + routing table (longest prefix match; 'default via' = gateway)."},
{f:"ss -tlnp", b:"TCP listeners, numeric, with owning process. First check for 'unreachable service'. 127.0.0.1-bound = local-only."},
{f:"refused vs timeout", b:"Refused: host reached, nothing listening. Timeout: path/firewall-drop territory."},
{f:"dig isolation trick", b:"dig @8.8.8.8 name — works there but not plainly? Your resolver is the problem, not DNS."},
{f:"curl -v", b:"Shows DNS→TCP→TLS→headers in one run; -I headers only; -w '%{http_code}' for scripts."},
{f:"ssh -L", b:"-L local:target_host:target_port via_host — local door to a remote/private service."},
{f:"ProxyJump", b:"ssh -J bastion target (or Host block) — reach private estates via one hardened hop."},
{f:"scp vs rsync", b:"One-shot file vs delta-sync directories (-avz, --delete mirrors; trailing slash = contents)."},
{f:"sshd hardening trio", b:"PermitRootLogin no · PasswordAuthentication no · AllowUsers — then test a NEW session before closing yours."},
{f:"apt update vs upgrade", b:"Refresh index vs install newer versions. dnf = RHEL-family equivalent."},
{f:"Cron env gotchas", b:"Tiny PATH, no TTY, silent output — absolute paths + '>> log 2>&1' always."},
{f:"systemd timer wins", b:"journald logs, list-timers, Persistent=true for missed runs, unit dependencies."},
{f:"df -i", b:"Inode exhaustion: 'no space' with free bytes — millions of tiny files."},
{f:"LVM grow order", b:"pvcreate → vgextend → lvextend -L +XG → resize2fs (online). AWS twin: grow EBS → growpart → resize2fs."}
);

/* ---- new labs ---- */
LL.labs["lx-service"] = {
  env:"linux", title:"Service down: find the port thief", points:60,
  scenario:"Monitoring says the web service (nginx) is DOWN on this box and won't start. Someone left an old test process running. Diagnose with real evidence — status, journal, sockets — fix the cause, bring the service back, and make it survive reboots.",
  setup(st){
    st.services.nginx = { desc:"A high performance web server", active:false, enabled:false, port:80, pid:1490,
      journal:[ "systemd[1]: Starting A high performance web server...",
                "nginx[1488]: bind() to 0.0.0.0:80 failed (98: Address already in use)",
                "systemd[1]: nginx.service: Failed with result 'exit-code'." ] };
    st.procs.push({pid:1337, user:"ak", cpu:0.2, mem:1.1, cmd:"python3 old_test_server.py", port:80});
  },
  objectives:[
    { text:"Check the service: systemctl status nginx (read the Active line)", done:st=>st.history.some(h=>/systemctl\s+status\s+nginx/.test(h)) },
    { text:"Read its log: journalctl -u nginx — note the bind() error", done:st=>st.history.some(h=>/journalctl\s+-u\s+nginx/.test(h)) },
    { text:"Find what's squatting on port 80: ss -tlnp", done:st=>st.history.some(h=>/\bss\b.*-\w*l/.test(h)) },
    { text:"Kill the offending process by its PID (kill 1337)", done:st=>st.killed.includes(1337) },
    { text:"Start nginx successfully (systemctl restart nginx, then status shows active)", done:st=>st.services.nginx && st.services.nginx.active },
    { text:"Make it start at boot: systemctl enable nginx", done:st=>st.services.nginx && st.services.nginx.enabled },
    { text:"Verify the right listener now owns :80 (ss -tlnp again)", done:st=>st.services.nginx && st.services.nginx.active && (st.ranSS||0)>=2 },
  ],
};

LL.labs["lx-pipes"] = {
  env:"linux", title:"Pipeline forensics: who's attacking SSH?", points:60,
  scenario:"The box's /var/log/auth.log is full of failed SSH logins. Use the counting pipeline — the most reused one-liner in operations — to measure the attack and name the top offender, then file a report.",
  objectives:[
    { text:"Count the failed attempts: grep Failed /var/log/auth.log | wc -l", done:st=>st.history.some(h=>/grep\s+.*Failed.*auth\.log.*\|\s*wc\s+-l/.test(h)) },
    { text:"Extract just the attacking IPs (field 11): grep Failed /var/log/auth.log | awk '{print $11}'", done:st=>st.history.some(h=>/awk\s+'?\{\s*print\s+\$11\s*\}'?/.test(h)) },
    { text:"Rank them: ... | sort | uniq -c | sort -rn", done:st=>st.history.some(h=>/sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-rn/.test(h)) },
    { text:"Identify the top attacker (hint: it's 203.0.113.50 — your pipeline should show it first)", done:st=>st.history.some(h=>/sort\s+-rn/.test(h)) },
    { text:"Save the ranking to ~/attackers.txt with > redirection", done:st=>{try{const f=st.fs.home.ak["attackers.txt"]; return typeof f==="string" && /203\.0\.113\.50/.test(f);}catch(e){return false;}} },
    { text:"Read the report back (cat ~/attackers.txt)", done:st=>st.history.some(h=>/cat\s+(~\/)?attackers\.txt/.test(h)) },
  ],
};

T.labs.push("lx-service","lx-pipes");
})();
