// Ladder Lab — terminal simulators: linux (with pipes, processes, services), cisco ios, k8s, git
window.SIM = (function(){

/* ---------------- shared helpers ---------------- */
function tokens(s){ return s.trim().split(/\s+/).filter(Boolean); }
function matches(toks, pattern){
  const pw = pattern.split(" ");
  for (let i=0;i<pw.length;i++){
    if (pw[i]==="*") return true;
    if (!toks[i]) return false;
    if (!pw[i].startsWith(toks[i].toLowerCase())) return false;
  }
  return true;
}

/* ---------------- LINUX ---------------- */
function linuxEnv(opts){
  opts = opts || {};
  const AUTHLOG = [
    "Oct 11 03:02:11 lab sshd[812]: Failed password for root from 203.0.113.50 port 51234 ssh2",
    "Oct 11 03:02:14 lab sshd[812]: Failed password for root from 203.0.113.50 port 51236 ssh2",
    "Oct 11 03:02:19 lab sshd[815]: Failed password for admin from 198.51.100.9 port 40112 ssh2",
    "Oct 11 03:02:21 lab sshd[815]: Accepted publickey for ak from 10.0.0.5 port 50222 ssh2",
    "Oct 11 03:02:25 lab sshd[818]: Failed password for root from 203.0.113.50 port 51301 ssh2",
    "Oct 11 03:02:31 lab sshd[819]: Failed password for ubuntu from 192.0.2.77 port 39001 ssh2",
    "Oct 11 03:02:36 lab sshd[821]: Failed password for root from 203.0.113.50 port 51322 ssh2",
    "Oct 11 03:02:41 lab sshd[822]: Failed password for admin from 198.51.100.9 port 40180 ssh2",
    "Oct 11 03:02:48 lab sshd[825]: Failed password for root from 203.0.113.50 port 51400 ssh2",
    "Oct 11 03:02:55 lab sshd[826]: Failed password for test from 192.0.2.77 port 39044 ssh2",
  ].join("\n");
  const fs = opts.fs || {
    home:{ ak:{ "notes.txt":"remember: back up configs", projects:{} } },
    etc:{ "hosts":"127.0.0.1 localhost", ssh:{ "sshd_config":"#config\nPort 22\nPermitRootLogin no" } },
    var:{ log:{ "syslog":"Oct 11 02:01 boot ok\nOct 11 02:14 cron ran",
                "auth.log": AUTHLOG,
                "app.log": opts.applog || "INFO start\nERROR db timeout\nINFO retry\nERROR db timeout\nINFO ok\nERROR disk full" } },
    tmp:{},
  };
  const st = { fs, cwd:["home","ak"], user:"ak", host:"lab", history:[], modes:{}, madeDirs:[], removed:[], greps:[], killed:[],
    procs: opts.procs || [
      {pid:1, user:"root", cpu:0.0, mem:0.4, cmd:"/sbin/init"},
      {pid:812, user:"root", cpu:0.0, mem:0.2, cmd:"sshd: /usr/sbin/sshd", port:22},
      {pid:1101, user:"ak", cpu:0.1, mem:0.3, cmd:"-bash"},
    ],
    services: opts.services || {},   // name -> {active, enabled, desc, port, journal:[...]}
  };

  function nodeAt(path){ let n = st.fs; for (const p of path){ if (n && typeof n==="object" && p in n) n = n[p]; else return undefined; } return n; }
  function resolve(arg){
    if (!arg) return st.cwd.slice();
    let parts = arg.startsWith("/") ? [] : st.cwd.slice();
    if (arg === "~" || arg.startsWith("~/")) { parts = ["home","ak"]; arg = arg.slice(2); }
    for (const seg of arg.split("/")){
      if (!seg || seg===".") continue;
      if (seg==="..") parts.pop(); else parts.push(seg);
    }
    return parts;
  }
  function parentOf(path){ return { parent: nodeAt(path.slice(0,-1)), name: path[path.length-1] }; }

  st.prompt = () => `${st.user}@${st.host}:${st.cwd.length? "/"+st.cwd.join("/"):"/"}$ `;
  st.motd = opts.motd || "Ubuntu-style training VM. Type 'help' for the command list.";

  function psTable(){
    let out = "USER       PID  %CPU  %MEM  COMMAND\n";
    for (const p of st.procs) out += p.user.padEnd(9)+String(p.pid).padStart(5)+"  "+p.cpu.toFixed(1).padStart(4)+"  "+p.mem.toFixed(1).padStart(4)+"  "+p.cmd+"\n";
    return out.trimEnd();
  }
  function ssTable(){
    let out = "State   Recv-Q  Send-Q  Local Address:Port   Process\n";
    const listeners = st.procs.filter(p=>p.port);
    for (const s of Object.values(st.services)) if (s.active && s.port && !listeners.some(p=>p.port===s.port)) listeners.push({port:s.port, cmd:s.name, pid:s.pid||600});
    for (const p of listeners) out += `LISTEN  0       128     0.0.0.0:${String(p.port).padEnd(6)}       pid=${p.pid} ("${(p.cmd||"").split(/[\s:]/)[0].replace(/^.*\//,"")}")\n`;
    return out.trimEnd() || "State   Recv-Q  Send-Q  Local Address:Port   Process";
  }
  function svcStatus(name){
    const s = st.services[name];
    if (!s) return `Unit ${name}.service could not be found.`;
    const dot = s.active ? "●" : "×";
    const act = s.active ? "active (running)" : "failed (Result: exit-code)";
    let out = `${dot} ${name}.service - ${s.desc||name}\n   Loaded: loaded (/lib/systemd/system/${name}.service; ${s.enabled?"enabled":"disabled"})\n   Active: ${act} since Oct 11 03:10\n`;
    const j = (s.journal||[]).slice(-3);
    if (j.length) out += j.map(l=>"   "+l).join("\n");
    return out.trimEnd();
  }

  // commands that can read stdin (for pipes)
  function stdinCmd(t, input){
    const c = t[0];
    const lines = (input||"").split("\n").filter(x=>x.length || x==="");
    if (c==="grep"){
      const flags = t.filter(x=>x.startsWith("-")).join("");
      const pat = (t.slice(1).find(x=>!x.startsWith("-"))||"").replace(/^"(.*)"$/,"$1").replace(/^'(.*)'$/,"$1");
      const re = new RegExp(pat, flags.includes("i")?"i":"");
      const hits = lines.filter(l=>re.test(l));
      st.greps.push({pat, file:"(stdin)", count:hits.length});
      if (flags.includes("c")) return String(hits.length);
      if (flags.includes("v")) return lines.filter(l=>!re.test(l)).join("\n");
      return hits.join("\n");
    }
    if (c==="sort"){
      const flags = t.slice(1).join("");
      let arr = lines.slice().filter(x=>x!=="");
      if (flags.includes("n")||flags.includes("h")) arr.sort((a,b)=>parseFloat(a)-parseFloat(b)); else arr.sort();
      if (flags.includes("r")) arr.reverse();
      return arr.join("\n");
    }
    if (c==="uniq"){
      const count = t.includes("-c");
      const out=[]; let prev=null, n=0;
      const arr = lines.filter(x=>x!=="");
      for (const l of arr.concat([Symbol("end")])){
        if (l===prev){ n++; continue; }
        if (prev!==null && typeof prev==="string") out.push(count? String(n).padStart(7)+" "+prev : prev);
        prev = (typeof l==="string")? l : null; n=1;
      }
      return out.join("\n");
    }
    if (c==="wc"){ if (t.includes("-l")) return String(lines.filter(x=>x!=="").length); return `${lines.filter(x=>x!=="").length} ${(input||"").split(/\s+/).filter(Boolean).length} ${(input||"").length}`; }
    if (c==="head"||c==="tail"){
      let n=10; const ni=t.indexOf("-n"); if(ni>-1) n=parseInt(t[ni+1])||10; else { const f=t.find(x=>/^-\d+$/.test(x)); if(f) n=parseInt(f.slice(1)); }
      const arr = lines; return (c==="head"? arr.slice(0,n): arr.slice(-n)).join("\n");
    }
    if (c==="cut"){
      const di=t.indexOf("-d"); const delim = di>-1 ? t[di+1].replace(/^["']|["']$/g,"") : "\t";
      const fi=t.indexOf("-f"); const f = fi>-1 ? parseInt(t[fi+1]) : 1;
      return lines.map(l=>l.split(delim)[f-1]||"").join("\n");
    }
    if (c==="awk"){
      const prog = t.slice(1).join(" ").replace(/^['"]|['"]$/g,"");
      const m = prog.match(/^\{\s*print\s+(.+?)\s*\}$/);
      if (!m) return "awk: only '{print $N[,$M]}' is supported in this lab";
      const fields = m[1].split(",").map(x=>x.trim());
      return lines.filter(x=>x!=="").map(l=>{
        const parts = l.trim().split(/\s+/);
        return fields.map(f=>{ const fm=f.match(/^\$(\d+)$/); return fm? (parts[+fm[1]-1]||"") : f.replace(/^"|"$/g,""); }).join(" ");
      }).join("\n");
    }
    return null; // not a stdin command
  }

  // core dispatcher (no history push; pipes/redirection call this)
  function run(line){
    const t = tokens(line); if (!t.length) return "";
    const c = t[0];
    const redir = line.match(/(.*?)\s*(>>|>)\s*(\S+)\s*$/);
    if (redir && (line.includes("|") || ["grep","cat","head","tail","ls","history","ps","sort","uniq","wc","cut","awk","ss","df","free"].includes(c))){
      const inner = run(redir[1]);
      const p = resolve(redir[3]); const {parent,name} = parentOf(p);
      if (!parent || typeof parent!=="object") return "bash: "+redir[3]+": No such file or directory";
      const text = (typeof inner==="string") ? inner : "";
      parent[name] = (redir[2]===">>" && typeof parent[name]==="string" ? parent[name]+"\n" : "") + text;
      return "";
    }
    // pipeline
    if (line.includes("|")){
      const stages = line.split("|").map(s=>s.trim()).filter(Boolean);
      let data = run(stages[0]);
      if (typeof data!=="string") return data;
      for (let i=1;i<stages.length;i++){
        const out = stdinCmd(tokens(stages[i]), data);
        if (out===null) return `${tokens(stages[i])[0]}: can't be used in a pipeline here (pipeable: grep sort uniq wc head tail cut awk)`;
        data = out;
      }
      return data;
    }

    if (c==="help") return "Files: pwd ls cd cat mkdir touch echo rm cp mv head tail grep chmod\nSystem: ps kill systemctl journalctl ss df du free uname whoami hostname history clear\nPipes work: grep ... | awk '{print $N}' | sort | uniq -c | sort -rn | head" + (st.gitEnabled? "\nAlso: git":"");
    if (c==="pwd") return "/"+st.cwd.join("/");
    if (c==="whoami") return st.user;
    if (c==="hostname") return st.host;
    if (c==="uname") return t[1]==="-a" ? "Linux lab 6.8.0 #1 SMP x86_64 GNU/Linux" : "Linux";
    if (c==="clear") return {clear:true};
    if (c==="history") return st.history.map((h,i)=>`  ${i+1}  ${h}`).join("\n");
    if (c==="ps") return psTable();
    if (c==="top") return "(static snapshot — use ps aux here)\n"+psTable();
    if (c==="free") return "               total        used        free\nMem:        4,027MB     1,212MB     2,815MB\nSwap:       1,024MB         0MB     1,024MB";
    if (c==="df") return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\n/dev/sda2        20G   18G  1.1G  95% /var\ntmpfs           2.0G     0  2.0G   0% /dev/shm";
    if (c==="du"){ return "4.0K\t./notes.txt\n(simplified in this lab — df shows the mounts)"; }
    if (c==="ss"){ st.ranSS=(st.ranSS||0)+1; return ssTable(); }
    if (c==="kill"){
      const nine = t.includes("-9");
      const pid = parseInt(t.filter(x=>!x.startsWith("-"))[1]||t[1]);
      const p = st.procs.find(x=>x.pid===pid);
      if (!p) return `bash: kill: (${t[1]}) - No such process`;
      if (p.pid===1) return "kill: (1) - Operation not permitted";
      st.procs = st.procs.filter(x=>x!==p); st.killed.push(pid);
      return nine? "" : "";
    }
    if (c==="systemctl"){
      const sub = t[1], name = (t[2]||"").replace(/\.service$/,"");
      if (!sub) return "systemctl: usage: systemctl <status|start|restart|stop|enable|disable> <service>";
      if (sub==="status") { st.statusRuns=(st.statusRuns||0)+1; return svcStatus(name); }
      const s = st.services[name];
      if (!s) return `Failed to ${sub} ${name}.service: Unit not found.`;
      if (sub==="enable"){ s.enabled=true; return `Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service.`; }
      if (sub==="disable"){ s.enabled=false; return `Removed symlink.`; }
      if (sub==="stop"){ s.active=false; return ""; }
      if (sub==="start"||sub==="restart"){
        const blocker = s.port && st.procs.find(p=>p.port===s.port);
        if (blocker){
          s.active=false;
          s.journal = (s.journal||[]).concat([`nginx[1490]: bind() to 0.0.0.0:${s.port} failed (98: Address already in use)`,`systemd[1]: ${name}.service: Failed with result 'exit-code'.`]);
          return `Job for ${name}.service failed because the control process exited with error code.\nSee "systemctl status ${name}" and "journalctl -u ${name}" for details.`;
        }
        s.active=true;
        s.journal = (s.journal||[]).concat([`systemd[1]: Started ${s.desc||name}.`]);
        return "";
      }
      return `systemctl: unknown operation '${sub}'`;
    }
    if (c==="journalctl"){
      const ui = t.indexOf("-u");
      const name = ui>-1 ? (t[ui+1]||"").replace(/\.service$/,"") : null;
      if (!name) return "journalctl: use -u <service> in this lab";
      const s = st.services[name];
      st.journalRuns=(st.journalRuns||0)+1;
      if (!s) return `-- No entries --`;
      return (s.journal||["-- No entries --"]).join("\n");
    }
    if (c==="ping"){ return `PING ${t[1]||"host"}: 1 packets transmitted, 1 received, 0% packet loss`; }
    if (c==="ls"){
      const flags = t.filter(x=>x.startsWith("-")).join("");
      const target = t.find((x,i)=>i>0 && !x.startsWith("-"));
      const n = nodeAt(resolve(target));
      if (n===undefined) return `ls: cannot access '${target}': No such file or directory`;
      if (typeof n==="string") return target;
      let names = Object.keys(n);
      if (!flags.includes("a")) names = names.filter(x=>!x.startsWith("."));
      if (!names.length) return "";
      if (flags.includes("l")) return names.map(k=>{
        const isDir = typeof n[k]==="object";
        const mode = (st.modes["/"+resolve(target).concat(k).join("/")]) || (isDir?"drwxr-xr-x":"-rw-r--r--");
        return `${mode} 1 ak ak ${isDir?4096:(n[k].length||0)} Oct 11 ${k}`;
      }).join("\n");
      return names.map(k=> typeof n[k]==="object" ? k+"/" : k).join("  ");
    }
    if (c==="cd"){
      const p = resolve(t[1]); const n = nodeAt(p);
      if (n===undefined) return `bash: cd: ${t[1]}: No such file or directory`;
      if (typeof n==="string") return `bash: cd: ${t[1]}: Not a directory`;
      st.cwd = p; return "";
    }
    if (c==="mkdir"){
      const pFlag = t.includes("-p");
      const args = t.slice(1).filter(x=>!x.startsWith("-"));
      if (!args.length) return "mkdir: missing operand";
      for (const a of args){
        const path = resolve(a);
        let n = st.fs;
        for (let i=0;i<path.length;i++){
          const seg = path[i];
          if (!(seg in n)){
            if (i<path.length-1 && !pFlag) return `mkdir: cannot create directory '${a}': No such file or directory`;
            n[seg] = {};
          }
          n = n[seg];
          if (typeof n==="string") return `mkdir: '${a}': Not a directory`;
        }
        st.madeDirs.push("/"+path.join("/"));
      }
      return "";
    }
    if (c==="touch"){
      if (!t[1]) return "touch: missing file operand";
      const p = resolve(t[1]); const {parent,name} = parentOf(p);
      if (!parent || typeof parent!=="object") return `touch: cannot touch '${t[1]}': No such file or directory`;
      if (!(name in parent)) parent[name]="";
      return "";
    }
    if (c==="echo"){
      if (redir){
        const text = (redir[1].replace(/^echo\s+/,"")||"").replace(/^"(.*)"$/,"$1").replace(/^'(.*)'$/,"$1");
        const p = resolve(redir[3]); const {parent,name} = parentOf(p);
        if (!parent) return "bash: no such directory";
        parent[name] = (redir[2]===">>" && typeof parent[name]==="string" ? parent[name]+"\n" : "") + text;
        return "";
      }
      return line.replace(/^echo\s*/,"").replace(/^"(.*)"$/,"$1").replace(/^'(.*)'$/,"$1");
    }
    if (c==="cat"){
      if (!t[1]) return "cat: missing operand";
      const n = nodeAt(resolve(t[1]));
      if (n===undefined) return `cat: ${t[1]}: No such file or directory`;
      if (typeof n==="object") return `cat: ${t[1]}: Is a directory`;
      return n;
    }
    if (c==="head" || c==="tail"){
      let nLines = 10, file = t[1];
      const ni = t.indexOf("-n"); if (ni>-1){ nLines=parseInt(t[ni+1])||10; file=t[ni+2]; }
      else if (t[1] && /^-\d+$/.test(t[1])){ nLines=parseInt(t[1].slice(1)); file=t[2]; }
      const n = nodeAt(resolve(file));
      if (typeof n!=="string") return `${c}: cannot open '${file}'`;
      const lines = n.split("\n");
      return (c==="head"? lines.slice(0,nLines): lines.slice(-nLines)).join("\n");
    }
    if (c==="rm"){
      const r = t.includes("-r")||t.includes("-rf");
      const args = t.slice(1).filter(x=>!x.startsWith("-"));
      for (const a of args){
        const p = resolve(a); const {parent,name} = parentOf(p);
        if (!parent || !(name in parent)) return `rm: cannot remove '${a}': No such file or directory`;
        if (typeof parent[name]==="object" && !r) return `rm: cannot remove '${a}': Is a directory`;
        delete parent[name]; st.removed.push(name);
      }
      return "";
    }
    if (c==="cp"||c==="mv"){
      const r = t.includes("-r");
      const args = t.slice(1).filter(x=>!x.startsWith("-"));
      if (args.length<2) return `${c}: missing destination`;
      const sp = resolve(args[0]); const src = nodeAt(sp);
      if (src===undefined) return `${c}: cannot stat '${args[0]}': No such file or directory`;
      if (typeof src==="object" && c==="cp" && !r) return `cp: -r not specified; omitting directory '${args[0]}'`;
      const dp = resolve(args[1]); let dest = nodeAt(dp);
      let targetParent, targetName;
      if (dest && typeof dest==="object"){ targetParent = dest; targetName = sp[sp.length-1]; }
      else { const pn = parentOf(dp); targetParent = pn.parent; targetName = pn.name; }
      if (!targetParent) return `${c}: no such directory`;
      targetParent[targetName] = typeof src==="object" ? JSON.parse(JSON.stringify(src)) : src;
      if (c==="mv"){ const pn = parentOf(sp); delete pn.parent[pn.name]; }
      return "";
    }
    if (c==="grep"){
      const flags = t.filter(x=>x.startsWith("-")).join("");
      const rest = t.slice(1).filter(x=>!x.startsWith("-"));
      const pat = (rest[0]||"").replace(/^"(.*)"$/,"$1").replace(/^'(.*)'$/,"$1"); const file = rest[1];
      const n = nodeAt(resolve(file));
      if (typeof n!=="string") return `grep: ${file}: No such file`;
      const re = new RegExp(pat, flags.includes("i")?"i":"");
      const hits = n.split("\n").filter(l=>re.test(l));
      st.greps.push({pat, file, count:hits.length});
      if (flags.includes("c")) return String(hits.length);
      if (flags.includes("v")) return n.split("\n").filter(l=>!re.test(l)).join("\n");
      return hits.join("\n") || "";
    }
    if (["sort","uniq","wc","cut","awk"].includes(c)){
      // allow file argument by reading it, else require pipe
      const fileArg = t.slice(1).find(x=>!x.startsWith("-") && !/^\d+$/.test(x) && !x.startsWith("'") && !x.startsWith("{") && !x.startsWith('"'));
      if (fileArg){
        const n = nodeAt(resolve(fileArg));
        if (typeof n==="string") return stdinCmd(t.filter(x=>x!==fileArg), n);
      }
      return `${c}: feed it through a pipe, e.g. cat file | ${c} ...`;
    }
    if (c==="chmod"){
      const mode = t[1], file = t[2];
      if (!mode||!file) return "chmod: missing operand";
      const p = resolve(file);
      if (nodeAt(p)===undefined) return `chmod: cannot access '${file}': No such file or directory`;
      let str;
      if (/^\d{3}$/.test(mode)){
        const m = x=>["---","--x","-w-","-wx","r--","r-x","rw-","rwx"][+x];
        str = "-"+m(mode[0])+m(mode[1])+m(mode[2]);
      } else if (mode==="+x"||mode==="u+x"){ str="-rwxr--r--"; }
      else str = "-rw-r--r--";
      st.modes["/"+p.join("/")] = str;
      st.lastChmod = {file:p[p.length-1], mode};
      return "";
    }
    if (c==="git" && st.gitEnabled) return st.git(t);
    return `${c}: command not found (type 'help')`;
  }

  st.exec = function(line){ st.history.push(line); return run(line); };
  st.run = run;
  return st;
}

/* ---------------- GIT (rides on the linux env) ---------------- */
function gitEnv(){
  const st = linuxEnv({ fs:{ home:{ ak:{ repo:{} } } }, motd:"Git training box. You are in ~/repo. 'help' lists commands." });
  st.cwd = ["home","ak","repo"];
  st.gitEnabled = true;
  st.g = { init:false, branch:null, branches:{}, staged:[], committed:{}, merged:[], log:[] };
  st.git = function(t){
    const g = st.g, sub = t[1];
    if (!sub) return "usage: git <init|status|add|commit|branch|switch|merge|log>";
    if (sub==="init"){ if(g.init) return "Reinitialized existing Git repository"; g.init=true; g.branch="main"; g.branches={main:[]}; return "Initialized empty Git repository in ~/repo/.git/"; }
    if (!g.init) return "fatal: not a git repository (run 'git init')";
    const dir = (function(){ let n=st.fs; for(const p of ["home","ak","repo"]) n=n[p]; return n; })();
    const files = Object.keys(dir);
    if (sub==="status"){
      const untracked = files.filter(f=>!g.staged.includes(f) && !(f in g.committed));
      const stagedNew = g.staged.filter(f=>files.includes(f));
      let out = `On branch ${g.branch}\n`;
      if (stagedNew.length) out += "Changes to be committed:\n" + stagedNew.map(f=>"\tnew file:   "+f).join("\n")+"\n";
      if (untracked.length) out += "Untracked files:\n" + untracked.map(f=>"\t"+f).join("\n")+"\n";
      if (!stagedNew.length && !untracked.length) out += "nothing to commit, working tree clean";
      return out;
    }
    if (sub==="add"){
      const arg = t[2];
      if (!arg) return "Nothing specified, nothing added.";
      if (arg==="." ) { g.staged = Array.from(new Set(g.staged.concat(files))); return ""; }
      if (!files.includes(arg)) return `fatal: pathspec '${arg}' did not match any files`;
      if (!g.staged.includes(arg)) g.staged.push(arg);
      return "";
    }
    if (sub==="commit"){
      const mi = t.indexOf("-m");
      if (mi===-1) return "Aborting commit: use -m \"message\"";
      const msg = t.slice(mi+1).join(" ").replace(/^"(.*)"$/,"$1");
      if (!g.staged.length) return "nothing to commit (use 'git add')";
      g.staged.forEach(f=>g.committed[f]=true);
      const hash = (Math.random().toString(16).slice(2,9));
      g.branches[g.branch].push({hash,msg});
      g.log.push({hash,msg,branch:g.branch});
      g.staged = [];
      return `[${g.branch} ${hash}] ${msg}`;
    }
    if (sub==="branch"){
      if (!t[2]) return Object.keys(g.branches).map(b=>(b===g.branch?"* ":"  ")+b).join("\n");
      if (g.branches[t[2]]) return `fatal: a branch named '${t[2]}' already exists`;
      g.branches[t[2]] = g.branches[g.branch].slice();
      return "";
    }
    if (sub==="switch" || sub==="checkout"){
      let name = t[2];
      if (name==="-b"||name==="-c"){ name=t[3]; if(!name) return "fatal: branch name required"; g.branches[name]=g.branches[g.branch].slice(); }
      if (!g.branches[name]) return `fatal: invalid reference: ${name}`;
      g.branch = name; return `Switched to branch '${name}'`;
    }
    if (sub==="merge"){
      const name = t[2];
      if (!g.branches[name]) return `merge: ${name} - not something we can merge`;
      const cur = g.branches[g.branch], inc = g.branches[name];
      const curH = new Set(cur.map(x=>x.hash));
      const extra = inc.filter(x=>!curH.has(x.hash));
      if (!extra.length) return "Already up to date.";
      extra.forEach(x=>cur.push(x));
      g.merged.push(name);
      return `Merge made by the 'ort' strategy.\n ${extra.length} commit(s) merged into ${g.branch}.`;
    }
    if (sub==="log"){
      const cur = g.branches[g.branch];
      if (!cur.length) return "fatal: your current branch has no commits yet";
      return cur.slice().reverse().map(x=>`${x.hash} ${x.msg}`).join("\n");
    }
    return `git: '${sub}' is not a git command`;
  };
  return st;
}

/* ---------------- CISCO IOS ---------------- */
function iosEnv(opts){
  opts = opts || {};
  const st = {
    opts,
    mode:"user", host: opts.host || (opts.kind==="router"?"Router":"Switch"), enableSecret:null, saved:false, savedOnce:false,
    ifname:null, vlanId:null, history:[],
    vlans: {1:"default"},
    ospf: null,                 // {pid, rid, networks:[{net,wc,area}], passive:[]}
    staticRoutes: [],           // {prefix, mask, nh}
    intfs: opts.intfs || { "GigabitEthernet0/0":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null},
                           "GigabitEthernet0/1":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null},
                           "GigabitEthernet0/2":{ip:null,mask:null,shut:true,vlan:1,mode:"access",allowed:null} },
    motd: opts.motd || "Console connected. You are at user EXEC. ('?' or 'help' shows hints)",
  };
  function maskLen(mask){ return (mask||"").split(".").reduce((a,o)=>a+((+o).toString(2).match(/1/g)||[]).length,0); }
  st.neighborFull = function(){
    const nb = opts.neighbor; if (!nb || !st.ospf) return false;
    const i = st.intfs[nb.ifname]; if (!i || i.shut || !i.ip) return false;
    return st.ospf.networks.some(n=>n.net===nb.net && n.area===String(nb.area!=null?nb.area:0));
  };
  function staticCovers(ip){
    return st.staticRoutes.some(r=> r.prefix==="0.0.0.0" || ip.startsWith(r.prefix.split(".").slice(0, maskLen(r.mask)/8).join(".")+".") || ip===r.prefix );
  }
  st.reachable = function(ip){
    const anyUp = Object.values(st.intfs).some(i=>i.ip && !i.shut);
    if (!anyUp) return false;
    if (!opts.strictPing) return true;
    const nb = opts.neighbor;
    if (nb && ip===nb.peerIp){ const i=st.intfs[nb.ifname]; return !!(i && i.ip && !i.shut); }
    if (nb && nb.remoteIp && ip===nb.remoteIp) return st.neighborFull() || staticCovers(ip);
    return staticCovers(ip);
  };
  function normIf(raw){
    if (!raw) return null;
    const m = raw.toLowerCase().match(/^(g(?:i(?:g(?:abitethernet)?)?)?)(\d+\/\d+)$/) || raw.toLowerCase().match(/^(g(?:i(?:g(?:abitethernet)?)?)?)\s*(\d+\/\d+)$/);
    if (m) return "GigabitEthernet"+m[2];
    return null;
  }
  st.prompt = function(){
    const h = st.host;
    if (st.mode==="user") return h+"> ";
    if (st.mode==="priv") return h+"# ";
    if (st.mode==="config") return h+"(config)# ";
    if (st.mode==="config-if") return h+"(config-if)# ";
    if (st.mode==="config-vlan") return h+"(config-vlan)# ";
    if (st.mode==="config-router") return h+"(config-router)# ";
    return h+"# ";
  };
  function routeTable(filter){
    const lines = [];
    let gw = st.staticRoutes.find(r=>r.prefix==="0.0.0.0");
    lines.push("Codes: C - connected, L - local, S - static, O - OSPF");
    lines.push("");
    lines.push(gw? `Gateway of last resort is ${gw.nh} to network 0.0.0.0` : "Gateway of last resort is not set");
    for (const [n,i] of Object.entries(st.intfs)){
      if (i.ip && !i.shut){
        const len = maskLen(i.mask);
        const oct = i.ip.split(".").map(Number);
        const bits = oct.reduce((a,o)=>(a<<8n)+BigInt(o),0n) & (len?((1n<<BigInt(len))-1n)<<BigInt(32-len):0n);
        const net = [Number(bits>>24n&255n),Number(bits>>16n&255n),Number(bits>>8n&255n),Number(bits&255n)].join(".");
        lines.push(`C        ${net}/${len} is directly connected, ${n}`);
        lines.push(`L        ${i.ip}/32 is directly connected, ${n}`);
      }
    }
    for (const r of st.staticRoutes){
      const len = r.prefix==="0.0.0.0"? 0 : maskLen(r.mask);
      lines.push(`S${r.prefix==="0.0.0.0"?"*":" "}       ${r.prefix}/${len} [1/0] via ${r.nh}`);
    }
    if (st.neighborFull() && opts.neighbor && opts.neighbor.advertised){
      for (const a of opts.neighbor.advertised) lines.push(`O        ${a.prefix} [110/2] via ${a.via}, ${opts.neighbor.ifname}`);
    }
    let out = lines;
    if (filter==="ospf") out = lines.filter(l=>l.startsWith("O")||l.startsWith("Codes")||l==="");
    if (filter==="static") out = lines.filter(l=>l.startsWith("S")||l.startsWith("Codes")||l.startsWith("Gateway")||l==="");
    return out.join("\n");
  }
  function trunkTable(){
    const trunks = Object.entries(st.intfs).filter(([n,i])=>i.mode==="trunk");
    if (!trunks.length) return "(no trunk interfaces configured)";
    let out = "Port        Mode         Encapsulation  Status        Native vlan\n";
    for (const [n,i] of trunks) out += n.replace("GigabitEthernet","Gi").padEnd(12)+"on           802.1q         "+(i.shut?"not-trunking":"trunking").padEnd(14)+"1\n";
    out += "\nPort        Vlans allowed on trunk\n";
    for (const [n,i] of trunks) out += n.replace("GigabitEthernet","Gi").padEnd(12)+(i.allowed? i.allowed.join(",") : "1-4094")+"\n";
    return out.trimEnd();
  }
  function shIpIntBr(){
    let out = "Interface              IP-Address      OK? Method Status                Protocol\n";
    for (const [n,i] of Object.entries(st.intfs)){
      const status = i.shut ? "administratively down" : "up";
      const proto  = i.shut ? "down" : "up";
      out += n.padEnd(23) + String(i.ip||"unassigned").padEnd(16) + "YES manual " + status.padEnd(22) + proto + "\n";
    }
    return out.trimEnd();
  }
  function runningCfg(){
    let out = `Building configuration...\n!\nhostname ${st.host}\n`;
    if (st.enableSecret) out += "enable secret 5 $1$hashed$\n";
    for (const [id,name] of Object.entries(st.vlans)) if (id!=="1") out += `vlan ${id}\n name ${name}\n`;
    for (const [n,i] of Object.entries(st.intfs)){
      out += `!\ninterface ${n}\n`;
      if (i.desc) out += ` description ${i.desc}\n`;
      if (i.mode==="trunk"){ out += " switchport mode trunk\n"; if (i.allowed) out += ` switchport trunk allowed vlan ${i.allowed.join(",")}\n`; }
      else if (i.mode==="access" && i.vlan && i.vlan!==1) out += ` switchport access vlan ${i.vlan}\n`;
      if (i.ip) out += ` ip address ${i.ip} ${i.mask}\n`;
      out += i.shut ? " shutdown\n" : " no shutdown\n";
    }
    if (st.ospf){
      out += `!\nrouter ospf ${st.ospf.pid}\n`;
      if (st.ospf.rid) out += ` router-id ${st.ospf.rid}\n`;
      for (const n of st.ospf.networks) out += ` network ${n.net} ${n.wc} area ${n.area}\n`;
      for (const p of st.ospf.passive) out += ` passive-interface ${p}\n`;
    }
    for (const r of st.staticRoutes) out += `ip route ${r.prefix} ${r.mask} ${r.nh}\n`;
    out += "!\nend";
    return out;
  }
  st.exec = function(line){
    st.history.push(line);
    const raw = line.trim(); if (!raw) return "";
    let t = tokens(raw);
    const low = t.map(x=>x.toLowerCase());
    const isDo = low[0]==="do" && st.mode.startsWith("config");
    if (isDo){ t = t.slice(1); }
    const l = t.map(x=>x.toLowerCase());

    if (raw==="?"||l[0]==="help"){
      if (st.mode==="user") return "enable  — enter privileged EXEC";
      if (st.mode==="priv") return "configure terminal · show ip interface brief · show ip route [ospf|static] · show ip ospf neighbor · show interfaces trunk · show running-config · show vlan brief · copy run start / write memory · ping <ip> · disable";
      if (st.mode==="config") return "hostname <name> · enable secret <pw> · interface g0/1 · vlan <id> · router ospf <pid> · ip route <net> <mask> <next-hop> · exit · end";
      if (st.mode==="config-if") return "ip address <ip> <mask> · no shutdown · shutdown · switchport mode access|trunk · switchport access vlan <id> · switchport trunk allowed vlan <list> · exit · end";
      if (st.mode==="config-vlan") return "name <NAME> · exit · end";
      if (st.mode==="config-router") return "router-id <a.b.c.d> · network <net> <wildcard> area <n> · passive-interface <if> · exit · end";
    }

    if (st.mode==="user"){
      if (matches(l,"enable")){ st.mode="priv"; return ""; }
      if (matches(l,"show *")) return "% Invalid input: enter privileged EXEC first ('enable')";
      return "% Invalid input detected";
    }
    if (l[0]==="end" && st.mode.startsWith("config")){ st.mode="priv"; return ""; }
    if (l[0]==="exit"){
      if (st.mode==="config-if"||st.mode==="config-vlan"||st.mode==="config-router") st.mode="config";
      else if (st.mode==="config") st.mode="priv";
      else if (st.mode==="priv") st.mode="user";
      return "";
    }
    if (st.mode==="priv" || isDo){
      if (matches(l,"disable")){ st.mode="user"; return ""; }
      if (matches(l,"configure terminal")||raw.toLowerCase()==="conf t"){ st.mode="config"; return "Enter configuration commands, one per line.  End with CNTL/Z."; }
      if (matches(l,"show ip interface brief")) return shIpIntBr();
      if (matches(l,"show ip ospf neighbor")){
        st.ranOspfNeigh = (st.ranOspfNeigh||0)+1;
        if (!st.ospf) return "% OSPF: process not running";
        if (!st.neighborFull()) return "(no neighbors — is the interface up with an IP, and does a network statement cover it in the right area?)";
        const nb = opts.neighbor;
        return "Neighbor ID     Pri   State           Dead Time   Address         Interface\n"+
               `${nb.rid.padEnd(15)} 1     FULL/BDR        00:00:36    ${nb.peerIp.padEnd(15)} ${nb.ifname}`;
      }
      if (matches(l,"show ip route")){
        st.ranRoute = (st.ranRoute||0)+1;
        const f = l[3]; return routeTable(f==="ospf"?"ospf": f==="static"?"static": null);
      }
      if (matches(l,"show interfaces trunk")||matches(l,"show interface trunk")){ st.ranTrunk=(st.ranTrunk||0)+1; return trunkTable(); }
      if (matches(l,"show running-config")||matches(l,"show run")) return runningCfg();
      if (matches(l,"show startup-config")) return st.savedOnce ? runningCfg() : "startup-config is not present";
      if (matches(l,"show vlan brief")||matches(l,"show vlan")){
        let out = "VLAN Name                             Status    Ports\n";
        for (const [id,name] of Object.entries(st.vlans)){
          const ports = Object.entries(st.intfs).filter(([n,i])=>i.vlan==id && i.mode==="access").map(([n])=>n.replace("GigabitEthernet","Gi")).join(", ");
          out += String(id).padEnd(5) + name.padEnd(33) + "active".padEnd(10) + ports + "\n";
        }
        return out.trimEnd();
      }
      if (matches(l,"show mac address-table")) return "Vlan  Mac Address     Type     Ports\n   1  0050.7966.6800  DYNAMIC  Gi0/1\n   1  0050.7966.6801  DYNAMIC  Gi0/2";
      if (matches(l,"show version")) return "Cisco IOS Software [Ladder Lab], Version 17.9\nUptime: 42 minutes\nSystem image file: flash:lab.bin";
      if (matches(l,"copy running-config startup-config")||matches(l,"copy run start")||matches(l,"write memory")||raw.toLowerCase()==="wr"){
        st.saved=true; st.savedOnce=true; return "Destination filename [startup-config]?\nBuilding configuration...\n[OK]";
      }
      if (l[0] && "ping".startsWith(l[0]) && t[1]){
        const ok = st.reachable(t[1]);
        st.pinged = st.pinged||{}; st.pinged[t[1]] = ok;
        const hint = Object.values(st.intfs).some(i=>i.ip&&!i.shut) ? "(no route to that destination yet?)" : "(hint: is an interface up with an IP?)";
        return ok ? `Sending 5, 100-byte ICMP Echos to ${t[1]}:\n!!!!!\nSuccess rate is 100 percent (5/5)` :
                    `Sending 5, 100-byte ICMP Echos to ${t[1]}:\n.....\nSuccess rate is 0 percent (0/5)  ${hint}`;
      }
      if (isDo) return "% Invalid input detected";
    }
    if (st.mode==="config"){
      if (l[0]==="hostname" && t[1]){ st.host=t[1]; return ""; }
      if (matches(l,"enable secret") && t[2]){ st.enableSecret=t[2]; return ""; }
      if ((l[0]&&"interface".startsWith(l[0])) && t[1]){
        const n = normIf(t[1]) || normIf(t[1]+(t[2]||""));
        if (!n || !st.intfs[n]) return "% Invalid interface (try g0/0, g0/1, g0/2)";
        st.ifname=n; st.mode="config-if"; return "";
      }
      if (l[0]==="vlan" && t[1]){
        const id = parseInt(t[1]); if(!id) return "% Invalid VLAN id";
        if (!st.vlans[id]) st.vlans[id] = "VLAN"+String(id).padStart(4,"0");
        st.vlanId=id; st.mode="config-vlan"; return "";
      }
      if (matches(l,"router ospf") && t[2]){
        st.ospf = st.ospf || { pid:parseInt(t[2]), rid:null, networks:[], passive:[] };
        st.mode="config-router"; return "";
      }
      if (matches(l,"ip route") && t[2] && t[3] && t[4]){
        st.staticRoutes.push({prefix:t[2], mask:t[3], nh:t[4]});
        return "";
      }
      if (l[0]==="no") return "% (nothing to remove in this lab)";
      return "% Invalid input detected at config mode ('?' for hints)";
    }
    if (st.mode==="config-if"){
      const i = st.intfs[st.ifname];
      if (matches(l,"ip address") && t[2] && t[3]){ i.ip=t[2]; i.mask=t[3]; return ""; }
      if (matches(l,"no shutdown")){ if(i.shut){ i.shut=false; return `%LINK-3-UPDOWN: Interface ${st.ifname}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${st.ifname}, changed state to up`;} return ""; }
      if (l[0]==="shutdown"){ i.shut=true; return `%LINK-5-CHANGED: Interface ${st.ifname}, changed state to administratively down`; }
      if (matches(l,"switchport access vlan") && t[3]){ const id=parseInt(t[3]); if(!st.vlans[id]) st.vlans[id]="VLAN"+String(id).padStart(4,"0"); i.vlan=id; i.mode="access"; return ""; }
      if (matches(l,"switchport mode access")){ i.mode="access"; return ""; }
      if (matches(l,"switchport mode trunk")){ i.mode="trunk"; return ""; }
      if (matches(l,"switchport trunk encapsulation dot1q")){ return ""; }
      if (matches(l,"switchport trunk allowed vlan") && t[4]){
        i.allowed = t[4].split(",").map(x=>parseInt(x)).filter(Boolean);
        i.allowed.forEach(id=>{ if(!st.vlans[id]) st.vlans[id]="VLAN"+String(id).padStart(4,"0"); });
        return "";
      }
      if (l[0]==="description"){ i.desc = t.slice(1).join(" "); return ""; }
      return "% Invalid input at interface mode ('?' for hints)";
    }
    if (st.mode==="config-router"){
      const o = st.ospf;
      if (matches(l,"router-id") && t[1]){ o.rid=t[1]; return "(router-id takes effect for new adjacencies)"; }
      if (l[0]==="network" && t[1] && t[2] && l[3]==="area" && t[4]!==undefined){
        o.networks.push({net:t[1], wc:t[2], area:String(parseInt(t[4]))});
        return "";
      }
      if (matches(l,"passive-interface") && t[1]){ o.passive.push(t[1]); return ""; }
      return "% Invalid input at router mode ('?' for hints: network <net> <wildcard> area <n>)";
    }
    if (st.mode==="config-vlan"){
      if (l[0]==="name" && t[1]){ st.vlans[st.vlanId]=t[1]; return ""; }
      return "% Invalid input at vlan mode ('name <NAME>', 'exit')";
    }
    return "% Invalid input detected";
  };
  return st;
}

/* ---------------- KUBERNETES ---------------- */
function k8sEnv(){
  function pod(name, ready, status, restarts){ return {name, ready, status, restarts}; }
  const st = {
    history:[], scaledTo:3, deletedPods:[], sawLogs:false, sawPrevious:false, described:[],
    deploys: { api:{replicas:3, image:"ghcr.io/akpevwe/net-auditor:1.4"}, worker:{replicas:2, image:"worker:2.1"} },
    services: { api:{port:80, target:8000, type:"ClusterIP"} },
    created: [], exposed: [],
    pods: [
      pod("api-7d9f4b-x2kqp","1/1","Running",0),
      pod("api-7d9f4b-m8slw","1/1","Running",0),
      pod("api-7d9f4b-qc7zn","0/1","CrashLoopBackOff",7),
      pod("worker-5c6d-ab12c","1/1","Running",0),
      pod("worker-5c6d-zz93f","1/1","Running",0),
    ],
    motd:"kubectl is configured against the training cluster (namespace: default). 'help' for hints.",
  };
  st.prompt = ()=>"ak@bastion:~$ ";
  function podTable(){
    let out = "NAME                    READY   STATUS             RESTARTS   AGE\n";
    for (const p of st.pods) out += p.name.padEnd(24)+p.ready.padEnd(8)+p.status.padEnd(19)+String(p.restarts).padEnd(11)+"42m\n";
    return out.trimEnd();
  }
  function syncPods(name){
    const d = st.deploys[name]; if(!d) return;
    const mine = st.pods.filter(p=>p.name.startsWith(name+"-"));
    while (mine.length < d.replicas){
      const p = pod(name+"-6f7b-"+Math.random().toString(36).slice(2,7),"1/1","Running",0);
      st.pods.push(p); mine.push(p);
    }
    while (mine.length > d.replicas){
      const p = mine.pop(); st.pods = st.pods.filter(x=>x!==p);
    }
  }
  const syncApiPods = ()=>syncPods("api");
  st.exec = function(line){
    st.history.push(line);
    const t = tokens(line); if(!t.length) return "";
    if (t[0]==="help") return "kubectl get pods|deployments|svc · describe pod <name> · logs <pod> [--previous] · delete pod <name> · scale deployment <name> --replicas=N · create deployment <name> --image=IMG [--replicas=N] · expose deployment <name> --port=N [--target-port=N]";
    if (t[0]!=="kubectl") return (t[0]==="k" ? st.exec("kubectl "+t.slice(1).join(" ")) : `${t[0]}: command not found (this box only has kubectl; 'help')`);
    const sub = t[1];
    if (sub==="get"){
      const what = (t[2]||"").toLowerCase();
      if (what.startsWith("pod")) return podTable();
      if (what.startsWith("deploy")){
        let out = "NAME     READY   UP-TO-DATE   AVAILABLE   AGE\n";
        for (const [n,d] of Object.entries(st.deploys)){
          const ready = st.pods.filter(p=>p.name.startsWith(n+"-")&&p.status==="Running").length;
          out += n.padEnd(9)+`${ready}/${d.replicas}`.padEnd(8)+String(d.replicas).padEnd(13)+String(ready).padEnd(12)+"42m\n";
        }
        return out.trimEnd();
      }
      if (what.startsWith("svc")||what.startsWith("service")){
        let out = "NAME      TYPE        CLUSTER-IP      PORT(S)    AGE\n";
        for (const [n,s] of Object.entries(st.services))
          out += n.padEnd(10)+s.type.padEnd(12)+("10.96."+(10+n.length)+"."+(40+n.length)).padEnd(16)+(s.port+"/TCP").padEnd(11)+"42m\n";
        return out.trimEnd();
      }
      if (what.startsWith("all")) return st.exec("kubectl get deployments")+"\n\n"+podTable();
      return `error: the server doesn't have a resource type "${t[2]}"`;
    }
    if (sub==="create" && (t[2]||"").startsWith("deploy")){
      const name = t[3];
      const im = line.match(/--image[= ](\S+)/); const rp = line.match(/--replicas[= ](\d+)/);
      if (!name || !im) return "error: usage: kubectl create deployment <name> --image=<image> [--replicas=N]";
      if (st.deploys[name]) return `error: deployments.apps "${name}" already exists`;
      st.deploys[name] = { replicas: rp? parseInt(rp[1]) : 1, image: im[1] };
      st.created.push(name);
      for (let i=0;i<st.deploys[name].replicas;i++)
        st.pods.push(pod(name+"-6f7b-"+Math.random().toString(36).slice(2,7),"1/1","Running",0));
      return `deployment.apps/${name} created`;
    }
    if (sub==="expose" && (t[2]||"").startsWith("deploy")){
      const name = t[3];
      const pm = line.match(/--port[= ](\d+)/); const tm = line.match(/--target-port[= ](\d+)/);
      if (!st.deploys[name]) return `Error from server (NotFound): deployments.apps "${name}" not found`;
      if (!pm) return "error: --port is required";
      st.services[name] = { port: parseInt(pm[1]), target: tm? parseInt(tm[1]) : parseInt(pm[1]), type:"ClusterIP" };
      st.exposed.push(name);
      return `service/${name} exposed`;
    }
    if (sub==="describe" && (t[2]||"").startsWith("pod")){
      const name = t[3]; const p = st.pods.find(x=>x.name===name);
      if (!p) return `Error from server (NotFound): pods "${name}" not found`;
      st.described.push(name);
      let ev = p.status==="CrashLoopBackOff" ?
`Events:
  Warning  BackOff    2m (x18 over 40m)  kubelet  Back-off restarting failed container
  Normal   Pulled     40m                kubelet  Container image "ghcr.io/akpevwe/net-auditor:1.4" already present
  Normal   Started    40m (x7)           kubelet  Started container api` :
`Events:
  Normal  Scheduled  42m  default-scheduler  Successfully assigned default/${name}
  Normal  Started    42m  kubelet            Started container`;
      return `Name:         ${name}\nNamespace:    default\nStatus:       ${p.status==="CrashLoopBackOff"?"Running (waiting: CrashLoopBackOff)":p.status}\nRestart Count: ${p.restarts}\n${ev}`;
    }
    if (sub==="logs"){
      const prev = t.includes("--previous") || t.includes("-p");
      const name = t.find((x,i)=>i>=2 && !x.startsWith("-"));
      const p = st.pods.find(x=>x.name===name);
      if (!p) return `Error from server (NotFound): pods "${name}" not found`;
      st.sawLogs = true;
      if (p.status==="CrashLoopBackOff"){
        if (prev){ st.sawPrevious = true;
          return `INFO  booting net-auditor 1.4\nINFO  loading config from /etc/app/config.yaml\nTraceback (most recent call last):\n  File "main.py", line 12\nKeyError: 'DB_HOST'\nFATAL: required env var DB_HOST is not set — exiting`;
        }
        return `Error from server (BadRequest): container "api" in pod "${name}" is waiting to start: back-off restarting\n(hint: the current container hasn't started — read the PREVIOUS crash with --previous)`;
      }
      return "INFO request handled 200 /healthz\nINFO request handled 200 /audit";
    }
    if (sub==="delete" && (t[2]||"").startsWith("pod")){
      const name = t[3]; const p = st.pods.find(x=>x.name===name);
      if (!p) return `Error from server (NotFound): pods "${name}" not found`;
      st.pods = st.pods.filter(x=>x!==p); st.deletedPods.push(name);
      let out = `pod "${name}" deleted`;
      const owner = Object.keys(st.deploys).find(d=>name.startsWith(d+"-"));
      if (owner){ syncPods(owner); out += `\n(reconciliation: the Deployment immediately created a replacement — run 'kubectl get pods')`; }
      return out;
    }
    if (sub==="scale" && (t[2]||"").startsWith("deploy")){
      const name = t[3]; const m = line.match(/--replicas[= ](\d+)/);
      if (!st.deploys[name]) return `Error from server (NotFound): deployments "${name}" not found`;
      if (!m) return "error: --replicas is required";
      st.deploys[name].replicas = parseInt(m[1]);
      syncPods(name);
      if (name==="api") st.scaledTo = st.deploys.api.replicas;
      return `deployment.apps/${name} scaled`;
    }
    if (sub==="rollout") return "deployment.apps/api: rollout commands are stubbed in this lab";
    return `kubectl: unknown or unsupported command here — 'help' lists what this lab supports`;
  };
  return st;
}

return { linuxEnv, iosEnv, k8sEnv, gitEnv };
})();
