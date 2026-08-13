

(() => {
  'use strict';

  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  const STORAGE_KEY = 'ttt-scores-v1';
  const SOUND_KEY = 'ttt-sound-v1';

  const els = {
    board: document.getElementById('board'),
    cells: Array.from(document.querySelectorAll('.cell')),
    statusText: document.getElementById('statusText'),
    turnDot: document.getElementById('turnDot'),
    winLine: document.getElementById('winLine'),
    winLineEl: document.getElementById('winLineEl'),
    scoreX: document.getElementById('scoreX'),
    scoreO: document.getElementById('scoreO'),
    scoreDraw: document.getElementById('scoreDraw'),
    oLabel: document.getElementById('oLabel'),
    newRoundBtn: document.getElementById('newRoundBtn'),
    resetMatchBtn: document.getElementById('resetMatchBtn'),
    modeSegmented: document.getElementById('modeSegmented'),
    soundToggle: document.getElementById('soundToggle'),
    soundOnIcon: document.getElementById('soundOnIcon'),
    soundOffIcon: document.getElementById('soundOffIcon'),
    toast: document.getElementById('toast')
  };

  /** @type {Array<'X'|'O'|null>} */
  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let gameOver = false;
  let mode = 'pvp';        // 'pvp' | 'cpu'
  let cpuThinking = false;
  const HUMAN = 'X';
  const CPU = 'O';

  let scores = loadScores();
  let soundOn = loadSoundPref();

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    els.cells.forEach(cell => {
      cell.addEventListener('click', onCellClick);
    });
    els.newRoundBtn.addEventListener('click', () => startNewRound(true));
    els.resetMatchBtn.addEventListener('click', resetMatch);
    els.modeSegmented.addEventListener('click', onModeClick);
    els.soundToggle.addEventListener('click', toggleSound);

    renderScores();
    renderSoundIcon();
    updateStatus();
  }

  /* ------------------------------------------------------------------ */
  /* Interaction                                                         */
  /* ------------------------------------------------------------------ */

  function onCellClick(e) {
    if (gameOver || cpuThinking) return;
    const index = Number(e.currentTarget.dataset.index);
    if (board[index] !== null) return;
    if (mode === 'cpu' && currentPlayer !== HUMAN) return;

    playMove(index, currentPlayer);

    const result = evaluateBoard(board);
    if (result) return finishGame(result);

    switchTurn();

    if (mode === 'cpu' && currentPlayer === CPU && !gameOver) {
      cpuThinking = true;
      setBoardBusy(true);
      setTimeout(cpuMove, 380); // small delay reads as "thinking"
    }
  }

  function cpuMove() {
    const index = getBestMove(board);
    if (index !== -1) {
      playMove(index, CPU);
      const result = evaluateBoard(board);
      cpuThinking = false;
      setBoardBusy(false);
      if (result) return finishGame(result);
      switchTurn();
    }
  }

  function playMove(index, player) {
    board[index] = player;
    renderMark(index, player);
    playSound(player === 'X' ? 'x' : 'o');
  }

  function switchTurn() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
  }

  /* ------------------------------------------------------------------ */
  /* Rules                                                                */
  /* ------------------------------------------------------------------ */

  function evaluateBoard(b) {
    for (const line of WIN_LINES) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[c] === b[d]) {
        return { winner: b[a], line };
      }
    }
    if (b.every(v => v !== null)) return { winner: null, line: null }; // draw
    return null;
  }

  function finishGame(result) {
    gameOver = true;
    setBoardBusy(false);

    if (result.winner) {
      highlightWin(result.line);
      drawWinLine(result.line);
      bumpScore(result.winner);
      playSound('win');
      const label = mode === 'cpu'
        ? (result.winner === HUMAN ? 'You win! \u{1F389}' : 'CPU wins')
        : `${result.winner} wins!`;
      setStatus(label);
      showToast(label);
    } else {
      bumpScore('draw');
      playSound('draw');
      setStatus("It's a draw");
      showToast("It's a draw");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Minimax CPU (unbeatable)                                             */
  /* ------------------------------------------------------------------ */

  function getBestMove(b) {
    let bestScore = -Infinity;
    let bestIndex = -1;

    for (let i = 0; i < 9; i++) {
      if (b[i] !== null) continue;
      b[i] = CPU;
      const score = minimax(b, 0, false);
      b[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function minimax(b, depth, isMaximizing) {
    const result = evaluateBoard(b);
    if (result) {
      if (result.winner === CPU) return 10 - depth;
      if (result.winner === HUMAN) return depth - 10;
      return 0;
    }

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = CPU;
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = HUMAN;
        best = Math.min(best, minimax(b, depth + 1, true));
        b[i] = null;
      }
      return best;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                            */
  /* ------------------------------------------------------------------ */

  function renderMark(index, player) {
    const cell = els.cells[index];
    cell.disabled = true;
    cell.classList.add(player === 'X' ? 'mark-x' : 'mark-o');
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${player}`);
    cell.innerHTML = player === 'X' ? xMarkSVG() : oMarkSVG();
  }

  function xMarkSVG() {
    return `<svg viewBox="0 0 44 44"><path class="mark-path" d="M8 8 L36 36" /><path class="mark-path" d="M36 8 L8 36" style="animation-delay:.08s" /></svg>`;
  }
  function oMarkSVG() {
    return `<svg viewBox="0 0 44 44"><path class="mark-path" d="M22 6 A16 16 0 1 1 21.9 6" /></svg>`;
  }

  function highlightWin(line) {
    line.forEach(i => els.cells[i].classList.add('win-cell'));
  }

  function drawWinLine(line) {
    const [a, , c] = line;
    const cellRect0 = els.cells[a];
    const cellRectN = els.cells[c];
    const boardRect = els.board.getBoundingClientRect();
    const r0 = cellRect0.getBoundingClientRect();
    const r1 = cellRectN.getBoundingClientRect();

    const scaleX = 300 / boardRect.width;
    const scaleY = 300 / boardRect.height;

    const x1 = (r0.left + r0.width / 2 - boardRect.left) * scaleX;
    const y1 = (r0.top + r0.height / 2 - boardRect.top) * scaleY;
    const x2 = (r1.left + r1.width / 2 - boardRect.left) * scaleX;
    const y2 = (r1.top + r1.height / 2 - boardRect.top) * scaleY;

    els.winLineEl.setAttribute('x1', x1);
    els.winLineEl.setAttribute('y1', y1);
    els.winLineEl.setAttribute('x2', x2);
    els.winLineEl.setAttribute('y2', y2);
    els.winLineEl.classList.add('is-visible');
  }

  function setBoardBusy(isBusy) {
    els.board.classList.toggle('is-busy', isBusy);
    els.cells.forEach(cell => {
      const isFilled = cell.classList.contains('mark-x') || cell.classList.contains('mark-o');
      if (!isFilled) cell.disabled = isBusy;
    });
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function updateStatus() {
    els.turnDot.classList.toggle('is-o', currentPlayer === 'O');
    if (mode === 'cpu') {
      setStatus(currentPlayer === HUMAN ? 'Your turn (X)' : 'CPU is thinking\u2026');
    } else {
      setStatus(`${currentPlayer}'s turn`);
    }
  }

  function renderScores() {
    els.scoreX.textContent = scores.X;
    els.scoreO.textContent = scores.O;
    els.scoreDraw.textContent = scores.draw;
  }

  function bumpScore(key) {
    if (key === 'X') scores.X++;
    else if (key === 'O') scores.O++;
    else scores.draw++;
    saveScores();
    renderScores();
    flashTile(key);
  }

  function flashTile(key) {
    const map = { X: '.tile-x', O: '.tile-o', draw: '.tile-draw' };
    const el = document.querySelector(map[key]);
    if (!el) return;
    el.classList.remove('is-flash');
    void el.offsetWidth; // restart animation
    el.classList.add('is-flash');
  }

  let toastTimer = null;
  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2200);
  }

  /* ------------------------------------------------------------------ */
  /* Round / match control                                               */
  /* ------------------------------------------------------------------ */

  function startNewRound(userTriggered) {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameOver = false;
    cpuThinking = false;

    els.cells.forEach(cell => {
      cell.disabled = false;
      cell.className = 'cell';
      cell.innerHTML = '';
      const [row, col] = [Math.floor(Number(cell.dataset.index) / 3) + 1, (Number(cell.dataset.index) % 3) + 1];
      cell.setAttribute('aria-label', `Row ${row}, Column ${col}`);
    });

    els.winLineEl.classList.remove('is-visible');
    els.winLineEl.setAttribute('x1', 0);
    els.winLineEl.setAttribute('y1', 0);
    els.winLineEl.setAttribute('x2', 0);
    els.winLineEl.setAttribute('y2', 0);

    updateStatus();
    if (userTriggered) showToast('New round');
  }

  function resetMatch() {
    scores = { X: 0, O: 0, draw: 0 };
    saveScores();
    renderScores();
    startNewRound(false);
    showToast('Match reset');
  }

  function onModeClick(e) {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    const newMode = btn.dataset.mode;
    if (newMode === mode) return;
    mode = newMode;

    Array.from(els.modeSegmented.querySelectorAll('.seg-btn')).forEach(b => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
    els.oLabel.textContent = mode === 'cpu' ? 'CPU' : 'O';

    startNewRound(false);
  }

  /* ------------------------------------------------------------------ */
  /* Sound (Web Audio, no external assets)                               */
  /* ------------------------------------------------------------------ */

  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundOn) return;
    const ctx = ensureAudio();
    if (!ctx) return;

    const freqs = { x: 520, o: 400, win: 660, draw: 300 };
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'win' ? 'triangle' : 'sine';
    osc.frequency.value = freqs[type] || 440;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'win' ? 0.5 : 0.18));

    osc.start(now);
    osc.stop(now + (type === 'win' ? 0.5 : 0.18));

    if (type === 'win') {
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 880;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.06, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    }
  }

  function toggleSound() {
    soundOn = !soundOn;
    saveSoundPref();
    renderSoundIcon();
    if (soundOn) {
      ensureAudio();
      playSound('x');
    }
  }

  function renderSoundIcon() {
    els.soundToggle.setAttribute('aria-pressed', String(soundOn));
    els.soundOnIcon.hidden = !soundOn;
    els.soundOffIcon.hidden = soundOn;
  }

  /* ------------------------------------------------------------------ */
  /* Persistence                                                          */
  /* ------------------------------------------------------------------ */

  function loadScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore corrupt storage */ }
    return { X: 0, O: 0, draw: 0 };
  }

  function saveScores() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch (_) { /* ignore */ }
  }

  function loadSoundPref() {
    try {
      const raw = localStorage.getItem(SOUND_KEY);
      return raw === null ? true : raw === '1';
    } catch (_) { return true; }
  }

  function saveSoundPref() {
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (_) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', init);
})();
