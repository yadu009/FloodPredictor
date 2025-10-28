const weatherParams = [
 { id: "rainfall", label: "Rainfall (mm)", min: 0, max: 500, value: 50 },
 { id: "temperature", label: "Temperature (°C)", min: -10, max: 50, value: 25 },
 { id: "humidity", label: "Humidity (%)", min: 0, max: 100, value: 60 },
 { id: "wind_speed", label: "Wind Speed (m/s)", min: 0, max: 30, value: 5 }
];

const hydrologyParams = [
 { id: "river_discharge", label: "River Discharge (cumec)", min: 0, max: 1000, value: 200 },
 { id: "water_level", label: "Water Level (m)", min: 0, max: 20, value: 5 },
 { id: "soil_moisture", label: "Soil Moisture (%)", min: 0, max: 100, value: 40 },
 { id: "pressure", label: "Pressure (hPa)", min: 800, max: 1100, value: 1000 }
];

const geoParams = [
 { id: "elevation", label: "Elevation (m)", min: 0, max: 4000, value: 250 },
 { id: "population_density", label: "Population Density", min: 0, max: 5000, value: 1000 },
 { id: "drainage_efficiency", label: "Drainage Efficiency (%)", min: 0, max: 100, value: 75 },
 { id: "distance_to_coast", label: "Distance to Coast (km)", min: 0, max: 1000, value: 100 },
 { id: "deforestation_index", label: "Deforestation Index", min: 0, max: 100, value: 40 }
];

function createSliders(params, containerId) {
 const container = document.getElementById(containerId);
 params.forEach(p => {
  const div = document.createElement('div');
  div.className = 'slider-container';
  div.innerHTML = `
   <label>${p.label}: <span id="${p.id}_val">${p.value}</span></label>
   <input type="range" id="${p.id}" min="${p.min}" max="${p.max}" value="${p.value}" step="1">
  `;
  container.appendChild(div);
  // MODIFIED: Event listener now calls updateChartDisplay
  document.getElementById(p.id).addEventListener('input', e => {
   document.getElementById(`${p.id}_val`).textContent = e.target.value;
   updateChartDisplay();
  });
 });
}

createSliders(weatherParams, "weatherParams");
createSliders(hydrologyParams, "hydrologyParams");
createSliders(geoParams, "geoParams");

let map = L.map('map').setView([28.6139, 77.2090], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

map.on('click', function (e) {
 L.marker(e.latlng).addTo(map);
});

let ctx = document.getElementById('paramChart').getContext('2d');
let chart = new Chart(ctx, {
 type: 'bar',
 data: {
  labels: weatherParams.map(p => p.label),
  datasets: [{
   label: 'Parameter Values',
   data: weatherParams.map(p => p.value),
   backgroundColor: '#42a5f5'
  }]
 },
 options: { responsive: true }
});

// RENAMED & MODIFIED: This function now *only* updates the chart, not the risk gauge.
function updateChartDisplay() {
 const values = weatherParams.map(p => 
  parseFloat(document.getElementById(p.id).value)
 );
 chart.data.datasets[0].data = values;
 chart.update();
}

// NEW FUNCTION: Handles the backend API call
function fetchPrediction() {
    console.log("Running simulation...");
    const statusEl = document.getElementById("sim-status");
    statusEl.textContent = "Running simulation...";

    // 1. Collect all data and map to backend keys (from your example index.js)
    const data = {
        rainfall_mm: parseFloat(document.getElementById('rainfall').value),
        river_discharge_cumec: parseFloat(document.getElementById('river_discharge').value),
        water_level_m: parseFloat(document.getElementById('water_level').value),
        soil_moisture_percent: parseFloat(document.getElementById('soil_moisture').value),
        temperature_c: parseFloat(document.getElementById('temperature').value),
        humidity_percent: parseFloat(document.getElementById('humidity').value),
        wind_speed_ms: parseFloat(document.getElementById('wind_speed').value),
        pressure_hpa: parseFloat(document.getElementById('pressure').value),
        elevation_m: parseFloat(document.getElementById('elevation').value),
        population_density: parseFloat(document.getElementById('population_density').value),
        drainage_efficiency: parseFloat(document.getElementById('drainage_efficiency').value),
        distance_to_coast_km: parseFloat(document.getElementById('distance_to_coast').value),
        deforestation_index: parseFloat(document.getElementById('deforestation_index').value)
    };

    // 2. Send data to Flask backend
    fetch("/predict", { // Using relative URL for Flask
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log("Prediction result:", result);
        if (result.success) {
            // 3. Update UI with backend results
            statusEl.textContent = "Complete";

            const riskPercent = (result.probability * 100).toFixed(1);

            // Update Gauge
            document.getElementById("riskValue").textContent = `${riskPercent}%`;
            document.getElementById("gauge").style.background = 
                `conic-gradient(#d9534f ${riskPercent}%, #ccc ${riskPercent}%)`; // Red for risk

            // Update Key Metrics
            document.getElementById("riskCategory").textContent = result.risk_level;
            document.getElementById("prediction").textContent = result.prediction;
            document.getElementById("recommendation").textContent = result.recommendation;
            
            // These fields are not in your example response, so they remain N/A.
            // If your backend *does* return them, you can uncomment and map them here.
            // document.getElementById("duration").textContent = result.duration_hrs;
            // document.getElementById("population").textContent = result.population_affected;

        } else {
            throw new Error(result.error || "Prediction failed on server.");
        }
    })
    .catch(err => {
        // 4. Handle any errors
        console.error('Simulation Error:', err);
        statusEl.textContent = `Error: ${err.message}`;
        alert('Error running simulation: ' + err.message);
    });
}


// MODIFIED: "runSim" button now calls fetchPrediction
document.getElementById("runSim").addEventListener("click", fetchPrediction);
document.getElementById("resetSim").addEventListener("click", () => location.reload());

// MODIFIED: Preset buttons now call updateChartDisplay
document.getElementById("normalBtn").addEventListener("click", () => setPreset(1));
document.getElementById("monsoonBtn").addEventListener("click", () => setPreset(2));
document.getElementById("floodBtn").addEventListener("click", () => setPreset(3));

function setPreset(mode) {
 const presets = {
  1: { rainfall: 50, river_discharge: 200, humidity: 60, soil_moisture: 40 },
  2: { rainfall: 200, river_discharge: 600, humidity: 80, soil_moisture: 70 },
  3: { rainfall: 400, river_discharge: 900, humidity: 95, soil_moisture: 90 }
 };
 Object.entries(presets[mode]).forEach(([key, val]) => {
  const el = document.getElementById(key);
  if (el) { 
        el.value = val; 
        document.getElementById(`${key}_val`).textContent = val; 
    }
 });
 updateChartDisplay(); // MODIFIED: Calls the new chart-only function
}