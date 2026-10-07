(function () {
  const $ = id => document.getElementById(id);

  // Mobile menu (all pages)
  const btn = $('menuBtn'), menu = $('menu');
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = Icons.svg(open ? 'x' : 'menu');
  });

  Icons.hydrate(); // decorative icons only; all page text and links are in the HTML
})();
