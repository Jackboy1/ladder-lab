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
ok(/Request timed out\./.test(out(B,["pc","pc1","ping 10.0.0.2"])),"different VLANs can't talk at L2 (ARP was cached → Request timed out.)");
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
ok(/^\(admin@192\.168\.1\.2\) Password: $/.test(out(B,["pc","pc","ssh -l admin 192.168.1.2"])),"ssh asks for the password (keyboard-interactive prompt)");
out(B,["pc","pc","Str0ng!"]); ok(Bench.remoteTo(B,"pc")==="192.168.1.2" && Bench.sessionMode(B,"pc")==="user","ssh login lands at user EXEC");
ok(Bench.sessionPrompt(B,"pc")==="SW1>","remote prompt is SW1>");
ok(/Connection to 192.168.1.2 closed/.test(out(B,["pc","pc","exit"])) && !Bench.remoteTo(B,"pc"),"exit closes ssh session");
out(B,["pc","pc","ssh -l admin 192.168.1.2"]); ok(/^\(admin@192\.168\.1\.2\) Password: $/.test(out(B,["pc","pc","wrong"])),"wrong ssh password asks again");
out(B,["pc","pc","wrong2"]); ok(/admin@192\.168\.1\.2: Permission denied \(publickey,keyboard-interactive,password\)\./.test(out(B,["pc","pc","wrong3"])) && !Bench.remoteTo(B,"pc"),"third wrong ssh password closes the attempt");
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
// 9 proxy ARP: a switch with no default gateway reaches a remote PC only while the router proxy-ARPs
B=Bench.create({devices:[{id:"r",kind:"router",label:"R1",config:e=>{for(const c of ["en","conf t","int g0/0","ip add 10.1.1.1 255.255.255.0","no shut","int g0/1","ip add 10.9.9.1 255.255.255.0","no shut","end"])e.exec(c)}},
 {id:"s",kind:"switch",label:"S1",config:e=>{for(const c of ["en","conf t","int vlan 1","ip add 10.1.1.2 255.255.255.0","no shut","end"])e.exec(c)}},
 {id:"noc",kind:"pc",label:"NOC",ip:"10.9.9.50",mask:"255.255.255.0",gw:"10.9.9.1"}],
 cables:[{type:"cat6",a:"s:g8",b:"r:g0"},{type:"cat6",a:"noc:eth",b:"r:g1"}]});
ok(/Reply from 10.1.1.2/.test(out(B,["pc","noc","ping 10.1.1.2"])) && Bench.proxied(B),"proxy ARP (IOS default) hides the switch's missing default gateway");
for (const c of ["conf t","int g0/0","no ip proxy-arp","end"]) B.devs.r.env.exec(c); for (const k of Object.keys(B.arp)) B.arp[k]={};
ok(/timed out/.test(out(B,["pc","noc","ping 10.1.1.2"])),"with no ip proxy-arp the missing gateway breaks remote management");
ok(/no ip proxy-arp/.test(B.devs.r.env.exec("show run | section GigabitEthernet0/0")),"running-config shows no ip proxy-arp");
// 9b addressing realism: Bad mask, overlap, /31 warning, default route, classful route headings
{ const R = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","int g0/0"]) R.exec(c);
  ok(/Bad mask \/22 for address 10\.20\.36\.0/.test(R.exec("ip add 10.20.36.0 255.255.252.0")),"IOS refuses a network address as an interface address");
  R.exec("ip add 10.20.36.1 255.255.252.0"); R.exec("no shut"); R.exec("int g0/1");
  ok(/10\.20\.38\.0 overlaps with GigabitEthernet0\/0/.test(R.exec("ip add 10.20.38.5 255.255.255.0")),"overlap detected using the shorter mask");
  ok(/use \/31 mask/.test(R.exec("ip add 10.9.9.0 255.255.255.254")),"/31 accepted with a warning"); R.exec("no shut"); R.exec("exit");
  ok(R.exec("ip route 0.0.0.0 0.0.0.0 10.9.9.1")==="","default route accepted");
  ok(/Inconsistent/.test(R.exec("ip route 10.1.1.5 255.255.255.0 10.9.9.1")),"static route with host bits set is rejected"); R.exec("end");
  const rt = R.exec("show ip route"); ok(/10\.0\.0\.0\/8 is variably subnetted, 4 subnets, 3 masks/.test(rt) && /Gateway of last resort is 10\.9\.9\.1/.test(rt) && rt.indexOf("10.9.9.0/31") < rt.indexOf("10.20.36.0/22"),"show ip route has classful headings, sorted entries and the gateway of last resort"); }
// 9c unreachables and host addressing rules
{ const B2 = Bench.create({devices:[{id:"r",kind:"router",label:"R1",config:e=>{for(const c of ["en","conf t","int g0/0","ip add 10.1.1.1 255.255.255.0","no shut","no ip proxy-arp","int g0/1","ip add 10.2.2.1 255.255.255.0","end"])e.exec(c)}},
    {id:"p",kind:"pc",label:"P",ip:"10.1.1.5",mask:"255.255.255.0",gw:"10.1.1.1"},{id:"q",kind:"pc",label:"Q",ip:"10.2.2.5",mask:"255.255.255.0",gw:"10.2.2.1"}],
    cables:[{type:"cat6",a:"p:eth",b:"r:g0"},{type:"cat6",a:"q:eth",b:"r:g1"}]});
  ok(/Reply from 10\.1\.1\.1: Destination host unreachable\./.test(out(B2,["pc","p","ping 10.2.2.5"])),"router with no route (egress interface shut) answers Destination host unreachable (ICMP 3/1, like real Cisco)");
  ok(Bench.act(B2,["ip","q","10.2.2.255","255.255.255.0","10.2.2.1"]).ok===false && Bench.act(B2,["ip","q","10.2.2.0","255.255.255.0","10.2.2.1"]).ok===false,"Windows refuses the subnet's network or broadcast address");
  ok(/Internet address is 10\.1\.1\.1\/24/.test(B2.devs.r.env.exec("show ip interface g0/0")) && /Proxy ARP is disabled/.test(B2.devs.r.env.exec("show ip interface g0/0")),"show ip interface shows the address and proxy ARP state"); }
// 11 Layer 2: VLANs, DTP trunks, native VLAN, allowed lists, ROAS, L3 switch, STP, storms, BPDU guard, EtherChannel
{ const cfgSw = (cmds) => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
  const two = (c1, c2, extra) => Bench.create({devices:[
      {id:"s1",kind:"switch",label:"SW1",config:cfgSw(["vlan 10","int g0/1","switchport mode access","switchport access vlan 10",...c1])},
      {id:"s2",kind:"switch",label:"SW2",config:cfgSw(["vlan 10","int g0/1","switchport mode access","switchport access vlan 10",...c2])},
      {id:"a",kind:"pc",label:"A",ip:"10.10.0.1",mask:"255.255.255.0"},{id:"b",kind:"pc",label:"B",ip:"10.10.0.2",mask:"255.255.255.0"}].concat(extra||[]),
    cables:[{type:"cat6",a:"a:eth",b:"s1:g1"},{type:"cat6",a:"b:eth",b:"s2:g1"},{type:"cat6",a:"s1:g8",b:"s2:g8"}]});
  let L = two([],[]);
  ok(!Bench.trunking(L,"s1","g8") && /timed out|unreachable/.test(out(L,["pc","a","ping 10.10.0.2"])),"DTP: auto + auto stays access, so VLAN 10 can't cross the uplink");
  L = two(["int g0/8","switchport mode trunk"],[]);
  ok(Bench.trunking(L,"s1","g8") && Bench.trunking(L,"s2","g8") && /Reply from 10\.10\.0\.2/.test(out(L,["pc","a","ping 10.10.0.2"])),"DTP: trunk + auto negotiates a trunk; VLAN 10 crosses tagged");
  ok(L.log.some(l=>/802\.1Q tag for VLAN 10/.test(l)),"frame log explains the 802.1Q tag on the trunk");
  ok(/Gi0\/8\s+auto\s+802\.1q\s+trunking\s+1/.test(L.devs.s2.env.exec("show interfaces trunk")) && /Operational Mode: trunk/.test(L.devs.s2.env.exec("show interfaces g0/8 switchport")),"show interfaces trunk / switchport show the negotiated trunk");
  L = two(["int g0/8","switchport mode trunk","switchport nonegotiate"],[]);
  ok(!Bench.trunking(L,"s2","g8"),"nonegotiate: the auto side never hears DTP and stays access");
  L = two(["int g0/8","switchport mode trunk","switchport trunk allowed vlan 1,20"],["int g0/8","switchport mode trunk"]);
  ok(/timed out|unreachable/.test(out(L,["pc","a","ping 10.10.0.2"])),"VLAN pruned from the allowed list can't cross the trunk");
  L = two(["vlan 99","int g0/8","switchport mode trunk","switchport trunk native vlan 99"],["vlan 99","int g0/8","switchport mode trunk"]);
  out(L,["pc","a","ping 10.10.0.2"]); ok(Bench.logged(L,"s1",/NATIVE_VLAN_MISMATCH/),"native VLAN mismatch is logged by CDP");
  { const st = L.devs.s1.env.exec("show spanning-tree vlan 99"), st1 = L.devs.s2.env.exec("show spanning-tree vlan 1");
    ok(/BKN\*.*P2p \*PVID_Inc/.test(st) && /BKN\*.*P2p \*PVID_Inc/.test(st1) && Bench.logged(L,"s1",/BLOCK_PVID_LOCAL: Blocking GigabitEthernet0\/8 on VLAN0099/) && Bench.logged(L,"s1",/BLOCK_PVID_PEER: Blocking GigabitEthernet0\/8 on VLAN0001/),
      "native VLAN mismatch: PVST+ blocks both native VLANs on the trunk (PVID_Inc) and logs BLOCK_PVID_LOCAL/PEER");
    ok(/Reply from 10\.10\.0\.2/.test(out(L,["pc","a","ping 10.10.0.2"])), "a VLAN that isn't either native keeps working across the mismatched trunk");
    for (const c of ["conf t","int g0/8","switchport trunk native vlan 99","end"]) Bench.act(L,["cli","s2",c]);
    ok(Bench.logged(L,"s1",/UNBLOCK_CONSIST_PORT: Unblocking GigabitEthernet0\/8 on VLAN0099\. Port consistency restored/) && !/PVID_Inc/.test(L.devs.s1.env.exec("show spanning-tree vlan 99")), "fixing the native VLAN unblocks the port and logs UNBLOCK_CONSIST_PORT"); }
  // router-on-a-stick
  const roas = (swUplink) => Bench.create({devices:[
      {id:"r",kind:"router",label:"R1",config:cfgSw(["int g0/0","no shut","int g0/0.10","encapsulation dot1Q 10","ip add 10.10.0.1 255.255.255.0","int g0/0.20","encapsulation dot1Q 20","ip add 10.20.0.1 255.255.255.0"])},
      {id:"s",kind:"switch",label:"SW1",config:cfgSw(["vlan 10","vlan 20","int g0/1","switchport mode access","switchport access vlan 10","int g0/2","switchport mode access","switchport access vlan 20",...swUplink])},
      {id:"a",kind:"pc",label:"A",ip:"10.10.0.5",mask:"255.255.255.0",gw:"10.10.0.1"},{id:"b",kind:"pc",label:"B",ip:"10.20.0.5",mask:"255.255.255.0",gw:"10.20.0.1"}],
    cables:[{type:"cat6",a:"a:eth",b:"s:g1"},{type:"cat6",a:"b:eth",b:"s:g2"},{type:"cat6",a:"s:g8",b:"r:g0"}]});
  L = roas([]); ok(/timed out|unreachable/.test(out(L,["pc","a","ping 10.20.0.5"])),"ROAS: the switch port to the router stays access (routers don't speak DTP) — no inter-VLAN routing");
  L = roas(["int g0/8","switchport mode trunk"]); ok(/Reply from 10\.20\.0\.5.*TTL=127/.test(out(L,["pc","a","ping 10.20.0.5"])),"ROAS: trunk to the router + dot1Q subinterfaces route between VLANs");
  ok(/Encapsulation 802\.1Q Virtual LAN, Vlan ID  10\./.test(L.devs.r.env.exec("show interfaces g0/0.10")) && /Virtual LAN ID:  20 \(IEEE 802\.1Q Encapsulation\)/.test(L.devs.r.env.exec("show vlans")), "router: show interfaces on a subinterface and show vlans");
  ok(/Reply from 10\.10\.0\.5.*TTL=255/.test(out(L,["cli","r","ping 10.10.0.5"])) || /!!!!!/.test(L.devs.r.env.exec("ping 10.10.0.5")), "router ping works across ROAS");
  { const rows = L.devs.s.env.exec("show mac address-table").split("\n").filter(l=>/Gi0\/8/.test(l));
    ok(rows.some(l=>/^ *10 /.test(l)) && rows.some(l=>/^ *20 /.test(l)), "ROAS: the router's MAC is learned in VLAN 10 AND VLAN 20 on the trunk (MAC table keyed by VLAN)"); }
  ok(/% Configuring IP routing on a LAN subinterface/.test((()=>{ const R = SIM.ios2Env({kind:"router"}); ["en","conf t","int g0/0.30"].forEach(c=>R.exec(c)); return R.exec("ip add 10.30.0.1 255.255.255.0"); })()),"IP on a subinterface without encapsulation is refused like real IOS");
  // Layer 3 switch
  L = Bench.create({devices:[{id:"s",kind:"switch",label:"L3SW",config:cfgSw(["ip routing","vlan 10","vlan 20","int g0/1","switchport mode access","switchport access vlan 10","int g0/2","switchport mode access","switchport access vlan 20","int vlan 10","ip add 10.10.0.1 255.255.255.0","no shut","int vlan 20","ip add 10.20.0.1 255.255.255.0","no shut"])},
      {id:"a",kind:"pc",label:"A",ip:"10.10.0.5",mask:"255.255.255.0",gw:"10.10.0.1"},{id:"b",kind:"pc",label:"B",ip:"10.20.0.5",mask:"255.255.255.0",gw:"10.20.0.1"}],
    cables:[{type:"cat6",a:"a:eth",b:"s:g1"},{type:"cat6",a:"b:eth",b:"s:g2"}]});
  ok(/Reply from 10\.20\.0\.5/.test(out(L,["pc","a","ping 10.20.0.5"])),"Layer 3 switch with ip routing routes between SVIs");
  // STP triangle
  const tri = (extra) => Bench.create({devices:[
      {id:"s1",kind:"switch",label:"SW1",config:cfgSw(extra.s1||[])},{id:"s2",kind:"switch",label:"SW2",config:cfgSw(extra.s2||[])},{id:"s3",kind:"switch",label:"SW3",config:cfgSw(extra.s3||[])},
      {id:"a",kind:"pc",label:"A",ip:"10.0.0.1",mask:"255.255.255.0"},{id:"b",kind:"pc",label:"B",ip:"10.0.0.2",mask:"255.255.255.0"}],
    cables:[{type:"cat6",a:"s1:g7",b:"s2:g7"},{type:"cat6",a:"s2:g8",b:"s3:g8"},{type:"cat6",a:"s3:g6",b:"s1:g6"},{type:"cat6",a:"a:eth",b:"s2:g1"},{type:"cat6",a:"b:eth",b:"s3:g1"}]});
  L = tri({s1:["spanning-tree vlan 1 priority 4096"]});
  const blocked = ["s1","s2","s3"].flatMap(sw=>["g6","g7","g8"].map(p=>Bench.stpRole(L,sw,p,1))).filter(r=>r==="Altn BLK").length;
  ok(Bench.stpRoot(L,1)==="s1" && blocked===1,"STP: lowest priority wins root and exactly one port blocks in a triangle");
  ok(/This bridge is the root/.test(L.devs.s1.env.exec("show spanning-tree vlan 1")) && /Altn BLK/.test(L.devs.s2.env.exec("show spanning-tree")+L.devs.s3.env.exec("show spanning-tree")),"show spanning-tree shows the root and the alternate (blocking) port");
  ok(/Reply from 10\.0\.0\.2/.test(out(L,["pc","a","ping 10.0.0.2"])) && !Bench.stormed(L),"traffic flows over the loop-free tree, no storm");
  L = tri({s1:["no spanning-tree vlan 1"],s2:["no spanning-tree vlan 1"],s3:["no spanning-tree vlan 1"]});
  ok(/timed out|unreachable/.test(out(L,["pc","a","ping 10.0.0.2"])) && Bench.stormed(L) && Bench.logged(L,"s1",/MACFLAP/),"with STP off a triangle melts down: broadcast storm, MAC flapping, nothing works");
  // BPDU guard
  L = tri({s1:["spanning-tree vlan 1 priority 4096"],s2:["int g0/7","spanning-tree portfast","spanning-tree bpduguard enable"]});
  out(L,["pc","a","ping 10.0.0.2"]);
  ok(Bench.errdis(L,"s2","g7")==="bpduguard" && /err-disabled/.test(L.devs.s2.env.exec("show interfaces status")) && Bench.logged(L,"s2",/BLOCK_BPDUGUARD/),"BPDU guard err-disables a portfast port that hears another switch");
  for (const c of ["conf t","int g0/7","no spanning-tree bpduguard","no spanning-tree portfast","shutdown","no shutdown","end"]) L.devs.s2.env.exec(c);
  ok(!Bench.errdis(L,"s2","g7"),"shutdown / no shutdown recovers the err-disabled port once the guard is removed");
  // EtherChannel
  const ec = (m1, m2) => Bench.create({devices:[
      {id:"s1",kind:"switch",label:"SW1",config:cfgSw(["spanning-tree vlan 1 priority 4096","int range g0/7 - 8","switchport mode trunk",`channel-group 1 mode ${m1}`])},
      {id:"s2",kind:"switch",label:"SW2",config:cfgSw(["int range g0/7 - 8","switchport mode trunk",`channel-group 1 mode ${m2}`])}],
    cables:[{type:"cat6",a:"s1:g7",b:"s2:g7"},{type:"cat6",a:"s1:g8",b:"s2:g8"}]});
  L = ec("active","passive");
  ok(Bench.bundled(L,"s1",1) && /Po1\(SU\)\s+LACP\s+Gi0\/7\(P\)\s+Gi0\/8\(P\)/.test(L.devs.s1.env.exec("show etherchannel summary")) && !/Altn/.test(L.devs.s2.env.exec("show spanning-tree")),"LACP active + passive bundles both links into Po1, which STP treats as one link");
  L = ec("passive","passive"); ok(!Bench.bundled(L,"s1",1) && /Altn BLK/.test(L.devs.s2.env.exec("show spanning-tree")),"passive + passive never bundles: two separate links, STP blocks one");
  L = ec("active","active"); for (const c of ["conf t","int g0/8","switchport trunk allowed vlan 10","end"]) L.devs.s1.env.exec(c);
  ok(/Po1\(SU\)\s+LACP\s+Gi0\/7\(P\)\s+Gi0\/8\(s\)/.test(L.devs.s1.env.exec("show etherchannel summary")),"a member configured differently from its Port-channel is suspended on its own; the bundle stays up");
  ok(!/Invalid/.test(L.devs.s1.env.exec("conf t")+L.devs.s1.env.exec("interface port-channel 1")) && /config-if/.test(L.devs.s1.env.prompt()),"interface port-channel 1 (long hyphenated name) is accepted");
  L.devs.s1.env.exec("end"); L.devs.s1.env.exec("conf t"); L.devs.s1.env.exec("port-channel load-balance src-dst-ip"); L.devs.s1.env.exec("end");
  ok(/src-dst-ip/.test(L.devs.s1.env.exec("show etherchannel load-balance")) && /port-channel load-balance src-dst-ip/.test(L.devs.s1.env.exec("show run")),"port-channel load-balance is configurable and shown");
}
// 11a trunk allowed list, MAC table per VLAN, STP change flushes MACs, L2 switch routing table
{ const e = SIM.ios2Env({kind:"switch"}); for (const c of ["en","conf t","int g0/1","switchport mode trunk","switchport trunk allowed vlan add 30","end"]) e.exec(c);
  ok(e.intfs["GigabitEthernet0/1"].allowed==null, "allowed vlan add on an all-VLANs trunk keeps all VLANs (like IOS)");
  e.exec("conf t"); e.exec("int g0/1"); e.exec("switchport trunk allowed vlan none"); ok(Array.isArray(e.intfs["GigabitEthernet0/1"].allowed) && !e.intfs["GigabitEthernet0/1"].allowed.length, "allowed vlan none"); e.exec("end");
  ok(/Default gateway is not set/.test(e.exec("show ip route")), "a Layer 2 switch (no ip routing) shows the default-gateway view, not a routing table"); }
// 11b VLAN lists and the extended range
{ const e = SIM.ios2Env({kind:"switch"}); for (const c of ["en","conf t","vlan 10,20,30-32","name STAFF","exit"]) e.exec(c);
  ok([10,20,30,31,32].every(v=>e.vlans[v]==="STAFF"), "vlan 10,20,30-32 creates all five and name applies to the list");
  ok(/not allowed in current VTP mode/.test(e.exec("vlan 2000")) && !e.vlans[2000], "extended VLAN refused in VTP server mode");
  e.exec("vtp mode transparent"); e.exec("vlan 2000"); e.exec("end");
  ok(!!e.vlans[2000] && /2000 +VLAN2000 +active/.test(e.exec("show vlan brief")) && /^vlan 2000$/m.test(e.exec("show run")), "extended VLAN in transparent mode is active and in running-config");
  e.exec("conf t"); ok(/out of the range/.test(e.exec("vlan 4095")), "vlan 4095 rejected"); e.exec("no vlan 30-32"); ok(!e.vlans[31], "no vlan with a range deletes them"); }

// 11c a topology saved by an older version (missing settings added since) still loads
{ const e = SIM.ios2Env({kind:"switch"}); e.exec("en"); e.exec("conf t"); e.exec("hostname OLD-SW"); e.exec("end");
  const snap = e.exportConfig(); delete snap.lbMethod; delete snap.vtpDomain;
  const e2 = SIM.ios2Env({kind:"switch"}); let threw = null; try { e2.importConfig(snap); } catch(x){ threw = x.message; }
  ok(!threw && e2.host==="OLD-SW" && /src-mac/.test((e2.exec("en"), e2.exec("show etherchannel load-balance"))), "an older saved config (missing newer settings) imports with factory defaults"); }

// 12 topology builder templates: every starter network works, and survives export → import
if (ctx.LLTOPO){ const T = ctx.LLTOPO.TEMPLATES;
  const tests = {soho:[["pc1","192.168.1.12"],["pc1","8.8.8.8"]], campus2:[["pc1","10.10.20.51"],["pc2","10.10.10.11"]], campus3:[["pc1","10.2.10.11"],["pc2","10.100.0.10"]], wan:[["hqpc","10.20.0.11"],["brpc","8.8.8.8"]], spineleaf:[["srv1","10.1.2.10"],["srv3","10.1.1.10"]]};
  for (const [k,list] of Object.entries(tests)){ const B1 = Bench.create(T[k]); const B2 = Bench.create(JSON.parse(JSON.stringify(Bench.exportTopology(B1))));
    ok(list.every(([pc,ip])=>/Reply from [\d.]+: bytes/.test(out(B1,["pc",pc,"ping "+ip]))) && /Reply from [\d.]+: bytes/.test(out(B2,["pc",list[0][0],"ping "+list[0][1]])), `template "${T[k].name}" works and survives save/reload`); } }
// 10 drills: thousands of generated answers checked against an independent BigInt calculation
{ const D = ctx.DRILL; D._seed(12345);
  const bi = s => s.split(".").reduce((a,o)=>a*256n+BigInt(o),0n), bs = n => [24n,16n,8n,0n].map(k=>String((n>>k)&255n)).join(".");
  const maskBI = p => p===0 ? 0n : ((1n<<32n)-1n) ^ ((1n<<BigInt(32-p))-1n);
  let bad = 0, n = 0;
  for (const t of D.types) for (let i=0;i<400;i++){ const q = D.GEN[t](); n++;
    const A = q.fields.map(f=>f.a); let okq = true;
    if (t==="subnet"){ const ip = bi(q.ip), m = maskBI(q.p), net = ip & m, bc = net | (((1n<<32n)-1n) ^ m);
      okq = A[0]===bs(net) && A[1]===bs(bc) && A[2]===bs(net+1n) && A[3]===bs(bc-1n) && A[4]===String((1n<<BigInt(32-q.p))-2n); }
    if (t==="dec2bin"){ const d = +q.q.match(/Convert (\d+)/)[1]; okq = parseInt(A[0],2)===d && A[0].length===8; }
    if (t==="bin2dec"){ const b = q.q.match(/Convert ([01 ]+) to/)[1].replace(/ /g,""); okq = parseInt(b,2)===+A[0]; }
    if (t==="dec2hex"){ const d = +q.q.match(/Convert (\d+)/)[1]; okq = parseInt(A[0],16)===d; }
    if (t==="hex2dec"){ const h = q.q.match(/0x([0-9A-F]+)/)[1]; okq = parseInt(h,16)===+A[0]; }
    if (t==="bin2hex"){ const b = q.q.match(/Convert ([01 ]+) to/)[1].replace(/ /g,""); okq = parseInt(b,2)===parseInt(A[0],16); }
    if (t==="prefix2mask"){ const p = +q.q.match(/\/(\d+)/)[1]; okq = A[0]===bs(maskBI(p)); }
    if (t==="mask2prefix"){ const m = q.q.match(/mask ([\d.]+)/)[1]; okq = bs(maskBI(+A[0].slice(1)))===m; }
    if (t==="wildcard"){ const m = q.q.match(/mask ([\d.]+)/)[1]; okq = bs(((1n<<32n)-1n) ^ bi(m))===A[0]; }
    if (t==="hosts2prefix"){ const need = +q.q.match(/hold (\d+)/)[1], p = +A[0].slice(1), h = 32-p; okq = 2**h-2>=need && 2**(h-1)-2<need; }
    if (t==="subnets2prefix"){ const base = +q.q.match(/\/(\d+) into/)[1], need = +q.q.match(/at least (\d+)/)[1], p = +A[0].slice(1); okq = 2**(p-base)>=need && 2**(p-base-1)<need && +A[1]===2**(32-p)-2; }
    if (t==="samesub"){ const m = q.q.match(/^Are ([\d.]+) and ([\d.]+) .*\/(\d+)/), M = maskBI(+m[3]); okq = ((bi(m[1])&M)===(bi(m[2])&M)) === (A[0]==="yes"); }
    if (t==="nth"){ const m = q.q.match(/^([\d.]+)\/24 is divided into \/(\d+) subnets.*subnet (\d+),/), size = 1n<<BigInt(32-+m[2]), net = bi(m[1]) + BigInt(+m[3]-1)*size; okq = A[0]===bs(net) && A[1]===bs(net+size-1n); }
    if (!D.grade(q, A).every(Boolean)) okq = false;                       // the stated answer must be accepted
    if (q.fields.length && D.grade(q, ["999.1.2.3","x","x","x","x"]).every(Boolean)) okq = false;   // nonsense must be rejected
    if (!okq){ bad++; if (bad<5) console.log("  bad drill:", t, q.q, A); }
  }
  ok(bad===0, `${n} generated drill questions all correct and graded properly`);
  D._seed(null);
}
console.log(fails?`\n${fails} FAILED`:"\nALL PASSED");
process.exit(fails?1:0);
