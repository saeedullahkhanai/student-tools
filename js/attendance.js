(function () {
  const $ = id => document.getElementById(id);
  const form = $('attForm');
  const inputs = { total: $('total'), attended: $('attended'), required: $('required') };

  function setError(key, msg) {
    const el = $(key + '-err');
    el.textContent = msg ? '⚠ ' + msg : '';
    inputs[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  // Returns { value, error }
  function readNumber(input, { label, whole }) {
    const raw = input.value.trim();
    if (raw === '') return { error: 'Please enter ' + label + '.' };
    const value = Number(raw);
    if (!Number.isFinite(value)) return { error: 'Please enter a valid number.' };
    if (value < 0) return { error: 'Negative numbers are not allowed.' };
    if (whole && !Number.isInteger(value)) return { error: 'Please use a whole number.' };
    return { value };
  }

  function validate() {
    const t = readNumber(inputs.total, { label: 'the total number of classes', whole: true });
    const a = readNumber(inputs.attended, { label: 'the number of classes you attended', whole: true });
    const r = readNumber(inputs.required, { label: 'your required attendance %', whole: false });

    if (!t.error && t.value < 1) t.error = 'Total classes must be at least 1.';
    if (!a.error && !t.error && a.value > t.value) a.error = 'Attended classes cannot be more than total classes.';
    if (!r.error && r.value > 100) r.error = 'Required attendance must be between 0 and 100.';

    const ok = [setError('total', t.error), setError('attended', a.error), setError('required', r.error)].every(Boolean);
    return ok ? { total: t.value, attended: a.value, required: r.value } : null;
  }

  const fmt = n => String(Number(n.toFixed(2)));

  function calculate({ total, attended, required }) {
    const pct = attended / total * 100;
    const diff = attended * 100 - required * total; // >= 0 means requirement is met
    const status = Math.abs(diff) < 1e-9 ? 'eq' : diff > 0 ? 'ok' : 'bad';

    // Future classes you could skip and still stay at/above the requirement
    let canMiss = 0;
    if (status !== 'bad') canMiss = required === 0 ? Infinity : Math.floor(attended * 100 / required - total + 1e-9);

    // Classes to attend in a row to reach the requirement (null = impossible)
    let mustAttend = 0;
    if (status === 'bad') mustAttend = required >= 100 ? null : Math.ceil((required * total - 100 * attended) / (100 - required) - 1e-9);

    return { pct, status, canMiss, mustAttend };
  }

  function show(input, r) {
    const req = fmt(input.required);
    const text = {
      ok: ['✓ Above Required', 'ok'],
      bad: ['✕ Below Required', 'bad'],
      eq: ['= Exactly at Required', 'eq']
    }[r.status];

    $('pct').textContent = fmt(r.pct) + '%';
    const st = $('status');
    st.textContent = text[0];
    st.className = 'status ' + text[1];

    $('barFill').style.width = Math.min(r.pct, 100) + '%';
    $('barMark').style.left = input.required + '%';
    $('bar').setAttribute('aria-valuenow', Math.round(r.pct));
    $('legend').textContent = 'Dark marker = required attendance (' + req + '%)';

    $('canMiss').textContent = r.canMiss === Infinity ? 'Any number' : r.canMiss;
    $('mustAttend').textContent = r.mustAttend === null ? 'Not possible' : r.mustAttend;

    let note;
    if (r.status === 'bad') {
      note = r.mustAttend === null
        ? 'You are below 100%, so reaching 100% is no longer possible.'
        : 'Attend the next ' + r.mustAttend + ' ' + (r.mustAttend === 1 ? 'class' : 'classes') + ' in a row to reach ' + req + '%.';
    } else if (r.status === 'eq' && input.required > 0) {
      note = 'You are exactly at ' + req + '%. Missing the next class would take you below it.';
    } else if (r.canMiss === Infinity) {
      note = 'There is no attendance requirement, so you can miss any number of classes.';
    } else {
      note = 'You can miss up to ' + r.canMiss + ' more ' + (r.canMiss === 1 ? 'class' : 'classes') + ' and stay at or above ' + req + '%.';
    }
    $('note').textContent = note;

    $('empty').hidden = true;
    $('result').hidden = false;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = validate();
    if (!data) { $('result').hidden = true; $('empty').hidden = false; return; }
    show(data, calculate(data));
    if (matchMedia('(max-width:900px)').matches) $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  $('resetBtn').addEventListener('click', () => {
    form.reset();
    Object.keys(inputs).forEach(k => setError(k, ''));
    $('result').hidden = true;
    $('empty').hidden = false;
    inputs.total.focus();
  });
})();
