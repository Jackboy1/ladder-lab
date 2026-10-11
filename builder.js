// Ladder Lab — topology builder: a sandbox on the bench engine. Starter templates for real network designs,
// drag-and-cable editing, direct CLI, and save / load / export / import of your own topologies (saved in this browser).
(function(){
const cfgOf = cmds => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
const L3 = "Catalyst 9300 · Layer 3", L2 = "Catalyst 9200 · Layer 2";
const trunk = (ports, extra) => [`int range ${ports}`, "switchport mode trunk", ...(extra||[]), "exit"];
const access = (port, vlan) => [`int ${port}`, "switchport mode access", `switchport access vlan ${vlan}`, "spanning-tree portfast", "exit"];
const ISP = (x, y) => ({id:"isp", kind:"router", label:"ISP", model:"Internet / ISP edge", x, y, config: e => { for (const c of ["en","conf t","hostname ISP","int g0/0","ip address 203.0.113.1 255.255.255.252","no shutdown","int lo0","ip address 8.8.8.8 255.255.255.255",
  "ip route 10.0.0.0 255.0.0.0 203.0.113.2","ip route 172.16.0.0 255.240.0.0 203.0.113.2","ip route 192.168.0.0 255.255.0.0 203.0.113.2","end"]) e.exec(c); }});

const TEMPLATES = {
  blank: { name:"Blank canvas", about:"Start from nothing: add devices from the palette, cable them and configure them.", devices:[], cables:[] },

  soho: { name:"Small office (SOHO)", about:"One router as the office edge, one switch, staff PCs, a printer, a laptop for the console, and the ISP. Try: ping 8.8.8.8 from a PC, then break and fix things.",
    devices:[
      ISP(560, 20),
      {id:"r1", kind:"router", label:"OFFICE-R1", model:"ISR router · office edge", x:300, y:20, config: cfgOf(["int g0/0","description LAN","ip address 192.168.1.1 255.255.255.0","no shutdown","int g0/1","description to ISP","ip address 203.0.113.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.1"])},
      {id:"sw1", kind:"switch", label:"OFFICE-SW1", model:L2, x:200, y:170, config: cfgOf(["int range g0/1 - 7","spanning-tree portfast","exit","int vlan 1","ip address 192.168.1.2 255.255.255.0","no shutdown","exit","ip default-gateway 192.168.1.1"])},
      {id:"pc1", kind:"pc", label:"PC1", x:40, y:330, ip:"192.168.1.11", mask:"255.255.255.0", gw:"192.168.1.1"},
      {id:"pc2", kind:"pc", label:"PC2", x:190, y:330, ip:"192.168.1.12", mask:"255.255.255.0", gw:"192.168.1.1"},
      {id:"prn1", kind:"printer", label:"PRN1", x:340, y:330, ip:"192.168.1.50", mask:"255.255.255.0", gw:"192.168.1.1"},
      {id:"lap", kind:"laptop", label:"LAPTOP", x:640, y:200},
    ],
    cables:[{type:"cat6",a:"isp:g0",b:"r1:g1"},{type:"cat6",a:"r1:g0",b:"sw1:g8"},{type:"cat6",a:"pc1:eth",b:"sw1:g1"},{type:"cat6",a:"pc2:eth",b:"sw1:g2"},{type:"cat6",a:"prn1:eth",b:"sw1:g3"},{type:"console",a:"lap:usb",b:"r1:con"}] },

  campus2: { name:"Two-tier campus (collapsed core)", about:"A Layer 3 core switch routes between VLAN 10 (staff) and VLAN 20 (voice/printers) and is the STP root; two access switches trunk up to it. Try: show spanning-tree, show interfaces trunk, ping across VLANs.",
    devices:[
      {id:"core", kind:"switch", label:"CORE1", model:L3, x:300, y:20, config: cfgOf(["ip routing","vlan 10","name STAFF","vlan 20","name PRINT","exit","spanning-tree vlan 1,10,20 priority 4096",
        ...trunk("g0/1 - 2"),"int vlan 10","ip address 10.10.10.1 255.255.255.0","no shutdown","int vlan 20","ip address 10.10.20.1 255.255.255.0","no shutdown"])},
      {id:"acc1", kind:"switch", label:"ACC1", model:L2, x:60, y:190, config: cfgOf(["vlan 10","name STAFF","vlan 20","name PRINT","exit",...trunk("g0/8"),...access("g0/1",10),...access("g0/2",20)])},
      {id:"acc2", kind:"switch", label:"ACC2", model:L2, x:520, y:190, config: cfgOf(["vlan 10","name STAFF","vlan 20","name PRINT","exit",...trunk("g0/8"),...access("g0/1",10),...access("g0/2",20)])},
      {id:"pc1", kind:"pc", label:"STAFF-1", x:40, y:350, ip:"10.10.10.11", mask:"255.255.255.0", gw:"10.10.10.1"},
      {id:"prn1", kind:"printer", label:"PRN-1", x:180, y:350, ip:"10.10.20.50", mask:"255.255.255.0", gw:"10.10.20.1"},
      {id:"pc2", kind:"pc", label:"STAFF-2", x:500, y:350, ip:"10.10.10.12", mask:"255.255.255.0", gw:"10.10.10.1"},
      {id:"prn2", kind:"printer", label:"PRN-2", x:640, y:350, ip:"10.10.20.51", mask:"255.255.255.0", gw:"10.10.20.1"},
    ],
    cables:[{type:"cat6",a:"core:g1",b:"acc1:g8"},{type:"cat6",a:"core:g2",b:"acc2:g8"},{type:"cat6",a:"pc1:eth",b:"acc1:g1"},{type:"cat6",a:"prn1:eth",b:"acc1:g2"},{type:"cat6",a:"pc2:eth",b:"acc2:g1"},{type:"cat6",a:"prn2:eth",b:"acc2:g2"}] },

  campus3: { name:"Three-tier campus", about:"Core, distribution and access layers. Each distribution switch is the gateway for its building's VLANs; routed links connect distribution to core; the core reaches the server farm. Static routes stand in for OSPF until Module 5.",
    devices:[
      {id:"core", kind:"switch", label:"CORE1", model:L3, x:330, y:10, config: cfgOf(["ip routing","int g0/1","no switchport","ip address 10.0.0.1 255.255.255.252","int g0/2","no switchport","ip address 10.0.0.5 255.255.255.252",
        "vlan 100","name SERVERS","exit",...access("g0/3",100),"int vlan 100","ip address 10.100.0.1 255.255.255.0","no shutdown","exit",
        "ip route 10.1.0.0 255.255.0.0 10.0.0.2","ip route 10.2.0.0 255.255.0.0 10.0.0.6"])},
      {id:"dist1", kind:"switch", label:"DIST1", model:L3, x:80, y:160, config: cfgOf(["ip routing","int g0/9","no switchport","ip address 10.0.0.2 255.255.255.252","vlan 10","name B1-STAFF","exit",...trunk("g0/1"),
        "spanning-tree vlan 1,10 priority 4096","int vlan 10","ip address 10.1.10.1 255.255.255.0","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.0.0.1"])},
      {id:"dist2", kind:"switch", label:"DIST2", model:L3, x:600, y:160, config: cfgOf(["ip routing","int g0/9","no switchport","ip address 10.0.0.6 255.255.255.252","vlan 10","name B2-STAFF","exit",...trunk("g0/1"),
        "spanning-tree vlan 1,10 priority 4096","int vlan 10","ip address 10.2.10.1 255.255.255.0","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.0.0.5"])},
      {id:"acc1", kind:"switch", label:"B1-ACC1", model:L2, x:80, y:330, config: cfgOf(["vlan 10","name B1-STAFF","exit",...trunk("g0/8"),...access("g0/1",10)])},
      {id:"acc2", kind:"switch", label:"B2-ACC1", model:L2, x:600, y:330, config: cfgOf(["vlan 10","name B2-STAFF","exit",...trunk("g0/8"),...access("g0/1",10)])},
      {id:"srv", kind:"server", label:"FILE-SRV", x:380, y:200, ip:"10.100.0.10", mask:"255.255.255.0", gw:"10.100.0.1"},
      {id:"pc1", kind:"pc", label:"B1-PC", x:110, y:480, ip:"10.1.10.11", mask:"255.255.255.0", gw:"10.1.10.1"},
      {id:"pc2", kind:"pc", label:"B2-PC", x:630, y:480, ip:"10.2.10.11", mask:"255.255.255.0", gw:"10.2.10.1"},
    ],
    cables:[{type:"cat6",a:"core:g1",b:"dist1:g9x"},{type:"cat6",a:"core:g2",b:"dist2:g9x"},{type:"cat6",a:"dist1:g1",b:"acc1:g8"},{type:"cat6",a:"dist2:g1",b:"acc2:g8"},{type:"cat6",a:"srv:eth",b:"core:g3"},{type:"cat6",a:"pc1:eth",b:"acc1:g1"},{type:"cat6",a:"pc2:eth",b:"acc2:g1"}] },

  wan: { name:"HQ + branch over a WAN", about:"Two sites joined by a /30 WAN link, each with its own LAN and router; HQ also connects to the ISP. Static routes make it work — Module 5 replaces them with OSPF.",
    devices:[
      ISP(330, 10),
      {id:"hq", kind:"router", label:"HQ-R1", model:"ISR router · HQ", x:120, y:150, config: cfgOf(["int g0/0","ip address 10.10.0.1 255.255.255.0","no shutdown","int g0/1","description WAN to branch","ip address 172.31.0.1 255.255.255.252","no shutdown","int g0/2","description to ISP","ip address 203.0.113.2 255.255.255.252","no shutdown","exit",
        "ip route 10.20.0.0 255.255.255.0 172.31.0.2","ip route 0.0.0.0 0.0.0.0 203.0.113.1"]), ports:[{id:"g0",type:"rj45",label:"G0/0",ios:"GigabitEthernet0/0"},{id:"g1",type:"rj45",label:"G0/1",ios:"GigabitEthernet0/1"},{id:"g2",type:"rj45",label:"G0/2",ios:"GigabitEthernet0/2"},{id:"con",type:"console",label:"CON"}]},
      {id:"br", kind:"router", label:"BR-R1", model:"ISR router · branch", x:560, y:150, config: cfgOf(["int g0/0","ip address 10.20.0.1 255.255.255.0","no shutdown","int g0/1","description WAN to HQ","ip address 172.31.0.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 172.31.0.1"])},
      {id:"hqsw", kind:"switch", label:"HQ-SW1", model:L2, x:60, y:300},
      {id:"brsw", kind:"switch", label:"BR-SW1", model:L2, x:470, y:300},
      {id:"hqpc", kind:"pc", label:"HQ-PC", x:90, y:450, ip:"10.10.0.11", mask:"255.255.255.0", gw:"10.10.0.1"},
      {id:"brpc", kind:"pc", label:"BR-PC", x:500, y:450, ip:"10.20.0.11", mask:"255.255.255.0", gw:"10.20.0.1"},
    ],
    cables:[{type:"cat6",a:"isp:g0",b:"hq:g2"},{type:"cat6",a:"hq:g1",b:"br:g1"},{type:"cat6",a:"hq:g0",b:"hqsw:g8"},{type:"cat6",a:"br:g0",b:"brsw:g8"},{type:"cat6",a:"hqpc:eth",b:"hqsw:g1"},{type:"cat6",a:"brpc:eth",b:"brsw:g1"}] },

  spineleaf: { name:"Data centre: spine-leaf", about:"Every leaf connects to every spine with routed links, so any server is the same number of hops from any other. Each leaf is the gateway for its rack's servers. Static routes shown here; real fabrics run BGP or OSPF with ECMP across all spines.",
    devices:[
      {id:"sp1", kind:"switch", label:"SPINE1", model:"Nexus-style spine · Layer 3", x:120, y:10, config: cfgOf(["ip routing","int g0/1","no switchport","ip address 10.255.1.0 255.255.255.254","int g0/2","no switchport","ip address 10.255.1.2 255.255.255.254","int g0/3","no switchport","ip address 10.255.1.4 255.255.255.254","exit",
        "ip route 10.1.1.0 255.255.255.0 10.255.1.1","ip route 10.1.2.0 255.255.255.0 10.255.1.3","ip route 10.1.3.0 255.255.255.0 10.255.1.5"])},
      {id:"sp2", kind:"switch", label:"SPINE2", model:"Nexus-style spine · Layer 3", x:560, y:10, config: cfgOf(["ip routing","int g0/1","no switchport","ip address 10.255.2.0 255.255.255.254","int g0/2","no switchport","ip address 10.255.2.2 255.255.255.254","int g0/3","no switchport","ip address 10.255.2.4 255.255.255.254","exit",
        "ip route 10.1.1.0 255.255.255.0 10.255.2.1","ip route 10.1.2.0 255.255.255.0 10.255.2.3","ip route 10.1.3.0 255.255.255.0 10.255.2.5"])},
      ...[1,2,3].map(n=>({id:"lf"+n, kind:"switch", label:"LEAF"+n, model:"Nexus-style leaf · Layer 3", x:20+(n-1)*300, y:200, config: cfgOf(["ip routing","int g0/9","no switchport",`ip address 10.255.1.${2*n-1} 255.255.255.254`,"int g0/10","no switchport",`ip address 10.255.2.${2*n-1} 255.255.255.254`,
        "vlan 100","name RACK","exit",...access("g0/1",100),"int vlan 100",`ip address 10.1.${n}.1 255.255.255.0`,"no shutdown","exit",`ip route 0.0.0.0 0.0.0.0 10.255.1.${2*n-2}`]), sfp:{g9:"sfp-sx", g10:"sfp-sx"}})),
      ...[1,2,3].map(n=>({id:"srv"+n, kind:"server", label:"RACK"+n+"-SRV", x:50+(n-1)*300, y:360, ip:`10.1.${n}.10`, mask:"255.255.255.0", gw:`10.1.${n}.1`})),
    ],
    cables:[ ...[1,2,3].flatMap(n=>[{type:"cat6",a:`sp1:g${n}`,b:`lf${n}:g9x`},{type:"cat6",a:`sp2:g${n}`,b:`lf${n}:g10x`},{type:"cat6",a:`srv${n}:eth`,b:`lf${n}:g1`}]) ] },
};
// copper uplink ports for templates that use "g9x"/"g10x": swap the leaf/dist SFP cages for RJ45 so Cat6 fits
for (const t of Object.values(TEMPLATES)) for (const d of t.devices){
  const needs = (t.cables||[]).some(c=>c.b===d.id+":g9x" || c.b===d.id+":g10x");
  if (needs && d.kind==="switch"){ d.ports = [...Array(8)].map((_,i)=>({id:"g"+(i+1), type:"rj45", label:String(i+1), ios:"GigabitEthernet0/"+(i+1)})).concat([{id:"g9x", type:"rj45", label:"9", ios:"GigabitEthernet0/9"},{id:"g10x", type:"rj45", label:"10", ios:"GigabitEthernet0/10"},{id:"con", type:"console", label:"CON"}]); delete d.sfp; }
}
window.LLTOPO = { TEMPLATES };
})();
