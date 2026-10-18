// Chart.js helper for real-time WPM trajectory and visual analytics

let speedChartInstance = null;

window.renderSpeedChart = function(timelineData) {
  const canvas = document.getElementById('resultsSpeedChart');
  if (!canvas) return;

  if (speedChartInstance) {
    speedChartInstance.destroy();
  }

  if (!timelineData || timelineData.length === 0) {
    timelineData = [
      { time: 1, wpm: 20 },
      { time: 2, wpm: 35 },
      { time: 3, wpm: 42 }
    ];
  }

  const labels = timelineData.map(d => `${d.time}s`);
  const dataPoints = timelineData.map(d => d.wpm);

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

  speedChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'WPM',
        data: dataPoints,
        borderColor: '#06b6d4',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#06b6d4',
        pointRadius: dataPoints.length > 20 ? 1 : 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#94a3b8',
          bodyColor: '#38bdf8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Speed: ${context.parsed.y} WPM`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    }
  });
};
