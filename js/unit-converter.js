(function () {
  const $ = id => document.getElementById(id);
  const UNITS = {
    length: { m: ['Meters (m)', 1], km: ['Kilometers (km)', 1000], cm: ['Centimeters (cm)', .01], mm: ['Millimeters (mm)', .001], mi: ['Miles (mi)', 1609.344], yd: ['Yards (yd)', .9144], ft: ['Feet (ft)', .3048], in: ['Inches (in)', .0254] },
    weight: { kg: ['Kilograms (kg)', 1], g: ['Grams (g)', .001], mg: ['Milligrams (mg)', 1e-6], lb: ['Pounds (lb)', .45359237], oz: ['Ounces (oz)', .028349523125] },
    temperature: { C: ['Celsius (°C)', 1], F: ['Fahrenheit (°F)', 1], K: ['Kelvin (K)', 1] }
  };
  const cat = $('category'), val = $('value'), from = $('from'), to = $('to');

  function fill() {
    const opts = Object.entries(UNITS[cat.value]).map(([k, u]) => '<option value="' + k + '">' + u[0] + '</option>').join('');
    from.innerHTML = to.innerHTML = opts;
    to.selectedIndex = 1;
    update();
  }
  function convert(v, f, t) {
    if (cat.value === 'temperature') {
      const c = f === 'C' ? v : f === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
      return t === 'C' ? c : t === 'F' ? c * 9 / 5 + 32 : c + 273.15;
    }
    return v * UNITS[cat.value][f][1] / UNITS[cat.value][t][1];
  }
  const nice = n => n.toLocaleString('en-US', { maximumSignificantDigits: 8 });
  function update() {
    const raw = val.value.trim(), v = Number(raw), err = $('value-err');
    const out = $('out'), empty = $('empty');
    err.textContent = ''; val.setAttribute('aria-invalid', 'false');
    if (raw === '' || !Number.isFinite(v)) { out.hidden = true; empty.hidden = false; if (raw !== '') { err.textContent = '⚠ Please enter a valid number.'; val.setAttribute('aria-invalid', 'true'); } return; }
    const r = convert(v, from.value, to.value);
    $('big').textContent = nice(r) + ' ' + to.options[to.selectedIndex].text.match(/\(([^)]+)\)/)[1];
    $('note').textContent = nice(v) + ' ' + from.options[from.selectedIndex].text + ' = ' + nice(r) + ' ' + to.options[to.selectedIndex].text;
    empty.hidden = true; out.hidden = false;
  }
  cat.addEventListener('change', fill);
  [val, from, to].forEach(el => el.addEventListener('input', update));
  $('swap').addEventListener('click', () => { const f = from.value; from.value = to.value; to.value = f; update(); });
  fill();
})();
