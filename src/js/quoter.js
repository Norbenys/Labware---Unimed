let examenesSeleccionados = [];
const jsPDF = window.jspdf?.jsPDF || window.jsPDF;

// ===================== 🔍 Buscar exámenes =====================
const inputBusqueda = document.getElementById("buscadorExamenesCotizador");
const dropdown = document.getElementById("dropdownResultadosCotizador");

if (inputBusqueda) {
  inputBusqueda.addEventListener("input", buscarExamenesCotizador);
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".position-relative")) {
    dropdown.innerHTML = '';
  }
});

async function buscarExamenesCotizador() {
  const valor = inputBusqueda.value.trim();

  if (valor.length < 2) {
    dropdown.innerHTML = '';
    return;
  }

  try {
    const res = await fetch('/api/cotizador/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busqueda: valor })
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const data = await res.json();
    dropdown.innerHTML = '';

    if (data.success && data.examenes.length > 0) {
      data.examenes.forEach(examen => {
        const li = document.createElement("li");
        li.className = "dropdown-item";
        li.style.cursor = "pointer";
        li.innerHTML = `${examen.nombre} <small class="text-muted">(${examen.codigo})</small>`;
        li.onclick = () => {
          agregarExamen(examen);
          inputBusqueda.value = '';
          dropdown.innerHTML = '';
        };
        dropdown.appendChild(li);
      });
    } else {
      dropdown.innerHTML = `<li class="dropdown-item text-muted">No se encontraron exámenes.</li>`;
    }
  } catch (error) {
    console.error("❌ Error al buscar examen:", error);
    dropdown.innerHTML = `<li class="dropdown-item text-danger">Error al buscar.</li>`;
  }
}

// ===================== ➕ Agregar examen =====================
function agregarExamen(examen) {
  const examenAdaptado = {
    id: Number(examen.id || examen.id_examen || 0),
    nombre: examen.nombre,
    codigo: examen.codigo,
    area: examen.area,
    precio: examen.precio,
    indicaciones: examen.indicaciones
  };

  if (!examenAdaptado.id) {
    console.warn("⚠️ Examen sin ID válido:", examen);
    return;
  }

  if (examenesSeleccionados.some(e => e.id === examenAdaptado.id)) return;

  examenesSeleccionados.push(examenAdaptado);
  renderizarTablaSeleccionados();
}

// ===================== 🧹 Eliminar examen =====================
function eliminarExamen(index) {
  examenesSeleccionados.splice(index, 1);
  renderizarTablaSeleccionados();
}

// ===================== 📋 Renderizar tabla =====================
function renderizarTablaSeleccionados() {
  const tabla = document.getElementById("tablaExamenesSeleccionados").querySelector("tbody");
  tabla.innerHTML = '';

  let total = 0;

  examenesSeleccionados.forEach((examen, index) => {
    total += parseFloat(examen.precio || 0);
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${examen.nombre}</td>
      <td>${examen.codigo}</td>
      <td>${examen.area}</td>
      <td>Bs. ${parseFloat(examen.precio).toFixed(2)}</td>
      <td>${examen.indicaciones || 'Sin indicaciones'}</td>
      <td class="text-center">
        <button class="btn btn-danger btn-sm" onclick="eliminarExamen(${index})">Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });

  const filaTotal = document.createElement("tr");
  filaTotal.classList.add("fila-total");
  filaTotal.innerHTML = `
    <td class="fw-bold text-muted">Total a pagar:</td>
    <td colspan="2"></td>
    <td class="fw-bold text-success">Bs. ${total.toFixed(2)}</td>
    <td colspan="2"></td>
  `;
  tabla.appendChild(filaTotal);
}


function limpiarCotizacion() {
  // Vaciar la tabla visual
  const tabla = document.querySelector("#tablaExamenesSeleccionados tbody");
  tabla.innerHTML = "";

  // Vaciar la lista de exámenes seleccionados
  examenesSeleccionados = [];

  // (Opcional) Notificación visual
  Toastify({
    text: "Cotización limpiada.",
    duration: 2000,
    gravity: "top",
    position: "right",
    backgroundColor: "#6c757d"
  }).showToast();
}


function imprimirCotizacion() {
  const img = new Image();
  img.src = '../assets/img/unimed_logo.jpg';

  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const logoBase64 = canvas.toDataURL("image/png");

    const doc = new jsPDF();
    const hoy = new Date();
    const fechaTexto = hoy.toLocaleDateString('es-CL');
    const horaTexto = hoy.toLocaleTimeString('es-CL').slice(0, 5);

    const logoWidth = 35;
    const logoHeight = logoWidth * (img.height / img.width);
    doc.addImage(logoBase64, 'PNG', 12, 10, logoWidth, logoHeight);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text("CLÍNICA UNIMED | CÉCULAS MADRE", 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Av. José María Lozada. Urb. Sabanamar. Porlamar - Venezuela", 105, 30, { align: 'center' });
    doc.text("Email: info@unimedsv.com | Tel: +58 295-2642301 / 2645367 / 2648115", 105, 35, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Fecha: ${fechaTexto}`, 195, 25, { align: 'right' });
    doc.text(`Hora: ${horaTexto}`, 195, 30, { align: 'right' });
    doc.text("Página: 1", 195, 35, { align: 'right' });

    // Línea verde
    doc.setDrawColor(167, 218, 1);
    doc.setLineWidth(2);
    doc.line(15, 45, 195, 45);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text("COTIZACIÓN DE EXÁMENES", 105, 55, { align: 'center' });

    const startY = 65;

    const tablaExamenes = examenesSeleccionados.map(e => [
      e.nombre,
      e.codigo,
      e.area,
      `Bs. ${parseFloat(e.precio).toFixed(2)}`,
      dividirEnLineas(e.indicaciones || '', 3) // 👈 Aquí dividimos en líneas de 3 palabras
    ]);

    const total = examenesSeleccionados.reduce((sum, e) => sum + parseFloat(e.precio), 0);

    tablaExamenes.push([
      { content: 'TOTAL A PAGAR:', colSpan: 4, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: `Bs. ${total.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 180, 20] } }
    ]);

    doc.autoTable({
      startY: startY,
      margin: { left: 15, right: 15 },
      head: [["Nombre", "Código", "Área", "Precio", "Indicaciones"]],
      body: tablaExamenes,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle',
        overflow: 'linebreak',
        lineColor: [180, 180, 180],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [167, 218, 1],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 50, halign: 'left' }
      }
    });
    doc.setFontSize(9);
doc.setTextColor(100);
doc.text("Importante: La vigencia de esta cotización es de tres días contados a partir de su fecha de emisión.", 105, 285, { align: "center" });


    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("UNIMED | Salud para la vida • @unimedsv", 105, 290, { align: "center" });

    const pdfBlob = doc.output('blob');
    const pdfURL = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfURL, '_blank');

    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
    };
  };
}

// 👇 Función para dividir texto en líneas de 3 palabras
function dividirEnLineas(texto, palabrasPorLinea = 3) {
  const palabras = texto.trim().split(/\s+/);
  const lineas = [];

  for (let i = 0; i < palabras.length; i += palabrasPorLinea) {
    lineas.push(palabras.slice(i, i + palabrasPorLinea).join(' '));
  }

  return lineas.join('\n'); // esto hace que el texto se muestre en múltiples líneas en una celda
}
