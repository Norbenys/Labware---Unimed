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
    document.getElementById('ordenesHoy').textContent = stats.stats.ordenesHoy;
    document.getElementById('ordenesHoyPorcentaje').textContent = '+12%';
    document.getElementById('ordenesAnalisis').textContent = stats.stats.ordenesAnalisis;
    document.getElementById('ordenesAnalisisPorcentaje').textContent = '+8%';
    document.getElementById('ordenesValidadas').textContent = stats.stats.ordenesValidadas;
    document.getElementById('ordenesValidadasPorcentaje').textContent = '+15%';
    document.getElementById('ordenesEntregadas').textContent = stats.stats.ordenesEntregadas;
    document.getElementById('ordenesEntregadasPorcentaje').textContent = '+20%';

    // 2. Obtener órdenes recientes
    const ordenesResponse = await fetch('/api/dashboard/ordenes-recientes');
    if (!ordenesResponse.ok) {
      throw new Error('Error al obtener órdenes recientes');
    }
    const ordenesData = await ordenesResponse.json();

    if (!ordenesData.success) {
      throw new Error(ordenesData.message || 'Error en las órdenes recientes');
    }

    // Llenar tabla de órdenes recientes
    document.getElementById('ordenesRecientesCantidad').textContent = ordenesData.ordenes.length;
    const tbody = document.getElementById('tablaOrdenesRecientes');
    tbody.innerHTML = '';
    
    ordenesData.ordenes.slice(0, 5).forEach(orden => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${orden.id_orden}</td>
        <td>${orden.paciente}</td>
        <td class="text-center">
          <span class="badge bg-gradient-${getBadgeColor(orden.estado)}">${orden.estado}</span>
        </td>
        <td class="text-center">${formatDate(orden.fecha)}</td>
      `;
      tbody.appendChild(tr);
    });

    // 3. Obtener exámenes pendientes
    const examenesResponse = await fetch('/api/dashboard/examenes-pendientes');
    if (!examenesResponse.ok) {
      throw new Error('Error al obtener exámenes pendientes');
    }
    const examenesData = await examenesResponse.json();

    if (!examenesData.success) {
      throw new Error(examenesData.message || 'Error en los exámenes pendientes');
    }

    // Llenar timeline con exámenes pendientes
    const timelineDiv = document.getElementById('timelineActividad');
    timelineDiv.innerHTML = '';
    
    examenesData.examenes.slice(0, 4).forEach((examen, index) => {
      const timelineItem = `
        <div class="timeline-block mb-3">
          <span class="timeline-step">
            <i class="material-symbols-rounded text-info text-gradient">science</i>
          </span>
          <div class="timeline-content">
            <h6 class="text-dark text-sm font-weight-bold mb-0">${examen.examen} - ${examen.paciente}</h6>
            <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">${formatDate(examen.fecha)}</p>
          </div>
        </div>
      `;
      timelineDiv.innerHTML += timelineItem;
    });

    document.getElementById('actividadPorcentaje').textContent = '85%';

    // 4. Crear gráficas con Chart.js
    if (window.Chart) {
      // Gráfica de órdenes por estado
      const ordenesPorEstado = stats.stats.ordenesPorEstado;
      new Chart(document.getElementById('chart-ordenes-estado'), {
        type: 'doughnut',
        data: {
          labels: ordenesPorEstado.map(item => item.estado),
          datasets: [{
            data: ordenesPorEstado.map(item => item.cantidad),
            backgroundColor: ['#fbcf33', '#17c1e8', '#4CAF50', '#FFA726', '#e91e63'],
          }]
        },
        options: { 
          responsive: true, 
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      // Gráfica de órdenes por día
      const ordenesUltimos7Dias = stats.stats.ordenesUltimos7Dias;
      new Chart(document.getElementById('chart-ordenes-dia'), {
        type: 'line',
        data: {
          labels: ordenesUltimos7Dias.map(item => formatDate(item.fecha)),
          datasets: [{
            label: 'Órdenes',
            data: ordenesUltimos7Dias.map(item => item.cantidad),
            borderColor: '#17c1e8',
            backgroundColor: 'rgba(23,193,232,0.2)',
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
      new Chart(document.getElementById('chart-pacientes'), {
        type: 'bar',
        data: {
          labels: examenesPopulares.map(item => item.examen),
          datasets: [{
            label: 'Solicitudes',
            data: examenesPopulares.map(item => item.cantidad),
            backgroundColor: '#4CAF50',
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
