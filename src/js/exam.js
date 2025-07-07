(() => {
let paginaActualE = 1;
const registrosPorPaginaE = 6; // Puedes ajustar este número

const BASE_URL = 'http://localhost:3000/api/examenes';

// =================== Cargar áreas ===================
async function loadAreas() {
  try {
    const response = await fetch(`${BASE_URL}/areas`);
    const data = await response.json();
    const select = document.getElementById('areaExamen');
    select.innerHTML = '';

    if (data.success) {
      data.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nombre;
        select.appendChild(option);
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las áreas.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error('Error al cargar áreas:', error);
  }
}

// =================== Cargar áreas para el modal de editar/ver examen ===================
async function cargarAreasEdit() {
  try {
    const response = await fetch('http://localhost:3000/api/examenes/areas');
    const data = await response.json();

    if (data.success) {
      const selectArea = document.getElementById('edit_areaExamen');
      selectArea.innerHTML = '';
      data.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nombre;
        selectArea.appendChild(option);
      });
    } else {
      console.error('Error al cargar las áreas para edición.');
    }
  } catch (error) {
    console.error('Error al cargar áreas para edición:', error);
  }
}


// =================== Obtener código por área seleccionada ===================
async function generarCodigoPorArea(id_area) {
  try {
    const response = await fetch(`${BASE_URL}/codigo/${id_area}`);
    const data = await response.json();

    if (data.success) {
      document.getElementById('codigoExamen').value = data.codigo;
    } else {
      document.getElementById('codigoExamen').value = '';
      console.error('Error al generar código para el área');
    }
  } catch (error) {
    console.error('Error al generar código para el área:', error);
  }
}

// =================== Cargar exámenes ===================
async function cargarExamenes() {
  try {
    const response = await fetch(`${BASE_URL}/examenes`);
    const data = await response.json();

    if (data.success) {
      const tableBody = document.getElementById('examTableBody');
      tableBody.innerHTML = '';

      data.exams.forEach(examen => {
  const fila = document.createElement('tr');
  fila.setAttribute('data-examenid', examen.id);
  fila.innerHTML = `
    <td class="text-sm text-center">${examen.nombre}</td>
    <td class="text-sm text-center">${examen.area}</td>
    <td class="text-sm text-center">${examen.precio}</td>
    <td class="text-sm text-center">${examen.codigo}</td>
    <td class="align-middle text-center">
<div class="dropdown"> 
  <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuButton${examen.id}" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="material-icons">more_vert</i>
  </a>
  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuButton${examen.id}">
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verExamen(${examen.id})">
        <i class="material-icons text-sm">visibility</i> Ver
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarExamen(${examen.id})">
        <i class="material-icons text-sm">edit</i> Editar
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="openParameters(${examen.id})">
        <i class="material-icons text-sm">tune</i> Parámetros
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-eliminar-examen" href="#" data-examenid="${examen.id}">
        <i class="material-icons text-sm">delete</i> Eliminar
      </a>
    </li>
  </ul>
</div>
</td>


  `;
  tableBody.appendChild(fila);
});

      aplicarFiltroYPaginarExamenes(); // ✅ Filtrar y paginar normalmente
    } else {
      console.error('Error al cargar los exámenes.');
    }
  } catch (err) {
    console.error('Error inesperado al cargar exámenes:', err);
  }
}

// =================== Redirigir a vista de parámetros ===================
function openParameters(idExamen) {
  console.log('[DEBUG][openParameters] idExamen:', idExamen);
  
  // Guardar el ID del examen seleccionado en sessionStorage para que esté disponible en parámetros
  sessionStorage.setItem('selectedExamId', idExamen);
  
  // Usar SPA: cargar la vista de parámetros dentro del main-content
  if (typeof window.loadView === 'function') {
    // Siempre usa el mismo nombre de vista que en el menú lateral
    window.loadView('parameter.html');
  } else {
    // Si no estamos en el contexto SPA, redirigir directamente
    window.location.href = `parameter.html?id_examen=${idExamen}`;
  }
}

// =================== Agregar nuevo examen ===================
document.getElementById('addExamForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const nombre = document.getElementById('nombreExamen').value;
  const area = document.getElementById('areaExamen').value;
  const precio = document.getElementById('precioExamen').value;
  const codigo = document.getElementById('codigoExamen').value;
  const indicaciones = document.getElementById('indicacionesExamen').value;

  const response = await fetch(`${BASE_URL}/examen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, id_area: area, precio, codigo, indicaciones })
  });

  const result = await response.json();

  if (result.success) {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Examen agregado correctamente.',
      customClass: { popup: 'swal-mover-derecha' }
    });
    cargarExamenes();
    document.getElementById('addExamForm').reset();
    document.getElementById('codigoExamen').value = '';
    const modal = bootstrap.Modal.getInstance(document.getElementById('addExamModal'));
    modal.hide();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al agregar el examen.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});


// =================== Ver examen ===================
async function verExamen(id) {
  try {
    await cargarAreasEdit(); // Cargar áreas para mostrar nombre

    const response = await fetch(`http://localhost:3000/api/examenes/${id}`);
    const data = await response.json();

    if (data.success) {
      const e = data.examen;

      document.getElementById('viewEditExamTitle').textContent = 'Información del examen';

      document.getElementById('edit_id_examen').value = e.id;
      document.getElementById('edit_nombreExamen').value = e.nombre;
      document.getElementById('edit_areaExamen').value = e.id_area;
      document.getElementById('edit_precioExamen').value = e.precio;
      document.getElementById('edit_codigoExamen').value = e.codigo;
      document.getElementById('edit_indicacionesExamen').value = e.indicaciones || '';

      document.querySelectorAll('#editExamForm input, #editExamForm select').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('btnGuardarCambiosExamContainer').style.display = 'none';

      new bootstrap.Modal(document.getElementById('viewEditExamModal')).show();
    } else {
      console.error('Examen no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar examen:', err);
  }
}

// =================== Editar examen ===================
async function editarExamen(id) {
  try {
    await cargarAreasEdit(); // Cargar opciones del select

    const response = await fetch(`http://localhost:3000/api/examenes/${id}`);
    const data = await response.json();

    if (data.success) {
      const e = data.examen;

      document.getElementById('viewEditExamTitle').textContent = 'Actualizar examen';

      document.getElementById('edit_id_examen').value = e.id;
      document.getElementById('edit_nombreExamen').value = e.nombre;
      document.getElementById('edit_areaExamen').value = e.id_area;
      document.getElementById('edit_areaExamen').setAttribute('data-original-area', e.id_area); // Guardar área original
      document.getElementById('edit_codigoExamen').value = e.codigo;
      document.getElementById('edit_codigoExamen').setAttribute('data-original-code', e.codigo); // ✅ Guardar código original
      document.getElementById('edit_precioExamen').value = e.precio;
      document.getElementById('edit_indicacionesExamen').value = e.indicaciones || '';

      document.querySelectorAll('#editExamForm input, #editExamForm select').forEach(el => el.removeAttribute('disabled'));
      document.getElementById('edit_codigoExamen').setAttribute('readonly', true); // Se actualiza automáticamente
      document.getElementById('btnGuardarCambiosExamContainer').style.display = 'block';

      new bootstrap.Modal(document.getElementById('viewEditExamModal')).show();
    } else {
      console.error('Examen no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar examen:', err);
  }
}

// =================== Detectar cambio de área y regenerar código ===================
document.getElementById('edit_areaExamen').addEventListener('change', async function () {
  const select = this;
  const originalArea = select.getAttribute('data-original-area');
  const originalCode = document.getElementById('edit_codigoExamen').getAttribute('data-original-code');
  const nuevaArea = select.value;

  if (nuevaArea === originalArea) {
    // ✅ Restaurar el código original inmediatamente si vuelve al área original
    document.getElementById('edit_codigoExamen').value = originalCode;
    return;
  }

  const confirmar = await Swal.fire({
    title: '¿Cambiar área?',
    text: 'Al cambiar el área se asignará un nuevo código al examen. ¿Deseas continuar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'No, mantener',
    customClass: { popup: 'swal-mover-derecha' }
  });

  if (confirmar.isConfirmed) {
    try {
      const response = await fetch(`http://localhost:3000/api/examenes/codigo/${nuevaArea}`);
      const data = await response.json();
      if (data.success) {
        document.getElementById('edit_codigoExamen').value = data.codigo;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar un nuevo código.',
          customClass: { popup: 'swal-mover-derecha' }
        });
      }
    } catch (err) {
      console.error('Error al generar nuevo código:', err);
    }
  } else {
    select.value = originalArea;
    document.getElementById('edit_codigoExamen').value = originalCode;
  }
});


// =================== Guardar cambios de examen ===================
document.getElementById('editExamForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('edit_id_examen').value;

  const datos = {
    nombre: document.getElementById('edit_nombreExamen').value,
    id_area: document.getElementById('edit_areaExamen').value,
    precio: document.getElementById('edit_precioExamen').value,
    codigo: document.getElementById('edit_codigoExamen').value,
    indicaciones: document.getElementById('edit_indicacionesExamen').value
  };

  try {
    const response = await fetch(`http://localhost:3000/api/examenes/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Examen actualizado correctamente.',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'swal-mover-derecha' }
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewEditExamModal'));
        modal.hide();
        cargarExamenes(); // 🔁 Refrescar tabla
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message || 'No se pudo actualizar el examen.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error('Error al actualizar el examen:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});
// =================== Eliminar examen con SweetAlert ===================
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-eliminar-examen')) {
    e.preventDefault();
    const examenId = e.target.getAttribute('data-examenid');

    const confirmacion = await Swal.fire({
      title: '¿Eliminar examen?',
      text: 'Esta acción no se puede deshacer.',
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
        const response = await fetch(`http://localhost:3000/api/examenes/delete/${examenId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          const fila = document.querySelector(`tr[data-examenid="${examenId}"]`);
          if (fila) fila.remove();

          await Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: result.message,
            customClass: { popup: 'swal-mover-derecha' }
          });

          // Si quieres recargar toda la tabla:
          // cargarExamenes();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'No se pudo eliminar el examen.',
            customClass: { popup: 'swal-mover-derecha' }
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al intentar eliminar el examen.',
          customClass: { popup: 'swal-mover-derecha' }
        });
      }
    }
  }
});

// =================== Filtrar y paginar  ===================
function aplicarFiltroYPaginarExamenes() {
  const filtro = document.getElementById('buscadorExamenes').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#examTableBody tr'));

  // Filtrar las filas según el nombre o área
  const filasFiltradas = filas.filter(fila => {
    const nombre = fila.children[0]?.textContent.toLowerCase() || '';
    const area = fila.children[1]?.textContent.toLowerCase() || '';
    return nombre.includes(filtro) || area.includes(filtro);
  });

  // Calcular total de páginas
  const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPaginaE);
  if (paginaActualE > totalPaginas) paginaActualE = 1;

  // Ocultar todas las filas
  filas.forEach(fila => fila.style.display = 'none');

  // Mostrar las correspondientes a la página actual
  const inicio = (paginaActualE - 1) * registrosPorPaginaE;
  const fin = inicio + registrosPorPaginaE;
  filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  // Generar paginación
  const contenedor = document.getElementById('paginacionExamenes');
  contenedor.innerHTML = '';

  const maxVisible = 3;
  let start = Math.max(1, paginaActualE - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (paginaActualE > 1) {
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '«';
    btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
    btnPrev.onclick = () => {
      paginaActualE--;
      aplicarFiltroYPaginarExamenes();
    };
    contenedor.appendChild(btnPrev);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm mx-1 ${i === paginaActualE ? 'btn-dark' : 'btn-outline-dark'}`;
    btn.textContent = i;
    btn.onclick = () => {
      paginaActualE = i;
      aplicarFiltroYPaginarExamenes();
    };
    contenedor.appendChild(btn);
  }

  if (paginaActualE < totalPaginas) {
    const btnNext = document.createElement('button');
    btnNext.textContent = '»';
    btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
    btnNext.onclick = () => {
      paginaActualE++;
      aplicarFiltroYPaginarExamenes();
    };
    contenedor.appendChild(btnNext);
  }
}

// Ejecutar al escribir en el buscador
document.getElementById('buscadorExamenes').addEventListener('input', aplicarFiltroYPaginarExamenes);



// =================== Inicialización ===================
  function initExam() {
    cargarExamenes();
    loadAreas();
    cargarAreasEdit();

    // Generar código automáticamente al seleccionar un área
    document.getElementById('areaExamen').addEventListener('change', function () {
      const id_area = this.value;
      if (id_area) {
        generarCodigoPorArea(id_area);
      }
    });
  }

  window.initExam = initExam; // Exporta la función initExam
  window.verExamen = verExamen; // Exporta la función verExamen
  window.editarExamen = editarExamen; // Exporta la función editarExamen
  window.openParameters = openParameters; // Exporta la función openParameters
})();