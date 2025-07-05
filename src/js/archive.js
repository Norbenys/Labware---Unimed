(function() {
// ================== Variables globales ==================
let archivosGlobal = [];
let paginaActualArchivos = 1;
const registrosPorPaginaArchivos = 4;

// ================== Obtener archivos ==================
async function cargarArchivos() {
  try {
    const res = await fetch('/api/archivos');
    const data = await res.json();

    if (!data.success) throw new Error('Error al obtener los archivos.');

    archivosGlobal = data.archivos;
    renderizarTabla(archivosGlobal);
    aplicarFiltroYPaginacion();
  } catch (err) {
    console.error('Error al cargar archivos:', err);
    Swal.fire({ icon: 'error', text: 'No se pudieron cargar los exámenes archivados.' });
  }
}

function renderizarTabla(lista) {
  const tbody = document.getElementById('archivosTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  lista.forEach(item => { 
  const paciente = `${item.nombres} ${item.apellidos}`;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center">${item.id_orden}</td>
    <td class="text-center">${item.cedula}</td>
    <td class="text-center">${paciente}</td>
    <td class="text-center">${item.fecha.split('T')[0]}</td>
    <td class="text-center">${item.hora}</td>
    <td class="text-center">${item.examen}</td>
    <td class="text-center">
      <div class="dropdown">
        <a class="cursor-pointer text-secondary" id="dropdownOpciones${item.id_orden_examen}" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="material-icons">more_vert</i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownOpciones${item.id_orden_examen}">
          <li>
            <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verResultados(${item.id_orden_examen})">
              <i class="material-icons text-sm">visibility</i> Ver
            </a>
          </li>
        </ul>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
});

}

function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quita tildes
}

function aplicarFiltroYPaginacion() {
  const filtro = normalizar(document.getElementById('buscadorArchivos').value.trim());

  // Filtrar datos
  const filtrados = archivosGlobal.filter(item => {
    const cedula = normalizar(item.cedula?.toString() || '');
    const nombres = normalizar(item.nombres || '');
    const apellidos = normalizar(item.apellidos || '');
    const examen = normalizar(item.examen || '');
    const idOrden = normalizar(item.id_orden?.toString() || '');
    const fecha = normalizar(item.fecha?.split('T')[0] || '');
    const texto = `${cedula} ${nombres} ${apellidos} ${examen} ${idOrden} ${fecha}`;
    return texto.includes(filtro);
  });

  // Paginación
  const totalPaginas = Math.ceil(filtrados.length / registrosPorPaginaArchivos);
  if (paginaActualArchivos > totalPaginas) paginaActualArchivos = 1;

  const inicio = (paginaActualArchivos - 1) * registrosPorPaginaArchivos;
  const fin = inicio + registrosPorPaginaArchivos;
  const paginaActualData = filtrados.slice(inicio, fin);

  // Renderizar
  renderizarTabla(paginaActualData);

  // Crear paginación solo si hay más de una página
  const paginacion = document.getElementById('paginacionArchivos');
  if (!paginacion) return;
  paginacion.innerHTML = '';

  if (totalPaginas > 1) {
    const maxVisible = 3;
    let start = Math.max(1, paginaActualArchivos - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPaginas) {
      end = totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }

    if (paginaActualArchivos > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.textContent = '«';
      btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
      btnPrev.onclick = () => {
        paginaActualArchivos--;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnPrev);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm mx-1 ${i === paginaActualArchivos ? 'btn-dark' : 'btn-outline-dark'}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaActualArchivos = i;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btn);
    }

    if (paginaActualArchivos < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.textContent = '»';
      btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
      btnNext.onclick = () => {
        paginaActualArchivos++;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnNext);
    }
  }
}

document.getElementById('buscadorArchivos').addEventListener('input', () => {
  paginaActualArchivos = 1;
  aplicarFiltroYPaginacion();
});

// ================== Ver resultados validados ==================
async function verResultados(id_orden_examen, id_orden) {
  try {
    const res = await fetch(`/api/archivos/resultados/${id_orden_examen}`);
    const data = await res.json();

    if (!data.success || data.resultados.length === 0) {
      Swal.fire('Sin datos', 'No hay resultados disponibles para esta orden.', 'info');
      return;
    }

    const parametros = data.resultados;
    let html = '';

    for (const p of parametros) {
      const referencia = (p.general_min !== null && p.general_max !== null)
        ? `${p.general_min} - ${p.general_max}`
        : '-';

      html += `
        <tr>
          <td class="text-center">${p.nombre_parametro}</td>
          <td class="text-center">${p.valor ?? '-'}</td>
          <td class="text-center">${p.unidad_medida ?? '-'}</td>
          <td class="text-center">${referencia}</td>
          <td class="text-center">${p.observacion ?? '-'}</td>
        </tr>
      `;
    }

    document.getElementById('tablaVerResultadosArchivo').innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalVerResultadosArchivo')).show();
  } catch (error) {
    console.error('❌ Error al ver resultados archivados:', error);
    Swal.fire('Error', 'No se pudieron cargar los resultados.', 'error');
  }
}

// ================== SPA: Exportar funciones globales ==================
window.verResultados = verResultados;

// ================== SPA: Inicialización de la vista archive ==================
function initArchive() {
  // Limpiar tabla y paginación
  const tbody = document.getElementById('archivosTableBody');
  if (tbody) tbody.innerHTML = '';
  const paginacion = document.getElementById('paginacionArchivos');
  if (paginacion) paginacion.innerHTML = '';
  paginaActualArchivos = 1;
  cargarArchivos();
  // Reiniciar buscador
  const buscador = document.getElementById('buscadorArchivos');
  if (buscador) buscador.value = '';
}
window.initArchive = initArchive;

// ================== SPA: Eliminar inicialización automática si es SPA ==================
if (!window.isSPA) {
  document.addEventListener('DOMContentLoaded', () => {
    cargarArchivos();
    const buscador = document.getElementById('buscadorArchivos');
    if (buscador) {
      buscador.addEventListener('input', () => {
        paginaActualArchivos = 1;
        aplicarFiltroYPaginacion();
      });
    }
  });
}

})();
