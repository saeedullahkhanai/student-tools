(function () {
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  const sync = () => btn.setAttribute('aria-checked', root.dataset.theme === 'dark');
  sync();
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();
