// ===================== SISTEMA DE NOTIFICACIONES =====================

class NotificationManager {
  constructor() {
    this.notificationInterval = null;
    this.init();
  }

  init() {
    // Cargar notificaciones al iniciar
    this.cargarNotificaciones();
    
    // Actualizar cada 30 segundos
    this.notificationInterval = setInterval(() => {
      this.cargarNotificaciones();
    }, 30000);
  }

  async cargarNotificaciones() {
    try {
      console.log('🔄 Cargando notificaciones...');
      const response = await fetch('/api/ordenes/notificaciones');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 Datos de notificaciones recibidos:', data);

      if (data.success) {
        this.renderizarNotificaciones(data.notificaciones);
        this.actualizarContador(data.total);
        console.log('✅ Notificaciones actualizadas correctamente');
      } else {
        console.error('❌ Error al cargar notificaciones:', data.message);
      }
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      // En caso de error, mostrar mensaje de "No hay notificaciones"
      this.renderizarNotificaciones({ nuevas: 0, analisis: 0, validar: 0, entregar: 0 });
      this.actualizarContador(0);
    }
  }

  renderizarNotificaciones(notificaciones) {
    console.log('🎨 Renderizando notificaciones:', notificaciones);
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="dropdownMenuButton"]');
    if (!dropdownMenu) {
      console.warn('⚠️ No se encontró el dropdown menu de notificaciones');
      return;
    }

    // Limpiar contenido actual
    dropdownMenu.innerHTML = '';

    const notificacionesArray = [];

    // Crear array de notificaciones con cantidad > 0
    if (notificaciones.nuevas > 0) {
      notificacionesArray.push({
        tipo: 'Nuevas órdenes',
        cantidad: notificaciones.nuevas,
        icon: 'add_circle',
        color: 'bg-gradient-primary'
      });
    }

    if (notificaciones.analisis > 0) {
      notificacionesArray.push({
        tipo: 'Órdenes listas para análisis',
        cantidad: notificaciones.analisis,
        icon: 'science',
        color: 'bg-gradient-info'
      });
    }

    if (notificaciones.validar > 0) {
      notificacionesArray.push({
        tipo: 'Órdenes para validar',
        cantidad: notificaciones.validar,
        icon: 'verified',
        color: 'bg-gradient-warning'
      });
    }

    if (notificaciones.entregar > 0) {
      notificacionesArray.push({
        tipo: 'Órdenes pendientes por entregar',
        cantidad: notificaciones.entregar,
        icon: 'local_shipping',
        color: 'bg-gradient-success'
      });
    }

    // Si no hay notificaciones
    if (notificacionesArray.length === 0) {
      dropdownMenu.innerHTML = `
        <li class="mb-2">
          <div class="dropdown-item border-radius-md">
            <div class="d-flex py-1">
              <div class="avatar avatar-sm bg-gradient-secondary me-3 my-auto">
                <i class="material-symbols-rounded text-white">notifications_off</i>
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="text-sm font-weight-normal mb-1">
                  <span class="font-weight-bold">No hay notificaciones</span>
                </h6>
                <p class="text-xs text-secondary mb-0">
                  No hay órdenes pendientes
                </p>
              </div>
            </div>
          </div>
        </li>
      `;
      return;
    }

    // Renderizar cada notificación
    notificacionesArray.forEach((notif, index) => {
      const isLast = index === notificacionesArray.length - 1;
      dropdownMenu.innerHTML += `
        <li class="${isLast ? '' : 'mb-2'}">
          <div class="dropdown-item border-radius-md">
            <div class="d-flex py-1">
              <div class="avatar avatar-sm ${notif.color} me-3 my-auto">
                <i class="material-symbols-rounded text-white">${notif.icon}</i>
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="text-sm font-weight-normal mb-1">
                  <span class="font-weight-bold">${notif.cantidad}</span> ${notif.tipo}
                </h6>
                <p class="text-xs text-secondary mb-0">
                  <i class="fa fa-clock me-1"></i>
                  Recién actualizado
                </p>
              </div>
            </div>
          </div>
        </li>
      `;
    });
  }

  actualizarContador(total) {
    console.log('🔢 Actualizando contador:', total);
    const notificationButton = document.querySelector('#dropdownMenuButton');
    if (!notificationButton) {
      console.warn('⚠️ No se encontró el botón de notificaciones');
      return;
    }

    // Buscar o crear el badge
    let badge = notificationButton.querySelector('#notification-badge');
    
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'notification-badge';
      badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
      badge.style.fontSize = '0.6rem';
      badge.style.zIndex = '1000';
      notificationButton.appendChild(badge);
    }

    // Mostrar u ocultar el badge
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }

  // Método para limpiar el intervalo cuando se necesite
  destroy() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }
}

// Inicializar el sistema de notificaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔔 Inicializando sistema de notificaciones...');
  window.notificationManager = new NotificationManager();
  
  // Función de prueba para verificar que todo funciona
  window.testNotifications = () => {
    console.log('🧪 Probando sistema de notificaciones...');
    if (window.notificationManager) {
      window.notificationManager.cargarNotificaciones();
    } else {
      console.error('❌ NotificationManager no está disponible');
    }
  };
  
  // Ejecutar prueba después de 2 segundos
  setTimeout(() => {
    window.testNotifications();
  }, 2000);

  // Forzar el despliegue del dropdown de notificaciones en Electron
  // Esto soluciona problemas de Bootstrap en entornos no web puros

  const dropdownBtn = document.getElementById('dropdownMenuButton');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', function (e) {
      const menu = document.querySelector('.dropdown-menu[aria-labelledby="dropdownMenuButton"]');
      if (menu) {
        menu.classList.toggle('show');
      }
    });
  }
});

// Exportar para uso global si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
} 