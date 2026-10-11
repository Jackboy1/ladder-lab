// Engine regression tests for sim_ios.js + bench.js. Usage: node tools/engine_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');const root=process.argv[2]||path.join(__dirname,'..');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<script src="([^"?]+)/g)) if(m[1]!=='app.js') vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),ctx,{filename:m[1]});
const {Bench,SIM}=ctx; let fails=0; const ok=(c,msg)=>{ if(!c){fails++; console.log("FAIL:",msg);} else console.log("ok  ",msg); };
const run=(B,a)=>Bench.act(B,a);
const out=(B,a)=>{ const r=run(B,a); const o=r.out; return typeof o==="string"?o:o&&((o.text||"")+(o.ask||""))||r.msg||""; };
const CON={speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"};

// 1 switch + 2 PCs, MAC learning, ARP, console show mac
let B=Bench.create({devices:[{id:"sw",kind:"switch",label:"SW1"},{id:"pc1",kind:"pc",label:"PC1",ip:"10.0.0.1",mask:"255.255.255.0"},{id:"pc2",kind:"pc",label:"PC2",ip:"10.0.0.2",mask:"255.255.255.0"},{id:"lap",kind:"laptop",label:"LAP"}],
 cables:[{type:"cat6",a:"pc1:eth",b:"sw:g1"},{type:"cat6",a:"pc2:eth",b:"sw:g2"},{type:"console",a:"lap:usb",b:"sw:con"}]});
ok(Bench.macCount(B,"sw")===0,"MAC table empty at start");
ok(/Reply from 10.0.0.2/.test(out(B,["pc","pc1","ping 10.0.0.2"])),"PC1 pings PC2");
ok(Bench.macCount(B,"sw")===2,"switch learned 2 MACs");
ok(B.frames.some(f=>f.kind==="bcast") && B.frames.some(f=>f.kind==="ucast"),"frames: broadcast ARP + unicast");
ok(/10\.0\.0\.2\s+00/.test(out(B,["pc","pc1","arp -a"])),"PC1 arp -a shows PC2");
run(B,["console","lap",CON]);
run(B,["term",""]); run(B,["term","en"]);
const mt=out(B,["term","sh mac add dyn"]); ok(/Gi0\/1/.test(mt)&&/Gi0\/2/.test(mt)&&/Total Mac Addresses for this criterion: 2/.test(mt),"show mac address-table dynamic lists both");
run(B,["term","clear mac address-table dynamic"]); ok(Bench.macCount(B,"sw")===0,"clear mac address-table works");
const ist=out(B,["term","show interfaces status"]); ok(/notconnect/.test(ist) && / connected /.test(ist),"show interfaces status shows connected/notconnect");
ok(/Translating "shwo"/.test(out(B,["term","shwo"])),"typo triggers Translating... DNS lookup");
ok(/\^\n% Invalid input detected/.test(out(B,["term","show ip intrface brief"])),"invalid input shows caret");
ok(/Ambiguous/.test(out(B,["term","c"])),"'c' is ambiguous in priv (configure/copy/clear)");
ok(/Incomplete/.test(out(B,["term","show ip"])),"show ip is incomplete");
ok(/running-config/.test(out(B,["term","show ?"])),"show ? lists options");
ok(B.devs.sw.env.complete("sh")==="show ","Tab completes sh to show");
// 2 VLAN isolation
run(B,["term","conf t"]); run(B,["term","int g0/2"]); run(B,["term","switchport access vlan 20"]); run(B,["term","end"]);
ok(/unreachable/.test(out(B,["pc","pc1","ping 10.0.0.2"])),"different VLANs can't talk at L2");
ok(/20\s+VLAN0020\s+active\s+Gi0\/2/.test(out(B,["term","show vlan brief"])),"show vlan brief shows VLAN 20 with Gi0/2");
// 3 hub
B=Bench.create({devices:[{id:"hub",kind:"hub",label:"HUB"},{id:"a",kind:"pc",label:"A",ip:"10.0.0.1",mask:"255.0.0.0"},{id:"b",kind:"pc",label:"B",ip:"10.0.0.2",mask:"255.0.0.0"},{id:"c",kind:"pc",label:"C",ip:"10.0.0.3",mask:"255.0.0.0"}],
 cables:[{type:"cat6",a:"a:eth",b:"hub:p1"},{type:"cat6",a:"b:eth",b:"hub:p2"},{type:"cat6",a:"c:eth",b:"hub:p3"}]});
ok(/Reply/.test(out(B,["pc","a","ping 10.0.0.2"])),"ping through a hub");
ok(B.frames.filter(f=>f.kind==="ucast"&&f.b==="c:eth").length>0,"hub repeats unicast to C too");
// 4 routing between subnets
B=Bench.create({devices:[{id:"r",kind:"router",label:"R1"},{id:"s1",kind:"switch",label:"S1"},{id:"p1",kind:"pc",label:"P1",ip:"10.1.1.10",mask:"255.255.255.0",gw:"10.1.1.1"},{id:"p2",kind:"pc",label:"P2",ip:"10.2.2.10",mask:"255.255.255.0",gw:"10.2.2.1"},{id:"lap",kind:"laptop",label:"L"}],
 cables:[{type:"cat6",a:"p1:eth",b:"s1:g1"},{type:"cat6",a:"s1:g8",b:"r:g0"},{type:"cat6",a:"p2:eth",b:"r:g1"},{type:"console",a:"lap:usb",b:"r:con"}]});
run(B,["console","lap",CON]);
for(const c of ["en","conf t","int g0/0","ip add 10.1.1.1 255.255.255.0","no shut","int g0/1","ip add 10.2.2.1 255.255.255.0","no shut","end"]) run(B,["term",c]);
const pr=out(B,["pc","p1","ping 10.2.2.10"]); ok(/Reply from 10.2.2.10.*TTL=127/.test(pr),"routed ping works with TTL 127");
ok(/C\s+10.1.1.0\/24/.test(out(B,["term","show ip route"])),"show ip route has connected route");
ok(/10.1.1.10/.test(out(B,["term","show arp"])),"router ARP table learned P1");
ok(/!!!!!|\.!!!!/.test(out(B,["term","ping 10.2.2.10"])),"router pings host");
ok(/S1\s+Gig?0\/0|S1\s+Gi0\/0/.test(out(B,["term","show cdp neighbors"])),"router sees S1 in CDP");
B.devs.p2.gw=null; ok(/timed out/.test(out(B,["pc","p1","ping 10.2.2.10"])),"no return path when far host lacks gateway");
// 5 SSH into a switch via SVI
B=Bench.create({devices:[{id:"sw",kind:"switch",label:"SW1"},{id:"pc",kind:"pc",label:"ADMIN",ip:"192.168.1.10",mask:"255.255.255.0",gw:"192.168.1.1"},{id:"lap",kind:"laptop",label:"L"}],
 cables:[{type:"cat6",a:"pc:eth",b:"sw:g1"},{type:"console",a:"lap:usb",b:"sw:con"}]});
run(B,["console","lap",CON]);
ok(/refused|timed out/.test(out(B,["pc","pc","ssh -l admin 192.168.1.2"])),"ssh fails before config");
for(const c of ["en","conf t","hostname SW1","ip domain-name lab.local","crypto key generate rsa"]) run(B,["term",c]);
ok(/Generating 2048/.test(out(B,["term",""])),"RSA prompt accepts Enter for 2048");
for(const c of ["ip ssh version 2","username admin secret Str0ng!","line vty 0 15","login local","transport input ssh","exit","int vlan 1","ip add 192.168.1.2 255.255.255.0","no shut","end"]) run(B,["term",c]);
ok(/up\s+up/.test(out(B,["term","show ip int br"]).split("\n").find(l=>/^Vlan1/.test(l))||""),"Vlan1 up/up");
ok(/Reply/.test(out(B,["pc","pc","ping 192.168.1.2"])),"PC pings switch SVI");
ok(/password/.test(out(B,["pc","pc","ssh -l admin 192.168.1.2"])),"ssh asks for password");
out(B,["pc","pc","Str0ng!"]); ok(Bench.remoteTo(B,"pc")==="192.168.1.2" && B.devs.sw.env.mode==="user","ssh login lands at user EXEC");
ok(/SW1>/.test(B.devs.sw.env.prompt()),"remote prompt is SW1>");
ok(/Connection to 192.168.1.2 closed/.test(out(B,["pc","pc","exit"])) && !Bench.remoteTo(B,"pc"),"exit closes ssh session");
out(B,["pc","pc","ssh -l admin 192.168.1.2"]); ok(/Permission denied/.test(out(B,["pc","pc","wrong"])),"wrong ssh password denied");
run(B,["term",""]); run(B,["term","en"]);
const rc=out(B,["term","show run"]); ok(/username admin secret 9 \$9\$/.test(rc)&&/transport input ssh/.test(rc)&&/login local/.test(rc)&&/ip domain name lab.local/.test(rc),"running-config reflects SSH setup");
// 6 duplex mismatch
for(const c of ["conf t","int g0/1","speed 100","duplex full","end"]) run(B,["term",c]);
ok(Bench.mismatch(B,"pc:eth","sw:g1"),"duplex mismatch detected (PC auto vs switch fixed)");
ok(/2871 CRC/.test(out(B,["term","show interfaces g0/1"])),"show interfaces shows CRC errors on the full-duplex side");
// 7 reload without saving loses config
run(B,["term","reload"]); run(B,["term","no"]); const rr=out(B,["term",""]);
ok(/restarting/.test(rr) && B.devs.sw.env.host==="SW1" && !B.devs.sw.env.users.admin && B.devs.sw.env.intfs["GigabitEthernet0/1"].speed==="auto","reload without saving loses the unsaved changes (back to the saved startup-config)");
const F=SIM.ios2Env({kind:"switch"}); F.exec("en"); F.exec("conf t"); F.exec("hostname X1"); F.exec("end"); F.exec("reload"); F.exec("no"); const fr=F.exec("");
ok(/System Configuration Dialog/.test(fr.text) && F.host==="Switch","fresh device with nothing saved reloads to the factory dialog");
// 8 enable secret prompt and mode behaviour
const E=SIM.ios2Env({kind:"router"}); for(const c of ["en","conf t","enable secret cisco123","end","disable"]) E.exec(c);
const p1=E.exec("enable"); ok(p1&&p1.ask==="Password: " && E.noEcho,"enable asks for password with no echo");
E.exec("wrong"); E.exec("cisco123"); ok(E.mode==="priv","right password reaches priv after a wrong one");
E.exec("conf t"); E.exec("int g0/0"); ok(E.prompt()==="Router(config-if)#","prompt shows config-if");
E.exec("hostname R9"); ok(E.host==="R9" && E.mode==="config","global command from config-if drops to global and runs");
E.exec("line con 0"); E.exec("password c0n"); E.exec("login"); E.exec("end");
const g=E.connect("con"); ok(g.ask==="Password: ","console login asks for the line password");
E.exec("c0n"); ok(E.mode==="user" && !E.pending,"console password accepted");
console.log(fails?`\n${fails} FAILED`:"\nALL PASSED");
process.exit(fails?1:0);
