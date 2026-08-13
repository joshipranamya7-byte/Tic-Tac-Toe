# Tic-Tac-Toe

A polished, fully accessible Tic-Tac-Toe game built with plain HTML, CSS and JavaScript — no frameworks, no build step.

**[Live board layout is a single `index.html` — open it directly in any browser.]**

## Features

- **Two modes** — pass-and-play 2-player, or play against a CPU opponent
- **Unbeatable CPU** — opponent moves are chosen with the **minimax algorithm**, so it never loses
- **Animated marks** — X and O are drawn with SVG path animations, not plain text
- **Winning-line overlay** — an animated line strikes through the winning row/column/diagonal
- **Score tracking** — wins/draws persist across page reloads via `localStorage`
- **Sound effects** — lightweight Web Audio API tones for moves, wins and draws (togglable, no audio files)
- **Fully keyboard accessible** — every cell is a real `<button>`, focus states are visible, `aria-live` announces turn/result changes
- **Responsive** — works down to small mobile widths
- **Respects `prefers-reduced-motion`**

## Tech

- Vanilla JavaScript (ES6+, IIFE module pattern, no dependencies)
- CSS custom properties for theming, CSS Grid for the board
- Web Audio API for sound
- `localStorage` for persistence

## Run it

Just open `index.html` in a browser — there is nothing to install or build.

## Project structure

```
tictactoe/
├── index.html   # markup
├── style.css    # design system + animations
└── script.js    # game logic, minimax AI, sound, persistence
```
