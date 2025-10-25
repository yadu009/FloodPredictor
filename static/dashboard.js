const ctx = document.getElementById('riskChart').getContext('2d');
const riskChart = new Chart(ctx, {
    type:'pie',
    data:{
        labels:['High Risk','Moderate Risk','Low Risk'],
        datasets:[{data:[15,45,60],backgroundColor:['#e53935','#fb8c00','#43a047'] }]
    },
    options:{responsive:true}
});
