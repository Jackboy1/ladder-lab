// Ladder Lab — wireless drills (Module 9), added to window.DRILL: channel ↔ frequency, 2.4 GHz overlap, channel plans,
// dBm ↔ mW (the rule of 3s and 10s) and SNR. tools/drills_wifi_test.js checks every answer independently.
(function(){
const D = window.DRILL; if (!D) return;
let seedState = null;
const rnd = n => { if (seedState==null) return Math.floor(Math.random()*n); seedState = (seedState*1103515245 + 12345) % 2147483648; return seedState % n; };
const pick = a => a[rnd(a.length)];
const norm = s => String(s==null?"":s).trim().toLowerCase().replace(/\s+/g,"").replace(/mhz$|mw$|dbm$|db$/,"");
const yn = (v, want) => { const x = norm(v); return want ? (x==="yes"||x==="y") : (x==="no"||x==="n"); };
const f24 = ch => ch===14 ? 2484 : 2407 + 5*ch, f5 = ch => 5000 + 5*ch;
const CH5 = [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,144,149,153,157,161,165];
const GEN = {
  wifichan(){ const band = rnd(3)===0 ? 5 : 2.4, ch = band===5 ? pick(CH5) : 1 + rnd(13), f = band===5 ? f5(ch) : f24(ch), toF = rnd(2)===0;
    return toF ? { q:`What is the centre frequency of ${band} GHz channel ${ch}?`, band, ch, f, fields:[{label:"Frequency (MHz)", a:String(f), check:v=>norm(v)===String(f)}],
        why: band===5 ? `5 GHz channels: centre = 5000 + 5 × channel = 5000 + 5 × ${ch} = ${f} MHz.` : `2.4 GHz channels 1–13: centre = 2407 + 5 × channel = 2407 + 5 × ${ch} = ${f} MHz (channel 14, Japan only, is the exception at 2484).` }
      : { q:`A ${band} GHz channel is centred on ${f} MHz. Which channel is it?`, band, ch, f, fields:[{label:"Channel", a:String(ch), check:v=>norm(v).replace(/^ch(annel)?/,"")===String(ch)}],
        why: band===5 ? `Channel = (${f} − 5000) ÷ 5 = ${ch}.` : `Channel = (${f} − 2407) ÷ 5 = ${ch}.` }; },
  wifioverlap(){ const a = 1 + rnd(13); let b; do { b = 1 + rnd(13); } while (b===a); const gap = Math.abs(a-b), ov = gap < 5;
    return { q:`Two neighbouring APs use 2.4 GHz channels ${a} and ${b}. Do their channels overlap?`, a, b, fields:[{label:"Overlap? (yes/no)", a:ov ? "yes" : "no", check:v=>yn(v, ov)}],
      why:`Centres are 5 MHz apart per channel number: ${f24(a)} and ${f24(b)} MHz, ${gap*5} MHz apart. A 2.4 GHz channel is about 22 MHz wide, so centres need ${"≥"} 25 MHz (5 channel numbers) to stay clear: ${ov ? `${gap*5} MHz is too close — they overlap and interfere.` : `${gap*5} MHz is enough — no overlap.`}` }; },
  wifiplan(){ const plans = [[1,6,11],[2,7,12],[3,8,13],[1,5,9],[1,6,10],[1,4,7],[2,6,11],[1,7,13],[3,6,11],[1,6,12]];
    const pl = pick(plans), okp = pl.every((x,i)=>pl.every((y,j)=>i===j || Math.abs(x-y)>=5));
    return { q:`A floor plan uses 2.4 GHz channels ${pl.join(", ")} for three neighbouring APs. Is that a non-overlapping plan?`, plan:pl, fields:[{label:"Non-overlapping? (yes/no)", a:okp ? "yes" : "no", check:v=>yn(v, okp)}],
      why:`Each pair must be at least 5 channel numbers (25 MHz) apart. ${pl.map((x,i)=>pl.slice(i+1).map(y=>`${x}–${y}: ${Math.abs(x-y)}`).join(", ")).filter(Boolean).join(", ")}. ${okp ? "Every pair is ≥ 5 apart — no overlap." : "At least one pair is closer than 5 — they overlap."} (1, 6 and 11 is the usual plan; 2-7-12 and 3-8-13 also work where channels 12–13 are allowed.)` }; },
  wifidbm(){ const steps = [[0,1],[3,2],[6,4],[10,10],[13,20],[16,40],[20,100],[23,200],[26,400],[30,1000],[-3,0.5],[-10,0.1],[7,5],[17,50],[27,500]];
    const [db, mw] = pick(steps), toMw = rnd(2)===0, fmt = x => String(+x.toFixed(2));
    return toMw ? { q:`Convert ${db} dBm to milliwatts (use the rule of 3s and 10s).`, db, mw, fields:[{label:"mW", a:fmt(mw), check:v=>{ const x = parseFloat(String(v).replace(",",".")); return isFinite(x) && Math.abs(x - mw) <= mw*0.06; }}],
        why:`0 dBm = 1 mW; every +10 dB multiplies the power by 10 and every +3 dB roughly doubles it (−3 dB halves, −10 dB divides by 10). ${db} dBm → ${fmt(mw)} mW.` }
      : { q:`A radio transmits ${fmt(mw)} mW. What is that in dBm (to the nearest whole dB)?`, db, mw, fields:[{label:"dBm", a:String(db), check:v=>{ const x = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isFinite(x) && Math.abs(x - db) <= 0.5; }}],
        why:`dBm = 10 × log10(mW). Or by steps from 1 mW = 0 dBm: ×10 = +10 dB, ×2 ≈ +3 dB. ${fmt(mw)} mW ≈ ${db} dBm.` }; },
  wifisnr(){ const rssi = -(40 + rnd(41)), noise = -(85 + rnd(14)), snr = rssi - noise;
    return { q:`A client sees the AP at ${rssi} dBm and the noise floor at ${noise} dBm. What is the SNR?`, rssi, noise, fields:[{label:"SNR (dB)", a:String(snr), check:v=>norm(v)===String(snr)}],
      why:`SNR = signal − noise = (${rssi}) − (${noise}) = ${snr} dB. Higher is better: roughly 25 dB+ suits voice and video; under ~10–15 dB the link struggles.` }; },
};
const LABELS = { wifichan:"Channel ↔ frequency", wifioverlap:"2.4 GHz — do they overlap?", wifiplan:"Channel plan — non-overlapping?", wifidbm:"dBm ↔ mW", wifisnr:"Signal-to-noise ratio" };
Object.assign(D.GEN, GEN); Object.assign(D.LABELS, LABELS); for (const k of Object.keys(GEN)) if (!D.types.includes(k)) D.types.push(k);
D._wifiSeed = s => { seedState = s; };
})();
