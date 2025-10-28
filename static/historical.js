// DOM Elements
const applyBtn = document.getElementById('apply-btn');
const resetBtn = document.getElementById('reset-btn');
const parameterSelect = document.getElementById('parameter');
const avgValue = document.getElementById('avg-value');
const maxValue = document.getElementById('max-value');
const minValue = document.getElementById('min-value');

let historicalChart;

// Generate Random Historical Data
function generateMockData(days = 30, parameter = 'rainfall') {
    const labels = [];
    const data = [];
    for (let i = days; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toISOString().split('T')[0]);

        let value;
        switch(parameter){
            case 'rainfall': value = Math.random() * 120; break;
            case 'river_discharge': value = Math.random() * 500; break;
            case 'water_level': value = Math.random() * 20; break;
            case 'soil_moisture': value = Math.random() * 70; break;
            case 'temperature': value = 10 + Math.random() * 35; break;
            case 'humidity': value = 30 + Math.random() * 60; break;
            case 'wind_speed': value = Math.random() * 25; break;
            case 'pressure': value = 900 + Math.random() * 120; break;
            default: value = Math.random() * 100;
        }
        data.push(parseFloat(value.toFixed(2)));
    }
    return { labels, data };
}

// Update Chart
function updateChart(parameter) {
    const { labels, data } = generateMockData(30, parameter);

    if (historicalChart) {
        historicalChart.data.labels = labels;
        historicalChart.data.datasets[0].data = data;
        historicalChart.data.datasets[0].label = parameter;
        historicalChart.update();
    } else {
        const ctx = document.getElementById('historicalChart').getContext('2d');
        historicalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: parameter,
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Update Summary Stats
    const sum = data.reduce((a,b)=>a+b,0);
    avgValue.innerText = (sum/data.length).toFixed(2);
    maxValue.innerText = Math.max(...data).toFixed(2);
    minValue.innerText = Math.min(...data).toFixed(2);
}

// Event Listeners
applyBtn.addEventListener('click', () => updateChart(parameterSelect.value));
resetBtn.addEventListener('click', () => {
    parameterSelect.value = 'rainfall';
    updateChart('rainfall');
});

// Initialize chart with default
updateChart('rainfall');
