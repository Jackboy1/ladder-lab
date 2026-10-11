// Ladder Lab — endless practice drills (window.DRILL): binary, hex, masks, wildcards, subnetting, VLSM sizing.
// Every generated question carries its answer and a step-by-step worked explanation; tools/engine_test.js
// cross-checks thousands of generated answers against an independent calculation.
(function(){
const R = n => Math.floor(Math.random()*n);
let seedState = null;   // deterministic mode for tests
const rnd = n => { if (seedState==null) return R(n); seedState = (seedState*1103515245 + 12345) % 2147483648; return seedState % n; };
const ipStr = n => [24,16,8,0].map(s=>(n>>>s)&255).join(".");
const ipNum = s => s.split(".").reduce((a,o)=>a*256+(+o),0);
const maskOf = p => p===0 ? 0 : (0xFFFFFFFF << (32-p))>>>0;
const pad8 = n => n.toString(2).padStart(8,"0");
const norm = s => String(s==null?"":s).trim().toLowerCase().replace(/\s+/g,"").replace(/^0x/,"").replace(/^\//,"");
const binNorm = s => norm(s).replace(/[^01]/g,"");

const GEN = {
  dec2bin(){ const n = rnd(256); const bits = pad8(n);
    const steps = [128,64,32,16,8,4,2,1].reduce((o,v)=>{ const take = o.left>=v; o.rows.push(`${v}: ${take?`yes → 1 (left ${o.left-v})`:"no → 0"}`); if (take) o.left-=v; return o; }, {left:n, rows:[]}).rows;
    return { q:`Convert ${n} to 8-bit binary.`, fields:[{label:"Binary", a:bits, check:v=>binNorm(v)===bits}], why:`Walk the place values 128 64 32 16 8 4 2 1, taking each one that still fits: ${steps.join(" · ")}. Result: ${bits.replace(/(....)/,"$1 ")}.` }; },
  bin2dec(){ const n = rnd(256); const bits = pad8(n); const parts = [128,64,32,16,8,4,2,1].filter((v,i)=>bits[i]==="1");
    return { q:`Convert ${bits.replace(/(....)/,"$1 ")} to decimal.`, fields:[{label:"Decimal", a:String(n)}], why:`Add the place values under each 1: ${parts.length?parts.join(" + "):"0"} = ${n}.` }; },
  dec2hex(){ const n = rnd(256); const h = n.toString(16).toUpperCase().padStart(2,"0");
    return { q:`Convert ${n} to hexadecimal (two digits).`, fields:[{label:"Hex", a:h, check:v=>norm(v).padStart(2,"0")===h.toLowerCase()}], why:`${n} ÷ 16 = ${Math.floor(n/16)} remainder ${n%16} → digits ${Math.floor(n/16).toString(16).toUpperCase()} and ${(n%16).toString(16).toUpperCase()} → ${h}. (A=10, B=11, C=12, D=13, E=14, F=15.)` }; },
  hex2dec(){ const n = rnd(256); const h = n.toString(16).toUpperCase().padStart(2,"0");
    return { q:`Convert 0x${h} to decimal.`, fields:[{label:"Decimal", a:String(n)}], why:`${h[0]} × 16 + ${h[1]} = ${parseInt(h[0],16)} × 16 + ${parseInt(h[1],16)} = ${n}.` }; },
  bin2hex(){ const n = rnd(256); const bits = pad8(n), h = n.toString(16).toUpperCase().padStart(2,"0");
    return { q:`Convert ${bits.slice(0,4)} ${bits.slice(4)} to hexadecimal.`, fields:[{label:"Hex", a:h, check:v=>norm(v).padStart(2,"0")===h.toLowerCase()}], why:`Each group of four bits is one hex digit: ${bits.slice(0,4)} = ${h[0]}, ${bits.slice(4)} = ${h[1]} → ${h}.` }; },
  prefix2mask(){ const p = 8 + rnd(23); const m = ipStr(maskOf(p));
    return { q:`Write /${p} as a dotted-decimal subnet mask.`, fields:[{label:"Mask", a:m, check:v=>v.trim()===m}], why:`/${p} = ${p} ones then ${32-p} zeros. Full octets of ones are 255; the partial octet has ${p%8} one-bits = ${[0,128,192,224,240,248,252,254][p%8]}. Mask: ${m}.` }; },
  mask2prefix(){ const p = 8 + rnd(23); const m = ipStr(maskOf(p));
    return { q:`What prefix length is the mask ${m}?`, fields:[{label:"Prefix (e.g. /26)", a:"/"+p, check:v=>norm(v)===String(p)}], why:`Count the one-bits: ${m.split(".").map(o=>`${o} = ${(+o).toString(2).replace(/0/g,"").length}`).join(", ")} → ${p} → /${p}.` }; },
  wildcard(){ const p = 8 + rnd(23); const m = ipStr(maskOf(p)); const w = m.split(".").map(o=>255-o).join(".");
    return { q:`What wildcard mask matches the subnet mask ${m} (/${p})?`, fields:[{label:"Wildcard", a:w, check:v=>v.trim()===w}], why:`Subtract each octet from 255: ${m.split(".").map(o=>`255 − ${o} = ${255-o}`).join(", ")} → ${w}. (Used in ACLs and OSPF network statements.)` }; },
  subnet(){ const p = 16 + rnd(15);
    const ipAddr = (p<=20 ? [10, rnd(256), rnd(256), rnd(256)] : p<24 ? [172, 16+rnd(16), rnd(256), rnd(256)] : [192, 168, rnd(256), rnd(256)]).join(".");
    const n = ipNum(ipAddr), M = maskOf(p), net = (n & M)>>>0, bc = (net | (~M>>>0))>>>0, size = 2**(32-p);
    const io = Math.floor(p/8) + 1;                         // the "interesting" octet: where the mask stops being 255
    const mo = (M >>> ((4-io)*8)) & 255, bs = 256 - mo;     // magic number / block size
    const val = +ipAddr.split(".")[io-1], netOct = Math.floor(val/bs)*bs;
    return { q:`For ${ipAddr}/${p}, find:`, ip:ipAddr, p, fields:[
        {label:"Network address", a:ipStr(net)}, {label:"Broadcast address", a:ipStr(bc)},
        {label:"First usable", a:ipStr(net+1)}, {label:"Last usable", a:ipStr(bc-1)}, {label:"Usable hosts", a:String(size-2)}],
      why:`/${p} → mask ${ipStr(M)}. The interesting octet is octet ${io} (mask value ${mo}), so the block size is 256 − ${mo} = ${bs}. Octet ${io} of the address is ${val}; its block starts at ${netOct} (${val} ÷ ${bs}, rounded down, × ${bs}). Network ${ipStr(net)}; broadcast = next block − 1 = ${ipStr(bc)}; usable ${ipStr(net+1)} – ${ipStr(bc-1)}; hosts = 2^${32-p} − 2 = ${size-2}.` }; },
  hosts2prefix(){ const need = [2,5,10,14,20,28,30,45,50,60,62,90,100,120,126,200,250,254,300,500,1000,2000][rnd(22)] + rnd(3) - 1;
    let h = 2; while (2**h - 2 < need) h++; const p = 32-h;
    return { q:`A subnet must hold ${need} hosts. What is the smallest (longest) prefix that fits?`, fields:[{label:"Prefix (e.g. /26)", a:"/"+p, check:v=>norm(v)===String(p)}], why:`Find the fewest host bits h with 2^h − 2 ≥ ${need}: 2^${h} − 2 = ${2**h-2} fits${h>2?`, 2^${h-1} − 2 = ${2**(h-1)-2} doesn't`:""}. Prefix = 32 − ${h} = /${p}.` }; },
  subnets2prefix(){ const base = [16,20,22,24][rnd(4)]; const need = [2,3,4,5,6,8,9,12,16,20,30,50,60,100][rnd(14)];
    let s = 0; while (2**s < need) s++; const p = base + s; if (p>30) return GEN.subnets2prefix();
    const net = base===16 ? "172.20.0.0" : base===20 ? "10.4.16.0" : base===22 ? "10.8.4.0" : "192.168.40.0";
    return { q:`You must split ${net}/${base} into at least ${need} equal subnets. What prefix do the subnets use, and how many usable hosts does each have?`, fields:[{label:"Prefix (e.g. /27)", a:"/"+p, check:v=>norm(v)===String(p)}, {label:"Usable hosts per subnet", a:String(2**(32-p)-2)}],
      why:`Borrow the fewest bits s with 2^s ≥ ${need}: 2^${s} = ${2**s}. New prefix /${base} + ${s} = /${p}. Hosts per subnet = 2^${32-p} − 2 = ${2**(32-p)-2}.` }; },
  samesub(){ const p = 20 + rnd(10); const a = [10, rnd(256), rnd(256), rnd(256)]; const n = ipNum(a.join(".")), M = maskOf(p), net = (n&M)>>>0, size = 2**(32-p);
    let other; do { other = rnd(2)===0 ? net + 1 + rnd(size-2) : (net + size*(1+rnd(3)) + 1 + rnd(size-2))>>>0; } while (other===n);
    const b = ipStr(other), sameReal = ((other & M)>>>0)===net;
    return { q:`Are ${a.join(".")} and ${b} in the same subnet with mask /${p} (${ipStr(M)})? Type yes or no.`, fields:[{label:"yes / no", a: sameReal?"yes":"no", check:v=>norm(v)===(sameReal?"yes":"no")||norm(v)===(sameReal?"y":"n")}],
      why:`AND each address with the mask: ${a.join(".")} → ${ipStr(net)}, ${b} → ${ipStr((other&M)>>>0)}. ${sameReal?"Same network address → same subnet (they can talk without a router).":"Different network addresses → different subnets (they need a router)."}` }; },
  nth(){ const p = 25 + rnd(5); const k = 1 + rnd(Math.min(8, 2**(p-24))); const size = 2**(32-p); const net = 192*16777216 + 168*65536 + (10+rnd(200))*256;
    const sn = net + (k-1)*size;
    return { q:`${ipStr(net)}/24 is divided into /${p} subnets. Counting the first one as subnet 1, what is the network address of subnet ${k}, and its broadcast?`, fields:[{label:"Network", a:ipStr(sn)}, {label:"Broadcast", a:ipStr(sn+size-1)}],
      why:`/${p} has a block size of ${size}. Subnets start at 0, ${size}, ${size*2}, … so subnet ${k} starts at (${k} − 1) × ${size} = ${(k-1)*size} → ${ipStr(sn)}; its broadcast is one less than the next block → ${ipStr(sn+size-1)}.` }; },
};
const LABELS = { dec2bin:"Decimal → binary", bin2dec:"Binary → decimal", dec2hex:"Decimal → hex", hex2dec:"Hex → decimal", bin2hex:"Binary → hex", prefix2mask:"Prefix → mask", mask2prefix:"Mask → prefix", wildcard:"Wildcard masks", subnet:"Find network / broadcast / range", hosts2prefix:"Hosts → prefix", subnets2prefix:"Subnets → prefix", samesub:"Same subnet?", nth:"The Nth subnet" };
function gen(types){ const t = types[rnd(types.length)]; const q = GEN[t](); q.type = t; return q; }
function grade(q, vals){ return q.fields.map((f,i)=>{ const v = vals[i]||""; return f.check ? f.check(v) : norm(v)===norm(f.a); }); }
window.DRILL = { gen, grade, GEN, LABELS, types:Object.keys(GEN), _seed: s => { seedState = s; }, ipNum, ipStr, maskOf };
})();
