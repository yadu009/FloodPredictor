let map = L.map('map').setView([28.6139, 77.2090], 6); // Default India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;
let selectedLocation = null;

// Map click
map.on('click', function (e) {
    const { lat, lng } = e.latlng;
    selectedLocation = { lat, lng };

    if (!marker) {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    } else {
        marker.setLatLng([lat, lng]);
    }

    marker.bindPopup(`📍 Lat: ${lat.toFixed(3)}, Lng: ${lng.toFixed(3)}`).openPopup();

    document.getElementById('fetch-data-button').disabled = false;
    document.getElementById('run-simulation-button').disabled = false;
});

// Fetch Data Button
document.getElementById('fetch-data-button').addEventListener('click', async () => {
    if (!selectedLocation) return alert("Select location on map first.");

    document.getElementById('sim-status').textContent = "Fetching data...";

    try {
        const res = await fetch('/fetch_data');
        const data = await res.json();

        const keys = Object.keys(data);
        keys.forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = data[key];
        });

        document.getElementById('sim-status').textContent = "Data updated successfully!";
    } catch (err) {
        document.getElementById('sim-status').textContent = "Error fetching data.";
    }
});

// Run Simulation
document.getElementById('run-simulation-button').addEventListener('click', () => {
    const rainfall = +document.getElementById('rainfall').value || 0;
    const discharge = +document.getElementById('river_discharge').value || 0;
    const water = +document.getElementById('water_level').value || 0;
    const soil = +document.getElementById('soil_moisture').value || 0;
    const humidity = +document.getElementById('humidity').value || 0;
    const temp = +document.getElementById('temperature').value || 0;
    const wind = +document.getElementById('wind_speed').value || 0;
    const pressure = +document.getElementById('pressure').value || 0;
    const deforestation = +document.getElementById('deforestation_index').value || 0;

    const score = rainfall * 0.3 + discharge * 0.2 + water * 0.1 + soil * 0.1 + humidity * 0.05 + wind * 0.05 + deforestation * 0.2 - temp * 0.1 - pressure * 0.02;

    let risk = "Low Risk";
    if (score > 150) risk = "High Risk";
    else if (score > 80) risk = "Moderate Risk";

    document.getElementById('flood-risk-value').textContent = risk;
    document.getElementById('sim-status').textContent = "Simulation complete ✅";
});
