// Ladder Lab — WAN, virtualization and cloud drills (Module 10), added to window.DRILL: GRE MTU/MSS arithmetic, cloud service
// and deployment models, hypervisor types, VM vs container, MPLS router roles. tools/drills_wan_test.js checks every answer.
(function(){
const D = window.DRILL; if (!D) return;
let seedState = null;
const rnd = n => { if (seedState==null) return Math.floor(Math.random()*n); seedState = (seedState*1103515245 + 12345) % 2147483648; return seedState % n; };
const pick = a => a[rnd(a.length)];
const norm = s => String(s==null?"":s).trim().toLowerCase().replace(/[\s\-_]+/g,"");
const GEN = {
  // GRE adds a new 20-byte IPv4 header + a 4-byte GRE header = 24 bytes; TCP MSS = IP MTU − 20 (IP) − 20 (TCP)
  gremtu(){ const [mtu, why] = pick([[1500,"an Ethernet path"],[1492,"a PPPoE (DSL) link, which loses 8 bytes"],[1460,"a provider link with a 1460-byte MTU"],[1400,"a path the provider limits to 1400 bytes"],[9000,"a jumbo-frame data-centre link"]]);
    const tun = mtu - 24, mss = tun - 40;
    return { q:`A GRE tunnel runs over ${why} (IP MTU ${mtu}). What IP MTU is left inside the tunnel for the original packet, and what TCP MSS should hosts use so nothing fragments?`, mtu, tun, mss,
      fields:[{label:"Tunnel IP MTU (bytes)", a:String(tun), check:v=>norm(v)===String(tun)}, {label:"TCP MSS (bytes)", a:String(mss), check:v=>norm(v)===String(mss)}],
      why:`GRE wraps each packet in a new IPv4 header (20 bytes) plus a GRE header (4 bytes): ${mtu} − 24 = ${tun} bytes for the original packet — that's why IOS shows "MTU 1476" on a GRE tunnel over Ethernet. TCP's MSS is the payload after the inner IP header (20) and TCP header (20): ${tun} − 40 = ${mss}. (With IPsec on top, engineers usually go lower: ip mtu 1400 and ip tcp adjust-mss 1360.)` }; },
  cloudsvc(){ const S = [["A company rents virtual machines and installs and patches its own operating systems on them.","iaas"],["Staff use a hosted email and calendar service through a browser; the provider runs everything.","saas"],
      ["Developers upload their web application code and the provider runs the runtime, scaling and patching underneath.","paas"],["An engineer builds virtual networks, storage volumes and servers on demand in a provider's data centre.","iaas"],
      ["The accounts team uses an online accounting package — no servers, no installs.","saas"],["A team deploys functions and a managed database; the provider handles servers and the OS.","paas"],
      ["A school uses an online video-conferencing service.","saas"],["A firm runs its own firewall VM appliance inside a cloud provider's virtual network.","iaas"]];
    const [s, a] = pick(S), name = {iaas:"IaaS", paas:"PaaS", saas:"SaaS"};
    return { q:`Which cloud service model is this? "${s}"`, s, a, fields:[{label:"IaaS / PaaS / SaaS", a:name[a], check:v=>norm(v)===a}],
      why: a==="iaas" ? "IaaS (infrastructure as a service): the provider gives you compute, storage and network; you manage the operating system and everything above it." : a==="paas" ? "PaaS (platform as a service): the provider runs the servers, OS and runtime; you bring the application code and data." : "SaaS (software as a service): the provider runs the whole application; you just use it." }; },
  clouddeploy(){ const S = [["Infrastructure owned and used by one organisation only, in its own data centre or hosted for it alone.","private"],["Services open to any customer over the internet, on a provider's shared infrastructure.","public"],
      ["A company keeps payroll on its own servers but bursts its web shop into a public provider, with the two connected.","hybrid"],["Several hospitals share a cloud built for their common compliance needs.","community"],
      ["A bank runs a cloud platform in its own data centres for its own departments.","private"],["A start-up runs everything on a big provider's shared infrastructure.","public"]];
    const [s, a] = pick(S);
    return { q:`Which cloud deployment model is this (NIST definitions)? "${s}"`, s, a, fields:[{label:"public / private / hybrid / community", a, check:v=>norm(v)===a}],
      why: {private:"Private cloud: provisioned for exclusive use by one organisation (on or off its premises).", public:"Public cloud: open for use by the general public, on the provider's premises.", hybrid:"Hybrid cloud: two or more distinct clouds (private and public) bound together so data and applications can move between them.", community:"Community cloud: shared by a specific community of organisations with shared concerns (mission, security, compliance)."}[a] }; },
  hypervisor(){ const S = [["VMware ESXi","1"],["Microsoft Hyper-V","1"],["KVM (Linux kernel-based virtual machine)","1"],["Xen","1"],["Oracle VirtualBox on a Windows laptop","2"],["VMware Workstation","2"],["Parallels Desktop on a Mac","2"]];
    const [s, a] = pick(S);
    return { q:`Is ${s} a type 1 (bare-metal) or type 2 (hosted) hypervisor?`, s, a, fields:[{label:"1 / 2", a, check:v=>norm(v).replace(/^type/,"")===a}],
      why: a==="1" ? `${s} is type 1: it runs directly on the server hardware (bare metal) and the virtual machines run on top of it — the data-centre choice.` : `${s} is type 2: it runs as an application on top of a normal operating system, which then shares the hardware with the VMs — handy on a desktop, slower and less isolated.` }; },
  vmcontainer(){ const S = [["Each one carries its own full guest operating system and kernel.","vm"],["It shares the host's operating-system kernel and packages only the app and its libraries.","container"],
      ["It usually starts in well under a second.","container"],["It can run a different operating system from the host (e.g. Windows on a Linux hypervisor).","vm"],["Its image is typically tens to hundreds of megabytes.","container"],["A hypervisor creates and isolates it.","vm"]];
    const [s, a] = pick(S);
    return { q:`VM or container? "${s}"`, s, a, fields:[{label:"vm / container", a, check:v=>norm(v)===a || (a==="vm" && norm(v)==="virtualmachine")}],
      why: a==="vm" ? "A virtual machine is a whole computer in software: virtual hardware from a hypervisor and its own guest OS and kernel — strong isolation, heavier." : "A container shares the host's kernel and packages just the application and its dependencies — light, fast to start, but every container on a host uses the same kernel." }; },
  mplsrole(){ const S = [["the customer's own router at the branch, which peers with the provider and knows nothing about labels","ce"],["the provider router at the edge of the MPLS network, facing the customer — it adds and removes labels and keeps a VRF per customer","pe"],
      ["a provider core router that only swaps labels and never talks to customers","p"],["the router that receives the customer's routes and puts them in that customer's VRF","pe"],["the device on the customer's side of the access link","ce"]];
    const [s, a] = pick(S), name = {ce:"CE", pe:"PE", p:"P"};
    return { q:`In an MPLS Layer 3 VPN, which role is ${s}?`, s, a, fields:[{label:"CE / PE / P", a:name[a], check:v=>norm(v)===a}],
      why: a==="ce" ? "CE (customer edge): the customer's router. It routes normally (static, OSPF or BGP towards the PE) and never sees labels." : a==="pe" ? "PE (provider edge): faces customers, holds a VRF per customer VPN, and pushes/pops MPLS labels." : "P (provider): a core router that forwards on labels only (label swapping) and has no customer routes." }; },
};
const LABELS = { gremtu:"GRE — MTU and MSS", cloudsvc:"Cloud service model", clouddeploy:"Cloud deployment model", hypervisor:"Hypervisor type", vmcontainer:"VM or container", mplsrole:"MPLS router role" };
Object.assign(D.GEN, GEN); Object.assign(D.LABELS, LABELS); for (const k of Object.keys(GEN)) if (!D.types.includes(k)) D.types.push(k);
D._wanSeed = s => { seedState = s; };
})();
