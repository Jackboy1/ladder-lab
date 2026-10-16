// Phase 1 — Linux (Ladder step 2) and Git/GitHub (step 3)
(function(){

LL.tracks.push({
  id:"linux", phase:1, title:"Linux", tag:"Ladder step 3", hours:"10–14h",
  blurb:"Your real gap per the Ladder — it blocks Docker through Kubernetes. Filesystem, permissions, processes, systemd, text tools and bash scripting, with live terminal labs.",
  lessons:[
  {t:"The filesystem and moving around", html:`
<p>Linux has one tree starting at <code>/</code>. No C: drives — disks, USB sticks, even network shares are <i>mounted</i> onto directories in that one tree. Learn the map and half of Linux stops being mysterious:</p>
<div class="tablewrap"><table>
<tr><th>Path</th><th>What lives there</th></tr>
<tr><td>/etc</td><td>System configuration (text files — ssh config in /etc/ssh/, users in /etc/passwd)</td></tr>
<tr><td>/home/ak</td><td>Your files; <code>~</code> is shorthand for your home</td></tr>
<tr><td>/var</td><td>Variable data: <b>/var/log</b> (logs), /var/www (web roots), spools</td></tr>
<tr><td>/bin, /usr/bin</td><td>Programs; /sbin for admin programs</td></tr>
<tr><td>/tmp</td><td>Scratch space, wiped on reboot</td></tr>
<tr><td>/proc, /sys</td><td>Virtual files exposing the kernel: <code>cat /proc/cpuinfo</code></td></tr>
<tr><td>/dev</td><td>Devices as files: /dev/sda is a disk, /dev/null the black hole</td></tr>
</table></div>
<h3>Navigation & inspection</h3>
<pre><code>pwd                 # where am I
ls -lah             # long listing, all files (dotfiles), human sizes
cd /var/log         # absolute path
cd ..               # up one;  cd -  = back to previous;  cd  = home
cat file            # print file        less file   # page through (q quits)
head -20 f ; tail -20 f ; tail -f app.log   # -f follows live — log-watching reflex
file mystery.bin    # what IS this file
find /etc -name "*.conf"        # find by name
find /var/log -mtime -1 -size +10M   # modified <24h AND >10MB
du -sh *            # size of each item here;  df -h  # disk space per mount</code></pre>
<h3>Creating, copying, destroying</h3>
<pre><code>mkdir -p projects/net/configs   # -p makes the whole chain
touch notes.txt                 # empty file / update timestamp
cp -r configs configs.bak       # -r for directories
mv old.txt new.txt              # rename and move are the same command
rm file ; rm -r dir             # no recycle bin. rm -rf / has ended companies.
ln -s /var/log/syslog ~/syslog  # symlink — a shortcut</code></pre>
<h3>Real scenario — disk full at 2am</h3>
<p>A NOC alert says a server's disk is 97% full. The professional sequence:</p>
<pre><code>df -h                          # which mount is full? say /var
du -sh /var/* | sort -h        # which directory inside? → /var/log
du -sh /var/log/* | sort -h    # → one app log is 40GB
tail -100 /var/log/app/err.log # WHY is it huge (a loop spamming errors?)
truncate -s 0 err.log          # safe emptying (deleting a file a process holds open frees nothing!)</code></pre>
<p>That last point is a classic interview trap: if you <code>rm</code> a log a running process still has open, <code>df</code> shows no space freed until the process is restarted — the inode lives until the last handle closes. <code>truncate</code> or <code>&gt; file</code> avoids it.</p>
<div class="callout">Tab-complete everything, and use <code>history</code> + <kbd>Ctrl-R</kbd> (reverse search). Speed in the shell is mostly these two habits. Now do <b>Lab: Linux survival</b>.</div>`},

  {t:"Users, groups and permissions (chmod, chown, sudo)", html:`
<p>Every file has an <b>owner</b>, a <b>group</b>, and three permission sets. <code>ls -l</code> decodes like this:</p>
<pre><code>-rwxr-x--- 1 ak  netops  4096 Oct 11 09:00 deploy.sh
│└┬┘└┬┘└┬┘   owner group
│ │   │  └─ others: --- nothing
│ │   └──── group (netops): r-x read+execute
│ └──────── owner (ak): rwx all
└────────── type: - file, d directory, l symlink</code></pre>
<p><b>r</b>ead=4, <b>w</b>rite=2, e<b>x</b>ecute=1. Add them per set: <code>rwxr-x---</code> = 750. On a <i>directory</i>, x means “may enter/traverse”, r means “may list”, w means “may create/delete inside” — deleting a file is a permission on its directory, not the file.</p>
<pre><code>chmod 640 secrets.txt        # numeric
chmod u+x deploy.sh          # symbolic: owner gets execute
chmod -R g+rw shared/        # recursive
chown ak:netops deploy.sh    # change owner and group
umask                        # default perms mask for new files (022 → files 644, dirs 755)</code></pre>
<h3>Users & groups</h3>
<pre><code>whoami ; id                  # who am I, which groups
sudo useradd -m -s /bin/bash tunde    # -m make home dir
sudo passwd tunde
sudo usermod -aG docker tunde         # -aG APPEND to group (forgetting -a replaces all groups!)
groups tunde</code></pre>
<p><b>sudo</b> runs one command as root and logs it; working as root directly removes both the seatbelt and the audit trail. Group membership applies at next login — “I added him to the docker group but it doesn't work” is usually just “he hasn't re-logged in”.</p>
<h3>Real scenarios</h3>
<ul>
<li><b>“Permission denied” running a script you own</b> → it lacks execute: <code>chmod +x script.sh</code>, or run <code>bash script.sh</code>.</li>
<li><b>Web server can't read uploaded files</b> → files owned by the deploying user, server runs as <code>www-data</code>: <code>chown -R www-data:www-data /var/www/app</code>, dirs 755, files 644.</li>
<li><b>Shared team folder</b> → group-own it, <code>chmod 2775 shared</code>: the leading 2 is <b>setgid</b>, making new files inherit the directory's group so the team keeps access automatically.</li>
<li><b>SSH refuses your key</b> → sshd demands <code>~/.ssh</code> = 700 and <code>authorized_keys</code> = 600; looser and it silently ignores them. Memorise this one — it costs people hours.</li>
</ul>
<div class="callout">Never <code>chmod 777</code> in anger. It “fixes” the symptom by removing all security; interviewers treat it as a red flag. Diagnose owner vs group vs mode instead.</div>`},

  {t:"Processes, services, systemd and logs", html:`
<h3>Seeing what's running</h3>
<pre><code>ps aux                    # every process: USER, PID, %CPU, %MEM, command
ps aux | grep nginx
top        # live view — press M (sort by memory), P (cpu), k (kill), q (quit)
htop       # nicer, if installed</code></pre>
<p>Load average (in <code>top</code>/<code>uptime</code>) is runnable processes averaged over 1/5/15 min — compare it to CPU core count: load 8 on 8 cores is busy-but-fine; on 2 cores it's a queue.</p>
<h3>Signals — asking vs forcing</h3>
<pre><code>kill PID          # SIGTERM (15): please shut down cleanly
kill -9 PID       # SIGKILL: the kernel removes it — no cleanup, last resort
pkill -f myapp    # by name/pattern
command &amp;         # run in background
nohup long_job &amp;  # survive you logging out (or use tmux/screen)
jobs ; fg ; bg    # juggle background jobs</code></pre>
<h3>systemd — how services actually run</h3>
<p>Modern distros boot and babysit services with systemd. These four commands are daily life on any server:</p>
<pre><code>systemctl status nginx     # running? since when? recent log lines + the exact error
sudo systemctl restart nginx
sudo systemctl enable nginx    # start at boot (disable = don't)
systemctl list-units --type=service --state=failed</code></pre>
<p>A unit file (<code>/etc/systemd/system/app.service</code>) describes a service — worth reading once:</p>
<pre><code>[Unit]
Description=Config auditor API
After=network.target
[Service]
User=app
WorkingDirectory=/opt/auditor
ExecStart=/usr/bin/python3 main.py
Restart=on-failure
[Install]
WantedBy=multi-user.target</code></pre>
<p>Edit a unit → <code>sudo systemctl daemon-reload</code> before restarting, or your change silently doesn't apply.</p>
<h3>Logs</h3>
<pre><code>journalctl -u nginx           # a service's whole log
journalctl -u nginx -f        # follow live
journalctl -u nginx --since "1 hour ago" -p err
tail -f /var/log/syslog       # classic text logs still exist too</code></pre>
<h3>Ports — "the service is up but unreachable"</h3>
<pre><code>ss -tlnp        # TCP listeners: which process owns which port
curl -v localhost:8080   # test from the box itself first</code></pre>
<p><b>Real scenario — “the website is down”:</b> <code>systemctl status nginx</code> (dead? why — the log line is right there) → <code>ss -tlnp</code> (is 80/443 actually listening, maybe something else grabbed the port?) → <code>curl localhost</code> (works locally? then it's firewall/network, not the service) → <code>journalctl -u nginx --since "10 min ago"</code>. That funnel — service → port → local → network — is the answer interviewers want to hear, in that order.</p>`},

  {t:"Text power tools: pipes, grep, sed, awk", html:`
<p>Unix philosophy: small tools that each do one thing, chained with <b>pipes</b>. <code>|</code> feeds one command's stdout into the next's stdin. This is where Linux becomes a superpower for a network engineer: configs and logs are text, and you can interrogate text at speed.</p>
<h3>The three streams & redirection</h3>
<pre><code>command &gt; out.txt      # stdout to file (overwrite)   &gt;&gt; append
command 2&gt; err.txt     # stderr separately
command &gt; all.txt 2&gt;&amp;1 # both together
command &lt; input.txt    # stdin from file
cmd1 | tee mid.txt | cmd2   # save a copy mid-pipeline</code></pre>
<p>These are the same stdin/stdout/stderr you met in Python's <code>subprocess</code> — one mental model, two languages.</p>
<h3>grep — find lines</h3>
<pre><code>grep "error" app.log
grep -i "error" app.log        # ignore case
grep -rn "ip helper" configs/  # recursive, with line numbers
grep -v "^#" sshd_config | grep -v "^$"   # strip comments and blanks — read any config cleanly
grep -E "eth[0-9]+" netplan.yaml          # extended regex
grep -c "Failed password" auth.log        # count
grep -A3 -B1 "Traceback" app.log          # context lines after/before</code></pre>
<h3>sort, uniq, wc, cut — the counting kit</h3>
<pre><code># Top talkers: who is hammering SSH?
grep "Failed password" auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head
#   422 203.0.113.50
#    87 198.51.100.9
wc -l file          # line count
cut -d: -f1 /etc/passwd   # field 1, colon-delimited → all usernames</code></pre>
<p>That <code>sort | uniq -c | sort -rn | head</code> pipeline is the single most reused incantation in ops. Own it.</p>
<h3>sed — edit streams</h3>
<pre><code>sed 's/10.0.0.1/10.0.0.254/' r1.cfg          # replace first match per line (print only)
sed -i 's/old-dns/new-dns/g' *.cfg           # -i edits files in place, g = all matches
sed -n '20,40p' big.log                      # print lines 20–40
sed '/^!/d' router.cfg                       # delete comment lines</code></pre>
<h3>awk — columns and logic</h3>
<pre><code>awk '{print $1, $3}' file                    # columns 1 and 3
df -h | awk '$5+0 &gt; 80 {print $6, $5}'       # mounts over 80% full
awk -F: '$3 &gt;= 1000 {print $1}' /etc/passwd  # human users (UID ≥ 1000)
awk '{sum+=$10} END {print sum/NR}' access.log   # average of column 10</code></pre>
<h3>Real scenario — audit 50 router configs in one line</h3>
<pre><code>grep -L "service password-encryption" configs/*.cfg
# -L lists files MISSING the line → instant non-compliance report</code></pre>
<p>That one-liner is the seed of your Ladder Project 3 (the Python config auditor) — same idea, industrial strength.</p>`},

  {t:"Bash scripting: variables, loops, functions, exit codes", html:`
<p>Anything you type twice becomes a script. The Ladder's Project 1 is exactly this: three bash scripts that solve real problems, in a public repo.</p>
<h3>Skeleton every script starts from</h3>
<pre><code>#!/usr/bin/env bash
set -euo pipefail   # die on error, on unset vars, and in failed pipes — professional default

NAME="Akpevwe"                 # no spaces around =
echo "Hello, $NAME"            # use \${NAME} when gluing: \${NAME}_backup
TODAY=$(date +%F)              # command substitution
FILES=$(ls *.cfg 2&gt;/dev/null | wc -l)</code></pre>
<p>Make it runnable: <code>chmod +x script.sh</code> then <code>./script.sh</code>. Arguments arrive as <code>$1 $2…</code>, all of them as <code>"$@"</code>, count as <code>$#</code>. <b>Quote your variables</b> — <code>rm "$f"</code> survives spaces in filenames; <code>rm $f</code> doesn't.</p>
<h3>Conditions & exit codes</h3>
<p>Every command returns an exit code: 0 = success, anything else = failure, readable as <code>$?</code>. <code>if</code> just checks that code:</p>
<pre><code>if ping -c1 -W1 "$host" &amp;&gt;/dev/null; then
  echo "$host reachable"
else
  echo "$host DOWN"
fi

[ -f config.yml ] || { echo "missing config"; exit 1; }
# tests: -f file exists, -d dir, -z string empty, -n non-empty
# numbers: -eq -ne -gt -lt   strings: = !=
cmd1 &amp;&amp; cmd2     # 2 runs only if 1 succeeded
cmd1 || cmd2     # 2 runs only if 1 failed</code></pre>
<h3>Loops</h3>
<pre><code>for host in r1 r2 r3 sw1; do
  ssh "$host" "show version" &gt; "backup_$host.txt"
done

while read -r ip; do
  ping -c1 -W1 "$ip" &amp;&gt;/dev/null &amp;&amp; echo "UP  $ip" || echo "DOWN $ip"
done &lt; hosts.txt</code></pre>
<h3>Functions</h3>
<pre><code>log() { echo "[$(date +%T)] $*"; }
backup() {
  local src=$1 dest=$2        # local = scoped to function
  tar czf "$dest/$(basename "$src")-$(date +%F).tar.gz" "$src"
}
log "starting"; backup /etc/nginx /backups</code></pre>
<h3>The three Project-1 scripts, specified</h3>
<ol>
<li><b>backup.sh</b> — tar a directory to a dated archive, delete archives older than 7 days (<code>find /backups -name "*.tar.gz" -mtime +7 -delete</code>), log what it did.</li>
<li><b>logscan.sh</b> — take a logfile argument, print error count, top 5 error messages, and the time of the last error.</li>
<li><b>reachability.sh</b> — read hosts.txt, ping each, print an UP/DOWN table and exit non-zero if anything is down (so cron/CI can alert on it).</li>
</ol>
<p>Schedule with cron: <code>crontab -e</code> → <code>0 2 * * * /home/ak/backup.sh</code> (min hour day month weekday — “2am daily”). Congratulations: that's unattended automation, the exact thing the admin tier is being replaced by and the architect tier is hired for.</p>
<div class="callout">Finish with the <b>Bash code lab</b> below — you write reachability.sh here and get it checked.</div>`},
  ],
  quiz:[
  {q:"You rm a 30GB log but df -h shows no space freed. Why?", o:["df caches for an hour","A running process still holds the file open","The file was a symlink","ext4 needs a reboot"], a:1, why:"Space frees when the last open handle closes. Truncate instead, or restart the process holding it."},
  {q:"chmod 750 script.sh gives:", o:["owner rwx, group rx, others nothing","owner rw, group r, others nothing","everyone rwx","owner rwx, group rw, others r"], a:0, why:"Each digit is r4+w2+x1 per set: 7=rwx (owner), 5=r-x (group), 0=--- (others) — a team can run it, only you edit it, outsiders see nothing."},
  {q:"To delete a file inside /shared you need write permission on…", o:["The file","The /shared directory","Both","Neither, only ownership"], a:1, why:"Creating/deleting entries is a directory-level write; the file's own perms don't control its deletion."},
  {q:"usermod -G docker tunde (without -a) does what?", o:["Adds docker to his groups","Replaces ALL his supplementary groups with only docker","Creates the docker group","Nothing until reboot"], a:1, why:"-G alone overwrites the group list. Always -aG to append — a classic self-inflicted outage."},
  {q:"SSH ignores your authorized_keys. Most likely:", o:["Key is RSA","~/.ssh is 700 but authorized_keys is 664","sshd not installed","Wrong hostname"], a:1, why:"sshd refuses keys with group/world-writable perms: .ssh must be 700, authorized_keys 600."},
  {q:"kill -9 vs kill:", o:["-9 is politer","Default sends SIGTERM (clean shutdown); -9 SIGKILL removes it with no cleanup","-9 only pauses","No difference"], a:1, why:"SIGTERM lets the app flush/close; SIGKILL can't be caught — use it last."},
  {q:"You edited /etc/systemd/system/app.service and restarted, but behaviour didn't change. You forgot:", o:["chmod +x on the unit","systemctl daemon-reload","journalctl -f","enable"], a:1, why:"systemd caches unit files; daemon-reload re-reads them before the restart applies your edit."},
  {q:"Which pipeline finds the top attacking IPs in auth.log?", o:["grep Failed auth.log | wc -l","grep Failed auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head","cat auth.log | uniq | sort","sed -n '1,10p' auth.log"], a:1, why:"Extract the IP column, group identical lines (sort before uniq!), count, rank, top N."},
  {q:"uniq -c only counts correctly if…", o:["The file is small","Input is sorted first","You use -i","Lines are numeric"], a:1, why:"uniq collapses ADJACENT duplicates — unsorted input gives wrong counts."},
  {q:"set -euo pipefail in a script means:", o:["Verbose output","Exit on errors/unset vars and fail broken pipes","Run as root","Parallel execution"], a:1, why:"-e stop on error, -u error on unset variables, pipefail: a pipeline fails if any stage fails."},
  {q:"An if statement in bash actually tests…", o:["A boolean keyword","The command's exit code (0 = true)","String 'true'","The $STATUS variable"], a:1, why:"Everything is exit codes: 0 success/true, non-zero failure/false. [ ] is itself a command."},
  {q:"Cron entry 0 2 * * 1 runs…", o:["Every hour","2:00 AM every Monday","Every 2 minutes","1st of the month at 2am"], a:1, why:"min=0 hour=2 anyday anymonth weekday=1(Mon)."},
  ],
  cards:[
  {f:"/etc /var/log /proc", b:"/etc config · /var/log logs · /proc live kernel/process info as files."},
  {f:"Deleted log, space not freed", b:"Open file handle keeps the inode. truncate -s 0 or restart the process."},
  {f:"Permission digits", b:"r4 w2 x1 → 755 = rwxr-xr-x, 644 = rw-r--r--, 600 owner-only."},
  {f:"Directory x and w", b:"x = enter/traverse, r = list, w = create/delete entries inside."},
  {f:"SSH key perms", b:"~/.ssh 700, authorized_keys 600 — looser is silently ignored."},
  {f:"setgid dir (2775)", b:"New files inherit the directory's group — the shared-folder pattern."},
  {f:"Service triage funnel", b:"systemctl status → ss -tlnp (port listening?) → curl localhost → journalctl --since."},
  {f:"journalctl essentials", b:"-u unit, -f follow, --since '1 hour ago', -p err."},
  {f:"Top-talkers pipeline", b:"awk '{print $N}' | sort | uniq -c | sort -rn | head"},
  {f:"sed in-place replace", b:"sed -i 's/old/new/g' file"},
  {f:"awk over threshold", b:"df -h | awk '$5+0 > 80 {print $6,$5}' — mounts above 80%."},
  {f:"Exit codes", b:"0 success; $? reads last code; && on success, || on failure; if tests the code."},
  {f:"Quote variables", b:'"$f" survives spaces; bare $f word-splits — bugs and deleted wrong files.'},
  {f:"Cron fields", b:"min hour day-of-month month day-of-week → '0 2 * * *' = 2am daily."},
  ],
  labs:["lx-nav","lx-perms","lx-logs"],
  codelabs:[{
    id:"bash-reach", t:"Code lab: reachability.sh",
    brief:"Write the Ladder Project-1 script: read hosts from hosts.txt, ping each once with a 1-second timeout, print 'UP <host>' or 'DOWN <host>', and exit 1 if any host was down (so automation can alert). Use a while-read loop and proper quoting.",
    starter:"#!/usr/bin/env bash\nset -euo pipefail\n\n# your script here\n",
    checks:[
      {re:"while\\s+read", hint:"Use a while read -r loop over hosts.txt (for-over-cat breaks on spaces)."},
      {re:"ping\\s+-c\\s*1", hint:"Ping exactly once: ping -c1 (add -W1 for a 1s timeout)."},
      {re:"<\\s*hosts\\.txt", hint:"Feed the loop from the file: done < hosts.txt"},
      {re:"DOWN", hint:"Print DOWN for unreachable hosts."},
      {re:"exit\\s+[\\$1]", hint:"Exit non-zero when something was down (exit 1, or exit $fail) — that's what makes it automation-friendly."},
    ],
    model:`#!/usr/bin/env bash
set -uo pipefail   # not -e: a failed ping must not kill the loop

fail=0
while read -r host; do
  [ -z "$host" ] && continue
  if ping -c1 -W1 "$host" &>/dev/null; then
    echo "UP   $host"
  else
    echo "DOWN $host"
    fail=1
  fi
done < hosts.txt

exit $fail`,
  }],
});

LL.tracks.push({
  id:"git", phase:1, title:"Git & GitHub", tag:"Ladder step 2", hours:"3–4h",
  blurb:"How Git actually thinks, branching without fear, resolving conflicts, and the GitHub flow that makes your public repo your CV.",
  lessons:[
  {t:"How Git thinks: snapshots and the three areas", html:`
<p>Git is not “Dropbox for code”. It is a database of <b>snapshots</b> (commits), each pointing at its parent, each identified by a hash. Understand the <b>three areas</b> and every command makes sense:</p>
<pre><code>Working directory  --git add-->  Staging area  --git commit-->  Repository (.git)
(your real files)                (what the NEXT                 (permanent history)
                                  commit will contain)</code></pre>
<pre><code>git init                      # new repo (creates .git/)
git clone URL                 # copy an existing one
git status                    # the command you run constantly
git add auditor.py            # stage one file;  git add .  stages everything
git commit -m "Add OSPF check to auditor"
git log --oneline --graph     # history
git diff                      # unstaged changes;  git diff --staged  what's about to commit</code></pre>
<p>Why staging exists: you fixed a bug AND reformatted a file. Stage and commit the bug fix alone, then the formatting — two clean commits a reviewer can read, instead of one mudball.</p>
<h3>Commit messages that get you hired</h3>
<p>Your public GitHub <i>is</i> the interview pre-read. Messages like <code>update</code>, <code>fix</code>, <code>asdf</code> read as carelessness. The convention: imperative mood, ~50-char summary, body explains <i>why</i>:</p>
<pre><code>Add retry with backoff to device connections

Netmiko timeouts on slow WAN links were killing whole runs.
Three attempts with exponential backoff; failures are now
collected and reported at the end instead of raising.</code></pre>
<h3>Undo, safely</h3>
<pre><code>git restore file.py            # discard unstaged changes to a file
git restore --staged file.py   # unstage (keep the edits)
git commit --amend             # fix the last commit/message (before pushing!)
git revert abc123              # NEW commit that undoes abc123 — safe on shared branches
git reset --hard abc123        # move branch back, DESTROYING later work — local only, be sure</code></pre>
<p><code>.gitignore</code> keeps junk and secrets out: <code>venv/</code>, <code>__pycache__/</code>, <code>.env</code>, <code>*.log</code>. A pushed secret is compromised forever (history remembers) — rotate the credential, don't just delete the line.</p>`},
  {t:"Branching, merging and conflicts", html:`
<p>A branch is just a movable pointer to a commit — creating one costs nothing, which is why pros branch for everything. <code>main</code> stays always-working; experiments happen on branches.</p>
<pre><code>git switch -c feature/ospf-check   # create + move (older form: git checkout -b)
git branch                         # list;  current marked *
# work, add, commit...
git switch main
git merge feature/ospf-check
git branch -d feature/ospf-check   # tidy up after merge</code></pre>
<h3>The two merge shapes</h3>
<ul>
<li><b>Fast-forward</b>: main hasn't moved since you branched → the pointer just slides forward. No new commit.</li>
<li><b>Three-way merge</b>: both moved → Git creates a <b>merge commit</b> with two parents, combining both.</li>
</ul>
<h3>Conflicts — a conversation, not a disaster</h3>
<p>Both branches edited the same lines → Git stops and asks you:</p>
<pre><code>timeout = 10
&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
retries = 3
=======
retries = 5
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/tuning</code></pre>
<p>Open the file, decide the truth (keep one, the other, or write a third thing), <b>delete all the marker lines</b>, then:</p>
<pre><code>git add config.py
git commit            # completes the merge
# panic button: git merge --abort returns to pre-merge state</code></pre>
<p>Conflicts shrink when branches live short lives and teams pull often. <code>git stash</code> shelves uncommitted work when you must switch tasks mid-edit (<code>git stash pop</code> brings it back).</p>
<h3>Rebase in one honest paragraph</h3>
<p><code>git rebase main</code> replays your branch's commits on top of current main — straight-line history, no merge commit. The rule that keeps you safe: <b>never rebase commits you've already pushed and others may have pulled</b>, because rebase rewrites them into new commits. On your solo repos, rebase freely; on shared branches, merge.</p>`},
  {t:"GitHub flow: remotes, push/pull, pull requests", html:`
<p>GitHub hosts your repo and adds the collaboration layer. The Ladder says it plainly: keep the GitHub public and active the whole way through — six months empty then suddenly full looks like what it is.</p>
<pre><code>git remote add origin git@github.com:akpevwe/net-auditor.git
git push -u origin main        # -u links the branches; afterwards plain git push
git pull                       # fetch + merge remote changes
git fetch                      # download without merging (look before leaping)</code></pre>
<h3>The flow used by actual teams (GitHub flow)</h3>
<ol>
<li>Branch from main: <code>feature/add-vlan-audit</code></li>
<li>Commit small, push the branch</li>
<li>Open a <b>Pull Request</b> — the unit of review: describes what/why, shows the diff, runs CI</li>
<li>Review comments → push fixes (the PR updates itself)</li>
<li>Merge; delete the branch. main stays deployable at all times.</li>
</ol>
<p>Even solo, open PRs to yourself: you get the habit, and your repo history reads like a team's — reviewers notice. Each Ladder project README should state: problem, design, the trade-off you chose, what you'd do differently. The write-up is half the value and almost nobody does it.</p>
<h3>Clone vs fork, and contributing to open source</h3>
<p><b>Clone</b> copies a repo you can push to. <b>Fork</b> copies someone else's repo into your account; you push to your fork and PR back to theirs — the open-source contribution loop the Ladder recommends (even a docs fix counts: public proof you can work to someone else's standard).</p>
<h3>SSH keys, once</h3>
<pre><code>ssh-keygen -t ed25519 -C "akpevwedeboss101@gmail.com"
cat ~/.ssh/id_ed25519.pub   # paste into GitHub → Settings → SSH keys
ssh -T git@github.com       # test</code></pre>
<div class="callout">Finish with the <b>Git terminal lab</b> — init → stage → commit → branch → merge, in the simulator.</div>`},
  ],
  quiz:[
  {q:"git add does what?", o:["Saves to history","Moves changes into the staging area for the next commit","Pushes to GitHub","Creates a branch"], a:1, why:"Staging chooses the snapshot's contents; commit then writes it to history."},
  {q:"Safely undo a commit that's already pushed and shared:", o:["git reset --hard","git revert <hash>","Delete .git","git commit --amend"], a:1, why:"revert adds a new inverse commit — history stays intact for everyone. reset/amend rewrite history."},
  {q:"A fast-forward merge happens when…", o:["There are conflicts","main gained no commits since you branched","You use --ff-never","Rebasing"], a:1, why:"Nothing diverged, so the main pointer just slides forward to your branch tip."},
  {q:"Inside conflict markers, <<<<<<< HEAD marks…", o:["The incoming branch's version","Your current branch's version","The common ancestor","Deleted lines"], a:1, why:"HEAD = where you are; after ======= is the branch being merged in."},
  {q:"The golden rule of rebase:", o:["Always rebase instead of merge","Never rebase commits others may have already pulled","Rebase only on Fridays","Rebase deletes branches"], a:1, why:"Rebase rewrites commits into new hashes — fine privately, chaos on shared history."},
  {q:"You committed a .env with an API key and pushed. Correct response:", o:["Delete the file and push again","Rotate/revoke the credential, then clean history","Make the repo private","Nothing, GitHub hides .env"], a:1, why:"History preserves the secret; deleting the file doesn't. The key is burned — rotate it."},
  {q:"git fetch vs git pull:", o:["Identical","fetch downloads refs without merging; pull = fetch + merge","pull is read-only","fetch pushes"], a:1, why:"fetch lets you inspect incoming changes before integrating."},
  {q:"A Pull Request is best described as…", o:["A download request","A reviewed, discussable proposal to merge a branch","A backup","A fork"], a:1, why:"The PR packages diff + description + CI + review before anything touches main."},
  ],
  cards:[
  {f:"Three areas", b:"Working dir → (add) staging → (commit) repository."},
  {f:"revert vs reset", b:"revert: new undo commit, safe when pushed. reset --hard: rewrites/destroys — local only."},
  {f:"Conflict markers", b:"<<<<<<< yours ======= theirs >>>>>>> — pick truth, delete markers, add, commit."},
  {f:"Branch cheap because…", b:"A branch is just a pointer to a commit."},
  {f:"git stash", b:"Shelve uncommitted work; pop to restore. For mid-task context switches."},
  {f:"GitHub flow", b:"Branch → commits → push → PR (review+CI) → merge → delete branch. main always deployable."},
  {f:"Fork vs clone", b:"Clone: copy you can push to. Fork: your copy of someone else's repo; PR back upstream."},
  {f:"Good commit message", b:"Imperative ~50-char subject; body says WHY. Your repo is your CV."},
  ],
  labs:["git-basics"], codelabs:[],
});

})();
