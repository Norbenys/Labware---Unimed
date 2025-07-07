(() => {
let ordenesGlobal = [];
let paginaActualO = 1;
const registrosPorPaginaO = 6;

document.addEventListener('DOMContentLoaded', () => {
  cargarOrdenes();

  const buscador = document.getElementById('buscadorOrdenes');
  buscador.addEventListener('input', () => {
    paginaActual = 1;
    aplicarFiltroYPaginar();
  });
});

// =================== Cargar Órdenes ===================
async function cargarOrdenes() {
  try {
    const res = await fetch('/api/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await res.json();
    if (!data.success) throw new Error('Error en la respuesta del servidor.');

    ordenesGlobal = data.ordenes;
    renderizarOrdenes(ordenesGlobal);
    aplicarFiltroYPaginar();
  } catch (error) {
    console.error('Error al cargar órdenes:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las órdenes.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
}

function renderizarOrdenes(lista) {
  const tbody = document.getElementById('ordenesTableBody');
  tbody.innerHTML = '';

  lista.forEach(orden => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-ordenid', orden.id_orden);

    tr.innerHTML = `
      <td class="text-center">${orden.id_orden}</td>
      <td class="text-center">${orden.paciente}</td>
      <td class="text-center">${orden.fecha.split('T')[0]}</td>
      <td class="text-center">${orden.hora}</td>
      <td class="text-center">${orden.estado}</td>
      <td class="align-middle text-center">
    <div class="dropdown">
  <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuButton${orden.id_orden}" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="material-icons">more_vert</i>
  </a>
  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuButton${orden.id_orden}">
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verOrden(${orden.id_orden})">
        <i class="material-icons text-sm">visibility</i> Ver
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarOrden(${orden.id_orden})">
        <i class="material-icons text-sm">edit</i> Editar
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2 text-danger" href="#" onclick="eliminarOrden(${orden.id_orden})">
        <i class="material-icons text-sm">delete</i> Eliminar
      </a>
    </li>
  </ul>
</div>
</td>

    `;
    tbody.appendChild(tr);
  });
}

// =================== Ver estados de la orden ===================
async function cargarEstadosOrden() {
  try {
    const response = await fetch('/api/ordenes/estados');
    const data = await response.json();

    if (data.success) {
      const select = document.getElementById('orden_estado');
      select.innerHTML = ''; // Limpiar antes

      data.estados.forEach(est => {
        const option = document.createElement('option');
        option.value = est.nombre;
        option.textContent = est.nombre;
        select.appendChild(option);
      });
    } else {
      console.error('No se pudieron cargar los estados');
    }
  } catch (err) {
    console.error('Error al cargar estados:', err);
  }
}

// =================== Ver Orden ===================
async function verOrden(idOrden) {
  try {
    await cargarEstadosOrden();

    const response = await fetch(`/api/ordenes/${idOrden}`);
    const data = await response.json();

    if (data.success) {
      const o = data.orden;

      document.getElementById('ordenModalTitle').textContent = 'Detalle de la Orden';
      document.getElementById('orden_id').value = o.id_orden;
      document.getElementById('orden_paciente').value = o.paciente;
      document.getElementById('orden_fecha').value = o.fecha?.split('T')[0] || '';
      document.getElementById('orden_hora').value = o.hora;

      const estadoSelect = document.getElementById('orden_estado');
      Array.from(estadoSelect.options).forEach(opt => {
        opt.selected = opt.value.toLowerCase() === o.estado.toLowerCase();
      });

      document.querySelectorAll('#ordenForm input, #ordenForm select').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('btnGuardarOrdenContainer').style.display = 'none';

      new bootstrap.Modal(document.getElementById('verEditarOrdenModal')).show();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Orden no encontrada.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (err) {
    console.error('Error al cargar orden:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al consultar la orden.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
}
// =================== Editar Orden ===================

async function editarOrden(idOrden) {
  try {
    await cargarEstadosOrden(); // Cargar lista de estados al select

    const response = await fetch(`http://localhost:3000/api/ordenes/${idOrden}`);
    const data = await response.json();

    if (data.success) {
      const o = data.orden;

      document.getElementById('ordenModalTitle').textContent = 'Editar Orden';
      document.getElementById('orden_id').value = o.id_orden;
      document.getElementById('orden_paciente').value = o.paciente;
      document.getElementById('orden_fecha').value = o.fecha?.split('T')[0] || '';
      document.getElementById('orden_hora').value = o.hora;

      // Habilitar solo el campo estado
      document.querySelectorAll('#ordenForm input').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('orden_estado').removeAttribute('disabled');

      // Seleccionar el estado actual
      const estadoSelect = document.getElementById('orden_estado');
      Array.from(estadoSelect.options).forEach(opt => {
        opt.selected = opt.value.toLowerCase() === o.estado.toLowerCase();
      });

      // Mostrar botón guardar
      document.getElementById('btnGuardarOrdenContainer').style.display = 'block';

      // Asociar evento al botón
      document.getElementById('btnGuardarOrden').onclick = async () => {
        const nuevoEstado = estadoSelect.value;
        try {
          const res = await fetch(`http://localhost:3000/api/ordenes/update/${idOrden}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_estado: await obtenerIdEstadoPorNombre(nuevoEstado) })
          });

          const result = await res.json();
          if (result.success) {
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'Orden actualizada correctamente.',
              customClass: { popup: 'swal-mover-derecha' }
            });
            bootstrap.Modal.getInstance(document.getElementById('verEditarOrdenModal')).hide();
            cargarOrdenes();
          } else {
            throw new Error();
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la orden.',
            customClass: { popup: 'swal-mover-derecha' }
          });
        }
      };

      new bootstrap.Modal(document.getElementById('verEditarOrdenModal')).show();

    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Orden no encontrada.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }

  } catch (err) {
    console.error('Error al cargar orden para editar:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al consultar la orden.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
}


// =================== Guardar Orden ===================
document.getElementById('ordenForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('orden_id').value;
  const estado = document.getElementById('orden_estado').value;

  try {
    const response = await fetch(`/api/ordenes/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })  // solo enviamos el estado
    });

    const result = await response.json();

    if (result.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('verEditarOrdenModal'));
      modal.hide();

      const fila = document.querySelector(`tr[data-ordenid="${id}"]`);

      if (estado.toLowerCase() === 'análisis') {
        if (fila) fila.remove();
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'La orden fue movida correctamente.',
          confirmButtonText: 'Aceptar',
          customClass: { popup: 'swal-mover-derecha' }
        }).then(() => {
          // Recargar la vista de reportes automáticamente si existe la función SPA
          if (window.loadView) {
            window.loadView('report.html');
          }
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Orden actualizada correctamente.',
          confirmButtonText: 'Aceptar',
          customClass: { popup: 'swal-mover-derecha' }
        }).then(() => {
          cargarOrdenes(); // Solo recarga si no fue análisis
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message || 'No se pudo actualizar la orden.',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error('Error al actualizar la orden:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});


 // =================== Filtro y paginación ===================
  function aplicarFiltroYPaginar() {
    const filtro = document.getElementById('buscadorOrdenes').value.trim().toLowerCase();
    const filas = Array.from(document.querySelectorAll('#ordenesTableBody tr'));

    const filasFiltradas = filas.filter(fila => {
      const paciente = fila.children[1]?.textContent.toLowerCase() || '';
      return paciente.includes(filtro);
    });

    const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPaginaO);
    if (paginaActualO > totalPaginas) paginaActualO = 1;

    filas.forEach(fila => fila.style.display = 'none');

    const inicio = (paginaActualO - 1) * registrosPorPaginaO;
    const fin = inicio + registrosPorPaginaO;
    filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

    const paginacion = document.getElementById('paginacionOrdenes');
    if (!paginacion) return;

    // Asegura centrado visual
    paginacion.classList.add('text-center');
    paginacion.style.display = 'block';
    paginacion.style.justifyContent = '';

    if (totalPaginas <= 1) {
      paginacion.innerHTML = '';
      paginacion.style.display = 'none';
      return;
    } else {
      paginacion.style.display = 'block';
    }

    paginacion.innerHTML = '';

    const maxVisible = 3;
    let start = Math.max(1, paginaActualO - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPaginas) {
      end = totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }

    if (paginaActualO > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.textContent = '«';
      btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
      btnPrev.onclick = () => {
        paginaActualO--;
        aplicarFiltroYPaginar();
      };
      paginacion.appendChild(btnPrev);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm mx-1 ${i === paginaActualO ? 'btn-dark' : 'btn-outline-dark'}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaActualO = i;
        aplicarFiltroYPaginar();
      };
      paginacion.appendChild(btn);
    }

    if (paginaActualO < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.textContent = '»';
      btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
      btnNext.onclick = () => {
        paginaActualO++;
        aplicarFiltroYPaginar();
      };
      paginacion.appendChild(btnNext);
    }
  }

// =================== Eliminar  ===================
async function eliminarOrden(id) {
  const confirmacion = await Swal.fire({
    title: '¿Eliminar orden?',
    text: 'Esta acción eliminará la orden y los exámenes asociados.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    customClass: { popup: 'swal-mover-derecha' }
  });

  if (confirmacion.isConfirmed) {
    try {
      const response = await fetch(`http://localhost:3000/api/ordenes/delete/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        // ✅ Elimina la fila directamente si existe
        const fila = document.querySelector(`tr[data-ordenid="${id}"]`);
        if (fila) fila.remove();

        await Swal.fire('Eliminado', result.message, 'success');

        // O actualiza la tabla completa:
        // await cargarOrdenes();
      } else {
        Swal.fire('Error', result.message || 'No se pudo eliminar la orden.', 'error');
      }
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      Swal.fire('Error', 'Hubo un problema al intentar eliminar. Revisa la consola.', 'error');
    }
  }
}


  // =================== Inicialización de Órdenes ===================
  document.addEventListener('DOMContentLoaded', () => {
    initOrder();
  });

  function initOrder() {
    cargarOrdenes();
  }

  // =================== Reinicia Página Actual y Buscador ===================
  const buscador = document.getElementById('buscadorOrdenes');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActualO = 1;
      aplicarFiltroYPaginar();
    });
  }

  window.initOrder = initOrder; // Exporta solo la función que necesitas
  window.verOrden = verOrden;
  window.editarOrden = editarOrden;
  window.eliminarOrden = eliminarOrden;
})();
