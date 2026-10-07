// Calculator definitions used by calc-core.js
// ROWS: dynamic row tables. CALCS: compute functions returning {label, big, badge, stats, note} or {error:{name,msg}}.
const GRADES = [['A (4.0)',4],['A- (3.7)',3.7],['B+ (3.3)',3.3],['B (3.0)',3],['B- (2.7)',2.7],['C+ (2.3)',2.3],['C (2.0)',2],['C- (1.7)',1.7],['D+ (1.3)',1.3],['D (1.0)',1],['F (0.0)',0]];

const ROWS = {
  'semester-gpa': { noun: 'Course', initial: 4, cols: [
    { k: 'credits', label: 'Credits', ph: '3', min: 0, positive: true },
    { k: 'grade', label: 'Grade', opts: GRADES }] },
  'cgpa': { noun: 'Semester', initial: 3, cols: [
    { k: 'gpa', label: 'GPA', ph: '3.4', min: 0, max: 10 },
    { k: 'credits', label: 'Credits', ph: '15', min: 0, positive: true }] },
  'grade': { noun: 'Item', initial: 3, cols: [
    { k: 'score', label: 'Score %', ph: '85', min: 0, max: 100 },
    { k: 'weight', label: 'Weight %', ph: '20', min: 0, max: 100, positive: true }] }
};

const CALCS = {
  'gpa-goal': { run(v) {
    if (v.current > v.scale) return { error: { name: 'current', msg: 'Current CGPA cannot be more than the scale (' + v.scale + ').' } };
    if (v.target > v.scale) return { error: { name: 'target', msg: 'Target CGPA cannot be more than the scale (' + v.scale + ').' } };
    const need = (v.target * (v.credits + v.next) - v.current * v.credits) / v.next;
    const stats = [['Credits after this semester', v.credits + v.next], ['Target CGPA', fmt(v.target)]];
    if (need > v.scale + 1e-9) return { label: 'GPA needed this semester', big: fmt(need), badge: ['bad', '✕ Not possible in one semester'], stats,
      note: 'You would need ' + fmt(need) + ', which is above the maximum of ' + v.scale + '. Try a lower target or plan over more semesters.' };
    if (need <= 0) return { label: 'GPA needed this semester', big: '0', badge: ['ok', '✓ Target already secured'], stats,
      note: 'Your CGPA would stay at or above ' + fmt(v.target) + ' even with a 0 this semester.' };
    return { label: 'GPA needed this semester', big: fmt(need), badge: ['ok', '✓ Achievable'], stats,
      note: 'Average ' + fmt(need) + ' (out of ' + v.scale + ') across your ' + v.next + ' credits to reach a ' + fmt(v.target) + ' CGPA.' };
  } },

  'final-exam': { run(v) {
    const need = (v.target - v.current * (100 - v.weight) / 100) / (v.weight / 100);
    const stats = [['Final exam weight', fmt(v.weight) + '%'], ['Grade so far', fmt(v.current) + '%']];
    if (need > 100 + 1e-9) return { label: 'Score needed in final exam', big: fmt(need) + '%', badge: ['bad', '✕ Not possible without extra credit'], stats,
      note: 'Even a perfect score would not reach ' + fmt(v.target) + '%. Check for extra credit or a lower target.' };
    if (need <= 0) return { label: 'Score needed in final exam', big: '0%', badge: ['ok', '✓ Already secured'], stats,
      note: 'You reach ' + fmt(v.target) + '% even with 0 in the final exam.' };
    return { label: 'Score needed in final exam', big: fmt(need) + '%', badge: ['ok', '✓ Possible'], stats,
      note: 'Score at least ' + fmt(need) + '% in the final exam to finish with ' + fmt(v.target) + '%.' };
  } },

  'semester-gpa': { run(v) {
    const credits = v.rows.reduce((s, r) => s + r.credits, 0);
    const points = v.rows.reduce((s, r) => s + r.credits * r.grade, 0);
    return { label: 'Semester GPA', big: fmt(points / credits), stats: [['Total credits', fmt(credits)], ['Quality points', fmt(points)]],
      note: 'Calculated on a 4.0 scale. Check your institution\'s grade points, as scales differ.' };
  } },

  'cgpa': { run(v) {
    const credits = v.rows.reduce((s, r) => s + r.credits, 0);
    const points = v.rows.reduce((s, r) => s + r.credits * r.gpa, 0);
    return { label: 'Cumulative GPA (CGPA)', big: fmt(points / credits), stats: [['Total credits', fmt(credits)], ['Semesters', v.rows.length]],
      note: 'Works with 4.0, 5.0 or 10-point scales as long as every semester uses the same scale.' };
  } },

  'grade': { run(v) {
    const w = v.rows.reduce((s, r) => s + r.weight, 0);
    const g = v.rows.reduce((s, r) => s + r.score * r.weight, 0) / w;
    const letter = g >= 90 ? 'A' : g >= 80 ? 'B' : g >= 70 ? 'C' : g >= 60 ? 'D' : 'F';
    const off = Math.abs(w - 100) > 1e-9;
    return { label: 'Overall grade', big: fmt(g) + '%', stats: [['Typical letter grade', letter], ['Total weight', fmt(w) + '%']],
      note: off ? 'Your weights add up to ' + fmt(w) + '%, not 100%. The result is based only on the weights you entered.' : 'Letter grades vary by institution; this uses A 90+, B 80+, C 70+, D 60+.' };
  } },

  'pct-of': { run(v) { const r = v.percent / 100 * v.of;
    return { label: fmt(v.percent) + '% of ' + fmt(v.of) + ' is', big: fmt(r, 4), note: fmt(v.percent) + ' ÷ 100 × ' + fmt(v.of) + ' = ' + fmt(r, 4) }; } },

  'pct-is': { run(v) {
    if (v.whole === 0) return { error: { name: 'whole', msg: 'The whole cannot be 0.' } };
    const r = v.part / v.whole * 100;
    return { label: fmt(v.part) + ' is what % of ' + fmt(v.whole) + '?', big: fmt(r, 4) + '%', note: fmt(v.part) + ' ÷ ' + fmt(v.whole) + ' × 100 = ' + fmt(r, 4) + '%' }; } },

  'pct-change': { run(v) {
    if (v.from === 0) return { error: { name: 'from', msg: 'The old value cannot be 0.' } };
    const r = (v.to - v.from) / Math.abs(v.from) * 100;
    const badge = r > 0 ? ['ok', '▲ Increase'] : r < 0 ? ['bad', '▼ Decrease'] : ['eq', '= No change'];
    return { label: 'Percentage change', big: fmt(r, 4) + '%', badge, note: '(' + fmt(v.to) + ' − ' + fmt(v.from) + ') ÷ ' + fmt(Math.abs(v.from)) + ' × 100 = ' + fmt(r, 4) + '%' }; } },

  'date-diff': { run(v) {
    let a = v.start, b = v.end, swapped = false;
    if (b < a) { [a, b] = [b, a]; swapped = true; }
    const days = Math.round((b - a) / 864e5);
    const A = new Date(a), B = new Date(b);
    let y = B.getUTCFullYear() - A.getUTCFullYear(), m = B.getUTCMonth() - A.getUTCMonth(), d = B.getUTCDate() - A.getUTCDate();
    if (d < 0) { m--; d += new Date(Date.UTC(B.getUTCFullYear(), B.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    return { label: 'Days between the dates', big: days.toLocaleString('en-US') + (days === 1 ? ' day' : ' days'),
      stats: [['Weeks and days', Math.floor(days / 7) + ' w ' + (days % 7) + ' d'], ['Years, months, days', y + ' y ' + m + ' m ' + d + ' d']],
      note: swapped ? 'The end date was earlier than the start date, so the dates were swapped.' : 'The end date is not counted. Add 1 day if you want to include both dates.' };
  } }
};
