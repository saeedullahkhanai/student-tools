(function () {
  const $ = id => document.getElementById(id);
  const inputs = { focus: $('focus'), break: $('break') };
  const baseTitle = document.title;
  let mode = 'focus', total = 0, remaining = 0, endAt = 0, timer = null, running = false, started = false, done = 0;

  function mins(k) {
    const el = inputs[k], v = Number(el.value), max = Number(el.max);
    let msg = '';
    if (el.value.trim() === '') msg = 'Please enter the ' + k + ' time.';
    else if (!Number.isInteger(v)) msg = 'Please use a whole number of minutes.';
    else if (v < 1 || v > max) msg = 'Use a value between 1 and ' + max + '.';
    $(k + '-err').textContent = msg ? '⚠ ' + msg : '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return msg ? null : v;
  }

  const pad = n => String(n).padStart(2, '0');
  function show() {
    const t = pad(Math.floor(remaining / 60)) + ':' + pad(remaining % 60);
    $('time').textContent = t;
    $('barFill').style.width = (total ? (1 - remaining / total) * 100 : 0) + '%';
    $('mode').textContent = mode === 'focus' ? 'Focus time' : 'Break time';
    $('sessions').textContent = 'Completed focus sessions: ' + done;
    document.title = running ? t + ' – ' + $('mode').textContent : baseTitle;
  }

  function load() {
    const m = mins(mode);
    if (m === null) return false;
    total = remaining = m * 60;
    show();
    return true;
  }

  function beep() {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator();
      o.connect(c.destination); o.frequency.value = 880; o.start(); o.stop(c.currentTime + 0.4);
    } catch (e) {}
  }

  function stop() { clearInterval(timer); running = false; $('startBtn').textContent = started ? 'Resume' : 'Start'; }

  function finish() {
    stop(); beep();
    if (mode === 'focus') done++;
    $('msg').textContent = mode === 'focus' ? 'Focus session complete. Time for a break!' : 'Break over. Ready for the next session?';
    mode = mode === 'focus' ? 'break' : 'focus';
    started = false;
    load();
    $('startBtn').textContent = 'Start';
  }

  function tick() {
    remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    show();
    if (remaining === 0) finish();
  }

  $('startBtn').addEventListener('click', () => {
    if (running) { stop(); show(); $('msg').textContent = 'Paused.'; return; }
    if (!started) { if (!load()) return; started = true; }
    running = true;
    endAt = Date.now() + remaining * 1000;
    timer = setInterval(tick, 250);
    $('startBtn').textContent = 'Pause';
    $('msg').textContent = mode === 'focus' ? 'Stay focused.' : 'Relax and rest your eyes.';
    show();
  });

  $('resetBtn').addEventListener('click', () => {
    stop(); mode = 'focus'; started = false; done = 0;
    $('startBtn').textContent = 'Start';
    $('msg').textContent = 'Set your times and press Start.';
    load();
  });

  Object.values(inputs).forEach(el => el.addEventListener('input', () => { if (!started) load(); }));
  load();
})();
