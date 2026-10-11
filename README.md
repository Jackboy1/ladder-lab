# Ladder Lab

Personal hands-on learning platform for the Infrastructure Ladder career path (Isire Akpevwe Daniel).
Courses in career order · quizzes · terminal simulators (Linux, Cisco IOS, Git, Kubernetes) · guided labs ·
free-practice playground · code labs (bash / Python / Dockerfile / Terraform / GitHub Actions) · ticket scenarios ·
interview mocks · spaced-repetition flashcards · points, ranks, badges and earned certificates.

**Live:** https://jackboy1.github.io/ladder-lab/

## Run it

**Option A — just open it:** double-click `index.html`. Everything is static; no install, no server.

**Option B — local server (optional):**
```
python3 -m http.server 8000
# then open http://localhost:8000
```

**Option C — the live site:** GitHub Pages serves `main` (root folder) at
https://jackboy1.github.io/ladder-lab/. Every push to `main` redeploys it in a minute or two.

## How I use this daily
1. **Open the Dashboard** on the live site — it shows my current rank, streak and where I left off.
2. **Flashcards first (5–10 min):** clear the spaced-repetition cards due today so the streak keeps going.
3. **One lesson + its quiz:** continue the next lesson in my current course and pass the quiz.
4. **Hands-on (20–30 min):** do one lab or code lab in the terminal simulator, or a free-practice session.
5. **One ticket or interview question:** work a ticket scenario or an interview mock out loud.
6. **Back up weekly:** Settings → Backup, so my progress isn't stuck in one browser.

## Progress & backup
Progress (points, streak, SRS, certificates) is saved in the browser you use (localStorage).
Use **Settings → Backup** inside the app to copy your progress and paste it on another device/browser.

## Adding content
All content lives in `data_*.js` — plain objects:
- tracks: `lessons[{t,html}]`, `quiz[{q,o,a,why}]`, `cards[{f,b}]`, `labs[ids]`, `codelabs[{id,t,brief,checks,model}]`, `videos[{t,u}]`
- `data_labs.js` / `data_linux2.js`: lab definitions with `objectives[{text, done(state)}]` over the simulator state
- `sim.js`: the Linux / Cisco IOS / Git / Kubernetes terminal engines

`test_all.js` (Node) verifies everything: `node test_all.js`.
