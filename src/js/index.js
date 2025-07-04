// ==================== GRÁFICO DE EXÁMENES ====================
const ctx = document.getElementById('examChart').getContext('2d');

const examChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
    datasets: [{
      label: 'Exámenes',
      data: [35, 50, 70, 45, 25],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  }
});

