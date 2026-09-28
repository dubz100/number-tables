(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Operations. Each one turns a "table" number t and a partner n (1–12) into a
  // question. To switch on adding / taking away / sharing later, flip
  // `enabled` to true — the home screen shows a picker once more than one is on.
  // ---------------------------------------------------------------------------
  const OPS = {
    mul: {
      enabled: true,
      symbol: '×',
      word: 'times',
      fact: (t, n) => ({ a: n, b: t, answer: n * t }),
      hint: (a, b) => groupsHint(a, b, `${a} group${a === 1 ? '' : 's'} of ${b}`),
    },
    add: {
      enabled: false,
      symbol: '+',
      word: 'plus',
      fact: (t, n) => ({ a: n, b: t, answer: n + t }),
      hint: (a, b) => groupsHint(1, a, `${a}`) + groupsHint(1, b, `and ${b} more`),
    },
    sub: {
      enabled: false,
      symbol: '−',
      word: 'take away',
      fact: (t, n) => ({ a: n + t, b: t, answer: n }),
    },
    div: {
      enabled: false,
      symbol: '÷',
      word: 'divided by',
      fact: (t, n) => ({ a: n * t, b: t, answer: n }),
      hint: (a, b) => groupsHint(a / b, b, `${a} shared into groups of ${b}`),
    },
  };

  const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const PLANET_COLOURS = [
    '#ff6b6b', '#ff9f43', '#f7c51e', '#2ecc71', '#1abc9c', '#3fa9f5',
    '#5b7cfa', '#8b5cf6', '#d05ce3', '#ff5fa2', '#e17055', '#00b894',
  ];
  const ANSWER_COLOURS = ['#3fa9f5', '#ff5fa2', '#8b5cf6', '#ff9f43'];
  const PRAISE = ['Awesome!', 'Super!', 'Brilliant!', 'Yes!', 'Amazing!', 'Wow!', 'Great job!', 'Fantastic!', 'Nailed it!', 'Superstar!'];
  const NUDGE = ['Nearly!', 'Try again!', 'So close!', 'Have another go!'];
  const FRIENDS = [
    ['🐶', 'Puppy'], ['🐱', 'Kitty'], ['🦊', 'Fox'], ['🐻', 'Bear'], ['🐼', 'Panda'], ['🐨', 'Koala'],
    ['🐯', 'Tiger'], ['🦁', 'Lion'], ['🐮', 'Cow'], ['🐷', 'Piggy'], ['🐸', 'Frog'], ['🐵', 'Monkey'],
    ['🐔', 'Chicken'], ['🐧', 'Penguin'], ['🦉', 'Owl'], ['🦄', 'Unicorn'], ['🐝', 'Bee'], ['🐞', 'Ladybird'],
    ['🦋', 'Butterfly'], ['🐢', 'Turtle'], ['🐙', 'Octopus'], ['🦀', 'Crab'], ['🐬', 'Dolphin'], ['🐳', 'Whale'],
    ['🦈', 'Shark'], ['🐊', 'Crocodile'], ['🦒', 'Giraffe'], ['🐘', 'Elephant'], ['🦘', 'Kangaroo'], ['🦩', 'Flamingo'],
    ['🦖', 'T-Rex'], ['🦕', 'Dino'], ['🐉', 'Dragon'], ['👽', 'Alien'], ['🤖', 'Robot'], ['👾', 'Space Invader'],
  ];

  // ---------------------------------------------------------------------------
  // Saved progress (per-device, in localStorage)
  // ---------------------------------------------------------------------------
  const STORE_KEY = 'maths-rockets-v1';
  const defaults = () => ({
    stars: {},        // "mul:3" -> best stars (1-3)
    friends: [],      // indexes into FRIENDS
    settings: { name: '', sound: true, voice: true, length: 10, op: 'mul', peeks: 3 },
  });

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved) {
        const d = defaults();
        return { ...d, ...saved, settings: { ...d.settings, ...saved.settings } };
      }
    } catch (e) { /* storage unavailable — play without saving */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  let data = load();
  if (!OPS[data.settings.op] || !OPS[data.settings.op].enabled) data.settings.op = 'mul';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function groupsHint(rows, perRow, label) {
    const d = Math.max(8, Math.min(22, Math.floor(280 / perRow) - 3));
    let html = `<div class="label">${label}</div>`;
    for (let r = 0; r < rows; r++) {
      html += `<div class="row">${'<span class="dot"></span>'.repeat(perRow)}</div>`;
    }
    return html.replace(/<div class="row">/g, `<div class="row" style="--d:${d}px">`);
  }

  // ---------------------------------------------------------------------------
  // Sound (tiny Web Audio synth — no files to download)
  // ---------------------------------------------------------------------------
  let audio;
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const t0 = audio.currentTime + start;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  function sound(kind) {
    if (!data.settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      if (kind === 'right') { [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.25, 'triangle')); }
      if (kind === 'streak') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.3, 'triangle')); }
      if (kind === 'wrong') { tone(220, 0, 0.18, 'square', 0.06); tone(175, 0.12, 0.25, 'square', 0.06); }
      if (kind === 'tap') { tone(880, 0, 0.06, 'sine', 0.08); }
      if (kind === 'win') {
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.35, 'triangle', 0.2));
      }
    } catch (e) { /* audio not available */ }
  }

  // ---------------------------------------------------------------------------
  // Voice — reads questions aloud so non-readers can play
  // ---------------------------------------------------------------------------
  const canSpeak = 'speechSynthesis' in window;
  let voice = null;
  function chooseVoice() {
    if (!canSpeak) return;
    const voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
    const pref = (navigator.language || 'en-GB').toLowerCase();
    voice = voices.find((v) => v.lang.toLowerCase() === pref) ||
            voices.find((v) => /en-gb/i.test(v.lang)) || voices[0] || null;
  }
  if (canSpeak) {
    chooseVoice();
    speechSynthesis.addEventListener?.('voiceschanged', chooseVoice);
  }

  // Resolves when speaking finishes (or straight away if voice is off).
  function speak(text, force = false) {
    if (!canSpeak || (!data.settings.voice && !force)) return Promise.resolve();
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = 0.9;
      u.pitch = 1.15;
      const done = () => { clearTimeout(timer); resolve(); };
      const timer = setTimeout(done, 800 + text.length * 110);
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    });
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  function confetti(el, count = 14, bits = ['⭐', '✨', '🎉', '💫', '🌟']) {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const fx = $('fx');
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = pick(bits);
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 140;
      s.style.setProperty('--x0', `${cx - 13}px`);
      s.style.setProperty('--y0', `${cy - 13}px`);
      s.style.setProperty('--x1', `${cx - 13 + Math.cos(ang) * dist}px`);
      s.style.setProperty('--y1', `${cy - 13 + Math.sin(ang) * dist}px`);
      s.style.setProperty('--r', `${rand(720) - 360}deg`);
      s.style.setProperty('--t', `${0.8 + Math.random() * 0.6}s`);
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  }
  const buzz = (p) => { try { navigator.vibrate?.(p); } catch (e) { /* ignore */ } };

  // ---------------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------------
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    window.scrollTo(0, 0);
  }

  function totalStars() {
    return Object.values(data.stars).reduce((a, b) => a + b, 0);
  }

  function renderHome() {
    const op = OPS[data.settings.op];
    $('totalStars').textContent = totalStars();
    $('stickerCount').textContent = `${data.friends.length}/${FRIENDS.length}`;
    const name = data.settings.name.trim();
    $('hello').textContent = name ? `Hi ${name}! Pick a planet to fly to!` : 'Pick a planet to fly to!';

    const enabledOps = Object.entries(OPS).filter(([, o]) => o.enabled);
    const tabs = $('opTabs');
    tabs.hidden = enabledOps.length < 2;
    tabs.innerHTML = enabledOps.map(([key, o]) =>
      `<button data-op="${key}" aria-pressed="${key === data.settings.op}" aria-label="${o.word}">${o.symbol}</button>`
    ).join('');

    $('planets').innerHTML = TABLES.map((t, i) => {
      const stars = data.stars[`${data.settings.op}:${t}`] || 0;
      return `<button class="planet${stars === 3 ? ' done' : ''}" data-table="${t}"
        style="--c:${PLANET_COLOURS[i]}" aria-label="${t} ${op.word} table, ${stars} stars">
        <span class="op">${op.symbol}</span>
        <span class="num">${t}</span>
        <span class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
      </button>`;
    }).join('');
    show('home');
  }

  function renderStickers() {
    const have = new Set(data.friends);
    $('stickerGrid').innerHTML = FRIENDS.map(([emoji, name], i) =>
      have.has(i)
        ? `<div class="sticker" title="${name}">${emoji}<small>${name}</small></div>`
        : '<div class="sticker locked">?</div>'
    ).join('');
    $('stickerHint').textContent = have.size === FRIENDS.length
      ? 'You found every friend! 🎉'
      : `You have ${have.size} of ${FRIENDS.length} friends. Finish a planet to find more!`;
    show('stickers');
  }

  // ---------------------------------------------------------------------------
  // The whole table — shown before a game and when peeking mid-game
  // ---------------------------------------------------------------------------
  function tableName(opKey, t) {
    return opKey === 'mul' ? `The ${t} times table` : `${OPS[opKey].symbol} ${t}`;
  }

  function renderTable(el, opKey, t) {
    const op = OPS[opKey];
    el.style.setProperty('--c', PLANET_COLOURS[t - 1]);
    el.innerHTML = TABLES.map((n) => {
      const f = op.fact(t, n);
      return `<div class="fact"><span>${f.a} ${op.symbol} ${f.b} =</span><span class="ans">${f.answer}</span></div>`;
    }).join('');
  }

  let studyTable = null;
  let readToken = 0;

  function stopReading() {
    readToken++;
    document.querySelectorAll('.fact.reading').forEach((r) => r.classList.remove('reading'));
    if (canSpeak) speechSynthesis.cancel();
  }

  // Reads the table out loud one line at a time, lighting up each line.
  async function readTable() {
    stopReading();
    const token = readToken;
    const op = OPS[data.settings.op];
    const rows = [...$('studyTable').children];
    for (let i = 0; i < rows.length; i++) {
      if (token !== readToken) return;
      const f = op.fact(studyTable, TABLES[i]);
      rows.forEach((r) => r.classList.toggle('reading', r === rows[i]));
      rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
      await Promise.all([speak(`${f.a} ${op.word} ${f.b} is ${f.answer}`, true), sleep(700)]);
    }
    if (token === readToken) rows.forEach((r) => r.classList.remove('reading'));
  }

  function startStudy(table) {
    studyTable = table;
    $('studyTitle').textContent = tableName(data.settings.op, table);
    $('studyReadBtn').hidden = !canSpeak;
    renderTable($('studyTable'), data.settings.op, table);
    show('study');
  }

  // ---------------------------------------------------------------------------
  // Game
  // ---------------------------------------------------------------------------
  let game = null;

  function buildQuestions(opKey, table, length) {
    const op = OPS[opKey];
    const qs = [];
    if (table) {
      let pool = [];
      while (qs.length < length) {
        if (!pool.length) pool = shuffle(TABLES);
        qs.push({ ...op.fact(table, pool.pop()), t: table });
      }
    } else {
      let last = '';
      while (qs.length < length) {
        const t = pick(TABLES);
        const q = { ...op.fact(t, pick(TABLES)), t };
        const sig = `${q.a},${q.b}`;
        if (sig !== last) { qs.push(q); last = sig; }
      }
    }
    return qs;
  }

  function choicesFor(q) {
    const { answer, b } = q;
    // Likely mix-ups first: the neighbouring fact, then off-by-one/two.
    const near = shuffle([answer + b, answer - b]).concat(shuffle([answer + 1, answer - 1, answer + 2, answer - 2]), [answer + 10, answer - 10, answer + 3]);
    const wrong = [];
    for (const n of near) {
      if (n > 0 && n !== answer && !wrong.includes(n)) wrong.push(n);
      if (wrong.length === 3) break;
    }
    return shuffle([answer, ...wrong]);
  }

  function startGame(table) {
    const opKey = data.settings.op;
    game = {
      opKey,
      table,
      key: `${opKey}:${table || 'mix'}`,
      questions: buildQuestions(opKey, table, Number(data.settings.length) || 10),
      index: 0,
      firstTry: 0,
      streak: 0,
      misses: 0,
      busy: false,
      peeksLeft: Number(data.settings.peeks) < 0 ? Infinity : Number(data.settings.peeks),
    };
    stopReading();
    $('trackGoal').textContent = table ? '🪐' : '🌍';
    show('play');
    nextQuestion();
  }

  function questionText(q) {
    return `${q.a} ${OPS[game.opKey].symbol} ${q.b}`;
  }

  function nextQuestion() {
    const q = game.questions[game.index];
    game.misses = 0;
    game.busy = false;
    $('question').textContent = questionText(q);
    $('qmark').textContent = '?';
    $('qmark').classList.remove('solved');
    $('praise').innerHTML = '&nbsp;';
    $('hint').hidden = true;
    $('hintBtn').hidden = !OPS[game.opKey].hint;
    updatePeekBtn();
    $('answers').classList.remove('locked');
    $('answers').innerHTML = choicesFor(q).map((n, i) =>
      `<button class="answer" data-n="${n}" style="--c:${ANSWER_COLOURS[i]}">${n}</button>`
    ).join('');
    updateTrack();
    speak(`What is ${q.a} ${OPS[game.opKey].word} ${q.b}?`);
  }

  function updateTrack() {
    const pct = (game.index / game.questions.length) * 100;
    $('trackFill').style.width = `${pct}%`;
    $('trackRocket').style.left = `${Math.min(pct, 94)}%`;
    $('streakNum').textContent = game.streak;
    $('streak').classList.toggle('hot', game.streak >= 3);
  }

  function updatePeekBtn() {
    const btn = $('peekBtn');
    btn.hidden = Number(data.settings.peeks) === 0;
    btn.disabled = game.peeksLeft <= 0;
    $('peekLeft').textContent = game.peeksLeft === Infinity ? '∞' : game.peeksLeft;
  }

  function peek() {
    if (!game || game.busy || game.peeksLeft <= 0) return;
    const q = game.questions[game.index];
    game.peeksLeft--;
    updatePeekBtn();
    $('peekTitle').textContent = tableName(game.opKey, q.t);
    $('peekLeftText').textContent = game.peeksLeft === Infinity ? ''
      : game.peeksLeft === 0 ? 'That was your last look this game!'
      : `You can look ${game.peeksLeft} more time${game.peeksLeft === 1 ? '' : 's'} this game.`;
    renderTable($('peekTable'), game.opKey, q.t);
    $('peek').showModal();
    $('peek').scrollTop = 0;
  }

  function showHint() {
    const q = game.questions[game.index];
    const op = OPS[game.opKey];
    if (!op.hint) return;
    const h = $('hint');
    h.innerHTML = op.hint(q.a, q.b);
    h.hidden = false;
  }

  async function answer(btn) {
    if (!game || game.busy) return;
    const q = game.questions[game.index];
    const n = Number(btn.dataset.n);

    if (n !== q.answer) {
      game.misses++;
      game.streak = 0;
      btn.classList.add('wrong');
      $('questionCard').classList.remove('wobble');
      void $('questionCard').offsetWidth;
      $('questionCard').classList.add('wobble');
      $('praise').textContent = pick(NUDGE);
      sound('wrong');
      buzz(80);
      updateTrack();
      if (game.misses >= 2) showHint();
      return;
    }

    game.busy = true;
    $('answers').classList.add('locked');
    btn.classList.add('right');
    $('qmark').textContent = q.answer;
    $('qmark').classList.add('solved');
    if (game.misses === 0) {
      game.firstTry++;
      game.streak++;
    }
    const name = data.settings.name.trim();
    const praise = pick(PRAISE);
    $('praise').textContent = game.streak >= 3 && game.misses === 0 ? `🔥 ${game.streak} in a row!` : praise;
    $('praise').classList.remove('show');
    void $('praise').offsetWidth;
    $('praise').classList.add('show');
    sound(game.streak >= 3 && game.streak % 3 === 0 ? 'streak' : 'right');
    confetti(btn, game.streak >= 5 ? 22 : 14);
    buzz(30);

    game.index++;
    updateTrack();
    const said = speak(`${praise.replace('!', '')}${name && Math.random() < 0.3 ? `, ${name}` : ''}! ${q.a} ${OPS[game.opKey].word} ${q.b} is ${q.answer}.`);
    await Promise.all([sleep(900), said]);
    if (!game) return; // player left mid-celebration

    if (game.index >= game.questions.length) finishGame();
    else nextQuestion();
  }

  function finishGame() {
    const g = game;
    const total = g.questions.length;
    const ratio = g.firstTry / total;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
    data.stars[g.key] = Math.max(data.stars[g.key] || 0, stars);

    // A new space friend for every finished game, until the book is full.
    const missing = FRIENDS.map((_, i) => i).filter((i) => !data.friends.includes(i));
    const friend = missing.length ? pick(missing) : null;
    if (friend !== null) data.friends.push(friend);
    save();

    const name = data.settings.name.trim();
    const where = g.table ? `the ${g.table} planet` : 'Planet Earth';
    $('resultTitle').textContent = stars === 3 ? `WOW${name ? `, ${name}` : ''}!` : `You made it${name ? `, ${name}` : ''}!`;
    $('resultText').textContent = `You flew to ${where} and got ${g.firstTry} of ${total} right first time!`;
    $('bigStars').innerHTML = [0, 1, 2].map((i) =>
      `<span class="${i < stars ? '' : 'off'}" style="animation-delay:${0.25 + i * 0.3}s">⭐</span>`
    ).join('');
    $('newFriend').hidden = friend === null;
    if (friend !== null) {
      $('friendEmoji').textContent = FRIENDS[friend][0];
      $('friendName').textContent = FRIENDS[friend][1];
    }
    show('results');
    sound('win');
    setTimeout(() => confetti($('bigStars'), 30), 400);
    speak(`You made it! ${stars} star${stars === 1 ? '' : 's'}!${friend !== null ? ` You found a new friend. ${FRIENDS[friend][1]}!` : ''}`);
  }

  function leaveGame() {
    game = null;
    if ($('peek').open) $('peek').close();
    stopReading();
    renderHome();
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  $('planets').addEventListener('click', (e) => {
    const p = e.target.closest('.planet');
    if (!p) return;
    sound('tap');
    startStudy(Number(p.dataset.table));
  });
  $('opTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-op]');
    if (!b) return;
    sound('tap');
    data.settings.op = b.dataset.op;
    save();
    renderHome();
  });
  $('studyGoBtn').addEventListener('click', () => { sound('tap'); startGame(studyTable); });
  $('studyBackBtn').addEventListener('click', () => { sound('tap'); stopReading(); renderHome(); });
  $('studyReadBtn').addEventListener('click', readTable);
  $('peekBtn').addEventListener('click', () => { sound('tap'); peek(); });
  $('mixBtn').addEventListener('click', () => { sound('tap'); startGame(null); });
  $('stickersBtn').addEventListener('click', () => { sound('tap'); renderStickers(); });
  $('stickersBackBtn').addEventListener('click', () => { sound('tap'); renderHome(); });
  $('answers').addEventListener('click', (e) => {
    const b = e.target.closest('.answer');
    if (b) answer(b);
  });
  $('speakBtn').addEventListener('click', () => {
    const q = game && game.questions[game.index];
    if (!q) return;
    if (!data.settings.voice) { data.settings.voice = true; save(); }
    speak(`What is ${q.a} ${OPS[game.opKey].word} ${q.b}?`);
  });
  $('hintBtn').addEventListener('click', () => {
    sound('tap');
    if ($('hint').hidden) showHint(); else $('hint').hidden = true;
  });
  $('quitBtn').addEventListener('click', () => {
    if (game && game.index > 0 && !confirm('Leave this game?')) return;
    leaveGame();
  });
  $('againBtn').addEventListener('click', () => { sound('tap'); startGame(game ? game.table : null); });
  $('homeBtn').addEventListener('click', () => { sound('tap'); leaveGame(); });

  // Settings
  const dlg = $('settings');
  $('settingsBtn').addEventListener('click', () => {
    $('nameInput').value = data.settings.name;
    $('soundToggle').checked = data.settings.sound;
    $('voiceToggle').checked = data.settings.voice;
    $('voiceToggle').disabled = !canSpeak;
    $('lengthSelect').value = String(data.settings.length);
    $('peeksSelect').value = String(data.settings.peeks);
    dlg.showModal();
  });
  dlg.addEventListener('close', () => {
    data.settings.name = $('nameInput').value.trim().slice(0, 16);
    data.settings.sound = $('soundToggle').checked;
    data.settings.voice = $('voiceToggle').checked;
    data.settings.length = Number($('lengthSelect').value) || 10;
    data.settings.peeks = Number($('peeksSelect').value);
    save();
    renderHome();
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all stars and friends? This cannot be undone.')) return;
    const settings = data.settings;
    data = defaults();
    data.settings = settings;
    save();
    dlg.close();
  });

  renderHome();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
