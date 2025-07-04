(() => {
let paginaActualPacientes = 1;
const registrosPorPaginaP = 5;

// 📌 Función para calcular la edad desde la fecha de nacimiento (solo para mostrar)
function calcularEdad() {
  const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
  if (fechaNacimiento) {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    // Muestra la edad solo como referencia (opcional)
    const edadInput = document.getElementById('edad');
    if (edadInput) edadInput.value = edad;

    return edad;
  }
  return null;
}

// Calcular edad al cambiar la fecha
document.getElementById('fecha_nacimiento').addEventListener('change', calcularEdad);
// ✅ Cargar pacientes desde el backend 
async function loadPatients() {
  const response = await fetch('http://localhost:3000/api/pacientes/patients');
  const data = await response.json();

  if (data.success) {
    const tableBody = document.getElementById('patientTableBody');
    tableBody.innerHTML = '';

    data.patients.forEach(patient => {
      const row = document.createElement('tr');
      row.setAttribute('data-patientid', patient.id); // ✅ necesario para eliminar y otros usos

      row.innerHTML = `
        <td class="text-sm text-center">${patient.cedula}</td>
        <td class="text-sm text-center">${patient.nombres}</td>
        <td class="text-sm text-center">${patient.apellidos}</td>
        <td class="text-sm text-center">${patient.sexo}</td>
        <td class="text-sm text-center">${patient.edad}</td>
        <td class="align-middle text-center">
        <div class="dropdown">
  <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuButton${patient.id}" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="material-icons">more_vert</i>
  </a>
  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuButton${patient.id}">
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verPaciente(${patient.id})">
        <i class="material-icons text-sm">visibility</i> Ver
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarPaciente(${patient.id})">
        <i class="material-icons text-sm">edit</i> Editar
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-eliminar-paciente" href="#" data-patientid="${patient.id}">
        <i class="material-icons text-sm">delete</i> Eliminar
      </a>
    </li>
  </ul>
</div>
</td>

      `;

      tableBody.appendChild(row);
    });

    aplicarFiltroYPaginar(); // ✅ Aplicar filtro y paginación al cargar
  } else {
    alert('Error al cargar los pacientes');
  }
}

// ✅ Cargar opciones de sexo
async function loadSexos() {
  const response = await fetch('http://localhost:3000/api/pacientes/sexos');
  const data = await response.json();

  if (data.success) {
    const sexoSelect = document.getElementById('sexo');
    sexoSelect.innerHTML = '';

    data.sexos.forEach(sexo => {
      const option = document.createElement('option');
      option.value = sexo.id;
      option.textContent = sexo.descripcion;
      sexoSelect.appendChild(option);
    });
  } else {
    alert('Error al cargar los sexos');
  }
}

// 🚀 Ejecutar al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  loadSexos();
});

// ✅ Enviar formulario nuevo paciente
document.getElementById('addPatientForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const edadCalculada = calcularEdad();
  if (!edadCalculada || edadCalculada < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se ha podido calcular la edad.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const datos = {
    cedula: document.getElementById('cedula').value,
    nombres: document.getElementById('nombres').value,
    apellidos: document.getElementById('apellidos').value,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    telefono: document.getElementById('telefono').value,
    correo: document.getElementById('correo').value,
    id_sexo: document.getElementById('sexo').value,
    diagnostico: document.getElementById('diagnostico').value
    // 🔥 No enviamos "edad" aquí, el backend la calcula
  };

  try {
    const response = await fetch('http://localhost:3000/api/pacientes/addPatient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Paciente agregado exitosamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
        modal.hide();
        document.getElementById('addPatientForm').reset();
        loadPatients(); // Recargar tabla
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'No se ha podido agregar el paciente.',
        confirmButtonText: 'Aceptar'
      });
    }
  } catch (error) {
    console.error('Error al agregar el paciente:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar'
    });
  }
});


// =================== Ver paciente ===================
async function verPaciente(id) {
  try {
    await cargarSexosEdit(); // ✅ Asegura cargar los sexos antes de mostrar el modal

    const response = await fetch(`http://localhost:3000/api/pacientes/${id}`);
    const data = await response.json();

    if (data.success) {
      const p = data.paciente;

      // Título del modal
      document.getElementById('viewEditPatientTitle').textContent = 'Información del Paciente';

      // Cargar datos en los campos del modal
      document.getElementById('edit_id_paciente').value = p.id;
      document.getElementById('edit_cedula').value = p.cedula;
      document.getElementById('edit_nombres').value = p.nombres;
      document.getElementById('edit_apellidos').value = p.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = p.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = p.telefono;
      document.getElementById('edit_correo').value = p.correo;
      document.getElementById('edit_diagnostico').value = p.diagnostico;
      document.getElementById('edit_sexo').value = p.id_sexo; // ⚠️ Asegúrate de que venga el id, no el texto

      // Deshabilitar campos (modo solo lectura)
      document.querySelectorAll('#editPatientForm input, #editPatientForm select').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'none';

      // Mostrar modal
      new bootstrap.Modal(document.getElementById('viewEditPatientModal')).show();
    } else {
      console.error('Paciente no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar paciente:', err);
  }
}

//EDITAR PACIENTE

async function editarPaciente(id) {
  try {
   await cargarSexosEdit(); // cargar opciones de sexo si es un <select>

    const response = await fetch(`http://localhost:3000/api/pacientes/${id}`);
    const data = await response.json();

    if (data.success) {
      const p = data.paciente;

      document.getElementById('viewEditPatientTitle').textContent = 'Actualizar';

      // Cargar datos en el formulario de edición
      document.getElementById('edit_id_paciente').value = p.id;
      document.getElementById('edit_cedula').value = p.cedula;
      document.getElementById('edit_nombres').value = p.nombres;
      document.getElementById('edit_apellidos').value = p.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = p.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = p.telefono;
      document.getElementById('edit_correo').value = p.correo;
      document.getElementById('edit_sexo').value = p.id_sexo;
      document.getElementById('edit_diagnostico').value = p.diagnostico;

      // Habilitar campos
      document.querySelectorAll('#editPatientForm input, #editPatientForm select').forEach(el => el.removeAttribute('disabled'));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'block';

      new bootstrap.Modal(document.getElementById('viewEditPatientModal')).show();
    } else {
      console.error('Paciente no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar paciente:', err);
  }
}

async function cargarSexosEdit() {
  try {
    const response = await fetch('http://localhost:3000/api/pacientes/sexos');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    if (data.success) {
      const selectSexo = document.getElementById('edit_sexo');
      selectSexo.innerHTML = '<option value="">Seleccione</option>';

      data.sexos.forEach(sexo => {
        const option = document.createElement('option');
        option.value = sexo.id;
        option.textContent = sexo.descripcion;
        selectSexo.appendChild(option);
      });
    } else {
      console.error('Error en la respuesta del servidor:', data.message);
    }

  } catch (error) {
    console.error('❌ Error al cargar los sexos para edición:', error);
  }
}

// =================== Guardar cambios del paciente ===================
document.getElementById('editPatientForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('edit_id_paciente').value;

  const datos = {
    cedula: document.getElementById('edit_cedula').value,
    nombres: document.getElementById('edit_nombres').value,
    apellidos: document.getElementById('edit_apellidos').value,
    fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
    telefono: document.getElementById('edit_telefono').value,
    correo: document.getElementById('edit_correo').value,
    id_sexo: document.getElementById('edit_sexo').value,
    diagnostico: document.getElementById('edit_diagnostico').value
  };

  const response = await fetch(`http://localhost:3000/api/pacientes/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  const result = await response.json();

  if (result.success) {
    await Swal.fire('¡Éxito!', 'Paciente actualizado correctamente.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewEditPatientModal')).hide();
    loadPatients(); // Recargar la tabla
  } else {
    Swal.fire('¡Error!', result.message || 'No se pudo actualizar el paciente.', 'error');
  }
});

// =================== Eliminar paciente con SweetAlert ===================
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-eliminar-paciente')) {
    e.preventDefault();
    const patientId = e.target.getAttribute('data-patientid');

    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el paciente permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/pacientes/delete/${patientId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          const fila = document.querySelector(`tr[data-patientid="${patientId}"]`);
          if (fila) fila.remove();

          await Swal.fire('Eliminado', result.message, 'success');
          loadPatients(); // Recargar tabla completa si prefieres
        } else {
          Swal.fire('Error', result.message || 'No se pudo eliminar el paciente.', 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Hubo un problema al intentar eliminar.', 'error');
      }
    }
  }
});


// =================== Filtro y paginación ===================v
function aplicarFiltroYPaginar() {
  const filtro = document.getElementById('buscadorPacientes').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#patientTableBody tr'));

  const filtradas = filas.filter(fila => {
    const cedula = fila.children[0]?.textContent.toLowerCase() || '';
    const nombre = fila.children[1]?.textContent.toLowerCase() || '';
    const apellido = fila.children[2]?.textContent.toLowerCase() || '';
    return cedula.includes(filtro) || nombre.includes(filtro) || apellido.includes(filtro);
  });

  const totalPaginas = Math.ceil(filtradas.length / registrosPorPaginaP);
  if (paginaActualPacientes > totalPaginas) paginaActualPacientes = 1;

  filas.forEach(fila => fila.style.display = 'none');

  const inicio = (paginaActualPacientes - 1) * registrosPorPaginaP;
  const fin = inicio + registrosPorPaginaP;
  filtradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  const paginacion = document.getElementById('paginacionPacientes');
  paginacion.innerHTML = '';

  const maxVisible = 3;
  let start = Math.max(1, paginaActualPacientes - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (paginaActualPacientes > 1) {
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '«';
    btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
    btnPrev.onclick = () => {
      paginaActualPacientes--;
      aplicarFiltroYPaginar();
    };
    paginacion.appendChild(btnPrev);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm mx-1 ${i === paginaActualPacientes ? 'btn-dark' : 'btn-outline-dark'}`;
    btn.textContent = i;
    btn.onclick = () => {
      paginaActualPacientes = i;
      aplicarFiltroYPaginar();
    };
    paginacion.appendChild(btn);
  }

  if (paginaActualPacientes < totalPaginas) {
    const btnNext = document.createElement('button');
    btnNext.textContent = '»';
    btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
    btnNext.onclick = () => {
      paginaActualPacientes++;
      aplicarFiltroYPaginar();
    };
    paginacion.appendChild(btnNext);
  }
}


function initPatient() {
  loadPatients();
  loadSexos();
}

  // Reinicia página actual y buscador
  paginaActualPacientes = 1;
  const buscador = document.getElementById('buscadorPacientes');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActualPacientes = 1;
      aplicarFiltroYPaginar();
    });
  }

  window.initPatient = initPatient; // Exporta solo la función que necesitas
     window.verPaciente = verPaciente;
   window.editarPaciente = editarPaciente;
})();