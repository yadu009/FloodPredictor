// ---- Map ----
var map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

// Simulated regions with flood risk
var regions = [
    {name:"Delhi", coords:[28.6139,77.2090], risk:"high"},
    {name:"Mumbai", coords:[19.0760,72.8777], risk:"medium"},
    {name:"Chennai", coords:[13.0827,80.2707], risk:"low"}
];

var markers = [];
regions.forEach(r => {
    var color = r.risk=="high"?"red": r.risk=="medium"?"orange":"green";
    var marker = L.circle(r.coords, {radius:50000, color:color, fillOpacity:0.3})
        .bindPopup(r.name + " | Risk: " + r.risk);
    marker.addTo(map);
    markers.push(marker);
});

// ---- Charts ----
function createChart(ctxId, label, data, color) {
    var ctx = document.getElementById(ctxId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun'],
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color.replace("1)", "0.2)"),
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });
}

var rainfallChart = createChart('rainfallChart','Rainfall (mm)',[50,70,60,90,120,80],'rgba(0,123,255,1)');
var waterChart = createChart('waterLevelChart','Water Level (m)',[3,4,5,7,6,4],'rgba(40,167,69,1)');
var soilChart = createChart('soilMoistureChart','Soil Moisture (%)',[30,40,50,45,60,55],'rgba(255,193,7,1)');

// ---- Metrics & Alerts ----
function updateDashboard() {
    document.getElementById('rainfallMetric').innerText = (Math.random()*200).toFixed(2) + " mm";
    document.getElementById('waterLevelMetric').innerText = (Math.random()*15).toFixed(2) + " m";
    document.getElementById('popDensityMetric').innerText = (Math.random()*2000).toFixed(0);
    document.getElementById('floodRiskMetric').innerText = (Math.random()*100).toFixed(1);

    var alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';
    var alertCount = Math.floor(Math.random()*5)+1;
    for (var i=0;i<alertCount;i++){
        var li = document.createElement('li');
        var severity = ["Low","Medium","High"][Math.floor(Math.random()*3)];
        li.innerHTML = `<strong>${severity}:</strong> Flood risk alert in Region ${i+1}`;
        alertsList.appendChild(li);
    }
}

document.getElementById('applyFilter').addEventListener('click', ()=>{
    var level = document.getElementById('riskLevel').value;
    markers.forEach(m=>{
        if(level=="all") m.addTo(map);
        else if(m.options.color== (level=="high"?"red": level=="medium"?"orange":"green")) m.addTo(map);
        else map.removeLayer(m);
    });
});

setInterval(updateDashboard, 4000);
updateDashboard();
