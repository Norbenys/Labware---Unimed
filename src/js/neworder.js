document.addEventListener('DOMContentLoaded', () => {
  const guardarBtn = document.getElementById("btnGuardarOrden");
  guardarBtn.addEventListener("click", async () => {
    console.log("✅ Botón clic detectado");
    // tu lógica...
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const fechaInput = document.getElementById('fecha_creacion');
  const horaInput = document.getElementById('hora_creacion');

  const ahora = new Date();

  // Obtener fecha local correctamente formateada (YYYY-MM-DD)
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  fechaInput.value = `${anio}-${mes}-${dia}`;

  // Obtener hora local (HH:mm)
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  horaInput.value = `${horas}:${minutos}`;
});




// ===================== neworder.js COMPLETO =====================

// Verificar si ya se cargó para evitar duplicados
if (window.neworderLoaded) {
  console.log("⚠️ neworder.js ya fue cargado, evitando duplicación");
} else {
  window.neworderLoaded = true;
  
  let idPacienteFinal = null;
  let examenesSeleccionados = [];

// ===================== DOMContentLoaded =====================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("newOrderForm");
  const clearBtn = document.getElementById("clearForm");
  console.log("✅ neworder.js conectado correctamente");

  // 📅 Calcular edad automáticamente
  document.getElementById('fecha_nacimiento').addEventListener('change', () => {
    const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
    if (fechaNacimiento) {
      const nacimiento = new Date(fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
      document.getElementById('edad').value = edad;
    }
  });

  // 🧼 Limpiar formulario
  clearBtn.addEventListener("click", () => {
    document.getElementById("newOrderForm").reset();
    document.getElementById("edad").value = '';
    examenesSeleccionados = [];
    actualizarTabla();
    idPacienteFinal = null;
  });
});
// ===================== Cargar sexos =====================

async function cargarSexos() {
  try {
    const res = await fetch('/api/pacientes/sexos');
    const data = await res.json();

    if (data.success && Array.isArray(data.sexos)) {
      const selectSexo = document.getElementById('sexo');
      selectSexo.innerHTML = '<option value="">Seleccione...</option>';
      data.sexos.forEach(sexo => {
        const option = document.createElement('option');
        option.value = sexo.id;
        option.textContent = sexo.descripcion;
        selectSexo.appendChild(option);
      });
    } else {
      console.warn('⚠️ No se pudieron cargar los sexos');
    }
  } catch (err) {
    console.error('❌ Error cargando sexos:', err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarSexos(); // Asegúrate de llamar esta función al cargar la vista
});

// ===================== 🔍 Buscar Pacientes =====================

document.getElementById("btnBuscarPaciente").addEventListener("click", async () => {
  const cedula = document.getElementById("cedula").value.trim();
  if (cedula.length < 6) {
    return Swal.fire({
      icon: 'warning',
      title: '¡Advertencia!',
      text: 'Ingresa una cédula válida.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }

  try {
    const res = await fetch('/api/pacientes/buscarCedula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula })
    });

    const data = await res.json();

    if (data.success && data.paciente) {
      const paciente = data.paciente;
      idPacienteFinal = paciente.id;

      const { isConfirmed } = await Swal.fire({
        title: 'Paciente encontrado',
        text: '¿Deseas cargar sus datos automáticamente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        customClass: { popup: 'swal-mover-derecha' }
      });

      if (isConfirmed) {
        document.getElementById("nombres").value = paciente.nombres || '';
        document.getElementById("apellidos").value = paciente.apellidos || '';
        document.getElementById("fecha_nacimiento").value = paciente.fecha_nacimiento?.split("T")[0] || '';
        document.getElementById("telefono").value = paciente.telefono || '';
        document.getElementById("correo").value = paciente.correo || '';
        document.getElementById("sexo").value = paciente.sexo || '';
        document.getElementById("diagnostico").value = paciente.diagnostico || '';
        // Asignar sexo de forma robusta
        const selectSexo = document.getElementById("sexo");
        let sexoValue = paciente.sexo ?? '';
        if (selectSexo) {
          let found = false;
          for (let i = 0; i < selectSexo.options.length; i++) {
            if (selectSexo.options[i].value == sexoValue) {
              selectSexo.selectedIndex = i;
              found = true;
              break;
            }
          }
          if (!found) selectSexo.selectedIndex = 0;
        }
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Información',
        text: data.message || 'Paciente no encontrado.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al buscar paciente.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});

// ===================== 🔍 Buscar Pacientes por Fecha =====================
document.getElementById("btnBuscarPorFecha").addEventListener("click", async () => {
  const fechaInput = document.getElementById("fecha_nacimiento");
  let fecha = fechaInput.value.trim();

  if (fecha.includes('/')) {
    const [dia, mes, anio] = fecha.split('/');
    fecha = `${anio}-${mes}-${dia}`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return Swal.fire({
      icon: 'warning',
      title: '¡Advertencia!',
      text: 'Fecha inválida. Usa el formato correcto.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }

  try {
    const res = await fetch('/api/pacientes/buscarPorFecha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_nacimiento: fecha })
    });

    const texto = await res.text();
    const data = JSON.parse(texto);

    if (data.success && data.pacientes.length > 0) {
      if (data.pacientes.length === 1) {
        const paciente = data.pacientes[0];
        const { isConfirmed } = await Swal.fire({
          title: 'Paciente encontrado',
          text: '¿Deseas cargar sus datos automáticamente?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí',
          cancelButtonText: 'No',
          customClass: { popup: 'swal-mover-derecha' }
        });
        if (isConfirmed) llenarFormularioPaciente(paciente);
      } else {
        const opciones = data.pacientes.map(p =>
          `${p.nombres} ${p.apellidos} - C.I: ${p.cedula || 'Sin cédula'}`
        );

        const { value: seleccionado } = await Swal.fire({
          title: 'Pacientes encontrados',
          input: 'select',
          inputOptions: opciones.reduce((acc, val, i) => {
            acc[i] = val;
            return acc;
          }, {}),
          inputPlaceholder: 'Selecciona un paciente',
          showCancelButton: true,
          customClass: { popup: 'swal-mover-derecha' }
        });

        if (seleccionado !== undefined && data.pacientes[seleccionado]) {
          const paciente = data.pacientes[seleccionado];
          const { isConfirmed } = await Swal.fire({
            title: 'Paciente seleccionado',
            text: '¿Deseas cargar sus datos automáticamente?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No',
            customClass: { popup: 'swal-mover-derecha' }
          });
          if (isConfirmed) llenarFormularioPaciente(paciente);
        }
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Información',
        text: 'No se encontraron pacientes con esa fecha.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error("❌ Error al buscar por fecha:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al buscar paciente por fecha.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});

// ===================== 📄 Llenar Formulario =====================
function llenarFormularioPaciente(paciente) {
  document.getElementById("cedula").value = paciente.cedula || '';
  document.getElementById("nombres").value = paciente.nombres || '';
  document.getElementById("apellidos").value = paciente.apellidos || '';
  document.getElementById("fecha_nacimiento").value = paciente.fecha_nacimiento?.split("T")[0] || '';
  document.getElementById("telefono").value = paciente.telefono || '';
  document.getElementById("correo").value = paciente.correo || '';
  document.getElementById("sexo").value = paciente.sexo || '';
  document.getElementById("diagnostico").value = paciente.diagnostico || '';
  
  // ✅ Esta es la línea correcta
  idPacienteFinal = paciente.id;
}


// ===================== 🔍 Buscar exámenes =====================


document.getElementById("buscadorNombreExamen").addEventListener("input", () => buscarExamenes('nombre'));
document.getElementById("buscadorCodigoExamen").addEventListener("input", () => buscarExamenes('codigo'));

document.addEventListener("click", (e) => {
  if (!e.target.closest(".position-relative")) {
    const dropdownNombre = document.getElementById("dropdownNombreResultados");
    const dropdownCodigo = document.getElementById("dropdownCodigoResultados");
    if (dropdownNombre) dropdownNombre.innerHTML = '';
    if (dropdownCodigo) dropdownCodigo.innerHTML = '';
  }
});

async function buscarExamenes(tipo) {
  const inputId = tipo === 'nombre' ? 'buscadorNombreExamen' : 'buscadorCodigoExamen';
  const dropdownId = tipo === 'nombre' ? 'dropdownNombreResultados' : 'dropdownCodigoResultados';

  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  
  if (!input || !dropdown) {
    console.warn("⚠️ Elementos de búsqueda no encontrados");
    return;
  }

  const valor = input.value.trim();

  if (valor.length < 2) {
    dropdown.innerHTML = '';
    return;
  }

  try {
    const res = await fetch('/api/examenes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: tipo === 'nombre' ? valor : '',
        codigo: tipo === 'codigo' ? valor : ''
      })
    });

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
          document.getElementById(inputId).value = '';
          dropdown.innerHTML = '';
        };
        dropdown.appendChild(li);
      });
    } else {
      dropdown.innerHTML = `<li class="dropdown-item text-muted">No se encontraron exámenes.</li>`;
    }
  } catch (error) {
    console.error("❌ Error al buscar examen:", error);
  }
}

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



function eliminarExamen(index) {
  examenesSeleccionados.splice(index, 1);
  renderizarTablaSeleccionados();
}

function renderizarTablaSeleccionados() {
  const tabla = document.getElementById("tablaExamenesSeleccionados");
  if (!tabla) {
    console.warn("⚠️ Tabla de exámenes no encontrada");
    return;
  }
  
  const tbody = tabla.querySelector("tbody");
  if (!tbody) {
    console.warn("⚠️ Tbody de tabla no encontrado");
    return;
  }
  
  tbody.innerHTML = '';

  let total = 0;

  examenesSeleccionados.forEach((examen, index) => {
    total += parseFloat(examen.precio);
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
    tbody.appendChild(fila);
  });

  // Agregar fila del total
  const filaTotal = document.createElement("tr");
  filaTotal.classList.add("fila-total");
  filaTotal.innerHTML = `
  <td class="fw-bold text-muted">Total a pagar:</td>
  <td colspan="2"></td>
  <td class="fw-bold text-success">Bs. ${total.toFixed(2)}</td>
  <td colspan="2"></td>
`;
  tbody.appendChild(filaTotal);

  // Mostrar u ocultar el contenedor de la tabla según si hay exámenes seleccionados
  const contenedorTabla = document.getElementById('contenedorTablaExamenes');
  if (contenedorTabla) {
    if (examenesSeleccionados.length > 0) {
      contenedorTabla.style.display = 'block';
    } else {
      contenedorTabla.style.display = 'none';
    }
  }
}

// ===================== CALCULAR EDAD =====================

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}


// ===================== CREAR ORDEN =====================

document.getElementById("btnGuardarOrden").addEventListener("click", async () => {
  if (examenesSeleccionados.length === 0) {
    return Swal.fire({
      icon: 'warning',
      title: '¡Advertencia!',
      text: 'Selecciona al menos un examen para crear la orden.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }

  let idPacienteUsar = idPacienteFinal;

  if (!idPacienteUsar) {
    const id_sexo = document.getElementById("sexo")?.value;
    if (!id_sexo) {
      return Swal.fire({
        icon: 'warning',
        title: '¡Advertencia!',
        text: 'Debes seleccionar un sexo válido.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }

    const paciente = {
      cedula: document.getElementById("cedula").value.trim(),
      nombres: document.getElementById("nombres").value.trim(),
      apellidos: document.getElementById("apellidos").value.trim(),
      fecha_nacimiento: document.getElementById("fecha_nacimiento").value,
      telefono: document.getElementById("telefono").value,
      correo: document.getElementById("correo").value,
      id_sexo: id_sexo,
      diagnostico: document.getElementById("diagnostico").value
    };

    try {
      const resPaciente = await fetch(`/api/pacientes/addPatient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paciente)
      });

      const dataPaciente = await resPaciente.json();
      if (!dataPaciente.success) throw new Error(dataPaciente.message);
      idPacienteUsar = dataPaciente.id_paciente;

    } catch (error) {
      console.error("❌ Error al guardar paciente:", error);
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al agregar el paciente.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  }

  try {
    const resOrden = await fetch('/api/nueva-orden/addOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_paciente: idPacienteUsar, id_doctor: idDoctorReferente || null })
    });

    const dataOrden = await resOrden.json();
    if (!dataOrden.success) throw new Error(dataOrden.message);
    const idOrden = dataOrden.id_orden;

    const idsExamenes = examenesSeleccionados
      .map(e => Number(e.id || e.id_examen || 0))
      .filter(id => Number.isInteger(id) && id > 0);

    if (!idsExamenes.length) throw new Error("No se detectaron exámenes válidos para asociar.");

    const resExamenes = await fetch('/api/nueva-orden/addExamenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_orden: idOrden, examenes: idsExamenes })
    });

    const dataExamenes = await resExamenes.json();
    if (!dataExamenes.success) throw new Error(dataExamenes.message);

    // Espera confirmación del usuario antes de generar PDF
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: `La orden fue registrada correctamente. Orden número: ${idOrden}`,
      confirmButtonText: 'Entendido',
      customClass: { popup: 'swal-mover-derecha' }
    }).then(() => {
      // =================== GENERAR PDF ELEGANTE =====================
      const img = new Image();
      img.src = '../assets/img/unimed_logo.jpg';

      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const logoBase64 = canvas.toDataURL("image/png");

        const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
        const doc = new jsPDF();

        const hoy = new Date();
        const fechaTexto = hoy.toLocaleDateString('es-CL');
        const horaTexto = hoy.toLocaleTimeString('es-CL').slice(0, 5);

        const logoWidth = 35;
        const logoHeight = logoWidth * (img.height / img.width);
        const logoY = 10;
        doc.addImage(logoBase64, 'PNG', 12, logoY, logoWidth, logoHeight);

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

        doc.setDrawColor(167, 218, 1);
        doc.setLineWidth(2);
        doc.line(15, 45, 195, 45);

        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text("ORDEN MÉDICA - INFORMACIÓN DEL PACIENTE", 105, 55, { align: 'center' });

        // Validar datos antes de imprimir en PDF
        const nombrePaciente = (document.getElementById("nombres")?.value || "") + " " + (document.getElementById("apellidos")?.value || "");
        const cedulaPaciente = document.getElementById("cedula")?.value || "-";
        const fechaNacimiento = document.getElementById("fecha_nacimiento")?.value || "";
        const edadPaciente = (fechaNacimiento ? calcularEdad(fechaNacimiento) : "-") + " años";
        const sexoSelect = document.getElementById("sexo");
        const sexoPaciente = sexoSelect && sexoSelect.selectedOptions.length > 0 ? sexoSelect.selectedOptions[0].text : "-";

        const lineaPaciente = `Nombre: ${nombrePaciente.trim() || "-"}   |   Cédula: ${cedulaPaciente}   |   Sexo: ${sexoPaciente}   |   Edad: ${edadPaciente}`;
        doc.text(lineaPaciente, 105, 61, { align: 'center' });

        const tablaStartY = 61 + 8 + 4;

        const tablaExamenes = examenesSeleccionados.map(e => [
          e.nombre,
          e.codigo,
          e.area,
          `Bs. ${parseFloat(e.precio).toFixed(2)}`
        ]);

        const total = examenesSeleccionados.reduce((sum, e) => sum + parseFloat(e.precio), 0);

        tablaExamenes.push([
          { content: 'TOTAL A PAGAR:', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
          { content: `Bs. ${total.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [167, 218, 1] } }
        ]);

        doc.autoTable({
          startY: tablaStartY,
          head: [["Nombre del examen", "Código", "Área", "Precio"]],
          body: tablaExamenes,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 2,
            valign: 'middle',
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
            0: { cellWidth: 70, halign: 'left' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 45, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' }
          }
        });

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("UNIMED | Salud para la vida •  @unimedsv", 105, 290, { align: "center" });

        doc.save(`orden_examen_numero_${idOrden}.pdf`);

        // Limpiar
        document.getElementById("newOrderForm")?.reset();
        examenesSeleccionados = [];
        idPacienteFinal = null;
        renderizarTablaSeleccionados();
      };
    });

  } catch (error) {
    console.error("❌ Error al crear orden:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Hubo un problema al crear la orden.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});

window.llenarFormularioPaciente = llenarFormularioPaciente;
window.agregarExamen = agregarExamen;
window.eliminarExamen = eliminarExamen;
window.renderizarTablaSeleccionados = renderizarTablaSeleccionados;
window.calcularEdad = calcularEdad;

function initNeworder() {
  // Asignar fecha de creación
  const fechaInput = document.getElementById('fecha_creacion');
  if (fechaInput) {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    fechaInput.value = `${anio}-${mes}-${dia}`;
  }
  // Asignar hora de creación
  const horaInput = document.getElementById('hora_creacion');
  if (horaInput) {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    horaInput.value = `${horas}:${minutos}`;
  }
  // Cargar sexos cada vez que se carga la vista
  cargarSexos();
}
window.initNeworder = initNeworder;
} // Cierre del bloque if (window.neworderLoaded)

// ===================== 🔍 Buscar Doctor Referente =====================
let idDoctorReferente = null;

const btnBuscarDoctor = document.getElementById("btnBuscarDoctor");
const inputDoctor = document.getElementById("doctor_referente");

// Crear contenedor para mostrar resultados
let contenedorResultadosDoctor = document.createElement('div');
contenedorResultadosDoctor.id = 'resultadosDoctor';
contenedorResultadosDoctor.style.position = 'relative';
contenedorResultadosDoctor.style.zIndex = '1000';
inputDoctor.parentNode.appendChild(contenedorResultadosDoctor);

btnBuscarDoctor.addEventListener("click", async () => {
  const nombre = inputDoctor.value.trim();
  idDoctorReferente = null;
  contenedorResultadosDoctor.innerHTML = '';
  if (nombre.length < 3) {
    return Swal.fire({
      icon: 'warning',
      title: '¡Advertencia!',
      text: 'Escribe al menos 3 letras del nombre o apellido del doctor.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
  try {
    const res = await fetch('/api/doctores/buscarNombre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.doctores) && data.doctores.length > 0) {
      if (data.doctores.length === 1) {
        // Solo un doctor encontrado
        idDoctorReferente = data.doctores[0].id;
        inputDoctor.value = data.doctores[0].nombre + ' ' + data.doctores[0].apellido;
        Swal.fire({
          icon: 'success',
          title: 'Doctor encontrado',
          text: 'Se seleccionó: ' + inputDoctor.value,
          customClass: { popup: 'swal-mover-derecha' }
        });
      } else {
        // Varios doctores encontrados, mostrar tabla
        let tabla = `<table class='table table-bordered table-sm bg-white' style='margin-top:5px;'>`;
        tabla += `<thead><tr><th>Nombre</th><th>Apellido</th><th>Especialidad</th><th>Seleccionar</th></tr></thead><tbody>`;
        data.doctores.forEach(doc => {
          tabla += `<tr><td>${doc.nombre}</td><td>${doc.apellido}</td><td>${doc.especialidad||''}</td><td><button class='btn btn-success btn-sm seleccionar-doctor' data-id='${doc.id}' data-nombre='${doc.nombre}' data-apellido='${doc.apellido}'>Elegir</button></td></tr>`;
        });
        tabla += `</tbody></table>`;
        contenedorResultadosDoctor.innerHTML = tabla;
        // Delegar evento para seleccionar doctor
        contenedorResultadosDoctor.querySelectorAll('.seleccionar-doctor').forEach(btn => {
          btn.addEventListener('click', function() {
            idDoctorReferente = this.getAttribute('data-id');
            inputDoctor.value = this.getAttribute('data-nombre') + ' ' + this.getAttribute('data-apellido');
            contenedorResultadosDoctor.innerHTML = '';
            Swal.fire({
              icon: 'success',
              title: 'Doctor seleccionado',
              text: inputDoctor.value,
              customClass: { popup: 'swal-mover-derecha' }
            });
          });
        });
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin resultados',
        text: 'No se encontró ningún doctor con ese nombre o apellido.',
        customClass: { popup: 'swal-mover-derecha' }
      });
    }
  } catch (error) {
    console.error("❌ Error buscando doctor:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al buscar doctor.',
      customClass: { popup: 'swal-mover-derecha' }
    });
  }
});
