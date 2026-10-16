// CCNA · Module 9 — Wireless: RF and 802.11, channels, Cisco architectures and AP modes, AP join, the WLC GUI, wireless security (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "Wireless fundamentals".
(function(){
const L = [];

// ---------- Module 9 · Lesson 1 ----------
L.push({
id:"wifi-rf", mins:100, level:"Intermediate · builds on Modules 1, 4 and 7",
t:"RF and 802.11 fundamentals — radio waves, dBm and SNR, what walls do to a signal, CSMA/CA and the Wi-Fi standards",
html:`
${K.goals([
  "Explain frequency, wavelength and amplitude, and why 2.4 GHz reaches further through a building than 5 or 6 GHz.",
  "Convert between milliwatts and dBm with the rule of 3s and 10s, and work out an AP's EIRP from its power, cable loss and antenna gain.",
  "Read RSSI, the noise floor and SNR — including from <code>netsh wlan show interfaces</code> — and judge whether a spot suits web, voice or video.",
  "Predict what absorption, reflection, refraction, scattering and diffraction do in a real room, and use that to place access points.",
  "Explain why Wi-Fi is half-duplex, walk through CSMA/CA, and name the 802.11 standards with their bands, Wi-Fi generation names and headline rates.",
])}
${K.pre(["Module 1 lessons 1–2: access points, SSIDs and wireless LAN controllers (WLCs); half duplex and CSMA/CD on hubs; PoE.","Module 4: VLANs, access and trunk ports, router-on-a-stick, PortFast.","Module 7 lesson 1: DHCP.","Module 1's Windows commands: <code>ipconfig</code> and <code>ping</code>."])}

<h2>Why this matters at work</h2>
<p>A 120-room hotel in Port Harcourt. Third-floor guests post one-star reviews: &ldquo;Wi-Fi works in the corridor, dies in the room.&rdquo; The last contractor added four more access points — all in the corridor ceiling. The corridor signal is now superb. The rooms are no better.</p>
<p>The fix isn't another box; it's physics. Between each corridor AP and each bed are a fire door, a tiled bathroom full of pipes and a mirror — things that soak up and bounce radio energy. Proving it takes numbers (&ldquo;−78 dBm in the room, −45 in the corridor&rdquo;) and the logic behind them. This lesson gives you both, and lessons 2–7 build every design and fault-finding decision on it.</p>

<h2>Radio waves: frequency, wavelength and amplitude</h2>
${K.remember(`<b>The rule:</b> every radio wave travels at the speed of light, so <b>frequency × wavelength = speed of light</b>: higher frequency, shorter wave. Handy form: <b>wavelength in cm ≈ 30 ÷ frequency in GHz</b>. The consequence: <b>shorter waves lose more energy</b> in walls, people and air, so 2.4 GHz reaches further than 5 GHz, and 5 GHz further than 6 GHz.`)}
<p>Wi-Fi carries data as ${K.g("RF","Radio frequency: the electromagnetic waves used by radio, TV, phones, Bluetooth and Wi-Fi.")} energy: the AP's antenna launches a wave at about 300,000 km per second, and the laptop's antenna turns a tiny copy back into a current. Three properties describe it.</p>
<h3>Frequency — cycles each second</h3>
<p>One full up-and-down is a <b>cycle</b>; frequency counts cycles per second in ${K.g("hertz (Hz)","Cycles per second.")}; ${K.g("MHz","Megahertz: a million cycles per second.")} means millions, GHz billions. Wi-Fi uses three bands: <b>2.4 GHz</b> (every Wi-Fi device supports it; shared with Bluetooth and microwave ovens, so crowded), <b>5 GHz</b> (many more channels, shorter reach) and <b>6 GHz</b> (the newest, for Wi-Fi 6E and 7, where regulators allow it). All three are ${K.g("unlicensed","Usable by anyone without buying a licence, as long as the equipment follows the regulator's power and channel rules (the NCC in Nigeria, the FCC in the US).")}: no permission needed, but every neighbour may use the same frequencies. Lesson 2 splits them into channels.</p>
<h3>Wavelength — how far one cycle stretches</h3>
<p>${K.g("Wavelength","The distance a wave travels during one cycle, written λ (lambda) = speed of light ÷ frequency.")} is the distance covered during one cycle. Speed is fixed, so more cycles per second means shorter cycles:</p>
${K.steps([
  ["2.4 GHz", "λ ≈ 30 ÷ 2.4 = <b>12.5 cm</b> — about a spread hand."],
  ["5 GHz and 6 GHz", "30 ÷ 5 = <b>6 cm</b>; 30 ÷ 6 = <b>5 cm</b>."],
  ["Why the shortcut works", "Light covers about 30,000,000,000 cm per second. Divide by billions of cycles (GHz) and the billions cancel, leaving 30 ÷ GHz in centimetres."],
])}
<h3>Amplitude — how strong the wave is</h3>
<p>${K.g("Amplitude","A wave's height above and below the middle — for a radio wave, its strength.")} is the wave's height. The transmitter's power sets it; distance and obstacles shrink it. Wi-Fi also varies amplitude and timing on purpose to encode bits — ${K.g("modulation","Changing a wave's amplitude or timing (phase) in agreed patterns, each standing for a group of bits. Denser patterns carry more bits but need a cleaner signal.")} — which section 5 returns to.</p>
${K.svg("0 0 760 305",
  K.txt(20,92,"2.4 GHz",{c:"fg",s:15,f:"display",b:true})+K.txt(20,110,"2.4 billion cycles/s",{s:10.5,f:"body"})+K.txt(20,126,"λ = 30 ÷ 2.4 = 12.5 cm",{s:10})+
  K.link(160,100,700,100,"",true)+
  `<path d="M160,100 q31.25,-80 62.5,0 t62.5,0 t62.5,0 t62.5,0 t62.5,0 t62.5,0 t62.5,0 t62.5,0" fill="none" stroke="var(--accent)" stroke-width="2"/>`+
  `<line x1="191.25" y1="42" x2="191.25" y2="56" stroke="var(--muted)"/><line x1="316.25" y1="42" x2="316.25" y2="56" stroke="var(--muted)"/>`+
  K.arrow(191.25,49,316.25,49,"")+K.txt(253.75,36,"one wavelength ≈ 12.5 cm",{mid:true,s:10.5,f:"body"})+
  `<line x1="566.25" y1="60" x2="712" y2="60" stroke="var(--muted)" stroke-dasharray="2 3"/>`+
  K.arrow(700,100,700,62,"",true)+K.txt(700,118,"amplitude",{mid:true,s:10.5,f:"body",c:"accent"})+K.txt(700,131,"= strength",{mid:true,s:10.5,f:"body"})+
  K.txt(20,217,"5 GHz",{c:"fg",s:15,f:"display",b:true})+K.txt(20,235,"5 billion cycles/s",{s:10.5,f:"body"})+K.txt(20,251,"λ = 30 ÷ 5 = 6 cm",{s:10})+
  K.link(160,225,660,225,"",true)+
  `<path d="M160,225 q15,-80 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0" fill="none" stroke="var(--accent)" stroke-width="2"/>`+
  `<line x1="175" y1="166" x2="175" y2="180" stroke="var(--muted)"/><line x1="235" y1="166" x2="235" y2="180" stroke="var(--muted)"/>`+
  K.arrow(175,173,235,173,"")+K.txt(205,160,"one wavelength ≈ 6 cm",{mid:true,s:10.5,f:"body"})+
  K.txt(380,282,"Both waves travel at the speed of light. More cycles every second means each wave is shorter,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,298,"and shorter waves lose more energy in walls, people and air — less reach for 5 GHz than 2.4 GHz.",{mid:true,s:11,f:"body"}),
  "Frequency, wavelength and amplitude. Same height (power), but the 5 GHz wave packs more than twice as many cycles into the same distance.")}
${K.analogy(`Shake a rope slowly: long, lazy waves. Shake it fast: short, tight ones — frequency against wavelength. How hard you shake sets their height: amplitude.`)}
<h3>Why the band matters for design</h3>
<p>Lower frequencies reach further, so one 2.4 GHz AP covers more rooms. Higher bands have far more spectrum, so neighbouring APs each get a clean channel. Enterprise APs run 2.4 and 5 GHz radios at once (the newest add 6 GHz).</p>
${K.when([
  ["2.4 GHz","Devices that support nothing else (scanners, sensors, some printers), or a little extra reach","Longest reach, universal support","Crowded floors — only three clean channels (lesson 2), plus Bluetooth and microwave ovens"],
  ["5 GHz","Most office, school and hospital laptops and phones","Many channels, less interference, room for wider channels","You need maximum reach from the fewest APs"],
  ["6 GHz","New Wi-Fi 6E / 7 clients in dense or high-speed areas","Clean spectrum, very wide channels","Clients are older, or your country hasn't opened the band"],
], "Which band for which job?")}
${K.dyk(`A microwave oven heats food with RF at about 2.45 GHz — inside the Wi-Fi 2.4 GHz band, because both use the same unlicensed slice of spectrum. The little that leaks from the box swamps nearby 2.4 GHz channels while it runs. &ldquo;The Wi-Fi by the staff kitchen dies at lunchtime&rdquo; is a real ticket.`)}
${K.check({q:"Which radio wave has the shortest wavelength?", o:["900 MHz","2.4 GHz","5 GHz","6 GHz"], a:3, why:"Highest frequency, shortest wave: 30 ÷ 6 = 5 cm, against 6 cm at 5 GHz, 12.5 cm at 2.4 GHz and about 33 cm at 900 MHz."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"An outdoor bridge link between two buildings on a Lagos campus uses 5.8 GHz; an old warehouse scanner system uses 900 MHz (0.9 GHz). Work out each wavelength in centimetres (one decimal place), then say which of the two loses less energy passing through the warehouse's stacked boxes.", fields:[{label:"5.8 GHz wavelength (cm)", a:["5.2","5.17","5.2 cm","5.17 cm","5.2cm"]},{label:"900 MHz wavelength (cm)", a:["33.3","33.3 cm","33.33","33","33.3cm"]},{label:"Loses less through the boxes", a:["900 MHz","900MHz","the 900 MHz system","900","0.9 GHz"]}], why:"1. What is asked? Two wavelengths and a comparison. 2. Which rule? λ (cm) ≈ 30 ÷ f (GHz), and longer waves lose less energy in obstacles. 3. Apply it: 30 ÷ 5.8 ≈ 5.2 cm; 30 ÷ 0.9 ≈ 33.3 cm. The 900 MHz wave is more than six times longer, so it passes through the boxes with less loss — which is why older warehouse and mobile systems liked low frequencies."})}

<h2>Measuring RF: milliwatts, dBm, signal strength and noise</h2>
${K.remember(`<b>The rule of 3s and 10s:</b> <b>0 dBm = 1 mW</b>. <b>+3 dB doubles</b> the power, <b>−3 dB halves</b> it; <b>+10 dB multiplies by 10</b>, <b>−10 dB divides by 10</b>. Gains and losses in dB simply <b>add and subtract</b>. At the receiver, signal-to-noise ratio (SNR): <b>SNR (dB) = signal (dBm) − noise floor (dBm)</b>.`)}
<h3>Milliwatts — and why engineers use decibels</h3>
<p>An office AP radio transmits between a few and about 100 ${K.g("milliwatts (mW)","Thousandths of a watt.")}; a laptop across the room receives perhaps 0.0000001 mW. Such numbers are miserable to compare, so engineers use a logarithmic scale:</p>
<ul>
<li>a ${K.g("decibel (dB)","A ratio between two powers on a logarithmic scale: 10 × log10(P1 ÷ P2).")} is a <b>ratio</b> — a gain or a loss. A cable that loses 3 dB delivers half what went in;</li>
<li>${K.g("dBm","Power compared with 1 milliwatt: 0 dBm = 1 mW, 20 dBm = 100 mW.")} is an <b>amount</b>: 20 dBm is 100 mW, −70 dBm is ten million times less than 1 mW;</li>
<li>${K.g("dBi","Antenna gain compared with an imaginary antenna that radiates equally in every direction (isotropic).")} is an antenna's <b>gain</b>: it creates no power, but focuses it like a torch reflector.</li>
</ul>
<div class="tablewrap"><table>
<tr><th>dBm</th><th>mW</th><th>From 0 dBm = 1 mW</th></tr>
<tr><td>30</td><td>1,000 (1 W)</td><td>+10 +10 +10 → ×10 ×10 ×10</td></tr>
<tr><td>20</td><td>100</td><td>+10 +10</td></tr>
<tr><td>17</td><td>50</td><td>20 − 3 → 100 ÷ 2</td></tr>
<tr><td>14</td><td>25</td><td>20 − 3 − 3 → 100 ÷ 2 ÷ 2</td></tr>
<tr><td>3</td><td>2</td><td>+3 → ×2</td></tr>
<tr><td>−70</td><td>0.0000001</td><td>÷10 seven times</td></tr>
</table></div>
<h3>Worked example: what does the AP really radiate?</h3>
<p>A school in Ibadan fits an outdoor AP: radio at 20 dBm, a cable that loses 3 dB, a 6 dBi antenna. Regulators care about the ${K.g("EIRP","Effective Isotropic Radiated Power: transmitter power − cable losses + antenna gain — what leaves the antenna in its strongest direction. Regulators cap it.")}:</p>
${K.steps([
  ["Transmitter", "20 dBm = 100 mW."],
  ["Subtract the cable loss", "20 − 3 = 17 dBm (half lost as heat: 50 mW)."],
  ["Add the antenna gain", "17 + 6 = <b>23 dBm</b>."],
  ["Convert", "23 = 20 + 3 → 100 × 2 = <b>200 mW EIRP</b>. In dB you add and subtract; in mW you multiply and divide."],
])}
<p>EIRP limits differ by country and band: a high-gain antenna can make a legal radio illegal.</p>
${K.mistake(`Mixing dB and dBm. <b>3 dBm</b> is an amount (2 mW); <b>+3 dB</b> is a change (double). Two 100 mW signals are 200 mW = 23 dBm, <b>not</b> 20 + 20 = 40 dBm. Add dB to a dBm level; never add two dBm values.`)}
${K.drill({title:"dBm ↔ mW with the rule of 3s and 10s", types:["wifidbm"], count:5})}
<h3>At the receiver: RSSI, the noise floor and SNR</h3>
<p>What the client hears is a negative dBm value, the ${K.g("RSSI","Received Signal Strength Indicator: the AP's signal strength at the client. The 802.11 standard leaves the scale to vendors, but most tools (Windows netsh too) show dBm: closer to 0 = stronger.")}. A rough guide for office Wi-Fi:</p>
<div class="tablewrap"><table>
<tr><th>RSSI</th><th>Usually means</th></tr>
<tr><td>−30 to −50 dBm</td><td>Excellent — in the same room as the AP</td></tr>
<tr><td>−50 to −67 dBm</td><td>Good; about −67 dBm is a widely used design target for voice and video</td></tr>
<tr><td>−67 to −75 dBm</td><td>Fine for web and email; calls may break up</td></tr>
<tr><td>−75 to −85 dBm</td><td>Unreliable: low rates, retries, drop-outs</td></tr>
<tr><td>below −85 dBm</td><td>Barely there</td></tr>
</table></div>
<p>The air is never silent: other electronics and distant networks add up to the ${K.g("noise floor","Background RF energy on a channel — around −90 to −95 dBm on a quiet 5 GHz channel, higher (worse) on a busy one.")}. The receiver must pick the signal out of it, so what decides quality is the gap — the ${K.g("SNR","Signal-to-noise ratio: signal (dBm) − noise floor (dBm), in dB. Higher is better.")}.</p>
${K.svg("0 0 760 330",
  K.txt(110,18,"received power (dBm)",{mid:true,s:10.5,f:"body"})+
  `<line x1="110" y1="30" x2="110" y2="290" stroke="var(--line)" stroke-width="1.5"/>`+
  [-20,-30,-40,-50,-60,-70,-80,-90,-100].map(d=>{ const y = 30 + (-20 - d)*3.25; return `<line x1="104" y1="${y}" x2="116" y2="${y}" stroke="var(--line)"/>`+K.txt(98,y+4,"−"+(-d),{end:true,s:10}); }).join("")+
  K.txt(125,66,"−30  right next to the AP",{s:10.5,f:"body",c:"fg"})+
  K.txt(125,112,"−44  the lab laptop's reading (netsh Rssi)",{s:10.5,f:"body",c:"fg"})+
  K.txt(125,187,"−67  common design target for voice and video",{s:10.5,f:"body",c:"fg"})+
  K.txt(125,229,"−80  unreliable: retries, low data rates",{s:10.5,f:"body",c:"fg"})+
  K.txt(125,261,"−90  barely above the background noise",{s:10.5,f:"body",c:"fg"})+
  `<line x1="430" y1="176" x2="640" y2="176" stroke="var(--accent)" stroke-width="2.5"/>`+
  K.txt(440,168,"received signal  −65 dBm",{c:"accent",s:11,f:"body",b:true})+
  `<rect x="430" y="264" width="210" height="26" fill="var(--chip)" stroke="none"/>`+
  `<line x1="430" y1="264" x2="640" y2="264" stroke="var(--bad)" stroke-width="2" stroke-dasharray="5 3"/>`+
  K.txt(440,257,"noise floor  −92 dBm",{c:"bad",s:11,f:"body",b:true})+
  K.txt(535,281,"background noise",{mid:true,s:10,f:"body"})+
  K.arrow(620,178,620,262,"",true)+K.arrow(620,262,620,178,"",true)+
  K.txt(630,216,"SNR",{c:"fg",s:11,f:"body",b:true})+K.txt(630,231,"27 dB",{c:"fg",s:11,f:"body",b:true})+
  K.txt(380,316,"SNR (dB) = signal (dBm) − noise floor (dBm) = −65 − (−92) = 27 dB. The bigger the gap, the faster and cleaner the link.",{mid:true,c:"fg",s:11,f:"body"}),
  "The dBm scale at the receiver, and SNR as the gap between the wanted signal and the noise floor.")}
<h3>Worked example: is this desk good enough for Teams calls?</h3>
${K.steps([
  ["Read the two numbers", "A survey tool shows the AP at <b>−65 dBm</b> and the noise floor at <b>−92 dBm</b>."],
  ["Subtract, minding the signs", "SNR = −65 − (−92) = −65 + 92 = <b>27 dB</b>."],
  ["Compare with the job", "About 25 dB+ suits voice and video, around 20 dB browsing; below about 10–15 dB the link struggles. 27 dB at −65 dBm: good for calls."],
])}
<p>Why does SNR set speed? A clean signal allows dense modulation, many bits per change in the wave. As SNR falls the radios step down to slower patterns and resend damaged frames: &ldquo;connected but slow&rdquo;.</p>
<h3>Reading it on a Windows laptop</h3>
<p><code>netsh wlan show interfaces</code> reports the client's side. This is the laptop in this lesson's bench (Windows 11 layout):</p>
${K.out(`C:\\Users\\reception>netsh wlan show interfaces

There is 1 interface on the system:

    Name                   : Wi-Fi
    Description            : Intel(R) Wi-Fi 6E AX211 160MHz
    GUID                   : 3f2a9c4e-1b7d-4e21-9a55-005054607cea
    Physical address       : 00:50:54:60:7c:ea
    Interface type         : Primary
    State                  : connected
    SSID                   : Studio-Staff
    AP BSSID               : 00:50:5b:25:4b:d0
    Band                   : 5 GHz
    Channel                : 36
    Connected Akm-cipher   : [ akm = 00-0f-ac:02, cipher =  00-0f-ac:04 ]
    Network type           : Infrastructure
    Radio type             : 802.11ac
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Connection mode        : Auto Connect
    Receive rate (Mbps)    : 866.7
    Transmit rate (Mbps)   : 866.7
    Signal                 : 91%
    Rssi                   : -44
    Profile                : Studio-Staff `, "What the lab prints; on a real laptop the values move as you walk around.")}
<ul>
<li><b>SSID</b> — the network name; <b>AP ${K.g("BSSID","Basic Service Set Identifier: the MAC address of the AP radio serving a WLAN (lesson 2).")}</b> — the serving AP radio's MAC.</li>
<li><b>Band</b>, <b>Channel</b>, <b>Radio type</b> — 5 GHz, channel 36, 802.11ac (Wi-Fi 5, section 5).</li>
<li><b>Authentication</b>, <b>Cipher</b> — WPA2 with a passphrase, AES (lesson 6).</li>
<li><b>Receive / Transmit rate</b> — the ${K.g("data rate","The signalling speed the two radios agreed for current frames (the PHY rate). It changes with signal quality; real downloads get much less.")} the radios agreed, not what a download will reach (section 4).</li>
<li><b>Signal</b> — Windows' own percentage. <b>Rssi</b> — the real figure in dBm: −44 is excellent.</li>
</ul>
<p>Windows doesn't show the noise floor; for SNR use a survey tool or the controller's client view (lesson 7).</p>
${K.mistake(`Trusting the bars. Bars and Signal % reflect RSSI only. Beside a running microwave a full-bars laptop can crawl: the noise floor rose and SNR collapsed. &ldquo;Full signal but slow&rdquo; means think SNR and airtime, not distance.`)}
${K.drill({title:"signal-to-noise ratio", types:["wifisnr"], count:5})}
${K.check({q:"A client reports RSSI −71 dBm; the noise floor on its channel is −88 dBm. What is the SNR, and what does it suggest?", o:["159 dB — excellent","17 dB — fine for browsing, below a comfortable voice target","−17 dB — the signal is below the noise","71 dB — excellent"], a:1, why:"SNR = −71 − (−88) = 17 dB: enough for web and email, below the roughly 25 dB voice likes. Adding the numbers (159) or dropping the minus signs are the classic slips."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A survey of a Kaduna clinic gives four readings. Work out each SNR and match the reading with the right verdict.", pairs:[["RSSI −58 dBm, noise −95 dBm","SNR 37 dB — comfortable for voice and video"],["RSSI −66 dBm, noise −88 dBm","SNR 22 dB — fine for web and email, below a 25 dB voice target"],["RSSI −70 dBm, noise −76 dBm","SNR 6 dB — a decent signal drowned by noise: find the interference"],["RSSI −86 dBm, noise −97 dBm","SNR 11 dB — quiet air but a weak signal: get closer or add an AP"]], why:"1. What is asked? A verdict per reading. 2. Which rule? SNR = signal − noise, and the cause matters: low SNR from a high noise floor needs the interference found; low SNR from a weak signal needs a closer AP. 3. Apply it: −58+95 = 37; −66+88 = 22; −70+76 = 6 (the RSSI alone looks acceptable — the noise is the problem); −86+97 = 11 (quiet air, weak signal)."})}

<h2>What walls, water and metal do: RF behaviours and AP placement</h2>
${K.remember(`<b>The rule:</b> every metre and every obstacle costs signal. Distance alone spreads the energy: <b>double the distance, lose about 6 dB</b> (a quarter of the power), even in open air. Obstacles then <b>absorb</b>, <b>reflect</b>, <b>refract</b>, <b>scatter</b> or <b>diffract</b> the wave — how much depends on the <b>material</b> and the <b>frequency</b>, and higher frequencies suffer more.`)}
<p>Even in empty space energy spreads over an ever-larger sphere — ${K.g("free-space path loss","Weakening with distance as energy spreads out, with nothing in the way: about 6 dB per doubling of distance. With ordinary antennas 5 GHz loses roughly 6 dB more than 2.4 GHz over the same path.")}. Then the building adds its own ${K.g("attenuation","Any weakening of a signal: distance, materials, cable losses.")} in five ways:</p>
${K.svg("0 0 760 225",
  [0,1,2,3,4].map(i=>{ const x = 8 + i*150; return `<rect x="${x}" y="8" width="140" height="210" rx="7" fill="var(--panel2)" stroke="var(--line)"/>`; }).join("")+
  // absorption
  K.txt(78,30,"Absorption",{mid:true,c:"fg",s:12.5,f:"body",b:true})+
  `<line x1="18" y1="95" x2="58" y2="95" stroke="var(--accent)" stroke-width="5"/><rect x="60" y="60" width="28" height="70" fill="var(--chip)" stroke="var(--line)"/><line x1="90" y1="95" x2="136" y2="95" stroke="var(--accent)" stroke-width="1.2" marker-end="url(#karra)"/>`+
  K.txt(78,172,"Energy soaked up —",{mid:true,s:10,f:"body",c:"fg"})+K.txt(78,187,"water, people, concrete",{mid:true,s:10,f:"body"})+K.txt(78,204,"weaker behind it",{mid:true,s:10,f:"body"})+
  // reflection
  K.txt(228,30,"Reflection",{mid:true,c:"fg",s:12.5,f:"body",b:true})+
  `<line x1="170" y1="140" x2="286" y2="140" stroke="var(--muted)" stroke-width="4"/><line x1="176" y1="55" x2="226" y2="137" stroke="var(--accent)" stroke-width="1.6"/><line x1="230" y1="137" x2="278" y2="57" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#karra)"/>`+
  K.txt(228,156,"metal",{mid:true,s:9.5,f:"body"})+
  K.txt(228,172,"Bounces off —",{mid:true,s:10,f:"body",c:"fg"})+K.txt(228,187,"metal, mirrored glass",{mid:true,s:10,f:"body"})+K.txt(228,204,"multipath, dead spots",{mid:true,s:10,f:"body"})+
  // refraction
  K.txt(378,30,"Refraction",{mid:true,c:"fg",s:12.5,f:"body",b:true})+
  `<rect x="358" y="48" width="40" height="102" fill="var(--chip)" stroke="var(--line)"/>`+K.txt(378,62,"glass",{mid:true,s:9.5,f:"body"})+
  `<line x1="318" y1="70" x2="358" y2="92" stroke="var(--accent)" stroke-width="1.6"/><line x1="358" y1="92" x2="398" y2="104" stroke="var(--accent)" stroke-width="1.6"/><line x1="398" y1="104" x2="438" y2="126" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#karra)"/>`+
  K.txt(378,172,"Bends as it enters",{mid:true,s:10,f:"body",c:"fg"})+K.txt(378,187,"glass or denser air",{mid:true,s:10,f:"body"})+K.txt(378,204,"aimed links miss",{mid:true,s:10,f:"body"})+
  // scattering
  K.txt(528,30,"Scattering",{mid:true,c:"fg",s:12.5,f:"body",b:true})+
  `<polyline points="468,142 478,130 488,142 498,130 508,142 518,130 528,142 538,130 548,142 558,130 568,142 578,130 588,142" fill="none" stroke="var(--muted)" stroke-width="2"/>`+
  `<line x1="474" y1="55" x2="516" y2="126" stroke="var(--accent)" stroke-width="1.6"/>`+
  [[488,82],[510,70],[540,68],[566,84],[584,110]].map(([x,y])=>`<line x1="520" y1="126" x2="${x}" y2="${y}" stroke="var(--accent)" stroke-width="1" marker-end="url(#karra)"/>`).join("")+
  K.txt(528,172,"Splits many ways —",{mid:true,s:10,f:"body",c:"fg"})+K.txt(528,187,"rough walls, leaves, dust",{mid:true,s:10,f:"body"})+K.txt(528,204,"many weak echoes",{mid:true,s:10,f:"body"})+
  // diffraction
  K.txt(678,30,"Diffraction",{mid:true,c:"fg",s:12.5,f:"body",b:true})+
  `<rect x="640" y="42" width="45" height="62" fill="var(--chip)" stroke="none"/>`+K.txt(662,62,"shadow",{mid:true,s:9.5,f:"body"})+
  `<rect x="618" y="42" width="22" height="80" fill="var(--muted)" stroke="none"/>`+
  `<line x1="616" y1="138" x2="736" y2="138" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#karra)"/>`+
  `<path d="M616,130 Q672,128 700,72" fill="none" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#karra)"/>`+
  K.txt(678,172,"Bends round an edge,",{mid:true,s:10,f:"body",c:"fg"})+K.txt(678,187,"leaving an RF shadow",{mid:true,s:10,f:"body"})+K.txt(678,204,"weak behind obstacles",{mid:true,s:10,f:"body"}),
  "The five RF behaviours. Each one leaves the client with a weaker or messier copy of the AP's signal.")}
<ul>
<li><b>Absorption</b> — the material soaks up energy as a little heat. Water excels at it (people, fish tanks, bathrooms), as do concrete and brick: a full room is weaker than an empty one.</li>
<li><b>Reflection</b> — the wave bounces off smooth, dense surfaces (metal, mirrors, tinted glass); the echoes arrive slightly late: ${K.g("multipath","Copies of one signal arriving by different paths at slightly different times. It garbled old Wi-Fi; 802.11n and later use multiple antennas (MIMO) to exploit it.")}.</li>
<li><b>Refraction</b> — the wave bends as it passes into a material of different density (glass, warm and cool air layers). Small indoors; outdoors it can push an aimed link off target.</li>
<li><b>Scattering</b> — rough surfaces and small particles (textured walls, trees, dust, chain-link fences) break the wave into many weak reflections.</li>
<li><b>Diffraction</b> — the wave bends round an obstacle's edge, so a weak signal reaches the RF shadow behind a lift core, stairwell or pillar.</li>
</ul>
<div class="tablewrap"><table>
<tr><th>What's in the way</th><th>Main behaviour</th><th>Effect (relative)</th></tr>
<tr><td>Plasterboard, wooden door, clear glass</td><td>Absorption (small)</td><td>Low</td></tr>
<tr><td>Brick, concrete block, solid-core wooden fire door</td><td>Absorption</td><td>Medium to high</td></tr>
<tr><td>Concrete floor or lift core</td><td>Absorption; diffraction at edges</td><td>Very high; shadows behind</td></tr>
<tr><td>Metal (steel fire doors, lift doors, shelving), tinted or low-e glass</td><td>Reflection</td><td>Very high; multipath nearby</td></tr>
<tr><td>Water: people, aquariums, tanks</td><td>Absorption</td><td>High — and it changes with the crowd</td></tr>
</table></div>
<h3>What it means for where APs go</h3>
<p>The rule: <b>put the AP where the users are, with little in between</b> — corridor APs cover corridors. And phones transmit far less than APs, so turning an AP up to reach a far room makes a one-way link: the phone hears the AP, the AP can't hear the phone.</p>
${K.dodont([
  "Mount APs on the ceiling, in or near the rooms people use, below any metal grid.",
  "Survey with furniture in and people present, not in the empty building.",
  "Prefer more APs at moderate power over a few at full power.",
  "Re-check coverage after renovations: new glass, shelving or partitions change everything.",
],[
  "Don't hide APs above false ceilings, in cupboards or behind metal panels.",
  "Don't cover rooms from the corridor through doors, bathrooms and mirrors.",
  "Don't turn power to maximum to &ldquo;reach&rdquo; a far room — clients can't shout back.",
  "Don't design 5 GHz coverage from a 2.4 GHz survey.",
])}
${K.case("The exam hall that went quiet on exam day",`
<p>A university in Kano moved first-year exams onto tablets. A holiday survey of the empty 600-seat hall showed −60 dBm or better at every seat from four wall-mounted 5 GHz APs.</p>
<p><b>The symptom.</b> On exam day a third of the middle-row tablets dropped off or crawled.</p>
<p><b>Why.</b> Six hundred seated people are six hundred bags of water between wall-mounted APs and the middle rows. Their bodies pushed the centre seats into the high −70s, and every tablet contended for the same channels at once (section 4).</p>
<p><b>The fix.</b> APs moved to the ceiling over the seats, so the path passes above the crowd; two more added at lower power; the survey repeated during a full lecture.</p>
<p><b>The lesson.</b> Survey rooms as they will be used; APs above users beat APs beside them.</p>`)}
${K.check({q:"A room behind a concrete lift core gets a weak signal — not zero — though the core is the only thing between it and the AP. Which behaviour lets some signal reach that room?", o:["Reflection","Refraction","Diffraction","Absorption"], a:2, why:"Diffraction bends the wave round the obstacle's edges into the shadow behind it. Absorption explains why the direct path through the core is so weak; reflection needs a surface to bounce from; refraction is bending while passing through a different material."})}
<h3>Same logic, new situation</h3>
<p>A Lagos law firm has one AP in reception. Behind it: a meeting room with a glass wall coated in metallic privacy film, an archive with steel shelving, a staff kitchen with a fridge and a microwave, and an open-plan office with plasterboard partitions. Which rooms will struggle, and where should a second AP go?</p>
${K.hint(`Name the material and its behaviour for each room, then ask which problem a second AP solves and which needs a different fix (the microwave).`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Problem rooms, why, and where to add an AP. <b>2. Which rule?</b> Each material's behaviour plus distance; the AP belongs where the users are. <b>3. Apply it:</b> the <b>meeting room</b> — metallic film reflects strongly, weak inside; the <b>archive</b> — steel reflects, but few people work there; the <b>kitchen</b> — the microwave raises the 2.4 GHz noise floor at lunchtime, an SNR problem best solved by keeping clients on 5 GHz; the <b>open plan</b> — plasterboard costs little. Put the second AP on the ceiling <b>inside the meeting room</b> or over the open plan beside it, wherever most people sit — not a second AP in reception with both turned up.</p>`)}

<h2>Sharing the air: half-duplex and CSMA/CA</h2>
${K.remember(`<b>The rule:</b> a Wi-Fi channel is <b>one shared medium</b>: only one radio on it can send successfully at a time, and a radio <b>can't listen while it transmits</b>. So Wi-Fi is <b>half-duplex</b>, can't detect collisions, and instead <b>avoids</b> them (CSMA/CA) and confirms every unicast frame with an <b>ACK</b>. No ACK = assume it was lost and send again.`)}
<p>Module 1's hub shared one channel — half duplex, with collisions handled by ${K.g("CSMA/CD","Carrier Sense Multiple Access with Collision Detection: the hub-era Ethernet rule — listen, send, and on a collision stop, wait a random time and retry.")}. Switches ended that; Wi-Fi brings it back, because every client <i>and</i> the AP on a channel share the air.</p>
<p>Why not detect collisions? A radio's own transmission drowns anything it could hear: sending at 20 dBm while listening for −70 dBm means levels 90 dB apart — a billion to one. So Wi-Fi <b>avoids collisions and checks every frame arrived</b>: ${K.g("CSMA/CA","Carrier Sense Multiple Access with Collision Avoidance: the 802.11 way of sharing a channel — listen, wait, random back-off, send, expect an ACK.")}:</p>
${K.steps([
  [`Listen (carrier sense)`, `Is there Wi-Fi energy on the channel now? Also, each frame's Duration field says how long its sender needs the channel, and everyone who hears it stays quiet that long — the ${K.g("NAV","Network Allocation Vector: a countdown each radio sets from overheard Duration fields; while it runs, the channel counts as busy.")}.`],
  [`Wait a fixed gap`, `Once idle, wait ${K.g("DIFS","Distributed Inter-Frame Space: the idle gap a station must see before its back-off. Longer than SIFS, so ACKs always go first.")}.`],
  [`Random back-off`, `Pick a random number of slots from the ${K.g("contention window","The range the random back-off is drawn from. It doubles after each unacknowledged attempt, up to a maximum.")} and count down only while the channel stays idle. If someone else starts, <b>freeze</b> the count and resume later.`],
  [`Send`, `At zero, transmit the frame.`],
  [`Get an ACK`, `The receiver checks the frame's FCS (Module 1) and, after the shorter ${K.g("SIFS","Short Inter-Frame Space: the brief gap before an ACK — shorter than DIFS, so nobody can start a new frame first.")}, returns an ${K.g("ACK","Acknowledgement: a short frame sent back at once for each unicast frame received correctly.")}.`],
  [`No ACK? Retry`, `Assume a collision or interference, double the contention window, back off and resend — and give up after a retry limit.`],
])}
${K.svg("0 0 760 300",
  K.txt(15,79,"LAPTOP A",{c:"fg",s:11,f:"body",b:true})+K.txt(15,139,"LAPTOP B",{c:"fg",s:11,f:"body",b:true})+K.txt(15,199,"AP",{c:"fg",s:11,f:"body",b:true})+
  [75,135,195].map(y=>`<line x1="110" y1="${y}" x2="750" y2="${y}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join("")+
  `<rect x="110" y="20" width="140" height="26" rx="4" fill="var(--chip)" stroke="var(--line)"/>`+K.txt(180,37,"channel busy (C is sending)",{mid:true,s:9.5,f:"body",c:"fg"})+
  `<rect x="250" y="64" width="30" height="22" rx="3" fill="none" stroke="var(--muted)"/>`+K.txt(265,79,"DIFS",{mid:true,s:9})+
  `<rect x="250" y="124" width="30" height="22" rx="3" fill="none" stroke="var(--muted)"/>`+K.txt(265,139,"DIFS",{mid:true,s:9})+
  [3,2,1].map((n,i)=>`<rect x="${280+i*15}" y="64" width="15" height="22" fill="var(--panel2)" stroke="var(--muted)"/>`+K.txt(287.5+i*15,79,String(n),{mid:true,s:9.5})).join("")+
  `<rect x="325" y="62" width="145" height="26" rx="4" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.6"/>`+K.txt(397.5,79,"A sends DATA",{mid:true,s:10.5,f:"body",c:"accent",b:true})+
  [7,6,5].map((n,i)=>`<rect x="${280+i*15}" y="124" width="15" height="22" fill="var(--panel2)" stroke="var(--muted)"/>`+K.txt(287.5+i*15,139,String(n),{mid:true,s:9.5})).join("")+
  `<rect x="325" y="124" width="205" height="22" rx="3" fill="none" stroke="var(--muted)" stroke-dasharray="4 3"/>`+K.txt(427.5,139,"B hears A — freezes at 4",{mid:true,s:10,f:"body"})+
  K.txt(476,180,"SIFS",{mid:true,s:9})+
  `<rect x="482" y="184" width="48" height="22" rx="3" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.6"/>`+K.txt(506,199,"ACK",{mid:true,s:10.5,f:"body",c:"ok",b:true})+
  `<rect x="530" y="124" width="30" height="22" rx="3" fill="none" stroke="var(--muted)"/>`+K.txt(545,139,"DIFS",{mid:true,s:9})+
  [4,3,2,1].map((n,i)=>`<rect x="${560+i*15}" y="124" width="15" height="22" fill="var(--panel2)" stroke="var(--muted)"/>`+K.txt(567.5+i*15,139,String(n),{mid:true,s:9.5})).join("")+
  `<rect x="620" y="122" width="130" height="26" rx="4" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.6"/>`+K.txt(685,139,"B sends DATA",{mid:true,s:10.5,f:"body",c:"accent",b:true})+
  K.arrow(110,230,750,230,"time →")+
  K.txt(380,256,"1 Listen: is the channel idle?  2 Wait DIFS, then count down a random back-off — frozen while anyone else talks.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,274,"3 Send when the count hits 0.  4 The receiver waits only SIFS (shorter than DIFS) and returns an ACK.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,292,"No ACK? Assume the frame was lost, double the back-off range and try again. (ACK for B's frame not shown.)",{mid:true,s:11,f:"body"}),
  "CSMA/CA in time. A and B both wait for C to finish; A's random count runs out first, B freezes and finishes its count after A's frame and ACK.")}
${K.analogy(`A conference call where nobody hears while talking: wait for silence, count a random number in your head (pausing if someone starts), speak, and wait for the chair's &ldquo;got it&rdquo;. None? Try again, waiting longer.`)}
<h3>Hidden nodes and RTS/CTS</h3>
<p>Listening first only works if everyone hears everyone. Two laptops at opposite ends of a hall may both hear the AP but not each other — each is a ${K.g("hidden node","A station another station can't hear, though both reach the AP — so they collide at the AP.")} to the other — so both send and collide at the AP. The optional fix is ${K.g("RTS/CTS","Request to Send / Clear to Send: the sender asks the AP for the channel; the AP's reply is heard by its whole cell, and everyone stays quiet for the time it announces.")}: the laptop asks first, and the AP's Clear to Send silences the whole cell. It costs airtime, so it's used only when needed.</p>
<h3>What it means in practice: airtime</h3>
<ul>
<li><b>Airtime is the real resource.</b> Twenty laptops on one AP share one channel's time.</li>
<li><b>Throughput is well below the data rate.</b> Gaps, back-offs, ACKs and retries take time: an 866.7 Mbps connection commonly downloads at around half that or less, and less on a busy channel.</li>
<li><b>Slow clients slow everyone.</b> A distant phone or an old scanner needs far longer on air for the same data.</li>
</ul>
${K.check({q:"Why does 802.11 use CSMA/CA rather than the CSMA/CD that old Ethernet hubs used?", o:["Wi-Fi is full duplex, so collisions can't happen","A radio can't reliably detect a collision while it is transmitting, so Wi-Fi avoids collisions and confirms frames with ACKs instead","CSMA/CA is faster because it skips listening before sending","The AP schedules every client's turn, so no listening is needed"], a:1, why:"A radio's own signal swamps anything it could hear, so it can't detect collisions. It listens, backs off randomly to avoid them, and relies on the ACK. Wi-Fi is half-duplex, and normal access is contention-based, not scheduled by the AP."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"In a busy banking hall in Lagos, a teller's tablet has a frame to send while a customer's phone is in the middle of a long transmission on the same channel. Put the tablet's steps in order.", items:["Senses the channel busy (and its NAV, set from the phone's Duration field, is still counting)","Waits for the channel to go idle, then waits DIFS","Counts down a random back-off, freezing if anyone else starts","Sends its frame when the count reaches zero","Receives the AP's ACK after SIFS — or, with no ACK, doubles its back-off range and retries"], why:"1. What is asked? The order of CSMA/CA events for a station that finds the channel busy. 2. Which rule? Listen first; wait for idle plus DIFS; random back-off that freezes while others talk; send; expect an ACK after SIFS. 3. Apply it: the tablet can't start until the phone's frame (and its NAV time) is over, then DIFS, then the back-off, then the frame, then the ACK — and a missing ACK sends it round again with a bigger contention window."})}

<h2>The 802.11 standards and the Wi-Fi generations</h2>
${K.remember(`<b>The rule:</b> the IEEE writes the 802.11 amendments (the letters); the ${K.g("Wi-Fi Alliance","The industry body that certifies Wi-Fi products and, since October 2018, names the generations.")} names the generations: <b>Wi-Fi 4 = ${K.g("802.11n","IEEE Wi-Fi standard of 2009: 2.4 and 5 GHz, up to 600 Mbps.")}, Wi-Fi 5 = 802.11ac, Wi-Fi 6 = ${K.g("802.11ax","IEEE Wi-Fi standard of 2019–2021: 2.4, 5 and (as 6E) 6 GHz.")}, Wi-Fi 6E = 802.11ax in 6 GHz, Wi-Fi 7 = ${K.g("802.11be","IEEE Wi-Fi standard certified from 2024: 2.4, 5 and 6 GHz.")}</b>. Speed comes from <b>wider channels</b>, <b>more spatial streams</b> and <b>denser modulation</b>; each stays <b>backward compatible</b> in its bands.`)}
<div class="tablewrap"><table>
<tr><th>IEEE standard</th><th>Wi-Fi name</th><th>Arrived</th><th>Band(s)</th><th>Headline maximum</th></tr>
<tr><td>802.11 (original)</td><td>—</td><td>1997</td><td>2.4 GHz</td><td>2 Mbps</td></tr>
<tr><td>${K.g("802.11b","1999: 2.4 GHz, 11 Mbps.")}</td><td>— (unofficially Wi-Fi 1)</td><td>1999</td><td>2.4 GHz</td><td>11 Mbps</td></tr>
<tr><td>${K.g("802.11a","1999: 5 GHz, 54 Mbps.")}</td><td>— (unofficially Wi-Fi 2)</td><td>1999</td><td>5 GHz</td><td>54 Mbps</td></tr>
<tr><td>${K.g("802.11g","2003: 2.4 GHz, 54 Mbps.")}</td><td>— (unofficially Wi-Fi 3)</td><td>2003</td><td>2.4 GHz</td><td>54 Mbps</td></tr>
<tr><td>802.11n</td><td><b>Wi-Fi 4</b></td><td>2009</td><td>2.4 and 5 GHz</td><td>600 Mbps</td></tr>
<tr><td>802.11ac</td><td><b>Wi-Fi 5</b></td><td>2013</td><td>5 GHz only</td><td>about 6.9 Gbps</td></tr>
<tr><td>802.11ax</td><td><b>Wi-Fi 6</b> · <b>6E</b> in 6 GHz</td><td>2019–2021</td><td>2.4 and 5 GHz (+ 6 GHz as 6E)</td><td>about 9.6 Gbps</td></tr>
<tr><td>802.11be</td><td><b>Wi-Fi 7</b></td><td>2024 (certification began)</td><td>2.4, 5 and 6 GHz</td><td>about 46 Gbps (16 streams; about 23 with 8)</td></tr>
</table></div>
<h3>Where the headline numbers come from</h3>
<p>Those maximums assume the widest channel, the most antennas and a perfect signal. Three levers build them:</p>
<ul>
<li><b>Channel width</b> — 20 MHz (802.11a/g), 40 (n), 80 and 160 (ac/ax), 320 (be, 6 GHz). The cost — fewer separate channels — is lesson 2.</li>
<li><b>${K.g("Spatial streams","Separate data streams sent at once on one channel from different antennas; two streams roughly double the rate.")}</b> — ${K.g("MIMO","Multiple-Input Multiple-Output: several antennas at each end sending and receiving at once, turning multipath into capacity. Introduced by 802.11n.")} sends different data from several antennas at once; most laptops and phones have two.</li>
<li><b>Modulation</b> — denser ${K.g("QAM","Quadrature Amplitude Modulation: bits encoded in a wave's amplitude and phase. 64-QAM = 6 bits per symbol, 256 = 8, 1024 = 10, 4096 = 12.")} carries more bits but needs higher SNR: 64-QAM (802.11n), 256 (Wi-Fi 5), 1024 (Wi-Fi 6), 4096 (Wi-Fi 7). That is why SNR decides real speed.</li>
</ul>
${K.dyk(`The lab laptop's 866.7 Mbps is the Wi-Fi 5 rate for <b>2 spatial streams × 80 MHz × 256-QAM</b> at the best coding — 433.3 per stream. A one-stream phone shows 433.3; a 40 MHz channel roughly halves both.`)}
<h3>What the newer generations added</h3>
<ul>
<li><b>Wi-Fi 5 (802.11ac)</b> — 5 GHz only, 80/160 MHz, 256-QAM, and the AP sending to several clients at once (downlink ${K.g("MU-MIMO","Multi-User MIMO: the AP sends (and from Wi-Fi 6 also receives) separate streams to several clients at the same moment.")}). A dual-band Wi-Fi 5 AP runs 802.11n on its 2.4 GHz radio.</li>
<li><b>Wi-Fi 6 (802.11ax)</b> — built for crowds: ${K.g("OFDMA","Splitting a channel into small sub-channels so the AP serves several clients in one transmission.")} serves several clients in one transmission, MU-MIMO both ways, 1024-QAM, ${K.g("BSS colouring","A Wi-Fi 6 tag marking which cell sent a frame, so radios can ignore weak frames from a neighbouring cell on the same channel.")} for neighbouring cells, and ${K.g("Target Wake Time (TWT)","AP and client agree when the client next wakes, saving battery.")}. 2.4 and 5 GHz.</li>
<li><b>Wi-Fi 6E</b> — the same 802.11ax in 6 GHz, not a new IEEE letter. 6 GHz allows no WPA2 — only WPA3 or Enhanced Open (lesson 6).</li>
<li><b>Wi-Fi 7 (802.11be)</b> — 320 MHz channels, 4096-QAM and ${K.g("multi-link operation (MLO)","A client and AP using links in two bands (e.g. 5 and 6 GHz) at once.")} across two bands at once.</li>
</ul>
<p><b>Backward compatibility:</b> 2.4 GHz serves b/g/n/ax/be; 5 GHz a/n/ac/ax/be; 6 GHz only 6E and 7. Old clients still join, at slower rates and costing more airtime.</p>
${K.when([
  ["Wi-Fi 6 / 6E APs","Crowded spaces: lecture halls, open plan, hospitals","OFDMA, BSS colouring and TWT share airtime better","Every client is old"],
  ["Wi-Fi 7 APs","New builds with recent clients needing top throughput","320 MHz, MLO","Uplinks or PoE budget can't feed them (lesson 4)"],
], "Which generation of AP?")}
${K.myth([
  ["Microwave ovens and 2.4 GHz Wi-Fi use that frequency because it is water's resonant frequency.","Water absorbs RF across a wide range; 2.4–2.5 GHz is simply an unlicensed band both may use — which is why a leaking oven disturbs 2.4 GHz Wi-Fi."],
  ["More AP power always fixes coverage.","Clients transmit far less than APs; past a point the client hears the AP but the AP can't hear it. More APs at moderate power, in the right rooms, fix coverage."],
  ["5 GHz is faster, so it is always the better band.","5 GHz has more, cleaner channels but less reach. A client at −85 dBm on 5 GHz may do worse than at −65 dBm on 2.4 GHz."],
  ["A Wi-Fi 6 AP gives every device 9.6 Gbps.","9.6 Gbps assumes 8 streams and 160 MHz. A 2-stream laptop on 80 MHz negotiates about 1.2 Gbps — on a shared channel."],
])}
${K.exam(`Reading a wireless question: underline the <b>unit</b> (dB a change, dBm an amount, dBi an antenna gain), the <b>band</b>, and whether it uses the <b>IEEE letter or the Wi-Fi name</b> — translate first. Traps: &ldquo;802.11ac at 2.4 GHz&rdquo; (5 GHz only), &ldquo;802.11g at 5 GHz&rdquo; (2.4 only), &ldquo;Wi-Fi 6E is a new IEEE standard&rdquo; (it is 802.11ax in 6 GHz), &ldquo;Wi-Fi uses CSMA/CD&rdquo; (CA) and &ldquo;Wi-Fi is full duplex&rdquo; (half). For maths, write the rule of 3s and 10s down first and keep the minus signs.`)}
${K.check({q:"A dual-band AP is sold as Wi-Fi 5. What does its 2.4 GHz radio run?", o:["802.11ac","802.11n (Wi-Fi 4), because 802.11ac exists only in 5 GHz","802.11ax","802.11a"], a:1, why:"802.11ac is 5 GHz only, so a Wi-Fi 5 AP's 2.4 GHz radio is 802.11n (Wi-Fi 4), still serving b/g clients. 802.11a is a 5 GHz standard."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"An asset audit at a Port Harcourt logistics company describes five devices by what they do, not by name. Match each with its standard.", pairs:[["A 2005-era handheld scanner: sees only 2.4 GHz networks, never faster than 54 Mbps","802.11g"],["A laptop whose netsh shows Band 5 GHz, Radio type 802.11ac","Wi-Fi 5"],["A tablet connected on a 6 GHz channel using 802.11ax","Wi-Fi 6E"],["A 2010 printer that joins 2.4 or 5 GHz, rated up to 300 Mbps","Wi-Fi 4 (802.11n)"],["A new AP that keeps one client on 5 GHz and 6 GHz links at the same time","Wi-Fi 7 (802.11be)"]], why:"1. What is asked? The standard behind each description. 2. Which rule? Each standard's bands, top rate and signature feature. 3. Apply it: 2.4 GHz-only at 54 Mbps = 802.11g (802.11a was 5 GHz, b only 11 Mbps); 802.11ac on 5 GHz = Wi-Fi 5; 802.11ax in 6 GHz = Wi-Fi 6E; dual-band at a few hundred Mbps around 2010 = 802.11n; links in two bands at once is multi-link operation, a Wi-Fi 7 feature."})}

<h2>Hands-on: a first working wireless office</h2>
<p>A design studio in Wuse 2, Abuja, is getting its first ceiling AP. The wired network, DHCP and the wireless controller are built; the AP is still in its box. Prepare its port, plug it in, get reception online — and read what Windows reports about the radio link.</p>
<h3>Step 1: prepare the AP's switch port</h3>
<p>An AP is an end device on an access port (lesson 4 explains why a controller-based AP needs only an access port). The studio keeps AP and controller management in VLAN 10.</p>
${K.term({env:"ios2", title:"STUDIO-SW1 — prepare Gi0/3 for the reception AP", opts:{kind:"switch", host:"STUDIO-SW1", model:"C9200L-24P-4G", motd:"STUDIO-SW1 — console session (lab switch, no enable secret)."},
  setup:env=>{ ["enable","configure terminal","vlan 40","name STAFF-WIFI","vlan 50","name SERVERS","vlan 60","name GUEST-WIFI","exit","interface g0/1","description Trunk to STUDIO-R1","switchport mode trunk","interface g0/2","description Trunk to WLC1","switchport mode trunk","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. All of this is Module 4.",
  tasks:[
    {text:"Create VLAN 10 and name it <code>AP-MGMT</code> (<code>vlan 10</code>, <code>name AP-MGMT</code>, <code>exit</code>)", done:e=>e.vlans[10]==="AP-MGMT"},
    {text:"On <code>interface g0/3</code>: <code>description AP-RECEPTION ceiling</code>, <code>switchport mode access</code>, <code>switchport access vlan 10</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/3"]; return i.mode==="access" && i.vlan===10 && /AP/i.test(i.desc||""); }},
    {text:"<code>spanning-tree portfast</code> on Gi0/3 — the AP is an end device, so the port can forward as soon as it comes up (read the warning IOS prints)", done:e=>!!(e.intfs["GigabitEthernet0/3"].stp && e.intfs["GigabitEthernet0/3"].stp.portfast)},
    {text:"<code>end</code>, then check your work with <code>show vlan brief</code> (Gi0/3 in VLAN 10?) and <code>show running-config interface g0/3</code>", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+vl\S*\s+br/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+run\S*\s+int\S*\s+g\S*0\/3/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"Gi0/3 is an access port in VLAN 10 with PortFast, described and saved. When the AP is plugged in it will power up from PoE, lease an address in VLAN 10 and go looking for its controller.",
  solve:["enable","configure terminal","vlan 10","name AP-MGMT","exit","interface g0/3","description AP-RECEPTION ceiling","switchport mode access","switchport access vlan 10","spanning-tree portfast","end","show vlan brief","show running-config interface g0/3","copy running-config startup-config",""]})}
<h3>Step 2: bring the AP up and get reception online</h3>
<p>Gi0/3 is set up as in the terminal. New here: a controller (WLC1, configured in lesson 5 — for now open its <b>Controller GUI</b> (graphical user interface) only to look) and an AP, whose status dot turns green once it has power, an address and a reachable controller.</p>
${K.bench({id:"m9-first-wifi", points:80, openLog:true, from:"CCNA · Module 9 · lesson 1", title:"Abuja: switch on the studio's first ceiling AP and get reception online", viewBox:"0 0 940 420",
  intro:"<b>Design:</b> STUDIO-R1 routes four VLANs over one trunk (router-on-a-stick, Module 4) and is the DHCP server for 10, 40 and 60 (Module 7): <b>10</b> AP and controller management 10.40.10.0/24 · <b>40</b> staff Wi-Fi 10.40.40.0/24 · <b>50</b> servers 10.40.50.0/24 (FILES 10.40.50.10) · <b>60</b> guest Wi-Fi 10.40.60.0/24. WLC1 (10.40.10.5) offers <code>Studio-Staff</code> (WPA2-Personal, build-sheet key <code>Example-Studio-2026</code> — a lab example) and <code>Studio-Guest</code> (open). <b>Lab note:</b> there is no radio propagation here — every laptop is in range and readings are fixed (channel 36, Rssi −44); on a real floor they change with every step.",
  devices:[
    {id:"r1", kind:"router", label:"STUDIO-R1", x:40, y:20, config:e=>{ ["en","conf t","hostname STUDIO-R1","no ip domain-lookup","int g0/0","no shut",
      "int g0/0.10","description AP + controller management","encapsulation dot1Q 10","ip address 10.40.10.1 255.255.255.0",
      "int g0/0.40","description Staff Wi-Fi","encapsulation dot1Q 40","ip address 10.40.40.1 255.255.255.0",
      "int g0/0.50","description Servers","encapsulation dot1Q 50","ip address 10.40.50.1 255.255.255.0",
      "int g0/0.60","description Guest Wi-Fi","encapsulation dot1Q 60","ip address 10.40.60.1 255.255.255.0","exit",
      "ip dhcp excluded-address 10.40.10.1 10.40.10.9","ip dhcp excluded-address 10.40.40.1 10.40.40.9","ip dhcp excluded-address 10.40.60.1 10.40.60.9",
      "ip dhcp pool APS","network 10.40.10.0 255.255.255.0","default-router 10.40.10.1","exit",
      "ip dhcp pool STAFF","network 10.40.40.0 255.255.255.0","default-router 10.40.40.1","exit",
      "ip dhcp pool GUEST","network 10.40.60.0 255.255.255.0","default-router 10.40.60.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"WLC1", x:600, y:20, wlc:{ mgmt:{ip:"10.40.10.5", mask:"255.255.255.0", gw:"10.40.10.1", vlan:10},
      ifaces:{ staff:{vlan:40, ip:"10.40.40.5", mask:"255.255.255.0", gw:"10.40.40.1", dhcp:"10.40.40.1"}, guest:{vlan:60, ip:"10.40.60.5", mask:"255.255.255.0", gw:"10.40.60.1", dhcp:"10.40.60.1"} },
      wlans:{ 1:{id:1, profile:"STAFF", ssid:"Studio-Staff", enabled:true, iface:"staff", security:"wpa2-psk", psk:"Example-Studio-2026", qos:"silver", broadcast:true},
              2:{id:2, profile:"GUEST", ssid:"Studio-Guest", enabled:true, iface:"guest", security:"none", qos:"bronze", broadcast:true} } }},
    {id:"sw", kind:"switch", label:"STUDIO-SW1", x:200, y:150, config:e=>{ ["en","conf t","hostname STUDIO-SW1","vlan 10","name AP-MGMT","vlan 40","name STAFF-WIFI","vlan 50","name SERVERS","vlan 60","name GUEST-WIFI","exit",
      "int g0/1","description Trunk to STUDIO-R1","switchport mode trunk","int g0/2","description Trunk to WLC1","switchport mode trunk",
      "int g0/3","description AP-RECEPTION ceiling","switchport mode access","switchport access vlan 10","spanning-tree portfast",
      "int g0/4","description FILES server","switchport mode access","switchport access vlan 50","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"srv", kind:"server", label:"FILES", x:40, y:300, ip:"10.40.50.10", mask:"255.255.255.0", gw:"10.40.50.1"},
    {id:"ap", kind:"ap", label:"AP-RECEPTION", x:560, y:300},
    {id:"lap", kind:"laptop", label:"RECEPTION-LAP", x:780, y:300, dhcp:true, wifi:{ssid:"Studio-Staff", key:"Example-Studio-2025"}},
  ],
  cables:[{type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"srv:eth", b:"sw:g4"}],
  tray:["cat6"],
  tasks:[
    {text:"Mount and cable AP-RECEPTION: a Cat6 from its G0 port to STUDIO-SW1 Gi0/3 (the switch powers it over PoE — Module 1). The AP leases an address in VLAN 10, finds WLC1 on its own subnet and joins it (lesson 4 explains the join): its status dot turns green and the frame log shows the CAPWAP discovery and join. Open WLC1's Controller GUI → WIRELESS to see it listed under All APs", done:B=>Bench.apJoined(B,"ap")},
    {text:"The receptionist's laptop has been trying <code>Studio-Staff</code> with the key from an old sticky note. Open RECEPTION-LAP → <b>Wi-Fi</b> and read Windows' message. Then connect to Studio-Staff with the build-sheet key: a dashed radio link appears between the laptop and the AP", done:B=>Bench.wifiAssoc(B,"lap") && Bench.wifiVlan(B,"lap")===40},
    {text:"RECEPTION-LAP's Command Prompt: <code>netsh wlan show interfaces</code> (Windows' report on its Wi-Fi adapter). Find the SSID, Band, Channel, Radio type, Rssi and Receive rate. Which band and Wi-Fi generation? Is −44 dBm good?", done:B=>Bench.wifiAssoc(B,"lap") && Bench.tried(B,"lap",/netsh\s+wlan\s+show\s+interfaces?/i)},
    {text:"<code>ipconfig</code>: find the <b>Wireless LAN adapter Wi-Fi</b> section. Is the address in the staff Wi-Fi subnet 10.40.40.0/24? (<code>ipconfig /all</code> names the DHCP server: 192.0.2.1, WLC1's virtual address — the controller proxies DHCP to STUDIO-R1, lesson 5.)", done:B=>Bench.leased(B,"lap") && Bench.tried(B,"lap",/^\s*ipconfig/i)},
    {text:"Wi-Fi is just another way onto the LAN: <code>ping 10.40.50.10</code> (FILES, a wired server in VLAN 50). Then read the frame log: on which STUDIO-SW1 port do the laptop's frames enter the wired network, tagged VLAN 40 — the AP's Gi0/3, or the controller's trunk Gi0/2?", done:B=>Bench.pinged(B,"lap","10.40.50.10")},
    {text:"<code>netsh wlan show networks</code>: how many SSIDs is AP-RECEPTION broadcasting, and which one is Open (no key, no encryption)?", done:B=>Bench.tried(B,"lap",/netsh\s+wlan\s+show\s+networks/i)},
    {text:"Connect to <code>Studio-Guest</code> (no key) and run <code>ipconfig</code> again — which subnet now? Try <code>ping 10.40.50.10</code> from the guest network too", done:B=>Bench.wifiVlan(B,"lap")===60 && Bench.leased(B,"lap") && Bench.tried(B,"lap",/^\s*ipconfig/i)},
  ],
  win:"AP-RECEPTION joined WLC1 on its own once it had power, an address and a controller on its subnet. The old key gave Windows' 'The network security key isn't correct'; the right one connected. netsh showed 5 GHz channel 36, 802.11ac (Wi-Fi 5), Rssi −44 dBm and 866.7 Mbps (2 streams × 80 MHz); ipconfig showed a Wireless LAN adapter with a VLAN 40 address from STUDIO-R1's pool, relayed by WLC1. The ping to FILES entered the wired network on Gi0/2, tagged VLAN 40 — the AP had carried it to the controller first (lesson 3 explains why). On Studio-Guest the same laptop landed in VLAN 60 and could still reach FILES: a real guest network needs an ACL or firewall (Module 8) to stop that.",
  solve:[["plug","cat6","ap:eth","sw:g3"],["wifi","lap","Studio-Staff","Example-Studio-2026"],["pc","lap","netsh wlan show interfaces"],["pc","lap","ipconfig"],["pc","lap","ipconfig /all"],["pc","lap","ping 10.40.50.10"],["pc","lap","netsh wlan show networks"],["wifi","lap","Studio-Guest",""],["pc","lap","ipconfig"],["pc","lap","ping 10.40.50.10"]]})}
${K.hint(`Task 2: Windows' message is about the key, not the signal — the AP is there and answering. Task 5: the first frame-log line naming STUDIO-SW1 says where the laptop's frame arrived. Task 7: staff and guest are different WLANs mapped to different VLANs on the same AP.`)}
${K.q({type:"fill", q:"From the bench: the laptop reads Rssi −44 dBm on channel 36. Suppose a survey tool at the reception desk shows the noise floor on that channel at −93 dBm. Work it out.", fields:[{label:"SNR (dB)", a:["49","49 dB","49db"]},{label:"Good enough for voice and video? (yes/no)", a:["yes","y"]},{label:"Which Wi-Fi generation is 802.11ac?", a:["Wi-Fi 5","wifi 5","wi-fi5","5","wifi5"]}], why:"1. What is asked? SNR, a verdict, and a name. 2. Which rules? SNR = signal − noise; about 25 dB or more suits voice and video; 802.11ac = Wi-Fi 5. 3. Apply them: −44 − (−93) = 49 dB — far above 25 dB, so yes. And Radio type 802.11ac on Band 5 GHz is Wi-Fi 5."})}
${K.job("“The new boardroom's Wi-Fi is useless since the refurbishment”",`
<p><b>The ticket.</b> Monday 09:10, an insurance office: &ldquo;Boardroom Wi-Fi keeps dropping and Teams calls freeze. Fine before the refurbishment. The board meets at 14:00.&rdquo;</p>
<p><b>Questions first.</b> Who: every device in the boardroom, nowhere else. What changed: glass walls with a metallic privacy film, and the AP above the table removed &ldquo;to tidy the ceiling&rdquo; — the nearest AP is now in the corridor.</p>
<p><b>Checks.</b> <code>netsh wlan show interfaces</code> on one laptop, corridor then table:</p>
${K.out(`(corridor, 3 m from the AP)
    Band                   : 5 GHz
    Channel                : 44
    Radio type             : 802.11ac
    Receive rate (Mbps)    : 866.7
    Transmit rate (Mbps)   : 866.7
    Signal                 : 96%
    Rssi                   : -48

(boardroom table, behind the filmed glass)
    Band                   : 5 GHz
    Channel                : 44
    Radio type             : 802.11ac
    Receive rate (Mbps)    : 58.5
    Transmit rate (Mbps)   : 39
    Signal                 : 38%
    Rssi                   : -79`, "Trimmed netsh output from each spot (Windows 11 layout). Same AP, same channel.")}
<p><b>Reasoning.</b> −79 dBm is unreliable and the rates fell from 866.7 to 58.5 / 39 Mbps. A 31 dB drop — about a thousand times less power — is far more than a few metres explain: the metallic film <b>reflects</b> 5 GHz. Voice wants about −67 dBm; the boardroom is nowhere near.</p>
<p><b>The fix.</b> Not more corridor power — the laptops still couldn't reach back through the film. Facilities agree to refit an AP on the boardroom ceiling (the old cable is still there); a temporary AP covers the 14:00 meeting. After: −46 dBm at the table, 866.7 Mbps, a ten-minute test call clean.</p>
<p><b>What you say</b> to the office manager: &ldquo;The new glass has a metal film that bounces Wi-Fi back into the corridor, and the room's own access point was removed. We've put one back inside the room and calls are clear. Please include us in any refit that changes walls or ceilings.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Boardroom: −79 dBm / 58.5 Mbps at the table vs −48 dBm / 866.7 Mbps in corridor (same AP, ch 44) — 31 dB loss through metallised glass film; in-room AP removed in refit. Temp AP 12:30; permanent AP refitted on original cable. Verified −46 dBm, 866.7 Mbps, 10-min test call OK. Recommend RF re-survey after refurbishments. 3 h 20 min.&rdquo;</i></p>`)}
${K.tip(`Gather evidence as the job did: a reading where it works and one where it doesn't, same device, minutes apart. The difference in dB convinces facilities managers.`)}
${K.check({q:"netsh shows Rssi -52, Band 5 GHz, Receive rate 866.7 Mbps, yet a file copy runs at about 300 Mbps on a quiet afternoon. Best explanation?", o:["The AP is faulty: the copy should reach 866.7 Mbps","866.7 is the signalling rate; CSMA/CA gaps, back-offs and ACKs on a half-duplex channel keep throughput well below it","The laptop is on 2.4 GHz","The SNR must be below 10 dB"], a:1, why:"866.7 Mbps is the negotiated signalling rate. Gaps, back-offs, ACKs and the half-duplex medium take airtime, so about half the data rate or less is normal. −52 dBm on 5 GHz is good."})}

<h2>Interview corner</h2>
${K.hint(`Define dBm against 1 mW, give the rule, then convert out loud.`)}
${K.reveal("“What is dBm, and what is 50 mW in dBm?”",`<p>"dBm is power on a logarithmic scale relative to 1 milliwatt, so 0 dBm is 1 mW. In dB, gains and losses simply add. Plus 3 dB doubles, plus 10 multiplies by ten. 50 mW is 100 mW halved: 20 dBm minus 3, so 17 dBm. Plain dB is a ratio — a 3 dB cable loss halves the power."</p>`)}
${K.hint(`Why a radio can't detect collisions; the CSMA/CA steps in order; what it means for throughput.`)}
${K.reveal("“Why is Wi-Fi half-duplex, and how does CSMA/CA work?”",`<p>"Every station on a channel, AP included, shares the same air, and a radio can't hear while it transmits — its own signal is about a billion times stronger. So it avoids collisions instead of detecting them: it listens until the channel is idle, honouring NAV timers from other frames' Duration fields, waits DIFS, counts down a random back-off that freezes if someone else starts, then sends. The receiver ACKs after SIFS; no ACK means a doubled contention window and a retry. RTS/CTS helps with hidden nodes. So throughput is well below the connected rate."</p>`)}
${K.hint(`Separate signal, noise, band and airtime — and say what you'd measure.`)}
${K.reveal("“A user has full Wi-Fi bars but everything is slow. How do you troubleshoot?”",`<p>"Bars only show signal strength. netsh wlan show interfaces gives me RSSI, band, channel and data rate — a low rate with good RSSI points to noise or congestion. Under about 20 dB SNR, from a survey tool or the controller, I hunt interference — a microwave on 2.4 GHz, a busy neighbour channel. Then airtime: how many clients, any slow old ones, is it on 2.4 when it could use 5. A second device in the same spot separates a client fault from an RF one."</p>`)}

${K.recap([
  "Frequency × wavelength = speed of light; λ (cm) ≈ 30 ÷ GHz: 12.5 cm at 2.4 GHz, 6 cm at 5, 5 cm at 6. Shorter waves lose more in walls and air.",
  "0 dBm = 1 mW; +3 dB doubles, +10 dB ×10; dB gains and losses add. EIRP = Tx power − cable loss + antenna gain (dBi).",
  "RSSI = received signal in dBm (closer to 0 is stronger; about −67 dBm is a common voice target). SNR = signal − noise floor; about 25 dB+ suits voice and video.",
  "Absorption (water, people, concrete), reflection (metal → multipath), refraction, scattering, diffraction (→ RF shadow); double the distance ≈ −6 dB. Put APs where users are, on the ceiling.",
  "Wi-Fi is half-duplex and uses CSMA/CA: listen (and NAV), DIFS, random back-off that freezes, send, ACK after SIFS; no ACK → bigger back-off and retry. RTS/CTS for hidden nodes.",
  "b/g 2.4 GHz; a 5 GHz; n = Wi-Fi 4 (2.4 + 5); ac = Wi-Fi 5 (5 only); ax = Wi-Fi 6 (2.4 + 5) and 6E (6 GHz); be = Wi-Fi 7. Speed = channel width × spatial streams × QAM.",
  "netsh wlan show interfaces gives SSID, band, channel, radio type, rates and Rssi; ipconfig lists the Wireless LAN adapter like any NIC.",
])}
${K.next(`<b>Lesson 2 — Bands, channels and service sets.</b> Why only channels 1, 6 and 11 avoid each other in 2.4 GHz, what 5 and 6 GHz add, the cost of wide channels, co-channel versus adjacent-channel interference — and what SSIDs, BSSIDs and service sets really are.`)}
`,
quiz:[
  {lvl:1, q:"Which statement about radio waves is correct?", o:["A higher frequency means a longer wavelength","A higher frequency means a shorter wavelength","Frequency and wavelength are unrelated","Amplitude sets the wavelength"], a:1, why:"All radio waves travel at the speed of light, so frequency × wavelength is constant: more cycles per second means each one is shorter. 2.4 GHz ≈ 12.5 cm, 5 GHz ≈ 6 cm. Amplitude is the wave's height (strength), not its length."},
  {lvl:1, type:"fill", q:"Using the rule of 3s and 10s, complete the conversions.", fields:[{label:"0 dBm = ? mW", a:["1","1 mW","1mw"]},{label:"20 dBm = ? mW", a:["100","100 mW","100mw"]}], why:"0 dBm is the reference, 1 mW. +10 dB multiplies by ten, so 10 dBm = 10 mW and 20 dBm = 100 mW."},
  {lvl:1, type:"match", q:"Match each RF behaviour with what it does.", pairs:[["Absorption","Energy is soaked up by water, people or concrete"],["Reflection","The wave bounces off metal or mirrored glass"],["Refraction","The wave bends as it passes into glass or air of a different density"],["Scattering","The wave splits in many directions off a rough surface or particles"],["Diffraction","The wave bends round the edge of an obstacle, leaving a shadow behind it"]], why:"Absorption weakens the signal through materials (water above all); reflection bounces it and causes multipath; refraction bends it passing between media; scattering breaks it into many weak reflections; diffraction bends it around edges, so a weak signal reaches the RF shadow."},
  {lvl:1, q:"Which method do 802.11 stations use to share a channel?", o:["CSMA/CD","CSMA/CA","Token passing","Full-duplex switching"], a:1, why:"Wi-Fi is half-duplex and a radio can't detect collisions while transmitting, so 802.11 uses Carrier Sense Multiple Access with Collision Avoidance: listen, wait, random back-off, send, and expect an ACK. CSMA/CD was the shared-Ethernet (hub) rule."},
  {lvl:1, type:"match", q:"Match each Wi-Fi Alliance generation name with its IEEE standard.", pairs:[["Wi-Fi 4","802.11n"],["Wi-Fi 5","802.11ac"],["Wi-Fi 6","802.11ax in 2.4 and 5 GHz"],["Wi-Fi 6E","802.11ax extended into 6 GHz"],["Wi-Fi 7","802.11be"]], why:"The Wi-Fi Alliance introduced generation names in 2018: n = 4, ac = 5, ax = 6, and ax in the 6 GHz band is certified as 6E (not a new IEEE standard). 802.11be is Wi-Fi 7."},
  {lvl:2, type:"fill", q:"Convert these AP transmit powers to dBm using the rule of 3s and 10s.", fields:[{label:"50 mW = ? dBm", a:["17","17 dBm","17dbm"]},{label:"4 mW = ? dBm", a:["6","6 dBm","6dbm"]}], why:"50 mW = 100 mW ÷ 2 → 20 − 3 = 17 dBm. 4 mW = 1 mW × 2 × 2 → 0 + 3 + 3 = 6 dBm."},
  {lvl:2, q:"Based on the exhibit, which statement is correct?", ex:"C:\\Users\\nurse4>netsh wlan show interfaces\n\nThere is 1 interface on the system: \n\n    Name                   : Wi-Fi\n    State                  : connected\n    SSID                   : Ward-Staff\n    Band                   : 2.4 GHz\n    Channel                : 6\n    Network type           : Infrastructure\n    Radio type             : 802.11n\n    Authentication         : WPA2-Personal\n    Cipher                 : CCMP\n    Receive rate (Mbps)    : 72.2\n    Transmit rate (Mbps)   : 72.2\n    Signal                 : 58% \n    Rssi                   : -71", o:["The laptop is using Wi-Fi 4 on 2.4 GHz with a usable but modest signal, so web and email should work while voice may struggle","The laptop is using Wi-Fi 5, because 802.11n is part of 802.11ac","The signal is excellent, because 58% is above half","Downloads will run at 72.2 Mbps"], a:0, why:"802.11n is Wi-Fi 4, and Band shows 2.4 GHz. −71 dBm is below the roughly −67 dBm voice target but fine for data. Signal % is Windows' own scale, not a measurement, and 72.2 Mbps is the negotiated data rate — real throughput on a shared, half-duplex channel is lower."},
  {lvl:2, type:"multi", q:"Which two statements explain why 802.11 uses collision avoidance instead of collision detection? (Choose two.)", o:["A transmitting radio can't reliably hear a much weaker signal at the same time","Wi-Fi radios are full duplex, so collisions never happen","The receiver confirms each unicast frame with an ACK, so a missing ACK tells the sender to retry","The AP gives every client a fixed time slot","CSMA/CD would need fibre cabling"], a:[0,2], why:"A radio's own transmission swamps anything it could hear, so it can't detect collisions; instead it avoids them with carrier sense and random back-off, and learns of a failure from the missing ACK. Wi-Fi is half-duplex, and normal access is contention-based rather than AP-scheduled."},
  {lvl:2, type:"order", q:"A laptop gets a frame to send just as another station's frame ends. Put the CSMA/CA steps in order.", items:["Check that the channel is idle (carrier sense and NAV)","Wait DIFS","Count down a random back-off","Transmit the frame","The receiver waits SIFS and sends an ACK"], why:"Listen first, then the fixed DIFS gap, then the random back-off (which freezes if anyone else starts), then the frame; the receiver replies after the shorter SIFS so its ACK goes before anyone can start a new frame."},
  {lvl:2, q:"An AP radio is set to 17 dBm. It feeds a 5 dBi antenna through a cable that loses 2 dB. What is the EIRP?", o:["24 dBm (about 250 mW)","20 dBm (100 mW)","14 dBm (25 mW)","22 dBm (about 160 mW)"], a:1, why:"EIRP = transmitter power − cable loss + antenna gain = 17 − 2 + 5 = 20 dBm, which is 100 mW. Adding the cable loss instead of subtracting it gives 24; ignoring the antenna gives 15."},
  {lvl:2, type:"multi", q:"Which two 802.11 standards operate only in the 5 GHz band? (Choose two.)", o:["802.11a","802.11b","802.11g","802.11n","802.11ac","802.11ax"], a:[0,4], why:"802.11a (1999) and 802.11ac (Wi-Fi 5) are 5 GHz only. 802.11b and g are 2.4 GHz only; 802.11n and 802.11ax work in both 2.4 and 5 GHz (ax also in 6 GHz as Wi-Fi 6E)."},
  {lvl:2, type:"fill", q:"A survey tool shows a client receiving the AP at −62 dBm with an SNR of 30 dB. What is the noise floor?", fields:[{label:"Noise floor (dBm)", a:["-92","−92","-92 dBm","−92 dBm","-92dbm"]}], why:"SNR = signal − noise, so noise = signal − SNR = −62 − 30 = −92 dBm."},
  {lvl:3, q:"Based on the exhibit, at which desk can the new IP phones be placed without another AP, if the design target is RSSI of −67 dBm or better and SNR of 25 dB or more?", ex:"Site survey — Accounts floor, 5 GHz\nDesk   RSSI (dBm)   Noise floor (dBm)\nA1     -61          -82\nA2     -69          -96\nA3     -64          -93\nA4     -58          -80", o:["A1","A2","A3","A4"], a:2, why:"Work out both tests per desk. A1: −61 passes RSSI, SNR = 21 dB fails. A2: SNR 27 dB passes, but −69 is weaker than −67, so it fails. A3: −64 passes and SNR = 29 dB passes. A4: −58 is the strongest signal, but SNR = 22 dB fails — the noise floor is high there. Only A3 meets both; the strongest signal (A4) is not the best spot."},
  {lvl:3, q:"A hotel has APs only in the corridor ceilings. Corridor RSSI is −45 dBm; inside rooms, behind fire doors and tiled bathrooms, it is −80 dBm and guests' phones keep dropping. Which change is most likely to fix it?", o:["Raise every corridor AP to maximum power","Add more APs in the corridor","Put APs inside the rooms (for example in-room wall or ceiling units), at moderate power, so there is little between the AP and the guests","Move all guests to 2.4 GHz and switch off 5 GHz"], a:2, why:"The loss is absorption and reflection by doors, bathrooms and mirrors between AP and bed. More corridor power makes the AP louder but the phones still can't reach back; more corridor APs repeat the same path. 2.4 GHz would reach a little better but is crowded and slow. Putting the APs where the guests are removes the obstacles from the path."},
  {lvl:3, q:"A clinic's staff Wi-Fi works well all day except around 12:30 near the staff kitchen. Clients there stay at about −58 dBm, but the controller shows their SNR falling from about 35 dB to about 8 dB at that time, and they are on 2.4 GHz. What is the most likely cause and best response?", o:["The AP overheats at lunchtime; replace it","A microwave oven raising the 2.4 GHz noise floor; steer those clients to 5 GHz and/or move the AP away from the kitchen","Too many clients at lunchtime; lower the AP's power","The DHCP pool runs out at lunchtime"], a:1, why:"The signal (−58 dBm) didn't change; the SNR collapsed, so the noise floor rose by about 27 dB — exactly what a microwave oven leaking energy around 2.45 GHz does while it runs. 5 GHz isn't affected by it. An overheating AP or a DHCP problem wouldn't leave RSSI steady while SNR falls, and lowering power makes SNR worse."},
  {lvl:3, type:"fill", q:"An AP transmitting at 25 mW gives −70 dBm at a desk. The engineer raises it to 100 mW, and nothing else changes. What RSSI should the desk now see, and does that meet a −67 dBm voice target?", fields:[{label:"New RSSI (dBm)", a:["-64","−64","-64 dBm","−64 dBm","-64dbm"]},{label:"Meets −67 dBm? (yes/no)", a:["yes","y"]}], why:"100 mW is 25 mW × 2 × 2 = +6 dB (14 dBm → 20 dBm). Everything between AP and desk is unchanged, so the received level also rises 6 dB: −70 + 6 = −64 dBm, which meets −67. (The phones' own transmit power hasn't changed, though — check that the AP can still hear them.)"},
],
cards:[
  {f:"Frequency, wavelength, amplitude", b:"Frequency = cycles per second (Hz). Wavelength = distance of one cycle; frequency × wavelength = speed of light. Amplitude = the wave's height, i.e. its strength."},
  {f:"Wavelength shortcut", b:"λ (cm) ≈ 30 ÷ frequency (GHz): 2.4 GHz ≈ 12.5 cm, 5 GHz ≈ 6 cm, 6 GHz ≈ 5 cm. Shorter waves lose more energy through walls and air, so 2.4 GHz reaches furthest."},
  {f:"dB, dBm, dBi", b:"dB = a ratio (gain or loss). dBm = power compared with 1 mW (0 dBm = 1 mW). dBi = antenna gain compared with an isotropic antenna. Add dB to dBm; never add two dBm values."},
  {f:"Rule of 3s and 10s", b:"+3 dB = ×2, −3 dB = ÷2, +10 dB = ×10, −10 dB = ÷10. 10 dBm = 10 mW, 17 dBm = 50 mW, 20 dBm = 100 mW, 23 dBm = 200 mW, 30 dBm = 1 W."},
  {f:"EIRP", b:"Effective Isotropic Radiated Power = transmitter power − cable/connector loss + antenna gain (dBi). 20 dBm − 3 dB + 6 dBi = 23 dBm = 200 mW. Regulators cap EIRP per band and country."},
  {f:"RSSI", b:"Received signal strength, usually in dBm: negative, closer to 0 = stronger. −30 to −50 excellent; about −67 dBm a common voice/video target; below −80 unreliable. netsh shows it as Rssi."},
  {f:"Noise floor and SNR", b:"Noise floor = background RF on the channel (around −90 to −95 dBm when quiet). SNR = signal − noise: −65 − (−92) = 27 dB. About 25 dB+ suits voice/video; below ~10–15 dB the link struggles."},
  {f:"Five RF behaviours", b:"Absorption (water, people, concrete soak it up), reflection (metal, filmed glass → multipath), refraction (bends passing into glass/air layers), scattering (rough surfaces split it), diffraction (bends round edges → RF shadow)."},
  {f:"AP placement rules", b:"Put APs where users are, on the ceiling, below metal grids, at moderate power; don't cover rooms from corridors; survey with furniture and people present. Doubling distance costs about 6 dB."},
  {f:"Why Wi-Fi is half-duplex", b:"One channel is one shared medium (AP included), and a radio can't listen while it transmits — so it can't detect collisions. It avoids them (CSMA/CA) and confirms frames with ACKs."},
  {f:"CSMA/CA steps", b:"Listen (carrier sense + NAV) → idle for DIFS → random back-off from the contention window (freezes while others talk) → send → receiver ACKs after SIFS. No ACK → double the window, retry. RTS/CTS for hidden nodes."},
  {f:"802.11 standards", b:"b 11 Mbps 2.4 · a 54 Mbps 5 · g 54 Mbps 2.4 · n = Wi-Fi 4, 600 Mbps, 2.4 + 5 · ac = Wi-Fi 5, ~6.9 Gbps, 5 only · ax = Wi-Fi 6, ~9.6 Gbps, 2.4 + 5 (6E = 6 GHz) · be = Wi-Fi 7, 2.4/5/6."},
  {f:"Where Wi-Fi speed comes from", b:"Channel width (20/40/80/160/320 MHz), spatial streams (MIMO) and modulation (64/256/1024/4096-QAM, which needs higher SNR). 2 streams × 80 MHz × 256-QAM = 866.7 Mbps on Wi-Fi 5."},
],
});

// ---------- Module 9 · Lesson 2 ----------
L.push({
id:"wifi-channels", mins:110, level:"Intermediate · builds on lesson 1",
t:"Bands, channels and service sets — 2.4, 5 and 6 GHz, channel plans, SSIDs, BSSIDs and roaming",
html:`
${K.goals([
  "Work out any channel's centre frequency, decide whether two 2.4 GHz channels overlap, and explain why 1, 6 and 11 are the plan.",
  "Explain U-NII bands, DFS and 6 GHz, and choose a channel width by weighing speed against channels and SNR.",
  "Tell co-channel from adjacent-channel interference and plan channels for a floor and a building.",
  "Define SSID, BSSID, BSS, ESS, IBSS, MBSS and the distribution system, and read them from <code>netsh wlan</code> output.",
  "Explain roaming, and bring an AP into its ESS.",
])}
${K.pre(["Lesson 1: frequency, dBm, RSSI, noise floor and SNR, CSMA/CA, and the 802.11 standards and their bands.","Module 1: access points, SSIDs and wireless LAN controllers (WLCs) — first look.","Module 4: VLANs, access and trunk ports, PortFast, <code>show interfaces status</code>, <code>show vlan brief</code>.","Module 7 lesson 1: DHCP — how a client gets its address."])}

<h2>Why this matters at work</h2>
<p>A hotel in Victoria Island, Lagos, has fitted new access points in every corridor, all at full power. Guests complain more than before: full bars, but pages crawl and video calls freeze every evening. Nothing is broken. Every access point is on the same channel, and they spend most of their time waiting for each other to stop talking.</p>
<p>Wi-Fi is a shared radio medium (lesson 1): everything on one channel within earshot takes turns. So a wireless engineer's first questions are about <b>channels</b> — which band, which channel, how wide, who else is on it — and <b>service sets</b>: which access point is this laptop on, and is that AP part of the network it should be? This lesson gives you the rules behind both.</p>

<h2>The 2.4 GHz band: channels, overlap and why 1, 6 and 11</h2>
${K.remember(`<b>The rule:</b> a channel is named by its <b>centre frequency</b>. In the 2.4 GHz band, channel <i>n</i> is centred on <b>2407 + 5 × n ${K.g("MHz","Megahertz: a million cycles per second (lesson 1). 1 GHz = 1000 MHz.")}</b> (channel 1 = 2412, channel 6 = 2437, channel 11 = 2462). A 2.4 GHz channel is about <b>22 MHz wide</b>, but the centres are only <b>5 MHz</b> apart — so two channels overlap unless their centres are at least <b>25 MHz, five channel numbers,</b> apart.`)}
<p>Regulators set aside a few frequency ranges that anyone may use without a licence, within power limits. Wi-Fi's oldest one is the ${K.g("2.4 GHz ISM band","Industrial, Scientific and Medical band: 2.400–2.4835 GHz, usable by anyone without a licence within power limits. Wi-Fi, Bluetooth, cordless gadgets and microwave ovens all share it.")}, 2.400 to 2.4835 GHz — only 83.5 MHz of room. A <b>channel</b> is one slice of a band that an AP and its clients transmit on; its number is a short name for a frequency.</p>
<p>The trap: channel <i>numbers</i> are much closer together than channels are <i>wide</i>. The numbers step by 5 MHz, but the original ${K.g("802.11b","The 1999 Wi-Fi standard for 2.4 GHz, up to 11 Mbps (lesson 1). Still found in old scanners and sensors.")} signal (${K.g("DSSS","Direct-Sequence Spread Spectrum: the way 802.11 and 802.11b spread a signal across a channel about 22 MHz wide.")}) occupies about 22 MHz. Later standards (802.11g/n/ax, using ${K.g("OFDM","Orthogonal Frequency-Division Multiplexing: the way 802.11a/g/n/ac/ax split a channel into many narrow sub-carriers. A 2.4 GHz OFDM channel is 20 MHz wide.")}) use 20 MHz, but planning keeps the 22 MHz figure.</p>
${K.svg("0 0 760 300",
  `<line x1="136" y1="40" x2="336" y2="40" stroke="var(--accent)" stroke-width="1.4" marker-start="url(#karra)" marker-end="url(#karra)"/>`+
  `<line x1="336" y1="40" x2="536" y2="40" stroke="var(--accent)" stroke-width="1.4" marker-start="url(#karra)" marker-end="url(#karra)"/>`+
  K.txt(236,32,"25 MHz = 5 channel numbers",{mid:true,c:"accent",s:10.5})+K.txt(436,32,"25 MHz = 5 channel numbers",{mid:true,c:"accent",s:10.5})+
  [2,3,4,5,7,8,9,10,12,13].map(n=>{ const c = 96+40*n; return `<path d="M${c-88},210 C${c-48},103 ${c+48},103 ${c+88},210" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>`; }).join("")+
  [1,6,11].map(n=>{ const c = 96+40*n; return `<path d="M${c-88},210 C${c-48},37 ${c+48},37 ${c+88},210" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2.2"/>`; }).join("")+
  K.txt(136,72,"ch 1",{mid:true,c:"fg",s:12,b:true,f:"display"})+K.txt(336,72,"ch 6",{mid:true,c:"fg",s:12,b:true,f:"display"})+K.txt(536,72,"ch 11",{mid:true,c:"fg",s:12,b:true,f:"display"})+
  `<line x1="40" y1="210" x2="720" y2="210" stroke="var(--line)" stroke-width="1.4"/>`+
  [1,2,3,4,5,6,7,8,9,10,11,12,13].map(n=>K.txt(96+40*n,228,String(n),{mid:true,c:[1,6,11].includes(n)?"accent":"muted",s:10.5,b:[1,6,11].includes(n)})).join("")+
  K.txt(40,246,"2400",{mid:true,s:10})+K.txt(136,246,"2412",{mid:true,s:10})+K.txt(336,246,"2437",{mid:true,s:10})+K.txt(536,246,"2462",{mid:true,s:10})+K.txt(704,246,"2483.5",{mid:true,s:10})+
  K.txt(380,266,"channel numbers (top row) and centre frequencies in MHz: centre = 2407 + 5 × channel",{mid:true,s:10.5,f:"body"})+
  K.txt(380,288,"Solid: 1, 6 and 11 — 25 MHz apart, no overlap. Dashed: every other channel overlaps at least one of them.",{mid:true,c:"fg",s:11,f:"body"}),
  "The 2.4 GHz band: 22 MHz-wide channels on centres 5 MHz apart, so only three fit side by side. (Channel 14, 2484 MHz, is Japan-only.)")}
<h3>Worked example: do two channels overlap?</h3>
${K.steps([
  ["Channels 1 and 6", "Centres 2407 + 5 = 2412 and 2407 + 30 = 2437 MHz: 25 MHz apart. Each spreads 11 MHz either side, so channel 1 ends at 2423 and channel 6 starts at 2426. A 3 MHz gap: <b>no overlap</b>."],
  ["Channels 3 and 7", "2422 and 2442 MHz: only 20 MHz apart, four channel numbers. Channel 3 runs to 2433, channel 7 starts at 2431: <b>they overlap</b>."],
  ["The shortcut", "Subtract the channel numbers. 5 or more = clear; 4 or less = overlap. 2 and 8? 6 apart, clear. 9 and 13? 4 apart, overlap."],
])}
<h3>Why three — and only three</h3>
<p>Start at channel 1. The next clear channel is 1 + 5 = <b>6</b>, then <b>11</b>, then 16 — which doesn't exist. In practice the US and Canada use only channels 1 to 11, so 1, 6 and 11 are the <b>only</b> three that don't overlap. Much of the world allows 1 to 13, which also makes 2-7-12 or 3-8-13 possible — still only <b>three</b> at a time, and 1, 6, 11 is the plan every client supports. Japan adds channel 14 (2484 MHz, 802.11b only).</p>
${K.mistake(`Treating channel numbers as separate lanes: &ldquo;The neighbour is on 6, so I'll take 7.&rdquo; Channel 7 overlaps both 6 and 11. In 2.4 GHz, any channel that isn't five numbers from its neighbours makes interference <i>worse</i>.`)}
${K.dyk(`Microwave ovens heat food by shaking water molecules with radio energy at about 2.45 GHz — right in the middle of the Wi-Fi band. Their shielding leaks a little, so a staff kitchen beside an AP can slow 2.4 GHz Wi-Fi every lunch hour.`)}
<p>In Europe you may meet a 1-5-9-13 plan. It works only if every device uses 20 MHz OFDM (no 802.11b): the centres are 20 MHz apart, so 20 MHz channels touch edge to edge. By the 22 MHz rule they overlap, and the CCNA answer is <b>1, 6 and 11</b>.</p>
${K.drill({title:"2.4 and 5 GHz channel ↔ frequency", types:["wifichan"], count:5})}
${K.drill({title:"2.4 GHz — do these two channels overlap?", types:["wifioverlap"], count:5})}
${K.check({q:"An AP next door is on 2.4 GHz channel 4. Which channel for your AP avoids overlapping it?", o:["Channel 6 — it's a standard channel","Channel 1 — it's the lowest","Channel 9 or higher — at least five numbers away","Channel 5 — any different number"], a:2, why:"Channel 4 is centred on 2427 MHz. A channel must be at least 25 MHz (five numbers) away: 9 (2452 MHz) or above. Channels 6 and 1 are only two and three numbers away. Better still: agree 1, 6 or 11 with your neighbour."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A site survey report lists a rogue home router on 2.4 GHz channel 8, which isn't in the plan. Work it out without a table.", fields:[{label:"Centre frequency of channel 8 (MHz)", a:["2447","2447 mhz","2447mhz"]},{label:"Nearest channel BELOW 8 that does not overlap it", a:["3","ch 3","channel 3"]},{label:"Which of 1, 6, 11 does channel 8 overlap? (list them)", a:["6 and 11","6, 11","6,11","11 and 6","6 & 11","6 11","11, 6","11,6"]}], why:"1. What is asked? A centre frequency and two overlap answers. 2. Which rule? Centre = 2407 + 5n; two channels overlap unless they are five or more channel numbers apart. 3. Apply it: 2407 + 5 × 8 = 2447 MHz. Going down, 8 − 5 = 3 is the nearest clear channel: it is centred on 2422 MHz, exactly 25 MHz below 2447. Channel 6 is 2 numbers away and 11 is 3 away, so channel 8 overlaps both — and it does the most damage to the two busiest channels of a 1/6/11 plan."})}

<h2>5 GHz and 6 GHz: more room, different rules</h2>
${K.remember(`<b>The rules:</b> in <b>5 GHz</b>, channel <i>n</i> is centred on <b>5000 + 5 × n MHz</b> (36 = 5180, 149 = 5745). The usable channel numbers step by <b>4</b> — 36, 40, 44 … — which is 20 MHz, so neighbouring 20 MHz channels sit side by side and <b>never overlap</b>. In <b>6 GHz</b>, channel <i>n</i> is centred on <b>5950 + 5 × n MHz</b>, numbered 1, 5, 9 … 233: <b>59</b> channels of 20 MHz where the whole band is open.`)}
<p>The 5 GHz band isn't one block but several sub-bands with different rules. The US regulator, the ${K.g("FCC","Federal Communications Commission: the US radio regulator. Other countries have their own regulators; Europe's Wi-Fi rules are written as ETSI standards.")}, calls them ${K.g("U-NII","Unlicensed National Information Infrastructure: the FCC's names for the sub-bands Wi-Fi may use at 5 GHz (U-NII-1 to U-NII-3) and 6 GHz (U-NII-5 to U-NII-8). Other regions group them similarly with their own rules.")} bands, and the CCNA uses those names:</p>
${K.svg("0 0 760 232",
  K.txt(40,22,"5 GHz — U-NII sub-bands and 20 MHz channels (US rules; other countries allow different subsets)",{c:"fg",s:11,f:"body",b:true})+
  K.band(40,34,96,28,"U-NII-1","var(--chip)")+K.band(136,34,96,28,"U-NII-2A","var(--chip)")+K.band(232,34,115,28,"not Wi-Fi","var(--panel2)")+K.band(347,34,245,28,"U-NII-2C (extended)","var(--chip)")+K.band(592,34,120,28,"U-NII-3","var(--chip)")+
  K.txt(88,80,"36 40 44 48",{mid:true,c:"fg",s:10.5})+K.txt(184,80,"52 56 60 64",{mid:true,c:"fg",s:10.5})+K.txt(470,80,"100 104 … 140 144",{mid:true,c:"fg",s:10.5})+K.txt(652,80,"149 … 161 165",{mid:true,c:"fg",s:10.5})+
  K.txt(88,96,"no radar rules",{mid:true,s:10,f:"body"})+K.txt(184,96,"DFS",{mid:true,c:"warn",s:10.5,b:true})+K.txt(470,96,"DFS",{mid:true,c:"warn",s:10.5,b:true})+K.txt(652,96,"no radar rules",{mid:true,s:10,f:"body"})+
  K.txt(40,114,"5150",{mid:true,s:9.5})+K.txt(136,114,"5250",{mid:true,s:9.5})+K.txt(232,114,"5350",{mid:true,s:9.5})+K.txt(347,114,"5470",{mid:true,s:9.5})+K.txt(592,114,"5725",{mid:true,s:9.5})+K.txt(712,114,"5850",{mid:true,s:9.5})+
  K.txt(40,146,"6 GHz — Wi-Fi 6E and Wi-Fi 7 only (drawn to a smaller scale: this band is wider than all of 5 GHz)",{c:"fg",s:11,f:"body",b:true})+
  K.band(40,158,672,28,"channels 1, 5, 9 … 233 · 59 × 20 MHz · WPA3 or OWE only","var(--chip)")+
  K.txt(40,202,"5925",{mid:true,s:9.5})+K.txt(712,202,"7125 MHz",{mid:true,s:9.5})+
  K.txt(380,222,"Channel numbers step by 4 (= 20 MHz), so 20 MHz channels in 5 and 6 GHz sit side by side without overlapping.",{mid:true,s:10.5,f:"body"}),
  "The 5 GHz sub-bands (frequencies in MHz) and the 6 GHz band. U-NII-2A and 2C share the air with radar.")}
<p>That is about <b>25</b> non-overlapping 20 MHz channels in the US, against three in 2.4 GHz; the exact list depends on the country and on whether you use the radar channels. U-NII-1 (36–48) is the one every 5 GHz client supports.</p>
<h3>DFS: sharing with radar</h3>
<p>Weather and military radars also use parts of 5 GHz, so there the rules require ${K.g("DFS","Dynamic Frequency Selection: on 5 GHz channels shared with radar (U-NII-2A and 2C), an AP must check the channel is free of radar before using it and leave it if radar appears.")}: an AP listens for radar before using the channel (typically a minute), and if radar appears it must move its clients off and avoid the channel for a while (typically 30 minutes) — a short drop for users. Near airports and weather stations, engineers often skip DFS channels, leaving fewer to plan with.</p>
<h3>6 GHz: a clean new band</h3>
<p>Opened from 2020 (all of 5925–7125 MHz in the US; many countries opened only the lower 500 MHz, about 24 channels of 20 MHz), 6 GHz is used only by Wi-Fi 6E and Wi-Fi 7 devices (lesson 1). That brings lots of room, <b>no old clients</b> dragging rates down, and stricter security: <b>only WPA3 or ${K.g("OWE","Opportunistic Wireless Encryption, sold as Wi-Fi Enhanced Open: encrypts an open (password-free) network. Lesson 6.")}</b>, never WPA2 (lesson 6). The cost: only new devices can use it, and walls absorb a little more at higher frequencies, so cells are slightly smaller.</p>
${K.dyk(`6 GHz has so many channels that a client scanning them all would waste seconds. So the standard marks 15 <b>preferred scanning channels</b> (5, 21, 37 … 229), and 6 GHz APs also announce themselves on 2.4 and 5 GHz.`)}
${K.when([
  ["2.4 GHz","Every device must connect, including old scanners and IoT sensors","Every Wi-Fi device speaks it; it reaches further","You need capacity: 3 channels, shared with Bluetooth and microwaves"],
  ["5 GHz","Laptops and phones in an office, school or hotel","About 25 channels, little non-Wi-Fi noise","Radar sites (DFS channels drop out), or 2.4-only clients"],
  ["6 GHz","Dense rooms full of Wi-Fi 6E/7 devices","59 channels, no legacy clients, WPA3 everywhere","Most devices are older, or your country hasn't opened it"],
], "Which band — and why")}
${K.check({q:"A 5 GHz AP is on channel 100. What is its centre frequency, and what must it do if a radar starts transmitting nearby?", o:["5100 MHz — nothing, 5 GHz has no radar rules","5500 MHz — it must leave the channel, because 100 is a DFS channel","5500 MHz — it must lower its power but stay","2.4 GHz channel 100 does not exist, so the question is wrong"], a:1, why:"5000 + 5 × 100 = 5500 MHz, in U-NII-2C. Channels 52–144 are DFS channels: on detecting radar the AP must move its clients to another channel and avoid this one for a period."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A spectrum report lists centre frequencies only. Match each one with its channel and what it means for planning.", pairs:[["5745 MHz","5 GHz channel 149 — U-NII-3, no DFS in the US"],["5260 MHz","5 GHz channel 52 — U-NII-2A, DFS"],["2462 MHz","2.4 GHz channel 11 — one of the three clear channels"],["5975 MHz","6 GHz channel 5 — Wi-Fi 6E/7 only, WPA3"],["2432 MHz","2.4 GHz channel 5 — overlaps 1 and 6"]], why:"1. What is asked? Turn a frequency into a channel and band. 2. Which rule? 2.4 GHz: (f − 2407) ÷ 5; 5 GHz: (f − 5000) ÷ 5; 6 GHz: (f − 5950) ÷ 5 — the frequency tells you the band first. 3. Apply it: 5745 → 149; 5260 → 52 (DFS); 2462 → 11; 5975 is above 5925, so 6 GHz: (5975 − 5950) ÷ 5 = 5; 2432 → 5, which is only four numbers from 1 and one from 6."})}

<h2>Channel width: speed versus room</h2>
${K.remember(`<b>The rule:</b> ${K.g("802.11n","Wi-Fi 4 (lesson 1): the 2009 standard that introduced channel bonding (40 MHz) and multiple antennas, on 2.4 and 5 GHz.")} and later can <b>bond</b> neighbouring 20 MHz channels into one wider channel — 40, 80, 160 and (Wi-Fi 7, 6 GHz) 320 MHz. Each doubling of width roughly <b>doubles the peak data rate</b>, but <b>halves the number of channels</b> you can plan with and lets in <b>twice the noise</b> — the noise floor rises about 3 dB, so the SNR (lesson 1) falls about 3 dB.`)}
${K.svg("0 0 760 240",
  K.txt(380,20,"Bonding in U-NII-1 and U-NII-2A: wider channels, fewer of them",{mid:true,c:"fg",s:11.5,f:"body",b:true})+
  K.txt(16,61,"20 MHz",{c:"fg",s:11,b:true,f:"body"})+K.txt(16,105,"40 MHz",{c:"fg",s:11,b:true,f:"body"})+K.txt(16,149,"80 MHz",{c:"fg",s:11,b:true,f:"body"})+K.txt(16,193,"160 MHz",{c:"fg",s:11,b:true,f:"body"})+
  [36,40,44,48,52,56,60,64].map((c,i)=>K.band(112+i*76,40,72,32,String(c),"var(--chip)")).join("")+
  ["36+40","44+48","52+56","60+64"].map((c,i)=>K.band(112+i*152,84,148,32,c,"var(--chip)")).join("")+
  ["36 – 48","52 – 64"].map((c,i)=>K.band(112+i*304,128,300,32,c,"var(--chip)")).join("")+
  K.band(112,172,604,32,"36 – 64 (one channel)","var(--chip)")+
  K.txt(380,226,"Each doubling: about twice the peak speed, half as many channels, about 3 dB more noise.",{mid:true,s:11,f:"body"}),
  "The same 160 MHz as eight 20 MHz channels, four 40s, two 80s or one 160.")}
<div class="tablewrap"><table>
<tr><th>Width</th><th>2.4 GHz (1–11)</th><th>5 GHz (US, with DFS)</th><th>6 GHz (US)</th></tr>
<tr><td>20 MHz</td><td>3</td><td>25</td><td>59</td></tr>
<tr><td>40 MHz</td><td>1 at most — don't</td><td>12</td><td>29</td></tr>
<tr><td>80 MHz</td><td>—</td><td>6</td><td>14</td></tr>
<tr><td>160 MHz</td><td>—</td><td>2</td><td>7</td></tr>
<tr><td>320 MHz (Wi-Fi 7)</td><td>—</td><td>—</td><td>3 that don't overlap</td></tr>
</table></div>
<p>Two consequences follow. <b>2.4 GHz stays at 20 MHz</b>: a 40 MHz channel uses two of the three clear channels. And in 5 GHz the right width depends on <b>how many APs hear each other</b>: three APs in a small office can each have their own 80 MHz channel; forty APs on 80 MHz share six channels, and the &ldquo;faster&rdquo; setting makes everyone slower.</p>
${K.when([
  ["20 MHz","2.4 GHz always; very dense 5 GHz","The most channels and the best SNR","Few APs and a need for top speed per client"],
  ["40 MHz","Typical enterprise 5 GHz","Twice the speed, still 12 channels","2.4 GHz — never"],
  ["80 MHz","Small sites on 5 GHz; most 6 GHz designs","High per-client speed where few APs share the air","Dense 5 GHz: only 6 channels"],
  ["160 / 320 MHz","Few APs, capable clients — mostly 6 GHz","Highest peak rates","Anywhere APs must share channels"],
], "Which channel width — and why")}
${K.case("The warehouse that went 80 MHz",`
<p>A distribution centre ran 34 ceiling APs on 5 GHz for handheld barcode scanners. A contractor upgraded the AP software and, to &ldquo;speed things up&rdquo;, set every radio to 80 MHz. By Monday each scan took two or three seconds to confirm, and the backlog grew by a lorry-load a day.</p>
<p><b>Why.</b> Scanners send tiny messages and gain nothing from a wide channel. But without DFS (the site is near an airfield) 80 MHz leaves only two channels, so the APs within earshot of each other piled onto the same channel and every scan queued for airtime. The noise floor also rose about 6 dB against 20 MHz, so distant scanners fell to slower rates and retried more.</p>
<p><b>The fix.</b> Back to 20 MHz: nine non-DFS channels (36–48 and 149–165), so neighbours no longer shared. Scans confirmed in under half a second again. The whiteboard lesson: <i>wide channels for few APs and big downloads; many APs and small messages want narrow ones.</i></p>`)}
${K.check({q:"An office changes its 5 GHz APs from 20 MHz to 40 MHz channels. Which outcome is expected?", o:["Twice the peak speed, the same number of channels and the same SNR","Roughly twice the peak speed, half as many channels to plan with, and about 3 dB lower SNR","No change in speed, because 5 GHz channels already don't overlap","Half the speed, because bonded channels interfere with each other"], a:1, why:"Bonding two 20 MHz channels roughly doubles the peak rate, but uses up two channels for one AP and lets in twice the noise — about +3 dB on the noise floor, so SNR falls about 3 dB."})}
<h3>Same logic, new situation</h3>
<p>A new Kano office has 12 APs on one open-plan floor, most of them able to hear six or more of the others. The client fleet is all Wi-Fi 6 laptops (5 GHz, no 6 GHz radios), and the site avoids DFS channels. The vendor's default is 80 MHz. Keep it, or change it?</p>
${K.hint(`Count the non-DFS 5 GHz channels at each width, then compare with how many APs hear each other.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> A width for 12 APs that hear each other. <b>2. Which rule?</b> Each doubling halves the channels; APs that hear each other on one channel share its airtime. <b>3. Apply it:</b> without DFS, 5 GHz has 9 channels at 20 MHz (36–48, 149–165), 4 at 40 MHz and 2 at 80 MHz (36–48 and 149–161). At 80 MHz, 12 APs share two channels — six on each, all within earshot. At 40 MHz, three per channel; at 20 MHz, every AP's neighbours can be on different channels. Change it to <b>40 MHz</b> if per-laptop speed matters and the cells are small, or <b>20 MHz</b> if the floor is very dense — and consider enabling the DFS channels if no radar is nearby, which roughly triples the choice.</p>`)}

<h2>Interference and the channel plan: CCI, ACI and cell overlap</h2>
${K.remember(`<b>The rules:</b> <b>co-channel interference (CCI)</b> = APs and clients on the <b>same</b> channel hear each other, so CSMA/CA makes them <b>take turns</b>: they share one channel's airtime. <b>Adjacent-channel interference (ACI)</b> = <b>overlapping</b> channels (1 and 3): each hears the other only as noise, so they <b>don't</b> wait their turn, and frames collide and are resent. ACI is worse than CCI. A channel plan gives every AP a channel that none of its neighbours uses — while the cells still <b>overlap enough to roam</b>.`)}
<p>Under ${K.g("CSMA/CA","Carrier Sense Multiple Access with Collision Avoidance (lesson 1): a Wi-Fi radio listens before it transmits and waits while the channel is busy.")} a radio that hears another 802.11 transmission on its channel waits. That one fact explains both kinds of interference.</p>
<ul>
<li><b>${K.g("CCI","Co-channel interference: two or more cells on the same channel hear each other, so their devices share one channel's airtime by taking turns.")}</b> — two APs on channel 6 that hear each other share one channel's airtime. Nothing is corrupted; everyone waits longer.</li>
<li><b>${K.g("ACI","Adjacent-channel interference: cells on overlapping channels (in 2.4 GHz, fewer than five numbers apart) see each other's signals as noise, transmit over each other, and lose frames.")}</b> — APs on 1 and 3 can't decode each other, so each sees the other as noise and transmits anyway. Frames are damaged, SNR falls and retries climb — which is why &ldquo;channel 3, to avoid 1 and 6&rdquo; is the worst choice of all.</li>
<li><b>Non-Wi-Fi interference</b> — Bluetooth, microwave ovens and wireless cameras don't use CSMA/CA; Wi-Fi just sees noise.</li>
</ul>
${K.svg("0 0 760 372",
  K.txt(190,16,"One floor: a 1/6/11 plan — no neighbouring cells share a channel",{mid:true,c:"fg",s:11,f:"body",b:true})+
  [[190,185,1],[298,185,6],[244,278.5,11],[136,278.5,6],[82,185,11],[136,91.5,6],[244,91.5,11]].map(([x,y,ch])=>`<circle cx="${x}" cy="${y}" r="62" fill="var(--accent)" fill-opacity="${ch===1?0.16:ch===6?0.08:0.03}" stroke="var(--accent)" stroke-width="1.2"/>`).join("")+
  [[190,185,1],[298,185,6],[244,278.5,11],[136,278.5,6],[82,185,11],[136,91.5,6],[244,91.5,11]].map(([x,y,ch])=>K.dev("ap",x,y-14)+K.txt(x,y+22,"ch "+ch,{mid:true,c:"fg",s:13,b:true,f:"display"})).join("")+
  K.txt(190,362,"The circles overlap a little at the edges: that is where a client roams.",{mid:true,s:10.5,f:"body"})+
  K.txt(580,16,"Several floors: plan in 3D",{mid:true,c:"fg",s:11,f:"body",b:true})+
  [["Floor 3",50,[6,11,1]],["Floor 2",145,[1,6,11]],["Floor 1",240,[11,1,6]]].map(([f,y,chs])=>K.box(430,y,300,82,"","")+K.txt(442,y+18,f,{c:"fg",s:11,b:true,f:"body"})+chs.map((ch,i)=>K.dev("ap",510+i*85,y+42)+K.txt(510+i*85,y+72,"ch "+ch,{mid:true,c:"fg",s:11.5,b:true,f:"display"})).join("")).join("")+
  K.txt(580,344,"The AP directly above or below is a neighbour too:",{mid:true,s:10.5,f:"body"})+
  K.txt(580,360,"no column of APs repeats a channel.",{mid:true,s:10.5,f:"body"}),
  "Left: a 1/6/11 honeycomb — each cell's six neighbours use the other two channels. Right: the same rule through the floors.")}
<h3>Cell overlap: enough to roam, not so much it hurts</h3>
<p>Each AP's coverage area is its <b>cell</b>. Cells must overlap at their edges, or a walking user drops between them. Design guides commonly aim for roughly <b>10–20 % overlap</b> (towards 20 % for voice, measured at the signal strength the clients need — for voice, a widely used target is about −67 dBm). Too little: dropped calls. Too much — full power, or APs packed too densely — and every AP hears others on its channel: CCI. Engineers turn <b>power down</b> as often as up.</p>
<p>On a Cisco WLC you rarely set channels by hand: ${K.g("RRM","Radio Resource Management: the WLC feature that measures what every AP hears and automatically chooses each AP's channel (Dynamic Channel Assignment) and transmit power (Transmit Power Control). Lesson 3.")} measures what every AP hears and picks channels and power for you. You still need the logic to judge its choices.</p>
<h3>Worked example: plan a corridor of six APs</h3>
${K.steps([
  ["Draw who hears whom", "AP-A to AP-F in a line down a hotel corridor, each hearing only the next one or two along."],
  ["2.4 GHz: rotate 1, 6, 11", "A=1, B=6, C=11, D=1, E=6, F=11. A and D share channel 1, but three APs apart they barely hear each other."],
  ["5 GHz: use the room", "A=36, B=149, C=44, D=157, E=40, F=153 (20 MHz, non-DFS): no two APs in earshot share a channel."],
  ["Check the floors above and below", "The AP above A must not be on 1 or 36. Shift the pattern by one on each floor — the 3D rule."],
])}
${K.drill({title:"channel plan — non-overlapping or not?", types:["wifiplan"], count:5})}
${K.job("“Hotel Wi-Fi crawls every evening — full bars, nothing loads”",`
<p><b>The ticket.</b> 19:40, front desk of a 9-floor hotel on Victoria Island: &ldquo;Floors 4–7: full bars but too slow for video calls. Worse since the new APs.&rdquo; In the daytime, half empty, nobody complains.</p>
<p><b>Questions first.</b> Evenings only, when the rooms are full; strong signal, so not coverage. What changed? The installer fitted 36 corridor APs last month and &ldquo;set them all to the best channel&rdquo;.</p>
<p><b>Checks.</b> From a laptop in room 512, every ${K.g("BSSID","Basic Service Set Identifier: the MAC address that names one AP radio's cell for one SSID — next section.")} it can hear (real Windows output, trimmed):</p>
${K.out(`C:\\Users\\it-duty>netsh wlan show networks mode=bssid
Interface name : Wi-Fi
There are 1 networks currently visible.

SSID 1 : Guest-WiFi
    Network type            : Infrastructure
    Authentication          : WPA2-Personal
    Encryption              : CCMP
    BSSID 1                 : 0c:d0:f8:31:a4:10
         Signal             : 92%
         Radio type         : 802.11n
         Band               : 2.4 GHz
         Channel            : 6
    BSSID 2                 : 0c:d0:f8:31:b2:70
         Signal             : 81%
         Radio type         : 802.11n
         Band               : 2.4 GHz
         Channel            : 6
    BSSID 3                 : 0c:d0:f8:31:c9:30
         Signal             : 74%
         Radio type         : 802.11n
         Band               : 2.4 GHz
         Channel            : 6 `, "Three APs — this corridor's and the floors above and below — all strong, all on channel 6, and no 5 GHz BSSIDs at all: the 5 GHz radios were switched off at installation.")}
<p><b>Diagnosis.</b> Co-channel interference: a whole block of the hotel shares one channel's airtime, and at 19:00, with 200 phones streaming, each gets a sliver.</p>
<p><b>Fix</b> (agreed with the hotel's IT manager for 23:00): 5 GHz radios on at 20 MHz, with the controller's RRM choosing channels and power; in 2.4 GHz, 1/6/11 staggered between floors at lower power. Next morning the same laptop sees each nearby 2.4 GHz BSSID on a different channel, and most phones on 5 GHz.</p>
<p><b>What you say</b> to the duty manager: &ldquo;The new access points were all on one radio channel, queueing behind each other. They're now spread out and the faster band is on. I'll check evening speeds at 20:00.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Floors 4–7 slow evenings. Cause: all 36 APs 2.4 GHz ch 6, max power; 5 GHz radios off since install. 23:05: 5 GHz on (20 MHz, RRM), 2.4 GHz 1/6/11 staggered by floor, power reduced. Room 512: nearby 2.4 GHz BSSIDs now on 1/6/11, 5 GHz visible. Re-test 20:00.&rdquo;</i></p>`)}
${K.tip(`Any Windows laptop is a free first survey tool: <code>netsh wlan show networks mode=bssid</code> lists every BSSID it hears with its signal, band and channel. Several strong BSSIDs on one channel means CCI; strong ones on nearby 2.4 GHz channels (such as 6 and 8) means ACI.`)}
${K.check({q:"Two neighbouring APs are on 2.4 GHz channels 1 and 3. Users on both are slow, with many retries. What is happening?", o:["Co-channel interference: they take turns, so each gets half the airtime","Adjacent-channel interference: the channels overlap, each sees the other as noise, and frames collide","No interference — 1 and 3 are different channels","Interference only from microwave ovens"], a:1, why:"1 and 3 are only two numbers apart, so they overlap. The radios can't decode each other's frames, so CSMA/CA doesn't make them wait; they transmit over each other and frames are lost. Moving the second AP to 6 or 11 cures it."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A school's three-storey block has one 2.4 GHz AP per classroom. On every floor the plan along the corridor is 1, 6, 11, 1, 6, 11 — identical on all three floors. Teachers say Wi-Fi is worst in the middle floor. Which two statements explain it or fix it? (Choose two.)", o:["Every middle-floor AP has the same channel directly above and below it, so it suffers co-channel interference from both floors","Using channels 3 and 8 in between would add capacity","Shifting the pattern by one channel on each floor (e.g. 6, 11, 1 … upstairs) removes the vertical repeats","Raising every AP to full power would drown out the interference","Changing to 40 MHz channels in 2.4 GHz would add capacity"], a:[0,2], why:"1. What is asked? Why the middle floor suffers and what fixes it. 2. Which rules? CCI comes from any AP on the same channel within earshot — up and down too; ACI from overlapping channels. 3. Apply them: with identical floors, each middle-floor AP has a same-channel AP above and below. Staggering the pattern between floors fixes it. Channels 3 and 8 would add ACI; full power adds more CCI; 40 MHz in 2.4 GHz uses two of the three channels."})}

<h2>Service sets: SSIDs, BSSIDs and the distribution system</h2>
${K.remember(`<b>The rules:</b> the <b>SSID</b> is the network's <i>name</i> (up to 32 bytes, case-sensitive). The <b>BSSID</b> is the <i>MAC address</i> that identifies one AP radio's cell for one SSID. One AP and its clients = a <b>BSS</b> (basic service set), covering a <b>BSA</b> (basic service area), its cell. Several BSSs with the <b>same SSID</b>, joined by the wired <b>distribution system (DS)</b>, = an <b>ESS</b> (extended service set) — which is what lets a client roam. No AP at all = an <b>IBSS</b> (independent basic service set: ad hoc). APs joined by radio backhaul = an <b>MBSS</b> (mesh basic service set).`)}
<p>Module 1 introduced the ${K.g("SSID","Service Set Identifier: the Wi-Fi network's name, up to 32 bytes, case-sensitive — e.g. Ward-Staff.")} as the network name. 802.11 calls each group of devices sharing a wireless network a <b>service set</b>, and the CCNA expects you to name each kind exactly.</p>
${K.svg("0 0 760 336",
  K.txt(105,26,"IBSS (ad hoc)",{mid:true,c:"fg",s:12,b:true,f:"display"})+K.txt(105,42,"no AP — clients talk directly",{mid:true,s:10.5,f:"body"})+
  K.dev("laptop",62,170,"LAPTOP-A")+K.dev("laptop",150,170,"LAPTOP-B")+K.link(86,166,126,166,"",true)+
  K.txt(105,290,"rare in business networks",{mid:true,s:10.5,f:"body"})+
  K.txt(320,26,"BSS",{mid:true,c:"fg",s:12,b:true,f:"display"})+K.txt(320,42,"one AP + its associated clients",{mid:true,s:10.5,f:"body"})+
  `<circle cx="320" cy="175" r="92" fill="var(--accent)" fill-opacity="0.06" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 4"/>`+
  K.dev("ap",320,104,"AP-1","BSSID 00:3a:9a:41:7c:20")+K.dev("laptop",274,222,"")+K.dev("laptop",366,222,"")+
  K.link(306,158,282,204,"",true)+K.link(334,158,358,204,"",true)+
  K.txt(320,290,"BSA = the cell the AP covers",{mid:true,s:10.5,f:"body"})+
  K.txt(600,26,"ESS",{mid:true,c:"fg",s:12,b:true,f:"display"})+K.txt(600,42,"two BSSs, one SSID, joined by the DS",{mid:true,s:10.5,f:"body"})+
  K.dev("ap",500,72,"AP-2","…:7c:30 · ch 36")+K.dev("ap",700,72,"AP-3","…:e1:40 · ch 149")+
  K.dev("switch",600,262,"DS","the wired LAN")+K.link(502,126,586,250)+K.link(698,126,614,250)+
  K.dev("laptop",600,192,"")+K.link(578,184,532,130,"",true)+K.arrow(622,184,668,130,"",true)+K.txt(640,152,"roams",{end:true,c:"accent",s:10.5,f:"body"})+
  K.txt(600,328,"SSID 'Clinic-Staff' on both APs · same VLAN behind them",{mid:true,s:10.5,f:"body"}),
  "Service sets. A BSS is one AP's cell, identified by its BSSID; an ESS is several BSSs with the same SSID linked by the distribution system.")}
<div class="tablewrap"><table>
<tr><th>Term</th><th>What it is</th><th>How you'd spot it</th></tr>
<tr><td><b>BSSID</b></td><td>The MAC address naming one BSS</td><td><code>AP BSSID</code> in netsh</td></tr>
<tr><td><b>BSS</b> / BSA</td><td>One AP and its clients / the area it covers (the cell)</td><td>One BSSID with its clients</td></tr>
<tr><td><b>DS</b></td><td>The switches and VLANs linking the APs to each other and the LAN</td><td>AP switch ports, the WLC's trunk</td></tr>
<tr><td><b>ESS</b></td><td>Several BSSs with one SSID over a common DS</td><td>Same SSID, different BSSIDs</td></tr>
<tr><td><b>IBSS</b></td><td>Ad hoc: devices talk to each other with no AP</td><td><code>Network type : Adhoc</code></td></tr>
<tr><td><b>MBSS</b></td><td>Mesh: APs relay each other's traffic by radio; root APs are wired</td><td>Car parks, places cables can't reach</td></tr>
</table></div>
<h3>One AP, several BSSIDs</h3>
<p>An AP that offers two SSIDs (Staff and Guest) on two radios (2.4 and 5 GHz) runs <b>four</b> BSSs, each with its own BSSID, usually its radio's base MAC with the last digits counted up. Each SSID sends its own ${K.g("beacons","Short frames an AP broadcasts about ten times a second for every SSID on every radio, announcing the SSID, supported rates and security so clients can find it.")} about ten times a second at a slow rate, so every extra SSID costs airtime. Keep SSIDs few — three or four per radio is a common ceiling.</p>
${K.out(`C:\\Users\\amaka>netsh wlan show interfaces

There is 1 interface on the system:

    Name                   : Wi-Fi
    Description            : Intel(R) Wi-Fi 6E AX211 160MHz
    GUID                   : 3f2a9c4e-1b7d-4e21-9a55-0c6e8f1d2b47
    Physical address       : 02:1a:2b:3c:4d:5e
    Interface type         : Primary
    State                  : connected
    SSID                   : Clinic-Staff
    AP BSSID               : 00:3a:9a:41:7c:30
    Band                   : 5 GHz
    Channel                : 36
    Network type           : Infrastructure
    Radio type             : 802.11ac
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Signal                 : 88%
    Rssi                   : -49
    Profile                : Clinic-Staff `, "Windows 11, trimmed. Network type Infrastructure = a BSS with an AP (an IBSS shows Adhoc).")}
<p>Read it as answers: <i>which network?</i> (SSID), <i>which AP?</i> (AP BSSID), <i>where?</i> (Band, Channel), <i>how well?</i> (Signal, ${K.g("Rssi","Received Signal Strength Indicator (lesson 1): the received signal in dBm, e.g. −49; closer to 0 is stronger.")}). Same SSID but different BSSIDs on two laptops = same ESS, different BSSs.</p>
${K.myth([
  ["Hiding the SSID (not broadcasting it) secures the network.","The name still travels in clear text whenever a client connects, so any scanner shows it. Security comes from WPA2/WPA3 (lesson 6)."],
  ["The SSID and the BSSID are two names for the same thing.","The SSID is the network's name and can be shared by hundreds of APs; the BSSID is a MAC address unique to one AP radio's cell for that SSID."],
  ["Two APs with the same SSID will interfere with each other.","Sharing an SSID is what makes an ESS. Interference depends on channels, not names."],
  ["More SSIDs means more capacity.","Each SSID adds its own beacons on every channel, using airtime. Capacity comes from more channels and well-placed APs."],
])}
<p>APs can also play other roles: a <b>repeater</b> retransmits a BSS to extend it (with one radio, roughly halving throughput); a <b>workgroup bridge</b> joins a WLAN as a client on behalf of wired devices plugged into it; an <b>outdoor bridge</b> links buildings with directional antennas.</p>
<h3>The distribution system is your wired network</h3>
<p>The DS is the switches, VLANs and trunks behind the APs. For the <b>${K.g("local-mode","The normal mode of a lightweight AP: all client traffic travels inside CAPWAP to the WLC. Lesson 3 covers the other modes.")}</b> APs in this module, each AP's switch port is an <b>access port</b> in the AP VLAN: the AP takes its address there and carries client traffic inside its CAPWAP tunnel (Module 1) to the WLC, which puts it on the client's VLAN (lesson 4 covers when an AP needs a trunk). An AP in the wrong VLAN never reaches its controller — so it is not part of the ESS.</p>
${K.out(`ACC-1F(config)#interface GigabitEthernet1/0/14
ACC-1F(config-if)#description AP-1F-RECEPTION
ACC-1F(config-if)#switchport mode access
ACC-1F(config-if)#switchport access vlan 10
ACC-1F(config-if)#spanning-tree portfast
ACC-1F(config-if)#end
ACC-1F#show interfaces status | include AP-
Gi1/0/14  AP-1F-RECEPTION    connected    10         a-full a-1000 10/100/1000BaseTX`, "One AP port on a Catalyst 9200: access port in the AP VLAN, PortFast (Module 4) so the AP gets DHCP without waiting for Spanning Tree.")}
<h3>Try it: wire the distribution system for a new wing</h3>
<p>A conference centre's new second floor gets four local-mode APs. Design: VLAN 10 <code>AP-MGMT</code>; Gi0/1–Gi0/4 access ports in VLAN 10 with PortFast, each described with its AP's name; uplink Gi0/8 a trunk for VLANs 10 and 99.</p>
${K.term({env:"ios2", title:"CC-F2-SW1 — AP ports for the second floor", opts:{kind:"switch", host:"CC-F2-SW1", model:"C9200L-24P-4G", motd:"CC-F2-SW1 — console session (lab switch, no enable secret)."},
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. <code>interface range g0/1 - 4</code> configures the four AP ports at once (Module 4). Verify with <code>show interfaces status</code> and <code>show interfaces trunk</code>.",
  tasks:[
    {text:"Create VLAN 10 named <code>AP-MGMT</code>", done:e=>e.vlans[10]==="AP-MGMT"},
    {text:"Gi0/1–Gi0/4: access ports in VLAN 10 with PortFast", done:e=>[1,2,3,4].every(n=>{ const i=e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===10 && i.stp && i.stp.portfast; })},
    {text:"Give each AP port a description naming its AP (for example <code>AP-F2-HALL-A</code>) — the next engineer reads these in <code>show interfaces status</code>", done:e=>[1,2,3,4].every(n=>/AP/i.test(e.intfs["GigabitEthernet0/"+n].desc||"")) && new Set([1,2,3,4].map(n=>e.intfs["GigabitEthernet0/"+n].desc)).size===4},
    {text:"Uplink Gi0/8: a trunk allowing VLANs 10 and 99", done:e=>{ const i=e.intfs["GigabitEthernet0/8"]; return i.mode==="trunk" && Array.isArray(i.allowed) && i.allowed.includes(10) && i.allowed.includes(99); }},
    {text:"<code>end</code>, check <code>show interfaces status</code> and <code>show interfaces trunk</code>, then save with <code>copy running-config startup-config</code>", done:e=>e.history.some(h=>/^\s*sh\S*\s+int\S*\s+stat/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+int\S*\s+trunk/i.test(h)) && !!e.savedOnce},
  ],
  win:"The second floor's distribution system is ready: four described access ports in the AP VLAN with PortFast, and an uplink trunk carrying the AP and management VLANs. When the APs are plugged in they will lease addresses in VLAN 10, find the controller and join the ESS.",
  solve:["enable","configure terminal","vlan 10","name AP-MGMT","exit","interface range g0/1 - 4","switchport mode access","switchport access vlan 10","spanning-tree portfast","exit","interface g0/1","description AP-F2-HALL-A","interface g0/2","description AP-F2-HALL-B","interface g0/3","description AP-F2-FOYER","interface g0/4","description AP-F2-CAFE","interface g0/8","switchport mode trunk","switchport trunk allowed vlan 10,99","end","show interfaces status","show interfaces trunk","copy running-config startup-config",""]})}
${K.hint(`<code>description</code> under one interface at a time gives each port its own name. <code>switchport trunk allowed vlan 10,99</code> sets the list in one go. <code>copy running-config startup-config</code> asks for a file name — press Enter for the default.`)}
${K.check({q:"Two laptops in the same office both show SSID Clinic-Staff, but one shows AP BSSID 00:3a:9a:41:7c:30 on channel 36 and the other 00:3a:9a:52:e1:40 on channel 149. What does that tell you?", o:["They are on two different networks with the same name by coincidence","They are in the same ESS but different BSSs — attached to different AP radios","They are in an IBSS","One of them is connected to a rogue AP, because BSSIDs must match"], a:1, why:"Same SSID, different BSSIDs = different BSSs of one ESS, which is normal in any office with more than one AP. Different channels are what a good plan gives neighbouring APs. (A different BSSID alone doesn't prove a rogue — lesson 6 covers how you'd tell.)"})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Five things a field engineer sees on a site visit. Match each with the service-set term it shows.", pairs:[["Two tablets share photos over Wi-Fi in a field with no AP; netsh says Network type : Adhoc","IBSS"],["A car-park AP has no cable — it relays its clients' traffic by radio to a wired AP on the building","MBSS"],["Thirty APs across a campus all offer SSID Uni-Staff, and laptops keep their address as staff walk between buildings","ESS"],["netsh shows AP BSSID 70:1f:53:aa:10:2f for the laptop on the second floor","The BSS the laptop is in"],["The switches and VLAN behind the APs that carry traffic between them and the rest of the LAN","Distribution system"]], why:"1. What is asked? The right service-set term for each picture. 2. Which rules? No AP = IBSS; APs linked by radio = MBSS; one SSID over many BSSs joined by the DS = ESS; a BSSID names one BSS; the DS is the wired network behind the APs. 3. Apply them one at a time — the clue is always whether there is an AP, how APs are linked, and whether the name or the MAC is being shown."})}

<h2>Roaming through an ESS — and a floor that wasn't in it</h2>
${K.remember(`<b>The rule:</b> roaming is the <b>client's</b> decision. When its signal or SNR from the current AP gets poor, it looks for another BSSID with the <b>same SSID and security</b>, picks a better one and <b>reassociates</b>. If the new AP puts it on the <b>same VLAN</b>, it keeps its IP address and its sessions survive. Roaming needs three things: overlapping cells, one SSID with matching security, and a distribution system that delivers the client to the same subnet.`)}
${K.steps([
  ["The client notices", "Signal or SNR from its AP falls below the driver's own threshold, or retries climb."],
  ["It scans", "It listens for beacons with the same SSID on other channels (or sends "+K.g("probes","Probe requests: a client asks which APs offer an SSID, and those APs answer with probe responses.")+") and lists candidate BSSIDs."],
  ["It reassociates", "It sends a reassociation request to the best one and repeats the WPA2/WPA3 key exchange (lesson 6)."],
  ["The network catches up", "A WLC records that the client is behind a new AP (lesson 3); without one, switches learn its MAC on a new port (Module 2). Same VLAN, same IP."],
])}
<p>Usually nobody notices. Problems come from <b>gaps</b> (too little overlap, so the call drops first), <b>sticky clients</b> (an over-powered AP stays &ldquo;good enough&rdquo; at the far end of the corridor, so the client clings to it at a slow rate) and <b>different subnets</b> (the same SSID on a different VLAN at the next AP, common with standalone APs, leaves the client with an address that no longer works).</p>
<p>Three IEEE amendments help: ${K.g("802.11k","Neighbour reports: the AP tells clients which nearby APs and channels to check, so they scan less.")}, ${K.g("802.11v","BSS transition management: the network can suggest to a client that it move to a better AP.")} and ${K.g("802.11r","Fast BSS Transition (FT): the keys for the next AP are prepared in advance, so a roam doesn't repeat the full authentication — important for voice on 802.1X networks.")}.</p>
${K.mistake(`Giving each floor its own SSID — <code>Staff-2F</code>, <code>Staff-3F</code> — &ldquo;to see who is where&rdquo;. A client roams only within one SSID, so every walk upstairs means a manual reconnection. Use one SSID; the controller shows which AP each client is on.`)}
${K.exam(`Reading wireless questions: underline the <b>band</b> and the word <b>non-overlapping</b>. &ldquo;Non-overlapping channels in 2.4 GHz&rdquo; = 1, 6 and 11 (three); in 5 GHz almost every channel is non-overlapping at 20 MHz, so the question is usually about 2.4 GHz. Watch for <b>width</b> versus <b>spacing</b> (22 MHz wide, 5 MHz apart), for SSID versus <b>BSSID</b> (name versus MAC), and for <b>BSS</b> (one AP) versus <b>ESS</b> (many APs, one SSID, a DS). &ldquo;Different channels but still slow&rdquo;? Look for <b>overlapping</b> ones (ACI).`)}
${K.dodont([
  "Use 1, 6 and 11 only in 2.4 GHz, at 20 MHz.",
  "Put most clients on 5 GHz (or 6 GHz), and choose width by how many APs hear each other.",
  "Plan channels in 3D — floors above and below count.",
  "Give an ESS one SSID, one security setting and one VLAN per user group, so clients roam cleanly.",
  "Read the BSSID and channel from the client (netsh) before blaming the network.",
],[
  "Don't pick &ldquo;in-between&rdquo; 2.4 GHz channels such as 3 or 8.",
  "Don't run every AP at full power &ldquo;for better coverage&rdquo;.",
  "Don't set 80 or 160 MHz everywhere in a dense 5 GHz deployment.",
  "Don't create an SSID per floor or per department.",
  "Don't treat a hidden SSID as security.",
])}
<h3>Hands-on: the third-floor ward that couldn't join</h3>
<p>A hospital ward block in Abuja. One SSID, <code>Ward-Staff</code>, covers the wards: AP-2F-WARD on the second floor has worked for months. A contractor fitted AP-3F-WARD on the third floor on Monday. Tuesday's ticket: &ldquo;Ward 3 laptops say disconnected. Ward 2 is fine.&rdquo; Make the third floor part of the ESS.</p>
${K.bench({id:"m9-ward-ess", points:90, openLog:true, from:"CCNA · Module 9 · lesson 2", title:"Abuja: bring the third-floor AP into the Ward-Staff ESS", viewBox:"0 0 900 420",
  intro:"<b>Design:</b> ABJ-R1 routes VLAN 10 (APs, 10.40.10.0/24, DHCP pool with option 43 pointing the APs at the controller — lesson 4), VLAN 30 (ward staff, 10.40.30.0/24) and VLAN 99 (WLC management, WLC1 = 10.40.99.5). ABJ-SW2: Gi0/1 trunk to the router, Gi0/2 trunk to WLC1, AP ports Gi0/3 (AP-2F-WARD) and Gi0/4 (AP-3F-WARD). WLAN Ward-Staff (WPA2-Personal) maps to VLAN 30. AP-2F-WARD uses 5 GHz channel 36, AP-3F-WARD channel 149. Console on ABJ-SW2: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab notes:</b> no radio propagation — each nurse's laptop is pinned to the AP above its desk, so <code>netsh wlan show networks mode=bssid</code> lists only that AP's BSSID (a radio MAC).",
  devices:[
    {id:"r1", kind:"router", label:"ABJ-R1", x:40, y:20, config:e=>{ ["en","conf t","hostname ABJ-R1","no ip domain-lookup","int g0/0","no shut","int g0/0.10","encapsulation dot1Q 10","ip address 10.40.10.1 255.255.255.0","int g0/0.30","encapsulation dot1Q 30","ip address 10.40.30.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.40.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.40.10.1 10.40.10.9","ip dhcp excluded-address 10.40.30.1 10.40.30.9","ip dhcp pool AP-POOL","network 10.40.10.0 255.255.255.0","default-router 10.40.10.1","option 43 hex f104.0a28.6305","exit","ip dhcp pool WARD-STAFF","network 10.40.30.0 255.255.255.0","default-router 10.40.30.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"ABJ-SW2", x:240, y:150, config:e=>{ ["en","conf t","hostname ABJ-SW2","no ip domain-lookup","vlan 10","name AP-MGMT","vlan 30","name WARD-STAFF","vlan 99","name WLC-MGMT","exit","int g0/1","description Trunk to ABJ-R1","switchport mode trunk","int g0/2","description Trunk to WLC1","switchport mode trunk","int g0/3","description AP-2F-WARD","switchport mode access","switchport access vlan 10","spanning-tree portfast","int g0/4","description AP-3F-WARD","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"WLC1", x:660, y:20, wlc:{ mgmt:{ip:"10.40.99.5", mask:"255.255.255.0", gw:"10.40.99.1", vlan:99, port:1},
      ifaces:{ ward:{vlan:30, ip:"10.40.30.5", mask:"255.255.255.0", gw:"10.40.30.1", port:1, dhcp:"10.40.30.1"} },
      wlans:{ 1:{id:1, profile:"WARD", ssid:"Ward-Staff", enabled:true, iface:"ward", security:"wpa2-psk", cipher:"aes", psk:"Example-Ward-2026", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }},
    {id:"ap1", kind:"ap", label:"AP-2F-WARD", x:40, y:300, channel:36},
    {id:"n2", kind:"laptop", label:"NURSE-2F", x:190, y:300, dhcp:true, wifi:{ssid:"Ward-Staff", key:"Example-Ward-2026", ap:"ap1"}},
    {id:"ap2", kind:"ap", label:"AP-3F-WARD", x:400, y:300, channel:149},
    {id:"n3", kind:"laptop", label:"NURSE-3F", x:550, y:300, dhcp:true, wifi:{ssid:"Ward-Staff", key:"Example-Ward-2026", ap:"ap2"}},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:760, y:300},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap1:eth", b:"sw:g3"}, {type:"cat6", a:"ap2:eth", b:"sw:g4"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket. On NURSE-3F's Command Prompt run <code>netsh wlan show interfaces</code> (Windows' report on the Wi-Fi adapter: State, SSID, AP BSSID, Band, Channel). Then run it on NURSE-2F and note its SSID, AP BSSID and Channel. Notice AP-2F-WARD's radio arcs are green and AP-3F-WARD's are grey", done:B=>Bench.tried(B,"n3",/netsh\s+wlan\s+show\s+int/i) && Bench.tried(B,"n2",/netsh\s+wlan\s+show\s+int/i)},
    {text:"The radio isn't the problem — the AP never joined the controller, so it broadcasts nothing. Check its side of the distribution system: console to ABJ-SW2, <code>enable</code>, then <code>show interfaces status</code> and <code>show vlan brief</code>. Which VLAN is Gi0/4 in, and which VLAN is the working AP's port in?", done:B=>{ const h=B.devs.sw.env.history; return h.some(x=>/^\s*sh\S*\s+int\S*\s+stat/i.test(x)) && h.some(x=>/^\s*sh\S*\s+vl\S*/i.test(x)); }},
    {text:"Fix the port so it matches Gi0/3: <code>configure terminal</code>, <code>interface g0/4</code>, access port in VLAN 10 with PortFast, <code>end</code>. Watch AP-3F-WARD's radio arcs turn green — it has leased an AP-VLAN address, found WLC1 and joined (the frame log shows the CAPWAP join)", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/4"]; return Bench.apJoined(B,"ap2") && i.mode==="access" && i.vlan===10; }},
    {text:"NURSE-3F reconnects by itself (its Wi-Fi profile is saved) — a dashed radio link appears. Run <code>netsh wlan show interfaces</code> again: the same SSID as NURSE-2F, but which AP BSSID and Channel? Then <code>ipconfig</code>: is its address in the same subnet as NURSE-2F's?", done:B=>Bench.wifiAssoc(B,"n3") && Bench.wifiVlan(B,"n3")===30 && Bench.tried(B,"n3",/^\s*ipconfig/i)},
    {text:"Prove the ward laptop reaches the wired network: from NURSE-3F, <code>ping 10.40.30.1</code> (the ward VLAN's gateway on ABJ-R1)", done:B=>Bench.pinged(B,"n3","10.40.30.1")},
    {text:"Save ABJ-SW2's fix: <code>copy running-config startup-config</code>", done:B=>!!B.devs.sw.env.savedOnce && B.devs.sw.env.intfs["GigabitEthernet0/4"].vlan===10},
  ],
  win:"The third floor is now part of the Ward-Staff ESS. The new AP's port had been left in the default VLAN 1, so the AP never got an address in the AP VLAN and never joined WLC1 — no BSS, nothing to connect to. With Gi0/4 an access port in VLAN 10, the AP joined, NURSE-3F reassociated automatically, and netsh showed the same SSID with a different BSSID on channel 149: two BSSs, one ESS, one subnet behind them.",
  solve:[["pc","n3","netsh wlan show interfaces"],["pc","n2","netsh wlan show interfaces"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces status"],["term","show vlan brief"],
    ["term","configure terminal"],["term","interface g0/4"],["term","switchport mode access"],["term","switchport access vlan 10"],["term","spanning-tree portfast"],["term","end"],
    ["pc","n3","netsh wlan show interfaces"],["pc","n3","ipconfig"],["pc","n2","ipconfig"],["pc","n3","ping 10.40.30.1"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: <code>show interfaces status</code> has a Vlan column — compare the two AP ports. Task 3: the AP port example above — access mode, VLAN 10, PortFast. Task 4: compare the AP BSSID and Channel lines with NURSE-2F's; the SSID is the same.`)}
${K.check({q:"In the bench, NURSE-3F showed State : disconnected even though AP-3F-WARD was powered and cabled. Why did fixing a switch port's VLAN fix the Wi-Fi?", o:["The VLAN change also changed the AP's radio channel","A lightweight AP needs an address in its own VLAN to find and join its controller; until it joined, it had no WLANs to broadcast, so it formed no BSS","The laptop needed the VLAN for its security key","PortFast turns the radio on"], a:1, why:"The AP's port was in VLAN 1, where there is no DHCP for APs, so the AP had no address and never joined WLC1. A lightweight AP broadcasts only the WLANs its controller gives it. Once it joined, it formed its BSS on channel 149 and the laptop reassociated."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A college runs standalone APs, each configured by hand. SSID Lecturers is on AP-LIB (library) mapped to VLAN 20 (10.5.20.0/24), and on AP-ADMIN (admin block) mapped to VLAN 25 (10.5.25.0/24). Lecturers say their video calls drop every time they walk from the library to the admin block, and then their laptops work again after a minute. Which two statements are true? (Choose two.)", o:["The laptops do roam — same SSID — but land in a different subnet, so their library address stops working until DHCP gives them a new one","The problem is co-channel interference between the two APs","Mapping the Lecturers SSID to the same VLAN on both APs (one subnet behind the ESS) would let laptops keep their address as they roam","Giving each building its own SSID would make roaming seamless","Hiding the SSID would stop the drops"], a:[0,2], why:"1. What is asked? Why calls drop on the walk and what fixes it. 2. Which rule? Roaming keeps the IP address only if the new AP puts the client on the same VLAN — the ESS needs one subnet behind it (or a controller that handles the move). 3. Apply it: same SSID, so the laptop reassociates; but VLAN 25 is a different subnet, so its 10.5.20.x address is useless until it renews. One VLAN for the SSID on both APs fixes it. A separate SSID per building would stop roaming entirely; channels and hiding have nothing to do with it."})}

<h2>Interview corner</h2>
${K.hint(`Centre spacing versus channel width — then the arithmetic from channel 1.`)}
${K.reveal("“Why are 1, 6 and 11 the non-overlapping channels in 2.4 GHz?”",`<p>"The channel centres are only 5 MHz apart — channel n sits at 2407 plus 5n megahertz — but each channel is about 22 MHz wide, so two channels need their centres 25 MHz, five numbers, apart. From channel 1 the next clear one is 6, then 11, and 16 doesn't exist: three. Anything in between causes adjacent-channel interference, which is worse than sharing a channel because the radios can't decode each other and don't take turns. In 5 GHz the numbers step by four, so 20 MHz channels don't overlap at all."</p>`)}
${K.hint(`Name versus MAC; one AP versus many; the command that shows both.`)}
${K.reveal("“What's the difference between an SSID and a BSSID — and how do you tell which AP a laptop is on?”",`<p>"The SSID is the network name, and many APs can share it — that's an extended service set, which is what lets users roam. The BSSID is the MAC address of one AP radio's cell for that SSID: one basic service set. On Windows, netsh wlan show interfaces gives the SSID, the AP BSSID, the band and the channel; show networks mode=bssid lists every BSSID the laptop hears, which is how I spot APs sharing a channel. On the controller I'd look the client's MAC up to see its AP."</p>`)}
${K.hint(`The trade-off in one sentence, then how density changes the answer.`)}
${K.reveal("“A dense open-plan office is slow, and every AP uses 80 MHz in 5 GHz. What would you change?”",`<p>"Each doubling of width roughly doubles one client's peak speed but halves the channels and adds about 3 dB of noise. At 80 MHz there are only six 5 GHz channels, fewer without DFS, so APs that hear each other share channels and everyone waits for airtime. I'd check what each AP hears, drop to 40 or 20 MHz so neighbours get their own channels, consider the DFS channels if there's no radar, keep 2.4 GHz at 20 MHz on 1, 6 and 11, tune power so cells overlap enough to roam — then measure again from a client."</p>`)}

${K.recap([
  "2.4 GHz: centre = 2407 + 5n MHz, about 22 MHz wide; centres need 25 MHz (five numbers) — so only 1, 6 and 11 don't overlap.",
  "5 GHz: centre = 5000 + 5n, numbers step by 4, so 20 MHz channels never overlap; about 25 in the US (U-NII-1, 2A, 2C, 3); 2A and 2C need DFS.",
  "6 GHz (Wi-Fi 6E/7): centre = 5950 + 5n, 59 × 20 MHz in the US; new devices only, WPA3/OWE only.",
  "Each doubling of width: about twice the speed, half the channels, about 3 dB more noise. 2.4 GHz stays at 20 MHz.",
  "CCI = same channel, take turns; ACI = overlapping channels, collisions — worse. Plan so no neighbour shares a channel, in 3D, with roughly 10–20 % cell overlap and modest power.",
  "SSID = name; BSSID = MAC of one AP radio's BSS; ESS = several BSSs, one SSID, joined by the DS (the wired network); IBSS = ad hoc; MBSS = mesh.",
  "Roaming is the client's choice: same SSID and security, reassociate, keep the IP only if the same VLAN is behind the new AP.",
])}
${K.next(`<b>Lesson 3 — Cisco wireless architectures and AP modes.</b> Autonomous, cloud-managed and controller-based APs, what the AP does in real time and what the WLC decides (including the RRM that sets channels and power), and the AP modes — then switch an AP to FlexConnect and watch where client traffic leaves.`)}
`,
quiz:[
  {lvl:1, q:"Which set of 2.4 GHz channels can three neighbouring APs use without overlapping, in any country?", o:["1, 4, 8","1, 6, 11","2, 5, 9","1, 7, 13"], a:1, why:"2.4 GHz channels are about 22 MHz wide with centres 5 MHz apart, so they need five channel numbers between them. 1, 6 and 11 are allowed everywhere and are 25 MHz apart. 1-4-8 and 2-5-9 are 3–4 apart (overlap); 13 isn't used in the US and Canada."},
  {lvl:1, type:"fill", q:"What is the centre frequency of 2.4 GHz channel 6, in MHz?", fields:[{label:"MHz", a:["2437","2437 mhz","2437mhz","2,437"]}], why:"Centre = 2407 + 5 × channel = 2407 + 30 = 2437 MHz."},
  {lvl:1, type:"match", q:"Match each 802.11 term with its meaning.", pairs:[["SSID","The network name users choose, up to 32 bytes"],["BSSID","The MAC address that identifies one AP radio's cell for an SSID"],["ESS","Several BSSs with the same SSID joined by a distribution system"],["IBSS","An ad hoc network between clients with no AP"],["Distribution system","The wired network that links the APs to each other and the LAN"]], why:"The SSID is a name; the BSSID is a MAC address naming one BSS; an ESS stretches one SSID over many BSSs via the DS; an IBSS has no AP at all."},
  {lvl:1, q:"Why don't neighbouring 20 MHz channels in the 5 GHz band overlap?", o:["5 GHz channels are only 5 MHz wide","The usable channel numbers step by 4, and 4 × 5 MHz = 20 MHz, so each 20 MHz channel sits right next to the next","5 GHz radios use CSMA/CD instead of CSMA/CA","Regulators forbid neighbouring APs from using 5 GHz"], a:1, why:"5 GHz centres are 5000 + 5n MHz, and the channels used are 36, 40, 44 … — 20 MHz apart — so 20 MHz channels sit side by side. Bonding to 40/80/160 MHz uses several of them as one channel."},
  {lvl:2, q:"Two APs in a dental surgery are on 2.4 GHz channels 1 and 3. Users near both report slow Wi-Fi with many retransmissions. Which statement is correct?", o:["This is co-channel interference; the APs take turns, which halves capacity","This is adjacent-channel interference; the channels overlap, the radios see each other as noise and frames collide; move the second AP to 6 or 11","There is no interference, because the channel numbers are different","The problem is the SSID: two APs must not share one"], a:1, why:"Channels 1 and 3 are only two numbers (10 MHz) apart, so they overlap. The radios can't decode each other's frames, so CSMA/CA doesn't make them defer — they transmit over each other. ACI is worse than CCI. 6 or 11 is five or more numbers from 1."},
  {lvl:2, type:"multi", q:"An engineer changes 5 GHz APs from 20 MHz to 80 MHz channels. Which two effects should she expect? (Choose two.)", o:["Higher peak data rates for clients near an AP","Four times as many channels to plan with","Fewer channels, so more APs that hear each other may share a channel","A lower noise floor and better SNR","No change at all, because 5 GHz channels don't overlap"], a:[0,2], why:"Bonding four 20 MHz channels into one 80 MHz channel raises the peak rate (about four times), but leaves a quarter as many channels — more co-channel sharing in a dense site — and lets in four times the noise (about +6 dB), lowering SNR."},
  {lvl:2, q:"Based on the exhibit from two laptops in the same building, which statement is true?", ex:"LAPTOP-A> netsh wlan show interfaces   (excerpt)\n    State                  : connected\n    SSID                   : Campus-Staff\n    AP BSSID               : 00:3a:9a:41:7c:20\n    Band                   : 5 GHz\n    Channel                : 44\n\nLAPTOP-B> netsh wlan show interfaces   (excerpt)\n    State                  : connected\n    SSID                   : Campus-Staff\n    AP BSSID               : 00:3a:9a:52:e1:30\n    Band                   : 5 GHz\n    Channel                : 157", o:["Both laptops are in the same BSS","The laptops are in the same ESS but in different BSSs","The laptops are in an IBSS, because the BSSIDs differ","The APs are misconfigured: an ESS must use one channel"], a:1, why:"Same SSID, different BSSIDs: two BSSs of one ESS — two AP radios. Neighbouring APs on different channels (44 and 157) is what a good plan does. An IBSS would show Network type : Adhoc."},
  {lvl:2, type:"order", q:"A laptop walks from one AP's cell into the next AP's cell in the same ESS. Put the roaming steps in order.", items:["The laptop sees the signal or SNR from its current AP fall below its threshold","It scans other channels for BSSIDs with the same SSID","It chooses a better BSSID and sends a reassociation request","It repeats the WPA2/WPA3 key exchange with the new AP","The network now delivers its traffic through the new AP, and it keeps its IP address on the same VLAN"], why:"Roaming is the client's decision: it notices a weak link, scans for the same SSID, reassociates to the best candidate, redoes the key exchange, and the network (a WLC or the switches) starts sending its traffic via the new AP. Same VLAN behind the new AP = same IP."},
  {lvl:2, type:"fill", q:"A survey tool shows an AP centred on 5500 MHz. Which 5 GHz channel is it, and does that channel need DFS (yes/no)?", fields:[{label:"Channel", a:["100","ch 100","channel 100"]},{label:"DFS? (yes/no)", a:["yes","y"]}], why:"Channel = (5500 − 5000) ÷ 5 = 100, in U-NII-2C (100–144), which shares the air with radar, so DFS applies: the AP checks for radar first and leaves the channel if radar appears."},
  {lvl:2, q:"Which statement about the 6 GHz band is correct?", o:["Any Wi-Fi 5 laptop can use it after a driver update","It is used only by Wi-Fi 6E and Wi-Fi 7 devices, and requires WPA3 or OWE","Its channels overlap like 2.4 GHz, so only three can be used","It is reserved for outdoor bridges"], a:1, why:"6 GHz needs a 6E or 7 radio — no older client can use it — and the rules allow only WPA3 or OWE there, never WPA2. In the US it offers 59 non-overlapping 20 MHz channels (centre = 5950 + 5n)."},
  {lvl:2, type:"match", q:"Match each band with the fact that belongs to it.", pairs:[["2.4 GHz","Only three non-overlapping channels"],["5 GHz U-NII-2A and 2C","DFS: leave the channel if radar appears"],["5 GHz U-NII-1","Channels 36, 40, 44 and 48"],["6 GHz","Channel centre = 5950 + 5 × n"]], why:"2.4 GHz: 1, 6, 11. U-NII-2A (52–64) and 2C (100–144) share with radar and need DFS. U-NII-1 is 36–48. 6 GHz numbers 1, 5, 9 … 233 with centre 5950 + 5n."},
  {lvl:3, q:"Based on the exhibit, office workers on floor 2 complain of slow Wi-Fi, while floors 1 and 3 are acceptable. What is the most likely cause and fix?", ex:"AP        Floor  Position  2.4 GHz channel  Power\nAP-3-01   3      east      1                max\nAP-3-02   3      centre    6                max\nAP-3-03   3      west      11               max\nAP-2-01   2      east      1                max\nAP-2-02   2      centre    6                max\nAP-2-03   2      west      11               max\nAP-1-01   1      east      1                max\nAP-1-02   1      centre    6                max\nAP-1-03   1      west      11               max", o:["Adjacent-channel interference: change floor 2 to channels 3 and 8","Co-channel interference from the identical APs directly above and below: stagger the channels between floors (e.g. floor 2 = 6, 11, 1) and reduce power","Not enough cell overlap: raise power further","The SSID must differ per floor"], a:1, why:"Each floor follows 1/6/11, but every column repeats one channel on all three floors, at maximum power. A floor-2 AP hears same-channel APs above and below it — CCI from two directions, which is why the middle floor is worst. Staggering the pattern removes the vertical repeats, and lower power shrinks how far each AP is heard. Channels 3 and 8 would add ACI; per-floor SSIDs would break roaming."},
  {lvl:3, q:"A European warehouse (channels 1–13 allowed) runs old 802.11b barcode scanners next to new laptops. A consultant proposes a four-channel 2.4 GHz plan of 1, 5, 9 and 13 to gain capacity. What do you tell them?", o:["Good idea: four channels are always better than three","It overlaps: the centres are only 20 MHz apart and 802.11b's DSSS signal is about 22 MHz wide, so neighbouring channels interfere; keep 1, 6, 11 (or 2-7-12, 3-8-13) and move the laptops to 5 GHz","It's fine, because 802.11b scanners use 5 GHz","It's illegal, because channel 13 doesn't exist anywhere"], a:1, why:"1-5-9-13 can work only where every device uses 20 MHz OFDM — the channels then touch edge to edge. With 22 MHz-wide 802.11b transmissions the neighbours overlap and cause ACI. The capacity fix is to keep the old devices on a clean three-channel plan and move capable clients to 5 GHz, which has far more room."},
  {lvl:3, q:"Nurses' Wi-Fi phones drop calls only when walking from Ward A to Ward B. Both wards use SSID Ward-Voice on one controller and one VLAN. A survey shows the AP at the Ward A end is heard at −58 dBm right up to the doors of Ward B, while the Ward B APs near the doors are heard at −62 dBm. The Ward A AP is at maximum power. What is the most likely cause?", o:["The VLANs differ, so the phones change subnet","Sticky clients: the over-powered Ward A AP stays 'good enough' too long, so phones hang on and then roam late, at the last moment; reduce its power so the cells overlap by a sensible margin","Co-channel interference from the microwave","The phones need a different SSID in each ward"], a:1, why:"The client decides when to roam. A too-strong AP keeps the phone above its roaming threshold well past the point where a better AP is available, so it roams late and abruptly — mid-call. Same SSID, controller and VLAN rule out a subnet change. Lowering the Ward A AP's power (and features such as 802.11k/v/r) gives earlier, cleaner roams."},
  {lvl:3, type:"multi", q:"You are planning 5 GHz for a 40-AP university library where most APs can hear eight or more others. There is a weather radar 10 km away, so the team avoids DFS channels. Which two choices are sound? (Choose two.)", o:["20 MHz channels, using the nine non-DFS channels 36–48 and 149–165","80 MHz channels, for the highest speeds","Let the controller's RRM assign channels and power, then check the result from clients","Put every AP on channel 36 so they cooperate","Use 40 MHz in 2.4 GHz to relieve 5 GHz"], a:[0,2], why:"Without DFS there are only nine 20 MHz channels (four at 40, two at 80). With eight or more APs in earshot, 20 MHz is the only width that gives neighbours different channels. RRM measures what every AP hears and assigns channels and power automatically; verifying from clients catches surprises. 80 MHz leaves two channels; one channel everywhere is pure CCI; 40 MHz in 2.4 GHz uses two of three channels."},
],
cards:[
  {f:"2.4 GHz channel centre", b:"Centre = 2407 + 5 × n MHz for channels 1–13 (1 = 2412, 6 = 2437, 11 = 2462, 13 = 2472). Channel 14 = 2484 MHz, Japan, 802.11b only."},
  {f:"Why 1, 6 and 11", b:"Channels are about 22 MHz wide but centres only 5 MHz apart, so they need 25 MHz (five numbers) between centres. From 1: 6, 11, then 16 (doesn't exist) — only three clear channels."},
  {f:"5 GHz channels", b:"Centre = 5000 + 5 × n (36 = 5180, 149 = 5745). Numbers step by 4 = 20 MHz, so 20 MHz channels never overlap. US: about 25 channels in U-NII-1 (36–48), 2A (52–64), 2C (100–144), 3 (149–165)."},
  {f:"DFS", b:"Dynamic Frequency Selection, on U-NII-2A and 2C (52–144): the AP checks for radar before using the channel and leaves it if radar appears. Users see a brief drop; radar sites often avoid DFS channels."},
  {f:"6 GHz (Wi-Fi 6E / Wi-Fi 7)", b:"5925–7125 MHz in the US; centre = 5950 + 5 × n, channels 1–233: 59 × 20 MHz. Only 6E/7 devices; WPA3 or OWE only. Some countries opened only the lower 500 MHz."},
  {f:"Channel width trade-off", b:"20 → 40 → 80 → 160 (→ 320 in 6 GHz). Each doubling: about twice the peak rate, half as many channels, about 3 dB more noise (lower SNR). 2.4 GHz stays at 20 MHz."},
  {f:"CCI vs ACI", b:"CCI: same channel, devices hear each other and take turns — shared airtime. ACI: overlapping channels (e.g. 1 and 3) — seen as noise, no turn-taking, collisions and retries. ACI is worse."},
  {f:"Channel plan rules", b:"No neighbouring cells on the same channel; plan in 3D (floors above and below); cells overlap about 10–20 % for roaming; power no higher than needed. On a Cisco WLC, RRM does it automatically."},
  {f:"SSID vs BSSID", b:"SSID: the network name, up to 32 bytes, case-sensitive, shared by many APs. BSSID: a MAC address naming one AP radio's BSS for one SSID. netsh wlan show interfaces shows both."},
  {f:"BSS, ESS, IBSS, MBSS, DS", b:"BSS: one AP and its clients (its area = BSA/cell). ESS: several BSSs, one SSID, linked by the DS. IBSS: ad hoc, no AP. MBSS: mesh, APs linked by radio. DS: the wired switches/VLANs behind the APs."},
  {f:"Roaming", b:"The client decides: signal/SNR falls, it scans for the same SSID, reassociates to a better BSSID and redoes the key exchange. Keeps its IP only if the same VLAN is behind the new AP. Helpers: 802.11k, 802.11v, 802.11r."},
  {f:"Reading netsh wlan", b:"show interfaces: State, SSID, AP BSSID, Band, Channel, Signal, Rssi, Authentication. show networks mode=bssid: every BSSID the laptop can hear with Signal, Band and Channel — spots APs sharing a channel."},
],
});

// ---------- Module 9 · Lesson 3 ----------
L.push({
id:"wifi-arch", mins:100, level:"Intermediate · builds on lessons 1–2 and Modules 4, 5, 7 and 8",
t:"Cisco wireless architectures and AP modes — autonomous, cloud-managed, split-MAC controllers, local and FlexConnect",
html:`
${K.goals([
  "Answer three questions (who manages, who decides, where client traffic joins the wired network) for autonomous, controller-based and cloud-managed (Meraki) Wi-Fi.",
  "Split the work between a lightweight AP and its controller (split-MAC), and say why each job sits where it does.",
  "Tell centralised, cloud (Catalyst 9800-CL) and embedded (EWC) controllers apart, and pick one for an organisation.",
  "Choose the right AP mode — local, FlexConnect, monitor, sniffer, rogue detector, SE-Connect, bridge — and say whether it serves clients.",
  "Move a branch AP to FlexConnect local switching and prove where client traffic now leaves.",
])}
${K.pre([
  "Lessons 1–2 of this module: RF basics, a first controller-managed office (netsh wlan show interfaces), SSID, BSSID, ESS, mesh (MBSS) and roaming.",
  "Module 4: VLANs, access and trunk ports, the native VLAN, <code>show interfaces trunk</code>.",
  "Module 5: routing between sites and <code>tracert</code>. Module 7: DHCP pools and APIPA addresses.",
  "Module 8: AAA, RADIUS and the idea of 802.1X.",
])}

<h2>Why this matters at work</h2>
<p>A microfinance bank has its head office in Lagos and eighteen branches in the north, every AP managed from a controller in the Lagos data centre. On Tuesday the WAN link to Kano flapped for an hour. Wired PCs in Kano kept printing to the branch printer; every Wi-Fi laptop dropped, came back and dropped again. The branch manager asks: &ldquo;Why does our Wi-Fi depend on a cable to Lagos when the printer is in the next room?&rdquo;</p>
<p>The answer is the <b>architecture</b>: where the Wi-Fi is managed, who decides, and where each client's traffic joins the wired network. Choose the wrong design or <b>AP mode</b> and you get exactly that ticket. This lesson is the map: autonomous APs, Meraki, lightweight APs with a controller (and where it can live), and the AP modes. You'll finish by moving a Kano AP to the branch mode and proving where the traffic goes.</p>

<h2>Three questions, and the autonomous AP</h2>
${K.remember(`<b>The rule:</b> every wireless architecture is an answer to three questions. <b>1. Where is it managed?</b> (where you type the configuration) <b>2. Who decides?</b> (who chooses channels and power and who may join) <b>3. Where does client traffic join the wired network?</b> (at the AP, or somewhere else). Answer those three and you can place any design, including one you have never seen.`)}
<p>Engineers name the three jobs: the ${K.g("management plane","How administrators configure and monitor a device: CLI, web GUI, SSH, SNMP.")} (configuring and watching), the ${K.g("control plane","The decisions a device makes for itself: in Wi-Fi, channels, power, who may associate, roaming. In routing (Module 5), building the routing table.")} (deciding) and the ${K.g("data plane","The forwarding of user traffic itself.")} (user traffic). Module 5 had the same split without the names: OSPF building the table is control, forwarding each packet is data.</p>

<h3>The autonomous AP: everything in one box</h3>
<p>An ${K.g("autonomous AP","A standalone AP, configured individually and making its own decisions, with no controller. Older Cisco Aironet APs and most home Wi-Fi routers work this way.")} answers all three questions with &ldquo;the AP itself&rdquo;. You configure it on its own (console, SSH or its web page); it has its own channel and power; it bridges each client's frames between the radio and its Ethernet port, putting each SSID into a VLAN. With several SSIDs in several VLANs, its switch port must be a <b>trunk</b> (Module 4): tagged frames of several VLANs share one cable.</p>
<ul>
<li><b>Good at:</b> one to three APs. Nothing else to buy, and it keeps working whatever fails around it.</li>
<li><b>Bad at:</b> scale. Fifty APs means fifty configurations and fifty chances to mistype one, and no AP coordinates channels and power with its neighbours.</li>
</ul>
${K.steps([
  ["The request", "An Abuja hotel has 24 autonomous APs and wants a guest SSID on VLAN 30 by Friday."],
  ["The work", "24 logins; on each, create the SSID, map it to VLAN 30, set security, save; check all 24 switch ports are trunks allowing VLAN 30."],
  ["The risk", "On AP 17 someone types VLAN 31. East-wing guests join but get no address, and nobody notices until 22:00."],
  ["With a controller", "One WLAN, made once on one screen; every AP gets it on Apply."],
])}
${K.svg("0 0 760 330",
  K.band(10,8,240,24,"AUTONOMOUS APs")+K.band(260,8,240,24,"LIGHTWEIGHT APs + WLC")+K.band(510,8,240,24,"CLOUD-MANAGED (MERAKI)")+
  K.link(255,40,255,295,"",true)+K.link(505,40,505,295,"",true)+
  K.dev("laptop",130,70,"ADMIN","")+
  K.arrow(130,112,62,166)+K.arrow(130,112,130,166)+K.arrow(130,112,198,166)+
  K.txt(14,142,"one login",{s:10})+K.txt(14,154,"per AP",{s:10})+
  K.dev("ap",60,185,"AP1","")+K.dev("ap",130,185,"AP2","")+K.dev("ap",200,185,"AP3","")+
  K.box(320,44,120,40,"WLC","decides for all",true)+
  K.link(380,84,310,168)+K.link(380,84,380,168)+K.link(380,84,450,168)+
  K.txt(446,124,"CAPWAP",{s:10})+
  K.dev("ap",310,185,"AP1","")+K.dev("ap",380,185,"AP2","")+K.dev("ap",450,185,"AP3","")+
  K.dev("cloud",630,62,"dashboard","")+
  K.link(630,104,560,168,"",true)+K.link(630,104,630,168,"",true)+K.link(630,104,700,168,"",true)+
  K.txt(520,142,"internet",{s:10})+
  K.dev("ap",560,185,"AP1","")+K.dev("ap",630,185,"AP2","")+K.dev("ap",700,185,"AP3","")+
  K.txt(20,252,"Managed: AP by AP (CLI or web)",{c:"fg",f:"body",s:11})+K.txt(20,270,"Decides: each AP on its own",{f:"body",s:11})+K.txt(20,288,"Traffic: joins the LAN at the AP",{f:"body",s:11})+
  K.txt(270,252,"Managed: once, at the controller",{c:"fg",f:"body",s:11})+K.txt(270,270,"Decides: the WLC, for every AP",{f:"body",s:11})+K.txt(270,288,"Traffic: tunnelled to the WLC *",{f:"body",s:11})+
  K.txt(520,252,"Managed: the cloud dashboard",{c:"fg",f:"body",s:11})+K.txt(520,270,"Decides: the cloud (RF, policy)",{f:"body",s:11})+K.txt(520,288,"Traffic: joins the LAN at the AP",{f:"body",s:11})+
  K.txt(380,318,"* in local mode. FlexConnect (later in this lesson) can switch it at the AP instead.",{mid:true,s:10,f:"body"}),
  "The three questions, answered three ways. Read each column top to bottom: managed, decides, traffic.")}
${K.check({q:"A shop has one autonomous AP with two SSIDs: STAFF in VLAN 10 and GUEST in VLAN 20. How must its switch port be configured?", o:["Access port in VLAN 10 — the guest SSID is carried inside it","Trunk carrying VLANs 10 and 20, because the AP itself puts each SSID's frames into its VLAN","Access port in VLAN 1 — APs always use the default VLAN","It doesn't matter; Wi-Fi traffic isn't tagged"], a:1, why:"An autonomous AP bridges each SSID to its own VLAN at the AP, so frames of two VLANs leave through one cable. That needs 802.1Q tags, which means a trunk carrying both VLANs (Module 4)."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A school in Kaduna runs 40 autonomous APs, each with the SSIDs TEACHERS (VLAN 11) and STUDENTS (VLAN 12). The head teacher wants the STUDENTS passphrase changed today. How many devices must be logged in to, and what must every AP's switch port be?", fields:[{label:"Devices to log in to", a:["40","forty","40 aps","40 APs"]},{label:"Switch port mode", a:["trunk","a trunk","802.1q trunk","trunk port"]}], why:"1. What is asked? The effort of one change, and the port type. 2. Which rule? Autonomous = each AP is managed on its own, and the AP itself maps SSIDs to VLANs. 3. Apply it: the passphrase lives on every AP, so 40 logins. Two SSIDs in two VLANs leave the AP through one cable, tagged, so each port is a trunk carrying 11 and 12."})}

<h2>Split-MAC: the lightweight AP and the wireless LAN controller</h2>
${K.remember(`<b>The rule:</b> in a split-MAC design, anything that must happen <b>within microseconds of a frame on the air</b> stays at the AP. Anything that needs <b>a view of the whole network</b>, or can wait a moment, moves to the controller. The two talk over CAPWAP tunnels.`)}
<p>Cisco's answer to the hotel problem takes the brains out of the AP. A ${K.g("lightweight AP","An AP that hands management and most decisions to a controller, keeping only the real-time radio work.")} keeps the radio work; a ${K.g("WLC","Wireless LAN controller, which manages lightweight APs: their WLANs, channels and power, who may join, and handing client traffic to the wired VLANs.")} does the thinking for every AP at once. The 802.11 MAC-layer work is split between them, so the design is called ${K.g("split-MAC","Dividing the 802.11 MAC-layer work: the AP does the real-time parts, the controller does management and policy.")}.</p>
<p>Why split it there? Lesson 1 showed that Wi-Fi is half-duplex and every unicast frame is acknowledged at once. If the ${K.g("ACK","Acknowledgement: the short frame a receiver sends straight after each unicast frame; no ACK in time means a retransmission.")} waited for a controller across a network, every frame would time out. A channel plan for 200 APs, on the other hand, needs to see all 200, and nobody minds if it takes a second.</p>
${K.svg("0 0 760 300",
  K.box(20,20,300,215,"","")+K.band(20,20,300,26,"LIGHTWEIGHT AP — real time")+
  K.txt(34,72,"• Sends beacons, answers probe requests",{c:"fg",f:"body",s:11.5})+
  K.txt(34,98,"• Acknowledges every frame, retransmits",{c:"fg",f:"body",s:11.5})+
  K.txt(34,124,"• Queues and prioritises frames (WMM)",{c:"fg",f:"body",s:11.5})+
  K.txt(34,150,"• Encrypts and decrypts radio frames",{c:"fg",f:"body",s:11.5})+
  K.txt(34,176,"• Transmits and listens on its channel",{c:"fg",f:"body",s:11.5})+
  K.txt(34,202,"• Wraps client frames in CAPWAP",{c:"fg",f:"body",s:11.5})+
  K.box(440,20,300,215,"","")+K.band(440,20,300,26,"WLC — the whole network's view")+
  K.txt(454,72,"• Decides who may associate",{c:"fg",f:"body",s:11.5})+
  K.txt(454,98,"• Authenticates clients (PSK, 802.1X)",{c:"fg",f:"body",s:11.5})+
  K.txt(454,124,"• Plans channels and power (RRM)",{c:"fg",f:"body",s:11.5})+
  K.txt(454,150,"• Holds WLANs, security, QoS policy",{c:"fg",f:"body",s:11.5})+
  K.txt(454,176,"• Manages roaming between APs",{c:"fg",f:"body",s:11.5})+
  K.txt(454,202,"• Hands traffic to the wired VLANs",{c:"fg",f:"body",s:11.5})+
  K.arrow(326,105,434,105,"control 5246",true)+K.arrow(434,150,326,150,"data 5247")+
  K.txt(380,130,"CAPWAP",{mid:true,c:"fg",b:true,s:11})+K.txt(380,176,"(lesson 4)",{mid:true,s:10})+
  K.txt(380,264,"Rule: if it must happen within microseconds of a frame, the AP does it.",{mid:true,c:"fg",f:"body",s:11.5})+
  K.txt(380,284,"If it needs the whole network's view or can wait a moment, the WLC does it.",{mid:true,f:"body",s:11.5}),
  "Split-MAC: the 802.11 MAC work divided between the lightweight AP and the controller. Both CAPWAP channels run both ways.")}
<p>In the diagram, ${K.g("PSK","Pre-shared key: one passphrase shared by every user of a Personal WLAN (lesson 6).")} means a passphrase WLAN; ${K.g("WMM","Wi-Fi Multimedia: the Wi-Fi Alliance's quality-of-service scheme, giving voice and video frames a better chance at the air than bulk data.")} prioritisation is decided frame by frame, so the AP does it; ${K.g("RRM","Radio Resource Management: the controller's automatic channel and transmit-power planning, built from what every AP hears.")} needs every AP's view, so the WLC does it.</p>
<h3>CAPWAP in one paragraph (lesson 4 has the rest)</h3>
<p>AP and controller talk over ${K.g("CAPWAP","Control And Provisioning of Wireless Access Points (RFC 5415): the IETF protocol a lightweight AP uses to join a controller and carry its traffic. Lesson 4 covers it in depth.")}, which runs over ordinary IP, so the controller can be in another subnet or another city. The <b>control</b> channel (UDP 5246) carries configuration and decisions and is always encrypted with ${K.g("DTLS","Datagram Transport Layer Security: the TLS encryption you know from HTTPS, adapted for UDP.")}. The <b>data</b> channel (UDP 5247) carries client frames wrapped inside CAPWAP; encrypting it is optional. How an AP finds and joins its controller is lesson 4.</p>
<h3>Worked example: who does what when a laptop joins</h3>
${K.steps([
  ["The AP advertises", "AP2 beacons the SSID <b>Staff-WiFi</b> about ten times a second and answers the laptop's probe: real-time radio work."],
  ["The controller decides", "The laptop asks to associate; AP2 passes the request to the WLC over CAPWAP. The WLC checks the WLAN (enabled? security matches?) and says yes."],
  ["Authentication", `The WLC is the ${K.g("authenticator","The device controlling a client's access during 802.1X and key exchange: the WLC here, the AP in an autonomous design (lesson 6).")}: it runs the passphrase key exchange or relays 802.1X to RADIUS (Module 8), then gives AP2 this client's keys.`],
  ["Every frame after that", "AP2 decrypts each frame, wraps it in CAPWAP and sends it to the WLC, which (in local mode) puts it on the WLAN's VLAN."],
  ["In the background", "With RRM, the WLC changes AP2's channel or power if a neighbour interferes."],
])}
${K.analogy(`A hospital ward. Bedside nurses (APs) do the split-second work: answer the call button, check the wristband, give the medicine, without phoning the director for each dose. The management office (the WLC) decides who is admitted, how many nurses each ward gets and the rules they all follow. A nurse with no hospital behind her can't admit anyone: a lightweight AP with no controller.`)}
${K.dyk(`CAPWAP grew out of ${K.g("LWAPP","Lightweight Access Point Protocol: the AP-to-controller protocol Cisco's controllers used before CAPWAP.")}; the IETF standardised it as RFC 5415 in 2009, with RFC 5416 describing how it carries 802.11. On this module's benches you can see it: an AP's radio arcs stay grey until it joins a controller, because until then it has no WLANs to broadcast.`)}
${K.mistake(`Thinking a lightweight AP is an autonomous AP that also reports to a controller. In local mode it has no WLAN configuration of its own: if it can't reach a controller it stops serving clients and goes looking for one. That is the opening Kano ticket.`)}
${K.check({q:"Which job is done by the lightweight AP rather than the WLC in a split-MAC design?", o:["Choosing the channel and transmit power for every AP in the building","Sending an ACK immediately after each frame received from a client","Checking a user's credentials against RADIUS","Deciding which VLAN a WLAN's clients are placed in"], a:1, why:"ACKs must go out within microseconds, so they can't wait for a controller. RRM, authentication and WLAN-to-VLAN mapping need the network-wide view: the WLC's jobs."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A vendor shows you a new controller-based system that isn't Cisco. Using the split-MAC rule, which three jobs would you expect its APs, rather than its controller, to do? (Choose three.)", o:["Retransmitting a frame when no ACK comes back","Encrypting each frame before it goes on the air","Balancing clients across APs in a whole building","Answering a phone's probe request with the SSID","Choosing which RADIUS server to use for staff logins","Building one channel plan for 120 APs"], a:[0,1,3], why:"1. What is asked? Which jobs belong at the radio. 2. Which rule? Microsecond timing stays at the AP; the whole-network view goes to the controller. 3. Apply it: retransmission, per-frame encryption and probe responses follow the radio's timing; building-wide load balancing, RADIUS choice and a 120-AP channel plan need the central view, whoever makes the product."})}

<h2>Where the controller lives — and where Meraki fits</h2>
${K.remember(`<b>The rule:</b> a controller does the same job wherever it runs. The deployment models differ only in <b>where the controller software runs</b>: a dedicated appliance (centralised), a virtual machine (cloud), or an AP or switch you already own (embedded). Cloud-managed Meraki goes one step further: there is no controller for you to run at all.`)}
<div class="tablewrap"><table>
<tr><th>Deployment</th><th>Where the controller runs</th><th>Cisco examples</th><th>Typical fit</th></tr>
<tr><td><b>Centralised</b> (unified)</td><td>A hardware appliance in the data centre or campus core</td><td>Catalyst 9800-40, 9800-80 (9800-L for smaller sites); older AireOS 3504, 5520, 8540</td><td>Campuses, large sites, many branches with FlexConnect</td></tr>
<tr><td><b>Cloud</b></td><td>A ${K.g("virtual machine","Software that behaves like a complete computer, running on a server alongside others. Abbreviated VM.")} in your own data centre (private cloud) or a public cloud</td><td>Catalyst 9800-CL</td><td>Organisations that already run VMs</td></tr>
<tr><td><b>Embedded</b></td><td>Equipment you already have: one Catalyst 9100 AP (or a Catalyst switch) runs the controller</td><td>${K.g("EWC","Embedded Wireless Controller: Catalyst 9800 controller software on a Catalyst 9100 AP or a Catalyst switch.")} on 9100 APs or 9300 switches; Mobility Express on older APs</td><td>Small and medium sites, no separate box</td></tr>
<tr><td><b>Cloud-managed</b> (Meraki)</td><td>Cisco runs it: the Meraki dashboard</td><td>Meraki access points</td><td>Many small sites, small IT teams</td></tr>
</table></div>
<p>Two controller software families appear in this module. ${K.g("AireOS","The operating system of Cisco's older controllers (3504, 5520, 8540) and Mobility Express; this module's lab GUI imitates it.")} runs the older controllers; lesson 5 explores its ${K.g("GUI","Graphical user interface: the point-and-click screens, here a controller's web pages.")}. The <b>Catalyst 9800</b> family runs IOS XE and organises the same settings into profiles and tags. This lesson's concepts are identical on both.</p>
<h3>Cloud-managed Meraki: management in the cloud, data at home</h3>
<p>Each Meraki AP connects out over the internet to the Meraki cloud. You manage every site from one web dashboard over HTTPS, and the cloud makes decisions such as channel planning. The <b>user traffic does not go to the cloud</b>: the AP switches it onto the local LAN, as an autonomous AP does. Managed in the cloud, decided in the cloud, traffic joins the LAN at the AP.</p>
<p>The trade-offs follow. No controller, one dashboard for 50 sites, an AP someone only has to plug in; in return, a licence subscription and an internet connection to be managed. If a site loses its internet, its APs keep serving clients with their last configuration, but nobody can change anything there until it returns, and cloud-hosted features such as Meraki splash pages stop.</p>
${K.when([
  ["Autonomous APs","One to three APs at one small site","Nothing extra to buy or run","More than a handful of APs; roaming and RF coordination needed"],
  ["Centralised WLC (9800-40/-80)","Campuses, large sites, hundreds of APs","High capacity, everything in your data centre","A few tiny sites and no data centre"],
  ["Cloud WLC (9800-CL)","You already run VMs, private or public cloud","Appliance features without new hardware","No virtualisation and nobody to run it"],
  ["Embedded (EWC)","A small or medium single site","One AP or the switch is the controller","Large sites, or many sites best run centrally"],
  ["Cloud-managed (Meraki)","Many small sites, a small IT team","One dashboard, nothing to run or upgrade","Unreliable internet, or a policy against cloud management"],
], "Which architecture or deployment?")}
${K.myth([
  ["A lightweight AP is a cheaper, weaker AP.","'Lightweight' describes where decisions are made, not the radio's quality."],
  ["With Meraki, all your Wi-Fi traffic travels through the cloud.","Only management and control do; client traffic is switched onto the local LAN at the AP."],
  ["The Catalyst 9800-CL is an embedded controller.","It is a virtual machine (Cisco's cloud deployment). Embedded means on a Catalyst 9100 AP (EWC) or a switch."],
  ["A local-mode AP must be in the same building as its controller.","CAPWAP runs over IP, so the controller can be anywhere reachable, but every client frame travels to it. Hence FlexConnect for branches."],
])}
${K.check({q:"A company runs its controller as a virtual machine on its own servers in a Lagos data centre. Which Cisco deployment model is this?", o:["Embedded — the controller is inside existing equipment","Cloud — a Catalyst 9800-CL virtual controller in a private cloud","Autonomous — no hardware controller exists","Cloud-managed — the same as Meraki"], a:1, why:"A 9800-CL VM is Cisco's cloud deployment, on your own servers (private) or a provider's (public). Embedded means on an AP or switch; Meraki has no controller for you to host."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Match each organisation with the deployment that fits it best.", pairs:[["A university campus in Zaria with 1,400 APs and its own data centre","Centralised hardware controller (Catalyst 9800-80)"],["A retailer with 60 small shops, two IT staff and good internet at every shop","Cloud-managed Meraki"],["A 12-AP office that wants controller features but has no server room","Embedded controller on one Catalyst 9100 AP (EWC)"],["A firm that already runs all its servers as VMs in a public cloud","Catalyst 9800-CL virtual controller"]], why:"1. What is asked? Where management and decisions should live. 2. Which rule? Every option does the same job; pick by where the controller can run and who looks after it. 3. Apply it: 1,400 APs need an appliance; 60 shops and two staff suit a cloud dashboard; 12 APs and no server room suit an AP-hosted controller; a VM shop adds one more VM."})}

<h2>Local mode and FlexConnect: where client traffic leaves</h2>
${K.remember(`<b>The rule:</b> the AP mode decides where a client's traffic joins the wired network. <b>Local mode:</b> always at the controller, after a trip inside CAPWAP. <b>FlexConnect:</b> chosen per WLAN, either at the controller (<b>central switching</b>) or at the AP's own switch port (<b>local switching</b>). Find where traffic joins the wired network, and the client's subnet, gateway and path all follow from it.`)}
<h3>Local mode: the default</h3>
<p>A lightweight AP starts in <b>local mode</b>: it serves clients and tunnels <b>every</b> client frame to the controller, which puts it onto the VLAN of the interface the WLAN is mapped to, on the controller's own trunk. So the client's address and first router belong to <b>the controller's site</b>. The AP's switch port carries only its own CAPWAP traffic, so it is usually an access port (lesson 4). Between serving clients, the AP briefly scans other channels for RRM and rogue detection.</p>
<p>On a campus with the controller nearby, that is ideal: one place for policy, one set of client VLANs. Across a WAN it costs twice:</p>
<ul>
<li><b>Hair-pinning.</b> A Kano laptop's print job goes to Lagos inside CAPWAP, onto a Lagos VLAN, and a Lagos router sends it back to Kano: two WAN crossings for a printer next door.</li>
<li><b>Dependence on the WAN.</b> When the WAN fails, the AP loses its controller, stops serving its WLANs and looks for another controller: the opening ticket.</li>
</ul>
<h3>FlexConnect: built for branches</h3>
<p>${K.g("FlexConnect","A Cisco AP mode for branches: joins a controller over CAPWAP, but each WLAN can be switched locally at the AP's own port. Formerly H-REAP (Hybrid Remote Edge Access Point).")} keeps the controller for management and control: the AP still joins it over CAPWAP and gets its WLANs from it. What changes is the <b>data</b>, chosen per WLAN:</p>
<ul>
<li><b>Central switching:</b> tunnelled to the controller, as in local mode. For example, a guest WLAN that must pass the head-office firewall.</li>
<li><b>Local switching:</b> the AP puts the client's frames onto <b>its own switch port</b>, tagged with the WLAN's VLAN. The client gets a <b>branch</b> address from a branch DHCP server and its traffic stays in the branch. Several VLANs now share the AP's cable, so the port must be a <b>trunk</b> with the AP's own VLAN native (lesson 4 covers that port and what breaks without it).</li>
</ul>
<p>FlexConnect also rides out WAN outages. Reaching the controller, it is in <b>connected</b> mode; cut off, it goes <b>standalone</b>. Locally switched WLANs whose clients don't need the controller to authenticate (a passphrase WLAN, for example) keep working; centrally switched WLANs stop, because their traffic has nowhere to go. Open and passphrase WLANs even accept <i>new</i> clients; an 802.1X WLAN keeps its connected clients but turns new ones away unless the AP has been given RADIUS settings of its own. The rule: locally switched traffic can survive, centrally switched traffic can't.</p>
${K.svg("0 0 760 380",
  K.txt(10,40,"Local mode — every client frame visits the controller first",{c:"fg",b:true,f:"body",s:12})+
  K.arrow(142,68,690,68,"① inside CAPWAP, over the WAN to Lagos",true)+
  K.box(10,76,80,36,"LAPTOP","Wi-Fi client")+K.box(102,76,80,36,"PH-AP1","branch")+K.box(194,76,80,36,"PH-SW1","branch")+K.box(286,76,80,36,"PH-R1","branch")+
  K.box(378,76,80,36,"WAN","",true)+K.box(470,76,80,36,"LOS-R1","Lagos HQ")+K.box(562,76,80,36,"LOS-SW1","Lagos HQ")+K.box(654,76,80,36,"LOS-WLC1","Lagos HQ",true)+
  K.link(90,94,102,94,"",true)+K.link(182,94,194,94)+K.link(274,94,286,94)+K.link(366,94,378,94)+K.link(458,94,470,94)+K.link(550,94,562,94)+K.link(642,94,654,94)+
  K.box(194,140,80,32,"PH-PRINT","10.80.30.40")+K.link(234,112,234,140)+
  K.link(694,112,694,156)+K.arrow(694,156,278,156,"② WLC → VLAN 30 → LOS-R1 → back over the WAN")+
  K.txt(10,198,"The print job crosses the WAN twice, and even the first hop (the Lagos gateway) is a WAN round trip away.",{f:"body",s:11})+
  K.txt(10,230,"FlexConnect + local switching — the frame leaves at the AP's own switch port",{c:"fg",b:true,f:"body",s:12})+
  K.arrow(142,258,690,258,"CAPWAP control (and centrally switched WLANs) still go to Lagos")+
  K.box(10,266,80,36,"LAPTOP","Wi-Fi client")+K.box(102,266,80,36,"PH-AP1","FlexConnect",true)+K.box(194,266,80,36,"PH-SW1","branch")+K.box(286,266,80,36,"PH-R1","branch")+
  K.box(378,266,80,36,"WAN","",true)+K.box(470,266,80,36,"LOS-R1","Lagos HQ")+K.box(562,266,80,36,"LOS-SW1","Lagos HQ")+K.box(654,266,80,36,"LOS-WLC1","Lagos HQ",true)+
  K.link(90,284,102,284,"",true)+K.link(182,284,194,284)+K.link(274,284,286,284)+K.link(366,284,378,284)+K.link(458,284,470,284)+K.link(550,284,562,284)+K.link(642,284,654,284)+
  K.box(194,330,80,32,"PH-PRINT","10.80.30.40")+K.link(234,302,234,330)+
  `<path d="M142,302 V346 H190" fill="none" stroke="var(--ok)" stroke-width="2" marker-end="url(#karra)"/>`+
  K.txt(286,350,"switched at PH-SW1 — never crosses the WAN",{c:"ok",f:"body",s:11}),
  "The same print job in local mode (top) and FlexConnect with local switching (bottom), Port Harcourt branch, controller in Lagos.")}
<h3>Worked example: the Port Harcourt print job, both ways</h3>
<p>Port Harcourt branch: staff WLAN <b>PH-Staff</b>, mapped on LOS-WLC1 (Lagos) to a VLAN 30 interface. Lagos staff subnet 10.10.30.0/24; branch staff subnet 10.80.30.0/24; printer 10.80.30.40; WAN round trip about 22 ms.</p>
${K.steps([
  ["Local mode: the address", "From VLAN 30 at the controller's site: a <b>Lagos</b> address such as 10.10.30.57, gateway 10.10.30.1. Physically in Port Harcourt, logically in Lagos."],
  ["Local mode: the path", "Laptop → PH-AP1 → (CAPWAP, across the WAN) → LOS-WLC1 → VLAN 30 → LOS-R1 → back across the WAN → PH-R1 → PH-SW1 → printer. <b>Two</b> WAN crossings each way."],
  ["Local mode: tracert", "Hop 1 is the Lagos gateway, already about 22 ms away: the probe crossed the WAN inside CAPWAP before reaching its 'local' gateway."],
  ["FlexConnect + local switching", "PH-AP1 puts the frames onto PH-SW1 in VLAN 30, where PH-R1 serves branch DHCP: the laptop gets 10.80.30.x, gateway 10.80.30.1. Path: laptop → PH-AP1 → PH-SW1 → printer. One hop, about 1 ms, <b>zero</b> WAN crossings."],
])}
${K.out(`C:\\Users\\ifeoma>tracert 10.80.30.40

Tracing route to 10.80.30.40 over a maximum of 30 hops

  1    23 ms    22 ms    24 ms  10.10.30.1
  2    45 ms    44 ms    46 ms  10.255.1.2
  3    46 ms    45 ms    45 ms  10.80.30.40

Trace complete.`, "Local mode. The first hop is a Lagos address and is already a WAN round trip away. Hop 2 is PH-R1's WAN interface, on the way back to Port Harcourt.")}
${K.out(`C:\\Users\\ifeoma>tracert 10.80.30.40

Tracing route to 10.80.30.40 over a maximum of 30 hops

  1     1 ms     1 ms     1 ms  10.80.30.40

Trace complete.`, "The same laptop after FlexConnect local switching: same subnet as the printer, one hop.")}
${K.tip(`On any Wi-Fi ticket, <code>ipconfig</code> and the <b>first hop</b> of <code>tracert</code> show where the client's traffic joins the wired network. A head-office address at a branch means central switching; a branch address means local switching.`)}
<p>The radio side doesn't change: <code>netsh wlan show interfaces</code> (lesson 1) shows the same SSID, AP BSSID and security in both modes. Only the wired path behind the AP moved:</p>
${K.out(`    State                  : connected
    SSID                   : PH-Staff
    AP BSSID               : 00:50:5b:25:1b:d4
    Band                   : 5 GHz
    Channel                : 36
    Radio type             : 802.11ac
    Authentication         : WPA2-Personal
    Cipher                 : CCMP`, "netsh wlan show interfaces, trimmed. It looks identical in local mode and FlexConnect: the mode is invisible to the client's radio.")}
${K.mistake(`Setting the AP to FlexConnect and expecting traffic to stay in the branch. The mode only makes local switching <i>possible</i>; each WLAN must use it (AireOS: WLANs → Edit → Advanced → <b>FlexConnect Local Switching</b>). Until then that WLAN is tunnelled exactly as in local mode.`)}
${K.mistake(`Local switching with no home for the traffic. The branch needs the client VLAN, a gateway, a DHCP server and a trunked AP port. Miss one and clients associate but sit on 169.254.x.x (Module 7's APIPA): lesson 4's second bench.`)}
${K.check({q:"A branch AP is in local mode and its controller is at head office. A Wi-Fi laptop in the branch runs ipconfig. Whose subnet is its address in, and why?", o:["The branch's, because the laptop is physically in the branch","Head office's, because in local mode every client frame is tunnelled to the controller, which places it on a VLAN at the controller's site","No subnet — local-mode clients get APIPA addresses","The WAN link's /30, because the AP routes the traffic"], a:1, why:"In local mode client traffic joins the wired network at the controller, on a VLAN at its own site, so DHCP, gateway and subnet all belong to head office."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"An Ibadan branch AP is in local mode; the controller is in an Abuja data centre. A Wi-Fi tablet in Ibadan opens a web page on the Ibadan inventory server. Put the request's path in order.", items:["The Ibadan AP receives and decrypts the tablet's frame","The AP wraps it in CAPWAP and sends it across the WAN to the controller in Abuja","The controller puts it onto the WLAN's VLAN on its trunk in Abuja","An Abuja router routes the packet back across the WAN to Ibadan","The Ibadan switch delivers it to the inventory server"], why:"1. What is asked? The path of a centrally switched frame. 2. Which rule? In local mode client traffic joins the wired network at the controller. 3. Apply it: the AP does the radio work and tunnelling, the controller hands the frame to an Abuja VLAN, and routing brings it back: two WAN crossings for a server down the corridor."})}
${K.hint(`Twist: the branch also has a GUEST WLAN whose traffic must pass the Abuja firewall. With FlexConnect, how do you switch STAFF and GUEST, and what happens to each in a WAN outage?`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> A switching choice per WLAN and its outage behaviour. <b>2. Which rule?</b> FlexConnect decides per WLAN: local switching keeps traffic in the branch, central switching sends it to the controller. <b>3. Apply it:</b> STAFF <b>locally switched</b> (Ibadan addresses, local paths, survives in standalone mode). GUEST <b>centrally switched</b> (tunnelled through the Abuja firewall); it goes down in an outage, which is acceptable: no Wi-Fi beats bypassing the firewall.</p>`)}

<h3>Try it: get the Kano AP's switch port ready</h3>
<p>The bank's Kano branch is next. AP-KAN-01 is on KAN-SW1 Gi0/3. VLAN 10 is the AP's own VLAN (its address and its path to the controller); VLAN 20 is the branch staff VLAN that local switching will use. The port must carry both: Module 4's trunk skill, for a new reason.</p>
${K.term({env:"ios2", title:"KAN-SW1 — prepare Gi0/3 for a FlexConnect AP", opts:{kind:"switch", host:"KAN-SW1", model:"Catalyst 9200", motd:"KAN-SW1 — Kano branch access switch (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","vlan 10","name AP-MGMT","vlan 20","name STAFF","exit","interface g0/1","description UPLINK KAN-R1","switchport mode trunk","interface g0/3","description AP-KAN-01","switchport mode access","switchport access vlan 10","interface g0/4","description KAN-PRINT","switchport mode access","switchport access vlan 20","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"The AP is in local mode today, so Gi0/3 is an access port in VLAN 10. Change it so that VLAN 10 stays untagged (native) for the AP itself and VLAN 20 is carried tagged for the staff WLAN.",
  tasks:[
    {text:"Look before you change: <code>enable</code>, then <code>show interfaces g0/3 switchport</code>. Find the Administrative Mode and the Access Mode VLAN.", done:e=>e.history.some(h=>/^\s*sh\S*\s+int\S*\s+g\S*0\/3\s+sw/i.test(h))},
    {text:"<code>configure terminal</code>, <code>interface g0/3</code>, then <code>switchport trunk native vlan 10</code> (the AP's untagged VLAN), <code>switchport trunk allowed vlan 10,20</code> (nothing else), <code>switchport mode trunk</code>, and a new <code>description</code> that says the AP is FlexConnect", done:e=>{ const i=e.intfs["GigabitEthernet0/3"]; return i.mode==="trunk" && i.native===10 && Array.isArray(i.allowed) && i.allowed.length===2 && i.allowed.includes(10) && i.allowed.includes(20) && /flex/i.test(i.desc||""); }},
    {text:"<code>end</code> and prove it with <code>show interfaces trunk</code>: Gi0/3 trunking, native VLAN 10, VLANs 10,20 allowed", done:e=>e.mode==="priv" && e.intfs["GigabitEthernet0/3"].mode==="trunk" && e.history.some(h=>/^\s*sh\S*\s+int\S*\s+trunk/i.test(h))},
    {text:"Save it: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>!!e.savedOnce},
  ],
  win:"Gi0/3 is ready: VLAN 10 untagged for the AP's own address and CAPWAP, VLAN 20 tagged for locally switched staff traffic, and nothing else allowed. A local-mode AP works on this port too, because it only ever uses the native VLAN. The bench below starts with the port configured this way.",
  solve:["enable","show interfaces g0/3 switchport","configure terminal","interface g0/3","description AP-KAN-01 FlexConnect","switchport trunk native vlan 10","switchport trunk allowed vlan 10,20","switchport mode trunk","end","show interfaces trunk","copy running-config startup-config",""]})}
${K.hint(`The AP sends its own traffic untagged, so its VLAN (10) must be the native VLAN, or it loses its address and its controller. <code>allowed vlan 10,20</code> replaces the whole list.`)}

<h3>Hands-on: move the Kano AP to FlexConnect and watch the traffic move</h3>
${K.bench({id:"m9-flex-kano", points:110, from:"CCNA · Module 9 · lesson 3", title:"Kano branch: from local mode to FlexConnect local switching", viewBox:"0 0 960 540", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Kano Wi-Fi printing is slow, and Wi-Fi drops whenever the Lagos link flaps.&rdquo; LOS-WLC1 (Lagos, 10.10.99.5) runs WLAN 1 <b>BR-Staff</b> on interface <i>staff</i> (VLAN 20, Lagos subnet 10.10.20.0/24). In Kano, KAN-R1 serves VLAN 20 as 10.60.20.0/24, and KAN-SW1 Gi0/3 is the trunk you prepared above. Passphrase: <code>Kano-Example-2026</code> (a lab example). Use the <b>Controller GUI</b> on LOS-WLC1 and the <b>Wi-Fi</b> panel and <b>Command Prompt</b> on KAN-LAPTOP. Don't pick monitor or Sniffer as the AP mode: they stop the AP serving clients, in the lab as on a real network. The lab has no WAN delay and doesn't animate the trip inside CAPWAP: the frame log starts where the controller puts the frame onto a wired port.",
  devices:[
    {id:"hq", kind:"router", label:"LOS-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname LOS-R1","int g0/0","description TRUNK LOS-SW1","no shut","int g0/0.20","encapsulation dot1Q 20","ip address 10.10.20.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.10.99.1 255.255.255.0","int g0/1","description WAN TO KANO","ip address 10.255.0.1 255.255.255.252","no shut","exit","ip route 10.60.0.0 255.255.0.0 10.255.0.2","ip dhcp excluded-address 10.10.20.1 10.10.20.9","ip dhcp pool LOS-STAFF","network 10.10.20.0 255.255.255.0","default-router 10.10.20.1","exit"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"hqsw", kind:"switch", label:"LOS-SW1", x:20, y:150, config:e=>{ ["en","conf t","hostname LOS-SW1","vlan 20","name STAFF","vlan 99","name WLC-MGMT","exit","int g0/1","description TRUNK LOS-R1","switchport mode trunk","int g0/2","description TRUNK LOS-WLC1","switchport mode trunk"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"LOS-WLC1", x:20, y:290, wlc:{ mgmt:{ip:"10.10.99.5", mask:"255.255.255.0", gw:"10.10.99.1", vlan:99, port:1},
      ifaces:{ staff:{vlan:20, ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.20.1", port:1, dhcp:"10.10.20.1"} },
      wlans:{ 1:{id:1, profile:"STAFF", ssid:"BR-Staff", enabled:true, iface:"staff", security:"wpa2-psk", cipher:"aes", psk:"Kano-Example-2026", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }},
    {id:"br", kind:"router", label:"KAN-R1", x:540, y:20, config:e=>{ ["en","conf t","hostname KAN-R1","int g0/1","description WAN TO LAGOS","ip address 10.255.0.2 255.255.255.252","no shut","int g0/0","description TRUNK KAN-SW1","no shut","int g0/0.10","encapsulation dot1Q 10","ip address 10.60.10.1 255.255.255.0","int g0/0.20","encapsulation dot1Q 20","ip address 10.60.20.1 255.255.255.0","exit","ip route 10.10.0.0 255.255.0.0 10.255.0.1","ip dhcp excluded-address 10.60.10.1 10.60.10.9","ip dhcp excluded-address 10.60.20.1 10.60.20.49","ip dhcp pool KAN-APS","network 10.60.10.0 255.255.255.0","default-router 10.60.10.1","option 43 hex f104.0a0a.6305","exit","ip dhcp pool KAN-STAFF","network 10.60.20.0 255.255.255.0","default-router 10.60.20.1","exit"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"brsw", kind:"switch", label:"KAN-SW1", x:520, y:150, config:e=>{ ["en","conf t","hostname KAN-SW1","vlan 10","name AP-MGMT","vlan 20","name STAFF","exit","int g0/1","description TRUNK KAN-R1","switchport mode trunk","int g0/3","description AP-KAN-01 FlexConnect","switchport trunk native vlan 10","switchport trunk allowed vlan 10,20","switchport mode trunk","int g0/4","description KAN-PRINT","switchport mode access","switchport access vlan 20"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"ap", kind:"ap", label:"AP-KAN-01", x:560, y:290, mode:"local"},
    {id:"prn", kind:"printer", label:"KAN-PRINT", x:800, y:290, ip:"10.60.20.50", mask:"255.255.255.0", gw:"10.60.20.1"},
    {id:"lap", kind:"laptop", label:"KAN-LAPTOP", x:640, y:430, dhcp:true},
  ],
  cables:[ {type:"cat6", a:"hq:g0", b:"hqsw:g1"}, {type:"cat6", a:"wlc:p1", b:"hqsw:g2"}, {type:"cat6", a:"hq:g1", b:"br:g1"}, {type:"cat6", a:"br:g0", b:"brsw:g1"}, {type:"cat6", a:"ap:eth", b:"brsw:g3"}, {type:"cat6", a:"prn:eth", b:"brsw:g4"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce the complaint. KAN-LAPTOP → <b>Wi-Fi</b>: connect to <code>BR-Staff</code> with the passphrase, then <code>ipconfig</code>. Which city's subnet is the address in, and where is the gateway?", done:B=>Bench.wifiAssoc(B,"lap") && /^10\.10\.20\./.test(B.devs.lap.ip||"") && Bench.tried(B,"lap",/^\s*ipconfig/i)},
    {text:"<code>ping 10.60.20.50</code> (KAN-PRINT, a few metres away), then <code>tracert 10.60.20.50</code>, and read the frame log. Where does the laptop's frame first appear on a wired port? How many routers does it cross?", done:B=>Bench.pinged(B,"lap","10.60.20.50") && Bench.traced(B,"lap","10.60.20.50") && Bench.arpHas(B,"lap","10.10.20.1")},
    {text:"Controller GUI → <b>WIRELESS</b> → All APs → AP-KAN-01 → AP Mode <b>FlexConnect</b> → Apply. (As on AireOS 8.10, local → FlexConnect needs no reboot — read the message — but the way back reboots the AP. Use a change window anyway.) Run <code>ipconfig</code> again: did anything change? Why not?", done:B=>B.devs.ap.apMode==="flexconnect" && Bench.wifiAssoc(B,"lap")},
    {text:"Controller GUI → <b>WLANs</b> → 1 → <b>Advanced</b> → FlexConnect Local Switching <b>Enabled</b> → Apply. The laptop reconnects and asks DHCP again. Run <code>ipconfig</code>. (On a real AireOS AP you would also tick VLAN Support and set Native VLAN 10 on the AP's FlexConnect tab; the lab skips that page.)", done:B=>Bench.wifiAssoc(B,"lap") && !!B.devs.lap.wifiAt && B.devs.lap.wifiAt.flex && /^10\.60\.20\./.test(B.devs.lap.ip||"")},
    {text:"Prove where the traffic leaves now: <code>ping 10.60.20.50</code> and <code>tracert 10.60.20.50</code> again, and read the frame log. Which KAN-SW1 port does the laptop's frame enter, and did anything cross the WAN?", done:B=>!!B.devs.lap.wifiAt && B.devs.lap.wifiAt.flex && Bench.arpHas(B,"lap","10.60.20.50") && Bench.macPort(B,"brsw",B.devs.lap.mac,20)==="Gi0/3"},
    {text:"<code>netsh wlan show interfaces</code>: compare the SSID, AP BSSID and Authentication with what the radio side looked like before. What changed for the client, and what didn't?", done:B=>!!B.devs.lap.wifiAt && B.devs.lap.wifiAt.flex && Bench.tried(B,"lap",/^\s*netsh\s+wlan\s+show\s+interfaces?\b/i)},
  ],
  win:"Kano's staff Wi-Fi now joins the wired network at AP-KAN-01's own port (KAN-SW1 Gi0/3, VLAN 20). The laptop holds a Kano address, the printer is one hop away, and nothing crosses the WAN. The AP still reports to Lagos over CAPWAP, so the WLAN is still managed centrally, and in standalone mode this locally switched passphrase WLAN can ride out a WAN flap. The radio side (SSID, BSSID, security) never changed; only the wired path behind the AP did.",
  solve:[["wifi","lap","BR-Staff","Kano-Example-2026"],["pc","lap","ipconfig"],["pc","lap","ping 10.60.20.50"],["pc","lap","tracert 10.60.20.50"],
    ["wlc","wlc","apmode","ap","flexconnect"],["pc","lap","ipconfig"],
    ["wlc","wlc","wlanset",1,{flexLocal:true}],["pc","lap","ipconfig"],
    ["pc","lap","ping 10.60.20.50"],["pc","lap","tracert 10.60.20.50"],["pc","lap","netsh wlan show interfaces"]]})}
${K.hint(`Task 2: the frame log starts at <b>LOS-SW1 Gi0/2</b>, the controller's port; the laptop ARPs for its Lagos gateway; tracert shows 10.10.20.1, 10.255.0.2, the printer. Task 3: the mode only makes local switching possible. Task 5: the laptop now ARPs for the printer itself (same subnet), at KAN-SW1 <b>Gi0/3</b>.`)}

${K.job("Ibadan branch — &ldquo;the tablets can't find the camera recorder&rdquo;", `
<p><b>The ticket:</b> &ldquo;Since the new Wi-Fi went in at Ibadan, the guard's tablet can't find the CCTV recorder in the viewer app (it worked on the old router's Wi-Fi). Wi-Fi also died for 40 minutes on Monday while wired PCs worked.&rdquo;</p>
<p><b>Questions first:</b> what changed? (New APs managed from the Abuja controller.) Where does the tablet's traffic join the wired network? How does the app find the recorder? What happened on Monday?</p>
<ol>
<li><b>Client:</b> the tablet has 10.20.40.88, gateway 10.20.40.1, an <b>Abuja</b> subnet; the recorder is 10.50.40.30 in Ibadan. The app searches by broadcast, and routers never forward broadcasts.</li>
<li><b>Controller:</b> WIRELESS → All APs shows both Ibadan APs in <b>local</b> mode. That explains the Abuja address and why Monday's WAN outage took the Wi-Fi with it.</li>
<li><b>Branch:</b> <code>show interfaces trunk</code> shows the AP ports are access ports in VLAN 15 (the AP VLAN); the router already has VLAN 40 and a DHCP pool for 10.50.40.0/24.</li>
<li><b>Fix, in a change window:</b> AP ports to trunks (native 15, allowed 15,40); both APs to FlexConnect; FlexConnect Local Switching on the STAFF WLAN. GUEST stays central, because policy sends guests through the Abuja firewall.</li>
<li><b>Verify:</b> the tablet gets 10.50.40.x, the viewer finds the recorder, <code>tracert</code> shows one hop; a guest laptop still gets an Abuja guest address.</li>
</ol>
<p><b>What you tell the branch manager:</b> &ldquo;Your Wi-Fi was sending everything to Abuja and back, so the tablet couldn't see devices in your own building, and it failed whenever the Abuja link did. Staff Wi-Fi now stays in the branch; guests still go through head office for security.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;Ibadan APs were local mode: STAFF centrally switched to Abuja VLAN 40; broadcast discovery failed; WAN outage dropped Wi-Fi. IBADAN-SW1 Gi0/5–6 → trunk (native 15, allowed 15,40); APs → FlexConnect; STAFF local switching on; GUEST central. Verified: tablet 10.50.40.x, recorder found, tracert 1 hop; guest still central. Rollback: APs to local, ports to access VLAN 15.&rdquo;</p>`)}

<h2>The other AP modes: when the AP becomes a tool</h2>
${K.remember(`<b>The rule:</b> ask &ldquo;does this mode serve clients?&rdquo; <b>Local</b>, <b>FlexConnect</b> and <b>bridge</b> (mesh) do. <b>Monitor</b>, <b>sniffer</b>, <b>rogue detector</b> and <b>SE-Connect</b> don't: they turn the AP into a sensor or a test tool, and any client on it loses its Wi-Fi. Changing an AP's mode usually makes it reboot and rejoin, so plan it like any change.`)}
<div class="tablewrap"><table>
<tr><th>Mode</th><th>Serves clients?</th><th>What it does</th><th>Use it when…</th></tr>
<tr><td><b>Local</b> (default)</td><td>Yes</td><td>All client traffic tunnelled to the controller; short off-channel scans</td><td>The controller is on the same campus</td></tr>
<tr><td><b>FlexConnect</b></td><td>Yes</td><td>Central or local switching per WLAN; can survive a WAN outage</td><td>Branches across a WAN</td></tr>
<tr><td><b>Monitor</b></td><td>No</td><td>Listens on every channel full time: rogue detection, ${K.g("wIPS","Wireless intrusion prevention system: watches the air for attacks and rogue devices and alerts the network team.")}, RRM input, location</td><td>You want a dedicated security and RF sensor</td></tr>
<tr><td><b>Sniffer</b></td><td>No</td><td>Captures every 802.11 frame on one channel and sends it to a PC running Wireshark or OmniPeek</td><td>Troubleshooting a roaming or login problem frame by frame</td></tr>
<tr><td><b>Rogue detector</b></td><td>No (radios off)</td><td>On a trunk, watches the <b>wired</b> network for MAC addresses of rogue clients other APs saw over the air. Older APs only</td><td>Proving a rogue AP is plugged into your LAN (legacy)</td></tr>
<tr><td><b>${K.g("SE-Connect","Spectrum Expert Connect: makes a CleanAir AP (one with Cisco's built-in spectrum-analysis hardware) a dedicated spectrum analyser feeding a PC program such as Chanalyzer.")}</b></td><td>No</td><td>Raw spectrum analysis: non-Wi-Fi energy such as microwave ovens, Bluetooth, wireless cameras</td><td>Wi-Fi is poor but a frame capture looks clean</td></tr>
<tr><td><b>Bridge</b> (mesh), Flex+Bridge</td><td>Yes</td><td>A ${K.g("RAP","Root AP: the mesh AP with a wired connection to the network.")} has a cable; ${K.g("MAP","Mesh AP: a mesh access point with no wired uplink, relaying its clients' traffic wirelessly to a root AP.")}s reach it wirelessly (lesson 2's MBSS); also building-to-building links. Flex+Bridge adds local switching</td><td>Car parks, campuses, outdoor areas with no cable</td></tr>
</table></div>
<p>Monitor and sniffer are easy to mix up. <b>Monitor</b> reports <i>conclusions</i> to the controller (&ldquo;rogue AP on channel 11&rdquo;) and stays on permanently. <b>Sniffer</b> sends <i>raw frames</i> from one channel to one analyser, for an engineer to read, and is switched off afterwards.</p>
<h3>Rogue APs, in concept</h3>
<p>A ${K.g("rogue AP","Any access point the organisation didn't install or approve.")} may be innocent (a travel router plugged in for better coverage) or hostile (an <b>evil twin</b> broadcasting your staff SSID). The attacker wants clients' traffic or credentials, or a way into the wired LAN that skips the firewall. The network team sees an unknown BSSID in the controller's rogue list, advertising your SSID or with clients that also appear on your switches. Defences are layered: local- and monitor-mode APs detect it, Module 8's port controls (802.1X, port security) make a plugged-in device useless, and WPA3/802.1X (lesson 6) can't be completed by a fake AP without the real keys. Containment is a legal and policy decision, not a button.</p>
${K.remember(`Seven modes, two questions. <b>Serves clients?</b> Local, Flex, Bridge: &ldquo;the three that <b>l</b>et <b>f</b>olks <b>b</b>rowse&rdquo;. <b>Tools, no clients:</b> Monitor <i>minds</i> the air, Sniffer <i>ships</i> frames to Wireshark, Rogue detector <i>roots</i> around the wire, SE-Connect <i>sees</i> the spectrum.`)}
${K.dyk(`A sniffer-mode AP sends every frame it captures across the routed network to the analyser's IP address, so an engineer in Lagos can read the air in a Port Harcourt hotel room in Wireshark without travelling.`)}
${K.exam(`Reading AP-mode questions: underline the clue words before reading the options. &ldquo;Branch&rdquo;, &ldquo;across a WAN&rdquo;, &ldquo;switch locally&rdquo; → FlexConnect. &ldquo;Default&rdquo; → local. &ldquo;Does not serve clients&rdquo; → monitor, sniffer, rogue detector or SE-Connect. &ldquo;Wireshark&rdquo;/&ldquo;capture&rdquo; → sniffer. &ldquo;Spectrum&rdquo;/&ldquo;non-Wi-Fi interference&rdquo; → SE-Connect. &ldquo;Rogue&rdquo; + &ldquo;wired&rdquo; → rogue detector. &ldquo;Wireless backhaul&rdquo; → bridge. The trap: an option that would work but takes clients off the air when the question needs users served.`)}
${K.check({q:"A wireless engineer needs a full-time sensor in a bank's trading floor to detect rogue APs and wireless attacks on every channel. The floor already has enough APs for coverage. Which mode fits?", o:["Sniffer, because it captures frames","Monitor, because its radios scan every channel full time and report rogues and attacks to the controller","FlexConnect, because it can work without the controller","SE-Connect, because it detects non-Wi-Fi interference"], a:1, why:"A permanent every-channel security sensor is monitor mode. Sniffer is a temporary one-channel capture; SE-Connect shows raw spectrum, not 802.11 attacks; FlexConnect serves clients."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A hospital network team gets five requests. Match each with the AP mode that answers it.", pairs:[["Cover a car park where no cable can reach the far lamp posts","Bridge (mesh)"],["Prove that a new non-Wi-Fi wireless video link in radiology is drowning the 2.4 GHz band","SE-Connect"],["Capture the authentication frames between one doctor's tablet and the AP for a vendor","Sniffer"],["Keep the new outpatient annexe, across the city on a WAN link, working if the link drops","FlexConnect"],["Watch every channel around the pharmacy for rogue APs, full time","Monitor"]], why:"1. What is asked? The mode matching each request. 2. Which rule? First: must the AP serve clients? Then: what data do you need? 3. Apply it: no cable = wireless backhaul (bridge); a non-Wi-Fi device = raw spectrum (SE-Connect); frames for a vendor = one-channel capture (sniffer); a remote site surviving the WAN = FlexConnect; full-time rogue watch = monitor."})}

<h2>Choosing an architecture: a design walk-through</h2>
<p>Exams ask you to name architectures; jobs ask you to choose one. The three questions turn choosing into reasoning. The case below has trade-offs, not a single right answer.</p>
${K.case("A hotel group's Wi-Fi refresh", `
<p><b>The situation:</b> six hotels: a 220-room Lagos flagship, home to the group's small data centre, and five 40–60 room hotels in Abuja, Port Harcourt, Kano, Enugu and Calabar. About 180 failing autonomous APs; three IT staff, all in Lagos. Each hotel has internet and a WAN link to Lagos. Guest Wi-Fi must pass the group's web filter in Lagos (a legal requirement). Staff use a hotel system in Lagos plus each hotel's card locks and point-of-sale devices.</p>
<p><b>Option A, autonomous again:</b> rejected. 180 configurations for three people and no coordinated RF in the flagship.</p>
<p><b>Option B, a Catalyst 9800 in Lagos:</b> flagship APs in <b>local</b> mode (same campus). The other hotels in <b>FlexConnect</b>: guest WLAN <b>centrally switched</b> to pass the Lagos filter, staff WLAN <b>locally switched</b> so locks and tills stay on the hotel LAN and survive a WAN drop. Costs: a high-availability second controller, guest traffic on every WAN link, trunked AP ports (lesson 4).</p>
<p><b>Option C, Meraki:</b> one dashboard, nothing to run, manageable from anywhere. But guest traffic is switched locally at each hotel, so the &ldquo;through the Lagos filter&rdquo; rule needs another approach (a cloud filter or a tunnel to Lagos), plus a licence per AP per year.</p>
<p><b>The decision:</b> B. Central guest filtering fits central switching, the data centre already existed, and FlexConnect kept door locks working at 02:00 when a WAN link drops. With no data centre and no central filtering rule, C would probably have won. The requirements answer the three questions; the architecture follows.</p>`)}
${K.dodont([
  "Answer the three questions before naming a product.",
  "Use local mode on the controller's campus and FlexConnect at branches across a WAN.",
  "Decide central or local switching per WLAN, from where that traffic must go.",
  "Give locally switched WLANs a home at the branch: VLAN, gateway, DHCP, trunked AP port.",
  "Change AP modes in a change window; check ipconfig and tracert from a real client afterwards.",
],[
  "Don't run branch APs in local mode over a thin WAN.",
  "Don't assume FlexConnect alone keeps traffic local.",
  "Don't leave an AP in sniffer mode after the capture: it serves nobody.",
  "Don't call a 9800-CL &ldquo;embedded&rdquo; or say Meraki sends user traffic through the cloud.",
  "Don't improvise against a rogue AP: detect it, find its switch port, follow the policy.",
])}
${K.check({q:"A design requirement says: 'Guest traffic at every branch must pass the head-office web filter; staff traffic must keep working if a branch WAN link fails.' With a Catalyst 9800 at head office, which branch design meets both?", o:["Local mode for every branch AP","FlexConnect, with the guest WLAN centrally switched and the staff WLAN locally switched","FlexConnect, with both WLANs locally switched","Monitor mode at the branches and autonomous APs for guests"], a:1, why:"Central switching takes guest traffic to the head-office filter; local switching keeps staff traffic in the branch, able to run standalone. Local mode fails the second requirement; local guests fail the first."})}
<h3>Same logic, new situation</h3>
<p>A health charity runs a Kano head office (a small server room, 30 APs) and eight field clinics with two APs each, linked by unreliable 4G routers. Clinic tablets record patient visits to a server <i>in each clinic</i>, which syncs to Kano at night. The charity already owns a Catalyst 9800 at the head office. Choose the clinic AP mode and the switching for the clinic staff WLAN, and say what happens when a clinic's 4G link drops.</p>
${K.hint(`Where does the clinic tablets' traffic need to go: Kano or the clinic server? And which kind of switching survives a lost link?`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> A mode and switching choice for an unreliable remote site. <b>2. Which rule?</b> Local mode joins traffic at the controller and dies with the WAN; FlexConnect local switching joins it at the AP's port and can run standalone. <b>3. Apply it:</b> clinic APs in <b>FlexConnect</b>, staff WLAN <b>locally switched</b> onto the clinic LAN with the visit server, ideally with passphrase or local authentication. When the 4G drops, the APs go standalone and tablets keep recording; only management and the night sync wait. Local mode would kill clinic Wi-Fi at every 4G flicker.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Name the two halves, give two jobs each with the reason (timing versus network-wide view), and mention CAPWAP.`)}
${K.reveal("&ldquo;What is split-MAC, and why does Cisco split it that way?&rdquo;", `<p>"The 802.11 MAC work is divided between a lightweight AP and a controller. The AP keeps the real-time work: beacons and probe responses, ACKs and retransmissions, queueing, per-frame encryption. Those happen within microseconds, so they can't wait for a controller across a network. The controller does what needs the whole network's view: who may associate, authentication including 802.1X to RADIUS, the RRM channel and power plan, WLAN and QoS policy, roaming. They talk over CAPWAP, control on UDP 5246 with DTLS and data on 5247. The benefit is one consistent place to manage hundreds of APs."</p>`)}
${K.hint(`Where client traffic joins the wired network in each, a branch example, the per-WLAN choice, the WAN failure.`)}
${K.reveal("&ldquo;When would you use FlexConnect instead of local mode?&rdquo;", `<p>"Local mode tunnels every client frame to the controller: ideal on a campus. Across a WAN it hair-pins (a print job to the next room goes to head office and back), and when the WAN drops the AP loses its controller and the Wi-Fi stops. FlexConnect keeps central management but lets me choose per WLAN: staff locally switched onto the branch VLAN, so it stays local and survives an outage in standalone mode; guests centrally switched through the head-office firewall. The branch then needs the VLANs, DHCP and a trunked AP port. I verify with ipconfig and tracert from a client: a branch address, one hop to a branch server."</p>`)}
${K.hint(`Group the modes by whether they serve clients, then give a real use for each tool mode.`)}
${K.reveal("&ldquo;Which AP modes don't serve clients, and why use them?&rdquo;", `<p>"Local, FlexConnect and bridge serve clients; monitor, sniffer, rogue detector and SE-Connect don't. Monitor is a full-time sensor for rogues, attacks, RRM and location. Sniffer streams one channel's frames to Wireshark or OmniPeek for a specific problem, then gets switched off. Rogue detector watches the wired side for rogue clients' MACs; it's legacy now. SE-Connect makes the AP a spectrum analyser for non-Wi-Fi interference such as microwave ovens. A mode change usually reboots the AP and drops its clients, so I plan it as a change."</p>`)}

${K.drill({title:"keep lessons 1–2 sharp: channels and power", types:["wifichan","wifioverlap","wifidbm"], count:5})}
${K.recap([
  "Every wireless architecture answers three questions: where it's managed, who decides, where client traffic joins the wired network.",
  "Autonomous APs do all three themselves: fine for a few, unmanageable for many; several SSIDs in VLANs means a trunk port.",
  "Split-MAC: the AP does real-time work (beacons, ACKs, encryption, queueing); the WLC does association, authentication, RRM, policy and roaming, over CAPWAP (5246 control with DTLS, 5247 data).",
  "Controllers: centralised appliance (9800-40/-80, older AireOS), cloud VM (9800-CL), embedded (EWC on a 9100 AP or a switch). Meraki is cloud-managed, data switched locally.",
  "Local mode (default) tunnels all client traffic to the controller; FlexConnect switches each WLAN centrally or locally, and locally switched WLANs can survive a WAN outage.",
  "Local switching needs the VLAN, gateway and DHCP at the branch and a trunked AP port; ipconfig and tracert's first hop show where traffic joins.",
  "Monitor, sniffer, rogue detector and SE-Connect serve no clients; bridge (mesh) does. A mode change usually reboots the AP.",
])}
${K.next(`<b>Lesson 4 — Physical infrastructure and how an AP joins.</b> PoE, access and trunk ports, LAG to the controller, the service port, and the CAPWAP join in detail (broadcast, DHCP option 43 in hex, DNS). Two benches: an AP that can't join until option 43 is right, and a FlexConnect AP whose port must become a trunk.`)}
`,
quiz:[
  {lvl:1, q:"In a split-MAC architecture, which job stays on the lightweight AP?", o:["Building the channel and power plan for every AP","Sending beacons and acknowledging each frame it receives","Checking users' credentials with a RADIUS server","Deciding which VLAN a WLAN's clients use"], a:1, why:"Beacons and ACKs are real-time 802.11 work that must happen within microseconds, so they stay at the AP. RRM, authentication with RADIUS and WLAN-to-VLAN mapping need the network-wide view, so the WLC does them."},
  {lvl:1, q:"What is the default mode of a Cisco lightweight AP?", o:["FlexConnect","Local","Monitor","Bridge"], a:1, why:"A lightweight AP joins its controller in local mode unless you change it: it serves clients and tunnels all their traffic to the controller over CAPWAP."},
  {lvl:1, type:"match", q:"Match each AP mode with what it does.", pairs:[["Local","Serves clients and tunnels all their traffic to the controller"],["Monitor","Serves no clients; scans every channel for rogues, attacks and RRM data"],["Sniffer","Captures frames on one channel and sends them to a remote analyser"],["SE-Connect","Streams raw spectrum data to show non-Wi-Fi interference"],["Bridge","Mesh AP that can reach the network over a wireless backhaul"]], why:"Local is the default client-serving mode. Monitor is a full-time sensor. Sniffer feeds Wireshark or OmniPeek. SE-Connect is a dedicated spectrum analyser. Bridge is mesh (root and mesh APs), including links between buildings."},
  {lvl:1, type:"fill", q:"Write out what the protocol name CAPWAP stands for.", fields:[{label:"CAPWAP", a:["Control And Provisioning of Wireless Access Points","Control and Provisioning of Wireless Access Point","Control & Provisioning of Wireless Access Points"]}], why:"CAPWAP is Control And Provisioning of Wireless Access Points (RFC 5415), the protocol between a lightweight AP and its controller: control on UDP 5246 (DTLS-encrypted), data on UDP 5247."},
  {lvl:1, q:"A company manages its Meraki APs from the Meraki dashboard. Where does a Wi-Fi user's traffic to a local file server go?", o:["Through the Meraki cloud and back","Onto the local LAN at the AP — only management and control go to the cloud","To a WLC at head office over CAPWAP","To the internet service provider first"], a:1, why:"Meraki is cloud-managed: the dashboard and the decisions are in the cloud, but client data is switched onto the local network at the AP."},
  {lvl:1, q:"Which statement about the Catalyst 9800-CL is correct?", o:["It is controller software embedded in a Catalyst 9100 AP","It is a virtual controller you run as a VM in a private or public cloud","It is the Meraki dashboard licence","It is a hardware appliance for large campuses"], a:1, why:"The 9800-CL is a virtual machine: Cisco's cloud deployment. The embedded controller on an AP is the EWC; the 9800-40/-80 are hardware appliances; Meraki is a separate cloud-managed product."},
  {lvl:2, type:"multi", q:"Which two AP modes serve no Wi-Fi clients? (Choose two.)", o:["Local","Monitor","FlexConnect","Sniffer","Bridge"], a:[1,3], why:"Monitor and sniffer turn the AP into a tool: monitor scans every channel as a sensor, sniffer captures one channel for an analyser. Local, FlexConnect and bridge (mesh) all serve clients."},
  {lvl:2, q:"A Wi-Fi laptop in the Kano branch produced the exhibit. 10.10.20.0/24 is a Lagos subnet; 10.60.0.0/16 is Kano; KAN-PRINT is 10.60.20.50. What does it tell you?", ex:"   IPv4 Address. . . . . . . . . . . : 10.10.20.14\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.10.20.1\n\nC:\\Users\\musa>tracert 10.60.20.50\n\nTracing route to 10.60.20.50 over a maximum of 30 hops\n\n  1    21 ms    22 ms    21 ms  10.10.20.1\n  2    43 ms    42 ms    44 ms  10.255.0.2\n  3    44 ms    43 ms    43 ms  10.60.20.50\n\nTrace complete.", o:["The WLAN is centrally switched (local mode, or FlexConnect without local switching): the laptop's traffic joins the wired network at the controller in Lagos","The AP is in FlexConnect with local switching, so traffic stays in Kano","The AP is in monitor mode","The laptop is cabled to a switch in Lagos"], a:0, why:"A Lagos address and gateway, a first hop already ~21 ms away, and a path back across the WAN to Kano: the client's frames are tunnelled to the controller and placed on a Lagos VLAN. Local switching would give a Kano address and a one-hop path; a monitor-mode AP serves no clients at all."},
  {lvl:2, type:"order", q:"A branch AP is in local mode with the controller at head office. Order the path of a frame from a Wi-Fi laptop to a printer in the same branch.", items:["The AP receives and decrypts the laptop's frame","The AP wraps it in CAPWAP and sends it across the WAN to the controller","The controller puts it onto the WLAN's VLAN on its trunk at head office","A head-office router routes it back across the WAN to the branch","The branch switch delivers it to the printer"], why:"Local mode: client traffic joins the wired network at the controller, so even a branch-to-branch conversation goes to head office inside CAPWAP and is routed back. That hair-pin is why branches use FlexConnect local switching."},
  {lvl:2, q:"Based on the exhibit, staff at a branch still get head-office addresses after the change. What is the cause?", ex:"WIRELESS > All APs\nAP Name      IP Address    AP Model             Operational Status  AP Mode\nAP-ENU-01    10.90.10.11   Catalyst 9120 AP     REG                 FlexConnect\n\nWLANs > Edit 'STAFF' > Advanced\nFlexConnect\n  FlexConnect Local Switching   [ ] Enabled", o:["FlexConnect local switching is a per-WLAN setting and it is still off for STAFF","The AP must be rebooted into monitor mode first","DHCP option 43 on the branch is wrong","The AP has not registered with the controller yet"], a:0, why:"FlexConnect mode only makes local switching possible. With the box unticked, the STAFF WLAN is still centrally switched: tunnelled to the controller and placed on a head-office VLAN. REG, short for registered, means the AP has joined, so option 43 isn't the problem."},
  {lvl:2, type:"multi", q:"Which three jobs does the WLC perform in a split-MAC design? (Choose three.)", o:["Radio Resource Management: channels and power for all APs","Transmitting beacons","Client authentication, including relaying 802.1X to RADIUS","Sending ACKs for received frames","Holding WLAN security and QoS policy","Encrypting each frame before it goes on the air"], a:[0,2,4], why:"The controller does what needs the whole network's view: RRM, authentication (it is the authenticator) and WLAN/QoS/security policy. Beacons, ACKs and per-frame encryption are real-time radio work done by the AP."},
  {lvl:2, type:"fill", q:"Which AP mode lets a branch AP switch a WLAN's traffic onto its own switch port instead of tunnelling it to the controller?", fields:[{label:"Mode", a:["FlexConnect","Flex Connect","Flex-Connect","FlexConnect mode","FlexConnect with local switching","H-REAP"]}], why:"FlexConnect (formerly H-REAP) lets each WLAN be centrally or locally switched. Local mode always tunnels client traffic to the controller."},
  {lvl:3, q:"A retailer has 25 shops, each with 2–4 APs, linked to a data centre over 20 Mb/s WAN links. A Catalyst 9800 is in the data centre. Staff tills talk to a server in each shop; guest Wi-Fi must pass the data-centre firewall. Which design fits best?", o:["All shop APs in local mode, so all traffic is inspected centrally","Shop APs in FlexConnect: the staff WLAN locally switched, the guest WLAN centrally switched","Autonomous APs in every shop, configured from one template","Shop APs in monitor mode with a separate guest router"], a:1, why:"Per-WLAN switching meets both needs: tills reach the shop server locally (no hair-pin over 20 Mb/s, and they survive a WAN outage in standalone mode), while guest traffic is tunnelled to the data centre and passes the firewall. Local mode would hair-pin every till transaction; autonomous APs lose central management; monitor-mode APs serve no clients."},
  {lvl:3, q:"The WAN link from the Port Harcourt branch to the data-centre controller fails for 20 minutes. The branch AP is in FlexConnect. STAFF (WPA2 passphrase) is locally switched; GUEST is centrally switched. What do users most likely see?", o:["Both WLANs keep working normally","STAFF keeps working for its clients (the AP goes standalone); GUEST stops until the WAN returns","Both WLANs go down until the WAN returns","GUEST keeps working because the controller handles it; STAFF stops"], a:1, why:"In standalone mode a FlexConnect AP keeps locally switched WLANs that don't need the controller to authenticate, such as a passphrase WLAN. Centrally switched traffic has to reach the controller, so GUEST goes down. On AireOS a passphrase WLAN even accepts new clients while standalone; an 802.1X WLAN needs RADIUS settings on the AP itself for that."},
  {lvl:3, q:"Forklift scanners in a Kano warehouse lose Wi-Fi near the staff canteen, mostly at lunchtime. A one-channel frame capture shows no unusual Wi-Fi traffic, only retries. The APs are CleanAir-capable. Which temporary AP mode would best help prove the cause?", o:["Sniffer, to capture more frames","SE-Connect, to see non-Wi-Fi energy such as microwave ovens in the 2.4 GHz band","Rogue detector, to search the wired network","Bridge, to add a wireless backhaul"], a:1, why:"Lunchtime, the canteen and clean 802.11 captures point to something that isn't Wi-Fi: microwave ovens radiate in the 2.4 GHz band. A frame capture can't show non-802.11 energy; a spectrum analyser (SE-Connect on a CleanAir AP) can. The rogue detector looks at the wired side; bridge mode is for mesh links."},
],
cards:[
  {f:"The three questions for any wireless architecture", b:"1. Where is it managed? (management plane) 2. Who decides channels, power and who may join? (control plane) 3. Where does client traffic join the wired network? (data plane)"},
  {f:"Autonomous AP", b:"A standalone AP that answers all three questions itself: configured one by one, makes its own decisions, bridges each SSID to a VLAN at the AP (a trunk port when there are several VLANs). Fine for 1–3 APs, painful at scale, no coordinated RF."},
  {f:"Split-MAC: the AP's jobs", b:"Real-time 802.11 work: beacons and probe responses, ACKs and retransmissions, queueing and prioritising (WMM), encrypting and decrypting frames, transmit and receive, wrapping client frames in CAPWAP."},
  {f:"Split-MAC: the WLC's jobs", b:"Network-wide work: deciding who may associate, authentication (the WLC is the authenticator; 802.1X via RADIUS), RRM channel and power planning, WLAN, security and QoS policy, roaming, handing traffic to the wired VLANs."},
  {f:"CAPWAP (in brief)", b:"Control And Provisioning of Wireless Access Points (RFC 5415), between a lightweight AP and its controller over IP. Control channel UDP 5246, always DTLS-encrypted; data channel UDP 5247, encryption optional. Join and discovery: lesson 4."},
  {f:"Controller deployments", b:"Centralised: hardware appliance (Catalyst 9800-40/-80; older AireOS 3504/5520/8540). Cloud: Catalyst 9800-CL virtual machine, private or public cloud. Embedded: EWC on a Catalyst 9100 AP or a Catalyst switch (Mobility Express on older AireOS APs)."},
  {f:"Cloud-managed Meraki", b:"Management and decisions in the Meraki cloud dashboard (HTTPS); client data switched locally at the AP. No controller to run; needs internet to be managed and a licence per AP. Without the cloud, APs keep serving with their last configuration."},
  {f:"Local mode", b:"The default. Serves clients and tunnels all client traffic to the controller, which puts it on the WLAN's interface VLAN at the controller's site. The AP port is usually an access port. Brief off-channel scans feed RRM and rogue detection."},
  {f:"FlexConnect", b:"For branches across a WAN (formerly H-REAP). Joins the controller over CAPWAP; per WLAN, central switching (tunnelled) or local switching (onto the AP's own port, which must then be a trunk with the AP VLAN native). AP mode alone doesn't make traffic local."},
  {f:"FlexConnect connected vs standalone", b:"Connected: the controller is reachable. Standalone: the WAN or controller is lost; locally switched WLANs that can authenticate without the controller (e.g. a passphrase) keep working, centrally switched WLANs stop."},
  {f:"AP modes that serve no clients", b:"Monitor: full-time sensor on every channel (rogues, wIPS, RRM, location). Sniffer: captures one channel to Wireshark or OmniPeek. Rogue detector: radios off, watches the wired LAN for rogue MACs (legacy). SE-Connect: raw spectrum analysis for non-Wi-Fi interference."},
  {f:"Bridge (mesh) mode", b:"Serves clients. Root AP (RAP) has a cable; mesh APs (MAPs) reach it over a wireless backhaul. Also point-to-point links between buildings. Flex+Bridge adds FlexConnect local switching."},
],
});

// ---------- Module 9 · Lesson 4 ----------
L.push({
id:"wifi-join", mins:110, level:"Intermediate · builds on Module 4, Module 7 lesson 1 and Module 9 lessons 1–3",
t:"Wireless infrastructure and the AP join — PoE, access and trunk ports, LAG to the WLC, CAPWAP and DHCP option 43",
html:`
${K.goals([
  "Choose the switch port for every wireless device: access, trunk, or a static LAG (<code>mode on</code>) to an AireOS WLC.",
  "Explain CAPWAP: UDP 5246 for control (DTLS), 5247 for data, and what the network in between sees.",
  "Order the AP join sequence and choose a discovery method: broadcast, DHCP option 43, DNS or a primed controller.",
  "Build and decode DHCP option 43 in hex on an IOS pool, for one or several controllers.",
  "Troubleshoot an AP that never joins and a FlexConnect AP whose clients get no address.",
])}
${K.pre(["Module 1: PoE (802.3af/at/bt) and the PoE budget; what an AP and a WLC are.","Module 4: access and trunk ports, the native VLAN, <code>switchport trunk allowed vlan</code>, PortFast, and EtherChannel modes (on, LACP, PAgP).","Module 7 lesson 1: IOS DHCP pools — <code>ip dhcp pool</code>, <code>network</code>, <code>default-router</code>, <code>domain-name</code> — and Module 1's hexadecimal.","Module 9 lessons 1–3: Wi-Fi basics and <code>netsh wlan show interfaces</code>; SSIDs and WLANs; split-MAC, lightweight APs, and the local and FlexConnect AP modes."])}

<h2>Why this matters at work</h2>
<p>Monday, a teaching hospital in Ibadan. Over the weekend a contractor mounted a new access point in Ward 3, patched it into the ward switch and left. The AP's light is on, so it has power. The switch port is up. But the nurses' tablets can't see the staff network, and the controller's list of APs doesn't include the new one. The ticket is yours.</p>
<p>Nothing is wrong with the radio. A lightweight AP is useless until it has <b>power</b>, the <b>right switch port</b>, an <b>IP address</b>, and has <b>found and joined</b> its controller. Each step fails in its own recognisable way. This lesson follows the AP from the cable to the RUN state, then has you fix two breaks: an AP that can't find its controller, and a branch AP whose clients connect but never get an address.</p>

<h2>Power and the AP's switch port</h2>
${K.remember(`<b>The rule in one line:</b> a switch port must carry <b>whatever leaves the AP on the wire</b>. A <b>local-mode</b> AP tunnels every client to the controller, so only one VLAN leaves it: an <b>access port</b>. An AP that <b>switches client traffic itself</b> (FlexConnect with local switching, or an autonomous AP) puts several VLANs on the wire: a <b>trunk</b>, with the AP's own VLAN as the <b>native</b> (untagged) VLAN.`)}
<h3>Power first: PoE, classes and the budget</h3>
<p>Module 1 introduced PoE. The two ends are the ${K.g("PSE","Power sourcing equipment: what supplies PoE — the switch port or a power injector.")} (the switch) and the ${K.g("PD","Powered device: what takes PoE from the cable — an AP, phone or camera.")} (the AP). The PSE first <b>detects</b> a real PD, then learns its ${K.g("PoE class","A number the device signals at start-up to say how much power it needs; class 4 = a PoE+ device. The switch reserves that much for the port.")} so it knows how much power to reserve.</p>
<div class="tablewrap"><table>
<tr><th>Standard</th><th>Common name</th><th>Per switch port (PSE)</th><th>Typical wireless use</th></tr>
<tr><td>802.3af (2003)</td><td>PoE</td><td>15.4 W</td><td>older or small APs; many modern APs run with features switched off</td></tr>
<tr><td>802.3at (2009)</td><td>PoE+</td><td>30 W</td><td>most Wi-Fi 5 and many Wi-Fi 6 APs at full function</td></tr>
<tr><td>802.3bt (2018)</td><td>PoE++ · 4-pair</td><td>60 W (Type 3) or 90 W (Type 4)</td><td>high-end Wi-Fi 6E/7 APs, APs with extra radios or ports</td></tr>
</table></div>
<p>The cable loses a little, so the AP gets less than the port sends (about 12.95 W of 15.4 W, 25.5 W of 30 W). Cisco sells 60 W and 90 W ports as ${K.g("UPOE","Universal PoE: Cisco's name for 60 W ports; UPOE+ (90 W) follows 802.3bt.")} and UPOE+. Two consequences:</p>
<ul>
<li><b>Read the AP's data sheet.</b> Many Wi-Fi 6/6E APs boot on 802.3af but switch off a radio or some features until they get PoE+ or more.</li>
<li><b>Mind the budget.</b> The switch has one pool of PoE watts (Module 1). When it runs out, the next device gets no power — this lesson's on-the-job ticket.</li>
</ul>
<h3>Which port? Ask where the client traffic leaves the AP</h3>
<p>Turn lesson 3's AP modes into a cabling rule with one question: <i>on the AP's cable, which VLANs appear?</i></p>
${K.steps([
  ["Local mode (the default)", `Every client frame is wrapped in CAPWAP and sent to the controller (next section), so the cable only carries the AP's own packets in the AP's VLAN — however many SSIDs there are. <b>Access port</b> in the AP VLAN, with PortFast (Module 4) so the AP reaches DHCP at once.`],
  ["FlexConnect, central switching", "Traffic is still tunnelled to the controller: <b>access port</b>."],
  ["FlexConnect with local switching", "The AP puts client frames on its own cable, tagged with each WLAN's VLAN: <b>trunk</b>, with <b>native VLAN = the AP's own VLAN</b>, because the AP sends its own DHCP and CAPWAP untagged."],
  ["Autonomous AP with several SSIDs", "No controller: the AP maps each SSID to a VLAN itself: <b>trunk</b>."],
  ["Monitor and sniffer modes", "No client traffic: <b>access port</b>. (Rogue-detector mode, deprecated on current APs, used a trunk.)"],
])}
${K.svg("0 0 760 330",
  K.box(30,16,700,46,"Access / distribution switch","PoE+ on the AP ports · 802.1Q trunks where several VLANs leave a device",true)+
  K.link(110,62,110,100)+K.link(110,150,110,196)+K.link(290,62,290,100)+K.link(290,150,290,196)+K.link(455,62,455,100)+K.link(455,150,455,190)+K.link(485,62,485,100)+K.link(485,150,485,190)+K.link(650,62,650,100)+K.link(650,150,650,190)+
  K.band(40,100,140,24,"Gi0/5 access 30")+K.txt(110,142,"PortFast · PoE+",{mid:true,s:10.5,f:"body"})+
  K.band(220,100,140,24,"Gi0/6 trunk")+K.txt(290,142,"native 30 · allowed 30,50,60",{mid:true,s:10.5,f:"body"})+
  K.band(400,100,140,24,"Po1 trunk")+K.txt(470,142,"Gi0/1 + Gi0/2 · mode on",{mid:true,s:10.5,f:"body"})+
  K.band(580,100,140,24,"Gi0/8 access 199")+K.txt(650,142,"out-of-band, untagged",{mid:true,s:10.5,f:"body"})+
  K.dev("ap",110,212,"AP · local mode","all SSIDs ride CAPWAP")+
  K.dev("ap",290,212,"AP · FlexConnect","local switching")+
  K.box(400,190,320,46,"WLC (AireOS)","ports 1–2 = LAG (distribution) · SP = service port")+
  K.txt(380,294,"Tunnelled to the controller → one VLAN on the cable → access port.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,314,"Switched at the device → several VLANs on the cable → trunk, with the device's own VLAN native.",{mid:true,s:11,f:"body"}),
  "What each wireless device plugs into. The question is always the same: which VLANs leave this device on its cable?")}
${K.mistake(`Making every AP port a trunk &ldquo;to be safe&rdquo;. For a local-mode AP it buys nothing, and the AP's untagged traffic lands in the trunk's native VLAN (VLAN 1 by default) — usually no AP DHCP pool and no route to the controller. The AP never comes back.`)}
${K.check({q:"A local-mode AP serves three SSIDs: Staff (VLAN 40), Guest (VLAN 60) and Voice (VLAN 70). The AP itself is in VLAN 30. How should its switch port be configured?", o:["Trunk allowing 30, 40, 60 and 70","Access port in VLAN 30","Access port in VLAN 40, the main SSID","Trunk with native VLAN 40"], a:1, why:"In local mode every client frame travels inside CAPWAP to the controller, so on the AP's cable you only see the AP's own packets in its own VLAN. The controller, not the AP's switch port, puts client traffic into VLANs 40, 60 and 70."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four new APs at a school in Kano, each a different case. The AP management VLAN is 30. Match each AP with the switch port it needs.", pairs:[["Library AP, local mode, SSIDs Staff (VLAN 40) and Pupils (VLAN 41)","Access port in VLAN 30 — CAPWAP carries both SSIDs"],["Annex AP, FlexConnect, Staff and Pupils switched locally at the annex","Trunk, native 30, allowed 30,40,41 — both WLANs leave the AP tagged"],["Hostel AP, autonomous (no controller), two SSIDs on VLANs 40 and 41","Trunk — with no controller, the AP tags both VLANs itself"],["Hall AP, FlexConnect, only Pupils (VLAN 41) switched locally, Staff tunnelled","Trunk, native 30, allowed 30,41 — only Pupils leaves the AP tagged"]], why:"1. What is asked? The port for each AP. 2. Which rule? What leaves the AP on its cable: tunnelled = one VLAN = access; switched locally = trunk with the AP's VLAN native, allowing the locally switched VLANs. 3. Apply it: the library AP tunnels both SSIDs. The annex AP switches both locally. The autonomous AP has no controller, so it tags both VLANs itself. The hall AP switches only VLAN 41 locally — Staff still rides CAPWAP inside VLAN 30."})}

<h2>The controller's side: distribution ports, LAG and the service port</h2>
${K.remember(`<b>The rules:</b> an AireOS WLC's ${K.g("distribution ports","The controller's data ports: they carry CAPWAP from the APs, client traffic and in-band management.")} are always <b>802.1Q trunks</b>. To use several of them as one link, the WLC runs <b>LAG</b>: <b>all</b> distribution ports in <b>one</b> bundle, and the switch side must be <code>channel-group N mode on</code> — the controller speaks <b>neither LACP nor PAgP</b>. The ${K.g("service port","A separate port on most AireOS controllers for out-of-band management only: untagged, no AP or client traffic, its own subnet.")} is an <b>access</b> port.`)}
<h3>Why the controller needs a trunk</h3>
<p>The WLC is the far end of every tunnel: local-mode client frames come out of the controller, so it hands Staff frames to VLAN 40, Guest frames to VLAN 60 and its own ${K.g("management interface","The WLC's main IP address: APs join it and admins browse to it. Lesson 5 covers the controller's interfaces.")} traffic to its management VLAN. Several VLANs on one cable: a trunk. Two habits from Cisco's best practices:</p>
<ul>
<li><b>Tag the management VLAN</b>. On the WLC, VLAN identifier <code>0</code> means untagged.</li>
<li><b>Allow only what the WLC uses</b>: management plus every client VLAN. A missing client VLAN is a classic &ldquo;connects, but no address&rdquo; fault (lesson 5).</li>
</ul>
<h3>LAG: several ports, one logical link</h3>
<p>Module 4's EtherChannel is a LAG; a WLC bundles its distribution ports the same way, for bandwidth and to survive a cable failure. On AireOS the rules are stricter than between two switches:</p>
${K.steps([
  ["One bundle, all ports", "<b>Every</b> distribution port joins one port-channel — one LAG per controller, no spare ports outside it."],
  ["Static only on the switch", "The controller sends no LACP or PAgP, so each member gets <code>channel-group 1 mode on</code>. <code>active</code>, <code>passive</code>, <code>desirable</code> or <code>auto</code> wait for a partner that never speaks: no bundle."],
  ["Identical members, trunk on the bundle", "Configure the trunk once on <code>interface port-channel 1</code>."],
  ["Enable it on the controller and reboot", "CONTROLLER → General → <i>LAG Mode on next reboot</i> = Enabled, Apply, Save Configuration, reboot (CLI: <code>config lag enable</code>, <code>save config</code>)."],
])}
<p>Without LAG, each controller interface uses a <b>primary port</b> and optionally a <b>backup port</b> — redundancy without shared bandwidth. Cisco prefers LAG.</p>
${K.out(`PHC-DIST1#show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
...
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)       -           Gi0/1(P)    Gi0/2(P)`, "A healthy LAG to a WLC (abridged): Po1(SU) in use, members (P) bundled, Protocol \"-\" = mode on. LACP or PAgP here is wrong.")}
${K.mistake(`Applying the switch team's EtherChannel template (<code>mode active</code>, LACP) to the controller. AireOS never answers LACP, so the bundle never forms. The &ldquo;on only&rdquo; rule is AireOS's; the Catalyst 9800 runs IOS XE and supports LACP — follow its own guide.`)}
<h3>The service port: management that doesn't depend on the network</h3>
<p>The service port gives ${K.g("out-of-band management","Reaching a device over a separate path that doesn't depend on the production network. The console is out-of-band too.")}: the ${K.g("GUI","Graphical user interface: here, the controller's web pages, reached with a browser over HTTPS (lesson 5).")} stays reachable even if the distribution ports are broken. No 802.1Q tags, so an <b>access</b> port in a management-only VLAN and subnet. APs never join through it.</p>
${K.when([
  ["Access port","Local-mode or centrally switched FlexConnect AP; monitor AP; WLC service port","One VLAN leaves the device","The device tags several VLANs"],
  ["Trunk","WLC distribution ports; FlexConnect local switching; autonomous AP","Several VLANs leave; native = the device's own VLAN","A local-mode AP"],
  ["EtherChannel mode on","WLC distribution ports with LAG","AireOS speaks no LACP/PAgP","Switch-to-switch links; a Catalyst 9800"],
], "Which port for which wireless device?")}
<h3>Try it: cable the hotel's new controller and APs</h3>
<p>A Port Harcourt hotel: an AireOS controller with LAG on two ports, two local-mode ceiling APs, the service port. VLANs: 30 APs, 40 staff Wi-Fi, 60 guest Wi-Fi, 99 controller management, 199 out-of-band.</p>
${K.term({env:"ios2", title:"PHC-DIST1 — ports for the controller and the APs", opts:{kind:"switch", host:"PHC-DIST1", model:"C9300-24P", motd:"PHC-DIST1 — console session (lab switch, no enable secret). Gi0/1-2 = WLC ports 1-2, Gi0/5-6 = ceiling APs, Gi0/8 = WLC service port."},
  setup:env=>{ ["enable","configure terminal","vlan 30","name APS","vlan 40","name STAFF-WIFI","vlan 60","name GUEST-WIFI","vlan 99","name WLC-MGMT","vlan 199","name OOB-MGMT","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"No controller is attached here, so in <code>show etherchannel summary</code> read the group, Po and Protocol columns; on site the members show (P).",
  tasks:[
    {text:"The two ceiling APs run in local mode: <code>interface range g0/5 - 6</code>, <code>switchport mode access</code>, <code>switchport access vlan 30</code>, <code>spanning-tree portfast</code>", done:e=>["GigabitEthernet0/5","GigabitEthernet0/6"].every(n=>e.intfs[n].mode==="access" && e.intfs[n].vlan===30 && e.intfs[n].stp && e.intfs[n].stp.portfast)},
    {text:"The controller's ports 1 and 2 arrive on Gi0/1–2: bundle them statically, because AireOS speaks no LACP or PAgP — <code>interface range g0/1 - 2</code>, <code>channel-group 1 mode on</code>", done:e=>["GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>e.intfs[n].channel && e.intfs[n].channel.group===1 && e.intfs[n].channel.mode==="on")},
    {text:"Make the bundle an 802.1Q trunk carrying only what the controller uses — management 99 and the client VLANs 40 and 60: <code>interface port-channel 1</code>, <code>switchport mode trunk</code>, <code>switchport trunk allowed vlan 40,60,99</code>", done:e=>{ const p=e.intfs["Port-channel1"]; return !!p && p.mode==="trunk" && Array.isArray(p.allowed) && [40,60,99].every(v=>p.allowed.includes(v)) && !p.allowed.includes(30) && p.allowed.length===3; }},
    {text:"Gi0/8 is the controller's service port: untagged, out-of-band — an access port in VLAN 199", done:e=>e.intfs["GigabitEthernet0/8"].mode==="access" && e.intfs["GigabitEthernet0/8"].vlan===199},
    {text:"<code>end</code>, then check your work with <code>show etherchannel summary</code> (Protocol column?) and <code>show interfaces trunk</code>, and save with <code>copy running-config startup-config</code>", done:e=>e.history.some(h=>/^\s*sh\S*\s+eth\S*\s+su/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+int\S*\s+tr/i.test(h)) && !!e.savedOnce},
  ],
  win:"The hotel's wiring plan, in config: the local-mode APs on PortFast access ports in VLAN 30 (CAPWAP carries their SSIDs), the controller's two ports in a static mode-on bundle trunking only 40, 60 and 99, and the service port on its own untagged VLAN. The Protocol column shows \"-\": nothing to negotiate, which is exactly what AireOS needs.",
  solve:["enable","configure terminal","interface range g0/5 - 6","switchport mode access","switchport access vlan 30","spanning-tree portfast","interface range g0/1 - 2","channel-group 1 mode on","interface port-channel 1","switchport mode trunk","switchport trunk allowed vlan 40,60,99","interface g0/8","switchport mode access","switchport access vlan 199","end","show etherchannel summary","show interfaces trunk","copy running-config startup-config",""]})}
${K.hint(`Task 3: the AP VLAN (30) isn't on the controller's trunk — the APs reach the controller by routing to its management address in VLAN 99. Task 5: <code>copy running-config startup-config</code> asks for a file name; press Enter for the default.`)}
${K.check({q:"A switch engineer configures channel-group 1 mode active on the two ports facing an AireOS WLC with LAG enabled. What happens?", o:["An LACP bundle forms, because LACP is the standard","The bundle never forms: the WLC doesn't speak LACP, so the switch waits for a partner that never answers","The WLC switches itself to LACP mode","Only one port carries traffic, but the bundle shows as up"], a:1, why:"AireOS LAG is static. The switch must use mode on; active (LACP) or desirable (PAgP) need the other end to negotiate, and the WLC never will."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A bank's head office in Abuja has an AireOS 5520 with four distribution ports, all cabled to Gi1/0/1–4 of one switch, plus its service port. Which three switch-side statements match the rules? (Choose three.)", o:["Gi1/0/1–4 all go into one port-channel with channel-group 1 mode on","The port-channel is an 802.1Q trunk allowing the management VLAN and every client VLAN the WLC's interfaces use","The service port goes on an access port in a management-only VLAN","Use LACP active on two ports and keep two ports outside the bundle as spares","Make the service port a trunk so it can back up the distribution ports"], a:[0,1,2], why:"1. What is asked? The switch side of a controller with LAG. 2. Which rules? Every distribution port in one mode-on bundle, trunked; the service port is untagged and carries no production traffic. 3. Apply them: one bundle of all four with management and client VLANs; the service port on its own access VLAN. No spares outside the bundle, no LACP."})}

<h2>CAPWAP: the tunnel that makes an AP lightweight</h2>
${K.remember(`<b>The rule:</b> a lightweight AP and its controller talk over ${K.g("CAPWAP","Control And Provisioning of Wireless Access Points (RFC 5415, with RFC 5416 for 802.11): the IETF protocol between lightweight APs and their controller. Module 1 introduced it.")}, which uses <b>two UDP ports on the controller</b>: <b>5246 = control</b> (discovery, then join, configuration and keep-alives — everything after discovery always encrypted with DTLS) and <b>5247 = data</b> (client traffic tunnelled to the controller — DTLS optional). Memory hook: <b>46 talks, 47 carries</b>.`)}
<p>Lesson 3's split-MAC halves need a road between them, and CAPWAP is ordinary IP: the AP needs only an address and a <b>route</b> to the controller's management address, one switch away or across a WAN. Two channels:</p>
<ul>
<li><b>Control, UDP 5246:</b> discovery (sent in the clear), then join, configuration and keep-alives — always protected with DTLS (Module 1) once the two have checked each other's certificates.</li>
<li><b>Data, UDP 5247:</b> in local mode, every client frame, wrapped in CAPWAP, UDP and an outer AP-to-controller IP header. Data DTLS is optional and off by default: WPA2/WPA3 (lesson 6) protects the radio hop, but the AP decrypts frames before tunnelling them, so switch data DTLS on across links you don't trust.</li>
</ul>
${K.svg("0 0 760 290",
  K.dev("laptop",60,110,"NURSE-LAP","VLAN 40 client")+K.dev("ap",200,110,"AP-WARD3","10.40.30.10")+K.dev("switch",340,110,"WRD-SW1","")+K.dev("router",470,110,"WRD-R1","routes 30 ↔ 99")+
  K.box(570,88,170,46,"WLC-1","mgmt 10.40.99.10",true)+
  K.link(86,112,174,112,"Wi-Fi",true)+K.link(222,112,312,112,"VLAN 30")+K.link(368,112,444,112)+K.link(496,112,568,112,"VLAN 99")+
  K.arrow(200,58,640,58,"CAPWAP: control UDP 5246 (DTLS) · data UDP 5247",true)+
  K.txt(200,52,"AP",{mid:true,s:10})+K.txt(655,62,"WLC",{s:10})+
  K.band(40,182,170,26,"IP 10.40.30.10 → .99.10")+K.band(214,182,96,26,"UDP 5247")+K.band(314,182,90,26,"CAPWAP")+K.band(408,182,312,26,"the client's 802.11 frame","var(--panel2)")+
  K.txt(380,236,"Every router and firewall in between sees only AP → controller UDP packets, never the client's VLAN or addresses.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,256,"The controller removes the wrapping and puts the frame on its trunk, tagged with the WLAN's VLAN (40 here).",{mid:true,s:11,f:"body"})+
  K.txt(380,276,"That is why a local-mode AP needs only an access port and a route — not the client VLANs.",{mid:true,s:11,f:"body"}),
  "A local-mode AP tunnels a client frame to the controller. The outer header is AP-to-WLC; the client's frame rides inside.")}
<h3>What CAPWAP means for the rest of your network</h3>
<ul>
<li><b>Routing:</b> AP subnet ↔ controller management subnet, both ways. In local mode the client VLANs exist only behind the controller.</li>
<li><b>ACLs and firewalls (Module 8):</b> permit <b>UDP 5246 and 5247</b> to the controller. Block 5246 and the AP never joins — it looks just like a wrong controller address.</li>
<li><b>Where client traffic appears:</b> local mode — at the <b>controller's trunk</b>; FlexConnect local switching — at the <b>AP's own port</b>. Both benches show it in the frame log.</li>
</ul>
${K.dyk(`CAPWAP grew out of Cisco's earlier LWAPP (${K.g("LWAPP","Lightweight Access Point Protocol: Cisco's protocol before CAPWAP, replaced from AireOS 5.2.")}), which used UDP 12222 and 12223. CAPWAP is an open IETF standard, yet in practice an AP joins only its own vendor's controllers.`)}
${K.exam(`Reading CAPWAP and port questions: first decide <b>which channel</b> the question is about — anything to do with joining, configuring or keep-alives is <b>control, 5246</b>; client traffic is <b>data, 5247</b>. Then check the <b>AP mode</b> before deciding where client traffic leaves. Trap answers: TCP instead of UDP, the old LWAPP ports, and &ldquo;DTLS on both channels by default&rdquo;.`)}
${K.check({q:"A firewall between the AP floors and the data centre must let lightweight APs join their WLC and carry client traffic. What must it permit to the controller's management address?", o:["TCP 5246 and 5247","UDP 5246 and 5247","UDP 12222 and 12223","TCP 443, because CAPWAP control uses DTLS"], a:1, why:"CAPWAP runs over UDP: 5246 for control (DTLS-protected) and 5247 for data. TCP is wrong, 12222/12223 are LWAPP's old ports, and DTLS is TLS over UDP — not TCP 443."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A logistics company in Lagos puts its WLC (management 10.10.99.5) in a data-centre VLAN behind a firewall, and its warehouse APs in 10.30.0.0/16. Fill in the firewall rule that lets the APs join and tunnel client traffic.", fields:[{label:"Protocol", a:["udp"]},{label:"Destination port for control (join, config)", a:["5246"]},{label:"Destination port for client data", a:["5247"]}], why:"1. What is asked? The protocol and ports for the AP-to-controller tunnel. 2. Which rule? CAPWAP: UDP, 5246 control (always DTLS), 5247 data. 3. Apply it: permit UDP from 10.30.0.0/16 to 10.10.99.5 on 5246 and 5247 (a stateless router ACL also needs the replies permitted — Module 8). The client VLANs never cross this firewall in local mode."})}

<h2>How an AP finds and joins its controller</h2>
${K.remember(`<b>The rule:</b> an AP must <b>get an IP address</b>, build a <b>list of controllers</b> from every discovery method it has, <b>ask</b> them (discovery), <b>choose one</b> and <b>join</b> it, then <b>match its software</b> and <b>download its configuration</b> before it serves anyone. Order: <b>Power → IP → Discover → Join → Image → Config → RUN</b>.`)}
${K.svg("0 0 760 400",
  K.box(30,10,120,34,"DHCP server","")+K.box(240,10,120,34,"AP","",true)+K.box(600,10,120,34,"WLC","",true)+
  `<line x1="90" y1="44" x2="90" y2="380" stroke="var(--line)" stroke-dasharray="4 4"/><line x1="300" y1="44" x2="300" y2="380" stroke="var(--line)" stroke-dasharray="4 4"/><line x1="660" y1="44" x2="660" y2="380" stroke="var(--line)" stroke-dasharray="4 4"/>`+
  K.arrow(300,78,92,78,"1 Discover / Request")+K.arrow(90,108,298,108,"Offer / Ack: IP, gateway, option 43",true)+
  K.arrow(300,150,658,150,"2 CAPWAP Discovery Request (UDP 5246)")+K.arrow(660,180,302,180,"Discovery Response",true)+
  K.arrow(300,222,658,222,"3 Join Request — DTLS, certificates checked")+K.arrow(660,252,302,252,"Join Response",true)+
  K.arrow(300,294,658,294,"4 Image check: download and reboot if different")+
  K.arrow(660,334,302,334,"5 Configuration: WLANs, radio settings",true)+
  K.txt(300,368,"6 RUN: the AP broadcasts its SSIDs",{mid:true,c:"ok",b:true,f:"body",s:11.5})+
  K.txt(308,64,"0 PoE: power and boot",{s:10,f:"body"}),
  "The join sequence. An AP that differs in software version downloads the controller's image, reboots and starts again from step 1.")}
${K.steps([
  ["Power, then an IP address", "PoE, then DHCP in its VLAN; the reply can also carry option 43 and a domain name. No address, no CAPWAP."],
  ["Discover", "The AP sends <b>Discovery Requests</b> to every controller it has learned of (methods below), plus a broadcast on its subnet. Each controller answers with a <b>Discovery Response</b> that includes its load."],
  ["Choose and join", `It picks one (rules below) and the two bring up the DTLS control channel, checking each other's certificates — every Cisco AP has a factory ${K.g("MIC","Manufacturing Installed Certificate: burnt into every Cisco AP at the factory so a controller can verify it is genuine.")} — then the AP sends its <b>Join Request</b> inside it.`],
  ["Image check", "Different software? The AP downloads the controller's version, reboots and starts again — why first joins take minutes."],
  ["Configuration, then RUN", "WLANs, radio settings and mode arrive; in RUN the AP broadcasts its SSIDs and appears under WIRELESS → All APs."],
])}
<h3>Discovery: how the AP learns controller addresses</h3>
<div class="tablewrap"><table>
<tr><th>Method</th><th>How it works</th><th>Needs</th></tr>
<tr><td><b>Local subnet broadcast</b></td><td>The AP broadcasts a Discovery Request on its own subnet</td><td>A controller management interface <b>in the AP's subnet</b> — broadcasts don't cross routers</td></tr>
<tr><td><b>DHCP option 43</b></td><td>The AP's DHCP reply lists controller addresses, in hex (next section)</td><td>A DHCP pool for the AP subnet with option 43</td></tr>
<tr><td><b>DNS</b></td><td>The AP looks up <code>CISCO-CAPWAP-CONTROLLER.</code><i>&lt;its domain&gt;</i></td><td>That DNS record, and a domain name for the AP — DHCP option 15, the pool's <code>domain-name</code> (Module 7)</td></tr>
<tr><td><b>Primed / static</b></td><td>Primary, secondary and tertiary controllers set on the AP (the controller's High Availability tab, or the AP's CLI)</td><td>A first join, or console access to the AP</td></tr>
<tr><td><b>Previously joined</b></td><td>Controllers remembered from earlier joins</td><td>Stored in the AP's ${K.g("NVRAM","Non-volatile memory (Module 1): storage that survives a power cycle.")}</td></tr>
</table></div>
<h3>Choosing a controller</h3>
<p>The AP prefers its configured <b>primary</b>, then <b>secondary</b>, then <b>tertiary</b>; with none (a new AP), a ${K.g("master controller","An AireOS setting that makes one controller the home for new APs with no primary — on during an installation, then off.")}; otherwise the <b>least-loaded</b> controller. After a failover it returns to its primary. So engineers <b>prime</b> each AP after its first join.</p>
${K.when([
  ["Local broadcast","Controller in the AP subnet","Zero configuration","APs routed apart from the controller"],
  ["DHCP option 43","Routed AP subnets, many new APs","Every new AP learns it from DHCP","Other vendors' APs share the pool"],
  ["DNS","Multi-site networks with internal DNS","One record serves every subnet","No domain name (option 15) for the APs"],
  ["Primed controller","After the first join","Predictable; survives DHCP changes","Brand-new APs"],
], "Which discovery method?")}
${K.tip(`After an AP&rsquo;s first join, prime it: WIRELESS → All APs → the AP → High Availability, then the Primary (and Secondary) Controller name and management IP. From then on it no longer depends on DHCP or DNS to find home.`)}
${K.mistake(`Expecting a broadcast to cross a router. An AP in 10.40.30.0/24 and a controller in 10.40.99.0/24 are routed apart: use option 43, DNS or priming.`)}
${K.check({q:"A brand-new AP gets an address in 10.20.30.0/24. Its DHCP pool has default-router and domain-name branch.example.com but no option 43. The DNS server has an A record CISCO-CAPWAP-CONTROLLER.branch.example.com pointing to the controller at 10.10.99.5. What happens?", o:["The AP can't find the controller without option 43","The AP resolves CISCO-CAPWAP-CONTROLLER.branch.example.com, gets 10.10.99.5 and joins (if it can route there)","The AP broadcasts and reaches 10.10.99.5 through the router","The AP joins the least-loaded controller on its own subnet"], a:1, why:"DNS discovery needs exactly two things: a domain name for the AP (option 15, from domain-name) and the CISCO-CAPWAP-CONTROLLER record in that domain. Both are present, so the AP learns 10.10.99.5. A broadcast would stop at the router."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A brand-new AP is unboxed in a Port Harcourt hotel's annex, on a PoE+ access port in VLAN 30. Its DHCP pool includes option 43 for the controller in the main building. Put what happens in order.", items:["The switch detects the AP and powers it over PoE","The AP leases an address in VLAN 30 and reads option 43","It sends CAPWAP Discovery Requests to the listed controller","The controller answers with a Discovery Response","The AP sends a Join Request and the DTLS control channel comes up","The AP finds its software differs, downloads the controller's image and reboots","After rejoining, it downloads its WLANs and enters RUN"], why:"1. What is asked? The start-up order. 2. Which rule? Power → IP → Discover → Join → Image → Config → RUN. 3. Apply it: no CAPWAP without power and an address; discovery before join; a software mismatch means reboot and repeat; WLANs arrive last, so clients see the SSID only at the end."})}

<h2>DHCP option 43: the controller list in hex</h2>
${K.remember(`<b>The rule:</b> for Cisco APs, option 43 is one ${K.g("TLV","Type-Length-Value: one byte says what the item is, one byte how many bytes follow, then the bytes.")}: <b>type <code>f1</code></b> (241), then <b>length = 4 × number of controllers</b> (in hex), then <b>each controller's management IP as 8 hex digits</b> (two per octet). One controller: <code>f1 04 …</code>; two: <code>f1 08 …</code>; three: <code>f1 0c …</code>.`)}
<p>${K.g("DHCP option 43","Vendor-specific information: a DHCP option whose contents each vendor defines. Cisco APs read their controller list from it.")} is vendor-specific: DHCP carries the bytes, each vendor decides their meaning. On IOS you type them with <code>option 43 hex</code>; IOS shows them back in dotted groups of four hex digits.</p>
${K.svg("0 0 760 250",
  K.txt(380,22,"Option 43 for one controller, 172.16.99.20",{mid:true,c:"fg",b:true,f:"body",s:12})+
  K.band(60,48,80,30,"f1","var(--chip)")+K.band(150,48,80,30,"04","var(--chip)")+K.band(270,48,80,30,"ac")+K.band(360,48,80,30,"10")+K.band(450,48,80,30,"63")+K.band(540,48,80,30,"14")+
  K.txt(100,96,"type 241",{mid:true,s:10.5,f:"body"})+K.txt(100,110,"Cisco WLC list",{mid:true,s:10.5,f:"body"})+
  K.txt(190,96,"length: 4 bytes",{mid:true,s:10.5,f:"body"})+K.txt(190,110,"= 1 controller",{mid:true,s:10.5,f:"body"})+
  K.txt(310,96,"172",{mid:true,c:"fg",s:11})+K.txt(400,96,"16",{mid:true,c:"fg",s:11})+K.txt(490,96,"99",{mid:true,c:"fg",s:11})+K.txt(580,96,"20",{mid:true,c:"fg",s:11})+
  K.txt(445,114,"the management IP, one octet per byte",{mid:true,s:10.5,f:"body"})+
  K.txt(380,150,"IOS:  option 43 hex f104.ac10.6314",{mid:true,c:"accent",s:12})+
  K.txt(380,186,"Two controllers, 172.16.99.20 then 172.16.99.21 → length 08 (2 × 4 bytes):",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,208,"option 43 hex f108.ac10.6314.ac10.6315",{mid:true,c:"accent",s:12})+
  K.txt(380,236,"Order matters: the AP tries the addresses in the order listed.",{mid:true,s:11,f:"body"}),
  "Option 43 byte by byte: type, length, then the controller addresses — every number in hex.")}
<h3>Worked example: a school in Enugu, one controller then two</h3>
${K.steps([
  ["Convert each octet to two hex digits", "172.16.99.20: 172 = 10 × 16 + 12 = <code>ac</code>, 16 = <code>10</code>, 99 = 6 × 16 + 3 = <code>63</code>, 20 = <code>14</code> → <code>ac106314</code>. Always two digits: 5 is <code>05</code>."],
  ["Length", "4 bytes per address: one controller <code>04</code>, two <code>08</code>, three <code>0c</code>."],
  ["Assemble", "<code>f1</code> + <code>04</code> + <code>ac106314</code> → <code>option 43 hex f104.ac10.6314</code> (dots optional when typing)."],
  ["Add a standby, primary first", "+ 172.16.99.21 (<code>ac106315</code>), length <code>08</code> → <code>option 43 hex f108.ac10.6314.ac10.6315</code>."],
  ["Decode to check", "Read it back, split into bytes, convert each to decimal. If you don't get your controllers, neither will the AP."],
])}
${K.out(`ENU-R1(config)#ip dhcp pool SCHOOL-APS
ENU-R1(dhcp-config)#network 172.16.30.0 255.255.255.0
ENU-R1(dhcp-config)#default-router 172.16.30.1
ENU-R1(dhcp-config)#option 43 hex f108ac106314ac106315
ENU-R1(dhcp-config)#end
ENU-R1#show running-config | section dhcp
ip dhcp pool SCHOOL-APS
 network 172.16.30.0 255.255.255.0
 default-router 172.16.30.1
 option 43 hex f108.ac10.6314.ac10.6315`, "Typed without dots, stored in dotted groups of four. A new option 43 line replaces the old one.")}
${K.out(`%CAPWAP-5-DHCP_OPTION_43: Controller address 172.16.99.20 obtained through DHCP`, "One line of a Cisco AP's own boot log when it reads option 43 (prefix and timestamps vary by AP software).")}
${K.drill({title:"decimal ↔ hex until option 43 is automatic", types:["dec2hex","hex2dec"], count:6})}
${K.mistake(`An octet left in decimal. 172.16.50.10 typed as <code>f104.ac10.320a</code> is right — but <code>f104.ac10.500a</code> looks just as plausible, and hex <code>50</code> is 80: the AP looks for 172.16.<b>80</b>.10. IOS accepts any valid hex, so decode before you trust it.`)}
${K.mistake(`A length byte that doesn't match the list. Add a second controller but leave <code>f104</code>, and the AP reads only the first (or rejects the option). Two controllers = <code>08</code>.`)}
${K.dyk(`Each vendor's APs read option 43 differently, so a server for several brands matches the ${K.g("vendor class identifier","DHCP option 60: a label the client sends to say what it is (a Cisco AP sends something like \"Cisco AP c3700\"), so the server returns the right vendor options.")} (option 60) and returns each vendor's own bytes. A dedicated AP pool avoids the problem.`)}
<h3>Try it: option 43 for the hotel's two controllers</h3>
<p>The Port Harcourt hotel has two controllers: WLC-A 10.60.99.20 (primary) and WLC-B 10.60.99.21. APs: 10.60.30.0/24. PHC-GW is the DHCP server.</p>
${K.term({env:"ios2", title:"PHC-GW — a DHCP pool that tells APs where both controllers are", opts:{kind:"router", host:"PHC-GW", model:"ISR 1100", motd:"PHC-GW — console session (lab router, no enable secret). AP subnet 10.60.30.0/24, gateway .1; controllers WLC-A 10.60.99.20, WLC-B 10.60.99.21."},
  setup:env=>{ env.history.length=0; },
  intro:"Work out the hex on paper first: 60 and 99, 20 and 21 — and the length byte for two controllers.",
  tasks:[
    {text:"Keep the gateway and the first static addresses out of the pool: <code>ip dhcp excluded-address 10.60.30.1 10.60.30.20</code>", done:e=>{ const D=window.DHCP; return !!e.dhcp && e.dhcp.excluded.some(r=>r[0]<=((10*256+60)*256+30)*256+1 && r[1]>=((10*256+60)*256+30)*256+20); }},
    {text:"Create <code>ip dhcp pool HOTEL-APS</code> with <code>network 10.60.30.0 255.255.255.0</code> and <code>default-router 10.60.30.1</code>", done:e=>{ const p=e.dhcp && e.dhcp.pools["HOTEL-APS"]; return !!p && p.len===24 && p.net===((10*256+60)*256+30)*256 && p.routers.includes("10.60.30.1"); }},
    {text:"Give the APs a domain name so DNS discovery works as a backup: <code>domain-name phc-hotel.example.com</code> (option 15)", done:e=>{ const p=e.dhcp && e.dhcp.pools["HOTEL-APS"]; return !!p && p.domain==="phc-hotel.example.com"; }},
    {text:"Add option 43 listing WLC-A first, then WLC-B: <code>option 43 hex …</code> — type f1, the length for two controllers, then both addresses in hex", done:e=>{ const p=e.dhcp && e.dhcp.pools["HOTEL-APS"]; return !!p && JSON.stringify(window.DHCP.capwapWlcs(p.opt43))===JSON.stringify(["10.60.99.20","10.60.99.21"]); }},
    {text:"<code>end</code>, read it back with <code>show running-config | section dhcp</code> — decode the stored value byte by byte — and save", done:e=>e.history.some(h=>/^\s*sh\S*\s+run\S*\s*\|\s*sec\S*\s+dhcp/i.test(h)) && !!e.savedOnce},
  ],
  win:"The hotel's APs will now learn both controllers from DHCP, primary first: f1 (Cisco's controller list), 08 (two addresses of four bytes), 0a3c6314 (10.60.99.20) and 0a3c6315 (10.60.99.21). And with the domain name in the pool, a CISCO-CAPWAP-CONTROLLER record in phc-hotel.example.com would give them a second way in.",
  solve:["enable","configure terminal","ip dhcp excluded-address 10.60.30.1 10.60.30.20","ip dhcp pool HOTEL-APS","network 10.60.30.0 255.255.255.0","default-router 10.60.30.1","domain-name phc-hotel.example.com","option 43 hex f108.0a3c.6314.0a3c.6315","end","show running-config | section dhcp","copy running-config startup-config",""]})}
${K.hint(`60 = 3 × 16 + 12 = <code>3c</code>; 99 = <code>63</code>; 20 = <code>14</code>; 21 = <code>15</code>. Two controllers × 4 bytes = 8 = <code>08</code>.`)}
${K.check({q:"An AP pool contains option 43 hex f104.c0a8.0a05. Which controller address does a Cisco AP learn?", o:["192.168.10.5","192.168.0.105","172.168.10.5","It learns nothing — f104 means four controllers"], a:0, why:"f1 = Cisco controller list, 04 = four bytes = one address. c0 = 192, a8 = 168, 0a = 10, 05 = 5: 192.168.10.5."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"Two new sites, two pools. Write each option 43 value in hex (dots optional). Site 1: one controller at 192.168.50.5. Site 2: primary 172.31.200.10, backup 172.31.200.11.", fields:[{label:"Site 1 option 43 hex", a:["f104c0a83205","f104.c0a8.3205","f1 04 c0 a8 32 05","0xf104c0a83205"]},{label:"Site 2 option 43 hex", a:["f108ac1fc80aac1fc80b","f108.ac1f.c80a.ac1f.c80b","f1 08 ac 1f c8 0a ac 1f c8 0b","0xf108ac1fc80aac1fc80b"]}], why:"1. What is asked? The TLV for each site. 2. Which rule? f1, then 4 × controllers in hex, then each address as two hex digits per octet. 3. Apply it: 192.168.50.5 = c0 a8 32 05 (50 = 3 × 16 + 2), so f104c0a83205. 172.31.200.10 = ac 1f c8 0a and .11 = ac 1f c8 0b (31 = 1 × 16 + 15 = 1f; 200 = 12 × 16 + 8 = c8); two controllers = 08, so f108ac1fc80aac1fc80b."})}
<h3>Hands-on: the Ward 3 AP that never joins</h3>
<p>Back to Ibadan. Find out why the AP can't find its controller, fix it, and prove it from a nurse's laptop. When it's right, AP-WARD3's arcs turn green, NURSE-LAP's Wi-Fi panel lists Ward-Staff and WIRELESS → All APs shows the AP.</p>
${K.bench({id:"m9-ward-opt43", points:120, openLog:true, from:"CCNA · Module 9 · lesson 4", title:"Ibadan teaching hospital: the Ward 3 AP has power and an address — but no controller", viewBox:"0 0 900 410",
  intro:"<b>Design sheet:</b> WRD-R1 G0/0 router-on-a-stick: .30 APs 10.40.30.1/24, .40 ward Wi-Fi 10.40.40.1/24, .99 controller management 10.40.99.1/24; DHCP pools WARD-APS and WARD-STAFF. WRD-SW1: Gi0/1 trunk to WRD-R1, Gi0/2 trunk to WLC-1, Gi0/3 PoE access port VLAN 30 for AP-WARD3. WLC-1: management 10.40.99.10 (VLAN 99); WLAN <b>Ward-Staff</b>, WPA2-PSK, lab key <code>Example-Ward-2026</code>, VLAN 40. <b>10.40.99.11</b> is reserved for next month's standby controller. Console: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1. <b>Lab notes:</b> the lab AP re-reads option 43 as soon as the pool changes — a real AP holding a lease usually needs a restart (shut / no shut its PoE port) or a renewal. The frame log shows the CAPWAP discovery and join as soon as they happen.",
  devices:[
    {id:"r1", kind:"router", label:"WRD-R1", x:40, y:20, config:e=>{ ["en","conf t","hostname WRD-R1","no ip domain-lookup","int g0/0","no shut","int g0/0.30","encapsulation dot1Q 30","ip address 10.40.30.1 255.255.255.0","int g0/0.40","encapsulation dot1Q 40","ip address 10.40.40.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.40.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.40.30.1 10.40.30.9","ip dhcp excluded-address 10.40.40.1 10.40.40.9","ip dhcp pool WARD-APS","network 10.40.30.0 255.255.255.0","default-router 10.40.30.1","option 43 hex f104.0a28.990a","exit","ip dhcp pool WARD-STAFF","network 10.40.40.0 255.255.255.0","default-router 10.40.40.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"WRD-SW1", x:240, y:150, config:e=>{ ["en","conf t","hostname WRD-SW1","vlan 30","name APS","vlan 40","name WARD-STAFF","vlan 99","name WLC-MGMT","exit","int g0/1","switchport mode trunk","int g0/2","switchport mode trunk","int g0/3","switchport mode access","switchport access vlan 30","spanning-tree portfast","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"WLC-1", x:600, y:20, wlc:{ mgmt:{ip:"10.40.99.10", mask:"255.255.255.0", gw:"10.40.99.1", vlan:99, port:1},
      ifaces:{ "ward-staff":{vlan:40, ip:"10.40.40.5", mask:"255.255.255.0", gw:"10.40.40.1", port:1, dhcp:"10.40.40.1"} },
      wlans:{ 1:{id:1, profile:"WARD-STAFF", ssid:"Ward-Staff", enabled:true, iface:"ward-staff", security:"wpa2-psk", cipher:"aes", psk:"Example-Ward-2026", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } } },
    {id:"ap", kind:"ap", label:"AP-WARD3", x:560, y:290},
    {id:"nl", kind:"laptop", label:"NURSE-LAP", x:740, y:290, dhcp:true, wifi:{ssid:null, key:null}},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:40, y:290},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"See the symptom as the nurse does: NURSE-LAP → <b>Wi-Fi</b> (no networks listed), then its Command Prompt: <code>netsh wlan show networks</code> (lists the SSIDs the laptop can hear). Look at AP-WARD3's arcs (grey = not joined) and open WLC-1's <b>Controller GUI</b> → WIRELESS → All APs", done:B=>Bench.tried(B,"nl",/netsh\s+wlan\s+show\s+net/i)},
    {text:"Console to WRD-R1, <code>enable</code>. Prove the AP has an address — <code>show ip dhcp binding</code> — so power, port and DHCP are fine. Then read the AP pool: <code>show running-config | section dhcp</code>. Decode the option 43 value byte by byte: which address is the AP being sent to?", done:B=>{ const h=B.devs.r1.env.history; return h.some(x=>/sh\S*\s+ip\s+dhcp\s+b/i.test(x)) && h.some(x=>/sh\S*\s+run\S*.*\|\s*sec\S*\s+(dhcp|WARD)/i.test(x)); }},
    {text:"Fix the pool so the AP is sent to WLC-1 (10.40.99.10): <code>configure terminal</code>, <code>ip dhcp pool WARD-APS</code>, <code>option 43 hex …</code> (a new option 43 line replaces the old one). Watch AP-WARD3's arcs, the All APs page and the frame log's CAPWAP lines", done:B=>{ const p=B.devs.r1.env.dhcp.pools["WARD-APS"]; return !!p && window.DHCP.capwapWlcs(p.opt43)[0]==="10.40.99.10" && Bench.apJoined(B,"ap"); }},
    {text:"The design reserves 10.40.99.11 for next month's standby controller. List both, primary first, so new APs know about it from day one — the length byte changes. Read the pool back with <code>show running-config | section WARD-APS</code>", done:B=>{ const p=B.devs.r1.env.dhcp.pools["WARD-APS"]; return !!p && JSON.stringify(window.DHCP.capwapWlcs(p.opt43))===JSON.stringify(["10.40.99.10","10.40.99.11"]) && Bench.apJoined(B,"ap"); }},
    {text:"Prove it as the nurse: NURSE-LAP → <b>Wi-Fi</b> → Ward-Staff with key <code>Example-Ward-2026</code>. Then <code>ipconfig</code> (an address in VLAN 40) and <code>ping 10.40.40.1</code>. In the frame log, find which WRD-SW1 port the laptop's frames use — the AP's Gi0/3, or the controller's trunk Gi0/2?", done:B=>Bench.wifiAssoc(B,"nl") && Bench.wifiVlan(B,"nl")===40 && Bench.pinged(B,"nl","10.40.40.1")},
    {text:"Save WRD-R1 with <code>copy running-config startup-config</code>", done:B=>!!B.devs.r1.env.savedOnce && (()=>{ const p=B.devs.r1.env.dhcp.pools["WARD-APS"]; return !!p && window.DHCP.capwapWlcs(p.opt43)[0]==="10.40.99.10"; })()},
  ],
  win:"Ward 3 is on the air. The contractor's pool said f104.0a28.990a: the 99 had been typed in decimal, and hex 99 is 153, so the AP kept asking 10.40.153.10, where nothing answers. With f108.0a28.630a.0a28.630b the AP learns WLC-1 first and the future standby second, joins, downloads Ward-Staff and broadcasts it. And the frame log showed local mode at work: the nurse's ping left the network at the controller's trunk (Gi0/2, tagged VLAN 40), not at the AP's port.",
  solve:[["pc","nl","netsh wlan show networks"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip dhcp binding"],["term","show running-config | section dhcp"],
    ["term","configure terminal"],["term","ip dhcp pool WARD-APS"],["term","option 43 hex f104.0a28.630a"],["term","end"],
    ["term","configure terminal"],["term","ip dhcp pool WARD-APS"],["term","option 43 hex f108.0a28.630a.0a28.630b"],["term","end"],["term","show running-config | section WARD-APS"],
    ["wifi","nl","Ward-Staff","Example-Ward-2026"],["pc","nl","ipconfig"],["pc","nl","ping 10.40.40.1"],
    ["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: split <code>f104.0a28.990a</code> into bytes — f1, 04, 0a, 28, 99, 0a — and convert the last four from hex: 0a = 10, 28 = 40, 99 = 9 × 16 + 9 = 153, 0a = 10. Task 3: 99 in hex is <code>63</code>. Task 4: two controllers = 8 bytes = <code>08</code>, and 11 = <code>0b</code>.`)}

<h2>FlexConnect at a branch: when the AP's port must be a trunk</h2>
${K.remember(`<b>The rule:</b> with FlexConnect <b>local switching</b>, client frames leave the AP <b>tagged with the WLAN's VLAN</b> on the AP's own cable. That port must be a <b>trunk</b> that allows those VLANs, with <b>native VLAN = the AP's own VLAN</b> — otherwise the AP's untagged CAPWAP and DHCP traffic lands in the wrong VLAN and the AP loses its controller.`)}
<p>Lesson 3 explained why branches use FlexConnect local switching: branch traffic skips the WAN round trip and survives a WAN outage. The cable changes too: an access port worked while every VLAN hid inside CAPWAP; switch locally and the VLANs come out at the branch switch.</p>
${K.steps([
  ["Before: access port in the AP VLAN", "The AP joins fine (CAPWAP is IP in VLAN 30), but a client's DHCP Discover leaves the AP <b>tagged VLAN 50</b> and the access port drops it: &ldquo;connected&rdquo;, 169.254 address."],
  ["Half-fixed: <code>switchport mode trunk</code> alone", "VLAN 50 passes — but the native VLAN is 1, so the AP's untagged traffic is now in VLAN 1: no gateway, CAPWAP drops."],
  ["Fixed: trunk, native = AP VLAN, allowed = what it needs", "<code>switchport trunk native vlan 30</code> and <code>switchport trunk allowed vlan 30,50</code>: the AP rejoins, clients get branch addresses."],
])}
${K.out(`KAN-SW1#show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Gi0/1       on               802.1q         trunking      1
Gi0/3       on               802.1q         trunking      30

Port        Vlans allowed on trunk
Gi0/1       1-4094
Gi0/3       30,50`, "A FlexConnect AP's port done right (abridged): native 30, allowed 30 and 50.")}
${K.mistake(`Checking only the switch end. On AireOS a locally switching FlexConnect AP has <i>VLAN Support</i> and a <i>Native VLAN ID</i> on its FlexConnect tab; that ID should match the switch port's native VLAN. Read both ends.`)}
<h3>Hands-on: the Kano clerks who are &ldquo;connected&rdquo; but can't work</h3>
<p>A Lagos company's new Kano branch. Yesterday HQ put the branch AP in FlexConnect with local switching and primed it with the HQ controller. Today's ticket: <i>&ldquo;Kano: the clerks' laptops say connected to Kano-Staff, but nothing opens.&rdquo;</i></p>
${K.bench({id:"m9-kano-flex-trunk", points:130, openLog:true, from:"CCNA · Module 9 · lesson 4", title:"Kano branch: FlexConnect local switching needs a trunk — with the right native VLAN", viewBox:"0 0 1000 420",
  intro:"<b>Design sheet:</b> Lagos — LOS-HQ-R1 (G0/0.99 10.10.99.1/24, WAN G0/1 10.255.0.1/30), LOS-SW1, WLC-HQ 10.10.99.5. Kano — KAN-R1 (WAN 10.255.0.2/30; G0/0.30 APs 10.20.30.1/24, G0/0.50 staff Wi-Fi 10.20.50.1/24; DHCP for both). KAN-SW1 Gi0/1 trunk to KAN-R1, <b>Gi0/3 = AP-KANO1</b>. AP-KANO1: FlexConnect, primary controller 10.10.99.5. WLAN <b>Kano-Staff</b>: lab key <code>Example-Kano-2026</code>, VLAN 50, local switching. Console: PuTTY on YOUR LAPTOP to KAN-SW1, 9600 8N1. <b>Lab note:</b> real AireOS also needs <i>VLAN Support</i> and the <i>Native VLAN ID</i> on the AP's FlexConnect tab; the lab takes the VLAN from the WLAN's interface.",
  devices:[
    {id:"hq", kind:"router", label:"LOS-HQ-R1", x:40, y:20, config:e=>{ ["en","conf t","hostname LOS-HQ-R1","no ip domain-lookup","int g0/0","no shut","int g0/0.99","encapsulation dot1Q 99","ip address 10.10.99.1 255.255.255.0","int g0/1","description WAN to Kano","ip address 10.255.0.1 255.255.255.252","no shut","exit","ip route 10.20.0.0 255.255.0.0 10.255.0.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"hsw", kind:"switch", label:"LOS-SW1", x:20, y:150, config:e=>{ ["en","conf t","hostname LOS-SW1","vlan 99","name WLC-MGMT","exit","int g0/1","switchport mode trunk","int g0/2","switchport mode trunk","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"WLC-HQ", x:40, y:300, wlc:{ mgmt:{ip:"10.10.99.5", mask:"255.255.255.0", gw:"10.10.99.1", vlan:99, port:1},
      ifaces:{ "kano-staff":{vlan:50, ip:null, mask:null, gw:null, port:1, dhcp:null} },
      wlans:{ 2:{id:2, profile:"KANO-STAFF", ssid:"Kano-Staff", enabled:true, iface:"kano-staff", security:"wpa2-psk", cipher:"aes", psk:"Example-Kano-2026", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:true} } } },
    {id:"br", kind:"router", label:"KAN-R1", x:560, y:20, config:e=>{ ["en","conf t","hostname KAN-R1","no ip domain-lookup","int g0/1","description WAN to Lagos","ip address 10.255.0.2 255.255.255.252","no shut","int g0/0","no shut","int g0/0.30","encapsulation dot1Q 30","ip address 10.20.30.1 255.255.255.0","int g0/0.50","encapsulation dot1Q 50","ip address 10.20.50.1 255.255.255.0","exit","ip route 10.10.0.0 255.255.0.0 10.255.0.1","ip dhcp excluded-address 10.20.30.1 10.20.30.9","ip dhcp excluded-address 10.20.50.1 10.20.50.9","ip dhcp pool KANO-APS","network 10.20.30.0 255.255.255.0","default-router 10.20.30.1","exit","ip dhcp pool KANO-STAFF","network 10.20.50.0 255.255.255.0","default-router 10.20.50.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"bsw", kind:"switch", label:"KAN-SW1", x:540, y:150, config:e=>{ ["en","conf t","hostname KAN-SW1","vlan 30","name APS","vlan 50","name STAFF-WIFI","exit","int g0/1","switchport mode trunk","int g0/3","description AP-KANO1","switchport mode access","switchport access vlan 30","spanning-tree portfast","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:540, y:300},
    {id:"ap", kind:"ap", label:"AP-KANO1", x:700, y:300, mode:"flexconnect", primary:"10.10.99.5"},
    {id:"cl", kind:"laptop", label:"CLERK-LAP", x:860, y:300, dhcp:true, wifi:{ssid:"Kano-Staff", key:"Example-Kano-2026"}},
  ],
  cables:[ {type:"cat6", a:"hq:g0", b:"hsw:g1"}, {type:"cat6", a:"wlc:p1", b:"hsw:g2"}, {type:"cat6", a:"hq:g1", b:"br:g1"}, {type:"cat6", a:"br:g0", b:"bsw:g1"}, {type:"cat6", a:"ap:eth", b:"bsw:g3"}, {type:"console", a:"lap:usb", b:"bsw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket on CLERK-LAP: <code>netsh wlan show interfaces</code> (State connected, SSID Kano-Staff — the Wi-Fi part works) and <code>ipconfig</code> (a 169.254 address: no DHCP answer). Then open WLC-HQ's <b>Controller GUI</b>: WIRELESS → All APs (AP-KANO1's mode) and WLANs → 2 → Advanced (FlexConnect Local Switching). Where must the clerk's frames leave the network?", done:B=>Bench.tried(B,"cl",/netsh\s+wlan\s+show\s+int/i) && Bench.tried(B,"cl",/^\s*ipconfig/i)},
    {text:"Console to KAN-SW1, <code>enable</code>, and look at the AP's port: <code>show interfaces g0/3 switchport</code>. What is its mode, and which VLAN can it carry?", done:B=>B.devs.bsw.env.history.some(h=>/sh\S*\s+int\S*\s+g\S*0\/3\s+sw/i.test(h))},
    {text:"Let VLAN 50 through: <code>configure terminal</code>, <code>interface g0/3</code>, <code>switchport mode trunk</code>. Now watch AP-KANO1's arcs and the frame log — what happened to the AP, and why?", done:B=>B.devs.bsw.env.intfs["GigabitEthernet0/3"].mode==="trunk"},
    {text:"Put the AP's own untagged traffic back in its VLAN and trim the trunk: <code>switchport trunk native vlan 30</code> and <code>switchport trunk allowed vlan 30,50</code>. Done when AP-KANO1 has rejoined WLC-HQ (arcs green)", done:B=>{ const i=B.devs.bsw.env.intfs["GigabitEthernet0/3"]; return i.mode==="trunk" && i.native===30 && Array.isArray(i.allowed) && i.allowed.includes(30) && i.allowed.includes(50) && i.allowed.length<=3 && Bench.apJoined(B,"ap"); }},
    {text:"Prove it for the clerks: CLERK-LAP <code>ipconfig</code> (an address in 10.20.50.0/24) and <code>ping 10.20.50.1</code>. In the frame log, which KAN-SW1 port do the laptop's frames arrive on, with which tag — and did they cross the WAN?", done:B=>Bench.wifiAssoc(B,"cl") && Bench.wifiVlan(B,"cl")===50 && /^10\.20\.50\./.test(B.devs.cl.ip||"") && Bench.pinged(B,"cl","10.20.50.1")},
    {text:"Evidence for the ticket and save: <code>end</code>, <code>show interfaces trunk</code>, <code>copy running-config startup-config</code>", done:B=>{ const e=B.devs.bsw.env; return e.history.some(h=>/^\s*sh\S*\s+int\S*\s+tr/i.test(h)) && !!e.savedOnce; }},
  ],
  win:"Kano works locally. FlexConnect local switching put the clerk's frames on AP-KANO1's own cable tagged VLAN 50, and an access port in VLAN 30 dropped them — Wi-Fi connected, DHCP never answered. Making Gi0/3 a plain trunk let VLAN 50 through but moved the AP's own untagged traffic into native VLAN 1, so the AP lost WLC-HQ. Native VLAN 30 plus allowed 30,50 fixed both: the AP rejoined across the WAN, and the clerk's DHCP and ping went to KAN-R1 through Gi0/3 without ever leaving Kano.",
  solve:[["pc","cl","netsh wlan show interfaces"],["pc","cl","ipconfig"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces g0/3 switchport"],
    ["term","configure terminal"],["term","interface g0/3"],["term","switchport mode trunk"],
    ["term","switchport trunk native vlan 30"],["term","switchport trunk allowed vlan 30,50"],["term","end"],
    ["pc","cl","ipconfig"],["pc","cl","ping 10.20.50.1"],
    ["term","show interfaces trunk"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: FlexConnect + local switching = the clerk's frames leave at the AP's own port, tagged VLAN 50. Task 2: <i>Administrative Mode: static access</i> and <i>Access Mode VLAN: 30</i> — a VLAN 50 tag has nowhere to go. Task 3: the AP sends its own traffic untagged; on a trunk, untagged means the native VLAN, which is 1 unless you change it. Task 5: a DHCP laptop retries by itself when the network changes; <code>ipconfig</code> shows the new address.`)}
${K.job("“Since the new APs went up on the fifth floor, three of them never appear”",`
<p><b>The ticket.</b> Thursday 10:05, a consultancy in Victoria Island, Lagos: &ldquo;Eight new APs on floor 5; only five show on the controller; three have no lights. Cabling tests fine.&rdquo;</p>
<p><b>Questions first.</b> Same switch? What else does it power? All eight are on LOS-F5-SW2, a 48-port PoE+ switch that also powers 16 phones and 6 cameras. Dark APs with good cables suggest <b>power</b>, not data.</p>
<p><b>Checks.</b> All APs lists five; <code>show cdp neighbors</code> sees the same five. Then:</p>
${K.out(`LOS-F5-SW2#show power inline

Module   Available     Used     Remaining
          (Watts)     (Watts)    (Watts)
------   ---------   --------   ---------
1           370.0      354.4       15.6
Interface Admin  Oper       Power   Device              Class Max
                            (Watts)
--------- ------ ---------- ------- ------------------- ----- ----
Gi1/0/1   auto   on         7.0     Ieee PD             2     30.0
...
Gi1/0/45  auto   on         30.0    C9120AXI-E          4     30.0
Gi1/0/46  auto   power-deny 0.0     Ieee PD             4     30.0
Gi1/0/47  auto   power-deny 0.0     Ieee PD             4     30.0
Gi1/0/48  auto   power-deny 0.0     Ieee PD             4     30.0`, "Abridged; layout and device names vary by platform. power-deny = a powered device detected, no budget left.")}
<p><b>Diagnosis.</b> 16 phones × 7 W (class 2) + 6 cameras × 15.4 W (class 3) = 204.4 W; five APs × 30 W = 354.4 W; 15.6 W is not enough for a sixth. The log agrees: <code>%ILPOWER-5-ILPOWER_POWER_DENY: Interface Gi1/0/46: inline power denied. Reason: insufficient power</code>. An unpowered AP never reaches DHCP.</p>
<p><b>Fix</b> (approved by facilities): move the six cameras to the camera switch (frees 92.4 W) today; add the second power supply next week. The three ports show <code>on</code>, and the APs boot, join and appear.</p>
<p><b>What you say:</b> &ldquo;The new access points needed more power than that switch had left. I've moved the cameras, all eight are running, and a second power supply is on order.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;LOS-F5-SW2: PoE budget 370 W exhausted (354.4 W used) — Gi1/0/46–48 power-deny. Moved 6 cameras (Gi1/0/33–38) to LOS-F5-CAM1. All 8 floor-5 APs ${K.g("REG","Registered: the Operational Status the controller shows for an AP that has joined it.")} on the controller at 10:42. PSU2 for LOS-F5-SW2 ordered (change request raised). Root cause: AP install not checked against the PoE budget. 40 min.&rdquo;</i></p>`)}
${K.case("The university whose controller uplinks never bundled",`
<p>A Lagos university replaced its core switches over a long weekend. The AireOS controller ran LAG on two ports, and the switch team pasted their standard template onto the new ports: <code>channel-group 10 mode active</code> — LACP, right for every switch-to-switch link on campus.</p>
<p><b>The symptom.</b> Monday: APs kept dropping off the controller and rejoining. <code>show etherchannel summary</code> showed Po10 with protocol LACP and no member bundled (P); the switch log showed the controller's MAC address moving between the two ports.</p>
<p><b>Why.</b> The controller treats its ports as one bundle and sends out of either; the switch, waiting for LACP that never comes, treated them as separate links — so the controller's MAC kept moving and its traffic sometimes went the wrong way.</p>
<p><b>The fix.</b> <code>channel-group 10 mode on</code> on both members, trunk settings once on Po10. Po10 came up (SU), both members (P), the APs settled.</p>
<p><b>The lessons.</b> Name the wireless exception in your standards; &ldquo;protocol LACP&rdquo; in front of an AireOS WLC is a fault; after any change near a controller, check its uplinks still match the design.</p>`)}
${K.myth([
  ["A lightweight AP needs a trunk to serve several SSIDs on several VLANs.","Not in local mode: CAPWAP carries every SSID inside the AP's VLAN. Only locally switched traffic needs a trunk."],
  ["Links to an AireOS controller should use LACP like any EtherChannel.","AireOS LAG is static: channel-group N mode on. The controller speaks neither LACP nor PAgP."],
  ["CAPWAP runs over TCP.","UDP: 5246 control (always DTLS), 5247 data. CAPWAP handles control-message reliability itself."],
  ["Option 43 carries the controller address as text.","For Cisco APs it is a hex TLV: f1, the length, then each address as hex bytes."],
  ["A new AP joins the nearest controller.","Primary, secondary, tertiary; then a master controller; then the least loaded. Distance doesn't count."],
])}
${K.dodont([
  "Ask which VLANs leave the device on its cable before choosing access or trunk.",
  "FlexConnect local-switching ports: native = AP VLAN, allow only what's needed.",
  "Decode option 43 back to decimal before trusting it.",
  "Check the PoE budget before new APs go up; prime APs after the first join.",
],[
  "Don't trunk local-mode AP ports &ldquo;just in case&rdquo;.",
  "Don't apply the LACP template to a WLC's uplinks.",
  "Don't block UDP 5246/5247 between AP subnets and the controller.",
])}
${K.check({q:"A FlexConnect AP (AP VLAN 30) locally switches WLANs on VLANs 50 and 60. Its port is changed to switchport mode trunk with no other commands. What is the most likely result?", o:["Everything works: the trunk carries all VLANs","The AP's untagged traffic lands in native VLAN 1, so it loses its DHCP pool and its route to the controller","Clients get addresses but the AP shows as a native VLAN mismatch only","The switch refuses to make an AP port a trunk"], a:1, why:"The AP sends its own DHCP and CAPWAP traffic untagged. On a trunk, untagged frames belong to the native VLAN — VLAN 1 by default — where the AP's VLAN 30 gateway and pool don't exist. Set switchport trunk native vlan 30 (and prune the allowed list to 30,50,60)."})}
<h3>Same logic, new situation</h3>
<p>A hospital annex in Abuja uses FlexConnect with local switching: AP VLAN 20, Clinical WLAN on VLAN 120, Visitors WLAN on VLAN 130. Visitors get addresses; clinical tablets connect but show 169.254. The AP's port is <code>switchport mode trunk</code>, <code>switchport trunk native vlan 20</code>, <code>switchport trunk allowed vlan 20,130</code>. What is wrong and what is the one-line fix?</p>
${K.hint(`Which VLAN do the clinical tablets' frames carry on the AP's cable — and is it in the allowed list?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why one locally switched WLAN works and the other doesn't. <b>2. Which rule?</b> With local switching, each WLAN's frames leave the AP tagged with its VLAN, and the trunk must allow every one of them. <b>3. Apply it:</b> Visitors (130) is allowed, so it works. Clinical (120) is missing, so the switch drops those tagged frames and the tablets' DHCP Discovers never reach the router. Fix: <code>switchport trunk allowed vlan add 120</code> (the <code>add</code> keeps 20 and 130 — retyping the list without them would break the AP or the visitors).</p>`)}

<h2>Interview corner</h2>
${K.hint(`Start from where client traffic leaves the AP, then the native VLAN.`)}
${K.reveal("“Why is a local-mode AP on an access port, but a FlexConnect AP sometimes on a trunk?”",`<p>"It depends on where client traffic leaves the AP. In local mode every client frame is tunnelled in CAPWAP to the controller, so the AP's cable only carries the AP's own VLAN — an access port with PortFast. With FlexConnect local switching the AP tags client frames with each WLAN's VLAN on its own cable, so the port must be a trunk allowing them, with the AP's VLAN native because the AP's own CAPWAP and DHCP are untagged. The controller's uplinks are trunks — on AireOS, a mode-on LAG."</p>`)}
${K.hint(`Power, IP, discovery methods, selection, join, image, config — then the evidence you'd check.`)}
${K.reveal("“Walk me through how a lightweight AP joins a controller.”",`<p>"PoE, boot, then an IP by DHCP. It learns controllers from a local broadcast, DHCP option 43, DNS CISCO-CAPWAP-CONTROLLER in its domain, primed primary/secondary/tertiary entries and controllers it joined before. It sends CAPWAP discovery requests on UDP 5246, picks one — primary first, then a master controller, then the least loaded — and joins: certificates checked, DTLS control channel up. A software mismatch means download and reboot. Then it takes its configuration, enters RUN and broadcasts its SSIDs; client data in local mode uses UDP 5247."</p>`)}
${K.hint(`Layer by layer: power, link, address, route, discovery, join. What does each one look like when it fails?`)}
${K.reveal("“A new AP in another building never appears on the controller. How do you troubleshoot it?”",`<p>"I follow the join sequence. Power: show power inline — delivering, or power-deny? Port: up, access in the AP VLAN? Address: a DHCP binding for the AP? Then discovery: controller on the AP's subnet, or option 43 that decodes to its management address, or a DNS record plus a domain name? Then reachability: a route to the controller, and nothing blocking UDP 5246 and 5247. Once it joins, I prime it with its primary and backup controllers."</p>`)}

${K.recap([
  "Ask which VLANs leave a device on its cable: one (tunnelled) = access port; several (switched locally) = trunk, native VLAN = the device's own VLAN.",
  "Local-mode AP: access port with PortFast. FlexConnect local switching, autonomous APs and WLC distribution ports: trunks. Service port: access.",
  "PoE: 802.3af 15.4 W, 802.3at (PoE+) 30 W, 802.3bt 60/90 W per port; a switch has one budget, and power-deny means it ran out.",
  "AireOS LAG: every distribution port in one bundle, switch side channel-group N mode on — no LACP, no PAgP — trunk on the port-channel, reboot to enable.",
  "CAPWAP is UDP: 5246 control (always DTLS), 5247 data (DTLS optional). In between, routers see only AP-to-controller packets.",
  "Join: power → IP → discover → join (DTLS) → image → config → RUN. Discovery: broadcast, option 43, DNS, primed, remembered. Selection: primary, secondary, tertiary, master, least loaded.",
  "Option 43 = f1, length (4 × controllers), each address in hex: 172.16.99.20 → f104.ac10.6314. Decode before you trust it.",
])}
${K.next(`<b>Lesson 5 — the WLC GUI: interfaces, WLANs and management access.</b> The AP has joined; now build what it broadcasts. Create a dynamic interface with its VLAN and DHCP server, create a WLAN (it starts disabled), map it to the interface, pick a QoS profile, and lock down how admins reach the controller — and find out why the virtual interface is 192.0.2.1.`)}
`,
quiz:[
  {lvl:1, q:"Which ports does CAPWAP use on the controller?", o:["TCP 5246 for control and TCP 5247 for data","UDP 5246 for control and UDP 5247 for data","UDP 5247 for control and UDP 5246 for data","UDP 12222 for data and UDP 12223 for control"], a:1, why:"CAPWAP runs over UDP: 5246 carries control (discovery, join, configuration, keep-alives) and is always DTLS-protected; 5247 carries client data. 12222/12223 belonged to the older LWAPP."},
  {lvl:1, q:"A local-mode AP serves SSIDs mapped to VLANs 40, 60 and 70. The AP's own address is in VLAN 30. How should its switch port be configured?", o:["Trunk allowing VLANs 30, 40, 60 and 70","Access port in VLAN 30, ideally with PortFast","Access port in VLAN 40","Trunk with native VLAN 40"], a:1, why:"In local mode every client frame is tunnelled in CAPWAP to the controller, so only the AP's own VLAN appears on its cable. The controller puts client traffic into VLANs 40, 60 and 70 on its own trunk."},
  {lvl:1, type:"fill", q:"In DHCP option 43 for Cisco lightweight APs, what is the type byte, written in hex?", fields:[{label:"Type byte (hex)", a:["f1","0xf1"]}], why:"The Cisco controller list is TLV type f1 (decimal 241), followed by the length (4 × number of controllers) and the addresses in hex."},
  {lvl:1, type:"match", q:"Match each AP discovery method with what it needs to work.", pairs:[["Local subnet broadcast","A controller management interface in the AP's own subnet"],["DHCP option 43","A DHCP pool for the AP subnet listing controller addresses in hex"],["DNS","A CISCO-CAPWAP-CONTROLLER record and a domain name for the AP (option 15)"],["Primed controller","Primary/secondary/tertiary controllers configured on the AP after it joined once or from its CLI"]], why:"Broadcasts don't cross routers, so they only work when the controller shares the AP subnet. Option 43 and DNS deliver the controller list through DHCP and DNS; priming stores it on the AP itself."},
  {lvl:1, q:"How should an AireOS controller's service port be connected?", o:["To a trunk carrying every client VLAN","To an access port in a management-only VLAN — it can't carry 802.1Q tags and carries no AP or client traffic","Into the LAG with the distribution ports","To the AP VLAN, so APs can join through it"], a:1, why:"The service port is for out-of-band management only: untagged, in its own subnet, never used by APs or clients. The distribution ports (trunks, LAG) carry everything else."},
  {lvl:2, q:"Based on the exhibit from a branch router, which controllers will a Cisco AP in this pool learn, in which order?", ex:"ip dhcp pool BR-APS\n network 172.16.30.0 255.255.255.0\n default-router 172.16.30.1\n option 43 hex f108.ac10.0a05.ac10.0a06", o:["172.16.10.5, then 172.16.10.6","172.16.10.6, then 172.16.10.5","172.16.105.0 and 172.16.106.0","Only 172.16.10.5, because f1 allows one controller"], a:0, why:"f1 = Cisco controller list; 08 = 8 bytes = two addresses. ac 10 0a 05 = 172.16.10.5 and ac 10 0a 06 = 172.16.10.6, tried in the order listed."},
  {lvl:2, type:"multi", q:"Which two statements about LAG on an AireOS WLC are true? (Choose two.)", o:["The switch ports must use channel-group N mode on","All distribution ports join a single bundle","The switch should use LACP active so the bundle negotiates","You can build one bundle per client VLAN","LAG takes effect immediately without a controller reboot"], a:[0,1], why:"AireOS LAG is static (mode on — the controller speaks neither LACP nor PAgP) and puts every distribution port in one port-channel. Enabling it needs a save and a reboot (LAG Mode on next reboot)."},
  {lvl:2, type:"order", q:"Put the steps of a new lightweight AP's start-up in order.", items:["Receives PoE and boots","Gets an IP address (and option 43) by DHCP","Sends CAPWAP discovery requests and receives responses","Sends a join request; certificates are checked and the DTLS control channel comes up","Downloads the controller's image and reboots if its software differs","Downloads its configuration and enters RUN, broadcasting its SSIDs"], why:"Power → IP → discover → join → image check → configuration → RUN. A software mismatch sends the AP round the loop again after its reboot, which is why first joins can take minutes."},
  {lvl:2, type:"fill", q:"Write the option 43 value (hex, dots optional) for a single controller at 192.168.77.10.", fields:[{label:"option 43 hex", a:["f104c0a84d0a","f104.c0a8.4d0a","f1 04 c0 a8 4d 0a","0xf104c0a84d0a"]}], why:"192 = c0, 168 = a8, 77 = 4 × 16 + 13 = 4d, 10 = 0a. One controller = 4 bytes = 04. So f1 04 c0a84d0a: option 43 hex f104.c0a8.4d0a."},
  {lvl:2, q:"A FlexConnect AP in VLAN 30 locally switches the Staff WLAN on VLAN 50. After a change, the AP has dropped off the controller. Based on the exhibit, what is the fix?", ex:"BR-SW1#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/1       on               802.1q         trunking      1\nGi0/3       on               802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/1       1-4094\nGi0/3       1-4094", o:["On Gi0/3: switchport trunk native vlan 30 (and switchport trunk allowed vlan 30,50)","Make Gi0/3 an access port in VLAN 50","Change Gi0/1's native VLAN to 30","Put the AP back in local mode"], a:0, why:"The AP sends its own traffic untagged; with native VLAN 1 on Gi0/3 it now sits in VLAN 1, away from its gateway and the route to the controller. Native 30 puts it back; pruning to 30,50 carries only what it needs. An access port in VLAN 50 would break the AP; local mode would undo the branch design."},
  {lvl:2, q:"Based on the exhibit, why are the APs on Gi1/0/22 and Gi1/0/23 dark?", ex:"SW3#show power inline\n\nModule   Available     Used     Remaining\n          (Watts)     (Watts)    (Watts)\n------   ---------   --------   ---------\n1           370.0      360.0       10.0\nInterface Admin  Oper       Power   Device              Class Max\n                            (Watts)\n--------- ------ ---------- ------- ------------------- ----- ----\nGi1/0/21  auto   on         30.0    C9120AXI-E          4     30.0\nGi1/0/22  auto   power-deny 0.0     Ieee PD             4     30.0\nGi1/0/23  auto   power-deny 0.0     Ieee PD             4     30.0", o:["The cables are faulty","The PoE budget is exhausted: only 10 W remain and each AP needs 30 W","Option 43 is wrong, so the APs can't join","The ports are shut down"], a:1, why:"power-deny means the switch detected a powered device but had no budget left. 10 W remain; a class 4 AP needs 30 W. Free budget (move other devices, add a power supply) — an unpowered AP never reaches DHCP, so option 43 isn't the issue yet."},
  {lvl:2, q:"Branch offices use local-mode APs that tunnel everything to the head-office controller. When a branch's WAN link fails, its Wi-Fi users can't even print to the printer in the same room. Which change keeps local traffic working during a WAN outage?", o:["Move the APs to monitor mode","Use FlexConnect with local switching, and make each AP's port a trunk carrying the local WLAN VLANs","Add a second SSID","Shorten the DHCP lease"], a:1, why:"In local mode every client frame must reach the controller first, so no WAN means no Wi-Fi traffic at all. FlexConnect local switching puts branch traffic straight onto the branch switch — which is exactly why its AP ports need trunks."},
  {lvl:3, q:"New APs in a routed AP subnet never join. The DHCP pool has default-router but no domain-name and no option 43. The DNS server already has CISCO-CAPWAP-CONTROLLER.campus.example.com pointing to the controller, which is in another subnet and reachable. What is the smallest fix that uses the existing DNS record?", o:["Add domain-name campus.example.com to the AP pool","Add ip helper-address for the controller on the AP gateway","Move the controller into the AP subnet","Enable PortFast on the AP ports"], a:0, why:"DNS discovery needs both the record and a domain for the AP to append to CISCO-CAPWAP-CONTROLLER. Without option 15 the AP has no domain, so it never looks the record up. Moving the controller works but isn't small; PortFast only speeds up the link."},
  {lvl:3, q:"After new core switches were installed, APs keep dropping off an AireOS controller with LAG enabled, and the switch log shows the controller's MAC address moving between two ports. Based on the exhibit, what is the fix?", ex:"CORE1#show etherchannel summary\n...\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n10     Po10(SD)      LACP        Gi1/0/1(I)  Gi1/0/2(I)", o:["Change both members to channel-group 10 mode on","Change both members to channel-group 10 mode passive","Disable LAG on the controller and use one cable","Set the controller's ports to LACP active"], a:0, why:"Protocol LACP with stand-alone (I) members and a down Po10: the switch is waiting for LACP that an AireOS controller never sends, so it treats the two links separately while the controller treats them as one bundle — hence the MAC moving. AireOS supports only static LAG: mode on on both members. Passive is still LACP; the controller has no LACP setting."},
  {lvl:2, type:"multi", q:"A FlexConnect AP (AP VLAN 30) at a clinic locally switches Clinical (VLAN 120) and Visitors (VLAN 130). Its port is already switchport mode trunk. Which two further commands on that port complete it correctly? (Choose two.)", o:["switchport trunk native vlan 30","switchport trunk allowed vlan 30,120,130","switchport access vlan 120","switchport trunk native vlan 120","channel-group 1 mode on"], a:[0,1], why:"The AP sends its own traffic untagged, so the native VLAN must be the AP's VLAN, 30; the trunk must allow the AP VLAN plus both locally switched WLAN VLANs. An access VLAN does nothing on a trunk, native 120 would move the AP into the clinical VLAN, and LAG is for controller uplinks."},
],
cards:[
  {f:"Which switch port for which AP?", b:"Ask which VLANs leave the AP on its cable. Local mode or FlexConnect central switching: access port in the AP VLAN (PortFast). FlexConnect local switching or autonomous with several SSIDs: trunk, native = AP VLAN, allowed = AP VLAN + WLAN VLANs."},
  {f:"WLC switch ports", b:"Distribution ports: 802.1Q trunks (tag the management VLAN; allow management + client VLANs). Service port: access port, untagged, out-of-band management only, its own subnet."},
  {f:"AireOS LAG", b:"All distribution ports in one bundle; switch side channel-group N mode on (no LACP, no PAgP); trunk on the port-channel; enable with LAG Mode on next reboot, save, reboot. Without LAG: primary + backup port per interface."},
  {f:"PoE standards", b:"802.3af PoE 15.4 W per port (≈12.95 W at the AP) · 802.3at PoE+ 30 W (≈25.5 W) · 802.3bt 60 W Type 3 / 90 W Type 4. PSE = the switch, PD = the AP. One budget per switch; power-deny = budget exhausted."},
  {f:"CAPWAP ports", b:"UDP 5246 = control (discovery, join, config, keep-alives), always DTLS. UDP 5247 = data (tunnelled client frames), DTLS optional. 46 talks, 47 carries. (LWAPP used 12222/12223.)"},
  {f:"What CAPWAP hides", b:"In local mode the client's frame rides inside UDP/IP from AP to controller. Routers and firewalls in between see only AP-to-WLC packets; the client VLAN appears at the controller's trunk."},
  {f:"AP join sequence", b:"Power (PoE) → IP (DHCP) → CAPWAP discovery request/response → join request/response (MIC certificates, DTLS) → image check (download + reboot if different) → configuration → RUN, SSIDs broadcast."},
  {f:"AP discovery methods", b:"Local subnet broadcast (same subnet only) · DHCP option 43 · DNS CISCO-CAPWAP-CONTROLLER.<domain> (needs option 15) · primed primary/secondary/tertiary · controllers remembered in NVRAM."},
  {f:"Controller selection", b:"Configured primary, then secondary, then tertiary; otherwise a master controller; otherwise the least-loaded controller that answered. After failover the AP returns to its primary."},
  {f:"Option 43 format", b:"Type f1 · length = 4 × number of controllers (04, 08, 0c) · each management IP as 8 hex digits. 172.16.99.20 → option 43 hex f104.ac10.6314. Two: f108 + both addresses."},
  {f:"Option 43 mistakes", b:"A decimal octet in the hex (99 instead of 63 → the AP looks for .153); a length byte that doesn't match the list; one-digit hex (a instead of 0a). IOS accepts them all — decode before you trust it."},
  {f:"FlexConnect trunk trap", b:"switchport mode trunk alone puts the AP's untagged traffic in native VLAN 1: the AP loses its gateway and controller. Set switchport trunk native vlan <AP VLAN> and allow only the needed VLANs."},
],
});

// ---------- Module 9 · Lesson 5 ----------
L.push({
id:"wifi-wlc", mins:115, level:"Intermediate · builds on lessons 1–4, Module 4 (VLANs, trunks) and Module 7 (DHCP)",
t:"The WLC GUI: interfaces, WLANs, QoS profiles and management access",
html:`
${K.goals([
  "Navigate an AireOS controller's GUI and explain the chain it configures: WLAN → interface → VLAN → trunk → gateway and pool.",
  "Explain the management, virtual, service-port and dynamic interfaces — and why the virtual address is now 192.0.2.1.",
  "Create a dynamic interface and a WLAN, knowing every default and the rules for IDs, profile names and SSIDs.",
  "Choose a QoS profile and read the Advanced tab at CCNA depth.",
  "Diagnose &ldquo;connected, no address&rdquo;, and lock down management access with HTTPS, SSH and TACACS+ or RADIUS.",
])}
${K.pre(["Lessons 1–4 of this module: SSIDs, lightweight APs and the controller, AP modes, and how an AP joins over CAPWAP.","Module 4: VLANs, 802.1Q trunks, <code>switchport trunk allowed vlan</code>, router-on-a-stick subinterfaces.","Module 7 lessons 1–2: DHCP pools, excluded addresses, relays and giaddr, and what a 169.254 address proves.","Module 8: SSH vs Telnet, AAA, RADIUS vs TACACS+."])}

<h2>Why this matters at work</h2>
<p>Friday afternoon at a hotel in Abuja. A conference starts on Monday and the events manager wants guest Wi-Fi for 300 delegates — &ldquo;separate from the staff network, and nothing that slows the front desk's card machines.&rdquo; The access points are on the ceilings and joined to the ${K.g("WLC","Wireless LAN controller (lesson 3): the box or virtual machine that manages lightweight APs and the networks they broadcast.")}. The rest is yours to build before you go home.</p>
<p>It all happens in the controller's web ${K.g("GUI","Graphical user interface: pages, menus and buttons instead of typed commands.")}: an interface for the guest VLAN, a wireless network mapped to it, a lower priority for guest traffic and — because an auditor will ask — safe admin logins. One wrong field and delegates see &ldquo;Connected, no internet&rdquo; — or land on the staff subnet. This lesson is that GUI and the logic behind each field.</p>

<h2>The controller's GUI — and the one chain it configures</h2>
${K.remember(`<b>The rule in one line:</b> a client's frames follow a chain you build: the <b>WLAN</b> users pick is mapped to an <b>interface</b>; the interface is a <b>VLAN</b> with an address and a <b>DHCP server</b>; the controller sends that VLAN, tagged, up its <b>trunk</b>, and a router there is the clients' <b>gateway and DHCP pool</b>. Every link must exist, or the client connects and gets no address.`)}
<p>A ${K.g("WLAN","Wireless LAN: on a controller, one configured wireless network — ID, profile name, SSID, security, QoS and interface.")} is one wireless network: the ${K.g("SSID","Service set identifier (lesson 2): the network name users pick, up to 32 characters.")} people see plus everything behind it — security, priority and the VLAN its users join. In lesson 4 the AP joined the controller over ${K.g("CAPWAP","Control and Provisioning of Wireless Access Points (lesson 4): the AP–controller protocol; UDP 5246 control, 5247 data.")}; in local mode every client frame travels inside that tunnel to the controller, which decides where it goes next. That decision is what you configure today.</p>
${K.svg("0 0 760 350",
  K.txt(380,22,"Inside the controller — the mapping you configure",{mid:true,c:"fg",s:12,f:"body",b:true})+
  K.box(20,34,128,46,"WLAN 2 · GUEST","SSID Hotel-Guest",true)+K.arrow(148,57,166,57)+
  K.box(168,34,128,46,"interface guest","VLAN 30 (tagged)",true)+K.arrow(296,57,314,57)+
  K.box(316,34,128,46,"WLC port 1","802.1Q trunk")+K.arrow(444,57,462,57)+
  K.box(464,34,128,46,"SW1 Gi0/2","trunk to the WLC")+K.arrow(592,57,610,57)+
  K.box(612,34,128,46,"R1 Gi0/0.30","10.30.30.1 + pool")+
  K.txt(84,98,"what users pick;",{mid:true,s:10.5,f:"body"})+K.txt(84,112,"tick Enabled last",{mid:true,s:10.5,f:"body"})+
  K.txt(232,98,"IP 10.30.30.5 /24",{mid:true,s:10.5,f:"body"})+K.txt(232,112,"DHCP server 10.30.30.1",{mid:true,s:10.5,f:"body"})+
  K.txt(380,98,"tags each client",{mid:true,s:10.5,f:"body"})+K.txt(380,112,"frame with VLAN 30",{mid:true,s:10.5,f:"body"})+
  K.txt(528,98,"VLAN 30 must be",{mid:true,s:10.5,f:"body"})+K.txt(528,112,"allowed on the trunk",{mid:true,s:10.5,f:"body"})+
  K.txt(676,98,"gateway and a",{mid:true,s:10.5,f:"body"})+K.txt(676,112,"pool for 10.30.30.0/24",{mid:true,s:10.5,f:"body"})+
  K.txt(380,146,"Break any link and the client still shows Connected — but gets 169.254.x.x instead of an address.",{mid:true,c:"bad",s:11,f:"body"})+
  K.dev("laptop",70,250,"GUEST-LAP","connected")+K.dev("ap",220,250,"AP-LOBBY","local mode")+
  K.link(95,250,196,250,"radio",true)+
  K.box(330,182,150,42,"ABJ-WLC1","mgmt 10.30.99.5",true)+
  K.arrow(244,236,328,210,"",true)+K.txt(236,206,"CAPWAP tunnel",{c:"accent",s:10.5})+
  K.dev("switch",405,290,"ABJ-HTL-SW1","")+K.dev("router",640,290,"ABJ-HTL-R1","")+
  K.link(236,262,378,288)+K.txt(330,266,"access VLAN 10",{mid:true,s:10})+
  K.link(405,279,405,224)+K.txt(412,256,"trunk",{s:10})+
  K.link(431,290,614,290,"trunk · VLANs 10,20,30,99"),
  "Top: the logical chain. Bottom: the hardware — the AP on an access port tunnels client frames to the controller, which tags them with the interface's VLAN on its trunk.")}
<h3>Finding your way around</h3>
<p>You reach an ${K.g("AireOS","The software of Cisco's classic controllers (2504, 3504, 5520, 8540, vWLC). The newer Catalyst 9800 runs IOS XE.")} controller by browsing to <code>https://</code> plus its management address. AireOS is what CCNA exhibits show and what the lab draws. One menu bar runs across the top (the Commands, Help and Feedback menus complete it):</p>
<div class="tablewrap"><table>
<tr><th>Menu</th><th>What you go there for</th></tr>
<tr><td><b>MONITOR</b></td><td>Summary: APs, clients, WLANs; the client list</td></tr>
<tr><td><b>WLANs</b></td><td>Every wireless network: create, edit, enable</td></tr>
<tr><td><b>CONTROLLER</b></td><td>The controller itself: <b>Interfaces</b>, ports, general settings</td></tr>
<tr><td><b>WIRELESS</b></td><td>The APs (<b>All APs</b>, AP mode — lesson 3) and radios</td></tr>
<tr><td><b>SECURITY</b></td><td>RADIUS and TACACS+ servers, local users, login order</td></tr>
<tr><td><b>MANAGEMENT</b></td><td>How admins reach it: HTTP-HTTPS, Telnet-SSH, SNMP, syslog</td></tr>
</table></div>
<p><b>Apply</b>, on every page, makes that page's changes live. <b>Save Configuration</b>, top right, writes the configuration so it survives a reboot — the controller's <code>copy running-config startup-config</code>.</p>
${K.mistake(`Applying and walking away. Everything works until a power cut reboots the controller and Friday's guest WLAN has gone. Make <b>Save Configuration</b> the last click of every change. (The lab doesn't model reboots, so it has no Save button; a real controller does.)`)}
${K.check({q:"You built a WLAN and clicked Apply on each tab. Clients connect. What haven't you done?", o:["Nothing — Apply saves the configuration","Save Configuration, so the change survives a reboot","Rebooted the controller, which every WLAN change needs","Pushed the WLAN to each AP by hand"], a:1, why:"Apply makes it live; Save Configuration persists it. The controller pushes WLANs to its APs itself, with no reboot."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A student's laptop at a Kano campus has just associated to Campus-Students (WLAN 3, mapped to interface students, VLAN 40). Put the journey of its first DHCP Discover in order.", items:["The laptop sends the Discover over the radio to its AP","The AP (local mode) carries it inside the CAPWAP tunnel to the controller","The controller sees WLAN 3 → interface students and relays the request from that interface, in VLAN 40","The frame leaves the controller's port tagged with VLAN 40, and the switch trunk must allow VLAN 40","The router's subinterface for VLAN 40 answers from its pool for 10.40.40.0/24"], why:"1. What is asked? The order the request crosses the chain. 2. Which rule? WLAN → interface → VLAN → trunk → gateway/pool; in local mode everything goes through the controller first. 3. Apply it: radio, CAPWAP, the WLAN's interface picks the VLAN, the trunk must carry it, the pool answers. A break anywhere leaves 169.254.x.x."})}

<h2>Interfaces: management, virtual, service port and dynamic</h2>
${K.remember(`<b>The rule:</b> a controller <b>interface</b> is a logical connection to one VLAN: name, VLAN tag, address, gateway and (for clients) a DHCP server. <b>Management</b> is the controller itself (APs join it, you log in to it); <b>virtual</b> is a fake address clients see for DHCP and sign-in pages; the <b>service port</b> is out-of-band management; <b>dynamic</b> interfaces are the client VLANs you create.`)}
<p>A controller sits on a trunk with an address in several VLANs — like a router-on-a-stick (Module 4). Four kinds matter:</p>
${K.svg("0 0 760 310",
  `<rect x="258" y="10" width="240" height="290" rx="9" fill="none" stroke="var(--line)" stroke-width="1.4"/>`+
  K.txt(378,30,"ABJ-WLC1 · CONTROLLER → Interfaces",{mid:true,c:"fg",s:11.5,f:"body",b:true})+
  K.box(270,42,216,40,"management","VLAN 99 · 10.30.99.5",true)+
  K.box(270,92,216,40,"virtual","192.0.2.1")+
  K.box(270,142,216,40,"staff (dynamic)","VLAN 20 · 10.30.20.5",true)+
  K.box(270,192,216,40,"guest (dynamic)","VLAN 30 · 10.30.30.5",true)+
  K.box(270,248,216,40,"service-port","192.168.250.10 · out of band")+
  K.txt(250,59,"APs join here (CAPWAP);",{end:true,s:10.5,f:"body"})+K.txt(250,73,"admins log in here",{end:true,s:10.5,f:"body"})+
  K.txt(250,109,"fake DHCP / web sign-in address,",{end:true,s:10.5,f:"body"})+K.txt(250,123,"never routed, not pingable",{end:true,s:10.5,f:"body"})+
  K.txt(250,159,"WLAN STAFF → VLAN 20",{end:true,s:10.5,f:"body"})+K.txt(250,173,"DHCP server 10.30.20.1",{end:true,s:10.5,f:"body"})+
  K.txt(250,209,"WLAN GUEST → VLAN 30",{end:true,s:10.5,f:"body"})+K.txt(250,223,"DHCP server 10.30.30.1",{end:true,s:10.5,f:"body"})+
  K.txt(250,265,"management only, own port,",{end:true,s:10.5,f:"body"})+K.txt(250,279,"no 802.1Q tag, no clients",{end:true,s:10.5,f:"body"})+
  K.txt(504,67,"port 1 · tag 99")+K.txt(504,117,"no port: internal only")+K.txt(504,167,"port 1 · tag 20")+K.txt(504,217,"port 1 · tag 30")+K.txt(504,273,"own port · untagged")+
  K.link(612,142,672,142)+K.dev("switch",700,142,"SW1 Gi0/2","trunk 20,30,99"),
  "One controller, many VLANs: tagged interfaces share port 1's trunk; the virtual address never appears on the wire; the service port is separate and untagged.")}
<div class="tablewrap"><table>
<tr><th>Interface</th><th>What it does</th><th>Rules worth knowing</th></tr>
<tr><td><b>management</b></td><td>The controller's own address: admins browse and SSH to it, APs send CAPWAP joins to it (option 43 points here), RADIUS/TACACS+ traffic leaves from it</td><td>Can't be deleted; Cisco recommends a <b>tagged</b> VLAN; changing it needs a reboot</td></tr>
<tr><td><b>virtual</b></td><td>A made-up identity towards clients: the DHCP server they see, guest sign-in pages, mobility between controllers</td><td>An address <b>never used or routed anywhere</b> — today <b>192.0.2.1</b>; not pingable; changing it needs a reboot</td></tr>
<tr><td><b>service-port</b></td><td>A separate port for out-of-band management</td><td>Goes to an <b>access</b> port (no 802.1Q tags); never carries AP or client traffic</td></tr>
<tr><td><b>dynamic</b></td><td>The client VLANs — one per VLAN a WLAN should use</td><td>VLAN, address, gateway and <b>Primary DHCP Server</b>; its VLAN must be allowed on the trunk</td></tr>
</table></div>
<p>A WLAN not mapped to a dynamic interface uses <b>management</b> — the default, and a trap you'll meet on the job. (Redundancy interfaces, for paired controllers, are beyond the CCNA.)</p>
<h3>Why the virtual interface is 192.0.2.1 — and not 1.1.1.1</h3>
<p>The controller answers for the virtual address itself, so nothing real may own it, or clients trying to reach the real owner reach the controller instead. Cisco examples long used <b>1.1.1.1</b>; then a public DNS service appeared there and browsers began forcing HTTPS to it, breaking guest sign-in redirects. Cisco now recommends <b>192.0.2.1</b>.</p>
${K.dyk(`192.0.2.0/24 is &ldquo;TEST-NET-1&rdquo;, one of three blocks (with 198.51.100.0/24 and 203.0.113.0/24) that ${K.g("RFC","Request for Comments: the numbered documents that define internet standards.")} 5737 reserves for documentation. They will never be assigned to anyone. Inherited controllers still on 1.1.1.1 are a known clean-up item.`)}
<h3>Worked example: a dynamic interface for the hotel's guests</h3>
<p>Guests get VLAN 30, 10.30.30.0/24; ABJ-HTL-R1 is their gateway (10.30.30.1) and DHCP server. The controller takes 10.30.30.5, which the router's pool must <b>exclude</b>.</p>
${K.steps([
  ["CONTROLLER → Interfaces → New...", "<b>Interface Name</b> <code>guest</code>, <b>VLAN Id</b> <code>30</code>. Apply — the <b>Interfaces &gt; Edit</b> page opens."],
  ["Addresses", "<b>IP Address</b> 10.30.30.5, <b>Netmask</b> 255.255.255.0, <b>Gateway</b> 10.30.30.1. <b>Port Number</b> 1, the trunk port (a LAG, lesson 4, handles this for you)."],
  ["DHCP Information", "<b>Primary DHCP Server</b> 10.30.30.1 — where the controller sends guests' DHCP requests. Apply."],
  ["The wired side", "VLAN 30 allowed on the controller's trunk; a gateway for VLAN 30; a pool for 10.30.30.0/24 excluding .1–.9. You'll build that in the terminal below."],
])}
<p><b>VLAN Identifier 0 means untagged</b> — the trunk's native VLAN. A real tag is clearer, and Cisco recommends one for management.</p>
<h3>How clients get addresses: DHCP proxy</h3>
<p>By default the controller is a <b>DHCP proxy</b> — a relay, like Module 7's <code>ip helper-address</code>. A client's Discover arrives in the tunnel; the controller finds the WLAN's interface and sends the request as a <b>unicast to its Primary DHCP Server</b>, from the interface's address. That address is the giaddr, so the server picks the pool for 10.30.30.0/24 — Module 7's rule. The client's <code>ipconfig /all</code> then shows the <b>virtual address, 192.0.2.1</b>, as DHCP Server — in the lab too.</p>
<p>So <b>a blank Primary DHCP Server means no addresses</b>, and the interface's <b>VLAN must reach the server</b> up the trunk. With proxy turned off (<b>bridging</b> mode), the broadcast goes onto the VLAN untouched, the gateway's <code>ip helper-address</code> relays it, and clients see the real server. The lab models proxy mode: its frame log draws the Discover on the VLAN, then notes the relay.</p>
${K.out(`(Cisco Controller) >show interface summary

 Number of Interfaces.......................... 5

Interface Name                   Port Vlan Id  IP Address      Type    Ap Mgr Guest
-------------------------------- ---- -------- --------------- ------- ------ -----
guest                            1    30       10.30.30.5      Dynamic No     No
management                       1    99       10.30.99.5      Static  Yes    No
service-port                     N/A  N/A      192.168.250.10  Static  No     No
staff                            1    20       10.30.20.5      Dynamic No     No
virtual                          N/A  N/A      192.0.2.1       Static  No     No`, "The controller's CLI over SSH. Ap Mgr Yes: on 3504/5520/8540 controllers the management interface also terminates the APs' CAPWAP tunnels. Spacing simplified; HA-capable models also list redundancy-management and redundancy-port.")}
${K.check({q:"Which controller interface should carry an unused, non-routable address such as 192.0.2.1?", o:["management","service-port","virtual","a dynamic interface"], a:2, why:"The virtual interface is an internal identity for DHCP relay, web sign-in and mobility, so it must never collide with a real host: RFC 5737 space, usually 192.0.2.1. The others need real, reachable addresses."})}
<h3>Try it: the router side of a new wireless VLAN</h3>
<p>The controller only relays; a router owns the gateway and pool. A Port Harcourt hospital is adding a visitor WLAN on VLAN 50; the controller's interface will be 10.60.50.5. Build the router side on PH-HOSP-R1.</p>
${K.term({env:"ios2", title:"PH-HOSP-R1 — a gateway and a pool for VLAN 50", opts:{kind:"router", host:"PH-HOSP-R1", model:"C1111-4P", motd:"PH-HOSP-R1 — console session (lab router, no enable secret). Gi0/0 trunk to PH-HOSP-SW1: Gi0/0.20 staff 10.60.20.0/24, Gi0/0.99 wireless management 10.60.99.0/24."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","description TRUNK to PH-HOSP-SW1","no shutdown","interface g0/0.20","description STAFF","encapsulation dot1Q 20","ip address 10.60.20.1 255.255.255.0","interface g0/0.99","description WIRELESS MGMT","encapsulation dot1Q 99","ip address 10.60.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.60.20.1 10.60.20.20","ip dhcp pool STAFF","network 10.60.20.0 255.255.255.0","default-router 10.60.20.1","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. The VLAN 50 gateway is 10.60.50.1; the controller will use 10.60.50.5; the hospital's DNS server is 10.60.20.53.",
  tasks:[
    {text:"Create subinterface <code>g0/0.50</code> for VLAN 50 (<code>encapsulation dot1Q 50</code>) with the gateway address 10.60.50.1/24 and a description", done:e=>{ const i=e.intfs["GigabitEthernet0/0.50"]; return !!i && i.encap===50 && i.ip==="10.60.50.1" && i.mask==="255.255.255.0"; }},
    {text:"Keep the gateway and the controller out of the pool: exclude 10.60.50.1 to 10.60.50.20", done:e=>{ const n=s=>s.split(".").reduce((a,o)=>a*256+(+o),0); return e.dhcp.excluded.some(r=>r[0]<=n("10.60.50.1") && r[1]>=n("10.60.50.5")); }},
    {text:"Pool <code>PATIENT-GUEST</code>: network 10.60.50.0/24, default router 10.60.50.1, DNS server 10.60.20.53, and an 8-hour lease (<code>lease 0 8</code> = 0 days, 8 hours) because visitors come and go", done:e=>Object.values(e.dhcp.pools).some(p=>p.len===24 && p.routers.includes("10.60.50.1") && p.dns.includes("10.60.20.53") && Array.isArray(p.lease) && p.lease[0]===0 && p.lease[1]===8 && window.DHCP.poolFor(e.dhcp,"10.60.50.1")===p)},
    {text:"<code>end</code>, then check your work: <code>show ip interface brief</code> (is Gi0/0.50 up/up?) and <code>show ip dhcp pool PATIENT-GUEST</code> (how many addresses are excluded?)", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+br/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+dhcp\s+pool/i.test(h))},
  ],
  win:"The router side is ready: VLAN 50 has a gateway, the pool skips .1–.20 so the controller's 10.60.50.5 is never handed out, and visitors get 8-hour leases. The controller's VLAN 50 interface would point its Primary DHCP Server at 10.60.50.1, and its relay address 10.60.50.5 tells this router which pool to use.",
  solve:["enable","configure terminal","interface g0/0.50","description PATIENT-GUEST Wi-Fi","encapsulation dot1Q 50","ip address 10.60.50.1 255.255.255.0","exit","ip dhcp excluded-address 10.60.50.1 10.60.50.20","ip dhcp pool PATIENT-GUEST","network 10.60.50.0 255.255.255.0","default-router 10.60.50.1","dns-server 10.60.20.53","lease 0 8","exit","end","show ip interface brief","show ip dhcp pool PATIENT-GUEST"]})}
${K.hint(`<code>encapsulation dot1Q</code> must come before <code>ip address</code> on a subinterface. The pool never mentions VLAN 50: IOS picks the pool whose network contains the relay address (10.60.50.5) or the receiving interface's address.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"An Ibadan office adds a 'Contractors' WLAN on VLAN 70, subnet 10.80.70.0/24. The router 10.80.70.1 is the gateway and runs the pool. The design gives the controller the address .5 in every client VLAN. Fill in the controller's Interfaces > New and Edit fields.", fields:[{label:"VLAN Id", a:["70"]},{label:"IP Address", a:["10.80.70.5"]},{label:"Netmask", a:["255.255.255.0","/24"]},{label:"Gateway", a:["10.80.70.1"]},{label:"Primary DHCP Server", a:["10.80.70.1"]}], why:"1. What is asked? A dynamic interface's fields. 2. Which rule? An interface = a VLAN + the controller's own address in it + the subnet's gateway + the DHCP server to relay to. 3. Apply it: VLAN 70; 10.80.70.5/24; gateway and DHCP server both 10.80.70.1 — and the pool must exclude .5."})}

<h2>Creating a WLAN: Create New → Go, and every default it starts with</h2>
${K.remember(`<b>The rule:</b> a new WLAN is born <b>Disabled</b>, on the <b>management</b> interface, with <b>WPA2 + AES and 802.1X</b> security, QoS <b>Silver</b> and <b>Broadcast SSID</b> on. You change what the design needs — interface, security, QoS — and tick <b>Status Enabled last</b>. The <b>ID</b> can never change, IDs above 16 aren't broadcast by default, and profile names and SSIDs are at most 32 characters.`)}
<h3>The WLANs page</h3>
${K.out(`WLANs
Current Filter: None                          [ Create New  v ] [ Go ]

WLAN ID  Type  Profile Name  WLAN SSID     Admin Status  Security Policies
1        WLAN  STAFF         Hotel-Staff   Enabled       [WPA2][Auth(PSK)]
2        WLAN  GUEST         Hotel-Guest   Disabled      [WPA2][Auth(802.1X)]`, "WLANs → WLANs just after WLAN 2 was created. Disabled and 802.1X are defaults, not choices anyone made. (Text drawing of the AireOS 8.10 page.)")}
<p>Read this list first in any wireless ticket. <b>Security Policies</b> sums up Layer 2 security: <code>[WPA2][Auth(PSK)]</code> = WPA2 with a pre-shared key, <code>[WPA2][Auth(802.1X)]</code> = per-user logins checked by RADIUS, <code>None</code> = open.</p>
<h3>WLANs &gt; New: four fields and their rules</h3>
<div class="tablewrap"><table>
<tr><th>Field</th><th>What it is</th><th>Rules</th></tr>
<tr><td><b>Type</b></td><td><code>WLAN</code>; <code>Guest LAN</code> and <code>Remote LAN</code> are for wired ports</td><td>CCNA: always WLAN</td></tr>
<tr><td><b>Profile Name</b></td><td>Internal name, shown in lists and logs</td><td>Unique, up to 32 characters</td></tr>
<tr><td><b>SSID</b></td><td>The name in beacons and on users' screens</td><td>Up to 32 characters, case-sensitive; may differ from the profile name</td></tr>
<tr><td><b>ID</b></td><td>The WLAN's number, from the free ones</td><td>1–512 on most controllers. The default AP group advertises only <b>1–16</b>; higher IDs need an AP group. Can't be changed — only deleted and re-created</td></tr>
</table></div>
<p>Apply, and the page becomes <b>WLANs &gt; Edit 'GUEST'</b>, with four tabs that matter:</p>
${K.svg("0 0 760 250",
  [["General",10,["Profile Name, SSID","Status: Enabled (tick last!)","Security Policies (read-only)","Radio Policy: All","Interface/Interface Group(G)","Broadcast SSID: Enabled"]],
   ["Security",198,["Layer 2 | Layer 3 | AAA Servers","L2: None, WPA+WPA2,","   WPA2+WPA3, Enhanced Open","Key Mgmt: 802.1X (default)","   or PSK + key (lesson 6)","L3: None or Web Policy"]],
   ["QoS",386,["Platinum (voice)","Gold (video)","Silver (best effort) — default","Bronze (background)","WMM Policy"]],
   ["Advanced",574,["Allow AAA Override","Session Timeout 1800 s","Client Exclusion 60 s","Maximum Allowed Clients","DHCP Addr. Assignment Req.","P2P Blocking Action","FlexConnect Local Switching"]]]
  .map(([t,x,ls])=>`<rect x="${x}" y="40" width="176" height="146" rx="6" fill="none" stroke="var(--line)"/>`+K.band(x,10,176,26,t)+ls.map((l,i)=>K.txt(x+10,60+i*18,l,{s:10.5,f:"body",c:"fg"})).join("")).join("")+
  K.txt(380,212,"A new WLAN: Disabled · management interface · WPA2-AES + 802.1X · Silver · Broadcast SSID on",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,232,"Each tab has its own Apply. Save Configuration (top right) makes it survive a reboot.",{mid:true,s:11,f:"body"}),
  "WLANs > Edit: what lives on which tab — exam exhibits are screenshots of these.")}
<h3>The General tab</h3>
<ul>
<li><b>Status</b> — <code>Enabled</code>. Unticked, no AP broadcasts the SSID. Profile name and SSID can change only while it is unticked.</li>
<li><b>Radio Policy</b> — <code>All</code> radios by default, or only 5 GHz, only 2.4 GHz and so on.</li>
<li><b>Interface/Interface Group(G)</b> — this one field puts the WLAN's clients in a VLAN. Default: <code>management</code>.</li>
<li><b>Broadcast SSID</b> — on by default. Off makes the network &ldquo;hidden&rdquo;: users must type its name.</li>
</ul>
<h3>The Security tab — just enough for today</h3>
<p>A new WLAN's Layer 2 Security is <code>WPA+WPA2</code> (${K.g("WPA","Wi-Fi Protected Access: Wi-Fi's security schemes WPA, WPA2 and WPA3 (lesson 6).")} — WPA2 Policy, <b>AES</b> and <b>802.1X</b> ticked). ${K.g("802.1X","Per-user network login (Module 8): a RADIUS server checks each user before the device gets on.")} means every user needs a RADIUS account — right for staff, useless for guests, and impossible in a lab with no RADIUS server. Today you need <b>Layer 2 Security = None</b> (open) or WPA2 with a ${K.g("PSK","Pre-shared key: one passphrase every user types — WPA2 Personal (lesson 6).")} (untick 802.1X, tick PSK, enter an 8–63 character passphrase); lesson 6 covers WPA2, WPA3 and PSKs properly. Layer 3 can add a guest sign-in page (<code>Web Policy</code>); AAA Servers picks RADIUS servers.</p>
<h3>Worked example: the hotel's guest WLAN, field by field</h3>
${K.steps([
  ["WLANs → Create New → Go", "Type <code>WLAN</code>, Profile <code>GUEST</code>, SSID <code>Hotel-Guest</code>, ID <code>2</code>. Apply. The list shows it <b>Disabled</b>, <code>[WPA2][Auth(802.1X)]</code>."],
  ["General", "Interface <code>guest</code> (VLAN 30); Status still unticked. Apply."],
  ["Security → Layer 2", "<code>None</code>. Apply — Security Policies now reads <code>None</code>. (A real hotel adds a sign-in page or encryption — lesson 6.)"],
  ["QoS", "<code>Bronze (background)</code>, so guests never compete with the front desk (next section). Apply."],
  ["General → Status Enabled", "Last. Apply — the APs broadcast Hotel-Guest. Save Configuration; prove it from a client (ipconfig: 10.30.30.x)."],
])}
${K.myth([
  ["A new WLAN is live as soon as you click Apply on the New page.","It is created Disabled; no AP broadcasts it until Status is ticked and applied."],
  ["Hiding the SSID keeps outsiders off the network.","Every joining client sends the name in its probe and association frames, so anyone listening learns it. Only encryption and authentication (lesson 6) keep people out."],
  ["The profile name and the SSID must be the same.","Separate fields: the profile name is internal and unique; the SSID is what users see."],
  ["You can renumber a WLAN later to tidy the list.","The ID is fixed — delete and re-create to change it. Plan IDs, and keep to 1–16 unless AP groups are used."],
])}
${K.dyk(`Every SSID an AP offers sends its own beacons — about ten a second per radio, at the lowest mandatory data rate. Ten SSIDs can burn a noticeable share of airtime before anyone sends data, which is why designers keep to a handful and use RADIUS-assigned VLANs rather than an SSID per department.`)}
${K.check({q:"An engineer creates WLAN 3 (profile Cafe, SSID Cafe-WiFi), sets Layer 2 Security to None and maps it to the 'cafe' interface. Customers can't see Cafe-WiFi. Most likely cause?", o:["Open WLANs are never broadcast","The Status box on the General tab was never ticked — new WLANs start disabled","The SSID differs from the profile name","WLAN ID 3 is above the default AP group's range"], a:1, why:"New WLANs start Disabled; editing other tabs doesn't enable them. Open WLANs broadcast normally, names may differ, and ID 3 is within 1–16."})}
${K.exam(`Reading a WLC GUI exhibit: first find <b>which page and tab</b> it shows (the breadcrumb, e.g. &ldquo;WLANs &gt; Edit 'GUEST'&rdquo;, and the highlighted tab). Then read the fields the question turns on — <b>Status</b>, <b>Interface</b>, <b>Security Policies</b>, <b>QoS</b> — against the defaults (Disabled, management, 802.1X, Silver). An answer that needs a setting from <i>another</i> tab can't be proven from that exhibit; &ldquo;which tab would you use…&rdquo; questions test the map above.`)}
<h3>Hands-on: the conference WLAN for the delegates</h3>
<p>Back at the hotel, Hotel-Guest runs as in the worked example. The conference wants its own SSID, <code>Delegates</code>, on a new VLAN 40, with a passphrase on the badges. The router and trunk are ready; the controller is yours — and the defaults have a surprise.</p>
${K.bench({id:"m9-guest-wlan", points:100, openLog:true, from:"CCNA · Module 9 · lesson 5", title:"Abuja hotel: a conference WLAN on its own VLAN, and safe admin access", viewBox:"0 0 900 470",
  intro:"<b>Design:</b> VLANs 10 = APs, 20 = staff, 30 = hotel guests, 40 = conference (10.30.40.0/24), 99 = wireless management. ABJ-HTL-R1 is each VLAN's gateway (.1) and DHCP server; pools exclude .1–.9. ABJ-WLC1 (10.30.99.5) is on trunk Gi0/2; AP-LOBBY has joined it. Use its <b>Controller GUI</b> button (really: browse to https://10.30.99.5). Badge passphrase: <code>Abuja-Conf-Example-26</code> (a lab example). <b>Lab notes:</b> every laptop is in range; no RADIUS server; no Save Configuration button — on a real controller it is the last click.",
  devices:[
    {id:"r1", kind:"router", label:"ABJ-HTL-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname ABJ-HTL-R1","no ip domain-lookup","int g0/0","description TRUNK to ABJ-HTL-SW1","no shut","int g0/0.10","description APs","encapsulation dot1Q 10","ip address 10.30.10.1 255.255.255.0","int g0/0.20","description STAFF","encapsulation dot1Q 20","ip address 10.30.20.1 255.255.255.0","int g0/0.30","description HOTEL GUESTS","encapsulation dot1Q 30","ip address 10.30.30.1 255.255.255.0","int g0/0.40","description CONFERENCE","encapsulation dot1Q 40","ip address 10.30.40.1 255.255.255.0","int g0/0.99","description WIRELESS MGMT","encapsulation dot1Q 99","ip address 10.30.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.30.10.1 10.30.10.9","ip dhcp excluded-address 10.30.20.1 10.30.20.9","ip dhcp excluded-address 10.30.30.1 10.30.30.9","ip dhcp excluded-address 10.30.40.1 10.30.40.9","ip dhcp pool APS","network 10.30.10.0 255.255.255.0","default-router 10.30.10.1","option 43 hex f104.0a1e.6305","exit","ip dhcp pool STAFF","network 10.30.20.0 255.255.255.0","default-router 10.30.20.1","exit","ip dhcp pool GUESTS","network 10.30.30.0 255.255.255.0","default-router 10.30.30.1","lease 0 4","exit","ip dhcp pool CONFERENCE","network 10.30.40.0 255.255.255.0","default-router 10.30.40.1","lease 0 12","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"ABJ-HTL-SW1", x:20, y:170, config:e=>{ ["en","conf t","hostname ABJ-HTL-SW1","vlan 10","name APS","vlan 20","name STAFF","vlan 30","name GUESTS","vlan 40","name CONFERENCE","vlan 99","name WLAN-MGMT","exit","int g0/1","description TRUNK to ABJ-HTL-R1","switchport mode trunk","int g0/2","description ABJ-WLC1 port 1","switchport mode trunk","switchport trunk allowed vlan 20,30,40,99","int g0/3","description AP-LOBBY","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"ABJ-WLC1", x:520, y:20, wlc:{ mgmt:{ip:"10.30.99.5", mask:"255.255.255.0", gw:"10.30.99.1", vlan:99, port:1},
      ifaces:{ staff:{vlan:20, ip:"10.30.20.5", mask:"255.255.255.0", gw:"10.30.20.1", port:1, dhcp:"10.30.20.1"}, guest:{vlan:30, ip:"10.30.30.5", mask:"255.255.255.0", gw:"10.30.30.1", port:1, dhcp:"10.30.30.1"} },
      wlans:{ 1:{id:1, profile:"STAFF", ssid:"Hotel-Staff", enabled:true, iface:"staff", security:"wpa2-psk", cipher:"aes", psk:"Abj-Staff-Example-26", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false},
              2:{id:2, profile:"GUEST", ssid:"Hotel-Guest", enabled:true, iface:"guest", security:"none", cipher:"aes", psk:null, pskFormat:"ascii", qos:"bronze", broadcast:true, flexLocal:false} },
      access:{http:true, https:true, telnet:true, ssh:true} }},
    {id:"ap", kind:"ap", label:"AP-LOBBY", x:520, y:190},
    {id:"st", kind:"laptop", label:"FRONT-DESK", x:500, y:350, dhcp:true, wifi:{ssid:"Hotel-Staff", key:"Abj-Staff-Example-26"}},
    {id:"dl", kind:"laptop", label:"DELEGATE-LAP", x:700, y:350, dhcp:true, wifi:{ssid:null, key:null}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"In ABJ-WLC1's GUI, CONTROLLER → Interfaces → <b>New...</b>: Interface Name <code>conference</code>, VLAN Id <code>40</code> → Apply. On the Edit page: the controller's address 10.30.40.5, Netmask 255.255.255.0, Gateway 10.30.40.1, Primary DHCP Server 10.30.40.1 → Apply", done:B=>Object.values(B.devs.wlc.wlc.ifaces).some(i=>i.vlan===40 && i.ip==="10.30.40.5" && i.mask==="255.255.255.0" && i.gw==="10.30.40.1" && i.dhcp==="10.30.40.1")},
    {text:"WLANs → Create New → <b>Go</b>: Type WLAN, Profile Name <code>CONF</code>, SSID <code>Delegates</code>, ID 3 → Apply. Read the General tab (Status, Security Policies, Interface), then the WLANs list: what is its Admin Status?", done:B=>Object.values(B.devs.wlc.wlc.wlans).some(w=>w.ssid==="Delegates")},
    {text:"See what the defaults do: on General tick <b>Status Enabled</b> → Apply, changing nothing else. On DELEGATE-LAP open <b>Wi-Fi</b>, pick Delegates and Connect with the badge passphrase: what does Windows say? Then in its Command Prompt, <code>netsh wlan show networks</code> (lists the SSIDs the laptop can hear): what Authentication does Delegates advertise?", done:B=>Bench.tried(B,"dl",/netsh\s+wlan\s+show\s+networks/i) && Object.values(B.devs.wlc.wlc.wlans).some(w=>w.ssid==="Delegates" && (w.security!=="wpa2-ent" || w.enabled))},
    {text:"Build it properly, Status last: General → untick Status → Apply. Security → Layer 2: keep WPA+WPA2, <b>untick 802.1X, tick PSK</b>, PSK Format ascii, type the badge passphrase → Apply (a shared passphrase instead of per-user logins — lesson 6 explains it). QoS → <code>Bronze (background)</code> → Apply. General → Interface <code>conference</code>, tick Status Enabled → Apply", done:B=>Object.values(B.devs.wlc.wlc.wlans).some(w=>w.ssid==="Delegates" && w.security==="wpa2-psk" && w.psk==="Abuja-Conf-Example-26" && w.qos==="bronze" && w.enabled && (B.devs.wlc.wlc.ifaces[w.iface]||{}).vlan===40)},
    {text:"DELEGATE-LAP: connect to Delegates with the passphrase (watch the radio link appear). Prove where it landed: <code>ipconfig</code> (which subnet and gateway?), <code>ipconfig /all</code> (why is the DHCP Server 192.0.2.1?), <code>netsh wlan show interfaces</code> (State, Authentication, Cipher) and <code>ping 10.30.40.1</code>. Then <code>ping 10.30.20.1</code>, the staff gateway — can a delegate reach it?", done:B=>Bench.wifiVlan(B,"dl")===40 && Bench.pinged(B,"dl","10.30.40.1") && Bench.tried(B,"dl",/netsh\s+wlan\s+show\s+interfaces?/i) && Bench.tried(B,"dl",/ping\s+10\.30\.20\.1\b/)},
    {text:"Before you hand over: the installer left clear-text logins on. MANAGEMENT → HTTP-HTTPS: HTTP Access <b>Disabled</b>, HTTPS Access Enabled; Telnet-SSH: Allow New Telnet Sessions <b>No</b>, Allow New SSH Sessions Yes → Apply (the lab shows both on one page; a real controller has two pages, each with its own Apply)", done:B=>{ const a=B.devs.wlc.wlc.access; return !a.http && !a.telnet && a.https && a.ssh; }},
  ],
  win:"Delegates is live on VLAN 40: WPA2 with the badge passphrase, Bronze priority, its own interface and DHCP server — and the controller is reachable only by HTTPS and SSH. You saw the defaults bite: enabled as created, the WLAN advertised WPA2-Enterprise and Windows said &ldquo;Can't connect to this network&rdquo;, because 802.1X needs a RADIUS server. And a delegate could ping the staff gateway: a separate VLAN is not isolation on its own — a real build adds an ACL or firewall so it reaches only the internet (Module 8), then Save Configuration.",
  solve:[["wlc","wlc","iface","conference",40,{ip:"10.30.40.5", mask:"255.255.255.0", gw:"10.30.40.1", dhcp:"10.30.40.1"}],
    ["wlc","wlc","wlan",3,"CONF","Delegates"],
    ["wlc","wlc","wlanset",3,{enabled:true}],["pc","dl","netsh wlan show networks"],
    ["wlc","wlc","wlanset",3,{enabled:false}],["wlc","wlc","wlanset",3,{security:"wpa2-psk", pskFormat:"ascii", psk:"Abuja-Conf-Example-26"}],["wlc","wlc","wlanset",3,{qos:"bronze"}],["wlc","wlc","wlanset",3,{iface:"conference", enabled:true}],
    ["wifi","dl","Delegates","Abuja-Conf-Example-26"],["pc","dl","ipconfig"],["pc","dl","netsh wlan show interfaces"],["pc","dl","ping 10.30.40.1"],["pc","dl","ping 10.30.20.1"],
    ["wlc","wlc","access",{http:false, https:true, telnet:false, ssh:true}]]})}
${K.hint(`Task 3: read Security Policies before you enable — <code>[WPA2][Auth(802.1X)]</code> is the default, and 802.1X needs a RADIUS server to check each user. Task 4: the Interface drop-down is on General; key management is under Security → Layer 2 → Authentication Key Management. Task 5: compare the gateway in <code>ipconfig</code> with VLAN 40's design.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"An Enugu school created WLAN 20 (profile EXAMS, SSID Exam-Hall) on a controller using the default AP group, mapped it to interface 'exams', set WPA2-PSK and Bronze QoS. Its General tab shows Status: Enabled unticked. Students can't see Exam-Hall. Which two changes are needed? (Choose two.)", o:["Tick Status Enabled and Apply","Re-create the WLAN with an ID from 1 to 16 (or put the APs in an AP group that includes WLAN 20)","Change the QoS to Silver — Bronze WLANs aren't broadcast","Make the profile name match the SSID","Turn Broadcast SSID off so the WLAN is advertised to students only"], a:[0,1], why:"1. What is asked? Everything stopping the SSID being advertised. 2. Which rules? A WLAN must be enabled; the default AP group advertises only IDs 1–16; IDs can't be edited. 3. Apply it: tick Status, and re-create it with a low ID (or use an AP group). QoS and names don't affect broadcasting; hiding the SSID makes it less visible, not more."})}

<h2>QoS profiles and the Advanced tab</h2>
${K.remember(`<b>The rule:</b> a WLAN's QoS profile sets the <b>highest priority</b> its traffic may get, over the air and on the wire: <b>Platinum = voice</b>, <b>Gold = video</b>, <b>Silver = best effort</b> (default), <b>Bronze = background</b>. Priority is relative, so real-time traffic gets the high levels and guests get Bronze. Memory hook: medals, best first — Platinum, Gold, Silver, Bronze = Voice, Video, Best effort, Background.`)}
<p>Wi-Fi is one shared, half-duplex channel (lesson 1): when delegates start a dozen video streams, the front desk's card terminals wait for the same airtime. ${K.g("QoS","Quality of service: rules deciding which traffic goes first when capacity runs short.")} starts with one drop-down per WLAN, on its QoS tab: <code>Platinum (voice)</code>, <code>Gold (video)</code>, <code>Silver (best effort)</code> — the default, &ldquo;normal bandwidth for clients&rdquo; — and <code>Bronze (background)</code>, which Cisco describes as the lowest bandwidth, for guest services.</p>
<p>At CCNA depth, the profile caps the priority the WLAN's frames can carry. Over the air, ${K.g("WMM","Wi-Fi Multimedia (from IEEE 802.11e): four priority categories — voice, video, best effort, background.")} gives higher categories shorter waits; on the wire, packets and their CAPWAP tunnel are marked so switches and routers queue them in the same order. Leave the tab's <b>WMM Policy</b> on Allowed: ${K.g("802.11n","The 2009 Wi-Fi standard, Wi-Fi 4 (lesson 1).")} and later speeds need WMM.</p>
${K.when([
  ["Platinum (voice)","Wi-Fi phones or voice apps","Voice breaks at small delays","Data or guest WLANs — they'd crowd out calls"],
  ["Gold (video)","Business video: conference rooms, CCTV viewing","Video needs steady throughput, low jitter","Entertainment video for guests"],
  ["Silver (best effort)","Ordinary staff laptops — the default","Fair, normal treatment","Real-time traffic"],
  ["Bronze (background)","Guests, IoT updates, backups","Gets what's left, so it can't hurt business traffic","Anything users would notice slowing"],
], "Which QoS profile for a WLAN?")}
${K.check({q:"A Lagos hospital has Nurse-Phones (Wi-Fi handsets), Staff (laptops) and Visitors WLANs. Which QoS assignment is right?", o:["All three Platinum, so everyone is fast","Nurse-Phones Platinum, Staff Silver, Visitors Bronze","Nurse-Phones Silver, Staff Gold, Visitors Platinum","Nurse-Phones Bronze, because phones use little bandwidth"], a:1, why:"Priority is relative: voice Platinum, data on the default Silver, visitors Bronze. All-Platinum prioritises nobody; voice needs low delay, not bandwidth."})}
<h3>The Advanced tab at CCNA depth</h3>
<p>The exam asks you to <i>interpret</i> this long tab, not memorise it. Worth recognising:</p>
<div class="tablewrap"><table>
<tr><th>Setting</th><th>Default</th><th>What it does — and when you'd change it</th></tr>
<tr><td><b>Allow AAA Override</b></td><td>off</td><td>RADIUS may send per-user settings (VLAN, QoS, ACL) that override the WLAN's — one Staff SSID, finance users land in the finance VLAN</td></tr>
<tr><td><b>Enable Session Timeout</b></td><td>on, 1800 s</td><td>How long before a client must re-authenticate</td></tr>
<tr><td><b>Client Exclusion</b></td><td>on, 60 s</td><td>Clients that keep failing authentication are blocked for a while — slows password guessing</td></tr>
<tr><td><b>Maximum Allowed Clients</b></td><td>0 = unlimited</td><td>A cap per WLAN (and one per AP radio)</td></tr>
<tr><td><b>DHCP Addr. Assignment Required</b></td><td>off</td><td>Clients must use DHCP; typed static addresses are refused. Good for guests; avoid where devices need static IPs</td></tr>
<tr><td><b>P2P Blocking Action</b></td><td>Disabled</td><td>Drop traffic between clients on the WLAN — guests can't reach each other's laptops</td></tr>
<tr><td><b>FlexConnect Local Switching</b></td><td>off</td><td>FlexConnect APs (lesson 3) switch the WLAN's traffic at their own switch port</td></tr>
</table></div>
${K.tip(`Write the guest pattern into the team's build sheet once: Bronze, DHCP Addr. Assignment Required, P2P blocking, a client cap, a sign-in page or encryption, and an ACL so the guest VLAN reaches only the internet.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Port Harcourt oil-services company is planning its WLANs. Match each requirement with the setting that meets it.", pairs:[["Wi-Fi handsets in the yard must not stutter when laptops sync","QoS Platinum on the voice WLAN"],["Visitors must not be able to reach each other's laptops","P2P Blocking Action: Drop"],["A contractor typed a static IP to dodge the guest pool's restrictions","DHCP Addr. Assignment Required"],["One Staff SSID, but finance users must land in the finance VLAN","Allow AAA Override (with 802.1X and RADIUS)"],["The guest WLAN must never take airtime ahead of staff data","QoS Bronze on the guest WLAN"]], why:"1. What is asked? The setting behind each requirement. 2. Which rules? QoS sets relative priority; Advanced controls client-to-client traffic, DHCP enforcement and RADIUS overrides. 3. Apply them one at a time — none needs a new SSID."})}

<h2>Connected, but no address: walking the chain</h2>
${K.remember(`<b>The rule:</b> <b>Connected</b> plus a <b>169.254.x.x</b> address means the radio side worked — AP joined, WLAN enabled, key matched. The fault is further along the chain: the WLAN's <b>interface</b> (wrong one, or no <b>Primary DHCP Server</b>), its <b>VLAN on the trunk</b>, or the <b>gateway and pool</b>. Walk it in order: client → WLAN → interface → trunk → DHCP server.`)}
<p><i>Can't connect</i> is the radio side: AP joined (lesson 4), WLAN enabled, security matching (lesson 6). <i>Connects, no address</i> is the wired side of the controller. Use three views:</p>
<ul>
<li><b>Client:</b> <code>netsh wlan show interfaces</code> says connected; <code>ipconfig</code> shows an APIPA address and no gateway.</li>
<li><b>Controller:</b> the WLAN's Interface; that interface's VLAN and Primary DHCP Server; MONITOR → Clients for the client's VLAN.</li>
<li><b>Switch and router:</b> <code>show interfaces trunk</code> on the controller's port; a gateway and pool for the subnet (<code>show ip dhcp pool</code>, <code>show ip dhcp binding</code>).</li>
</ul>
${K.out(`C:\\Users\\student>netsh wlan show interfaces

There is 1 interface on the system:

    Name                   : Wi-Fi
    ...
    State                  : connected
    SSID                   : Campus-Students
    AP BSSID               : 00:50:5b:25:4b:d1
    Band                   : 5 GHz
    Channel                : 36
    ...
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    ...
    Signal                 : 91%

C:\\Users\\student>ipconfig

Windows IP Configuration

Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::250:c9ff:fe4b:dc95%4
   Autoconfiguration IPv4 Address. . : 169.254.119.128
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :`, "A wired-side fault's fingerprint: connected, WPA2-Personal, strong signal — and APIPA with no gateway. (Windows 11 layout as the lab prints it; netsh trimmed.)")}
${K.out(`KN-SW1#show interfaces trunk

Port        Mode             Encapsulation  Status        Native vlan
Gi0/1       on               802.1q         trunking      1
Gi0/2       on               802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       1-4094
Gi0/2       20,99
`, "Gi0/2 is the controller's port: VLAN 40 isn't allowed on its trunk, so students' frames die here. (Trimmed.)")}
<p>The fix is Module 4's <code>switchport trunk allowed vlan add 40</code> on the controller's port. A blank Primary DHCP Server is one field on the interface's Edit page.</p>
${K.mistake(`Typing <code>switchport trunk allowed vlan 40</code> without <b>add</b>. It <i>replaces</i> the list: the management VLAN disappears, every AP loses its controller, every WLAN drops — and maybe your own GUI session. On a live trunk, always <code>add</code>, and read <code>show interfaces trunk</code> before and after.`)}
<h3>Hands-on: &ldquo;Connected, no internet&rdquo; on the new student WLAN</h3>
<p>A Kano university library: over the holidays a contractor added a students' WLAN on VLAN 40. On the first day of term every student sees &ldquo;Connected, no internet&rdquo; and can't open the ${K.g("LMS","Learning management system: the university's course website.")}; lecturers are fine. Two things are wrong.</p>
${K.bench({id:"m9-no-address", points:110, openLog:true, from:"CCNA · Module 9 · lesson 5", title:"Kano library: students connect but get no address", viewBox:"0 0 900 440",
  intro:"<b>Design:</b> VLANs 10 = APs, 20 = staff and servers (10.40.20.0/24, the LMS server 10.40.20.10), 40 = students (10.40.40.0/24), 99 = wireless management. KN-CAMPUS-R1 is the gateway (.1) and DHCP server for each. KN-WLC1 (management 10.40.99.5) is on KN-SW1 Gi0/2; AP-LIBRARY has joined it. Campus-Staff → interface staff; Campus-Students → interface students, key <code>Kano-Students-Example</code> (a lab example). Console: <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. <b>Lab note:</b> every laptop is in range; Windows retries DHCP by itself when the network changes, and IP settings → <b>Obtain an IP address automatically</b> → OK makes it ask at once, with the frame log showing where the request went.",
  devices:[
    {id:"r1", kind:"router", label:"KN-CAMPUS-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname KN-CAMPUS-R1","no ip domain-lookup","int g0/0","description TRUNK to KN-SW1","no shut","int g0/0.10","description APs","encapsulation dot1Q 10","ip address 10.40.10.1 255.255.255.0","int g0/0.20","description STAFF and SERVERS","encapsulation dot1Q 20","ip address 10.40.20.1 255.255.255.0","int g0/0.40","description STUDENTS","encapsulation dot1Q 40","ip address 10.40.40.1 255.255.255.0","int g0/0.99","description WIRELESS MGMT","encapsulation dot1Q 99","ip address 10.40.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.40.10.1 10.40.10.9","ip dhcp excluded-address 10.40.20.1 10.40.20.49","ip dhcp excluded-address 10.40.40.1 10.40.40.9","ip dhcp pool APS","network 10.40.10.0 255.255.255.0","default-router 10.40.10.1","option 43 hex f104.0a28.6305","exit","ip dhcp pool STAFF","network 10.40.20.0 255.255.255.0","default-router 10.40.20.1","exit","ip dhcp pool STUDENTS","network 10.40.40.0 255.255.255.0","default-router 10.40.40.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KN-SW1", x:20, y:170, config:e=>{ ["en","conf t","hostname KN-SW1","vlan 10","name APS","vlan 20","name STAFF","vlan 40","name STUDENTS","vlan 99","name WLAN-MGMT","exit","int g0/1","description TRUNK to KN-CAMPUS-R1","switchport mode trunk","int g0/2","description KN-WLC1 port 1","switchport mode trunk","switchport trunk allowed vlan 20,99","int g0/3","description AP-LIBRARY","switchport mode access","switchport access vlan 10","int g0/4","description LMS server","switchport mode access","switchport access vlan 20","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"KN-WLC1", x:520, y:20, wlc:{ mgmt:{ip:"10.40.99.5", mask:"255.255.255.0", gw:"10.40.99.1", vlan:99, port:1},
      ifaces:{ staff:{vlan:20, ip:"10.40.20.5", mask:"255.255.255.0", gw:"10.40.20.1", port:1, dhcp:"10.40.20.1"}, students:{vlan:40, ip:"10.40.40.5", mask:"255.255.255.0", gw:"10.40.40.1", port:1, dhcp:null} },
      wlans:{ 1:{id:1, profile:"STAFF", ssid:"Campus-Staff", enabled:true, iface:"staff", security:"wpa2-psk", cipher:"aes", psk:"Kano-Staff-Example-1", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false},
              2:{id:2, profile:"STUDENTS", ssid:"Campus-Students", enabled:true, iface:"students", security:"wpa2-psk", cipher:"aes", psk:"Kano-Students-Example", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }},
    {id:"ap", kind:"ap", label:"AP-LIBRARY", x:520, y:190},
    {id:"lms", kind:"server", label:"LMS", x:240, y:330, ip:"10.40.20.10", mask:"255.255.255.0", gw:"10.40.20.1"},
    {id:"adm", kind:"laptop", label:"YOUR LAPTOP", x:20, y:330},
    {id:"sf", kind:"laptop", label:"LECTURER-LAP", x:520, y:330, dhcp:true, wifi:{ssid:"Campus-Staff", key:"Kano-Staff-Example-1"}},
    {id:"stu", kind:"laptop", label:"STUDENT-LAP", x:700, y:330, dhcp:true, wifi:{ssid:null, key:null}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"}, {type:"cat6", a:"lms:eth", b:"sw:g4"}, {type:"console", a:"adm:usb", b:"sw:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket as a student: STUDENT-LAP → <b>Wi-Fi</b> → Campus-Students, key <code>Kano-Students-Example</code> → Connect. Then in its Command Prompt: <code>netsh wlan show interfaces</code> (State?) and <code>ipconfig</code> (which address?). Is this a radio problem or an addressing problem?", done:B=>Bench.wifiAssoc(B,"stu") && Bench.tried(B,"stu",/netsh\s+wlan\s+show\s+interfaces?/i) && Bench.tried(B,"stu",/^\s*ipconfig\b/i)},
    {text:"Compare with what works: LECTURER-LAP's <code>ipconfig</code>. Then in KN-WLC1's GUI compare the two WLANs (WLANs list, General → Interface) and the two interfaces (CONTROLLER → Interfaces → staff, then students). One field is empty on students — fill it with the students' DHCP server, the router's 10.40.40.1 → Apply", done:B=>Bench.tried(B,"sf",/^\s*ipconfig\b/i) && B.devs.wlc.wlc.ifaces.students.dhcp==="10.40.40.1"},
    {text:"Ask again with the frame log open: STUDENT-LAP → IP settings → Obtain an IP address automatically → OK. Still 169.254 — where does the Discover die now? Console to KN-SW1 from YOUR LAPTOP, <code>enable</code>, and <code>show interfaces trunk</code>: which VLANs may cross Gi0/2, the controller's port?", done:B=>B.devs.sw.env.history.some(h=>/^\s*sh\S*\s+int\S*\s+trunk/i.test(h))},
    {text:"Add the students' VLAN to the controller's trunk without removing the others: <code>configure terminal</code>, <code>interface g0/2</code>, <code>switchport trunk allowed vlan add 40</code>, <code>end</code> — then <code>show interfaces trunk</code> again", done:B=>{ const a=B.devs.sw.env.intfs["GigabitEthernet0/2"].allowed; return !!a && [20,40,99].every(v=>a.includes(v)); }},
    {text:"STUDENT-LAP retries by itself: <code>ipconfig</code> now shows a 10.40.40.x address. Prove it end to end — <code>ping 10.40.40.1</code> and the LMS server <code>ping 10.40.20.10</code> — and save the switch: <code>copy running-config startup-config</code>", done:B=>Bench.wifiVlan(B,"stu")===40 && !!Bench.leased(B,"stu") && Bench.pinged(B,"stu","10.40.40.1") && Bench.pinged(B,"stu","10.40.20.10") && !!B.devs.sw.env.savedOnce},
  ],
  win:"Two faults, one symptom. The students' interface had no Primary DHCP Server, so the controller had nowhere to relay their Discovers; and VLAN 40 wasn't allowed on the controller's trunk, so the requests died at KN-SW1. The radio side was fine all along — connected, WPA2-Personal — which is what sent you to the wired half of the chain. allowed vlan add kept 20 and 99, so lecturers and the AP never noticed the fix.",
  solve:[["wifi","stu","Campus-Students","Kano-Students-Example"],["pc","stu","netsh wlan show interfaces"],["pc","stu","ipconfig"],
    ["pc","sf","ipconfig"],["wlc","wlc","ifaceset","students",{dhcp:"10.40.40.1"}],
    ["dhcp","stu"],["console","adm",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],
    ["term","configure terminal"],["term","interface g0/2"],["term","switchport trunk allowed vlan add 40"],["term","end"],["term","show interfaces trunk"],
    ["pc","stu","ipconfig"],["pc","stu","ping 10.40.40.1"],["pc","stu","ping 10.40.20.10"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: put the staff and students interfaces side by side — VLAN, address, gateway, and the DHCP line. Task 3: the frame log names the switch and the trunk that dropped the request. Task 4: <code>add</code> keeps 20 and 99; without it, the lecturers and the AP would go down too.`)}
${K.job("“Visitors are getting the same addresses as our switches”",`
<p><b>The alert.</b> Tuesday 09:40, a logistics firm's Lagos head office. Monitoring emails: &ldquo;New hosts in 10.10.99.0/24 (network management): 37 devices&rdquo; — a subnet that should hold only the controller and switch management addresses. The service desk adds: &ldquo;Visitors say the Wi-Fi works fine.&rdquo;</p>
<p><b>Questions first.</b> What changed? <i>&ldquo;Monday: new Visitors WLAN (ID 4) for the client workshop.&rdquo;</i> Who? Only Visitors devices; staff still get 10.10.20.x.</p>
<p><b>Checks.</b> A visitor's <code>ipconfig</code>: IPv4 10.10.99.141, gateway 10.10.99.1 — the management subnet. On the controller, WLANs → VISITORS → General: <b>Interface: management</b> — the default, never changed. The management interface has Primary DHCP Server 10.10.99.1, set long ago for temporary lab gear, so every visitor got a management address. A <code>visitors</code> interface (VLAN 60, 10.10.60.5, DHCP server 10.10.60.1) was created on Monday — and never selected.</p>
<p>Before fixing, the rest of the chain checks out: the trunk allows VLAN 60, the core switch has SVI 10.10.60.1 and a pool, and the VLAN 60 ACL allows only the internet.</p>
<p><b>Fix</b> (urgent change, approved, during the coffee break): untick Status, Apply; Interface <code>visitors</code>; tick Status, Apply; Save Configuration. A live change drops clients anyway, so do it disabled, after telling the room.</p>
<p><b>Verify.</b> MONITOR → Clients: Visitors in VLAN 60; a visitor gets 10.10.60.x and the web, not the controller's login page.</p>
<p><b>What you say.</b> To the host: &ldquo;We moved the visitor Wi-Fi to its proper network during the break; if a laptop says no internet, turn Wi-Fi off and on.&rdquo; To your manager: visitors sat on the management network for about 20 hours; admin logins there are HTTPS/SSH with TACACS+ and nothing suggests anyone tried, but security has the client list. Process fix: the build sheet now checks &ldquo;Interface: not management&rdquo;, and the management interface's DHCP server is removed.</p>
<p><b>Ticket note.</b> <i>&ldquo;WLAN 4 VISITORS created Mon 14:10 left on default interface 'management'; management interface had Primary DHCP Server 10.10.99.1 → 37 visitor clients leased 10.10.99.x. 09:58 Tue: WLAN 4 disabled, mapped to interface 'visitors' (VLAN 60), re-enabled, config saved. Verified clients in VLAN 60, internet OK, no access to 10.10.99.0/24. Removed DHCP server from management interface. Build sheet updated. 35 min.&rdquo;</i></p>`)}
${K.check({q:"A client shows State: connected, but ipconfig shows 169.254.30.7 and no gateway. Which can you rule out first?", o:["A missing Primary DHCP Server on the WLAN's interface","The WLAN's VLAN missing from the controller's trunk","A wrong pre-shared key","No DHCP pool for the interface's subnet"], a:2, why:"Connected means the key exchange succeeded, so the PSK is right. APIPA means no DHCP Offer: the wired side — the interface's DHCP server, the trunk, or the pool."})}
<h3>Same logic, new situation</h3>
<p>A Kaduna clinic: the new Tablets WLAN (interface <code>tablets</code>, VLAN 55, 10.70.55.5, Primary DHCP Server 10.70.55.1) gives every tablet 169.254.x.x. The controller's trunk allows <code>1-4094</code>. The router has <code>interface g0/0.55</code> with <code>encapsulation dot1Q 55</code> and <code>ip address 10.70.55.1 255.255.255.0</code>; <code>show ip dhcp pool</code> lists only STAFF (10.70.20.0/24) and VOICE (10.70.30.0/24). What's wrong, and why does the router stay silent?</p>
${K.hint(`Walk the chain: interface fields, trunk, gateway — then think about how a DHCP server chooses a pool for a relayed request.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The broken link, and why no Offer. <b>2. Which rule?</b> The chain, plus Module 7's pool choice: the server uses the pool containing the relay address (giaddr). <b>3. Apply it:</b> interface complete, trunk carries every VLAN, subinterface exists — but there is <b>no pool for 10.70.55.0/24</b>. The controller relays from 10.70.55.5; no pool contains it, so no Offer. Fix: <code>ip dhcp excluded-address 10.70.55.1 10.70.55.9</code>, then <code>ip dhcp pool TABLETS</code>, <code>network 10.70.55.0 255.255.255.0</code>, <code>default-router 10.70.55.1</code>.</p>`)}

<h2>Management access: who can log in to the controller, and how</h2>
${K.remember(`<b>The rule:</b> manage the controller only over <b>encrypted</b> protocols — <b>HTTPS</b> (GUI) and <b>SSH</b> (CLI), on by default — and keep <b>HTTP</b> and <b>Telnet</b> off: they send the admin password in clear text. <b>Console</b> and <b>service port</b> are for when the network is down. Check admins against <b>TACACS+</b> or <b>RADIUS</b>, with a local account only for when the server can't be reached.`)}
<p>The controller holds every WLAN's keys and every AP's configuration, so it deserves Module 8's protection. CCNA topic 2.8 lists the ways in:</p>
${K.svg("0 0 760 280",
  K.dev("laptop",80,110,"ADMIN-PC","10.30.99.50")+
  K.arrow(112,88,322,88,"HTTPS 443 · SSH 22 — on",true)+
  K.arrow(112,134,322,134,"HTTP 80 · Telnet 23 — off")+
  K.box(325,78,150,66,"ABJ-WLC1","management 10.30.99.5",true)+
  K.dev("server",650,60,"AAA SERVER","TACACS+ / RADIUS")+
  K.arrow(477,96,628,64,"",true)+K.txt(528,112,"is this admin allowed?",{mid:true,c:"accent",s:10.5,f:"body"})+
  K.dev("laptop",650,200,"CONSOLE LAPTOP","9600 8N1")+
  K.link(477,132,624,196,"",true)+K.txt(508,184,"console cable",{mid:true,s:10})+
  K.txt(400,170,"service port → out-of-band network",{mid:true,s:10.5,f:"body"})+
  K.txt(380,262,"Encrypted (HTTPS, SSH) on · clear text (HTTP, Telnet) off · admins checked centrally, local account as fallback",{mid:true,c:"fg",s:11,f:"body"}),
  "The ways into a controller. AireOS defaults are already the secure ones; audits look for someone having switched HTTP or Telnet back on.")}
<h3>MANAGEMENT → HTTP-HTTPS and Telnet-SSH</h3>
<div class="tablewrap"><table>
<tr><th>Page · setting</th><th>Default</th><th>Why</th></tr>
<tr><td>HTTP-HTTPS · <b>HTTP Access</b></td><td>Disabled</td><td>HTTP (TCP 80) is clear text</td></tr>
<tr><td>HTTP-HTTPS · <b>HTTPS Access</b></td><td>Enabled</td><td>The GUI over TLS (TCP 443)</td></tr>
<tr><td>HTTP-HTTPS · Web Session Timeout</td><td>30 min</td><td>Abandoned sessions log out</td></tr>
<tr><td>Telnet-SSH · <b>Allow New Telnet Sessions</b></td><td>No</td><td>Telnet (TCP 23) is clear text</td></tr>
<tr><td>Telnet-SSH · <b>Allow New SSH Sessions</b></td><td>Yes</td><td>The CLI over SSH (TCP 22)</td></tr>
</table></div>
<p>The self-signed HTTPS certificate makes browsers warn; fix it with a certificate from the company's CA, never with HTTP. The <b>console</b> (9600 8N1) is the usual way in at first setup; the <b>service port</b> reaches a separate out-of-band network when the trunk or a switch has failed.</p>
<h3>TACACS+ or RADIUS for admin logins</h3>
<p>Shared accounts can't say <i>who</i> changed what, and leavers keep the password (Module 8):</p>
${K.steps([
  ["Add the server", "TACACS+: SECURITY → AAA → TACACS+ → <b>Authentication</b> → New: IP, shared secret, <b>TCP 49</b> (and under Authorization and Accounting). RADIUS: SECURITY → AAA → RADIUS → Authentication → New: IP, secret, UDP 1812, and tick <b>Management</b> (admin logins; <b>Network User</b> is the tick for 802.1X clients)."],
  ["Set the order", "SECURITY → <b>Priority Order → Management User</b>: the server above <b>Local</b> (default: Local, then RADIUS)."],
  ["Keep a way back", "One strong local account, kept safe — used <b>only when the server can't be reached</b>. A server &ldquo;reject&rdquo; is final."],
  ["Test before logging out", "Log in from a second session with a server account while the first stays open."],
])}
${K.when([
  ["HTTPS / SSH","Daily GUI work / scripts and show commands","Encrypted, on by default","—"],
  ["HTTP / Telnet","Never in production","—","Always: credentials in clear text"],
  ["Console","First setup, password recovery, total outage","Needs no network","Daily work — you must be in the room"],
  ["Service port","Out-of-band management network","Works when the data network is the problem","Clients or APs (no 802.1Q)"],
  ["TACACS+ for admins","Device admin logins (TCP 49)","Encrypts the whole payload; separate authorization (by GUI menu) and accounting","Client Wi-Fi logins — that's RADIUS"],
  ["RADIUS for admins","RADIUS is the team's AAA server (UDP 1812/1813)","One server for 802.1X users and admins","Authorization kept apart from login"],
], "Ways to manage a controller")}
<p><b>Cloud-managed</b> wireless (Meraki, lesson 3) moves all this to a web dashboard over HTTPS: admins log in to the cloud, not a box on site. The <b>Catalyst 9800</b>, below, uses a WebUI over HTTPS and an IOS XE CLI over SSH — same rules, different screens.</p>
${K.dodont([
  "Check HTTP and Telnet are off after every upgrade or rebuild.",
  "Send admin logins to TACACS+ or RADIUS; keep one local account for outages.",
  "Map every WLAN to a dynamic interface on purpose.",
  "Click Save Configuration after every change.",
],[
  "Don't switch HTTP on to silence the certificate warning.",
  "Don't share one admin account.",
  "Don't hide an SSID and call it security.",
  "Don't put guests on Platinum or Gold.",
  "Don't change a live controller trunk's allowed list without add.",
])}
${K.check({q:"An auditor finds HTTP Access Enabled and Allow New Telnet Sessions Yes on the controller. What should you change?", o:["Nothing: HTTPS and SSH are also on, so admins can choose","Disable HTTP and Telnet — both send admin credentials in clear text; keep HTTPS and SSH","Disable HTTPS and SSH, which use more CPU","Disable all four and use only the console"], a:1, why:"Secure defaults: HTTPS and SSH on, HTTP and Telnet off. One careless clear-text login exposes the admin password."})}
${K.case("The hospital audit — who can log in to the controller?",`
<p>A private hospital in Ikeja, Lagos, runs 60 APs on two AireOS controllers installed five years ago. The audit asks: who can log in to the controllers, from where, and how would you know who changed what?</p>
<p><b>What the team found.</b> HTTP Access <b>Enabled</b> (the installer's fix for &ldquo;the certificate warning confused people&rdquo;), Telnet <b>Yes</b>, one local <code>admin</code> account shared by six engineers and two former contractors, the service port unplugged, Management User priority: Local only.</p>
<p><b>Why it mattered.</b> Staff laptops could reach the management VLAN, so anyone could capture a clear-text login that unlocked every WLAN key in the building — and the logs said only &ldquo;admin&rdquo;.</p>
<p><b>What they changed</b>, in one evening window: HTTP and Telnet off, with a certificate from the hospital's own CA so the original excuse disappeared; the existing TACACS+ server added (TCP 49) and placed before Local, so each engineer logs in as themselves; the <code>admin</code> password changed, sealed in the safe as the outage fallback; the service ports cabled to the out-of-band switch; an ACL so only the IT subnet reaches management (Module 8); each change tested from a second session, then Save Configuration.</p>
<p><b>The outcome.</b> Months later a mistaken QoS change was traced in minutes through TACACS+ accounting. <b>The lessons:</b> secure defaults help only if nobody undoes them; shared accounts can't be audited; the fallback account is a safety net, not a daily login.</p>`)}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A bank in Abuja is reviewing how its engineers reach the wireless controller. Match each situation with the right way in.", pairs:[["Daily WLAN changes from the IT office","HTTPS to the management interface"],["A script that pulls show wlan summary every night","SSH to the management interface"],["The trunk to the controller has failed and the GUI is unreachable","The service port, on the out-of-band network"],["The controller is brand new and has no management address yet","The console port, 9600 8N1"],["An engineer has left: their access must stop today, on every device","Disable their account on the TACACS+ server"]], why:"1. What is asked? The right way in per situation. 2. Which rules? Encrypted in-band access for daily work; out-of-band when the data network is down; the console when nothing else exists yet; central AAA so one change revokes access everywhere. 3. Apply it — none of the answers is HTTP or Telnet."})}
<h3>The same jobs on a Catalyst 9800</h3>
<p>Cisco's current Catalyst 9800 controllers (including the 9800-CL virtual one, lesson 3) run IOS XE and split AireOS's WLAN page into reusable <b>profiles</b> joined by <b>tags</b>. The ideas carry over; only where you click moves:</p>
<div class="tablewrap"><table>
<tr><th>The AireOS job</th><th>On a 9800 (WebUI over HTTPS)</th></tr>
<tr><td>WLANs → Create New: profile, SSID, ID, Layer 2 security</td><td>A <b>WLAN profile</b>: Configuration → Tags &amp; Profiles → WLANs → + Add</td></tr>
<tr><td>Interface, QoS, AAA override, session timeout</td><td>A <b>policy profile</b>: VLAN, central or local switching, QoS, AAA override</td></tr>
<tr><td>Which APs offer the WLAN (AP group)</td><td>A <b>policy tag</b> pairs WLAN and policy profiles and is assigned to APs; the default tag offers IDs 1–16</td></tr>
<tr><td>Local or FlexConnect, AP join settings</td><td>A <b>site tag</b> with an AP join profile (and an ${K.g("RF","Radio frequency (lesson 1): here, radio settings such as channels and power.")} tag for radios)</td></tr>
</table></div>
<p>&ldquo;Which VLAN does this SSID use?&rdquo; on a 9800: WLAN profile → policy tag → policy profile → VLAN — the same chain.</p>

<h2>Interview corner</h2>
${K.hint(`Interface first, then the WLAN and its defaults, then the wired side, then proof from a client.`)}
${K.reveal("“Walk me through putting a new SSID on VLAN 30 on a Cisco controller.”",`<p>"Wired side first: VLAN 30 on the controller's trunk, a gateway and a pool excluding the controller's address. Then a dynamic interface on VLAN 30 with its address, gateway and Primary DHCP Server. Then Create New, Go: profile, SSID, an ID from 1 to 16. It starts disabled, on management, with 802.1X and Silver, so I map the interface, set security and QoS, enable it last and save. Then a client proves it: connected, a VLAN 30 address, a ping to the gateway."</p>`)}
${K.hint(`What does &ldquo;connected&rdquo; already prove? Then the chain, in order, with the command or page that checks each link.`)}
${K.reveal("“A user is connected to the Wi-Fi but has a 169.254 address. Where do you look?”",`<p>"Connected means the AP, WLAN and key are fine, so it's the wired side. On the controller: the WLAN's interface, its VLAN and Primary DHCP Server, and the client's VLAN in the client list. On the switch: show interfaces trunk on the controller's port. On the gateway: an interface and a pool for the subnet, and show ip dhcp binding. If the trunk needs the VLAN, I use allowed vlan add."</p>`)}
${K.hint(`Protocols on and off, out-of-band paths, central accounts with a fallback, and how you'd prove it.`)}
${K.reveal("“How would you secure management access to a wireless controller?”",`<p>"HTTPS and SSH only — the defaults — with HTTP and Telnet checked off, because they're clear text. An ACL limits who reaches the management interface; service port and console give out-of-band access. Admins use their own TACACS+ or RADIUS accounts, server before Local, with one local emergency account for outages. I test a server login from a second session before logging out, then save."</p>`)}

${K.recap([
  "The chain: WLAN → interface → tagged VLAN → controller trunk → gateway and pool. A missing link = connected, but 169.254.x.x.",
  "Interfaces: management (APs join, admins log in), virtual (192.0.2.1, never routed; 1.1.1.1 retired), service-port (out-of-band, untagged), dynamic (client VLANs).",
  "DHCP proxy (default): the controller relays requests to the interface's Primary DHCP Server from the interface's address; blank = no addresses.",
  "Create New → Go: Type, Profile Name and SSID (max 32), ID (only 1–16 in the default AP group; fixed).",
  "A new WLAN: Disabled, management, WPA2-AES + 802.1X, Silver, Broadcast SSID on. Enable last, Apply, Save Configuration.",
  "QoS profiles cap priority: Platinum voice, Gold video, Silver best effort (default), Bronze background — guests on Bronze.",
  "Advanced: AAA override, session timeout, client exclusion, max clients, DHCP Addr. Assignment Required, P2P blocking, FlexConnect local switching.",
  "HTTPS and SSH on, HTTP and Telnet off; console and service port out of band; TACACS+ or RADIUS before the local fallback.",
])}
${K.next(`<b>Lesson 6 — Wireless security: WPA2, WPA3 and configuring a PSK.</b> Why ${K.g("WEP","Wired Equivalent Privacy: the original, long-broken Wi-Fi encryption (lesson 6).")} died, what WPA2's AES-CCMP and 4-way handshake protect, Personal versus Enterprise, what WPA3 adds — and the PSK you set on the Delegates WLAN today, explained and configured properly — then moved to WPA2+WPA3 so old and new laptops both join.`)}
`,
quiz:[
  {lvl:1, q:"On an AireOS controller, what is the state of a WLAN immediately after WLANs → Create New → Go → Apply?", o:["Enabled, open security, on the management interface","Disabled, WPA2-AES with 802.1X, on the management interface, QoS Silver","Enabled, WPA2-PSK, on the first dynamic interface","Disabled, open security, QoS Bronze"], a:1, why:"New WLANs are created disabled, mapped to the management interface, with WPA2 + AES and 802.1X key management and the Silver QoS profile, Broadcast SSID on. You change what the design needs and enable it last."},
  {lvl:1, type:"match", q:"Match each AireOS QoS profile with the traffic it is meant for.", pairs:[["Platinum","Voice"],["Gold","Video"],["Silver","Best effort (the default)"],["Bronze","Background, such as guests"]], why:"Best first, like medals: Platinum voice, Gold video, Silver best effort, Bronze background. Silver is the default for a new WLAN."},
  {lvl:1, type:"fill", q:"Which address does Cisco now recommend for an AireOS controller's virtual interface (the RFC 5737 address that replaced 1.1.1.1)?", fields:[{label:"Address", a:["192.0.2.1"]}], why:"The virtual interface must use an address that is never routed anywhere. 1.1.1.1 became a real public address; RFC 5737's TEST-NET-1 block 192.0.2.0/24 is reserved for documentation, and 192.0.2.1 is the usual choice."},
  {lvl:1, q:"Which controller interface do lightweight APs send their CAPWAP join requests to, and admins browse to?", o:["virtual","service-port","management","any dynamic interface"], a:2, why:"The management interface is the controller's own in-band address: APs join it (option 43 points at it), admins log in to it, and it talks to RADIUS/TACACS+ servers. The virtual interface is internal; the service port is out-of-band only."},
  {lvl:1, type:"multi", q:"Which two management access methods are enabled by default on an AireOS controller? (Choose two.)", o:["HTTPS","HTTP","SSH","Telnet","TFTP login"], a:[0,2], why:"AireOS ships with HTTPS (web) and SSH (CLI) on and HTTP and Telnet off — the encrypted choices. Audits check nobody has turned the clear-text ones back on."},
  {lvl:2, q:"Based on the exhibit, users can't see the network Lab-Guest in their Wi-Fi lists. What is the cause?", ex:"WLANs\nCurrent Filter: None\n\nWLAN ID  Type  Profile Name  WLAN SSID   Admin Status  Security Policies\n1        WLAN  STAFF         Lab-Staff   Enabled       [WPA2][Auth(PSK)]\n2        WLAN  GUEST         Lab-Guest   Disabled      None", o:["Open WLANs are not broadcast","WLAN 2's Admin Status is Disabled — tick Status Enabled on its General tab and Apply","The profile name GUEST differs from the SSID","WLAN 2 must use WPA2 to be broadcast"], a:1, why:"Admin Status Disabled means no AP advertises the SSID. Open (None) WLANs broadcast normally, and profile names needn't match SSIDs."},
  {lvl:2, type:"order", q:"Put the steps for a new WLAN that must put its clients on VLAN 45 in the order that avoids clients joining a half-built network.", items:["Allow VLAN 45 on the controller's trunk and build its gateway and DHCP pool","CONTROLLER → Interfaces → New: a dynamic interface on VLAN 45 with its address, gateway and Primary DHCP Server","WLANs → Create New → Go: type, profile name, SSID and ID","Map the WLAN to the new interface and set its security and QoS","Tick Status Enabled and Apply","Save Configuration and test from a client"], why:"Build the chain from the wired end outwards, so every link exists before anyone can join: VLAN and pool, then the interface, then the WLAN and its settings, enable last, then save and prove it."},
  {lvl:2, q:"A WLAN on a controller using the default AP group was created with ID 18. It is enabled, mapped to the right interface and uses WPA2-PSK. No client can see the SSID. Why?", o:["IDs above 16 aren't advertised by APs in the default AP group","WPA2-PSK WLANs need an ID below 10","The controller needs a reboot after creating any WLAN","The SSID must be changed while the WLAN is enabled"], a:0, why:"The default AP group contains WLAN IDs 1–16 (each AP advertises at most 16 WLANs per radio). A higher ID needs an AP group. Because a WLAN ID can't be edited, the usual fix is to delete and re-create it with a free ID from 1 to 16."},
  {lvl:2, type:"multi", q:"A client shows State: connected in netsh wlan show interfaces but ipconfig shows a 169.254.x.x address. Which two faults could explain it? (Choose two.)", o:["The WLAN's interface has no Primary DHCP Server","The pre-shared key on the client is wrong","The interface's VLAN is not allowed on the controller's trunk","The AP has not joined the controller","The WLAN is disabled"], a:[0,2], why:"Connected proves the AP is joined, the WLAN is enabled and the key matched. APIPA means no DHCP Offer: the controller had nowhere to relay (blank DHCP server) or the VLAN never reached the DHCP server (missing from the trunk)."},
  {lvl:2, q:"Based on the exhibit from the controller's switch, students on interface students (VLAN 40) get no address while staff (VLAN 20) are fine. Which command fixes it without affecting anyone else?", ex:"SW1#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/2       on               802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/2       20,99", o:["switchport trunk allowed vlan 40","switchport trunk allowed vlan add 40","switchport access vlan 40","switchport trunk native vlan 40"], a:1, why:"add appends VLAN 40 to the allowed list. Without add, the list becomes VLAN 40 only, dropping staff (20) and management (99) — every AP and WLAN would go down. An access VLAN or a new native VLAN would break the trunk's design."},
  {lvl:2, type:"fill", q:"In the AireOS GUI, under which top-level menu do you create a dynamic interface for a new VLAN?", fields:[{label:"Menu", a:["CONTROLLER","Controller","CONTROLLER > Interfaces","Controller > Interfaces","CONTROLLER → Interfaces","CONTROLLER > Interfaces > New","CONTROLLER → Interfaces → New..."]}], why:"CONTROLLER → Interfaces → New... holds the management, virtual, service-port and dynamic interfaces. WLANs are under WLANs; APs under WIRELESS; admin access under MANAGEMENT and SECURITY."},
  {lvl:3, q:"A college's new exam-week WLAN works, but the network team's monitoring now shows students' phones in 172.16.99.0/24, the subnet that holds the controller and the switch management addresses. Based on the exhibit, what is the most likely cause and fix?", ex:"WLANs > Edit 'EXAMWEEK'   [General]\nProfile Name                  EXAMWEEK\nSSID                          Exam-Week\nStatus                        [x] Enabled\nSecurity Policies             [WPA2][Auth(PSK)]\nInterface/Interface Group(G)  management\nBroadcast SSID                [x] Enabled", o:["Broadcast SSID should be off so outsiders can't find it","The WLAN was left on the default management interface; disable it, map it to a dynamic interface for the students' VLAN, re-enable and save","WPA2-PSK puts every client in the management VLAN; switch to 802.1X","The management interface must be renamed to match the profile name"], a:1, why:"A new WLAN defaults to the management interface; if that interface has a DHCP server, clients lease management addresses. Map the WLAN to its own dynamic interface (with its VLAN on the trunk and a pool), in a pause, then save. Hiding the SSID or changing the key management doesn't change the VLAN."},
  {lvl:3, q:"A pop-up clinic's new WLAN Clinic-Pop was created, mapped to its interface and enabled. The team meant to give staff a shared passphrase, but every laptop says Can't connect to this network. Based on the exhibit from one laptop, what is the fix?", ex:"C:\\Users\\nurse>netsh wlan show networks\nInterface name : Wi-Fi \nThere are 1 networks currently visible. \n\nSSID 1 : Clinic-Pop\n    Network type            : Infrastructure\n    Authentication          : WPA2-Enterprise\n    Encryption              : CCMP", o:["Turn Broadcast SSID off and on again so the laptops relearn the network","On Security → Layer 2, untick 802.1X and tick PSK with the passphrase (WLAN disabled while changing it), then re-enable","Change the QoS from Silver to Platinum","Re-create the WLAN with an ID above 16"], a:1, why:"WPA2-Enterprise in the exhibit is the default 802.1X key management that every new WLAN starts with — it needs a RADIUS server and a per-user login, so laptops offering a passphrase fail. Switching key management to PSK (lesson 6) matches the design. Broadcast, QoS and IDs have nothing to do with authentication; IDs above 16 wouldn't even be advertised."},
  {lvl:3, q:"A hotel wants one design for its conference guest WLAN: guests must never slow down the front desk, must not reach each other's laptops, and must not bypass DHCP with static addresses. Which combination meets all three?", o:["QoS Platinum, Broadcast SSID off, Session Timeout 0","QoS Bronze, P2P Blocking Action Drop, DHCP Addr. Assignment Required","QoS Gold, Client Exclusion off, AAA Override on","QoS Silver, Maximum Allowed Clients 0, FlexConnect Local Switching"], a:1, why:"Bronze keeps guest traffic below staff data; P2P blocking stops client-to-client traffic on the WLAN; DHCP Addr. Assignment Required refuses clients with typed static addresses. Platinum/Gold raise guests' priority; hiding the SSID and the other options don't meet the requirements."},
  {lvl:3, type:"multi", q:"A bank's controller sends admin logins to a TACACS+ server first and Local second. Which two statements are true? (Choose two.)", o:["If the TACACS+ server is unreachable, an engineer can log in with the local emergency account","If the TACACS+ server rejects a password, the controller tries the local database next","Each engineer's changes can be recorded under their own name through TACACS+ accounting","TACACS+ uses UDP 1812 for authentication","Once TACACS+ is configured, HTTPS can safely be replaced by HTTP"], a:[0,2], why:"The local database is a fallback used only when the server can't be reached — a reject is final. TACACS+ (TCP 49) accounting records each admin's changes. UDP 1812 is RADIUS, and a central server doesn't make clear-text HTTP safe."},
],
cards:[
  {f:"The WLAN chain", b:"WLAN → interface → VLAN (tagged) → controller trunk → gateway and DHCP pool. A missing link gives Connected but 169.254.x.x."},
  {f:"Apply vs Save Configuration", b:"Apply makes one page's changes live at once. Save Configuration writes the whole config so it survives a reboot (like copy running-config startup-config)."},
  {f:"Management interface", b:"The controller's in-band address: APs send CAPWAP joins to it, admins browse/SSH to it, RADIUS/TACACS+ go from it. Recommended on a tagged VLAN."},
  {f:"Virtual interface", b:"An internal address for DHCP relay, web sign-in and mobility. Must never be used or routed: 192.0.2.1 (RFC 5737). 1.1.1.1 is retired (now a real public address)."},
  {f:"Service port", b:"Out-of-band management port to an access port — no 802.1Q tags, no APs or clients. Reachable when the data network is down."},
  {f:"Dynamic interface", b:"CONTROLLER > Interfaces > New: name + VLAN Id, then IP, netmask, gateway, Primary DHCP Server. VLAN 0 = untagged. One per client VLAN."},
  {f:"DHCP proxy", b:"Default on AireOS: the controller relays each client's request to the interface's Primary DHCP Server, from the interface's address (giaddr). Blank server = no addresses."},
  {f:"WLANs > New rules", b:"Type WLAN, Profile Name (unique, max 32), SSID (max 32), ID (1-512; only 1-16 in the default AP group; can't be changed later)."},
  {f:"New WLAN defaults", b:"Disabled, management interface, WPA2-AES with 802.1X, QoS Silver, Broadcast SSID on. Change what's needed; tick Status Enabled last."},
  {f:"WLAN edit tabs", b:"General (Status, Interface, Broadcast SSID, Security Policies), Security (Layer 2 / Layer 3 / AAA Servers), QoS, Advanced."},
  {f:"QoS profiles", b:"Platinum = voice, Gold = video, Silver = best effort (default), Bronze = background (guests). Priority is relative."},
  {f:"Advanced tab highlights", b:"AAA Override (RADIUS assigns VLAN/QoS), Session Timeout 1800 s, Client Exclusion 60 s, Max Allowed Clients, DHCP Addr. Assignment Required, P2P Blocking, FlexConnect Local Switching."},
  {f:"Controller management access", b:"HTTPS and SSH on by default; HTTP and Telnet off (clear text). Console 9600 8N1 and service port for out-of-band. Admins via TACACS+ (TCP 49) or RADIUS (tick Management), local as fallback when unreachable."},
],
});

// ---------- Module 9 · Lesson 6 ----------
L.push({
id:"wifi-sec", mins:115, level:"Intermediate · builds on lessons 1–5 and Module 8",
t:"Wireless security — WEP to WPA3, Personal vs Enterprise, and configuring WPA2-PSK on the WLC",
html:`
${K.goals([
  "Explain authentication vs encryption on Wi-Fi, and what stops rogue APs, evil twins, deauthentication floods and password guessing.",
  "Compare WEP, WPA, WPA2 and WPA3 by cipher, keys and integrity, and say why each older one was retired.",
  "Choose Personal (PSK/SAE) or Enterprise (802.1X + RADIUS), and explain SAE, PMF, 192-bit mode, transition mode and Enhanced Open.",
  "Configure and verify a WPA2-PSK WLAN in the AireOS GUI.",
  "Move a WLAN to WPA2+WPA3 transition mode and predict which clients can join any WLAN.",
])}
${K.pre([
  "Lesson 5 of this module: the controller's GUI — the WLANs page, Create New → Go, the General tab, mapping a WLAN to an interface, Status Enabled, Apply and Save Configuration.",
  "Lessons 1–4: SSIDs, APs joining the controller over CAPWAP, <code>netsh wlan show interfaces</code> and the Wireless LAN adapter in <code>ipconfig</code>.",
  "Module 8: lesson 1 (encryption, hashes, man-in-the-middle, dictionary and brute-force guessing), lesson 3 (802.1X: supplicant, authenticator, RADIUS server, EAP) and lesson 6 (port security).",
  "Module 7 lesson 7: AES, met there as SNMPv3's encryption.",
])}

<h2>Why this matters at work</h2>
<p>Friday afternoon at an accounting firm in Kano. The external auditor parks outside, opens a laptop and joins the office Wi-Fi. No password. From the car park she can reach the file server, and her laptop can hear every frame the staff laptops send. The network was set up &ldquo;open for now&rdquo; on moving day, two years ago.</p>
<p>A cable stops at the wall; a radio signal doesn't. So Wi-Fi security has to decide who may join and scramble what is sent. The CCNA tests the protocols that do this (topic 5.9) and asks you to configure one in the controller's GUI (5.10). At work you'll choose between them, explain the choice, and fix the morning an old scanner can't join the new &ldquo;secure&rdquo; WLAN. This lesson covers four generations of Wi-Fi security, which client joins which network, and a passphrase-protected WLAN on lesson 5's controller.</p>

<h2>Two jobs: authentication and encryption — and what attackers want</h2>
${K.remember(`<b>The rule:</b> Wi-Fi security has two jobs. <b>Authentication</b>: may this device join (and is this network real)? <b>Encryption</b> with integrity: can anyone else in range read or change the frames? Judge every method on both. An <b>open</b> WLAN does neither.`)}
<p>A switch sends a unicast frame out of one port only (Module 3). Radio has no ports: every radio on the channel receives every frame, next door and in the car park, and walls only weaken the signal (lesson 1). So the protection has to come from the protocol.</p>
${K.svg("0 0 760 250",
  K.dev("laptop",90,80,"STAFF LAPTOP","knows the key")+
  K.dev("ap",380,80,"ACCESS POINT","SSID KN-Office")+
  K.dev("laptop",660,80,"ANYONE IN RANGE","car park, next office")+
  K.link(115,82,350,82,"radio",true)+K.link(410,82,635,82,"hears every frame",true)+
  K.box(40,150,330,44,"1 · Authentication","may you join — and is this AP real?",true)+
  K.box(390,150,330,44,"2 · Encryption + integrity","scramble every frame, detect changes",true)+
  K.txt(380,228,"Open WLAN: neither job is done — anyone can join, and anyone in range can read the frames.",{mid:true,c:"bad",s:11,f:"body"}),
  "Radio is shared: whoever is in range receives the frames. Security has to come from authentication and encryption, not from walls.")}
<p>802.11's join sequence (lesson 2) opens with <b>open system authentication</b>, a formality that accepts everyone. The real proof comes after association from the security protocol, which also adds <b>integrity</b>: each protected frame carries a ${K.g("MIC","Message integrity check: a keyed checksum. Change the frame and it no longer matches. (MIC, not MAC, to avoid confusion with addresses.)")}, so a frame changed in the air is discarded.</p>
<h3>What attackers want — at concept level</h3>
<p>To defend, you need what each attack is after, what your team would notice and what stops it — not how to carry one out.</p>
<div class="tablewrap"><table>
<tr><th>Threat</th><th>Attacker wants</th><th>Network team sees</th><th>What stops it</th></tr>
<tr><td><b>Eavesdropping</b></td><td>Read traffic on an open or weak WLAN</td><td>Nothing — listening is passive</td><td>WPA2/WPA3; Enhanced Open on guest networks</td></tr>
<tr><td><b>${K.g("Rogue AP","An AP connected to your network without permission, often an employee's home router.")}</b></td><td>A back door to the wired LAN</td><td>An unknown ${K.g("BSSID","The MAC address of an AP radio's service set (lesson 2).")} in the controller's rogue list; a new MAC on a desk port</td><td>Port security or 802.1X on wired ports; rogue detection; policy</td></tr>
<tr><td><b>${K.g("Evil twin","A fake AP broadcasting your SSID to lure clients, capture logins or sit in the middle.")}</b></td><td>Lure clients with your SSID; capture logins or sit in the middle (Module 8's ${K.g("MITM","Man-in-the-middle (Module 8 lesson 1).")})</td><td>Your SSID from a BSSID you don't own; certificate warnings</td><td>802.1X with server-certificate checks; WPA3-SAE; user awareness</td></tr>
<tr><td><b>${K.g("Deauthentication flood","Forged management frames telling clients 'you are disconnected'. Older Wi-Fi doesn't protect them.")}</b></td><td>Knock clients off, or force reconnects</td><td>Clients dropping repeatedly in one area</td><td><b>${K.g("PMF","Protected Management Frames (IEEE 802.11w): management frames carry a MIC, so forged deauthentications are ignored. Cisco also says MFP.")}</b>: optional in WPA2, mandatory in WPA3</td></tr>
<tr><td><b>Password guessing</b></td><td>Guess a WPA2 passphrase offline from a captured handshake (Module 8's ${K.g("dictionary","Trying every entry in a list of common passwords (Module 8 lesson 1).")} guessing)</td><td>Nothing — it happens offline</td><td>Long random passphrases; WPA3-SAE; per-person Enterprise logins</td></tr>
</table></div>
${K.analogy(`An open WLAN is a meeting in a hotel lobby: anyone sits down, everyone hears. WPA2 is a locked room with a private language. WPA3 also stops a stranger shouting &ldquo;meeting over!&rdquo; through the door (PMF).`)}
${K.check({q:"A café offers open Wi-Fi with no password. Which statement is true?", o:["Clients are authenticated by open system authentication, so their traffic is encrypted","Anyone can join, and anyone in range can read unencrypted frames — neither job of Wi-Fi security is done","Traffic is safe because each client has its own BSSID","Only the AP can hear the clients' frames"], a:1, why:"Open system authentication accepts everyone and sets up no keys, and every radio on the channel receives the frames. Encryption needs WPA2/WPA3 (or Enhanced Open)."})}

<h3>Try it: close the wired door a rogue AP would use</h3>
<p>A rogue AP needs a wired socket, and you can guard sockets with commands you know. A ${K.g("lightweight AP","An AP managed by a WLC, tunnelling its traffic over CAPWAP (lessons 3–4).")} in local mode sends everything inside CAPWAP from its <b>own</b> MAC, so its port sees one address; a desk socket sees one PC. Module 8 lesson 6's sticky port security makes &ldquo;one known device&rdquo; a rule: swap in a home router and the port shuts.</p>
${K.term({env:"ios2", title:"LOS-HTL-SW4 — a hotel floor switch, rogue-proofed", opts:{kind:"switch", host:"LOS-HTL-SW4", model:"C9200L-24P-4G", motd:"LOS-HTL-SW4 — 4th floor access switch, Lagos hotel (lab, no enable secret). Gi0/1-2 = lightweight APs (local mode), Gi0/3-6 = staff desks, Gi0/7-8 = unused."},
  setup:env=>{ ["en","conf t","vlan 10","name AP-MGMT","vlan 20","name STAFF-DESKS","exit","interface g0/1","description AP-4F-EAST (local mode)","interface g0/2","description AP-4F-WEST (local mode)","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. No cables here: this is about the configuration.",
  tasks:[
    {text:"AP ports: <code>interface range g0/1 - 2</code>, <code>switchport mode access</code>, <code>switchport access vlan 10</code>, then <code>switchport port-security</code> and <code>switchport port-security mac-address sticky</code> (one AP MAC per port, learned and remembered)", done:e=>["1","2"].every(n=>{ const i=e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===10 && i.psec && i.psecSticky; })},
    {text:"Desk ports Gi0/3–0/6: access VLAN 20 with sticky port security — the default maximum of 1 is right for one PC per socket", done:e=>["3","4","5","6"].every(n=>{ const i=e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===20 && i.psec && i.psecSticky; })},
    {text:"Unused sockets: create <code>vlan 999</code> with <code>name PARKING</code>, then put Gi0/7–0/8 in it as access ports and <code>shutdown</code> — a socket that is off can't host a rogue AP", done:e=>e.vlans[999]==="PARKING" && ["7","8"].every(n=>{ const i=e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===999 && i.shut; })},
    {text:"<code>end</code>, check <code>show port-security</code> (six secured ports, action Shutdown) and save with <code>copy running-config startup-config</code>", done:e=>e.savedOnce && e.history.some(h=>/^\s*sh\S*\s+port-s\S*\s*$/i.test(h))},
  ],
  win:"Every live socket on the floor now accepts one known device, and the unused ones are switched off in a parking VLAN. A rogue AP plugged in where an AP or a PC used to be brings a new MAC address and err-disables the port, and the controller's rogue list and 802.1X are the next layers. show port-security lists Gi0/1–0/6 with MaxSecureAddr 1 and Security Action Shutdown.",
  solve:["enable","configure terminal","interface range g0/1 - 2","switchport mode access","switchport access vlan 10","switchport port-security","switchport port-security mac-address sticky","interface range g0/3 - 6","switchport mode access","switchport access vlan 20","switchport port-security","switchport port-security mac-address sticky","exit","vlan 999","name PARKING","exit","interface range g0/7 - 8","switchport mode access","switchport access vlan 999","shutdown","end","show port-security","copy running-config startup-config",""]})}
${K.hint(`Port security is refused on a port that is still dynamic, so set <code>switchport mode access</code> first (Module 8 lesson 6). <code>vlan 999</code> is a global command: <code>exit</code> the interface range before you type it.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"An Ibadan branch switch has five kinds of port. Which two can safely run port security with the default maximum of 1? (Choose two.)", o:["Gi0/1 to a lightweight AP in local mode","Gi0/2 to a FlexConnect AP that locally switches the staff WLAN onto VLAN 20","Gi0/3 to one desk PC","Gi0/4, the trunk to the wireless LAN controller","Gi0/5 to an IP phone with a PC plugged into it"], a:[0,2], why:"1. What is asked? Which ports only ever see one source MAC address. 2. Which rule? Port security counts every source MAC arriving on the port, and a local-mode AP tunnels client frames inside CAPWAP, so the switch sees only the AP's MAC (lessons 3–4). 3. Apply it: the local-mode AP and the single PC see one MAC each. A FlexConnect AP with local switching puts every client's MAC on its own port (lesson 3). The WLC trunk carries all the tunnelled clients' MACs. The phone + PC desk has two devices, so it needs maximum 2."})}

<h2>From the first Wi-Fi security to WPA2: what broke, and what fixed it</h2>
${K.remember(`<b>The rule:</b> a generation is as strong as its <b>cipher</b>, its <b>keys</b> (fresh per client per session beats one shared key forever) and its <b>integrity check</b>. The first generation failed all three, the second patched them, the third replaced them.`)}
<h3>WEP: the first try (1997)</h3>
<p>${K.g("WEP","Wired Equivalent Privacy: the original 802.11 security (1997). Broken; deprecated by the IEEE in 2004.")} (Wired Equivalent Privacy) came with the original 802.11 standard. It aimed to make the air as private as a cable, and it failed on all three counts:</p>
<ul>
<li><b>Keys:</b> one 40-bit or 104-bit key on every device, rarely changed. Each frame added only a 24-bit ${K.g("IV","Initialisation vector: a value mixed with the key so each frame is encrypted differently. WEP's was 24 bits, sent in clear.")} (initialisation vector), sent in clear text. With 16.7 million IVs, a busy network repeats them within hours, and repeats let an eavesdropper work backwards.</li>
<li><b>Cipher:</b> ${K.g("RC4","A 1987 stream cipher. WEP (and later TKIP) used it in ways that leak information.")}, used in a way that exposed its weaknesses.</li>
<li><b>Integrity:</b> a ${K.g("CRC-32","The checksum Ethernet uses as its FCS (Module 2): it catches accidents, but an attacker can change a frame and fix it up.")}, which catches accidents but not tampering.</li>
</ul>
<p>From captured traffic, a WEP key could be recovered in minutes. The IEEE deprecated it in 2004, and AireOS 8.10 keeps Static WEP only for older APs.</p>
${K.dyk(`&ldquo;128-bit WEP&rdquo; was a 104-bit key plus the 24-bit IV (&ldquo;64-bit&rdquo; was 40 + 24), and the IV travelled in the clear. Key-length marketing tells you little; how keys are made and used matters.`)}
<h3>WPA: the emergency patch (2003)</h3>
<p>With the IEEE's full fix, ${K.g("802.11i","The 2004 IEEE amendment that rebuilt Wi-Fi security (AES-CCMP, the 4-way handshake); certified as WPA2.")}, unfinished and millions of WEP devices unable to run a new cipher, the Wi-Fi Alliance (the industry body that certifies Wi-Fi devices) published ${K.g("WPA","Wi-Fi Protected Access (2003): the Wi-Fi Alliance's interim fix, based on a draft of 802.11i.")} (Wi-Fi Protected Access) as a firmware-update stopgap. Its ${K.g("TKIP","Temporal Key Integrity Protocol: WPA's encryption. RC4 with a new key per frame, a replay counter and the Michael MIC. Deprecated.")} kept RC4 but mixed a new key for <b>every frame</b>, rejected replayed frames and added a keyed MIC (Michael). WPA also introduced the two modes you still use: <b>Personal</b>, with a ${K.g("PSK","Pre-shared key: one passphrase on the WLAN and every client (Module 8 met PSKs on VPN peers).")} (pre-shared key), and <b>Enterprise</b>, with 802.1X logins.</p>
<p>TKIP is now deprecated too. A practical side effect: 802.11n and later allow their high-throughput rates only with WPA2's AES, never with WEP or TKIP, so a TKIP-only WLAN holds a modern laptop to 802.11a/g rates (54 Mbps at most). AireOS 8.10 won't enable WPA version 1 on its own.</p>
<h3>WPA2: the real fix (2004)</h3>
<p>${K.g("WPA2","Wi-Fi Protected Access 2: the Wi-Fi Alliance certification of IEEE 802.11i (2004); required for certified devices since 2006.")} is the finished 802.11i, required on every new Wi-Fi CERTIFIED device since 2006. It replaces RC4 with ${K.g("AES","Advanced Encryption Standard (Module 7 lesson 7): the standard modern cipher.")} in ${K.g("CCMP","Counter Mode with CBC-MAC Protocol: AES-128 encryption plus an AES-based MIC. Cisco's GUI says AES, Windows says CCMP.")} mode, which encrypts each frame and adds an AES-based MIC. Cisco's GUI says <b>AES</b> and Windows says <b>CCMP</b>. They're the same thing.</p>
<p>The other big idea: <b>the long-term secret never encrypts traffic and never crosses the air</b>. Both sides start from a ${K.g("PMK","Pairwise master key: the 256-bit shared secret. Personal: from passphrase + SSID. Enterprise: from the 802.1X login.")} (pairwise master key), and the <b>4-way handshake</b> turns it into fresh keys for this association only.</p>
${K.svg("0 0 760 360",
  K.box(40,10,200,44,"LAPTOP (supplicant)","already knows the PMK",true)+
  K.box(520,10,200,44,"AP / WLC (authenticator)","already knows the PMK",true)+
  K.link(140,54,140,300)+K.link(620,54,620,300)+
  K.arrow(618,90,142,90,"1 · ANonce — the AP's random number",true)+
  K.txt(380,112,"The laptop picks its own random number and calculates the PTK.",{mid:true,c:"fg",s:10.5,f:"body"})+
  K.arrow(142,150,618,150,"2 · SNonce + MIC — proves the laptop has the PMK",true)+
  K.txt(380,172,"The AP calculates the same PTK and checks the MIC. A wrong passphrase fails here.",{mid:true,c:"bad",s:10.5,f:"body"})+
  K.arrow(618,210,142,210,"3 · GTK (encrypted) + MIC — install your keys",true)+
  K.arrow(142,250,618,250,"4 · ACK — keys installed",true)+
  K.band(160,272,440,24,"data now: AES-CCMP with the PTK (GTK for broadcasts)")+
  K.txt(380,326,"The PMK never crosses the air. WPA2-Personal: PMK = passphrase + SSID. Enterprise: PMK from the 802.1X login.",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(380,346,"PTK = calculated from the PMK, both random numbers and both MAC addresses — new for every association.",{mid:true,s:11,f:"body"}),
  "The WPA2 4-way handshake, as a concept: two random numbers and the shared PMK give both sides the same fresh keys, without sending the PMK.")}
<h3>Worked example: a laptop joins a WPA2-Personal WLAN</h3>
${K.steps([
  ["Before anything is sent", "Both sides run the passphrase and the SSID through a deliberately slow calculation (4,096 rounds of hashing) to get the 256-bit PMK. If the passphrases match, the PMKs match."],
  ["Message 1", `The AP (in local mode the controller takes part over CAPWAP, lesson 4) sends a random ${K.g("ANonce","Authenticator nonce: the AP's random number in message 1 ('nonce' = number used once).")}.`],
  ["Message 2", `The laptop picks its own ${K.g("SNonce","Supplicant nonce: the client's random number in message 2.")}, calculates the ${K.g("PTK","Pairwise transient key: one client's session keys, calculated from the PMK, both nonces and both MACs.")} from the PMK, both nonces and both MAC addresses, and sends the SNonce with a MIC made with that key.`],
  ["The check", "The AP calculates the same PTK and checks the MIC. If the passphrases differed, the MIC fails, and Windows says <i>The network security key isn't correct</i>."],
  ["Messages 3 and 4", `The AP sends the encrypted ${K.g("GTK","Group temporal key: shared by all clients of a BSS for broadcast and multicast frames.")} for broadcasts. The laptop confirms. Both install their keys, and every data frame is now AES-CCMP.`],
])}
${K.out(`C:\\Users\\ada>netsh wlan show interfaces

There is 1 interface on the system:

    Name                   : Wi-Fi
    ...
    State                  : connected
    SSID                   : LAG-Staff
    ...
    Connected Akm-cipher   : [ akm = 00-0f-ac:02, cipher =  00-0f-ac:04 ]
    Network type           : Infrastructure
    Radio type             : 802.11ac
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    ...`, "Windows 11, trimmed (lesson 1 read the full layout). akm 00-0f-ac:02 = PSK key management; cipher 00-0f-ac:04 = CCMP. :01 would mean 802.1X; :08 is WPA3's method (below).")}
<p>The <code>akm</code> value names the ${K.g("AKM","Authentication and key management: how the PMK is obtained — PSK, SAE or 802.1X. Cisco's GUI has one tick box per method.")} method (authentication and key management) and <code>cipher</code> the encryption: together, proof of what the laptop negotiated.</p>
<div class="tablewrap"><table>
<tr><th></th><th>WEP (1997)</th><th>WPA (2003)</th><th>WPA2 (2004)</th><th>WPA3 (2018)</th></tr>
<tr><td><b>Encryption</b></td><td>RC4, static key</td><td>TKIP</td><td><b>AES-CCMP</b></td><td>AES-CCMP; GCMP-256 in 192-bit mode</td></tr>
<tr><td><b>Integrity</b></td><td>CRC-32</td><td>Michael MIC</td><td>CCMP MIC</td><td>CCMP/GCMP MIC + PMF</td></tr>
<tr><td><b>Personal / Enterprise</b></td><td>shared key / —</td><td>PSK / 802.1X</td><td>PSK / 802.1X</td><td><b>${K.g("SAE","Simultaneous Authentication of Equals: WPA3-Personal's password-based key exchange (Dragonfly) — next sections.")}</b> / 802.1X</td></tr>
<tr><td><b>Status</b></td><td>broken</td><td>deprecated</td><td>most common</td><td>current</td></tr>
</table></div>
${K.remember(`<b>Really Tired Cats Sleep</b> — <b>R</b>C4 (WEP), <b>T</b>KIP (WPA), <b>C</b>CMP (WPA2), <b>S</b>AE (WPA3). The headline technology of each generation, in order.`)}
${K.check({q:"Why can't a WPA2-Personal passphrase be read from the air while a laptop joins?", o:["It is sent encrypted with AES in message 2","It is never sent: both sides calculate the PMK from the passphrase and SSID, and the handshake only exchanges random numbers and MICs","It is sent once, in clear text, but only to the AP's BSSID","It is hidden inside the beacon frames"], a:1, why:"The handshake carries two nonces and MICs; each side derives the PTK from its own PMK. (That's also why a captured handshake allows offline guessing, which SAE removes.)"})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four old networks found during a site survey in a Port Harcourt office park. Match each finding with what it tells you.", pairs:[["The WLAN offers only RC4 with one key typed into every device in 2015","WEP — broken; replace now"],["Windows shows Cipher : TKIP and 802.11ac laptops never go above 54 Mbps","WPA with TKIP — deprecated, and it blocks 802.11n/ac rates"],["Windows shows Authentication WPA2-Personal, Cipher CCMP","WPA2 with AES — current standard, still sound"],["Windows shows akm = 00-0f-ac:08","SAE — the laptop joined with WPA3-Personal"]], why:"1. What is asked? Which generation each piece of evidence points to. 2. Which rule? Read the cipher and the key method: RC4 + static key = WEP; TKIP = WPA (and no high-throughput rates); CCMP = WPA2's AES; AKM suite 8 = SAE (WPA3). 3. Apply it: the 54 Mbps ceiling is a side effect of TKIP, not of the radio."})}

<h2>Personal or Enterprise: one shared key, or one login per person</h2>
${K.remember(`<b>The rule:</b> <b>Personal</b> = one shared passphrase: knowing it makes you a member, and changing it touches every device. <b>Enterprise</b> = each user or device logs in through <b>802.1X</b> to a <b>RADIUS</b> server (Module 8 lesson 3): a PMK per session, and one person can be locked out alone.`)}
${K.svg("0 0 760 300",
  K.txt(190,22,"PERSONAL (PSK / SAE)",{mid:true,c:"fg",s:12.5,b:true,f:"body"})+
  K.txt(570,22,"ENTERPRISE (802.1X)",{mid:true,c:"fg",s:12.5,b:true,f:"body"})+
  K.link(380,36,380,284,"",true)+
  K.dev("laptop",70,80,"ADA","same passphrase")+K.dev("laptop",70,175,"BAYO","same passphrase")+
  K.dev("ap",270,128,"AP + WLC","checks the key")+
  K.link(95,82,245,124,"",true)+K.link(95,176,245,132,"",true)+
  K.dev("laptop",440,80,"ADA","user ada + password")+K.dev("laptop",440,175,"BAYO","certificate")+
  K.box(540,108,90,40,"WLC","authenticator",true)+
  K.dev("server",705,128,"RADIUS","ISE / NPS")+
  K.link(465,82,540,122,"",true)+K.link(465,176,540,134,"",true)+K.link(630,128,688,128)+
  K.txt(190,250,"One secret for everyone: it leaks with one person,",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(190,266,"and changing it means re-typing it on every device.",{mid:true,s:11,f:"body"})+
  K.txt(570,250,"Each person proves who they are; the server can refuse",{mid:true,c:"fg",s:11,f:"body"})+
  K.txt(570,266,"one account without touching anyone else's device.",{mid:true,s:11,f:"body"}),
  "Personal mode trusts whoever knows the passphrase. Enterprise mode trusts a login that a RADIUS server checks for each person or device.")}
<h3>Personal: strong maths, weak sharing</h3>
<p>WPA2-Personal's AES is strong. Its weak points come from everyone sharing one secret:</p>
<ul>
<li><b>It leaks with people</b> (leavers, contractors, the reception whiteboard), and whoever knows it is a member.</li>
<li><b>Changing it touches every device</b>, all on the same day.</li>
<li><b>Key holders can read each other.</b> The PTK comes from the PMK plus values sent in the clear, so someone with the passphrase who captures another client's handshake can work out its keys. &ldquo;Encrypted&rdquo; means hidden from outsiders, not from other key holders.</li>
<li><b>A captured handshake can be guessed against offline.</b> A long random passphrase (20+ characters) makes that impractical.</li>
</ul>
<p>The Cisco format rule: <b>8–63 ASCII characters</b> (case-sensitive) or <b>exactly 64 hex digits</b> (the 256-bit PMK typed directly).</p>
<h3>Enterprise: 802.1X over the air</h3>
<p>The roles are Module 8 lesson 3's. The <b>supplicant</b> is the laptop. The <b>authenticator</b> is the controller (in local mode the AP carries EAP to it inside CAPWAP). The <b>authentication server</b> is RADIUS, such as Cisco ISE or Microsoft ${K.g("NPS","Network Policy Server: the RADIUS role in Windows Server.")}. The login is ${K.g("EAP","Extensible Authentication Protocol (Module 8 lesson 3): EAP-TLS (certificates), PEAP (password in a TLS tunnel).")}, usually EAP-TLS or PEAP. Laptop and server each derive a fresh PMK during EAP; the server sends it to the controller with Access-Accept, and the 4-way handshake follows.</p>
<p>A new AireOS WLAN expects exactly this: WPA2, AES, <b>802.1X</b> (lesson 5). Add the server under SECURITY → AAA → RADIUS → Authentication → New (IP, shared secret, port 1812, <b>Network User</b> ticked) and select it on the WLAN's Security → AAA Servers tab. The lab has no RADIUS server, so its 802.1X WLANs show <i>Can't connect to this network</i>, the usual symptom of an unreachable server too.</p>
${K.when([
  ["WPA2/WPA3-Personal","Small offices; devices without 802.1X (printers, scanners, displays)","One passphrase, no server","Staff come and go, or one person must be locked out fast"],
  ["WPA2/WPA3-Enterprise","Companies, hospitals, banks, universities","A login per person; revoke one account; RADIUS can assign the VLAN","No RADIUS server or nobody to run it"],
  ["Enhanced Open + captive portal","Guest Wi-Fi: hotels, cafés, airports","Encrypts each guest without a shared password","You need to know who the user is"],
], "Which mode for which WLAN?")}
${K.myth([
  ["Hiding the SSID (Broadcast SSID off, lesson 5) keeps outsiders off.","The name still travels in clients' probe requests and association frames. Only authentication keeps people out."],
  ["MAC filtering is a lock nobody can pick.","Every frame carries the MAC in clear text, and MACs can be copied (Module 2)."],
  ["WPA2-Personal with a long passphrase is as good as Enterprise.","Length defeats guessing. Sharing is still the problem: it can't be withdrawn from one person, and key holders can decrypt each other."],
  ["WPA3 makes a weak password safe.","SAE stops offline guessing, but a guessable password can be tried live, and a leaked one still works."],
  ["One WPA3 laptop forces the WLAN onto WPA3.","Client and WLAN use the best method they share. On a WPA2-PSK WLAN, a WPA3 laptop joins with WPA2."],
])}
${K.mistake(`One SSID and passphrase for staff and guests, printed on the reception card. Every guest then has the staff key and sits on the staff VLAN. Give guests their own WLAN and VLAN (lesson 5) with Enhanced Open or a captive portal, and staff Enterprise logins.`)}
${K.check({q:"A 300-person bank head office in Abuja wants staff Wi-Fi where a leaver's access ends the moment HR disables their account. Which design does that?", o:["WPA2-Personal with a 30-character passphrase changed every quarter","WPA2/WPA3-Enterprise: 802.1X logins checked by a RADIUS server against the staff directory","WPA3-Personal, because SAE resists offline guessing","An open WLAN with MAC filtering"], a:1, why:"Only Enterprise ties access to an individual account: disable it and RADIUS rejects the next login, with no key to change elsewhere. PSK and SAE are still one shared secret; MAC filtering isn't authentication."})}
<h3>Same logic, new situation</h3>
<p>A Kaduna secondary school runs one WPA2-Personal SSID for staff, students and 40 classroom projectors. A student posted the passphrase in a group chat, and the head wants &ldquo;a new password tonight&rdquo;. What happens, and what would you propose?</p>
${K.hint(`Who has to type the new key, and what stops the next leak? Which devices can do 802.1X?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The effect of a PSK change, and a better design. <b>2. Which rule?</b> Personal = one shared secret: changing it touches every device, and it leaks again the same way. <b>3. Apply it:</b> tonight everything drops off until re-keyed, projectors included. Instead, split by user: staff and students on Enterprise accounts (a leak = one account to disable), projectors on a device SSID with a PSK only IT knows, on a restricted VLAN.</p>`)}

<h2>WPA3: SAE, protected management frames, 192-bit and transition mode</h2>
${K.remember(`<b>The rule:</b> WPA3 keeps AES and the 4-way handshake. <b>SAE</b> replaces the PSK step (no offline guessing, past traffic stays safe), <b>PMF</b> becomes mandatory, and Enterprise gains a <b>192-bit</b> mode. A client joins only if it shares a method with the WLAN, and the best shared method wins.`)}
<p>${K.g("WPA3","Wi-Fi Protected Access 3 (Wi-Fi Alliance, 2018); required for new certified devices since July 2020.")} arrived in 2018 and has been required on new Wi-Fi CERTIFIED devices since July 2020. AireOS supports it from 8.10, as does the Catalyst 9800.</p>
<h3>WPA3-Personal: SAE</h3>
<p><b>SAE</b> (Simultaneous Authentication of Equals) still uses a passphrase, but each side proves it knows it through a ${K.g("Diffie–Hellman","Key agreement (Module 8): both sides calculate the same secret from exchanged public values; an eavesdropper can't.")}-style exchange tied to the password. The result is a fresh PMK. That gives you two things:</p>
<ul>
<li><b>No offline guessing.</b> A recording gives an attacker nothing to test guesses against. Every guess needs a live, slow, noticeable attempt with the AP.</li>
<li><b>Forward secrecy.</b> Learning the password next year doesn't decrypt today's recorded traffic, and key holders can't decrypt each other.</li>
</ul>
<p>The 4-way handshake and AES-CCMP follow as before. Windows shows <code>Authentication : WPA3-Personal</code>, <code>akm = 00-0f-ac:08</code>.</p>
<h3>PMF, 192-bit and Enhanced Open</h3>
<ul>
<li><b>PMF</b>, from the IEEE amendment ${K.g("802.11w","The 2009 IEEE amendment that added protected management frames.")}: older Wi-Fi never protected management frames, so a forged &ldquo;you're disconnected&rdquo; was believed. PMF adds a MIC once keys exist. It's optional in WPA2 and <b>required</b> in WPA3. On a Cisco WLAN the setting is Disabled, Optional or Required.</li>
<li><b>WPA3-Enterprise</b> is 802.1X with PMF required, plus an optional <b>192-bit mode</b> for government, defence and finance: ${K.g("GCMP","Galois/Counter Mode Protocol: AES in GCM mode; GCMP-256 in WPA3's 192-bit mode. Windows: Cipher : GCMP.")}-256, HMAC-SHA-384 and 384-bit elliptic-curve keys, supported end to end.</li>
<li><b>Enhanced Open</b>, a separate certification launched with WPA3, uses ${K.g("OWE","Opportunistic Wireless Encryption (RFC 8110): per-client keys on a password-less network. Authenticates nobody.")} to give each client on an open network its own keys. Guests can't read each other, but nobody is authenticated, so an evil twin can offer it too. It suits guest networks (AireOS 8.10: Layer 2 Security <b>Enhanced Open</b>).</li>
</ul>
${K.dyk(`WPA2 survived KRACK (key reinstallation attacks, 2017), a flaw in how devices handled the 4-way handshake, and WPA3 survived &ldquo;Dragonblood&rdquo; (2019), weaknesses in early SAE implementations. Both were fixed by software updates, so keep AP, controller and client firmware current.`)}
<h3>Which client joins which WLAN?</h3>
<p>The client offers what its adapter supports, the WLAN what you ticked. No common method, no connection; otherwise the best shared one wins:</p>
<div class="tablewrap"><table>
<tr><th>Client ↓ · WLAN →</th><th>WPA2-PSK</th><th>WPA2 + WPA3 (transition)</th><th>WPA3-SAE only</th></tr>
<tr><td><b>WPA2-only</b></td><td>joins — WPA2-Personal</td><td>joins — WPA2-Personal</td><td><b>can't join</b> — no SAE</td></tr>
<tr><td><b>WPA3-capable</b></td><td>joins — WPA2-Personal</td><td>joins — WPA3-Personal</td><td>joins — WPA3-Personal</td></tr>
</table></div>
<p><b>Transition mode</b> is one SSID with <b>PSK + SAE on the same passphrase</b> and PMF <b>Optional</b>, so WPA2 clients without PMF still join. Sites move in stages: transition, watch who still uses WPA2, replace or separate them, then WPA3-only. Meanwhile WPA2 clients get only WPA2's protection, and Cisco notes some older clients misbehave on transition SSIDs, so test the oldest first. Fixed rule: <b>6 GHz (lesson 2) allows only WPA3 or Enhanced Open</b>.</p>
${K.exam(`Reading a wireless-security question: first decide which job it asks about. <b>Authentication / key management</b>: passphrase, PSK, SAE, 802.1X, RADIUS, EAP. <b>Encryption</b>: TKIP, AES, CCMP, GCMP. Then match the generation: TKIP = WPA, CCMP = WPA2, SAE = WPA3. Forged deauthentication = PMF; forward secrecy = SAE; &ldquo;Enterprise&rdquo; = a RADIUS server. Many study guides pair WPA3 with <b>GCMP</b>. Strictly, WPA3-Personal still requires CCMP and GCMP-256 is the 192-bit mode's, but when options pair WPA2 with CCMP and WPA3 with GCMP, that's the expected answer.`)}
${K.check({q:"A WLAN is set to WPA3-SAE only. A five-year-old laptop whose Wi-Fi driver supports only WPA2 tries to join with the correct passphrase. What happens?", o:["It joins with WPA2-Personal, because the passphrase is right","It can't connect — it has no SAE support, so the laptop and the WLAN share no key method","It joins with Enhanced Open instead","It joins, but without encryption"], a:1, why:"A client joins only with a method in common. WPA3-only offers just SAE (PMF required); the laptop has PSK only, so it can't connect (the lab's Windows says Can't connect to this network). Transition mode or a driver update fixes it."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Lagos airport lounge runs three SSIDs: LNG-Staff (WPA2 + WPA3 transition, PSK + SAE), LNG-Guest (Enhanced Open) and LNG-Kiosk (WPA3-SAE only, 6 GHz). A WPA3-capable staff tablet joins LNG-Staff, and a WPA2-only check-in kiosk tries LNG-Kiosk. Type what the tablet negotiates and whether the kiosk connects (yes/no).", fields:[{label:"Tablet's Authentication line", a:["WPA3-Personal","WPA3 Personal","WPA3-Personal (SAE)","SAE"]},{label:"Kiosk connects?", a:["no","No","NO"]}], why:"1. What is asked? The method each client ends up with. 2. Which rule? Client and WLAN use the best method they share; WPA3-only needs SAE and PMF. 3. Apply it: the tablet supports SAE and the transition WLAN offers it, so it uses WPA3-Personal. The kiosk has only PSK, and LNG-Kiosk offers only SAE (6 GHz can't offer WPA2 at all), so it can't connect — it needs a WPA3 driver, or a WLAN on 2.4/5 GHz that still offers PSK."})}
${K.job("“Since this morning none of the warehouse scanners can connect”",`
<p><b>The ticket.</b> Tuesday 07:10, an Abuja distribution centre: &ldquo;None of the 60 handheld scanners can join ABJ-Whse since the night shift. The supervisors' new laptops are fine. Trucks are waiting.&rdquo;</p>
<p><b>Questions first.</b> Every scanner fails (one 2017 model), while new laptops on the same SSID work, so the APs, controller and radio are fine. What changed? The change record says <i>&ldquo;Mon 22:00 — ABJ-WLC1 WLAN 4 ABJ-WHSE moved to WPA3 (SAE only) per the new security baseline.&rdquo;</i></p>
<p><b>Checks.</b> The controller's WLANs page:</p>
${K.out(`WLAN ID  Type  Profile Name  WLAN SSID   Admin Status  Security Policies
1        WLAN  ABJ-OFFICE    ABJ-Office  Enabled       [WPA2][Auth(802.1X)]
4        WLAN  ABJ-WHSE      ABJ-Whse    Enabled       [WPA3][Auth(SAE)]`, "The WLANs page as the lab draws it (lesson 5). The exact WPA3 policy text varies by AireOS release.")}
<p>MONITOR lists laptops on WLAN 4 and no scanners. A supervisor's <code>netsh wlan show interfaces</code> shows WPA3-Personal with <code>akm = 00-0f-ac:08</code>. The scanner's data sheet lists WPA/WPA2 only, with no SAE and no PMF.</p>
<p><b>Diagnosis.</b> Nothing is broken. The scanners and the WLAN share no key method. That's the compatibility table, live.</p>
<p><b>Fix</b> (emergency change, approved by the operations manager): WLAN 4 → Security → Layer 2: keep WPA3 Policy + SAE, add WPA2 Policy + PSK (same passphrase), PMF Optional → Apply. The scanners rejoin within a minute, and the laptops keep SAE.</p>
<p><b>Verify.</b> MONITOR shows the scanners. Security Policies reads <code>[WPA2][Auth(PSK)], [WPA3][Auth(SAE)]</code>. A test scan at dock 3 goes through.</p>
<p><b>What you say.</b> To the warehouse: &ldquo;Last night's security change was too strict for the scanners. They're back.&rdquo; To security: &ldquo;WPA3-only needs SAE and PMF on every client. I've set transition mode until the Q2 scanner refresh. Can the baseline template add a client-inventory step?&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;ABJ-WLC1 WLAN 4 set WPA3-SAE only Mon 22:00; 2017 scanners WPA2-only (no SAE/PMF) → no association. 07:40 WPA2+WPA3 transition (PSK + SAE, PMF Optional); scanners back 07:42, laptops still WPA3-Personal. Revisit after Q2 refresh. 35 min.&rdquo;</i></p>`)}

<h2>Configuring WPA2-PSK in the WLC GUI</h2>
${K.remember(`<b>The rule:</b> a new AireOS WLAN starts <b>Disabled</b>, on <b>management</b>, with <b>WPA2 + AES + 802.1X</b> (lesson 5). For WPA2-PSK: <b>untick 802.1X, tick PSK, enter the key</b> (8–63 ASCII or 64 hex), <b>Apply</b>, then <b>Status Enabled</b>, Apply, <b>Save Configuration</b>.`)}
<h3>Worked example: a staff WLAN for a Lagos design studio</h3>
<p>Lesson 5 built the dynamic interface <code>design40</code> (VLAN 40, Primary DHCP Server set). The studio wants SSID <code>LAG-Staff</code> on it with WPA2-PSK:</p>
${K.steps([
  ["WLANs → WLANs → Create New → Go", "The WLANs page from lesson 5. <b>Create New</b> is already chosen, so click <b>Go</b>."],
  ["WLANs &gt; New", "Type <b>WLAN</b>, Profile Name <code>STAFF</code>, SSID <code>LAG-Staff</code>, ID <b>3</b> (1–16, so the default AP group broadcasts it) → <b>Apply</b>. The page becomes <b>WLANs &gt; Edit 'STAFF'</b>, with Security Policies <code>[WPA2][Auth(802.1X)]</code> and Status unticked."],
  ["General tab", "Interface/Interface Group(G) → <code>design40</code>, leave Status unticked → <b>Apply</b>."],
  ["Security tab → Layer 2", "Layer 2 Security <b>WPA+WPA2</b>, keep <b>WPA2 Policy</b> and <b>AES</b>. Under Authentication Key Management <b>untick 802.1X</b> and <b>tick PSK</b>. PSK Format <b>ascii</b>, type the passphrase → <b>Apply</b>. The key stays masked and is never displayed back."],
  ["General tab again", "Tick <b>Status: Enabled</b> → <b>Apply</b>. The APs start beaconing <code>LAG-Staff</code>."],
  ["Save Configuration", "The top-right link saves the change so it survives a reboot."],
  ["Verify both ends", "The WLANs page shows Enabled and <code>[WPA2][Auth(PSK)]</code>. A laptop joins, and netsh shows WPA2-Personal / CCMP with <code>akm = 00-0f-ac:02</code>; ipconfig shows a VLAN 40 address."],
])}
${K.out(`WLAN ID  Type  Profile Name  WLAN SSID   Admin Status  Security Policies
1        WLAN  GUEST         LAG-Guest   Enabled       None
3        WLAN  STAFF         LAG-Staff   Enabled       [WPA2][Auth(PSK)]`, "The WLANs page afterwards. None = open; [WPA2][Auth(PSK)] = WPA2 with PSK key management.")}
<p>The same build on the AireOS command line, which you'll meet in configs and change records (not used in the lab):</p>
${K.out(`(Cisco Controller) >config wlan create 3 STAFF LAG-Staff
(Cisco Controller) >config wlan interface 3 design40
(Cisco Controller) >config wlan security wpa akm 802.1x disable 3
(Cisco Controller) >config wlan security wpa akm psk enable 3
(Cisco Controller) >config wlan security wpa akm psk set-key ascii Example-Studio-Key-2026 3
(Cisco Controller) >config wlan enable 3`, "Create (disabled), map, swap 802.1X for PSK, set the key, enable — then save config. The passphrase is an obvious example.")}
<p><b>On a Catalyst 9800</b> (lesson 3): Configuration &gt; Tags &amp; Profiles &gt; WLANs &gt; + Add. Security &gt; Layer2: WPA2 Policy, AES(CCMP128), PSK ticked, 802.1X unticked, then the key. The VLAN lives in a <b>policy profile</b>, joined to the WLAN by a <b>policy tag</b>.</p>
${K.mistake(`Leaving the default <b>802.1X</b> ticked. The WLAN then waits for RADIUS logins, and passphrase users get <i>Can't connect to this network</i>. (The lab refuses 802.1X and PSK together.) After every Apply, read the Security Policies string: it should say <code>Auth(PSK)</code>.`)}
${K.mistake(`Enabling before a key exists (the lab refuses), or forgetting to enable at all. A disabled WLAN isn't broadcast, so the laptop's list simply doesn't show it. Confirm Admin Status on the WLANs page.`)}
${K.tip(`Generate the passphrase (20+ random characters) and keep it in the team's password manager with the date it was set. To change it later, use a change window: disable the WLAN, set the new key, enable, then update every device. Forgotten devices are the next morning's tickets.`)}
${K.dodont([
  "Untick 802.1X, tick PSK, and read <code>[WPA2][Auth(PSK)]</code> back.",
  "Use WPA2-AES only, or WPA2+WPA3 where clients allow it.",
  "Keep the passphrase long, random and in a password manager; rotate it when people leave.",
  "Verify on a client: Authentication, Cipher, akm, an address, a ping.",
],[
  "Don't enable TKIP or WPA1 &ldquo;for old devices&rdquo; — it caps speeds and weakens the WLAN.",
  "Don't give guests the staff passphrase.",
  "Don't use Personal mode where one person must be locked out fast.",
  "Don't change a live key mid-day without warning anyone.",
])}

<h3>Hands-on: the Kano office that was &ldquo;open for now&rdquo;</h3>
<p>The auditor's finding. This WLAN is live, so it's a change, not a new build: take it offline, secure it, bring it back and prove strangers are out.</p>
${K.bench({id:"m9-secure-open", points:100, from:"CCNA · Module 9 · lesson 6", title:"Kano: secure an open office WLAN with WPA2-PSK", viewBox:"0 0 800 440",
  intro:"<b>Ticket:</b> &ldquo;The auditor joined our office Wi-Fi from the car park — no password.&rdquo; <b>Build:</b> KN-WLC1 (management 10.30.99.5) has WLAN 1 <code>KN-OFFICE</code>, SSID <code>KN-Office</code>, on interface <code>staff</code> (VLAN 20; gateway and DHCP KN-R1 10.30.20.1), Layer 2 Security <b>None</b>. KN-AP1 has joined. ACCT-LAP1 is staff; nobody knows whose UNKNOWN-PC is. Use the <b>Controller GUI</b> button, and each laptop's <b>Wi-Fi</b> button and Command Prompt. <b>Lab notes:</b> every laptop is in range (no RF); every Apply is kept, so Save Configuration isn't needed; no attacks are simulated.",
  devices:[
    {id:"r1", kind:"router", label:"KN-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname KN-R1","no ip domain-lookup","int g0/0","no shut","int g0/0.10","encapsulation dot1Q 10","ip address 10.30.10.1 255.255.255.0","int g0/0.20","encapsulation dot1Q 20","ip address 10.30.20.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.30.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.30.10.1 10.30.10.9","ip dhcp excluded-address 10.30.20.1 10.30.20.9","ip dhcp pool APS","network 10.30.10.0 255.255.255.0","default-router 10.30.10.1","option 43 hex f104.0a1e.6305","exit","ip dhcp pool STAFF","network 10.30.20.0 255.255.255.0","default-router 10.30.20.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KN-SW1", x:200, y:150, config:e=>{ ["en","conf t","hostname KN-SW1","vlan 10","name APS","vlan 20","name STAFF","vlan 99","name MGMT","exit","int g0/1","switchport mode trunk","int g0/2","switchport mode trunk","int g0/3","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"KN-WLC1", x:560, y:20, wlc:{ mgmt:{ip:"10.30.99.5", mask:"255.255.255.0", gw:"10.30.99.1", vlan:99}, ifaces:{ staff:{vlan:20, ip:"10.30.20.5", mask:"255.255.255.0", gw:"10.30.20.1", dhcp:"10.30.20.1"} }, wlans:{ 1:{id:1, profile:"KN-OFFICE", ssid:"KN-Office", enabled:true, iface:"staff", security:"none", cipher:"aes", psk:null, pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }},
    {id:"ap", kind:"ap", label:"KN-AP1", x:240, y:280},
    {id:"lap", kind:"laptop", label:"ACCT-LAP1", x:440, y:320, dhcp:true, wifi:{ssid:"KN-Office"}},
    {id:"vis", kind:"laptop", label:"UNKNOWN-PC", x:620, y:320, dhcp:true, wifi:{ssid:"KN-Office"}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"} ],
  tasks:[
    {text:"See what the auditor saw: on ACCT-LAP1's Command Prompt run <code>netsh wlan show interfaces</code> and read the Authentication and Cipher lines. Then open the controller's <b>MONITOR</b> page — how many clients (by MAC address), and is UNKNOWN-PC one of them?", done:B=>Bench.tried(B,"lap",/netsh\s+wlan\s+show\s+interfaces?/i)},
    {text:"Start the change: <b>WLANs</b> → click WLAN ID <b>1</b> → <b>General</b> tab → untick <b>Status Enabled</b> → <b>Apply</b>. Both laptops drop off, which is expected in a change window", done:B=>B.devs.wlc.wlc.wlans[1].enabled===false},
    {text:"<b>Security</b> tab → Layer 2 Security <b>WPA+WPA2</b>; keep WPA2 Policy and AES; under Authentication Key Management tick <b>PSK</b> and make sure 802.1X is unticked; PSK Format <b>ascii</b>. The office manager suggests <code>Kn2026!</code> — try it and read the refusal. Then use <code>Kano-Ledger-2026!</code> (a lab example; at work, generate a long random one) → <b>Apply</b>", done:B=>{ const w=B.devs.wlc.wlc.wlans[1]; return w.security==="wpa2-psk" && !!w.psk; }},
    {text:"<b>General</b> tab → tick <b>Status Enabled</b> → <b>Apply</b>. Back on the WLANs page, Security Policies should read <code>[WPA2][Auth(PSK)]</code>", done:B=>Bench.wlanUp(B,"wlc","KN-Office") && B.devs.wlc.wlc.wlans[1].security==="wpa2-psk"},
    {text:"ACCT-LAP1 → <b>Wi-Fi</b>: connect to KN-Office with the new key (type it wrong once to see Windows' message). Then <code>netsh wlan show interfaces</code> again — Authentication, Cipher and the akm number? — and <code>ping 10.30.20.1</code>, the gateway", done:B=>Bench.wifiAssoc(B,"lap") && B.devs.lap.wifiAt.auth==="WPA2-Personal" && Bench.pinged(B,"lap","10.30.20.1")},
    {text:"And UNKNOWN-PC? Open its Wi-Fi panel (it still remembers KN-Office, with no key) and run <code>netsh wlan show interfaces</code> on it. Without the key it stays outside: that's authentication doing its job", done:B=>!Bench.wifiAssoc(B,"vis") && Bench.tried(B,"vis",/netsh\s+wlan\s+show\s+interfaces?/i) && B.devs.wlc.wlc.wlans[1].security==="wpa2-psk" && Bench.wlanUp(B,"wlc","KN-Office")},
  ],
  win:"KN-Office is now WPA2-PSK: the WLANs page shows [WPA2][Auth(PSK)], ACCT-LAP1 reports WPA2-Personal / CCMP (akm 00-0f-ac:02) with a VLAN 20 address and a working gateway, and UNKNOWN-PC — which had a 10.30.20.x address an hour ago — is disconnected. The 7-character key was refused (8–63 ASCII). For the ticket: the key lives in the password manager, and staff who leave mean a key change, which is the argument for Enterprise logins next year.",
  solve:[["pc","lap","netsh wlan show interfaces"],["wlc","wlc","wlanset",1,{enabled:false}],["wlc","wlc","wlanset",1,{security:"wpa2-psk", pskFormat:"ascii", psk:"Kano-Ledger-2026!"}],["wlc","wlc","wlanset",1,{enabled:true}],
    ["wifi","lap","KN-Office","Kano-Ledger-2026!"],["pc","lap","netsh wlan show interfaces"],["pc","lap","ping 10.30.20.1"],["pc","vis","netsh wlan show interfaces"]]})}
${K.hint(`Task 3: <code>Kn2026!</code> has 7 characters; the rule is 8–63 ASCII or 64 hex. Task 5: a wrong key fails message 2's MIC, and Windows says <i>The network security key isn't correct</i>.`)}
${K.check({q:"After you Apply WPA2-PSK on a WLAN and enable it, the WLANs page shows Security Policies [WPA2][Auth(802.1X)]. What does that tell you?", o:["The change worked; 802.1X is how PSK is labelled","PSK was not ticked (or 802.1X not unticked) — the WLAN still expects RADIUS logins","The WLAN is disabled","The key was too short"], a:1, why:"Security Policies shows the key management in force. Auth(802.1X) is the untouched default, so passphrase clients get Can't connect to this network. Untick 802.1X, tick PSK, Apply, and look for [WPA2][Auth(PSK)]."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A Port Harcourt hotel's staff WLAN (WPA2-PSK, enabled) needs a new passphrase after a manager left. Put the change-window steps in the right order.", items:["Tell users when the Wi-Fi will drop and that the new key comes from IT","WLANs → the WLAN → General: untick Status Enabled → Apply","Security → Layer 2: type the new key in the PSK field → Apply","General: tick Status Enabled → Apply, then Save Configuration","Update each device with the new key and check netsh / the MONITOR page"], why:"1. What is asked? A safe order for changing a live PSK. 2. Which rule? A key change disconnects every client, so warn first, change the WLAN while it's disabled, re-enable and save, then bring every device back and verify. 3. Apply it: users first, then disable → key → enable + save, then devices. (And a manager leaving is exactly when Enterprise logins would have needed no key change at all.)"})}

<h2>Moving to WPA3: transition mode on the controller</h2>
${K.remember(`<b>The rule:</b> Layer 2 Security <b>WPA2+WPA3</b>: <b>WPA2 Policy + PSK</b> for old clients, <b>WPA3 Policy + SAE</b> for new ones. Both = <b>transition</b> (one passphrase, PMF Optional). WPA3 + SAE alone = <b>WPA3-only</b> (PMF Required): clients without SAE can't join.`)}
<p>On AireOS 8.10, Layer 2 Security <b>WPA2+WPA3</b> adds a Security Type (Personal or Enterprise) and a policy choice: WPA3 alone, or WPA2 and WPA3. The lab draws these as <b>WPA2 Policy</b> and <b>WPA3 Policy</b> tick boxes with PSK and SAE rows; exact labels vary by release, so check your release's guide. Personal is limited to CCMP128 (AES). <b>PMF</b>: WPA3-only sets it to Required; for transition you choose Optional (the lab's GUI omits PMF). 8.10 doesn't support fast transition (802.11r) with SAE, so leave fast transition off there.</p>
${K.when([
  ["WPA2-PSK only","Some clients can't do WPA3 and transition isn't tested yet","Works with everything since 2006","WPA3 clients are the majority — SAE goes unused"],
  ["WPA2+WPA3 transition","Mixed estate: new WPA3 laptops, older devices","New clients get SAE; old ones still join","6 GHz, or where a WPA2 fallback isn't acceptable"],
  ["WPA3-SAE only","Every client supports SAE and PMF — checked, not assumed","Full WPA3, PMF required","Any client is WPA2-only"],
], "WPA2, transition or WPA3-only?")}
<h3>Hands-on: a Port Harcourt clinic moves to WPA3 without leaving the wards behind</h3>
<p>A site already on WPA2-PSK: see what each choice does to an old and a new laptop before settling on transition mode.</p>
${K.bench({id:"m9-wpa3-transition", points:100, from:"CCNA · Module 9 · lesson 6", title:"Port Harcourt: from WPA2 to WPA2+WPA3 transition — old and new laptops both join", viewBox:"0 0 800 440",
  intro:"<b>Ticket:</b> &ldquo;The doctors' new laptops support WPA3 and security wants WPA3 on PH-Clinical. The ward laptops are WPA2-only and must keep working until next year.&rdquo; <b>Build:</b> PH-WLC1 (management 10.50.99.10) has WLAN 1 <code>CLINICAL</code>, SSID <code>PH-Clinical</code>, WPA2-PSK, on interface <code>clinical</code> (VLAN 30; gateway and DHCP PH-R1 10.50.30.1). WARD-OLD is WPA2-only; DOC-NEW supports WPA3 (see its Wi-Fi panel). Both use the passphrase <code>Ward-Rounds-Example-26</code> (a lab example). <b>Lab note:</b> the GUI omits PMF; a real controller needs it Required for WPA3-only and Optional for transition.",
  devices:[
    {id:"r1", kind:"router", label:"PH-R1", x:20, y:20, config:e=>{ ["en","conf t","hostname PH-R1","no ip domain-lookup","int g0/0","no shut","int g0/0.10","encapsulation dot1Q 10","ip address 10.50.10.1 255.255.255.0","int g0/0.30","encapsulation dot1Q 30","ip address 10.50.30.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.50.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.50.10.1 10.50.10.9","ip dhcp excluded-address 10.50.30.1 10.50.30.9","ip dhcp pool APS","network 10.50.10.0 255.255.255.0","default-router 10.50.10.1","option 43 hex f104.0a32.630a","exit","ip dhcp pool CLINICAL","network 10.50.30.0 255.255.255.0","default-router 10.50.30.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"PH-SW1", x:200, y:150, config:e=>{ ["en","conf t","hostname PH-SW1","vlan 10","name APS","vlan 30","name CLINICAL","vlan 99","name MGMT","exit","int g0/1","switchport mode trunk","int g0/2","switchport mode trunk","int g0/3","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wlc", kind:"wlc", label:"PH-WLC1", x:560, y:20, wlc:{ mgmt:{ip:"10.50.99.10", mask:"255.255.255.0", gw:"10.50.99.1", vlan:99}, ifaces:{ clinical:{vlan:30, ip:"10.50.30.5", mask:"255.255.255.0", gw:"10.50.30.1", dhcp:"10.50.30.1"} }, wlans:{ 1:{id:1, profile:"CLINICAL", ssid:"PH-Clinical", enabled:true, iface:"clinical", security:"wpa2-psk", cipher:"aes", psk:"Ward-Rounds-Example-26", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }},
    {id:"ap", kind:"ap", label:"PH-AP-W2", x:240, y:280},
    {id:"old", kind:"laptop", label:"WARD-OLD", x:440, y:320, dhcp:true, wifi:{ssid:"PH-Clinical", key:"Ward-Rounds-Example-26", wpa3:false}},
    {id:"new", kind:"laptop", label:"DOC-NEW", x:620, y:320, dhcp:true, wifi:{ssid:"PH-Clinical", key:"Ward-Rounds-Example-26", wpa3:true}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"} ],
  tasks:[
    {text:"Baseline: on DOC-NEW run <code>netsh wlan show interfaces</code>. Its adapter supports WPA3, so which Authentication did it use, and which akm number?", done:B=>Bench.tried(B,"new",/netsh\s+wlan\s+show\s+interfaces?/i)},
    {text:"Try what security asked for, WPA3 only: <b>WLANs</b> → <b>1</b> → <b>Security</b> → Layer 2 Security <b>WPA2+WPA3</b>; untick <b>WPA2 Policy</b> and tick <b>WPA3 Policy</b>; untick <b>PSK</b> and tick <b>SAE</b> (the passphrase stays) → <b>Apply</b>. Which laptop drops? Open WARD-OLD's Wi-Fi panel and read the message", done:B=>B.devs.wlc.wlc.wlans[1].security==="wpa3-sae" && !Bench.wifiAssoc(B,"old") && Bench.wifiAssoc(B,"new") && B.devs.new.wifiAt.auth==="WPA3-Personal"},
    {text:"Read the evidence before you change anything back: DOC-NEW <code>netsh wlan show interfaces</code> (Authentication now? akm?), and WARD-OLD <code>netsh wlan show networks</code> — what does PH-Clinical now demand?", done:B=>Bench.tried(B,"old",/netsh\s+wlan\s+show\s+networks/i)},
    {text:"Transition mode: back on Security → Layer 2, tick <b>WPA2 Policy</b> and <b>PSK</b> as well, so WPA2 + WPA3 and PSK + SAE share one passphrase → <b>Apply</b>. Check the WLANs page's Security Policies column", done:B=>B.devs.wlc.wlc.wlans[1].security==="wpa2-wpa3" && Bench.wifiAssoc(B,"old") && Bench.wifiAssoc(B,"new")},
    {text:"Prove it for the ticket: <code>netsh wlan show interfaces</code> on both laptops (which one uses SAE, akm 00-0f-ac:08?) and <code>ping 10.50.30.1</code> from WARD-OLD", done:B=>B.devs.wlc.wlc.wlans[1].security==="wpa2-wpa3" && Bench.wifiAssoc(B,"old") && B.devs.old.wifiAt.auth==="WPA2-Personal" && Bench.wifiAssoc(B,"new") && B.devs.new.wifiAt.auth==="WPA3-Personal" && Bench.tried(B,"old",/netsh\s+wlan\s+show\s+interfaces?/i) && Bench.pinged(B,"old","10.50.30.1")},
  ],
  win:"PH-Clinical runs WPA2+WPA3 transition: the WLANs page shows [WPA2][Auth(PSK)], [WPA3][Auth(SAE)]; DOC-NEW negotiates WPA3-Personal (akm 00-0f-ac:08) and WARD-OLD WPA2-Personal (akm 00-0f-ac:02), both with CCMP and a VLAN 30 address. You also saw why WPA3-only wasn't ready: WARD-OLD got Can't connect to this network, because it and the WLAN shared no key method. Next year, when the ward laptops are replaced, untick WPA2 Policy and PSK (and set PMF Required).",
  solve:[["pc","new","netsh wlan show interfaces"],["wlc","wlc","wlanset",1,{security:"wpa3-sae"}],["pc","new","netsh wlan show interfaces"],["pc","old","netsh wlan show networks"],
    ["wlc","wlc","wlanset",1,{security:"wpa2-wpa3"}],["pc","new","netsh wlan show interfaces"],["pc","old","netsh wlan show interfaces"],["pc","old","ping 10.50.30.1"]]})}
${K.hint(`Task 1: the best shared method wins, and on a WPA2-only WLAN that's WPA2. Task 2: WARD-OLD has PSK only; WPA3-only offers SAE only. Task 4: both policies, both key methods, one passphrase.`)}
${K.check({q:"A WLAN is in WPA2+WPA3 transition mode. Which statement is true?", o:["Each client must be given a different passphrase for PSK and for SAE","WPA3-capable clients use SAE and WPA2-only clients use PSK, with the same passphrase; PMF is Optional so WPA2 clients without it can join","Every client is forced to use SAE","Transition mode is required on 6 GHz"], a:1, why:"Both AKMs on one SSID, one passphrase. PMF Required would lock out WPA2 clients without it, so it's Optional. 6 GHz allows only WPA3 or Enhanced Open."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Kano university controller has three WLANs: UNI-Staff (WPA2 + WPA3 transition), UNI-Labs (WPA3-SAE only) and UNI-Legacy (WPA2-PSK). A WPA3-capable lecturer laptop and a WPA2-only lab microscope controller are on campus. Which two statements are true? (Choose two.)", o:["The microscope controller can join UNI-Staff using PSK","The lecturer laptop on UNI-Legacy will use WPA3-Personal","The microscope controller can join UNI-Labs if its passphrase is right","The lecturer laptop on UNI-Labs authenticates with SAE","UNI-Staff needs two different passphrases"], a:[0,3], why:"1. What is asked? Which method each client ends up with on each WLAN. 2. Which rule? They need one method in common, and the best common method wins. 3. Apply it: transition offers PSK, so the WPA2-only device joins UNI-Staff. WPA3-only offers SAE, so the laptop joins UNI-Labs with SAE and the microscope can't (a right passphrase doesn't help without SAE). On UNI-Legacy only PSK exists, so the laptop uses WPA2-Personal. Transition uses one passphrase for both."})}
${K.case("The hotel that shared one password",`
<p><b>The situation.</b> A 200-room Victoria Island hotel had one SSID, <code>VI-Hotel</code>, WPA2-Personal, with the passphrase printed on every key-card sleeve. Guests, front-desk PCs, card terminals and housekeeping tablets shared it on one VLAN.</p>
<p><b>What the team saw.</b> The controller's rogue list showed <code>VI-Hotel</code> from a BSSID they didn't own, near the lobby café, and guests reported sessions &ldquo;asking them to log in again&rdquo;. With a printed PSK, any guest could put up a convincing twin, and key holders could in principle decrypt each other. The card terminals sat on the same VLAN as 400 strangers' phones.</p>
<p><b>The redesign</b> (three WLANs on three VLANs, lesson 5's interfaces):</p>
<div class="tablewrap"><table>
<tr><th>WLAN</th><th>Security</th><th>Why</th></tr>
<tr><td><code>VI-Staff</code></td><td>Enterprise: 802.1X to RADIUS, clients checking the server certificate</td><td>A login per person; a twin can't fake the certificate</td></tr>
<tr><td><code>VI-Devices</code></td><td>WPA2+WPA3 transition, long PSK only IT knows, VLAN with an ACL (Module 8) to the payment and housekeeping servers</td><td>Terminals and tablets that can't do 802.1X</td></tr>
<tr><td><code>VI-Guest</code></td><td>Enhanced Open + captive portal, peer-to-peer blocking (lesson 5), internet-only VLAN</td><td>Guests encrypted, nothing to print, can't reach each other</td></tr>
</table></div>
<p><b>The outcome.</b> The twin was a guest-room travel router; rogue alerts now page the duty engineer. The lessons: <b>separate users by who they are</b>, give each group the strongest method its devices support, and treat &ldquo;one password for everyone&rdquo; as none at all.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Who shares what secret, where the check happens, what happens when someone leaves — and an example of each.`)}
${K.reveal("“What's the difference between WPA2-Personal and WPA2-Enterprise?”",`<p>"Both use AES-CCMP and the 4-way handshake. The difference is where the PMK comes from. In Personal mode everyone shares one passphrase: when someone leaves you re-key every device, and key holders can in principle decrypt each other. In Enterprise mode each user logs in with 802.1X: the laptop is the supplicant, the controller the authenticator, and RADIUS (ISE, say) checks the credentials with EAP-TLS or PEAP. Each session gets its own key, and disabling one account removes one person. I'd keep Personal for devices that can't do 802.1X, on their own WLAN and VLAN."</p>`)}
${K.hint(`SAE, PMF, 192-bit, Enhanced Open — and how you'd actually roll it out.`)}
${K.reveal("“What does WPA3 improve over WPA2, and how would you introduce it?”",`<p>"SAE replaces the PSK step, so a captured exchange can't be guessed offline, and sessions get forward secrecy. PMF becomes mandatory, so forged deauthentication is ignored. Enterprise gains a 192-bit mode, and Enhanced Open encrypts open guest networks. To roll it out I'd inventory clients first, because a WPA2-only device can't join a WPA3-only WLAN. Then transition mode with PMF Optional, watch who still uses WPA2, replace or separate them, and finally WPA3-only with PMF Required. 6 GHz is WPA3 from day one."</p>`)}
${K.hint(`The defaults you have to change, the order of the steps, and evidence from both ends.`)}
${K.reveal("“Walk me through configuring a WPA2-PSK WLAN on a Cisco WLC and proving it works.”",`<p>"WLANs, Create New, Go: profile, SSID, an ID from 1 to 16, Apply. It's created disabled, on the management interface, with WPA2-AES and 802.1X. On General I map the dynamic interface. On Security, Layer 2, I keep WPA2 and AES, untick 802.1X, tick PSK and enter a long random key (8–63 ASCII), Apply. Then Status Enabled, Apply, Save Configuration. Proof: the WLANs page shows Enabled and [WPA2][Auth(PSK)]. On a client, netsh shows WPA2-Personal, CCMP and akm 00-0f-ac:02, ipconfig shows the right VLAN's address, and the gateway pings."</p>`)}

${K.recap([
  "Wi-Fi security has two jobs: authentication (who may join) and encryption + integrity (nobody else reads or changes frames). Open WLANs do neither.",
  "Threats, and what stops them: eavesdropping (encryption), rogue APs (wired-port control, rogue detection), evil twins (802.1X certificate checks, SAE), deauthentication (PMF), offline guessing (long keys, SAE).",
  "WEP = RC4, static key, 24-bit IV (broken). WPA = TKIP (deprecated). WPA2 = AES-CCMP + 4-way handshake. WPA3 = SAE + mandatory PMF.",
  "The 4-way handshake turns the PMK into a fresh PTK (and the GTK) without sending it; a wrong passphrase fails at message 2's MIC.",
  "Personal = one shared passphrase (8–63 ASCII or 64 hex). Enterprise = 802.1X logins checked by RADIUS, revocable per person.",
  "WPA3: SAE (no offline guessing, forward secrecy), PMF required, 192-bit Enterprise (GCMP-256); Enhanced Open for guests; 6 GHz = WPA3/OWE only.",
  "Client and WLAN use the best shared method: WPA2-only can't join WPA3-only; transition (PSK + SAE, one passphrase, PMF Optional) serves both.",
  "AireOS WPA2-PSK: new WLAN (disabled, 802.1X) → interface → L2: untick 802.1X, tick PSK, key → Apply → Enable → Save; check [WPA2][Auth(PSK)] and netsh.",
])}
${K.next(`<b>Lesson 7 — Troubleshooting wireless, and the Module 9 challenge.</b> One method for the whole module (AP joined? WLAN enabled? security matching? address from the right VLAN?), then a broken office with several independent faults, including a PSK mismatch and a WPA3-only WLAN with WPA2 laptops.`)}
`,
quiz:[
  {lvl:1, q:"Which encryption does WPA2 use?", o:["RC4 with a static key","TKIP","AES in CCMP mode","SAE"], a:2, why:"WPA2 (IEEE 802.11i) uses AES-CCMP: AES encryption plus an AES-based integrity check. RC4 with a static key is WEP, TKIP is WPA, and SAE is WPA3-Personal's authentication/key exchange, not a cipher."},
  {lvl:1, type:"match", q:"Match each Wi-Fi security generation with its headline technology.", pairs:[["WEP","RC4 with one static shared key"],["WPA","TKIP"],["WPA2","AES-CCMP"],["WPA3-Personal","SAE"]], why:"Really Tired Cats Sleep: RC4 (WEP), TKIP (WPA), CCMP (WPA2), SAE (WPA3). Each fixed the previous generation's weakness: TKIP patched WEP on old hardware, CCMP replaced RC4 with AES, SAE removed offline passphrase guessing."},
  {lvl:1, type:"fill", q:"On a Cisco WLC, an ASCII pre-shared key for WPA2-PSK must be between how many characters?", fields:[{label:"Minimum", a:["8","eight"]},{label:"Maximum", a:["63","sixty-three","sixty three"]}], why:"8 to 63 ASCII characters, or exactly 64 hexadecimal digits (the 256-bit key itself). The lab refuses anything outside that rule, as the controller does."},
  {lvl:1, q:"What does PMF (802.11w) protect against?", o:["Offline guessing of the passphrase","Forged management frames such as deauthentication and disassociation","Co-channel interference","Clients joining the wrong VLAN"], a:1, why:"Protected Management Frames add an integrity check to management frames once keys exist, so a forged 'you are disconnected' frame is ignored. It is optional in WPA2 and mandatory in WPA3. Offline guessing is SAE's job."},
  {lvl:2, type:"multi", q:"Which two statements about WPA2-Enterprise are true? (Choose two.)", o:["Each user or device authenticates with its own credentials using 802.1X/EAP","A RADIUS server checks the credentials, and the controller acts as the authenticator","Every client types the same passphrase","It needs no server, because the AP stores all the user accounts","It uses TKIP instead of AES"], a:[0,1], why:"Enterprise mode is 802.1X over the air: supplicant (client), authenticator (AP/WLC), authentication server (RADIUS, such as ISE or NPS). A shared passphrase is Personal mode; WPA2-Enterprise uses AES-CCMP like WPA2-Personal."},
  {lvl:2, type:"order", q:"Put the AireOS GUI steps for a new WPA2-PSK WLAN in order.", items:["WLANs → Create New → Go","Enter Type, Profile Name, SSID and ID → Apply","General tab: choose the interface → Apply","Security → Layer 2: untick 802.1X, tick PSK, enter the key → Apply","General tab: tick Status Enabled → Apply","Save Configuration"], why:"Create the WLAN first (it starts disabled, with 802.1X). Map it, change the key management to PSK with a key, then enable it — the lab refuses to enable a PSK WLAN with no key — and save so it survives a reboot."},
  {lvl:2, q:"Based on the exhibit from a laptop, which statement is true?", ex:"C:\\Users\\tolu>netsh wlan show interfaces\n\nThere is 1 interface on the system: \n\n    ...\n    State                  : connected\n    SSID                   : ABJ-Staff\n    Connected Akm-cipher   : [ akm = 00-0f-ac:08, cipher =  00-0f-ac:04 ]\n    Network type           : Infrastructure\n    Radio type             : 802.11ac\n    Authentication         : WPA3-Personal\n    Cipher                 : CCMP\n    ...", o:["The laptop authenticated with 802.1X to a RADIUS server","The laptop used SAE (WPA3-Personal) and its traffic is encrypted with AES-CCMP","The WLAN must be WPA3-only, because the laptop used WPA3","The laptop is using TKIP"], a:1, why:"AKM suite 8 is SAE and cipher suite 4 is CCMP, matching 'WPA3-Personal' and 'CCMP'. 802.1X would show akm :01 and WPA2/WPA3-Enterprise. A transition-mode WLAN also gives a WPA3-capable laptop SAE, so the exhibit can't tell you the WLAN is WPA3-only."},
  {lvl:2, q:"A WLAN is changed from WPA2-PSK to WPA3-SAE only. Laptops bought last year still connect, but older laptops whose drivers support only WPA2 show 'Can't connect to this network'. What is the least disruptive fix that keeps WPA3 for the new laptops?", o:["Change the passphrase","Set Layer 2 Security to WPA2+WPA3 with both PSK and SAE (transition mode, PMF Optional)","Enable TKIP","Set the WLAN back to open and add MAC filtering"], a:1, why:"The old laptops have no SAE, so they share no key method with a WPA3-only WLAN. Transition mode offers PSK to them and SAE to the new laptops on the same SSID, with one passphrase. TKIP or an open WLAN would weaken everyone."},
  {lvl:2, q:"An engineer created WLAN 5 for a PSK network and clicked Apply on the New page only. Based on the exhibit, why can't any laptop join?", ex:"WLAN ID  Type  Profile Name  WLAN SSID    Admin Status  Security Policies\n1        WLAN  CORP          Corp-WiFi    Enabled       [WPA2][Auth(PSK)]\n5        WLAN  LAB           Lab-WiFi     Disabled      [WPA2][Auth(802.1X)]", o:["The SSID is too long","WLAN 5 is still Disabled and still expects 802.1X logins — untick 802.1X, tick PSK with a key, Apply, then enable it","WLAN IDs above 4 are never broadcast","WLAN 1 and WLAN 5 can't both use WPA2"], a:1, why:"A new AireOS WLAN is created disabled with WPA2 + 802.1X (the default). The exhibit shows both defaults untouched. The default AP group broadcasts IDs 1–16, so ID 5 is fine once enabled; several WLANs can use WPA2."},
  {lvl:2, q:"What is Wi-Fi Enhanced Open (OWE)?", o:["WPA3-Personal with a shorter passphrase","Encryption without authentication: each client on an open network gets its own keys, but nobody is authenticated","A way to hide the SSID","802.1X without a RADIUS server"], a:1, why:"OWE runs a Diffie–Hellman exchange at association, so each client's traffic on a password-less network is encrypted. It proves nothing about who anyone is, or that the AP is genuine, so it suits guest networks."},
  {lvl:2, type:"match", q:"Match each Wi-Fi threat with the control that addresses it.", pairs:[["Forged deauthentication frames knocking clients off","PMF"],["Offline guessing of a captured WPA2 handshake","SAE"],["An employee's home router plugged into a desk socket","Port security / 802.1X on wired ports"],["Guests on an open network reading each other's traffic","Enhanced Open (OWE)"]], why:"PMF authenticates management frames; SAE gives an eavesdropper nothing to test guesses against; a rogue AP needs a wired port, so control the ports; OWE gives each open-network client its own keys."},
  {lvl:3, q:"A 150-room hotel uses one WPA2-Personal SSID for guests, front-desk PCs and card terminals, with the passphrase printed on key cards. The rogue list shows the hotel's SSID from an unknown BSSID near the lobby. Which redesign best fixes the underlying problem?", o:["Change the printed passphrase every week","Hide the SSID and add MAC filtering","Separate by user type: staff on 802.1X Enterprise with certificate checks, devices on their own PSK WLAN and VLAN, guests on Enhanced Open with a captive portal on a guest VLAN","Move everyone to WPA3-SAE with the same printed passphrase"], a:2, why:"The root cause is one shared secret given to everyone. Any key holder can build a convincing twin and, with WPA2-PSK, decrypt others. Splitting by who the users are gives staff per-person logins (a twin can't fake the RADIUS certificate), keeps devices apart, and gives guests encryption without a shared password. Rotating, hiding or upgrading a printed key keeps the same problem."},
  {lvl:3, q:"An IT manager at a 40-person Lagos office left last week and knew the WPA2-PSK passphrase. Security asks what an ex-employee with that passphrase could still do from the car park, and what removes the risk for good. Which answer is right?", o:["Nothing — WPA2 encrypts everything with AES","Join the WLAN, and decrypt other users' traffic if they capture those users' handshakes; change the key now, and move staff to 802.1X Enterprise so leavers are a disabled account","Only see the SSID; changing the SSID fixes it","Join the WLAN only if their MAC address is still in the controller"], a:1, why:"With WPA2-PSK, the passphrase is membership, and since the PTK comes from the PMK plus values sent in the clear, a key holder who captures a client's handshake can derive its keys. A key change removes them today but disconnects every device; Enterprise ties access to an account, so the next leaver costs nothing to remove."},
  {lvl:3, type:"multi", q:"A WLAN runs WPA2+WPA3 transition mode on 2.4 and 5 GHz. Which two statements are true? (Choose two.)", o:["A WPA2-only laptop joins using PSK with the WLAN's passphrase","A WPA3-capable laptop joins using SAE","PMF must be Required, so WPA2 laptops without PMF are refused","SAE and PSK need different passphrases","The same WLAN can also be offered on 6 GHz unchanged"], a:[0,1], why:"Transition mode offers both key methods with one passphrase; each client uses the best one it shares with the WLAN. PMF is Optional precisely so WPA2 clients without it can join. 6 GHz allows only WPA3 or Enhanced Open, so a WLAN that still offers WPA2-PSK can't go there as-is."},
  {lvl:3, q:"A warehouse WLAN was set up years ago as WPA with TKIP only 'for the old scanners'. The scanners have since been replaced, and new 802.11ac laptops on it never exceed 54 Mbps although they show strong signal. What explains it, and what is the fix?", o:["The AP is on a 2.4 GHz channel that overlaps; change channel","802.11n/ac high-throughput rates aren't allowed with TKIP, so the laptops fall back to 802.11a/g rates; move the WLAN to WPA2 with AES (or WPA2+WPA3)","TKIP encrypts more slowly than AES on modern CPUs; add more APs","The laptops need a longer passphrase"], a:1, why:"The 802.11n and later standards permit their high-throughput rates only with CCMP (AES), not WEP or TKIP, so a TKIP-only WLAN holds modern clients to legacy rates. With the old scanners gone, the reason for TKIP is gone too: WPA2-AES fixes both the speed and the security."},
],
cards:[
  {f:"The two jobs of Wi-Fi security", b:"Authentication: may this device join (and is the network real)? Encryption + integrity: can anyone else in range read or change the frames? Open WLANs do neither; radio reaches everyone in range."},
  {f:"WEP", b:"1997. RC4 with one static 40- or 104-bit key shared by everyone, a 24-bit IV sent in clear (repeats quickly), CRC-32 integrity (forgeable). Broken; deprecated 2004."},
  {f:"WPA (TKIP)", b:"2003 Wi-Fi Alliance stopgap for WEP hardware: TKIP = RC4 with a new key per frame, replay counter, Michael MIC. Introduced Personal (PSK) and Enterprise (802.1X). TKIP is deprecated and blocks 802.11n/ac rates."},
  {f:"WPA2", b:"2004, IEEE 802.11i. AES-CCMP (Cisco: AES; Windows: CCMP). 4-way handshake turns the PMK into per-session keys. Personal (PSK) or Enterprise (802.1X + RADIUS)."},
  {f:"4-way handshake", b:"1 ANonce (AP) · 2 SNonce + MIC (client) · 3 GTK + MIC (AP) · 4 ACK. Both sides derive the PTK from PMK + both nonces + both MACs; the PMK never crosses the air. Wrong passphrase = MIC fails at message 2."},
  {f:"PSK rules", b:"8–63 ASCII characters or exactly 64 hex digits; case-sensitive. PMK = passphrase + SSID through a slow hash. Never shown back by the WLC. Changing it disconnects every client."},
  {f:"Personal vs Enterprise", b:"Personal: one shared secret; leaks with people; key holders can decrypt each other (WPA2). Enterprise: 802.1X per user/device, RADIUS (ISE/NPS) checks it, a key per session, revoke one account."},
  {f:"WPA3-Personal (SAE)", b:"Simultaneous Authentication of Equals: password-based exchange that resists offline guessing and gives forward secrecy. Then the 4-way handshake and AES-CCMP. Windows: WPA3-Personal, akm 00-0f-ac:08."},
  {f:"PMF (802.11w)", b:"Protected Management Frames: deauthentication/disassociation frames carry a MIC, so forged ones are ignored. Optional in WPA2, required in WPA3. WLC setting: Disabled / Optional / Required."},
  {f:"WPA3-Enterprise 192-bit", b:"Optional high-security mode: GCMP-256 encryption, HMAC-SHA-384, 384-bit elliptic-curve keys. Every part of the chain must support it. (Exam guides often pair WPA3 with GCMP.)"},
  {f:"Enhanced Open (OWE)", b:"Encryption without authentication for open networks: a Diffie–Hellman exchange at association gives each client its own keys. Doesn't prove the AP is genuine. For guest Wi-Fi, often with a captive portal."},
  {f:"Transition mode", b:"WPA2+WPA3 on one SSID: PSK + SAE with the same passphrase, PMF Optional. WPA3 clients use SAE, WPA2 clients PSK. WPA3-only = SAE + PMF Required: WPA2-only clients can't join. 6 GHz: WPA3/OWE only."},
  {f:"Which client joins which WLAN?", b:"They must share a method; the best shared one wins. WPA2-only client: joins WPA2-PSK and transition, not WPA3-only. WPA3 client: joins all three (WPA2 on a WPA2-only WLAN)."},
  {f:"WPA2-PSK in the AireOS GUI", b:"WLANs → Create New → Go → profile/SSID/ID → Apply (disabled, 802.1X) → General: interface → Security L2: WPA+WPA2, untick 802.1X, tick PSK, ascii key → Apply → Status Enabled → Apply → Save Configuration. Check [WPA2][Auth(PSK)]."},
],
});

L.push({
id:"wifi-trouble", mins:140, level:"Intermediate · builds on Module 9 lessons 1–6",
t:"Troubleshooting wireless: the four questions, the evidence, the Module 9 challenge and a portfolio project",
html:`
${K.goals([
  "Troubleshoot Wi-Fi with four questions in the order a client meets them, stopping at the first “no”.",
  "Read the evidence for each: netsh, ipconfig, Windows' messages, the WLC GUI, the frame log and the IOS side (bindings, option 43, trunks).",
  "Tell look-alike faults apart and fix each without switching a protection off.",
  "Fix seven independent faults in the Module 9 challenge, and judge a slow link from RSSI, SNR and the channel plan.",
  "Design and document the wireless for your three-site network as a portfolio project.",
])}
${K.pre(["Module 9 lessons 1–6: RF and dBm (1), channels (2), architectures and AP modes (3), AP join with CAPWAP and option 43 (4), the WLC GUI (5), WPA2/WPA3 and WPA2-PSK (6).","Module 4: VLANs and trunks. Module 7: DHCP pools, relay and APIPA. Module 8: prove a fix both ways."])}

<h2>Why this matters at work</h2>
<p>Monday, 08:05, at a managed-service provider in Abuja. Three tickets from the same hotel, each subject line one word long: &ldquo;Wi-Fi.&rdquo; One says the network isn't there, one says the password is wrong, one says it connects but nothing loads. Your manager asks the question every wireless engineer hears: &ldquo;Is it the Wi-Fi or the network?&rdquo;</p>
<p>&ldquo;The Wi-Fi is down&rdquo; can mean anything between radio and router, and most of it isn't radio: a DHCP pool, a pruned trunk, a WLAN on the wrong interface, a mistyped key. Fast wireless engineers ask the same four questions, in order, and read each one's evidence. This lesson gives you that method, the fingerprints of lessons 1–6's faults, a broken hotel and a portfolio project.</p>

<h2>The method: four questions, in the order the client meets them</h2>
${K.remember(`<p><b>The wireless troubleshooting rule:</b> a client gets on the network through four gates, always in the same order. <b>Joined</b> — has the AP joined a controller? <b>Listed</b> — is the WLAN enabled and offered? <b>Let in</b> — do the client's security type and key match the WLAN's? <b>Leased</b> — did it get an address in the right VLAN? Check them in order and <b>stop at the first &ldquo;no&rdquo;</b>: nothing after it can be tested yet. Memory hook: <b>&ldquo;Joined, Listed, Let in, Leased.&rdquo;</b></p>`)}
<p>Each gate depends on the one before. A ${K.g("lightweight AP","An access point that can't work alone: it joins a wireless LAN controller over CAPWAP and gets its WLANs, security and radio settings from it (lesson 3).")} has no WLANs until it has joined its ${K.g("WLC","Wireless LAN controller — the device that manages lightweight APs: their WLANs, security, radio settings and clients (lesson 3).")}; nobody can try a key on an SSID that isn't sent; DHCP starts only after the handshake. Start in the middle and you may fix something real but not the user's fault.</p>
${K.svg("0 0 760 262",
  [["Joined?","AP ↔ controller",["green arcs · All APs: REG","show ip dhcp binding (AP)"],["no IP · no/wrong option 43","no route to the WLC"]],
   ["Listed?","WLAN enabled, broadcast",["netsh wlan show networks","WLANs: Admin Status"],["WLAN Disabled · ID > 16","SSID not broadcast"]],
   ["Let in?","security and key match",["the Windows message","Security Policies column"],["PSK typo · 802.1X left on","WPA3-only, WPA2 client"]],
   ["Leased?","VLAN, DHCP, trunk",["ipconfig · frame log","Interface · show int trunk"],["no Primary DHCP Server","VLAN off trunk · wrong iface"]]].map(([t,s,ev,fa],k)=>{ const x = 10+k*188; return K.txt(x+86,20,"question "+(k+1),{mid:true,s:9.5})+K.box(x,28,172,58,t,s,k===0)+K.txt(x+86,110,"evidence",{mid:true,s:9.5,c:"accent"})+ev.map((l,j)=>K.txt(x+86,126+j*14,l,{mid:true,s:9.5,c:"fg"})).join("")+K.txt(x+86,172,"if “no”, usually",{mid:true,s:9.5,c:"bad"})+fa.map((l,j)=>K.txt(x+86,188+j*14,l,{mid:true,s:9.5,c:"fg"})).join(""); }).join("")+
  [0,1,2].map(k=>K.arrow(184+k*188,57,196+k*188,57)).join("")+
  K.txt(380,240,"Stop at the first “no” — the fault is there, and every later gate can't be tested until it's fixed.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "The four gates a Wi-Fi client passes, the evidence for each and the faults that usually close it. When an AP hasn't joined (question 1), nothing else can work.")}
<h3>What each question really asks</h3>
<ol>
<li><b>Joined?</b> Power (${K.g("PoE","Power over Ethernet — the switch port powers the AP through the data cable (lesson 4).")}), a link, an address on the AP's VLAN, a way to find the controller (broadcast, DHCP ${K.g("option 43","A DHCP option that hands a Cisco AP its controllers' management addresses: type f1, length 4 × the number of controllers, then each address in hex (lesson 4).")}, DNS, a primed address) and a route to it — then ${K.g("CAPWAP","Control And Provisioning of Wireless Access Points — the AP-to-controller tunnel: UDP 5246 for control (always DTLS-encrypted), UDP 5247 for client data (lesson 4).")} discovery and join.</li>
<li><b>Listed?</b> The WLAN exists, Status Enabled, an ID the AP group broadcasts (the default group carries 1–16, lesson 5), Broadcast SSID on.</li>
<li><b>Let in?</b> The client supports the WLAN's security type and holds the same key: a WPA2-only adapter can't join WPA3-only, a PSK client can't join a WLAN left on 802.1X, and a wrong passphrase fails the ${K.g("4-way handshake","The four messages in which a WPA2 client and the AP prove they hold the same key without sending it, and derive the session keys (lesson 6).")}.</li>
<li><b>Leased?</b> The client's DHCP Discover must reach a server in the WLAN's VLAN. In ${K.g("local mode","The default AP mode: all client traffic travels inside CAPWAP to the controller, which puts it on the wired network on the WLAN's interface VLAN (lesson 3).")} that needs the WLAN's interface, its Primary DHCP Server and that VLAN on the controller's trunk; in ${K.g("FlexConnect","A branch AP mode: per WLAN, client traffic is tunnelled to the controller or switched locally at the AP's own switch port, which must then be a trunk carrying the client VLANs (lesson 3).")} with local switching, the AP's own port must be a trunk.</li>
</ol>
${K.analogy(`<p>A hotel guest reaching a room: is the building open, is the room on reception's list, does the key card work, is the room made up? Nobody checks the shower before getting through the door.</p>`)}
<h3>Worked example: a shop's tills connect, then nothing</h3>
<p>A bookshop branch moved its till laptops to Wi-Fi. WLAN <code>Shop-Tills</code> is WPA2-PSK on the <code>tills</code> interface (VLAN 20); the branch AP is in FlexConnect mode with local switching. Ticket: &ldquo;TILL-3 says connected, but card payments time out.&rdquo; Replayed in the lab:</p>
${K.steps([
  ["Questions 1–3","Green arcs, the AP is <code>REG</code> on All APs; TILL-3 is associated; <code>netsh wlan show interfaces</code> says <code>State : connected</code>, <code>Authentication : WPA2-Personal</code>. Joined, listed, let in."],
  ["Question 4 — leased?","<code>ipconfig</code>: <code>Autoconfiguration IPv4 Address. . : 169.254.117.186</code>. <b>No — the fault is here.</b> Renew with the frame log open."],
  ["Read the fingerprint","A frame <i>tagged for VLAN 20</i> dropped on an <i>access</i> port: with local switching the AP tags client traffic at its own port, which must be a trunk."],
  ["Fix and prove it","<code>interface g0/5</code>, <code>switchport mode trunk</code>, <code>switchport trunk native vlan 10</code>, <code>switchport trunk allowed vlan 10,20</code>. The AP stays joined (its traffic is untagged in VLAN 10); a renew gives 10.72.20.10."],
])}
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from TILL-3 (0050.5460.7cea): "is there a DHCP server?"
  · BK-SW1 Gi0/5 is an access port and dropped a frame tagged for VLAN 20 — is the other end a trunk while this one isn't?
No DHCP Offer came back.

BK-SW1#show interfaces g0/5 switchport
Name: Gi0/5
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 10 (APS)`, "The lab's frame log for TILL-3's renew, then the switch port (lines trimmed). An access port suits a local-mode AP, not FlexConnect local switching of a second VLAN.")}
${K.mistake(`Jumping to question 4 because the user said &ldquo;no internet&rdquo;. If the laptop never associated, there is no DHCP to test. <code>netsh wlan show interfaces</code> tells you in one line (<code>State</code>) whether you are at gate 3 or gate 4.`)}
${K.dodont([
  "Reproduce from the user's kind of device — a WPA2-only tablet, not your new laptop.",
  "Write down the exact Windows message and the netsh State first.",
  "Change one thing, then re-test (<code>ipconfig /renew</code> asks again now).",
],[
  "Open a WLAN &ldquo;just to test&rdquo; — it proves little and exposes the network.",
  "Reboot the controller first — it wipes the evidence and drops every client.",
  "Trust the ticket's diagnosis (&ldquo;the password is wrong&rdquo;) over the fingerprint.",
])}
${K.check({q:"A user's laptop shows the office SSID and says Connected, but no websites open. Where do you start?", o:["Question 1 — always check the AP's join first","Question 4 — association and the handshake already worked, so check the address and VLAN","Question 3 — it usually means a wrong key","Question 2 — the WLAN may be disabled"], a:1, why:"'Connected' proves gates 1–3. Start at gate 4: ipconfig, then the WLAN's interface, its DHCP server and the trunk."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A Lagos school's first week on new Wi-Fi brings four complaints. Match each with the first of the four questions that fails.", pairs:[["The library's new AP shows grey arcs and no SSIDs at all","Question 1 — joined?"],["Staff-WiFi appears for teachers, but Exam-WiFi isn't in anyone's list","Question 2 — listed?"],["A teacher's laptop says 'The network security key isn't correct'","Question 3 — let in?"],["Students connect to Exam-WiFi and get 169.254 addresses","Question 4 — leased?"]], why:"1. What is asked? For each symptom, the first gate that fails. 2. Which rule? Joined → Listed → Let in → Leased, and the first 'no' is the fault. 3. Apply it: no SSIDs from one AP = that AP hasn't joined; one SSID missing while others show = that WLAN isn't offered; a key message = the handshake failed; connected with 169.254 = DHCP never answered."})}

<h2>Fingerprints: what each fault looks like from the client, the controller and the switch</h2>
${K.remember(`<p><b>The fingerprint rule:</b> look in three places for every fault — <b>the client</b> (the Windows message, netsh, ipconfig), <b>the controller</b> (All APs, the WLANs list, the WLAN's tabs, the interfaces) and <b>the wired side</b> (DHCP bindings and pools, trunks, the AP's port). Two faults that look the same to the user almost never look the same in all three places.</p>`)}
<p>Lessons 1–6 built the path piece by piece; here it is on one picture, numbered where it breaks, with the table to keep beside you.</p>
${K.svg("0 0 760 300",
  K.dev("laptop",60,170,"CLIENT","netsh · ipconfig")+K.dev("ap",200,170,"AP","")+K.dev("switch",360,170,"SWITCH","")+K.dev("router",640,170,"ROUTER","gateways · DHCP pools")+
  K.box(470,34,150,46,"WLC","WLANs · interfaces",true)+
  K.link(84,172,170,172,"",true)+K.txt(127,160,"802.11",{mid:true,s:9.5})+
  K.link(226,172,330,172)+K.txt(278,192,"AP port",{mid:true,s:9.5})+
  K.link(386,172,612,172)+K.txt(500,192,"trunk: all client VLANs",{mid:true,s:9.5})+
  K.link(376,158,480,82)+K.txt(452,134,"WLC trunk",{s:9.5})+
  `<path d="M200,146 C230,60 330,40 466,52" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#karra)"/>`+K.txt(330,36,"CAPWAP tunnel (local mode)",{mid:true,s:9.5,c:"accent"})+
  [[200,118,1],[452,30,2],[127,140,3],[638,30,4],[430,112,5],[640,128,6],[278,150,7]].map(([x,y,n])=>`<circle cx="${x}" cy="${y}" r="9" fill="var(--panel)" stroke="var(--bad)" stroke-width="1.4"/>`+K.txt(x,y+4,String(n),{mid:true,s:10.5,c:"bad",b:true})).join("")+
  K.txt(380,262,"1 AP join · 2 WLAN offered · 3 security and key · 4 interface: mapping and DHCP server",{mid:true,f:"body",s:11,c:"fg"})+
  K.txt(380,282,"5 VLAN on the WLC trunk · 6 pool and gateway · 7 FlexConnect local switching needs a trunk",{mid:true,f:"body",s:11,c:"fg"}),
  "Where wireless faults live. In local mode client frames ride CAPWAP to the WLC and leave on its trunk tagged with the interface's VLAN; with FlexConnect local switching they leave at the AP's own port (7).")}
<div class="tablewrap"><table>
<tr><th>#</th><th>The user sees</th><th>Fingerprint</th><th>Usual cause → smallest fix</th></tr>
<tr><td>1</td><td>No SSIDs near one AP</td><td>Grey arcs; not on All APs. No binding in <code>show ip dhcp binding</code> = no address; a binding = discovery failed</td><td>Wrong port VLAN, no pool, wrong option 43, no route → fix that one thing</td></tr>
<tr><td>2</td><td>One SSID missing</td><td><code>netsh wlan show networks</code> lists the others; WLANs: <code>Disabled</code>, or ID above 16</td><td>Never enabled, high ID, not broadcast → enable; recreate with ID 1–16 (IDs can't change)</td></tr>
<tr><td>3a</td><td>&ldquo;The network security key isn't correct&rdquo;</td><td>The SSID's security suits the client; only the key differs</td><td>Wrong or stale client key, or a controller typo → re-enter the documented key where it's wrong</td></tr>
<tr><td>3b</td><td>&ldquo;Can't connect to this network&rdquo;</td><td><code>[WPA2][Auth(802.1X)]</code> on a PSK network, or <code>[WPA3][Auth(SAE)]</code> with WPA2-only clients</td><td>802.1X default left on; WPA3-only too early → PSK; WPA2+WPA3 transition</td></tr>
<tr><td>4a</td><td>Connected, 169.254</td><td>Renew: the Discover reaches the controller, then <i>no Primary DHCP Server</i></td><td>Interface without a DHCP server, or WLAN left on management → set it; map the WLAN</td></tr>
<tr><td>4b</td><td>Connected, wrong subnet</td><td><code>ipconfig</code> subnet belongs to another VLAN; General tab: Interface</td><td>WLAN on the wrong interface → map it correctly</td></tr>
<tr><td>5</td><td>Connected, 169.254</td><td>Renew: a switch drops it — <i>VLAN n isn't allowed on trunk</i></td><td>VLAN pruned off the WLC or router trunk → <code>switchport trunk allowed vlan add n</code></td></tr>
<tr><td>6</td><td>Connected, 169.254 or no gateway</td><td>The Discover reaches the router; no pool or subinterface</td><td>Missing pool or gateway (Module 7) → add it</td></tr>
<tr><td>7</td><td>FlexConnect site: 169.254</td><td>A tagged frame dropped on an access port</td><td>Local switching, AP on an access port → trunk, native = AP VLAN</td></tr>
</table></div>
${K.mistake(`Treating 4a and 5 as one fault: one fix is on the controller, the other on a switch. The frame log tells them apart — does the Discover die <i>at the controller</i> or <i>on a switch port</i>?`)}
<h3>The client's evidence</h3>
<p><code>netsh wlan show networks</code> lists what the adapter hears; <code>netsh wlan show interfaces</code> says whether it is associated, and how. A dental practice's reception laptop after a wrong key, then a patient's laptop renewing:</p>
${K.out(`RECEPTION-1 → Wi-Fi: Dental-Staff, key typed as example-dental-2026
The network security key isn't correct

C:\\>netsh wlan show interfaces

There is 1 interface on the system:

    Name                   : Wi-Fi
    Description            : Intel(R) Wi-Fi 6E AX211 160MHz
    Physical address       : 00:50:04:35:dc:00
    Interface type         : Primary
    State                  : disconnected
    Radio status           : Hardware On
                             Software On

PATIENT-7 — ipconfig /renew with the frame log open
DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from PATIENT-7 (0050.944a.4668): "is there a DHCP server?"
  · DP-SW1 drops it: VLAN 45 isn't allowed on trunk Gi0/2
No DHCP Offer came back.`, "Replayed in the lab (an ID line trimmed). Passphrases are case-sensitive. The patient's renew is fingerprint 5.")}
<p>Once connected, read <code>State</code>, <code>SSID</code>, <code>Authentication</code>, <code>Cipher</code>, <code>Band</code>, <code>Channel</code> and <code>Rssi</code>; then <code>ipconfig</code>: the WLAN's subnet, <code>169.254</code>, or the <i>wrong</i> subnet (4b).</p>
${K.dyk(`Windows saves each network as a <b>profile</b>, key included. After a planned key change, laptops still saying &ldquo;The network security key isn't correct&rdquo; are usually retrying the old saved key: <b>Forget</b> the network (or <code>netsh wlan delete profile name="SSID"</code>) and Windows asks for the new one.`)}
<h3>The controller's evidence</h3>
<p><b>All APs</b> lists joined APs (<code>REG</code>, mode). <b>WLANs</b> answers questions 2 and 3 in one table. <b>WLANs &rarr; Edit</b> shows the Interface, the AKM ticks and FlexConnect Local Switching; <b>Interfaces</b> each VLAN and Primary DHCP Server; <b>MONITOR</b> clients with IP and VLAN. The practice's WLANs list after a change:</p>
<div class="tablewrap"><table>
<tr><th>WLAN ID</th><th>Type</th><th>Profile Name</th><th>WLAN SSID</th><th>Admin Status</th><th>Security Policies</th></tr>
<tr><td>1</td><td>WLAN</td><td>STAFF</td><td>Dental-Staff</td><td>Enabled</td><td><code>[WPA2][Auth(PSK)]</code></td></tr>
<tr><td>2</td><td>WLAN</td><td>VISITORS</td><td>Dental-Visitors</td><td>Enabled</td><td><code>[WPA2][Auth(PSK)]</code></td></tr>
<tr><td>3</td><td>WLAN</td><td>DEVICES</td><td>Dental-Devices</td><td>Disabled</td><td><code>[WPA2][Auth(802.1X)]</code></td></tr>
</table></div>
<p>WLAN 3 was created and abandoned: both AireOS defaults, <code>Disabled</code> and 802.1X (lesson 5). Enabling it alone would move PSK devices from gate 2 to gate 3.</p>
${K.exam(`Read WLC GUI exhibits in gate order — <b>Status</b>, <b>Security Policies</b>, <b>Interface</b> — before the options, then match the symptom words: &ldquo;cannot see the SSID&rdquo; = gates 1–2, &ldquo;cannot connect / authentication fails&rdquo; = gate 3, &ldquo;connects but receives no IP address&rdquo; = gate 4. Key options are wrong for a no-address question, however tempting.`)}
<h3>The wired side's evidence: option 43, bindings and trunks</h3>
<p>An AP with a binding but no join: decode its pool's option 43 — <b>type, length, four hex bytes per controller</b>:</p>
${K.steps([
  ["Read the line","<code>option 43 hex f108.0a32.630a.0a32.630b</code> — the dots are only IOS's formatting."],
  ["Type and length","<code>f1</code> = Cisco controller list; <code>08</code> = 8 bytes = <b>two</b> controllers."],
  ["Each address","<code>0a 32 63 0a</code> = 10.50.99.10, <code>0a 32 63 0b</code> = 10.50.99.11 (32 = 3×16 + 2 = 50; 63 = 6×16 + 3 = 99)."],
  ["Compare","Are those the controllers' <b>management</b> addresses, and is the length 4 × the count?"],
])}
${K.mistake(`Writing the decimal digits straight into the hex. 10.30.99.5 is <code>0a 1e 63 05</code>, not <code>0a 30 99 05</code> — valid hex that IOS accepts, sending the AP to 10.48.153.5. Convert every octet (30 = <code>1e</code>, 99 = <code>63</code>).`)}
<p>Pruned trunks need each new WLAN's VLAN added on <b>both</b> trunks (to the WLC and to the router) — check <code>show interfaces trunk</code>.</p>
${K.when([
  ["netsh show networks","the network &ldquo;isn't there&rdquo;","what the adapter hears, with security","the client is connected"],
  ["netsh show interfaces + ipconfig","connected, not working","gates 3–4 and the RF numbers","not associated — read the message"],
  ["WLC GUI","several clients fail","the controller's view of APs and WLANs","one client's saved key is suspect"],
  ["IOS shows","AP won't join; log points at the wire","option 43, pools, trunks live here","the WLAN is just disabled"],
], "Which evidence for which question")}
<h3>Try it: the IOS side of an AP join</h3>
<p>A medical centre's APs in VLAN 10 stopped finding their controller (10.56.99.10) after someone &ldquo;tidied&rdquo; the router, and a new wing's APs will sit in VLAN 12. Fix the old pool, then build the new one.</p>
${K.hint(`Count the address bytes after the length byte: the length must equal them (4 per controller), or the AP ignores the option. A pool for VLAN 12 needs the router's own address on that VLAN first (a subinterface with <code>encapsulation dot1Q 12</code>, Module 4).`)}
${K.term({env:"ios2", title:"MC-R1 — a malformed option 43 and a new AP wing", opts:{kind:"router", host:"MC-R1", model:"ISR4331", motd:"MC-R1 — console session. Controller: 10.56.99.10 (management). APs: VLAN 10 today, VLAN 12 for the new wing."},
  setup:e=>{ ["enable","configure terminal","hostname MC-R1","no ip domain-lookup","interface g0/0","description TRUNK to MC-SW1","no shutdown","interface g0/0.10","description APs MAIN","encapsulation dot1Q 10","ip address 10.56.10.1 255.255.255.0","interface g0/0.20","description STAFF WI-FI","encapsulation dot1Q 20","ip address 10.56.20.1 255.255.255.0","exit",
    "ip dhcp excluded-address 10.56.10.1 10.56.10.9","ip dhcp pool AP-MAIN","network 10.56.10.0 255.255.255.0","default-router 10.56.10.1","option 43 hex f108.0a38.630a","exit","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code> (no password in this lab). The router is alone here — the APs and controllers are on the benches.",
  tasks:[
    {text:"Read the current DHCP config: <code>show running-config | section dhcp</code>. Split AP-MAIN's option 43 into bytes: what does the length byte promise, and how many address bytes follow?", done:e=>e.history.some(h=>/sh\S*\s+run\S*\s*\|\s*sec\S*\s+dhcp/i.test(h))},
    {text:"Correct AP-MAIN: under <code>ip dhcp pool AP-MAIN</code>, <code>option 43 hex f104.0a38.630a</code> — one controller, length 04 (the new line replaces the old one)", done:e=>((e.dhcp.pools["AP-MAIN"]||{}).opt43||"")==="f1040a38630a"},
    {text:"Give the new wing a gateway: <code>interface g0/0.12</code>, <code>description APs NEW WING</code>, <code>encapsulation dot1Q 12</code>, <code>ip address 10.56.12.1 255.255.255.0</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/0.12"]; return !!i && i.encap===12 && i.ip==="10.56.12.1" && i.mask==="255.255.255.0"; }},
    {text:"Build its pool: <code>ip dhcp excluded-address 10.56.12.1 10.56.12.9</code>, then <code>ip dhcp pool AP-WING</code> with <code>network 10.56.12.0 255.255.255.0</code>, <code>default-router 10.56.12.1</code> and the corrected option 43", done:e=>{ const p=e.dhcp.pools["AP-WING"], n=s=>s.split(".").reduce((a,o)=>a*256+(+o),0); return !!p && p.net===n("10.56.12.0") && p.len===24 && (p.routers||[]).includes("10.56.12.1") && p.opt43==="f1040a38630a" && e.dhcp.excluded.some(r=>r[0]<=n("10.56.12.1") && r[1]>=n("10.56.12.9")); }},
    {text:"Prove and save: <code>show running-config | section dhcp</code> again, <code>show ip dhcp pool AP-WING</code> (254 addresses, 9 excluded), then <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.history.some(h=>/sh\S*\s+ip\s+dhcp\s+pool/i.test(h))},
  ],
  win:"f108 promised 8 address bytes and delivered 4, so every AP threw the option away and found no controller. f104.0a38.630a — type, length 4, 10.56.99.10 — is whole again, and the new wing's APs get an address, a gateway and the controller from their first boot. (APs already up read the corrected option at their next DHCP exchange or reboot.)",
  solve:["enable","show running-config | section dhcp","configure terminal","ip dhcp pool AP-MAIN","option 43 hex f104.0a38.630a","exit",
    "interface g0/0.12","description APs NEW WING","encapsulation dot1Q 12","ip address 10.56.12.1 255.255.255.0","exit",
    "ip dhcp excluded-address 10.56.12.1 10.56.12.9","ip dhcp pool AP-WING","network 10.56.12.0 255.255.255.0","default-router 10.56.12.1","option 43 hex f104.0a38.630a","end",
    "show running-config | section dhcp","show ip dhcp pool AP-WING","copy running-config startup-config",""]})}
${K.case("The guest network that filled up every conference night",`
<p><i>A composite of a common pattern.</i> A conference hotel's guest Wi-Fi failed every evening of a big event: new arrivals got <code>169.254</code> while morning guests were fine. <code>show ip dhcp pool GUEST</code>: <code>Leased addresses : 244</code> of 254 with 10 excluded — full. The /24 had been copied from the office template with <code>lease 8</code> (eight days), so every phone that crossed the lobby still held an address. <b>Fix:</b> a /22 (1,022 hosts), <code>lease 0 4</code> (four hours), pool use on the dashboard. <b>Lesson:</b> 169.254 for <i>some</i> clients is a capacity fingerprint; for <i>every</i> client, a configuration one.</p>`)}
${K.check({q:"An AP has a DHCP binding but never joins. Its pool has 'option 43 hex f104.c0a8.0b05'; the controller is 192.168.11.50. What is wrong?", o:["Nothing — the AP needs a reboot","It points at 192.168.11.5; for .50 the last byte must be 32","The length must be 01 for one controller","Option 43 works only on the controller's subnet"], a:1, why:"c0.a8.0b.05 = 192.168.11.5; 50 = 3×16 + 2 = 0x32, so f104.c0a8.0b32. Length 04 is right for one controller."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Kano warehouse's handheld-scanner APs sit in VLAN 15 and must find one controller at 192.168.50.20. Type the option 43 line for their DHCP pool (with or without the dots IOS adds).", fields:[{label:"Pool line", a:["option 43 hex f104.c0a8.3214","option 43 hex f104c0a83214","option 43 hex f1 04 c0 a8 32 14","option 43 hex F104.C0A8.3214","option 43 hex F104C0A83214"]}], why:"1. What is asked? Option 43 for one controller. 2. Which rule? f1, length 4 × controllers, each address as four hex bytes. 3. Apply it: 04; 192 = c0, 168 = a8, 50 = 32, 20 = 14 → option 43 hex f104.c0a8.3214."})}
<h3>Hands-on: walk the four questions on a broken office</h3>
<p>Three faults on <i>one</i> path: each fix reveals the next, as in many real tickets.</p>
${K.bench({id:"m9-four-questions", points:120, openLog:true, from:"CCNA · Module 9 · lesson 7", title:"Ridgeway office — one new AP, one new WLAN, and nobody can work: the four questions in order", viewBox:"0 0 900 400",
  intro:"On Friday an installer mounted AP-2F at Ridgeway, a small accountancy office, and someone created the WLAN Ridgeway-Staff; this morning nobody can work. <b>Access:</b> console cable on RW-SW1 (9600 8N1, no flow control; no enable password here); the <i>Controller GUI</i> button opens RW-WLC1. <b>Design:</b> VLAN 10 APs 172.20.10.0/24 (pool AP-POOL with option 43 for 172.20.99.10); VLAN 30 staff Wi-Fi 172.20.30.0/24 (gateway RW-R1 .1, controller interface <code>staff</code>); VLAN 99 controller management. Key: <code>Example-Ridge-2026</code>. <b>Lab notes:</b> no RF is modelled; <code>ipconfig /renew</code> makes a client ask for an address now.",
  devices:[
    {id:"r1", kind:"router", label:"RW-R1", x:20, y:10, config:e=>{ ["en","conf t","hostname RW-R1","no ip domain-lookup","int g0/0","description TRUNK to RW-SW1","no shut",
      "int g0/0.10","description APs","encapsulation dot1Q 10","ip address 172.20.10.1 255.255.255.0",
      "int g0/0.30","description STAFF WI-FI","encapsulation dot1Q 30","ip address 172.20.30.1 255.255.255.0",
      "int g0/0.99","description WLC MGMT","encapsulation dot1Q 99","ip address 172.20.99.1 255.255.255.0","exit",
      "ip dhcp excluded-address 172.20.10.1 172.20.10.9","ip dhcp excluded-address 172.20.30.1 172.20.30.9",
      "ip dhcp pool AP-POOL","network 172.20.10.0 255.255.255.0","default-router 172.20.10.1","option 43 hex f104.ac14.630a","exit",
      "ip dhcp pool STAFF-WIFI","network 172.20.30.0 255.255.255.0","default-router 172.20.30.1","exit","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:250, y:0},
    {id:"wlc", kind:"wlc", label:"RW-WLC1", x:420, y:10, wlc:{ mgmt:{ip:"172.20.99.10", mask:"255.255.255.0", gw:"172.20.99.1", vlan:99},
      ifaces:{ staff:{vlan:30, ip:"172.20.30.5", mask:"255.255.255.0", gw:"172.20.30.1", dhcp:"172.20.30.1"} },
      wlans:{ 1:{id:1, profile:"RIDGEWAY", ssid:"Ridgeway-Staff", enabled:true, iface:"management", security:"wpa2-ent", psk:null, qos:"silver", broadcast:true} },
      access:{http:true, https:true, telnet:true, ssh:true} }},
    {id:"sw", kind:"switch", label:"RW-SW1", model:"Catalyst 9200 · 2nd floor", x:240, y:140, config:e=>{ ["en","conf t","hostname RW-SW1","no ip domain-lookup","vlan 10","name APS","vlan 30","name STAFF-WIFI","vlan 99","name WLC-MGMT","exit",
      "int g0/1","description TRUNK to RW-R1","switchport mode trunk","switchport trunk allowed vlan 10,30,99",
      "int g0/2","description TRUNK to RW-WLC1","switchport mode trunk","switchport trunk allowed vlan 30,99",
      "int g0/3","description AP-2F","switchport mode access","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ap", kind:"ap", label:"AP-2F", x:300, y:270},
    {id:"pl", kind:"laptop", label:"PARTNER-LAP", x:560, y:290, dhcp:true, wifi:{ssid:"Ridgeway-Staff", key:"Example-Ridge-2026"}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6","console"],
tasks:[
    {text:"<b>Question 1 — joined?</b> AP-2F's radio arcs are grey and WIRELESS &rarr; All APs is empty. An AP needs an address before it can look for a controller: on RW-SW1, <code>show interfaces status</code> shows each port's VLAN — which VLAN is the AP's port in, and which VLAN has the AP pool? Put the port right with <code>switchport access vlan</code> (Module 4). Done when AP-2F has joined RW-WLC1 and its port is still an access port", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/3"]; return Bench.apJoined(B,"ap") && i.mode==="access" && i.vlan===10; }},
    {text:"<b>Questions 2 and 3 — listed, and let in?</b> On PARTNER-LAP run <code>netsh wlan show networks</code> (it lists the SSIDs the adapter can hear, each with its Authentication). Is Ridgeway-Staff offered now, and how? The office uses a passphrase — compare with the WLANs list's Security Policies column, and fix the WLAN's Layer 2 security (lesson 6). Done when PARTNER-LAP is connected to Ridgeway-Staff with WPA2-Personal", done:B=>{ const w=B.devs.wlc.wlc.wlans[1], a=B.devs.pl.wifiAt; return Bench.tried(B,"pl",/^netsh\s+wlan\s+show\s+networks/i) && !!w && w.security==="wpa2-psk" && !!a && a.auth==="WPA2-Personal"; }},
    {text:"<b>Question 4 — leased, in the right VLAN?</b> Connected — now <code>ipconfig</code> on PARTNER-LAP, then <code>ipconfig /renew</code> with the frame log open: where does the Discover stop? Which interface is the WLAN mapped to (WLANs &rarr; Edit &rarr; General)? Done when PARTNER-LAP has an address in 172.20.30.0/24 (VLAN 30) and pings its gateway 172.20.30.1", done:B=>Bench.wifiVlan(B,"pl")===30 && /^172\.20\.30\./.test(Bench.leased(B,"pl")||"") && Bench.pinged(B,"pl","172.20.30.1")},
    {text:"<b>The evidence for the ticket.</b> On PARTNER-LAP run <code>netsh wlan show interfaces</code> (State, SSID, Authentication, Cipher, Band and Channel) and <code>ipconfig</code> (the Wireless LAN adapter's address and gateway) — the two outputs that prove gates 3 and 4. Done when you have run both and the laptop is connected and addressed", done:B=>Bench.tried(B,"pl",/^netsh\s+wlan\s+show\s+interfaces?$/i) && Bench.tried(B,"pl",/^ipconfig$/i) && /^172\.20\.30\./.test(Bench.leased(B,"pl")||"")},
    {text:"<b>While you're in the controller:</b> the audit found HTTP and Telnet allowed on RW-WLC1 — both send the admin password in clear text (lesson 5). MANAGEMENT &rarr; HTTP Access <b>Disabled</b> and Allow New Telnet Sessions <b>No</b>, keeping HTTPS and SSH on. Done when only HTTPS and SSH are allowed", done:B=>{ const a=B.devs.wlc.wlc.access; return !a.http && !a.telnet && a.https && a.ssh; }},
  ],
  win:"Three faults on one path, found in order: the AP's port was still in VLAN 1, so the AP never got an address and never looked for a controller (gate 1); the WLAN kept the AireOS default of 802.1X, so passphrase clients got <i>Can't connect to this network</i> (gate 3); and it was still on the management interface, so DHCP had nowhere to go (gate 4) — and would have put staff in the controller's own VLAN if it had. Then the audit item: HTTPS and SSH only. Your netsh and ipconfig outputs are the ticket's proof.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces status"],
    ["term","configure terminal"],["term","interface g0/3"],["term","switchport access vlan 10"],["term","end"],["term","write memory"],
    ["pc","pl","netsh wlan show networks"],["wlc","wlc","wlanset",1,{security:"wpa2-psk",psk:"Example-Ridge-2026"}],
    ["pc","pl","ipconfig"],["pc","pl","ipconfig /renew"],["wlc","wlc","wlanset",1,{iface:"staff"}],["pc","pl","ping 172.20.30.1"],
    ["pc","pl","netsh wlan show interfaces"],["pc","pl","ipconfig"],["wlc","wlc","access",{http:false,https:true,telnet:false,ssh:true}]]
})}

<h2>Connected but slow or dropping: reading the RF evidence</h2>
${K.remember(`<p><b>The quality rule:</b> once all four gates pass, a link is only as good as how far the signal stands above the noise (<b>SNR = signal &minus; noise floor</b>, lesson 1) and how many radios share its channel (lesson 2). A strong signal on a crowded or noisy channel still performs badly, and another AP on the same channel adds sharing, not capacity.</p>`)}
<p>&ldquo;It's slow&rdquo;, &ldquo;calls freeze&rdquo; — the gates pass, so the evidence moves to the radio, on the same netsh screen: <code>Band</code> and <code>Channel</code> (in 2.4 GHz only 1, 6, 11 don't overlap); <code>Rssi</code>, the received signal in ${K.g("dBm","Decibels relative to one milliwatt: 0 dBm = 1 mW; Wi-Fi signals at a client are tiny fractions of that, so they are negative, and closer to zero is stronger (lesson 1).")} (&minus;45 very strong, about &minus;67 a common target for voice, below about &minus;75 links struggle); and the receive and transmit rates, which fall with weak signal or retries.</p>
<p>The AP measures the noise floor; with both numbers, compute the ${K.g("SNR","Signal-to-noise ratio: received signal (dBm) minus the noise floor (dBm), in dB. Higher is better; roughly 25 dB or more suits voice and video (lesson 1).")}: &minus;71 dBm over &minus;90 dBm noise is 19 dB — fine for web pages, marginal for video.</p>
<h3>Three causes of a bad link that has an address</h3>
<ol>
<li><b>Too little signal</b> — distance and walls: low Rssi, low rates. Fix coverage; more AP power helps one direction only — the client's small radio must still reach the AP.</li>
<li><b>${K.g("Co-channel interference","APs (and their clients) on the same channel that can hear each other: CSMA/CA makes them take turns, so they share the channel's airtime (lesson 2).")}</b> — APs on one channel that hear each other take turns. Fingerprint: good Rssi, poor throughput that worsens as the room fills.</li>
<li><b>${K.g("Adjacent-channel interference","Interference from a nearby AP on an overlapping but different channel, such as 2.4 GHz channels 1 and 4: the radios don't take turns, so frames collide and are resent (lesson 2).")}</b> and noise (microwave ovens live in 2.4 GHz too): a high noise floor, low SNR, retries.</li>
</ol>
<p>A Cisco controller's ${K.g("RRM","Radio Resource Management — the controller's automatic RF tuning: Dynamic Channel Assignment (DCA) picks each AP's channel, Transmit Power Control (TPC) sets its power, coverage-hole detection raises power where clients are weak.")} normally sets every AP's channel and power; a radio set statically sits outside it — a common way two neighbours share a channel.</p>
${K.tip(`The lab has no RF (netsh always shows the same strong signal), so the drills and this ticket carry this part. On real kit, run netsh on two or three affected clients where the users sit.`)}
${K.job("“Video calls freeze in the boardroom every afternoon”",`
<h3>Ticket 4412 · 14:10 · &ldquo;Since IT added a second access point to the boardroom, our afternoon video calls freeze and drop. Mornings are fine.&rdquo;</h3>
<p><b>Symptom and questions.</b> Users connect and browse, so it's quality, not connectivity. &ldquo;Which rooms?&rdquo; <i>The boardroom.</i> &ldquo;Since when?&rdquo; <i>The second AP.</i> Afternoons fill the room: a new radio plus a fault that grows with users points at airtime sharing.</p>
<p><b>Checks.</b> On two laptops at the table:</p>
${K.out(`    Band                   : 2.4 GHz
    Channel                : 6
    Receive rate (Mbps)    : 65
    Rssi                   : -62

    Band                   : 2.4 GHz
    Channel                : 6
    Receive rate (Mbps)    : 39
    Rssi                   : -60`, "netsh wlan show interfaces on two laptops, lines trimmed (illustrative values, Windows 11 layout). Good signal, low rates, the same channel on two different APs.")}
<p>The controller shows both boardroom APs' 2.4 GHz radios set <b>statically</b> to channel 6 at maximum power by the installer: two APs in one room taking turns for every frame — co-channel interference.</p>
<p><b>Fix.</b> Return both radios to RRM's Dynamic Channel Assignment (DCA), which chose 1 and 11, and confirm the 5 GHz radios are on. <b>Proof:</b> the laptops show <code>Band : 5 GHz</code> on channels 44 and 149, rates several times higher, and the 15:00 call runs clean.</p>
<p><b>What you say.</b> &ldquo;The two access points were on the same radio channel, so they took turns instead of working side by side — worse as the room filled. The controller chooses their channels again, and most laptops now use the faster 5 GHz band. Tell me how this afternoon's call goes.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;AP-BRD-1/2: 2.4 GHz static ch 6, max power → CCI under load. Restored RRM: ch 1 / 11; 5 GHz on. Verified: clients on 5 GHz, 15:00 call clean. No static channels without a survey reason.&rdquo;</i></p>`)}
${K.myth([
  ["Full signal bars mean the Wi-Fi is fine.","Bars show strength only; noise, channel sharing and the four gates decide whether it works."],
  ["Connected means the problem is on the internet side.","Connected means gates 1–3 passed; gate 4 — address, VLAN, DHCP, trunks — is still yours."],
  ["&ldquo;The network security key isn't correct&rdquo; means the user typed it wrong.","It means the keys differ: the controller's may be wrong, or Windows is retrying an old profile."],
  ["Another access point always fixes a slow room.","On the same channel it adds co-channel interference; a new AP needs its own channel."],
])}
${K.drill({title:"Module 9 mixed review — channels, overlap, plans, dBm and SNR", types:["wifichan","wifioverlap","wifiplan","wifidbm","wifisnr"], count:10})}
${K.check({q:"Training-room laptops show 2.4 GHz, channel 11, Rssi about -55, rates near 40 Mbps; throughput collapses when the class of 30 joins. Most likely cause?", o:["Weak signal — raise the AP's power","A wrong PSK","Airtime sharing on one crowded 2.4 GHz channel","A full DHCP pool"], a:2, why:"-55 dBm is strong and the clients are connected and addressed. A fault that grows with users on one channel is airtime sharing: more cells on other channels and 5 GHz, not more power."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A ward's Wi-Fi phones report an RSSI of -74 dBm, and the AP measures a noise floor of -89 dBm in that corner. Work out the SNR, then say whether it meets the roughly 25 dB usually wanted for voice.", fields:[{label:"SNR (dB)", a:["15","15 dB","15db"]},{label:"Meets the voice target? (yes/no)", a:["no","n"]}], why:"1. What is asked? The SNR, and a judgement against a target. 2. Which rule? SNR = signal − noise floor, both in dBm, giving dB. 3. Apply it: (−74) − (−89) = 15 dB, well under about 25 dB — and −74 dBm is weaker than the commonly cited −67 dBm for voice. The corner needs better coverage, not a new key or VLAN."})}

<h2>The Module 9 challenge</h2>
<p>The Lantern Hotel in Abuja went live on Cisco wireless at the weekend — a controller, two APs, five WLANs on five VLANs — and on Monday seven tickets arrive. The faults are independent — fix them in any order — and a ticket ticks only when its fault is fixed <i>and</i> the design is intact: every WLAN secured, every client in its own VLAN, the controller's trunk still pruned.</p>
${K.svg("0 0 760 356",
  K.dev("router",110,70,"LH-R1","gateways · DHCP pools")+K.box(560,40,160,46,"LH-WLC1","10.44.99.5 · VLAN 99",true)+
  K.dev("switch",380,160,"LH-SW1","")+K.dev("ap",230,262,"AP-1F","floors 1–2")+K.dev("ap",530,262,"AP-3F","floor 3 · new")+
  K.link(134,78,354,154)+K.link(406,154,560,78)+K.link(366,174,238,248)+K.link(394,174,522,248)+
  K.txt(215,132,"Gi0/1 trunk",{mid:true,s:10})+K.txt(505,138,"Gi0/2 trunk",{mid:true,s:10})+K.txt(262,196,"Gi0/3 · VLAN 10",{mid:true,s:10})+K.txt(498,196,"Gi0/4 · VLAN 11",{mid:true,s:10})+
  K.arrow(548,250,628,92,"",true)+K.txt(612,190,"CAPWAP",{s:10,c:"accent"})+
  K.txt(380,334,"Clients: FRONT-DESK and SALES-3F (Staff) · ROOM-214 (Guest) · EVENTS-LAP (Events) · KITCHEN-TAB (Kitchen)",{mid:true,f:"body",s:10.5,c:"fg"})+
  K.txt(380,350,"HK-TAB, a WPA2-only tablet, and HK-SUPER, a WPA3 laptop (Ops) · VLANs 20 / 30 / 40 / 50 / 60",{mid:true,f:"body",s:10.5,c:"fg"}),
  "The challenge network: LH-R1 is gateway and DHCP server for every VLAN; LH-WLC1 maps each WLAN to an interface in VLANs 20–60.")}
${K.tip(`Work like the job: <b>reproduce</b> from the user's device, walk the four gates, read the <b>fingerprint</b> in all three places, make the <b>smallest fix</b> that keeps the protection, <b>prove it</b> from the client — and note ticket, gate, fingerprint, fix and proof for your portfolio.`)}
${K.bench({id:"m9-challenge", points:250, challenge:true, openLog:true, from:"CCNA · Module 9 · lesson 7", title:"Module 9 challenge — the Lantern Hotel's first Monday on the new Wi-Fi", viewBox:"0 0 940 480",
  intro:"<b>Access:</b> console cable on LH-R1 (9600 8N1, no flow control), move it to LH-SW1 as needed; enable secret <code>Lantern-Lab26</code>. The controller's GUI is the <i>Controller GUI</i> button (real kit: https://10.44.99.5). <b>Design:</b> LH-R1 is gateway (.1) and DHCP server for VLANs 10 (APs floors 1–2, pool APS-LOW), 11 (floor-3 AP, pool APS-3F), 20 staff, 30 guests, 40 events, 50 kitchen, 60 housekeeping, 99 controller (LH-WLC1 10.44.99.5). Controller interfaces staff/guest/events/kitchen/ops are .5 in VLANs 20–60, Primary DHCP Server .1. <b>Keys (change record):</b> Lantern-Staff <code>Example-Staff-2026</code> · Lantern-Guest <code>Example-Guest-2026</code> (room cards) · Lantern-Kitchen <code>Example-Kitchen-26</code> · Lantern-Events <code>Example-Events-2026</code> · Lantern-Ops <code>Example-Ops-2026</code>. <b>Policy:</b> one interface and VLAN per WLAN; WPA2-PSK, except Lantern-Ops: WPA2+WPA3 transition until the old tablets go; LH-SW1 Gi0/2 carries only VLANs 20–60 and 99; AP ports are access ports. <b>Lab notes:</b> no RF (every laptop is in range, but SALES-3F can join only through AP-3F, on its floor); <code>ipconfig /renew</code> makes a client ask again now; a real AP reads a new option 43 only when it next asks for an address — bounce its port (<code>shutdown</code>, <code>no shutdown</code>, which also cycles PoE).",
  devices:[
    {id:"r1", kind:"router", label:"LH-R1", x:20, y:10, config:e=>{ ["en","conf t","hostname LH-R1","enable algorithm-type scrypt secret Lantern-Lab26","no ip domain-lookup","int g0/0","description TRUNK to LH-SW1","no shut",
      ...[[10,"AP floors 1-2"],[11,"AP floor 3"],[20,"STAFF"],[30,"GUEST"],[40,"EVENTS"],[50,"KITCHEN"],[60,"OPS"],[99,"WLC MGMT"]].flatMap(([v,d])=>["int g0/0."+v,"description "+d,"encapsulation dot1Q "+v,"ip address 10.44."+v+".1 255.255.255.0"]),"exit",
      ...[10,11,20,30,40,50,60].map(v=>"ip dhcp excluded-address 10.44."+v+".1 10.44."+v+".9"),
      "ip dhcp pool APS-LOW","network 10.44.10.0 255.255.255.0","default-router 10.44.10.1","option 43 hex f104.0a2c.6305","exit",
      "ip dhcp pool APS-3F","network 10.44.11.0 255.255.255.0","default-router 10.44.11.1","option 43 hex f104.c000.0201","exit",
      ...[["STAFF",20],["GUEST",30],["EVENTS",40],["KITCHEN",50],["OPS",60]].flatMap(([n,v])=>["ip dhcp pool "+n,"network 10.44."+v+".0 255.255.255.0","default-router 10.44."+v+".1","exit"]),
      "end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:250, y:0},
    {id:"wlc", kind:"wlc", label:"LH-WLC1", x:420, y:10, wlc:{ mgmt:{ip:"10.44.99.5", mask:"255.255.255.0", gw:"10.44.99.1", vlan:99},
      ifaces:{ staff:{vlan:20, ip:"10.44.20.5", mask:"255.255.255.0", gw:"10.44.20.1", dhcp:null},
               guest:{vlan:30, ip:"10.44.30.5", mask:"255.255.255.0", gw:"10.44.30.1", dhcp:"10.44.30.1"},
               events:{vlan:40, ip:"10.44.40.5", mask:"255.255.255.0", gw:"10.44.40.1", dhcp:"10.44.40.1"},
               kitchen:{vlan:50, ip:"10.44.50.5", mask:"255.255.255.0", gw:"10.44.50.1", dhcp:"10.44.50.1"},
               ops:{vlan:60, ip:"10.44.60.5", mask:"255.255.255.0", gw:"10.44.60.1", dhcp:"10.44.60.1"} },
      wlans:{ 1:{id:1, profile:"STAFF", ssid:"Lantern-Staff", enabled:true, iface:"staff", security:"wpa2-psk", psk:"Example-Staff-2026", qos:"silver", broadcast:true},
              2:{id:2, profile:"GUEST", ssid:"Lantern-Guest", enabled:false, iface:"guest", security:"wpa2-psk", psk:"Example-Guest-2026", qos:"bronze", broadcast:true},
              3:{id:3, profile:"KITCHEN", ssid:"Lantern-Kitchen", enabled:true, iface:"kitchen", security:"wpa2-psk", psk:"Example-Kitchen-62", qos:"silver", broadcast:true},
              4:{id:4, profile:"EVENTS", ssid:"Lantern-Events", enabled:true, iface:"guest", security:"wpa2-psk", psk:"Example-Events-2026", qos:"bronze", broadcast:true},
              5:{id:5, profile:"OPS", ssid:"Lantern-Ops", enabled:true, iface:"ops", security:"wpa3-sae", psk:"Example-Ops-2026", qos:"silver", broadcast:true} } }},
    {id:"sw", kind:"switch", label:"LH-SW1", model:"Catalyst 9200 · comms room", x:260, y:140, config:e=>{ ["en","conf t","hostname LH-SW1","enable algorithm-type scrypt secret Lantern-Lab26","no ip domain-lookup",
      ...[[10,"AP-LOW"],[11,"AP-3F"],[20,"STAFF"],[30,"GUEST"],[40,"EVENTS"],[50,"KITCHEN"],[60,"OPS"],[99,"WLC-MGMT"]].flatMap(([v,n])=>["vlan "+v,"name "+n]),"exit",
      "int g0/1","description TRUNK to LH-R1","switchport mode trunk","switchport trunk allowed vlan 10,11,20,30,40,50,60,99",
      "int g0/2","description TRUNK to LH-WLC1 port 1","switchport mode trunk","switchport trunk allowed vlan 20,30,40,50,99",
      "int g0/3","description AP-1F","switchport mode access","switchport access vlan 10",
      "int g0/4","description AP-3F","switchport mode access","switchport access vlan 11","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ap1", kind:"ap", label:"AP-1F", x:300, y:262},
    {id:"ap3", kind:"ap", label:"AP-3F", x:720, y:262},
    {id:"desk", kind:"laptop", label:"FRONT-DESK", x:20, y:376, dhcp:true, wifi:{ssid:"Lantern-Staff", key:"Example-Staff-2026", ap:"ap1"}},
    {id:"room", kind:"laptop", label:"ROOM-214", x:150, y:376, dhcp:true, wifi:{ssid:"Lantern-Guest", key:"Example-Guest-2026", ap:"ap1"}},
    {id:"kit", kind:"laptop", label:"KITCHEN-TAB", x:280, y:376, dhcp:true, wifi:{ssid:"Lantern-Kitchen", key:"Example-Kitchen-26", ap:"ap1"}},
    {id:"evt", kind:"laptop", label:"EVENTS-LAP", x:410, y:376, dhcp:true, wifi:{ssid:"Lantern-Events", key:"Example-Events-2026", ap:"ap1"}},
    {id:"hk", kind:"laptop", label:"HK-TAB", x:540, y:376, dhcp:true, wifi:{ssid:"Lantern-Ops", key:"Example-Ops-2026", ap:"ap1"}},
    {id:"sup", kind:"laptop", label:"HK-SUPER", x:670, y:376, dhcp:true, wifi:{ssid:"Lantern-Ops", key:"Example-Ops-2026", wpa3:true, ap:"ap1"}},
    {id:"f3", kind:"laptop", label:"SALES-3F", x:810, y:376, dhcp:true, wifi:{ssid:"Lantern-Staff", key:"Example-Staff-2026", ap:"ap3"}},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap1:eth", b:"sw:g3"}, {type:"cat6", a:"ap3:eth", b:"sw:g4"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Sales office, third floor (Hauwa, SALES-3F):</b> &ldquo;Since the new access point went in up here on Friday, none of us can even see Lantern-Staff.&rdquo; <i>Done when AP-3F has joined LH-WLC1 from its own VLAN 11 address &mdash; its DHCP pool telling it where the controller is &mdash; and SALES-3F is connected to Lantern-Staff through AP-3F.</i>", hint:"Question 1 of the method: has the AP joined? Look at AP-3F's radio arcs and at WIRELESS &rarr; All APs. If it isn't listed, does it at least have an address (<code>show ip dhcp binding</code> on LH-R1)? Then read the pool that gave it that address (<code>show running-config | section dhcp</code>), turn each byte of its option 43 back into decimal, and compare with the controller's Interfaces page: which interface do APs join?", done:B=>{ const a=B.devs.ap3, w=B.devs.f3.wifiAt; return Bench.apJoined(B,"ap3") && a.joinVia==="DHCP option 43" && /^10\.44\.11\./.test(a.ip||"") && Bench.wifiAssoc(B,"f3") && w.ap==="ap3" && w.ssid==="Lantern-Staff"; }},
    {text:"<b>Reception (Amaka):</b> &ldquo;Guests in room 214 say Lantern-Guest isn't in their list at all &mdash; and it's printed on every room card.&rdquo; <i>Done when ROOM-214 is connected to Lantern-Guest with the room-card key and has an address in 10.44.30.0/24, the WLAN still WPA2-PSK on the guest interface.</i>", hint:"<code>netsh wlan show networks</code> on ROOM-214: which SSIDs does the AP offer, and which is missing? Other SSIDs are there, so the AP has joined. Question 2: does the WLAN exist, and is it enabled? The WLANs list has an Admin Status column.", done:B=>{ const w=B.devs.wlc.wlc.wlans[2]; return !!w && w.enabled && w.security==="wpa2-psk" && w.iface==="guest" && Bench.wifiVlan(B,"room")===30 && /^10\.44\.30\./.test(Bench.leased(B,"room")||""); }},
    {text:"<b>Kitchen (Chef Bassey):</b> &ldquo;The order tablet says <i>The network security key isn't correct</i>. We've typed the key from Friday's change record, Example-Kitchen-26, three times.&rdquo; <i>Done when KITCHEN-TAB is connected to Lantern-Kitchen with the key from the change record and has an address in 10.44.50.0/24, the WLAN still WPA2-PSK.</i>", hint:"That message means the 4-way handshake failed: the tablet and the controller hold different keys. The controller never shows a PSK back to you, so you can't read it and compare &mdash; but the change record is the source of truth. What can you do on the controller?", done:B=>{ const w=B.devs.wlc.wlc.wlans[3]; return !!w && w.enabled && w.security==="wpa2-psk" && w.psk==="Example-Kitchen-26" && Bench.wifiAssoc(B,"kit") && Bench.wifiVlan(B,"kit")===50 && /^10\.44\.50\./.test(Bench.leased(B,"kit")||""); }},
    {text:"<b>Events (Ngozi, conference manager):</b> &ldquo;Delegates on Lantern-Events get 10.44.30 addresses, the same as hotel guests, and can't reach the presentation system on the events network.&rdquo; <i>Done when EVENTS-LAP is on Lantern-Events with an address in 10.44.40.0/24 (VLAN 40), the WLAN still WPA2-PSK.</i>", hint:"Connected, with an address &mdash; the wrong one. Which VLAN is 10.44.30.0/24 in the design? What decides which VLAN a WLAN's clients land in? WLANs &rarr; Edit &rarr; General.", done:B=>{ const w=B.devs.wlc.wlc.wlans[4]; return !!w && w.enabled && w.security==="wpa2-psk" && w.iface==="events" && Bench.wifiVlan(B,"evt")===40 && /^10\.44\.40\./.test(Bench.leased(B,"evt")||""); }},
    {text:"<b>Housekeeping (Musa, HK-TAB):</b> &ldquo;IT upgraded Lantern-Ops on Saturday. Since then our older tablets say <i>Can't connect to this network</i>. The supervisor's new laptop connects fine.&rdquo; <i>Done when HK-TAB (a WPA2-only adapter) is connected to Lantern-Ops with WPA2-Personal and HK-SUPER is still connected with WPA3-Personal.</i>", hint:"Same SSID, same key, one client joins and one doesn't: compare the clients, not the key. What security does the WLANs list show for OPS? What can a WPA2-only adapter speak? Lesson 6 had a mode that offers both on one SSID.", done:B=>{ const w=B.devs.wlc.wlc.wlans[5], a=B.devs.hk.wifiAt, b=B.devs.sup.wifiAt; return !!w && w.enabled && w.security==="wpa2-wpa3" && !!a && a.ssid==="Lantern-Ops" && a.auth==="WPA2-Personal" && !!b && b.ssid==="Lantern-Ops" && b.auth==="WPA3-Personal"; }},
    {text:"<b>Housekeeping supervisor (Funke, HK-SUPER):</b> &ldquo;My laptop says connected to Lantern-Ops, but nothing opens &mdash; ipconfig shows 169.254.&rdquo; <i>Done when HK-SUPER has an address in 10.44.60.0/24 (VLAN 60), still connected with WPA3-Personal, and LH-SW1's trunk to the controller still carries only the controller's VLANs (not the AP VLANs 10 and 11).</i>", hint:"Connected plus 169.254 means the radio side worked and DHCP didn't. Open the frame log, run <code>ipconfig /renew</code> on HK-SUPER and read where the Discover stops. Then, on LH-SW1, <code>show interfaces trunk</code>.", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/2"], b=B.devs.sup.wifiAt; return Array.isArray(i.allowed) && i.allowed.includes(60) && !i.allowed.includes(10) && !i.allowed.includes(11) && !!b && b.auth==="WPA3-Personal" && Bench.wifiVlan(B,"sup")===60 && /^10\.44\.60\./.test(Bench.leased(B,"sup")||""); }},
    {text:"<b>Front desk (Ifeoma, FRONT-DESK):</b> &ldquo;Our laptops connect to Lantern-Staff, but there's no network at all.&rdquo; <i>Done when FRONT-DESK has an address in 10.44.20.0/24 (VLAN 20) on Lantern-Staff, the WLAN still WPA2-PSK and still mapped to the staff interface.</i>", hint:"The same symptom as the supervisor's ticket &mdash; is it the same fingerprint? Renew with the frame log open: does the Discover even leave the controller? Then look at the staff interface's DHCP information (CONTROLLER &rarr; Interfaces).", done:B=>{ const w=B.devs.wlc.wlc.wlans[1]; return !!w && w.enabled && w.security==="wpa2-psk" && w.iface==="staff" && Bench.wifiVlan(B,"desk")===20 && /^10\.44\.20\./.test(Bench.leased(B,"desk")||""); }},
  ],
  win:"Seven tickets, one method. A floor-3 AP told to look for 192.0.2.1 — the controller's virtual interface, which never answers CAPWAP — instead of its management address (gate 1); a guest WLAN created and never enabled (gate 2); a kitchen key typed …-62 at the controller, which never shows a PSK back — so you re-entered it from the change record (gate 3); a WPA3-only Ops WLAN that locked out WPA2 tablets until transition mode let both kinds join (gate 3); an Events WLAN mapped to the guest interface (gate 4); and two identical-looking 169.254 tickets with different fingerprints — a staff interface with no Primary DHCP Server (the Discover died at the controller) and VLAN 60 pruned off the controller's trunk (it died on the switch). Every WLAN is still secured, every client is in its own VLAN, and the trunk still carries only what it should.",
  solve:[
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Lantern-Lab26"],
    ["term","show ip dhcp binding"],["term","show running-config | section dhcp"],
    ["term","configure terminal"],["term","ip dhcp pool APS-3F"],["term","option 43 hex f104.0a2c.6305"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Lantern-Lab26"],
    ["term","configure terminal"],["term","interface g0/4"],["term","shutdown"],["term","no shutdown"],["term","end"],
    ["pc","sup","ipconfig /renew"],["term","show interfaces trunk"],
    ["term","configure terminal"],["term","interface g0/2"],["term","switchport trunk allowed vlan add 60"],["term","end"],["term","write memory"],
    ["wlc","wlc","wlanset",2,{enabled:true}],
    ["wlc","wlc","wlanset",3,{enabled:false}],["wlc","wlc","wlanset",3,{psk:"Example-Kitchen-26"}],["wlc","wlc","wlanset",3,{enabled:true}],
    ["wlc","wlc","wlanset",4,{enabled:false}],["wlc","wlc","wlanset",4,{iface:"events"}],["wlc","wlc","wlanset",4,{enabled:true}],
    ["wlc","wlc","wlanset",5,{enabled:false}],["wlc","wlc","wlanset",5,{security:"wpa2-wpa3"}],["wlc","wlc","wlanset",5,{enabled:true}],
    ["pc","desk","ipconfig /renew"],["wlc","wlc","ifaceset","staff",{dhcp:"10.44.20.1"}],["pc","desk","ipconfig /renew"],
    ["pc","f3","netsh wlan show interfaces"],["pc","room","ipconfig"],["pc","kit","ipconfig"],["pc","evt","ipconfig"],["pc","hk","netsh wlan show interfaces"],["pc","sup","ipconfig"],["pc","desk","ping 10.44.20.1"]]
})}
${K.hint(`Stuck? Group the tickets by gate. One AP has grey arcs (gate 1); one SSID is missing (gate 2); two tickets quote a Windows message (gate 3); three clients are connected but unhappy with their address (gate 4) — and two of those look identical until you renew with the frame log open.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Ticket 1 — the floor-3 AP was given the wrong controller address",`<p><b>Gate 1.</b> Grey arcs; All APs lists only AP-1F. <code>show ip dhcp binding</code> has <code>10.44.11.10 … GigabitEthernet0/0.11</code>, so the AP has an address and discovery fails. Pool APS-3F: <code>option 43 hex f104.c000.0201</code> = c0.00.02.01 = <b>192.0.2.1</b> — the controller's <i>virtual</i> interface (lesson 5), copied from the wrong row of the Interfaces page. It is never routed and never answers CAPWAP; APs join the <b>management</b> address (APS-LOW's line, <code>f104.0a2c.6305</code> = 10.44.99.5, is right).</p>
<p><b>Fix:</b> <code>option 43 hex f104.0a2c.6305</code> in APS-3F, then bounce Gi0/4 so the AP asks again. <b>Proof:</b> green arcs, the frame log's CAPWAP join, AP-3F <code>REG</code>, SALES-3F connected through it. Moving its port into VLAN 10 would also make it join — and break the design.</p>`)}
${K.reveal("Ticket 2 — the guest WLAN was never switched on",`<p><b>Gate 2.</b> ROOM-214's <code>netsh wlan show networks</code>: <code>There are 4 networks currently visible.</code> — all but Lantern-Guest. WLANs list: <code>2  WLAN  GUEST  Lantern-Guest  Disabled  [WPA2][Auth(PSK)]</code>.</p>
<p><b>Fix:</b> General &rarr; Status <b>Enabled</b> &rarr; Apply. <b>Proof:</b> ROOM-214 joins with the room-card key and gets 10.44.30.x.</p>`)}
${K.reveal("Ticket 3 — the kitchen key was typed wrong at the controller",`<p><b>Gate 3a.</b> <i>The network security key isn't correct</i>, and <code>[WPA2][Auth(PSK)]</code> suits the tablet: only the key differs. The tablet has the change record's key and every kitchen device fails, so the controller is the odd one out — and its PSK can't be read back.</p>
<p><b>Fix:</b> Security &rarr; Layer 2 &rarr; PSK Format <code>ascii</code>, key <code>Example-Kitchen-26</code> &rarr; Apply (in a quiet moment: changing a live WLAN briefly drops its clients). <b>Proof:</b> WPA2-Personal, 10.44.50.x. The configured key was <code>…-62</code>.</p>`)}
${K.reveal("Ticket 4 — Events delegates land in the guest VLAN",`<p><b>Gate 4b.</b> EVENTS-LAP: connected, <code>IPv4 Address. . . : 10.44.30.10</code> — the guest subnet; MONITOR shows VLAN 30; General: Interface <code>guest</code>.</p>
<p><b>Fix:</b> Interface <b>events</b> &rarr; Apply. <b>Proof:</b> a renew gives 10.44.40.x, VLAN 40.</p>`)}
${K.reveal("Ticket 5 — WPA3-only locked out the WPA2 tablets",`<p><b>Gate 3b.</b> HK-TAB: <i>Can't connect to this network</i> — not a key message — while HK-SUPER shows <code>Authentication : WPA3-Personal</code> with the same key. The list says <code>[WPA3][Auth(SAE)]</code>: a WPA2-only adapter has no SAE (lesson 6).</p>
<p><b>Fix:</b> Layer 2 Security <b>WPA2+WPA3</b> with WPA2 Policy + PSK <i>and</i> WPA3 Policy + SAE, PMF Optional; Security Policies becomes <code>[WPA2][Auth(PSK)], [WPA3][Auth(SAE)]</code>. <b>Proof:</b> HK-TAB on WPA2-Personal, HK-SUPER still WPA3-Personal. WPA2-only would take WPA3 from every device that has it. (Test each tablet model: a few old drivers misbehave on transition SSIDs.)</p>`)}
${K.reveal("Ticket 6 — VLAN 60 never reaches the router",`<p><b>Gate 4, fingerprint 5.</b> HK-SUPER: connected, 169.254. Renew with the frame log open:</p>
${K.out(`DHCP Discover (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from HK-SUPER (0050.ca4e.1cbf): "is there a DHCP server?"
  · LH-SW1 drops it: VLAN 60 isn't allowed on trunk Gi0/2
No DHCP Offer came back.`, "The controller tagged the frame for VLAN 60; the switch refused it.")}
<p><code>show interfaces trunk</code>: <code>Gi0/2  20,30,40,50,99</code>. <b>Fix:</b> <code>switchport trunk allowed vlan add 60</code> on Gi0/2 — <i>add</i>, not <code>no switchport trunk allowed vlan</code>, which would hand the controller VLANs it never needs. <b>Proof:</b> 10.44.60.x.</p>`)}
${K.reveal("Ticket 7 — the staff interface has nowhere to send DHCP",`<p><b>Gate 4, fingerprint 4a.</b> FRONT-DESK: connected, 169.254 — like ticket 6, until the renew:</p>
${K.out(`DHCP Discover from FRONT-DESK reaches the controller over CAPWAP, but interface staff has no Primary DHCP Server — with DHCP proxy on (the AireOS default) the WLC has nowhere to relay it, so the client never gets an address`, "This Discover never leaves the controller.")}
<p><b>Fix:</b> Interfaces &rarr; staff &rarr; Primary DHCP Server <code>10.44.20.1</code> &rarr; Apply; <code>ipconfig /renew</code>. <b>Proof:</b> 10.44.20.x and a gateway reply.</p>
<p><b>Finally</b> <code>write memory</code> on LH-R1 and LH-SW1, <b>Save Configuration</b> on the controller (Apply changes only the running config), a ticket note each, and a checklist line: &ldquo;new WLAN = interface with a DHCP server + VLAN on both trunks + enabled + tested from each client type.&rdquo;</p>`)}

<h2>Portfolio project: the wireless for your three-site network</h2>
<p>&ldquo;Have you worked with Cisco wireless?&rdquo; is answered best by a repository with a design, an RF plan, a WLAN table, configs and <i>evidence</i> — every gate proved for every WLAN. Build on your Modules 5–8 three-site network (a head office with two routers, two branches) in the Ladder Lab builder, Cisco Packet Tracer (it has a WLC and lightweight APs) or a Catalyst 9800-CL virtual controller.</p>
${K.svg("0 0 760 306",
  K.band(10,10,330,24,"HEAD OFFICE · local mode")+K.band(420,10,330,24,"BRANCHES 1 and 2 · FlexConnect")+
  K.dev("router",70,80,"HQ-R1","HSRP")+K.dev("router",200,80,"HQ-R2","HSRP")+K.box(250,130,90,44,"WLC","HQ, VLAN 99",true)+
  K.dev("switch",135,170,"HQ-SW1","")+K.dev("ap",60,250,"AP-HQ1","access port")+K.dev("ap",200,250,"AP-HQ2","access port")+
  K.link(84,132,125,160)+K.link(186,132,145,160)+K.link(161,170,250,154,"trunk")+K.link(112,206,68,236)+K.link(158,206,194,236)+
  K.dev("cloud",380,140,"WAN","")+K.link(224,76,356,128)+
  K.dev("router",500,80,"BR1-R1","")+K.dev("switch",500,170,"BR1-SW1","")+K.dev("ap",500,250,"AP-BR1","trunk port")+
  K.dev("router",660,80,"BR2-R1","")+K.dev("switch",660,170,"BR2-SW1","")+K.dev("ap",660,250,"AP-BR2","trunk port")+
  K.link(404,134,476,86)+K.link(404,158,636,96)+K.link(500,120,500,158)+K.link(660,120,660,158)+K.link(500,210,500,236)+K.link(660,210,660,236)+
  K.arrow(480,246,344,168,"",true)+K.txt(395,242,"CAPWAP to the WLC",{mid:true,s:9.5,c:"accent"}),
  "A portfolio design: local-mode APs on access ports at HQ; branch APs join over the WAN in FlexConnect mode and switch client VLANs locally on trunk ports.")}
<h3>The brief</h3>
<div class="tablewrap"><table>
<tr><th>Deliverable</th><th>What it contains</th><th>Lessons</th></tr>
<tr><td><b>Design</b></td><td>Who connects where; the WLANs; why local mode at HQ and FlexConnect local switching at branches (a WAN outage mustn't stop branch Wi-Fi)</td><td>3</td></tr>
<tr><td><b>RF plan</b></td><td>AP positions; 2.4 GHz on 1/6/11 only; 5 GHz channels and width; power — or a note that RRM assigns them</td><td>1, 2</td></tr>
<tr><td><b>Ports and AP join</b></td><td>Every AP and controller port: access or trunk, native and allowed VLANs; LAG (<code>mode on</code>) if the controller has two uplinks; each AP pool's option 43 worked out in hex</td><td>4</td></tr>
<tr><td><b>WLAN table</b></td><td>ID, SSID, security, interface and VLAN, QoS (Platinum for voice, Bronze for guests), DHCP server, local switching</td><td>5, 6</td></tr>
<tr><td><b>Management</b></td><td>Controller access HTTPS and SSH only; admin logins via TACACS+ or RADIUS with local fallback; guest isolation with an ACL</td><td>5, M8</td></tr>
<tr><td><b>Evidence and break/fix log</b></td><td>Per WLAN, per gate, both ways; three faults introduced on purpose — symptom, gate, fingerprint, fix, proof</td><td>7</td></tr>
</table></div>
${K.svg("0 0 760 200",
  K.txt(20,22,"HQ floor 2 — six APs",{f:"display",s:12,c:"fg",b:true})+
  [[0,0,"1","36"],[1,0,"6","44"],[2,0,"11","149"],[0,1,"11","157"],[1,1,"1","40"],[2,1,"6","48"]].map(([c,r,a,b])=>{ const x = 90+c*150+(r?75:0), y = 70+r*80; return `<circle cx="${x}" cy="${y}" r="38" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.3"/>`+K.txt(x,y-4,"2.4: ch "+a,{mid:true,s:10.5,c:"fg"})+K.txt(x,y+12,"5: ch "+b,{mid:true,s:10.5,c:"muted"}); }).join("")+
  K.txt(560,60,"Rule for neighbours:",{f:"body",s:11,c:"fg",b:true})+K.txt(560,78,"2.4 GHz — never the same,",{f:"body",s:11})+K.txt(560,94,"and only 1, 6, 11",{f:"body",s:11})+K.txt(560,116,"5 GHz — many channels, so",{f:"body",s:11})+K.txt(560,132,"neighbours never repeat",{f:"body",s:11})+K.txt(560,154,"Power: enough overlap to",{f:"body",s:11})+K.txt(560,170,"roam, not to shout",{f:"body",s:11}),
  "A channel sketch for one floor: touching cells differ on 2.4 GHz, and 5 GHz channels don't repeat. RRM would normally choose these.")}
${K.when([
  ["WPA2+WPA3 transition","old and new clients share a WLAN","WPA3 for those that can, WPA2 for the rest","every client does WPA3 — go WPA3-only"],
  ["WPA3-Personal (SAE) only","all clients support it, or it's 6 GHz","strongest personal mode, PMF required","any WPA2-only device must join"],
  ["WPA2/WPA3-Enterprise (802.1X)","staff at a real company","per-user, revocable logins","no RADIUS server (as in this lab) — design it, build PSK"],
  ["Enhanced Open (OWE)","public guests who type no key","encrypts each client without a key","you must know who connected"],
], "Choosing the security for each WLAN")}
<h3>Build it, break it, prove it</h3>
${K.steps([
  ["Paper first","The WLAN table and the port table before any command: a VLAN missing on paper will be missing on the trunk."],
  ["One AP, one WLAN, four gates","Pool with option 43, the right port type, the join, then one WLAN end to end before the next."],
  ["Evidence as you go","Files named by WLAN and gate (STAFF-gate4-ipconfig.txt), negative tests included."],
  ["Break it, then publish","Three faults from the fingerprint table, written up; on GitHub with every key replaced by a placeholder."],
])}
<h3>A write-up template you can copy</h3>
${K.out(`# Wireless for a three-site network: Cisco WLC, local mode and FlexConnect — with evidence
Author: <name> · Built with: <Packet Tracer / 9800-CL / Ladder Lab> · <month year>

## 1. Design — who connects where, and why FlexConnect at the branches
## 2. RF plan (/design/rf-plan.png)
| Site | AP | 2.4 GHz ch | 5 GHz ch / width | Power |
## 3. WLANs
| ID | SSID | Security | Interface / VLAN | QoS | DHCP server | Local switching |
## 4. Ports and AP join
| Switch port | Device | Mode | Native / allowed VLANs | Option 43 (hex) |
## 5. Evidence per WLAN (outputs in /evidence)
| WLAN | Joined | Listed | Let in | Leased | Negative test |
## 6. What broke and how I fixed it
| # | Fault | Symptom | Gate | Fingerprint | Fix | Proof |
## 7. Limits — simulated in <tool>; no RADIUS server, no RF; next: 802.1X, WPA3-only`, "Save as README.md and fill each angle bracket. Every row of section 3 needs a row in section 5.")}
<p><b>&ldquo;Done&rdquo; evidence:</b> every AP <code>REG</code> and each option 43 line; per WLAN, both netsh views, <code>ipconfig</code> in its VLAN and a gateway ping; <code>show interfaces trunk</code> for every trunk; negative tests — wrong key refused, WPA2-only client refused by a WPA3-only test WLAN, HTTP and Telnet refused.</p>
${K.tip(`Post it: 150 words on LinkedIn with the diagram and one fault proved by one line of evidence. &ldquo;Two tickets both said 169.254: one died at the controller, one on a switch&rdquo; is a ready interview story.`)}
${K.check({q:"Which evidence best proves that Branch 1's FlexConnect local switching works for the staff WLAN?", o:["The WLAN's Advanced tab with FlexConnect Local Switching ticked","A branch laptop on the staff WLAN with an address from the branch's own staff subnet that pings the branch gateway, plus show interfaces trunk on the AP's port listing the AP VLAN as native and the staff VLAN as allowed","The AP listed as REG on All APs","show ip dhcp binding on the HQ router"], a:1, why:"The tick and REG show intent and join, not where traffic leaves. A branch-subnet address, the branch gateway answering, and a trunk carrying the VLAN prove local switching."})}
<h3>Same logic, new situation</h3>
${K.hint(`Neighbours must differ, there are only three channels to give out, and two cells on one channel need a cell between them.`)}
${K.reveal("Branch 2's corridor: five APs in a row, each hearing only its immediate neighbours on 2.4 GHz. Which channels?",`<p><b>1. What is asked?</b> A 2.4 GHz channel for five APs in a line. <b>2. Which rule?</b> Only 1, 6 and 11 don't overlap, and APs that hear each other must not share a channel. <b>3. Apply it:</b> 1, 6, 11, 1, 6 — each differs from its neighbours, and the two APs on 1 (and on 6) are three cells apart, out of earshot. Their 5 GHz radios take five different channels, such as 36, 44, 149, 157 and 40.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Give the order and the evidence for each step — interviewers listen for a method, not guesses.`)}
${K.reveal("&ldquo;A user says the Wi-Fi is down. How do you troubleshoot it?&rdquo;",`<p>&ldquo;Who's affected, and what changed? Then the client's order: has the AP joined the controller (All APs)? Is the WLAN enabled and offered (<code>netsh wlan show networks</code>)? Do security and key match (the exact Windows message)? Did it get an address in the right VLAN (<code>ipconfig</code>, the WLAN's interface, its DHCP server, the trunks)? I stop at the first no, make the smallest fix that keeps the protection, and prove it from the user's kind of device.&rdquo;</p>`)}
${K.hint(`Two places a Discover can die — name both, and how you tell them apart.`)}
${K.reveal("&ldquo;Clients connect to the SSID but get a 169.254 address. What do you check on a Cisco WLC network?&rdquo;",`<p>&ldquo;Connected means radio and key worked, so it's DHCP. In local mode the controller relays to the interface's Primary DHCP Server — blank, and the Discover dies there. Otherwise it leaves on the controller's trunk tagged with the interface's VLAN, so the VLAN must be allowed on that trunk and the router's, with a gateway and pool. FlexConnect local switching needs a trunk at the AP. If only some clients fail, the pool may be full.&rdquo;</p>`)}
${K.hint(`Where the controller lives, how branch APs find it, and what branch Wi-Fi does if the WAN fails.`)}
${K.reveal("&ldquo;How would you design wireless for a head office and two branches?&rdquo;",`<p>&ldquo;A controller pair at HQ (9800 or 9800-CL) with local-mode APs on access ports. Branch APs find it with option 43 and run FlexConnect local switching on trunk ports, so Wi-Fi survives a WAN outage. One VLAN per WLAN; Enterprise security with RADIUS for staff, transition mode where old devices exist, a guest WLAN limited by an ACL, Platinum for voice; RRM for RF; management over HTTPS and SSH with TACACS+. Then every WLAN proved through the four gates.&rdquo;</p>`)}

${K.recap([
  "Four gates, in order: Joined, Listed, Let in, Leased. Stop at the first no.",
  "No SSIDs from one AP: a DHCP binding but no join means discovery failed — decode option 43 byte by byte; decimal digits copied into hex is the classic error.",
  "One SSID missing: Disabled, an ID above 16, or not broadcast. A new AireOS WLAN starts Disabled, with 802.1X.",
  "'The network security key isn't correct' = the keys differ (re-enter the controller's PSK if unsure). 'Can't connect to this network' = a security type the client can't use.",
  "Connected with 169.254: the Discover dies at the controller (no Primary DHCP Server) or on a switch (VLAN not allowed on a trunk). Wrong subnet: the WLAN's Interface. FlexConnect local switching needs a trunk at the AP.",
  "Connected but slow: SNR and channel sharing, not just signal; 2.4 GHz neighbours on 1/6/11; let RRM work.",
  "Fix the smallest thing without switching a protection off; prove it from the user's kind of client.",
])}
${K.next(`<b>Module 10 — automation and programmability.</b> You've just run a whole site's Wi-Fi from one controller instead of AP by AP — the idea behind controller-based networking. Next: software-defined networking, APIs and the tools that manage networks at scale.`)}
`,
quiz:[
  {type:"order", q:"Put the four wireless troubleshooting questions in the order a client meets them.", items:["Has the AP joined a controller?","Is the WLAN enabled and offered (listed)?","Do the client's security type and key match the WLAN's?","Did the client get an address in the right VLAN?"], why:"Each gate depends on the one before: no join, no WLANs; no SSID, nothing to authenticate to; no completed handshake, no DHCP. Check in this order and stop at the first no.", lvl:1},
  {q:"A laptop shows 'Connected' to the staff SSID, and ipconfig shows Autoconfiguration IPv4 Address 169.254.40.7. Which gate has failed?", o:["Joined — the AP hasn't joined the controller","Listed — the WLAN is disabled","Let in — the key is wrong","Leased — the client got no DHCP answer in its VLAN"], a:3, why:"Connected proves gates 1–3: the AP is broadcasting, the WLAN is offered and the key handshake worked. A 169.254 (APIPA) address means no DHCP server answered — gate 4.", lvl:1},
  {type:"match", q:"Match each piece of evidence with what it tells you.", pairs:[["The network security key isn't correct","The client and the WLAN hold different keys"],["Can't connect to this network (on a PSK client)","The WLAN's security type doesn't suit the client, e.g. 802.1X or WPA3-only"],["There are 0 networks currently visible.","No nearby AP is broadcasting any SSID — check the AP's join"],["Autoconfiguration IPv4 Address 169.254.x.x","Associated, but no DHCP answer"]], why:"Windows' two connection messages separate a key mismatch from a security-type mismatch; an empty network list points at gates 1–2 (usually the AP); an APIPA address points at gate 4.", lvl:1},
  {q:"Why can't you check a WLAN's pre-shared key by reading it on the AireOS controller?", o:["The key is stored on the RADIUS server, not the controller","The PSK field is set-only: the controller never displays the key, so if in doubt you re-enter the documented key","The key is shown only on the CLI with show wlan","The controller hashes the key into the SSID"], a:1, why:"AireOS never shows a configured PSK back in the GUI or the running config. When a key is suspect, compare the client's key with the change record and re-enter the documented key on the controller.", lvl:1},
  {q:"A new AireOS WLAN was created with Create New → Go, given an SSID and mapped to its interface. PSK laptops can't join. What two defaults explain it?", o:["QoS Silver and Broadcast SSID on","It starts Disabled, and Layer 2 security defaults to WPA2 with 802.1X key management","It starts on the virtual interface with WEP","DHCP Addr. Assignment Required and Session Timeout"], a:1, why:"A new AireOS WLAN is created disabled, with WPA2 + AES and 802.1X key management (lesson 5). For PSK clients you must untick 802.1X, tick PSK, set the key and tick Status Enabled. QoS Silver and Broadcast SSID on don't stop anyone joining.", lvl:2},
  {type:"fill", q:"An AP pool must list two controllers, 172.16.5.10 and 172.16.5.11. Type the option 43 line (with or without the dots IOS adds).", fields:[{label:"Pool line", a:["option 43 hex f108.ac10.050a.ac10.050b","option 43 hex f108ac10050aac10050b","option 43 hex F108.AC10.050A.AC10.050B","option 43 hex F108AC10050AAC10050B"]}], why:"Type f1; length = 4 bytes × 2 controllers = 8 = 08; 172.16.5.10 = ac.10.05.0a and 172.16.5.11 = ac.10.05.0b (172 = 10×16 + 12 = ac, 16 = 1×16 = 10 in hex). So option 43 hex f108.ac10.050a.ac10.050b.", lvl:2},
  {q:"Based on the exhibit, what is wrong with the Events WLAN?", ex:"EVENTS-LAP> netsh wlan show interfaces\n    State                  : connected\n    SSID                   : Conf-Events\n    Authentication         : WPA2-Personal\n    Cipher                 : CCMP\n\nEVENTS-LAP> ipconfig\nWireless LAN adapter Wi-Fi:\n   IPv4 Address. . . . . . . . . . . : 10.9.30.44\n   Default Gateway . . . . . . . . . : 10.9.30.1\n\nDesign: VLAN 30 guests 10.9.30.0/24 · VLAN 40 events 10.9.40.0/24", o:["The PSK is wrong","The WLAN is mapped to the guest interface instead of the events interface","VLAN 40 is missing from the controller's trunk","The AP hasn't joined"], a:1, why:"The client is connected (gates 1–3) and leased an address — from the guest subnet. The VLAN a WLAN's clients land in is set by its Interface on the General tab. A pruned VLAN 40 would give no address at all, not a guest one.", lvl:2},
  {q:"Based on this WLANs list, which WLAN will a laptop with only a WPA2 passphrase be unable to join even though it is enabled?", ex:"WLAN ID  Type  Profile Name  WLAN SSID      Admin Status  Security Policies\n1        WLAN  STAFF         Corp-Staff     Enabled       [WPA2][Auth(PSK)]\n2        WLAN  GUEST         Corp-Guest     Disabled      [WPA2][Auth(PSK)]\n3        WLAN  SCANNERS      Corp-Scan      Enabled       [WPA2][Auth(802.1X)]\n4        WLAN  LAB           Corp-Lab       Enabled       [WPA2][Auth(PSK)], [WPA3][Auth(SAE)]", o:["WLAN 1","WLAN 2","WLAN 3","WLAN 4"], a:2, why:"WLAN 3 uses 802.1X key management, which needs a RADIUS-backed login, so a passphrase-only client gets 'Can't connect to this network'. WLAN 2 can't be joined either, but because it's disabled. WLAN 4 is transition mode, which accepts WPA2-PSK clients.", lvl:2},
  {type:"multi", q:"On a local-mode WLAN, clients associate but receive 169.254 addresses. Which two are likely causes? (Choose two.)", o:["The WLAN's interface has no Primary DHCP Server","The interface's VLAN is not allowed on the controller's trunk","The PSK on the controller has a typo","The WLAN is disabled","The AP hasn't joined the controller"], a:[0,1], why:"Associated means the AP joined, the WLAN is enabled and the key matched — so the last three are ruled out. The Discover dies either at the controller (no DHCP server to relay to) or on a switch (the VLAN pruned off the trunk).", lvl:2},
  {q:"Based on the output, why do clients on the Dental-Visitors WLAN (interface visitors, VLAN 45) get no address while staff (VLAN 40) are fine?", ex:"DP-SW1#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/1       on               802.1q         trunking      1\nGi0/2       on               802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/1       1-4094\nGi0/2       40,99\n\n(Gi0/1 = to the router, Gi0/2 = to the WLC)", o:["The router has no VLAN 45 subinterface","VLAN 45 isn't allowed on the trunk to the controller, so the controller's tagged frames are dropped","The visitors WLAN uses the wrong PSK","Gi0/2 should be an access port"], a:1, why:"The controller puts visitors' frames on its trunk tagged for VLAN 45, and Gi0/2 allows only 40 and 99. Fix with switchport trunk allowed vlan add 45 — add, so the existing list stays. A controller port is always a trunk.", lvl:2},
  {q:"Housekeeping tablets that support only WPA2 get 'Can't connect to this network' on a WLAN changed to WPA3-SAE; new WPA3 laptops connect. The policy says devices that support WPA3 should keep using it. What is the best change?", o:["Set the WLAN to WPA2-PSK only","Set the WLAN to WPA2+WPA3 transition mode (PSK and SAE on the same SSID)","Set Layer 2 Security to None until the tablets are replaced","Create the WLAN again with a higher ID"], a:1, why:"Transition mode offers PSK to WPA2-only clients and SAE to WPA3 clients on one SSID, keeping WPA3 where it's supported. WPA2-only would take WPA3 away from the new laptops; None removes protection entirely; the ID has nothing to do with it.", lvl:2},
  {type:"fill", q:"A Wi-Fi phone reports RSSI -70 dBm and the AP measures a noise floor of -95 dBm. What is the SNR in dB?", fields:[{label:"SNR (dB)", a:["25","25 dB","25db"]}], why:"SNR = signal − noise = (−70) − (−95) = 25 dB, around the level usually wanted for voice. Both numbers are dBm; their difference is in dB.", lvl:2},
  {q:"Two shop tills are on the same SSID. TILL-1, on a local-mode AP, gets an address; TILL-2, on the branch's FlexConnect AP with local switching, stays on 169.254. The frame log shows the switch dropping a frame tagged for VLAN 20 on the FlexConnect AP's port. What should you change?", o:["The WLAN's PSK","Make the FlexConnect AP's switch port a trunk with the AP's VLAN as native and VLAN 20 allowed","Move the WLAN to the management interface","Set the FlexConnect AP to monitor mode"], a:1, why:"With local switching the AP tags each WLAN's client traffic at its own switch port, so an access port drops VLAN 20. A trunk with the AP's VLAN as native keeps the AP's own CAPWAP traffic untagged and carries the client VLAN. TILL-1 works because local-mode traffic is tunnelled to the controller. Monitor mode serves no clients at all.", lvl:3},
  {q:"Users in a meeting room say video calls freeze in the afternoons since a second AP was added. Both APs' 2.4 GHz radios show channel 6, set statically. Based on the exhibit from one laptop, what is the most likely cause and fix?", ex:"    Band                   : 2.4 GHz\n    Channel                : 6\n    Radio type             : 802.11n\n    Receive rate (Mbps)    : 39\n    Signal                 : 80% \n    Rssi                   : -60", o:["Weak signal — raise both APs to maximum power","Co-channel interference: two APs in one room sharing channel 6's airtime; let RRM assign different channels (or plan 1/6/11) and make sure 5 GHz is on","A wrong PSK causing retries","The DHCP pool is full"], a:1, why:"-60 dBm is a good signal, the client is connected and addressed, and the problem grows with the number of users after a second radio was added on the same channel. That's airtime sharing between co-channel APs. Different channels and 5 GHz fix it; more power makes the overlap worse.", lvl:2},
  {q:"An AP at a branch has a DHCP lease in VLAN 11 from the branch router, and its pool's option 43 correctly lists the HQ controller 10.30.99.5. It still never appears on All APs. The branch router's show ip route has no route to 10.30.99.0/24 and no default route. What is the most likely cause?", o:["Option 43 must list the controller's virtual address 192.0.2.1","The AP's CAPWAP discovery requests can't reach the controller because the branch router has no route to its subnet","The AP must be on the same subnet as the controller","The WLAN on the controller is disabled"], a:1, why:"The AP has an address and knows the right controller, so discovery fails on reachability: CAPWAP (UDP 5246) to 10.30.99.5 needs a route. Add the route (or fix the routing protocol) and the AP joins. Option 43 lists management addresses, not the virtual interface; option 43 exists so APs can join across subnets; a disabled WLAN doesn't stop an AP joining.", lvl:3},
  {q:"A colleague closed a 'kitchen tablets can't connect' ticket by setting the kitchen WLAN's Layer 2 Security to None. The tablets work. What is the right response?", o:["Leave it — the users are happy","Restore WPA2-PSK, re-enter the documented key on the controller, prove a tablet connects with WPA2-Personal, and record why opening the WLAN wasn't a fix","Change the SSID so nobody notices","Set the WLAN to WPA3-only"], a:1, why:"Opening the WLAN removed the protection instead of fixing the mismatch, and exposed the kitchen network. Restore the security, fix the actual cause (the key), and prove it from the client. WPA3-only would break WPA2 tablets in a new way.", lvl:3},
],
cards:[
  {f:"The four wireless questions", b:"Joined (has the AP joined a controller?), Listed (is the WLAN enabled and offered?), Let in (do the security type and key match?), Leased (an address in the right VLAN?). In that order; stop at the first no."},
  {f:"Gate 1 evidence: is the AP joined?", b:"Radio arcs, WIRELESS > All APs (REG), and show ip dhcp binding on the router. A binding but no join = discovery failed: decode option 43, check the route to the controller."},
  {f:"Option 43 decode", b:"f1 = Cisco controller list; next byte = 4 x number of controllers; then each management IP as four hex bytes. f104.0a1e.6305 = one controller, 10.30.99.5."},
  {f:"The decimal-as-hex trap", b:"10.30.99.5 written as 0a.30.99.05 is valid hex for 10.48.153.5. Convert every octet: 30 = 1e, 99 = 63."},
  {f:"Gate 2: one SSID missing", b:"netsh wlan show networks lists the others. Causes: WLAN Disabled (a new AireOS WLAN starts Disabled), an ID above 16 (default AP group), Broadcast SSID off."},
  {f:"Two Windows connection messages", b:"'The network security key isn't correct' = the keys differ. 'Can't connect to this network' = a security type the client can't use: 802.1X left on, or WPA3-only with a WPA2-only adapter."},
  {f:"The PSK is set-only", b:"AireOS never shows a configured PSK back. If the key is suspect, re-enter the documented key on the controller; after a planned change, clear stale Windows profiles."},
  {f:"Two kinds of connected-but-169.254", b:"Frame log on ipconfig /renew: the Discover dies at the controller (interface has no Primary DHCP Server) or on a switch (VLAN n isn't allowed on trunk). Same symptom, different fix."},
  {f:"Connected, wrong subnet", b:"The WLAN is mapped to the wrong interface (WLANs > Edit > General > Interface/Interface Group). The VLAN a client lands in comes from that mapping."},
  {f:"FlexConnect local switching and the AP port", b:"The AP tags client VLANs at its own port, so the port must be a trunk: native = the AP's VLAN, allowed = AP + client VLANs. An access port drops the tagged frames."},
  {f:"Transition mode", b:"WPA2+WPA3 on one SSID (PSK + SAE): WPA2-only clients use PSK, WPA3 clients use SAE. Fixes 'WPA3-only locked out old devices' without taking WPA3 away from new ones."},
  {f:"Connected but slow", b:"Check Band, Channel, Rssi and rates (netsh). SNR = signal - noise; ~25 dB for voice. Co-channel APs share airtime; 2.4 GHz neighbours on 1/6/11; let RRM set channels and power."},
  {f:"A fix that keeps the protection", b:"Never 'fix' by opening a WLAN, dropping to WPA2-only, unpruning a trunk or moving clients to another VLAN. Fix the cause, then prove it from the user's own kind of client."},
],
});


const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[1-8]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m9", t:"Wireless: RF, 802.11, Cisco WLCs and wireless security",
  blurb:"Understand how Wi-Fi really moves data — radio, power, channels and the 802.11 standards — then build Cisco wireless the way companies run it: lightweight APs joining a controller over CAPWAP, WLANs mapped to VLANs, WPA2 and WPA3 security — and fix a broken office in the Module 9 challenge.",
}, L, { at, modAt:8, replace:["Wireless fundamentals"] });
})();
