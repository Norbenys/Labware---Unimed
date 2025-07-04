(() => {
let paginaActualParametros = 1;
const registrosPorPaginaParametros = 4;

// ======================= CONFIGURACIÓN =======================
const BASE_URL = 'http://localhost:3000/api/parametros';

// ======================= OBTENER ID DEL EXAMEN DESDE LA URL O HASH =======================
function getIdExamenFromUrl() {
  // 1. Intentar obtenerlo de la búsqueda (?id_examen=...)
  let params = new URLSearchParams(window.location.search);
  let id = params.get('id_examen');
  if (id) return id;
  // 2. Buscar en todo el hash (soporta cualquier formato)
  if (window.location.hash) {
    const hash = window.location.hash.substring(1); // quitar el #
    // Buscar id_examen=... en cualquier parte del hash
    const match = hash.match(/id_examen=([^&]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}


// =================== Inicialización ===================
function getIdExamen() {
  // Primero intenta obtener desde sessionStorage (SPA)
  const examIdFromStorage = sessionStorage.getItem('selectedExamId');
  if (examIdFromStorage) {
    return examIdFromStorage;
  }
  // Si no está disponible, intenta obtener desde window.selectedExamId (fallback)
  if (window.selectedExamId) return window.selectedExamId;
  // Finalmente, intenta obtener desde la URL
  return getIdExamenFromUrl();
}

function initParameter() {
  const idExamen = getIdExamen();
  if (idExamen) {
    // Hacer global el idExamen para que esté disponible en todo el contexto
    window.idExamen = idExamen;
    
    cargarParametros(idExamen);
    cargarCodigoExamen(idExamen);

    // Filtrar y paginar al escribir en el buscador
    const buscador = document.getElementById('buscadorParametros');
    if (buscador) {
      buscador.addEventListener('input', () => {
        if (typeof paginaActualParametros !== 'undefined') paginaActualParametros = 1;
        if (typeof aplicarFiltroYPaginarParametros === 'function') aplicarFiltroYPaginarParametros();
      });
    }
  } else {
    console.error('❌ No se recibió el id_examen');
  }
}

window.initParameter = initParameter;

// ======================= VOLVER =======================
function volverAExamenes() {
  // Limpiar el ID del examen del sessionStorage
  sessionStorage.removeItem('selectedExamId');
  
  // Usar SPA si está disponible, sino redirigir directamente
  if (typeof window.loadView === 'function') {
    window.loadView('exam.html');
  } else {
    window.location.href = '/exam.html'; // Redirige a la vista principal de exámenes
  }
}


// ======================= CARGAR PARÁMETROS =======================
async function cargarParametros(examId) {
  try {
    const response = await fetch(`${BASE_URL}/${examId}`);
    const data = await response.json();

    if (data.success) {
      const tableBody = document.getElementById('paramTableBody');
      tableBody.innerHTML = '';

      data.parametros.forEach(param => {
        const fila = document.createElement('tr');
        fila.setAttribute('data-paramid', param.id);
        fila.innerHTML = `
          <td class="text-sm text-center">${param.nombre}</td>
          <td class="text-sm text-center">${param.codigo}</td>
          <td class="text-sm text-center">${param.unidad_medida}</td>
          <td class="align-middle text-center">
            <div class="dropdown">
  <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuButtonParam${param.id}" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="material-icons">more_vert</i>
  </a>
  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuButtonParam${param.id}">
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verParametro(${param.id})">
        <i class="material-icons text-sm">visibility</i> Ver
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarParametro(${param.id})">
        <i class="material-icons text-sm">edit</i> Editar
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-eliminar-parametro" href="#" onclick="eliminarParametro(${param.id})">
        <i class="material-icons text-sm">delete</i> Eliminar
      </a>
    </li>
  </ul>
</div>
</td>

        `;
        tableBody.appendChild(fila);
      });

      if (typeof aplicarFiltroYPaginarParametros === 'function') {
        aplicarFiltroYPaginarParametros();
      }

    } else {
      console.error('❌ No se pudieron obtener los parámetros.');
    }
  } catch (err) {
    console.error('❌ Error inesperado al cargar parámetros:', err);
  }
}

// ======================= CARGAR CÓDIGO DE EXAMEN =======================
async function cargarCodigoExamen(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/examenes/${id}`);
    const data = await response.json();

    if (data.success) {
      const codigoExamen = data.examen.codigo;
      const inputCodigo = document.getElementById('codigoParametro');
      if (codigoExamen && inputCodigo) {
        const prefijo = codigoExamen.split(/\d+/)[0]; // Extraer letras
        inputCodigo.value = prefijo + '-';
      }
    } else {
      console.warn('⚠️ No se pudo obtener el código del examen');
    }
  } catch (error) {
    console.error('❌ Error al obtener código del examen:', error);
  }
}

// ======================= GUARDAR PARÁMETRO Y REFERENCIA JUNTOS =======================
document.getElementById('formAgregarParametro').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombre = document.getElementById('nombreParametro').value.trim();
  const codigo = document.getElementById('codigoParametro').value.trim();
  const unidad = document.getElementById('unidadParametro').value.trim();
  const tipo = document.getElementById('tipoResultado').value;
  const id_examen = window.idExamen || getIdExamen();

  const usarGenerales = document.getElementById('generalValues').checked;
  const generalMin = usarGenerales ? parseFloat(document.getElementById('generalMin').value) : null;
  const generalMax = usarGenerales ? parseFloat(document.getElementById('generalMax').value) : null;

  const usarDetallados = document.getElementById('detailedValues').checked;
  const mujeresMin = usarDetallados ? parseFloat(document.getElementById('mujeresMin').value) : null;
  const mujeresMax = usarDetallados ? parseFloat(document.getElementById('mujeresMax').value) : null;
  const hombresMin = usarDetallados ? parseFloat(document.getElementById('hombresMin').value) : null;
  const hombresMax = usarDetallados ? parseFloat(document.getElementById('hombresMax').value) : null;
  const ninosMin = usarDetallados ? parseFloat(document.getElementById('ninosMin').value) : null;
  const ninosMax = usarDetallados ? parseFloat(document.getElementById('ninosMax').value) : null;
  const neonatosMin = usarDetallados ? parseFloat(document.getElementById('neonatosMin').value) : null;
  const neonatosMax = usarDetallados ? parseFloat(document.getElementById('neonatosMax').value) : null;

  // ✅ Validar código único para este examen
  const parametrosActuales = document.querySelectorAll('#paramTableBody tr');
  for (let fila of parametrosActuales) {
    const codigoExistente = fila.children[1].textContent.trim();
    if (codigoExistente.toLowerCase() === codigo.toLowerCase()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Código duplicado',
        text: 'Ya existe un parámetro con este código. Por favor elige otro.'
      });
      return;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        codigo,
        unidad_medida: unidad,
        tipo_resultado: tipo,
        id_examen,
        referencias: {
          general_min: generalMin,
          general_max: generalMax,
          mujeres_min: mujeresMin,
          mujeres_max: mujeresMax,
          hombres_min: hombresMin,
          hombres_max: hombresMax,
          ninos_min: ninosMin,
          ninos_max: ninosMax,
          neonatos_min: neonatosMin,
          neonatos_max: neonatosMax
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: '✅ Parámetro guardado correctamente'
      });

      document.getElementById('formAgregarParametro').reset();
      toggleGeneralValues();
      toggleDetailedValues();
      cargarParametros(window.idExamen || getIdExamen());
      cargarCodigoExamen(window.idExamen || getIdExamen()); // Restaurar prefijo
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: '❌ Error al guardar el parámetro'
      });
    }

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: '❌ Ocurrió un error al guardar el parámetro.'
    });
  }
});


function toggleGeneralValues() {
  const container = document.getElementById('generalValuesContainer');
  container.style.display = document.getElementById('generalValues').checked ? 'flex' : 'none';
}

function toggleDetailedValues() {
  const container = document.getElementById('detailedValuesContainer');
  container.style.display = document.getElementById('detailedValues').checked ? 'block' : 'none';
}

// =================== Ver parámetro ===================
async function verParametro(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/parametros/parametro/${id}`);
    const data = await response.json();

    if (data.success) {
      const p = data.parametro;

      // Título del modal
      document.getElementById('viewEditParametroTitle').textContent = 'Información del parámetro';

      // Cargar datos
      document.getElementById('edit_id_parametro').value = p.id;
      document.getElementById('edit_nombreParametro').value = p.nombre;
      document.getElementById('edit_codigoParametro').value = p.codigo;
      document.getElementById('edit_unidadParametro').value = p.unidad_medida;
      document.getElementById('edit_tipoResultado').value = p.tipo_resultado;

      // Cargar referencias si existen
      if (p.referencia) {
        document.getElementById('edit_generalMin').value = p.referencia.general_min || '';
        document.getElementById('edit_generalMax').value = p.referencia.general_max || '';
        document.getElementById('edit_mujeresMin').value = p.referencia.mujeres_min || '';
        document.getElementById('edit_mujeresMax').value = p.referencia.mujeres_max || '';
        document.getElementById('edit_hombresMin').value = p.referencia.hombres_min || '';
        document.getElementById('edit_hombresMax').value = p.referencia.hombres_max || '';
        document.getElementById('edit_ninosMin').value = p.referencia.ninos_min || '';
        document.getElementById('edit_ninosMax').value = p.referencia.ninos_max || '';
        document.getElementById('edit_neonatosMin').value = p.referencia.neonatos_min || '';
        document.getElementById('edit_neonatosMax').value = p.referencia.neonatos_max || '';
      }

      // Deshabilitar campos
      document.querySelectorAll('#editParametroForm input, #editParametroForm select').forEach(el => el.setAttribute('disabled', true));

      // Ocultar botón de guardar
      document.getElementById('btnGuardarCambiosParametroContainer').style.display = 'none';

      new bootstrap.Modal(document.getElementById('viewEditParametroModal')).show();
    } else {
      console.error('❌ Parámetro no encontrado.');
    }
  } catch (err) {
    console.error('❌ Error al cargar parámetro:', err);
  }
}

// =================== Editar parámetro ===================
async function editarParametro(id) {
  try {
    const response = await fetch(`${BASE_URL}/parametro/${id}`);
    const data = await response.json();

    if (data.success) {
      const p = data.parametro;

      // Título del modal
      document.getElementById('viewEditParametroTitle').textContent = 'Editar parámetro';

      // Cargar campos
      document.getElementById('edit_id_parametro').value = p.id;
      document.getElementById('edit_nombreParametro').value = p.nombre;
      document.getElementById('edit_codigoParametro').value = p.codigo;
      document.getElementById('edit_unidadParametro').value = p.unidad_medida;
      document.getElementById('edit_tipoResultado').value = p.tipo_resultado;

      // Referencias
      if (p.referencia) {
        document.getElementById('edit_generalMin').value = p.referencia.general_min || '';
        document.getElementById('edit_generalMax').value = p.referencia.general_max || '';
        document.getElementById('edit_mujeresMin').value = p.referencia.mujeres_min || '';
        document.getElementById('edit_mujeresMax').value = p.referencia.mujeres_max || '';
        document.getElementById('edit_hombresMin').value = p.referencia.hombres_min || '';
        document.getElementById('edit_hombresMax').value = p.referencia.hombres_max || '';
        document.getElementById('edit_ninosMin').value = p.referencia.ninos_min || '';
        document.getElementById('edit_ninosMax').value = p.referencia.ninos_max || '';
        document.getElementById('edit_neonatosMin').value = p.referencia.neonatos_min || '';
        document.getElementById('edit_neonatosMax').value = p.referencia.neonatos_max || '';
      }

      // Habilitar campos
      document.querySelectorAll('#editParametroForm input, #editParametroForm select').forEach(el => el.removeAttribute('disabled'));

      // Mostrar botón guardar
      document.getElementById('btnGuardarCambiosParametroContainer').style.display = 'block';

      new bootstrap.Modal(document.getElementById('viewEditParametroModal')).show();
    } else {
      console.error('❌ Parámetro no encontrado.');
    }
  } catch (err) {
    console.error('❌ Error al cargar parámetro:', err);
  }
}

// ======================= GUARDAR CAMBIOS DE PARÁMETRO =======================
document.getElementById('editParametroForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('edit_id_parametro').value;
  const nombre = document.getElementById('edit_nombreParametro').value.trim();
  const codigo = document.getElementById('edit_codigoParametro').value.trim();
  const unidad = document.getElementById('edit_unidadParametro').value.trim();
  const tipo = document.getElementById('edit_tipoResultado').value;

  const generalMin = parseFloat(document.getElementById('edit_generalMin').value) || null;
  const generalMax = parseFloat(document.getElementById('edit_generalMax').value) || null;
  const mujeresMin = parseFloat(document.getElementById('edit_mujeresMin').value) || null;
  const mujeresMax = parseFloat(document.getElementById('edit_mujeresMax').value) || null;
  const hombresMin = parseFloat(document.getElementById('edit_hombresMin').value) || null;
  const hombresMax = parseFloat(document.getElementById('edit_hombresMax').value) || null;
  const ninosMin = parseFloat(document.getElementById('edit_ninosMin').value) || null;
  const ninosMax = parseFloat(document.getElementById('edit_ninosMax').value) || null;
  const neonatosMin = parseFloat(document.getElementById('edit_neonatosMin').value) || null;
  const neonatosMax = parseFloat(document.getElementById('edit_neonatosMax').value) || null;

  const datos = {
    nombre,
    codigo,
    unidad_medida: unidad,
    tipo_resultado: tipo,
    referencias: {
      general_min: generalMin,
      general_max: generalMax,
      mujeres_min: mujeresMin,
      mujeres_max: mujeresMax,
      hombres_min: hombresMin,
      hombres_max: hombresMax,
      ninos_min: ninosMin,
      ninos_max: ninosMax,
      neonatos_min: neonatosMin,
      neonatos_max: neonatosMax
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'El parámetro ha sido actualizado correctamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewEditParametroModal'));
        modal.hide();
        cargarParametros(window.idExamen || getIdExamen());
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message || 'No se pudo actualizar el parámetro.',
        confirmButtonText: 'Aceptar'
      });
    }
  } catch (error) {
    console.error('Error al actualizar el parámetro:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar'
    });
  }
});
// =================== Eliminar parámetro con SweetAlert ===================
document.addEventListener('click', async (e) => {
  const boton = e.target.closest('.btn-eliminar-parametro');
  if (!boton) return;

  e.preventDefault();
  const paramId = boton.getAttribute('data-paramid');

  // Confirmación visual con SweetAlert2
  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción eliminará el parámetro permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  });

  if (confirmacion.isConfirmed) {
    try {
      const response = await fetch(`http://localhost:3000/api/parametros/delete/${paramId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Eliminar la fila directamente
        const fila = document.querySelector(`tr[data-paramid="${paramId}"]`);
        if (fila) fila.remove();

        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: result.message
        });

        // Si deseas recargar toda la tabla:
        // cargarParametros(idExamen);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'No se pudo eliminar el parámetro.'
        });
      }
    } catch (err) {
      console.error('❌ Error al eliminar parámetro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema al intentar eliminar el parámetro.'
      });
    }
  }
});

function aplicarFiltroYPaginarParametros() { 
  const filtro = document.getElementById('buscadorParametros').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#paramTableBody tr'));

  // Filtrar por nombre o código
  const filasFiltradas = filas.filter(fila => {
    const nombre = fila.children[0]?.textContent.toLowerCase() || '';
    const codigo = fila.children[1]?.textContent.toLowerCase() || '';
    return nombre.includes(filtro) || codigo.includes(filtro);
  });

  // Calcular total de páginas
  const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPaginaParametros);
  if (paginaActualParametros > totalPaginas) paginaActualParametros = 1;

  // Ocultar todas
  filas.forEach(fila => fila.style.display = 'none');

  // Mostrar filas filtradas de la página actual
  const inicio = (paginaActualParametros - 1) * registrosPorPaginaParametros;
  const fin = inicio + registrosPorPaginaParametros;
  filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  // Generar paginación con flechas
  const contenedor = document.getElementById('paginacionParametros');
  contenedor.innerHTML = '';

  const maxVisible = 3;
  let start = Math.max(1, paginaActualParametros - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (paginaActualParametros > 1) {
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '«';
    btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
    btnPrev.onclick = () => {
      paginaActualParametros--;
      aplicarFiltroYPaginarParametros();
    };
    contenedor.appendChild(btnPrev);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm mx-1 ${i === paginaActualParametros ? 'btn-dark' : 'btn-outline-dark'}`;
    btn.textContent = i;
    btn.onclick = () => {
      paginaActualParametros = i;
      aplicarFiltroYPaginarParametros();
    };
    contenedor.appendChild(btn);
  }

  if (paginaActualParametros < totalPaginas) {
    const btnNext = document.createElement('button');
    btnNext.textContent = '»';
    btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
    btnNext.onclick = () => {
      paginaActualParametros++;
      aplicarFiltroYPaginarParametros();
    };
    contenedor.appendChild(btnNext);
  }
}
// Asegúrate de que esta función se ejecute al cargar la vista


 // =================== Inicialización ===================
  function initParameter() {
    const idExamen = getIdExamen();
    if (idExamen) {
      // Hacer global el idExamen para que esté disponible en todo el contexto
      window.idExamen = idExamen;
      
      cargarParametros(idExamen);
      cargarCodigoExamen(idExamen);

      // Filtrar y paginar al escribir en el buscador
      const buscador = document.getElementById('buscadorParametros');
      if (buscador) {
        buscador.addEventListener('input', () => {
          if (typeof paginaActualParametros !== 'undefined') paginaActualParametros = 1;
          if (typeof aplicarFiltroYPaginarParametros === 'function') aplicarFiltroYPaginarParametros();
        });
      }
    } else {
      console.error('❌ No se recibió el id_examen');
    }
  }

  window.initParameter = initParameter; // Exporta la función initParameter
  window.verParametro = verParametro; // Exporta la función verParametro
  window.editarParametro = editarParametro; // Exporta la función editarParametro
  window.volverAExamenes = volverAExamenes; // Exporta la función volverAExamenes
  
  // Función para eliminar parámetro (para compatibilidad con onclick)
  window.eliminarParametro = async function(id) {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el parámetro permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/parametros/delete/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // Eliminar la fila directamente
          const fila = document.querySelector(`tr[data-paramid="${id}"]`);
          if (fila) fila.remove();

          await Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: result.message
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'No se pudo eliminar el parámetro.'
          });
        }
      } catch (err) {
        console.error('❌ Error al eliminar parámetro:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al intentar eliminar el parámetro.'
        });
      }
    }
  };

  window.toggleGeneralValues = toggleGeneralValues;
  window.toggleDetailedValues = toggleDetailedValues;
})();


