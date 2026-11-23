// Helper utilities
let allRows = [];
let charts = {};

const number = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};
const sum = (rows, key) => rows.reduce((total, row) => total + number(row[key]), 0);
const unique = (rows, key) => [...new Set(rows.map(row => String(row[key] ?? '').trim()).filter(Boolean))];
const formatNumber = (value, digits = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const statusEl = document.getElementById('dataStatus');
const yearFilter = document.getElementById('yearFilter');
const pondFilter = document.getElementById('pondFilter');
const searchInput = document.getElementById('tableSearch');

function cleanRows(rows) {
  return rows.filter(row => row.Siklus_ID && row.Kolam).map(row => ({
    ...row,
    Tahun_Panen: number(row.Tahun_Panen),
    Total_Berat_Kg: number(row.Total_Berat_Kg),
    Total_Ikan_Ekor: number(row.Total_Ikan_Ekor),
    Jumlah_Penimbangan: number(row.Jumlah_Penimbangan),
    Rata_Berat_Ikan_Kg: number(row.Rata_Berat_Ikan_Kg),
    Benih_Awal: number(row.Benih_Awal),
    Ikan_Mati: number(row.Ikan_Mati),
    Survival_Rate: number(row.Survival_Rate),
    Durasi_Budidaya_Bulan: number(row.Durasi_Budidaya_Bulan)
  }));
}

// Automatic CSV loader (single clean version)
// Now reads CSV data embedded in the HTML via <script id="csvData" type="text/plain">
function loadCsvFromUrl() {
  const csvText = document.getElementById('csvData')?.textContent?.trim();
  if (!csvText) {
    statusEl.textContent = 'Tidak ada data CSV yang disematkan.';
    return;
  }
  statusEl.textContent = 'Membaca data CSV...';
  // Parse the CSV text directly (no network request)
  parseCsvText(csvText, 'embedded');
}

function parseCsvText(csvText, url) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: results => parsePapaResults(results, url),
    error: () => { statusEl.textContent = 'Gagal memuat CSV otomatis (parsing error).'; }
  });
}

function parsePapaResults(results, url) {
  const rows = cleanRows(results.data);
  const required = ['Siklus_ID','Kolam','Tahun_Panen','Total_Berat_Kg','Total_Ikan_Ekor','Benih_Awal','Survival_Rate','Durasi_Budidaya_Bulan'];
  const fields = results.meta.fields || [];
  const missing = required.filter(k => !fields.includes(k));
  if (!rows.length || missing.length) {
    statusEl.textContent = 'Format CSV tidak sesuai. Pastikan file CSV memiliki struktur yang benar.';
    return;
  }
  allRows = rows;
  populateFilters();
  renderDashboard();
  statusEl.textContent = `Berhasil membaca ${rows.length} siklus dari ${url}.`;
}

function populateFilters() {
  const years = unique(allRows, 'Tahun_Panen').sort((a, b) => Number(a) - Number(b));
  const ponds = unique(allRows, 'Kolam').sort((a, b) => a.localeCompare(b, 'id'));
  yearFilter.innerHTML = '<option value="all">Semua tahun</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  pondFilter.innerHTML = '<option value="all">Semua kolam</option>' + ponds.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function getFilteredRows() {
  const year = yearFilter.value;
  const pond = pondFilter.value;
  return allRows.filter(row => (year === 'all' || String(row.Tahun_Panen) === year) && (pond === 'all' || row.Kolam === pond));
}

function makeChart(id, config) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id);
  charts[id] = new Chart(ctx, config);
}

function renderDashboard() {
  const filtered = getFilteredRows();
  const pond = pondFilter.value;
  const trendRows = allRows.filter(row => pond === 'all' || row.Kolam === pond);
  const totalWeight = sum(filtered, 'Total_Berat_Kg');
  const totalFish = sum(filtered, 'Total_Ikan_Ekor');
  const totalSeed = sum(filtered, 'Benih_Awal');
  const survival = totalSeed > 0 ? totalFish / totalSeed * 100 : 0;
  const cycles = new Set(filtered.map(row => row.Siklus_ID)).size;

  document.getElementById('kpiWeight').textContent = `${formatNumber(totalWeight, 2)} kg`;
  document.getElementById('kpiFish').textContent = `${formatNumber(totalFish)} ekor`;
  document.getElementById('kpiSurvival').textContent = `${formatNumber(survival, 2)}%`;
  document.getElementById('kpiCycles').textContent = formatNumber(cycles);

  const annual = new Map();
  trendRows.forEach(row => annual.set(row.Tahun_Panen, (annual.get(row.Tahun_Panen) || 0) + row.Total_Berat_Kg));
  const annualLabels = [...annual.keys()].sort((a, b) => a - b);
  makeChart('trendChart', {
    type: 'line',
    data: {
      labels: annualLabels,
      datasets: [{
        label: 'Berat panen',
        data: annualLabels.map(y => annual.get(y)),
        borderColor: '#16845b',
        backgroundColor: 'rgba(22,132,91,.12)',
        fill: true,
        tension: .3,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: chartOptions('kg')
  });

  const pondNames = unique(filtered, 'Kolam').sort((a, b) => a.localeCompare(b, 'id'));
  const pondWeight = pondNames.map(name => sum(filtered.filter(row => row.Kolam === name), 'Total_Berat_Kg'));
  makeChart('pondChart', {
    type: 'bar',
    data: {
      labels: pondNames,
      datasets: [{
        label: 'Total berat panen',
        data: pondWeight,
        backgroundColor: ['#16845b', '#4b9d79', '#8bc5a5', '#b6d9c4'],
        borderRadius: 7,
        maxBarThickness: 46
      }]
    },
    options: chartOptions('kg')
  });

  const pondSurvival = pondNames.map(name => {
    const rows = filtered.filter(row => row.Kolam === name);
    const seeds = sum(rows, 'Benih_Awal');
    const fish = sum(rows, 'Total_Ikan_Ekor');
    return seeds ? fish / seeds * 100 : 0;
  });
  makeChart('survivalChart', {
    type: 'bar',
    data: {
      labels: pondNames,
      datasets: [{
        label: 'Survival rate',
        data: pondSurvival,
        backgroundColor: '#78a9d6',
        borderRadius: 7,
        maxBarThickness: 46
      }]
    },
    options: {
      ...chartOptions('%'),
      scales: {
        ...chartOptions('%').scales,
        y: {
          ...chartOptions('%').scales.y,
          min: 0,
          max: 100,
          ticks: { callback: value => `${value}%` }
        }
      }
    }
  });

  const durationGroups = new Map();
  filtered.forEach(row => {
    const duration = row.Durasi_Budidaya_Bulan;
    if (!durationGroups.has(duration)) durationGroups.set(duration, []);
    durationGroups.get(duration).push(row.Total_Berat_Kg);
  });
  const durations = [...durationGroups.keys()].sort((a, b) => a - b);
  const avgByDuration = durations.map(d => {
    const vals = durationGroups.get(d);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  makeChart('durationChart', {
    type: 'bar',
    data: {
      labels: durations.map(v => `${v} bulan`),
      datasets: [{
        label: 'Rata-rata berat panen per siklus',
        data: avgByDuration,
        backgroundColor: '#d7a65a',
        borderRadius: 7,
        maxBarThickness: 55
      }]
    },
    options: chartOptions('kg per siklus')
  });

  renderTable(filtered);
}

function chartOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 2)} ${unit}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#7c8a81', font: { family: 'DM Sans', size: 10 } } },
      y: { beginAtZero: true, grid: { color: '#edf1ee' }, ticks: { color: '#7c8a81', font: { family: 'DM Sans', size: 10 }, callback: v => formatNumber(v) } }
    }
  };
}

function renderTable(rows) {
  const query = searchInput.value.toLowerCase().trim();
  const visible = rows.filter(row => `${row.Siklus_ID} ${row.Kolam} ${row.Tahun_Panen}`.toLowerCase().includes(query))
    .sort((a, b) => String(b.Tanggal_Panen).localeCompare(String(a.Tanggal_Panen)));
  const tbody = document.getElementById('dataTable');
  if (!visible.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Tidak ada data yang sesuai dengan filter.</td></tr>';
  } else {
    tbody.innerHTML = visible.map(row => `
      <tr>
        <td><strong>${escapeHtml(row.Siklus_ID)}</strong></td>
        <td>${escapeHtml(row.Kolam)}</td>
        <td>${row.Tahun_Panen}</td>
        <td>${formatDate(row.Tanggal_Panen)}</td>
        <td>${formatNumber(row.Total_Berat_Kg, 2)}</td>
        <td>${formatNumber(row.Total_Ikan_Ekor)}</td>
        <td>${formatNumber(row.Rata_Berat_Ikan_Kg, 3)}</td>
        <td>${formatNumber(row.Survival_Rate, 2)}%</td>
        <td>${formatNumber(row.Durasi_Budidaya_Bulan)}</td>
      </tr>`).join('');
  }
  document.getElementById('tableCount').textContent = `${visible.length} dari ${rows.length} siklus ditampilkan`;
}

// Automatic loading; manual file input removed
window.addEventListener('load', () => loadCsvFromUrl());

yearFilter.addEventListener('change', renderDashboard);
pondFilter.addEventListener('change', renderDashboard);
searchInput.addEventListener('input', () => renderTable(getFilteredRows()));
document.getElementById('resetFilters').addEventListener('click', () => {
  yearFilter.value = 'all';
  pondFilter.value = 'all';
  searchInput.value = '';
  renderDashboard();
});