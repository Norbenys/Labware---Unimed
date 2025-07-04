(function() {
// ================== Variables globales ==================
let validadosGlobal = [];
let paginaActual = 1;
const registrosPorPagina = 6;

// ================== Obtener validados ==================
async function cargarValidados() {
  try {
    const res = await fetch('/api/validados');
    const data = await res.json();

    if (!data.success) throw new Error('Error al obtener los validados.');

    validadosGlobal = data.validados;
    renderizarTabla(validadosGlobal);
    aplicarFiltroYPaginacion();
  } catch (err) {
    console.error('Error al cargar validados:', err);
    Swal.fire({ icon: 'error', text: 'No se pudieron cargar los exámenes validados.' });
  }
}

// ================== Renderizar tabla con acciones ==================
function renderizarTabla(lista) {
  const tbody = document.getElementById('validadosTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  lista.forEach(item => {
    const paciente = `${item.nombres} ${item.apellidos}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center">${item.id_orden}</td>
      <td class="text-center">${paciente}</td>
      <td class="text-center">${item.fecha.split('T')[0]}</td>
      <td class="text-center">${item.hora}</td>
      <td class="text-center">${item.examen}</td>
      <td class="align-middle text-center">
        <div class="dropdown">
          <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuValidar${item.id_orden_examen}" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="material-icons">more_vert</i>
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuValidar${item.id_orden_examen}">
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verResultados(${item.id_orden_examen}, ${item.id_orden})">
                <i class="material-icons text-sm">visibility</i> Visualizar
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2 text-success" href="#" onclick="validarExamen(${item.id_orden_examen})">
                <i class="material-icons text-sm">check_circle</i> Validar
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2 text-danger" href="#" onclick="devolverExamen(${item.id_orden_examen})">
                <i class="material-icons text-sm">undo</i> Devolver
              </a>
            </li>
          </ul>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function aplicarFiltroYPaginacion() {
  const filtro = document.getElementById('buscadorValidados').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#validadosTableBody tr'));

  const filasFiltradas = filas.filter(fila => {
    const paciente = fila.children[1]?.textContent.toLowerCase() || '';
    const examen = fila.children[4]?.textContent.toLowerCase() || '';
    return paciente.includes(filtro) || examen.includes(filtro);
  });

  const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPagina);
  if (paginaActual > totalPaginas) paginaActual = 1;

  filas.forEach(fila => fila.style.display = 'none');

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  const paginacion = document.getElementById('paginacionValidados');
  if (!paginacion) return;

  if (totalPaginas <= 1) {
    paginacion.innerHTML = '';
    paginacion.style.display = 'none';
    return;
  } else {
    paginacion.style.display = 'flex';
  }

  paginacion.innerHTML = '';

  const maxVisible = 3;
  let start = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (paginaActual > 1) {
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '«';
    btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
    btnPrev.onclick = () => {
      paginaActual--;
      aplicarFiltroYPaginacion();
    };
    paginacion.appendChild(btnPrev);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm mx-1 ${i === paginaActual ? 'btn-dark' : 'btn-outline-dark'}`;
    btn.textContent = i;
    btn.onclick = () => {
      paginaActual = i;
      aplicarFiltroYPaginacion();
    };
    paginacion.appendChild(btn);
  }

  if (paginaActual < totalPaginas) {
    const btnNext = document.createElement('button');
    btnNext.textContent = '»';
    btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
    btnNext.onclick = () => {
      paginaActual++;
      aplicarFiltroYPaginacion();
    };
    paginacion.appendChild(btnNext);
  }
}

// ================== Ver resultados ==================
async function verResultados(id_orden_examen, id_orden) {
  try {
    const res = await fetch(`/api/validados/resultados/${id_orden_examen}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const parametros = data.resultados;
    let html = '';

    for (const p of parametros) {
      const refMin = p.general_min ?? '';
      const refMax = p.general_max ?? '';
      const referencia = (refMin !== '' && refMax !== '') ? `${refMin} - ${refMax}` : '-';

      html += `
        <tr>
          <td class="text-center">${p.nombre_parametro}</td>
          <td class="text-center">${p.valor ?? '-'}</td>
          <td class="text-center">${p.unidad_medida ?? '-'}</td>
          <td class="text-center">
            <div class="d-flex align-items-center justify-content-center gap-1">
              <span class="text-muted">${referencia}</span>
              <button type="button" class="btn p-0 m-0 d-flex align-items-center justify-content-center"
                onclick='mostrarReferencias(${JSON.stringify(p)})' style="line-height: 1;">
                <i class="material-icons text-danger" style="font-size: 18px;">info</i>
              </button>
            </div>
          </td>
          <td class="text-center">${p.observacion ?? '-'}</td>
        </tr>
      `;
    }

    document.getElementById('tablaVerResultados').innerHTML = html;
    window.ordenActualValidacion = id_orden;
    new bootstrap.Modal(document.getElementById('modalVerResultados')).show();

  } catch (err) {
    console.error('❌ Error al ver resultados:', err);
    Swal.fire('Error', 'No se pudieron cargar los resultados', 'error');
  }
}

// ================== Validar examen ==================
async function validarExamen(id_orden_examen) {
  try {
    const res = await fetch(`/api/validados/validar/${id_orden_examen}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({ icon: 'success', text: 'Examen validado correctamente.' });
      cargarValidados();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('❌ Error al validar examen:', err);
    Swal.fire('Error', 'No se pudo validar el examen', 'error');
  }
}

// ================== Devolver examen ==================
async function devolverExamen(id_orden_examen) {
  try {
    const res = await fetch(`/api/validados/devolver/${id_orden_examen}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({ icon: 'success', text: 'Examen devuelto a análisis.' });
      cargarValidados();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('❌ Error al devolver examen:', err);
    Swal.fire('Error', 'No se pudo devolver el examen', 'error');
  }
}

// ================== Mostrar referencias ==================
function mostrarReferencias(p) {
  const refHTML = `
    <div class="card mb-0">
      <div class="card-body px-0 py-0">
        <div class="table-responsive">
          <table class="table table-hover align-items-center mb-0">
            <thead class="bg-light text-center">
              <tr><th>Grupo</th><th>Valor Min</th><th>Valor Max</th></tr>
            </thead>
            <tbody class="text-center">
              <tr><td><strong>General</strong></td><td>${p.general_min ?? '-'}</td><td>${p.general_max ?? '-'}</td></tr>
              <tr><td>Mujeres</td><td>${p.mujeres_min ?? '-'}</td><td>${p.mujeres_max ?? '-'}</td></tr>
              <tr><td>Hombres</td><td>${p.hombres_min ?? '-'}</td><td>${p.hombres_max ?? '-'}</td></tr>
              <tr><td>Niños</td><td>${p.ninos_min ?? '-'}</td><td>${p.ninos_max ?? '-'}</td></tr>
              <tr><td>Neonatos</td><td>${p.neonatos_min ?? '-'}</td><td>${p.neonatos_max ?? '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  var contRef = document.getElementById('contenidoReferencias');
  if (contRef) contRef.innerHTML = refHTML;

  const modal = new bootstrap.Modal(document.getElementById('modalReferencias'), {
    backdrop: true,
    focus: true
  });

  modal.show();

  setTimeout(() => {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length > 1) {
      backdrops[1].style.zIndex = '1055';
      document.getElementById('modalReferencias').style.zIndex = '1060';
    }
  }, 100);
}

// ================== SPA: Exportar funciones globales ==================
window.verResultados = verResultados;
window.validarExamen = validarExamen;
window.devolverExamen = devolverExamen;
window.mostrarReferencias = mostrarReferencias;

// ================== SPA: Inicialización de la vista validated ==================
function initValidated() {
  // Limpiar tabla y paginación
  const tbody = document.getElementById('validadosTableBody');
  if (tbody) tbody.innerHTML = '';
  const paginacion = document.getElementById('paginacionValidados');
  if (paginacion) paginacion.innerHTML = '';
  paginaActual = 1;
  cargarValidados();
  // Reiniciar buscador
  const buscador = document.getElementById('buscadorValidados');
  if (buscador) buscador.value = '';
}
window.initValidated = initValidated;

// ================== SPA: Eliminar inicialización automática si es SPA ==================
if (!window.isSPA) {
  document.addEventListener('DOMContentLoaded', () => {
    cargarValidados();
    const buscador = document.getElementById('buscadorValidados');
    if (buscador) {
      buscador.addEventListener('input', () => {
        paginaActual = 1;
        aplicarFiltroYPaginacion();
      });
    }
  });
}

})();
