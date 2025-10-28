document.addEventListener("DOMContentLoaded", () => {
    const alertsList = document.getElementById("alerts-list");
    const searchRegion = document.getElementById("searchRegion");
    const filterRisk = document.getElementById("filterRisk");
    const ctx = document.getElementById("alertChart").getContext("2d");

    const regions = [
        { name: "Delhi", lat: 28.6139, lon: 77.2090 },
        { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
        { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
        { name: "Chennai", lat: 13.0827, lon: 80.2707 },
        { name: "Assam", lat: 26.2006, lon: 92.9376 },
        { name: "Kerala", lat: 10.8505, lon: 76.2711 },
        { name: "Bihar", lat: 25.0961, lon: 85.3131 },
        { name: "Uttarakhand", lat: 30.0668, lon: 79.0193 },
        { name: "Punjab", lat: 31.1471, lon: 75.3412 },
        { name: "Odisha", lat: 20.9517, lon: 85.0985 }
    ];

    const riskLevels = ["Low", "Moderate", "High"];
    let alertsData = [];
    let map, markers = [];

    // Initialize Map (Google-like style)
    function initMap() {
        map = L.map("floodMap", { zoomControl: true }).setView([22.5, 80], 5);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; OpenStreetMap, © CartoDB",
            maxZoom: 19
        }).addTo(map);
    }

    // Generate Mock Alerts
    function generateAlerts() {
        alertsData = regions.map(region => {
            const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
            return {
                region: region.name,
                risk,
                lat: region.lat,
                lon: region.lon,
                time: new Date().toLocaleTimeString()
            };
        });
    }

    // Render Alerts List
    function renderAlerts() {
        alertsList.innerHTML = "";
        const searchText = searchRegion.value.toLowerCase();
        const selectedRisk = filterRisk.value;

        alertsData
            .filter(a =>
                (selectedRisk === "All" || a.risk === selectedRisk) &&
                a.region.toLowerCase().includes(searchText)
            )
            .forEach(alert => {
                const card = document.createElement("div");
                card.className = `alert-card alert-${alert.risk.toLowerCase()}`;
                card.innerHTML = `
                    <strong>${alert.region}</strong><br>
                    Risk: <b>${alert.risk}</b> 🌡️<br>
                    ⏰ ${alert.time}
                `;
                alertsList.appendChild(card);
            });

        if (!alertsList.hasChildNodes()) {
            alertsList.innerHTML = "<p>No alerts match your filters.</p>";
        }
    }

    // Update Map Markers
    function updateMapMarkers() {
        markers.forEach(m => m.remove());
        markers = [];

        alertsData.forEach(alert => {
            const color = alert.risk === "High" ? "#e53935" : alert.risk === "Moderate" ? "#fb8c00" : "#43a047";

            const marker = L.circleMarker([alert.lat, alert.lon], {
                radius: 10,
                color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 2
            }).addTo(map);

            marker.bindPopup(`
                <b>${alert.region}</b><br>
                🌧️ Risk: <b>${alert.risk}</b><br>
                ⏰ ${alert.time}
            `);
            markers.push(marker);
        });
    }

    // Chart.js Setup
    const alertChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: riskLevels,
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#43a047', '#fb8c00', '#e53935']
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Active Alerts by Severity' }
            },
            animation: { duration: 800 }
        }
    });

    // Update Chart
    function updateChart() {
        const counts = { Low: 0, Moderate: 0, High: 0 };
        alertsData.forEach(a => counts[a.risk]++);
        alertChart.data.datasets[0].data = [counts.Low, counts.Moderate, counts.High];
        alertChart.update();
    }

    // Refresh All Data
    function refreshData() {
        generateAlerts();
        renderAlerts();
        updateMapMarkers();
        updateChart();
    }

    // Initialize
    initMap();
    refreshData();
    setInterval(refreshData, 20000);

    // Event Listeners
    searchRegion.addEventListener("input", renderAlerts);
    filterRisk.addEventListener("change", renderAlerts);
});
