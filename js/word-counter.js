(function () {
  const $ = id => document.getElementById(id), t = $('text');
  function update() {
    const s = t.value, words = (s.trim().match(/\S+/g) || []).length;
    $('words').textContent = words;
    $('chars').textContent = s.length;
    $('nospace').textContent = s.replace(/\s/g, '').length;
    $('sentences').textContent = s.split(/[.!?]+/).filter(x => x.trim()).length;
    $('paras').textContent = s.split(/\n\s*\n/).filter(x => x.trim()).length;
    $('time').textContent = words === 0 ? '0 min' : words < 200 ? '< 1 min' : Math.ceil(words / 200) + ' min';
  }
  t.addEventListener('input', update);
  $('clear').addEventListener('click', () => { t.value = ''; update(); t.focus(); });
  update();
})();
