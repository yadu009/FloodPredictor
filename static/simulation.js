const rainfallSlider = document.getElementById('rainfall');
const rainfallVal = document.getElementById('rainfall-val');
const waterSlider = document.getElementById('water-level');
const waterVal = document.getElementById('water-level-val');
const applyBtn = document.getElementById('apply-btn');
const resetBtn = document.getElementById('reset-btn');

rainfallSlider.addEventListener('input', () => rainfallVal.textContent = rainfallSlider.value);
waterSlider.addEventListener('input', () => waterVal.textContent = waterSlider.value);

const ctx = document.getElementById('simulation-chart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Rainfall', 'Water Level'],
        datasets: [{
            label: 'Simulation Values',
            data: [rainfallSlider.value, waterSlider.value],
            backgroundColor: ['#1a73e8','#155ab6']
        }]
    },
    options: { responsive:true, animation:{duration:500} }
});

applyBtn.addEventListener('click', () => {
    chart.data.datasets[0].data = [rainfallSlider.value, waterSlider.value];
    chart.update();
});

resetBtn.addEventListener('click', () => {
    rainfallSlider.value = 50;
    rainfallVal.textContent = 50;
    waterSlider.value = 5;
    waterVal.textContent = 5;
    chart.data.datasets[0].data = [50,5];
    chart.update();
});
