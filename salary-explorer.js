// Quant Salary Explorer - Charts, Table, Form, Filters
(function () {
  'use strict';

  // --- Utility Functions ---
  function median(arr) { if (!arr.length) return 0; const s = [...arr].sort((a,b) => a-b); const m = Math.floor(s.length/2); return s.length%2 ? s[m] : Math.round((s[m-1]+s[m])/2); }
  function avg(arr) { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }
  function formatK(n) { return n >= 1000000 ? '$' + (n/1000000).toFixed(1) + 'M' : n >= 1000 ? '$' + Math.round(n/1000) + 'K' : '$' + n; }
  function groupBy(arr, key) { return arr.reduce((g, item) => { (g[item[key]] = g[item[key]] || []).push(item); return g; }, {}); }

  // FX rates to USD (approximate)
  const FX_TO_USD = { USD: 1, GBP: 1.27, EUR: 1.09, SGD: 0.75, HKD: 0.13, JPY: 0.0067, AUD: 0.65, INR: 0.012, CHF: 1.13, CNY: 0.14, ZAR: 0.055, AED: 0.27, SAR: 0.27, ILS: 0.28, QAR: 0.27 };
  function toUSD(amount, currency) { return Math.round(amount * (FX_TO_USD[currency] || 1)); }

  const CURRENCY_SYMBOLS = {
    USD: '$', GBP: '£', EUR: '€', SGD: 'S$', HKD: 'HK$', JPY: '¥',
    AUD: 'A$', INR: '₹', CHF: 'CHF', CNY: '¥', ZAR: 'R',
    AED: 'AED', SAR: 'SR', ILS: '₪', QAR: 'QR'
  };

  function formatCurrency(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || (currency + ' ');
    const amt = amount || 0;
    if (amt >= 1000000) return symbol + (amt / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (amt >= 1000) return symbol + Math.round(amt / 1000) + 'K';
    return symbol + amt;
  }

  // All data (user submitted)
  let allData = [];

  // --- Region/City Cascading Dropdowns ---
  function setupRegionCascade(regionSel, countrySel, citySel) {
    if (!regionSel) return;
    regionSel.addEventListener('change', () => {
      const r = regionSel.value;
      if (countrySel) countrySel.innerHTML = '<option value="">Select Country</option>';
      if (citySel) citySel.innerHTML = '<option value="">Select City</option>';
      if (REGION_DATA[r] && countrySel) {
        Object.keys(REGION_DATA[r].countries).forEach(c => {
          countrySel.innerHTML += `<option value="${c}">${c}</option>`;
        });
      }
    });
    if (countrySel) {
      countrySel.addEventListener('change', () => {
        const r = regionSel.value, c = countrySel.value;
        if (citySel) citySel.innerHTML = '<option value="">Select City</option>';
        if (REGION_DATA[r] && REGION_DATA[r].countries[c] && citySel) {
          REGION_DATA[r].countries[c].forEach(city => {
            citySel.innerHTML += `<option value="${city}">${city}</option>`;
          });
        }
      });
    }
  }

  // --- Chart Color Palette ---
  const COLORS = ['#f43f5e','#3b82f6','#f59e0b','#22c55e','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1'];
  const COLORS_A = COLORS.map(c => c + '99');

  // Chart.js default overrides
  Chart.defaults.color = '#aaa';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

  let charts = {};

  // --- Render Dashboard ---
  function renderDashboard(data) {
    const el = id => document.getElementById(id);
    const totalSubs = el('stat-total-subs');
    const medianTC = el('stat-median-tc');
    const topRegion = el('stat-top-region');
    const topFirm = el('stat-top-firm');
    const topRole = el('stat-top-role');

    if (!data.length) {
      if (totalSubs) totalSubs.textContent = '0';
      if (medianTC) medianTC.textContent = '$0';
      if (topRegion) topRegion.textContent = '—';
      if (topFirm) topFirm.textContent = '—';
      if (topRole) topRole.textContent = '—';

      // Clear existing charts
      Object.keys(charts).forEach(key => {
        if (charts[key]) {
          charts[key].destroy();
          charts[key] = null;
        }
      });

      // Show friendly empty placeholder inside chart wrapping containers
      const wraps = [
        { parentId: 'chartRegionWrap', id: 'chartRegion' },
        { parentId: 'chartLevelWrap', id: 'chartLevel' },
        { parentId: 'chartTierWrap', id: 'chartTier' },
        { parentId: 'chartDistWrap', id: 'chartDist' },
        { parentId: 'chartRegionLevelWrap', id: 'chartRegionLevel' }
      ];
      wraps.forEach(w => {
        const p = el(w.parentId);
        if (p) {
          p.innerHTML = `
            <div class="sal-chart-empty-state" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:var(--text-muted); font-size:0.85rem; border: 1px dashed var(--border-light); border-radius: var(--radius-sm); padding:20px; background:rgba(0,0,0,0.05);">
              <i class="fas fa-chart-line" style="font-size:1.8rem; margin-bottom:8px; color:var(--accent-secondary); opacity:0.6;"></i>
              <span>No data yet. Share your salary anonymously below to populate this dashboard!</span>
            </div>
          `;
        }
      });

      // Empty leaderboard
      const leaderboardEl = el('firmLeaderboard');
      if (leaderboardEl) {
        leaderboardEl.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;"><i class="fas fa-inbox" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--accent-secondary);"></i>No submissions yet. Be the first to contribute below!</div>';
      }

      // Empty data table
      const tbody = el('salaryTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;"><i class="fas fa-folder-open" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--accent-secondary);"></i>No compensation data submitted yet. Contribute yours anonymously to build the dashboard!</td></tr>';
      }
      return;
    }

    // Restore canvases if empty placeholders exist
    const wraps = [
      { parentId: 'chartRegionWrap', id: 'chartRegion' },
      { parentId: 'chartLevelWrap', id: 'chartLevel' },
      { parentId: 'chartTierWrap', id: 'chartTier' },
      { parentId: 'chartDistWrap', id: 'chartDist' },
      { parentId: 'chartRegionLevelWrap', id: 'chartRegionLevel' }
    ];
    wraps.forEach(w => {
      const p = el(w.parentId);
      if (p && p.querySelector('.sal-chart-empty-state')) {
        p.innerHTML = `<canvas id="${w.id}"></canvas>`;
      }
    });

    const usdData = data.map(d => ({ ...d, tc_usd: toUSD(d.total_comp, d.currency) }));

    if (totalSubs) totalSubs.textContent = usdData.length;
    if (medianTC) medianTC.textContent = formatK(median(usdData.map(d => d.tc_usd)));

    // Top region
    const byRegion = groupBy(usdData, 'region');
    let maxRegion = '', maxMed = 0;
    Object.entries(byRegion).forEach(([r, arr]) => { const m = median(arr.map(d=>d.tc_usd)); if (m > maxMed) { maxMed = m; maxRegion = r; }});
    if (topRegion) topRegion.textContent = maxRegion || '—';

    // Top firm
    const byFirm = groupBy(usdData, 'firm');
    let maxFirmName = '', maxFirmMed = 0;
    Object.entries(byFirm).forEach(([f, arr]) => { if (arr.length >= 2) { const m = median(arr.map(d=>d.tc_usd)); if (m > maxFirmMed) { maxFirmMed = m; maxFirmName = f; }}});
    if (!maxFirmName) { Object.entries(byFirm).forEach(([f, arr]) => { const m = median(arr.map(d=>d.tc_usd)); if (m > maxFirmMed) { maxFirmMed = m; maxFirmName = f; }}); }
    if (topFirm) topFirm.textContent = maxFirmName || '—';

    // Top role
    const byRole = groupBy(usdData, 'role');
    let maxRoleName = '', maxRoleCount = 0;
    Object.entries(byRole).forEach(([r, arr]) => { if (arr.length > maxRoleCount) { maxRoleCount = arr.length; maxRoleName = r; }});
    if (topRole) topRole.textContent = maxRoleName || '—';

    // --- Chart 1: Salary by Region (Horizontal Bar) ---
    const regionLabels = Object.keys(byRegion).sort();
    const regionMedians = regionLabels.map(r => median(byRegion[r].map(d => d.tc_usd)));
    renderChart('chartRegion', 'bar', {
      labels: regionLabels,
      datasets: [{ label: 'Median TC (USD)', data: regionMedians, backgroundColor: COLORS.slice(0, regionLabels.length), borderRadius: 8, barThickness: 32 }]
    }, { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatK(ctx.raw) }}}, scales: { x: { ticks: { callback: v => formatK(v) }}}});

    // --- Chart 2: Salary by Experience Level ---
    const byLevel = groupBy(usdData, 'level');
    const levelOrder = LEVELS.filter(l => byLevel[l]);
    const levelMedians = levelOrder.map(l => median(byLevel[l].map(d => d.tc_usd)));
    renderChart('chartLevel', 'bar', {
      labels: levelOrder,
      datasets: [{ label: 'Median TC (USD)', data: levelMedians, backgroundColor: COLORS.slice(0, levelOrder.length), borderRadius: 6, barThickness: 40 }]
    }, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatK(ctx.raw) }}}, scales: { y: { ticks: { callback: v => formatK(v) }}}});

    // --- Chart 3: By Firm Tier (Doughnut) ---
    const topTier = ['Citadel','Jane Street','HRT','Jump Trading','Optiver','Two Sigma','D.E. Shaw','Millennium','Citadel Securities','Point72','Cubist (Point72)'];
    const midTier = ['AQR Capital','Man Group','Marshall Wace','Winton','Brevan Howard','BlueCrest','Schonfeld','G-Research','Qube Research','Virtu Financial','Flow Traders','IMC','Wolverine Trading','Susquehanna (SIG)','Tower Research','Cantab Capital'];
    let tierCounts = { 'Top Tier (Elite Prop/HF)': 0, 'Mid Tier (Established HF)': 0, 'Banks & Traditional': 0 };
    usdData.forEach(d => { if (topTier.includes(d.firm)) tierCounts['Top Tier (Elite Prop/HF)']++; else if (midTier.includes(d.firm)) tierCounts['Mid Tier (Established HF)']++; else tierCounts['Banks & Traditional']++; });
    renderChart('chartTier', 'doughnut', {
      labels: Object.keys(tierCounts), datasets: [{ data: Object.values(tierCounts), backgroundColor: [COLORS[0], COLORS[1], COLORS[2]], borderWidth: 0, hoverOffset: 8 }]
    }, { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true }}}});

    // --- Chart 4: TC Distribution (Histogram) ---
    const buckets = [0,100000,200000,300000,400000,500000,750000,1000000,1500000,2000000];
    const bucketLabels = buckets.slice(0,-1).map((b,i) => formatK(b) + '-' + formatK(buckets[i+1]));
    const hist = new Array(buckets.length - 1).fill(0);
    usdData.forEach(d => { for (let i = 0; i < buckets.length - 1; i++) { if (d.tc_usd >= buckets[i] && d.tc_usd < buckets[i+1]) { hist[i]++; break; }}});
    renderChart('chartDist', 'bar', {
      labels: bucketLabels, datasets: [{ label: 'Count', data: hist, backgroundColor: '#3b82f6', borderRadius: 4 }]
    }, { plugins: { legend: { display: false }}, scales: { y: { title: { display: true, text: 'Number of Entries' }}}});

    // --- Chart 5: Top Firms Leaderboard ---
    const firmEntries = Object.entries(byFirm).filter(([,a]) => a.length >= 1).map(([f,a]) => ({ firm: f, median: median(a.map(d=>d.tc_usd)), count: a.length })).sort((a,b) => b.median - a.median).slice(0, 15);
    const leaderboardEl = document.getElementById('firmLeaderboard');
    if (leaderboardEl) {
      leaderboardEl.innerHTML = firmEntries.map((f, i) => `
        <div class="lb-row${i < 3 ? ' lb-top' : ''}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-firm">${f.firm}</span>
          <span class="lb-tc">${formatK(f.median)}</span>
          <span class="lb-count">${f.count} ${f.count === 1 ? 'entry' : 'entries'}</span>
        </div>
      `).join('');
    }

    // --- Chart 6: Region vs Level Heatmap (as grouped bar) ---
    const regionLevelData = {};
    regionLabels.forEach(r => { regionLevelData[r] = {}; levelOrder.forEach(l => { const items = usdData.filter(d => d.region === r && d.level === l); regionLevelData[r][l] = items.length ? median(items.map(d => d.tc_usd)) : 0; }); });
    renderChart('chartRegionLevel', 'bar', {
      labels: regionLabels,
      datasets: levelOrder.map((l, i) => ({ label: l, data: regionLabels.map(r => regionLevelData[r][l]), backgroundColor: COLORS[i % COLORS.length], borderRadius: 4 }))
    }, { plugins: { tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + formatK(ctx.raw) }}}, scales: { y: { ticks: { callback: v => formatK(v) }}}});

    // --- Data Table ---
    renderTable(usdData);
  }

  function renderChart(canvasId, type, data, options) {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (typeof Chart === 'undefined') {
        console.warn(`Chart.js is not loaded yet. Skipping rendering chart: ${canvasId}`);
        return;
      }
      if (charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
      }
      charts[canvasId] = new Chart(canvas, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options }});
    } catch (e) {
      console.error(`Error rendering chart ${canvasId}:`, e);
    }
  }

  // --- Data Table ---
  let tableSortCol = 'tc_usd', tableSortDir = -1;
  function renderTable(data) {
    const tbody = document.getElementById('salaryTableBody');
    if (!tbody) return;
    const sorted = [...data].sort((a,b) => tableSortDir * (a[tableSortCol] > b[tableSortCol] ? 1 : -1));
    tbody.innerHTML = sorted.slice(0, 100).map(d => `
      <tr>
        <td><span class="region-badge region-${d.region}">${d.region}</span></td>
        <td>${d.country}</td>
        <td>${d.city || '—'}</td>
        <td class="fw-600">${d.firm}</td>
        <td>${d.role}</td>
        <td>${d.level}</td>
        <td>${d.yoe}</td>
        <td>${formatCurrency(d.base, d.currency)}</td>
        <td>${formatCurrency(d.bonus, d.currency)}</td>
        <td class="fw-600 tc-highlight">${formatCurrency(d.total_comp || (d.base + d.bonus + d.equity), d.currency)}</td>
      </tr>
    `).join('');
  }

  // --- Filters ---
  function applyFilters() {
    let filtered = [...allData];
    const regionF = document.getElementById('filterRegion')?.value;
    const roleF = document.getElementById('filterRole')?.value;
    const firmF = document.getElementById('filterFirm')?.value?.toLowerCase();
    const minYoe = parseInt(document.getElementById('filterMinYoe')?.value) || 0;
    const maxYoe = parseInt(document.getElementById('filterMaxYoe')?.value) || 30;

    if (regionF) filtered = filtered.filter(d => d.region === regionF);
    if (roleF) filtered = filtered.filter(d => d.role === roleF);
    if (firmF) filtered = filtered.filter(d => d.firm.toLowerCase().includes(firmF));
    filtered = filtered.filter(d => d.yoe >= minYoe && d.yoe <= maxYoe);

    renderDashboard(filtered);
  }

  // --- Form Submission ---
  function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const entry = {
      region: form.salRegion.value,
      country: form.salCountry.value,
      city: form.salCity.value,
      firm: form.salFirm.value.trim(),
      role: form.salRole.value,
      level: form.salLevel.value,
      yoe: parseInt(form.salYoe.value) || 0,
      base: parseInt(form.salBase.value) || 0,
      bonus: parseInt(form.salBonus.value) || 0,
      equity: parseInt(form.salEquity.value) || 0,
      currency: form.salCurrency.value,
      education: form.salEducation.value,
      is_seed: false
    };
    entry.total_comp = entry.base + entry.bonus + entry.equity;
    entry.id = 'user-' + Date.now();

    // Save locally to localStorage (fallback so it displays in UI instantly & persists across page refresh even if DB insert fails)
    let localSubmissions = [];
    try {
      const stored = localStorage.getItem('quant_mentor_local_salaries');
      localSubmissions = stored ? JSON.parse(stored) : [];
      localSubmissions.push(entry);
      localStorage.setItem('quant_mentor_local_salaries', JSON.stringify(localSubmissions));
    } catch (e) { console.warn('Failed to save salary locally:', e); }

    // Save to Supabase if available
    if (window.supabaseClient) {
      window.supabaseClient.from('salary_submissions').insert([{
        region: entry.region, country: entry.country, city: entry.city, firm_name: entry.firm,
        role: entry.role, level: entry.level, years_of_experience: entry.yoe,
        base_salary: entry.base, bonus: entry.bonus, equity: entry.equity,
        currency: entry.currency, education: entry.education,
        gender: form.salGender?.value || null, linkedin_url: form.salLinkedin?.value || null,
        is_seed: false
      }]).then(res => { if (res.error) console.error('Supabase insert error:', res.error); else console.log('✅ Salary saved to Supabase'); });
    }

    // Refresh display (combines loaded DB entries + user's current session/local entries)
    if (!allData.some(d => d.id === entry.id)) {
      allData.push(entry);
    }
    renderDashboard(allData);

    // Show success
    form.reset();
    const msg = document.getElementById('salaryFormSuccess');
    if (msg) { msg.style.display = 'flex'; setTimeout(() => msg.style.display = 'none', 4000); }
  }

  // --- Load from Supabase ---
  async function loadFromSupabase() {
    let localSubmissions = [];
    try {
      const stored = localStorage.getItem('quant_mentor_local_salaries');
      if (stored) localSubmissions = JSON.parse(stored);
    } catch (e) { console.warn('Failed to load local salaries:', e); }

    allData = [...localSubmissions];
    renderDashboard(allData);
    if (typeof renderSalaryWidget === 'function') renderSalaryWidget();

    if (!window.supabaseClient) return;
    try {
      const { data, error } = await window.supabaseClient.from('salary_submissions').select('*').eq('is_approved', true);
      if (error) { console.warn('Supabase salary load error:', error); return; }
      if (data && data.length) {
        const mapped = data.filter(d => !d.is_seed).map(d => ({
          region: d.region, country: d.country, city: d.city, firm: d.firm_name,
          role: d.role, level: d.level, yoe: d.years_of_experience,
          base: d.base_salary, bonus: d.bonus || 0, equity: d.equity || 0,
          total_comp: d.base_salary + (d.bonus||0) + (d.equity||0),
          currency: d.currency || 'USD', education: d.education,
          id: d.id, is_seed: false
        }));
        
        // Merge mapped with local submissions, avoiding duplicates by id
        const merged = [...localSubmissions];
        mapped.forEach(m => {
          if (!merged.some(l => l.id === m.id)) {
            merged.push(m);
          }
        });
        allData = merged;
        renderDashboard(allData);
        if (typeof renderSalaryWidget === 'function') renderSalaryWidget();
      }
    } catch (e) { console.warn('Supabase salary fetch failed:', e); }
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    // Setup cascading dropdowns
    setupRegionCascade(
      document.getElementById('salRegion'),
      document.getElementById('salCountry'),
      document.getElementById('salCity')
    );
    // Also for filter region (just region level)
    // Filters
    ['filterRegion','filterRole','filterFirm','filterMinYoe','filterMaxYoe'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', applyFilters);
      if (el && el.tagName === 'INPUT') el.addEventListener('input', applyFilters);
    });

    // Form
    const form = document.getElementById('salaryForm');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // Table sort
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (tableSortCol === col) tableSortDir *= -1; else { tableSortCol = col; tableSortDir = -1; }
        applyFilters();
      });
    });

    // Render with seed data
    renderDashboard(allData);

    // Load user submissions from Supabase
    setTimeout(loadFromSupabase, 500);

    // YoE slider display
    const yoeSlider = document.getElementById('salYoe');
    const yoeDisplay = document.getElementById('yoeDisplay');
    if (yoeSlider && yoeDisplay) {
      yoeSlider.addEventListener('input', () => yoeDisplay.textContent = yoeSlider.value + ' years');
    }

    // Auto set currency from region
    const regionSel = document.getElementById('salRegion');
    const currSel = document.getElementById('salCurrency');
    if (regionSel && currSel) {
      regionSel.addEventListener('change', () => {
        const c = CURRENCIES[regionSel.value];
        if (c) currSel.value = c;
      });
    }

    // Reset local data button
    const btnReset = document.getElementById('btnResetLocal');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local testing submissions? This will completely reset the dashboard to a fresh zero-state.')) {
          localStorage.removeItem('quant_mentor_local_salaries');
          allData = [];
          renderDashboard(allData);
          if (typeof renderSalaryWidget === 'function') renderSalaryWidget();
          alert('Local submissions cleared successfully!');
        }
      });
    }
  });

  // --- Homepage Mini Dashboard ---
  window.renderSalaryWidget = function() {
    const ws1 = document.getElementById('widgetStatTotal');
    const ws2 = document.getElementById('widgetStatMedian');
    const ws3 = document.getElementById('widgetStatRegions');

    if (!allData.length) {
      if (ws1) ws1.textContent = '0';
      if (ws2) ws2.textContent = '$0';
      if (ws3) ws3.textContent = '0';

      const c1Wrap = document.getElementById('widgetChartRegionWrap');
      const c2Wrap = document.getElementById('widgetChartDistWrap');

      if (c1Wrap) {
        c1Wrap.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:var(--text-muted); font-size:0.75rem; border: 1px dashed var(--border-light); border-radius: var(--radius-sm); padding:10px; background:rgba(0,0,0,0.05); min-height:160px;">
            <i class="fas fa-chart-bar" style="font-size:1.4rem; margin-bottom:6px; color:var(--accent-secondary); opacity:0.6;"></i>
            <span>No salary data yet.</span>
          </div>
        `;
      }
      if (c2Wrap) {
        c2Wrap.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:var(--text-muted); font-size:0.75rem; border: 1px dashed var(--border-light); border-radius: var(--radius-sm); padding:10px; background:rgba(0,0,0,0.05); min-height:160px;">
            <i class="fas fa-chart-pie" style="font-size:1.4rem; margin-bottom:6px; color:var(--accent-secondary); opacity:0.6;"></i>
            <span>No data yet.</span>
          </div>
        `;
      }
      return;
    }

    const c1Wrap = document.getElementById('widgetChartRegionWrap');
    const c2Wrap = document.getElementById('widgetChartDistWrap');
    if (c1Wrap && !document.getElementById('widgetChartRegion')) {
      c1Wrap.innerHTML = `<canvas id="widgetChartRegion"></canvas>`;
    }
    if (c2Wrap && !document.getElementById('widgetChartDist')) {
      c2Wrap.innerHTML = `<canvas id="widgetChartDist"></canvas>`;
    }

    const usdData = allData.map(d => ({ ...d, tc_usd: toUSD(d.total_comp, d.currency) }));
    const byRegion = groupBy(usdData, 'region');
    const regionLabels = Object.keys(byRegion).sort();
    const regionMedians = regionLabels.map(r => median(byRegion[r].map(d => d.tc_usd)));

    // Mini region chart
    const c1 = document.getElementById('widgetChartRegion');
    if (c1) {
      try {
        if (typeof Chart !== 'undefined') {
          new Chart(c1, { type: 'bar', data: { labels: regionLabels, datasets: [{ data: regionMedians, backgroundColor: COLORS.slice(0, regionLabels.length), borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatK(ctx.raw) }}}, scales: { x: { ticks: { callback: v => formatK(v) }, grid: { display: false }}, y: { grid: { display: false }}}}});
        }
      } catch (e) {
        console.error('Error rendering widget region chart:', e);
      }
    }

    // Mini TC distribution
    const c2 = document.getElementById('widgetChartDist');
    if (c2) {
      try {
        if (typeof Chart !== 'undefined') {
          const buckets = [0,100000,250000,500000,750000,1500000];
          const bLabels = buckets.slice(0,-1).map((b,i) => formatK(b)+'-'+formatK(buckets[i+1]));
          const hist = new Array(buckets.length-1).fill(0);
          usdData.forEach(d => { for (let i=0;i<buckets.length-1;i++) { if (d.tc_usd>=buckets[i]&&d.tc_usd<buckets[i+1]) { hist[i]++; break; }}});
          new Chart(c2, { type: 'doughnut', data: { labels: bLabels, datasets: [{ data: hist, backgroundColor: COLORS.slice(0,bLabels.length), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 }}}}}});
        }
      } catch (e) {
        console.error('Error rendering widget dist chart:', e);
      }
    }

    if (ws1) ws1.textContent = usdData.length;
    if (ws2) ws2.textContent = formatK(median(usdData.map(d => d.tc_usd)));
    if (ws3) ws3.textContent = regionLabels.length;
  };
})();
