(function () {
  const input = document.getElementById('q');
  const box = document.getElementById('results');
  if (!input) return;
  let hits = [];

  function render(term) {
    const q = term.trim().toLowerCase();
    if (!q) { box.hidden = true; box.innerHTML = ''; hits = []; return; }
    hits = ST.tools.filter(t => (t.n + ' ' + t.k + ' ' + t.c).toLowerCase().includes(q));
    box.hidden = false;
    box.innerHTML = hits.length
      ? hits.map(t => `<a href="tools/${t.s}.html"><span class="ri">${Icons.svg(t.i)}</span><span>${t.n}<small>${t.c}</small></span></a>`).join('')
      : '<p>No tools found. Try another search.</p>';
  }

  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; render(''); }
    if (e.key === 'Enter' && hits.length) location.href = 'tools/' + hits[0].s + '.html';
  });
})();
