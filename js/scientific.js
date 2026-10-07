(function () {
  const $ = id => document.getElementById(id);
  const exprEl = $('sciExpr'), resEl = $('sciRes'), live = $('sciLive'), degBtn = $('degBtn'), histBox = $('history'), sci = $('sci');
  let expr = '', done = false, ans = 0, deg = true;
  const history = [];

  // ---------- Evaluator (no eval): tokenizer + recursive-descent parser ----------
  const NAMES = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'log', 'ln', 'Ans', 'e'];
  const OPCHARS = '+−-×*÷/^!%()';

  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (m) { out.push({ t: 'num', v: parseFloat(m[1]) }); i += m[1].length; continue; }
      if (c === 'π') { out.push({ t: 'num', v: Math.PI }); i++; continue; }
      if (c === '√') { out.push({ t: 'fn', v: 'sqrt' }); i++; continue; }
      const name = NAMES.find(n => s.startsWith(n, i));
      if (name) {
        i += name.length;
        if (name === 'e') out.push({ t: 'num', v: Math.E });
        else if (name === 'Ans') out.push({ t: 'num', v: ans });
        else out.push({ t: 'fn', v: name });
        continue;
      }
      if (OPCHARS.includes(c)) { out.push({ t: 'op', v: c === '-' ? '−' : c === '*' ? '×' : c === '/' ? '÷' : c }); i++; continue; }
      throw new Error('Syntax error');
    }
    return out;
  }

  const rad = x => deg ? x * Math.PI / 180 : x;
  const unrad = x => deg ? x * 180 / Math.PI : x;
  const clean = x => Math.abs(x) < 1e-12 ? 0 : x;

  function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Invalid input');
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function applyFn(f, x) {
    switch (f) {
      case 'sin': return clean(Math.sin(rad(x)));
      case 'cos': return clean(Math.cos(rad(x)));
      case 'tan': {
        const c = clean(Math.cos(rad(x)));
        if (c === 0) throw new Error('Undefined');
        return clean(Math.sin(rad(x)) / c);
      }
      case 'asin': case 'acos':
        if (x < -1 || x > 1) throw new Error('Invalid input');
        return unrad(f === 'asin' ? Math.asin(x) : Math.acos(x));
      case 'atan': return unrad(Math.atan(x));
      case 'ln': if (x <= 0) throw new Error('Invalid input'); return Math.log(x);
      case 'log': if (x <= 0) throw new Error('Invalid input'); return Math.log10(x);
      case 'sqrt': if (x < 0) throw new Error('Invalid input'); return Math.sqrt(x);
    }
    throw new Error('Syntax error');
  }

  function parse(tk) {
    let p = 0;
    const peek = () => tk[p];
    const isOp = v => peek() && peek().t === 'op' && peek().v === v;
    const startsPrimary = () => { const k = peek(); return k && (k.t === 'num' || k.t === 'fn' || (k.t === 'op' && k.v === '(')); };

    function expression() {
      let v = term();
      while (isOp('+') || isOp('−')) { const o = tk[p++].v; const r = term(); v = o === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp('×')) { p++; v *= unary(); }
        else if (isOp('÷')) { p++; const d = unary(); if (d === 0) throw new Error('Cannot divide by 0'); v /= d; }
        else if (startsPrimary()) v *= unary(); // implicit multiplication: 2π, 3(4+1)
        else return v;
      }
    }
    function unary() {
      if (isOp('−')) { p++; return -unary(); }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const base = postfix();
      if (isOp('^')) {
        p++;
        const r = Math.pow(base, unary());
        if (Number.isNaN(r)) throw new Error('Invalid input');
        return r;
      }
      return base;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp('!')) { p++; v = factorial(v); }
        else if (isOp('%')) { p++; v = v / 100; }
        else return v;
      }
    }
    function primary() {
      const k = tk[p++];
      if (!k) throw new Error('Syntax error');
      if (k.t === 'num') return k.v;
      if (k.t === 'op' && k.v === '(') {
        const v = expression();
        if (!isOp(')')) throw new Error('Syntax error');
        p++;
        return v;
      }
      if (k.t === 'fn') {
        let arg;
        if (isOp('(')) { p++; arg = expression(); if (!isOp(')')) throw new Error('Syntax error'); p++; }
        else if (peek() && peek().t === 'num') arg = tk[p++].v;
        else throw new Error('Syntax error');
        return applyFn(k.v, arg);
      }
      throw new Error('Syntax error');
    }

    const v = expression();
    if (p < tk.length) throw new Error('Syntax error');
    return v;
  }

  function evaluate(s) {
    const tk = tokenize(s);
    let open = 0;
    tk.forEach(k => { if (k.t === 'op') { if (k.v === '(') open++; else if (k.v === ')') open--; } });
    while (open-- > 0) tk.push({ t: 'op', v: ')' }); // auto-close brackets
    const v = parse(tk);
    if (!Number.isFinite(v)) throw new Error('Math error');
    return Number(v.toPrecision(12));
  }

  function fmtNum(v) {
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e15 || a < 1e-9) return v.toExponential(6).replace(/\.?0+e/, 'e');
    return v.toLocaleString('en-US', { maximumSignificantDigits: 12 });
  }

  // ---------- UI ----------
  const BIN = ['+', '×', '÷', '^'];
  const OPS = ['+', '−', '×', '÷', '^', '!', '%'];
  const KNOWN = ['Syntax error', 'Invalid input', 'Cannot divide by 0', 'Math error', 'Undefined'];

  function setRes(text, mode) {
    resEl.textContent = text;
    resEl.className = 'sci-res' + (mode ? ' ' + mode : '');
  }

  function render() {
    exprEl.textContent = expr || '0';
    exprEl.scrollLeft = exprEl.scrollWidth;
  }

  function preview() {
    render();
    if (!expr) return setRes('0', 'preview');
    try { setRes(fmtNum(evaluate(expr)), 'preview'); } catch (e) { setRes('', 'preview'); }
  }

  function add(tok) {
    if (done) { expr = OPS.includes(tok) ? 'Ans' : ''; done = false; }
    if (tok === '.' && (/(\d*\.\d*)$/.exec(expr) || [])[1]) return;
    if (BIN.includes(tok) && /[+−×÷^]$/.test(expr)) expr = expr.slice(0, -1);
    if (expr === '' && OPS.includes(tok) && tok !== '−') expr = 'Ans';
    expr += tok;
    preview();
  }

  function del() {
    if (done) return clearAll();
    expr = expr.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|√\(|Ans|.)$/u, '');
    preview();
  }

  function clearAll() { expr = ''; done = false; preview(); }

  function inverse() {
    expr = done || !expr ? '1÷(Ans)' : '1÷(' + expr + ')';
    done = false;
    preview();
  }

  function equals() {
    if (!expr) return;
    try {
      const v = evaluate(expr), text = fmtNum(v);
      ans = v;
      history.unshift({ expr, res: text });
      if (history.length > 15) history.pop();
      done = true;
      setRes(text);
      live.textContent = 'Result ' + text;
      renderHistory();
    } catch (e) {
      const msg = KNOWN.includes(e.message) ? e.message : 'Syntax error';
      setRes(msg, 'error');
      live.textContent = msg;
      done = false;
    }
  }

  function renderHistory() {
    histBox.textContent = '';
    if (!history.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'Your calculations will appear here.';
      histBox.appendChild(p);
      return;
    }
    history.forEach(h => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hist-item';
      const a = document.createElement('span'); a.className = 'h-expr'; a.textContent = h.expr;
      const r = document.createElement('span'); r.className = 'h-res'; r.textContent = '= ' + h.res;
      b.append(a, r);
      b.addEventListener('click', () => { expr = h.expr; done = false; preview(); });
      histBox.appendChild(b);
    });
  }

  function toggleDeg() {
    deg = !deg;
    degBtn.textContent = deg ? 'Deg' : 'Rad';
    degBtn.setAttribute('aria-label', 'Angle mode: ' + (deg ? 'degrees' : 'radians') + '. Press to switch.');
    if (!done) preview();
  }

  sci.addEventListener('click', e => {
    const k = e.target.closest('.key');
    if (!k) return;
    const v = k.dataset.v;
    if (v === 'act:eq') equals();
    else if (v === 'act:ac') clearAll();
    else if (v === 'act:del') del();
    else if (v === 'act:deg') toggleDeg();
    else if (v === 'act:inv') inverse();
    else add(v);
  });

  $('clearHist').addEventListener('click', () => { history.length = 0; renderHistory(); });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!(e.target === document.body || sci.contains(e.target))) return;
    const k = e.key;
    if (/^[0-9.]$/.test(k) || '+-*/^()!%'.includes(k) && k.length === 1) { add(k === '-' ? '−' : k === '*' ? '×' : k === '/' ? '÷' : k); e.preventDefault(); }
    else if (k === 'Enter' || k === '=') { equals(); e.preventDefault(); }
    else if (k === 'Backspace') { del(); e.preventDefault(); }
    else if (k === 'Escape' || k === 'Delete') { clearAll(); e.preventDefault(); }
  });

  renderHistory();
  preview();
})();
