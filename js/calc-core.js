// Generic engine: handles every <form data-calc="name"> using CALCS and ROWS from calculators.js
const fmt = (n, d = 2) => String(Number(n.toFixed(d)));

(function () {
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function read(el) {
    const label = el.dataset.label, raw = el.value.trim();
    if (el.tagName === 'SELECT') return raw === '' ? { error: 'Please choose ' + label + '.' } : { value: Number(raw) };
    if (el.type === 'date') return raw ? { value: Date.parse(raw + 'T00:00:00Z') } : { error: 'Please select ' + label + '.' };
    if (raw === '') return { error: 'Please enter ' + label + '.' };
    const v = Number(raw);
    if (!Number.isFinite(v)) return { error: 'Please enter a valid number.' };
    const min = el.min === '' ? null : Number(el.min), max = el.max === '' ? null : Number(el.max);
    if (min === 0 && v < 0) return { error: 'Negative numbers are not allowed.' };
    if (min !== null && max !== null && (v < min || v > max)) return { error: cap(label) + ' must be between ' + min + ' and ' + max + '.' };
    if (min !== null && v < min) return { error: cap(label) + ' must be at least ' + min + '.' };
    if (max !== null && v > max) return { error: cap(label) + ' cannot be more than ' + max + '.' };
    if (el.dataset.positive !== undefined && v <= 0) return { error: cap(label) + ' must be greater than 0.' };
    return { value: v };
  }

  function setErr(el, msg) {
    const row = el.closest('.row');
    const box = row ? row.querySelector('.err') : document.getElementById(el.id + '-err');
    if (box) box.textContent = msg ? '⚠ ' + msg : '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function render(panel, r) {
    panel.querySelector('.empty').hidden = true;
    const out = panel.querySelector('.out');
    out.hidden = false;
    out.innerHTML = '<p class="label">' + r.label + '</p><p class="big">' + r.big + '</p>'
      + (r.badge ? '<p><span class="status ' + r.badge[0] + '">' + r.badge[1] + '</span></p>' : '')
      + (r.stats ? '<div class="stats">' + r.stats.map(s => '<div class="stat"><span class="label">' + s[0] + '</span><b>' + s[1] + '</b></div>').join('') + '</div>' : '')
      + (r.note ? '<p class="note">' + r.note + '</p>' : '');
  }

  function hide(panel) { panel.querySelector('.out').hidden = true; panel.querySelector('.empty').hidden = false; }

  function init(form) {
    const name = form.dataset.calc, def = CALCS[name], cfg = ROWS[name];
    const panel = form.closest('.calc').querySelector('.result-panel');
    const box = form.querySelector('[data-rows]'), formErr = form.querySelector('.form-err');
    const cols = cfg ? { style: '28px repeat(' + cfg.cols.length + ',1fr) 44px' } : null;

    const rowEls = () => [...box.querySelectorAll('.row:not(.head)')];
    function renumber() {
      rowEls().forEach((r, i) => {
        r.querySelector('.n').textContent = i + 1;
        r.querySelectorAll('[data-k]').forEach(el => el.setAttribute('aria-label', cfg.noun + ' ' + (i + 1) + ' ' + el.dataset.name));
        r.querySelector('.rm').setAttribute('aria-label', 'Remove ' + cfg.noun.toLowerCase() + ' ' + (i + 1));
      });
    }
    function addRow() {
      const r = document.createElement('div');
      r.className = 'row';
      r.style.gridTemplateColumns = cols.style;
      r.innerHTML = '<span class="n"></span>' + cfg.cols.map(c => c.opts
        ? '<select data-k="' + c.k + '" data-name="' + c.label.toLowerCase() + '" data-label="a ' + c.label.toLowerCase() + '"><option value="">Select</option>' + c.opts.map(o => '<option value="' + o[1] + '">' + o[0] + '</option>').join('') + '</select>'
        : '<input data-k="' + c.k + '" data-name="' + c.label.toLowerCase() + '" data-label="' + c.label.toLowerCase() + '" type="number" inputmode="decimal" step="any" placeholder="' + c.ph + '"' + (c.min !== undefined ? ' min="' + c.min + '"' : '') + (c.max !== undefined ? ' max="' + c.max + '"' : '') + (c.positive ? ' data-positive' : '') + '>').join('')
        + '<button type="button" class="rm">' + Icons.svg('x') + '</button><p class="err" role="alert"></p>';
      box.appendChild(r);
      renumber();
    }
    function buildRows() {
      box.innerHTML = '<div class="row head" aria-hidden="true" style="grid-template-columns:' + cols.style + '"><span></span>' + cfg.cols.map(c => '<span>' + c.label + '</span>').join('') + '<span></span></div>';
      for (let i = 0; i < cfg.initial; i++) addRow();
    }
    if (box) {
      buildRows();
      form.querySelector('[data-add]').addEventListener('click', () => { addRow(); box.querySelector('.row:last-of-type input, .row:last-of-type select').focus(); });
      box.addEventListener('click', e => {
        const rm = e.target.closest('.rm');
        if (!rm) return;
        const row = rm.closest('.row');
        if (rowEls().length > 1) { row.remove(); renumber(); }
        else row.querySelectorAll('[data-k]').forEach(el => { el.value = ''; setErr(el, ''); });
      });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const vals = {};
      let ok = true;
      form.querySelectorAll('.field [data-label]').forEach(el => {
        const r = read(el);
        setErr(el, r.error || '');
        if (r.error) ok = false; else vals[el.name] = r.value;
      });
      if (box) {
        const rows = [];
        rowEls().forEach(r => {
          const els = [...r.querySelectorAll('[data-k]')];
          els.forEach(el => setErr(el, ''));
          if (els.every(el => el.value.trim() === '')) return;
          const o = {};
          for (const el of els) {
            const res = read(el);
            if (res.error) { setErr(el, res.error); ok = false; break; }
            o[el.dataset.k] = res.value;
          }
          rows.push(o);
        });
        formErr.textContent = rows.length ? '' : '⚠ Please fill in at least one ' + cfg.noun.toLowerCase() + '.';
        if (!rows.length) ok = false;
        vals.rows = rows;
      }
      if (!ok) return hide(panel);
      const res = def.run(vals);
      if (res.error) { setErr(form.querySelector('[name="' + res.error.name + '"]'), res.error.msg); return hide(panel); }
      render(panel, res);
      if (matchMedia('(max-width:900px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    form.querySelector('[data-reset]').addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(el => setErr(el, ''));
      if (formErr) formErr.textContent = '';
      if (box) buildRows();
      hide(panel);
      const first = form.querySelector('input, select');
      if (first) first.focus();
    });
  }

  document.querySelectorAll('form[data-calc]').forEach(init);
})();
