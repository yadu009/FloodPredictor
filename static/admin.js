// -----------------------------
// Data Storage
// -----------------------------
let allAlerts = [];
let alertCounts = {
    high: 0,
    moderate: 0,
    low: 0
};

// -----------------------------
// Map Placeholder (for now)
// -----------------------------
function initMap() {
    const mapDiv = document.getElementById('admin-map');
    mapDiv.textContent = "Interactive Map Coming Soon 🗺️";
}

// -----------------------------
// Generate Random Alert
// -----------------------------
function generateRandomAlert() {
    const regions = ['North', 'South', 'East', 'West'];
    const riskLevels = ['High Risk', 'Moderate Risk', 'Low Risk'];

    const newAlert = {
        lat: 19 + Math.random(),
        lon: 72 + Math.random(),
        region: regions[Math.floor(Math.random() * regions.length)],
        title: riskLevels[Math.floor(Math.random() * riskLevels.length)]
    };

    allAlerts.push(newAlert);
    addAlertToPanel(newAlert);
    updateMetrics();
    updateTrendChart();
}

// -----------------------------
// Live Alert Panel
// -----------------------------
function addAlertToPanel(alert) {
    const alertList = document.getElementById('live-alerts-list');
    const li = document.createElement('li');
    li.textContent = `${alert.region} - ${alert.title} (${new Date().toLocaleTimeString()})`;

    if (alert.title === "High Risk") li.classList.add('high-risk');
    else if (alert.title === "Moderate Risk") li.classList.add('moderate-risk');
    else li.classList.add('low-risk');

    alertList.prepend(li);
    if (alertList.children.length > 10) alertList.removeChild(alertList.lastChild);
}

// -----------------------------
// Update Metrics
// -----------------------------
function updateMetrics() {
    alertCounts.high = allAlerts.filter(a => a.title === "High Risk").length;
    alertCounts.moderate = allAlerts.filter(a => a.title === "Moderate Risk").length;
    alertCounts.low = allAlerts.filter(a => a.title === "Low Risk").length;

    document.getElementById('total-alerts').textContent = allAlerts.length;
    document.getElementById('high-risk-alerts').textContent = alertCounts.high;
    document.getElementById('moderate-risk-alerts').textContent = alertCounts.moderate;
    document.getElementById('low-risk-alerts').textContent = alertCounts.low;
}

// -----------------------------
// Alert Trend Chart
// -----------------------------
const ctx = document.getElementById('alertTrendChart').getContext('2d');
const alertTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'High Risk', borderColor: '#b71c1c', data: [], fill: false },
            { label: 'Moderate Risk', borderColor: '#e65100', data: [], fill: false },
            { label: 'Low Risk', borderColor: '#2e7d32', data: [], fill: false }
        ]
    },
    options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
    }
});

function updateTrendChart() {
    const labels = allAlerts.map((_, i) => i + 1);
    alertTrendChart.data.labels = labels;
    alertTrendChart.data.datasets[0].data = allAlerts.filter(a => a.title === "High Risk").map((_, i) => i + 1);
    alertTrendChart.data.datasets[1].data = allAlerts.filter(a => a.title === "Moderate Risk").map((_, i) => i + 1);
    alertTrendChart.data.datasets[2].data = allAlerts.filter(a => a.title === "Low Risk").map((_, i) => i + 1);
    alertTrendChart.update();
}

// -----------------------------
// Initialize Page
// -----------------------------
window.onload = function() {
    initMap();
    setInterval(generateRandomAlert, 5000);
};
