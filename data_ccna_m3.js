// CCNA · Module 3 — Binary, IPv4 addressing & subnetting (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lessons "IPv4 addressing & subnetting — the worked method" and "VLSM: designing an addressing plan".
(function(){
const L = [];

// ---------- Module 3 · Lesson 1 ----------
L.push({
id:"ip-binary", mins:60, level:"Beginner · builds on Modules 1–2",
t:"Binary and hexadecimal for network engineers — counting the way devices do",
html:`
${K.goals([
  "Explain why network devices work in bits, and say what a bit, a nibble, a byte and an octet are.",
  "Convert any value from 0 to 255 between decimal and 8-bit binary, both ways, on paper.",
  "Recite the powers of two up to 2<sup>16</sup> and the mask values 128 192 224 240 248 252 254 255, and say where they come from.",
  "Convert between decimal, binary and hex through nibbles, and read hex where it appears: MACs, EtherTypes, hex dumps, IPv6, the Cisco configuration register.",
  "Set up an exam whiteboard in thirty seconds and avoid dropped leading zeros and reversed bits.",
])}
${K.pre(["Module 1: the Ethernet frame (including the 2-byte Type field), TCP/UDP ports, and your first IOS session.","Module 2 lesson 1: MAC addresses as 12 hex digits and the I/G and U/L bits. This lesson explains the conversions underneath."])}

<h2>Why this matters at work</h2>
<p>One morning at an MSP in Ikeja. A vendor's sheet gives a camera's mask as <code>11111111.11111111.11111111.11000000</code>. A colleague pastes a capture into the team chat with <code>08 06</code> highlighted: &ldquo;what is this frame?&rdquo; And a branch router that rebooted after a power cut reports <code>Configuration register is 0x2142</code> and has no configuration.</p>
<p>All three need the same skill: reading numbers the way devices write them. Devices work in ${K.g("bits","Binary digits: the smallest unit of data, 0 or 1.")}; people write those bits as strings of ones and zeros or, more compactly, in hex. Every subnet, mask and ${K.g("wildcard","An inverted mask used in ACLs and OSPF, e.g. 0.0.0.255. Later modules.")} in this course is binary underneath. If conversions are shaky, subnetting feels like magic. If they are automatic, it is arithmetic.</p>

<h2>Why networks count in twos</h2>
<p>A chip is millions of tiny switches (transistors), each conducting or not: <b>on or off</b>. A copper pair carries one voltage level or another; a fibre carries light, bright or dim. The hardware is built to tell <b>two states</b> apart, because two states stay distinguishable even when a signal is weak or noisy after 90 metres of cable. Ten levels, one per decimal digit, would turn every bit of interference into a wrong digit.</p>
<p>So the two states are called <b>0</b> and <b>1</b>, and everything is built from runs of them. That is ${K.g("binary","Base 2: two digits, 0 and 1. Each position is worth twice the one to its right.")}. (Gigabit copper actually sends several voltage levels per symbol, but the data the NIC hands up the stack is still bits.)</p>
<h3>Bits, nibbles, bytes and octets</h3>
<div class="tablewrap"><table>
<tr><th>Name</th><th>Bits</th><th>Values</th><th>Where you meet it</th></tr>
<tr><td><b>Bit</b></td><td>1</td><td>2 (0 or 1)</td><td>Flags: a MAC's I/G bit, TCP's SYN and ACK</td></tr>
<tr><td><b>${K.g("Nibble","Four bits: half a byte. Exactly one hex digit.")}</b></td><td>4</td><td>16 (0–15)</td><td>One hex digit</td></tr>
<tr><td><b>${K.g("Byte","Eight bits. In networking usually called an octet.")}</b></td><td>8</td><td>256 (0–255)</td><td>Each pair of hex digits in a MAC</td></tr>
<tr><td><b>${K.g("Octet","Exactly eight bits. The word standards use, because some old computers had bytes of other sizes.")}</b></td><td>8</td><td>256 (0–255)</td><td>Each number in an IPv4 address such as 192.168.10.1</td></tr>
</table></div>
<p>An IPv4 address is four octets (32 bits), a MAC six (48 bits), an IPv6 address sixteen (128 bits).</p>
${K.dyk(`&ldquo;Bit&rdquo; is credited to the statistician John Tukey; Claude Shannon put it in print in his 1948 paper founding information theory. Standards say &ldquo;octet&rdquo; because some early computers used 6-bit or 9-bit bytes, so &ldquo;byte&rdquo; wasn't precise enough.`)}
<h3>Place values: the idea you already use</h3>
<p>Decimal uses ${K.g("positional notation","A digit's value depends on its position. The rightmost position is worth 1; each position left is worth the base times more.")}. In 172 the 1 is worth one <i>hundred</i> because of where it sits: each position is worth <b>ten times</b> the one to its right. Binary works the same way with two digits, so each position is worth <b>twice</b> the one to its right. Start at 1 on the right and keep doubling:</p>
<div class="tablewrap"><table>
<tr><th>Decimal places</th><td>100</td><td>10</td><td>1</td><td colspan="5">172 = 1×100 + 7×10 + 2×1</td></tr>
<tr><th>Binary places</th><td>128</td><td>64</td><td>32</td><td>16</td><td>8</td><td>4</td><td>2</td><td>1</td></tr>
<tr><th>172 in binary</th><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td><td>1</td><td>0</td><td>0</td></tr>
</table></div>
<p>Each binary digit is 0 or 1, so each place is either <b>counted or not</b>. To read binary, add the place values with a 1 under them: 128 + 32 + 8 + 4 = 172.</p>
${K.svg("0 0 720 232",
  [128,64,32,16,8,4,2,1].map((v,i)=>{ const on = [1,0,1,0,1,1,0,0][i], x = 40+i*82, cx = x+32;
    return K.txt(cx,22,String(v),{c:"accent",s:14,mid:true,b:true})+K.txt(cx,38,"2^"+(7-i),{s:10,mid:true})+
      `<rect x="${x}" y="48" width="64" height="66" rx="9" fill="var(--panel2)" stroke="${on?"var(--accent)":"var(--line)"}" stroke-width="1.6"/>`+
      `<rect x="${x+16}" y="${on?54:84}" width="32" height="24" rx="5" fill="${on?"var(--accent)":"var(--chip)"}" stroke="var(--line)"/>`+
      K.txt(cx,140,String(on),{c:"fg",s:20,mid:true,b:true})+K.txt(cx,160,on?"+"+v:"0",{c:on?"ok":"muted",s:11,mid:true}); }).join("")+
  K.txt(360,192,"10101100  =  128 + 32 + 8 + 4  =  172",{c:"accent",s:14,mid:true,b:true})+
  K.txt(40,222,"← bit 7: most significant (worth 128)",{s:10.5})+K.txt(696,222,"bit 0: least significant (worth 1) →",{s:10.5,end:true}),
  "An octet is eight on/off switches, each with a fixed place value. The octet's value is the sum of the switches that are on: here 172.")}
<p>The leftmost bit is the ${K.g("most significant bit","The leftmost bit (MSB), worth 128 in an octet.")} (MSB), worth 128; the rightmost the ${K.g("least significant bit","The rightmost bit (LSB), worth 1. If it is 1, the number is odd.")} (LSB), worth 1. That order never changes.</p>
${K.analogy(`<p>Eight light switches in a hall: the first lights 128 bulbs, the next 64, then 32, down to one bulb. To light exactly 172 bulbs you flip on 128, 32, 8 and 4. Every number from 0 (all off) to 255 (all on) has exactly one pattern.</p>`)}
${K.check({q:"How many different values can 6 bits hold?", o:["6","12","32","64"], a:3, why:"Each bit doubles the patterns: 2 × 2 × 2 × 2 × 2 × 2 = 2<sup>6</sup> = 64 values, 0 to 63."})}

<h2>Converting decimal to binary — and back</h2>
<p>Every conversion here rests on one row. Learn to write it in five seconds:</p>
${K.out(`128   64   32   16    8    4    2    1`, "The octet place values. Write this row first, every time.")}
<h3>Method 1: the subtraction method (decimal → binary)</h3>
<p>Walk the row left to right. At each place value ask: <b>does it fit into what is left?</b> Yes → write 1 and subtract. No → write 0 and move on. You must finish on zero. Here are seven values you'll meet constantly:</p>
${K.steps([
  ["192 (as in 192.168.x.x)", `<p>128 fits → 1, left 64. 64 fits → 1, left 0. The rest → 0.</p>${K.out(`128  64  32  16   8   4   2   1
  1   1   0   0   0   0   0   0     192 = 11000000
192-128=64, 64-64=0`)}`],
  ["168", `<p>128 → 1, left 40. 64 doesn't fit → 0. 32 → 1, left 8. 16 → 0. 8 → 1, left 0. Rest → 0.</p>${K.out(`128  64  32  16   8   4   2   1
  1   0   1   0   1   0   0   0     168 = 10101000
168-128=40, 40-32=8, 8-8=0`)}`],
  ["172 (as in 172.16.x.x)", `${K.out(`128  64  32  16   8   4   2   1
  1   0   1   0   1   1   0   0     172 = 10101100
172-128=44, 44-32=12, 12-8=4, 4-4=0`)}<p>172 and 168 differ only in the 4 bit, because 172 − 168 = 4.</p>`],
  ["10 (as in 10.x.x.x)", `<p>128, 64, 32, 16 are all bigger than 10 → 0 0 0 0. 8 → 1, left 2. 4 → 0. 2 → 1, left 0. 1 → 0.</p>${K.out(`128  64  32  16   8   4   2   1
  0   0   0   0   1   0   1   0     10 = 00001010
10-8=2, 2-2=0`)}<p>Keep all four leading zeros: an octet always has eight digits.</p>`],
  ["255 and 0", `${K.out(`128  64  32  16   8   4   2   1
  1   1   1   1   1   1   1   1     255 = 11111111   (128+64+32+16+8+4+2+1)
  0   0   0   0   0   0   0   0       0 = 00000000`)}<p>Zero is a real value with its own pattern, not &ldquo;nothing&rdquo;.</p>`],
  ["224 (a mask value)", `${K.out(`128  64  32  16   8   4   2   1
  1   1   1   0   0   0   0   0     224 = 11100000
224-128=96, 96-64=32, 32-32=0`)}<p>Three ones packed at the left: you'll meet this shape again as a mask value.</p>`],
])}
${K.remember(`<p><b>&ldquo;Fits? One, subtract. Doesn't? Zero, move on.&rdquo;</b> Walk 128 → 1 and finish on zero. Anything left over means you skipped a place.</p>`)}
<h3>Method 2: binary → decimal</h3>
<p>Write the place values above the bits and <b>add the ones under a 1</b>:</p>
${K.out(`128  64  32  16   8   4   2   1
  0   1   1   0   0   1   0   0     =  64 + 32 + 4          = 100
  1   1   1   1   0   0   0   0     = 128 + 64 + 32 + 16    = 240
  0   0   0   0   0   0   0   1     =   1
  1   0   0   0   0   0   0   0     = 128`)}
<p>The last two rows have the same single 1 bit, in different places: <b>position is everything</b>.</p>
<p>You may also see the textbook method of dividing by 2 and reading the remainders bottom to top (10 → 0, 1, 0, 1 → 1010). It works, but it's slower for octets and easy to read upside down.</p>
${K.when([
  ["Subtraction method","One octet, decimal → binary","Left to right, the same layout as masks","Values above 255: split into octets first"],
  ["Add the place values","Binary → decimal","Only additions you already know","—"],
  ["Divide by 2","Large numbers, programming","Works for any size","Exam speed: remainders read in the wrong order"],
  ["Nibbles (via hex)","MACs, EtherTypes, IPv6","One hex digit is exactly four bits","Plain IPv4 octets: an extra step"],
], "Which conversion method, and when")}
${K.mistake(`Dropping leading zeros. 10 is <code>00001010</code>, not <code>1010</code>. The value is the same, but an IPv4 address is four 8-bit columns: write 10.1.1.1 as <code>1010.1.1.1</code> and every bit lands in the wrong column when you line it up against a mask.`)}
${K.mistake(`Writing the bits in reverse: working from the 1s end and copying left to right turns 172 into <code>00110101</code>, which is 53. Write 128 on the <b>left</b> and fill left to right.`)}
<h3>Try it yourself: on paper first</h3>
<p>Write the place-value row, then convert without a calculator. Decimal → binary: <b>200</b>, <b>97</b>, <b>250</b>, <b>64</b>. Binary → decimal: <b>10010110</b>, <b>01111111</b>, <b>11110000</b>.</p>
${K.hint(`97 is under 128, so the first bit is 0, and it's odd, so the last bit is 1. 250 is 255 − 5: start with all ones and turn off the 4 and the 1. <code>01111111</code> is one less than 128.`)}
${K.reveal("Show the answers", `${K.out(`        128  64  32  16   8   4   2   1
200  =    1   1   0   0   1   0   0   0    200-128=72, 72-64=8, 8-8=0
 97  =    0   1   1   0   0   0   0   1    97-64=33, 33-32=1, 1-1=0
250  =    1   1   1   1   1   0   1   0    128+64+32+16+8+2 = 250
 64  =    0   1   0   0   0   0   0   0

10010110 = 128 + 16 + 4 + 2    = 150
01111111 = 64+32+16+8+4+2+1    = 127
11110000 = 128 + 64 + 32 + 16  = 240`)}<p>If you wrote 97 as <code>1100001</code>, the value is right but the leading zero is missing.</p>`)}
${K.q({type:"fill", q:"Convert each decimal value to 8-bit binary.", fields:[{label:"192", a:["11000000","1100 0000"]},{label:"168", a:["10101000","1010 1000"]},{label:"10", a:["00001010","0000 1010"]}], why:"192 = 128 + 64 → 11000000. 168 = 128 + 32 + 8 → 10101000. 10 = 8 + 2 → 00001010, with the leading zeros kept so the octet is eight bits."})}
<p>Now drill it until you stop thinking about it. Every miss shows the full subtraction working.</p>
${K.drill({title:"decimal ↔ binary, one octet at a time", types:["dec2bin","bin2dec"], count:5})}
${K.check({q:"What is 172 in binary?", o:["10101100","10110100","00110101","10101010"], a:0, why:"128 + 32 + 8 + 4 = 172 → 10101100. 00110101 is the same bits reversed (53); 10101010 is 170; 10110100 is 180."})}

<h2>Powers of two and the mask values</h2>
<p>Because each position doubles, the ${K.g("powers of two","Numbers of the form 2^n: 1, 2, 4, 8, 16 … each double the previous one.")} (2<sup>n</sup>, 2 multiplied by itself n times) appear everywhere. Two facts carry most of this module:</p>
<ul>
<li><b>n bits make 2<sup>n</sup> patterns.</b> Each extra bit doubles the count: every old pattern appears once with a 0 in front and once with a 1.</li>
<li><b>The largest value n bits can hold is 2<sup>n</sup> − 1</b>, because counting starts at 0.</li>
</ul>
<p>That answers &ldquo;why is an octet 0–255?&rdquo;: 8 bits give 2<sup>8</sup> = <b>256 patterns</b>; one is <code>00000000</code> = 0; so the largest is <b>255</b>, all eight bits on. There is no ninth bit to hold 256, which is why 192.168.1.256 can't exist.</p>
<div class="tablewrap"><table>
<tr><th>2<sup>n</sup></th><th>Value</th><th>Where it turns up</th></tr>
<tr><td>2<sup>0</sup> – 2<sup>3</sup></td><td>1, 2, 4, 8</td><td>The right-hand place values; 8 bits per octet; a /30 link has 4 addresses (lesson 4)</td></tr>
<tr><td>2<sup>4</sup></td><td>16</td><td>Values in one hex digit</td></tr>
<tr><td>2<sup>5</sup></td><td>32</td><td>Bits in an IPv4 address</td></tr>
<tr><td>2<sup>6</sup>, 2<sup>7</sup></td><td>64, 128</td><td>The left-hand place values; 128 bits in IPv6</td></tr>
<tr><td>2<sup>8</sup></td><td>256</td><td>Values in an octet (0–255)</td></tr>
<tr><td>2<sup>9</sup>, 2<sup>10</sup></td><td>512, 1,024</td><td>Well-known ports are 0–1023 (2<sup>10</sup> values)</td></tr>
<tr><td>2<sup>11</sup></td><td>2,048</td><td>${K.g("EtherType","The 2-byte Type field of an Ethernet frame, naming the protocol inside.")} 0x0800 in decimal</td></tr>
<tr><td>2<sup>12</sup></td><td>4,096</td><td>The 12-bit VLAN ID field (Module 4)</td></tr>
<tr><td>2<sup>13</sup> – 2<sup>15</sup></td><td>8,192 · 16,384 · 32,768</td><td>Keep doubling</td></tr>
<tr><td>2<sup>16</sup></td><td>65,536</td><td>TCP/UDP ports 0–65535; addresses in a /16</td></tr>
</table></div>
<p>Landmark: 2<sup>10</sup> ≈ a thousand, so 2<sup>32</sup>, the whole IPv4 space, is 4,294,967,296: about 4.3 billion. Lesson 2 explains why that ran out. Know 2<sup>0</sup> to 2<sup>10</sup> and 2<sup>16</sup> without thinking; double for the rest.</p>
<h3>The eight mask values</h3>
<p>Now turn bits on <b>one at a time from the left</b>, adding each place value to a running total:</p>
${K.svg("0 0 720 300",
  [128,192,224,240,248,252,254,255].map((v,i)=>{ const y = 8+i*36, n = i+1;
    const bits = [...Array(8)].map((_,j)=>{ const on = j<n, x = 30+j*36;
      return `<rect x="${x}" y="${y}" width="30" height="26" rx="4" fill="${on?"var(--accent)":"var(--panel2)"}" fill-opacity="${on?0.28:1}" stroke="${on?"var(--accent)":"var(--line)"}"/>`+K.txt(x+15,y+18,on?"1":"0",{c:on?"fg":"muted",s:13,mid:true,b:on}); }).join("");
    const add = [128,64,32,16,8,4,2,1][i];
    return bits+K.txt(330,y+18,"= "+v,{c:"accent",s:15,b:true})+K.txt(410,y+18,i===0?"start: 128":"previous + "+add,{c:"fg",s:11.5})+K.txt(700,y+18,n+(n===1?" bit on":" bits on"),{s:11,end:true}); }).join(""),
  "The mask values: ones added from the left. Each step adds the next place value (64, 32, 16 … 1), so the gaps halve each time.")}
${K.out(`bits on:   1    2    3    4    5    6    7    8
value:   128  192  224  240  248  252  254  255
added:        +64  +32  +16   +8   +4   +2   +1`, "The mask-value row.")}
<p>A ${K.g("subnet mask","A 32-bit value written like an IP address (e.g. 255.255.255.0) whose 1 bits mark the network part. Always ones then zeros. Lesson 3.")} is always ones from the left followed by zeros, so <b>every mask octet is 0, 128, 192, 224, 240, 248, 252, 254 or 255</b>. 255.255.255.200 is impossible: 200 is <code>11001000</code>, a gap in the ones. Lesson 3 shows what masks do; for now, own the row.</p>
${K.remember(`<p>Say it as a rhythm: <b>&ldquo;one-twenty-eight, ninety-two, twenty-four, forty; forty-eight, fifty-two, fifty-four, fifty-five&rdquo;</b> (after 128 they all start with 2). To rebuild it: start at 128 and keep adding half of what you last added.</p>`)}
${K.q({type:"match", q:"Match each mask value with its 8-bit pattern.", pairs:[["128","10000000"],["192","11000000"],["240","11110000"],["248","11111000"],["252","11111100"]], why:"Each mask value is a run of ones from the left: 128 is one bit, 192 two, 224 three, 240 four, 248 five, 252 six, 254 seven, 255 eight. Count the ones and you know the value."})}
${K.exam(`There's no calculator in the CCNA exam, only an erasable note board. Conversions are rarely asked directly; they hide inside subnetting and mask questions, and an impossible mask such as 255.255.255.250 is a classic distractor. If a mask octet isn't on the mask-value row, the option is wrong.`)}
${K.check({q:"Which of these is a valid subnet mask?", o:["255.255.255.200","255.255.240.0","255.255.0.255","255.255.255.100"], a:1, why:"240 is 11110000, ones then zeros, so 255.255.240.0 is valid. 200 (11001000) and 100 (01100100) have gaps, and 255.255.0.255 puts ones after zeros."})}

<h2>Hexadecimal: four bits per digit</h2>
<p>Binary is how devices think, but 48 or 128 ones and zeros are unreadable for people. Decimal is short but doesn't line up with bits: you can't see 172's bits by looking at it.</p>
<p>${K.g("Hexadecimal","Base 16: digits 0–9 then A–F (A=10 … F=15). One hex digit = exactly 4 bits.")} (base 16) is the compromise. After 0–9 it borrows letters: <b>A = 10, B = 11, C = 12, D = 13, E = 14, F = 15</b>. Because 16 = 2<sup>4</sup>, <b>one hex digit is exactly one nibble</b> and two hex digits are one octet, so each digit converts to its four bits on its own.</p>
<div class="tablewrap"><table>
<tr><th>Hex</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr>
<tr><th>Binary</th><td>0000</td><td>0001</td><td>0010</td><td>0011</td><td>0100</td><td>0101</td><td>0110</td><td>0111</td></tr>
<tr><th>Hex (decimal)</th><td>8</td><td>9</td><td>A (10)</td><td>B (11)</td><td>C (12)</td><td>D (13)</td><td>E (14)</td><td>F (15)</td></tr>
<tr><th>Binary</th><td>1000</td><td>1001</td><td>1010</td><td>1011</td><td>1100</td><td>1101</td><td>1110</td><td>1111</td></tr>
</table></div>
<p>No need to memorise the binary rows: a nibble is a mini octet with place values <b>8 4 2 1</b>. C = 12 = 8 + 4 → <code>1100</code>.</p>
<p>Hex is usually marked with the ${K.g("0x prefix","A label meaning 'hexadecimal follows', e.g. 0x0800. From the C programming language. Not part of the value.")}: <code>0x10</code> is sixteen, not ten. Wireshark and IOS both use it (<code>Type: IPv4 (0x0800)</code>, <code>Configuration register is 0x2102</code>). MAC and IPv6 addresses skip it because their format already says &ldquo;hex&rdquo;.</p>
<h3>Converting through nibbles</h3>
${K.svg("0 0 720 262",
  K.box(250,8,220,42,"172 (decimal)","one octet",true)+K.arrow(360,50,360,74,"subtraction method")+
  K.txt(247,72,"high nibble",{c:"fg",s:11.5,mid:true,f:"body"})+K.txt(487,72,"low nibble",{c:"fg",s:11.5,mid:true,f:"body"})+
  [1,0,1,0].map((b,j)=>K.band(160+j*45,80,40,30,String(b),b?"var(--chip)":"var(--panel2)")+K.txt(180+j*45,128,String([8,4,2,1][j]),{s:11,mid:true})).join("")+
  [1,1,0,0].map((b,j)=>K.band(400+j*45,80,40,30,String(b),b?"var(--chip)":"var(--panel2)")+K.txt(420+j*45,128,String([8,4,2,1][j]),{s:11,mid:true})).join("")+
  `<line x1="365" y1="78" x2="365" y2="134" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/>`+
  K.arrow(247,136,247,170)+K.arrow(487,136,487,170)+
  K.box(177,172,140,46,"8 + 2 = 10","hex digit A",true)+K.box(417,172,140,46,"8 + 4 = 12","hex digit C",true)+
  K.txt(360,250,"172  =  1010 1100  =  0xAC",{c:"accent",s:15,mid:true,b:true}),
  "Splitting an octet into two nibbles. Each nibble is read with place values 8 4 2 1 and becomes one hex digit: 1010 = A, 1100 = C, so 172 = 0xAC.")}
${K.steps([
  ["Decimal → hex via binary: 168", `<p>168 = <code>1010 1000</code>. <code>1010</code> = 10 = <b>A</b>; <code>1000</code> = <b>8</b>. So 168 = <b>0xA8</b>.</p>`],
  ["Decimal → hex by division: 224", `<p>224 ÷ 16 = <b>14</b> remainder <b>0</b>; 14 = E, so 224 = <b>0xE0</b>. Check: <code>1110 0000</code> → E, 0.</p>`],
  ["Hex → decimal: 0xC0 and 0xFF", `<p>The left digit counts 16s, the right digit 1s. 0xC0 = 12 × 16 + 0 = <b>192</b>. 0xFF = 15 × 16 + 15 = <b>255</b>.</p>`],
  ["Hex → binary: 0x3C", `<p>Digit by digit: 3 = <code>0011</code>, C = <code>1100</code> → <code>0011 1100</code> (= 60). You never need the decimal to get the bits.</p>`],
  ["16 bits: 0x0800", `<p>0 → <code>0000</code>, 8 → <code>1000</code>, 0 → <code>0000</code>, 0 → <code>0000</code>: <code>0000 1000 0000 0000</code>. One bit, in the 2<sup>11</sup> place, so 0x0800 = <b>2048</b>. (Four hex places are worth 4096, 256, 16 and 1: 8 × 256 = 2048.)</p>`],
  ["Counting in hex", `<p>… 08, 09, 0A … 0F, <b>10</b>, 11 … 1F, <b>20</b> … FF, <b>100</b>. So a device's tenth interface MAC ends in <code>…000a</code>, not <code>…0010</code>.</p>`],
])}
${K.remember(`<p><b>&ldquo;One hex digit, four bits; two hex digits, one octet.&rdquo;</b> Letters: <b>C = 12, a dozen</b>; <b>F = 15, the Final digit</b>; count from there.</p>`)}
${K.mistake(`Reading hex as decimal. <code>0x19</code> is 1 × 16 + 9 = <b>25</b>, and <code>0x10</code> is sixteen. In a hex dump, <code>c0 a8 0a 19</code> is 192.168.10.<b>25</b>. A letter warns you; no letter, and you have to remember.`)}
<h3>Try it yourself: hex on paper</h3>
<ol>
<li>Convert <b>0xB4</b> to binary and decimal.</li>
<li>Convert <b>222</b> to hex.</li>
<li>Write the IPv6 EtherType <b>0x86DD</b> in 16-bit binary, then decimal.</li>
<li>In hex, what comes after <b>0x0F</b>, <b>0x19</b> and <b>0xFF</b>?</li>
</ol>
${K.hint(`Work each hex digit as a nibble (8 4 2 1). For 222, divide by 16 and turn quotient and remainder into digits. For 0x86DD in decimal, the places are worth 4096, 256, 16 and 1.`)}
${K.reveal("Show the answers", `${K.out(`1)  0xB4  ->  B = 1011, 4 = 0100  ->  1011 0100
          11 x 16 + 4 = 180     (check: 128+32+16+4 = 180)

2)  222 / 16 = 13 remainder 14  ->  D, E  ->  0xDE   (13 x 16 = 208, +14 = 222)

3)  0x86DD  ->  1000 0110 1101 1101
          8 x 4096 + 6 x 256 + 13 x 16 + 13 = 32768 + 1536 + 208 + 13 = 34525

4)  0x0F -> 0x10     0x19 -> 0x1A     0xFF -> 0x100`)}`)}
${K.drill({title:"hex ↔ decimal ↔ binary, through nibbles", types:["dec2hex","hex2dec","bin2hex"], count:5})}
${K.check({q:"What is 0x3F in decimal?", o:["45","63","48","315"], a:1, why:"3 × 16 + 15 = 63. In binary 0011 1111: 32 + 16 + 8 + 4 + 2 + 1 = 63. 45 comes from reading 3F as decimal tens and units (3 × 10 + 15), which mixes bases."})}

<h2>Hex at work: where you read it for real</h2>
<h3>MAC addresses</h3>
<p>In Module 2 you read a MAC's second hex digit for the I/G and U/L bits. Now you can see why: in <code>3C</code> = <code>0011 1100</code>, the two lowest bits of the first byte both sit in the second nibble, <code>C</code> = <code>1100</code>, and both are 0: unicast, factory address. <code>ffff.ffff.ffff</code> is all 48 bits on, because F = <code>1111</code>. The ${K.g("OUI","Organizationally Unique Identifier: the first 24 bits of a factory MAC, naming the manufacturer.")} is 24 bits, so each manufacturer block holds 2<sup>24</sup> = 16,777,216 addresses.</p>
<h3>EtherTypes and hex dumps</h3>
<p>The 2-byte Type field (Module 1) is always written as four hex digits: <code>0x0800</code> IPv4, <code>0x0806</code> ARP, <code>0x86DD</code> IPv6. Module 1 said every EtherType is at least <code>0x0600</code>: 6 × 256 = <b>1536</b>, above the 1500-byte maximum payload. Now you can check it. In a capture's ${K.g("hex dump","A frame's raw bytes as pairs of hex digits, 16 per row, each row starting with its byte offset (also hex).")}, bytes 0–5 are the destination MAC, 6–11 the source MAC, and 12–13 the EtherType:</p>
${K.out(`0000  00 1e 49 6b 21 c0 3c 52 82 1a 7f 09 08 00 45 00
0010  00 3c 1c 46 40 00 80 06 00 00 c0 a8 0a 19 c0 a8`, "The first 32 bytes of a frame in Wireshark's hex view. The offsets are hex too: 0010 means byte 16.")}
<ul>
<li><code>00 1e 49 6b 21 c0</code> — destination: the default gateway's MAC, as the packet is leaving the LAN.</li>
<li><code>3c 52 82 1a 7f 09</code> — source: the PC, <code>3c52.821a.7f09</code>.</li>
<li><code>08 00</code> — EtherType IPv4. <code>45</code> starts the IPv4 header: high nibble 4 = version 4.</li>
<li><code>80</code> (byte 22) — TTL 0x80 = 128, Windows' starting TTL. <code>06</code> (byte 23) — protocol 6, TCP.</li>
<li><code>c0 a8 0a 19</code> — source IP: 192.168.10.25.</li>
</ul>
<p>Tools decode headers for you, but you can now check raw bytes yourself.</p>
<h3>A preview of IPv6</h3>
<p>An ${K.g("IPv6","Internet Protocol version 6: 128-bit addresses written as eight groups of four hex digits, e.g. 2001:db8::1. It has its own module.")} address is 128 bits written as eight 16-bit groups of four hex digits: <code>2001:0db8:0000:0000:0000:0000:0000:0001</code>, shortened to <code>2001:db8::1</code>. The shortening rules come in the IPv6 module; the conversions are the ones you have already practised.</p>
<h3>The Cisco configuration register</h3>
<p>Every Cisco router has a 16-bit ${K.g("configuration register","A 16-bit hex setting telling a Cisco router how to boot. Default 0x2102; 0x2142 ignores the startup-config.")} that controls how it boots, shown at the end of <code>show version</code>:</p>
${K.out(`ABJ-BR-RTR1#show version
Cisco IOS XE Software, Version 17.09.04a
Cisco IOS Software [Cupertino], ISR Software, Version 17.9.4a, RELEASE SOFTWARE (fc3)
Technical Support: http://www.cisco.com/techsupport

ROM: IOS-XE ROMMON
ABJ-BR-RTR1 uptime is 2 hours, 14 minutes
System returned to ROM by power-on
System image file is "flash:c1100-universalk9.17.09.04a.SPA.bin"

cisco C1111-4P (1RU) processor with 1395406K/6147K bytes of memory.
3 Gigabit Ethernet interfaces
Processor board ID FGL2741X0AB

Configuration register is 0x2102`, "show version on a branch router (the simulator's format, close to a real ISR 1100).")}
<ul>
<li><b>Version 17.9.4a</b> — the software release, in decimal: not everything on a router is hex.</li>
<li><b>uptime / returned to ROM by power-on</b> — how long since boot, and why. &ldquo;power-on&rdquo; after a power cut means the UPS didn't hold.</li>
<li><b>System image file</b> — the IOS file it booted from flash.</li>
<li><b>Processor board ID</b> — the chassis serial number, the one Cisco support asks for. Notice what is <i>not</i> here: a router's <code>show version</code> has no MAC address line. Catalyst switches print a <i>Base Ethernet MAC Address</i> line (the start of the switch's block of MACs, in dotted hex); on a router you read each interface's MAC from <code>show interfaces</code>.</li>
<li><b>Configuration register is 0x2102</b> — the normal setting on most Cisco routers: <code>0010 0001 0000 0010</code>. The last digit, 2, is the boot field (boot IOS normally); the other bits are flags.</li>
</ul>
<p>The other value to know is <b>0x2142</b>, used for password recovery. Compare nibble by nibble: only the third digit differs, <code>0000</code> against <code>0100</code>. That one bit, worth 0x0040, makes the router <b>ignore its startup-config</b> at boot. One digit, one flag.</p>
${K.dyk(`On early Cisco routers the configuration register was a row of physical jumpers on the board. It's software now, but it is still shown as the same four hex digits, and 0x2102 and 0x2142 still mean the same thing.`)}
${K.check({q:"In a hex dump, bytes 12 and 13 of an Ethernet frame are <code>08 06</code>. What follows the Ethernet header?", o:["An IPv4 packet","An ARP message","An IPv6 packet","A VLAN tag"], a:1, why:"0x0806 is ARP. 0x0800 would be IPv4 and 0x86DD IPv6. One digit separates IPv4 from ARP, so read all four."})}
<h3>Try it yourself: find the hex on a real router</h3>
<p>A new branch router on your bench. Find its configuration register and MACs, then address two interfaces and watch IOS turn a mask into a count of one-bits.</p>
${K.hint(`<code>show version | include register</code> shows only the matching line. Interfaces can be typed short: <code>sh int g0/0</code>. Router ports start shut, so you need <code>no shutdown</code>.`)}
${K.term({env:"ios2", title:"hex on a branch router: config register, MACs and masks", opts:{kind:"router", host:"ABJ-BR-RTR1", model:"C1111-4P", mac:"0000.0cd4",
  motd:"ABJ-BR-RTR1 — console session. New branch router on the bench, Abuja office. You are at user EXEC (the > prompt)."},
  intro:"Start with <code>enable</code>. The <code>show</code> commands change nothing; the last tasks configure two interfaces.",
  tasks:[
    {text:"<code>enable</code> to reach privileged EXEC (the <code>#</code> prompt)", done:e=>e.mode!=="user"},
    {text:"<code>show version</code> — find the configuration register at the bottom. Which hex digit is the boot field?", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\w*\s+ver\w*\s*$/i.test(l.cmd))},
    {text:"Show only that line: <code>show version | include register</code>", done:e=>e.log.some(l=>/\|\s*i\w*\s+/i.test(l.cmd) && /Configuration register/.test(l.out))},
    {text:"<code>show interfaces g0/0</code> — read the <i>address is … (bia …)</i> MAC on the second line. Which six hex digits are the manufacturer's OUI?", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/0\s*$/i.test(l.cmd))},
    {text:"List every interface MAC at once: <code>show interfaces | include address is</code> — they count up in hex", done:e=>e.log.some(l=>/int\w*\s*\|\s*i\w*\s+/i.test(l.cmd) && (l.out.match(/address is/g)||[]).length>=3)},
    {text:"Configure <code>g0/0</code> as the LAN gateway: <code>ip address 192.168.10.1 255.255.255.0</code> and <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0"]; return i.ip==="192.168.10.1" && i.mask==="255.255.255.0" && !i.shut; }},
    {text:"Configure <code>g0/1</code> for the CCTV network: <code>ip address 10.20.30.65 255.255.255.192</code> and <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return i.ip==="10.20.30.65" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"Back in privileged EXEC, run <code>show interfaces | include Internet</code> — IOS shows the masks as <b>/24</b> and <b>/26</b>. Count the one-bits yourself to see why", done:e=>e.log.some(l=>/\/26/.test(l.out) && /\/24/.test(l.out) && /Internet address/.test(l.out))},
  ],
  win:"You read a 16-bit register in hex, traced interface MACs counting up in hex from one Cisco block, and saw IOS write 255.255.255.0 as /24 and 255.255.255.192 as /26: 24 ones, and 24 + 2 ones, because 192 is 11000000.",
  solve:["enable","show version","show version | include register","show interfaces g0/0","show interfaces | include address is","configure terminal","interface g0/0","ip address 192.168.10.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.20.30.65 255.255.255.192","no shutdown","end","show interfaces | include Internet"]})}
<p>You should have seen Gi0/0 at <code>0000.0cd4.0001</code>, Gi0/1 at <code>…0002</code>, Gi0/2 at <code>…0003</code>: one block of addresses counting up in hex, all starting <code>0000.0c</code>, the Cisco OUI <code>00-00-0C</code>. (<code>show version</code> printed no MAC at all: on a router, <code>show interfaces</code> is where you read them.) And the masks: 255.255.255.0 is 24 ones (<b>/24</b>); 192 is <code>11000000</code>, so 255.255.255.192 is <b>/26</b>. That count is the ${K.g("prefix length","The number of 1 bits in a subnet mask, written after a slash: 255.255.255.0 = /24.")}, lesson 3's subject, and you worked it out from the mask-value row.</p>

<h2>Exam speed: the whiteboard, the tricks and the traps</h2>
<p>People who understand binary still lose marks to slow or sloppy conversions. The fix is a routine.</p>
${K.tip(`Time yourself with the drills: aim for under ten seconds per octet. Speed comes from repetition, not from more theory.`)}
<h3>The thirty-second whiteboard</h3>
<p>Before the first question, write these rows on the note board:</p>
${K.out(`place values:  128   64   32   16    8    4    2    1
mask values:   128  192  224  240  248  252  254  255
powers of 2:   2^1=2  2^2=4  2^3=8  2^4=16  2^5=32  2^6=64
               2^7=128  2^8=256  2^9=512  2^10=1024`)}
<p>With the first two rows aligned, each column describes a mask octet: 240 sits under 16, so it's four ones and the last one is worth 16. Lessons 4 and 5 lean on that alignment.</p>
<h3>Tricks that save seconds</h3>
<ul>
<li><b>Odd or even?</b> Odd numbers end in 1. <b>Under 128?</b> The first bit is 0.</li>
<li><b>Near 255? Subtract from 255.</b> 250 = 255 − 5 = 255 − (4 + 1): all ones with the 4 and 1 off → <code>11111010</code>. 253 → <code>11111101</code>.</li>
<li><b>Doubling shifts left.</b> 10 = <code>00001010</code>, 20 = <code>00010100</code>, 40 = <code>00101000</code>.</li>
<li><b>Count set bits for masks.</b> 255.255.255.224 = 8 + 8 + 8 + 3 = <b>/27</b>; the mask row tells you 224 is three ones.</li>
<li><b>Long values go through hex.</b> Convert a MAC or a 16-bit value digit by digit. Never convert a whole MAC to decimal.</li>
</ul>
${K.q({type:"order", q:"Put the steps of the subtraction method for converting a decimal octet to binary in the correct order.", items:["Write the place values 128 64 32 16 8 4 2 1 from left to right","Start at 128 and ask whether it fits into the number","If it fits, write 1 and subtract it; if not, write 0","Move to the next place value and repeat until you reach 1","Check that nothing is left over and that you have exactly eight bits"], why:"The method runs left to right, 128 down to 1. Writing the row first prevents skipped columns; the final check (remainder zero, eight digits) catches a skipped value or a dropped leading zero."})}
${K.myth([
  ["Network engineers can get by on decimal.","Masks, prefixes, subnets, wildcards and summaries are defined in bits. Skip binary and you memorise tables you can't check."],
  ["An octet goes up to 256.","It has 256 <i>values</i>, but one is 0, so the largest is 255."],
  ["Hex is a different kind of data from binary.","It's a shorter way of <i>writing</i> the same bits: 0xAC, 10101100 and 172 are one value."],
  ["Leading zeros don't matter.","Not to a number alone. But each address octet is exactly eight bits; drop zeros and bits shift into the wrong columns against a mask."],
  ["0x0800 and 800 are the same number.","0x0800 is hex: 8 × 256 = 2048."],
])}
${K.dodont([
  "Write the place-value row before any conversion.",
  "Write every octet as eight digits.",
  "Check by converting your answer back.",
  "Convert hex one digit (four bits) at a time.",
],[
  "Fill bits from the right and copy them left: that reverses them.",
  "Read hex digits as decimal: 0x19 is 25.",
  "Convert whole MAC or IPv6 addresses to decimal.",
  "Trust a vendor sheet's mask without checking each octet is a mask value.",
])}
${K.exam(`Distractors are often one bit apart: 255.255.255.240 versus .248, or 0x0800 versus 0x0806. Convert the octet that matters and check it against your whiteboard before choosing.`)}
${K.drill({title:"exam warm-up: every conversion type, mixed", types:["dec2bin","bin2dec","dec2hex","hex2dec","bin2hex"], count:10})}
${K.check({q:"A colleague writes 10.1.5.9 in binary as <code>1010.1.101.1001</code>. What is wrong?", o:["Nothing; the values are correct","The octets are missing their leading zeros: each must be eight bits, 00001010.00000001.00000101.00001001","The bits are reversed","Binary can't be used for IP addresses"], a:1, why:"Each value is right on its own, but an address is four 8-bit octets. Without leading zeros the 32 bits don't line up with a 32-bit mask, and every later step goes wrong."})}

${K.job("A time-clock that can't reach the HR server — read in hex",`
<p><b>The ticket.</b> &ldquo;Abuja office, reception. The new biometric time-clock can't upload clock-ins to the HR server, 192.168.20.15. The installer says our network is blocking it.&rdquo;</p>
<p><b>Questions first.</b> Anything else at reception affected? <i>&ldquo;No, the PCs are fine.&rdquo;</i> How was the clock set up? <i>&ldquo;Static address from the vendor's sheet, 192.168.10.77.&rdquo;</i> One new, hand-configured device: suspect its settings before the network.</p>
<p><b>Check 1 — is it on the switch?</b> Its label says <code>4C-11-AE-0D-2F-31</code>, Cisco format <code>4c11.ae0d.2f31</code>:</p>
${K.out(`ABJ-RCP-SW1#show mac address-table address 4c11.ae0d.2f31
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    4c11.ae0d.2f31    DYNAMIC     Gi1/0/12
Total Mac Addresses for this criterion: 1`)}
<p>Learned on Gi1/0/12 in VLAN 10: cable, port and switch are fine.</p>
<p><b>Check 2 — what is it sending?</b> A colleague captures its traffic on a ${K.g("mirror port","A switch port that receives a copy of another port's traffic for a capture tool (Cisco calls it SPAN).")}. This frame repeats every second:</p>
${K.out(`Ethernet II, Src: 4c:11:ae:0d:2f:31, Dst: ff:ff:ff:ff:ff:ff
    Type: ARP (0x0806)
Address Resolution Protocol (request)

0000  ff ff ff ff ff ff 4c 11 ae 0d 2f 31 08 06 00 01
0010  08 00 06 04 00 01 4c 11 ae 0d 2f 31 c0 a8 0a 4d
0020  00 00 00 00 00 00 c0 a8 14 0f`)}
<p>Destination all ones: broadcast. Type <code>08 06</code>: ARP, not IPv4. Sender <code>c0 a8 0a 4d</code> = 192.168.10.77 (0x4D = 4 × 16 + 13). Target <code>c0 a8 14 0f</code> = 192.168.<b>20</b>.15 (0x14 = 20). The clock is sending ARP requests <i>directly</i> for the server, as if it were local, instead of for its gateway (<code>c0 a8 0a 01</code>). Nobody answers: the server is in another VLAN, and this site's gateway has proxy ARP disabled (IOS enables it by default; Module 2 lesson 5).</p>
<p><b>Check 3 — why does it think the server is local?</b> The vendor's sheet:</p>
${K.out(`IP address : 11000000.10101000.00001010.01001101
Subnet mask: 11111111.11111111.00000000.00000000
Gateway    : 11000000.10101000.00001010.00000001`)}
<p>The mask converts to 255.255.<b>0.0</b>; the reception VLAN uses 255.255.255.0 (a working PC's <code>ipconfig</code> confirms it). With 255.255.0.0 the clock treats every 192.168.x.x address as local and never uses the gateway. Lesson 3 shows how the mask makes that decision; the binary was enough to spot it.</p>
<p><b>The fix.</b> In the clock's admin menu, set the mask to 255.255.255.0, keep gateway 192.168.10.1, save. The next capture shows one ARP for 192.168.10.1, then Type <code>08 00</code> frames to the router's MAC. HR confirms the clock-ins arrived.</p>
<p><b>What you say.</b> To the installer: &ldquo;The network wasn't blocking it: the clock's mask was 255.255.0.0, not 255.255.255.0, so it looked for the server on the wrong network. Please correct your sheet.&rdquo; To HR: &ldquo;Fixed; one wrong setting on the clock. Monday's clock-ins have uploaded.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Reception time-clock 192.168.10.77 (4c11.ae0d.2f31, Gi1/0/12, VLAN 10) not uploading to HR 192.168.20.15. Capture: repeated ARP (0x0806) for 192.168.20.15, no IPv4. Cause: mask 255.255.0.0 from vendor sheet (11111111.11111111.00000000.00000000); site is /24. Set 255.255.255.0, gw 192.168.10.1. Verified ARP for gateway then IPv4 to router; HR confirmed. Vendor informed. 35 min.&rdquo;</i></p>`)}

${K.case("The register that took a branch offline",`
<p>An MSP engineer in Port Harcourt recovered a forgotten password on a branch router the standard way: set the register to <b>0x2142</b> so the router boots ignoring its startup-config, copy the saved config back in, set a new enable secret, save. Everything worked. She missed one step: setting the register back to <b>0x2102</b>. Nothing looked wrong, because the register is only read at boot.</p>
<p>Three weeks later a long power cut drained the UPS. The router rebooted, saw the 0x0040 bit still on, ignored its configuration, and came up offering the initial configuration dialog. Thirty staff had no network.</p>
<p>The on-call engineer consoled in; <code>show version</code> ended with <code>Configuration register is 0x2142</code>. Against 0x2102, the 4 in place of the 0 was one bit: &ldquo;ignore startup-config&rdquo;. The config was still safe in NVRAM. He ran <code>copy startup-config running-config</code>, did <code>no shutdown</code> on each interface (a merge never turns interfaces back on), set <code>config-register 0x2102</code> and saved. <code>show version</code> now read <code>Configuration register is 0x2142 (will be 0x2102 at next reload)</code>.</p>
<p>The MSP's checklist gained two lines: <b>set the register back to 0x2102</b> and <b>confirm with show version before closing</b>. Four hex digits decide how a router boots; reading them as bits turned an outage into a two-minute diagnosis.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Say the place values first, then walk them out loud: &ldquo;does 128 fit?&rdquo;. Finish by checking the sum.`)}
${K.reveal("“Convert 172 to binary, out loud.”",`<p>"Place values 128, 64, 32, 16, 8, 4, 2, 1. 128 fits into 172: 1, leaving 44. 64 doesn't fit: 0. 32 fits: 1, leaving 12. 16 doesn't: 0. 8 fits: 1, leaving 4. 4 fits: 1, leaving 0. 2 and 1 are 0. So 1010 1100. Check: 128 + 32 + 8 + 4 = 172. In hex that's 0xAC."</p><p>They want to hear a <i>method</i> and a check, not a memorised answer.</p>`)}
${K.hint(`Bits → number of patterns → why counting starts at zero.`)}
${K.reveal("“Why is the maximum value of an octet 255?”",`<p>"Eight bits, two states each, so 2 to the 8, 256 patterns. Counting starts at zero, all bits off, so the values run 0 to 255. 255 is all eight bits on: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1. That's why no IPv4 or mask octet can exceed 255."</p>`)}
${K.hint(`One hex digit is how many bits? Then readability, and where you see it.`)}
${K.reveal("“Why are MAC and IPv6 addresses written in hex rather than decimal?”",`<p>"One hex digit is exactly four bits, so hex maps cleanly onto the binary. A 48-bit MAC is 12 hex digits, a 128-bit IPv6 address 32, and each digit converts to its bits on its own, so flags like the MAC's I/G bit are easy to read. Decimal doesn't line up with bit boundaries and binary is too long. EtherTypes like 0x0800 and the config register 0x2102 use hex for the same reason."</p>`)}

${K.recap([
  "Devices work in bits because two states are easy to tell apart. 4 bits = a nibble; 8 bits = a byte = an octet.",
  "Octet place values: 128 64 32 16 8 4 2 1. The value is the sum of the places holding a 1.",
  "Decimal → binary: walk 128 to 1; fits → 1 and subtract, else 0. Always eight digits.",
  "n bits give 2^n values, 0 to 2^n − 1: an octet holds 0–255. Know 2^0 to 2^10 and 2^16 = 65,536.",
  "Mask values, bits added from the left: 128 192 224 240 248 252 254 255.",
  "Hex: one digit = four bits; A=10 … F=15. 172 = 1010 1100 = 0xAC.",
  "Hex at work: MACs (12 digits), EtherTypes 0x0800 / 0x0806 / 0x86DD, IPv6 (128 bits), config register 0x2102 (0x2142 ignores startup-config).",
  "Exam: whiteboard rows first; keep leading zeros; fill bits left to right; 0x19 is 25.",
])}
${K.next(`<b>Lesson 2 — IPv4 addresses.</b> With octets mastered, you'll take a whole 32-bit IPv4 address apart: network and host parts, the old classes, private versus public ranges, and the special addresses (0.0.0.0, 127.0.0.1, 169.254.x.x, 255.255.255.255) every engineer must recognise on sight.`)}
`,
quiz:[
  {lvl:1, q:"How many bits are in one octet?", o:["4","8","16","32"], a:1, why:"An octet is exactly eight bits. Four bits is a nibble (one hex digit); an IPv4 address is 32 bits, four octets."},
  {lvl:1, q:"What is the decimal value 192 in 8-bit binary?", o:["11000000","10100000","00000011","11100000"], a:0, why:"192 = 128 + 64, so the two leftmost bits are on: 11000000. 11100000 is 224; 00000011 is the same two bits written in reverse (3)."},
  {lvl:1, q:"Why is 255 the largest value an octet can hold?", o:["Because IPv4 reserves 256 for broadcasts","Because 8 bits give 2^8 = 256 patterns, and counting starts at 0, so the values are 0 to 255","Because the eighth bit is a parity bit","Because routers can't process numbers above 255"], a:1, why:"Eight bits give 256 different patterns. One of them is all zeros (0), so the values run 0 to 255, and 255 is all eight bits on."},
  {lvl:1, type:"match", q:"Match each hexadecimal digit with its 4-bit binary value.", pairs:[["A","1010"],["F","1111"],["7","0111"],["C","1100"],["9","1001"]], why:"Each hex digit is one nibble, read with place values 8 4 2 1: A = 10 = 8 + 2, F = 15 = all four bits, 7 = 4 + 2 + 1, C = 12 = 8 + 4, 9 = 8 + 1."},
  {lvl:1, type:"fill", q:"How many different values can 16 bits represent (for example, TCP and UDP port numbers)?", fields:[{label:"Values", a:["65536","65,536"]}], why:"2^16 = 65,536. Port numbers therefore run from 0 to 65,535."},
  {lvl:2, q:"What is the binary value 10101100 in decimal?", o:["172","53","170","204"], a:0, why:"Add the place values under each 1: 128 + 32 + 8 + 4 = 172. 53 is what you get if you read the bits backwards (00110101); 170 is 10101010; 204 is 11001100."},
  {lvl:2, type:"multi", q:"Which two of these values can appear as an octet of a valid subnet mask? (Choose two.)", o:["224","252","200","230","96"], a:[0,1], why:"A mask octet is a run of ones from the left, so it must be 0, 128, 192, 224, 240, 248, 252, 254 or 255. 224 = 11100000 and 252 = 11111100 qualify. 200 = 11001000, 230 = 11100110 and 96 = 01100000 all have a gap or start with a zero."},
  {lvl:2, type:"order", q:"Put the steps for converting the decimal value 168 to hexadecimal through binary in the correct order.", items:["Convert 168 to 8-bit binary: 10101000","Split the octet into two nibbles: 1010 and 1000","Read each nibble with place values 8 4 2 1: 10 and 8","Write each value as a hex digit: A and 8, giving 0xA8"], why:"Binary first, because one hex digit is exactly four bits. Split into nibbles, value each nibble 0 to 15, then write the digits, using A to F for 10 to 15."},
  {lvl:2, q:"Based on the exhibit from a capture tool's hex view, what does the frame carry after the Ethernet header?", ex:"0000  00 1e 49 6b 21 c0 3c 52 82 1a 7f 09 08 06 00 01\n0010  08 00 06 04 00 01 3c 52 82 1a 7f 09 c0 a8 0a 19", o:["An IPv4 packet, because 08 00 appears in the second row","An ARP message, because bytes 12 and 13 are 08 06","An IPv6 packet","A VLAN-tagged frame"], a:1, why:"After the 6-byte destination and 6-byte source MACs, bytes 12 and 13 are the EtherType: 0x0806 = ARP. The 08 00 in the second row is inside the ARP message (the protocol type it is resolving, IPv4), not the frame's EtherType."},
  {lvl:2, q:"A camera vendor's manual lists the subnet mask as 11111111.11111111.11111111.11100000. Which dotted-decimal mask do you enter on the device?", o:["255.255.255.224","255.255.255.240","255.255.255.192","255.255.255.7"], a:0, why:"The first three octets are all ones, 255. The last is three ones from the left: 128 + 64 + 32 = 224. 240 would be four ones and 192 two; 7 is 00000111, the bits reversed."},
  {lvl:2, type:"fill", q:"Wireshark shows Type: IPv4 (0x0800). What is 0x0800 in decimal?", fields:[{label:"Decimal", a:["2048","2,048"]}], why:"In a 4-digit hex number the positions are worth 4096, 256, 16 and 1. 0x0800 = 8 × 256 = 2048. In binary it's 0000 1000 0000 0000: a single bit in the 2^11 position."},
  {lvl:2, type:"fill", q:"On a router at the privileged EXEC prompt, which command shows only the configuration register line from show version, using an output filter?", fields:[{label:"Command", a:["show version | include register","show version | include Configuration register","show version | i register","show version | inc register","sh ver | i register","show ver | i register","sh version | i register"], ios:true}], why:"show version | include register filters the long show version output down to the line containing 'register', for example Configuration register is 0x2102."},
  {lvl:3, q:"After a power cut, a branch router comes up asking 'Would you like to enter the initial configuration dialog?'. Last month it had a password recovery. Based on the exhibit, what is the most likely cause and the right fix?", ex:"BR-RTR#show version | include register\nConfiguration register is 0x2142", o:["NVRAM has failed; replace the router","The register still has the bit worth 0x0040 set, so the router ignored its startup-config at boot. Copy startup-config to running-config, no shutdown the interfaces, set config-register 0x2102 and save","The register is the factory default; restore the configuration from backup","0x2142 means the IOS image is missing; reload from TFTP"], a:1, why:"0x2142 differs from the default 0x2102 in one hex digit: 4 (0100) instead of 0 (0000). That bit tells the router to ignore the startup-config, a setting used for password recovery and never put back. The configuration is still in NVRAM: copy it in, bring the interfaces up (a merge doesn't un-shut them), set the register back to 0x2102 and save."},
  {lvl:3, q:"A newly installed badge reader at 192.168.10.77 can reach devices in 192.168.10.0/24 but not the access-control server at 192.168.20.15. A capture shows it repeatedly sending ARP requests for 192.168.20.15. Its settings sheet shows the mask as 11111111.11111111.00000000.00000000. What is wrong?", o:["The gateway address is wrong","The mask is 255.255.0.0 instead of the site's 255.255.255.0, so the device thinks 192.168.20.15 is on its own network and ARPs for it instead of using the gateway","The server's switch port is shut down","The MAC address is a multicast address"], a:1, why:"The mask in binary is 16 ones: 255.255.0.0. With that mask the device treats every 192.168.x.x address as local, so it ARPs directly for the server, which is in another subnet and never replies. Correcting the mask to 255.255.255.0 makes it send that traffic to the gateway."},
  {lvl:3, type:"multi", q:"You are reading the start of a captured frame in hex (exhibit). Which two statements are true? (Choose two.)", ex:"0000  ff ff ff ff ff ff 3c 52 82 1a 7f 09 08 06 00 01\n0010  08 00 06 04 00 01 3c 52 82 1a 7f 09 c0 a8 0a 19\n0020  00 00 00 00 00 00 c0 a8 0a 01", o:["The frame is a broadcast: all 48 bits of the destination MAC are 1","The sender is asking for the MAC address of 192.168.10.1","The payload is an IPv4 packet, EtherType 0x0800","The sender's IP address is 192.168.10.19","The source MAC is a group (multicast) address"], a:[0,1], why:"ff ff ff ff ff ff is all ones: broadcast. EtherType 08 06 is ARP, and the target IP c0 a8 0a 01 = 192.168.10.1. The sender IP c0 a8 0a 19 is 192.168.10.25, because 0x19 = 25, not 19. The source MAC's first byte 3c = 0011 1100 ends in 0, so it is unicast."},
],
cards:[
  {f:"Bit, nibble, byte, octet", b:"Bit = one binary digit (0 or 1). Nibble = 4 bits = one hex digit. Byte = 8 bits. Octet = exactly 8 bits; the word networking standards use."},
  {f:"Octet place values", b:"128 64 32 16 8 4 2 1, left to right (2^7 down to 2^0). The octet's value is the sum of the places holding a 1."},
  {f:"Why is the maximum octet value 255?", b:"8 bits give 2^8 = 256 patterns; counting starts at 0, so the range is 0 to 255. 255 = all eight bits on."},
  {f:"Subtraction method (decimal to binary)", b:"Walk 128 to 1. If the place value fits into what is left, write 1 and subtract; otherwise write 0. End on zero, with eight digits."},
  {f:"n bits hold how many values?", b:"2^n values, from 0 to 2^n − 1. 8 bits: 256 (0–255). 12 bits: 4,096. 16 bits: 65,536 (0–65,535)."},
  {f:"Powers of two to know cold", b:"1 2 4 8 16 32 64 128 256 512 1024 (2^0 to 2^10), and 2^16 = 65,536. 2^32 ≈ 4.3 billion IPv4 addresses."},
  {f:"The mask values", b:"128 192 224 240 248 252 254 255: one to eight bits on from the left. Each step adds half the previous step (+64, +32 … +1)."},
  {f:"Hex digits A to F", b:"A = 10, B = 11, C = 12, D = 13, E = 14, F = 15. One hex digit = 4 bits; two hex digits = one octet."},
  {f:"Converting decimal to hex", b:"Convert to 8-bit binary, split into two nibbles, value each with 8 4 2 1, write as hex. 172 = 1010 1100 = 0xAC. Or divide by 16: quotient and remainder."},
  {f:"What does the 0x prefix mean?", b:"The digits that follow are hexadecimal. 0x10 = 16, 0x19 = 25, 0x0800 = 2048. The prefix is a label, not part of the value."},
  {f:"Common EtherTypes", b:"0x0800 = IPv4, 0x0806 = ARP, 0x86DD = IPv6. Every EtherType is 0x0600 (1536) or higher. Bytes 12 and 13 of the frame."},
  {f:"Config register 0x2102 vs 0x2142", b:"0x2102: the normal boot setting on most Cisco routers. 0x2142: one extra bit (0x0040) that ignores the startup-config, used for password recovery. Shown at the end of show version."},
  {f:"Two conversion mistakes that cost marks", b:"Dropping leading zeros (10 must be 00001010) and writing bits in reverse (172 = 10101100, not 00110101)."},
],
});
// ---------- Module 3 · Lesson 2 ----------
L.push({
id:"ip-v4", mins:65, level:"Beginner · builds on lesson 1",
t:"IPv4 addresses: structure, classes, private vs public, and the special addresses",
html:`
${K.goals([
  "Write any IPv4 address as 32 bits in four octets, and point to its network part and host part.",
  "Name the class of an address from its first octet, give its default mask, and explain why CIDR replaced classes in 1993.",
  "Recite the three RFC 1918 private ranges, say why they exist, and explain who hands out public addresses (IANA → AFRINIC and the other RIRs → ISPs).",
  "Recognise the special addresses on sight: 0.0.0.0, 255.255.255.255, 127/8, 169.254/16, 100.64/10, the documentation ranges and multicast.",
  "Tell from an address alone why a laptop reaches nothing (169.254) or why a home server can't be reached from the internet (100.64).",
])}
${K.pre(["Lesson 1 of this module: the place values 128 64 32 16 8 4 2 1 and converting 0–255 to and from binary.","Module 1 (IP addresses, default gateway, <code>ipconfig</code>, ping) and Module 2 lesson 4 (ARP and Layer 2 broadcasts)."])}

<h2>Why this matters at work</h2>
<p>A first-line engineer at a Lagos MSP takes two calls before 10 a.m. A finance officer's laptop shows <code>169.254.112.25</code>. A developer working from home has a router address starting <code>100.72</code>. Both say &ldquo;the internet is broken&rdquo;. The engineer knows from the numbers alone that these are two different problems — one in the office, one at the ISP — and that neither is &ldquo;the internet&rdquo;.</p>
<p>This lesson builds that recognition. An address's block tells you whether it is private or public, whether DHCP worked, and whether the internet can reach it — knowledge you'll use in every design, firewall rule and many CCNA questions.</p>

<h2>An IPv4 address, bit by bit</h2>
<p>An ${K.g("IPv4 address","A 32-bit number identifying one interface on an IP network, written as four decimal octets.")} is a <b>32-bit</b> number. Thirty-two binary digits are unreadable for people, so we cut them into four groups of 8 bits called ${K.g("octets","Groups of 8 bits. Each IPv4 octet holds 0–255.")}, write each in decimal and put dots between them: ${K.g("dotted decimal","Four decimal octets separated by dots, e.g. 192.168.10.25.")}.</p>
<p>An octet holds 2⁸ = 256 values, <b>0 to 255</b>, so <code>192.168.300.1</code> isn't an address — 300 needs a ninth bit. Thirty-two bits give 2³² = <b>4,294,967,296</b> addresses: fewer than the people on Earth, let alone their devices.</p>
${K.svg("0 0 720 240",
  K.txt(360,26,"192.168.10.25",{c:"fg",s:18,mid:true,b:true})+
  K.box(40,48,150,48,"192","11000000",true)+K.box(200,48,150,48,"168","10101000",true)+K.box(360,48,150,48,"10","00001010",true)+K.box(520,48,150,48,"25","00011001",true)+
  K.txt(115,114,"octet 1 · bits 1–8",{mid:true})+K.txt(275,114,"octet 2 · bits 9–16",{mid:true})+K.txt(435,114,"octet 3 · bits 17–24",{mid:true})+K.txt(595,114,"octet 4 · bits 25–32",{mid:true})+
  K.band(40,132,470,32,"NETWORK part — which network (the street)","var(--chip)")+
  K.band(520,132,150,32,"HOST part — which device","var(--panel2)")+
  K.txt(360,192,"Here the split falls after 24 bits (a /24). The mask, in lesson 3, says where the split is.",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(360,214,"Every device on the same network shares the network part; each has its own host part.",{s:11,mid:true,f:"body"}),
  "One address, four octets, 32 bits. The binary uses lesson 1's place values: 192 = 128 + 64; 168 = 128 + 32 + 8; 10 = 8 + 2; 25 = 16 + 8 + 1.")}
<h3>Two parts: the network and the host</h3>
<p>The left-hand bits are the ${K.g("network part","Leading bits shared by every device on the same network. Routers forward using this part.")}, shared by every device on that network. The right-hand bits are the ${K.g("host part","Trailing bits that identify one device within its network.")}, different for each device.</p>
${K.analogy(`<p>A postal address in Ikeja: <i>&ldquo;Allen Avenue, house 25&rdquo;</i>. The street is the network part — the sorting office routes letters by street alone. The house number is the host part, which only matters once the letter reaches the street. Routers are the sorting offices.</p>`)}
<p>Why split it? Routers can't list four billion addresses, so they keep one entry per <i>network</i>: &ldquo;everything starting 192.168.10 goes out this port&rdquo;. And a PC (Module 1) delivers directly to its own network but sends everything else to its gateway; comparing network parts is how it decides.</p>
<p>Where the split falls is set by the ${K.g("subnet mask","A 32-bit value whose 1-bits mark the network part. Lesson 3.")} (lesson 3). Here you'll meet splits on octet boundaries, written as a ${K.g("prefix length","The number of network bits after a slash: /8, /16, /24.")} such as <code>/24</code>. Two more ideas you'll need: host bits all 0 name the network itself (<code>192.168.10.0</code>); host bits all 1 are its broadcast (<code>192.168.10.255</code>).</p>
${K.check({q:"Which of these is NOT a valid IPv4 address?", o:["10.0.0.255","172.31.0.1","192.168.256.1","0.0.0.0"], a:2, why:"Each octet is 8 bits, so 0–255 only; 256 needs a ninth bit. The others are valid (0.0.0.0 has a special meaning, below)."})}

<h2>Classful addressing: Classes A to E</h2>
<p>In 1981 there were no masks. The <b>first bits of the first octet</b> decided where the network part ended: ${K.g("classful addressing","The original scheme: the leading bits fix the class, and the class fixes the network/host split. Replaced by CIDR in 1993.")}. It hasn't run the internet for more than thirty years, but the CCNA tests it, engineers still say &ldquo;a Class C&rdquo; for a /24, and the ranges are the fastest first look at any address.</p>
<div class="tablewrap"><table>
<tr><th>Class</th><th>First bits</th><th>First octet</th><th>Default mask</th><th>Networks × hosts</th><th>Use</th></tr>
<tr><td><b>A</b></td><td><code>0</code>…</td><td>1–126</td><td>255.0.0.0 · /8</td><td>126 × 16,777,214</td><td>Huge networks</td></tr>
<tr><td><b>B</b></td><td><code>10</code>…</td><td>128–191</td><td>255.255.0.0 · /16</td><td>16,384 × 65,534</td><td>Medium networks</td></tr>
<tr><td><b>C</b></td><td><code>110</code>…</td><td>192–223</td><td>255.255.255.0 · /24</td><td>2,097,152 × 254</td><td>Small networks</td></tr>
<tr><td><b>D</b></td><td><code>1110</code>…</td><td>224–239</td><td>none</td><td>—</td><td>${K.g("Multicast","Traffic to a group address; every device that joined the group receives it.")} groups</td></tr>
<tr><td><b>E</b></td><td><code>1111</code>…</td><td>240–255</td><td>none</td><td>—</td><td>Reserved (&ldquo;experimental&rdquo;)</td></tr>
</table></div>
<p>The numbers follow from the bits. Class A fixes one bit, leaving 7 network bits: 2⁷ = 128 networks, minus 0 and 127 (reserved) = 126, each with 24 host bits: 2²⁴ − 2 = 16,777,214 hosts (the 2 are the network and broadcast addresses). Class B fixes two bits, leaving 14: 2¹⁴ = 16,384 networks of 2¹⁶ − 2 = 65,534. Class C fixes three, leaving 21: 2²¹ networks of 2⁸ − 2 = 254. Class A alone is <b>half</b> the IPv4 space, B a quarter, C an eighth.</p>
${K.remember(`<b>The boundaries are 128, 192, 224, 240</b> — the same numbers you'll meet as mask values in lesson 3. B starts at 128 (10000000), C at 192 (11000000), D at 224 (11100000), E at 240 (11110000). Count the leading 1s: A none, B one, C two, D three, E four. Default masks grow an octet at a time: /8, /16, /24.`)}
<h3>Worked examples: the class from the first octet</h3>
${K.steps([
  ["172.20.14.9", `<p>172: 128 fits (44 left) → 1; 64 → 0; 32 fits (12 left) → 1; 16 → 0; 8 fits (4 left) → 1; 4 fits → 1; 2 → 0; 1 → 0. So 172 = <code>1010 1100</code>. Leading <code>10</code> → <b>Class B</b>, default /16: classful network <code>172.20</code>, host <code>14.9</code>.</p>`],
  ["223.1.1.1", `<p>223 = 128+64+16+8+4+2+1 = <code>1101 1111</code>. Leading <code>110</code> → <b>Class C</b> (the last one), default /24.</p>`],
  ["224.0.0.10", `<p>224 = 128+64+32 = <code>1110 0000</code>. Leading <code>1110</code> → <b>Class D</b>, multicast — a group (${K.g("EIGRP","Enhanced Interior Gateway Routing Protocol: Cisco's routing protocol that lets routers share the networks they know about. Routing protocols come in later modules.")} routers use this one), never a host's own address.</p>`],
  ["127.0.0.1", `<p>127 = <code>0111 1111</code>. Leading <code>0</code>, so its bits say Class A — but the whole 127 block is reserved for <b>loopback</b>. That's why Class A is 1–126.</p>`],
])}
<h3>Try it yourself: classes on paper</h3>
<p>Write the first octet in binary, the class, and the default mask: <b>(a)</b> 10.200.3.4 <b>(b)</b> 191.255.0.1 <b>(c)</b> 192.0.2.44 <b>(d)</b> 239.255.255.250 <b>(e)</b> 128.1.1.1 <b>(f)</b> 245.10.10.10</p>
${K.hint(`Only the first octet matters. Compare it with 128, 192, 224 and 240, or convert it and count the leading 1s.`)}
${K.reveal("Show the answers",`<ol type="a">
<li>10 = <code>0000 1010</code> → <b>A</b>, /8.</li>
<li>191 = <code>1011 1111</code> → <b>B</b>, /16 (the last B).</li>
<li>192 = <code>1100 0000</code> → <b>C</b>, /24 (the first C; also a documentation address, below).</li>
<li>239 = <code>1110 1111</code> → <b>D</b>, multicast, no mask.</li>
<li>128 = <code>1000 0000</code> → <b>B</b>, /16 (the first B).</li>
<li>245 = <code>1111 0101</code> → <b>E</b>, reserved.</li>
</ol>`)}
<p>Now drill it until the first octet's bits appear without effort:</p>
${K.drill({title:"first-octet bits: decimal ↔ binary", types:["dec2bin","bin2dec"], count:5})}
${K.exam(`Expect &ldquo;Which class is 191.x?&rdquo;, &ldquo;Which first octets are valid Class C: 191, 192, 223, 224?&rdquo; (192 and 223) and &ldquo;Default mask of Class B?&rdquo; (255.255.0.0). Traps: <b>127</b> starts with a 0 bit but is loopback, not a Class A network; <b>224</b> is D, not C.`)}
${K.check({q:"A colleague calls 200.10.4.7 &ldquo;a Class B address&rdquo;. What do you tell them?", o:["Right — it is in 128–191","Wrong — 200 is in 192–223, so it is Class C, default /24","Wrong — it is Class A","Wrong — 200 is multicast"], a:1, why:"200 = 11001000, leading bits 110: Class C (192–223), default mask 255.255.255.0."})}

<h2>From classes to CIDR (Classless Inter-Domain Routing): why classful addressing was abandoned</h2>
<p><b>Waste.</b> There were three sizes only: 254, 65,534 or 16.7 million hosts. A university with 2,000 computers was too big for a Class C, so it got a Class B and left 63,500 addresses unused that nobody else could use. Early arrivals got whole Class As. By 1992 free Class B networks were running out.</p>
${K.dyk(`Some early holders still have entire former Class A blocks: Apple has <code>17.0.0.0/8</code> and Ford <code>19.0.0.0/8</code> — about 16.7 million addresses each. That early generosity is part of why IPv4 ran out.`)}
<p><b>Routing tables exploding.</b> The stopgap — several Class Cs instead of one B — meant several entries per company in every core router. ${K.g("Routing tables","A router's list of known networks and where to send packets for each.")} grew faster than router memory.</p>
<p><b>The answer: CIDR, 1993.</b> ${K.g("CIDR","Classless Inter-Domain Routing (RFC 1518/1519, 1993): the network/host split can fall after any bit, written as a /prefix.")} — Classless Inter-Domain Routing — says: forget classes; the split can fall after <b>any</b> bit, written with a slash. Instead of a Class B you can get a <code>/22</code> (1,022 hosts), sized to need. And an ISP can advertise its whole block as <b>one</b> route however many customers it serves: ${K.g("route aggregation","Advertising many smaller networks as one larger prefix (summarisation). Keeps routing tables small.")}, which you'll practise in lesson 6.</p>
${K.mistake(`Assuming an address uses its class's default mask. <code>172.20.14.9</code> is in the Class B range, but on a real network it could be in a /24, /27 or /30. <b>The class is history; only the mask (lesson 3) tells you the network.</b>`)}
${K.check({q:"Which two problems did CIDR (1993) solve?", o:["Addresses too short, and DNS too slow","Waste from fixed class sizes, and internet routing tables growing too fast","Broadcast storms, and duplicate MACs","Address spoofing, and lack of encryption"], a:1, why:"Fixed sizes wasted addresses; handing out many Class Cs bloated routing tables. CIDR's any-length prefixes and aggregation fixed both."})}

<h2>Private and public addresses</h2>
<p>CIDR slowed the waste but couldn't change the arithmetic. What bought IPv4 decades more was <b>private addresses</b>, reusable inside any network, plus <b>${K.g("NAT","Network Address Translation: the edge router swaps a private source address for its public one, and back for replies. Module 7.")}</b>, which lets many private devices share one public address.</p>
<h3>Public addresses and who hands them out</h3>
<p>A ${K.g("public address","Globally unique and routable on the internet. Allocated via IANA, the RIRs and ISPs.")} is unique on the whole internet, so someone must hand them out:</p>
${K.svg("0 0 720 290",
  K.box(285,10,150,44,"IANA","the global pool",true)+
  K.arrow(330,54,75,96)+K.arrow(345,54,215,96)+K.arrow(360,54,360,96)+K.arrow(375,54,505,96)+K.arrow(390,54,645,96)+
  K.box(10,98,130,44,"AFRINIC","Africa · Mauritius",true)+K.box(150,98,130,44,"RIPE NCC","Europe, Middle East")+K.box(295,98,130,44,"ARIN","North America")+K.box(440,98,130,44,"APNIC","Asia-Pacific")+K.box(580,98,130,44,"LACNIC","Latin America")+
  K.arrow(75,142,75,180)+
  K.box(10,182,130,44,"ISP / LIR","e.g. a Lagos ISP",true)+
  K.arrow(75,226,75,240)+
  K.box(10,242,130,40,"Your company","a small public block")+
  K.txt(170,200,"IANA gives large blocks (historically /8s) to the five regional registries.",{c:"fg",s:11,f:"body"})+
  K.txt(170,220,"Each RIR allocates blocks to ISPs and large organisations in its region.",{c:"fg",s:11,f:"body"})+
  K.txt(170,240,"The ISP assigns a few public addresses to each business customer,",{c:"fg",s:11,f:"body"})+
  K.txt(170,260,"and one — or a shared one — to each home customer.",{c:"fg",s:11,f:"body"}),
  "Public IPv4 addresses flow from IANA to the five Regional Internet Registries to ISPs (Local Internet Registries) to customers. AFRINIC serves Africa.")}
<p>${K.g("IANA","Internet Assigned Numbers Authority: manages the global pools of addresses and protocol numbers.")} hands blocks to five ${K.g("RIRs","Regional Internet Registries: AFRINIC, ARIN, APNIC, LACNIC, RIPE NCC.")}. <b>AFRINIC</b>, in Mauritius, serves Africa: a Nigerian ISP's IPv4 blocks come from AFRINIC. ISPs (also called Local Internet Registries) assign small pieces to customers.</p>
<p>In <b>February 2011 IANA handed out its last free /8 blocks</b>; since then the RIRs have rationed or run out, and organisations buy addresses from each other. The long-term answer is IPv6 (a later module); the everyday one is private addressing plus NAT.</p>
${K.dyk(`On 3 February 2011 IANA's last five /8 blocks went one to each RIR, under a policy agreed in advance. AFRINIC's was <code>102.0.0.0/8</code>, its final /8. AFRINIC still had older stock then and only began handing out its last /8 in 2017, which is why many African networks numbered in recent years use 102.x addresses.`)}
<h3>Private addresses: RFC 1918</h3>
<p>Most devices only start conversations outward; nobody on the internet needs to reach them first. So in 1996 ${K.g("RFC 1918","Reserves 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 for private use.")} set aside three blocks that <b>anyone may use inside their own network without asking</b>, provided they never appear on the internet — internet routers drop them.</p>
<div class="tablewrap"><table>
<tr><th>Block</th><th>Range</th><th>Addresses</th><th>Typical use</th></tr>
<tr><td><code>10.0.0.0/8</code></td><td>10.0.0.0 – 10.255.255.255</td><td>16,777,216</td><td>Enterprises, banks, multi-site and cloud networks</td></tr>
<tr><td><code>172.16.0.0/12</code></td><td>172.16.0.0 – 172.31.255.255</td><td>1,048,576</td><td>Medium networks; cloud defaults (AWS's default VPC — Virtual Private Cloud, a customer's private network inside Amazon's cloud — is 172.31.0.0/16)</td></tr>
<tr><td><code>192.168.0.0/16</code></td><td>192.168.0.0 – 192.168.255.255</td><td>65,536</td><td>Homes, small offices, consumer router defaults</td></tr>
</table></div>
<p><code>192.168.1.10</code> is on a laptop in millions of buildings right now, and that's fine: the addresses never meet. That reuse is the power of ${K.g("private addresses","RFC 1918 addresses: free to use internally, not unique, never routed on the internet.")} — and, as the case study shows, the trouble when two private networks must be joined.</p>
<h3>The 172.16/12 and 100.64/10 edges, in binary</h3>
<p><code>/12</code> fixes the first <b>12 bits</b>: the whole first octet plus the top <b>4</b> bits of the second.</p>
<div class="tablewrap"><table>
<tr><th>Address</th><th>Octet 1</th><th>Octet 2</th><th>In 172.16.0.0/12?</th></tr>
<tr><td>172.15.255.255</td><td><code>10101100</code></td><td><code>0000 1111</code></td><td>No — top 4 bits 0000</td></tr>
<tr><td>172.16.0.0</td><td><code>10101100</code></td><td><code>0001 0000</code></td><td><b>Yes — first</b></td></tr>
<tr><td>172.31.255.255</td><td><code>10101100</code></td><td><code>0001 1111</code></td><td><b>Yes — last</b></td></tr>
<tr><td>172.32.0.0</td><td><code>10101100</code></td><td><code>0010 0000</code></td><td>No — top 4 bits 0010</td></tr>
</table></div>
<p>Every second octet from 16 to 31 starts <code>0001</code>, so the block is <b>172.16 to 172.31</b> and <code>172.32.0.1</code> is public. The ${K.g("CGNAT","Carrier-grade NAT: an ISP shares one public address among many customers, using 100.64.0.0/10 towards their routers.")} block <code>100.64.0.0/10</code> works the same way with 10 bits: 100 = <code>01100100</code>, and the second octet's top 2 bits must be <code>01</code>: from <code>01 000000</code> = 64 to <code>01 111111</code> = 127. Range: <b>100.64.0.0 – 100.127.255.255</b>.</p>
${K.remember(`<b>&ldquo;Ten, sixteen-to-thirty-one, one-sixty-eight.&rdquo;</b> 10.anything · 172.16 to 172.31 · 192.168.anything. It is one of the most-asked facts in networking interviews.`)}
<h3>NAT and CGNAT (preview)</h3>
<p>If the internet drops private addresses, how does <code>192.168.10.11</code> load a website? The edge router performs NAT: it swaps the private source for its own public address and reverses it for the reply. One public address can serve hundreds of devices. You'll configure it in Module 7.</p>
${K.svg("0 0 760 290",
  `<rect x="10" y="44" width="330" height="236" rx="10" fill="none" stroke="var(--ok)" stroke-dasharray="6 4"/>`+
  `<rect x="470" y="44" width="280" height="236" rx="10" fill="none" stroke="var(--accent)" stroke-dasharray="6 4"/>`+
  K.txt(20,64,"INSIDE · private (RFC 1918)",{c:"ok",s:11,b:true})+K.txt(480,64,"OUTSIDE · public internet",{c:"accent",s:11,b:true})+
  K.dev("pc",70,110,"PC1","192.168.10.11")+K.dev("laptop",70,210,"Laptop","192.168.10.12")+
  K.dev("switch",215,160,"SW1","")+
  K.dev("router",405,160,"Edge router","does NAT")+
  K.dev("cloud",560,160,"Internet","")+K.dev("server",690,210,"Web server","198.51.100.80")+
  K.link(95,115,189,155)+K.link(95,205,189,165)+K.link(241,160,381,160,"192.168.10.1")+K.link(429,160,536,160,"203.0.113.10")+K.link(584,170,672,205)+
  K.arrow(110,24,370,24,"from 192.168.10.11 → 198.51.100.80",true)+K.arrow(440,24,740,24,"after NAT: from 203.0.113.10 → 198.51.100.80",true)+
  K.txt(405,232,"swaps the private source for",{mid:true,s:10.5,f:"body"})+K.txt(405,246,"its public address, and back",{mid:true,s:10.5,f:"body"})+K.txt(405,260,"for the reply (Module 7)",{mid:true,s:10.5,f:"body"}),
  "Private addresses stay inside. The edge router's inside interface is private; its outside interface has the public address from the ISP. Internet servers only ever see the public one.")}
<p>A side effect: outsiders can't start a connection to <code>192.168.10.11</code> unless the router has a ${K.g("port forwarding","A NAT rule sending inbound connections on a public address and port to an inside device.")} rule — and that only works if the router's outside address is truly public.</p>
<p>Increasingly it isn't. Short of addresses, many ISPs give a customer's router an outside address from <code>100.64.0.0/10</code> and run a big NAT of their own that shares one public address among many customers. <b>RFC 6598</b> (2012) reserved this block for CGNAT. Why not RFC 1918? The customer's LAN already uses it; the same network on both sides of their router would clash. The cost: two layers of NAT, the public address belongs to the ISP, and port forwarding on the customer's router does nothing.</p>
${K.when([
  ["RFC 1918 private","Any internal network: offices, homes, data centres, cloud","Free, no permission, plenty of room in 10/8","A device must be reached directly from the internet"],
  ["Public","Internet-facing interfaces: firewall outside, public servers, VPN gateways","The only kind the internet delivers to","Internal devices — scarce, paid-for addresses wasted"],
  ["100.64.0.0/10","ISPs only, between their CGNAT and customer routers","Can't clash with customers' RFC 1918 LANs","Your company LAN — it isn't RFC 1918"],
  ["Documentation","Diagrams, training, example configs","Never belong to a real network","Any live network"],
], "Which kind of address, and when")}
${K.q({type:"multi", q:"Which three addresses are RFC 1918 private addresses? (Choose three.)", o:["172.16.0.1","172.31.255.254","192.168.100.1","172.32.1.1","192.169.1.1","11.0.0.1"], a:[0,1,2], why:"The private blocks are 10.0.0.0/8, 172.16.0.0/12 (172.16 through 172.31) and 192.168.0.0/16. 172.32, 192.169 and 11.x are each one step outside a block, so all three are public."})}
${K.mistake(`Treating all of <code>172.x.x.x</code> as private. Only <b>172.16–172.31</b> is. A firewall rule trusting &ldquo;172.0.0.0/8 as internal&rdquo; trusts millions of internet addresses. Likewise <code>192.169.x.x</code> and <code>11.x.x.x</code> are public.`)}
${K.check({q:"A home router shows its internet-facing address as 100.81.4.22. What does that tell you?", o:["It has a public address from AFRINIC","It has an RFC 1918 address","The ISP uses carrier-grade NAT; the customer has no public address of their own","It failed DHCP and assigned itself an address"], a:2, why:"100.81 is inside 100.64.0.0/10 (second octet 64–127), the RFC 6598 CGNAT space. The real public address belongs to the ISP's NAT and is shared."})}

<h2>The special addresses — and unicast, broadcast, multicast</h2>
<p>Some addresses are reserved for a job and can never be a normal host address.</p>
${K.svg("0 0 760 290",
  K.txt(380,22,"The IPv4 address space by first octet (0 – 255)",{c:"fg",s:12.5,mid:true,b:true,f:"display"})+
  K.txt(200,46,"0…",{mid:true,s:10})+K.txt(470,46,"10…",{mid:true,s:10})+K.txt(605,46,"110…",{mid:true,s:10})+K.txt(672,46,"1110…",{mid:true,s:10})+K.txt(718,46,"1111…",{mid:true,s:10})+
  K.txt(200,70,"1 – 126",{mid:true,c:"fg"})+K.txt(470,70,"128 – 191",{mid:true,c:"fg"})+K.txt(605,70,"192 – 223",{mid:true,c:"fg"})+K.txt(672,70,"224–239",{mid:true,c:"fg",s:10})+K.txt(718,70,"240–255",{mid:true,c:"fg",s:10})+
  K.band(23,84,354,40,"Class A · /8 · half of all addresses","var(--chip)")+
  K.band(380,84,180,40,"Class B · /16","var(--panel2)")+
  K.band(560,84,90,40,"C · /24","var(--chip)")+
  K.band(650,84,45,40,"D","var(--panel2)")+
  K.band(695,84,45,40,"E","var(--chip)")+
  `<rect x="20" y="84" width="3" height="40" fill="var(--warn)"/><rect x="377" y="84" width="3" height="40" fill="var(--warn)"/>`+
  [[21,145,1],[48,145,2],[301,145,3],[378,145,4],[495,145,5],[505,165,6],[561,145,7],[584,165,8],[739,145,9]].map(([x,y,n])=>`<line x1="${x}" y1="124" x2="${x}" y2="${y-7}" stroke="var(--muted)" stroke-width="1"/><circle cx="${x}" cy="${y}" r="7" fill="var(--panel2)" stroke="var(--accent)"/><text x="${x}" y="${y+3.5}" text-anchor="middle" font-size="9" fill="var(--fg)" font-family="var(--mono)">${n}</text>`).join("")+
  K.txt(20,198,"1 · 0.0.0.0/8 — this host / default route",{s:10.5,c:"fg"})+
  K.txt(20,216,"2 · 10.0.0.0/8 — private (RFC 1918)",{s:10.5,c:"fg"})+
  K.txt(20,234,"3 · 100.64.0.0/10 — CGNAT shared space (RFC 6598)",{s:10.5,c:"fg"})+
  K.txt(20,252,"4 · 127.0.0.0/8 — loopback",{s:10.5,c:"fg"})+
  K.txt(20,270,"5 · 169.254.0.0/16 — APIPA link-local",{s:10.5,c:"fg"})+
  K.txt(430,198,"6 · 172.16.0.0/12 — private (172.16–172.31)",{s:10.5,c:"fg"})+
  K.txt(430,216,"7 · 192.168.0.0/16 — private",{s:10.5,c:"fg"})+
  K.txt(430,234,"8 · 192.0.2 · 198.51.100 · 203.0.113 — docs",{s:10.5,c:"fg"})+
  K.txt(430,252,"9 · 255.255.255.255 — limited broadcast",{s:10.5,c:"fg"})+
  K.txt(430,270,"D = multicast groups · E = reserved",{s:10.5}),
  "The whole IPv4 space by first octet, to scale: Classes A–E across the bar, numbered markers for the private and special blocks. Everything unmarked in A, B and C is public unicast space.")}
<h3>0.0.0.0 and 255.255.255.255</h3>
<p><b>All zeros</b> means &ldquo;no specific address&rdquo;. A PC with no address yet sends its first DHCP request <i>from</i> 0.0.0.0. A server listening on <code>0.0.0.0:443</code> listens on all its addresses. In a routing table, <code>0.0.0.0/0</code> — zero network bits, so it matches everything — is the ${K.g("default route","0.0.0.0/0: matches every destination; used when nothing more specific exists. On a PC it is the default gateway.")}. It is never an interface address.</p>
<p><b>All ones</b>, <code>255.255.255.255</code>, is the ${K.g("limited broadcast","255.255.255.255: every host on the local network. Routers never forward it.")}: every host on the local network, never forwarded by a router. DHCP's first message goes from 0.0.0.0 to 255.255.255.255, in a frame to <code>ffff.ffff.ffff</code> that the switch floods (Module 2).</p>
<h3>The network address and the directed broadcast</h3>
<p>Every network reserves two addresses. Host bits all <b>0</b> give the ${K.g("network address","All host bits 0: names the network (e.g. 192.168.10.0/24). Not usable by a host.")} — <code>192.168.10.0</code>, the network's name in routing tables. Host bits all <b>1</b> give the ${K.g("directed broadcast","All host bits 1 (e.g. 192.168.10.255): every host on that one network.")} — <code>192.168.10.255</code>, every host on that network. Cisco routers have refused to forward directed broadcasts from other networks by default since IOS 12.0 (<code>no ip directed-broadcast</code>), because attackers used them to make whole networks flood a victim. These two are the &ldquo;− 2&rdquo; in every host count.</p>
${K.mistake(`Thinking every address ending <code>.0</code> or <code>.255</code> is unusable. That holds only for a /24. In <code>172.16.0.0/16</code>, <code>172.16.1.0</code> has host bits <code>00000001 00000000</code> — not all zeros — so it is a valid host. The mask decides, as lesson 3 shows.`)}
<h3>127.0.0.0/8 loopback and 169.254.0.0/16 APIPA (Automatic Private IP Addressing)</h3>
<p>Anything starting 127 is ${K.g("loopback","127.0.0.0/8: packets never leave the device. 127.0.0.1 = localhost.")}: the packet turns round inside the operating system and never touches the network card. <code>ping 127.0.0.1</code> (&ldquo;localhost&rdquo;) tests the PC's own TCP/IP software; the whole block is reserved, not only .1.</p>
<p>When a device set for DHCP gets no answer, it gives itself a random <code>169.254.x.x</code> with mask <code>255.255.0.0</code> and no gateway — ${K.g("APIPA","Automatic Private IP Addressing: a host with no DHCP answer picks 169.254.x.x itself.")}, or in the standard's words a ${K.g("link-local","Usable only on the directly connected link; never routed.")} address. Routers never forward it, so the device can reach only other 169.254 devices on the same link. Windows keeps retrying DHCP in the background (about every five minutes).</p>
${K.out(`C:\\Users\\bisi>ipconfig /all

Ethernet adapter Ethernet:

   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM
   Physical Address. . . . . . . . . : 3C-52-82-1A-7F-09
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   Autoconfiguration IPv4 Address. . : 169.254.112.25(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :
   DNS Servers . . . . . . . . . . . : fec0:0:0:ffff::1%1`, "ipconfig /all on a laptop whose DHCP request got no answer (trimmed).")}
<ul>
<li><b>DHCP Enabled: Yes</b> — it asked for an address.</li>
<li><b>Autoconfiguration IPv4 Address</b> — Windows saying outright that it invented this address.</li>
<li><b>255.255.0.0</b>, gateway blank — a /16 with no way off it.</li>
<li><b>fec0:… DNS</b> — a placeholder Windows uses when DHCP gave nothing.</li>
</ul>
<p>So 169.254 means <b>the link is up but no DHCP server answered this host</b>: check its port, then the DHCP server.</p>
${K.tip(`On a support call, ask the user to read you the <i>IPv4 Address</i> line from <code>ipconfig</code>. The first two octets alone — 169.254, 100.64, 192.168 — often tell you where to look.`)}
<h3>Documentation, multicast and Class E</h3>
<p>${K.g("RFC 5737","Reserves 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 (TEST-NET-1, 2, 3) for documentation.")} reserves <code>192.0.2.0/24</code>, <code>198.51.100.0/24</code> and <code>203.0.113.0/24</code> for examples. They aren't private — they aren't routed anywhere. This course uses them for &ldquo;public&rdquo; examples.</p>
<p>Class D, <code>224.0.0.0</code>–<code>239.255.255.255</code>, holds multicast groups: devices <i>join</i> a group rather than own the address. <code>224.0.0.0/24</code> is local control traffic routers never forward: <code>224.0.0.1</code> all hosts, <code>.2</code> all routers, <code>.5</code>/<code>.6</code> OSPF, <code>.9</code> RIPv2, <code>.10</code> EIGRP. Class E (240+) is reserved; Windows and Cisco IOS refuse it as a host address.</p>
<h3>Unicast, broadcast and multicast at Layer 3</h3>
<p>Every destination is one of three kinds — the MAC address kinds from Module 2, one layer up: ${K.g("unicast","A packet to one host's address.")} to one host (any normal A, B or C address); <b>broadcast</b> to every host on a network (255.255.255.255, or a directed broadcast such as 192.168.10.255), carried in a frame to <code>ffff.ffff.ffff</code>; and <b>multicast</b> to a group (224–239), carried in a frame to a <code>0100.5e</code>… MAC. A PC's ARP table shows all three:</p>
${K.out(`C:\\Users\\PC1>arp -a

Interface: 192.168.10.11 --- 0x4
  Internet Address      Physical Address      Type
  192.168.10.1          0c-1a-2b-00-00-01     dynamic
  192.168.10.20         00-50-a1-3c-20-07     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  224.0.0.251           01-00-5e-00-00-fb     static
  239.255.255.250       01-00-5e-7f-ff-fa     static
  255.255.255.255       ff-ff-ff-ff-ff-ff     static`, "arp -a on Windows: unicast neighbours learned by ARP, plus the static broadcast and multicast entries.")}
<ul>
<li><b>.1 and .20, dynamic</b> — <b>unicast</b>: the gateway and a server, real MACs learned by ARP.</li>
<li><b>192.168.10.255</b> → <code>ff-ff…</code> — the <b>directed broadcast</b> of this /24 (a clue to the PC's mask).</li>
<li><b>224.0.0.22, 224.0.0.251, 239.255.255.250</b> — <b>multicast</b> groups (IGMPv3, mDNS, ${K.g("SSDP","Simple Service Discovery Protocol: how devices such as smart TVs, printers and media servers announce themselves and find each other on a local network.")}). The MACs start <code>01-00-5e</code> and end with the group's low bits: 22 = 0x16.</li>
<li><b>255.255.255.255</b> — the <b>limited broadcast</b>.</li>
</ul>
${K.myth([
  ["192.168.x.x is the private range.","There are three: 10/8, 172.16/12 and 192.168/16. 192.168 is the smallest and the most likely to clash."],
  ["Every 172.x address is private.","Only 172.16.0.0–172.31.255.255. 172.15 and 172.32 are public."],
  ["A private address makes a device secure.","NAT blocks unsolicited inbound traffic as a side effect, but security comes from firewall policy; insiders and malware still reach private hosts."],
  ["127.0.0.1 is the only loopback address.","All of 127.0.0.0/8 loops back."],
  ["169.254 means the network is down.","It means this host got no DHCP answer; everyone else may be fine."],
])}
${K.q({type:"match", q:"Match each address with what it is.", pairs:[["10.4.7.1","Private (RFC 1918)"],["169.254.20.5","APIPA link-local — DHCP failed"],["127.0.0.1","Loopback"],["224.0.0.5","Multicast (Class D)"],["100.64.3.9","CGNAT shared space"],["203.0.113.50","Documentation (TEST-NET-3)"],["172.32.0.1","Public unicast (Class B)"]], why:"10/8 is private; 169.254/16 is APIPA; 127/8 is loopback; 224–239 is multicast (224.0.0.5 is OSPF); 100.64–100.127 is CGNAT space; 203.0.113.0/24 is documentation; 172.32 is outside 172.16–31, so public Class B."})}
${K.exam(`The blueprint asks you to <b>describe private IPv4 addressing</b>: expect &ldquo;Which is a valid private address?&rdquo; with 172.32, 192.169 or 11.x as traps, &ldquo;Which range does APIPA use?&rdquo; (169.254.0.0/16), and &ldquo;Which address can be assigned to a host?&rdquo; — reject 127.x, 224 and above, and network or broadcast addresses.`)}
${K.check({q:"A PC sends a packet to 255.255.255.255. Which is true?", o:["Every host on the internet receives it","Every host on the PC's local network receives it; routers don't forward it","Only the default gateway receives it","It loops back inside the PC"], a:1, why:"255.255.255.255 is the limited broadcast: the local network only, never routed. DHCP uses it before a PC has an address."})}

<h2>Recognise any address in seconds — then prove it</h2>
<p>Run these checks in order and stop at the first match:</p>
${K.steps([
  ["Valid?", `<p>Four octets, each 0–255.</p>`],
  ["All zeros or all ones?", `<p>0.0.0.0 → this host / default route. 255.255.255.255 → limited broadcast.</p>`],
  ["First octet", `<p>127 → loopback. 224–239 → multicast. 240–255 → reserved. 0 → unusable.</p>`],
  ["Reserved block?", `<p>10 · 172.16–31 · 192.168 → private. 169.254 → APIPA. 100.64–127 → CGNAT. 192.0.2 · 198.51.100 · 203.0.113 → documentation.</p>`],
  ["Otherwise", `<p><b>Public unicast.</b> Name the class (1–126 A, 128–191 B, 192–223 C) for context. With a mask, also check host bits: all 0 = network, all 1 = broadcast.</p>`],
])}
<h3>Try it yourself: classify ten addresses</h3>
<p><b>(a)</b> 10.255.255.254 <b>(b)</b> 172.15.0.9 <b>(c)</b> 192.168.300.1 <b>(d)</b> 224.0.0.10 <b>(e)</b> 100.127.255.1 <b>(f)</b> 169.254.0.80 <b>(g)</b> 198.51.100.7 <b>(h)</b> 0.0.0.0 <b>(i)</b> 127.45.3.2 <b>(j)</b> 191.255.1.1</p>
${K.hint(`Follow the routine in order. For (b) and (e), compare the second octet with the range edges: 16–31 and 64–127.`)}
${K.reveal("Show the answers",`<ol type="a">
<li>Private (10/8).</li>
<li>Public, Class B — 15 is below 16.</li>
<li>Not valid — 300 doesn't fit an octet.</li>
<li>Multicast (EIGRP's group).</li>
<li>CGNAT space — 127 is the last second octet in 100.64–127 (<code>01 111111</code>).</li>
<li>APIPA — no DHCP answer.</li>
<li>Documentation (TEST-NET-2).</li>
<li>This host / default route.</li>
<li>Loopback — all of 127/8.</li>
<li>Public, Class B — the last B first octet.</li>
</ol>`)}
<h3>Hands-on: an APIPA PC next to a correctly addressed one</h3>
<p>PC1 and the file server are addressed in <code>192.168.10.0/24</code>. PC2 has no address and there's no DHCP server. Plug it in, see what it gives itself, watch it fail, then fix it.</p>
${K.bench({id:"m3-apipa", points:50, from:"CCNA · Module 3 · lesson 2", title:"169.254 vs a real address: who can reach the file server?", viewBox:"0 0 760 340", openLog:true,
  intro:"Use each device's <b>Command Prompt</b> and <b>IP settings</b> buttons. PC1 = 192.168.10.11 and FILESRV = 192.168.10.20, both 255.255.255.0. No router is needed: this is same-network traffic.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · office LAN", x:170, y:20},
    {id:"pc1", kind:"pc", label:"PC1", x:50, y:220, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"pc2", kind:"pc", label:"PC2", x:320, y:220},
    {id:"srv", kind:"server", label:"FILESRV", x:590, y:220, ip:"192.168.10.20", mask:"255.255.255.0", gw:"192.168.10.1"},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"srv:eth", b:"sw1:g8"} ],
  tray:["cat6"],
  tasks:[
    {text:"Cable PC2 to SW1 port 2 with a Cat6 straight-through cable — the link light goes green", done:B=>Bench.upAt(B,"pc2:eth")},
    {text:"On PC2, run <code>ipconfig</code>. The link is up, but it shows an <b>Autoconfiguration</b> address in 169.254.x.x, mask 255.255.0.0, and no gateway", done:B=>Bench.upAt(B,"pc2:eth") && Bench.tried(B,"pc2",/^\s*ipconfig/i)},
    {text:"From PC2, <code>ping 192.168.10.20</code>. <i>General failure</i>: the server isn't in 169.254.0.0/16 and PC2 has no gateway, so nothing is even sent (no frames in the log)", done:B=>Bench.tried(B,"pc2",/^\s*ping\s+192\.168\.10\.20\s*$/i)},
    {text:"From PC1, <code>ping 192.168.10.20</code> — it works. In the log: an ARP broadcast, then unicast echoes", done:B=>Bench.pinged(B,"pc1","192.168.10.20")},
    {text:"On PC1, <code>arp -a</code>: find a unicast entry (the server), the directed broadcast 192.168.10.255 and the multicast entry 224.0.0.22", done:B=>Bench.tried(B,"pc1",/^\s*arp\s+-a\s*$/i)},
    {text:"In PC2's <b>IP settings</b>, give it a static address in the same network: <code>192.168.10.12</code>, mask <code>255.255.255.0</code>, gateway <code>192.168.10.1</code> (any unused host .1–.254 works — not .0, .255, .11 or .20)", done:B=>{ const d = B.devs.pc2, m = /^192\.168\.10\.(\d{1,3})$/.exec(d.ip||""); return !!m && +m[1]>=1 && +m[1]<=254 && ![11,20].includes(+m[1]) && d.mask==="255.255.255.0"; }},
    {text:"From PC2, <code>ping 192.168.10.20</code> again — four replies", done:B=>Bench.pinged(B,"pc2","192.168.10.20")},
  ],
  win:"Same cable, same switch, same server — only PC2's address changed. A 169.254 address reaches nothing outside 169.254; an address in the right network reaches everything on it.",
  solve:[["plug","cat6","pc2:eth","sw1:g2"],["pc","pc2","ipconfig"],["pc","pc2","ping 192.168.10.20"],["pc","pc1","ping 192.168.10.20"],["pc","pc1","arp -a"],["ip","pc2","192.168.10.12","255.255.255.0","192.168.10.1"],["pc","pc2","ping 192.168.10.20"]]})}
<p>PC2's failed ping put <b>no frames</b> on the wire: the server wasn't on its network and it had no gateway. Optional: give PC1 and PC2 both 169.254 addresses (mask 255.255.0.0) and they <i>will</i> ping each other — link-local works on one link. Then <b>Reset bench</b>.</p>
<h3>On a router: classify the addresses and refuse an overlap</h3>
<p><code>LOS-EDGE</code> is a small Lagos office's internet router. Read its addresses, add a LAN for a new floor, and watch IOS refuse a network that overlaps an existing one.</p>
${K.hint(`<code>show ip interface brief</code> lists interfaces and addresses. In configuration mode, <code>interface g0/2</code> selects the port and <code>ip address &lt;address&gt; &lt;mask&gt;</code> sets it. Use <code>end</code> before <code>show ip route</code>, or put <code>do</code> in front.`)}
${K.term({env:"ios2", title:"addresses on LOS-EDGE", opts:{kind:"router", host:"LOS-EDGE", model:"C1111-4P",
  motd:"LOS-EDGE — console. G0/0 = WAN to ISP · G0/1 = staff LAN · G0/2 = spare (new 2nd floor)."},
  setup:env=>{
    ["enable","configure terminal","interface g0/0","description WAN to ISP","ip address 100.64.37.2 255.255.255.252","no shutdown","interface g0/1","description LAN staff","ip address 192.168.1.1 255.255.255.0","no shutdown","end"].forEach(c=>env.exec(c));
    env.mode = "user"; env.history.length = 0; env.log.length = 0; env.baseline();
  },
  intro:"An ISR router with two interfaces already addressed. Work out what each address is, then extend it.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip interface brief</code>. G0/0 has 100.64.37.2 — CGNAT space, so this office has no public address of its own. G0/1 has 192.168.1.1 — private", done:e=>e.log.some(x=>/IP-Address\s+OK\?/.test(x.out))},
    {text:"<code>configure terminal</code>, <code>interface g0/2</code>, then try <code>ip address 192.168.1.254 255.255.255.0</code>. IOS refuses: it <b>overlaps</b> the staff LAN on G0/1", done:e=>e.log.some(x=>/overlaps with GigabitEthernet0\/1/.test(x.out))},
    {text:"Use a different private block instead: <code>ip address 10.20.30.1 255.255.255.0</code>, then <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/2"]; return i.ip==="10.20.30.1" && i.mask==="255.255.255.0" && !i.shut; }},
    {text:"<code>ping 100.64.37.1</code> (the ISP's end of the WAN link) — five <code>!</code>", done:e=>e.log.some(x=>/Echos to 100\.64\.37\.1[\s\S]*!!!!!/.test(x.out))},
    {text:"<code>end</code>, then <code>show ip route</code>: find <code>C 10.20.30.0/24</code> — the new network named by its <b>network address</b> — and <code>L 10.20.30.1/32</code>, the router's own address", done:e=>e.log.some(x=>/C\s+10\.20\.30\.0\/24/.test(x.out))},
    {text:"Save: <code>copy running-config startup-config</code> (Enter accepts the filename)", done:e=>e.savedOnce},
  ],
  win:"You read a CGNAT WAN address and a private LAN, watched IOS refuse an overlapping network, added a second private network from 10/8, and saw the router name each network by its network address.",
  solve:["enable","show ip interface brief","configure terminal","interface g0/2","ip address 192.168.1.254 255.255.255.0","ip address 10.20.30.1 255.255.255.0","no shutdown","do ping 100.64.37.1","end","show ip route","copy running-config startup-config",""]})}
<p>Each <code>C</code> line names a network by its network address, and IOS still files routes under their old classful network (<code>10.0.0.0/8 is variably subnetted</code>) — classes live on. The overlap check protects one router only; the case study shows two sites clashing.</p>
<h3>Teaser for lesson 3: same network or not?</h3>
<p>A host's real question is &ldquo;is that address on my network?&rdquo;, and answering it needs the mask. Try a few; each answer shows the AND with the mask that lesson 3 teaches. Misses are expected.</p>
${K.drill({title:"teaser — same subnet? (full method in lesson 3)", types:["samesub"], count:3})}
${K.check({q:"Which address could be configured on a lab PC as its own address?", o:["127.0.0.1","224.0.0.9","203.0.113.40","255.255.255.255"], a:2, why:"127.x is loopback, 224.0.0.9 a multicast group (RIPv2), 255.255.255.255 the limited broadcast. 203.0.113.40 is a normal unicast address reserved for documentation, so it's fine in a lab or example."})}

${K.job("Two odd addresses before 10 a.m.: 169.254 in the office, 100.64 at home",`
<p><b>Call 1.</b> &ldquo;Bisi, Finance, Ikeja: laptop on the desk dock has no internet. Others are fine.&rdquo; <b>Questions:</b> since when? <i>&ldquo;Since the power cut this morning.&rdquo;</i> Wired or Wi-Fi? <i>&ldquo;Wired.&rdquo;</i> Read me the IPv4 Address line? <i>&ldquo;Autoconfiguration, 169.254.112.25, gateway blank.&rdquo;</i></p>
<p><b>Checks.</b> No &ldquo;Media disconnected&rdquo;, so the link is up but nobody answered DHCP. <code>ping 192.168.10.1</code> gives <code>PING: transmit failed. General failure.</code> The office router is the DHCP server; <code>show version</code> says <code>uptime is 41 minutes</code>. It rebooted in the power cut — unlike the switches, it isn't on the UPS — and her laptop asked while it was booting.</p>
<p><b>Fix.</b></p>
${K.out(`C:\\Users\\bisi>ipconfig /renew

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : ikeja.example.local
   IPv4 Address. . . . . . . . . . . : 192.168.10.57
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.1`, "This time DHCP answers: a real address in the office network, with a gateway.")}
<p><b>What you say.</b> &ldquo;Your laptop asked for its settings while the router was restarting after the power cut, so it gave itself a stand-in address. It's fixed, and we'll put the router on the UPS.&rdquo;</p>
<p><b>Call 2.</b> &ldquo;Tunde, developer, at home: I set up port forwarding so a client can see my demo server, but it times out from outside.&rdquo; <b>Question:</b> what's the router's WAN address? <i>&ldquo;100.72.14.9.&rdquo;</i> Second octet 72 is in 64–127: CGNAT space. Confirm it:</p>
${K.out(`C:\\Users\\tunde>nslookup myip.opendns.com resolver1.opendns.com
Server:  resolver1.opendns.com
Address:  208.67.222.222

Non-authoritative answer:
Name:    myip.opendns.com
Address:  198.51.100.77

C:\\Users\\tunde>tracert -d -h 4 8.8.8.8

Tracing route to 8.8.8.8 over a maximum of 4 hops

  1     1 ms     1 ms     1 ms  192.168.0.1
  2    14 ms    12 ms    13 ms  100.72.0.1
  3    18 ms    17 ms    19 ms  100.64.255.1
  4    21 ms    20 ms    22 ms  198.51.100.65

Trace complete.`, "The internet sees a different address from the router's, and the hops after the router are in 100.64.0.0/10.")}
<ul>
<li><code>nslookup myip.opendns.com</code> asks a public DNS service which address it sees: <b>198.51.100.77</b>, not 100.72.14.9. The ISP's NAT is translating.</li>
<li>In <code>tracert</code>, hop 1 is Tunde's router (private), hops 2–3 are inside the ISP's CGNAT space, hop 4 is public.</li>
</ul>
<p>The client reaches the ISP's shared address, whose NAT has no rule for Tunde, so his port forward never sees the traffic. <b>Fix:</b> a public IPv4 address from the ISP, a cloud VM, or an outbound tunnel. Tunde uses a cloud VM today.</p>
<p><b>What you say.</b> &ldquo;Your ISP shares one internet address between many customers, so outsiders can't reach your router. Your port forward is correct. We'll host the demo in the cloud today.&rdquo;</p>
<p><b>Ticket notes.</b> <i>&ldquo;#1 Bisi: APIPA 169.254.112.25, link up. Edge router (DHCP) rebooted in power cut, not on UPS. ipconfig /renew → 192.168.10.57/24. Change raised: router onto UPS. 10 min.&rdquo;</i> <i>&ldquo;#2 Tunde: WAN 100.72.14.9 = RFC 6598 CGNAT; external IP 198.51.100.77; tracert hops 2–3 in 100.64/10. Port forward correct but unreachable. Demo moved to cloud VM; advised public IPv4 from ISP. 20 min.&rdquo;</i></p>`)}

${K.case("A Lagos fintech, four networks, all 192.168.1.0/24",`
<p>A payments start-up grew from one office to four places that had to talk: head office in Victoria Island, a support office in Abuja, a data room in Ikeja, and the cloud. Different contractors had left the consumer default, <code>192.168.1.0/24</code>, everywhere — and developers' home routers used it too.</p>
<p><b>What broke.</b> The Lagos–Abuja ${K.g("VPN","Virtual Private Network: an encrypted tunnel joining networks or remote users across the internet.")} came up but carried nothing. A Lagos PC sending to <code>192.168.1.40</code> in Abuja saw that address as <i>its own</i> network and sent ARP requests for it locally instead of using the gateway. Identical network parts are, to every host, the same network. Remote staff on 192.168.1.0/24 at home hit the same wall. NAT tricks patched Abuja but made faults harder to trace.</p>
<p><b>The redesign.</b> The network lead planned first and chose <b>10.0.0.0/8</b>, with one block per site by second octet: Victoria Island <code>10.10</code>, Abuja <code>10.20</code>, Ikeja <code>10.30</code>, cloud <code>10.100</code>, VPN users <code>10.200</code>. The plan avoided popular defaults (192.168.0.x and 1.x, 10.0.0.x, Docker's 172.17.0.0/16, the cloud's 172.31.0.0/16) and never used 100.64/10, which Ikeja's backup ISP used for CGNAT. Re-addressing took two weekends (lessons 6–7 show how). Afterwards the VPNs worked without NAT, firewall rules read clearly, and joining an acquired agency on 192.168.1.0/24 took one evening.</p>
<p><b>Lesson recorded:</b> private addresses are free but not unique; the moment two private networks connect, overlap is your problem. Plan before the second site.</p>
${K.when([
  ["10.0.0.0/8","Several sites, VPNs, cloud, growth","Huge space for a clear per-site plan","Avoid 10.0.0.x and 10.0.1.x, common device defaults"],
  ["172.16.0.0/12","Medium networks, or a second space beside 10/8","Rarely used by home routers","It clashes with container and cloud defaults (172.17, 172.31)"],
  ["192.168.0.0/16","One small site that will never join another","Familiar; every small router supports it","Anything joined by VPN — clashes with staff homes"],
], "Which private block for a company?")}`)}
${K.dodont([
  "Say what kind an address is before you troubleshoot.",
  "Use 10/8 with a written per-site plan for any network that may connect to another.",
  "Use 192.0.2, 198.51.100 and 203.0.113 in diagrams and tickets.",
  "Read 169.254 as &ldquo;no DHCP answer&rdquo; and 100.64–127 as &ldquo;behind CGNAT&rdquo;.",
],[
  "Don't leave 192.168.1.0/24 at every site because it was the default.",
  "Don't trust 172.0.0.0/8 as &ldquo;internal&rdquo; — only the exact RFC 1918 blocks are private.",
  "Don't put 100.64/10 or documentation ranges on a production LAN.",
  "Don't assume a Class B-range address uses /16 — ask for the mask.",
])}

<h2>Interview corner</h2>
${K.hint(`All three blocks in prefix and range form, why they exist, and NAT.`)}
${K.reveal("&ldquo;What are the private IPv4 address ranges?&rdquo;",`<p>&ldquo;RFC 1918 reserves 10.0.0.0/8, 172.16.0.0/12 — 172.16.0.0 to 172.31.255.255 — and 192.168.0.0/16. Anyone can use them internally, and the internet doesn't route them, so they're reused everywhere. They exist because IPv4 has only about 4.3 billion addresses and IANA's pool ran out in 2011; private hosts reach the internet through NAT. In a design I use 10/8 with a per-site plan, because overlapping private ranges break VPNs. 100.64.0.0/10 isn't RFC 1918 — it's the RFC 6598 CGNAT range.&rdquo;</p>`)}
${K.hint(`Classes in one sentence, the two problems, what CIDR changed and when.`)}
${K.reveal("&ldquo;Why was classful addressing replaced?&rdquo;",`<p>&ldquo;Classes fixed the network size by the first bits: /8, /16 or /24 and nothing between. That wasted addresses — 2,000 hosts got a Class B of 65,534 — and handing out several Class Cs instead bloated internet routing tables. CIDR in 1993 made addressing classless: the boundary can fall after any bit, written as a prefix length, so blocks fit the need and ISPs can aggregate many networks into one route. Classes survive as terminology and default masks.&rdquo;</p>`)}
${K.hint(`What the address means, how to prove it, why the port forward can't work, the options.`)}
${K.reveal("&ldquo;A customer's port forwarding fails and their router's WAN address is 100.70.x.x. Why?&rdquo;",`<p>&ldquo;100.64.0.0/10 is RFC 6598 shared space for carrier-grade NAT, so the router has no public address; the ISP shares one among customers. I'd confirm by comparing the WAN address with what an outside service sees — <code>nslookup myip.opendns.com resolver1.opendns.com</code> — and a <code>tracert</code> with 100.64 hops. Inbound connections hit the ISP's NAT, which has no rule for this customer. Fixes: a public IPv4 address from the ISP, hosting somewhere public, an outbound tunnel, or IPv6.&rdquo;</p>`)}

${K.recap([
  "IPv4 = 32 bits in four octets (0–255), dotted decimal; 2³² ≈ 4.3 billion addresses.",
  "Network part (shared on a network) + host part (unique per device); the mask, in lesson 3, sets the split.",
  "Classes by first octet: A 1–126 /8, B 128–191 /16, C 192–223 /24, D 224–239 multicast, E 240–255 reserved; 127 is loopback.",
  "Classes wasted addresses and bloated routing tables; CIDR (1993) allowed any prefix length and aggregation.",
  "Private (RFC 1918): 10/8, 172.16/12 (172.16–172.31), 192.168/16 — reusable, never routed on the internet, out through NAT.",
  "Public addresses: IANA → RIRs (AFRINIC for Africa) → ISPs; IANA's pool ran out in 2011. 100.64/10 is ISP CGNAT space.",
  "Special: 0.0.0.0 (this host; 0.0.0.0/0 default route), 255.255.255.255 (limited broadcast), network and directed broadcast, 127/8, 169.254/16 (APIPA), TEST-NETs.",
  "169.254 = no DHCP answer; 100.64–127 on a router's WAN = CGNAT, so port forwarding fails.",
])}
${K.next(`<b>Lesson 3 — Subnet masks, prefix length and the AND that finds the network.</b> Next you'll see exactly where the network/host split falls for any mask, convert 255.255.255.192 to /26 and back, and use a binary AND to find any address's network and broadcast.`)}
`,
quiz:[
  {lvl:1, q:"How is an IPv4 address structured?", o:["48 bits written as six hex pairs","32 bits written as four decimal octets, each 0–255","32 bits written as eight hex digits separated by colons","128 bits written as eight groups"], a:1, why:"IPv4 addresses are 32 bits, divided into four 8-bit octets. Each octet is written in decimal (0–255) and separated by dots: dotted decimal. 48 bits is a MAC address; 128 bits is IPv6."},
  {lvl:1, q:"Which class does the address 191.20.5.1 belong to under classful addressing?", o:["Class A","Class B","Class C","Class D"], a:1, why:"Class B covers first octets 128–191 (binary starting 10). 191 = 10111111, the last Class B first octet. Class C starts at 192."},
  {lvl:2, type:"multi", q:"Which three addresses are RFC 1918 private addresses? (Choose three.)", o:["10.199.4.1","172.30.8.8","192.168.0.254","172.33.1.1","192.169.10.1","100.64.1.1"], a:[0,1,2], why:"10.0.0.0/8, 172.16.0.0/12 (172.16–172.31) and 192.168.0.0/16 are private. 172.33 and 192.169 are one step outside the blocks and are public. 100.64.1.1 is in the RFC 6598 CGNAT shared space, which is reserved but not RFC 1918."},
  {lvl:2, type:"match", q:"Match each address with its type.", pairs:[["169.254.33.7","APIPA link-local"],["127.0.0.1","Loopback"],["239.255.255.250","Multicast"],["198.51.100.10","Documentation range"],["255.255.255.255","Limited broadcast"]], why:"169.254/16 is APIPA (no DHCP answer). 127/8 is loopback. 224–239 is multicast (239.255.255.250 is SSDP). 198.51.100.0/24 is TEST-NET-2 for documentation. 255.255.255.255 reaches every host on the local network and is never routed."},
  {lvl:1, type:"order", q:"Put these first-octet ranges in order from lowest to highest.", items:["Class A (1–126)","Loopback (127)","Class B (128–191)","Class C (192–223)","Class D multicast (224–239)","Class E reserved (240–255)"], why:"The class boundaries fall at 128, 192, 224 and 240, where one more leading bit becomes 1. 127 sits between Class A and Class B: it starts with a 0 bit but is reserved for loopback."},
  {lvl:2, type:"fill", q:"Which RFC number defines the three private IPv4 address blocks 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16?", fields:[{label:"RFC", a:["1918","RFC 1918","rfc1918","RFC1918"]}], why:"RFC 1918 (1996) reserves the three private blocks. RFC 6598 reserves 100.64.0.0/10 for CGNAT, and RFC 5737 the documentation ranges."},
  {lvl:1, type:"fill", q:"Which IOS privileged EXEC command lists every interface with its IP address and up/down status in one short table?", fields:[{label:"Command", a:["show ip interface brief"], ios:true}], why:"show ip interface brief (sh ip int br) shows each interface, its IP address, how it was set, and its status and protocol. It is the first command to run when checking addressing."},
  {lvl:2, q:"A user says nothing works. Based on the exhibit, what is the most likely explanation?", ex:"C:\\Users\\amaka>ipconfig\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   Autoconfiguration IPv4 Address. . : 169.254.71.200\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :", o:["The ISP link is down for the whole office","The PC's link is up but it received no answer from a DHCP server, so it assigned itself a link-local address","The PC has a static address in the wrong private range","The PC is behind carrier-grade NAT"], a:1, why:"An Autoconfiguration address in 169.254.0.0/16 with no gateway is APIPA: the adapter has a link (otherwise it would say Media disconnected) but no DHCP server answered. It can reach only other 169.254 hosts on the same link. Check the port and the DHCP server."},
  {lvl:3, q:"A small business wants customers to reach a booking server in its office. Port forwarding is configured on the office router but connections from outside time out. Based on the exhibit, what is the root cause?", ex:"Router WAN status:  IP address 100.88.12.6   Gateway 100.88.0.1\n\nC:\\>nslookup myip.opendns.com resolver1.opendns.com\nName:    myip.opendns.com\nAddress:  203.0.113.45\n\nC:\\>tracert -d -h 3 8.8.8.8\n  1    1 ms    1 ms    1 ms  192.168.1.1\n  2   15 ms   14 ms   16 ms  100.88.0.1\n  3   19 ms   18 ms   20 ms  100.64.250.1", o:["The router's port forward points to the wrong inside address","The ISP uses carrier-grade NAT: the router's WAN address is in 100.64.0.0/10 and the public address 203.0.113.45 belongs to the ISP's shared NAT","The office LAN uses a private range that the internet cannot route","The router's default gateway is wrong"], a:1, why:"100.88 is inside 100.64.0.0/10 (second octet 64–127), and the address the internet sees differs from the WAN address. Inbound connections reach the ISP's shared public address, which has no rule for this customer. The LAN being private is normal and is what port forwarding is for; the problem is that the router has no public address. Fix: a public IPv4 address from the ISP, or host the service elsewhere."},
  {lvl:2, q:"Why was classful addressing replaced by CIDR in 1993?", o:["Classes did not allow multicast","Fixed class sizes wasted large numbers of addresses, and handing out many small networks made internet routing tables grow too fast","Classful addresses could not be written in dotted decimal","Routers could not read the first bits of an address"], a:1, why:"With only /8, /16 and /24 available, organisations got far more addresses than needed, and giving out many Class Cs instead bloated routing tables. CIDR allowed any prefix length and route aggregation."},
  {lvl:2, q:"An engineer writes a firewall rule treating 172.0.0.0/8 as the company's internal address space. What is wrong with it?", o:["Nothing — all 172.x addresses are private","Only 172.16.0.0–172.31.255.255 is private; the rule also trusts millions of public addresses","172.x addresses are Class A and cannot be filtered","172.x is reserved for multicast"], a:1, why:"The RFC 1918 block is 172.16.0.0/12: second octets 16 through 31 only. 172.0–172.15 and 172.32–172.255 are public addresses on the internet, which the rule would wrongly trust."},
  {lvl:2, q:"Which statement about 255.255.255.255 and 192.168.10.255 (on the network 192.168.10.0/24) is correct?", o:["Both are forwarded by routers by default","255.255.255.255 is a limited broadcast for the local network and is never routed; 192.168.10.255 is the directed broadcast of 192.168.10.0/24, which Cisco routers do not forward by default","192.168.10.255 can be assigned to a host because it ends in .255","255.255.255.255 is the network address of the whole internet"], a:1, why:"The limited broadcast never leaves the local network. The directed broadcast (all host bits 1) targets one network; since IOS 12.0 the default no ip directed-broadcast stops routers forwarding it, to prevent amplification attacks. In a /24, .255 is the broadcast and can't be a host."},
  {lvl:3, q:"A company's Lagos and Abuja offices both use 192.168.1.0/24. After a site-to-site VPN is built, a Lagos PC can't reach the Abuja server 192.168.1.40, though the tunnel is up. What is the best long-term fix?", o:["Increase the VPN encryption strength","Re-address the sites into separate, planned ranges, for example 10.10.0.0/16 for Lagos and 10.20.0.0/16 for Abuja","Give the Abuja server a public address from AFRINIC","Change both offices to 100.64.0.0/10"], a:1, why:"The Lagos PC sees 192.168.1.40 as on its own network and ARPs locally instead of sending to the gateway and tunnel. Overlapping networks can't be routed between. NAT over the VPN is a workaround; the proper fix is a non-overlapping plan, usually from 10/8. 100.64/10 is for ISPs, and a public address is unnecessary for internal traffic."},
  {lvl:2, q:"You are writing a training guide and need an example public web server address that will never belong to a real organisation. Which should you use?", o:["8.8.8.8","10.1.1.1","198.51.100.25","172.16.5.5"], a:2, why:"198.51.100.0/24 (TEST-NET-2) is one of the RFC 5737 documentation ranges, along with 192.0.2.0/24 and 203.0.113.0/24. 8.8.8.8 is a real public DNS service, and 10.1.1.1 and 172.16.5.5 are private, not public."},
  {lvl:3, type:"multi", q:"Based on the exhibit from a branch router, which two statements are true? (Choose two.)", ex:"BR-RTR#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     100.66.4.2      YES manual up                    up\nGigabitEthernet0/1     10.40.1.1       YES manual up                    up\nGigabitEthernet0/2     172.32.0.1      YES manual up                    up", o:["G0/1 uses an RFC 1918 private address","G0/0 has a public address that internet hosts can connect to directly","G0/0's address is in the carrier-grade NAT shared space, so inbound connections from the internet will not reach this router directly","G0/2 uses an RFC 1918 private address","All three interfaces are in Class A"], a:[0,2], why:"10.40.1.1 is in 10.0.0.0/8, private. 100.66.4.2 is in 100.64.0.0/10, the ISP's CGNAT space, so the router has no public address of its own. 172.32.0.1 is one step outside 172.16.0.0/12, so it is a public address someone has misused internally. 172.32 is Class B by first octet, so not all are Class A."},
  {lvl:1, q:"What does a successful ping 127.0.0.1 on a PC prove?", o:["The PC's cable and switch port work","The default gateway is reachable","The PC's own TCP/IP software is working; the packets never leave the device","The DNS server is answering"], a:2, why:"127.0.0.0/8 is loopback: packets to it turn round inside the operating system without touching the network card. It tests the local IP stack only."},
],
cards:[
  {f:"IPv4 address structure", b:"32 bits in four 8-bit octets, written in dotted decimal (each octet 0–255). 2^32 = about 4.3 billion addresses."},
  {f:"Network part vs host part", b:"Network part: leading bits shared by every device on the network (routers use it). Host part: trailing bits unique to each device. The mask sets the split."},
  {f:"Classful first-octet ranges and default masks", b:"A 1–126 /8 · B 128–191 /16 · C 192–223 /24 · D 224–239 multicast · E 240–255 reserved. 127 = loopback."},
  {f:"Class leading bits", b:"A 0 · B 10 · C 110 · D 1110 · E 1111. Boundaries at 128, 192, 224, 240."},
  {f:"Why classful addressing was replaced", b:"Fixed sizes (/8, /16, /24) wasted addresses, and many small allocations bloated routing tables. CIDR (1993): any prefix length plus route aggregation."},
  {f:"RFC 1918 private ranges", b:"10.0.0.0/8 · 172.16.0.0/12 (172.16.0.0–172.31.255.255) · 192.168.0.0/16. Reusable anywhere, never routed on the internet."},
  {f:"Who assigns public IPv4 addresses?", b:"IANA → the five RIRs (AFRINIC for Africa, ARIN, APNIC, LACNIC, RIPE NCC) → ISPs and local registries → customers. IANA's free pool ran out in February 2011."},
  {f:"100.64.0.0/10", b:"RFC 6598 shared address space for ISP carrier-grade NAT: 100.64.0.0–100.127.255.255. On a router's WAN it means no public address of its own, so port forwarding fails."},
  {f:"169.254.0.0/16", b:"APIPA / link-local: a host that got no DHCP answer gives itself one, with mask 255.255.0.0 and no gateway. Not routed; only reaches other 169.254 hosts on the link."},
  {f:"0.0.0.0 and 255.255.255.255", b:"0.0.0.0 = this host (DHCP source before an address) or, as 0.0.0.0/0, the default route. 255.255.255.255 = limited broadcast to the local network; never routed."},
  {f:"Network address and directed broadcast", b:"Host bits all 0 = network address (names the network). Host bits all 1 = directed broadcast for that network. Neither can be a host address; hence hosts = 2^h − 2."},
  {f:"127.0.0.0/8", b:"Loopback: packets never leave the device. 127.0.0.1 = localhost. Ping it to test the local TCP/IP stack."},
  {f:"Documentation ranges (RFC 5737)", b:"192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET-1, -2, -3). For examples and diagrams only; never routed."},
  {f:"Unicast, broadcast, multicast at Layer 3", b:"Unicast: one host (normal A/B/C address). Broadcast: 255.255.255.255 or a network's directed broadcast. Multicast: a group, 224.0.0.0–239.255.255.255 (MACs start 01-00-5e)."},
],
});
// ---------- Module 3 · Lesson 3 ----------
L.push({
id:"ip-masks", mins:80, level:"Beginner+ · builds on Module 3 lessons 1–2",
t:"Subnet masks and prefixes: the AND that finds the network",
html:`
${K.goals([
  "Explain what a subnet mask is and say whether a mask is valid, and why.",
  "Convert a dotted mask to a /prefix and back on paper in under thirty seconds.",
  "Do the bitwise AND by hand to find any address's network address.",
  "Find the broadcast, first and last usable host and host count — and know when /31 and /32 break the &minus;2 rule.",
  "Predict whether a host ARPs for a destination or its gateway, and fix mask faults.",
])}
${K.pre(["Module 3 lesson 1: binary place values and converting an octet both ways.","Module 3 lesson 2: IPv4 address structure, network and host parts.","Module 2 lesson 4: ARP and the local-or-remote decision."])}

<h2>Why this matters at work</h2>
<p>A bank branch in Wuse, Abuja. Two teller PCs sit side by side on the same switch, addresses one number apart. TELLER-1 opens the core banking application; TELLER-2 gets <i>Destination host unreachable</i>. Cables swapped, PC rebooted, ticket escalated: still broken. The difference is a few characters in one field — the subnet mask.</p>
<p>Every host uses its mask, thousands of times a minute, to decide: <i>is this destination on my own network, or do I hand it to the router?</i> Get the mask wrong and the host decides wrongly every time. This lesson teaches you to read and convert masks, do the host's calculation by hand, and spot the faults a bad mask creates.</p>

<h2>What a subnet mask is: a ruler laid over 32 bits</h2>
<p>In lesson 2 you saw that an IPv4 address has a network part (<i>which network</i>) and a host part (<i>which device on it</i>). In the classful world the first octet fixed the split. Real networks need the line in other places — after 26 bits, after 20, after 30 — and something has to tell every device where it is. That something is the mask.</p>
<p>A ${K.g("subnet mask","A 32-bit value, written like an address, whose 1 bits mark the network part and 0 bits the host part.")} is 32 bits, written in dotted decimal like an address. Laid bit for bit over an address, it marks each bit as one of two things:</p>
<ul>
<li>a <b>1</b> in the mask means &ldquo;this bit of the address belongs to the ${K.g("network portion","The left-hand bits, marked by mask 1s; identical for every device on the subnet.")}&rdquo;;</li>
<li>a <b>0</b> in the mask means &ldquo;this bit belongs to the ${K.g("host portion","The right-hand bits, marked by mask 0s; they identify one device.")}&rdquo;.</li>
</ul>
<p>One strict rule: the 1s come first and are ${K.g("contiguous","With no gaps: every 1 bit is left of every 0 bit.")} — a solid run of 1s from the left, then 0s to the end, never 1, 0, 1. So a mask only answers one question: <i>how many bits from the left are network?</i></p>
${K.svg("0 0 720 200",
  [...Array(32)].map((_,i)=>{ const x = 24 + i*20 + Math.floor(i/8)*10, net = i<26;
    return `<rect x="${x}" y="50" width="18" height="26" rx="3" fill="${net?"var(--accent)":"var(--chip)"}" fill-opacity="${net?0.22:1}" stroke="${net?"var(--accent)":"var(--line)"}"/>`+K.txt(x+9,68,net?"1":"0",{c:"fg",s:12,mid:true,b:true}); }).join("")+
  [["octet 1","255",103],["octet 2","255",273],["octet 3","255",443],["octet 4","192",613]].map(([o,v,c])=>K.txt(c,40,o,{mid:true})+K.txt(c,98,v,{mid:true,c:"fg",s:13,b:true})).join("")+
  K.band(24,112,548,24,"network part — 26 bits (the mask's 1s)","var(--chip)")+K.band(574,112,118,24,"host — 6 bits")+
  K.txt(360,160,"Written two ways: 255.255.255.192  =  /26",{mid:true,c:"fg",s:12.5})+
  K.txt(360,180,"The 1s always start at the left and never restart after a 0.",{mid:true,f:"body"}),
  "The mask as a ruler over the 32 bits: twenty-six 1s mark the network part, six 0s mark the host part. Each octet of 8 bits converts to one decimal number.")}
${K.analogy(`<p>&ldquo;14 Adeola Odeku Street&rdquo;: the street name says which group of buildings, the number says which building. An IP address has no spaces, so the mask is the instruction saying where the street name ends and the house number begins.</p>`)}
<h3>The only nine values an octet of a mask can have</h3>
<p>Because the 1s are contiguous, a mask octet can only be some 1s on the left and 0s on the right: nine possibilities, from no 1s to eight. Add up the place values (lesson 1) of the 1s:</p>
<div class="tablewrap"><table>
<tr><th>1-bits</th><th>Binary</th><th>Decimal</th></tr>
<tr><td>0</td><td><code>00000000</code></td><td><b>0</b></td></tr>
<tr><td>1</td><td><code>10000000</code></td><td><b>128</b></td></tr>
<tr><td>2</td><td><code>11000000</code></td><td><b>192</b> (128 + 64)</td></tr>
<tr><td>3</td><td><code>11100000</code></td><td><b>224</b> (192 + 32)</td></tr>
<tr><td>4</td><td><code>11110000</code></td><td><b>240</b> (224 + 16)</td></tr>
<tr><td>5</td><td><code>11111000</code></td><td><b>248</b> (240 + 8)</td></tr>
<tr><td>6</td><td><code>11111100</code></td><td><b>252</b> (248 + 4)</td></tr>
<tr><td>7</td><td><code>11111110</code></td><td><b>254</b> (252 + 2)</td></tr>
<tr><td>8</td><td><code>11111111</code></td><td><b>255</b> (254 + 1)</td></tr>
</table></div>
${K.remember(`<p><b>0 · 128 · 192 · 224 · 240 · 248 · 252 · 254 · 255.</b> Each is the last plus the next place value (64, 32, 16, 8, 4, 2, 1). Say it as a rhythm — &ldquo;one-twenty-eight, one-ninety-two, two-twenty-four, two-forty, forty-eight, fifty-two, fifty-four, fifty-five&rdquo; — and write it on your scratch paper before the first exam question.</p>`)}
<h3>Valid and invalid masks</h3>
<p>Two checks: every octet must be one of the nine values, and once an octet is below 255, every octet after it must be 0.</p>
<ul>
<li><code>255.255.255.192</code> — valid (/26). Three full octets, then 11000000.</li>
<li><code>255.254.0.0</code> — valid (/15). 254 is allowed, and everything after it is 0.</li>
<li><code>255.255.0.255</code> — <b>invalid</b>. In binary: <code>11111111.11111111.00000000.11111111</code>. The 1s stop after bit 16, then start again at bit 25. There is no single line between network and host.</li>
<li><code>255.255.255.191</code> — <b>invalid</b>. 191 is <code>10111111</code>: a 0 with 1s after it. 191 isn't on the list of nine.</li>
<li><code>255.255.192.128</code> — <b>invalid</b>. Both octets are on the list, but the third (11000000) ends in 0s and the fourth starts with a 1.</li>
</ul>
<p>Why it matters: with a gap, a subnet's addresses wouldn't form one unbroken range, and every method in this module assumes one clean line. Cisco IOS rejects such a mask with <code>% Bad mask</code>; Windows refuses to save it.</p>
${K.dyk(`The original subnetting standard, RFC 950 (1985), only <i>recommended</i> contiguous masks. Almost nobody used gaps — they made plans unreadable — and once classless addressing (next section) wrote masks as a single bit count in 1993, gaps couldn't even be expressed.`)}
${K.mistake(`Treating <code>255.255.255.0</code> as &ldquo;the&rdquo; mask. It is one of 33 (/0 to /32). Typing it from habit causes this lesson's most common fault: a host whose mask doesn't match its subnet.`)}
${K.check({q:"Which of these is a valid subnet mask?", o:["255.255.0.255","255.255.255.248","255.255.255.250","255.0.255.0"], a:1, why:"248 (11111000) is a contiguous run after three full octets. 250 isn't one of the nine values; the other two restart their 1s after a 0."})}

<h2>Prefix notation: counting the ones</h2>
<p>A valid mask is always <i>n</i> ones then 0s, so you only need <i>n</i>: the ${K.g("prefix length","The number of 1 bits in the mask, written after a slash: /26 means 26 ones then 6 zeros.")}. <code>192.168.10.77/26</code> means &ldquo;192.168.10.77 with a mask of 26 ones&rdquo;. This is ${K.g("CIDR notation","Classless Inter-Domain Routing (1993): address/prefix, replacing fixed class boundaries.")}. Both forms carry the same information, and different tools use different ones:</p>
${K.when([
  ["Dotted mask (255.255.255.192)","Cisco interface addresses (<code>ip address 192.168.10.65 255.255.255.192</code>), static routes, Windows IP settings","IOS interface and route commands take a dotted mask","Reading routing tables — they show prefixes"],
  ["Prefix (/26)","<code>show ip route</code>, <code>show interfaces</code>, Linux <code>ip addr</code>, cloud consoles, design documents","Short; states the bit count directly","Typing an IOS <code>ip address</code> command"],
  ["Wildcard (0.0.0.63)","ACLs and OSPF <code>network</code> statements (later modules)","The inverse of the mask: 0 = must match","Interface addresses or Windows"],
], "Dotted mask, prefix or wildcard — where each one is used")}
<h3>Prefix to mask</h3>
<p>Every full group of 8 ones is an octet of 255; the leftover ones (0 to 7) give the next octet from the table of nine; the rest are 0.</p>
${K.steps([
  ["/26 → ?", `<p>26 ÷ 8 = 3 full octets, remainder 2. Three octets of 255, then two ones = <code>11000000</code> = 128 + 64 = 192. <b>/26 = 255.255.255.192</b>.</p>`],
  ["/20 → ?", `<p>20 ÷ 8 = 2 full octets, remainder 4. 255.255, then four ones = <code>11110000</code> = 128 + 64 + 32 + 16 = 240, then a final 0. <b>/20 = 255.255.240.0</b>.</p>`],
  ["/13 → ?", `<p>13 ÷ 8 = 1 full octet, remainder 5. 255, then five ones = <code>11111000</code> = 248, then 0.0. <b>/13 = 255.248.0.0</b>.</p>`],
])}
<h3>Mask to prefix</h3>
<p>Count the ones in each octet and add: 255 is 8, 0 is 0, and the octet in between comes from the table.</p>
${K.steps([
  ["255.255.248.0 → ?", `<p>255 = 8, 255 = 8, 248 = <code>11111000</code> = 5, 0 = 0. 8 + 8 + 5 + 0 = <b>/21</b>.</p>`],
  ["255.192.0.0 → ?", `<p>255 = 8, 192 = <code>11000000</code> = 2, then zeros. 8 + 2 = <b>/10</b>.</p>`],
  ["255.255.255.252 → ?", `<p>8 + 8 + 8, and 252 = <code>11111100</code> = 6. 24 + 6 = <b>/30</b> — the classic mask for a router-to-router link.</p>`],
])}
${K.tip(`Use the octet boundaries as anchors: <b>/8, /16, /24</b>. /27 is /24 plus 3 bits, so the fourth octet is 224.`)}
${K.exam(`The CCNA mixes the forms on purpose: the question says <code>/27</code>, the options say <code>255.255.255.224</code>. Convert first, then answer — and watch for an option pairing the right mask with the wrong prefix.`)}
<h3>Your turn on paper</h3>
<p>Get a pen. Convert each, then check.</p>
<ol>
<li>/19 as a dotted mask</li>
<li>/27 as a dotted mask</li>
<li>/12 as a dotted mask</li>
<li>255.255.255.240 as a prefix</li>
<li>255.255.254.0 as a prefix</li>
<li>Is 255.255.255.127 a valid mask?</li>
</ol>
${K.hint(`Write the nine values first: 0 128 192 224 240 248 252 254 255 — the position in that list (counting from 0) is the number of ones. For question 6, write 127 in binary and look at the first bit.`)}
${K.reveal("Answers with working",`<ol>
<li>19 = 8 + 8 + 3 → 255.255.(three ones = 224).0 → <b>255.255.224.0</b></li>
<li>27 = 8 + 8 + 8 + 3 → <b>255.255.255.224</b></li>
<li>12 = 8 + 4 → 255.(four ones = 240).0.0 → <b>255.240.0.0</b></li>
<li>8 + 8 + 8 + (240 = four ones) = <b>/28</b></li>
<li>8 + 8 + (254 = seven ones) + 0 = <b>/23</b></li>
<li><b>No.</b> 127 = <code>01111111</code>: it starts with a 0 and has 1s after it. The mask's 1s have to fill from the left.</li>
</ol>`)}
<p>Now make it automatic: fresh conversions every time, with the working shown when you miss.</p>
${K.drill({title:"prefix ↔ mask until it's reflex", types:["prefix2mask","mask2prefix"], count:6})}
${K.q({type:"fill", q:"Convert each value. Write masks in dotted decimal and prefixes with the slash.", fields:[{label:"/22 as a mask", a:["255.255.252.0"]},{label:"255.255.255.248 as a prefix", a:["/29","29"]},{label:"/9 as a mask", a:["255.128.0.0"]}], why:"/22 = 8 + 8 + 6 → 255.255.252.0. 248 = five ones → /29. /9 = 8 + 1 → 255.128.0.0."})}
${K.check({q:"A routing table shows 10.40.0.0/14. Which mask is that?", o:["255.255.252.0","255.252.0.0","255.240.0.0","255.254.0.0"], a:1, why:"14 = 8 + 6: 255, then six ones = 252, then zeros. 255.255.252.0 is /22; 255.254.0.0 is /15."})}

<h2>The bitwise AND: how a device finds the network address</h2>
<p>Every device finds the ${K.g("network address","The address of the subnet itself: the address with every host bit set to 0. It names the subnet and is not given to a host.")} — the name of the subnet an address belongs to — with one operation, the ${K.g("bitwise AND","Comparing two binary numbers bit by bit: the result bit is 1 only where both bits are 1, otherwise 0.")}.</p>
<p>AND gives <b>1 only if both bits are 1</b>; anything with a 0 gives 0. Line the address and mask up and AND each column. Under a mask 1 (network part) the address bit passes through; under a mask 0 (host part) the result is forced to 0. The AND keeps the network part and wipes the host part clean.</p>
${K.svg("0 0 720 250",
  K.txt(150,30,"place value",{end:true})+[128,64,32,16,8,4,2,1].map((v,j)=>K.txt(169+j*44,30,String(v),{mid:true})).join("")+
  `<rect x="234" y="40" width="268" height="162" rx="6" fill="var(--chip)" opacity="0.6"/>`+
  [["77  address","01001101",60],["192  mask","11000000",104],["64  network","01000000",168]].map(([lab,bits,y],r)=>K.txt(140,y+20,lab,{end:true,c:r===2?"accent":"fg",s:12,b:r===2})+[...bits].map((b,j)=>`<rect x="${150+j*44}" y="${y}" width="38" height="30" rx="4" fill="var(--panel2)" stroke="${r===2?"var(--accent)":"var(--line)"}"/>`+K.txt(169+j*44,y+20,b,{mid:true,c:r===2?"accent":"fg",s:14,b:true})).join("")).join("")+
  `<line x1="150" y1="150" x2="496" y2="150" stroke="var(--muted)" stroke-width="1.4"/>`+K.txt(140,154,"AND",{end:true,b:true,c:"fg"})+
  K.txt(194,222,"mask 1 → bit passes through",{mid:true,c:"ok",f:"body"})+K.txt(368,222,"mask 0 → result forced to 0",{mid:true,c:"bad",f:"body"})+
  K.box(540,50,160,140,"","")+K.txt(620,74,"AND truth table",{mid:true,c:"fg",b:true,f:"display",s:12})+
  [["1 AND 1 = 1","ok"],["1 AND 0 = 0","muted"],["0 AND 1 = 0","muted"],["0 AND 0 = 0","muted"]].map(([t,c],i)=>K.txt(620,102+i*22,t,{mid:true,c,s:12.5})).join(""),
  "The fourth octet of 192.168.10.77/26, AND-ed bit by bit with the mask's 192. The two columns under mask 1s copy the address bits; the six columns under mask 0s become 0. 01000000 = 64.")}
${K.analogy(`<p>A stencil: card with holes cut where the mask's 1s are. Lay it over the address — through the holes the address shows; elsewhere you see blank (0). What's visible is the network address.</p>`)}
<h3>Worked example 1: 192.168.10.77/26</h3>
${K.steps([
  ["Write the mask", `<p>/26 = 255.255.255.192 (previous section).</p>`],
  ["Write both in binary, aligned octet under octet", `<p>Use place values 128 64 32 16 8 4 2 1. 192 = 128 + 64 → <code>11000000</code>. 168 = 128 + 32 + 8 → <code>10101000</code>. 10 = 8 + 2 → <code>00001010</code>. 77 = 64 + 8 + 4 + 1 → <code>01001101</code>.</p>`],
  ["AND each column", `${K.out(`              octet 1    octet 2    octet 3    octet 4
Address       11000000 . 10101000 . 00001010 . 01001101    192.168.10.77
Mask (/26)    11111111 . 11111111 . 11111111 . 11000000    255.255.255.192
              ------------------------------------------- AND
Network       11000000 . 10101000 . 00001010 . 01000000    192.168.10.64`, "Every bit of the address is AND-ed with the bit of the mask directly under it.")}`],
  ["Convert back to decimal", `<p>Octets 1–3 are unchanged (AND-ed with all 1s). Octet 4: <code>01000000</code> = 64. <b>Network address: 192.168.10.64</b>. Written with its prefix, the subnet is <b>192.168.10.64/26</b>.</p>`],
])}
<h3>Worked example 2: 172.20.130.9/20</h3>
${K.steps([
  ["Write the mask", `<p>/20 = 8 + 8 + 4 → 255.255.240.0.</p>`],
  ["Binary, aligned", `<p>172 = 128 + 32 + 8 + 4 → <code>10101100</code>. 20 = 16 + 4 → <code>00010100</code>. 130 = 128 + 2 → <code>10000010</code>. 9 = 8 + 1 → <code>00001001</code>.</p>`],
  ["AND", `${K.out(`              octet 1    octet 2    octet 3    octet 4
Address       10101100 . 00010100 . 10000010 . 00001001    172.20.130.9
Mask (/20)    11111111 . 11111111 . 11110000 . 00000000    255.255.240.0
              ------------------------------------------- AND
Network       10101100 . 00010100 . 10000000 . 00000000    172.20.128.0`, "The line between network and host falls in the middle of octet 3.")}`],
  ["Read the result", `<p>Octet 3: <code>1000</code> survives from 130, the last four bits are wiped → 128. Octet 4 becomes 0. <b>Network: 172.20.128.0/20</b> — <i>not</i> 172.20.130.0, because the line runs through octet 3.</p>`],
])}
<h3>Worked example 3: 10.4.5.6/8</h3>
${K.steps([
  ["Mask on an octet boundary", `<p>/8 = 255.0.0.0. An octet AND-ed with 255 is copied; AND-ed with 0 it becomes 0.</p>`],
  ["AND", `${K.out(`              octet 1    octet 2    octet 3    octet 4
Address       00001010 . 00000100 . 00000101 . 00000110    10.4.5.6
Mask (/8)     11111111 . 00000000 . 00000000 . 00000000    255.0.0.0
              ------------------------------------------- AND
Network       00001010 . 00000000 . 00000000 . 00000000    10.0.0.0`, "Octet-boundary masks need no binary at all.")}`],
  ["Result", `<p><b>Network: 10.0.0.0/8</b> — one network of more than sixteen million addresses.</p>`],
])}
<h3>The shortcut hidden in those examples</h3>
<p>Octets under a 255 were copied; octets under a 0 became 0. Only <b>one</b> octet needed binary: the ${K.g("interesting octet","The mask octet that is neither 255 nor 0, where the network/host line falls.")}, where the mask is neither 255 nor 0. Lesson 5 turns this into mental arithmetic; for now, do the binary until you trust it.</p>
${K.tip(`Write <code>128 64 32 16 8 4 2 1</code> across the top of your paper first. Every conversion becomes reading under a ruler.`)}
<h3>Your turn on paper</h3>
<p>Find the network address of each. Show the interesting octet in binary.</p>
<ol><li>10.20.37.200/21</li><li>192.168.50.140/27</li></ol>
${K.hint(`/21 = 255.255.248.0, so octet 3 is interesting: write 37 and 248 in binary. /27 = 255.255.255.224, so octet 4 is interesting: write 140 and 224 in binary.`)}
${K.reveal("Answers with working",`${K.out(`10.20.37.200/21 — octet 3
  37   00100101
 248   11111000
       -------- AND
       00100000  = 32      → network 10.20.32.0/21

192.168.50.140/27 — octet 4
 140   10001100
 224   11100000
       -------- AND
       10000000  = 128     → network 192.168.50.128/27`, "Only the interesting octet needs binary; the octets before it are copied and the octets after it are 0.")}`)}
${K.check({q:"What is the network address of 172.20.130.9 with mask 255.255.240.0?", o:["172.20.130.0","172.20.0.0","172.20.128.0","172.20.143.0"], a:2, why:"130 (10000010) AND 240 (11110000) = 10000000 = 128; octet 4 becomes 0."})}

<h2>Broadcast, host range and how many hosts fit</h2>
<p>The network address has every host bit 0. Set every host bit to 1 and you get the ${K.g("broadcast address","The last address of a subnet: every host bit set to 1. A packet sent to it is delivered to every host on that subnet.")}, which reaches every host on the subnet. Neither can be given to a host: one names the subnet, the other belongs to everyone. Everything between them is a ${K.g("usable host address","An address between the network and broadcast addresses that can be assigned to a device: network + 1 to broadcast − 1.")}.</p>
<h3>Worked example: 192.168.10.77/26, continued</h3>
${K.out(`               octets 1-3   octet 4 (net | host)
Network        192.168.10   01|000000    .64    host bits all 0
First usable   192.168.10   01|000001    .65    network + 1
Last usable    192.168.10   01|111110    .126   broadcast - 1
Broadcast      192.168.10   01|111111    .127   host bits all 1`, "The first two bits of octet 4 are network (from /26); only the six host bits change.")}
<p>Broadcast <code>01111111</code> = 127. Six host bits → 2<sup>6</sup> = 64 addresses, minus network and broadcast = <b>62 usable hosts</b>.</p>
${K.steps([
  ["172.20.130.9/20", `<p>Network 172.20.128.0, with 12 host bits: the last four of octet 3 and all of octet 4. All set to 1: octet 3 <code>1000|1111</code> = 143, octet 4 = 255. <b>Broadcast 172.20.143.255</b>; usable <b>172.20.128.1 to 172.20.143.254</b>; hosts 2<sup>12</sup> − 2 = <b>4,094</b>. So 172.20.130.0 and 172.20.131.255 are ordinary hosts here — an address is only special if the mask makes it so.</p>`],
  ["10.4.5.6/8", `<p>Network 10.0.0.0, 24 host bits. <b>Broadcast 10.255.255.255</b>; usable <b>10.0.0.1 to 10.255.255.254</b>; hosts 2<sup>24</sup> − 2 = <b>16,777,214</b>.</p>`],
])}
<h3>The host-count formula — and why &minus;2</h3>
<p>Host bits <b>h = 32 − prefix</b>. Each host bit doubles the count, so the subnet holds 2<sup>h</sup> addresses. Two are reserved — all-zeros (network) and all-ones (broadcast) — so <b>usable hosts = 2<sup>h</sup> − 2</b>.</p>
<div class="tablewrap"><table>
<tr><th>Prefix</th><th>Mask</th><th>Host bits</th><th>Addresses</th><th>Usable</th><th>Typical use</th></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>8</td><td>256</td><td>254</td><td>Department LAN</td></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>7</td><td>128</td><td>126</td><td>Medium LAN</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>6</td><td>64</td><td>62</td><td>Small office</td></tr>
<tr><td>/27</td><td>255.255.255.224</td><td>5</td><td>32</td><td>30</td><td>Printers, cameras</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>4</td><td>16</td><td>14</td><td>Servers</td></tr>
<tr><td>/29</td><td>255.255.255.248</td><td>3</td><td>8</td><td>6</td><td>A few public IPs from an ISP</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>2</td><td>4</td><td>2</td><td>Point-to-point (traditional)</td></tr>
<tr><td>/31</td><td>255.255.255.254</td><td>1</td><td>2</td><td>2 (RFC 3021)</td><td>Router-to-router link</td></tr>
<tr><td>/32</td><td>255.255.255.255</td><td>0</td><td>1</td><td>1</td><td>Loopback, host route</td></tr>
</table></div>
<h3>The exceptions: /31 and /32</h3>
<p>By the formula a /31 has 0 usable hosts and a /32 has −1, yet both are used daily as defined exceptions.</p>
<p><b>/31 — point-to-point links.</b> A ${K.g("point-to-point link","A link with exactly two devices on it, typically two routers connected by one cable or a WAN circuit.")} has exactly two devices, so nobody needs a broadcast to reach &ldquo;everyone&rdquo;. ${K.g("RFC 3021","The standard allowing /31 on point-to-point links, both addresses usable.")} makes both addresses of a /31 usable: 10.0.0.0/31 and 10.0.0.1/31, one per router — two addresses per link instead of a /30's four. IOS supports it; on an Ethernet interface it warns that /31 is meant for point-to-point use, since it can't know only two devices share the cable.</p>
<p><b>/32 — one address.</b> No host bits: exactly one address. A ${K.g("loopback interface","A virtual, always-up interface, usually given a /32 as the device's stable identity.")} usually gets a /32, and a ${K.g("host route","A route to a single address, written with /32.")} points at one address — every Cisco routing table holds one, marked <code>L</code>, for each of the router's own addresses.</p>
${K.when([
  ["/23 to /26 LAN","User devices: PCs, phones, Wi-Fi clients","Room to grow; broadcasts stay manageable","Two-device links"],
  ["/30","Point-to-point link where one end may not support /31","Universally supported","Both ends are yours and support /31"],
  ["/31","Router-to-router link under your control","Half a /30's addresses; both usable","More than two devices on the segment"],
  ["/32","Loopbacks, host routes, a rule for one server","Names exactly one address","An interface that must reach neighbours"],
], "Choosing a prefix for the job")}
${K.exam(`Use <b>2<sup>h</sup> − 2</b> unless the question is clearly about a /31 link or a /32. Distractors are the answer +2 (no subtraction) or +1 (only the network subtracted): a /27 has <b>30</b> usable, not 32 or 31.`)}
${K.mistake(`Giving a host the network or broadcast address because it &ldquo;looks normal&rdquo;. 172.16.5.99/30: 99 = <code>01100011</code>, AND-ed with 252 gives 96, and both host bits are already 1 — it's the <b>broadcast</b> of 172.16.5.96/30. Check any address that sits right before a block boundary.`)}
<p>Now drill the AND, range and host count together.</p>
${K.drill({title:"same subnet? and find the network, broadcast and range", types:["samesub","subnet"], count:6})}
${K.q({type:"match", q:"Match each prefix with its number of usable host addresses.", pairs:[["/24","254"],["/25","126"],["/27","30"],["/29","6"],["/32","1 (a single address, e.g. a loopback)"]], why:"Host bits = 32 − prefix, usable = 2^h − 2: /24 → 256 − 2, /25 → 128 − 2, /27 → 32 − 2, /29 → 8 − 2. A /32 is the exception: no host bits, one address, used for loopbacks and host routes."})}
${K.check({q:"A router-to-router link is numbered 10.255.0.4/31. Which statement is true?", o:["It can't work: a /31 has 0 usable hosts","Both 10.255.0.4 and 10.255.0.5 can be assigned, one per router","Only .5 is usable; .4 is the network address","It needs a broadcast address for routing traffic"], a:1, why:"RFC 3021: on a point-to-point /31 there is no network or broadcast address, and both addresses are usable."})}

<h2>How a host uses its mask: local or remote?</h2>
<p>In Module 2 lesson 4 you watched every host decide before sending: is the destination <b>local</b> (ARP for it) or <b>remote</b> (ARP for the default gateway)? With /24 masks you compared the first three numbers. Here is what the host really does:</p>
${K.steps([
  ["AND its own address with its own mask", `<p>That gives the host's own network address.</p>`],
  ["AND the destination with its own mask", `<p>The <i>host's</i> mask, not the destination's — the host has no idea what mask the destination uses.</p>`],
  ["Compare the two results", `<p><b>Equal → local:</b> ARP for the destination and frame straight to it. <b>Different → remote:</b> ARP for the gateway and frame to the router's MAC.</p>`],
])}
<p>Try it on two apparent neighbours, 192.168.1.60/26 and 192.168.1.70/26:</p>
${K.out(`                 octet 4     AND 192 (11000000)   network
192.168.1.60     00111100    00000000 = 0         192.168.1.0/26
192.168.1.70     01000110    01000000 = 64        192.168.1.64/26`, "Ten apart in decimal, but on opposite sides of the .64 block boundary.")}
<p>Different results: a host at .60 treats .70 as <b>remote</b>. With no router there is nowhere to send it, though both PCs share a switch.</p>
${K.svg("0 0 720 200",
  [0,1,2,3].map(k=>K.box(40+k*160,60,158,44,`192.168.1.${k*64}/26`,`hosts .${k*64+1} – .${k*64+62} · bcast .${k*64+63}`,k<2)).join("")+
  K.txt(40,130,".0",{mid:true})+K.txt(200,130,".64",{mid:true,c:"accent",b:true})+K.txt(360,130,".128",{mid:true})+K.txt(520,130,".192",{mid:true})+K.txt(678,130,".255",{mid:true})+
  `<line x1="200" y1="40" x2="200" y2="150" stroke="var(--bad)" stroke-width="2" stroke-dasharray="4 3"/>`+
  K.arrow(150,28,190,58,"FRONT-DESK .60",true)+K.arrow(320,176,222,112,"PHARMACY-PC .70",true)+
  K.txt(360,195,"192.168.1.0/24 cut into four /26 blocks: .60 and .70 fall on either side of the line at .64.",{mid:true,f:"body"}),
  "Why addresses that look close can be in different subnets: the /26 mask cuts 192.168.1.0/24 into four blocks of 64, and the boundary between the first two is at .64.")}
<h3>When the two ends disagree about the mask</h3>
<p>Each host uses only its own mask, so two hosts can disagree about being neighbours: the request gets through, the reply doesn't. Hence symptoms like &ldquo;it works from these desks, not those&rdquo;.</p>
${K.mistake(`Fixing only one side. Correct the wrong host to match the <b>design</b>, not to whatever makes one ping work. One PC &ldquo;fixed&rdquo; to /24 beside a /26 neighbour gives one-way traffic.`)}
<h3>Hands-on: two neighbours that can't talk</h3>
<p>A clinic in Surulere has split 192.168.1.0/24 into four /26s, one per department; the consulting rooms are <b>192.168.1.64/26</b> (hosts .65 to .126). The router arrives next month; for now the room's devices only need each other. FRONT-DESK can't reach PHARMACY-PC on the same switch. Read the frame log after every command.</p>
${K.bench({id:"m3-mask-neighbours", points:60, from:"CCNA · Module 3 · lesson 3", title:"same switch, different subnets", viewBox:"0 0 760 360", openLog:true,
  intro:"Use <b>Command Prompt</b> and <b>IP settings</b> under each PC. There is no router on this bench. The plan says this room is <code>192.168.1.64/26</code>.",
  devices:[
    {id:"sw1", kind:"switch", label:"CLINIC-SW1", model:"Catalyst 9200 · consulting rooms", x:40, y:30},
    {id:"fd", kind:"pc", label:"FRONT-DESK", x:70, y:220, ip:"192.168.1.60", mask:"255.255.255.192"},
    {id:"ph", kind:"pc", label:"PHARMACY-PC", x:330, y:220, ip:"192.168.1.70", mask:"255.255.255.192"},
  ],
  cables:[ {type:"cat6", a:"fd:eth", b:"sw1:g1"}, {type:"cat6", a:"ph:eth", b:"sw1:g2"} ],
  tray:["cat6"],
  tasks:[
    {text:"Run <code>ipconfig</code> on <b>both</b> PCs. Same mask, addresses ten apart — do the AND for each on paper", done:B=>Bench.tried(B,"fd",/^\s*ipconfig/i) && Bench.tried(B,"ph",/^\s*ipconfig/i)},
    {text:"From FRONT-DESK, <code>ping 192.168.1.70</code>. <i>General failure</i>: the log says FRONT-DESK treated .70 as remote and has no gateway to send it to. No frame was sent", done:B=>Bench.tried(B,"fd",/^\s*ping\s+192\.168\.1\.70\s*$/i)},
    {text:"Run <code>arp -a</code> on FRONT-DESK. The static broadcast row reads <code>192.168.1.63</code> — the broadcast of 192.168.1.0/26, not of the room's subnet", done:B=>Bench.tried(B,"fd",/^\s*arp\s+-a\s*$/i)},
    {text:"Fix the PC that's outside the plan: give FRONT-DESK a free address in 192.168.1.64/26 (not .64, .70 or .127), mask <code>255.255.255.192</code>, then ping 192.168.1.70 again", done:B=>{ const d=B.devs.fd, o=String(d.ip||"").split("."); const last=+o[3]; return d.mask==="255.255.255.192" && o.length===4 && o.slice(0,3).join(".")==="192.168.1" && last>=65 && last<=126 && last!==70 && Bench.pinged(B,"fd","192.168.1.70"); }},
    {text:"Prove it both ways: from PHARMACY-PC, ping FRONT-DESK's <b>new</b> address", done:B=>{ const d=B.devs.fd; return !!d.ip && d.mask==="255.255.255.192" && Bench.pinged(B,"ph",d.ip); }},
  ],
  win:"You proved that being on the same switch isn't enough: the mask put .60 and .70 in different subnets, so FRONT-DESK wouldn't even ARP for its neighbour. Moving it into the planned block made them local to each other — and the broadcast row in arp -a told you which subnet each PC believed it was in.",
  solve:[["pc","fd","ipconfig"],["pc","ph","ipconfig"],["pc","fd","ping 192.168.1.70"],["pc","fd","arp -a"],["ip","fd","192.168.1.66","255.255.255.192",""],["pc","fd","ping 192.168.1.70"],["pc","ph","ping 192.168.1.66"]]})}
${K.hint(`Task 4 won't tick? The address must be 192.168.1.65–126 (not .70) with mask 255.255.255.192; then ping 192.168.1.70 again.`)}
${K.reveal("Experiment: what if you'd changed only FRONT-DESK's mask to /24?",`<p><b>Reset bench</b>, set FRONT-DESK to <code>192.168.1.60</code> / <code>255.255.255.0</code> and ping .70. ARP succeeds and the request <i>arrives</i>, yet you get <b>Request timed out</b>: PHARMACY-PC, still /26, sees .60 as remote and has no gateway for the reply. One-way failure.</p>`)}
<h3>A mask that's too wide: sending ARP requests for a host behind the router</h3>
<p>The opposite fault: a mask with too few 1s, so the host thinks a huge range is local and ARPs directly for hosts behind the router. In Module 2 lesson 4 proxy ARP covered for this; this branch router is hardened with <code>no ip proxy-arp</code>, so the fault shows.</p>
<p>Back to Wuse. The teller LAN is <b>172.20.128.0/20</b> (gateway .128.1) — worked example 2; the core banking server is <b>172.20.160.10</b> behind the router. Do each teller's AND first.</p>
${K.bench({id:"m3-mask-gateway", points:80, from:"CCNA · Module 3 · lesson 3", title:"the teller who ARPs for the server", viewBox:"0 0 760 410", openLog:true,
  intro:"Use <b>Command Prompt</b> and <b>IP settings</b> under each teller. For the router, open <b>Terminal app (PuTTY)</b> under your laptop: 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control. WUSE-R1 has no enable secret on this bench and has proxy ARP disabled on G0/0.",
  devices:[
    {id:"sw1", kind:"switch", label:"WUSE-SW1", model:"Catalyst 9200 · banking hall", x:20, y:150},
    {id:"r1", kind:"router", label:"WUSE-R1", model:"ISR 1100 · branch router", x:500, y:20,
      config:e=>{ ["enable","configure terminal","interface g0/0","description LAN - tellers 172.20.128.0/20","ip address 172.20.128.1 255.255.240.0","no ip proxy-arp","no shutdown","interface g0/1","description CORE-APP 172.20.160.0/24","ip address 172.20.160.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"t1", kind:"pc", label:"TELLER-1", x:30, y:290, ip:"172.20.130.9", mask:"255.255.240.0", gw:"172.20.128.1"},
    {id:"t2", kind:"pc", label:"TELLER-2", x:190, y:290, ip:"172.20.130.10", mask:"255.255.0.0", gw:"172.20.128.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:370, y:290},
    {id:"srv", kind:"server", label:"CORE-APP", x:620, y:290, ip:"172.20.160.10", mask:"255.255.255.0", gw:"172.20.160.1"},
  ],
  cables:[ {type:"cat6", a:"t1:eth", b:"sw1:g1"}, {type:"cat6", a:"t2:eth", b:"sw1:g2"}, {type:"cat6", a:"r1:g0", b:"sw1:g8"}, {type:"cat6", a:"r1:g1", b:"srv:eth"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"From TELLER-1 (mask /20), <code>ping 172.20.160.10</code>. It works — in the log, TELLER-1 ARPs for the <b>gateway</b> 172.20.128.1, because 172.20.160.10 AND-ed with 255.255.240.0 is 172.20.160.0, not 172.20.128.0", done:B=>Bench.pinged(B,"t1","172.20.160.10") && Bench.arpHas(B,"t1","172.20.128.1")},
    {text:"On TELLER-2, run <code>ipconfig</code>, then <code>ping 172.20.160.10</code>. <i>Destination host unreachable</i>: the log shows TELLER-2 asking &ldquo;Who has 172.20.160.10?&rdquo; — and nobody answering", done:B=>Bench.tried(B,"t2",/^\s*ipconfig/i) && Bench.tried(B,"t2",/^\s*ping\s+172\.20\.160\.10\s*$/i)},
    {text:"From TELLER-2, <code>ping 172.20.130.9</code> (TELLER-1). It works — which is why &ldquo;the network is fine, it's the app&rdquo; is so tempting", done:B=>Bench.pinged(B,"t2","172.20.130.9")},
    {text:"Run <code>arp -a</code> on TELLER-2: TELLER-1 is there, the gateway isn't, and the broadcast row is <code>172.20.255.255</code> — a /16's broadcast", done:B=>Bench.tried(B,"t2",/^\s*arp\s+-a\s*$/i)},
    {text:"On the router console, <code>enable</code> and <code>show ip route</code>: the teller LAN is <code>172.20.128.0/20</code> — the design TELLER-2 should match", done:B=>B.devs.r1.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro/i.test(h))},
    {text:"Fix TELLER-2 in <b>IP settings</b>: mask <code>255.255.240.0</code> (keep 172.20.130.10 and gateway 172.20.128.1). Ping 172.20.160.10 again: now it ARPs for the gateway and gets replies", done:B=>{ const d=B.devs.t2; return d.mask==="255.255.240.0" && d.ip==="172.20.130.10" && d.gw==="172.20.128.1" && Bench.pinged(B,"t2","172.20.160.10") && Bench.arpHas(B,"t2","172.20.128.1"); }},
  ],
  win:"You watched the AND drive a real decision: with /16, TELLER-2 thought the server was a neighbour and ARPed for it on the wrong wire; with the designed /20, it handed the packet to its gateway. And you saw why the fault hid — the other teller, inside both masks, still answered.",
  solve:[["pc","t1","ping 172.20.160.10"],["pc","t2","ipconfig"],["pc","t2","ping 172.20.160.10"],["pc","t2","ping 172.20.130.9"],["pc","t2","arp -a"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],["ip","t2","172.20.130.10","255.255.240.0","172.20.128.1"],["pc","t2","ping 172.20.160.10"],["pc","t2","arp -a"]]})}
${K.hint(`TELLER-2's AND: with 255.255.0.0, 172.20.160.10 and 172.20.130.10 both give 172.20.0.0 → &ldquo;local&rdquo; → ARP for the server. With 255.255.240.0 they give 172.20.160.0 and 172.20.128.0 → remote → gateway.`)}
<p>Keep two clues: <i>Destination host unreachable</i> from <b>your own IP</b> means the host's ARP got no answer, and the broadcast row in <code>arp -a</code> shows the PC's real mask.</p>
<h3>Try it yourself: masks on a router interface</h3>
<p>IOS takes the dotted mask when you configure an interface and shows the prefix everywhere else. Give this router two subnets from the worked examples, watch IOS refuse an invalid mask and an overlap, then read the routing table.</p>
${K.hint(`<code>enable</code> → <code>configure terminal</code> → <code>interface g0/0</code> → <code>ip address 192.168.10.65 255.255.255.192</code> → <code>no shutdown</code>. Router interfaces start shut down. In config mode, put <code>do</code> in front of a show command.`)}
${K.term({env:"ios2", title:"configure and read masks on a router", opts:{kind:"router", host:"WUSE-R2", motd:"WUSE-R2 — console session (lab router, no enable secret). You are at user EXEC."},
  intro:"192.168.10.64/26 is the staff LAN on G0/0; 172.20.128.0/20 is the teller LAN on G0/1. Router interfaces start shut down.",
  tasks:[
    {text:"Give <code>GigabitEthernet0/0</code> the first usable address of 192.168.10.64/26 — <code>192.168.10.65 255.255.255.192</code> — and bring it up", done:e=>{ const i=e.intfs["GigabitEthernet0/0"]; return i.ip==="192.168.10.65" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"Under <code>interface g0/1</code>, try an invalid mask: <code>ip address 10.4.5.6 255.255.0.255</code>. IOS refuses it with <code>% Bad mask 0xFFFF00FF for address 10.4.5.6</code> — the mask shown in hex (FF = 255, 00 = 0)", done:e=>e.history.some(h=>/^\s*ip\s+add\S*\s+10\.4\.5\.6\s+255\.255\.0\.255\s*$/i.test(h))},
    {text:"Still on G0/1, try <code>ip address 192.168.10.100 255.255.255.192</code>. IOS refuses with <code>% 192.168.10.64 overlaps with GigabitEthernet0/0</code>: that address ANDs to 192.168.10.64 — the subnet already on G0/0", done:e=>e.history.some(h=>/^\s*ip\s+add\S*\s+192\.168\.10\.100\s+255\.255\.255\.192\s*$/i.test(h))},
    {text:"Now give G0/1 <code>172.20.128.1 255.255.240.0</code> and bring it up", done:e=>{ const i=e.intfs["GigabitEthernet0/1"]; return i.ip==="172.20.128.1" && i.mask==="255.255.240.0" && !i.shut; }},
    {text:"Run <code>show ip route</code> (or <code>do show ip route</code>): find the C route for each subnet and the L /32 for each of the router's own addresses", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro/i.test(h)) && e.intfs["GigabitEthernet0/1"].ip==="172.20.128.1"},
    {text:"Run <code>show interfaces g0/1 | include Internet</code> — the mask you typed as 255.255.240.0 comes back as <code>/20</code>", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+g\S*\s*0\/1(\s|$)/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"You typed masks the way IOS wants them, watched it reject a non-contiguous mask and an overlapping subnet, and read the same subnets back as prefixes — C for the subnet, L /32 for the router's own address.",
  solve:["enable","configure terminal","interface g0/0","ip address 192.168.10.65 255.255.255.192","no shutdown","interface g0/1","ip address 10.4.5.6 255.255.0.255","ip address 192.168.10.100 255.255.255.192","ip address 172.20.128.1 255.255.240.0","no shutdown","do show ip route","end","show interfaces g0/1 | include Internet","copy running-config startup-config",""]})}
<p>Here is the routing table you produced, line by line:</p>
${K.out(`WUSE-R2#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       ...
Gateway of last resort is not set

      172.20.0.0/16 is variably subnetted, 2 subnets, 2 masks
C        172.20.128.0/20 is directly connected, GigabitEthernet0/1
L        172.20.128.1/32 is directly connected, GigabitEthernet0/1
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.64/26 is directly connected, GigabitEthernet0/0
L        192.168.10.65/32 is directly connected, GigabitEthernet0/0`, "show ip route on an IOS router after configuring the two interfaces.")}
<ul>
<li><b>C 172.20.128.0/20</b> — connected route. IOS did the AND: 172.20.128.1 with /20 gives 172.20.128.0. Routes hold <i>network</i> addresses, never interface addresses.</li>
<li><b>L 172.20.128.1/32</b> — local route: a /32 host route for the router's own address.</li>
<li><b>172.20.0.0/16 is variably subnetted, 2 subnets, 2 masks</b> — a heading, not a route: IOS groups entries under the classful network (172.20 is Class B), and they use two prefixes (/20, /32).</li>
<li><b>Gateway of last resort is not set</b> — no default route yet (a later module).</li>
</ul>
${K.check({q:"A PC is 10.8.20.5, mask 255.255.0.0, gateway 10.8.20.1; the design is 10.8.20.0/24. A server at 10.8.30.7 is behind the router, which has proxy ARP disabled. What happens when the PC pings it?", o:["It ARPs for the gateway and the ping works","It ARPs for 10.8.30.7 directly; nobody answers: Destination host unreachable","It broadcasts the ping to 10.8.255.255","It can't send because the gateway is off-subnet"], a:1, why:"With /16 both addresses AND to 10.8.0.0, so the PC treats the server as local and ARPs for it. Nothing on the LAN answers for it, so Windows reports unreachable."})}

<h2>Wildcard masks, and the mask on the job</h2>
<h3>A first look at wildcard masks</h3>
<p>A ${K.g("wildcard mask","The bit-by-bit inverse of a subnet mask (255 minus each octet). In ACLs and OSPF, a 0 bit means 'must match' and a 1 bit means 'don't care'.")} is the subnet mask turned inside out: every 1 becomes 0 and every 0 becomes 1. In decimal, subtract each octet from 255.</p>
${K.out(`Subnet mask   255.255.255.192  (/26)  →  wildcard  0.0.0.63
Subnet mask   255.255.240.0    (/20)  →  wildcard  0.0.15.255
Subnet mask   255.0.0.0        (/8)   →  wildcard  0.255.255.255`, "Converting a subnet mask to its wildcard: subtract every octet from 255.")}
<p>Its bits mean: <b>0 = must match, 1 = don't care</b>. You'll configure wildcards later in ACLs (<code>access-list 10 permit 192.168.10.64 0.0.0.63</code> matches all of 192.168.10.64/26) and OSPF (<code>network 172.20.128.0 0.0.15.255 area 0</code>). For now, recognise and convert them.</p>
${K.exam(`<code>0.0.0.31</code> next to an address is a wildcard, not a mask — it matches a /27 (255 − 31 = 224). Never type a wildcard into <code>ip address</code>, or a subnet mask into an OSPF <code>network</code> statement.`)}
${K.job("&ldquo;Two printers on the same switch — one works, one doesn't&rdquo;",`
<p>You're on the support desk of a logistics company in Apapa, Lagos. The office LAN is <b>10.50.4.0/22</b> (hosts 10.50.4.1 to 10.50.7.254, gateway 10.50.4.1).</p>
<p><b>The ticket, 09:10.</b> &ldquo;Two new printers went in on Friday, PRN-2F and PRN-3F, on the same switch. PRN-2F works for everyone. PRN-3F works for Accounts, nobody else. The vendor says the printer is fine.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Who can print to PRN-3F?&rdquo; — <i>&ldquo;Accounts&rdquo;</i>, whose PCs are 10.50.6.x; everyone else is 10.50.4–5.x. &ldquo;Who set it up?&rdquo; — <i>&ldquo;The vendor, on the front panel.&rdquo;</i> One address range, typed by hand: think mask.</p>
<p><b>Check 1 — from a failing PC (10.50.4.57).</b> <code>ping 10.50.6.31</code>: <code>Request timed out</code> ×4 — not &ldquo;unreachable&rdquo;. Then <code>arp -a</code>:</p>
${K.out(`Interface: 10.50.4.57 --- 0x4
  Internet Address      Physical Address      Type
  10.50.4.1             00-50-0c-53-00-01     dynamic
  10.50.6.31            00-1b-a9-44-7c-10     dynamic
  10.50.7.255           ff-ff-ff-ff-ff-ff     static`, "The PC has the printer's MAC: ARP worked, so Layer 2 is fine. The broadcast row 10.50.7.255 confirms the PC's own /22 is right.")}
<p>The printer <b>answered</b> ARP, so cable, port and VLAN are fine. Requests arrive; replies don't come back: a one-way failure.</p>
<p><b>Check 2 — the switch.</b> <code>show mac address-table address 001b.a944.7c10</code>: Gi1/0/22, and <code>show interfaces status</code> shows it <code>connected a-full a-1000</code>. Healthy.</p>
<p><b>Check 3 — the printer's configuration page</b> (printed from the front panel): 10.50.6.31, <b>mask 255.255.255.0</b>, gateway 10.50.4.1. PRN-2F's says 255.255.252.0.</p>
<p><b>The AND, from the printer's side.</b> 10.50.6.31 with /24 → 10.50.6.0. The PC, 10.50.4.57, with the <i>printer's</i> /24 → 10.50.4.0. Different, so the printer sends its reply towards its gateway — which, with a /24, isn't on its subnet either. The reply goes nowhere. Accounts' 10.50.6.x PCs AND to 10.50.6.0: local, answered directly.</p>
<p><b>The fix.</b> From an Accounts PC (which can reach it), open the printer's web page and set the mask to <b>255.255.252.0</b>. Re-test from 10.50.4.57: four replies, test page prints; Accounts still fine.</p>
<p><b>What you say to the office manager.</b> &ldquo;Fixed. One setting on PRN-3F was mistyped on Friday, so it could only answer people near it on the network. Please try printing from any PC.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;PRN-3F (10.50.6.31) mask 255.255.255.0 on 10.50.4.0/22 LAN: replies to 10.50.4–5.x dropped. Set 255.255.252.0. Ping and test print OK from 10.50.4.57 and Accounts. Recommend DHCP reservations for printers. 25 min.&rdquo;</i></p>
`)}
${K.case("Moving a regional ISP's links from /30 to /31",`
<p>A regional ISP with metro fibre across Lagos and Ibadan had about 600 router-to-router links, each a /30 from its public space: four addresses per link, 2,400 in all, while business customers waited for public IPv4.</p>
<p>The team renumbered the links to /31 (RFC 3021): two addresses per link, both usable, freeing 1,200 public addresses — over four /24s' worth — without buying any. IOS warned that /31 on Ethernet is meant for point-to-point use; with exactly two routers per fibre, that was safe.</p>
<p>The pilot found two problems. A few customer-edge firewalls from another vendor wouldn't accept a /31, so those links stayed /30. And monitoring scripts assumed &ldquo;router = network address + 1&rdquo;; on a /31 the first address <i>is</i> a router, so dashboards showed the wrong device on half the links until the scripts were rewritten to read prefixes.</p>
<p><b>The lesson:</b> /31 is standard, but anything that &ldquo;knows&rdquo; the &minus;2 rule — people, scripts, old devices — must be checked first.</p>`)}
${K.myth([
  ["The mask travels in every IP packet.","The IPv4 header has no mask field. Each device applies its own configured mask."],
  ["Two PCs on the same switch can always talk.","Only if their masks put them in the same subnet (and VLAN). 192.168.1.60/26 and .70/26 share a switch, not a subnet."],
  ["A mask can contain any numbers, like 255.255.255.100.","Each octet must be one of nine values, with contiguous 1s."],
  ["Every subnet loses two addresses.","/31 point-to-point links use both; a /32 is one address."],
  ["An address ending in .0 or .255 can never be a host.","Only if the mask makes it the network or broadcast: 172.20.130.0/20 is an ordinary host."],
])}
${K.dodont([
  "Take the mask from the addressing plan, not habit.",
  "Do the AND on paper when a ping result surprises you.",
  "Read the broadcast row in arp -a to see a PC's real mask.",
  "Use DHCP reservations for printers and cameras.",
],[
  "Change a mask until a ping works.",
  "Assign the network or broadcast address to a device.",
  "Fix one end of a mask mismatch and leave the other.",
  "Use /31 on a segment with more than two devices.",
])}
${K.check({q:"A printer at 10.50.6.31 has mask 255.255.255.0 on a LAN that is really 10.50.4.0/22. Users at 10.50.6.x can print; users at 10.50.4.x get Request timed out. Why?", o:["The switch blocks the printer's ARP replies","The printer ANDs 10.50.4.x with its /24, sees those users as remote, and can't deliver replies","The users' PCs have the wrong gateway","The printer's port is in the wrong VLAN"], a:1, why:"Requests arrive, because the /22 PCs see the printer as local. The /24 printer sees 10.50.4.x as remote and its gateway is off its subnet too, so replies are lost. 10.50.6.x users are inside its /24."})}

<h2>Interview corner</h2>
${K.hint(`Say what the mask is, then what a device does with it — and why that matters.`)}
${K.reveal("&ldquo;What does the subnet mask do?&rdquo;",`<p>&ldquo;It tells a device which bits of an address are network and which are host: 32 bits, a contiguous run of 1s for the network part, then 0s — written 255.255.255.192 or /26. AND-ing an address with the mask gives the network address. Its key use is the local-or-remote decision: a host ANDs its own address and the destination with its own mask. Same result, it ARPs for the destination; different, it sends to its default gateway. A wrong mask breaks that decision, and it's a classic cause of &lsquo;works for some people, not others&rsquo;.&rdquo;</p>`)}
${K.hint(`Show the working: host bits, 2 to the power, minus 2 — then say what the two are.`)}
${K.reveal("&ldquo;How many usable hosts are in a /27, and why?&rdquo;",`<p>&ldquo;Thirty. 32 − 27 = 5 host bits, 2<sup>5</sup> = 32 addresses. All host bits 0 is the network address and all 1s is the broadcast, so neither can be assigned: 32 − 2 = 30. For example 192.168.50.128/27 runs .128 to .159, hosts .129 to .158. The exceptions are /31 point-to-point links, where RFC 3021 makes both addresses usable, and /32 for loopbacks and host routes.&rdquo;</p>`)}
${K.hint(`Scope it, prove it with commands and the AND, then fix to the design.`)}
${K.reveal("&ldquo;Two PCs on the same switch can't ping each other, but each reaches other devices. How do you approach it?&rdquo;",`<p>&ldquo;Other traffic working points away from cabling, so I check <code>ipconfig</code> on both and AND each address with that PC's own mask. 192.168.1.60/26 and 192.168.1.70/26 AND to .0 and .64 — different subnets, though they look close. The ping message helps: <i>general failure</i> or <i>unreachable</i> means the sender never got an ARP reply; <i>request timed out</i> with the target's MAC in <code>arp -a</code> means a one-way problem, often mismatched masks. I correct whichever host doesn't match the addressing plan, re-test both directions, and confirm both ports share a VLAN.&rdquo;</p>`)}

${K.recap([
  "A mask is 32 bits: contiguous 1s mark the network part, 0s the host part.",
  "Mask octets: 0 128 192 224 240 248 252 254 255; 255.255.0.255 is invalid (1s restart after a 0).",
  "Prefix = number of 1s: /26 = 255.255.255.192; 255.255.248.0 = /21.",
  "Network = address AND mask; only the interesting octet needs binary.",
  "Broadcast = host bits all 1; usable = network + 1 to broadcast − 1; hosts = 2^h − 2.",
  "/31 links use both addresses (RFC 3021); /32 is one address.",
  "Same AND result with your own mask → ARP for the destination; different → ARP for the gateway.",
  "Wildcard = 255 minus each mask octet (ACLs, OSPF).",
])}
${K.next(`<b>Lesson 4 — Subnetting from scratch.</b> So far you've been handed the mask. Next you choose it: borrow host bits to cut one network into many subnets and count the subnets and hosts you get.`)}
`,
quiz:[
  {q:"What does a 1 bit in a subnet mask indicate?", o:["The matching address bit is part of the host portion","The matching address bit is part of the network portion","The address is a broadcast address","The bit is ignored when routing"], a:1, why:"1s in the mask mark the network portion and 0s mark the host portion. The 1s are always contiguous from the left.", lvl:1},
  {type:"fill", q:"Write the prefix /27 as a dotted-decimal subnet mask.", fields:[{label:"Mask", a:["255.255.255.224"]}], why:"27 = 8 + 8 + 8 + 3. Three octets of 255, then three ones (11100000) = 128 + 64 + 32 = 224.", lvl:1},
  {type:"fill", q:"What prefix length is the mask 255.255.248.0?", fields:[{label:"Prefix", a:["/21","21"]}], why:"255 = 8 ones, 255 = 8, 248 = 11111000 = 5, 0 = 0. 8 + 8 + 5 = 21.", lvl:2},
  {type:"multi", q:"Which two of these are valid subnet masks? (Choose two.)", o:["255.255.255.224","255.255.0.255","255.255.255.250","255.254.0.0","255.0.255.0"], a:[0,3], why:"224 (11100000) after three full octets and 254 (11111110) followed by zeros are both contiguous runs of 1s. 255.255.0.255 and 255.0.255.0 restart their 1s after a 0 octet, and 250 (11111010) is not one of the nine valid octet values.", lvl:2},
  {q:"What is the network address of the host 172.20.130.9/20?", o:["172.20.130.0","172.20.128.0","172.20.0.0","172.20.143.0"], a:1, why:"/20 = 255.255.240.0, so octet 3 is the interesting octet: 130 = 10000010 AND 240 = 11110000 = 10000000 = 128. Octet 4 AND-ed with 0 is 0. Network 172.20.128.0. 172.20.143.255 is the broadcast of the same subnet.", lvl:2},
  {type:"fill", q:"For the host 192.168.50.140/27, give the network and broadcast addresses.", fields:[{label:"Network address", a:["192.168.50.128","192.168.50.128/27"]},{label:"Broadcast address", a:["192.168.50.159"]}], why:"/27 = 255.255.255.224. 140 = 10001100 AND 11100000 = 10000000 = 128, so the network is 192.168.50.128. Setting the five host bits to 1 gives 10011111 = 159, the broadcast. Usable hosts are .129 to .158.", lvl:2},
  {q:"How many usable host addresses does a /27 subnet provide on an ordinary LAN?", o:["32","31","30","27"], a:2, why:"32 − 27 = 5 host bits; 2^5 = 32 addresses. The all-zeros host part is the network address and the all-ones host part is the broadcast, so 32 − 2 = 30 are usable.", lvl:2},
  {q:"A technician configures a server with 172.16.5.99 and mask 255.255.255.252. Users can't reach it. What is wrong?", o:["Nothing; 172.16.5.99/30 is a normal usable host address","172.16.5.99 is the broadcast address of the subnet 172.16.5.96/30","172.16.5.99 is the network address of 172.16.5.99/30","A /30 mask can't be used on a server"], a:1, why:"99 = 01100011. AND-ed with 252 (11111100) it gives 01100000 = 96, so the subnet is 172.16.5.96/30. Its two host bits are both 1 in 99, which makes 172.16.5.99 the broadcast address. The usable hosts are .97 and .98.", lvl:3},
  {type:"order", q:"Put the steps for finding a subnet's network and broadcast addresses by hand in order.", items:["Convert the prefix length to a dotted-decimal mask","Write the address and the mask in binary, aligned octet under octet","AND each address bit with the mask bit beneath it","Convert the result back to decimal: this is the network address","Set every host bit of the network address to 1 to get the broadcast address"], why:"You need the mask before you can align it; the AND gives the network address once converted back to decimal; the broadcast comes from the network address by turning every host bit on.", lvl:1},
  {type:"match", q:"Match each prefix length with its subnet mask.", pairs:[["/8","255.0.0.0"],["/16","255.255.0.0"],["/20","255.255.240.0"],["/26","255.255.255.192"],["/30","255.255.255.252"]], why:"Each full 8 bits is an octet of 255. /20 has 4 leftover bits (240), /26 has 2 (192) and /30 has 6 (252).", lvl:1},
  {type:"multi", q:"Two PCs on the same switch and VLAN, with no router, can't ping each other. You must keep the /26 mask on both. Which two changes would let them communicate? (Choose two.)", ex:"PC-A> ipconfig\n   IPv4 Address. . . . . . . . . . . : 192.168.1.60\n   Subnet Mask . . . . . . . . . . . : 255.255.255.192\n\nPC-B> ipconfig\n   IPv4 Address. . . . . . . . . . . : 192.168.1.70\n   Subnet Mask . . . . . . . . . . . : 255.255.255.192", o:["Change PC-B to 192.168.1.62","Change PC-A to 192.168.1.66","Change PC-A to 192.168.1.64","Change PC-B to 192.168.1.63","Change PC-A to 192.168.1.127"], a:[0,1], why:"With /26, PC-A (.60) is in 192.168.1.0/26 (hosts .1 to .62) and PC-B (.70) is in 192.168.1.64/26 (hosts .65 to .126). Moving PC-B to .62 or PC-A to .66 puts both in one subnet. .64 is the network address of the second subnet, .63 the broadcast of the first and .127 the broadcast of the second, so none of those can be assigned to a host.", lvl:3},
  {q:"TELLER-2 can ping other tellers but not the core banking server behind the router. The teller LAN is designed as 172.20.128.0/20 and the router has proxy ARP disabled. Based on the output, what is the cause?", ex:"C:\\Users\\TELLER-2>ipconfig\n   IPv4 Address. . . . . . . . . . . : 172.20.130.10\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . : 172.20.128.1\n\nC:\\Users\\TELLER-2>ping 172.20.160.10\nReply from 172.20.130.10: Destination host unreachable.\nReply from 172.20.130.10: Destination host unreachable.", o:["The default gateway is outside TELLER-2's subnet, so it can't be used","The /16 mask makes TELLER-2 treat 172.20.160.10 as local, so it ARPs for the server directly and nobody answers","The server's default gateway is missing, so replies can't return","TELLER-2's switch port is in a different VLAN from the router"], a:1, why:"With 255.255.0.0, both 172.20.130.10 and 172.20.160.10 AND to 172.20.0.0, so TELLER-2 thinks the server is on its own subnet and ARPs for it. The server is behind the router, and with proxy ARP disabled nobody replies, so Windows reports unreachable from its own IP. Other tellers work because they really are local. The fix is the designed mask, 255.255.240.0.", lvl:3},
  {q:"Which statement about a /31 subnet is true?", o:["It has 0 usable addresses and can't be used","RFC 3021 allows it on point-to-point links, with both addresses usable and no broadcast address","It is used for loopback interfaces","It has two usable hosts plus a network and broadcast address"], a:1, why:"On a point-to-point link there are only two devices, so no broadcast address is needed. RFC 3021 lets both addresses of a /31 be assigned, one per end. Loopbacks normally use /32.", lvl:2},
  {q:"What is the wildcard mask that corresponds to the subnet mask 255.255.240.0?", o:["0.0.15.255","0.0.16.255","255.255.15.0","0.0.240.255"], a:0, why:"Subtract each octet from 255: 255 − 255 = 0, 255 − 255 = 0, 255 − 240 = 15, 255 − 0 = 255. Wildcard 0.0.15.255, used in ACLs and OSPF network statements for a /20.", lvl:2},
  {type:"multi", q:"A LAN is 10.50.4.0/22 with gateway 10.50.4.1. A new printer is set to 10.50.6.31 with mask 255.255.255.0 and gateway 10.50.4.1; all PCs have the correct /22 mask. Which two symptoms do you expect? (Choose two.)", o:["PCs with 10.50.6.x addresses can print to it","PCs with 10.50.4.x addresses get Request timed out when pinging it","No PC can learn the printer's MAC address with ARP","The switch err-disables the printer's port","Every PC on the LAN loses its connection to the gateway"], a:[0,1], why:"The PCs see the printer as local, so ARP works and requests arrive. The printer ANDs each sender with its own /24: 10.50.6.x senders are local and get replies; 10.50.4.x and 10.50.5.x senders look remote, and its gateway isn't on its /24 either, so those replies are lost and the PCs see timeouts. The switch and the other PCs are unaffected.", lvl:3},
  {type:"fill", q:"Type the interface configuration command that gives a router interface the address 10.1.1.1 with a /30 prefix.", fields:[{label:"Command", a:["ip address 10.1.1.1 255.255.255.252"], ios:true}], why:"IOS interface commands take a dotted mask, not a prefix: /30 = 255.255.255.252. show ip interface brief then shows the address, and show interfaces and show ip route show it as /30.", lvl:2},
],
cards:[
  {f:"What is a subnet mask?", b:"A 32-bit value whose contiguous 1s mark the network part of an address and whose 0s mark the host part. Written dotted (255.255.255.192) or as a prefix (/26)."},
  {f:"The nine valid values of a mask octet", b:"0, 128, 192, 224, 240, 248, 252, 254, 255 — for 0 to 8 one-bits. Each is the previous plus the next place value."},
  {f:"Why is 255.255.0.255 not a valid mask?", b:"In binary the 1s stop after bit 16 and restart at bit 25. A mask's 1s must be one contiguous run from the left, so there is no single network/host boundary."},
  {f:"Prefix to mask: method", b:"Prefix ÷ 8 = number of 255 octets; the remainder (0 to 7 ones) gives the next octet from the list of nine; remaining octets are 0. /20 = 255.255.240.0."},
  {f:"Mask to prefix: method", b:"Count the ones in each octet and add: 255 = 8, 248 = 5, 0 = 0. 255.255.248.0 = 8 + 8 + 5 = /21."},
  {f:"Bitwise AND", b:"1 AND 1 = 1; anything AND 0 = 0. Address AND mask keeps the network bits and zeroes the host bits, giving the network address."},
  {f:"The interesting octet", b:"The one mask octet that is neither 255 nor 0. Octets under 255 are copied, octets under 0 become 0, and only the interesting octet needs binary."},
  {f:"Network, broadcast, first and last usable", b:"Network = host bits all 0. Broadcast = host bits all 1. First usable = network + 1. Last usable = broadcast − 1."},
  {f:"Usable hosts formula", b:"h = 32 − prefix; usable = 2^h − 2 (minus network and broadcast). /27: 2^5 − 2 = 30. /26: 62. /24: 254. /30: 2."},
  {f:"/31 and /32", b:"/31: point-to-point links, RFC 3021, both addresses usable, no broadcast. /32: a single address, used for loopbacks and host routes (the L entries in show ip route)."},
  {f:"Local or remote? How a host decides", b:"It ANDs its own address and the destination with its OWN mask. Same result: local, ARP for the destination. Different: remote, ARP for the default gateway."},
  {f:"Mismatched masks on one subnet", b:"Each host uses only its own mask, so traffic can work one way only: the request arrives, the reply goes to a gateway or nowhere. Fix both hosts to the design."},
  {f:"Wildcard mask", b:"255 minus each mask octet: /26 = 0.0.0.63, /20 = 0.0.15.255. 0 bits must match, 1 bits don't care. Used in ACLs and OSPF network statements."},
],
});
// ---------- Module 3 · Lesson 4 ----------
L.push({
id:"ip-subnetting", mins:75, level:"Beginner · builds on lessons 1–3",
t:"Subnetting from scratch: borrowing bits, counting subnets and hosts",
html:`
${K.goals([
  "Explain in two sentences why one big network is split into subnets.",
  "Borrow host bits and calculate subnets (2<sup>s</sup>) and usable hosts per subnet (2<sup>h</sup> − 2).",
  "List every subnet of a /24 split into /26 or /27 — network, first, last, broadcast — working in binary first.",
  "Pick the right prefix from a requirement (&ldquo;6 subnets&rdquo;, &ldquo;50 hosts&rdquo;, or both), and spot when it can't be met.",
  "Subnet a /16 into /24s and /20s, find the Nth subnet, and configure a subnetted plan on a router and PCs.",
])}
${K.pre(["Lesson 1 (binary place values 128 64 32 16 8 4 2 1), lesson 2 (network and broadcast addresses, private ranges) and lesson 3 (masks, prefix length, AND-ing). Module 2 for broadcast domains, ARP and default gateways."])}

<h2>Why this matters at work</h2>
<p>A pharmacy chain's Ikeja branch runs everything — 38 PCs, 30 IP phones, six printers and the switch management — on one flat network, <code>10.20.30.0/24</code>. An audit lands: <i>&ldquo;Printers and network-device management are reachable from every staff PC. Separate them.&rdquo;</i> The IT manager forwards it to the MSP: <i>&ldquo;Can you split our range up? We can't get more addresses.&rdquo;</i></p>
<p>That request is <b>subnetting</b>: cutting one block of addresses into smaller blocks, each its own network behind a router. You'll do it on paper, in binary first so you see why it works, then on a router and PCs. VLANs, routing, access lists and ${K.g("VLSM","Variable-Length Subnet Masking: using different-sized subnets (different prefix lengths) inside one block, each sized to its own need. You'll design with it in lesson 6.")} all assume you can do this without a calculator — and interviewers ask it first.</p>

<h2>Why subnet at all?</h2>
<p>In lesson 3 you split an address into a ${K.g("network portion","The leading bits, covered by the 1s in the mask. Same for every device in the network.")} and a ${K.g("host portion","The trailing bits, covered by the 0s in the mask. They identify one device.")}. <code>192.168.1.0/24</code> has 8 host bits: 256 addresses, 254 usable.</p>
<p>${K.g("Subnetting","Dividing one network into smaller networks by moving the mask's boundary to the right.")} divides that block into smaller networks, each a ${K.g("subnet","A smaller network carved out of a larger block, with its own network address, broadcast address and host range.")}. Devices in different subnets need a router to talk, as in Module 2. That is the point, for four reasons:</p>
<ul>
<li><b>Smaller broadcast domains.</b> One subnet is one ${K.g("broadcast domain","The devices that receive each other's broadcasts. A router stops broadcasts; a switch floods them.")}. On a flat /24, every ARP and DHCP broadcast interrupts 253 other hosts; on a flat campus-wide /16, thousands — and one looped cable takes down everything.</li>
<li><b>Security boundaries.</b> Traffic between subnets passes a router or firewall, where ${K.g("ACLs","Access control lists: permit/deny rules on a router interface. A later module.")} can filter it: &ldquo;only IT may reach management&rdquo;.</li>
<li><b>Addresses that match the building.</b> Give each site, floor or department its own subnet, and an alert for <code>10.20.30.140</code> reads as &ldquo;Ikeja, a printer&rdquo; on sight.</li>
<li><b>No waste.</b> A two-router link needs two addresses; a whole /24 on it wastes 252. Public IPv4 ran out long ago, and private space gets tight in big companies. This lesson cuts equal pieces; lesson 6 (VLSM) cuts different sizes.</li>
</ul>
${K.svg("0 0 760 270",
  K.txt(170,22,"BEFORE: one flat /24",{mid:true,c:"fg",s:12.5,b:true})+
  K.dev("switch",170,70,"LAN-SW","10.20.30.0/24")+
  K.dev("pc",50,190,"PCs","")+K.dev("phone",120,190,"Phones","")+K.dev("printer",210,190,"Printers","")+K.dev("ap",290,190,"Mgmt","")+
  K.link(150,82,56,170)+K.link(162,82,120,170)+K.link(178,82,210,172)+K.link(190,82,288,176)+
  K.txt(170,252,"one ARP or DHCP broadcast reaches all 254 hosts",{mid:true,c:"bad",s:11})+
  K.link(360,20,360,250,"",true)+
  K.txt(545,22,"AFTER: four /26 subnets behind a router",{mid:true,c:"fg",s:12.5,b:true})+
  K.dev("router",545,62,"BR-R1","gateway for all four")+
  K.dev("switch",405,170,"Users",".0/26")+K.dev("switch",498,170,"Voice",".64/26")+
  K.dev("switch",592,170,"Printers",".128/26")+K.dev("switch",685,170,"Mgmt",".192/26")+
  K.link(528,74,412,159)+K.link(540,76,500,159)+K.link(552,76,590,159)+K.link(564,74,680,159)+
  K.txt(548,252,"broadcasts stay in their own subnet; the router is between",{mid:true,c:"ok",s:11}),
  "The same 256 addresses before and after subnetting: four broadcast domains instead of one, with a router between them where traffic can be controlled.")}
${K.analogy(`<p>256 flats on one shared corridor: every announcement reaches every flat. Subnetting builds four wings of 64, each with its own corridor, and a reception desk (the router) between them. Nobody gains a flat — two per wing become the entrance and noticeboard — but each wing is quieter and safer.</p>`)}
${K.check({q:"A company splits its flat /24 into four subnets. Which is a real benefit?", o:["Four times as many usable addresses","Broadcasts from one subnet no longer reach devices in the other three","Devices in different subnets can talk without a router","The router is no longer needed"], a:1, why:"Each subnet is its own broadcast domain. Subnetting never creates addresses — it costs two per subnet — and traffic between subnets now needs a router."})}

<h2>Borrowing bits: the two formulas</h2>
<p>The one idea everything rests on: a mask is a line between network bits and host bits, and subnetting <b>moves the line to the right</b>. The host bits you move across are ${K.g("borrowed bits","Host bits taken over to number the subnets (subnet bits). Each one borrowed doubles the subnets and roughly halves the hosts.")}: they used to say which host; now they say which subnet.</p>
<p>Borrow 2 bits from <code>192.168.1.0/24</code> and the prefix becomes /24 + 2 = <b>/26</b>. In the last ${K.g("octet","One of the four 8-bit groups of an IPv4 address, 0–255.")}, two bits now count subnets and six are left for hosts.</p>
${K.svg("0 0 720 280",
  K.txt(180,46,"network part: 24 bits, fixed by the /24",{mid:true,c:"fg",s:11.5})+
  K.band(20,58,100,40,"192")+K.band(130,58,100,40,"168")+K.band(240,58,100,40,"1")+
  K.txt(398,46,"borrowed",{mid:true,c:"accent",s:11.5,b:true})+K.txt(560,46,"host bits that remain",{mid:true,s:11.5})+
  K.box(360,58,36,40,"S","",true)+K.box(400,58,36,40,"S","",true)+
  K.band(440,58,36,40,"H")+K.band(480,58,36,40,"H")+K.band(520,58,36,40,"H")+K.band(560,58,36,40,"H")+K.band(600,58,36,40,"H")+K.band(640,58,36,40,"H")+
  K.txt(378,116,"128",{mid:true})+K.txt(418,116,"64",{mid:true})+K.txt(458,116,"32",{mid:true})+K.txt(498,116,"16",{mid:true})+K.txt(538,116,"8",{mid:true})+K.txt(578,116,"4",{mid:true})+K.txt(618,116,"2",{mid:true})+K.txt(658,116,"1",{mid:true})+
  K.link(354,40,354,150,"",true)+K.txt(354,166,"old line: /24",{mid:true,s:10.5})+
  `<line x1="438" y1="40" x2="438" y2="150" stroke="var(--accent)" stroke-width="2.2"/>`+K.txt(438,166,"new line: /26",{mid:true,c:"accent",s:10.5,b:true})+
  K.txt(20,200,"2 borrowed bits → 2² = 4 subnets  (subnet bits 00, 01, 10, 11)",{c:"fg",s:12})+
  K.txt(20,224,"6 host bits left → 2⁶ − 2 = 64 − 2 = 62 usable hosts in each subnet",{c:"fg",s:12})+
  K.txt(20,248,"new mask: last octet 11000000 = 128 + 64 = 192 → 255.255.255.192",{c:"fg",s:12})+
  K.txt(20,270,"block size = value of the lowest borrowed bit = 64",{c:"accent",s:12}),
  "Borrowing 2 bits from the host octet of 192.168.1.0/24. The S bits number the subnets; the H bits number the hosts inside each one.")}
<h3>Subnets = 2<sup>s</sup></h3>
<p>Call the borrowed bits <b>s</b>. Each is 0 or 1, so s bits give <b>2<sup>s</sup></b> patterns — one subnet each. Two bits: 00, 01, 10, 11 = four subnets. Every extra bit <b>doubles</b> the subnets.</p>
<h3>Usable hosts = 2<sup>h</sup> − 2</h3>
<p>Call the host bits left <b>h</b>. They give 2<sup>h</sup> addresses per subnet, minus two reserved ones, as in lesson 2: host bits <b>all 0s</b> = the ${K.g("network address","First address of a subnet (host bits all 0). Names the subnet; never given to a device.")}, host bits <b>all 1s</b> = the ${K.g("broadcast address","Last address of a subnet (host bits all 1). Reaches every host in that subnet.")}. Between them is the ${K.g("usable range","Network + 1 (first usable) to broadcast − 1 (last usable).")}. Six host bits: 64 − 2 = 62. The −2 is for hosts only; subnets have no reserved values today (the history comes later in the lesson).</p>
${K.remember(`<b>&ldquo;Subnets: two to the borrowed. Hosts: two to the left-over, minus two.&rdquo;</b> Write the powers of two at the top of your paper first: 2 · 4 · 8 · 16 · 32 · 64 · 128 · 256 (2<sup>1</sup> to 2<sup>8</sup>).`)}
<h3>The trade-off table for a /24</h3>
<p>A /24 has 8 host bits, so <b>s + h = 8</b>: every bit given to subnets is taken from hosts.</p>
<div class="tablewrap"><table>
<tr><th>Prefix</th><th>Mask</th><th>Borrowed s</th><th>Subnets 2<sup>s</sup></th><th>Host bits h</th><th>Usable hosts 2<sup>h</sup> − 2</th><th>Block size</th></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>1</td><td>2</td><td>7</td><td>126</td><td>128</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>2</td><td>4</td><td>6</td><td>62</td><td>64</td></tr>
<tr><td>/27</td><td>255.255.255.224</td><td>3</td><td>8</td><td>5</td><td>30</td><td>32</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>4</td><td>16</td><td>4</td><td>14</td><td>16</td></tr>
<tr><td>/29</td><td>255.255.255.248</td><td>5</td><td>32</td><td>3</td><td>6</td><td>8</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>6</td><td>64</td><td>2</td><td>2</td><td>4</td></tr>
</table></div>
<p>The ${K.g("block size","Addresses per subnet (2^h), also the value of the lowest borrowed bit. Subnets start at multiples of it. Lesson 5's 'magic number'.")} (2<sup>h</sup>) is also the value of the lowest borrowed bit — remember that. A /30's two usable addresses made it the classic router-to-router link (a /31 is also allowed on such links today; lesson 6).</p>
${K.steps([
  ["Start", `<p><code>192.168.1.0/24</code>: 32 − 24 = <b>8</b> host bits.</p>`],
  ["Borrow 3 bits", `<p>/24 + 3 = <b>/27</b>; h = 8 − 3 = <b>5</b>.</p>`],
  ["Subnets", `<p>2<sup>3</sup> = <b>8</b>.</p>`],
  ["Hosts", `<p>2<sup>5</sup> − 2 = 32 − 2 = <b>30</b> per subnet.</p>`],
  ["Mask and block size", `<p>Last octet <code>11100000</code> = 128 + 64 + 32 = 224 → <b>255.255.255.224</b>. Lowest borrowed bit = <b>32</b>.</p>`],
])}
${K.mistake(`Subtracting 2 from subnets (&ldquo;borrow 3 bits → 6 subnets&rdquo;). Today it's 8. Only <b>hosts</b> lose two addresses.`)}
${K.exam(`Read whether the question asks for <b>subnets</b>, <b>usable hosts</b> or <b>addresses</b>. A /27 has 32 addresses but 30 usable hosts, and 32 will be a distractor. &ldquo;Hosts per subnet&rdquo; means usable hosts.`)}
${K.q({type:"match", q:"Match each prefix (subnetting a /24) with the number of usable hosts per subnet.", pairs:[["/25","126"],["/26","62"],["/27","30"],["/28","14"],["/29","6"],["/30","2"]], why:"Host bits = 32 − prefix; usable hosts = 2^h − 2: /25 → 126, /26 → 62, /27 → 30, /28 → 14, /29 → 6, /30 → 2."})}
${K.check({q:"You borrow 4 bits from 192.168.20.0/24. How many subnets, and how many usable hosts in each?", o:["16 subnets, 16 hosts","14 subnets, 14 hosts","16 subnets, 14 hosts","4 subnets, 62 hosts"], a:2, why:"s = 4 → 2^4 = 16 subnets. h = 4 → 2^4 − 2 = 14 hosts. Prefix /28."})}

<h2>Listing every subnet — in binary first</h2>
<p>To configure anything you need the actual addresses. Find them with lesson 1's binary once, and every later shortcut is obvious instead of magic.</p>
<h3>Worked example: 192.168.1.0/24 into four /26s</h3>
<p><code>192.168.1</code> never changes; the work is all in the last octet: 2 subnet bits, then 6 host bits. For each subnet pattern, write the host bits as all 0s (network), 0…01 (first usable), 1…10 (last usable) and all 1s (broadcast), then add up the place values.</p>
${K.out(`Place values:   128  64 | 32  16   8   4   2   1
                subnet   |       host bits
Subnet 1         0   0   |  0   0   0   0   0   0   =   0   network
                 0   0   |  0   0   0   0   0   1   =   1   first usable
                 0   0   |  1   1   1   1   1   0   =  62   last usable
                 0   0   |  1   1   1   1   1   1   =  63   broadcast
Subnet 2         0   1   |  0   0   0   0   0   0   =  64   network
                 0   1   |  0   0   0   0   0   1   =  65   first usable
                 0   1   |  1   1   1   1   1   0   = 126   last usable
                 0   1   |  1   1   1   1   1   1   = 127   broadcast
Subnet 3         1   0   |  0   0   0   0   0   0   = 128   network
                 1   0   |  0   0   0   0   0   1   = 129   first usable
                 1   0   |  1   1   1   1   1   0   = 190   last usable
                 1   0   |  1   1   1   1   1   1   = 191   broadcast
Subnet 4         1   1   |  0   0   0   0   0   0   = 192   network
                 1   1   |  0   0   0   0   0   1   = 193   first usable
                 1   1   |  1   1   1   1   1   0   = 254   last usable
                 1   1   |  1   1   1   1   1   1   = 255   broadcast`, "The fourth octet of 192.168.1.0/24 split into /26, bit by bit. Left of the bar: the 2 borrowed bits. Right: the 6 host bits.")}
<p>Check some yourself: <code>01|000000</code> has a 1 only under 64 → 64. <code>01|111110</code> = 64 + 32 + 16 + 8 + 4 + 2 = 126. <code>11|111110</code> = 128 + 64 + 62 = 254. Place values, added up — nothing to memorise.</p>
${K.out(`Subnet  Network            First usable     Last usable      Broadcast
1       192.168.1.0/26     192.168.1.1      192.168.1.62     192.168.1.63
2       192.168.1.64/26    192.168.1.65     192.168.1.126    192.168.1.127
3       192.168.1.128/26   192.168.1.129    192.168.1.190    192.168.1.191
4       192.168.1.192/26   192.168.1.193    192.168.1.254    192.168.1.255`, "The four /26 subnets of 192.168.1.0/24, mask 255.255.255.192 — the table you hand to whoever configures the site.")}
<ul>
<li><b>Network</b> — the subnet's name; never on a device.</li>
<li><b>First usable</b> — usually the router (default gateway), by convention, not rule.</li>
<li><b>Broadcast</b> — one less than the next subnet's network.</li>
</ul>
<h3>The pattern that falls out</h3>
<p>The networks are 0, 64, 128, 192: steps of <b>64</b>, the block size. The lowest subnet bit is worth 64, so adding 1 to the subnet number adds 64 to the octet.</p>
${K.svg("0 0 720 230",
  K.txt(360,22,"192.168.1.0/24 — the last octet as a number line from 0 to 255, cut into /26 blocks",{mid:true,c:"fg",s:11.5})+
  K.box(40,40,158,54,"Subnet 1","192.168.1.0/26",true)+K.box(201,40,158,54,"Subnet 2","192.168.1.64/26")+
  K.box(362,40,158,54,"Subnet 3","192.168.1.128/26",true)+K.box(523,40,158,54,"Subnet 4","192.168.1.192/26")+
  K.link(40,110,681,110)+
  K.link(40,104,40,118)+K.link(201,104,201,118)+K.link(362,104,362,118)+K.link(523,104,523,118)+K.link(681,104,681,118)+
  K.txt(40,134,"0",{mid:true,c:"fg"})+K.txt(201,134,"64",{mid:true,c:"fg"})+K.txt(362,134,"128",{mid:true,c:"fg"})+K.txt(523,134,"192",{mid:true,c:"fg"})+K.txt(681,134,"255",{mid:true,c:"fg"})+
  K.txt(119,156,"usable .1 – .62",{mid:true})+K.txt(280,156,"usable .65 – .126",{mid:true})+K.txt(441,156,"usable .129 – .190",{mid:true})+K.txt(602,156,"usable .193 – .254",{mid:true})+
  K.txt(119,172,"broadcast .63",{mid:true,c:"warn"})+K.txt(280,172,"broadcast .127",{mid:true,c:"warn"})+K.txt(441,172,"broadcast .191",{mid:true,c:"warn"})+K.txt(602,172,"broadcast .255",{mid:true,c:"warn"})+
  K.arrow(40,200,199,200,"",true)+K.txt(120,220,"block size 64 = 2⁶",{mid:true,c:"accent",s:11})+
  K.txt(450,206,"each block: network (first) · usable · broadcast (last)",{mid:true,s:11}),
  "The four /26 blocks end to end. Each is 64 addresses; its broadcast is the address right before the next block.")}
<p>So a quicker way appears: <b>start at 0 and keep adding the block size</b> until 256. Lesson 5 turns that into a two-second method (block size = 256 − mask octet: 256 − 192 = 64). For now, keep checking it against the binary.</p>
<h3>Second worked example: 172.16.5.0/24 into /27s</h3>
${K.steps([
  ["Bits", `<p>/24 → /27: s = 3, h = 5. 2<sup>3</sup> = 8 subnets of 2<sup>5</sup> − 2 = 30 hosts; mask 255.255.255.224.</p>`],
  ["Subnet patterns", `<p>000, 001, 010 … 111 in the top three positions (128, 64, 32) give 0, 32, 64, 96, 128, 160, 192, 224. For example <code>101|00000</code> = 128 + 32 = 160. They climb by 32, the lowest borrowed bit.</p>`],
  ["Broadcasts and ranges", `<p>Host bits all 1: <code>000|11111</code> = 31, <code>001|11111</code> = 63 … First usable = network + 1, last = broadcast − 1.</p>`],
])}
${K.out(`Subnet  Bits  Network         First usable    Last usable     Broadcast
1       000   172.16.5.0      172.16.5.1      172.16.5.30     172.16.5.31
2       001   172.16.5.32     172.16.5.33     172.16.5.62     172.16.5.63
3       010   172.16.5.64     172.16.5.65     172.16.5.94     172.16.5.95
4       011   172.16.5.96     172.16.5.97     172.16.5.126    172.16.5.127
5       100   172.16.5.128    172.16.5.129    172.16.5.158    172.16.5.159
6       101   172.16.5.160    172.16.5.161    172.16.5.190    172.16.5.191
7       110   172.16.5.192    172.16.5.193    172.16.5.222    172.16.5.223
8       111   172.16.5.224    172.16.5.225    172.16.5.254    172.16.5.255`, "All eight /27 subnets of 172.16.5.0/24 (mask 255.255.255.224). Bits = the 3 borrowed bits.")}
${K.tip(`Sanity-check any list: the <b>first</b> network equals the original network, the <b>last</b> broadcast equals the original broadcast, and there are 2<sup>s</sup> rows.`)}
<h3>Try it yourself on paper: 192.168.7.0/24 into /28</h3>
<ol>
<li>How many subnets, and usable hosts in each?</li>
<li>Network, first, last and broadcast for the first three subnets.</li>
<li>The same for the <b>last</b> subnet.</li>
<li>Which subnet contains <code>192.168.7.100</code>? Give its network and broadcast.</li>
</ol>
${K.hint(`/28 borrows 4 bits and leaves 4; the lowest borrowed bit is worth 16. For question 4, write 100 in binary (64 + 32 + 4), keep the first four bits, then set the last four to 0 (network) and to 1 (broadcast).`)}
${K.reveal("Show the answers",`<ol>
<li>2<sup>4</sup> = <b>16 subnets</b>; 2<sup>4</sup> − 2 = <b>14 hosts</b>. Mask 255.255.255.240.</li>
<li><code>0000|0000</code> → <b>.0</b>, .1–.14, broadcast .15 · <code>0001|0000</code> → <b>.16</b>, .17–.30, .31 · <code>0010|0000</code> → <b>.32</b>, .33–.46, .47.</li>
<li><code>1111|0000</code> = 240 → <b>.240/28</b>, .241–.254, broadcast <b>.255</b> — the original broadcast, as the sanity check promised.</li>
<li>100 = <code>0110 0100</code>. Host bits to 0 → <code>0110 0000</code> = <b>96</b>; to 1 → <code>0110 1111</code> = <b>111</b>. So <b>192.168.7.96/28</b> (the 7th subnet), usable .97–.110, broadcast .111.</li>
</ol>`)}
${K.check({q:"192.168.1.0/24 is split into /26s. What is the broadcast address of the subnet containing 192.168.1.100?", o:["192.168.1.63","192.168.1.127","192.168.1.128","192.168.1.255"], a:1, why:"/26 blocks start at 0, 64, 128, 192, so 100 is in the .64 block, which ends at .127. In binary: 100 = 01|100100 → host bits to 1 → 01|111111 = 127."})}

<h2>Designing from requirements: subnets, hosts, or both</h2>
<p>At work people say &ldquo;six departments&rdquo; or &ldquo;50 scanners&rdquo;, not &ldquo;borrow 3 bits&rdquo;. You turn that into a prefix.</p>
<h3>&ldquo;We need 6 subnets&rdquo; → find s</h3>
${K.steps([
  ["Rule", `<p>Smallest s with 2<sup>s</sup> ≥ subnets needed (smallest, because each extra bit halves the hosts).</p>`],
  ["Apply it", `<p><code>192.168.10.0/24</code>, 6 subnets: 2<sup>2</sup> = 4 too few, 2<sup>3</sup> = 8 enough → <b>s = 3</b> → <b>/27</b>, 255.255.255.224.</p>`],
  ["What's left", `<p>h = 5 → <b>30 hosts</b> each, plus 2 spare subnets.</p>`],
])}
<h3>&ldquo;Each subnet needs 50 hosts&rdquo; → find h</h3>
${K.steps([
  ["Rule", `<p>Smallest h with 2<sup>h</sup> − 2 ≥ hosts needed. Prefix = 32 − h.</p>`],
  ["Apply it", `<p>50 hosts: h = 5 gives 30, too few; h = 6 gives 62 → <b>/26</b>, 255.255.255.192.</p>`],
  ["What's left", `<p>From a /24, s = 8 − 6 = 2 → <b>4 subnets</b> of 62 hosts.</p>`],
])}
${K.mistake(`Forgetting the −2 when sizing for hosts. &ldquo;32 hosts fit a /27, it has 32 addresses&rdquo; — only <b>30</b> are usable. 32 hosts needs a /26.`)}
<h3>When both constraints apply</h3>
<p>Find the minimum s and the minimum h, then check they fit: <b>s + h ≤ the host bits you have</b> (8 for a /24).</p>
${K.steps([
  ["Requirement", `<p><code>192.168.30.0/24</code>: at least <b>5 subnets</b> of at least <b>25 hosts</b>.</p>`],
  ["Minimums", `<p>Subnets: 2<sup>3</sup> = 8 ≥ 5 → s ≥ 3. Hosts: 2<sup>5</sup> − 2 = 30 ≥ 25 → h ≥ 5.</p>`],
  ["Fit?", `<p>3 + 5 = 8: exactly a /24's host bits. <b>/27</b> works — 8 subnets of 30, no room left for growth.</p>`],
])}
<p>Sometimes they <b>don't</b> fit. Five departments of 40 from one /24: s ≥ 3 and h ≥ 6, and 3 + 6 = 9 &gt; 8 (five blocks of 64 = 320 addresses against 256). The honest answer, with those numbers, is &ldquo;this block is too small&rdquo; — ask for a /23 or revisit the requirement. When bits are <b>spare</b> — three subnets of 20 need only s = 2 and h = 5 — you choose where the extra bit goes:</p>
${K.when([
  ["Spare bit to hosts (/26 here)","Groups are likely to grow","No re-addressing devices later","New groups (CCTV, guest Wi-Fi) are on the roadmap"],
  ["Spare bit to subnets (/27 here)","New groups or sites are coming","Spare subnets ready, no redesign","A group is already near the host limit"],
  ["Ask for a bigger block","s + h exceeds the bits you have","Equal subnetting can't beat arithmetic","Groups differ a lot in size — that's VLSM, lesson 6"],
], "Spare bits, or not enough")}
${K.q({type:"fill", q:"Branch 192.168.80.0/24 must be split into at least 10 equal subnets, borrowing as few bits as possible. What prefix do the subnets use, and how many usable hosts does each have?", fields:[{label:"Prefix (e.g. /27)", a:["/28","28"]},{label:"Usable hosts per subnet", a:["14"]}], why:"2^3 = 8 is too few, 2^4 = 16 is enough: borrow 4 bits, /24 + 4 = /28. That leaves 4 host bits: 2^4 − 2 = 14."})}
<h3>Try it yourself on paper</h3>
<p>Give prefix, subnets and hosts per subnet, or say why it can't be done from a /24.</p>
<ol>
<li>100 hosts per subnet.</li>
<li>3 subnets of 60 hosts.</li>
<li>7 subnets of 30 hosts.</li>
<li>9 subnets of 20 hosts.</li>
<li>A router-to-router link (2 hosts), as small as possible.</li>
</ol>
${K.hint(`Powers of two first. Then: smallest s for the subnets, smallest h for the hosts (with the −2), and check s + h ≤ 8.`)}
${K.reveal("Show the answers",`<ol>
<li>62 too few, 126 enough → h = 7 → <b>/25</b>, 2 subnets of 126.</li>
<li>s ≥ 2, h ≥ 6, 2 + 6 = 8 → <b>/26</b>, 4 subnets of 62 (one spare).</li>
<li>s ≥ 3, h ≥ 5 (30 ≥ 30, exactly), 3 + 5 = 8 → <b>/27</b>, 8 subnets of 30.</li>
<li>s ≥ 4 leaves 14 hosts — too few; h ≥ 5 leaves 8 subnets — too few. 4 + 5 = 9 &gt; 8: <b>can't be done</b>. Check: 9 × 32 = 288 &gt; 256.</li>
<li>h = 2 → 2 hosts → <b>/30</b> (255.255.255.252).</li>
</ol>`)}
<h3>Drill it until it's automatic</h3>
<p>Endless requirement questions with worked answers — some start from bigger blocks than a /24; the borrowed bits add to whatever prefix you start with. Do at least one set of five.</p>
${K.drill({title:"requirements → prefix (subnets and hosts)", types:["subnets2prefix","hosts2prefix"], count:5})}
${K.check({q:"An office needs 4 subnets from 192.168.40.0/24, and the largest must hold 70 hosts. Which is true?", o:["/26 works: 4 subnets of 62 hosts","/25 works: 4 subnets of 126 hosts","It can't be done with equal subnets: 70 hosts needs a /25, which gives only 2 subnets","/27 works because 8 subnets is more than 4"], a:2, why:"70 hosts needs h = 7 (126), leaving s = 1: 2 subnets. 4 subnets needs s = 2, leaving 62 hosts. 2 + 7 = 9 > 8. Bigger block or VLSM."})}

<h2>Bigger blocks, subnet zero and the Nth subnet</h2>
<p>The method works in any octet; only the octet where the borrowed bits end changes.</p>
<h3>A /16 into /24s: one per building</h3>
<p>A campus has <code>172.16.0.0/16</code>: 16 host bits. Borrow <b>8</b> → /24s: 2<sup>8</sup> = <b>256 subnets</b> of 2<sup>8</sup> − 2 = <b>254 hosts</b>. The borrowed bits are the whole third octet, so the subnets are <code>172.16.0.0/24</code>, <code>172.16.1.0/24</code> … <code>172.16.255.0/24</code> — the third octet <i>is</i> the subnet number. Building 12, floor 1 could be <code>172.16.121.0/24</code> — readable at a glance.</p>
<h3>A /16 into /20s: bits that end mid-octet</h3>
<p>For up to 16 faculties with big blocks, borrow <b>4</b> bits → /20: 2<sup>4</sup> = <b>16 subnets</b>, h = 12 → 4,096 − 2 = <b>4,094 hosts</b>. The borrowed bits are the top four of the third octet (128, 64, 32, 16), so the block size is <b>16 in the third octet</b>, and the fourth octet is all host bits.</p>
${K.out(`                 octet 1   octet 2   octet 3       octet 4
                 (fixed)   (fixed)   SSSS|HHHH     HHHHHHHH
Subnet 2 network 10101100.00010000.0001|0000.00000000  = 172.16.16.0
Subnet 2 bcast   10101100.00010000.0001|1111.11111111  = 172.16.31.255

Subnet  Network          First usable     Last usable       Broadcast
1       172.16.0.0/20    172.16.0.1       172.16.15.254     172.16.15.255
2       172.16.16.0/20   172.16.16.1      172.16.31.254     172.16.31.255
3       172.16.32.0/20   172.16.32.1      172.16.47.254     172.16.47.255
...     (the third octet climbs in 16s)
16      172.16.240.0/20  172.16.240.1     172.16.255.254    172.16.255.255`, "172.16.0.0/16 split into /20s (mask 255.255.240.0). 172 = 10101100, 16 = 00010000. Host bits: the last 4 of octet 3 plus all of octet 4.")}
<p>All 12 host bits set to 1 make octet 3 <code>0001 1111</code> = 31 and octet 4 = 255, so the broadcast is <code>172.16.31.255</code>, not <code>172.16.16.255</code>.</p>
${K.mistake(`Treating the fourth octet as fixed when the subnet bits end in the third. In <code>172.16.16.0/20</code>, <code>172.16.16.255</code> and <code>172.16.30.200</code> are ordinary hosts in the same subnet.`)}
<h3>A /8, briefly</h3>
<p><code>10.0.0.0/8</code> has 24 host bits. Borrow 8 → 256 /16s of 65,534 hosts: <code>10.1.0.0/16</code> for Lagos, <code>10.2.0.0/16</code> for Abuja. Borrow 16 → 65,536 /24s. A common enterprise shape: region in octet 2, site in octet 3.</p>
${K.case("The warehouse campus that was one big network",`
<p>A logistics company in Apapa grew from one warehouse to six on one flat <code>172.16.0.0/16</code>: about 1,800 scanners, PCs, printers, cameras and gate controllers in one broadcast domain. Scanners dropped sessions in the broadcast noise, and one looped patch lead in warehouse 4 stopped every building, gates included, for two hours.</p>
<p>The redesign kept the same /16 but subnetted it: a /20 per warehouse by building number (warehouse 1 = <code>172.16.16.0/20</code>, warehouse 2 = <code>172.16.32.0/20</code>…, <code>172.16.0.0/20</code> for the core), then a /24 per device type inside each — borrowing 4 more bits, the same skill again. Warehouse 3's scanners became <code>172.16.48.0/24</code> and its cameras <code>172.16.49.0/24</code>.</p>
<p>Now a loop takes down one subnet, cameras are firewalled from scanners, and <code>172.16.49.17</code> reads as &ldquo;warehouse 3, CCTV&rdquo;. The team's notes: <b>a flat network fails all at once</b>; <b>leave room</b> (they used 7 of 16 /20s); <b>put meaning in the octets</b>.</p>`)}
<h3>Subnet zero and the all-ones subnet: allowed today</h3>
<p>The first /26, <code>192.168.1.0/26</code> (subnet bits <code>00</code>), is ${K.g("subnet zero","The first subnet: borrowed bits all 0. Same network address as the original block. Usable today.")}; the last, <code>192.168.1.192/26</code> (<code>11</code>), is the ${K.g("all-ones subnet","The last subnet: borrowed bits all 1. Same broadcast as the original block. Usable today.")}. The 1980s standard said not to use them: ${K.g("classful","The 1980s scheme where the first bits of an address fixed its mask (Class A /8, B /16, C /24). Classful protocols such as RIPv1 sent no masks.")} routing protocols sent no masks, so <code>192.168.1.0/26</code> looked identical to the whole <code>192.168.1.0/24</code>, and the last subnet's broadcast matched the whole network's. Hence the old 2<sup>s</sup> − 2.</p>
<p>Modern protocols carry the mask with every route. Cisco IOS has always accepted the all-ones subnet, and has accepted subnet zero by default since release 12.0 (<code>ip subnet-zero</code>, on by default). Today, and on the CCNA: <b>subnets = 2<sup>s</sup></b>, all usable, unless a question says otherwise.</p>
${K.exam(`If a question says subnet zero and the all-ones subnet &ldquo;may not be used&rdquo; (or mentions <code>no ip subnet-zero</code>), use 2<sup>s</sup> − 2 for that question only: 3 bits → 6 subnets. Otherwise 2<sup>s</sup>.`)}
${K.dyk(`Subnetting was standardised in 1985 in RFC 950, &ldquo;Internet Standard Subnetting Procedure&rdquo;, which also introduced the subnet mask. The ${K.g("RFC","Request for Comments: the numbered documents that define internet standards.")} relaxing its subnet-zero rule, RFC 1878, came about ten years later (1995), so older books still mention the −2.`)}
<h3>The &ldquo;Nth subnet&rdquo; question</h3>
<p>&ldquo;Use the <b>fifth</b> subnet for voice.&rdquo; Subnets start at 0 and climb by the block size, so subnet <b>N</b> starts at <b>(N − 1) × block size</b>, counting subnet zero as subnet 1.</p>
${K.steps([
  ["5th /27 of 192.168.1.0/24", `<p>(5 − 1) × 32 = <b>128</b> → <code>192.168.1.128/27</code>, broadcast 160 − 1 = <b>.159</b>. Binary: the 5th 3-bit pattern is <code>100</code> → <code>100|00000</code> = 128. ✓</p>`],
  ["10th /20 of 172.16.0.0/16", `<p>(10 − 1) × 16 = <b>144</b> in the third octet → <code>172.16.144.0/20</code>, broadcast <b>172.16.159.255</b>.</p>`],
  ["Stretch: 10th /26 of 172.16.0.0/16", `<p>Block 64 in the fourth octet, so 4 subnets per third-octet value. 9 × 64 = 576 = 2 × 256 + 64 → third octet <b>2</b>, fourth <b>64</b>: <code>172.16.2.64/26</code>, broadcast <code>172.16.2.127</code>.</p>`],
])}
${K.mistake(`Multiplying by N instead of N − 1. The 5th /27 is not 5 × 32 = 160 — that's the 6th.`)}
${K.myth([
  ["Subnetting gives you more addresses.","It costs two per subnet: four /26s hold 248 usable hosts, a /24 holds 254."],
  ["You subtract 2 from the number of subnets.","Only from hosts, unless a question forbids subnet zero."],
  ["A /26 has 64 hosts.","64 <b>addresses</b>, <b>62</b> usable hosts."],
  ["Subnetting only happens in the last octet.","Borrowed bits can end in any octet; in a /20 the whole fourth octet is host bits."],
  ["The router must have the first usable address.","A convention, not a rule. Any usable address works if the hosts' gateway matches."],
])}
<h3>Drill: the Nth subnet, and finding any subnet</h3>
<p>The first type asks for the Nth subnet of a /24; the second gives any address and prefix and asks for network, broadcast and range — the reverse direction, like <code>192.168.7.100</code> above. Some end in the second or third octet: work in the octet where the mask stops being 255.</p>
${K.drill({title:"the Nth subnet, and network / broadcast / range", types:["nth","subnet"], count:5})}
${K.check({q:"172.16.0.0/16 is split into /20s. What is the broadcast address of 172.16.32.0/20?", o:["172.16.32.255","172.16.47.255","172.16.48.255","172.16.63.255"], a:1, why:"Block size 16 in the third octet: 172.16.32.0 ends one address before 172.16.48.0, so the broadcast is 172.16.47.255. 172.16.32.255 is an ordinary host."})}

<h2>Hands-on: put a subnetted plan on a router</h2>
<p>First the Ikeja job, then its router half on a lab router, then a subnetted network end to end.</p>
${K.job("Carve the Ikeja branch's 10.20.30.0/24 into users, voice, printers and management",`
<p><b>The request.</b> <i>&ldquo;Audit says printers and switch management must be separated from staff PCs — phones too, we want to prioritise calls later. We only have 10.20.30.0/24. Plan it and make the change on Saturday?&rdquo;</i></p>
<p><b>Questions first.</b> &ldquo;How many devices per group?&rdquo; — <i>38 PCs, 30 phones, 6 printers, 5 switches and APs.</i> &ldquo;Growth?&rdquo; — <i>maybe 10 more staff.</i> &ldquo;Anything else separate — CCTV, guest Wi-Fi?&rdquo; — <i>no.</i> &ldquo;Could head office give us more space?&rdquo; — <i>no.</i> &ldquo;Which devices have hard-coded addresses?&rdquo; — <i>printers and switches.</i></p>
<p><b>Checks.</b> On the branch router:</p>
${K.out(`IKJ-R1#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.20.30.1      YES manual up                    up
GigabitEthernet0/1     unassigned      YES unset  administratively down down
GigabitEthernet0/2     unassigned      YES unset  administratively down down

IKJ-R1#show interfaces g0/0 | include Internet address
  Internet address is 10.20.30.1/24

IKJ-R1#show ip arp | count GigabitEthernet0/0
Number of lines which match regexp = 80`, "One LAN interface holding the whole /24, and 80 ARP rows on it: 79 recently active devices plus the router's own address.")}
<p><code>show ip interface brief</code> never shows the mask, so the second command confirms the <code>/24</code>; the ARP count matches the manager's 79 devices.</p>
<p><b>The design.</b> Four groups → s = 2. Largest group: users, about 48 with growth → h = 6 (62). 2 + 6 = 8: four /26s fit exactly. Gateway = first usable.</p>
${K.out(`Group        Subnet            Gateway        Usable range                  Broadcast
Users        10.20.30.0/26     10.20.30.1     10.20.30.1   - 10.20.30.62    10.20.30.63
Voice        10.20.30.64/26    10.20.30.65    10.20.30.65  - 10.20.30.126   10.20.30.127
Printers     10.20.30.128/26   10.20.30.129   10.20.30.129 - 10.20.30.190   10.20.30.191
Management   10.20.30.192/26   10.20.30.193   10.20.30.193 - 10.20.30.254   10.20.30.255`, "The plan: four /26s, mask 255.255.255.192.")}
<p><b>The change.</b> Users stay in subnet 1, so PCs keep gateway <code>10.20.30.1</code> and only their mask changes (via DHCP). The subnets become VLANs with the router as each gateway (Module 4). Printers and switches are re-addressed one at a time, each tested before the next.</p>
<p><b>What you say.</b> &ldquo;Your network is now four groups. PCs work as before; printers have new addresses and the queues are updated. The router sits between the groups, so we can lock down management and printers as the audit asked.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;CR-2231 Ikeja. Was 10.20.30.0/24 flat (79 active hosts per sh ip arp count). Now 4 × /26: users .0 (gw .1 unchanged), voice .64 (gw .65), printers .128 (gw .129), mgmt .192 (gw .193). Users 38 of 62. Printers re-IP'd .130–.135, queues updated, test prints OK. Switches/APs .194–.198, SSH tested. Printer/mgmt subnets oversized — VLSM if needed. 3 h.&rdquo;</i></p>`)}
<h3>Try it yourself: three subnets on a router</h3>
<p>This lab router's three LAN ports stand in for the VLAN interfaces of Module 4. First make the most common real mistake on purpose and see how IOS protects you.</p>
${K.hint(`Router interfaces start shut down, so each needs <code>no shutdown</code>. <code>enable</code> → <code>configure terminal</code> → <code>interface g0/0</code> → <code>ip address 10.20.30.1 255.255.255.0</code> (the mistake) → <code>interface g0/1</code> → <code>ip address 10.20.30.65 255.255.255.192</code> and read the message. Then re-enter G0/0's address with the /26 mask; it replaces the old one.`)}
${K.term({env:"ios2", title:"BR-R1 — the Ikeja plan on three router ports", opts:{kind:"router", host:"BR-R1", motd:"BR-R1 — console. Lab router: G0/0 = users, G0/1 = voice, G0/2 = printers."},
  setup:env=>{ env.overlapSeen = false; const run = env.exec;
    env.exec = line => { const o = run(line); if (typeof o==="string" && o.indexOf("overlaps with")>-1) env.overlapSeen = true; return o; }; },
  intro:"A factory-fresh router. Plan: 10.20.30.0/24 split into /26s (255.255.255.192), gateway = first usable.",
  tasks:[
    {text:"Make the mistake on purpose: give G0/0 <code>10.20.30.1 255.255.255.0</code>, then on G0/1 try <code>ip address 10.20.30.65 255.255.255.192</code> and read the <code>overlaps with</code> error", done:e=>e.overlapSeen},
    {text:"Fix G0/0: <code>ip address 10.20.30.1 255.255.255.192</code>, a <code>description</code> (e.g. USERS), and <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0"]; return i.ip==="10.20.30.1" && i.mask==="255.255.255.192" && !i.shut && !!i.desc; }},
    {text:"G0/1 (voice): <code>10.20.30.65 255.255.255.192</code>, a description, <code>no shutdown</code> — no error this time", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return i.ip==="10.20.30.65" && i.mask==="255.255.255.192" && !i.shut && !!i.desc; }},
    {text:"G0/2 (printers): <code>10.20.30.129 255.255.255.192</code>, a description, <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/2"]; return i.ip==="10.20.30.129" && i.mask==="255.255.255.192" && !i.shut && !!i.desc; }},
    {text:"See the mask that <code>show ip interface brief</code> hides: <code>show interfaces g0/1 | include Internet</code> (add <code>do</code> in config mode)", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+int\w*\s+g\w*\s*0\/1\b/i.test(h))},
    {text:"Run <code>show ip route</code> — one <code>C</code> line per /26 and one <code>L</code> line per gateway address", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\w*\s+ip\s+ro\w*\s*$/i.test(h))},
    {text:"Save it: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && !!e.startup && e.startup.intfs["GigabitEthernet0/2"].ip==="10.20.30.129"},
  ],
  win:"You triggered IOS's overlap check, fixed the mask, put three /26 gateways on three interfaces, read the /26 in show interfaces, and saw one connected route per subnet — the router half of the Ikeja change.",
  solve:["enable","configure terminal","interface g0/0","ip address 10.20.30.1 255.255.255.0","interface g0/1","ip address 10.20.30.65 255.255.255.192",
    "interface g0/0","ip address 10.20.30.1 255.255.255.192","description USERS 10.20.30.0/26","no shutdown",
    "interface g0/1","ip address 10.20.30.65 255.255.255.192","description VOICE 10.20.30.64/26","no shutdown",
    "interface g0/2","ip address 10.20.30.129 255.255.255.192","description PRINTERS 10.20.30.128/26","no shutdown","end",
    "show interfaces g0/1 | include Internet","show ip route","copy running-config startup-config",""]})}
<p><code>% 10.20.30.64 overlaps with GigabitEthernet0/0</code> appeared because with a /24, G0/0 claimed .0 to .255. Real routers refuse the same way — often the first sign of a <code>255.255.255.0</code> typed from habit. The finished routing table on a real router:</p>
${K.out(`BR-R1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       O - OSPF, IA - OSPF inter area, * - candidate default

Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 6 subnets, 2 masks
C        10.20.30.0/26 is directly connected, GigabitEthernet0/0
L        10.20.30.1/32 is directly connected, GigabitEthernet0/0
C        10.20.30.64/26 is directly connected, GigabitEthernet0/1
L        10.20.30.65/32 is directly connected, GigabitEthernet0/1
C        10.20.30.128/26 is directly connected, GigabitEthernet0/2
L        10.20.30.129/32 is directly connected, GigabitEthernet0/2`, "After configuring three /26 gateways (codes trimmed). The lab terminal prints the same table, 'variably subnetted' heading included.")}
<ul>
<li><b>C</b> — connected subnets: interface address AND mask (lesson 3). <code>10.20.30.65</code> AND /26 = <code>10.20.30.64/26</code>.</li>
<li><b>L</b> — local: the router's own address on each interface, as a /32.</li>
<li><b>variably subnetted, 6 subnets, 2 masks</b> — six routes under the classful 10.0.0.0, using /26 and /32.</li>
</ul>
${K.dodont([
  "Write and agree the subnet table before touching a device.",
  "Check masks with <code>show interfaces</code> or <code>show running-config interface</code>.",
  "Give every interface a <code>description</code> naming its subnet.",
  "Record which subnets are spare.",
],[
  "Don't type <code>255.255.255.0</code> from habit on a subnetted plan.",
  "Don't give a device a subnet's network or broadcast address.",
  "Don't re-address a live network without a list of its hard-coded addresses.",
  "Don't spend a /24 on a two-router link.",
])}
<h3>Hands-on bench: subnet a LAN and route between the halves</h3>
<p>A branch router with two LAN interfaces, a switch behind each, and three unaddressed PCs. Plan: <code>192.168.50.0/24</code> into /26s. Subnet 1 (<code>.0/26</code>) on G0/0 with PC1 and PC2; subnet 2 (<code>.64/26</code>) on G0/1 with PC3. The router takes the first usable in each. Work out the numbers on paper first.</p>
${K.hint(`Subnet 1: router G0/0 <b>.1</b>, PCs .2–.62, broadcast .63. Subnet 2: router G0/1 <b>.65</b>, PCs .66–.126, broadcast .127. Mask everywhere <code>255.255.255.192</code>. Each PC's gateway is the router address <i>in its own subnet</i>.`)}
${K.bench({id:"m3-subnet-lan", points:80, from:"CCNA · Module 3 · lesson 4", title:"subnet 192.168.50.0/24 into /26s and route across", viewBox:"0 0 760 480", openLog:true,
  intro:"Console from the laptop's USB to BR-R1's CON port (Terminal app, 9600 8N1, no flow control). PC addresses go under <b>IP settings</b>; ping from <b>Command Prompt</b>.",
  devices:[
    {id:"r1", kind:"router", label:"BR-R1", model:"ISR 1100 · branch router, unconfigured", x:280, y:10},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:590, y:10},
    {id:"sw1", kind:"switch", label:"SW-A", model:"Catalyst 9200 · subnet 1 (G0/0)", x:10, y:130},
    {id:"sw2", kind:"switch", label:"SW-B", model:"Catalyst 9200 · subnet 2 (G0/1)", x:330, y:250},
    {id:"pc1", kind:"pc", label:"PC1", x:20, y:370},
    {id:"pc2", kind:"pc", label:"PC2", x:160, y:370},
    {id:"pc3", kind:"pc", label:"PC3", x:560, y:370},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g8"}, {type:"cat6", a:"r1:g1", b:"sw2:g8"}, {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw2:g1"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into BR-R1: console cable laptop USB → BR-R1 CON, then the Terminal app at 9600 8N1, no flow control", done:B=>Bench.consoleOk(B,"r1")},
    {text:"G0/0 gets the first usable address of subnet 1: <code>192.168.50.1 255.255.255.192</code>, then <code>no shutdown</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/0"]; return i.ip==="192.168.50.1" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"G0/1 gets the first usable address of subnet 2: <code>192.168.50.65 255.255.255.192</code>, then <code>no shutdown</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/1"]; return i.ip==="192.168.50.65" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"Give PC1 and PC2 two different addresses in subnet 1 (.2–.62), mask 255.255.255.192, gateway 192.168.50.1", done:B=>{ const ok = d => { const p = String(d.ip||"").split("."); return p.length===4 && p.slice(0,3).join(".")==="192.168.50" && +p[3]>=2 && +p[3]<=62 && d.mask==="255.255.255.192" && d.gw==="192.168.50.1"; }; return ok(B.devs.pc1) && ok(B.devs.pc2) && B.devs.pc1.ip!==B.devs.pc2.ip; }},
    {text:"Give PC3 an address in subnet 2 (.66–.126), mask 255.255.255.192, gateway 192.168.50.65", done:B=>{ const d = B.devs.pc3, p = String(d.ip||"").split("."); return p.length===4 && p.slice(0,3).join(".")==="192.168.50" && +p[3]>=66 && +p[3]<=126 && d.mask==="255.255.255.192" && d.gw==="192.168.50.65"; }},
    {text:"From PC1, ping PC3 across the router. In the log, PC1 ARPs for its <b>gateway</b>, not for PC3 — PC3 is in another subnet", done:B=>!!B.devs.pc3.ip && Bench.pinged(B,"pc1",B.devs.pc3.ip)},
    {text:"From PC3, ping PC2 — the reverse direction, through G0/1's gateway", done:B=>!!B.devs.pc2.ip && Bench.pinged(B,"pc3",B.devs.pc2.ip)},
    {text:"On BR-R1, <code>show ip route</code> — two connected /26s, one per interface", done:B=>B.devs.r1.env.history.some(h=>/^\s*(do\s+)?sh\w*\s+ip\s+ro\w*\s*$/i.test(h))},
  ],
  win:"You turned one /24 into /26 subnets, gave the router the first usable address in two of them, addressed hosts and gateways to match, and routed between them. Two broadcast domains, one plan, proven with ping.",
  solve:[["plug","console","lap:usb","r1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],
    ["term","interface g0/0"],["term","ip address 192.168.50.1 255.255.255.192"],["term","no shutdown"],
    ["term","interface g0/1"],["term","ip address 192.168.50.65 255.255.255.192"],["term","no shutdown"],["term","end"],
    ["ip","pc1","192.168.50.10","255.255.255.192","192.168.50.1"],["ip","pc2","192.168.50.11","255.255.255.192","192.168.50.1"],["ip","pc3","192.168.50.70","255.255.255.192","192.168.50.65"],
    ["pc","pc1","ping 192.168.50.70"],["pc","pc3","ping 192.168.50.11"],["term","show ip route"]]})}
${K.hint(`Ping fails? <i>General failure</i> usually means the PC's gateway isn't in its own subnet. <i>Request timed out</i> means no reply came back — check <code>no shutdown</code> on the router and the far PC's gateway. Use <code>ipconfig</code> on PCs and <code>show ip interface brief</code> on the router.`)}
<p>In the log, PC1 sent an ARP request for <b>192.168.50.1</b>: PC3's address AND-ed with /26 gives <code>.64</code>, not PC1's <code>.0</code>, so PC1 used its gateway. The broadcast never reached SW-B — the router stopped it.</p>
<p><b>Experiment:</b> set PC1's mask to <code>255.255.255.0</code> and ping PC3 again. It still works: PC1 ARPs for PC3 directly and the router answers with its own MAC — <b>proxy ARP</b> from Module 2, on by default — hiding the wrong mask until someone configures <code>no ip proxy-arp</code>. Put the mask back afterwards.</p>
${K.mistake(`Leaving every PC's gateway as <code>.1</code> after subnetting. Hosts in subnet 2 need the router address <b>in subnet 2</b> (<code>.65</code>); a gateway outside the host's subnet is unreachable.`)}
${K.check({q:"PC3 has 192.168.50.70/26 and gateway 192.168.50.1. Router G0/0 is 192.168.50.1/26, G0/1 is 192.168.50.65/26, and PC3 is on G0/1's switch. Why can't PC3 reach other subnets?", o:["192.168.50.70 is a broadcast address","Its gateway is in 192.168.50.0/26, not PC3's subnet, so PC3 can't reach it","The router needs a static route to 192.168.50.64/26","The mask should be 255.255.255.224"], a:1, why:"PC3 is in 192.168.50.64/26 (.65–.126). A gateway must be in the host's own subnet so the host can ARP for it: set 192.168.50.65."})}

<h2>Interview corner</h2>
${K.hint(`Formula, then numbers: prefix, mask, subnets, hosts, block size.`)}
${K.reveal("“How many subnets and hosts if you borrow 3 bits from a /24?”",`<p>"/24 becomes /27, mask 255.255.255.224. Subnets: 2 cubed = 8. Five host bits left: 32 minus network and broadcast = 30 usable hosts each. Block size 32, so subnets start at .0, .32, .64 up to .224 — all 8 usable on modern IOS."</p>`)}
${K.hint(`Requirement → bits → prefix → table, then the gateway convention and the sanity check.`)}
${K.reveal("“Walk me through subnetting 192.168.1.0/24 into four.”",`<p>"Four is 2 squared, so I borrow 2 bits: /26, 255.255.255.192, 62 usable hosts each. The lowest borrowed bit is worth 64, so the networks are .0, .64, .128, .192. First: usable .1 to .62, broadcast .63. Second: .65 to .126, .127. Third: .129 to .190, .191. Fourth: .193 to .254, .255. Gateways usually .1, .65, .129, .193. The last broadcast is .255, so the list checks out."</p>`)}
${K.hint(`Both constraints, then say no — with numbers and an alternative.`)}
${K.reveal("“A manager wants five departments of 40 users from one /24. What do you say?”",`<p>"It doesn't fit with equal subnets. Five subnets needs 3 bits, leaving 30 hosts each; 40 hosts needs 6 host bits, leaving only 4 subnets. That's 9 bits and a /24 has 8 — five blocks of 64 is 320 addresses against 256. I'd ask for a /23, or, if some departments are smaller, size each subnet to its need with VLSM."</p>`)}

${K.recap([
  "Subnetting gives smaller broadcast domains, security boundaries, addresses that map to places, and less waste.",
  "Borrowing s bits moves the prefix right by s. Subnets = 2^s; usable hosts = 2^h − 2.",
  "For a /24: /25 = 2 × 126, /26 = 4 × 62, /27 = 8 × 30, /28 = 16 × 14, /29 = 32 × 6, /30 = 64 × 2.",
  "Host bits all 0 = network, all 1 = broadcast; first usable = network + 1, last = broadcast − 1.",
  "Subnets climb by the block size, the value of the lowest borrowed bit: /26 → 0, 64, 128, 192.",
  "From requirements: smallest s with 2^s ≥ subnets, smallest h with 2^h − 2 ≥ hosts, and s + h must fit — or you need a bigger block.",
  "Subnet zero and the all-ones subnet are usable today; subtract 2 from subnets only if a question forbids them.",
  "The Nth subnet starts at (N − 1) × block size, in the octet where the borrowed bits end.",
])}
${K.next(`<b>Lesson 5 — Subnetting at exam speed: the magic-number method across Class A, B and C.</b> You've watched the block size fall out of the binary. Next it becomes a method that finds any subnet, broadcast and range in seconds, in whichever octet the mask ends.`)}
`,
quiz:[
  {lvl:1, q:"You borrow 2 bits from the host portion of 192.168.1.0/24. How many subnets do you create?", o:["2","4","6","8"], a:1, why:"Subnets = 2^s. With s = 2: 2 × 2 = 4 subnets (subnet bits 00, 01, 10, 11). The new prefix is /26."},
  {lvl:1, q:"How many usable host addresses does each /27 subnet have?", o:["32","30","27","14"], a:1, why:"A /27 leaves 5 host bits: 2^5 = 32 addresses, minus the network and broadcast addresses = 30 usable hosts."},
  {lvl:1, type:"fill", q:"192.168.4.0/24 is split into /28 subnets. How many usable hosts does each subnet have?", fields:[{label:"Usable hosts", a:["14"]}], why:"/28 leaves 32 − 28 = 4 host bits: 2^4 − 2 = 16 − 2 = 14 usable hosts per subnet."},
  {lvl:1, type:"match", q:"Match each part of a subnet with how its host bits look.", pairs:[["Network address","All host bits 0"],["Broadcast address","All host bits 1"],["First usable address","All host bits 0 except the last, which is 1"],["Last usable address","All host bits 1 except the last, which is 0"]], why:"Host bits all 0 name the subnet; all 1 is its broadcast. The first usable is network + 1 (…0001), the last usable is broadcast − 1 (…1110)."},
  {lvl:2, q:"You must split 192.168.10.0/24 into at least 6 equal subnets, keeping as many hosts per subnet as possible. Which prefix do you use, and how many hosts does each subnet get?", o:["/26 with 62 hosts","/27 with 30 hosts","/28 with 14 hosts","/27 with 32 hosts"], a:1, why:"2^2 = 4 is too few; 2^3 = 8 is enough, so borrow 3 bits: /27. Using the fewest bits keeps the most hosts: 2^5 − 2 = 30. /28 also gives enough subnets but wastes host space; 32 forgets the −2."},
  {lvl:2, q:"Each subnet carved from 192.168.20.0/24 must hold 50 hosts. What is the longest prefix that works, and how many such subnets can you make?", o:["/26, 4 subnets","/27, 8 subnets","/25, 2 subnets","/26, 2 subnets"], a:0, why:"h = 5 gives 30 hosts (too few); h = 6 gives 62. Prefix 32 − 6 = /26, leaving 2 subnet bits in the /24: 2^2 = 4 subnets."},
  {lvl:2, type:"multi", q:"Which two addresses can be assigned to hosts in the subnet 192.168.1.64/26? (Choose two.)", o:["192.168.1.64","192.168.1.65","192.168.1.100","192.168.1.127","192.168.1.128"], a:[1,2], why:"192.168.1.64/26 runs from .64 (network) to .127 (broadcast), so usable hosts are .65 to .126. .128 is the next subnet's network address."},
  {lvl:2, type:"order", q:"Put the steps for listing the subnets of a /24 in the correct order.", items:["Work out how many bits to borrow from the requirement","Write the new prefix and mask","List every pattern of the borrowed bits and convert each to the octet's value","For each subnet, set the host bits to all 0s and all 1s to get the network and broadcast","Add 1 to the network and subtract 1 from the broadcast for the usable range"], why:"Bits first, then the mask, then the subnet numbers (which climb by the block size), then network and broadcast from the host bits, and finally the usable range between them."},
  {lvl:2, q:"192.168.5.0/24 is divided into /27 subnets. Counting the first subnet as subnet 1, what is the network address of the 5th subnet?", o:["192.168.5.96","192.168.5.128","192.168.5.160","192.168.5.5"], a:1, why:"The /27 block size is 32. Subnet N starts at (N − 1) × 32: (5 − 1) × 32 = 128, so 192.168.5.128/27. 160 is the 6th subnet — the trap for multiplying by N instead of N − 1."},
  {lvl:2, type:"fill", q:"172.16.0.0/16 is split into /20 subnets. For the third subnet (counting 172.16.0.0/20 as the first), give the network and broadcast addresses.", fields:[{label:"Network", a:["172.16.32.0","172.16.32.0/20"]},{label:"Broadcast", a:["172.16.47.255"]}], why:"A /20 borrows the top 4 bits of the third octet, so the block size is 16 there: 172.16.0.0, 172.16.16.0, 172.16.32.0. The third subnet ends one address before 172.16.48.0, so its broadcast is 172.16.47.255."},
  {lvl:2, q:"An exam question says: 'Subnet zero and the all-ones subnet cannot be used.' You borrow 3 bits from a /24. How many usable subnets do you have for that question?", o:["8","6","5","3"], a:1, why:"Normally 2^3 = 8 subnets, all usable on modern IOS. When a question explicitly forbids subnet zero and the all-ones subnet, use the old rule 2^s − 2 = 6 for that question only."},
  {lvl:2, type:"fill", q:"You're in interface configuration mode on G0/1. Type the command that gives it the first usable address of 192.168.50.64/26.", fields:[{label:"Command", a:["ip address 192.168.50.65 255.255.255.192"], ios:true}], why:"The first usable address is network + 1 = 192.168.50.65, and /26 is 255.255.255.192. IOS takes the mask in dotted-decimal form: ip address 192.168.50.65 255.255.255.192."},
  {lvl:3, q:"A user's PC can't reach anything outside its own subnet. Based on the exhibit, what is the fix?", ex:"C:\\Users\\Ada>ipconfig\n\nEthernet adapter Ethernet:\n\n   IPv4 Address. . . . . . . . . . . : 10.20.30.130\n   Subnet Mask . . . . . . . . . . . : 255.255.255.192\n   Default Gateway . . . . . . . . . : 10.20.30.65\n\nIKJ-R1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.20.30.1      YES manual up                    up\nGigabitEthernet0/1     10.20.30.65     YES manual up                    up\nGigabitEthernet0/2     10.20.30.129    YES manual up                    up", o:["Change the PC's mask to 255.255.255.0 so it can reach .65","The PC is in 10.20.30.128/26, so its gateway must be 10.20.30.129; or, if it belongs in the voice subnet, re-address it within .66–.126","Add a static route on the router to 10.20.30.128/26","Shut down G0/2 so the PC uses G0/1"], a:1, why:"10.20.30.130 AND 255.255.255.192 = 10.20.30.128, the printer subnet (.129–.190), so a gateway of .65 is outside the PC's subnet and unreachable. Either set the gateway to that subnet's router address, .129, or move the PC into the subnet it was meant for. Widening the mask would overlap the router's other subnets and only hide the mistake."},
  {lvl:3, q:"While configuring a new branch plan, you get the error in the exhibit. What caused it, and what should you do?", ex:"BR-R1(config)#interface g0/1\nBR-R1(config-if)#ip address 10.20.30.65 255.255.255.192\n% 10.20.30.64 overlaps with GigabitEthernet0/0\n\nBR-R1#show running-config interface g0/0\ninterface GigabitEthernet0/0\n description USERS\n ip address 10.20.30.1 255.255.255.0", o:["10.20.30.65 is a broadcast address; use 10.20.30.66","G0/0 still has the whole /24 (255.255.255.0), which includes 10.20.30.64/26; re-enter G0/0's address with 255.255.255.192","Two interfaces can never be in the same /24; use a different /24 for voice","The router needs ip subnet-zero enabled"], a:1, why:"With a /24 on G0/0, the router treats .0–.255 as G0/0's network, so any other interface in that range overlaps. The plan says /26, so G0/0 must be 10.20.30.1 255.255.255.192. Then .64/26 on G0/1 no longer overlaps. Subnet zero is on by default and isn't the issue."},
  {lvl:3, q:"A manager wants five departments of 40 users each, all from 192.168.60.0/24, using equal-size subnets. What is the correct response?", o:["Use /26: it gives 62 hosts per subnet","Use /27: it gives 8 subnets","It can't be done: 5 subnets need 3 borrowed bits (30 hosts each) and 40 hosts need 6 host bits (only 4 subnets); ask for a larger block such as a /23","Use /26 and put the fifth department in subnet zero"], a:2, why:"Five subnets need s = 3, and 40 hosts need h = 6; 3 + 6 = 9 bits, but a /24 has only 8. A /26 gives only 4 subnets; a /27 gives only 30 hosts. Five blocks of 64 addresses need 320 addresses against 256. A larger block (a /23 has 512) solves it."},
  {lvl:3, q:"After a subnetting change, PC1 is 192.168.50.10 with mask 255.255.255.0 (it should be /26) and gateway 192.168.50.1. Router G0/0 is 192.168.50.1/26, G0/1 is 192.168.50.65/26, and PC3 (192.168.50.70/26) is on G0/1. PC1 can still ping PC3. Why, and why does it matter?", o:["The /24 mask is correct because the original block was a /24","The router answers PC1's ARP for 192.168.50.70 with its own MAC (proxy ARP, on by default), hiding the wrong mask; if the router is hardened with no ip proxy-arp, PC1 loses PC3's subnet","PC1's ping goes through the switch directly to PC3","Windows ignores the subnet mask when a gateway is set"], a:1, why:"With /24, PC1 thinks PC3 is local and ARPs for it. That broadcast can't reach PC3's subnet, but the router has a route to 192.168.50.64/26 out of another interface, so proxy ARP answers with the router's MAC and routes the traffic. It works by accident; fix the mask to 255.255.255.192."},
],
cards:[
  {f:"What is subnetting?", b:"Dividing one network block into smaller, equal networks (subnets) by moving the mask's boundary to the right — borrowing host bits as subnet bits."},
  {f:"Four reasons to subnet", b:"Smaller broadcast domains; security boundaries a router or firewall can enforce; addresses that map to sites, floors or departments; not wasting addresses."},
  {f:"Number of subnets", b:"2^s, where s is the number of borrowed bits. Borrow 3 bits → 8 subnets."},
  {f:"Usable hosts per subnet", b:"2^h − 2, where h is the host bits left. The −2 is the network (all 0s) and broadcast (all 1s) addresses. /26 → 62."},
  {f:"Trade-off table for a /24", b:"/25 2×126 · /26 4×62 · /27 8×30 · /28 16×14 · /29 32×6 · /30 64×2."},
  {f:"Block size", b:"Addresses per subnet = 2^h = value of the lowest borrowed bit. Subnets start at multiples of it: /26 → 0, 64, 128, 192; /27 → steps of 32."},
  {f:"The four /26 subnets of 192.168.1.0/24", b:".0 (.1–.62, bc .63) · .64 (.65–.126, bc .127) · .128 (.129–.190, bc .191) · .192 (.193–.254, bc .255)."},
  {f:"Requirement: N subnets", b:"Smallest s with 2^s ≥ N. 6 subnets → s = 3 (8). Then hosts are whatever the remaining bits give."},
  {f:"Requirement: N hosts", b:"Smallest h with 2^h − 2 ≥ N. 50 hosts → h = 6 (62) → /26. Remember the −2: 32 hosts needs a /26, not a /27."},
  {f:"Both requirements", b:"Find minimum s and minimum h; they must fit: s + h ≤ host bits available (8 for a /24). If not, you need a bigger block or VLSM."},
  {f:"Subnet zero and the all-ones subnet", b:"First subnet (borrowed bits all 0) and last (all 1). Avoided in the 1980s because classful protocols sent no masks; usable today: IOS always allowed the all-ones subnet, and subnet zero by default since 12.0 (ip subnet-zero, default on)."},
  {f:"The Nth subnet", b:"Starts at (N − 1) × block size. 5th /27 of a /24 = 4 × 32 = .128. 10th /20 of 172.16.0.0/16 = 172.16.144.0."},
  {f:"172.16.0.0/16 into /20s", b:"16 subnets of 4,094 hosts; block size 16 in the third octet: 172.16.0.0, .16.0, .32.0 … .240.0. First broadcast 172.16.15.255."},
  {f:"% x.x.x.x overlaps with GigabitEthernet0/0", b:"IOS refuses an interface address whose subnet overlaps another interface's — often because a /24 mask was typed on a subnetted plan. Fix the mask on the other interface."},
],
});
// ---------- Module 3 · Lesson 5 ----------
L.push({
id:"ip-fast", mins:70, level:"Beginner → exam speed · builds on lessons 1–4",
t:"Subnetting at exam speed: the magic-number method across Class A, B and C",
html:`
${K.goals([
  "Find the network, broadcast, usable range and host count for any IPv4 address and prefix in under 30 seconds.",
  "Pick the right octet to work in for any prefix, whatever the address class.",
  "Write the whiteboard cheat sheet from memory in under a minute.",
  "Spot the traps: network or broadcast offered as a host, &ldquo;subnets&rdquo; off a block boundary, ranges that cross a boundary, /31 and /32.",
  "Read a router's <code>show ip route</code> and running-config, name each interface's subnet, and choose addresses that fit a given subnet.",
])}
${K.pre(["Module 3 lessons 1–4: binary place values, IPv4 address structure and special addresses, masks and the AND that finds the network, and borrowing bits to count subnets and hosts. This lesson makes all of that fast."])}

<h2>Why this matters at work</h2>
<p>You are in a project meeting in an Ikoyi office. The facilities manager says, &ldquo;The new CCTV cameras will go in 10.20.37.0, the vendor wants the recorder on .255, is that OK?&rdquo; Eight people look at you. Opening a laptop and a subnet calculator takes a minute and looks unsure. Saying &ldquo;yes&rdquo; and being wrong costs a weekend. The engineer who answers in five seconds, &ldquo;If that VLAN is a /21, .255 is fine, it's mid-block; if it's a /24, it's the broadcast and it won't work,&rdquo; is the one who gets trusted with the design.</p>
<p>The CCNA exam is the same pressure, measured. Subnetting hides inside questions about something else: which host can't reach its gateway, which route matches, which ACL line covers an interface. You get roughly a minute per question, no calculator, and the CCNA exam doesn't let you go back to an earlier question. Lessons 3 and 4 taught you to do it properly, in binary. This lesson teaches the professionals' shortcut, the <b>magic-number method</b>, until it is fast and still right.</p>

<h2>The magic-number method, step by step</h2>
<p>In lesson 3 you AND-ed all 32 bits of address and mask. That always works, but most of those bits don't need writing. Look at the AND octet by octet:</p>
<ul>
<li>Where the mask octet is <b>255</b> (all ones), the address octet passes through unchanged. Copy it.</li>
<li>Where the mask octet is <b>0</b> (all zeros), the result is 0. Write 0.</li>
<li>Only the one octet where the mask is <i>something else</i> (128, 192, 224, 240, 248, 252 or 254) needs any thought.</li>
</ul>
<p>That octet is the ${K.g("interesting octet","The one octet where the subnet mask is neither 255 nor 0: the octet where the network part ends and the host part begins. All the subnetting arithmetic happens there.")}. Left of it: copied. Right of it: 0 in the network address, 255 in the broadcast. A 32-bit problem becomes a one-octet problem.</p>
<h3>Which octet is interesting? The prefix decides, not the class</h3>
<p>Each octet holds 8 bits of the ${K.g("prefix length","The number of 1-bits in the subnet mask, written /n. /20 means the first 20 bits are the network part.")}, so the prefix shows where the network part ends:</p>
${K.svg("0 0 720 210",
  K.txt(360,22,"32 bits of an IPv4 address: which octet does the prefix end in?",{c:"fg",s:12.5,mid:true,f:"display",b:true})+
  K.band(40,58,160,34,"octet 1 (bits 1–8)")+K.band(200,58,160,34,"octet 2 (bits 9–16)")+K.band(360,58,160,34,"octet 3 (bits 17–24)")+K.band(520,58,160,34,"octet 4 (bits 25–32)")+
  [[260,"/11"],[440,"/20"],[480,"/22"],[580,"/27"]].map(([x,l])=>`<line x1="${x}" y1="50" x2="${x}" y2="102" stroke="var(--accent)" stroke-width="2"/>`+K.txt(x,118,l,{c:"accent",s:12,mid:true,b:true})).join("")+
  K.txt(120,150,"/1 – /8",{c:"fg",mid:true,s:11.5})+K.txt(280,150,"/9 – /16",{c:"fg",mid:true,s:11.5})+K.txt(440,150,"/17 – /24",{c:"fg",mid:true,s:11.5})+K.txt(600,150,"/25 – /32",{c:"fg",mid:true,s:11.5})+
  K.txt(120,168,"rare in practice",{mid:true,s:10})+K.txt(280,168,"e.g. 10.70.4.9/11",{mid:true,s:10})+K.txt(440,168,"e.g. 172.16.45.200/20",{mid:true,s:10})+K.txt(600,168,"e.g. 192.168.77.130/27",{mid:true,s:10})+
  K.txt(360,198,"/8, /16, /24 and /32 end exactly on an octet edge: no interesting octet, nothing to calculate",{mid:true,s:10.5}),
  "Each octet is 8 bits wide. The prefix's last network bit falls inside one octet, and that octet is the interesting one. The address class plays no part.")}
<p>The address class is nowhere in that picture. A Class A address such as 10.1.1.70 with a /27 works in octet 4, exactly like a Class C. Class only tells you the old default mask (lesson 2); the prefix you're given is what counts.</p>
${K.mistake(`Choosing the octet from the class: &ldquo;10.x is Class A, so I work in octet 2.&rdquo; For 10.1.1.70/27 that gives nonsense. Always go from the <b>prefix</b>: /27 ends in octet 4, so octet 4 is interesting, whatever the first octet is.`)}
<h3>The block size: 256 minus the mask value</h3>
<p>In the interesting octet, the subnets sit side by side in equal ${K.g("blocks","The run of addresses one subnet covers in the interesting octet. Every subnet of that prefix starts at a multiple of the block size.")}. The block size is the ${K.g("magic number","Nickname for the block size: 256 minus the mask value in the interesting octet. Subnets start at multiples of it.")}:</p>
<p><b>block size = 256 − mask value in the interesting octet</b></p>
<p>Why does that work? Mask value 224 is <code>1110 0000</code>: three network bits, five host bits. The lowest network bit is worth 32, so each step of the network part moves the address by 32. Five host bits also give 2^5 = 32 combinations, and 224 + 32 = 256. So subnets in that octet start at 0, 32, 64, 96, 128, 160, 192 and 224.</p>
${K.analogy(`<p>Picture a street where houses are grouped in blocks of 32, starting at house 0. Which block is house 130 in? You don't count houses; you count blocks: 0, 32, 64, 96, 128 — the next, 160, is past 130. So house 130 is in the block starting at 128, whose last house is 159, one before the next block. That is the whole method.</p>`)}
<h3>Worked example: 192.168.77.130/27 (interesting octet 4)</h3>
${K.steps([
  ["Find the interesting octet", `<p>/27 lies between /25 and /32, so it ends in <b>octet 4</b>. Octets 1–3 of the mask are 255: copy <code>192.168.77</code> straight into every answer.</p>`],
  ["Mask value and block size", `<p>27 − 24 = 3 network bits in octet 4: 128 + 64 + 32 = <b>224</b>. Mask: <code>255.255.255.224</code>. Block size = 256 − 224 = <b>32</b>.</p>`],
  ["Find the multiple at or below the address octet", `<p>The address octet is 130. Count in 32s: 0, 32, 64, 96, <b>128</b>, (160 is too big). The network octet is <b>128</b>. Network address: <code>192.168.77.128</code>.</p>`],
  ["Broadcast = next block − 1", `<p>Next block starts at 128 + 32 = 160, so the ${K.g("broadcast address","The last address of a subnet: all host bits set to 1. Used to reach every host in the subnet; can't be given to a host.")} is 160 − 1 = 159: <code>192.168.77.159</code>.</p>`],
  ["Usable range and host count", `<p>${K.g("First usable","The network address + 1: the lowest address you can give a host or router interface.")}: <code>192.168.77.129</code>. ${K.g("Last usable","The broadcast address − 1: the highest address you can give a host.")}: <code>192.168.77.158</code>. Hosts: 2^5 − 2 = <b>30</b> (or block − 2 = 30).</p>`],
])}
${K.svg("0 0 720 250",
  K.txt(360,22,"192.168.77.130/27 → mask .224 → block 32 in octet 4",{c:"fg",s:12.5,mid:true,f:"display",b:true})+
  [0,1,2,3,4,5,6,7].map(k=>`<rect x="${40+80*k}" y="92" width="80" height="36" rx="4" fill="var(--${k===4?"chip":"panel2"})" stroke="var(--${k===4?"accent":"line"})" stroke-width="${k===4?2:1.2}"/>`+K.txt(80+80*k,114,`${32*k}–${32*k+31}`,{c:k===4?"accent":"muted",mid:true,s:10.5,b:k===4})).join("")+
  [0,1,2,3,4,5,6,7,8].map(k=>`<line x1="${40+80*k}" y1="128" x2="${40+80*k}" y2="138" stroke="var(--muted)"/>`+K.txt(40+80*k,152,String(32*k),{c:"fg",mid:true,s:11})).join("")+
  K.arrow(365,60,365,90,"",true)+K.txt(365,52,"address octet 130",{c:"accent",mid:true,s:11,b:true})+
  K.txt(40,186,"network   = 192.168.77.128   (128 = 4 × 32: the last multiple of 32 at or below 130)",{c:"fg",s:11})+
  K.txt(40,206,"broadcast = 192.168.77.159   (next block starts at 160, minus 1)",{c:"fg",s:11})+
  K.txt(40,226,"usable    = .129 to .158     (30 hosts)",{c:"fg",s:11}),
  "The block-size number line for octet 4 of a /27. Subnets start every 32; the address 130 falls in the block that starts at 128 and ends at 159.")}
<h3>The proof in binary</h3>
<p>The shortcut <i>is</i> the AND from lesson 3, done on one octet:</p>
${K.out(`              decimal   binary
address          130    1000 0010
mask             224    1110 0000
AND (network)    128    1000 0000    -> 192.168.77.128
broadcast        159    1001 1111    -> network bits kept, 5 host bits all 1
first usable     129    1000 0001
last usable      158    1001 1110`, "Octet 4 only. The first three bits (100) are the subnet; the last five are the host part.")}
<p>Keep binary for when you doubt yourself: the magic number is the method, binary is the check.</p>
${K.remember(`<b>Octet → 256 minus → multiple down → next minus one.</b> Left of the octet: copy. Right of it: 0s for the network, 255s for the broadcast.`)}
${K.check({q:"What is the network address of 192.168.10.200/26?", o:["192.168.10.192","192.168.10.128","192.168.10.200","192.168.10.196"], a:0, why:"/26 → mask value 192 in octet 4 → block 256 − 192 = 64. Multiples: 0, 64, 128, 192. 200 is in the block starting at 192, so the network is 192.168.10.192 and the broadcast 192.168.10.255."})}

<h2>The whiteboard cheat sheet</h2>
<p>Before the first exam question, spend one minute writing a small table on the note board. Every subnetting question after that becomes a look-up plus one multiple. The whole table grows from one row you know from lesson 1: the place values.</p>
${K.out(`bit in octet     1    2    3    4    5    6    7    8
place value    128   64   32   16    8    4    2    1   <- also the BLOCK SIZE
mask value     128  192  224  240  248  252  254  255   <- running total of place values

prefix in oct 2  /9  /10  /11  /12  /13  /14  /15  /16
prefix in oct 3 /17  /18  /19  /20  /21  /22  /23  /24
prefix in oct 4 /25  /26  /27  /28  /29  /30  /31  /32`, "The cheat sheet. Read down a column: /20 is the 4th bit of octet 3, mask value 240, block 16.")}
<p>How to write it from nothing, in under a minute:</p>
<ol>
<li><b>Place values</b>: start at 128 and halve. Each is the block size for its column.</li>
<li><b>Mask values</b>: a running total: 128, +64 = 192, +32 = 224, +16 = 240, +8 = 248, +4 = 252, +2 = 254, +1 = 255. Check: mask value + block = 256 in every column (in the last, 255 means the whole octet is network).</li>
<li><b>Prefix rows</b>: /9 to /16 under the columns, then add 8 per row. /11, /19 and /27 share a column: mask value 224, block 32, in octets 2, 3 and 4.</li>
</ol>
<p>The table for the prefixes the CCNA uses most follows from it. Usable hosts are 2^h − 2, where h, the number of host bits, is 32 − prefix.</p>
<div class="tablewrap"><table>
<tr><th>Prefix</th><th>Mask</th><th>Interesting octet</th><th>Block size</th><th>Usable hosts</th></tr>
<tr><td>/17</td><td>255.255.128.0</td><td>3</td><td>128</td><td>32,766</td></tr>
<tr><td>/18</td><td>255.255.192.0</td><td>3</td><td>64</td><td>16,382</td></tr>
<tr><td>/19</td><td>255.255.224.0</td><td>3</td><td>32</td><td>8,190</td></tr>
<tr><td>/20</td><td>255.255.240.0</td><td>3</td><td>16</td><td>4,094</td></tr>
<tr><td>/21</td><td>255.255.248.0</td><td>3</td><td>8</td><td>2,046</td></tr>
<tr><td>/22</td><td>255.255.252.0</td><td>3</td><td>4</td><td>1,022</td></tr>
<tr><td>/23</td><td>255.255.254.0</td><td>3</td><td>2</td><td>510</td></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>— (octet edge)</td><td>256 in octet 4</td><td>254</td></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>4</td><td>128</td><td>126</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>4</td><td>64</td><td>62</td></tr>
<tr><td>/27</td><td>255.255.255.224</td><td>4</td><td>32</td><td>30</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>4</td><td>16</td><td>14</td></tr>
<tr><td>/29</td><td>255.255.255.248</td><td>4</td><td>8</td><td>6</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>4</td><td>4</td><td>2</td></tr>
</table></div>
<p>Don't memorise the host column. In octet 4, hosts = block − 2. Higher up, a few powers of two (2^10 = 1,024, 2^11 = 2,048, 2^12 = 4,096) cover almost every question: a /20 has 12 host bits, so 4,094 hosts.</p>
${K.remember(`<b>128, 192, 224, 240, 248, 252, 254, 255.</b> Say them as a rhythm, &ldquo;one-twenty-eight, one-ninety-two, two-twenty-four, two-forty&rdquo;, then &ldquo;two-forty-eight, -fifty-two, -fifty-four, -fifty-five&rdquo;: the last four climb by 4, 2, 1.`)}
${K.tip(`Given a dotted mask such as 255.255.248.0 instead of a prefix? The interesting octet is the first one that isn't 255 (octet 3, value 248) and the block is 256 − 248 = 8. Go straight to the multiples.`)}
<h3>Drill the cheat sheet</h3>
<p>Make the conversions automatic: under five seconds each.</p>
${K.drill({title:"prefix ↔ mask, from the cheat sheet", types:["prefix2mask","mask2prefix"], count:8})}
${K.check({q:"Which mask and block size go with /21?", o:["255.255.248.0, block 8 in octet 3","255.255.255.248, block 8 in octet 4","255.255.240.0, block 16 in octet 3","255.255.252.0, block 4 in octet 3"], a:0, why:"/21 is the 5th bit of octet 3 (/17 is the 1st). The 5th mask value is 248 and the 5th place value is 8. 255.255.255.248 is /29, the same column one octet to the right."})}

<h2>Octets 3 and 2: bigger blocks, same method</h2>
<p>In octet 3 or 2 the method is identical. The only new part: octets to the <b>right</b> of the interesting octet are all host bits, so they are 0 in the network address and 255 in the broadcast.</p>
<h3>Worked example: 172.16.45.200/20 (interesting octet 3)</h3>
${K.steps([
  ["Interesting octet", `<p>/20 lies between /17 and /24: <b>octet 3</b>. Octets 1 and 2 are copied: <code>172.16</code>. Octet 4 is all host bits.</p>`],
  ["Mask value and block", `<p>20 − 16 = 4 bits into octet 3 → 4th mask value <b>240</b>. Mask <code>255.255.240.0</code>. Block = 256 − 240 = <b>16</b>.</p>`],
  ["Multiple at or below 45", `<p>Count in 16s: 0, 16, <b>32</b>, (48 is too big). Network octet 3 = 32. Octet 4 → 0. Network: <code>172.16.32.0</code>.</p>`],
  ["Broadcast", `<p>Next block is 48, so octet 3 = 48 − 1 = <b>47</b>, and octet 4 → 255. Broadcast: <code>172.16.47.255</code>.</p>`],
  ["Range and hosts", `<p>First usable <code>172.16.32.1</code>, last usable <code>172.16.47.254</code>. Host bits: 32 − 20 = 12 → 2^12 − 2 = <b>4,094</b>. The .200 in octet 4 played no part: octet 4 is all host bits.</p>`],
])}
${K.out(`              decimal   binary (octet 3)
address           45    0010 1101
mask             240    1111 0000
AND (network)     32    0010 0000    -> 172.16.32.0
broadcast         47    0010 1111    -> 172.16.47.255 (octet 4 all ones = 255)`, "The proof for 172.16.45.200/20, octet 3 only. Octet 4 is entirely host bits: 0 in the network, 255 in the broadcast.")}
${K.mistake(`Writing the broadcast of 172.16.45.200/20 as <code>172.16.47.0</code> or the last usable as <code>172.16.47.255</code>. Once the interesting octet is 3, octet 4 is all host bits: the broadcast is <code>172.16.47.<b>255</b></code> and the last usable is <code>172.16.47.<b>254</b></code>.`)}
<h3>Worked example: 10.10.100.1/22 (octet 3, the address is on a boundary)</h3>
${K.steps([
  ["Interesting octet, mask, block", `<p>/22 → <b>octet 3</b>, 6 bits in → mask value <b>252</b> (<code>255.255.252.0</code>). Block = 256 − 252 = <b>4</b>.</p>`],
  ["Multiple at or below 100", `<p>For small blocks, don't count from zero; divide. 100 ÷ 4 = 25 exactly, so 100 <i>is</i> a multiple. Network octet 3 = <b>100</b>. Network: <code>10.10.100.0</code>.</p>`],
  ["Broadcast", `<p>Next block: 104. Octet 3 = 103, octet 4 = 255. Broadcast: <code>10.10.103.255</code>.</p>`],
  ["Range and hosts", `<p>Usable <code>10.10.100.1</code> to <code>10.10.103.254</code>. 10 host bits → 1,024 − 2 = <b>1,022</b>. And the address 10.10.100.1 is the very first usable host: a typical gateway address.</p>`],
])}
${K.out(`              decimal   binary (octet 3)
address          100    0110 0100
mask             252    1111 1100
AND (network)    100    0110 0100    -> 10.10.100.0
broadcast        103    0110 0111    -> 10.10.103.255`, "The last two bits of octet 3 are host bits, along with all of octet 4. 100 already has 00 there, so it is the start of a block.")}
<p>This subnet spans <b>four</b> values of octet 3, 100 to 103, so <code>10.10.101.255</code> and <code>10.10.102.0</code> are ordinary hosts in it, though they &ldquo;look&rdquo; like a broadcast and a network.</p>
<h3>Worked example: 10.70.4.9/11 (interesting octet 2)</h3>
${K.steps([
  ["Interesting octet, mask, block", `<p>/11 lies between /9 and /16: <b>octet 2</b>, 3 bits in → mask value <b>224</b> (<code>255.224.0.0</code>). Block = <b>32</b>. Octet 1 is copied: <code>10</code>. Octets 3 and 4 are all host bits.</p>`],
  ["Multiple at or below 70", `<p>0, 32, <b>64</b>, (96 is too big). Network: <code>10.64.0.0</code>.</p>`],
  ["Broadcast", `<p>Next block 96 → octet 2 = 95; octets 3 and 4 = 255. Broadcast: <code>10.95.255.255</code>.</p>`],
  ["Range and hosts", `<p>Usable <code>10.64.0.1</code> to <code>10.95.255.254</code>. 21 host bits → 2^21 − 2 = <b>2,097,150</b> hosts. You'll rarely build one this big, but /11 and /12 appear in summary routes and exam questions.</p>`],
])}
${K.out(`              decimal   binary (octet 2)
address           70    0100 0110
mask             224    1110 0000
AND (network)     64    0100 0000    -> 10.64.0.0
broadcast         95    0101 1111    -> 10.95.255.255`, "Same pattern as the /27 example, one octet further left: block 32, address 70 falls in the 64–95 block.")}
<p>Put the three side by side and the pattern is the same each time: <b>copy · calculate one octet · fill with 0s or 255s</b>. Only the position changes.</p>
${K.svg("0 0 720 470",
  K.box(250,8,220,40,"Address + prefix","e.g. 172.16.45.200/20",true)+K.arrow(360,48,360,70)+
  K.box(160,72,400,44,"Is the prefix /8, /16, /24 or /32?","the mask is only 255s and 0s")+
  K.arrow(560,94,590,94,"yes")+K.box(592,66,124,56,"Octet edge","copy, then 0 / 255")+
  K.arrow(360,116,360,140,"no")+
  K.box(160,142,400,44,"1. Interesting octet = where the prefix ends","/9–/16 → 2nd · /17–/24 → 3rd · /25–/32 → 4th")+K.arrow(360,186,360,208)+
  K.box(160,210,400,44,"2. Block = 256 − mask value in that octet","224 → 32 · 240 → 16 · 252 → 4")+K.arrow(360,254,360,276)+
  K.box(160,278,400,44,"3. Network = biggest multiple of block ≤ octet","octets to the left: copy · to the right: 0")+K.arrow(360,322,360,344)+
  K.box(160,346,400,44,"4. Broadcast = network octet + block − 1","octets to the right: 255")+K.arrow(360,390,360,412)+
  K.box(160,414,400,44,"5. Usable = network + 1 to broadcast − 1","hosts = 2^(32 − prefix) − 2",true)+
  `<rect x="8" y="278" width="140" height="112" rx="7" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.4"/>`+
  K.txt(78,298,"Check yourself",{c:"ok",mid:true,s:11.5,f:"display",b:true})+
  K.txt(18,320,"network ÷ block",{c:"fg",s:10})+K.txt(18,334,"= a whole number?",{c:"fg",s:10})+
  K.txt(18,354,"broadcast + 1 =",{c:"fg",s:10})+K.txt(18,368,"next block start?",{c:"fg",s:10})+
  K.txt(18,384,"address in between?",{c:"fg",s:10}),
  "The interesting-octet flowchart. Steps 1–5 are the same for every class and every prefix; only the octet you work in moves.")}
${K.q({type:"fill", q:"For 10.130.77.5/12, find the network and broadcast addresses.", fields:[{label:"Network", a:["10.128.0.0"]},{label:"Broadcast", a:["10.143.255.255"]}], why:"/12 → octet 2, 4 bits in → mask value 240 (255.240.0.0), block 16. Multiples of 16: …, 112, 128, 144. 130 falls in the block starting at 128. Network 10.128.0.0; next block 144, so the broadcast is 10.143.255.255."})}
<h3>Now drill it until it's automatic</h3>
<p>Prefixes from /16 to /30 across all classes, so the interesting octet keeps moving. Say the steps in your head: <i>octet, block, multiple, next minus one</i>. Wrong answers show the full working.</p>
${K.drill({title:"the magic number, any octet, any class", types:["subnet"], count:10})}
${K.check({q:"What is the broadcast address of the subnet containing 172.18.93.14/19?", o:["172.18.95.255","172.18.93.255","172.18.127.255","172.18.95.0"], a:0, why:"/19 → octet 3, mask value 224, block 32. Multiples: 0, 32, 64, 96. 93 falls in the 64 block, so the network is 172.18.64.0. Next block 96 → broadcast 172.18.95.255 (octet 4 = 255)."})}

<h2>Exam traps and the three question shapes</h2>
<p>Exam writers build wrong answers from the mistakes people make under pressure. Here are the traps, each with an example.</p>
<h3>Trap 1: the address <i>is</i> the network or the broadcast</h3>
<p>&ldquo;Which is a valid host?&rdquo; with <code>172.16.48.0/20</code> as an option. Block 16 in octet 3: 48 is a multiple of 16 and octet 4 is 0, so that's the ${K.g("network address","The first address of a subnet: all host bits 0. It names the subnet and can't be given to a host.")} of 172.16.48.0/20. Likewise <code>10.10.103.255/22</code> is the broadcast of 10.10.100.0/22. IOS refuses either on an interface: <code>% Bad mask /22 for address 10.10.103.255</code>.</p>
<h3>Trap 2: it ends in .0 or .255, so it &ldquo;must&rdquo; be invalid</h3>
<p>The reverse trap catches more people. In 10.10.100.0/22, <code>10.10.101.255</code> and <code>10.10.102.0</code> are valid hosts. An address is the network or broadcast only when <i>all</i> its host bits are 0 or all 1, and with a /22 the host bits include the last two bits of octet 3, not only octet 4.</p>
<h3>Trap 3: a &ldquo;subnet&rdquo; that isn't on a boundary</h3>
<p>A design says &ldquo;10.44.18.0/22&rdquo;. Block 4 in octet 3: 18 isn't a multiple of 4, so no such subnet exists. 10.44.18.0 with that mask belongs to <code>10.44.16.0/22</code> (16–19). Test: <b>the network octet must divide exactly by the block size.</b></p>
<h3>Trap 4: a range that crosses a boundary</h3>
<p>&ldquo;Give the cameras 192.168.77.150 to .170 in the /27.&rdquo; The /27 blocks run 128–159 and 160–191, so the range crosses into another subnet, with a broadcast (.159) and a network (.160) in the middle. A range must sit between one block's network and broadcast.</p>
<h3>Trap 5: the special prefixes /31 and /32</h3>
<ul>
<li><b>/31</b> (255.255.255.254, block 2): two addresses. Under ${K.g("RFC 3021","The 2000 standard that allows /31 masks on point-to-point links: both addresses are usable, with no network or broadcast address.")}, a link between two routers can use both, such as 10.0.0.4/31 and 10.0.0.5/31: there's no one else to broadcast to. IOS accepts it; on an Ethernet interface it first warns <code>% Warning: use /31 mask on non point-to-point interface cautiously</code>, then applies the address.</li>
<li><b>/32</b> (255.255.255.255): one address, a ${K.g("host route","A route or address with a /32 mask: exactly one IP address. Used for loopback interfaces and routes to one device.")}. You'll see it on loopbacks and as the <code>L</code> (local) entry for every interface address in a routing table.</li>
</ul>
${K.exam(`When a question says &ldquo;usable hosts&rdquo;, use 2^h − 2 unless the question is clearly about a /31 point-to-point link. For &ldquo;valid host address&rdquo; questions, work out the subnet of the <i>given prefix</i> before judging any option: a .0 or .255 is a trap in both directions. Read whether it says <b>choose two</b>: multi-answer subnetting questions often have exactly one network-address and one broadcast-address decoy.`)}
${K.dyk(`Before RFC 3021, every point-to-point link used a /30: four addresses for two routers, half of them wasted. A provider with 10,000 router links spent 40,000 addresses where /31s need 20,000 — and IPv4 addresses are now bought and sold at a real price.`)}
<h3>The three question shapes, solved fast</h3>
<p>Nearly every subnetting question is one of these. All three start the same way: <b>find the block the given address lives in.</b></p>
<div class="tablewrap"><table>
<tr><th>The question asks</th><th>What you actually do</th><th>Example (172.16.45.200/20)</th></tr>
<tr><td>&ldquo;Which subnet does this host belong to?&rdquo;</td><td>Find the network address. Done.</td><td>172.16.32.0/20</td></tr>
<tr><td>&ldquo;Is this a valid host address?&rdquo;</td><td>Find network and broadcast; the address must be strictly between them.</td><td>172.16.47.255 → no (broadcast) · 172.16.40.0 → yes</td></tr>
<tr><td>&ldquo;Which addresses are in the same subnet as X?&rdquo;</td><td>Find X's block once. Each option: same copied octets, interesting octet inside the block, and not the network or broadcast.</td><td>Block is 32–47 in octet 3: 172.16.39.255 yes, 172.16.48.1 no</td></tr>
</table></div>
<p>For the third shape, work out the block <b>once</b>, then scan the options.</p>
${K.q({type:"multi", q:"Which three addresses could be given to hosts in the same subnet as 172.16.45.200/20?", o:["172.16.32.0","172.16.39.255","172.16.47.255","172.16.48.1","172.16.40.0","172.16.46.17"], a:[1,4,5], why:"The subnet is 172.16.32.0/20: network 172.16.32.0, broadcast 172.16.47.255. 172.16.39.255, 172.16.40.0 and 172.16.46.17 are all strictly between them. 172.16.32.0 is the network, 172.16.47.255 the broadcast, and 172.16.48.1 is in the next block (48–63)."})}
<p>Two more drills: do two hosts share a subnet, and where is the Nth subnet of a split /24? (Subnet N starts at (N − 1) × block.)</p>
${K.drill({title:"same subnet or not?", types:["samesub"], count:6})}
${K.drill({title:"the Nth subnet", types:["nth"], count:6})}
${K.myth([
  ["Fast subnetting means memorising every subnet of every network.","You memorise eight mask values and a few powers of two. The rest is one subtraction and one multiple."],
  ["An address ending in .0 or .255 can never be given to a host.","Only when the boundary is in octet 4 (or a /24). In 10.10.100.0/22, 10.10.101.255 is an ordinary host."],
  ["You can read the subnet off the router's address, because it's always the first one.","A router can use any usable address. 10.20.37.1/21 is in 10.20.32.0/21."],
  ["Class B addresses always subnet in octet 3.","The prefix decides. 172.16.5.70/27 works in octet 4."],
])}
${K.check({q:"Which of these is a valid host address in its subnet?", o:["10.1.4.0/23","10.1.5.0/23","10.1.5.255/23","172.31.63.255/21"], a:1, why:"/23 → block 2 in octet 3: 4 and 5 form one block, 10.1.4.0 to 10.1.5.255. So 10.1.4.0 is the network, 10.1.5.255 the broadcast, and 10.1.5.0 is a host in the middle. 172.31.63.255/21 is block 8: 56–63, so it's that subnet's broadcast."})}

<h2>Exam speed, then a real router</h2>
<p>Accuracy first, then speed. Once the drills come out right every time, time yourself. The target is <b>under 30 seconds</b> per subnetting question, leaving the rest of the minute for the scenario: about 5 seconds for octet and block from the cheat sheet, 10 for the multiple, 10 to write network and broadcast, and 5 to check.</p>
${K.when([
  ["Magic number","Exam questions, meetings, change windows","One octet of arithmetic, done in your head","You're unsure which octet is interesting — use binary for that one"],
  ["Binary AND (lesson 3)","Proving or explaining an answer","Shows exactly why","Under time pressure: 32 bits is slow"],
  ["Listing the subnets (lesson 4)","Allocating many subnets, finding the Nth or the next free one","Shows the layout and the gaps","You need one answer for one address"],
  [`Calculator or ${K.g("IPAM","IP address management: a tool or disciplined register that records which blocks are allocated, not only which addresses are in use.")} tool`,"Documenting real plans with hundreds of subnets","No slips at scale","The exam (not allowed), or input you haven't checked"],
], "Which subnetting method, and when")}
<h3>Timed set: six questions, three minutes</h3>
<p>Write the cheat sheet (time that too), then start a timer. Write answers before opening the hint.</p>
<ol>
<li>192.168.10.77/28: network, broadcast, usable range.</li>
<li>172.20.130.9/18: network, broadcast, usable range.</li>
<li>10.200.33.33/13: network and broadcast.</li>
<li>Is 172.31.63.255/21 a valid host address?</li>
<li>Is 10.1.5.0/23 a valid host address?</li>
<li>Which of these can be a host in the same subnet as 192.168.200.100/26: .63, .70, .126, .127, .128?</li>
</ol>
${K.hint(`Blocks: /28 → 16 in octet 4; /18 → 64 in octet 3; /13 → 8 in octet 2; /21 → 8 in octet 3; /23 → 2 in octet 3; /26 → 64 in octet 4. For 3, divide 200 by 8. For 6, find the block of 100 once, then scan.`)}
${K.reveal("Show the answers and timings",`<ol>
<li><b>192.168.10.64/28</b>, broadcast 192.168.10.79, usable .65–.78. Block 16: 0, 16, 32, 48, 64, (80). 77 is in 64–79.</li>
<li><b>172.20.128.0/18</b>, broadcast 172.20.191.255, usable 172.20.128.1–172.20.191.254. Block 64 in octet 3: 0, 64, 128, (192).</li>
<li><b>10.200.0.0/13</b>, broadcast 10.207.255.255. Block 8 in octet 2: 200 ÷ 8 = 25 exactly, so 200 is a block start; next block 208.</li>
<li><b>No.</b> Block 8 in octet 3: 63 is in 56–63, so the subnet is 172.31.56.0/21 and 172.31.63.255 is its broadcast.</li>
<li><b>Yes.</b> Block 2 in octet 3: 4–5. The subnet is 10.1.4.0/23 (broadcast 10.1.5.255), and 10.1.5.0 sits in the middle.</li>
<li><b>.70 and .126.</b> Block 64: 100 is in 64–127. .63 is in the previous block, .127 is the broadcast, .128 starts the next block.</li>
</ol><p>Three minutes is exam pace. Over five? Repeat the drills tomorrow, then this set. Speed comes from short sessions over several days.</p>`)}
${K.tip(`Say the multiples of 32 and 64 out loud until they're a chant, and divide for blocks of 2, 4 and 8. Most slow answers come from counting up from zero in 4s.`)}
${K.mistake(`Rounding <b>up</b> to the nearest multiple instead of down. For 130/27, 160 is the nearest multiple of 32, but the network is the multiple <i>at or below</i> the address: 128. If your &ldquo;network&rdquo; is bigger than the address, it's wrong.`)}
${K.check({q:"You have 30 seconds: what is the last usable address in the subnet of 10.37.200.1/12?", o:["10.47.255.254","10.47.255.255","10.37.255.254","10.39.255.254"], a:0, why:"/12 → octet 2, mask value 240, block 16. 37 falls in 32–47, so the network is 10.32.0.0 and the broadcast 10.47.255.255. Last usable is one less: 10.47.255.254."})}
<h3>Reading a real router: connected subnets</h3>
<p>On the job you get a router, not a typed question. Start with <code>show ip interface brief</code>:</p>
${K.out(`ABJ-BR-RTR#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.20.37.1      YES manual up                    up
GigabitEthernet0/1     172.16.200.162  YES manual up                    up
GigabitEthernet0/2     unassigned      YES unset  administratively down down`, "show ip interface brief: address and state, but no mask.")}
<p>Column by column: interface, address, <code>OK?</code> and <code>Method</code> (manual), then <code>Status</code> (Layer 1) and <code>Protocol</code> (Layer 2), both <code>up</code> when it works. The <b>mask</b> is missing, so 10.20.37.1 could be in 10.20.37.0/24, 10.20.32.0/21 or 10.0.0.0/8. Get it from <code>show running-config</code> (the <code>ip address</code> lines) or <code>show interfaces</code> (<code>Internet address is 10.20.37.1/21</code>). The routing table then shows what the router calculated:</p>
${K.out(`ABJ-BR-RTR#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       O - OSPF, IA - OSPF inter area, * - candidate default

Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.20.32.0/21 is directly connected, GigabitEthernet0/0
L        10.20.37.1/32 is directly connected, GigabitEthernet0/0
      172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks
C        172.16.200.160/30 is directly connected, GigabitEthernet0/1
L        172.16.200.162/32 is directly connected, GigabitEthernet0/1`, "show ip route on the same router. Each working interface adds a C line (its subnet) and an L line (its own address as a /32).")}
<ul>
<li><b>C</b> lines are ${K.g("connected routes","Subnets the router has an interface in. IOS adds them automatically when an interface with an IP address is up/up.")}: each interface address AND-ed with its mask. <code>10.20.32.0/21</code> is what the magic number gives for 10.20.37.1/21: block 8, 37 falls in 32–39.</li>
<li><b>L</b> lines are the router's own addresses as /32 host routes.</li>
<li>The indented headers group routes by classful network: 10.0.0.0/8 holds a /21 and a /32.</li>
</ul>
<p>Now do it yourself: work out each subnet <b>on paper first</b>, let the router confirm it, then address a new interface and watch IOS refuse an overlap.</p>
${K.hint(`Gi0/0 is 10.20.37.1 255.255.248.0 (/21): block 8 in octet 3. Gi0/1 is 172.16.200.162 255.255.255.252 (/30): block 4 in octet 4. For the CCTV subnet 192.168.77.96/27, the next block starts at 128. For the loopback, ask whether 38 falls inside Gi0/0's block — and whether 40 does.`)}
${K.term({env:"ios2", title:"work out ABJ-BR-RTR's connected subnets, then address it", opts:{kind:"router", host:"ABJ-BR-RTR", model:"C1111-4P",
  motd:"ABJ-BR-RTR — Abuja branch router, console session. Gi0/0 = staff LAN, Gi0/1 = WAN to HQ, Gi0/2 = spare (planned: CCTV)."},
  setup:e=>{ ["enable","configure terminal","interface g0/0","description LAN-STAFF","ip address 10.20.37.1 255.255.248.0","no shutdown","interface g0/1","description WAN-to-HQ","ip address 172.16.200.162 255.255.255.252","no shutdown","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.log.length=0; e.mode="user"; },
  intro:"A branch router with two interfaces already addressed. Read it, calculate, then configure. Every answer can be checked against the router's own output.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip interface brief</code>. Note the addresses — and that there is no mask column", done:e=>e.log.some(l=>/IP-Address\s+OK\?/.test(l.out))},
    {text:"Find the masks: <code>show running-config | section interface</code> (or <code>show interfaces g0/0</code>)", done:e=>e.log.some(l=>/ip address 10\.20\.37\.1 255\.255\.248\.0|Internet address is 10\.20\.37\.1\/21/.test(l.out))},
    {text:"On paper, work out the subnet of Gi0/0 and of Gi0/1. Then <code>show ip route</code> (or <code>show ip route connected</code>) and compare your answers with the C lines", done:e=>e.log.some(l=>/10\.20\.32\.0\/21 is directly connected/.test(l.out))},
    {text:"HQ's end of the WAN link is the <i>other</i> usable address in Gi0/1's /30. Work it out and ping it", done:e=>e.log.some(l=>/^\s*ping\s+172\.16\.200\.161\s*$/.test(l.cmd) && /Success rate is 100/.test(l.out))},
    {text:"A colleague suggests <code>10.20.38.1 255.255.255.0</code> for a management loopback. Try it on <code>interface loopback 0</code> and read the error: why does IOS refuse?", done:e=>e.log.some(l=>/overlaps with GigabitEthernet0\/0/.test(l.out))},
    {text:"The plan gives CCTV the subnet <code>192.168.77.96/27</code>. Give Gi0/2 the <b>last</b> usable address in it, with the right mask, and bring the interface up", done:e=>{ const i = e.intfs["GigabitEthernet0/2"]; return i.ip==="192.168.77.126" && i.mask==="255.255.255.224" && !i.shut; }},
    {text:"Give Loopback0 the management address <code>10.20.40.1</code> as a /32 instead (why is 40 safe when 38 wasn't?)", done:e=>{ const i = e.intfs["Loopback0"]; return !!i && i.ip==="10.20.40.1" && i.mask==="255.255.255.255"; }},
    {text:"Back in privileged EXEC, verify with <code>show ip interface brief</code>, then save with <code>copy running-config startup-config</code>", done:e=>e.savedOnce && e.log.some(l=>/192\.168\.77\.126/.test(l.out) && /IP-Address/.test(l.out))},
  ],
  win:"You read the subnets off a live router before it told you, found the far end of a /30, watched IOS reject an overlapping address because 10.20.38.x sits inside 10.20.32.0/21, and placed new addresses that fit their subnets exactly.",
  solve:["enable","show ip interface brief","show running-config | section interface","show ip route","ping 172.16.200.161","configure terminal","interface loopback 0","ip address 10.20.38.1 255.255.255.0","interface g0/2","ip address 192.168.77.126 255.255.255.224","no shutdown","interface loopback 0","ip address 10.20.40.1 255.255.255.255","end","show ip interface brief","copy running-config startup-config",""]})}
<p>The overlap error is the magic number inside IOS. Gi0/0's /21 owns 10.20.32.0 to 10.20.39.255, so no other interface can claim 10.20.38.0/24; 40 starts the next block. Gi0/2's last usable is .126 because the /27 starting at 96 ends at 127, the broadcast.</p>
${K.dodont([
  "Write the cheat sheet in the first minute of the exam.",
  "Check every answer: network divisible by the block, broadcast + 1 = next block.",
  "Get the mask before judging any address.",
  "Sanity-check a change plan's addresses before the window, not while typing them.",
],[
  "Don't pick the interesting octet from the address class.",
  "Don't reject a .0 or .255 until you know the prefix.",
  "Don't spend three minutes on one question; the next is worth the same.",
  "Don't type a plan's addresses into a router at 2 a.m. unchecked.",
])}

${K.job("02:10, change window: sanity-check the addressing plan before you type it",`
<p><b>The change.</b> CHG-4471, a bank's Lagos data centre, window 01:00–04:00. You're implementing two new subnets and a WAN link on router DC-AGG-R2. The design team wrote the plan last week; the change board approved it. It says:</p>
${K.out(`CHG-4471  DC-AGG-R2  addressing
Gi0/0   POS terminals    10.44.16.0/23      gw 10.44.17.254
Gi0/2   CCTV             10.44.18.0/22      gw 10.44.18.1
Gi0/1   WAN to DR site   172.16.200.164/30  local .164   DR .165
Lo0     Management       10.255.0.7/32`, "The plan as written. Four lines, about two minutes of mental checking.")}
<p><b>The questions you ask, line by line.</b> Is the subnet on its block boundary? Is the interface address usable (not the network, not the broadcast)? Does it overlap another line, or anything already on the router?</p>
<ul>
<li><b>${K.g("POS terminals","Point of sale: the card terminals and tills where customers pay.")}, 10.44.16.0/23.</b> Block 2 in octet 3; 16 is even, so it's a boundary. Range 10.44.16.0–10.44.17.255; gateway 10.44.17.254 is the last usable. ✓</li>
<li><b>CCTV, 10.44.18.0/22.</b> Block 4 in octet 3; 18 ÷ 4 = 4.5: not a boundary. The real subnet is 10.44.16.0/22 (16–19), which contains the POS /23. IOS would refuse it as an overlap, mid-window. ✗</li>
<li><b>WAN, 172.16.200.164/30.</b> Block 4; 164 ÷ 4 = 41, so .164 is the <b>network</b> address of 164–167. IOS would answer <code>% Bad mask /30 for address 172.16.200.164</code>. Usable: .165 and .166. ✗</li>
<li><b>Lo0, 10.255.0.7/32.</b> One address, nowhere near 10.44.x. ✓</li>
</ul>
<p><b>Checks with real commands.</b> Before suggesting any fix, see what is already in use:</p>
${K.out(`DC-AGG-R2#show ip route | include 10.44
S        10.44.20.0/22 [1/0] via 10.44.0.6
C        10.44.0.4/30 is directly connected, GigabitEthernet0/3
L        10.44.0.5/32 is directly connected, GigabitEthernet0/3`, "10.44.20.0/22 is already routed elsewhere (the ATM network), so &ldquo;move CCTV up one block&rdquo; would overlap too.")}
<p>The obvious CCTV fix, 10.44.20.0/22, is taken. And picking a new subnet isn't a 2 a.m. decision: firewall rules and the CCTV recorder are built around it.</p>
<p><b>The fix.</b> You call the on-call change manager onto the bridge. The ${K.g("DR","Disaster recovery: the bank's standby data centre, ready to take over if this one fails. The new WAN link connects the two.")} engineer hasn't configured their side yet, so you agree .165 (yours) and .166 (DR), a correction within the approved intent, recorded on the change. CCTV is <b>deferred</b> for design to pick a free /22. You implement POS, WAN and Lo0, then verify: <code>show ip interface brief</code> (up/up), <code>show ip route</code> (C lines for 10.44.16.0/23 and 172.16.200.164/30) and <code>ping 172.16.200.166</code>.</p>
<p><b>What you say on the bridge.</b> &ldquo;Two lines won't work as written. CCTV's 10.44.18.0/22 isn't a /22 boundary; it's really 10.44.16.0/22 and would swallow POS. The WAN .164 is the /30's network address; the usable pair is .165 and .166. I propose .165 here, .166 at DR, and we defer CCTV: 10.44.20.0/22 is already routed, so it isn't a one-line fix.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;CHG-4471 partial. Pre-check: (1) CCTV 10.44.18.0/22 not a /22 boundary (= 10.44.16.0/22, overlaps POS /23); 10.44.20.0/22 in use. CCTV deferred to design. (2) WAN .164 = network addr of the /30; now local .165 / DR .166, agreed on bridge 02:25. Implemented Gi0/0 10.44.17.254/23, Gi0/1 .165/30, Lo0 10.255.0.7/32. Verified up/up, C routes, ping DR 100%. Saved.&rdquo;</i></p>`)}

${K.case("The branch that borrowed half of Port Harcourt",`
<p>A logistics company gave its large Port Harcourt site <code>10.30.16.0/20</code> (10.30.16.0–10.30.31.255) to allow for growth. For two years it used only 10.30.16.x to 10.30.19.x. When a Kano branch opened, a busy engineer saw &ldquo;${K.g("PH","Port Harcourt: the spreadsheet's short name for that site.")}: 10.30.16–19 in use&rdquo; in the spreadsheet and gave Kano <code>10.30.24.0/22</code>. Nothing broke, so nobody noticed.</p>
<p>A year later Port Harcourt opened a warehouse floor and extended its DHCP range into 10.30.25.x, inside its own /20. The new floor's scanners could print locally but couldn't reach the warehouse system at head office.</p>
<p>On the head-office router, <code>show ip route</code> had <code>10.30.16.0/20</code> towards Port Harcourt and <code>10.30.24.0/22</code> towards Kano. A reply to 10.30.25.40 matches both, and a router uses the more specific route, the longer prefix (you'll study that rule in the routing module). So replies went to Kano and vanished. The magic number shows the overlap in seconds: block 16 in octet 3, so the /20 runs 16 to 31, and 24 is inside it.</p>
<p>Kano, the smaller site, was renumbered to <code>10.30.32.0/22</code> (32 ÷ 4 = 8, outside the /20) in one evening, and the spreadsheet became an IPAM register. The write-up: <b>allocate and record whole blocks, not &ldquo;what's in use&rdquo;</b>; <b>check every new subnet against every existing block</b>; <b>an overlap that works today fails the day someone uses the rest of their block</b>.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Say each step out loud: interesting octet, mask value, block size, multiple, next block minus one, then range and hosts. Interviewers want to hear the method, not only the answer.`)}
${K.reveal("“What's the network and broadcast for 172.16.45.200/20? Talk me through it.”",`<p>"A /20 ends four bits into the third octet, so the mask is 255.255.240.0 and the block size is 256 minus 240, 16. The address has 45 in octet three; multiples of 16 go 0, 16, 32, 48, so 45 is in the block starting at 32. Network 172.16.32.0. The next block starts at 48, so the broadcast is 172.16.47.255, octet four all ones. Usable: 172.16.32.1 to 172.16.47.254, 2 to the 12 minus 2, 4,094 hosts. In binary, 45 is 0010 1101; AND-ed with 1111 0000 that's 0010 0000, 32."</p>`)}
${K.hint(`Don't answer from the .255. Work out the subnet first, then say where the address sits in it.`)}
${K.reveal("“Is 10.10.101.255/22 a valid host address?”",`<p>"Yes. A /22 has block 4 in the third octet, and 101 is in the block 100 to 103, so the subnet is 10.10.100.0/22 with broadcast 10.10.103.255. 10.10.101.255 sits in the middle: its host bits include the last two bits of octet three, which are 01, so they aren't all ones. A .255 only means broadcast when the boundary is in the fourth octet, a /24 or longer."</p>`)}
${K.hint(`Test the boundary: the network octet must divide exactly by the block size.`)}
${K.reveal("“A colleague wants to use 192.168.5.0/23 for a new VLAN. Any problem?”",`<p>"Yes. A /23 has block 2 in the third octet, so /23 networks start on even numbers: 192.168.4.0/23 covers 4 and 5. 192.168.5.0 is the middle of that subnet, so 192.168.5.0/23 doesn't exist. An interface set to 192.168.5.1 255.255.254.0 would be accepted, but its connected route would be 192.168.4.0/23, overlapping anything already using 192.168.4.x. I'd ask whether they meant 192.168.4.0/23, or 192.168.6.0/23 if that's taken, and check the routing table first."</p>`)}

${K.recap([
  "Only one octet needs thought: the interesting octet, where the mask is neither 255 nor 0. The prefix picks it (/9–/16 → 2, /17–/24 → 3, /25–/32 → 4), never the class.",
  "Block size = 256 − the mask value in that octet. Subnets start at multiples of the block.",
  "Network: the biggest multiple at or below the address octet; octets to the left copied, to the right 0.",
  "Broadcast: next block − 1, with 255s to the right. Usable: network + 1 to broadcast − 1; hosts 2^(32 − prefix) − 2.",
  "The cheat sheet: place values 128…1 are the block sizes; mask values 128, 192, 224, 240, 248, 252, 254, 255 are their running total.",
  "Traps: the network or broadcast offered as a host; .0 or .255 that is a valid host when the boundary isn't in octet 4; a &ldquo;subnet&rdquo; whose network octet doesn't divide by the block; a range crossing a boundary.",
  "/31 gives two usable addresses on point-to-point links (RFC 3021); /32 is a single address for loopbacks and host routes.",
  "show ip interface brief has no mask: get it from the running-config or show interfaces, then check against the C lines in show ip route.",
])}
${K.next(`<b>Lesson 6 — ${K.g("VLSM","Variable-Length Subnet Masking: different prefix lengths for different subnets inside one block, so each is sized to its need.")}: designing a real addressing plan.</b> You can now carve and check any subnet in seconds. Next you'll use different prefix sizes inside one network: big blocks for big LANs, /30s and /31s for links. You'll allocate them in an order that leaves no overlaps and no wasted gaps, and get a first look at summarising them into one route.`)}
`,
quiz:[
  {lvl:1, q:"For a /27 prefix, what is the block size (magic number) in the interesting octet?", o:["16","32","27","224"], a:1, why:"/27 ends 3 bits into octet 4, so the mask value there is 224. Block size = 256 − 224 = 32: subnets start at 0, 32, 64, 96 and so on."},
  {lvl:1, type:"match", q:"Match each prefix with its dotted-decimal mask.", pairs:[["/19","255.255.224.0"],["/22","255.255.252.0"],["/26","255.255.255.192"],["/13","255.248.0.0"],["/29","255.255.255.248"]], why:"Count where the prefix ends: /19 is 3 bits into octet 3 (224); /22 is 6 bits into octet 3 (252); /26 is 2 bits into octet 4 (192); /13 is 5 bits into octet 2 (248); /29 is 5 bits into octet 4 (248)."},
  {lvl:1, type:"order", q:"Put the magic-number method in the correct order.", items:["Find the interesting octet from the prefix","Subtract that octet's mask value from 256 to get the block size","Find the biggest multiple of the block size at or below the address's value in that octet","Write the network address: octets to the left copied, octets to the right 0","Add the block size and subtract 1 for the broadcast, with 255 in the octets to the right"], why:"Octet, block, multiple, network, broadcast. The usable range is then network + 1 to broadcast − 1."},
  {lvl:2, type:"fill", q:"Host 172.18.93.14 has the prefix /19. Give the network and broadcast addresses of its subnet.", fields:[{label:"Network", a:["172.18.64.0"]},{label:"Broadcast", a:["172.18.95.255"]}], why:"/19 → octet 3, mask value 224, block 32. Multiples: 0, 32, 64, 96. 93 is in the 64 block. Network 172.18.64.0; next block 96, so the broadcast is 172.18.95.255."},
  {lvl:2, q:"Which subnet does host 10.141.200.7/10 belong to?", o:["10.128.0.0/10","10.140.0.0/10","10.141.0.0/10","10.64.0.0/10"], a:0, why:"/10 ends 2 bits into octet 2: mask 255.192.0.0, block 64. Multiples: 0, 64, 128, 192. 141 is in the block starting at 128, so the subnet is 10.128.0.0/10 (broadcast 10.191.255.255)."},
  {lvl:2, type:"multi", q:"Which two are valid host addresses in the subnet 10.10.100.0/22? (Choose two.)", o:["10.10.100.0","10.10.101.255","10.10.103.255","10.10.104.1","10.10.102.0"], a:[1,4], why:"10.10.100.0/22 has block 4 in octet 3: it runs from 10.10.100.0 (network) to 10.10.103.255 (broadcast). 10.10.101.255 and 10.10.102.0 are in the middle, so they are hosts. 10.10.104.1 is in the next subnet."},
  {lvl:2, q:"A new PC must be in the same subnet as R1's Gi0/1 and use R1 as its default gateway. Which address can it be given?", ex:"R1#show running-config interface GigabitEthernet0/1\nBuilding configuration...\n\nCurrent configuration : 98 bytes\n!\ninterface GigabitEthernet0/1\n description LAN-FINANCE\n ip address 192.168.77.130 255.255.255.224\nend", o:["192.168.77.159","192.168.77.160","192.168.77.158","192.168.77.127"], a:2, why:"255.255.255.224 is /27, block 32. 130 is in 128–159, so the subnet is 192.168.77.128/27 with broadcast .159. Usable: .129–.158, so .158 works. .159 is the broadcast, .160 starts the next subnet, and .127 is the broadcast of the previous one."},
  {lvl:2, q:"Based on the exhibit, a user's laptop has the address 172.16.47.20. Which of R2's interfaces is in the laptop's subnet?", ex:"R2#show ip route connected\n      172.16.0.0/16 is variably subnetted, 6 subnets, 4 masks\nC        172.16.32.0/20 is directly connected, GigabitEthernet0/0\nL        172.16.32.1/32 is directly connected, GigabitEthernet0/0\nC        172.16.48.0/22 is directly connected, GigabitEthernet0/1\nL        172.16.48.1/32 is directly connected, GigabitEthernet0/1\nC        172.16.52.0/30 is directly connected, GigabitEthernet0/2\nL        172.16.52.1/32 is directly connected, GigabitEthernet0/2", o:["GigabitEthernet0/0","GigabitEthernet0/1","GigabitEthernet0/2","None of them"], a:0, why:"172.16.32.0/20 has block 16 in octet 3, so it covers 32 to 47 and includes 172.16.47.20. 172.16.48.0/22 starts at 48, one block too far. Being close to 48 is the trap; 47 is still inside the /20."},
  {lvl:3, q:"The plan says VLAN 220 uses 10.44.18.0/22. You get the error in the exhibit. What is the cause, and which change keeps a /22 without overlapping Gi0/1?", ex:"BR1#show running-config interface GigabitEthernet0/1\ninterface GigabitEthernet0/1\n description POS\n ip address 10.44.17.254 255.255.254.0\nend\nBR1#configure terminal\nBR1(config)#interface GigabitEthernet0/2\nBR1(config-if)#ip address 10.44.18.1 255.255.252.0\n% 10.44.16.0 overlaps with GigabitEthernet0/1", o:["/22 blocks start at multiples of 4 in octet 3, so 10.44.18.1/22 is in 10.44.16.0/22, which contains Gi0/1's 10.44.16.0/23; use 10.44.20.1 255.255.252.0 if that block is free","A router can't have two interfaces in the 10.44.0.0 network; move VLAN 220 to 172.16.0.0","10.44.18.1 is the broadcast address of the /22; use 10.44.18.2 instead","Use 10.44.18.1 255.255.254.0, which keeps the /22 size"], a:0, why:"Block 4 in octet 3: 18 is in 16–19, so the new address lands in 10.44.16.0/22, which overlaps Gi0/1's 10.44.16.0/23 (16–17). 10.44.20.0/22 is the next /22 boundary (20 ÷ 4 = 5). 255.255.254.0 would avoid the overlap but makes it a /23, not a /22. Before using 10.44.20.0/22, check the routing table that nothing else already uses it."},
  {lvl:3, q:"You are checking this addressing plan before a change window. Which line is wrong?", ex:"VLAN 30  VOICE   10.8.64.0/26     gateway 10.8.64.62\nVLAN 40  PRINT   10.8.64.64/27    gateway 10.8.64.65\nVLAN 50  GUEST   10.8.64.96/26    gateway 10.8.64.97\nWAN      ISP     10.8.64.192/30   local 10.8.64.193  peer 10.8.64.194", o:["VLAN 30: the gateway .62 is the broadcast address","VLAN 40: 10.8.64.64/27 overlaps the voice subnet","VLAN 50: 10.8.64.96 isn't a /26 boundary; the real subnet 10.8.64.64/26 overlaps VLAN 40","WAN: the peer .194 is the broadcast address"], a:2, why:"/26 has block 64, so /26 subnets start at 0, 64, 128, 192. 96 isn't one of them: 10.8.64.96 falls in 10.8.64.64/26 (64–127), which overlaps VLAN 40's 64–95. VOICE is 0–63 with broadcast .63, so .62 is fine; PRINT is 64–95; the WAN /30 is 192–195, so .193 and .194 are both usable."},
  {lvl:2, type:"fill", q:"What is the last usable host address in the subnet of 10.37.200.1/12?", fields:[{label:"Last usable", a:["10.47.255.254"]}], why:"/12 → octet 2, mask value 240, block 16. 37 is in 32–47: network 10.32.0.0, broadcast 10.47.255.255. Last usable is the broadcast minus 1: 10.47.255.254."},
  {lvl:2, type:"multi", q:"Which two of these are real subnet (network) addresses for the prefix shown? (Choose two.)", o:["172.16.48.0/20","10.10.102.0/22","192.168.5.0/23","10.96.0.0/11","192.168.77.144/27"], a:[0,3], why:"A network address's interesting octet must divide by the block, with 0s after it. /20 block 16: 48 ÷ 16 = 3 ✓. /22 block 4: 102 ÷ 4 = 25.5 ✗. /23 block 2: 5 is odd ✗. /11 block 32 in octet 2: 96 ÷ 32 = 3 ✓. /27 block 32: 144 ÷ 32 = 4.5 ✗."},
  {lvl:2, q:"An engineer configures 10.0.0.4/31 on one end of a router-to-router Ethernet link. What address should the other end use?", o:["10.0.0.5/31","10.0.0.6/31","10.0.0.3/31","None: a /31 has no usable addresses"], a:0, why:"A /31 has block 2, so the pair is 10.0.0.4 and 10.0.0.5. RFC 3021 lets a point-to-point link use both, with no network or broadcast address. 10.0.0.6 and 10.0.0.3 are in other /31s."},
  {lvl:2, q:"A help-desk colleague says 172.16.46.255/20 can't be a valid host address because it ends in 255. Who is right?", o:["The address is valid: its subnet is 172.16.32.0/20, whose broadcast is 172.16.47.255","The colleague: any address ending in .255 is a broadcast","The address is the network address of 172.16.46.0/20","It is valid only if the mask is changed to /24"], a:0, why:"/20 has block 16 in octet 3: 46 is in 32–47. Network 172.16.32.0, broadcast 172.16.47.255. 172.16.46.255 sits in the middle. Its host bits include part of octet 3, and they aren't all ones."},
  {lvl:3, q:"In 192.168.77.0/24, the subnets 192.168.77.0/27, 192.168.77.32/27 and 192.168.77.64/26 are already in use. You need a new /27 for CCTV, as low in the range as possible. Which do you allocate?", o:["192.168.77.96/27","192.168.77.128/27","192.168.77.64/27","192.168.77.160/27"], a:1, why:"192.168.77.64/26 has block 64, so it covers 64 to 127. That includes .96, so 192.168.77.96/27 would overlap it. The first free /27 is 192.168.77.128/27 (.128–.159). .160/27 is also free but not the lowest."},
  {lvl:3, q:"A PC can ping other PCs on its floor but can't reach anything off its subnet. What is wrong?", ex:"C:\\>ipconfig\n\nEthernet adapter Ethernet:\n\n   IPv4 Address. . . . . . . . . . . : 192.168.77.140\n   Subnet Mask . . . . . . . . . . . : 255.255.255.224\n   Default Gateway . . . . . . . . . : 192.168.77.126", o:["The default gateway 192.168.77.126 is in 192.168.77.96/27, not the PC's subnet 192.168.77.128/27; the gateway must be between .129 and .158","192.168.77.140 is the broadcast address of its subnet","The mask should be 255.255.255.0 because it is a Class C address","The gateway is fine; the router must be down"], a:0, why:"/27, block 32: .140 is in 128–159. The gateway .126 is in 96–127, a different subnet, so the PC can't reach it on its own LAN. Local traffic works because it doesn't need the gateway. Set the gateway to the router's address in .129–.158."},
],
cards:[
  {f:"What is the interesting octet?", b:"The one octet where the mask is neither 255 nor 0. The prefix decides it: /9–/16 octet 2, /17–/24 octet 3, /25–/32 octet 4. /8, /16, /24 and /32 have none."},
  {f:"Magic number (block size)", b:"256 minus the mask value in the interesting octet. Subnets start at multiples of it. Example: mask .224 gives block 32."},
  {f:"The eight mask values", b:"128, 192, 224, 240, 248, 252, 254, 255: running totals of the place values 128, 64, 32, 16, 8, 4, 2, 1."},
  {f:"Network address, the fast way", b:"Biggest multiple of the block at or below the address's value in the interesting octet. Octets to the left copied, to the right 0."},
  {f:"Broadcast address, the fast way", b:"Next block start minus 1 in the interesting octet, with 255 in every octet to the right."},
  {f:"/20", b:"255.255.240.0. Block 16 in octet 3. 4,094 usable hosts. 172.16.45.200/20 is in 172.16.32.0 to 172.16.47.255."},
  {f:"/22", b:"255.255.252.0. Block 4 in octet 3. 1,022 usable hosts. Spans four values of octet 3, for example 100 to 103."},
  {f:"/27", b:"255.255.255.224. Block 32 in octet 4. 30 usable hosts. 192.168.77.130/27 is in .128 to .159."},
  {f:"Is it a valid host address?", b:"Find network and broadcast for the given prefix; the address must be strictly between them. .0 or .255 can be a valid host when the boundary is in octet 3 or 2."},
  {f:"Same subnet check", b:"Find the block of the first address once. Another address is in the same subnet if the copied octets match and its interesting octet falls inside that block."},
  {f:"Is this a real subnet address?", b:"Its interesting octet must divide exactly by the block size, with 0s to the right. 10.44.18.0/22 is not: 18 doesn't divide by 4."},
  {f:"/31 and /32", b:"/31: two addresses, both usable on a point-to-point link (RFC 3021). /32: a single address, used for loopbacks and host routes."},
  {f:"Exam speed target", b:"Under 30 seconds per subnetting question. Write the cheat sheet in the first minute. Check: network divisible by block, broadcast + 1 = next block."},
],
});
// ---------- Module 3 · Lesson 6 ----------
L.push({
id:"ip-vlsm", mins:75, level:"Intermediate · builds on lessons 1–5",
t:"VLSM: designing a real addressing plan (and a first look at summarisation)",
html:`
${K.goals([
  "Explain why one mask for every subnet wastes addresses — and sometimes cannot work at all.",
  "Design a VLSM plan from requirements: size each subnet, sort largest first, place each on a valid boundary, track the next free address.",
  "Check a plan for overlaps and misaligned subnets, leave room to grow, and document it in an IPAM-style table.",
  "Configure router interfaces from a VLSM plan and prove each connected pair can talk.",
  "Find the summary of contiguous subnets by counting common leading bits.",
])}
${K.pre(["Module 3 lessons 1–5: binary place values, prefix length and masks, the AND that finds the network, the hosts formula 2^h − 2, and the block-size (magic number) method. Module 1's first IOS session: console, modes, <code>interface</code>, <code>no shutdown</code>, saving."])}

<h2>Why this matters at work</h2>
<p>An MSP in Ikeja, Lagos, wins a contract: a logistics company is moving into a new head office and opening a branch in Apapa. The group's IT department hands over one block, <code>10.20.0.0/22</code>, and a list: 300 HQ users, 120 branch users, 50 servers, 60 IP phones, 14 management addresses for switches and access points, and three point-to-point WAN links. &ldquo;Everything must fit in that block. We're tight on space.&rdquo;</p>
<p>A junior engineer drafts one <code>/24</code> per network, as home routers taught everyone: eight /24s, 2,048 addresses, in a block of 1,024. A senior redraws it in twenty minutes — every requirement met, a fifth of the block free in one piece, the whole company reachable as one route. The difference is <b>${K.g("VLSM","Variable-Length Subnet Masking: using different prefix lengths for different subnets carved from the same block, so each subnet is sized to its own requirement.")}</b>: the design skill employers pay for.</p>

<h2>The problem with one size for everything</h2>
<p>In lesson 4 you split a network into <b>equal</b> pieces: every subnet got the same mask and size. That is ${K.g("FLSM","Fixed-Length Subnet Masking: every subnet carved from a block uses the same mask, so every subnet is the same size.")} — fixed-length subnet masking. Real networks are not equal: a user VLAN may need 300 addresses, a link between two routers exactly <b>two</b>. One mask cannot suit both.</p>
<h3>Waste: a /26 on a two-router link</h3>
<p>Pick <code>/26</code> for everything because voice and servers need about 60 hosts, and a ${K.g("point-to-point link","A link with exactly two devices on it, such as a WAN circuit or a cable between two routers. It needs only two usable addresses.")} between two routers gets a /26 too: 62 usable addresses, 2 used. The other 60 belong to that link's subnet for ever, and nothing else can use them.</p>
${K.svg("0 0 720 190",
  K.txt(20,24,"Fixed /26 on a 2-router WAN link: 64 addresses",{c:"fg",s:12,f:"display",b:true})+
  `<rect x="20" y="34" width="640" height="34" rx="4" fill="var(--panel2)" stroke="var(--line)" stroke-dasharray="4 3"/>`+
  `<rect x="20" y="34" width="10" height="34" fill="var(--muted)"/><rect x="30" y="34" width="20" height="34" fill="var(--accent)"/><rect x="650" y="34" width="10" height="34" fill="var(--muted)"/>`+
  K.txt(25,84,"network",{s:10,mid:true})+K.txt(40,98,"2 routers",{c:"accent",s:10,mid:true})+K.txt(655,84,"broadcast",{s:10,mid:true})+
  K.txt(350,56,"60 usable addresses that nothing can ever use",{c:"bad",s:11.5,mid:true})+
  K.txt(20,130,"VLSM /30 on the same link: 4 addresses",{c:"fg",s:12,f:"display",b:true})+
  `<rect x="20" y="140" width="10" height="34" fill="var(--muted)"/><rect x="30" y="140" width="20" height="34" fill="var(--accent)"/><rect x="50" y="140" width="10" height="34" fill="var(--muted)"/>`+
  K.txt(80,162,"network · 2 routers · broadcast — the other 60 addresses stay free for real subnets",{c:"ok",s:11}),
  "Each small square is one address. With one fixed mask, the WAN link swallows 64 addresses to use 2. With a /30 it takes 4 and leaves the rest of the block free.")}
<h3>Sometimes FLSM cannot work at all</h3>
<p>Worse, fixed sizes often <b>cannot meet the requirements</b>. Try the opening scenario with FLSM inside <code>10.20.0.0/22</code>:</p>
<ul>
<li><b>Size for the biggest.</b> 300 hosts needs a <code>/23</code> (510). A /22 holds only <b>two</b> /23s; you need eight subnets. Fail.</li>
<li><b>Size for the count.</b> Eight subnets: borrow 3 bits → <code>/25</code>, 126 hosts each. 300 users don't fit. Fail.</li>
</ul>
<p>No single mask works. With variable sizes it fits with 228 addresses to spare.</p>
${K.check({q:"A /24 is divided with FLSM into /27s, and one /27 is used for a link between two routers. How many usable addresses on that subnet are wasted?", o:["2","28","30","32"], a:1, why:"A /27 has 2^5 − 2 = 30 usable addresses. The two routers use 2, so 28 usable addresses are wasted. A /30 would have used exactly the 2 it needs."})}

<h2>VLSM: the method</h2>
<p>VLSM — variable-length subnet masking — means using <b>different prefix lengths inside one block</b>: a /23 for HQ users, a /26 for servers, a /28 for management, a /30 per WAN link, packed so none overlap. The arithmetic for each subnet is lessons 4 and 5. What VLSM adds is a <b>discipline</b> for fitting different sizes together without overlaps or holes.</p>
${K.analogy(`<p>Packing a car boot. Suitcases first, then bags, then shoes and snacks into the gaps, and everything fits. Scatter the snacks first and the suitcases no longer go in, though the total volume is the same. VLSM packs the big subnets first.</p>`)}
<h3>The four steps</h3>
${K.steps([
  ["List every requirement", `<p>One row per subnet: name, and addresses needed <b>including the gateway</b>. Include every point-to-point link — a forgotten one is the commonest reason a plan is redone.</p>`],
  ["Size each one", `<p>Find the fewest host bits <i>h</i> where 2^h − 2 ≥ the need (lesson 4). Prefix = 32 − h. Note the <b>block size</b>, 2^h: the addresses the subnet really takes.</p>`],
  ["Sort largest first", `<p>Re-order by block size, biggest at the top. Ties in any order.</p>`],
  ["Allocate at the next free boundary, and track the next free address", `<p>The biggest subnet starts at the block's first address. Its broadcast is start + block size − 1; the <b>next free address</b> is one after that. The next subnet starts there, provided it is a valid boundary for its size (below). Repeat.</p>`],
])}
${K.remember(`<b>&ldquo;List, Size, Sort, Stack.&rdquo;</b> List every need · Size each with 2^h − 2 · Sort biggest first · Stack each block at the next free address — then write the next free address down before you do anything else.`)}
<h3>The boundary rule: where a subnet is allowed to start</h3>
<p>A network address has <b>all its host bits 0</b>, so a block of size N can only start at a multiple of N (in the octet where the mask stops being 255). The ${K.g("block boundary","An address where a subnet of a given size may start: a multiple of its block size. A /26 (64) may start at .0, .64, .128 or .192.")}s for a /26 (64) are .0, .64, .128 and .192; for a /28 (16), .0, .16, .32, .48 and so on.</p>
<p>Take <code>10.20.2.32/26</code>. The last octet is <code>00|100000</code>: the six host bits are <code>100000</code>, not all zero. So it is not a /26 network at all; it is host 32 inside <code>10.20.2.0/26</code>, however neat it looks in a spreadsheet.</p>
<p>This is why largest-first matters: <b>allocating biggest to smallest, the next free address is always on a valid boundary for the next block.</b> Every block is a power of two and every earlier block was at least as big, so the running total is a multiple of the next size. No skipped addresses, no holes.</p>
${K.exam(`Questions list subnets in use and ask which to assign next. Two traps: an answer inside an existing subnet (overlap), and one off its own boundary (192.168.5.48/27 — 48 isn't a multiple of 32). Check both.`)}
<h3>Point-to-point links: /30 or /31</h3>
<p>The classic answer for a router-to-router link is a <code>/30</code>: 4 addresses, 2 usable, one per end — what CCNA questions expect unless they say otherwise. ${K.g("RFC 3021","The 2000 standard that allows a /31 on point-to-point links: both addresses are usable, with no network or broadcast address.")} also allows a <code>/31</code>: 2 addresses, <b>both</b> usable, because a two-ended link needs no broadcast. It halves the space links use, and Cisco IOS accepts it; on an Ethernet interface it adds a reminder, <code>% Warning: use /31 mask on non point-to-point interface cautiously</code>, and applies the address anyway.</p>
${K.when([
  ["/30","Most enterprise router-to-router links, and the CCNA exam","Every tool and engineer understands it","You have thousands of links and little space"],
  ["/31","Networks with many links (providers, data-centre fabrics)","Half the space of a /30","Older devices or tools don't support it"],
  ["/29","A hand-off that really has 3–6 devices, e.g. two customer routers plus the provider's","6 usable addresses","The link has only two ends"],
], "Addressing a link between routers")}
<h3>Sizing practice</h3>
<p>Make step 2 automatic. A need of 62 fits a /26; 63 or 64 does not.</p>
${K.drill({title:"how many host bits? requirement → prefix", types:["hosts2prefix"], count:6})}
${K.check({q:"Using largest-first allocation from 172.16.0.0, a /24 has been allocated (172.16.0.0/24), then a /25 (172.16.1.0/25). A /26 is next. Where does it start?", o:["172.16.1.64","172.16.1.128","172.16.2.0","172.16.1.127"], a:1, why:"The /25 runs 172.16.1.0 – 172.16.1.127, so the next free address is 172.16.1.128. 128 is a multiple of 64, so it is a valid /26 boundary: 172.16.1.128/26."})}

<h2>Worked design: one block, a whole company</h2>
<p>Back to the logistics company. The block is <code>10.20.0.0/22</code>: 22 network bits, 10 host bits, 1,024 addresses from <code>10.20.0.0</code> to <code>10.20.3.255</code>. Here is the network it has to address.</p>
${K.svg("0 0 720 320",
  K.dev("firewall",120,50,"HQ-FW","internet edge")+
  K.dev("router",300,130,"HQ-R1","head office")+
  K.dev("router",600,130,"BR-R1","Apapa branch")+
  K.link(142,64,278,122,"WAN-HQ-FW")+
  K.link(324,122,576,122,"WAN-HQ-BR1 (fibre)")+
  K.link(324,140,576,140,"")+K.txt(450,158,"WAN-HQ-BR2 (backup provider)",{s:10,mid:true})+
  K.dev("switch",110,250,"HQ-USERS","300 hosts")+
  K.dev("server",300,250,"SERVERS","50 hosts")+
  K.dev("phone",450,250,"VOICE","60 phones")+
  K.dev("switch",610,250,"BR-USERS","120 hosts")+
  K.link(290,142,120,238)+K.link(300,144,300,228)+K.link(310,142,445,230)+K.link(600,144,608,238)+
  K.txt(470,32,"MGMT: 14 switches and APs, both sites",{c:"fg",s:11})+
  K.txt(470,48,"(one management subnet)",{s:10.5}),
  "The requirements: five LAN subnets and three point-to-point WAN links. Counts include each subnet's gateway address.")}
<h3>Steps 1–3: list, size, sort</h3>
<div class="tablewrap"><table>
<tr><th>Subnet</th><th>Need</th><th>h: 2^h − 2</th><th>Prefix</th><th>Block</th></tr>
<tr><td>HQ-USERS</td><td>300</td><td>9: 510 (8 gives 254)</td><td>/23</td><td>512</td></tr>
<tr><td>BR-USERS</td><td>120</td><td>7: 126</td><td>/25</td><td>128</td></tr>
<tr><td>VOICE</td><td>60</td><td>6: 62</td><td>/26</td><td>64</td></tr>
<tr><td>SERVERS</td><td>50</td><td>6: 62</td><td>/26</td><td>64</td></tr>
<tr><td>${K.g("MGMT","Management: the subnet holding the switches' and access points' own addresses, which the network team uses to log in to and monitor them.")}</td><td>14</td><td>4: 14 (full)</td><td>/28</td><td>16</td></tr>
<tr><td>WAN ×3</td><td>2 each</td><td>2: 2</td><td>/30</td><td>4 each</td></tr>
</table></div>
<p>The list is already in largest-first order. Total taken: 512 + 128 + 64 + 64 + 16 + 3 × 4 = <b>796 addresses</b> of 1,024. It fits — now place each block.</p>
<h3>Step 4: allocate, tracking the next free address</h3>
${K.steps([
  ["HQ-USERS /23 (512) — start at 10.20.0.0", `<p>A /23 must start on an <b>even third octet</b> (block size 2 in octet 3): 0 is fine. Network <code>10.20.0.0/23</code>, mask <code>255.255.254.0</code>, broadcast 10.20.0.0 + 511 = <code>10.20.1.255</code>, usable <code>10.20.0.1 – 10.20.1.254</code>. Inside a /23, <code>10.20.0.255</code> and <code>10.20.1.0</code> are ordinary hosts.</p><p><b>Next free: 10.20.2.0</b></p>`],
  ["BR-USERS /25 (128)", `<p>10.20.2.0 — last octet 0 is a multiple of 128. Network <code>10.20.2.0/25</code>, mask <code>255.255.255.128</code>, broadcast <code>10.20.2.127</code>, usable <code>.1 – .126</code>.</p><p><b>Next free: 10.20.2.128</b></p>`],
  ["VOICE /26 (64)", `<p>128 is a multiple of 64. Network <code>10.20.2.128/26</code>, mask <code>255.255.255.192</code>, broadcast <code>10.20.2.191</code>, usable <code>.129 – .190</code>.</p><p><b>Next free: 10.20.2.192</b></p>`],
  ["SERVERS /26 (64)", `<p>192 is a multiple of 64. Network <code>10.20.2.192/26</code>, broadcast <code>10.20.2.255</code>, usable <code>.193 – .254</code>.</p><p><b>Next free: 10.20.3.0</b> — the third octet rolls over because .255 + 1 carries into it.</p>`],
  ["MGMT /28 (16)", `<p>Network <code>10.20.3.0/28</code>, mask <code>255.255.255.240</code>, broadcast <code>10.20.3.15</code>, usable <code>.1 – .14</code>.</p><p><b>Next free: 10.20.3.16</b></p>`],
  ["The three WAN /30s (4 each)", `<p><code>10.20.3.16/30</code> (usable .17 and .18, broadcast .19) · <code>10.20.3.20/30</code> (.21, .22, broadcast .23) · <code>10.20.3.24/30</code> (.25, .26, broadcast .27). Mask <code>255.255.255.252</code>.</p><p><b>Next free: 10.20.3.28.</b> Everything from 10.20.3.28 to 10.20.3.255 — 228 addresses — is unallocated, in one unbroken run.</p>`],
])}
<p>The finished plan, as you'd hand it to the team:</p>
${K.out(`VLSM PLAN  10.20.0.0/22  (10.20.0.0 - 10.20.3.255, 1,024 addresses)
Subnet       Need  Prefix  Mask             Network       First usable  Last usable   Broadcast
HQ-USERS      300  /23     255.255.254.0    10.20.0.0     10.20.0.1     10.20.1.254   10.20.1.255
BR-USERS      120  /25     255.255.255.128  10.20.2.0     10.20.2.1     10.20.2.126   10.20.2.127
VOICE          60  /26     255.255.255.192  10.20.2.128   10.20.2.129   10.20.2.190   10.20.2.191
SERVERS        50  /26     255.255.255.192  10.20.2.192   10.20.2.193   10.20.2.254   10.20.2.255
MGMT           14  /28     255.255.255.240  10.20.3.0     10.20.3.1     10.20.3.14    10.20.3.15
WAN-HQ-BR1      2  /30     255.255.255.252  10.20.3.16    10.20.3.17    10.20.3.18    10.20.3.19
WAN-HQ-BR2      2  /30     255.255.255.252  10.20.3.20    10.20.3.21    10.20.3.22    10.20.3.23
WAN-HQ-FW       2  /30     255.255.255.252  10.20.3.24    10.20.3.25    10.20.3.26    10.20.3.27
FREE                                        10.20.3.28 - 10.20.3.255   (228 addresses)`, "The complete allocation. Each network address is the previous broadcast + 1, and each sits on a boundary for its own block size.")}
<ul>
<li><b>Prefix / Mask</b> — write both: router interfaces take the dotted mask.</li>
<li><b>Network → Broadcast</b> — the first and last address the subnet owns. Nothing else may use anything between them.</li>
<li><b>First / Last usable</b> — the device range. Here the gateway takes the first usable; some organisations use the last. Pick one rule and keep it.</li>
<li><b>FREE</b> — the next free address and what's left, so the next engineer needn't redo the arithmetic.</li>
</ul>
<p>As one bar: no gaps between pieces, and all the free space together at the end.</p>
${K.svg("0 0 720 250",
  K.txt(20,22,"10.20.0.0/22 — 1,024 addresses, drawn to scale",{c:"fg",s:12,f:"display",b:true})+
  K.band(20,40,340,36,"HQ-USERS 10.20.0.0/23 (512)","var(--chip)")+
  K.band(360,40,85,36,"BR /25","var(--panel2)")+
  K.band(445,40,42.5,36,"VOICE","var(--chip)")+
  K.band(487.5,40,42.5,36,"SRV","var(--panel2)")+
  K.band(530,40,170,36,"10.20.3.0/24 ▼","var(--chip)")+
  K.txt(20,92,"10.20.0.0",{s:10})+K.txt(360,92,"10.20.2.0",{s:10,mid:true})+K.txt(445,106,"10.20.2.128",{s:10,mid:true})+K.txt(500,92,"10.20.2.192",{s:10,mid:true})+K.txt(565,106,"10.20.3.0",{s:10,mid:true})+K.txt(700,92,"10.20.3.255",{s:10,end:true})+
  K.link(530,76,20,150,"",true)+K.link(700,76,700,150,"",true)+
  K.txt(20,140,"zoom: 10.20.3.0/24 (256 addresses)",{c:"fg",s:11})+
  K.band(20,156,42.5,36,"MGMT","var(--chip)")+
  `<rect x="62.5" y="156" width="10.6" height="36" fill="var(--accent)" stroke="var(--line)"/><rect x="73.1" y="156" width="10.6" height="36" fill="var(--accent)" stroke="var(--line)" opacity=".75"/><rect x="83.7" y="156" width="10.6" height="36" fill="var(--accent)" stroke="var(--line)" opacity=".5"/>`+
  `<rect x="94.4" y="156" width="605.6" height="36" rx="4" fill="none" stroke="var(--ok)" stroke-dasharray="5 4"/>`+
  K.txt(397,178,"FREE 10.20.3.28 – 10.20.3.255 (228 addresses, one unbroken run)",{c:"ok",s:11,mid:true})+
  K.txt(20,208,".0",{s:10})+K.txt(62,222,".16",{s:10,mid:true})+K.txt(96,208,".28",{s:10})+K.txt(700,208,".255",{s:10,end:true})+
  K.txt(96,240,"3 × WAN /30 at .16, .20, .24",{c:"accent",s:10.5,mid:true}),
  "The VLSM plan as a bar. Top: the whole /22 to scale. Bottom: the last /24 enlarged, where the /28 and the three /30s sit, followed by one contiguous free range.")}
${K.tip(`Many teams put all point-to-point links in a dedicated &ldquo;infrastructure&rdquo; block instead of after the LANs, so link addresses are easy to recognise and filter. Either is fine if the rule is written down.`)}
<h3>What small-first would have done</h3>
<p>Run the same list <b>smallest first</b>, each block at the next valid boundary:</p>
${K.out(`SMALLEST FIRST (same requirements, same block)
10.20.0.0/30     WAN-HQ-BR1
10.20.0.4/30     WAN-HQ-BR2
10.20.0.8/30     WAN-HQ-FW
   10.20.0.12 - 10.20.0.15      hole
10.20.0.16/28    MGMT
   10.20.0.32 - 10.20.0.63      hole
10.20.0.64/26    SERVERS
10.20.0.128/26   VOICE
   10.20.0.192 - 10.20.0.255    hole
10.20.1.0/25     BR-USERS
   10.20.1.128 - 10.20.1.255    hole
10.20.2.0/23     HQ-USERS`, "Smallest first: each hole is where the next, bigger block couldn't start (a /28 can't start at .12, a /26 at .32, and so on). HQ-USERS is jammed against the end.")}
<p>Still 228 free addresses, but as four holes wedged between live subnets. Someone must find them and back-fill without hitting a neighbour — the classic way overlaps are created — and HQ-USERS, the subnet most likely to grow, has nowhere to go. With a tighter block, small-first (or &ldquo;in the order people asked&rdquo;) runs out of room where largest-first fits.</p>
${K.mistake(`Allocating in the order requests arrive. Voice asks for a /26, someone needs a /30, then the 300-user VLAN must jump to the next /23 boundary, leaving a hole. Collect the whole list, sort, then allocate. Later requests go into the free space at a valid boundary, and the next-free note is updated.`)}
<h3>Your turn: design on paper</h3>
<p>A school in Abuja has been given <code>172.16.32.0/23</code> (512 addresses, <code>172.16.32.0 – 172.16.33.255</code>). Requirements, including gateways: <b>Staff 100</b>, <b>Labs 60</b>, <b>Guest Wi-Fi 50</b>, <b>CCTV 25</b>, <b>Printers 10</b>, and <b>2 WAN links</b>. Produce the full table — prefix, mask, network, first and last usable, broadcast — then say what the next free address is.</p>
${K.hint(`Sizes: 100 → /25 (126), 60 → /26 (62), 50 → /26, 25 → /27 (30), 10 → /28 (14), WAN → /30. Start at 172.16.32.0 and add each block size to get the next start. When the fourth octet passes 255 the third octet goes up by one: 172.16.32.255 + 1 = 172.16.33.0.`)}
${K.reveal("Show the worked answer",`${K.out(`Subnet     Prefix  Mask             Network        First          Last           Broadcast
STAFF      /25     255.255.255.128  172.16.32.0    172.16.32.1    172.16.32.126  172.16.32.127
LABS       /26     255.255.255.192  172.16.32.128  172.16.32.129  172.16.32.190  172.16.32.191
GUEST      /26     255.255.255.192  172.16.32.192  172.16.32.193  172.16.32.254  172.16.32.255
CCTV       /27     255.255.255.224  172.16.33.0    172.16.33.1    172.16.33.30   172.16.33.31
PRINTERS   /28     255.255.255.240  172.16.33.32   172.16.33.33   172.16.33.46   172.16.33.47
WAN1       /30     255.255.255.252  172.16.33.48   172.16.33.49   172.16.33.50   172.16.33.51
WAN2       /30     255.255.255.252  172.16.33.52   172.16.33.53   172.16.33.54   172.16.33.55
FREE       172.16.33.56 - 172.16.33.255 (200 addresses)`)}<p>Used: 312. Next free: <b>172.16.33.56</b>. A later /26 can't start at .56 (not a multiple of 64); the first valid one is <code>172.16.33.64/26</code>. The free run as aligned blocks: <code>.56/29</code>, <code>.64/26</code>, <code>.128/25</code>.</p>`)}
<p>Now drill the skill behind every row: range-finding.</p>
${K.drill({title:"network, broadcast and range for any prefix", types:["subnet"], count:5})}
${K.check({q:"In the logistics plan, a colleague proposes adding a CCTV subnet as 10.20.3.20/27 because \"10.20.3.20 is free\". What is wrong?", o:["Nothing — 10.20.3.20 is after the MGMT subnet","20 is not a multiple of 32, so it isn't a /27 network address; and 10.20.3.0/27 would overlap MGMT and the WAN /30s","A /27 is too big for CCTV","/27 subnets can only be used in Class C networks"], a:1, why:"A /27 must start at a multiple of 32: .0, .32, .64… 10.20.3.20 is host 20 inside 10.20.3.0/27, which overlaps MGMT (.0–.15) and the /30s at .16 and .20. The first valid free /27 is 10.20.3.32/27."})}

<h2>Checking, growing and documenting the plan</h2>
<h3>Check for overlaps before anything is configured</h3>
<p>Two subnets ${K.g("overlap","Two subnets overlap when any address belongs to both. Devices and routers then disagree about where those addresses are, and traffic goes to the wrong place.")} if any address belongs to both. It is the costliest addressing mistake because it fails quietly: only some hosts break, sometimes weeks later. A reliable check:</p>
<ol>
<li>Sort the plan by network address.</li>
<li>For each row, confirm the network address is on a boundary for its own prefix (a multiple of its block size).</li>
<li>Confirm each row's network address is <b>greater than</b> the previous row's broadcast address. If it is equal or less, they overlap.</li>
</ol>
<p>Logistics plan: 10.20.2.0 > 10.20.1.255 ✓ … 10.20.3.24 > 10.20.3.23 ✓. Clean.</p>
<p>IOS helps on a single router: an address inside a subnet already on another of its interfaces is refused with <code>% 10.20.1.252 overlaps with GigabitEthernet0/0</code> (you'll trigger it in the hands-on section). Two routers at two sites, though, will happily accept overlapping subnets — hence the plan check.</p>
${K.mistake(`Squeezing a WAN /30 into &ldquo;spare-looking&rdquo; LAN space. 10.20.1.252/30 looks unused because no PC has those addresses yet, but it belongs to HQ-USERS (to 10.20.1.255). The HQ router refuses it; the branch router accepts it, and PCs later given .253 or .254 by DHCP are unreachable. Allocate only from the FREE line.`)}
<h3>Leave room to grow</h3>
<ul>
<li><b>Size for two to three years, not today.</b> MGMT is a /28 with 14 usable for 14 devices — 100% full; one more access point breaks it. A /27 (30 usable) costs 16 addresses; the WAN /30s then move to 10.20.3.32, .36 and .40, and free space starts at 10.20.3.44.</li>
<li><b>Keep free space next to what will grow.</b> A subnet can only be enlarged in place if the block it would merge with is free. Had 10.20.2.128/25 stayed free, BR-USERS could become 10.20.2.0/24 with no re-addressing. VOICE and SERVERS sit there, so a bigger branch would need a second subnet.</li>
</ul>
${K.dyk(`IOS notices VLSM: after you configure a plan, the routing table lists the parent network as <b>&ldquo;variably subnetted&rdquo;</b> — e.g. <code>10.0.0.0/8 is variably subnetted, 6 subnets, 4 masks</code>. The router's own /32 &ldquo;local&rdquo; routes count as one of the masks.`)}
<h3>Document it: an IPAM-style table</h3>
<p>Keep the plan in an ${K.g("IPAM","IP Address Management: the record (a spreadsheet or a tool such as NetBox or phpIPAM) of every block, subnet, VLAN and reserved address.")} tool or shared sheet, one row per subnet:</p>
<div class="tablewrap"><table>
<tr><th>Site</th><th>VLAN</th><th>Name</th><th>Subnet</th><th>Gateway</th><th>DHCP range</th><th>Static / reserved</th><th>Owner · notes</th></tr>
<tr><td>HQ</td><td>10</td><td>HQ-USERS</td><td>10.20.0.0/23</td><td>10.20.0.1</td><td>10.20.0.50 – 10.20.1.250</td><td>.2–.49 printers, APs</td><td>IT desk · 300 now, 450 by 2028</td></tr>
<tr><td>HQ</td><td>30</td><td>SERVERS</td><td>10.20.2.192/26</td><td>10.20.2.193</td><td>none (static only)</td><td>.194–.254</td><td>Infrastructure</td></tr>
<tr><td>Both</td><td>99</td><td>MGMT</td><td>10.20.3.0/28</td><td>10.20.3.1</td><td>none</td><td>switches .2–.9, APs .10–.14</td><td>Network team · full — enlarge</td></tr>
<tr><td>HQ↔Apapa</td><td>—</td><td>WAN-HQ-BR1</td><td>10.20.3.16/30</td><td>HQ .17 · Apapa .18</td><td>—</td><td>—</td><td>Fibre circuit ref on the contract</td></tr>
<tr><td>—</td><td>—</td><td><b>FREE</b></td><td>10.20.3.28 – 10.20.3.255</td><td colspan="4">Next free: 10.20.3.28 · largest free aligned block: 10.20.3.128/25</td></tr>
</table></div>
<p>Apply one ${K.g("naming convention","An agreed pattern for names (site-function, for example) so every subnet, VLAN and interface description can be understood without asking anyone.")} everywhere — IPAM row, VLAN name and interface <code>description</code> all say <code>HQ-USERS</code>; links are <i>WAN-SITEA-SITEB</i>. When an alert says &ldquo;GigabitEthernet0/2 down&rdquo;, the description tells you it's the Apapa fibre.</p>
${K.dodont([
  "Collect every requirement, including links and growth, before allocating.",
  "Sort largest first; check each network is on its own boundary.",
  "Record the next free address after every change.",
  "Use the same names in IPAM, VLANs and interface descriptions.",
  "Check a new subnet against the whole plan, not one router.",
],[
  "Don't allocate in the order requests arrive.",
  "Don't size a subnet at 100% on day one.",
  "Don't take &ldquo;spare-looking&rdquo; addresses off a diagram.",
  "Don't put a network or broadcast address on a device.",
  "Don't let the sheet and the routers drift; the routers are the truth.",
])}
${K.q({type:"order", q:"Put the VLSM design steps in the correct order.", items:["List every subnet that is needed, including point-to-point links and the gateway in each count","Find the prefix for each one with 2^h − 2 and note its block size","Sort the subnets from largest block to smallest","Allocate each at the next free address, checking it is on a boundary for its size","Record the next free address, then check the finished plan for overlaps"], why:"List, size, sort, stack. Sorting before allocating is what keeps every next-free address on a valid boundary; the overlap check and the next-free note make the plan safe to hand over."})}
${K.check({q:"A plan contains 10.30.4.0/23 and then 10.30.5.128/25. What is the problem?", o:["None — they are in order","10.30.5.128/25 overlaps 10.30.4.0/23, which runs to 10.30.5.255","10.30.5.128 is not a valid /25 boundary","A /25 can't follow a /23"], a:1, why:"A /23 starting at 10.30.4.0 covers 10.30.4.0 – 10.30.5.255. 10.30.5.128 is less than that broadcast, so the /25 sits inside the /23. 128 is a valid /25 boundary, so alignment isn't the issue — overlap is."})}

<h2>Hands-on: configure the plan on routers</h2>
<p>First the HQ router in a terminal, including the &ldquo;WAN inside a LAN&rdquo; mistake on purpose; then both routers on a bench, proving each connected network works.</p>
<h3>Practise: HQ-R1 from the plan</h3>
${K.hint(`Interface addresses use the <b>dotted mask</b>, not the prefix: /23 = 255.255.254.0, /26 = 255.255.255.192, /30 = 255.255.255.252. The gateway is the first usable address. Router interfaces start shut down, so each needs <code>no shutdown</code>.`)}
${K.term({env:"ios2", title:"configure HQ-R1 from the plan (and meet the overlap check)", opts:{kind:"router", host:"HQ-R1", motd:"HQ-R1 — console session on a new ISR. Interfaces are unconfigured and shut down."},
  intro:"Configure the three HQ interfaces from the VLSM plan above, try one bad address on purpose, then read the routing table.",
  tasks:[
    {text:"<code>enable</code>, <code>configure terminal</code>, <code>interface g0/0</code>: give it HQ-USERS' gateway (first usable of 10.20.0.0/23) and its mask, a <code>description HQ-USERS</code>, and <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0"]; return i.ip==="10.20.0.1" && i.mask==="255.255.254.0" && !i.shut; }},
    {text:"<code>interface g0/1</code>: SERVERS' gateway (first usable of 10.20.2.192/26) with its mask, and <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return i.ip==="10.20.2.193" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"The mistake, on purpose: on <code>interface g0/2</code> try <code>ip address 10.20.1.253 255.255.255.252</code> — a /30 that &ldquo;looks free&rdquo;. Read the error", done:e=>e.history.some(h=>/ip\s+add\S*\s+10\.20\.1\.253\s+255\.255\.255\.252/i.test(h)) && e.intfs["GigabitEthernet0/2"].ip!=="10.20.1.253"},
    {text:"Now the planned WAN address: G0/2 takes the HQ end of WAN-HQ-BR1 (10.20.3.16/30, first usable), then <code>no shutdown</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/2"]; return i.ip==="10.20.3.17" && i.mask==="255.255.255.252" && !i.shut; }},
    {text:"Read the result: <code>end</code>, then <code>show ip route</code> (or <code>do show ip route</code> from config mode) — three C routes with three different prefix lengths", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce},
  ],
  win:"You put three different prefix lengths from one block on one router, watched IOS refuse a /30 hidden inside the /23, and read a routing table that is variably subnetted — VLSM on a real device.",
  solve:["enable","configure terminal","interface g0/0","description HQ-USERS","ip address 10.20.0.1 255.255.254.0","no shutdown","interface g0/1","description SERVERS","ip address 10.20.2.193 255.255.255.192","no shutdown","interface g0/2","description WAN-HQ-BR1","ip address 10.20.1.253 255.255.255.252","ip address 10.20.3.17 255.255.255.252","no shutdown","end","show ip route","copy running-config startup-config",""]})}
<p>IOS worked out the network you typed (10.20.1.252/30), saw it inside 10.20.0.0/23 on G0/0, and refused: <code>% 10.20.1.252 overlaps with GigabitEthernet0/0</code> — caught only because both subnets were on one router. The routing table you read:</p>
${K.out(`HQ-R1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       O - OSPF, IA - OSPF inter area, * - candidate default

Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 6 subnets, 4 masks
C        10.20.0.0/23 is directly connected, GigabitEthernet0/0
L        10.20.0.1/32 is directly connected, GigabitEthernet0/0
C        10.20.2.192/26 is directly connected, GigabitEthernet0/1
L        10.20.2.193/32 is directly connected, GigabitEthernet0/1
C        10.20.3.16/30 is directly connected, GigabitEthernet0/2
L        10.20.3.17/32 is directly connected, GigabitEthernet0/2`, "HQ-R1's routing table after the three interfaces come up. (Trimmed codes legend.)")}
<ul>
<li><b>variably subnetted, 6 subnets, 4 masks</b> — six entries using four prefix lengths: /23, /26, /30, /32.</li>
<li><b>C</b> — <i>connected</i>: the subnet of an up interface, which IOS found by AND-ing address and mask (lesson 3).</li>
<li><b>L</b> — <i>local</i>: the router's own address on that interface, as a /32.</li>
<li><b>Gateway of last resort is not set</b> — no default route: it knows only connected networks. Routing to others is Module 5.</li>
</ul>
${K.exam(`<code>show ip interface brief</code> shows IPs but <b>not masks</b>. Use <code>show ip route</code>, <code>show running-config</code> or <code>show interfaces g0/1</code> (<code>Internet address is 10.20.2.193/26</code>). Exhibits often hide a wrong mask in that gap.`)}
<h3>Bench: HQ and branch on two routers</h3>
<p>HQ-R1: HQ-USERS on G0/0 (one PC stands in for the switch), SERVERS on G0/1, the /30 on G0/2 to BR-R1 G0/0. BR-R1 G0/1 serves BR-USERS. Laptops sit on both consoles.</p>
<p>There are <b>no routes</b> — static routing is Module 5 — so be precise about what should work. A router forwards between networks <i>it is connected to</i>: PC-HQ reaches SRV1 through HQ-R1, and the routers reach each other across the /30. But BR-R1 doesn't know where 10.20.0.0/23 is, so PC-HQ's ping to its WAN address arrives and the reply has nowhere to go. Watch for it in the log.</p>
${K.hint(`Terminal app: 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control. Plan rows: HQ-USERS 10.20.0.0/23 · SERVERS 10.20.2.192/26 · WAN-HQ-BR1 10.20.3.16/30 (HQ first usable, branch last) · BR-USERS 10.20.2.0/25. If IOS says <code>overlaps with</code>, re-check the mask on the <i>other</i> interface — a /22 typed on G0/0 swallows SERVERS.`)}
${K.bench({id:"m3-vlsm-two-routers", points:90, from:"CCNA · Module 3 · lesson 6", title:"put a VLSM plan on two routers", viewBox:"0 0 760 420", openLog:true,
  intro:"Configure every router interface from the VLSM plan, give SRV1 a valid address from SERVERS, then prove which pings work with connected networks only. PC-HQ (10.20.0.10/23) and PC-BR (10.20.2.10/25) are already addressed.",
  devices:[
    {id:"r1", kind:"router", label:"HQ-R1", model:"ISR 1100 · HQ · 3 LAN/WAN ports", x:40, y:20,
      ports:[{id:"g0", type:"rj45", label:"G0/0", ios:"GigabitEthernet0/0"},{id:"g1", type:"rj45", label:"G0/1", ios:"GigabitEthernet0/1"},{id:"g2", type:"rj45", label:"G0/2", ios:"GigabitEthernet0/2"},{id:"con", type:"console", label:"CON"}],
      setup:d=>{ const e = d.env, run = e.exec; e.pings = [];
        e.exec = line => { const o = run(line); const s = typeof o==="string" ? o : (o && o.text) || "";
          const m = s.match(/Echos to ([\d.]+), timeout[\s\S]*?Success rate is (\d+) percent/); if (m) e.pings.push({ip:m[1], rate:+m[2]}); return o; }; }},
    {id:"r2", kind:"router", label:"BR-R1", model:"ISR 1100 · Apapa branch", x:500, y:20},
    {id:"lap1", kind:"laptop", label:"LAP-HQ", x:290, y:150},
    {id:"lap2", kind:"laptop", label:"LAP-BR", x:630, y:150},
    {id:"pchq", kind:"pc", label:"PC-HQ", x:20, y:300, ip:"10.20.0.10", mask:"255.255.254.0", gw:"10.20.0.1", mac:"3c52.8214.0010"},
    {id:"srv1", kind:"server", label:"SRV1", x:170, y:300, mac:"0050.56a2.0200"},
    {id:"pcbr", kind:"pc", label:"PC-BR", x:560, y:300, ip:"10.20.2.10", mask:"255.255.255.128", gw:"10.20.2.1", mac:"3c52.8214.0b10"},
  ],
  cables:[ {type:"cat6", a:"pchq:eth", b:"r1:g0"}, {type:"cat6", a:"srv1:eth", b:"r1:g1"}, {type:"cat6", a:"r1:g2", b:"r2:g0"}, {type:"cat6", a:"pcbr:eth", b:"r2:g1"},
           {type:"console", a:"lap1:usb", b:"r1:con"}, {type:"console", a:"lap2:usb", b:"r2:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"HQ-R1 G0/0 → <b>HQ-USERS</b> 10.20.0.0/23: first usable address, the right dotted mask, <code>no shutdown</code> (console from LAP-HQ)", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/0"]; return i.ip==="10.20.0.1" && i.mask==="255.255.254.0" && !i.shut; }},
    {text:"HQ-R1 G0/1 → <b>SERVERS</b> 10.20.2.192/26: first usable, mask, <code>no shutdown</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/1"]; return i.ip==="10.20.2.193" && i.mask==="255.255.255.192" && !i.shut; }},
    {text:"HQ-R1 G0/2 → HQ end of <b>WAN-HQ-BR1</b> 10.20.3.16/30 (first usable), <code>no shutdown</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/2"]; return i.ip==="10.20.3.17" && i.mask==="255.255.255.252" && !i.shut; }},
    {text:"On LAP-BR: BR-R1 G0/0 → branch end of the same /30 (last usable), <code>no shutdown</code>", done:B=>{ const i = B.devs.r2.env.intfs["GigabitEthernet0/0"]; return i.ip==="10.20.3.18" && i.mask==="255.255.255.252" && !i.shut; }},
    {text:"BR-R1 G0/1 → <b>BR-USERS</b> 10.20.2.0/25: first usable, mask, <code>no shutdown</code>", done:B=>{ const i = B.devs.r2.env.intfs["GigabitEthernet0/1"]; return i.ip==="10.20.2.1" && i.mask==="255.255.255.128" && !i.shut; }},
    {text:"Give <b>SRV1</b> (IP settings) any usable SERVERS address except the gateway, the /26 mask, and the gateway 10.20.2.193", done:B=>{ const s = B.devs.srv1, n = s.ip && s.ip.split(".").map(Number); return !!n && n[0]===10 && n[1]===20 && n[2]===2 && n[3]>=194 && n[3]<=254 && s.mask==="255.255.255.192" && s.gw==="10.20.2.193"; }},
    {text:"From PC-HQ's Command Prompt, ping SRV1 — two networks connected to the same router, so HQ-R1 routes between them with no routes configured", done:B=>!!B.devs.srv1.ip && Bench.pinged(B,"pchq",B.devs.srv1.ip)},
    {text:"From PC-BR, ping its gateway <code>10.20.2.1</code> and BR-R1's WAN address <code>10.20.3.18</code>", done:B=>Bench.pinged(B,"pcbr","10.20.2.1") && Bench.pinged(B,"pcbr","10.20.3.18")},
    {text:"On HQ-R1 (LAP-HQ), <code>ping 10.20.3.18</code> across the /30. The first <code>.</code> is the router sending an ARP request for its neighbour", done:B=>B.devs.r1.env.pings.some(p=>p.ip==="10.20.3.18" && p.rate>0)},
    {text:"Predict, then test: from PC-HQ, <code>ping 10.20.3.18</code>. It times out. Read the log — the request arrives, but BR-R1 has no route back to 10.20.0.0/23 (that is Module 5)", done:B=>Bench.tried(B,"pchq",/^\s*ping\s+10\.20\.3\.18\s*$/i)},
  ],
  win:"Five interfaces, four prefix lengths, one block — configured from a plan, with no overlaps. You proved a router forwards between its own connected networks, that a /30 joins two routers with no address to spare, and saw exactly where connected-only routing stops.",
  solve:[
    ["console","lap1",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],
    ["term","enable"],["term","configure terminal"],
    ["term","interface g0/0"],["term","description HQ-USERS"],["term","ip address 10.20.0.1 255.255.254.0"],["term","no shutdown"],
    ["term","interface g0/1"],["term","description SERVERS"],["term","ip address 10.20.2.193 255.255.255.192"],["term","no shutdown"],
    ["term","interface g0/2"],["term","description WAN-HQ-BR1"],["term","ip address 10.20.3.17 255.255.255.252"],["term","no shutdown"],["term","end"],
    ["console","lap2",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],
    ["term","enable"],["term","configure terminal"],
    ["term","interface g0/0"],["term","description WAN-HQ-BR1"],["term","ip address 10.20.3.18 255.255.255.252"],["term","no shutdown"],
    ["term","interface g0/1"],["term","description BR-USERS"],["term","ip address 10.20.2.1 255.255.255.128"],["term","no shutdown"],["term","end"],
    ["ip","srv1","10.20.2.200","255.255.255.192","10.20.2.193"],
    ["pc","pchq","ping 10.20.2.200"],
    ["pc","pcbr","ping 10.20.2.1"],["pc","pcbr","ping 10.20.3.18"],
    ["console","lap1",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","ping 10.20.3.18"],
    ["pc","pchq","ping 10.20.3.18"],
  ]})}
<p>In the last ping's log, HQ-R1 routes the request out G0/2 and BR-R1 accepts it — the address is its own. Its reply to 10.20.0.10 matches no connected network and no route, so it is dropped. Your addressing is fine; routing is missing (Module 5). Meanwhile <b>every pair sharing a connected subnet worked first time</b>, because every address and mask came from one checked plan.</p>
${K.check({q:"In the bench, PC-HQ could ping SRV1 but not BR-R1's WAN address 10.20.3.18. Why could it reach SRV1 with no routes configured?", o:["SRV1 and PC-HQ are in the same subnet","Both 10.20.0.0/23 and 10.20.2.192/26 are directly connected to HQ-R1, so it has a C route for each","HQ-R1 uses proxy ARP to reach SRV1","The /30 link carries the traffic"], a:1, why:"A router always knows its connected networks. Both subnets are on HQ-R1's interfaces, so it forwards between them. 10.20.3.18 is also connected to HQ-R1, so the request gets there — but BR-R1 has no route back to 10.20.0.0/23, so the reply is dropped."})}

${K.job("“The new link won't take its address” — the spreadsheet that lied",`
<p><b>The ticket.</b> &ldquo;HQ-R1: trying to configure the new Ikoyi office link on Gi0/3 using 10.20.2.225/30 from the IPAM sheet (shown as free). Router rejects it with an overlap error. Ikoyi go-live is tomorrow morning. — Chidi (NOC)&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Exact error?&rdquo; — <i>&ldquo;10.20.2.224 overlaps with GigabitEthernet0/1.&rdquo;</i> &ldquo;What does the sheet say is on Gi0/1?&rdquo; — <i>&ldquo;SERVERS, 10.20.2.192/27.&rdquo;</i> A /27 at .192 ends at .223, so .224 should be free. The router disagrees — and the router is never the one that's wrong.</p>
<p><b>Checks.</b> What is actually configured:</p>
${K.out(`HQ-R1#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.20.0.1       YES manual up                    up
GigabitEthernet0/1     10.20.2.193     YES manual up                    up
GigabitEthernet0/2     10.20.3.17      YES manual up                    up
GigabitEthernet0/3     unassigned      YES unset  administratively down down

HQ-R1#show interfaces GigabitEthernet0/1 | include Internet
  Internet address is 10.20.2.193/26`, "show ip interface brief hides the mask; show interfaces shows it.")}
<p>Gi0/1 is a <b>/26</b>: it owns 10.20.2.192 – 10.20.2.255. A change six months ago (&ldquo;servers out of addresses, mask widened to /26&rdquo;) never reached the sheet, so 10.20.2.224/30 is inside SERVERS. Configured on the <i>Ikoyi</i> router instead, it would have been accepted — and two servers would have broken the day they got .225 or .226.</p>
<p><b>The fix.</b> Use real free space: the plan's next free address, <code>10.20.3.28</code>, is a /30 boundary. Gi0/3 gets <code>ip address 10.20.3.29 255.255.255.252</code>, <code>description WAN-HQ-IKOYI</code>, <code>no shutdown</code>; Ikoyi takes .30. IPAM: SERVERS → /26, new WAN row, next free → 10.20.3.32.</p>
<p><b>What you say.</b> &ldquo;The router was right: that address belongs to the server network, which was enlarged and never recorded. The Ikoyi link has a free address from the plan and the sheet is fixed. Tomorrow's go-live is unaffected.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Overlap error HQ-R1 Gi0/3, 10.20.2.225/30. Gi0/1 = 10.20.2.193/26 (sheet said /27; widened per CHG-0418, sheet not updated). Allocated WAN-HQ-IKOYI 10.20.3.28/30 (HQ .29, Ikoyi .30); configured, described, saved. IPAM: SERVERS /26, WAN row added, next free 10.20.3.32. Recommend IPAM audit. 25 min.&rdquo;</i></p>`)}

<h2>A first look at route summarisation</h2>
<p>Contiguous allocation has one more reward. Every subnet is a route other routers must learn; eight HQ subnets are eight entries. If they all sit inside one block, HQ can advertise <b>one</b> route covering them: a ${K.g("summary route","One route that covers several contiguous subnets, e.g. 10.20.0.0/22 for 10.20.0.0/24 – 10.20.3.0/24. Also called an aggregate or supernet.")}. The technique is ${K.g("route summarisation","Advertising one shorter-prefix route in place of several longer-prefix routes that sit inside it. Smaller routing tables, fewer updates.")}; you'll configure it in the routing modules. Here: why VLSM makes it possible, and how to find a summary on paper.</p>
<h3>Finding the summary: common leading bits</h3>
<p>Take <code>10.20.0.0/24</code> to <code>10.20.3.0/24</code>. Octets 1–2 are identical; write octet 3 in binary and find where the four stop agreeing:</p>
${K.svg("0 0 720 300",
  K.txt(20,24,"Network",{c:"fg",s:11.5,f:"display",b:true})+K.txt(200,24,"octets 1–2 (same)",{c:"fg",s:11.5,f:"display",b:true})+K.txt(410,24,"octet 3",{c:"fg",s:11.5,f:"display",b:true})+K.txt(560,24,"octet 4",{c:"fg",s:11.5,f:"display",b:true})+
  [0,1,2,3].map(n=>{ const y = 54+n*30; const b = n.toString(2).padStart(2,"0");
    return K.txt(20,y,"10.20."+n+".0/24",{c:"fg",s:13})+K.txt(200,y,"00001010.00010100",{c:"accent",s:13})+K.txt(410,y,"000000",{c:"accent",s:13,b:true})+K.txt(462,y,b,{c:"muted",s:13})+K.txt(510,y,".",{s:13})+K.txt(560,y,"00000000",{s:13}); }).join("")+
  `<line x1="459" y1="34" x2="459" y2="150" stroke="var(--bad)" stroke-width="1.6" stroke-dasharray="4 3"/>`+
  K.txt(459,168,"16 + 6 = 22 bits in common → /22",{c:"bad",s:11.5,mid:true})+
  K.box(140,186,440,46,"Summary: 10.20.0.0/22  (mask 255.255.252.0)","keep the common bits, set every other bit to 0",true)+
  K.txt(20,258,"Counter-example: 10.20.1.0 – 10.20.4.0 → octet 3 = 00000001 … 00000100: only 5 bits in common,",{s:11})+
  K.txt(20,274,"so the smallest single route is 10.20.0.0/21 — which also covers 10.20.0.x",{s:11})+K.txt(20,289,"and 10.20.5–7.x, addresses that aren't these networks.",{s:11}),
  "The four networks agree on the first 22 bits and differ only in the last two bits of octet 3. Those 22 common bits are the summary's prefix.")}
${K.steps([
  ["Find the octet that changes", `<p>Octets 1–2 match in every network: 16 common bits. Octet 3 runs 0–3.</p>`],
  ["Write it in binary", `<p><code>000000|00</code>, <code>000000|01</code>, <code>000000|10</code>, <code>000000|11</code>: six bits never change.</p>`],
  ["Count the common bits", `<p>16 + 6 = <b>22</b> → /22.</p>`],
  ["Zero the rest", `<p>Octet 3 becomes 0. Summary: <b>10.20.0.0/22</b>, mask 255.255.252.0 — the company's whole block.</p>`],
])}
<p>A summary is <b>clean</b> only when the networks fill the block exactly: a power-of-two count starting on the summary's boundary. Four /24s from a third octet that is a multiple of 4 make a /22; two from an even third octet make a /23. Shift by one — 10.20.1.0 to 10.20.4.0 — and the smallest single route is a /21 that also claims networks that may belong to someone else. Advertising addresses you don't own is how a summary causes an outage.</p>
<p>Back to design: because the logistics plan keeps <b>every subnet inside 10.20.0.0/22</b>, the rest of the group reaches the whole company with one route. A stray 10.20.9.0/24 grabbed because it &ldquo;looked free&rdquo; would need its own route for ever.</p>
${K.exam(`Find the summary by counting common leading bits. Know the benefits: smaller tables, fewer updates, and a flapping LAN inside the summary hidden from routers outside it. The right answer covers <b>all</b> listed networks with the fewest extra addresses.`)}
<h3>Try two on paper</h3>
<p><b>(a)</b> 172.16.32.0/24 and 172.16.33.0/24. <b>(b)</b> 10.8.4.0/24, 10.8.5.0/24, 10.8.6.0/24, 10.8.7.0/24.</p>
${K.hint(`Find the changing octet, write it in binary, count matching bits from the left, add the bits of the identical octets before it.`)}
${K.reveal("Show the answers",`<p><b>(a)</b> 32 = <code>0010000|0</code>, 33 = <code>0010000|1</code> → 16 + 7 = <b>172.16.32.0/23</b> (the school's block).</p><p><b>(b)</b> 4–7 = <code>000001|00</code> to <code>000001|11</code> → 16 + 6 = <b>10.8.4.0/22</b>, clean because 4 is a multiple of 4.</p>`)}
${K.myth([
  ["VLSM is an exam trick; real networks use /24 everywhere.","Enterprise and provider networks use VLSM constantly: /30s or /31s on links, /22s for big VLANs. /24-everywhere suits only small sites with space to spare."],
  ["You can start a subnet at any address, as long as there's room.","It must start on a multiple of its block size. 10.20.3.20/27 is a host inside 10.20.3.0/27, not a network."],
  ["Any four consecutive /24s summarise to a /22.","Only if the first starts on a /22 boundary (third octet a multiple of 4)."],
  ["Private space is huge, so wasting it doesn't matter.","Waste scatters subnets, breaks summarisation and causes overlaps when companies merge or connect by VPN. A tidy plan is about control, not only running out."],
  ["VLSM needs special router configuration.","Interfaces need only an address and mask. The routing protocol must be classless (OSPF, EIGRP, RIPv2 carry masks; RIPv1 did not)."],
])}
${K.q({type:"match", q:"Match each requirement (including the gateway) with the smallest prefix that fits it.", pairs:[["2 addresses (router-to-router link, classic design)","/30"],["14 addresses","/28"],["30 addresses","/27"],["100 addresses","/25"],["300 addresses","/23"]], why:"Find the fewest host bits h with 2^h − 2 ≥ the need: 2 → h=2 (/30), 14 → h=4 (/28), 30 → h=5 (/27), 100 → h=7 (/25, 126 usable), 300 → h=9 (/23, 510 usable)."})}
${K.drill({title:"mixed review: sizing, ranges, the Nth subnet, same subnet?", types:["hosts2prefix","subnet","nth","samesub"], count:6})}
${K.check({q:"Which single route summarises 192.168.8.0/24, 192.168.9.0/24, 192.168.10.0/24 and 192.168.11.0/24 with no extra addresses?", o:["192.168.8.0/21","192.168.8.0/22","192.168.0.0/20","192.168.8.0/23"], a:1, why:"Octet 3: 8 = 000010|00 … 11 = 000010|11 → 6 common bits. 16 + 6 = 22 → 192.168.8.0/22 (8 is a multiple of 4, so it's clean). A /21 would also cover 192.168.12–15."})}

${K.case("Re-addressing a bank's branches that grew out of 192.168.x.0/24s",`
<p>A Nigerian commercial bank with 38 branches in Lagos and Abuja had grown one branch at a time, each addressed however the installer liked: mostly <code>192.168.1.0/24</code>, some <code>192.168.0.0/24</code>, with CCTV, ATMs and IP phones sharing the staff VLAN. Over the MPLS WAN, twenty identical 192.168.1.0/24s can't be told apart, so every branch hid behind NAT, and head office reached branch devices through port-forwarding rules nobody fully understood.</p>
<p><b>The cost.</b> Monitoring couldn't reach branch devices; security couldn't write a rule for &ldquo;all ATMs&rdquo;; and an address never told you which branch you were looking at.</p>
<p><b>The design</b>, from <code>10.64.0.0/16</code>, in two layers of VLSM:</p>
<ul>
<li><b>One /23 template per branch</b>, largest first: STAFF /25, VOICE /26, CCTV /27, MGMT /28, ATM /29. That uses 248 addresses; the second /24 is held for growth and guest Wi-Fi. Every branch has the same layout, so &ldquo;.240/29 is the ATMs&rdquo; is true everywhere.</li>
<li><b>Regions as summary blocks:</b> Lagos from <code>10.64.0.0/18</code> (32 branch /23s), Abuja from <code>10.64.64.0/18</code>. Head office learns each region as one route.</li>
<li><b>Links from their own block</b>, <code>10.127.0.0/24</code> in /30s, easy to recognise and filter.</li>
</ul>
<p><b>The migration.</b> Four branches each Saturday night, one team per branch, generator on standby: pre-built configs from the IPAM template, new DHCP scopes, re-addressed ATMs, cameras and the branch server, NAT removed, tested from head office. About three hours a branch; ten weekends in all.</p>
<p><b>The outcome.</b> NAT and port-forwards gone, monitoring direct, one firewall rule per function, and a handful of summaries at head office. The write-up: <b>one template sized largest first, contiguous regions that summarise, and the plan in IPAM before the first cable is touched.</b></p>`)}
${K.mistake(`Forgetting the network and broadcast addresses. 32 cameras don't fit a /27 (32 addresses, 30 usable); they need a /26. Size with 2^h − 2, never 2^h.`)}

<h2>Interview corner</h2>
${K.hint(`Show the method out loud, not only the answer: list, size, sort, allocate with next-free tracking, check overlaps, leave growth, document.`)}
${K.reveal("“Here's 10.50.0.0/23. Design addressing for 200 users, 50 phones, 20 printers and two WAN links.”",`<p>"I'd confirm whether the counts include gateways and growth. Assuming gateways are included: 200 needs a /24 (254 usable), 50 a /26 (62), 20 a /27 (30), each link a /30. Largest first from 10.50.0.0: users 10.50.0.0/24; phones 10.50.1.0/26, broadcast .63; printers 10.50.1.64/27, broadcast .95; links 10.50.1.96/30 and 10.50.1.100/30. Next free 10.50.1.104, about 150 addresses in one piece. I'd check boundaries and overlaps, flag that users is already 79% full, and put it all in IPAM with names before configuring anything."</p>`)}
${K.hint(`Definition, the problem it solves (waste and impossible requirements), one example, and one benefit beyond saving addresses.`)}
${K.reveal("“What is VLSM, and why would you use it?”",`<p>"Using different prefix lengths for subnets carved from one block, so each is sized to its need. Without it every subnet is as big as the biggest: a two-router link gets the same /26 as a user VLAN, wasting 60 addresses, and some lists can't fit at all — a /22 can't hold a 300-host VLAN plus seven other subnets with one mask. With VLSM, links get /30s or /31s and users a /23. Allocating largest first keeps everything aligned with no holes, and keeping a site contiguous lets it be advertised as one summary route."</p>`)}
${K.hint(`The procedure in steps, then the condition for a clean summary.`)}
${K.reveal("“How do you work out a summary route for a group of subnets?”",`<p>"Write the changing octet in binary and count the leading bits all the networks share; add the bits of the identical octets before it. That's the prefix; zero the remaining bits for the network. 10.20.0.0 to 10.20.3.0 /24: third octets 0–3 share six bits, so 16 + 6 = /22, 10.20.0.0/22. It's exact only if the subnets fill the block from its boundary. Otherwise the summary claims addresses I don't own, so I'd use two summaries or fix the allocation."</p>`)}

${K.recap([
  "FLSM wastes addresses (a /26 on a 2-router link) and often can't meet mixed requirements at all.",
  "VLSM uses different prefixes in one block, sizing each with 2^h − 2 ≥ need — never 2^h.",
  "List, size, sort largest first, allocate at the next free address — and write the next free address down.",
  "A subnet starts on a multiple of its block size; largest-first keeps every next-free address aligned, with no holes.",
  "Links get a /30 — or a /31 (RFC 3021) in larger networks.",
  "Each network must be greater than the previous broadcast. IOS catches overlaps only within one router.",
  "Leave room to grow and document every subnet in IPAM with consistent names.",
  "Contiguous subnets summarise by common leading bits: 10.20.0.0–10.20.3.0 /24 → 10.20.0.0/22.",
])}
${K.next(`<b>Lesson 7 — Configuring, verifying and troubleshooting IPv4 addressing.</b> Verification commands in depth, the faults you'll meet (wrong mask, wrong gateway, duplicates, shut interfaces), a troubleshooting method — and the Module 3 challenge.`)}
`,
quiz:[
  {lvl:1, q:"What does VLSM allow a network designer to do?", o:["Use a different prefix length for each subnet carved from the same block","Use public and private addresses in the same subnet","Give one interface several masks at once","Avoid using network and broadcast addresses"], a:0, why:"Variable-Length Subnet Masking means subnets from one block can have different masks, so each is sized to its own requirement — a /30 for a link, a /23 for a large user VLAN."},
  {lvl:1, q:"In a classic enterprise design, which prefix length is used on a point-to-point link between two routers?", o:["/24","/28","/30","/32"], a:2, why:"A /30 has 4 addresses: network, two usable (one per router) and broadcast. /31 is also valid under RFC 3021, but /30 is the classic answer the CCNA expects."},
  {lvl:2, q:"A new VLAN must hold 64 devices, including its gateway. What is the smallest subnet that fits?", o:["/26","/25","/27","/24"], a:1, why:"A /26 has 2^6 − 2 = 62 usable addresses, two short of 64. The next size up is a /25 with 126 usable. Always size with 2^h − 2, not 2^h."},
  {lvl:2, q:"Using largest-first allocation from 10.1.0.0/24, the first subnet is 10.1.0.0/25. The next requirement needs a /26. What is its network address?", o:["10.1.0.64","10.1.0.126","10.1.0.128","10.1.1.0"], a:2, why:"The /25 runs 10.1.0.0 – 10.1.0.127, so the next free address is 10.1.0.128. 128 is a multiple of 64, so 10.1.0.128/26 is valid."},
  {lvl:2, type:"multi", q:"Which two are valid network addresses for a /27 subnet? (Choose two.)", o:["192.168.5.32","192.168.5.48","192.168.5.96","192.168.5.80","192.168.5.100"], a:[0,2], why:"A /27 has a block size of 32, so networks start at multiples of 32: .0, .32, .64, .96, .128… 48, 80 and 100 are not multiples of 32; each is a host inside another /27."},
  {lvl:2, type:"order", q:"Put the VLSM allocation steps in the correct order.", items:["List every subnet needed, with the gateway counted in each","Calculate each subnet's prefix and block size with 2^h − 2","Sort the subnets from largest to smallest","Allocate each subnet at the next free address on a valid boundary","Record the next free address and check the plan for overlaps"], why:"List, size, sort, stack, then check. Sorting first is what makes each next-free address land on a valid boundary for the following, smaller subnet."},
  {lvl:1, type:"match", q:"Match each number of required addresses (including the gateway) to the smallest prefix that fits.", pairs:[["6","/29"],["25","/27"],["50","/26"],["120","/25"],["500","/23"]], why:"6 → 2^3 − 2 = 6 (/29). 25 → 2^5 − 2 = 30 (/27). 50 → 2^6 − 2 = 62 (/26). 120 → 2^7 − 2 = 126 (/25). 500 → 2^9 − 2 = 510 (/23)."},
  {lvl:2, type:"fill", q:"Give the single summary route that exactly covers 10.8.4.0/24, 10.8.5.0/24, 10.8.6.0/24 and 10.8.7.0/24.", fields:[{label:"Summary network", a:["10.8.4.0"]},{label:"Prefix (e.g. /22)", a:["/22","22"]}], why:"The third octets 4–7 are 000001|00 to 000001|11: 6 common bits. 16 + 6 = 22, and zeroing the remaining bits gives 10.8.4.0. Summary: 10.8.4.0/22."},
  {lvl:2, type:"fill", q:"In interface configuration mode, type the command that gives the HQ end of WAN link 10.20.3.16/30 its address (the first usable).", fields:[{label:"Command", a:["ip address 10.20.3.17 255.255.255.252"], ios:true}], why:"10.20.3.16/30 has usable addresses .17 and .18. IOS takes the dotted mask, so /30 is written 255.255.255.252: ip address 10.20.3.17 255.255.255.252."},
  {lvl:3, q:"A colleague tries to configure a new WAN link and gets the output shown. The IPAM sheet lists SERVERS as 10.20.2.192/27 and 10.20.2.224/27 as free. What is the best course of action?", ex:"HQ-R1#show interfaces GigabitEthernet0/1 | include Internet\n  Internet address is 10.20.2.193/26\nHQ-R1#configure terminal\nHQ-R1(config)#interface GigabitEthernet0/3\nHQ-R1(config-if)#ip address 10.20.2.225 255.255.255.252\n% 10.20.2.224 overlaps with GigabitEthernet0/1", o:["Change Gi0/1's mask to /27 so the space matches the sheet","The sheet is out of date: Gi0/1 is a /26 covering 10.20.2.192–10.20.2.255. Take the /30 from genuinely free space and correct the sheet","Configure the address on the remote router instead, where IOS won't complain","Use 10.20.2.224 255.255.255.254 to make the subnet smaller"], a:1, why:"The router shows 10.20.2.193/26, which owns .192–.255, so .224/30 is inside SERVERS. Shrinking the server subnet could cut off servers using .224–.254; configuring it elsewhere only hides the overlap. Allocate from real free space and fix the IPAM record."},
  {lvl:3, q:"Based on the exhibit, you must add a /27 for a new CCTV VLAN on HQ-R1 without overlapping anything shown. (10.20.2.0/25 and 10.20.2.128/26 are used at other sites.) Which subnet should you use?", ex:"HQ-R1#show ip route\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 8 subnets, 5 masks\nC        10.20.0.0/23 is directly connected, GigabitEthernet0/0\nL        10.20.0.1/32 is directly connected, GigabitEthernet0/0\nC        10.20.2.192/26 is directly connected, GigabitEthernet0/1\nL        10.20.2.193/32 is directly connected, GigabitEthernet0/1\nC        10.20.3.0/28 is directly connected, GigabitEthernet0/3\nL        10.20.3.1/32 is directly connected, GigabitEthernet0/3\nC        10.20.3.16/30 is directly connected, GigabitEthernet0/2\nL        10.20.3.17/32 is directly connected, GigabitEthernet0/2", o:["10.20.3.16/27","10.20.3.20/27","10.20.2.224/27","10.20.3.32/27"], a:3, why:"10.20.3.16 and .20 aren't /27 boundaries (multiples of 32); both fall in 10.20.3.0/27, which overlaps the /28 and the /30. 10.20.2.224/27 is inside 10.20.2.192/26. 10.20.3.32/27 (.32–.63) starts on a boundary and overlaps nothing."},
  {lvl:2, q:"Why does VLSM design allocate the largest subnets first?", o:["Routers process larger subnets faster","It keeps every next free address on a valid boundary for the next, smaller block, so there are no holes and no back-filling","Larger subnets must have lower addresses by RFC","It is the only order IOS accepts"], a:1, why:"Block sizes are powers of two. When each earlier block was at least as large as the next, the running total is always a multiple of the next block size, so allocation never skips addresses. Small-first leaves holes that must be tracked and back-filled."},
  {lvl:3, q:"A branch has 120 users today and expects 50% growth within two years. The block has plenty of free space. Which design is best for the user subnet?", o:["A /25 now, because 120 fits in 126 usable","A /24, because 180 users will not fit in a /25 and re-addressing a live subnet later is disruptive","A /26 now and a second /26 later","A /22, to be completely safe"], a:1, why:"120 × 1.5 = 180, more than a /25's 126 usable. A /24 (254 usable) covers the growth with margin. Re-addressing later means downtime and changes on every static device; a /22 wastes space the plan may need elsewhere."},
  {lvl:2, q:"Which statement about a /31 on a point-to-point link is true?", o:["It has one usable address","Both addresses are usable, because a two-ended link needs no network or broadcast address (RFC 3021)","It can only be used on IPv6 links","It is the same as a /30"], a:1, why:"RFC 3021 allows /31 masks on point-to-point links: there is no broadcast, and both addresses are assigned to the two ends. It halves the space links use compared with a /30."},
  {lvl:3, type:"multi", q:"An engineer's draft plan for 10.40.0.0/23 contains these rows. Which two are errors? (Choose two.)", o:["10.40.0.0/24 USERS","10.40.1.0/26 VOICE","10.40.1.48/28 PRINTERS","10.40.1.64/27 CCTV","10.40.1.90/30 WAN1"], a:[2,4], why:"10.40.1.48/28 sits inside VOICE (10.40.1.0/26 runs .0–.63), so it overlaps. 10.40.1.90 is not a multiple of 4, so it isn't a /30 network address (it's a host in 10.40.1.88/30, which is also inside CCTV .64–.95). The other three rows are aligned and don't overlap."},
],
cards:[
  {f:"FLSM vs VLSM", b:"FLSM: every subnet from a block has the same mask. VLSM: subnets from one block can have different masks, each sized to its own need."},
  {f:"Why FLSM fails for mixed needs", b:"It wastes addresses (a /26 for a 2-router link wastes 60) and often can't satisfy the list: 10.20.0.0/22 can't hold a 300-host VLAN plus seven other subnets with one mask."},
  {f:"The VLSM method", b:"List every need (with gateways and links), size each with 2^h − 2, sort largest first, allocate each at the next free address on a valid boundary, record the next free address."},
  {f:"The boundary rule", b:"A subnet must start at a multiple of its block size, so its host bits are all 0. A /26 starts at .0, .64, .128 or .192; 10.20.3.20/27 is not a network."},
  {f:"Why largest first?", b:"Block sizes are powers of two, so after larger blocks the next free address is always aligned for a smaller one: no holes, no back-filling, free space in one run at the end."},
  {f:"Point-to-point link prefixes", b:"/30: 4 addresses, 2 usable (classic, CCNA default). /31: 2 addresses, both usable (RFC 3021), common in large networks."},
  {f:"Sizing trap", b:"Use 2^h − 2, never 2^h. 62 fits a /26, but 63 or 64 needs a /25. 32 cameras need a /26, not a /27."},
  {f:"Checking a plan for overlaps", b:"Sort by network address; each network must be on its own boundary and greater than the previous row's broadcast. IOS only catches overlaps between interfaces on one router."},
  {f:"IOS overlap error", b:"Configuring an address inside a subnet already on another interface of the same router gives: % <network> overlaps with <interface>, and the address is refused."},
  {f:"What an IPAM row records", b:"Site, VLAN, name, subnet, gateway, DHCP range, static/reserved addresses, owner and notes — plus the next free address and largest free block for the whole plan."},
  {f:"Route summarisation", b:"Advertising one shorter-prefix route covering several contiguous subnets, e.g. 10.20.0.0/22 for 10.20.0.0/24 – 10.20.3.0/24. Smaller tables, fewer updates."},
  {f:"Finding a summary", b:"Write the changing octet in binary, count the leading bits all networks share, add the identical octets' bits; zero the rest. Clean only if the subnets fill a block that starts on its own boundary."},
  {f:"variably subnetted", b:"The show ip route header for a major network whose subnets use more than one mask, e.g. 10.0.0.0/8 is variably subnetted, 6 subnets, 4 masks (the /32 local routes count)."},
],
});
// ---------- Module 3 · Lesson 7 ----------
L.push({
id:"ip-verify", mins:90, level:"Beginner+ · builds on Module 3 lessons 1–6",
t:"Configuring, verifying and troubleshooting IPv4 addressing — and the Module 3 challenge",
html:`
${K.goals([
  "Address a router interface, a switch SVI and a host (Windows, <code>netsh</code>, Linux), and bring the interface up.",
  "Say what IOS refuses — overlapping subnets, network and broadcast addresses — and why.",
  "Verify both ends with <code>show ip interface brief</code>, <code>show ip interface</code>, <code>show running-config | include</code>, <code>show ip route connected</code> and <code>ipconfig /all</code>.",
  "Work addressing tickets with a repeatable method, and read each ping failure for the layer it points to.",
  "Find and fix six addressing faults in the Module 3 challenge, and write the ticket note.",
])}
${K.pre(["Module 3 lessons 2–6: address structure, masks and the AND, subnetting, the magic number and VLSM. You will calculate constantly.","Module 2: ARP and proxy ARP (lesson 4), the switch SVI and <code>ip default-gateway</code> (lesson 5), VLANs and the bottom-up ladder (lesson 7).","Module 1 lesson 8: IOS modes, <code>configure terminal</code> and saving."])}

<h2>Why this matters at work</h2>
<p>A new branch office in Port Harcourt opens on Monday. You have an addressing plan like the one you built in lesson 6, and a router still in its box. By lunchtime Finance say they &ldquo;can see each other but nothing else&rdquo;, Reception can't print to a printer two metres away, and the server team insist their box is fine.</p>
<p>None of these is a hardware fault. Each is a number typed in the wrong place: a mask one bit too long, a gateway copied from the wrong row, a router port nobody brought up. This lesson puts the right numbers on real devices, proves them from both ends, and finds the wrong one fast — ending with the Module 3 challenge: six faults, six unhappy users.</p>

<h2>Putting an address on a router interface</h2>
<p>Each router interface connects to one LAN, and its address does two jobs. It is the ${K.g("default gateway","The address a host sends packets to when the destination is not on its own subnet: the router's interface on the host's LAN (Module 2 lesson 4).")} for hosts on that LAN. And with its mask, it tells the router <b>which subnet is attached</b> to that interface. A wrong mask on the router gives it the wrong idea of where every address on that LAN lives.</p>
${K.out(`BR-R1#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
BR-R1(config)#interface g0/0
BR-R1(config-if)#description STAFF LAN 192.168.10.0/24
BR-R1(config-if)#ip address 192.168.10.1 255.255.255.0
BR-R1(config-if)#no shutdown
%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up
%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up
BR-R1(config-if)#end
BR-R1#copy running-config startup-config`, "Addressing one router interface: select it, describe it, address it, enable it, save.")}
<ul>
<li><b><code>interface g0/0</code></b> — interface configuration mode, <code>(config-if)</code>.</li>
<li><b><code>description</code></b> — for the next engineer; include the subnet.</li>
<li><b><code>ip address 192.168.10.1 255.255.255.0</code></b> — address, then the mask in <b>dotted decimal</b>. IOS rejects <code>192.168.10.1/24</code> here (Cisco's NX-OS accepts it, which is why you'll see both online).</li>
<li><b><code>no shutdown</code></b> — router interfaces start <b>administratively down</b>, unlike switch ports.</li>
<li><b>The two log lines</b> — Layer 1 (<code>LINK</code>), then Layer 2 (<code>LINEPROTO</code>) came up.</li>
</ul>
<p>Typing <code>ip address</code> again on the same interface <b>replaces</b> the address; no need to remove the old one. For the gateway, most teams use the <b>first usable</b> address (.1) or the <b>last</b> (.254 in a /24). Being consistent across sites matters more than which you pick.</p>
<h3>What IOS refuses — and why</h3>
<p><b>Rule 1: no two interfaces in the same subnet.</b> A router needs exactly one exit for every connected address. If two interfaces both covered 192.168.10.129, it couldn't choose a cable. So IOS refuses the second and names the first:</p>
${K.out(`BR-R1(config)#interface g0/1
BR-R1(config-if)#ip address 192.168.10.129 255.255.255.128
% 192.168.10.128 overlaps with GigabitEthernet0/0`, "Gi0/0 holds 192.168.10.0/24, which already contains .0 to .255 — including the requested 192.168.10.128/25.")}
<p>The fix is a <b>design</b> decision: perhaps Gi0/0 should be a /25 (.0–.127), or Gi0/1 belongs to another block. Check the plan.</p>
<p><b>Rule 2: the address must be a usable host.</b> Host bits all 0s (network address) or all 1s (broadcast address) can't belong to one device. IOS blames the mask, because the <i>combination</i> is wrong:</p>
${K.out(`BR-R1(config-if)#ip address 192.168.10.0 255.255.255.0
% Bad mask /24 for address 192.168.10.0
BR-R1(config-if)#ip address 192.168.20.63 255.255.255.192
% Bad mask /26 for address 192.168.20.63`, "192.168.10.0 is the network address of a /24; 192.168.20.63 is the broadcast address of 192.168.20.0/26.")}
<p>With a /24, .63 would be fine. With /26 (block size 64) it is the last address of the .0 block — its broadcast.</p>
${K.dyk(`The exception: on a point-to-point link between two routers, a <b>/31</b> has two addresses, and IOS lets you use <i>both</i> (on an Ethernet port it accepts the /31 with <code>% Warning: use /31 mask on non point-to-point interface cautiously</code>) — although by the normal rules one is the &ldquo;network&rdquo; and one the &ldquo;broadcast&rdquo;. RFC 3021 allows it because a link with exactly two ends needs neither. You'll meet it again with routing.`)}
${K.mistake(`Changing the mask until IOS stops complaining. If <code>ip address 192.168.20.63 255.255.255.192</code> is refused, <code>255.255.255.0</code> &ldquo;works&rdquo; — and gives the router a /24 that swallows three other subnets in your plan. When IOS refuses an address, find the number in the plan you misread.`)}
<p>IOS <b>can't</b> catch a valid address in the wrong subnet, a mask that differs from the hosts', or a host's duplicate. Those configure silently — hence the verifying sections.</p>
<h3>Try it: address a router and meet the overlap message</h3>
<p>Three LAN interfaces, described, no addresses. The design gives you 10.1.1.0/24 to split between two LANs. The second task is meant to be refused.</p>
${K.hint(`In interface mode you can jump to another interface by typing <code>interface g0/1</code> — no <code>exit</code> needed. Put <code>do</code> in front of a show command to run it from configuration mode.`)}
${K.term({env:"ios2", title:"address BR-R1 and read what IOS refuses", opts:{kind:"router", host:"BR-R1", model:"C1111-4P", motd:"BR-R1 — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","interface g0/0","description STAFF LAN","interface g0/1","description WAREHOUSE LAN","interface g0/2","description SPARE","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.log.length=0; e.mode="user"; },
  intro:"Router interfaces start shut. Read every <code>%</code> message — this lab wants one of them.",
  tasks:[
    {text:"<code>enable</code>, <code>configure terminal</code>, give Gi0/0 <code>10.1.1.1 255.255.255.0</code> and bring it up with <code>no shutdown</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/0"]; return i.ip==="10.1.1.1" && !i.shut && e.log.some(l=>/ip\s+add\S*\s+10\.1\.1\.1\s+255\.255\.255\.0\s*$/i.test(l.cmd||"")); }},
    {text:"A colleague's build sheet says Gi0/1 is <code>10.1.1.129 255.255.255.128</code>. Try it on Gi0/1 — which subnet does IOS say overlaps, and with what?", done:e=>e.log.some(l=>/overlaps with GigabitEthernet0\/0/.test(l.out||""))},
    {text:"The real design is two /25s. Correct Gi0/0 to <code>10.1.1.1 255.255.255.128</code>, then give Gi0/1 <code>10.1.1.129 255.255.255.128</code> and bring it up", done:e=>{ const a=e.intfs["GigabitEthernet0/0"], b=e.intfs["GigabitEthernet0/1"]; return a.ip==="10.1.1.1" && a.mask==="255.255.255.128" && b.ip==="10.1.1.129" && b.mask==="255.255.255.128" && !b.shut; }},
    {text:"<code>end</code>, then <code>show ip interface brief</code>. Which column would you need to check the subnet — and is it there?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(h))},
    {text:"See the masks: <code>show running-config | include interface|ip address</code> (or one interface at a time: <code>show ip interface g0/1</code>)", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+run\S*\s*\|\s*i\S*\s+\S/i.test(l.cmd||"") || /^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+(?!br)[a-z]/i.test(l.cmd||""))},
    {text:"Read what the router computed: <code>show ip route</code> (or just its connected and local routes: <code>show ip route connected</code>). Find the two <code>C</code> routes (10.1.1.0/25, 10.1.1.128/25) and two <code>L</code> routes", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro/i.test(h)) && e.intfs["GigabitEthernet0/1"].ip==="10.1.1.129"},
    {text:"Save with <code>write memory</code>", done:e=>!!e.savedOnce},
  ],
  win:"You addressed two interfaces, watched IOS refuse an overlap, fixed the design instead of fighting the message, and proved the result three ways: status, configured masks and connected routes.",
  solve:["enable","configure terminal","interface g0/0","ip address 10.1.1.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.1.1.129 255.255.255.128","interface g0/0","ip address 10.1.1.1 255.255.255.128","interface g0/1","ip address 10.1.1.129 255.255.255.128","no shutdown","end","show ip interface brief","show running-config | include interface|ip address","show ip route","write memory"]})}
${K.check({q:"Under Gi0/1 you type ip address 172.16.4.0 255.255.254.0 and IOS replies '% Bad mask /23 for address 172.16.4.0'. Why?", o:["/23 masks are not allowed on Ethernet","172.16.4.0 is the network address of 172.16.4.0/23","Gi0/1 overlaps with another interface","The interface is shut down"], a:1, why:"/23 has a block size of 2 in the third octet: 172.16.4.0–172.16.5.255, so 172.16.4.0 is the network address. 172.16.4.1 to 172.16.5.254 are usable — including 172.16.4.255."})}

<h2>Addressing switches and hosts</h2>
<p>The router is one end of each subnet. Every switch and host on the LAN is the other end, and must agree with it.</p>
<h3>A switch: SVI, mask and gateway</h3>
<p>From Module 2 lesson 5: a Layer 2 switch has one management address on an ${K.g("SVI","Switch Virtual Interface: the switch's own interface in a VLAN, such as interface vlan 20. It holds the management IP address.")}, plus a default gateway to answer other subnets:</p>
${K.out(`SW2(config)#interface vlan 20
SW2(config-if)#ip address 192.168.20.2 255.255.255.192
SW2(config-if)#no shutdown
SW2(config-if)#exit
SW2(config)#ip default-gateway 192.168.20.1`, "A Finance-floor switch: an address from the Finance subnet, the Finance mask, the Finance router interface as gateway.")}
<p>The SVI's address comes from the subnet <b>belonging to that VLAN</b> (VLAN 20 = Finance = 192.168.20.0/26), with the <b>same mask</b> as the router, and <code>ip default-gateway</code> is the router's address <b>in that subnet</b>. Physical switch ports take no IP address on a Layer 2 switch.</p>
<h3>A Windows host</h3>
<p>Servers, printers and network kit usually get ${K.g("static addresses","Addresses typed in by hand that never change, as opposed to ones leased automatically from a DHCP server.")}; user devices get theirs from ${K.g("DHCP","Dynamic Host Configuration Protocol: a server hands each device an address, mask, gateway and DNS servers automatically. Module 7 covers it.")}. By hand: <b>Network Connections</b> (<code>ncpa.cpl</code>) &rarr; adapter <b>Properties</b> &rarr; <b>Internet Protocol Version 4 (TCP/IPv4)</b> &rarr; <b>Properties</b> &rarr; <b>Use the following IP address</b>. Three fields matter here, plus DNS:</p>
<ul>
<li><b>IP address</b> — a usable, unused host address from the LAN's subnet.</li>
<li><b>Subnet mask</b> — the <i>same</i> mask the router uses on that LAN.</li>
<li><b>Default gateway</b> — the router interface's address on <i>this</i> LAN.</li>
</ul>
<p>Windows refuses a network or broadcast address (&ldquo;All of the bits in the host address portion &hellip; are set to 0&rdquo;, or 1). A gateway outside your subnet only earns a warning that it &ldquo;is not on the same network segment&rdquo; — and Windows saves it anyway, which causes many tickets. The Settings app asks for the same values. From an administrator prompt:</p>
${K.out(`C:\\>netsh interface ip set address name="Ethernet" static 192.168.10.40 255.255.255.0 192.168.10.1

C:\\>netsh interface ip set address name="Ethernet" dhcp`, "netsh: address, mask and gateway in one command; the second line returns the adapter to DHCP. PowerShell's New-NetIPAddress does the same with -PrefixLength.")}
<h3>A Linux host</h3>
${K.out(`$ sudo ip addr add 192.168.30.10/28 brd + dev eth0
$ sudo ip route add default via 192.168.30.1
$ ip -4 addr show dev eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.30.10/28 brd 192.168.30.15 scope global eth0`, "Linux uses prefix notation; the gateway is a default route. brd + asks ip to calculate the subnet's broadcast for you.")}
<p><code>brd 192.168.30.15</code> is a free check: .10/28 sits in .0–.15. These changes last until reboot (permanent ones live in netplan or <code>nmcli</code>), and <code>ip</code> will happily accept a broadcast address.</p>
${K.analogy(`<p>The <b>network part</b> is your street, the <b>host part</b> your house number; the <b>mask</b> says where one ends. The <b>gateway</b> is the post office for letters leaving your street — it must be <i>on</i> your street.</p>`)}
${K.when([
  ["Static","Routers, switches, servers, printers, cameras","Never changes; works when DHCP is down","Hundreds of user devices: typos multiply"],
  ["DHCP","User PCs, laptops, phones, guests","Consistent settings from one place (Module 7)","Devices other configs point at"],
  ["DHCP reservation","Printers you want fixed but centrally managed","Same address, one place to change it","It must work while DHCP is down"],
], "Static or DHCP — and when")}
<p>A Windows PC set to DHCP that gets no answer gives itself an ${K.g("APIPA","Automatic Private IP Addressing: the 169.254.x.y/16 address Windows assigns itself when DHCP gets no answer. It only reaches other 169.254 devices on the same LAN.")} address from 169.254.0.0/16. Treat it as a clue that DHCP failed, not that the cable did.</p>
${K.check({q:"The Finance VLAN uses 192.168.20.0/26 with the router at 192.168.20.1. Which switch management configuration is correct?", o:["interface vlan 20, ip address 192.168.20.2 255.255.255.0, ip default-gateway 192.168.20.1","interface vlan 20, ip address 192.168.20.2 255.255.255.192, ip default-gateway 192.168.20.1","interface g0/1, ip address 192.168.20.2 255.255.255.192","interface vlan 20, ip address 192.168.20.70 255.255.255.192, ip default-gateway 192.168.20.1"], a:1, why:"The SVI needs an address from the VLAN's subnet (.1–.62), the router's /26 mask and the router's Finance address as gateway. A /24 disagrees with the router, a Layer 2 port can't be addressed, and .70 is in the next /26."})}

<h2>Verifying: what the router believes, what the host believes</h2>
<p>A subnet works only when <b>both ends agree</b>. Read each end's view and check three things.</p>
${K.svg("0 0 720 300",
  K.band(20,8,300,26,"HOST VIEW · ipconfig /all")+K.band(400,8,300,26,"ROUTER VIEW · show ip interface · show ip route")+
  K.dev("pc",110,85,"HR-PC","Staff LAN")+K.dev("switch",360,85,"SW1","VLAN 1")+K.dev("router",590,85,"BR-R1","Gi0/0")+
  K.link(130,85,334,85)+K.link(386,85,566,85)+
  K.txt(20,160,"IPv4 Address 192.168.10.40",{c:"fg"})+K.txt(20,178,"Subnet Mask 255.255.255.0",{c:"fg"})+K.txt(20,196,"Default Gateway 192.168.10.1",{c:"fg"})+
  K.txt(400,160,"Internet address is 192.168.10.1/24",{c:"fg"})+K.txt(400,178,"C 192.168.10.0/24 ... Gi0/0",{c:"fg"})+K.txt(400,196,"L 192.168.10.1/32 ... Gi0/0",{c:"fg"})+
  K.box(20,226,220,56,"① same network","AND each address with its mask",true)+K.box(250,226,220,56,"② same mask","/24 at the host and the router",true)+K.box(480,226,220,56,"③ gateway = router's IP","192.168.10.1 lives on Gi0/0",true),
  "Verification is a comparison: the host's address, mask and gateway must match what the router's interface and connected route say about the same LAN.")}
<h3>show ip interface brief</h3>
${K.out(`BR-R1#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.10.1    YES manual up                    up
GigabitEthernet0/1     192.168.20.1    YES manual up                    up
GigabitEthernet0/2     192.168.30.1    YES manual administratively down down`, "One line per interface. Gi0/2 is addressed but still shut.")}
<p><code>manual</code> = typed in. Status/Protocol read as on a switch (Module 2 lesson 7): <code>administratively down</code> = <code>no shutdown</code> missing. What's <b>missing is the mask</b>: this command can't tell a /24 from a /26.</p>
<h3>show ip interface — the prefix</h3>
${K.out(`BR-R1#show ip interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  Internet address is 192.168.10.1/24
  Broadcast address is 255.255.255.255
  Address determined by non-volatile memory
  MTU is 1500 bytes
  Helper address is not set
  [... lines trimmed ...]
  Proxy ARP is disabled
  Local Proxy ARP is disabled
  [... lines trimmed ...]`, "show ip interface for one interface (trimmed).")}
<ul>
<li><b>Internet address is 192.168.10.1/24</b> — address <i>and</i> prefix: the line you came for. (<code>show interfaces g0/0</code> prints it too.)</li>
<li><b>Broadcast address is 255.255.255.255</b> — a trap: the address the router uses for broadcasts <i>it</i> sends, not the subnet's broadcast (192.168.10.255). Don't &ldquo;fix&rdquo; it.</li>
<li><b>Proxy ARP is disabled</b> — hardened with <code>no ip proxy-arp</code> (Module 2 lesson 4). Section 5 shows why that matters for mask faults.</li>
</ul>
<h3>show running-config | include — what was configured</h3>
${K.out(`BR-R1#show running-config | include interface|ip address
interface GigabitEthernet0/0
 ip address 192.168.10.1 255.255.255.0
interface GigabitEthernet0/1
 ip address 192.168.20.1 255.255.255.192
interface GigabitEthernet0/2
 ip address 192.168.30.1 255.255.255.240`, "Only lines matching either interface or ip address: each interface followed by its dotted mask.")}
<p>Every mask on one screen, as typed. It shows <b>intent</b>, not state: a shut interface still shows its address. Pair it with the next command, which shows what the router actually does.</p>
<h3>show ip route connected — what the router computed</h3>
${K.out(`BR-R1#show ip route connected
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       [... codes trimmed ...]

Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0
      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/26 is directly connected, GigabitEthernet0/1
L        192.168.20.1/32 is directly connected, GigabitEthernet0/1`, "Connected and local routes. Gi0/2's subnet is missing because Gi0/2 is down.")}
<ul>
<li><b>C — connected</b>: the router AND-ed the interface address with its mask and installed the result. <code>C 192.168.20.0/26</code> means &ldquo;192.168.20.0–.63 is out of Gi0/1&rdquo;. If it said <code>192.168.20.64/26</code>, the router's address would be in the wrong block, whatever the hosts think.</li>
<li><b>L — local</b>: a /32 for the interface's own address, so the router knows those packets are for itself.</li>
<li><b>Absent lines</b>: a connected route exists only while its interface is <b>up/up</b>. No <code>C 192.168.30.0/28</code> means the router drops traffic for the servers.</li>
</ul>
<h3>ipconfig /all — the host's side</h3>
${K.out(`C:\\Users\\hr.desk>ipconfig /all

Ethernet adapter Ethernet:

   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM
   Physical Address. . . . . . . . . : 00-50-9C-1A-2B-3C
   DHCP Enabled. . . . . . . . . . . : No
   IPv4 Address. . . . . . . . . . . : 192.168.10.40(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.20.1
   DNS Servers . . . . . . . . . . . : 192.168.30.10`, "HR-PC's view (trimmed). What disagrees with the router?")}
<p><b>DHCP Enabled: No</b> — a person typed these. <code>(Duplicate)</code> instead of <b>(Preferred)</b> would mean another device claims the address. The mask matches the router's /24. The <b>gateway is wrong</b>: 192.168.10.40 AND 255.255.255.0 = 192.168.10.0, and 192.168.20.1 isn't in it — it's the Finance gateway. This PC reaches its own LAN and nothing else.</p>
${K.exam(`Exam exhibits put <code>show ip interface brief</code> beside hosts' settings and ask which host can't reach the server. Two traps: the brief output has <b>no mask</b>, so find it elsewhere in the exhibit; and connected routes exist <b>only for up/up interfaces</b>. Then, for every host, do the AND, check the gateway is inside its subnet, and check that gateway is really the router's address.`)}
${K.check({q:"show ip route connected lists C 192.168.20.64/26 for Gi0/1. The Finance hosts are 192.168.20.10–.40 with gateway 192.168.20.1. What does this tell you?", o:["Everything matches","Gi0/1's address is in 192.168.20.64/26, the wrong block, so the hosts' gateway .1 doesn't exist","Gi0/1 is shut","The hosts need a /24 mask"], a:1, why:"The C route is the router's own calculation: Gi0/1's address is in .64–.127 (probably .65). The hosts are in .0–.63 and point at .1, which nothing owns. Fix the router interface, not the hosts."})}

<h2>Troubleshooting addressing faults: a method and the usual suspects</h2>
<p>Addressing faults are <b>arithmetic</b>: with the numbers from both ends, the answer is calculated, not guessed.</p>
${K.steps([
  ["Scope it", `<p><b>Who</b>, <b>what</b>, <b>what changed</b>? One PC points at its settings; a whole LAN at the router or switch.</p>`],
  ["Read the host", `<p><code>ipconfig /all</code> (or <code>ip addr</code> and <code>ip route</code>): address, mask, gateway, DHCP yes/no. <code>169.254</code> = DHCP didn't answer.</p>`],
  ["Do the arithmetic", `<p>Network, broadcast and usable range from the host's address and mask. Is the address <b>usable</b>? Does the mask <b>match</b> the plan? Is the gateway <b>inside</b> the range?</p>`],
  ["Read the router", `<p><code>show ip interface brief</code> (is the LAN's interface up/up?), then <code>show ip route connected</code>: same subnet, same mask, and is its address the host's gateway?</p>`],
  ["Ping from the inside out", `<p>Own address, gateway, the router's far interface, the target. The <b>first</b> failure, and <b>how</b> it fails, says where to look (below).</p>`],
  ["Check the Layer 2 path", `<p>Numbers agree but the gateway won't answer? Check the port's VLAN: <code>show vlan brief</code> (Module 2 lesson 7).</p>`],
  ["Fix one thing, re-test, record", `<p>Change one value, repeat the failing test, put before-and-after output in the ticket.</p>`],
])}
${K.remember(`<p>For every host: <b>&ldquo;Am I a house? Is this my street? Is my post office on my street?&rdquo;</b> — usable address, matching mask, gateway inside my subnet <i>and</i> owned by the router. Then ping from the inside out.</p>`)}
<div class="tablewrap"><table>
<tr><th>Fault</th><th>What the user sees</th><th>How you prove it</th><th>Fix</th></tr>
<tr><td>Mask too <b>wide</b> (/16 on a /24 LAN)</td><td>Local and gateway fine; some subnets fail</td><td>The target ANDs to the host's own network, so it ARPs for it directly</td><td>Correct the mask</td></tr>
<tr><td>Mask too <b>narrow</b> (/25 on a /24 LAN)</td><td>Some local hosts, often the gateway, unreachable</td><td>The host's range doesn't contain them</td><td>Correct the mask</td></tr>
<tr><td>Wrong default gateway</td><td>Local fine, nothing remote</td><td>Gateway isn't the router's address here, or isn't in the subnet</td><td>Correct the gateway</td></tr>
<tr><td>Network or broadcast address on a host</td><td>Nobody reaches it</td><td>Host bits all 0 or all 1</td><td>A usable, unused address</td></tr>
<tr><td>Duplicate address</td><td>Works, fails, works</td><td>Windows <code>(Duplicate)</code>; IOS <code>%IP-4-DUPADDR</code></td><td>Re-address one</td></tr>
<tr><td>Router interface shut or in the wrong subnet</td><td>A whole LAN can't leave</td><td>Brief shows it down; the C route doesn't match the plan</td><td><code>no shutdown</code>; correct the address</td></tr>
<tr><td>Wrong VLAN-to-subnet mapping</td><td>Gateway never answers</td><td>Port's VLAN and host's subnet don't belong together</td><td>Fix whichever side is wrong</td></tr>
<tr><td>DHCP not answering</td><td><code>169.254.x.y</code>, no gateway</td><td>DHCP Enabled Yes, Autoconfiguration IPv4 Address</td><td>Fix DHCP (Module 7)</td></tr>
</table></div>
<h3>Worked example: &ldquo;I can ping the gateway, but nothing else&rdquo;</h3>
<p>ACC-PC (192.168.10.30, mask 255.255.0.0, gateway .1) pings its gateway but not FIN1 at 192.168.20.10. The router has <code>no ip proxy-arp</code>.</p>
${K.steps([
  ["AND ACC-PC's address with its mask", `${K.out(`192.168.10.30   11000000.10101000.00001010.00011110
255.255.0.0     11111111.11111111.00000000.00000000
AND             11000000.10101000.00000000.00000000  = 192.168.0.0`)}<p>ACC-PC thinks 192.168.0.0 to 192.168.255.255 is all local.</p>`],
  ["AND the target with the same mask", `${K.out(`192.168.20.10   11000000.10101000.00010100.00001010
255.255.0.0     11111111.11111111.00000000.00000000
AND             11000000.10101000.00000000.00000000  = 192.168.0.0   same as mine`)}<p>Same network, so ACC-PC never uses its gateway: it ARPs for 192.168.20.10 on the Staff LAN.</p>`],
  ["Ask who answers that ARP", `<p>Nobody on the Staff LAN owns it. With proxy ARP (the IOS default) the router would answer with its own MAC and hide the fault. Here nobody answers: <code>Reply from 192.168.10.30: Destination host unreachable</code> — from its <b>own</b> address.</p>`],
  ["Compare with the right mask", `<p>With /24: 192.168.10.0 vs 192.168.20.0 — different, so the packet goes to the gateway. Fix: 255.255.255.0.</p>`],
])}
<h3>Your turn: four hosts, one gateway</h3>
<p>A LAN uses <b>172.16.40.0/25</b>; every host has gateway <b>172.16.40.1</b>. Which are correct?</p>
<ul>
<li><b>A</b> — 172.16.40.100, mask 255.255.255.128</li>
<li><b>B</b> — 172.16.40.130, mask 255.255.255.128</li>
<li><b>C</b> — 172.16.40.127, mask 255.255.255.128</li>
<li><b>D</b> — 172.16.40.50, mask 255.255.255.192</li>
</ul>
${K.hint(`/25: block size 128, blocks at .0 and .128. /26: block size 64, blocks at .0, .64, .128, .192. Find each host's block, then ask the three questions.`)}
${K.reveal("Answers — the four hosts worked through",`
<p><b>A — correct.</b> .100/25 is in .0–.127 (usable .1–.126); mask matches; .1 is inside.</p>
<p><b>B — wrong subnet.</b> 130 is in the .128 block (.129–.254): not this LAN, and the gateway is outside its range. A typo, or the wrong LAN — check the plan, then the switch port.</p>
<p><b>C — broadcast address.</b> .127 is the last address of .0/25. Windows would refuse it; a printer's web page might not. Give it an unused address from .2–.126.</p>
<p><b>D — mask too narrow.</b> .50/26 is in .0–.63, so the gateway is inside. But D treats .64–.127, half its own LAN, as remote and sends it via the router. Wrong either way: 255.255.255.128.</p>`)}
${K.drill({title:"is it in my subnet? find the range", types:["samesub","subnet"], count:5})}
${K.mistake(`Fixing the hosts to match a wrong router. If every Finance PC uses gateway 192.168.20.1 and the router has 192.168.20.65/26, change the router — one command — not forty PCs. Compare both ends with the <b>plan</b> before deciding which is wrong.`)}
<h3>Reading ping results, layer by layer</h3>
<p>You met these messages in Module 2 lesson 7; now each points at a specific mistake. Ask: <b>which device produced it, and how far did the packet get?</b></p>
${K.svg("0 0 740 250",
  [["127.0.0.1","own TCP/IP stack","fails: stack or","driver broken"],["own IP","192.168.10.40","fails: NIC disabled,","address not bound"],["gateway","192.168.10.1","fails: link, VLAN,","mask, wrong gateway"],["router far side","192.168.30.1","fails: gateway setting,","router interface"],["target","192.168.30.10","fails: far LAN, target's","mask/gw, return path"]]
  .map((r,i)=>{ const x = 10+i*148; return K.box(x,30,128,50,r[0],r[1],i===2)+K.txt(x+64,104,r[2],{mid:true,f:"body",s:10.5})+K.txt(x+64,119,r[3],{mid:true,f:"body",s:10.5})+(i<4?K.arrow(x+128,55,x+148,55):""); }).join("")+
  K.txt(370,160,"Ping each stop in order. The first one that fails is where the fault starts.",{mid:true,c:"fg",f:"body",s:12})+
  K.txt(370,185,"Everything before it is proven good, so you never need to check it again.",{mid:true,f:"body",s:11})+
  K.band(170,205,400,28,"inside-out: me → my gateway → the far side → the target"),
  "Inside-out ping testing: each successful stop removes a set of causes; the first failure tells you which layer and which device to look at.")}
<div class="tablewrap"><table>
<tr><th>What Windows ping says</th><th>Who produced it</th><th>Addressing causes to check</th></tr>
<tr><td><code>PING: transmit failed. General failure.</code></td><td>Your PC: it couldn't send at all</td><td>No link; no IP; off-subnet target with no usable gateway</td></tr>
<tr><td><code>Reply from <i>your own IP</i>: Destination host unreachable.</code></td><td>Your PC: its ARP for the next hop got no answer</td><td>Gateway nobody owns; router interface shut or in another subnet; mask too wide; wrong VLAN</td></tr>
<tr><td><code>Reply from <i>a router's IP</i>: Destination host unreachable.</code></td><td>A router: it has no route to that network. Cisco routers send ICMP <i>host</i> unreachable (code 1) for this — some other systems send <i>net</i> unreachable — so the clue is <b>who</b> replied: the router's address, not your own</td><td>The router's interface to that LAN is down (its C route vanished) or addressed in the wrong block, and no static or default route covers it</td></tr>
<tr><td><code>Request timed out.</code></td><td>Nobody: no reply came back</td><td>The far host's gateway or mask can't return the reply; a firewall</td></tr>
<tr><td><code>Reply from 192.168.30.10: ... TTL=127</code></td><td>The target</td><td>None. TTL 127, not 128 = one router in between</td></tr>
</table></div>
${K.out(`BR-R1#ping 192.168.30.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.30.10, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/2 ms`, "IOS ping: ! = reply, . = timeout. A U would mean an ICMP unreachable came back from a router.")}
<p>The first <code>.</code> is the router sending an ARP request for the server; <code>U.U.U</code> would be an upstream router answering &ldquo;unreachable&rdquo;. A router ping proves the router's side, not the user's PC.</p>
${K.q({type:"match", q:"A PC (192.168.10.30) pings a server on another subnet. Match each result with what it tells you.", pairs:[["PING: transmit failed. General failure.","The PC could not send at all"],["Reply from 192.168.10.30: Destination host unreachable.","The PC's own ARP for the next hop got no answer"],["Reply from 192.168.10.1: Destination host unreachable.","The gateway router has no route to the server's network"],["Request timed out.","The request left but no reply came back"],["Reply from 192.168.30.10: bytes=32 time<1ms TTL=127","It worked, through one router"]], why:"Ask who produced each message. The PC itself produces General failure (couldn't send) and 'unreachable' from its own IP (its ARP failed). The same 'host unreachable' words from the GATEWAY's IP mean a router took the packet but had no route — Cisco routers send ICMP host unreachable (code 1) for this, so read WHO replied, not just the words. A timeout means nobody answered — often the far end can't route its reply. TTL 127 from a Windows server (which starts at 128) means one hop."})}
<h3>Hands-on: build a branch and meet every failure on the way</h3>
<p>A new router, a PC and a server with incomplete settings. Work in task order, ping after each step and read the frame log: three different failures before it works.</p>
${K.bench({id:"m3-ping-layers", points:70, from:"CCNA · Module 3 · lesson 7", title:"address a branch and read every ping failure", viewBox:"0 0 760 420", openLog:true,
  intro:"Use <b>IP settings</b> and <b>Command Prompt</b> under PC-A and SRV1. YOUR LAPTOP is on NEW-R1's console (<b>Terminal app (PuTTY)</b>: 9600 8N1, no flow control). NEW-R1 has no enable secret and its interfaces are shut, like any new router.",
  devices:[
    {id:"r1", kind:"router", label:"NEW-R1", model:"ISR 1100 · new branch", x:20, y:20, config:e=>{ ["enable","configure terminal","hostname NEW-R1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:260, y:20},
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · branch LAN", x:20, y:170, config:e=>{ ["enable","configure terminal","hostname SW1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pca", kind:"pc", label:"PC-A", x:80, y:300, ip:"10.10.1.10", mask:"255.255.255.0"},
    {id:"srv", kind:"server", label:"SRV1", x:560, y:170, ip:"10.10.2.20", mask:"255.255.255.0"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g1"}, {type:"cat6", a:"pca:eth", b:"sw1:g2"}, {type:"cat6", a:"r1:g1", b:"srv:eth"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"On PC-A, run <code>ipconfig</code>, then <code>ping 10.10.2.20</code> (SRV1). PC-A has an address and mask but <b>no default gateway</b>. Which failure is it, and who produced it?", done:B=>Bench.tried(B,"pca",/^\s*ping\s+10\.10\.2\.20\s*$/i)},
    {text:"In PC-A's <b>IP settings</b>, add gateway <code>10.10.1.1</code>, then <code>ping 10.10.1.1</code>. A different failure: in the log, who did PC-A ask for 10.10.1.1, and who answered?", done:B=>B.devs.pca.gw==="10.10.1.1" && Bench.tried(B,"pca",/^\s*ping\s+10\.10\.1\.1\s*$/i)},
    {text:"Open the console to NEW-R1 and address it: Gi0/0 <code>10.10.1.1 255.255.255.0</code>, Gi0/1 <code>10.10.2.1 255.255.255.0</code>, <code>no shutdown</code> on both", done:B=>{ const i=B.devs.r1.env.intfs; const a=i["GigabitEthernet0/0"], b=i["GigabitEthernet0/1"]; return a.ip==="10.10.1.1" && a.mask==="255.255.255.0" && !a.shut && b.ip==="10.10.2.1" && b.mask==="255.255.255.0" && !b.shut; }},
    {text:"From PC-A, <code>ping 10.10.1.1</code> again — replies. Now <code>ping 10.10.2.20</code>: a third kind of failure. In the log, did the echo request reach SRV1? What happened to the reply?", done:B=>Bench.pinged(B,"pca","10.10.1.1") && B.devs.r1.env.intfs["GigabitEthernet0/1"].ip==="10.10.2.1"},
    {text:"Fix SRV1: in its <b>IP settings</b> add gateway <code>10.10.2.1</code>. Ping SRV1 from PC-A again — and note the TTL", done:B=>B.devs.srv.gw==="10.10.2.1" && Bench.pinged(B,"pca","10.10.2.20")},
    {text:"On NEW-R1, verify: <code>show ip interface brief</code> and <code>show ip route</code> — two <code>C</code> routes, two <code>L</code> routes", done:B=>{ const h=B.devs.r1.env.history; return h.some(x=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(x)) && h.some(x=>/^\s*(do\s+)?sh\S*\s+ip\s+ro/i.test(x)); }},
  ],
  win:"Three failures, three places: General failure (PC-A had no way off its subnet), Destination host unreachable (its ARP for a gateway that didn't exist yet went unanswered) and Request timed out (the request arrived, but SRV1 had no gateway for the reply). You fixed each at the device that produced it — the inside-out method, for real.",
  solve:[["pc","pca","ipconfig"],["pc","pca","ping 10.10.2.20"],["ip","pca","10.10.1.10","255.255.255.0","10.10.1.1"],["pc","pca","ping 10.10.1.1"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/0"],["term","ip address 10.10.1.1 255.255.255.0"],["term","no shutdown"],["term","interface g0/1"],["term","ip address 10.10.2.1 255.255.255.0"],["term","no shutdown"],["term","end"],
    ["pc","pca","ping 10.10.1.1"],["pc","pca","ping 10.10.2.20"],["ip","srv","10.10.2.20","255.255.255.0","10.10.2.1"],["pc","pca","ping 10.10.2.20"],["term","show ip interface brief"],["term","show ip route"],["term","write memory"]]})}
${K.q({type:"order", q:"A user's PC can't open a file on a server in another subnet. Put these tests in inside-out order.", items:["ipconfig /all — read address, mask and gateway, and do the arithmetic","Ping the PC's own IP address","Ping the default gateway","Ping the router's interface on the server's subnet","Ping the server","Test the real application (open the file share)"], why:"Settings first, because every result is read through them. Each ping then proves one more stretch: the PC's own address, the LAN and gateway, the router's forwarding, the far LAN and the server's return path. Last the application, because a working ping doesn't prove the share works."})}
${K.myth([
  ["If IOS accepted the ip address command, the address is right.","IOS only rejects overlaps, invalid masks and network/broadcast addresses. A valid address in the wrong subnet is accepted silently."],
  ["show ip interface brief proves an interface's addressing.","It shows no mask. Use show ip interface, the running-config or show ip route connected."],
  ["A PC that can ping its gateway is configured correctly.","A too-wide mask still passes that test. Ping a remote target too."],
  ["169.254.x.x means the cable is broken.","It means DHCP didn't answer. A broken cable shows 'Media disconnected'."],
])}
${K.dodont([
  "Compare both ends with the written plan before deciding which is wrong.",
  "Do the AND on paper for the host, its gateway and its target.",
  "Put the subnet in every router interface description.",
  "Check show ip route connected after every interface change.",
],[
  "Change a mask until IOS or Windows stops complaining.",
  "Re-address forty hosts when one router interface is wrong.",
  "Turn proxy ARP back on to 'fix' a host with a wrong mask.",
  "Leave a static address out of the plan.",
])}
${K.check({q:"A PC (10.6.1.25/16) pings its gateway, but pinging server 10.6.9.40 gives 'Reply from 10.6.1.25: Destination host unreachable.' Proxy ARP is off on the router. Most likely cause?", o:["The gateway address is wrong","The /16 mask makes 10.6.9.40 look local, so the PC ARPs for it directly and nobody answers","The server is switched off","The router's interface is shut"], a:1, why:"10.6.1.25 and 10.6.9.40 both AND to 10.6.0.0 with /16, so the PC never uses the gateway. The message comes from its own address: its ARP failed. The gateway ping proves the gateway and router interface are fine."})}

<h2>On the job: addressing tickets in the wild</h2>
${K.job("An MSP's morning ticket queue",`
<p>You're on an ${K.g("MSP","Managed Service Provider: runs other organisations' networks for a fee, from a Network Operations Centre (NOC).")} desk in Victoria Island. Three addressing tickets, one method.</p>
<h3>Ticket 6102 · 08:05 · Insurance broker, Ikeja — &ldquo;Internet down on one PC since the router swap&rdquo;</h3>
<p><b>Questions.</b> &ldquo;Only this PC? What changed?&rdquo; — <i>&ldquo;Only Tolu's. The ISP replaced the router on Friday.&rdquo;</i></p>
<p><b>Checks.</b> <code>ipconfig /all</code>: static 192.168.1.37/24, gateway <b>192.168.1.254</b>. Colleagues use DHCP with gateway 192.168.1.1. The old router was .254; <code>ping 192.168.1.254</code> gives <code>Destination host unreachable</code> from 192.168.1.37 — nothing owns it now.</p>
<p><b>Fix.</b> Set the NIC to DHCP (it's a user PC), <code>ipconfig /renew</code>: gateway .1, internet works.</p>
<p><b>What you say.</b> &ldquo;Your PC still pointed at the old router. It now configures itself automatically.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Static gw .254 (old ISP router); new router .1. NIC to DHCP, lease .112/24 gw .1; web and mail tested with user. Recommend static-host audit. 12 min.&rdquo;</i></p>
<h3>Ticket 6107 · 08:40 · Supermarket, Lekki — &ldquo;Can't reach the new CCTV recorder&rdquo;</h3>
<p><b>Checks.</b> The vendor's sheet: NVR <b>192.168.50.127</b>, mask 255.255.255.128. The CCTV subnet is 192.168.50.0/25 (.0–.127), so <b>.127 is the broadcast address</b>; the NVR's web page accepted it. Its MAC is in <code>show mac address-table interface Gi1/0/22</code>, so link and VLAN are fine.</p>
<p><b>Fix.</b> With the vendor on the phone, re-address to 192.168.50.20 (next free in the plan). The recorder app connects.</p>
<p><b>What you say.</b> &ldquo;The recorder had the one address reserved for messages to every device at once. It's on a normal address now.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;NVR 192.168.50.127/25 = subnet broadcast. Re-addressed .20/25 gw .1; live view OK; plan updated; vendor briefed. 25 min.&rdquo;</i> (But in 10.8.4.0/23, 10.8.4.255 is a normal host: calculate, never judge by the last octet.)</p>
<h3>Ticket 6111 · 09:15 · Clinic, Garki, Abuja — &ldquo;Three lab laptops have no network&rdquo;</h3>
<p><b>Questions.</b> &ldquo;Anything overnight?&rdquo; — <i>&ldquo;A long power cut; the generator only started this morning.&rdquo;</i></p>
<p><b>Checks.</b> <code>ipconfig /all</code>: DHCP Enabled Yes, <code>Autoconfiguration IPv4 Address 169.254.81.207</code>, no gateway. The link is up (no <code>Media disconnected</code>), so DHCP isn't answering. The DHCP server isn't on the UPS and never came back.</p>
<p><b>Fix.</b> Powered on; laptops get 10.12.3.x leases. Change request to move it onto the UPS. (DHCP is Module 7.)</p>
<p><b>Ticket note.</b> <i>&ldquo;3 laptops APIPA, link up. DHCP server off after outage. Powered on; leases OK. CR-2291 for UPS. 30 min.&rdquo;</i></p>
`)}
${K.dyk(`When two devices claim one address, a Cisco router logs it: <code>%IP-4-DUPADDR: Duplicate address 192.168.10.1 on GigabitEthernet0/0, sourced by 00aa.bb00.00ff</code>. The last field is the impostor's MAC — look it up in the switch's MAC address table (Module 2 lesson 7) to find its port.`)}
${K.case("The re-plan that broke a head office on a Tuesday",`
<p>A logistics company in Apapa ran its head office on one flat 10.20.0.0/22. Over a weekend the team moved to a VLSM plan (lesson 6) — separate /24s for staff, warehouse, CCTV and servers — re-addressing the router and the DHCP scopes. Monday was fine.</p>
<p>Tuesday, a security baseline added <code>no ip proxy-arp</code> on every router interface. By 09:30 the warehouse scanners, half the cameras, two label printers and the building management system had dropped off.</p>
<p>The baseline wasn't the cause. Forty <b>static</b> devices still had the old /22 mask and sent ARP requests directly for anything in 10.20.0.0–10.20.3.255; since Saturday the router had been answering with proxy ARP. The baseline removed the crutch and exposed them all at once.</p>
<p>New change rules: <b>an addressing change includes every static host</b>; inventory them first (<code>show ip arp</code> and the MAC tables help); and disable proxy ARP <i>before</i> a re-plan, so hidden mask faults surface while the team is on site.</p>`)}

<h2>The Module 3 challenge</h2>
<p>The Port Harcourt branch, opening morning. BR-R1 has three LAN interfaces; SW1 serves Staff (VLAN 1); SW2 carries Finance (VLAN 20) and servers (VLAN 30), each on its own router port. The design below is correct — the devices aren't:</p>
<div class="tablewrap"><table>
<tr><th>LAN</th><th>Switch · VLAN</th><th>Subnet</th><th>Mask</th><th>Gateway (BR-R1)</th><th>Fixed addresses</th></tr>
<tr><td>Staff</td><td>SW1 · 1</td><td>192.168.10.0/24</td><td>255.255.255.0</td><td>.1 (Gi0/0)</td><td>SW1 .2 · PRN-STAFF .20 · ACC-PC .30 · HR-PC .40 · RECEPTION .150</td></tr>
<tr><td>Finance</td><td>SW2 · 20</td><td>192.168.20.0/26</td><td>255.255.255.192</td><td>.1 (Gi0/1)</td><td>SW2 .2 · FIN1 .10 · FIN2 .11</td></tr>
<tr><td>Servers</td><td>SW2 · 30</td><td>192.168.30.0/28</td><td>255.255.255.240</td><td>.1 (Gi0/2)</td><td>SRV-FILE .10</td></tr>
</table></div>
<p><b>Six independent addressing faults</b> sit on the router and the hosts; cabling, switch ports and VLANs are as designed. For each complaint: read the host, do the arithmetic, read the router, ping inside-out. Some complaints clear only once a shared fault is fixed.</p>
${K.tip(`Hints cost nothing, but give each complaint ten minutes first. Write each host's network and broadcast address on paper as you go.`)}
${K.bench({id:"m3-challenge", points:150, challenge:true, from:"CCNA · Module 3 · lesson 7", title:"Module 3 challenge — opening day at the Port Harcourt branch", viewBox:"0 0 940 500",
  intro:"YOUR LAPTOP is on BR-R1's console (9600 8N1, no flow control); move the cable to SW1 or SW2 when you need them. Enable secret on all three: <code>Branch26</code>. Use <b>IP settings</b> and <b>Command Prompt</b> under each PC and SRV-FILE; PRN-STAFF is correct and can't be changed. BR-R1 follows the MSP's hardened baseline — <code>no ip proxy-arp</code> on every interface — so no router covers for a broken host.",
  devices:[
    {id:"r1", kind:"router", label:"BR-R1", model:"ISR 1100 · comms room", x:280, y:20,
      ports:[{id:"g0", type:"rj45", label:"G0/0", ios:"GigabitEthernet0/0"},{id:"g1", type:"rj45", label:"G0/1", ios:"GigabitEthernet0/1"},{id:"g2", type:"rj45", label:"G0/2", ios:"GigabitEthernet0/2"},{id:"con", type:"console", label:"CON"}],
      config:e=>{ ["enable","configure terminal","hostname BR-R1","enable secret Branch26",
        "interface g0/0","description STAFF LAN 192.168.10.0/24 to SW1 Gi0/1","ip address 192.168.10.1 255.255.255.0","no ip proxy-arp","no shutdown",
        "interface g0/1","description FINANCE LAN 192.168.20.0/26 to SW2 Gi0/1","ip address 192.168.20.65 255.255.255.192","no ip proxy-arp","no shutdown",
        "interface g0/2","description SERVERS 192.168.30.0/28 to SW2 Gi0/2","ip address 192.168.30.1 255.255.255.240","no ip proxy-arp","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:540, y:20},
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · Staff", x:20, y:200,
      config:e=>{ ["enable","configure terminal","hostname SW1","enable secret Branch26","interface g0/1","description BR-R1 G0/0","interface g0/2","description RECEPTION","interface g0/3","description HR-PC","interface g0/4","description ACC-PC","interface g0/5","description PRN-STAFF",
        "interface vlan 1","ip address 192.168.10.2 255.255.255.0","no shutdown","exit","ip default-gateway 192.168.10.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · Finance and servers", x:500, y:200,
      config:e=>{ ["enable","configure terminal","hostname SW2","enable secret Branch26","vlan 20","name FINANCE","vlan 30","name SERVERS","exit",
        "interface g0/1","description BR-R1 G0/1 (Finance)","switchport mode access","switchport access vlan 20","interface g0/2","description BR-R1 G0/2 (Servers)","switchport mode access","switchport access vlan 30",
        "interface g0/3","description FIN1","switchport mode access","switchport access vlan 20","interface g0/4","description FIN2","switchport mode access","switchport access vlan 20","interface g0/5","description SRV-FILE","switchport mode access","switchport access vlan 30",
        "interface vlan 20","ip address 192.168.20.2 255.255.255.192","no shutdown","exit","ip default-gateway 192.168.20.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"rec", kind:"pc", label:"RECEPTION", x:20, y:370, ip:"192.168.10.150", mask:"255.255.255.128", gw:"192.168.10.1"},
    {id:"hr", kind:"pc", label:"HR-PC", x:135, y:370, ip:"192.168.10.40", mask:"255.255.255.0", gw:"192.168.20.1"},
    {id:"acc", kind:"pc", label:"ACC-PC", x:250, y:370, ip:"192.168.10.30", mask:"255.255.0.0", gw:"192.168.10.1"},
    {id:"prn", kind:"printer", label:"PRN-STAFF", x:365, y:370, ip:"192.168.10.20", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"fin1", kind:"pc", label:"FIN1", x:520, y:370, ip:"192.168.20.10", mask:"255.255.255.192", gw:"192.168.20.1"},
    {id:"fin2", kind:"pc", label:"FIN2", x:640, y:370, ip:"192.168.30.12", mask:"255.255.255.240", gw:"192.168.30.1"},
    {id:"srv", kind:"server", label:"SRV-FILE", x:760, y:370, ip:"192.168.30.10", mask:"255.255.255.240", gw:"192.168.30.1"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g1"}, {type:"cat6", a:"r1:g1", b:"sw2:g1"}, {type:"cat6", a:"r1:g2", b:"sw2:g2"},
           {type:"cat6", a:"rec:eth", b:"sw1:g2"}, {type:"cat6", a:"hr:eth", b:"sw1:g3"}, {type:"cat6", a:"acc:eth", b:"sw1:g4"}, {type:"cat6", a:"prn:eth", b:"sw1:g5"},
           {type:"cat6", a:"fin1:eth", b:"sw2:g3"}, {type:"cat6", a:"fin2:eth", b:"sw2:g4"}, {type:"cat6", a:"srv:eth", b:"sw2:g5"}, {type:"console", a:"lap:usb", b:"r1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Reception:</b> &ldquo;I can't print to PRN-STAFF — and now I can't even reach the router.&rdquo; <i>Done when RECEPTION can ping PRN-STAFF (192.168.10.20) and its gateway (192.168.10.1).</i>", hint:"Run ipconfig on RECEPTION and on HR-PC next to it. Work out RECEPTION's network and broadcast address from its address and mask. Which addresses does it believe are local — and are 192.168.10.20 and 192.168.10.1 among them?", done:B=>Bench.pinged(B,"rec","192.168.10.20") && Bench.pinged(B,"rec","192.168.10.1")},
    {text:"<b>HR:</b> &ldquo;Printing is fine, but the payroll share on SRV-FILE won't open.&rdquo; <i>Done when HR-PC can ping SRV-FILE (192.168.30.10).</i>", hint:"Printing works, so HR-PC's address and mask are fine for its own LAN. Where does it send packets for other subnets? Compare its Default Gateway with BR-R1's Staff interface in show ip interface brief. If HR-PC looks right and the ping changes to 'Reply from 192.168.10.1: Destination host unreachable', BR-R1 took the packet but has no route to the servers' subnet: read the server team's complaint.", done:B=>Bench.pinged(B,"hr","192.168.30.10")},
    {text:"<b>Accounts (ACC-PC):</b> &ldquo;I can ping the gateway and print, but FIN1's shared folder won't open.&rdquo; <i>Done when ACC-PC can ping FIN1 (192.168.20.10).</i>", hint:"The gateway answers, so the gateway setting is right. AND 192.168.20.10 with ACC-PC's mask: does ACC-PC think FIN1 is local or remote? If local, it ARPs for FIN1 on the Staff LAN — and with proxy ARP off, who would answer? Once ACC-PC is right, a 'Destination host unreachable' from 192.168.10.1 means BR-R1 itself has no route to FIN1's subnet: Finance has its own problem.", done:B=>Bench.pinged(B,"acc","192.168.20.10")},
    {text:"<b>Finance (FIN1):</b> &ldquo;My PC still opens the Finance switch's page, but I can't print to PRN-STAFF or reach anything outside Finance.&rdquo; <i>Done when FIN1 can ping its gateway (192.168.20.1) and PRN-STAFF (192.168.10.20).</i>", hint:"FIN1's settings match the plan exactly. So who should own 192.168.20.1? Read BR-R1's show ip route connected (or show ip interface g0/1, or show running-config | include interface|ip address): which block is Gi0/1 really in?", done:B=>Bench.pinged(B,"fin1","192.168.20.1") && Bench.pinged(B,"fin1","192.168.10.20")},
    {text:"<b>Server team:</b> &ldquo;SRV-FILE is healthy, but it can't reach its gateway and nobody outside the server room can reach it.&rdquo; <i>Done when SRV-FILE can ping 192.168.30.1 and PRN-STAFF (192.168.10.20).</i>", hint:"SRV-FILE's settings match the plan. Is there a connected route for 192.168.30.0/28 in BR-R1's routing table? If not, read the Status column of show ip interface brief for Gi0/2 — not only its address.", done:B=>Bench.pinged(B,"srv","192.168.30.1") && Bench.pinged(B,"srv","192.168.10.20")},
    {text:"<b>Finance (FIN2, new PC):</b> &ldquo;IT built my PC yesterday. It can't reach anything — not even FIN1 at the next desk.&rdquo; <i>Done when FIN2 can ping FIN1 (192.168.20.10) and PRN-STAFF (192.168.10.20).</i>", hint:"FIN2 is on SW2 Gi0/4. Which VLAN is that port in (show vlan brief on SW2), and which subnet belongs to that VLAN in the plan? Now compare FIN2's ipconfig. Which side is wrong — the switch port or the PC? (Reaching PRN-STAFF also needs Finance's gateway to exist.)", done:B=>Bench.pinged(B,"fin2","192.168.20.10") && Bench.pinged(B,"fin2","192.168.10.20")},
  ],
  win:"Six addressing faults — a mask too narrow, a gateway in another subnet, a mask too wide, a router interface in the wrong block, a router interface left shut and a host built with another VLAN's subnet — each found by reading both ends and doing the arithmetic. That's opening day at a real branch, handled properly.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Branch26"],["term","show ip interface brief"],["term","show running-config | include interface|ip address"],["term","show ip route"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip address 192.168.20.1 255.255.255.192"],["term","interface g0/2"],["term","no shutdown"],["term","end"],["term","show ip route"],["term","write memory"],
    ["pc","rec","ipconfig"],["ip","rec","192.168.10.150","255.255.255.0","192.168.10.1"],["ip","hr","192.168.10.40","255.255.255.0","192.168.10.1"],["ip","acc","192.168.10.30","255.255.255.0","192.168.10.1"],["ip","fin2","192.168.20.11","255.255.255.192","192.168.20.1"],
    ["pc","rec","ping 192.168.10.20"],["pc","rec","ping 192.168.10.1"],["pc","hr","ping 192.168.30.10"],["pc","acc","ping 192.168.20.10"],["pc","fin1","ping 192.168.20.1"],["pc","fin1","ping 192.168.10.20"],
    ["pc","srv","ping 192.168.30.1"],["pc","srv","ping 192.168.10.20"],["pc","fin2","ping 192.168.20.10"],["pc","fin2","ping 192.168.10.20"]]})}
${K.hint(`Where to begin? The router, because it's shared: <code>show ip interface brief</code> and <code>show ip route</code> on BR-R1, line by line against the plan. Then host by host with <code>ipconfig</code> and a pencil.`)}
${K.reveal("Instructor walkthrough · Reception's printing complaint",`
<p><b>Found:</b> RECEPTION is 192.168.10.150 with mask <b>255.255.255.128</b>. /25 blocks are .0 and .128, so its subnet is .128–.255: the printer (.20) and gateway (.1) are in the other half, and pings fail with <code>General failure</code>. HR-PC and the router (<code>C 192.168.10.0/24</code>) use /24.</p>
<p><b>Fix:</b> mask 255.255.255.0. <b>Proof:</b> pings to .20 and .1 reply.</p>
<p class="small"><b>On real PCs the symptom can vary.</b> When you save a gateway outside the PC's own subnet, Windows warns that the default gateway isn't on the same network segment, then lets you keep it. What happens next depends on the Windows version and the router (some builds still ARP for the off-subnet gateway, and a router with proxy ARP on may answer), so you may see failures, partial success or ICMP redirects instead of a clean <code>General failure</code>. Don't rely on the exact message: the mask and gateway must match the plan.</p>`)}
${K.reveal("Instructor walkthrough · HR's payroll complaint",`
<p><b>Found:</b> HR-PC prints, so 192.168.10.40/24 is fine locally. Its gateway is <b>192.168.20.1</b> — the Finance gateway, from the wrong row — outside 192.168.10.0/24, so HR-PC has no way off its LAN.</p>
<p><b>Fix:</b> gateway 192.168.10.1. SRV-FILE stays unreachable until Gi0/2 is also fixed — two faults on one path. Until then the ping changes from <code>General failure</code> to <code>Reply from 192.168.10.1: Destination host unreachable.</code>: progress, because the gateway now takes the packet and BR-R1 reports it has no route to 192.168.30.0/28. <b>Proof:</b> SRV-FILE replies with TTL 127.</p>`)}
${K.reveal("Instructor walkthrough · Accounts' Finance-share complaint",`
<p><b>Found:</b> the gateway answers, so .1 is right. The mask is <b>255.255.0.0</b>: 192.168.10.30 and 192.168.20.10 both AND to 192.168.0.0, so ACC-PC ARPs for FIN1 on the Staff LAN and, with proxy ARP off, nobody answers: <code>Destination host unreachable</code> from its own address.</p>
<p><b>Fix:</b> mask 255.255.255.0. Until Gi0/1 is corrected the ping now reads <code>Reply from 192.168.10.1: Destination host unreachable.</code>: ACC-PC uses its gateway, but BR-R1 only has <code>C 192.168.20.64/26</code>, so it has no route to FIN1's 192.168.20.0/26. It reaches FIN1 once Gi0/1 is fixed (next walkthrough).</p>`)}
${K.reveal("Instructor walkthrough · Finance's &ldquo;nothing outside Finance&rdquo; complaint",`
<p><b>Found:</b> FIN1 matches the plan, but <code>ping 192.168.20.1</code> gives <code>Destination host unreachable</code>: nothing owns .1. On BR-R1, Gi0/1 is <b>192.168.20.65</b>, up/up, and <code>show ip route</code> shows <code>C 192.168.20.64/26</code> — the second /26 block. Someone typed the next block's first address.</p>
<p><b>Fix:</b> <code>interface g0/1</code>, <code>ip address 192.168.20.1 255.255.255.192</code> (it replaces .65); the route becomes <code>C 192.168.20.0/26</code>. One command fixes every Finance host.</p>`)}
${K.reveal("Instructor walkthrough · the server team's complaint",`
<p><b>Found:</b> SRV-FILE matches the plan, but .1 doesn't answer. BR-R1 has no <code>C 192.168.30.0/28</code> route, and <code>show ip interface brief</code> shows Gi0/2 <b>administratively down</b>: addressed, never enabled. No connected route, so the router drops all traffic for the servers and tells each sender so: HR-PC, once its gateway is fixed, sees <code>Reply from 192.168.10.1: Destination host unreachable.</code></p>
<p><b>Fix:</b> <code>interface g0/2</code>, <code>no shutdown</code>. <b>Proof:</b> up/up, the C route appears, SRV-FILE pings .1 and PRN-STAFF.</p>`)}
${K.reveal("Instructor walkthrough · FIN2's &ldquo;can't reach anything&rdquo; complaint",`
<p><b>Found:</b> FIN2 is 192.168.30.12/28, gateway 192.168.30.1 — the <i>server</i> subnet's values, copied from the server build sheet. SW2's <code>show vlan brief</code> puts Gi0/4 in VLAN 20 (FINANCE): the port is right, the PC is wrong. FIN2 ARPs for 192.168.30.1 inside VLAN 20, where nothing owns it.</p>
<p><b>Fix:</b> 192.168.20.11, 255.255.255.192, gateway 192.168.20.1. Then <code>write memory</code> on BR-R1 and a ticket note: <i>&ldquo;BR-R1 Gi0/1 .65 → 192.168.20.1/26; Gi0/2 no shut. RECEPTION /25 → /24. HR-PC gw → 192.168.10.1. ACC-PC /16 → /24. FIN2 → 192.168.20.11/26 (had servers subnet). All six users tested; saved.&rdquo;</i></p>`)}

<h2>Interview corner</h2>
${K.hint(`Show a method: the host's three settings, the arithmetic, the router's view, then inside-out pings.`)}
${K.reveal("&ldquo;A user can ping their gateway but nothing else. What do you check?&rdquo;",`<p>&ldquo;A gateway ping proves the link, VLAN, address and gateway, so I look at what changes when traffic leaves the subnet. In <code>ipconfig /all</code>: is the <b>mask</b> too wide? A /16 on a /24 LAN makes remote addresses look local, so the PC ARPs for them directly, which fails without proxy ARP. Is the gateway really our router, not a duplicate? Then I ping the router's far interface, then the target: if the far interface answers and the target doesn't, the fault is on the far LAN or in the target's own settings. <code>show ip route</code> tells me whether the router has a route at all.&rdquo;</p>`)}
${K.hint(`Name the commands, what each shows — and which one hides the mask.`)}
${K.reveal("&ldquo;How do you verify an interface's IP address and mask on a Cisco router?&rdquo;",`<p>&ldquo;<code>show ip interface brief</code> gives every interface's address and status, but no mask. For the mask: <code>show ip interface g0/1</code> (&lsquo;Internet address is 192.168.20.1/26&rsquo;), or <code>show running-config | include interface|ip address</code> for every interface at once. Then <code>show ip route connected</code> proves what the router does with it: a C route for the subnet and an L /32 for itself, only while the interface is up/up. Last, I compare with the hosts' <code>ipconfig</code>.&rdquo;</p>`)}
${K.hint(`What the range means, what it rules out, and the next step.`)}
${K.reveal("&ldquo;A Windows laptop shows 169.254.x.x. What does that tell you?&rdquo;",`<p>&ldquo;It's APIPA: the laptop asked DHCP, got no answer, and gave itself a 169.254.0.0/16 address with no gateway. So the link is up — a cable fault shows Media disconnected — but DHCP isn't reaching it. If the whole LAN has it, I check the DHCP server, the router's relay or the uplink; if it's one laptop, its switch port's VLAN. A static address is only a documented stopgap.&rdquo;</p>`)}

${K.recap([
  "Router interface: interface, description, ip address with a dotted mask, no shutdown, verify, save.",
  "IOS refuses overlaps ('% x overlaps with ...') and network or broadcast addresses ('% Bad mask /n for address ...'). A wrong but valid address is accepted.",
  "Hosts and SVIs: a usable address from the LAN's subnet, the router's mask, and the router's address on that LAN as gateway.",
  "show ip interface brief has no mask: use show ip interface, the filtered running-config, and show ip route connected (C = subnet, L = own /32, only when up/up).",
  "Method: scope, read the host, do the arithmetic, read the router, ping inside-out, check the VLAN, fix one thing, record.",
  "General failure = couldn't send. Unreachable from your own IP = your ARP failed. Unreachable from a router's IP = that router has no route. Timed out = no reply came back.",
  "Proxy ARP hides too-wide masks. 169.254.x.x = DHCP didn't answer.",
])}
${K.next(`<b>Module 4 — VLANs, trunks and Spanning Tree.</b> Every subnet in this module lived in a VLAN: Staff in 1, Finance in 20, servers in 30. Next you'll build those VLANs properly, carry several over one trunk between switches, and see how Spanning Tree stops the loops redundant links would create.`)}
`,
quiz:[
  {type:"fill", q:"You are in interface configuration mode for Gi0/1. Type the command that gives it the first usable address of 172.16.8.0/22.", fields:[{label:"Command", a:["ip address 172.16.8.1 255.255.252.0"], ios:true}], why:"/22 = 255.255.252.0 (22 ones: two octets of 255, then 11111100 = 252, then 0). 172.16.8.0/22 runs from 172.16.8.0 to 172.16.11.255, so the first usable address is 172.16.8.1. IOS needs the mask in dotted decimal, not /22.", lvl:2},
  {q:"A new router's Gi0/0 has an IP address and mask, but show ip interface brief shows it as 'administratively down down'. What is missing?", o:["A description","The no shutdown command","A default gateway","copy running-config startup-config"], a:1, why:"Router interfaces start shut. administratively down means shutdown is in effect; no shutdown enables the interface. A description is documentation, routers don't use ip default-gateway for their own interfaces, and saving doesn't change the state.", lvl:1},
  {q:"While configuring Gi0/1 you type ip address 10.20.0.130 255.255.255.128 and IOS replies '% 10.20.0.128 overlaps with GigabitEthernet0/0'. What does this tell you?", o:["Gi0/0 is shut down","A host on the Gi0/1 LAN already uses 10.20.0.130","Gi0/0 is already configured with a subnet that contains 10.20.0.128/25, so two interfaces would cover the same addresses","255.255.255.128 is not a valid mask"], a:2, why:"IOS refuses an address whose subnet overlaps the subnet of another interface, because the router needs one exit for every connected address. Gi0/0 probably holds a /24 such as 10.20.0.1/24, which contains .128-.255. Fix the design: either Gi0/0 should be a /25, or Gi0/1 belongs to a different block. IOS knows nothing about hosts' addresses.", lvl:2},
  {q:"What explains the IOS response in the exhibit?", ex:"BR-R1(config)#interface g0/2\nBR-R1(config-if)#ip address 192.168.30.15 255.255.255.240\n% Bad mask /28 for address 192.168.30.15", o:["/28 is not allowed on Ethernet interfaces","With a /28 mask, 192.168.30.15 is the broadcast address of 192.168.30.0/28, so it can't be an interface address","The address overlaps with another interface","The interface must be shut before its address can change"], a:1, why:"/28 has a block size of 16: 192.168.30.0-.15 is the first block, so .15 is its broadcast address. IOS reports a network or broadcast address as a bad mask because the address is fine with other masks; it's the combination that is invalid. A usable choice here would be .1 to .14.", lvl:2},
  {type:"multi", q:"Which two commands show you the subnet mask configured on a router's Gi0/0? (Choose two.)", o:["show ip interface brief","show ip interface GigabitEthernet0/0","show running-config | include interface|ip address","show ip arp","show vlan brief"], a:[1,2], why:"show ip interface Gi0/0 prints 'Internet address is x.x.x.x/prefix', and the filtered running-config shows each interface's ip address line with its dotted mask. show ip interface brief shows the address and status but no mask; show ip arp lists IP-to-MAC mappings; show vlan brief is a switch command about VLAN membership.", lvl:1},
  {type:"match", q:"Match each line of router output with its meaning.", pairs:[["C 192.168.10.0/24 ... Gi0/0","The subnet attached to an up/up interface"],["L 192.168.10.1/32 ... Gi0/0","The router's own address on that interface"],["! in IOS ping output","An echo reply was received"],[". in IOS ping output","No reply arrived before the timeout"],["U in IOS ping output","A router sent back an ICMP unreachable"]], why:"C routes are the networks the router computed from each up/up interface's address and mask; L routes are /32s for the router's own addresses. In IOS ping output, ! is a reply, . a timeout (the first one is often ARP), and U an ICMP unreachable message from a router on the path.", lvl:1},
  {type:"order", q:"A user can't reach a server on another subnet. Put these ping tests in inside-out order.", items:["Ping 127.0.0.1 (the host's own TCP/IP stack)","Ping the host's own IP address","Ping the default gateway","Ping the router's interface on the server's subnet","Ping the server"], why:"Each test proves one more stretch of the path: the stack, the host's own address, the local LAN and gateway, the router's forwarding to the far interface, and finally the far LAN and the server's return path. The first test that fails tells you where to start looking.", lvl:2},
  {q:"HR-PC prints to a printer on its own LAN but cannot reach any other subnet. Based on the exhibit, what is the fault?", ex:"C:\\>ipconfig\n\nEthernet adapter Ethernet:\n   IPv4 Address. . . . . . . . . . . : 192.168.10.40\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.20.1\n\nBR-R1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     192.168.10.1    YES manual up                    up\nGigabitEthernet0/1     192.168.20.1    YES manual up                    up", o:["The subnet mask is too narrow","The default gateway is the router's Finance interface, which is not in HR-PC's subnet; it should be 192.168.10.1","Gi0/0 is shut down","The printer has the wrong gateway"], a:1, why:"192.168.10.40/24 is in 192.168.10.0/24, and the router's interface on that LAN is 192.168.10.1. The configured gateway, 192.168.20.1, belongs to a different subnet, so HR-PC has no usable gateway. Local printing still works because it never needs a gateway.", lvl:2},
  {q:"ACC-PC (192.168.10.30, mask 255.255.0.0, gateway 192.168.10.1) pings its gateway and the local printer, but pinging 192.168.20.10 gives 'Reply from 192.168.10.30: Destination host unreachable.' The router has no ip proxy-arp on its LAN interface. What is happening?", o:["The gateway address is wrong","With a /16 mask the PC believes 192.168.20.10 is on its own subnet, ARPs for it directly, and nobody on the LAN answers","The router has no route to 192.168.20.0/24","The target has no default gateway"], a:1, why:"192.168.10.30 AND 255.255.0.0 = 192.168.0.0, and so is 192.168.20.10, so the PC never uses its gateway for that target. Its own ARP fails, which is why the unreachable message comes from its own address. With proxy ARP on, the router would have answered and hidden the fault. Fix the mask to 255.255.255.0.", lvl:3},
  {q:"A laptop shows IPv4 address 169.254.37.112, mask 255.255.0.0, no gateway, and 'DHCP Enabled: Yes'. What does this mean?", o:["The network cable is unplugged","The laptop asked for an address by DHCP, got no answer, and gave itself an APIPA link-local address","The DHCP server handed out a public address","Another device is using the same address"], a:1, why:"169.254.0.0/16 is the APIPA range Windows uses when DHCP doesn't answer. The link is up (an unplugged cable shows 'Media disconnected'). The cause is on the DHCP side: the server, a relay, or the laptop's VLAN.", lvl:1},
  {q:"Finance hosts are 192.168.20.2 to 192.168.20.62, mask 255.255.255.192, gateway 192.168.20.1. None of them can reach their gateway. Based on the exhibit, what is the fault?", ex:"BR-R1#show ip route connected\n      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks\nC        192.168.10.0/24 is directly connected, GigabitEthernet0/0\nL        192.168.10.1/32 is directly connected, GigabitEthernet0/0\n      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks\nC        192.168.20.64/26 is directly connected, GigabitEthernet0/1\nL        192.168.20.65/32 is directly connected, GigabitEthernet0/1", o:["Gi0/1 is shut down","Gi0/1 is addressed in the wrong block (192.168.20.65 in 192.168.20.64/26); it should be 192.168.20.1 in 192.168.20.0/26","All the hosts need a /24 mask","Proxy ARP must be enabled on Gi0/1"], a:1, why:"The C route shows the router believes Gi0/1's LAN is 192.168.20.64-.127, and its own address is .65. The hosts are in .0-.63 and point at .1, which nothing owns. Gi0/1 is up (it has C and L routes). One command on the router, ip address 192.168.20.1 255.255.255.192, fixes every host; changing their masks would break the plan.", lvl:3},
  {type:"fill", q:"A server has IP address 10.4.7.200 with mask 255.255.255.192. Type its subnet's network address and broadcast address.", fields:[{label:"Network address", a:["10.4.7.192"]},{label:"Broadcast address", a:["10.4.7.255"]}], why:"/26 = mask 255.255.255.192, block size 256 - 192 = 64. The blocks in the last octet start at 0, 64, 128 and 192; 200 falls in the 192 block. Network 10.4.7.192, broadcast one less than the next block = 10.4.7.255, usable .193 to .254.", lvl:2},
  {type:"multi", q:"FIN2 can ping FIN1 at the next desk, but nothing outside Finance. Which two faults could each cause this on their own? (Choose two.)", o:["FIN2's default gateway is an address no device on the Finance LAN owns","The router's Finance-facing interface is shut down","FIN2's switch port is in the wrong VLAN","FIN2's network cable is unplugged","FIN1 has the wrong default gateway"], a:[0,1], why:"Reaching FIN1 proves FIN2's link, VLAN, address and mask work locally, so the fault is in leaving the subnet: a gateway nobody owns, or a router interface that is down. A wrong VLAN or unplugged cable would stop FIN2 reaching FIN1 too, and FIN1's gateway doesn't affect FIN2's traffic.", lvl:3},
  {q:"A Windows PC with Media State connected pings local hosts fine, but every off-subnet ping gives 'PING: transmit failed. General failure.' What is the most likely addressing cause?", o:["The remote server is powered off","The PC has no default gateway configured, so it has no route to send off-subnet traffic","The router has no route back to the PC","ARP for the remote server failed"], a:1, why:"General failure means the PC couldn't even send. With the link up and local pings working, the usual reason is no usable route off the subnet: no default gateway. A powered-off server or a missing return route gives 'Request timed out'; a failed ARP gives 'Destination host unreachable' from the PC's own address.", lvl:2},
  {q:"You changed a PC's mask from 255.255.0.0 to 255.255.255.0 to fix a 'can't reach Finance' ticket. What is the best proof before closing it?", o:["ipconfig shows the new mask","The PC can ping its gateway","ipconfig shows the new mask, the PC reaches the Finance server by ping and in the real application, arp -a no longer lists remote addresses, and the user confirms","show ip interface brief on the router shows up/up"], a:2, why:"The gateway ping worked before the fix, and a correct mask on screen only shows intent. Proof is the failing test now passing, the real application working, the ARP cache showing traffic goes via the gateway, and the user confirming. The router's interface status was never the problem.", lvl:3},
  {q:"Which Linux command adds the address 192.168.30.11/28 to eth0 (until the next reboot)?", o:["ipconfig eth0 192.168.30.11/28","ip addr add 192.168.30.11/28 dev eth0","ip route add 192.168.30.11/28 dev eth0","netsh interface ip set address eth0 192.168.30.11"], a:1, why:"ip addr add <address>/<prefix> dev <interface> assigns the address; ip route add default via <gateway> adds the gateway. ipconfig and netsh are Windows tools, and ip route add creates a route, not an interface address. Permanent settings belong in the distribution's network configuration.", lvl:1},
],
cards:[
  {f:"Configure a router interface", b:"interface g0/0, description, ip address 192.168.10.1 255.255.255.0 (dotted mask, not /24), no shutdown, verify, copy running-config startup-config. Router interfaces start shut."},
  {f:"% 192.168.10.128 overlaps with GigabitEthernet0/0", b:"The new address's subnet sits inside another interface's subnet. IOS refuses because every connected address needs one exit. Fix the design (masks), not the message."},
  {f:"% Bad mask /26 for address 192.168.20.63", b:"With that mask the address is a network or broadcast address (host bits all 0 or all 1). The same address may be fine with another mask. Exception: /31 on point-to-point links."},
  {f:"What IOS does NOT check", b:"A valid address in the wrong subnet, a mask that differs from the hosts', or a duplicate of a host's address. Verify both ends against the plan."},
  {f:"show ip interface brief", b:"Address, Method, Status and Protocol for every interface. No mask. administratively down = shutdown configured."},
  {f:"Where to see an interface's mask", b:"show ip interface g0/0 (Internet address is x/prefix), show interfaces g0/0, show running-config | include interface|ip address, show ip route connected."},
  {f:"C and L routes", b:"C = the subnet the router computed (address AND mask) for an up/up interface. L = /32 for the router's own address. A down interface has neither."},
  {f:"'Broadcast address is 255.255.255.255' in show ip interface", b:"The address the router uses for broadcasts it originates, not the subnet's broadcast. Not a fault."},
  {f:"Host addressing rules", b:"Usable host address from the LAN's subnet; the same mask as the router; gateway = the router's interface address on that LAN, inside the host's subnet."},
  {f:"Windows and Linux static addressing", b:"Windows: ncpa.cpl > IPv4 Properties, or netsh interface ip set address name=\"Ethernet\" static IP MASK GATEWAY. Linux: ip addr add IP/prefix dev eth0 and ip route add default via GATEWAY."},
  {f:"Addressing troubleshooting method", b:"Scope; read the host (ipconfig /all); do the arithmetic; read the router (brief, connected routes); ping inside out; check the VLAN; fix one thing; record."},
  {f:"Windows ping messages", b:"General failure = couldn't send (no link, IP or gateway). Unreachable from own IP = own ARP failed. Unreachable from a router's IP = that router has no route there. Timed out = no reply came back."},
  {f:"Mask too wide vs too narrow", b:"Too wide (/16 on a /24): remote hosts look local, the PC ARPs for them; proxy ARP hides it. Too narrow (/25 on a /24): local hosts or the gateway look remote."},
  {f:"169.254.x.x (APIPA)", b:"DHCP was asked and didn't answer; link is up. Check the DHCP server, relay or VLAN (Module 7). Media disconnected would mean no link."},
],
});

const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>l.mod==="ccna-m1"||l.mod==="ccna-m2").length;
K.module("ccna", {
  id:"ccna-m3", t:"Binary, IPv4 addressing & subnetting",
  blurb:"Binary and hex, how IPv4 addresses work, masks and prefixes, subnetting from scratch to exam speed, VLSM design, and configuring and troubleshooting addressing — ending in the Module 3 challenge.",
}, L, { at, modAt:2, replace:["IPv4 addressing & subnetting — the worked method","VLSM: designing an addressing plan (and drilling it to reflex)"] });
})();
