# Ladder Lab

Personal hands-on learning platform for the Infrastructure Ladder career path (Isire Akpevwe Daniel).
Courses in career order · quizzes · terminal simulators (Linux, Cisco IOS, Git, Kubernetes) · guided labs ·
free-practice playground · code labs (bash / Python / Dockerfile / Terraform / GitHub Actions) · ticket scenarios ·
interview mocks · spaced-repetition flashcards · points, ranks, badges and earned certificates.

## Run it

**Option A — just open it:** double-click `index.html`. Everything is static; no install, no server.

**Option B — local server (optional):**
```
python3 -m http.server 8000
# then open http://localhost:8000
```

**Option C — free public site on GitHub Pages (recommended — feeds your public-GitHub goal):**
1. Create a repo (e.g. `ladder-lab`) and push this folder to it.
2. Repo → Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save.
3. Your site appears at `https://<your-username>.github.io/ladder-lab/` in a minute or two.

## Progress & backup
Progress (points, streak, SRS, certificates) is saved in the browser you use (localStorage).
Use **Settings → Backup** inside the app to copy your progress and paste it on another device/browser.

## Adding content
All content lives in `data_*.js` — plain objects:
- tracks: `lessons[{t,html}]`, `quiz[{q,o,a,why}]`, `cards[{f,b}]`, `labs[ids]`, `codelabs[{id,t,brief,checks,model}]`, `videos[{t,u}]`
- `data_labs.js` / `data_linux2.js`: lab definitions with `objectives[{text, done(state)}]` over the simulator state
- `sim.js`: the Linux / Cisco IOS / Git / Kubernetes terminal engines

`test_all.js` (Node) verifies everything: `node test_all.js`.
