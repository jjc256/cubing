# Cubing Prep

A buildless web app for 3×3 cross preparation. Generate random-state scrambles or paste standard U/R/F/D/L/B notation, then obtain up to five shortest solutions for cross, cross plus any one F2L pair, and cross plus any two F2L pairs.

## Run locally

From this directory, run `npm start` (requires Python 3), then visit http://localhost:5173. No installation or build step is needed. Scramble generation and fonts use the internet; the solver runs locally in a Web Worker. Paste a scramble to solve without the scramble service. Serve over HTTP rather than opening index.html as a file.

## Conventions

Apply scrambles with white on U and green on F (red on R). Solutions put white on D. Each result explicitly lists the setup rotation (`z2`, optionally followed by `y`, `y2`, or `y'`) and the resulting front color. All face turns, including half turns, cost one move (HTM); setup rotations cost zero. All four front orientations have identical minimum move counts. The display chooses an equivalent front orientation with fewer back and left turns. X-cross slots are FR, FL, BL, BR. The goals accept any one or any two solved slots, so the reported minimum is across all slot choices. Scramble input accepts face turns only; user-entered rotations and wide/slice moves are not accepted. The app supplies the setup rotations for each solution.

## Exact search

The solver tracks four cross edges, four F2L edges, and four F2L corners. Breadth-first pattern databases give exact projected distances for the cross and each F2L pair with its neighboring two cross edges. IDA* uses admissible bounds: the maximum of the cross distance and the smallest (or second-smallest for two pairs) projected pair distance. It exhausts all shorter depths before returning results. Repeated face turns and commuting opposite-face duplicates are removed without changing minimum lengths. Results include at most five alternatives; they are not an exhaustive listing. At the optimal move count, the app exhausts that depth, groups yaw-rotation equivalents (including commuting opposite-face orderings), and retains the best representative per group. It ranks these groups by the existing ergonomic score (2 per back turn, 1 per left turn), then fewer back turns, fewer left turns, less setup yaw, and a stable algorithm ordering. The display limit is applied after this ranking. There is no production search time cutoff. Stop search terminates the Worker; only finished results are labeled optimal.

## Verification

`npm test` (requires Node.js). Tests cover turn inverses and powers, known piece movements, independent breadth-first minimum distances on short scrambles, solution replay, and independent 3D sticker geometry on twelve deterministic full-length scrambles. Orientation tests verify scrambling with white on top, physical replay with white on bottom, all four front colors, and unchanged optimal move counts. Browser QA covers random-state scramble generation, all three result goals, solution stepping, and responsive layout.

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
