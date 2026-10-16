# Cubing Prep

A buildless web app for 3×3 cross preparation. Generate random-state scrambles or paste standard U/R/F/D/L/B notation, then obtain up to five shortest solutions for cross and cross plus any one, two, three, or all four F2L pairs.

## Run locally

From this directory, run `npm start` (requires Python 3), then visit http://localhost:5173. No installation or build step is needed. Scramble generation uses the internet; the solver runs locally in a Web Worker. Paste a scramble to solve without the scramble service. Serve over HTTP rather than opening index.html as a file.

## Conventions

Apply scrambles with white on U and green on F (red on R). Solutions put white on D. Each result explicitly lists the setup rotation (`z2`, optionally followed by `y`, `y2`, or `y'`) and the resulting front color. All face turns, including half turns, cost one move (HTM); setup rotations cost zero. All four front orientations have identical minimum move counts. The display chooses an equivalent front orientation with fewer back and left turns. X-cross slots are FR, FL, BL, BR. The 1–3 X-cross goals accept any one, two, or three solved slots, so the reported minimum is across all slot choices. 4 X-cross solves all four pairs and the cross (complete F2L); the last layer is unrestricted. Scramble input accepts face turns only; user-entered rotations and wide/slice moves are not accepted. The app supplies the setup rotations for each solution.

## Exact search

The solver tracks four cross edges, four F2L edges, and four F2L corners. Breadth-first pattern databases give exact projected distances for the cross and each F2L pair with its neighboring two cross edges. IDA* uses admissible bounds: the maximum of the cross distance and the kth-smallest projected pair distance for a goal of k pairs. Larger goals also use exact two-pair tables and tables for each pair with three cross edges; their admissible bounds account for the requested slot count. It exhausts all shorter depths before returning results. Repeated face turns and commuting opposite-face duplicates are removed without changing minimum lengths. Results include at most five alternatives; they are not an exhaustive listing. At the optimal move count, the app exhausts that depth, groups yaw-rotation equivalents (including commuting opposite-face orderings), and retains the best representative per group. It ranks these groups by the existing ergonomic score (2 per back turn, 1 per left turn), then fewer back turns, fewer left turns, less setup yaw, and a stable algorithm ordering. The display limit is applied after this ranking. There is no production search time cutoff. Stop search terminates the Worker; only finished results are labeled optimal.

## Verification

`npm test` (requires Node.js). Tests cover turn inverses and powers, known piece movements, independent breadth-first minimum distances on short scrambles, solution replay, and independent 3D sticker geometry on twelve deterministic full-length scrambles. Orientation tests verify scrambling with white on top, physical replay with white on bottom, all four front colors, and unchanged optimal move counts. Browser QA covers random-state scramble generation, all five result goals, solution stepping, and responsive layout.

## Files

- `dist/`: the complete served app, no compilation required.
- `tests/solver.test.js`: solver validation.
- `vercel.json`: Vercel build and static output configuration.

Random-state scramble generation uses cubing.js: https://js.cubing.net/cubing/scramble/

## Deploy on Vercel

Import `jjc256/cubing` into Vercel and deploy its `main` branch with the repository root as the Root Directory. The checked-in `vercel.json` selects the Other framework preset, runs `npm run build`, and serves `dist/`. The build runs the solver tests; application files are already static and require no compilation. No environment variables or backend services are required. Keep module assets and `worker.js` at their existing paths; do not rewrite every request to index.html.

Vercel configuration reference: https://vercel.com/docs/project-configuration/vercel-json

## Inspection explanations

X-cross results show inspection clues before revealing the face-turn sequence. Use **Inspect setup** to view the starting position in the solution's white-bottom frame. Every piece position in a hint is measured after the listed whole-cube setup rotation, before any face turns. **Explain this solution’s plan** reveals a small number of verified structural phases, and **Show optimal moves** reveals the full algorithm.

The analyzer recognizes a corner connected to a white cross edge, an existing F2L pair, a fixed solved edge or corner, and one- or two-turn connections that the solution preserves. Its final-D analysis checks whether the corner is already oriented in the D layer and its matching middle edge can be installed while that corner stays fixed; the final D alignment then joins them and finishes the cross. It distinguishes initial visual clues from opportunities that require mentally tracking a corner through the cross. A preserved-block claim is only made when replay verifies preservation throughout the remaining sequence. Matching piece adjacency without matching shared sticker directions is rejected. Harder optimal routes explicitly say when no simple inspection cue is recognized.

These explanations provide verified ways to interpret a solution, not a claim about how the optimal-search algorithm discovered it. The inspection principles are illustrated in [Feliks Zemdegs’s extended-cross examples](https://www.cubeskills.com/blog/25-extended-cross-examples), [J Perm’s X-cross tutorial](https://jperm.net/3x3/cfop/cross), and [Ryan Heise’s block-building explanation](https://www.ryanheise.com/cube/square1.html).

## Larger goals

Cross, 1 X-cross, and 2 X-cross run automatically. Use **Compute 3 X-cross** or **Compute 4 X-cross** for the larger searches; requests made during another search are queued. These goals retain exact HTM optimality, global ergonomic tiebreak ranking, rotation deduplication, and per-pair inspection explanations. Additional pruning tables are built only when requested. Search depth and node-count updates remain live, and **Stop** cancels pending work while retaining completed results. Large searches can take substantially longer, depending on the scramble and device; there is no production cutoff or substitution of approximate solutions.

## Theme

Use the header Theme control to choose System, Light, or Dark. System is the default and follows live operating-system theme changes. Manual choices are saved locally in the browser and applied before the stylesheet loads to avoid a light flash on startup. Cube sticker colors are unchanged.

## F2L page

The existing tool is named Cross. `f2l.html` generates a random legal state with its white cross solved, using a cubing.js random-state scramble followed by a deterministic cross-only correction. That correction depends only on cross coordinates, so each cross-state fiber maps bijectively to the solved-cross fiber, preserving the conditional uniform random-state distribution. Incidental solved pairs are retained. Scramble with white up / green front; apply z2 for white-down insertions.

Four collapsed cards give a sequential F2L solution, preserving the cross and completed pairs. Cases come from [SpeedCubeDB F2L](https://speedcubedb.com/a/3x3/F2L) and [Advanced F2L](https://speedcubedb.com/a/3x3/AdvancedF2L), retrieved 2026-10-15. The local catalog covers all 41 basic and 54 advanced case labels, retaining face-turn variants and flattening source y rotations into a fixed frame. Algorithms are adapted with yaw conjugation and U adjustments, and verified against the actual state. When necessary an explicit extraction setup precedes the referenced case. These insertions do not claim optimal full-F2L length.

`tests/f2l.test.js` checks 300 deterministic scramble samples, cross preservation after every insertion, completed-pair preservation, independent sticker replay of white-top scrambles and complete white-bottom F2L, coverage of all 95 source case labels, extraction fallback, and the browser worker entry.
