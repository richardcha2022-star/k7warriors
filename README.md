# K7 Warriors Tactics Board – team website

Everyone with the link can view the board. The coach unlocks editing with a PIN,
and every change (lineups, subs, notes, scores, change log) saves to the site right away.

Setup (one time, all in a web browser):
1. GitHub: create a free account, make a new repository (e.g. k7-board), choose
   "uploading an existing file", and drag in everything inside this folder
   (index.html is in "public", the save function is in "netlify/functions").
2. Netlify: Add new site → Import an existing project → GitHub → pick the repository → Deploy.
3. No PIN setup needed: the coach PIN is built into the save function.
   (Optional, if your plan allows it: a COACH_PIN environment variable in Netlify replaces it.)
4. Open the site link → Squad tab → Coach access → enter the PIN.
5. Optional: to bring over plans from the old file, Export backup there and Import backup here.
