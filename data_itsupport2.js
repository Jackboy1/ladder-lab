// IT-Support expansion — hardware troubleshooting trees, Windows admin toolkit, extra tickets & support interview Qs
(function(){
const T = LL.tracks.find(t=>t.id==="itsupport"); if(!T) return;

T.lessons.push(
{t:"Hardware troubleshooting trees: no-power, no-boot, overheating, BSOD", html:`
<p>Hardware faults feel random until you walk a tree. Each branch below is ordered by what's cheapest to test and most likely to be true — commit the shapes, not just the facts.</p>
<h3>Tree 1 — "It won't turn on" (no lights, no fans)</h3>
<pre><code>Wall power proven? (another device in the same socket)
 └─ yes → Cable/brick: swap the kettle lead / check adapter LED (laptops: known-good charger)
     └─ still dead → Battery pull test (laptop) / PSU switch 0-1 & paperclip test (desktop)
         └─ PSU proven → front-panel power switch bypassed (short the PWR pins)
             └─ still dead → motherboard/standby rail → bench repair
Laptop special: static flea-power drain — unplug all, hold power 30s, retry. Fixes a silly number of 'dead' laptops.</code></pre>
<h3>Tree 2 — "Powers on, won't boot" (fans spin, no OS)</h3>
<pre><code>Anything on screen?
 ├─ NOTHING (no POST): listen/count beep codes · reseat RAM (one stick, slot 1) · reseat GPU
 │    swap monitor+cable · clear CMOS · minimum-boot config (board+CPU+1 RAM)
 ├─ Vendor logo then stuck: firmware sees hardware → boot device issue:
 │    BIOS: is the disk DETECTED?
 │      no → cable/dead drive (clicking HDD = dying; back up FIRST if it ever wakes)
 │      yes → boot order sane? Secure Boot/mode (UEFI vs Legacy) flipped after a change?
 ├─ 'No boot device' / 'Operating system not found': disk order, dead disk, or wiped bootloader
 │    → WinRE (installer USB) → Startup Repair → bootrec /fixmbr /fixboot /rebuildbcd
 └─ Windows logo then spins forever: boot into SAFE MODE → last change (driver/update) → roll it back</code></pre>
<h3>Tree 3 — overheating (random shutdowns, roaring fans, throttling)</h3>
<pre><code>Confirm: temps via firmware page or HWMonitor — CPUs throttle ~95–100°C, shut down above
Causes in probability order:
 1. Dust: blocked fins/fans → compressed air OUTWARD, hold the fan still
 2. Airflow: laptop on a duvet / desktop shoved against a wall → feet, space, pads
 3. Dried thermal paste (3–5 yrs): repaste after cleaning with isopropyl
 4. Failed fan: listen per-fan, check RPM in firmware → replace
 5. Ambient: a Lagos server closet without cooling IS the fault — fix the room
Pattern lock: shutdowns under LOAD (games, exports, month-end jobs) = thermal until proven otherwise.</code></pre>
<h3>Tree 4 — BSOD (blue screen) triage</h3>
<pre><code>Note the STOP code — it names the suspect:
 MEMORY_MANAGEMENT / PAGE_FAULT…        → RAM: run Windows Memory Diagnostic / MemTest86, reseat/one-stick test
 IRQL_NOT_LESS_OR_EQUAL / DRIVER_*      → a driver: what was installed/updated? Safe Mode → roll back
 CRITICAL_PROCESS_DIED / NTFS_FILE_*    → disk/filesystem: chkdsk /f, SMART status, back up NOW
 WHEA_UNCORRECTABLE_ERROR               → hardware/CPU/overclock/power
One BSOD = note it. Repeating BSODs = Event Viewer + the matching tree above.
Reliability Monitor (perfmon /rel) draws the crash timeline against installs — correlation on a plate.</code></pre>
<div class="callout"><b>The habit over the facts:</b> change one variable per test, cheapest first, and write down what you ruled out — the same split-the-suspects method as the network lesson, applied to tin.</div>`},

{t:"Windows admin toolkit: Task Manager → Event Viewer → Safe Mode → restore", html:`
<p>Windows ships every tool a support engineer needs for software-side triage; tickets close faster when you reach for them in the right order.</p>
<h3>Performance complaints: the three-dial check</h3>
<pre><code>Task Manager (Ctrl+Shift+Esc) → Performance + Processes sorted by the hurting column
 CPU pinned     → which process? one app (fix/update it) vs 'System'/interrupts (driver)
 Memory ~95%    → paging to disk = molasses; find the eater (browser? leak?) or add RAM
 Disk at 100%   → HDD + Windows Update/AV scan/Search indexing — classic; SSD swap cures the species
Startup tab → the real reason 'it got slow over a year': disable the junk, measure boot impact
Resource Monitor (resmon) → per-process disk/network when Task Manager is too coarse</code></pre>
<h3>Event Viewer — the machine's diary</h3>
<pre><code>eventvwr → Windows Logs:
 System      → hardware, drivers, services, unexpected shutdowns (Event ID 6008), disk warnings (ID 7/51/153 = back up now)
 Application → app crashes (Error, source: Application Error → faulting module tells you WHICH dll)
Filter Current Log → Error+Critical, around the incident time.
Habit: match the user's "it crashed at ~2pm" to the log timeline — evidence beats vibes, and it's the correlation skill you'll reuse in journalctl and CloudWatch.</code></pre>
<h3>Safe Mode & startup surgery</h3>
<pre><code>Safe Mode (minimal drivers/services): Settings→Recovery→Restart now → Troubleshoot→Startup Settings (or hold Shift+Restart)
 Works in Safe Mode but not normally? → a third-party driver/service/startup app is guilty:
 msconfig → Selective startup / hide Microsoft services → binary-search the culprit (disable half, reboot, repeat)
Device Manager → the yellow-triangle hunt → Roll Back Driver beats reinstall-Windows nine times out of ten</code></pre>
<h3>Undo buttons, in order of blast radius</h3>
<div class="tablewrap"><table>
<tr><th>Tool</th><th>Undoes</th><th>User files?</th><th>Reach for when</th></tr>
<tr><td>Roll Back Driver</td><td>One driver</td><td>Safe</td><td>Broke right after a driver update</td></tr>
<tr><td>Uninstall update (WinRE too)</td><td>One Windows update</td><td>Safe</td><td>Broke right after Patch Tuesday</td></tr>
<tr><td><b>System Restore</b></td><td>System state/registry to a restore point</td><td>Safe (apps since the point are removed)</td><td>"It worked last week", cause unclear</td></tr>
<tr><td>Reset this PC (keep files)</td><td>Reinstalls Windows</td><td>Keeps files, kills apps</td><td>OS rot beyond repair</td></tr>
<tr><td>Clean install</td><td>Everything</td><td><b>Gone — backup first</b></td><td>Last resort / handover rebuilds</td></tr>
</table></div>
<h3>Profiles, the quiet classic</h3>
<pre><code>"Only THIS user has the problem on THIS machine" → profile-scoped:
 test with a fresh local/another domain account →
   fresh account fine? → corrupt profile: rename C:\\Users\\&lt;user&gt; (new one regenerates; copy data back)
   or OneDrive/redirection sync wedged, or a per-user startup item
"Temporary profile" banner at logon = the registry ProfileList entry with a .bak — the known fix, document it once.</code></pre>
<div class="callout"><b>Order on any software ticket:</b> Task Manager snapshot → Event Viewer around the time → one-variable undo (driver/update/restore point) → profile test → repair installs. Reinstalling Windows is a confession, not a method.</div>`}
);

T.quiz.push(
{q:"A 'dead' laptop shows no sign of life. After proving the socket and charger, the quick trick that often revives it:", o:["New SSD","Flea-power drain: unplug everything, hold power 30s","Reinstall Windows","Replace RAM"], a:1, why:"Static charge on the board blocks power-on surprisingly often; the drain costs 30 seconds before any disassembly."},
{q:"Fans spin, screen totally black, no beeps. First reseat:", o:["The CPU","RAM (one stick, slot 1)","The SATA cable","The CMOS battery"], a:1, why:"Failed POST with no video is most often RAM seating; one-stick testing also halves the suspects per try."},
{q:"'Operating system not found' after the vendor logo means…", o:["RAM is dead","Firmware is fine; the boot path is broken — disk detection/order, dead drive, or bootloader","Overheating","Monitor cable"], a:1, why:"POST completed; now it's BIOS disk detection → boot order/mode → WinRE bootrec, in that order."},
{q:"Random shutdowns only during heavy exports point first at…", o:["DNS","Thermal throttling/overheat — dust, airflow, paste, fans","A virus","The PSU switch"], a:1, why:"Load-correlated shutdowns are thermal until proven otherwise; confirm with temps, then the dust→airflow→paste→fan ladder."},
{q:"BSOD MEMORY_MANAGEMENT repeating. Correct test:", o:["chkdsk","Windows Memory Diagnostic / MemTest86 + one-stick isolation","sfc /scannow","New GPU"], a:1, why:"The stop code names RAM; memory testers plus physical isolation find the bad stick."},
{q:"A PC works fine in Safe Mode but misbehaves normally. Conclusion:", o:["Hardware fault","A third-party driver/service/startup item — msconfig binary-search it","Windows is corrupt","The user imagines it"], a:1, why:"Safe Mode loads minimal drivers; the difference set IS the suspect list."},
{q:"HDD at constant 100% in Task Manager on an older laptop. The cure that fixes the species:", o:["More RAM","Clone to an SSD","Defrag daily","New Windows user"], a:1, why:"Update/AV/indexing saturate spinning disks; the SSD removes the bottleneck for good (and matches lesson 1's upgrade)."},
{q:"'Only this user on this machine' has the issue; a fresh account is fine. Fix:", o:["Reinstall Windows","Corrupt profile: rename the user folder, let it regenerate, copy data back","Replace the NIC","Clear CMOS"], a:1, why:"Profile-scoped symptoms get profile-scoped fixes; reinstalling the OS for one profile is the confession."},
);

T.cards.push(
{f:"No-power tree", b:"Socket → cable/brick → battery-pull / PSU test → front-panel bypass → board. Laptops: 30s flea-power drain first."},
{f:"No-POST moves", b:"Beep codes · reseat RAM one-stick · reseat GPU · monitor/cable swap · clear CMOS · minimum boot."},
{f:"'OS not found'", b:"Disk detected in BIOS? → order/UEFI mode → WinRE: Startup Repair, bootrec /fixmbr /fixboot /rebuildbcd."},
{f:"Thermal ladder", b:"Dust → airflow → repaste (3–5yr) → fan RPM → room. Load-correlated shutdowns = thermal."},
{f:"BSOD code map", b:"MEMORY_* = RAM test · DRIVER/IRQL = roll back driver (Safe Mode) · NTFS/CRITICAL = disk, back up · WHEA = hardware/power."},
{f:"Perf three-dial", b:"Task Manager: CPU culprit? RAM ~95% (paging)? Disk 100% (HDD+updates → SSD)? Then Startup tab."},
{f:"Event Viewer habit", b:"System+Application, filter Error/Critical around the reported time; ID 6008 dirty shutdown, 7/51/153 disk = back up."},
{f:"Undo ladder", b:"Roll back driver → uninstall update → System Restore → Reset-keep-files → clean install (backup!)."},
{f:"Profile-scoped test", b:"Fresh account fine ⇒ corrupt profile: rename C:\\Users\\name, regenerate, copy data back."},
);

/* ---- extra tickets ---- */
LL.tickets.push(
{
  id:"tk-nopower", sev:"P2", from:"Sales rep (travelling Monday)", system:"Help Desk",
  title:"Laptop completely dead — trip in two days",
  body:"A rep's laptop shows nothing when the power button is pressed: no lights, no fan, charger LED is off at the brick. She needs it for a client trip.",
  asks:["Walk the no-power tree out loud — what's your exact order?","The charger LED being off changes what?","What's your parallel plan given the deadline?"],
  model:`<ul>
<li>Order: prove the wall socket with another device → the charger LED off points hard at supply, so swap in a known-good charger first → 30-second flea-power drain (unplug all, hold power) → battery disconnect test if accessible → only then suspect the board.</li>
<li>A dead brick LED moves probability from "laptop fault" to "cable/brick/socket" — cheapest suspects first, and chargers are stock items.</li>
<li>Deadline thinking runs in parallel with diagnosis: if the good charger doesn't wake it within the first minutes, start the loaner-laptop + restore-her-data path immediately (OneDrive/backup state check) so Monday is safe regardless of the repair outcome. Tickets have two tracks: fix the device, and protect the user's deadline.</li>
<li>Close: cause, fix, and whether her data protection was adequate — if it wasn't, that becomes its own follow-up.</li></ul>`,
},
{
  id:"tk-bsod", sev:"P2", from:"Accounts", system:"Help Desk",
  title:"Blue screens since yesterday's updates",
  body:"A desktop has crashed to a blue screen three times since Windows updates and a new graphics driver were installed yesterday. Stop code mentions a DRIVER error.",
  asks:["What does the stop code family tell you before touching anything?","Exact recovery sequence?","How do you confirm you actually fixed it?"],
  model:`<ul>
<li>DRIVER/IRQL-family codes point at a driver, and the timeline (two changes yesterday) hands you the suspects — this is Reliability Monitor's correlation made obvious.</li>
<li>Sequence: boot Safe Mode → Device Manager → Roll Back Driver on the graphics adapter (the newer, more invasive change) → reboot normally and observe. Still crashing → uninstall yesterday's quality update next. One variable per step, most-likely first.</li>
<li>Confirm with evidence, not silence: Event Viewer/Reliability Monitor shows no new critical events across a day of normal use, and the user signs off. Note the faulting driver version in the ticket so the next tech (and patch policy) learns from it.</li>
<li>Pattern for the knowledge base: "BSOD within 24h of an update" → roll back the newest driver first, update second, restore point third.</li></ul>`,
},
{
  id:"tk-outlook", sev:"P3", from:"Operations", system:"Help Desk",
  title:"Email fine in the browser, Outlook won't connect",
  body:"A user reads mail happily via webmail, but the Outlook desktop app sits on 'Trying to connect…' since this morning. Colleagues' Outlook works.",
  asks:["What has webmail-working already proven for you?","Give your isolation order on the client.","What's the classic end-state fix if the profile is wedged?"],
  model:`<ul>
<li>Webmail working proves the account, password/licence, mailbox and the network path to the service are all healthy — the fault is scoped to this machine's Outlook client before you touch anything. That's half the tree pruned for free.</li>
<li>Client isolation order: restart Outlook/PC (state) → check it isn't stuck in Work Offline mode (the embarrassing classic) → Outlook Safe Mode (<code>outlook.exe /safe</code>) to rule out an add-in — works there? disable add-ins → repair the data file/OST (delete it; it rebuilds from the server) → finally recreate the Outlook/mail profile.</li>
<li>The wedged-profile fix: a fresh mail profile in Control Panel → Mail, then set as default — rebuilds the client-side state cleanly while the mailbox itself was never at risk (it lives server-side; the OST is just a cache).</li>
<li>Close with the cause (add-in? corrupt OST?) so repeat offenders — one add-in across a floor — get spotted as a pattern, not twenty tickets.</li></ul>`,
},
{
  id:"tk-vpn", sev:"P2", from:"Remote staff", system:"Help Desk / Network",
  title:"VPN connects, but internal apps are unreachable",
  body:"A home worker's VPN client shows Connected, yet the intranet, file shares and the ERP all fail. Internet browsing works. Other remote users are fine.",
  asks:["'Connected but nothing works' — which layer did the VPN prove, and what remains?","Your test sequence?","What single common cause explains intranet-by-name failing while pings by IP succeed?"],
  model:`<ul>
<li>The tunnel established, so authentication and reachability to the gateway are proven; what remains is what rides THROUGH it: addressing, routing/split-tunnel rules, and DNS over the tunnel.</li>
<li>Sequence: check the adapter got a sensible tunnel IP → ping an internal server by IP (works = routing fine, suspect DNS; fails = routing/split-tunnel scope) → then by name → inspect which networks the client routes into the tunnel (split-tunnel config) → compare the client version/profile against a working colleague's, since "only her" plus a recent client update is a strong correlation.</li>
<li>The single classic: <b>DNS not using the tunnel</b> — internal names can't resolve on public resolvers, so IP works, names fail. Fix is the VPN profile assigning internal DNS (and the suffix), not anything on the servers.</li>
<li>Also worth one look: home-router subnet clashing with the office range (both 192.168.1.0/24) — the overlap problem from the VLSM lesson appearing in real life. Document which it was; this ticket repeats forever otherwise.</li></ul>`,
}
);

/* ---- support-flavoured interview questions ---- */
LL.interview.push(
{topic:"IT Support", level:"Core", q:"A user says 'my computer is slow'. Run your triage out loud.",
 a:`Clarify first — slow at what, since when, what changed? Then evidence over vibes: Task Manager's three dials — CPU (which process?), memory (near-full means paging), disk (an HDD pinned at 100% by updates/AV is the single most common cause, and an SSD clone is the cure). Startup tab for the year-of-accumulated-junk case; Event Viewer if it's errors rather than load. I change one variable at a time and tell the user what I ruled out — the method is the service.`},
{topic:"IT Support", level:"Core", q:"How do you decide hardware vs software on a misbehaving PC?",
 a:`Cut points: does it fail before the OS loads (POST/boot menu territory = hardware side) or after? Does Safe Mode behave (yes → third-party software/driver)? Does a fresh user profile behave (yes → profile-scoped)? Does a bootable USB run clean (yes → the OS install, not the tin)? Each test splits the tree in half — four questions usually corner it, and they're all free.`},
{topic:"IT Support", level:"Scenario", q:"Three users on the same desk bank report no network this morning. Thirty others are fine. Go.",
 a:`Cluster-shaped faults get topology thinking, not per-PC thinking: what do exactly those three share? Usually one desk switch, one cable run, or one switch port group. I'd check their drops lead to the same access switch/ports, look at that switch port status (err-disabled? VLAN change last night?), and check the change log before touching hardware. One shared cause, one fix, three tickets closed — and the pattern 'group of neighbours' is the giveaway I'd teach a junior.`},
{topic:"IT Support", level:"Core", q:"A user is furious after losing a morning's work. How do you handle the human side?",
 a:`Acknowledge before troubleshooting: 'That's genuinely frustrating — let's see what we can recover and make sure it can't happen again.' Then act in that order: recovery attempt (autosave/temp files/versions), honest expectation-setting, then prevention — autosave settings, OneDrive/backup, and a note in the ticket if the real gap is a missing backup policy. People remember whether you treated their problem as real; the fix is table stakes, the calm is the skill. It's also exactly the soft skill a Costech training-floor role rewards.`}
);
})();
