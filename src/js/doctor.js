(() => {
let paginaActualD = 1;
const registrosPorPaginaD = 5;

// =================== Cargar especialidades ===================
async function cargarEspecialidades() {
  try {
    const response = await fetch('http://localhost:3000/api/doctores/especialidades');
    const data = await response.json();

    if (data.success) {
      const selectEspecialidad = document.getElementById('doctor_especialidad');
      selectEspecialidad.innerHTML = '';

      data.especialidades.forEach(especialidad => {
        const option = document.createElement('option');
        option.value = especialidad.id;
        option.textContent = especialidad.nombre; // ← Asegúrate que la propiedad sea 'nombre'
        selectEspecialidad.appendChild(option);
      });
    } else {
      console.error('Error al cargar las especialidades.');
    }
  } catch (err) {
    console.error('Error inesperado al cargar especialidades:', err);
  }
}

// =================== Cargar especialidades para el modal de editar/ver doctor ===================
async function cargarEspecialidadesEdit() {
  const response = await fetch('http://localhost:3000/api/doctores/especialidades');
  const data = await response.json();

  if (data.success) {
    const selectEspecialidad = document.getElementById('edit_especialidad');
    selectEspecialidad.innerHTML = '';
    data.especialidades.forEach(especialidad => {
      const option = document.createElement('option');
      option.value = especialidad.id;
      option.textContent = especialidad.nombre;
      selectEspecialidad.appendChild(option);
    });
  } else {
    console.error('Error al cargar las especialidades para edición.');
  }
}


// =================== Cargar doctores ===================
async function cargarDoctores() {
  try {
    const response = await fetch('http://localhost:3000/api/doctores');
    const data = await response.json();

    if (data.success) {
      const tableBody = document.getElementById('doctorTableBody');
      tableBody.innerHTML = '';

      data.doctors.forEach(doctor => {
        const fila = document.createElement('tr');
        fila.setAttribute('data-doctorid', doctor.id);
        fila.innerHTML = `
          <td class="text-sm text-center">${doctor.nombres}</td>
          <td class="text-sm text-center">${doctor.apellidos}</td>
          <td class="text-sm text-center">${doctor.especialidad}</td>
          <td class="text-sm text-center">${doctor.correo}</td>
          <td class="text-sm text-center">${doctor.telefono}</td>
          <td class="align-middle text-center">
         <div class="dropdown">
  <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuDoctor${doctor.id}" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="material-icons">more_vert</i>
  </a>
  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuDoctor${doctor.id}">
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verDoctor(${doctor.id})">
        <i class="material-icons text-sm">visibility</i> Ver
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarDoctor(${doctor.id})">
        <i class="material-icons text-sm">edit</i> Editar
      </a>
    </li>
    <li>
      <a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-eliminar-doctor" href="#" data-doctorid="${doctor.id}">
        <i class="material-icons text-sm">delete</i> Eliminar
      </a>
    </li>
  </ul>
</div>
</td>

        `;
        tableBody.appendChild(fila);
      });

      aplicarFiltroYPaginarDoctores(); // Si tienes paginación o filtro para doctores
    } else {
      console.error('Error al cargar los doctores.');
    }
  } catch (err) {
    console.error('Error inesperado al cargar doctores:', err);
  }
}


// =================== Ver doctor ===================
async function verDoctor(id) {
  try {
    await cargarEspecialidadesEdit();

    const response = await fetch(`http://localhost:3000/api/doctores/${id}`);
    const data = await response.json();

    if (data.success) {
      const d = data.doctor;

      // Título del modal
      document.getElementById('viewEditTitle').textContent = 'Información del Doctor';

      // Cargar datos
      document.getElementById('edit_id_doctor').value = d.id;
      document.getElementById('edit_cedula').value = d.cedula;
      document.getElementById('edit_nombres').value = d.nombres;
      document.getElementById('edit_apellidos').value = d.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = d.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = d.telefono;
      document.getElementById('edit_correo').value = d.correo;
      document.getElementById('edit_especialidad').value = d.id_especialidad;

      // Deshabilitar todos los campos
      document.querySelectorAll('#editDoctorForm input, #editDoctorForm select').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'none';

      new bootstrap.Modal(document.getElementById('viewEditDoctorModal')).show();
    } else {
      console.error('Doctor no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar doctor:', err);
  }
}

// =================== Editar doctor ===================
async function editarDoctor(id) {
  try {
    await cargarEspecialidadesEdit();

    const response = await fetch(`http://localhost:3000/api/doctores/${id}`);
    const data = await response.json();

    if (data.success) {
      const d = data.doctor;

      // Título del modal
      document.getElementById('viewEditTitle').textContent = 'Actualizar';

      // Cargar datos en el formulario
      document.getElementById('edit_id_doctor').value = d.id;
      document.getElementById('edit_cedula').value = d.cedula;
      document.getElementById('edit_nombres').value = d.nombres;
      document.getElementById('edit_apellidos').value = d.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = d.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = d.telefono;
      document.getElementById('edit_correo').value = d.correo;
      document.getElementById('edit_especialidad').value = d.id_especialidad;

      // Habilitar todos los campos
      document.querySelectorAll('#editDoctorForm input, #editDoctorForm select').forEach(el => el.removeAttribute('disabled'));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'block';

      // Mostrar modal
      new bootstrap.Modal(document.getElementById('viewEditDoctorModal')).show();
    } else {
      console.error('Doctor no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar doctor:', err);
  }
}
// =================== Guardar cambios del doctor ===================
document.getElementById('editDoctorForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('edit_id_doctor').value;

  const datos = {
    cedula: document.getElementById('edit_cedula').value,
    nombres: document.getElementById('edit_nombres').value,
    apellidos: document.getElementById('edit_apellidos').value,
    fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
    telefono: document.getElementById('edit_telefono').value,
    correo: document.getElementById('edit_correo').value,
    id_especialidad: document.getElementById('edit_especialidad').value
  };

  try {
    const response = await fetch(`http://localhost:3000/api/doctores/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Doctor actualizado correctamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewEditDoctorModal'));
        modal.hide();
        cargarDoctores(); // ✅ Refresca la tabla de doctores
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message || 'No se pudo actualizar el doctor.',
        confirmButtonText: 'Aceptar'
      });
    }
  } catch (error) {
    console.error('Error al actualizar el doctor:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar'
    });
  }
});

/// =================== Enviar formulario nuevo doctor ===================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addDoctorForm');
  if (!form) {
    console.error("❌ No se encontró el formulario 'addDoctorForm'");
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const datos = {
      cedula: document.getElementById('cedula').value,
      nombres: document.getElementById('nombres').value,
      apellidos: document.getElementById('apellidos').value,
      fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
      telefono: document.getElementById('telefono').value,
      correo: document.getElementById('correo').value,
        id_especialidad: document.getElementById('doctor_especialidad').value| ''
    };

    try {
      const response = await fetch('http://localhost:3000/api/doctores/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Doctor agregado correctamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          form.reset();
          const modal = bootstrap.Modal.getInstance(document.getElementById('addDoctorModal'));
          modal.hide();
          cargarDoctores(); // ✅ Actualiza la tabla de doctores
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo agregar el doctor.',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error al agregar el doctor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar'
      });
    }
  });
});


// ================= AL CARGAR LA PÁGINA =================
document.addEventListener('DOMContentLoaded', () => {
  cargarDoctores();
  cargarEspecialidades();
});

// =================== Eliminar doctor con SweetAlert ===================
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-eliminar-doctor')) {
    e.preventDefault();
    const doctorId = e.target.getAttribute('data-doctorid');

    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará al doctor permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/doctores/delete/${doctorId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // ❌ Eliminar directamente la fila del DOM
          const fila = document.querySelector(`tr[data-doctorid="${doctorId}"]`);
          if (fila) fila.remove();

          await Swal.fire('Eliminado', result.message, 'success');

          // ✅ Si deseas actualizar toda la tabla completa, descomenta esta línea:
          // cargarDoctores();
        } else {
          Swal.fire('Error', result.message || 'No se pudo eliminar el doctor.', 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Hubo un problema al intentar eliminar.', 'error');
      }
    }
  }
});

// =================== Filtrar y paginar doctores ===================
function aplicarFiltroYPaginarDoctores() {
  const filtro = document.getElementById('buscadorDoctores').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#doctorTableBody tr'));

  // Filtrar filas visibles
  const filasFiltradas = filas.filter(fila => {
    const nombre = fila.children[0]?.textContent.toLowerCase() || '';
    const apellido = fila.children[1]?.textContent.toLowerCase() || '';
    return nombre.includes(filtro) || apellido.includes(filtro);
  });

  // Calcular total de páginas
  const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPaginaD);
  if (paginaActualD > totalPaginas) paginaActualD = 1;

  // Ocultar todas las filas primero
  filas.forEach(fila => fila.style.display = 'none');

  // Mostrar solo las que correspondan en esta página
  const inicio = (paginaActualD - 1) * registrosPorPaginaD;
  const fin = inicio + registrosPorPaginaD;
  filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  // Crear los botones de paginación
  const contenedor = document.getElementById('paginacionDoctores');
  contenedor.innerHTML = '';

  const maxVisible = 3;
  let start = Math.max(1, paginaActualD - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (paginaActualD > 1) {
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '«';
    btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
    btnPrev.onclick = () => {
      paginaActualD--;
      aplicarFiltroYPaginarDoctores();
    };
    contenedor.appendChild(btnPrev);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm mx-1 ${i === paginaActualD ? 'btn-dark' : 'btn-outline-dark'}`;
    btn.textContent = i;
    btn.onclick = () => {
      paginaActualD = i;
      aplicarFiltroYPaginarDoctores();
    };
    contenedor.appendChild(btn);
  }

  if (paginaActualD < totalPaginas) {
    const btnNext = document.createElement('button');
    btnNext.textContent = '»';
    btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
    btnNext.onclick = () => {
      paginaActualD++;
      aplicarFiltroYPaginarDoctores();
    };
    contenedor.appendChild(btnNext);
  }
}


function initDoctor() {
  cargarDoctores();
  cargarEspecialidades();

  // Reinicia la página actual
  paginaActualD = 1;

  const buscador = document.getElementById('buscadorDoctores');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActualD = 1;
      aplicarFiltroYPaginarDoctores();
    });
  }
}

// ✅ Exportaciones globales necesarias para carga dinámica
window.initDoctor = initDoctor;
window.verDoctor = verDoctor;
window.editarDoctor = editarDoctor;
})();


