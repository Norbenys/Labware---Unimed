console.log('DASHBOARD.JS CARGADO');

async function initDashboard() {
  try {
    console.log('🚀 Iniciando dashboard...');

    // 1. Obtener estadísticas generales del dashboard
    const statsResponse = await fetch('/api/dashboard/stats');
    if (!statsResponse.ok) {
      throw new Error('Error al obtener estadísticas del dashboard');
    }
    const stats = await statsResponse.json();

    if (!stats.success) {
      throw new Error(stats.message || 'Error en las estadísticas');
    }

    // Llenar tarjetas de resumen
    const elOrdenesHoy = document.getElementById('ordenesHoy');
    if (elOrdenesHoy) elOrdenesHoy.textContent = stats.stats.ordenesHoy;
    const elOrdenesHoyPorcentaje = document.getElementById('ordenesHoyPorcentaje');
    if (elOrdenesHoyPorcentaje) elOrdenesHoyPorcentaje.textContent = '+12%';
    const elOrdenesAnalisis = document.getElementById('ordenesAnalisis');
    if (elOrdenesAnalisis) elOrdenesAnalisis.textContent = stats.stats.ordenesAnalisis;
    const elOrdenesAnalisisPorcentaje = document.getElementById('ordenesAnalisisPorcentaje');
    if (elOrdenesAnalisisPorcentaje) elOrdenesAnalisisPorcentaje.textContent = '+8%';
    const elOrdenesValidadas = document.getElementById('ordenesValidadas');
    if (elOrdenesValidadas) elOrdenesValidadas.textContent = stats.stats.ordenesValidadas;
    const elOrdenesValidadasPorcentaje = document.getElementById('ordenesValidadasPorcentaje');
    if (elOrdenesValidadasPorcentaje) elOrdenesValidadasPorcentaje.textContent = '+15%';
    const elOrdenesEntregadas = document.getElementById('ordenesEntregadas');
    if (elOrdenesEntregadas) elOrdenesEntregadas.textContent = stats.stats.ordenesEntregadas;
    const elOrdenesEntregadasPorcentaje = document.getElementById('ordenesEntregadasPorcentaje');
    if (elOrdenesEntregadasPorcentaje) elOrdenesEntregadasPorcentaje.textContent = '+20%';

    // 2. Crear gráficas con Chart.js
    if (window.Chart) {
      // Gráfica de órdenes por estado
      const ordenesPorEstado = stats.stats.ordenesPorEstado;
      console.log('Estados recibidos:', ordenesPorEstado.map(e => e.estado));
      // Mapeo de colores por estado (arcoíris, bien diferenciados)
      const estadoColorMap = {
        'Pendiente de pago': '#FF6B6B',      // rojo
        'Pendiente de muestra': '#FFA94D',   // naranja
        'Lista para análisis': '#FFD93D',    // amarillo
        'En análisis': '#6BCB77',            // verde
        'Pendiente de validación': '#4D96FF',// azul
        'Validada': '#A66CFF',               // violeta
        'Pendiente por entrega': '#38BDF8',  // turquesa
        'Entregada': '#22C55E',              // verde pasto
        'Anulada': '#A0AEC0',                // gris
        'Otro': '#BDBDBD'                    // gris claro para cualquier otro
      };
      window.chartOrdenesEstado = new Chart(document.getElementById('chart-ordenes-estado'), {
        type: 'doughnut',
        data: {
          labels: ordenesPorEstado.map(item => item.estado),
          datasets: [{
            data: ordenesPorEstado.map(item => item.cantidad),
            backgroundColor: ordenesPorEstado.map(item => estadoColorMap[item.estado] || estadoColorMap['Otro']),
            borderWidth: 0
          }]
        },
        options: { 
          responsive: true, 
          cutout: '70%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });

      // Gráfica de órdenes por día
      const ordenesUltimos7Dias = stats.stats.ordenesUltimos7Dias;
      window.chartOrdenesDia = new Chart(document.getElementById('chart-ordenes-dia'), {
        type: 'line',
        data: {
          labels: ordenesUltimos7Dias.map(item => formatDate(item.fecha)),
          datasets: [{
            label: 'Órdenes',
            data: ordenesUltimos7Dias.map(item => item.cantidad),
            borderColor: '#4D96FF',
            backgroundColor: 'rgba(77,150,255,0.2)',
            tension: 0.4,
            fill: true
          }]
        },
        options: { 
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });

      // Gráfica de exámenes más solicitados
      const examenesPopulares = stats.stats.examenesPopulares;
      window.chartPacientes = new Chart(document.getElementById('chart-pacientes'), {
        type: 'bar',
        data: {
          labels: examenesPopulares.map(item => item.codigo),
          datasets: [{
            label: 'Solicitudes',
            data: examenesPopulares.map(item => item.cantidad),
            backgroundColor: '#4D96FF',
          }]
        },
        options: { 
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(context) {
                  const idx = context[0].dataIndex;
                  return examenesPopulares[idx].examen;
                },
                label: function(context) {
                  return `Solicitudes: ${context.parsed.y}`;
                }
              }
            }
          }
        }
      });
    }

    console.log('✅ Dashboard cargado exitosamente');

  } catch (error) {
    console.error('❌ Error al cargar dashboard:', error);
    // Mostrar mensaje de error en el dashboard
    const errorMessage = `
      <div class="alert alert-danger" role="alert">
        <strong>Error al cargar el dashboard:</strong> ${error.message}
        <br><small>Verifica que el servidor esté funcionando y los endpoints estén disponibles.</small>
      </div>
    `;
    // Insertar mensaje de error en el dashboard
    const dashboardContent = document.querySelector('.container-fluid');
    if (dashboardContent) {
      dashboardContent.innerHTML = errorMessage + dashboardContent.innerHTML;
    }
  }
}

// Función auxiliar para obtener color del badge según estado
function getBadgeColor(estado) {
  const estados = {
    'Pendiente': 'warning',
    'En análisis': 'info',
    'Validada': 'success',
    'Entregada': 'secondary',
    'Remitida': 'primary'
  };
  return estados[estado] || 'secondary';
}

// Función auxiliar para formatear fecha
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Exportar función para uso global
window.initDashboard = initDashboard;

// Redibujar los gráficos después de que la ventana termine de cargar (por el zoom de Electron)
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.chartOrdenesEstado) {
      window.chartOrdenesEstado.resize();
      window.chartOrdenesEstado.update();
    }
    if (window.chartOrdenesDia) {
      window.chartOrdenesDia.resize();
      window.chartOrdenesDia.update();
    }
    if (window.chartPacientes) {
      window.chartPacientes.resize();
      window.chartPacientes.update();
    }
  }, 300); // 300 ms de retraso para asegurar que el layout esté listo
});

// Mostrar mensaje de bienvenida personalizado
console.log('PRUEBA DASHBOARD');
window.addEventListener('DOMContentLoaded', async () => {
  let usuario = null;
  if (window.require) {
    const { ipcRenderer } = window.require('electron');
    usuario = await ipcRenderer.invoke('get-usuario');
    console.log('Usuario recibido por IPC:', usuario);
  } else {
    usuario = JSON.parse(sessionStorage.getItem('usuario'));
    console.log('Usuario en sessionStorage:', usuario);
  }
  if (usuario && usuario.nombre && usuario.apellido) {
    document.getElementById('bienvenida').innerText = `¡Bienvenido! ${usuario.nombre} ${usuario.apellido}`;
    document.getElementById('bienvenida-desc').innerText = 'Panel de control del laboratorio clínico.';
    console.log('Mensaje de bienvenida mostrado.');
  } else {
    document.getElementById('bienvenida').innerText = '¡Bienvenido!';
    document.getElementById('bienvenida-desc').innerText = 'Panel de control del laboratorio clínico.';
    console.log('Mensaje de bienvenida genérico mostrado.');
  }
});
