// ============================================================
// Shared state
// ============================================================
let map, trueLine, naiveLine, aiLine, marker, chart;
let stepCount = 0;
const METER_SEGMENTS = 10;

// Demo-mode state
let demoRows = [];
let demoPlaying = false;

// Live-mode state
let lastFix = null;
let compassHeading = null;
let simulatingLoss = false;
let lossInterval = null;
let watchId = null;
let liveTrackingActive = false;

// ============================================================
// Shared math helpers
// ============================================================
function haversineDistance(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function bearing(a, b) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const y = Math.sin(toRad(b[1]-a[1])) * Math.cos(toRad(b[0]));
  const x = Math.cos(toRad(a[0]))*Math.sin(toRad(b[0])) - Math.sin(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.cos(toRad(b[1]-a[1]));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function propagate(lat, lon, speedMps, headingDeg, dtSec) {
  const R_LAT = 111320.0;
  const hdgRad = headingDeg * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const dlat = (speedMps * Math.cos(hdgRad) * dtSec) / R_LAT;
  const dlon = (speedMps * Math.sin(hdgRad) * dtSec) / (R_LAT * Math.max(Math.cos(latRad), 1e-6));
  return [lat + dlat, lon + dlon];
}

// ============================================================
// Shared UI helpers
// ============================================================
function initConfidenceMeter() {
  const meter = document.getElementById('confidence-meter');
  meter.innerHTML = '';
  for (let i = 0; i < METER_SEGMENTS; i++) {
    const seg = document.createElement('div');
    seg.className = 'seg';
    meter.appendChild(seg);
  }
}

function updateConfidenceMeter(improvementPct, gpsLocked) {
  const segs = document.querySelectorAll('#confidence-meter .seg');
  const litCount = Math.round((Math.max(0, Math.min(100, improvementPct)) / 100) * METER_SEGMENTS);
  segs.forEach((seg, i) => {
    seg.className = 'seg';
    if (i < litCount) {
      seg.classList.add(gpsLocked ? 'lit-good' : (litCount > METER_SEGMENTS * 0.5 ? 'lit-warn' : 'lit-bad'));
    }
  });
}

function setStatus(locked, acquiring) {
  const pill = document.getElementById('status-pill');
  if (acquiring) {
    pill.className = 'status-pill';
    document.getElementById('status-text').innerText = 'ACQUIRING GPS…';
    return;
  }
  pill.className = 'status-pill ' + (locked ? 'lock' : 'denied');
  document.getElementById('status-text').innerText = locked ? 'GPS LOCKED' : 'GPS LOST — AI TAKING OVER';
}

function updateReadouts(truePt, aiPt, aiDrift) {
  document.getElementById('true-coord').innerText = truePt[0].toFixed(5) + '°N, ' + truePt[1].toFixed(5) + '°E';
  document.getElementById('ai-coord').innerText = aiPt[0].toFixed(5) + '°N, ' + aiPt[1].toFixed(5) + '°E';
  document.getElementById('drift-value').innerHTML = aiDrift.toFixed(1) + ' <small>m</small>';
}

function pushChartPoint(label, naiveDrift, aiDrift) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(naiveDrift);
  chart.data.datasets[1].data.push(aiDrift);
  if (chart.data.labels.length > 60) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }
  chart.update('none');
}

function logEvent(text, cls) {
  const log = document.getElementById('event-log');
  const li = document.createElement('li');
  li.className = cls;
  li.innerText = text;
  log.prepend(li);
}

// ============================================================
// Map + chart init (once, shared by both modes)
// ============================================================
function initMap(center) {
  map = L.map('map').setView(center, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  trueLine = L.polyline([], {
    color: '#2DD4BF',
    weight: 3,
    opacity: 0.6
  }).addTo(map);

  naiveLine = L.polyline([], {
    color: '#F0483E',
    weight: 4,
    dashArray: '6,6',
    opacity: 1
  }).addTo(map);

  aiLine = L.polyline([], {
    color: '#F5A623',
    weight: 5,
    opacity: 1
  }).addTo(map);

  marker = L.circleMarker(center, {
    radius: 7,
    color: '#F5A623',
    weight: 2,
    fillColor: '#F5A623',
    fillOpacity: 1
  }).addTo(map);
}

function initChart() {
  const ctx = document.getElementById('driftChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Old method', data: [], borderColor: '#F0483E', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 },
        { label: 'Our AI', data: [], borderColor: '#F5A623', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { labels: { color: '#E8EAED', font: { family: 'Inter', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8B93A3', maxTicksLimit: 8 }, grid: { color: '#262B36' } },
        y: { ticks: { color: '#8B93A3' }, title: { display: true, text: 'meters off true path', color: '#8B93A3' }, grid: { color: '#262B36' }, beginAtZero: true }
      }
    }
  });
}

function resetChartAndPaths() {
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  chart.update('none');
  trueLine.setLatLngs([]);
  naiveLine.setLatLngs([]);
  aiLine.setLatLngs([]);
  document.getElementById('event-log').innerHTML = '';
  stepCount = 0;
}

// ============================================================
// DEMO MODE — real recorded backend data, guaranteed to work
// ============================================================
function runDemo() {
  const demoBtn = document.getElementById('demo-btn');
  const liveBtn = document.getElementById('live-btn');
  if (demoPlaying) return;

  Papa.parse('sample_data.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      demoRows = results.data.filter(r => r.time !== null);
      playDemo(demoBtn, liveBtn);
    }
  });
}

function playDemo(demoBtn, liveBtn) {
  demoPlaying = true;
  demoBtn.disabled = true;
  liveBtn.disabled = true;
  resetChartAndPaths();

  const gpsPath = demoRows.map(r => [r.gps_lat, r.gps_lng]);
  const naivePath = demoRows.map(r => [r.naive_lat, r.naive_lng]);
  const aiPath = demoRows.map(r => [r.ai_lat, r.ai_lng]);
  const naiveDrift = naivePath.map((p, i) => haversineDistance(p, gpsPath[i]));
  const aiDrift = aiPath.map((p, i) => haversineDistance(p, gpsPath[i]));

  trueLine.setLatLngs([]);
naiveLine.setLatLngs([]);
aiLine.setLatLngs([]);

const allPoints = gpsPath.concat(naivePath, aiPath);

if (allPoints.length > 0) {
  map.fitBounds(L.latLngBounds(allPoints), {
    padding: [40, 40]
  });
}

  let i = 0;
  const interval = setInterval(() => {
    const r = demoRows[i];
    const locked = r.gps_status === 'LOCK';

    setStatus(locked, false);
    document.getElementById('sat-value').innerText = locked ? '9' : '0';
    updateReadouts(gpsPath[i], aiPath[i], aiDrift[i]);

    if (i > 0) {
      const heading = bearing(aiPath[i - 1], aiPath[i]);
      document.getElementById('heading-value').innerText = Math.round(heading) + '°';
      document.getElementById('compass').style.transform = `rotate(${heading}deg)`;
    }

    let improvementPct = 0;
    if (naiveDrift[i] > 0) {
      improvementPct = Math.max(0, ((naiveDrift[i] - aiDrift[i]) / naiveDrift[i]) * 100);
      document.getElementById('improvement-value').innerText = Math.round(improvementPct) + '%';
    } else {
      document.getElementById('improvement-value').innerText = '--%';
    }
    updateConfidenceMeter(improvementPct, locked);

    trueLine.addLatLng(gpsPath[i]);
naiveLine.addLatLng(naivePath[i]);
aiLine.addLatLng(aiPath[i]);
marker.setLatLng(aiPath[i]);

    pushChartPoint('T' + r.time, naiveDrift[i], aiDrift[i]);
    logEvent(`T${r.time} — ${locked ? 'GPS signal acquired' : 'GPS signal lost, AI engaged'} — off by ${aiDrift[i].toFixed(1)}m`, locked ? 'ok' : 'warn');

    i++;
    if (i >= demoRows.length) {
      clearInterval(interval);
      demoPlaying = false;
      demoBtn.disabled = false;
      liveBtn.disabled = false;
      demoBtn.innerText = '↻ RUN AGAIN';
    }
  }, 1000);
}

// ============================================================
// LIVE MODE — real device GPS + real compass
// ============================================================
function onRealFix(pos) {
  const lat = pos.coords.latitude, lon = pos.coords.longitude;
  const acc = pos.coords.accuracy;
  const now = pos.timestamp;

  document.getElementById('sat-value').innerText = Math.round(acc) + 'm';

  let speedMps = pos.coords.speed;
  let headingDeg = pos.coords.heading;

  if (lastFix) {
    const dt = (now - lastFix.t) / 1000;
    if (dt > 0.2) {
      if (speedMps == null || isNaN(speedMps)) {
        speedMps = haversineDistance([lastFix.lat, lastFix.lon], [lat, lon]) / dt;
      }
      if (headingDeg == null || isNaN(headingDeg)) {
        headingDeg = bearing([lastFix.lat, lastFix.lon], [lat, lon]);
      }
    }
  }
  speedMps = speedMps || 0;
  headingDeg = headingDeg == null ? (lastFix ? lastFix.headingDeg : 0) : headingDeg;

  lastFix = { lat, lon, t: now, speedMps, headingDeg };
  trueLine.addLatLng([lat, lon]);

  if (!simulatingLoss) {
    naiveLine.addLatLng([lat, lon]);
    aiLine.addLatLng([lat, lon]);
    marker.setLatLng([lat, lon]);
    map.panTo([lat, lon]);
    setStatus(true, false);
    updateReadouts([lat, lon], [lat, lon], 0);
    document.getElementById('improvement-value').innerText = '--%';
    updateConfidenceMeter(0, true);
    pushChartPoint('T' + stepCount, 0, 0);
    logEvent(`T${stepCount} — GPS signal acquired — off by 0.0m`, 'ok');
    stepCount++;
  }
}

function toggleLoss() {
  simulatingLoss = !simulatingLoss;
  const btn = document.getElementById('sim-loss-btn');

  if (simulatingLoss) {
    btn.innerText = '📡 RESTORE GPS';
    setStatus(false, false);
    logEvent(`T${stepCount} — GPS signal lost (simulated) — AI dead reckoning engaged`, 'warn');

    let naiveState = { lat: lastFix.lat, lon: lastFix.lon, heading: lastFix.headingDeg, speed: lastFix.speedMps };
    let aiState = { lat: lastFix.lat, lon: lastFix.lon, heading: lastFix.headingDeg, speed: lastFix.speedMps };

    lossInterval = setInterval(() => {
      const dt = 1;
      const [nLat, nLon] = propagate(naiveState.lat, naiveState.lon, naiveState.speed, naiveState.heading, dt);
      naiveState.lat = nLat; naiveState.lon = nLon;

      const aiHeading = compassHeading != null ? compassHeading : aiState.heading;
      const [aLat, aLon] = propagate(aiState.lat, aiState.lon, aiState.speed, aiHeading, dt);
      aiState.lat = aLat; aiState.lon = aLon; aiState.heading = aiHeading;

      naiveLine.addLatLng([naiveState.lat, naiveState.lon]);
      aiLine.addLatLng([aiState.lat, aiState.lon]);
      marker.setLatLng([aiState.lat, aiState.lon]);

      const truePt = lastFix ? [lastFix.lat, lastFix.lon] : [naiveState.lat, naiveState.lon];
      const naiveDrift = haversineDistance([naiveState.lat, naiveState.lon], truePt);
      const aiDrift = haversineDistance([aiState.lat, aiState.lon], truePt);

      updateReadouts(truePt, [aiState.lat, aiState.lon], aiDrift);
      let improvementPct = naiveDrift > 0 ? Math.max(0, ((naiveDrift - aiDrift) / naiveDrift) * 100) : 0;
      document.getElementById('improvement-value').innerText = naiveDrift > 0 ? Math.round(improvementPct) + '%' : '--%';
      updateConfidenceMeter(improvementPct, false);

      pushChartPoint('T' + stepCount, naiveDrift, aiDrift);
      logEvent(`T${stepCount} — GPS lost, AI engaged — off by ${aiDrift.toFixed(1)}m`, 'warn');
      stepCount++;

      if (compassHeading != null) {
        document.getElementById('heading-value').innerText = Math.round(compassHeading) + '°';
        document.getElementById('compass').style.transform = `rotate(${compassHeading}deg)`;
      }
    }, 1000);

  } else {
    btn.innerText = '⚠ SIMULATE GPS LOSS';
    clearInterval(lossInterval);
    logEvent(`T${stepCount} — GPS signal reacquired — re-anchoring`, 'ok');
  }
}

function initOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(state => {
      if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
    }).catch(() => {});
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

function handleOrientation(e) {
  if (e.alpha != null) {
    compassHeading = 360 - e.alpha;
    if (!simulatingLoss) {
      document.getElementById('heading-value').innerText = Math.round(compassHeading) + '°';
      document.getElementById('compass').style.transform = `rotate(${compassHeading}deg)`;
    }
  }
}

function stopLiveTracking() {
  const controlRow = document.getElementById('control-row');
  const lossBtn = document.getElementById('sim-loss-btn');
  const liveBtn = document.getElementById('live-btn');

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (lossInterval) {
    clearInterval(lossInterval);
    lossInterval = null;
  }

  simulatingLoss = false;
  liveTrackingActive = false;
  lastFix = null;

  if (lossBtn) {
    lossBtn.style.display = 'none';
    lossBtn.innerText = '⚠ SIMULATE GPS LOSS';
  }

  if (controlRow) {
    controlRow.style.display = 'flex';
  }

  if (liveBtn) {
    liveBtn.innerText = '📡 GO LIVE';
  }

  setStatus(false, false);
  document.getElementById('improvement-value').innerText = '--%';
  updateConfidenceMeter(0, true);
  document.getElementById('heading-value').innerText = '0°';
  document.getElementById('compass').style.transform = 'rotate(0deg)';
}

function goLive() {
  const liveBtn = document.getElementById('live-btn');
  const controlRow = document.getElementById('control-row');
  const lossBtn = document.getElementById('sim-loss-btn');

  if (liveTrackingActive) {
    stopLiveTracking();
    return;
  }

  if (!navigator.geolocation) {
    alert('Geolocation not supported on this browser/device.');
    return;
  }

  resetChartAndPaths();
  liveTrackingActive = true;
  setStatus(false, true);
  initOrientation();

  if (controlRow) controlRow.style.display = 'none';
  if (lossBtn) {
    lossBtn.style.display = 'block';
    lossBtn.innerText = '⚠ SIMULATE GPS LOSS';
    lossBtn.onclick = () => {
      if (!lastFix) { alert('Waiting for first GPS fix…'); return; }
      toggleLoss();
    };
  }

  if (liveBtn) liveBtn.innerText = '🛑 STOP LIVE';

  watchId = navigator.geolocation.watchPosition(onRealFix, err => {
    alert('Location error: ' + err.message + ' (needs HTTPS or localhost, and permission granted)');
  }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
}

// ============================================================
// Boot
// ============================================================
window.addEventListener('load', () => {
  initChart();
  initConfidenceMeter();

  const startCenter = [20.5937, 78.9629]; // India center, replaced once real/demo data arrives
  initMap(startCenter);

  document.getElementById('demo-btn').addEventListener('click', runDemo);
  document.getElementById('live-btn').addEventListener('click', goLive);
});