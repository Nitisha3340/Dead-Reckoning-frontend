// Initialize the map, centered roughly on Delhi
const map = L.map('map').setView([28.6139, 77.2090], 15);

// Add the base map tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ---- LOAD DATA FROM CSV ----
Papa.parse('sample_data.csv', {
  download: true,
  header: true,
  dynamicTyping: true,
  complete: function(results) {
    const rows = results.data.filter(r => r.time !== null);

    const gpsTruthPath = rows.map(r => [r.gps_lat, r.gps_lng]);
    const naiveDRPath = rows.map(r => [r.naive_lat, r.naive_lng]);
    const aiCorrectedPath = rows.map(r => [r.ai_lat, r.ai_lng]);

    renderDashboard(gpsTruthPath, naiveDRPath, aiCorrectedPath);
  }
});

function renderDashboard(gpsTruthPath, naiveDRPath, aiCorrectedPath) {

  // ---- HAVERSINE DISTANCE FUNCTION ----
  function haversineDistance(coord1, coord2) {
    const R = 6371000;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLng = toRad(coord2[1] - coord1[1]);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ---- CALCULATE DRIFT ERRORS ----
  const naiveDriftErrors = naiveDRPath.map((point, i) => haversineDistance(point, gpsTruthPath[i]));
  const aiDriftErrors = aiCorrectedPath.map((point, i) => haversineDistance(point, gpsTruthPath[i]));

  // ---- DRAW PATHS ----
  const gpsLine = L.polyline(gpsTruthPath, { color: 'green', weight: 4 }).addTo(map).bindTooltip("GPS Ground Truth");
  const naiveLine = L.polyline(naiveDRPath, { color: 'red', weight: 4, dashArray: '6, 6' }).addTo(map).bindTooltip("Naive Dead Reckoning (drifts)");
  const aiLine = L.polyline(aiCorrectedPath, { color: 'blue', weight: 4 }).addTo(map).bindTooltip("AI-Corrected Path");

  // ---- LEGEND ----
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div style="background:white; padding:8px 12px; border-radius:6px; font-size:13px; line-height:1.6; color:black;">
        <div><span style="color:green;">■</span> GPS Ground Truth</div>
        <div><span style="color:red;">■</span> Naive Dead Reckoning</div>
        <div><span style="color:blue;">■</span> AI-Corrected Path</div>
      </div>
    `;
    return div;
  };
  legend.addTo(map);

  // ---- FIT MAP TO ALL PATHS ----
  const allPoints = gpsTruthPath.concat(naiveDRPath, aiCorrectedPath);
  map.fitBounds(L.polyline(allPoints).getBounds());

  // ---- UPDATE LIVE DRIFT NUMBER ----
  const latestDrift = aiDriftErrors[aiDriftErrors.length - 1];
  document.getElementById('drift-value').innerText = latestDrift.toFixed(1) + " m";

  // ---- DRAW CHART ----
  const ctx = document.getElementById('driftChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: gpsTruthPath.map((_, i) => `T${i}`),
      datasets: [
        { label: 'Naive DR Drift (m)', data: naiveDriftErrors, borderColor: 'red', backgroundColor: 'transparent', tension: 0.3 },
        { label: 'AI-Corrected Drift (m)', data: aiDriftErrors, borderColor: '#4ea1ff', backgroundColor: 'transparent', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: 'white' } } },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' }, title: { display: true, text: 'Meters', color: 'white' } }
      }
    }
  });
}