// Ladder Lab — IPv6 address helpers shared by the IOS engine (sim_ios.js) and the bench (bench.js).
// Addresses are handled as arrays of eight 16-bit numbers. Text form follows RFC 5952 (longest run of zero groups → "::",
// leading zeros dropped); Cisco IOS prints it in upper case, Windows in lower case.
(function(){
const IP6 = {};
// "2001:db8::1" → [0x2001,0xdb8,0,0,0,0,0,1]; null if not a valid IPv6 address (no zone, no prefix length)
IP6.parse = s => {
  s = String(s||"").trim().toLowerCase(); if (!s || /[^0-9a-f:.]/.test(s) || s.split("::").length > 2) return null;
  const toGroups = part => part ? part.split(":") : [];
  let [head, tail] = s.includes("::") ? s.split("::") : [s, null];
  let h = toGroups(head), t = tail==null ? [] : toGroups(tail);
  const v4 = arr => { const last = arr[arr.length-1]; if (last && last.includes(".")){ const o = last.split(".").map(Number); if (o.length!==4 || o.some(x=>!(x>=0&&x<=255))) return null; arr.splice(-1, 1, ((o[0]<<8)|o[1]).toString(16), ((o[2]<<8)|o[3]).toString(16)); } return arr; };
  if (tail==null){ if (!v4(h)) return null; } else if (!v4(t.length ? t : h)) return null;
  const bad = g => !/^[0-9a-f]{1,4}$/.test(g);
  if (h.some(bad) || t.some(bad)) return null;
  if (tail==null){ if (h.length!==8) return null; return h.map(g=>parseInt(g,16)); }
  const fill = 8 - h.length - t.length; if (fill < 1) return null;
  return [...h, ...Array(fill).fill("0"), ...t].map(g=>parseInt(g,16));
};
IP6.valid = s => !!IP6.parse(s);
// "2001:db8:1::/64" or "2001:db8:1::1/64" → {w, len}
IP6.parsePrefix = s => { const m = String(s||"").trim().match(/^([0-9a-fA-F:.]+)\/(\d{1,3})$/); if (!m) return null; const w = IP6.parse(m[1]), len = +m[2]; if (!w || len > 128) return null; return {w, len}; };
IP6.str = (w, upper) => {
  if (typeof w === "string") w = IP6.parse(w);
  let best = -1, bestLen = 0;
  for (let i = 0; i < 8; ){ if (w[i]===0){ let j = i; while (j < 8 && w[j]===0) j++; if (j - i > bestLen && j - i >= 2){ best = i; bestLen = j - i; } i = j; } else i++; }
  const g = w.map(x=>x.toString(16));
  let out = best < 0 ? g.join(":") : g.slice(0, best).join(":") + "::" + g.slice(best + bestLen).join(":");
  return upper ? out.toUpperCase() : out;
};
IP6.eq = (a, b) => { const x = typeof a==="string" ? IP6.parse(a) : a, y = typeof b==="string" ? IP6.parse(b) : b; return !!x && !!y && x.every((v,i)=>v===y[i]); };
IP6.mask = (w, len) => w.map((v,i)=>{ const bits = Math.max(0, Math.min(16, len - i*16)); return bits===16 ? v : bits===0 ? 0 : v & (0xFFFF << (16-bits)) & 0xFFFF; });
IP6.inPrefix = (a, net, len) => { const x = typeof a==="string" ? IP6.parse(a) : a, n = typeof net==="string" ? IP6.parse(net) : net; if (!x || !n) return false; return IP6.eq(IP6.mask(x, len), IP6.mask(n, len)); };
// modified EUI-64 interface ID from a MAC (Cisco "aabb.cc00.0100" or "aa-bb-cc-00-01-00"): split, insert FFFE, flip the U/L bit
IP6.eui64 = mac => { const h = String(mac).replace(/[^0-9a-f]/gi,"").toLowerCase(); if (h.length!==12) return null;
  const b = h.match(/../g).map(x=>parseInt(x,16)); b[0] ^= 0x02; return [(b[0]<<8)|b[1], (b[2]<<8)|0xff, (0xfe<<8)|b[3], (b[4]<<8)|b[5]]; };
IP6.withIid = (prefixW, iid) => [...prefixW.slice(0,4), ...iid];
IP6.linkLocal = mac => IP6.withIid([0xfe80,0,0,0], IP6.eui64(mac));
// solicited-node multicast group: ff02::1:ff + the address's last 24 bits
IP6.solicited = a => { const w = typeof a==="string" ? IP6.parse(a) : a; return [0xff02,0,0,0,0,1,0xff00 | (w[6] & 0xff), w[7]]; };
// solicited-node multicast MAC: 33:33 + the last 32 bits of ff02::1:ffXX:XXXX
IP6.solicitedMac = a => { const s = IP6.solicited(a); const hx = n => n.toString(16).padStart(4,"0"); return `3333.${hx(s[6])}.${hx(s[7])}`; };
IP6.type = a => { const w = typeof a==="string" ? IP6.parse(a) : a; if (!w) return "invalid";
  if (w.every(x=>x===0)) return "unspecified"; if (w.slice(0,7).every(x=>x===0) && w[7]===1) return "loopback";
  if ((w[0] & 0xff00)===0xff00) return "multicast"; if ((w[0] & 0xffc0)===0xfe80) return "link-local";
  if ((w[0] & 0xfe00)===0xfc00) return "unique local"; if ((w[0] & 0xe000)===0x2000) return "global unicast"; return "other"; };
IP6.isLL = a => IP6.type(a)==="link-local";
window.IP6 = IP6;
})();
