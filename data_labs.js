// Guided hands-on labs for the terminal simulators
(function(){
const L = LL.labs;

/* ---- Linux ---- */
L["lx-nav"] = {
  env:"linux", title:"Linux survival: navigate, create, read", points:50,
  scenario:"You've just been handed a shell on a training VM. Prove you can move around, build a workspace and read files without a GUI.",
  objectives:[
    { text:"Print your current directory with pwd", done:st=>st.history.some(h=>/^\s*pwd\b/.test(h)) },
    { text:"List /var/log (e.g. ls /var/log)", done:st=>st.history.some(h=>/^\s*ls\b.*\/var\/log/.test(h)) },
    { text:"Create the nested folder projects/net/configs in one command (mkdir -p)", done:st=>st.madeDirs.some(d=>d.endsWith("projects/net/configs")) },
    { text:"Create an empty file named r1.cfg inside that configs folder (touch)", done:st=>{ try{ return typeof st.fs.home.ak.projects.net.configs["r1.cfg"]==="string"; }catch(e){ return false; } } },
    { text:"Read the last lines of /var/log/app.log (tail /var/log/app.log)", done:st=>st.history.some(h=>/tail\b.*app\.log/.test(h)) },
  ],
};
L["lx-perms"] = {
  env:"linux", title:"Permissions: make a script runnable, lock a secret", points:50,
  scenario:"Two classic tickets in one: a script that won't run, and a credentials file everyone can read.",
  objectives:[
    { text:"Create deploy.sh in your home with some content (echo \"echo hi\" > deploy.sh)", done:st=>typeof st.fs.home.ak["deploy.sh"]==="string" },
    { text:"Make it executable (chmod +x deploy.sh or chmod 755 deploy.sh)", done:st=>{ const m=st.modes["/home/ak/deploy.sh"]; return m && m.includes("x"); } },
    { text:"Create secrets.txt (touch or echo)", done:st=>typeof st.fs.home.ak["secrets.txt"]==="string" },
    { text:"Restrict secrets.txt to owner-only read/write: chmod 600 secrets.txt", done:st=>st.modes["/home/ak/secrets.txt"]==="-rw-------" },
    { text:"Verify with a long listing (ls -l)", done:st=>st.history.some(h=>/ls\s+-l/.test(h)) },
  ],
};
L["lx-logs"] = {
  env:"linux", title:"Log triage with grep", points:50,
  scenario:"An app is misbehaving. Its log is /var/log/app.log. Find out how bad it is — the way you would on a real server.",
  objectives:[
    { text:"Show only the ERROR lines (grep ERROR /var/log/app.log)", done:st=>st.greps.some(g=>/error/i.test(g.pat)&&/app\.log/.test(g.file)) },
    { text:"Count them with grep -c", done:st=>st.history.some(h=>/grep\s+-c\s+.*app\.log/.test(h)) },
    { text:"Check the most recent entries (tail /var/log/app.log)", done:st=>st.history.some(h=>/tail\b.*app\.log/.test(h)) },
    { text:"Save the errors to a report: grep ERROR /var/log/app.log > ~/errors.txt (then cat it)", done:st=>typeof st.fs.home.ak["errors.txt"]==="string" && st.fs.home.ak["errors.txt"].includes("ERROR") },
  ],
};

/* ---- Cisco IOS ---- */
L["ios-setup"] = {
  env:"ios", title:"IOS basics: modes, hostname, secret, save", points:50,
  scenario:"A brand-new switch is on your console (like day one at a client site). Give it an identity, protect privileged mode, and make the config survive a reboot.",
  objectives:[
    { text:"Enter privileged EXEC (enable) — prompt becomes #", done:st=>st.history.some(h=>/^\s*en(a(b(l(e)?)?)?)?\s*$/i.test(h)) },
    { text:"Enter global configuration (configure terminal / conf t)", done:st=>st.history.some(h=>/conf/i.test(h)&&/t/i.test(h)) },
    { text:"Set the hostname to SW1", done:st=>st.host==="SW1" },
    { text:"Set an enable secret (enable secret <password>)", done:st=>!!st.enableSecret },
    { text:"Return to privileged EXEC (end) and save: copy running-config startup-config (or write memory)", done:st=>st.savedOnce },
  ],
};
L["ios-ip"] = {
  env:"ios", title:"Bring an interface up with an IP", points:50,
  scenario:"Management needs to reach this device at 192.168.10.2/24 on Gi0/0. Remember: every Cisco interface starts administratively down.",
  objectives:[
    { text:"Enter config mode and select interface g0/0", done:st=>st.history.some(h=>/int/i.test(h)&&/g(igabitethernet)?\s*0\/0/i.test(h)) },
    { text:"Assign ip address 192.168.10.2 255.255.255.0", done:st=>st.intfs["GigabitEthernet0/0"].ip==="192.168.10.2" && st.intfs["GigabitEthernet0/0"].mask==="255.255.255.0" },
    { text:"Bring it up with no shutdown", done:st=>st.intfs["GigabitEthernet0/0"].shut===false },
    { text:"Verify from config mode with do show ip interface brief (or end + show)", done:st=>st.history.some(h=>/sh(ow)?\s+ip\s+int/i.test(h)) },
    { text:"Prove reachability: ping 192.168.10.1 (from privileged EXEC)", done:st=>st.history.some(h=>/^\s*(do\s+)?p(i(n(g)?)?)?\s+192\.168\.10\.1/i.test(h)) && Object.values(st.intfs).some(i=>i.ip&&!i.shut) },
  ],
};
L["ios-vlan"] = {
  env:"ios", title:"Create a VLAN and assign a port", points:50,
  scenario:"Finance is moving onto VLAN 10. Create it, name it, and put access port Gi0/1 in it — then verify like a professional.",
  objectives:[
    { text:"Create VLAN 10 (config: vlan 10)", done:st=>!!st.vlans[10] },
    { text:"Name it FINANCE (name FINANCE)", done:st=>st.vlans[10]==="FINANCE" },
    { text:"On interface g0/1: switchport access vlan 10", done:st=>st.intfs["GigabitEthernet0/1"].vlan===10 },
    { text:"Bring g0/1 up (no shutdown)", done:st=>st.intfs["GigabitEthernet0/1"].shut===false },
    { text:"Verify with show vlan brief", done:st=>st.history.some(h=>/sh(ow)?\s+vlan/i.test(h)) },
    { text:"Save the configuration", done:st=>st.savedOnce },
  ],
};

/* ---- Git ---- */
L["git-basics"] = {
  env:"git", title:"Git end-to-end: init → commit → branch → merge", points:50,
  scenario:"Start a repo for your network auditor the way you'll start every Ladder project — including a feature branch merged back cleanly.",
  objectives:[
    { text:"Initialise the repo (git init)", done:st=>st.g.init },
    { text:"Create README.md with content (echo \"net auditor\" > README.md)", done:st=>{try{return typeof st.fs.home.ak.repo["README.md"]==="string";}catch(e){return false;}} },
    { text:"Stage it (git add README.md or git add .)", done:st=>st.g.committed["README.md"]||st.g.staged.includes("README.md") },
    { text:"Commit with a message (git commit -m \"...\")", done:st=>st.g.branches.main && st.g.branches.main.length>=1 },
    { text:"Create and switch to branch feature (git switch -c feature)", done:st=>st.g.branches.feature!==undefined && st.history.some(h=>/switch|checkout/.test(h)) },
    { text:"On feature: add a new file auditor.py and commit it", done:st=>st.g.branches.feature && st.g.branches.feature.length>(st.g.branches.main?0:0) && st.g.committed["auditor.py"] },
    { text:"Switch back to main and merge feature (git merge feature)", done:st=>st.g.merged.includes("feature") && st.g.branch==="main" },
    { text:"Check history (git log)", done:st=>st.history.some(h=>/git\s+log/.test(h)) },
  ],
};

/* ---- Kubernetes ---- */
L["k8s-triage"] = {
  env:"k8s", title:"K8s triage: CrashLoop, reconciliation, scale", points:50,
  scenario:"You're on the bastion. One api pod is in CrashLoopBackOff and traffic is rising. Diagnose it the CKA way, watch reconciliation in action, then scale for load.",
  objectives:[
    { text:"List the pods (kubectl get pods) and spot the crashing one", done:st=>st.history.some(h=>/kubectl\s+get\s+po/.test(h)) },
    { text:"Describe the crashing pod and read its Events (kubectl describe pod <name>)", done:st=>st.described.some(n=>n.includes("qc7zn")) },
    { text:"Read the previous container's crash log: kubectl logs <pod> --previous", done:st=>st.sawPrevious },
    { text:"Diagnosis check: the crash cause is a missing DB_HOST env var (you'll see it in the traceback)", done:st=>st.sawPrevious },
    { text:"Delete any Running api pod and watch the Deployment replace it (kubectl delete pod <name>, then get pods)", done:st=>st.deletedPods.length>0 },
    { text:"Scale the api deployment to 5 replicas (kubectl scale deployment api --replicas=5)", done:st=>st.scaledTo===5 },
    { text:"Confirm with kubectl get deployments", done:st=>st.history.some(h=>/kubectl\s+get\s+deploy/.test(h)) && st.scaledTo===5 },
  ],
};

})();
