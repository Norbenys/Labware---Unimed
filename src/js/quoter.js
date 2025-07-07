(function() {
  let examenesSeleccionadosCotizador = [];
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

    if (examenesSeleccionadosCotizador.some(e => e.id === examenAdaptado.id)) return;

    examenesSeleccionadosCotizador.push(examenAdaptado);
    renderizarTablaSeleccionados();
  }

  // ===================== 🧹 Eliminar examen =====================
  function eliminarExamen(index) {
    examenesSeleccionadosCotizador.splice(index, 1);
    renderizarTablaSeleccionados();
  }

  // ===================== 📋 Renderizar tabla =====================
  function renderizarTablaSeleccionados() {
    const tabla = document.getElementById("tablaExamenesSeleccionados").querySelector("tbody");
    tabla.innerHTML = '';

    let total = 0;

    examenesSeleccionadosCotizador.forEach((examen, index) => {
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

    // Mostrar u ocultar el contenedor de la tabla según si hay exámenes seleccionados
    const contenedorTabla = document.getElementById('contenedorTablaCotizador');
    if (contenedorTabla) {
      if (examenesSeleccionadosCotizador.length > 0) {
        contenedorTabla.style.display = 'block';
      } else {
        contenedorTabla.style.display = 'none';
      }
    }
  }

  // ===================== 🧹 Limpiar cotización =====================
  window.limpiarCotizacion = function() {
    // Vaciar la tabla visual
    const tabla = document.querySelector("#tablaExamenesSeleccionados tbody");
    tabla.innerHTML = "";

    // Vaciar la lista de exámenes seleccionados
    examenesSeleccionadosCotizador = [];

    // (Opcional) Notificación visual
    Toastify({
      text: "Cotización limpiada.",
      duration: 2000,
      gravity: "top",
      position: "right",
      backgroundColor: "#6c757d"
    }).showToast();
  }

  // ===================== 🖨️ Imprimir cotización =====================
  window.imprimirCotizacion = function() {
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

      const tablaExamenes = examenesSeleccionadosCotizador.map(e => [
        e.nombre,
        e.codigo,
        e.area,
        `Bs. ${parseFloat(e.precio).toFixed(2)}`,
        dividirEnLineas(e.indicaciones || '', 3) // 👈 Aquí dividimos en líneas de 3 palabras
      ]);

      const total = examenesSeleccionadosCotizador.reduce((sum, e) => sum + parseFloat(e.precio), 0);

      tablaExamenes.push([
        { content: 'TOTAL A PAGAR:', colSpan: 4, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: `Bs. ${total.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]);

      doc.autoTable({
        head: [['Nombre', 'Código', 'Área', 'Precio', 'Indicaciones']],
        body: tablaExamenes,
        startY: startY,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 60 }
        },
        headStyles: {
          fillColor: [167, 218, 1],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Guardar PDF
      const nombreArchivo = `cotizacion_${Date.now()}.pdf`;
      doc.save(nombreArchivo);
    };
  }

  // ===================== 🔧 Función auxiliar =====================
  function dividirEnLineas(texto, palabrasPorLinea = 3) {
    if (!texto) return '';
    
    const palabras = texto.split(' ');
    const lineas = [];
    
    for (let i = 0; i < palabras.length; i += palabrasPorLinea) {
      lineas.push(palabras.slice(i, i + palabrasPorLinea).join(' '));
    }
    
    return lineas.join('\n');
  }

  // Hacer las funciones disponibles globalmente para los onclick
  window.eliminarExamen = eliminarExamen;
})();
