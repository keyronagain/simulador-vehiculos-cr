// ─── Constants ───────────────────────────────────────────────────
const REND  = { gasKmL: 12, glpKmL: 10, elecKwhKm: 0.18 };
const MANT  = { elec: 80000, gas: 250000, glp: 165000 };
const EMISION = { elec: 10, gas: 170, glp: 130 };
const EFIC  = { elec: 60.5, gas: 19, glp: 22 };

const GRID = 'rgba(0,0,0,0.05)';
const TICK = { color: '#606080', font: { size: 10, family: 'Plus Jakarta Sans, sans-serif' } };
const TT   = { backgroundColor: '#fff', titleColor: '#1a1a2e', bodyColor: '#606080', borderColor: '#e0e0ea', borderWidth: 1 };

let charts = {};

// ─── Helpers ─────────────────────────────────────────────────────
const fmt  = n => Math.round(n).toLocaleString('es-CR');
const fmtM = n => (n / 1e6).toFixed(1) + 'M';

function mk(id, cfg) {
  if (!document.getElementById(id)) return;
  if (charts[id]) {
    charts[id].data = cfg.data;
    charts[id].options.scales = cfg.options.scales;
    charts[id].update({ duration: 1200, easing: 'easeInOutQuart' });
    return;
  }
  const isBar = cfg.type === 'bar';
  if (cfg.options) cfg.options.animation = isBar
    ? { duration: 1200, easing: 'easeInOutQuart', y: { duration: 1200, easing: 'easeInOutQuart', from: ctx => ctx.chart.scales.y.bottom } }
    : { duration: 1200, easing: 'easeInOutQuart' };
  charts[id] = new Chart(document.getElementById(id), cfg);
}

function pop(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

// ─── Read parameters from sliders ────────────────────────────────
function params() {
  return {
    km:     parseInt(document.getElementById('km').value),
    years:  parseInt(document.getElementById('years').value),
    c0elec: parseInt(document.getElementById('c0elec').value),
    c0gas:  parseInt(document.getElementById('c0gas').value),
    c0glp:  parseInt(document.getElementById('c0glp').value),
    pgas:   parseInt(document.getElementById('pgas').value),
    pglp:   parseInt(document.getElementById('pglp').value),
    pelec:  parseInt(document.getElementById('pelec').value),
  };
}

// ─── Derived cost-per-km values ───────────────────────────────────
function derived(p) {
  return {
    cKmGas:  p.pgas / REND.gasKmL,
    cKmGlp:  p.pglp / REND.glpKmL,
    cKmElec: p.pelec * REND.elecKwhKm,
  };
}

// ─── Total cost including maintenance ────────────────────────────
function totalCon(c0, cKm, mantAnual, km, kmMes) {
  const anos = km / (kmMes * 12);
  return c0 + cKm * km + mantAnual * anos;
}

// ─── Main update function ─────────────────────────────────────────
function update() {
  const p = params();
  const d = derived(p);

  // Update slider display values
  document.getElementById('km-out').textContent    = fmt(p.km) + ' km';
  document.getElementById('years-out').textContent = p.years + ' año' + (p.years > 1 ? 's' : '');
  document.getElementById('c0elec-out').textContent = '₡' + fmtM(p.c0elec);
  document.getElementById('c0gas-out').textContent  = '₡' + fmtM(p.c0gas);
  document.getElementById('c0glp-out').textContent  = '₡' + fmtM(p.c0glp);
  document.getElementById('pgas-out').textContent   = '₡' + fmt(p.pgas);
  document.getElementById('pglp-out').textContent   = '₡' + fmt(p.pglp);
  document.getElementById('pelec-out').textContent  = '₡' + p.pelec;

  const kmT = p.km * 12 * p.years;
  const tE  = totalCon(p.c0elec, d.cKmElec, MANT.elec, kmT, p.km);
  const tG  = totalCon(p.c0gas,  d.cKmGas,  MANT.gas,  kmT, p.km);
  const tL  = totalCon(p.c0glp,  d.cKmGlp,  MANT.glp,  kmT, p.km);

  // Metric cards
  const mc = document.getElementById('metric-cards');
  if (mc) mc.innerHTML = `
    <div class="mcard elec"><div class="mcard-icon">⚡</div><div class="mcard-label">Eléctrico</div><div class="mcard-val elec" id="mv0">₡${fmtM(tE)}</div><div class="mcard-sub">₡${fmt(d.cKmElec)} por km</div></div>
    <div class="mcard gas"><div class="mcard-icon">⛽</div><div class="mcard-label">Gasolina</div><div class="mcard-val gas" id="mv1">₡${fmtM(tG)}</div><div class="mcard-sub">₡${fmt(d.cKmGas)} por km</div></div>
    <div class="mcard glp"><div class="mcard-icon">🔵</div><div class="mcard-label">Gas GLP</div><div class="mcard-val glp" id="mv2">₡${fmtM(tL)}</div><div class="mcard-sub">₡${fmt(d.cKmGlp)} por km</div></div>
  `;
  ['mv0', 'mv1', 'mv2'].forEach(pop);

  // Bar comparison
  const vals = [
    { l: 'Eléctrico', v: d.cKmElec, c: '#0ea86e' },
    { l: 'Gasolina',  v: d.cKmGas,  c: '#e85a1e' },
    { l: 'Gas GLP',   v: d.cKmGlp,  c: '#1a7fd4' },
  ];
  const maxV = Math.max(...vals.map(x => x.v));
  const bc = document.getElementById('bar-compare');
  if (bc) bc.innerHTML = vals.map(x => `
    <div class="bar-row">
      <div class="bar-header"><span class="bar-name">${x.l}</span><span style="font-weight:600;color:${x.c}">₡${fmt(x.v)} por km</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(x.v / maxV * 100)}%;background:${x.c};"></div></div>
    </div>`).join('');

  // Savings cards
  const ahorroKm    = d.cKmGas - d.cKmElec;
  const ahorroMes   = ahorroKm * p.km;
  const ahorroAnual = ahorroMes * 12;
  const ac = document.getElementById('ahorro-cards');
  if (ac) ac.innerHTML = `
    <div class="ahorro-card"><div class="ahorro-label">Por km</div><div class="ahorro-val">₡${fmt(ahorroKm)}</div><div class="ahorro-sub">menos en eléctrico</div></div>
    <div class="ahorro-card"><div class="ahorro-label">Por mes</div><div class="ahorro-val">₡${fmt(ahorroMes)}</div><div class="ahorro-sub">a ${fmt(p.km)} km/mes</div></div>
    <div class="ahorro-card"><div class="ahorro-label">Por año</div><div class="ahorro-val">₡${fmt(ahorroAnual)}</div><div class="ahorro-sub">solo en combustible</div></div>
  `;

  updateCharts(p, d);
  updateAmb(p);
  updateMant(p);
}

// ─── Charts ───────────────────────────────────────────────────────
function updateCharts(p, d) {
  // Cost over time (line chart)
  const labels = [], dE = [], dG = [], dL = [];
  for (let y = 0; y <= p.years; y++) {
    labels.push('Año ' + y);
    const km = p.km * 12 * y;
    dE.push(+(totalCon(p.c0elec, d.cKmElec, MANT.elec, km, p.km) / 1e6).toFixed(2));
    dG.push(+(totalCon(p.c0gas,  d.cKmGas,  MANT.gas,  km, p.km) / 1e6).toFixed(2));
    dL.push(+(totalCon(p.c0glp,  d.cKmGlp,  MANT.glp,  km, p.km) / 1e6).toFixed(2));
  }

  mk('c1', {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Eléctrico', data: dE, borderColor: '#0ea86e', backgroundColor: 'rgba(14,168,110,0.07)', tension: 0.35, fill: true, pointRadius: 2, pointBackgroundColor: '#0ea86e' },
      { label: 'Gasolina',  data: dG, borderColor: '#e85a1e', backgroundColor: 'rgba(232,90,30,0.07)',   tension: 0.35, fill: true, pointRadius: 2, pointBackgroundColor: '#e85a1e' },
      { label: 'Gas GLP',   data: dL, borderColor: '#1a7fd4', backgroundColor: 'rgba(26,127,212,0.07)',  tension: 0.35, fill: true, pointRadius: 2, pointBackgroundColor: '#1a7fd4' },
    ]},
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: { legend: { display: false }, tooltip: { ...TT, callbacks: { label: ctx => ' ₡' + ctx.parsed.y.toFixed(2) + 'M total' } } },
      scales: { x: { ticks: TICK, grid: { color: GRID } }, y: { ticks: { ...TICK, callback: v => '₡' + v + 'M' }, grid: { color: GRID } } }
    }
  });

  // Breakeven calculations
  const cKmGasT  = d.cKmGas  + MANT.gas  / (p.km * 12);
  const cKmElecT = d.cKmElec + MANT.elec / (p.km * 12);
  const cKmGlpT  = d.cKmGlp  + MANT.glp  / (p.km * 12);
  const beGE = (p.c0elec - p.c0gas)  / (cKmGasT  - cKmElecT);
  const beLe = (p.c0elec - p.c0glp)  / (cKmGlpT  - cKmElecT);
  const beGL = (p.c0glp  - p.c0gas)  / (cKmGasT  - cKmGlpT);

  function fmtBE(km, nB, nC, winnerClass) {
    if (!isFinite(km) || km < 0) return { val: 'Sin equilibrio', desc: `Con estos precios el ${nC} siempre es más barato.`, warn: false, winner: '' };
    const m = Math.round(km / p.km);
    const a = (m / 12).toFixed(1);
    const warn = m > 240;
    const desc = warn
      ? `A tu ritmo actual esto tardaría ${a} años — un plazo poco realista.`
      : `Después de ${m} meses (${a} años) manejando ${fmt(p.km)} km/mes, el ${nB} habrá costado lo mismo que el ${nC} en total. A partir de ahí el ${nB} es más económico.`;
    const winner = `<span class="be-winner ${winnerClass}">Gana: ${nB}</span>`;
    return { val: fmt(Math.round(km)) + ' km', desc, warn, winner };
  }

  const rows = [
    { label: 'Eléctrico vs Gasolina', be: fmtBE(beGE, 'eléctrico', 'de gasolina', 'be-winner-elec'), color: '#0ea86e' },
    { label: 'Eléctrico vs Gas GLP',  be: fmtBE(beLe, 'eléctrico', 'de gas GLP',  'be-winner-elec'), color: '#0ea86e' },
    { label: 'Gas GLP vs Gasolina',   be: fmtBE(beGL, 'GLP',       'de gasolina', 'be-winner-glp'),  color: '#1a7fd4' },
  ];

  const bl = document.getElementById('be-list');
  if (bl) bl.innerHTML = rows.map(r => `
    <div class="be-row">
      <div>
        <div class="be-label">${r.label}</div>
        <div class="be-subdesc">${r.be.desc}</div>
        ${r.be.winner ? `<div>${r.be.winner}</div>` : ''}
        ${r.be.warn ? `<div class="warn-box"><p>⚠️ <strong>Plazo muy largo.</strong> Subí los km/mes en el Simulador para ver un escenario más realista.</p></div>` : ''}
      </div>
      <div class="be-val" style="color:${r.color}">${r.be.val}</div>
    </div>`).join('');

  // Dynamic insight
  const kmT2 = p.km * 12 * p.years;
  const ahorroTotal = totalCon(p.c0gas, d.cKmGas, MANT.gas, kmT2, p.km) - totalCon(p.c0elec, d.cKmElec, MANT.elec, kmT2, p.km);
  const bi = document.getElementById('be-insight');
  if (bi) {
    if (ahorroTotal > 0) {
      bi.style.background = '#f0faf6'; bi.style.borderColor = 'rgba(14,168,110,0.25)';
      bi.querySelector('p').style.color = '#1a5a9a';
      bi.querySelector('p').innerHTML = `💡 Con estos parámetros, elegir eléctrico en vez de gasolina genera un <strong>ahorro total de ₡${fmt(ahorroTotal)}</strong> durante los ${p.years} años de análisis, contando combustible y mantenimiento.`;
    } else {
      bi.style.background = '#fff8f0'; bi.style.borderColor = 'rgba(232,90,30,0.25)';
      bi.querySelector('p').style.color = '#b84a10';
      bi.querySelector('p').innerHTML = `⚠️ Con estos parámetros, el vehículo de gasolina sigue siendo más económico en total durante los ${p.years} años de análisis. Aumentá los km/mes o los años para cambiar el resultado.`;
    }
  }

  // Energy efficiency chart
  mk('c3', {
    type: 'bar',
    data: { labels: ['Eléctrico', 'Gasolina', 'Gas GLP'], datasets: [{ data: [EFIC.elec, EFIC.gas, EFIC.glp], backgroundColor: ['rgba(14,168,110,0.8)', 'rgba(232,90,30,0.8)', 'rgba(26,127,212,0.8)'], borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + ctx.parsed.y + '% de la energía mueve el vehículo' } } },
      scales: { y: { max: 100, ticks: { ...TICK, callback: v => v + '%' }, grid: { color: GRID } }, x: { ticks: TICK, grid: { color: GRID } } }
    }
  });

  // Range chart
  mk('c4', {
    type: 'bar',
    data: { labels: ['Gasolina (km/L)', 'Gas GLP (km/L)', 'Eléctrico (km/kWh)'], datasets: [{ data: [12, 10, 5.5], backgroundColor: ['rgba(232,90,30,0.8)', 'rgba(26,127,212,0.8)', 'rgba(14,168,110,0.8)'], borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => { const u = ['km/L', 'km/L', 'km/kWh']; return ' ' + ctx.parsed.y + ' ' + u[ctx.dataIndex]; } } } },
      scales: { y: { ticks: TICK, grid: { color: GRID } }, x: { ticks: TICK, grid: { color: GRID } } }
    }
  });
}

// ─── Maintenance charts ───────────────────────────────────────────
function updateMant(p) {
  mk('c_mant', {
    type: 'bar',
    data: { labels: ['Gasolina', 'Eléctrico', 'Gas GLP'], datasets: [{ data: [MANT.gas, MANT.elec, MANT.glp], backgroundColor: ['rgba(232,90,30,0.8)', 'rgba(14,168,110,0.8)', 'rgba(26,127,212,0.8)'], borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ₡' + fmt(ctx.parsed.y) + ' por año' } } },
      scales: { y: { ticks: { ...TICK, callback: v => '₡' + fmt(v) }, grid: { color: GRID } }, x: { ticks: TICK, grid: { color: GRID } } }
    }
  });

  const labels = [], dA = [];
  for (let y = 1; y <= p.years; y++) {
    labels.push('Año ' + y);
    dA.push(+((MANT.gas - MANT.elec) * y / 1e6).toFixed(2));
  }

  mk('c_mant2', {
    type: 'line',
    data: { labels, datasets: [{ label: 'Ahorro', data: dA, borderColor: '#0ea86e', backgroundColor: 'rgba(14,168,110,0.1)', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#0ea86e' }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ₡' + ctx.parsed.y.toFixed(2) + 'M ahorrados' } } },
      scales: { y: { ticks: { ...TICK, callback: v => '₡' + v + 'M' }, grid: { color: GRID } }, x: { ticks: TICK, grid: { color: GRID } } }
    }
  });
}

// ─── Environmental charts ─────────────────────────────────────────
function updateAmb(p) {
  const kmA = p.km * 12;
  const emE = Math.round(EMISION.elec * kmA / 1000);
  const emG = Math.round(EMISION.gas  * kmA / 1000);
  const emL = Math.round(EMISION.glp  * kmA / 1000);

  const ec = document.getElementById('em-cards');
  if (ec) ec.innerHTML = `
    <div class="mcard elec"><div class="mcard-icon">⚡</div><div class="mcard-label">Eléctrico</div><div class="mcard-val elec">${fmt(emE)} kg</div><div class="mcard-sub">CO₂ por año</div></div>
    <div class="mcard gas"><div class="mcard-icon">⛽</div><div class="mcard-label">Gasolina</div><div class="mcard-val gas">${fmt(emG)} kg</div><div class="mcard-sub">CO₂ por año</div></div>
    <div class="mcard glp"><div class="mcard-icon">🔵</div><div class="mcard-label">Gas GLP</div><div class="mcard-val glp">${fmt(emL)} kg</div><div class="mcard-sub">CO₂ por año</div></div>
  `;

  mk('c5', {
    type: 'bar',
    data: { labels: ['Eléctrico', 'Gasolina', 'Gas GLP'], datasets: [{ data: [emE, emG, emL], backgroundColor: ['rgba(14,168,110,0.8)', 'rgba(232,90,30,0.8)', 'rgba(26,127,212,0.8)'], borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) + ' kg de CO₂ por año' } } },
      scales: { y: { ticks: { ...TICK, callback: v => fmt(v) + ' kg' }, grid: { color: GRID } }, x: { ticks: TICK, grid: { color: GRID } } }
    }
  });
}

// ─── Tab switching ────────────────────────────────────────────────
function switchTab(t) {
  ['sim', 'be', 'mant', 'efic', 'amb'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) {
      el.style.display = id === t ? '' : 'none';
      if (id === t) { el.classList.remove('animate'); void el.offsetWidth; el.classList.add('animate'); }
    }
  });
  document.querySelectorAll('.tab').forEach((btn, i) => {
    btn.classList.toggle('active', ['sim', 'be', 'mant', 'efic', 'amb'][i] === t);
  });
  update();
}

// ─── Init — pre-render all tabs so charts exist from the start ────
['sim', 'be', 'mant', 'efic', 'amb'].forEach(id => {
  const el = document.getElementById('tab-' + id);
  if (el) el.style.display = '';
});

update();

['sim', 'be', 'mant', 'efic', 'amb'].forEach(id => {
  const el = document.getElementById('tab-' + id);
  if (el) el.style.display = id === 'sim' ? '' : 'none';
});