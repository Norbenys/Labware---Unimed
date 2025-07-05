(function() {
// ================== Variables globales ================== 
let remitidosGlobal = [];
let paginaActualRemitidos = 1;
const registrosPorPaginaRemitidos = 6;

// ================== Cargar datos al iniciar ==================
document.addEventListener('DOMContentLoaded', () => {
  cargarRemitidos();

  const buscador = document.getElementById('buscadorRemitidos');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActualRemitidos = 1;
      aplicarFiltroYPaginacion();
    });
  }
});


// ================== Cambiar estado a entregado ==================
async function marcarComoEntregada(idOrden) {
  try {
    const res = await fetch(`/api/remision/entregar/${idOrden}`, {
      method: 'PUT'
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({ icon: 'success', text: `Orden #${idOrden} marcada como entregada.` });
      cargarRemitidos();
    } else {
      throw new Error('No se pudo actualizar el estado.');
    }
  } catch (error) {
    console.error('Error al marcar como entregada:', error);
    Swal.fire({ icon: 'error', text: 'Error al actualizar la orden.' });
  }
}

// ================== Confirmar entrega manual ==================
function confirmarEntrega(idOrden) {
  Swal.fire({
    title: `¿La orden #${idOrden} ha sido entregada?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, entregar',
    cancelButtonText: 'No todavía'
  }).then(result => {
    if (result.isConfirmed) {
      marcarComoEntregada(idOrden);
    }
  });
}

// ================== Obtener remitidos ==================
async function cargarRemitidos() {
  try {
    const res = await fetch('/api/remision'); // 👈 Ruta específica de remisión
    const data = await res.json();

    if (!data.success) throw new Error('Error al obtener las órdenes remitidas.');

    remitidosGlobal = data.remitidos;
    console.log('Remitidos cargados:', remitidosGlobal);
    renderizarTabla(remitidosGlobal);
    aplicarFiltroYPaginacion();
  } catch (err) {
    console.error('Error al cargar remitidos:', err);
    Swal.fire({ icon: 'error', text: 'No se pudieron cargar las órdenes remitidas.' });
  }
}

function renderizarTabla(lista) {
  const tbody = document.getElementById('remitidosTableBody');
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
      <td class="text-center">
        <div class="dropdown">
          <a class="cursor-pointer text-secondary" id="dropdownRemision${item.id_orden}" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="material-icons">more_vert</i>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownRemision${item.id_orden}">
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="enviarWhatsApp(${item.id_orden}, '${paciente}', '${item.examen}')">
                <i class="material-icons text-dark" style="font-size: 16px;">send</i> Enviar
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="imprimirOrden(${item.id_orden})">
                <i class="material-icons text-dark" style="font-size: 16px;">print</i> Imprimir
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="exportarPDF(${item.id_orden})">
                <i class="material-icons text-dark" style="font-size: 16px;">picture_as_pdf</i> PDF
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="confirmarEntrega(${item.id_orden})">
                <i class="material-icons text-dark" style="font-size: 16px;">check_circle</i> Guardado
              </a>
            </li>
          </ul>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// ================== Filtro y paginación ==================
function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quita tildes
}

function aplicarFiltroYPaginacion() {
  const filtro = normalizar(document.getElementById('buscadorRemitidos').value.trim());

  // Filtrar datos
  const filtrados = remitidosGlobal.filter(item => {
    const cedula = normalizar(item.cedula?.toString() || '');
    const nombres = normalizar(item.nombres || '');
    const apellidos = normalizar(item.apellidos || '');
    const paciente = `${nombres} ${apellidos}`;
    const examen = normalizar(item.examen || '');
    const idOrden = normalizar(item.id_orden?.toString() || '');
    const fecha = normalizar(item.fecha?.split('T')[0] || '');
    const texto = `${cedula} ${nombres} ${apellidos} ${paciente} ${examen} ${idOrden} ${fecha}`;
    return texto.includes(filtro);
  });

  // Paginación
  const totalPaginas = Math.ceil(filtrados.length / registrosPorPaginaRemitidos);
  if (paginaActualRemitidos > totalPaginas) paginaActualRemitidos = 1;

  const inicio = (paginaActualRemitidos - 1) * registrosPorPaginaRemitidos;
  const fin = inicio + registrosPorPaginaRemitidos;
  const paginaActualData = filtrados.slice(inicio, fin);

  // Renderizar
  renderizarTabla(paginaActualData);

  // Crear paginación solo si hay más de una página
  const paginacion = document.getElementById('paginacionRemitidos');
  if (!paginacion) return;
  paginacion.innerHTML = '';

  if (totalPaginas > 1) {
    const maxVisible = 3;
    let start = Math.max(1, paginaActualRemitidos - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPaginas) {
      end = totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }

    if (paginaActualRemitidos > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.textContent = '«';
      btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
      btnPrev.onclick = () => {
        paginaActualRemitidos--;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnPrev);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm mx-1 ${i === paginaActualRemitidos ? 'btn-dark' : 'btn-outline-dark'}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaActualRemitidos = i;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btn);
    }

    if (paginaActualRemitidos < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.textContent = '»';
      btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
      btnNext.onclick = () => {
        paginaActualRemitidos++;
        aplicarFiltroYPaginacion();
      };
      paginacion.appendChild(btnNext);
    }
  }
}

document.getElementById('buscadorRemitidos').addEventListener('input', () => {
  paginaActualRemitidos = 1;
  aplicarFiltroYPaginacion();
});


// ================== Obtener detalle de orden ==================
async function obtenerDatosOrden(idOrden) {
  try {
    const res = await fetch(`/api/remision/${idOrden}`);
    const data = await res.json();
    if (!data.success) throw new Error('No se pudo obtener la información de la orden.');
    return data.data;
  } catch (error) {
    console.error('Error al obtener datos de la orden:', error);
    Swal.fire({ icon: 'error', text: 'Error al obtener los datos de la orden.' });
    return null;
  }
}

// ================== Exportar como PDF (estilo WhatsApp) ==================
async function exportarPDF(idOrden) {
  try {
    const datos = await obtenerDatosOrden(idOrden);
    if (!datos || datos.length === 0) return;

    const paciente = datos[0];
    const cuerpo = [];
    let examenActual = '';

    datos.forEach((item) => {
      if (item.examen !== examenActual) {
        examenActual = item.examen;
        cuerpo.push([
          { text: examenActual, colSpan: 5, bold: true, fillColor: '#f0f0f0', margin: [0, 5] }, {}, {}, {}, {}
        ]);
      }
      cuerpo.push([
        { text: item.parametro },
        { text: item.valor },
        { text: item.unidad_medida || '-' },
        { text: `${item.general_min ?? '-'} - ${item.general_max ?? '-'}` },
        { text: item.observacion || '-' }
      ]);
    });

    const img = new Image();
    img.src = '../assets/img/unimed_logo.jpg';

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const logoBase64 = canvas.toDataURL("image/png");

      const hoy = new Date();
      const fechaTexto = hoy.toLocaleDateString('es-CL');
      const horaTexto = hoy.toLocaleTimeString('es-CL').slice(0, 5);

      const docDefinition = {
        pageMargins: [40, 60, 40, 60],
        content: [
          // Encabezado
          {
            columns: [
              {
                image: logoBase64,
                width: 100,
                margin: [-7, -30, 0, 0]
              },
              {
                width: '*',
                alignment: 'center',
                stack: [
                  {
                    text: 'CLÍNICA UNIMED | CÉLULAS MADRE',
                    fontSize: 12,
                    bold: true,
                    color: '#000000'
                  },
                  { text: 'Av. José María Lozada. Urb. Sabanamar. Porlamar - Venezuela', style: 'contact' },
                  { text: 'Email: info@unimedsv.com | Tel: +58 295-2642301 / 2645367 / 2648115', style: 'contact' }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: `Fecha: ${fechaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Hora: ${horaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Página: 1`, alignment: 'right', style: 'tiny' }
                ]
              }
            ],
            margin: [0, 0, 0, 10]
          },

          // Línea divisoria
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 6, lineColor: '#A7DA01' }] },

          // Título
          { text: 'RESULTADOS DE LABORATORIO', style: 'sectionTitle' },

          // Datos del paciente
          {
            text: `Nombre: ${paciente.nombres} ${paciente.apellidos}   |   Cédula: ${paciente.cedula}   |   Sexo: ${paciente.sexo}   |   Edad: ${paciente.edad} años`,
            alignment: 'center',
            margin: [0, 5, 0, 15]
          },

          // Tabla de resultados
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: 'Parámetro', style: 'tableHeader' },
                  { text: 'Resultado', style: 'tableHeader' },
                  { text: 'Unidad', style: 'tableHeader' },
                  { text: 'Referencia', style: 'tableHeader' },
                  { text: 'Observación', style: 'tableHeader' }
                ],
                ...cuerpo
              ]
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 0 ? '#A7DA01' : null),
              hLineColor: '#ccc',
              vLineColor: '#ccc',
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3
            }
          },

          // Pie
          {
            text: 'UNIMED | Salud para la vida • @unimedsv',
            alignment: 'center',
            fontSize: 9,
            color: '#666',
            margin: [0, 30, 0, 0]
          }
        ],
        styles: {
          contact: { fontSize: 9 },
          tiny: { fontSize: 8 },
          sectionTitle: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
            margin: [0, 15, 0, 10]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#A7DA01',
            alignment: 'center'
          }
        },
        defaultStyle: {
          fontSize: 10
        }
      };

      const nombreArchivo = `${paciente.nombres}_${paciente.apellidos}_Orden_${paciente.id_orden}`.replace(/\s+/g, '_');
      pdfMake.createPdf(docDefinition).download(`${nombreArchivo}.pdf`);
    };
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el archivo PDF.' });
  }
}


// ================== Imprimir resultado ==================
async function imprimirOrden(idOrden) {
  try {
    const datos = await obtenerDatosOrden(idOrden);
    if (!datos || datos.length === 0) return;

    const paciente = datos[0];
    const cuerpo = [];
    let examenActual = '';

    datos.forEach((item) => {
      if (item.examen !== examenActual) {
        examenActual = item.examen;
        cuerpo.push([
          { text: examenActual, colSpan: 5, bold: true, fillColor: '#f0f0f0', margin: [0, 5] }, {}, {}, {}, {}
        ]);
      }
      cuerpo.push([
        { text: item.parametro },
        { text: item.valor },
        { text: item.unidad_medida || '-' },
        { text: `${item.general_min ?? '-'} - ${item.general_max ?? '-'}` },
        { text: item.observacion || '-' }
      ]);
    });

    const img = new Image();
    img.src = '../assets/img/unimed_logo.jpg';

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const logoBase64 = canvas.toDataURL("image/png");

      const hoy = new Date();
      const fechaTexto = hoy.toLocaleDateString('es-CL');
      const horaTexto = hoy.toLocaleTimeString('es-CL').slice(0, 5);

      const docDefinition = {
        pageMargins: [40, 60, 40, 60],
        content: [
          // Encabezado
          {
            columns: [
              {
                image: logoBase64,
                width: 100,
                margin: [-7, -30, 0, 0]
              },
              {
                width: '*',
                alignment: 'center',
                stack: [
                  {
                    text: 'CLÍNICA UNIMED | CÉLULAS MADRE',
                    fontSize: 12,
                    bold: true,
                    color: '#000000'
                  },
                  { text: 'Av. José María Lozada. Urb. Sabanamar. Porlamar - Venezuela', style: 'contact' },
                  { text: 'Email: info@unimedsv.com | Tel: +58 295-2642301 / 2645367 / 2648115', style: 'contact' }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: `Fecha: ${fechaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Hora: ${horaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Página: 1`, alignment: 'right', style: 'tiny' }
                ]
              }
            ],
            margin: [0, 0, 0, 10]
          },

          // Línea divisoria
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 6, lineColor: '#A7DA01' }] },

          // Título
          { text: 'RESULTADOS DE LABORATORIO', style: 'sectionTitle' },

          // Datos del paciente
          {
            text: `Nombre: ${paciente.nombres} ${paciente.apellidos}   |   Cédula: ${paciente.cedula}   |   Sexo: ${paciente.sexo}   |   Edad: ${paciente.edad} años`,
            alignment: 'center',
            margin: [0, 5, 0, 15]
          },

          // Tabla de resultados
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: 'Parámetro', style: 'tableHeader' },
                  { text: 'Resultado', style: 'tableHeader' },
                  { text: 'Unidad', style: 'tableHeader' },
                  { text: 'Referencia', style: 'tableHeader' },
                  { text: 'Observación', style: 'tableHeader' }
                ],
                ...cuerpo
              ]
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 0 ? '#A7DA01' : null),
              hLineColor: '#ccc',
              vLineColor: '#ccc',
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3
            }
          },

          // Pie
          {
            text: 'UNIMED | Salud para la vida • @unimedsv',
            alignment: 'center',
            fontSize: 9,
            color: '#666',
            margin: [0, 30, 0, 0]
          }
        ],
        styles: {
          contact: { fontSize: 9 },
          tiny: { fontSize: 8 },
          sectionTitle: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
            margin: [0, 15, 0, 10]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#A7DA01',
            alignment: 'center'
          }
        },
        defaultStyle: {
          fontSize: 10
        }
      };

      // Mostrar en ventana para imprimir
      pdfMake.createPdf(docDefinition).getBlob(blob => {
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        printWindow.onload = function () {
          printWindow.focus();
          printWindow.print();
        };
      });
    };
  } catch (error) {
    console.error('Error al imprimir:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar la impresión.' });
  }
}

// ================== Enviar resultado por WhatsApp con PDF subido ==================
async function enviarWhatsApp(idOrden, nombrePaciente, nombreExamen) {
  try {
    const datos = await obtenerDatosOrden(idOrden);
    if (!datos || datos.length === 0) return;

    const paciente = datos[0];
    const cuerpo = [];
    let examenActual = '';

    datos.forEach((item) => {
      if (item.examen !== examenActual) {
        examenActual = item.examen;
        cuerpo.push([
          { text: examenActual, colSpan: 5, bold: true, fillColor: '#f0f0f0', margin: [0, 5] }, {}, {}, {}, {}
        ]);
      }
      cuerpo.push([
        { text: item.parametro },
        { text: item.valor },
        { text: item.unidad_medida || '-' },
        { text: `${item.general_min ?? '-'} - ${item.general_max ?? '-'}` },
        { text: item.observacion || '-' }
      ]);
    });

    const img = new Image();
    img.src = '../assets/img/unimed_logo.jpg';

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const logoBase64 = canvas.toDataURL("image/png");

      const hoy = new Date();
      const fechaTexto = hoy.toLocaleDateString('es-CL');
      const horaTexto = hoy.toLocaleTimeString('es-CL').slice(0, 5);

      const docDefinition = {
        pageMargins: [40, 60, 40, 60],
        content: [
          // Encabezado con logo e información
          {
            columns: [
              {
                image: logoBase64,
                width: 100,
                margin: [-7, -30, 0, 0]

              },
              {
                width: '*',
                alignment: 'center',
                stack: [
                  {
                    text: 'CLÍNICA UNIMED | CÉLULAS MADRE',
                    fontSize: 12,
                    bold: true,
                    color: '#000000' // equivale a setTextColor(0)
                  },
                  { text: 'Av. José María Lozada. Urb. Sabanamar. Porlamar - Venezuela', style: 'contact' },
                  { text: 'Email: info@unimedsv.com | Tel: +58 295-2642301 / 2645367 / 2648115', style: 'contact' }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: `Fecha: ${fechaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Hora: ${horaTexto}`, alignment: 'right', style: 'tiny' },
                  { text: `Página: 1`, alignment: 'right', style: 'tiny' }
                ]
              }
            ],
            margin: [0, 0, 0, 10]
          },

          // Línea divisoria
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 6, lineColor: '#A7DA01' }] },

          // Título
          { text: 'RESULTADOS DE LABORATORIO', style: 'sectionTitle' },

          // Datos del paciente
          {
            text: `Nombre: ${paciente.nombres} ${paciente.apellidos}   |   Cédula: ${paciente.cedula}   |   Sexo: ${paciente.sexo}   |   Edad: ${paciente.edad} años`,
            alignment: 'center',
            margin: [0, 5, 0, 15]
          },

          // Tabla de resultados
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: 'Parámetro', style: 'tableHeader' },
                  { text: 'Resultado', style: 'tableHeader' },
                  { text: 'Unidad', style: 'tableHeader' },
                  { text: 'Referencia', style: 'tableHeader' },
                  { text: 'Observación', style: 'tableHeader' }
                ],
                ...cuerpo
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#A7DA01' : null;
              },
              hLineColor: '#ccc',
              vLineColor: '#ccc',
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3
            }
          },

          // Pie
          {
            text: 'UNIMED | Salud para la vida • @unimedsv',
            alignment: 'center',
            fontSize: 9,
            color: '#666',
            margin: [0, 30, 0, 0]
          }
        ],
        styles: {
          header: { fontSize: 12, bold: true },
          contact: { fontSize: 9 },
          tiny: { fontSize: 8 },
          sectionTitle: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
            margin: [0, 15, 0, 10]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#A7DA01',
            alignment: 'center'
          }
        },
        defaultStyle: {
          fontSize: 10
        }
      };

      const nombreArchivo = `${paciente.nombres}_${paciente.apellidos}_Orden_${paciente.id_orden}`.replace(/\s+/g, '_');
      pdfMake.createPdf(docDefinition).download(`${nombreArchivo}.pdf`);

      let numero = paciente.telefono.trim().replace(/^0/, '+58');
      const mensaje = `Buen día, ${paciente.nombres} ${paciente.apellidos}. Le enviamos sus resultados de sus exámenes de laboratorio realizados en la clínica UNIMED.`;

      Swal.fire({
        title: 'Enviar por WhatsApp',
        input: 'text',
        inputLabel: 'Número del paciente',
        inputValue: numero,
        confirmButtonText: 'Abrir WhatsApp',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed && result.value) {
          const numeroFinal = result.value.trim();
          const link = `https://wa.me/${numeroFinal.replace('+', '')}?text=${encodeURIComponent(mensaje)}`;
          window.open(link, '_blank');

          Swal.fire({
            icon: 'info',
            title: 'Adjunta el PDF',
            text: 'Se ha descargado el archivo PDF. Ahora puedes adjuntarlo manualmente en el chat de WhatsApp.',
            confirmButtonText: 'OK'
          });
        }
      });
    };
  } catch (error) {
    console.error('Error al generar y preparar el envío:', error);
    Swal.fire({ icon: 'error', text: 'No se pudo preparar el envío por WhatsApp.' });
  }
}

// ================== SPA: Exportar funciones globales ==================
window.confirmarEntrega = confirmarEntrega;
window.imprimirOrden = imprimirOrden;
window.exportarPDF = exportarPDF;
window.enviarWhatsApp = enviarWhatsApp;
window.marcarComoEntregada = marcarComoEntregada;

// ================== SPA: Inicialización de la vista remission ==================
function initRemission() {
  // Limpiar tabla y paginación
  const tbody = document.getElementById('remitidosTableBody');
  if (tbody) tbody.innerHTML = '';
  const paginacion = document.getElementById('paginacionRemitidos');
  if (paginacion) paginacion.innerHTML = '';
  paginaActualRemitidos = 1;
  cargarRemitidos();
  // Reiniciar buscador
  const buscador = document.getElementById('buscadorRemitidos');
  if (buscador) buscador.value = '';
}
window.initRemission = initRemission;

// ================== SPA: Eliminar inicialización automática si es SPA ==================
if (!window.isSPA) {
  document.addEventListener('DOMContentLoaded', () => {
    cargarRemitidos();
    const buscador = document.getElementById('buscadorRemitidos');
    if (buscador) {
      buscador.addEventListener('input', () => {
        paginaActualRemitidos = 1;
        aplicarFiltroYPaginacion();
      });
    }
  });
}

})();
