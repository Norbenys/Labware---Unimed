(function() {
// ================== Variables globales ==================
let reportesGlobal = [];
let paginaActualReport = 1;
const registrosPorPaginaReport = 6;

// ================== Evento al iniciar ==================
document.addEventListener('DOMContentLoaded', () => {
  cargarReportes();

  const buscador = document.getElementById('buscadorReportes');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActualReport = 1;
      aplicarFiltroYPaginacion();
    });
  }
});

// ================== Obtener reportes desde backend ==================
async function cargarReportes() {
  try {
    const res = await fetch('/api/reportes');
    const data = await res.json();

    if (!data.success) throw new Error('Error al obtener los reportes.');

    reportesGlobal = data.reportes;
    console.log('Reportes cargados:', reportesGlobal);
    renderizarTabla(reportesGlobal);
    aplicarFiltroYPaginacion();
  } catch (err) {
    console.error('Error al cargar reportes:', err);
    Swal.fire({ icon: 'error', text: 'No se pudieron cargar los reportes.' });
  }
}

// ================== Renderizar tabla con botón de reportar ==================
function renderizarTabla(lista) {
  const tbody = document.getElementById('reportesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

 lista.forEach(item => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center">${item.id_orden}</td>
    <td class="text-center">${item.paciente}</td>
    <td class="text-center">${item.fecha.split('T')[0]}</td>
    <td class="text-center">${item.hora}</td>
    <td class="text-center">${item.examen}</td>
    <td class="align-middle text-center">
      <div class="dropdown">
        <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuAnalizar${item.id_orden_examen}" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="material-icons">more_vert</i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuAnalizar${item.id_orden_examen}">
          <li>
            <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="analizarExamen(${item.id_orden_examen})">
              <i class="material-icons text-sm">edit</i> Reportar
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
  const filtro = normalizar(document.getElementById('buscadorReportes').value.trim());

  // Filtrar datos
  const filtrados = reportesGlobal.filter(item => {
    const cedula = normalizar(item.cedula?.toString() || '');
    const paciente = normalizar(item.paciente || '');
    const examen = normalizar(item.examen || '');
    const idOrden = normalizar(item.id_orden?.toString() || '');
    const fecha = normalizar(item.fecha?.split('T')[0] || '');
    const texto = `${cedula} ${paciente} ${examen} ${idOrden} ${fecha}`;
    return texto.includes(filtro);
  });

  // Paginación
  const totalPaginas = Math.ceil(filtrados.length / registrosPorPaginaReport);
  if (paginaActualReport > totalPaginas) paginaActualReport = 1;

  const inicio = (paginaActualReport - 1) * registrosPorPaginaReport;
  const fin = inicio + registrosPorPaginaReport;
  const paginaActualData = filtrados.slice(inicio, fin);

  // Renderizar
  renderizarTabla(paginaActualData);

  // Crear paginación solo si hay más de una página
  const paginacion = document.getElementById('paginacionReportes');
  if (!paginacion) return;
  paginacion.innerHTML = '';

  if (totalPaginas > 1) {
    const maxVisible = 3;
    let start = Math.max(1, paginaActualReport - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPaginas) {
      end = totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }

    if (paginaActualReport > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.textContent = '«';
      btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
      btnPrev.onclick = () => {
        paginaActualReport--;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnPrev);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm mx-1 ${i === paginaActualReport ? 'btn-dark' : 'btn-outline-dark'}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaActualReport = i;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btn);
    }

    if (paginaActualReport < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.textContent = '»';
      btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
      btnNext.onclick = () => {
        paginaActualReport++;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnNext);
    }
  }
}

document.getElementById('buscadorReportes').addEventListener('input', () => {
  paginaActualReport = 1;
  aplicarFiltroYPaginacion();
});

// ================== Analizar examen ==================
async function analizarExamen(id_orden_examen) {
  try {
    const res = await fetch(`/api/reportes/parametros/${id_orden_examen}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const examen = data.examen;
    const parametros = data.parametros;

    let html = '';

    for (const p of parametros) {
      const inputId = `res-${id_orden_examen}-${p.id_parametro}`;
      const obsId = `obs-${id_orden_examen}-${p.id_parametro}`;
      const refMin = p.general_min ?? '';
      const refMax = p.general_max ?? '';
      const unidad = p.unidad_medida || '';
      const referencia = (refMin !== '' && refMax !== '') ? `${refMin} - ${refMax}` : '-';

      html += `
        <tr>
          <td class="text-center">${p.nombre_parametro}</td>
          <td class="text-center">
            <input type="text" class="form-control form-control-sm text-center resultado-input"
              id="${inputId}" data-min="${refMin}" data-max="${refMax}" placeholder="..." />
          </td>
          <td class="text-center">${unidad}</td>
          <td class="text-center">
            <div class="d-flex align-items-center justify-content-center gap-1">
              <span class="text-muted">${referencia}</span>
              <button type="button" class="btn p-0 m-0 d-flex align-items-center justify-content-center"
                onclick='mostrarReferencias(${JSON.stringify(p)})' style="line-height: 1;">
                <i class="material-icons text-danger" style="font-size: 18px;">info</i>
              </button>
            </div>
          </td>
          <td class="text-center">
            <input type="text" class="form-control form-control-sm text-center"
              id="${obsId}" placeholder="..." />
          </td>
        </tr>
      `;
    }

    document.getElementById('tablaResultados').innerHTML = html;
    window.resultadosPendientes = [{ id_orden_examen, examen, parametros }];
    new bootstrap.Modal(document.getElementById('modalReportar')).show();

  } catch (err) {
    console.error('❌ Error al analizar examen:', err);
    Swal.fire('Error', 'No se pudo cargar el examen', 'error');
  }
}

// ================== Guardar resultados ==================
async function guardarResultados() {
  const resultados = [];
  let camposIncompletos = false;

  window.resultadosPendientes.forEach(examen => {
    examen.parametros.forEach(p => {
      const inputId = `res-${examen.id_orden_examen}-${p.id_parametro}`;
      const obsId = `obs-${examen.id_orden_examen}-${p.id_parametro}`;
      const valor = document.getElementById(inputId)?.value.trim();
      const observacion = document.getElementById(obsId)?.value.trim();

      if (valor) {
        resultados.push({
          id_orden_examen: examen.id_orden_examen,
          id_parametro: p.id_parametro,
          valor: valor,
          observacion: observacion || null
        });
      } else {
        camposIncompletos = true;
      }
    });
  });

  if (resultados.length === 0) {
    return Swal.fire({
      icon: 'warning',
      title: '¡Sin resultados!',
      text: 'Debes ingresar al menos un resultado para poder continuar.',
      confirmButtonColor: '#1e1e1e'
    });
  }

  if (camposIncompletos) {
    await Swal.fire({
      icon: 'info',
      title: 'Campos incompletos',
      text: 'Has dejado algunos campos vacíos. Solo se guardarán los resultados completados.',
      timer: 3000,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  }

  try {
    const res = await fetch('/api/reportes/guardarResultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultados })
    });

    const data = await res.json();

    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('modalReportar')).hide();
      await Swal.fire({
        icon: 'success',
        title: '¡Guardado con éxito!',
        text: 'Los resultados fueron enviados a validación correctamente.',
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true
      });
      cargarReportes();
    } else {
      throw new Error(data.message);
    }

  } catch (err) {
    console.error('❌ Error al guardar resultados:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: 'No se pudieron guardar los resultados. Intenta nuevamente.',
      confirmButtonColor: '#d33'
    });
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

  document.getElementById('contenidoReferencias').innerHTML = refHTML;

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
window.analizarExamen = analizarExamen;
window.guardarResultados = guardarResultados;
window.mostrarReferencias = mostrarReferencias;

// ================== SPA: Inicialización de la vista report ==================
function initReport() {
  // Limpiar tabla y paginación
  const tbody = document.getElementById('reportesTableBody');
  if (tbody) tbody.innerHTML = '';
  const paginacion = document.getElementById('paginacionReportes');
  if (paginacion) paginacion.innerHTML = '';
  paginaActualReport = 1;
  cargarReportes();
  // Reiniciar buscador
  const buscador = document.getElementById('buscadorReportes');
  if (buscador) buscador.value = '';
}
window.initReport = initReport;

// ================== SPA: Eliminar inicialización automática si es SPA ==================
if (!window.isSPA) {
  document.addEventListener('DOMContentLoaded', () => {
    cargarReportes();
    const buscador = document.getElementById('buscadorReportes');
    if (buscador) {
      buscador.addEventListener('input', () => {
        paginaActualReport = 1;
        aplicarFiltroYPaginacion();
      });
    }
  });
}

})();
